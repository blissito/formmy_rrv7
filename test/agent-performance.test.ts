/**
 * Test de Performance para AgentDecisionEngine
 * 
 * Verificar que las optimizaciones funcionan correctamente
 */

import { agentEngine } from '../server/chatbot/agent-decision-engine';
import { performanceMonitor } from '../server/chatbot/performance-monitor';

// Test scenarios
const testCases = [
  // Fast path scenarios (should use streaming)
  { message: "¿Cómo estás?", expected: { needsTools: false, shouldStream: true } },
  { message: "Cuéntame sobre tus servicios", expected: { needsTools: false, shouldStream: true } },
  { message: "Hola, necesito información", expected: { needsTools: false, shouldStream: true } },
  
  // Tool scenarios (should avoid streaming)
  { message: "Genera un link de pago por $1000", expected: { needsTools: true, shouldStream: false } },
  { message: "Quiero pagar servicios de SEO", expected: { needsTools: true, shouldStream: false } },
  { message: "Agendar cita para mañana", expected: { needsTools: true, shouldStream: false } },
  
  // Edge cases
  { message: "¿Puedes generar un link?", expected: { needsTools: true, shouldStream: false } },
  { message: "Necesito ayuda con pagos", expected: { needsTools: false, shouldStream: true } }, // Low confidence
];

const testContext = {
  chatbotId: 'test-chatbot',
  userId: 'test-user',
  userPlan: 'PRO' as const,
  hasStripeIntegration: true,
  modelSupportsTools: true
};

async function runPerformanceTest() {
  console.log('🚀 Starting Agent Performance Test\n');
  
  const results = [];
  
  for (const testCase of testCases) {
    console.log(`Testing: "${testCase.message}"`);
    const startTime = Date.now();
    
    const decision = await agentEngine.makeDecision(testCase.message, testContext);
    const duration = Date.now() - startTime;
    
    const result = {
      message: testCase.message,
      duration,
      decision,
      expected: testCase.expected,
      passed: decision.needsTools === testCase.expected.needsTools && 
              decision.shouldStream === testCase.expected.shouldStream
    };
    
    results.push(result);
    
    console.log(`  ⏱️  Decision Time: ${duration}ms`);
    console.log(`  🎯 Needs Tools: ${decision.needsTools} (confidence: ${decision.confidence}%)`);
    console.log(`  🚀 Should Stream: ${decision.shouldStream}`);
    console.log(`  ✅ Expected Tools: ${testCase.expected.needsTools}, Stream: ${testCase.expected.shouldStream}`);
    console.log(`  ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`);
  }
  
  // Summary
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  const passedTests = results.filter(r => r.passed).length;
  const fastDecisions = results.filter(r => r.duration < 10).length; // Should be sub-10ms for simple cases
  
  console.log('📊 Test Summary:');
  console.log(`   Tests Passed: ${passedTests}/${results.length}`);
  console.log(`   Average Decision Time: ${avgTime.toFixed(1)}ms`);
  console.log(`   Fast Decisions (<10ms): ${fastDecisions}/${results.length}`);
  
  // Performance expectations
  const performanceIssues = [];
  
  if (avgTime > 20) {
    performanceIssues.push(`Average decision time too high: ${avgTime.toFixed(1)}ms (expected <20ms)`);
  }
  
  if (fastDecisions < results.length * 0.6) {
    performanceIssues.push(`Too few fast decisions: ${fastDecisions}/${results.length} (expected >60%)`);
  }
  
  if (passedTests < results.length * 0.8) {
    performanceIssues.push(`Test pass rate too low: ${passedTests}/${results.length} (expected >80%)`);
  }
  
  if (performanceIssues.length > 0) {
    console.log('\n⚠️ Performance Issues:');
    performanceIssues.forEach(issue => console.log(`   - ${issue}`));
  } else {
    console.log('\n🎉 All performance expectations met!');
  }
  
  return {
    passed: performanceIssues.length === 0,
    results,
    avgTime,
    passedTests,
    fastDecisions
  };
}

// Run test if called directly
if (import.meta.url.endsWith(process.argv[1])) {
  runPerformanceTest()
    .then(result => {
      process.exit(result.passed ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test failed with error:', error);
      process.exit(1);
    });
}

export { runPerformanceTest };