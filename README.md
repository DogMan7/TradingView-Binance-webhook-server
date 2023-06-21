# Binance-webhook-server

 
 Webhook server that uses TradingView alerts to automate trading strategies on the Binance spot exchange



This project is a Node.js server application that interacts with the Binance cryptocurrency exchange's API created using chatGPT prompts . The following config instuctions are specific to a windows server.  The Goal was to Use Trading view pinescript alerts to automate strategys on the binance spot exchange  The server listens for incoming webhook requests and places orders on the Binance exchange based on the details of the request.

Here's a brief overview of how it works:

The server listens for POST requests at the /webhook endpoint. Each request should contain details about an order, such as the symbol, side (BUY or SELL), order type (LIMIT or MARKET), and quantity. heres an example of a valid payload 

    {
    "symbol": "BTCUSDT",
    "side": "BUY",
    "orderType": "MARKET",
    "quantity": 0.001,
    "password": "Your-Password-Here"
    }

the format for the webhook is - https://Your-Domain/webhook


The server verifies the password in the request for authentication.

If the order type is LIMIT, the server fetches the current price for the symbol from the Binance API, calculates the limit price, and places a limit order.

If the order type is MARKET and the side is BUY, the server places a market buy order.

If the side is SELL, the server places a sell order. If the filled quantity from a previous buy order is less than the quantity specified in the sell order, it adjusts the quantity to the filled amount.

The server uses the Binance API key and secret to authenticate requests to the Binance API. It creates a signature for each request using the HMAC-SHA256 algorithm.

The server logs all requests and responses, as well as any errors, using the Winston logging library.

The server runs on HTTPS and uses SSL certificates for secure communication.



...........................................................................................................................................................................................................................................................................................................


the project also includes a feature for placing limit orders with a specific strategy in mind. When placing a limit buy order, the server sets the limit price to be 0.2% above the current market price. Conversely, when placing a limit sell order, the server sets the limit price to be 0.2% below the current market price.

This strategy is implemented to increase the likelihood of the limit orders being filled. By setting the buy price slightly higher than the current market price, it increases the chances of a seller matching the order. Similarly, by setting the sell price slightly lower than the current market price, it increases the chances of a buyer matching the order.

These percentages are hardcoded in the server code and can be adjusted according to the user's trading strategy. For example, if a user wants to place limit buy orders at a price that is 0.5% above the current market price, they would modify the calculation in the code where the limit price is set for buy orders. 
The same applies for adjusting the percentage for limit sell orders. these numbers were setup purely for testing and you should adjust them to suit your strategys and the markets that you're trading 

...........................................................................................................................................................................................................................................................................................................


For limit buy orders, the relevant code is:

    if (side === 'BUY') {
    limitPrice = currentPrice * 1.002;
    }
In this line, 1.002 represents the current market price plus 0.2%. If you want to adjust this to, say, 0.5% above the current market price, you would change this line to:

    if (side === 'BUY') {
    limitPrice = currentPrice * 1.005;
  
 ..........................................................................................................................................................................
 
  
}
For limit sell orders, the relevant code is:

    else if (side === 'SELL') {
    limitPrice = currentPrice * 0.998;
    }
In this line, 0.998 represents the current market price minus 0.2%. If you want to adjust this to, say, 0.5% below the current market price, you would change this line to:


    else if (side === 'SELL') {
    limitPrice = currentPrice * 0.995;
    }
In both cases, the number you multiply currentPrice by is 1 plus or minus the percentage you want to adjust by (expressed as a decimal). So for a 0.5% increase, you would use 1.005, and for a 0.5% decrease, you would use 0.995.

....................................................................................................................................................................................................................................

for market orders:   Sell orders will not execute a trade unless there has been a previous buy order
....................................................................................................................................................................................................................................

prerequisites for running this project:

Node.js:   This project is written in JavaScript and runs on Node.js. You need to have Node.js installed on your server. You can download it from here. https://nodejs.org/en

NPM Packages:   The project uses several NPM packages including express, axios, crypto, body-parser, moment, winston, querystring, and https. These can be installed by running npm install in the project directory.

Binance API Key and Secret:   You need to have a Binance API key and secret to interact with the Binance API. These can be obtained from your Binance account.

Server:   You need a server to host your application. This could be a local server or a cloud-based server.

Domain:   you'll need a domain name that resolves to your server for the webhooks

Nginx:   Nginx is a web server that can be used to serve your application. It's not strictly necessary if you're running the server locally or using some hosting platforms, but it's often used in production environments for its efficiency and flexibility. You'll need to have Nginx installed and configured on your server.  https://nginx.org/en/download.html

SSL Certificate:   The project is set up to use HTTPS for secure communication. For this, you'll need an SSL certificate. This can be obtained from a Certificate Authority (CA). Some providers offer free certificates, like Let's Encrypt.   https://letsencrypt.org/

.....................................................................................................................................................................................................................................................

If you want to use it to fire webhooks from trading view at binance youll need to add a firewall rule to allow these ip addreses through on whatever port your server is running on default is 3000  
52.89.214.238,   34.212.75.30,   54.218.53.128,   52.32.178.7 - here's a link to the info about trading view webhooks check before you add the rules in case the send ip's change:   https://www.tradingview.com/support/solutions/43000529348-about-webhooks/  
........................................................................................................................................................................................................................................................

you'll also need to include the paths to your SSL certificate and private key: in your nginx config , something like this 

             server {
        listen 443 ssl;
        server_name yourdomain.com;

        ssl_certificate /etc/nginx/ssl/nginx.crt;
        ssl_certificate_key /etc/nginx/ssl/nginx.key;

        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
        }
    }
 
......................................................................................................................................................................................................................................................... 
 
 the server is currently set up to run on binance testnet,  you can get an api key for the test net here https://testnet.binance.vision/  so that you can test it without using real $$$ , if you want to run it on binance spot exchange you will need to change the Base URL in the code  from

        const BASE_URL = 'https://testnet.binance.vision';

        to 

        const BASE_URL = 'https://api.binance.com';

 and change your testnet api key to a real api key for binance spot 

there are also a couple of tools that i made along the way  tokenbalances.js  and marketsell.js   , the marketsell.js tool is for use on the testnet,  the webhook server is configured to not make a market sell unless there's been a previous market buy, so in the case where you dont have enough of the quoted asset to make a market buy with the strategy you're testing you can use this tool to make a simple market sell of a given asset  to get the quoted asset you need to test  your strategy , btc-usdt for instsance ,  the tokenbalances.js file is just a tool to retrieve token balances from the exchange , again you will need your api keys and secrets in the config of both of these to use them

............................................................................................................................................................................................................................................................................

 
 instalation

 ensure you have all prerequisites and that your nginx config file has the paths to your SSL certificate and private key properly configured
 
Fork and clone the repository

Install Dependencies: The project uses several Node.js packages. You can install these by running:  npm install from the project directory

     npm install
     
This command reads the package.json file in the project directory and installs all the listed dependencies.

Configure the Project: Before you can run the project, you need to configure it with your Binance API key and secret.  and your password for the webhooks , These should be entered in the appropriate place in the project's code. -server.js  and your webhook payload must contain the same password in the password field of the server.js file,  Make sure to keep these secure and do not share them with anyone. make sure your nginx is properly configured and allowed though the firewall ,  and that the trading view ip addresses and ports have an incoming rule to allow them through the firewall for the webhooks

Start the Server: Once everything is set up, you can start the server by running:

     node server.js
    
Replace server.js with the name of your main server file, if it's different.

The server is now running and ready to receive and process webhook requests.
 
 
 
 
 
 
 
 
 
 
