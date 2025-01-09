const Role = require('../models/roleModel');
const User = require('../models/userModel');

module.exports = {
    ensureAdmin: function(req, res, next) {
        if (req.isAuthenticated() && req.user.role === 'admin') {
            return next();
        }
        req.flash('error_msg', 'Please log in as admin to access this resource');
        res.redirect('/admin/login');
    },

    ensureEmployee: function(req, res, next) {
        if (req.isAuthenticated() && (req.user.isAdmin || req.user.roles.includes('employee'))) {
            return next();
        }
        req.flash('error_msg', 'Access denied');
        res.redirect('/');
    }
}; 