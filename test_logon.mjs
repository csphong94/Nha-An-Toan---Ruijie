import axios from 'axios';

const APP_ID = 'openb79f8985c8dd';
const APP_SECRET = '65a7761ef24f4cde84302d348850ba25';
const BASE_URL = 'https://auth.ruijienetworks.com';
const TOKEN_STATIC = 'd63dss0a81e4415a889ac5b78fsc904a';

async function testLogon() {
    try {
        const tokenResp = await axios.post(`${BASE_URL}/service/api/oauth20/client/access_token?token=${TOKEN_STATIC}`, {
            appid: APP_ID,
            secret: APP_SECRET
        });
        const token = tokenResp.data.accessToken;

        const payload = {
            appid: APP_ID,
            authType: "voucher",
            token: token,
            nasIp: "172.17.68.90",
            nasMac: "d8:33:2a:9e:11:6a",
            userMac: "96:f1:60:c7:97:88",
            ssid: "VLAN28",
            voucherCode: "52mphp" // I will use a real one later
        };

        const response = await axios.post(`${BASE_URL}/service/api/open/auth/logon`, payload);
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

testLogon();
