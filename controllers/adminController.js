const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const passport = require('passport');
const Category = require('../models/categoryModel');
const bcrypt = require('bcryptjs');
const { cloudinary } = require('../config/cloudinary');

const adminController = {
    getLogin: (req, res) => {
        res.render('admin/login', { layout: 'layouts/adminLayout' });
    },

    postLogin: (req, res, next) => {
        passport.authenticate('local', async (err, user, info) => {
            try {
                if (err) {
                    console.error('Authentication error:', err);
                    req.flash('error_msg', 'Authentication error occurred');
                    return res.redirect('/admin/login');
                }

                if (!user) {
                    req.flash('error_msg', info.message || 'Invalid credentials');
                    return res.redirect('/admin/login');
                }

                // Check if user is an admin
                if (user.role !== 'admin') {
                    req.flash('error_msg', 'Access denied. Admin privileges required.');
                    return res.redirect('/admin/login');
                }

                // Log in the user
                req.logIn(user, (err) => {
                    if (err) {
                        console.error('Login error:', err);
                        req.flash('error_msg', 'Error during login');
                        return res.redirect('/admin/login');
                    }
                    return res.redirect('/admin/dashboard');
                });

            } catch (error) {
                console.error('Login error:', error);
                req.flash('error_msg', 'Error processing login');
                res.redirect('/admin/login');
            }
        })(req, res, next);
    },

    logout: (req, res, next) => {
        req.logout((err) => {
            if (err) { return next(err); }
            req.flash('success_msg', 'You are logged out');
            res.redirect('/admin/login');
        });
    },

    getDashboard: async (req, res) => {
        try {
            const productsCount = await Product.countDocuments();
            const categoriesCount = await Category.countDocuments();
            const ordersCount = await Order.countDocuments();
            const recentProducts = await Product.find()
                .sort({ createdAt: -1 })
                .limit(5)
                .populate('category');

            res.render('admin/dashboard', {
                layout: 'layouts/adminLayout',
                counts: {
                    products: productsCount,
                    categories: categoriesCount,
                    orders: ordersCount
                },
                recentProducts
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
            req.flash('error_msg', 'Error loading dashboard');
            res.redirect('/admin/login');
        }
    },

    getUsers: async (req, res) => {
        try {
            const users = await User.find({})
                .select('name email role isActive createdAt')
                .lean();

            res.render('admin/users', {
                layout: 'layouts/adminLayout',
                title: 'User Management',
                users: users,
                currentUser: req.user
            });
        } catch (error) {
            console.error('Get users error:', error);
            req.flash('error_msg', 'Error loading users');
            res.redirect('/admin/dashboard');
        }
    },

    getCreateUser: (req, res) => {
        res.render('admin/users/create', {
            layout: 'layouts/adminLayout'
        });
    },

    postCreateUser: async (req, res) => {
        try {
            const { name, email, password, isAdmin, isActive } = req.body;

            const user = new User({
                name,
                email,
                password,
                isAdmin: isAdmin === 'on',
                isActive: isActive === 'on'
            });

            await user.save();
            req.flash('success_msg', 'User created successfully');
            res.redirect('/admin/users');
        } catch (error) {
            console.error('Error creating user:', error);
            req.flash('error_msg', 'Error creating user');
            res.redirect('/admin/users/create');
        }
    },

    getOrders: async (req, res) => {
        try {
            const orders = await Order.find()
                .populate('user', 'name email')
                .sort({ createdAt: -1 });
            res.render('admin/orders', {
                layout: 'layouts/adminLayout',
                orders
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading orders');
            res.redirect('/admin/dashboard');
        }
    },

    getSettings: async (req, res) => {
        try {
            res.render('admin/settings', {
                layout: 'layouts/adminLayout'
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading settings');
            res.redirect('/admin/dashboard');
        }
    },

    updateSettings: async (req, res) => {
        try {
            // Handle settings update logic here
            req.flash('success_msg', 'Settings updated successfully');
            res.redirect('/admin/settings');
        } catch (error) {
            req.flash('error_msg', 'Error updating settings');
            res.redirect('/admin/settings');
        }
    },

    deleteUser: async (req, res) => {
        try {
            const userId = req.params.userId;

            // Check if trying to delete own account
            if (userId === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete your own account'
                });
            }

            // Find user and check if they're an admin
            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            if (user.role === 'admin') {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot delete admin accounts'
                });
            }

            await User.findByIdAndDelete(userId);

            res.json({
                success: true,
                message: 'User deleted successfully'
            });

        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                error: 'Error deleting user'
            });
        }
    },

    toggleUserStatus: async (req, res) => {
        try {
            const userId = req.params.userId;

            // Check if trying to modify own account
            if (userId === req.user._id.toString()) {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot modify your own account status'
                });
            }

            const user = await User.findById(userId);
            if (!user) {
                return res.status(404).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // Prevent modifying other admin accounts
            if (user.role === 'admin') {
                return res.status(400).json({
                    success: false,
                    error: 'Cannot modify admin account status'
                });
            }

            // Toggle isActive status
            user.isActive = !user.isActive;
            await user.save();

            res.json({
                success: true,
                message: `User ${user.isActive ? 'unbanned' : 'banned'} successfully`
            });

        } catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating user status'
            });
        }
    },

    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user.id).lean();
            res.render('admin/profile', {
                layout: 'layouts/adminLayout',
                user,
                messages: {
                    success_msg: req.flash('success_msg'),
                    error_msg: req.flash('error_msg')
                }
            });
        } catch (error) {
            console.error('Error loading profile:', error);
            req.flash('error_msg', 'Error loading profile');
            res.redirect('/admin/dashboard');
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { name, email, currentPassword, newPassword, confirmPassword } = req.body;
            const admin = await User.findById(req.user.id);

            // Update basic info
            admin.name = name;
            admin.email = email;

            // Update avatar if uploaded
            if (req.file) {
                try {
                    // Delete old avatar from Cloudinary if exists
                    if (admin.avatar && admin.avatar.includes('cloudinary')) {
                        const publicId = admin.avatar.split('/').pop().split('.')[0];
                        await cloudinary.uploader.destroy(publicId);
                    }
                    
                    // The new avatar URL will be in req.file.path
                    admin.avatar = req.file.path;
                    console.log('New avatar path:', req.file.path);
                } catch (error) {
                    console.error('Error handling avatar:', error);
                    req.flash('error_msg', 'Error updating profile picture');
                    return res.redirect('/admin/profile');
                }
            }

            // Handle password change
            if (currentPassword && newPassword) {
                if (newPassword !== confirmPassword) {
                    req.flash('error_msg', 'New passwords do not match');
                    return res.redirect('/admin/profile');
                }

                // Verify current password
                const isMatch = await bcrypt.compare(currentPassword, admin.password);
                if (!isMatch) {
                    req.flash('error_msg', 'Current password is incorrect');
                    return res.redirect('/admin/profile');
                }

                // Hash new password
                const salt = await bcrypt.genSalt(10);
                admin.password = await bcrypt.hash(newPassword, salt);
            }

            await admin.save();
            console.log('Profile updated successfully');
            req.flash('success_msg', 'Profile updated successfully');
            res.redirect('/admin/profile');
        } catch (error) {
            console.error('Profile update error:', error);
            req.flash('error_msg', 'Error updating profile');
            res.redirect('/admin/profile');
        }
    }
};

module.exports = adminController; 