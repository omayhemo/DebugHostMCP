const { chromium } = require('playwright');

async function testDashboard() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  console.log('🧪 Testing dashboard fix...');
  
  // Listen for console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  try {
    // Navigate to dashboard
    await page.goto('http://localhost:5173/dashboard', { 
      waitUntil: 'networkidle',
      timeout: 10000 
    });
    
    // Wait for React to load
    await page.waitForTimeout(2000);
    
    // Check if MultiTechDashboard error exists
    const hasMultiTechError = errors.some(error => 
      error.includes('MultiTechDashboard is not defined')
    );
    
    if (hasMultiTechError) {
      console.log('❌ FAILED: MultiTechDashboard error still exists');
      console.log('Errors:', errors);
      return false;
    }
    
    // Check for the specific error we were trying to fix
    if (errors.length === 0) {
      console.log('✅ SUCCESS: Dashboard loads without MultiTechDashboard error');
      console.log('No console errors detected');
      return true;
    } else {
      console.log('❌ FAILED: Console errors still exist:');
      errors.forEach(error => console.log(`  - ${error}`));
      return false;
    }
    
  } catch (error) {
    console.log('❌ FAILED: Navigation error:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

testDashboard().then(success => {
  process.exit(success ? 0 : 1);
});