#!/usr/bin/env node
const pLimit = require('p-limit');
const dirParser = require('./utils/dir-parser');
const compareFiles = require('./utils/compare-files');
const mkdirp = require('mkdirp');
const util = require('util');
const path = require('path');

const mkdir = util.promisify(mkdirp);
const args = process.argv.slice(2);
const dir1 = args[0];
const dir2 = args[1];

if (!dir1) {
  console.log('Directory to compare with is missing');
  process.exit(1);
}

if (!dir2) {
  console.log('Directory to compare against is missing');
  process.exit(1);
}

const getDomainFromDir = dir => path.parse(dir).base;

(async () => {
  try {
    const dir1Files = await dirParser(dir1);
    const dir2Files = await dirParser(dir2);
    const limit = pLimit(10);
    const promises = [];
    const target = `out/${getDomainFromDir(dir1)}-${getDomainFromDir(dir2)}`;
    await mkdirp(target);



    dir1Files.filter(file => {
      const matchingFile = path.join(dir2, path.basename(file));

      if (dir2Files.indexOf(matchingFile) < 0) {
        console.log(`File "${matchingFile}" not found to be compared with "${file}"`);
        return;
      }

      promises.push(limit(() => compareFiles(file, matchingFile, target)));
    });

    await Promise.all(promises);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
