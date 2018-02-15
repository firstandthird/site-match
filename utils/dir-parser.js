const util = require('util');
const fs = require('fs');
const path = require('path');

const stats = util.promisify(fs.stat);
const readDir = util.promisify(fs.readdir);
const validExtensions = ['.png'];

module.exports = async dir => {
  if (!dir) {
    return Promise.reject('Empty parameter');
  }

  const dirStats = await stats(dir);

  if (!dirStats.isDirectory()) {
    return Promise.reject(`${dir} is not a directory`);
  }

  return readDir(dir)
    .then(f => f.map(f => path.join(dir, f)))
    .then(f => f.filter(f => validExtensions.indexOf(path.extname(f)) > -1));
};
