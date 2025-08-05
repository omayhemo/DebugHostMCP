/**
 * System Processes Management
 * Displays all running processes for selected environment
 */

class SystemProcessesManager {
  constructor() {
    this.currentEnvironment = 'npm';
    this.processes = [];
    this.refreshInterval = null;
    
    this.initializeEventListeners();
  }
  
  initializeEventListeners() {
    const environmentSelect = document.getElementById('environmentSelect');
    const refreshButton = document.getElementById('refreshProcesses');
    
    if (environmentSelect) {
      environmentSelect.addEventListener('change', (e) => {
        this.currentEnvironment = e.target.value;
        this.refreshProcesses();
      });
    }
    
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refreshProcesses();
      });
    }
  }
  
  async refreshProcesses() {
    try {
      const response = await fetch(`/api/v1/servers/processes/${this.currentEnvironment}`);
      const data = await response.json();
      
      if (data.success) {
        this.processes = data.data.processes;
        this.updateProcessesDisplay(data.data);
      } else {
        console.error('Failed to fetch processes:', data.error);
        this.showError('Failed to fetch processes');
      }
    } catch (error) {
      console.error('Error fetching processes:', error);
      this.showError('Error fetching processes');
    }
  }
  
  updateProcessesDisplay(data) {
    // Update stats
    document.getElementById('totalProcesses').textContent = `Total: ${data.total}`;
    document.getElementById('trackedProcesses').textContent = `Tracked: ${data.tracked}`;
    document.getElementById('orphanedProcesses').textContent = `Orphaned: ${data.orphaned}`;
    
    // Update table
    const tbody = document.getElementById('processesTableBody');
    if (!tbody) return;
    
    if (data.processes.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" class="no-data">No processes found for ' + this.currentEnvironment + '</td></tr>';
      return;
    }
    
    tbody.innerHTML = data.processes.map(proc => this.createProcessRow(proc)).join('');
  }
  
  createProcessRow(proc) {
    const statusClass = proc.tracked ? 'tracked' : 'orphaned';
    const statusText = proc.tracked ? 'Tracked' : 'Orphaned';
    const sessionInfo = proc.sessionName || '-';
    const port = proc.port || '-';
    
    return `
      <tr class="process-row ${statusClass}">
        <td>${proc.pid}</td>
        <td><span class="status-badge ${statusClass}">${statusText}</span></td>
        <td>${sessionInfo}</td>
        <td>${port}</td>
        <td>${proc.cpu.toFixed(1)}%</td>
        <td>${proc.mem.toFixed(1)}%</td>
        <td class="command-cell" title="${this.escapeHtml(proc.command)}">${this.escapeHtml(proc.command)}</td>
        <td>
          ${!proc.tracked ? `<button class="btn btn-xs btn-danger" onclick="systemProcesses.killProcess(${proc.pid})">Kill</button>` : ''}
        </td>
      </tr>
    `;
  }
  
  async killProcess(pid) {
    if (!confirm(`Are you sure you want to kill process ${pid}?`)) {
      return;
    }
    
    try {
      // Send kill command via API
      const response = await fetch(`/api/v1/processes/${pid}/kill`, {
        method: 'POST'
      });
      
      if (response.ok) {
        this.showNotification(`Process ${pid} killed`, 'success');
        // Refresh the list
        setTimeout(() => this.refreshProcesses(), 1000);
      } else {
        this.showError(`Failed to kill process ${pid}`);
      }
    } catch (error) {
      console.error('Error killing process:', error);
      this.showError('Error killing process');
    }
  }
  
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  showError(message) {
    // If the main app has a notification system, use it
    if (window.app && window.app.showNotification) {
      window.app.showNotification(message, 'error');
    } else {
      console.error(message);
    }
  }
  
  showNotification(message, type = 'info') {
    // If the main app has a notification system, use it
    if (window.app && window.app.showNotification) {
      window.app.showNotification(message, type);
    } else {
      console.log(message);
    }
  }
  
  startAutoRefresh(interval = 5000) {
    this.stopAutoRefresh();
    this.refreshInterval = setInterval(() => {
      this.refreshProcesses();
    }, interval);
  }
  
  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  window.systemProcesses = new SystemProcessesManager();
});