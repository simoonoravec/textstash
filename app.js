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

module.exports = { createPaste, getPaste, getPasteEncrypted, pasteExists, pasteExistsEncrypted };