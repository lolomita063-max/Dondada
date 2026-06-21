import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  dbPath: process.env.DB_PATH || path.join(__dirname, '..', '..', '..', 'data', 'cemetery.db'),
  nominatimBaseUrl: process.env.NOMINATIM_BASE_URL || 'https://nominatim.openstreetmap.org',
  logLevel: process.env.LOG_LEVEL || 'info',
};