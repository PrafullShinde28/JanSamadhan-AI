const Notification =
    require("../../models/Notification");

const SocketHandler =
    require("../../socket/socketHandler");


class NotificationService {


    /* ============================================================
       SEND NOTIFICATION
    ============================================================ */

    static async send({

        recipient,

        recipientClerkId,

        complaint = null,

        timeline = null,

        title,

        message,

        type,

        priority = "Medium",

        actionUrl = "",

        icon = "",

        metadata = {}

    }) {

        if (!recipient) {

            throw new Error(
                "Notification recipient is required"
            );

        }

        if (!recipientClerkId) {

            throw new Error(
                "Recipient Clerk ID is required"
            );

        }

        if (!title) {

            throw new Error(
                "Notification title is required"
            );

        }

        if (!message) {

            throw new Error(
                "Notification message is required"
            );

        }


        /* ========================================================
           CREATE DATABASE NOTIFICATION
        ======================================================== */

        const notification =
            await Notification.create({

                recipient,

                recipientClerkId,

                complaint,

                timeline,

                title,

                message,

                type,

                priority,

                actionUrl,

                icon,

                metadata

            });


        /* ========================================================
           REAL-TIME SOCKET NOTIFICATION
        ======================================================== */

        try {
            SocketHandler.emitNotification({
                id: notification._id,
                recipient,
                recipientClerkId,
                complaint,
                timeline,
                title,
                message,
                type,
                priority,
                actionUrl,
                icon,
                metadata,
                createdAt: notification.createdAt,
                isRead: notification.isRead
            });
        } catch (socketErr) {
            console.warn("⚠️ Real-time socket notification broadcast skipped:", socketErr.message);
        }

        return notification;

    }


    /* ============================================================
       GET USER NOTIFICATIONS
    ============================================================ */

    static async getUserNotifications(
        clerkId
    ) {

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        return Notification.find({

            recipientClerkId:
                clerkId

        })

        .sort({

            createdAt: -1

        });

    }


    /* ============================================================
       GET UNREAD NOTIFICATIONS
    ============================================================ */

    static async getUnreadNotifications(
        clerkId
    ) {

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        return Notification.find({

            recipientClerkId:
                clerkId,

            isRead:
                false

        })

        .sort({

            createdAt: -1

        });

    }


    /* ============================================================
       GET UNREAD COUNT
    ============================================================ */

    static async getUnreadCount(
        clerkId
    ) {

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        return Notification.countDocuments({

            recipientClerkId:
                clerkId,

            isRead:
                false

        });

    }


    /* ============================================================
       MARK ONE NOTIFICATION AS READ
    ============================================================ */

    static async markAsRead(
        notificationId,
        clerkId
    ) {

        if (!notificationId) {

            throw new Error(
                "Notification ID is required"
            );

        }

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        /* ========================================================
           OWNERSHIP CHECK
        ======================================================== */

        const notification =
            await Notification.findOne({

                _id:
                    notificationId,

                recipientClerkId:
                    clerkId

            });


        if (!notification) {

            throw new Error(
                "Notification not found"
            );

        }


        notification.isRead =
            true;

        notification.readAt =
            new Date();


        await notification.save();


        return notification;

    }


    /* ============================================================
       MARK ALL USER NOTIFICATIONS AS READ
    ============================================================ */

    static async markAllAsRead(
        clerkId
    ) {

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        return Notification.updateMany(

            {

                recipientClerkId:
                    clerkId,

                isRead:
                    false

            },

            {

                $set: {

                    isRead:
                        true,

                    readAt:
                        new Date()

                }

            }

        );

    }


    /* ============================================================
       DELETE ONE NOTIFICATION
    ============================================================ */

    static async deleteNotification(
        notificationId,
        clerkId
    ) {

        if (!notificationId) {

            throw new Error(
                "Notification ID is required"
            );

        }

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        /* ========================================================
           OWNERSHIP CHECK
        ======================================================== */

        const notification =
            await Notification.findOneAndDelete({

                _id:
                    notificationId,

                recipientClerkId:
                    clerkId

            });


        if (!notification) {

            throw new Error(
                "Notification not found"
            );

        }


        return notification;

    }


    /* ============================================================
       DELETE ALL USER NOTIFICATIONS
    ============================================================ */

    static async deleteAllNotifications(
        clerkId
    ) {

        if (!clerkId) {

            throw new Error(
                "Clerk ID is required"
            );

        }


        return Notification.deleteMany({

            recipientClerkId:
                clerkId

        });

    }


}


module.exports =
    NotificationService;