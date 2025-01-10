const isAuth = (req, res, next) => {
    if (!req.user) {
        if (req.xhr || req.headers.accept.includes('json')) {
            return res.status(401).json({
                success: false,
                error: 'Please login to continue'
            });
        }
        return res.redirect('/users/login');
    }
    next();
};

module.exports = {
    isAuth
}; 