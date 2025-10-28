const CryptoJS = require('crypto-js');
require('dotenv').config();

// Use encryption key from environment or a default (CHANGE IN PRODUCTION!)
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-encryption-key-change-this-in-production';

/**
 * Encrypt sensitive data
 * @param {string} text - Plain text to encrypt
 * @returns {string} - Encrypted text
 */
function encrypt(text) {
  if (!text) return '';
  return CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
}

/**
 * Decrypt encrypted data
 * @param {string} encryptedText - Encrypted text
 * @returns {string} - Decrypted plain text
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption error:', error.message);
    return '[Decryption Failed]';
  }
}

module.exports = { encrypt, decrypt };
