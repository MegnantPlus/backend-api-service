const express = require('express');
const router = express.Router();
const { listUsers, banUser, deleteUser, adminDeleteComment } = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/authMiddleware');

router.get('/users', protect, adminOnly, listUsers);
router.patch('/users/:id/ban', protect, adminOnly, banUser);
router.delete('/users/:id', protect, adminOnly, deleteUser);
router.delete('/comments/:id', protect, adminOnly, adminDeleteComment);

module.exports = router;
