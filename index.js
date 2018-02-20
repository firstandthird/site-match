#!/usr/bin/env node
const path = require('path');

const fileParser = require('./utils/file-parser');
const urlProcess = require('./utils/url-process');
const htmlGenerator = require('./utils/html-generator');

require('dotenv').config();

const argv = require('yargs')
  .usage('$0 <file> [domain] [options]', 'Generates screenshots according to yaml', yargs => {
    yargs.positional('file', {
      describe: 'The file to get the config from',
    }).positional('domain', {
      describe: 'optional domain to overwrite the config with'
    })
  })
  .env(true)
  .option('concurrent', {
    alias: 'c',
    describe: 'Concurrent tabs generating screenshots',
    default: 10,
    type: 'number'
  })
  .option('ws-endpoint', {
    alias: 'e',
    describe: 'WebSocket for Puppeteer to connect to'
  })
  .help('h')
  .alias('h', 'help')
  .argv;

const yaml = argv.file;
const domain = argv.domain;

(async () => {
  try {
    const config = await fileParser(yaml, { domain });
    const urlsNumber = config.urls.length;
    const devicesNumber = Object.keys(config.devices).length;
    const total = urlsNumber * devicesNumber;

    console.log(`Hitting "${config.domain}" for ${urlsNumber} URL(s) with ${devicesNumber} device(s). ${total} images expected.`);
    console.log(`Concurrency is limited to ${argv.concurrent}.`);
    const result = await urlProcess(config, argv);
    const htmlPath = path.join(result.path, 'index.html');
    await htmlGenerator.urls(htmlPath, result.list);
    console.log(`Generated HTML document at "${htmlPath}".`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
