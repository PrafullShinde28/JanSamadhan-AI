const User = require("../models/User");

const devAuthMiddleware = async (req, res, next) => {
    try {
        const clerkId = req.get("X-Dev-Clerk-Id");

        console.log("\n====================================");
        console.log("🔐 DEV AUTH DEBUG");
        console.log("Received Clerk ID:", clerkId);
        console.log("Database:", User.db.name);
        console.log("Collection:", User.collection.name);

        if (!clerkId) {
            return res.status(401).json({
                success: false,
                message: "X-Dev-Clerk-Id header is required."
            });
        }

        const user = await User.findOne({
            clerkId: clerkId.trim()
        });

        if (!user) {

            console.log("❌ USER NOT FOUND");
            console.log("Available users:");

            const users = await User.find({})
                .select("clerkId email role");

            users.forEach((u) => {
                console.log({
                    clerkId: u.clerkId,
                    email: u.email,
                    role: u.role
                });
            });

            console.log("====================================\n");

            return res.status(401).json({
                success: false,
                message: "Development user not found in MongoDB.",
                requestedClerkId: clerkId
            });
        }

        if (user.status !== "Active") {
            console.log("❌ USER IS INACTIVE/SUSPENDED:", user.status);
            console.log("====================================\n");
            return res.status(403).json({
                success: false,
                message: "Account is suspended or inactive."
            });
        }

        console.log("✅ USER FOUND");
        console.log("MongoDB ID:", user._id);
        console.log("Clerk ID:", user.clerkId);
        console.log("Email:", user.email);
        console.log("Role:", user.role);
        console.log("====================================\n");

        req.user = user;

        next();

    } catch (error) {

        console.error("❌ Dev Auth Error:", error);

        next(error);
    }
};

module.exports = devAuthMiddleware;