import fs from '../utils/fs.js';
import path from 'path';
import matter from 'gray-matter';
import { LockfileManager } from './lockfile.js';
import { logger } from './logger.js';
import { getTokens } from '../utils/tokenizer.js';

export class Indexer {
  constructor(config) {
    this.config = config;
    this.lockfileManager = new LockfileManager();
  }

  async generateIndex(options = {}) {
    // Options: { mode: 'installed' | 'source', manifest: object }
    
    const index = {
      generatedAt: new Date().toISOString(),
      sources: [],
      files: [],
      tags: {}
    };

    if (options.mode === 'source' && options.manifest) {
        // Source Mode: Index files based on Manifest
        const manifest = options.manifest;
        const sourcePath = path.resolve(process.cwd(), manifest.docsPath || '.');
        
        index.sources.push({
            name: manifest.name || 'local',
            type: 'source',
            path: manifest.docsPath || '.'
        });

        // Scan files based on manifest.files glob or docsPath
        // TODO: Use glob copy logic or fast-glob directly? fast-glob is better.
        // For now, reusing scanFiles (recursive) on docsPath if available, 
        // or we should assume docsPath is the root.
        
        // Use fast-glob if available (we added it in v1.2.3)
        // But scanFiles is simple recursive. Let's stick to scanFiles for consistency 
        // unless we want to strictly follow manifest.files globs.
        // Using scanFiles on docsPath is safest for "Source" mode MVP.
        
        if (await fs.pathExists(sourcePath)) {
            const files = await this.scanFiles(sourcePath);
            for (const file of files) {
                const relativePath = path.relative(process.cwd(), file);
                const metadata = await this.extractMetadata(file);
                index.files.push({
                    path: relativePath,
                    source: manifest.name || 'local',
                    absolutePath: file,
                    ...metadata
                });
                // Tags logic...
                if (metadata.tags) {
                    for (const tag of metadata.tags) {
                        if (!index.tags[tag]) index.tags[tag] = [];
                        index.tags[tag].push(relativePath);
                    }
                }
            }
        }
        
        return index;
    }

    // Default: Installed Mode (Lockfile)
    await this.lockfileManager.load();
    const lockfile = this.lockfileManager.data;
    // ... existing logic ...
    for (const [sourceName, sourceData] of Object.entries(lockfile.sources)) {
      const sourcePath = path.resolve(process.cwd(), sourceData.extractedPath);
      
      index.sources.push({
        name: sourceName,
        type: sourceData.type,
        version: sourceData.version || sourceData.ref || 'unknown',
        path: sourceData.extractedPath
      });

      if (!await fs.pathExists(sourcePath)) {
        logger.warn(`Source path not found for ${sourceName}: ${sourcePath}`);
        continue;
      }

      // Check for pre-computed index
      const precomputedIndexPath = path.join(sourcePath, '.docpkg-index.json');
      let precomputedData = null;
      if (await fs.pathExists(precomputedIndexPath)) {
          try {
              precomputedData = await fs.readJson(precomputedIndexPath);
              // logger.debug(`Using pre-computed index for ${sourceName}`);
          } catch (e) {
              logger.warn(`Failed to read .docpkg-index.json for ${sourceName}: ${e.message}`);
          }
      }

      // 2. Scan for markdown files recursively
      const files = await this.scanFiles(sourcePath);

      for (const file of files) {
        const relativePath = path.relative(process.cwd(), file);
        
        // Try to find metadata in precomputed index first
        let metadata = null;
        if (precomputedData && precomputedData.files) {
            // Precomputed paths are likely relative to THAT source root.
            // We need to match them. 
            // sourcePath is absolute. file is absolute.
            // path.relative(sourcePath, file) gives relative path inside source.
            const relToSource = path.relative(sourcePath, file);
            // The precomputed index likely stores paths relative to repo root?
            // If generated via 'source mode', paths are relative to CWD (repo root).
            // If sourcePath IS the extraction of repo root, it should match.
            
            const match = precomputedData.files.find(f => f.path === relToSource || f.absolutePath?.endsWith(relToSource));
            if (match) {
                metadata = match;
                // Ensure absolutePath is correct for THIS machine
                metadata.absolutePath = file;
            }
        }

        if (!metadata) {
            metadata = await this.extractMetadata(file);
        }

        const fileEntry = {
          path: relativePath,
          source: sourceName,
          absolutePath: file,
          ...metadata
        };

        index.files.push(fileEntry);

        // Aggregate tags
        if (metadata.tags) {
          for (const tag of metadata.tags) {
            if (!index.tags[tag]) index.tags[tag] = [];
            index.tags[tag].push(relativePath);
          }
        }
      }
    }

    return index;
  }

  async save() {
      const index = await this.generateIndex();
      return this.saveIndex(index);
  }

  async saveIndex(index) {
      const absoluteOutputPath = path.resolve(process.cwd(), this.config.installPath, 'index.json');
      await fs.ensureDir(path.dirname(absoluteOutputPath));
      await fs.writeJson(absoluteOutputPath, index, { spaces: 2 });
      return index;
  }

  async bundle(options = {}) {
    // options: { sources: [], tags: [], include: string }
    const index = await this.generateIndex();
    let bundleContent = `# Documentation Context\nGenerated by docpkg at ${new Date().toISOString()}\n\n`;
    
    let files = index.files;

    // Filter by Source
    if (options.sources && options.sources.length > 0) {
        files = files.filter(f => options.sources.includes(f.source));
    }

    // Filter by Tag
    if (options.tags && options.tags.length > 0) {
        files = files.filter(f => {
            if (!f.tags) return false;
            return f.tags.some(tag => options.tags.includes(tag));
        });
    }

    // Filter by Include pattern (simple substring check for MVP)
    if (options.include) {
        // TODO: Proper glob matching
        files = files.filter(f => f.path.includes(options.include));
    }

    if (files.length === 0) {
        return null;
    }

    for (const file of files) {
        const content = await fs.readFile(file.absolutePath, 'utf8');
        // We might want to strip frontmatter from the bundled content?
        // Keeping it is fine, but maybe cleaner to strip.
        // matter(content).content gives body.
        const { content: body } = matter(content);

        bundleContent += `---\n`;
        bundleContent += `## Source: ${file.source}\n`;
        bundleContent += `File: ${file.path}\n`;
        if (file.tags && file.tags.length) bundleContent += `Tags: ${file.tags.join(', ')}\n`;
        bundleContent += `\n${body}\n\n`;
    }

    return bundleContent;
  }

  async scanFiles(dir) {
    let results = [];
    const list = await fs.readdir(dir);
    
    for (const file of list) {
      const filePath = path.resolve(dir, file);
      if (await fs.isDirectory(filePath)) {
        const subResults = await this.scanFiles(filePath);
        results = results.concat(subResults);
      } else {
        if (file.endsWith('.md') || file.endsWith('.markdown')) {
          results.push(filePath);
        }
      }
    }
    return results;
  }

  async extractMetadata(filePath) {
    const content = await fs.readFile(filePath, 'utf8');
    const { data, content: body } = matter(content);
    
    // Basic stats
    const wordCount = body.split(/\s+/).length;
    const tokenCount = getTokens(content); // Count tokens of full file (frontmatter + body)
    
    // Extract headings (Simple regex for H1-H3)
    const sections = [];
    const lines = body.split('\n');
    for (const line of lines) {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (match) {
        sections.push({
          title: match[2].trim(),
          level: match[1].length
        });
      }
    }

    return {
      title: data.title || sections.find(s => s.level === 1)?.title || path.basename(filePath, path.extname(filePath)),
      description: data.description || '',
      tags: data.tags || [],
      category: data.category,
      lastModified: (await fs.stat(filePath)).mtime.toISOString(),
      wordCount,
      tokenCount,
      sections
    };
  }
}
