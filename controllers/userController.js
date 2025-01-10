const User = require('../models/userModel');
const passport = require('passport');
const { sendMail } = require('../config/mail');

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
            // Get user with populated data
            const user = await User.findById(req.user._id)
                .select('-password')
                .populate('cart.product')
                .populate('wishlist');
            
            res.render('users/profile', { 
                title: 'My Profile',
                user 
            });
        } catch (error) {
            console.error('Error fetching profile:', error);
            req.flash('error_msg', 'Error loading profile');
            res.redirect('/');
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { name, email, phone } = req.body;

            // Validate input
            if (!name || !email || !phone) {
                return res.status(400).json({
                    success: false,
                    error: 'All fields are required'
                });
            }

            // Check if email is taken (excluding current user)
            const existingUser = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: req.user._id }
            });

            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    error: 'Email is already taken'
                });
            }

            // Update user
            const updatedUser = await User.findByIdAndUpdate(
                req.user._id,
                {
                    name,
                    email: email.toLowerCase(),
                    phone
                },
                { new: true }
            );

            res.json({
                success: true,
                user: {
                    name: updatedUser.name,
                    email: updatedUser.email,
                    phone: updatedUser.phone
                }
            });
        } catch (error) {
            console.error('Profile update error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating profile'
            });
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;

            // Validate input
            if (!currentPassword || !newPassword) {
                return res.status(400).json({
                    success: false,
                    error: 'All fields are required'
                });
            }

            // Get user with password
            const user = await User.findById(req.user._id);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            // Update password
            user.password = newPassword;
            await user.save();

            res.json({
                success: true,
                message: 'Password updated successfully'
            });
        } catch (error) {
            console.error('Password update error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating password'
            });
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
            const { email } = req.body;

            // Find user and validate email
            const user = await User.findOne({ 
                email: { $regex: new RegExp(`^${email}$`, 'i') }
            });

            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'No account found with this email address'
                });
            }

            // Generate reset token
            user.generateResetToken();
            await user.save();

            // Send reset email
            const resetUrl = `${process.env.BASE_URL}/users/reset-password/${user.resetPasswordToken}`;
            await sendMail({
                to: user.email,
                subject: 'Reset Your Password - Gaming Store',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Reset Your Password</h2>
                        <p>Hello ${user.name},</p>
                        <p>We received a request to reset your password. Click the button below to create a new password:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #007bff; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 4px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            If the button doesn't work, copy and paste this link into your browser:
                            <br>
                            ${resetUrl}
                        </p>
                    </div>
                `
            });

            // Ensure we're sending JSON response
            res.json({
                success: true,
                message: 'Password reset link sent to your email'
            });

        } catch (error) {
            console.error('Forgot password error:', error);
            // Ensure error response is also JSON
            res.status(500).json({
                success: false,
                error: 'Error processing your request. Please try again.'
            });
        }
    },

    resetPassword: async (req, res) => {
        try {
            const { token } = req.params;
            const { password } = req.body;

            // Find user with valid reset token
            const user = await User.findOne({
                resetPasswordToken: token,
                resetPasswordExpires: { $gt: Date.now() }
            });

            if (!user) {
                return res.render('users/reset-password', {
                    token: req.params.token,
                    error: 'Password reset link is invalid or has expired'
                });
            }

            // Update password and clear reset token
            user.password = password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();

            // Send confirmation email
            await sendMail({
                to: user.email,
                subject: 'Password Successfully Reset - Gaming Store',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset Successful</h2>
                        <p>Hello ${user.name},</p>
                        <p>Your password has been successfully reset. You can now log in with your new password.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${process.env.BASE_URL}/users/login" 
                               style="background-color: #28a745; color: white; padding: 12px 24px; 
                                      text-decoration: none; border-radius: 4px; display: inline-block;">
                                Login Now
                            </a>
                        </div>
                        <p style="color: #666; font-size: 14px;">
                            If you didn't make this change or if you believe an unauthorized person has accessed your account,
                            please contact us immediately.
                        </p>
                    </div>
                `
            });

            req.flash('success_msg', 'Password has been reset! You can now login with your new password.');
            res.redirect('/users/login');

        } catch (error) {
            console.error('Reset password error:', error);
            res.render('users/reset-password', {
                token: req.params.token,
                error: 'Error resetting password. Please try again.'
            });
        }
    }
};

module.exports = userController; 