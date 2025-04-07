/**
 * Direct tests for the encryption and decryption functionality
 */

const { expect } = require('chai');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Import the Encryption class directly to test in isolation
const Encryption = require('../lib/encryption');

describe('Direct Encryption Tests', function() {
  // Set timeout to a higher value for encryption operations
  this.timeout(10000);

  let tempDir;
  let testFilePath;

  before(async () => {
    // Create a temporary directory for test files
    tempDir = path.join(os.tmpdir(), 'aetherdrive-direct-test-' + Date.now());
    await fs.ensureDir(tempDir);

    // Create a test file with known content
    testFilePath = path.join(tempDir, 'test-file.txt');
    await fs.writeFile(testFilePath, 'This is a simple test file for direct encryption testing');

    console.log('Test file created at:', testFilePath);
    console.log('Test file content:', await fs.readFile(testFilePath, 'utf8'));
  });

  after(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  it('should encrypt and decrypt a file correctly', async () => {
    // Create new instance of the Encryption class
    const encryption = new Encryption();

    // Generate a secure key
    const password = 'test-password-123';
    const { key, salt } = encryption.generateKey(password);

    console.log('Generated key:', key.toString('hex'));
    console.log('Salt:', salt.toString('hex'));

    // Define output paths
    const encryptedFilePath = path.join(tempDir, 'encrypted.enc');
    const decryptedFilePath = path.join(tempDir, 'decrypted.txt');

    // Encrypt the file
    await encryption.encryptFile(testFilePath, password, {
      outputPath: encryptedFilePath
    });

    console.log('Encrypted file created at:', encryptedFilePath);
    console.log('Encrypted file size:', (await fs.stat(encryptedFilePath)).size);

    // Verify encrypted file exists and is different from the original
    expect(fs.existsSync(encryptedFilePath)).to.be.true;

    const originalContent = await fs.readFile(testFilePath);
    const encryptedContent = await fs.readFile(encryptedFilePath);

    expect(encryptedContent).to.not.deep.equal(originalContent);

    // Decrypt the file
    await encryption.decryptFile(encryptedFilePath, password, {
      outputPath: decryptedFilePath
    });

    console.log('Decrypted file created at:', decryptedFilePath);

    // Verify decrypted file exists
    expect(fs.existsSync(decryptedFilePath)).to.be.true;

    // Verify decrypted content matches original
    const decryptedContent = await fs.readFile(decryptedFilePath, 'utf8');
    const originalTextContent = await fs.readFile(testFilePath, 'utf8');

    console.log('Original content:', originalTextContent);
    console.log('Decrypted content:', decryptedContent);

    expect(decryptedContent).to.equal(originalTextContent);
  });

  it('should fail to decrypt with wrong password', async () => {
    // Create new instance of the Encryption class
    const encryption = new Encryption();

    // Define paths
    const encryptedFilePath = path.join(tempDir, 'encrypted-2.enc');
    const decryptedFilePath = path.join(tempDir, 'decrypted-wrong.txt');

    // Encrypt with one password
    await encryption.encryptFile(testFilePath, 'correct-password', {
      outputPath: encryptedFilePath
    });

    // Try to decrypt with a different password
    try {
      await encryption.decryptFile(encryptedFilePath, 'wrong-password', {
        outputPath: decryptedFilePath
      });
      expect.fail('Should have thrown an error');
    } catch (error) {
      expect(error.message).to.include('Failed to decrypt file');
    }
  });
});
