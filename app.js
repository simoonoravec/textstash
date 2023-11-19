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

/**
 * Get a paste
 * @param {*} id Paste ID
 * @param {*} password Password (optional)
 * @returns JSON {found: true|false, encrypted: true|false, data: pasteData}
 */
function getPaste(id, password = null) {
    if (!(/^[a-zA-Z0-9]+$/).test(id)) {
        return {
            found: false
        }
    }

    if (helpers.initializeDataDir(helpers.logLevel.DEBUG) == false) {
        return false;
    }

    const pasteExists = fs.existsSync(config.data_dir + `/${id}`);
    const pasteExistsEncrypted = fs.existsSync(config.data_dir + `/${id}.enc`);

    if (pasteExists) {
        return {
            found: true,
            encrypted: false,
            data: _getPaste(id)
        }
    }
    if (pasteExistsEncrypted) {
        if (password == null || password.length == 0) {
            return {
                found: true,
                encrypted: true,
                data: false
            }
        }

        return {
            found: true,
            encrypted: true,
            data: _getPasteEncrypted(id, password)
        }
    }

    return {
        found: false
    }
}

/**
 * Read uncencrypted paste
 * @param {string} id Paste ID
 * @returns string | false
 */
function _getPaste(id) {
    helpers.log(helpers.logLevel.DEBUG, `Reading file ${id}`);

    try {
        const data = fs.readFileSync(config.data_dir + `/${id}`, 'utf8');
        helpers.log(helpers.logLevel.DEBUG, `Read file ${id} OK`);
        return data;
    } catch(err) {
        helpers.log(helpers.logLevel.DEBUG, `Error reading file ${id}`);
        console.error(err);
        return false;
    }
}

/**
 * Read encrypted paste
 * @param {string} id Paste ID
 * @param {string} password Password
 * @returns string | false
 */
function _getPasteEncrypted(id, password) {
    helpers.log(helpers.logLevel.DEBUG, `Reading file ${id}`);

    try {
        const raw = fs.readFileSync(config.data_dir + `/${id}.enc`, 'utf8').split(':');
        helpers.log(helpers.logLevel.DEBUG, `Read file ${id} OK`);

        const decrypted = helpers.decrypt(raw[1], raw[0], password);
    
        if (decrypted == false) {
            return false;
        }
        
        return decrypted;
    } catch(err) {
        helpers.log(helpers.logLevel.DEBUG, `Error reading file ${id}`);
        console.error(err);
        return false;
    }
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

module.exports = { createPaste, getPaste, getTimeUntilDeletion };