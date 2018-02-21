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
    <style>
    body{font-family:system-ui,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Oxygen,Ubuntu,Cantarell,Fira Sans,Droid Sans,Helvetica Neue}.red{color:#d56b47}.green{color:#448538}.yellow{color:#9b6e00}table{border-collapse:collapse;background:#fff;border-radius:3px;box-shadow:0 0 5px rgba(0,0,0,.3);overflow:hidden}table td:first-child,table th:first-child{padding-left:16px}table td,table th{padding:10px 8px}table tr:not(:last-child){border-bottom:1px solid #e5e5e5}table th{background:#e1ecff;border-bottom:1px solid #bdbdbd;color:#007396;font-weight:400;text-align:left}.tables-wrapper{display:flex;flex-wrap:wrap;justify-content:center}.tables-wrapper table{margin:5px;min-width:24%}
</style>
</head>
<body>
${content}
</body>
</html>`;

  return writeFile(output, file);
};

module.exports.urls = async (output, dict) => {
  let html = '<div class="tables-wrapper">';

  Object.keys(dict).forEach(name => {
    const list = dict[name];
    const sizes = Object.keys(list);

    html += `<table><tbody><tr>
              <th colspan="${sizes.length}">${name}</th>
            </tr><tr>`;

    sizes.forEach(k => {
      const v = list[k];
      html += `<td><a target="_blank" href="${path.relative(path.dirname(output), v)}">${k}</a></td>`;
    });

    html += '</tr></tbody></table>';
  });

  html += '</div>';

  return saveHTML(output, html);
};

module.exports.diff = async (output, dict) => {
  let html = '<div class="tables-wrapper">';

  Object.keys(dict).forEach(name => {
    const list = dict[name];
    html += `<table><tbody><tr>
              <th colspan="4">${name}</th>
            </tr>`;

    Object.keys(list).forEach(k => {
      const v = list[k];
      const [original, compared] = v.files;
      const diff = v.diff.output;
      html += `<tr><td>${k} (<span class="${v.diff.color}">${v.diff.percent}</span>)</td>`;
      html += `
<td><a target="_blank" href="${path.relative(path.dirname(output), original)}">Original</a></td>
<td><a target="_blank" href="${path.relative(path.dirname(output), compared)}">Compared</a></td>
<td><a target="_blank" href="${path.relative(path.dirname(output), diff)}">Diff</a></td>
`;
      html += '</tr>';
    });

    html += '</tbody></table>';
  });

  html += '</div>';

  return saveHTML(output, html);
};
