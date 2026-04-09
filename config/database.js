const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect('mongodb+srv://test:test123456@cluster0.xcbfzk0.mongodb.net/login-service?appName=Cluster0');
        console.log('MongoDB 连接成功');
    } catch (error) {
        console.error('MongoDB 连接失败:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
