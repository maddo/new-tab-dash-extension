import { initGitHub } from './github.js';
import { initJira } from './jira.js';
import { initTheme } from './theme.js';
import { initConfig } from './config.js';
import * as cacheUtils from './utils/cache.js';
import { showConfigModal } from './utils.js';

// Initialize cache function
const initCache = async () => {
  if (typeof cacheUtils.initializeCacheTimer === 'function') {
    cacheUtils.initializeCacheTimer();
  }
  return true;
};

// Initialize all components
document.addEventListener('DOMContentLoaded', async () => {
  try {
    
    // Initialize core components
    await initCache();
    await initTheme();
    
    // Set up global access to configuration function
    window.showConfigModal = showConfigModal;
    
    // Initialize API-dependent components
    await initGitHub();
    await initJira();
    await initConfig();
    
    // Update last updated time
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
      lastUpdated.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
    }
    
  } catch (error) {
    console.error('Error initializing dashboard:', error);
  }
});