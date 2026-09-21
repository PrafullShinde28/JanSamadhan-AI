const mongoose = require("mongoose");

const { Schema } = mongoose;

const NOTIFICATION_TYPES = [
    "Complaint Created",
    "Complaint Assigned",
    "Worker Assigned",
    "Worker Reassigned",
    "Worker Assignment Pending",
    "Worker Accepted",
    "Worker Rejected",
    "Department Assigned",
    "Location Verified",
    "Status Updated",
    "Progress Updated",
    "Complaint Resolved",
    "Complaint Closed",
    "Complaint Reopened",
    "AI Analysis Completed",
    "Duplicate Complaint Found",
    "ETA Updated",
    "Feedback Requested",
    "Feedback Submitted",
    "System",
];

const PRIORITIES = [
    "Low",
    "Medium",
    "High",
];

const notificationSchema = new Schema(
    {
        recipient: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        recipientClerkId: {
            type: String,
            required: true,
        },

        complaint: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            default: null,
        },

        timeline: {
            type: Schema.Types.ObjectId,
            ref: "Timeline",
            default: null,
        },

        title: {
            type: String,
            required: true,
            trim: true,
            maxlength: 150,
        },

        message: {
            type: String,
            required: true,
            trim: true,
            maxlength: 1000,
        },

        type: {
            type: String,
            enum: NOTIFICATION_TYPES,
            required: true,
        },

        priority: {
            type: String,
            enum: PRIORITIES,
            default: "Medium",
        },

        actionUrl: {
            type: String,
            default: "",
        },

        icon: {
            type: String,
            default: "",
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },

        isRead: {
            type: Boolean,
            default: false,
        },

        readAt: {
            type: Date,
            default: null,
        },

        expiresAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/* ================= INDEXES ================= */

notificationSchema.index({ recipient: 1, isRead: 1 });

notificationSchema.index({ recipientClerkId: 1 });

notificationSchema.index({ createdAt: -1 });

notificationSchema.index({ type: 1 });

/* ================= METHODS ================= */

notificationSchema.methods.markAsRead = async function () {

    this.isRead = true;
    this.readAt = new Date();

    return await this.save();

};

notificationSchema.statics.getUnreadNotifications = function (clerkId) {

    return this.find({

        recipientClerkId: clerkId,

        isRead: false

    }).sort({

        createdAt: -1

    });

};

notificationSchema.statics.markAllAsRead = function (clerkId) {

    return this.updateMany(

        {

            recipientClerkId: clerkId,

            isRead: false

        },

        {

            $set: {

                isRead: true,

                readAt: new Date()

            }

        }

    );

};

module.exports =
    mongoose.models.Notification ||
    mongoose.model(
        "Notification",
        notificationSchema
    );