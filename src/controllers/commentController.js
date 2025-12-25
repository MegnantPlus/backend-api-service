const Comment = require('../models/commentModel');

// [GET] /api/comments
// Lấy tất cả bình luận (theo cấu trúc cây)
exports.getAllComments = async (req, res) => {
    try {
        // Chỉ lấy các comment gốc (depth = 0) và populate replies lồng nhau
        const comments = await Comment.find({ parentComment: null })
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
        const comment = await Comment.findById(req.params.id)
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
// Tạo bình luận mới (hoặc trả lời bình luận)
exports.createComment = async (req, res) => {
    try {
        const { content, parentCommentId } = req.body;

        // Validate đơn giản
        if (!content) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bình luận' });
        }

        let depth = 0;
        let parentComment = null;

        // Xử lý logic trả lời comment
        if (parentCommentId) {
            parentComment = await Comment.findById(parentCommentId);
            if (!parentComment) {
                return res.status(404).json({ success: false, message: 'Comment cha không tồn tại' });
            }

            // Kiểm tra độ sâu (max depth = 2: 0 -> 1 -> 2)
            if (parentComment.depth >= 2) {
                return res.status(400).json({ success: false, message: 'Không thể trả lời comment này (đã đạt độ sâu tối đa)' });
            }

            depth = parentComment.depth + 1;
        }

        // Tạo comment mới
        // req.user._id lấy từ middleware protect (authMiddleware)
        const newComment = await Comment.create({
            content: content,
            user: req.user._id,
            parentComment: parentCommentId || null,
            depth: depth
        });

        // Nếu là reply, cập nhật mảng replies của comment cha
        if (parentComment) {
            parentComment.replies.push(newComment._id);
            await parentComment.save();
        }

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