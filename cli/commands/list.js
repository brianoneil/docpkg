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

        // Load index if available for token stats
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

        logger.info(chalk.bold('Configured Sources:'));
        sources.forEach(name => {
            const sourceSpec = config.sources[name];
            const installed = lockfile.sources[name];
            
            let status = chalk.gray('(not installed)');
            let extraInfo = '';

            if (installed) {
                status = chalk.green(`(installed: ${installed.resolved})`);
                
                // Calculate tokens from index
                if (indexData && indexData.files) {
                    const pkgFiles = indexData.files.filter(f => f.source === name);
                    const tokenCount = pkgFiles.reduce((sum, f) => sum + (f.tokenCount || 0), 0);
                    const fileCount = pkgFiles.length;
                    if (fileCount > 0) {
                        extraInfo = chalk.cyan(` [${fileCount} files, ~${tokenCount} tokens]`);
                    }
                }
            }
            
            console.log(`  ${chalk.cyan(name)}: ${sourceSpec} ${status}${extraInfo}`);
        });

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
