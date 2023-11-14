const config = require("./config");
const fs = require('fs');

const logLevel = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    NOTICE: "NOTICE",
    WARNING: "WARNING",
    ERROR: "ERROR"
}

/**
 * 
 * @param {int} level Log level (1 = Production, 2 = Debug)
 * @param {int} type Log type (defined in js)
 * @param {*} message Log message
 * @returns 
 */
function log(type, message) {
    if (type == logLevel.DEBUG && config.log_level != 2) {
        return;
    }

    if (!type in logLevel) {
        return;
    }

    const time = new Date().toLocaleTimeString("eu");
    
    console.log(`[${time}][${type}]: ${message}`);
}

/**
 * Check if data directory exists, create it otherwise.
 * Exit app if directory can't be created.
 * @param {int} logLevel 
 * @returns void | false
 */
function initializeDataDir(logLevel) {
    try {
        if (!fs.existsSync(data_dir)) {
            log(logLevel, "Data directory doesn't exist, creating it.")
            fs.mkdirSync(data_dir);
        } else {
            if (!fs.statSync(data_dir).isDirectory()) {
                log(logLevel, "Data directory is not a directory, recreating.")
                fs.unlink(data_dir, () => {
                    fs.mkdirSync(data_dir);
                });
            } else {
                log(logLevel, `Data directory found.`);
            }
        }
        return true;
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

module.exports = { logLevel, log, initializeDataDir };