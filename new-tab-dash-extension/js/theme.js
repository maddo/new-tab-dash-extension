// Theme management
export async function initTheme() {
  // Get initial theme from localStorage, default to dark
  const savedTheme = localStorage.getItem('theme') || 'dark';
  
  // If the saved theme is not one of our themes, default to dark
  const validTheme = ['dark', 'light', 'system'].includes(savedTheme) ? savedTheme : 'dark';
  
  // Apply the theme (handle system theme specially)
  applyTheme(validTheme);
  
  // Set up theme selector in status bar
  const themeStatus = document.getElementById('theme-status');
  if (!themeStatus) return;
  
  // Find all theme option buttons
  const themeOptions = document.querySelectorAll('.theme-option');
  
  // Add event listeners to each theme option
  for (const option of themeOptions) {
    const theme = option.dataset.theme;
    
    // Set active state for current theme
    if (theme === validTheme) {
      option.classList.add('active');
    }
    
    // Add click handler
    option.addEventListener('click', () => {
      // Apply the selected theme
      applyTheme(theme);
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
      
      // Update active state on all buttons
      for (const btn of themeOptions) {
        btn.classList.remove('active');
      }
      option.classList.add('active');
    });
  }
  
  // If system theme is active, listen for system theme changes
  if (validTheme === 'system') {
    setupSystemThemeListener();
  }
}

// Function to apply the theme
function applyTheme(theme) {
  if (theme === 'system') {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    document.body.className = prefersDark ? 'theme-dark' : 'theme-light';
    setupSystemThemeListener();
  } else {
    // Apply specific theme
    document.body.className = `theme-${theme}`;
    // Remove system theme listener if not needed
    window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', handleSystemThemeChange);
  }
}

// Set up listener for system theme changes
function setupSystemThemeListener() {
  const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkModeMediaQuery.addEventListener('change', handleSystemThemeChange);
}

// Handle system theme change
function handleSystemThemeChange(e) {
  if (localStorage.getItem('theme') === 'system') {
    document.body.className = e.matches ? 'theme-dark' : 'theme-light';
  }
}