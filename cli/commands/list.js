import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { LockfileManager } from '../../core/lockfile.js';
import { logger } from '../../core/logger.js';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export function listCommand() {
  return new Command('list')
    .description('List installed documentation sources')
    .option('--json', 'Output as JSON')
    .option('--outdated', 'Show outdated sources')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();
        
        const lockfileManager = new LockfileManager();
        await lockfileManager.load();
        const lockfile = lockfileManager.data;

        // Load index if available
        let indexData = null;
        const indexPath = path.join(config.installPath, 'index.json');
        if (await fs.pathExists(indexPath)) {
            indexData = await fs.readJson(indexPath);
        }

        if (options.json) {
            console.log(JSON.stringify({ config: config.sources, installed: lockfile.sources, index: indexData }, null, 2));
            return;
        }

        const sources = Object.keys(config.sources);
        if (sources.length === 0) {
            logger.info('No sources configured.');
            return;
        }

        console.log(''); // Spacer
        logger.info(chalk.bold(`Configured Sources (${sources.length})`));
        console.log('');

        sources.forEach(name => {
            const sourceSpec = config.sources[name];
            const installed = lockfile.sources[name];
            
            console.log(chalk.bold(`📦 ${name}`));
            console.log(chalk.gray(`   ├─ Source: `) + chalk.cyan(sourceSpec));

            if (installed) {
                // Version info
                let verInfo = installed.version || installed.commit || installed.ref || 'unknown';
                let dateInfo = installed.installedAt ? ` (${new Date(installed.installedAt).toLocaleDateString()})` : '';
                console.log(chalk.gray(`   ├─ Installed: `) + chalk.green(verInfo) + chalk.gray(dateInfo));
                
                // Stats
                let stats = chalk.gray('No index data');
                if (indexData && indexData.files) {
                    const pkgFiles = indexData.files.filter(f => f.source === name);
                    const tokenCount = pkgFiles.reduce((sum, f) => sum + (f.tokenCount || 0), 0);
                    const fileCount = pkgFiles.length;
                    if (fileCount > 0) {
                        stats = chalk.yellow(`${fileCount} files`) + chalk.gray(', ') + chalk.magenta(`~${tokenCount.toLocaleString()} tokens`);
                    }
                }
                console.log(chalk.gray(`   └─ Stats: `) + stats);
            } else {
                console.log(chalk.gray(`   └─ Status: `) + chalk.red('Not installed'));
            }
            console.log(''); // Spacer between items
        });

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
