const path = require('path');
const BaseAdapter = require('./base-adapter');

/**
 * Node.js project adapter
 */
class NodeAdapter extends BaseAdapter {
  constructor(logger) {
    super(logger);
    this.name = 'node';
    this.priority = 1;
  }
  
  async canHandle(projectPath) {
    return await this.fileExists(path.join(projectPath, 'package.json'));
  }
  
  async detect(projectPath) {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = await this.readJSON(packageJsonPath);
    
    if (!packageJson) {
      return null;
    }
    
    const scripts = packageJson.scripts || {};
    const framework = this.detectFramework(packageJson);
    
    // Check for development scripts in priority order
    const scriptPriority = ['dev', 'start', 'serve', 'develop', 'server'];
    
    for (const scriptName of scriptPriority) {
      if (scripts[scriptName]) {
        const command = `npm run ${scriptName}`;
        const port = this.extractPortFromScript(scripts[scriptName]) || 
                     this.getFrameworkDefaultPort(framework);
        
        return {
          command,
          port,
          framework,
          env: this.getFrameworkEnv(framework)
        };
      }
    }
    
    // Fallback to basic npm start
    return {
      command: 'npm start',
      port: 3000,
      framework,
      env: {}
    };
  }
  
  detectFramework(packageJson) {
    const deps = { 
      ...packageJson.dependencies, 
      ...packageJson.devDependencies 
    };
    
    // React-based frameworks
    if (deps.next || deps['@next/core']) return 'nextjs';
    if (deps.gatsby) return 'gatsby';
    if (deps['create-react-app']) return 'create-react-app'; 
    if (deps.react) return 'react';
    
    // Vue-based frameworks
    if (deps.nuxt) return 'nuxt';
    if (deps.vue) return 'vue';
    if (deps['@vue/cli-service']) return 'vue-cli';
    
    // Other popular frameworks
    if (deps['@angular/core']) return 'angular';
    if (deps.svelte) return 'svelte';
    if (deps.vite) return 'vite';
    
    // Backend frameworks
    if (deps.express) return 'express';
    if (deps.fastify) return 'fastify';
    if (deps.koa) return 'koa';
    if (deps.hapi || deps['@hapi/hapi']) return 'hapi';
    if (deps.nestjs || deps['@nestjs/core']) return 'nestjs';
    
    // Build tools
    if (deps.webpack) return 'webpack';
    if (deps.parcel) return 'parcel';
    if (deps.rollup) return 'rollup';
    
    return 'node';
  }
  
  extractPortFromScript(script) {
    // Try various port extraction patterns
    const patterns = [
      /--port[=\s]+(\d+)/,
      /PORT[=:\s]+(\d+)/,
      /-p[=\s]+(\d+)/,
      /port[=:\s]+(\d+)/i
    ];
    
    for (const pattern of patterns) {
      const match = script.match(pattern);
      if (match) {
        const port = parseInt(match[1]);
        if (this.isValidPort(port)) {
          return port;
        }
      }
    }
    
    return null;
  }
  
  getFrameworkDefaultPort(framework) {
    const defaults = {
      'nextjs': 3000,
      'nuxt': 3000,
      'gatsby': 8000,
      'vue': 8080,
      'vue-cli': 8080,
      'angular': 4200,
      'svelte': 5000,
      'vite': 5173,
      'express': 3000,
      'fastify': 3000,
      'koa': 3000,
      'hapi': 3000,
      'nestjs': 3000,
      'webpack': 8080,
      'parcel': 1234,
      'create-react-app': 3000,
      'react': 3000
    };
    
    return defaults[framework] || 3000;
  }
  
  getFrameworkEnv(framework) {
    const envs = {
      'nextjs': { NODE_ENV: 'development' },
      'nuxt': { NODE_ENV: 'development' },
      'gatsby': { NODE_ENV: 'development' },
      'vue': { NODE_ENV: 'development' },
      'angular': { NODE_ENV: 'development' },
      'svelte': { NODE_ENV: 'development' },
      'vite': { NODE_ENV: 'development' },
      'express': { NODE_ENV: 'development' },
      'fastify': { NODE_ENV: 'development' },
      'koa': { NODE_ENV: 'development' },
      'nestjs': { NODE_ENV: 'development' }
    };
    
    return envs[framework] || { NODE_ENV: 'development' };
  }
}

module.exports = NodeAdapter;