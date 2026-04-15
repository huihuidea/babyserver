const express = require('express');
const router = express.Router();
const CommunityPost = require('../models/CommunityPost');
const User = require('../models/User');
const { sessions } = require('../middleware/session');
const { cloudinary, isCloudinaryConfigured } = require('../config/cloudinary');

function getSessionFromRequest(req) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return null;
    }

    return sessions.get(token) || null;
}

function normalizeCounter(value, fieldName) {
    if (value === undefined) {
        return 0;
    }

    const normalizedValue = Number(value);
    if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
        throw new Error(`${fieldName}必须是大于等于0的整数`);
    }

    return normalizedValue;
}

function normalizeUploadTime(value) {
    if (!value) {
        return new Date();
    }

    const uploadTime = new Date(value);
    if (Number.isNaN(uploadTime.getTime())) {
        throw new Error('uploadTime格式不正确');
    }

    return uploadTime;
}

function normalizeImagePayload(images) {
    if (images === undefined) {
        return [];
    }

    if (!Array.isArray(images)) {
        throw new Error('images必须是数组');
    }

    return images.map((image, index) => {
        if (typeof image === 'string') {
            return image;
        }

        if (image && typeof image === 'object' && typeof image.data === 'string') {
            return image.data;
        }

        throw new Error(`第${index + 1}张图片格式不正确`);
    });
}

async function uploadImagesToCloudinary(images, username) {
    if (images.length === 0) {
        return [];
    }

    if (!isCloudinaryConfigured) {
        throw new Error('Cloudinary未配置，请先设置环境变量');
    }

    const folder = `community/${username || 'anonymous'}`;
    const uploadResults = await Promise.all(
        images.map((image) => cloudinary.uploader.upload(image, {
            folder,
            resource_type: 'image'
        }))
    );

    return uploadResults.map((result) => ({
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width || 0,
        height: result.height || 0,
        format: result.format || '',
        bytes: result.bytes || 0
    }));
}

router.post('/posts', async (req, res) => {
    const session = getSessionFromRequest(req);

    if (!session) {
        return res.status(401).json({ code: -1, message: '未登录或token无效', data: null });
    }

    try {
        const user = await User.findOne({ id: session.userId });
        if (!user) {
            return res.status(404).json({ code: -1, message: '用户不存在', data: null });
        }

        const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
        const imagePayloads = normalizeImagePayload(req.body.images);

        if (!content && imagePayloads.length === 0) {
            return res.status(400).json({ code: -1, message: '文本和图片不能同时为空', data: null });
        }

        const images = await uploadImagesToCloudinary(imagePayloads, user.username);
        const post = new CommunityPost({
            userId: user.id,
            username: user.username,
            userAvatar: user.avatar,
            content,
            images,
            likeCount: normalizeCounter(req.body.likeCount, 'likeCount'),
            commentCount: normalizeCounter(req.body.commentCount, 'commentCount'),
            uploadTime: normalizeUploadTime(req.body.uploadTime)
        });

        await post.save();

        res.status(201).json({
            code: 0,
            message: '社区内容发布成功',
            data: post
        });
    } catch (error) {
        console.error('发布社区内容失败:', error);
        const statusCode = error.message && error.message.includes('格式')
            ? 400
            : 500;

        res.status(statusCode).json({
            code: -1,
            message: error.message || '发布社区内容失败',
            data: null
        });
    }
});

router.get('/posts', async (req, res) => {
    try {
        const posts = await CommunityPost.find()
            .sort({ uploadTime: -1, createdAt: -1 })
            .lean();

        res.json({
            code: 0,
            message: '获取成功',
            data: posts
        });
    } catch (error) {
        console.error('获取社区内容失败:', error);
        res.status(500).json({ code: -1, message: '获取社区内容失败', data: null });
    }
});

module.exports = router;
