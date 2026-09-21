const { getAuth } = require("@clerk/express");

const identityMiddleware = (req, res, next) => {
    const auth = getAuth(req);
    const devClerkId = req.get("X-Dev-Clerk-Id");

    if (auth.isAuthenticated && auth.userId) {
        req.clerkUserId = auth.userId;
        return next();
    }

    if (process.env.NODE_ENV !== "production" && devClerkId) {
        req.clerkUserId = devClerkId.trim();
        return next();
    }

    return res.status(401).json({
        success: false,
        message: "Authentication required.",
    });
};

module.exports = identityMiddleware;
