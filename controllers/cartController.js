const Product = require('../models/productModel');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/orderModel');

const cartController = {
    getCart: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Please login to view cart'
                });
            }

            // Populate cart data
            await req.user.populate({
                path: 'cart.product',
                select: 'name price images stock'
            });

            // If AJAX request, return JSON
            if (req.xhr || req.headers.accept.includes('json')) {
                return res.json({
                    success: true,
                    cart: {
                        items: req.user.cart,
                        total: req.user.cartTotal
                    }
                });
            }

            // For regular request, render cart page
            res.render('cart/index', {
                cart: req.user.cart,
                total: req.user.cartTotal
            });

        } catch (error) {
            console.error('Cart error:', error);
            if (req.xhr) {
                return res.status(500).json({
                    success: false,
                    error: 'Error loading cart'
                });
            }
            res.status(500).render('error', {
                message: 'Error loading cart'
            });
        }
    },

    addToCart: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Please login to add items'
                });
            }

            const { productId, quantity = 1 } = req.body;

            // Validate product
            const product = await Product.findById(productId);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            // Find existing cart item
            const existingItem = req.user.cart.find(item => 
                item.product.toString() === productId.toString()
            );

            // Calculate total quantity (existing + new)
            const totalQuantity = (existingItem?.quantity || 0) + parseInt(quantity);

            // Check if total quantity exceeds stock
            if (totalQuantity > product.stock) {
                // Adjust quantity to maximum available
                const adjustedQuantity = product.stock - (existingItem?.quantity || 0);
                
                if (adjustedQuantity <= 0) {
                    return res.status(400).json({
                        success: false,
                        error: 'Maximum stock reached for this item',
                        availableStock: product.stock,
                        currentQuantity: existingItem.quantity
                    });
                }

                // Add adjusted quantity
                await req.user.addToCart(productId, adjustedQuantity);
                
                return res.status(200).json({
                    success: true,
                    warning: `Only ${adjustedQuantity} more items available`,
                    adjustedQuantity,
                    cart: {
                        items: req.user.cart,
                        total: req.user.cartTotal,
                        count: req.user.cart.length
                    }
                });
            }

            // Add to cart with original quantity
            await req.user.addToCart(productId, parseInt(quantity));
            
            // Get updated cart
            await req.user.populate({
                path: 'cart.product',
                select: 'name price images stock'
            });

            return res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal,
                    count: req.user.cart.length
                }
            });

        } catch (error) {
            console.error('Cart error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error adding to cart'
            });
        }
    },

    removeItem: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Please login'
                });
            }

            const { itemId } = req.params;
            console.log('Request to remove cart item:', itemId);

            // Remove specific cart item by its ID
            const removed = await req.user.removeFromCart(itemId);
            
            if (!removed) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart item not found'
                });
            }

            // Get fresh cart data
            await req.user.populate({
                path: 'cart.product',
                select: 'name price images stock'
            });

            // Calculate new total
            const cartTotal = req.user.cart.reduce((total, item) => {
                if (item.product) {
                    return total + (item.product.price * item.quantity);
                }
                return total;
            }, 0);

            return res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: cartTotal,
                    count: req.user.cart.length
                }
            });

        } catch (error) {
            console.error('Cart error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error removing item'
            });
        }
    },

    updateQuantity: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Please login'
                });
            }

            const { itemId, quantity } = req.body;

            if (quantity < 1) {
                return res.status(400).json({
                    success: false,
                    error: 'Quantity must be at least 1'
                });
            }

            // Find the cart item
            const cartItem = req.user.cart.id(itemId);
            if (!cartItem) {
                return res.status(404).json({
                    success: false,
                    error: 'Cart item not found'
                });
            }

            // Get product to check stock
            const product = await Product.findById(cartItem.product);
            if (!product) {
                return res.status(404).json({
                    success: false,
                    error: 'Product not found'
                });
            }

            // Check if requested quantity exceeds stock
            if (quantity > product.stock) {
                return res.status(400).json({
                    success: false,
                    error: `Only ${product.stock} items available`,
                    availableStock: product.stock
                });
            }

            // Update quantity
            cartItem.quantity = quantity;
            await req.user.save();

            // Get updated cart with populated data
            await req.user.populate({
                path: 'cart.product',
                select: 'name price images stock'
            });

            return res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal,
                    count: req.user.cart.length
                }
            });

        } catch (error) {
            console.error('Cart error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error updating quantity'
            });
        }
    },

    validateCart: async (req, res, next) => {
        try {
            const isAjax = req.xhr || req.headers.accept?.includes('json');

            if (!req.user) {
                if (isAjax) {
                    return res.status(401).json({
                        success: false,
                        error: 'Please login'
                    });
                }
                req.flash('error_msg', 'Please login to continue');
                return res.redirect('/users/login');
            }

            // Populate cart with product data
            await req.user.populate({
                path: 'cart.product',
                select: 'name price stock'
            });

            let hasErrors = false;
            const stockErrors = [];

            // Create a map to track total quantities per product
            const productQuantities = new Map();

            // First, sum up quantities for each product
            req.user.cart.forEach(item => {
                if (item.product) {
                    const productId = item.product._id.toString();
                    const currentTotal = productQuantities.get(productId) || 0;
                    productQuantities.set(productId, currentTotal + item.quantity);
                }
            });

            // Then check if any product's total quantity exceeds stock
            for (const [productId, totalQuantity] of productQuantities) {
                const cartItem = req.user.cart.find(item => 
                    item.product._id.toString() === productId
                );
                
                if (cartItem && totalQuantity > cartItem.product.stock) {
                    hasErrors = true;
                    stockErrors.push({
                        message: `Only ${cartItem.product.stock} ${cartItem.product.name} available (you have ${totalQuantity} in cart)`,
                        item: cartItem,
                        availableStock: cartItem.product.stock,
                        currentQuantity: totalQuantity
                    });
                }
            }

            if (hasErrors) {
                if (isAjax) {
                    return res.status(400).json({
                        success: false,
                        error: 'Some items exceed available stock',
                        stockErrors
                    });
                }
                req.flash('error_msg', 'Some items in your cart are no longer available');
                return res.redirect('/cart');
            }

            // If this is being used as middleware and not an AJAX request
            if (next && !isAjax) {
                return next();
            }

            // For AJAX requests, return success response
            return res.json({
                success: true,
                message: 'Cart validation successful'
            });

        } catch (error) {
            console.error('Cart validation error:', error);
            if (req.xhr || req.headers.accept?.includes('json')) {
                return res.status(500).json({
                    success: false,
                    error: 'Error validating cart'
                });
            }
            req.flash('error_msg', 'Error validating cart');
            return res.redirect('/cart');
        }
    },

    checkout: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'Please login'
                });
            }

            // Get populated cart data
            await req.user.populate({
                path: 'cart.product',
                select: 'name price stock'
            });

            // Validate cart one last time
            const stockErrors = [];
            for (const item of req.user.cart) {
                if (!item.product) {
                    stockErrors.push({
                        message: 'Product not found',
                        item: item
                    });
                    continue;
                }

                if (item.quantity > item.product.stock) {
                    stockErrors.push({
                        message: `Only ${item.product.stock} ${item.product.name} available`,
                        item: item,
                        availableStock: item.product.stock
                    });
                }
            }

            if (stockErrors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Some items exceed available stock',
                    stockErrors
                });
            }

            // Calculate total
            const total = req.user.cartTotal;

            // For now, just return success (you'll implement actual checkout later)
            return res.json({
                success: true,
                message: 'Cart validated successfully',
                total,
                items: req.user.cart
            });

        } catch (error) {
            console.error('Checkout error:', error);
            return res.status(500).json({
                success: false,
                error: 'Error processing checkout'
            });
        }
    },

    renderCheckout: async (req, res) => {
        try {
            // Populate the user's cart with product details
            await req.user.populate('cart.product');

            // Calculate cart totals
            const cartItems = req.user.cart.map(item => ({
                product: item.product,
                quantity: item.quantity,
                subtotal: item.product.price * item.quantity
            }));

            const cartTotal = cartItems.reduce((total, item) => total + item.subtotal, 0);

            res.render('cart/checkout', {
                title: 'Checkout',
                cart: {
                    items: cartItems,
                    total: cartTotal
                },
                user: req.user,
                stripePublicKey: process.env.STRIPE_PUBLISHABLE_KEY
            });
        } catch (error) {
            console.error('Checkout error:', error);
            req.flash('error_msg', 'Error loading checkout page');
            res.redirect('/cart');
        }
    },

    processCheckout: async (req, res) => {
        try {
            const { address, paymentMethod } = req.body;

            // Calculate total from cart
            await req.user.populate('cart.product');
            const total = req.user.cart.reduce((sum, item) => {
                return sum + (item.product.price * item.quantity);
            }, 0);

            // Create order
            const order = await Order.create({
                user: req.user._id,
                items: req.user.cart.map(item => ({
                    product: item.product._id,
                    quantity: item.quantity,
                    price: item.product.price
                })),
                shippingAddress: address,
                total,
                paymentMethod,
                paymentStatus: paymentMethod === 'cod' ? 'pending' : 'awaiting_payment',
                status: 'pending'
            });

            // Clear cart
            req.user.cart = [];
            await req.user.save();

            res.json({ 
                success: true, 
                orderId: order._id
            });
        } catch (error) {
            console.error('Checkout processing error:', error);
            res.status(500).json({
                success: false,
                error: 'Error processing checkout'
            });
        }
    },

    // Handle successful Stripe payment
    handlePaymentSuccess: async (req, res) => {
        try {
            const { payment_intent } = req.query;

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
    },

    // Create payment intent for Stripe
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
    }
};

module.exports = cartController; 