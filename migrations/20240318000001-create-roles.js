const mongoose = require('mongoose');
const Role = require('../models/roleModel');

module.exports = {
    up: async () => {
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

        await Role.insertMany(roles);
    },
    down: async () => {
        await Role.deleteMany({});
    }
}; 