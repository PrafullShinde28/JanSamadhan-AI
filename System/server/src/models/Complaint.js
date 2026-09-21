const mongoose = require("mongoose");

const { Schema } = mongoose;

/* ============================================================
   ENUMS
============================================================ */

const COMPLAINT_STATUS = [
  "Pending",
  "Under Review",
  "Assigned",
  "In Progress",
  "Resolved",
  "Closed",
];

const PRIORITY = [
  "Low",
  "Medium",
  "High",
];

const CATEGORY = [
  "Pothole",
  "Garbage Overflow",
  "Broken Streetlight",
  "Water Leakage",
  "Drainage Issue",
  "Road Damage",
  "Fallen Tree",
  "Open Manhole",
  "Other",
];

const IMAGE_TYPES = [
  "Complaint",
  "Before",
  "Progress",
  "After",
];

/* ============================================================
   IMAGE SCHEMA
============================================================ */

const imageSchema = new Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },

    publicId: {
      type: String,
      required: true,
    },

    imageType: {
      type: String,
      enum: IMAGE_TYPES,
      default: "Complaint",
    },

    uploadedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },

    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

/* ============================================================
   LOCATION SCHEMA
============================================================ */

const locationSchema = new Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },

    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (value) {
          return value.length === 2;
        },
        message: "Coordinates must contain [longitude, latitude]",
      },
    },

    address: {
      type: String,
      required: true,
      trim: true,
    },

    landmark: {
      type: String,
      default: "",
    },

    city: {
      type: String,
      default: "",
    },

    district: {
      type: String,
      default: "",
    },

    state: {
      type: String,
      default: "",
    },

    pincode: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

/* ============================================================
   ASSIGNMENT SCHEMA
============================================================ */

const assignmentSchema = new Schema(
  {
    department: {
      type: Schema.Types.ObjectId,
      ref: "Department",
      default: null,
    },

    worker: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    assignedAt: {
      type: Date,
      default: null,
    },

    isAutoAssigned: {
      type: Boolean,
      default: false,
    },

    assignmentReason: {
      type: String,
      default: "",
    },
  },
  { _id: false }
);

/* ============================================================
   AI SUMMARY
============================================================ */

const aiSummarySchema = new Schema(
  {
    processed: {
      type: Boolean,
      default: false,
    },

    modelName: {
      type: String,
      default: "",
    },

    modelVersion: {
      type: String,
      default: "",
    },

    detectedCategory: {
      type: String,
      enum: CATEGORY,
      default: "Other",
    },

    confidence: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    severity: {
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

    duplicateDetected: {
      type: Boolean,
      default: false,
    },

    duplicateComplaint: {
      type: Schema.Types.ObjectId,
      ref: "Complaint",
      default: null,
    },

    isCivicIssue: {
      type: Boolean,
      default: true,
    },

    nonCivicReason: {
      type: String,
      default: "",
    },

    estimatedCompletionHours: {
      type: Number,
      default: 0,
    },

    processedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/* ============================================================
   RESOLUTION SCHEMA
============================================================ */

const resolutionSchema = new Schema(
  {
    isResolved: {
      type: Boolean,
      default: false,
    },

    resolvedAt: {
      type: Date,
      default: null,
    },

    resolvedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    beforeImages: [imageSchema],

    progressImages: [imageSchema],

    afterImages: [imageSchema],

    remarks: {
      type: String,
      default: "",
      trim: true,
    },

    aiVerified: {
      type: Boolean,
      default: false,
    },

    adminVerified: {
      type: Boolean,
      default: false,
    },

    verificationScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    /* ============================================================
   ADMIN OVERRIDE
============================================================ */

adminOverride: {
    type: Boolean,
    default: false,
},

adminOverrideDecision: {
    type: String,
    enum: [
        "Resolved",
        "Not Resolved",
    ],
    default: null,
},

adminOverrideReason: {
    type: String,
    default: "",
    trim: true,
},

adminOverrideBy: {
    type: Schema.Types.ObjectId,
    ref: "User",
    default: null,
},

adminOverrideAt: {
    type: Date,
    default: null,
},
  },
  { _id: false }
);

/* ============================================================
   CITIZEN FEEDBACK
============================================================ */

const feedbackSchema = new Schema(
  {
    confirmed: {
      type: Boolean,
      default: false,
    },

    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: null,
    },

    comment: {
      type: String,
      default: "",
      trim: true,
    },

    submittedAt: {
      type: Date,
      default: null,
    },

    reopenRequested: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

/* ============================================================
   ANALYTICS
============================================================ */

const analyticsSchema = new Schema(
  {
    estimatedCompletionHours: {
      type: Number,
      default: 0,
    },

    actualCompletionHours: {
      type: Number,
      default: 0,
    },

    responseTimeMinutes: {
      type: Number,
      default: 0,
    },

    workerTravelTimeMinutes: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

/* ============================================================
   AUDIT
============================================================ */

const auditSchema = new Schema(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    deleted: {
      type: Boolean,
      default: false,
    },

    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false }
);

/* ============================================================
   MAIN COMPLAINT SCHEMA
============================================================ */

const complaintSchema = new Schema(
  {
    complaintNumber: {
      type: String,
      unique: true,
      required: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 150,
    },

    description: {
      type: String,
      default: "",
      trim: true,
    },

    category: {
      type: String,
      enum: CATEGORY,
      required: true,
    },

    priority: {
      type: String,
      enum: PRIORITY,
      default: "Medium",
    },

    status: {
      type: String,
      enum: COMPLAINT_STATUS,
      default: "Pending",
    },

    citizen: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    clerkUserId: {
      type: String,
      required: true,
    },

    location: {
      type: locationSchema,
      required: true,
    },

    complaintImages: {
      type: [imageSchema],
      default: [],
    },

    assignment: {
      type: assignmentSchema,
      default: () => ({}),
    },

    ai: {
      type: aiSummarySchema,
      default: () => ({}),
    },

    resolution: {
      type: resolutionSchema,
      default: () => ({}),
    },

    feedback: {
      type: feedbackSchema,
      default: () => ({}),
    },

    analytics: {
      type: analyticsSchema,
      default: () => ({}),
    },

    audit: {
      type: auditSchema,
      default: () => ({}),
    },

    tags: {
      type: [String],
      default: [],
    },

    isActive: {
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

complaintSchema.index({
    location: "2dsphere",
});

complaintSchema.index({
    category: 1,
});

complaintSchema.index({
    status: 1,
});

complaintSchema.index({
    priority: 1,
});

complaintSchema.index({
    createdAt: -1,
});

complaintSchema.index({
    "assignment.department": 1,
});

complaintSchema.index({
    "assignment.worker": 1,
});

complaintSchema.index({
    "ai.processed": 1,
});

complaintSchema.index({
    "resolution.isResolved": 1,
});

/* ============================================================
   VIRTUALS
============================================================ */

complaintSchema.virtual("timeline", {
    ref: "Timeline",
    localField: "_id",
    foreignField: "complaint",
});

complaintSchema.virtual("aiAnalysis", {
    ref: "AIAnalysis",
    localField: "_id",
    foreignField: "complaint",
});

complaintSchema.virtual("citizenFeedback", {
    ref: "Feedback",
    localField: "_id",
    foreignField: "complaint",
});

/* ============================================================
   PRE SAVE
============================================================ */

complaintSchema.pre("save", function (next) {

    if (!this.complaintNumber) {

        const year = new Date().getFullYear();

        const random = Math.floor(
            100000 + Math.random() * 900000
        );

        this.complaintNumber = `CIR-${year}-${random}`;
    }

    if (
        this.resolution.isResolved &&
        !this.resolution.resolvedAt
    ) {
        this.resolution.resolvedAt = new Date();
    }

    next();
});

/* ============================================================
   INSTANCE METHODS
============================================================ */

complaintSchema.methods.markResolved = function () {

    this.status = "Resolved";

    this.resolution.isResolved = true;

    this.resolution.resolvedAt = new Date();

    return this.save();
};

complaintSchema.methods.assignWorker = function (
    workerId,
    departmentId,
    assignedBy,
    autoAssigned = false
) {

    this.assignment.worker = workerId;

    this.assignment.department = departmentId;

    this.assignment.assignedBy = assignedBy;

    this.assignment.assignedAt = new Date();

    this.assignment.isAutoAssigned = autoAssigned;

    this.status = "Assigned";

    return this.save();
};

complaintSchema.methods.updateAIResult = function (
    aiResult
) {

    this.ai = {
        ...this.ai,
        ...aiResult,
        processed: true,
        processedAt: new Date(),
    };

    return this.save();
};

/* ============================================================
   STATIC METHODS
============================================================ */

complaintSchema.statics.findPending = function () {

    return this.find({
        status: "Pending",
        isActive: true,
    });
};

complaintSchema.statics.findAssigned = function () {

    return this.find({
        status: "Assigned",
        isActive: true,
    });
};

complaintSchema.statics.findNearby = function (
    longitude,
    latitude,
    maxDistance = 20
) {

    return this.find({
        location: {
            $near: {
                $geometry: {
                    type: "Point",
                    coordinates: [
                        longitude,
                        latitude,
                    ],
                },
                $maxDistance: maxDistance,
            },
        },
    });
};

complaintSchema.statics.findByWorker = function (
    workerId
) {

    return this.find({
        "assignment.worker": workerId,
        isActive: true,
    });
};

complaintSchema.statics.findByDepartment = function (
    departmentId
) {

    return this.find({
        "assignment.department": departmentId,
        isActive: true,
    });
};

/* ============================================================
   JSON SETTINGS
============================================================ */

complaintSchema.set("toJSON", {
    virtuals: true,
});

complaintSchema.set("toObject", {
    virtuals: true,
});

/* ============================================================
   EXPORT
============================================================ */

module.exports = mongoose.model(
    "Complaint",
    complaintSchema
);