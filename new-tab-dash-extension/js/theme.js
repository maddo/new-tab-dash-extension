// Theme management
export async function initTheme() {
  // Get initial theme from localStorage
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.body.className = `theme-${savedTheme}`;
  
  // Set up theme selector in status bar
  const themeStatus = document.getElementById('theme-status');
  if (!themeStatus) return;
  
  // Find all theme option buttons
  const themeOptions = document.querySelectorAll('.theme-option');
  
  // Add event listeners to each theme option
  for (const option of themeOptions) {
    const theme = option.dataset.theme;
    
    // Set active state for current theme
    if (theme === savedTheme) {
      option.classList.add('active');
    }
    
    // Add click handler
    option.addEventListener('click', () => {
      // Update body class
      document.body.className = `theme-${theme}`;
      
      // Save to localStorage
      localStorage.setItem('theme', theme);
      
      // Update active state on all buttons
      for (const btn of themeOptions) {
        btn.classList.remove('active');
      }
      option.classList.add('active');
    });
  }
}