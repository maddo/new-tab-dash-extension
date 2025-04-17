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
  favicon: {
    prefix: 'favicon_cache_',
    duration: 365 * 24 * 60 * 60 * 1000, // 1 year in milliseconds (essentially indefinite)
  }
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

// Clear all cached data (except favicons)
export const clearAllCache = () => {
  clearServiceCache('github');
  clearServiceCache('jira');
  updateCacheTimer();
};

// Clear favicon cache (separate function to maintain favicon persistence)
export const clearFaviconCache = () => {
  clearServiceCache('favicon');
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

// Favicon Caching Functions
// Get a cached favicon URL if it exists
export const getCachedFavicon = (hostname) => {
  const cacheKey = `${CACHE_CONFIG.favicon.prefix}${hostname}`;
  const cachedData = localStorage.getItem(cacheKey);
  
  if (!cachedData) return null;
  
  try {
    const { data } = JSON.parse(cachedData);
    return data;
  } catch (e) {
    console.error('Favicon cache parse error:', e);
    localStorage.removeItem(cacheKey);
    return null;
  }
};

// Cache a successful favicon URL
export const cacheFavicon = (hostname, faviconUrl) => {
  if (!hostname || !faviconUrl) return;
  
  const cacheKey = `${CACHE_CONFIG.favicon.prefix}${hostname}`;
  const cacheData = {
    timestamp: Date.now(),
    data: faviconUrl,
    service: 'favicon'
  };
  
  try {
    localStorage.setItem(cacheKey, JSON.stringify(cacheData));
  } catch (e) {
    console.error('Favicon cache storage error:', e);
    // If storage fails, try clearing old favicon caches
    clearOldFaviconCaches();
    // Try again
    try {
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (e) {
      console.error('Favicon cache storage retry error:', e);
    }
  }
};

// Clear old favicon caches if storage is getting full
function clearOldFaviconCaches() {
  const prefix = CACHE_CONFIG.favicon.prefix;
  const faviconCacheKeys = Object.keys(localStorage).filter(key => key.startsWith(prefix));
  
  // If there are more than 100 favicons cached, remove the oldest 50
  if (faviconCacheKeys.length > 100) {
    const sortedKeys = faviconCacheKeys
      .map(key => {
        try {
          const { timestamp } = JSON.parse(localStorage.getItem(key));
          return { key, timestamp };
        } catch (e) {
          return { key, timestamp: 0 };
        }
      })
      .sort((a, b) => a.timestamp - b.timestamp);
    
    // Remove the oldest 50 keys
    for (const item of sortedKeys.slice(0, 50)) {
      localStorage.removeItem(item.key);
    }
  }
}

// Generate a favicon from the letters of a name and save it to the cache
export const generateLetterFavicon = (hostname, name) => {
  if (!hostname || !name) return null;
  
  // Create a canvas to generate the favicon
  const canvas = document.createElement('canvas');
  const size = 64; // Use a size that works well for favicons
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  // Get up to 2 characters from the name (first letter of first and last word)
  let letters = '';
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    // First letter of first word and first letter of last word
    letters = (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  } else if (words.length === 1) {
    // If only one word, use first letter, or first two letters if word is long enough
    letters = words[0].length > 1 ? 
              (words[0].charAt(0) + words[0].charAt(1)).toUpperCase() : 
              words[0].charAt(0).toUpperCase();
  } else {
    // Fallback
    letters = 'L';
  }
  
  // Limit to 2 characters
  if (letters.length > 2) {
    letters = letters.substring(0, 2);
  }
  
  // Generate a background color based on the name
  const backgroundColor = generateColorFromText(name);
  
  // Draw a circle with the background color
  ctx.fillStyle = backgroundColor;
  ctx.beginPath();
  ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw the text
  ctx.fillStyle = '#FFFFFF'; // White text
  ctx.font = `bold ${size/2}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(letters, size/2, size/2);
  
  // Convert canvas to data URL
  const dataUrl = canvas.toDataURL('image/png');
  
  // Cache the data URL
  cacheFavicon(hostname, dataUrl);
  
  return dataUrl;
};

// Helper function to generate color (reusing from links.js)
function generateColorFromText(text) {
  // Create a simple hash from the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a vibrant HSL color
  const hue = Math.abs(hash % 360);
  const saturation = 65 + (hash % 20);
  const lightness = 40 + (hash % 15); // Keep it in a range good for white text
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
} 