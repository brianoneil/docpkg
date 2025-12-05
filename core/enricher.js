import { AIService } from './ai.js';
import { Indexer } from './indexer.js';
import { logger } from './logger.js';

export class Enricher {
  constructor(config) {
    this.config = config;
    this.indexer = new Indexer(config);
    this.ai = new AIService(config);
  }

  async enrichAll(force = false) {
    if (!this.ai.isConfigured()) {
        throw new Error('AI is not configured. Please set OPENAI_API_KEY environment variable.');
    }

    // 1. Load current index (or generate fresh one)
    let index = await this.indexer.generateIndex();
    
    let updatedCount = 0;

    for (const file of index.files) {
        // Skip if already enriched unless forced
        if (file.aiEnriched && !force) {
            continue;
        }

        logger.info(`Enriching ${file.path}...`);
        
        try {
            // Read content (indexer provides absolutePath in memory usually)
            // We need to ensure we have absolute path. 
            // The Indexer.generateIndex() logic adds absolutePath.
            
            if (!file.absolutePath) {
                // Fallback if loaded from disk index without absolute paths
                // (Shouldn't happen with generateIndex, but good for safety)
                continue;
            }

            const fs = (await import('../utils/fs.js')).default;
            const content = await fs.readFile(file.absolutePath, 'utf8');
            
            const analysis = await this.ai.analyzeDoc(content);
            
            // Merge AI data
            file.description = analysis.summary || file.description;
            file.tags = [...new Set([...(file.tags || []), ...(analysis.tags || [])])];
            if (analysis.sections) {
                // Enhance sections with summaries if they match
                // For simplicity, we might just store AI sections as "smartSections" or merge.
                // Let's just append smart data for now.
                file.aiSections = analysis.sections;
            }
            file.aiEnriched = true;
            file.aiEnrichedAt = new Date().toISOString();
            
            updatedCount++;
            
        } catch (error) {
            logger.warn(`Failed to enrich ${file.path}: ${error.message}`);
        }
    }

    // Save the enriched index
    // We need to inject the modified files back into the indexer to save?
    // Or simpler: just overwrite the file manually using indexer logic
    // Indexer.save() regenerates from disk, which would wipe our memory changes!
    // We need a method to save *this* specific index object.
    
    // Let's manually save it here or extend Indexer.
    // Extending Indexer with saveIndex(data) is cleanest.
    
    return { index, updatedCount };
  }
}
