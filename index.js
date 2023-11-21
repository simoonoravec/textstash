require('dotenv').config();

const config = require('./config');
const helpers = require('./helpers');

helpers.log(helpers.logLevel.INFO, `TextStash starting up...`);

const data_dir = config.data_dir;
global.data_dir = data_dir;

/**
 * Initialize data directory
 */
helpers.log(helpers.logLevel.INFO, `Initializing data directory...`);
helpers.initializeDataDir(helpers.logLevel.INFO);

/**
 * Initialize cleanup
 */
if (config.delete_after > 0) {
    helpers.deleteExpiredFiles(config.delete_after);
    setInterval(() => helpers.deleteExpiredFiles(config.delete_after), 60000);
}

/**
 * Initialize app
 */
helpers.log(helpers.logLevel.INFO, `Initializing Web server (Express)`);
const express = require('express');
const webServer = express();

webServer.use(require('body-parser').urlencoded({ extended: false, limit: '1mb' }));
webServer.set('view engine', 'ejs');
webServer.use('/static', express.static('static'));

webServer.use(function(req, res, next) {
    helpers.log(helpers.logLevel.DEBUG, `[HTTP] Request form ${req.ip} at ${req.path}`);

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
    helpers.log(helpers.logLevel.INFO, `TextStash Web server listening on port ${config.http_port}`);
});