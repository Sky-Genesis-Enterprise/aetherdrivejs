/**
 * AetherDrive - Basic Usage Example
 *
 * This example demonstrates the basic functionality of the AetherDrive framework,
 * including file upload, download, encryption, decryption, and deletion.
 */

const AetherDrive = require('../index');
const fs = require('fs-extra');
const path = require('path');

// Create a temporary directory for example files
const tempDir = path.join(__dirname, 'tmp');
fs.ensureDirSync(tempDir);

// Create a sample file
const sampleFilePath = path.join(tempDir, 'sample.txt');
fs.writeFileSync(sampleFilePath, 'Hello, AetherDrive! This is a sample file.');

// Initialize AetherDrive with IPFS storage (will fallback to mock storage if IPFS is not available)
const aetherDrive = new AetherDrive({
  storageType: 'ipfs',
  storageConfig: {
    // Using Infura's IPFS gateway
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  }
});

/**
 * Run the example
 */
async function runExample() {
  try {
    console.log('AetherDrive Basic Usage Example');
    console.log('-------------------------------');

    // 1. Upload a file
    console.log('\n1. Uploading file...');
    const fileId = await aetherDrive.uploadFile(sampleFilePath);
    console.log(`   File uploaded with ID: ${fileId}`);

    // 2. List files
    console.log('\n2. Listing files...');
    const files = await aetherDrive.listFiles();
    console.log(`   Found ${files.length} files:`);
    files.forEach(file => {
      console.log(`   - ID: ${file.id}, Name: ${file.name || 'Unknown'}, Size: ${file.size || 'Unknown'} bytes`);
    });

    // 3. Download the file
    console.log('\n3. Downloading file...');
    const downloadPath = path.join(tempDir, 'downloaded-sample.txt');
    await aetherDrive.downloadFile(fileId, downloadPath);
    console.log(`   File downloaded to: ${downloadPath}`);
    console.log(`   Content: ${fs.readFileSync(downloadPath, 'utf8')}`);

    // 4. Encrypt a file
    console.log('\n4. Encrypting file...');
    const encryptionKey = 'my-secure-password';
    const encryptedPath = await aetherDrive.encryptFile(sampleFilePath, encryptionKey);
    console.log(`   File encrypted to: ${encryptedPath}`);

    // 5. Upload the encrypted file
    console.log('\n5. Uploading encrypted file...');
    const encryptedFileId = await aetherDrive.uploadFile(encryptedPath, {
      encrypted: true
    });
    console.log(`   Encrypted file uploaded with ID: ${encryptedFileId}`);

    // 6. Download the encrypted file
    console.log('\n6. Downloading encrypted file...');
    const downloadEncryptedPath = path.join(tempDir, 'downloaded-encrypted.enc');
    await aetherDrive.downloadFile(encryptedFileId, downloadEncryptedPath);
    console.log(`   Encrypted file downloaded to: ${downloadEncryptedPath}`);

    // 7. Decrypt the file
    console.log('\n7. Decrypting file...');
    const decryptedPath = await aetherDrive.decryptFile(downloadEncryptedPath, encryptionKey);
    console.log(`   File decrypted to: ${decryptedPath}`);
    console.log(`   Decrypted content: ${fs.readFileSync(decryptedPath, 'utf8')}`);

    // 8. Delete the files
    console.log('\n8. Deleting files...');
    await aetherDrive.deleteFile(fileId);
    await aetherDrive.deleteFile(encryptedFileId);
    console.log('   Files deleted successfully');

    // 9. Verify files are deleted
    console.log('\n9. Verifying deletion...');
    const remainingFiles = await aetherDrive.listFiles();
    console.log(`   Found ${remainingFiles.length} files`);

    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error running example:', error.message);
  } finally {
    // Clean up temporary directory
    fs.removeSync(tempDir);
  }
}

// Run the example
runExample();
