const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { sessions, generateToken } = require('../middleware/session');

async function getCurrentUser(req) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const session = sessions.get(token);

    if (!session) {
        return { token, session: null, user: null };
    }

    const user = await User.findOne({ id: session.userId });
    return { token, session, user };
}

function buildUserProfile(user, session) {
    return {
        id: user.id,
        username: user.username,
        gender: user.gender,
        avatar: user.avatar,
        vip: user.vip,
        token: user.token,
        address: user.address,
        email: user.email,
        loginAt: session ? session.loginAt : null,
        createdAt: user.createdAt
    };
}

router.post('/register', async (req, res) => {
    console.log('register request', req.body);
    const {
        username,
        password,
        gender = '',
        avatar = '',
        vip = {},
        address = '',
        email = ''
    } = req.body;
    if (!username || !password) {
        return res.status(400).json({ code: -1, message: '用户名和密码不能为空', data: null });
    }
    
    try {
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(409).json({ code: -1, message: '用户已存在', data: null });
        }
        
        const newUser = new User({
            username,
            password,
            gender,
            avatar,
            vip,
            address,
            email
        });
        await newUser.save();
        res.status(201).json({ code: 0, message: '注册成功', data: null });
    } catch (error) {
        console.error('注册失败:', error);
        res.status(500).json({ code: -1, message: '注册失败', data: null });
    }
});

router.post('/login', async (req, res) => {
    console.log('login request', req.body);
    const { username, password } = req.body;
    
    try {
        const user = await User.findOne({ username });
        if (!user || user.password !== password) {
            return res.status(401).json({ code: -1, message: '用户名或密码错误', data: null });
        }
        
        const token = generateToken();
        sessions.set(token, { userId: user.id, username: user.username, loginAt: new Date() });
        user.token = token;
        await user.save();

        res.json({
            code: 0,
            message: '登录成功',
            data: {
                token,
                userInfo: buildUserProfile(user, sessions.get(token))
            }
        });
    } catch (error) {
        console.error('登录失败:', error);
        res.status(500).json({ code: -1, message: '登录失败', data: null });
    }
});

router.get('/profile', async (req, res) => {
    try {
        const { session, user } = await getCurrentUser(req);
        if (!session) {
            return res.status(401).json({ code: -1, message: '未登录或token无效', data: null });
        }

        if (!user) {
            return res.status(404).json({ code: -1, message: '用户不存在', data: null });
        }

        res.json({
            code: 0,
            message: '获取成功',
            data: buildUserProfile(user, session)
        });
    } catch (error) {
        console.error('获取用户信息失败:', error);
        res.status(500).json({ code: -1, message: '获取用户信息失败', data: null });
    }
});

router.patch('/profile', async (req, res) => {
    try {
        const { session, user } = await getCurrentUser(req);
        if (!session) {
            return res.status(401).json({ code: -1, message: '未登录或token无效', data: null });
        }

        if (!user) {
            return res.status(404).json({ code: -1, message: '用户不存在', data: null });
        }

        const allowedFields = ['username', 'password', 'gender', 'avatar', 'vip', 'address', 'email'];
        const updates = {};

        allowedFields.forEach((field) => {
            if (Object.prototype.hasOwnProperty.call(req.body, field)) {
                updates[field] = req.body[field];
            }
        });

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ code: -1, message: '没有可更新的字段', data: null });
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'username')) {
            if (!updates.username) {
                return res.status(400).json({ code: -1, message: '用户名不能为空', data: null });
            }

            const existingUser = await User.findOne({ username: updates.username, id: { $ne: user.id } });
            if (existingUser) {
                return res.status(409).json({ code: -1, message: '用户名已存在', data: null });
            }
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'password') && !updates.password) {
            return res.status(400).json({ code: -1, message: '密码不能为空', data: null });
        }

        if (Object.prototype.hasOwnProperty.call(updates, 'vip') && (typeof updates.vip !== 'object' || updates.vip === null || Array.isArray(updates.vip))) {
            return res.status(400).json({ code: -1, message: 'vip必须是对象', data: null });
        }

        Object.assign(user, updates);
        await user.save();

        if (updates.username) {
            session.username = user.username;
        }

        res.json({
            code: 0,
            message: '修改成功',
            data: buildUserProfile(user, session)
        });
    } catch (error) {
        console.error('修改用户信息失败:', error);
        res.status(500).json({ code: -1, message: '修改用户信息失败', data: null });
    }
});

router.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    try {
        if (token) {
            const session = sessions.get(token);
            if (session) {
                await User.findOneAndUpdate(
                    { id: session.userId },
                    { token: '' }
                );
            }
            sessions.delete(token);
        }

        res.json({ code: 0, message: '退出成功', data: null });
    } catch (error) {
        console.error('退出失败:', error);
        res.status(500).json({ code: -1, message: '退出失败', data: null });
    }
});

module.exports = router;
