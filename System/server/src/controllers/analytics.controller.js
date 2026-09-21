const AnalyticsService =
require("../services/analytics/analytics.service");

class AnalyticsController {

    static async getAnalytics(req,res,next){

        try{

            const analytics=

            await AnalyticsService.getAnalytics();

            res.json({

                success:true,

                data:analytics

            });

        }

        catch(err){

            next(err);

        }

    }

}

module.exports=AnalyticsController;