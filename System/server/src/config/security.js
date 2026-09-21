const helmet = require("helmet");
const compression = require("compression");
const mongoSanitize =
require("express-mongo-sanitize");
const rateLimit =
require("express-rate-limit");

const limiter = rateLimit({

    windowMs: 15 * 60 * 1000,

    max: 500,

    standardHeaders: true,

    legacyHeaders: false

});

module.exports = (app) => {

    app.use(helmet({
        crossOriginResourcePolicy: { policy: "cross-origin" },
        crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" }
    }));

    app.use(compression());

    app.use(mongoSanitize());

    app.use(limiter);

};