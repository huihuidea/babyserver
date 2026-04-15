const express = require('express');
const app = express();

// 中间件
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

// 路由
const authRoutes = require('./routes/auth');
const feedbackRoutes = require('./routes/feedback');
const communityRoutes = require('./routes/community');
app.use('/', authRoutes);
app.use('/', feedbackRoutes);
app.use('/', communityRoutes);
app.use('/community', communityRoutes);
app.use('/commity', communityRoutes);

// 404 处理
app.use((req, res) => {
    res.status(404).json({ code: -1, message: '接口不存在', data: null });
});

module.exports = app;
