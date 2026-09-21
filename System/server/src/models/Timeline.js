const mongoose = require("mongoose");

const { Schema } = mongoose;

const timelineSchema = new Schema(
    {
        complaint: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
        },

        eventType: {
            type: String,
            enum: [
                "Complaint Created",
                "AI Analysis Started",
                "AI Analysis Completed",
                "Duplicate Complaint Detected",
                "Department Assigned",
                "Worker Assigned",
                "Worker Assignment Pending",
                "Worker Accepted",
                "Worker Rejected",
                "Worker Started",
                "Worker Reached Location",
                "Progress Updated",
                "Resolution Uploaded",
                "AI Verification Completed",
                "Citizen Feedback Submitted",
                "Complaint Reopened",
                "Complaint Closed",
                "Admin Updated",
            ],
            required: true,
        },

        status: {
            type: String,
            enum: [
                "Pending",
                "Under Review",
                "Assigned",
                "In Progress",
                "Resolved",
                "Closed",
            ],
            default: "Pending",
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        remarks: {
            type: String,
            default: "",
            trim: true,
        },

        performedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        performerRole: {
            type: String,
            enum: [
                "Citizen",
                "Worker",
                "Admin",
                "AI",
                "System",
            ],
            default: "System",
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },

        location: {
            latitude: Number,
            longitude: Number,
        },

        attachments: [
            {
                url: String,
                publicId: String,
            },
        ],

        isVisibleToCitizen: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

/* ============================================================
   INDEXES
============================================================ */

timelineSchema.index({
    complaint: 1,
    createdAt: -1,
});

timelineSchema.index({
    performerRole: 1,
});

timelineSchema.index({
    eventType: 1,
});

timelineSchema.index({
    status: 1,
});

/* ============================================================
   STATIC METHODS
============================================================ */

timelineSchema.statics.addEvent = async function ({
    complaint,
    eventType,
    status,
    description,
    remarks,
    performedBy,
    performerRole,
    metadata,
    location,
    attachments,
    isVisibleToCitizen = true,
}) {
    return await this.create({
        complaint,
        eventType,
        status,
        description,
        remarks,
        performedBy,
        performerRole,
        metadata,
        location,
        attachments,
        isVisibleToCitizen,
    });
};

timelineSchema.statics.getComplaintTimeline = function (
    complaintId
) {
    return this.find({
        complaint: complaintId,
    })
        .populate("performedBy", "name role")
        .sort({
            createdAt: -1,
        });
};

module.exports = mongoose.model(
    "Timeline",
    timelineSchema
);