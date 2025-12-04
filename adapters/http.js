import { BaseAdapter } from './base.js';
import path from 'path';
import fs from '../utils/fs.js';
import { logger } from '../core/logger.js';
import crypto from 'crypto';
import { URL } from 'url';

export class HttpAdapter extends BaseAdapter {
  parse(source) {
    if (source.startsWith('http:') || source.startsWith('https:')) {
      try {
          const urlObj = new URL(source);
          // Name defaults to filename without extension
          const filename = path.basename(urlObj.pathname);
          let name = filename.replace(/\.[^/.]+$/, "");
          if (!name) name = 'download';
          
          return { type: 'http', url: source, name, filename, original: source };
      } catch (e) {
          return null;
      }
    }
    return null;
  }

  async resolve(parsedSource) {
    // For HTTP, we can't easily know the "version" without downloading or checking headers (ETag/Last-Modified).
    // For now, we'll resolve to the URL itself, but we could implement HEAD request here.
    return {
      type: 'http',
      url: parsedSource.url,
      filename: parsedSource.filename,
      resolved: parsedSource.url,
      // TODO: In future, fetch HEAD to get ETag or Content-Length for integrity/versioning hint
    };
  }

  async fetch(resolvedSource, cacheDir) {
    const urlHash = crypto.createHash('sha256').update(resolvedSource.url).digest('hex').substring(0, 16);
    const cachePath = path.join(cacheDir, 'http', urlHash);
    const cacheFile = path.join(cachePath, resolvedSource.filename);
    
    await fs.ensureDir(cachePath);

    // Check if cached (simple check, ideally we check cache-control headers)
    if (await fs.pathExists(cacheFile)) {
       logger.debug(`Using cached file ${cacheFile}`);
       return cachePath;
    }

    logger.info(`Downloading ${resolvedSource.url}...`);
    
    try {
        const response = await fetch(resolvedSource.url);
        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
        }
        
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        await fs.writeFile(cacheFile, buffer);
        return cachePath;
    } catch (error) {
        throw new Error(`Failed to download file: ${error.message}`);
    }
  }

  async extract(cachedPath, targetDir, resolvedSource) {
    // cachedPath is the directory containing the file
    const sourceFile = path.join(cachedPath, resolvedSource.filename);
    const targetFile = path.join(targetDir, resolvedSource.filename);

    await fs.ensureDir(targetDir);
    await fs.copy(sourceFile, targetFile);
  }
}
