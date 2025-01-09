const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const { cloudinary } = require('../../config/cloudinary');

exports.getProducts = async (req, res) => {
    try {
        const products = await Product.find().populate('category');
        res.render('admin/products/index', {
            layout: 'layouts/adminLayout',
            products
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading products');
        res.redirect('/admin/dashboard');
    }
};

exports.getCreateProduct = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true });
        res.render('admin/products/create', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading categories');
        res.redirect('/admin/products');
    }
};

exports.createProduct = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request files:', req.files);

        // Create product data object explicitly
        const productData = {
            name: req.body.name,
            description: req.body.description || '',
            price: parseFloat(req.body.price) || 0,
            category: req.body.category,
            stock: parseInt(req.body.stock) || 0,
            brand: req.body.brand || '',
            isActive: req.body.isActive === 'on',
            images: []
        };

        // Handle image uploads
        if (req.files && req.files.length > 0) {
            const imagePromises = req.files.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: 'ecommerce/products'
                })
            );

            const imageResults = await Promise.all(imagePromises);
            productData.images = imageResults.map(result => ({
                url: result.secure_url,
                public_id: result.public_id
            }));
        }

        console.log('Creating product with data:', productData);

        // Create and save the product
        const product = new Product(productData);
        const savedProduct = await product.save();

        console.log('Product saved successfully:', savedProduct);

        req.flash('success_msg', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Full error:', error);
        req.flash('error_msg', 'Error creating product: ' + error.message);
        res.redirect('/admin/products/create');
    }
};

exports.getEditProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id).populate('category');
        const categories = await Category.find({ isActive: true });
        
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        res.render('admin/products/edit', {
            layout: 'layouts/adminLayout',
            product,
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading product');
        res.redirect('/admin/products');
    }
};

exports.updateProduct = async (req, res) => {
    try {
        const {
            name,
            description,
            price,
            originalPrice,
            category,
            details,
            existingImages
        } = req.body;

        // Handle image uploads
        let images = existingImages ? (Array.isArray(existingImages) ? existingImages : [existingImages]) : [];
        if (req.files) {
            const newImages = req.files.map(file => file.path);
            images = [...images, ...newImages];
        }

        // Update variants
        const variants = [];
        if (req.body.colors && req.body.sizes && req.body.stocks) {
            const colors = Array.isArray(req.body.colors) ? req.body.colors : [req.body.colors];
            const sizes = Array.isArray(req.body.sizes) ? req.body.sizes : [req.body.sizes];
            const stocks = Array.isArray(req.body.stocks) ? req.body.stocks : [req.body.stocks];

            colors.forEach((color, index) => {
                variants.push({
                    color,
                    size: sizes[index],
                    stock: stocks[index],
                    sku: `${name.substring(0, 3).toUpperCase()}-${color.substring(0, 2)}-${sizes[index]}`
                });
            });
        }

        await Product.findByIdAndUpdate(req.params.id, {
            name,
            description,
            price,
            originalPrice,
            category,
            images,
            variants,
            details: JSON.parse(details)
        });

        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error_msg', 'Error updating product');
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
};

exports.deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
        // Delete images from Cloudinary
        if (product.images && product.images.length > 0) {
            const deletePromises = product.images.map(image => 
                cloudinary.uploader.destroy(image.public_id)
            );
            await Promise.all(deletePromises);
        }

        await Product.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Product deleted successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error deleting product:', error);
        req.flash('error_msg', 'Error deleting product');
        res.redirect('/admin/products');
    }
}; 