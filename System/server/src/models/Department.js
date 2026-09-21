const mongoose = require("mongoose");

const { Schema } = mongoose;

/* ============================================================
   PERFORMANCE SCHEMA
============================================================ */

const performanceSchema = new Schema(
    {
        totalComplaints: {
            type: Number,
            default: 0,
        },

        pendingComplaints: {
            type: Number,
            default: 0,
        },

        inProgressComplaints: {
            type: Number,
            default: 0,
        },

        resolvedComplaints: {
            type: Number,
            default: 0,
        },

        averageResolutionHours: {
            type: Number,
            default: 0,
        },

        averageResponseMinutes: {
            type: Number,
            default: 0,
        },

        successRate: {
            type: Number,
            default: 100,
            min: 0,
            max: 100,
        },
    },
    { _id: false }
);

/* ============================================================
   AI SETTINGS
============================================================ */

const aiSettingsSchema = new Schema(
    {
        autoAssignEnabled: {
            type: Boolean,
            default: true,
        },

        etaPredictionEnabled: {
            type: Boolean,
            default: true,
        },

        priorityWeight: {
            type: Number,
            default: 1,
        },

        workloadWeight: {
            type: Number,
            default: 1,
        },

        distanceWeight: {
            type: Number,
            default: 1,
        },
    },
    { _id: false }
);

/* ============================================================
   MAIN DEPARTMENT SCHEMA
============================================================ */

const departmentSchema = new Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },

        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },

        description: {
            type: String,
            default: "",
            trim: true,
        },

        icon: {
            type: String,
            default: "",
        },

        color: {
            type: String,
            default: "#2563EB",
        },

        email: {
            type: String,
            default: "",
        },

        phone: {
            type: String,
            default: "",
        },

        activeWorkers: [
            {
                type: Schema.Types.ObjectId,
                ref: "User",
            },
        ],

        manager: {
            type: Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },

        performance: {
            type: performanceSchema,
            default: () => ({}),
        },

        aiSettings: {
            type: aiSettingsSchema,
            default: () => ({}),
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


departmentSchema.index({
    isActive: 1,
});

/* ============================================================
   STATIC METHODS
============================================================ */

departmentSchema.statics.getActiveDepartments = function () {
    return this.find({
        isActive: true,
    }).sort({
        name: 1,
    });
};

departmentSchema.statics.findByCode = function (code) {
    return this.findOne({
        code,
    });
};

/* ============================================================
   INSTANCE METHODS
============================================================ */

departmentSchema.methods.addWorker = function (workerId) {
    if (!this.activeWorkers.includes(workerId)) {
        this.activeWorkers.push(workerId);
    }

    return this.save();
};

departmentSchema.methods.removeWorker = function (workerId) {
    this.activeWorkers = this.activeWorkers.filter(
        (id) => id.toString() !== workerId.toString()
    );

    return this.save();
};

module.exports = mongoose.model(
    "Department",
    departmentSchema
);