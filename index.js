const config = require('./config');
const helpers = require('./helpers');

const fs = require('fs');

const data_dir = config.data_dir;
global.data_dir = data_dir;

/**
 * Check if data directory exists, create it otherwise.
 * Exit app if directory can't be created.
 */
try {
    if (!fs.existsSync(data_dir)) {
        helpers.log(1, helpers.logType.INFO, "Data directory doesn't exist, creating it...")
        fs.mkdirSync(data_dir);
    } else {
        if (!fs.statSync(data_dir).isDirectory()) {
            helpers.log(1, helpers.logType.WARNING, "Data directory is not a directory, recreating...")
            fs.unlink(data_dir, () => {
                fs.mkdirSync(data_dir);
            });
        }
    }
} catch (err) {
    console.error(err);
    process.exit(1);
}

/**
 * Initialize app
 */
const express = require('express');
const app = express();

app.use(require('body-parser').urlencoded({ extended: false }));
app.set('view engine', 'ejs');
app.use(express.static('static'));

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
  console.log(`Example app listening on port ${config.http_port}`);
});