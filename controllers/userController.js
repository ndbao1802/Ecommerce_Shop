const User = require('../models/userModel');
const passport = require('passport');
const { sendMail } = require('../config/mail');

const userController = {
    // Auth methods
    register: async (req, res) => {
        try {
            const { name, email, password, phone } = req.body;

            // Check if user exists
            let user = await User.findOne({ email });
            if (user) {
                return res.render('users/register', {
                    error: 'Email already registered',
                    values: req.body // Preserve form values
                });
            }

            // Create new user
            user = new User({ 
                name, 
                email, 
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

    login: (req, res, next) => {
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
            const user = await User.findById(req.user._id)
                .select('-password');
            res.json({
                success: true,
                user
            });
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting profile'
            });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { name, email, phone } = req.body;
            const user = await User.findById(req.user._id);

            user.name = name;
            user.email = email;
            user.phone = phone;

            await user.save();

            res.json({
                success: true,
                user: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        } catch (error) {
            console.error('Update error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating profile'
            });
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user._id);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            user.password = newPassword;
            await user.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Password update error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating password'
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
            await req.user.populate('wishlist');
            res.json({
                success: true,
                wishlist: req.user.wishlist
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting wishlist'
            });
        }
    },

    addToWishlist: async (req, res) => {
        try {
            const { productId } = req.params;
            if (!req.user.wishlist.includes(productId)) {
                req.user.wishlist.push(productId);
                await req.user.save();
            }
            await req.user.populate('wishlist');
            res.json({
                success: true,
                wishlist: req.user.wishlist
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
            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting addresses'
            });
        }
    },

    addAddress: async (req, res) => {
        try {
            const { street, ward, district, city, isDefault } = req.body;
            
            if (isDefault) {
                req.user.addresses.forEach(addr => addr.isDefault = false);
            }

            req.user.addresses.push({
                street,
                ward,
                district,
                city,
                isDefault
            });

            await req.user.save();

            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding address'
            });
        }
    },

    updateAddress: async (req, res) => {
        try {
            const { addressId } = req.params;
            const { street, ward, district, city, isDefault } = req.body;

            const address = req.user.addresses.id(addressId);
            if (!address) {
                return res.status(404).json({
                    success: false,
                    error: 'Address not found'
                });
            }

            if (isDefault) {
                req.user.addresses.forEach(addr => addr.isDefault = false);
            }

            address.street = street;
            address.ward = ward;
            address.district = district;
            address.city = city;
            address.isDefault = isDefault;

            await req.user.save();

            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating address'
            });
        }
    },

    deleteAddress: async (req, res) => {
        try {
            const { addressId } = req.params;
            req.user.addresses = req.user.addresses.filter(
                addr => addr._id.toString() !== addressId
            );
            await req.user.save();

            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error deleting address'
            });
        }
    },

    checkEmail: async (req, res) => {
        try {
            const { email } = req.body;
            const existingUser = await User.findOne({ email });
            
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
            const { email } = req.body;
            const user = await User.findOne({ email });

            if (!user) {
                return res.render('users/forgot-password', {
                    error: 'No account found with that email'
                });
            }

            // Generate reset token
            user.generateResetToken();
            await user.save();

            // Send reset email
            const resetUrl = `${process.env.BASE_URL}/users/reset-password/${user.resetPasswordToken}`;
            await sendMail({
                to: user.email,
                subject: 'Reset your password',
                html: `
                    <h1>Password Reset Request</h1>
                    <p>Click the link below to reset your password:</p>
                    <a href="${resetUrl}">${resetUrl}</a>
                    <p>This link will expire in 1 hour.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                `
            });

            req.flash('success_msg', 'Password reset link sent to your email');
            res.redirect('/users/login');
        } catch (error) {
            console.error('Forgot password error:', error);
            res.render('users/forgot-password', {
                error: 'Error processing request'
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token } = req.params;
            const { password } = req.body;

            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                req.flash('error_msg', 'Invalid or expired reset link');
                return res.redirect('/users/forgot-password');
            }

            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            req.flash('success_msg', 'Password has been reset! You can now login.');
            res.redirect('/users/login');
        } catch (error) {
            console.error('Reset password error:', error);
            req.flash('error_msg', 'Error resetting password');
            res.redirect('/users/forgot-password');
        }
    }
};

module.exports = userController; 