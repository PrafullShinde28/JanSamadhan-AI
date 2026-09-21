const express = require("express");
const AuthController = require("../controllers/auth.controller");
const devAuthMiddleware = require("../middleware/devAuth.middleware");
const identityMiddleware = require("../middleware/identity.middleware");

const router = express.Router();

router.get("/me", devAuthMiddleware, AuthController.getMe);
router.post("/sync", identityMiddleware, AuthController.syncUser);

module.exports = router;
