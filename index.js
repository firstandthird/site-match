#!/usr/bin/env node
const fileParser = require('./utils/file-parser');
const urlProcess = require('./utils/url-process');

const args = process.argv.slice(2);
const yaml = args[0];
const domain = args[1];

(async () => {
  try {
    const config = await fileParser(yaml, { domain });
    const urlsNumber = config.urls.length;
    const devicesNumber = Object.keys(config.devices).length;
    const total = urlsNumber * devicesNumber;

    console.log(`Hitting "${config.domain}" for ${urlsNumber} URL(s) with ${devicesNumber} device(s). ${total} images expected.`);
    await urlProcess(config);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
