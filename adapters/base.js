export class BaseAdapter {
  constructor(config) {
    this.config = config;
  }

  /**
   * Parse the source string to check if it matches this adapter
   * @param {string} source - The source string (e.g., "npm:pkg@1.0.0")
   * @returns {object|null} - Parsed info or null if not matched
   */
  parse(source) {
    throw new Error('Not implemented');
  }

  /**
   * Resolve the specific version to install
   * @param {object} parsedSource 
   * @returns {Promise<object>} Resolved version info
   */
  async resolve(parsedSource) {
    throw new Error('Not implemented');
  }

  /**
   * Fetch the package to the cache
   * @param {object} resolvedSource 
   * @param {string} cacheDir 
   * @returns {Promise<string>} Path to cached file/dir
   */
  async fetch(resolvedSource, cacheDir) {
    throw new Error('Not implemented');
  }

  /**
   * Extract documentation files to the target directory
   * @param {string} cachedPath 
   * @param {string} targetDir 
   * @param {object} resolvedSource
   */
  async extract(cachedPath, targetDir, resolvedSource) {
    throw new Error('Not implemented');
  }
}
