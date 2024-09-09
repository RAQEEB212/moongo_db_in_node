const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/user_management';

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI); // No need for useNewUrlParser and useUnifiedTopology
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
        process.exit(1); // Exit the app if connection fails
    }
};

module.exports = connectDB;
