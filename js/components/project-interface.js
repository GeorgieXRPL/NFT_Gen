// Project Interface Module
window.NFTApp.registerModule("projectInterface", {
  // Start the project interface
  start: (projectData) => {
    console.log("Starting project interface for:", projectData.name)
    
    // CRITICAL: Get appContainer first to check for duplicate calls
    const appContainer = document.getElementById("app")
    
    // CRITICAL: Prevent multiple simultaneous calls to start()
    // If an interface swap is already in progress, wait for it to complete
    if (appContainer && appContainer.dataset.swappingInterface === 'true') {
      const currentInterfaceId = appContainer.dataset.currentInterfaceId;
      if (currentInterfaceId) {
        const existingInterface = appContainer.querySelector(`[data-interface-id="${currentInterfaceId}"]`);
        if (existingInterface) {
          console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Interface swap already in progress, skipping duplicate start() call');
          return; // Exit early - interface is already being created
        }
      }
    }

    // Helper function to update loading progress with optional message
    const updateProgress = (percentage, message = null) => {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
        const projectService = window.NFTApp.getModule("projectService");
        if (projectService && typeof projectService.updateLoadingProgress === 'function') {
          projectService.updateLoadingProgress(percentage, message);
        }
      }
    };

    // CRITICAL: Start smooth progress animation from 0% to 60% with "Finalizing setup..." message
    // Then update progress based on actual operations to avoid staying at 95% for too long
    setTimeout(() => {
      updateProgress(0, "Finalizing setup...");
      
      // Animate progress bar smoothly from 0% to 60% over 1.2 seconds (slower, more gradual)
      const startTime = Date.now();
      const duration = 1200; // 1.2 seconds for smooth animation
      const startPercentage = 0;
      const endPercentage = 60; // Only animate to 60%, rest will be updated by actual operations
      
      const animateProgress = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1); // Clamp between 0 and 1
        
        // Use easing function for smooth animation (ease-out)
        const easedProgress = 1 - Math.pow(1 - progress, 3); // Cubic ease-out
        
        const currentPercentage = startPercentage + (endPercentage - startPercentage) * easedProgress;
        updateProgress(currentPercentage, "Finalizing setup...");
        
        if (progress < 1) {
          requestAnimationFrame(animateProgress);
        } else {
          // Ensure we end at exactly 60%
          updateProgress(60, "Finalizing setup...");
        }
      };
      
      requestAnimationFrame(animateProgress);
    }, 50);
    
    // CRITICAL: Ensure app container, body, and html are visible before creating interface
    // This prevents black screen flash during project loading
    if (appContainer) {
      appContainer.style.setProperty("display", "block", "important");
      appContainer.style.setProperty("visibility", "visible", "important");
      appContainer.style.setProperty("opacity", "1", "important");
      appContainer.style.setProperty("background-color", "#0c0c0e", "important");
    }
    
    // CRITICAL: Also ensure body and html backgrounds are set to prevent black screen
    const body = document.body;
    const html = document.documentElement;
    if (body) {
      body.style.setProperty("background-color", "#000000", "important");
      body.style.setProperty("background", "#000000", "important");
    }
    if (html) {
      html.style.setProperty("background-color", "#000000", "important");
      html.style.setProperty("background", "#000000", "important");
    }

    // Create the navigation and content structure
    let appInterface = document.createElement("div")
    appInterface.className = "project-interface"
    
    // CRITICAL: Ensure new interface is visible immediately with dark background
    appInterface.style.setProperty("display", "block", "important");
    appInterface.style.setProperty("visibility", "visible", "important");
    appInterface.style.setProperty("opacity", "1", "important");
    appInterface.style.setProperty("background", "#0c0c0e", "important");
    appInterface.style.setProperty("background-color", "#0c0c0e", "important");
    appInterface.style.setProperty("transition", "none", "important");

    // CRITICAL: Set innerHTML and immediately enforce visibility on all children
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
            <div class="nav-tab active" data-tab="general-info">
              <span class="tab-label">Collection Info</span>
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
                <div class="form-help">This description will be used for all NFTs unless overridden individually.<br>If this field is empty, the NFTs will use the 'Collection Description' as default.</div>
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
                <button id="delete-all-layers" class="app-action-btn app-action-btn--danger tooltip" style="display: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  Delete All Layers
                  <span class="tooltiptext">Remove all trait layers</span>
                </button>
              </div>
              <div class="trait-layers-actions-right">
                <button id="jump-to-rules-btn" class="jump-to-rules-btn tooltip" style="display: none;">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                  Jump to Rules
                  <span class="tooltiptext">Quickly scroll down to the<br>Combination Rules section</span>
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
            
            <div class="combination-rules-actions">
              <div class="combination-rules-actions-left">
                <!-- Combination Rules Search Filter -->
                <div id="combination-rules-filter-container" class="combination-rules-filter-container" style="display: none;">
                  <div class="rules-filter-dropdown-wrapper tooltip">
                    <select id="rules-filter-dropdown" class="rules-filter-dropdown custom-dropdown-convert" title="">
                      <option value="" selected>All Rule Types</option>
                      <option value="never-combine" data-rule-type="never-combine" class="never-combine-option">Never Combine</option>
                      <option value="always-combine" data-rule-type="always-combine" class="always-combine-option">Always Combine</option>
                      <option value="always-above" data-rule-type="always-above" class="always-above-option">Always Above</option>
                      <option value="always-below" data-rule-type="always-below" class="always-below-option">Always Below</option>
                      <option value="immediately-above" data-rule-type="immediately-above" class="immediately-above-option">Immediately Above</option>
                      <option value="immediately-below" data-rule-type="immediately-below" class="immediately-below-option">Immediately Below</option>
                    </select>
                    <span class="tooltiptext">Filter Rules by type.<br>Only available when you have 5+ rules.</span>
                  </div>
                  
                  <button id="clear-rules-filter-btn" class="clear-filter-btn tooltip">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                      <line x1="18" y1="6" x2="6" y2="18"></line>
                      <line x1="6" y1="6" x2="18" y2="18"></line>
                    </svg>
                    Clear Filter
                    <span class="tooltiptext">Clear filter and show all rules</span>
                  </button>
                </div>
              </div>
              
              <div class="combination-rules-actions-right">
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
                
                <!-- Jump to Layers Button - Moved to right of check-rule-conflicts -->
                <div class="jump-to-layers-container">
                  <button id="jump-to-layers-btn" class="jump-to-layers-btn tooltip">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                      <polyline points="18 15 12 9 6 15"></polyline>
                    </svg>
                    Jump to Layers
                    <span class="tooltiptext">Quickly scroll up to the<br>Trait Layers section</span>
                  </button>
                </div>
                </div>
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
                <span class="tooltiptext">Quickly scroll up to the<br>Trait Layers section</span>
              </button>
              <button id="jump-to-rules-bottom-btn" class="jump-to-rules-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
                Jump to Rules
                <span class="tooltiptext">Quickly scroll up to the<br>Combination Rules section</span>
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

    // CRITICAL: Immediately after setting innerHTML, force visibility on all child elements
    // This prevents flicker by ensuring content is visible as soon as it's parsed
    requestAnimationFrame(() => {
      const navContainer = appInterface.querySelector('.nav-container');
      const contentArea = appInterface.querySelector('.content-area');
      if (navContainer) {
        navContainer.style.setProperty("display", "block", "important");
        navContainer.style.setProperty("visibility", "visible", "important");
        navContainer.style.setProperty("opacity", "1", "important");
      }
      if (contentArea) {
        contentArea.style.setProperty("display", "block", "important");
        contentArea.style.setProperty("visibility", "visible", "important");
        contentArea.style.setProperty("opacity", "1", "important");
      }
      // Force a reflow to ensure styles are applied
      if (navContainer) void navContainer.offsetHeight;
      if (contentArea) void contentArea.offsetHeight;
    });

    // Remove the Export NFTs nav tab and its content section
    // export-nfts tab is now handled by export-nfts-module.js

    // CRITICAL: Clean up ALL duplicate dropdowns BEFORE clearing and inserting new interface
    if (typeof window.cleanupDuplicateDropdowns === 'function') {
      window.cleanupDuplicateDropdowns();
    }
    
    // CRITICAL: Remove ALL existing instances of the dropdown before creating new interface
    const existingDropdowns = document.querySelectorAll('#rules-filter-dropdown');
    if (existingDropdowns.length > 0) {
      console.log('[CLEANUP] Removing', existingDropdowns.length, 'existing rules-filter-dropdown elements before creating new interface');
      existingDropdowns.forEach(dropdown => {
        const container = dropdown.closest('.combination-rules-filter-container');
        if (container) {
          container.remove();
        } else {
          dropdown.remove();
        }
      });
    }
    
    // CRITICAL: Remove ALL existing custom dropdown containers for rules-filter-dropdown
    const existingCustomDropdowns = document.querySelectorAll('.custom-dropdown');
    existingCustomDropdowns.forEach(customDropdown => {
      const dataFor = customDropdown.querySelector('[data-for="rules-filter-dropdown"]');
      if (dataFor) {
        console.log('[CLEANUP] Removing existing custom dropdown container before creating new interface');
        customDropdown.remove();
      }
    });

    // CRITICAL: Prevent flicker during interface swap by using atomic replacement
    // Ensure container stays visible and has background during swap
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] ========================================');
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] Starting atomic swap in project-interface.js');
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - appContainer exists:', !!appContainer);
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - appInterface exists:', !!appInterface);
    
    if (appContainer) {
      const beforeSwapDisplay = window.getComputedStyle(appContainer).display;
      const beforeSwapVisibility = window.getComputedStyle(appContainer).visibility;
      const beforeSwapOpacity = window.getComputedStyle(appContainer).opacity;
      const beforeSwapChildren = appContainer.children.length;
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - appContainer BEFORE swap:');
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - display:', beforeSwapDisplay);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - visibility:', beforeSwapVisibility);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - opacity:', beforeSwapOpacity);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - children count:', beforeSwapChildren);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - swappingInterface flag:', appContainer.dataset.swappingInterface);
    }
    
    // CRITICAL: Ensure container is visible BEFORE any operations
    appContainer.style.setProperty("display", "block", "important");
    appContainer.style.setProperty("visibility", "visible", "important");
    appContainer.style.setProperty("opacity", "1", "important");
    appContainer.style.setProperty("background-color", "#0c0c0e", "important");
    appContainer.style.setProperty("background", "#0c0c0e", "important");
    
    // CRITICAL: Create placeholder if it doesn't exist (for new projects)
    // This prevents black screen during interface creation
    let placeholderCheck = document.body.querySelector('#interface-placeholder');
    if (!placeholderCheck) {
      placeholderCheck = document.createElement("div");
      placeholderCheck.id = "interface-placeholder";
      // CRITICAL: Use inline styles with !important to ensure visibility
      placeholderCheck.style.cssText = "display: block !important; visibility: visible !important; opacity: 1 !important; background-color: #0c0c0e !important; background: #0c0c0e !important; width: 100vw !important; height: 100vh !important; position: fixed !important; top: 0 !important; left: 0 !important; right: 0 !important; bottom: 0 !important; z-index: 99998 !important; pointer-events: none !important; margin: 0 !important; padding: 0 !important;";
      document.body.appendChild(placeholderCheck);
      // CRITICAL: Force immediate reflow to ensure placeholder is painted
      void placeholderCheck.offsetHeight;
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Created placeholder div for new project');
    } else {
      // CRITICAL: Ensure existing placeholder is visible
      placeholderCheck.style.setProperty("display", "block", "important");
      placeholderCheck.style.setProperty("visibility", "visible", "important");
      placeholderCheck.style.setProperty("opacity", "1", "important");
      placeholderCheck.style.setProperty("z-index", "99998", "important");
      void placeholderCheck.offsetHeight;
    }
    
    // CRITICAL: Set flag to prevent visibility updates during interface swap
    appContainer.dataset.swappingInterface = 'true';
    
    // CRITICAL: Mark this interface with a unique ID to prevent it from being removed
    const interfaceId = 'interface-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    appInterface.dataset.interfaceId = interfaceId;
    appContainer.dataset.currentInterfaceId = interfaceId;
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Set swappingInterface flag to true, interfaceId:', interfaceId);
    
    // CRITICAL: Remove old interfaces SYNCHRONOUSLY before appending new one
    // This prevents race conditions from multiple start() calls
    // IMPORTANT: Only remove interfaces that are already in the DOM and don't have the current interfaceId
    const currentInterfaceId = appContainer.dataset.currentInterfaceId;
    const existingInterfaces = Array.from(appContainer.children).filter(child => {
      if (!child.classList || !child.classList.contains('project-interface')) return false;
      // Don't remove if it's the new interface we're about to append
      if (child === appInterface) return false;
      // Don't remove if it has the current interfaceId (it's the current one)
      if (child.dataset.interfaceId === currentInterfaceId) return false;
      return true;
    });
    if (existingInterfaces.length > 0) {
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Removing', existingInterfaces.length, 'existing interfaces synchronously...');
      existingInterfaces.forEach(iface => {
        iface.remove();
      });
    }
    
    // CRITICAL: Ensure new interface is visible BEFORE appending to prevent flicker
    // Also disable transitions during swap to prevent any CSS animation flicker
    // Set these styles MULTIPLE times to ensure they stick
    appInterface.style.setProperty("display", "block", "important");
    appInterface.style.setProperty("visibility", "visible", "important");
    appInterface.style.setProperty("opacity", "1", "important");
    appInterface.style.setProperty("transition", "none", "important");
    appInterface.style.setProperty("background", "#0c0c0e", "important");
    appInterface.style.setProperty("background-color", "#0c0c0e", "important");
    
    // CRITICAL: Ensure child elements are visible BEFORE append (they exist because innerHTML was set)
    const navContainer = appInterface.querySelector('.nav-container');
    const contentArea = appInterface.querySelector('.content-area');
    if (navContainer) {
      navContainer.style.setProperty("display", "block", "important");
      navContainer.style.setProperty("visibility", "visible", "important");
      navContainer.style.setProperty("opacity", "1", "important");
    }
    if (contentArea) {
      contentArea.style.setProperty("display", "block", "important");
      contentArea.style.setProperty("visibility", "visible", "important");
      contentArea.style.setProperty("opacity", "1", "important");
    }
    
    // CRITICAL: Disable transitions on appContainer during swap to prevent flicker
    const originalAppContainerTransition = window.getComputedStyle(appContainer).transition;
    appContainer.style.setProperty("transition", "none", "important");
    
    // CRITICAL: Append new interface FIRST (don't remove placeholder yet)
    // The placeholder will be removed after the interface is confirmed visible
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Appending new interface...');
    appContainer.appendChild(appInterface);
    
    // CRITICAL: Keep placeholder visible until interface is confirmed visible
    // This prevents black screen during the gap
    // Check both appContainer and body since placeholder might be in either location
    let placeholder = appContainer.querySelector('#interface-placeholder');
    if (!placeholder) {
      placeholder = document.body.querySelector('#interface-placeholder');
    }
    if (placeholder) {
      // CRITICAL: Ensure placeholder stays visible and covers entire screen
      // Keep it at high z-index (below loading overlay 99999, but above interface)
      placeholder.style.setProperty("display", "block", "important");
      placeholder.style.setProperty("visibility", "visible", "important");
      placeholder.style.setProperty("opacity", "1", "important");
      placeholder.style.setProperty("z-index", "99998", "important");
      placeholder.style.setProperty("width", "100vw", "important");
      placeholder.style.setProperty("height", "100vh", "important");
      placeholder.style.setProperty("position", "fixed", "important");
      placeholder.style.setProperty("top", "0", "important");
      placeholder.style.setProperty("left", "0", "important");
      placeholder.style.setProperty("right", "0", "important");
      placeholder.style.setProperty("bottom", "0", "important");
      placeholder.style.setProperty("background-color", "#0c0c0e", "important");
      placeholder.style.setProperty("background", "#0c0c0e", "important");
      void placeholder.offsetHeight; // Force reflow
    }
    
    // CRITICAL: Force immediate reflow after append to ensure browser paints the content
    void appContainer.offsetHeight;
    void appInterface.offsetHeight;
    const afterAppendChildren = appContainer.children.length;
    console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - After append, children count:', afterAppendChildren);
    
    // CRITICAL: Force immediate visibility - set styles synchronously after append
    // This ensures the interface is visible immediately, not waiting for rAF
    // Set these styles MULTIPLE times to ensure they stick
    appInterface.style.setProperty("display", "block", "important");
    appInterface.style.setProperty("visibility", "visible", "important");
    appInterface.style.setProperty("opacity", "1", "important");
    appInterface.style.setProperty("background", "#0c0c0e", "important");
    appInterface.style.setProperty("background-color", "#0c0c0e", "important");
    
    appContainer.style.setProperty("display", "block", "important");
    appContainer.style.setProperty("visibility", "visible", "important");
    appContainer.style.setProperty("opacity", "1", "important");
    appContainer.style.setProperty("background-color", "#0c0c0e", "important");
    appContainer.style.setProperty("background", "#0c0c0e", "important");
    
    // CRITICAL: Force a synchronous reflow to ensure styles are applied
    void appContainer.offsetHeight;
    void appInterface.offsetHeight;
    
    // CRITICAL: Set styles again after reflow to ensure they're applied
    appInterface.style.setProperty("display", "block", "important");
    appInterface.style.setProperty("visibility", "visible", "important");
    appInterface.style.setProperty("opacity", "1", "important");
    appContainer.style.setProperty("display", "block", "important");
    appContainer.style.setProperty("visibility", "visible", "important");
    appContainer.style.setProperty("opacity", "1", "important");
    
    // CRITICAL: Set styles again after reflow to ensure they stick
    appInterface.style.setProperty("display", "block", "important");
    appInterface.style.setProperty("visibility", "visible", "important");
    appInterface.style.setProperty("opacity", "1", "important");
    appContainer.style.setProperty("display", "block", "important");
    appContainer.style.setProperty("visibility", "visible", "important");
    appContainer.style.setProperty("opacity", "1", "important");
    
    // CRITICAL: Ensure child elements are still visible after reflow
    if (navContainer) {
      navContainer.style.setProperty("display", "block", "important");
      navContainer.style.setProperty("visibility", "visible", "important");
      navContainer.style.setProperty("opacity", "1", "important");
    }
    if (contentArea) {
      contentArea.style.setProperty("display", "block", "important");
      contentArea.style.setProperty("visibility", "visible", "important");
      contentArea.style.setProperty("opacity", "1", "important");
    }
    
    const activeTabContent = appInterface.querySelector('.tab-content.active');
    if (activeTabContent) {
      activeTabContent.style.setProperty("display", "block", "important");
      activeTabContent.style.setProperty("visibility", "visible", "important");
      activeTabContent.style.setProperty("opacity", "1", "important");
    }
    
    // CRITICAL: Force another reflow after setting all child visibility
    void appContainer.offsetHeight;
    void appInterface.offsetHeight;
    if (navContainer) void navContainer.offsetHeight;
    if (contentArea) void contentArea.offsetHeight;
    if (activeTabContent) void activeTabContent.offsetHeight;
    
    // CRITICAL: Use MutationObserver to ensure interface is fully rendered before proceeding
    // This prevents flicker by waiting for the browser to actually paint the content
    const observer = new MutationObserver((mutations, obs) => {
      // Check if interface has children (content is rendered)
      if (appInterface.children.length > 0) {
        // Force visibility one more time after content is rendered
        appInterface.style.setProperty("display", "block", "important");
        appInterface.style.setProperty("visibility", "visible", "important");
        appInterface.style.setProperty("opacity", "1", "important");
        appContainer.style.setProperty("display", "block", "important");
        appContainer.style.setProperty("visibility", "visible", "important");
        appContainer.style.setProperty("opacity", "1", "important");
        
        // Force reflow after content is rendered
        void appContainer.offsetHeight;
        void appInterface.offsetHeight;
        
        // Disconnect observer once content is confirmed rendered
        obs.disconnect();
      }
    });
    
    // Start observing the interface for child additions
    observer.observe(appInterface, { childList: true, subtree: true });
    
    // CRITICAL: Remove any remaining old children (in case there are any)
    // Use requestAnimationFrame to ensure this happens after the browser has painted
      requestAnimationFrame(() => {
      // CRITICAL: Get the current interface ID to ensure we're working with the right interface
      const currentInterfaceId = appContainer.dataset.currentInterfaceId;
      
      // CRITICAL: First, ensure the new interface is still in the container and visible
      // Check by both reference and ID to handle cases where start() was called multiple times
      const interfaceStillInContainer = appContainer.contains(appInterface) && 
                                        appInterface.dataset.interfaceId === currentInterfaceId;
      
      if (!interfaceStillInContainer) {
        // Try to find the interface by ID first
        const interfaceById = appContainer.querySelector(`[data-interface-id="${currentInterfaceId}"]`);
        if (interfaceById) {
          // Found interface by ID - this means start() was called multiple times
          // Silently update the reference (no warning needed - this is expected behavior)
          appInterface = interfaceById;
        } else {
          console.warn('[DEBUG 78% FLICKER - ATOMIC SWAP] - WARNING: appInterface was removed! Re-appending...');
          appInterface.dataset.interfaceId = currentInterfaceId; // Ensure ID is set
          appContainer.appendChild(appInterface);
        }
        appInterface.style.setProperty("display", "block", "important");
        appInterface.style.setProperty("visibility", "visible", "important");
        appInterface.style.setProperty("opacity", "1", "important");
      }
      
      const childrenToRemove = Array.from(appContainer.children).filter(child => {
        if (!child.classList || !child.classList.contains('project-interface')) return false;
        // Don't remove if it has the current interfaceId
        if (child.dataset.interfaceId === currentInterfaceId) return false;
        // Don't remove if it's the appInterface reference (double check)
        if (child === appInterface) return false;
        return true;
      });
      if (childrenToRemove.length > 0) {
        console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Removing', childrenToRemove.length, 'remaining old children...');
        childrenToRemove.forEach(child => child.remove());
      }
      
      // CRITICAL: Ensure new interface is still visible after cleanup
      // Set these styles MULTIPLE times to ensure they stick
      appInterface.style.setProperty("display", "block", "important");
      appInterface.style.setProperty("visibility", "visible", "important");
      appInterface.style.setProperty("opacity", "1", "important");
      appInterface.style.setProperty("background", "#0c0c0e", "important");
      appInterface.style.setProperty("background-color", "#0c0c0e", "important");
      
      appContainer.style.setProperty("display", "block", "important");
      appContainer.style.setProperty("visibility", "visible", "important");
      appContainer.style.setProperty("opacity", "1", "important");
      appContainer.style.setProperty("background-color", "#0c0c0e", "important");
      appContainer.style.setProperty("background", "#0c0c0e", "important");
      
      // CRITICAL: Verify the interface is still in the DOM
      if (!appContainer.contains(appInterface)) {
        console.error('[DEBUG 78% FLICKER - ATOMIC SWAP] - ERROR: appInterface was removed after cleanup! Re-appending...');
        appContainer.appendChild(appInterface);
        appInterface.style.setProperty("display", "block", "important");
        appInterface.style.setProperty("visibility", "visible", "important");
        appInterface.style.setProperty("opacity", "1", "important");
      }
      
      // CRITICAL: Re-enable transitions after swap completes
      requestAnimationFrame(() => {
        // Restore original transition if it existed, otherwise remove the inline style
        if (originalAppContainerTransition) {
          appContainer.style.transition = originalAppContainerTransition;
        } else {
          appContainer.style.removeProperty("transition");
        }
        appInterface.style.removeProperty("transition");
        
        // Clear flag after swap completes
        console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Clearing swappingInterface flag in rAF');
        delete appContainer.dataset.swappingInterface;
        // Keep currentInterfaceId so we can still identify the current interface
        console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - swappingInterface flag cleared:', appContainer.dataset.swappingInterface);
        console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] ========================================');
        
        // CRITICAL: Final safeguard - ensure interface is still visible after all operations
        const currentInterfaceId = appContainer.dataset.currentInterfaceId;
        const interfaceById = appContainer.querySelector(`[data-interface-id="${currentInterfaceId}"]`);
        if (!interfaceById) {
          console.error('[DEBUG 78% FLICKER - ATOMIC SWAP] - CRITICAL ERROR: appInterface was removed! Re-appending...');
          appInterface.dataset.interfaceId = currentInterfaceId; // Ensure ID is set
          appContainer.appendChild(appInterface);
        } else if (interfaceById !== appInterface) {
          // Update reference if we found a different instance
          appInterface = interfaceById;
        }
        appInterface.style.setProperty("display", "block", "important");
        appInterface.style.setProperty("visibility", "visible", "important");
        appInterface.style.setProperty("opacity", "1", "important");
        appContainer.style.setProperty("display", "block", "important");
        appContainer.style.setProperty("visibility", "visible", "important");
        appContainer.style.setProperty("opacity", "1", "important");
        
        // CRITICAL: Remove placeholder only AFTER interface is confirmed visible AND painted AND loading overlay is hidden
        // This prevents black screen during the transition
        // Use MutationObserver to watch for loading overlay being hidden
        const removePlaceholderWhenReady = () => {
          const getPlaceholder = () => {
            let placeholder = appContainer.querySelector('#interface-placeholder');
            if (!placeholder) {
              placeholder = document.body.querySelector('#interface-placeholder');
            }
            return placeholder;
          };
          
          const checkAndRemove = () => {
            const placeholder = getPlaceholder();
            if (!placeholder) return false; // No placeholder to remove
            
            // Double-check that interface is actually visible before removing placeholder
            const interfaceVisible = appInterface && 
                                    window.getComputedStyle(appInterface).display !== 'none' &&
                                    window.getComputedStyle(appInterface).visibility !== 'hidden' &&
                                    window.getComputedStyle(appInterface).opacity !== '0';
            const containerVisible = appContainer && 
                                     window.getComputedStyle(appContainer).display !== 'none' &&
                                     window.getComputedStyle(appContainer).visibility !== 'hidden' &&
                                     window.getComputedStyle(appContainer).opacity !== '0';
            
            // CRITICAL: Also check if interface has content (children) to ensure it's rendered
            const interfaceHasContent = appInterface && appInterface.children.length > 0;
            
            // CRITICAL: Check if interface has actual dimensions (is painted)
            const interfaceRect = appInterface ? appInterface.getBoundingClientRect() : null;
            const interfaceHasSize = interfaceRect && interfaceRect.width > 0 && interfaceRect.height > 0;
            
            // CRITICAL: Check if loading overlay is still visible - if so, keep placeholder
            const loadingOverlay = document.getElementById('loading-overlay');
            let overlayStillVisible = false;
            if (loadingOverlay) {
              const overlayStyle = window.getComputedStyle(loadingOverlay);
              overlayStillVisible = overlayStyle.display !== 'none' && 
                                   overlayStyle.visibility !== 'hidden' && 
                                   overlayStyle.opacity !== '0';
            }
            
            // Only remove if interface is visible, has content, has size, AND overlay is hidden
            if (interfaceVisible && containerVisible && interfaceHasContent && interfaceHasSize && !overlayStillVisible) {
              placeholder.remove();
              console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - Removed placeholder div after interface confirmed visible and painted and overlay hidden');
              return true;
            }
            return false;
          };
          
          // First, try to remove immediately (in case overlay is already hidden)
          if (checkAndRemove()) return;
          
          // If overlay is still visible, watch for it to be hidden
          const loadingOverlay = document.getElementById('loading-overlay');
          if (loadingOverlay) {
            const overlayStyle = window.getComputedStyle(loadingOverlay);
            const overlayStillVisible = overlayStyle.display !== 'none' && 
                                       overlayStyle.visibility !== 'hidden' && 
                                       overlayStyle.opacity !== '0';
            
            if (overlayStillVisible) {
              // Watch for overlay to be hidden using MutationObserver
              const overlayObserver = new MutationObserver((mutations) => {
                const currentOverlay = document.getElementById('loading-overlay');
                if (currentOverlay) {
                  const currentStyle = window.getComputedStyle(currentOverlay);
                  const isNowHidden = currentStyle.display === 'none' || 
                                     currentStyle.visibility === 'hidden' || 
                                     currentStyle.opacity === '0';
                  
                  if (isNowHidden) {
                    // Overlay is now hidden, try to remove placeholder
                    overlayObserver.disconnect();
                    // Wait a bit for interface to be fully painted
                    setTimeout(() => {
                      if (!checkAndRemove()) {
                        // If still not ready, retry a few times
                        let retries = 0;
                        const retryInterval = setInterval(() => {
                          retries++;
                          if (checkAndRemove() || retries >= 10) {
                            clearInterval(retryInterval);
                          }
                        }, 200);
                      }
                    }, 300);
                  }
                } else {
                  // Overlay was removed from DOM, try to remove placeholder
                  overlayObserver.disconnect();
                  setTimeout(() => {
                    if (!checkAndRemove()) {
                      let retries = 0;
                      const retryInterval = setInterval(() => {
                        retries++;
                        if (checkAndRemove() || retries >= 10) {
                          clearInterval(retryInterval);
                        }
                      }, 200);
                    }
                  }, 300);
                }
              });
              
              // Observe overlay for style changes
              overlayObserver.observe(loadingOverlay, {
                attributes: true,
                attributeFilter: ['style', 'class'],
                childList: false,
                subtree: false
              });
              
              // Also observe for removal from DOM
              const parentObserver = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.removedNodes.forEach((node) => {
                    if (node === loadingOverlay || (node.nodeType === 1 && node.id === 'loading-overlay')) {
                      parentObserver.disconnect();
                      overlayObserver.disconnect();
                      setTimeout(() => {
                        if (!checkAndRemove()) {
                          let retries = 0;
                          const retryInterval = setInterval(() => {
                            retries++;
                            if (checkAndRemove() || retries >= 10) {
                              clearInterval(retryInterval);
                            }
                          }, 200);
                        }
                      }, 300);
                    }
                  });
                });
              });
              
              if (loadingOverlay.parentNode) {
                parentObserver.observe(loadingOverlay.parentNode, {
                  childList: true,
                  subtree: false
                });
              }
              
              // Fallback: Also try periodically in case observer doesn't fire
              let fallbackAttempts = 0;
              const fallbackInterval = setInterval(() => {
                fallbackAttempts++;
                if (checkAndRemove() || fallbackAttempts >= 50) { // 10 seconds max
                  clearInterval(fallbackInterval);
                  overlayObserver.disconnect();
                  parentObserver.disconnect();
                }
              }, 200);
            } else {
              // Overlay is already hidden, try to remove placeholder
              setTimeout(() => {
                if (!checkAndRemove()) {
                  let retries = 0;
                  const retryInterval = setInterval(() => {
                    retries++;
                    if (checkAndRemove() || retries >= 10) {
                      clearInterval(retryInterval);
                    }
                  }, 200);
                }
              }, 300);
            }
          } else {
            // No overlay found, try to remove placeholder
            setTimeout(() => {
              if (!checkAndRemove()) {
                let retries = 0;
                const retryInterval = setInterval(() => {
                  retries++;
                  if (checkAndRemove() || retries >= 10) {
                    clearInterval(retryInterval);
                  }
                }, 200);
              }
            }, 300);
          }
        };
        
        // Start the removal process after a short delay to ensure interface is in DOM
        setTimeout(() => {
          removePlaceholderWhenReady();
        }, 500);
      });
    });
    
    // CRITICAL: Additional safeguard - use setTimeout to ensure interface is visible after a short delay
    // This catches any edge cases where the interface might be hidden by other code
    setTimeout(() => {
      if (appContainer) {
        const currentInterfaceId = appContainer.dataset.currentInterfaceId;
        if (currentInterfaceId) {
          const interfaceById = appContainer.querySelector(`[data-interface-id="${currentInterfaceId}"]`);
          if (!interfaceById) {
            console.error('[DEBUG 78% FLICKER - ATOMIC SWAP] - CRITICAL ERROR (setTimeout): appInterface was removed! Re-appending...');
            if (appInterface) {
              appInterface.dataset.interfaceId = currentInterfaceId; // Ensure ID is set
              appContainer.appendChild(appInterface);
            }
          } else {
            // Update reference to the found interface
            appInterface = interfaceById;
          }
        }
        if (appInterface) {
          appInterface.style.setProperty("display", "block", "important");
          appInterface.style.setProperty("visibility", "visible", "important");
          appInterface.style.setProperty("opacity", "1", "important");
        }
        appContainer.style.setProperty("display", "block", "important");
        appContainer.style.setProperty("visibility", "visible", "important");
        appContainer.style.setProperty("opacity", "1", "important");
      }
    }, 100);
    
    if (appContainer) {
      const afterSwapDisplay = window.getComputedStyle(appContainer).display;
      const afterSwapVisibility = window.getComputedStyle(appContainer).visibility;
      const afterSwapOpacity = window.getComputedStyle(appContainer).opacity;
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP] - appContainer AFTER swap:');
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - display:', afterSwapDisplay);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - visibility:', afterSwapVisibility);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - opacity:', afterSwapOpacity);
      console.log('[DEBUG 78% FLICKER - ATOMIC SWAP]   - swappingInterface flag:', appContainer.dataset.swappingInterface);
    }
    
    // CRITICAL: Run cleanup IMMEDIATELY after interface is inserted to catch any duplicates
    setTimeout(() => {
      if (typeof window.cleanupDuplicateDropdowns === 'function') {
        window.cleanupDuplicateDropdowns();
      }
      // Also reset the setup flag so setupRulesFilter can run again
      window._rulesFilterSetupComplete = false;
    }, 0);

    // CRITICAL: Ensure at least one tab is active IMMEDIATELY (default to Collection Info)
    // This must happen synchronously to prevent content from disappearing
    const navTabs = document.querySelectorAll('.nav-tab');
    const tabContents = document.querySelectorAll('.tab-content');
    let hasActiveTab = false;
    navTabs.forEach(tab => { if (tab.classList.contains('active')) hasActiveTab = true; });
    
    // If no tab is active, activate the Collection Info tab IMMEDIATELY
    if (!hasActiveTab) {
      const generalInfoTab = Array.from(navTabs).find(tab => tab.getAttribute('data-tab') === 'general-info');
      const generalInfoContent = document.getElementById('general-info');
      
      if (generalInfoTab && generalInfoContent) {
        navTabs.forEach(tab => tab.classList.remove('active'));
        tabContents.forEach(tc => tc.classList.remove('active'));
        generalInfoTab.classList.add('active');
        generalInfoContent.classList.add('active');
        
        // CRITICAL: Force visibility immediately to prevent disappearing
        generalInfoContent.style.setProperty("display", "block", "important");
        generalInfoContent.style.setProperty("visibility", "visible", "important");
        generalInfoContent.style.setProperty("opacity", "1", "important");
        generalInfoContent.style.setProperty("position", "relative", "important");
        generalInfoContent.style.setProperty("height", "auto", "important");
        generalInfoContent.style.setProperty("width", "auto", "important");
        
        // console.log('[DEBUG] Activated Collection Info tab by default');
      }
    } else {
      // CRITICAL: Ensure active tab-content is visible even if already active
      const activeTabContent = Array.from(tabContents).find(tc => tc.classList.contains('active'));
      if (activeTabContent) {
        activeTabContent.style.setProperty("display", "block", "important");
        activeTabContent.style.setProperty("visibility", "visible", "important");
        activeTabContent.style.setProperty("opacity", "1", "important");
        activeTabContent.style.setProperty("position", "relative", "important");
        activeTabContent.style.setProperty("height", "auto", "important");
        activeTabContent.style.setProperty("width", "auto", "important");
      }
    }
    
    // CRITICAL: Force immediate reflow to ensure styles are applied before any async operations
    // This prevents tab-content from disappearing during loading
    void appContainer.offsetHeight;
    
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
    // Add a flag to prevent redundant calls
    let seedsLoadedFlag = false;
    const ensureSavedSeedsLoaded = () => {
      // Prevent redundant calls - only run once per project load
      if (seedsLoadedFlag) {
        return;
      }
      
      // Ensure savedSeedsModal instance exists and loads seedList
      let savedSeedsModal = window.savedSeedsModalInstance;
      
      if (!savedSeedsModal && window.SavedSeedsModal) {
        savedSeedsModal = new window.SavedSeedsModal();
        window.savedSeedsModalInstance = savedSeedsModal;
        // console.log('[DEBUG] Created SavedSeedsModal instance on project interface start');
      }
      
      if (savedSeedsModal) {
        // CRITICAL: Update seedListKey first using current project data
        if (typeof savedSeedsModal.getSeedListKey === 'function') {
          const correctKey = savedSeedsModal.getSeedListKey();
          savedSeedsModal.seedListKey = correctKey;
          // console.log('[DEBUG] Updated modal seedListKey to:', correctKey, 'for project:', projectData.name || 'unknown');
        }
        
        // Check if project data has savedSeeds that we should use
        if (projectData && projectData.savedSeeds && Array.isArray(projectData.savedSeeds) && projectData.savedSeeds.length > 0) {
          // console.log('[DEBUG] Project data has', projectData.savedSeeds.length, 'saved seeds - using them directly');
          
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
          // console.log('[DEBUG] ✅ Loaded', normalizedSeeds.length, 'seeds from project data');
          
          // Also save to localStorage
          try {
            localStorage.setItem(savedSeedsModal.seedListKey, JSON.stringify(normalizedSeeds));
            // console.log('[DEBUG] ✅ Saved seeds to localStorage with key:', savedSeedsModal.seedListKey);
          } catch (error) {
            // console.warn('[DEBUG] Could not save seeds to localStorage:', error);
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
            // console.log('[DEBUG] Found', localStorageSeeds.length, 'seeds in localStorage for key:', seedListKey);
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
            // console.log('[DEBUG] ✅ Loaded', normalizedSeeds.length, 'seeds from localStorage');
            
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
            // console.log('[DEBUG] No seeds in project data or localStorage, calling loadSeedList...');
            savedSeedsModal.seedList = [];
            savedSeedsModal.loadSeedList(true);
            // console.log('[DEBUG] ✅ Loaded saved seeds from loadSeedList:', savedSeedsModal.seedList?.length || 0, 'seeds');
          }
        }
        
        // Mark as loaded to prevent redundant calls
        seedsLoadedFlag = true;
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
        // console.log('[DEBUG] updateCountersOnLoad: Popup is still showing, skipping counter updates');
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
          // console.log('[DEBUG] updateNftCountPanel called on project interface start');
        }
        if (window.NFTApp.getModule('generateNftsUI')?.refreshSeedListCounter) {
          window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true);
          // console.log('[DEBUG] refreshSeedListCounter called on project interface start');
        }
      }
    };
    
    // CRITICAL: Load saved seeds BEFORE updating counters
    ensureSavedSeedsLoaded();
    
    // Call immediately (after seedList is loaded)
    updateCountersOnLoad();
    
    // Update progress: Setting up trait layers (64%)
    setTimeout(() => {
      updateProgress(64, "Finalizing setup...");
    }, 200);
    
    // Load trait layers module if it exists
    if (window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
      window.NFTApp.getModule("traitLayers").setup(projectData)
    } else {
      console.warn("Trait layers module not found, trait layers tab may not work properly")
    }

    // Update progress: Setting up combination rules (70%)
    setTimeout(() => {
      updateProgress(70, "Finalizing setup...");
    }, 400);

    // Load combination rules module if it exists
    if (window.NFTApp.getModule && window.NFTApp.getModule("combinationRules")) {
      window.NFTApp.getModule("combinationRules").setup(projectData)
    } else {
      console.warn("Combination rules module not found, combination rules tab may not work properly")
    }

    // Update progress: Setting up NFT generation (76%)
    setTimeout(() => {
      updateProgress(76, "Finalizing setup...");
    }, 600);

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

    // Update progress: Setting up navigation (82%)
    setTimeout(() => {
      updateProgress(82, "Finalizing setup...");
    }, 800);

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
    
    // Update progress: Loading saved seeds (86%)
    setTimeout(() => {
      updateProgress(86, "Finalizing setup...");
    }, 600);

    // Add event listener for save as button
    document.getElementById("save-project-as").addEventListener("click", () => {
      if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
        window.NFTApp.getModule("projectService").save(true) // true = always show picker (save as)
      } else {
        console.warn("Project service module not found, saving may not work properly")
      }
    })

    // Update progress: Updating counters (87%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(87, "Finalizing setup...");
    }, 700);
    
    // Update progress: Updating counters (88%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(88, "Finalizing setup...");
    }, 800);
    
    // Update progress: Finalizing (89%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(89, "Finalizing setup...");
    }, 900);
    
    // Update progress: Finalizing (90%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(90, "Finalizing setup...");
    }, 1000);
    
    // Update progress: Almost ready (91%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(91, "Finalizing setup...");
    }, 1100);
    
    // Update progress: Almost ready (92%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(92, "Finalizing setup...");
    }, 1200);
    
    // Update progress: Preparing final steps (93%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(93, "Finalizing setup...");
    }, 1300);
    
    // Update progress: Preparing final steps (94%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(94, "Finalizing setup...");
    }, 1400);
    
    // Update progress: Almost ready (95%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(95, "Finalizing setup...");
    }, 1500);
    
    // Update progress: Almost ready (96%)
    setTimeout(() => {
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      updateProgress(96, "Finalizing setup...");
    }, 1600);

    // CRITICAL: Function to check if all async operations are complete
    const checkAppReadiness = () => {
      const checks = {
        projectNotLoading: true, // CRITICAL: Check if project is still loading
        modulesReady: true,
        seedsLoaded: true, // Default to true, only false if we detect loading in progress
        countersUpdated: true, // Default to true, counters update is fast
        uiRendered: false,
        traitsInitialized: true, // Default to true, only false if we detect initialization in progress
        asyncOperationsComplete: true, // Track any ongoing async operations
        loadingOverlayHidden: true // Check if loading overlay is hidden
      };
      
      // CRITICAL: Check if project is currently being loaded
      const projectService = window.NFTApp?.getModule('projectService');
      if (projectService && projectService.isLoading === true) {
        console.log('[READINESS] Project is still loading, waiting...');
        checks.projectNotLoading = false;
      }
      
      // CRITICAL: Check if loading overlay is visible and showing "Loading project..."
      const loadingOverlay = document.getElementById('loading-overlay');
      if (loadingOverlay) {
        const overlayStyle = window.getComputedStyle(loadingOverlay);
        const isOverlayVisible = overlayStyle.display !== 'none' && overlayStyle.visibility !== 'hidden' && overlayStyle.opacity !== '0';
        
        if (isOverlayVisible) {
          // Check what message is being shown
          const loadingText = loadingOverlay.querySelector('.loading-text, .loading-content .loading-text');
          if (loadingText) {
            const textContent = loadingText.textContent || '';
            // If it's showing "Loading project..." or any loading message (not "Application ready!"), wait
            if (textContent.includes('Loading project') || 
                textContent.includes('Loading') && !textContent.includes('Application ready')) {
              console.log('[READINESS] Loading overlay is visible with loading message:', textContent);
              checks.loadingOverlayHidden = false;
            }
          } else {
            // If overlay is visible but we can't read the text, assume it's still loading
            console.log('[READINESS] Loading overlay is visible but text not readable, waiting...');
            checks.loadingOverlayHidden = false;
          }
        }
      }
      
      // Check if all critical modules are set up
      const requiredModules = ['traitLayers', 'combinationRules', 'generateNfts', 'navigation', 'generalInfo'];
      for (const moduleName of requiredModules) {
        if (!window.NFTApp.getModule || !window.NFTApp.getModule(moduleName)) {
          checks.modulesReady = false;
          break;
        }
      }
      
      // Check if saved seeds are loaded
      // CRITICAL: savedSeedsModal is NOT a registered module - it's accessed via window.savedSeedsModalInstance
      // If savedSeedsModal instance exists, check if seedList is loaded
      const savedSeedsModal = window.savedSeedsModalInstance;
      if (savedSeedsModal) {
        // If seedList exists, it's loaded (even if empty)
        if (savedSeedsModal.seedList !== undefined) {
          checks.seedsLoaded = true;
        } else {
          // seedList might still be loading
          checks.seedsLoaded = false;
        }
      } else {
        // No savedSeedsModal instance exists yet - that's okay, seeds might not be needed
        // Consider it ready (seeds are optional)
        checks.seedsLoaded = true;
      }
      
      // Check if UI is rendered (check if main content containers exist and are visible)
      const appContainer = document.getElementById("app");
      const projectInterface = appContainer ? appContainer.querySelector(".project-interface") : null;
      const activeTabContent = appContainer ? appContainer.querySelector('.tab-content.active') : null;
      if (projectInterface && activeTabContent) {
        // Also check if content is actually visible (not just in DOM)
        const computedStyle = window.getComputedStyle(projectInterface);
        if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden' && computedStyle.opacity !== '0') {
          checks.uiRendered = true;
        }
      }
      
      // Check if traits are initialized (check for traits-ultimate-solution)
      if (window.checkUltimateTraitsStatus) {
        try {
          const status = window.checkUltimateTraitsStatus();
          if (status && status.allReady === false) {
            checks.traitsInitialized = false;
          }
        } catch (e) {
          // If check fails, assume ready
          checks.traitsInitialized = true;
        }
      }
      
      // Check for any ongoing async operations by looking for loading indicators
      const loadingIndicators = document.querySelectorAll('.loading, .spinner, [data-loading="true"]');
      if (loadingIndicators.length > 0) {
        // Check if any are actually visible
        let hasVisibleLoading = false;
        loadingIndicators.forEach(indicator => {
          const style = window.getComputedStyle(indicator);
          if (style.display !== 'none' && style.visibility !== 'hidden') {
            hasVisibleLoading = true;
          }
        });
        if (hasVisibleLoading) {
          checks.asyncOperationsComplete = false;
        }
      }
      
      // CRITICAL: Project loading check is mandatory - if project is loading, don't show ready
      if (!checks.projectNotLoading || !checks.loadingOverlayHidden) {
        return false;
      }
      
      // All critical checks must pass (some are optional/soft checks)
      const criticalChecks = [checks.modulesReady, checks.uiRendered, checks.projectNotLoading, checks.loadingOverlayHidden];
      const allCriticalPass = criticalChecks.every(check => check === true);
      
      // If critical checks pass and we've given enough time for async ops, consider ready
      // After 3 seconds (increased from 2), be more lenient with async operations
      const timeSinceStart = Date.now() - (window._appStartTime || Date.now());
      const hasWaitedEnough = timeSinceStart > 3000; // Increased to 3 seconds
      
      if (allCriticalPass && (hasWaitedEnough || checks.asyncOperationsComplete)) {
        return true;
      }
      
      return false;
    };
    
    // Track app start time for readiness checks
    if (!window._appStartTime) {
      window._appStartTime = Date.now();
    }

    // Final update: App is ready (100%)
    // Use a polling mechanism to check readiness instead of fixed timeout
    // This ensures ALL async operations complete before showing "Application ready!"
    // CRITICAL: Increased max checks to wait longer for project loading to complete
    let readinessCheckAttempts = 0;
    const maxReadinessChecks = 100; // Maximum 10 seconds (100 * 100ms) - increased to wait for project loading
    const readinessCheckInterval = 100; // Check every 100ms
    
    const checkAndShowReady = () => {
      readinessCheckAttempts++;
      
      // Ensure operations are running
      ensureSavedSeedsLoaded();
      updateCountersOnLoad();
      
      // Check if everything is ready
      const isReady = checkAppReadiness();
      
      if (isReady || readinessCheckAttempts >= maxReadinessChecks) {
        // Either everything is ready, or we've waited long enough
        if (isReady) {
          // console.log('[READINESS] All checks passed, showing Application Ready!');
        } else {
          // console.warn('[READINESS] Max attempts reached, showing Application Ready anyway');
        }
      
      // CRITICAL: Ensure app content is visible before hiding loading overlay
      // This prevents the flash of disappearing content
      const appContainer = document.getElementById("app");
      const projectInterface = appContainer ? appContainer.querySelector(".project-interface") : null;
      if (projectInterface) {
        // Force visibility to ensure content is shown
        projectInterface.style.setProperty("display", "block", "important");
        projectInterface.style.setProperty("visibility", "visible", "important");
        projectInterface.style.setProperty("opacity", "1", "important");
      }
      
      // CRITICAL: Ensure active tab-content is visible before final progress update
      const activeTabContent = appContainer ? appContainer.querySelector('.tab-content.active') : null;
      if (activeTabContent) {
        activeTabContent.style.setProperty("display", "block", "important");
        activeTabContent.style.setProperty("visibility", "visible", "important");
        activeTabContent.style.setProperty("opacity", "1", "important");
        activeTabContent.style.setProperty("position", "relative", "important");
        activeTabContent.style.setProperty("height", "auto", "important");
        activeTabContent.style.setProperty("width", "auto", "important");
      }
      
      // Final progress update: Application ready (from 96% to 100%)
      updateProgress(100, "Application ready!");
      
      // Set up click-to-dismiss functionality for "Application ready!" message
      const loadingOverlay = document.getElementById("loading-overlay");
      if (loadingOverlay) {
        // Show hint text below "Application ready!" to indicate clickability
        const loadingContent = loadingOverlay.querySelector('.loading-content');
        if (loadingContent) {
          const hintText = loadingContent.querySelector('.click-hint');
          if (hintText) {
            hintText.style.visibility = 'visible';
          } else {
              // Fallback: create hint text if it doesn't exist
            const newHintText = document.createElement('div');
            newHintText.className = 'click-hint';
            newHintText.style.cssText = 'margin-top: 0.5rem; font-size: 0.85rem; color: rgba(255, 255, 255, 0.6); font-style: italic; height: 1.2rem;';
            newHintText.textContent = 'Click anywhere to continue';
            loadingContent.appendChild(newHintText);
          }
        }
        
        // Remove any existing click handler
        const existingClickHandler = loadingOverlay._applicationReadyClickHandler;
        if (existingClickHandler) {
          loadingOverlay.removeEventListener('click', existingClickHandler);
        }
        
        // Create new click handler
        const clickHandler = () => {
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
            const projectService = window.NFTApp.getModule("projectService");
            if (projectService && typeof projectService.hideLoadingAnimation === 'function') {
              // CRITICAL: Ensure app content remains visible before hiding overlay
                const appContainerForHide = document.getElementById("app");
                const projectInterfaceForHide = appContainerForHide ? appContainerForHide.querySelector(".project-interface") : null;
                if (projectInterfaceForHide) {
                  projectInterfaceForHide.style.setProperty("display", "block", "important");
                  projectInterfaceForHide.style.setProperty("visibility", "visible", "important");
                  projectInterfaceForHide.style.setProperty("opacity", "1", "important");
              }
              
              // Check if a project was loaded (not a new project)
              const showNotification = projectService._projectWasLoaded || false;
              projectService.hideLoadingAnimation(showNotification);
              // Reset the flag after hiding
              projectService._projectWasLoaded = false;
              // Remove click handler after hiding
              loadingOverlay.removeEventListener('click', clickHandler);
              loadingOverlay._applicationReadyClickHandler = null;
            }
          }
        };
        
          // Store handler reference and add event listener
        loadingOverlay._applicationReadyClickHandler = clickHandler;
        loadingOverlay.addEventListener('click', clickHandler);
        
        // Also hide automatically after 2 seconds
        setTimeout(() => {
          // Only hide if overlay is still visible (not already clicked)
          if (loadingOverlay && loadingOverlay.style.display !== 'none' && loadingOverlay.style.visibility !== 'hidden') {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
              const projectService = window.NFTApp.getModule("projectService");
              if (projectService && typeof projectService.hideLoadingAnimation === 'function') {
                // CRITICAL: Ensure app content remains visible before hiding overlay
                  const appContainerForAutoHide = document.getElementById("app");
                  const projectInterfaceForAutoHide = appContainerForAutoHide ? appContainerForAutoHide.querySelector(".project-interface") : null;
                  if (projectInterfaceForAutoHide) {
                    projectInterfaceForAutoHide.style.setProperty("display", "block", "important");
                    projectInterfaceForAutoHide.style.setProperty("visibility", "visible", "important");
                    projectInterfaceForAutoHide.style.setProperty("opacity", "1", "important");
                }
                
                // Check if a project was loaded (not a new project)
                const showNotification = projectService._projectWasLoaded || false;
                projectService.hideLoadingAnimation(showNotification);
                // Reset the flag after hiding
                projectService._projectWasLoaded = false;
                // Remove click handler
                loadingOverlay.removeEventListener('click', clickHandler);
                loadingOverlay._applicationReadyClickHandler = null;
              }
            }
          }
        }, 2000); // 2 seconds delay
      }
      } else {
        // Not ready yet, check again after interval
        setTimeout(checkAndShowReady, readinessCheckInterval);
      }
    };
    
    // Start checking readiness after initial delay (1700ms to match original timing minimum)
    setTimeout(() => {
      checkAndShowReady();
    }, 1700);

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
    const loadProjectBtn = document.getElementById("load-project-btn");
    if (loadProjectBtn) {
      // Remove existing listener if any to prevent duplicates
      const newLoadProjectBtn = loadProjectBtn.cloneNode(true);
      loadProjectBtn.parentNode.replaceChild(newLoadProjectBtn, loadProjectBtn);
      
      newLoadProjectBtn.addEventListener("click", () => {
        const loadProjectInput = document.getElementById("load-project-input");
        if (loadProjectInput) {
          // CRITICAL: Reset file input value BEFORE opening file picker
          // This ensures the change event will fire even if the same file is selected again
          loadProjectInput.value = "";
          
          // CRITICAL: Reset isLoading flag to allow loading again
          if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
            window.NFTApp.getModule("projectService").isLoading = false;
          }
          
          // Small delay to ensure value reset is processed
          setTimeout(() => {
            loadProjectInput.click();
          }, 10);
        }
      });
    }

    // Ensure file input accepts both old and new formats
    const loadProjectInput = document.getElementById("load-project-input")
    if (loadProjectInput) {
      loadProjectInput.accept = ".json,.json.gz,.gz"
      
      // Remove existing listener if any to prevent duplicates
      const newLoadProjectInput = loadProjectInput.cloneNode(true);
      loadProjectInput.parentNode.replaceChild(newLoadProjectInput, loadProjectInput);
      
      // Add event listener for load project input
      newLoadProjectInput.addEventListener('change', (event) => {
        // CRITICAL: Reset isLoading flag before checking files
        // This ensures we can load again even if previous load didn't complete properly
        if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
          window.NFTApp.getModule("projectService").isLoading = false;
        }
        
        if (event.target.files && event.target.files.length > 0) {
          if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
            // CRITICAL: Reset input value immediately after getting files
            // This ensures change event will fire on next selection
            const file = event.target.files[0];
            window.NFTApp.getModule("projectService").load(event);
            
            // Reset input value after a short delay to allow load to start
            setTimeout(() => {
              if (event.target) {
                event.target.value = "";
              }
            }, 100);
          } else {
            console.warn("Project service module not found, loading may not work properly")
          }
        }
      });
    }

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
          // If batch is already minted, color row red (tooltip removed from Collection Info tab)
          if (project.batches[i] && project.batches[i].minted) {
            row.style.background = '#ffdddd';
            row.style.borderRadius = '6px';
            row.style.color = '#b30000';
            row.removeAttribute('title');
            // CRITICAL: Remove tooltip from Collection Info tab
            row.classList.remove('tooltip');
            const rowTooltip = row.querySelector('.tooltiptext');
            if (rowTooltip) rowTooltip.remove();
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
          // Remove title and tooltip (tooltips removed from Collection Info tab)
          mintedCheckbox.removeAttribute('title');
          mintedCheckbox.classList.remove('tooltip');
          const mintedTooltip = mintedCheckbox.querySelector('.tooltiptext');
          if (mintedTooltip) {
            mintedTooltip.remove();
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
        // Remove title and tooltip (tooltips removed from Collection Info tab)
        batchSelectLabel.removeAttribute('title');
        batchSelectLabel.classList.remove('tooltip');
        const batchTooltip = batchSelectLabel.querySelector('.tooltiptext');
        if (batchTooltip) {
          batchTooltip.remove();
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
        // Remove title and tooltip (tooltips removed from Collection Info tab)
        blockchainLabel.removeAttribute('title');
        blockchainLabel.classList.remove('tooltip');
        const blockchainTooltip = blockchainLabel.querySelector('.tooltiptext');
        if (blockchainTooltip) {
          blockchainTooltip.remove();
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
