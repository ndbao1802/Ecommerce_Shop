const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const passport = require('passport');
const Role = require('../models/roleModel');

exports.getLogin = (req, res) => {
    res.render('admin/login', { layout: 'layouts/adminLayout' });
};

exports.postLogin = (req, res, next) => {
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
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/admin/login');
    });
};

exports.getDashboard = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        const totalOrders = await Order.countDocuments();
        const recentOrders = await Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .populate('user', 'name email');

        res.render('admin/dashboard', {
            layout: 'layouts/adminLayout',
            totalUsers,
            totalProducts,
            totalOrders,
            recentOrders
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading dashboard');
        res.redirect('/admin/login');
    }
};

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('admin/products/index', {
            layout: 'layouts/adminLayout',
            products
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading products');
        res.redirect('/admin/dashboard');
    }
};

exports.getUsers = async (req, res) => {
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
};

exports.getOrders = async (req, res) => {
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
};

exports.getCreateUser = (req, res) => {
    res.render('admin/users/create', {
        layout: 'layouts/adminLayout'
    });
};

exports.postCreateUser = async (req, res) => {
    try {
        const { name, email, password, confirmPassword, isAdmin, isActive } = req.body;

        // Validate password match
        if (password !== confirmPassword) {
            req.flash('error_msg', 'Passwords do not match');
            return res.redirect('/admin/users/create');
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error_msg', 'Email already registered');
            return res.redirect('/admin/users/create');
        }

        // Create new user
        const user = new User({
            name,
            email,
            password, // Will be hashed by the model's pre-save hook
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
};

exports.getSettings = async (req, res) => {
    try {
        res.render('admin/settings', {
            layout: 'layouts/adminLayout'
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading settings');
        res.redirect('/admin/dashboard');
    }
};

exports.updateSettings = async (req, res) => {
    try {
        // Handle settings update logic here
        req.flash('success_msg', 'Settings updated successfully');
        res.redirect('/admin/settings');
    } catch (error) {
        req.flash('error_msg', 'Error updating settings');
        res.redirect('/admin/settings');
    }
}; 