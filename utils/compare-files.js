const fs = require('fs');
const PNG = require('pngjs').PNG;
const pixelmatch = require('pixelmatch');
const path = require('path');

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

module.exports = async (file1, file2, output) => {
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

  console.log(`"${file1}" vs "${file2}": ${score}`);
  return saveDiff(diff, comparePath);
};
