import { expect } from 'chai';
import { ConfigManager } from '../../core/config.js';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('ConfigManager', () => {
  const testDir = path.join(os.tmpdir(), `docpkg-test-config-${Date.now()}`);
  
  beforeEach(async () => {
    await fs.ensureDir(testDir);
  });

  afterEach(async () => {
    await fs.remove(testDir);
  });

  it('should load default config when no file exists', async () => {
    const manager = new ConfigManager(testDir);
    await manager.load();
    const config = manager.get();
    
    expect(config.version).to.equal('1');
    expect(config.installPath).to.equal('docs');
    expect(config.sources).to.be.empty;
  });

  it('should load docpkg.json', async () => {
    await fs.writeJson(path.join(testDir, 'docpkg.json'), {
      installPath: 'custom-docs',
      sources: {
        'test-pkg': 'npm:test@1.0.0'
      }
    });

    const manager = new ConfigManager(testDir);
    await manager.load();
    const config = manager.get();
    
    expect(config.installPath).to.equal('custom-docs');
    expect(config.sources['test-pkg']).to.equal('npm:test@1.0.0');
  });

  it('should load package.json docs field', async () => {
    await fs.writeJson(path.join(testDir, 'package.json'), {
      name: 'test-app',
      docs: {
        installPath: 'pkg-docs',
        sources: {
          'pkg-source': 'npm:pkg@2.0.0'
        }
      }
    });

    const manager = new ConfigManager(testDir);
    await manager.load();
    const config = manager.get();
    
    expect(config.installPath).to.equal('pkg-docs');
    expect(config.sources['pkg-source']).to.equal('npm:pkg@2.0.0');
  });

  it('should save changes to docpkg.json', async () => {
    await fs.writeJson(path.join(testDir, 'docpkg.json'), {
        version: '1',
        installPath: 'docs',
        sources: {}
    });

    const manager = new ConfigManager(testDir);
    await manager.load();
    await manager.addSource('new-source', 'npm:new@1.0.0');

    const content = await fs.readJson(path.join(testDir, 'docpkg.json'));
    expect(content.sources['new-source']).to.equal('npm:new@1.0.0');
  });

  it('should remove source from config', async () => {
    await fs.writeJson(path.join(testDir, 'docpkg.json'), {
        version: '1',
        installPath: 'docs',
        sources: {
            'toremove': 'npm:foo@1.0.0'
        }
    });

    const manager = new ConfigManager(testDir);
    await manager.load();
    const result = await manager.removeSource('toremove');
    
    expect(result).to.be.true;
    
    const content = await fs.readJson(path.join(testDir, 'docpkg.json'));
    expect(content.sources['toremove']).to.be.undefined;
  });
});
