const { getAuth } = require("@clerk/express");

const User = require("../models/User");

const authMiddleware = async (req, res, next) => {

    try {

        const auth = getAuth(req);

        console.log("AUTH DEBUG:", {
        isAuthenticated: auth.isAuthenticated,
        userId: auth.userId
    });

        if (!auth.isAuthenticated) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });

        }

        const clerkId = auth.userId;

        if (!clerkId) {

            return res.status(401).json({
                success: false,
                message: "Clerk user ID not found"
            });

        }

        const user = await User.findOne({
            clerkId
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (user.status !== "Active") {
            return res.status(403).json({
                success: false,
                message: "Account is suspended or inactive."
            });
        }

        req.user = user;
        req.clerkUserId = clerkId;

        next();

    } catch (error) {

        next(error);

    }

};

module.exports = authMiddleware;