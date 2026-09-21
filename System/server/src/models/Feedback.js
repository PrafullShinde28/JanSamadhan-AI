const mongoose = require("mongoose");

const { Schema } = mongoose;

/* ============================================================
   IMAGE SCHEMA
============================================================ */

const imageSchema = new Schema(
    {
        url: {
            type: String,
            required: true,
        },

        publicId: {
            type: String,
            required: true,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   FEEDBACK SCHEMA
============================================================ */

const feedbackSchema = new Schema(
    {
        complaint: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
            unique: true,
        },

        citizen: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        citizenClerkId: {
            type: String,
            required: true,
        },

        worker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        /* ==========================================
           RESOLUTION CONFIRMATION
        ========================================== */

        isResolved: {
            type: Boolean,
            required: true,
        },

        reopenComplaint: {
            type: Boolean,
            default: false,
        },

        /* ==========================================
           RATINGS
        ========================================== */

        overallRating: {
            type: Number,
            required: true,
            min: 1,
            max: 5,
        },

        workerRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        resolutionQualityRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        responseTimeRating: {
            type: Number,
            min: 1,
            max: 5,
            default: null,
        },

        /* ==========================================
           COMMENTS
        ========================================== */

        comment: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        improvementSuggestion: {
            type: String,
            trim: true,
            maxlength: 1000,
            default: "",
        },

        /* ==========================================
           FEEDBACK IMAGES
        ========================================== */

        images: {
            type: [imageSchema],
            default: [],
        },

        /* ==========================================
           AI ANALYSIS
        ========================================== */

        aiSentiment: {
            type: String,
            enum: [
                "Positive",
                "Neutral",
                "Negative",
            ],
            default: "Neutral",
        },

        sentimentScore: {
            type: Number,
            default: 0,
        },

        /* ==========================================
           STATUS
        ========================================== */

        isVisible: {
            type: Boolean,
            default: true,
        },

        reviewedByAdmin: {
            type: Boolean,
            default: false,
        },

        reviewedAt: {
            type: Date,
            default: null,
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

feedbackSchema.index({
    overallRating: 1,
});

feedbackSchema.index({
    worker: 1,
});

feedbackSchema.index({
    department: 1,
});

feedbackSchema.index({
    createdAt: -1,
});

/* ============================================================
   STATIC METHODS
============================================================ */

feedbackSchema.statics.getWorkerAverageRating =
async function (workerId) {

    const result = await this.aggregate([
        {
            $match: {
                worker: new mongoose.Types.ObjectId(workerId),
            },
        },
        {
            $group: {
                _id: "$worker",
                averageRating: {
                    $avg: "$workerRating",
                },
            },
        },
    ]);

    return result.length
        ? result[0].averageRating
        : 0;
};

feedbackSchema.statics.getDepartmentRating =
async function (departmentId) {

    const result = await this.aggregate([
        {
            $match: {
                department:
                    new mongoose.Types.ObjectId(
                        departmentId
                    ),
            },
        },
        {
            $group: {
                _id: "$department",
                averageRating: {
                    $avg: "$overallRating",
                },
            },
        },
    ]);

    return result.length
        ? result[0].averageRating
        : 0;
};

module.exports = mongoose.model(
    "Feedback",
    feedbackSchema
);