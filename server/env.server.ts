/**
 * Load environment variables from .env file
 * Solo en development - en production Fly.io maneja las env vars
 */
import 'dotenv/config';

// Re-export process.env para que otros módulos puedan importarlo
export const env = process.env;
