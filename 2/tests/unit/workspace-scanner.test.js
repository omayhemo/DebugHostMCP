/**
 * Unit Tests: Workspace Scanner Service
 * Story 2.1: Project Registration System
 */

const { WorkspaceScanner, DETECTION_PATTERNS, TECH_PORT_PREFERENCES } = require('../../src/services/workspace-scanner');
const fs = require('fs').promises;
const path = require('path');

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    stat: jest.fn(),
    access: jest.fn(),
    readdir: jest.fn(),
    readFile: jest.fn()
  },
  constants: {
    R_OK: 4,
    W_OK: 2
  }
}));

describe('WorkspaceScanner', () => {
  let scanner;
  let mockWorkspacePath;
  
  beforeEach(() => {
    scanner = new WorkspaceScanner();
    mockWorkspacePath = '/mock/workspace';
    jest.clearAllMocks();
  });

  describe('validateWorkspace', () => {
    it('should validate a valid workspace directory', async () => {
      // Mock successful validation
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.access.mockResolvedValue();
      
      const result = await scanner.validateWorkspace(mockWorkspacePath);
      
      expect(result).toBe(path.resolve(mockWorkspacePath));
      expect(fs.stat).toHaveBeenCalledWith(path.resolve(mockWorkspacePath));
      expect(fs.access).toHaveBeenCalledWith(path.resolve(mockWorkspacePath), 4);
    });
    
    it('should throw error for missing workspace path', async () => {
      await expect(scanner.validateWorkspace()).rejects.toThrow('Workspace path is required');
    });
    
    it('should throw error for non-existent directory', async () => {
      const error = new Error('ENOENT');
      error.code = 'ENOENT';
      fs.stat.mockRejectedValue(error);
      
      await expect(scanner.validateWorkspace(mockWorkspacePath)).rejects.toThrow('Workspace directory does not exist');
    });
    
    it('should throw error for file instead of directory', async () => {
      fs.stat.mockResolvedValue({ isDirectory: () => false });
      
      await expect(scanner.validateWorkspace(mockWorkspacePath)).rejects.toThrow('Workspace path must be a directory');
    });
    
    it('should throw error for permission denied', async () => {
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      
      const error = new Error('EACCES');
      error.code = 'EACCES';
      fs.access.mockRejectedValue(error);
      
      await expect(scanner.validateWorkspace(mockWorkspacePath)).rejects.toThrow('Workspace directory is not readable');
    });
  });

  describe('getWorkspaceContents', () => {
    it('should return files and directories', async () => {
      const mockEntries = [
        { name: 'package.json', isFile: () => true, isDirectory: () => false },
        { name: 'src', isFile: () => false, isDirectory: () => true },
        { name: 'README.md', isFile: () => true, isDirectory: () => false },
        { name: 'node_modules', isFile: () => false, isDirectory: () => true }
      ];
      
      fs.readdir.mockResolvedValue(mockEntries);
      
      const result = await scanner.getWorkspaceContents(mockWorkspacePath);
      
      expect(result).toEqual({
        files: ['package.json', 'README.md'],
        directories: ['src', 'node_modules']
      });
    });
    
    it('should handle empty directory', async () => {
      fs.readdir.mockResolvedValue([]);
      
      const result = await scanner.getWorkspaceContents(mockWorkspacePath);
      
      expect(result).toEqual({
        files: [],
        directories: []
      });
    });
    
    it('should handle readdir error', async () => {
      const error = new Error('Read failed');
      fs.readdir.mockRejectedValue(error);
      
      await expect(scanner.getWorkspaceContents(mockWorkspacePath)).rejects.toThrow('Failed to read workspace contents');
    });
  });

  describe('detectTechnologyStacks', () => {
    it('should detect Node.js project', async () => {
      const contents = {
        files: ['package.json', 'index.js'],
        directories: ['node_modules']
      };
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      // Should detect multiple frameworks that could be present (nodejs, react, vue, angular based on package.json)
      expect(result.length).toBeGreaterThan(0);
      
      // Find the nodejs entry
      const nodejsTech = result.find(tech => tech.name === 'nodejs');
      expect(nodejsTech).toBeDefined();
      expect(nodejsTech.confidence).toBeGreaterThan(0);
      expect(nodejsTech.evidence).toContain('Found package.json');
      expect(nodejsTech.evidence).toContain('Found node_modules/ directory');
      
      // Results should be sorted by confidence (highest first)
      expect(result[0].confidence).toBeGreaterThanOrEqual(result[result.length - 1].confidence);
    });
    
    it('should detect Python project', async () => {
      const contents = {
        files: ['requirements.txt', 'main.py'],
        directories: ['venv']
      };
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('python');
      expect(result[0].confidence).toBeGreaterThan(0);
      expect(result[0].evidence).toContain('Found requirements.txt');
    });
    
    it('should detect multiple tech stacks', async () => {
      const contents = {
        files: ['package.json', 'requirements.txt', 'Dockerfile'],
        directories: ['node_modules', 'venv']
      };
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      expect(result.length).toBeGreaterThanOrEqual(3); // nodejs, python, docker
      
      const techNames = result.map(tech => tech.name);
      expect(techNames).toContain('nodejs');
      expect(techNames).toContain('python');
      expect(techNames).toContain('docker');
    });
    
    it('should detect React framework from package.json dependencies', async () => {
      const contents = {
        files: ['package.json'],
        directories: []
      };
      
      const packageJson = {
        dependencies: {
          react: '^18.0.0',
          'react-dom': '^18.0.0'
        }
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(packageJson));
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      const reactTech = result.find(tech => tech.name === 'react');
      expect(reactTech).toBeDefined();
      expect(reactTech.evidence).toContain('Found react dependency in package.json');
    });
    
    it('should handle missing or invalid package.json gracefully', async () => {
      const contents = {
        files: ['package.json'],
        directories: []
      };
      
      fs.readFile.mockRejectedValue(new Error('File not found'));
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      // Should still detect nodejs based on package.json file presence
      expect(result.some(tech => tech.name === 'nodejs')).toBe(true);
    });
    
    it('should return empty array for unrecognized workspace', async () => {
      const contents = {
        files: ['unknown.txt'],
        directories: []
      };
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      expect(result).toHaveLength(0);
    });
    
    it('should sort results by confidence score', async () => {
      const contents = {
        files: ['package.json', 'index.html'], // nodejs (weight 10) vs static (weight 5)
        directories: ['node_modules']
      };
      
      const result = await scanner.detectTechnologyStacks(mockWorkspacePath, contents);
      
      expect(result[0].confidence).toBeGreaterThanOrEqual(result[1].confidence);
    });
  });

  describe('generateProjectMetadata', () => {
    it('should generate basic project metadata', async () => {
      const contents = {
        files: ['index.js', 'README.md'],
        directories: ['src']
      };
      
      const technologies = [
        { name: 'nodejs', confidence: 100, evidence: ['Found package.json'] }
      ];
      
      const result = await scanner.generateProjectMetadata(mockWorkspacePath, contents, technologies);
      
      expect(result).toMatchObject({
        name: 'workspace', // basename of mockWorkspacePath
        path: mockWorkspacePath,
        primaryTech: 'nodejs',
        fileCount: 2,
        directoryCount: 1,
        isEmpty: false
      });
    });
    
    it('should extract name from package.json', async () => {
      const contents = {
        files: ['package.json'],
        directories: []
      };
      
      const technologies = [];
      
      const packageJson = {
        name: 'awesome-project',
        version: '1.2.3',
        description: 'An awesome Node.js project'
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(packageJson));
      
      const result = await scanner.generateProjectMetadata(mockWorkspacePath, contents, technologies);
      
      expect(result.name).toBe('awesome-project');
      expect(result.version).toBe('1.2.3');
      expect(result.description).toBe('An awesome Node.js project');
    });
    
    it('should extract name from pyproject.toml', async () => {
      const contents = {
        files: ['pyproject.toml'],
        directories: []
      };
      
      const technologies = [];
      
      const tomlContent = `
[project]
name = "python-awesome-project"
version = "0.1.0"
`;
      
      fs.readFile.mockResolvedValue(tomlContent);
      
      const result = await scanner.generateProjectMetadata(mockWorkspacePath, contents, technologies);
      
      expect(result.name).toBe('python-awesome-project');
    });
    
    it('should handle empty workspace', async () => {
      const contents = {
        files: [],
        directories: []
      };
      
      const technologies = [];
      
      const result = await scanner.generateProjectMetadata(mockWorkspacePath, contents, technologies);
      
      expect(result).toMatchObject({
        primaryTech: 'unknown',
        fileCount: 0,
        directoryCount: 0,
        isEmpty: true
      });
    });
  });

  describe('getPortRecommendations', () => {
    it('should return port recommendations for detected technology', () => {
      const technologies = [
        {
          name: 'nodejs',
          confidence: 100,
          portPreference: TECH_PORT_PREFERENCES.nodejs
        }
      ];
      
      const result = scanner.getPortRecommendations(technologies);
      
      expect(result).toMatchObject({
        range: [3000, 3999],
        default: 3000,
        reason: 'Recommended for nodejs projects'
      });
    });
    
    it('should return default recommendations for unknown technology', () => {
      const technologies = [];
      
      const result = scanner.getPortRecommendations(technologies);
      
      expect(result).toMatchObject({
        range: [3000, 9999],
        default: 3000,
        reason: 'No specific technology detected'
      });
    });
  });

  describe('scanWorkspace - Full Integration', () => {
    it('should perform complete workspace scan', async () => {
      // Mock all dependencies for a successful scan
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.access.mockResolvedValue();
      fs.readdir.mockResolvedValue([
        { name: 'package.json', isFile: () => true, isDirectory: () => false },
        { name: 'src', isFile: () => false, isDirectory: () => true }
      ]);
      
      const packageJson = {
        name: 'test-project',
        version: '1.0.0',
        dependencies: { react: '^18.0.0' }
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(packageJson));
      
      const result = await scanner.scanWorkspace(mockWorkspacePath);
      
      expect(result.success).toBe(true);
      expect(result.workspace).toBe(mockWorkspacePath);
      expect(result.technologies).toBeInstanceOf(Array);
      expect(result.metadata).toMatchObject({
        name: 'test-project',
        version: '1.0.0'
      });
      expect(result.scannedAt).toBeDefined();
    });
    
    it('should handle scan errors gracefully', async () => {
      fs.stat.mockRejectedValue(new Error('Permission denied'));
      
      await expect(scanner.scanWorkspace(mockWorkspacePath)).rejects.toThrow('Workspace scan failed');
    });
  });

  describe('Constants and Configuration', () => {
    it('should have valid detection patterns', () => {
      expect(DETECTION_PATTERNS).toBeDefined();
      expect(DETECTION_PATTERNS.nodejs).toMatchObject({
        files: expect.arrayContaining(['package.json']),
        weight: expect.any(Number)
      });
    });
    
    it('should have valid tech port preferences', () => {
      expect(TECH_PORT_PREFERENCES).toBeDefined();
      expect(TECH_PORT_PREFERENCES.nodejs).toMatchObject({
        range: expect.arrayContaining([expect.any(Number), expect.any(Number)]),
        default: expect.any(Number)
      });
    });
  });
});
