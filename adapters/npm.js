import { BaseAdapter } from './base.js';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import fs from '../utils/fs.js';
import * as tar from 'tar';
import { logger } from '../core/logger.js';

const execAsync = util.promisify(exec);

export class NpmAdapter extends BaseAdapter {
  parse(source) {
    if (source.startsWith('npm:')) {
      const parts = source.substring(4).split('@');
      let name = parts[0];
      let version = parts[1] || 'latest';
      
      // Handle scoped packages npm:@scope/pkg@version
      if (source.startsWith('npm:@')) {
         const rest = source.substring(5); // scope/pkg@version or scope/pkg
         const atIndex = rest.indexOf('@');
         if (atIndex > -1) {
            name = '@' + rest.substring(0, atIndex);
            version = rest.substring(atIndex + 1);
         } else {
            name = '@' + rest;
            version = 'latest';
         }
      } else if (name.startsWith('@')) {
          // Should catch cases where split('@') split the scope
          // npm:@scope/pkg -> parts=['', 'scope/pkg'] (no)
          // split('@') on "npm:@scope/pkg@ver" -> ["npm:", "scope/pkg", "ver"] (no)
          // My manual parsing logic above is safer for scoped packages
      }

      return { type: 'npm', name, version, original: source };
    }
    return null;
  }

  async resolve(parsedSource) {
    try {
      const { stdout } = await execAsync(`npm view ${parsedSource.name}@${parsedSource.version} --json`);
      const info = JSON.parse(stdout);
      // npm view returns array if multiple versions match, or object if one
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
      // We use npm pack in the cache dir
      const cwd = path.dirname(cachePath);
      const { stdout } = await execAsync(`npm pack ${resolvedSource.name}@${resolvedSource.version}`, { cwd });
      const packedFilename = stdout.trim();
      
      // npm pack creates the file in cwd with a specific name, we might want to rename it or ensure it matches
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
      let filesToCopy = ['docs/**']; // Default
      let baseDir = tempDir;

      if (await fs.pathExists(manifestPath)) {
        const manifest = await fs.readJson(manifestPath);
        if (manifest.files) {
          filesToCopy = manifest.files;
        } else if (manifest.docsPath) {
            filesToCopy = [`${manifest.docsPath}/**`];
        }
      }

      // Copy files to targetDir
      // For now, simple copy of everything in docs/ or specified files
      // Implementing robust glob copy is complex without 'glob' package, 
      // but 'fs-extra' copy works for directories.
      
      // Simplified strategy:
      // 1. If .docpkg-manifest exists, read it.
      // 2. Try to find 'docs' folder.
      // 3. Move 'docs' folder to targetDir.
      
      const sourceDocsPath = path.join(tempDir, 'docs');
      if (await fs.pathExists(sourceDocsPath)) {
          await fs.copy(sourceDocsPath, targetDir);
      } else {
          // If no docs folder, maybe root has md files?
          // For MVP, strictly look for 'docs/' folder as per requirements fallback
          logger.warn(`No 'docs' directory found in ${resolvedSource.name}`);
      }
      
    } finally {
      await fs.remove(tempDir);
    }
  }
}
