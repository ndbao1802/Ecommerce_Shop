const LocalStrategy = require('passport-local').Strategy;
const GoogleStrategy = require('passport-google-oauth20').Strategy;
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

    // Google Strategy
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.BASE_URL}/users/auth/google/callback`,
        passReqToCallback: true
    },
    async (req, accessToken, refreshToken, profile, done) => {
        try {
            console.log('Google profile:', profile); // Debug log

            if (!profile.emails || !profile.emails[0]) {
                console.error('No email found in Google profile');
                return done(null, false, { message: 'No email provided from Google' });
            }

            const email = profile.emails[0].value;
            console.log('Checking for existing user with email:', email); // Debug log

            // Check if user already exists
            let user = await User.findOne({ 
                $or: [
                    { email: email },
                    { googleId: profile.id }
                ]
            });

            if (user) {
                console.log('Existing user found:', user._id); // Debug log
                // If user exists but was registered with email/password
                if (!user.googleId) {
                    user.googleId = profile.id;
                    await user.save();
                }
                return done(null, user);
            }

            console.log('Creating new user for Google auth'); // Debug log

            // Create new user
            user = new User({
                googleId: profile.id,
                name: profile.displayName,
                email: email,
                password: Math.random().toString(36).slice(-8), // Random password for Google users
                isActive: true, // Google users are automatically verified
                isSetupComplete: false
            });

            await user.save();
            console.log('New user created:', user._id); // Debug log
            return done(null, user);

        } catch (error) {
            console.error('Google auth error:', error); // Debug log
            return done(error, null);
        }
    }));
}; 