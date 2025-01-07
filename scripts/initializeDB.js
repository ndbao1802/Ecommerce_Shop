const mongoose = require('mongoose');
const Role = require('../models/roleModel');
const User = require('../models/userModel');
require('dotenv').config();

const initializeDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        // Create roles
        const roles = [
            {
                name: 'admin',
                description: 'System administrator with full access',
                permissions: ['all']
            },
            {
                name: 'employee',
                description: 'Staff member with limited access',
                permissions: ['manage_orders', 'manage_products', 'view_reports']
            },
            {
                name: 'customer',
                description: 'Regular customer',
                permissions: ['place_orders', 'view_products', 'manage_profile']
            }
        ];

        // Clear existing roles and create new ones
        await Role.deleteMany({});
        const createdRoles = await Role.insertMany(roles);
        console.log('Roles created successfully');

        // Find admin role
        const adminRole = createdRoles.find(role => role.name === 'admin');

        // Create admin user
        await User.deleteOne({ email: 'admin@gmail.com' }); // Remove existing admin if any
        const adminUser = new User({
            name: 'Admin',
            email: 'admin@gmail.com',
            password: '123',
            phone: '1234567890',
            roles: [adminRole._id]
        });

        await adminUser.save();
        console.log('Admin user created successfully');

        console.log('Database initialized successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error initializing database:', error);
        process.exit(1);
    }
};

initializeDB(); 