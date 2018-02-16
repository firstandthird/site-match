const fs = require('fs');
const yaml = require('js-yaml');
const Joi = require('joi');
const util = require('util');
const access = util.promisify(fs.access);
const readFile = util.promisify(fs.readFile);

const schema = Joi.object().keys({
  domain: Joi.string().uri().required(),
  css: Joi.string().optional(),
  devices: Joi.object().pattern(/\w/, Joi.object().keys({
    width: Joi.number(),
    pixelRatio: Joi.number().optional().default(1)
  })),
  urls: Joi.array().items(Joi.object().keys({
    url: Joi.string().required(),
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

      return Joi.validate(parsed, schema);
    }
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
};
