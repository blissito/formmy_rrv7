#!/usr/bin/env node

import { getPuppeteerWebSearchService } from './app/tools/webSearchPuppeteer.server.js';

async function testPuppeteerSearch() {
  console.log('🧪 Testing Puppeteer web search service...');
  
  try {
    const service = await getPuppeteerWebSearchService();
    console.log('✅ Service initialized');
    
    const results = await service.search('test search', 3);
    console.log('✅ Search completed');
    console.log(`📊 Found ${results.results.length} results`);
    
    if (results.results.length > 0) {
      console.log('📋 First result:', {
        title: results.results[0].title,
        url: results.results[0].url,
        snippet: results.results[0].snippet.substring(0, 100) + '...'
      });
    }
    
    await service.close();
    console.log('✅ Service closed successfully');
    console.log('🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

testPuppeteerSearch();