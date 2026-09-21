const express = require("express");

const router = express.Router();

const DashboardController =
    require("../controllers/dashboard.controller");

const authMiddleware =
    require("../middleware/auth.middleware");


/* ============================================================
   PUBLIC LANDING SUMMARY
============================================================ */

router.get(
    "/public",
    DashboardController.getPublicSummary
);

/* ============================================================
   ADMIN DASHBOARD
============================================================ */

router.get(
    "/admin",
    authMiddleware,
    DashboardController.getAdminDashboard
);


module.exports = router;