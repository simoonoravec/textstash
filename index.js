require('dotenv').config();
const fs = require('fs');

if (!fs.existsSync(__dirname + '/config.js')) {
    console.error('Config file not found!');
    process.exit(1);
}
const config = require('./config');

//Validate config
if (
    !config.http_port
    || typeof config.http_port != 'number'
    || config.http_port % 1 != 0

    || !config.data_dir
    || config.data_dir.length == 0
    
    || !config.id_generator
    || !['random', 'phoenic'].includes(config.id_generator)

    || !config.id_bytes
    || config.id_bytes < 1
    || config.id_bytes % 1 != 0

    || !config.delete_after
    || config.delete_after < 0
    || config.delete_after % 1 != 0
) {
    console.error('Invalid config file! (Missing or invalid variables)');
    process.exit(1);
}

const { log, logLevel } = require('./app/logger');
const utils = require('./app/utils');
const cleaner = require('./app/cleaner');


log(logLevel.INFO, `TextStash starting up...`);

/**
 * Initialize data directory
 */
log(logLevel.INFO, `Initializing data directory...`);
utils.initializeDataDir(logLevel.INFO);

/**
 * Initialize cleanup
 */
if (config.delete_after > 0) {
    cleaner.deleteExpiredFiles(config.delete_after);
    setInterval(() => cleaner.deleteExpiredFiles(config.delete_after), 60000);
}

/**
 * Initialize Web server
 */
log(logLevel.INFO, `Initializing Web server (Express)`);
const express = require('express');
const webServer = express();

webServer.use(require('body-parser').urlencoded({ extended: false, limit: '1mb' }));
webServer.set('view engine', 'ejs');
webServer.use('/static', express.static('static'));

webServer.use(function(req, res, next) {
    log(logLevel.DEBUG, `[HTTP] Request form ${req.ip} at ${req.path}`);

    next();
});

webServer.use('/', require('./routes/main'));
webServer.use('/api', require('./routes/api'));

/* Catch all API URLs and show 404 */
webServer.all('/api/*', (req, res) => {
    res.json({code: 404, error: 'API not found or invalid method.'});
});

/* Catch all URLs and redirect to homepage */
webServer.all('*', (req, res) => {
    res.redirect('/');
});

/* Handle server errors in production mode (hide error details) */
if (process.env.NODE_ENV != 'development') {
    webServer.use((err, req, res, next) => {
        if (err) {
            res.sendStatus(500);
            return;
        }
         
        next();
    });
}

webServer.listen(config.http_port, () => {
    log(logLevel.INFO, `TextStash Web server listening on port ${config.http_port}`);
});