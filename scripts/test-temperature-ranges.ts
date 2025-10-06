/**
 * Script para probar que los rangos de temperatura funcionan correctamente
 */
import { getTemperatureRange, MODEL_TEMPERATURE_RANGES } from '../server/config/model-temperatures';

console.log('\n🧪 Testing Temperature Ranges\n');

// Modelos a probar
const testModels = [
  'gpt-5-nano',
  'gpt-4o-mini',
  'gpt-5-mini',
  'claude-3-haiku-20240307',
  'claude-3-5-haiku-20241022',
  'gpt-3.5-turbo',
  'modelo-desconocido', // Para probar fallback
];

console.log('📋 Configuración de rangos por modelo:\n');

testModels.forEach(model => {
  const range = getTemperatureRange(model);
  const isFallback = !MODEL_TEMPERATURE_RANGES[model];

  console.log(`${isFallback ? '⚠️ ' : '✅'} ${model}:`);
  console.log(`   Min: ${range.min} | Max: ${range.max} | Óptimo: ${range.optimal} | Step: ${range.step}`);
  if (range.fixed) {
    console.log(`   🔒 Temperatura FIJA en ${range.optimal}`);
  }
  if (isFallback) {
    console.log(`   (usando configuración por defecto)`);
  }
  console.log('');
});

// Verificar que gpt-5-nano esté configurado como fijo
const nanoRange = getTemperatureRange('gpt-5-nano');
if (nanoRange.fixed && nanoRange.optimal === 1 && nanoRange.min === 1 && nanoRange.max === 1) {
  console.log('✅ GPT-5-nano correctamente configurado como temperatura fija en 1.0\n');
} else {
  console.log('❌ ERROR: GPT-5-nano NO está configurado correctamente como fijo\n');
}

// Verificar que todos los modelos de Claude tengan temp óptima 0.7
const claudeModels = ['claude-3-haiku-20240307', 'claude-3-5-haiku-20241022'];
const allClaudeCorrect = claudeModels.every(model => {
  const range = getTemperatureRange(model);
  return range.optimal === 0.7 && range.min === 0 && range.max === 1.5;
});

if (allClaudeCorrect) {
  console.log('✅ Todos los modelos Claude tienen temperatura óptima 0.7\n');
} else {
  console.log('❌ ERROR: Algunos modelos Claude tienen configuración incorrecta\n');
}

console.log('✨ Test completado\n');
