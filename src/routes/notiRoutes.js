const express = require('express');
const router = express.Router(); // Khởi tạo Router

// Import Controller để dùng
const notiController = require('../controllers/notiController');
// Import khiên bảo vệ vào
const { protect, adminOnly } = require('../middleware/authMiddleware');
// Định nghĩa các đường dẫn
// Gọn gàng hơn nhiều so với viết trong server.js

router.get('/', notiController.getAllNotis);
router.post('/', protect, adminOnly, notiController.createNotification);

router.get('/:id', notiController.getNotificationById);
router.put('/:id', protect, adminOnly, notiController.updateNotification);
router.delete('/:id', protect, adminOnly, notiController.deleteNotification);

// Xuất router ra để server.js dùng
module.exports = router;