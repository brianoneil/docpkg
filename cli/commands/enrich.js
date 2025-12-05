import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Enricher } from '../../core/enricher.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';

export function enrichCommand() {
  return new Command('enrich')
    .description('Enhance documentation index with AI-generated summaries and tags')
    .option('--force', 'Re-analyze documents even if already enriched')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const enricher = new Enricher(config);
        
        await logger.task('Enriching documentation', async (spinner) => {
            const { index, updatedCount } = await enricher.enrichAll(options.force);
            
            if (updatedCount > 0) {
                const indexer = new Indexer(config);
                await indexer.saveIndex(index);
                spinner.succeed(`Enriched ${updatedCount} documents.`);
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
