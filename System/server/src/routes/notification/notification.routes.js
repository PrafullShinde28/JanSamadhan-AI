const express =
    require("express");

const router =
    express.Router();

const NotificationController =
    require("../../controllers/notification/notification.controller");

const devAuthMiddleware =
    require("../../middleware/devAuth.middleware");


/* ============================================================
   GET ALL NOTIFICATIONS
============================================================ */

router.get(
    "/",
    devAuthMiddleware,
    NotificationController.getNotifications
);


/* ============================================================
   GET UNREAD NOTIFICATIONS
============================================================ */

router.get(
    "/unread",
    devAuthMiddleware,
    NotificationController.getUnreadNotifications
);


/* ============================================================
   GET UNREAD COUNT
============================================================ */

router.get(
    "/unread-count",
    devAuthMiddleware,
    NotificationController.getUnreadCount
);


/* ============================================================
   MARK ALL AS READ
============================================================ */

router.patch(
    "/read-all",
    devAuthMiddleware,
    NotificationController.markAllAsRead
);


/* ============================================================
   MARK ONE AS READ
============================================================ */

router.patch(
    "/:id/read",
    devAuthMiddleware,
    NotificationController.markAsRead
);


/* ============================================================
   DELETE ALL
============================================================ */

router.delete(
    "/",
    devAuthMiddleware,
    NotificationController.deleteAllNotifications
);


/* ============================================================
   DELETE ONE
============================================================ */

router.delete(
    "/:id",
    devAuthMiddleware,
    NotificationController.deleteNotification
);


module.exports =
    router;