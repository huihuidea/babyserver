require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/database');

const PORT = process.env.PORT || 3000;

// 连接数据库
connectDB();

// 启动服务器
app.listen(PORT, () => {
    console.log(`登录服务运行在 http://localhost:${PORT}`);
});
