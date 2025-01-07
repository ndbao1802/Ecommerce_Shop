const Product = require('../models/productModel');

exports.getAllProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('products/index', { products });
    } catch (error) {
        req.flash('error_msg', 'Error loading products');
        res.redirect('/');
    }
};

exports.getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/products');
        }
        res.render('products/show', { product });
    } catch (error) {
        req.flash('error_msg', 'Error loading product');
        res.redirect('/products');
    }
};

exports.createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();
        req.flash('success_msg', 'Product created successfully');
        res.redirect('/products');
    } catch (error) {
        req.flash('error_msg', 'Error creating product');
        res.redirect('/products');
    }
};

exports.updateProduct = async (req, res) => {
    try {
        await Product.findByIdAndUpdate(req.params.id, req.body);
        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/products');
    } catch (error) {
        req.flash('error_msg', 'Error updating product');
        res.redirect('/products');
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/products');
    } catch (error) {
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/products');
    }
}; 