// Centralized configuration with getters to ensure values are always up-to-date
const GITHUB_CONFIG = {
  get token() {
    return localStorage.getItem('githubToken') || '';
  },
  get username() {
    return localStorage.getItem('githubUsername') || '';
  },
  cacheDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
  cachePrefix: 'github_cache_'
};

const JIRA_CONFIG = {
  get domain() {
    const domain = localStorage.getItem('jiraDomain') || '';
    return domain.replace(/^https?:\/\//, '').replace(/\/$/, '');
  },
  get token() {
    return localStorage.getItem('jiraToken') || '';
  },
  get email() {
    return localStorage.getItem('jiraEmail') || '';
  },
  cacheDuration: 5 * 60 * 1000, // 5 minutes in milliseconds
  cachePrefix: 'jira_cache_',
  get isVisible() {
    return localStorage.getItem('jiraVisible') !== 'false';
  }
};

export { GITHUB_CONFIG, JIRA_CONFIG, showConfig };

export async function initConfig() {
    const modal = document.getElementById('config-modal');
    const closeBtn = document.querySelector('.close');
    const configContent = document.getElementById('config-content');

    if (!modal || !closeBtn || !configContent) {
        console.error('Modal elements not found');
        return;
    }

    // Close modal when clicking X
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Close modal when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    });
}

function showConfig(service) {
    const modal = document.getElementById('config-modal');
    const configContent = document.getElementById('config-content');
    
    let html = '';
    if (service === 'github') {
        html = `
            <h3>GitHub Configuration</h3>
            <form id="github-config-form">
                <div>
                    <label for="github-username">Username:</label>
                    <input type="text" id="github-username" value="${localStorage.getItem('githubUsername') || ''}">
                </div>
                <div>
                    <label for="github-token">Token:</label>
                    <input type="password" id="github-token" value="${localStorage.getItem('githubToken') || ''}">
                </div>
                <button type="submit">Save</button>
            </form>
        `;
    } else if (service === 'jira') {
        html = `
            <h3>Jira Configuration</h3>
            <form id="jira-config-form">
                <div>
                    <label for="jira-domain">Domain:</label>
                    <input type="text" id="jira-domain" value="${localStorage.getItem('jiraDomain') || ''}">
                </div>
                <div>
                    <label for="jira-email">Email:</label>
                    <input type="email" id="jira-email" value="${localStorage.getItem('jiraEmail') || ''}">
                </div>
                <div>
                    <label for="jira-token">Token:</label>
                    <input type="password" id="jira-token" value="${localStorage.getItem('jiraToken') || ''}">
                </div>
                <div>
                    <label for="jira-initial-limit">Initial tickets to show:</label>
                    <input type="number" id="jira-initial-limit" value="${localStorage.getItem('jiraInitialLimit') || '6'}" min="1" max="100">
                    <p class="help-text">Number of Jira tickets initially displayed</p>
                </div>
                <button type="submit">Save</button>
            </form>
        `;
    }

    configContent.innerHTML = html;
    modal.style.display = 'block';

    // Add form submission handlers
    const form = document.getElementById(`${service}-config-form`);
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            saveConfig(service);
            modal.style.display = 'none';
        });
    }
}

function saveConfig(service) {
    if (service === 'github') {
        localStorage.setItem('githubUsername', document.getElementById('github-username').value);
        localStorage.setItem('githubToken', document.getElementById('github-token').value);
    } else if (service === 'jira') {
        localStorage.setItem('jiraDomain', document.getElementById('jira-domain').value);
        localStorage.setItem('jiraEmail', document.getElementById('jira-email').value);
        localStorage.setItem('jiraToken', document.getElementById('jira-token').value);
        
        // Save Jira initial limit setting
        const limitInput = document.getElementById('jira-initial-limit');
        if (limitInput) {
            // Ensure the value is a number between 1 and 100
            let limit = parseInt(limitInput.value, 10);
            if (isNaN(limit) || limit < 1) limit = 1;
            if (limit > 100) limit = 100;
            localStorage.setItem('jiraInitialLimit', limit);
        }
    }
    
    // Refresh the data after saving configuration
    if (service === 'github' && window.fetchGitHubPRs) {
        window.fetchGitHubPRs();
    } else if (service === 'jira' && window.fetchJiraTickets) {
        window.fetchJiraTickets();
    }
}