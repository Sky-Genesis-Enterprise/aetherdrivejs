# AetherDrive

AetherDrive is a Node.js framework for decentralized file storage, retrieval, encryption, and management. This V1 prototype provides a simple yet powerful API for working with files across various storage providers, with built-in encryption capabilities.

## Features

- **File Storage**: Upload and download files to/from storage providers (currently supports IPFS)
- **File Encryption**: AES-256 encryption and decryption for secure storage
- **File Management**: List, delete, and manage files with a simple file ID system
- **Extensible Architecture**: Designed to be extended with additional storage providers

## Installation

```bash
npm install aetherdrive
```

## Quick Start

```javascript
const AetherDrive = require('aetherdrive');

// Initialize with IPFS storage
const aetherDrive = new AetherDrive({
  storageType: 'ipfs',
  storageConfig: {
    host: 'ipfs.infura.io',
    port: 5001,
    protocol: 'https'
  }
});

// Upload a file
const fileId = await aetherDrive.uploadFile('/path/to/file.txt');

// Download a file
await aetherDrive.downloadFile(fileId, '/path/to/destination.txt');

// Encrypt a file
const encryptedPath = await aetherDrive.encryptFile('/path/to/file.txt', 'encryption-key');

// Decrypt a file
const decryptedPath = await aetherDrive.decryptFile('/path/to/file.enc', 'encryption-key');

// Delete a file
await aetherDrive.deleteFile(fileId);

// List all files
const files = await aetherDrive.listFiles();
```

## API Reference

### AetherDrive Class

The main class that provides access to all framework functionality.

#### Constructor

```javascript
new AetherDrive(options)
```

- `options` (Object): Configuration options
  - `storageType` (string): Type of storage provider to use (default: 'ipfs')
  - `storageConfig` (Object): Configuration for the storage provider

#### Methods

##### `uploadFile(filePath, options)`

Uploads a file to the storage provider.

- `filePath` (string): Path to the file to upload
- `options` (Object, optional): Upload options
  - `fileId` (string, optional): Custom file ID
  - `contentType` (string, optional): MIME type of the file
  - `encrypted` (boolean, optional): Whether the file is encrypted
- Returns: Promise resolving to the file ID (string)

##### `downloadFile(fileId, destination, options)`

Downloads a file from the storage provider.

- `fileId` (string): ID of the file to download
- `destination` (string): Path where the file should be saved
- `options` (Object, optional): Download options
- Returns: Promise resolving to the path of the downloaded file (string)

##### `encryptFile(filePath, encryptionKey, options)`

Encrypts a file using AES-256 encryption.

- `filePath` (string): Path to the file to encrypt
- `encryptionKey` (string): Key used for encryption
- `options` (Object, optional): Encryption options
  - `outputPath` (string, optional): Path where the encrypted file should be saved
- Returns: Promise resolving to the path of the encrypted file (string)

##### `decryptFile(filePath, encryptionKey, options)`

Decrypts an encrypted file.

- `filePath` (string): Path to the encrypted file
- `encryptionKey` (string): Key used for decryption
- `options` (Object, optional): Decryption options
  - `outputPath` (string, optional): Path where the decrypted file should be saved
- Returns: Promise resolving to the path of the decrypted file (string)

##### `deleteFile(fileId, options)`

Deletes a file from the storage provider.

- `fileId` (string): ID of the file to delete
- `options` (Object, optional): Deletion options
- Returns: Promise resolving to a boolean indicating success

##### `listFiles(options)`

Lists all files in the storage provider.

- `options` (Object, optional): List options
- Returns: Promise resolving to an array of file objects

## Storage Providers

### IPFS

The framework currently supports IPFS as a storage provider. To configure IPFS:

```javascript
const aetherDrive = new AetherDrive({
  storageType: 'ipfs',
  storageConfig: {
    host: 'ipfs.infura.io', // IPFS node hostname
    port: 5001,             // IPFS API port
    protocol: 'https'       // Protocol (http or https)
  }
});
```

## Examples

### Basic Usage

```javascript
const AetherDrive = require('aetherdrive');
const fs = require('fs');

// Create a sample file
fs.writeFileSync('sample.txt', 'Hello, AetherDrive!');

// Initialize AetherDrive
const aetherDrive = new AetherDrive();

async function example() {
  // Upload the file
  const fileId = await aetherDrive.uploadFile('sample.txt');
  console.log(`File uploaded with ID: ${fileId}`);

  // Download the file
  await aetherDrive.downloadFile(fileId, 'downloaded.txt');
  console.log(`File downloaded`);

  // Encrypt the file
  const encryptedPath = await aetherDrive.encryptFile('sample.txt', 'secret-key');
  console.log(`File encrypted to: ${encryptedPath}`);

  // Upload encrypted file
  const encryptedId = await aetherDrive.uploadFile(encryptedPath, { encrypted: true });

  // Download encrypted file
  await aetherDrive.downloadFile(encryptedId, 'downloaded.enc');

  // Decrypt the file
  const decryptedPath = await aetherDrive.decryptFile('downloaded.enc', 'secret-key');
  console.log(`File decrypted to: ${decryptedPath}`);
}

example().catch(console.error);
```

### Secure File Sharing

```javascript
const AetherDrive = require('aetherdrive');
const crypto = require('crypto');

// Generate a random encryption key
const encryptionKey = crypto.randomBytes(16).toString('hex');

// Initialize AetherDrive
const aetherDrive = new AetherDrive();

async function secureFileSharing() {
  // Encrypt and upload the file
  const encryptedPath = await aetherDrive.encryptFile('sensitive-document.pdf', encryptionKey);
  const fileId = await aetherDrive.uploadFile(encryptedPath, { encrypted: true });

  // Share the file ID and encryption key with the recipient
  console.log(`Share this information with the recipient:
  File ID: ${fileId}
  Encryption Key: ${encryptionKey}
  `);

  // === Recipient's side ===

  // Download and decrypt the file
  await aetherDrive.downloadFile(fileId, 'received-file.enc');
  const decryptedPath = await aetherDrive.decryptFile('received-file.enc', encryptionKey);
  console.log(`File decrypted to: ${decryptedPath}`);
}

secureFileSharing().catch(console.error);
```

## Running Tests

To run the tests for AetherDrive:

```bash
npm test
```

## Limitations and Future Work

This V1 prototype has the following limitations:

- In-memory file registry (does not persist between sessions)
- Limited storage provider options (currently only IPFS)
- Basic error handling

Future versions may include:

- Persistent file registry
- Additional storage providers (S3, Google Cloud Storage, etc.)
- More advanced encryption options
- File streaming support
- Access control and permissions
- Enhanced error handling and logging

## License

MIT
