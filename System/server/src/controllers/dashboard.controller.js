const DashboardService = require("../services/dashboard/dashboard.service");

class DashboardController {

    /* ============================================================
       ADMIN DASHBOARD
    ============================================================ */

    static async getAdminDashboard(req, res, next) {

        try {

            const dashboard =
                await DashboardService.getAdminDashboard();

            return res.status(200).json({

                success: true,

                data: dashboard

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       CITIZEN DASHBOARD
    ============================================================ */

    static async getCitizenDashboard(req, res, next) {

        try {

            const dashboard =
                await DashboardService.getCitizenDashboard(
                    req.user.clerkId
                );

            return res.status(200).json({

                success: true,

                data: dashboard

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       WORKER DASHBOARD
    ============================================================ */

    static async getWorkerDashboard(req, res, next) {

        try {

            const dashboard =
                await DashboardService.getWorkerDashboard(
                    req.user._id
                );

            return res.status(200).json({

                success: true,

                data: dashboard

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       DEPARTMENT DASHBOARD
    ============================================================ */

    static async getDepartmentDashboard(req, res, next) {

        try {

            const dashboard =
                await DashboardService.getDepartmentDashboard(
                    req.params.departmentId
                );

            return res.status(200).json({

                success: true,

                data: dashboard

            });

        } catch (error) {

            next(error);

        }

    }

    /* ============================================================
       PUBLIC SUMMARY (LANDING PAGE)
    ============================================================ */
    static async getPublicSummary(req, res, next) {
        try {
            const summary = await DashboardService.getPublicSummary();
            return res.status(200).json({
                success: true,
                data: summary
            });
        } catch (error) {
            next(error);
        }
    }

}

module.exports = DashboardController;