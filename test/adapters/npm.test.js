import { expect } from 'chai';
import { NpmAdapter } from '../../adapters/npm.js';

describe('NpmAdapter', () => {
  const adapter = new NpmAdapter({});

  describe('parse', () => {
    it('should parse simple npm package', () => {
      const result = adapter.parse('npm:uuid@9.0.0');
      expect(result).to.deep.include({
        type: 'npm',
        name: 'uuid',
        version: '9.0.0'
      });
    });

    it('should default to latest version', () => {
      const result = adapter.parse('npm:uuid');
      expect(result).to.deep.include({
        type: 'npm',
        name: 'uuid',
        version: 'latest'
      });
    });

    it('should parse scoped package', () => {
      const result = adapter.parse('npm:@scope/pkg@1.2.3');
      expect(result).to.deep.include({
        type: 'npm',
        name: '@scope/pkg',
        version: '1.2.3'
      });
    });

    it('should parse scoped package without version', () => {
      const result = adapter.parse('npm:@scope/pkg');
      expect(result).to.deep.include({
        type: 'npm',
        name: '@scope/pkg',
        version: 'latest'
      });
    });

    it('should return null for non-npm sources', () => {
      expect(adapter.parse('git:https://github.com/foo/bar')).to.be.null;
      expect(adapter.parse('https://example.com/foo')).to.be.null;
    });
  });
});
