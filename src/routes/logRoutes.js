const express = require('express');
const router = express.Router();
const Log = require('../models/LogModel');
const { protect, adminOnly } = require('../middleware/authMiddleware');

/**
 * [GET] /api/logs
 * Lấy tất cả logs (chỉ admin)
 */
router.get('/', protect, adminOnly, async (req, res) => {
    try {
        const { userId, action, method, startDate, endDate, limit = 50, page = 1 } = req.query;

        // Xây dựng filter
        const filter = {};
        if (userId) filter.user = userId;
        if (action) filter.action = action;
        if (method) filter.method = method;
        
        // Lọc theo ngày
        if (startDate || endDate) {
            filter.timestamp = {};
            if (startDate) filter.timestamp.$gte = new Date(startDate);
            if (endDate) filter.timestamp.$lte = new Date(endDate);
        }

        const skip = (page - 1) * limit;
        const logs = await Log.find(filter)
            .populate('user', 'username email')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Log.countDocuments(filter);

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * [GET] /api/logs/user/:userId
 * Lấy tất cả logs của một người dùng
 * MUST BE BEFORE /:id to avoid route collision
 */
router.get('/user/:userId', protect, adminOnly, async (req, res) => {
    try {
        const { limit = 20, page = 1 } = req.query;
        const skip = (page - 1) * limit;

        const logs = await Log.find({ user: req.params.userId })
            .populate('user', 'username email')
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .skip(skip);

        const total = await Log.countDocuments({ user: req.params.userId });

        res.status(200).json({
            success: true,
            count: logs.length,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            data: logs
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * [GET] /api/logs/:id
 * Lấy chi tiết 1 log
 * MUST BE AFTER /user/:userId route
 */
router.get('/:id', protect, adminOnly, async (req, res) => {
    try {
        const log = await Log.findById(req.params.id)
            .populate('user', 'username email');

        if (!log) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy log' });
        }

        res.status(200).json({ success: true, data: log });
    } catch (error) {
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy log' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * [DELETE] /api/logs/clear/old
 * Xóa logs cũ hơn N ngày (chỉ admin)
 * MUST BE BEFORE DELETE /:id to avoid route collision
 */
router.delete('/clear/old', protect, adminOnly, async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(days));

        const result = await Log.deleteMany({ timestamp: { $lt: cutoffDate } });

        res.status(200).json({
            success: true,
            message: `Đã xóa ${result.deletedCount} logs cũ hơn ${days} ngày`
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * [DELETE] /api/logs/:id
 * Xóa 1 log
 * MUST BE AFTER /clear/old route
 */
router.delete('/:id', protect, adminOnly, async (req, res) => {
    try {
        const log = await Log.findByIdAndDelete(req.params.id);

        if (!log) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy log' });
        }

        res.status(200).json({ success: true, message: 'Đã xóa log thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
