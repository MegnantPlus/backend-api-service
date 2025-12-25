const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true
    },
    // Reference to the User model
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // This must match the name used in mongoose.model('User', ...)
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Xuất mảng này ra để Controller sử dụng
module.exports = mongoose.model('Comment', commentSchema);