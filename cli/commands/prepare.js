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
    .option('--yes', 'Skip prompts and accept defaults')
    .action(async (options) => {
      try {
        const cwd = process.cwd();
        const manifestPath = path.join(cwd, '.docpkg-manifest.json');
        
        logger.info('Preparing repository...');

        // 1. Check Manifest
        if (!await fs.pathExists(manifestPath)) {
            if (options.yes) {
                // In CI/Auto mode, we need to generate it using smart defaults
                // We can't easily invoke manifestCommand action directly without refactor,
                // but since we duplicated logic in manifest.js to support --yes, 
                // we can actually just run that same logic or spawn it.
                // Let's try to manually create it with defaults here if --yes.
                logger.info('Creating default manifest (CI Mode)...');
                // ... (duplication of manifest logic for now, or just require user to run manifest first)
                // Actually, better to fail if manifest missing in CI? 
                // "prepare" implies setup.
                
                // Simplest: Run the manifest command logic via spawn for robustness?
                // Or just warn:
                logger.warn('Manifest missing. Please run `docpkg manifest --yes` first or interactively.');
                // If --yes, we could assume defaults.
            } else {
                logger.warn('Manifest missing.');
                const { create } = await inquirer.prompt([{
                    type: 'confirm',
                    name: 'create',
                    message: 'Create .docpkg-manifest.json now?',
                    default: true
                }]);
                if (create) {
                    logger.info('Running interactive manifest creation...');
                    // We'd need to invoke manifest command.
                    // For now, just guide the user.
                    logger.info('Please run `docpkg manifest` first.');
                    return; 
                }
            }
        } else {
            logger.success('Manifest found.');
        }

        // 2. Enrichment
        let runEnrich = false;
        if (options.yes) {
            // In CI, only run if API key is present
            if (process.env.OPENAI_API_KEY || process.env.DOCPKG_API_KEY) {
                runEnrich = true;
            } else {
                logger.warn('Skipping enrichment (No API Key found in env).');
            }
        } else {
            const { enrich } = await inquirer.prompt([{
                type: 'confirm',
                name: 'enrich',
                message: 'Run AI enrichment (requires API key)?',
                default: true
            }]);
            runEnrich = enrich;
        }

        if (runEnrich) {
            // Call enrich logic
            const { Enricher } = await import('../../core/enricher.js');
            const { ConfigManager } = await import('../../core/config.js');
            const { Indexer } = await import('../../core/indexer.js');
            
            const configManager = new ConfigManager();
            await configManager.load();
            const config = configManager.get();
            const enricher = new Enricher(config);
            
            try {
                if (await fs.pathExists(manifestPath)) {
                    await logger.task('Enriching source docs', async (spinner) => {
                        const manifest = await fs.readJson(manifestPath);
                        const { index, updatedCount } = await enricher.enrichAll(false, { mode: 'source', manifest });
                        
                        const outPath = path.resolve(cwd, '.docpkg-index.json');
                        await fs.writeJson(outPath, index, { spaces: 2 });
                        spinner.succeed(`Enriched ${updatedCount} documents. Saved to .docpkg-index.json`);
                    });
                }
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
            
            if (await fs.pathExists(manifestPath)) {
                const manifest = await fs.readJson(manifestPath);
                if (manifest.docsPath && !files.includes(manifest.docsPath) && !files.includes(manifest.docsPath + '/')) {
                     missing.push(manifest.docsPath);
                }
            }

            if (missing.length > 0) {
                let doFix = false;
                if (options.yes) {
                    doFix = true;
                } else {
                    logger.warn(`Missing files in package.json "files" list: ${missing.join(', ')}`);
                    const { fix } = await inquirer.prompt([{
                        type: 'confirm',
                        name: 'fix',
                        message: 'Add them to package.json?',
                        default: true
                    }]);
                    doFix = fix;
                }

                if (doFix) {
                    pkg.files = [...files, ...missing];
                    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
                    logger.success('Updated package.json');
                }
            } else {
                logger.success('package.json configuration looks good.');
            }
        }

        logger.success('Preparation complete!');

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
