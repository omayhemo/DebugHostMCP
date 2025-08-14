const path = require('path');
const BaseAdapter = require('./base-adapter');

/**
 * Python project adapter
 */
class PythonAdapter extends BaseAdapter {
  constructor(logger) {
    super(logger);
    this.name = 'python';
    this.priority = 2;
  }
  
  async canHandle(projectPath) {
    // Check for common Python project indicators
    const indicators = [
      'manage.py',        // Django
      'requirements.txt', // pip requirements
      'Pipfile',         // pipenv
      'pyproject.toml',  // Poetry/modern Python
      'app.py',          // Flask common name
      'main.py',         // FastAPI common name
      'wsgi.py',         // WSGI app
      'asgi.py'          // ASGI app
    ];
    
    for (const indicator of indicators) {
      if (await this.fileExists(path.join(projectPath, indicator))) {
        return true;
      }
    }
    
    return false;
  }
  
  async detect(projectPath) {
    // Django detection
    if (await this.fileExists(path.join(projectPath, 'manage.py'))) {
      return {
        command: 'python manage.py runserver',
        port: 8000,
        framework: 'django',
        env: { DJANGO_ENV: 'development' }
      };
    }
    
    // Check requirements.txt for framework detection
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    if (await this.fileExists(requirementsPath)) {
      const content = await this.readFile(requirementsPath);
      if (content) {
        return this.detectFromRequirements(content);
      }
    }
    
    // Check Pipfile
    const pipfilePath = path.join(projectPath, 'Pipfile');
    if (await this.fileExists(pipfilePath)) {
      const content = await this.readFile(pipfilePath);
      if (content) {
        return this.detectFromPipfile(content);
      }
    }
    
    // Check pyproject.toml
    const pyprojectPath = path.join(projectPath, 'pyproject.toml');
    if (await this.fileExists(pyprojectPath)) {
      const content = await this.readFile(pyprojectPath);
      if (content) {
        return this.detectFromPyproject(content);
      }
    }
    
    // Check for common app files
    if (await this.fileExists(path.join(projectPath, 'app.py'))) {
      return this.detectFromAppPy(projectPath);
    }
    
    if (await this.fileExists(path.join(projectPath, 'main.py'))) {
      return this.detectFromMainPy(projectPath);
    }
    
    return null;
  }
  
  detectFromRequirements(content) {
    const lower = content.toLowerCase();
    
    if (lower.includes('flask')) {
      return {
        command: 'flask run',
        port: 5000,
        framework: 'flask',
        env: { 
          FLASK_ENV: 'development',
          FLASK_DEBUG: '1'
        }
      };
    }
    
    if (lower.includes('fastapi')) {
      return {
        command: 'uvicorn main:app --reload',
        port: 8000,
        framework: 'fastapi',
        env: {}
      };
    }
    
    if (lower.includes('django')) {
      return {
        command: 'python -m django runserver',
        port: 8000,
        framework: 'django',
        env: { DJANGO_ENV: 'development' }
      };
    }
    
    if (lower.includes('tornado')) {
      return {
        command: 'python app.py',
        port: 8888,
        framework: 'tornado',
        env: {}
      };
    }
    
    if (lower.includes('aiohttp')) {
      return {
        command: 'python -m aiohttp.web -H localhost -P 8080 app:init_func',
        port: 8080,
        framework: 'aiohttp',
        env: {}
      };
    }
    
    // Generic Python web server
    return {
      command: 'python -m http.server 8000',
      port: 8000,
      framework: 'python-http',
      env: {}
    };
  }
  
  detectFromPipfile(content) {
    const lower = content.toLowerCase();
    
    if (lower.includes('flask')) {
      return {
        command: 'pipenv run flask run',
        port: 5000,
        framework: 'flask',
        env: { 
          FLASK_ENV: 'development',
          FLASK_DEBUG: '1'
        }
      };
    }
    
    if (lower.includes('django')) {
      return {
        command: 'pipenv run python manage.py runserver',
        port: 8000,
        framework: 'django',
        env: { DJANGO_ENV: 'development' }
      };
    }
    
    if (lower.includes('fastapi')) {
      return {
        command: 'pipenv run uvicorn main:app --reload',
        port: 8000,
        framework: 'fastapi',
        env: {}
      };
    }
    
    return {
      command: 'pipenv run python app.py',
      port: 5000,
      framework: 'python',
      env: {}
    };
  }
  
  detectFromPyproject(content) {
    const lower = content.toLowerCase();
    
    if (lower.includes('flask')) {
      return {
        command: 'poetry run flask run',
        port: 5000,
        framework: 'flask',
        env: { 
          FLASK_ENV: 'development',
          FLASK_DEBUG: '1'
        }
      };
    }
    
    if (lower.includes('django')) {
      return {
        command: 'poetry run python manage.py runserver',
        port: 8000,
        framework: 'django',
        env: { DJANGO_ENV: 'development' }
      };
    }
    
    if (lower.includes('fastapi')) {
      return {
        command: 'poetry run uvicorn main:app --reload',
        port: 8000,
        framework: 'fastapi',
        env: {}
      };
    }
    
    return {
      command: 'poetry run python app.py',
      port: 5000,
      framework: 'python',
      env: {}
    };
  }
  
  async detectFromAppPy(projectPath) {
    const content = await this.readFile(path.join(projectPath, 'app.py'));
    if (!content) return null;
    
    const lower = content.toLowerCase();
    
    if (lower.includes('from flask') || lower.includes('import flask')) {
      return {
        command: 'flask run',
        port: 5000,
        framework: 'flask',
        env: { 
          FLASK_APP: 'app.py',
          FLASK_ENV: 'development',
          FLASK_DEBUG: '1'
        }
      };
    }
    
    if (lower.includes('from fastapi') || lower.includes('import fastapi')) {
      return {
        command: 'uvicorn app:app --reload',
        port: 8000,
        framework: 'fastapi',
        env: {}
      };
    }
    
    // Generic Python app
    return {
      command: 'python app.py',
      port: 5000,
      framework: 'python',
      env: {}
    };
  }
  
  async detectFromMainPy(projectPath) {
    const content = await this.readFile(path.join(projectPath, 'main.py'));
    if (!content) return null;
    
    const lower = content.toLowerCase();
    
    if (lower.includes('from fastapi') || lower.includes('import fastapi')) {
      return {
        command: 'uvicorn main:app --reload',
        port: 8000,
        framework: 'fastapi',
        env: {}
      };
    }
    
    if (lower.includes('from flask') || lower.includes('import flask')) {
      return {
        command: 'python main.py',
        port: 5000,
        framework: 'flask',
        env: { FLASK_ENV: 'development' }
      };
    }
    
    // Generic Python main
    return {
      command: 'python main.py',
      port: 8000,
      framework: 'python',
      env: {}
    };
  }
}

module.exports = PythonAdapter;