#!/usr/bin/env node

import { PlaywrightWebSearchService } from './app/tools/webSearchPlaywright.server.ts';

async function testSearch() {
  console.log('Testing Playwright web search service...');
  
  const service = new PlaywrightWebSearchService();
  
  try {
    await service.initialize();
    console.log('✅ Service initialized');
    
    const results = await service.search('latest news', 3);
    console.log('✅ Search completed');
    console.log('Results:', JSON.stringify(results, null, 2));
    
    await service.close();
    console.log('✅ Service closed');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testSearch();