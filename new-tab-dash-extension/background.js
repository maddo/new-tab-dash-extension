// Handle CORS for GitHub and Jira APIs
chrome.declarativeNetRequest.updateDynamicRules({
  removeRuleIds: [1, 2],
  addRules: [
    {
      id: 1,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'Access-Control-Allow-Origin', operation: 'set', value: '*' },
          { header: 'Access-Control-Allow-Methods', operation: 'set', value: 'GET, POST, OPTIONS' },
          { header: 'Access-Control-Allow-Headers', operation: 'set', value: '*' }
        ]
      },
      condition: {
        urlFilter: '*.atlassian.net',
        resourceTypes: ['xmlhttprequest']
      }
    },
    {
      id: 2,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [
          { header: 'Access-Control-Allow-Origin', operation: 'set', value: '*' },
          { header: 'Access-Control-Allow-Methods', operation: 'set', value: 'GET, POST, OPTIONS' },
          { header: 'Access-Control-Allow-Headers', operation: 'set', value: '*' }
        ]
      },
      condition: {
        urlFilter: 'api.github.com',
        resourceTypes: ['xmlhttprequest']
      }
    }
  ]
}); 