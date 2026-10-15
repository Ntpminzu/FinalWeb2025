import { fileURLToPath } from 'node:url';
import path from 'node:path';

export const backendRoot = fileURLToPath(new URL('../../', import.meta.url));
export const repositoryRoot = path.dirname(backendRoot.replace(/[\\/]$/, ''));
export const migrationsDirectory = path.join(backendRoot, 'database', 'migrations');
export const seedsDirectory = path.join(backendRoot, 'database', 'seeds');
export const apiContractPath = path.join(repositoryRoot, 'docs', 'openapi-v1.yaml');
export const uploadsDirectory = () => path.resolve(backendRoot, process.env.UPLOAD_ROOT || 'uploads');
