import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Installer } from '../../core/installer.js';
import { Indexer } from '../../core/indexer.js'; // Import Indexer
import { logger } from '../../core/logger.js';
import inquirer from 'inquirer'; // Import inquirer
import path from 'path';
import fs from 'fs-extra';

export function addCommand() {
  return new Command('add')
    .description('Add a documentation source')
    .argument('<source>', 'Source specification (npm:, git:, https:, file:)')
    .option('--name <name>', 'Custom name for the source')
    .option('--npm', 'Use npm install for npm sources')
    .option('--save-dev', 'Add to devDependencies (npm only, default)', true)
    .option('--yes', 'Skip prompts and use defaults (e.g. auto-init)')
    .action(async (source, options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        
        // Auto-Init Check
        if (!configManager.exists()) {
            let doInit = false;
            if (options.yes) {
                doInit = true;
            } else {
                logger.warn('No configuration found.');
                const { init } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'init',
                    message: 'Initialize docpkg now?',
                    default: true
                }]);
                doInit = init;
            }

            if (doInit) {
                // Check for package.json
                const hasPackageJson = await fs.pathExists(path.join(process.cwd(), 'package.json'));
                let usePackageJson = false;
                
                if (hasPackageJson) {
                    if (options.yes) {
                        usePackageJson = true;
                    } else {
                        const { integrate } = await inquirer.prompt([{
                            type: 'confirm',
                            name: 'integrate',
                            message: 'Add configuration to package.json?',
                            default: true
                        }]);
                        usePackageJson = integrate;
                    }
                }

                if (usePackageJson) {
                    const pkgPath = path.join(process.cwd(), 'package.json');
                    const pkg = await fs.readJson(pkgPath);
                    pkg.docs = {
                        version: '1',
                        installPath: 'docs',
                        sources: {}
                    };
                    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
                    // Reload config to pick up the new file
                    await configManager.load();
                } else {
                    // Default docpkg.json handled by save() fallback or explicit init
                    // Let's just rely on configManager.save() logic which defaults to docpkg.json
                    // But we need to set defaults if empty
                     configManager.config = {
                        version: '1',
                        installPath: 'docs',
                        structure: 'nested',
                        sources: {},
                        cache: { enabled: true }
                    };
                    // Force save to create file
                    await configManager.save();
                    logger.success('Initialized configuration.');
                }
            } else {
                logger.warn('Proceeding without saving configuration (changes may be lost).');
            }
        }

        // Initialize installer to check adapters
        const installer = new Installer(configManager.get());
        const match = installer.getAdapter(source);
        
        if (!match) {
            throw new Error(`No adapter found for source: ${source}`);
        }
        
        const { parsed } = match;
        // Determine name: use option or parsed name
        const name = options.name || parsed.name;
        
        if (!name) {
            throw new Error('Could not determine package name. Please use --name.');
        }

        // Update config
        await configManager.addSource(name, source);
        // logger.success(`Added ${name} to config`); // Be quieter

        // Install
        await logger.task(`Installing ${name}`, async () => {
            await installer.install({ [name]: source });
        });

        // Auto-Index
        const indexer = new Indexer(configManager.get());
        await logger.task('Updating index', async () => {
            await indexer.save();
        });

    } catch (error) {
        logger.error(error.message);
        process.exit(1);
    }
    });
}
