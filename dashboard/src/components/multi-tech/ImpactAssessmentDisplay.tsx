/**
 * Impact Assessment Display Component
 * 
 * Sprint 7 - Story 3.9: Bulk Operations & Safety Controls
 * 
 * Comprehensive impact assessment visualization showing:
 * - Workspace impact analysis
 * - Process dependency visualization
 * - Downtime estimation
 * - Resource utilization effects
 * - Rollback preparation details
 */

import React, { useMemo } from 'react';
import { 
  ImpactAssessment, 
  DiscoveredProcess, 
  BulkOperationType 
} from '../../types';
import { cn } from '../../utils/cn';

interface ImpactAssessmentDisplayProps {
  impact: ImpactAssessment;
  operation: BulkOperationType;
  processes: DiscoveredProcess[];
  className?: string;
}

/**
 * Workspace Impact Details
 */
interface WorkspaceImpact {
  workspace: string;
  processCount: number;
  processes: DiscoveredProcess[];
  estimatedDowntime: string;
  services: string[];
  riskLevel: 'low' | 'medium' | 'high';
}

/**
 * Service Dependency Visualization
 */
interface ServiceDependency {
  service: string;
  dependentProcesses: DiscoveredProcess[];
  impactLevel: 'minimal' | 'moderate' | 'severe';
  recoveryTime: string;
}

/**
 * Main Impact Assessment Display Component
 */
export const ImpactAssessmentDisplay: React.FC<ImpactAssessmentDisplayProps> = ({
  impact,
  operation,
  processes,
  className
}) => {
  // Calculate workspace-specific impacts
  const workspaceImpacts = useMemo((): WorkspaceImpact[] => {
    const workspaceMap = new Map<string, DiscoveredProcess[]>();
    
    processes.forEach(process => {
      const workspace = process.workspace || 'Unknown';
      if (!workspaceMap.has(workspace)) {
        workspaceMap.set(workspace, []);
      }
      workspaceMap.get(workspace)!.push(process);
    });

    return Array.from(workspaceMap.entries()).map(([workspace, workspaceProcesses]) => {
      // Determine risk level based on process types and operation
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      
      const hasRunningProcesses = workspaceProcesses.some(p => p.status === 'running');
      const hasRogueProcesses = workspaceProcesses.some(p => p.category === 'rogue');
      const hasSystemProcesses = workspaceProcesses.some(p => p.pid < 1000);

      if (hasSystemProcesses || (operation === 'terminate' && hasRunningProcesses)) {
        riskLevel = 'high';
      } else if (hasRogueProcesses || hasRunningProcesses) {
        riskLevel = 'medium';
      }

      // Extract unique services/frameworks
      const services = Array.from(new Set(
        workspaceProcesses
          .map(p => p.serverType || p.framework)
          .filter(Boolean) as string[]
      ));

      // Estimate downtime based on operation and process types
      let estimatedDowntime = '< 1 second';
      if (operation === 'terminate' && hasRunningProcesses) {
        estimatedDowntime = '5-10 seconds';
      } else if (operation === 'restart') {
        estimatedDowntime = '10-30 seconds';
      } else if (operation === 'cleanup') {
        estimatedDowntime = '1-5 seconds';
      }

      return {
        workspace,
        processCount: workspaceProcesses.length,
        processes: workspaceProcesses,
        estimatedDowntime,
        services,
        riskLevel
      };
    }).sort((a, b) => {
      // Sort by risk level (high first) then by process count
      const riskOrder = { high: 0, medium: 1, low: 2 };
      if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      }
      return b.processCount - a.processCount;
    });
  }, [processes, operation]);

  // Calculate service dependencies
  const serviceDependencies = useMemo((): ServiceDependency[] => {
    const serviceMap = new Map<string, DiscoveredProcess[]>();
    
    processes.forEach(process => {
      const service = process.serverType || process.framework || 'Unknown Service';
      if (!serviceMap.has(service)) {
        serviceMap.set(service, []);
      }
      serviceMap.get(service)!.push(process);
    });

    return Array.from(serviceMap.entries()).map(([service, serviceProcesses]) => {
      // Determine impact level
      let impactLevel: 'minimal' | 'moderate' | 'severe' = 'minimal';
      let recoveryTime = '< 30 seconds';

      const runningCount = serviceProcesses.filter(p => p.status === 'running').length;
      const totalCount = serviceProcesses.length;

      if (operation === 'terminate') {
        if (runningCount === totalCount && totalCount > 1) {
          impactLevel = 'severe';
          recoveryTime = '2-5 minutes';
        } else if (runningCount > 0) {
          impactLevel = 'moderate';
          recoveryTime = '1-2 minutes';
        }
      } else if (operation === 'restart' && runningCount > 0) {
        impactLevel = totalCount > 1 ? 'moderate' : 'minimal';
        recoveryTime = '30-60 seconds';
      }

      return {
        service,
        dependentProcesses: serviceProcesses,
        impactLevel,
        recoveryTime
      };
    }).sort((a, b) => {
      // Sort by impact level
      const impactOrder = { severe: 0, moderate: 1, minimal: 2 };
      if (impactOrder[a.impactLevel] !== impactOrder[b.impactLevel]) {
        return impactOrder[a.impactLevel] - impactOrder[b.impactLevel];
      }
      return b.dependentProcesses.length - a.dependentProcesses.length;
    });
  }, [processes, operation]);

  // Calculate resource utilization impact
  const resourceImpact = useMemo(() => {
    const totalMemory = processes.reduce((sum, p) => sum + (p.memoryUsage || 0), 0);
    const totalCpu = processes.reduce((sum, p) => sum + (p.cpuUsage || 0), 0);
    const portCount = processes.filter(p => p.port).length;
    
    return {
      memoryFreed: totalMemory > 0 ? `~${Math.round(totalMemory / 1024 / 1024)}MB` : 'Unknown',
      cpuFreed: totalCpu > 0 ? `~${Math.round(totalCpu)}%` : 'Unknown',
      portsFreed: portCount,
      processesAffected: processes.length
    };
  }, [processes]);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Summary Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-blue-600 dark:text-blue-400">📊</span>
            <h4 className="font-medium text-blue-800 dark:text-blue-200">Total Impact</h4>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {impact.processCount}
          </div>
          <div className="text-sm text-blue-600 dark:text-blue-400">
            Processes Affected
          </div>
        </div>

        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-orange-600 dark:text-orange-400">⏱️</span>
            <h4 className="font-medium text-orange-800 dark:text-orange-200">Downtime</h4>
          </div>
          <div className="text-lg font-bold text-orange-900 dark:text-orange-100">
            {impact.estimatedDowntime}
          </div>
          <div className="text-sm text-orange-600 dark:text-orange-400">
            Estimated Max
          </div>
        </div>

        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-green-600 dark:text-green-400">📁</span>
            <h4 className="font-medium text-green-800 dark:text-green-200">Workspaces</h4>
          </div>
          <div className="text-2xl font-bold text-green-900 dark:text-green-100">
            {workspaceImpacts.length}
          </div>
          <div className="text-sm text-green-600 dark:text-green-400">
            Affected Projects
          </div>
        </div>

        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-purple-600 dark:text-purple-400">🔧</span>
            <h4 className="font-medium text-purple-800 dark:text-purple-200">Services</h4>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {serviceDependencies.length}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-400">
            Service Types
          </div>
        </div>
      </div>

      {/* Workspace Impact Analysis */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Workspace Impact Analysis
        </h3>
        
        <div className="space-y-3">
          {workspaceImpacts.map((workspace, index) => {
            const riskColors = {
              low: 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20',
              medium: 'border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20',
              high: 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20'
            };

            const riskIcons = {
              low: '✅',
              medium: '⚠️',
              high: '🔥'
            };

            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border',
                  riskColors[workspace.riskLevel]
                )}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{riskIcons[workspace.riskLevel]}</span>
                    <div>
                      <h4 className="font-medium text-foreground">
                        {workspace.workspace === 'Unknown' ? '🔍 Unknown Workspace' : `📁 ${workspace.workspace}`}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {workspace.processCount} processes • {workspace.estimatedDowntime} downtime
                      </p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm font-medium text-foreground">
                      {workspace.riskLevel.toUpperCase()} RISK
                    </div>
                    {workspace.services.length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        {workspace.services.join(', ')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Process Breakdown */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {workspace.processes.map(process => (
                    <div
                      key={process.pid}
                      className="flex items-center gap-2 text-sm p-2 bg-background/50 rounded"
                    >
                      <span className="font-mono text-xs">{process.pid}</span>
                      <span className="truncate flex-1">{process.command}</span>
                      {process.status === 'running' && (
                        <span className="text-green-600 dark:text-green-400">●</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Service Dependencies */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Service Dependencies & Recovery
        </h3>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {serviceDependencies.map((service, index) => {
            const impactColors = {
              minimal: 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10',
              moderate: 'border-orange-200 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/10',
              severe: 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/10'
            };

            const impactIcons = {
              minimal: '🟢',
              moderate: '🟡',
              severe: '🔴'
            };

            return (
              <div
                key={index}
                className={cn(
                  'p-4 rounded-lg border',
                  impactColors[service.impactLevel]
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span>{impactIcons[service.impactLevel]}</span>
                    <h4 className="font-medium text-foreground">
                      {service.service}
                    </h4>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {service.dependentProcesses.length} processes
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Impact Level:</span>
                    <span className="font-medium capitalize">{service.impactLevel}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Recovery Time:</span>
                    <span className="font-medium">{service.recoveryTime}</span>
                  </div>
                  
                  {/* Running processes indicator */}
                  {service.dependentProcesses.some(p => p.status === 'running') && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">●</span>
                      <span className="text-muted-foreground">
                        {service.dependentProcesses.filter(p => p.status === 'running').length} running
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Resource Impact */}
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-4">
          Resource Utilization Impact
        </h3>
        
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-foreground">
                {resourceImpact.memoryFreed}
              </div>
              <div className="text-sm text-muted-foreground">
                Memory Released
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-foreground">
                {resourceImpact.cpuFreed}
              </div>
              <div className="text-sm text-muted-foreground">
                CPU Released
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-foreground">
                {resourceImpact.portsFreed}
              </div>
              <div className="text-sm text-muted-foreground">
                Ports Freed
              </div>
            </div>
            
            <div>
              <div className="text-lg font-semibold text-foreground">
                {resourceImpact.processesAffected}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Processes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Rollback Plan */}
      {impact.rollbackPlan && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Rollback & Recovery Plan
          </h3>
          
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <span className="text-blue-600 dark:text-blue-400 text-xl">💡</span>
              <div className="flex-1">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  Recovery Strategy
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  {impact.rollbackPlan}
                </p>
                
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/20 rounded">
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      Pre-operation State
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">
                      Process states captured for rollback
                    </div>
                  </div>
                  
                  <div className="p-2 bg-blue-100 dark:bg-blue-800/20 rounded">
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      Recovery Time
                    </div>
                    <div className="text-blue-600 dark:text-blue-400">
                      Estimated: {impact.estimatedDowntime}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Risk Factors Summary */}
      {impact.riskFactors && impact.riskFactors.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Risk Factors & Considerations
          </h3>
          
          <div className="space-y-2">
            {impact.riskFactors.map((factor, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
              >
                <span className="text-orange-600 dark:text-orange-400">⚠️</span>
                <span className="text-sm text-orange-700 dark:text-orange-300">
                  {factor}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImpactAssessmentDisplay;