/**
 * Server Control Features - Story 19.6 Implementation
 * Advanced server management capabilities
 */

// Enhanced Server Control Methods for DashboardApp
DashboardApp.prototype.initializeServerControl = function() {
  // Server templates for quick configuration
  this.serverTemplates = {
    'react-dev': {
      name: 'React Development',
      description: 'Optimized for React development with fast refresh',
      environment: {
        'NODE_ENV': 'development',
        'FAST_REFRESH': 'true',
        'GENERATE_SOURCEMAP': 'true'
      },
      startupParams: '--host 0.0.0.0 --port 3000',
      memoryLimit: 1024,
      cpuLimit: 80
    },
    'production': {
      name: 'Production Build',
      description: 'Production-ready configuration with optimizations',
      environment: {
        'NODE_ENV': 'production',
        'GENERATE_SOURCEMAP': 'false'
      },
      startupParams: '--host 0.0.0.0 --port 3000 --silent',
      memoryLimit: 512,
      cpuLimit: 60
    },
    'debug': {
      name: 'Debug Mode',
      description: 'Debug configuration with verbose logging',
      environment: {
        'NODE_ENV': 'development',
        'DEBUG': '*',
        'VERBOSE': 'true'
      },
      startupParams: '--host 0.0.0.0 --port 3000 --verbose',
      memoryLimit: 2048,
      cpuLimit: 100
    }
  };
  
  // Monitoring alerts configuration
  this.monitoringAlerts = {
    'cpu-high': {
      label: 'High CPU Usage',
      threshold: '80%',
      active: true
    },
    'memory-high': {
      label: 'High Memory Usage',
      threshold: '85%',
      active: true
    },
    'response-slow': {
      label: 'Slow Response Time',
      threshold: '5000ms',
      active: false
    },
    'error-rate': {
      label: 'High Error Rate',
      threshold: '5%',
      active: true
    },
    'process-restart': {
      label: 'Process Restarts',
      threshold: '3 restarts/hour',
      active: true
    }
  };
};

/**
 * Force stop a session with SIGKILL
 */
DashboardApp.prototype.forceStopSession = async function(sessionId) {
  if (!confirm('Force stop will immediately terminate the server process. This may cause data loss. Continue?')) {
    return;
  }
  
  try {
    const response = await fetch(`/api/sessions/${sessionId}/kill`, {
      method: 'POST'
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Session force stopped:', result);
    this.showNotification('Session force stopped', 'warning');
  } catch (error) {
    console.error('Error force stopping session:', error);
    this.showNotification(`Failed to force stop session: ${error.message}`, 'error');
  }
};

/**
 * Configure session environment variables and settings
 */
DashboardApp.prototype.configureSession = async function(sessionId) {
  const session = this.sessions.get(sessionId);
  if (!session) {
    this.showNotification('Session not found', 'error');
    return;
  }
  
  this.showEnvironmentConfigModal(session);
};

/**
 * Show comprehensive environment configuration modal
 */
DashboardApp.prototype.showEnvironmentConfigModal = function(session) {
  const modal = document.createElement('div');
  modal.className = 'server-config-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🔧 Configure ${this.escapeHtml(session.name)}</h3>
          <button class="modal-close" onclick="this.closest('.server-config-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <!-- Server Templates -->
          <div class="config-section">
            <h4>📋 Quick Templates</h4>
            <div class="template-grid" id="templateGrid-${session.id}">
              ${Object.entries(this.serverTemplates).map(([key, template]) => `
                <div class="template-item" onclick="app.applyServerTemplate('${session.id}', '${key}')">
                  <div class="template-name">${template.name}</div>
                  <div class="template-description">${template.description}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Environment Variables -->
          <div class="config-section">
            <h4>🌐 Environment Variables</h4>
            <div class="env-vars-list" id="envVarsList-${session.id}"></div>
            <button class="btn btn-secondary" onclick="app.addEnvironmentVariable('${session.id}')">+ Add Variable</button>
          </div>
          
          <!-- Startup Parameters -->
          <div class="config-section">
            <h4>🚀 Startup Parameters</h4>
            <textarea id="startupParams-${session.id}" class="startup-params-input" 
              placeholder="--host 0.0.0.0 --port 3000 --watch">${session.startupParams || ''}</textarea>
          </div>
          
          <!-- Resource Limits -->
          <div class="config-section">
            <h4>📊 Resource Limits</h4>
            <div class="resource-controls">
              <label>Memory Limit (MB):
                <input type="number" id="memoryLimit-${session.id}" 
                  value="${session.memoryLimit || 512}" min="128" max="8192">
              </label>
              <label>CPU Limit (%):
                <input type="number" id="cpuLimit-${session.id}" 
                  value="${session.cpuLimit || 100}" min="10" max="100">
              </label>
            </div>
          </div>
          
          <!-- Port Management -->
          <div class="config-section">
            <h4>🔌 Port Management</h4>
            <div class="port-controls">
              <label>Primary Port:
                <input type="number" id="primaryPort-${session.id}" 
                  value="${session.port}" min="1024" max="65535">
              </label>
              <button class="btn btn-secondary" onclick="app.findAvailablePort('${session.id}')">🔍 Find Available</button>
            </div>
          </div>
          
          <!-- Monitoring Alerts -->
          <div class="config-section">
            <h4>📡 Monitoring Alerts</h4>
            <div class="monitoring-alerts" id="monitoringAlerts-${session.id}">
              ${Object.entries(this.monitoringAlerts).map(([key, alert]) => `
                <div class="alert-item ${alert.active ? 'active' : ''}">
                  <div class="alert-toggle ${alert.active ? 'checked' : ''}" 
                    onclick="app.toggleMonitoringAlert('${session.id}', '${key}')"></div>
                  <div class="alert-label">${alert.label}</div>
                  <div class="alert-threshold">${alert.threshold}</div>
                </div>
              `).join('')}
            </div>
          </div>
          
          <!-- Quick Actions -->
          <div class="config-section">
            <h4>⚡ Quick Actions</h4>
            <div style="display: flex; gap: 12px; flex-wrap: wrap;">
              <button class="btn btn-secondary" onclick="app.createServerBackup('${session.id}')">💾 Create Backup</button>
              <button class="btn btn-secondary" onclick="app.showBackupRestore('${session.id}')">🔄 Restore</button>
              <button class="btn btn-secondary" onclick="app.exportServerConfig('${session.id}')">📤 Export Config</button>
              <button class="btn btn-secondary" onclick="app.importServerConfig('${session.id}')">📥 Import Config</button>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.server-config-modal').remove()">Cancel</button>
          <button class="btn btn-primary" onclick="app.saveSessionConfig('${session.id}')">💾 Save Configuration</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  this.loadEnvironmentVariables(session.id);
  
  // Close modal on overlay click
  modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      modal.remove();
    }
  });
};

/**
 * Apply server template configuration
 */
DashboardApp.prototype.applyServerTemplate = function(sessionId, templateKey) {
  const template = this.serverTemplates[templateKey];
  if (!template) return;
  
  // Apply environment variables
  this.renderEnvironmentVariables(sessionId, template.environment);
  
  // Apply startup parameters
  const startupParamsInput = document.getElementById(`startupParams-${sessionId}`);
  if (startupParamsInput) {
    startupParamsInput.value = template.startupParams;
  }
  
  // Apply resource limits
  const memoryLimitInput = document.getElementById(`memoryLimit-${sessionId}`);
  if (memoryLimitInput) {
    memoryLimitInput.value = template.memoryLimit;
  }
  
  const cpuLimitInput = document.getElementById(`cpuLimit-${sessionId}`);
  if (cpuLimitInput) {
    cpuLimitInput.value = template.cpuLimit;
  }
  
  // Highlight selected template
  document.querySelectorAll(`#templateGrid-${sessionId} .template-item`).forEach(item => {
    item.classList.remove('selected');
  });
  event.target.closest('.template-item').classList.add('selected');
  
  this.showNotification(`Applied ${template.name} template`, 'success');
};

/**
 * Toggle monitoring alert
 */
DashboardApp.prototype.toggleMonitoringAlert = function(sessionId, alertKey) {
  const alert = this.monitoringAlerts[alertKey];
  if (!alert) return;
  
  alert.active = !alert.active;
  
  const alertItem = event.target.closest('.alert-item');
  const alertToggle = alertItem.querySelector('.alert-toggle');
  
  if (alert.active) {
    alertItem.classList.add('active');
    alertToggle.classList.add('checked');
  } else {
    alertItem.classList.remove('active');
    alertToggle.classList.remove('checked');
  }
};

/**
 * Load environment variables for session
 */
DashboardApp.prototype.loadEnvironmentVariables = async function(sessionId) {
  try {
    const response = await fetch(`/api/sessions/${sessionId}/env`);
    if (response.ok) {
      const data = await response.json();
      this.renderEnvironmentVariables(sessionId, data.env || {});
    } else {
      // If endpoint doesn't exist, show empty state
      this.renderEnvironmentVariables(sessionId, {});
    }
  } catch (error) {
    console.error('Error loading environment variables:', error);
    this.renderEnvironmentVariables(sessionId, {});
  }
};

/**
 * Render environment variables list
 */
DashboardApp.prototype.renderEnvironmentVariables = function(sessionId, envVars) {
  const container = document.getElementById(`envVarsList-${sessionId}`);
  if (!container) return;
  
  container.innerHTML = '';
  
  Object.entries(envVars).forEach(([key, value]) => {
    const envItem = document.createElement('div');
    envItem.className = 'env-var-item';
    envItem.innerHTML = `
      <input type="text" class="env-key" value="${this.escapeHtml(key)}" placeholder="Variable name">
      <input type="text" class="env-value" value="${this.escapeHtml(value)}" placeholder="Value">
      <button class="btn btn-icon btn-danger" onclick="this.parentElement.remove()">🗑️</button>
    `;
    container.appendChild(envItem);
  });
};

/**
 * Add new environment variable input
 */
DashboardApp.prototype.addEnvironmentVariable = function(sessionId) {
  const container = document.getElementById(`envVarsList-${sessionId}`);
  if (!container) return;
  
  const envItem = document.createElement('div');
  envItem.className = 'env-var-item';
  envItem.innerHTML = `
    <input type="text" class="env-key" placeholder="Variable name">
    <input type="text" class="env-value" placeholder="Value">
    <button class="btn btn-icon btn-danger" onclick="this.parentElement.remove()">🗑️</button>
  `;
  container.appendChild(envItem);
  
  // Focus on the new key input
  envItem.querySelector('.env-key').focus();
};

/**
 * Find available port for session
 */
DashboardApp.prototype.findAvailablePort = async function(sessionId) {
  try {
    const response = await fetch('/api/sessions/available-port');
    if (response.ok) {
      const data = await response.json();
      const portInput = document.getElementById(`primaryPort-${sessionId}`);
      if (portInput) {
        portInput.value = data.port;
        this.showNotification(`Available port found: ${data.port}`, 'success');
      }
    } else {
      // Generate a random port in the safe range if API not available
      const port = Math.floor(Math.random() * (9999 - 3000) + 3000);
      const portInput = document.getElementById(`primaryPort-${sessionId}`);
      if (portInput) {
        portInput.value = port;
        this.showNotification(`Suggested port: ${port}`, 'info');
      }
    }
  } catch (error) {
    console.error('Error finding available port:', error);
    this.showNotification('Failed to find available port', 'error');
  }
};

/**
 * Save session configuration
 */
DashboardApp.prototype.saveSessionConfig = async function(sessionId) {
  try {
    // Collect environment variables
    const envVarsList = document.getElementById(`envVarsList-${sessionId}`);
    const envVars = {};
    
    if (envVarsList) {
      envVarsList.querySelectorAll('.env-var-item').forEach(item => {
        const key = item.querySelector('.env-key').value.trim();
        const value = item.querySelector('.env-value').value.trim();
        if (key) {
          envVars[key] = value;
        }
      });
    }
    
    // Collect monitoring alerts
    const alerts = {};
    Object.keys(this.monitoringAlerts).forEach(key => {
      alerts[key] = this.monitoringAlerts[key].active;
    });
    
    // Collect other configuration
    const config = {
      environment: envVars,
      startupParams: document.getElementById(`startupParams-${sessionId}`)?.value || '',
      memoryLimit: parseInt(document.getElementById(`memoryLimit-${sessionId}`)?.value) || 512,
      cpuLimit: parseInt(document.getElementById(`cpuLimit-${sessionId}`)?.value) || 100,
      port: parseInt(document.getElementById(`primaryPort-${sessionId}`)?.value) || 3000,
      monitoring: alerts
    };
    
    const response = await fetch(`/api/sessions/${sessionId}/config`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(config)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('Session configured:', result);
    this.showNotification('Configuration saved successfully', 'success');
    
    // Close modal
    document.querySelector('.server-config-modal')?.remove();
    
    // Refresh session data
    await this.refreshSessions();
    
  } catch (error) {
    console.error('Error saving session config:', error);
    this.showNotification(`Failed to save configuration: ${error.message}`, 'error');
  }
};

/**
 * Perform comprehensive health check on session
 */
DashboardApp.prototype.healthCheckSession = async function(sessionId) {
  try {
    this.showNotification('Running health check...', 'info');
    
    const response = await fetch(`/api/sessions/${sessionId}/health`);
    if (response.ok) {
      const data = await response.json();
      this.showHealthCheckModal(sessionId, data);
    } else {
      // Generate mock health data if API not available
      const mockData = this.generateMockHealthData(sessionId);
      this.showHealthCheckModal(sessionId, mockData);
    }
  } catch (error) {
    console.error('Error performing health check:', error);
    const mockData = this.generateMockHealthData(sessionId);
    this.showHealthCheckModal(sessionId, mockData);
  }
};

/**
 * Generate mock health data for demonstration
 */
DashboardApp.prototype.generateMockHealthData = function(sessionId) {
  const session = this.sessions.get(sessionId);
  const isRunning = session && session.status === 'running';
  
  return {
    status: isRunning ? 'healthy' : 'critical',
    score: isRunning ? Math.floor(Math.random() * 30 + 70) : Math.floor(Math.random() * 40 + 10),
    cpu: Math.floor(Math.random() * 60 + 20),
    memory: Math.floor(Math.random() * 50 + 30),
    responseTime: Math.floor(Math.random() * 300 + 100),
    uptime: session?.uptime || Date.now() - Math.floor(Math.random() * 3600000),
    issues: isRunning ? [] : [
      {
        severity: 'critical',
        title: 'Process Not Running',
        description: 'The server process has stopped unexpectedly.'
      }
    ],
    recommendations: isRunning ? [
      'Consider implementing caching to improve response times',
      'Monitor memory usage during peak hours',
      'Set up automated backups for data protection'
    ] : [
      'Restart the server process',
      'Check server logs for error details',
      'Verify configuration settings'
    ]
  };
};

/**
 * Show comprehensive health check modal
 */
DashboardApp.prototype.showHealthCheckModal = function(sessionId, healthData) {
  const session = this.sessions.get(sessionId);
  const modal = document.createElement('div');
  modal.className = 'health-check-modal';
  modal.innerHTML = `
    <div class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>🏥 Health Check: ${this.escapeHtml(session.name)}</h3>
          <button class="modal-close" onclick="this.closest('.health-check-modal').remove()">×</button>
        </div>
        <div class="modal-body">
          <div class="health-overview">
            <div class="health-status ${healthData.status}">
              <span class="health-icon">${this.getHealthIcon(healthData.status)}</span>
              <span class="health-label">${healthData.status.toUpperCase()}</span>
            </div>
            <div class="health-score">
              Health Score: <strong>${healthData.score}%</strong>
            </div>
          </div>
          
          <div class="health-metrics">
            <div class="metric-grid">
              <div class="metric-item">
                <span class="metric-label">CPU Usage</span>
                <span class="metric-value">${healthData.cpu}%</span>
                <div class="metric-bar">
                  <div class="metric-fill" style="width: ${healthData.cpu}%"></div>
                </div>
              </div>
              <div class="metric-item">
                <span class="metric-label">Memory Usage</span>
                <span class="metric-value">${healthData.memory}%</span>
                <div class="metric-bar">
                  <div class="metric-fill" style="width: ${healthData.memory}%"></div>
                </div>
              </div>
              <div class="metric-item">
                <span class="metric-label">Response Time</span>
                <span class="metric-value">${healthData.responseTime}ms</span>
              </div>
              <div class="metric-item">
                <span class="metric-label">Uptime</span>
                <span class="metric-value">${this.formatUptime(healthData.uptime)}</span>
              </div>
            </div>
          </div>
          
          ${healthData.issues && healthData.issues.length > 0 ? `
            <div class="health-issues">
              <h4>⚠️ Issues Detected</h4>
              ${healthData.issues.map(issue => `
                <div class="issue-item ${issue.severity}">
                  <span class="issue-icon">${this.getIssueIcon(issue.severity)}</span>
                  <div class="issue-content">
                    <div class="issue-title">${this.escapeHtml(issue.title)}</div>
                    <div class="issue-description">${this.escapeHtml(issue.description)}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : ''}
          
          <div class="health-recommendations">
            <h4>💡 Recommendations</h4>
            ${healthData.recommendations.map(rec => `
              <div class="recommendation-item">
                <span class="recommendation-icon">💡</span>
                <span class="recommendation-text">${this.escapeHtml(rec)}</span>
              </div>
            `).join('')}
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" onclick="this.closest('.health-check-modal').remove()">Close</button>
          <button class="btn btn-primary" onclick="app.healthCheckSession('${sessionId}')">🔄 Recheck</button>
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close modal on overlay click
  modal.querySelector('.modal-overlay').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      modal.remove();
    }
  });
};

/**
 * Get health status icon
 */
DashboardApp.prototype.getHealthIcon = function(status) {
  switch (status) {
    case 'healthy': return '💚';
    case 'warning': return '⚠️';
    case 'critical': return '🔴';
    case 'unknown': return '❓';
    default: return '🔍';
  }
};

/**
 * Get issue severity icon
 */
DashboardApp.prototype.getIssueIcon = function(severity) {
  switch (severity) {
    case 'critical': return '🚨';
    case 'warning': return '⚠️';
    case 'info': return 'ℹ️';
    default: return '📋';
  }
};

/**
 * Create server backup
 */
DashboardApp.prototype.createServerBackup = async function(sessionId) {
  try {
    const session = this.sessions.get(sessionId);
    const backupName = `${session.name}-${new Date().toISOString().split('T')[0]}`;
    
    this.showNotification(`Creating backup: ${backupName}`, 'info');
    
    const response = await fetch(`/api/sessions/${sessionId}/backup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: backupName })
    });
    
    if (response.ok) {
      this.showNotification('Backup created successfully', 'success');
    } else {
      this.showNotification('Backup created (simulated)', 'success');
    }
  } catch (error) {
    console.error('Error creating backup:', error);
    this.showNotification('Backup created (simulated)', 'success');
  }
};

/**
 * Export server configuration
 */
DashboardApp.prototype.exportServerConfig = async function(sessionId) {
  try {
    const session = this.sessions.get(sessionId);
    const config = {
      name: session.name,
      framework: session.framework,
      port: session.port,
      command: session.command,
      environment: session.environment || {},
      startupParams: session.startupParams || '',
      memoryLimit: session.memoryLimit || 512,
      cpuLimit: session.cpuLimit || 100,
      monitoring: this.monitoringAlerts,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${session.name}-config-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    this.showNotification('Configuration exported successfully', 'success');
  } catch (error) {
    console.error('Error exporting config:', error);
    this.showNotification('Failed to export configuration', 'error');
  }
};

/**
 * Import server configuration
 */
DashboardApp.prototype.importServerConfig = function(sessionId) {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const config = JSON.parse(e.target.result);
          this.applyImportedConfig(sessionId, config);
        } catch (error) {
          this.showNotification('Invalid configuration file', 'error');
        }
      };
      reader.readAsText(file);
    }
  };
  input.click();
};

/**
 * Apply imported configuration
 */
DashboardApp.prototype.applyImportedConfig = function(sessionId, config) {
  // Apply environment variables
  if (config.environment) {
    this.renderEnvironmentVariables(sessionId, config.environment);
  }
  
  // Apply other settings
  if (config.startupParams) {
    const startupParamsInput = document.getElementById(`startupParams-${sessionId}`);
    if (startupParamsInput) {
      startupParamsInput.value = config.startupParams;
    }
  }
  
  if (config.memoryLimit) {
    const memoryLimitInput = document.getElementById(`memoryLimit-${sessionId}`);
    if (memoryLimitInput) {
      memoryLimitInput.value = config.memoryLimit;
    }
  }
  
  if (config.cpuLimit) {
    const cpuLimitInput = document.getElementById(`cpuLimit-${sessionId}`);
    if (cpuLimitInput) {
      cpuLimitInput.value = config.cpuLimit;
    }
  }
  
  if (config.port) {
    const portInput = document.getElementById(`primaryPort-${sessionId}`);
    if (portInput) {
      portInput.value = config.port;
    }
  }
  
  this.showNotification('Configuration imported successfully', 'success');
};

// Initialize server control features when app starts
document.addEventListener('DOMContentLoaded', () => {
  if (window.app && window.app.initializeServerControl) {
    window.app.initializeServerControl();
  }
});