const axios = require('axios');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const apiKey = 'YOUR-API-KEY-HERE';
const secretKey = 'YOUR-API-SECRET-HERE-HERE';

const getServerTime = async () => {
  try {
    const response = await axios.get('https://testnet.binance.vision/api/v3/time');
    if (response.status === 200) {
      return response.data.serverTime;
    } else {
      console.log(`Error: ${response.status} - ${response.statusText}`);
      return Date.now();
    }
  } catch (error) {
    console.error('Error:', error.message);
    return Date.now();
  }
};

const placeSellOrder = async (symbol, quantity) => {
  try {
    const timestamp = await getServerTime();
    const order = {
      symbol: symbol,
      side: 'SELL',
      type: 'MARKET',
      quantity: quantity,
      timestamp: timestamp,
    };
    const queryString = Object.keys(order).map(key => `${key}=${order[key]}`).join('&');
    const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      cert: fs.readFileSync('C:\\nginx-1.24.0\\fullchain.pem'),
      key: fs.readFileSync('C:\\nginx-1.24.0\\privkey.pem'),
    });

    const response = await axios({
      method: 'post',
      url: 'https://testnet.binance.vision/api/v3/order',
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
      params: {
        ...order,
        signature,
      },
      httpsAgent,
    });

    if (response.status === 200) {
      console.log('Order placed successfully:', response.data);
    } else {
      console.log(`Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

placeSellOrder('BTCUSDT', 0.1); // Replace 'BTCUSDT' with your symbol and 0.001 with your quantity
