const Docker = require('dockerode');

async function testDocker() {
  console.log('Testing Docker connection...');
  
  try {
    // Try default connection
    const docker = new Docker();
    
    console.log('Attempting ping...');
    const start = Date.now();
    
    // Set a timeout
    const timeout = setTimeout(() => {
      console.log('Ping timeout after 5 seconds');
      process.exit(1);
    }, 5000);
    
    await docker.ping();
    clearTimeout(timeout);
    
    const duration = Date.now() - start;
    console.log(`✓ Docker ping successful in ${duration}ms`);
    
    // Try to list containers
    const containers = await docker.listContainers({ all: true });
    console.log(`✓ Found ${containers.length} containers`);
    
    process.exit(0);
  } catch (error) {
    console.error('✗ Docker test failed:', error.message);
    process.exit(1);
  }
}

testDocker();