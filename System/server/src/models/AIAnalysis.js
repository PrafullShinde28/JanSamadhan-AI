const mongoose = require("mongoose");

const { Schema } = mongoose;

/* ============================================================
   DETECTED OBJECT SCHEMA
============================================================ */

const detectedObjectSchema = new Schema(
    {
        label: {
            type: String,
            required: true,
            trim: true,
        },

        confidence: {
            type: Number,
            required: true,
            min: 0,
            max: 100,
        },

        boundingBox: {
            x: Number,
            y: Number,
            width: Number,
            height: Number,
        },

        area: {
            type: Number,
            default: 0,
        },

        severity: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   DUPLICATE DETECTION
============================================================ */

const duplicateSchema = new Schema(
    {
        isDuplicate: {
            type: Boolean,
            default: false,
        },

        duplicateComplaint: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            default: null,
        },

        distanceMeters: {
            type: Number,
            default: 0,
        },

        confidence: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   DEPARTMENT RECOMMENDATION
============================================================ */

const departmentRecommendationSchema = new Schema(
    {
        recommendedDepartment: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        confidence: {
            type: Number,
            default: 0,
        },

        reason: {
            type: String,
            default: "",
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   WORKER RECOMMENDATION
============================================================ */

const workerRecommendationSchema = new Schema(
    {
        recommendedWorker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        confidence: {
            type: Number,
            default: 0,
        },

        distanceMeters: {
            type: Number,
            default: 0,
        },

        estimatedTravelMinutes: {
            type: Number,
            default: 0,
        },

        reason: {
            type: String,
            default: "",
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   ETA
============================================================ */

const etaSchema = new Schema(
    {
        estimatedHours: {
            type: Number,
            default: 0,
        },

        estimatedCompletionDate: {
            type: Date,
            default: null,
        },

        confidence: {
            type: Number,
            default: 0,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   VERIFICATION
============================================================ */

const verificationSchema = new Schema(
    {
        verified: {
            type: Boolean,
            default: false,
        },

        confidence: {
            type: Number,
            default: 0,
        },

        remarks: {
            type: String,
            default: "",
        },

        verifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   MAIN SCHEMA
============================================================ */

const aiAnalysisSchema = new Schema(
    {
        complaint: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
        },

        modelName: {
            type: String,
            default: "YOLO11",
        },

        modelVersion: {
            type: String,
            default: "v1",
        },

        processingTimeMs: {
            type: Number,
            default: 0,
        },

        detectedObjects: {
            type: [detectedObjectSchema],
            default: [],
        },

        primaryCategory: {
            type: String,
            default: "",
        },

        overallConfidence: {
            type: Number,
            default: 0,
        },

        priorityPrediction: {
            type: String,
            enum: ["Low", "Medium", "High"],
            default: "Medium",
        },

        riskScore: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        duplicateDetection: {
            type: duplicateSchema,
            default: () => ({}),
        },

        departmentRecommendation: {
            type: departmentRecommendationSchema,
            default: () => ({}),
        },

        workerRecommendation: {
            type: workerRecommendationSchema,
            default: () => ({}),
        },

        etaPrediction: {
            type: etaSchema,
            default: () => ({}),
        },

        resolutionVerification: {
            type: verificationSchema,
            default: () => ({}),
        },

        rawResponse: {
            type: Schema.Types.Mixed,
            default: {},
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

aiAnalysisSchema.index({
    complaint: 1,
});

aiAnalysisSchema.index({
    createdAt: -1,
});

aiAnalysisSchema.index({
    modelVersion: 1,
});

aiAnalysisSchema.index({
    primaryCategory: 1,
});

/* ============================================================
   STATIC METHODS
============================================================ */

aiAnalysisSchema.statics.getLatestAnalysis = function (
    complaintId
) {
    return this.findOne({
        complaint: complaintId,
    }).sort({
        createdAt: -1,
    });
};

module.exports = mongoose.model(
    "AIAnalysis",
    aiAnalysisSchema
);