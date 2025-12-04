import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import yaml from 'yaml';

const DEFAULT_CONFIG = {
  version: '1',
  installPath: 'docs',
  structure: 'nested',
  sources: {},
  cache: {
    enabled: true,
    path: path.join(os.homedir(), '.docpkg', 'cache')
  },
  plugins: []
};

export class ConfigManager {
  constructor(cwd = process.cwd()) {
    this.cwd = cwd;
    this.config = { ...DEFAULT_CONFIG };
  }

  async load() {
    // Priority 1: docpkg.json
    const docpkgJsonPath = path.join(this.cwd, 'docpkg.json');
    if (await fs.pathExists(docpkgJsonPath)) {
      const content = await fs.readJson(docpkgJsonPath);
      this.merge(content);
      this.loadedFile = docpkgJsonPath;
      this.fileType = 'json';
      return this.config;
    }

    // Priority 2: package.json "docs" field
    const packageJsonPath = path.join(this.cwd, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const pkg = await fs.readJson(packageJsonPath);
      if (pkg.docs) {
        this.merge(pkg.docs);
        this.loadedFile = packageJsonPath;
        this.fileType = 'package.json';
        return this.config;
      }
    }

    // Priority 3: .docpkg.yaml
    const yamlPath = path.join(this.cwd, '.docpkg.yaml');
    if (await fs.pathExists(yamlPath)) {
      const content = await fs.readFile(yamlPath, 'utf8');
      const parsed = yaml.parse(content);
      this.merge(parsed);
      this.loadedFile = yamlPath;
      this.fileType = 'yaml';
      return this.config;
    }
    
    // Default fallback if nothing exists, usually we might want to throw or return defaults
    // If we want to save, we default to docpkg.json
    this.loadedFile = docpkgJsonPath; 
    this.fileType = 'json';

    return this.config;
  }

  async addSource(name, sourceSpec) {
      this.config.sources[name] = sourceSpec;
      await this.save();
  }

  async removeSource(name) {
      if (this.config.sources[name]) {
          delete this.config.sources[name];
          await this.save();
          return true;
      }
      return false;
  }

  async save() {
      if (!this.loadedFile) {
          throw new Error('No config file loaded to save to.');
      }
      
      if (this.fileType === 'package.json') {
          const pkg = await fs.readJson(this.loadedFile);
          pkg.docs = this.config; // Update the docs field
          // We might want to preserve other fields in config that are merged? 
          // For now assuming this.config maps 1:1 to pkg.docs structure
          await fs.writeJson(this.loadedFile, pkg, { spaces: 2 });
      } else if (this.fileType === 'yaml') {
          await fs.writeFile(this.loadedFile, yaml.stringify(this.config));
      } else {
          await fs.writeJson(this.loadedFile, this.config, { spaces: 2 });
      }
  }


  merge(newConfig) {
    // Simple merge for now, can be improved for deep merging if needed
    this.config = {
      ...this.config,
      ...newConfig,
      sources: { ...this.config.sources, ...newConfig.sources },
      cache: { ...this.config.cache, ...newConfig.cache }
    };
  }

  validate() {
    if (!this.config.version) {
      throw new Error('Config version is required');
    }
    if (!this.config.installPath) {
      throw new Error('installPath is required');
    }
    // Add more validation as needed
  }
  
  get() {
    return this.config;
  }
}
