const express = require("express");

const router = express.Router();
const upload = require("../../middleware/upload.middleware");
const WorkerController =
    require("../../controllers/worker/worker.controller");

const devAuthMiddleware =
    require("../../middleware/devAuth.middleware");


/* ============================================================
   WORKER DASHBOARD
============================================================ */

router.get(
    "/dashboard",
    devAuthMiddleware,
    WorkerController.dashboard
);


/* ============================================================
   ASSIGNED COMPLAINTS
============================================================ */

router.get(
    "/complaints",
    devAuthMiddleware,
    WorkerController.assignedComplaints
);


/* ============================================================
   COMPLAINT DETAILS
============================================================ */

router.get(
    "/complaints/:id",
    devAuthMiddleware,
    WorkerController.complaintDetails
);


/* ============================================================
   COMPLAINT TIMELINE
============================================================ */

router.get(
    "/complaints/:id/timeline",
    devAuthMiddleware,
    WorkerController.complaintTimeline
);

router.post(
    "/complaints/:id/resolve",
    devAuthMiddleware,
    upload.singleImage,
    WorkerController.submitResolution
);
/* ============================================================
   UPDATE COMPLAINT PROGRESS
============================================================ */

router.post(
    "/complaints/:id/progress",
    devAuthMiddleware,
    upload.singleImage,
    WorkerController.updateProgress
);

/* ============================================================
   WORKER REACHED LOCATION
============================================================ */

router.post(
    "/complaints/:id/reach",
    devAuthMiddleware,
    WorkerController.reachComplaintLocation
);

/* ============================================================
   START COMPLAINT
============================================================ */

router.post(
    "/complaints/:id/start",
    devAuthMiddleware,
    WorkerController.startComplaint
);

/* ============================================================
   ACCEPT COMPLAINT
============================================================ */

router.post(
    "/complaints/:id/accept",
    devAuthMiddleware,
    WorkerController.acceptComplaint
);


/* ============================================================
   REJECT COMPLAINT
============================================================ */

router.post(
    "/complaints/:id/reject",
    devAuthMiddleware,
    WorkerController.rejectComplaint
);

/* ============================================================
   UPDATE DUTY STATUS (WORKER AVAILABILITY)
============================================================ */

router.patch(
    "/duty-status",
    devAuthMiddleware,
    WorkerController.updateDutyStatus
);

router.put(
    "/duty-status",
    devAuthMiddleware,
    WorkerController.updateDutyStatus
);


module.exports = router;