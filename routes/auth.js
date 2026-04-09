const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sessions, generateToken } = require('../middleware/session');

router.post('/register', async (req, res) => {
    console.log('register request', req.body);
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: '用户名和密码不能为空' });
    }
    
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ error: '用户已存在' });
        }
        
        const newUser = new User({ username, password });
        await newUser.save();
        res.status(201).json({ code: 0, message: '注册成功' });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ error: '注册失败' });
    }
});

router.post('/login', async (req, res) => {
    console.log('login request', req.body);
    const { username, password } = req.body;
    
    try {
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

router.get('/profile', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const session = sessions.get(token);
    if (!session) {
        return res.status(401).json({ error: '未登录或token无效' });
    }
    res.json({ username: session.username, loginAt: session.loginAt });
});

router.post('/logout', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token) sessions.delete(token);
    res.json({ message: '退出成功' });
});

module.exports = router;
