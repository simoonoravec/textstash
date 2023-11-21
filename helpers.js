const config = require('./config');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const logLevel = {
    DEBUG: 'DEBUG',
    INFO: 'INFO',
    NOTICE: 'NOTICE',
    WARNING: 'WARNING',
    ERROR: 'ERROR'
}

/**
 * 
 * @param {int} type Log level
 * @param {*} message Log message
 * @returns 
 */
function log(type, message) {
    if (type == logLevel.DEBUG && process.env.NODE_ENV != 'development') {
        return;
    }

    if (!type in logLevel) {
        return;
    }

    const time = new Date().toLocaleTimeString('eu');
    
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
            log(logLevel, 'Data directory doesn\'t exist, creating it.')
            fs.mkdirSync(data_dir);
        } else {
            if (!fs.statSync(data_dir).isDirectory()) {
                log(logLevel, 'Data directory is not a directory, recreating.')
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

/**
 * Encrypt text
 * @param {string} text Input
 * @param {string} key Key (password)
 * @returns JSON
 */
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

/**
 * Decrypt text
 * @param {string} encrypted Encrypted text (hex)
 * @param {string} iv Initialization vector
 * @param {string} key Key (password)
 * @returns String
 */
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

/**
 * Delete files older than N hours in the data directory
 * @param {int} expiry Expiry (hours)
 */
function deleteExpiredFiles(expiry) {
    fs.readdir(config.data_dir, (err, files) => {
        if (err) {
            log(logLevel.NOTICE, '[CLEANER] Failed to read data directory.');
            return;
        }

        const olderThanLimit = new Date(new Date() - expiry * 60 * 60 * 1000);

        files.forEach((file) => {
            const filePath = path.join(config.data_dir, file);
            
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    log(logLevel.NOTICE, '[CLEANER] Error reading file: '+file);
                    return;
                }

                if (stats.mtime < olderThanLimit) {
                    fs.unlink(filePath, (err) => {
                        if (err) {
                            log(logLevel.NOTICE, '[CLEANER] Error deleting file: '+file);
                            return;
                        }
                        log(logLevel.DEBUG, '[CLEANER] Deleted expired file: '+file);
                    });
                }
            });
        });
    });
}

module.exports = { logLevel, log, initializeDataDir, encrypt, decrypt, deleteExpiredFiles };