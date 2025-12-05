import chalk from 'chalk';
import ora from 'ora';

export const logger = {
  info: (msg) => console.log(chalk.blue('ℹ'), msg),
  success: (msg) => console.log(chalk.green('✔'), msg),
  warn: (msg) => console.log(chalk.yellow('⚠'), msg),
  error: (msg) => console.error(chalk.red('✖'), msg),
  debug: (msg) => {
    if (process.env.DEBUG) {
      console.log(chalk.gray('vx'), msg);
    }
  },
  
  // Task wrapper for beautiful CLI spinners
  task: async (title, fn) => {
    const spinner = ora(title).start();
    try {
      const result = await fn(spinner);
      spinner.succeed(title);
      return result;
    } catch (error) {
      spinner.fail(`${title} failed: ${error.message}`);
      throw error;
    }
  }
};
