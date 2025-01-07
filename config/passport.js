const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/userModel');

module.exports = (passport) => {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
            try {
                const user = await User.findOne({ email }).populate('roles');
                
                if (!user) {
                    return done(null, false, { message: 'Email is not registered' });
                }

                const isMatch = await user.comparePassword(password);
                if (!isMatch) {
                    return done(null, false, { message: 'Password is incorrect' });
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
            const user = await User.findById(id).populate('roles');
            done(null, user);
        } catch (error) {
            done(error);
        }
    });
}; 