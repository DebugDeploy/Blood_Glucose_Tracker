import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Load the project-level .env file from the server or repository root.
const envFile = fileURLToPath(new URL('../../.env', import.meta.url));
dotenv.config({ path: envFile });
