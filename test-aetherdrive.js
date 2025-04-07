/**
 * AetherDrive Test Script
 *
 * This script demonstrates basic usage of AetherDrive framework.
 * It creates a temporary file and performs various operations on it.
 */

const AetherDrive = require('./index');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

// Create temporary directory for test files
const tempDir = path.join(os.tmpdir(), 'aetherdrive-test-' + Date.now());
fs.ensureDirSync(tempDir);

// Create a test file
const testFilePath = path.join(tempDir, 'test-file.txt');
fs.writeFileSync(testFilePath, 'This is a test file for AetherDrive.\nIt contains some sample data to demonstrate the framework.');

// Generate a random encryption key
const encryptionKey = crypto.randomBytes(16).toString('hex');

// Initialize AetherDrive
const aetherDrive = new AetherDrive({
  storageType: 'ipfs',
  storageConfig: {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  }
});

/**
 * Main test function
 */
async function runTest() {
  try {
    console.log('AetherDrive Test Script');
    console.log('======================');
    console.log(`Created test file at: ${testFilePath}`);
    console.log(`Encryption key: ${encryptionKey}`);
    console.log('======================\n');

    // Step 1: Upload the file
    console.log('Step 1: Uploading file...');
    const fileId = await aetherDrive.uploadFile(testFilePath);
    console.log(`File uploaded with ID: ${fileId}\n`);

    // Step 2: List the uploaded files
    console.log('Step 2: Listing files...');
    const files = await aetherDrive.listFiles();
    console.log(`Files in storage: ${files.length}`);
    files.forEach(file => {
      console.log(`- ID: ${file.id}, Name: ${file.name}, Size: ${file.size} bytes`);
    });
    console.log('');

    // Step 3: Download the file
    console.log('Step 3: Downloading file...');
    const downloadPath = path.join(tempDir, 'downloaded-file.txt');
    await aetherDrive.downloadFile(fileId, downloadPath);
    console.log(`File downloaded to: ${downloadPath}`);
    const downloadedContent = fs.readFileSync(downloadPath, 'utf8');
    console.log(`Downloaded content: ${downloadedContent.substring(0, 30)}...\n`);

    // Step 4: Encrypt the file
    console.log('Step 4: Encrypting file...');
    const encryptedPath = await aetherDrive.encryptFile(testFilePath, encryptionKey);
    console.log(`File encrypted to: ${encryptedPath}\n`);

    // Step 5: Upload the encrypted file
    console.log('Step 5: Uploading encrypted file...');
    const encryptedFileId = await aetherDrive.uploadFile(encryptedPath, {
      encrypted: true
    });
    console.log(`Encrypted file uploaded with ID: ${encryptedFileId}\n`);

    // Step 6: Download the encrypted file
    console.log('Step 6: Downloading encrypted file...');
    const encryptedDownloadPath = path.join(tempDir, 'downloaded-encrypted.enc');
    await aetherDrive.downloadFile(encryptedFileId, encryptedDownloadPath);
    console.log(`Encrypted file downloaded to: ${encryptedDownloadPath}\n`);

    // Step 7: Decrypt the file
    console.log('Step 7: Decrypting file...');
    const decryptedPath = await aetherDrive.decryptFile(encryptedDownloadPath, encryptionKey);
    console.log(`File decrypted to: ${decryptedPath}`);
    const decryptedContent = fs.readFileSync(decryptedPath, 'utf8');
    console.log(`Decrypted content: ${decryptedContent.substring(0, 30)}...\n`);

    // Step 8: Delete files from storage
    console.log('Step 8: Deleting files...');
    await aetherDrive.deleteFile(fileId);
    await aetherDrive.deleteFile(encryptedFileId);
    console.log('Files deleted successfully\n');

    // Step 9: Verify files are deleted
    console.log('Step 9: Verifying deletion...');
    const remainingFiles = await aetherDrive.listFiles();
    console.log(`Remaining files: ${remainingFiles.length}\n`);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Error running test:', error.message);
  } finally {
    // Clean up
    console.log(`\nCleaning up temporary files in: ${tempDir}`);
    fs.removeSync(tempDir);
  }
}

// Run the test
runTest();
