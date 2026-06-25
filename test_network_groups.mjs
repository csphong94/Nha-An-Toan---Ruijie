import axios from 'axios';

const APP_ID = 'openb79f8985c8dd';
const APP_SECRET = '65a7761ef24f4cde84302d348850ba25';
const BASE_URL = 'https://cloud-as.ruijienetworks.com';
const TOKEN_STATIC = 'd63dss0a81e4415a889ac5b78fsc904a';

async function test() {
    try {
        const tokenResp = await axios.post(`${BASE_URL}/service/api/oauth20/client/access_token?token=${TOKEN_STATIC}`, {
            appid: APP_ID,
            secret: APP_SECRET
        });
        const token = tokenResp.data.accessToken;

        const response = await axios.get(`${BASE_URL}/service/api/group/single/tree?depth=BUILDING&access_token=${token}`);
        console.log(JSON.stringify(response.data, null, 2));
    } catch (e) {
        console.error(e.response ? e.response.data : e.message);
    }
}

test();
