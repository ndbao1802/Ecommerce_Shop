const User = require('../models/userModel');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const passport = require('passport');
const Role = require('../models/roleModel');

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

exports.getCreateUser = async (req, res) => {
    try {
        const roles = await Role.find();
        res.render('admin/users/create', {
            layout: 'layouts/adminLayout',
            roles
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading roles');
        res.redirect('/admin/users');
    }
};

exports.postCreateUser = async (req, res) => {
    try {
        const { name, email, password, phone, roles } = req.body;

        // Validation
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error_msg', 'Email already registered');
            return res.redirect('/admin/users/create');
        }

        // Create new user with roles
        const user = new User({
            name,
            email,
            password,
            phone,
            roles: roles // Array of role IDs
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