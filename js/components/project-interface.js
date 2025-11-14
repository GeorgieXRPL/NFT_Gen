// Project Interface Module
window.NFTApp.registerModule("projectInterface", {
  // Start the project interface
  start: (projectData) => {
    console.log("Starting project interface for:", projectData.name)

    const appContainer = document.getElementById("app")

    // Create the navigation and content structure
    const appInterface = document.createElement("div")
    appInterface.className = "project-interface"

    appInterface.innerHTML = `
      <div class="nav-container">
        <div class="nav-header">
          <div class="nav-header-content">
            <div class="nav-title">NFT Collection Creator Pro</div>
            <div class="nav-byline">by AstroCrafts</div>
          </div>
        </div>
        <div class="nav-tabs-container">
          <div class="nav-tabs">
            <div class="nav-tab tooltip active" data-tab="general-info">
              <span class="tab-label">Collection Info</span>
              <span class="tooltiptext">Configure your collection<br>basic information</span>
            </div>
            <div class="nav-tab tooltip" data-tab="traits-rules">
              <span class="tab-label">Traits & Rules</span>
              <span class="tooltiptext">Manage Traits and<br>Combination Rules</span>
            </div>
            <div class="nav-tab tooltip" data-tab="generate-nfts">
              <span class="tab-label">Generate NFTs</span>
              <span class="tooltiptext">Create NFT images and<br>manage your collection</span>
            </div>
            <div class="nav-tab tooltip" data-tab="export-nfts">
              <span class="tab-label">Export NFTs / Metadata</span>
              <span class="tooltiptext">Export your collection</span>
            </div>
          </div>
          <div class="nav-actions">
  <button id="new-project" class="btn btn-secondary tooltip">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
    New Project
    <span class="tooltiptext">Start a new project</span>
  </button>
  <button id="load-project-btn" class="btn btn-secondary tooltip">
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>
    Load Project
    <span class="tooltiptext">Load an existing project</span>
  </button>
  <input type="file" id="load-project-input" class="file-input" accept=".json,.json.gz,.gz">
            <button id="save-project" class="btn btn-secondary tooltip" style="border: 2px solid var(--success-color) !important;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
    </svg>
    Save Project
              <span class="tooltiptext">Quick save the current project</span>
  </button>
            <button id="save-project-as" class="btn btn-secondary tooltip" style="border: 2px solid #51cf66 !important;">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#51cf66" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
      <polyline points="17 21 17 13 7 13 7 21"></polyline>
      <polyline points="7 3 7 8 15 8"></polyline>
      <line x1="14" y1="18" x2="20" y2="18"></line>
      <line x1="17" y1="15" x2="17" y2="21"></line>
    </svg>
              Save Project As
              <span class="tooltiptext">Save the current project as a new file</span>
  </button>
</div>
        </div>
      </div>
      
      <div class="content-area">
        <div id="general-info" class="tab-content active">
          <div class="section-header">
            <h2 class="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              Collection Information
            </h2>
            <p class="section-description">Configure your collection's basic information here.</p>
          </div>
          
          <div id="col-info-form-container" class="form-container two-column-form">
            <div class="form-column">
              <div class="form-group">
                <label for="collection-name">Collection Name <span class="required">*</span></label>
                <input type="text" id="collection-name" class="form-control" placeholder="Choose the name for your NFT Collection" value="${projectData.name || ''}">
              </div>
              
              <div class="form-group">
                <label for="collection-description">Collection Description <span class="required">*</span></label>
                <textarea id="collection-description" class="form-control" rows="4" placeholder="Describe your NFT collection...">${projectData.description || ''}</textarea>
              </div>
              
              <div class="form-group">
                <label for="default-nft-description">Default NFT Description <span class="optional">(Optional)</span></label>
                <textarea id="default-nft-description" class="form-control" rows="3" placeholder="Default description for each NFT in your collection...">${projectData.defaultNftDescription || ""}</textarea>
                <div class="form-help">This description will be used for all NFTs unless overridden individually.</div>
              </div>
            </div>
            
            <div class="form-column">
              <div class="form-group">
                <label for="total-supply">Total Supply <span class="required">*</span></label>
                <input type="text" id="total-supply" class="form-control" placeholder="10,000" value="${projectData.size || ""}">
                <div class="form-help">The total number of NFTs to generate in your collection.</div>
              </div>
              
              <div class="form-group">
                <label for="filename-prefix">Image/Metadata Filename Prefix <span class="optional">(Optional)</span></label>
                <input type="text" id="filename-prefix" class="form-control" placeholder="NFT" value="${projectData.filenamePrefix || ""}">
                <div class="form-help">Prefix for your image and metadata filenames (e.g., "NFT" will result in NFT #01.png, NFT #01.png, etc.)</div>
              </div>
            </div>
          </div>
        </div>
        
        <div id="traits-rules" class="tab-content">
          <!-- Traits & Rules content will be loaded by the trait layers module -->
          
          <div class="traits-rules-all-content">
          <div id="traits-section" class="traits-section">
            <div id="trait-layers-subsection-header" class="subsection-header">
              <h3 id="trait-layers-subsection-title" class="subsection-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Trait Layers
              </h3>
              <p id="trait-layers-subsection-description" class="subsection-description">Add and manage trait layers for your NFT collection.</p>
              <button id="jump-to-rules-btn" class="jump-to-rules-btn tooltip" style="display: none;">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
                Jump to Rules
                <span class="tooltiptext">Quickly scroll down to the Combination Rules section</span>
              </button>
            </div>
            
            <div class="trait-layers-actions">
              <div class="trait-layers-actions-left">
                <input type="file" id="folder-input" webkitdirectory directory multiple class="file-input">
                <div class="add-layer-container">
                  <input type="text" id="add-layer-input" class="add-layer-input" placeholder="Enter layer name">
                  <button id="add-layer-btn" class="app-action-btn tooltip">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                      <line x1="12" y1="5" x2="12" y2="19"></line>
                      <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                    Add Trait Layer
                    <span class="tooltiptext">Create a new empty layer</span>
                  </button>
                </div>
                <button id="add-folders-btn" class="add-folders-btn tooltip">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                    <line x1="12" y1="11" x2="12" y2="17"></line>
                    <line x1="9" y1="14" x2="15" y2="14"></line>
                  </svg>
                  Add Folders
                  <span class="tooltiptext">Select folders to add as trait layers</span>
                </button>
              </div>
              <div class="trait-layers-actions-right">
                <button id="delete-all-layers" class="app-action-btn app-action-btn--danger tooltip" style="display: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete All Layers
                  <span class="tooltiptext">Remove all trait layers</span>
                </button>
              </div>
            </div>
            
            <div id="trait-layers-dropzone" class="dropzone">
              <div class="dropzone-content">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="17 8 12 3 7 8"></polyline>
                  <line x1="12" y1="3" x2="12" y2="15"></line>
                </svg>
                <p>Drag & drop folders here to add trait layers</p>
                <div class="dropzone-help">Each folder will be added as a trait layer. The folder name will be used as the layer name, and image files inside the folder will be added as traits.</div>
              </div>
            </div>
            
            <div id="trait-layers-container" class="trait-layers-container">
              <!-- Trait layers will be added here dynamically -->
              <!-- Empty state has been removed -->
            </div>
            
            <div class="stacking-order-info tooltip">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              <p>Trait Layers are stacked from bottom to top. The top layer in the list will appear on top of the NFT.</p>
              <span class="tooltiptext">Drag layers to reorder them</span>
            </div>
            
            <div class="divider"></div>
          </div>
          
          <div id="rules-section" class="rules-section">
            <div class="subsection-header">
              <h3 class="subsection-title">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                Combination Rules
              </h3>
              <p class="subsection-description">Set up rules for trait combinations to ensure certain traits always or never appear together.</p>
            </div>
            
            <div class="combination-rules-buttons-container">
              <button id="add-combination-rule" class="app-action-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Combination Rule
              <span class="tooltiptext">Create a new trait combination rule</span>
            </button>
            
            <button id="check-rule-conflicts" class="app-action-btn tooltip" disabled>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
              Check for Combination Rule Conflicts
              <span class="conflict-badge" id="conflict-badge" style="display: none;">0</span>
              <span class="tooltiptext">Detect conflicts between rules (requires at least 2 rules)</span>
            </button>
            </div>
            
            <!-- Combination Rules Search Filter -->
            <div id="combination-rules-filter-container" class="combination-rules-filter-container" style="display: none;">
              <button id="clear-rules-filter-btn" class="clear-filter-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
                Clear Filter
                <span class="tooltiptext">Clear filter and show all rules</span>
              </button>
              
              <div class="rules-filter-dropdown-wrapper tooltip">
                <select id="rules-filter-dropdown" class="rules-filter-dropdown" title="">
                  <option value="">All Rule Types</option>
                  <option value="never-combine">Never Combine Rules</option>
                  <option value="always-combine">Always Combine Rules</option>
                  <option value="always-above">Always Above Rules</option>
                  <option value="always-below">Always Below Rules</option>
                  <option value="immediately-above">Immediately Above Rules</option>
                  <option value="immediately-below">Immediately Below Rules</option>
                </select>
                <span class="tooltiptext">Filter Rules by type.<br>Only available when you have 5+ rules.</span>
              </div>
              
              <!-- Jump to Layers Button - Right aligned with filter container -->
              <div class="jump-to-layers-container">
                <button id="jump-to-layers-btn" class="jump-to-layers-btn tooltip">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <polyline points="18 15 12 9 6 15"></polyline>
                  </svg>
                  Jump to Layers
                  <span class="tooltiptext">Quickly scroll up to the Trait Layers section</span>
                </button>
              </div>
              
            </div>
          
          <div id="combination-rules-container" class="combination-rules-container">
            <!-- Combination rules will be added here dynamically -->
            <!-- Empty state for combination rules has been removed -->
            
            <!-- Bottom shortcut buttons - Moved inside combination-rules-container -->
            <div class="bottom-shortcut-buttons">
              <button id="jump-to-layers-bottom-btn" class="jump-to-layers-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                Jump to Layers
                <span class="tooltiptext">Quickly scroll up to the Trait Layers section</span>
              </button>
              <button id="jump-to-rules-bottom-btn" class="jump-to-rules-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                Jump to Rules
                <span class="tooltiptext">Quickly scroll up to the Combination Rules section</span>
              </button>
            </div>
          </div>
          </div>
          </div>
        </div>
        </div>
        
        <div id="generate-nfts" class="tab-content">
          <!-- Content will be added by the generate-nfts module -->
        </div>
          </div>
          
      <div class="export-nfts-content-area">
        <div id="export-nfts" class="tab-content">
          <!-- Content will be dynamically generated by export-nfts-module.js -->
        </div>
      </div>
      
      <!-- Confirmation Modal Template -->
      <div id="confirmation-modal" class="modal-overlay" style="display: none;">
        <div class="modal confirmation-modal">
          <button class="modal-close" id="close-confirmation-modal">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="  viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          <div class="modal-body">
            <div class="modal-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12" y2="17"></line>
              </svg>
            </div>
            <div class="modal-message" id="confirmation-message">Are you sure you want to proceed?</div>
            <div class="modal-description" id="confirmation-description">This action cannot be undone.</div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" id="cancel-confirmation">Cancel</button>
            <button class="btn btn-danger" id="confirm-action">Confirm</button>
          </div>
        </div>
      </div>
    `

    // Remove the Export NFTs nav tab and its content section
    // export-nfts tab is now handled by export-nfts-module.js

    appContainer.innerHTML = ""
    appContainer.appendChild(appInterface)

    // Ensure at least one tab is active (default to Collection Info)
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    let hasActiveTab = false;
    navTabs.forEach(tab => { if (tab.classList.contains('active')) hasActiveTab = true; });
    
    // If no tab is active, activate the Collection Info tab
    if (!hasActiveTab) {
      const generalInfoTab = Array.from(navTabs).find(tab => tab.getAttribute('data-tab') === 'general-info');
      const generalInfoContent = document.getElementById('general-info');
      
      if (generalInfoTab && generalInfoContent) {
        navTabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        generalInfoTab.classList.add('active');
        generalInfoContent.classList.add('active');
        console.log('[DEBUG] Activated Collection Info tab by default');
      }
    }
    
    // Force the Generate NFTs tab to be visible and active, then render controls
    if (window.renderInitialGenerateNftsControls) {
      let prevActiveTab = null;
      navTabs.forEach(tab => { if (tab.classList.contains('active')) prevActiveTab = tab; });
      
      // Activate the Generate NFTs tab
      const genTab = Array.from(navTabs).find(tab => tab.getAttribute('data-tab') === 'generate-nfts');
      if (genTab) {
        navTabs.forEach(tab => tab.classList.remove('active'));
        genTab.classList.add('active');
        // Also make the tab content visible
        tabContents.forEach(tc => tc.classList.remove('active'));
        const genTabContent = document.getElementById('generate-nfts');
        if (genTabContent) {
          genTabContent.style.display = 'block';
          genTabContent.classList.add('active');
          // Debug: log the presence of the three control rows
          setTimeout(() => {
            const row1 = genTabContent.querySelector('.nft-rarity-seed-row');
            const row2 = genTabContent.querySelector('.nft-seedlist-random-row');
            const row3 = genTabContent.querySelector('.nft-seedinput-row');
            console.log('Control rows present:', !!row1, !!row2, !!row3);
          }, 100);
        }
      }
      window.renderInitialGenerateNftsControls();
      // Restore the previous tab after controls are rendered
      if (prevActiveTab) {
        navTabs.forEach(tab => tab.classList.remove('active'));
        prevActiveTab.classList.add('active');
        // Restore tab content visibility
        tabContents.forEach(tc => tc.classList.remove('active'));
        const prevTabContent = document.getElementById(prevActiveTab.getAttribute('data-tab'));
        if (prevTabContent) prevTabContent.classList.add('active');
      }
    }

    // Show the navigation and content area
    document.querySelector(".nav-container").style.display = "block"
    document.querySelector(".content-area").style.display = "block"
    // Hide export-nfts-content-area by default (it will be shown when export-nfts tab is active)
    const exportNftsContentArea = document.querySelector(".export-nfts-content-area");
    if (exportNftsContentArea) {
      exportNftsContentArea.style.setProperty('display', 'none', 'important');
    }

    // Set up navigation
    if (window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
      window.NFTApp.getModule("navigation").setupTabNavigation()
    } else {
      console.warn("Navigation module not found, tab navigation may not work properly")
    }

    // Set up confirmation modal
    if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
      window.NFTApp.getModule("confirmationModal").setup()
    } else {
      console.warn("Confirmation modal module not found, confirmations may not work properly")
    }

    // Store the project data in a global variable
    window.currentProject = projectData

    // Count and display seeds when loading a project
    // CRITICAL: Ensure saved seeds are loaded before updating counters
    const ensureSavedSeedsLoaded = () => {
      // Ensure savedSeedsModal instance exists and loads seedList
      let savedSeedsModal = window.savedSeedsModalInstance;
      
      if (!savedSeedsModal && window.SavedSeedsModal) {
        savedSeedsModal = new window.SavedSeedsModal();
        window.savedSeedsModalInstance = savedSeedsModal;
        console.log('[DEBUG] Created SavedSeedsModal instance on project interface start');
      }
      
      if (savedSeedsModal) {
        // CRITICAL: Update seedListKey first using current project data
        if (typeof savedSeedsModal.getSeedListKey === 'function') {
          const correctKey = savedSeedsModal.getSeedListKey();
          savedSeedsModal.seedListKey = correctKey;
          console.log('[DEBUG] Updated modal seedListKey to:', correctKey, 'for project:', projectData.name || 'unknown');
        }
        
        // Check if project data has savedSeeds that we should use
        if (projectData && projectData.savedSeeds && Array.isArray(projectData.savedSeeds) && projectData.savedSeeds.length > 0) {
          console.log('[DEBUG] Project data has', projectData.savedSeeds.length, 'saved seeds - using them directly');
          
          // Normalize and set seeds from project data
          const normalizedSeeds = projectData.savedSeeds.map(seed => {
            if (typeof seed === 'string' || typeof seed === 'number') {
              return { seed: String(seed) };
            } else if (seed && seed.seed) {
              return { seed: String(seed.seed) };
            }
            return null;
          }).filter(seed => seed && seed.seed);
          
          savedSeedsModal.seedList = normalizedSeeds;
          console.log('[DEBUG] ✅ Loaded', normalizedSeeds.length, 'seeds from project data');
          
          // Also save to localStorage
          try {
            localStorage.setItem(savedSeedsModal.seedListKey, JSON.stringify(normalizedSeeds));
            console.log('[DEBUG] ✅ Saved seeds to localStorage with key:', savedSeedsModal.seedListKey);
          } catch (error) {
            console.warn('[DEBUG] Could not save seeds to localStorage:', error);
          }
          
          // Update counters immediately
          if (window.updateAllCounters && typeof window.updateAllCounters === 'function') {
            window.updateAllCounters();
          }
        } else {
          // Check localStorage first, then fallback to loadSeedList
          const seedListKey = savedSeedsModal.seedListKey || ('nftSeedList_' + (projectData && projectData.name ? encodeURIComponent(projectData.name) : 'default'));
          const localStorageSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
          
          if (Array.isArray(localStorageSeeds) && localStorageSeeds.length > 0) {
            console.log('[DEBUG] Found', localStorageSeeds.length, 'seeds in localStorage for key:', seedListKey);
            savedSeedsModal.seedListKey = seedListKey;
            
            // Normalize seeds
            const normalizedSeeds = localStorageSeeds.map(seed => {
              if (typeof seed === 'string' || typeof seed === 'number') {
                return { seed: String(seed) };
              } else if (seed && seed.seed) {
                return { seed: String(seed.seed) };
              }
              return null;
            }).filter(seed => seed && seed.seed);
            
            savedSeedsModal.seedList = normalizedSeeds;
            console.log('[DEBUG] ✅ Loaded', normalizedSeeds.length, 'seeds from localStorage');
            
            // Update project data with loaded seeds
            if (projectData) {
              projectData.savedSeeds = normalizedSeeds;
            }
            
            // Update counters immediately
            if (window.updateAllCounters && typeof window.updateAllCounters === 'function') {
              window.updateAllCounters();
            }
          } else if (typeof savedSeedsModal.loadSeedList === 'function') {
            // Force load seedList from localStorage if project data doesn't have seeds
            console.log('[DEBUG] No seeds in project data or localStorage, calling loadSeedList...');
            savedSeedsModal.seedList = [];
            savedSeedsModal.loadSeedList(true);
            console.log('[DEBUG] ✅ Loaded saved seeds from loadSeedList:', savedSeedsModal.seedList?.length || 0, 'seeds');
          }
        }
      }
    };
    
    // Update counters immediately and multiple times to ensure accuracy
    const updateCountersOnLoad = () => {
      // CRITICAL: Check if "Please Wait" popup is showing - don't update counters until it's hidden
      const generateNftsTab = document.getElementById('generate-nfts');
      let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
      if (!popup) {
        popup = document.querySelector('.nft-rendering-popup');
      }
      // Also check for "Please Wait" popup
      const pleaseWaitPopup = document.getElementById('nft-edit-please-wait-popup');
      if (popup || pleaseWaitPopup) {
        console.log('[DEBUG] updateCountersOnLoad: Popup is still showing, skipping counter updates');
        return; // Don't update counters while popup is visible
      }
      
      // Ensure generateNftsUI module has projectData
      if (window.NFTApp.getModule('generateNftsUI')) {
        window.NFTApp.getModule('generateNftsUI').projectData = projectData;
        
        // Keep Generate NFTs tab enabled - content inside will be greyed out until NFT renders
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
          window.NFTApp.getModule('navigation').enableGenerateNftsTab();
        }
        
        // CRITICAL: Ensure buttons start greyed out before popup appears
        // Check if popup is showing - if not, grey out buttons immediately
        const generateNftsTabCheck = document.getElementById('generate-nfts');
        let popupCheck = generateNftsTabCheck ? generateNftsTabCheck.querySelector('.nft-rendering-popup') : null;
        if (!popupCheck) {
          popupCheck = document.querySelector('.nft-rendering-popup');
        }
        const pleaseWaitPopupCheck = document.getElementById('nft-edit-please-wait-popup');
        const isPopupShowingCheck = popupCheck || pleaseWaitPopupCheck;
        
        if (!isPopupShowingCheck) {
          // Popup not showing yet - ensure buttons are greyed out
          const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUI && generateNftsUI._ensureButtonsGreyedOut) {
            generateNftsUI._ensureButtonsGreyedOut();
          }
        }
        
        // Update button states after setting project data (will check for popup internally)
        setTimeout(() => {
          const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
            generateNftsUI._updateAllButtonStates();
          }
        }, 300);
      }
      
      // Use unified counter system if available
      if (window.updateAllCounters) {
        window.updateAllCounters();
        // console.log('[DEBUG] updateAllCounters called on project interface start');
      } else {
        // Fallback to individual updates
        if (window.updateNftCountPanel) {
          window.updateNftCountPanel();
          console.log('[DEBUG] updateNftCountPanel called on project interface start');
        }
        if (window.NFTApp.getModule('generateNftsUI')?.refreshSeedListCounter) {
          window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true);
          console.log('[DEBUG] refreshSeedListCounter called on project interface start');
        }
      }
    };
    
    // CRITICAL: Load saved seeds BEFORE updating counters
    ensureSavedSeedsLoaded();
    
    // Call immediately (after seedList is loaded)
    updateCountersOnLoad();
    
    // Also call after delays to ensure UI elements are ready and seeds are loaded
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
    }, 500);
    
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
    }, 1000);

    // Load trait layers module if it exists
    if (window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
      window.NFTApp.getModule("traitLayers").setup(projectData)
    } else {
      console.warn("Trait layers module not found, trait layers tab may not work properly")
    }

    // Load combination rules module if it exists
    if (window.NFTApp.getModule && window.NFTApp.getModule("combinationRules")) {
      window.NFTApp.getModule("combinationRules").setup(projectData)
    } else {
      console.warn("Combination rules module not found, combination rules tab may not work properly")
    }

    // Load generate NFTs module if it exists
    if (window.NFTApp.getModule && window.NFTApp.getModule("generateNfts")) {
      console.log("Found generateNfts module, setting up...")
      window.NFTApp.getModule("generateNfts").setup(projectData)
      // Ensure both cards have the same height after setup
      setTimeout(() => {
        if (window.NFTApp.getModule("generateNfts").syncCardHeights) {
          window.NFTApp.getModule("generateNfts").syncCardHeights()
        }
      }, 0)
    } else {
      console.error("Generate NFTs module not found! Available modules:", Object.keys(window.NFTApp.modules))
    }

    // Check if File System Access API is supported
    const isFileSystemAccessAPISupported = 'showOpenFilePicker' in window;
    
    // Show/hide the Save As button based on API support
    const saveAsButton = document.getElementById("save-project-as");
    if (saveAsButton) {
      if (isFileSystemAccessAPISupported) {
        saveAsButton.style.display = "inline-flex"; // Show button
      } else {
        saveAsButton.style.display = "none"; // Hide button
      }
    }

    // Always show the first tab by default, after all setup/rendering
    if (window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
      window.NFTApp.getModule("navigation").showTab("general-info")
    }

    // Set up general info tab
    if (window.NFTApp.getModule && window.NFTApp.getModule("generalInfo")) {
      window.NFTApp.getModule("generalInfo").setupEventListeners(projectData)
    } else {
      console.warn("General info module not found, general info tab may not work properly")
    }

    // Add event listener for save as button
    document.getElementById("save-project-as").addEventListener("click", () => {
      if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
        window.NFTApp.getModule("projectService").save(true) // true = always show picker (save as)
      } else {
        console.warn("Project service module not found, saving may not work properly")
      }
    })

    // Add event listener for new project button
    document.getElementById("new-project").addEventListener("click", () => {
      if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
        window.NFTApp.getModule("confirmationModal").show(
          "Start New Project",
          "Are you sure you want to start a new project?",
          "Any unsaved changes to the current project will be lost.",
          () => {
            window.NFTApp.getModule("projectService").startNew()
          },
        )
      } else {
        console.warn("Project service module not found, new project functionality may not work properly")
      }
    })

    // Add event listener for load project button
    document.getElementById("load-project-btn").addEventListener("click", () => {
      document.getElementById("load-project-input").click()
    })

    // Ensure file input accepts both old and new formats
    const loadProjectInput = document.getElementById("load-project-input")
    if (loadProjectInput) {
      loadProjectInput.accept = ".json,.json.gz,.gz"
    }

    // Add event listener for load project input
    document.getElementById("load-project-input").addEventListener('change', (event) => {
      if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
        window.NFTApp.getModule("projectService").load(event)
      } else {
        console.warn("Project service module not found, loading may not work properly")
      }
    })

    // Add event listener for save project button
    document.getElementById("save-project").addEventListener("click", () => {
      if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
        window.NFTApp.getModule("projectService").save(false); // false = quick save
      } else {
        console.warn("Project service module not found, saving may not work properly");
      }
    });

    // FINAL SAFETY: Only the correct tab should be active
    const allNavTabs = document.querySelectorAll('.nav-tab');
    const allTabContents = document.querySelectorAll('.tab-content');
    let activeTabId = null;
    allNavTabs.forEach(tab => {
      if (tab.classList.contains('active')) {
        activeTabId = tab.getAttribute('data-tab');
      }
    });
    allTabContents.forEach(content => {
      if (content.id === activeTabId) {
        content.classList.add('active');
      } else {
        content.classList.remove('active');
      }
    });

    // After appending appInterface to appContainer, add this JS to sync the toggle with projectData.settings
    setTimeout(function() {
      var toggle = document.getElementById('metadata.rarity.rank');
      if (toggle && window.currentProject) {
        // Initialize from projectData.settings
        if (!window.currentProject.settings) window.currentProject.settings = {};
        if (typeof window.currentProject.settings.includeRarityRankInMetadata === 'undefined') {
          window.currentProject.settings.includeRarityRankInMetadata = true;
        }
        toggle.checked = !!window.currentProject.settings.includeRarityRankInMetadata;
        toggle.addEventListener('change', function() {
          window.currentProject.settings.includeRarityRankInMetadata = toggle.checked;
        });
      }
    }, 100);

    // Ensure Export NFTs / Metadata tab is always enabled (no conditions)
    const exportTab = document.querySelector('.nav-tab[data-tab="export-nfts"]');
    if (exportTab) {
      exportTab.classList.remove('disabled');
      exportTab.style.pointerEvents = 'auto';
      exportTab.style.opacity = '1';
      exportTab.style.cursor = 'pointer';
    }

    // Check and update navigation tab states based on traits
    window.NFTApp.getModule("projectInterface").updateNavigationTabStates(projectData);

    // Listen for trait changes to update navigation tabs (but keep Export tab always enabled)
    document.addEventListener('layers-updated', () => {
      window.NFTApp.getModule("projectInterface").updateNavigationTabStates(window.currentProject);
      // Ensure Export tab stays enabled
      const exportTab = document.querySelector('.nav-tab[data-tab="export-nfts"]');
      if (exportTab) {
        exportTab.classList.remove('disabled');
        exportTab.style.pointerEvents = 'auto';
        exportTab.style.opacity = '1';
        exportTab.style.cursor = 'pointer';
      }
    });
    
    document.addEventListener('traits-updated', () => {
      window.NFTApp.getModule("projectInterface").updateNavigationTabStates(window.currentProject);
      // Ensure Export tab stays enabled
      const exportTab = document.querySelector('.nav-tab[data-tab="export-nfts"]');
      if (exportTab) {
        exportTab.classList.remove('disabled');
        exportTab.style.pointerEvents = 'auto';
        exportTab.style.opacity = '1';
        exportTab.style.cursor = 'pointer';
      }
    });

    // Batch management logic
    (function() {
      var project = window.currentProject || {};
      var totalSupplyInput = document.getElementById('total-supply');
      var totalSupply = (project.size || (totalSupplyInput && Number(totalSupplyInput.value.replace(/,/g, ''))) || 0);
      var batchesSection = document.getElementById('batch-management-section');
      var numBatchesInput = document.getElementById('num-batches-input');
      var applyBatchCountBtn = document.getElementById('apply-batch-count-btn');
      var batchesList = document.getElementById('batches-list');
      var warningDiv = document.getElementById('batch-validation-warning');
      
      // Helper function to format numbers with commas (or dots as fallback)
      function formatNumberWithCommas(number) {
        if (typeof number !== 'number' || isNaN(number)) {
          return number;
        }
        // Try US locale first, fallback to manual comma formatting, then dots
        try {
          const formatted = number.toLocaleString('en-US');
          // Check if it actually used commas (not spaces)
          if (formatted.includes(',')) {
            return formatted;
          } else {
            // If it used spaces, use dots instead
            return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
          }
        } catch (e) {
          // Fallback: manual comma formatting
          return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
      }
      
      // Smart number input formatting for total supply
      function initializeSmartNumberInput() {
        if (!totalSupplyInput) return;
        
        // Format the initial value if it exists
        if (totalSupplyInput.value && !isNaN(totalSupplyInput.value.replace(/,/g, ''))) {
          var numValue = parseInt(totalSupplyInput.value.replace(/,/g, ''));
          if (numValue > 0) {
            totalSupplyInput.value = formatNumberWithCommas(numValue);
          }
        }
        
        // Handle focus event - show raw number for editing
        totalSupplyInput.addEventListener('focus', function() {
          var rawValue = this.value.replace(/[,.]/g, ''); // Remove commas and dots
          if (!isNaN(rawValue) && rawValue !== '') {
            this.value = rawValue;
          }
        });
        
        // Handle blur event - format with commas or dots
        totalSupplyInput.addEventListener('blur', function() {
          var rawValue = this.value.replace(/[,.]/g, ''); // Remove any existing commas or dots
          if (!isNaN(rawValue) && rawValue !== '') {
            var numValue = parseInt(rawValue);
            if (numValue > 0) {
              this.value = formatNumberWithCommas(numValue);
            } else {
              this.value = ''; // Clear if invalid
            }
          } else {
            this.value = ''; // Clear if not a number
          }
        });
        
        // Handle input event - allow only numbers
        totalSupplyInput.addEventListener('input', function() {
          // Remove all non-numeric characters
          this.value = this.value.replace(/[^0-9]/g, '');
        });
        
        // Handle keydown event - prevent non-numeric keys
        totalSupplyInput.addEventListener('keydown', function(e) {
          // Allow: backspace, delete, tab, escape, enter, home, end, left, right, up, down
          if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
              // Allow: Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X
              (e.keyCode === 65 && e.ctrlKey === true) ||
              (e.keyCode === 67 && e.ctrlKey === true) ||
              (e.keyCode === 86 && e.ctrlKey === true) ||
              (e.keyCode === 88 && e.ctrlKey === true)) {
            return;
          }
          // Ensure that it is a number and stop the keypress
          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault();
          }
        });
      }
      
      // Initialize the smart number input
      initializeSmartNumberInput();
      
      // Initialize batches if not present
      if (!project.batches || !Array.isArray(project.batches)) {
        project.batches = [{ size: '', minted: false }];
      }
      // Only set value if the element exists (it's now in export-nfts tab)
      if (numBatchesInput) {
      numBatchesInput.value = project.batches.length;
      }
      // Two-step batch configuration
      var batchInputs = [];
      // Helper: update the dynamic title with remaining NFTs
      function updateRemainingTitle() {
        var titleEl = document.getElementById('nfts-per-batch-title');
        if (!titleEl) return;
        var supply = Number(totalSupply) || 0;
        var assigned = 0;
        if (project && Array.isArray(project.batches)) {
          for (var k = 0; k < project.batches.length; k++) {
            assigned += Number(project.batches[k] && project.batches[k].size) || 0;
          }
        }
        var diff = supply - assigned; // can be negative (over-assigned)
        var remaining = Math.max(0, diff);
        // Ensure span exists for styled remainder
        var span = document.getElementById('nfts-per-batch-remaining');
        if (!span) {
          span = document.createElement('span');
          span.id = 'nfts-per-batch-remaining';
          titleEl.innerHTML = "NFT's per Batch: ";
          titleEl.appendChild(span);
        }
        if (diff < 0) {
          var over = Math.abs(diff);
          span.textContent = `(the sum of all the batches exceeds the total of the collection by ${over} NFTs. Please correct it.)`;
          span.style.color = '#e74c3c';
          span.style.fontWeight = '700';
          span.style.fontSize = '13px';
        } else if (remaining === 0) {
          span.textContent = `(0 NFTs still need to be distributed)`;
          span.style.color = '#27ae60';
          span.style.fontWeight = '700';
          span.style.fontSize = '';
        } else {
          span.textContent = `(${remaining} NFTs still need to be distributed)`;
          span.style.color = '#f39c12';
          span.style.fontWeight = '600';
          span.style.fontSize = '';
        }
      }

      function renderBatchInputs(n) {
        // Only render if batchesList exists (it's now in export-nfts tab)
        if (!batchesList) return;
        
        batchesList.innerHTML = '';
        // Insert section title if not present
        if (!document.getElementById('nfts-per-batch-title')) {
          var nftsPerBatchTitle = document.createElement('div');
          nftsPerBatchTitle.id = 'nfts-per-batch-title';
          nftsPerBatchTitle.innerHTML = "NFT's per Batch: <span id='nfts-per-batch-remaining' style='color:#f39c12;font-weight:600'>(0 NFTs still need to be distributed)</span>";
          nftsPerBatchTitle.style.fontWeight = '600';
          nftsPerBatchTitle.style.fontSize = '16px';
          nftsPerBatchTitle.style.marginBottom = '10px';
          batchesList.parentNode.insertBefore(nftsPerBatchTitle, batchesList);
        }
        // Always update the remaining count in the title
        updateRemainingTitle();
        batchInputs = [];
        var batchButtonElems = [];
        var tooltipElems = [];
        function updateTooltipForIndex(idx) {
          var inputRef = batchInputs[idx];
          var tooltipRef = tooltipElems[idx];
          if (!inputRef || !tooltipRef) return;
          var tipText = `input the total number of NFTs to be included in the Batch ${String(idx + 1).padStart(2, '0')}`;
          var hasValue = Number(inputRef.value) > 0;
          if (hasValue) {
            tooltipRef.textContent = '';
            tooltipRef.style.visibility = 'hidden';
            tooltipRef.style.display = 'block';
          } else {
            tooltipRef.textContent = tipText;
            tooltipRef.style.visibility = 'visible';
            tooltipRef.style.display = 'block';
          }
        }
        function autoFillLastBatchAndRefresh() {
          var supply = Number(totalSupply) || 0;
          var lastIdx = (project.batches && project.batches.length) ? project.batches.length - 1 : -1;
          if (lastIdx < 0) { updateRemainingTitle(); return; }
          var assignedExceptLast = 0;
          var allOthersConfigured = true;
          for (var t = 0; t < project.batches.length; t++) {
            if (t === lastIdx) continue;
            var val = Number(project.batches[t] && project.batches[t].size) || 0;
            if (val <= 0) allOthersConfigured = false;
            assignedExceptLast += val;
          }
          var lastVal = Number(project.batches[lastIdx] && project.batches[lastIdx].size) || 0;
          if (allOthersConfigured && lastVal === 0) {
            var remaining = Math.max(0, supply - assignedExceptLast);
            project.batches[lastIdx] = project.batches[lastIdx] || {};
            project.batches[lastIdx].size = remaining;
            if (batchInputs[lastIdx]) {
              batchInputs[lastIdx].value = remaining ? String(remaining) : '';
            }
            if (batchButtonElems[lastIdx]) {
              var b = project.batches[lastIdx] || {};
              var mintedSuffix = b.minted ? ' (Already Exported)' : '';
              batchButtonElems[lastIdx].textContent = `Batch ${String(lastIdx + 1).padStart(2, '0')} (${formatNumberWithCommas(Number(b.size) || 0)} NFTs)` + mintedSuffix;
            }
          }
          updateRemainingTitle();
        }
        for (var i = 0; i < n; i++) {
          var row = document.createElement('div');
          row.className = 'batch-row';
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '10px';
          row.style.marginBottom = '6px';
          // If batch is already minted, color row red and add custom tooltip
          if (project.batches[i] && project.batches[i].minted) {
            row.style.background = '#ffdddd';
            row.style.borderRadius = '6px';
            row.style.color = '#b30000';
            row.removeAttribute('title');
            row.classList.add('tooltip');
            let rowTooltip = row.querySelector('.tooltiptext');
            if (!rowTooltip) {
              rowTooltip = document.createElement('span');
              rowTooltip.className = 'tooltiptext';
              row.appendChild(rowTooltip);
            }
            rowTooltip.textContent = 'this batch will not be exported since it was already exported';
          } else {
            row.style.background = '';
            row.style.color = '';
            row.removeAttribute('title');
            row.classList.remove('tooltip');
            const rowTooltip = row.querySelector('.tooltiptext');
            if (rowTooltip) rowTooltip.remove();
          }
          var label = document.createElement('span');
          label.textContent = 'Batch ' + String(i + 1).padStart(2, '0') + ':';
          label.style.width = '80px';
          var input = document.createElement('input');
          input.type = 'number';
          input.min = '0';
          input.max = totalSupply;
          if (project.batches[i] && typeof project.batches[i].size !== 'undefined' && project.batches[i].size !== null && project.batches[i].size !== '' && Number(project.batches[i].size) > 0) {
            input.value = project.batches[i].size;
          } else {
            input.value = '';
          }
          input.className = 'form-control';
          input.style.width = '90px';
          // Add Already Minted checkbox
          var mintedCheckbox = document.createElement('input');
          mintedCheckbox.type = 'checkbox';
          mintedCheckbox.checked = !!(project.batches[i] && project.batches[i].minted);
          mintedCheckbox.style.marginLeft = '12px';
          mintedCheckbox.style.width = '13px';
          mintedCheckbox.style.height = '13px';
          mintedCheckbox.style.minWidth = '13px';
          mintedCheckbox.style.minHeight = '13px';
          mintedCheckbox.style.maxWidth = '13px';
          mintedCheckbox.style.maxHeight = '13px';
          // Remove title and add custom tooltip
          mintedCheckbox.removeAttribute('title');
          mintedCheckbox.classList.add('tooltip');
          let mintedTooltip = mintedCheckbox.querySelector('.tooltiptext');
          if (!mintedTooltip) {
            mintedTooltip = document.createElement('span');
            mintedTooltip.className = 'tooltiptext';
            mintedTooltip.textContent = 'Mark this batch as already exported';
            mintedCheckbox.appendChild(mintedTooltip);
          } else {
            mintedTooltip.textContent = 'Mark this batch as already exported';
          }
          mintedCheckbox.addEventListener('change', function(idx) {
            return function(e) {
              project.batches[idx] = project.batches[idx] || {};
              project.batches[idx].minted = e.target.checked;
              // If marked as minted, auto-deselect from selectedBatches
              if (e.target.checked && Array.isArray(project.selectedBatches)) {
                var pos = project.selectedBatches.indexOf(idx);
                if (pos !== -1) project.selectedBatches.splice(pos, 1);
              }
              // Re-render export options to update batch select disabling
              renderBatchInputs(n);
            };
          }(i));
          var mintedLabel = document.createElement('label');
          mintedLabel.textContent = 'Already Exported';
          mintedLabel.style.fontSize = '13px';
          mintedLabel.style.marginLeft = '4px';
          batchInputs.push(input);
          row.appendChild(label);
          row.appendChild(input);
          row.appendChild(mintedCheckbox);
          row.appendChild(mintedLabel);
          // Add tooltip below input if empty
          var tooltip = document.createElement('div');
          tooltip.className = 'batch-input-tooltip';
          tooltip.style.fontSize = '12px';
          tooltip.style.color = '#888';
          tooltip.style.marginTop = '2px';
          tooltip.style.marginLeft = '2px';
          tooltip.style.minHeight = '16px';
          tooltip.style.position = 'relative';
          function updateTooltip() { updateTooltipForIndex(i); }
          input.addEventListener('input', updateTooltip);
          // Update batch size and button label only when the user leaves this field
          input.addEventListener('blur', function(idx, inputRef) {
            return function() {
              var v = Math.floor(Number(inputRef.value));
              v = (Number.isFinite(v) && v > 0) ? v : 0;
              project.batches[idx] = project.batches[idx] || {};
              project.batches[idx].size = v;
              // Update the corresponding selection button label if present
              if (batchButtonElems[idx]) {
                var b = project.batches[idx] || {};
                var mintedSuffix = b.minted ? ' (Already Exported)' : '';
                batchButtonElems[idx].textContent = `Batch ${String(idx + 1).padStart(2, '0')} (${formatNumberWithCommas(v)} NFTs)` + mintedSuffix;
              }
              // Auto-fill last batch with the remaining supply and update title
              autoFillLastBatchAndRefresh();
              // Refresh tooltip visibility per rules
              updateTooltipForIndex(idx);
            };
          }(i, input));
          updateTooltip();
          row.appendChild(tooltip);
          batchesList.appendChild(row);
          tooltipElems[i] = tooltip;
        }
        // No Apply button needed; values are saved on blur and UI auto-updates
        // Add metadata export options UI below the Apply button
        let exportOptionsDiv = document.getElementById('metadata-export-options');
        if (!exportOptionsDiv) {
          exportOptionsDiv = document.createElement('div');
          exportOptionsDiv.id = 'metadata-export-options';
          exportOptionsDiv.style.marginTop = '18px';
          exportOptionsDiv.style.padding = '16px 0 0 0';
          exportOptionsDiv.style.borderTop = '1px solid #333';
          exportOptionsDiv.style.display = 'flex';
          exportOptionsDiv.style.flexDirection = 'column';
          exportOptionsDiv.style.gap = '16px';
          batchesList.parentNode.appendChild(exportOptionsDiv);
        } else {
          exportOptionsDiv.innerHTML = '';
        }
        // Add custom batch selection UI
        const batchSelectLabel = document.createElement('label');
        batchSelectLabel.textContent = 'Select batches to generate metadata for:';
        batchSelectLabel.style.fontWeight = '500';
        // Remove title and add custom tooltip
        batchSelectLabel.removeAttribute('title');
        batchSelectLabel.classList.add('tooltip');
        let batchTooltip = batchSelectLabel.querySelector('.tooltiptext');
        if (!batchTooltip) {
          batchTooltip = document.createElement('span');
          batchTooltip.className = 'tooltiptext';
          batchTooltip.textContent = 'Choose which batches to include in the metadata export.';
          batchSelectLabel.appendChild(batchTooltip);
        } else {
          batchTooltip.textContent = 'Choose which batches to include in the metadata export.';
        }
        exportOptionsDiv.appendChild(batchSelectLabel);
        const batchSelectDiv = document.createElement('div');
        batchSelectDiv.style.display = 'flex';
        batchSelectDiv.style.flexWrap = 'wrap';
        batchSelectDiv.style.gap = '8px';
        batchSelectDiv.style.marginBottom = '8px';
        project.selectedBatches = Array.isArray(project.selectedBatches) ? project.selectedBatches : [];
        // Clean selectedBatches by removing any minted batches
        project.selectedBatches = Array.isArray(project.selectedBatches) ? project.selectedBatches.filter(function(i){ return !(project.batches[i] && project.batches[i].minted); }) : [];
        project.batches.forEach((b, i) => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = `Batch ${String(i + 1).padStart(2, '0')} (${formatNumberWithCommas(Number(b.size) || 0)} NFTs)` + (b.minted ? ' (Already Minted)' : '');
          btn.style.padding = '6px 12px';
          btn.style.borderRadius = '6px';
          btn.style.border = '1px solid #444';
          btn.style.background = project.selectedBatches.includes(i) ? '#27ae60' : (b.minted ? '#ffdddd' : '#181818');
          btn.style.color = b.minted ? '#b30000' : '#fff';
          btn.style.cursor = b.minted ? 'not-allowed' : 'pointer';
          btn.style.width = '256px';
          btn.style.minWidth = '256px';
          btn.style.maxWidth = '256px';
          btn.style.flexShrink = '0';
          btn.disabled = !!b.minted;
          btn.addEventListener('click', function() {
            if (b.minted) return;
            const idx = project.selectedBatches.indexOf(i);
            if (idx === -1) {
              project.selectedBatches.push(i);
            } else {
              project.selectedBatches.splice(idx, 1);
            }
            // Re-render to update button color
            renderBatchInputs(n);
          });
          batchSelectDiv.appendChild(btn);
          batchButtonElems[i] = btn;
        });
        exportOptionsDiv.appendChild(batchSelectDiv);
        // Add custom blockchain selection UI
        const blockchainLabel = document.createElement('label');
        blockchainLabel.textContent = 'Select blockchains to mint on:';
        blockchainLabel.style.fontWeight = '500';
        // Remove title and add custom tooltip
        blockchainLabel.removeAttribute('title');
        blockchainLabel.classList.add('tooltip');
        let blockchainTooltip = blockchainLabel.querySelector('.tooltiptext');
        if (!blockchainTooltip) {
          blockchainTooltip = document.createElement('span');
          blockchainTooltip.className = 'tooltiptext';
          blockchainTooltip.textContent = 'Choose one or more blockchains for minting.';
          blockchainLabel.appendChild(blockchainTooltip);
        } else {
          blockchainTooltip.textContent = 'Choose one or more blockchains for minting.';
        }
        exportOptionsDiv.appendChild(blockchainLabel);
        
        // Add Select All toggles row - match the exact structure of blockchain rows
        const selectAllRow = document.createElement('div');
        selectAllRow.style.display = 'flex';
        selectAllRow.style.alignItems = 'center';
        selectAllRow.style.width = '100%';
        selectAllRow.style.maxWidth = '100%';
        selectAllRow.style.gap = '8px';
        selectAllRow.style.marginBottom = '8px';
        
        // Create the same group structure as blockchain rows
        const selectAllGroup = document.createElement('div');
        selectAllGroup.style.display = 'flex';
        selectAllGroup.style.alignItems = 'center';
        selectAllGroup.style.width = '100%';
        selectAllGroup.style.maxWidth = '100%';
        selectAllGroup.style.gap = '8px';
        selectAllGroup.style.flexWrap = 'nowrap';
        
        // Add spacer to align with blockchain buttons (exact width and properties)
        const blockchainSpacer = document.createElement('div');
        blockchainSpacer.style.width = '256px';
        blockchainSpacer.style.minWidth = '256px';
        blockchainSpacer.style.maxWidth = '256px';
        blockchainSpacer.style.flexShrink = '0';
        blockchainSpacer.style.height = '1px'; // Minimal height
        selectAllGroup.appendChild(blockchainSpacer);
        
        // Select All for metadata per NFT - match exact positioning (now third column)
        const selectAllMetadataWrap = document.createElement('label');
        selectAllMetadataWrap.style.display = 'inline-flex';
        selectAllMetadataWrap.style.alignItems = 'center';
        selectAllMetadataWrap.style.gap = '6px';
        selectAllMetadataWrap.style.marginLeft = '12px'; // Third column spacing
        selectAllMetadataWrap.style.marginRight = '0px';
        const selectAllMetadataToggle = document.createElement('input');
        selectAllMetadataToggle.type = 'checkbox';
        selectAllMetadataToggle.id = 'select-all-metadata-toggle';
        selectAllMetadataToggle.style.margin = '0';
        selectAllMetadataToggle.style.padding = '0';
        selectAllMetadataToggle.addEventListener('change', function() {
          const isChecked = selectAllMetadataToggle.checked;
          allBlockchains.forEach(bc => {
            if (project.blockchainPerNft) {
              project.blockchainPerNft[bc] = isChecked;
            }
          });
          renderBatchInputs(n);
        });
        const selectAllMetadataText = document.createElement('span');
        selectAllMetadataText.textContent = 'Select All';
        selectAllMetadataText.style.fontSize = '12px';
        selectAllMetadataText.style.color = '#ccc';
        selectAllMetadataText.style.fontWeight = '500';
        selectAllMetadataWrap.appendChild(selectAllMetadataToggle);
        selectAllMetadataWrap.appendChild(selectAllMetadataText);
        
        // Select All for JSON files - match exact positioning (now first column)
        const selectAllJsonWrap = document.createElement('label');
        selectAllJsonWrap.style.display = 'inline-flex';
        selectAllJsonWrap.style.alignItems = 'center';
        selectAllJsonWrap.style.gap = '6px';
        selectAllJsonWrap.style.marginLeft = '6px'; // First column after blockchain button
        selectAllJsonWrap.style.marginRight = '0px';
        // Fix column width so subsequent columns align consistently
        selectAllJsonWrap.style.width = '100px';
        selectAllJsonWrap.style.minWidth = '100px';
        selectAllJsonWrap.style.maxWidth = '100px';
        selectAllJsonWrap.style.flex = '0 0 100px';
        const selectAllJsonToggle = document.createElement('input');
        selectAllJsonToggle.type = 'checkbox';
        selectAllJsonToggle.id = 'select-all-json-toggle';
        selectAllJsonToggle.style.margin = '0';
        selectAllJsonToggle.style.padding = '0';
        selectAllJsonToggle.addEventListener('change', function() {
          const isChecked = selectAllJsonToggle.checked;
          allBlockchains.forEach(bc => {
            if (!project.blockchainFileTypes) project.blockchainFileTypes = {};
            if (!project.blockchainFileTypes[bc]) project.blockchainFileTypes[bc] = {};
            project.blockchainFileTypes[bc].json = isChecked;
          });
          renderBatchInputs(n);
        });
        const selectAllJsonText = document.createElement('span');
        selectAllJsonText.textContent = 'Select All';
        selectAllJsonText.style.fontSize = '12px';
        selectAllJsonText.style.color = '#ccc';
        selectAllJsonText.style.fontWeight = '500';
        selectAllJsonWrap.appendChild(selectAllJsonToggle);
        selectAllJsonWrap.appendChild(selectAllJsonText);
        
        // Select All for CSV files - match exact positioning (now second column)
        const selectAllCsvWrap = document.createElement('label');
        selectAllCsvWrap.style.display = 'inline-flex';
        selectAllCsvWrap.style.alignItems = 'center';
        selectAllCsvWrap.style.gap = '6px';
        selectAllCsvWrap.style.marginLeft = '12px'; // Second column spacing
        selectAllCsvWrap.style.marginRight = '0px';
        // Fix column width so subsequent columns align consistently
        selectAllCsvWrap.style.width = '100px';
        selectAllCsvWrap.style.minWidth = '100px';
        selectAllCsvWrap.style.maxWidth = '100px';
        selectAllCsvWrap.style.flex = '0 0 100px';
        const selectAllCsvToggle = document.createElement('input');
        selectAllCsvToggle.type = 'checkbox';
        selectAllCsvToggle.id = 'select-all-csv-toggle';
        selectAllCsvToggle.style.margin = '0';
        selectAllCsvToggle.style.padding = '0';
        selectAllCsvToggle.addEventListener('change', function() {
          const isChecked = selectAllCsvToggle.checked;
          allBlockchains.forEach(bc => {
            if (!project.blockchainFileTypes) project.blockchainFileTypes = {};
            if (!project.blockchainFileTypes[bc]) project.blockchainFileTypes[bc] = {};
            project.blockchainFileTypes[bc].csv = isChecked;
          });
          renderBatchInputs(n);
        });
        const selectAllCsvText = document.createElement('span');
        selectAllCsvText.textContent = 'Select All';
        selectAllCsvText.style.fontSize = '12px';
        selectAllCsvText.style.color = '#ccc';
        selectAllCsvText.style.fontWeight = '500';
        selectAllCsvWrap.appendChild(selectAllCsvToggle);
        selectAllCsvWrap.appendChild(selectAllCsvText);
        
        selectAllGroup.appendChild(selectAllJsonWrap);
        selectAllGroup.appendChild(selectAllCsvWrap);
        selectAllGroup.appendChild(selectAllMetadataWrap);
        selectAllRow.appendChild(selectAllGroup);
        exportOptionsDiv.appendChild(selectAllRow);
        
        const blockchainDiv = document.createElement('div');
        blockchainDiv.style.display = 'flex';
        blockchainDiv.style.flexDirection = 'column';
        blockchainDiv.style.gap = '8px';
        const allBlockchains = ['Ethereum', 'Solana', 'Bitcoin Ordinals (Inscriptions)', 'Cosmos (Inscriptions)', 'Tezos', 'XRPL'];
        project.selectedBlockchains = Array.isArray(project.selectedBlockchains) ? project.selectedBlockchains : [];
        project.blockchainPerNft = (project.blockchainPerNft && typeof project.blockchainPerNft === 'object') ? project.blockchainPerNft : {};
        
        // Helper functions to update Select All toggle states
        function updateSelectAllMetadataState() {
          const selectAllToggle = document.getElementById('select-all-metadata-toggle');
          if (!selectAllToggle) return;
          
          const selectedBlockchains = project.selectedBlockchains || [];
          const allSelected = selectedBlockchains.length > 0 && selectedBlockchains.every(bc => 
            project.blockchainPerNft && project.blockchainPerNft[bc]
          );
          selectAllToggle.checked = allSelected;
        }
        
        function updateSelectAllJsonState() {
          const selectAllToggle = document.getElementById('select-all-json-toggle');
          if (!selectAllToggle) return;
          
          const selectedBlockchains = project.selectedBlockchains || [];
          const allSelected = selectedBlockchains.length > 0 && selectedBlockchains.every(bc => 
            project.blockchainFileTypes && project.blockchainFileTypes[bc] && project.blockchainFileTypes[bc].json
          );
          selectAllToggle.checked = allSelected;
        }
        
        function updateSelectAllCsvState() {
          const selectAllToggle = document.getElementById('select-all-csv-toggle');
          if (!selectAllToggle) return;
          
          const selectedBlockchains = project.selectedBlockchains || [];
          const allSelected = selectedBlockchains.length > 0 && selectedBlockchains.every(bc => 
            project.blockchainFileTypes && project.blockchainFileTypes[bc] && project.blockchainFileTypes[bc].csv
          );
          selectAllToggle.checked = allSelected;
        }
        allBlockchains.forEach(bc => {
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.textContent = bc;
          btn.style.padding = '6px 12px';
          btn.style.borderRadius = '6px';
          btn.style.border = '1px solid #444';
          btn.style.background = project.selectedBlockchains.includes(bc) ? '#27ae60' : '#181818';
          btn.style.color = '#fff';
          btn.style.cursor = 'pointer';
          btn.style.width = '256px';
          btn.style.minWidth = '256px';
          btn.style.maxWidth = '256px';
          btn.style.flexShrink = '0';
          btn.addEventListener('click', function() {
            const idx = project.selectedBlockchains.indexOf(bc);
            if (idx === -1) {
              project.selectedBlockchains.push(bc);
              // Set JSON file as selected by default when blockchain is selected
              if (!project.blockchainFileTypes) project.blockchainFileTypes = {};
              if (!project.blockchainFileTypes[bc]) project.blockchainFileTypes[bc] = {};
              project.blockchainFileTypes[bc].json = true;
            } else {
              project.selectedBlockchains.splice(idx, 1);
              // Deselect both JSON and CSV toggles when blockchain is deselected
              if (project.blockchainFileTypes && project.blockchainFileTypes[bc]) {
                project.blockchainFileTypes[bc].json = false;
                project.blockchainFileTypes[bc].csv = false;
              }
            }
            renderBatchInputs(n);
            // Update Select All toggle states after blockchain selection changes
            setTimeout(() => {
              updateSelectAllMetadataState();
              updateSelectAllJsonState();
              updateSelectAllCsvState();
            }, 0);
          });
          // Toggle container for per-NFT metadata (now third column)
          const toggleWrap = document.createElement('label');
          toggleWrap.style.display = 'inline-flex';
          toggleWrap.style.alignItems = 'center';
          toggleWrap.style.gap = '6px';
          toggleWrap.style.marginLeft = '12px';
          const toggle = document.createElement('input');
          toggle.type = 'checkbox';
          toggle.checked = !!project.blockchainPerNft[bc];
          toggle.addEventListener('change', function() {
            project.blockchainPerNft[bc] = toggle.checked;
            updateSelectAllMetadataState();
          });
          const toggleText = document.createElement('span');
          toggleText.textContent = 'include 1 metadata file per NFT';
          toggleText.style.fontSize = '12px';
          toggleText.style.color = '#ccc';
          toggleWrap.appendChild(toggle);
          toggleWrap.appendChild(toggleText);
          
          // JSON file toggle (now first column)
          const jsonToggleWrap = document.createElement('label');
          jsonToggleWrap.style.display = 'inline-flex';
          jsonToggleWrap.style.alignItems = 'center';
          jsonToggleWrap.style.gap = '6px';
          jsonToggleWrap.style.marginLeft = '6px';
          // Match header width so column lines up under Select All
          jsonToggleWrap.style.width = '100px';
          jsonToggleWrap.style.minWidth = '100px';
          jsonToggleWrap.style.maxWidth = '100px';
          jsonToggleWrap.style.flex = '0 0 100px';
          const jsonToggle = document.createElement('input');
          jsonToggle.type = 'checkbox';
          jsonToggle.checked = !!(project.blockchainFileTypes && project.blockchainFileTypes[bc] && project.blockchainFileTypes[bc].json);
          jsonToggle.addEventListener('change', function() {
            if (!project.blockchainFileTypes) project.blockchainFileTypes = {};
            if (!project.blockchainFileTypes[bc]) project.blockchainFileTypes[bc] = {};
            project.blockchainFileTypes[bc].json = jsonToggle.checked;
            updateSelectAllJsonState();
          });
          const jsonToggleText = document.createElement('span');
          jsonToggleText.textContent = 'JSON file';
          jsonToggleText.style.fontSize = '12px';
          jsonToggleText.style.color = '#ccc';
          jsonToggleWrap.appendChild(jsonToggle);
          jsonToggleWrap.appendChild(jsonToggleText);
          
          // CSV file toggle (now second column)
          const csvToggleWrap = document.createElement('label');
          csvToggleWrap.style.display = 'inline-flex';
          csvToggleWrap.style.alignItems = 'center';
          csvToggleWrap.style.gap = '6px';
          csvToggleWrap.style.marginLeft = '12px';
          // Match header width so column lines up under Select All
          csvToggleWrap.style.width = '100px';
          csvToggleWrap.style.minWidth = '100px';
          csvToggleWrap.style.maxWidth = '100px';
          csvToggleWrap.style.flex = '0 0 100px';
          const csvToggle = document.createElement('input');
          csvToggle.type = 'checkbox';
          csvToggle.checked = !!(project.blockchainFileTypes && project.blockchainFileTypes[bc] && project.blockchainFileTypes[bc].csv);
          csvToggle.addEventListener('change', function() {
            if (!project.blockchainFileTypes) project.blockchainFileTypes = {};
            if (!project.blockchainFileTypes[bc]) project.blockchainFileTypes[bc] = {};
            project.blockchainFileTypes[bc].csv = csvToggle.checked;
            updateSelectAllCsvState();
          });
          const csvToggleText = document.createElement('span');
          csvToggleText.textContent = 'CSV file';
          csvToggleText.style.fontSize = '12px';
          csvToggleText.style.color = '#ccc';
          csvToggleWrap.appendChild(csvToggle);
          csvToggleWrap.appendChild(csvToggleText);
          
          const group = document.createElement('div');
          group.style.display = 'flex';
          group.style.alignItems = 'center';
          group.style.width = '100%';
          group.style.maxWidth = '100%';
          group.style.gap = '8px';
          group.style.flexWrap = 'nowrap';
          group.appendChild(btn);
          group.appendChild(jsonToggleWrap);
          group.appendChild(csvToggleWrap);
          group.appendChild(toggleWrap);
          blockchainDiv.appendChild(group);
        });
        exportOptionsDiv.appendChild(blockchainDiv);
        // Add Export Metadata button
        const exportBtn = document.createElement('button');
        exportBtn.textContent = 'Export Metadata / NFTs';
        exportBtn.className = 'btn btn-success';
        exportBtn.style.marginTop = '18px';
        exportBtn.style.height = '38px';
        exportBtn.style.padding = '0 24px';
        exportBtn.style.fontSize = '1rem';
        exportBtn.onclick = async function() {
          const selectedBatchIndexes = Array.isArray(project.selectedBatches) ? project.selectedBatches.filter(i => !project.batches[i].minted) : [];
          const selectedBlockchains = Array.isArray(project.selectedBlockchains) ? project.selectedBlockchains : [];
          if (!selectedBatchIndexes.length || !selectedBlockchains.length) {
            if (window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Please select at least one batch and one blockchain.', 'warning', 2500);
            }
            return;
          }
          // Show loading overlay while exporting
          try {
            if (window.NFTApp.getModule('projectService')) {
              window.NFTApp.getModule('projectService').showLoadingAnimation('Metadata / NFTs being exported. Please wait', true);
            }
          } catch(e) { /* ignore */ }
          const zip = new JSZip();
          // Helper to format metadata per blockchain
          function formatAttributes(nft) {
            return nft.traits && Array.isArray(nft.traits) ? nft.traits.map(trait => ({
              trait_type: trait.layer && trait.layer.name ? trait.layer.name : trait.layer,
              value: trait.trait && trait.trait.name ? trait.trait.name : trait.trait
            })) : [];
          }
          function buildMetadata(blockchain, project, nft, imageName, index) {
            const nameBase = `${project.filenamePrefix || 'NFT'} #${String(index).padStart(4, '0')}`;
            const commonAttrs = formatAttributes(nft);
            switch (blockchain) {
              case 'Solana': {
                return {
                  name: nameBase,
                  symbol: (project.symbol || '').toString().slice(0,10) || undefined,
                  description: project.defaultNftDescription || '',
                  image: imageName,
                  attributes: commonAttrs,
                  properties: {
                    category: 'image',
                    files: [{ uri: imageName, type: 'image/png' }]
                  }
                };
              }
              case 'Tezos': {
                return {
                  name: nameBase,
                  symbol: (project.symbol || '').toString().slice(0,10) || undefined,
                  decimals: 0,
                  description: project.defaultNftDescription || '',
                  artifactUri: imageName,
                  displayUri: imageName,
                  thumbnailUri: imageName,
                  formats: [{ uri: imageName, mimeType: 'image/png' }],
                  attributes: commonAttrs.map(a => ({ name: a.trait_type, value: a.value }))
                };
              }
              case 'Bitcoin Ordinals (Inscriptions)':
              case 'Cosmos (Inscriptions)': {
                return {
                  name: nameBase,
                  description: project.defaultNftDescription || '',
                  content: imageName,
                  contentType: 'image/png',
                  attributes: commonAttrs
                };
              }
              case 'XRPL': {
                return {
                  name: nameBase,
                  description: project.defaultNftDescription || '',
                  image: imageName,
                  attributes: commonAttrs
                };
              }
              case 'Ethereum':
              default: {
                const m = {
                  name: nameBase,
                  description: project.defaultNftDescription || '',
                  image: imageName,
                  attributes: commonAttrs
                };
                if (project.settings && project.settings.includeRarityRankInMetadata && typeof nft.rarity_rank !== 'undefined') {
                  m.rarity_rank = nft.rarity_rank;
                }
                return m;
              }
            }
          }
          
          // Helper function to generate CSV data for a single NFT
          function generateCSVData(blockchain, project, nft, imageName, index) {
            const nameBase = `${project.filenamePrefix || 'NFT'} #${String(index).padStart(4, '0')}`;
            const attributes = formatAttributes(nft);
            
            let csvContent = 'Name,Description,Image';
            if (attributes.length > 0) {
              csvContent += ',' + attributes.map(attr => `Trait_${attr.trait_type}`).join(',');
            }
            csvContent += '\n';
            
            csvContent += `"${nameBase}","${project.defaultNftDescription || ''}","${imageName}"`;
            if (attributes.length > 0) {
              csvContent += ',' + attributes.map(attr => `"${attr.value}"`).join(',');
            }
            csvContent += '\n';
            
            return csvContent;
          }
          
          // Helper function to generate CSV data for a batch
          function generateBatchCSVData(blockchain, project, nfts, batchNumber) {
            if (nfts.length === 0) return '';
            
            // Get all unique trait types from all NFTs
            const allTraitTypes = new Set();
            nfts.forEach(({ nft }) => {
              const attributes = formatAttributes(nft);
              attributes.forEach(attr => allTraitTypes.add(attr.trait_type));
            });
            
            const traitTypes = Array.from(allTraitTypes);
            
            let csvContent = 'Name,Description,Image';
            if (traitTypes.length > 0) {
              csvContent += ',' + traitTypes.map(traitType => `Trait_${traitType}`).join(',');
            }
            csvContent += '\n';
            
            nfts.forEach(({ nft, imageName, index }) => {
              const nameBase = `${project.filenamePrefix || 'NFT'} #${String(index).padStart(4, '0')}`;
              const attributes = formatAttributes(nft);
              const attributeMap = {};
              attributes.forEach(attr => {
                attributeMap[attr.trait_type] = attr.value;
              });
              
              csvContent += `"${nameBase}","${project.defaultNftDescription || ''}","${imageName}"`;
              if (traitTypes.length > 0) {
                csvContent += ',' + traitTypes.map(traitType => `"${attributeMap[traitType] || ''}"`).join(',');
              }
              csvContent += '\n';
            });
            
            return csvContent;
          }
          
          // For each blockchain, create a folder
          for (const blockchain of selectedBlockchains) {
            const blockchainFolder = zip.folder(blockchain);
            const fileTypes = project.blockchainFileTypes && project.blockchainFileTypes[blockchain] ? project.blockchainFileTypes[blockchain] : { json: true, csv: false };
            
            for (const batchIdx of selectedBatchIndexes) {
              const batch = project.batches[batchIdx];
              const batchFolder = blockchainFolder.folder(`Batch_${String(batchIdx + 1).padStart(2, '0')}`);
              // Get NFT seeds for this batch
              let seedListKey = 'nftSeedList_' + (project.name ? encodeURIComponent(project.name) : 'default');
              let seedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
              // Calculate start/end index for this batch
              let startIdx = 0;
              for (let b = 0; b < batchIdx; b++) startIdx += Number(project.batches[b].size) || 0;
              let endIdx = startIdx + (Number(batch.size) || 0);
              let batchSeeds = seedList.slice(startIdx, endIdx);
              // If not enough seeds, skip this batch
              if (!batchSeeds.length) continue;
              const perNft = !!(project.blockchainPerNft && project.blockchainPerNft[blockchain]);
              
              // Generate NFTs for this batch (with current rules and trait corrections)
              const nfts = [];
              
              // Notify user that NFTs are being generated with current rules
              if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                window.NFTApp.getModule("notificationService").show(
                  `Generating ${batchSeeds.length} NFTs with current rules and trait corrections...`,
                  "info",
                  3000
                );
              }
              
              for (let i = 0; i < batchSeeds.length; i++) {
                const seedObj = batchSeeds[i];
                const seed = seedObj && seedObj.seed ? seedObj.seed : null;
                if (!seed) continue;
                let nft = null;
                if (window.NFTApp.getModule && window.NFTApp.getModule('generateNfts')) {
                  try {
                    // Always generate fresh NFT with current project data (including corrected traits and updated rules)
                    // No caching is used in export to ensure corrected traits and rule changes are included
                    nft = await window.NFTApp.getModule('generateNfts').generateSingleNFT(window.currentProject, false, seed);
                  } catch (e) { nft = null; }
                }
                if (!nft || !nft.imageData) continue;
                const imageName = `${project.filenamePrefix || 'NFT'}_${String(startIdx + i + 1).padStart(4, '0')}.png`;
                const imageBlob = (window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').dataURLtoBlob)
                  ? window.NFTApp.getModule('generateNftsUI').dataURLtoBlob(nft.imageData)
                  : (function(dataURL) {
                      const parts = dataURL.split(';base64,');
                      const contentType = parts[0].split(':')[1];
                      const raw = window.atob(parts[1]);
                      const uInt8Array = new Uint8Array(raw.length);
                      for (let i = 0; i < raw.length; ++i) uInt8Array[i] = raw.charCodeAt(i);
                      return new Blob([uInt8Array], { type: contentType });
                    })(nft.imageData);
                batchFolder.file(imageName, imageBlob);
                nfts.push({ nft, imageName, index: startIdx + i + 1 });
              }
              
              // Export JSON files if selected
              if (fileTypes.json) {
                if (perNft) {
                  // Export one metadata file per NFT
                  for (const { nft, imageName, index } of nfts) {
                    const metadata = buildMetadata(blockchain, project, nft, imageName, index);
                    const metadataName = `${project.filenamePrefix || 'NFT'}_${String(index).padStart(4, '0')}.json`;
                    batchFolder.file(metadataName, JSON.stringify(metadata, null, 2));
                  }
                } else {
                  // Export a single combined metadata file for the whole batch
                  const combined = nfts.map(({ nft, imageName, index }) => buildMetadata(blockchain, project, nft, imageName, index));
                  const metadataName = `${project.filenamePrefix || 'NFT'}_Batch_${String(batchIdx + 1).padStart(2, '0')}.json`;
                  batchFolder.file(metadataName, JSON.stringify(combined, null, 2));
                }
              }
              
              // Export CSV files if selected
              if (fileTypes.csv) {
                if (perNft) {
                  // Export one CSV file per NFT
                  for (const { nft, imageName, index } of nfts) {
                    const csvData = generateCSVData(blockchain, project, nft, imageName, index);
                    const csvName = `${project.filenamePrefix || 'NFT'}_${String(index).padStart(4, '0')}.csv`;
                    batchFolder.file(csvName, csvData);
                  }
                } else {
                  // Export a single combined CSV file for the whole batch
                  const csvData = generateBatchCSVData(blockchain, project, nfts, batchIdx + 1);
                  const csvName = `${project.filenamePrefix || 'NFT'}_Batch_${String(batchIdx + 1).padStart(2, '0')}.csv`;
                  batchFolder.file(csvName, csvData);
                }
              }
            }
          }
          // Generate and download zip
          try {
            const content = await zip.generateAsync({ type: 'blob' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(content);
            a.download = `${project.name || 'NFT_Metadata'}.zip`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(a.href);
            // Hide loading overlay on success
            try { if (window.NFTApp.getModule('projectService')) { window.NFTApp.getModule('projectService').hideLoadingAnimation(); } } catch(e) { /* ignore */ }
            if (window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Metadata and NFTs exported successfully!', 'success', 2500);
            }
          } catch (err) {
            try { if (window.NFTApp.getModule('projectService')) { window.NFTApp.getModule('projectService').hideLoadingAnimation(); } } catch(e) { /* ignore */ }
            if (window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Error exporting metadata and NFTs: ' + err, 'error', 3500);
            }
          }
        };
        exportOptionsDiv.appendChild(exportBtn);
        
        // Update Select All toggle states after rendering
        setTimeout(() => {
          updateSelectAllMetadataState();
          updateSelectAllJsonState();
          updateSelectAllCsvState();
        }, 0);
      }
      // First Apply: show batch input fields
      if (applyBatchCountBtn && numBatchesInput) {
        applyBatchCountBtn.addEventListener('click', function() {
          var n = Math.max(1, Math.floor(Number(numBatchesInput.value) || 1));
          // Ensure project.batches has exactly n entries, initialized empty (size 0)
          var prev = Array.isArray(project.batches) ? project.batches : [];
          project.batches = Array.from({ length: n }, function(_, i) {
            return {
              size: '', // start empty for all batches, including Batch 01
              minted: !!(prev[i] && prev[i].minted)
            };
          });
          // Reset selection as batch indexes changed
          project.selectedBatches = [];
          renderBatchInputs(n);
        });
      }
      // Initial render if batches already exist (only if batchesList exists)
      if (batchesList && project.batches && project.batches.length > 1) {
        renderBatchInputs(project.batches.length);
      }
      // If total supply changes, revalidate
      if (totalSupplyInput) {
        totalSupplyInput.addEventListener('input', function() {
          // Get raw value without commas for calculations
          var rawValue = this.value.replace(/,/g, '');
          totalSupply = Number(rawValue) || 0;
          // Optionally, re-render batch inputs if visible
          if (batchInputs.length > 0) {
            renderBatchInputs(batchInputs.length);
          }
        });
      }
    })();

    // Add a line of space below the text 'How many batches do you want to have in your collection?' label for better visual separation
    var numBatchesLabel = document.querySelector('label[for="num-batches-input"]');
    if (numBatchesLabel) {
      numBatchesLabel.style.display = 'block';
      numBatchesLabel.style.marginBottom = '12px';
    }

    // Set padding for batch management section
    var batchManagementSection = document.getElementById('batch-management-section');
    if (batchManagementSection) {
      batchManagementSection.style.paddingLeft = '24px';
      batchManagementSection.style.paddingRight = '24px';
    }

    // Update the help text for batch count
    var batchHelp = document.querySelector('#batch-management-section .form-help');
    if (batchHelp) {
      batchHelp.textContent = 'You will only need one Batch in case you are deploying the entire collection at once. If you want to deploy your collection divided in batches, please select the corresponding number of batches and press Apply.';
      // Add two lines of space below
      batchHelp.style.marginBottom = '32px';
    }

  },

  // Update navigation tab states based on whether traits exist
  updateNavigationTabStates: function(projectData) {
    const generateTab = document.querySelector('.nav-tab[data-tab="generate-nfts"]');
    const exportTab = document.querySelector('.nav-tab[data-tab="export-nfts"]');
    
    if (!generateTab || !exportTab) {
      console.warn('Navigation tabs not found');
      return;
    }

    // Always enable both tabs - no conditions required
      generateTab.classList.remove('disabled');
      exportTab.classList.remove('disabled');
      
      // Ensure both tabs have the tooltip class
      if (!generateTab.classList.contains('tooltip')) {
        generateTab.classList.add('tooltip');
      }
      if (!exportTab.classList.contains('tooltip')) {
        exportTab.classList.add('tooltip');
      }
      
      // Update tooltips to normal state
      let generateTooltip = generateTab.querySelector('.tooltiptext');
      let exportTooltip = exportTab.querySelector('.tooltiptext');
      
      // Create tooltip if it doesn't exist
      if (!generateTooltip) {
        generateTooltip = document.createElement('span');
        generateTooltip.className = 'tooltiptext';
        generateTab.appendChild(generateTooltip);
      }
      if (!exportTooltip) {
        exportTooltip = document.createElement('span');
        exportTooltip.className = 'tooltiptext';
        exportTab.appendChild(exportTooltip);
      }
      
      if (generateTooltip) {
        generateTooltip.innerHTML = 'Create NFT images and<br>manage your collection';
      }
      if (exportTooltip) {
        exportTooltip.textContent = 'Export your collection';
      }
      
      // Setup tooltips using navigation module
      const navigationModule = window.NFTApp?.getModule('navigation');
      if (navigationModule && navigationModule.setupNavTabTooltip) {
        navigationModule.setupNavTabTooltip(generateTab, generateTooltip);
        navigationModule.setupNavTabTooltip(exportTab, exportTooltip);
      }
      
    // Force enable both tabs
      generateTab.style.pointerEvents = 'auto';
      generateTab.style.opacity = '1';
      generateTab.style.setProperty('cursor', 'pointer', 'important'); // Pointer cursor for consistency
    exportTab.style.pointerEvents = 'auto';
    exportTab.style.opacity = '1';
    exportTab.style.setProperty('cursor', 'pointer', 'important'); // Pointer cursor for consistency
  },

  // Check if project has at least 2 trait layers with at least one trait each
  checkValidTraitLayers: function(projectData) {
    // Use the existing validation function from combination-rules module
    const combinationRulesModule = window.NFTApp.getModule('combinationRules');
    if (combinationRulesModule && combinationRulesModule.validateTraitLayers) {
      return combinationRulesModule.validateTraitLayers(projectData);
    }
    
    // Fallback validation if combination-rules module is not available
    if (!projectData || !projectData.traits || !Array.isArray(projectData.traits)) {
      return false;
    }

    // Count layers that have at least one trait
    const validLayers = projectData.traits.filter(layer => {
      return layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0;
    });

    // Need at least 2 layers with traits
    return validLayers.length >= 2;
  },
})
