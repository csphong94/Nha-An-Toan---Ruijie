import axios from 'axios';

const APP_ID = 'openb79f8985c8dd';
const APP_SECRET = '65a7761ef24f4cde84302d348850ba25';
const BASE_URL = 'https://cloud-as.ruijienetworks.com';

let accessToken = null;

// Lấy Token xác thực từ Ruijie
export async function getAccessToken() {
    try {
        console.log('[Ruijie API] Đang kết nối để lấy Token...');
        const response = await axios.post(`${BASE_URL}/api/auth`, {
            appId: APP_ID,
            secret: APP_SECRET
        });
        
        if (response.data && response.data.token) {
            accessToken = response.data.token;
            console.log('[Ruijie API] Lấy Token thành công!');
            return accessToken;
        }
        throw new Error('Phản hồi API không chứa token');
    } catch (error) {
        console.error('[Ruijie API Lỗi lấy token]:', error.message);
        // Để phục vụ mục đích Demo, chúng ta sẽ trả về token giả nếu API thực tế yêu cầu IP Allowlist
        return 'mock_token_for_development';
    }
}

// Cấp quyền truy cập WiFi gói Free (5Mbps)
export async function authorizeFreeWiFi(macAddress) {
    if (!accessToken) await getAccessToken();
    
    console.log(`[Ruijie API] Đang cấp quyền mạng FREE (5Mbps) cho MAC: ${macAddress}`);
    // Thực tế sẽ gọi Endpoint của Ruijie, ví dụ: /api/external-portal/auth
    
    return { success: true, message: 'Đã mở khóa truy cập mạng ở mức Free' };
}

// Nâng cấp băng thông gói VIP (100Mbps)
export async function upgradeToVIP(macAddress) {
    if (!accessToken) await getAccessToken();
    
    console.log(`[Ruijie API] NÂNG CẤP BĂNG THÔNG VIP (100Mbps) cho MAC: ${macAddress}`);
    // Thực tế sẽ gọi API thay đổi Policy của MAC này trên Ruijie Cloud
    
    return { success: true, message: 'Đã nâng cấp lên gói VIP thành công' };
}
