const config = require('./config');
const helpers = require('./helpers');
const crypto = require('crypto');
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

        if (helpers.initializeDataDir(helpers.logLevel.DEBUG) == false) {
            reject();
        }

        let id = crypto.randomBytes(config.id_bytes).toString('hex');

        helpers.log(helpers.logLevel.DEBUG, `Writing file ${id}`);
        try {
            fs.writeFile(config.data_dir + `/${id}`, text, 'utf8', function() {
                helpers.log(helpers.logLevel.DEBUG, `Written file ${id}`);
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

        if (helpers.initializeDataDir(helpers.logLevel.DEBUG) == false) {
            reject();
        }

        let id = crypto.randomBytes(config.id_bytes).toString('hex');

        const encrypted = helpers.encrypt(text, password);
        text = `${encrypted.iv}:${encrypted.data}`;

        helpers.log(helpers.logLevel.DEBUG, `Writing file ${id}`);
        try {
            fs.writeFile(config.data_dir + `/${id}.enc`, text, 'utf8', function() {
                helpers.log(helpers.logLevel.DEBUG, `Written file ${id}`);
                resolve(id);
            });
        } catch(err) {
            console.error(err);
            reject();
        }
    });
}

function pasteExists(id) {
    if (!(/^[a-zA-Z0-9]+$/).test(id)) {
        return false;
    }

    return fs.existsSync(config.data_dir + `/${id}`) || fs.existsSync(config.data_dir + `/${id}.enc`);
}

function pasteExistsEncrypted(id) {
    if (!(/^[a-zA-Z0-9]+$/).test(id)) {
        return false;
    }

    return fs.existsSync(config.data_dir + `/${id}.enc`);
}

/**
 * Read uncencrypted paste
 * @param {string} id Paste ID
 * @returns string | false
 */
function getPaste(id) {
    if (!(/^[a-zA-Z0-9]+$/).test(id)) {
        return false;
    }

    if (helpers.initializeDataDir(helpers.logLevel.DEBUG) == false) {
        return false;
    }

    helpers.log(helpers.logLevel.DEBUG, `Reading file ${id}`);
    if (!fs.existsSync(config.data_dir + `/${id}`)) {
        helpers.log(helpers.logLevel.DEBUG, `Failed reading file ${id} - Not found`);
        return false;
    }

    helpers.log(helpers.logLevel.DEBUG, `Read file ${id} OK`);
    return fs.readFileSync(config.data_dir + `/${id}`, 'utf8');
}

/**
 * Read encrypted paste
 * @param {string} id Paste ID
 * @param {string} password Password
 * @returns string | false
 */
function getPasteEncrypted(id, password) {
    if (!(/^[a-zA-Z0-9]+$/).test(id)) {
        return false;
    }

    if (helpers.initializeDataDir(helpers.logLevel.DEBUG) == false) {
        return false;
    }

    helpers.log(helpers.logLevel.DEBUG, `Reading file ${id}`);
    if (!fs.existsSync(config.data_dir + `/${id}.enc`)) {
        helpers.log(helpers.logLevel.DEBUG, `Failed reading file ${id} - Not found`);
        return false;
    }

    helpers.log(helpers.logLevel.DEBUG, `Read file ${id} OK`);
    
    const raw = fs.readFileSync(config.data_dir + `/${id}.enc`, 'utf8').split(':');
    const decrypted = helpers.decrypt(raw[1], raw[0], password);

    if (decrypted == false) {
        return false;
    }
    
    return decrypted;
}

/**
 * Get human readable time until the deletion of a paste
 * @param {int} id Paste ID
 * @returns String
 */
function getTimeUntilDeletion(id) {
    if (config.delete_after < 1) {
        return false;
    }

    let path;
    if (fs.existsSync(config.data_dir + `/${id}`)) {
        path = config.data_dir + `/${id}`;
    }
    else if (fs.existsSync(config.data_dir + `/${id}.enc`)) {
        path = config.data_dir + `/${id}.enc`;
    } else {
        return false;
    }

    try {
        let diffMinutes = config.delete_after * 60 - (new Date() - fs.statSync(path).mtime) / (1000 * 60);

        if (diffMinutes < 1) {
            return "<1 minute";
        }

        diffMinutes = Math.round(diffMinutes);
        if (diffMinutes < 60) {
            return diffMinutes + " minute" + (diffMinutes > 1 ? 's' : '');
        }

        let diffHours = Math.round(diffMinutes / 60);
        if (diffHours < 24) {
            return diffHours + " hour" + (diffHours > 1 ? 's' : '');
        }

        let diffDays = Math.round(diffHours / 24);
        return diffDays + " day" + (diffDays > 1 ? 's' : '');
    } catch {
        return false;
    }
}

module.exports = { createPaste, getPaste, getPasteEncrypted, pasteExists, pasteExistsEncrypted, getTimeUntilDeletion };