const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const User = require('../models/User');
const { sessions } = require('../middleware/session');

router.post('/feedback', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    const session = sessions.get(token);

    if (!session) {
        return res.status(401).json({ code: -1, message: '未登录或token无效', data: null });
    }

    const { content } = req.body;
    if (!content) {
        return res.status(400).json({ code: -1, message: '反馈内容不能为空', data: null });
    }

    try {
        const user = await User.findOne({ id: session.userId });
        if (!user) {
            return res.status(404).json({ code: -1, message: '用户不存在', data: null });
        }

        const feedback = new Feedback({
            userId: user.id,
            content
        });

        await feedback.save();

        res.status(201).json({
            code: 0,
            message: '反馈提交成功',
            data: {
                id: feedback._id,
                userId: feedback.userId,
                content: feedback.content,
                createdAt: feedback.createdAt
            }
        });
    } catch (error) {
        console.error('提交反馈失败:', error);
        res.status(500).json({ code: -1, message: '提交反馈失败', data: null });
    }
});

module.exports = router;
