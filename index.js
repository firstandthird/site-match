#!/usr/bin/env node
const fileParser = require('./utils/file-parser');
const urlProcess = require('./utils/url-process');

const args = process.argv.slice(2);
const yaml = args[0];
const domain = args[1];

(async () => {
  try {
    const config = await fileParser(yaml, { domain });

    console.log(`Hitting "${config.domain}" for ${config.urls.length} URL(s) with ${Object.keys(config.devices).length} device(s)`);
    urlProcess(config);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
