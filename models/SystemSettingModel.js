const mongoose = require('mongoose');

const systemSettingSchema = new mongoose.Schema({
    key: {
        type: String,
        required: true,
        unique: true
    },
    value: mongoose.Schema.Types.Mixed,
    group: String,
    description: String
}, { timestamps: true });

module.exports = mongoose.model('SystemSetting', systemSettingSchema); 