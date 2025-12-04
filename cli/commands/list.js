import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { LockfileManager } from '../../core/lockfile.js';
import { logger } from '../../core/logger.js';
import chalk from 'chalk';

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
        const lockfile = await lockfileManager.load();

        if (options.json) {
            console.log(JSON.stringify({ config: config.sources, installed: lockfile.sources }, null, 2));
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
            if (installed) {
                status = chalk.green(`(installed: ${installed.resolved})`);
            }
            
            console.log(`  ${chalk.cyan(name)}: ${sourceSpec} ${status}`);
        });

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
