import dotenv from 'dotenv';
import path from 'node:path';
import { backendRoot } from './paths.js';

dotenv.config({ path: path.join(backendRoot, '.env'), quiet: true });
