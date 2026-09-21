const WorkerService = require("../../services/worker/worker.service");

class WorkerController {

/* ============================================================
   WORKER DASHBOARD
============================================================ */

static async dashboard(req, res) {

    try {

        const data =
            await WorkerService.getDashboard(
                req.user
            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Worker Dashboard Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}


/* ============================================================
   ASSIGNED COMPLAINTS
============================================================ */

static async assignedComplaints(req, res) {

    try {

        const data =
            await WorkerService.getAssignedComplaints(

                req.user,

                req.query.status || null

            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Worker Assigned Complaints Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}


/* ============================================================
   COMPLAINT DETAILS
============================================================ */

static async complaintDetails(req, res) {

    try {

        const data =
            await WorkerService.getComplaintDetails(

                req.params.id,

                req.user

            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Worker Complaint Details Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}


/* ============================================================
   COMPLAINT TIMELINE
============================================================ */

static async complaintTimeline(req, res) {

    try {

        const data =
            await WorkerService.getComplaintTimeline(

                req.params.id,

                req.user

            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Worker Timeline Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}


static async submitResolution(req, res) {

    try {

        const result =
            await WorkerService.submitResolution(

                req.params.id,

                req.user,

                {
                    remarks:
                        req.body.remarks,

                    latitude:
                        req.body.latitude,

                    longitude:
                        req.body.longitude,

                    address:
                        req.body.address
                },

                req.file

            );


        return res.status(200).json({

            success: true,

            message:
                result.verification.isResolved
                    ? "Resolution submitted and AI verified successfully."
                    : "Resolution submitted. AI verification indicates that the issue is not yet resolved.",

            data: result

        });

    } catch (error) {

        console.error(
            "❌ Resolution Submission Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}

/* ============================================================
   UPDATE PROGRESS
============================================================ */

static async updateProgress(req, res) {

    try {

        const complaint =
            await WorkerService.updateProgress(

                req.params.id,

                req.user,

                {

                    remarks:
                        req.body.remarks,

                    latitude:
                        req.body.latitude,

                    longitude:
                        req.body.longitude,

                    address:
                        req.body.address

                },

                req.file

            );


        return res.status(200).json({

            success: true,

            message:
                "Complaint progress updated successfully",

            data:
                complaint

        });

    } catch (error) {

        console.error(
            "❌ Worker Progress Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}

/* ============================================================
   REACH COMPLAINT LOCATION
============================================================ */

static async reachComplaintLocation(req, res) {

    try {

        const result =
            await WorkerService.reachComplaintLocation(

                req.params.id,

                req.user,

                {

                    latitude:
                        req.body.latitude,

                    longitude:
                        req.body.longitude,

                    address:
                        req.body.address

                }

            );


        return res.status(200).json({

            success: true,

            message:
                "Worker reached complaint location",

            data: result

        });

    } catch (error) {

        console.error(
            "❌ Worker Reach Location Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}    

    /* ============================================================
   START COMPLAINT
============================================================ */

static async startComplaint(req, res) {

    try {

        const complaint =
            await WorkerService.startComplaint(

                req.params.id,

                req.user

            );


        return res.status(200).json({

            success: true,

            message:
                "Complaint work started successfully",

            data:
                complaint

        });

    } catch (error) {

        console.error(
            "❌ Worker Start Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}

    /* ============================================================
       ACCEPT COMPLAINT
    ============================================================ */

    static async acceptComplaint(req, res) {

        try {

            const complaint =
                await WorkerService.acceptComplaint(
                    req.params.id,
                    req.user
                );

            return res.status(200).json({

                success: true,

                message:
                    "Complaint accepted successfully",

                data: complaint

            });

        } catch (error) {

            console.error(
                "❌ Worker Accept Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }


    /* ============================================================
       REJECT COMPLAINT
    ============================================================ */

    static async rejectComplaint(req, res) {

        try {

            const {
                reason = ""
            } = req.body;


            const complaint =
                await WorkerService.rejectComplaint(

                    req.params.id,

                    req.user,

                    reason

                );


            return res.status(200).json({

                success: true,

                message:
                    "Complaint rejected successfully",

                data: complaint

            });

        } catch (error) {

            console.error(
                "❌ Worker Reject Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message: error.message

            });

        }

    }

    /* ============================================================
       UPDATE DUTY STATUS (AVAILABILITY)
    ============================================================ */
    static async updateDutyStatus(req, res) {
        try {
            const { availability } = req.body;
            if (!availability) {
                return res.status(400).json({
                    success: false,
                    message: "availability is required"
                });
            }

            const updatedUser = await WorkerService.updateDutyStatus(
                req.user,
                availability
            );

            return res.status(200).json({
                success: true,
                message: `Duty status updated to ${availability}`,
                data: updatedUser
            });
        } catch (error) {
            console.error("❌ Update Duty Status Error:", error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }

}

module.exports = WorkerController;