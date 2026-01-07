const Log = require('../models/LogModel');

/**
 * Middleware ghi lại hành động của người dùng
 * Lưu: method, endpoint, IP, status code, request body, response body, user agent
 */
const loggerMiddleware = (req, res, next) => {
    // Lưu response.json gốc
    const originalJson = res.json;

    // Override response.json để capture response body
    res.json = function (data) {
        res.locals.responseBody = data;
        return originalJson.call(this, data);
    };

    // Capture response status và body
    res.on('finish', async () => {
        try {
            // Tạo logData ở đây để lấy req.user sau khi protect middleware đã chạy
            const logData = {
                user: req.user ? req.user._id : null,
                method: req.method,
                endpoint: req.originalUrl,
                ip: req.ip || req.connection.remoteAddress,
                requestBody: ['POST', 'PUT', 'PATCH'].includes(req.method) ? req.body : null,
                userAgent: req.get('user-agent'),
                action: mapActionFromMethod(req.method, req.originalUrl),
                description: generateDescription(req.method, req.originalUrl, req.user),
                statusCode: res.statusCode,
                responseBody: res.locals.responseBody || null,
                timestamp: new Date()
            };

            // Loại bỏ sensitive data từ request body
            if (logData.requestBody && logData.requestBody.password) {
                logData.requestBody = { ...logData.requestBody, password: '***REDACTED***' };
            }

            // Chỉ lưu logs cho status code >= 400 hoặc action quan trọng
            // Hoặc tùy chọn lưu tất cả
            const shouldLog = (
                res.statusCode >= 400 ||
                ['CREATE', 'UPDATE', 'DELETE'].includes(logData.action) ||
                logData.endpoint.includes('/admin') ||
                logData.endpoint.includes('/auth')
            );

            if (shouldLog) {
                console.log(`[Logger] Saving log: ${logData.method} ${logData.endpoint} - Status: ${logData.statusCode} - User: ${logData.user}`);
                await Log.create(logData);
                console.log('[Logger] Log saved successfully');
            }
        } catch (error) {
            console.error('[Logger] Error saving log:', error.message);
            console.error('[Logger] Failed logData:', JSON.stringify(logData, null, 2));
        }
    });

    next();
};

/**
 * Xác định hành động từ method HTTP và endpoint
 */
function mapActionFromMethod(method, endpoint) {
    switch (method) {
        case 'POST':
            return 'CREATE';
        case 'GET':
            return 'READ';
        case 'PUT':
        case 'PATCH':
            return 'UPDATE';
        case 'DELETE':
            return 'DELETE';
        default:
            return 'OTHER';
    }
}

/**
 * Tạo mô tả chi tiết về hành động
 */
function generateDescription(method, endpoint, user) {
    const username = user ? user.username : 'Anonymous';
    
    if (endpoint.includes('/auth/login')) {
        return `Người dùng ${username} đăng nhập`;
    }
    if (endpoint.includes('/auth/register')) {
        return `Người dùng mới đăng ký`;
    }
    if (endpoint.includes('/comments') && method === 'POST') {
        return `${username} tạo bình luận`;
    }
    if (endpoint.includes('/comments') && method === 'DELETE') {
        return `${username} xóa bình luận`;
    }
    if (endpoint.includes('/donations') && method === 'POST') {
        return `${username} tạo đơn quyên góp`;
    }
    if (endpoint.includes('/notifications') && method === 'POST') {
        return `${username} tạo thông báo`;
    }
    if (endpoint.includes('/admin')) {
        return `${username} thực hiện hành động admin`;
    }
    
    return `${username} ${method} ${endpoint}`;
}

module.exports = loggerMiddleware;
