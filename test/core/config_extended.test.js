import { expect } from 'chai';
import { ConfigManager } from '../../core/config.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ConfigManager Extended', () => {
  const testDir = path.join(os.tmpdir(), `docpkg-test-config-ext-${Date.now()}`);
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('exists() should return false if no config loaded', async () => {
    const manager = new ConfigManager(testDir);
    await manager.load();
    expect(manager.exists()).to.be.false;
  });

  it('exists() should return true if config loaded', async () => {
    await fs.writeJson(path.join(testDir, 'docpkg.json'), { sources: {} });
    const manager = new ConfigManager(testDir);
    await manager.load();
    expect(manager.exists()).to.be.true;
  });

  it('save() should default to docpkg.json if no file loaded', async () => {
    const manager = new ConfigManager(testDir);
    // No load or load failed
    manager.config = { version: '1', sources: {} };
    await manager.save();
    
    expect(await fs.pathExists(path.join(testDir, 'docpkg.json'))).to.be.true;
  });
});
