const cron = require("node-cron");

const ReportService =
require("../services/report/report.service");

module.exports = () => {

    cron.schedule(

        "0 0 * * 1",

        async () => {

            console.log(

                "Generating Weekly Report..."

            );

            await ReportService.generateComplaintReport();

            console.log(

                "Weekly Report Generated"

            );

        }

    );

};