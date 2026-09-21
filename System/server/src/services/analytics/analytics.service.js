const Complaint = require("../../models/Complaint");
const User = require("../../models/User");
const WorkerAssignment = require("../../models/WorkerAssignment");
const Feedback = require("../../models/Feedback");
const Department = require("../../models/Department");

class AnalyticsService {

    /* ============================================================
       OVERVIEW
    ============================================================ */

    static async getOverview() {

        const [
            totalComplaints,
            totalUsers,
            totalWorkers,
            totalDepartments,
            resolvedComplaints,
            pendingComplaints
        ] = await Promise.all([

            Complaint.countDocuments(),

            User.countDocuments(),

            User.countDocuments({

                role: "Worker"

            }),

            Department.countDocuments(),

            Complaint.countDocuments({

                status: "Resolved"

            }),

            Complaint.countDocuments({

                status: "Pending"

            })

        ]);

        return {

            totalComplaints,

            totalUsers,

            totalWorkers,

            totalDepartments,

            resolvedComplaints,

            pendingComplaints

        };

    }

    /* ============================================================
       MONTHLY TREND
    ============================================================ */

    static async getMonthlyTrend() {

        return Complaint.aggregate([

            {

                $group: {

                    _id: {

                        year: {

                            $year: "$createdAt"

                        },

                        month: {

                            $month: "$createdAt"

                        }

                    },

                    complaints: {

                        $sum: 1

                    }

                }

            },

            {

                $sort: {

                    "_id.year": 1,

                    "_id.month": 1

                }

            }

        ]);

    }

    /* ============================================================
       CATEGORY DISTRIBUTION
    ============================================================ */

    static async getCategoryDistribution() {

        return Complaint.aggregate([

            {

                $group: {

                    _id: "$category",

                    total: {

                        $sum: 1

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
       STATUS DISTRIBUTION
    ============================================================ */

    static async getStatusDistribution() {

        return Complaint.aggregate([

            {

                $group: {

                    _id: "$status",

                    total: {

                        $sum: 1

                    }

                }

            }

        ]);

    }

    /* ============================================================
       PRIORITY DISTRIBUTION
    ============================================================ */

    static async getPriorityDistribution() {

        return Complaint.aggregate([

            {

                $group: {

                    _id: "$priority",

                    total: {

                        $sum: 1

                    }

                }

            }

        ]);

    }

    /* ============================================================
       DEPARTMENT PERFORMANCE
    ============================================================ */

    static async getDepartmentPerformance() {

        return Department.find()

            .select(

                "name performance"

            );

    }

    /* ============================================================
       WORKER PERFORMANCE
    ============================================================ */

    static async getWorkerPerformance() {

        return User.find({

            role: "Worker"

        })

        .select(

            "fullName workload performance"

        )

        .sort({

            "performance.rating": -1

        });

    }

    /* ============================================================
       FEEDBACK ANALYTICS
    ============================================================ */

    static async getFeedbackAnalytics() {

        return Feedback.aggregate([

            {

                $group: {

                    _id: null,

                    averageRating: {

                        $avg: "$overallRating"

                    },

                    totalFeedbacks: {

                        $sum: 1

                    }

                }

            }

        ]);

    }

    /* ============================================================
       HEAT MAP
    ============================================================ */

    static async getHeatMap() {

        return Complaint.find(

            {},

            {

                location: 1,

                category: 1,

                priority: 1

            }

        );

    }

    /* ============================================================
       COMPLETE ANALYTICS
    ============================================================ */

    static async getAnalytics() {

        const [

            overview,

            monthly,

            category,

            status,

            priority,

            departments,

            workers,

            feedback,

            heatmap

        ] = await Promise.all([

            this.getOverview(),

            this.getMonthlyTrend(),

            this.getCategoryDistribution(),

            this.getStatusDistribution(),

            this.getPriorityDistribution(),

            this.getDepartmentPerformance(),

            this.getWorkerPerformance(),

            this.getFeedbackAnalytics(),

            this.getHeatMap()

        ]);

        return {

            overview,

            monthly,

            category,

            status,

            priority,

            departments,

            workers,

            feedback,

            heatmap

        };

    }

}

module.exports = AnalyticsService;