import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import Handlebars from 'handlebars';
import { backendRoot } from '../src/config/paths.js';

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}

const sourceFiles = [path.join(backendRoot, 'knexfile.js'), ...['src', 'database', 'tests', 'scripts'].flatMap(folder => walk(path.join(backendRoot, folder)))].filter(file => file.endsWith('.js'));
for (const file of sourceFiles) {
  execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  const relative = path.relative(backendRoot, file).replaceAll('\\', '/');
  const source = fs.readFileSync(file, 'utf8');
  const imports = [...source.matchAll(/(?:from\s*|import\s*\()\s*['"]([^'"]+)['"]/g)].map(match => match[1]);
  for (const specifier of imports.filter(value => value.startsWith('.'))) {
    if (!fs.existsSync(path.resolve(path.dirname(file), specifier))) throw new Error(`${relative}: missing import ${specifier}`);
  }
  if (relative.includes('/controllers/')) {
    if (imports.some(value => /\/repositories\/|\/database(?:\/|\.js)|\/utils\/db\.js/.test(value))) throw new Error(`${relative} must access persistence through a service.`);
    if (imports.some(value => value.includes('/controllers/'))) throw new Error(`${relative} must import shared response mapping from dto/, not another controller.`);
  }
  if (relative.includes('/services/')) {
    if (/\breq\.|\bres\./.test(source)) throw new Error(`${relative} must not depend on Express request/response.`);
    if (imports.some(value => /config\/database\.js|utils\/db\.js|^knex$|^pg$/.test(value)) || /\b(?:db|trx)\(/.test(source)) throw new Error(`${relative} must access the database through a repository.`);
  }
}
for (const file of walk(path.join(backendRoot, 'views')).filter(file => file.endsWith('.handlebars'))) Handlebars.precompile(fs.readFileSync(file, 'utf8'));
console.log(`Validated ${sourceFiles.length} JavaScript files, module boundaries, local imports and all Handlebars templates.`);
