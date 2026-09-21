const { getIO } = require("./socket");

class SocketHandler {

    /* =============================================
       NOTIFICATION
    ============================================== */

    static emitNotification(data) {

        getIO()

            .to(data.recipientClerkId)

            .emit("notification", data);

    }

    /* =============================================
       COMPLAINT CREATED
    ============================================== */

    static emitComplaintCreated(data) {

        getIO()

            .emit("complaint-created", data);

    }

    /* =============================================
       STATUS UPDATED
    ============================================== */

    static emitStatusUpdated(data) {

        getIO()

            .to(data.recipientClerkId)

            .emit("status-updated", data);

    }

    /* =============================================
       AI COMPLETED
    ============================================== */

    static emitAICompleted(data) {

        getIO()

            .to(data.recipientClerkId)

            .emit("ai-completed", data);

    }

    /* =============================================
       WORKER ASSIGNED
    ============================================== */

    static emitWorkerAssigned(data) {

        getIO()

            .to(data.workerClerkId)

            .emit("worker-assigned", data);

    }

    /* =============================================
       DASHBOARD UPDATE
    ============================================== */

    static emitDashboard(data) {

        getIO()

            .to("ADMIN")

            .emit("dashboard-update", data);

    }

}

module.exports = SocketHandler;