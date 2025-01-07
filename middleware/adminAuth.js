const Role = require('../models/roleModel');
const User = require('../models/userModel');

module.exports = {
    ensureAdmin: async function(req, res, next) {
        try {
            if (req.isAuthenticated()) {
                const user = await User.findById(req.user._id).populate('roles');
                if (user && user.roles.some(role => role.name === 'admin')) {
                    return next();
                }
            }
            req.flash('error_msg', 'Please log in as admin to access this resource');
            res.redirect('/admin/login');
        } catch (error) {
            console.error('Auth middleware error:', error);
            req.flash('error_msg', 'Authentication error');
            res.redirect('/admin/login');
        }
    },

    ensureEmployee: async function(req, res, next) {
        if (req.isAuthenticated()) {
            const user = await User.findById(req.user._id).populate('roles');
            if (user.roles.some(role => ['admin', 'employee'].includes(role.name))) {
                return next();
            }
        }
        req.flash('error_msg', 'Access denied');
        res.redirect('/');
    }
}; 