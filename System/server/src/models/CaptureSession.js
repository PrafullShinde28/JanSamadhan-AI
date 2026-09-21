const mongoose = require("mongoose");
const { Schema } = mongoose;

const captureSessionSchema = new Schema(
    {
        citizen: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        captureSessionId: {
            type: String,
            required: true,
            unique: true,
        },
        nonce: {
            type: String,
            required: true,
        },
        used: {
            type: Boolean,
            default: false,
        },
        expiresAt: {
            type: Date,
            required: true,
            index: { expires: 0 } // Auto-delete document after expiration
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

captureSessionSchema.index({ citizen: 1 });
captureSessionSchema.index({ captureSessionId: 1 });

module.exports = mongoose.model("CaptureSession", captureSessionSchema);
