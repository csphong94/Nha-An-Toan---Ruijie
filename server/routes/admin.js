import express from 'express';
import { getDb, saveDb } from '../db.js';

const router = express.Router();

// Middleware xác thực Admin đơn giản bằng mật khẩu truyền qua header
function authAdmin(req, res, next) {
    const authHeader = req.headers['authorization'];
    const db = getDb();
    // Chờ bearer token hoặc raw password
    const pwd = authHeader && authHeader.replace('Bearer ', '');
    if (pwd !== db.adminPassword) {
        return res.status(401).json({ error: 'Sai mật khẩu quản trị' });
    }
    next();
}

// Đăng nhập Admin
router.post('/login', (req, res) => {
    const { password } = req.body;
    const db = getDb();
    if (password === db.adminPassword) {
        // Trong hệ thống thực tế dùng JWT, ở đây trả về password làm token tĩnh
        res.json({ success: true, token: db.adminPassword });
    } else {
        res.status(401).json({ error: 'Sai mật khẩu' });
    }
});

// Lấy cấu hình public (dành cho màn hình điện thoại khách hàng)
router.get('/config/public', (req, res) => {
    const db = getDb();
    res.json({
        portal: db.portal,
        packages: db.packages
    });
});

// Lấy toàn bộ cấu hình (Dành cho trang Admin)
router.get('/config', authAdmin, (req, res) => {
    const db = getDb();
    res.json(db);
});

// Cập nhật cấu hình (Dành cho trang Admin)
router.put('/config', authAdmin, (req, res) => {
    const newData = req.body;
    // Cập nhật đè lên DB cũ
    const currentDb = getDb();
    const updatedDb = { ...currentDb, ...newData };
    
    if (saveDb(updatedDb)) {
        res.json({ success: true, data: updatedDb });
    } else {
        res.status(500).json({ error: 'Lỗi ghi cấu hình' });
    }
});

// Đổi mật khẩu Admin
router.put('/config/password', authAdmin, (req, res) => {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 3) {
        return res.status(400).json({ error: 'Mật khẩu quá ngắn' });
    }
    const currentDb = getDb();
    currentDb.adminPassword = newPassword;
    saveDb(currentDb);
    res.json({ success: true, token: newPassword });
});

export default router;
