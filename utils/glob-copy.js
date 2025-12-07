import fg from 'fast-glob';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../core/logger.js';

/**
 * Copies files from sourceDir to targetDir matching the patterns.
 * @param {string} sourceDir - The source directory.
 * @param {string} targetDir - The target directory.
 * @param {string[]} patterns - Array of glob patterns (e.g. ['docs/**\/*.md']).
 * @param {string} [basePath] - Optional base path to strip from the destination (e.g. 'docs').
 */
export async function copyGlob(sourceDir, targetDir, patterns, basePath = '') {
  logger.debug(`copyGlob: sourceDir=${sourceDir}, targetDir=${targetDir}, patterns=${patterns}`);
  
  if (!await fs.pathExists(sourceDir)) {
      logger.warn(`copyGlob: sourceDir does not exist: ${sourceDir}`);
      return 0;
  }

  // fast-glob expects unix-style paths even on windows
  const entries = await fg(patterns, { cwd: sourceDir, dot: true });

  if (entries.length === 0) {
    logger.warn(`No files matched patterns: ${patterns.join(', ')} in ${sourceDir}`);
    return;
  }

  await fs.ensureDir(targetDir);

  for (const entry of entries) {
    const srcPath = path.join(sourceDir, entry);
    
    // Determine relative path for destination
    // If basePath is provided (e.g. 'docs'), we want 'docs/foo.md' -> 'foo.md'
    let destRelPath = entry;
    if (basePath && entry.startsWith(basePath)) {
        destRelPath = path.relative(basePath, entry);
    }
    
    const destPath = path.join(targetDir, destRelPath);
    
    await fs.ensureDir(path.dirname(destPath));
    await fs.copy(srcPath, destPath, { overwrite: true });
  }
  
  return entries.length;
}
