#!/usr/bin/env node
const fs = require('fs');
const pLimit = require('p-limit');
const mkdirp = require('mkdirp');
const util = require('util');
const path = require('path');
const dirParser = require('./utils/dir-parser');
const compareFiles = require('./utils/compare-files');
const htmlGenerator = require('./utils/html-generator');

const mkdir = util.promisify(mkdirp);
const writeFile = util.promisify(fs.writeFile);

require('dotenv').config();

const argv = require('yargs')
  .usage('$0 <dir1> <dir2> [options]', 'Compares screenshots from first directory with second directory', yargs => {
    yargs.positional('dir1', {
      describe: 'Directory to compare with',
    }).positional('dir2', {
      describe: 'Directory to compare against'
    })
  })
  .env(true)
  .option('concurrent', {
    alias: 'c',
    describe: 'Concurrent comparisons',
    default: 10,
    type: 'number'
  })
  .help('h')
  .alias('h', 'help')
  .argv;

const dir1 = argv.dir1;
const dir2 = argv.dir2;

const getDomainFromDir = dir => path.parse(dir).base;

(async () => {
  try {
    const dir1Files = await dirParser(dir1);
    const dir2Files = await dirParser(dir2);
    const limit = pLimit(argv.concurrent);
    const promises = [];
    const target = `out/${getDomainFromDir(dir1)}-${getDomainFromDir(dir2)}`;
    const diff = {};
    await mkdir(target);

    dir1Files.forEach(file => {
      const fileName = path.basename(file, '.png');
      const [pageName, size] = fileName.split('-');
      const matchingFile = path.join(dir2, path.basename(file));

      if (dir2Files.indexOf(matchingFile) < 0) {
        console.log(`File "${matchingFile}" not found to be compared with "${file}"`);
        return;
      }

      if (!diff[pageName]) {
        diff[pageName] = {};
      }

      diff[pageName][size] = {
        files: [file, matchingFile],
        diff: {}
      };

      promises.push(limit(() => compareFiles(file, matchingFile, target, diff[pageName][size])));
    });

    await Promise.all(promises);
    const htmlPath = path.join(target, 'diff.html');
    const jsonPath = path.join(target, 'diff.json');

    // Get them in tandem
    await Promise.all([
      writeFile(jsonPath, JSON.stringify(diff, null, '\t')),
      htmlGenerator.diff(htmlPath, diff)
    ]);

    console.log(`Generated JSON diff at "${jsonPath}".`);
    console.log(`Generated HTML document at "${htmlPath}".`);
  } catch (e) {
    console.log(e);
    process.exit(1);
  }
})();
