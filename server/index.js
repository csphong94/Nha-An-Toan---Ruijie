import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authorizeFreeWiFi, upgradeToVIP } from './ruijieService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh của React (sau khi build)
app.use(express.static(path.join(__dirname, '../dist')));

// API: Khách hàng chọn gói Free
app.post('/api/auth/free', async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ error: 'Thiếu địa chỉ MAC' });

    // Gọi Ruijie API mở mạng
    const result = await authorizeFreeWiFi(mac);
    res.json(result);
});

// API: Khách hàng bấm nút Thanh toán (MoMo/ZaloPay)
app.post('/api/payment/create', (req, res) => {
    const { mac, packageType } = req.body;
    console.log(`[MoMo API Mock] Đang tạo mã QR thanh toán cho MAC ${mac}, Gói ${packageType}`);
    
    // Giả lập trả về Link thanh toán
    res.json({
        success: true,
        paymentUrl: `https://momo.vn/pay?amount=10000&mac=${mac}`,
        message: 'Tạo giao dịch thành công. Vui lòng quét mã MoMo.'
    });
});

// API: MoMo gọi Webhook trả kết quả sau khi khách quét mã xong
app.post('/api/payment/webhook', async (req, res) => {
    const { mac, status } = req.body; 
    // Thực tế: Kiểm tra chữ ký (Signature) của MoMo tại đây để bảo mật
    
    if (status === 'success') {
        console.log(`[MoMo Webhook] Xác nhận thanh toán thành công cho MAC: ${mac}`);
        
        // Tự động gọi Ruijie Cloud -> Nâng lên 100Mbps ngay lập tức
        const result = await upgradeToVIP(mac);
        return res.json({ success: true, message: 'Đã nâng cấp VIP' });
    }
    
    res.status(400).json({ error: 'Thanh toán thất bại' });
});

// Render ứng dụng React cho mọi route không phải API
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend Server đang chạy tại cổng ${PORT}`);
    console.log(`- API Cấp quyền Free: POST http://localhost:${PORT}/api/auth/free`);
    console.log(`- API Nâng cấp VIP (MoMo Webhook): POST http://localhost:${PORT}/api/payment/webhook`);
});
