import express from 'express';
import { getDb, saveDb } from '../db.js';

const router = express.Router();

const cleanInput = (str) => {
    if (!str) return '';
    return String(str).replace(/<[^>]*>/g, '').trim().substring(0, 300);
};

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
    
    // Sanitize Portal Config
    if (newData.portal) {
        newData.portal.title = cleanInput(newData.portal.title);
        newData.portal.subtitle = cleanInput(newData.portal.subtitle);
        newData.portal.themeColor = cleanInput(newData.portal.themeColor);
    }
    
    // Sanitize Ruijie API Config
    if (newData.ruijie) {
        newData.ruijie.appId = cleanInput(newData.ruijie.appId);
        newData.ruijie.appSecret = cleanInput(newData.ruijie.appSecret);
        newData.ruijie.tokenStatic = cleanInput(newData.ruijie.tokenStatic);
        newData.ruijie.groupId = cleanInput(newData.ruijie.groupId);
    }
    
    // Sanitize Packages
    if (Array.isArray(newData.packages)) {
        newData.packages = newData.packages.map(pkg => ({
            id: cleanInput(pkg.id),
            name: cleanInput(pkg.name),
            type: cleanInput(pkg.type),
            durationDays: parseInt(pkg.durationDays) || 1,
            price: parseInt(pkg.price) || 0,
            ruijieProfileId: cleanInput(pkg.ruijieProfileId),
            ruijieUserGroupId: cleanInput(pkg.ruijieUserGroupId)
        }));
    }

    // Sanitize MoMo Config
    if (newData.momo) {
        newData.momo.partnerCode = cleanInput(newData.momo.partnerCode);
        newData.momo.accessKey = cleanInput(newData.momo.accessKey);
        newData.momo.secretKey = cleanInput(newData.momo.secretKey);
        newData.momo.endpoint = cleanInput(newData.momo.endpoint);
        newData.momo.useMock = !!newData.momo.useMock;
    }

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
