import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { logger } from '../../core/logger.js';

export function initCommand() {
  return new Command('init')
    .description('Initialize docpkg in current project')
    .option('--npm', 'Initialize with package.json integration')
    .option('--python', 'Initialize with pyproject.toml integration')
    .option('--yaml', 'Create .docpkg.yaml config')
    .option('--force', 'Overwrite existing config')
    .action(async (options) => {
      try {
        const cwd = process.cwd();

        if (options.npm) {
            const pkgPath = path.join(cwd, 'package.json');
            if (!await fs.pathExists(pkgPath)) {
                logger.error('package.json not found');
                return;
            }
            const pkg = await fs.readJson(pkgPath);
            if (pkg.docs && !options.force) {
                logger.warn('package.json already has "docs" field. Use --force to overwrite.');
                return;
            }
            pkg.docs = {
                version: '1',
                installPath: 'docs',
                sources: {}
            };
            await fs.writeJson(pkgPath, pkg, { spaces: 2 });
            logger.success('Initialized docpkg in package.json');
        } else {
            // Default to docpkg.json
            const configPath = path.join(cwd, 'docpkg.json');
            if (await fs.pathExists(configPath) && !options.force) {
                logger.warn('docpkg.json already exists. Use --force to overwrite.');
                return;
            }
            
            const defaultConfig = {
                version: '1',
                installPath: 'docs',
                structure: 'nested',
                sources: {},
                cache: {
                    enabled: true
                }
            };
            
            await fs.writeJson(configPath, defaultConfig, { spaces: 2 });
            logger.success('Created docpkg.json');
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
