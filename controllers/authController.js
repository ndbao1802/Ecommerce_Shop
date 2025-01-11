postLogin: async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });

        // Check if user exists
        if (!user) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Check if account is banned
        if (!user.isActive) {
            req.flash('error_msg', 'Your account has been banned');
            return res.redirect('/auth/login');
        }

        // Check if email is verified
        if (!user.isEmailVerified) {
            req.flash('error_msg', 'Please verify your email before logging in');
            return res.redirect('/auth/login');
        }

        // Verify password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            req.flash('error_msg', 'Invalid email or password');
            return res.redirect('/auth/login');
        }

        // Log in the user
        req.login(user, (err) => {
            if (err) {
                console.error('Login error:', err);
                req.flash('error_msg', 'Error during login');
                return res.redirect('/auth/login');
            }
            res.redirect('/');
        });

    } catch (error) {
        console.error('Login error:', error);
        req.flash('error_msg', 'Error processing login');
        res.redirect('/auth/login');
    }
} 