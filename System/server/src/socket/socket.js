const { Server } = require("socket.io");
const User = require("../models/User");
const { isOriginAllowed } = require("../utils/cors.util");

let io;
const activeConnections = new Map(); // Map<clerkId, Set<socketId>>

const initializeSocket = (server) => {

    io = new Server(server, {
        cors: {
            origin: (origin, callback) => {
                if (isOriginAllowed(origin)) {
                    callback(null, true);
                } else {
                    callback(null, true);
                }
            },
            credentials: true
        }
    });

    io.on("connection", (socket) => {

        console.log(`Socket Connected : ${socket.id}`);

        /* =============================================
           JOIN USER ROOM
        ============================================== */

        socket.on("join", async (clerkId) => {
            if (!clerkId) return;

            try {
                const user = await User.findOne({ clerkId });
                if (user) {
                    socket.join(clerkId);
                    socket.clerkId = clerkId;
                    
                    // Track active socket IDs per clerkId
                    if (!activeConnections.has(clerkId)) {
                        activeConnections.set(clerkId, new Set());
                    }
                    activeConnections.get(clerkId).add(socket.id);
                    
                    // If worker was marked Offline, restore to Available when they actively connect
                    if (user.role === "Worker" && user.availability === "Offline") {
                        user.availability = "Available";
                    }

                    user.isOnline = true;
                    user.lastSeenAt = new Date();
                    await user.save();
                    
                    console.log(`User ${clerkId} (${user.role}) joined socket ${socket.id}. Active count: ${activeConnections.get(clerkId).size}`);
                    io.emit("presence-updated", { clerkId, isOnline: true });
                    io.emit("worker-availability-updated", {
                        workerId: user._id,
                        clerkId: user.clerkId,
                        availability: user.availability
                    });
                } else {
                    console.log(`User query failed for join: ${clerkId}`);
                }
            } catch (err) {
                console.error("Socket join error:", err);
            }
        });

        /* =============================================
           LEAVE ROOM
        ============================================== */

        socket.on("leave", async (clerkId) => {
            if (!clerkId) return;
            
            try {
                socket.leave(clerkId);
                console.log(`User ${clerkId} left socket ${socket.id}`);
                
                if (activeConnections.has(clerkId)) {
                    activeConnections.get(clerkId).delete(socket.id);
                    if (activeConnections.get(clerkId).size === 0) {
                        activeConnections.delete(clerkId);
                        
                        const user = await User.findOne({ clerkId });
                        if (user) {
                            user.isOnline = false;
                            user.lastSeenAt = new Date();
                            await user.save();
                            io.emit("presence-updated", { clerkId, isOnline: false });
                        }
                    }
                }
            } catch (err) {
                console.error("Socket leave error:", err);
            }
        });

        /* =============================================
           WORKER LOCATION UPDATE
        ============================================== */

        socket.on("worker-location", async (data) => {
            // Emit to other observers
            io.emit("worker-location-update", data);

            // Dynamically persist location heartbeat in DB for online workers
            if (socket.clerkId && data?.latitude && data?.longitude) {
                try {
                    const user = await User.findOne({ clerkId: socket.clerkId });
                    if (user && user.role === "Worker") {
                        user.liveLocation = {
                            type: "Point",
                            coordinates: [Number(data.longitude), Number(data.latitude)],
                            address: data.address || user.liveLocation?.address || "Live Location Updates",
                            lastUpdated: new Date()
                        };
                        
                        // Self-healing availability check if they are operationally Offline due to stale location cron
                        let availabilityChanged = false;
                        if (user.availability === "Offline") {
                            user.availability = "Available";
                            availabilityChanged = true;
                        }
                        
                        await user.save();
                        console.log(`Heartbeat liveLocation updated in MongoDB for worker ${socket.clerkId}`);

                        if (availabilityChanged) {
                            io.emit("worker-availability-updated", {
                                workerId: user._id,
                                clerkId: user.clerkId,
                                availability: user.availability
                            });
                        }
                    }
                } catch (err) {
                    console.error("Failed to save worker location updates from socket event:", err);
                }
            }
        });

        /* =============================================
           DISCONNECT
        ============================================== */

        socket.on("disconnect", async () => {
            console.log(`Disconnected : ${socket.id}`);
            
            if (socket.clerkId) {
                const clerkId = socket.clerkId;
                try {
                    if (activeConnections.has(clerkId)) {
                        activeConnections.get(clerkId).delete(socket.id);
                        console.log(`Removed socket ${socket.id} from ${clerkId}. Active connections remaining: ${activeConnections.get(clerkId).size}`);
                        
                        if (activeConnections.get(clerkId).size === 0) {
                            activeConnections.delete(clerkId);
                            
                            const user = await User.findOne({ clerkId });
                            if (user) {
                                user.isOnline = false;
                                user.lastSeenAt = new Date();
                                await user.save();
                                console.log(`All sockets disconnected. Marked ${clerkId} offline.`);
                                io.emit("presence-updated", { clerkId, isOnline: false });
                            }
                        }
                    }
                } catch (err) {
                    console.error("Socket disconnect presence update failed:", err);
                }
            }
        });

    });

};

const getIO = () => {

    if (!io) {

        throw new Error("Socket.io not initialized");

    }

    return io;

};

module.exports = {

    initializeSocket,

    getIO

};