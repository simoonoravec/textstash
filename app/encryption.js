const crypto = require('crypto');

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

module.exports = { encrypt, decrypt };