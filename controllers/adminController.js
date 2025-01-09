const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const passport = require('passport');
const Category = require('../models/categoryModel');

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

                // Check if user is admin
                if (!user.isAdmin) {
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

                    // Redirect to admin dashboard
                    res.redirect('/admin/dashboard');
                });
            } catch (error) {
                console.error('Login error:', error);
                req.flash('error_msg', 'An error occurred during login');
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
            const users = await User.find().sort({ createdAt: -1 });
            res.render('admin/users/index', {
                layout: 'layouts/adminLayout',
                users
            });
        } catch (error) {
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
    }
};

module.exports = adminController; 