const redis = require('../config/redis');

const cache = (duration) => {
    return async (req, res, next) => {
        const key = `__express__${req.originalUrl}`;
        const cachedResponse = await redis.get(key);

        if (cachedResponse) {
            return res.json(JSON.parse(cachedResponse));
        }

        res.originalJson = res.json;
        res.json = async (body) => {
            await redis.setex(key, duration, JSON.stringify(body));
            res.originalJson(body);
        };
        next();
    };
};

module.exports = cache; 