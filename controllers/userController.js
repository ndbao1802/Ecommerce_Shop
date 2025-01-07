const User = require('../models/userModel');
const passport = require('passport');

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
        
        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            req.flash('error_msg', 'Email is already registered');
            return res.redirect('/users/register');
        }

        // Create new user
        const user = new User({
            name,
            email,
            password
        });

        await user.save();
        req.flash('success_msg', 'You are now registered and can log in');
        res.redirect('/users/login');
    } catch (error) {
        console.error(error);
        req.flash('error_msg', 'Registration failed');
        res.redirect('/users/register');
    }
};

exports.logout = (req, res) => {
    req.logout(function(err) {
        if (err) { return next(err); }
        req.flash('success_msg', 'You are logged out');
        res.redirect('/users/login');
    });
}; 