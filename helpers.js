const config = require("./config");
const fs = require('fs');
const crypto = require('crypto');

const logLevel = {
    DEBUG: "DEBUG",
    INFO: "INFO",
    NOTICE: "NOTICE",
    WARNING: "WARNING",
    ERROR: "ERROR"
}

/**
 * 
 * @param {int} type Log level
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

function encrypt(text, key) {
    key = crypto.createHash('sha256').update(key).digest();

    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        data: encrypted.toString('hex')
    };
}

function decrypt(encrypted, iv, key) {
    key = crypto.createHash('sha256').update(key).digest();

    try {
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(key), Buffer.from(iv, 'hex'));
        let decrypted = decipher.update(Buffer.from(encrypted, 'hex'));
        decrypted = Buffer.concat([decrypted, decipher.final()]);
        return decrypted.toString()
    } catch(e) {
        return false;
    }
}

module.exports = { logLevel, log, initializeDataDir, encrypt, decrypt };