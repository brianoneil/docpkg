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
        
        // Determine output path
        if (options.output) {
            const index = await indexer.generateIndex();
            const outputPath = options.output;
            
            logger.info(`Writing index to ${outputPath}...`);
            
            if (options.format === 'json') {
                await fs.writeJson(outputPath, index, { spaces: 2 });
            } else {
                logger.warn('YAML format not yet supported, defaulting to JSON');
                await fs.writeJson(outputPath, index, { spaces: 2 });
            }
            logger.success(`Index generated with ${index.files.length} files.`);
        } else {
            // Default save
            const index = await indexer.save();
            logger.success(`Index saved to ${path.join(config.installPath, 'index.json')} with ${index.files.length} files.`);
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
