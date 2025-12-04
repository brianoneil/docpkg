import { expect } from 'chai';
import { GitAdapter } from '../../adapters/git.js';
import sinon from 'sinon';
import child_process from 'child_process';

describe('GitAdapter', () => {
  const adapter = new GitAdapter({});

  afterEach(() => {
    sinon.restore();
  });

  describe('parse', () => {
    it('should parse git URL with default HEAD', () => {
      const result = adapter.parse('git:https://github.com/org/repo.git');
      expect(result).to.deep.include({
        type: 'git',
        url: 'https://github.com/org/repo.git',
        ref: 'HEAD',
        name: 'repo'
      });
    });

    it('should parse git URL with branch', () => {
      const result = adapter.parse('git:https://github.com/org/repo.git#main');
      expect(result).to.deep.include({
        type: 'git',
        url: 'https://github.com/org/repo.git',
        ref: 'main',
        name: 'repo'
      });
    });

    it('should parse git URL with tag', () => {
      const result = adapter.parse('git:https://github.com/org/repo.git#v1.0.0');
      expect(result).to.deep.include({
        type: 'git',
        url: 'https://github.com/org/repo.git',
        ref: 'v1.0.0',
        name: 'repo'
      });
    });

    it('should parse GitHub Gist URL', () => {
      const result = adapter.parse('git:https://gist.github.com/5d52f64a84d4.git');
      expect(result).to.deep.include({
        type: 'git',
        url: 'https://gist.github.com/5d52f64a84d4.git',
        ref: 'HEAD',
        name: '5d52f64a84d4' // It defaults to the hash/filename, so users should use --name
      });
    });

    it('should return null for non-git sources', () => {
      expect(adapter.parse('npm:uuid')).to.be.null;
      expect(adapter.parse('file:./docs')).to.be.null;
    });
  });

  describe('resolve', () => {
      it('should resolve ref to commit hash using git ls-remote', async () => {
          // Mock child_process.exec
          // execAsync uses util.promisify(exec). 
          // We need to stub child_process.exec which is what util.promisify wraps, 
          // BUT util.promisify returns a new function.
          // It's easier to stub the execAsync function on the module if we exported it, 
          // but we didn't. We imported exec from child_process.
          // So we stub child_process.exec.
          
          const execStub = sinon.stub(child_process, 'exec').yields(null, { stdout: 'abcdef123456\trefs/heads/main\n' });
          
          const parsed = {
              url: 'https://github.com/org/repo.git',
              ref: 'main'
          };
          
          const resolved = await adapter.resolve(parsed);
          
          expect(resolved.commit).to.equal('abcdef123456');
          expect(resolved.resolved).to.equal('git:https://github.com/org/repo.git#abcdef123456');
          
          expect(execStub.called).to.be.true;
          expect(execStub.firstCall.args[0]).to.include('git ls-remote');
      });

      it('should accept full commit hash directly', async () => {
          const execStub = sinon.stub(child_process, 'exec').yields(null, { stdout: '' }); // ls-remote returns empty
          
          const commitHash = 'a'.repeat(40);
          const parsed = {
              url: 'https://github.com/org/repo.git',
              ref: commitHash
          };
          
          const resolved = await adapter.resolve(parsed);
          expect(resolved.commit).to.equal(commitHash);
      });
  });
});
