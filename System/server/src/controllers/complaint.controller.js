const ComplaintService = require("../services/complaint/complaint.service");

/* ============================================================
   AI CATEGORY MAPPING
============================================================ */

const AI_CATEGORY_MAP = {
    Pothole: "Pothole",
    Garbage: "Garbage Overflow",
    WaterLeak: "Water Leakage",
    Streetlight: "Broken Streetlight",
    RoadDamage: "Road Damage",
    OpenManhole: "Open Manhole",
    FallenTree: "Fallen Tree",
};

/* ============================================================
   AI PRIORITY MAPPING
============================================================ */

const AI_PRIORITY_MAP = {
    Pothole: "Medium",
    Garbage: "Medium",
    WaterLeak: "High",
    Streetlight: "Medium",
    RoadDamage: "High",
    OpenManhole: "High",
    FallenTree: "High",
};

class ComplaintController {

    /* ========================================================
       CREATE COMPLAINT
    ======================================================== */

static async createComplaint(req, res, next) {

    try {

        const complaint =
            await ComplaintService.createComplaint(

                {
                    latitude:
                        req.body.latitude,

                    longitude:
                        req.body.longitude,

                    captureSessionId:
                        req.body.captureSessionId
                },

                req.user,

                req.file

            );

        return res.status(201).json({

            success: true,

            message:
                "Complaint created successfully",

            data:
                complaint

        });

    } catch (error) {

        next(error);

    }

}

    /* ========================================================
       GET ALL
    ======================================================== */

    static async getComplaints(req, res, next) {

        try {

            const complaints =
                await ComplaintService.getComplaints(
                    req.query
                );

            return res.status(200).json({

                success: true,

                data: complaints

            });

        } catch (error) {

            next(error);

        }

    }

    /* ========================================================
       GET SINGLE
    ======================================================== */

    static async getComplaint(req, res, next) {

        try {

            const complaint =
                await ComplaintService.getComplaintById(
                    req.params.id
                );

            if (!complaint) {

                return res.status(404).json({

                    success: false,

                    message:
                        "Complaint not found"

                });

            }

            return res.json({

                success: true,

                data: complaint

            });

        } catch (error) {

            next(error);

        }

    }

    /* ========================================================
       UPDATE STATUS
    ======================================================== */

    static async updateStatus(req, res, next) {

        try {

            const complaint =
                await ComplaintService.updateStatus(

                    req.params.id,

                    req.body.status,

                    req.user?._id,

                    req.body.remarks

                );

            return res.json({

                success: true,

                message:
                    "Status updated",

                data: complaint

            });

        } catch (error) {

            next(error);

        }

    }

    /* ========================================================
       ASSIGN WORKER
    ======================================================== */

    static async assignWorker(req, res, next) {

        try {

            const assignment =
                await ComplaintService.assignWorker({

                    complaintId:
                        req.params.id,

                    workerId:
                        req.body.worker,

                    departmentId:
                        req.body.department,

                    assignedBy:
                        req.user?._id,

                    assignmentType:
                        req.body.assignmentType

                });

            return res.json({

                success: true,

                message:
                    "Worker assigned successfully",

                data: assignment

            });

        } catch (error) {

            next(error);

        }

    }

    /* ========================================================
       DELETE
    ======================================================== */

    static async deleteComplaint(req, res, next) {

        try {

            await ComplaintService.deleteComplaint(
                req.params.id
            );

            return res.json({

                success: true,

                message:
                    "Complaint deleted"

            });

        } catch (error) {

            next(error);

        }

    }

}

module.exports = ComplaintController;