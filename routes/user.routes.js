const express = require("express");
const router = express.Router();
const { getTotalUsers } = require("../controllers/user.controller");
const { protect } = require("../middlewares/auth.middleware");

// @route GET /api/users/count
router.get("/count", protect, getTotalUsers);

module.exports = router;
