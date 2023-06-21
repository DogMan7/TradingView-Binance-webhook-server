#  TradingView-Binance-webhook-server

 
 Webhook server that uses TradingView alerts to automate trading strategies on the Binance.com spot exchange



This project is a Node.js server application that interacts with the Binance.com cryptocurrency exchange's API created using chatGPT prompts . The following config instuctions are specific to a windows server.  The Goal was to Use Trading view pinescript alerts to automate strategys on the binance spot exchange  The server listens for incoming webhook requests and places orders on the Binance exchange based on the details of the request.

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

..............................................................................................................................................................................................................................................................

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

These percentages are hardcoded in the server code and can be adjusted according to your trading strategy. For example, if you want to place limit buy orders at a price that is 0.5% above the current market price, you would modify the calculation in the code where the limit price is set for buy orders. 
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

theres a function in the code to prevent sell before buy but its commented out by default.   if you need this function for your strategy you will need to uncomment these lines in the serverspot.js or servertest.js depending which of these you are running 

      else if (side === 'SELL') {
    // Ignore the sell order if no buy order has been executed yet
    // if (filledQuantity === null) {
    //   console.log('No buy order has been executed yet. Ignoring the sell order.');
    //   return;
    // }

    // If the filled quantity is less than the quantity specified in the sell order, sell the filled amount
    if (filledQuantity < quantity) {
      console.log('The filled quantity is less than the quantity specified in the sell order. Selling the filled amount.');
      quantity = filledQuantity;
    }

....................................................................................................................................................................................................................................

prerequisites for running this project:

Node.js:   This project is written in JavaScript and runs on Node.js. You need to have Node.js installed on your server. You can download it from here. https://nodejs.org/en

NPM Packages:   The project uses several NPM packages including express, axios, crypto, body-parser, moment, winston, querystring, and https. These can be installed by running npm install in the project directory.

    npm install

 A Binance.com Account Binance API Key and Secret:   You need to have a Binance API key and secret to interact with the Binance API. These can be obtained from your Binance account. when you make your keys on binance spot make sure you limit them to your servers ip address 
 
Server:   You need a server to host your application. This could be a local server or a cloud-based server.

Domain:   you'll need a domain that resolves to your server for the webhooks

Nginx:   Nginx is a web server that can be used to serve your application. there are others you could use but these config instructions assume youre running nginx. you can download the latest version here   https://nginx.org/en/download.html

SSL Certificate:   The project is set up to use HTTPS for secure communication. For this, you'll need an SSL certificate. you can get one for free at Let's Encrypt.   https://letsencrypt.org/

A Paid Trading View Account- the cheapest tier is fine  

.....................................................................................................................................................................................................................................................

If you want to use it to fire webhooks from trading view at binance youll need to add a firewall rule to allow these ip addreses through on whatever port your server is running on default is 3000

     52.89.214.238   34.212.75.30   54.218.53.128   52.32.178.7 
     
here's a link to the info about trading view webhooks check before you add the rules in case the send ip's change:   https://www.tradingview.com/support/solutions/43000529348-about-webhooks/ 


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
 
 theres 2 scrpts you can run, servertest.js and serverspot.js , servertest.js  is configured to run on the binance testnet, youll need to get test net api keys and put your key and secret in the place holders before you run it, the other script serverspot.js is configured to run on the Binance.com spot exchange. so youll need to make api keys for whatever acount you want your strategys to trade on 

theres also a tool called tokenbalances.js which is just to pull your token balances from the test net  again you'll need to add your test net api key and secret to run it
............................................................................................................................................................................................................................................................................

 
 installation


ensure you have all prerequisites and that your nginx config file has the paths to your SSL certificate and private key properly configured
 
Fork and clone the repository

Install Dependencies: The project uses several Node.js packages. You can install these by running:  npm install from the project directory

     npm install
     
This command reads the package.json file in the project directory and installs all the listed dependencies.

Configure the Project:   Before you can run the project, you need to configure it with your Binance API key and secret.  and your password for the webhooks , These should be entered in the appropriate place in the project's code. if youre running the test server script you will have to first get test server api keys, if youre running the spot server then youll need api keys from binance.com  and your webhook payload must contain the same password in the password field of the js script that youre running  - either serverspot.js or servertest.js,  Make sure to keep these secure and do not share them with anyone. make sure your nginx is properly configured in your firewall settings ,  and that the trading view ip addresses and ports have an incoming rule to allow them through the firewall for the webhooks

Start the Server: Once everything is set up, you can start the server by running:

     node servertest.js   
or

     node serverspot.js

     
    
The server is now running and ready to receive and process webhook requests.. you can setup your strategys on Trading view and the Bot will make the trades

create a new alert on trading view -paste the message into the message box on the alert settings tab and  on the notifications tab tick the webhook box and paste the webhook url - https://Your-Domain/webhook into the field and hit save
here is a short tutorial on how to set up trading view alerts   https://zenandtheartoftrading.com/how-to-set-tradingview-alerts/ 

if you want to run it in the backgound and have the trades log to a file you can run it under pm2 first install pm2 globally  

     npm install -g pm2

and then navigate to the direcory of your server in the command prompt and run either 

    pm2 start serverspot.js

or 
     pm2 start servertest.js

depending on which script you're running 

this will run it in the background and log to a file



Happy Trading ! 
 
 
 
 
 
 
 
 
 
 
