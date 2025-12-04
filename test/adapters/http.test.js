import { expect } from 'chai';
import { HttpAdapter } from '../../adapters/http.js';
import sinon from 'sinon';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('HttpAdapter', () => {
  const adapter = new HttpAdapter({});
  const testDir = path.join(os.tmpdir(), `docpkg-test-http-adapter-${Date.now()}`);

  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
    sinon.restore();
  });

  describe('parse', () => {
    it('should parse http URL', () => {
      const result = adapter.parse('http://example.com/docs.md');
      expect(result).to.deep.include({
        type: 'http',
        url: 'http://example.com/docs.md',
        filename: 'docs.md',
        name: 'docs'
      });
    });

    it('should parse https URL', () => {
      const result = adapter.parse('https://example.com/api.json');
      expect(result).to.deep.include({
        type: 'http',
        url: 'https://example.com/api.json',
        filename: 'api.json',
        name: 'api'
      });
    });

    it('should parse raw Gist URL', () => {
      const result = adapter.parse('https://gist.githubusercontent.com/user/1234/raw/cheatsheet.md');
      expect(result).to.deep.include({
        type: 'http',
        url: 'https://gist.githubusercontent.com/user/1234/raw/cheatsheet.md',
        filename: 'cheatsheet.md',
        name: 'cheatsheet'
      });
    });

    it('should return null for non-http sources', () => {
      expect(adapter.parse('npm:uuid')).to.be.null;
      expect(adapter.parse('git:xyz')).to.be.null;
    });
  });

  describe('fetch', () => {
      it('should download file and cache it', async () => {
          const mockBuffer = Buffer.from('mock content');
          const mockResponse = {
              ok: true,
              arrayBuffer: async () => mockBuffer
          };
          
          // Mock global fetch
          const fetchStub = sinon.stub(global, 'fetch').resolves(mockResponse);
          
          const resolved = {
              url: 'https://example.com/test.md',
              filename: 'test.md'
          };
          
          const cachePath = await adapter.fetch(resolved, testDir);
          
          expect(fetchStub.calledWith('https://example.com/test.md')).to.be.true;
          
          // Verify file written
          const files = await fs.readdir(cachePath);
          expect(files).to.include('test.md');
          const content = await fs.readFile(path.join(cachePath, 'test.md'), 'utf8');
          expect(content).to.equal('mock content');
      });

      it('should throw on http error', async () => {
          const mockResponse = {
              ok: false,
              status: 404,
              statusText: 'Not Found'
          };
          
          sinon.stub(global, 'fetch').resolves(mockResponse);
          
          const resolved = { url: 'https://example.com/404', filename: '404' };
          
          try {
              await adapter.fetch(resolved, testDir);
              expect.fail('Should have thrown');
          } catch (e) {
              expect(e.message).to.include('HTTP error 404');
          }
      });
  });
});
