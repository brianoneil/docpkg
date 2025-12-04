import { NpmAdapter } from '../adapters/npm.js';
import { GitAdapter } from '../adapters/git.js';
import { HttpAdapter } from '../adapters/http.js';
import { FileAdapter } from '../adapters/file.js';
import { LockfileManager } from './lockfile.js';
import { logger } from './logger.js';
import path from 'path';
import fs from '../utils/fs.js';

export class Installer {
  constructor(config) {
    this.config = config;
    this.lockfileManager = new LockfileManager();
    this.adapters = [
        new NpmAdapter(config),
        new GitAdapter(config),
        new HttpAdapter(config),
        new FileAdapter(config)
    ];
  }

  getAdapter(source) {
    for (const adapter of this.adapters) {
      const parsed = adapter.parse(source);
      if (parsed) return { adapter, parsed };
    }
    return null;
  }

  async install(sourcesToInstall = null) {
    // sourcesToInstall: { name: spec }
    // If null, install all from config
    const sources = sourcesToInstall || this.config.sources;
    await this.lockfileManager.load();

    const installPath = path.resolve(process.cwd(), this.config.installPath);
    await fs.ensureDir(installPath);

    for (const [name, sourceSpec] of Object.entries(sources)) {
      logger.info(`Installing ${name}...`);
      
      const match = this.getAdapter(sourceSpec);
      if (!match) {
        logger.error(`No adapter found for source: ${sourceSpec}`);
        continue;
      }

      const { adapter, parsed } = match;
      
      try {
        // 1. Resolve
        const resolved = await adapter.resolve(parsed);
        logger.debug(`Resolved to ${resolved.resolved}`);

        // 2. Check lockfile/cache (optimization skipped for now, always install if forced or new)
        // TODO: Check if already installed and integrity matches

        // 3. Fetch
        const cacheDir = this.config.cache.path;
        const cachedPath = await adapter.fetch(resolved, cacheDir);

        // 4. Extract
        const targetDir = path.join(installPath, name);
        await fs.emptyDir(targetDir); // Clean target first
        await adapter.extract(cachedPath, targetDir, resolved);

        // 5. Update Lockfile
        this.lockfileManager.setEntry(name, {
          ...resolved,
          extractedPath: path.relative(process.cwd(), targetDir),
          installedAt: new Date().toISOString()
        });

        logger.success(`Installed ${name}`);
      } catch (error) {
        logger.error(`Failed to install ${name}: ${error.message}`);
      }
    }

    await this.lockfileManager.save();
  }
}
