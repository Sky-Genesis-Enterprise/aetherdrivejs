/**
 * Mock ipfs-http-client module for testing
 */

const crypto = require('crypto');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

class MockIpfs {
  constructor() {
    this.files = new Map();
    this.pins = new Map();

    // Create a temporary directory for mock IPFS storage
    this.tempDir = path.join(os.tmpdir(), 'mock-ipfs-' + Date.now());
    fs.ensureDirSync(this.tempDir);

    // Initialize IPFS client methods
    this.add = this.add.bind(this);
    this.cat = this.cat.bind(this);
    this.pin = {
      rm: this.unpinFile.bind(this),
      ls: this.listPins.bind(this)
    };
  }

  /**
   * Generate a mock CID (Content Identifier) for a file
   * @param {Buffer} content - File content
   * @returns {string} - A mock CID
   */
  generateCid(content) {
    const hash = crypto.createHash('sha256').update(content).digest('hex');
    return `QmMock${hash.substring(0, 32)}`;
  }

  /**
   * Add a file to the mock IPFS storage
   * @param {Buffer} content - File content to add
   * @param {Object} options - Options for the add operation
   * @returns {Promise<{path: string, cid: string}>} - Returns a mock IPFS response
   */
  async add(content, options = {}) {
    const cid = this.generateCid(content);
    const filePath = path.join(this.tempDir, cid);

    await fs.writeFile(filePath, content);

    this.files.set(cid, filePath);
    this.pins.set(cid, { cid, type: 'recursive' });

    return { path: cid, cid };
  }

  /**
   * Generator function that yields chunks of a file's content
   * @param {string} cid - CID of the file to retrieve
   * @param {Object} options - Options for the cat operation
   * @returns {AsyncGenerator<Buffer>} - Yields chunks of the file content
   */
  async *cat(cid, options = {}) {
    const filePath = this.files.get(cid);

    if (!filePath) {
      // If file not found, create mock content
      yield Buffer.from(`Mock content for ${cid}`);
      return;
    }

    const content = await fs.readFile(filePath);

    // Simulate chunked response
    const chunkSize = 1024; // 1KB chunks
    let offset = 0;

    while (offset < content.length) {
      const end = Math.min(offset + chunkSize, content.length);
      yield content.slice(offset, end);
      offset = end;
    }
  }

  /**
   * Unpin a file from the mock IPFS storage
   * @param {string} cid - CID of the file to unpin
   * @param {Object} options - Options for the unpin operation
   * @returns {Promise<void>} - Resolves when the file is unpinned
   */
  async unpinFile(cid, options = {}) {
    if (!this.pins.has(cid)) {
      // Just return success for testing
      return;
    }

    this.pins.delete(cid);

    // Optionally remove the file as well (simulates garbage collection)
    if (options.removeFile && this.files.has(cid)) {
      const filePath = this.files.get(cid);
      await fs.remove(filePath);
      this.files.delete(cid);
    }
  }

  /**
   * List all pinned files in the mock IPFS storage
   * @param {Object} options - Options for the list operation
   * @returns {AsyncGenerator<{cid: string, type: string}>} - Yields pin information
   */
  async *listPins(options = {}) {
    for (const [cid, pinInfo] of this.pins.entries()) {
      yield {
        cid: {
          toString: () => cid
        },
        type: pinInfo.type
      };
    }
  }
}

// Create function to export
const create = () => new MockIpfs();

module.exports = { create };
