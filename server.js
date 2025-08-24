// Custom server with CORS support for /api/sdk/chat
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequestHandler } from '@react-router/express';
import * as build from './build/server/index.js';
import { emailScheduler } from './server/email-scheduler.server.js';

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
  
  // Initialize email scheduler
  console.log('[Server] Email scheduler is starting...');
  
  // Run job immediately on startup (for testing)
  setTimeout(() => {
    emailScheduler.runAllJobs().catch(error => {
      console.error('[Server] Email scheduler startup job failed:', error);
    });
  }, 5000); // Wait 5 seconds after server starts
  
  // Schedule daily job at 9 AM
  const scheduleNextJob = () => {
    const now = new Date();
    const nextJob = new Date();
    nextJob.setHours(9, 0, 0, 0); // 9 AM
    
    // If it's already past 9 AM today, schedule for tomorrow
    if (now.getTime() > nextJob.getTime()) {
      nextJob.setDate(nextJob.getDate() + 1);
    }
    
    const timeUntilJob = nextJob.getTime() - now.getTime();
    console.log(`[Server] Next email job scheduled for ${nextJob.toISOString()}`);
    
    setTimeout(() => {
      emailScheduler.runAllJobs().catch(error => {
        console.error('[Server] Scheduled email job failed:', error);
      });
      
      // Schedule the next job (24 hours later)
      setTimeout(scheduleNextJob, 1000);
    }, timeUntilJob);
  };
  
  scheduleNextJob();
  console.log('[Server] Email scheduler initialized successfully');
});
