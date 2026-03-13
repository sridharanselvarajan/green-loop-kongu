const fs = require('fs');
const path = require('path');

const directoryPath = path.join(__dirname, 'src');

function walkDir(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walkDir(file));
    } else if (file.endsWith('.js')) {
      results.push(file);
    }
  });
  return results;
}

const files = walkDir(directoryPath);
let modifiedFiles = 0;

const API_URL_PLACEHOLDER = 'process.env.REACT_APP_API_URL || "http://localhost:3000"';
const YOLO_URL_PLACEHOLDER = 'process.env.REACT_APP_YOLO_API_URL || "http://127.0.0.1:8000"';

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let originalContent = content;

  // Replace "http://localhost:3000/path" (double-quoted, non-template) with template literal
  content = content.replace(/"http:\/\/localhost:3000([^"]*)"/g, (_, p1) => {
    return '`${' + API_URL_PLACEHOLDER + '}' + p1 + '`';
  });

  // Replace `http://localhost:3000${...}` (already inside backtick template)
  content = content.replace(/`http:\/\/localhost:3000([^`]*)`/g, (_, p1) => {
    return '`${' + API_URL_PLACEHOLDER + '}' + p1 + '`';
  });

  // Replace "http://127.0.0.1:8000/path" (double-quoted) with template literal
  content = content.replace(/"http:\/\/127\.0\.0\.1:8000([^"]*)"/g, (_, p1) => {
    return '`${' + YOLO_URL_PLACEHOLDER + '}' + p1 + '`';
  });

  // Replace `http://127.0.0.1:8000...` (already inside backtick)
  content = content.replace(/`http:\/\/127\.0\.0\.1:8000([^`]*)`/g, (_, p1) => {
    return '`${' + YOLO_URL_PLACEHOLDER + '}' + p1 + '`';
  });

  if (content !== originalContent) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${file}`);
    modifiedFiles++;
  }
});

console.log(`\nDone. Updated ${modifiedFiles} files.`);
