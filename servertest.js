const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const moment = require('moment');
const winston = require('winston');
const querystring = require('querystring');
const https = require('https');
const fs = require('fs');

// Your Binance API key and secret
const API_KEY = 'YOUR-API-KEY-HERE';
const API_SECRET = 'YOUR-API-SECRET-HERE';

// The base URL for Binance's API-TESTNET-change this to the base url for binance spot if you want to use it for live trading
const BASE_URL = 'https://testnet.binance.vision';

// The endpoint for placing a new order
const ORDER_ENDPOINT = '/api/v3/order';

// The password required for authentication
const AUTH_PASSWORD = 'YOUR-WEBHOOK-PASSWORD-HERE';

// Create a new Winston logger instance
const logger = winston.createLogger({
  level: 'error', // Set the log level to error
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(), // Log to the console
    new winston.transports.File({ filename: 'error.log' }) // Log to a file
  ]
});

// Create a new Express application
const app = express();

// Use body-parser middleware to parse JSON request bodies
app.use(bodyParser.json());

let openOrderId = null;
let filledQuantity = null;
app.post('/webhook', (req, res) => {
  // Log the current timestamp
  const timestamp = Date.now();
  console.log('Timestamp:', timestamp);

  // Log the formatted date
  const formattedDate = moment(timestamp).format('YYYY-MM-DD HH:mm:ss');
  console.log('Formatted date:', formattedDate);

  // Log the received request
  console.log('Received a request:', req.body);

  // Extract order details and password from the request body
  let { symbol, side, orderType, quantity, password } = req.body;

  // Check if the password is correct
  if (password !== AUTH_PASSWORD) {
    console.log('Invalid password');
    res.sendStatus(401); // Unauthorized
    return;
  }

  if (orderType === 'LIMIT') {
    // Get the current price from the exchange
    axios.get(BASE_URL + '/api/v3/ticker/price', { params: { symbol } })
      .then(response => {
        const currentPrice = parseFloat(response.data.price);

        // Calculate the limit price-adjust these to suit your-strategy
        let limitPrice;
        if (side === 'BUY') {
          limitPrice = currentPrice * 1.002;
        } else if (side === 'SELL') {
          limitPrice = currentPrice * 0.998;
        }

        // Prepare the order parameters for a limit order
        const limitOrderData = {
          symbol,
          side,
          type: 'LIMIT',
          quantity,
          price: limitPrice.toFixed(2),
          timeInForce: 'GTC',
          timestamp
        };

        // Create the signature for the limit order request
        
        const limitOrderQueryString = querystring.stringify(limitOrderData);
        const limitOrderSignature = crypto.createHmac('sha256', API_SECRET)
          .update(limitOrderQueryString).digest('hex');

        // Add the signature to the limit order data
        limitOrderData.signature = limitOrderSignature;

        // Place the limit order
        axios.post(BASE_URL + ORDER_ENDPOINT, null, {
          params: limitOrderData,
          headers: {
            'X-MBX-APIKEY': API_KEY
          }
        })
          .then(response => {
            console.log('Limit order response:', response.data);
            const orderId = response.data.orderId;

            // Handle the response and perform any necessary actions

          })
          .catch(error => {
            console.error('Error placing limit order:', error);
            logger.error('Error placing limit order:', error);
          });
      })
      .catch(error => {
        console.error('Error getting current price:', error);
        logger.error('Error getting current price:', error);
      });
  } else if (side === 'BUY') {
    if (orderType === 'MARKET') {
      // The parameters for your order
      let data = {
        symbol: symbol,
        side: side,
        type: 'MARKET',
        quantity: quantity,
        recvWindow: 5000,
        timestamp: timestamp
      };

      // Create the signature for your request
      let queryString = querystring.stringify(data);
      let signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

      // Add the signature to your request data
      data.signature = signature;

      // Make the request to Binance's API to place an order
      axios.post(BASE_URL + ORDER_ENDPOINT, null, {
        params: data,
        headers: {
          'X-MBX-APIKEY': API_KEY
        }
      })
      .then(response => {
        console.log('Order response:', response.data);

        // Store the filled quantity
        filledQuantity = response.data.filledQuantity;
      })
      .catch(error => {
        console.error('Error placing order:', error);
        logger.error('Error placing order:', error);
      });
    }
  } else if (side === 'SELL') {
    Ignore the sell order if no buy order has been executed yet
    if (filledQuantity === null) {
      console.log('No buy order has been executed yet. Ignoring the sell order.');
      return;
    }

    // If the filled quantity is less than the quantity specified in the sell order, sell the filled amount
    if (filledQuantity < quantity) {
      console.log('The filled quantity is less than the quantity specified in the sell order. Selling the filled amount.');
      quantity = filledQuantity;
    }

    // The parameters for the sell order
    let data = {
      symbol: symbol,
      side: side,
      type: orderType === 'MARKET' ? 'MARKET' : 'LIMIT',
      quantity: quantity,
      recvWindow: 5000,
      timestamp: timestamp
    };

    if (orderType === 'LIMIT') {
      // Get the current price from the exchange
      axios.get(BASE_URL + '/api/v3/ticker/price', { params: { symbol } })
        .then(response => {
          const currentPrice = parseFloat(response.data.price);

          // Calculate the limit price
          const limitPrice = currentPrice * 0.998;

          // Set the limit price for the sell order
          data.price = limitPrice.toFixed(2);

          // Create the signature for the sell order request

          let queryString = querystring.stringify(data);
          let signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

          // Add the signature to the sell order data
          data.signature = signature;

          // Make the request to Binance's API to place a sell order
          axios.post(BASE_URL + ORDER_ENDPOINT, null, {
            params: data,
            headers: {
              'X-MBX-APIKEY': API_KEY
            }
          })
            .then(response => {
              console.log('Sell order response:', response.data);

              // Reset the filled quantity
              filledQuantity = null;
            })
            .catch(error => {
              console.error('Error placing sell order:', error);
              logger.error('Error placing sell order:', error);
            });
        })
        .catch(error => {
          console.error('Error getting current price:', error);
          logger.error('Error getting current price:', error);
        });
    } else {
      // Create the signature for the sell order request
      let queryString = querystring.stringify(data);
      let signature = crypto.createHmac('sha256', API_SECRET).update(queryString).digest('hex');

      // Add the signature to the sell order data
      data.signature = signature;

      // Make the request to Binance's API to place a sell order
      axios.post(BASE_URL + ORDER_ENDPOINT, null, {
        params: data,
        headers: {
          'X-MBX-APIKEY': API_KEY
        }
      })
        .then(response => {
          console.log('Sell order response:', response.data);

          // Reset the filled quantity
          filledQuantity = null;
        })
        .catch(error => {
          console.error('Error placing sell order:', error);
          logger.error('Error placing sell order:', error);
        });
    }
  }

  // Send a 200 status code in response to the webhook
  res.sendStatus(200);
});

// Start the server
https.createServer({
  key: fs.readFileSync('C:\\nginx-1.24.0\\privkey.pem'),
  cert: fs.readFileSync('C:\\nginx-1.24.0\\fullchain.pem')
}, app).listen(3000, () => {
  console.log('Server is running on port 3000');
});
