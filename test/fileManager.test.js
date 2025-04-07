/**
 * Unit tests for the FileManager module
 */

const { expect } = require('chai');
const sinon = require('sinon');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const FileManager = require('../lib/fileManager');
const MockStorage = require('./mock/mockStorage');

describe('FileManager', function() {
  // Set timeout to a higher value for file operations
  this.timeout(10000);

  let fileManager;
  let tempDir;
  let testFilePath;
  let mockStorage;

  before(async () => {
    // Create a temporary directory for test files
    tempDir = path.join(os.tmpdir(), 'aetherdrive-test-' + Date.now());
    await fs.ensureDir(tempDir);

    // Create a test file
    testFilePath = path.join(tempDir, 'test-file.txt');
    await fs.writeFile(testFilePath, 'This is a test file for file manager');

    // Initialize mock storage
    mockStorage = new MockStorage();

    // Initialize the file manager with mock storage
    fileManager = new FileManager(mockStorage);
  });

  after(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('generateFileId', () => {
    it('should generate a unique file ID', () => {
      const fileId1 = fileManager.generateFileId();
      const fileId2 = fileManager.generateFileId();

      expect(fileId1).to.be.a('string');
      expect(fileId2).to.be.a('string');
      expect(fileId1).to.not.equal(fileId2);
    });
  });

  describe('uploadFile', () => {
    it('should upload a file and return a file ID', async () => {
      // Clear registry between tests
      fileManager.fileRegistry.clear();

      const result = await fileManager.uploadFile(testFilePath);

      expect(result).to.be.a('string');

      // Verify file is in the registry
      const files = await fileManager.listFiles();
      const uploadedFile = files.find(file => file.id === result);

      expect(uploadedFile).to.exist;
      expect(uploadedFile.name).to.equal(path.basename(testFilePath));
    });

    it('should allow custom file ID', async () => {
      // Clear registry between tests
      fileManager.fileRegistry.clear();

      const customFileId = 'custom-file-id';
      const result = await fileManager.uploadFile(testFilePath, { fileId: customFileId });

      expect(result).to.equal(customFileId);

      // Verify file is in the registry with custom ID
      const files = await fileManager.listFiles();
      const uploadedFile = files.find(file => file.id === customFileId);

      expect(uploadedFile).to.exist;
    });

    it('should throw an error when file does not exist', async () => {
      try {
        await fileManager.uploadFile('non-existent-file.txt');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to upload file');
      }
    });
  });

  describe('downloadFile', () => {
    it('should download a file using file ID', async () => {
      // Clear registry between tests
      fileManager.fileRegistry.clear();

      // First upload a file to get a file ID
      const fileId = await fileManager.uploadFile(testFilePath);

      // Then download it
      const downloadDestination = path.join(tempDir, 'downloaded-file.txt');
      const result = await fileManager.downloadFile(fileId, downloadDestination);

      expect(result).to.equal(downloadDestination);
      expect(fs.existsSync(downloadDestination)).to.be.true;

      // Verify content exists
      const fileContent = await fs.readFile(downloadDestination, 'utf8');
      expect(fileContent.length).to.be.greaterThan(0);
    });

    it('should download a file using storage ID when not in registry', async () => {
      const storageId = 'direct-storage-id';
      const downloadDestination = path.join(tempDir, 'downloaded-direct.txt');

      const result = await fileManager.downloadFile(storageId, downloadDestination);

      expect(result).to.equal(downloadDestination);
      expect(fs.existsSync(downloadDestination)).to.be.true;
    });
  });

  describe('deleteFile', () => {
    it('should delete a file using file ID', async () => {
      // Clear registry between tests
      fileManager.fileRegistry.clear();

      // First upload a file to get a file ID
      const fileId = await fileManager.uploadFile(testFilePath);

      // Verify file is in the registry
      let files = await fileManager.listFiles();
      expect(files.some(file => file.id === fileId)).to.be.true;

      // Then delete it
      const result = await fileManager.deleteFile(fileId);

      expect(result).to.be.true;

      // Verify file is removed from the registry
      files = await fileManager.listFiles();
      expect(files.some(file => file.id === fileId)).to.be.false;
    });

    it('should delete a file using storage ID when not in registry', async () => {
      const storageId = 'direct-storage-id';

      const result = await fileManager.deleteFile(storageId);

      expect(result).to.be.true;
    });
  });

  describe('listFiles', () => {
    it('should list all files in the registry', async () => {
      // Clear registry
      fileManager.fileRegistry.clear();

      // Upload multiple files
      const fileId1 = await fileManager.uploadFile(testFilePath, { fileId: 'test-file-1' });
      const fileId2 = await fileManager.uploadFile(testFilePath, { fileId: 'test-file-2' });

      // List files
      const files = await fileManager.listFiles();

      expect(files).to.be.an('array');
      expect(files.length).to.equal(2);
      expect(files.map(file => file.id)).to.include.members([fileId1, fileId2]);
    });
  });

  describe('getTempFilePath', () => {
    it('should return a path in the temporary directory', () => {
      const tempFilePath = fileManager.getTempFilePath('test');

      expect(tempFilePath).to.be.a('string');
      expect(tempFilePath).to.include(fileManager.tempDir);
      expect(tempFilePath).to.include('test-');
    });
  });
});
