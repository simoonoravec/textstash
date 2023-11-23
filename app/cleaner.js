const config = require('../config');
const { log, logLevel } = require('./logger');
const fs = require('fs');
const path = require('path');

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

module.exports = { deleteExpiredFiles };