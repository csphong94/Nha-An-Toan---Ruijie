import axios from 'axios';

const APP_ID = 'openb79f8985c8dd';
const APP_SECRET = '65a7761ef24f4cde84302d348850ba25';
const BASE_URL = 'https://cloud-as.ruijienetworks.com';
const TOKEN_STATIC = 'd63dss0a81e4415a889ac5b78fsc904a';

async function fetchUserGroups() {
    try {
        const tokenResp = await axios.post(`${BASE_URL}/service/api/oauth20/client/access_token?token=${TOKEN_STATIC}`, {
            appid: APP_ID,
            secret: APP_SECRET
        });
        const token = tokenResp.data.accessToken;
        console.log("Token:", token);

        const groupId = 9105026; // NAT Vali 03
        const resp = await axios.get(`${BASE_URL}/service/api/intl/usergroup/list/${groupId}?pageIndex=0&pageSize=100&access_token=${token}`);
        console.log("User Groups:");
        console.log(JSON.stringify(resp.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

fetchUserGroups();
