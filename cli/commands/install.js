import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Installer } from '../../core/installer.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';
// import { syncCommand } from './sync.js'; // Circular dep risk if we just call the function? 
// Better to extract sync logic or just invoke it via separate instance/helper.
// For simplicity, let's replicate sync logic or call CLI command if possible, 
// but calling CLI command is messy. 
// Let's actually extract the Sync Logic into a core class 'Syncer' later? 
// For now, let's just instantiate the components needed for sync here.

import fs from 'fs-extra';
import path from 'path';
import { LockfileManager } from '../../core/lockfile.js';

export function installCommand() {
  return new Command('install')
    .description('Install all documentation sources from config')
    .option('--force', 'Force reinstall even if already installed')
    .option('--no-cache', 'Don\'t use cached downloads')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();
        
        // Auto-Sync Logic (Inline for now)
        // Check if NPM project
        const cwd = process.cwd();
        const packageJsonPath = path.join(cwd, 'package.json');
        if (await fs.pathExists(packageJsonPath)) {
             await logger.task('Syncing from node_modules', async () => {
                 // Minimal sync logic
                 const pkg = await fs.readJson(packageJsonPath);
                 const allDeps = { ...pkg.devDependencies, ...pkg.dependencies };
                 const lockfileManager = new LockfileManager();
                 await lockfileManager.load();
                 const installPath = path.resolve(cwd, config.installPath);
                 await fs.ensureDir(installPath);

                 for (const depName of Object.keys(allDeps)) {
                    const depPath = path.join(cwd, 'node_modules', depName);
                    const manifestPath = path.join(depPath, '.docpkg-manifest.json');
                    if (await fs.pathExists(manifestPath)) {
                         const manifest = await fs.readJson(manifestPath);
                         const pkgJson = await fs.readJson(path.join(depPath, 'package.json'));
                         const targetDir = path.join(installPath, depName);
                         // Always overwrite in install flow
                         const sourceDocsPath = manifest.docsPath ? path.join(depPath, manifest.docsPath) : path.join(depPath, 'docs');
                         if (await fs.pathExists(sourceDocsPath)) {
                             await fs.copy(sourceDocsPath, targetDir, { overwrite: true });
                             lockfileManager.setEntry(depName, {
                                type: 'npm',
                                resolved: `npm:${depName}@${pkgJson.version}`,
                                extractedPath: path.relative(cwd, targetDir),
                                installedAt: new Date().toISOString()
                            });
                         }
                    }
                 }
                 await lockfileManager.save();
             });
        }

        const installer = new Installer(config);
        
        await logger.task('Installing remote sources', async () => {
            await installer.install();
        });

        const indexer = new Indexer(config);
        await logger.task('Updating index', async () => {
            await indexer.save();
        });
        
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
