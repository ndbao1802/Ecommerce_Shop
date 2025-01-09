const User = require('../models/userModel');
const passport = require('passport');
const bcrypt = require('bcryptjs');

exports.getLogin = (req, res) => {
    res.render('users/login');
};

exports.getRegister = (req, res) => {
    res.render('users/register');
};

exports.postLogin = (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
};

exports.postRegister = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Validation
        const errors = [];
        if (!name || !email || !password) {
            errors.push('All fields are required');
        }
        if (password.length < 6) {
            errors.push('Password must be at least 6 characters');
        }
        if (errors.length > 0) {
            req.flash('error_msg', errors);
            return res.redirect('/users/register');
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error_msg', 'Email is already registered');
            return res.redirect('/users/register');
        }

        // Set isAdmin true for specific email
        const isAdmin = email === 'admin@gmail.com';

        // Create new user
        const newUser = new User({
            name,
            email,
            password,
            isAdmin,
            isActive: true
        });

        await newUser.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
    } catch (error) {
        console.error('Registration error:', error);
        req.flash('error_msg', 'Registration failed');
        res.redirect('/users/register');
    }
};

exports.logout = (req, res, next) => {
    req.logout((err) => {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.render('users/profile', { user });
    } catch (error) {
        req.flash('error_msg', 'Error loading profile');
        res.redirect('/');
    }
}; 