const mongoose = require('mongoose');
const Product = require('../models/productModel');
const SearchService = require('../services/searchService');
require('dotenv').config();

async function indexProducts() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const products = await Product.find().populate('category');
        console.log(`Found ${products.length} products to index`);

        for (const product of products) {
            await SearchService.indexProduct(product);
            console.log(`Indexed product: ${product.name}`);
        }

        console.log('All products indexed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error indexing products:', error);
        process.exit(1);
    }
}

indexProducts(); 