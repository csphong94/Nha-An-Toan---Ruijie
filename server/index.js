import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { authorizeFreeWiFi, upgradeToVIP, getNetworkGroups, getUserGroups, generateVoucher, submitVoucherToPortal } from './ruijieService.js';

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

// API: Kích hoạt gói Free
app.post('/api/auth/free', async (req, res) => {
    const { mac, nas_mac, ssid, sessionId } = req.body;
    if (!mac) return res.status(400).json({ error: 'Missing MAC' });
    
    try {
        let groupId = "9105026"; // Mặc định là NAT Vali 03
        try {
            const rawGroups = await getNetworkGroups();
            // Hàm đệ quy tìm GroupID hợp lệ đầu tiên (bỏ qua ROOT/0)
            const findGroupId = (node) => {
                if (node.type === 'BUILDING' || (node.groupId && node.groupId !== 0 && node.type !== 'ROOT')) return node.groupId;
                if (node.subGroups) {
                    for (const sub of node.subGroups) {
                        const id = findGroupId(sub);
                        if (id) return id;
                    }
                }
                return null;
            };
            const foundId = findGroupId(rawGroups);
            if (foundId) groupId = foundId;
        } catch (e) {
            console.error("Warning: Cannot fetch network groups, using default.", e.message);
        }
        
        // Tạo Voucher 5Mbps (Voucher sẽ thuộc User Group "Free")
        const voucherCode = await generateVoucher(groupId, "Free", 1);
        
        if (voucherCode && sessionId) {
            // Gửi Voucher lên Portal-as để thực sự cấp mạng
            const portalRes = await submitVoucherToPortal(sessionId, voucherCode);
            if (portalRes && portalRes.success) {
                res.json({ 
                    success: true, 
                    authSuccess: true, 
                    voucherCode: voucherCode,
                    logonUrl: portalRes.result.logonUrl
                });
                return;
            }
        }
        
        // Fallback nếu thiếu sessionId hoặc submit lỗi
        res.json({ success: true, authSuccess: true, voucherCode: voucherCode });
    } catch (error) {
        console.error("Lỗi cấp voucher free:", error);
        res.status(500).json({ error: error.message });
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
