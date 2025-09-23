/**
 * Quick runner para testing tools usando Node.js directo
 * Ejecutar con: node server/tools/run-test.js
 */

// Simple dynamic import para testing
async function runToolsTest() {
  try {
    console.log('🚀 Starting tools testing...');

    // Import del testing system
    const { testToolHandler, validateSchemaFields } = await import('./test-tools.ts');

    // 1. Validar schema primero
    console.log('\n1️⃣ Schema validation...');
    const schemaResult = await validateSchemaFields();

    if (!schemaResult.success) {
      console.log('❌ Schema validation failed, stopping tests');
      return;
    }

    // 2. Test tools individuales
    console.log('\n2️⃣ Testing chatbot tools...');

    const queryTest = await testToolHandler('query_chatbots', {
      status: 'all',
      limit: 3,
      includeStats: true
    });

    const statsTest = await testToolHandler('get_chatbot_stats', {
      period: 'week',
      compareWithPrevious: true
    });

    // 3. Summary
    const allTests = [schemaResult, queryTest, statsTest];
    const successful = allTests.filter(t => t.success).length;

    console.log(`\n📊 Final Summary: ${successful}/${allTests.length} tests passed`);

    if (successful === allTests.length) {
      console.log('🎉 All tools are working correctly!');
    } else {
      console.log('⚠️ Some tools need attention');
    }

  } catch (error) {
    console.error('❌ Test runner failed:', error.message);
  }
}

// Run tests
runToolsTest();