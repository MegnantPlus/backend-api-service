const User = require('../models/User');
const Comment = require('../models/commentModel');

// Xóa đệ quy toàn bộ cây comment (bao gồm cả replies)
const deleteCommentTree = async (commentId) => {
    const comment = await Comment.findById(commentId);
    if (!comment) return;

    // Xóa replies trước để tránh orphan
    for (const replyId of comment.replies) {
        await deleteCommentTree(replyId);
    }

    // Nếu có parent thì gỡ tham chiếu khỏi parent.replies
    if (comment.parentComment) {
        await Comment.findByIdAndUpdate(comment.parentComment, {
            $pull: { replies: comment._id }
        });
    }

    await comment.deleteOne();
};

const deleteAllCommentsOfUser = async (userId) => {
    const comments = await Comment.find({ user: userId });
    for (const comment of comments) {
        await deleteCommentTree(comment._id);
    }
};

// [GET] /api/admin/users
exports.listUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [PATCH] /api/admin/users/:id/ban
exports.banUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        if (user.is_admin) {
            return res.status(400).json({ success: false, message: 'Không thể khóa tài khoản quản trị' });
        }

        if (user.is_banned) {
            return res.status(200).json({ success: true, message: 'Tài khoản đã bị khóa trước đó' });
        }

        user.is_banned = true;
        await user.save();

        res.status(200).json({ success: true, message: 'Đã khóa tài khoản người dùng' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] /api/admin/users/:id
exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng' });
        }

        if (user.is_admin) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản quản trị' });
        }

        await deleteAllCommentsOfUser(user._id);
        await user.deleteOne();

        res.status(200).json({ success: true, message: 'Đã xóa người dùng và các bình luận liên quan' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [DELETE] /api/admin/comments/:id
exports.adminDeleteComment = async (req, res) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy comment để xóa' });
        }

        await deleteCommentTree(comment._id);
        res.status(200).json({ success: true, message: 'Đã xóa bình luận (bao gồm tất cả phản hồi)' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
