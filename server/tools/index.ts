/**
 * PUNTO DE ENTRADA CENTRAL PARA EL SISTEMA DE HERRAMIENTAS
 * 
 * Para agregar una nueva herramienta:
 * 1. Crear handler en /handlers/[nombre].ts
 * 2. Registrar en registry.ts
 * 3. Listo! Se detecta automáticamente
 */

export {
  TOOLS_REGISTRY,
  getAvailableTools,
  executeToolCall,
  generateToolPrompts,
  type ToolDefinition,
  type ToolContext,
  type ToolResponse
} from './registry';

// Re-exportar handlers para acceso directo si necesario
export * from './handlers/stripe';
export * from './handlers/denik';