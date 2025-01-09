const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const { cloudinary } = require('../../config/cloudinary');

const getProducts = async (req, res) => {
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

const getCreateProduct = async (req, res) => {
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

const createProduct = async (req, res) => {
    try {
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

        const product = new Product(productData);
        await product.save();

        req.flash('success_msg', 'Product created successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product:', error);
        req.flash('error_msg', 'Error creating product: ' + error.message);
        res.redirect('/admin/products/create');
    }
};

const getEditProduct = async (req, res) => {
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
        console.error('Error loading product:', error);
        req.flash('error_msg', 'Error loading product');
        res.redirect('/admin/products');
    }
};

const updateProduct = async (req, res) => {
    try {
        const { name, description, price, stock, category, brand, isActive, existingImages } = req.body;
        const product = await Product.findById(req.params.id);
        
        if (!product) {
            req.flash('error_msg', 'Product not found');
            return res.redirect('/admin/products');
        }

        let updatedImages = [];
        
        if (existingImages) {
            const existingImagesArray = Array.isArray(existingImages) ? existingImages : [existingImages];
            updatedImages = product.images.filter(image => 
                existingImagesArray.includes(image.public_id)
            );
        }

        const removedImages = req.body['removedImages[]'];
        if (removedImages) {
            const removedImagesArray = Array.isArray(removedImages) ? removedImages : [removedImages];
            const deletePromises = removedImagesArray.map(publicId => 
                cloudinary.uploader.destroy(publicId)
            );
            await Promise.all(deletePromises);
        }

        if (req.files && req.files.length > 0) {
            const uploadPromises = req.files.map(file => 
                cloudinary.uploader.upload(file.path, {
                    folder: 'ecommerce/products',
                    transformation: [
                        { width: 1000, height: 1000, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                })
            );
            
            const uploadedImages = await Promise.all(uploadPromises);
            const newImages = uploadedImages.map(result => ({
                url: result.secure_url,
                public_id: result.public_id
            }));
            
            updatedImages = [...updatedImages, ...newImages];
        }

        const updatedProduct = {
            name,
            description,
            price: parseFloat(price),
            stock: parseInt(stock),
            category,
            brand,
            isActive: isActive === 'on',
            images: updatedImages
        };

        await Product.findByIdAndUpdate(req.params.id, updatedProduct);
        
        req.flash('success_msg', 'Product updated successfully');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product:', error);
        req.flash('error_msg', 'Error updating product: ' + error.message);
        res.redirect(`/admin/products/${req.params.id}/edit`);
    }
};

const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        
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

module.exports = {
    getProducts,
    getCreateProduct,
    createProduct,
    getEditProduct,
    updateProduct,
    deleteProduct
}; 