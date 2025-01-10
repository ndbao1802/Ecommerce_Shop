const User = require('../models/userModel');
const passport = require('passport');

const userController = {
    // Auth methods
    register: async (req, res) => {
        try {
            const { name, email, password, phone } = req.body;

            // Check if user exists
            const userExists = await User.findOne({ email });
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    error: 'Email already registered'
                });
            }

            // Create user
            const user = new User({
                name,
                email,
                password,
                phone
            });

            await user.save();

            // Auto login after register
            req.login(user, (err) => {
                if (err) {
                    console.error('Login error:', err);
                    return res.status(500).json({
                        success: false,
                        error: 'Error logging in'
                    });
                }
                res.json({ success: true });
            });

        } catch (error) {
            console.error('Register error:', error);
            res.status(500).json({
                success: false,
                error: 'Error registering user'
            });
        }
    },

    login: (req, res, next) => {
        passport.authenticate('local', (err, user, info) => {
            if (err) {
                return next(err);
            }
            if (!user) {
                // For AJAX requests
                if (req.xhr || req.headers.accept.includes('json')) {
                    return res.status(401).json({
                        success: false,
                        error: info.message
                    });
                }
                // For regular form submissions
                req.flash('error_msg', info.message);
                return res.redirect('/users/login');
            }
            req.login(user, (err) => {
                if (err) {
                    return next(err);
                }
                // For AJAX requests
                if (req.xhr || req.headers.accept.includes('json')) {
                    return res.json({ 
                        success: true,
                        redirect: '/' // Add redirect URL
                    });
                }
                // For regular form submissions
                return res.redirect('/');
            });
        })(req, res, next);
    },

    logout: (req, res) => {
        req.logout(() => {
            res.redirect('/');
        });
    },

    // Profile methods
    getProfile: async (req, res) => {
        try {
            const user = await User.findById(req.user._id)
                .select('-password');
            res.json({
                success: true,
                user
            });
        } catch (error) {
            console.error('Profile error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting profile'
            });
        }
    },

    updateProfile: async (req, res) => {
        try {
            const { name, email, phone } = req.body;
            const user = await User.findById(req.user._id);

            user.name = name;
            user.email = email;
            user.phone = phone;

            await user.save();

            res.json({
                success: true,
                user: {
                    name: user.name,
                    email: user.email,
                    phone: user.phone
                }
            });
        } catch (error) {
            console.error('Update error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating profile'
            });
        }
    },

    updatePassword: async (req, res) => {
        try {
            const { currentPassword, newPassword } = req.body;
            const user = await User.findById(req.user._id);

            // Verify current password
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({
                    success: false,
                    error: 'Current password is incorrect'
                });
            }

            user.password = newPassword;
            await user.save();

            res.json({ success: true });
        } catch (error) {
            console.error('Password update error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating password'
            });
        }
    },

    // Cart methods
    getCart: async (req, res) => {
        try {
            await req.user.populate('cart.product');
            res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal
                }
            });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting cart'
            });
        }
    },

    addToCart: async (req, res) => {
        try {
            const { productId, quantity } = req.body;
            await req.user.addToCart(productId, quantity);
            await req.user.populate('cart.product');

            res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal
                }
            });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding to cart'
            });
        }
    },

    removeFromCart: async (req, res) => {
        try {
            const { productId } = req.params;
            await req.user.removeFromCart(productId);
            await req.user.populate('cart.product');

            res.json({
                success: true,
                cart: {
                    items: req.user.cart,
                    total: req.user.cartTotal
                }
            });
        } catch (error) {
            console.error('Cart error:', error);
            res.status(500).json({
                success: false,
                error: 'Error removing from cart'
            });
        }
    },

    // Wishlist methods
    getWishlist: async (req, res) => {
        try {
            await req.user.populate('wishlist');
            res.json({
                success: true,
                wishlist: req.user.wishlist
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting wishlist'
            });
        }
    },

    addToWishlist: async (req, res) => {
        try {
            const { productId } = req.params;
            if (!req.user.wishlist.includes(productId)) {
                req.user.wishlist.push(productId);
                await req.user.save();
            }
            await req.user.populate('wishlist');
            res.json({
                success: true,
                wishlist: req.user.wishlist
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding to wishlist'
            });
        }
    },

    removeFromWishlist: async (req, res) => {
        try {
            const { productId } = req.params;
            req.user.wishlist = req.user.wishlist.filter(
                id => id.toString() !== productId
            );
            await req.user.save();
            await req.user.populate('wishlist');
            res.json({
                success: true,
                wishlist: req.user.wishlist
            });
        } catch (error) {
            console.error('Wishlist error:', error);
            res.status(500).json({
                success: false,
                error: 'Error removing from wishlist'
            });
        }
    },

    // Address methods
    getAddresses: async (req, res) => {
        try {
            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error getting addresses'
            });
        }
    },

    addAddress: async (req, res) => {
        try {
            const { street, ward, district, city, isDefault } = req.body;
            
            if (isDefault) {
                req.user.addresses.forEach(addr => addr.isDefault = false);
            }

            req.user.addresses.push({
                street,
                ward,
                district,
                city,
                isDefault
            });

            await req.user.save();

            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error adding address'
            });
        }
    },

    updateAddress: async (req, res) => {
        try {
            const { addressId } = req.params;
            const { street, ward, district, city, isDefault } = req.body;

            const address = req.user.addresses.id(addressId);
            if (!address) {
                return res.status(404).json({
                    success: false,
                    error: 'Address not found'
                });
            }

            if (isDefault) {
                req.user.addresses.forEach(addr => addr.isDefault = false);
            }

            address.street = street;
            address.ward = ward;
            address.district = district;
            address.city = city;
            address.isDefault = isDefault;

            await req.user.save();

            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error updating address'
            });
        }
    },

    deleteAddress: async (req, res) => {
        try {
            const { addressId } = req.params;
            req.user.addresses = req.user.addresses.filter(
                addr => addr._id.toString() !== addressId
            );
            await req.user.save();

            res.json({
                success: true,
                addresses: req.user.addresses
            });
        } catch (error) {
            console.error('Address error:', error);
            res.status(500).json({
                success: false,
                error: 'Error deleting address'
            });
        }
    }
};

module.exports = userController; 