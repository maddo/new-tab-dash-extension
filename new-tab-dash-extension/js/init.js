// Initialize extension
document.addEventListener('DOMContentLoaded', () => {
  try {
    // Update stylesheet path
    const styleLink = document.querySelector('link[rel="stylesheet"]');
    if (styleLink) {
      styleLink.href = chrome.runtime.getURL('styles.css');
    } else {
      // Create stylesheet link if it doesn't exist
      const newStyleLink = document.createElement('link');
      newStyleLink.rel = 'stylesheet';
      newStyleLink.href = chrome.runtime.getURL('styles.css');
      document.head.appendChild(newStyleLink);
    }

    // Create and load the main script
    const mainScript = document.createElement('script');
    mainScript.type = 'module';
    mainScript.src = chrome.runtime.getURL('js/main.js');
    document.body.appendChild(mainScript);

  } catch (error) {
    console.error('Error initializing extension:', error);
  }
});