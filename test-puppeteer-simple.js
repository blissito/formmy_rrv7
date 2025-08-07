#!/usr/bin/env node

// Test básico para verificar que Puppeteer funciona
import puppeteer from 'puppeteer';

async function testBasicPuppeteer() {
  console.log('🧪 Testing basic Puppeteer functionality...');
  
  let browser = null;
  let page = null;
  
  try {
    browser = await puppeteer.launch({
      headless: false, // para ver qué pasa
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });
    
    console.log('✅ Browser launched');
    
    page = await browser.newPage();
    console.log('✅ Page created');
    
    // Test delay function
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    await delay(1000);
    console.log('✅ Delay function works');
    
    await page.goto('https://www.google.com', { waitUntil: 'networkidle2', timeout: 10000 });
    console.log('✅ Navigation successful');
    
    const title = await page.title();
    console.log('✅ Page title:', title);
    
    // Test selector
    await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 5000 });
    console.log('✅ Search box found');
    
    console.log('🎉 All basic tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    if (page) await page.close();
    if (browser) await browser.close();
  }
}

testBasicPuppeteer();