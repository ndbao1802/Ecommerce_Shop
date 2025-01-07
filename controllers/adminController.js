const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const passport = require('passport');

exports.getLogin = (req, res) => {
    res.render('admin/login', { layout: 'layouts/adminLayout' });
};

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/admin/dashboard',
        failureRedirect: '/admin/login',
        failureFlash: true
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
        res.render('admin/products', {
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
        const users = await User.find().select('-password');
        res.render('admin/users', {
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