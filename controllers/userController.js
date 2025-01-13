const User = require('../models/userModel');
const passport = require('passport');
const { sendMail } = require('../config/mail');
const bcrypt = require('bcryptjs');
const cloudinary = require('cloudinary');
const Order = require('../models/orderModel');
const Report = require('../models/reportModel');

const userController = {
    // Auth methods
    register: async (req, res) => {
        try {
            const { name, email, password, phone } = req.body;

            // Check if user exists
            const existingUser = await User.findOne({ 
                email: { $regex: new RegExp(`^${email}$`, 'i') } // Case-insensitive check
            });
            
            if (existingUser) {
                return res.render('users/register', {
                    error: 'This email is already registered',
                    values: { name, phone } // Preserve form values except email
                });
            }

            // Create new user
            const user = new User({ 
                name, 
                email: email.toLowerCase(), // Store email in lowercase
                password,
                phone 
            });
            
            // Generate activation token
            user.generateActivationToken();
            
            // Save user
            await user.save();

            try {
                // Send activation email
                const activationUrl = `${process.env.BASE_URL}/users/activate/${user.activationToken}`;
                await sendMail({
                    to: user.email,
                    subject: 'Activate your account',
                    html: `
                        <h1>Welcome to Gaming Store!</h1>
                        <p>Please click the link below to activate your account:</p>
                        <a href="${activationUrl}">${activationUrl}</a>
                        <p>This link will expire in 24 hours.</p>
                    `
                });

                req.flash('success_msg', 'Registration successful! Please check your email to activate your account.');
                res.redirect('/users/login');
            } catch (emailError) {
                // If email fails, still create the account but inform the user
                console.error('Email sending error:', emailError);
                req.flash('warning_msg', 'Account created but activation email could not be sent. Please contact support.');
                res.redirect('/users/login');
            }
        } catch (error) {
            console.error('Registration error:', error);
            res.render('users/register', {
                error: 'Error during registration. Please try again.',
                values: req.body // Preserve form values
            });
        }
    },

    login: async (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return res.status(500).json({
                    success: false,
                    error: 'Authentication error'
                });
            }
            
            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: info.message
                });
            }

            req.login(user, (err) => {
                if (err) {
                    return res.status(500).json({
                        success: false,
                        error: 'Login error'
                    });
                }

                return res.json({
                    success: true,
                    redirect: '/'
                });
            });
        })(req, res, next);
    },

    logout: (req, res) => {
        req.logout(() => {
            res.redirect('/');
        });
    },

    // Profile methods
    getProfile: async (req, res) => {
        try {
            // Get user with populated data
            const user = await User.findById(req.user._id)
                .select('-password')
                .populate('cart.product')
                .populate('wishlist');
            
            res.render('users/profile', { 
                title: 'My Profile',
                user,
                messages: {
                    success_msg: req.flash('success_msg'),
                    error_msg: req.flash('error_msg')
                }
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            req.flash('error_msg', 'Error loading profile');
            res.redirect('/');
        }
    },

    updateProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            const { name, email } = req.body;

            // Basic info update
            if (name) user.name = name;
            if (email) user.email = email;

            // Handle avatar upload
            if (req.file) {
                try {
                    // Delete old avatar from Cloudinary if exists
                    if (user.avatar && user.avatar.includes('cloudinary')) {
                        const publicId = user.avatar.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }
                    user.avatar = req.file.path;
                    console.log('New avatar path:', req.file.path);
                } catch (error) {
                    console.error('Error handling avatar:', error);
                    req.flash('error_msg', 'Error updating profile picture');
                    return res.redirect('/users/profile');
                }
            }

            await user.save();
            req.flash('success_msg', 'Profile updated successfully');
            res.redirect('/users/profile');
        } catch (error) {
            console.error('Profile update error:', error);
            req.flash('error_msg', 'Error updating profile');
            res.redirect('/users/profile');
        }
    },

    updatePassword: async (req, res) => {
        try {
            const user = await User.findById(req.user.id);
            const { currentPassword, newPassword, confirmPassword } = req.body;

            // Validate password change
            if (!currentPassword || !newPassword || !confirmPassword) {
                req.flash('error_msg', 'All password fields are required');
                return res.redirect('/users/profile');
            }

            if (newPassword !== confirmPassword) {
                req.flash('error_msg', 'New passwords do not match');
                return res.redirect('/users/profile');
            }

            // Verify current password
            const isMatch = await bcrypt.compare(currentPassword, user.password);
            if (!isMatch) {
                req.flash('error_msg', 'Current password is incorrect');
                return res.redirect('/users/profile');
            }

            // Hash new password
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(newPassword, salt);

            await user.save();
            req.flash('success_msg', 'Password updated successfully');
            res.redirect('/users/profile');
        } catch (error) {
            console.error('Password update error:', error);
            req.flash('error_msg', 'Error updating password');
            res.redirect('/users/profile');
        }
    },

    updateAvatar: async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({
                    success: false,
                    error: 'No image file provided'
                });
            }

            // Update user with new avatar URL
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                { avatar: req.file.path || req.file.location }, // Handle both path and location
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            res.json({
                success: true,
                avatar: updatedUser.avatar
            });
        } catch (error) {
            console.error('Avatar update error:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Error updating avatar'
            });
        }
    },

    // Cart methods
    getCart: async (req, res) => {
        try {
            await req.user.populate('cart.product');
            res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal
                }
            });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting cart'
            });
        }
    },

    addToCart: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            await req.user.addToCart(productId, quantity);
            await req.user.populate('cart.product');

            res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal
                }
            });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding to cart'
            });
        }
    },

    removeFromCart: async (req, res) => {
        try {
            const { productId } = req.params;
            await req.user.removeFromCart(productId);
            await req.user.populate('cart.product');

            res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal
                }
            });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).json({
                success: false,
                error: 'Error removing from cart'
            });
        }
    },

    // Wishlist methods
    getWishlist: async (req, res) => {
        try {
            // Populate with specific fields we need
            await req.user.populate({
                path: 'wishlist',
                select: 'name description price images brand' // Include any other fields you need
            });
            
            res.render('users/wishlist', {
                title: 'My Wishlist',
                wishlist: req.user.wishlist
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            req.flash('error_msg', 'Error loading wishlist');
            res.redirect('/');
        }
    },

    addToWishlist: async (req, res) => {
        try {
            const productId = req.params.productId;
            
            // Check if product is already in wishlist
            if (req.user.wishlist.includes(productId)) {
                return res.status(400).json({
                    success: false,
                    error: 'Product is already in wishlist'
                });
            }

            // Add to wishlist
            req.user.wishlist.push(productId);
            await req.user.save();

            res.json({
                success: true,
                message: 'Product added to wishlist'
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding to wishlist'
            });
        }
    },

    removeFromWishlist: async (req, res) => {
        try {
            const { productId } = req.params;
            req.user.wishlist = req.user.wishlist.filter(
                id => id.toString() !== productId
            );
            await req.user.save();
            await req.user.populate('wishlist');
            res.json({
                success: true,
                wishlist: req.user.wishlist
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            res.status(500).json({
                success: false,
                error: 'Error removing from wishlist'
            });
        }
    },

    // Address methods
    getAddresses: async (req, res) => {
        try {
            const user = await User.findById(req.user._id).select('addresses');
            res.render('users/addresses', { addresses: user.addresses });
        } catch (error) {
            console.error('Error fetching addresses:', error);
            req.flash('error_msg', 'Error loading addresses');
            res.redirect('/users/profile');
        }
    },

    addAddress: async (req, res) => {
        try {
            const { street, city, state, zipCode, country, isDefault } = req.body;
            const user = await User.findById(req.user._id);

            // Create new address
            const newAddress = {
                street,
                city,
                state,
                zipCode,
                country,
                isDefault: isDefault === 'true'
            };

            // If this is the first address or marked as default, update other addresses
            if (isDefault === 'true' || user.addresses.length === 0) {
                user.addresses.forEach(addr => addr.isDefault = false);
            }

            user.addresses.push(newAddress);
            await user.save();

            req.flash('success_msg', 'Address added successfully');
            res.redirect('/users/addresses');
        } catch (error) {
            console.error('Error adding address:', error);
            req.flash('error_msg', 'Error adding address');
            res.redirect('/users/addresses');
        }
    },

    updateAddress: async (req, res) => {
        try {
            const { addressId } = req.params;
            const { street, city, state, zipCode, country, isDefault } = req.body;
            const user = await User.findById(req.user._id);

            const address = user.addresses.id(addressId);
            if (!address) {
                req.flash('error_msg', 'Address not found');
                return res.redirect('/users/addresses');
            }

            // Update address fields
            address.street = street;
            address.city = city;
            address.state = state;
            address.zipCode = zipCode;
            address.country = country;

            // Handle default address logic
            if (isDefault === 'true' && !address.isDefault) {
                user.addresses.forEach(addr => addr.isDefault = false);
                address.isDefault = true;
            }

            await user.save();
            req.flash('success_msg', 'Address updated successfully');
            res.redirect('/users/addresses');
        } catch (error) {
            console.error('Error updating address:', error);
            req.flash('error_msg', 'Error updating address');
            res.redirect('/users/addresses');
        }
    },

    deleteAddress: async (req, res) => {
        try {
            const { addressId } = req.params;
            const user = await User.findById(req.user._id);

            user.addresses.pull(addressId);
            await user.save();

            req.flash('success_msg', 'Address deleted successfully');
            res.redirect('/users/addresses');
        } catch (error) {
            console.error('Error deleting address:', error);
            req.flash('error_msg', 'Error deleting address');
            res.redirect('/users/addresses');
        }
    },

    checkEmail: async (req, res) => {
        try {
            const { email } = req.body;

            // Basic email validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    available: false,
                    error: 'Invalid email format'
                });
            }

            // Case-insensitive email check
            const existingUser = await User.findOne({ 
                email: { $regex: new RegExp(`^${email}$`, 'i') }
            });
            
            // Add a small delay to prevent brute force attempts
            await new Promise(resolve => setTimeout(resolve, 500));

            res.json({
                available: !existingUser
            });
        } catch (error) {
            console.error('Error checking email:', error);
            res.status(500).json({
                error: 'Error checking email availability'
            });
        }
    },

    activateAccount: async (req, res) => {
        try {
            const { token } = req.params;
            
            const user = await User.findOne({
                activationToken: token,
                activationExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.render('error', {
                    message: 'Invalid or expired activation link',
                    error: { status: 400 }
                });
            }

            user.isActive = true;
            user.activationToken = undefined;
            user.activationExpires = undefined;
            await user.save();

            // Render the success page instead of redirecting
            res.render('users/activation-success', { layout: false });
        } catch (error) {
            console.error('Activation error:', error);
            res.render('error', {
                message: 'Error activating account',
                error: { status: 500 }
            });
        }
    },

    forgotPassword: async (req, res) => {
        try {
            const user = await User.findOne({ email: req.body.email });
            if (!user) {
                return res.status(400).json({
                    success: false,
                    error: 'No account with that email address exists.'
                });
            }

            // Generate reset token
            user.generateResetToken();
            await user.save();

            // Send reset email
            const resetUrl = `${process.env.BASE_URL}/users/reset-password/${user.resetPasswordToken}`;
            await sendMail({
                to: user.email,
                subject: 'Reset Your Password',
                html: `
                    <h2>Reset Your Password</h2>
                    <p>Hello ${user.name},</p>
                    <p>We received a request to reset your password. Click the button below to create a new password:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; 
                                  text-decoration: none; border-radius: 4px; display: inline-block;">
                            Reset Password
                        </a>
                    </div>
                    <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
                `
            });

            res.json({
                success: true,
                message: 'Password reset email sent.'
            });
        } catch (error) {
            console.error('Forgot password error:', error);
            res.status(500).json({
                success: false,
                error: 'Error sending reset email'
            });
        }
    },

    // Get reset password page
    getResetPassword: async (req, res) => {
        try {
            const user = await User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                req.flash('error_msg', 'Password reset token is invalid or has expired');
                return res.redirect('/users/forgot-password');
            }

            res.render('users/reset-password', {
                token: req.params.token,
                messages: {
                    error_msg: req.flash('error_msg'),
                    success_msg: req.flash('success_msg')
                }
            });
        } catch (error) {
            console.error('Reset password error:', error);
            req.flash('error_msg', 'Error processing reset password');
            res.redirect('/users/forgot-password');
        }
    },

    // Process the password reset
    postResetPassword: async (req, res) => {
        try {
            const user = await User.findOne({
                resetPasswordToken: req.params.token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                req.flash('error_msg', 'Password reset token is invalid or has expired');
                return res.redirect('/users/forgot-password');
            }

            // Set the new password
            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            req.flash('success_msg', 'Password has been reset successfully. Please log in with your new password.');
            res.redirect('/users/login');
        } catch (error) {
            console.error('Reset password error:', error);
            req.flash('error_msg', 'Error resetting password');
            res.redirect('/users/forgot-password');
        }
    },

    getOrders: async (req, res) => {
        try {
            // Get orders and populate necessary fields
            const orders = await Order.find({ user: req.user._id })
                .sort({ createdAt: -1 })
                .populate({
                    path: 'items.product',
                    select: 'name images price'
                })
                .lean();

            // Format the orders data
            const formattedOrders = orders.map(order => ({
                _id: order._id,
                createdAt: order.createdAt,
                total: order.total || 0,
                status: order.status || 'processing',
                items: order.items || [],
                shippingAddress: order.shippingAddress || {},
                subtotal: order.subtotal || 0,
                shippingFee: order.shippingFee || 0
            }));

            res.render('users/orders/index', {
                title: 'My Orders',
                orders: formattedOrders,
                messages: {
                    success_msg: req.flash('success_msg'),
                    error_msg: req.flash('error_msg')
                }
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
            req.flash('error_msg', 'Error loading orders');
            res.redirect('/users/profile');
        }
    },

    getOrderDetails: async (req, res) => {
        try {
            const order = await Order.findOne({
                _id: req.params.orderId,
                user: req.user._id
            })
            .populate({
                path: 'items.product',
                select: 'name images price'
            })
            .lean();

            if (!order) {
                req.flash('error_msg', 'Order not found');
                return res.redirect('/users/orders');
            }

            // Format the order data
            const formattedOrder = {
                _id: order._id,
                createdAt: order.createdAt,
                total: order.total || 0,
                status: order.status || 'processing',
                items: order.items || [],
                shippingAddress: order.shippingAddress || {},
                subtotal: order.subtotal || 0,
                shippingFee: order.shippingFee || 0
            };

            res.render('users/orders/details', {
                title: `Order #${order._id}`,
                order: formattedOrder,
                messages: {
                    success_msg: req.flash('success_msg'),
                    error_msg: req.flash('error_msg')
                }
            });
        } catch (error) {
            console.error('Error fetching order details:', error);
            req.flash('error_msg', 'Error loading order details');
            res.redirect('/users/orders');
        }
    },

    reportProduct: async (req, res) => {
        try {
            const { description } = req.body;
            const { productId } = req.params;

            const report = new Report({
                user: req.user._id,
                type: 'product',
                product: productId,
                description
            });

            await report.save();

            req.flash('success_msg', 'Report submitted successfully');
            res.redirect('back');
        } catch (error) {
            console.error('Error submitting report:', error);
            req.flash('error_msg', 'Error submitting report');
            res.redirect('back');
        }
    },

    reportPage: async (req, res) => {
        try {
            const { page, description } = req.body;

            const report = new Report({
                user: req.user._id,
                type: 'page',
                page,
                description
            });

            await report.save();

            req.flash('success_msg', 'Report submitted successfully');
            res.redirect('back');
        } catch (error) {
            console.error('Error submitting report:', error);
            req.flash('error_msg', 'Error submitting report');
            res.redirect('back');
        }
    }
};

module.exports = userController; 