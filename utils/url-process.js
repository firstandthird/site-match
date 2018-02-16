const puppeteer = require('puppeteer');
const pLimit = require('p-limit');
const kebabCase = require('lodash.kebabcase');
const { URL } = require('url');
const mkdirp = require('mkdirp');
const util = require('util');

const config = require('dotenv-safe').load({
  allowEmptyValues: true
}).parsed;

const request = async function(browser, path, setting) {
  if (!setting) {
    return;
  }

  const page = await browser.newPage();
  await page.setViewport({
    width: setting.width,
    height: 800
  });

  console.log(`[${setting.device}] going to: ${setting.url}`);

  await page.goto(setting.url, {
    waitUntil: 'networkidle0'
  });

  if (setting.css) {
    await page.addStyleTag({ content: setting.css });
  }

  await page.screenshot({
    path: `${path}/${setting.pathName}-${setting.device}.png`,
    fullPage: true
  });
};

module.exports = async (settings) => {
  let browser;

  if (config.WS_ENDPOINT) {
    browser = await puppeteer.connect({
      browserWSEndpoint: config.WS_ENDPOINT
    });
  } else {
    browser = await puppeteer.launch();
  }

  const limit = pLimit(10);
  const urls = [];
  const domainURL = new URL(settings.domain);
  const dir = `./out/${domainURL.hostname}`;

  await util.promisify(mkdirp)(dir);

  Object.keys(settings.devices).forEach(device => {
    settings.urls.forEach(object => {
      const finalUrl = new URL(object.url, settings.domain).toString();
      const name = object.url === '/' ? 'home' : kebabCase(object.url.toLowerCase());

      urls.push(Object.assign({}, object, {
        url: finalUrl,
        pathName: name,
        device,
      }, settings.devices[device]));
      if (settings.css) {
        url.css = url.css ? url.css + settings.css : settings.css;
      }

      urls.push(url);
    });
  });

  const promises = urls.map(u => limit(() => request(browser, dir, u)));

  await Promise.all(promises);
  await browser.close();
};
