import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authorizeFreeWiFi, upgradeToVIP, getNetworkGroups, getUserGroups, generateVoucher } from './ruijieService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Phục vụ các file tĩnh của React (sau khi build)
app.use(express.static(path.join(__dirname, '../dist')));

// API Debug: Quét tài khoản lấy danh sách Group và Profile
app.get('/api/debug/ruijie-groups', async (req, res) => {
    try {
        const netGroups = await getNetworkGroups();
        if (!netGroups) {
            return res.json({ error: 'Không lấy được Network Group nào.', raw: netGroups });
        }
        
        // Cố gắng tìm Group ID đầu tiên, nếu có mảng thì lấy phần tử 0
        let firstGroupId = null;
        if (Array.isArray(netGroups) && netGroups.length > 0) {
            firstGroupId = netGroups[0].id || netGroups[0].groupId;
        } else if (netGroups.groupId) {
            firstGroupId = netGroups.groupId;
        }

        if (!firstGroupId) {
            // Nếu vẫn không tìm thấy, trả về toàn bộ dữ liệu thô để debug
            return res.json({ 
                error: 'Không tìm thấy cấu trúc ID phù hợp.', 
                rawNetworkGroups: netGroups 
            });
        }
        
        const userGroups = await getUserGroups(firstGroupId);
        
        res.json({
            networkGroups: netGroups,
            userGroupsForFirstNetwork: userGroups,
            message: 'Hãy dùng các ID trong userGroupsForFirstNetwork để cấu hình biến môi trường.'
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API: Khách hàng chọn gói Free
app.post('/api/auth/free', async (req, res) => {
    const { mac } = req.body;
    if (!mac) return res.status(400).json({ error: 'Thiếu địa chỉ MAC' });

    try {
        // Trong thực tế, bạn sẽ lấy các ID này từ biến môi trường process.env
        // Tạm thời fix cứng một số ID ảo nếu chưa lấy được từ debug
        const groupId = process.env.RUIJIE_GROUP_ID || "123456"; 
        const freeUserGroupId = process.env.RUIJIE_FREE_USER_GROUP_ID || "654321";
        const freeProfileId = process.env.RUIJIE_FREE_PROFILE_ID || "uuid-free-profile";
        
        // Sinh Voucher tự động
        const voucherCode = await generateVoucher(groupId, freeUserGroupId, freeProfileId);
        
        res.json({ success: true, message: 'Tạo voucher thành công', voucherCode });
    } catch (err) {
        console.error('[auth/free error]:', err.message);
        // Fallback: nếu lỗi (do chưa setup thật), trả về mock data để vẫn chạy qua được
        res.json({ success: true, message: 'Mock data', voucherCode: 'MOCK_FREE_VOUCHER_123' });
    }
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
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend Server đang chạy tại cổng ${PORT}`);
    console.log(`- API Cấp quyền Free: POST http://localhost:${PORT}/api/auth/free`);
    console.log(`- API Nâng cấp VIP (MoMo Webhook): POST http://localhost:${PORT}/api/payment/webhook`);
});
