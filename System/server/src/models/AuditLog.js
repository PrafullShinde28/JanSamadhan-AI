const mongoose = require("mongoose");

const { Schema } = mongoose;

const auditLogSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        clerkId: {
            type: String,
            default: "",
        },

        role: {
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

        action: {
            type: String,
            required: true,
        },

        entity: {
            type: String,
            required: true,
        },

        entityId: {
            type: Schema.Types.ObjectId,
            default: null,
        },

        description: {
            type: String,
            default: "",
        },

        ipAddress: {
            type: String,
            default: "",
        },

        userAgent: {
            type: String,
            default: "",
        },

        metadata: {
            type: Schema.Types.Mixed,
            default: {},
        },

        status: {
            type: String,
            enum: [
                "Success",
                "Failed",
            ],
            default: "Success",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

auditLogSchema.index({
    createdAt: -1,
});

auditLogSchema.index({
    action: 1,
});

auditLogSchema.index({
    entity: 1,
});

module.exports = mongoose.model(
    "AuditLog",
    auditLogSchema
);