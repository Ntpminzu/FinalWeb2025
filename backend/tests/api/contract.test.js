import assert from 'node:assert/strict';
import fs from 'node:fs';
import { test } from 'node:test';
import SwaggerParser from '@apidevtools/swagger-parser';
import YAML from 'yaml';
import router from '../../src/routes/api.routes.js';
import { apiContractPath } from '../../src/config/paths.js';

function registeredRoutes(router) {
  return router.stack.flatMap(layer => layer.route
    ? Object.keys(layer.route.methods).map(method => `${method.toUpperCase()} ${layer.route.path.replace(/:([A-Za-z]+)/g, '{$1}')}`)
    : layer.handle?.stack ? registeredRoutes(layer.handle) : []);
}

test('OpenAPI is valid and documents every registered method/path exactly once', async () => {
  await SwaggerParser.validate(apiContractPath);
  const spec = YAML.parse(fs.readFileSync(apiContractPath, 'utf8'));
  const actual = registeredRoutes(router);
  const documented = Object.entries(spec.paths).flatMap(([url, operations]) => Object.keys(operations).map(method => `${method.toUpperCase()} ${url}`));
  assert.deepEqual(new Set(actual), new Set(documented));
  assert.equal(actual.length, documented.length);
  for (const [url, operations] of Object.entries(spec.paths)) for (const operation of Object.values(operations)) {
    if (url.startsWith('/admin/') || url.startsWith('/instructor/') || url.startsWith('/me/')) assert.deepEqual(operation.security, [{ BearerAuth: [] }]);
  }
});
