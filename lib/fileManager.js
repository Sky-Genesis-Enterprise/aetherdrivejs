/**
 * FileManager module for AetherDrive
 * Coordinates file operations between storage and encryption
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

/**
 * FileManager class for handling file operations
 */
class FileManager {
  /**
   * Create a new FileManager instance
   * @param {Object} storage - Storage provider instance
   */
  constructor(storage) {
    this.storage = storage;
    this.fileRegistry = new Map(); // In-memory file registry

    // Create a temporary directory for file operations
    this.tempDir = path.join(os.tmpdir(), 'aetherdrive-tmp');
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Generate a unique file ID
   * @returns {string} - A unique file ID
   */
  generateFileId() {
    return uuidv4();
  }

  /**
   * Upload a file to the storage provider
   * @param {string} filePath - Path to the file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Returns the file ID
   */
  async uploadFile(filePath, options = {}) {
    try {
      // Check if file exists
      await fs.access(filePath);

      // Upload file to storage provider
      const storageId = await this.storage.uploadFile(filePath, options);

      // Generate a unique file ID for the file
      const fileId = options.fileId || this.generateFileId();

      // Get file metadata
      const stats = await fs.stat(filePath);

      // Store file information in registry
      this.fileRegistry.set(fileId, {
        id: fileId,
        storageId,
        name: path.basename(filePath),
        size: stats.size,
        contentType: options.contentType || 'application/octet-stream',
        createdAt: new Date(),
        encrypted: options.encrypted || false
      });

      return fileId;
    } catch (error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
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
      // Get file information from registry
      const fileInfo = this.fileRegistry.get(fileId);

      if (!fileInfo) {
        // If the file is not in our registry, use the fileId directly as the storage ID
        return await this.storage.downloadFile(fileId, destination, options);
      }

      // Download file from storage provider using the storage ID
      return await this.storage.downloadFile(fileInfo.storageId, destination, options);
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from the storage provider
   * @param {string} fileId - ID of the file to delete
   * @param {Object} options - Deletion options
   * @returns {Promise<boolean>} - Returns true if deletion was successful
   */
  async deleteFile(fileId, options = {}) {
    try {
      // Get file information from registry
      const fileInfo = this.fileRegistry.get(fileId);

      if (!fileInfo) {
        // If the file is not in our registry, use the fileId directly as the storage ID
        return await this.storage.deleteFile(fileId, options);
      }

      // Delete file from storage provider using the storage ID
      const result = await this.storage.deleteFile(fileInfo.storageId, options);

      // Remove file from registry
      this.fileRegistry.delete(fileId);

      return result;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List all files in the registry
   * @param {Object} options - List options
   * @returns {Promise<Array>} - Returns an array of file objects
   */
  async listFiles(options = {}) {
    try {
      // Convert registry Map to array
      const files = Array.from(this.fileRegistry.values());

      return files;
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }

  /**
   * Get temporary file path for operations
   * @param {string} prefix - Prefix for the temporary file
   * @returns {string} - Returns a path to a temporary file
   */
  getTempFilePath(prefix = 'file') {
    return path.join(this.tempDir, `${prefix}-${this.generateFileId()}`);
  }
}

module.exports = FileManager;
