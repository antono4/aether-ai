#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import inquirer from 'inquirer';
import { Message, Conversation } from '@aether/shared-types';

const program = new Command();

console.log(chalk.magenta(figlet.textSync('Aether', { font: 'Slant' })));
console.log(chalk.gray('Personal AI Super Intelligence\n'));

program
  .name('aether')
  .description('Aether CLI - Your personal AI assistant')
  .version('0.1.0');

program
  .command('chat')
  .description('Start an interactive chat session')
  .action(async () => {
    console.log(chalk.green('Starting chat session...'));
    console.log(chalk.gray('Type your message and press Enter. Type "exit" to quit.\n'));
    
    let running = true;
    
    while (running) {
      const { message } = await inquirer.prompt([
        {
          type: 'input',
          name: 'message',
          message: chalk.cyan('You:'),
        },
      ]);
      
      if (message.toLowerCase() === 'exit') {
        running = false;
        console.log(chalk.yellow('Goodbye!'));
      } else if (message.trim()) {
        console.log(chalk.magenta('Aether: ') + chalk.white(`Echo: ${message}`));
      }
    }
  });

program
  .command('conversations')
  .description('List all conversations')
  .action(async () => {
    console.log(chalk.green('Conversations:'));
    console.log(chalk.gray('(No conversations yet)'));
  });

program
  .command('config')
  .description('Configure Aether settings')
  .action(async () => {
    console.log(chalk.green('Configuration:'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiUrl',
        message: 'API URL:',
        default: 'http://localhost:4000',
      },
      {
        type: 'input',
        name: 'model',
        message: 'Model:',
        default: 'claude-3-5-sonnet',
      },
    ]);
    
    console.log(chalk.green('\nConfiguration saved!'));
  });

program.parse();

if (!process.argv.slice(2).length) {
  program.outputHelp();
}