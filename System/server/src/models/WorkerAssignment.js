const mongoose = require("mongoose");

const { Schema } = mongoose;

const ASSIGNMENT_STATUS = [
    "Pending",
    "Accepted",
    "Rejected",
    "In Progress",
    "Completed",
    "Cancelled",
];

const ASSIGNMENT_TYPE = [
    "AI",
    "Manual",
    "Reassigned",
];

const assignmentHistorySchema = new Schema(
    {
        worker: {
            type: Schema.Types.ObjectId,
            ref: "User",
        },

        assignedAt: {
            type: Date,
            default: Date.now,
        },

        acceptedAt: Date,

        rejectedAt: Date,

        startedAt: Date,

        completedAt: Date,

        status: {
            type: String,
            enum: ASSIGNMENT_STATUS,
            default: "Pending",
        },

        remarks: {
            type: String,
            default: "",
        },
    },
    {
        _id: false,
    }
);

const workerAssignmentSchema = new Schema(
    {
        complaint: {
            type: Schema.Types.ObjectId,
            ref: "Complaint",
            required: true,
        },

        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            required: true,
        },

        worker: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        workerClerkId: {
            type: String,
            required: true,
        },

        assignedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        assignmentType: {
            type: String,
            enum: ASSIGNMENT_TYPE,
            default: "AI",
        },

        aiConfidence: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        assignmentScore: {
            type: Number,
            default: 0,
        },

        estimatedTravelDistance: {
            type: Number,
            default: 0,
        },

        estimatedTravelTime: {
            type: Number,
            default: 0,
        },

        assignedAt: {
            type: Date,
            default: Date.now,
        },

        acceptedAt: Date,

        rejectedAt: Date,

        startedAt: Date,

        completedAt: Date,

        status: {
            type: String,
            enum: ASSIGNMENT_STATUS,
            default: "Pending",
        },

        rejectionReason: {
            type: String,
            default: "",
        },

        currentLocation: {
            type: {
                type: String,
                enum: ["Point"],
                default: "Point",
            },

            coordinates: {
                type: [Number],
                default: [0, 0],
            },

            updatedAt: {
                type: Date,
                default: Date.now,
            },
        },

        history: {
            type: [assignmentHistorySchema],
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

workerAssignmentSchema.index({
    complaint: 1,
});

workerAssignmentSchema.index({
    worker: 1,
});

workerAssignmentSchema.index({
    department: 1,
});

workerAssignmentSchema.index({
    status: 1,
});

workerAssignmentSchema.index({
    assignedAt: -1,
});

workerAssignmentSchema.index({
    currentLocation: "2dsphere",
});

/* ============================================================
   INSTANCE METHODS
============================================================ */

workerAssignmentSchema.methods.accept = function () {

    this.status = "Accepted";

    this.acceptedAt = new Date();

    return this.save();

};

workerAssignmentSchema.methods.reject = function (
    reason
) {

    this.status = "Rejected";

    this.rejectionReason = reason;

    this.rejectedAt = new Date();

    return this.save();

};

workerAssignmentSchema.methods.startWork = function () {

    this.status = "In Progress";

    this.startedAt = new Date();

    return this.save();

};

workerAssignmentSchema.methods.completeWork = function () {

    this.status = "Completed";

    this.completedAt = new Date();

    return this.save();

};

/* ============================================================
   STATIC METHODS
============================================================ */

workerAssignmentSchema.statics.getWorkerAssignments =
function (workerId) {

    return this.find({
        worker: workerId,
        isActive: true,
    })
        .populate("complaint")
        .populate("department")
        .sort({
            assignedAt: -1,
        });

};

workerAssignmentSchema.statics.getActiveAssignments =
function () {

    return this.find({
        isActive: true,
        status: {
            $nin: [
                "Completed",
                "Cancelled",
            ],
        },
    });

};

module.exports = mongoose.model(
    "WorkerAssignment",
    workerAssignmentSchema
);