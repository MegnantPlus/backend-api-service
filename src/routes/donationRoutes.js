const express = require('express');
const router = express.Router();
const donationController = require('../controllers/donationController');
const { protect } = require('../middleware/authMiddleware');

router.post('/create', protect, donationController.createPaymentLink);
router.post('/webhook', donationController.payosWebhook);

module.exports = router;