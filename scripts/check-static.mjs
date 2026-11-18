import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = [path.join(root, 'index.html'),
  ...fs.readdirSync(path.join(root, 'pages')).filter(name => name.endsWith('.html'))
    .map(name => path.join(root, 'pages', name))];
let total = 0;
const problems = [];
for (const filename of htmlFiles) {
  const html = fs.readFileSync(filename, 'utf8');
  // Verify local assets linked with src/href (including queryless filenames).
  for (const match of html.matchAll(/\b(?:src|href)\s*=\s*(["'])([^"']+)\1/g)) {
    const link = match[2].split(/[?#]/)[0];
    if (/^(?:https?:|mailto:|tel:|#|data:|\/\/)/i.test(link) || !link) continue;
    const target = path.resolve(path.dirname(filename), link);
    total++;
    if (!target.startsWith(root + path.sep) && target !== root) {
      problems.push(`${path.relative(root, filename)}: path escapes project (${link})`);
    } else if (!fs.existsSync(target)) {
      problems.push(`${path.relative(root, filename)}: missing ${link}`);
    }
  }
}
if (problems.length) {
  console.error(problems.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${htmlFiles.length} HTML pages and ${total} local links; all linked files exist.`);
}
