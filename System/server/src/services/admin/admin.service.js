const Complaint = require("../../models/Complaint");
const User = require("../../models/User");
const Department = require("../../models/Department");
const WorkerService =
    require("../worker/worker.service");

const TimelineService =
    require("../timeline/timeline.service");

const NotificationService =
    require("../notification/notification.service");


class AdminService {


/* ============================================================
   OVERRIDE AI RESOLUTION
============================================================ */

static async overrideResolution(
    complaintId,
    admin,
    decision,
    reason = ""
) {

    /* ========================================================
       VERIFY ADMIN
    ======================================================== */

    if (!admin) {
        throw new Error(
            "Authenticated admin is required"
        );
    }

    if (admin.role !== "Admin") {
        throw new Error(
            "Only administrators can override AI resolution"
        );
    }


    /* ========================================================
       VALIDATE DECISION
    ======================================================== */

    if (
        decision !== "Resolved" &&
        decision !== "Not Resolved"
    ) {

        throw new Error(
            "Decision must be Resolved or Not Resolved"
        );

    }


    if (!reason.trim()) {

        throw new Error(
            "Admin override reason is required"
        );

    }


    /* ========================================================
       FIND COMPLAINT
    ======================================================== */

    const complaint =
        await Complaint.findById(
            complaintId
        );

    if (!complaint) {

        throw new Error(
            "Complaint not found"
        );

    }


    /* ========================================================
       PRESERVE ORIGINAL AI RESULT
    ======================================================== */

    const originalAIResult = {

        aiVerified:
            complaint.resolution.aiVerified,

        isResolved:
            complaint.resolution.isResolved,

        verificationScore:
            complaint.resolution.verificationScore

    };


    /* ========================================================
       SAVE ADMIN OVERRIDE
    ======================================================== */

    complaint.resolution.adminOverride =
        true;

    complaint.resolution.adminOverrideDecision =
        decision;

    complaint.resolution.adminOverrideReason =
        reason;

    complaint.resolution.adminOverrideBy =
        admin._id;

    complaint.resolution.adminOverrideAt =
        new Date();


    /* ========================================================
       ADMIN DECISION = RESOLVED
    ======================================================== */

    if (
        decision === "Resolved"
    ) {

        complaint.status =
            "Resolved";

        complaint.resolution.isResolved =
            true;

        complaint.resolution.adminVerified =
            true;

        complaint.resolution.resolvedAt =
            complaint.resolution.resolvedAt ||
            new Date();

    }


    /* ========================================================
       ADMIN DECISION = NOT RESOLVED
    ======================================================== */

    else {

        complaint.status =
            "In Progress";

        complaint.resolution.isResolved =
            false;

        complaint.resolution.adminVerified =
            false;

        complaint.feedback.confirmed =
            false;

        complaint.feedback.reopenRequested =
            true;

    }


    /* ========================================================
       AUDIT
    ======================================================== */

    complaint.audit.updatedBy =
        admin._id;


    await complaint.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Status Updated",

        performerRole:
            "Admin",

        performedBy:
            admin._id,

        status:
            complaint.status,

        description:
            decision === "Resolved"
                ? "Administrator overrode the AI resolution decision and marked the complaint as resolved."
                : "Administrator overrode the AI resolution decision and determined that the complaint is not resolved.",

        remarks:
            reason,

        metadata: {

            adminOverride:
                true,

            adminDecision:
                decision,

            adminReason:
                reason,

            originalAIResult

        }

    });


    /* ========================================================
       NOTIFY WORKER
    ======================================================== */

    const workerId =
        complaint.assignment?.worker;


    if (workerId) {

        const worker =
            await User.findById(
                workerId
            );

        if (worker) {

            await NotificationService.send({

                recipient:
                    worker._id,

                recipientClerkId:
                    worker.clerkId,

                complaint:
                    complaint._id,

                title:
                    decision === "Resolved"
                        ? "Resolution Approved by Admin"
                        : "Resolution Rejected by Admin",

                message:
                    decision === "Resolved"
                        ? `Admin approved the resolution of complaint ${complaint.complaintNumber}.`
                        : `Admin determined that complaint ${complaint.complaintNumber} is not resolved. Please continue the work.`,

                type:
                    "Status Updated",

                priority:
                    complaint.priority,

                actionUrl:
                    `/worker/complaints/${complaint._id}`,

                icon:
                    decision === "Resolved"
                        ? "check-circle"
                        : "alert-circle"

            });

        }

    }


    /* ========================================================
       NOTIFY CITIZEN
    ======================================================== */

    const citizen =
        await User.findById(
            complaint.citizen
        );


    if (citizen) {

        await NotificationService.send({

            recipient:
                citizen._id,

            recipientClerkId:
                citizen.clerkId,

            complaint:
                complaint._id,

            title:
                decision === "Resolved"
                    ? "Complaint Resolution Approved"
                    : "Complaint Reopened",

            message:
                decision === "Resolved"
                    ? `Your complaint ${complaint.complaintNumber} has been marked as resolved after administrative review.`
                    : `Your complaint ${complaint.complaintNumber} requires further work after administrative review.`,

            type:
                "Status Updated",

            priority:
                complaint.priority,

            actionUrl:
                `/complaints/${complaint._id}`,

            icon:
                decision === "Resolved"
                    ? "check-circle"
                    : "refresh-cw"

        });

    }


    return complaint;

}    
/* ============================================================
   ADMIN DASHBOARD ANALYTICS
============================================================ */

/* ============================================================
   ADMIN DASHBOARD ANALYTICS
============================================================ */

static async getDashboardAnalytics(admin) {

    /* ========================================================
       VERIFY ADMIN
    ======================================================== */

    if (!admin) {
        throw new Error(
            "Authenticated admin is required"
        );
    }

    if (admin.role !== "Admin") {
        throw new Error(
            "Only administrators can access analytics"
        );
    }


    /* ========================================================
       COMPLAINT COUNTS
    ======================================================== */

    const [

        totalComplaints,

        pendingComplaints,

        assignedComplaints,

        inProgressComplaints,

        resolvedComplaints,

        closedComplaints,

        highPriority,

        criticalPriority,

        aiVerified,

        aiNotVerified,

        duplicateComplaints,

        aiOverrides

    ] = await Promise.all([

        Complaint.countDocuments({
            isActive: true
        }),

        Complaint.countDocuments({
            status: "Pending",
            isActive: true
        }),

        Complaint.countDocuments({
            status: "Assigned",
            isActive: true
        }),

        Complaint.countDocuments({
            status: "In Progress",
            isActive: true
        }),

        Complaint.countDocuments({
            status: "Resolved",
            isActive: true
        }),

        Complaint.countDocuments({
            status: "Closed",
            isActive: true
        }),

        Complaint.countDocuments({
            priority: "High",
            isActive: true
        }),

        Complaint.countDocuments({
            priority: "Critical",
            isActive: true
        }),

        Complaint.countDocuments({
            "resolution.aiVerified": true,
            isActive: true
        }),

        Complaint.countDocuments({
            "resolution.aiVerified": false,
            isActive: true
        }),

        Complaint.countDocuments({
            "ai.duplicateDetected": true,
            isActive: true
        }),

        Complaint.countDocuments({
            "resolution.adminOverride": true,
            isActive: true
        })

    ]);


    /* ========================================================
       AI PROCESSING + CONFIDENCE
    ======================================================== */

    const aiConfidenceStats =
        await Complaint.aggregate([

            {
                $match: {

                    isActive: true,

                    "ai.processed": true,

                    "ai.confidence": {
                        $gte: 0
                    }

                }

            },

            {
                $group: {

                    _id: null,

                    averageConfidence: {
                        $avg:
                            "$ai.confidence"
                    },

                    processedComplaints: {
                        $sum: 1
                    }

                }

            }

        ]);


    const aiProcessedComplaints =
        aiConfidenceStats.length > 0
            ? aiConfidenceStats[0]
                .processedComplaints
            : 0;


    const averageAIConfidence =
        aiConfidenceStats.length > 0
            ? Number(
                aiConfidenceStats[0]
                    .averageConfidence
                    .toFixed(4)
            )
            : 0;


    /* ========================================================
       RESOLUTION SUCCESS RATE
    ======================================================== */

    const completedComplaints =
        resolvedComplaints +
        closedComplaints;


    const resolutionSuccessRate =
        totalComplaints > 0
            ? Number(

                (
                    completedComplaints /
                    totalComplaints
                * 100

                ).toFixed(2)

            )
            : 0;


    /* ========================================================
       CATEGORY DISTRIBUTION
    ======================================================== */

    const categoryDistribution =
        await Complaint.aggregate([

            {
                $match: {

                    isActive: true

                }

            },

            {
                $group: {

                    _id:
                        "$category",

                    count: {

                        $sum: 1

                    }

                }

            },

            {
                $sort: {

                    count: -1

                }

            }

        ]);


    /* ========================================================
       PRIORITY DISTRIBUTION
    ======================================================== */

    const priorityDistribution =
        await Complaint.aggregate([

            {
                $match: {

                    isActive: true

                }

            },

            {
                $group: {

                    _id:
                        "$priority",

                    count: {

                        $sum: 1

                    }

                }

            },

            {
                $sort: {

                    count: -1

                }

            }

        ]);


    /* ========================================================
       STATUS DISTRIBUTION
    ======================================================== */

    const statusDistribution =
        await Complaint.aggregate([

            {
                $match: {

                    isActive: true

                }

            },

            {
                $group: {

                    _id:
                        "$status",

                    count: {

                        $sum: 1

                    }

                }

            },

            {
                $sort: {

                    count: -1

                }

            }

        ]);


    /* ========================================================
       AVERAGE COMPLETION TIME
    ======================================================== */

    const completionStats =
        await Complaint.aggregate([

            {
                $match: {

                    isActive: true,

                    "analytics.actualCompletionHours": {

                        $gt: 0

                    }

                }

            },

            {
                $group: {

                    _id: null,

                    averageCompletionHours: {

                        $avg:
                            "$analytics.actualCompletionHours"

                    }

                }

            }

        ]);


    const averageCompletionHours =
        completionStats.length > 0
            ? Number(

                completionStats[0]
                    .averageCompletionHours
                    .toFixed(2)

            )
            : 0;


    /* ========================================================
       DEPARTMENT PERFORMANCE
    ======================================================== */

    const departmentPerformance =
        await Department.find({

            isActive: true

        })
        .select(
            "name code performance aiSettings"
        )
        .lean();


    /* ========================================================
       WORKER PERFORMANCE
    ======================================================== */

    const workerPerformance =
        await User.find({

            role:
                "Worker",

            isActive:
                true

        })
        .select(
            "fullName firstName lastName availability workload performance department"
        )
        .populate(
            "department",
            "name code"
        )
        .sort({

            "performance.totalResolved":
                -1

        })
        .lean();


    /* ========================================================
       FINAL ANALYTICS RESPONSE
    ======================================================== */

    return {

        /* ====================================================
           OVERVIEW
        ==================================================== */

        overview: {

            totalComplaints,

            pendingComplaints,

            assignedComplaints,

            inProgressComplaints,

            resolvedComplaints,

            closedComplaints,

            highPriority,

            criticalPriority,

            aiVerified,

            aiNotVerified,

            duplicateComplaints,

            aiProcessedComplaints,

            averageAIConfidence,

            aiOverrides,

            resolutionSuccessRate,

            averageCompletionHours

        },


        /* ====================================================
           DISTRIBUTIONS
        ==================================================== */

        categoryDistribution,

        priorityDistribution,

        statusDistribution,


        /* ====================================================
           DEPARTMENT
        ==================================================== */

        departmentPerformance,


        /* ====================================================
           WORKERS
        ==================================================== */

        workerPerformance

    };

}
/* ============================================================
   GET ALL COMPLAINTS
============================================================ */

static async getComplaints({
    page = 1,
    limit = 20,
    status,
    priority,
    category,
    department,
    search
} = {}) {

    page = Math.max(
        1,
        Number(page) || 1
    );

    limit = Math.min(
        100,
        Math.max(
            1,
            Number(limit) || 20
        )
    );

    const query = {
        isActive: true
    };


    /* ========================================================
       STATUS
    ======================================================== */

    if (status) {
        query.status = status;
    }


    /* ========================================================
       PRIORITY
    ======================================================== */

    if (priority) {
        query.priority = priority;
    }


    /* ========================================================
       CATEGORY
    ======================================================== */

    if (category) {
        query.category = category;
    }


    /* ========================================================
       DEPARTMENT
    ======================================================== */

    if (department) {
        query["assignment.department"] =
            department;
    }


    /* ========================================================
       SEARCH
    ======================================================== */

    if (search) {

        query.$or = [

            {
                complaintNumber: {
                    $regex: search,
                    $options: "i"
                }
            },

            {
                title: {
                    $regex: search,
                    $options: "i"
                }
            },

            {
                description: {
                    $regex: search,
                    $options: "i"
                }
            },

            {
                category: {
                    $regex: search,
                    $options: "i"
                }
            }

        ];

    }


    /* ========================================================
       QUERY
    ======================================================== */

    const skip =
        (page - 1) * limit;


    const [
        complaints,
        total
    ] = await Promise.all([

        Complaint.find(query)

            .populate(
                "citizen",
                "name email phone"
            )

            .populate(
                "assignment.department",
                "name code icon color"
            )

            .populate(
                "assignment.worker",
                "fullName firstName lastName availability workload"
            )

            .sort({
                createdAt: -1
            })

            .skip(skip)

            .limit(limit)

            .lean(),

        Complaint.countDocuments(query)

    ]);


    return {

        complaints,

        pagination: {

            page,

            limit,

            total,

            totalPages:
                Math.ceil(
                    total / limit
                ),

            hasNextPage:
                page <
                Math.ceil(
                    total / limit
                ),

            hasPreviousPage:
                page > 1

        }

    };

}


/* ============================================================
   GET COMPLAINT DETAILS
============================================================ */

static async getComplaintDetails(
    complaintId,
    admin
) {

    if (!admin) {
        throw new Error(
            "Authenticated admin is required"
        );
    }

    if (admin.role !== "Admin") {
        throw new Error(
            "Only administrators can access complaint details"
        );
    }


    const complaint =
        await Complaint.findOne({

            _id: complaintId,

            isActive: true

        })

        .populate(
            "citizen",
            "fullName firstName lastName email phone role profileImage"
        )

        .populate(
            "assignment.department",
            "name code description icon color performance aiSettings"
        )

        .populate(
            "assignment.worker",
            "fullName firstName lastName email availability workload skills performance liveLocation"
        )

        .populate(
            "assignment.assignedBy",
            "fullName firstName lastName email role"
        )

        .lean();


    if (!complaint) {

        throw new Error(
            "Complaint not found"
        );

    }


    const timeline =
        await TimelineService.getTimeline(
            complaint._id
        );


    return {

        complaint,

        timeline

    };

}

/* ============================================================
   OVERRIDE PRIORITY
============================================================ */

static async overridePriority(
    complaintId,
    admin,
    priority,
    reason = ""
) {

    /* ========================================================
       VERIFY ADMIN
    ======================================================== */

    if (!admin) {
        throw new Error(
            "Authenticated admin is required"
        );
    }

    if (admin.role !== "Admin") {
        throw new Error(
            "Only administrators can override priority"
        );
    }


    /* ========================================================
       VALIDATE PRIORITY
    ======================================================== */

    const allowedPriorities = [
        "Low",
        "Medium",
        "High",
        "Critical"
    ];

    if (!allowedPriorities.includes(priority)) {

        throw new Error(
            "Invalid priority. Allowed values: Low, Medium, High, Critical"
        );

    }


    /* ========================================================
       FIND COMPLAINT
    ======================================================== */

    const complaint =
        await Complaint.findById(
            complaintId
        );

    if (!complaint) {

        throw new Error(
            "Complaint not found"
        );

    }


    /* ========================================================
       PREVIOUS PRIORITY
    ======================================================== */

    const previousPriority =
        complaint.priority;


    if (
        previousPriority === priority
    ) {

        throw new Error(
            `Complaint priority is already ${priority}`
        );

    }


    /* ========================================================
       UPDATE PRIORITY
    ======================================================== */

    complaint.priority =
        priority;


    complaint.audit.updatedBy =
        admin._id;


    await complaint.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Admin Updated",

        performerRole:
            "Admin",

        performedBy:
            admin._id,

        status:
            complaint.status,

        description:
            `Administrator changed complaint priority from ${previousPriority} to ${priority}.`,

        remarks:
            reason,

        metadata: {

            previousPriority,

            newPriority:
                priority,

            adminOverride:
                true

        }

    });


    /* ========================================================
       NOTIFY CITIZEN
    ======================================================== */

    const citizen =
        await User.findById(
            complaint.citizen
        );

    if (citizen) {

        await NotificationService.send({

            recipient:
                citizen._id,

            recipientClerkId:
                citizen.clerkId,

            complaint:
                complaint._id,

            title:
                "Complaint Priority Updated",

            message:
                `The priority of your complaint has been updated to ${priority}.`,

            type:
                "Status Updated",

            priority:
                priority,

            actionUrl:
                `/complaints/${complaint._id}`,

            icon:
                "alert-triangle",

            metadata: {

                previousPriority,

                newPriority:
                    priority,

                adminOverride:
                    true

            }

        });

    }


    /* ========================================================
       NOTIFY ASSIGNED WORKER
    ======================================================== */

    const workerId =
        complaint.assignment?.worker;

    if (workerId) {

        const worker =
            await User.findById(
                workerId
            );

        if (worker) {

            await NotificationService.send({

                recipient:
                    worker._id,

                recipientClerkId:
                    worker.clerkId,

                complaint:
                    complaint._id,

                title:
                    "Complaint Priority Updated",

                message:
                    `Priority for complaint ${complaint.complaintNumber} has been changed to ${priority}.`,

                type:
                    "Status Updated",

                priority:
                    priority,

                actionUrl:
                    `/worker/complaints/${complaint._id}`,

                icon:
                    "alert-triangle",

                metadata: {

                    previousPriority,

                    newPriority:
                        priority,

                    adminOverride:
                        true

                }

            });

        }

    }


    return complaint;

}
/* ============================================================
   OVERRIDE DEPARTMENT
============================================================ */

/* ============================================================
   OVERRIDE DEPARTMENT
============================================================ */

static async overrideDepartment(
    complaintId,
    admin,
    departmentId,
    reason = ""
) {

    /* ========================================================
       VERIFY ADMIN
    ======================================================== */

    if (!admin) {
        throw new Error(
            "Authenticated admin is required"
        );
    }

    if (admin.role !== "Admin") {
        throw new Error(
            "Only administrators can override department"
        );
    }


    /* ========================================================
       FIND COMPLAINT
    ======================================================== */

    const complaint =
        await Complaint.findById(
            complaintId
        );

    if (!complaint) {
        throw new Error(
            "Complaint not found"
        );
    }


    /* ========================================================
       FIND NEW DEPARTMENT
    ======================================================== */

    const department =
        await Department.findOne({

            _id: departmentId,

            isActive: true

        });

    if (!department) {
        throw new Error(
            "Active department not found"
        );
    }


    /* ========================================================
       PREVIOUS VALUES
    ======================================================== */

    const previousDepartment =
        complaint.assignment?.department || null;

    const previousWorker =
        complaint.assignment?.worker || null;


    /* ========================================================
       SAME DEPARTMENT CHECK
    ======================================================== */

    if (
        previousDepartment &&
        previousDepartment.toString() ===
            department._id.toString()
    ) {

        throw new Error(
            "Complaint is already assigned to this department"
        );

    }


    /* ========================================================
       RELEASE PREVIOUS WORKER
    ======================================================== */

    if (previousWorker) {

        const oldWorker =
            await User.findById(
                previousWorker
            );

        if (oldWorker) {

            oldWorker.workload =
                Math.max(
                    0,
                    (oldWorker.workload || 0) - 1
                );

            if (!oldWorker.performance) {
                oldWorker.performance = {};
            }

            oldWorker.performance.activeComplaints =
                Math.max(
                    0,
                    (oldWorker.performance.activeComplaints || 0) - 1
                );

            if (
                oldWorker.workload === 0
            ) {

                oldWorker.availability =
                    "Available";

            }

            await oldWorker.save();

        }

    }


    /* ========================================================
       UPDATE DEPARTMENT FIRST
    ======================================================== */

    complaint.assignment.department =
        department._id;

    complaint.assignment.worker =
        null;

    complaint.assignment.assignedBy =
        admin._id;

    complaint.assignment.assignedAt =
        new Date();

    complaint.assignment.isAutoAssigned =
        false;

    complaint.assignment.assignmentReason =
        `Admin changed department. Reason: ${reason}`;


    complaint.audit.updatedBy =
        admin._id;


    await complaint.save();


    /* ========================================================
       AI WORKER ASSIGNMENT
    ======================================================== */

    console.log(
        "🤖 AI reassignment after department override"
    );

    const workerResult =
        await WorkerService.assignBestWorker(

            department._id,

            complaint.location,

            complaint.category,

            complaint.priority

        );


    /* ========================================================
       WORKER FOUND
    ======================================================== */

    if (
        workerResult?.success &&
        workerResult.worker
    ) {

        const selectedWorker =
            workerResult.worker;


        complaint.assignment.worker =
            selectedWorker._id;

        complaint.assignment.assignedAt =
            new Date();

        complaint.assignment.assignedBy =
            admin._id;

        /*
         * Department was selected by Admin,
         * but worker was selected by AI.
         */
        complaint.assignment.isAutoAssigned =
            true;

        complaint.assignment.assignmentReason =
            `Department overridden by Admin. AI selected ${selectedWorker.fullName}. ${workerResult.reason}`;


        complaint.status =
            "Assigned";


        await complaint.save();


        /* ====================================================
           TIMELINE — DEPARTMENT OVERRIDE
        ==================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Department Assigned",

            performerRole:
                "Admin",

            performedBy:
                admin._id,

            status:
                "Assigned",

            description:
                `Administrator changed the department to ${department.name}. AI automatically assigned ${selectedWorker.fullName} as the worker.`,

            remarks:
                reason,

            metadata: {

                previousDepartment,

                newDepartment:
                    department._id,

                newDepartmentName:
                    department.name,

                previousWorker,

                newWorker:
                    selectedWorker._id,

                newWorkerName:
                    selectedWorker.fullName,

                workerAssignmentScore:
                    workerResult.score,

                workerDistanceKm:
                    workerResult.distanceKm,

                workerAssignmentReason:
                    workerResult.reason,

                adminOverride:
                    true,

                workerSelectedByAI:
                    true

            }

        });


        /* ====================================================
           NOTIFY NEW WORKER
        ==================================================== */

        await NotificationService.send({

            recipient:
                selectedWorker._id,

            recipientClerkId:
                selectedWorker.clerkId,

            complaint:
                complaint._id,

            title:
                "Complaint Reassigned",

            message:
                `Complaint ${complaint.complaintNumber} has been assigned to you after an administrative department override.`,

            type:
                "Worker Assigned",

            priority:
                complaint.priority,

            actionUrl:
                `/worker/complaints/${complaint._id}`,

            icon:
                "user-check",

            metadata: {

                department:
                    department.name,

                assignmentScore:
                    workerResult.score,

                distanceKm:
                    workerResult.distanceKm,

                reason:
                    workerResult.reason

            }

        });

    }


    /* ========================================================
       NO WORKER AVAILABLE
    ======================================================== */

    else {

        complaint.status =
            "Pending";

        complaint.assignment.worker =
            null;

        complaint.assignment.isAutoAssigned =
            false;

        complaint.assignment.assignmentReason =
            `Department overridden by Admin, but no available worker was found. ${workerResult?.reason || ""}`;

        await complaint.save();


        /* ====================================================
           TIMELINE — ASSIGNMENT PENDING
        ==================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Worker Assignment Pending",

            performerRole:
                "AI",

            status:
                "Pending",

            description:
                `Department was changed to ${department.name}, but AI could not find an available worker.`,

            remarks:
                workerResult?.reason ||
                "No available worker found.",

            metadata: {

                previousDepartment,

                newDepartment:
                    department._id,

                newDepartmentName:
                    department.name,

                previousWorker,

                adminOverride:
                    true,

                workerAssignmentFailed:
                    true

            }

        });


        /* ====================================================
           NOTIFY ADMINS
        ==================================================== */

        const admins =
            await User.find({

                role:
                    "Admin",

                isActive:
                    true

            });


        for (
            const adminUser
            of admins
        ) {

            await NotificationService.send({

                recipient:
                    adminUser._id,

                recipientClerkId:
                    adminUser.clerkId,

                complaint:
                    complaint._id,

                title:
                    "Worker Assignment Pending",

                message:
                    `Department was changed to ${department.name}, but no available worker was found for complaint ${complaint.complaintNumber}.`,

                type:
                    "Worker Assignment Pending",

                priority:
                    "High",

                actionUrl:
                    `/admin/complaints/${complaint._id}`,

                icon:
                    "alert-circle"

            });

        }

    }


    /* ========================================================
       NOTIFY CITIZEN
    ======================================================== */

    const citizen =
        await User.findById(
            complaint.citizen
        );

    if (citizen) {

        const workerName =
            complaint.assignment?.worker
                ? workerResult?.worker?.fullName
                : null;


        await NotificationService.send({

            recipient:
                citizen._id,

            recipientClerkId:
                citizen.clerkId,

            complaint:
                complaint._id,

            title:
                "Complaint Assignment Updated",

            message:
                workerName
                    ? `Your complaint has been moved to ${department.name} and assigned to a new worker.`
                    : `Your complaint has been moved to ${department.name}. A worker is currently being assigned.`,

            type:
                "Complaint Assigned",

            priority:
                complaint.priority,

            actionUrl:
                `/complaints/${complaint._id}`,

            icon:
                "building"

        });

    }


    return complaint;

}
    /* ============================================================
   REASSIGN WORKER
============================================================ */

static async reassignWorker(
    complaintId,
    admin,
    workerId,
    reason = ""
) {

    if (!admin) {
        throw new Error(
            "Authenticated admin is required"
        );
    }

    if (admin.role !== "Admin") {
        throw new Error(
            "Only administrators can reassign workers"
        );
    }


    const complaint =
        await Complaint.findById(
            complaintId
        );

    if (!complaint) {
        throw new Error(
            "Complaint not found"
        );
    }


    const worker =
        await User.findOne({

            _id: workerId,

            role: "Worker",

            isActive: true

        });

    if (!worker) {
        throw new Error(
            "Available worker not found"
        );
    }


    /* ========================================================
       VERIFY DEPARTMENT
    ======================================================== */

    if (
        complaint.assignment?.department &&
        worker.department?.toString() !==
        complaint.assignment.department.toString()
    ) {

        throw new Error(
            "Worker does not belong to the complaint department"
        );

    }


    /* ========================================================
       PREVIOUS WORKER
    ======================================================== */

    const previousWorkerId =
        complaint.assignment?.worker;


    /* ========================================================
       DECREASE PREVIOUS WORKER LOAD
    ======================================================== */

    if (previousWorkerId) {

        const previousWorker =
            await User.findById(
                previousWorkerId
            );

        if (previousWorker) {

            previousWorker.workload =
                Math.max(
                    0,
                    previousWorker.workload - 1
                );

            previousWorker.performance.activeComplaints =
                Math.max(
                    0,
                    previousWorker.performance.activeComplaints - 1
                );

            if (
                previousWorker.workload === 0
            ) {

                previousWorker.availability =
                    "Available";

            }

            await previousWorker.save();

        }

    }


    /* ========================================================
       ASSIGN NEW WORKER
    ======================================================== */

    complaint.assignment.worker =
        worker._id;

    complaint.assignment.assignedBy =
        admin._id;

    complaint.assignment.assignedAt =
        new Date();

    complaint.assignment.isAutoAssigned =
        false;

    complaint.assignment.assignmentReason =
        `Admin manually reassigned worker. Reason: ${reason}`;


    /* ========================================================
       UPDATE NEW WORKER
    ======================================================== */

    worker.workload =
        (worker.workload || 0) + 1;

    worker.performance.totalAssigned =
        (worker.performance.totalAssigned || 0) + 1;

    worker.performance.activeComplaints =
        (worker.performance.activeComplaints || 0) + 1;

    worker.availability =
        "Available";

    await worker.save();


    complaint.audit.updatedBy =
        admin._id;

    await complaint.save();


    /* ========================================================
       TIMELINE
    ======================================================== */

    await TimelineService.log({

        complaint:
            complaint._id,

        eventType:
            "Worker Assigned",

        performerRole:
            "Admin",

        performedBy:
            admin._id,

        status:
            complaint.status,

        description:
            `Administrator reassigned the complaint to ${worker.fullName}.`,

        remarks:
            reason,

        metadata: {

            previousWorker:
                previousWorkerId || null,

            newWorker:
                worker._id,

            newWorkerName:
                worker.fullName,

            adminOverride:
                true

        }

    });


    /* ========================================================
       NOTIFY NEW WORKER
    ======================================================== */

    await NotificationService.send({

        recipient:
            worker._id,

        recipientClerkId:
            worker.clerkId,

        complaint:
            complaint._id,

        title:
            "Complaint Assigned",

        message:
            `Complaint ${complaint.complaintNumber} has been assigned to you by an administrator.`,

        type:
            "Worker Assigned",

        priority:
            complaint.priority,

        actionUrl:
            `/worker/complaints/${complaint._id}`,

        icon:
            "user-check"

    });


    /* ========================================================
       NOTIFY CITIZEN
    ======================================================== */

    const citizen =
        await User.findById(
            complaint.citizen
        );

    if (citizen) {

        await NotificationService.send({

            recipient:
                citizen._id,

            recipientClerkId:
                citizen.clerkId,

            complaint:
                complaint._id,

            title:
                "Worker Reassigned",

            message:
                `A new worker has been assigned to your complaint.`,

            type:
                "Worker Assigned",

            priority:
                "Medium",

            actionUrl:
                `/complaints/${complaint._id}`,

            icon:
                "user-check"

        });

    }


    return complaint;

}
    /* ============================================================
       FINAL CLOSE COMPLAINT
    ============================================================ */

    static async closeComplaint(
        complaintId,
        admin,
        remarks = ""
    ) {

        /* ========================================================
           VERIFY ADMIN
        ======================================================== */

        if (!admin) {
            throw new Error(
                "Authenticated admin is required"
            );
        }

        if (admin.role !== "Admin") {
            throw new Error(
                "Only administrators can close complaints"
            );
        }


        /* ========================================================
           FIND COMPLAINT
        ======================================================== */

        const complaint =
            await Complaint.findById(complaintId);

        if (!complaint) {
            throw new Error(
                "Complaint not found"
            );
        }


        /* ========================================================
           VALIDATE RESOLUTION
        ======================================================== */

        if (
            complaint.status !== "Resolved"
        ) {

            throw new Error(
                `Complaint cannot be closed from ${complaint.status} status`
            );

        }


/* ========================================================
   AI VERIFICATION CHECK
======================================================== */

const aiVerified =
    complaint.resolution.aiVerified === true;

const adminOverridden =
    complaint.resolution.adminOverride === true &&
    complaint.resolution.adminOverrideDecision ===
        "Resolved";


if (
    !aiVerified &&
    !adminOverridden
) {

    throw new Error(
        "Complaint has not been verified by AI or approved by an administrator"
    );

}

if (!complaint.resolution.isResolved) {

    throw new Error(
        "AI verification did not confirm that the complaint is resolved"
    );

}

if (
    complaint.resolution.verificationScore < 80
) {

    throw new Error(
        "AI verification score is too low to close the complaint"
    );

}

        /* ========================================================
           CITIZEN CONFIRMATION CHECK
        ======================================================== */

        if (
            !complaint.feedback.confirmed
        ) {

            throw new Error(
                "Citizen has not confirmed the resolution"
            );

        }


        /* ========================================================
           CLOSE COMPLAINT
        ======================================================== */

        complaint.status =
            "Closed";

        complaint.resolution.adminVerified =
            true;

        complaint.resolution.resolvedAt =
            complaint.resolution.resolvedAt ||
            new Date();


        /* ========================================================
           ACTUAL COMPLETION TIME
        ======================================================== */

        const createdAt =
            new Date(
                complaint.createdAt
            );

        const closedAt =
            new Date();

        const completionHours =
            (
                closedAt - createdAt
            ) /
            (
                1000 * 60 * 60
            );

        complaint.analytics.actualCompletionHours =
            Number(
                completionHours.toFixed(2)
            );


        /* ========================================================
           ADMIN AUDIT
        ======================================================== */

        complaint.audit.updatedBy =
            admin._id;


        await complaint.save();


        /* ========================================================
           UPDATE WORKER PERFORMANCE
        ======================================================== */

        const workerId =
            complaint.assignment?.worker;

        if (workerId) {

            const worker =
                await User.findById(
                    workerId
                );

            if (worker) {

                worker.workload =
                    Math.max(
                        0,
                        worker.workload - 1
                    );

                worker.performance.activeComplaints =
                    Math.max(
                        0,
                        worker.performance.activeComplaints - 1
                    );

                worker.performance.totalResolved += 1;


                const totalAssigned =
                    worker.performance.totalAssigned;

                if (
                    totalAssigned > 0
                ) {

                    worker.performance.averageResolutionHours =
                        (
                            (
                                worker.performance.averageResolutionHours *
                                Math.max(
                                    0,
                                    totalAssigned - 1
                                )
                            ) +
                            completionHours
                        ) /
                        totalAssigned;

                }


                worker.availability =
                    "Available";


                await worker.save();

            }

        }


        /* ========================================================
           UPDATE DEPARTMENT PERFORMANCE
        ======================================================== */

        const departmentId =
            complaint.assignment?.department;

        if (departmentId) {

            const department =
                await Department.findById(
                    departmentId
                );

            if (department) {

                department.performance.resolvedComplaints += 1;

                department.performance.inProgressComplaints =
                    Math.max(
                        0,
                        department.performance.inProgressComplaints - 1
                    );

                department.performance.averageResolutionHours =
                    completionHours;

                await department.save();

            }

        }


        /* ========================================================
           TIMELINE
        ======================================================== */

        await TimelineService.log({

            complaint:
                complaint._id,

            eventType:
                "Complaint Closed",

            performerRole:
                "Admin",

            performedBy:
                admin._id,

            status:
                "Closed",

            description:
                "Administrator reviewed the AI verification and citizen confirmation and permanently closed the complaint.",

            remarks,

            metadata: {

                aiVerified:
                    complaint.resolution.aiVerified,

                citizenConfirmed:
                    complaint.feedback.confirmed,

                verificationScore:
                    complaint.resolution.verificationScore,

                actualCompletionHours:
                    complaint.analytics.actualCompletionHours

            }

        });


        /* ========================================================
           NOTIFY CITIZEN
        ======================================================== */

        const citizen =
            await User.findById(
                complaint.citizen
            );

        if (citizen) {

            await NotificationService.send({

                recipient:
                    citizen._id,

                recipientClerkId:
                    citizen.clerkId,

                complaint:
                    complaint._id,

                title:
                    "Complaint Closed",

                message:
                    `Your complaint ${complaint.complaintNumber} has been officially closed after verification.`,

                type:
                    "Complaint Closed",

                priority:
                    "Medium",

                actionUrl:
                    `/complaints/${complaint._id}`,

                icon:
                    "check-circle"

            });

        }


        /* ========================================================
           NOTIFY WORKER
        ======================================================== */

        if (workerId) {

            const worker =
                await User.findById(
                    workerId
                );

            if (worker) {

                await NotificationService.send({

                    recipient:
                        worker._id,

                    recipientClerkId:
                        worker.clerkId,

                    complaint:
                        complaint._id,

                    title:
                        "Complaint Closed",

                    message:
                        `Complaint ${complaint.complaintNumber} has been officially closed.`,

                    type:
                        "Complaint Closed",

                    priority:
                        "Medium",

                    actionUrl:
                        `/worker/complaints/${complaint._id}`,

                    icon:
                        "check-circle"

                });

            }

        }


        return complaint;

    }

}


module.exports =
    AdminService;