const NotificationService = require("../services/notification/notification.service");

class NotificationController {

    /* ============================================================
       GET ALL NOTIFICATIONS
    ============================================================ */

    static async getNotifications(req, res, next) {

        try {

            const notifications =
                await NotificationService.getUserNotifications(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                count: notifications.length,

                data: notifications

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       GET UNREAD NOTIFICATIONS
    ============================================================ */

    static async getUnreadNotifications(req, res, next) {

        try {

            const notifications =
                await NotificationService.getUnreadNotifications(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                count: notifications.length,

                data: notifications

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       MARK SINGLE NOTIFICATION AS READ
    ============================================================ */

    static async markAsRead(req, res, next) {

        try {

            const notification =
                await NotificationService.markAsRead(
                    req.params.id
                );

            return res.status(200).json({

                success: true,

                message: "Notification marked as read.",

                data: notification

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       MARK ALL NOTIFICATIONS AS READ
    ============================================================ */

    static async markAllAsRead(req, res, next) {

        try {

            const result =
                await NotificationService.markAllAsRead(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                message: result.message

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       DELETE SINGLE NOTIFICATION
    ============================================================ */

    static async deleteNotification(req, res, next) {

        try {

            await NotificationService.deleteNotification(
                req.params.id
            );

            return res.status(200).json({

                success: true,

                message: "Notification deleted successfully."

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       DELETE ALL NOTIFICATIONS
    ============================================================ */

    static async deleteAllNotifications(req, res, next) {

        try {

            await NotificationService.deleteAllNotifications(
                req.user.clerkId
            );

            return res.status(200).json({

                success: true,

                message: "All notifications deleted successfully."

            });

        } catch (error) {

            next(error);

        }

    }

}

module.exports = NotificationController;