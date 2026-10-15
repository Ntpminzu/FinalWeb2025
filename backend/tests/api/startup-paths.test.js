import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawnSync } from 'node:child_process';
import os from 'node:os';

test('backend starts from another working directory and finds assets, migrations and the API contract', () => {
  const appUrl = new URL('../../src/app.js', import.meta.url).href;
  const pathsUrl = new URL('../../src/config/paths.js', import.meta.url).href;
  const databaseUrl = new URL('../../src/config/database.js', import.meta.url).href;
  const code = `
    import assert from 'node:assert/strict';
    import fs from 'node:fs';
    import path from 'node:path';
    const { default: app } = await import(${JSON.stringify(appUrl)});
    const { default: db } = await import(${JSON.stringify(databaseUrl)});
    const { backendRoot, migrationsDirectory, apiContractPath } = await import(${JSON.stringify(pathsUrl)});
    assert.ok(fs.existsSync(path.join(backendRoot, 'views', 'home.handlebars')));
    assert.ok(fs.existsSync(path.join(migrationsDirectory, '001_initial_schema.js')));
    assert.ok(fs.existsSync(apiContractPath));
    await db.migrate.latest();
    const server = app.listen(0, '127.0.0.1');
    await new Promise(resolve => server.once('listening', resolve));
    try {
      const base = 'http://127.0.0.1:' + server.address().port;
      assert.equal((await fetch(base + '/api/v1/health')).status, 200);
      const stylesheet = await fetch(base + '/static/style.css');
      assert.equal(stylesheet.status, 200);
      assert.ok(stylesheet.headers.get('content-type').startsWith('text/css'));
      assert.equal((await fetch(base + '/account/signin')).status, 200);
      assert.equal((await fetch(base + '/')).status, 200);
    } finally {
      await new Promise(resolve => server.close(resolve));
      await db.destroy();
      const { postgres } = await import(${JSON.stringify(new URL('../helpers/embedded-db.js', import.meta.url).href)});
      await postgres.close();
    }
  `;
  const result = spawnSync(process.execPath, ['--input-type=module', '-e', code], { cwd: os.tmpdir(), env: { ...process.env, NODE_ENV: 'test' }, encoding: 'utf8', timeout: 30000 });
  assert.equal(result.status, 0, result.stderr || result.error?.message);
});
