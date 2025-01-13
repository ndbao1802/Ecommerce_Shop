const Order = require('../models/orderModel');
const User = require('../models/userModel');
const Product = require('../models/productModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

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
            const { shippingAddress, paymentMethod } = req.body;
            const user = await User.findById(req.user._id).populate('cart.product');

            // Calculate totals
            const subtotal = user.cart.reduce((total, item) => {
                return total + (item.product.price * item.quantity);
            }, 0);
            const shippingFee = 10; // Fixed shipping fee
            const total = subtotal + shippingFee;

            // Create order
            const order = await Order.create({
                user: req.user._id,
                items: user.cart.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                shippingAddress,
                subtotal,
                shippingFee,
                total,
                paymentMethod,
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
                status: 'pending'
            });

            // Clear cart
            user.cart = [];
            await user.save();

            if (paymentMethod === 'card') {
                // Redirect to payment page for Stripe
                res.json({ 
                    success: true, 
                    orderId: order._id,
                    requiresPayment: true
                });
            } else {
                // Redirect to order confirmation for COD
                req.flash('success_msg', 'Order placed successfully');
                res.json({ 
                    success: true, 
                    orderId: order._id,
                    requiresPayment: false
                });
            }
        } catch (error) {
            console.error('Error creating order:', error);
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
            const { orderId } = req.params;
            const order = await Order.findById(orderId);

            if (!order) {
                return res.status(404).json({ error: 'Order not found' });
            }

            // Create Stripe payment session
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: order.items.map(item => ({
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: item.product.name,
                            images: [item.product.images[0]?.url],
                        },
                        unit_amount: Math.round(item.price * 100), // Stripe uses cents
                    },
                    quantity: item.quantity,
                })),
                mode: 'payment',
                success_url: `${process.env.BASE_URL}/orders/${orderId}/success`,
                cancel_url: `${process.env.BASE_URL}/orders/${orderId}/cancel`,
            });

            res.json({ sessionId: session.id });
        } catch (error) {
            console.error('Payment error:', error);
            res.status(500).json({ error: 'Error processing payment' });
        }
    },

    // Create Stripe Payment Intent
    createPaymentIntent: async (req, res) => {
        try {
            const { amount } = req.body;

            const paymentIntent = await stripe.paymentIntents.create({
                amount,
                currency: 'usd',
                automatic_payment_methods: {
                    enabled: true,
                },
            });

            res.json({
                clientSecret: paymentIntent.client_secret
            });
        } catch (error) {
            console.error('Error creating payment intent:', error);
            res.status(500).json({ error: 'Error creating payment' });
        }
    },

    // Handle successful payment
    handlePaymentSuccess: async (req, res) => {
        try {
            const { payment_intent, payment_intent_client_secret } = req.query;

            // Verify the payment
            const paymentIntent = await stripe.paymentIntents.retrieve(payment_intent);

            if (paymentIntent.status === 'succeeded') {
                // Update order status
                const order = await Order.findOne({ 
                    user: req.user._id,
                    status: 'pending',
                    paymentStatus: 'awaiting_payment'
                }).sort({ createdAt: -1 });

                if (order) {
                    order.paymentStatus = 'paid';
                    order.status = 'processing';
                    await order.save();

                    req.flash('success_msg', 'Payment successful! Your order is being processed.');
                    res.redirect(`/orders/${order._id}`);
                } else {
                    req.flash('error_msg', 'Order not found');
                    res.redirect('/orders');
                }
            } else {
                req.flash('error_msg', 'Payment verification failed');
                res.redirect('/cart');
            }
        } catch (error) {
            console.error('Error handling payment success:', error);
            req.flash('error_msg', 'Error processing payment');
            res.redirect('/cart');
        }
    }
};

module.exports = orderController; 