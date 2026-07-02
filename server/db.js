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
    adminPassword: "Abcd@2993", // Default password
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
            ruijieProfileId: "67940168875442127021979345797676",
            ruijieUserGroupId: "604465"
        },
        {
            id: "pkg_vip1",
            name: "Gói VIP 1 Ngày",
            type: "vip",
            durationDays: 1,
            price: 5000,
            ruijieProfileId: "34617871223073818252355027497339",
            ruijieUserGroupId: "604466"
        },
        {
            id: "pkg_vip3",
            name: "Gói VIP 3 Ngày",
            type: "vip",
            durationDays: 3,
            price: 12000,
            ruijieProfileId: "99881056921180660397157978345666",
            ruijieUserGroupId: "606182"
        },
        {
            id: "pkg_vip7",
            name: "Gói VIP 7 Ngày",
            type: "vip",
            durationDays: 7,
            price: 25000,
            ruijieProfileId: "41284419864201130841043286332278",
            ruijieUserGroupId: "606183"
        },
        {
            id: "pkg_vip30",
            name: "Gói VIP 30 Ngày",
            type: "vip",
            durationDays: 30,
            price: 80000,
            ruijieProfileId: "76683500280644817580097882164296",
            ruijieUserGroupId: "606184"
        }
    ],
    vouchers: [],
    payos: {
        clientId: "75c589e8-d919-44ad-8e29-816621bd65f0",
        apiKey: "7aa63cb4-7333-4b46-b308-346b1a034e12",
        checksumKey: "4f35df819a0a77965694f0f4e618703e1ac74388f53883d9b4f06e60847df3d3",
        useMock: false
    },
    pendingPayments: {}
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
        console.error("Lỗi đọc database, cố gắng phục hồi từ backup:", err);
        const backupFile = DB_FILE + '.bak';
        if (fs.existsSync(backupFile)) {
            try {
                const rawBak = fs.readFileSync(backupFile, 'utf-8');
                const parsed = JSON.parse(rawBak);
                fs.writeFileSync(DB_FILE, rawBak, 'utf-8');
                console.log("Đã phục hồi thành công database từ tệp backup.");
                return parsed;
            } catch (bakErr) {
                console.error("Lỗi đọc tệp backup:", bakErr);
            }
        }
        return defaultData;
    }
}

export function saveDb(data) {
    try {
        if (fs.existsSync(DB_FILE)) {
            fs.copyFileSync(DB_FILE, DB_FILE + '.bak');
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
        return true;
    } catch (err) {
        console.error("Lỗi ghi database:", err);
        return false;
    }
}
