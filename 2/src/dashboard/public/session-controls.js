/**
 * Session control functionality for the Debug Host Dashboard
 * Handles restart, delete, and clear inactive operations
 */

class SessionControls {
  constructor(app) {
    this.app = app;
    this.initializeControls();
  }

  initializeControls() {
    // Add Clear Inactive button if not present
    this.addClearInactiveButton();
    
    // Bind global event handlers
    this.bindEventHandlers();
  }

  addClearInactiveButton() {
    // Check if button already exists
    if (document.getElementById('clearInactive')) {
      return;
    }

    // Find the batch controls container
    const batchControls = document.querySelector('.batch-controls');
    if (batchControls) {
      const clearInactiveBtn = document.createElement('button');
      clearInactiveBtn.id = 'clearInactive';
      clearInactiveBtn.className = 'btn btn-secondary';
      clearInactiveBtn.innerHTML = '🧹 Clear Inactive';
      clearInactiveBtn.onclick = () => this.clearInactiveSessions();
      batchControls.appendChild(clearInactiveBtn);
    }
  }

  bindEventHandlers() {
    // Override the window functions to ensure they use our implementations
    window.app.restartSession = (sessionId) => this.restartSession(sessionId);
    window.app.deleteSession = (sessionId) => this.deleteSession(sessionId);
    window.app.forceStopSession = (sessionId) => this.forceStopSession(sessionId);
    window.app.clearInactiveSessions = () => this.clearInactiveSessions();
  }

  /**
   * Restart a server session
   */
  async restartSession(sessionId) {
    if (!confirm('Are you sure you want to restart this server?')) {
      return;
    }

    try {
      const url = window.apiConfig ? window.apiConfig.getRestartUrl(sessionId) : `/api/sessions/${sessionId}/restart`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Session restarted:', result);
      
      // Show notification
      if (this.app.showNotification) {
        this.app.showNotification('Session restarting...', 'success');
      }
      
      // Refresh sessions after a short delay to allow the server to restart
      setTimeout(() => {
        this.app.refreshSessions();
      }, 1000);
      
    } catch (error) {
      console.error('Error restarting session:', error);
      if (this.app.showNotification) {
        this.app.showNotification(`Failed to restart session: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Delete a server session
   */
  async deleteSession(sessionId) {
    if (!confirm('Are you sure you want to delete this session? This cannot be undone.')) {
      return;
    }

    try {
      const url = window.apiConfig ? window.apiConfig.getDeleteUrl(sessionId) : `/api/sessions/${sessionId}`;
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Session deleted:', result);
      
      // Remove from local sessions map
      if (this.app.sessions) {
        this.app.sessions.delete(sessionId);
      }
      
      // Show notification
      if (this.app.showNotification) {
        this.app.showNotification('Session deleted successfully', 'success');
      }
      
      // Refresh the UI
      this.app.renderSessions();
      this.app.updateSessionCount();
      
    } catch (error) {
      console.error('Error deleting session:', error);
      if (this.app.showNotification) {
        this.app.showNotification(`Failed to delete session: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Force stop a server session
   */
  async forceStopSession(sessionId) {
    if (!confirm('Force stop this server? This may cause data loss.')) {
      return;
    }

    try {
      const response = await fetch(`/api/sessions/${sessionId}/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ force: true })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Session force stopped:', result);
      
      // Show notification
      if (this.app.showNotification) {
        this.app.showNotification('Session force stopped', 'warning');
      }
      
      // Refresh sessions
      this.app.refreshSessions();
      
    } catch (error) {
      console.error('Error force stopping session:', error);
      if (this.app.showNotification) {
        this.app.showNotification(`Failed to force stop session: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Clear all inactive sessions
   */
  async clearInactiveSessions() {
    // Count inactive sessions first
    let inactiveCount = 0;
    if (this.app.sessions) {
      this.app.sessions.forEach(session => {
        if (['stopped', 'error', 'exited'].includes(session.status)) {
          inactiveCount++;
        }
      });
    }

    if (inactiveCount === 0) {
      if (this.app.showNotification) {
        this.app.showNotification('No inactive sessions to clear', 'info');
      }
      return;
    }

    if (!confirm(`Clear ${inactiveCount} inactive session(s)?`)) {
      return;
    }

    try {
      const url = window.apiConfig ? window.apiConfig.getClearInactiveUrl() : '/api/sessions/clear-inactive';
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      const result = await response.json();
      console.log('Inactive sessions cleared:', result);
      
      // Remove from local sessions map
      if (this.app.sessions && result.removedSessions) {
        result.removedSessions.forEach(sessionId => {
          this.app.sessions.delete(sessionId);
        });
      }
      
      // Show notification
      if (this.app.showNotification) {
        this.app.showNotification(
          `Cleared ${result.removedCount} inactive session(s)`, 
          'success'
        );
      }
      
      // Refresh the UI
      this.app.renderSessions();
      this.app.updateSessionCount();
      
    } catch (error) {
      console.error('Error clearing inactive sessions:', error);
      if (this.app.showNotification) {
        this.app.showNotification(`Failed to clear inactive sessions: ${error.message}`, 'error');
      }
    }
  }

  /**
   * Update session card to ensure delete button is always visible for stopped sessions
   */
  updateSessionCard(session) {
    // This method can be called to update the session card UI
    // Ensures delete button remains visible for stopped/error sessions
    const card = document.querySelector(`[data-session-id="${session.id}"]`);
    if (!card) return;

    const actionsContainer = card.querySelector('.session-actions');
    if (!actionsContainer) return;

    // Always show delete button for stopped or error sessions
    if (['stopped', 'error'].includes(session.status)) {
      let deleteBtn = actionsContainer.querySelector('.btn-delete');
      if (!deleteBtn) {
        deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn btn-danger btn-delete';
        deleteBtn.innerHTML = '🗑️ Delete';
        deleteBtn.onclick = () => this.deleteSession(session.id);
        actionsContainer.appendChild(deleteBtn);
      }
    }
  }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Wait for the main app to be initialized
  const checkApp = setInterval(() => {
    if (window.app) {
      clearInterval(checkApp);
      window.sessionControls = new SessionControls(window.app);
      console.log('Session controls initialized');
    }
  }, 100);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = SessionControls;
}