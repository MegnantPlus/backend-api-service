const mongoose = require('mongoose');

const NotiSchema = new mongoose.Schema({
    title: {
        type: String,
        trim: true,
        default: null
    },
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
    parentNotification: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});
// Xuất mảng này ra để Controller sử dụng
module.exports = mongoose.model('Notification', NotiSchema);