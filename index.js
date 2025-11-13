#!/usr/bin/env node

const { Command } = require('commander');
const fs = require('fs');
const readline = require('readline');

const program = new Command();

program
  .name('appender')
  .description('CLI tool to append content to a file')
  .version('1.0.0')
  .requiredOption('-f, --file <file>', 'file to append to')
  .option('-c, --content <content>', 'content to append');

program.parse();

const options = program.opts();

let content = options.content;

if (!content) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter content to append: ', (answer) => {
    content = answer;
    rl.close();
    appendToFile(options.file, content);
  });
} else {
  appendToFile(options.file, content);
}

function appendToFile(file, content) {
  fs.appendFile(file, content + '\n', (err) => {
    if (err) {
      console.error('Error appending to file:', err);
    } else {
      console.log(`Content appended to ${file}`);
    }
  });
}