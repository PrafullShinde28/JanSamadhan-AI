const express =
    require("express");

const router =
    express.Router();

const CitizenController =
    require("../../controllers/citizen/citizen.controller");

const devAuthMiddleware =
    require("../../middleware/devAuth.middleware");


/* ============================================================
   SUBMIT CITIZEN FEEDBACK
============================================================ */
router.post(
    "/capture-session",
    devAuthMiddleware,
    CitizenController.createCaptureSession
);

router.get(
    "/complaints",
    devAuthMiddleware,
    CitizenController.getMyComplaints
);

router.get(
    "/complaints/:id",
    devAuthMiddleware,
    CitizenController.getComplaintDetails
);

router.get(
    "/complaints/:id/timeline",
    devAuthMiddleware,
    CitizenController.getComplaintTimeline
);

router.post(

    "/complaints/:id/feedback",

    devAuthMiddleware,

    CitizenController.submitFeedback

);
router.post(
    "/complaints/:id/reopen",
    devAuthMiddleware,
    CitizenController.reopenComplaint
);


module.exports =
    router;