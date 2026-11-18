import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(root, 'dist');
fs.rmSync(output, { recursive: true, force: true });
fs.mkdirSync(output, { recursive: true });
for (const name of ['index.html', 'pages', 'css', 'js', 'assets', '_headers']) {
  const source = path.join(root, name);
  if (!fs.existsSync(source)) throw new Error(`Required site asset is missing: ${name}`);
  fs.cpSync(source, path.join(output, name), { recursive: true });
}
console.log(`Static website built at ${output} (private files and Express backend excluded).`);
