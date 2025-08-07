#!/usr/bin/env node

// Test del servicio completo
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

puppeteer.use(StealthPlugin());

class TestPuppeteerService {
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async testSearch() {
    console.log('🔍 Testing Puppeteer search service...');
    
    let browser = null;
    let page = null;
    
    try {
      browser = await puppeteer.launch({
        headless: false,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage'
        ]
      });
      
      console.log('✅ Browser launched with stealth');
      
      page = await browser.newPage();
      
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
      
      console.log('✅ Page created with user agent');
      
      await page.goto('https://www.google.com', {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      console.log('✅ Navigated to Google');
      
      await this.delay(2000);
      console.log('✅ Delay function works');
      
      await page.waitForSelector('textarea[name="q"], input[name="q"]', { timeout: 5000 });
      console.log('✅ Search box found');
      
      await page.click('textarea[name="q"], input[name="q"]');
      await this.delay(500);
      
      await page.keyboard.type('test search');
      console.log('✅ Text typed');
      
      await this.delay(1000);
      await page.keyboard.press('Enter');
      console.log('✅ Enter pressed');
      
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 });
      console.log('✅ Navigation after search completed');
      
      const url = page.url();
      console.log('🔗 Final URL:', url);
      
      if (url.includes('/sorry/')) {
        console.log('⚠️  Google might be blocking us');
      } else {
        console.log('✅ Search appears successful');
      }
      
      console.log('🎉 Service test completed!');
      
    } catch (error) {
      console.error('❌ Service test failed:', error.message);
    } finally {
      if (page) await page.close();
      if (browser) await browser.close();
    }
  }
}

const service = new TestPuppeteerService();
service.testSearch();