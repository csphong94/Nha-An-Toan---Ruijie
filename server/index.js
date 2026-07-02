import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import axios from 'axios';
import { authorizeFreeWiFi, upgradeToVIP, getNetworkGroups, getUserGroups, generateVoucher, submitVoucherToPortal } from './ruijieService.js';
import adminRouter from './routes/admin.js';
import { getDb, saveDb } from './db.js';
import { PayOS } from '@payos/node';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cleanInput = (str) => {
    if (!str) return '';
    return String(str).replace(/<[^>]*>/g, '').trim().substring(0, 100);
};

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

    if (!db.payos) {
        db.payos = {
            clientId: "75c589e8-d919-44ad-8e29-816621bd65f0",
            apiKey: "7aa63cb4-7333-4b46-b308-346b1a034e12",
            checksumKey: "4f35df819a0a77965694f0f4e618703e1ac74388f53883d9b4f06e60847df3d3",
            useMock: false
        };
        dbChanged = true;
    }

    if (!db.pendingPayments) {
        db.pendingPayments = {};
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
        
        const cleanName = cleanInput(customerName) || "Không nhập";
        const cleanPhone = cleanInput(customerPhone) || "Không nhập";

        // Lưu lịch sử
        db.vouchers.push({
            id: Date.now().toString(),
            voucherCode: voucherCode,
            customerName: cleanName,
            customerPhone: cleanPhone,
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

// API: Tạo thanh toán PayOS
app.post('/api/payment/payos', async (req, res) => {
    const { mac, sessionId, return_url, nas_mac, ssid, packageId, customerName, customerPhone } = req.body;
    
    const db = getDb();
    const pkg = db.packages.find(p => p.id === packageId);
    if (!pkg) {
        return res.status(400).json({ error: 'Gói cước không hợp lệ' });
    }
    
    if (!pkg.ruijieProfileId || !pkg.ruijieUserGroupId) {
        return res.status(400).json({ error: 'Gói cước này chưa được cài đặt Profile ID trên trang Quản trị' });
    }

    const payosSettings = db.payos || {};
    const useMock = payosSettings.useMock !== undefined ? payosSettings.useMock : false;

    // Tự động phân giải đường dẫn tuyệt đối cho PayOS Callbacks
    const host = req.get('host');
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `${protocol}://${host}`;
    
    const orderCode = Math.floor(Date.now() / 1000); // Mã đơn hàng số nguyên 10 số
    
    const cleanName = cleanInput(customerName) || "Không nhập";
    const cleanPhone = cleanInput(customerPhone) || "Không nhập";
    
    // Lưu thông tin phiên thanh toán tạm vào database
    db.pendingPayments[orderCode] = {
        status: 'pending',
        mac: mac || 'N/A',
        sessionId: sessionId || '',
        returnUrl: return_url || '',
        nas_mac: nas_mac || '',
        ssid: ssid || '',
        packageId: packageId,
        packageName: pkg.name,
        customerName: cleanName,
        customerPhone: cleanPhone,
        createdAt: new Date().toISOString()
    };
    saveDb(db);

    if (useMock) {
        // Giả lập trả về trang thanh toán ảo
        return res.json({
            success: true,
            payUrl: `${baseUrl}/mock/payos/pay?orderCode=${orderCode}&amount=${pkg.price}`
        });
    }

    try {
        const payOS = new PayOS({
            clientId: payosSettings.clientId,
            apiKey: payosSettings.apiKey,
            checksumKey: payosSettings.checksumKey
        });

        const paymentData = {
            orderCode: orderCode,
            amount: pkg.price,
            description: `Nap WiFi ${pkg.name}`.substring(0, 25),
            cancelUrl: `${baseUrl}/?error=payment_cancelled`,
            returnUrl: `${baseUrl}/api/payment/payos/return?orderCode=${orderCode}`
        };

        const paymentLink = await payOS.paymentRequests.create(paymentData);
        res.json({ success: true, payUrl: paymentLink.checkoutUrl });
    } catch (error) {
        console.error("Lỗi khởi tạo PayOS:", error);
        res.status(500).json({ error: 'Lỗi kết nối PayOS: ' + error.message });
    }
});

// Trang giả lập thanh toán PayOS (VietQR)
app.get('/mock/payos/pay', (req, res) => {
    const { orderCode, amount } = req.query;
    res.send(`
        <html>
        <head><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>PayOS Mock</title></head>
        <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background: #0f172a; color: white;">
            <h2 style="color: #f97316;">MÔI TRƯỜNG GIẢ LẬP THANH TOÁN PAYOS (VIETQR)</h2>
            <p>Mã đơn hàng: ${orderCode}</p>
            <p>Số tiền: ${parseInt(amount).toLocaleString('vi-VN')} VNĐ</p>
            <div style="margin-top: 30px;">
                <button onclick="window.location.href='/api/payment/payos/return?orderCode=${orderCode}'" style="padding: 15px 30px; font-size: 18px; background: #22c55e; color: #fff; border: none; border-radius: 8px; cursor: pointer; font-weight: bold;">
                    ✅ Giả lập Chuyển khoản Thành công
                </button>
            </div>
            <div style="margin-top: 20px;">
                <button onclick="window.location.href='/?error=payment_cancelled'" style="padding: 10px 20px; font-size: 16px; background: #ef4444; color: #fff; border: none; border-radius: 8px; cursor: pointer;">
                    ❌ Hủy thanh toán
                </button>
            </div>
        </body>
        </html>
    `);
});

// API: Nhận thông tin thanh toán hoàn tất (Webhook của PayOS)
app.post('/api/payment/payos/webhook', async (req, res) => {
    const db = getDb();
    const payosSettings = db.payos || {};

    try {
        const payOS = new PayOS({
            clientId: payosSettings.clientId,
            apiKey: payosSettings.apiKey,
            checksumKey: payosSettings.checksumKey
        });

        // Xác minh chữ ký webhook
        const verifiedData = payOS.webhooks.verify(req.body);
        const orderCode = verifiedData.orderCode;

        // Xử lý đơn hàng thành công
        const pending = db.pendingPayments[orderCode];
        if (pending && pending.status === 'pending') {
            const groupId = db.ruijie.groupId || "9105026";
            const pkg = db.packages.find(p => p.id === pending.packageId);
            
            if (pkg) {
                const voucherCode = await generateVoucher(groupId, pkg.ruijieUserGroupId, pkg.ruijieProfileId);
                
                pending.status = 'success';
                pending.voucherCode = voucherCode;
                
                db.vouchers.push({
                    id: orderCode.toString(),
                    voucherCode,
                    customerName: pending.customerName,
                    customerPhone: pending.customerPhone,
                    packageId: pending.packageId,
                    packageName: pending.packageName,
                    createdAt: new Date().toISOString(),
                    mac: pending.mac,
                    method: "payos_webhook"
                });
                
                saveDb(db);
                console.log(`[Webhook] Cấp voucher thành công cho đơn hàng ${orderCode}: ${voucherCode}`);
            }
        }
        
        res.status(200).json({ success: true, message: "OK" });
    } catch (error) {
        console.error("Lỗi xác minh webhook PayOS:", error.message);
        res.status(400).send("Invalid signature");
    }
});

// API: Đăng ký Webhook tự động cho PayOS
app.post('/api/admin/payos/register-webhook', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Chưa đăng nhập admin' });
    }
    const token = authHeader.split(' ')[1];
    const db = getDb();
    if (token !== db.adminToken) {
        return res.status(401).json({ error: 'Token không hợp lệ' });
    }

    const payosSettings = db.payos || {};
    if (!payosSettings.clientId || !payosSettings.apiKey || !payosSettings.checksumKey) {
        return res.status(400).json({ error: 'Chưa cấu hình đầy đủ Client ID, API Key và Checksum Key của PayOS' });
    }

    const host = req.get('host');
    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const baseUrl = process.env.RENDER_EXTERNAL_URL || `${protocol}://${host}`;
    const webhookUrl = `${baseUrl}/api/payment/payos/webhook`;

    try {
        const payOS = new PayOS({
            clientId: payosSettings.clientId,
            apiKey: payosSettings.apiKey,
            checksumKey: payosSettings.checksumKey
        });

        // Gọi API của PayOS để xác nhận URL webhook tự động
        const result = await payOS.webhooks.confirm(webhookUrl);
        res.json({ success: true, webhookUrl, result });
    } catch (error) {
        console.error("Lỗi đăng ký webhook tự động:", error);
        res.status(500).json({ error: 'Lỗi đăng ký webhook: ' + error.message });
    }
});

// API: Đón người dùng quay lại sau khi thanh toán trên cổng PayOS
app.get('/api/payment/payos/return', async (req, res) => {
    const { orderCode } = req.query;
    
    let db = getDb();
    const pending = db.pendingPayments[orderCode];
    if (!pending) {
        return res.send("Lỗi: Không tìm thấy phiên thanh toán");
    }

    // Nếu đã thành công (từ Webhook báo trước)
    if (pending.status === 'success' && pending.voucherCode) {
        return res.redirect(`/?success=true&voucher=${pending.voucherCode}&return_url=${encodeURIComponent(pending.returnUrl)}&sessionId=${pending.sessionId}`);
    }

    const payosSettings = db.payos || {};
    const useMock = payosSettings.useMock !== undefined ? payosSettings.useMock : false;
    
    if (useMock) {
        const groupId = db.ruijie.groupId || "9105026";
        const pkg = db.packages.find(p => p.id === pending.packageId);
        if (pkg) {
            try {
                const voucherCode = await generateVoucher(groupId, pkg.ruijieUserGroupId, pkg.ruijieProfileId);
                pending.status = 'success';
                pending.voucherCode = voucherCode;
                
                db.vouchers.push({
                    id: orderCode.toString(),
                    voucherCode,
                    customerName: pending.customerName,
                    customerPhone: pending.customerPhone,
                    packageId: pending.packageId,
                    packageName: pkg.name,
                    createdAt: new Date().toISOString(),
                    mac: pending.mac,
                    method: "payos_mock"
                });
                saveDb(db);
                return res.redirect(`/?success=true&voucher=${voucherCode}&return_url=${encodeURIComponent(pending.returnUrl)}&sessionId=${pending.sessionId}`);
            } catch (e) {
                return res.send("Lỗi tạo voucher giả lập: " + e.message);
            }
        }
    }

    try {
        const payOS = new PayOS({
            clientId: payosSettings.clientId,
            apiKey: payosSettings.apiKey,
            checksumKey: payosSettings.checksumKey
        });

        // Chủ động gọi API kiểm tra trạng thái thanh toán trực tiếp từ PayOS (đề phòng webhook trễ)
        const paymentInfo = await payOS.paymentRequests.getPaymentLinkInformation(orderCode);
        
        if (paymentInfo && paymentInfo.status === 'PAID') {
            if (!pending.voucherCode) {
                const groupId = db.ruijie.groupId || "9105026";
                const pkg = db.packages.find(p => p.id === pending.packageId);
                if (pkg) {
                    const voucherCode = await generateVoucher(groupId, pkg.ruijieUserGroupId, pkg.ruijieProfileId);
                    pending.status = 'success';
                    pending.voucherCode = voucherCode;
                    
                    db.vouchers.push({
                        id: orderCode.toString(),
                        voucherCode,
                        customerName: pending.customerName,
                        customerPhone: pending.customerPhone,
                        packageId: pending.packageId,
                        packageName: pkg.name,
                        createdAt: new Date().toISOString(),
                        mac: pending.mac,
                        method: "payos_direct"
                    });
                    saveDb(db);
                    return res.redirect(`/?success=true&voucher=${voucherCode}&return_url=${encodeURIComponent(pending.returnUrl)}&sessionId=${pending.sessionId}`);
                }
            } else {
                return res.redirect(`/?success=true&voucher=${pending.voucherCode}&return_url=${encodeURIComponent(pending.returnUrl)}&sessionId=${pending.sessionId}`);
            }
        } else {
            return res.redirect(`/?error=payment_pending_or_failed`);
        }
    } catch (error) {
        console.error("Lỗi kiểm tra trạng thái thanh toán PayOS:", error);
        res.send("Có lỗi xảy ra hoặc giao dịch chưa được xác nhận. Vui lòng thử lại.");
    }
});

// Render ứng dụng React cho mọi route không phải API
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Backend Server đang chạy tại cổng ${PORT}`);
    console.log(`- API Cấp quyền Free: POST http://localhost:${PORT}/api/auth/free`);
    console.log(`- API Khởi tạo PayOS: POST http://localhost:${PORT}/api/payment/payos`);
});
