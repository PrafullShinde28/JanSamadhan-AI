const express = require("express");

const router = express.Router();

const ComplaintController =
    require("../controllers/complaint.controller");

const devAuthMiddleware =
    require("../middleware/devAuth.middleware");

const {
    singleImage
} = require("../middleware/upload.middleware");


router.post(
    "/",
    devAuthMiddleware,
    singleImage,
    ComplaintController.createComplaint
);


router.get(
    "/",
    devAuthMiddleware,
    ComplaintController.getComplaints
);


router.get(
    "/:id",
    devAuthMiddleware,
    ComplaintController.getComplaint
);


router.patch(
    "/:id/status",
    devAuthMiddleware,
    ComplaintController.updateStatus
);


router.post(
    "/:id/assign",
    devAuthMiddleware,
    ComplaintController.assignWorker
);


router.delete(
    "/:id",
    devAuthMiddleware,
    ComplaintController.deleteComplaint
);

console.log("✅ Complaint routes loaded");
module.exports = router;