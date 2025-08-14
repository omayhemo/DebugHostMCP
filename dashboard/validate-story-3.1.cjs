#!/usr/bin/env node
/**
 * Story 3.1 Validation Script
 * Validates all acceptance criteria for the React Dashboard Scaffolding
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧪 Story 3.1 Validation - React Dashboard Scaffolding');
console.log('=' .repeat(60));

const validations = [
  {
    name: 'Project Structure',
    check: () => {
      const requiredFiles = [
        'package.json',
        'vite.config.ts',
        'tsconfig.json',
        'tailwind.config.js',
        'src/App.tsx',
        'src/main.tsx',
        'src/index.css'
      ];
      
      return requiredFiles.every(file => fs.existsSync(path.join(__dirname, file)));
    }
  },
  {
    name: 'TypeScript Configuration',
    check: () => {
      try {
        execSync('npm run type-check', { stdio: 'pipe' });
        return true;
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Build Process',
    check: () => {
      try {
        execSync('npm run build', { stdio: 'pipe' });
        return fs.existsSync(path.join(__dirname, 'dist', 'index.html'));
      } catch {
        return false;
      }
    }
  },
  {
    name: 'Bundle Size Optimization',
    check: () => {
      const distPath = path.join(__dirname, 'dist', 'assets');
      if (!fs.existsSync(distPath)) return false;
      
      const files = fs.readdirSync(distPath);
      const mainJs = files.find(f => f.startsWith('index-') && f.endsWith('.js'));
      
      if (!mainJs) return false;
      
      const stats = fs.statSync(path.join(distPath, mainJs));
      const sizeKB = stats.size / 1024;
      
      console.log(`    Main bundle: ${sizeKB.toFixed(1)}KB`);
      return sizeKB < 500; // Under 500KB requirement
    }
  },
  {
    name: 'Dependencies Installed',
    check: () => {
      return fs.existsSync(path.join(__dirname, 'node_modules', 'react')) &&
             fs.existsSync(path.join(__dirname, 'node_modules', 'vite')) &&
             fs.existsSync(path.join(__dirname, 'node_modules', '@reduxjs', 'toolkit'));
    }
  },
  {
    name: 'Redux Store Configuration',
    check: () => {
      return fs.existsSync(path.join(__dirname, 'src', 'store', 'index.ts')) &&
             fs.existsSync(path.join(__dirname, 'src', 'store', 'slices', 'authSlice.ts'));
    }
  },
  {
    name: 'Layout Components',
    check: () => {
      return fs.existsSync(path.join(__dirname, 'src', 'components', 'layout', 'Layout.tsx')) &&
             fs.existsSync(path.join(__dirname, 'src', 'components', 'layout', 'Header.tsx')) &&
             fs.existsSync(path.join(__dirname, 'src', 'components', 'layout', 'Sidebar.tsx'));
    }
  },
  {
    name: 'API Service Layer',
    check: () => {
      return fs.existsSync(path.join(__dirname, 'src', 'services', 'api.ts')) &&
             fs.existsSync(path.join(__dirname, 'src', 'services', 'authService.ts')) &&
             fs.existsSync(path.join(__dirname, 'src', 'services', 'serverService.ts'));
    }
  },
  {
    name: 'Error Boundaries',
    check: () => {
      return fs.existsSync(path.join(__dirname, 'src', 'components', 'common', 'ErrorBoundary.tsx'));
    }
  },
  {
    name: 'Documentation',
    check: () => {
      return fs.existsSync(path.join(__dirname, 'README.md')) &&
             fs.existsSync(path.join(__dirname, 'STORY_3.1_COMPLETION.md'));
    }
  }
];

let passed = 0;
let failed = 0;

validations.forEach((validation, index) => {
  process.stdout.write(`${index + 1}. ${validation.name}... `);
  
  try {
    const result = validation.check();
    if (result) {
      console.log('✅ PASS');
      passed++;
    } else {
      console.log('❌ FAIL');
      failed++;
    }
  } catch (error) {
    console.log('❌ ERROR');
    failed++;
  }
});

console.log('\n' + '='.repeat(60));
console.log(`📊 Validation Results: ${passed} passed, ${failed} failed`);

if (failed === 0) {
  console.log('🎉 All validations passed! Story 3.1 is complete.');
  process.exit(0);
} else {
  console.log('⚠️  Some validations failed. Please review and fix issues.');
  process.exit(1);
}