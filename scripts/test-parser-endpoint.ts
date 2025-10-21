import { FormmyParser } from 'formmy-sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testParserEndpoint() {
  console.log('🧪 Testing Parser API v1 Endpoint\n');

  // Usar API key desde variable de entorno
  const apiKey = process.env.FORMMY_TEST_API_KEY;
  if (!apiKey) {
    throw new Error('FORMMY_TEST_API_KEY environment variable is required');
  }

  const parser = new FormmyParser({
    apiKey,
    baseUrl: 'http://localhost:3000',
  });

  console.log('📄 Creating test file...');
  const testFile = path.join(__dirname, 'test-parser-doc.txt');
  const testContent = `Test Document for Parser API

This is a simple test document to verify that the Parser API v1 endpoint is working correctly.

Features:
- Document parsing with LlamaParse
- Credit tracking
- Job status polling
- Async processing

Test Date: ${new Date().toISOString()}
`;

  fs.writeFileSync(testFile, testContent);
  console.log(`✅ Test file created: ${testFile}\n`);

  try {
    // Test 1: Upload file with DEFAULT mode (free)
    console.log('📤 Test 1: Uploading file with DEFAULT mode (free)...');
    const job = await parser.parse(testFile, 'DEFAULT');

    console.log(`✅ Job created successfully!`);
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Status: ${job.status}`);
    console.log(`   FileName: ${job.fileName}`);
    console.log(`   Mode: ${job.mode}`);
    console.log(`   Credits Used: ${job.creditsUsed}`);
    console.log('');

    // Test 2: Check job status
    console.log('🔍 Test 2: Checking job status...');
    const status = await parser.getStatus(job.id);
    console.log(`✅ Status retrieved successfully!`);
    console.log(`   Status: ${status.status}`);
    console.log(`   Created At: ${status.createdAt}`);
    console.log('');

    // Test 3: Wait for completion (with progress)
    console.log('⏳ Test 3: Waiting for job completion...');
    let lastStatus = '';
    const result = await parser.waitFor(job.id, {
      pollInterval: 2000,
      timeout: 60000,
      onProgress: (currentJob) => {
        if (currentJob.status !== lastStatus) {
          console.log(`   Status changed: ${lastStatus || 'PENDING'} → ${currentJob.status}`);
          lastStatus = currentJob.status;
        }
      }
    });

    console.log(`✅ Job completed successfully!`);
    console.log(`   Pages: ${result.pages || 'N/A'}`);
    console.log(`   Processing Time: ${result.processingTime || 'N/A'}s`);
    console.log(`   Markdown Length: ${result.markdown?.length || 0} chars`);

    if (result.markdown) {
      console.log('\n📝 First 200 chars of markdown:');
      console.log(result.markdown.substring(0, 200) + '...');
    }

    console.log('\n✅ ALL TESTS PASSED! Parser API v1 is working correctly. 🎉');

    // Cleanup
    fs.unlinkSync(testFile);

  } catch (error) {
    console.error('\n❌ TEST FAILED!');

    if (error instanceof Error) {
      console.error(`Error: ${error.name}`);
      console.error(`Message: ${error.message}`);

      // @ts-ignore
      if (error.statusCode) {
        // @ts-ignore
        console.error(`Status Code: ${error.statusCode}`);
      }
    } else {
      console.error(error);
    }

    // Cleanup
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }

    process.exit(1);
  }
}

testParserEndpoint();
