import { BaseAdapter } from './base.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from '../utils/fs.js';
import * as tar from 'tar';
import { logger } from '../core/logger.js';
import { copyGlob } from '../utils/glob-copy.js';

const execAsync = util.promisify(exec);

export class NpmAdapter extends BaseAdapter {
// ... (parse and resolve methods remain unchanged)
  parse(source) {
    if (source.startsWith('npm:')) {
      const parts = source.substring(4).split('@');
      let name = parts[0];
      let version = parts[1] || 'latest';
      
      if (source.startsWith('npm:@')) {
         const rest = source.substring(5);
         const atIndex = rest.indexOf('@');
         if (atIndex > -1) {
            name = '@' + rest.substring(0, atIndex);
            version = rest.substring(atIndex + 1);
         } else {
            name = '@' + rest;
            version = 'latest';
         }
      }

      return { type: 'npm', name, version, original: source };
    }
    return null;
  }

  async resolve(parsedSource) {
    try {
      const { stdout } = await execAsync(`npm view ${parsedSource.name}@${parsedSource.version} --json`);
      const info = JSON.parse(stdout);
      const pkgInfo = Array.isArray(info) ? info[0] : info;
      
      return {
        type: 'npm',
        name: pkgInfo.name,
        version: pkgInfo.version,
        tarball: pkgInfo.dist.tarball,
        integrity: pkgInfo.dist.integrity,
        resolved: `npm:${pkgInfo.name}@${pkgInfo.version}`
      };
    } catch (error) {
      throw new Error(`Failed to resolve npm package ${parsedSource.name}@${parsedSource.version}: ${error.message}`);
    }
  }

  async fetch(resolvedSource, cacheDir) {
    const filename = `${resolvedSource.name.replace('/', '-')}-${resolvedSource.version}.tgz`;
    const cachePath = path.join(cacheDir, 'npm', filename);
    
    await fs.ensureDir(path.dirname(cachePath));

    if (await fs.pathExists(cachePath)) {
      logger.debug(`Using cached ${filename}`);
      return cachePath;
    }

    logger.info(`Downloading ${resolvedSource.name}@${resolvedSource.version}...`);
    try {
      const cwd = path.dirname(cachePath);
      const { stdout } = await execAsync(`npm pack ${resolvedSource.name}@${resolvedSource.version}`, { cwd });
      const packedFilename = stdout.trim();
      
      const generatedPath = path.join(cwd, packedFilename);
      if (generatedPath !== cachePath) {
          await fs.move(generatedPath, cachePath, { overwrite: true });
      }
      
      return cachePath;
    } catch (error) {
      throw new Error(`Failed to fetch npm package: ${error.message}`);
    }
  }

  async extract(cachedPath, targetDir, resolvedSource) {
    // Extract to a temporary directory first
    const tempDir = path.join(targetDir, '.tmp-extract-' + Date.now());
    await fs.ensureDir(tempDir);

    try {
      await tar.x({
        file: cachedPath,
        cwd: tempDir,
        strip: 1 // npm pack usually puts everything in a 'package/' folder
      });

      // Check for manifest
      const manifestPath = path.join(tempDir, '.docpkg-manifest.json');
      let patterns = ['docs/**'];
      let basePath = 'docs'; // Default

      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath);
        
        // Sanitize patterns
        const sanitize = (p) => p.replace(/^(\.\.(\/|\\|$))+/, '').replace(/^\/+/, '');

        if (manifest.files && manifest.files.length > 0) {
          patterns = manifest.files.map(sanitize);
        } else if (manifest.docsPath) {
            const cleanDocsPath = sanitize(manifest.docsPath);
            patterns = [`${cleanDocsPath}/**`];
        }
        if (manifest.docsPath) basePath = sanitize(manifest.docsPath);
      }

      // Ensure we copy the pre-computed index if it exists
      const indexFilename = '.docpkg-index.json';
      const sourceIndexPath = path.join(tempDir, indexFilename);
      if (await fs.pathExists(sourceIndexPath)) {
          await fs.copy(sourceIndexPath, path.join(targetDir, indexFilename));
      }

      // Use copyGlob
      const copiedCount = await copyGlob(tempDir, targetDir, patterns, basePath);
      
      if (!copiedCount) {
          logger.warn(`No docs extracted from ${resolvedSource.name}`);
      }
      
    } finally {
      await fs.remove(tempDir);
    }
  }
}
