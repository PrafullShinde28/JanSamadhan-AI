const express=require("express");

const router=express.Router();

const ReportController=

require("../controllers/report.controller");

router.get(

"/complaints",

ReportController.complaintCSV

);

module.exports=router;