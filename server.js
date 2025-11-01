// Custom server with CORS support for /api/sdk/chat
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequestHandler } from '@react-router/express';
import * as build from './build/server/index.js';

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
app.listen(port, () => {
  console.log(`✅ Server listening on port ${port}`);

  // Inicializar Agenda.js workers DESPUÉS de que el servidor esté listo
  // Esto NO bloquea el servidor y se ejecuta en background
  (async () => {
    try {
      const { registerWeeklyEmailsWorker } = await import('./build/server/jobs/workers/weekly-emails-worker.js');
      await registerWeeklyEmailsWorker();
      console.log('✅ Agenda.js: Weekly emails worker registered (Mondays 9:00 AM)');
    } catch (error) {
      console.error('⚠️  Agenda.js: Failed to register weekly emails worker:', error.message);
      // El servidor sigue funcionando aunque el worker falle
    }
  })();
});
