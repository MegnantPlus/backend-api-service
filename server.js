const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');


// Cấu hình môi trường và kết nối DB
dotenv.config();
connectDB();
//
const app = express();
const PORT = process.env.PORT || 5000;

// Import Routes
const commentRoutes = require('./src/routes/commentRoutes');
const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const notiRoutes = require('./src/routes/notiRoutes');
const donationRoutes = require('./src/routes/donationRoutes');
const logRoutes = require('./src/routes/logRoutes');

// Import Middleware
const loggerMiddleware = require('./src/middleware/loggerMiddleware');

var cors = require('cors');
app.use(cors());
// Middleware đọc JSON
app.use(express.json());
// Middleware ghi lại hành động người dùng
app.use(loggerMiddleware);

// --- ROUTES ---
// Mount (gắn) route vào đường dẫn gốc /api/courses
app.use('/api/comments', commentRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notiRoutes);
app.use('/api/donations', donationRoutes);
app.use('/api/logs', logRoutes);
//
// Route mặc định trang chủ
app.get('/', (req, res) => {
    res.send('Chào mừng đến với API quản lý khóa học (MVC)');
});

// Chạy server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại port ${PORT}`);
});