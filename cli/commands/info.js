import { Command } from 'commander';
import { LockfileManager } from '../../core/lockfile.js';
import { ConfigManager } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export function infoCommand() {
  return new Command('info')
    .description('Show detailed information about a source')
    .argument('<name>', 'Name of source')
    .action(async (name) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const lockfileManager = new LockfileManager();
        await lockfileManager.load();
        
        const sourceConfig = config.sources[name];
        const installedInfo = lockfileManager.getEntry(name);

        if (!sourceConfig && !installedInfo) {
            logger.error(`Package '${name}' not found in config or lockfile.`);
            return;
        }

        // Load index data for file stats
        let pkgFiles = [];
        const indexPath = path.join(config.installPath, 'index.json');
        if (await fs.pathExists(indexPath)) {
            const indexData = await fs.readJson(indexPath);
            if (indexData && indexData.files) {
                pkgFiles = indexData.files.filter(f => f.source === name);
            }
        }

        // Header
        const versionStr = installedInfo ? (installedInfo.version || installedInfo.commit || installedInfo.ref || 'unknown') : '?';
        console.log('');
        console.log(chalk.bold(`📦 ${name}`) + chalk.gray(` (${versionStr})`));
        console.log(chalk.gray('─'.repeat(40)));

        // Metadata
        if (installedInfo) {
            console.log(chalk.bold('📍 Location:  ') + installedInfo.extractedPath);
            console.log(chalk.bold('📅 Installed: ') + (installedInfo.installedAt ? new Date(installedInfo.installedAt).toLocaleDateString() : 'Unknown'));
        } else {
            console.log(chalk.yellow('⚠ Not currently installed'));
        }
        
        if (sourceConfig) {
            console.log(chalk.bold('🔗 Source:    ') + sourceConfig);
        }

        // File List
        if (pkgFiles.length > 0) {
            console.log('');
            console.log(chalk.bold(`📂 Files (${pkgFiles.length})`));
            
            let totalTokens = 0;
            pkgFiles.forEach((f, i) => {
                const isLast = i === pkgFiles.length - 1;
                const treeChar = isLast ? '└─' : '├─';
                const tokens = f.tokenCount ? `~${f.tokenCount.toLocaleString()} tokens` : 'unknown';
                totalTokens += (f.tokenCount || 0);
                
                // Strip the package prefix from path for display if redundant
                // e.g. docs/pkg/foo.md -> foo.md
                let displayPath = f.path;
                const prefix = path.join(config.installPath, name);
                if (displayPath.startsWith(prefix)) {
                    displayPath = path.relative(prefix, displayPath);
                }

                console.log(chalk.gray(`   ${treeChar} `) + displayPath + chalk.gray(` (${tokens})`));
            });

            console.log('');
            console.log(chalk.bold('📊 Total: ') + chalk.magenta(`~${totalTokens.toLocaleString()} tokens`));
        } else if (installedInfo) {
            console.log('');
            console.log(chalk.yellow('No indexed files found. (Try running `docpkg index`)'));
        }

        console.log('');

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
