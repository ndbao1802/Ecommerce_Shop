const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

exports.getHome = async (req, res) => {
    try {
        // Temporary data for testing
        const categories = [
            {
                name: 'Electronics',
                image: 'https://via.placeholder.com/300x200',
                description: 'Latest electronic gadgets',
                slug: 'electronics'
            },
            {
                name: 'Fashion',
                image: 'https://via.placeholder.com/300x200',
                description: 'Trendy fashion items',
                slug: 'fashion'
            },
            {
                name: 'Home & Living',
                image: 'https://via.placeholder.com/300x200',
                description: 'Home decoration and furniture',
                slug: 'home-living'
            }
        ];

        const featuredProducts = [
            {
                name: 'Sample Product 1',
                images: ['https://via.placeholder.com/300x200'],
                price: 99.99,
                originalPrice: 129.99,
                discount: 20,
                averageRating: 4.5,
                ratings: [{}],
                stock: 10,
                slug: 'sample-product-1'
            },
            {
                name: 'Sample Product 2',
                images: ['https://via.placeholder.com/300x200'],
                price: 149.99,
                originalPrice: 199.99,
                discount: 25,
                averageRating: 4.0,
                ratings: [{}],
                stock: 5,
                slug: 'sample-product-2'
            }
        ];

        // Later, replace with actual database queries
        // const categories = await Category.find().limit(6);
        // const featuredProducts = await Product.find({ isActive: true })
        //     .sort({ averageRating: -1 })
        //     .limit(8)
        //     .populate('category');

        res.render('home', {
            categories,
            featuredProducts
        });
    } catch (error) {
        console.error('Home page error:', error);
        res.status(500).render('error', { message: 'Error loading home page' });
    }
}; 