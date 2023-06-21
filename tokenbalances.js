const axios = require('axios');
const crypto = require('crypto');
const https = require('https');
const fs = require('fs');

const apiKey = 'YOUR-API-KEY-HERE';
const secretKey = 'YOUR-API-SECRET-HERE';

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

const getAccountBalances = async () => {
  try {
    const timestamp = await getServerTime();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto.createHmac('sha256', secretKey).update(queryString).digest('hex');

    const httpsAgent = new https.Agent({
      rejectUnauthorized: false,
      cert: fs.readFileSync('C:\\nginx-1.24.0\\fullchain.pem'),
      key: fs.readFileSync('C:\\nginx-1.24.0\\privkey.pem'),
    });

    const response = await axios({
      method: 'get',
      url: 'https://testnet.binance.vision/api/v3/account',
      headers: {
        'X-MBX-APIKEY': apiKey,
      },
      params: {
        timestamp,
        signature,
      },
      httpsAgent,
    });

    if (response.status === 200) {
      const balances = response.data.balances;
      console.log(balances);
    } else {
      console.log(`Error: ${response.status} - ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
};

getAccountBalances();
