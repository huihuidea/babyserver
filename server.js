const express = require('express');
const mongoose = require('mongoose');
const app = express();

const sessions = new Map();

// 连接 MongoDB
mongoose.connect('mongodb+srv://test:test123456@cluster0.xcbfzk0.mongodb.net/login-service?appName=Cluster0')
    .then(() => {
        console.log('MongoDB 连接成功');
    }).catch(err => {
        console.error('MongoDB 连接失败:', err);
    });

// 定义用户模型
const User = mongoose.model('User', {
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

function generateToken() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

app.use(express.json());
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});

app.post('/register', async (req, res) => {
    console.log('register request', req.body);
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    try {
        // 检查用户是否已存在
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: '用户已存在' });
        }
        
        // 创建新用户
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ code: 0, message: '注册成功' });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败' });
    }
});

app.post('/login', async (req, res) => {
    console.log('login request', req.body);
    const { username, password } = req.body;
    
    try {
        // 查找用户
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ error: '用户名或密码错误' });
        }
        
        const token = generateToken();
        sessions.set(token, { username, loginAt: new Date() });
        res.json({ message: '登录成功', token });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ error: '登录失败' });
    }
});

app.get('/profile', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const session = sessions.get(token);
    if (!session) {
        return res.status(401).json({ error: '未登录或token无效' });
    }
    res.json({ username: session.username, loginAt: session.loginAt });
});

app.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) sessions.delete(token);
    res.json({ message: '退出成功' });
});

app.use((req, res) => {
    res.status(404).json({ error: '接口不存在' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`登录服务运行在 http://localhost:${PORT}`);
});
