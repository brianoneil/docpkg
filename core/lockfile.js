import fs from '../utils/fs.js';
import path from 'path';

const LOCKFILE_NAME = 'docpkg-lock.json';

export class LockfileManager {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.lockfilePath = path.join(cwd, LOCKFILE_NAME);
    this.data = {
      version: '1',
      lockfileVersion: 1,
      sources: {}
    };
  }

  async load() {
    if (await fs.pathExists(this.lockfilePath)) {
      this.data = await fs.readJson(this.lockfilePath);
    }
    return this.data;
  }

  async save() {
    this.data.generatedAt = new Date().toISOString();
    await fs.writeJson(this.lockfilePath, this.data, { spaces: 2 });
  }

  getEntry(name) {
    return this.data.sources[name];
  }

  setEntry(name, entry) {
    this.data.sources[name] = entry;
  }

  removeEntry(name) {
    delete this.data.sources[name];
  }
}
