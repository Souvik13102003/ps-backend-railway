// routes/auth.routes.js
const express = require("express");
const router = express.Router();
const { login, register } = require("../controllers/auth.controller");

// @route   POST /api/auth/login
// @desc    Login user
router.post("/login", login);

// @route   POST /api/auth/register
// @desc    Register admin manually
router.post("/register", register);

module.exports = router;
