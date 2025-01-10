const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const methodOverride = require('method-override');
require('dotenv').config();

const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const homeController = require('./controllers/homeController');
const adminRoutes = require('./routes/adminRoutes');
const errorHandler = require('./middleware/errorHandler');
const cartRoutes = require('./routes/cartRoutes');
const pageRoutes = require('./routes/pageRoutes');
const cartMiddleware = require('./middleware/cartMiddleware');
const orderRoutes = require('./routes/orderRoutes');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log('MongoDB Connection Error:', err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Passport config
require('./config/passport')(passport);

// Flash messages
app.use(flash());

// Global variables
app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// View engine setup
app.use(expressLayouts);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('layout', 'layouts/main');

// Add method-override middleware before routes
app.use(methodOverride('_method'));

// Add this before your routes
app.use((req, res, next) => {
    if (req.method === 'POST' && req.path === '/admin/products') {
        console.log('Product creation request body:', req.body);
        console.log('Product creation request files:', req.files);
    }
    next();
});

// Add this before your routes
app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
        body: req.body,
        user: req.user ? req.user._id : null
    });
    next();
});

// Move cartMiddleware before routes
app.use(cartMiddleware);

// Move this middleware before your routes
app.use(async (req, res, next) => {
    if (req.user) {
        try {
            // Populate user cart
            await req.user.populate({
                path: 'cart.product',
                select: 'name price images'
            });

            // Clean up cart by removing items with invalid products
            req.user.cart = req.user.cart.filter(item => item.product);
            await req.user.save();

        } catch (error) {
            console.error('Error populating cart:', error);
        }
    }
    next();
});

// Add flash messages to all routes
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.warning_msg = req.flash('warning_msg');
    res.locals.error = req.flash('error');
    next();
});

// Routes
app.get('/', homeController.getHome);
app.use('/users', userRoutes);
app.use('/products', productRoutes);
app.use('/admin', adminRoutes);
app.use('/cart', cartRoutes);
app.use('/', pageRoutes);
app.use('/orders', orderRoutes);

// Add request logging middleware
app.use((req, res, next) => {
    console.log('Request:', {
        method: req.method,
        path: req.path,
        body: req.body,
        user: req.user ? req.user._id : 'Not logged in'
    });
    next();
});

// Add error handling middleware
app.use(errorHandler);

// Add this after your routes
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).render('error', {
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err : {}
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 