const mongoose = require("mongoose");

const { Schema } = mongoose;

const ROLES = [
    "Citizen",
    "Worker",
    "Admin",
];

const AVAILABILITY = [
    "Available",
    "Busy",
    "Offline",
    "On Leave",
];

/* ============================================================
   LIVE LOCATION
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
            default: [0, 0],
        },

        address: {
            type: String,
            default: "",
        },

        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   PERFORMANCE
============================================================ */

const performanceSchema = new Schema(
    {
        totalAssigned: {
            type: Number,
            default: 0,
        },

        totalResolved: {
            type: Number,
            default: 0,
        },

        activeComplaints: {
            type: Number,
            default: 0,
        },

        averageResolutionHours: {
            type: Number,
            default: 0,
        },

        rating: {
            type: Number,
            default: 5,
            min: 0,
            max: 5,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   NOTIFICATION SETTINGS
============================================================ */

const notificationSchema = new Schema(
    {
        email: {
            type: Boolean,
            default: true,
        },

        push: {
            type: Boolean,
            default: true,
        },

        sms: {
            type: Boolean,
            default: false,
        },
    },
    {
        _id: false,
    }
);

/* ============================================================
   MAIN USER
============================================================ */

const userSchema = new Schema(
    {
        clerkId: {
            type: String,
            required: true,
            unique: true,
        },

        firstName: {
            type: String,
            required: true,
            trim: true,
        },

        lastName: {
            type: String,
            default: "",
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        phone: {
            type: String,
            default: "",
        },

        profileImage: {
            type: String,
            default: "",
        },

        role: {
            type: String,
            enum: ROLES,
            default: "Citizen",
        },

        department: {
            type: Schema.Types.ObjectId,
            ref: "Department",
            default: null,
        },

        skills: {
            type: [String],
            default: [],
        },

        liveLocation: {
            type: locationSchema,
            default: () => ({}),
        },

        availability: {
            type: String,
            enum: AVAILABILITY,
            default: "Available",
        },

        workload: {
            type: Number,
            default: 0,
        },

        performance: {
            type: performanceSchema,
            default: () => ({}),
        },

        notificationSettings: {
            type: notificationSchema,
            default: () => ({}),
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        status: {
            type: String,
            enum: ["Active", "Inactive", "Suspended"],
            default: "Active",
        },

        employeeId: {
            type: String,
            index: { unique: true, sparse: true },
        },

        designation: {
            type: String,
            default: "",
        },

        lastLogin: {
            type: Date,
            default: Date.now,
        },

        isOnline: {
            type: Boolean,
            default: false,
        },

        lastSeenAt: {
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

userSchema.index({
    role: 1,
});

userSchema.index({
    department: 1,
});

userSchema.index({
    availability: 1,
});

userSchema.index({
    liveLocation: "2dsphere",
});

/* ============================================================
   STATIC METHODS
============================================================ */

userSchema.statics.findAvailableWorkers = function (
    departmentId
) {
    return this.find({
        role: "Worker",
        department: departmentId,
        availability: "Available",
        isActive: true,
    });
};

module.exports = mongoose.model(
    "User",
    userSchema
);