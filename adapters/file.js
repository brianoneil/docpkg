import { BaseAdapter } from './base.js';
import path from 'path';
import fs from '../utils/fs.js';
import { logger } from '../core/logger.js';

export class FileAdapter extends BaseAdapter {
  parse(source) {
    if (source.startsWith('file:')) {
      const filePath = source.substring(5);
      const name = path.basename(filePath);
      return { type: 'file', path: filePath, name, original: source };
    }
    return null;
  }

  async resolve(parsedSource) {
    // Resolve relative paths against CWD
    const absolutePath = path.resolve(process.cwd(), parsedSource.path);
    
    if (!await fs.pathExists(absolutePath)) {
        throw new Error(`File source not found: ${absolutePath}`);
    }

    return {
      type: 'file',
      path: absolutePath,
      name: parsedSource.name,
      resolved: `file:${absolutePath}`
    };
  }

  async fetch(resolvedSource, cacheDir) {
    // File adapter doesn't really "fetch" to cache in the same way, 
    // or it could copy to cache to ensure immutability during install.
    // For simplicity and performance, we can just return the absolute path 
    // and let extract handle the copying/linking.
    return resolvedSource.path;
  }

  async extract(cachedPath, targetDir, resolvedSource) {
    // cachedPath is the source path in this case
    logger.debug(`Copying local files from ${cachedPath} to ${targetDir}`);
    
    // We copy instead of symlink for safety and consistency with other adapters
    // (docpkg-lock.json implies a snapshot state usually)
    await fs.ensureDir(targetDir);
    
    // If source is a directory, copy dir content
    if (await fs.isDirectory(cachedPath)) {
        await fs.copy(cachedPath, targetDir);
    } else {
        // If file, copy file
        const fileName = path.basename(cachedPath);
        await fs.copy(cachedPath, path.join(targetDir, fileName));
    }
  }
}
