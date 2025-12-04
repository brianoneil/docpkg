import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Indexer } from '../../core/indexer.js';
import { logger } from '../../core/logger.js';
import fs from 'fs-extra';
import path from 'path';

export function indexCommand() {
  return new Command('index')
    .description('Generate AI-friendly index of documentation')
    .option('--output <file>', 'Output file path')
    .option('--format <fmt>', 'Output format: json, yaml', 'json')
    .action(async (options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        const config = configManager.get();

        const indexer = new Indexer(config);
        logger.info('Generating index...');
        
        const index = await indexer.generateIndex();
        
        // Determine output path
        let outputPath = options.output;
        if (!outputPath) {
            outputPath = path.join(config.installPath, 'index.json');
        }
        
        logger.info(`Writing index to ${outputPath}...`);
        
        if (options.format === 'json') {
            await fs.writeJson(outputPath, index, { spaces: 2 });
        } else {
            // TODO: Implement YAML output if needed, for now JSON is default
            logger.warn('YAML format not yet supported, defaulting to JSON');
            await fs.writeJson(outputPath, index, { spaces: 2 });
        }
        
        logger.success(`Index generated with ${index.files.length} files.`);

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
