import { BaseAdapter } from './base.js';
import cp from 'child_process';
import util from 'util';
import path from 'path';
import fs from '../utils/fs.js';
import { logger } from '../core/logger.js';
import crypto from 'crypto';
import { copyGlob } from '../utils/glob-copy.js';

// Lazy promisify to allow mocking cp.exec
const execAsync = (cmd, opts) => util.promisify(cp.exec)(cmd, opts);

export class GitAdapter extends BaseAdapter {
// ... (parse, resolve, fetch methods remain unchanged)
  parse(source) {
    if (source.startsWith('git:')) {
      const urlParts = source.substring(4).split('#');
      const url = urlParts[0];
      const ref = urlParts[1] || 'HEAD'; // Default to HEAD if no ref provided
      
      // Determine a simple name from the URL if possible
      // e.g. https://github.com/org/repo.git -> repo
      const name = path.basename(url, '.git');

      return { type: 'git', url, ref, name, original: source };
    }
    return null;
  }

  async resolve(parsedSource) {
    try {
      // Use git ls-remote to get the commit hash for the ref
      // This locks the version to a specific commit
      const { stdout } = await execAsync(`git ls-remote ${parsedSource.url} ${parsedSource.ref}`);
      
      // stdout is like: "hash\tref" or empty if not found
      // If HEAD, we might get multiple, usually we want the first one or matching HEAD
      
      const lines = stdout.trim().split('\n');
      if (lines.length === 0 || lines[0] === '') {
          // If explicit ref failed, maybe it's a direct commit hash?
          // ls-remote doesn't validate commit hashes usually.
          // If it looks like a full sha1, assume it is one.
          if (/^[0-9a-f]{40}$/i.test(parsedSource.ref)) {
              return {
                  type: 'git',
                  url: parsedSource.url,
                  ref: parsedSource.ref, // The requested ref (branch/tag)
                  commit: parsedSource.ref, // The resolved commit
                  resolved: `git:${parsedSource.url}#${parsedSource.ref}`
              };
          }
          throw new Error(`Ref '${parsedSource.ref}' not found in ${parsedSource.url}`);
      }

      // Take the first match. 
      // Note: ls-remote output format: <hash>\t<ref>
      const firstLine = lines[0];
      const commit = firstLine.split('\t')[0];

      return {
        type: 'git',
        url: parsedSource.url,
        ref: parsedSource.ref,
        commit: commit,
        resolved: `git:${parsedSource.url}#${commit}`
      };
    } catch (error) {
      throw new Error(`Failed to resolve git source ${parsedSource.url}: ${error.message}`);
    }
  }

  async fetch(resolvedSource, cacheDir) {
    // Create a unique folder name for this repo based on URL
    const urlHash = crypto.createHash('sha256').update(resolvedSource.url).digest('hex').substring(0, 16);
    const repoCachePath = path.join(cacheDir, 'git', urlHash);
    
    await fs.ensureDir(path.dirname(repoCachePath));

    if (await fs.pathExists(repoCachePath)) {
      logger.debug(`Git repo cached at ${repoCachePath}`);
      // Fetch updates
      try {
          logger.info(`Fetching updates for ${resolvedSource.url}...`);
          await execAsync('git fetch origin', { cwd: repoCachePath });
      } catch (e) {
          logger.warn(`Failed to fetch updates: ${e.message}. Using cached version.`);
      }
    } else {
      logger.info(`Cloning ${resolvedSource.url}...`);
      try {
        await execAsync(`git clone ${resolvedSource.url} ${repoCachePath}`);
      } catch (error) {
        throw new Error(`Failed to clone git repo: ${error.message}`);
      }
    }
    
    return repoCachePath;
  }

  async extract(cachedPath, targetDir, resolvedSource) {
    // cachedPath is the repo root
    // We need to checkout the specific commit
    try {
        logger.debug(`Checking out ${resolvedSource.commit} in cache...`);
        await execAsync(`git checkout ${resolvedSource.commit}`, { cwd: cachedPath });
        
        // Check for manifest
        const manifestPath = path.join(cachedPath, '.docpkg-manifest.json');
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
        const sourceIndexPath = path.join(cachedPath, indexFilename);
        if (await fs.pathExists(sourceIndexPath)) {
            await fs.copy(sourceIndexPath, path.join(targetDir, indexFilename));
        }
        
        // Use copyGlob
        const copiedCount = await copyGlob(cachedPath, targetDir, patterns, basePath);
        
        if (!copiedCount) {
            logger.warn(`No docs extracted from ${resolvedSource.url}`);
        }

    } catch (error) {
        throw new Error(`Failed to extract from git repo: ${error.message}`);
    }
  }
}
