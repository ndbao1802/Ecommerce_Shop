const User = require('../models/userModel');
const Product = require('../models/productModel');

exports.getCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id)
            .populate({
                path: 'cart.product',
                populate: { path: 'category' }
            });

        let total = 0;
        user.cart.forEach(item => {
            total += item.product.price * item.quantity;
        });

        res.render('cart/index', {
            cartItems: user.cart,
            total
        });
    } catch (error) {
        console.error('Error fetching cart:', error);
        req.flash('error_msg', 'Error loading cart');
        res.redirect('/');
    }
};

exports.addToCart = async (req, res) => {
    try {
        const { productId, quantity = 1, selectedSize, selectedColor } = req.body;
        const user = await User.findById(req.user._id);
        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        // Check if product is already in cart
        const cartItemIndex = user.cart.findIndex(item => 
            item.product.toString() === productId &&
            item.selectedSize === selectedSize &&
            item.selectedColor === selectedColor
        );

        if (cartItemIndex > -1) {
            // Update quantity if product exists
            user.cart[cartItemIndex].quantity += parseInt(quantity);
        } else {
            // Add new item if product doesn't exist
            user.cart.push({
                product: productId,
                quantity: parseInt(quantity),
                selectedSize,
                selectedColor
            });
        }

        await user.save();
        res.json({ 
            success: true, 
            message: 'Product added to cart',
            cartCount: user.cart.length
        });
    } catch (error) {
        console.error('Error adding to cart:', error);
        res.status(500).json({ success: false, message: 'Error adding to cart' });
    }
};

exports.updateCart = async (req, res) => {
    try {
        const { itemId, quantity } = req.body;
        const user = await User.findById(req.user._id);

        const cartItem = user.cart.id(itemId);
        if (!cartItem) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        cartItem.quantity = parseInt(quantity);
        await user.save();

        // Calculate new total
        const updatedUser = await User.findById(req.user._id).populate('cart.product');
        let total = 0;
        updatedUser.cart.forEach(item => {
            total += item.product.price * item.quantity;
        });

        res.json({ 
            success: true, 
            message: 'Cart updated',
            total: total.toFixed(2)
        });
    } catch (error) {
        console.error('Error updating cart:', error);
        res.status(500).json({ success: false, message: 'Error updating cart' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const { itemId } = req.body;
        const user = await User.findById(req.user._id);

        user.cart = user.cart.filter(item => item._id.toString() !== itemId);
        await user.save();

        res.json({ 
            success: true, 
            message: 'Item removed from cart',
            cartCount: user.cart.length
        });
    } catch (error) {
        console.error('Error removing from cart:', error);
        res.status(500).json({ success: false, message: 'Error removing from cart' });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        user.cart = [];
        await user.save();

        res.json({ 
            success: true, 
            message: 'Cart cleared'
        });
    } catch (error) {
        console.error('Error clearing cart:', error);
        res.status(500).json({ success: false, message: 'Error clearing cart' });
    }
}; 