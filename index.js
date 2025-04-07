/**
 * AetherDrive - A Node.js framework for decentralized file storage,
 * retrieval, encryption, and management.
 *
 * @version 0.1.0
 */

const Storage = require('./lib/storage');
const Encryption = require('./lib/encryption');
const FileManager = require('./lib/fileManager');

/**
 * AetherDrive main class that exposes all the functionality of the framework.
 */
class AetherDrive {
  /**
   * Creates a new instance of AetherDrive
   * @param {Object} options - Configuration options
   * @param {string} options.storageType - The type of storage to use (e.g., 'ipfs')
   * @param {Object} options.storageConfig - Configuration for the storage provider
   */
  constructor(options = {}) {
    const {
      storageType = 'ipfs',
      storageConfig = {}
    } = options;

    this.storage = new Storage(storageType, storageConfig);
    this.encryption = new Encryption();
    this.fileManager = new FileManager(this.storage);
  }

  /**
   * Upload a file to the storage provider
   * @param {string} filePath - Path to the file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Returns the file ID
   */
  async uploadFile(filePath, options = {}) {
    return this.fileManager.uploadFile(filePath, options);
  }

  /**
   * Download a file from the storage provider
   * @param {string} fileId - ID of the file to download
   * @param {string} destination - Path where the file should be saved
   * @param {Object} options - Download options
   * @returns {Promise<string>} - Returns the path to the downloaded file
   */
  async downloadFile(fileId, destination, options = {}) {
    return this.fileManager.downloadFile(fileId, destination, options);
  }

  /**
   * Encrypt a file
   * @param {string} filePath - Path to the file to encrypt
   * @param {string} encryptionKey - Key used for encryption
   * @param {Object} options - Encryption options
   * @returns {Promise<string>} - Returns the path to the encrypted file
   */
  async encryptFile(filePath, encryptionKey, options = {}) {
    return this.encryption.encryptFile(filePath, encryptionKey, options);
  }

  /**
   * Decrypt a file
   * @param {string} filePath - Path to the encrypted file
   * @param {string} encryptionKey - Key used for decryption
   * @param {Object} options - Decryption options
   * @returns {Promise<string>} - Returns the path to the decrypted file
   */
  async decryptFile(filePath, encryptionKey, options = {}) {
    return this.encryption.decryptFile(filePath, encryptionKey, options);
  }

  /**
   * Delete a file from the storage provider
   * @param {string} fileId - ID of the file to delete
   * @param {Object} options - Deletion options
   * @returns {Promise<boolean>} - Returns true if deletion was successful
   */
  async deleteFile(fileId, options = {}) {
    return this.fileManager.deleteFile(fileId, options);
  }

  /**
   * List all files in the storage provider
   * @param {Object} options - List options
   * @returns {Promise<Array>} - Returns an array of file objects
   */
  async listFiles(options = {}) {
    return this.fileManager.listFiles(options);
  }
}

module.exports = AetherDrive;
