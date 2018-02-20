const util = require('util');
const fs = require('fs');
const path = require('path');
const writeFile = util.promisify(fs.writeFile);

const saveHTML = async (output, content) => {
  const file = `<!doctype html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport"
          content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <title>Output</title>
</head>
<body>
${content}
</body>
</html>`;

  return writeFile(output, file);
};

module.exports.urls = async (output, dict) => {
  let html = '';

  Object.keys(dict).forEach(name => {
    const list = dict[name];
    html += `<h2>${name}</h2>`;
    html += '<ul>';
    Object.keys(list).forEach(k => {
      const v = list[k];
      html += `<li><a href="${path.relative(path.dirname(output), v)}">${k}</a></li>`;
    });
    html += '</ul>';
  });

  return saveHTML(output, html);
};

module.exports.diff = async (output, dict) => {
  let html = '';

  Object.keys(dict).forEach(name => {
    const list = dict[name];
    html += `<h2>${name}</h2>`;
    html += '<ul>';

    Object.keys(list).forEach(k => {
      const v = list[k];
      const [original, compared] = v.files;
      const diff = v.diff.output;
      html += `<li><h3>${k} (${v.diff.percent})</h3><ul>`;
      html += `
<li><a href="${path.relative(path.dirname(output), original)}">Original</a></li>
<li><a href="${path.relative(path.dirname(output), compared)}">Compared</a></li>
<li><a href="${path.relative(path.dirname(output), diff)}">Diff</a></li>
`;
      html += '</ul></li>';
    });
    html += '</ul>';
  });

  return saveHTML(output, html);
};
