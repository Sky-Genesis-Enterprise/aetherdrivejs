/**
 * Unit tests for the Encryption module
 */

const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const Encryption = require('../lib/encryption');

describe('Encryption', function() {
  // Set timeout to a higher value for file operations
  this.timeout(10000);

  let encryption;
  let tempDir;
  let testFilePath;

  beforeEach(async () => {
    // Create a new Encryption instance for each test
    encryption = new Encryption();

    // Create a temporary directory for test files
    tempDir = path.join(os.tmpdir(), 'aetherdrive-encryption-test-' + Date.now());
    await fs.ensureDir(tempDir);

    // Create a test file with known content
    testFilePath = path.join(tempDir, 'test-file.txt');
    await fs.writeFile(testFilePath, 'This is a test file for encryption/decryption');
  });

  afterEach(async () => {
    // Clean up temporary directory after each test
    try {
      await fs.remove(tempDir);
    } catch (error) {
      console.error('Error cleaning up:', error.message);
    }
  });

  describe('Key Generation', () => {
    it('should generate a key from a password', () => {
      const result = encryption.generateKey('test-password');

      expect(result).to.have.property('key');
      expect(result).to.have.property('salt');
      expect(Buffer.isBuffer(result.key)).to.be.true;
      expect(Buffer.isBuffer(result.salt)).to.be.true;
      expect(result.key.length).to.equal(32); // AES-256 key length is 32 bytes
    });

    it('should generate the same key for the same password and salt', () => {
      const salt = Buffer.from('0123456789abcdef');

      const result1 = encryption.generateKey('test-password', salt);
      const result2 = encryption.generateKey('test-password', salt);

      expect(result1.key.toString('hex')).to.equal(result2.key.toString('hex'));
    });

    it('should generate different keys for different passwords', () => {
      const salt = Buffer.from('0123456789abcdef');

      const result1 = encryption.generateKey('password1', salt);
      const result2 = encryption.generateKey('password2', salt);

      expect(result1.key.toString('hex')).to.not.equal(result2.key.toString('hex'));
    });
  });

  describe('File Encryption', () => {
    it('should encrypt a file', async () => {
      const encryptedFilePath = path.join(tempDir, 'encrypted-file.enc');

      const result = await encryption.encryptFile(testFilePath, 'test-password', {
        outputPath: encryptedFilePath
      });

      expect(result).to.equal(encryptedFilePath);
      expect(fs.existsSync(encryptedFilePath)).to.be.true;

      // Check that encrypted file content is different from original
      const originalContent = await fs.readFile(testFilePath);
      const encryptedContent = await fs.readFile(encryptedFilePath);

      expect(encryptedContent.toString()).to.not.equal(originalContent.toString());
      expect(encryptedContent.length).to.be.greaterThan(originalContent.length); // Due to IV and salt prepended
    });

    it('should throw an error when file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent-file.txt');
      try {
        await encryption.encryptFile(nonExistentPath, 'test-password');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('File not found');
      }
    });
  });

  describe('File Decryption', () => {
    it('should decrypt an encrypted file', async () => {
      // Set up a complete encryption/decryption flow
      const password = 'secure-password-123';
      const encryptedFilePath = path.join(tempDir, 'encrypted.enc');
      const decryptedFilePath = path.join(tempDir, 'decrypted.txt');

      // Step 1: Encrypt the file
      await encryption.encryptFile(testFilePath, password, {
        outputPath: encryptedFilePath
      });

      // Verify encrypted file was created
      expect(fs.existsSync(encryptedFilePath)).to.be.true;

      // Step 2: Decrypt the file
      const result = await encryption.decryptFile(encryptedFilePath, password, {
        outputPath: decryptedFilePath
      });

      // Verify decryption result
      expect(result).to.equal(decryptedFilePath);
      expect(fs.existsSync(decryptedFilePath)).to.be.true;

      // Step 3: Verify content matches
      const originalContent = await fs.readFile(testFilePath, 'utf8');
      const decryptedContent = await fs.readFile(decryptedFilePath, 'utf8');

      expect(decryptedContent).to.equal(originalContent);
    });

    it('should throw an error with wrong password', async () => {
      const encryptedFilePath = path.join(tempDir, 'wrong-password.enc');
      const decryptedFilePath = path.join(tempDir, 'wrong-password-result.txt');

      // Encrypt with correct password
      await encryption.encryptFile(testFilePath, 'correct-password', {
        outputPath: encryptedFilePath
      });

      // Verify encrypted file was created
      expect(fs.existsSync(encryptedFilePath)).to.be.true;

      // Try to decrypt with wrong password
      try {
        await encryption.decryptFile(encryptedFilePath, 'wrong-password', {
          outputPath: decryptedFilePath
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('Failed to decrypt file');
      }
    });

    it('should throw an error when encrypted file does not exist', async () => {
      const nonExistentPath = path.join(tempDir, 'non-existent-encrypted.enc');
      const outputPath = path.join(tempDir, 'output.txt');

      try {
        await encryption.decryptFile(nonExistentPath, 'test-password', {
          outputPath: outputPath
        });
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).to.include('File not found');
      }
    });
  });
});
