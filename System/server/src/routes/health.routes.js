const express = require("express");

const router = express.Router();

const HealthController = require("../controllers/health.controller");

// Health Check
router.get("/", HealthController.health);

// Readiness Check
router.get("/ready", HealthController.ready);

// Liveness Check
router.get("/live", HealthController.live);

// Version
router.get("/version", HealthController.version);

module.exports = router;