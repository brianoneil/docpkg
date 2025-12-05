import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../core/logger.js';
import { ConfigManager } from '../../core/config.js';
import { LockfileManager } from '../../core/lockfile.js';
import { copyGlob } from '../../utils/glob-copy.js';

export function syncCommand() {
  return new Command('sync')
    .description('Sync documentation from node_modules (NPM projects)')
    .option('--force', 'Force re-extraction')
    .option('--dry-run', 'Show what would be synced without doing it')
    .action(async (options) => {
      try {
        // 1. Check Production Safety
        if (process.env.NODE_ENV === 'production') {
            logger.info('Skipping docpkg sync in production (NODE_ENV=production)');
            return;
        }

        const cwd = process.cwd();
        const packageJsonPath = path.join(cwd, 'package.json');

        if (!await fs.pathExists(packageJsonPath)) {
            logger.warn('No package.json found. Sync is intended for NPM projects.');
            return;
        }

        const pkg = await fs.readJson(packageJsonPath);
        const devDeps = pkg.devDependencies || {};
        const dependencies = pkg.dependencies || {}; // Occasionally docs might be regular deps
        const allDeps = { ...devDeps, ...dependencies };

        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();
        
        const lockfileManager = new LockfileManager();
        await lockfileManager.load();

        const installPath = path.resolve(cwd, config.installPath);
        await fs.ensureDir(installPath);

        let syncedCount = 0;

        for (const depName of Object.keys(allDeps)) {
            const depPath = path.join(cwd, 'node_modules', depName);
            const manifestPath = path.join(depPath, '.docpkg-manifest.json');

            if (await fs.pathExists(manifestPath)) {
                // It's a doc package!
                const manifest = await fs.readJson(manifestPath);
                const pkgJson = await fs.readJson(path.join(depPath, 'package.json'));
                
                logger.info(`Found doc package: ${depName} v${pkgJson.version}`);

                if (options.dryRun) {
                    continue;
                }

                const targetDir = path.join(installPath, depName);
                
                if (options.force) {
                   await fs.emptyDir(targetDir);
                } else {
                   await fs.ensureDir(targetDir);
                }

                // Determine files to copy using Manifest "files" glob
                // If no "files" array, default to "docs/**" or docsPath
                let patterns = ['docs/**'];
                if (manifest.files && manifest.files.length > 0) {
                    patterns = manifest.files;
                } else if (manifest.docsPath) {
                    patterns = [`${manifest.docsPath}/**`];
                }

                // Use copyGlob
                await copyGlob(depPath, targetDir, patterns, manifest.docsPath || 'docs');
                
                // Update lockfile
                lockfileManager.setEntry(depName, {
                    type: 'npm',
                    resolved: `npm:${depName}@${pkgJson.version}`,
                    integrity: 'n/a',
                    extractedPath: path.relative(cwd, targetDir),
                    installedAt: new Date().toISOString()
                });
                
                syncedCount++;
                logger.success(`Synced ${depName}`);
            }
        }

        if (syncedCount > 0 && !options.dryRun) {
            await lockfileManager.save();
            logger.success(`Successfully synced ${syncedCount} packages.`);
        } else if (syncedCount === 0) {
            logger.info('No doc packages found in node_modules.');
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
