const mongoose = require('mongoose');

const donationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderCode: { type: Number, required: true, unique: true },
    amount: { type: Number, required: true },
    description: { type: String },
    status: { type: String, enum: ['PENDING', 'PAID', 'CANCELLED'], default: 'PENDING' },
}, { timestamps: true });

module.exports = mongoose.model('Donation', donationSchema);