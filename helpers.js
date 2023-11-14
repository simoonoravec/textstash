const config = require("./config");

const logType = {
    INFO: "INFO",
    NOTICE: "NOTICE",
    WARNING: "WARNING",
    ERROR: "ERROR"
}

/**
 * 
 * @param {int} level Log level (1 = Production, 2 = Debug)
 * @param {int} type Log type (defined in helpers.js)
 * @param {*} message Log message
 * @returns 
 */
function log(level, type, message) {
    if (level > config.log_level) {
        return;
    }

    if (!type in logType) {
        return;
    }

    const time = new Date().toLocaleTimeString("eu");
    
    console.log(`[${time}][${type}]: ${message}`);
}

module.exports = { logType, log };