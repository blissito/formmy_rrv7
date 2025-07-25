// Custom server with CORS support for /api/sdk/chat
import express from 'express';
import cors from 'cors';
import { createRequestHandler } from '@react-router/express';
import * as build from './build/server/index.js';

const app = express();

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
});
