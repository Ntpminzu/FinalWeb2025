import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import Handlebars from 'handlebars';

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry =>
    entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]
  );
}

const sourceFiles = ['app.js', ...walk('controllers'), ...walk('daos'), ...walk('middlewares'), ...walk('models'), ...walk('routes'), ...walk('utils')]
  .filter(file => file.endsWith('.js'));

for (const file of sourceFiles) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
for (const file of walk('views').filter(file => file.endsWith('.handlebars'))) {
  Handlebars.precompile(fs.readFileSync(file, 'utf8'));
}

console.log(`Validated ${sourceFiles.length} JavaScript files and all Handlebars templates.`);
