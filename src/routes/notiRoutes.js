const express = require('express');
const router = express.Router(); // Khởi tạo Router

// Import Controller để dùng
const notiController = require('../controllers/notiController');
// Import khiên bảo vệ vào
const { protect } = require('../middleware/authMiddleware');
// Định nghĩa các đường dẫn
// Gọn gàng hơn nhiều so với viết trong server.js

router.get('/', notiController.getAllNotis);
router.post('/', protect, notiController.createNotification);

router.get('/:id', notiController.getNotificationById);
router.put('/:id', protect, notiController.updateNotification);
router.delete('/:id', protect, notiController.deleteNotification);

// Xuất router ra để server.js dùng
module.exports = router;