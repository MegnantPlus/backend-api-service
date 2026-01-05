const PayOS = require("@payos/node").PayOS;
const Donation = require('../models/donationModel');

// Khởi tạo đối tượng PayOS bằng các biến môi trường từ file .env
const payos = new PayOS(
    process.env.PAYOS_CLIENT_ID,
    process.env.PAYOS_API_KEY,
    process.env.PAYOS_CHECKSUM_KEY
);

// [POST] /api/donations/create
exports.createPaymentLink = async (req, res) => {
    try {
        const { amount, description } = req.body;
        const orderCode = Number(Date.now().toString().slice(-6)); // Tạo mã đơn hàng số

        const body = {
            orderCode,
            amount,
            description: description || "Donate cho website",
            returnUrl: `${process.env.BASE_URL}/success`,
            cancelUrl: `${process.env.BASE_URL}/cancel`,
        };

        const paymentLinkResponse = await payos.createPaymentLink(body);

        // Lưu vào Database với trạng thái PENDING
        await Donation.create({
            user: req.user._id, // Lấy từ protect middleware
            orderCode,
            amount,
            description: body.description
        });

        res.status(200).json({ success: true, checkoutUrl: paymentLinkResponse.checkoutUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// [POST] /api/donations/webhook
exports.payosWebhook = async (req, res) => {
    try {
        const webhookData = payos.verifyPaymentWebhookData(req.body);

        // Cập nhật trạng thái trong Database khi thanh toán thành công
        if (webhookData.code === '00') {
            await Donation.findOneAndUpdate(
                { orderCode: webhookData.orderCode },
                { status: 'PAID' }
            );
            // Tại đây bạn có thể dùng Socket.io để bắn thông báo "Cảm ơn" về Client
        }

        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ success: false });
    }
};