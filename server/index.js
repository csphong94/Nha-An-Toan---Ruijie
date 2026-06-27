import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import axios from 'axios';
import { authorizeFreeWiFi, upgradeToVIP, getNetworkGroups, getUserGroups, generateVoucher, submitVoucherToPortal } from './ruijieService.js';
import adminRouter from './routes/admin.js';
import { getDb, saveDb } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Start DB Patch ---
try {
    const db = getDb();
    let dbChanged = false;
    
    if (db.adminPassword === "admin") {
        db.adminPassword = "Abcd@2993";
        dbChanged = true;
        console.log("Đã cập nhật mật khẩu mặc định thành Abcd@2993");
    }

    // Tự động điền Profile ID nếu đang bị trống
    const defaultIds = {
        'pkg_free': { ruijieProfileId: "67940168875442127021979345797676", ruijieUserGroupId: "604465" },
        'pkg_vip1': { ruijieProfileId: "34617871223073818252355027497339", ruijieUserGroupId: "604466" },
        'pkg_vip3': { ruijieProfileId: "99881056921180660397157978345666", ruijieUserGroupId: "606182" },
        'pkg_vip7': { ruijieProfileId: "41284419864201130841043286332278", ruijieUserGroupId: "606183" },
        'pkg_vip30':{ ruijieProfileId: "76683500280644817580097882164296", ruijieUserGroupId: "606184" }
    };
    
    if (db.packages) {
        db.packages.forEach(pkg => {
            if (!pkg.ruijieProfileId || pkg.ruijieProfileId.trim() === "") {
                if (defaultIds[pkg.id]) {
                    pkg.ruijieProfileId = defaultIds[pkg.id].ruijieProfileId;
                    pkg.ruijieUserGroupId = defaultIds[pkg.id].ruijieUserGroupId;
                    dbChanged = true;
                    console.log(`Đã auto-fill Profile ID cho gói ${pkg.id}`);
                }
            }
        });
    }

    if (!db.vouchers) {
        db.vouchers = [];
        dbChanged = true;
    }

    if (dbChanged) {
        saveDb(db);
    }
} catch (e) {
    console.error("Lỗi khi cập nhật mật khẩu hoặc Profile ID:", e);
}
// --- End DB Patch ---

// API Admin
app.use('/api/admin', adminRouter);

// Phục vụ các file tĩnh của React (sau khi build)
app.use(express.static(path.join(__dirname, '../dist')));

// Fallback route cho React Router
app.get(/^(?!\/api).+/, (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

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
        const db = getDb();
        const groupId = db.ruijie.groupId || "9105026"; 
        
        // Tìm gói Free trong DB
        const freePkg = db.packages.find(p => p.type === 'free');
        if (!freePkg) {
            return res.status(500).json({ error: 'Chưa cấu hình gói Free trong Admin' });
        }
        if (!freePkg.ruijieProfileId || !freePkg.ruijieUserGroupId) {
            return res.status(500).json({ error: 'Gói Free chưa được cài đặt Profile ID trên trang Quản trị' });
        }

        // Tạo Voucher
        const voucherCode = await generateVoucher(groupId, freePkg.ruijieUserGroupId, freePkg.ruijieProfileId);
        
        // Trả về Voucher Code để Frontend redirect quay lại customHtml
        res.json({ success: true, authSuccess: true, voucherCode: voucherCode });
    } catch (error) {
        console.error("Lỗi cấp voucher free:", error);
        res.status(500).json({ error: error.message });
    }
});

// API: Kích hoạt thủ công bằng mật khẩu Admin (Tiền mặt)
app.post('/api/auth/admin-bypass', async (req, res) => {
    const { password, packageId, mac, sessionId, customerName, customerPhone } = req.body;
    
    try {
        const db = getDb();
        if (password !== db.adminPassword) {
            return res.status(401).json({ error: 'Sai mật khẩu quản trị' });
        }

        const groupId = db.ruijie.groupId || "9105026"; 
        const pkg = db.packages.find(p => p.id === packageId);
        if (!pkg) {
            return res.status(400).json({ error: 'Không tìm thấy gói cước' });
        }
        
        if (!pkg.ruijieProfileId || !pkg.ruijieUserGroupId) {
            return res.status(400).json({ error: 'Gói cước này chưa được cài đặt Profile ID trên trang Quản trị' });
        }

        // Sinh Voucher
        const voucherCode = await generateVoucher(groupId, pkg.ruijieUserGroupId, pkg.ruijieProfileId);
        
        // Lưu lịch sử
        db.vouchers.push({
            id: Date.now().toString(),
            voucherCode: voucherCode,
            customerName: customerName || "Không nhập",
            customerPhone: customerPhone || "Không nhập",
            packageId: packageId,
            packageName: pkg.name,
            createdAt: new Date().toISOString(),
            mac: mac || "N/A",
            method: "admin"
        });
        saveDb(db);
        
        res.json({ success: true, authSuccess: true, voucherCode: voucherCode });
    } catch (error) {
        console.error("Lỗi cấp voucher admin-bypass:", error);
        res.status(500).json({ error: error.message });
    }
});


// Cấu hình MoMo Sandbox
const MOMO_CONFIG = {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'M8brj9K6E22vXoDB',
    secretKey: process.env.MOMO_SECRET_KEY || 'nqQiVSgDMy809JoPF6OzP5OdBUB550Y4',
    endpoint: 'https://test-payment.momo.vn/v2/gateway/api/create',
    returnUrl: process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/payment/momo/return` : 'http://localhost:3000/api/payment/momo/return',
    ipnUrl: process.env.RENDER_EXTERNAL_URL ? `${process.env.RENDER_EXTERNAL_URL}/api/payment/momo/ipn` : 'http://localhost:3000/api/payment/momo/ipn'
};

const VIP_USER_GROUP_ID = "604466";
const VIP_PROFILE_ID = "34617871223073818252355027497339";

// Bộ nhớ đệm lưu orderId để sinh Voucher 1 lần
const orderStorage = new Map();

// API: Tạo thanh toán MoMo
app.post('/api/payment/momo', async (req, res) => {
    const { mac, sessionId, return_url, nas_mac, ssid, packageId, customerName, customerPhone } = req.body;
    
    const db = getDb();
    const pkg = db.packages.find(p => p.id === packageId);
    if (!pkg) {
        return res.status(400).json({ error: 'Gói cước không hợp lệ' });
    }

    const amount = String(pkg.price);
    const orderInfo = `Mua gói ${pkg.name}`;
    const orderId = MOMO_CONFIG.partnerCode + new Date().getTime();
    const requestId = orderId;
    const requestType = 'captureWallet';
    
    // Gói dữ liệu hệ thống vào extraData (Base64)
    const extraDataObj = { mac, sessionId, return_url, nas_mac, ssid, packageId, customerName, customerPhone };
    const extraData = Buffer.from(JSON.stringify(extraDataObj)).toString('base64');
    
    // Lưu tạm vào RAM
    orderStorage.set(orderId, { status: 'pending', extraDataObj });

    // Cờ kích hoạt chế độ giả lập (Mock) nếu chưa có API Key thật
    const USE_MOCK = process.env.USE_MOMO_MOCK !== 'false'; 

    if (USE_MOCK) {
        // Giả lập trả về trang thanh toán ảo
        return res.json({
            success: true,
            payUrl: `/mock/momo/pay?orderId=${orderId}&amount=${amount}`
        });
    }

    // Luồng gọi MoMo thật
    const rawSignature = `accessKey=${MOMO_CONFIG.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${MOMO_CONFIG.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${MOMO_CONFIG.partnerCode}&redirectUrl=${MOMO_CONFIG.returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    const signature = crypto.createHmac('sha256', MOMO_CONFIG.secretKey).update(rawSignature).digest('hex');

    const requestBody = {
        partnerCode: MOMO_CONFIG.partnerCode,
        partnerName: "Vali WiFi",
        storeId: "ValiWiFi",
        requestId, amount, orderId, orderInfo,
        redirectUrl: MOMO_CONFIG.returnUrl,
        ipnUrl: MOMO_CONFIG.ipnUrl,
        lang: "vi", requestType, autoCapture: true, extraData, signature
    };

    try {
        const response = await axios.post(MOMO_CONFIG.endpoint, requestBody);
        if (response.data && response.data.payUrl) {
            res.json({ success: true, payUrl: response.data.payUrl });
        } else {
            res.status(400).json({ error: 'Lỗi tạo thanh toán MoMo', details: response.data });
        }
    } catch (e) {
        res.status(500).json({ error: 'Lỗi kết nối MoMo' });
    }
});

// Trang giả lập thanh toán MoMo (Dùng khi chưa có API thật)
app.get('/mock/momo/pay', (req, res) => {
    const { orderId, amount } = req.query;
    res.send(`
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>MoMo Mock</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background: #a50064; color: white;">
            <h2>MÔI TRƯỜNG THỬ NGHIỆM MOMO</h2>
            <p>Đơn hàng: ${orderId}</p>
            <p>Số tiền: ${amount} VNĐ</p>
            <div style="margin-top: 30px;">
                <button onclick="window.location.href='/api/payment/momo/return?orderId=${orderId}&resultCode=0'" style="padding: 15px 30px; font-size: 18px; background: #fff; color: #a50064; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ✅ Giả lập Thanh toán Thành công
                </button>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="window.location.href='/api/payment/momo/return?orderId=${orderId}&resultCode=1006'" style="padding: 10px 20px; font-size: 16px; background: #666; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                    ❌ Hủy thanh toán
                </button>
            </div>
        </body>
        </html>
    `);
});

// API: Đón người dùng quay lại từ MoMo
app.get('/api/payment/momo/return', async (req, res) => {
    const { orderId, resultCode } = req.query;
    
    const orderData = orderStorage.get(orderId);
    if (!orderData) return res.send("Lỗi: Không tìm thấy phiên thanh toán");

    const { sessionId, return_url, packageId } = orderData.extraDataObj;

    if (resultCode !== '0') {
        // Hủy hoặc lỗi, redirect về trang chủ kèm lỗi
        return res.redirect(`/?error=payment_failed`);
    }

    try {
        const db = getDb();
        const groupId = db.ruijie.groupId || "9105026"; 
        const pkg = db.packages.find(p => p.id === packageId);
        
        if (!pkg) {
            return res.send("Lỗi: Không tìm thấy gói cước đã mua trong hệ thống.");
        }
        
        if (!pkg.ruijieProfileId || !pkg.ruijieUserGroupId) {
            return res.send("Lỗi hệ thống: Gói cước này chưa được cài đặt Profile ID trên trang Quản trị.");
        }

        // Sinh Voucher VIP nếu chưa sinh
        let voucherCode = orderData.voucherCode;
        if (!voucherCode) {
            voucherCode = await generateVoucher(groupId, pkg.ruijieUserGroupId, pkg.ruijieProfileId);
            orderStorage.set(orderId, { ...orderData, status: 'success', voucherCode });
            
            // Lưu lịch sử
            db.vouchers.push({
                id: orderId,
                voucherCode: voucherCode,
                customerName: orderData.extraDataObj.customerName || "Không nhập",
                customerPhone: orderData.extraDataObj.customerPhone || "Không nhập",
                packageId: packageId,
                packageName: pkg.name,
                createdAt: new Date().toISOString(),
                mac: orderData.extraDataObj.mac || "N/A",
                method: "momo"
            });
            saveDb(db);
        }

        // Chuyển hướng về Frontend của chúng ta (App.jsx) để hiển thị mã Voucher
        // Frontend sẽ nhận các tham số này và hiện nút "Kết nối" để chuyển tiếp đến Ruijie
        res.redirect(`/?success=true&voucher=${voucherCode}&return_url=${encodeURIComponent(return_url)}&sessionId=${sessionId}`);
    } catch (e) {
        res.send("Lỗi khi tạo Voucher VIP: " + e.message);
    }
});

// API: MoMo Webhook (IPN)
app.post('/api/payment/momo/ipn', async (req, res) => {
    // Xác minh chữ ký, lấy orderId, sinh voucher lưu vào memory (để returnUrl lấy)
    res.status(200).json({ message: "OK" });
});

// Render ứng dụng React cho mọi route không phải API
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend Server đang chạy tại cổng ${PORT}`);
    console.log(`- API Cấp quyền Free: POST http://localhost:${PORT}/api/auth/free`);
    console.log(`- API Khởi tạo MoMo: POST http://localhost:${PORT}/api/payment/momo`);
});
