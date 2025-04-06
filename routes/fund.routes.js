const express = require("express");
const router = express.Router();
const { protect } = require("../middlewares/auth.middleware");
const { getTotalFund } = require("../controllers/fund.controller");

// @route GET /api/fund
router.get("/", protect, getTotalFund);

module.exports = router;
