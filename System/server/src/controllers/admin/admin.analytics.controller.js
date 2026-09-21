const AdminAnalyticsService =
    require("../../services/admin/admin.analytics.service");

class AdminAnalyticsController {

   static async ai(req, res) {

    try {

        const data =
            await AdminAnalyticsService
                .getAIAnalytics();

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "❌ AI Analytics Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}


static async resolution(req, res) {

    try {

        const data =
            await AdminAnalyticsService
                .getResolutionAnalytics();

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "❌ Resolution Analytics Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

}


static async trends(req, res) {

    try {

        const days =
            req.query.days || 30;

        const data =
            await AdminAnalyticsService
                .getComplaintTrends(days);

        return res.json({
            success: true,
            data
        });

    } catch (error) {

        console.error(
            "❌ Trend Analytics Error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: error.message
        });

    }

} 
    /* ============================================================
       OVERVIEW
    ============================================================ */

    static async overview(req, res) {

        try {

            const data =
                await AdminAnalyticsService.getOverview();

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "❌ Admin Overview Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }


    /* ============================================================
       CATEGORY
    ============================================================ */

    static async categories(req, res) {

        try {

            const data =
                await AdminAnalyticsService
                    .getCategoryAnalytics();

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "❌ Category Analytics Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }


    /* ============================================================
       PRIORITY
    ============================================================ */

    static async priorities(req, res) {

        try {

            const data =
                await AdminAnalyticsService
                    .getPriorityAnalytics();

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "❌ Priority Analytics Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }


    /* ============================================================
       DEPARTMENTS
    ============================================================ */

    static async departments(req, res) {

        try {

            const data =
                await AdminAnalyticsService
                    .getDepartmentPerformance();

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "❌ Department Analytics Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }


    /* ============================================================
       WORKERS
    ============================================================ */

    static async workers(req, res) {

        try {

            const data =
                await AdminAnalyticsService
                    .getWorkerPerformance();

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "❌ Worker Analytics Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }


    /* ============================================================
       RECENT COMPLAINTS
    ============================================================ */

    static async recent(req, res) {

        try {

            const limit =
                req.query.limit || 20;

            const data =
                await AdminAnalyticsService
                    .getRecentComplaints(limit);

            return res.status(200).json({

                success: true,

                data

            });

        } catch (error) {

            console.error(
                "❌ Recent Complaints Error:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message

            });

        }

    }

}


module.exports =
    AdminAnalyticsController;