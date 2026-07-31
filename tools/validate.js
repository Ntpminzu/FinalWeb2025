import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import Handlebars from 'handlebars';

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}

const sourceFiles = ['app.js', 'server.js', 'knexfile.js', ...['config', 'controllers', 'daos', 'errors', 'middlewares', 'migrations', 'models', 'routes', 'seeds', 'services', 'tests', 'utils', 'validators'].flatMap(walk)]
  .filter(file => file.endsWith('.js'));

for (const file of sourceFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });

for (const file of walk('controllers').filter(file => file.endsWith('.js'))) {
  if (fs.readFileSync(file, 'utf8').includes('/daos/')) throw new Error(`${file} must call a service instead of importing a DAO.`);
}
for (const file of walk('services').filter(file => file.endsWith('.js'))) {
  const source = fs.readFileSync(file, 'utf8');
  if (/\breq\.|\bres\./.test(source)) throw new Error(`${file} must not depend on Express request/response objects.`);
}
for (const file of walk('views').filter(file => file.endsWith('.handlebars'))) {
  Handlebars.precompile(fs.readFileSync(file, 'utf8'));
}

console.log(`Validated ${sourceFiles.length} JavaScript files and all Handlebars templates.`);
