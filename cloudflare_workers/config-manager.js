/**
 * Gestor de configuración para endpoints de Flowise
 * Herramienta CLI para cambiar endpoints fácilmente
 */

import { CONFIG, switchActiveEndpoint, listAvailableEndpoints } from './config.js';

/**
 * Script para cambiar endpoint activo
 * Uso: node config-manager.js set <endpoint-name>
 * Uso: node config-manager.js list
 * Uso: node config-manager.js add <name> <url> <chatflow-id>
 */

const command = process.argv[2];
const param1 = process.argv[3];
const param2 = process.argv[4];
const param3 = process.argv[5];

switch (command) {
  case 'list':
    console.log('📋 Endpoints disponibles:');
    console.log('');

    listAvailableEndpoints().forEach(endpoint => {
      const status = endpoint.active ? '🟢 ACTIVO' : '⚪ Disponible';
      console.log(`${status} ${endpoint.name}`);
      console.log(`   📍 ${endpoint.url}`);
      console.log(`   🆔 ${endpoint.chatflowId}`);
      console.log(`   📝 ${endpoint.description}`);
      console.log('');
    });
    break;

  case 'set':
    if (!param1) {
      console.error('❌ Error: Especifica el nombre del endpoint');
      console.log('💡 Uso: node config-manager.js set <endpoint-name>');
      process.exit(1);
    }

    try {
      const newConfig = switchActiveEndpoint(param1);
      console.log(`✅ Endpoint activo cambiado a: ${param1}`);
      console.log(`📍 URL: ${newConfig.url}`);
      console.log(`🆔 Chatflow ID: ${newConfig.chatflowId}`);
      console.log('');
      console.log('🔄 Para aplicar cambios, ejecuta: npm run deploy');
    } catch (error) {
      console.error('❌ Error:', error.message);
      console.log('');
      console.log('📋 Endpoints disponibles:');
      listAvailableEndpoints().forEach(ep => {
        console.log(`   • ${ep.name}`);
      });
    }
    break;

  case 'add':
    if (!param1 || !param2 || !param3) {
      console.error('❌ Error: Faltan parámetros');
      console.log('💡 Uso: node config-manager.js add <name> <url> <chatflow-id>');
      console.log('📝 Ejemplo: node config-manager.js add testing https://test.fly.dev abc123-def456');
      process.exit(1);
    }

    CONFIG.flowise.endpoints[param1] = {
      url: param2,
      chatflowId: param3,
      apiKey: true,
      name: `Custom ${param1}`,
      description: 'Endpoint agregado dinámicamente'
    };

    console.log(`✅ Endpoint '${param1}' agregado exitosamente`);
    console.log(`📍 URL: ${param2}`);
    console.log(`🆔 Chatflow ID: ${param3}`);
    console.log('');
    console.log('💡 Para usarlo: node config-manager.js set ' + param1);
    break;

  case 'current':
    const currentConfig = CONFIG.flowise.endpoints[CONFIG.flowise.active];
    console.log('🎯 Endpoint activo:');
    console.log(`   📛 Nombre: ${CONFIG.flowise.active}`);
    console.log(`   📍 URL: ${currentConfig.url}`);
    console.log(`   🆔 Chatflow: ${currentConfig.chatflowId}`);
    console.log(`   📝 Descripción: ${currentConfig.description}`);
    break;

  case 'test':
    if (!param1) {
      console.error('❌ Error: Especifica el endpoint a probar');
      console.log('💡 Uso: node config-manager.js test <endpoint-name>');
      process.exit(1);
    }

    console.log(`🧪 Probando endpoint: ${param1}`);
    // Aquí podrías agregar lógica para hacer una llamada de prueba
    console.log('⏳ Función de testing pendiente de implementar');
    break;

  default:
    console.log('🛠️  Gestor de Configuración - Flowise Endpoints');
    console.log('');
    console.log('📋 Comandos disponibles:');
    console.log('   list                           - Lista todos los endpoints');
    console.log('   current                        - Muestra el endpoint activo');
    console.log('   set <endpoint-name>            - Cambia el endpoint activo');
    console.log('   add <name> <url> <chatflow-id> - Agrega un nuevo endpoint');
    console.log('   test <endpoint-name>           - Prueba un endpoint específico');
    console.log('');
    console.log('💡 Ejemplos:');
    console.log('   node config-manager.js list');
    console.log('   node config-manager.js set staging');
    console.log('   node config-manager.js add demo https://demo.fly.dev abc123');
}