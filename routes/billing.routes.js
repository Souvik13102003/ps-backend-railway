// routes/billing.routes.js
const express = require('express');
const router = express.Router();
const { billStudent, getPaymentStats, getAllBills } = require('../controllers/billing.controller');
const { protect } = require('../middlewares/auth.middleware');
const upload = require('../middlewares/MulterScreenshot');


// @route   POST /api/billing/bill
// @desc    Bill a student with optional screenshot
router.post('/bill', protect, upload.single('screenshot'), billStudent);

// @route GET /api/billings/stats
router.get("/stats", protect, getPaymentStats);

router.get('/all', protect, getAllBills);


module.exports = router;
