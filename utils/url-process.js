const puppeteer = require('puppeteer');
const pLimit = require('p-limit');
const kebabCase = require('lodash.kebabcase');
const { URL } = require('url');
const mkdirp = require('mkdirp');
const util = require('util');
const fs = require('fs');
const chalk = require('chalk');

const config = require('dotenv-safe').load({
  allowEmptyValues: true
}).parsed;

const access = util.promisify(fs.access);

const request = async function(browser, path, setting) {
  if (!setting) {
    return;
  }

  try {
    const imagePath = `${path}/${setting.pathName}-${setting.device}.png`;
    let imageExists = true;

    try {
      imageExists = !await access(imagePath);
    } catch (e) {
      imageExists = false;
    }

    if (imageExists) {
      console.log(`Existent image for "${setting.url}" on ${setting.device}. ${chalk.yellow('Skipping')}.`);
      return Promise.resolve();
    }

    const page = await browser.newPage();
    await page.setViewport({
      width: setting.width,
      height: 800,
      deviceScaleFactor: setting.pixelRatio
    });

    console.log(`[${setting.device}] going to: ${setting.url}`);

    await page.goto(setting.url, {
      waitUntil: 'networkidle0'
    });

    if (setting.css) {
      await page.addStyleTag({ content: setting.css });
    }

    await page.screenshot({
      path: imagePath,
      fullPage: true
    });

    return page.close();
  } catch (e) {
    console.log(`Error while parsing "${setting.url}"`, e);
    // Resolving so we move on
    return Promise.resolve(e);
  }
};

module.exports = async (settings) => {
  let browser;

  if (config.WS_ENDPOINT) {
    console.log(`Connecting to browser websocket at "${config.WS_ENDPOINT}".`);
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
      let name = '';

      if (object.name) {
        name = object.name;
      } else {
        name = object.url === '/' ? 'home' : kebabCase(object.url.toLowerCase());
      }

      const url = Object.assign({}, object, {
        url: finalUrl,
        pathName: name,
        device,
      }, settings.devices[device]);

      if (settings.css) {
        url.css = url.css ? url.css + settings.css : settings.css;
      }

      urls.push(url);
    });
  });

  const promises = urls.map(u => limit(() => request(browser, dir, u)));

  try {
    await Promise.all(promises);
    await browser.close();
  } catch (e) {
    console.log(e);
  }
};
