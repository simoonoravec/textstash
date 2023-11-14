const config = require('./config');
const crypto = require('crypto');
const fs = require('fs');

/**
 * Create new paste
 * @param {string} text Paste text
 * @returns Promise
 */
function createPaste(text) {
    return new Promise((resolve, reject) => {
        if (text.length == 0) {
            reject();
        }

        let id;
        do {
            id = crypto.randomBytes(4).toString('hex');
        } while (fs.existsSync(config.data_dir + `/${id}`));

        
        try {
            fs.writeFile(config.data_dir + `/${id}`, text, 'utf8', function() {
                resolve(id);
            });
        } catch(err) {
            console.error(err);
            reject();
        }
    });
}

/**
 * Read existing paste
 * @param {string} id Paste ID
 * @returns string | false
 */
function getPaste(id) {
    if (!(/^[a-zA-Z0-9]+$/).test(id)) {
        return false;
    }

    if (!fs.existsSync(config.data_dir + `/${id}`)) {
        return false;
    }

    return fs.readFileSync(config.data_dir + `/${id}`, 'utf8');
}

module.exports = { createPaste, getPaste };