#!/usr/bin/env node

import { chromium } from 'playwright';

async function testChromium() {
  console.log('Testing Chromium installation...');
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Chromium path:', process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH);
  
  try {
    const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
    
    console.log('Launching browser...');
    const browser = await chromium.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--single-process',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Browser launched successfully!');
    
    const page = await browser.newPage();
    await page.goto('https://www.google.com');
    const title = await page.title();
    console.log('✅ Page loaded, title:', title);
    
    await browser.close();
    console.log('✅ Browser closed successfully');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testChromium();