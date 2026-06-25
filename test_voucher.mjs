import axios from 'axios';

const APP_ID = 'openb79f8985c8dd';
const APP_SECRET = '65a7761ef24f4cde84302d348850ba25';
const BASE_URL = 'https://cloud-as.ruijienetworks.com';
const TOKEN_STATIC = 'd63dss0a81e4415a889ac5b78fsc904a';

async function testCreateVoucher() {
    try {
        const tokenResp = await axios.post(`${BASE_URL}/service/api/oauth20/client/access_token?token=${TOKEN_STATIC}`, {
            appid: APP_ID,
            secret: APP_SECRET
        });
        const token = tokenResp.data.accessToken;

        const groupId = 9105026;
        const freeUserGroupId = 604465;
        const freeProfileId = "67940168875442127021979345797676";

        console.log("Token:", token);
        const payload = {
            quantity: 1,
            profile: freeProfileId,
            userGroupId: freeUserGroupId,
            comment: 'Auto-generated test'
        };
        const response = await axios.post(`${BASE_URL}/service/api/open/auth/voucher/create/${groupId}?access_token=${token}`, payload);
        console.log("Create Voucher Response:");
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}

testCreateVoucher();
