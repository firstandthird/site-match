const puppeteer = require('puppeteer');
const pLimit = require('p-limit');
const kebabCase = require('lodash.kebabcase');
const { URL } = require('url');
const mkdirp = require('mkdirp');
const util = require('util');
const fs = require('fs');
const chalk = require('chalk');

const access = util.promisify(fs.access);

const request = async function(browser, setting) {
  if (!setting) {
    return Promise.resolve();
  }

  try {
    let imageExists = true;

    try {
      imageExists = !await access(setting.imagePath);
    } catch (e) {
      imageExists = false;
    }

    if (imageExists) {
      console.log(`Existent image for "${setting.url}" on ${setting.device}. ${chalk.yellow('Skipping')}.`);
      return Promise.resolve(setting.imagePath);
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
      path: setting.imagePath,
      fullPage: true
    });

    await page.close();
    return Promise.resolve(setting.imagePath);
  } catch (e) {
    console.log(`Error while parsing "${setting.url}"`, e);
    // Resolving so we move on
    return Promise.resolve(null);
  }
};

module.exports = async (settings, options) => {
  let browser;

  if (options.wsEndpoint) {
    console.log(`Connecting to browser websocket at "${options.wsEndpoint}".`);
    browser = await puppeteer.connect({
      browserWSEndpoint: options.wsEndpoint
    });
  } else {
    browser = await puppeteer.launch();
  }

  const limit = pLimit(options.concurrent);
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
        imagePath: `${dir}/${name}-${device}.png`,
        name,
        device,
      }, settings.devices[device]);

      if (settings.css) {
        url.css = url.css ? url.css + settings.css : settings.css;
      }

      urls.push(url);
    });
  });

  const list = {};

  urls.forEach(url => {
    if (!list[url.name]) {
      list[url.name] = {};
    }

    list[url.name][url.device] = url.imagePath;
  });

  const promises = urls.map(u => limit(() => request(browser, u)));

  try {
    await Promise.all(promises);
    await browser.close();

    return Promise.resolve({
      path: dir,
      list
    });
  } catch (e) {
    console.log(e);
  }
};
