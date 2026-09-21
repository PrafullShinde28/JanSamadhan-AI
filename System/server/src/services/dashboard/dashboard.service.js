const Complaint = require("../../models/Complaint");
const User = require("../../models/User");
const Department = require("../../models/Department");
const WorkerAssignment = require("../../models/WorkerAssignment");
const Feedback = require("../../models/Feedback");

class DashboardService {

    /* ============================================================
       ADMIN DASHBOARD
    ============================================================ */

    static async getAdminDashboard() {

        const [
            complaintStats,
            categoryStats,
            monthlyStats,
            workerStats,
            departmentStats,
            recentComplaints
        ] = await Promise.all([

            /* -----------------------------
               Complaint Statistics
            ----------------------------- */

            Complaint.aggregate([
                {
                    $group: {
                        _id: null,
                        totalComplaints: { $sum: 1 },
                        pending: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Pending"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        assigned: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Assigned"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        inProgress: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "In Progress"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        resolved: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Resolved"] },
                                    1,
                                    0
                                ]
                            }
                        },
                        closed: {
                            $sum: {
                                $cond: [
                                    { $eq: ["$status", "Closed"] },
                                    1,
                                    0
                                ]
                            }
                        }
                    }
                }
            ]),

            /* -----------------------------
               Category Distribution
            ----------------------------- */

            Complaint.aggregate([
                {
                    $group: {
                        _id: "$category",
                        total: { $sum: 1 }
                    }
                },
                {
                    $sort: {
                        total: -1
                    }
                }
            ]),

            /* -----------------------------
               Monthly Trend
            ----------------------------- */

            Complaint.aggregate([
                {
                    $group: {
                        _id: {
                            month: {
                                $month: "$createdAt"
                            },
                            year: {
                                $year: "$createdAt"
                            }
                        },
                        total: {
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
            ]),

            /* -----------------------------
               Worker Performance
            ----------------------------- */

            User.find({
                role: "Worker"
            })
            .select(
                "fullName performance workload availability"
            )
            .sort({
                "performance.rating": -1
            }),

            /* -----------------------------
               Department Performance
            ----------------------------- */

            Department.find()
            .select(
                "name performance activeWorkers"
            ),

            /* -----------------------------
               Recent Complaints
            ----------------------------- */

            Complaint.find()
            .sort({
                createdAt: -1
            })
            .limit(10)

        ]);

        return {

            complaintStats:
                complaintStats[0] || {},

            categoryStats,

            monthlyStats,

            workerStats,

            departmentStats,

            recentComplaints

        };

    }

    /* ============================================================
       CITIZEN DASHBOARD
    ============================================================ */

    static async getCitizenDashboard(clerkId) {

        const complaints =
            await Complaint.find({

                clerkUserId: clerkId

            });

        const stats = {

            total: complaints.length,

            pending:
                complaints.filter(
                    c => c.status === "Pending"
                ).length,

            assigned:
                complaints.filter(
                    c => c.status === "Assigned"
                ).length,

            inProgress:
                complaints.filter(
                    c => c.status === "In Progress"
                ).length,

            resolved:
                complaints.filter(
                    c => c.status === "Resolved"
                ).length,

            closed:
                complaints.filter(
                    c => c.status === "Closed"
                ).length

        };

        return {

            stats,

            complaints

        };

    }

    /* ============================================================
       WORKER DASHBOARD
    ============================================================ */

    static async getWorkerDashboard(workerId) {

        const assignments =
            await WorkerAssignment.find({

                worker: workerId,

                isActive: true

            })

            .populate("complaint")

            .sort({

                assignedAt: -1

            });

        const stats = {

            total: assignments.length,

            pending:
                assignments.filter(
                    a => a.status === "Pending"
                ).length,

            accepted:
                assignments.filter(
                    a => a.status === "Accepted"
                ).length,

            inProgress:
                assignments.filter(
                    a => a.status === "In Progress"
                ).length,

            completed:
                assignments.filter(
                    a => a.status === "Completed"
                ).length

        };

        return {

            stats,

            assignments

        };

    }

    /* ============================================================
       DEPARTMENT DASHBOARD
    ============================================================ */

    static async getDepartmentDashboard(
        departmentId
    ) {

        const complaints =
            await Complaint.find({

                "assignment.department":
                    departmentId

            });

        return {

            totalComplaints:
                complaints.length,

            pending:
                complaints.filter(
                    c => c.status === "Pending"
                ).length,

            assigned:
                complaints.filter(
                    c => c.status === "Assigned"
                ).length,

            inProgress:
                complaints.filter(
                    c => c.status === "In Progress"
                ).length,

            resolved:
                complaints.filter(
                    c => c.status === "Resolved"
                ).length,

            closed:
                complaints.filter(
                    c => c.status === "Closed"
                ).length

        };

    }

    /* ============================================================
       PUBLIC LANDING PAGE SUMMARY (REAL LIVE DATA)
    ============================================================ */
    static async getPublicSummary() {
        const [
            totalComplaints,
            resolvedComplaints,
            inProgressComplaints,
            pendingComplaints,
            totalWorkers,
            totalCitizens,
            departments,
            latestComplaint,
            recentComplaints
        ] = await Promise.all([
            Complaint.countDocuments(),
            Complaint.countDocuments({ status: { $in: ['Resolved', 'Closed'] } }),
            Complaint.countDocuments({ status: { $in: ['In Progress', 'Assigned'] } }),
            Complaint.countDocuments({ status: 'Pending' }),
            User.countDocuments({ role: 'Worker' }),
            User.countDocuments({ role: 'Citizen' }),
            Department.find({ isActive: { $ne: false } }).select('name code description email icon color'),
            Complaint.findOne().sort({ createdAt: -1 }).populate('assignment.department', 'name code').populate('citizen', 'fullName firstName lastName'),
            Complaint.find().sort({ createdAt: -1 }).limit(4).select('title category status priority location createdAt complaintImages aiData assignment').populate('assignment.department', 'name code')
        ]);

        const resolutionRate = totalComplaints > 0 
            ? Math.round((resolvedComplaints / totalComplaints) * 100) 
            : 0;


        return {
            stats: {
                totalComplaints,
                resolvedComplaints,
                inProgressComplaints,
                pendingComplaints,
                resolutionRate: Number(resolutionRate),
                totalWorkers,
                totalCitizens,
                totalDepartments: departments.length,
                avgResponseHours: '< 24h'
            },
            departments,
            latestComplaint,
            recentComplaints
        };
    }

}

module.exports = DashboardService;