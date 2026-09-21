const express = require("express");

const router =
    express.Router();

const AdminAnalyticsController =
    require("../../controllers/admin/admin.analytics.controller");

const devAuthMiddleware =
    require("../../middleware/devAuth.middleware");


    router.get(
    "/ai",
    devAuthMiddleware,
    AdminAnalyticsController.ai
);

router.get(
    "/resolution",
    devAuthMiddleware,
    AdminAnalyticsController.resolution
);

router.get(
    "/trends",
    devAuthMiddleware,
    AdminAnalyticsController.trends
);

router.get(
    "/overview",
    devAuthMiddleware,
    AdminAnalyticsController.overview
);


router.get(
    "/categories",
    devAuthMiddleware,
    AdminAnalyticsController.categories
);


router.get(
    "/priorities",
    devAuthMiddleware,
    AdminAnalyticsController.priorities
);


router.get(
    "/departments",
    devAuthMiddleware,
    AdminAnalyticsController.departments
);


router.get(
    "/workers",
    devAuthMiddleware,
    AdminAnalyticsController.workers
);


router.get(
    "/recent",
    devAuthMiddleware,
    AdminAnalyticsController.recent
);


module.exports = router;