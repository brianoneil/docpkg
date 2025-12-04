import { expect } from 'chai';
import { FileAdapter } from '../../adapters/file.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('FileAdapter', () => {
  const adapter = new FileAdapter({});
  const testDir = path.join(os.tmpdir(), `docpkg-test-file-adapter-${Date.now()}`);
  const sourceDir = path.join(testDir, 'source');
  const targetDir = path.join(testDir, 'target');

  beforeEach(async () => {
    await fs.ensureDir(sourceDir);
    await fs.ensureDir(targetDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  describe('parse', () => {
    it('should parse file source', () => {
      const result = adapter.parse('file:./local-docs');
      expect(result).to.deep.include({
        type: 'file',
        path: './local-docs',
        name: 'local-docs'
      });
    });

    it('should parse file source with different path', () => {
      const result = adapter.parse('file:../shared/api.md');
      expect(result).to.deep.include({
        type: 'file',
        path: '../shared/api.md',
        name: 'api.md'
      });
    });

    it('should return null for non-file sources', () => {
      expect(adapter.parse('npm:uuid')).to.be.null;
      expect(adapter.parse('http://example.com')).to.be.null;
    });
  });

  describe('resolve', () => {
      it('should resolve absolute path and verify existence', async () => {
          const filePath = path.join(sourceDir, 'test.md');
          await fs.writeFile(filePath, '# Test');
          
          const parsed = {
              type: 'file',
              path: filePath,
              name: 'test.md'
          };

          const resolved = await adapter.resolve(parsed);
          expect(resolved.resolved).to.equal(`file:${filePath}`);
          expect(resolved.path).to.equal(filePath);
      });

      it('should throw if file does not exist', async () => {
          const parsed = {
              type: 'file',
              path: '/non/existent/path',
              name: 'foo'
          };
          
          try {
              await adapter.resolve(parsed);
              expect.fail('Should have thrown');
          } catch (e) {
              expect(e.message).to.include('File source not found');
          }
      });
  });

  describe('extract', () => {
      it('should copy a single file', async () => {
          const sourceFile = path.join(sourceDir, 'test.md');
          await fs.writeFile(sourceFile, '# Content');
          
          const resolved = {
              path: sourceFile,
              name: 'test.md'
          };
          
          // For file adapter, fetch returns the path
          const fetched = await adapter.fetch(resolved, testDir);
          expect(fetched).to.equal(sourceFile);
          
          await adapter.extract(fetched, targetDir, resolved);
          
          const resultFile = path.join(targetDir, 'test.md');
          expect(await fs.pathExists(resultFile)).to.be.true;
          expect(await fs.readFile(resultFile, 'utf8')).to.equal('# Content');
      });

      it('should copy a directory', async () => {
          const subDir = path.join(sourceDir, 'subdir');
          await fs.ensureDir(subDir);
          await fs.writeFile(path.join(subDir, 'doc.md'), '# Doc');
          
          const resolved = {
              path: subDir,
              name: 'subdir'
          };
          
          const fetched = await adapter.fetch(resolved, testDir);
          await adapter.extract(fetched, targetDir, resolved);
          
          // fs.copy copies contents of dir to targetDir if targetDir exists
          const resultFile = path.join(targetDir, 'doc.md');
          expect(await fs.pathExists(resultFile)).to.be.true;
      });
  });
});
