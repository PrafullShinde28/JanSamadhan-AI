const AdminService =
    require("../../services/admin/admin.service");


class AdminController {

/* ============================================================
   OVERRIDE AI RESOLUTION
============================================================ */

static async overrideResolution(
    req,
    res
) {

    try {

        const {
            decision,
            reason = ""
        } = req.body;


        if (!decision) {

            return res.status(400).json({

                success: false,

                message:
                    "decision is required"

            });

        }


        const complaint =
            await AdminService.overrideResolution(

                req.params.id,

                req.user,

                decision,

                reason

            );


        return res.status(200).json({

            success: true,

            message:
                "AI resolution overridden successfully",

            data:
                complaint

        });

    }

    catch (error) {

        console.error(
            "❌ Admin Resolution Override Error:",
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
   ADMIN DASHBOARD ANALYTICS
============================================================ */

static async dashboardAnalytics(req, res) {

    try {

        const data =
            await AdminService.getDashboardAnalytics(
                req.user
            );

        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Admin Analytics Error:",
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
   GET ALL COMPLAINTS
============================================================ */

static async getComplaints(req, res) {

    try {

        const data =
            await AdminService.getComplaints({

                page:
                    req.query.page,

                limit:
                    req.query.limit,

                status:
                    req.query.status,

                priority:
                    req.query.priority,

                category:
                    req.query.category,

                department:
                    req.query.department,

                search:
                    req.query.search

            });


        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Admin Complaints Error:",
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
   GET COMPLAINT DETAILS
============================================================ */

static async getComplaintDetails(
    req,
    res
) {

    try {

        const data =
            await AdminService.getComplaintDetails(

                req.params.id,

                req.user

            );


        return res.status(200).json({

            success: true,

            data

        });

    } catch (error) {

        console.error(
            "❌ Admin Complaint Details Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}

    static async overridePriority(req, res) {

    try {

        const {
            priority,
            reason = ""
        } = req.body;


        if (!priority) {

            return res.status(400).json({

                success: false,

                message:
                    "priority is required"

            });

        }


        const complaint =
            await AdminService.overridePriority(

                req.params.id,

                req.user,

                priority,

                reason

            );


        return res.status(200).json({

            success: true,

            message:
                "Complaint priority overridden successfully",

            data:
                complaint

        });

    } catch (error) {

        console.error(
            "❌ Admin Priority Override Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}

    static async overrideDepartment(req, res) {

    try {

        const {
            departmentId,
            reason = ""
        } = req.body;


        if (!departmentId) {

            return res.status(400).json({

                success: false,

                message:
                    "departmentId is required"

            });

        }


        const complaint =
            await AdminService.overrideDepartment(

                req.params.id,

                req.user,

                departmentId,

                reason

            );


        return res.status(200).json({

            success: true,

            message:
                "Department overridden successfully",

            data:
                complaint

        });

    } catch (error) {

        console.error(
            "❌ Admin Department Override Error:",
            error
        );

        return res.status(400).json({

            success: false,

            message:
                error.message

        });

    }

}


    static async reassignWorker(req, res) {

    try {

        const {
            workerId,
            reason = ""
        } = req.body;

        if (!workerId) {

            return res.status(400).json({

                success: false,

                message:
                    "workerId is required"

            });

        }

        const complaint =
            await AdminService.reassignWorker(

                req.params.id,

                req.user,

                workerId,

                reason

            );

        return res.status(200).json({

            success: true,

            message:
                "Worker reassigned successfully",

            data:
                complaint

        });

    } catch (error) {

        console.error(
            "❌ Admin Reassignment Error:",
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
       CLOSE COMPLAINT
    ============================================================ */

    static async closeComplaint(
        req,
        res
    ) {

        try {

            const complaint =
                await AdminService.closeComplaint(

                    req.params.id,

                    req.user,

                    req.body.remarks || ""

                );


            return res.status(200).json({

                success: true,

                message:
                    "Complaint closed successfully.",

                data:
                    complaint

            });

        }

        catch (error) {

            console.error(
                "❌ Admin Close Error:",
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
    AdminController;