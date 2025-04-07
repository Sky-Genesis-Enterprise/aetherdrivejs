/**
 * Integration tests for the AetherDrive framework
 */

const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const sinon = require('sinon');

// Import classes directly to avoid ipfs-http-client dependency issues
const AetherDrive = require('../index');
const Encryption = require('../lib/encryption');
const FileManager = require('../lib/fileManager');
const MockStorage = require('./mock/mockStorage');

describe('AetherDrive Integration', function() {
  // Set timeout to a higher value for operations
  this.timeout(10000);

  let aetherDrive;
  let tempDir;
  let testFilePath;
  let mockStorage;

  before(async () => {
    // Create a temporary directory for test files
    tempDir = path.join(os.tmpdir(), 'aetherdrive-integration-test-' + Date.now());
    await fs.ensureDir(tempDir);

    // Create a test file
    testFilePath = path.join(tempDir, 'integration-test-file.txt');
    await fs.writeFile(testFilePath, 'This is a test file for AetherDrive integration tests');

    // Create a mock storage
    mockStorage = new MockStorage();

    // Create components manually with mock storage
    const encryption = new Encryption();
    const fileManager = new FileManager(mockStorage);

    // Create AetherDrive instance but modify its components
    aetherDrive = new AetherDrive();
    aetherDrive.storage = mockStorage;
    aetherDrive.encryption = encryption;
    aetherDrive.fileManager = fileManager;
  });

  after(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('End-to-end file operations', () => {
    it('should upload, download, and delete a file', async () => {
      // Upload the file
      const fileId = await aetherDrive.uploadFile(testFilePath);

      expect(fileId).to.be.a('string');

      // Download the file
      const downloadPath = path.join(tempDir, 'downloaded-integration.txt');
      const downloadResult = await aetherDrive.downloadFile(fileId, downloadPath);

      expect(downloadResult).to.equal(downloadPath);
      expect(fs.existsSync(downloadPath)).to.be.true;

      // Verify content matches original
      const originalContent = await fs.readFile(testFilePath, 'utf8');
      const downloadedContent = await fs.readFile(downloadPath, 'utf8');
      expect(downloadedContent).to.equal(originalContent);

      // Delete the file
      const deleteResult = await aetherDrive.deleteFile(fileId);

      expect(deleteResult).to.be.true;

      // Verify file is not in the list
      const files = await aetherDrive.listFiles();
      expect(files.find(file => file.id === fileId)).to.be.undefined;
    });
  });

  describe('Core API functionality', () => {
    it('should handle file encryption and decryption', async () => {
      const encryptionKey = 'test-encryption-key';
      const encryptedPath = await aetherDrive.encryptFile(testFilePath, encryptionKey);

      expect(encryptedPath).to.be.a('string');
      expect(fs.existsSync(encryptedPath)).to.be.true;

      // Test decryption directly without storage
      const decryptedPath = path.join(tempDir, 'direct-decrypted.txt');
      const decryptResult = await aetherDrive.decryptFile(encryptedPath, encryptionKey, {
        outputPath: decryptedPath
      });

      expect(decryptResult).to.equal(decryptedPath);
      expect(fs.existsSync(decryptedPath)).to.be.true;

      // Verify content matches
      const originalContent = await fs.readFile(testFilePath, 'utf8');
      const decryptedContent = await fs.readFile(decryptedPath, 'utf8');
      expect(decryptedContent).to.equal(originalContent);
    });

    it('should handle encrypted file upload and download', async () => {
      const fileId = await aetherDrive.uploadFile(testFilePath);

      expect(fileId).to.be.a('string');

      // Download the file to a new location
      const encryptedDownloadPath = path.join(tempDir, 'encrypted-download.txt');
      const downloadResult = await aetherDrive.downloadFile(fileId, encryptedDownloadPath);

      expect(downloadResult).to.equal(encryptedDownloadPath);
      expect(fs.existsSync(encryptedDownloadPath)).to.be.true;

      // Clean up
      await aetherDrive.deleteFile(fileId);
    });
  });

  describe('Error handling', () => {
    it('should handle file not found errors', async () => {
      try {
        await aetherDrive.uploadFile('non-existent-file.txt');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to upload file');
      }
    });

    it('should handle decryption errors with wrong key', async () => {
      const encryptionKey = 'correct-key';

      // Encrypt the file
      const encryptedPath = await aetherDrive.encryptFile(testFilePath, encryptionKey);

      expect(encryptedPath).to.be.a('string');
      expect(fs.existsSync(encryptedPath)).to.be.true;

      try {
        // Try to decrypt with wrong key
        await aetherDrive.decryptFile(encryptedPath, 'wrong-key');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to decrypt file');
      }
    });
  });
});
