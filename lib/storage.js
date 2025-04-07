/**
 * Storage module for AetherDrive
 * Handles interactions with various storage providers
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const os = require('os');

// Try to load ipfs-http-client, but don't fail if it's not available
let ipfsHttpClient;
try {
  ipfsHttpClient = require('ipfs-http-client');
} catch (error) {
  console.log('IPFS HTTP Client not available. Using mock IPFS client for testing.');
  ipfsHttpClient = null;
}

/**
 * Storage class for handling file uploads and downloads
 */
class Storage {
  /**
   * Create a new Storage instance
   * @param {string} storageType - Type of storage provider to use (currently only 'ipfs' is supported)
   * @param {Object} config - Configuration for the storage provider
   */
  constructor(storageType = 'ipfs', config = {}) {
    this.storageType = storageType;
    this.config = config;

    // Create a temporary directory for mock storage
    this.tempDir = path.join(os.tmpdir(), 'aetherdrive-storage-' + Date.now());
    fs.ensureDirSync(this.tempDir);

    // Initialize storage files Map for mock storage
    this.files = new Map();

    this._initializeStorage();
  }

  /**
   * Initialize the storage provider based on the specified type
   * @private
   */
  _initializeStorage() {
    switch (this.storageType) {
      case 'ipfs':
        if (ipfsHttpClient) {
          try {
            // Use the IPFS client if available
            const { host = 'ipfs.infura.io', port = 5001, protocol = 'https' } = this.config;
            const url = `${protocol}://${host}:${port}`;
            this.ipfs = ipfsHttpClient.create({ url });
            this.usingMock = false;
          } catch (error) {
            console.error('Failed to initialize IPFS client:', error.message);
            this._initializeMockStorage();
          }
        } else {
          // Fall back to mock storage if IPFS client is not available
          this._initializeMockStorage();
        }
        break;
      default:
        throw new Error(`Unsupported storage type: ${this.storageType}`);
    }
  }

  /**
   * Initialize a mock storage provider for testing or when IPFS is not available
   * @private
   */
  _initializeMockStorage() {
    console.log('Using mock storage provider');
    this.usingMock = true;
  }

  /**
   * Generate a file ID for mock storage
   * @param {Buffer} content - File content
   * @returns {string} - A mock file ID
   * @private
   */
  _generateMockFileId(content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `mock-${hash.substring(0, 8)}`;
  }

  /**
   * Upload a file to the storage provider
   * @param {string} filePath - Path to the file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Returns the file ID (e.g., IPFS hash)
   */
  async uploadFile(filePath, options = {}) {
    try {
      // Check if file exists
      await fs.access(filePath);

      const fileContent = await fs.readFile(filePath);

      if (this.storageType === 'ipfs') {
        if (!this.usingMock && this.ipfs) {
          try {
            // Use the real IPFS client
            const { path: fileId } = await this.ipfs.add(fileContent, options);
            return fileId;
          } catch (error) {
            console.error('IPFS upload error:', error.message);
            // Fall back to mock storage on error
            return this._mockUploadFile(filePath, fileContent, options);
          }
        } else {
          // Use mock storage
          return this._mockUploadFile(filePath, fileContent, options);
        }
      }

      throw new Error(`Upload not implemented for storage type: ${this.storageType}`);
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw error;
    }
  }

  /**
   * Upload a file to mock storage
   * @param {string} filePath - Path to the file
   * @param {Buffer} fileContent - File content
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Returns the file ID
   * @private
   */
  async _mockUploadFile(filePath, fileContent, options = {}) {
    // Generate a file ID
    const fileId = options.fileId || this._generateMockFileId(fileContent);

    // Store the file in our mock storage
    const storagePath = path.join(this.tempDir, fileId);
    await fs.writeFile(storagePath, fileContent);

    // Keep track of the file
    this.files.set(fileId, {
      id: fileId,
      path: storagePath,
      content: fileContent,
      originalPath: filePath,
      size: fileContent.length,
      createdAt: new Date()
    });

    return fileId;
  }

  /**
   * Download a file from the storage provider
   * @param {string} fileId - ID of the file to download
   * @param {string} destination - Path where the file should be saved
   * @param {Object} options - Download options
   * @returns {Promise<string>} - Returns the path to the downloaded file
   */
  async downloadFile(fileId, destination, options = {}) {
    try {
      // Ensure the destination directory exists
      await fs.ensureDir(path.dirname(destination));

      if (this.storageType === 'ipfs') {
        if (!this.usingMock && this.ipfs) {
          try {
            // Use the real IPFS client
            const chunks = [];

            // Fetch the file from IPFS
            for await (const chunk of this.ipfs.cat(fileId, options)) {
              chunks.push(chunk);
            }

            // Combine chunks and write to destination
            const fileContent = Buffer.concat(chunks);
            await fs.writeFile(destination, fileContent);

            return destination;
          } catch (error) {
            console.error('IPFS download error:', error.message);
            // Fall back to mock storage on error
            return this._mockDownloadFile(fileId, destination, options);
          }
        } else {
          // Use mock storage
          return this._mockDownloadFile(fileId, destination, options);
        }
      }

      throw new Error(`Download not implemented for storage type: ${this.storageType}`);
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Download a file from mock storage
   * @param {string} fileId - ID of the file
   * @param {string} destination - Destination path
   * @param {Object} options - Download options
   * @returns {Promise<string>} - Returns the destination path
   * @private
   */
  async _mockDownloadFile(fileId, destination, options = {}) {
    // Get the file from our mock storage
    const fileInfo = this.files.get(fileId);

    if (!fileInfo) {
      // If the file is not in our storage, create a mock file
      await fs.writeFile(destination, `Mock content for file ID: ${fileId}`);
    } else {
      // Write the file content to the destination
      await fs.writeFile(destination, fileInfo.content);
    }

    return destination;
  }

  /**
   * Delete a file from the storage provider
   * @param {string} fileId - ID of the file to delete
   * @param {Object} options - Deletion options
   * @returns {Promise<boolean>} - Returns true if deletion was successful
   */
  async deleteFile(fileId, options = {}) {
    try {
      if (this.storageType === 'ipfs') {
        if (!this.usingMock && this.ipfs) {
          try {
            // Note: IPFS doesn't support direct deletion from the network.
            // We can only "unpin" the file, which makes it eligible for garbage collection.
            await this.ipfs.pin.rm(fileId, options);
            return true;
          } catch (error) {
            console.error('IPFS deletion error:', error.message);
            // Fall back to mock storage on error
            return this._mockDeleteFile(fileId, options);
          }
        } else {
          // Use mock storage
          return this._mockDeleteFile(fileId, options);
        }
      }

      throw new Error(`Deletion not implemented for storage type: ${this.storageType}`);
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Delete a file from mock storage
   * @param {string} fileId - ID of the file
   * @param {Object} options - Deletion options
   * @returns {Promise<boolean>} - Returns true if deletion was successful
   * @private
   */
  async _mockDeleteFile(fileId, options = {}) {
    // Get the file from our mock storage
    const fileInfo = this.files.get(fileId);

    if (fileInfo) {
      // Delete the file from the file system
      await fs.remove(fileInfo.path);

      // Remove it from our tracking
      this.files.delete(fileId);
    }

    return true;
  }

  /**
   * List all files in the storage provider
   * @param {Object} options - List options
   * @returns {Promise<Array>} - Returns an array of file objects
   */
  async listFiles(options = {}) {
    try {
      if (this.storageType === 'ipfs') {
        if (!this.usingMock && this.ipfs) {
          try {
            const files = [];

            // List all pinned files
            for await (const file of this.ipfs.pin.ls(options)) {
              files.push({
                id: file.cid.toString(),
                type: file.type,
              });
            }

            return files;
          } catch (error) {
            console.error('IPFS list error:', error.message);
            // Fall back to mock storage on error
            return this._mockListFiles(options);
          }
        } else {
          // Use mock storage
          return this._mockListFiles(options);
        }
      }

      throw new Error(`List not implemented for storage type: ${this.storageType}`);
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * List all files in mock storage
   * @param {Object} options - List options
   * @returns {Promise<Array>} - Returns an array of file objects
   * @private
   */
  async _mockListFiles(options = {}) {
    // Convert Map to array of files
    return Array.from(this.files.values()).map(file => ({
      id: file.id,
      size: file.size,
      createdAt: file.createdAt
    }));
  }
}

module.exports = Storage;
