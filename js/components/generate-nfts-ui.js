// NFT Generation UI Module

console.log("Loading generate-nfts-ui.js module");

// Extend or register the UI logic for NFT generation
window.NFTApp.registerModule("generateNftsUI", {
  projectData: null, // Store projectData for reliable access
  darkModeEnabled: false, // Track dark mode state like in batch generation modal
  
  // Dark traits configuration
  darkTraitsConfig: {
    selectedTraits: new Set(), // Set of selected trait IDs
    customConfig: false // Whether user has made custom selections
  },

  // Dark Traits Configuration Modal
  openDarkTraitsModal: function() {
    try {
      console.log('Opening Dark Traits Configuration Modal');
      this.createDarkTraitsModal();
    } catch (error) {
      console.error('Error opening Dark Traits modal:', error);
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error opening Dark Traits configuration modal',
          'error',
          3000
        );
      }
    }
  },

  createDarkTraitsModal: function() {
    try {
      console.log('[DEBUG] createDarkTraitsModal called');
      
      // Load current configuration before creating modal
      console.log('[DEBUG] Loading Dark NFTs configuration...');
      this.loadDarkTraitsConfig(true); // Force reload when creating modal
      console.log('[DEBUG] Configuration loaded, selectedTraits size:', this.darkTraitsConfig.selectedTraits.size);
      
      // Remove existing modal if it exists
      const existingModal = document.getElementById('dark-traits-modal');
      if (existingModal) {
        existingModal.remove();
      }

      const modal = document.createElement('div');
      modal.id = 'dark-traits-modal';
      modal.className = 'saved-seeds-modal'; // Use the same class as NFTs Collection modal
      modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      modal.innerHTML = `
        <div class="saved-seeds-overlay">
          <div class="saved-seeds-container">
            <div class="saved-seeds-header">
              <div class="saved-seeds-title-container">
                <h2 class="saved-seeds-title">Dark NFT Traits Configuration</h2>
                <div class="saved-seeds-tip">Select traits being used for Dark NFT generation ONLY. This selection do not affect regular generation</div>
              </div>
              <button id="close-dark-traits-modal" class="saved-seeds-close-btn" title="Close modal">&times;</button>
            </div>
            
            <div class="saved-seeds-body">
              <div class="search-section" style="margin-bottom: 20px;">
                <div style="display: flex; gap: 10px; margin-bottom: 10px;">
                  <input type="text" id="dark-traits-search" placeholder="Search traits..." class="trait-search-input" style="width: 191px;">
                  <button id="dark-traits-clear-btn" class="saved-seeds-btn" style="background: #6c757d; color: #fff; height: 28px; width: 60px; min-width: 60px; max-width: 60px;">Clear</button>
                  <button id="dark-nfts-filter-active-traits" class="saved-seeds-btn" style="background: #007bff; color: #fff; width: 130px; height: 28px; min-width: 130px; max-width: 130px;">Show Active Only</button>
                </div>
                <div style="display: flex; gap: 10px;">
                  <button id="reset-dark-traits" class="saved-seeds-btn" style="background: #dc3545; color: #fff;">Reset to Default</button>
                  <span id="dark-nfts-selected-count" style="
                    color: #fff;
                    font-size: 14px;
                    align-self: center;
                    margin-left: 10px;
                    font-family: 'Archivo', sans-serif;
                  ">0 traits selected</span>
                </div>
              </div>
              
              <div id="dark-traits-list" class="saved-seeds-grid">
                <!-- Traits will be populated here -->
              </div>
            </div>
            
            <div class="saved-seeds-footer">
              <div style="display: flex; gap: 12px; align-items: center;">
                <button id="cancel-dark-traits" class="saved-seeds-btn" style="background: #6c757d; color: #fff;">Cancel</button>
                <button id="save-dark-traits" class="saved-seeds-btn" style="background: #28a745; color: #fff;">Save Configuration</button>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(modal);
      console.log('[DEBUG] Dark Traits modal appended to DOM');
      
      // Ensure modal is visible
      modal.style.display = 'flex';
      modal.style.visibility = 'visible';
      modal.style.opacity = '1';
      
      console.log('[DEBUG] Modal display styles applied:', {
        display: modal.style.display,
        visibility: modal.style.visibility,
        opacity: modal.style.opacity,
        zIndex: modal.style.zIndex
      });
      
      this.populateDarkTraitsModal();
      this.setupDarkTraitsModalEvents();
    } catch (error) {
      console.error('[DEBUG] Error creating Dark Traits modal:', error);
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error creating Dark Traits configuration modal',
          'error',
          3000
        );
      }
    }
  },

  populateDarkTraitsModal: function(loadConfig = true) {
    console.log('[DEBUG] populateDarkTraitsModal called, loadConfig:', loadConfig);
    const projectData = this.projectData || window.currentProject;
    console.log('[DEBUG] Project data available:', !!projectData);
    console.log('[DEBUG] Project traits available:', !!projectData?.traits);
    console.log('[DEBUG] Current darkTraitsConfig:', this.darkTraitsConfig);
    console.log('[DEBUG] Selected traits count:', this.darkTraitsConfig.selectedTraits.size);
    
    if (!projectData || !projectData.traits) {
      console.error('[DEBUG] No project data available for dark traits configuration');
      return;
    }

    const traitsList = document.getElementById('dark-traits-list');
    traitsList.innerHTML = '';
    
    // Set up the main container for vertical scrolling with layer sections
    traitsList.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 20px;
      height: 100%;
      overflow-y: auto;
      padding: 8px;
    `;

    // Load saved configuration or use defaults (only if loadConfig is true)
    if (loadConfig) {
      this.loadDarkTraitsConfig(false); // Don't force reload when populating modal
    }

    projectData.traits.forEach((layer, layerIndex) => {
      // Create layer section
      const layerSection = document.createElement('div');
      layerSection.className = 'dark-traits-layer-section';
      layerSection.style.cssText = `
        display: flex;
        flex-direction: column;
        gap: 12px;
      `;

      // Create layer header
      const layerHeader = document.createElement('div');
      layerHeader.className = 'dark-traits-layer-header';
      layerHeader.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        background: #1a1a1a;
        border-radius: 8px;
        border: 1px solid #333;
      `;

      const layerTitle = document.createElement('h3');
      layerTitle.style.cssText = `
        margin: 0;
        font-size: 14px;
        font-weight: 600;
        color: #fff;
        font-family: 'Archivo', sans-serif;
      `;
      layerTitle.textContent = layer.name;

      const layerControls = document.createElement('div');
      layerControls.style.cssText = `
        display: flex;
        align-items: center;
        gap: 12px;
      `;

      const layerCount = document.createElement('span');
      layerCount.style.cssText = `
        font-size: 12px;
        color: #888;
        font-family: 'Archivo', sans-serif;
      `;
      layerCount.textContent = `${layer.traits.length} traits`;

      // Select all toggle for this layer
      const selectAllToggle = document.createElement('button');
      selectAllToggle.className = 'dark-traits-select-all-btn';
      selectAllToggle.setAttribute('data-layer-id', layer.id);
      
      // Check if all traits in this layer are already selected
      const allTraitsSelected = layer.traits.every(trait => 
        this.darkTraitsConfig.selectedTraits.has(`${layer.id}_${trait.id}`)
      );
      
      // Set base styles
      selectAllToggle.style.background = '#007bff';
      selectAllToggle.style.color = '#fff';
      selectAllToggle.style.border = 'none';
      selectAllToggle.style.borderRadius = '4px';
      selectAllToggle.style.padding = '4px 8px';
      selectAllToggle.style.fontSize = '11px';
      selectAllToggle.style.fontWeight = '500';
      selectAllToggle.style.fontFamily = "'Archivo', sans-serif";
      selectAllToggle.style.cursor = 'pointer';
      selectAllToggle.style.transition = 'all 0.2s ease';
      
      if (allTraitsSelected) {
        selectAllToggle.textContent = 'Unselect All';
        selectAllToggle.style.background = '#dc3545';
        selectAllToggle.classList.add('unselect-all');
        selectAllToggle.title = `Unselect all traits in ${layer.name} layer`;
      } else {
        selectAllToggle.textContent = 'Select All';
        selectAllToggle.style.background = '#007bff';
        selectAllToggle.classList.add('select-all');
        selectAllToggle.title = `Select all traits in ${layer.name} layer`;
      }

      // Add hover effect to select all button
      selectAllToggle.addEventListener('mouseenter', () => {
        if (selectAllToggle.textContent === 'Select All') {
        selectAllToggle.style.background = '#0056b3';
        } else {
          selectAllToggle.style.background = '#c82333';
        }
      });
      selectAllToggle.addEventListener('mouseleave', () => {
        if (selectAllToggle.textContent === 'Select All') {
        selectAllToggle.style.background = '#007bff';
        } else {
          selectAllToggle.style.background = '#dc3545';
        }
      });

      // Add click handler for select all
      selectAllToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('[DEBUG] Select All clicked for layer:', layer.id);
        console.log('[DEBUG] Layer traits:', layer.traits);
        console.log('[DEBUG] Current selected traits:', this.darkTraitsConfig.selectedTraits);
        this.toggleSelectAllForLayer(layer.id, layer.traits);
      });

      layerControls.appendChild(layerCount);
      layerControls.appendChild(selectAllToggle);

      layerHeader.appendChild(layerTitle);
      layerHeader.appendChild(layerControls);

      // Create traits grid for this layer
      const traitsGrid = document.createElement('div');
      traitsGrid.className = 'dark-traits-grid';
      traitsGrid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, 141px);
        gap: 10px;
        padding: 8px;
        justify-content: start;
        overflow: visible;
        height: auto;
      `;

      layer.traits.forEach((trait, traitIndex) => {
        // Create trait thumbnail card
        const traitThumb = document.createElement('div');
        traitThumb.className = 'trait-selection-thumb dark-trait-thumb';
        traitThumb.setAttribute('data-trait-id', trait.id);
        traitThumb.setAttribute('data-layer-id', layer.id);
        traitThumb.setAttribute('data-layer-name', layer.name);
        traitThumb.setAttribute('data-trait-name', trait.name);
        
        // Check if this trait is selected for dark mode
        const traitId = `${layer.id}_${trait.id}`;
        const isSelected = this.darkTraitsConfig.selectedTraits.has(traitId);
        console.log('[DEBUG] Trait:', trait.name, 'Layer:', layer.name, 'ID:', traitId, 'isSelected:', isSelected);
        
        // ALWAYS 141x165px - Match NFT Traits sidebar card look
        traitThumb.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 141px;
          height: 165px;
          min-width: 141px;
          min-height: 165px;
          max-width: 141px;
          max-height: 165px;
          background: rgba(20, 20, 20, 0.3);
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 8px;
          box-sizing: border-box;
          position: relative;
        `;

        // Set initial CSS class based on selection state
        if (isSelected) {
          traitThumb.classList.add('selected');
          traitThumb.style.setProperty('border-color', '#e17055', 'important');
          traitThumb.style.setProperty('border-width', '3px', 'important');
          traitThumb.style.setProperty('z-index', '2000', 'important');
        } else {
          traitThumb.classList.add('unselected');
          traitThumb.style.setProperty('border-width', '1px', 'important');
          traitThumb.style.setProperty('z-index', '1', 'important');
        }

        // Add hover effect
        traitThumb.addEventListener('mouseenter', () => {
          if (!traitThumb.classList.contains('selected')) {
            traitThumb.style.setProperty('border-color', '#a259e6', 'important');
          }
        });
        
        traitThumb.addEventListener('mouseleave', () => {
          if (!traitThumb.classList.contains('selected')) {
            traitThumb.style.setProperty('border-color', 'transparent', 'important');
          }
        });

        // Create image container
        const imgDiv = document.createElement('div');
        imgDiv.className = 'trait-selection-img';
        imgDiv.style.cssText = `
          width: 135px !important;
          height: 106px !important;
          max-width: 135px !important;
          max-height: 106px !important;
          min-width: 135px !important;
          min-height: 106px !important;
          background: rgba(0,0,0,0.2);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          margin: 0;
          cursor: default;
          flex-shrink: 0;
          pointer-events: none;
          border: none;
        `;

        // Add trait image if available
        if (trait.imageData || trait.image) {
          const img = document.createElement('img');
          img.src = trait.imageData || trait.image;
          img.alt = trait.name;
          img.style.cssText = `
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
            width: auto;
            height: auto;
            pointer-events: none;
          `;
          img.onerror = function() {
            this.style.display = 'none';
            const noImageDiv = document.createElement('div');
            noImageDiv.textContent = '?';
            noImageDiv.style.cssText = 'color: #666; font-size: 24px; font-weight: bold; pointer-events: none;';
            imgDiv.appendChild(noImageDiv);
          };
          imgDiv.appendChild(img);
        } else {
          const noImageDiv = document.createElement('div');
          noImageDiv.textContent = '?';
          noImageDiv.style.cssText = 'color: #666; font-size: 24px; font-weight: bold; pointer-events: none;';
          imgDiv.appendChild(noImageDiv);
        }

        // Create trait name (bottom, white)
        const nameDiv = document.createElement('div');
        nameDiv.className = 'dark-nfts-trait-selection-name';
        nameDiv.style.cssText = `
          font-size: 11px;
          color: #fff;
          text-align: left;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 137.7px;
          height: 15.58px;
          font-weight: 600;
          font-family: 'Archivo', sans-serif;
          box-sizing: border-box;
          display: flex;
          align-items: center;
          margin: 0;
          padding: 0;
        `;
        // Truncate trait name to 21 characters and add ellipsis
        if (trait.name.length > 21) {
          nameDiv.textContent = trait.name.substring(0, 21) + '...';
          nameDiv.title = trait.name; // Show full name on hover
        } else {
          nameDiv.textContent = trait.name;
        }

        // Create rarity element (top left corner)
        const rarityDiv = document.createElement('div');
        rarityDiv.className = 'dark-nfts-trait-selection-rarity';
        rarityDiv.style.cssText = `
          position: absolute;
          top: 4px;
          left: 4px;
          color: #8b5cf6;
          background: rgba(0, 0, 0, 0.7);
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          font-family: 'Archivo', sans-serif;
          z-index: 4;
          pointer-events: none;
          border: 1px solid rgba(139, 92, 246, 0.3);
        `;
        rarityDiv.textContent = `${(trait.rarity || '0.0').toString().substring(0, 4)}%`;

        // Create text container (like NFT Traits)
        const textContainer = document.createElement('div');
        textContainer.className = 'dark-nfts-trait-selection-text-container';
        textContainer.style.cssText = `
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          width: 137.7px !important;
          height: 28.58px !important;
          padding: 4px 8px !important;
          background: rgba(0, 0, 0, 0.4) !important;
          z-index: 2 !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: flex-start !important;
          justify-content: flex-start !important;
          pointer-events: none !important;
          opacity: 1 !important;
          visibility: visible !important;
          flex-shrink: 0 !important;
          border-radius: 0 0 6px 6px !important;
          box-sizing: border-box !important;
        `;
        textContainer.appendChild(nameDiv);

        // Create VIEW button (top-right corner, matching NFT Traits EDIT button style)
        const viewButton = document.createElement('button');
        viewButton.className = 'dark-trait-view-btn';
        viewButton.style.cssText = `
          position: absolute;
          top: 4px;
          right: 4px;
          width: 34px;
          min-width: 34px;
          max-width: 34px;
          height: 20px;
          min-height: 20px;
          max-height: 20px;
          background: #f39c12;
          color: #fff;
          border: none;
          border-radius: 3px;
          font-size: 10px;
          font-weight: 500;
          cursor: pointer;
          z-index: 100;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          transition: background 0.2s ease;
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Archivo', sans-serif;
        `;
        viewButton.textContent = 'VIEW';
        viewButton.title = `View full-size preview of ${trait.name}`;

        // Add hover effect for VIEW button
        viewButton.addEventListener('mouseenter', () => {
          viewButton.style.background = '#e67e22';
        });
        viewButton.addEventListener('mouseleave', () => {
          viewButton.style.background = '#f39c12';
        });

        // Assemble the trait thumbnail
        traitThumb.appendChild(imgDiv);
        traitThumb.appendChild(textContainer);
        traitThumb.appendChild(rarityDiv);
        traitThumb.appendChild(viewButton);

        // Add click handler for VIEW button (opens image preview)
        viewButton.addEventListener('click', (e) => {
          e.stopPropagation();
          if (trait.imageData || trait.image) {
            this.showTraitImagePreview(trait.imageData || trait.image, trait.name, layer.name);
          }
        });

        // Add click handler for card body (toggles selection)
        traitThumb.addEventListener('click', (e) => {
          console.log('[DEBUG] Card clicked, target:', e.target);
          // Only toggle if not clicking on the image or VIEW button
          if (!e.target.closest('.trait-selection-img') && !e.target.closest('.dark-trait-view-btn')) {
            e.stopPropagation();
            console.log('[DEBUG] Calling toggleDarkTraitSelection');
            this.toggleDarkTraitSelection(layer.id, trait.id, traitThumb);
          } else {
            console.log('[DEBUG] Click ignored - clicked on image or VIEW button');
          }
        });

        // Image click handler removed - only VIEW button opens preview

        traitsGrid.appendChild(traitThumb);
      });

      // Assemble layer section
      layerSection.appendChild(layerHeader);
      layerSection.appendChild(traitsGrid);
      traitsList.appendChild(layerSection);
    });

    this.updateSelectedCount();
    
    // Update all Select All button states to ensure they show correct text
    const currentProjectData = this.projectData || window.currentProject;
    if (currentProjectData && currentProjectData.traits) {
      currentProjectData.traits.forEach(layer => {
        this.updateSelectAllButtonState(layer.id);
      });
    }
  },

  setupDarkTraitsModalEvents: function() {
    const modal = document.getElementById('dark-traits-modal');
    
    // Close modal events
    document.getElementById('close-dark-traits-modal').onclick = () => this.closeDarkTraitsModal();
    document.getElementById('cancel-dark-traits').onclick = () => this.closeDarkTraitsModal();
    document.getElementById('save-dark-traits').onclick = () => this.saveDarkTraitsConfig();
    
    // Search functionality
    document.getElementById('dark-traits-search').addEventListener('input', (e) => {
      this.filterDarkTraits(e.target.value);
      // Update all Select All button states when search changes
      this.updateAllSelectAllButtonStates();
    });
    
    // Clear button functionality
    document.getElementById('dark-traits-clear-btn').addEventListener('click', () => {
      console.log('[DEBUG] Clear button clicked');
      document.getElementById('dark-traits-search').value = '';
      this.filterDarkTraits('');
      // Update all Select All button states when search is cleared
      this.updateAllSelectAllButtonStates();
    });
    
    // Clear search functionality (double-click on search input)
    document.getElementById('dark-traits-search').addEventListener('dblclick', () => {
      console.log('[DEBUG] Search input double-clicked, clearing search');
      document.getElementById('dark-traits-search').value = '';
      this.filterDarkTraits('');
      // Update all Select All button states when search is cleared
      this.updateAllSelectAllButtonStates();
    });
    
    // Filter active traits
    const filterButton = document.getElementById('dark-nfts-filter-active-traits');
    if (filterButton) {
      console.log('[DEBUG] Filter button found during setup:', filterButton);
      filterButton.dataset.filtering = 'false'; // Initialize as not filtering
      filterButton.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('[DEBUG] Filter Active Only button clicked');
        console.log('[DEBUG] Button element:', filterButton);
        console.log('[DEBUG] Button text:', filterButton.textContent);
        this.toggleActiveTraitsFilter();
      });
      console.log('[DEBUG] Event listener added to filter button');
    } else {
      console.log('[DEBUG] ERROR: Filter button not found during setup!');
      console.log('[DEBUG] Available elements with similar IDs:', document.querySelectorAll('[id*="filter"]'));
    }
    
    // Reset to defaults
    const resetButton = document.getElementById('reset-dark-traits');
    if (resetButton) {
      resetButton.addEventListener('click', () => {
        console.log('[DEBUG] Reset to Default button clicked');
        this.resetDarkTraitsToDefault();
        this.populateDarkTraitsModal(false); // Refresh the modal display after reset without loading config
      });
    } else {
      console.log('[DEBUG] ERROR: Reset button not found during setup!');
    }
    
    // Close on outside click
    modal.onclick = (e) => {
      if (e.target === modal) {
        this.closeDarkTraitsModal();
      }
    };
  },


  toggleDarkTraitSelection: function(layerId, traitId, traitThumb) {
    console.log('[DEBUG] toggleDarkTraitSelection called:', { layerId, traitId });
    const fullTraitId = `${layerId}_${traitId}`;
    const isSelected = this.darkTraitsConfig.selectedTraits.has(fullTraitId);
    console.log('[DEBUG] Current selection state:', { fullTraitId, isSelected });
    
    if (isSelected) {
      this.darkTraitsConfig.selectedTraits.delete(fullTraitId);
      console.log('[DEBUG] Deselected trait:', fullTraitId);
    } else {
      this.darkTraitsConfig.selectedTraits.add(fullTraitId);
      console.log('[DEBUG] Selected trait:', fullTraitId);
    }
    
    this.darkTraitsConfig.customConfig = true;
    
    // Update visual state - change card border to indicate selection
    if (isSelected) {
      // Deselect: remove border styling
      traitThumb.style.setProperty('border-color', 'transparent', 'important');
      traitThumb.style.setProperty('border-width', '1px', 'important');
      traitThumb.style.setProperty('background', 'rgba(20, 20, 20, 0.3)', 'important');
      traitThumb.style.setProperty('z-index', '1', 'important');
      traitThumb.classList.remove('selected');
      traitThumb.classList.add('unselected');
      console.log('[DEBUG] Applied deselected styling');
    } else {
      // Select: show selection with orange border
      traitThumb.style.setProperty('border-color', '#e17055', 'important');
      traitThumb.style.setProperty('border-width', '3px', 'important');
      traitThumb.style.setProperty('background', 'rgba(20, 20, 20, 0.3)', 'important');
      traitThumb.style.setProperty('z-index', '2000', 'important');
      traitThumb.classList.remove('unselected');
      traitThumb.classList.add('selected');
      console.log('[DEBUG] Applied selected styling');
    }
    
    this.updateSelectedCount();
    
    // Update the Select All button state for this layer
    this.updateSelectAllButtonState(layerId);
  },

  updateSelectAllButtonState: function(layerId) {
    console.log('[DEBUG] updateSelectAllButtonState called for layer:', layerId);
    
    // Get the Select All button for this layer
    const selectAllButton = document.querySelector(`[data-layer-id="${layerId}"].dark-traits-select-all-btn`);
    if (!selectAllButton) {
      console.log('[DEBUG] Select All button not found for layer:', layerId);
      return;
    }
    
    // Get the project data to find traits for this layer
    const projectData = this.projectData || window.currentProject;
    if (!projectData || !projectData.traits) {
      console.log('[DEBUG] No project data available for button state update');
      return;
    }
    
    // Find the layer
    const layer = projectData.traits.find(l => l.id === layerId);
    if (!layer || !layer.traits) {
      console.log('[DEBUG] Layer not found or has no traits:', layerId);
      return;
    }
    
    // Check if there's an active search filter
    const searchInput = document.getElementById('dark-traits-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    const isSearchActive = searchTerm.length > 0;
    
    let traitsToCheck = layer.traits;
    
    if (isSearchActive) {
      // Filter traits based on current search
      const keywords = searchTerm.toLowerCase()
        .split(/[\s,;-]+/)
        .filter(keyword => keyword.trim().length > 0);
      
      traitsToCheck = layer.traits.filter(trait => {
        const traitNameLower = trait.name.toLowerCase();
        const layerNameLower = layer.name.toLowerCase();
        return keywords.some(keyword => 
          traitNameLower.includes(keyword) || layerNameLower.includes(keyword)
        );
      });
    }
    
    // Check if all visible/filtered traits in this layer are selected
    const allSelected = traitsToCheck.every(trait => 
      this.darkTraitsConfig.selectedTraits.has(`${layerId}_${trait.id}`)
    );
    
    console.log('[DEBUG] All traits selected for layer', layerId, ':', allSelected);
    console.log('[DEBUG] Search active:', isSearchActive, 'Traits to check:', traitsToCheck.length, 'out of', layer.traits.length);
    console.log('[DEBUG] Current button text:', selectAllButton.textContent);
    
    // Update button text and styling based on selection state
    if (allSelected) {
      selectAllButton.textContent = 'Unselect All';
      selectAllButton.style.background = '#dc3545';
      selectAllButton.style.backgroundColor = '#dc3545';
      selectAllButton.classList.add('unselect-all');
      selectAllButton.classList.remove('select-all');
      
      if (isSearchActive) {
        selectAllButton.title = `Unselect all visible "${searchTerm}" traits in ${layer.name} layer`;
      } else {
        selectAllButton.title = `Unselect all traits in ${layer.name} layer`;
      }
      console.log('[DEBUG] Updated button to "Unselect All"');
    } else {
      selectAllButton.textContent = 'Select All';
      selectAllButton.style.background = '#007bff';
      selectAllButton.style.backgroundColor = '#007bff';
      selectAllButton.classList.add('select-all');
      selectAllButton.classList.remove('unselect-all');
      
      if (isSearchActive) {
        selectAllButton.title = `Select all visible "${searchTerm}" traits in ${layer.name} layer (${traitsToCheck.length} of ${layer.traits.length} traits)`;
      } else {
        selectAllButton.title = `Select all traits in ${layer.name} layer`;
      }
      console.log('[DEBUG] Updated button to "Select All"');
    }
  },

  updateAllSelectAllButtonStates: function() {
    console.log('[DEBUG] updateAllSelectAllButtonStates called');
    const projectData = this.projectData || window.currentProject;
    if (!projectData || !projectData.traits) {
      console.log('[DEBUG] No project data available for updating all button states');
      return;
    }
    
    // Update button state for each layer
    projectData.traits.forEach(layer => {
      this.updateSelectAllButtonState(layer.id);
    });
  },

  toggleSelectAllForLayer: function(layerId, traits) {
    console.log('[DEBUG] toggleSelectAllForLayer called for layer:', layerId);
    console.log('[DEBUG] Traits array:', traits);
    console.log('[DEBUG] Traits length:', traits.length);
    
    // Check if there's an active search filter
    const searchInput = document.getElementById('dark-traits-search');
    const searchTerm = searchInput ? searchInput.value.trim() : '';
    const isSearchActive = searchTerm.length > 0;
    
    console.log('[DEBUG] Search active:', isSearchActive, 'Search term:', searchTerm);
    
    let traitsToProcess = traits;
    
    if (isSearchActive) {
      // Filter traits based on current search
      const keywords = searchTerm.toLowerCase()
        .split(/[\s,;-]+/)
        .filter(keyword => keyword.trim().length > 0);
      
      traitsToProcess = traits.filter(trait => {
        const traitNameLower = trait.name.toLowerCase();
        const layerNameLower = traits.find(t => t.id === trait.id)?.layer?.name?.toLowerCase() || '';
        return keywords.some(keyword => 
          traitNameLower.includes(keyword) || layerNameLower.includes(keyword)
        );
      });
      
      console.log('[DEBUG] Filtered traits for selection:', traitsToProcess.length, 'out of', traits.length);
    }
    
    // Check if all visible/filtered traits in this layer are selected
    const allSelected = traitsToProcess.every(trait => 
      this.darkTraitsConfig.selectedTraits.has(`${layerId}_${trait.id}`)
    );
    
    console.log('[DEBUG] All selected state:', allSelected);
    console.log('[DEBUG] Selected traits before:', Array.from(this.darkTraitsConfig.selectedTraits));
    
    if (allSelected) {
      // Deselect all visible/filtered traits in this layer
      console.log('[DEBUG] Deselecting all visible traits in layer');
      traitsToProcess.forEach(trait => {
        const fullTraitId = `${layerId}_${trait.id}`;
        console.log('[DEBUG] Removing trait:', fullTraitId);
        this.darkTraitsConfig.selectedTraits.delete(fullTraitId);
      });
    } else {
      // Select all visible/filtered traits in this layer
      console.log('[DEBUG] Selecting all visible traits in layer');
      traitsToProcess.forEach(trait => {
        const fullTraitId = `${layerId}_${trait.id}`;
        console.log('[DEBUG] Adding trait:', fullTraitId);
        this.darkTraitsConfig.selectedTraits.add(fullTraitId);
      });
    }
    
    console.log('[DEBUG] Selected traits after:', Array.from(this.darkTraitsConfig.selectedTraits));
    
    this.darkTraitsConfig.customConfig = true;
    
    // Update visual state for all trait cards in this layer
    const traitCards = document.querySelectorAll(`.dark-trait-thumb[data-layer-id="${layerId}"]`);
    console.log('[DEBUG] Found trait cards:', traitCards.length);
    console.log('[DEBUG] Looking for cards with selector: .dark-trait-thumb[data-layer-id="${layerId}"]');
    console.log('[DEBUG] All trait cards in DOM:', document.querySelectorAll('.dark-trait-thumb').length);
    console.log('[DEBUG] All trait cards with data-layer-id:', document.querySelectorAll('[data-layer-id]').length);
    
    traitCards.forEach(card => {
      const traitId = card.getAttribute('data-trait-id');
      const fullTraitId = `${layerId}_${traitId}`;
      const isSelected = this.darkTraitsConfig.selectedTraits.has(fullTraitId);
      
      console.log('[DEBUG] Updating card:', { traitId, fullTraitId, isSelected });
      console.log('[DEBUG] Card element:', card);
      console.log('[DEBUG] Card current classes:', card.className);
      console.log('[DEBUG] Card current border color:', card.style.borderColor);
      
      if (isSelected) {
        // Select: show orange border
        card.style.setProperty('border-color', '#e17055', 'important');
        card.style.setProperty('border-width', '3px', 'important');
        card.style.setProperty('background', 'rgba(20, 20, 20, 0.3)', 'important');
        card.style.setProperty('z-index', '2000', 'important');
        card.classList.remove('unselected');
        card.classList.add('selected');
        console.log('[DEBUG] Applied selected styling to card');
        console.log('[DEBUG] Card new border color:', card.style.borderColor);
        console.log('[DEBUG] Card new classes:', card.className);
      } else {
        // Deselect: remove border styling
        card.style.setProperty('border-color', 'transparent', 'important');
        card.style.setProperty('border-width', '1px', 'important');
        card.style.setProperty('background', 'rgba(20, 20, 20, 0.3)', 'important');
        card.style.setProperty('z-index', '1', 'important');
        card.classList.remove('selected');
        card.classList.add('unselected');
        console.log('[DEBUG] Applied deselected styling to card');
        console.log('[DEBUG] Card new border color:', card.style.borderColor);
        console.log('[DEBUG] Card new classes:', card.className);
      }
    });
    
    // Force a visual refresh to ensure changes take effect
    setTimeout(() => {
      console.log('[DEBUG] Force refreshing visual state');
      traitCards.forEach(card => {
        const traitId = card.getAttribute('data-trait-id');
        const fullTraitId = `${layerId}_${traitId}`;
        const isSelected = this.darkTraitsConfig.selectedTraits.has(fullTraitId);
        
        console.log('[DEBUG] Force refresh - Card:', { traitId, fullTraitId, isSelected });
        
        if (isSelected) {
          card.style.setProperty('border-color', '#e17055', 'important');
          card.style.setProperty('border-width', '3px', 'important');
          card.style.setProperty('z-index', '2000', 'important');
          card.classList.add('selected');
          card.classList.remove('unselected');
          console.log('[DEBUG] Force refresh - Applied selected styling');
        } else {
          card.style.setProperty('border-color', 'transparent', 'important');
          card.style.setProperty('border-width', '1px', 'important');
          card.style.setProperty('z-index', '1', 'important');
          card.classList.add('unselected');
          card.classList.remove('selected');
          console.log('[DEBUG] Force refresh - Applied deselected styling');
        }
      });
      
      // Also force refresh the button state
      const refreshButton = document.querySelector(`[data-layer-id="${layerId}"].dark-traits-select-all-btn`);
      console.log('[DEBUG] Force refresh - Found button:', !!refreshButton);
      if (refreshButton) {
        const allSelected = traits.every(trait => 
          this.darkTraitsConfig.selectedTraits.has(`${layerId}_${trait.id}`)
        );
        
        console.log('[DEBUG] Force refresh - Button state:', allSelected);
        console.log('[DEBUG] Force refresh - Button current text:', refreshButton.textContent);
        console.log('[DEBUG] Force refresh - Button current classes:', refreshButton.className);
        
        if (allSelected) {
          refreshButton.textContent = 'Unselect All';
          refreshButton.style.background = '#dc3545';
          refreshButton.style.backgroundColor = '#dc3545';
          refreshButton.classList.add('unselect-all');
          refreshButton.classList.remove('select-all');
          console.log('[DEBUG] Force refresh - Button set to Unselect All');
          console.log('[DEBUG] Force refresh - Button new text:', refreshButton.textContent);
        } else {
          refreshButton.textContent = 'Select All';
          refreshButton.style.background = '#007bff';
          refreshButton.style.backgroundColor = '#007bff';
          refreshButton.classList.add('select-all');
          refreshButton.classList.remove('unselect-all');
          console.log('[DEBUG] Force refresh - Button set to Select All');
          console.log('[DEBUG] Force refresh - Button new text:', refreshButton.textContent);
        }
      } else {
        console.log('[DEBUG] Force refresh - Button not found for layer:', layerId);
      }
    }, 50);
    
    // Double-check visual state after a longer delay
    setTimeout(() => {
      console.log('[DEBUG] Double-checking visual state for layer:', layerId);
      const doubleCheckCards = document.querySelectorAll(`.dark-trait-thumb[data-layer-id="${layerId}"]`);
      doubleCheckCards.forEach(card => {
        const traitId = card.getAttribute('data-trait-id');
        const fullTraitId = `${layerId}_${traitId}`;
        const isSelected = this.darkTraitsConfig.selectedTraits.has(fullTraitId);
        
        console.log('[DEBUG] Double-check - Card:', { traitId, fullTraitId, isSelected });
        console.log('[DEBUG] Double-check - Card classes:', card.className);
        console.log('[DEBUG] Double-check - Card border color:', card.style.borderColor);
        
        if (isSelected && !card.classList.contains('selected')) {
          console.log('[DEBUG] Double-check - Fixing missing selected class');
          card.style.setProperty('border-color', '#e17055', 'important');
          card.style.setProperty('border-width', '3px', 'important');
          card.style.setProperty('z-index', '2000', 'important');
          card.classList.add('selected');
          card.classList.remove('unselected');
        } else if (!isSelected && card.classList.contains('selected')) {
          console.log('[DEBUG] Double-check - Fixing incorrect selected class');
          card.style.setProperty('border-color', 'transparent', 'important');
          card.style.setProperty('border-width', '1px', 'important');
          card.style.setProperty('z-index', '1', 'important');
          card.classList.remove('selected');
          card.classList.add('unselected');
        }
      });
    }, 100);
    
    this.updateSelectedCount();
  },

  showTraitImagePreview: function(imageSrc, traitName, layerName) {
    console.log('[Dark Traits Modal] Opening trait image preview for:', traitName);
    
    // Use the existing trait image preview system if available
    if (window.traitImagePreview && window.traitImagePreview.openImagePreview) {
      window.traitImagePreview.openImagePreview(imageSrc, traitName);
      return;
    }
    
    // Fallback: create our own preview modal
    const previewModal = document.createElement('div');
    previewModal.className = 'trait-image-preview-modal';
    previewModal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.95);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 2147483647;
      padding: 40px;
      box-sizing: border-box;
    `;

    // Create content container
    const contentContainer = document.createElement('div');
    contentContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      align-items: center;
      max-width: 90vw;
      max-height: 90vh;
      gap: 20px;
    `;

    // Create title
    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 24px;
      font-weight: 600;
      color: #fff;
      text-align: center;
      margin-bottom: 10px;
    `;
    title.innerHTML = `
      <div style="font-size: 14px; color: #95a5a6; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 8px;">${layerName}</div>
      <div style="font-size: 28px; color: #fff;">${traitName}</div>
    `;

    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      position: relative;
      max-width: 80vw;
      max-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      border-radius: 12px;
      border: 2px solid #6c5ce7;
      padding: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    `;

    // Create image
    const img = document.createElement('img');
    img.src = imageSrc;
    img.alt = traitName;
    img.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      object-fit: contain;
      border-radius: 8px;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      width: 48px;
      height: 48px;
      font-size: 24px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s ease;
      z-index: 10;
    `;

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.2)';
      closeBtn.style.borderColor = '#fff';
      closeBtn.style.transform = 'scale(1.1)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.style.borderColor = 'rgba(255, 255, 255, 0.3)';
      closeBtn.style.transform = 'scale(1)';
    });

    closeBtn.addEventListener('click', () => {
      previewModal.remove();
    });

    // Assemble modal
    imageContainer.appendChild(img);
    imageContainer.appendChild(closeBtn);
    contentContainer.appendChild(title);
    contentContainer.appendChild(imageContainer);
    previewModal.appendChild(contentContainer);

    // Add to DOM
    document.body.appendChild(previewModal);

    // Close on outside click
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        previewModal.remove();
      }
    });

    // Close on Escape key
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        previewModal.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  },


  updateSelectedCount: function() {
    const countElement = document.getElementById('dark-nfts-selected-count');
    if (countElement) {
      countElement.textContent = `${this.darkTraitsConfig.selectedTraits.size} traits selected`;
    }
  },

  filterDarkTraits: function(searchTerm) {
    console.log('[DEBUG] filterDarkTraits called with searchTerm:', searchTerm);
    const traitThumbs = document.querySelectorAll('.dark-trait-thumb');
    console.log('[DEBUG] Found trait thumbs:', traitThumbs.length);
    
    // Split search term by multiple separators and filter out empty strings
    const keywords = searchTerm.toLowerCase()
      .split(/[\s,;-]+/)
      .filter(keyword => keyword.trim().length > 0);
    
    console.log('[DEBUG] Extracted keywords:', keywords);
    
    traitThumbs.forEach(thumb => {
      const traitName = thumb.getAttribute('data-trait-name');
      const layerName = thumb.getAttribute('data-layer-name');
      
      if (!traitName || !layerName) {
        console.log('[DEBUG] Missing attributes for trait thumb:', thumb);
        return;
      }
      
      const traitNameLower = traitName.toLowerCase();
      const layerNameLower = layerName.toLowerCase();
      
      // If no keywords, show all traits
      if (keywords.length === 0) {
        thumb.style.setProperty('display', 'flex', 'important');
        return;
      }
      
      // Check if trait matches ANY of the keywords (OR logic)
      const isVisible = keywords.some(keyword => 
        traitNameLower.includes(keyword) || layerNameLower.includes(keyword)
      );
      
      console.log('[DEBUG] Trait visibility:', { 
        traitName, 
        layerName, 
        keywords, 
        isVisible 
      });
      
      thumb.style.setProperty('display', isVisible ? 'flex' : 'none', 'important');
    });
    
    console.log('[DEBUG] Multi-keyword search filter applied');
  },

  toggleActiveTraitsFilter: function() {
    console.log('[DEBUG] toggleActiveTraitsFilter called');
    const button = document.getElementById('dark-nfts-filter-active-traits');
    console.log('[DEBUG] Filter button found:', button);
    
    if (!button) {
      console.log('[DEBUG] ERROR: Filter button not found!');
      return;
    }
    
    const isFiltering = button.dataset.filtering === 'true';
    console.log('[DEBUG] Current filtering state:', isFiltering);
    
    if (isFiltering) {
      // Show all traits
      console.log('[DEBUG] Showing all traits');
      document.querySelectorAll('.dark-trait-thumb').forEach(thumb => {
        thumb.style.setProperty('display', 'flex', 'important');
      });
      button.textContent = 'Show Active Only';
      button.style.width = '130px';
      button.style.height = '28px';
      button.style.minWidth = '130px';
      button.style.maxWidth = '130px';
      button.dataset.filtering = 'false';
      console.log('[DEBUG] Updated button to "Show Active Only"');
    } else {
      // Show only active traits
      console.log('[DEBUG] Showing only active traits');
      const traitCards = document.querySelectorAll('.dark-trait-thumb');
      console.log('[DEBUG] Found trait cards:', traitCards.length);
      
      traitCards.forEach(thumb => {
        const layerId = thumb.getAttribute('data-layer-id');
        const traitId = thumb.getAttribute('data-trait-id');
        const fullTraitId = `${layerId}_${traitId}`;
        const isSelected = this.darkTraitsConfig.selectedTraits.has(fullTraitId);
        console.log('[DEBUG] Card:', { layerId, traitId, fullTraitId, isSelected });
        thumb.style.setProperty('display', isSelected ? 'flex' : 'none', 'important');
      });
      button.textContent = 'Show All';
      button.style.width = '130px';
      button.style.height = '28px';
      button.style.minWidth = '130px';
      button.style.maxWidth = '130px';
      button.dataset.filtering = 'true';
      console.log('[DEBUG] Updated button to "Show All"');
    }
  },

  resetDarkTraitsToDefault: function() {
    console.log('[DEBUG] resetDarkTraitsToDefault called');
    this.darkTraitsConfig.selectedTraits.clear();
    this.darkTraitsConfig.customConfig = true; // Set to true so generation uses selected traits
    
    // Select default dark traits
    const projectData = this.projectData || window.currentProject;
    if (projectData && projectData.traits) {
      const darkKeywords = ['dark', 'black', 'grey', 'gray', 'charcoal', 'ebony', 'shadow', 'night', 'midnight'];
      console.log('[DEBUG] Project has traits, searching for dark traits with keywords:', darkKeywords);
      
      let foundTraits = 0;
      projectData.traits.forEach(layer => {
        layer.traits.forEach(trait => {
          const traitName = trait.name.toLowerCase();
          if (darkKeywords.some(keyword => traitName.includes(keyword))) {
            const traitId = `${layer.id}_${trait.id}`;
            this.darkTraitsConfig.selectedTraits.add(traitId);
            foundTraits++;
            console.log('[DEBUG] Added default dark trait:', trait.name, 'from layer:', layer.name, 'ID:', traitId);
          }
        });
      });
      console.log('[DEBUG] Total default dark traits found:', foundTraits);
      console.log('[DEBUG] Final selectedTraits Set:', Array.from(this.darkTraitsConfig.selectedTraits));
    } else {
      console.log('[DEBUG] No project data or traits available for default selection');
    }
    
    // Update the selected count display
    this.updateSelectedCount();
    
    // Don't call populateDarkTraitsModal() here to avoid recursion
    // The modal will be populated by the calling function
  },

  loadDarkTraitsConfig: function(forceReload = false) {
    console.log('[DEBUG] loadDarkTraitsConfig called, forceReload:', forceReload);
    const projectData = this.projectData || window.currentProject;
    console.log('[DEBUG] Project data available:', !!projectData);
    console.log('[DEBUG] Project data darkTraitsConfig:', projectData?.darkTraitsConfig);
    
    if (!projectData) {
      console.log('[DEBUG] No project data available, cannot load Dark NFTs config');
      return;
    }
    
    // Don't override selections if they were just made and forceReload is false
    if (!forceReload && this.darkTraitsConfig.selectedTraits.size > 0) {
      console.log('[DEBUG] Skipping config load - selections already exist and forceReload is false');
      return;
    }
    
    // First check if configuration exists in project data (from save/load)
    if (projectData.darkTraitsConfig) {
      console.log('[DEBUG] Found darkTraitsConfig in project data:', projectData.darkTraitsConfig);
      this.darkTraitsConfig.selectedTraits = new Set(projectData.darkTraitsConfig.selectedTraits || []);
      this.darkTraitsConfig.customConfig = projectData.darkTraitsConfig.customConfig || false;
      console.log('[DEBUG] Loaded dark traits configuration from project data:', this.darkTraitsConfig);
      console.log('[DEBUG] Selected traits count:', this.darkTraitsConfig.selectedTraits.size);
      return;
    }
    
    console.log('[DEBUG] No darkTraitsConfig in project data, trying localStorage fallback');
    
    // Fallback to localStorage
    const configKey = `darkTraitsConfig_${projectData.name}`;
    const savedConfig = localStorage.getItem(configKey);
    console.log('[DEBUG] localStorage config key:', configKey);
    console.log('[DEBUG] localStorage saved config:', savedConfig);
    
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        this.darkTraitsConfig.selectedTraits = new Set(config.selectedTraits || []);
        this.darkTraitsConfig.customConfig = config.customConfig || false;
        console.log('[DEBUG] Loaded dark traits configuration from localStorage:', this.darkTraitsConfig);
        console.log('[DEBUG] Selected traits count:', this.darkTraitsConfig.selectedTraits.size);
      } catch (error) {
        console.error('[DEBUG] Error loading dark traits configuration:', error);
        // Use default dark traits
        this.resetDarkTraitsToDefault();
      }
    } else {
      console.log('[DEBUG] No saved config in localStorage, using default dark traits');
      // Use default dark traits
      this.resetDarkTraitsToDefault();
    }
  },

  saveDarkTraitsConfig: function() {
    const projectData = this.projectData || window.currentProject;
    if (!projectData) return;
    
    // Update project data with current configuration
    if (!projectData.darkTraitsConfig) {
      projectData.darkTraitsConfig = {};
    }
    projectData.darkTraitsConfig.selectedTraits = Array.from(this.darkTraitsConfig.selectedTraits);
    projectData.darkTraitsConfig.customConfig = this.darkTraitsConfig.customConfig;
    
    // Also save to localStorage for backward compatibility
    const configKey = `darkTraitsConfig_${projectData.name}`;
    const configToSave = {
      selectedTraits: Array.from(this.darkTraitsConfig.selectedTraits),
      customConfig: this.darkTraitsConfig.customConfig
    };
    
    try {
      localStorage.setItem(configKey, JSON.stringify(configToSave));
      console.log('[DEBUG] Saved dark traits configuration:', configToSave);
      
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Dark traits configuration saved successfully!',
          'success',
          3000
        );
      }
      
      this.closeDarkTraitsModal();
    } catch (error) {
      console.error('[DEBUG] Error saving dark traits configuration:', error);
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error saving configuration',
          'error',
          3000
        );
      }
    }
  },

  closeDarkTraitsModal: function() {
    const modal = document.getElementById('dark-traits-modal');
    if (modal) {
      modal.remove();
    }
  },

  // Get selected dark traits for generation
  getSelectedDarkTraits: function() {
    return Array.from(this.darkTraitsConfig.selectedTraits);
  },

  // Ensure NFT preview container exists - used by tests and error recovery
  ensureNftPreviewContainerExists: function() {
    console.log('[DEBUG] Ensuring NFT preview container exists...');
    
    // Find the preview panel element
    const previewPanelElem = document.querySelector('.nft-preview-image-area');
    if (!previewPanelElem) {
      console.error('[DEBUG] .nft-preview-image-area not found in DOM');
      return false;
    }
    
    // Check if container already exists
    let previewContainer = previewPanelElem.querySelector('#nft-preview-container');
    if (previewContainer) {
      console.log('[DEBUG] NFT preview container already exists');
    } else {
      // Create the container
      console.log('[DEBUG] Creating NFT preview container...');
      previewContainer = document.createElement('div');
      previewContainer.id = 'nft-preview-container';
      previewContainer.style.position = 'relative';
      previewContainer.style.width = '100%';
      previewContainer.style.height = '100%';
      previewPanelElem.appendChild(previewContainer);
      console.log('[DEBUG] NFT preview container created successfully');
    }
    
    // Also ensure the control elements exist (for test compatibility)
    const controlsPanel = document.querySelector('.nft-controls-panel');
    if (controlsPanel) {
      // Check if rarity seed row exists
      let raritySeedRow = controlsPanel.querySelector('.nft-rarity-seed-row');
      if (!raritySeedRow) {
        console.log('[DEBUG] Creating missing rarity seed row...');
        raritySeedRow = document.createElement('div');
        raritySeedRow.className = 'nft-rarity-seed-row';
        controlsPanel.appendChild(raritySeedRow);
      }
      
      // Check if seedlist random row exists
      let seedlistRandomRow = controlsPanel.querySelector('.nft-seedlist-random-row');
      if (!seedlistRandomRow) {
        console.log('[DEBUG] Creating missing seedlist random row...');
        seedlistRandomRow = document.createElement('div');
        seedlistRandomRow.className = 'nft-seedlist-random-row';
        controlsPanel.appendChild(seedlistRandomRow);
      }
      
      // Check if seed input row exists
      let seedInputRow = controlsPanel.querySelector('.nft-seedinput-row');
      if (!seedInputRow) {
        console.log('[DEBUG] Creating missing seed input row...');
        seedInputRow = document.createElement('div');
        seedInputRow.className = 'nft-seedinput-row';
        controlsPanel.appendChild(seedInputRow);
      }
    }
    
    return true;
  },

  // UI and panel rendering functions moved from generate-nfts.js
  // Example:
  // updateTraitInfoPanel: function(nft, projectData) { ... },
  // updateSinglePreviewPanel: function(projectData, nft) { ... },
  // showTraitSelectionModal: function(layerName, traitIndex, nft, projectData) { ... },
  // ...other UI helpers...
  updateTraitInfoPanel: function(nft, projectData) {
    // --- NORMALIZE NFT.TRAITS TO MATCH PROJECT LAYERS ---
    if (projectData && projectData.traits && nft && Array.isArray(nft.traits)) {
      // Add missing layers
      projectData.traits.forEach(layer => {
        const exists = nft.traits.some(
          t => (t.layer && (t.layer.id === layer.id || t.layer.name === layer.name)) || t.layer === layer.id || t.layer === layer.name
        );
        if (!exists) {
          nft.traits.push({
            layer: { id: layer.id, name: layer.name },
            trait: { id: 'none', name: 'none' }
          });
        }
      });
      // Remove orphaned traits (layers that no longer exist)
      nft.traits = nft.traits.filter(t => {
        return projectData.traits.some(layer => (t.layer && (t.layer.id === layer.id || t.layer.name === layer.name)) || t.layer === layer.id || t.layer === layer.name);
      });
    }
    // Remove ALL placeholders from the document, not just the first infoList
    document.querySelectorAll('.nft-trait-info-list-placeholder').forEach(ph => ph.remove());
    console.log('[DEBUG] updateTraitInfoPanel called', { nft, projectData });
    // Always remove all placeholders at the very start
    const infoList = document.querySelector('.nft-trait-info-list');
    if (infoList) {
      const placeholders = infoList.querySelectorAll('.nft-trait-info-list-placeholder');
      placeholders.forEach(ph => { ph.remove(); console.log('[DEBUG] Placeholder REMOVED by updateTraitInfoPanel (start)'); });
    }
    // Add some styling to make thumbnails visible
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .nft-trait-thumb {
        width: 100%;
        height: 60px; /* Reduced from auto/100px to fixed 60px */
        max-height: 60px; /* Reduced from 100px to 60px */
        min-height: 60px; /* Reduced from 80px to 60px */
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0,0,0,0.2);
        border-radius: 4px; /* Reduced from 8px to 4px */
        overflow: hidden;
        margin: 4px 0; /* Reduced from 10px to 4px */
        position: relative;
      }
      .nft-trait-thumb img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        padding: 0;
      }
      .nft-trait-info-item {
        width: 100% !important;
        min-width: 0 !important;
        max-width: 100% !important;
        min-height: 60px !important;
        max-height: none !important;
        height: 260px !important;
        box-sizing: border-box;
        aspect-ratio: unset !important;
        position: relative;
        padding: 6px;
        margin-bottom: 0;
        background-color: rgba(0,0,0,0.1);
        border-radius: 6px;
        border: 1px solid rgba(255,255,255,0.05);
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: stretch;
      }
      .trait-items-container {
        display: flex !important;
        flex-direction: column !important;
        gap: 10px;
        width: 100%;
        overflow-y: auto;
        flex: 1 1 auto;
        height: 100%;
        max-height: none;
      }
      .trait-info-title {
        margin: 8px 0; /* Reduced from 12px to 8px */
        font-size: 16px;
        font-weight: 600;
        text-align: center;
        position: sticky;
        top: 0;
        z-index: 2;
        background: #23232b;
      }
      /* Make sure the trait info panel takes up proper space */
      .nft-trait-info-panel {
        flex: 1;
        overflow: auto;
        height: calc(100% - 40px) !important;
        max-height: none !important;
      }
      /* Ensure proper padding around the trait list */
      .nft-trait-info-list {
        padding: 0 !important;
        display: block !important;
        height: 100% !important;
        width: 100% !important;
        overflow-y: auto !important;
      }
      /* Style for traits list card edit button - Independent styling with maximum specificity */
      .traits-list-card .nft-trait-card .nft-trait-edit-btn,
      body #app .project-interface .content-area #generate-nfts .traits-list-card .nft-trait-card .nft-trait-edit-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #f39c12;
        color: #fff;
        border: none;
        border-radius: 3px;
        padding: 0 6px;
        font-size: 10px;
        font-weight: 500;
        cursor: pointer;
        z-index: 100;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        height: 20px;
        min-height: 20px;
        max-height: 20px;
        width: auto;
        min-width: auto;
        max-width: auto;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 1;
      }
      /* Ensure the trait list scrolls properly */
      .nft-trait-info-list {
        max-height: 100%;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: #333 #1a1a1a;
      }
      /* Make trait items smaller */
      .nft-trait-info-item {
        width: 100%;
        max-width: none;
        min-width: 0;
        min-height: 170px;
        height: 170px;
        box-sizing: border-box;
        aspect-ratio: unset !important;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: stretch;
      }
      /* Hide the rarity percentage */
      .nft-trait-rarity {
        display: none;
      }
    `;
    document.head.appendChild(styleElement);
    // DOM-based trait rendering logic
    if (!infoList) return;
    // Always sync card heights first
    const left = document.querySelector('.left-side-column');
    const rightCard = document.querySelector('.traits-list-card');
    if (left && rightCard) {
      const leftHeight = left.offsetHeight;
      rightCard.style.height = leftHeight + 'px';
      rightCard.style.minHeight = leftHeight + 'px';
      rightCard.style.maxHeight = 'none'; // Remove max-height constraint
      rightCard.style.overflowY = 'auto';
    }
    // Clear existing content
    infoList.innerHTML = '';
    // Title is now in HTML structure, no need to create it dynamically
    // Now create the scrollable container for trait cards only
    let traitItemsContainer = infoList.querySelector('.trait-items-container');
    if (!traitItemsContainer) {
      traitItemsContainer = document.createElement('div');
      traitItemsContainer.className = 'trait-items-container';
      infoList.appendChild(traitItemsContainer);
    } else {
      traitItemsContainer.innerHTML = '';
    }
    // Use the traits in their original order (not reversed)
    const traitsInOrder = [...nft.traits];
    // Set the panel and container to appropriate heights
    infoList.style.height = '100%';
    infoList.style.maxHeight = 'none';
    infoList.style.overflow = 'auto';
    traitItemsContainer.style.width = '100%';
    // Render all layers, showing the selected trait or 'none' for each
    if (projectData && projectData.traits) {
      projectData.traits.forEach((layer, idx) => {
        // Always show all layers: find the trait for this layer in the NFT, or use 'none'
        let traitObj = nft.traits.find(t => {
          if (t.layer && layer.id && t.layer.id) return t.layer.id === layer.id;
          return (t.layer && t.layer.name === layer.name) || t.layer === layer.name;
        });
        if (!traitObj) {
          traitObj = { layer: layer, trait: { id: 'none', name: 'none' } };
        }
        const traitItem = document.createElement('div');
        traitItem.className = 'nft-trait-info-item';
        traitItem.style.display = 'flex';
        traitItem.style.visibility = 'visible';
        traitItem.style.opacity = '1';
        traitItem.setAttribute('data-index', idx);
        // --- [DETERMINE NONE REASON] ---
        let noneForced = false;
        if (traitObj.trait.name === 'none' || traitObj.trait === 'none') {
          noneForced = isNoneForcedByRules(layer, nft, projectData);
        }
        // Add edit button for all traits (including 'none')
        const editBtn = document.createElement('button');
        editBtn.className = 'nft-trait-edit-btn';
        editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> EDIT';
        editBtn.setAttribute('data-layer', layer.name || '');
        editBtn.setAttribute('data-idx', idx);
        if (traitObj.trait.name === 'none' || traitObj.trait === 'none') {
          if (noneForced) {
            editBtn.onclick = (e) => {
              e.preventDefault();
              if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
                window.NFTApp.getModule('notificationService').show(
                  'This layer cannot have a trait due to active rules.','error',4000);
              }
            };
          } else {
            editBtn.onclick = () => {
              window.NFTApp.getModule('generateNftsUI').showTraitSelectionModal(layer.name || layer, idx, nft, projectData);
            };
          }
        } else {
          editBtn.onclick = () => {
            window.NFTApp.getModule('generateNftsUI').showTraitSelectionModal(layer.name || layer, idx, nft, projectData);
          };
        }
        // Thumbnail
        const thumbContainer = document.createElement('div');
        thumbContainer.className = 'nft-trait-thumb';
        thumbContainer.style.position = 'relative'; // Ensure stacking context
        thumbContainer.style.overflow = 'visible';
        thumbContainer.style.cursor = 'pointer'; // Add pointer cursor for clickability
        // --- [FORBIDDEN OVERLAY LOGIC: REWRITE] ---
        let forbidden = false;
        let forbiddenMsg = '';
        // Only check for forbidden overlays if this trait is not 'none'
        if (traitObj.trait && traitObj.trait.name !== 'none' && traitObj.trait.id !== 'none') {
          // 1. Check never-combine between-traits rules
          if (projectData && projectData.rules && Array.isArray(projectData.rules)) {
            for (const rule of projectData.rules) {
              if (rule.type === 'never-combine' && rule.appliesTo === 'between-traits' && rule.firstTraits && rule.secondTraits) {
                // Is this trait in the first group?
                const isFirst = rule.firstTraits.some(ft => ft.id === traitObj.trait.id && ft.layerId === layer.id);
                const isSecond = rule.secondTraits.some(st => st.id === traitObj.trait.id && st.layerId === layer.id);
                if (isFirst) {
                  // Is any forbidden second trait present?
                  for (const st of rule.secondTraits) {
                    const found = nft.traits.find(t => t.layer && t.layer.id === st.layerId && t.trait && t.trait.id === st.id);
                    if (found) {
                      forbidden = true;
                      forbiddenMsg = `Forbidden: This trait ("${traitObj.trait.name}") cannot be combined with "${found.trait.name}"`;
                      break;
                    }
                  }
                }
                if (!forbidden && isSecond) {
                  // Is any forbidden first trait present?
                  for (const ft of rule.firstTraits) {
                    const found = nft.traits.find(t => t.layer && t.layer.id === ft.layerId && t.trait && t.trait.id === ft.id);
                    if (found) {
                      forbidden = true;
                      forbiddenMsg = `Forbidden: This trait ("${traitObj.trait.name}") cannot be combined with "${found.trait.name}"`;
                      break;
                    }
                  }
                }
                if (forbidden) break;
              }
            }
          }
          // 2. Check never-combine between-layers rules
          if (!forbidden && projectData && projectData.rules && Array.isArray(projectData.rules)) {
            for (const rule of projectData.rules) {
              if (rule.type === 'never-combine' && rule.appliesTo === 'between-layers') {
                const firstTrait = nft.traits.find(t => t.layer && t.layer.id === rule.firstLayerId && t.trait && t.trait.name !== 'none');
                const secondTrait = nft.traits.find(t => t.layer && t.layer.id === rule.secondLayerId && t.trait && t.trait.name !== 'none');
                if (firstTrait && secondTrait && (layer.id === rule.firstLayerId || layer.id === rule.secondLayerId)) {
                  forbidden = true;
                  forbiddenMsg = `Forbidden: Layer "${rule.firstLayerName || rule.firstLayerId}" and Layer "${rule.secondLayerName || rule.secondLayerId}" should never be combined.`;
                  break;
                }
              }
            }
          }
        }
        // --- [THUMBNAIL CONTENT] ---
        if (traitObj.trait.name === 'none' || traitObj.trait === 'none') {
          // Always use a .trait-selection-img container for centering
          const imgDiv = document.createElement('div');
          imgDiv.className = 'trait-selection-img';
          // Add the 'none' placeholder
          const noneSpan = document.createElement('span');
          noneSpan.className = 'trait-none-placeholder';
          noneSpan.textContent = 'None';
          imgDiv.appendChild(noneSpan);
          if (noneForced) {
            // Add forbidden overlay
            const forbiddenDiv = document.createElement('div');
            forbiddenDiv.className = 'trait-forbidden-overlay';
            forbiddenDiv.innerHTML = `<svg width="60" height="60" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="26" stroke="#ff2222" stroke-width="8" fill="none"/><line x1="15" y1="45" x2="45" y2="15" stroke="#ff2222" stroke-width="8" stroke-linecap="round"/></svg>`;
            imgDiv.appendChild(forbiddenDiv);
          }
          // Clear and append to thumbContainer
          thumbContainer.innerHTML = '';
          thumbContainer.appendChild(imgDiv);
          // Add grey overlay above the thumbnail if forced
          if (noneForced) {
            const greyDiv = document.createElement('div');
            greyDiv.className = 'trait-forbidden-grey';
            greyDiv.style.position = 'absolute';
            greyDiv.style.top = '0';
            greyDiv.style.left = '0';
            greyDiv.style.width = '100%';
            greyDiv.style.height = '100%';
            greyDiv.style.background = 'rgba(40,40,40,0.45)';
            greyDiv.style.zIndex = '2';
            greyDiv.style.pointerEvents = 'none';
            thumbContainer.appendChild(greyDiv);
          }
          // Custom tooltip (app style)
          if (noneForced) {
            const tooltipAnchor = document.createElement('span');
            tooltipAnchor.className = 'custom-tooltip-anchor';
            tooltipAnchor.style.position = 'absolute';
            tooltipAnchor.style.left = '0';
            tooltipAnchor.style.right = '0';
            tooltipAnchor.style.bottom = '-8px';
            tooltipAnchor.style.width = '100%';
            tooltipAnchor.style.display = 'flex';
            tooltipAnchor.style.justifyContent = 'center';
            tooltipAnchor.style.pointerEvents = 'none';
            const tooltip = document.createElement('span');
            tooltip.className = 'custom-tooltip';
            tooltip.textContent = getNoneForcedByRulesDetails(layer, nft, projectData);
            tooltipAnchor.appendChild(tooltip);
            thumbContainer.appendChild(tooltipAnchor);
          }
        } else {
          let imagePath = '';
          const traitName = traitObj.trait.name || traitObj.trait;
          const layerName = traitObj.layer.name || traitObj.layer;
          const layerData = projectData.traits.find(l => l.name === layerName);
          const traitData = layerData && layerData.traits ? layerData.traits.find(t => t.name === traitName) : null;
          if (traitData && traitData.image) {
            imagePath = traitData.image;
          } else if (traitData && traitData.imageData) {
            imagePath = traitData.imageData;
          } else if (typeof traitObj.trait === 'object' && traitObj.trait.image) {
            imagePath = traitObj.trait.image;
          } else if (typeof traitObj.trait === 'object' && traitObj.trait.imageData) {
            imagePath = traitObj.trait.imageData;
          }
          // Clear thumbContainer before stacking overlays
          thumbContainer.innerHTML = '';
          if (imagePath) {
            const img = document.createElement('img');
            img.style.maxWidth = '100%';
            img.style.maxHeight = '100%';
            img.style.objectFit = 'contain';
            img.style.width = 'auto';
            img.style.height = 'auto';
            img.src = imagePath;
            img.alt = traitName;
            img.onerror = function() {
              this.onerror = null;
              this.style.display = 'none';
            };
            thumbContainer.appendChild(img);
          } else {
            const placeholderSvg = document.createElement('div');
            placeholderSvg.innerHTML = `
              <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" style="width: 100%; height: 100%;">
                <rect width="100" height="100" fill="#333"/>
                <path d="M40,42.5a7.5,7.5,0,1,0,7.5,7.5A7.5,7.5,0,0,0,40,42.5Zm16.88,4.38L50,65.62,43.12,57.5,30,73.75H70Z" fill="#666"/>
              </svg>
              <div style="position: absolute; bottom: 0; left: 0; right: 0; background-color: rgba(0,0,0,0.5); color: #999; font-size: 10px; text-align: center; padding: 2px;">${traitName}</div>
            `;
            placeholderSvg.style.display = 'flex';
            placeholderSvg.style.flexDirection = 'column';
            placeholderSvg.style.alignItems = 'center';
            placeholderSvg.style.justifyContent = 'center';
            placeholderSvg.style.width = '100%';
            placeholderSvg.style.height = '100%';
            placeholderSvg.style.position = 'relative';
            thumbContainer.appendChild(placeholderSvg);
          }
          // Remove any previous overlays first
          Array.from(thumbContainer.querySelectorAll('.trait-forbidden-grey, .trait-forbidden-overlay, .trait-forbidden-debug')).forEach(el => el.remove());
          if (forbidden) {
            // Add grey overlay above the thumbnail
            const greyDiv = document.createElement('div');
            greyDiv.className = 'trait-forbidden-grey';
            greyDiv.style.position = 'absolute';
            greyDiv.style.top = '0';
            greyDiv.style.left = '0';
            greyDiv.style.width = '100%';
            greyDiv.style.height = '100%';
            greyDiv.style.background = 'rgba(40,40,40,0.45)';
            greyDiv.style.zIndex = '2';
            greyDiv.style.pointerEvents = 'none';
            thumbContainer.appendChild(greyDiv);
            // Add forbidden icon above the grey overlay
            const forbiddenDiv = document.createElement('div');
            forbiddenDiv.className = 'trait-forbidden-overlay';
            forbiddenDiv.style.position = 'absolute';
            forbiddenDiv.style.top = '50%';
            forbiddenDiv.style.left = '50%';
            forbiddenDiv.style.transform = 'translate(-50%, -50%)';
            forbiddenDiv.style.width = '40px';
            forbiddenDiv.style.height = '40px';
            forbiddenDiv.style.opacity = '1';
            forbiddenDiv.style.background = 'none';
            forbiddenDiv.style.borderRadius = '0';
            forbiddenDiv.style.display = 'flex';
            forbiddenDiv.style.alignItems = 'center';
            forbiddenDiv.style.justifyContent = 'center';
            forbiddenDiv.style.pointerEvents = 'none';
            forbiddenDiv.style.zIndex = '2';
            forbiddenDiv.innerHTML = `<svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="26" stroke="#ff2222" stroke-width="8" fill="none"/><line x1="15" y1="45" x2="45" y2="15" stroke="#ff2222" stroke-width="8" stroke-linecap="round"/></svg>`;
            thumbContainer.appendChild(forbiddenDiv);
            thumbContainer.title = forbiddenMsg;
          } else {
            thumbContainer.title = '';
          }
        }
        // --- [INFO CONTAINER BELOW THUMBNAIL] ---
        // Ensure a new infoContainer is created for each trait card
        const infoContainer = document.createElement('div');
        infoContainer.className = 'nft-trait-info-below';
        infoContainer.style.display = 'flex';
        infoContainer.style.flexDirection = 'column';
        infoContainer.style.justifyContent = 'flex-end';
        infoContainer.style.width = '100%';
        infoContainer.style.marginTop = '6px';
        infoContainer.style.gap = '0';
        // Get trait and layer names
        let traitName = traitObj.trait && traitObj.trait.name ? traitObj.trait.name : (typeof traitObj.trait === 'string' ? traitObj.trait : '');
        let layerName = traitObj.layer && traitObj.layer.name ? traitObj.layer.name : (typeof traitObj.layer === 'string' ? traitObj.layer : '');
        if (!traitName) traitName = 'Unknown';
        if (!layerName) layerName = 'Unknown';
        // Find the correct trait rarity from projectData
        let traitRarity = '';
        if (traitName && layerName && projectData && projectData.traits) {
          const layerData = projectData.traits.find(l => l.name === layerName || l.id === traitObj.layer.id);
          if (layerData && layerData.traits) {
            const traitData = layerData.traits.find(t => t.name === traitName || t.id === traitObj.trait.id);
            if (traitData && typeof traitData.rarity !== 'undefined') {
              traitRarity = traitData.rarity;
            } else {
              traitRarity = 0;
            }
          } else {
            traitRarity = 0;
          }
        } else {
          traitRarity = 0;
        }
        // Trait name element
        const traitNameElem = document.createElement('div');
        traitNameElem.className = 'nft-trait-info-trait-name';
        if (traitName === 'none') {
          if (isNoneForcedByRules(layer, nft, projectData)) {
            traitNameElem.textContent = 'none';
            traitNameElem.style.color = '#e74c3c';
            traitNameElem.style.fontWeight = 'bold';
          } else {
            traitNameElem.textContent = 'none';
            traitNameElem.style.color = '#888';
            traitNameElem.style.fontWeight = 'normal';
          }
        } else if (traitName === 'Unknown') {
          traitNameElem.textContent = 'Unknown';
          traitNameElem.style.color = '#888';
          traitNameElem.style.fontWeight = 'normal';
        } else {
          traitNameElem.textContent = traitName.length > 21 ? traitName.slice(0, 21) + '...' : traitName;
          if (traitName.length > 21) {
            traitNameElem.title = traitName;
          }
        }
        // Bottom line: layer name only (rarity moved to top left)
        const bottomLine = document.createElement('div');
        bottomLine.className = 'nft-trait-info-bottom-line';
        bottomLine.style.display = 'flex';
        bottomLine.style.flexDirection = 'row';
        bottomLine.style.justifyContent = 'flex-start';
        bottomLine.style.alignItems = 'center';
        // Layer name (grey, left)
        const layerNameElem = document.createElement('div');
        layerNameElem.className = 'nft-trait-info-layer-name';
        layerNameElem.textContent = layerName.length > 21 ? layerName.slice(0, 21) + '...' : layerName;
        if (layerName.length > 21) {
          layerNameElem.title = layerName;
        }
        bottomLine.appendChild(layerNameElem);
        
        // Rarity (purple, top left of thumbnail)
        const rarityElem = document.createElement('div');
        rarityElem.className = 'nft-trait-info-rarity';
        rarityElem.style.cssText = `
          position: absolute;
          top: 3px;
          left: 3px;
          color: #8b5cf6;
          background: rgba(0, 0, 0, 0.7);
          padding: 2px 4px;
          border-radius: 3px;
          font-size: 9px;
          font-weight: 600;
          font-family: 'Archivo', sans-serif;
          z-index: 4;
          pointer-events: none;
          border: 1px solid rgba(139, 92, 246, 0.3);
        `;
        if (traitRarity === '' || traitRarity === null || typeof traitRarity === 'undefined') {
          rarityElem.textContent = '—';
        } else {
          rarityElem.textContent = parseFloat(traitRarity).toFixed(2) + '%';
        }
        
        infoContainer.appendChild(traitNameElem);
        infoContainer.appendChild(bottomLine);
        
        traitItem.appendChild(thumbContainer);
        traitItem.appendChild(infoContainer);
        // Create a trait card container to group thumbnail, edit button, and info
        const traitCard = document.createElement('div');
        traitCard.className = 'nft-trait-card';
        traitCard.style.display = 'flex';
        traitCard.style.flexDirection = 'column';
        traitCard.style.alignItems = 'center';
        traitCard.style.justifyContent = 'flex-start';
        traitCard.style.width = '100%';
        traitCard.style.position = 'relative';
        // Add only the required children in order
        traitCard.appendChild(thumbContainer);
        traitCard.appendChild(infoContainer);
        traitCard.appendChild(editBtn);
        
        // Add rarity to trait card container (top left) - positioned relative to traitCard
        traitCard.appendChild(rarityElem);
        
        // Add click handler to thumbnail for full-size popup
        thumbContainer.onclick = (e) => {
          e.stopPropagation(); // Prevent event bubbling
          const traitName = traitObj.trait.name || traitObj.trait;
          const layerName = traitObj.layer.name || traitObj.layer;
          
          // Only show popup if trait has an image or is not 'none'
          if (traitName !== 'none' && traitName !== 'None') {
            this.showTraitFullSizePopup(traitObj, layerName, traitName);
          } else {
            // For 'none' traits, show a simple info popup
            this.showTraitInfoPopup(traitObj, layerName, traitName);
          }
        };
        
        // Remove any other children or elements
        // Append the card to the trait items container
        traitItemsContainer.appendChild(traitCard);
        // (Remove direct appends of thumbContainer, infoContainer, editBtn to traitItem)
      });
    }
    // After rendering all traits, remove any placeholder again (guarantee)
    if (infoList) {
      const placeholders = infoList.querySelectorAll('.nft-trait-info-list-placeholder');
      placeholders.forEach(ph => { ph.remove(); console.log('[DEBUG] Placeholder REMOVED by updateTraitInfoPanel (end)'); });
    }
    // In updateTraitInfoPanel, after getting infoList:
    const traitsPanel = document.querySelector('.traits-list-card');
    const traitInfoPanel = document.querySelector('.nft-trait-info-panel');
    // Title is now in HTML structure, no need to create it dynamically
    // Make trait-items-container the scrollable area
    if (infoList) {
      let traitItemsContainer = infoList.querySelector('.trait-items-container');
      if (!traitItemsContainer) {
        infoList.innerHTML = '<div class="trait-items-container"></div>';
        traitItemsContainer = infoList.querySelector('.trait-items-container');
      }
      traitItemsContainer.style.overflowY = 'auto';
      traitItemsContainer.style.flex = '1 1 auto';
      traitItemsContainer.style.height = '100%';
      traitItemsContainer.style.maxHeight = 'none';
    }
  },
  
  updateSinglePreviewPanel: function(projectData, nft = null) {
    // Store reference to this module for use in event listeners
    const self = this;
    
    // --- KEEP OLD NFT VISIBLE UNTIL NEW ONE RENDERS ---
    // Only clear trait info, not the preview panel
    const traitInfoList = document.querySelector('.nft-trait-info-list');
    if (traitInfoList) traitInfoList.innerHTML = '';
    // --- END CLEAR ---
    if (nft) window.lastGeneratedNFT = nft;
    this.displaySingleNFT(nft);
    // --- FORBIDDEN OVERLAY ON PREVIEW IF VIOLATIONS ---
    // Always remove any previous overlays after rendering the preview
    const previewPanelElem = document.querySelector('.nft-preview-image-area');
    if (previewPanelElem) {
      previewPanelElem.querySelectorAll('.nft-preview-forbidden-overlay').forEach(el => el.remove());
    }
    this.updateTraitInfoPanel(nft, projectData);
    if (nft && projectData && window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNfts')) {
      const violations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(nft, projectData.rules);
      // Only show if there are any violations
      const previewContainer = document.querySelector('.nft-preview-image-area #nft-preview-container');
      if (Array.isArray(violations) && violations.length > 0 && previewContainer) {
        const previewItem = previewContainer.querySelector('.nft-preview-item');
        if (previewItem) {
          // Create overlay container
          let overlay = previewItem.querySelector('.nft-preview-forbidden-overlay');
          if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'nft-preview-forbidden-overlay';
            overlay.style.position = 'absolute';
            overlay.style.top = '8px';
            overlay.style.right = '8px';
            overlay.style.zIndex = '10';
            overlay.style.display = 'flex';
            overlay.style.flexDirection = 'row'; // horizontal alignment
            overlay.style.alignItems = 'center'; // vertical centering
            overlay.style.pointerEvents = 'none';
            overlay.style.gap = '10px'; // space between icon and tooltip
            // Forbidden sign SVG
            overlay.innerHTML = `<div style=\"width:40px;height:40px;display:flex;align-items:center;justify-content:center;opacity:0.95;background:none;\"><svg width=\"40\" height=\"40\" viewBox=\"0 0 60 60\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"30\" cy=\"30\" r=\"26\" stroke=\"#ff2222\" stroke-width=\"8\" fill=\"none\"/><line x1=\"15\" y1=\"45\" x2=\"45\" y2=\"15\" stroke=\"#ff2222\" stroke-width=\"8\" stroke-linecap=\"round\"/></svg></div>`;
            // Message right of icon
            const msg = document.createElement('div');
            msg.className = 'nft-preview-forbidden-msg';
            msg.style.background = 'rgba(30,0,0,0.92)';
            msg.style.color = '#fff';
            msg.style.fontSize = '12px';
            msg.style.fontWeight = 'bold';
            msg.style.padding = '6px 10px';
            msg.style.borderRadius = '6px';
            msg.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
            msg.style.maxWidth = '220px';
            msg.style.textAlign = 'left';
            msg.style.pointerEvents = 'auto';
            msg.textContent = 'This NFT breaks one or more active rules. Fix conflicts before adding to your collection.';
            overlay.appendChild(msg);
            // Position overlay absolutely in previewItem
            previewItem.style.position = 'relative';
            previewItem.appendChild(overlay);
          }
        }
      }
    }
    // Ensure the seed input is not auto-filled with the last NFT's seed
    setTimeout(() => {
      const seedInput = document.getElementById('single-seed-input');
      const seedTooltip = document.getElementById('single-seed-input-tooltip');
      if (seedInput && seedTooltip) {
        seedInput.value = '';
        seedTooltip.style.opacity = '1';
      }
      // --- Update the seed box with the correct deterministic seed ---
      const seedBox = document.querySelector('.nft-seed-box');
      if (seedBox && projectData && nft) {
        const deterministicSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, nft);
        seedBox.textContent = deterministicSeed;
        if (window.lastGeneratedNFT) window.lastGeneratedNFT.seed = deterministicSeed;
      }
    }, 0);
  },
  
  randomizeSingleNFT: function(projectData, overrideRules = false) {
    // Always validate project data before generating
    const isValid = window.NFTApp.getModule('generateNfts').validateProjectData(projectData, true);
    if (!isValid) {
      this.showError('You need to add at least one trait layer and at least two traits before generating NFTs.');
      enableNftGenButtons();
      return;
    }
    disableNftGenButtons();
    // Show loading overlay with transparent background
    // Note: We're not clearing the preview panel, so the previous NFT stays visible
    this.showLoadingOverlay(overrideRules ? "Generating NFT (Overriding Rules)..." : "Generating NFT...", true);
    // Enable rule application debugging for this generation
    window.DEBUG_RULE_APPLICATION = true;
    console.log("============================================");
    console.log(`NFT GENERATION STARTED: ${overrideRules ? "RULES OVERRIDDEN" : "FOLLOWING RULES"}`);
    console.log(`Number of rules: ${projectData.rules ? projectData.rules.length : 0}`);
    if (projectData.rules && projectData.rules.length > 0) {
      console.log("Rule types:");
      const ruleCounts = {};
      projectData.rules.forEach(rule => {
        ruleCounts[rule.type] = (ruleCounts[rule.type] || 0) + 1;
      });
      Object.entries(ruleCounts).forEach(([type, count]) => {
        console.log(`- ${type}: ${count}`);
      });
    }
    console.log("============================================");
    try {
      // Generate a seed that combines random number with timestamp to ensure uniqueness
      const timestamp = Date.now();
      const randomPart = Math.floor(Math.random() * 1000000000);
      const randomSeed = randomPart + "-" + timestamp;
      console.log("Using unique combined random seed for generation:", randomSeed);
      // Generate a single NFT with explicit overrideRules parameter
      // The generateSingleNFT function now returns the NFT asynchronously (Promise)
      let nftPromise;
      try {
        nftPromise = window.NFTApp.getModule('generateNfts').generateSingleNFT(
          projectData, overrideRules, randomSeed, this.darkModeEnabled
        );
        nftPromise.then(nft => {
        console.log('[DEBUG] NFT generated:', nft);
        // Check if there are any rule violations
        if (!overrideRules && projectData.rules && projectData.rules.length > 0) {
            let violations = window.NFTApp.getModule("generateNfts").checkForRuleViolations(nft, projectData.rules);
            let fixAttempts = 0;
            const maxFixAttempts = 5;
            // Debug: log all rules
            console.log('[DEBUG] Project rules:', projectData.rules);
            while (violations.length > 0 && fixAttempts < maxFixAttempts) {
              // Debug: log current trait order
              console.log(`[DEBUG] Fix attempt ${fixAttempts + 1}: Current trait order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
              let fixed = false;
              for (const violation of violations) {
                // Layer above layer
                let match = violation.match(/Rule Violation: Layer "(.+?)" must be rendered immediately above "(.+?)"/);
                if (match) {
                  const aboveName = match[1];
                  const belowName = match[2];
                  const aboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === aboveName);
                  const belowIdx = nft.traits.findIndex(t => t.layer && t.layer.name === belowName);
                  console.log(`[DEBUG] Attempting to move layer '${aboveName}' (idx ${aboveIdx}) above '${belowName}' (idx ${belowIdx})`);
                  if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx !== belowIdx + 1) {
                    const [aboveTrait] = nft.traits.splice(aboveIdx, 1);
                    nft.traits.splice(belowIdx + 1, 0, aboveTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved layer '${aboveName}' to above '${belowName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                // Trait above trait
                match = violation.match(/Rule Violation: Trait "(.+?)" must be rendered immediately above "(.+?)"/);
                if (match) {
                  const aboveTraitName = match[1];
                  const belowTraitName = match[2];
                  const aboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);
                  const belowIdx = nft.traits.findIndex(t => t.trait && t.trait.name === belowTraitName);
                  console.log(`[DEBUG] Attempting to move trait '${aboveTraitName}' (idx ${aboveIdx}) above '${belowTraitName}' (idx ${belowIdx})`);
                  if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx !== belowIdx + 1) {
                    const [aboveTrait] = nft.traits.splice(aboveIdx, 1);
                    nft.traits.splice(belowIdx + 1, 0, aboveTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved trait '${aboveTraitName}' to above '${belowTraitName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                // Trait above layer
                match = violation.match(/Rule Violation: Trait "(.+?)" must be rendered immediately above layer "(.+?)"/);
                if (match) {
                  const traitName = match[1];
                  const layerName = match[2];
                  const traitIdx = nft.traits.findIndex(t => t.trait && t.trait.name === traitName);
                  const layerIdx = nft.traits.findIndex(t => t.layer && t.layer.name === layerName);
                  console.log(`[DEBUG] Attempting to move trait '${traitName}' (idx ${traitIdx}) above layer '${layerName}' (idx ${layerIdx})`);
                  if (traitIdx !== -1 && layerIdx !== -1 && traitIdx !== layerIdx + 1) {
                    const [traitObj] = nft.traits.splice(traitIdx, 1);
                    nft.traits.splice(layerIdx + 1, 0, traitObj);
                    fixed = true;
                    console.log(`[DEBUG] Moved trait '${traitName}' to above layer '${layerName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                // Layer above trait
                match = violation.match(/Rule Violation: Layer "(.+?)" must be rendered immediately above trait "(.+?)"/);
                if (match) {
                  const layerName = match[1];
                  const traitName = match[2];
                  const layerIdx = nft.traits.findIndex(t => t.layer && t.layer.name === layerName);
                  const traitIdx = nft.traits.findIndex(t => t.trait && t.trait.name === traitName);
                  console.log(`[DEBUG] Attempting to move layer '${layerName}' (idx ${layerIdx}) above trait '${traitName}' (idx ${traitIdx})`);
                  if (layerIdx !== -1 && traitIdx !== -1 && layerIdx !== traitIdx + 1) {
                    const [layerObj] = nft.traits.splice(layerIdx, 1);
                    nft.traits.splice(traitIdx + 1, 0, layerObj);
                    fixed = true;
                    console.log(`[DEBUG] Moved layer '${layerName}' to above trait '${traitName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                
                // ALWAYS ABOVE violations (Layer above Layer - not immediately)
                match = violation.match(/Rule Violation: Layer "(.+?)" must be rendered above "(.+?)"/);
                if (match) {
                  const aboveName = match[1];
                  const belowName = match[2];
                  const aboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === aboveName);
                  const belowIdx = nft.traits.findIndex(t => t.layer && t.layer.name === belowName);
                  console.log(`[DEBUG] Attempting to move layer '${aboveName}' (idx ${aboveIdx}) above '${belowName}' (idx ${belowIdx})`);
                  if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx <= belowIdx) {
                    const [aboveTrait] = nft.traits.splice(aboveIdx, 1);
                    nft.traits.splice(belowIdx, 0, aboveTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved layer '${aboveName}' to above '${belowName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                
                // ALWAYS ABOVE violations (Trait above Trait - not immediately)
                match = violation.match(/Rule Violation: Trait "(.+?)" must be rendered above "(.+?)"/);
                if (match) {
                  const aboveTraitName = match[1];
                  const belowTraitName = match[2];
                  const aboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);
                  const belowIdx = nft.traits.findIndex(t => t.trait && t.trait.name === belowTraitName);
                  console.log(`[DEBUG] Attempting to move trait '${aboveTraitName}' (idx ${aboveIdx}) above '${belowTraitName}' (idx ${belowIdx})`);
                  if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx <= belowIdx) {
                    const [aboveTrait] = nft.traits.splice(aboveIdx, 1);
                    nft.traits.splice(belowIdx, 0, aboveTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved trait '${aboveTraitName}' to above '${belowTraitName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                
                // ALWAYS ABOVE violations (Trait above Layer - not immediately)
                match = violation.match(/Rule Violation: Trait "(.+?)" must be rendered above layer "(.+?)"/);
                if (match) {
                  const traitName = match[1];
                  const layerName = match[2];
                  const traitIdx = nft.traits.findIndex(t => t.trait && t.trait.name === traitName);
                  const layerIdx = nft.traits.findIndex(t => t.layer && t.layer.name === layerName);
                  console.log(`[DEBUG] Attempting to move trait '${traitName}' (idx ${traitIdx}) above layer '${layerName}' (idx ${layerIdx})`);
                  if (traitIdx !== -1 && layerIdx !== -1 && traitIdx <= layerIdx) {
                    const [traitObj] = nft.traits.splice(traitIdx, 1);
                    nft.traits.splice(layerIdx, 0, traitObj);
                    fixed = true;
                    console.log(`[DEBUG] Moved trait '${traitName}' to above layer '${layerName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                
                // ALWAYS ABOVE violations (Layer above Trait - not immediately)
                match = violation.match(/Rule Violation: Layer "(.+?)" must be rendered above trait "(.+?)"/);
                if (match) {
                  const layerName = match[1];
                  const traitName = match[2];
                  const layerIdx = nft.traits.findIndex(t => t.layer && t.layer.name === layerName);
                  const traitIdx = nft.traits.findIndex(t => t.trait && t.trait.name === traitName);
                  console.log(`[DEBUG] Attempting to move layer '${layerName}' (idx ${layerIdx}) above trait '${traitName}' (idx ${traitIdx})`);
                  if (layerIdx !== -1 && traitIdx !== -1 && layerIdx <= traitIdx) {
                    const [layerObj] = nft.traits.splice(layerIdx, 1);
                    nft.traits.splice(traitIdx, 0, layerObj);
                    fixed = true;
                    console.log(`[DEBUG] Moved layer '${layerName}' to above trait '${traitName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  continue;
                }
                
                // ALWAYS BELOW and IMMEDIATELY BELOW violations can be handled similarly
                // For below rules, we need to move the first item to BEFORE the second item
                match = violation.match(/Rule Violation: Layer "(.+?)" must be rendered (immediately )?below "(.+?)"/);
                if (match) {
                  const belowName = match[1];
                  const aboveName = match[3];
                  const belowIdx = nft.traits.findIndex(t => t.layer && t.layer.name === belowName);
                  const aboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === aboveName);
                  const isImmediate = !!match[2];
                  console.log(`[DEBUG] Attempting to move layer '${belowName}' (idx ${belowIdx}) below '${aboveName}' (idx ${aboveIdx})`);
                  if (isImmediate) {
                  if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx !== aboveIdx - 1) {
                    const [belowTrait] = nft.traits.splice(belowIdx, 1);
                      const newAboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === aboveName);
                      nft.traits.splice(newAboveIdx, 0, belowTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved layer '${belowName}' to immediately below '${aboveName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  } else {
                  if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx >= aboveIdx) {
                    const [belowTrait] = nft.traits.splice(belowIdx, 1);
                      const newAboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === aboveName);
                      nft.traits.splice(newAboveIdx, 0, belowTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved layer '${belowName}' to below '${aboveName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                    }
                  }
                  continue;
                }
                
                // Trait below rules
                match = violation.match(/Rule Violation: Trait "(.+?)" must be rendered (immediately )?below "(.+?)"/);
                if (match) {
                  const belowTraitName = match[1];
                  const aboveTraitName = match[3];
                  const belowIdx = nft.traits.findIndex(t => t.trait && t.trait.name === belowTraitName);
                  const aboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);
                  const isImmediate = !!match[2];
                  console.log(`[DEBUG] Attempting to move trait '${belowTraitName}' (idx ${belowIdx}) below '${aboveTraitName}' (idx ${aboveIdx})`);
                  if (isImmediate) {
                  if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx !== aboveIdx - 1) {
                    const [belowTrait] = nft.traits.splice(belowIdx, 1);
                      const newAboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);
                      nft.traits.splice(newAboveIdx, 0, belowTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved trait '${belowTraitName}' to immediately below '${aboveTraitName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  } else {
                  if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx >= aboveIdx) {
                    const [belowTrait] = nft.traits.splice(belowIdx, 1);
                      const newAboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);
                      nft.traits.splice(newAboveIdx, 0, belowTrait);
                    fixed = true;
                    console.log(`[DEBUG] Moved trait '${belowTraitName}' to below '${aboveTraitName}'. New order:`, nft.traits.map(t => t.layer && t.layer.name ? t.layer.name : (t.trait && t.trait.name ? t.trait.name : '[unknown]')).join(' -> '));
                  }
                  }
                  continue;
                }
              }
              if (!fixed) break; // No more fixable violations
              violations = window.NFTApp.getModule("generateNfts").checkForRuleViolations(nft, projectData.rules);
              fixAttempts++;
            }
          if (violations.length > 0) {
            console.error("============================================");
            console.error("RULE VIOLATIONS DETECTED!");
            violations.forEach((violation, index) => {
              console.error(`Violation ${index + 1}: ${violation}`);
            });
            console.error("============================================");
            this.showError("Rule violations detected. Check the console for details.");
            } else if (fixAttempts > 0) {
              // If we fixed something, regenerate the NFT image and update UI
              if (window.regenerateNftImageAndSeed) {
                window.lastGeneratedNFT = nft;
                window.regenerateNftImageAndSeed();
          } else {
                this.updateSinglePreviewPanel(projectData, nft);
                this.updateTraitInfoPanel(nft, projectData);
              }
          }
        }
        window.DEBUG_RULE_APPLICATION = false;
        if (!nft.imageData || nft.imageData === 'undefined' || (typeof nft.imageData === 'string' && nft.imageData.includes('/undefined'))) {
          console.error("Generated NFT has invalid image data:", nft.imageData);
          nft.imageData = '';
        }
        const singleSeedToggle = document.getElementById('single-seed-toggle');
        const singleSeedInput = document.getElementById('single-seed-input');
        const generateSeedBtn = document.getElementById('generate-seed-nft-btn');
        const wasSeedToggleEnabled = singleSeedToggle ? singleSeedToggle.classList.contains('active') : false;
          // Do not auto-populate the seed input field with the generated NFT's seed
          if (generateSeedBtn) {
            generateSeedBtn.disabled = !wasSeedToggleEnabled;
        }
        this.updateSinglePreviewPanel(projectData, nft);
        console.log('[DEBUG] Called updateSinglePreviewPanel with NFT:', nft);
        this.updateTraitInfoPanel(nft, projectData);
        // --- ENFORCE DETERMINISTIC SEED FORMAT FOR ALL NFTS ---
        if (nft && projectData) {
          let deterministicSeed = '';
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNfts')) {
            deterministicSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, nft);
          }
          if (deterministicSeed) {
            nft.seed = deterministicSeed;
            window.lastGeneratedNFT.seed = deterministicSeed;
            setTimeout(() => {
              const seedBox = document.querySelector('.nft-seed-box');
              if (seedBox) seedBox.textContent = deterministicSeed;
              const seedNumber = document.querySelector('.seed-number');
              if (seedNumber) seedNumber.textContent = deterministicSeed;
            }, 0);
          }
        }
        // --- END ENFORCE DETERMINISTIC SEED FORMAT ---
        enableNftGenButtons();
      });
      } catch (error) {
        console.error("Error generating NFT:", error);
        this.showError("Failed to generate NFT: " + error.message);
        enableNftGenButtons();
      } finally {
        this.hideLoadingOverlay();
        window.DEBUG_RULE_APPLICATION = false;
        enableNftGenButtons();
      }
    } catch (error) {
      console.error("Error initiating NFT generation:", error);
      this.showError("Failed to start NFT generation: " + error.message);
      this.hideLoadingOverlay();
      window.DEBUG_RULE_APPLICATION = false;
      enableNftGenButtons();
    }
  },

  generateSingleNFTWithSeed: function(projectData) {
    // Always validate project data before generating
    const isValid = window.NFTApp.getModule('generateNfts').validateProjectData(projectData, true);
    if (!isValid) {
      this.showError('You need to add at least one trait layer and at least two traits before generating NFTs.');
      enableNftGenButtons();
      return;
    }
    disableNftGenButtons();
    // Get the seed input field and its value
    const singleSeedInput = document.getElementById('single-seed-input');
    const singleSeedToggle = document.getElementById('single-seed-toggle');
    if (!singleSeedInput || !singleSeedInput.value) {
      // Show notification that seed is required
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Please enter a seed number", 
          "warning", 
          3000
        );
      }
      enableNftGenButtons();
      return;
    }
    const wasToggleEnabled = singleSeedToggle ? singleSeedToggle.classList.contains('active') : false;
    const seedValue = singleSeedInput.value;
    console.log(`Generating NFT with specific seed: ${seedValue}`);
    this.showLoadingOverlay("Generating NFT with specific seed...", true);
    // Always use Promise-based async NFT generation
    let generatePromise;
    try {
      generatePromise = window.NFTApp.getModule('generateNfts').generateSingleNFT(
        projectData, false, seedValue, this.darkModeEnabled
      );
      if (!generatePromise || typeof generatePromise.then !== 'function') {
        throw new Error('NFT generation did not return a Promise.');
      }
    } catch (err) {
      this.hideLoadingOverlay();
      console.error(`Error initiating NFT generation with seed ${seedValue}:`, err);
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Error generating NFT with this seed",
          "error",
          3000
        );
      }
      enableNftGenButtons();
      return;
    }
    generatePromise.then(nft => {
      if (!nft || !nft.imageData) {
        throw new Error('Invalid NFT generated for this seed.');
      }
      window.lastGeneratedNFT = nft;
      
      // Update project data to include this NFT as the last generated NFT
      if (projectData) {
        projectData.lastGeneratedNFT = {
          seed: nft.seed,
          traits: nft.traits || {},
          rarity: nft.rarity || 'Unknown',
          rarityScore: nft.rarityScore || 0,
          timestamp: Date.now()
        };
        console.log('[DEBUG] Updated project data with last generated NFT:', nft.seed);
      }
      
      // Also update window.currentProject if it exists
      if (window.currentProject) {
        window.currentProject.lastGeneratedNFT = {
          seed: nft.seed,
          traits: nft.traits || {},
          rarity: nft.rarity || 'Unknown',
          rarityScore: nft.rarityScore || 0,
          timestamp: Date.now()
        };
        console.log('[DEBUG] Updated window.currentProject with last generated NFT:', nft.seed);
      }
      
      this.updateSinglePreviewPanel(projectData, nft);
      this.updateTraitInfoPanel(nft, projectData);
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "NFT generated with seed: " + seedValue, 
          "success", 
          3000
        );
      }
      setTimeout(() => {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNfts')) {
          window.NFTApp.getModule('generateNfts').verifySeedConsistency(projectData);
        }
      }, 300);
      if (singleSeedToggle && singleSeedToggle.classList.contains('active') !== wasToggleEnabled) {
        if (wasToggleEnabled) {
          singleSeedToggle.classList.add('active');
        } else {
          singleSeedToggle.classList.remove('active');
        }
        singleSeedToggle.dispatchEvent(new Event('change'));
      }
      console.log("Successfully generated NFT with seed:", seedValue);
      enableNftGenButtons();
    }).catch(err => {
      this.hideLoadingOverlay();
      console.error(`Error generating NFT with seed ${seedValue}:`, err);
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Error generating NFT with this seed", 
          "error", 
          3000
        );
      }
      enableNftGenButtons();
    }).finally(() => {
      this.hideLoadingOverlay();
      enableNftGenButtons();
    });
  },

  generateSeedNFT: function(projectData) {
    // Call our new implementation that handles seed verification animation
    this.generateSingleNFTWithSeed(projectData);
  },

  displaySingleNFT: function(nft) {
    const previewPanelElem = document.querySelector('.nft-preview-image-area');
    if (!previewPanelElem) {
      console.warn('[DEBUG] .nft-preview-image-area not found in DOM');
      if (window.NFTApp) window.NFTApp.isRenderingNFT = false;
      return;
    }
    
    if (nft) window.lastGeneratedNFT = nft;
    // Set rendering flag to prevent placeholder logic
    if (window.NFTApp) window.NFTApp.isRenderingNFT = true;
    console.log('[DEBUG] displaySingleNFT called with NFT:', nft);
    if (nft && nft.imageData) {
      console.log('[DEBUG] NFT imageData:', nft.imageData.substring(0, 100));
    }
    
    // Render inside .nft-preview-panel
    let previewContainer = previewPanelElem.querySelector('#nft-preview-container');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'nft-preview-container';
      previewContainer.style.position = 'relative';
      previewContainer.style.width = '100%';
      previewContainer.style.height = '100%';
      previewPanelElem.appendChild(previewContainer);
    }
    
    // Ensure preview container has proper positioning for layered rendering
    previewContainer.style.position = 'relative';
    previewContainer.style.width = '100%';
    previewContainer.style.height = '100%';
    
    // Remove placeholder messages if present (welcome messages disabled)
    const placeholderElem = previewPanelElem.querySelector('.nft-preview-placeholder');
    if (placeholderElem && placeholderElem.parentNode) {
      placeholderElem.parentNode.removeChild(placeholderElem);
    }
    
    // Only render new NFT if we have valid image data
    if (nft && nft.imageData) {
      // Dim existing NFTs and render new one on top
      const existingItems = previewContainer.querySelectorAll('.nft-preview-item');
      existingItems.forEach(item => {
        item.style.opacity = '0.3';
        item.style.zIndex = '1';
      });
      
      // Create new NFT preview item
      const previewItem = document.createElement('div');
      previewItem.className = 'nft-preview-item';
      previewItem.style.position = 'absolute';
      previewItem.style.top = '0';
      previewItem.style.left = '0';
      previewItem.style.width = '100%';
      previewItem.style.height = '100%';
      previewItem.style.zIndex = '2';
      previewItem.style.opacity = '1';
      previewItem.style.display = 'flex';
      previewItem.style.alignItems = 'center';
      previewItem.style.justifyContent = 'center';
      previewItem.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      previewItem.style.borderRadius = '8px';
      
      // Create the image element
      const img = document.createElement('img');
      if (typeof window.traitImageLoader !== 'undefined' && window.traitImageLoader.normalizeImageUrl) {
        img.src = window.traitImageLoader.normalizeImageUrl(nft.imageData);
      } else {
        img.src = nft.imageData.startsWith('data:') ? nft.imageData : `${nft.imageData}?t=${Date.now()}`;
      }
      img.alt = "NFT Preview";
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      
      // Add error handling
      img.onerror = function() {
        console.error("Failed to load NFT preview image");
        this.onerror = null;
        this.style.display = 'none';
      };
      
      previewItem.appendChild(img);
      previewContainer.appendChild(previewItem);
      
      // Add click handler to open full-size NFT popup
      previewItem.addEventListener('click', () => {
        this.openNftPopup(nft);
      });
      
      // Add cursor pointer to indicate clickable
      previewItem.style.cursor = 'pointer';
      
      // Hide loading overlay once image is loaded
      this.hideLoadingOverlay();
    } else if (nft && !nft.imageData) {
      // If NFT exists but no image data, show loading or placeholder
      console.log('[DEBUG] NFT exists but no imageData, showing placeholder');
      this.showLoadingOverlay("Generating NFT...", true);
    } else {
      // If no NFT at all, do nothing - keep existing content
      console.log('[DEBUG] No NFT provided, keeping existing content');
    }
    
    // CRITICAL: Always update the traits panel to match the displayed NFT
    if (nft && this.projectData) {
      console.log('[DEBUG] displaySingleNFT: Updating traits panel to match displayed NFT');
      this.updateTraitInfoPanel(nft, this.projectData);
    } else if (nft && window.currentProject) {
      console.log('[DEBUG] displaySingleNFT: Updating traits panel with currentProject');
      this.updateTraitInfoPanel(nft, window.currentProject);
    } else {
      console.log('[DEBUG] displaySingleNFT: No project data available for traits panel update');
    }
    
    if (window.NFTApp) window.NFTApp.isRenderingNFT = false;
  },

  displayPreview: function(previewNFTs) {
    const previewContainer = document.getElementById("nft-preview-container");
    const previewGrid = previewContainer.querySelector(".nft-preview-grid");
    previewGrid.innerHTML = "";
    previewNFTs.forEach(function(nft) {
      const previewItem = document.createElement("div");
      previewItem.className = "nft-preview-item";
      previewItem.innerHTML =
        '<div class="nft-preview-image">' +
          '<img src="' + nft.imageData + '" alt="NFT Preview">' +
        '</div>';
      previewGrid.appendChild(previewItem);
    });
    previewContainer.style.display = "block";
  },

  saveNFTs: function(nfts, projectData) {
    // Create a zip file containing all NFTs
    const zip = new JSZip();
    // Add NFTs to zip
    nfts.forEach((nft, index) => {
      // Convert data URL to blob
      const imageBlob = this.dataURLtoBlob(nft.imageData);
      // Add image to zip
      const imageName = `${projectData.filenamePrefix || "NFT"} #${(index + 1).toString().padStart(4, "0")}.png`;
      zip.file(imageName, imageBlob);
      // Create metadata
      const metadata = {
        name: `${projectData.filenamePrefix || "NFT"} #${(index + 1).toString().padStart(4, "0")}`,
        description: projectData.defaultNftDescription || "",
        image: imageName,
        attributes: nft.traits.map(trait => ({
          trait_type: trait.layer,
          value: trait.trait
        }))
      };
      // Add rarity_rank if enabled in settings
      if (projectData.settings && projectData.settings.includeRarityRankInMetadata && typeof nft.rarity_rank !== 'undefined') {
        metadata.rarity_rank = nft.rarity_rank;
      }
      // Add metadata to zip
      const metadataName = `${projectData.filenamePrefix || "NFT"} #${(index + 1).toString().padStart(4, "0")}.json`;
      zip.file(metadataName, JSON.stringify(metadata, null, 2));
    });
    // Generate zip file
    zip.generateAsync({ type: "blob" }).then(content => {
      // Create download link
      const a = document.createElement("a");
      a.href = URL.createObjectURL(content);
      a.download = `${projectData.name || "NFT Collection"}.zip`;
      // Trigger download
      document.body.appendChild(a);
      a.click();
      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
      // Show success message
      this.showSuccess("NFT collection generated successfully!");
    });
  },

  dataURLtoBlob: function(dataURL) {
    const parts = dataURL.split(";base64,");
    const contentType = parts[0].split(":")[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  },

  showLoadingOverlay: function(message, transparent = false) {
    // Create loading overlay if it doesn't exist
    // Use a specific ID for NFT generation to avoid conflicts with project loading/saving
    let overlay = document.getElementById("nft-loading-overlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "nft-loading-overlay";
      overlay.className = transparent ? "loading-overlay transparent" : "loading-overlay";
      overlay.innerHTML = `
        <div class="loading-content">
          <div class="loading-spinner"></div>
          <div class="loading-message">${message}</div>
        </div>
      `;
      document.body.appendChild(overlay);
    } else {
      // Update the message and style
      const loadingMsg = overlay.querySelector(".loading-message");
      if (loadingMsg) {
        loadingMsg.textContent = message;
      }
      
      // Update transparency class
      if (transparent) {
        overlay.classList.add("transparent");
      } else {
        overlay.classList.remove("transparent");
      }
    }
    
    // Show the overlay
    overlay.style.display = "flex";
  },

  hideLoadingOverlay: function() {
    const overlay = document.getElementById("nft-loading-overlay");
    if (overlay) {
      overlay.style.display = "none";
    }
  },

  openNftPopup: function(nft) {
    if (!nft || !nft.imageData) {
      console.warn('No NFT or image data available for popup');
      return;
    }

    // Remove existing popup if any
    const existingPopup = document.getElementById('nft-fullscreen-popup');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create popup overlay
    const popup = document.createElement('div');
    popup.id = 'nft-fullscreen-popup';
    popup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background-color: rgba(0, 0, 0, 0.9);
      z-index: 10000;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
    `;

    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.className = 'popup-content';
    popupContent.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      background: #222;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
      cursor: default;
    `;

    // Create close button
    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.style.cssText = `
      position: absolute;
      top: 10px;
      right: 15px;
      background: none;
      border: none;
      color: #fff;
      font-size: 24px;
      cursor: pointer;
      z-index: 10001;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
    `;

    // Create NFT image
    const nftImage = document.createElement('img');
    nftImage.className = 'nft-image';
    nftImage.src = nft.imageData;
    nftImage.style.cssText = `
      max-width: 100%;
      max-height: 80vh;
      object-fit: contain;
      display: block;
      border-radius: 8px;
    `;

    // Assemble popup - only display the full-size NFT image
    popupContent.appendChild(closeBtn);
    popupContent.appendChild(nftImage);
    popup.appendChild(popupContent);

    // Add to document
    document.body.appendChild(popup);

    // Event handlers
    const closePopup = () => {
      popup.remove();
    };

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      closePopup();
    });

    popup.addEventListener('click', (e) => {
      if (e.target === popup) {
        closePopup();
      }
    });

    // Close on Escape key
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', handleKeyDown);
      }
    };
    document.addEventListener('keydown', handleKeyDown);

    // Prevent body scroll when popup is open
    document.body.style.overflow = 'hidden';

    // Restore body scroll when popup is closed
    popup.addEventListener('click', () => {
      document.body.style.overflow = '';
    });
  },

  showError: function(message) {
    // ... function body copied from generate-nfts.js ...
  },

  showSuccess: function(message) {
    // ... function body copied from generate-nfts.js ...
  },

  showTraitSelectionModal: function(layerName, traitIndex, nft, projectData) {
      // Remove any existing modal
      let modal = document.getElementById('trait-selection-modal');
      if (modal) modal.remove();
      // Create modal overlay
      modal = document.createElement('div');
      modal.id = 'trait-selection-modal';
      modal.className = 'modal-overlay';
      // CRITICAL: Use setProperty with priority to override CSS !important rules
      // Must be above: Saved Seeds (10000), Batch Gen (20000), Edit Modal (100000)
      modal.style.setProperty('z-index', '1000000', 'important');
      modal.style.setProperty('position', 'fixed', 'important');
    // Modal HTML with loading state in body - Matching Dark NFT Traits Configuration aesthetic
      modal.innerHTML = `
        <div class="select-trait-overlay">
          <div class="select-trait-container">
            <div class="select-trait-header">
              <div class="select-trait-title-container">
                <h2 class="select-trait-title">Select Trait for ${layerName}</h2>
                <div class="select-trait-tip">* Choose a trait to replace the current one for this layer</div>
              </div>
              <button class="select-trait-close-btn" title="Close modal">&times;</button>
            </div>
            <div class="select-trait-body">
              <div class="select-trait-loading">
                <div>Loading traits...</div>
                <div class="trait-list-spinner">
                  <div class="trait-spinner"></div>
                </div>
              </div>
            </div>
            <div class="select-trait-footer">
              <button id="modal-cancel-btn" class="btn btn-secondary">Cancel</button>
              <button id="modal-apply-btn" class="btn btn-primary">Apply</button>
            </div>
          </div>
        </div>
      `;
    // Add spinner animation CSS if not present
    if (!document.getElementById('trait-spinner-style')) {
      const style = document.createElement('style');
      style.id = 'trait-spinner-style';
      style.textContent = `@keyframes trait-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`;
      document.head.appendChild(style);
    }
      document.body.appendChild(modal);
      // Attach NFT and projectData to the modal for later reference
      modal._nft = nft;
      modal._projectData = projectData;
      modal.style.display = 'flex';
      setTimeout(() => { modal.style.display = 'flex'; }, 50);
    // Close/cancel button logic (works even during loading)
    const closeBtn = modal.querySelector('.select-trait-close-btn');
    const cancelBtn = modal.querySelector('#modal-cancel-btn');
    const applyBtn = modal.querySelector('#modal-apply-btn');
    
    if (closeBtn) closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    
    // CRITICAL: Apply button handler
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        console.log('[Generate NFTs UI] Apply button clicked');
        this.applyTraitChange(modal, layerName, traitIndex, nft, projectData);
      });
    }
    // After a short delay, populate the trait list as usual (simulate calculation time)
    setTimeout(() => {
      // Only proceed if modal is still open
      if (!document.body.contains(modal)) return;
      // Replace modal body with the full trait selection UI (current implementation)
      const modalBody = modal.querySelector('.select-trait-body');
      if (!modalBody) return;
      // --- BEGIN: Original trait list population code ---
      modalBody.innerHTML = `
        <div class="select-trait-search-section">
          <input type="text" class="trait-search-input" placeholder="Search traits...">
          <button class="trait-search-clear">Clear</button>
        </div>
        <div class="trait-count-indicator"></div>
        <div class="select-trait-list"></div>
      `;
      // Now run the rest of the trait list population logic as before
      const traitSelectionList = modalBody.querySelector('.select-trait-list');
      const layer = projectData.traits.find(l => l.name === layerName || l.id === layerName);
      if (!layer) {
        traitSelectionList.innerHTML = '<div style="color: #aaa;">Layer not found.</div>';
      } else {
        // Only use rules relevant to this layer
        const layerRules = getRulesForLayer(projectData, layer);
        // Add 'none' option
        const noneThumb = document.createElement('div');
        noneThumb.className = 'trait-selection-thumb';
        noneThumb.setAttribute('data-trait-id', 'none');
        noneThumb.setAttribute('data-layer-id', layer.id);
        noneThumb.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 120px;
          background: #2a2a2a;
          border: 2px solid #444;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 8px;
          box-sizing: border-box;
        `;
        // Create image container for 'none' (centered)
        const noneImgDiv = document.createElement('div');
        noneImgDiv.className = 'trait-selection-img';
        noneImgDiv.style.cssText = `
          width: 80px;
          height: 80px;
          background: #333;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 8px;
          border: 1px solid #555;
        `;
        const noneSpan = document.createElement('span');
        noneSpan.className = 'trait-none-placeholder';
        noneSpan.textContent = 'None';
        noneSpan.style.cssText = 'color: #999; font-size: 14px; font-weight: 500;';
        noneImgDiv.appendChild(noneSpan);
        noneThumb.appendChild(noneImgDiv);
        // Name
        const noneNameDiv = document.createElement('div');
        noneNameDiv.className = 'trait-selection-name custom-tooltip-anchor';
        noneNameDiv.innerHTML = `<span class="trait-name-ellipsis-select">none</span>`;
        noneNameDiv.style.cssText = `
          font-size: 12px;
          color: #ccc;
          text-align: center;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          width: 100%;
          font-weight: 500;
        `;
        noneThumb.appendChild(noneNameDiv);
        traitSelectionList.appendChild(noneThumb);
        // Add trait options
        layer.traits.forEach(trait => {
          const thumb = document.createElement('div');
          thumb.className = 'trait-selection-thumb';
          thumb.setAttribute('data-trait-id', trait.id);
          thumb.setAttribute('data-layer-id', layer.id);
          thumb.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 120px;
            background: #2a2a2a;
            border: 2px solid #444;
            border-radius: 8px;
            cursor: pointer;
            transition: all 0.2s ease;
            padding: 8px;
            box-sizing: border-box;
          `;
          // Image
          const imgDiv = document.createElement('div');
          imgDiv.className = 'trait-selection-img';
          imgDiv.style.cssText = `
            width: 80px;
            height: 80px;
            background: #222;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 8px;
            overflow: hidden;
            border: 1px solid #555;
          `;
          if (trait.imageData) {
            const img = document.createElement('img');
            img.src = trait.imageData;
            img.alt = trait.name;
            img.style.cssText = `
              width: 100%;
              height: 100%;
              object-fit: contain;
            `;
            imgDiv.appendChild(img);
          } else {
            imgDiv.innerHTML = `<span style="color: #666; font-size: 18px;">?</span>`;
          }
          // Always append image first, then name
          thumb.appendChild(imgDiv);
          // Name
          const nameDiv = document.createElement('div');
          nameDiv.className = 'trait-selection-name custom-tooltip-anchor';
          nameDiv.innerHTML = `<span class="trait-name-ellipsis-select">${trait.name}</span>`;
          nameDiv.style.cssText = `
            font-size: 12px;
            color: #ccc;
            text-align: center;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            width: 100%;
            font-weight: 500;
          `;
          if (trait.name.length > 16) {
            nameDiv.title = trait.name;
          }
          thumb.appendChild(nameDiv);
          
          // Add VIEW button
          const viewBtn = document.createElement('button');
          viewBtn.className = 'select-trait-view-btn';
          viewBtn.textContent = 'VIEW';
          viewBtn.title = 'View trait image';
          viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('[Select Trait Modal] View button clicked for trait:', trait.name);
            if (trait.imageData || trait.image) {
              // Use the same image preview system as Dark NFT Traits Configuration
              const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
              if (generateNftsUI && generateNftsUI.showTraitImagePreview) {
                generateNftsUI.showTraitImagePreview(trait.imageData || trait.image, trait.name, layerName);
              }
            }
          });
          
          thumb.appendChild(viewBtn);
          traitSelectionList.appendChild(thumb);
        });
        // --- Ensure forbidden overlays are applied after rendering all thumbs ---
        window.NFTApp.getModule('generateNftsUI').applyForbiddenOverlaysToModal(modal, nft, projectData);
      }
      // --- TRAIT SEARCH/FILTER LOGIC ---
      const searchInput = modalBody.querySelector('.trait-search-input');
      const clearBtn = modalBody.querySelector('.trait-search-clear');
      const traitThumbs = Array.from(traitSelectionList.querySelectorAll('.trait-selection-thumb'));
      function filterTraits() {
        const val = searchInput.value.trim().toLowerCase();
        let visibleCount = 0;
        const visibleThumbs = [];
        const hiddenThumbs = [];
        
        traitThumbs.forEach(thumb => {
          // Always show the 'none' option
          if (thumb.getAttribute('data-trait-id') === 'none') {
            thumb.style.display = '';
            thumb.style.visibility = 'visible';
            visibleThumbs.push(thumb);
            return;
          }
          const nameElem = thumb.querySelector('.trait-name-ellipsis-select');
          const name = nameElem ? nameElem.textContent.toLowerCase() : '';
          if (val === '' || name.includes(val)) {
            thumb.style.display = '';
            thumb.style.visibility = 'visible';
            visibleThumbs.push(thumb);
            visibleCount++;
          } else {
            thumb.style.display = 'none'; // Remove from layout
            thumb.style.visibility = 'hidden';
            hiddenThumbs.push(thumb);
          }
        });
        
        // Reorder DOM elements: visible traits first, then hidden ones
        // This ensures filtered traits appear sequentially
        visibleThumbs.forEach(thumb => {
          traitSelectionList.appendChild(thumb);
        });
        hiddenThumbs.forEach(thumb => {
          traitSelectionList.appendChild(thumb);
        });
        // Update count indicator
        const countIndicator = modalBody.querySelector('.trait-count-indicator');
        if (countIndicator) {
          if (val === '') {
            const totalTraits = traitThumbs.length - 1; // -1 for 'none' option
            const rows = Math.ceil(totalTraits / 9); // 9 columns per row
            const visibleRows = Math.floor((traitSelectionList.clientHeight - 16) / 135); // 120px height + 15px gap
            if (rows > visibleRows) {
              countIndicator.textContent = `${totalTraits} traits (${rows} rows) - 9x4 grid layout - Scroll to see all`;
            } else {
              countIndicator.textContent = `${totalTraits} traits (${rows} rows) - 9x4 grid layout`;
            }
          } else {
            countIndicator.textContent = `${visibleCount} trait${visibleCount === 1 ? '' : 's'} found`;
          }
        }
      }
      searchInput.addEventListener('input', filterTraits);
      clearBtn.addEventListener('click', () => {
        searchInput.value = '';
        filterTraits();
        searchInput.focus();
      });
      filterTraits();
      // Mark the current trait as selected by default
      let currentTraitId = 'none';
      let currentLayerTrait = null;
      if (nft && nft.traits && layer) {
        currentLayerTrait = nft.traits.find(t => {
          if (t.layer && layer.id && t.layer.id) return t.layer.id === layer.id;
          return (t.layer && t.layer.name === layer.name) || t.layer === layer.name;
        });
      }
      if (currentLayerTrait && currentLayerTrait.trait && currentLayerTrait.trait.id) {
        currentTraitId = currentLayerTrait.trait.id;
      }
      const allThumbs = traitSelectionList.querySelectorAll('.trait-selection-thumb');
      let selectedThumb = null;
      allThumbs.forEach(thumb => {
        thumb.classList.remove('selected');
        thumb.style.border = '';
        thumb.style.boxShadow = '';
        thumb.style.zIndex = '';
        if (thumb.getAttribute('data-trait-id') === currentTraitId) {
          thumb.classList.add('selected');
          thumb.style.border = 'none';
          thumb.style.boxShadow = '0 0 0 3px #6c5ce7';
          thumb.style.zIndex = '20';
          selectedThumb = thumb;
        }
        // Attach click handler (only if not forbidden)
        if (thumb.style.pointerEvents !== 'none') {
          thumb.onclick = function() {
          allThumbs.forEach(t => {
            t.classList.remove('selected');
            t.style.border = '';
            t.style.boxShadow = '';
            t.style.zIndex = '';
          });
            this.classList.add('selected');
            this.style.border = 'none';
            this.style.boxShadow = '0 0 0 3px #6c5ce7';
            this.style.zIndex = '20';
          };
        }
      });
      if (selectedThumb && selectedThumb.scrollIntoView) {
        setTimeout(() => selectedThumb.scrollIntoView({ block: 'center', behavior: 'smooth' }), 100);
      }
      // Do NOT call setupModalEventListeners or sortTraitsAlphabetically for click handlers anymore.
    }, 350); // 350ms delay to ensure loading state is visible
  },

  showTraitFullSizePopup: function(traitObj, layerName, traitName) {
    // Remove any existing full-size popup
    let popup = document.getElementById('trait-fullsize-popup');
    if (popup) popup.remove();
    
    // Get trait image data
    let imagePath = '';
    if (traitObj.trait && traitObj.trait.image) {
      imagePath = traitObj.trait.image;
    } else if (traitObj.trait && traitObj.trait.imageData) {
      imagePath = traitObj.trait.imageData;
    }
    
    // Create popup overlay
    popup = document.createElement('div');
    popup.id = 'trait-fullsize-popup';
    popup.className = 'modal-overlay';
    popup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.9);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.style.cssText = `
      position: relative;
      max-width: 90vw;
      max-height: 90vh;
      background: #222;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 24px 16px 24px;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #2a2a2a;
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      color: #fff;
      font-size: 20px;
      font-weight: 600;
    `;
    title.textContent = `${traitName} (${layerName})`;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #aaa;
      font-size: 28px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create image container
    const imageContainer = document.createElement('div');
    imageContainer.style.cssText = `
      padding: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #1a1a1a;
      flex: 1;
      min-height: 400px;
    `;
    
    if (imagePath) {
      const img = document.createElement('img');
      img.src = imagePath;
      img.alt = traitName;
      img.style.cssText = `
        max-width: 100%;
        max-height: 70vh;
        object-fit: contain;
        border-radius: 8px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      `;
      imageContainer.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.cssText = `
        width: 300px;
        height: 300px;
        background: #333;
        border-radius: 12px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #666;
        font-size: 16px;
        text-align: center;
      `;
      placeholder.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 100 100" style="margin-bottom: 16px;">
          <rect width="100" height="100" fill="#444"/>
          <path d="M40,42.5a7.5,7.5,0,1,0,7.5,7.5A7.5,7.5,0,0,0,40,42.5Zm16.88,4.38L50,65.62,43.12,57.5,30,73.75H70Z" fill="#666"/>
        </svg>
        <div>No image available</div>
        <div style="font-size: 14px; margin-top: 8px; color: #888;">${traitName}</div>
      `;
      imageContainer.appendChild(placeholder);
    }
    
    // Create footer with trait info
    const footer = document.createElement('div');
    footer.style.cssText = `
      padding: 16px 24px 20px 24px;
      border-top: 1px solid #333;
      background: #2a2a2a;
      text-align: center;
    `;
    
    const traitInfo = document.createElement('div');
    traitInfo.style.cssText = `
      color: #ccc;
      font-size: 14px;
      line-height: 1.5;
    `;
    traitInfo.innerHTML = `
      <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">Trait Information</div>
      <div><strong>Name:</strong> ${traitName}</div>
      <div><strong>Layer:</strong> ${layerName}</div>
      ${traitObj.trait && traitObj.trait.rarity ? `<div><strong>Rarity:</strong> ${traitObj.trait.rarity}%</div>` : ''}
    `;
    footer.appendChild(traitInfo);
    
    // Assemble popup
    popupContent.appendChild(header);
    popupContent.appendChild(imageContainer);
    popupContent.appendChild(footer);
    popup.appendChild(popupContent);
    
    // Add to DOM
    document.body.appendChild(popup);
    
    // Add event listeners
    const closePopup = () => {
      popup.style.opacity = '0';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 200);
    };
    
    closeBtn.onclick = closePopup;
    popup.onclick = (e) => {
      if (e.target === popup) closePopup();
    };
    
    // Escape key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Add hover effects
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.style.color = '#fff';
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = 'none';
      closeBtn.style.color = '#aaa';
    };
    
    // Animate in
    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.9)';
    setTimeout(() => {
      popup.style.transition = 'all 0.3s ease';
      popup.style.opacity = '1';
      popup.style.transform = 'scale(1)';
    }, 10);
  },

  showTraitInfoPopup: function(traitObj, layerName, traitName) {
    // Remove any existing info popup
    let popup = document.getElementById('trait-info-popup');
    if (popup) popup.remove();
    
    // Create popup overlay
    popup = document.createElement('div');
    popup.id = 'trait-info-popup';
    popup.className = 'modal-overlay';
    popup.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
      backdrop-filter: blur(4px);
    `;
    
    // Create popup content
    const popupContent = document.createElement('div');
    popupContent.style.cssText = `
      position: relative;
      max-width: 500px;
      width: 90vw;
      background: #222;
      border-radius: 12px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      display: flex;
      flex-direction: column;
    `;
    
    // Create header
    const header = document.createElement('div');
    header.style.cssText = `
      padding: 20px 24px 16px 24px;
      border-bottom: 1px solid #333;
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #2a2a2a;
    `;
    
    const title = document.createElement('h3');
    title.style.cssText = `
      margin: 0;
      color: #fff;
      font-size: 18px;
      font-weight: 600;
    `;
    title.textContent = `${traitName} (${layerName})`;
    
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      color: #aaa;
      font-size: 24px;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s ease;
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    header.appendChild(title);
    header.appendChild(closeBtn);
    
    // Create content
    const content = document.createElement('div');
    content.style.cssText = `
      padding: 24px;
      text-align: center;
      background: #1a1a1a;
    `;
    
    const icon = document.createElement('div');
    icon.style.cssText = `
      width: 80px;
      height: 80px;
      background: #333;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px auto;
      color: #666;
      font-size: 32px;
    `;
    icon.innerHTML = '🚫';
    
    const message = document.createElement('div');
    message.style.cssText = `
      color: #ccc;
      font-size: 16px;
      line-height: 1.5;
      margin-bottom: 16px;
    `;
    message.innerHTML = `
      <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">No Trait Selected</div>
      <div>This layer has no trait assigned, showing as "none".</div>
    `;
    
    const info = document.createElement('div');
    info.style.cssText = `
      color: #888;
      font-size: 14px;
      line-height: 1.4;
    `;
    info.innerHTML = `
      <div><strong>Layer:</strong> ${layerName}</div>
      <div><strong>Status:</strong> Empty/None</div>
    `;
    
    content.appendChild(icon);
    content.appendChild(message);
    content.appendChild(info);
    
    // Assemble popup
    popupContent.appendChild(header);
    popupContent.appendChild(content);
    popup.appendChild(popupContent);
    
    // Add to DOM
    document.body.appendChild(popup);
    
    // Add event listeners
    const closePopup = () => {
      popup.style.opacity = '0';
      setTimeout(() => {
        if (popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }, 200);
    };
    
    closeBtn.onclick = closePopup;
    popup.onclick = (e) => {
      if (e.target === popup) closePopup();
    };
    
    // Escape key handler
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        closePopup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    // Add hover effects
    closeBtn.onmouseenter = () => {
      closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      closeBtn.style.color = '#fff';
    };
    closeBtn.onmouseleave = () => {
      closeBtn.style.background = 'none';
      closeBtn.style.color = '#aaa';
    };
    
    // Animate in
    popup.style.opacity = '0';
    popup.style.transform = 'scale(0.9)';
    setTimeout(() => {
      popup.style.transition = 'all 0.3s ease';
      popup.style.opacity = '1';
      popup.style.transform = 'scale(1)';
    }, 10);
  },

  applyTraitChange: function(modal, layerName, traitIndex, nft, projectData) {
    const selectedThumb = modal.querySelector('.trait-selection-thumb.selected');
    if (!selectedThumb) {
      modal.style.display = 'none';
      return;
    }
    const traitId = selectedThumb.getAttribute('data-trait-id');
    const layerId = selectedThumb.getAttribute('data-layer-id');
    const layer = projectData.traits.find(l => l.id === layerId);
    let newTrait = null;
    if (traitId === 'none') {
      newTrait = { id: 'none', name: 'none' };
    } else {
      newTrait = layer.traits.find(t => t.id === traitId);
      if (!newTrait) {
        modal.style.display = 'none';
        return;
      }
    }
    // --- FORBIDDEN CHECK: Allow applying forbidden trait, but require confirmation ---
    const simulatedTraits = nft.traits.map(t => ({...t}));
    const idx = simulatedTraits.findIndex(t => (t.layer && t.layer.id === layer.id) || (t.layer && t.layer.name === layer.name) || t.layer === layer.name);
    if (idx !== -1) {
      simulatedTraits[idx] = { ...simulatedTraits[idx], trait: newTrait };
    } else {
      simulatedTraits.push({ layer, trait: newTrait });
    }
    const simulatedNFT = { ...nft, traits: simulatedTraits };
    // Get ALL violations for the new NFT
    const allViolations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(simulatedNFT, projectData.rules);
    const doApply = () => {
      if (traitIndex < 0 || traitIndex >= nft.traits.length) {
        modal.style.display = 'none';
        return;
      }
      
      console.log('[Generate NFTs UI] doApply - Before update:', {
        traitIndex: traitIndex,
        oldTrait: nft.traits[traitIndex].trait,
        newTrait: newTrait,
        nftId: nft.id,
        nftSeed: nft.seed
      });
      
      nft.traits[traitIndex].trait = newTrait;
      
      console.log('[Generate NFTs UI] doApply - After update:', {
        traitIndex: traitIndex,
        updatedTrait: nft.traits[traitIndex].trait,
        allTraits: nft.traits.map(t => ({ layer: t.layer?.name || t.layer, trait: t.trait?.name || t.trait }))
      });
      
      // Notify Saved Seeds modal that traits have changed
      if (window.SavedSeedsModal && window.SavedSeedsModal.notifyTraitChange) {
        window.SavedSeedsModal.notifyTraitChange();
      }
      
      // CRITICAL: Check if we're in Edit NFT Modal mode
      const isEditModalMode = window._nftEditModalInstance && window._nftEditModalInstance.currentNFT;
      console.log('[Generate NFTs UI] Edit modal mode check:', {
        isEditModalMode: isEditModalMode,
        hasInstance: !!window._nftEditModalInstance,
        hasCurrentNFT: !!(window._nftEditModalInstance && window._nftEditModalInstance.currentNFT)
      });
      
      const generateNftsCore = window.NFTApp.getModule('generateNfts');
      
      if (isEditModalMode) {
        // EDIT NFT MODAL MODE: Regenerate image using current traits (preserve manual selections)
        console.log('[Generate NFTs UI] Edit NFT modal mode detected - regenerating with current traits');
        
        // Create canvas and render the NFT with updated traits
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Load all trait images and render them
        const imagePromises = [];
        
        for (const traitInfo of nft.traits) {
          const trait = traitInfo.trait;
          
          // Skip 'none' traits
          if (!trait || trait === 'none' || trait.name === 'none' || trait.id === 'none') {
            continue;
          }
          
          // Get the trait image
          let imagePath = trait.image || trait.imageData || trait.imageSrc || trait.src;
          
          if (!imagePath && projectData && projectData.traits) {
            // Try to find the trait in project data
            const layerData = projectData.traits.find(l => 
              l.id === traitInfo.layer?.id || l.name === traitInfo.layer?.name || l.name === traitInfo.layer
            );
            
            if (layerData && layerData.traits) {
              const projectTrait = layerData.traits.find(t => 
                t.id === trait.id || t.name === trait.name
              );
              
              if (projectTrait) {
                imagePath = projectTrait.image || projectTrait.imageData || projectTrait.imageSrc || projectTrait.src;
              }
            }
          }
          
          if (imagePath) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            const promise = new Promise((resolve, reject) => {
              img.onload = () => resolve({ img, traitInfo });
              img.onerror = () => {
                console.error('[Generate NFTs UI] Failed to load image:', imagePath);
                resolve({ img: null, traitInfo });
              };
            });
            img.src = imagePath;
            imagePromises.push(promise);
          }
        }
        
        // Wait for all images to load, then render
        Promise.all(imagePromises).then(loadedImages => {
          console.log('[Generate NFTs UI] All images loaded, rendering...');
          
          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Draw each image in order
          for (const { img, traitInfo } of loadedImages) {
            if (img) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            }
          }
          
          // Update the image data
          nft.imageData = canvas.toDataURL('image/png');
          nft.thumbnail = nft.imageData;
          
          // Update window.lastGeneratedNFT with the updated NFT (not a new one)
          window.lastGeneratedNFT = nft;
          
          console.log('[Generate NFTs UI] NFT image regenerated successfully');
          
          // Show success notification
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              "Trait updated successfully!",
              "success",
              3000
            );
          }
          
          // Dispatch custom event with the UPDATED NFT (preserving all manual selections)
          document.dispatchEvent(new CustomEvent('traitChanged', {
            detail: { nft: nft, projectData: projectData }
          }));
          
          modal.style.display = 'none';
          
          // Dispatch custom event to notify that the trait modal has been closed
          document.dispatchEvent(new CustomEvent('traitModalClosed', {
            detail: { nft: nft, projectData: projectData }
          }));
        }).catch(error => {
          console.error('[Generate NFTs UI] Error rendering NFT:', error);
          modal.style.display = 'none';
        });
      } else if (generateNftsCore && typeof generateNftsCore.generateSingleNFT === 'function') {
        // GENERATE NFTs TAB MODE: Generate a new random NFT
        console.log('[Generate NFTs UI] Generate NFTs tab mode - generating new NFT');
        generateNftsCore.generateSingleNFT(projectData, true, null, this.darkModeEnabled).then(newNft => {
          window.lastGeneratedNFT = newNft;
          // After trait change, re-check all rules and update overlays for all traits
          window.NFTApp.getModule('generateNftsUI').updateTraitInfoPanel(newNft, projectData);
          window.NFTApp.getModule('generateNftsUI').updateSinglePreviewPanel(projectData, newNft);
          // Check if we need to show the Update NFT button
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              "Trait updated successfully!",
              "success",
              3000
            );
          }
          
          // Dispatch custom event to notify that a trait has been changed
          document.dispatchEvent(new CustomEvent('traitChanged', {
            detail: { nft: newNft, projectData: projectData }
          }));
          
          // Also call the static method directly for more reliable detection
          if (window.SavedSeedsModal && window.SavedSeedsModal.showUpdateButtonForEdit) {
            window.SavedSeedsModal.showUpdateButtonForEdit();
          }
          
          modal.style.display = 'none';
          
          // Dispatch custom event to notify that the trait modal has been closed
          document.dispatchEvent(new CustomEvent('traitModalClosed', {
            detail: { nft: newNft, projectData: projectData }
          }));
        });
      } else {
        // Fallback: update both panels for forbidden overlays immediately
        window.NFTApp.getModule('generateNftsUI').updateTraitInfoPanel(nft, projectData);
        window.NFTApp.getModule('generateNftsUI').updateSinglePreviewPanel(projectData, nft);
        
        // Dispatch custom event to notify that a trait has been changed
        document.dispatchEvent(new CustomEvent('traitChanged', {
          detail: { nft: nft, projectData: projectData }
        }));
        
        // Also call the static method directly for more reliable detection
        if (window.SavedSeedsModal && window.SavedSeedsModal.showUpdateButtonForEdit) {
          window.SavedSeedsModal.showUpdateButtonForEdit();
        }
        
        modal.style.display = 'none';
        
        // Dispatch custom event to notify that the trait modal has been closed
        document.dispatchEvent(new CustomEvent('traitModalClosed', {
          detail: { nft: nft, projectData: projectData }
        }));
      }
    };
    if (allViolations && allViolations.length > 0) {
      // Show confirmation modal with ALL violations (robust, always lists all, one per line)
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('confirmationModal')) {
        // Format violations for the small text, always one per line, and remove duplicates
        let uniqueViolations = Array.from(new Set(allViolations.map(v => v.replace(/^Rule Violation: /, '').trim())));
        let violationsList = uniqueViolations.join('<br>');
        // Main message and question, each on its own line, with clear formatting
        const mainMsg = '<div style="font-size:14px;font-weight:500;color:#ff2222;line-height:1.2;margin-bottom:8px;">This trait combination does not respect one or more active rules.</div>';
        const question = '<div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:2px;">Are you sure you want to apply this trait anyway?</div>';
        const consequence = '<div style="font-size:13px;color:#fff;margin-bottom:10px;">This may result in an invalid or non-compliant NFT.</div>';
        const hr = '<hr style="border:0;border-top:1px solid #444;margin:10px 0 10px 0;">';
        const ruleHeader = '<div style="font-size:13px;color:#ffbaba;font-weight:600;margin-bottom:2px;">Rule violation(s):</div>';
        const ruleList = `<div style="font-size:13px;color:#ffbaba;line-height:1.5;">${violationsList}</div>`;
        // Compose the full description
        const fullDescription = question + consequence + hr + ruleHeader + ruleList;
        // Show modal (pass HTML for message and description)
        window.NFTApp.getModule('confirmationModal').show(
          'Forbidden Trait Combination',
          mainMsg,
          fullDescription,
          doApply
        );
      } else {
        // Fallback: just apply
        doApply();
      }
      return;
    }
    // No violation, apply directly
    doApply();
  },

  // --- Begin migrated UI logic from generate-nfts.js ---
  // (Copy all UI-related functions here, including setupUI, updateSinglePreviewPanel, updateTraitInfoPanel, showTraitsListPlaceholder, clearErrorInPreviewPanel, showWelcomeMessageInPreviewPanel, showErrorInPreviewPanel, clearTraitsPanel, and all modal/trait selection UI logic)
  // ... existing code ...

  // Helper function to format numbers with commas
  formatNumberWithCommas: function(number) {
    if (typeof number !== 'number' || isNaN(number)) {
      return number;
    }
    // Use toLocaleString with explicit options to ensure comma formatting
    return number.toLocaleString('en-US');
  },

  // Function to update tooltip with dynamic total supply
  updateTooltipText: function(projectData) {
    const tooltip = document.querySelector('#generate-nfts .nft-preview-title .tooltiptext');
    const customTooltip = document.querySelector('#generate-nfts .nft-preview-title .custom-tooltip-text');
    
    function getTotalSupply(pd) {
      // First check the input field for the most current value
      const totalSupplyInput = document.getElementById('total-supply');
      if (totalSupplyInput && totalSupplyInput.value) {
        // Remove commas, dots, and other formatting characters before parsing
        const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
        return parseInt(cleanValue, 10);
      }
      if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
        return parseInt(pd.totalSupply, 10);
      } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
        return parseInt(pd.size, 10);
      }
      return null;
    }
    
    const totalSupply = getTotalSupply(projectData);
    const supplyText = totalSupply && !isNaN(totalSupply) && totalSupply > 0 ? totalSupply.toLocaleString() : 'Total Supply';
    const tooltipText = `Create and preview NFT images for your collection. Change any of it's traits and add it's seed to your collection until the total amount of ${supplyText} NFTs is saved.`;
    
    if (tooltip) {
      tooltip.textContent = tooltipText;
    }
    if (customTooltip) {
      customTooltip.textContent = tooltipText;
    }
  },

  // Function to setup tooltip update listener
  setupTooltipUpdateListener: function() {
    const totalSupplyInput = document.getElementById('total-supply');
    if (totalSupplyInput) {
      totalSupplyInput.addEventListener('input', () => {
        // Update tooltip when total supply changes
        this.updateTooltipText(window.currentProject);
      });
    }
  },

  setupUI: function(projectData) {
    let generateNftsTab = document.getElementById('generate-nfts');
    // ... inside setupUI, after rendering the preview panel ...
    // Set the main HTML structure first
    generateNftsTab.innerHTML = `
      <div class="generate-nfts-main-row" style="display: flex; flex-direction: row; gap: 12px; align-items: flex-start; width: 100%;">
        <div class="nft-preview-section" style="flex: 0 0 542px; max-width: 542px; min-width: 542px; display: flex; flex-direction: column; gap: 0;">
          <div class="nft-preview-title tooltip tooltip-bottom" style="text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; cursor: help; position: relative;">
            Generate NFTs
            <span class="tooltiptext"></span>
            <div class="custom-tooltip-text"></div>
          </div>
          <div class="nft-preview-panel" style="display: flex; flex-direction: column; gap: 0;">
          <div class="nft-controls-panel" style="display: flex; flex-direction: column; gap: 0; width: 542px; height: 116px; background: #23232b; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.10); padding: 18px 18px 10px 18px; margin-bottom: 18px; border: 1.5px solid #29293a;">
            <div class="nft-rarity-seed-row"></div>
            <div class="nft-seedlist-random-row"></div>
            <div class="nft-seedinput-row"></div>
          </div>
          <div class="nft-preview-image-area" style="width: 542px; height: 542px;"><div id="nft-preview-container"></div></div>
          </div>
        </div>
        <div class="traits-section" style="flex: 0 0 220px; min-width: 220px; max-width: 220px; display: flex; flex-direction: column;">
          <div class="traits-title tooltip tooltip-bottom" style="text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; cursor: help; position: relative;">
            NFT Traits
            <span class="tooltiptext"></span>
            <div class="custom-tooltip-text" style="visibility: hidden; opacity: 0; position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); background: #000000; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 400; white-space: normal; z-index: 999999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center; line-height: 1.4; width: 180px; transition: opacity 0.2s ease, visibility 0.2s ease;">
              Check the list of<br>traits being used on<br>the generated NFT and<br>edit them as you like
            </div>
          </div>
          <div class="traits-list-card" style="flex: 1; display: flex; flex-direction: column;">
          <div class="nft-trait-info-panel">
            <ul class="nft-trait-info-list"></ul>
              </div>
          </div>
        </div>
      </div>
    `;
    
    // Ensure proper title positioning after HTML is set
    setTimeout(() => {
      const nftPreviewTitle = generateNftsTab.querySelector('.nft-preview-title');
      const traitsTitle = generateNftsTab.querySelector('.traits-title');
      
      // Ensure external titles are properly aligned
      if (nftPreviewTitle && traitsTitle) {
        nftPreviewTitle.style.cssText = 'text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; line-height: 1.2; display: flex; align-items: center; justify-content: center; height: 2.16rem; cursor: help; position: relative;';
        traitsTitle.style.cssText = 'text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; line-height: 1.2; display: flex; align-items: center; justify-content: center; height: 2.16rem; width: 220px; cursor: help; position: relative;';
      }
    }, 10);
    
    // Now insert the new action buttons after the preview panel is present
    setTimeout(() => {
      const btnMount = generateNftsTab.querySelector('.nft-preview-image-area');
      if (btnMount && !btnMount.querySelector('.nft-action-buttons-container')) {
        // Create NFT Action Buttons Container
        const nftActionButtonsContainer = document.createElement('div');
        nftActionButtonsContainer.className = 'nft-action-buttons-container';
        nftActionButtonsContainer.style.display = 'flex';
        nftActionButtonsContainer.style.flexDirection = 'row';
        nftActionButtonsContainer.style.gap = '8px';
        nftActionButtonsContainer.style.marginTop = '15px';
        nftActionButtonsContainer.style.alignItems = 'center';
        nftActionButtonsContainer.style.justifyContent = 'flex-start';
        nftActionButtonsContainer.style.width = '542px';
        nftActionButtonsContainer.style.height = '66px';
        
        // Button 1: Create NFT
        const createNftBtn = document.createElement('button');
        createNftBtn.className = 'nft-action-btn';
        createNftBtn.id = 'nft-action-create-btn';
        createNftBtn.style.cssText = `
          width: 102px;
          height: 66px;
          border-radius: 8px;
          border: 2px solid #047857;
          background-color: #047857;
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 0 #000000;
          cursor: pointer;
          transition: all 0.05s ease;
          outline: none;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        `;
        createNftBtn.innerHTML = 'Create<br>NFT';
        createNftBtn.title = 'Create a random NFT, considering all rules and rarities';
        createNftBtn.addEventListener('click', function() {
          // Add press effect immediately
          this.classList.add('pressed');
          
          // Use requestAnimationFrame to ensure animation starts before heavy calculation
          requestAnimationFrame(() => {
            // Same functionality as existing Create NFT button
            const projectData = window.NFTApp.getModule('generateNftsUI').projectData;
            if (!projectData) {
              alert('Project data not loaded.');
              // Remove pressed class if there's an error
              setTimeout(() => this.classList.remove('pressed'), 25);
              return;
            }
            
            // Start the heavy calculation after animation has started
            window.NFTApp.getModule('generateNftsUI').randomizeSingleNFT(projectData, false);
            
            // Update NFT count panel after generation
            setTimeout(() => {
              if (window.updateNftCountPanel) {
                window.updateNftCountPanel();
              }
            }, 1000);
          });
          
          // Remove pressed class after animation duration
          setTimeout(() => this.classList.remove('pressed'), 75);
        });
        
        // Button 2: Add to Collection
        const addToCollectionBtn = document.createElement('button');
        addToCollectionBtn.className = 'nft-action-btn';
        addToCollectionBtn.id = 'nft-action-add-btn';
        addToCollectionBtn.style.cssText = `
          width: 102px;
          height: 66px;
          border-radius: 8px;
          border: 2px solid #1e40af;
          background-color: #1e40af;
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 0 #000000;
          cursor: pointer;
          transition: all 0.05s ease;
          outline: none;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        `;
        addToCollectionBtn.innerHTML = 'Add NFT to Collection';
        addToCollectionBtn.title = 'Add current NFT to your collection';
        addToCollectionBtn.addEventListener('click', function() {
          // Add press effect
          this.classList.add('pressed');
          setTimeout(() => this.classList.remove('pressed'), 25);
          
          // Use the exact same logic as the working "+" button
          const pd = window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData ? window.NFTApp.getModule('generateNftsUI').projectData : window.currentProject;
          const lastNFT = window.lastGeneratedNFT;
          
          function getTotalSupply(pd) {
            const totalSupplyInput = document.getElementById('total-supply');
            if (totalSupplyInput && totalSupplyInput.value) {
              const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
              return parseInt(cleanValue, 10) || 1;
            }
            if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
              return parseInt(pd.totalSupply, 10);
            } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
              return parseInt(pd.size, 10);
            }
            return 1;
          }
          
          let totalSupply = getTotalSupply(pd);
          if (!totalSupply || isNaN(totalSupply) || totalSupply < 1) {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('You must set the Total Supply in the Collection Info tab before adding seeds to the seed list.', 'error', 3500);
            }
            return;
          }
          
          if (!lastNFT || !lastNFT.seed) {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('No NFT generated to add.', 'warning', 2500);
            }
            return;
          }
          
          const seedListKey = getSeedListKey(pd);
          let seedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
          
          if (seedList.some(s => s.seed === lastNFT.seed)) {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Seed already in the list.', 'error', 2500);
            }
            return;
          }
          
          if (seedList.length >= totalSupply) {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Seed list is full.', 'warning', 2500);
            }
            return;
          }
          
          // Use the exact same simple approach as the working "+" button
          seedList.push({ seed: lastNFT.seed });
          localStorage.setItem(seedListKey, JSON.stringify(seedList));
          
          // Update all counters
          window.updateAllCounters();
          
          // Show success message (same as "+" button)
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Seed added to the list.', 'success', 2000);
          }
          
          console.log('[DEBUG] Add to Collection: seed added, counter updated:', seedList.length, totalSupply);
        });
        
        // Button 3: Bulk Generation
        const bulkGenerationBtn = document.createElement('button');
        bulkGenerationBtn.className = 'nft-action-btn';
        bulkGenerationBtn.id = 'nft-action-bulk-btn';
        bulkGenerationBtn.style.cssText = `
          width: 102px;
          height: 66px;
          border-radius: 8px;
          border: 2px solid #ea580c;
          background-color: #ea580c;
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 0 #000000;
          cursor: pointer;
          transition: all 0.05s ease;
          outline: none;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        `;
        bulkGenerationBtn.innerHTML = 'Bulk<br>Generation';
        bulkGenerationBtn.title = 'Create multiple NFTs at once and choose the ones you like for your collection.';
        bulkGenerationBtn.addEventListener('click', function() {
          // Add press effect
          this.classList.add('pressed');
          setTimeout(() => this.classList.remove('pressed'), 25);
          
          // Same functionality as Batch Generation button
          if (window.BatchGenerationModal) {
            const modal = new window.BatchGenerationModal();
            modal.show();
          } else {
            console.error('[DEBUG] BatchGenerationModal not available');
            alert('BatchGenerationModal not available. Please refresh the page.');
          }
        });
        
        // Button 4: Edit NFT Collection
        const editCollectionBtn = document.createElement('button');
        editCollectionBtn.className = 'nft-action-btn';
        editCollectionBtn.id = 'nft-action-edit-btn';
        editCollectionBtn.style.cssText = `
          width: 102px;
          height: 66px;
          border-radius: 8px;
          border: 2px solid #dc2626;
          background-color: #dc2626;
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 0 #000000;
          cursor: pointer;
          transition: all 0.05s ease;
          outline: none;
          user-select: none;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
        `;
        editCollectionBtn.innerHTML = 'Edit NFT<br>Collection';
        editCollectionBtn.title = 'View, edit, reorder and find any NFT on your collection.';
        editCollectionBtn.addEventListener('click', function() {
          // Add press effect
          this.classList.add('pressed');
          setTimeout(() => this.classList.remove('pressed'), 25);
          
          // Same functionality as display-full-seed-list-btn
          if (window.SavedSeedsModal) {
            const modal = new window.SavedSeedsModal();
            modal.show();
          } else {
            console.error('[DEBUG] SavedSeedsModal not available');
          }
        });
        
        // Panel 5: NFT Count Display (not a button)
        const nftCountPanel = document.createElement('div');
        nftCountPanel.className = 'nft-count-panel tooltip';
        nftCountPanel.id = 'nft-count-panel';
        nftCountPanel.style.cssText = `
          width: 102px;
          height: 66px;
          border-radius: 8px;
          border: 2px solid #8b5cf6;
          background-color: #000000;
          color: #000000;
          font-size: 14px;
          font-weight: 600;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          position: relative;
          overflow: visible;
        `;
        
        // Progress bar background (fills the entire panel)
        const progressBar = document.createElement('div');
        progressBar.className = 'nft-progress-bar';
        progressBar.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 0%;
          height: 100%;
          background-color: #fbbf24;
          transition: all 0.3s ease;
          z-index: 1;
        `;
        
        nftCountPanel.appendChild(progressBar);
        
        // NFT count text container
        const nftCountContainer = document.createElement('div');
        nftCountContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 2;
          position: relative;
        `;
        
        // NFT count number
        const nftCountText = document.createElement('div');
        nftCountText.className = 'nft-count-text';
        nftCountText.style.cssText = `
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 0 #000000;
          line-height: 1.1;
          text-align: center;
          word-break: break-all;
        `;
        nftCountText.textContent = '0';
        
        // NFTs label
        const nftsLabel = document.createElement('div');
        nftsLabel.style.cssText = `
          color: #ffffff;
          font-size: 18px;
          font-weight: bold;
          text-shadow: 2px 2px 0 #000000;
          line-height: 1;
          text-align: center;
          margin-top: 2px;
        `;
        nftsLabel.textContent = 'NFTs';
        
        nftCountContainer.appendChild(nftCountText);
        nftCountContainer.appendChild(nftsLabel);
        nftCountPanel.appendChild(nftCountContainer);
        
        // Add tooltip for progress bar
        const tooltipContainer = document.createElement('div');
        tooltipContainer.className = 'tooltip';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'tooltiptext';
        tooltip.textContent = '0% Complete';
        
        tooltipContainer.appendChild(tooltip);
        nftCountPanel.appendChild(tooltipContainer);
        
        // Add event listener to position tooltip correctly
        nftCountPanel.addEventListener('mouseenter', function() {
          const rect = nftCountPanel.getBoundingClientRect();
          tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
          tooltip.style.left = (rect.left + rect.width / 2) + 'px';
          tooltip.style.transform = 'translateX(-50%)';
        });
        
        // Hide tooltip when mouse leaves
        nftCountPanel.addEventListener('mouseleave', function() {
          tooltip.style.opacity = '0';
          tooltip.style.visibility = 'hidden';
        });
        
        // Function to update NFT count panel
        function updateNftCountPanel() {
          const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
          if (!projectData) return;
          
          // Use the same getTotalSupply logic as seed list counter
          function getTotalSupply(pd) {
            // Always use the latest value from the input field if present
            const totalSupplyInput = document.getElementById('total-supply');
            if (totalSupplyInput && totalSupplyInput.value) {
              // Remove commas, dots, and other formatting characters before parsing
              const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
              return parseInt(cleanValue, 10) || 1;
            }
            if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
              return parseInt(pd.totalSupply, 10);
            } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
              return parseInt(pd.size, 10);
            }
            return 1;
          }
          
          let totalSupply = getTotalSupply(projectData);
          if (!totalSupply || isNaN(totalSupply) || totalSupply < 1) totalSupply = 1;
          
          // Use the same getSeedListKey function as seed list counter
          const seedListKey = getSeedListKey(projectData);
          
          // Use try-catch for localStorage operations like seed list counter
          let seedList = [];
          try {
            const storedData = localStorage.getItem(seedListKey);
            if (storedData) {
              seedList = JSON.parse(storedData);
            }
          } catch (error) {
            console.warn('Error parsing seed list from localStorage:', error);
            seedList = [];
          }
          
          const currentCount = seedList.length || 0;
          
          // Use the same formatting as seed list counter
          const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
          const formatNumber = generateNftsUIModule && generateNftsUIModule.formatNumberWithCommas ? 
            generateNftsUIModule.formatNumberWithCommas : 
            (num) => num.toLocaleString('en-US');
          
          // Update count text to show only current count with comma formatting
          nftCountText.textContent = formatNumber(currentCount || 0);
          
          // Calculate percentage
          const percentage = totalSupply > 0 ? (currentCount / totalSupply) * 100 : 0;
          
          // Update progress bar width
          progressBar.style.width = `${Math.min(percentage, 100)}%`;
          
          // Update progress bar color based on percentage
          progressBar.className = 'nft-progress-bar';
          if (percentage >= 100) {
            progressBar.classList.add('green');
          } else if (percentage >= 95) {
            progressBar.classList.add('red');
          } else if (percentage >= 80) {
            progressBar.classList.add('orange');
          } else {
            progressBar.classList.add('yellow');
          }
          
          // Update tooltip with percentage completion format
          tooltip.textContent = `NFT Collection is ${percentage.toFixed(2)}% Complete.`;
        }
        
        // Update NFT count panel initially
        updateNftCountPanel();
        
        // Store update function globally for external access
        window.updateNftCountPanel = updateNftCountPanel;
        
        // Listen for seed list changes to update the panel
        window.addEventListener('seedListUpdated', updateNftCountPanel);
        window.addEventListener('total-supply-updated', updateNftCountPanel);
        
        // Add all buttons/panels to container
        nftActionButtonsContainer.appendChild(createNftBtn);
        nftActionButtonsContainer.appendChild(addToCollectionBtn);
        nftActionButtonsContainer.appendChild(bulkGenerationBtn);
        nftActionButtonsContainer.appendChild(editCollectionBtn);
        nftActionButtonsContainer.appendChild(nftCountPanel);
        
        btnMount.appendChild(nftActionButtonsContainer);
      }
    }, 0);

    this.projectData = projectData; // Store projectData for later use
    // Create a style element for dynamic CSS rules
    const styleElement = document.createElement("style");
    styleElement.textContent = `
      @media (max-width: 768px) {
        .generate-nfts-locked-group-row {
          flex-wrap: wrap;
      }
      .nft-preview-section {
          width: 100%;
        padding-left: 0;
      }
      .nft-preview-group {
        width: 100%;
        padding-left: 0;
      }
      .nft-preview-container {
        width: 100%;
        margin-top: 0;
      }
      .left-column-section {
        width: auto !important;
          max-width: 500px;
        min-width: 0;
        padding: 24px;
        padding-right: 8px !important;
      }
      .generate-nfts-locked-group {
        width: 100%;
      }
      /* Override left padding/margin for left column alignment */
      .left-column-section,
      .left-column-section > * {
        padding-left: 0 !important;
        margin-left: 0 !important;
        }
      }

      /* Fixed width for traits list panel */
      .traits-list-wrapper,
      .traits-list-card,
      .nft-trait-info-panel,
      .nft-trait-info-list {
        height: 100% !important;
        max-height: none !important;
        min-height: 0 !important;
        overflow: auto !important;
        display: flex !important;
        flex-direction: column !important;
      }

      /* Ensure the traits list card is always visible */
      .traits-list-card {
        visibility: visible !important;
        opacity: 1 !important;
        display: flex !important;
      }

      /* Ensure traits info panel is always visible */
      .nft-trait-info-panel, .nft-trait-info-list {
        visibility: visible !important;
        opacity: 1 !important;
        display: flex !important;
      }
    `;
    document.head.appendChild(styleElement);

    console.log("Setting up UI for generate-nfts tab");
    // --- ENSURE THE GENERATE-NFTS TAB EXISTS AND IS VISIBLE ---
    let tabJustCreated = false;
    if (!generateNftsTab) {
      const contentArea = document.querySelector('.content-area');
      if (contentArea) {
        generateNftsTab = document.createElement('div');
        generateNftsTab.id = 'generate-nfts';
        generateNftsTab.className = 'tab-content';
        contentArea.appendChild(generateNftsTab);
        tabJustCreated = true;
      }
    }
    // --- ADD SECTION TITLE AND DESCRIPTION IF NOT PRESENT ---
    if (generateNftsTab && !generateNftsTab.querySelector('.section-title')) {
      const title = document.createElement('h2');
      title.className = 'section-title tooltip tooltip-bottom';
      title.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        Generate NFTs
        <span class="tooltiptext"></span>
      `;
      generateNftsTab.insertBefore(title, generateNftsTab.firstChild);
    }
    // --- ALWAYS RENDER THE FOUR CONTROL ROWS IN A SINGLE PANEL ---
    if (generateNftsTab) {
      generateNftsTab.style.display = 'block';
      generateNftsTab.classList.add('active');
      // Add section title and description at the top, matching 'generate-metadata' tab
      generateNftsTab.innerHTML = `
        <div class="generate-nfts-main-row" style="display: flex; flex-direction: row; gap: 12px; align-items: flex-start; width: 100%;">
          <div class="nft-preview-section" style="flex: 0 0 542px; max-width: 542px; min-width: 542px; display: flex; flex-direction: column; gap: 0;">
            <div class="nft-preview-title tooltip tooltip-bottom" style="text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; cursor: help; position: relative;">
              Generate NFTs
              <span class="tooltiptext"></span>
              <div class="custom-tooltip-text"></div>
            </div>
            <div class="nft-preview-panel" style="display: flex; flex-direction: column; gap: 0;">
              <div class="nft-controls-panel" style="display: flex; flex-direction: column; gap: 0; width: 542px; height: 116px; background: #23232b; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.10); padding: 18px 18px 10px 18px; margin-bottom: 18px; border: 1.5px solid #29293a;">
                <div class="nft-rarity-seed-row"></div>
                <div class="nft-seedlist-random-row"></div>
                <div class="nft-seedinput-row"></div>
              </div>
              <div class="nft-preview-image-area" style="width: 542px; height: 542px;"><div id="nft-preview-container"></div></div>
            </div>
          </div>
          <div class="traits-section" style="flex: 0 0 220px; min-width: 220px; max-width: 220px; display: flex; flex-direction: column;">
            <div class="traits-title tooltip tooltip-bottom" style="text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; cursor: help; position: relative;">
              NFT Traits
              <span class="tooltiptext"></span>
              <div class="custom-tooltip-text" style="visibility: hidden; opacity: 0; position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); background: #000000; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 400; white-space: normal; z-index: 999999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center; line-height: 1.4; width: 180px; transition: opacity 0.2s ease, visibility 0.2s ease;">
                Check the list of<br>traits being used on<br>the generated NFT and<br>edit them as you like
              </div>
            </div>
            <div class="traits-list-card" style="flex: 1; display: flex; flex-direction: column;">
            <div class="nft-trait-info-panel">
              <ul class="nft-trait-info-list"></ul>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Ensure proper title positioning after HTML is set
      setTimeout(() => {
        const nftPreviewTitle = generateNftsTab.querySelector('.nft-preview-title');
        const traitsTitle = generateNftsTab.querySelector('.traits-title');
        
        // Ensure external titles are properly aligned
        if (nftPreviewTitle && traitsTitle) {
          nftPreviewTitle.style.cssText = 'text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; line-height: 1.2; display: flex; align-items: center; justify-content: center; height: 2.16rem; cursor: help; position: relative;';
          traitsTitle.style.cssText = 'text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; line-height: 1.2; display: flex; align-items: center; justify-content: center; height: 2.16rem; cursor: help; position: relative;';
        }
      }, 10);
      
      // Always use the module's projectData or the passed parameter
      const activeProjectData = projectData || this.projectData || window.currentProject;
      if (activeProjectData && activeProjectData.traits) {
        this._renderControlRows(activeProjectData);
      } else {
        // Silenced: console.warn('[setupUI] No valid projectData available for rendering control rows');
      }
      // Always show the preview and traits panels
      const previewPanel = generateNftsTab.querySelector('.nft-preview-image-area');
      if (previewPanel) previewPanel.style.display = 'block';
      const traitPanel = generateNftsTab.querySelector('.nft-trait-info-panel');
      if (traitPanel) traitPanel.style.display = 'block';
    }


    // Ensure setupUI logic runs after DOM update so all control rows exist
    setTimeout(() => {
    // Setup event listeners
    if (window.NFTApp.getModule('generateNfts')) {
        // Use the stored projectData from the module, or fallback to window.currentProject
        const pd = (window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData) || window.currentProject || null;
        window.NFTApp.getModule('generateNfts').setupEventListeners(pd);
    }
      // --- Custom logic for seed input tooltip and toggle ---
      // (all the rest of setupUI logic here)
      window.NFTApp.getModule('generateNftsUI')._renderControlRows(projectData);
      
      // Update tooltip with dynamic total supply
      window.NFTApp.getModule('generateNftsUI').updateTooltipText(projectData);
      
      // Setup tooltip update listener for total supply changes
      window.NFTApp.getModule('generateNftsUI').setupTooltipUpdateListener();
    }, 0);
    return;
  },

  // Add this method to clear errors in the preview panel
  clearErrorInPreviewPanel: function() {
    const previewPanel = document.querySelector('.nft-preview-image-area');
    if (previewPanel) {
      // Remove any error message
      const errorElem = previewPanel.querySelector('.nft-preview-error');
      if (errorElem) errorElem.remove();
    }
  },

  // Add this method to show a welcome message in the preview panel
  showWelcomeMessageInPreviewPanel: function() {
    // Welcome message disabled - do nothing
    console.log('[DEBUG] Welcome message disabled');
  },

  // Add this method to show a placeholder in the traits list panel
  showTraitsListPlaceholder: function(projectData) {
    const infoList = document.querySelector('.nft-trait-info-list');
    if (infoList) {
      infoList.innerHTML = `
      <div class="nft-trait-info-list-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; padding: 20px; text-align: center; color: var(--text-secondary);">
        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"width: 32px; height: 32px; margin-bottom: 12px;\">
          <path d=\"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3\"></path>
        </svg>
          <div style=\"font-size: 15px; font-weight: 500; margin-bottom: 8px;\">${!projectData || !projectData.traits || projectData.traits.length === 0 ? 'No traits added yet' : 'Traits will appear here'}</div>
          <div style=\"font-size: 13px; line-height: 1.4;\">${!projectData || !projectData.traits || projectData.traits.length === 0 ? 'Go to the Traits & Rules tab to add trait layers and traits' : 'Click one of the Generate buttons to create an NFT and see its traits'}</div>
      </div>
    `;
    infoList.style.overflowY = 'auto';
    infoList.style.maxHeight = '100%';
      infoList.style.height = 'calc(100% - 50px)';
    infoList.style.display = 'flex';
    infoList.style.visibility = 'visible';
    infoList.style.opacity = '1';
    infoList.style.scrollbarWidth = 'thin';
    infoList.style.scrollbarColor = '#333 #1a1a1a';
      setTimeout(() => this.syncCardHeights && this.syncCardHeights(), 100);
    }
  },

  // Move all the control row rendering logic into a new _renderControlRows(projectData) method on the module
  _renderControlRows: function(projectData) {
    // Store reference to this module for use in event listeners
    const self = this;
    
    // 1. Seed label, number, copy button
    const raritySeedRow = document.querySelector('.nft-rarity-seed-row');
    if (raritySeedRow) {
      raritySeedRow.innerHTML = '';
      const rowFlex = document.createElement('div');
      rowFlex.className = 'seed-display-container';
      rowFlex.id = 'seed-display-container';
      rowFlex.style.display = 'flex';
      rowFlex.style.alignItems = 'center';
      rowFlex.style.justifyContent = 'center';
      rowFlex.style.gap = '0px';
      rowFlex.style.width = '542px';
      rowFlex.style.height = '32px';
      rowFlex.style.background = 'none';
      rowFlex.style.padding = '0'; // Remove side padding for perfect stacking
      const seedLabel = document.createElement('span');
      seedLabel.textContent = 'Seed:';
      seedLabel.className = 'seed-label';
      // Removed inline marginRight to prevent conflicts with CSS
      // No inline fontSize or fontWeight here
      const seedBox = document.createElement('span');
      seedBox.className = 'nft-seed-box';
      // Removed inline styles to prevent conflicts with CSS fixed sizing
      // Always use the current deterministic seed if available
      let deterministicSeed = '';
      if (window.lastGeneratedNFT && projectData) {
        deterministicSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, window.lastGeneratedNFT);
      }
      seedBox.textContent = deterministicSeed;
      const copyBtn = document.createElement('button');
      copyBtn.className = 'nft-seed-copy-btn';
      copyBtn.style.background = 'none';
      copyBtn.style.border = 'none';
      copyBtn.style.outline = 'none';
      copyBtn.style.padding = '0';
      copyBtn.style.marginLeft = '2px';
      copyBtn.style.fontSize = '20px';
      copyBtn.style.fontWeight = 'bold';
      copyBtn.style.color = '#6c5ce7';
      copyBtn.style.cursor = 'pointer';
      copyBtn.textContent = '⧉';
      copyBtn.title = 'copy the NFT seed number';
      copyBtn.onmousedown = e => e.preventDefault(); // Prevent focus outline
      copyBtn.onclick = function() {
        const seedBox = document.querySelector('.nft-seed-box');
        if (seedBox && seedBox.textContent) {
          navigator.clipboard.writeText(seedBox.textContent);
          copyBtn.textContent = '✔';
          copyBtn.style.color = '#27ae60';
          setTimeout(() => {
            copyBtn.textContent = '⧉';
            copyBtn.style.color = '#6c5ce7';
          }, 2000);
        }
      };
      rowFlex.appendChild(seedLabel);
      rowFlex.appendChild(seedBox);
      rowFlex.appendChild(copyBtn);
      raritySeedRow.appendChild(rowFlex);
    }
    // 2. Plus, minus, counter, randomize
    const seedListRandomRow = document.querySelector('.nft-seedlist-random-row');
    if (seedListRandomRow) {
      seedListRandomRow.innerHTML = '';
      // Outer flex: column for left/right
      const outerFlex = document.createElement('div');
      outerFlex.style.display = 'flex';
      outerFlex.style.flexDirection = 'row';
      outerFlex.style.width = '100%';
      outerFlex.style.alignItems = 'center';
      outerFlex.style.margin = '0';
      // Left group: plus, minus, counter
      const leftGroup = document.createElement('div');
      leftGroup.style.display = 'flex';
      leftGroup.style.alignItems = 'center';
      leftGroup.style.gap = '12px';
      const seedListCounter = document.createElement('span');
      seedListCounter.id = 'seed-list-counter';
      seedListCounter.style.fontWeight = 'bold';
      seedListCounter.style.fontSize = '13px';
      seedListCounter.style.marginLeft = '4px';
      seedListCounter.style.color = '#fff';
      function getTotalSupply(pd) {
        // First check the input field for the most current value
        const totalSupplyInput = document.getElementById('total-supply');
        if (totalSupplyInput && totalSupplyInput.value) {
          // Remove commas, dots, and other formatting characters before parsing
          const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
          return parseInt(cleanValue, 10) || 1;
        }
        if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
          return parseInt(pd.totalSupply, 10);
        } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
          return parseInt(pd.size, 10);
        }
        return 1;
      }
      let pdForCounter = projectData || window.currentProject;
      let totalSupply = getTotalSupply(pdForCounter);
      if (!totalSupply || isNaN(totalSupply) || totalSupply < 1) totalSupply = 1;
      const seedListKey = getSeedListKey(pdForCounter);
      let seedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      seedListCounter.textContent = `${self.formatNumberWithCommas(seedList.length || 0)} / ${self.formatNumberWithCommas(totalSupply)}`;
      leftGroup.appendChild(seedListCounter);
      outerFlex.appendChild(leftGroup);
      // Right group: randomize button
      const rightGroup = document.createElement('div');
      rightGroup.style.display = 'flex';
      rightGroup.style.flex = '1';
      rightGroup.style.justifyContent = 'flex-end';
      rightGroup.style.marginRight = '14px'; // Move Randomize button 14px left
      outerFlex.appendChild(rightGroup);
      seedListRandomRow.appendChild(outerFlex);
    }
    // 3. Seed toggle, label, input, Generate Seed
    const seedInputRow = document.querySelector('.nft-seedinput-row');
    if (seedInputRow) {
      seedInputRow.innerHTML = '';
      // Create a column container
      const columnContainer = document.createElement('div');
      columnContainer.style.display = 'flex';
      columnContainer.style.flexDirection = 'column';
      columnContainer.style.gap = '8px';
      columnContainer.style.width = '100%';

      // Single row: toggle, input and button all in same container
      const inputRow = document.createElement('div');
      inputRow.style.display = 'flex';
      inputRow.style.alignItems = 'center';
      inputRow.style.width = '100%';
      inputRow.style.gap = '8px'; // Add gap between all elements

      // Single container for toggle, input and button
      const inputButtonContainer = document.createElement('div');
      inputButtonContainer.className = 'seed-controls-container';
      inputButtonContainer.id = 'seed-controls-container';
      inputButtonContainer.style.display = 'flex';
      inputButtonContainer.style.alignItems = 'center';
      inputButtonContainer.style.gap = '8px';
      inputButtonContainer.style.width = '100%';
      inputButtonContainer.style.justifyContent = 'flex-end';

      // Create the toggle button
      const toggleButton = document.createElement('button');
      toggleButton.className = 'toggle-button';
      toggleButton.id = 'single-seed-toggle';
      toggleButton.type = 'button';
      toggleButton.textContent = 'Seed NFT';
      toggleButton.style.cssText = `
        padding: 8px 16px;
        border: 2px solid #4a4a4a;
        border-radius: 6px;
        background-color: #2a2a2a;
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        user-select: none;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;
      
      // Add click handler to toggle the button state
      toggleButton.addEventListener('click', function() {
        this.classList.toggle('active');
        // Trigger change event for any existing listeners
        const changeEvent = new Event('change', { bubbles: true });
        this.dispatchEvent(changeEvent);
      });

      const seedInput = document.createElement('input');
      seedInput.type = 'text';
      seedInput.id = 'single-seed-input';
      seedInput.placeholder = 'Paste Seed';
      seedInput.style.width = '166px';
      seedInput.style.height = '40px';
      seedInput.style.fontSize = '13px';
      seedInput.style.margin = '0';
      seedInput.style.padding = '0 8px';
      seedInput.style.borderRadius = '4px';
      seedInput.style.border = '1px solid #444';
      seedInput.style.background = '#181818';
      seedInput.style.color = '#fff';
      seedInput.style.textAlign = 'right';
      seedInput.value = '';
      seedInput.disabled = true;

      const generateSeedBtn = document.createElement('button');
      generateSeedBtn.id = 'generate-seed-nft-btn';
      generateSeedBtn.className = 'btn btn-primary';
      generateSeedBtn.textContent = 'Generate Seed';
      generateSeedBtn.style.width = '115px';
      generateSeedBtn.style.height = '40px';
      generateSeedBtn.style.fontSize = '13px';
      generateSeedBtn.style.margin = '0';
      generateSeedBtn.style.borderRadius = '4px';
      generateSeedBtn.style.border = '1px solid #007bff';
      generateSeedBtn.style.background = '#007bff';
      generateSeedBtn.style.color = '#fff';
      generateSeedBtn.disabled = true;

      // Create duplicate Generate Seed button positioned 35px above
      const duplicateGenerateSeedBtn = document.createElement('button');
      duplicateGenerateSeedBtn.id = 'generate-dark-nfts';
      duplicateGenerateSeedBtn.className = 'toggle-button';
      duplicateGenerateSeedBtn.textContent = 'Dark NFTs';
      duplicateGenerateSeedBtn.title = 'Deactivate Seed NFT toggle in order to use Dark NFT feature';
      duplicateGenerateSeedBtn.style.cssText = `
        padding: 8px 14px;
        border: 2px solid #4a4a4a;
        border-radius: 6px;
        background-color: #2a2a2a;
        color: #ffffff;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
        outline: none;
        user-select: none;
        height: 40px;
        width: 99px;
        min-width: 99px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        top: -35px;
        left: 0;
        text-align: center;
      `;
      duplicateGenerateSeedBtn.disabled = true;

      // Add toggle, input and button to the same container
      inputButtonContainer.appendChild(toggleButton);
      inputButtonContainer.appendChild(seedInput);
      inputButtonContainer.appendChild(generateSeedBtn);
      
      // Add duplicate button to the container (positioned absolutely)
      inputButtonContainer.style.position = 'relative';
      inputButtonContainer.appendChild(duplicateGenerateSeedBtn);
      
      // Create edit button for Dark NFTs configuration (initially hidden)
      const darkTraitsEditBtn = document.createElement('button');
      darkTraitsEditBtn.id = 'dark-traits-edit-btn';
      darkTraitsEditBtn.className = 'dark-traits-edit-btn';
      darkTraitsEditBtn.innerHTML = 'EDIT';
      darkTraitsEditBtn.title = 'Configure Dark NFT traits - Select which traits to use for Dark NFT generation';
      darkTraitsEditBtn.style.cssText = `
        position: absolute;
        top: -45px;
        left: -6px;
        width: 40px;
        height: 20px;
        background: #ff6b35;
        color: white;
        border: 2px solid #000;
        border-radius: 4px;
        font-size: 8px;
        font-weight: bold;
        cursor: pointer;
        display: none;
        opacity: 0;
        transition: all 0.3s ease;
        z-index: 10;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      `;
      
      // Add edit button to container
      inputButtonContainer.appendChild(darkTraitsEditBtn);
      
      // Add click event listener for edit button
      darkTraitsEditBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        try {
          const self = window.NFTApp.getModule('generateNftsUI');
          if (self && self.openDarkTraitsModal) {
            self.openDarkTraitsModal();
          } else {
            console.error('[DEBUG] generateNftsUI module or openDarkTraitsModal method not found');
          }
        } catch (error) {
          console.error('[DEBUG] Error opening Dark Traits modal:', error);
        }
      });
      
      // Add hover effects
      darkTraitsEditBtn.addEventListener('mouseenter', () => {
        darkTraitsEditBtn.style.background = '#d63031';
        darkTraitsEditBtn.style.transform = 'scale(1.1)';
      });

      darkTraitsEditBtn.addEventListener('mouseleave', () => {
        darkTraitsEditBtn.style.background = '#ff6b35';
        darkTraitsEditBtn.style.transform = 'scale(1)';
      });
      
      inputRow.appendChild(inputButtonContainer);
      columnContainer.appendChild(inputRow);

      seedInputRow.appendChild(columnContainer);
      
      // Update event listener to work with button toggle
      toggleButton.addEventListener('change', function() {
        const isActive = this.classList.contains('active');
        seedInput.disabled = !isActive;
        generateSeedBtn.disabled = !isActive;
        
        // Dark NFTs toggle is only disabled when Seed NFT is active
        duplicateGenerateSeedBtn.disabled = isActive;
        
        // If Seed NFT toggle is active, deactivate Dark NFTs toggle
        if (isActive) {
          duplicateGenerateSeedBtn.classList.remove('active');
          const self = window.NFTApp.getModule('generateNftsUI');
          self.darkModeEnabled = false;
          console.log('[DEBUG] Dark NFTs toggle deactivated - Seed NFT toggle is active');
        }
      });
      
      // Set initial state
      const isInitiallyActive = toggleButton.classList.contains('active');
      seedInput.disabled = !isInitiallyActive;
      generateSeedBtn.disabled = !isInitiallyActive;
      duplicateGenerateSeedBtn.disabled = isInitiallyActive; // Only disabled when Seed NFT is active
      
      generateSeedBtn.addEventListener('click', () => {
        const pd = (window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData) || window.currentProject || null;
        if (pd) {
          window.NFTApp.getModule('generateNftsUI').generateSeedNFT(pd);
        }
      });
      
      // Add dark mode toggle functionality to duplicate button (same as Seed NFT toggle)
      duplicateGenerateSeedBtn.addEventListener('click', function() {
        // Check if Seed NFT toggle is active
        const seedToggle = document.getElementById('single-seed-toggle');
        const isSeedToggleActive = seedToggle && seedToggle.classList.contains('active');
        
        if (isSeedToggleActive) {
          // Don't toggle Dark NFTs when Seed NFT is active
          console.log('[DEBUG] Dark NFTs toggle blocked - Seed NFT toggle is active');
          return;
        }
        
        this.classList.toggle('active');
        // Trigger change event for any existing listeners
        const changeEvent = new Event('change', { bubbles: true });
        this.dispatchEvent(changeEvent);
      });
      
      // Add change event listener for dark mode functionality
      duplicateGenerateSeedBtn.addEventListener('change', function() {
        const isActive = this.classList.contains('active');
        const self = window.NFTApp.getModule('generateNftsUI');
        self.darkModeEnabled = isActive;
        
        // Show/hide edit button with animation
        const editBtn = document.getElementById('dark-traits-edit-btn');
        if (editBtn) {
          if (isActive) {
            editBtn.style.display = 'flex';
            setTimeout(() => editBtn.style.opacity = '1', 10);
          } else {
            editBtn.style.opacity = '0';
            setTimeout(() => editBtn.style.display = 'none', 300);
          }
        }
        
        // Update Create NFT button visual
        const createNftBtn = document.getElementById('nft-action-create-btn');
        if (createNftBtn) {
          if (isActive) {
            // Match Dark NFTs toggle styling exactly
            createNftBtn.style.backgroundColor = '#00ff88';
            createNftBtn.style.borderColor = '#00ff88';
            createNftBtn.style.color = '#000000';
            createNftBtn.style.boxShadow = 'inset 0 3px 5px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)';
            createNftBtn.style.fontWeight = 'bold';
            createNftBtn.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.3)';
            createNftBtn.style.animation = 'darkToggleActivate 0.3s ease-out';
            // Ensure dimensions remain exactly the same
            createNftBtn.style.width = '102px';
            createNftBtn.style.height = '66px';
            createNftBtn.style.borderRadius = '8px';
            createNftBtn.style.border = '2px solid #00ff88';
            createNftBtn.classList.add('dark-mode-active');
          } else {
            // Restore default styling exactly
            createNftBtn.style.backgroundColor = '#047857';
            createNftBtn.style.borderColor = '#047857';
            createNftBtn.style.color = '#ffffff';
            createNftBtn.style.boxShadow = '';
            createNftBtn.style.fontWeight = 'bold';
            createNftBtn.style.textShadow = '2px 2px 0 #000000';
            createNftBtn.style.animation = '';
            // Ensure dimensions remain exactly the same
            createNftBtn.style.width = '102px';
            createNftBtn.style.height = '66px';
            createNftBtn.style.borderRadius = '8px';
            createNftBtn.style.border = '2px solid #047857';
            createNftBtn.classList.remove('dark-mode-active');
          }
        }
        
        if (isActive) {
          console.log('[DEBUG] Dark Mode enabled - will generate NFTs with mostly dark traits');
        } else {
          console.log('[DEBUG] Dark Mode disabled - will generate NFTs with random traits');
        }
      });
    }
    // Ensure seed counter always displays correct value by default
    const seedListCounter = document.getElementById('seed-list-counter');
    if (seedListCounter) {
      function getTotalSupply(pd) {
        // First check the input field for the most current value
        const totalSupplyInput = document.getElementById('total-supply');
        if (totalSupplyInput && totalSupplyInput.value) {
          // Remove commas, dots, and other formatting characters before parsing
          const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
          return parseInt(cleanValue, 10) || 1;
        }
        if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
          return parseInt(pd.totalSupply, 10);
        } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
          return parseInt(pd.size, 10);
        }
        return 1;
      }
      let pd = window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData ? window.NFTApp.getModule('generateNftsUI').projectData : window.currentProject;
      let totalSupply = getTotalSupply(pd);
      if (!totalSupply || isNaN(totalSupply) || totalSupply < 1) totalSupply = 1;
      const seedListKey = getSeedListKey(pd);
      let seedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      seedListCounter.textContent = `${self.formatNumberWithCommas(seedList.length || 0)} / ${self.formatNumberWithCommas(totalSupply)}`;
      setSeedListCounterColor(seedListCounter, seedList.length || 0, totalSupply);
    }
  },

  // Overlay Save NFT button in preview area
  showSaveNftOverlay: function(callback) {
    this.removeSaveNftOverlay();
    const previewPanel = document.querySelector('.nft-preview-image-area');
    if (!previewPanel) return;
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'save-nft-preview-overlay';
    overlay.style.position = 'absolute';
    overlay.style.right = '18px';
    overlay.style.bottom = '18px';
    overlay.style.zIndex = '30';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.alignItems = 'flex-end';
    overlay.style.pointerEvents = 'none';
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.3s ease-in-out';
    // Create Update NFT Seed button
    const btn = document.createElement('button');
    btn.textContent = 'Update NFT Seed';
    btn.className = 'btn btn-primary';
    // Force green background to override .btn-primary
    btn.style.background = '#00971c'; // Always green, overrides .btn-primary
    btn.style.width = '140px';
    btn.style.height = '36px';
    btn.style.fontSize = '15px';
    btn.style.borderRadius = '8px';
    btn.style.boxShadow = '0 2px 8px rgba(0,0,0,0.18)';
    btn.style.margin = '0';
    btn.style.pointerEvents = 'auto';
    btn.onclick = (e) => {
      e.stopPropagation();
      if (typeof callback === 'function') callback();
      this.removeSaveNftOverlay();
    };
    overlay.appendChild(btn);
    // Ensure previewPanel is relative for absolute overlay
    previewPanel.style.position = 'relative';
    previewPanel.appendChild(overlay);
    
    // Trigger fade-in animation
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
  },
  removeSaveNftOverlay: function() {
    const previewPanel = document.querySelector('.nft-preview-image-area');
    if (!previewPanel) return;
    const overlay = previewPanel.querySelector('.save-nft-preview-overlay');
    if (overlay) {
      // Trigger fade-out animation
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.3s ease-in-out';
      
      // Remove overlay after animation completes
      setTimeout(() => {
        if (overlay && overlay.parentNode) {
          overlay.remove();
        }
      }, 300);
    }
  }
}); 

// Helper to get project-specific seed list key
function getSeedListKey(project) {
  return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
}

// The rest of the setup (event listeners, etc.) can be added as needed
if (window.NFTApp.getModule('generateNfts')) {
  // Use the stored projectData from the module, or fallback to window.currentProject
  const pd = (window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData) || window.currentProject || null;
  window.NFTApp.getModule('generateNfts').setupEventListeners(pd);
}

// Instead, add this global function to render the controls after the project interface is created
window.renderInitialGenerateNftsControls = function() {
  if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
    window.NFTApp.getModule('generateNftsUI').setupUI({});
  }
};

// Define style for 'none' trait name
const noneStyle = 'color: #888; font-size: 10px; text-align: center; width: 100%;';

// --- [ADDED UTILITY FUNCTIONS FOR BUTTON GUARDING] ---
function disableNftGenButtons() {
  const genBtn = document.getElementById('generate-seed-nft-btn');
  if (genBtn) genBtn.disabled = true;
}
function enableNftGenButtons() {
  const genBtn = document.getElementById('generate-seed-nft-btn');
  if (genBtn) genBtn.disabled = false;
}
// --- [END BUTTON GUARDING UTILS] ---

// --- [HELPER: IS NONE FORCED BY RULES] ---
function isNoneForcedByRules(layer, nft, projectData) {
  if (!layer || !layer.traits || !projectData || !projectData.rules || !projectData.rules.length) {
    console.log('[DEBUG][isNoneForcedByRules] Early exit: missing layer/traits/projectData/rules', {layer, nft, projectData});
    return false;
  }
  const generateNfts = window.NFTApp.getModule('generateNfts');
  if (!generateNfts || typeof generateNfts.checkForRuleViolations !== 'function') {
    console.log('[DEBUG][isNoneForcedByRules] Early exit: generateNfts/checkForRuleViolations missing');
    return false;
  }
  // Log the rules being checked for this layer
  const relevantRules = (projectData.rules || []).filter(rule => {
    if (rule.type === 'never-combine' && rule.appliesTo === 'between-traits') {
      return (rule.firstLayerId === layer.id || rule.secondLayerId === layer.id);
    }
    return false;
  });
  console.log(`[DEBUG][isNoneForcedByRules] Checking layer '${layer.name}' (id: ${layer.id}) with relevant rules:`, relevantRules);
  let allForbidden = true;
  for (const trait of layer.traits) {
    // Simulate NFT with this trait selected for this layer
    const simulatedTraits = nft.traits.map(t => ({...t}));
    const idx = simulatedTraits.findIndex(t => (t.layer && t.layer.id === layer.id) || (t.layer && t.layer.name === layer.name) || t.layer === layer.name);
    if (idx !== -1) {
      simulatedTraits[idx] = { ...simulatedTraits[idx], trait };
    } else {
      simulatedTraits.push({ layer, trait });
    }
    const simulatedNFT = { ...nft, traits: simulatedTraits };
    const violations = generateNfts.checkForRuleViolations(simulatedNFT, projectData.rules);
    // Log the violations for this trait
    console.log(`[DEBUG][isNoneForcedByRules] Trait '${trait.name}' in layer '${layer.name}': violations:`, violations);
    // If any trait is allowed, not forced-none
    if (!violations || violations.length === 0) {
      console.log(`[DEBUG][isNoneForcedByRules] Trait '${trait.name}' in layer '${layer.name}' is allowed (no violations)`, {trait, layer, violations});
      allForbidden = false;
      break;
    }
    // Only count as forced-none if every trait is forbidden by a never-combine rule that mentions this trait
    const hasNeverCombine = violations.some(v => v.includes('should never be combined') && v.includes(trait.name));
    if (!hasNeverCombine) {
      console.log(`[DEBUG][isNoneForcedByRules] Trait '${trait.name}' in layer '${layer.name}' is not forbidden by never-combine (no direct mention)`, {trait, layer, violations});
      allForbidden = false;
      break;
    } else {
      console.log(`[DEBUG][isNoneForcedByRules] Trait '${trait.name}' in layer '${layer.name}' is forbidden by never-combine (direct mention)`, {trait, layer, violations});
    }
  }
  if (allForbidden) {
    console.log(`[DEBUG][isNoneForcedByRules] Layer '${layer.name}' is forced to none by rules (all traits forbidden by never-combine)`);
  } else {
    console.log(`[DEBUG][isNoneForcedByRules] Layer '${layer.name}' is NOT forced to none (at least one trait allowed)`);
  }
  return allForbidden;
}
// --- [END HELPER] ---

// --- [HELPER: IS TRAIT FORBIDDEN BY RULES] ---
function getTraitRuleViolation(layer, trait, nft, projectData) {
  if (!layer || !trait || !projectData || !projectData.rules || !projectData.rules.length) return null;
  // Exclude 'none' traits from forbidden overlay logic
  if (trait.id === 'none' || trait.name === 'none' || trait === 'none') return null;
  const generateNfts = window.NFTApp.getModule('generateNfts');
  if (!generateNfts || typeof generateNfts.checkForRuleViolations !== 'function') return null;
  // Only check for forbidden if this trait is explicitly listed in a never-combine rule
  let isTraitInNeverCombine = false;
  for (const rule of projectData.rules) {
    if (rule.type === 'never-combine' && rule.appliesTo === 'between-traits' && rule.firstTraits && rule.secondTraits) {
      for (const ft of rule.firstTraits) {
        if (trait.id === ft.id && layer.id === ft.layerId) {
          isTraitInNeverCombine = true;
        }
      }
      for (const st of rule.secondTraits) {
        if (trait.id === st.id && layer.id === st.layerId) {
          isTraitInNeverCombine = true;
        }
      }
    }
  }
  if (!isTraitInNeverCombine) return null;
  // Simulate NFT with this trait selected for this layer
  const simulatedTraits = nft.traits.map(t => ({...t}));
  const idx = simulatedTraits.findIndex(t => (t.layer && t.layer.id === layer.id) || (t.layer && t.layer.name === layer.name) || t.layer === layer.name);
  if (idx !== -1) {
    simulatedTraits[idx] = { ...simulatedTraits[idx], trait };
  } else {
    simulatedTraits.push({ layer, trait });
  }
  const simulatedNFT = { ...nft, traits: simulatedTraits };
  // Now check if the forbidden pair is present
  for (const rule of projectData.rules) {
    if (rule.type === 'never-combine' && rule.appliesTo === 'between-traits' && rule.firstTraits && rule.secondTraits) {
      // Check if this trait is a firstTrait and the NFT has a forbidden secondTrait
      for (const ft of rule.firstTraits) {
        if (trait.id === ft.id && layer.id === ft.layerId) {
          for (const st of rule.secondTraits) {
            const found = simulatedNFT.traits.find(t => t.layer && t.layer.id === rule.secondLayerId && t.trait && t.trait.id === st.id);
            if (found) {
              return `Forbidden: This trait ("${trait.name}") cannot be combined with "${found.trait.name}"`;
            }
          }
        }
      }
      // Check if this trait is a secondTrait and the NFT has a forbidden firstTrait
      for (const st of rule.secondTraits) {
        if (trait.id === st.id && layer.id === st.layerId) {
          for (const ft of rule.firstTraits) {
            const found = simulatedNFT.traits.find(t => t.layer && t.layer.id === rule.firstLayerId && t.trait && t.trait.id === ft.id);
            if (found) {
              return `Forbidden: This trait ("${trait.name}") cannot be combined with "${found.trait.name}"`;
            }
          }
        }
      }
    }
  }
  return null;
}
// ... existing code ...

window.NFTApp.getModule('generateNftsUI').applyForbiddenOverlaysToModal = function(modal, nft, projectData) {
  console.log('[DEBUG] applyForbiddenOverlaysToModal called', {modal, nft, projectData});
  if (!modal) return;
  const allThumbs = modal.querySelectorAll('.trait-selection-thumb');
  const layerMap = {};
  if (projectData && projectData.traits) {
    projectData.traits.forEach(layer => {
      layerMap[layer.id] = layer;
      layerMap[layer.name] = layer;
    });
  }
  allThumbs.forEach(thumb => {
    const traitId = thumb.getAttribute('data-trait-id');
    const layerId = thumb.getAttribute('data-layer-id');
    const layer = layerMap[layerId] || layerMap[thumb.getAttribute('data-layer-name')] || null;
    let trait = null;
    if (layer && layer.traits) {
      trait = layer.traits.find(t => t.id === traitId || t.name === traitId);
    }
    // Special case for 'none'
    if (traitId === 'none') {
      return;
    }
    let forbidden = false;
    let forbiddenMsg = '';
    if (layer && trait) {
      // Simulate NFT with this trait selected for this layer
      const simulatedTraits = nft && nft.traits ? nft.traits.map(t => ({...t})) : [];
      const idx = simulatedTraits.findIndex(t => (t.layer && (t.layer.id === layer.id || t.layer.name === layer.name)) || t.layer === layer.id || t.layer === layer.name);
      if (idx !== -1) {
        simulatedTraits[idx] = { ...simulatedTraits[idx], trait };
      } else {
        simulatedTraits.push({ layer, trait });
      }
      const simulatedNFT = { ...nft, traits: simulatedTraits };
      // --- Check all never-combine rules robustly ---
      if (Array.isArray(projectData.rules)) {
        for (const rule of projectData.rules) {
          if (rule.type === 'never-combine') {
            // between-traits
            if (rule.appliesTo === 'between-traits' && rule.firstTraits && rule.secondTraits) {
              // Check if this trait is in firstTraits or secondTraits (by id or name)
              const isFirst = rule.firstTraits.some(ft => (ft.id === trait.id && ft.layerId === layer.id) || (ft.name === trait.name && ft.layerId === layer.id));
              const isSecond = rule.secondTraits.some(st => (st.id === trait.id && st.layerId === layer.id) || (st.name === trait.name && st.layerId === layer.id));
              if (isFirst) {
                for (const st of rule.secondTraits) {
                  const found = simulatedNFT.traits.find(t => (t.layer && (t.layer.id === st.layerId || t.layer.name === st.layerName)) && t.trait && (t.trait.id === st.id || t.trait.name === st.name));
                  if (found) {
                    forbidden = true;
                    forbiddenMsg = `Forbidden: This trait ("${trait.name}") cannot be combined with "${found.trait.name}"`;
                    break;
                  }
                }
              }
              if (!forbidden && isSecond) {
                for (const ft of rule.firstTraits) {
                  const found = simulatedNFT.traits.find(t => (t.layer && (t.layer.id === ft.layerId || t.layer.name === ft.layerName)) && t.trait && (t.trait.id === ft.id || t.trait.name === ft.name));
                  if (found) {
                    forbidden = true;
                    forbiddenMsg = `Forbidden: This trait ("${trait.name}") cannot be combined with "${found.trait.name}"`;
                    break;
                  }
                }
              }
              if (forbidden) break;
            }
            // between-layers
            if (rule.appliesTo === 'between-layers' && rule.firstLayerId && rule.secondLayerId) {
              const firstTrait = simulatedNFT.traits.find(t => (t.layer && (t.layer.id === rule.firstLayerId || t.layer.name === rule.firstLayerName)) && t.trait && t.trait.name !== 'none');
              const secondTrait = simulatedNFT.traits.find(t => (t.layer && (t.layer.id === rule.secondLayerId || t.layer.name === rule.secondLayerName)) && t.trait && t.trait.name !== 'none');
              if (firstTrait && secondTrait && (layer.id === rule.firstLayerId || layer.id === rule.secondLayerId || layer.name === rule.firstLayerName || layer.name === rule.secondLayerName)) {
                forbidden = true;
                forbiddenMsg = `Forbidden: Layer "${rule.firstLayerName || rule.firstLayerId}" and Layer "${rule.secondLayerName || rule.secondLayerId}" should never be combined.`;
                break;
              }
            }
            // layer-to-traits or traits-to-layer
            if ((rule.appliesTo === 'layer-to-traits' || rule.appliesTo === 'traits-to-layer') && rule.layerId && rule.traits) {
              // If this trait is in the forbidden list for this layer
              if (layer.id === rule.layerId || layer.name === rule.layerName) {
                for (const t of rule.traits) {
                  if (trait.id === t.id || trait.name === t.name) {
                    forbidden = true;
                    forbiddenMsg = `Forbidden: Trait "${trait.name}" cannot be used in Layer "${layer.name}" due to rules.`;
                    break;
                  }
                }
              }
            }
          }
        }
      }
      // Debug log for each trait
      console.log(`[DEBUG][applyForbiddenOverlaysToModal] Trait: ${trait.name} (Layer: ${layer.name}) Forbidden: ${forbidden} Msg: ${forbiddenMsg}`);
      // Only add overlays if forbidden, never remove overlays
      const imgDiv = thumb.querySelector('.trait-selection-img') || thumb;
      if (forbidden) {
        // Add grey overlay if not present
        if (!imgDiv.querySelector('.trait-forbidden-grey')) {
          const greyDiv = document.createElement('div');
          greyDiv.className = 'trait-forbidden-grey';
          greyDiv.style.position = 'absolute';
          greyDiv.style.top = '0';
          greyDiv.style.left = '0';
          greyDiv.style.width = '100%';
          greyDiv.style.height = '100%';
          greyDiv.style.background = 'rgba(40,40,40,0.45)';
          greyDiv.style.zIndex = '1';
          greyDiv.style.pointerEvents = 'none';
          imgDiv.appendChild(greyDiv);
        }
        // Add forbidden sign if not present
        if (!imgDiv.querySelector('.trait-forbidden-overlay')) {
          const forbiddenDiv = document.createElement('div');
          forbiddenDiv.className = 'trait-forbidden-overlay';
          forbiddenDiv.style.position = 'absolute';
          forbiddenDiv.style.top = '50%';
          forbiddenDiv.style.left = '50%';
          forbiddenDiv.style.transform = 'translate(-50%, -50%)';
          forbiddenDiv.style.width = '40px';
          forbiddenDiv.style.height = '40px';
          forbiddenDiv.style.opacity = '1';
          forbiddenDiv.style.background = 'none';
          forbiddenDiv.style.borderRadius = '0';
          forbiddenDiv.style.display = 'flex';
          forbiddenDiv.style.alignItems = 'center';
          forbiddenDiv.style.justifyContent = 'center';
          forbiddenDiv.style.pointerEvents = 'none';
          forbiddenDiv.style.zIndex = '2';
          forbiddenDiv.innerHTML = `<svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="26" stroke="#ff2222" stroke-width="8" fill="none"/><line x1="15" y1="45" x2="45" y2="15" stroke="#ff2222" stroke-width="8" stroke-linecap="round"/></svg>`;
          imgDiv.appendChild(forbiddenDiv);
        }
        thumb.title = forbiddenMsg || 'This trait is forbidden by current rules.';
      } else {
        thumb.title = '';
      }
    }
  });
};

// Helper to filter rules for a specific layer
function getRulesForLayer(projectData, layer) {
  if (!projectData || !projectData.rules || !layer) return [];
  return projectData.rules.filter(rule => {
    // between-layers
    if (rule.firstLayerId && rule.secondLayerId) {
      return rule.firstLayerId === layer.id || rule.secondLayerId === layer.id;
    }
    // between-traits
    if (rule.firstTraits && rule.secondTraits) {
      return (rule.firstTraits.some(t => t.layerId === layer.id) || rule.secondTraits.some(t => t.layerId === layer.id));
    }
    // layer-to-traits or traits-to-layer
    if (rule.layerId) {
      if (rule.layerId === layer.id) return true;
      if (rule.traits && rule.traits.some(t => t.layerId === layer.id)) return true;
    }
    return false;
  });
}

// --- [HELPER: GET NONE FORCED BY RULES DETAILS] ---
function getNoneForcedByRulesDetails(layer, nft, projectData) {
  if (!layer || !layer.traits || !projectData || !projectData.rules || !projectData.rules.length) return 'This layer cannot have a trait due to active rules.';
  const generateNfts = window.NFTApp.getModule('generateNfts');
  if (!generateNfts || typeof generateNfts.checkForRuleViolations !== 'function') return 'This layer cannot have a trait due to active rules.';
  // Collect all violations for each trait
  let traitViolations = [];
  for (const trait of layer.traits) {
    const simulatedTraits = nft.traits.map(t => ({...t}));
    const idx = simulatedTraits.findIndex(t => (t.layer && t.layer.id === layer.id) || (t.layer && t.layer.name === layer.name) || t.layer === layer.name);
    if (idx !== -1) {
      simulatedTraits[idx] = { ...simulatedTraits[idx], trait };
    } else {
      simulatedTraits.push({ layer, trait });
    }
    const simulatedNFT = { ...nft, traits: simulatedTraits };
    const violations = generateNfts.checkForRuleViolations(simulatedNFT, projectData.rules) || [];
    traitViolations.push(new Set(violations));
  }
  // Find violations that are present for every trait
  let commonViolations = [];
  if (traitViolations.length > 0) {
    commonViolations = Array.from(traitViolations[0]);
    for (let i = 1; i < traitViolations.length; i++) {
      commonViolations = commonViolations.filter(v => traitViolations[i].has(v));
    }
  }
  // Log for debugging
  console.log('[DEBUG][getNoneForcedByRulesDetails] commonViolations:', commonViolations);
  // Only keep unique, user-friendly layer-to-layer or trait-to-layer rules
  let filtered = [];
  let seen = new Set();
  for (let v of commonViolations) {
    // Only keep rules that are about layers or traits never being combined
    let match = v.match(/Layers? "(.+?)" and "(.+?)" should never be combined/);
    if (match) {
      let msg = `Layers "${match[1]}" and "${match[2]}" should never be combined`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Layer "(.+?)" and Layer "(.+?)" should never be combined/);
    if (match) {
      let msg = `Layers "${match[1]}" and "${match[2]}" should never be combined`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    // Optionally, add trait-to-layer or trait-to-trait only if all traits are blocked by this
    match = v.match(/Trait "(.+?)" should never be combined with Layer "(.+?)"/);
    if (match) {
      let msg = `Trait "${match[1]}" and Layer "${match[2]}" should never be combined`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Layer "(.+?)" should never be combined with Trait "(.+?)"/);
    if (match) {
      let msg = `Layer "${match[1]}" and Trait "${match[2]}" should never be combined`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    // Only include trait-to-trait if it blocks all traits (rare)
    match = v.match(/Traits? "(.+?)" and "(.+?)" should never be combined/);
    if (match) {
      let msg = `Traits "${match[1]}" and "${match[2]}" should never be combined`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    // --- NEW: Match immediately above/below rules ---
    match = v.match(/Layer "(.+?)" must be rendered immediately above trait "(.+?)"/);
    if (match) {
      let msg = `Layer "${match[1]}" must be rendered immediately above trait "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Trait "(.+?)" must be rendered immediately above layer "(.+?)"/);
    if (match) {
      let msg = `Trait "${match[1]}" must be rendered immediately above layer "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Layer "(.+?)" must be rendered immediately below trait "(.+?)"/);
    if (match) {
      let msg = `Layer "${match[1]}" must be rendered immediately below trait "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Trait "(.+?)" must be rendered immediately below layer "(.+?)"/);
    if (match) {
      let msg = `Trait "${match[1]}" must be rendered immediately below layer "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    // --- NEW: Match immediately above/below rules (trait/layer to trait/layer) ---
    match = v.match(/Trait "(.+?)" must be rendered immediately above "(.+?)"/);
    if (match) {
      let msg = `Trait "${match[1]}" must be rendered immediately above "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Trait "(.+?)" must be rendered immediately below "(.+?)"/);
    if (match) {
      let msg = `Trait "${match[1]}" must be rendered immediately below "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Layer "(.+?)" must be rendered immediately above "(.+?)"/);
    if (match) {
      let msg = `Layer "${match[1]}" must be rendered immediately above "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
    match = v.match(/Layer "(.+?)" must be rendered immediately below "(.+?)"/);
    if (match) {
      let msg = `Layer "${match[1]}" must be rendered immediately below "${match[2]}"`;
      if (!seen.has(msg)) { filtered.push(msg); seen.add(msg); }
      continue;
    }
  }
  if (filtered.length > 0) return 'Blocked by rules for all traits in this layer:\n\n' + filtered.join('\n');
  // If no filtered, but there are commonViolations, show them directly
  if (commonViolations.length === 1) return 'Blocked by rules for all traits in this layer:\n\n' + commonViolations[0];
  if (commonViolations.length > 1) return 'Blocked by rules for all traits in this layer:\n\n' + commonViolations.join('\n');
  return 'This layer cannot have a trait due to active rules.';
}
// --- [END HELPER] ---

// Listen for total-supply-updated event to refresh the seed-list-counter
if (typeof window !== 'undefined') {
  window.addEventListener('total-supply-updated', function() {
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
      // Update the module's projectData from window.currentProject
      if (window.currentProject) {
        window.NFTApp.getModule('generateNftsUI').projectData = window.currentProject;
      }
      if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
        window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter();
      }
    }
  });
}

// Add a method to refresh the seed-list-counter with caching
if (!window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter) {
  // Cache for seed counter data to avoid repeated calculations
  const seedCounterCache = {
    lastUpdate: 0,
    cachedData: null,
    cacheTimeout: 5000 // Cache for 5 seconds to reduce frequent refreshes
  };

  window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter = function(forceRefresh = false) {
    const seedListCounter = document.getElementById('seed-list-counter');
    if (!seedListCounter) return;

    const now = Date.now();
    
    // Use cache if available and not expired, unless force refresh is requested
    if (!forceRefresh && seedCounterCache.cachedData && (now - seedCounterCache.lastUpdate) < seedCounterCache.cacheTimeout) {
      seedListCounter.textContent = seedCounterCache.cachedData.text;
      seedListCounter.style.color = seedCounterCache.cachedData.color;
      return;
    }

    // Debounce multiple rapid calls
    if (this._refreshTimeout) {
      clearTimeout(this._refreshTimeout);
    }
    
    this._refreshTimeout = setTimeout(() => {
      this._performRefresh();
    }, 50); // 50ms debounce
  };

  // Separate function for the actual refresh logic
  window.NFTApp.getModule('generateNftsUI')._performRefresh = function() {
    // Store reference to the module for use in formatting
    const self = window.NFTApp.getModule('generateNftsUI');
    
    const seedListCounter = document.getElementById('seed-list-counter');
    if (!seedListCounter) return;

    function getTotalSupply(pd) {
      // --- FIX: Always use the latest value from the input field if present ---
      const totalSupplyInput = document.getElementById('total-supply');
      if (totalSupplyInput && totalSupplyInput.value) {
        // Remove commas, dots, and other formatting characters before parsing
        const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
        return parseInt(cleanValue, 10) || 1;
      }
      if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
        return parseInt(pd.totalSupply, 10);
      } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
        return parseInt(pd.size, 10);
      }
      return 1;
    }
    
    let pd = window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData ? window.NFTApp.getModule('generateNftsUI').projectData : window.currentProject;
    let totalSupply = getTotalSupply(pd);
    if (!totalSupply || isNaN(totalSupply) || totalSupply < 1) totalSupply = 1;
    const seedListKey = getSeedListKey(pd);
    
    // Use try-catch for localStorage operations
    let seedList = [];
    try {
      const storedData = localStorage.getItem(seedListKey);
      if (storedData) {
        seedList = JSON.parse(storedData);
      }
    } catch (error) {
      console.warn('Error parsing seed list from localStorage:', error);
      seedList = [];
    }
    
    const seedCount = seedList.length || 0;
    const text = `${self.formatNumberWithCommas(seedCount)} / ${self.formatNumberWithCommas(totalSupply)}`;
    
    // Update display
    seedListCounter.textContent = text;
    setSeedListCounterColor(seedListCounter, seedCount, totalSupply);
    
    // Cache the result
    const now = Date.now();
    seedCounterCache.cachedData = {
      text: text,
      color: seedListCounter.style.color
    };
    seedCounterCache.lastUpdate = now;
    
    console.log('[DEBUG] refreshSeedListCounter performed:', seedCount, totalSupply);
  }
}

// At the end of the module registration, after all other setup:

// Make ensureNftPreviewContainerExists available globally for tests
window.ensureNftPreviewContainerExists = function() {
  const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
  if (generateNftsUIModule && generateNftsUIModule.ensureNftPreviewContainerExists) {
    return generateNftsUIModule.ensureNftPreviewContainerExists();
  } else {
    console.error('[DEBUG] generateNftsUI module or ensureNftPreviewContainerExists method not found');
    return false;
  }
};

// Ensure seed-list-counter updates immediately when total supply changes
window.addEventListener('DOMContentLoaded', function() {
  const totalSupplyInput = document.getElementById('total-supply');
  if (totalSupplyInput) {
    // Debounce timer for input events
    let inputDebounceTimer = null;
    
    // Listen for input events
    totalSupplyInput.addEventListener('input', function() {
      // Clear existing timer
      if (inputDebounceTimer) {
        clearTimeout(inputDebounceTimer);
      }
      
      // Set new timer
      inputDebounceTimer = setTimeout(() => {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
          const val = parseInt(totalSupplyInput.value, 10) || 0;
          if (window.NFTApp.getModule('generateNftsUI').projectData) {
            window.NFTApp.getModule('generateNftsUI').projectData.totalSupply = val;
            window.NFTApp.getModule('generateNftsUI').projectData.size = val;
          }
          if (window.currentProject) {
            window.currentProject.totalSupply = val;
            window.currentProject.size = val;
          }
          // --- FIX: Only re-render control rows, then refresh counter ONCE after DOM is updated ---
          if (typeof window.NFTApp.getModule('generateNftsUI')._renderControlRows === 'function') {
            window.NFTApp.getModule('generateNftsUI')._renderControlRows(window.NFTApp.getModule('generateNftsUI').projectData);
            console.log('[DEBUG] totalSupplyInput: _renderControlRows called after supply change');
            setTimeout(function() {
              if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
                window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true); // Force refresh
                console.log('[DEBUG] totalSupplyInput: refreshSeedListCounter called after re-render (setTimeout)');
              }
            }, 0);
          }
        }
      }, 300); // 300ms debounce
    });
    
    // Debounce timer for mutation observer
    let mutationDebounceTimer = null;
    
    // Listen for programmatic changes
    const observer = new MutationObserver(function() {
      // Clear existing timer
      if (mutationDebounceTimer) {
        clearTimeout(mutationDebounceTimer);
      }
      
      // Set new timer
      mutationDebounceTimer = setTimeout(() => {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
          if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
            window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true); // Force refresh
          }
        }
      }, 100); // 100ms debounce
    });
    observer.observe(totalSupplyInput, { attributes: true, childList: false, subtree: false, characterData: false });
  }
});

// Remove any dynamically injected grid styles for .trait-items-container
const prevGridStyle = document.getElementById('trait-items-container-grid-style');
if (prevGridStyle) prevGridStyle.remove();
// Only inject flex column style for .trait-items-container
const styleElement = document.createElement('style');
styleElement.id = 'trait-items-container-flex-style';
styleElement.textContent = `
  .trait-items-container {
    display: flex !important;
    flex-direction: column !important;
    overflow-y: auto !important;
    flex: 1 1 auto !important;
    height: 100% !important;
    max-height: none !important;
    gap: 10px !important;
    grid-template-columns: unset !important;
    padding: 0 !important;
    box-sizing: border-box !important;
  }
`;
document.head.appendChild(styleElement);

// --- RUNTIME FIX: FORCE TRAIT ITEMS CONTAINER TO FLEX COLUMN, REMOVE GRID ---
(function enforceTraitItemsContainerFlex() {
  function fixTraitItemsContainers() {
    document.querySelectorAll('.trait-items-container').forEach(container => {
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.overflowY = 'auto';
      container.style.flex = '1 1 auto';
      container.style.height = '100%';
      container.style.maxHeight = 'none';
      container.style.gap = '10px';
      container.style.gridTemplateColumns = 'unset';
      container.style.padding = '0';
      container.style.boxSizing = 'border-box';
    });
    // Remove any style tags that set .trait-items-container to grid
    document.querySelectorAll('style').forEach(styleTag => {
      if (styleTag.textContent && styleTag.textContent.includes('.trait-items-container') && styleTag.textContent.includes('display: grid')) {
        styleTag.parentNode.removeChild(styleTag);
      }
    });
  }
  // Run on DOMContentLoaded and after any major DOM update
  document.addEventListener('DOMContentLoaded', fixTraitItemsContainers);
  // Also run after any click, as a fallback for dynamic UI
  document.body && document.body.addEventListener('click', () => setTimeout(fixTraitItemsContainers, 100));
  // Expose for manual debugging
  window.fixTraitItemsContainers = fixTraitItemsContainers;
})();

// ... existing code ...
    // --- FINAL RUNTIME FIX: Remove grid classes/styles from .trait-items-container ---
    setTimeout(() => {
      document.querySelectorAll('.trait-items-container').forEach(container => {
        container.classList.remove('traits-grid');
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.overflowY = 'auto';
        container.style.flex = '1 1 auto';
        container.style.height = '100%';
        container.style.maxHeight = 'none';
        container.style.gap = '10px';
        container.style.gridTemplateColumns = 'unset';
        container.style.padding = '0';
        container.style.boxSizing = 'border-box';
      });
    }, 50);
// ... existing code ...

// Helper to set seed counter color based on fullness
function setSeedListCounterColor(seedListCounter, count, total) {
  if (!seedListCounter) return;
  let percent = total > 0 ? (count / total) : 0;
  if (count === total) {
    seedListCounter.style.color = '#00ff18'; // green
  } else if (percent >= 0.95) {
    seedListCounter.style.color = '#ff0000'; // red
  } else if (percent >= 0.90) {
    seedListCounter.style.color = '#e74c3c'; // orange
  } else if (percent >= 0.80) {
    seedListCounter.style.color = '#fcff00'; // yellow
  } else {
    seedListCounter.style.color = '#fff'; // default
  }
}

