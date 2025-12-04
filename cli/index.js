import { program } from 'commander';
import fs from 'fs-extra';
import { initCommand } from './commands/init.js';
import { addCommand } from './commands/add.js';
import { installCommand } from './commands/install.js';
import { syncCommand } from './commands/sync.js';
import { listCommand } from './commands/list.js';
import { removeCommand } from './commands/remove.js';
import { indexCommand } from './commands/index.js';
import { bundleCommand } from './commands/bundle.js';
import { cleanCommand } from './commands/clean.js';
import { infoCommand } from './commands/info.js';
import { verifyCommand } from './commands/verify.js';
import { updateCommand } from './commands/update.js';
import { manifestCommand } from './commands/manifest.js';

// Load package.json to get version
const packageJson = await fs.readJson(new URL('../package.json', import.meta.url));

program
  .name('docpkg')
  .description('Documentation package manager')
  .version(packageJson.version);

program.addCommand(initCommand());
program.addCommand(addCommand());
program.addCommand(installCommand());
program.addCommand(syncCommand());
program.addCommand(listCommand());
program.addCommand(removeCommand());
program.addCommand(indexCommand());
program.addCommand(bundleCommand());
program.addCommand(cleanCommand());
program.addCommand(infoCommand());
program.addCommand(verifyCommand());
program.addCommand(updateCommand());
program.addCommand(manifestCommand());

program.parse();
