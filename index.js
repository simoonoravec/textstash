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
 * Initialize app
 */
helpers.log(helpers.logLevel.INFO, `Initializing Web server (Express)`);
const express = require('express');
const app = express();

app.use(require('body-parser').urlencoded({ extended: false, limit: '1mb' }));
app.set('view engine', 'ejs');
app.use(express.static('static'));

app.use(function(req, res, next) {
    helpers.log(helpers.logLevel.DEBUG, `[HTTP] Request form ${req.ip} at ${req.path}`);

    next();
});

app.use("/", require("./routes/main"));
app.use("/api", require("./routes/api"));

/* Catch all API URLs and show 404 */
app.all('/api/*', (req, res) => {
    res.json({code: 404, error: "API not found or invalid method."});
});

/* Catch all URLs and redirect to homepage */
app.all('*', (req, res) => {
    res.redirect("/");
});

app.listen(config.http_port, () => {
    helpers.log(helpers.logLevel.INFO, `TextStash Web server listening on port ${config.http_port}`);
});