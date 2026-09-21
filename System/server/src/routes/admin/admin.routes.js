const express =
    require("express");

const router =
    express.Router();

const AdminController =
    require("../../controllers/admin/admin.controller");

const devAuthMiddleware =
    require("../../middleware/devAuth.middleware");

const allowRoles =
    require("../../middleware/role.middleware");

const AdminStaffController =
    require("../../controllers/admin/admin.staff.controller");


/* ============================================================
   FINAL COMPLAINT CLOSURE
============================================================ */
router.post(
    "/complaints/:id/override-resolution",
    AdminController.overrideResolution
);

router.post(

    "/complaints/:id/close",

    devAuthMiddleware,

    AdminController.closeComplaint

);
router.post(
    "/complaints/:id/reassign-worker",
    devAuthMiddleware,
    AdminController.reassignWorker
);

router.post(
    "/complaints/:id/override-department",
    devAuthMiddleware,
    AdminController.overrideDepartment
);

router.post(
    "/complaints/:id/override-priority",
    devAuthMiddleware,
    AdminController.overridePriority
);

router.get(
    "/complaints",
    devAuthMiddleware,
    AdminController.getComplaints
);


router.get(
    "/complaints/:id",
    devAuthMiddleware,
    AdminController.getComplaintDetails
);


router.get(
    "/dashboard/analytics",
    devAuthMiddleware,
    AdminController.dashboardAnalytics
);

/* ============================================================
   STAFF MANAGEMENT
   ============================================================ */
router.get("/workers/stats", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.getStats);
router.post("/workers/invite", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.inviteWorker);
router.post("/admins/invite", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.inviteAdmin);
router.get("/invitations", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.getInvitations);
router.post("/invitations/:id/resend", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.resendInvitation);
router.post("/invitations/:id/revoke", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.revokeInvitation);
router.post("/workers/enroll", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.enrollCitizen);
router.get("/workers", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.getWorkers);
router.get("/workers/:id", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.getWorkerDetails);
router.put("/workers/:id", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.updateWorker);
router.get("/admins", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.getAdmins);
router.get("/citizens/search", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.searchCitizens);

/* ============================================================
   DEPARTMENTS
   ============================================================ */
router.get("/departments", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.getDepartments);
router.post("/departments", devAuthMiddleware, allowRoles("Admin"), AdminStaffController.addDepartment);

module.exports = router;