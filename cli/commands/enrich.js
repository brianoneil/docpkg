import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Enricher } from '../../core/enricher.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';

export function enrichCommand() {
  return new Command('enrich')
    .description('Enhance documentation index with AI-generated summaries and tags')
    .argument('[packages...]', 'Specific packages to enrich (optional)')
    .option('--force', 'Re-analyze documents even if already enriched')
    .action(async (packages, options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const cwd = process.cwd();
        const manifestPath = path.join(cwd, '.docpkg-manifest.json');
        const isSourceRepo = await fs.pathExists(manifestPath);
        
        let enrichmentOptions = {};
        let outputName = 'index.json'; 
        
        if (isSourceRepo && (!packages || packages.length === 0)) {
            // Source Mode (Default if no packages specified and manifest exists)
            // If packages specified, we assume they mean installed deps unless one matches manifest name?
            // Let's stick to simple: if source repo and no args -> enrich source.
            const manifest = await fs.readJson(manifestPath);
            enrichmentOptions = { mode: 'source', manifest };
            outputName = '.docpkg-index.json'; 
            logger.info('Detected .docpkg-manifest.json: Enriching SOURCE documentation.');
        } else {
            // Installed Mode
            logger.info('Enriching INSTALLED documentation.');
            
            // If packages provided via CLI, use them
            if (packages && packages.length > 0) {
                enrichmentOptions.packages = packages;
            } else {
                // Interactive Selection
                // 1. Get list of installed packages
                const indexer = new Indexer(config);
                const fullIndex = await indexer.generateIndex();
                const sources = fullIndex.sources.map(s => s.name);
                
                if (sources.length === 0) {
                    logger.warn('No installed documentation found to enrich.');
                    return;
                }

                const { selected } = await inquirer.prompt([{
                    type: 'checkbox',
                    name: 'selected',
                    message: 'Select packages to enrich (Space to select, Enter to confirm):',
                    choices: sources,
                    pageSize: 10
                }]);

                if (selected.length === 0) {
                    logger.info('No packages selected.');
                    return;
                }
                enrichmentOptions.packages = selected;
            }
        }

        const enricher = new Enricher(config);
        
        await logger.task('Enriching documentation', async (spinner) => {
            const { index, updatedCount } = await enricher.enrichAll(options.force, enrichmentOptions);
            
            if (updatedCount > 0 || isSourceRepo) {
                const indexer = new Indexer(config);
                if (isSourceRepo) {
                    const outPath = path.resolve(cwd, outputName);
                    await fs.writeJson(outPath, index, { spaces: 2 });
                    spinner.succeed(`Enriched ${updatedCount} documents. Saved to ${outputName}`);
                } else {
                    await indexer.saveIndex(index);
                    spinner.succeed(`Enriched ${updatedCount} documents. Updated local index.`);
                }
            } else {
                spinner.info('No documents needed enrichment.');
            }
        });

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
