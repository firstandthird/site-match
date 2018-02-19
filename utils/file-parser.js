const fs = require('fs');
const yaml = require('js-yaml');
const Joi = require('joi');
const util = require('util');
const fetch = require('node-fetch');
const { URL } = require('url');
const access = util.promisify(fs.access);
const readFile = util.promisify(fs.readFile);

const schema = Joi.object().keys({
  domain: Joi.string().uri().required(),
  css: Joi.string().optional(),
  devices: Joi.object().pattern(/\w/, Joi.object().keys({
    width: Joi.number(),
    pixelRatio: Joi.number().optional().default(1)
  })),
  sitemap: Joi.object().keys({
    path: Joi.string().required(),
    ignore: Joi.array().items(Joi.string())
  }).optional(),
  urls: Joi.array().items(Joi.object().keys({
    url: Joi.string().required(),
    name: Joi.string().optional(),
    css: Joi.string().optional()
  }))
});

module.exports = async (file, def) => {
  const defaults = {};

  Object.keys(def).forEach(k => {
    if (!!def[k]) {
      defaults[k] = def[k];
    }
  });

  try {
    const isAccessable = !await access(file, fs.constants.R_OK);

    if (isAccessable) {
      const data = await readFile(file, 'utf-8');
      const yamlParse = yaml.safeLoad(data);
      const parsed = Object.assign({}, yamlParse, defaults);

      if (parsed.sitemap) {
        console.log('URLs are coming from sitemap at "%s"', parsed.sitemap.path);
        const sitemapUrl = new URL(parsed.sitemap.path, parsed.domain);
        const response = await fetch(sitemapUrl);
        const sitemap = await response.json();
        const currentUrls = parsed.urls.map(u => u.url);

        sitemap.forEach(url => {
          if (currentUrls.indexOf(url) < 0) {
            parsed.urls.push({ url });
          }
        });

        if (parsed.sitemap.ignore) {
          const regexes = parsed.sitemap.ignore.map(r => new RegExp(r));
          parsed.urls = parsed.urls.filter(o => !regexes.some(r => r.exec(o.url)));
        }
      }

      return Joi.validate(parsed, schema);
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
