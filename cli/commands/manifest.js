import { Command } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../core/logger.js';

export function manifestCommand() {
  return new Command('manifest')
    .description('Generate a .docpkg-manifest.json file')
    .option('--yes', 'Skip prompts and use defaults')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const manifestPath = path.join(cwd, '.docpkg-manifest.json');
        const packageJsonPath = path.join(cwd, 'package.json');

        if (await fs.pathExists(manifestPath)) {
            logger.warn('.docpkg-manifest.json already exists.');
            const { overwrite } = await inquirer.prompt([{
                type: 'confirm',
                name: 'overwrite',
                message: 'Overwrite existing manifest?',
                default: false
            }]);
            if (!overwrite) return;
        }

        let defaults = {
            name: path.basename(cwd),
            docsPath: 'docs',
            title: 'Documentation',
            description: '',
            tags: ''
        };

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
                    message: 'Documentation Directory:',
                    default: defaults.docsPath,
                    validate: async (input) => {
                        if (!input) return 'Path required';
                        // Warn if path doesn't exist, but allow it
                        if (!await fs.pathExists(path.resolve(cwd, input))) {
                            return true; // Just a warning in console technically hard to do in inquirer validate, so just accept
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

        const manifest = {
            name: answers.name,
            version: '0.0.0', // Placeholder, usually driven by package.json or git tag
            type: 'npm', // Default assumption, usually harmless
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
        logger.info(`Ensure you commit this file to Git.`);

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
