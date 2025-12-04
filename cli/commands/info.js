import { Command } from 'commander';
import { LockfileManager } from '../../core/lockfile.js';
import { ConfigManager } from '../../core/config.js';
import { logger } from '../../core/logger.js';
import chalk from 'chalk';

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

        console.log(chalk.bold(`Package: ${name}`));
        
        if (sourceConfig) {
            console.log(`Configured Source: ${sourceConfig}`);
        } else {
            console.log(`Configured Source: ${chalk.yellow('Not in config (orphaned?)')}`);
        }

        if (installedInfo) {
            console.log(chalk.bold('\nInstallation Details:'));
            console.log(`  Type: ${installedInfo.type}`);
            console.log(`  Resolved: ${installedInfo.resolved}`);
            if (installedInfo.version) console.log(`  Version: ${installedInfo.version}`);
            if (installedInfo.commit) console.log(`  Commit: ${installedInfo.commit}`);
            console.log(`  Installed At: ${installedInfo.installedAt}`);
            console.log(`  Location: ${installedInfo.extractedPath}`);
            if (installedInfo.integrity) console.log(`  Integrity: ${installedInfo.integrity}`);
        } else {
             console.log(`\n${chalk.yellow('Not currently installed.')}`);
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
