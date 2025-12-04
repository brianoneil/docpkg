import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';

export function bundleCommand() {
  return new Command('bundle')
    .description('Bundle documentation into a single context file')
    .option('--output <file>', 'Output file path', 'docs/context.md')
    .option('--source <names>', 'Filter by source name(s) (comma-separated)')
    .option('--tag <tags>', 'Filter by tag(s) (comma-separated)')
    .option('--include <pattern>', 'Include files matching pattern (substring)')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const indexer = new Indexer(config);
        logger.info('Generating bundle...');
        
        const bundleOptions = {};
        if (options.source) bundleOptions.sources = options.source.split(',').map(s => s.trim());
        if (options.tag) bundleOptions.tags = options.tag.split(',').map(t => t.trim());
        if (options.include) bundleOptions.include = options.include;

        const content = await indexer.bundle(bundleOptions);
        
        if (!content) {
            logger.warn('No matching documentation found to bundle.');
            return;
        }

        // Resolve output path
        const outputPath = path.resolve(process.cwd(), options.output);
        await fs.ensureDir(path.dirname(outputPath));
        
        await fs.writeFile(outputPath, content);
        logger.success(`Bundle written to ${outputPath}`);

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
