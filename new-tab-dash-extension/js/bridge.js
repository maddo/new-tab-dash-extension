/**
 * Bridge module to connect ES modules with traditional scripts
 * This provides a transition layer allowing both paradigms to work together
 */

import { initGitHub } from './github.js';
import { initJira } from './jira.js';
import { initTheme } from './theme.js';
import { initLinks } from './links.js';
import { showConfigModal, showSetupMessage, showErrorMessage, extractRepoName, formatRelativeDate } from './utils.js';
import * as cacheUtils from './utils/cache.js';

// Make functions globally available
window.initGitHub = initGitHub;
window.initJira = initJira;
window.initTheme = initTheme;
window.initLinks = initLinks;
window.showConfigModal = showConfigModal;
window.showSetupMessage = showSetupMessage;
window.showErrorMessage = showErrorMessage;
window.extractRepoName = extractRepoName;
window.formatRelativeDate = formatRelativeDate;
window.clearAllCache = cacheUtils.clearAllCache;

// Cache utilities
window.initializeCache = () => {
  if (typeof cacheUtils.initializeCacheTimer === 'function') {
    cacheUtils.initializeCacheTimer();
  }
};

// Helper functions that were in dashboard.js
window.updateLastUpdated = () => {
  const lastUpdated = document.getElementById('last-updated');
  if (lastUpdated) {
    lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
  }
};

// User credentials display functions
function updateUserInfoDisplay() {
  // GitHub user info
  const githubUsername = localStorage.getItem('githubUsername') || 'Not configured';
  const githubToken = localStorage.getItem('githubToken') || '';
  
  const githubUsernameElem = document.getElementById('github-username');
  const githubTokenElem = document.getElementById('github-token');
  
  if (githubUsernameElem) {
    githubUsernameElem.textContent = githubUsername;
  }
  
  if (githubTokenElem && githubToken) {
    // Show only last 4 chars of token
    githubTokenElem.textContent = `•••• ${githubToken.slice(-4)}`;
  } else if (githubTokenElem) {
    githubTokenElem.textContent = 'No token saved';
  }
  
  // Jira user info
  const jiraUsername = localStorage.getItem('jiraEmail') || 'Not configured';
  const jiraToken = localStorage.getItem('jiraToken') || '';
  
  const jiraUsernameElem = document.getElementById('jira-username');
  const jiraTokenElem = document.getElementById('jira-token');
  
  if (jiraUsernameElem) {
    jiraUsernameElem.textContent = jiraUsername;
  }
  
  if (jiraTokenElem && jiraToken) {
    // Show only last 4 chars of token
    jiraTokenElem.textContent = `•••• ${jiraToken.slice(-4)}`;
  } else if (jiraTokenElem) {
    jiraTokenElem.textContent = 'No token saved';
  }
}

// Clear credentials functions
function setupClearCredentials() {
  const githubClearBtn = document.getElementById('github-clear');
  const jiraClearBtn = document.getElementById('jira-clear');
  
  if (githubClearBtn) {
    githubClearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (confirm('Are you sure you want to clear your GitHub credentials?')) {
        localStorage.removeItem('githubUsername');
        localStorage.removeItem('githubToken');
        updateUserInfoDisplay();
        setConnectionStatus('github', 'error');
      }
    });
  }
  
  if (jiraClearBtn) {
    jiraClearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (confirm('Are you sure you want to clear your Jira credentials?')) {
        localStorage.removeItem('jiraEmail');
        localStorage.removeItem('jiraToken');
        localStorage.removeItem('jiraDomain');
        updateUserInfoDisplay();
        setConnectionStatus('jira', 'error');
      }
    });
  }
  
  // Prevent tooltip click from triggering parent click
  const tooltips = document.querySelectorAll('.status-tooltip');
  for (const tooltip of tooltips) {
    tooltip.addEventListener('click', (e) => {
      e.stopPropagation();
    });
  }
}

// Set up all UI event listeners
function setupConfigListeners() {
  // Setup config buttons in status bar
  const githubStatusBtn = document.getElementById('github-status');
  if (githubStatusBtn) {
    githubStatusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showConfigModal('github');
    });
  }

  const jiraStatusBtn = document.getElementById('jira-status');
  if (jiraStatusBtn) {
    jiraStatusBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showConfigModal('jira');
    });
  }

  // Setup modal close button
  const closeBtn = document.querySelector('.close');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      const modal = document.getElementById('config-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  }

  // Close modal when clicking outside
  const modal = document.getElementById('config-modal');
  if (modal) {
    window.addEventListener('click', (event) => {
      if (event.target === modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Setup toggle buttons for collapsible sections
  setupSectionToggles();
  
  // Setup cache timer display
  setupCacheTimer();
}

// Setup section toggle functionality
function setupSectionToggles() {
  const sections = document.querySelectorAll('.service-section');
  for (const section of sections) {
    const header = section.querySelector('.section-header');
    const toggleBtn = section.querySelector('.toggle-btn');
    
    if (header && toggleBtn) {
      // Make the entire header clickable
      header.addEventListener('click', (e) => {
        // Don't trigger if clicking the toggle button directly
        if (e.target === toggleBtn) return;
        
        section.classList.toggle('collapsed');
        
        // Save state to localStorage
        const sectionId = section.id;
        const isCollapsed = section.classList.contains('collapsed');
        localStorage.setItem(`${sectionId}-collapsed`, isCollapsed);
      });
      
      // Set initial state from localStorage
      const sectionId = section.id;
      const isCollapsed = localStorage.getItem(`${sectionId}-collapsed`) === 'true';
      if (isCollapsed) {
        section.classList.add('collapsed');
      }
    }
  }
}

// Removed refresh button function

// Update connection status indicators
function setConnectionStatus(service, status) {
  const statusElement = document.getElementById(`${service}-status`);
  if (statusElement) {
    // Remove all status classes
    statusElement.classList.remove('status-connected', 'status-error', 'status-loading');
    
    // Add appropriate class
    statusElement.classList.add(`status-${status}`);
    
    // Update tooltip
    switch(status) {
      case 'connected':
        statusElement.title = 'Connected';
        break;
      case 'error':
        statusElement.title = 'Connection error';
        break;
      case 'loading':
        statusElement.title = 'Loading...';
        break;
    }
  }
}

// Setup cache timer display
function setupCacheTimer() {
  const cacheTimer = document.getElementById('cache-timer');
  if (cacheTimer) {
    // Update initially
    updateCacheTimer();
    
    // Update every minute
    setInterval(updateCacheTimer, 60000);
    
    // Add click handler to refresh
    cacheTimer.addEventListener('click', () => {
      // Set loading status indicators
      const githubStatus = document.getElementById('github-status');
      const jiraStatus = document.getElementById('jira-status');
      if (githubStatus) {
        githubStatus.classList.remove('status-connected', 'status-error');
        githubStatus.className = 'status-icon';
        githubStatus.style.color = 'var(--warning-color)';
      }
      if (jiraStatus) {
        jiraStatus.classList.remove('status-connected', 'status-error');
        jiraStatus.className = 'status-icon';
        jiraStatus.style.color = 'var(--warning-color)';
      }
      
      // Clear cache and trigger refresh
      if (window.clearAllCache) window.clearAllCache();
      
      // Refresh data
      if (window.fetchGitHubPRs) {
        window.fetchGitHubPRs()
          .then(() => {
            if (githubStatus) {
              githubStatus.style.color = '';
              githubStatus.classList.remove('status-error');
              githubStatus.classList.add('status-connected');
            }
          })
          .catch(() => {
            if (githubStatus) {
              githubStatus.style.color = '';
              githubStatus.classList.remove('status-connected');
              githubStatus.classList.add('status-error');
            }
          });
      }
      
      if (window.fetchJiraTickets) {
        window.fetchJiraTickets()
          .then(() => {
            if (jiraStatus) {
              jiraStatus.style.color = '';
              jiraStatus.classList.remove('status-error');
              jiraStatus.classList.add('status-connected');
            }
          })
          .catch(() => {
            if (jiraStatus) {
              jiraStatus.style.color = '';
              jiraStatus.classList.remove('status-connected');
              jiraStatus.classList.add('status-error');
            }
          });
      }
    });
  }
}

// Update cache timer display
function updateCacheTimer() {
  const cacheTimer = document.getElementById('cache-timer');
  if (cacheTimer) {
    // For now, just display a static message
    // In a real implementation, we would calculate time left in cache
    const minutesLeft = 5; // Placeholder
    cacheTimer.textContent = `ttl ${minutesLeft}m`;
    cacheTimer.style.fontStyle = 'italic';
  }
}

// Clear all cache (placeholder function)
function clearAllCache() {
  // In a real implementation, we would clear the cache here
  // This would interact with the caching system
}

// Main initialization function
async function init() {
  try {
    updateUserInfoDisplay();
    setupClearCredentials();
    setupConfigListeners();
    
    // Initialize theme
    if (window.initTheme) window.initTheme();

    // Initialize links
    if (window.initLinks) window.initLinks();
    
    // Initialize GitHub section if credentials exist
    if (localStorage.getItem('githubUsername') && localStorage.getItem('githubToken')) {
      if (window.initGitHub) window.initGitHub();
    } else {
      document.getElementById('github-content').innerHTML = `
        <div class="setup-message">
          <p>GitHub integration not configured</p>
          <a href="#" class="setup-link" id="github-setup-link">Configure GitHub</a>
        </div>
      `;
      
      document.getElementById('github-setup-link').addEventListener('click', (e) => {
        e.preventDefault();
        showConfigModal('github');
      });
    }
    
    // Initialize Jira section if credentials exist
    if (localStorage.getItem('jiraEmail') && localStorage.getItem('jiraToken') && localStorage.getItem('jiraDomain')) {
      if (window.initJira) window.initJira();
    } else {
      document.getElementById('jira-content').innerHTML = `
        <div class="setup-message">
          <p>Jira integration not configured</p>
          <a href="#" class="setup-link" id="jira-setup-link">Configure Jira</a>
        </div>
      `;
      
      document.getElementById('jira-setup-link').addEventListener('click', (e) => {
        e.preventDefault();
        showConfigModal('jira');
      });
    }
    
    // Initialize cache timer
    if (window.initializeCache) window.initializeCache();
    
    // Set initial connection statuses 
    const githubStatus = document.getElementById('github-status');
    const jiraStatus = document.getElementById('jira-status');
    
    if (githubStatus) githubStatus.classList.add('status-loading');
    if (jiraStatus) jiraStatus.classList.add('status-loading');
    
    // Update last updated time
    window.updateLastUpdated();
    
    // Initialize cache timer display
    updateCacheTimer();
    
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
}

// Execute initialization when DOM is ready
document.addEventListener('DOMContentLoaded', init);

export {
  init,
  setupConfigListeners
};