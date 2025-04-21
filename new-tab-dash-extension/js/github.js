import { showSetupMessage, showErrorMessage, extractRepoName } from './utils.js';
import { fetchWithCache } from './utils/cache.js';
import { GITHUB_CONFIG } from './config.js';

// Fetch PRs and related data from GitHub API
async function fetchPRs(username, token) {
  try {
    
    // Create auth headers
    const headers = {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json'
    };
    
    // Fetch all categories in parallel
    const [ownedResponse, assignedResponse, reviewResponse, mentionsResponse] = await Promise.all([
      // Owned PRs
      fetchWithCache(
        `https://api.github.com/search/issues?q=is:pr+author:${username}+is:open&sort=updated&order=desc`,
        { headers },
        'github'
      ),
      // Assigned PRs
      fetchWithCache(
        `https://api.github.com/search/issues?q=is:pr+assignee:${username}+is:open&sort=updated&order=desc`,
        { headers },
        'github'
      ),
      // PRs to review
      fetchWithCache(
        `https://api.github.com/search/issues?q=is:pr+review-requested:${username}+is:open&sort=updated&order=desc`,
        { headers },
        'github'
      ),
      // Mentions in PRs 
      fetchWithCache(
        `https://api.github.com/search/issues?q=is:open+is:pr+mentions:${username}&sort=updated&order=desc`,
        { headers },
        'github'
      )
    ]);

    // Check main responses
    if (!ownedResponse.ok || !assignedResponse.ok || !reviewResponse.ok) {
      const status = !ownedResponse.ok 
        ? ownedResponse.status 
        : !assignedResponse.ok 
          ? assignedResponse.status 
          : reviewResponse.status;
          
      throw new Error(`GitHub API request failed with status: ${status}`);
    }

    // Parse JSON responses
    const ownedData = await ownedResponse.json();
    const assignedData = await assignedResponse.json();
    const reviewData = await reviewResponse.json();
    
    // Parse additional data if available
    let mentionsCount = 0;
    
    if (mentionsResponse.ok) {
      const mentionsData = await mentionsResponse.json();
      mentionsCount = mentionsData.total_count || 0;
    }


    // Return all data categories
    return {
      owned: ownedData.items || [],
      assigned: assignedData.items || [],
      toReview: reviewData.items || [],
      mentionsCount
    };
  } catch (error) {
    console.error('Error fetching GitHub data:', error);
    throw error;
  }
}

// Enhance PR data with additional information
function enhancePRData(prData) {
  const { owned, assigned, toReview } = prData;
  
  // Process data for each PR category
  const processItems = items => items.map(pr => ({
    ...pr,
    displayRepo: extractRepoName(pr.repository_url || pr.html_url),
    daysSinceCreated: Math.floor((Date.now() - new Date(pr.created_at).getTime()) / (1000 * 60 * 60 * 24)),
    daysSinceUpdated: Math.floor((Date.now() - new Date(pr.updated_at).getTime()) / (1000 * 60 * 60 * 24))
  }));
  
  return {
    owned: processItems(owned),
    assigned: processItems(assigned),
    toReview: processItems(toReview)
  };
}

// Display PRs in the UI
function displayPRs(prData) {
  const content = document.getElementById('github-content');
  if (!content) return;

  // Get enhanced data
  const enhancedData = enhancePRData(prData);
  const { owned, assigned, toReview } = enhancedData;
  const mentionsCount = prData.mentionsCount || 0;
  const totalCount = owned.length + assigned.length + toReview.length;

  // Update header with count in parentheses
  const headerElement = document.querySelector('#github-section .section-header h3');
  if (headerElement) {
    headerElement.textContent = `GitHub (${totalCount})`;
  }

  // Handle no PRs
  if (totalCount === 0) {
    content.innerHTML = '<p class="no-items">No open pull requests</p>';
    return;
  }

  // Create GitHub links for each section
  const username = GITHUB_CONFIG.username;
  const githubLinks = {
    owned: `https://github.com/pulls?q=is%3Aopen+is%3Apr+author%3A${username}`,
    assigned: `https://github.com/pulls?q=is%3Aopen+is%3Apr+assignee%3A${username}`,
    toReview: `https://github.com/pulls?q=is%3Aopen+is%3Apr+review-requested%3A${username}`,
    mentions: `https://github.com/pulls?q=is%3Aopen+is%3Apr+mentions%3A${username}`
  };

  let html = '';

  // Add quick counts header
  html += `<div class="github-quicklinks">`;
  
  // Assigned PRs count
  html += `<a href="${githubLinks.assigned}" target="_blank" class="gh-quicklink">
    <span class="gh-quicklink-count">${assigned.length}</span><span class="gh-quicklink-label">Assigned</span>
  </a>`;
  
  // Mentions count
  html += `<a href="${githubLinks.mentions}" target="_blank" class="gh-quicklink">
    <span class="gh-quicklink-count">${mentionsCount}</span><span class="gh-quicklink-label">Mentioned</span>
  </a>`;
  
  // Waiting for Review count
  html += `<a href="${githubLinks.toReview}" target="_blank" class="gh-quicklink">
    <span class="gh-quicklink-count">${toReview.length}</span><span class="gh-quicklink-label">Reviews</span>
  </a>`;
  
  html += '</div>';

  // Owned PRs section (with link)
  if (owned.length > 0) {
    // Filter out PRs that user is also assigned to
    const filteredOwned = owned.filter(ownedPR => 
      !assigned.some(assignedPR => assignedPR.id === ownedPR.id)
    );
    
    if (filteredOwned.length > 0) {
      const allPRsLink = `https://github.com/pulls?q=is%3Aopen+is%3Apr+user%3A${username}+OR+assignee%3A${username}+OR+review-requested%3A${username}`;
      html += `<div class="pr-section"><h3><a href="${allPRsLink}" target="_blank">Your PRs (${filteredOwned.length})</a></h3>`;
      html += filteredOwned.map(pr => {
        const ageClass = pr.daysSinceCreated < 2 ? 'pr-age-new' : pr.daysSinceCreated < 7 ? 'pr-age-recent' : 'pr-age-old';
        
        return `
          <div class="pr-item">
            <div class="pr-title">
              <span class="pr-repo">${pr.displayRepo}</span>
              <a href="${pr.html_url}" target="_blank" class="pr-link">${pr.title}</a>
            </div>
            <span class="pr-age ${ageClass}">${pr.daysSinceCreated}d</span>
          </div>
        `;
      }).join('');
      html += '</div>';
    }
  }

  // Review PRs section - moving this up as it's more important
  if (toReview.length > 0) {
    html += `<div class="pr-section"><h3>Need Review (${toReview.length})</h3>`;
    html += toReview.map(pr => {
      const ageClass = pr.daysSinceCreated < 2 ? 'pr-age-new' : pr.daysSinceCreated < 7 ? 'pr-age-recent' : 'pr-age-old';
      
      return `
        <div class="pr-item">
          <div class="pr-title">
            <span class="pr-repo">${pr.displayRepo}</span>
            <a href="${pr.html_url}" target="_blank" class="pr-link">${pr.title}</a>
          </div>
          <span class="pr-age ${ageClass}">${pr.daysSinceCreated}d</span>
        </div>
      `;
    }).join('');
    html += '</div>';
  }

  // Assigned PRs section
  if (assigned.length > 0) {
    html += `<div class="pr-section"><h3>Assigned to You (${assigned.length})</h3>`;
    html += assigned.map(pr => {
      const ageClass = pr.daysSinceCreated < 2 ? 'pr-age-new' : pr.daysSinceCreated < 7 ? 'pr-age-recent' : 'pr-age-old';
      
      return `
        <div class="pr-item">
          <div class="pr-title">
            <span class="pr-repo">${pr.displayRepo}</span>
            <a href="${pr.html_url}" target="_blank" class="pr-link">${pr.title}</a>
          </div>
          <span class="pr-age ${ageClass}">${pr.daysSinceCreated}d</span>
        </div>
      `;
    }).join('');
    html += '</div>';
  }

  // Update content
  content.innerHTML = html;
  
  // Update last updated display using the shared bridge function
  if (window.updateLastUpdated) {
    window.updateLastUpdated();
  }
}

// Initialize GitHub section
export async function initGitHub() {
  // Set up config button handler
  const configButton = document.getElementById('github-config-btn');
  if (configButton && window.showConfigModal) {
    configButton.addEventListener('click', () => {
      window.showConfigModal('github');
    });
  }

  // Check credentials
  const username = GITHUB_CONFIG.username;
  const token = GITHUB_CONFIG.token;
  
  if (!username || !token) {
    const content = document.getElementById('github-content');
    if (content) {
      showSetupMessage('github-content', 'Please configure your GitHub credentials to see your pull requests');
    } else {
      console.error('GitHub content element not found');
    }
    return;
  }

  try {
    // Loading indicator
    const content = document.getElementById('github-content');
    if (content) {
      content.innerHTML = '<div class="loading">Loading GitHub PRs...</div>';
    }
    
    // Fetch PRs
    const prs = await fetchPRs(username, token);
    displayPRs(prs);
  } catch (error) {
    console.error('Error initializing GitHub:', error);
    showErrorMessage('github', `Error fetching PRs: ${error.message}`);
  }
}

// Export functions for global access
window.fetchGitHubPRs = async () => {
  const username = GITHUB_CONFIG.username;
  const token = GITHUB_CONFIG.token;
  
  if (!username || !token) {
    const content = document.getElementById('github-content');
    if (content) {
      showSetupMessage('github-content', 'Please configure your GitHub credentials to see your pull requests');
    } else {
      console.error('GitHub content element not found');
    }
    return;
  }
  
  try {
    // Loading indicator
    const content = document.getElementById('github-content');
    if (content) {
      content.innerHTML = '<div class="loading">Loading GitHub PRs...</div>';
    }
    
    // Fetch PRs
    const prs = await fetchPRs(username, token);
    displayPRs(prs);
  } catch (error) {
    console.error('Error fetching GitHub PRs:', error);
    showErrorMessage('github', `Error: ${error.message}`);
  }
};