const checkSetup = (req, res, next) => {
    // Skip setup check for these paths
    const setupExemptPaths = [
        '/users/complete-setup',
        '/users/logout',
        '/users/auth/google',
        '/users/auth/google/callback'
    ];

    if (req.isAuthenticated() && 
        !req.user.isSetupComplete && 
        !setupExemptPaths.includes(req.path)) {
        console.log('Redirecting to setup - user:', req.user);
        return res.redirect('/users/complete-setup');
    }
    next();
};

module.exports = {
    isAuth: (req, res, next) => {
        if (!req.isAuthenticated()) {
            req.flash('error_msg', 'Please log in to access this resource');
            return res.redirect('/users/login');
        }
        return checkSetup(req, res, next);
    },
    checkSetup
}; 