class HealthController {

    static health(req, res) {

        res.status(200).json({
            success: true,
            status: "OK",
            message: "Civic Issue Reporting API is running",
            timestamp: new Date().toISOString(),
            uptime: process.uptime()
        });

    }

    static ready(req, res) {

        res.status(200).json({
            success: true,
            ready: true
        });

    }

    static live(req, res) {

        res.status(200).json({
            success: true,
            live: true
        });

    }

    static version(req, res) {

        res.status(200).json({
            success: true,
            version: "1.0.0",
            node: process.version
        });

    }

}

module.exports = HealthController;