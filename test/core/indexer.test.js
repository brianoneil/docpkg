import { expect } from 'chai';
import { Indexer } from '../../core/indexer.js';
import { LockfileManager } from '../../core/lockfile.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import sinon from 'sinon';

describe('Indexer', () => {
  const testDir = path.join(os.tmpdir(), `docpkg-test-indexer-${Date.now()}`);
  const docsDir = path.join(testDir, 'docs');
  const pkgDocsDir = path.join(docsDir, 'test-pkg');

  beforeEach(async () => {
    await fs.ensureDir(pkgDocsDir);
    
    // Create a markdown file with frontmatter
    await fs.writeFile(path.join(pkgDocsDir, 'index.md'), `---
title: Test Doc
tags: [test, ai]
---
# Heading 1
Some content.
## Heading 2
More content.`);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    sinon.restore();
  });

  it('should generate index from installed sources', async () => {
    // Mock LockfileManager.load to do nothing
    sinon.stub(LockfileManager.prototype, 'load').resolves();
    
    const config = { installPath: path.relative(process.cwd(), docsDir) };
    const indexer = new Indexer(config);
    
    // Directly inject data into the instance's lockfileManager
    indexer.lockfileManager.data = {
        sources: {
            'test-pkg': {
                type: 'file',
                extractedPath: pkgDocsDir // Absolute path
            }
        }
    };

    const index = await indexer.generateIndex();

    expect(index.files).to.have.lengthOf(1);
    expect(index.files[0].title).to.equal('Test Doc');
    expect(index.files[0].tags).to.include('test');
    expect(index.files[0].sections).to.have.lengthOf(2);
    expect(index.files[0].tokenCount).to.be.a('number'); // Check tokenCount exists
    expect(index.tags['ai']).to.exist;
  });

  it('should bundle content with filtering', async () => {
      sinon.stub(LockfileManager.prototype, 'load').resolves();
      
      const config = { installPath: path.relative(process.cwd(), docsDir) };
      const indexer = new Indexer(config);
      
      indexer.lockfileManager.data = {
          sources: {
              'test-pkg': { type: 'file', extractedPath: pkgDocsDir }
          }
      };

      // Bundle with tag filter
      const content = await indexer.bundle({ tags: ['ai'] });
      
      expect(content).to.contain('# Documentation Context');
      expect(content).to.contain('## Source: test-pkg');
      expect(content).to.contain('Tags: test, ai');
      expect(content).to.contain('# Heading 1');
  });

  it('should return null if filter matches nothing', async () => {
      sinon.stub(LockfileManager.prototype, 'load').resolves();
      
      const config = { installPath: path.relative(process.cwd(), docsDir) };
      const indexer = new Indexer(config);
      
      indexer.lockfileManager.data = {
          sources: {
              'test-pkg': { type: 'file', extractedPath: pkgDocsDir }
          }
      };

      const content = await indexer.bundle({ tags: ['non-existent'] });
      expect(content).to.be.null;
  });
});
