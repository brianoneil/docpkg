import { expect } from 'chai';
import { LockfileManager } from '../../core/lockfile.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('LockfileManager', () => {
  const testDir = path.join(os.tmpdir(), `docpkg-test-lock-${Date.now()}`);
  const lockfilePath = path.join(testDir, 'docpkg-lock.json');
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should create new lockfile structure if none exists', async () => {
    const manager = new LockfileManager(testDir);
    const data = await manager.load();
    
    expect(data.version).to.equal('1');
    expect(data.sources).to.be.empty;
  });

  it('should load existing lockfile', async () => {
    const existingData = {
      version: '1',
      lockfileVersion: 1,
      sources: {
        'test': { resolved: 'npm:test@1.0.0' }
      }
    };
    await fs.writeJson(lockfilePath, existingData);

    const manager = new LockfileManager(testDir);
    const data = await manager.load();
    
    expect(data.sources['test'].resolved).to.equal('npm:test@1.0.0');
  });

  it('should save lockfile', async () => {
    const manager = new LockfileManager(testDir);
    await manager.load();
    manager.setEntry('saved-entry', { resolved: 'npm:saved@1.0.0' });
    await manager.save();

    const content = await fs.readJson(lockfilePath);
    expect(content.sources['saved-entry'].resolved).to.equal('npm:saved@1.0.0');
    expect(content.generatedAt).to.exist;
  });

  it('should remove entry', async () => {
    const manager = new LockfileManager(testDir);
    manager.setEntry('entry1', { resolved: 'abc' });
    manager.removeEntry('entry1');
    
    expect(manager.getEntry('entry1')).to.be.undefined;
  });
});
