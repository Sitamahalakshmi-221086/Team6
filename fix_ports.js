const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith('.js') || file.endsWith('.html')) results.push(file);
  });
  return results;
}

const dirs = ['./Frontend/js', './Frontend/pages'];
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) return;
  const files = walk(dir);
  files.forEach(file => {
    const content = fs.readFileSync(file, 'utf8');
    const newContent = content.replace(/(localhost|127\.0\.0\.1):5000/g, 'localhost:5001');
    if (content !== newContent) {
      fs.writeFileSync(file, newContent, 'utf8');
      console.log(`Updated ${file}`);
    }
  });
});
