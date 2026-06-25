import crypto from 'crypto';
import axios from 'axios';

const partnerCode = 'MOMO';
const accessKey = 'M8brj9K6E22vXoDB';
const secretKey = 'nqQiVSgDMy809JoPF6OzP5OdBUB550Y4';
const endpoint = 'https://test-payment.momo.vn/v2/gateway/api/create';

const orderInfo = 'Thanh toan VIP';
const amount = '10000';
const orderId = partnerCode + new Date().getTime();
const requestId = orderId;
const redirectUrl = 'http://localhost:3000/return';
const ipnUrl = 'http://localhost:3000/ipn';
const extraData = '';
const requestType = 'captureWallet';

const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

const signature = crypto.createHmac('sha256', secretKey)
    .update(rawSignature)
    .digest('hex');

const requestBody = {
    partnerCode,
    partnerName: "Test",
    storeId: "MomoTestStore",
    requestId,
    amount,
    orderId,
    orderInfo,
    redirectUrl,
    ipnUrl,
    lang: "vi",
    requestType,
    autoCapture: true,
    extraData,
    signature
};

axios.post(endpoint, requestBody)
    .then(res => {
        console.log("MoMo Response:");
        console.log(res.data);
    })
    .catch(err => {
        console.log("MoMo Error:");
        console.log(err.response ? err.response.data : err.message);
    });
