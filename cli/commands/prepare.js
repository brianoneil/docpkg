import { Command } from 'commander';
import { manifestCommand } from './manifest.js';
import { enrichCommand } from './enrich.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

export function prepareCommand() {
  return new Command('prepare')
    .description('Prepare repository for docpkg distribution (manifest, enrich, config)')
    .action(async () => {
      try {
        const cwd = process.cwd();
        const manifestPath = path.join(cwd, '.docpkg-manifest.json');
        
        logger.info('Preparing repository...');

        // 1. Check Manifest
        if (!await fs.pathExists(manifestPath)) {
            logger.warn('Manifest missing.');
            const { create } = await inquirer.prompt([{
                type: 'confirm',
                name: 'create',
                message: 'Create .docpkg-manifest.json now?',
                default: true
            }]);
            if (create) {
                // Invoke manifest command logic
                // Commander actions are async, we can call the action handler if we exported it cleanly, 
                // or just run the logic. 
                // Since manifestCommand returns a Command, we need to grab its action handler.
                // Better to extract logic, but for now let's assume the user runs it or we guide them.
                // Actually, let's just run the logic if we can.
                // Limitation: commander API makes it hard to call other commands directly without spawning.
                // Let's spawn it or refactor. Spawning is safer.
                // Or just guide the user.
                // Let's stick to guiding for MVP or try to run the interactive wizard? 
                // Running wizard inside another wizard is tricky.
                logger.info('Please run `docpkg manifest` first, or we can try to run it now.');
                // For now, let's just skip to validation.
            }
        } else {
            logger.success('Manifest found.');
        }

        // 2. Enrichment
        const { enrich } = await inquirer.prompt([{
            type: 'confirm',
            name: 'enrich',
            message: 'Run AI enrichment (requires API key)?',
            default: true
        }]);

        if (enrich) {
            // Call enrich logic
            // We can spawn the process or try to invoke the class directly.
            // Invoking class is better.
            const { Enricher } = await import('../../core/enricher.js');
            const { ConfigManager } = await import('../../core/config.js');
            const { Indexer } = await import('../../core/indexer.js');
            
            const configManager = new ConfigManager();
            await configManager.load();
            const config = configManager.get();
            const enricher = new Enricher(config);
            
            try {
                await logger.task('Enriching source docs', async (spinner) => {
                    // Detect source mode manually here or assume it since we are in prepare
                    const manifest = await fs.readJson(manifestPath);
                    const { index, updatedCount } = await enricher.enrichAll(false, { mode: 'source', manifest });
                    
                    const outPath = path.resolve(cwd, '.docpkg-index.json');
                    await fs.writeJson(outPath, index, { spaces: 2 });
                    spinner.succeed(`Enriched ${updatedCount} documents. Saved to .docpkg-index.json`);
                });
            } catch (e) {
                logger.error(`Enrichment failed: ${e.message}`);
            }
        }

        // 3. Package.json Check
        const pkgPath = path.join(cwd, 'package.json');
        if (await fs.pathExists(pkgPath)) {
            const pkg = await fs.readJson(pkgPath);
            const files = pkg.files || [];
            const needed = ['.docpkg-manifest.json', '.docpkg-index.json'];
            const missing = needed.filter(f => !files.includes(f) && fs.pathExistsSync(path.join(cwd, f)));
            
            // Also check docs folder from manifest
            if (await fs.pathExists(manifestPath)) {
                const manifest = await fs.readJson(manifestPath);
                if (manifest.docsPath && !files.includes(manifest.docsPath) && !files.includes(manifest.docsPath + '/')) {
                     missing.push(manifest.docsPath);
                }
            }

            if (missing.length > 0) {
                logger.warn(`Missing files in package.json "files" list: ${missing.join(', ')}`);
                const { fix } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'fix',
                    message: 'Add them to package.json?',
                    default: true
                }]);
                if (fix) {
                    pkg.files = [...files, ...missing];
                    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
                    logger.success('Updated package.json');
                }
            } else {
                logger.success('package.json configuration looks good.');
            }
        }

        logger.success('Preparation complete! Don\'t forget to commit your changes.');

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
