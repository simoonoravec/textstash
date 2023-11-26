const config = require('../config');
const { log, logLevel } = require('./logger');
const encryption = require('./encryption');
const utils = require('./utils');

const fs = require('fs');

/**
 * Create new paste
 * @param {*} text Paste text
 * @param {*} password Password (optional)
 * @returns Promise
 */
function createPaste(text, password = null) {
    if (password && password.length > 0) {
        return _createPasteEncrypted(text, password);
    }

    return _createPaste(text);
}

/**
 * Create new unencrypted paste
 * @param {string} text Paste text
 * @returns Promise
 */
function _createPaste(text) {
    return new Promise((resolve, reject) => {
        if (text.length == 0) {
            reject();
        }

        if (utils.initializeDataDir(logLevel.DEBUG) == false) {
            reject();
        }

        let id = utils.generateID();

        const fileData = JSON.stringify({
            "encrypted": false,
            "time_created": Date.now(),
            "data": text
        });

        log(logLevel.DEBUG, `Writing file ${id}.json`);
        try {
            fs.writeFile(config.data_dir + `/${id}.json`, fileData, 'utf8', function() {
                log(logLevel.DEBUG, `Written file ${id}.json`);
                resolve(id);
            });
        } catch(err) {
            console.error(err);
            reject();
        }
    });
}

/**
 * Create new encrypted paste
 * @param {string} text Paste text
 * @param {string} password Password
 * @returns Promise
 */
function _createPasteEncrypted(text, password) {
    return new Promise((resolve, reject) => {
        if (text.length == 0 || password.length == 0) {
            reject();
        }

        if (utils.initializeDataDir(logLevel.DEBUG) == false) {
            reject();
        }

        let id = utils.generateID();

        const encrypted = encryption.encrypt(text, password);
        text = `${encrypted.iv}:${encrypted.data}`;

        const fileData = JSON.stringify({
            "encrypted": true,
            "time_created": Date.now(),
            "data": text
        });

        log(logLevel.DEBUG, `Writing file ${id}.json`);
        try {
            fs.writeFile(config.data_dir + `/${id}.json`, fileData, 'utf8', function() {
                log(logLevel.DEBUG, `Written file ${id}.json`);
                resolve(id);
            });
        } catch(err) {
            console.error(err);
            reject();
        }
    });
}

/**
 * Get a paste
 * @param {*} id Paste ID
 * @param {*} password Password (optional)
 * @returns JSON {found: true|false, encrypted: true|false, data: pasteData}
 */
function getPaste(id, password = null) {
    if (!(/^[a-zA-Z0-9-]+$/).test(id)) {
        return {
            found: false
        }
    }

    if (utils.initializeDataDir(logLevel.DEBUG) == false) {
        return false;
    }

    if (fs.existsSync(config.data_dir + `/${id}.json`)) {
        let paste;
        try {
            paste = JSON.parse(fs.readFileSync(config.data_dir + `/${id}.json`));
        } catch (e) {
            return {
                found: false
            }
        }

        if (paste.encrypted) {
            if (password == null || password.length == 0) {
                return {
                    found: true,
                    encrypted: true,
                    data: false
                }
            }

            const raw = paste.data.split(':');
            const decrypted = encryption.decrypt(raw[1], raw[0], password);

            return {
                found: true,
                encrypted: true,
                time_d: _getTimeUntilDeletion(paste.time_created),
                data: decrypted
            }
        }

        return {
            found: true,
            encrypted: false,
            time_d: _getTimeUntilDeletion(paste.time_created),
            data: paste.data
        }
    }

    return {
        found: false
    }
}

/**
 * Get human readable time until the deletion of a paste
 * @param {bigint} time_created Time when the paste was created in milliseconds
 * @returns String
 */
function _getTimeUntilDeletion(time_created) {
    if (config.delete_after < 1) {
        return false;
    }

    try {
        let diffMinutes = config.delete_after * 60 - (new Date() - time_created) / (1000 * 60);

        if (diffMinutes < 1) {
            return '<1 minute';
        }

        diffMinutes = Math.round(diffMinutes);
        if (diffMinutes < 60) {
            return diffMinutes + ' minute' + (diffMinutes > 1 ? 's' : '');
        }

        let diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) {
            return diffHours + ' hour' + (diffHours > 1 ? 's' : '');
        }

        let diffDays = Math.round(diffHours / 24);
        return diffDays + ' day' + (diffDays > 1 ? 's' : '');
    } catch {
        return false;
    }
}

module.exports = { createPaste, getPaste };