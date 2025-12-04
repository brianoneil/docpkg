import fs from 'fs-extra';

export default {
  ...fs,
  isDirectory: async (path) => {
    try {
      const stats = await fs.stat(path);
      return stats.isDirectory();
    } catch {
      return false;
    }
  },
  isFile: async (path) => {
    try {
      const stats = await fs.stat(path);
      return stats.isFile();
    } catch {
      return false;
    }
  }
};
