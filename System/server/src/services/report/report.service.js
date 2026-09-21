const { createObjectCsvWriter } = require("csv-writer");
const path = require("path");
const fs = require("fs");

const Complaint = require("../../models/Complaint");

class ReportService {

    /* ============================================================
       COMPLAINT REPORT
    ============================================================ */

    static async generateComplaintReport() {

        const complaints = await Complaint.find()
            .populate("citizen", "fullName email")
            .populate("assignment.department", "name")
            .populate("assignment.worker", "fullName");

        if (!fs.existsSync("reports")) {

            fs.mkdirSync("reports");

        }

        const filePath = path.join(

            "reports",

            `complaints_${Date.now()}.csv`

        );

        const csvWriter = createObjectCsvWriter({

            path: filePath,

            header: [

                {

                    id: "complaintNumber",

                    title: "Complaint ID"

                },

                {

                    id: "title",

                    title: "Title"

                },

                {

                    id: "category",

                    title: "Category"

                },

                {

                    id: "priority",

                    title: "Priority"

                },

                {

                    id: "status",

                    title: "Status"

                },

                {

                    id: "department",

                    title: "Department"

                },

                {

                    id: "worker",

                    title: "Worker"

                },

                {

                    id: "citizen",

                    title: "Citizen"

                },

                {

                    id: "createdAt",

                    title: "Created"

                }

            ]

        });

        const records = complaints.map(c => ({

            complaintNumber: c.complaintNumber,

            title: c.title,

            category: c.category,

            priority: c.priority,

            status: c.status,

            department:

                c.assignment?.department?.name ||

                "",

            worker:

                c.assignment?.worker?.fullName ||

                "",

            citizen:

                c.citizen?.fullName ||

                "",

            createdAt:

                c.createdAt.toISOString()

        }));

        await csvWriter.writeRecords(records);

        return {

            success: true,

            file: filePath

        };

    }

    /* ============================================================
       DEPARTMENT REPORT
    ============================================================ */

    static async generateDepartmentReport() {

        const data = await Complaint.aggregate([

            {

                $group: {

                    _id: "$assignment.department",

                    total: {

                        $sum: 1

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

                    }

                }

            }

        ]);

        return data;

    }

    /* ============================================================
       STATUS REPORT
    ============================================================ */

    static async generateStatusReport() {

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

}

module.exports = ReportService;