import axios from 'axios';

async function testGeneral() {
    const payload = {
        lang: 'en',
        authType: 'voucher',
        sessionId: 'dummy_session_id',
        account: 'dummy_voucher'
    };
    try {
        const response = await axios.post('https://portal-as.ruijienetworks.com/api/auth/general', payload);
        console.log("Success:", response.data);
    } catch (e) {
        console.error("Error:", e.response ? e.response.data : e.message);
    }
}
testGeneral();
