const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel');
const { cloudinary } = require('../../config/cloudinary');

exports.getCategories = async (req, res) => {
    try {
        // Check if it's an API request
        const isApiRequest = req.xhr || req.headers.accept.indexOf('json') > -1;
        
        const categories = await Category.find();
        
        if (isApiRequest) {
            return res.json({ success: true, categories });
        }

        res.render('admin/categories/index', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        console.error('Error loading categories:', error);
        if (req.xhr || req.headers.accept.indexOf('json') > -1) {
            return res.status(500).json({ success: false, message: 'Error loading categories' });
        }
        req.flash('error_msg', 'Error loading categories');
        res.redirect('/admin/dashboard');
    }
};

exports.createCategory = async (req, res) => {
    try {
        console.log('Request body:', req.body);
        console.log('Request file:', req.file);
        
        const { name, description, isActive } = req.body;
        
        let imageUrl = '';
        if (req.file) {
            try {
                // Log the file object
                console.log('Processing file:', req.file);
                imageUrl = req.file.path;
                console.log('Image URL:', imageUrl);
            } catch (fileError) {
                console.error('Error processing file:', fileError);
                throw new Error('Error processing uploaded file');
            }
        }

        // Log the data before creating category
        console.log('Creating category with data:', {
            name,
            description,
            image: imageUrl,
            isActive
        });

        const category = new Category({
            name,
            description,
            image: imageUrl,
            isActive: isActive === 'on' || isActive === true
        });

        // Log the category object before saving
        console.log('Category model before save:', category);

        await category.save();
        console.log('Category saved successfully');

        req.flash('success_msg', 'Category created successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        // Detailed error logging
        console.error('Error creating category:');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Full error:', JSON.stringify(error, null, 2));
        console.error('Stack trace:', error.stack);

        let errorMessage = 'Error creating category';
        if (error.code === 11000) {
            errorMessage = 'A category with this name already exists';
        } else if (error.errors) {
            errorMessage = Object.values(error.errors).map(err => err.message).join(', ');
        } else {
            errorMessage = error.message || 'Error creating category';
        }

        req.flash('error_msg', errorMessage);
        res.redirect('/admin/categories');
    }
};

exports.updateCategory = async (req, res) => {
    try {
        console.log('Update category request:', {
            body: req.body,
            file: req.file,
            params: req.params
        });

        const { name, description, isActive } = req.body;
        const updateData = { 
            name, 
            description, 
            isActive: isActive === 'on' || isActive === true 
        };

        // If there's a new image
        if (req.file) {
            console.log('New image file:', req.file);
            
            // Get the old category to find its image
            const oldCategory = await Category.findById(req.params.id);
            console.log('Old category:', oldCategory);

            // Delete old image from Cloudinary if it exists
            if (oldCategory && oldCategory.image) {
                try {
                    const publicId = oldCategory.image.split('/').pop().split('.')[0];
                    console.log('Deleting old image with public ID:', publicId);
                    await cloudinary.uploader.destroy(publicId);
                } catch (cloudinaryError) {
                    console.error('Error deleting old image:', cloudinaryError);
                    // Continue with the update even if image deletion fails
                }
            }
            
            // Add new image URL
            updateData.image = req.file.path;
            console.log('New image path:', updateData.image);
        }

        console.log('Updating category with data:', updateData);

        const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id, 
            updateData,
            { new: true }
        );

        if (!updatedCategory) {
            console.log('Category not found for update');
            req.flash('error_msg', 'Category not found');
            return res.redirect('/admin/categories');
        }

        console.log('Category updated successfully:', updatedCategory);
        req.flash('success_msg', 'Category updated successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error updating category:', error);
        req.flash('error_msg', 'Error updating category');
        res.redirect('/admin/categories');
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        await Category.findByIdAndDelete(req.params.id);
        req.flash('success_msg', 'Category deleted successfully');
        res.redirect('/admin/categories');
    } catch (error) {
        req.flash('error_msg', 'Error deleting category');
        res.redirect('/admin/categories');
    }
};

exports.getProductCategories = async (req, res) => {
    try {
        const categories = await Category.find().lean();
        
        // Get product count for each category
        for (let category of categories) {
            category.productsCount = await Product.countDocuments({ category: category._id });
        }

        res.render('admin/categories/products', {
            layout: 'layouts/adminLayout',
            categories
        });
    } catch (error) {
        req.flash('error_msg', 'Error loading product categories');
        res.redirect('/admin/dashboard');
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        console.log('Fetching category with ID:', req.params.id);
        const category = await Category.findById(req.params.id);
        console.log('Found category:', category);

        if (!category) {
            console.log('Category not found');
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        const response = {
            success: true,
            category: {
                id: category._id,
                name: category.name,
                description: category.description,
                image: category.image,
                isActive: category.isActive
            }
        };
        console.log('Sending response:', response);
        res.json(response);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ success: false, message: 'Error fetching category' });
    }
}; 