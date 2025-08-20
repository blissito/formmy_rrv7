// Custom server with CORS support for /api/sdk/chat
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequestHandler } from '@react-router/express';
import * as build from './build/server/index.js';
import { emailScheduler } from './app/services/email-scheduler.server.js';

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
  console.log(`Server listening on port ${port}`);
  
  // Start email scheduler only in production
  if (process.env.NODE_ENV === 'production') {
    console.log('[Server] Starting email scheduler...');
    
    // Run email jobs daily at 9 AM UTC
    const scheduleEmailJobs = () => {
      const now = new Date();
      const next9AM = new Date();
      next9AM.setUTCHours(9, 0, 0, 0);
      
      // If it's already past 9 AM today, schedule for tomorrow
      if (next9AM <= now) {
        next9AM.setUTCDate(next9AM.getUTCDate() + 1);
      }
      
      const msUntil9AM = next9AM.getTime() - now.getTime();
      
      setTimeout(() => {
        emailScheduler.runAllJobs();
        
        // Schedule to run every 24 hours after the first run
        setInterval(() => {
          emailScheduler.runAllJobs();
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, msUntil9AM);
      
      console.log(`[Server] Email jobs scheduled for ${next9AM.toISOString()}`);
    };
    
    scheduleEmailJobs();
  }
});
