import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Installer } from '../../core/installer.js';
import { logger } from '../../core/logger.js';

export function installCommand() {
  return new Command('install')
    .description('Install all documentation sources from config')
    .option('--force', 'Force reinstall even if already installed')
    .option('--no-cache', 'Don\'t use cached downloads')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        
        const installer = new Installer(configManager.get());
        
        // Pass options to installer if needed (e.g. force, no-cache)
        // For now installer doesn't accept them in install(), but we can update it later.
        // Currently installer always overwrites target.
        
        await installer.install();
        
      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
