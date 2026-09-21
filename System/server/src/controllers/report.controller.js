const ReportService =
require("../services/report/report.service");

class ReportController {

    static async complaintCSV(req,res,next){

        try{

            const report=

            await ReportService.generateComplaintReport();

            res.download(report.file);

        }

        catch(err){

            next(err);

        }

    }

}

module.exports=ReportController;