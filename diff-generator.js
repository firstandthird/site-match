#!/usr/bin/env node
const fs = require('fs');
const util = require('util');
const path = require('path');
const htmlGenerator = require('./utils/html-generator');

const readFile = util.promisify(fs.readFile);

require('dotenv').config();

const argv = require('yargs')
  .usage('$0 <file>', 'Generates diff HTML with a diff file', yargs => {
    yargs.positional('file', {
      describe: 'The file to get the config from',
    })
  })
  .env(true)
  .help('h')
  .alias('h', 'help')
  .argv;

(async () => {
  try {
    const fileContent = await readFile(argv.file, 'utf-8');
    const newPath = path.join(path.dirname(argv.file), 'diff.html');
    const json = JSON.parse(fileContent);

    await htmlGenerator.diff(newPath, json);
    console.log(`Generated HTML document at "${newPath}".`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
