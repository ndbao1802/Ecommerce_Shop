const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const adminUser = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: '123',
            role: 'admin',
            phone: '1234567890'
        });

        await adminUser.save();
        console.log('Admin user created successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error creating admin:', error);
        process.exit(1);
    }
};

createAdmin(); 