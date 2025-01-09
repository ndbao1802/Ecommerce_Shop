const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');
const { cloudinary, uploadToCloudinary } = require('../../config/cloudinary');

const categoryController = {
    getCategoryById: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                return res.status(404).json({ success: false, message: 'Category not found' });
            }
            res.json({ success: true, category });
        } catch (error) {
            console.error('Error fetching category:', error);
            res.status(500).json({ success: false, message: 'Error fetching category' });
        }
    },

    getCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            res.render('admin/categories/index', {
                layout: 'layouts/adminLayout',
                categories
            });
        } catch (error) {
            req.flash('error_msg', 'Error loading categories');
            res.redirect('/admin/dashboard');
        }
    },

    createCategory: async (req, res) => {
        try {
            const { name, description, isActive } = req.body;

            const categoryData = {
                name,
                description,
                isActive: isActive === 'on'
            };

            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path, {
                    folder: 'ecommerce/categories',
                    transformation: [
                        { width: 1000, height: 1000, crop: 'limit' },
                        { quality: 'auto' },
                        { fetch_format: 'auto' }
                    ]
                });
                
                categoryData.image = {
                    url: result.secure_url,
                    public_id: result.public_id
                };
            }

            const category = new Category(categoryData);
            await category.save();

            req.flash('success_msg', 'Category created successfully');
            res.redirect('/admin/categories');
        } catch (error) {
            console.error('Error creating category:', error);
            req.flash('error_msg', 'Error creating category: ' + error.message);
            res.redirect('/admin/categories');
        }
    },

    updateCategory: async (req, res) => {
        try {
            const { name, description, isActive } = req.body;
            const updateData = { name, description, isActive: isActive === 'on' };

            if (req.file) {
                const result = await cloudinary.uploader.upload(req.file.path);
                // Store just the URL string
                updateData.image = result.secure_url;
            }

            await Category.findByIdAndUpdate(req.params.id, updateData);
            req.flash('success_msg', 'Category updated successfully');
            res.redirect('/admin/categories');
        } catch (error) {
            console.error('Error updating category:', error);
            req.flash('error_msg', 'Error updating category');
            res.redirect('/admin/categories');
        }
    },

    deleteCategory: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            
            if (category.image && category.image.public_id) {
                await cloudinary.uploader.destroy(category.image.public_id);
            }

            await Category.findByIdAndDelete(req.params.id);
            req.flash('success_msg', 'Category deleted successfully');
            res.redirect('/admin/categories');
        } catch (error) {
            console.error('Error deleting category:', error);
            req.flash('error_msg', 'Error deleting category');
            res.redirect('/admin/categories');
        }
    },

    getProductCategories: async (req, res) => {
        try {
            const categories = await Category.find();
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const count = await Product.countDocuments({ category: category._id });
                    return {
                        ...category.toObject(),
                        productCount: count
                    };
                })
            );

            res.render('admin/categories/products', {
                layout: 'layouts/adminLayout',
                categories: categoriesWithCount
            });
        } catch (error) {
            console.error('Error loading product categories:', error);
            req.flash('error_msg', 'Error loading product categories');
            res.redirect('/admin/dashboard');
        }
    },

    getEditCategory: async (req, res) => {
        try {
            const category = await Category.findById(req.params.id);
            if (!category) {
                req.flash('error_msg', 'Category not found');
                return res.redirect('/admin/categories');
            }
            res.render('admin/categories/edit', {
                layout: 'layouts/adminLayout',
                category
            });
        } catch (error) {
            console.error('Error loading category:', error);
            req.flash('error_msg', 'Error loading category');
            res.redirect('/admin/categories');
        }
    }
};

module.exports = categoryController; 