/**
 * Workspace Scanner Service
 * Detects technology stacks and validates project workspaces
 * Part of Story 2.1: Project Registration System
 */

const fs = require('fs').promises;
const fsConstants = require('fs').constants;
const path = require('path');
const { createMcpError, MCP_ERROR_CODES } = require('../middleware/error-handler');

/**
 * Technology stack detection patterns
 * Each pattern maps to specific files that indicate the technology
 */
const DETECTION_PATTERNS = {
  nodejs: {
    files: ['package.json', '.nvmrc', 'yarn.lock', 'package-lock.json'],
    directories: ['node_modules'],
    weight: 10
  },
  python: {
    files: ['requirements.txt', 'pyproject.toml', 'Pipfile', 'setup.py', 'poetry.lock'],
    directories: ['venv', '.venv', '__pycache__'],
    weight: 10
  },
  php: {
    files: ['composer.json', 'composer.lock'],
    patterns: ['*.php', 'index.php'],
    directories: ['vendor'],
    weight: 10
  },
  static: {
    files: ['index.html'],
    directories: ['static', 'public', 'dist', 'build'],
    patterns: ['*.html', '*.css', '*.js'],
    weight: 5
  },
  docker: {
    files: ['Dockerfile', 'docker-compose.yml', 'docker-compose.yaml', '.dockerignore'],
    weight: 8
  },
  react: {
    files: ['package.json'], // Will check package.json content for React
    dependencies: ['react', 'react-dom'],
    weight: 12
  },
  vue: {
    files: ['package.json'], // Will check package.json content for Vue
    dependencies: ['vue'],
    weight: 12
  },
  angular: {
    files: ['angular.json', 'package.json'],
    dependencies: ['@angular/core'],
    weight: 12
  }
};

/**
 * Port preferences by technology stack
 */
const TECH_PORT_PREFERENCES = {
  nodejs: { range: [3000, 3999], default: 3000 },
  python: { range: [5000, 5999], default: 5000 },
  php: { range: [8080, 8980], default: 8080 },
  static: { range: [4000, 4999], default: 4000 },
  react: { range: [3000, 3999], default: 3000 },
  vue: { range: [3000, 3999], default: 3000 },
  angular: { range: [4200, 4299], default: 4200 }
};

class WorkspaceScanner {
  /**
   * Scan workspace and detect technology stacks
   * @param {string} workspacePath - Path to the workspace directory
   * @returns {Promise<Object>} Scan results with detected technologies
   */
  async scanWorkspace(workspacePath) {
    try {
      // Validate workspace path
      await this.validateWorkspace(workspacePath);
      
      // Get workspace contents
      const contents = await this.getWorkspaceContents(workspacePath);
      
      // Detect technology stacks
      const detectedTechs = await this.detectTechnologyStacks(workspacePath, contents);
      
      // Generate project metadata
      const metadata = await this.generateProjectMetadata(workspacePath, contents, detectedTechs);
      
      return {
        success: true,
        workspace: workspacePath,
        technologies: detectedTechs,
        metadata,
        scannedAt: new Date().toISOString()
      };
      
    } catch (error) {
      if (error.code) {
        throw error; // Re-throw MCP errors
      }
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Workspace scan failed: ${error.message}`,
        { workspace: workspacePath, originalError: error.message }
      );
    }
  }

  /**
   * Validate that the workspace path is accessible and readable
   * @param {string} workspacePath - Path to validate
   */
  async validateWorkspace(workspacePath) {
    if (!workspacePath) {
      throw createMcpError(
        MCP_ERROR_CODES.INVALID_PARAMS,
        'Workspace path is required'
      );
    }

    // Normalize path
    const normalizedPath = path.resolve(workspacePath);
    
    try {
      const stats = await fs.stat(normalizedPath);
      
      if (!stats.isDirectory()) {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Workspace path must be a directory',
          { workspace: workspacePath, type: 'file' }
        );
      }
      
      // Test readability
      await fs.access(normalizedPath, fsConstants.R_OK);
      
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Workspace directory does not exist',
          { workspace: workspacePath }
        );
      }
      
      if (error.code === 'EACCES') {
        throw createMcpError(
          MCP_ERROR_CODES.INVALID_PARAMS,
          'Workspace directory is not readable',
          { workspace: workspacePath }
        );
      }
      
      throw error; // Re-throw if it's already an MCP error or unknown error
    }
    
    return normalizedPath;
  }

  /**
   * Get contents of workspace directory
   * @param {string} workspacePath - Path to scan
   * @returns {Promise<Object>} Files and directories in workspace
   */
  async getWorkspaceContents(workspacePath) {
    try {
      const entries = await fs.readdir(workspacePath, { withFileTypes: true });
      
      const files = [];
      const directories = [];
      
      for (const entry of entries) {
        if (entry.isFile()) {
          files.push(entry.name);
        } else if (entry.isDirectory()) {
          directories.push(entry.name);
        }
      }
      
      return { files, directories };
      
    } catch (error) {
      throw createMcpError(
        MCP_ERROR_CODES.INTERNAL_ERROR,
        `Failed to read workspace contents: ${error.message}`,
        { workspace: workspacePath }
      );
    }
  }

  /**
   * Detect technology stacks based on workspace contents
   * @param {string} workspacePath - Workspace path
   * @param {Object} contents - Workspace files and directories
   * @returns {Promise<Array>} Detected technology stacks with confidence scores
   */
  async detectTechnologyStacks(workspacePath, contents) {
    const detectedTechs = [];
    const { files, directories } = contents;
    
    for (const [techName, patterns] of Object.entries(DETECTION_PATTERNS)) {
      let confidence = 0;
      const evidence = [];
      
      // Check for specific files
      if (patterns.files) {
        for (const file of patterns.files) {
          if (files.includes(file)) {
            confidence += patterns.weight;
            evidence.push(`Found ${file}`);
          }
        }
      }
      
      // Check for specific directories
      if (patterns.directories) {
        for (const dir of patterns.directories) {
          if (directories.includes(dir)) {
            confidence += patterns.weight * 0.5; // Directories get half weight
            evidence.push(`Found ${dir}/ directory`);
          }
        }
      }
      
      // Check for file patterns (simplified - check extensions)
      if (patterns.patterns) {
        for (const pattern of patterns.patterns) {
          const ext = pattern.replace('*.', '');
          const hasMatchingFiles = files.some(file => file.endsWith(`.${ext}`));
          if (hasMatchingFiles) {
            confidence += patterns.weight * 0.3; // Pattern matches get less weight
            evidence.push(`Found ${pattern} files`);
          }
        }
      }
      
      // Check package.json dependencies for framework detection
      if (patterns.dependencies && files.includes('package.json')) {
        try {
          const packagePath = path.join(workspacePath, 'package.json');
          const packageContent = await fs.readFile(packagePath, 'utf8');
          const packageJson = JSON.parse(packageContent);
          
          const allDeps = {
            ...packageJson.dependencies || {},
            ...packageJson.devDependencies || {},
            ...packageJson.peerDependencies || {}
          };
          
          for (const dep of patterns.dependencies) {
            if (allDeps[dep]) {
              confidence += patterns.weight;
              evidence.push(`Found ${dep} dependency in package.json`);
            }
          }
        } catch (error) {
          // Ignore package.json parsing errors for dependency checking
        }
      }
      
      // Add technology if confidence is above threshold
      if (confidence > 0) {
        detectedTechs.push({
          name: techName,
          confidence: Math.min(confidence, 100), // Cap at 100%
          evidence,
          portPreference: TECH_PORT_PREFERENCES[techName] || { range: [3000, 9999], default: 3000 }
        });
      }
    }
    
    // Sort by confidence score (highest first)
    return detectedTechs.sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Generate project metadata from workspace analysis
   * @param {string} workspacePath - Workspace path
   * @param {Object} contents - Workspace contents
   * @param {Array} technologies - Detected technologies
   * @returns {Promise<Object>} Project metadata
   */
  async generateProjectMetadata(workspacePath, contents, technologies) {
    const metadata = {
      name: path.basename(workspacePath),
      path: workspacePath,
      primaryTech: technologies.length > 0 ? technologies[0].name : 'unknown',
      fileCount: contents.files.length,
      directoryCount: contents.directories.length,
      isEmpty: contents.files.length === 0 && contents.directories.length === 0
    };
    
    // Try to get name from package.json if it's a Node.js project
    if (contents.files.includes('package.json')) {
      try {
        const packagePath = path.join(workspacePath, 'package.json');
        const packageContent = await fs.readFile(packagePath, 'utf8');
        const packageJson = JSON.parse(packageContent);
        
        if (packageJson.name) {
          metadata.name = packageJson.name;
        }
        
        if (packageJson.version) {
          metadata.version = packageJson.version;
        }
        
        if (packageJson.description) {
          metadata.description = packageJson.description;
        }
      } catch (error) {
        // Ignore package.json parsing errors
      }
    }
    
    // Try to get name from pyproject.toml if it's a Python project
    if (contents.files.includes('pyproject.toml')) {
      try {
        const tomlPath = path.join(workspacePath, 'pyproject.toml');
        const tomlContent = await fs.readFile(tomlPath, 'utf8');
        
        // Basic TOML parsing for name (simplified)
        const nameMatch = tomlContent.match(/name\s*=\s*["'](.*?)["']/i);
        if (nameMatch && nameMatch[1]) {
          metadata.name = nameMatch[1];
        }
      } catch (error) {
        // Ignore TOML parsing errors
      }
    }
    
    return metadata;
  }

  /**
   * Get recommended port ranges for detected technologies
   * @param {Array} technologies - Detected technologies
   * @returns {Object} Port recommendations
   */
  getPortRecommendations(technologies) {
    if (technologies.length === 0) {
      return { range: [3000, 9999], default: 3000, reason: 'No specific technology detected' };
    }
    
    // Use the highest confidence technology for port recommendation
    const primaryTech = technologies[0];
    return {
      ...primaryTech.portPreference,
      reason: `Recommended for ${primaryTech.name} projects`
    };
  }
}

module.exports = {
  WorkspaceScanner,
  DETECTION_PATTERNS,
  TECH_PORT_PREFERENCES
};
