const mongoose = require('mongoose');
const {
    User,
    Product,
    Category,
    SystemSetting,
    Advertisement,
    News
} = require('../models');
require('dotenv').config();

const initialSettings = [
    {
        key: 'site_name',
        value: 'Your E-Commerce Store',
        group: 'general',
        description: 'Website name'
    },
    {
        key: 'contact_email',
        value: 'contact@yourdomain.com',
        group: 'contact',
        description: 'Contact email address'
    }
];

const seedDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Clear existing data
        await Promise.all([
            User.deleteMany(),
            Product.deleteMany(),
            Category.deleteMany(),
            SystemSetting.deleteMany(),
            Advertisement.deleteMany(),
            News.deleteMany()
        ]);

        // Seed system settings
        await SystemSetting.insertMany(initialSettings);
        
        console.log('Database seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seeding failed:', error);
        process.exit(1);
    }
};

seedDatabase(); 