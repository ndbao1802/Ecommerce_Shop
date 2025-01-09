const mongoose = require('mongoose');
const User = require('../models/userModel');
require('dotenv').config();

const updateAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Update the admin user
        const result = await User.updateOne(
            { email: 'admin@gmail.com' },
            { 
                $set: { 
                    isAdmin: true,
                    isActive: true
                }
            }
        );

        console.log('Update result:', result);
        console.log('Admin user updated successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error updating admin:', error);
        process.exit(1);
    }
};

updateAdmin(); 