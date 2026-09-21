const mongoose = require("mongoose");
const { Schema } = mongoose;

const invitationSchema = new Schema(
    {
        fullName: {
            type: String,
            required: true,
            trim: true,
        },
        
        email: {
            type: String,
            required: true,
            unique: true, // There should be only one active/inactive invitation per email to prevent duplicates
            lowercase: true,
            trim: true,
        },

        role: {
            type: String,
            enum: ["Worker", "Admin"],
            required: true,
        },

        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        employeeId: {
            type: String,
            default: null,
        },

        designation: {
            type: String,
            default: "",
        },

        skills: {
            type: [String],
            default: [],
        },

        invitedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        tokenHash: {
            type: String,
            required: true,
            unique: true,
        },

        expiresAt: {
            type: Date,
            required: true,
        },

        usedAt: {
            type: Date,
            default: null,
        },

        status: {
            type: String,
            enum: ["Pending", "Accepted", "Expired", "Revoked"],
            default: "Pending",
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes
invitationSchema.index({ email: 1 });
invitationSchema.index({ tokenHash: 1 });
invitationSchema.index({ status: 1 });

module.exports = mongoose.model("Invitation", invitationSchema);
