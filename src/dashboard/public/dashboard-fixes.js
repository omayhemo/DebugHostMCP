/**
 * Dashboard fixes for session status and controls
 * This file patches the dashboard to work with the actual service architecture
 */

(function() {
  console.log('Dashboard fixes loading...');
  
  // Wait for app to be ready
  function waitForApp() {
    if (!window.app) {
      setTimeout(waitForApp, 100);
      return;
    }
    
    console.log('App ready, applying fixes...');
    applyFixes();
  }
  
  function applyFixes() {
    // No need to redirect API URLs since dashboard and API are on the same port (2601)
    // Keep original fetch behavior
    
    // Override loadInitialState to use the correct data structure
    const originalLoadInitialState = window.app.loadInitialState;
    window.app.loadInitialState = async function() {
      try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
          const result = await response.json();
          // The global service returns { success: true, data: [...] }
          // but the dashboard expects { sessions: [...] }
          const sessions = result.data || [];
          
          // Fix session status - if a session has logs streaming, it's running
          sessions.forEach(session => {
            // Check if we have recent logs for this session
            const logs = this.logBuffer.get(session.id);
            if (logs && logs.length > 0) {
              const lastLog = logs[logs.length - 1];
              const timeSinceLastLog = Date.now() - lastLog.timestamp;
              // If we got a log in the last 30 seconds, it's probably running
              if (timeSinceLastLog < 30000) {
                session.status = 'running';
              }
            }
            
            // If status is 'starting' and it has a PID, it's likely running
            if (session.status === 'starting' && session.pid) {
              session.status = 'running';
            }
          });
          
          this.loadSessions(sessions);
        }
      } catch (error) {
        console.error('Error loading initial state:', error);
        throw error;
      }
    }.bind(window.app);
    
    // Override refreshSessions with the same logic
    window.app.refreshSessions = async function() {
      try {
        const response = await fetch('/api/sessions');
        if (response.ok) {
          const result = await response.json();
          const sessions = result.data || [];
          
          // Fix session status
          sessions.forEach(session => {
            const logs = this.logBuffer.get(session.id);
            if (logs && logs.length > 0) {
              const lastLog = logs[logs.length - 1];
              const timeSinceLastLog = Date.now() - lastLog.timestamp;
              if (timeSinceLastLog < 30000) {
                session.status = 'running';
              }
            }
            
            if (session.status === 'starting' && session.pid) {
              session.status = 'running';
            }
          });
          
          this.loadSessions(sessions);
        }
      } catch (error) {
        console.error('Error refreshing sessions:', error);
      }
    }.bind(window.app);
    
    // Add Clear Inactive button functionality
    window.app.clearInactiveSessions = async function() {
      const inactiveSessions = [];
      this.sessions.forEach((session, id) => {
        if (['stopped', 'error', 'exited'].includes(session.status)) {
          inactiveSessions.push(id);
        }
      });
      
      if (inactiveSessions.length === 0) {
        alert('No inactive sessions to clear');
        return;
      }
      
      if (!confirm(`Clear ${inactiveSessions.length} inactive session(s)?`)) {
        return;
      }
      
      try {
        const response = await fetch('/api/sessions/clear-inactive', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Inactive sessions cleared:', result);
        
        // Remove cleared sessions from local map
        if (result.removedSessions) {
          result.removedSessions.forEach(id => {
            this.sessions.delete(id);
          });
        }
        
        this.renderSessions();
        this.updateSessionCount();
        
        alert(`Cleared ${result.removedCount || 0} inactive session(s)`);
      } catch (error) {
        console.error('Error clearing inactive sessions:', error);
        alert(`Failed to clear inactive sessions: ${error.message}`);
      }
    }.bind(window.app);
    
    // Override stop session to use the correct endpoint
    window.app.stopSession = async function(sessionId, showConfirm = true) {
      if (showConfirm && !confirm('Are you sure you want to stop this server?')) {
        return;
      }
      
      try {
        // Use DELETE method on /servers endpoint for stop
        const response = await fetch(`/api/sessions/${sessionId}/stop`, {
          method: 'DELETE'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Session stopped:', result);
        
        // Update local session status
        const session = this.sessions.get(sessionId);
        if (session) {
          session.status = 'stopped';
          this.renderSessions();
        }
      } catch (error) {
        console.error('Error stopping session:', error);
        if (showConfirm) {
          alert(`Failed to stop session: ${error.message}`);
        }
        throw error;
      }
    }.bind(window.app);
    
    // Override restart session
    window.app.restartSession = async function(sessionId, showConfirm = true) {
      if (showConfirm && !confirm('Are you sure you want to restart this server?')) {
        return;
      }
      
      try {
        const response = await fetch(`/api/sessions/${sessionId}/restart`, {
          method: 'POST'
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('Session restarted:', result);
        
        // Refresh sessions after a delay
        setTimeout(() => this.refreshSessions(), 1000);
      } catch (error) {
        console.error('Error restarting session:', error);
        if (showConfirm) {
          alert(`Failed to restart session: ${error.message}`);
        }
        throw error;
      }
    }.bind(window.app);
    
    // Add the Clear Inactive button if it doesn't exist
    function addClearInactiveButton() {
      const headerButtons = document.querySelector('.header-actions');
      if (headerButtons && !document.getElementById('clearInactiveBtn')) {
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clearInactiveBtn';
        clearBtn.className = 'btn btn-secondary';
        clearBtn.innerHTML = '🧹 Clear Inactive';
        clearBtn.onclick = () => window.app.clearInactiveSessions();
        headerButtons.appendChild(clearBtn);
      }
    }
    
    // Add button after a short delay to ensure DOM is ready
    setTimeout(addClearInactiveButton, 500);
    
    // Refresh sessions immediately to get correct status
    window.app.refreshSessions();
    
    // Periodically check session status based on log activity
    setInterval(() => {
      let needsRender = false;
      window.app.sessions.forEach((session, id) => {
        const logs = window.app.logBuffer.get(id);
        if (logs && logs.length > 0) {
          const lastLog = logs[logs.length - 1];
          const timeSinceLastLog = Date.now() - lastLog.timestamp;
          
          // If we're getting logs, it's running
          if (timeSinceLastLog < 5000 && session.status !== 'running') {
            session.status = 'running';
            needsRender = true;
          }
          // If no logs for a while, it might be stopped
          else if (timeSinceLastLog > 60000 && session.status === 'running') {
            session.status = 'stopped';
            needsRender = true;
          }
        }
      });
      
      if (needsRender) {
        window.app.renderSessions();
      }
    }, 5000);
    
    console.log('Dashboard fixes applied successfully');
  }
  
  // Start waiting for app
  waitForApp();
})();