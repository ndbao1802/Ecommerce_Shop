const elasticClient = require('../config/elasticsearch');

class SearchService {
    async indexProduct(product) {
        await elasticClient.index({
            index: 'products',
            id: product._id.toString(),
            body: {
                name: product.name,
                description: product.description,
                price: product.price,
                category: product.category.name,
            }
        });
    }

    async search(query) {
        const result = await elasticClient.search({
            index: 'products',
            body: {
                query: {
                    multi_match: {
                        query,
                        fields: ['name', 'description', 'category']
                    }
                }
            }
        });
        return result.hits.hits;
    }
}

module.exports = new SearchService(); 