module.exports = {
    ensureAdmin: function(req, res, next) {
        if (req.isAuthenticated() && req.user.role === 'admin') {
            return next();
        }
        req.flash('error_msg', 'Please log in as admin to access this resource');
        res.redirect('/admin/login');
    }
}; 