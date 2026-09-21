require("dotenv").config();
const express = require("express");
const { clerkMiddleware } = require("@clerk/express");
const http = require("http");
const cors = require("cors");
const path = require("path");

// Database
const connectDB = require("./config/db");
const { isOriginAllowed } = require("./utils/cors.util");

// Logger
const logger = require("./config/logger");
const requestLogger = require("./middleware/requestLogger");

// Security
const security = require("./config/security");

// Swagger
const swagger = require("./docs/swagger");

// Socket
const { initializeSocket } = require("./socket/socket");

// Scheduler
const initializeScheduler = require("./scheduler/scheduler");

// ===================== Routes =====================
const complaintRoutes = require("./routes/complaint.routes");
const dashboardRoutes = require("./routes/dashboard.routes");
const analyticsRoutes = require("./routes/analytics.routes");
const reportRoutes = require("./routes/report.routes");
const healthRoutes = require("./routes/health.routes");
require("./workers/ai.worker");

// ================= Middleware =====================
const notFound = require("./middleware/notFound.middleware");
const errorHandler = require("./middleware/error.middleware");
const workerRoutes = require("./routes/worker/worker.routes");
const citizenRoutes = require("./routes/citizen/citizen.routes");
const adminRoutes = require("./routes/admin/admin.routes");
const notificationRoutes = require("./routes/notification/notification.routes");
const authRoutes = require("./routes/auth.routes");

const app = express();
const server = http.createServer(app);

// ==================================================
// Socket.IO
// ==================================================
initializeSocket(server);

// ==================================================
// Security Middleware
// ==================================================
security(app);

// ==================================================
// General Middleware
// ==================================================
app.use(clerkMiddleware());

// CORS configuration supporting localhost and LAN IPs with credentials
app.use(cors({
    origin: (origin, callback) => {
        if (isOriginAllowed(origin)) {
            callback(null, true);
        } else {
            callback(null, true);
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Dev-Clerk-Id"]
}));

app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({
    extended: true,
    limit: "20mb"
}));
app.use(requestLogger);

// Static Files
app.use(
    "/uploads",
    express.static(path.join(__dirname, "../uploads"))
);

// ==================================================
// Swagger Documentation
// ==================================================
swagger(app);

// ==================================================
// API Routes
// ==================================================
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "🚀 Civic Issue Reporting Backend Running",
        version: "1.0.0"
    });
});

app.use("/health", healthRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/reports", reportRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/worker", workerRoutes);
app.use("/api/citizen", citizenRoutes);
app.use("/api/admin", adminRoutes);

// ==================================================
// Error Handling
// ==================================================
app.use(notFound);
app.use(errorHandler);

// ==================================================
// Server
// ==================================================
const PORT = process.env.PORT || 5000;

connectDB()
    .then(() => {
        initializeScheduler();

        server.listen(PORT, "0.0.0.0", () => {
            logger.info(`🚀 Server running on port ${PORT} (0.0.0.0)`);
            console.log(`🚀 Server running on http://localhost:${PORT}`);
            console.log(`📡 LAN Access: http://192.168.142.104:${PORT} (or your machine LAN IP)`);
            console.log(`📚 Swagger Docs: http://localhost:${PORT}/api/docs`);
        });
    })
    .catch((err) => {
        logger.error("Failed to connect to database", err);
        process.exit(1);
    });

// ==================================================
// Graceful Shutdown
// ==================================================
process.on("SIGINT", () => {
    logger.info("SIGINT Received");
    server.close(() => {
        logger.info("Server Closed");
        process.exit(0);
    });
});

process.on("SIGTERM", () => {
    logger.info("SIGTERM Received");
    server.close(() => {
        logger.info("Server Closed");
        process.exit(0);
    });
});

process.on("uncaughtException", (err) => {
    logger.error(err);
});

process.on("unhandledRejection", (err) => {
    logger.error(err);
});
