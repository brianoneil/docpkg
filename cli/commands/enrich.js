import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Enricher } from '../../core/enricher.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';

export function enrichCommand() {
  return new Command('enrich')
    .description('Enhance documentation index with AI-generated summaries and tags')
    .option('--force', 'Re-analyze documents even if already enriched')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const cwd = process.cwd();
        const manifestPath = path.join(cwd, '.docpkg-manifest.json');
        const isSourceRepo = await fs.pathExists(manifestPath);
        
        // Check if we should run in "Source Mode" (Authoring) or "Installed Mode" (Consumption)
        // Priority: If manifest exists and NO sources are installed, assume Source Mode.
        // Or if user explicitly asks? For now, auto-detect.
        // Actually, if manifest exists, we probably WANT to enrich the source docs.
        
        let enrichmentOptions = {};
        let outputName = 'index.json'; // Default for installed
        let saveMethod = 'saveIndex'; // Method on indexer to call

        if (isSourceRepo) {
            const manifest = await fs.readJson(manifestPath);
            enrichmentOptions = { mode: 'source', manifest };
            outputName = '.docpkg-index.json'; // Source index file
            logger.info('Detected .docpkg-manifest.json: Enriching SOURCE documentation.');
        } else {
            logger.info('Enriching INSTALLED documentation.');
        }

        const enricher = new Enricher(config);
        
        await logger.task('Enriching documentation', async (spinner) => {
            const { index, updatedCount } = await enricher.enrichAll(options.force, enrichmentOptions);
            
            if (updatedCount > 0 || isSourceRepo) {
                // Even if 0 updates, if it's source repo we might want to save the index initially?
                // Assuming updatedCount tracks successful AI calls.
                // If files exist but AI failed or skipped, we still might want index structure.
                
                const indexer = new Indexer(config);
                // Manually save to specific file if source mode
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
