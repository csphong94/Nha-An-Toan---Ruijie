import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultData = {
    adminPassword: "admin", // Default password
    ruijie: {
        appId: process.env.RUIJIE_APP_ID || "",
        appSecret: process.env.RUIJIE_APP_SECRET || "",
        tokenStatic: process.env.RUIJIE_TOKEN_STATIC || "",
        groupId: process.env.RUIJIE_GROUP_ID || ""
    },
    portal: {
        title: "Vali 3 Captive Portal",
        subtitle: "Đăng nhập để sử dụng WiFi",
        themeColor: "#EAB308"
    },
    packages: [
        {
            id: "pkg_free",
            name: "Gói Free (5Mbps)",
            type: "free",
            durationDays: 30,
            price: 0,
            ruijieProfileId: "604465",
            ruijieUserGroupId: "604465"
        },
        {
            id: "pkg_vip",
            name: "Gói VIP Không giới hạn",
            type: "vip",
            durationDays: 30,
            price: 10000,
            ruijieProfileId: "604466",
            ruijieUserGroupId: "604466"
        }
    ]
};

// Initialize DB if it doesn't exist
if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(defaultData, null, 2), 'utf-8');
}

export function getDb() {
    try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
    } catch (err) {
        console.error("Lỗi đọc database, trả về mặc định:", err);
        return defaultData;
    }
}

export function saveDb(data) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error("Lỗi ghi database:", err);
        return false;
    }
}
