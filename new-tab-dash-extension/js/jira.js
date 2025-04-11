import { showSetupMessage } from './utils.js';
import { fetchWithCache } from './utils/cache.js';
import { JIRA_CONFIG } from './config.js';

// Store all Jira issues globally
let allJiraIssues = [];
let currentJiraPage = 1;
const JIRA_LOAD_MORE_COUNT = 10;

// Get initial Jira items per page from localStorage or use default
function getInitialJiraLimit() {
  const savedLimit = localStorage.getItem('jiraInitialLimit');
  return savedLimit ? parseInt(savedLimit, 10) : 6;
}

// Show message in the UI
function showMessage(section, message) {
  const content = document.getElementById(`${section}-content`);
  if (content) {
    content.innerHTML = `<p class="error">${message}</p>`;
  }
}

// Validate Jira domain format
function validateJiraDomain(domain) {
  if (!domain) return false;
  return /^[a-zA-Z0-9][a-zA-Z0-9-]*\.atlassian\.net$/.test(domain);
}

// Fetch tickets from Jira API
async function fetchIssues(domain, email, token) {
  if (!validateJiraDomain(domain)) {
    throw new Error('Invalid Jira domain format. Please use your-domain.atlassian.net');
  }

  try {
    const auth = btoa(`${email}:${token}`);
    const response = await fetchWithCache(
      `https://${domain}/rest/api/2/search?jql=assignee=currentUser() AND status!=Done AND status!=Closed AND status!=Resolved ORDER BY priority DESC, updated DESC`,
      {
        headers: {
          'Authorization': `Basic ${auth}`,
          'Accept': 'application/json'
        }
      },
      'jira'
    );

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Detailed logging of actual priority names
    if (data.issues && data.issues.length > 0) {
      data.issues.forEach(issue => {
      });
    }
    
    return data.issues || [];
  } catch (error) {
    console.error('Error fetching Jira issues:', error);
    throw error;
  }
}

// Format a single Jira issue into HTML
function formatJiraIssue(issue, domain) {
  const created = new Date(issue.fields.created);
  const now = new Date();
  const diffDays = Math.floor((now - created) / (1000 * 60 * 60 * 24));
  
  // Determine age class
  let ageClass = '';
  
  if (diffDays === 0 || diffDays === 1) {
    ageClass = 'age-today';  // Today or yesterday
  } else if (diffDays <= 30) {
    ageClass = 'age-recent'; // Last month (30 days)
  } else if (diffDays <= 356) {
    ageClass = 'age-old';    // Last 3 months (90 days)
  } else {
    ageClass = 'age-very-old'; // Older than 3 months
  }
  
  // Always show age in days
  const ageText = `${diffDays}d`;
  
  const statusClass = issue.fields.status.name.toLowerCase().replace(/\s+/g, '-');
  const priorityName = issue.fields.priority.name;
  
  // Determine priority class using consistent approach
  const name = priorityName ? priorityName.toString().trim() : '';
  let priorityClass = '';
  let shortPriority = name;
  
  // Use the same pattern matching approach for consistency
  if (name.match(/\bP0\b/) || name.match(/\bP-0\b/)) {
    priorityClass = 'priority-p0'; // Highest priority
    shortPriority = 'P0';
  } else if (name.match(/\bP0\.5\b/) || name.match(/\bP-0\.5\b/)) {
    priorityClass = 'priority-p0-5'; // P0.5 priority
    shortPriority = 'P0.5';
  } else if (name.match(/\bP1\b/) || name.match(/\bP-1\b/)) {
    priorityClass = 'priority-p1';
    shortPriority = 'P1';
  } else if (name.match(/\bP2\b/) || name.match(/\bP-2\b/)) {
    priorityClass = 'priority-p2';
    shortPriority = 'P2';
  } else if (name.match(/\bP3\b/) || name.match(/\bP-3\b/)) {
    priorityClass = 'priority-p3';
    shortPriority = 'P3';
  } else if (name.match(/\bP4\b/) || name.match(/\bP-4\b/)) {
    priorityClass = 'priority-p4';
    shortPriority = 'P4';
  } else if (name.match(/highest|critical|blocker/i)) {
    priorityClass = 'priority-highest';
    shortPriority = 'Highest';
  } else if (name.match(/high|major/i)) {
    priorityClass = 'priority-high';
    shortPriority = 'High';
  } else if (name.match(/medium|normal/i)) {
    priorityClass = 'priority-medium';
    shortPriority = 'Med';
  } else if (name.match(/low|minor/i)) {
    priorityClass = 'priority-low';
    shortPriority = 'Low';
  } else if (name.match(/lowest|trivial/i)) {
    priorityClass = 'priority-lowest';
    shortPriority = 'Lowest';
  } else {
    priorityClass = 'priority-other';
  }
  
  return `
    <div class="jira-ticket ${priorityClass}">
      <span class="jira-key">${issue.key}</span>
      <span class="jira-priority ${priorityClass}">${shortPriority}</span>
      <div class="jira-title">
        <a href="https://${domain}/browse/${issue.key}" target="_blank">${issue.fields.summary}</a>
      </div>
      <div class="jira-meta">
        <span class="jira-status status-${statusClass}">${issue.fields.status.name}</span>
      </div>
      <span class="jira-age ${ageClass}">${ageText}</span>
    </div>
  `;
}

// Load more Jira tickets
function loadMoreJiraTickets() {
  const content = document.getElementById('jira-content');
  if (!content) return;
  
  const jiraList = content.querySelector('.jira-list');
  if (!jiraList) return;
  
  const domain = localStorage.getItem('jiraDomain') || '';
  const initialLimit = getInitialJiraLimit();
  const start = initialLimit + ((currentJiraPage - 1) * JIRA_LOAD_MORE_COUNT);
  const end = start + JIRA_LOAD_MORE_COUNT;
  
  const newTickets = allJiraIssues.slice(start, end).map(issue => formatJiraIssue(issue, domain)).join('');
  
  // Insert new tickets before the load more button
  const loadMoreBtn = content.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.insertAdjacentHTML('beforebegin', newTickets);
    
    // Update or remove load more button
    const remaining = allJiraIssues.length - end;
    if (remaining <= 0) {
      loadMoreBtn.remove();
    } else {
      loadMoreBtn.textContent = `Load more (${remaining} remaining)`;
    }
  }
  
  currentJiraPage++;
}

// Display tickets in the UI
function displayIssues(issues, domain) {
  const content = document.getElementById('jira-content');
  if (!content) return;

  // Update header with count in parentheses
  const headerElement = document.querySelector('#jira-section .section-header h3');
  if (headerElement) {
    headerElement.textContent = 'Jira (' + issues.length + ')';
    
    // Remove existing tickets count if present
    const existingCount = document.querySelector('.jira-tickets-count');
    if (existingCount) {
      existingCount.remove();
    }
  }

  if (issues.length === 0) {
    content.innerHTML = '<p class="no-items">No active tickets</p>';
    return;
  }

  // Functions to get the priority order of a ticket
  function getPriorityValue(priorityName) {
    // Normalize the priority name to handle various formats
    const name = priorityName ? priorityName.toString().trim() : '';
    
    // Check for P-level priorities with more aggressive pattern matching
    if (name.match(/\bP0\b/) || name.match(/\bP-0\b/)) return 0;  // P0
    if (name.match(/\bP0\.5\b/) || name.match(/\bP-0\.5\b/)) return 1;  // P0.5
    if (name.match(/\bP1\b/) || name.match(/\bP-1\b/)) return 2;  // P1
    if (name.match(/\bP2\b/) || name.match(/\bP-2\b/)) return 3;  // P2
    if (name.match(/\bP3\b/) || name.match(/\bP-3\b/)) return 4;  // P3
    if (name.match(/\bP4\b/) || name.match(/\bP-4\b/)) return 5;  // P4
    
    // Check for numeric priority (just in case)
    const numMatch = name.match(/\b(\d+)\b/);
    if (numMatch) {
      const num = parseInt(numMatch[1], 10);
      if (num >= 0 && num <= 4) return num;
    }
    
    // Fallback to standard priorities
    if (name.match(/highest|critical|blocker/i)) return 0;
    if (name.match(/high|major/i)) return 2;
    if (name.match(/medium|normal/i)) return 3;
    if (name.match(/low|minor/i)) return 4;
    if (name.match(/lowest|trivial/i)) return 5;
    
    // Unknown priority
    return 999;
  }
  
  // Log all the priorities for debugging
  const priorityList = issues.map(issue => issue.fields.priority.name);
  
  // Sort by P-level priority (P0 to P4)
  issues.sort((a, b) => {
    const priorityNameA = a.fields.priority.name;
    const priorityNameB = b.fields.priority.name;
    
    // Get priority values
    const priorityA = getPriorityValue(priorityNameA);
    const priorityB = getPriorityValue(priorityNameB);
    
    // Sort by priority (lowest number = highest priority)
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // If same priority, sort by most recently updated
    const updatedA = new Date(a.fields.updated).getTime();
    const updatedB = new Date(b.fields.updated).getTime();
    return updatedB - updatedA; // Most recent first
  });

  // Store all issues globally and reset current page
  allJiraIssues = [...issues];
  currentJiraPage = 1;
  
  // Get first page of issues to display using the configurable limit
  const initialLimit = getInitialJiraLimit();
  const visibleIssues = issues.slice(0, initialLimit);
  
  // Create ticket count element first
  const jiraUrl = `https://${domain}/issues/?jql=assignee=currentUser() AND status!=Done AND status!=Closed AND status!=Resolved`;
  let html = `<div class="jira-tickets-count"><a href="${jiraUrl}" target="_blank">${issues.length} Tickets</a></div>`;
  
  // Then add the list of tickets
  html += '<div class="jira-list">';
  
  // Add visible issues
  visibleIssues.forEach(issue => {
    html += formatJiraIssue(issue, domain);
  });
  
  html += '</div>';
  
  // Add load more button if there are more issues
  if (issues.length > initialLimit) {
    html += `<button class="load-more-btn">Load more (${issues.length - initialLimit} remaining)</button>`;
  }
  
  content.innerHTML = html;
  
  // Add click handler to load more button
  const loadMoreBtn = content.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    loadMoreBtn.addEventListener('click', loadMoreJiraTickets);
  }
}

// Initialize Jira section
export async function initJira() {
  const domain = localStorage.getItem('jiraDomain');
  const email = localStorage.getItem('jiraEmail');
  const token = localStorage.getItem('jiraToken');

  if (!domain || !email || !token) {
    showMessage('jira', 'Please configure Jira credentials');
    return;
  }

  try {
    const issues = await fetchIssues(domain, email, token);
    displayIssues(issues, domain);
    
    // Add click handler for config button
    const configButton = document.getElementById('jira-config-btn');
    if (configButton && window.showConfigModal) {
      configButton.addEventListener('click', () => {
        window.showConfigModal('jira');
      });
    }
  } catch (error) {
    console.error('Error initializing Jira:', error);
    showMessage('jira', 'Error fetching issues. ' + error.message);
  }
}

// Export functions for global access
window.fetchJiraTickets = async () => {
  const domain = localStorage.getItem('jiraDomain');
  const email = localStorage.getItem('jiraEmail');
  const token = localStorage.getItem('jiraToken');
  if (!domain || !email || !token) return;
  
  try {
    const issues = await fetchIssues(domain, email, token);
    displayIssues(issues, domain);
  } catch (error) {
    console.error('Error fetching Jira tickets:', error);
  }
};