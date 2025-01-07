const mongoose = require('mongoose');
const Category = require('../models/categoryModel');
const Product = require('../models/productModel');
const User = require('../models/userModel');
require('dotenv').config();

const categories = [
    {
        name: 'Electronics',
        description: 'Latest electronic gadgets',
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/electronics.jpg'
    },
    {
        name: 'Fashion',
        description: 'Trendy fashion items',
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/fashion.jpg'
    },
    {
        name: 'Home & Living',
        description: 'Home decoration and furniture',
        image: 'https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/home.jpg'
    }
];

const products = [
    {
        name: 'Smartphone X',
        description: 'Latest smartphone with amazing features',
        price: 999.99,
        originalPrice: 1199.99,
        discount: 15,
        images: ['https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/phone.jpg'],
        stock: 50
    },
    // Add more products...
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Category.deleteMany();
        await Product.deleteMany();
        console.log('Cleared existing data');

        // Seed categories
        const createdCategories = await Category.insertMany(categories);
        console.log('Categories seeded');

        // Add category references to products
        const productsWithCategories = products.map(product => ({
            ...product,
            category: createdCategories[0]._id // Assign to first category for now
        }));

        // Seed products
        await Product.insertMany(productsWithCategories);
        console.log('Products seeded');

        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase(); 