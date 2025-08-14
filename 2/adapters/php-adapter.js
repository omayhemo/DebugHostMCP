const path = require('path');
const BaseAdapter = require('./base-adapter');

/**
 * PHP project adapter
 */
class PhpAdapter extends BaseAdapter {
  constructor(logger) {
    super(logger);
    this.name = 'php';
    this.priority = 3;
  }
  
  async canHandle(projectPath) {
    // Check for common PHP project indicators
    const indicators = [
      'composer.json',     // Composer
      'artisan',          // Laravel
      'index.php',        // Generic PHP
      'app.php',          // Some PHP frameworks
      'public/index.php', // Common structure
      'web/index.php',    // Symfony
      'htdocs/index.php'  // Apache structure
    ];
    
    for (const indicator of indicators) {
      if (await this.fileExists(path.join(projectPath, indicator))) {
        return true;
      }
    }
    
    return false;
  }
  
  async detect(projectPath) {
    // Laravel detection (highest priority)
    if (await this.fileExists(path.join(projectPath, 'artisan'))) {
      return {
        command: 'php artisan serve',
        port: 8000,
        framework: 'laravel',
        env: { APP_ENV: 'local' }
      };
    }
    
    // Symfony detection
    if (await this.fileExists(path.join(projectPath, 'bin/console'))) {
      return {
        command: 'symfony server:start',
        port: 8000,
        framework: 'symfony',
        env: { APP_ENV: 'dev' }
      };
    }
    
    // Check composer.json for framework detection
    const composerPath = path.join(projectPath, 'composer.json');
    if (await this.fileExists(composerPath)) {
      const composer = await this.readJSON(composerPath);
      if (composer) {
        const detected = this.detectFromComposer(composer);
        if (detected) return detected;
      }
    }
    
    // CodeIgniter detection
    if (await this.fileExists(path.join(projectPath, 'spark'))) {
      return {
        command: 'php spark serve',
        port: 8080,
        framework: 'codeigniter',
        env: {}
      };
    }
    
    // CakePHP detection
    if (await this.fileExists(path.join(projectPath, 'bin/cake'))) {
      return {
        command: 'bin/cake server',
        port: 8765,
        framework: 'cakephp',
        env: {}
      };
    }
    
    // Yii detection
    if (await this.fileExists(path.join(projectPath, 'yii'))) {
      return {
        command: 'php yii serve',
        port: 8080,
        framework: 'yii',
        env: {}
      };
    }
    
    // WordPress detection
    if (await this.fileExists(path.join(projectPath, 'wp-config.php'))) {
      return {
        command: 'php -S localhost:8080 -t .',
        port: 8080,
        framework: 'wordpress',
        env: {}
      };
    }
    
    // Drupal detection
    if (await this.fileExists(path.join(projectPath, 'core/drupal.php'))) {
      return {
        command: 'php -S localhost:8888 -t .',
        port: 8888,
        framework: 'drupal',
        env: {}
      };
    }
    
    // Generic PHP with public directory
    if (await this.fileExists(path.join(projectPath, 'public/index.php'))) {
      return {
        command: 'php -S localhost:8000 -t public',
        port: 8000,
        framework: 'php',
        env: {}
      };
    }
    
    // Generic PHP with web directory (Symfony style)
    if (await this.fileExists(path.join(projectPath, 'web/index.php'))) {
      return {
        command: 'php -S localhost:8000 -t web',
        port: 8000,
        framework: 'php',
        env: {}
      };
    }
    
    // Generic PHP
    if (await this.fileExists(path.join(projectPath, 'index.php'))) {
      return {
        command: 'php -S localhost:8000',
        port: 8000,
        framework: 'php',
        env: {}
      };
    }
    
    return null;
  }
  
  detectFromComposer(composer) {
    const require = composer.require || {};
    const requireDev = composer['require-dev'] || {};
    const allPackages = { ...require, ...requireDev };
    
    // Laravel
    if (allPackages['laravel/framework'] || allPackages['laravel/laravel']) {
      return {
        command: 'php artisan serve',
        port: 8000,
        framework: 'laravel',
        env: { APP_ENV: 'local' }
      };
    }
    
    // Symfony
    if (allPackages['symfony/framework-bundle'] || 
        allPackages['symfony/symfony'] ||
        allPackages['symfony/console']) {
      return {
        command: 'symfony server:start --no-tls',
        port: 8000,
        framework: 'symfony',
        env: { APP_ENV: 'dev' }
      };
    }
    
    // Slim Framework
    if (allPackages['slim/slim']) {
      return {
        command: 'php -S localhost:8080 -t public',
        port: 8080,
        framework: 'slim',
        env: {}
      };
    }
    
    // CodeIgniter
    if (allPackages['codeigniter4/framework'] || allPackages['codeigniter/framework']) {
      return {
        command: 'php spark serve',
        port: 8080,
        framework: 'codeigniter',
        env: {}
      };
    }
    
    // CakePHP
    if (allPackages['cakephp/cakephp']) {
      return {
        command: 'bin/cake server',
        port: 8765,
        framework: 'cakephp',
        env: {}
      };
    }
    
    // Yii
    if (allPackages['yiisoft/yii2'] || allPackages['yiisoft/yii2-app-basic']) {
      return {
        command: 'php yii serve',
        port: 8080,
        framework: 'yii',
        env: {}
      };
    }
    
    // Zend/Laminas
    if (allPackages['zendframework/zendframework'] || 
        allPackages['laminas/laminas-mvc']) {
      return {
        command: 'php -S localhost:8080 -t public',
        port: 8080,
        framework: 'laminas',
        env: {}
      };
    }
    
    // Generic composer project
    return {
      command: 'php -S localhost:8000 -t public',
      port: 8000,
      framework: 'php',
      env: {}
    };
  }
}

module.exports = PhpAdapter;