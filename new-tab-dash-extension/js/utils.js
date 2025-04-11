// Shared utility functions

// Show setup message in the UI
export function showSetupMessage(elementId, message) {
  const element = document.getElementById(elementId);
  if (!element) {
    console.error(`Element with ID ${elementId} not found for setup message`);
    return;
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = 'setup-message';
  messageDiv.innerHTML = `
    <p>${message}</p>
    <button class="setup-link" data-section="${elementId.replace('-content', '')}">Configure</button>
  `;

  element.innerHTML = '';
  element.appendChild(messageDiv);

  // Add click handler for configure button
  const configureBtn = messageDiv.querySelector('.setup-link');
  if (configureBtn) {
    configureBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const section = configureBtn.dataset.section;
      if (window.showConfigModal) {
        window.showConfigModal(section);
      } else {
        console.error('showConfigModal function not available');
      }
    });
  }
}

// Display error message in the UI
export function showErrorMessage(section, message) {
  const content = document.getElementById(`${section}-content`);
  if (!content) {
    console.error(`Element with ID ${section}-content not found for error message`);
    return;
  }
  
  content.innerHTML = `<p class="error">${message}</p>`;
}

// Display config modal
export function showConfigModal(section) {
  const modal = document.getElementById('config-modal');
  const configContent = document.getElementById('config-content');
  if (!modal || !configContent) {
    console.error('Modal elements not found');
    return;
  }
  
  // Clear previous content first
  configContent.innerHTML = '';
  
  console.log(`Opening config modal for: ${section}`);
  
  let html = '';
  if (section === 'github') {
    html = `
      <div class="config-section">
        <h3>GitHub Configuration</h3>
        <div class="form-group">
          <label for="github-username">Username:</label>
          <input type="text" id="github-username" value="${localStorage.getItem('githubUsername') || ''}">
        </div>
        <div class="form-group">
          <label for="github-token">Personal Access Token:</label>
          <input type="password" id="github-token" data-value="${localStorage.getItem('githubToken') || ''}" placeholder="Your GitHub personal access token">
          <p class="help-text">Create a token with <code>repo</code> scope at <a href="https://github.com/settings/tokens" target="_blank">GitHub Settings</a></p>
        </div>
        <button class="save-button" data-section="github">Save</button>
      </div>
    `;
  } else if (section === 'jira') {
    const currentDomain = localStorage.getItem('jiraDomain') || '';
    const cleanDomain = currentDomain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    const email = localStorage.getItem('jiraEmail') || '';
    const token = localStorage.getItem('jiraToken') || '';
    const limit = localStorage.getItem('jiraInitialLimit') || '6';
    
    console.log('Initializing Jira form with values:', { 
      domain: cleanDomain,
      email: email ? '(set)' : '(not set)',
      token: token ? '(set)' : '(not set)',
      limit 
    });
    
    // Use data-value attribute for token to avoid potential handling issues with password fields
    html = `
      <div class="config-section">
        <h3>Jira Configuration</h3>
        <div class="form-group">
          <label for="jira-domain">Domain:</label>
          <input type="text" id="jira-domain" value="${cleanDomain}" placeholder="your-domain.atlassian.net">
          <p class="help-text">Enter your Jira domain (e.g., your-domain.atlassian.net)</p>
        </div>
        <div class="form-group">
          <label for="jira-email">Email:</label>
          <input type="email" id="jira-email" value="${email}">
        </div>
        <div class="form-group">
          <label for="jira-token">API Token:</label>
          <input type="password" id="jira-token" data-value="${token}" placeholder="Your Jira API token">
          <p class="help-text">Create a token at <a href="https://id.atlassian.com/manage/api-tokens" target="_blank">Atlassian Account Settings</a></p>
        </div>
        <div class="form-group">
          <label for="jira-initial-limit">Initial tickets to show:</label>
          <input type="number" id="jira-initial-limit" value="${limit}" min="1" max="100">
          <p class="help-text">Number of Jira tickets initially displayed</p>
        </div>
        <button class="save-button" data-section="jira">Save</button>
      </div>
    `;
  }

  // Set the HTML content
  configContent.innerHTML = html;
  modal.style.display = 'block';

  console.log('Modal content set, checking form elements...');
  
  // Specially handle token field which might have issues with password type
  if (section === 'jira') {
    // Set the token field value directly after render
    const tokenField = document.getElementById('jira-token');
    if (tokenField?.dataset?.value) {
      console.log('Setting token field value from data-value attribute');
      tokenField.value = tokenField.dataset.value;
    }
  } else if (section === 'github') {
    // Set the GitHub token field value directly after render
    const tokenField = document.getElementById('github-token');
    if (tokenField?.dataset?.value) {
      console.log('Setting GitHub token field value from data-value attribute');
      tokenField.value = tokenField.dataset.value;
    }
  }
  
  // Verify that the form elements exist immediately after setting innerHTML
  if (section === 'jira') {
    const domainCheck = document.getElementById('jira-domain');
    const emailCheck = document.getElementById('jira-email');
    const tokenCheck = document.getElementById('jira-token');
    
    console.log('Form elements after render:', {
      domainExists: !!domainCheck,
      emailExists: !!emailCheck,
      tokenExists: !!tokenCheck,
      tokenHasValue: !!tokenCheck?.value,
      tokenHasDataValue: !!tokenCheck?.dataset?.value
    });
  } else if (section === 'github') {
    const usernameCheck = document.getElementById('github-username');
    const tokenCheck = document.getElementById('github-token');
    
    console.log('GitHub form elements after render:', {
      usernameExists: !!usernameCheck,
      tokenExists: !!tokenCheck,
      tokenHasValue: !!tokenCheck?.value,
      tokenHasDataValue: !!tokenCheck?.dataset?.value
    });
  }

  // Use a larger timeout to ensure DOM elements are fully rendered
  setTimeout(() => {
    console.log('Timeout callback executing...');
    
    // Add save button handler
    const saveButton = configContent.querySelector('.save-button');
    if (saveButton) {
      console.log('Save button found, attaching event listener');
      
      saveButton.addEventListener('click', () => {
        const sectionToSave = saveButton.dataset.section;
        console.log(`Save button clicked for section: ${sectionToSave}`);
        saveConfig(sectionToSave);
        modal.style.display = 'none';
      });
    } else {
      console.error('Save button not found in modal');
    }
    
    // Add close button handler
    const closeBtn = document.querySelector('.close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
      });
    }
  }, 300); // Increased delay to ensure elements are rendered

  // Close modal when clicking outside
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.style.display = 'none';
    }
  });
}

// Save configuration
function saveConfig(section) {
  try {
    if (section === 'github') {
      console.log('Starting GitHub config save...');
      
      // Force DOM refresh by accessing the elements directly
      const githubForm = document.querySelector('.config-section');
      if (!githubForm) {
        console.error('Could not find GitHub form section');
        alert('Error: Form not found. Please try again.');
        return;
      }
      
      // Access elements directly from the form
      const usernameElement = githubForm.querySelector('#github-username');
      const tokenElement = githubForm.querySelector('#github-token');
      
      console.log('GitHub form elements by direct query:', {
        usernameFound: !!usernameElement,
        tokenFound: !!tokenElement
      });
      
      if (!usernameElement || !tokenElement) {
        console.log('Falling back to document.getElementById...');
        const usernameById = document.getElementById('github-username');
        const tokenById = document.getElementById('github-token');
        
        if (!usernameById) {
          console.error('GitHub username element not found');
          alert('Error: GitHub username field not found. Please try again.');
          return;
        }
        
        if (!tokenById) {
          console.error('GitHub token element not found');
          alert('Error: GitHub token field not found. Please try again.');
          return;
        }
        
        // Use these elements instead
        console.log('Using elements found by getElementById');
        const username = usernameById.value !== undefined ? String(usernameById.value).trim() : '';
        const token = tokenById.value !== undefined ? String(tokenById.value).trim() : '';
        
        saveGitHubConfig(username, token);
      } else {
        // Use the directly queried elements
        const username = usernameElement.value !== undefined ? String(usernameElement.value).trim() : '';
        const token = tokenElement.value !== undefined ? String(tokenElement.value).trim() : '';
        
        saveGitHubConfig(username, token);
      }
    } else if (section === 'jira') {
      // Get form elements safely
      console.log('Starting Jira config save...');
      
      // Force DOM refresh by accessing the elements directly
      const jiraForm = document.querySelector('.config-section');
      if (!jiraForm) {
        console.error('Could not find Jira form section');
        alert('Error: Form not found. Please try again.');
        return;
      }
      
      // Access form elements directly from the form section to avoid caching issues
      const domainElement = jiraForm.querySelector('#jira-domain');
      const emailElement = jiraForm.querySelector('#jira-email');
      const tokenElement = jiraForm.querySelector('#jira-token');
      
      console.log('Form elements by direct query:', {
        domainFound: !!domainElement,
        emailFound: !!emailElement,
        tokenFound: !!tokenElement
      });
      
      // Fall back to document.getElementById if direct query fails
      if (!domainElement || !emailElement || !tokenElement) {
        console.log('Falling back to document.getElementById...');
        const domainById = document.getElementById('jira-domain');
        const emailById = document.getElementById('jira-email');
        const tokenById = document.getElementById('jira-token');
        
        if (!domainById) {
          console.error('Jira domain element not found');
          alert('Error: Jira domain field not found. Please try again.');
          return;
        }
        
        if (!emailById) {
          console.error('Jira email element not found');
          alert('Error: Jira email field not found. Please try again.');
          return;
        }
        
        if (!tokenById) {
          console.error('Jira token element not found');
          alert('Error: Jira token field not found. Please try again.');
          return;
        }
        
        // Use these elements instead
        console.log('Using elements found by getElementById');
        const domain = domainById.value !== undefined ? String(domainById.value).trim() : '';
        const email = emailById.value !== undefined ? String(emailById.value).trim() : '';
        const token = tokenById.value !== undefined ? String(tokenById.value).trim() : '';
        
        saveJiraConfig(domain, email, token);
      } else {
        // Use the directly queried elements
        const domain = domainElement.value !== undefined ? String(domainElement.value).trim() : '';
        const email = emailElement.value !== undefined ? String(emailElement.value).trim() : '';
        const token = tokenElement.value !== undefined ? String(tokenElement.value).trim() : '';
        
        saveJiraConfig(domain, email, token);
      }
    }
  } catch (error) {
    console.error('Error saving configuration:', error);
    alert('An error occurred while saving your configuration. Please try again.');
  }
  
  // Helper function to save GitHub config once values are obtained
  function saveGitHubConfig(username, token) {
    console.log('Saving GitHub config with values:', {
      username: username ? '(provided)' : '(empty)',
      token: token ? '(provided)' : '(empty)'
    });
    
    // If token is empty, check if there's a data-value attribute with a prefilled token
    let finalToken = token;
    if (finalToken === '') {
      const tokenElement = document.getElementById('github-token');
      if (tokenElement?.dataset?.value) {
        console.log('Using token from data-value attribute');
        finalToken = tokenElement.dataset.value;
      }
    }
    
    // Special case: check if saved token exists in localStorage but not in the form
    if (finalToken === '') {
      const savedToken = localStorage.getItem('githubToken');
      if (savedToken) {
        console.log('Using previously saved token from localStorage');
        finalToken = savedToken;
      }
    }
    
    // More robust check for empty values
    if (username === '' || finalToken === '') {
      console.error('One or more GitHub fields are empty', {
        usernameEmpty: username === '',
        tokenEmpty: finalToken === ''
      });
      alert('Please enter both username and token');
      return;
    }
    
    localStorage.setItem('githubUsername', username);
    localStorage.setItem('githubToken', finalToken);
    
    console.log('GitHub configuration saved successfully');
    
    if (window.fetchGitHubPRs) {
      window.fetchGitHubPRs();
    } else {
      console.error('fetchGitHubPRs function not available');
      window.location.reload();
    }
  }
  
  // Helper function to save Jira config once values are obtained
  function saveJiraConfig(domain, email, token) {
    console.log('Saving Jira config with values:', {
      domain: domain ? '(provided)' : '(empty)',
      email: email ? '(provided)' : '(empty)', 
      token: token ? '(provided)' : '(empty)'
    });
    
    // If token is empty, check if there's a data-value attribute with a prefilled token
    let finalToken = token;
    if (finalToken === '') {
      const tokenElement = document.getElementById('jira-token');
      if (tokenElement?.dataset?.value) {
        console.log('Using token from data-value attribute');
        finalToken = tokenElement.dataset.value;
      }
    }
    
    // Special case: check if saved token exists in localStorage but not in the form
    if (finalToken === '') {
      const savedToken = localStorage.getItem('jiraToken');
      if (savedToken) {
        console.log('Using previously saved token from localStorage');
        finalToken = savedToken;
      }
    }
    
    // More robust check for empty values
    if (domain === '' || email === '' || finalToken === '') {
      console.error('One or more Jira fields are empty', {
        domainEmpty: domain === '',
        emailEmpty: email === '',
        tokenEmpty: finalToken === ''
      });
      alert('Please fill in all Jira fields');
      return;
    }
    
    // Clean the domain before saving
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
    
    localStorage.setItem('jiraDomain', cleanDomain);
    localStorage.setItem('jiraEmail', email);
    localStorage.setItem('jiraToken', finalToken);
    
    // Save the initial limit setting
    const limitInput = document.getElementById('jira-initial-limit');
    if (limitInput) {
      // Ensure the value is a number between 1 and 100
      let limit = Number.parseInt(limitInput.value, 10);
      if (Number.isNaN(limit) || limit < 1) limit = 1;
      if (limit > 100) limit = 100;
      localStorage.setItem('jiraInitialLimit', limit);
    }
    
    console.log('Jira configuration saved successfully');
    
    if (window.fetchJiraTickets) {
      window.fetchJiraTickets();
    } else {
      console.error('fetchJiraTickets function not available');
      window.location.reload();
    }
  }
}

// Format date relative to now
export function formatRelativeDate(timestamp) {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return `${Math.floor(diffDays / 30)} months ago`;
}

// Extract repo name from GitHub URL
export function extractRepoName(url) {
  if (!url) return 'Unknown';
  
  // Try to extract from repository_url format
  if (url.includes('api.github.com/repos/')) {
    const parts = url.split('/');
    const repoIndex = parts.indexOf('repos');
    if (repoIndex > 0 && parts.length >= repoIndex + 3) {
      return `${parts[repoIndex + 1]}/${parts[repoIndex + 2]}`;
    }
  }
  
  // Try to extract from html_url format
  if (url.includes('github.com/')) {
    const parts = url.split('github.com/');
    if (parts.length > 1) {
      const repoPath = parts[1].split('/pull/')[0];
      if (repoPath.includes('/')) {
        return repoPath;
      }
    }
  }
  
  return url.split('/').pop() || 'Unknown';
}