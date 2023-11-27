# TextStash
A very simple pastebin/hastebin alternative

# How to install
### Requirements:
- NodeJS (Recommended version: 20)
- NPM
```
git clone https://github.com/simoonoravec/textstash.git
cd textstash
npm install
```
Rename **config.example.js** to **config.js** and adjust the configuration as you need to

```
npm run start
```
# Running in background
To run the application in background, I recommend using [PM2](https://www.npmjs.com/package/pm2). But feel free to use another methods (such as creating a *systemd* service).
### Simple PM2 guide:
I'm assuming you already have Node.js and NPM installed\
Recommeded version: 20
  1. *Follow the installation steps from above* ([How to install](#how-to-install))
  2. Stop the application if you already started it
  3. Install PM2 on your system `$ npm install pm2 -g`
  4. Start the application with PM2 `$ pm2 start index.js --name TextStash`
  5. Configure PM2 to start on boot `$ pm2 startup`
  6. Save PM2 process list `$ pm2 save`
  7. Done!

Complete PM2 documentation can be found here: https://pm2.keymetrics.io/docs/usage/quick-start/
