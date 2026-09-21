const express = require("express");

const router = express.Router();

const NotificationController =
    require("../controllers/notification.controller");

const authMiddleware =
    require("../middleware/auth.middleware");


/* ============================================================
   GET ALL NOTIFICATIONS
============================================================ */

router.get(
    "/",
    authMiddleware,
    NotificationController.getNotifications
);


/* ============================================================
   GET UNREAD NOTIFICATIONS
============================================================ */

router.get(
    "/unread",
    authMiddleware,
    NotificationController.getUnreadNotifications
);


/* ============================================================
   MARK SINGLE NOTIFICATION AS READ
============================================================ */

router.patch(
    "/:id/read",
    authMiddleware,
    NotificationController.markAsRead
);


/* ============================================================
   MARK ALL NOTIFICATIONS AS READ
============================================================ */

router.patch(
    "/read-all",
    authMiddleware,
    NotificationController.markAllAsRead
);


/* ============================================================
   DELETE SINGLE NOTIFICATION
============================================================ */

router.delete(
    "/:id",
    authMiddleware,
    NotificationController.deleteNotification
);


/* ============================================================
   DELETE ALL NOTIFICATIONS
============================================================ */

router.delete(
    "/",
    authMiddleware,
    NotificationController.deleteAllNotifications
);


module.exports = router;