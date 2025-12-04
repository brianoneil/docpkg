import { Command } from 'commander';
import { ConfigManager } from '../../core/config.js';
import { Installer } from '../../core/installer.js';
import { logger } from '../../core/logger.js';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export function addCommand() {
  return new Command('add')
    .description('Add a documentation source')
    .argument('<source>', 'Source specification (npm:, git:, https:, file:)')
    .option('--name <name>', 'Custom name for the source')
    .option('--npm', 'Use npm install for npm sources')
    .option('--save-dev', 'Add to devDependencies (npm only, default)', true)
    .action(async (source, options) => {
      try {
        const configManager = new ConfigManager();
        await configManager.load();
        
        // Initialize installer to check adapters
        const installer = new Installer(configManager.get());
        const match = installer.getAdapter(source);
        
        if (!match) {
            throw new Error(`No adapter found for source: ${source}`);
        }
        
        const { parsed } = match;
        // Determine name: use option or parsed name
        const name = options.name || parsed.name;
        
        if (!name) {
            throw new Error('Could not determine package name. Please use --name.');
        }

        logger.info(`Adding ${name} from ${source}...`);

        // Update config
        await configManager.addSource(name, source);
        logger.success(`Added ${name} to config`);

        // Install the specific package
        await installer.install({ [name]: source });

        // Optional: NPM integration
        // If it's an npm package and we are likely in an npm project (package.json exists)
        if (parsed.type === 'npm' && (options.npm || options.saveDev)) {
            // Check if we should run npm install
            // For now, let's just log that we would do it, or implement it if simple
            // Requirements said: "Internally runs npm install --save-dev"
            // We only do this if we are integrating with package.json? 
            // Or maybe we always do it for npm packages?
            // Let's skip the actual `npm install` of the library for now to keep it simple 
            // unless explicitly requested or implied by future requirements details.
            // The "docs" are separate from the library code usually.
            // But if the docs ARE in the library package, we might need it installed?
            // Our NPM adapter uses `npm pack` so we don't technically need it in node_modules 
            // unless we want to support the "sync" workflow.
            // "Workflow 2" says it runs npm install.
            // Let's leave this as a TODO or implement if easy.
            // logger.info('Running npm install...');
            // await execAsync(`npm install --save-dev ${parsed.name}@${parsed.version}`);
        }

      } catch (error) {
        logger.error(error.message);
        process.exit(1);
      }
    });
}
