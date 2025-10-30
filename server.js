// Custom server with CORS support for /api/sdk/chat
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequestHandler } from '@react-router/express';
import * as build from './build/server/index.js';
import { registerWeeklyEmailsWorker } from './server/jobs/workers/weekly-emails-worker.js';

// Configuramos __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Servir archivos estáticos desde build/client y public
app.use(express.static(path.join(__dirname, 'build/client')));
app.use(express.static(path.join(__dirname, 'public')));

// CORS middleware solo para la ruta /api/sdk/chat
app.use('/api/sdk/chat', cors({
  origin: '*', // Permitir cualquier origen
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key', 'Accept', 'Authorization', 'X-Requested-With'],
  credentials: false
}));

// No necesitamos un manejador manual de OPTIONS, el middleware cors() ya lo maneja automáticamente

// Handler de React Router para todas las rutas
app.all(
  '*',
  createRequestHandler({
    build
  })
);

const port = process.env.PORT || 3000;
app.listen(port, async () => {
  console.log(`Server listening on port ${port}`);

  // Initialize Agenda.js weekly emails worker
  console.log('[Server] Registering weekly emails worker...');
  try {
    await registerWeeklyEmailsWorker();
    console.log('[Server] ✅ Weekly emails worker registered (runs every Monday at 9:00 AM)');
  } catch (error) {
    console.error('[Server] ❌ Failed to register weekly emails worker:', error);
  }
});
