const Notification = require('../models/notiModel');

// [GET] /api/notifications
// Lấy tất cả bình luận (theo cấu trúc cây)
exports.getAllNotis = async (req, res) => {
    try {
        // Chỉ lấy các comment gốc (depth = 0) và populate replies lồng nhau
        const notifications = await Notification.find({ parentNotification: null })
            .populate('user', 'username')
            .populate({
                path: 'replies',
                populate: [
                    { path: 'user', select: 'username' },
                    {
                        path: 'replies',
                        populate: { path: 'user', select: 'username' }
                    }
                ]
            });

        res.status(200).json({
            success: true,
            count: notifications.length,
            data: notifications
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/notifications/:id
// Lấy chi tiết 1 bình luận
exports.getNotificationById = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id)
            .populate('user', 'username')
            .populate({
                path: 'replies',
                populate: [
                    { path: 'user', select: 'username' },
                    {
                        path: 'replies',
                        populate: { path: 'user', select: 'username' }
                    }
                ]
            });

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        }

        res.status(200).json({ success: true, data: notification });
    } catch (error) {
        // Lỗi CastError thường do ID không đúng định dạng MongoDB
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] /api/notifications
// Tạo thông báo mới (hoặc trả lời thông báo)
exports.createNotification = async (req, res) => {
    try {
        const { content, parentNotificationId } = req.body;

        // Validate đơn giản
        if (!content) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung thông báo' });
        }

        let depth = 0;
        let parentNotification = null;

        // Xử lý logic tìm thông báo 
        if (parentNotificationId) {
            parentNotification = await Notification.findById(parentNotificationId);
            if (!parentNotification) {
                return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo' });
            }
        }

        // Tạo thông báo mới không reply

        // req.user._id lấy từ middleware protect (authMiddleware)
        const newNotification = await Notification.create({
            content: content,
            user: req.user._id,
            parentNotification: parentNotificationId || null,
        });

        // Populate lại để trả về có cả username ngay lập tức (tùy chọn)
        const populatedNotification = await newNotification.populate('user', 'username');

        res.status(201).json({ success: true, data: populatedNotification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] /api/notifications/:id
// Cập nhật bình luận
exports.updateNotification = async (req, res) => {
    try {
        // Tìm notification để kiểm tra quyền sở hữu (nếu cần)
        let notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo để sửa' });
        }

        // Kiểm tra xem người sửa có phải là admin không
        // comment.user là ObjectId, req.user._id là String (hoặc ObjectId), nên cần ép kiểu hoặc dùng toString()
        if (req.user.is_admin !== true) {
            return res.status(401).json({ success: false, message: 'Bạn không có quyền sửa thông báo này' });
        }

        // Cập nhật
        notification = await Notification.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            {
                new: true, // Trả về dữ liệu mới sau khi update
                runValidators: true // Chạy lại validate của Model
            }
        ).populate('user', 'username');

        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: notification });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] /api/notifications/:id
// Xóa thông báo
exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findById(req.params.id);

        if (!notification) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông báo để xóa' });
        }

        // Kiểm tra quyền sở hữu
        if (req.user.is_admin !== true) {
            return res.status(401).json({ success: false, message: 'Bạn không có quyền xóa thông báo này' });
        }

        await notification.deleteOne(); // Hoặc Notification.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Đã xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};