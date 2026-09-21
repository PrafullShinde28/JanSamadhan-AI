const CitizenService =
    require("../../services/citizen/citizen.service");
const crypto = require("crypto");
const CaptureSession = require("../../models/CaptureSession");

class CitizenController {

    static async createCaptureSession(req, res) {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    message: "Authentication context is required"
                });
            }

            const captureSessionId = crypto.randomBytes(16).toString("hex");
            const nonce = crypto.randomBytes(12).toString("hex");
            const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

            const session = await CaptureSession.create({
                citizen: req.user._id,
                captureSessionId,
                nonce,
                expiresAt,
            });

            return res.status(201).json({
                success: true,
                data: {
                    captureSessionId: session.captureSessionId,
                    nonce: session.nonce,
                    expiresAt: session.expiresAt
                }
            });
        } catch (error) {
            console.error("❌ Create Capture Session Error:", error);
            return res.status(400).json({
                success: false,
                message: error.message
            });
        }
    }


    static async getMyComplaints(req, res) {

    try {

        const data =
            await CitizenService.getMyComplaints(
                req.user
            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Citizen Complaints Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }
}


static async getComplaintDetails(req, res) {

    try {

        const data =
            await CitizenService.getComplaintDetails(
                req.params.id,
                req.user
            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Citizen Complaint Details Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }
}


static async getComplaintTimeline(req, res) {

    try {

        const data =
            await CitizenService.getComplaintTimeline(
                req.params.id,
                req.user
            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Citizen Timeline Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message: error.message

        });

    }
}

    static async reopenComplaint(req, res) {

    try {

        const {
            reason = ""
        } = req.body;


        const complaint =
            await CitizenService.reopenComplaint(

                req.params.id,

                req.user,

                reason

            );


        return res.status(200).json({

            success: true,

            message:
                "Complaint reopened successfully",

            data:
                complaint

        });

    } catch (error) {

        console.error(
            "❌ Citizen Reopen Error:",
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
       SUBMIT FEEDBACK
    ============================================================ */

    static async submitFeedback(
        req,
        res
    ) {

        try {

            const complaint =
                await CitizenService.submitFeedback(

                    req.params.id,

                    req.user,

                    {

                        confirmed:
                            req.body.confirmed,

                        rating:
                            req.body.rating,

                        comment:
                            req.body.comment

                    }

                );


            return res.status(200).json({

                success: true,

                message:
                    complaint.feedback.confirmed

                        ? "Feedback submitted successfully. Admin verification is required before final closure."

                        : "Complaint reopened successfully. The worker has been notified.",

                data:
                    complaint

            });

        }

        catch (error) {

            console.error(
                "❌ Citizen Feedback Error:",
                error
            );

            return res.status(400).json({

                success: false,

                message:
                    error.message

            });

        }

    }

}

module.exports =
    CitizenController;