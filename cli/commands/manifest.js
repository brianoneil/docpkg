import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../core/logger.js';
import { ConfigManager } from '../../core/config.js';

export function manifestCommand() {
  return new Command('manifest')
    .description('Generate a .docpkg-manifest.json file')
    .option('--yes', 'Skip prompts and use defaults')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const manifestPath = path.join(cwd, '.docpkg-manifest.json');
        const packageJsonPath = path.join(cwd, 'package.json');

        // Load existing config to check installPath conflict
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();
        const installPath = config.installPath || 'docs';

        // Check intent
        if (await fs.pathExists(manifestPath)) {
            logger.info('Existing manifest found.');
            if (!options.yes) {
                const { overwrite } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'overwrite',
                    message: 'Overwrite existing manifest?',
                    default: false
                }]);
                if (!overwrite) return;
            }
        } else if (!options.yes) {
            logger.info('This command prepares your repository for distribution as a doc package.');
        }

        let defaults = {
            name: path.basename(cwd),
            docsPath: 'src-docs', // Changed default to src-docs
            title: 'Documentation',
            description: '',
            tags: ''
        };

        // Smart detection
        if (await fs.pathExists(path.join(cwd, 'src-docs'))) {
            defaults.docsPath = 'src-docs';
        } else if (await fs.pathExists(path.join(cwd, 'documentation'))) {
            defaults.docsPath = 'documentation';
        } else if (await fs.pathExists(path.join(cwd, 'docs')) && installPath !== 'docs') {
            // Only default to 'docs' if it's NOT the install path
            defaults.docsPath = 'docs';
        }

        // Try to infer from package.json
        if (await fs.pathExists(packageJsonPath)) {
            const pkg = await fs.readJson(packageJsonPath);
            if (pkg.name) defaults.name = pkg.name;
            if (pkg.description) defaults.description = pkg.description;
        }

        let answers;

        if (options.yes) {
            answers = defaults;
        } else {
            answers = await inquirer.prompt([
                {
                    type: 'input',
                    name: 'name',
                    message: 'Package Name:',
                    default: defaults.name
                },
                {
                    type: 'input',
                    name: 'docsPath',
                    message: 'Source Documentation Directory:',
                    default: defaults.docsPath,
                    validate: async (input) => {
                        if (!input) return 'Path required';
                        
                        // Conflict Check
                        if (path.normalize(input) === path.normalize(installPath)) {
                            // We can't easily block it because maybe they WANT to ship deps, 
                            // but we should warn. Inquirer validate is mostly for blocking.
                            // Let's allow it but we'll warn after.
                            // Or we can return a string to block.
                            // "Warning: This matches your installPath. You might re-ship dependencies."
                            // Let's block for safety unless they really mean it? No, just warn.
                            // console.log(chalk.yellow('Warning...')); // Hard to output during prompt
                        }
                        return true;
                    }
                },
                {
                    type: 'input',
                    name: 'title',
                    message: 'Title:',
                    default: defaults.title
                },
                {
                    type: 'input',
                    name: 'description',
                    message: 'Description:',
                    default: defaults.description
                },
                {
                    type: 'input',
                    name: 'tags',
                    message: 'Tags (comma separated):',
                    default: defaults.tags
                }
            ]);
        }

        // Post-prompt conflict warning
        if (path.normalize(answers.docsPath) === path.normalize(installPath)) {
            logger.warn(`Warning: Your source docs path ('${answers.docsPath}') is the same as your dependency install path.`);
            logger.warn('You might accidentally publish installed dependencies as your own docs.');
            logger.warn('Consider using a separate folder (e.g., src-docs/) for your own documentation.');
        }

        const manifest = {
            name: answers.name,
            version: '0.0.0', 
            type: 'npm', 
            docsPath: answers.docsPath,
            files: [`${answers.docsPath}/**/*.md`],
            metadata: {
                title: answers.title,
                description: answers.description,
                tags: typeof answers.tags === 'string' ? answers.tags.split(',').map(t => t.trim()).filter(Boolean) : []
            }
        };

        await fs.writeJson(manifestPath, manifest, { spaces: 2 });
        logger.success(`Created .docpkg-manifest.json`);
        
        // Check if the directory actually exists
        if (!await fs.pathExists(path.join(cwd, answers.docsPath))) {
            logger.info(`Note: The directory '${answers.docsPath}' does not exist yet. You should create it.`);
        }

    } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
