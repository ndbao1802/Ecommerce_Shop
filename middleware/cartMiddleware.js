const cartMiddleware = async (req, res, next) => {
    if (req.user) {
        try {
            // Populate cart data
            await req.user.populate({
                path: 'cart.product',
                select: 'name price images stock'
            });

            // Clean up cart (remove invalid products)
            req.user.cart = req.user.cart.filter(item => item.product);
            await req.user.save();

            // Calculate cart total
            req.user.cartTotal = req.user.cart.reduce((total, item) => {
                return total + (item.product.price * item.quantity);
            }, 0);

            // Add cart data to locals for views
            res.locals.cartCount = req.user.cart.length;
            res.locals.cartTotal = req.user.cartTotal;
            res.locals.cartItems = req.user.cart;
        } catch (error) {
            console.error('Cart middleware error:', error);
        }
    }
    next();
};

module.exports = cartMiddleware; 