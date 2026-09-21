const Complaint = require("../../models/Complaint");
const User = require("../../models/User");
const Department = require("../../models/Department");

class AdminAnalyticsService {

    /* ============================================================
   AI PERFORMANCE
============================================================ */

static async getAIAnalytics() {

    const [

        processed,

        duplicates,

        verified,

        rejected,

        confidence

    ] = await Promise.all([

        Complaint.countDocuments({
            isActive: true,
            "ai.processed": true
        }),

        Complaint.countDocuments({
            isActive: true,
            "ai.duplicateDetected": true
        }),

        Complaint.countDocuments({
            isActive: true,
            "resolution.aiVerified": true
        }),

        Complaint.countDocuments({
            isActive: true,
            "resolution.aiVerified": false,
            "resolution.isResolved": true
        }),

        Complaint.aggregate([

            {
                $match: {
                    isActive: true,
                    "ai.processed": true
                }
            },

            {
                $group: {

                    _id: null,

                    averageConfidence: {
                        $avg: "$ai.confidence"
                    }

                }

            }

        ])

    ]);

    return {

        totalProcessed: processed,

        duplicateDetected: duplicates,

        verifiedResolutions: verified,

        rejectedResolutions: rejected,

        averageConfidence:
            Number(
                (confidence[0]?.averageConfidence || 0)
                    .toFixed(2)
            )

    };

}

/* ============================================================
   RESOLUTION ANALYTICS
============================================================ */

static async getResolutionAnalytics() {

    const result =
        await Complaint.aggregate([

            {
                $match: {
                    isActive: true
                }
            },

            {
                $group: {

                    _id: null,

                    averageCompletionHours: {
                        $avg:
                            "$analytics.actualCompletionHours"
                    },

                    averageResponseMinutes: {
                        $avg:
                            "$analytics.responseTimeMinutes"
                    },

                    totalResolved: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "Resolved"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    totalClosed: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "Closed"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    totalReopened: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$feedback.reopenRequested",
                                        true
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    aiVerified: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$resolution.aiVerified",
                                        true
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    citizenConfirmed: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$feedback.confirmed",
                                        true
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    total: {
                        $sum: 1
                    }

                }

            }

        ]);

    const data = result[0] || {};

    const total =
        data.total || 0;

    return {

        averageCompletionHours:
            Number(
                (data.averageCompletionHours || 0)
                    .toFixed(2)
            ),

        averageResponseMinutes:
            Number(
                (data.averageResponseMinutes || 0)
                    .toFixed(2)
            ),

        totalResolved:
            data.totalResolved || 0,

        totalClosed:
            data.totalClosed || 0,

        totalReopened:
            data.totalReopened || 0,

        aiVerificationRate:
            total
                ? Number(
                    (
                        data.aiVerified /
                        total *
                        100
                    ).toFixed(2)
                )
                : 0,

        citizenConfirmationRate:
            total
                ? Number(
                    (
                        data.citizenConfirmed /
                        total *
                        100
                    ).toFixed(2)
                )
                : 0

    };

}

/* ============================================================
   COMPLAINT TRENDS
============================================================ */

static async getComplaintTrends(days = 30) {

    const startDate =
        new Date();

    startDate.setDate(
        startDate.getDate() -
        Number(days)
    );

    return Complaint.aggregate([

        {
            $match: {

                isActive: true,

                createdAt: {
                    $gte: startDate
                }

            }

        },

        {
            $group: {

                _id: {
                    $dateToString: {
                        format: "%Y-%m-%d",
                        date: "$createdAt"
                    }
                },

                total: {
                    $sum: 1
                },

                resolved: {
                    $sum: {
                        $cond: [
                            {
                                $in: [
                                    "$status",
                                    [
                                        "Resolved",
                                        "Closed"
                                    ]
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                pending: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "Pending"
                                ]
                            },
                            1,
                            0
                        ]
                    }
                },

                inProgress: {
                    $sum: {
                        $cond: [
                            {
                                $eq: [
                                    "$status",
                                    "In Progress"
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }

            }

        },

        {
            $sort: {
                _id: 1
            }
        }

    ]);

}


    /* ============================================================
       OVERVIEW
    ============================================================ */

    static async getOverview() {

        const [

            totalComplaints,

            pendingComplaints,

            assignedComplaints,

            inProgressComplaints,

            resolvedComplaints,

            closedComplaints,

            reopenedComplaints,

            duplicateComplaints

        ] = await Promise.all([

            Complaint.countDocuments({
                isActive: true
            }),

            Complaint.countDocuments({
                isActive: true,
                status: "Pending"
            }),

            Complaint.countDocuments({
                isActive: true,
                status: "Assigned"
            }),

            Complaint.countDocuments({
                isActive: true,
                status: "In Progress"
            }),

            Complaint.countDocuments({
                isActive: true,
                status: "Resolved"
            }),

            Complaint.countDocuments({
                isActive: true,
                status: "Closed"
            }),

            Complaint.countDocuments({
                isActive: true,
                "feedback.reopenRequested": true
            }),

            Complaint.countDocuments({
                isActive: true,
                "ai.duplicateDetected": true
            })

        ]);


        return {

            totalComplaints,

            pendingComplaints,

            assignedComplaints,

            inProgressComplaints,

            resolvedComplaints,

            closedComplaints,

            reopenedComplaints,

            duplicateComplaints

        };

    }


    /* ============================================================
       CATEGORY ANALYTICS
    ============================================================ */

    static async getCategoryAnalytics() {

        return Complaint.aggregate([

            {
                $match: {
                    isActive: true
                }
            },

            {
                $group: {

                    _id: "$category",

                    total: {
                        $sum: 1
                    },

                    pending: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "Pending"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    inProgress: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "In Progress"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    resolved: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "Resolved"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    closed: {
                        $sum: {
                            $cond: [
                                {
                                    $eq: [
                                        "$status",
                                        "Closed"
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }

                }

            },

            {
                $sort: {
                    total: -1
                }
            }

        ]);

    }


    /* ============================================================
       PRIORITY ANALYTICS
    ============================================================ */

    static async getPriorityAnalytics() {

        return Complaint.aggregate([

            {
                $match: {
                    isActive: true
                }
            },

            {
                $group: {

                    _id: "$priority",

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

    }


    /* ============================================================
       DEPARTMENT PERFORMANCE
    ============================================================ */

    static async getDepartmentPerformance() {

        return Department.find({

            isActive: true

        }).select(

            "name code performance aiSettings"

        ).lean();

    }


    /* ============================================================
       WORKER PERFORMANCE
    ============================================================ */

    static async getWorkerPerformance() {

        return User.find({

            role: "Worker",

            isActive: true

        }).select(

            "firstName lastName fullName department availability workload performance skills"

        ).populate(

            "department",
            "name code"

        ).lean();

    }


    /* ============================================================
       RECENT COMPLAINTS
    ============================================================ */

    static async getRecentComplaints(
        limit = 20
    ) {

        return Complaint.find({

            isActive: true

        })

        .populate(
            "citizen",
            "name email"
        )

        .populate(
            "assignment.department",
            "name code"
        )

        .populate(
            "assignment.worker",
            "fullName"
        )

        .sort({

            createdAt: -1

        })

        .limit(
            Number(limit)
        )

        .lean();

    }

}


module.exports =
    AdminAnalyticsService;