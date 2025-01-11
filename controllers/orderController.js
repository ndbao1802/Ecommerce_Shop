const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');

const orderController = {
    // Get checkout page
    getCheckout: async (req, res) => {
        try {
            await req.user.populate('cart.product');
            res.render('orders/checkout', {
                title: 'Checkout',
                user: req.user
            });
        } catch (error) {
            console.error('Checkout error:', error);
            req.flash('error_msg', 'Error loading checkout page');
            res.redirect('/cart');
        }
    },

    // Create new order
    createOrder: async (req, res) => {
        try {
            const { address, paymentMethod } = req.body;
            console.log('Received order data:', { address, paymentMethod }); // Debug log

            // Validate required fields
            if (!address || !paymentMethod) {
                return res.status(400).json({
                    success: false,
                    error: 'Missing required fields'
                });
            }

            // Populate cart items
            await req.user.populate('cart.product');

            // Validate cart is not empty
            if (!req.user.cart.length) {
                return res.status(400).json({
                    success: false,
                    error: 'Cart is empty'
                });
            }

            // Create order items from cart
            const orderItems = req.user.cart.map(item => ({
                product: item.product._id,
                quantity: item.quantity,
                price: item.product.price
            }));

            // Calculate total
            const totalAmount = req.user.cart.reduce((sum, item) => {
                return sum + (item.product.price * item.quantity);
            }, 0);

            // Create new order
            const order = new Order({
                user: req.user._id,
                items: orderItems,
                totalAmount: totalAmount,
                shippingAddress: {
                    street: address.street,
                    ward: address.ward,
                    district: address.district,
                    city: address.city
                },
                paymentMethod: paymentMethod,
                paymentStatus: 'pending',
                status: 'processing'
            });

            console.log('Created order:', order); // Debug log

            await order.save();

            // Update product stock
            for (const item of req.user.cart) {
                await Product.findByIdAndUpdate(item.product._id, {
                    $inc: { stock: -item.quantity }
                });
            }

            // Clear user's cart
            req.user.cart = [];
            await req.user.save();

            res.json({
                success: true,
                orderId: order._id
            });

        } catch (error) {
            console.error('Order creation error:', error);
            res.status(500).json({
                success: false,
                error: 'Error creating order'
            });
        }
    },

    // Get order list
    getOrders: async (req, res) => {
        try {
            const orders = await Order.find({ user: req.user._id })
                .sort({ createdAt: -1 });

            res.render('orders/list', {
                title: 'My Orders',
                orders
            });
        } catch (error) {
            console.error('Order list error:', error);
            req.flash('error_msg', 'Error loading orders');
            res.redirect('/');
        }
    },

    // Get order details
    getOrderDetails: async (req, res) => {
        try {
            const order = await Order.findById(req.params.orderId)
                .populate('user')
                .populate({
                    path: 'items.product',
                    select: 'name images price'
                });

            if (!order) {
                req.flash('error_msg', 'Order not found');
                return res.redirect('/orders');
            }

            // Check if the order belongs to the current user
            if (order.user._id.toString() !== req.user._id.toString()) {
                req.flash('error_msg', 'Not authorized');
                return res.redirect('/orders');
            }

            res.render('orders/details', {
                title: `Order #${order._id}`,
                order: order
            });
        } catch (error) {
            console.error('Order details error:', error);
            req.flash('error_msg', 'Error loading order details');
            res.redirect('/orders');
        }
    },

    // Get payment page
    getPayment: async (req, res) => {
        try {
            const order = await Order.findById(req.params.orderId);
            
            if (!order || order.user.toString() !== req.user._id.toString()) {
                req.flash('error_msg', 'Order not found');
                return res.redirect('/orders');
            }

            if (order.paymentStatus !== 'pending') {
                req.flash('error_msg', 'Order is already paid');
                return res.redirect(`/orders/${order._id}`);
            }

            res.render('orders/payment', {
                title: 'Payment',
                order
            });
        } catch (error) {
            console.error('Payment page error:', error);
            req.flash('error_msg', 'Error loading payment page');
            res.redirect('/orders');
        }
    },

    // Process payment
    processPayment: async (req, res) => {
        try {
            const order = await Order.findById(req.params.orderId);
            
            if (!order || order.user.toString() !== req.user._id.toString()) {
                return res.status(404).json({
                    success: false,
                    error: 'Order not found'
                });
            }

            // Update order status
            order.paymentStatus = 'paid';
            order.status = 'processing';
            await order.save();

            res.json({
                success: true,
                orderId: order._id
            });
        } catch (error) {
            console.error('Payment processing error:', error);
            res.status(500).json({
                success: false,
                error: 'Error processing payment'
            });
        }
    }
};

module.exports = orderController; 