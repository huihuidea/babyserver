const express = require('express');
const app = express();

// 中间件
app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// 路由
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
app.use('/', authRoutes);
app.use('/', feedbackRoutes);

// 404 处理
app.use((req, res) => {
    res.status(404).json({ code: -1, message: '接口不存在', data: null });
});

module.exports = app;
