import { expect } from 'chai';
import { manifestCommand } from '../../cli/commands/manifest.js';

// We can't easily test the inquirer prompts without significant mocking,
// but we can verify the file exports correctly.
describe('Manifest Command', () => {
  it('should export manifestCommand function', () => {
    expect(typeof manifestCommand).to.equal('function');
  });
});
