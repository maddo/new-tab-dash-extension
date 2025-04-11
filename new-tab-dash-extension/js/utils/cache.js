// Cache configuration
const CACHE_CONFIG = {
  github: {
    prefix: 'github_cache_',
    duration: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
  jira: {
    prefix: 'jira_cache_',
    duration: 5 * 60 * 1000, // 5 minutes in milliseconds
  },
};

// Generate a cache key for a given endpoint and service
export const getCacheKey = (endpoint, service = 'github') => {
  return `${CACHE_CONFIG[service].prefix}${endpoint}`;
};

// Update cache timer display
export const updateCacheTimer = () => {
  const allCacheKeys = Object.keys(localStorage).filter(key => 
    key.startsWith(CACHE_CONFIG.github.prefix) || 
    key.startsWith(CACHE_CONFIG.jira.prefix)
  );
  
  if (allCacheKeys.length === 0) {
    updateTimerDisplay('No cache');
    return null;
  }

  let maxTimeLeft = 0;
  let hasValidCache = false;
  
  for (const key of allCacheKeys) {
    try {
      const { timestamp, service } = JSON.parse(localStorage.getItem(key));
      const timeLeft = CACHE_CONFIG[service].duration - (Date.now() - timestamp);
      if (timeLeft > 0) {
        hasValidCache = true;
        maxTimeLeft = Math.max(maxTimeLeft, timeLeft);
      }
    } catch (e) {
      console.error('Cache parse error:', e);
    }
  }

  if (!hasValidCache || maxTimeLeft <= 0) {
    updateTimerDisplay('');
    return null;
  }

  const minutes = Math.floor(maxTimeLeft / 60000);
  const seconds = Math.floor((maxTimeLeft % 60000) / 1000);
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
  updateTimerDisplay(timeString);
  return timeString;
};

// Update the timer display in the UI
function updateTimerDisplay(text) {
  const timerElement = document.getElementById('cache-timer');
  if (timerElement) {
    if (text === 'No cache') {
      timerElement.textContent = `ttl ${text}`;
      timerElement.style.fontStyle = 'italic';
    } else if (text === '') {
      timerElement.textContent = '';
      timerElement.style.fontStyle = 'normal';
    } else {
      timerElement.textContent = `ttl ${text}`;
      timerElement.style.fontStyle = 'italic';
    }
  }
}

// Initialize cache timer with countdown
export const initializeCacheTimer = () => {
  // Run immediately and then every second
  updateCacheTimer();
  setInterval(updateCacheTimer, 1000);
  
  // Set up click handler for refresh
  const timerElement = document.getElementById('cache-timer');
  if (timerElement) {
    timerElement.addEventListener('click', () => {
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
      clearAllCache();
      
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
    
    // Update tooltip
    timerElement.title = 'Click to refresh data';
  }
};

// Check if cached data is still valid
export const isCacheValid = (cacheKey, service = 'github') => {
  const cachedData = localStorage.getItem(cacheKey);
  if (!cachedData) return false;

  const { timestamp, data } = JSON.parse(cachedData);
  const now = Date.now();
  const cacheDuration = CACHE_CONFIG[service].duration;

  return now - timestamp < cacheDuration;
};

// Get cached data if valid
export const getCachedData = (cacheKey, service = 'github') => {
  if (!isCacheValid(cacheKey, service)) {
    localStorage.removeItem(cacheKey);
    updateCacheTimer();
    return null;
  }

  const cachedData = localStorage.getItem(cacheKey);
  updateCacheTimer();
  return JSON.parse(cachedData).data;
};

// Store data in cache
export const setCachedData = (cacheKey, data, service = 'github') => {
  const cacheData = {
    timestamp: Date.now(),
    data,
    service
  };
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    updateCacheTimer();
  } catch (e) {
    console.error('Cache storage error:', e);
    updateCacheTimer();
  }
};

// Clear all cached data for a service
export const clearServiceCache = (service = 'github') => {
  const prefix = CACHE_CONFIG[service].prefix;
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(prefix)) {
      localStorage.removeItem(key);
    }
  }
  updateCacheTimer();
};

// Clear all cached data
export const clearAllCache = () => {
  clearServiceCache('github');
  clearServiceCache('jira');
  updateCacheTimer();
};

// Get cache status for display
export const getCacheStatus = () => {
  const now = Date.now();
  const status = {
    github: {
      lastUpdated: null,
      isValid: false,
    },
    jira: {
      lastUpdated: null,
      isValid: false,
    },
  };

  // Check GitHub cache
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(CACHE_CONFIG.github.prefix)) {
      const cachedData = JSON.parse(localStorage.getItem(key));
      if (cachedData) {
        status.github.lastUpdated = Math.max(
          status.github.lastUpdated || 0,
          cachedData.timestamp
        );
        status.github.isValid =
          now - cachedData.timestamp < CACHE_CONFIG.github.duration;
      }
    }
  }

  // Check Jira cache
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith(CACHE_CONFIG.jira.prefix)) {
      const cachedData = JSON.parse(localStorage.getItem(key));
      if (cachedData) {
        status.jira.lastUpdated = Math.max(
          status.jira.lastUpdated || 0,
          cachedData.timestamp
        );
        status.jira.isValid =
          now - cachedData.timestamp < CACHE_CONFIG.jira.duration;
      }
    }
  }

  return status;
};

// Fetch with cache
export const fetchWithCache = async (url, options = {}, service = 'github') => {
  const cacheKey = getCacheKey(url, service);
  const cachedData = getCachedData(cacheKey, service);
  if (cachedData) {
    return {
      ok: true,
      status: 200,
      json: async () => cachedData
    };
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    setCachedData(cacheKey, data, service);
    return {
      ok: true,
      status: 200,
      json: async () => data
    };
  } catch (error) {
    console.error('Fetch error:', error);
    updateCacheTimer();
    throw error;
  }
}; 