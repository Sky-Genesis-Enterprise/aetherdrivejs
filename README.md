# Aether Drive Node.js Framework

AetherDrive is a Node.js framework for decentralized file storage, retrieval, encryption, and management. This V1 prototype provides a simple yet powerful API for working with files across various storage providers, with built-in encryption capabilities.

![AetherDrive Logo](https://via.placeholder.com/728x90.png?text=AetherDrive)

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

async function main() {
  try {
    // Upload a file
    const fileId = await aetherDrive.uploadFile('/path/to/file.txt');
    console.log(`File uploaded with ID: ${fileId}`);

    // Download a file
    await aetherDrive.downloadFile(fileId, '/path/to/destination.txt');
    console.log('File downloaded successfully');

    // Encrypt a file
    const encryptedPath = await aetherDrive.encryptFile('/path/to/file.txt', 'encryption-key');
    console.log(`File encrypted to: ${encryptedPath}`);

    // Decrypt a file
    const decryptedPath = await aetherDrive.decryptFile('/path/to/file.enc', 'encryption-key');
    console.log(`File decrypted to: ${decryptedPath}`);

    // Delete a file
    await aetherDrive.deleteFile(fileId);
    console.log('File deleted successfully');

    // List all files
    const files = await aetherDrive.listFiles();
    console.log('Files:', files);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
```

## Documentation

For detailed documentation, please see the [docs folder](./docs/README.md).

## Examples

Check out the [examples folder](./examples) for more usage examples:

- [Basic Usage](./examples/basic-usage.js): Demonstrates basic file operations

## Development

### Prerequisites

- Node.js >= 14.0.0
- npm >= 6.0.0

### Setting Up Development Environment

```bash
# Clone the repository
git clone https://github.com/username/aetherdrive.git
cd aetherdrive

# Install dependencies
npm install

# Run tests
npm test

# Run test with coverage
npm run test:coverage

# Run the example
npm run example
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
