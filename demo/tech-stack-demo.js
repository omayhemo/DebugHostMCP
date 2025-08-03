#!/usr/bin/env node

const TechStackDetector = require('../src/tech-stack-detector');
const fs = require('fs').promises;
const path = require('path');

/**
 * Demonstration script for the Universal Tech Stack Detection System
 * 
 * This script shows how the TechStackDetector can automatically identify
 * different project types and generate appropriate start commands.
 */

async function createDemoProject(type, basePath) {
  const projectPath = path.join(basePath, `demo-${type}-project`);
  await fs.mkdir(projectPath, { recursive: true });

  switch (type) {
    case 'react':
      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'demo-react-app',
          version: '1.0.0',
          dependencies: {
            react: '^18.0.0',
            'react-dom': '^18.0.0'
          },
          scripts: {
            start: 'react-scripts start',
            build: 'react-scripts build',
            test: 'react-scripts test'
          }
        }, null, 2)
      );
      break;

    case 'nextjs':
      await fs.writeFile(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'demo-nextjs-app',
          dependencies: {
            next: '^13.0.0',
            react: '^18.0.0',
            'react-dom': '^18.0.0'
          },
          scripts: {
            dev: 'next dev -p 3001',
            build: 'next build',
            start: 'next start'
          }
        }, null, 2)
      );
      break;

    case 'laravel':
      await fs.writeFile(
        path.join(projectPath, 'artisan'),
        '#!/usr/bin/env php\n<?php\n// Laravel Artisan Console\ndefine(\'LARAVEL_START\', microtime(true));'
      );
      await fs.writeFile(
        path.join(projectPath, '.env'),
        'APP_NAME="Demo Laravel App"\nAPP_ENV=local\nAPP_DEBUG=true\nDB_CONNECTION=mysql'
      );
      break;

    case 'django':
      await fs.writeFile(
        path.join(projectPath, 'manage.py'),
        '#!/usr/bin/env python\nimport os\nimport sys\n\nif __name__ == "__main__":\n    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "demo.settings")'
      );
      await fs.writeFile(
        path.join(projectPath, 'requirements.txt'),
        'Django==4.2.0\npsycopg2==2.9.0'
      );
      break;

    case 'fastapi':
      await fs.writeFile(
        path.join(projectPath, 'requirements.txt'),
        'fastapi==0.95.0\nuvicorn[standard]==0.21.0\npydantic==1.10.0'
      );
      await fs.writeFile(
        path.join(projectPath, 'main.py'),
        'from fastapi import FastAPI\n\napp = FastAPI()\n\n@app.get("/")\ndef read_root():\n    return {"Hello": "World"}'
      );
      break;

    case 'static':
      await fs.writeFile(
        path.join(projectPath, 'index.html'),
        '<!DOCTYPE html>\n<html>\n<head><title>Demo Static Site</title></head>\n<body><h1>Hello World</h1></body>\n</html>'
      );
      await fs.writeFile(
        path.join(projectPath, 'style.css'),
        'body { font-family: Arial, sans-serif; }'
      );
      break;
  }

  return projectPath;
}

async function runDemo() {
  console.log('🚀 Universal Tech Stack Detection System Demo\n');
  console.log('='.repeat(60));

  const detector = new TechStackDetector();
  const tempDir = path.join(__dirname, 'temp-demo-projects');
  
  // Clean up previous demo if exists
  try {
    await fs.rmdir(tempDir, { recursive: true });
  } catch (error) {
    // Ignore if directory doesn't exist
  }

  await fs.mkdir(tempDir, { recursive: true });

  const projectTypes = ['react', 'nextjs', 'laravel', 'django', 'fastapi', 'static'];

  for (const type of projectTypes) {
    console.log(`\n📋 Testing ${type.toUpperCase()} project detection:`);
    console.log('-'.repeat(40));

    try {
      const projectPath = await createDemoProject(type, tempDir);
      const result = await detector.detectAndGetCommand(projectPath);

      if (result) {
        console.log(`✅ Detected: ${result.framework} (${result.techStack})`);
        console.log(`📦 Command: ${result.command}`);
        console.log(`🌐 Port: ${result.port}`);
        
        if (result.projectName) {
          console.log(`📛 Project: ${result.projectName}`);
        }
        
        if (result.env && Object.keys(result.env).length > 0) {
          console.log(`⚙️  Environment variables: ${Object.keys(result.env).length} found`);
          for (const [key, value] of Object.entries(result.env)) {
            console.log(`   ${key}=${value}`);
          }
        }
      } else {
        console.log('❌ No detection result');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Supported Frameworks:');
  console.log('-'.repeat(40));
  
  const frameworks = detector.getSupportedFrameworks();
  frameworks.forEach(framework => {
    const info = detector.getFrameworkInfo(framework);
    console.log(`• ${framework.padEnd(10)} - Port: ${info.defaultPort}, Patterns: ${info.patterns?.join(', ') || 'N/A'}`);
  });

  console.log('\n✨ Demo completed! Cleaning up...');
  
  // Clean up demo projects
  try {
    await fs.rmdir(tempDir, { recursive: true });
    console.log('🧹 Cleanup successful');
  } catch (error) {
    console.log(`⚠️  Cleanup failed: ${error.message}`);
  }
}

// Run the demo
if (require.main === module) {
  runDemo().catch(console.error);
}

module.exports = { runDemo, createDemoProject };