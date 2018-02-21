const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const path = require('path');
const chalk = require('chalk');

const parseFile = path => new Promise(resolve => {
  const value = fs.createReadStream(path)
    .pipe(new PNG()).on('parsed', () => {
      resolve(value)
    });
});

const saveDiff = (diff, path) => new Promise(resolve => {
  const writableStream = fs.createWriteStream(path);

  writableStream.on('finish', () => resolve());

  diff.pack().pipe(writableStream);
});

module.exports = async (file1, file2, output, json) => {
  const [img1, img2] = await Promise.all([
    parseFile(file1),
    parseFile(file2)
  ]);

  const diff = new PNG({width: img1.width, height: img1.height});
  const score = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
    threshold: 0.1,
    includeAA: true
  });
  const comparePath = path.join(output, path.basename(file1));
  const totalPixels = img1.width * img1.height;
  const percent = ((score * 100) / totalPixels);

  let color = 'green';

  if (percent >= 10 && percent < 40) {
    color = 'yellow';
  } else if (percent >= 40) {
    color = 'red';
  }

  json.diff = {
    percent: `${percent.toFixed(2)}%`,
    color,
    output: comparePath
  };

  console.log(`"${file1}" vs "${file2}": ${chalk[color](json.diff.percent)}`);
  return saveDiff(diff, comparePath);
};
