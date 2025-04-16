/**
 * Links module for managing bookmarked links with favicons
 */

// Default links for initial setup
const DEFAULT_LINKS = [
  { title: 'Google', url: 'https://www.google.com' },
  { title: 'GitHub', url: 'https://github.com' }
];

/**
 * Initialize the links section
 */
export function initLinks() {
  // Load links from storage
  const links = getLinks();
  
  // Display links
  renderLinks(links);
  
  // Set up event listeners
  setupLinkListeners();
  
  // Set up toggle button
  setupToggleButton();
}

/**
 * Get links from storage or use defaults if none exist
 */
function getLinks() {
  const storedLinks = localStorage.getItem('dashboardLinks');
  return storedLinks ? JSON.parse(storedLinks) : DEFAULT_LINKS;
}

/**
 * Save links to local storage
 */
function saveLinks(links) {
  localStorage.setItem('dashboardLinks', JSON.stringify(links));
}

/**
 * Set up toggle button for the links section
 */
function setupToggleButton() {
  const toggleBtn = document.getElementById('links-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const linksSection = document.getElementById('links-section');
      if (linksSection) {
        linksSection.classList.toggle('collapsed');
        
        // Save state to localStorage
        const isCollapsed = linksSection.classList.contains('collapsed');
        localStorage.setItem('links-section-collapsed', isCollapsed);
      }
    });
    
    // Set initial state from localStorage
    const linksSection = document.getElementById('links-section');
    if (linksSection) {
      const isCollapsed = localStorage.getItem('links-section-collapsed') === 'true';
      if (isCollapsed) {
        linksSection.classList.add('collapsed');
      }
    }
  }
}

/**
 * Render links in the dashboard
 */
function renderLinks(links) {
  const container = document.getElementById('links-content');
  if (!container) return;
  
  // Clear existing content
  const linksContainer = container.querySelector('.links-container');
  if (!linksContainer) return;
  
  linksContainer.innerHTML = '';
  
  if (links.length === 0) {
    linksContainer.innerHTML = '<div class="no-items">No links added yet. Click the settings icon to add links.</div>';
    return;
  }
  
  // Create the links grid
  const linksGrid = document.createElement('div');
  linksGrid.className = 'links-grid';
  
  // Add each link
  for (const link of links) {
    // Create a wrapper to contain both the link item and the name
    const linkWrapper = document.createElement('div');
    linkWrapper.className = 'link-wrapper';
    
    // Create the actual link element
    const linkItem = document.createElement('a');
    linkItem.href = link.url;
    linkItem.className = 'link-item';
    linkItem.title = link.title;
    linkItem.rel = "noopener noreferrer";
    
    // Create the link name element (outside the link-item)
    const linkName = document.createElement('span');
    linkName.className = 'link-name';
    linkName.textContent = link.title;
    
    try {
      // Extract hostname for favicon
      const url = new URL(link.url);
      const hostname = url.hostname;
      
      // Try multiple favicon approaches
      tryFaviconApproaches(linkItem, hostname, url, link.title);
    } catch (e) {
      // If URL parsing fails, create a text fallback
      console.error('Error creating favicon:', e);
      createTextFallback(linkItem, link.title);
    }
    
    // Add the link item and name to the wrapper
    linkWrapper.appendChild(linkItem);
    linkWrapper.appendChild(linkName);
    
    // Add the wrapper to the grid
    linksGrid.appendChild(linkWrapper);
  }
  
  linksContainer.appendChild(linksGrid);
}

/**
 * Try multiple approaches to load favicon
 */
function tryFaviconApproaches(linkItem, hostname, url, title) {
  // Create favicon element
  const favicon = document.createElement('img');
  
  // Set attributes
  favicon.alt = title;
  favicon.className = 'link-favicon';
  favicon.width = 32;
  favicon.height = 32;
  favicon.loading = "lazy";
  favicon.style.backgroundColor = "transparent";

  // Flag to track if we've created a fallback
  let fallbackCreated = false;
  
  // Setup fallback chain - prioritize direct website sources first
  let currentAttempt = 0;
  const faviconSources = [
    // Standard favicon location
    `${url.protocol}//${hostname}/favicon.ico`,
    // Common favicon location alternatives
    `${url.protocol}//${hostname}/favicon.png`,
    // Apple touch icon (commonly used for higher quality)
    `${url.protocol}//${hostname}/apple-touch-icon.png`,
    `${url.protocol}//${hostname}/apple-touch-icon-precomposed.png`,
    // Root level favicons
    `${url.protocol}//${hostname}/assets/favicon.ico`,
    `${url.protocol}//${hostname}/static/favicon.ico`,
    `${url.protocol}//${hostname}/images/favicon.ico`,
    // Only if direct sources fail, use Google's service
    `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`,
    // Final fallback using Google's dedicated favicon service
    `https://t0.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${hostname}&size=32`
  ];
  
  // Try to find manifest file first - this often has the best icons
  tryGetManifestIcon(url, hostname)
    .then(manifestIconUrl => {
      if (manifestIconUrl) {
        console.log(`Found manifest icon for ${hostname}: ${manifestIconUrl}`);
        // Insert at the beginning of the sources array
        faviconSources.unshift(manifestIconUrl);
      }
      // Start trying sources after manifest check completes
      startTryingSources();
    })
    .catch(() => {
      // If manifest check fails, just continue with other sources
      startTryingSources();
    });
  
  // Function to start trying sources
  function startTryingSources() {
    // Add to DOM first
    linkItem.appendChild(favicon);
    
    // Start the first attempt
    tryNextSource();
    
    // Add a backup timeout in case none of the approaches work within a reasonable time
    setTimeout(() => {
      if ((favicon.naturalWidth === 0 || !favicon.complete) && !fallbackCreated) {
        console.log(`Favicon timeout for ${hostname}, using text fallback`);
        createFallback();
      }
    }, 3000); // 3 second timeout
  }
  
  // Helper function to create fallback and prevent duplicate fallbacks
  function createFallback() {
    if (fallbackCreated) return;
    fallbackCreated = true;
    
    if (favicon.parentNode) {
      favicon.parentNode.removeChild(favicon);
    }
    createTextFallback(linkItem, title);
  }
  
  // Function to try next favicon source
  const tryNextSource = () => {
    if (currentAttempt < faviconSources.length) {
      console.log(`Trying favicon source ${currentAttempt + 1}/${faviconSources.length} for ${hostname}: ${faviconSources[currentAttempt]}`);
      favicon.src = faviconSources[currentAttempt];
      currentAttempt++;
    } else {
      console.log(`All favicon sources failed for ${hostname}, using text fallback`);
      // All sources failed, remove the image and create text fallback
      createFallback();
    }
  };
  
  // Set up error handler for favicon
  favicon.onerror = () => {
    if (!fallbackCreated) {
      tryNextSource();
    }
  };
  
  // Set up load handler
  favicon.onload = () => {
    // Verify the image actually loaded with content
    if (favicon.naturalWidth <= 1 || favicon.naturalHeight <= 1) {
      console.log(`Favicon loaded but appears empty for ${hostname}, trying next source`);
      tryNextSource();
      return;
    }
    
    console.log(`Favicon loaded successfully for ${hostname} (attempt ${currentAttempt}) with size ${favicon.naturalWidth}x${favicon.naturalHeight}`);
    // Reset the error handler to prevent further attempts if image disappears later
    favicon.onerror = null;
  };
}

/**
 * Try to get icon from website's manifest file
 */
async function tryGetManifestIcon(url, hostname) {
  // Skipping manifest fetching due to CORS restrictions
  // Sites like notion.so and devchess.com block cross-origin requests
  // and opaque responses from no-cors mode can't be read with .json()
  console.log(`Skipping manifest fetch for ${hostname} to avoid CORS errors`);
  return null;
}

/**
 * Extract the best icon from a web manifest
 */
function getBestIconFromManifest(manifest, url, hostname) {
  if (!manifest || !manifest.icons || !Array.isArray(manifest.icons) || manifest.icons.length === 0) {
    return null;
  }
  
  // Sort icons by size, preferring larger ones (they scale down better)
  const icons = [...manifest.icons].sort((a, b) => {
    const sizeA = Number.parseInt(a.sizes?.split('x')[0]) || 0;
    const sizeB = Number.parseInt(b.sizes?.split('x')[0]) || 0;
    return sizeB - sizeA;
  });
  
  // Find an icon with a good size (not too large, not too small)
  const idealIcon = icons.find(icon => {
    const size = Number.parseInt(icon.sizes?.split('x')[0]) || 0;
    return size >= 32 && size <= 192;
  }) || icons[0]; // Use the first (largest) if no ideal size
  
  if (!idealIcon || !idealIcon.src) {
    return null;
  }
  
  // Handle relative or absolute URLs
  if (idealIcon.src.startsWith('http')) {
    return idealIcon.src;
  }
  
  if (idealIcon.src.startsWith('/')) {
    return `${url.protocol}//${hostname}${idealIcon.src}`;
  }
  
  return `${url.protocol}//${hostname}/${idealIcon.src}`;
}

/**
 * Create text fallback for when favicon can't be loaded
 */
function createTextFallback(linkItem, title) {
  // Clear any existing content in the link item
  linkItem.innerHTML = '';
  
  const fallback = document.createElement('div');
  fallback.className = 'link-text-fallback';
  
  // Use first character of the title or 'L' if empty
  const firstChar = title && title.length > 0 ? title.charAt(0).toUpperCase() : 'L';
  fallback.textContent = firstChar;
  
  // Generate a consistent color based on the title
  // This ensures the same site always gets the same color
  const backgroundColor = generateColorFromText(title || 'Link');
  fallback.style.backgroundColor = backgroundColor;
  
  // Append to link item
  linkItem.appendChild(fallback);
}

/**
 * Generate a consistent color from text
 * @param {string} text - The text to generate a color from
 * @returns {string} - A CSS color string
 */
function generateColorFromText(text) {
  // Create a simple hash from the text
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    hash = text.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to a vibrant HSL color
  // Use hue rotation for distinct colors
  const hue = Math.abs(hash % 360);
  
  // Use higher saturation and lightness for more vibrant colors
  // but ensure lightness isn't too light for white text
  const saturation = 65 + (hash % 20);
  const lightness = 40 + (hash % 15); // Keep it in a range good for white text
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

/**
 * Set up event listeners for links configuration
 */
function setupLinkListeners() {
  // Use the configuration button in the links section header
  const configBtn = document.getElementById('links-config-btn');
  
  if (configBtn) {
    configBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Prevent section collapse
      showLinksConfigModal();
    });
  }
}

/**
 * Show the links configuration modal
 */
function showLinksConfigModal() {
  const modal = document.getElementById('config-modal');
  const modalContent = document.getElementById('config-content');
  
  if (!modal || !modalContent) return;
  
  // Load current links
  const links = getLinks();
  
  // Create modal content
  modalContent.innerHTML = `
    <h3>Configure Quick Links</h3>
    <div class="links-form">
      <div id="links-list">
        ${links.map((link, index) => `
          <div class="link-form-item" data-index="${index}">
            <input type="text" class="link-title" placeholder="Title" value="${link.title}">
            <input type="url" class="link-url" placeholder="URL" value="${link.url}">
            <button class="remove-link-btn" title="Remove link">×</button>
          </div>
        `).join('')}
      </div>
      <button id="add-link-btn" class="save-button">Add New Link</button>
      <div class="form-actions">
        <button id="save-links-btn" class="save-button">Save Links</button>
      </div>
    </div>
  `;
  
  // Show the modal
  modal.style.display = 'block';
  
  // Set up event listeners for the modal
  setupModalListeners();
}

/**
 * Set up event listeners for the links config modal
 */
function setupModalListeners() {
  // Add new link button
  const addButton = document.getElementById('add-link-btn');
  if (addButton) {
    addButton.addEventListener('click', () => {
      const linksList = document.getElementById('links-list');
      const newIndex = linksList.children.length;
      
      const newItem = document.createElement('div');
      newItem.className = 'link-form-item';
      newItem.dataset.index = newIndex;
      newItem.innerHTML = `
        <input type="text" class="link-title" placeholder="Title" value="">
        <input type="url" class="link-url" placeholder="URL" value="">
        <button class="remove-link-btn" title="Remove link">×</button>
      `;
      
      linksList.appendChild(newItem);
      
      // Add event listener to the new remove button
      const removeBtn = newItem.querySelector('.remove-link-btn');
      if (removeBtn) {
        removeBtn.addEventListener('click', (e) => {
          e.target.closest('.link-form-item').remove();
        });
      }
    });
  }
  
  // Save links button
  const saveButton = document.getElementById('save-links-btn');
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      const linkItems = document.querySelectorAll('.link-form-item');
      const newLinks = [];
      
      for (const item of linkItems) {
        const title = item.querySelector('.link-title').value.trim();
        const url = item.querySelector('.link-url').value.trim();
        
        if (title && url) {
          try {
            // Ensure URL is valid by trying to create a URL object
            new URL(url);
            newLinks.push({ title, url });
          } catch (e) {
            // Invalid URL, skip this link
            console.error('Invalid URL:', url);
          }
        }
      }
      
      // Save the new links
      saveLinks(newLinks);
      
      // Render the updated links
      renderLinks(newLinks);
      
      // Close the modal
      const modal = document.getElementById('config-modal');
      if (modal) {
        modal.style.display = 'none';
      }
    });
  }
  
  // Remove link buttons
  const removeButtons = document.querySelectorAll('.remove-link-btn');
  for (const btn of removeButtons) {
    btn.addEventListener('click', (e) => {
      e.target.closest('.link-form-item').remove();
    });
  }
} 