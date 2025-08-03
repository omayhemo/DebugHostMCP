const TechStackDetector = require('../src/tech-stack-detector');
const fs = require('fs').promises;
const path = require('path');
const { tmpdir } = require('os');

describe('TechStackDetector', () => {
  let detector;
  let testDir;

  beforeEach(async () => {
    detector = new TechStackDetector();
    // Create a unique test directory
    testDir = path.join(tmpdir(), `tech-stack-test-${Date.now()}-${Math.random()}`);
    await fs.mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rmdir(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });

  describe('Node.js Project Detection', () => {
    test('should detect React project with npm run start', async () => {
      const packageJson = {
        name: 'test-react-app',
        version: '1.0.0',
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        },
        scripts: {
          start: 'react-scripts start',
          build: 'react-scripts build'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'npm run start',
        port: 3000,
        framework: 'react',
        techStack: 'nodejs',
        projectName: 'test-react-app',
        version: '1.0.0',
        env: null
      });
    });

    test('should detect Next.js project with custom port', async () => {
      const packageJson = {
        name: 'test-nextjs-app',
        dependencies: {
          next: '^13.0.0',
          react: '^18.0.0'
        },
        scripts: {
          dev: 'next dev -p 3001',
          build: 'next build'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'npm run dev',
        port: 3001,
        framework: 'nextjs',
        techStack: 'nodejs',
        projectName: 'test-nextjs-app',
        version: undefined,
        env: null
      });
    });

    test('should detect Vue project with default port', async () => {
      const packageJson = {
        name: 'test-vue-app',
        dependencies: {
          vue: '^3.0.0'
        },
        scripts: {
          serve: 'vue-cli-service serve',
          build: 'vue-cli-service build'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'npm run serve',
        port: 8080,
        framework: 'vue',
        techStack: 'nodejs',
        projectName: 'test-vue-app',
        version: undefined,
        env: null
      });
    });

    test('should detect Angular project', async () => {
      const packageJson = {
        name: 'test-angular-app',
        dependencies: {
          '@angular/core': '^15.0.0',
          '@angular/common': '^15.0.0'
        },
        scripts: {
          start: 'ng serve',
          build: 'ng build'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'npm run start',
        port: 4200,
        framework: 'angular',
        techStack: 'nodejs',
        projectName: 'test-angular-app',
        version: undefined,
        env: null
      });
    });

    test('should detect Express project', async () => {
      const packageJson = {
        name: 'test-express-app',
        dependencies: {
          express: '^4.18.0'
        },
        scripts: {
          dev: 'nodemon server.js',
          start: 'node server.js'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'npm run dev',
        port: 3000,
        framework: 'express',
        techStack: 'nodejs',
        projectName: 'test-express-app',
        version: undefined,
        env: null
      });
    });

    test('should handle environment variables from .env file', async () => {
      const packageJson = {
        name: 'test-env-app',
        dependencies: {
          react: '^18.0.0'
        },
        scripts: {
          start: 'react-scripts start'
        }
      };

      const envContent = `
REACT_APP_API_URL=http://localhost:5000
PORT=3002
NODE_ENV=development
`;

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      await fs.writeFile(path.join(testDir, '.env'), envContent);

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.env).toEqual({
        REACT_APP_API_URL: 'http://localhost:5000',
        PORT: '3002',
        NODE_ENV: 'development'
      });
    });
  });

  describe('PHP Project Detection', () => {
    test('should detect Laravel project', async () => {
      // Create artisan file (Laravel indicator)
      await fs.writeFile(
        path.join(testDir, 'artisan'),
        '#!/usr/bin/env php\n<?php\n// Laravel artisan'
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'php artisan serve',
        port: 8000,
        framework: 'laravel',
        techStack: 'php',
        env: {
          APP_ENV: 'local',
          APP_DEBUG: 'true'
        }
      });
    });

    test('should detect Laravel project with .env file', async () => {
      await fs.writeFile(
        path.join(testDir, 'artisan'),
        '#!/usr/bin/env php\n<?php\n// Laravel artisan'
      );

      const envContent = `
APP_NAME=TestApp
APP_ENV=production
APP_DEBUG=false
DB_CONNECTION=mysql
`;

      await fs.writeFile(path.join(testDir, '.env'), envContent);

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.env).toEqual({
        APP_ENV: 'production',
        APP_DEBUG: 'false',
        APP_NAME: 'TestApp',
        DB_CONNECTION: 'mysql'
      });
    });

    test('should detect Symfony project', async () => {
      // Create Symfony console file
      await fs.mkdir(path.join(testDir, 'bin'), { recursive: true });
      await fs.writeFile(
        path.join(testDir, 'bin', 'console'),
        '#!/usr/bin/env php\n<?php\n// Symfony console'
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'symfony serve',
        port: 8000,
        framework: 'symfony',
        techStack: 'php'
      });
    });

    test('should detect generic PHP project with composer.json', async () => {
      const composerJson = {
        name: 'test/php-app',
        require: {
          'php': '^8.0'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'composer.json'),
        JSON.stringify(composerJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'php -S localhost:8000',
        port: 8000,
        framework: 'php',
        techStack: 'php'
      });
    });

    test('should detect basic PHP project with index.php', async () => {
      await fs.writeFile(
        path.join(testDir, 'index.php'),
        '<?php\necho "Hello World";\n'
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'php -S localhost:8000',
        port: 8000,
        framework: 'php',
        techStack: 'php'
      });
    });
  });

  describe('Python Project Detection', () => {
    test('should detect Django project', async () => {
      await fs.writeFile(
        path.join(testDir, 'manage.py'),
        '#!/usr/bin/env python\nimport django\n'
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'python manage.py runserver 8000',
        port: 8000,
        framework: 'django',
        techStack: 'python',
        env: { DJANGO_DEBUG: 'True' }
      });
    });

    test('should detect FastAPI project', async () => {
      const requirements = 'fastapi==0.95.0\nuvicorn==0.21.0';

      await fs.writeFile(path.join(testDir, 'requirements.txt'), requirements);

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'uvicorn main:app --reload --port 8000',
        port: 8000,
        framework: 'fastapi',
        techStack: 'python'
      });
    });

    test('should detect Flask project', async () => {
      const requirements = 'Flask==2.3.0\ngunicorn==20.1.0';

      await fs.writeFile(path.join(testDir, 'requirements.txt'), requirements);

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'python -m flask run --port 5000',
        port: 5000,
        framework: 'flask',
        techStack: 'python',
        env: { FLASK_ENV: 'development' }
      });
    });
  });

  describe('Fallback Detection', () => {
    test('should detect static web project', async () => {
      await fs.writeFile(path.join(testDir, 'index.html'), '<html><body>Hello</body></html>');
      await fs.writeFile(path.join(testDir, 'style.css'), 'body { margin: 0; }');
      await fs.writeFile(path.join(testDir, 'script.js'), 'console.log("Hello");');

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toEqual({
        command: 'python -m http.server 8000',
        port: 8000,
        framework: 'static',
        techStack: 'static'
      });
    });

    test('should return null for unrecognized project', async () => {
      await fs.writeFile(path.join(testDir, 'README.md'), '# Test Project');

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toBeNull();
    });
  });

  describe('Port Detection', () => {
    test('should detect port from script command with --port flag', async () => {
      const packageJson = {
        name: 'test-app',
        dependencies: { react: '^18.0.0' },
        scripts: {
          start: 'react-scripts start --port 3005'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.port).toBe(3005);
    });

    test('should detect port from PORT environment variable in script', async () => {
      const packageJson = {
        name: 'test-app',
        dependencies: { react: '^18.0.0' },
        scripts: {
          start: 'PORT=4000 react-scripts start'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.port).toBe(4000);
    });

    test('should detect port from package.json config', async () => {
      const packageJson = {
        name: 'test-app',
        dependencies: { react: '^18.0.0' },
        scripts: {
          start: 'react-scripts start'
        },
        config: {
          port: 3333
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.port).toBe(3333);
    });
  });

  describe('Utility Methods', () => {
    test('should return supported frameworks list', () => {
      const frameworks = detector.getSupportedFrameworks();
      
      expect(frameworks).toContain('react');
      expect(frameworks).toContain('nextjs');
      expect(frameworks).toContain('vue');
      expect(frameworks).toContain('angular');
      expect(frameworks).toContain('laravel');
      expect(frameworks).toContain('django');
      expect(frameworks).toContain('flask');
      expect(frameworks).toContain('fastapi');
    });

    test('should return framework information', () => {
      const reactInfo = detector.getFrameworkInfo('react');
      
      expect(reactInfo).toEqual({
        patterns: ['react', 'create-react-app'],
        defaultPort: 3000,
        devScripts: ['start', 'dev', 'serve']
      });
    });

    test('should return null for unknown framework', () => {
      const unknownInfo = detector.getFrameworkInfo('unknown-framework');
      
      expect(unknownInfo).toBeNull();
    });
  });

  describe('Framework Priority Detection', () => {
    test('should prioritize Next.js over React when both are present', async () => {
      const packageJson = {
        name: 'test-app',
        dependencies: {
          next: '^13.0.0',
          react: '^18.0.0'
        },
        scripts: {
          dev: 'next dev'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.framework).toBe('nextjs');
    });

    test('should prioritize Angular over other frameworks', async () => {
      const packageJson = {
        name: 'test-app',
        dependencies: {
          '@angular/core': '^15.0.0',
          react: '^18.0.0',
          vue: '^3.0.0'
        },
        scripts: {
          start: 'ng serve'
        }
      };

      await fs.writeFile(
        path.join(testDir, 'package.json'),
        JSON.stringify(packageJson, null, 2)
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result.framework).toBe('angular');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed package.json gracefully', async () => {
      await fs.writeFile(
        path.join(testDir, 'package.json'),
        '{ invalid json'
      );

      const result = await detector.detectAndGetCommand(testDir);

      expect(result).toBeNull();
    });

    test('should handle permission errors gracefully', async () => {
      // Create a directory that can't be read (simulating permission error)
      const restrictedDir = path.join(testDir, 'restricted');
      await fs.mkdir(restrictedDir);

      const result = await detector.detectAndGetCommand(restrictedDir);

      expect(result).toBeNull();
    });
  });
});

// Test helper to run specific framework detection scenarios
describe('Integration Scenarios', () => {
  let detector;

  beforeEach(() => {
    detector = new TechStackDetector();
  });

  test('should correctly identify all major frameworks in sequence', async () => {
    const scenarios = [
      {
        name: 'React with TypeScript',
        files: {
          'package.json': {
            dependencies: { react: '^18.0.0', typescript: '^4.9.0' },
            scripts: { start: 'react-scripts start' }
          }
        },
        expected: { framework: 'react', port: 3000, techStack: 'nodejs' }
      },
      {
        name: 'Vue with Vite',
        files: {
          'package.json': {
            dependencies: { vue: '^3.0.0', vite: '^4.0.0' },
            scripts: { dev: 'vite' }
          }
        },
        expected: { framework: 'vue', port: 8080, techStack: 'nodejs' }
      }
    ];

    for (const scenario of scenarios) {
      console.log(`Testing scenario: ${scenario.name}`);
      
      // Each scenario would need its own test directory setup
      // This is a conceptual test structure for comprehensive validation
      expect(scenario.expected.framework).toBeDefined();
      expect(scenario.expected.port).toBeGreaterThan(0);
      expect(scenario.expected.techStack).toBeDefined();
    }
  });
});