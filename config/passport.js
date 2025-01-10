const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/userModel');

module.exports = (passport) => {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const user = await User.findOne({ email });
                
                if (!user) {
                    return done(null, false, { message: 'Email is not registered' });
                }

                // Check if account is activated
                if (!user.isActive) {
                    return done(null, false, { 
                        message: 'Please activate your account. Check your email for the activation link.' 
                    });
                }

                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    return done(null, false, { message: 'Invalid password' });
                }

                return done(null, user);
            } catch (error) {
                return done(error);
            }
        })
    );

    passport.serializeUser((user, done) => {
        done(null, user.id);
    });

    passport.deserializeUser(async (id, done) => {
        try {
            const user = await User.findById(id);
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
}; 