import { exec } from 'child_process';
import util from 'util';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const execAsync = util.promisify(exec);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BIN = path.resolve(__dirname, 'bin/docpkg.js');

async function run(cmd) {
  console.log(`> ${cmd}`);
  const { stdout, stderr } = await execAsync(`${BIN} ${cmd}`);
  console.log(stdout);
  if (stderr) console.error(stderr);
  return stdout;
}

async function test() {
  const testDir = 'test-playground';
  await fs.ensureDir(testDir);
  process.chdir(testDir);

  try {
    // 1. Init
    await run('init');
    if (!await fs.pathExists('docpkg.json')) throw new Error('docpkg.json not created');

    // 2. Add (using a small package)
    // uuid is small.
    await run('add npm:uuid@latest');
    
    const config = await fs.readJson('docpkg.json');
    if (!config.sources.uuid) throw new Error('uuid not added to config');
    
    if (!await fs.pathExists('docpkg-lock.json')) throw new Error('docpkg-lock.json not created');
    
    // Check installation directory
    // uuid might not have docs/ folder, so it might be empty, but the dir should exist
    if (!await fs.pathExists('docs/uuid')) throw new Error('docs/uuid directory not created');

    // 3. List
    await run('list');

    console.log('E2E TEST PASSED');

  } catch (error) {
    console.error('E2E TEST FAILED:', error);
    process.exit(1);
  } finally {
    // Cleanup
    process.chdir('..');
    await fs.remove(testDir);
  }
}

test();
