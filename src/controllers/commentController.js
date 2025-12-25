const Comment = require('../models/commentModel');

// [GET] /api/comments
// Lấy tất cả bình luận
exports.getAllComments = async (req, res) => {
    try {
        // .populate('user', 'username') giúp lấy thông tin username từ bảng User dựa vào ID
        const comments = await Comment.find().populate('user', 'username');

        res.status(200).json({
            success: true,
            count: comments.length,
            data: comments
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [GET] /api/comments/:id
// Lấy chi tiết 1 bình luận
exports.getCommentById = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id).populate('user', 'username');

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy comment' });
        }

        res.status(200).json({ success: true, data: comment });
    } catch (error) {
        // Lỗi CastError thường do ID không đúng định dạng MongoDB
        if (error.name === 'CastError') {
            return res.status(404).json({ success: false, message: 'Không tìm thấy comment' });
        }
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] /api/comments
// Tạo bình luận mới
exports.createComment = async (req, res) => {
    try {
        const { content } = req.body;

        // Validate đơn giản
        if (!content) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bình luận' });
        }

        // Tạo comment mới
        // req.user._id lấy từ middleware protect (authMiddleware)
        const newComment = await Comment.create({
            content: content,
            user: req.user._id
        });

        // Populate lại để trả về có cả username ngay lập tức (tùy chọn)
        const populatedComment = await newComment.populate('user', 'username');

        res.status(201).json({ success: true, data: populatedComment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [PUT] /api/comments/:id
// Cập nhật bình luận
exports.updateComment = async (req, res) => {
    try {
        // Tìm comment để kiểm tra quyền sở hữu (nếu cần)
        let comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy comment để sửa' });
        }

        // Kiểm tra xem người sửa có phải là chủ comment không
        // comment.user là ObjectId, req.user._id là String (hoặc ObjectId), nên cần ép kiểu hoặc dùng toString()
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Bạn không có quyền sửa comment này' });
        }

        // Cập nhật
        comment = await Comment.findByIdAndUpdate(
            req.params.id,
            { content: req.body.content },
            {
                new: true, // Trả về dữ liệu mới sau khi update
                runValidators: true // Chạy lại validate của Model
            }
        ).populate('user', 'username');

        res.status(200).json({ success: true, message: 'Cập nhật thành công', data: comment });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] /api/comments/:id
// Xóa bình luận
exports.deleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);

        if (!comment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy comment để xóa' });
        }

        // Kiểm tra quyền sở hữu
        if (comment.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ success: false, message: 'Bạn không có quyền xóa comment này' });
        }

        await comment.deleteOne(); // Hoặc Comment.findByIdAndDelete(req.params.id);

        res.status(200).json({ success: true, message: 'Đã xóa thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};