const express = require('express');
const router = express.Router(); // Khởi tạo Router

// Import Controller để dùng
const commentController = require('../controllers/commentController');
// Import khiên bảo vệ vào
const { protect } = require('../middleware/authMiddleware');
// Định nghĩa các đường dẫn
// Gọn gàng hơn nhiều so với viết trong server.js

router.get('/', commentController.getAllComments);
router.post('/', protect, commentController.createComment);

router.get('/:id', commentController.getCommentById);
router.put('/:id', protect, commentController.updateComment);
router.delete('/:id', protect, commentController.deleteComment);

// Xuất router ra để server.js dùng
module.exports = router;