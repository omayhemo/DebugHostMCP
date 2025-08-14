const NodeAdapter = require('./adapters/node-adapter');
const PythonAdapter = require('./adapters/python-adapter');
const PhpAdapter = require('./adapters/php-adapter');

class TechStackDetector {
  constructor(logger) {
    this.logger = logger || console;
    this.adapters = [
      new NodeAdapter(this.logger),
      new PythonAdapter(this.logger),
      new PhpAdapter(this.logger)
    ].sort((a, b) => a.priority - b.priority);
  }
  
  async detectAndGetCommand(projectPath) {
    try {
      this.logger.debug(`Detecting tech stack for: ${projectPath}`);
      
      // Try each adapter in priority order
      for (const adapter of this.adapters) {
        if (await adapter.canHandle(projectPath)) {
          this.logger.debug(`Using ${adapter.name} adapter`);
          const result = await adapter.detect(projectPath);
          if (result) {
            this.logger.info(`Detected ${result.framework} project: ${result.command}`);
            return result;
          }
        }
      }
      
      // Fallback detection for other languages
      const fallback = await this.detectFallback(projectPath);
      if (fallback) {
        this.logger.info(`Fallback detection: ${fallback.framework}`);
        return fallback;
      }
      
      this.logger.warn(`No tech stack detected for: ${projectPath}`);
      return null;
    } catch (error) {
      this.logger.error('Error detecting tech stack:', error);
      return null;
    }
  }
  
  async detectFallback(projectPath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Check for Ruby projects
    if (await this.fileExists(path.join(projectPath, 'Gemfile'))) {
      if (await this.fileExists(path.join(projectPath, 'config.ru'))) {
        return {
          command: 'bundle exec rackup',
          port: 9292,
          framework: 'rack'
        };
      }
      
      if (await this.fileExists(path.join(projectPath, 'config', 'application.rb'))) {
        return {
          command: 'bundle exec rails server',
          port: 3000,
          framework: 'rails'
        };
      }
      
      return {
        command: 'bundle exec ruby app.rb',
        port: 4567,
        framework: 'ruby'
      };
    }
    
    // Check for Go projects
    if (await this.fileExists(path.join(projectPath, 'go.mod'))) {
      return {
        command: 'go run .',
        port: 8080,
        framework: 'go'
      };
    }
    
    // Check for Rust projects
    if (await this.fileExists(path.join(projectPath, 'Cargo.toml'))) {
      return {
        command: 'cargo run',
        port: 8080,
        framework: 'rust'
      };
    }
    
    // Check for Java projects
    if (await this.fileExists(path.join(projectPath, 'pom.xml'))) {
      return {
        command: 'mvn spring-boot:run',
        port: 8080,
        framework: 'spring-boot'
      };
    }
    
    if (await this.fileExists(path.join(projectPath, 'build.gradle'))) {
      return {
        command: './gradlew bootRun',
        port: 8080,
        framework: 'gradle-spring'
      };
    }
    
    // Check for .NET projects
    if (await this.fileExists(path.join(projectPath, '*.csproj'))) {
      return {
        command: 'dotnet run',
        port: 5000,
        framework: 'dotnet'
      };
    }
    
    // Check for static files
    try {
      const files = await fs.readdir(projectPath);
      if (files.some(file => /\.(html|css|js)$/.test(file))) {
        return {
          command: 'python -m http.server 8000',
          port: 8000,
          framework: 'static'
        };
      }
    } catch (error) {
      this.logger.debug('Error reading project directory:', error);
    }
    
    return null;
  }
  
  async fileExists(filePath) {
    const fs = require('fs').promises;
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
  
  // Legacy methods for backward compatibility
  detectPort(script) {
    const portMatch = script.match(/(?:--port|PORT=|:)(\d+)/);
    return portMatch ? parseInt(portMatch[1]) : null;
  }
  
  detectFramework(packageJson) {
    const deps = { 
      ...packageJson.dependencies, 
      ...packageJson.devDependencies 
    };
    
    if (deps.next) return 'nextjs';
    if (deps.nuxt) return 'nuxt';
    if (deps['@angular/core']) return 'angular';
    if (deps.vue) return 'vue';
    if (deps.react) return 'react';
    if (deps.svelte) return 'svelte';
    if (deps.express) return 'express';
    if (deps.fastify) return 'fastify';
    if (deps.koa) return 'koa';
    
    return 'node';
  }
}

module.exports = TechStackDetector;