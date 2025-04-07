/**
 * Mock Storage module for testing
 */

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

/**
 * MockStorage class implementing the same interface as the Storage class
 */
class MockStorage {
  /**
   * Create a new MockStorage instance
   */
  constructor() {
    this.files = new Map();
    this.tempDir = path.join(os.tmpdir(), 'aetherdrive-mock-storage-' + Date.now());
    fs.ensureDirSync(this.tempDir);
  }

  /**
   * Generate a mock file ID
   * @param {string} content - File content
   * @returns {string} - A mock file ID
   */
  generateFileId(content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `mock-${hash.substring(0, 8)}`;
  }

  /**
   * Upload a file to the mock storage
   * @param {string} filePath - Path to the file to upload
   * @param {Object} options - Upload options
   * @returns {Promise<string>} - Returns the file ID
   */
  async uploadFile(filePath, options = {}) {
    try {
      // Check if file exists
      await fs.access(filePath);

      const fileContent = await fs.readFile(filePath);
      const fileId = options.fileId || this.generateFileId(fileContent);

      // Store the file in our mock storage
      const storagePath = path.join(this.tempDir, fileId);
      await fs.copy(filePath, storagePath);

      // Keep track of the file
      this.files.set(fileId, {
        id: fileId,
        path: storagePath,
        originalPath: filePath,
        size: fileContent.length,
        createdAt: new Date()
      });

      return fileId;
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new Error(`File not found: ${filePath}`);
      }
      throw new Error(`Failed to upload file: ${error.message}`);
    }
  }

  /**
   * Download a file from the mock storage
   * @param {string} fileId - ID of the file to download
   * @param {string} destination - Path where the file should be saved
   * @param {Object} options - Download options
   * @returns {Promise<string>} - Returns the path to the downloaded file
   */
  async downloadFile(fileId, destination, options = {}) {
    try {
      // Ensure the destination directory exists
      await fs.ensureDir(path.dirname(destination));

      // Get the file from our mock storage
      const fileInfo = this.files.get(fileId);

      if (!fileInfo) {
        // If the file is not in our storage, create a mock file
        await fs.writeFile(destination, `Mock content for file ID: ${fileId}`);
      } else {
        // Copy the file to the destination
        await fs.copy(fileInfo.path, destination);
      }

      return destination;
    } catch (error) {
      throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  /**
   * Delete a file from the mock storage
   * @param {string} fileId - ID of the file to delete
   * @param {Object} options - Deletion options
   * @returns {Promise<boolean>} - Returns true if deletion was successful
   */
  async deleteFile(fileId, options = {}) {
    try {
      // Get the file from our mock storage
      const fileInfo = this.files.get(fileId);

      if (fileInfo) {
        // Delete the file from our mock storage
        await fs.remove(fileInfo.path);
        this.files.delete(fileId);
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * List all files in the mock storage
   * @param {Object} options - List options
   * @returns {Promise<Array>} - Returns an array of file objects
   */
  async listFiles(options = {}) {
    try {
      // Convert map to array of files
      return Array.from(this.files.values()).map(file => ({
        id: file.id,
        size: file.size,
        createdAt: file.createdAt
      }));
    } catch (error) {
      throw new Error(`Failed to list files: ${error.message}`);
    }
  }
}

module.exports = MockStorage;
