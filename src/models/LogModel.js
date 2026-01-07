const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null // Cho phép null nếu request không xác thực
    },
    method: {
        type: String,
        enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        required: true
    },
    endpoint: {
        type: String,
        required: true
    },
    ip: {
        type: String,
        required: true
    },
    statusCode: {
        type: Number,
        default: null
    },
    requestBody: {
        type: Object,
        default: null
    },
    responseBody: {
        type: Object,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    },
    action: {
        type: String,
        enum: ['CREATE', 'READ', 'UPDATE', 'DELETE', 'OTHER'],
        required: true
    },
    description: {
        type: String,
        default: null
    },
    error: {
        type: String,
        default: null
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

// Tạo index cho tìm kiếm nhanh
LogSchema.index({ user: 1, timestamp: -1 });
LogSchema.index({ endpoint: 1, timestamp: -1 });
LogSchema.index({ method: 1 });

module.exports = mongoose.model('Log', LogSchema);
