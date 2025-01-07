const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
        price: Number,
        selectedSize: String,
        selectedColor: String
    }],
    shippingAddress: {
        street: String,
        ward: String,
        district: String,
        city: String,
        phone: String
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'Banking', 'Momo', 'ZaloPay'],
        required: true
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed'],
        default: 'pending'
    },
    orderStatus: {
        type: String,
        enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending'
    },
    totalAmount: Number,
    shippingFee: Number,
    discount: Number,
    finalAmount: Number,
    note: String,
    trackingNumber: String,
    cancelReason: String,
    estimatedDeliveryDate: Date
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema); 