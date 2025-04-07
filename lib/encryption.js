/**
 * Encryption module for AetherDrive
 * Handles file encryption and decryption using Node.js crypto module
 */

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');

/**
 * Algorithm to use for encryption/decryption
 * AES-256-CBC is chosen for its security and wide support
 */
const ALGORITHM = 'aes-256-cbc';

/**
 * Encryption class for handling file encryption and decryption
 */
class Encryption {
  /**
   * Create a new Encryption instance
   */
  constructor() {
    // No initialization needed for now
  }

  /**
   * Generate a secure encryption key from a password
   * @param {string} password - Password to derive key from
   * @param {Buffer} salt - Salt for key derivation (will be generated if not provided)
   * @returns {Object} - Object containing the key and salt
   */
  generateKey(password, salt = null) {
    // Generate a random salt if none provided
    const useSalt = salt || crypto.randomBytes(16);

    // Derive a key using PBKDF2
    const key = crypto.pbkdf2Sync(password, useSalt, 100000, 32, 'sha256');

    return {
      key,
      salt: useSalt
    };
  }

  /**
   * Encrypt a file
   * @param {string} filePath - Path to the file to encrypt
   * @param {string} encryptionKey - Key used for encryption
   * @param {Object} options - Encryption options
   * @param {string} options.outputPath - Path where the encrypted file should be saved
   * @returns {Promise<string>} - Returns the path to the encrypted file
   */
  async encryptFile(filePath, encryptionKey, options = {}) {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Generate output path if not provided
      const outputPath = options.outputPath || `${filePath}.enc`;

      // Ensure the output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Generate a random IV
      const iv = crypto.randomBytes(16);

      // Create a key from the provided encryption key
      const { key, salt } = this.generateKey(encryptionKey);

      // Create cipher
      const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

      // Read the input file
      const fileContent = await fs.readFile(filePath);

      // Encrypt the file content
      const encryptedData = Buffer.concat([
        salt,            // Store the salt at the beginning of the encrypted file
        iv,              // Store the IV next
        cipher.update(fileContent),
        cipher.final()
      ]);

      // Write the encrypted data to the output file
      await fs.writeFile(outputPath, encryptedData);

      return outputPath;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to encrypt file: ${error.message}`);
    }
  }

  /**
   * Decrypt a file
   * @param {string} filePath - Path to the encrypted file
   * @param {string} encryptionKey - Key used for decryption
   * @param {Object} options - Decryption options
   * @param {string} options.outputPath - Path where the decrypted file should be saved
   * @returns {Promise<string>} - Returns the path to the decrypted file
   */
  async decryptFile(filePath, encryptionKey, options = {}) {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Generate output path if not provided
      const outputPath = options.outputPath || filePath.replace(/\.enc$/, '.dec');

      // Ensure the output directory exists
      await fs.ensureDir(path.dirname(outputPath));

      // Read the encrypted file
      const encryptedData = await fs.readFile(filePath);

      // Extract the salt from the beginning of the file (first 16 bytes)
      const salt = encryptedData.slice(0, 16);

      // Extract the IV (next 16 bytes)
      const iv = encryptedData.slice(16, 32);

      // Extract the encrypted content (the rest of the file)
      const encryptedContent = encryptedData.slice(32);

      // Create a key using the provided password and extracted salt
      const { key } = this.generateKey(encryptionKey, salt);

      // Create decipher
      const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

      try {
        // Decrypt the file content
        const decryptedData = Buffer.concat([
          decipher.update(encryptedContent),
          decipher.final()
        ]);

        // Write the decrypted data to the output file
        await fs.writeFile(outputPath, decryptedData);

        return outputPath;
      } catch (cryptoError) {
        throw new Error(`Decryption failed, possibly due to incorrect password: ${cryptoError.message}`);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to decrypt file: ${error.message}`);
    }
  }
}

module.exports = Encryption;
