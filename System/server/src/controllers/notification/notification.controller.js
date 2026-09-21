const NotificationService =
    require("../../services/notification/notification.service");

class NotificationController {

    /* ============================================================
       GET USER NOTIFICATIONS
    ============================================================ */

    static async getNotifications(req, res) {

        try {

            const notifications =
                await NotificationService.getUserNotifications(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                data: notifications

            });

        } catch (error) {

            console.error(
                "❌ Get Notifications Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       GET UNREAD NOTIFICATIONS
    ============================================================ */

    static async getUnreadNotifications(req, res) {

        try {

            const notifications =
                await NotificationService.getUnreadNotifications(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                data: notifications

            });

        } catch (error) {

            console.error(
                "❌ Get Unread Notifications Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       GET UNREAD COUNT
    ============================================================ */

    static async getUnreadCount(req, res) {

        try {

            const notifications =
                await NotificationService.getUnreadNotifications(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                data: {

                    count:
                        notifications.length

                }

            });

        } catch (error) {

            console.error(
                "❌ Notification Count Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       MARK AS READ
    ============================================================ */

    static async markAsRead(req, res) {

        try {

            const notification =
                await NotificationService.markAsRead(
                    req.params.id,
                    req.user.clerkId
                );

            if (!notification) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Notification not found"

                });

            }

            return res.status(200).json({

                success: true,

                message:
                    "Notification marked as read",

                data:
                    notification

            });

        } catch (error) {

            console.error(
                "❌ Mark Notification Read Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       MARK ALL AS READ
    ============================================================ */

    static async markAllAsRead(req, res) {

        try {

            const result =
                await NotificationService.markAllAsRead(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                data: result

            });

        } catch (error) {

            console.error(
                "❌ Mark All Notifications Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       DELETE NOTIFICATION
    ============================================================ */

    static async deleteNotification(req, res) {

        try {

            const notification =
                await NotificationService.deleteNotification(
                    req.params.id,
                    req.user.clerkId
                );

            if (!notification) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Notification not found"

                });

            }

            return res.status(200).json({

                success: true,

                message:
                    "Notification deleted successfully"

            });

        } catch (error) {

            console.error(
                "❌ Delete Notification Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       DELETE ALL NOTIFICATIONS
    ============================================================ */

    static async deleteAllNotifications(req, res) {

        try {

            const result =
                await NotificationService.deleteAllNotifications(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                message:
                    "All notifications deleted successfully",

                data: {

                    deletedCount:
                        result.deletedCount

                }

            });

        } catch (error) {

            console.error(
                "❌ Delete All Notifications Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }

}


module.exports =
    NotificationController;