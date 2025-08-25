# Technology Stack Detection Implementation Guide

**Version**: 2.1.0  
**Date**: August 24, 2025  
**Status**: Implementation Guide  
**Related**: [Multi-Tech Process Discovery Architecture](../architecture/MULTI-TECH-PROCESS-DISCOVERY-ARCHITECTURE.md)

## Overview

This implementation guide provides **comprehensive, step-by-step instructions** for building the Multi-Tech Stack Process Discovery Engine, including detailed code implementations, testing strategies, and deployment procedures.

## Implementation Phases

### Phase 1: Core Detection Framework (Week 1-2)

#### 1.1 Base Detection Interface

```typescript
// src/discovery/interfaces/TechStackDetector.ts
export interface DiscoveredProcess {
  pid: number
  command: string
  port?: number
  techStack: TechStack
  serverType: string
  workspace?: string
  suspectedWorkspace?: string
  confidence: number
  startTime?: Date
  parentPid?: number
  childPids?: number[]
  isContainer?: boolean
  containerId?: string
}

export interface DetectionResult {
  processes: DiscoveredProcess[]
  summary: {
    total: number
    byServerType: Record<string, number>
    confidence: {
      high: number    // > 0.8
      medium: number  // 0.5 - 0.8  
      low: number     // < 0.5
    }
  }
  detectionTime: number
  errors: DetectionError[]
}

export interface TechStackDetector {
  readonly techStack: TechStack
  readonly supportedServerTypes: string[]
  
  scanProcesses(): Promise<DetectionResult>
  correlateWithWorkspaces(processes: DiscoveredProcess[]): Promise<DiscoveredProcess[]>
  validateProcess(process: DiscoveredProcess): Promise<boolean>
  predictRoguePorts(basePort: number): Promise<number[]>
}
```

#### 1.2 Process Discovery Utilities

```typescript
// src/discovery/utils/ProcessUtils.ts
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export class ProcessUtils {
  /**
   * Execute system command safely with timeout
   */
  static async execWithTimeout(
    command: string, 
    timeoutMs: number = 5000
  ): Promise<{ stdout: string; stderr: string }> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      const result = await execAsync(command, { 
        signal: controller.signal,
        maxBuffer: 1024 * 1024 // 1MB buffer
      })
      clearTimeout(timeout)
      return result
    } catch (error) {
      clearTimeout(timeout)
      if (error.name === 'AbortError') {
        throw new Error(`Command timeout after ${timeoutMs}ms: ${command}`)
      }
      throw error
    }
  }

  /**
   * Parse process list output
   */
  static parseProcessOutput(output: string): ProcessInfo[] {
    return output.trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => this.parseProcessLine(line))
      .filter(proc => proc !== null)
  }

  private static parseProcessLine(line: string): ProcessInfo | null {
    // Handle different ps output formats
    const parts = line.split(/\s+/)
    if (parts.length < 2) return null

    const [pidStr, ...commandParts] = parts
    const pid = parseInt(pidStr)
    if (isNaN(pid)) return null

    return {
      pid,
      command: commandParts.join(' ')
    }
  }

  /**
   * Get process tree for a given PID
   */
  static async getProcessTree(pid: number): Promise<ProcessTree> {
    const cmd = `pstree -p ${pid} 2>/dev/null || true`
    try {
      const { stdout } = await this.execWithTimeout(cmd)
      return this.parseProcessTree(stdout, pid)
    } catch (error) {
      return { pid, children: [] }
    }
  }

  /**
   * Check if process is still running
   */
  static async isProcessRunning(pid: number): Promise<boolean> {
    try {
      await this.execWithTimeout(`kill -0 ${pid}`)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get process working directory
   */
  static async getProcessWorkingDirectory(pid: number): Promise<string | null> {
    try {
      const cmd = `pwdx ${pid} 2>/dev/null | cut -d: -f2 | xargs`
      const { stdout } = await this.execWithTimeout(cmd)
      return stdout.trim() || null
    } catch {
      return null
    }
  }
}
```

### Phase 2: Technology-Specific Detectors (Week 2-4)

#### 2.1 Node.js Process Detector

```typescript
// src/discovery/detectors/NodeJSProcessDetector.ts
export class NodeJSProcessDetector implements TechStackDetector {
  readonly techStack = 'nodejs' as const
  readonly supportedServerTypes = [
    'vite', 'next', 'nuxt', 'webpack', 'tsx', 
    'npm', 'yarn', 'pnpm', 'node', 'nodemon'
  ]

  private readonly DETECTION_PATTERNS = [
    { pattern: 'vite.*dev', serverType: 'vite', confidence: 0.95 },
    { pattern: 'next.*dev', serverType: 'next', confidence: 0.95 },
    { pattern: 'nuxt.*dev', serverType: 'nuxt', confidence: 0.90 },
    { pattern: 'tsx.*dev', serverType: 'tsx', confidence: 0.85 },
    { pattern: 'npm.*run.*dev', serverType: 'npm', confidence: 0.80 },
    { pattern: 'yarn.*dev', serverType: 'yarn', confidence: 0.80 },
    { pattern: 'pnpm.*dev', serverType: 'pnpm', confidence: 0.80 },
    { pattern: 'webpack.*serve', serverType: 'webpack', confidence: 0.75 },
    { pattern: 'nodemon', serverType: 'nodemon', confidence: 0.70 },
    { pattern: 'node.*server', serverType: 'node', confidence: 0.60 }
  ]

  async scanProcesses(): Promise<DetectionResult> {
    const startTime = Date.now()
    const processes: DiscoveredProcess[] = []
    const errors: DetectionError[] = []

    try {
      // Method 1: Process pattern matching
      const patternProcesses = await this.scanByPatterns()
      processes.push(...patternProcesses)

      // Method 2: Port range scanning  
      const portProcesses = await this.scanPortRange(3000, 3999)
      processes.push(...portProcesses)

      // Method 3: Package.json based detection
      const packageProcesses = await this.scanByPackageJson()
      processes.push(...packageProcesses)

      // Deduplicate and correlate
      const uniqueProcesses = this.deduplicateProcesses(processes)
      const correlatedProcesses = await this.correlateWithWorkspaces(uniqueProcesses)

    } catch (error) {
      errors.push({
        detector: 'NodeJSProcessDetector',
        error: error.message,
        timestamp: new Date()
      })
    }

    return {
      processes: correlatedProcesses,
      summary: this.generateSummary(correlatedProcesses),
      detectionTime: Date.now() - startTime,
      errors
    }
  }

  private async scanByPatterns(): Promise<DiscoveredProcess[]> {
    const processes: DiscoveredProcess[] = []

    for (const { pattern, serverType, confidence } of this.DETECTION_PATTERNS) {
      try {
        const cmd = `pgrep -fl "${pattern}"`
        const { stdout } = await ProcessUtils.execWithTimeout(cmd)
        
        const patternProcesses = ProcessUtils.parseProcessOutput(stdout)
          .map(proc => this.createDiscoveredProcess(proc, serverType, confidence))
        
        processes.push(...patternProcesses)
      } catch (error) {
        // Pattern not found, continue
      }
    }

    return processes
  }

  private async scanPortRange(start: number, end: number): Promise<DiscoveredProcess[]> {
    const cmd = `lsof -i :${start}-${end} -P -n | grep LISTEN`
    
    try {
      const { stdout } = await ProcessUtils.execWithTimeout(cmd)
      return this.parsePortOutput(stdout)
    } catch {
      return []
    }
  }

  private parsePortOutput(output: string): DiscoveredProcess[] {
    return output.trim()
      .split('\n')
      .filter(line => line.trim())
      .map(line => this.parsePortLine(line))
      .filter(proc => proc !== null)
  }

  private parsePortLine(line: string): DiscoveredProcess | null {
    // Parse lsof output: COMMAND PID USER FD TYPE DEVICE SIZE/OFF NODE NAME
    const parts = line.split(/\s+/)
    if (parts.length < 9) return null

    const [command, pidStr, , , , , , , name] = parts
    const pid = parseInt(pidStr)
    if (isNaN(pid)) return null

    const portMatch = name.match(/:(\d+)$/)
    const port = portMatch ? parseInt(portMatch[1]) : undefined

    return {
      pid,
      command,
      port,
      techStack: 'nodejs',
      serverType: this.detectServerTypeFromCommand(command),
      confidence: this.calculateConfidenceFromPort(port),
      startTime: new Date()
    }
  }

  private detectServerTypeFromCommand(command: string): string {
    const lowercaseCommand = command.toLowerCase()
    
    for (const { pattern, serverType } of this.DETECTION_PATTERNS) {
      const regex = new RegExp(pattern, 'i')
      if (regex.test(lowercaseCommand)) {
        return serverType
      }
    }
    
    return 'unknown'
  }

  private calculateConfidenceFromPort(port?: number): number {
    if (!port) return 0.3
    
    // Higher confidence for common development ports
    if (port === 3000) return 0.7
    if (port >= 3000 && port <= 3010) return 0.6
    if (port >= 3000 && port <= 3999) return 0.5
    
    return 0.3
  }

  async correlateWithWorkspaces(processes: DiscoveredProcess[]): Promise<DiscoveredProcess[]> {
    const correlatedProcesses: DiscoveredProcess[] = []

    for (const process of processes) {
      try {
        const workspace = await ProcessUtils.getProcessWorkingDirectory(process.pid)
        const packageJsonPath = workspace ? path.join(workspace, 'package.json') : null
        
        let suspectedWorkspace: string | undefined
        let confidence = process.confidence

        if (packageJsonPath && await this.fileExists(packageJsonPath)) {
          const packageJson = await this.readPackageJson(packageJsonPath)
          const correlation = this.analyzePackageJsonCorrelation(process, packageJson)
          
          confidence = Math.min(confidence + correlation.confidenceBoost, 1.0)
          suspectedWorkspace = workspace
        }

        correlatedProcesses.push({
          ...process,
          workspace,
          suspectedWorkspace,
          confidence
        })
      } catch (error) {
        // Keep original process if correlation fails
        correlatedProcesses.push(process)
      }
    }

    return correlatedProcesses
  }

  private async analyzePackageJsonCorrelation(
    process: DiscoveredProcess, 
    packageJson: any
  ): Promise<{ confidenceBoost: number; reasons: string[] }> {
    const reasons: string[] = []
    let confidenceBoost = 0

    // Check dependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies
    }

    if (process.serverType === 'vite' && allDeps.vite) {
      confidenceBoost += 0.3
      reasons.push('Vite dependency found in package.json')
    }

    if (process.serverType === 'next' && allDeps.next) {
      confidenceBoost += 0.3
      reasons.push('Next.js dependency found in package.json')
    }

    // Check scripts
    const scripts = packageJson.scripts || {}
    if (scripts.dev && process.command.includes('npm run dev')) {
      confidenceBoost += 0.2
      reasons.push('npm run dev script matches process command')
    }

    return { confidenceBoost, reasons }
  }

  private createDiscoveredProcess(
    processInfo: ProcessInfo,
    serverType: string,
    confidence: number
  ): DiscoveredProcess {
    return {
      pid: processInfo.pid,
      command: processInfo.command,
      techStack: 'nodejs',
      serverType,
      confidence,
      startTime: new Date()
    }
  }

  private deduplicateProcesses(processes: DiscoveredProcess[]): DiscoveredProcess[] {
    const pidMap = new Map<number, DiscoveredProcess>()
    
    for (const process of processes) {
      const existing = pidMap.get(process.pid)
      if (!existing || process.confidence > existing.confidence) {
        pidMap.set(process.pid, process)
      }
    }
    
    return Array.from(pidMap.values())
  }
}
```

#### 2.2 PHP Process Detector

```typescript
// src/discovery/detectors/PHPProcessDetector.ts  
export class PHPProcessDetector implements TechStackDetector {
  readonly techStack = 'php' as const
  readonly supportedServerTypes = [
    'php-builtin', 'apache', 'nginx', 'php-fpm', 'laravel', 'symfony'
  ]

  async scanProcesses(): Promise<DetectionResult> {
    const processes: DiscoveredProcess[] = []
    
    // PHP built-in server detection
    const builtinServers = await this.scanPHPBuiltinServers()
    processes.push(...builtinServers)
    
    // Web server detection (Apache, Nginx)
    const webServers = await this.scanWebServers()
    processes.push(...webServers)
    
    // PHP-FPM detection
    const fpmProcesses = await this.scanPHPFPM()
    processes.push(...fpmProcesses)
    
    // Framework detection
    const frameworkProcesses = await this.scanPHPFrameworks()
    processes.push(...frameworkProcesses)
    
    return {
      processes: await this.correlateWithWorkspaces(processes),
      summary: this.generateSummary(processes),
      detectionTime: Date.now(),
      errors: []
    }
  }

  private async scanPHPBuiltinServers(): Promise<DiscoveredProcess[]> {
    try {
      const cmd = `pgrep -fl "php.*-S"`
      const { stdout } = await ProcessUtils.execWithTimeout(cmd)
      
      return ProcessUtils.parseProcessOutput(stdout)
        .map(proc => ({
          ...proc,
          techStack: 'php' as const,
          serverType: 'php-builtin',
          port: this.extractPortFromPHPCommand(proc.command),
          confidence: 0.95
        }))
    } catch {
      return []
    }
  }

  private extractPortFromPHPCommand(command: string): number | undefined {
    // Extract port from "php -S 127.0.0.1:8080"
    const portMatch = command.match(/-S\s+[\d.]+:(\d+)/)
    return portMatch ? parseInt(portMatch[1]) : undefined
  }

  private async scanWebServers(): Promise<DiscoveredProcess[]> {
    const processes: DiscoveredProcess[] = []
    
    // Apache detection
    try {
      const apacheCmd = `pgrep -fl "apache2|httpd"`
      const { stdout: apacheOutput } = await ProcessUtils.execWithTimeout(apacheCmd)
      
      const apacheProcesses = ProcessUtils.parseProcessOutput(apacheOutput)
        .map(proc => ({
          ...proc,
          techStack: 'php' as const,
          serverType: 'apache',
          confidence: 0.8
        }))
      
      processes.push(...apacheProcesses)
    } catch {}
    
    // Nginx detection  
    try {
      const nginxCmd = `pgrep -fl "nginx"`
      const { stdout: nginxOutput } = await ProcessUtils.execWithTimeout(nginxCmd)
      
      const nginxProcesses = ProcessUtils.parseProcessOutput(nginxOutput)
        .map(proc => ({
          ...proc,
          techStack: 'php' as const,
          serverType: 'nginx',
          confidence: 0.75 // Lower confidence as nginx might not serve PHP
        }))
      
      processes.push(...nginxProcesses)
    } catch {}
    
    return processes
  }
}
```

### Phase 3: Integration and Testing (Week 4-5)

#### 3.1 Multi-Tech Discovery Engine

```typescript
// src/discovery/MultiTechProcessDiscoveryEngine.ts
export class MultiTechProcessDiscoveryEngine {
  private detectors: Map<TechStack, TechStackDetector>
  private processMonitor: ProcessMonitor
  private logger: Logger

  constructor() {
    this.detectors = new Map([
      ['nodejs', new NodeJSProcessDetector()],
      ['php', new PHPProcessDetector()],
      ['python', new PythonProcessDetector()],
      ['static', new StaticSiteProcessDetector()],
      ['docker', new DockerProcessDetector()]
    ])
    
    this.processMonitor = new ProcessMonitor()
    this.logger = new Logger('MultiTechDiscovery')
  }

  async scanSystemProcesses(): Promise<SystemProcessReport> {
    const startTime = Date.now()
    this.logger.info('Starting system-wide process discovery')

    const detectionPromises = Array.from(this.detectors.entries())
      .map(async ([techStack, detector]) => {
        try {
          const result = await detector.scanProcesses()
          this.logger.debug(`${techStack} detector found ${result.processes.length} processes`)
          return { techStack, result }
        } catch (error) {
          this.logger.error(`${techStack} detector failed:`, error)
          return { 
            techStack, 
            result: { processes: [], summary: null, errors: [error] } 
          }
        }
      })

    const detectionResults = await Promise.all(detectionPromises)
    
    // Combine and analyze results
    const combinedReport = this.combineDetectionResults(detectionResults)
    const correlationAnalysis = await this.performCrossStackCorrelation(combinedReport)
    
    const totalTime = Date.now() - startTime
    this.logger.info(`System discovery completed in ${totalTime}ms`)

    return {
      ...combinedReport,
      correlationAnalysis,
      detectionTime: totalTime,
      timestamp: new Date()
    }
  }

  private combineDetectionResults(
    results: Array<{ techStack: TechStack; result: DetectionResult }>
  ): SystemProcessReport {
    const processesByTechStack: Record<TechStack, DiscoveredProcess[]> = {}
    const allProcesses: DiscoveredProcess[] = []
    let totalErrors: DetectionError[] = []

    for (const { techStack, result } of results) {
      processesByTechStack[techStack] = result.processes
      allProcesses.push(...result.processes)
      totalErrors.push(...(result.errors || []))
    }

    return {
      processesByTechStack,
      allProcesses: this.deduplicateAndRankProcesses(allProcesses),
      rogueProcesses: allProcesses.filter(p => this.isRogueProcess(p)),
      orphanedProcesses: allProcesses.filter(p => this.isOrphanedProcess(p)),
      systemHealth: this.calculateSystemHealth(allProcesses),
      errors: totalErrors
    }
  }

  private async performCrossStackCorrelation(
    report: SystemProcessReport
  ): Promise<CorrelationAnalysis> {
    // Analyze relationships between processes across tech stacks
    const portConflicts = this.detectPortConflicts(report.allProcesses)
    const workspaceOverlaps = await this.detectWorkspaceOverlaps(report.allProcesses)
    const processChains = this.detectProcessChains(report.allProcesses)

    return {
      portConflicts,
      workspaceOverlaps,
      processChains,
      recommendations: this.generateRecommendations(report)
    }
  }
}
```

#### 3.2 Testing Strategy

```typescript
// tests/discovery/NodeJSProcessDetector.test.ts
describe('NodeJSProcessDetector', () => {
  let detector: NodeJSProcessDetector
  let mockExecUtils: jest.Mocked<typeof ProcessUtils>

  beforeEach(() => {
    detector = new NodeJSProcessDetector()
    mockExecUtils = ProcessUtils as jest.Mocked<typeof ProcessUtils>
  })

  describe('scanProcesses', () => {
    it('should detect Vite development server', async () => {
      // Mock process output
      mockExecUtils.execWithTimeout.mockResolvedValueOnce({
        stdout: '1234 node vite dev --port 3000',
        stderr: ''
      })

      mockExecUtils.parseProcessOutput.mockReturnValueOnce([
        { pid: 1234, command: 'node vite dev --port 3000' }
      ])

      const result = await detector.scanProcesses()

      expect(result.processes).toHaveLength(1)
      expect(result.processes[0]).toMatchObject({
        pid: 1234,
        techStack: 'nodejs',
        serverType: 'vite',
        confidence: expect.any(Number)
      })
    })

    it('should correlate processes with package.json', async () => {
      const mockProcess = {
        pid: 1234,
        command: 'npm run dev',
        techStack: 'nodejs' as const,
        serverType: 'npm',
        confidence: 0.8
      }

      mockExecUtils.getProcessWorkingDirectory.mockResolvedValueOnce('/test/workspace')
      
      // Mock package.json reading
      jest.spyOn(fs, 'readFile').mockResolvedValueOnce(
        JSON.stringify({
          name: 'test-project',
          scripts: { dev: 'vite dev' },
          devDependencies: { vite: '^4.0.0' }
        })
      )

      const result = await detector.correlateWithWorkspaces([mockProcess])

      expect(result[0]).toMatchObject({
        workspace: '/test/workspace',
        suspectedWorkspace: '/test/workspace',
        confidence: expect.numberMatching(n => n > 0.8)
      })
    })
  })

  describe('port conflict detection', () => {
    it('should identify Vite port increment pattern', async () => {
      const basePort = 3000
      const predictedPorts = await detector.predictRoguePorts(basePort)
      
      expect(predictedPorts).toEqual([3000, 3001, 3002, 3003, 3004])
    })
  })
})

// Integration tests
describe('MultiTechProcessDiscoveryEngine Integration', () => {
  let engine: MultiTechProcessDiscoveryEngine

  beforeEach(() => {
    engine = new MultiTechProcessDiscoveryEngine()
  })

  it('should discover processes across all tech stacks', async () => {
    // Setup mock processes for each tech stack
    await setupMockProcesses()

    const report = await engine.scanSystemProcesses()

    expect(report.processesByTechStack.nodejs).toHaveLength(2)
    expect(report.processesByTechStack.php).toHaveLength(1)
    expect(report.processesByTechStack.python).toHaveLength(1)
    expect(report.correlationAnalysis.portConflicts).toBeDefined()
  })
})
```

### Phase 4: Deployment and Monitoring (Week 5-6)

#### 4.1 Performance Monitoring

```typescript
// src/discovery/monitoring/DiscoveryMetrics.ts
export class DiscoveryMetrics {
  private metrics: Map<string, MetricValue[]> = new Map()

  recordDetectionTime(techStack: TechStack, timeMs: number): void {
    this.addMetric(`detection_time_${techStack}`, timeMs)
  }

  recordProcessCount(techStack: TechStack, count: number): void {
    this.addMetric(`process_count_${techStack}`, count)
  }

  recordAccuracy(techStack: TechStack, accuracy: number): void {
    this.addMetric(`accuracy_${techStack}`, accuracy)
  }

  generateReport(): PerformanceReport {
    const report: PerformanceReport = {}
    
    for (const [metricName, values] of this.metrics) {
      report[metricName] = {
        count: values.length,
        average: values.reduce((a, b) => a + b.value, 0) / values.length,
        min: Math.min(...values.map(v => v.value)),
        max: Math.max(...values.map(v => v.value)),
        latest: values[values.length - 1]?.value
      }
    }
    
    return report
  }
}
```

#### 4.2 Error Handling and Recovery

```typescript
// src/discovery/resilience/ErrorRecovery.ts
export class DiscoveryErrorRecovery {
  private maxRetries = 3
  private backoffMs = 1000

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<T> {
    let lastError: Error
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation()
      } catch (error) {
        lastError = error
        
        if (attempt === this.maxRetries) break
        
        const backoff = this.backoffMs * Math.pow(2, attempt - 1)
        await this.sleep(backoff)
      }
    }
    
    throw new Error(`${context} failed after ${this.maxRetries} attempts: ${lastError.message}`)
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
```

## Deployment Checklist

### Pre-deployment Testing
- [ ] Unit tests for all detectors (>95% coverage)
- [ ] Integration tests with real processes
- [ ] Performance tests (detection < 2 seconds)
- [ ] Memory usage tests (< 50MB overhead)
- [ ] Error handling verification
- [ ] Cross-platform compatibility (Linux, macOS, WSL)

### Production Deployment
- [ ] Feature flag for gradual rollout
- [ ] Monitoring and alerting setup
- [ ] Performance baseline established
- [ ] Rollback plan documented
- [ ] User documentation updated
- [ ] Training materials prepared

This implementation guide provides a **complete roadmap** for building the Multi-Tech Stack Process Discovery Engine, ensuring **robust, performant, and maintainable** code that can handle the complexity of modern development environments across all supported technology stacks.

---

**Estimated Implementation Time**: 6 weeks  
**Team Requirements**: 2-3 senior developers  
**Testing Coverage Target**: >95% unit tests, >90% integration coverage