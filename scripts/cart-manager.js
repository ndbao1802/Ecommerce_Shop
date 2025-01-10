const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const User = require('../models/userModel');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch(err => console.error('MongoDB connection error:', err));

const cartManager = {
    // Reset all carts
    async resetCarts() {
        try {
            await Cart.deleteMany({});
            console.log('All carts have been deleted');
        } catch (error) {
            console.error('Error resetting carts:', error);
        }
    },

    // Initialize carts for all users
    async initializeCarts() {
        try {
            const users = await User.find({});
            console.log(`Found ${users.length} users`);

            for (const user of users) {
                const existingCart = await Cart.findOne({ user: user._id });
                if (!existingCart) {
                    const cart = new Cart({
                        user: user._id,
                        items: []
                    });
                    await cart.save();
                    console.log(`Created cart for user: ${user.email}`);
                } else {
                    console.log(`Cart already exists for user: ${user.email}`);
                }
            }
            console.log('Cart initialization complete');
        } catch (error) {
            console.error('Error initializing carts:', error);
        }
    },

    // Clean up orphaned carts (carts without valid users)
    async cleanupCarts() {
        try {
            const carts = await Cart.find({});
            console.log(`Found ${carts.length} carts`);

            for (const cart of carts) {
                const userExists = await User.exists({ _id: cart.user });
                if (!userExists) {
                    await Cart.deleteOne({ _id: cart._id });
                    console.log(`Deleted orphaned cart: ${cart._id}`);
                }
            }
            console.log('Cart cleanup complete');
        } catch (error) {
            console.error('Error cleaning up carts:', error);
        }
    },

    // Show all carts
    async showCarts() {
        try {
            const carts = await Cart.find({}).populate('user', 'email');
            console.log('\nCurrent Carts:');
            carts.forEach(cart => {
                console.log(`\nUser: ${cart.user.email}`);
                console.log(`Items: ${cart.items.length}`);
                console.log('Items:', cart.items);
            });
        } catch (error) {
            console.error('Error showing carts:', error);
        }
    }
};

// Command line interface
const command = process.argv[2];

async function runCommand() {
    try {
        switch (command) {
            case 'reset':
                await cartManager.resetCarts();
                break;
            case 'init':
                await cartManager.initializeCarts();
                break;
            case 'cleanup':
                await cartManager.cleanupCarts();
                break;
            case 'show':
                await cartManager.showCarts();
                break;
            default:
                console.log(`
Available commands:
- reset   : Delete all carts
- init    : Create carts for all users
- cleanup : Remove orphaned carts
- show    : Display all carts
                `);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

// Run the script
runCommand(); 