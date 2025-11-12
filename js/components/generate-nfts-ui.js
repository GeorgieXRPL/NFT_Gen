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

  // Helper function to setup tooltip positioning using global tooltip manager
  setupTooltipPositioning: function(element, tooltip) {
    if (!element || !tooltip) return;
    
    // Use global tooltip manager if available
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    if (tooltipManager) {
      tooltipManager.setupTooltip(element, tooltip);
      return;
    }

    // Fallback to local implementation if manager not available
    let tooltipTimeout = null;
    
    element.addEventListener("mouseenter", () => {
      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      tooltipTimeout = setTimeout(() => {
        const rect = element.getBoundingClientRect();
        // Make tooltip temporarily visible to measure height, but keep it off-screen
        tooltip.style.visibility = "visible";
        tooltip.style.opacity = "0";
        tooltip.style.top = "-9999px";
        tooltip.style.left = "-9999px";
        tooltip.style.transform = "none";
        void tooltip.offsetHeight; // Force reflow
        const tooltipWidth = tooltip.offsetWidth || 200;
        const tooltipHeight = tooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        tooltip.style.setProperty("position", "fixed", "important");
        tooltip.style.setProperty("z-index", "2147483647", "important");
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const elementRect = element.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        const topPosition = elementRect.top - tooltipHeight - 5;
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
          tooltip.style.opacity = "1";
        });
        tooltipTimeout = null;
      }, 1000);
    });
    
    element.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      tooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        tooltip.style.visibility = "hidden";
      }, 1000);
    });
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
              <button id="close-dark-traits-modal" class="saved-seeds-close-btn tooltip">
                <span class="tooltiptext">Close modal</span>
                &times;
              </button>
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
      
      // Force modal container width with !important to override all CSS
      const modalContainer = modal.querySelector('.saved-seeds-container');
      if (modalContainer) {
        modalContainer.style.setProperty('width', '962px', 'important');
        modalContainer.style.setProperty('min-width', '962px', 'important');
        modalContainer.style.setProperty('max-width', '962px', 'important');
        modalContainer.style.setProperty('flex', 'none', 'important');
        modalContainer.style.setProperty('flex-shrink', '0', 'important');
        modalContainer.style.setProperty('flex-grow', '0', 'important');
      }
      
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
      
      // Remove title attribute and add custom tooltip
      selectAllToggle.removeAttribute('title');
      selectAllToggle.classList.add('tooltip');
      
      // Create tooltip element
      let selectAllTooltip = selectAllToggle.querySelector('.tooltiptext');
      if (!selectAllTooltip) {
        selectAllTooltip = document.createElement('span');
        selectAllTooltip.className = 'tooltiptext';
        selectAllToggle.appendChild(selectAllTooltip);
      }
      
      if (allTraitsSelected) {
        selectAllToggle.textContent = 'Unselect All';
        selectAllToggle.style.background = '#dc3545';
        selectAllToggle.classList.add('unselect-all');
        selectAllTooltip.textContent = `Unselect all traits in ${layer.name} layer`;
      } else {
        selectAllToggle.textContent = 'Select All';
        selectAllToggle.style.background = '#007bff';
        selectAllToggle.classList.add('select-all');
        selectAllTooltip.textContent = `Select all traits in ${layer.name} layer`;
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

      // Setup tooltip positioning
      if (selectAllTooltip) {
        this.setupTooltipPositioning(selectAllToggle, selectAllTooltip);
      }

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
        grid-template-columns: repeat(6, 141px);
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
          // Remove title and add custom tooltip
          nameDiv.removeAttribute('title');
          nameDiv.classList.add('tooltip');
          let nameTooltip = nameDiv.querySelector('.tooltiptext');
          if (!nameTooltip) {
            nameTooltip = document.createElement('span');
            nameTooltip.className = 'tooltiptext';
            nameTooltip.textContent = trait.name;
            nameDiv.appendChild(nameTooltip);
          } else {
            nameTooltip.textContent = trait.name;
          }
          // Setup tooltip positioning
          if (nameTooltip) {
            this.setupTooltipPositioning(nameDiv, nameTooltip);
          }
        } else {
          nameDiv.textContent = trait.name;
          nameDiv.removeAttribute('title');
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
        rarityDiv.textContent = `${(parseFloat(trait.rarity) || 0).toFixed(2)}%`;

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
        // Remove title and add custom tooltip
        viewButton.removeAttribute('title');
        viewButton.classList.add('tooltip');
        let viewTooltip = viewButton.querySelector('.tooltiptext');
        if (!viewTooltip) {
          viewTooltip = document.createElement('span');
          viewTooltip.className = 'tooltiptext';
          viewButton.appendChild(viewTooltip);
        }
        viewTooltip.textContent = `View full-size preview of ${trait.name}`;

        // Setup tooltip positioning
        if (viewTooltip) {
          this.setupTooltipPositioning(viewButton, viewTooltip);
        }

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
            // Use Trait Full-Size Popup for visual consistency
            const traitObj = { trait: { image: trait.image, imageData: trait.imageData, name: trait.name }, layer: { name: layer.name } };
            this.showTraitFullSizePopup(traitObj, layer.name, trait.name);
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
      
      // Remove title and ensure custom tooltip exists
      selectAllButton.removeAttribute('title');
      selectAllButton.classList.add('tooltip');
      let selectAllTooltip = selectAllButton.querySelector('.tooltiptext');
      if (!selectAllTooltip) {
        selectAllTooltip = document.createElement('span');
        selectAllTooltip.className = 'tooltiptext';
        selectAllButton.appendChild(selectAllTooltip);
      }
      
      if (isSearchActive) {
        selectAllTooltip.textContent = `Unselect all visible "${searchTerm}" traits in ${layer.name} layer`;
      } else {
        selectAllTooltip.textContent = `Unselect all traits in ${layer.name} layer`;
      }
      // Setup tooltip positioning
      if (selectAllTooltip) {
        this.setupTooltipPositioning(selectAllButton, selectAllTooltip);
      }
      console.log('[DEBUG] Updated button to "Unselect All"');
    } else {
      selectAllButton.textContent = 'Select All';
      selectAllButton.style.background = '#007bff';
      selectAllButton.style.backgroundColor = '#007bff';
      selectAllButton.classList.add('select-all');
      selectAllButton.classList.remove('unselect-all');
      
      // Remove title and ensure custom tooltip exists
      selectAllButton.removeAttribute('title');
      selectAllButton.classList.add('tooltip');
      let selectAllTooltip = selectAllButton.querySelector('.tooltiptext');
      if (!selectAllTooltip) {
        selectAllTooltip = document.createElement('span');
        selectAllTooltip.className = 'tooltiptext';
        selectAllButton.appendChild(selectAllTooltip);
      }
      
      if (isSearchActive) {
        selectAllTooltip.textContent = `Select all visible "${searchTerm}" traits in ${layer.name} layer (${traitsToCheck.length} of ${layer.traits.length} traits)`;
      } else {
        selectAllTooltip.textContent = `Select all traits in ${layer.name} layer`;
      }
      // Setup tooltip positioning
      if (selectAllTooltip) {
        this.setupTooltipPositioning(selectAllButton, selectAllTooltip);
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
      // Get or create the content container
      let contentContainer = controlsPanel.querySelector('.nft-controls-panel-content');
      if (!contentContainer) {
        console.log('[DEBUG] Creating missing content container...');
        contentContainer = document.createElement('div');
        contentContainer.className = 'nft-controls-panel-content';
        contentContainer.id = 'nft-controls-panel-content';
        contentContainer.style.display = 'flex';
        contentContainer.style.flexDirection = 'column';
        contentContainer.style.gap = '0';
        contentContainer.style.width = '100%';
        controlsPanel.appendChild(contentContainer);
      }
      
      // Create parent container (Container 1) that wraps container 2 and container 3
      let parentContainer = contentContainer.querySelector('.nft-seed-controls-parent');
      if (!parentContainer) {
        console.log('[DEBUG] Creating parent container for seed controls...');
        parentContainer = document.createElement('div');
        parentContainer.className = 'nft-seed-controls-parent';
        parentContainer.id = 'nft-seed-controls-parent';
        parentContainer.style.width = '496px';
        parentContainer.style.height = '80px';
        parentContainer.style.display = 'flex';
        parentContainer.style.flexDirection = 'column';
        parentContainer.style.gap = '16px';
        contentContainer.appendChild(parentContainer);
      }
      
      // Check if rarity seed row exists (Container 2)
      let raritySeedRow = parentContainer.querySelector('.nft-rarity-seed-row');
      if (!raritySeedRow) {
        console.log('[DEBUG] Creating missing rarity seed row...');
        raritySeedRow = document.createElement('div');
        raritySeedRow.className = 'nft-rarity-seed-row';
        parentContainer.appendChild(raritySeedRow);
      }
      
      // Check if seedlist random row exists
      let seedlistRandomRow = contentContainer.querySelector('.nft-seedlist-random-row');
      if (!seedlistRandomRow) {
        console.log('[DEBUG] Creating missing seedlist random row...');
        seedlistRandomRow = document.createElement('div');
        seedlistRandomRow.className = 'nft-seedlist-random-row';
        contentContainer.appendChild(seedlistRandomRow);
      }
      
      // Check if seed input row exists (Container 3)
      let seedInputRow = parentContainer.querySelector('.nft-seedinput-row');
      if (!seedInputRow) {
        console.log('[DEBUG] Creating missing seed input row...');
        seedInputRow = document.createElement('div');
        seedInputRow.className = 'nft-seedinput-row';
        parentContainer.appendChild(seedInputRow);
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
    // console.log('[DEBUG] updateTraitInfoPanel called', { nft, projectData });
    // Always remove all placeholders at the very start
    const infoList = document.querySelector('.nft-trait-info-list');
    if (infoList) {
      const placeholders = infoList.querySelectorAll('.nft-trait-info-list-placeholder');
      placeholders.forEach(ph => { ph.remove(); /* console.log('[DEBUG] Placeholder REMOVED by updateTraitInfoPanel (start)'); */ });
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
        align-items: center !important;
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
        width: 170px !important;
        min-width: 170px !important;
        max-width: 170px !important;
        height: 697px !important; /* Fixed height to prevent layout shifts */
        min-height: 697px !important;
        max-height: 697px !important;
        flex: none !important; /* Prevent flex sizing */
        overflow: auto;
        margin-top: 4px !important; /* Move panel 4px down */
      }
      /* Ensure proper padding around the trait list */
      .nft-trait-info-list {
        padding: 0 !important;
        display: block !important;
        width: 170px !important;
        min-width: 170px !important;
        max-width: 170px !important;
        height: 697px !important;
        min-height: 697px !important;
        max-height: 697px !important;
        margin: 0 auto !important; /* Center horizontally within traits-list-card */
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
            // Remove title and add custom tooltip
            thumbContainer.removeAttribute('title');
            if (forbiddenMsg) {
              thumbContainer.classList.add('tooltip');
              let thumbTooltip = thumbContainer.querySelector('.tooltiptext');
              if (!thumbTooltip) {
                thumbTooltip = document.createElement('span');
                thumbTooltip.className = 'tooltiptext';
                thumbContainer.appendChild(thumbTooltip);
              }
              thumbTooltip.textContent = forbiddenMsg;
              // Setup tooltip positioning
              if (thumbTooltip) {
                this.setupTooltipPositioning(thumbContainer, thumbTooltip);
              }
          } else {
              thumbContainer.classList.remove('tooltip');
              const thumbTooltip = thumbContainer.querySelector('.tooltiptext');
              if (thumbTooltip) thumbTooltip.remove();
            }
          } else {
            thumbContainer.removeAttribute('title');
            thumbContainer.classList.remove('tooltip');
            const thumbTooltip = thumbContainer.querySelector('.tooltiptext');
            if (thumbTooltip) thumbTooltip.remove();
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
            // Remove title and add custom tooltip
            traitNameElem.removeAttribute('title');
            traitNameElem.classList.add('tooltip');
            let nameTooltip = traitNameElem.querySelector('.tooltiptext');
            if (!nameTooltip) {
              nameTooltip = document.createElement('span');
              nameTooltip.className = 'tooltiptext';
              traitNameElem.appendChild(nameTooltip);
            }
            nameTooltip.textContent = traitName;
          } else {
            traitNameElem.removeAttribute('title');
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
          // Remove title and add custom tooltip
          layerNameElem.removeAttribute('title');
          layerNameElem.classList.add('tooltip');
          let layerTooltip = layerNameElem.querySelector('.tooltiptext');
          if (!layerTooltip) {
            layerTooltip = document.createElement('span');
            layerTooltip.className = 'tooltiptext';
            layerNameElem.appendChild(layerTooltip);
          }
          layerTooltip.textContent = layerName;
        } else {
          layerNameElem.removeAttribute('title');
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
        traitCard.style.width = '141px';
        traitCard.style.minWidth = '141px';
        traitCard.style.maxWidth = '141px';
        traitCard.style.margin = '0 auto';
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
      placeholders.forEach(ph => { ph.remove(); /* console.log('[DEBUG] Placeholder REMOVED by updateTraitInfoPanel (end)'); */ });
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
      traitItemsContainer.style.alignItems = 'center';
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
    
    // Update task: Start displaying NFT
    if (nft && this.updateTaskStatus) {
      this.updateTaskStatus('displaying-nft', 'in-progress');
    }
    
    this.displaySingleNFT(nft);
    
    // Fallback: Ensure only one NFT is displayed after a short delay
    // This catches any edge cases where multiple NFTs might be created
    setTimeout(() => {
      if (this.ensureOnlyOneNFTDisplayed) {
        this.ensureOnlyOneNFTDisplayed();
      }
    }, 200);
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
      // Start first task
      if (this.updateTaskStatus) {
        this.updateTaskStatus('selecting-traits', 'in-progress');
      }
      
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
        
        // CRITICAL: Generate Seed button should be enabled based on minimum requirements, not toggle state
          if (generateSeedBtn) {
          const projectData = this.projectData || window.currentProject;
          const hasMinimumRequirements = this._hasMinimumRequirements(projectData);
          
          // CRITICAL: Check if popup is showing - if so, keep button greyed out
          const generateNftsTab = document.getElementById('generate-nfts');
          let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
          if (!popup) {
            popup = document.querySelector('.nft-rendering-popup');
          }
          const isPopupShowing = !!popup;
          
          // Button should be enabled if minimum requirements are met (regardless of toggle state) AND popup is not showing
          generateSeedBtn.disabled = !hasMinimumRequirements || isPopupShowing;
          
          // If popup is showing, apply greyed out styles
          if (isPopupShowing) {
            generateSeedBtn.style.setProperty('background-color', '#23232b', 'important');
            generateSeedBtn.style.setProperty('color', '#a0a0b0', 'important');
            generateSeedBtn.style.setProperty('cursor', 'not-allowed', 'important');
            generateSeedBtn.style.setProperty('opacity', '0.6', 'important');
            generateSeedBtn.style.setProperty('border', '1px solid #84a0b0', 'important');
            generateSeedBtn.style.setProperty('border-color', '#84a0b0', 'important');
            generateSeedBtn.style.pointerEvents = 'none';
          }
        }
        // Tab stays enabled - content inside will be greyed out until NFT renders
        // No need to disable the tab itself
        
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
        
        // Update all button states after NFT is generated
        this._updateAllButtonStates();
      });
      } catch (error) {
        console.error("Error generating NFT:", error);
        this.showError("Failed to generate NFT: " + error.message);
        enableNftGenButtons();
        
        // Update all button states even on error
        this._updateAllButtonStates();
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
    
    // Start first task
    if (this.updateTaskStatus) {
      this.updateTaskStatus('selecting-traits', 'in-progress');
    }
    
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
    
    // Remove no-project card when NFT is displayed
    const noProjectCard = document.querySelector('.no-project-card');
    if (noProjectCard) {
      noProjectCard.remove();
    }
    
    if (nft) window.lastGeneratedNFT = nft;
    // Set rendering flag to prevent placeholder logic
    if (window.NFTApp) window.NFTApp.isRenderingNFT = true;
    // console.log('[DEBUG] displaySingleNFT called with NFT:', nft);
    // if (nft && nft.imageData) {
    //   console.log('[DEBUG] NFT imageData:', nft.imageData.substring(0, 100));
    // }
    
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
      
      // Once the new image is fully loaded, remove old NFT preview items and enable tab
      img.onload = () => {
        // Update task: Displaying NFT
        const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
        if (generateNftsUI && generateNftsUI.updateTaskStatus) {
          generateNftsUI.updateTaskStatus('displaying-nft', 'completed');
        }
        
        // NFT is fully rendered - hide the rendering popup will happen automatically when all tasks complete
        
        // Remove all old NFT preview items except the current one
        // Remove ALL items except the current one, regardless of opacity
        const allItems = previewContainer.querySelectorAll('.nft-preview-item');
        allItems.forEach(item => {
          if (item !== previewItem) {
            item.remove();
          }
        });
        
        // Ensure current NFT preview item stays visible
        previewItem.style.opacity = '1';
        previewItem.style.zIndex = '2';
        previewItem.style.display = 'flex';
        
        // Fallback: Ensure only one NFT is displayed (in case of any edge cases)
        if (generateNftsUI && generateNftsUI.ensureOnlyOneNFTDisplayed) {
          // Use setTimeout to ensure this runs after any other operations
          setTimeout(() => {
            generateNftsUI.ensureOnlyOneNFTDisplayed();
          }, 100);
        }
        
        // NFT is fully rendered - enable all content inside the tab
        // The tab itself was already enabled, now we enable the content
        if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
          generateNftsUI._updateAllButtonStates(); // This will enable all buttons/content
        }
        
        // Mark that NFT has been generated to prevent auto-generation
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
          window.NFTApp.getModule('navigation').firstNftGenerated = true;
        }
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
      // console.log('[DEBUG] NFT exists but no imageData, showing placeholder');
      this.showLoadingOverlay("Generating NFT...", true);
    } else {
      // If no NFT at all, do nothing - keep existing content
      // console.log('[DEBUG] No NFT provided, keeping existing content');
    }
    
    // CRITICAL: Always update the traits panel to match the displayed NFT
    if (nft && this.projectData) {
      // console.log('[DEBUG] displaySingleNFT: Updating traits panel to match displayed NFT');
      this.updateTraitInfoPanel(nft, this.projectData);
    } else if (nft && window.currentProject) {
      // console.log('[DEBUG] displaySingleNFT: Updating traits panel with currentProject');
      this.updateTraitInfoPanel(nft, window.currentProject);
    } else {
      // console.log('[DEBUG] displaySingleNFT: No project data available for traits panel update');
    }
    
    // Update all button states after displaying NFT
    this._updateAllButtonStates();
    
    // If NFT image is already loaded (data URI), enable content immediately
    if (nft && nft.imageData && nft.imageData.startsWith('data:')) {
      // For data URIs, image is already loaded, so enable all content immediately
      if (this._updateAllButtonStates) {
        this._updateAllButtonStates(); // This will enable all buttons/content
      }
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

  showNftRenderingPopup: function() {
    // Get the Generate NFTs tab container
    const generateNftsTab = document.getElementById('generate-nfts');
    if (!generateNftsTab) {
      console.warn('[NFT Rendering Popup] Generate NFTs tab not found');
      return;
    }

    // CRITICAL: Grey out ALL buttons in nft-action-buttons-container during popup
    const buttonsContainer = document.querySelector('.nft-action-buttons-container');
    if (buttonsContainer) {
      const allButtons = buttonsContainer.querySelectorAll('.nft-action-btn, button');
      allButtons.forEach(btn => {
        // Store original state if not already stored
        if (!btn._originalStyles) {
          btn._originalStyles = {
            backgroundColor: btn.style.backgroundColor || window.getComputedStyle(btn).backgroundColor,
            borderColor: btn.style.borderColor || window.getComputedStyle(btn).borderColor,
            color: btn.style.color || window.getComputedStyle(btn).color,
            opacity: btn.style.opacity || window.getComputedStyle(btn).opacity || '1'
          };
        }
        // Grey out the button and remove halo effect and border
        btn.style.setProperty('background-color', '#23232b', 'important');
        btn.style.setProperty('border-color', 'transparent', 'important'); // Remove border when greyed out
        btn.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
        btn.style.setProperty('opacity', '0.6', 'important');
        btn.style.setProperty('cursor', 'not-allowed', 'important');
        btn.style.setProperty('box-shadow', 'none', 'important'); // Remove halo effect
        btn.style.setProperty('border', 'none', 'important'); // Remove border completely
        btn.disabled = true;
        btn.setAttribute('disabled', 'disabled');
      });
    }
    
    // Fallback: Also grey out buttons by ID if container approach doesn't work
    const createNftBtn = document.getElementById('nft-action-create-btn');
    if (createNftBtn && !buttonsContainer) {
      // Store original state if not already stored
      if (!createNftBtn._originalStyles) {
        createNftBtn._originalStyles = {
          backgroundColor: createNftBtn.style.backgroundColor || '#047857',
          borderColor: createNftBtn.style.borderColor || '#047857',
          color: createNftBtn.style.color || '#ffffff',
          opacity: createNftBtn.style.opacity || '1'
        };
      }
      // Grey out the button and remove halo effect and border
      createNftBtn.style.setProperty('background-color', '#23232b', 'important');
      createNftBtn.style.setProperty('border-color', 'transparent', 'important');
      createNftBtn.style.setProperty('color', '#a0a0b0', 'important');
      createNftBtn.style.setProperty('opacity', '0.6', 'important');
      createNftBtn.style.setProperty('cursor', 'not-allowed', 'important');
      createNftBtn.style.setProperty('box-shadow', 'none', 'important');
      createNftBtn.style.setProperty('border', 'none', 'important');
      createNftBtn.disabled = true;
      createNftBtn.setAttribute('disabled', 'disabled');
    }

    const bulkGenerationBtn = document.getElementById('nft-action-bulk-btn');
    if (bulkGenerationBtn && !buttonsContainer) {
      // Store original state if not already stored
      if (!bulkGenerationBtn._originalStyles) {
        bulkGenerationBtn._originalStyles = {
          backgroundColor: bulkGenerationBtn.style.backgroundColor || '#ea580c',
          borderColor: bulkGenerationBtn.style.borderColor || '#ea580c',
          color: bulkGenerationBtn.style.color || '#ffffff',
          opacity: bulkGenerationBtn.style.opacity || '1'
        };
      }
      // Grey out the button and remove halo effect and border
      bulkGenerationBtn.style.setProperty('background-color', '#23232b', 'important');
      bulkGenerationBtn.style.setProperty('border-color', 'transparent', 'important');
      bulkGenerationBtn.style.setProperty('color', '#a0a0b0', 'important');
      bulkGenerationBtn.style.setProperty('opacity', '0.6', 'important');
      bulkGenerationBtn.style.setProperty('cursor', 'not-allowed', 'important');
      bulkGenerationBtn.style.setProperty('box-shadow', 'none', 'important');
      bulkGenerationBtn.style.setProperty('border', 'none', 'important');
      bulkGenerationBtn.disabled = true;
      bulkGenerationBtn.setAttribute('disabled', 'disabled');
    }

    // CRITICAL: Also grey out Generate Seed button during popup
    const generateSeedBtn = document.getElementById('generate-seed-nft-btn');
    if (generateSeedBtn) {
      // Store original state if not already stored
      if (!generateSeedBtn._originalStyles) {
        generateSeedBtn._originalStyles = {
          backgroundColor: generateSeedBtn.style.backgroundColor || window.getComputedStyle(generateSeedBtn).backgroundColor || '#007bff',
          borderColor: generateSeedBtn.style.borderColor || window.getComputedStyle(generateSeedBtn).borderColor || '#007bff',
          color: generateSeedBtn.style.color || window.getComputedStyle(generateSeedBtn).color || '#ffffff',
          opacity: generateSeedBtn.style.opacity || window.getComputedStyle(generateSeedBtn).opacity || '1'
        };
      }
      // Grey out the button and remove halo effect and border
      generateSeedBtn.style.setProperty('background-color', '#23232b', 'important');
      generateSeedBtn.style.setProperty('border-color', 'transparent', 'important'); // Remove border when greyed out
      generateSeedBtn.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
      generateSeedBtn.style.setProperty('opacity', '0.6', 'important');
      generateSeedBtn.style.setProperty('cursor', 'not-allowed', 'important');
      generateSeedBtn.style.setProperty('box-shadow', 'none', 'important'); // Remove halo effect
      generateSeedBtn.style.setProperty('border', 'none', 'important'); // Remove border completely
      generateSeedBtn.disabled = true;
      generateSeedBtn.setAttribute('disabled', 'disabled');
    }

    // Reset NFT count text to 0
    const nftCountTextElement = document.querySelector('.nft-count-text');
    if (nftCountTextElement) {
      const formatNumber = this.formatNumberWithCommas || ((num) => num.toLocaleString('en-US'));
      nftCountTextElement.textContent = formatNumber(0);
    }

    // Reset progress bar to 0% and grey it out - CRITICAL: Remove any green color classes
    const progressBarElement = document.querySelector('.nft-progress-bar');
    if (progressBarElement) {
      progressBarElement.style.width = '0%';
      progressBarElement.style.transition = 'none'; // Disable transition during reset
      progressBarElement.className = 'nft-progress-bar'; // Reset classes - removes green, red, orange, yellow
      // Grey out the progress bar - ensure no green color is visible
      progressBarElement.style.setProperty('background-color', '#374151', 'important'); // Dark grey
      progressBarElement.style.setProperty('opacity', '0.6', 'important');
      // Explicitly remove any color classes that might have been added
      progressBarElement.classList.remove('green', 'red', 'orange', 'yellow');
    }

    // CRITICAL: Also grey out "Seed:" label during popup
    const seedLabel = document.querySelector('.seed-label');
    if (seedLabel) {
      seedLabel.style.color = '#a0a0b0'; // Match Dark NFTs button text color when greyed out
    }

    // Remove existing popup if it exists
    let popup = generateNftsTab.querySelector('.nft-rendering-popup');
    if (popup) {
      popup.remove();
    }

    // Hide "Project loaded successfully" notification if it exists
    const notificationContainers = [
      document.querySelector(".fixed-notification-container"),
      document.querySelector(".notification-container")
    ].filter(Boolean);
    
    notificationContainers.forEach(container => {
      const notifications = container.querySelectorAll(".notification");
      notifications.forEach(notification => {
        const messageEl = notification.querySelector(".notification-message");
        if (messageEl && messageEl.textContent.includes("Project loaded successfully")) {
          notification.remove();
        }
      });
    });

    // Create popup element - match "Calculating Rarity Ranks" popup structure
    popup = document.createElement('div');
    popup.className = 'nft-rendering-popup scan-progress-popup';
    // CRITICAL: Ensure pointer-events: none so tabs remain clickable during popup
    popup.style.pointerEvents = 'none';
    popup.innerHTML = `
      <div class="nft-rendering-popup-title">Please Wait.</div>
      <div class="nft-rendering-loading-message">
        <div class="loading-line-1">Loading project and</div>
        <div class="loading-line-2">processing operations.</div>
        <div class="loading-spinner-container">
          <div class="loading-spinner"></div>
        </div>
      </div>
      <div class="nft-rendering-task-list" style="opacity: 0; visibility: hidden;">
        <div class="nft-task-item" data-task="selecting-traits">
          <span class="task-status"></span>
          <span class="task-text">Selecting traits</span>
          <span class="task-dots scan-dots" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="nft-task-item" data-task="loading-images">
          <span class="task-status"></span>
          <span class="task-text">Loading images</span>
          <span class="task-dots scan-dots" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="nft-task-item" data-task="validating-rules">
          <span class="task-status"></span>
          <span class="task-text">Validating rules</span>
          <span class="task-dots scan-dots" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="nft-task-item" data-task="composing-canvas">
          <span class="task-status"></span>
          <span class="task-text">Composing canvas</span>
          <span class="task-dots scan-dots" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="nft-task-item" data-task="generating-image">
          <span class="task-status"></span>
          <span class="task-text">Generating image</span>
          <span class="task-dots scan-dots" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="nft-task-item" data-task="displaying-nft">
          <span class="task-status"></span>
          <span class="task-text">Displaying NFT</span>
          <span class="task-dots scan-dots" style="display: none;">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
      </div>
    `;

    // Append to body instead of tab so it's visible on all tabs
    document.body.appendChild(popup);

    // Initialize all tasks as pending
    this.resetTaskStatus();
    
    // Popup visibility is controlled by CSS based on tab active state
    // CSS will automatically show/hide it when tab becomes active/inactive
    
    // Store reference to popup for later use
    this._currentRenderingPopup = popup;
  },
  
  // Transition from loading message to tasks
  transitionToTasks: function() {
    const popup = this._currentRenderingPopup || document.querySelector('.nft-rendering-popup');
    if (!popup) return;
    
    // Hide loading message and spinner
    const loadingMessage = popup.querySelector('.nft-rendering-loading-message');
    if (loadingMessage) {
      loadingMessage.style.display = 'none';
    }
    
    // Show tasks (fade in)
    const taskList = popup.querySelector('.nft-rendering-task-list');
    if (taskList) {
      taskList.style.transition = 'opacity 0.3s ease, visibility 0.3s ease';
      taskList.style.opacity = '1';
      taskList.style.visibility = 'visible';
    }
  },

  // Reset all task statuses to pending
  resetTaskStatus: function() {
    // Check both tab and body for popup (since it's now appended to body)
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    if (!popup) return;
    
    const tasks = popup.querySelectorAll('.nft-task-item');
    tasks.forEach(task => {
      task.classList.remove('task-pending', 'task-in-progress', 'task-completed');
      task.classList.add('task-pending');
      const status = task.querySelector('.task-status');
      const dots = task.querySelector('.task-dots');
      const text = task.querySelector('.task-text');
      if (status) status.textContent = '';
      if (dots) dots.style.display = 'none';
      if (text) text.style.color = '#888';
    });
  },

  // Update task status: 'pending', 'in-progress', 'completed'
  updateTaskStatus: function(taskName, status) {
    // Check both tab and body for popup (since it's now appended to body)
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = this._currentRenderingPopup || (generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null);
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    if (!popup) return;
    
    // If this is the first task going to in-progress, transition from loading message to tasks
    if (status === 'in-progress' && taskName === 'selecting-traits' && !popup.dataset.tasksStarted) {
      popup.dataset.tasksStarted = 'true';
      this.transitionToTasks();
    }
    
    const taskItem = popup.querySelector(`[data-task="${taskName}"]`);
    if (!taskItem) return;
    
    // Remove all status classes
    taskItem.classList.remove('task-pending', 'task-in-progress', 'task-completed');
    taskItem.classList.add(`task-${status}`);
    
    const statusEl = taskItem.querySelector('.task-status');
    const dotsEl = taskItem.querySelector('.task-dots');
    const textEl = taskItem.querySelector('.task-text');
    
    if (status === 'pending') {
      if (statusEl) statusEl.textContent = '';
      if (dotsEl) dotsEl.style.display = 'none';
      if (textEl) textEl.style.color = '#888';
    } else if (status === 'in-progress') {
      if (statusEl) statusEl.textContent = '';
      if (dotsEl) dotsEl.style.display = 'inline-flex';
      if (textEl) textEl.style.color = '#3498db';
    } else if (status === 'completed') {
      if (statusEl) statusEl.innerHTML = '✓';
      if (dotsEl) dotsEl.style.display = 'none';
      if (textEl) textEl.style.color = '#27ae60';
    }
    
    // Check if all tasks are completed
    if (status === 'completed') {
      this.checkAllTasksCompleted();
    }
  },

  // Check if all tasks are completed and close popup
  checkAllTasksCompleted: function() {
    // Check both tab and body for popup (since it's now appended to body)
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = this._currentRenderingPopup || (generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null);
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    if (!popup) return;
    
    const tasks = popup.querySelectorAll('.nft-task-item');
    if (tasks.length === 0) return; // No tasks found
    
    const allCompleted = Array.from(tasks).every(task => task.classList.contains('task-completed'));
    
    if (allCompleted) {
      // All tasks completed - mark as finished and set up auto-close with click handler
      popup.dataset.processFinished = 'true';
        
        // Remove any existing auto-close timeout
        if (popup._autoCloseTimeout) {
          clearTimeout(popup._autoCloseTimeout);
          popup._autoCloseTimeout = null;
        }
        
        // Remove any existing click listener
        if (popup._clickListener) {
          document.removeEventListener('click', popup._clickListener);
          popup._clickListener = null;
        }
        
        // Function to actually remove the popup
        const removePopup = () => {
          if (popup._autoCloseTimeout) {
            clearTimeout(popup._autoCloseTimeout);
            popup._autoCloseTimeout = null;
          }
          if (popup._clickListener) {
            document.removeEventListener('click', popup._clickListener);
            popup._clickListener = null;
          }
          this.hideNftRenderingPopup();
        };
        
        // Set up click listener for immediate close after finishing
        // CRITICAL: Only prevent default/stop propagation if clicking on the popup itself
        // Allow clicks on tabs and other elements to pass through normally
        popup._clickListener = (e) => {
          // Only close on click if process has finished AND clicking on the popup
          if (popup.dataset.processFinished === 'true') {
            // Check if the click is on the popup or its content
            const clickedOnPopup = popup.contains(e.target) || popup === e.target;
            if (clickedOnPopup) {
              e.preventDefault();
              e.stopPropagation();
              removePopup();
            }
            // If clicking elsewhere (like tabs), allow the click to proceed normally
            // Don't prevent default or stop propagation for non-popup clicks
          }
        };
        document.addEventListener('click', popup._clickListener, { once: false, capture: true });
        
        // Schedule auto-close after 2 seconds
        popup._autoCloseTimeout = setTimeout(() => {
          removePopup();
        }, 2000);
      }
  },

  hideNftRenderingPopup: function() {
    // Check both tab and body for popup (since it's now appended to body)
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = this._currentRenderingPopup || (generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null);
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    if (popup) {
      // CRITICAL: Clean up any listeners or timeouts before removing popup
      // This ensures no leftover listeners block tab clicks
      if (popup._autoCloseTimeout) {
        clearTimeout(popup._autoCloseTimeout);
        popup._autoCloseTimeout = null;
      }
      if (popup._clickListener) {
        // Remove listener with capture: true to match how it was added
        document.removeEventListener('click', popup._clickListener, { capture: true });
        popup._clickListener = null;
      }
      popup.remove();
      this._currentRenderingPopup = null;
      
      // CRITICAL: Ensure no leftover popup elements are blocking clicks
      // Double-check for any remaining popups
      const remainingPopups = document.querySelectorAll('.nft-rendering-popup');
      remainingPopups.forEach(p => {
        if (p._clickListener) {
          document.removeEventListener('click', p._clickListener, { capture: true });
          p._clickListener = null;
        }
        p.remove();
      });
    }
    
    // CRITICAL: Restore Create NFT button state (will be updated by _updateAllButtonStates)
    const createNftBtn = document.getElementById('nft-action-create-btn');
    if (createNftBtn && createNftBtn._originalStyles) {
      // Button state will be restored by _updateAllButtonStates based on requirements
      // Just ensure it's not stuck in greyed out state
    }
    
    // CRITICAL: Ensure preview container exists and is never deleted
    const previewPanelElem = document.querySelector('.nft-preview-image-area');
    if (previewPanelElem) {
      let previewContainer = previewPanelElem.querySelector('#nft-preview-container');
      if (!previewContainer) {
        // Create container if it doesn't exist
        previewContainer = document.createElement('div');
        previewContainer.id = 'nft-preview-container';
        previewContainer.style.position = 'relative';
        previewContainer.style.width = '100%';
        previewContainer.style.height = '100%';
        previewPanelElem.appendChild(previewContainer);
      }
    }
    
    // Ensure only one NFT is displayed - remove all but the most recent one
    this.ensureOnlyOneNFTDisplayed();
    
    // CRITICAL: After popup closes, restore button states and animate the NFT count counter and progress bar
    // Update button states first to restore Create NFT button
    setTimeout(() => {
      if (this._updateAllButtonStates) {
        this._updateAllButtonStates();
      }
      // Update seed label color after popup closes
      const seedLabel = document.querySelector('.seed-label');
      if (seedLabel) {
        const hasNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
        if (hasNFT) {
          seedLabel.style.color = '#fff'; // White when enabled
        } else {
          seedLabel.style.color = '#a0a0b0'; // Grey when no NFT
        }
      }
      // Then animate the count
      this.animateNftCountAfterLoad();
    }, 100);
    
    // CRITICAL: After popup closes, ensure NFT preview never disappears
    // Remove any "No Project" card that might have been added
    setTimeout(() => {
      const previewContainer = document.querySelector('.nft-preview-image-area #nft-preview-container');
      if (!previewContainer) {
        // Recreate container if it was somehow deleted
        const previewPanelElem = document.querySelector('.nft-preview-image-area');
        if (previewPanelElem) {
          const newContainer = document.createElement('div');
          newContainer.id = 'nft-preview-container';
          newContainer.style.position = 'relative';
          newContainer.style.width = '100%';
          newContainer.style.height = '100%';
          previewPanelElem.appendChild(newContainer);
        }
        return;
      }
      
      const hasNFTDisplayed = previewContainer.querySelector('.nft-preview-item');
      if (hasNFTDisplayed) {
        const noProjectCard = document.querySelector('.no-project-card');
        if (noProjectCard) {
          noProjectCard.remove();
        }
      }
    }, 100);
  },

  // Animate NFT count counter and progress bar after project load
  animateNftCountAfterLoad: function() {
    // CRITICAL: Don't animate if popup is still showing - wait until it closes
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    if (popup) {
      console.log('[NFT Count Animation] Popup is still showing, skipping animation');
      // Retry after a short delay
      setTimeout(() => this.animateNftCountAfterLoad(), 200);
      return;
    }
    
    // Prevent multiple animations from running simultaneously
    if (window._nftCountAnimationRunning) {
      console.log('[NFT Count Animation] Animation already running, skipping...');
      return;
    }
    window._nftCountAnimationRunning = true;
    
    // Get the current count and total supply
    const projectData = this.projectData || window.currentProject;
    if (!projectData) {
      console.warn('[NFT Count Animation] No project data available');
      window._nftCountAnimationRunning = false;
      return;
    }

    // Get total supply
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

    // Get seed list key
    function getSeedListKey(pd) {
      if (!pd || !pd.name) return 'default-seed-list';
      return `seed-list-${pd.name}`;
    }

    const totalSupply = getTotalSupply(projectData);
    if (!totalSupply || isNaN(totalSupply) || totalSupply < 1) {
      console.warn('[NFT Count Animation] Invalid total supply');
      return;
    }

    const seedListKey = getSeedListKey(projectData);
    
    // Get current count
    let currentCount = 0;
    if (window.savedSeedsModalInstance && 
        window.savedSeedsModalInstance.seedList && 
        Array.isArray(window.savedSeedsModalInstance.seedList) &&
        window.savedSeedsModalInstance.seedList.length > 0) {
      currentCount = window.savedSeedsModalInstance.seedList.filter(seed => {
        if (typeof seed === 'string' || typeof seed === 'number') {
          return true;
        }
        return seed && seed.seed;
      }).length;
    } else {
      try {
        const storedData = localStorage.getItem(seedListKey);
        if (storedData) {
          const seedList = JSON.parse(storedData);
          if (Array.isArray(seedList)) {
            currentCount = seedList.filter(seed => {
              if (typeof seed === 'string' || typeof seed === 'number') {
                return true;
              }
              return seed && seed.seed;
            }).length;
          }
        }
      } catch (error) {
        console.error('[NFT Count Animation] Error reading seed list:', error);
      }
    }

    if (currentCount === 0) {
      // No animation needed if count is 0
      window._nftCountAnimationRunning = false;
      return;
    }
    
    if (currentCount === 1) {
      // If count is 1, just set it directly without animation
      const formatNumber = this.formatNumberWithCommas || ((num) => num.toLocaleString('en-US'));
      const nftCountTextElement = document.querySelector('.nft-count-text');
      const progressBarElement = document.querySelector('.nft-progress-bar');
      if (nftCountTextElement) {
        nftCountTextElement.textContent = formatNumber(1);
      }
      if (progressBarElement) {
        const percentage = totalSupply > 0 ? (1 / totalSupply) * 100 : 0;
        progressBarElement.style.width = `${Math.min(percentage, 100)}%`;
        progressBarElement.style.setProperty('opacity', '1', 'important'); // Restore normal opacity
        progressBarElement.className = 'nft-progress-bar';
        if (percentage >= 100) {
          progressBarElement.classList.add('green');
          progressBarElement.style.setProperty('background-color', '#27ae60', 'important');
        } else if (percentage >= 95) {
          progressBarElement.classList.add('red');
          progressBarElement.style.setProperty('background-color', '#ef4444', 'important');
        } else if (percentage >= 80) {
          progressBarElement.classList.add('orange');
          progressBarElement.style.setProperty('background-color', '#f97316', 'important');
        } else {
          progressBarElement.classList.add('yellow');
          progressBarElement.style.setProperty('background-color', '#fbbf24', 'important');
        }
      }
      window._nftCountAnimationRunning = false;
      return;
    }

    // Calculate animation duration based on percentage (max 2 seconds for 100%)
    const percentage = totalSupply > 0 ? (currentCount / totalSupply) * 100 : 0;
    const animationDuration = (percentage / 100) * 2000; // Max 2 seconds for 100%

    // Get elements
    const nftCountTextElement = document.querySelector('.nft-count-text');
    const progressBarElement = document.querySelector('.nft-progress-bar');
    
    if (!nftCountTextElement || !progressBarElement) {
      console.warn('[NFT Count Animation] Elements not found, retrying...');
      setTimeout(() => this.animateNftCountAfterLoad(), 100);
      return;
    }

    // Format number function
    const formatNumber = this.formatNumberWithCommas || ((num) => num.toLocaleString('en-US'));

    // Set initial state - start from 1 for better UX
    nftCountTextElement.textContent = formatNumber(1);
    const initialPercentage = totalSupply > 0 ? (1 / totalSupply) * 100 : 0;
    progressBarElement.style.width = `${Math.min(initialPercentage, 100)}%`;
    progressBarElement.style.transition = 'none'; // Disable transition for animation
    progressBarElement.style.setProperty('opacity', '1', 'important'); // Restore normal opacity
    progressBarElement.className = 'nft-progress-bar';
    
    // Set initial color
    if (initialPercentage >= 100) {
      progressBarElement.classList.add('green');
      progressBarElement.style.setProperty('background-color', '#27ae60', 'important');
    } else if (initialPercentage >= 95) {
      progressBarElement.classList.add('red');
      progressBarElement.style.setProperty('background-color', '#ef4444', 'important');
    } else if (initialPercentage >= 80) {
      progressBarElement.classList.add('orange');
      progressBarElement.style.setProperty('background-color', '#f97316', 'important');
    } else {
      progressBarElement.classList.add('yellow');
      progressBarElement.style.setProperty('background-color', '#fbbf24', 'important');
    }

    // Calculate steps for smooth animation
    // Start from 1, so we animate from 1 to currentCount
    const countToAnimate = Math.max(1, currentCount - 1); // Subtract 1 since we start at 1
    const steps = Math.min(countToAnimate, 100); // Max 100 steps for smooth animation
    const stepDuration = animationDuration / steps;
    const countPerStep = Math.max(1, Math.ceil(countToAnimate / steps));

    let currentStep = 0;
    let currentDisplayCount = 1; // Start from 1

    const animate = () => {
      currentStep++;
      currentDisplayCount = Math.min(currentDisplayCount + countPerStep, currentCount);
      
      // Update counter text
      nftCountTextElement.textContent = formatNumber(currentDisplayCount);
      
      // Update progress bar
      const currentPercentage = totalSupply > 0 ? (currentDisplayCount / totalSupply) * 100 : 0;
      progressBarElement.style.width = `${Math.min(currentPercentage, 100)}%`;
      
      // Update progress bar color based on percentage
      progressBarElement.className = 'nft-progress-bar';
      progressBarElement.style.setProperty('opacity', '1', 'important'); // Ensure normal opacity during animation
      if (currentPercentage >= 100) {
        progressBarElement.classList.add('green');
        progressBarElement.style.setProperty('background-color', '#27ae60', 'important');
      } else if (currentPercentage >= 95) {
        progressBarElement.classList.add('red');
        progressBarElement.style.setProperty('background-color', '#ef4444', 'important');
      } else if (currentPercentage >= 80) {
        progressBarElement.classList.add('orange');
        progressBarElement.style.setProperty('background-color', '#f97316', 'important');
      } else {
        progressBarElement.classList.add('yellow');
        progressBarElement.style.setProperty('background-color', '#fbbf24', 'important');
      }
      
      // Update tooltip
      const tooltipElement = document.querySelector('#nft-count-panel .tooltiptext');
      if (tooltipElement) {
        tooltipElement.textContent = `NFT Collection is ${currentPercentage.toFixed(2)}% Complete.`;
      }

      if (currentDisplayCount < currentCount) {
        setTimeout(animate, stepDuration);
      } else {
        // Animation complete - set final values
        nftCountTextElement.textContent = formatNumber(currentCount);
        progressBarElement.style.width = `${Math.min(percentage, 100)}%`;
        progressBarElement.style.transition = 'width 0.3s ease, background-color 0.3s ease'; // Re-enable transition
        
        // Final color update
        progressBarElement.className = 'nft-progress-bar';
        progressBarElement.style.setProperty('opacity', '1', 'important'); // Ensure normal opacity
        if (percentage >= 100) {
          progressBarElement.classList.add('green');
          progressBarElement.style.setProperty('background-color', '#27ae60', 'important');
        } else if (percentage >= 95) {
          progressBarElement.classList.add('red');
          progressBarElement.style.setProperty('background-color', '#ef4444', 'important');
        } else if (percentage >= 80) {
          progressBarElement.classList.add('orange');
          progressBarElement.style.setProperty('background-color', '#f97316', 'important');
        } else {
          progressBarElement.classList.add('yellow');
          progressBarElement.style.setProperty('background-color', '#fbbf24', 'important');
        }
        
        // Final tooltip update
        if (tooltipElement) {
          tooltipElement.textContent = `NFT Collection is ${percentage.toFixed(2)}% Complete.`;
        }
        
        // Mark animation as complete
        window._nftCountAnimationRunning = false;
      }
    };

    // Start animation
    requestAnimationFrame(() => {
      setTimeout(animate, 50); // Small delay to ensure UI is ready
    });
  },

  // Fallback function to ensure only one NFT preview is displayed at any time
  ensureOnlyOneNFTDisplayed: function() {
    // CRITICAL: Ensure preview container exists before checking
    const previewPanelElem = document.querySelector('.nft-preview-image-area');
    if (!previewPanelElem) return;
    
    let previewContainer = previewPanelElem.querySelector('#nft-preview-container');
    if (!previewContainer) {
      // Create container if it doesn't exist
      previewContainer = document.createElement('div');
      previewContainer.id = 'nft-preview-container';
      previewContainer.style.position = 'relative';
      previewContainer.style.width = '100%';
      previewContainer.style.height = '100%';
      previewPanelElem.appendChild(previewContainer);
    }

    const allItems = previewContainer.querySelectorAll('.nft-preview-item');
    
    if (allItems.length === 0) {
      // No NFTs displayed - ensure container stays visible (never delete it)
      // The container must remain to preserve the preview area space
      return;
    }
    
    if (allItems.length === 1) {
      // Only one NFT - ensure it's visible
      const singleItem = allItems[0];
      singleItem.style.opacity = '1';
      singleItem.style.zIndex = '2';
      singleItem.style.display = 'flex';
      return;
    }
    
    // Multiple NFTs - keep only the most recent one (highest z-index or last in DOM)
    let mostRecentItem = null;
    let highestZIndex = -1;
    
    allItems.forEach(item => {
      const zIndex = parseInt(item.style.zIndex) || 0;
      if (zIndex > highestZIndex || !mostRecentItem) {
        highestZIndex = zIndex;
        mostRecentItem = item;
      }
    });
    
    // If no item with z-index found, use the last one in DOM
    if (!mostRecentItem) {
      mostRecentItem = allItems[allItems.length - 1];
    }
    
    // Remove all other items
    allItems.forEach(item => {
      if (item !== mostRecentItem) {
        item.remove();
      }
    });
    
    // Ensure the remaining item is fully visible
    if (mostRecentItem) {
      mostRecentItem.style.opacity = '1';
      mostRecentItem.style.zIndex = '2';
      mostRecentItem.style.display = 'flex';
    }
    
    console.log('[DEBUG] ensureOnlyOneNFTDisplayed: Removed', allItems.length - 1, 'duplicate NFT(s), keeping 1');
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
              <button class="select-trait-close-btn tooltip">
                <span class="tooltiptext">Close modal</span>
                &times;
              </button>
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
      
      // Force modal container width with !important to override all CSS
      const modalContainer = modal.querySelector('.select-trait-container');
      if (modalContainer) {
        modalContainer.style.setProperty('width', '962px', 'important');
        modalContainer.style.setProperty('min-width', '962px', 'important');
        modalContainer.style.setProperty('max-width', '962px', 'important');
        modalContainer.style.setProperty('flex', 'none', 'important');
        modalContainer.style.setProperty('flex-shrink', '0', 'important');
        modalContainer.style.setProperty('flex-grow', '0', 'important');
      }
      
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
          position: relative !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          width: 141px !important;
          height: 165px !important;
          background: rgba(20, 20, 20, 0.3) !important;
          border: 1px solid #a259e6 !important;
          border-radius: 6px !important;
          cursor: pointer !important;
          transition: all 0.2s ease !important;
          padding: 0 3px !important;
          box-sizing: border-box !important;
        `;
        // Create image container for 'none' (centered)
        const noneImgDiv = document.createElement('div');
        noneImgDiv.className = 'trait-selection-img';
        noneImgDiv.style.cssText = `
          width: 135px !important;
          height: 106px !important;
          background: rgba(0, 0, 0, 0.2) !important;
          border-radius: 4px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          margin: 3px auto 8px auto !important;
          border: none !important;
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
          width: calc(100% - 6px);
          max-width: calc(100% - 6px);
          margin: 0 3px;
          font-weight: 500;
          box-sizing: border-box;
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
            position: relative !important;
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            justify-content: center !important;
            width: 141px !important;
            height: 165px !important;
            background: rgba(20, 20, 20, 0.3) !important;
            border: 1px solid #a259e6 !important;
            border-radius: 6px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            padding: 0 3px !important;
            box-sizing: border-box !important;
          `;
          // Image
          const imgDiv = document.createElement('div');
          imgDiv.className = 'trait-selection-img';
          imgDiv.style.cssText = `
            width: 135px !important;
            height: 106px !important;
            background: rgba(0, 0, 0, 0.2) !important;
            border-radius: 4px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            margin: 3px auto 8px auto !important;
            overflow: hidden !important;
            border: none !important;
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
            width: calc(100% - 6px);
            max-width: calc(100% - 6px);
            margin: 0 3px;
            font-weight: 500;
            box-sizing: border-box;
          `;
          if (trait.name.length > 16) {
            // Remove title and add custom tooltip
            nameDiv.removeAttribute('title');
            nameDiv.classList.add('tooltip');
            let nameTooltip = nameDiv.querySelector('.tooltiptext');
            if (!nameTooltip) {
              nameTooltip = document.createElement('span');
              nameTooltip.className = 'tooltiptext';
              nameTooltip.textContent = trait.name;
              nameDiv.appendChild(nameTooltip);
            } else {
              nameTooltip.textContent = trait.name;
            }
          } else {
            nameDiv.removeAttribute('title');
          }
          thumb.appendChild(nameDiv);
          
          // Create rarity element (top left corner) - matching Dark NFT Traits Configuration style
          const rarityDiv = document.createElement('div');
          rarityDiv.className = 'select-trait-rarity';
          rarityDiv.style.cssText = `
            position: absolute !important;
            top: 4px !important;
            left: 4px !important;
            width: 37.86px !important;
            height: 16.32px !important;
            color: #8b5cf6 !important;
            background: rgba(0, 0, 0, 0.7) !important;
            padding: 0 !important;
            border-radius: 3px !important;
            font-size: 9px !important;
            font-weight: 600 !important;
            font-family: 'Archivo', sans-serif !important;
            z-index: 4 !important;
            pointer-events: none !important;
            border: 1px solid rgba(139, 92, 246, 0.3) !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            min-width: 37.86px !important;
            min-height: 16.32px !important;
            max-width: 37.86px !important;
            max-height: 16.32px !important;
          `;
          rarityDiv.textContent = `${(parseFloat(trait.rarity) || 0).toFixed(2)}%`;
          thumb.appendChild(rarityDiv);
          
          // Add VIEW button
          const viewBtn = document.createElement('button');
          viewBtn.className = 'select-trait-view-btn';
          viewBtn.textContent = 'VIEW';
          // Remove title and add custom tooltip
          viewBtn.removeAttribute('title');
          viewBtn.classList.add('tooltip');
          let viewTooltip = viewBtn.querySelector('.tooltiptext');
          if (!viewTooltip) {
            viewTooltip = document.createElement('span');
            viewTooltip.className = 'tooltiptext';
            viewTooltip.textContent = 'View trait image';
            viewBtn.appendChild(viewTooltip);
          } else {
            viewTooltip.textContent = 'View trait image';
          }
          viewBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('[Select Trait Modal] View button clicked for trait:', trait.name);
            if (trait.imageData || trait.image) {
              // Use Trait Full-Size Popup for visual consistency
              const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
              if (generateNftsUI && generateNftsUI.showTraitFullSizePopup) {
                const traitObj = { trait: { image: trait.image, imageData: trait.imageData, name: trait.name }, layer: { name: layerName } };
                generateNftsUI.showTraitFullSizePopup(traitObj, layerName, trait.name);
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
            countIndicator.textContent = `${totalTraits} traits`;
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
    
    // Get trait image data - handle multiple possible data structures
    let imagePath = '';
    if (traitObj && typeof traitObj === 'object') {
      // Try different ways to access the image
      if (traitObj.image) {
        imagePath = traitObj.image;
      } else if (traitObj.imageData) {
        imagePath = traitObj.imageData;
      } else if (traitObj.trait) {
        imagePath = traitObj.trait.image || traitObj.trait.imageData;
      } else if (traitObj.src) {
        imagePath = traitObj.src;
      }
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
      z-index: 2147483647 !important;
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
    
    // Ensure we have fallback values for traitName and layerName
    const displayTraitName = traitName || (traitObj && traitObj.trait && traitObj.trait.name) || (traitObj && traitObj.name) || 'Trait';
    const displayLayerName = layerName || (traitObj && traitObj.layer && traitObj.layer.name) || 'Layer';
    
    title.textContent = `${displayTraitName} (${displayLayerName})`;
    
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
      img.alt = displayTraitName;
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
        <div style="font-size: 14px; margin-top: 8px; color: #888;">${displayTraitName}</div>
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
    // Extract rarity from the trait object
    let rarityDisplay = '';
    if (traitObj && traitObj.trait && traitObj.trait.rarity) {
      const rarityValue = traitObj.trait.rarity;
      // Always format to 2 decimals for consistency
      if (typeof rarityValue === 'number') {
        rarityDisplay = rarityValue.toFixed(2) + '%';
      } else if (typeof rarityValue === 'string') {
        // Parse the value (remove % if present), format to 2 decimals, then add %
        const numericValue = parseFloat(rarityValue.replace('%', ''));
        if (!isNaN(numericValue)) {
          rarityDisplay = numericValue.toFixed(2) + '%';
        } else {
          rarityDisplay = rarityValue;
        }
      } else {
        rarityDisplay = rarityValue;
      }
    }
    
    traitInfo.innerHTML = `
      <div style="font-weight: 600; color: #fff; margin-bottom: 8px;">Trait Information</div>
      <div><strong>Name:</strong> ${displayTraitName}</div>
      <div><strong>Layer:</strong> ${displayLayerName}</div>
      ${rarityDisplay ? `<div><strong>Rarity:</strong> ${rarityDisplay}</div>` : ''}
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
        nftSeed: nft.seed,
        allTraitsCount: nft.traits.length
      });
      
      // CRITICAL: Find the full trait object from projectData to preserve all properties (image, imageData, etc.)
      const traitInfo = nft.traits[traitIndex];
      const layer = traitInfo.layer;
      let fullTraitObject = newTrait;
      
      // Try to find the full trait object in projectData
      if (projectData && projectData.traits && layer) {
        const layerData = projectData.traits.find(l => 
          l.id === layer.id || l.name === layer.name || l.name === layer
        );
        
        if (layerData && layerData.traits) {
          const projectTrait = layerData.traits.find(t => 
            t.id === newTrait.id || t.name === newTrait.name || 
            (typeof newTrait === 'string' && (t.name === newTrait || t.id === newTrait))
          );
          
          if (projectTrait) {
            // Use the full trait object from projectData with all properties
            fullTraitObject = projectTrait;
            console.log('[Generate NFTs UI] Found full trait object in projectData:', {
              traitName: projectTrait.name,
              hasImage: !!(projectTrait.image || projectTrait.imageData),
              hasImageData: !!projectTrait.imageData
            });
          } else {
            console.warn('[Generate NFTs UI] Trait not found in projectData, using provided trait:', {
              layerName: layerData.name,
              traitName: newTrait.name || newTrait,
              availableTraits: layerData.traits.map(t => t.name || t.id)
            });
          }
        }
      }
      
      // Update the trait with the full object
      nft.traits[traitIndex].trait = fullTraitObject;
      
      console.log('[Generate NFTs UI] doApply - After update:', {
        traitIndex: traitIndex,
        updatedTrait: nft.traits[traitIndex].trait,
        allTraitsCount: nft.traits.length,
        allTraits: nft.traits.map(t => ({ 
          layer: t.layer?.name || t.layer, 
          trait: t.trait?.name || t.trait,
          hasImage: !!(t.trait?.image || t.trait?.imageData),
          hasLayer: !!t.layer
        }))
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
        
        // CRITICAL: Sort traits by layer order to ensure correct stacking order
        // This ensures that when a trait is replaced, it takes the exact same relative position
        const traitsToRender = [...nft.traits];
        if (projectData && projectData.traits && Array.isArray(projectData.traits)) {
          traitsToRender.sort((a, b) => {
            const layerA = projectData.traits.find(l => 
              l.id === a.layer?.id || l.name === a.layer?.name || l.name === a.layer
            );
            const layerB = projectData.traits.find(l => 
              l.id === b.layer?.id || l.name === b.layer?.name || l.name === b.layer
            );
            
            // Sort by layer order (background first, foreground last)
            const orderA = layerA ? (layerA.order || 0) : 0;
            const orderB = layerB ? (layerB.order || 0) : 0;
            return orderA - orderB;
          });
        }
        
        // Load all trait images and render them
        const imagePromises = [];
        
        for (const traitInfo of traitsToRender) {
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
          
          // Draw each image in order (sorted by layer order)
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

  // Function to setup tooltip for NFT Traits title in Generate NFTs tab
  setupNFTTraitsTooltip: function() {
    const generateNftsTab = document.getElementById('generate-nfts');
    if (!generateNftsTab) return;
    
    const traitsTitle = generateNftsTab.querySelector('.traits-title');
    const traitsTitleText = traitsTitle?.querySelector('.traits-title-text');
    const tooltipText = traitsTitle?.querySelector('.custom-tooltip-text');
    
    if (traitsTitle && traitsTitleText && tooltipText) {
      // Set the tooltip text to match the edit modal
      tooltipText.innerHTML = 'Check the list of<br>traits being used on<br>the generated NFT and<br>edit them as you like';
      
      // Use global tooltip manager
      const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
      if (tooltipManager && tooltipManager.setupTooltip) {
        tooltipManager.setupTooltip(traitsTitleText, tooltipText);
      }
    }
  },

  setupUI: function(projectData) {
    // Store reference to this module for use in callbacks
    const self = this;
    
    let generateNftsTab = document.getElementById('generate-nfts');
    // ... inside setupUI, after rendering the preview panel ...
    // Set the main HTML structure first
    generateNftsTab.innerHTML = `
      <div class="generate-nfts-container" style="position: relative; width: 100%;">
        <div class="nft-preview-title tooltip tooltip-bottom" style="position: absolute; top: 0; left: 194px; width: 542px; text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0; padding: 0; z-index: 10;">
          <span class="nft-preview-title-text" style="cursor: help; display: inline-block; font-size: 1.8rem; font-weight: 600;">Generate NFTs</span>
          <span class="tooltiptext"></span>
          <div class="custom-tooltip-text"></div>
        </div>
        <div class="traits-title tooltip tooltip-bottom" style="position: absolute; top: 0; left: 748px; width: 220px; text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0; padding: 0; z-index: 10;">
          <span class="traits-title-text" style="cursor: help; display: inline-block; font-size: 1.8rem; font-weight: 600;">NFT Traits</span>
          <span class="tooltiptext"></span>
          <div class="custom-tooltip-text" style="visibility: hidden; opacity: 0; position: absolute; top: calc(100% + 10px); bottom: auto; left: 50%; transform: translateX(-50%); background: #000000; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 400; white-space: normal; z-index: 999999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center; line-height: 1.4; width: 180px; transition: opacity 1s ease, visibility 1s ease;">
            View all traits used in<br>your NFT and change<br>any trait to update<br>the NFT's appearance
          </div>
        </div>
        <div class="generate-nfts-main-row" style="display: flex; flex-direction: row; gap: 12px; align-items: flex-start; width: 100%;">
          <div class="nft-preview-section" style="flex: 0 0 542px; max-width: 542px; min-width: 542px; display: flex; flex-direction: column; gap: 0;">
            <div class="nft-preview-panel" style="display: flex; flex-direction: column; gap: 0;">
            <div class="nft-controls-panel" style="display: flex; flex-direction: column; gap: 0; width: 542px; height: 116px; background: #23232b; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.10); padding: 18px 18px 10px 18px; margin-bottom: 18px; border: 1.5px solid #29293a;">
              <div class="nft-controls-panel-content" id="nft-controls-panel-content" style="display: flex; flex-direction: column; gap: 0; width: 100%;">
                <div class="nft-rarity-seed-row"></div>
                <div class="nft-seedlist-random-row"></div>
                <div class="nft-seedinput-row"></div>
              </div>
            </div>
            <div class="nft-preview-image-area" style="width: 542px; height: 542px;"><div id="nft-preview-container"></div></div>
            </div>
          </div>
          <div class="traits-section" style="width: 220px; min-width: 220px; max-width: 220px; display: flex; flex-direction: column; flex: none;">
            <div class="traits-list-card" style="flex: 1; display: flex; flex-direction: column;">
            <div class="nft-trait-info-panel">
              <ul class="nft-trait-info-list"></ul>
                </div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Ensure proper title positioning after HTML is set - titles are now inside generate-nfts-container
    setTimeout(() => {
      const nftPreviewTitle = generateNftsTab.querySelector('.nft-preview-title');
      const traitsTitle = generateNftsTab.querySelector('.traits-title');
      
      // Ensure titles are properly positioned inside generate-nfts-container
      if (nftPreviewTitle && traitsTitle) {
        nftPreviewTitle.style.cssText = 'position: absolute; top: 0; left: 194px; width: 542px; text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0; padding: 0; line-height: 1.2; display: flex; align-items: center; justify-content: center; height: 2.5rem; cursor: help; z-index: 10;';
        traitsTitle.style.cssText = 'position: absolute; top: 0; left: 748px; width: 220px; text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0; padding: 0; line-height: 1.2; display: flex; align-items: center; justify-content: center; height: 2.5rem; cursor: help; z-index: 10;';
      }
    }, 10);
    
    // Now insert the new action buttons after the preview panel is present
    setTimeout(() => {
      const btnMount = generateNftsTab.querySelector('.nft-preview-image-area');
      if (btnMount && !btnMount.querySelector('.nft-action-buttons-container')) {
        // Get project data and check requirements
        const currentProjectData = self.projectData || window.currentProject || projectData;
        const hasMinimumRequirements = self._hasMinimumRequirements(currentProjectData);
        
        // Create NFT Action Buttons Container
        const nftActionButtonsContainer = document.createElement('div');
        nftActionButtonsContainer.className = 'nft-action-buttons-container';
        nftActionButtonsContainer.style.display = 'flex';
        nftActionButtonsContainer.style.flexDirection = 'row';
        nftActionButtonsContainer.style.gap = '8px';
        nftActionButtonsContainer.style.marginTop = '12px';
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
        createNftBtn.className = 'nft-action-btn tooltip';
        const createTooltip = document.createElement('span');
        createTooltip.className = 'tooltiptext';
        createTooltip.textContent = 'Create a random NFT, considering all rules and rarities';
        createNftBtn.appendChild(createTooltip);
        
        // Position tooltip above button on hover (matching export-nfts-module.js pattern)
        let createTooltipTimeout = null;
        createNftBtn.addEventListener('mouseenter', function() {
          // Clear any existing timeout
          if (createTooltipTimeout) {
            clearTimeout(createTooltipTimeout);
            createTooltipTimeout = null;
          }
          // Show tooltip after 1 second delay
          createTooltipTimeout = setTimeout(() => {
            const rect = createNftBtn.getBoundingClientRect();
            // Make tooltip temporarily visible to measure height, but keep it off-screen
            createTooltip.style.visibility = 'visible';
            createTooltip.style.opacity = '0';
            createTooltip.style.top = '-9999px';
            createTooltip.style.left = '-9999px';
            createTooltip.style.transform = 'none';
            void createTooltip.offsetHeight; // Force reflow
            const tooltipWidth = createTooltip.offsetWidth || 200;
            const tooltipHeight = createTooltip.offsetHeight;
            // CRITICAL: Set position fixed and use setProperty with important to override CSS
            createTooltip.style.setProperty("position", "fixed", "important");
            createTooltip.style.setProperty("z-index", "2147483647", "important");
            createTooltip.style.setProperty("bottom", "auto", "important");
            createTooltip.style.setProperty("right", "auto", "important");
            createTooltip.style.setProperty("margin", "0", "important");
            createTooltip.style.setProperty("transform", "none", "important");
            // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
            const buttonRect = createNftBtn.getBoundingClientRect();
            const centeredLeft = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
            const topPosition = buttonRect.top - tooltipHeight - 5;
            createTooltip.style.setProperty("top", `${topPosition}px`, "important");
            createTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
            // Fade in with transition
            requestAnimationFrame(() => {
              createTooltip.style.opacity = '1';
            });
            createTooltipTimeout = null;
          }, 1000);
        });
        createNftBtn.addEventListener('mouseleave', function() {
          // Clear the show timeout if mouse leaves before delay completes
          if (createTooltipTimeout) {
            clearTimeout(createTooltipTimeout);
            createTooltipTimeout = null;
          }
          createTooltip.style.opacity = '0';
          // Wait for fade out transition to complete before hiding
          setTimeout(() => {
            createTooltip.style.visibility = 'hidden';
          }, 1000);
        });
        // Store original styles for Create NFT button
        const createNftBtnOriginalStyles = {
          backgroundColor: '#047857',
          borderColor: '#047857',
          color: '#ffffff',
          cursor: 'pointer'
        };
        
        // CRITICAL: Start all buttons greyed out if popup is showing, requirements not met, or no NFT exists
        const popup = generateNftsTab.querySelector('.nft-rendering-popup');
        // Check if NFT exists - use same logic as later in the function
        const hasNFTForButton = !!(window.lastGeneratedNFT && window.lastGeneratedNFT.seed);
        const shouldStartGreyed = popup || !hasMinimumRequirements || !hasNFTForButton;
        
        if (shouldStartGreyed) {
          self._applyDisabledStyles(createNftBtn);
          // Border is already removed by _applyDisabledStyles
          createNftBtn.style.setProperty('box-shadow', 'none', 'important'); // Remove halo
          createNftBtn.disabled = true;
          createNftBtn.setAttribute('disabled', 'disabled');
        }
        
        createNftBtn.addEventListener('click', async function() {
          // Don't allow click if disabled - check requirements again
          const currentProjectData = self.projectData || window.currentProject;
          if (!self._hasMinimumRequirements(currentProjectData)) {
            return;
          }
          
          // Add press effect immediately
          this.classList.add('pressed');
          
          // Use requestAnimationFrame to ensure animation starts before heavy calculation
          requestAnimationFrame(async () => {
            // Same functionality as existing Create NFT button
            const projectData = window.NFTApp.getModule('generateNftsUI').projectData;
            if (!projectData) {
              alert('Project data not loaded.');
              // Remove pressed class if there's an error
              setTimeout(() => this.classList.remove('pressed'), 25);
              return;
            }
            
            try {
              // Start the heavy calculation after animation has started
              // randomizeSingleNFT is async, but doesn't return a promise directly
              // We need to wait for the NFT to be generated via the promise chain
              const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
              const generateNfts = window.NFTApp.getModule('generateNfts');
              
              if (generateNftsUI && generateNfts) {
                // Call randomizeSingleNFT which will generate the NFT
                generateNftsUI.randomizeSingleNFT(projectData, false);
                
                // Wait for NFT to be generated by monitoring window.lastGeneratedNFT
                // We'll check periodically until the NFT is created
                let attempts = 0;
                const maxAttempts = 50; // 5 seconds max wait (50 * 100ms)
                
                // Store the previous NFT to detect when a new one is created
                const previousNFT = window.lastGeneratedNFT;
                let previousSeed = previousNFT ? previousNFT.seed : null;
                
                const checkNFTGenerated = setInterval(() => {
                  attempts++;
                  const lastNFT = window.lastGeneratedNFT;
                  
                  // Check if NFT was generated (has imageData and seed) and is different from previous
                  // Also check if the preview image exists in the DOM
                  const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
                  const hasImageInDOM = previewImage && (previewImage.complete || previewImage.src);
                  
                  if (lastNFT && lastNFT.imageData && lastNFT.seed && 
                      (lastNFT.seed !== previousSeed || hasImageInDOM)) {
                    clearInterval(checkNFTGenerated);
                    
                    // Wait a bit more to ensure UI is fully updated
                    setTimeout(() => {
                      // Update NFT count panel after generation is complete
                      // Only update if animation is not running to prevent conflicts
                      if (!window._nftCountAnimationRunning && window.updateNftCountPanel) {
                        window.updateNftCountPanel();
                      }
                    }, 200);
                  } else if (attempts >= maxAttempts) {
                    clearInterval(checkNFTGenerated);
                    console.warn('[Create NFT] Timeout waiting for NFT generation');
                    // Still try to update count panel even if timeout
                    if (!window._nftCountAnimationRunning && window.updateNftCountPanel) {
                      window.updateNftCountPanel();
                    }
                  }
                }, 100);
              }
            } catch (error) {
              console.error('[Create NFT] Error:', error);
            }
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
        addToCollectionBtn.innerHTML = 'add NFT to Collection';
        addToCollectionBtn.className = 'nft-action-btn tooltip';
        const addTooltip = document.createElement('span');
        addTooltip.className = 'tooltiptext';
        addTooltip.textContent = 'Add current NFT to your collection';
        addToCollectionBtn.appendChild(addTooltip);
        
        // Position tooltip above button on hover
        addToCollectionBtn.addEventListener('mouseenter', function() {
          requestAnimationFrame(() => {
            const rect = addToCollectionBtn.getBoundingClientRect();
            addTooltip.style.position = 'fixed';
            addTooltip.style.visibility = 'hidden';
            addTooltip.style.opacity = '0';
            addTooltip.style.display = 'block';
            addTooltip.style.top = '0';
            addTooltip.style.left = '0';
            addTooltip.style.transform = 'none';
            void addTooltip.offsetHeight;
            const tooltipRect = addTooltip.getBoundingClientRect();
            const tooltipHeight = tooltipRect.height || 60;
            addTooltip.style.top = `${rect.top - tooltipHeight - 8}px`;
            addTooltip.style.left = `${rect.left + (rect.width / 2)}px`;
            addTooltip.style.transform = 'translateX(-50%)';
            addTooltip.style.zIndex = '2147483647';
          });
        });
        // Store original styles for Add to Collection button
        const addToCollectionBtnOriginalStyles = {
          backgroundColor: '#1e40af',
          borderColor: '#1e40af',
          color: '#ffffff',
          cursor: 'pointer'
        };
        
        // CRITICAL: Start all buttons greyed out if popup is showing or requirements not met
        if (shouldStartGreyed) {
          self._applyDisabledStyles(addToCollectionBtn);
          addToCollectionBtn.style.border = '2px solid #84a0b0';
          addToCollectionBtn.style.setProperty('box-shadow', 'none', 'important'); // Remove halo
          addToCollectionBtn.disabled = true;
          addToCollectionBtn.setAttribute('disabled', 'disabled');
        }
        
        addToCollectionBtn.addEventListener('click', function() {
          // Don't allow click if disabled - check requirements again
          const currentProjectData = self.projectData || window.currentProject;
          if (!self._hasMinimumRequirements(currentProjectData)) {
            return;
          }
          
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
          
          // CRITICAL: Always read from localStorage as the source of truth first
          // Then check modal instance to ensure consistency (like autoImportSeedsToProject does)
          let seedList = [];
          try {
            seedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
            console.log('[DEBUG] Single NFT add: Read from localStorage:', seedList.length, 'seeds (key:', seedListKey, ')');
          } catch (parseError) {
            console.error('[DEBUG] Error parsing localStorage seedList:', parseError);
            seedList = [];
          }
          
          // If modal instance exists and has more seeds, use it as fallback
          if (window.savedSeedsModalInstance && 
              window.savedSeedsModalInstance.seedListKey === seedListKey &&
              window.savedSeedsModalInstance.seedList && 
              Array.isArray(window.savedSeedsModalInstance.seedList) &&
              window.savedSeedsModalInstance.seedList.length > seedList.length) {
            console.log('[DEBUG] Single NFT add: Modal instance has more seeds, using it');
            seedList = window.savedSeedsModalInstance.seedList;
          }
          
          // Normalize seedList to ensure consistent format
          seedList = seedList.map(seed => {
            if (typeof seed === 'string' || typeof seed === 'number') {
              return { seed: String(seed) };
            }
            if (seed && seed.seed) {
              return { seed: String(seed.seed) };
            }
            return seed;
          }).filter(seed => seed && seed.seed);
          
          console.log('[DEBUG] Single NFT add: Normalized seedList length:', seedList.length);
          
          if (seedList.some(s => {
            const existingSeed = typeof s === 'string' || typeof s === 'number' 
              ? String(s) 
              : (s && s.seed ? String(s.seed) : null);
            return existingSeed === String(lastNFT.seed);
          })) {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Seed already in the list.', 'error', 2500);
            }
            return;
          }
          
          if (seedList.length >= totalSupply) {
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show('Seed list is full.', 'error', 2500);
            }
            return;
          }
          
          // Proactively optimize existing seedList to keep only seed numbers
          // This prevents quota errors and keeps storage light
          seedList = seedList.map(seed => {
            // If seed is already just a string or number, keep it as is
            if (typeof seed === 'string' || typeof seed === 'number') {
              return { seed: String(seed) };
            }
            // If seed is an object, keep only the seed property
            if (seed && seed.seed) {
              return { seed: String(seed.seed) };
            }
            return seed;
          }).filter(seed => seed && seed.seed); // Remove any invalid entries
          
          // Save only the seed number (lightest solution)
          seedList.push({ seed: String(lastNFT.seed) });
          
          // Save to localStorage
          try {
            localStorage.setItem(seedListKey, JSON.stringify(seedList));
          } catch (error) {
            console.error('[DEBUG] Error saving seed list:', error);
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show(
                'Error saving NFT to collection. Please try again.',
                'error',
                3000
              );
            }
            return; // Exit without updating counters
          }
          
          // Update saved seeds modal instance if it exists
          if (window.savedSeedsModalInstance) {
            // CRITICAL: Reload from localStorage to ensure correct order is preserved
            // Simply assigning might not preserve the exact order from localStorage
            if (window.savedSeedsModalInstance.loadSeedList && typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
              // Force reload from localStorage to maintain correct collection order
              window.savedSeedsModalInstance.loadSeedList(true);
            } else {
              // Fallback: assign directly
              window.savedSeedsModalInstance.seedList = seedList;
            }
            
            // Update recalculate button state if modal is open
            if (window.savedSeedsModalInstance.updateRecalculateButtonState) {
              window.savedSeedsModalInstance.updateRecalculateButtonState();
            }
            // Update collection space counter
            if (window.savedSeedsModalInstance.updateCollectionSpaceCounter) {
              window.savedSeedsModalInstance.updateCollectionSpaceCounter();
            }
            
            // If modal is currently open and visible, refresh the current page to show the new NFT
            if (window.savedSeedsModalInstance.modal && window.savedSeedsModalInstance.modal.style.display !== 'none') {
              // Calculate last page to navigate to the newly added NFT
              const totalPages = Math.ceil(seedList.length / (window.savedSeedsModalInstance.pageSize || 30));
              // Re-render current page or navigate to last page if user wants to see the new addition
              // For now, just refresh current page - user can navigate to last page manually
              if (window.savedSeedsModalInstance.renderPage && typeof window.savedSeedsModalInstance.renderPage === 'function') {
                window.savedSeedsModalInstance.renderPage(window.savedSeedsModalInstance.currentPage || 1);
              }
            }
          }
          
          // Update all counters
          if (window.updateAllCounters) {
            window.updateAllCounters();
          }
          
          // Update seed list counter specifically
          const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUIModule && generateNftsUIModule.refreshSeedListCounter) {
            generateNftsUIModule.refreshSeedListCounter(true);
          }
          
          // Update NFT count panel
          if (window.updateNftCountPanel) {
            window.updateNftCountPanel();
          }
          
          // Mark buttons as outdated in saved seeds modal since NFT was added
          if (window.savedSeedsModalInstance && typeof window.savedSeedsModalInstance.markButtonsOutdated === 'function') {
            window.savedSeedsModalInstance.markButtonsOutdated();
          }
          
          // Show success message
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('NFT added to collection.', 'success', 2000);
          }
          
          console.log('[DEBUG] Add to Collection: Seed number saved, counter updated:', seedList.length, totalSupply);
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
        bulkGenerationBtn.className = 'nft-action-btn tooltip';
        const bulkTooltip = document.createElement('span');
        bulkTooltip.className = 'tooltiptext';
        bulkTooltip.textContent = 'Generate multiple NFTs at once or in batches. Pick the ones you like, select them in the order you want them added, then click Add Selected. They will be appended after the last NFT in your collection.';
        bulkGenerationBtn.appendChild(bulkTooltip);
        
        // Position tooltip above button on hover
        bulkGenerationBtn.addEventListener('mouseenter', function() {
          requestAnimationFrame(() => {
            const rect = bulkGenerationBtn.getBoundingClientRect();
            bulkTooltip.style.position = 'fixed';
            bulkTooltip.style.visibility = 'hidden';
            bulkTooltip.style.opacity = '0';
            bulkTooltip.style.display = 'block';
            bulkTooltip.style.top = '0';
            bulkTooltip.style.left = '0';
            bulkTooltip.style.transform = 'none';
            void bulkTooltip.offsetHeight;
            const tooltipRect = bulkTooltip.getBoundingClientRect();
            const tooltipHeight = tooltipRect.height || 60;
            bulkTooltip.style.top = `${rect.top - tooltipHeight - 8}px`;
            bulkTooltip.style.left = `${rect.left + (rect.width / 2)}px`;
            bulkTooltip.style.transform = 'translateX(-50%)';
            bulkTooltip.style.zIndex = '2147483647';
          });
        });
        // Store original styles for Bulk Generation button
        const bulkGenerationBtnOriginalStyles = {
          backgroundColor: '#ea580c',
          borderColor: '#ea580c',
          color: '#ffffff',
          cursor: 'pointer'
        };
        
        // CRITICAL: Start all buttons greyed out if popup is showing or requirements not met
        if (shouldStartGreyed) {
          self._applyDisabledStyles(bulkGenerationBtn);
          bulkGenerationBtn.style.border = '2px solid #84a0b0';
          bulkGenerationBtn.style.setProperty('box-shadow', 'none', 'important'); // Remove halo
          bulkGenerationBtn.disabled = true;
          bulkGenerationBtn.setAttribute('disabled', 'disabled');
        }
        
        bulkGenerationBtn.addEventListener('click', function() {
          // Don't allow click if disabled - check requirements again
          const currentProjectData = self.projectData || window.currentProject;
          if (!self._hasMinimumRequirements(currentProjectData)) {
            return;
          }
          
          // Add press effect
          this.classList.add('pressed');
          setTimeout(() => this.classList.remove('pressed'), 25);
          
          // Same functionality as Batch Generation button
          if (window.BatchGenerationModal) {
            const modal = new window.BatchGenerationModal();
            modal.show();
          } else {
            console.error('[DEBUG] BatchGenerationModal not available');
            // Use confirmation modal instead of browser alert
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('confirmationModal')) {
              window.NFTApp.getModule('confirmationModal').show(
                'Batch Generation Modal Error',
                'BatchGenerationModal is not available.',
                'Please refresh the page to reload the modal component.',
                () => {
                  window.location.reload();
                },
                {
                  singleButton: true,
                  confirmText: 'OK'
                }
              );
            } else {
              // Fallback if confirmation modal is also not available
            alert('BatchGenerationModal not available. Please refresh the page.');
            }
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
        editCollectionBtn.innerHTML = 'edit NFT<br>Collection';
        editCollectionBtn.className = 'nft-action-btn';
        // Store original styles for Edit Collection button
        const editCollectionBtnOriginalStyles = {
          backgroundColor: '#dc2626',
          borderColor: '#dc2626',
          color: '#ffffff',
          cursor: 'pointer'
        };
        
        // CRITICAL: Start all buttons greyed out if popup is showing or requirements not met
        if (shouldStartGreyed) {
          self._applyDisabledStyles(editCollectionBtn);
          editCollectionBtn.style.border = '2px solid #84a0b0';
          editCollectionBtn.style.setProperty('box-shadow', 'none', 'important'); // Remove halo
          editCollectionBtn.disabled = true;
          editCollectionBtn.setAttribute('disabled', 'disabled');
        }
        
        editCollectionBtn.addEventListener('click', function() {
          // Don't allow click if disabled - check requirements again
          const currentProjectData = self.projectData || window.currentProject;
          if (!self._hasMinimumRequirements(currentProjectData)) {
            return;
          }
          
          // Add press effect
          this.classList.add('pressed');
          setTimeout(() => this.classList.remove('pressed'), 25);
          
          // Same functionality as display-full-seed-list-btn
          if (window.SavedSeedsModal) {
            // Use singleton instance to preserve state between opens/closes
            if (!window.savedSeedsModalInstance) {
              window.savedSeedsModalInstance = new window.SavedSeedsModal();
            }
            window.savedSeedsModalInstance.show();
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
        nftCountContainer.className = 'nft-count-container';
        nftCountContainer.style.cssText = `
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          z-index: 25;
          position: relative;
          border-radius: 8px;
        `;
        
        // Check if NFT is rendered
        const hasNFT = !!(window.lastGeneratedNFT || document.querySelector('.nft-preview-item img, .nft-preview-image-area img'));
        const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
        const isNFTImageLoaded = previewImage && previewImage.complete && previewImage.naturalWidth > 0;
        const shouldEnableContent = hasMinimumRequirements && hasNFT && isNFTImageLoaded;
        
        // Apply disabled styles to NFT count panel and container if requirements not met or NFT not rendered
        if (!shouldEnableContent) {
          nftCountPanel.style.backgroundColor = '#23232b';
          nftCountPanel.style.borderColor = '#84a0b0';
          nftCountContainer.style.setProperty('opacity', '0.6', 'important');
          nftCountContainer.style.setProperty('background-color', '#23232b', 'important'); /* Grey background when inactive */
        }
        
        // NFT count number
        const nftCountText = document.createElement('div');
        nftCountText.className = 'nft-count-text';
        
        // Apply disabled styles if requirements not met or NFT not rendered
        if (!shouldEnableContent) {
          nftCountText.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
          nftCountText.style.setProperty('text-shadow', 'none', 'important');
        } else {
          nftCountText.style.setProperty('color', '#ffffff', 'important');
          nftCountText.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
        }
        
        nftCountText.style.cssText += `
          font-size: 18px;
          font-weight: bold;
          line-height: 1.1;
          text-align: center;
          word-break: break-all;
        `;
        nftCountText.textContent = '0';
        
        // NFTs label
        const nftsLabel = document.createElement('div');
        
        // Apply disabled styles if requirements not met or NFT not rendered
        if (!shouldEnableContent) {
          nftsLabel.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
          nftsLabel.style.setProperty('text-shadow', 'none', 'important');
        } else {
          nftsLabel.style.setProperty('color', '#ffffff', 'important');
          nftsLabel.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
        }
        
        nftsLabel.style.cssText += `
          font-size: 18px;
          font-weight: bold;
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
        
        // Add event listener to position tooltip correctly - only show when active (not greyed out)
        nftCountPanel.addEventListener('mouseenter', function() {
          // Check if content should be enabled (not greyed out)
          const hasNFT = !!(window.lastGeneratedNFT || document.querySelector('.nft-preview-item img, .nft-preview-image-area img'));
          const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
          const isNFTImageLoaded = previewImage && previewImage.complete && previewImage.naturalWidth > 0;
          const hasMinimumRequirements = document.querySelector('.trait-layer') !== null; // Check if traits are loaded
          const shouldEnableContent = hasMinimumRequirements && hasNFT && isNFTImageLoaded;
          
          // Only show tooltip if content is enabled (not greyed out)
          if (!shouldEnableContent) {
            tooltip.style.opacity = '0';
            tooltip.style.visibility = 'hidden';
            return;
          }
          
          const rect = nftCountPanel.getBoundingClientRect();
          tooltip.style.position = 'fixed';
          tooltip.style.zIndex = '2147483647';
          tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
          tooltip.style.left = (rect.left + rect.width / 2) + 'px';
          tooltip.style.transform = 'translateX(-50%)';
          tooltip.style.opacity = '1';
          tooltip.style.visibility = 'visible';
        });
        
        // Hide tooltip when mouse leaves
        nftCountPanel.addEventListener('mouseleave', function() {
          tooltip.style.opacity = '0';
          tooltip.style.visibility = 'hidden';
        });
        
        // Function to update NFT count panel
        function updateNftCountPanel() {
          // CRITICAL: Don't update if popup is still showing - wait until it closes
          // Check both in tab and body since popup can be in either location
          const generateNftsTab = document.getElementById('generate-nfts');
          let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
          if (!popup) {
            popup = document.querySelector('.nft-rendering-popup');
          }
          // Also check for "Please Wait" popup - don't show colors while it's visible
          const pleaseWaitPopup = document.getElementById('nft-edit-please-wait-popup');
          if (popup || pleaseWaitPopup) {
            console.log('[DEBUG] updateNftCountPanel: Popup is still showing, skipping update');
            return; // Don't update while popup is visible
          }
          
          // Ensure element exists - wait for it if necessary
          const nftCountTextElement = document.querySelector('.nft-count-text');
          if (!nftCountTextElement) {
            // Element doesn't exist yet - schedule retry after UI is initialized
            // This happens when project loads before the setTimeout creates the element
            if (!window._nftCountPanelRetryScheduled) {
              window._nftCountPanelRetryScheduled = true;
              let retryCount = 0;
              const maxRetries = 20; // Retry for up to 2 seconds (20 * 100ms)
              
              const retryInterval = setInterval(() => {
                const element = document.querySelector('.nft-count-text');
                if (element) {
                  clearInterval(retryInterval);
                  window._nftCountPanelRetryScheduled = false;
                  // Element found, now call update (but check popup again)
                  updateNftCountPanel();
                } else if (retryCount >= maxRetries) {
                  clearInterval(retryInterval);
                  window._nftCountPanelRetryScheduled = false;
                  console.warn('[DEBUG] updateNftCountPanel: nft-count-text element not found after retries');
                }
                retryCount++;
              }, 100);
            }
            return;
          }
          
          const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
          if (!projectData) {
            console.warn('[DEBUG] updateNftCountPanel: No project data available');
            return;
          }
          
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
          
          // CRITICAL: First try to ensure modal instance has loaded its seedList
          // This ensures we have the most up-to-date data even when modal is closed
          if (window.savedSeedsModalInstance) {
            // Make sure modal instance has the correct seedListKey
            if (typeof window.savedSeedsModalInstance.getSeedListKey === 'function') {
              const modalKey = window.savedSeedsModalInstance.getSeedListKey();
              if (modalKey !== seedListKey) {
                // console.log('[DEBUG] updateNftCountPanel: Modal key mismatch, updating modal key:', modalKey, 'vs', seedListKey);
                window.savedSeedsModalInstance.seedListKey = seedListKey;
              }
            }
            
            // Force load seedList if it's empty or hasn't been loaded yet
            if (!window.savedSeedsModalInstance.seedList || 
                window.savedSeedsModalInstance.seedList.length === 0) {
              // Load seedList if the method exists
              if (typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
                try {
                  window.savedSeedsModalInstance.loadSeedList(true); // Force reload
                  // console.log('[DEBUG] updateNftCountPanel: Forced modal to load seedList, count:', window.savedSeedsModalInstance.seedList?.length || 0);
                } catch (error) {
                  console.warn('[DEBUG] updateNftCountPanel: Error loading modal seedList:', error);
                }
              }
            }
          }
          
          // CRITICAL: Use modal instance's seedList if available (even when closed)
          // This is the most reliable source as it's kept in sync
          let currentCount = 0;
          let seedList = [];
          
          if (window.savedSeedsModalInstance && 
              window.savedSeedsModalInstance.seedList && 
              Array.isArray(window.savedSeedsModalInstance.seedList) &&
              window.savedSeedsModalInstance.seedList.length > 0) {
            // Use modal instance's seedList (most reliable)
            seedList = window.savedSeedsModalInstance.seedList;
            currentCount = seedList.filter(seed => {
              // Handle both { seed: "..." } format and plain seed strings
              if (typeof seed === 'string' || typeof seed === 'number') {
                return true; // Valid seed number/string
              }
              return seed && seed.seed; // Valid seed object
            }).length;
            // console.log('[DEBUG] updateNftCountPanel: Using modal instance seedList:', currentCount, 'items');
          } else {
            // Fallback: Read directly from localStorage
            try {
              const storedData = localStorage.getItem(seedListKey);
              if (storedData) {
                seedList = JSON.parse(storedData);
                // Ensure we count actual entries (filter out any null/undefined)
                if (Array.isArray(seedList)) {
                  currentCount = seedList.filter(seed => {
                    // Handle both { seed: "..." } format and plain seed strings
                    if (typeof seed === 'string' || typeof seed === 'number') {
                      return true; // Valid seed number/string
                    }
                    return seed && seed.seed; // Valid seed object
                  }).length;
                } else {
                  currentCount = 0;
                }
              }
              // console.log('[DEBUG] updateNftCountPanel: Read from localStorage:', currentCount, 'items from key:', seedListKey);
            } catch (error) {
              console.error('[DEBUG] updateNftCountPanel: Error parsing seed list from localStorage:', error);
              seedList = [];
              currentCount = 0;
            }
          }
          
          // CRITICAL: Don't update if animation is running - this prevents animation from restarting
          if (window._nftCountAnimationRunning) {
            console.log('[DEBUG] updateNftCountPanel: Animation is running, skipping update to prevent restart');
            return;
          }
          
          // Use the same formatting as seed list counter
          const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
          const formatNumber = generateNftsUIModule && generateNftsUIModule.formatNumberWithCommas ? 
            generateNftsUIModule.formatNumberWithCommas : 
            (num) => num.toLocaleString('en-US');
          
          // CRITICAL: Check if popup is still showing before updating count and styling
          // This ensures count container stays greyed out until popup closes
          const generateNftsTabCheck = document.getElementById('generate-nfts');
          let popupCheck = generateNftsTabCheck ? generateNftsTabCheck.querySelector('.nft-rendering-popup') : null;
          if (!popupCheck) {
            popupCheck = document.querySelector('.nft-rendering-popup');
          }
          const isPopupShowing = !!popupCheck;
          
          // Update count text to show only current count with comma formatting
          nftCountTextElement.textContent = formatNumber(currentCount || 0);
          // console.log('[DEBUG] updateNftCountPanel: Updated nft-count-text to:', currentCount);
          
          // Also update the local variable if it exists (backup)
          if (typeof nftCountText !== 'undefined' && nftCountText) {
            nftCountText.textContent = formatNumber(currentCount || 0);
          }
          
          // Find progress bar and tooltip elements dynamically
          const progressBarElement = document.querySelector('.nft-progress-bar');
          const tooltipElement = document.querySelector('#nft-count-panel .tooltiptext');
          
          // Calculate percentage
          const percentage = totalSupply > 0 ? (currentCount / totalSupply) * 100 : 0;
          
          // Update progress bar if found
          if (progressBarElement) {
            progressBarElement.style.width = `${Math.min(percentage, 100)}%`;
            
            // CRITICAL: Don't update progress bar color if popup is showing - keep it in default state
            // This prevents the green color from flashing before the "Please Wait" popup appears
            if (!isPopupShowing) {
              // Update progress bar color based on percentage - only when popup is NOT showing
            progressBarElement.className = 'nft-progress-bar';
            if (percentage >= 100) {
              progressBarElement.classList.add('green');
            } else if (percentage >= 95) {
              progressBarElement.classList.add('red');
            } else if (percentage >= 80) {
              progressBarElement.classList.add('orange');
            } else {
              progressBarElement.classList.add('yellow');
              }
            } else {
              // Popup is showing - keep progress bar in default state (no color classes)
              progressBarElement.className = 'nft-progress-bar';
              progressBarElement.style.backgroundColor = '#374151'; // Default dark grey
            }
          }
          
          // Update tooltip if found
          if (tooltipElement) {
            tooltipElement.textContent = `NFT Collection is ${percentage.toFixed(2)}% Complete.`;
          }
          
          // CRITICAL: Only update styling if popup is NOT showing
          // If popup is showing, keep count container greyed out (styling handled by _updateAllButtonStates)
          if (!isPopupShowing) {
            // Update count container styling - only if popup is closed
            const nftCountPanel = document.getElementById('nft-count-panel');
            const nftCountContainer = document.querySelector('.nft-count-container');
            const nftCountTextForStyle = document.querySelector('.nft-count-text');
            const nftsLabel = nftCountPanel ? nftCountPanel.querySelector('div:last-child') : null;
            
            // Check if NFT is actually displayed to determine if content should be enabled
            const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
            const isDataURI = previewImage && previewImage.src && previewImage.src.startsWith('data:');
            const isNFTImageLoaded = previewImage && (
              (previewImage.complete && previewImage.naturalWidth > 0) || 
              isDataURI ||
              (previewImage.src && previewImage.src !== '')
            );
            const hasNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
            const shouldEnableContent = hasNFT && isNFTImageLoaded;
            
            if (nftCountPanel) {
              if (!shouldEnableContent) {
                nftCountPanel.style.backgroundColor = '#23232b';
                nftCountPanel.style.borderColor = '#84a0b0';
              } else {
                nftCountPanel.style.backgroundColor = '#000000';
                nftCountPanel.style.borderColor = '#8b5cf6';
              }
            }
            
            if (nftCountContainer) {
              if (!shouldEnableContent) {
                nftCountContainer.style.setProperty('opacity', '0.6', 'important');
                nftCountContainer.style.setProperty('background-color', '#23232b', 'important');
              } else {
                nftCountContainer.style.setProperty('opacity', '1', 'important');
                nftCountContainer.style.setProperty('background-color', 'transparent', 'important');
              }
            }
            
            if (nftCountTextForStyle) {
              if (!shouldEnableContent) {
                nftCountTextForStyle.style.setProperty('color', '#a0a0b0', 'important');
                nftCountTextForStyle.style.setProperty('text-shadow', 'none', 'important');
              } else {
                nftCountTextForStyle.style.setProperty('color', '#ffffff', 'important');
                nftCountTextForStyle.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
              }
            }
            
            if (nftsLabel && nftsLabel.textContent === 'NFTs') {
              if (!shouldEnableContent) {
                nftsLabel.style.setProperty('color', '#a0a0b0', 'important');
                nftsLabel.style.setProperty('text-shadow', 'none', 'important');
              } else {
                nftsLabel.style.setProperty('color', '#ffffff', 'important');
                nftsLabel.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
              }
            }
          } else {
            // Popup is still showing - ensure count container stays greyed out
            const nftCountPanel = document.getElementById('nft-count-panel');
            const nftCountContainer = document.querySelector('.nft-count-container');
            const nftCountTextForStyle = document.querySelector('.nft-count-text');
            const nftsLabel = nftCountPanel ? nftCountPanel.querySelector('div:last-child') : null;
            
            if (nftCountPanel) {
              nftCountPanel.style.backgroundColor = '#23232b';
              nftCountPanel.style.borderColor = '#84a0b0';
            }
            if (nftCountContainer) {
              nftCountContainer.style.setProperty('opacity', '0.6', 'important');
              nftCountContainer.style.setProperty('background-color', '#23232b', 'important');
            }
            if (nftCountTextForStyle) {
              nftCountTextForStyle.style.setProperty('color', '#a0a0b0', 'important');
              nftCountTextForStyle.style.setProperty('text-shadow', 'none', 'important');
            }
            if (nftsLabel && nftsLabel.textContent === 'NFTs') {
              nftsLabel.style.setProperty('color', '#a0a0b0', 'important');
              nftsLabel.style.setProperty('text-shadow', 'none', 'important');
            }
          }
          
          // Also try to update using local variables if they exist (fallback)
          if (typeof progressBar !== 'undefined' && progressBar) {
            progressBar.style.width = `${Math.min(percentage, 100)}%`;
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
          }
          
          if (typeof tooltip !== 'undefined' && tooltip) {
            tooltip.textContent = `NFT Collection is ${percentage.toFixed(2)}% Complete.`;
          }
        }
        
        // Update NFT count panel initially (but delay slightly to ensure localStorage is ready)
        setTimeout(() => {
          updateNftCountPanel();
        }, 100);
        
        // Store update function globally for external access
        window.updateNftCountPanel = updateNftCountPanel;
        
        // Also update immediately if element now exists (for cases where it was just created)
        // This ensures the counter shows the correct value right after element creation
        setTimeout(() => {
          updateNftCountPanel();
        }, 200);
        
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
        
        // Update all button states after creating buttons (with delay to ensure all buttons exist)
        setTimeout(() => {
          if (self._updateAllButtonStates) {
            self._updateAllButtonStates();
          }
        }, 100);
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
        <div class="generate-nfts-container" style="position: relative; width: 100%;">
          <div class="nft-preview-title tooltip tooltip-bottom" style="position: absolute !important; top: -40px !important; left: 0 !important; width: 542px !important; text-align: center !important; color: #fff !important; font-size: 1.8rem !important; font-weight: 600 !important; margin: 0 !important; padding: 0 !important; margin-top: 24px !important; line-height: 1.2 !important; display: flex !important; align-items: center !important; justify-content: center !important; height: 2.16rem !important; z-index: 10 !important; visibility: visible !important; opacity: 1 !important; background: transparent !important; background-color: transparent !important; box-sizing: border-box !important; border: none !important; outline: none !important;">
            <span class="nft-preview-title-text" style="cursor: help; display: inline-block; font-size: 1.8rem; font-weight: 600;">Generate NFTs</span>
            <span class="tooltiptext"></span>
            <div class="custom-tooltip-text"></div>
          </div>
          <div class="traits-title tooltip tooltip-bottom" style="position: absolute !important; top: -36px !important; left: 554px !important; width: 220px !important; text-align: center !important; color: #fff !important; font-size: 1.8rem !important; font-weight: 600 !important; margin: 0 !important; padding: 0 !important; margin-top: 24px !important; line-height: 1.2 !important; display: flex !important; align-items: center !important; justify-content: center !important; height: 2.16rem !important; z-index: 10 !important; visibility: visible !important; opacity: 1 !important; background: transparent !important; background-color: transparent !important; box-sizing: border-box !important; border: none !important; outline: none !important; transform: none !important; will-change: auto !important;">
            <span class="traits-title-text" style="cursor: help; display: inline-block; font-size: 1.8rem; font-weight: 600;">NFT Traits</span>
            <span class="tooltiptext"></span>
            <div class="custom-tooltip-text" style="visibility: hidden; opacity: 0; position: absolute; top: calc(100% + 10px); bottom: auto; left: 50%; transform: translateX(-50%); background: #000000; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 400; white-space: normal; z-index: 999999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center; line-height: 1.4; width: 180px; transition: opacity 1s ease, visibility 1s ease;">
              View all traits used in<br>your NFT and change<br>any trait to update<br>the NFT's appearance
            </div>
          </div>
          <div class="generate-nfts-main-row" style="display: flex; flex-direction: row; gap: 12px; align-items: flex-start; width: 100%;">
            <div class="nft-preview-section" style="flex: 0 0 542px; max-width: 542px; min-width: 542px; display: flex; flex-direction: column; gap: 0;">
              <div class="nft-preview-panel" style="display: flex; flex-direction: column; gap: 0;">
                <div class="nft-controls-panel" style="display: flex; flex-direction: column; gap: 0; width: 542px; height: 116px; background: #23232b; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.10); padding: 18px 18px 10px 18px; margin-bottom: 18px; border: 1.5px solid #29293a;">
                  <div class="nft-controls-panel-content" id="nft-controls-panel-content" style="display: flex; flex-direction: column; gap: 0; width: 100%;">
                    <div class="nft-rarity-seed-row"></div>
                    <div class="nft-seedlist-random-row"></div>
                    <div class="nft-seedinput-row"></div>
                  </div>
                </div>
                <div class="nft-preview-image-area" style="width: 542px; height: 542px;"><div id="nft-preview-container"></div></div>
              </div>
            </div>
            <div class="traits-section" style="width: 220px; min-width: 220px; max-width: 220px; display: flex; flex-direction: column; flex: none;">
              <div class="traits-list-card" style="height: 676px; min-height: 676px; max-height: 676px; display: flex; flex-direction: column;">
              <div class="nft-trait-info-panel" style="width: 170px; min-width: 170px; max-width: 170px; height: 697px; min-height: 697px; max-height: 697px; flex: none; margin-left: 0; margin-top: 4px;">
                <ul class="nft-trait-info-list"></ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Titles already have correct styling in HTML to prevent layout shift
      // CSS will apply additional styling but won't cause shifts since inline styles match
      
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
      
      // Update all button states after setup
      setTimeout(() => {
        this._updateAllButtonStates();
      }, 100);
      
      // If no project is loaded, show appropriate messages
      if (!activeProjectData || !activeProjectData.traits || activeProjectData.traits.length === 0) {
        // Show no-project message in preview panel
        this.showNoProjectMessageInPreviewPanel();
        // Show placeholder in traits panel
        this.showTraitsListPlaceholder(activeProjectData);
      } else {
        // Project exists - check if NFT image is actually loaded and displayed
        const previewContainer = document.querySelector('.nft-preview-image-area #nft-preview-container');
        const previewItems = previewContainer ? previewContainer.querySelectorAll('.nft-preview-item') : [];
        const hasNFTDisplayed = previewItems.length > 0;
        
        // Also check if image is loaded
        const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
        const isNFTImageLoaded = previewImage && previewImage.complete && previewImage.naturalWidth > 0;
        
        // CRITICAL: Only show "No Project" message if no NFT is displayed AND no image is loaded
        // If NFT items exist, don't show the message even if image isn't fully loaded yet
        if (!hasNFTDisplayed && !isNFTImageLoaded) {
          // NFT is not rendered yet - show "No Project Loaded" card and placeholder
          this.showNoProjectMessageInPreviewPanel();
          this.showTraitsListPlaceholder(activeProjectData);
        } else {
          // NFT exists or is loading - remove no-project-card if it exists
          const noProjectCard = document.querySelector('.no-project-card');
          if (noProjectCard) {
            noProjectCard.remove();
          }
        }
      }
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
      
      // Update all button states after rendering control rows (with delay to ensure buttons are created)
      setTimeout(() => {
        if (window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI')._updateAllButtonStates) {
          window.NFTApp.getModule('generateNftsUI')._updateAllButtonStates();
        }
      }, 100);
      
      // Update tooltip with dynamic total supply
      window.NFTApp.getModule('generateNftsUI').updateTooltipText(projectData);
      
      // Setup tooltip update listener for total supply changes
      window.NFTApp.getModule('generateNftsUI').setupTooltipUpdateListener();
      
      // Setup tooltip for NFT Traits title
      window.NFTApp.getModule('generateNftsUI').setupNFTTraitsTooltip();
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

  // Show message in preview panel when no project is loaded
  showNoProjectMessageInPreviewPanel: function() {
    // CRITICAL: Never show "No Project" message if an NFT is already displayed
    const previewContainer = document.querySelector('.nft-preview-image-area #nft-preview-container');
    const hasNFTDisplayed = previewContainer && previewContainer.querySelector('.nft-preview-item img');
    if (hasNFTDisplayed) {
      // NFT is displayed - remove any no-project card and return
      const existingCard = document.querySelector('.no-project-card');
      if (existingCard) {
        existingCard.remove();
      }
      return;
    }
    
    // Find the preview panel section
    const previewSection = document.querySelector('.nft-preview-section');
    if (!previewSection) return;
    
    // Remove any existing no-project card
    const existingCard = previewSection.querySelector('.no-project-card');
    if (existingCard) {
      existingCard.remove();
    }
    
    // Create the no-project card with exact same size as NFT preview image area (542px x 542px)
    const noProjectCard = document.createElement('div');
    noProjectCard.className = 'no-project-card';
    noProjectCard.style.cssText = `
      width: 542px;
      height: 542px;
      background: #23232b;
      border: 1.5px solid #29293a;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.10);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 40px;
      color: var(--text-secondary);
      box-sizing: border-box;
      position: absolute;
      top: 0;
      left: 0;
      transform: none;
      z-index: 1;
    `;

    noProjectCard.innerHTML = `
      <div style="transform: translateY(-65px);">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 64px; height: 64px; margin-bottom: 20px; opacity: 0.5;">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
          <polyline points="14 2 14 8 20 8"></polyline>
          <line x1="16" y1="13" x2="8" y2="13"></line>
          <line x1="16" y1="17" x2="8" y2="17"></line>
          <polyline points="10 9 9 9 8 9"></polyline>
        </svg>
        <div style="font-size: 18px; font-weight: 600; margin-bottom: 12px; color: var(--text-primary);">No Project Loaded</div>
        <div style="font-size: 14px; color: var(--text-secondary); line-height: 1.5; max-width: 400px;">
          Please create a new project or load an <br>existing project to start generating NFTs.
        </div>
        <div style="font-size: 13px; color: var(--text-secondary); margin-top: 16px; opacity: 0.8;">
          Go to <strong style="color: var(--text-primary);">Collection Info</strong> to create a new project,<br>
          or use <strong style="color: var(--text-primary);">Load Project</strong> to open an existing one.
        </div>
      </div>
    `;

    // Insert the card inside nft-preview-image-area and center it
    // The action buttons are appended to nft-preview-image-area, so they will appear below
    const previewImageArea = previewSection.querySelector('.nft-preview-image-area');
    if (previewImageArea) {
      // Card positioning is already set in the inline style above
      previewImageArea.appendChild(noProjectCard);
    } else {
      // Fallback: append to preview section
      previewSection.appendChild(noProjectCard);
    }
  },

  // Add this method to show a placeholder in the traits list panel
  showTraitsListPlaceholder: function(projectData) {
    const infoList = document.querySelector('.nft-trait-info-list');
    if (infoList) {
      infoList.innerHTML = `
      <div class="nft-trait-info-list-placeholder" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 732px; min-height: 732px; max-height: 732px; padding: 20px; color: var(--text-secondary); position: relative; overflow: hidden; overflow-y: hidden; overflow-x: hidden; flex-shrink: 0; box-sizing: border-box;">
        <div style="display: block; overflow: hidden; overflow-y: hidden; overflow-x: hidden; position: relative; width: 100%; max-width: 180px; text-align: center;">
          <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"width: 32px; height: 32px; margin: 0 39px 12px 39px; display: block; overflow: hidden; position: relative;\">
            <path d=\"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3\"></path>
          </svg>
          <div style=\"font-size: 15px; font-weight: 500; margin-bottom: 8px; display: block; overflow: hidden; overflow-y: hidden; overflow-x: hidden; white-space: normal; word-wrap: break-word; position: relative; text-align: justify; width: 120px;\">${!projectData || !projectData.traits || projectData.traits.length === 0 ? 'No traits added yet' : 'Traits will appear here'}</div>
          <div style=\"font-size: 13px; line-height: 1.4; display: block; overflow: hidden; overflow-y: hidden; overflow-x: hidden; white-space: normal; word-wrap: break-word; position: relative; text-align: justify; width: 120px;\">${!projectData || !projectData.traits || projectData.traits.length === 0 ? 'Go to the Traits & Rules tab to add trait layers and traits' : 'Click one of the Generate buttons to create an NFT and see its traits'}</div>
        </div>
      </div>
    `;
    // Disable scrolling when placeholder is shown - use !important to override any CSS
    infoList.style.setProperty('overflow', 'hidden', 'important');
    infoList.style.setProperty('overflow-y', 'hidden', 'important');
    infoList.style.setProperty('overflow-x', 'hidden', 'important');
    infoList.style.setProperty('max-height', '732px', 'important');
    infoList.style.setProperty('height', '732px', 'important');
    infoList.style.setProperty('min-height', '732px', 'important');
    infoList.style.setProperty('display', 'block', 'important'); // Block, not flex when placeholder is shown
    infoList.style.setProperty('flex-direction', 'unset', 'important'); // Remove flex-direction when placeholder is shown
    infoList.style.visibility = 'visible';
    infoList.style.opacity = '1';
    
    // Also disable scrolling on parent panel if it exists
    const traitInfoPanel = document.querySelector('.nft-trait-info-panel');
    if (traitInfoPanel) {
      traitInfoPanel.style.setProperty('overflow', 'hidden', 'important');
      traitInfoPanel.style.setProperty('overflow-y', 'hidden', 'important');
      traitInfoPanel.style.setProperty('overflow-x', 'hidden', 'important');
    }
    
    // CRITICAL: Ensure placeholder content (text and icon) are never scrollable
    const placeholder = infoList.querySelector('.nft-trait-info-list-placeholder');
    if (placeholder) {
      // Disable scrolling on placeholder itself
      placeholder.style.setProperty('overflow', 'hidden', 'important');
      placeholder.style.setProperty('overflow-y', 'hidden', 'important');
      placeholder.style.setProperty('overflow-x', 'hidden', 'important');
      
      // Disable scrolling on all child elements (text and icon) and ensure proper alignment
      const placeholderChildren = placeholder.querySelectorAll('*');
      placeholderChildren.forEach(child => {
        child.style.setProperty('overflow', 'hidden', 'important');
        child.style.setProperty('overflow-y', 'hidden', 'important');
        child.style.setProperty('overflow-x', 'hidden', 'important');
        child.style.setProperty('flex-shrink', '0', 'important');
        child.style.setProperty('position', 'relative', 'important');
        
        // Apply text-align: justify to text divs (not SVG)
        if (child.tagName === 'DIV' && !child.querySelector('svg')) {
          child.style.setProperty('text-align', 'justify', 'important');
        }
      });
      
      // Ensure icon has correct margins
      const icon = placeholder.querySelector('svg');
      if (icon) {
        icon.style.setProperty('margin-left', '39px', 'important');
        icon.style.setProperty('margin-right', '39px', 'important');
        icon.style.setProperty('display', 'block', 'important');
      }
    }
      setTimeout(() => this.syncCardHeights && this.syncCardHeights(), 100);
    }
  },

  // Show loading message in the NFT preview panel
  showLoadingMessageInPreviewPanel: function(message) {
    const previewPanelElem = document.querySelector('.nft-preview-image-area');
    if (!previewPanelElem) return;
    
    let previewContainer = previewPanelElem.querySelector('#nft-preview-container');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'nft-preview-container';
      previewContainer.style.position = 'relative';
      previewContainer.style.width = '100%';
      previewContainer.style.height = '100%';
      previewPanelElem.appendChild(previewContainer);
    }
    
    // CRITICAL: Don't clear existing NFT content if there's already an NFT displayed
    // Only clear if there's no NFT currently displayed (just placeholder messages)
    const existingNFT = previewContainer.querySelector('.nft-preview-item');
    if (existingNFT) {
      // NFT is already displayed - don't clear it, just return
      console.log('[DEBUG] showLoadingMessageInPreviewPanel: NFT already displayed, skipping clear');
      return;
    }
    
    // Clear existing content only if no NFT is present
    previewContainer.innerHTML = '';
    
    // Create loading placeholder
    const placeholder = document.createElement('div');
    placeholder.className = 'nft-preview-placeholder';
    placeholder.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 20px;
      color: var(--text-secondary);
      z-index: 10;
      box-sizing: border-box;
    `;
    
    placeholder.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 48px; height: 48px; margin-bottom: 16px; animation: spin 1s linear infinite;">
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 6v6l4 2"></path>
      </svg>
      <div style="font-size: 16px; font-weight: 500; margin-bottom: 8px; color: var(--text-primary);">${message}</div>
      <div style="font-size: 13px; color: var(--text-secondary);">This may take a few moments...</div>
    `;
    
    // Add spin animation if not already in stylesheet
    if (!document.querySelector('#nft-loading-spin-animation')) {
      const style = document.createElement('style');
      style.id = 'nft-loading-spin-animation';
      style.textContent = `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    previewContainer.appendChild(placeholder);
  },

  // Render empty trait cards based on projectData.traits
  renderEmptyTraitCards: function(projectData) {
    if (!projectData || !projectData.traits || projectData.traits.length === 0) {
      this.showTraitsListPlaceholder(projectData);
      return;
    }
    
    // Remove no-project-card if it exists (project is now loaded)
    const noProjectCard = document.querySelector('.no-project-card');
    if (noProjectCard) {
      noProjectCard.remove();
    }
    
    const infoList = document.querySelector('.nft-trait-info-list');
    if (!infoList) return;
    
    // Clear existing content
    const placeholders = infoList.querySelectorAll('.nft-trait-info-list-placeholder');
    placeholders.forEach(ph => ph.remove());
    infoList.innerHTML = '';
    
    const traitItemsContainer = document.createElement('div');
    traitItemsContainer.className = 'nft-trait-info-items';
    traitItemsContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
      width: 100%;
      padding: 0;
    `;
    
    // Create empty trait cards for each layer
    projectData.traits.forEach((layer, layerIndex) => {
      const traitCard = document.createElement('div');
      traitCard.className = 'nft-trait-card';
      traitCard.style.cssText = `
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-start;
        width: 141px;
        min-width: 141px;
        max-width: 141px;
        margin: 0 auto;
        position: relative;
      `;
      
      // Empty thumbnail container
      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'dark-trait-thumb';
      thumbContainer.style.cssText = `
        width: 141px;
        height: 165px;
        background: rgba(255, 255, 255, 0.05);
        border: 2px dashed rgba(255, 255, 255, 0.1);
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        flex-shrink: 0;
      `;
      
      // Empty thumbnail placeholder
      const emptyPlaceholder = document.createElement('div');
      emptyPlaceholder.style.cssText = `
        color: rgba(255, 255, 255, 0.3);
        font-size: 12px;
        text-align: center;
      `;
      emptyPlaceholder.textContent = '—';
      thumbContainer.appendChild(emptyPlaceholder);
      
      // Info container
      const infoContainer = document.createElement('div');
      infoContainer.className = 'nft-trait-info-below';
      infoContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        width: 100%;
        margin-top: 6px;
        gap: 0;
      `;
      
      // Trait name (empty)
      const traitNameElem = document.createElement('div');
      traitNameElem.className = 'nft-trait-info-trait-name';
      traitNameElem.style.cssText = `
        color: rgba(255, 255, 255, 0.4);
        font-size: 13px;
      `;
      traitNameElem.textContent = '—';
      
      // Bottom line with layer name
      const bottomLine = document.createElement('div');
      bottomLine.className = 'nft-trait-info-bottom-line';
      bottomLine.style.cssText = `
        display: flex;
        flex-direction: row;
        justify-content: flex-start;
        align-items: center;
      `;
      
      const layerNameElem = document.createElement('div');
      layerNameElem.className = 'nft-trait-info-layer-name';
      const layerName = layer.name || 'Unknown';
      layerNameElem.textContent = layerName.length > 21 ? layerName.slice(0, 21) + '...' : layerName;
      if (layerName.length > 21) {
        // Remove title and add custom tooltip
        layerNameElem.removeAttribute('title');
        layerNameElem.classList.add('tooltip');
        let layerTooltip = layerNameElem.querySelector('.tooltiptext');
        if (!layerTooltip) {
          layerTooltip = document.createElement('span');
          layerTooltip.className = 'tooltiptext';
          layerNameElem.appendChild(layerTooltip);
        }
        layerTooltip.textContent = layerName;
      } else {
        layerNameElem.removeAttribute('title');
      }
      bottomLine.appendChild(layerNameElem);
      
      infoContainer.appendChild(traitNameElem);
      infoContainer.appendChild(bottomLine);
      
      traitCard.appendChild(thumbContainer);
      traitCard.appendChild(infoContainer);
      
      traitItemsContainer.appendChild(traitCard);
    });
    
    infoList.appendChild(traitItemsContainer);
    infoList.style.overflowY = 'auto';
    infoList.style.maxHeight = '100%';
    infoList.style.height = 'calc(100% - 50px)';
    infoList.style.display = 'flex';
    infoList.style.visibility = 'visible';
    infoList.style.opacity = '1';
    
    setTimeout(() => this.syncCardHeights && this.syncCardHeights(), 100);
  },

  // Helper function to check if project meets minimum requirements (2 layers, 1 trait each)
  _hasMinimumRequirements: function(projectData) {
    if (!projectData || !projectData.traits || !Array.isArray(projectData.traits)) {
      return false;
    }
    
    if (projectData.traits.length < 2) {
      return false;
    }
    
    let layersWithTraits = 0;
    projectData.traits.forEach(layer => {
      if (layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0) {
        layersWithTraits++;
      }
    });
    
    return layersWithTraits >= 2;
  },

  // Helper function to apply disabled/greyed out styles to buttons
  _applyDisabledStyles: function(element) {
    if (!element) return;
    // Use !important to override any inline styles
    element.style.setProperty('background-color', '#23232b', 'important');
    element.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
    element.style.setProperty('cursor', 'not-allowed', 'important');
    element.style.setProperty('opacity', '0.6', 'important');
    element.style.setProperty('border-color', 'transparent', 'important'); // Remove border when disabled
    element.style.setProperty('border', 'none', 'important'); // Remove border completely when disabled
    element.disabled = true;
    element.setAttribute('disabled', 'disabled');
    // Prevent pointer events
    element.style.pointerEvents = 'none';
  },

  // Helper function to remove disabled styles from buttons
  _removeDisabledStyles: function(element, originalStyles) {
    if (!element) return;
    if (originalStyles) {
      Object.keys(originalStyles).forEach(key => {
        element.style[key] = originalStyles[key];
      });
    }
    element.disabled = false;
    element.removeAttribute('disabled');
    element.style.opacity = '1';
    element.style.cursor = 'pointer';
  },

  // Helper function to ensure all buttons stay greyed out (used when popup is showing)
  _ensureButtonsGreyedOut: function() {
    // Grey out ALL buttons in nft-action-buttons-container
    const buttonsContainer = document.querySelector('.nft-action-buttons-container');
    if (buttonsContainer) {
      const allButtons = buttonsContainer.querySelectorAll('.nft-action-btn, button');
      allButtons.forEach(btn => {
        btn.style.setProperty('background-color', '#23232b', 'important');
        btn.style.setProperty('border-color', 'transparent', 'important');
        btn.style.setProperty('color', '#a0a0b0', 'important');
        btn.style.setProperty('opacity', '0.6', 'important');
        btn.style.setProperty('cursor', 'not-allowed', 'important');
        btn.style.setProperty('box-shadow', 'none', 'important');
        btn.style.setProperty('border', 'none', 'important');
        btn.disabled = true;
        btn.setAttribute('disabled', 'disabled');
      });
    }
    
    // Grey out specific buttons by ID
    const createNftBtn = document.getElementById('nft-action-create-btn');
    if (createNftBtn) {
      createNftBtn.style.setProperty('background-color', '#23232b', 'important');
      createNftBtn.style.setProperty('border-color', 'transparent', 'important');
      createNftBtn.style.setProperty('color', '#a0a0b0', 'important');
      createNftBtn.style.setProperty('opacity', '0.6', 'important');
      createNftBtn.style.setProperty('cursor', 'not-allowed', 'important');
      createNftBtn.style.setProperty('box-shadow', 'none', 'important');
      createNftBtn.style.setProperty('border', 'none', 'important');
      createNftBtn.disabled = true;
      createNftBtn.setAttribute('disabled', 'disabled');
    }
    
    const bulkGenerationBtn = document.getElementById('nft-action-bulk-btn');
    if (bulkGenerationBtn) {
      bulkGenerationBtn.style.setProperty('background-color', '#23232b', 'important');
      bulkGenerationBtn.style.setProperty('border-color', 'transparent', 'important');
      bulkGenerationBtn.style.setProperty('color', '#a0a0b0', 'important');
      bulkGenerationBtn.style.setProperty('opacity', '0.6', 'important');
      bulkGenerationBtn.style.setProperty('cursor', 'not-allowed', 'important');
      bulkGenerationBtn.style.setProperty('box-shadow', 'none', 'important');
      bulkGenerationBtn.style.setProperty('border', 'none', 'important');
      bulkGenerationBtn.disabled = true;
      bulkGenerationBtn.setAttribute('disabled', 'disabled');
    }
    
    const generateSeedBtn = document.getElementById('generate-seed-nft-btn');
    if (generateSeedBtn) {
      generateSeedBtn.style.setProperty('background-color', '#23232b', 'important');
      generateSeedBtn.style.setProperty('border-color', 'transparent', 'important');
      generateSeedBtn.style.setProperty('color', '#a0a0b0', 'important');
      generateSeedBtn.style.setProperty('opacity', '0.6', 'important');
      generateSeedBtn.style.setProperty('cursor', 'not-allowed', 'important');
      generateSeedBtn.style.setProperty('box-shadow', 'none', 'important');
      generateSeedBtn.style.setProperty('border', 'none', 'important');
      generateSeedBtn.disabled = true;
      generateSeedBtn.setAttribute('disabled', 'disabled');
    }
    
    // Grey out Dark NFTs button
    const darkNftsBtn = document.getElementById('generate-dark-nfts');
    if (darkNftsBtn) {
      darkNftsBtn.style.setProperty('background-color', '#23232b', 'important');
      darkNftsBtn.style.setProperty('border-color', '#4a4a4a', 'important');
      darkNftsBtn.style.setProperty('color', '#a0a0b0', 'important');
      darkNftsBtn.style.setProperty('opacity', '0.6', 'important');
      darkNftsBtn.style.setProperty('cursor', 'not-allowed', 'important');
      darkNftsBtn.disabled = true;
      darkNftsBtn.setAttribute('disabled', 'disabled');
    }
    
    // Grey out Seed NFT button
    const seedToggleBtn = document.getElementById('single-seed-toggle');
    if (seedToggleBtn) {
      seedToggleBtn.style.setProperty('background-color', '#23232b', 'important');
      seedToggleBtn.style.setProperty('border-color', '#84a0b0', 'important');
      seedToggleBtn.style.setProperty('color', '#a0a0b0', 'important');
      seedToggleBtn.style.setProperty('opacity', '0.6', 'important');
      seedToggleBtn.style.setProperty('cursor', 'not-allowed', 'important');
      seedToggleBtn.disabled = true;
      seedToggleBtn.setAttribute('disabled', 'disabled');
    }
    
    // Grey out "Seed:" label
    const seedLabel = document.querySelector('.seed-label');
    if (seedLabel) {
      seedLabel.style.color = '#a0a0b0';
    }
    
    // Grey out seed box
    const seedBox = document.querySelector('.nft-seed-box');
    if (seedBox) {
      seedBox.style.color = '#84a0b0';
    }
  },

  // Update all button states based on requirements and NFT status
  _updateAllButtonStates: function() {
    // CRITICAL: Don't update if popup is still showing - wait until it closes
    // Check both in tab and body since popup can be in either location
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    // Also check for "Please Wait" popup
    const pleaseWaitPopup = document.getElementById('nft-edit-please-wait-popup');
    const isPopupShowing = popup || pleaseWaitPopup;
    
    if (isPopupShowing) {
      console.log('[DEBUG] _updateAllButtonStates: Popup is still showing, skipping update');
      // CRITICAL: Ensure all buttons stay greyed out while popup is showing
      this._ensureButtonsGreyedOut();
      return; // Don't update while popup is visible - buttons should stay greyed out
    }
    
    const projectData = this.projectData || window.currentProject;
    const hasMinimumRequirements = this._hasMinimumRequirements(projectData);
    const hasNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
    
    // CRITICAL: Check if NFT image is actually loaded and displayed in preview panel
    // Content should stay greyed out until NFT image is fully rendered
    const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
    // For data URIs, consider them loaded if the image element exists and has a src
    const isDataURI = previewImage && previewImage.src && previewImage.src.startsWith('data:');
    const isNFTImageLoaded = previewImage && (
      (previewImage.complete && previewImage.naturalWidth > 0) || 
      isDataURI ||
      (previewImage.src && previewImage.src !== '')
    );
    
    // Only enable content if BOTH: minimum requirements exist AND NFT image is displayed
    const shouldEnableContent = hasMinimumRequirements && hasNFT && isNFTImageLoaded;
    
    console.log('[DEBUG] _updateAllButtonStates called', {
      hasProjectData: !!projectData,
      hasMinimumRequirements,
      hasNFT,
      isNFTImageLoaded,
      shouldEnableContent,
      projectDataTraits: projectData?.traits?.length || 0
    });
    
      // Update seed display
      const seedBox = document.querySelector('.nft-seed-box');
      if (seedBox) {
        if (!hasNFT) {
          seedBox.textContent = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
          seedBox.style.color = '#a0a0b0'; // Match placeholder color (var(--text-secondary))
      } else {
        if (projectData) {
          const deterministicSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, window.lastGeneratedNFT);
          seedBox.textContent = deterministicSeed;
        }
        seedBox.style.color = '#fff';
      }
    }
    
      // Update copy button
      const copyBtn = document.querySelector('.nft-seed-copy-btn');
      if (copyBtn) {
        // Clear any pending timeout from previous copy action
        if (copyBtn.dataset.copyTimeoutId) {
          clearTimeout(parseInt(copyBtn.dataset.copyTimeoutId));
          delete copyBtn.dataset.copyTimeoutId;
        }
        const copyTooltipText = copyBtn.querySelector('.tooltiptext');
        if (!shouldEnableContent) {
          copyBtn.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
          copyBtn.style.cursor = 'not-allowed';
          copyBtn.removeAttribute('disabled'); // Remove disabled to allow clicks
          if (copyTooltipText) {
            copyTooltipText.textContent = 'No NFT generated yet';
          }
        } else {
          // Immediately set blue color when enabled
          copyBtn.style.setProperty('color', '#007bff', 'important');
          copyBtn.style.cursor = 'pointer';
          copyBtn.removeAttribute('disabled');
          if (copyTooltipText) {
            copyTooltipText.textContent = 'copy the NFT seed number';
          }
        }
      }
      
      // Update Generate Seed button
      // CRITICAL: Generate Seed button only needs minimum requirements (2 layers with 1 trait each)
      // It doesn't need an existing NFT because it's meant to GENERATE one with a seed
      const generateSeedBtn = document.getElementById('generate-seed-nft-btn');
      if (generateSeedBtn) {
        // CRITICAL: Check if popup is showing - if so, keep button greyed out
        const generateNftsTab = document.getElementById('generate-nfts');
        let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
        if (!popup) {
          popup = document.querySelector('.nft-rendering-popup');
        }
        const isPopupShowing = !!popup;
        
        if (isPopupShowing || !hasMinimumRequirements) {
          // Disable if popup is showing OR minimum requirements not met
          // Apply disabled styles but override border to grey
          generateSeedBtn.style.setProperty('background-color', '#23232b', 'important');
          generateSeedBtn.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
          generateSeedBtn.style.setProperty('cursor', 'not-allowed', 'important');
          generateSeedBtn.style.setProperty('opacity', '0.6', 'important');
          generateSeedBtn.style.setProperty('border', '1px solid #84a0b0', 'important'); // Grey border when disabled
          generateSeedBtn.style.setProperty('border-color', '#84a0b0', 'important'); // Ensure grey border color
          generateSeedBtn.style.pointerEvents = 'none';
          generateSeedBtn.disabled = true;
          generateSeedBtn.setAttribute('disabled', 'disabled');
        } else {
          // Enable if minimum requirements are met (regardless of existing NFT) AND popup is not showing
          generateSeedBtn.style.setProperty('border', '1px solid #007bff', 'important'); // Blue border when active
          generateSeedBtn.style.setProperty('border-color', '#007bff', 'important'); // Ensure blue border color
          generateSeedBtn.style.background = '#007bff';
          generateSeedBtn.style.color = '#fff';
          generateSeedBtn.disabled = false;
          generateSeedBtn.removeAttribute('disabled');
          generateSeedBtn.style.opacity = '1';
          generateSeedBtn.style.cursor = 'pointer';
        }
      }
      
      // Update Seed NFT toggle
      // CRITICAL: Seed NFT toggle only needs minimum requirements (2 layers with 1 trait each)
      // It doesn't need an existing NFT because it's meant to GENERATE one with a seed
      const seedToggleBtn = document.getElementById('single-seed-toggle');
      if (seedToggleBtn) {
        if (!hasMinimumRequirements) {
          // Disable if minimum requirements not met
          seedToggleBtn.style.backgroundColor = '#23232b';
          seedToggleBtn.style.color = '#a0a0b0'; // Match placeholder color (var(--text-secondary))
          seedToggleBtn.style.borderColor = '#84a0b0';
          seedToggleBtn.style.cursor = 'not-allowed';
          seedToggleBtn.style.opacity = '0.6';
          seedToggleBtn.disabled = true;
          seedToggleBtn.setAttribute('disabled', 'disabled');
        } else {
          // Enable if minimum requirements are met (regardless of existing NFT)
          seedToggleBtn.style.backgroundColor = '#2a2a2a';
          seedToggleBtn.style.color = '#ffffff';
          seedToggleBtn.style.borderColor = '#4a4a4a';
          seedToggleBtn.style.cursor = 'pointer';
          seedToggleBtn.style.opacity = '1';
          seedToggleBtn.disabled = false;
          seedToggleBtn.removeAttribute('disabled');
        }
      }
      
      // Update Dark NFTs button
      const darkNftsBtn = document.getElementById('generate-dark-nfts');
      if (darkNftsBtn) {
        if (!shouldEnableContent) {
          darkNftsBtn.style.backgroundColor = '#23232b';
          darkNftsBtn.style.color = '#a0a0b0'; // Match placeholder color (var(--text-secondary))
          darkNftsBtn.style.borderColor = '#84a0b0';
          darkNftsBtn.style.cursor = 'default';
          darkNftsBtn.style.opacity = '0.6';
          darkNftsBtn.disabled = true;
          // CRITICAL: Hide edit button when Dark NFTs button is disabled/greyed out
          const editBtn = document.getElementById('dark-traits-edit-btn');
          if (editBtn) {
            editBtn.style.opacity = '0';
            editBtn.style.visibility = 'hidden';
            editBtn.style.pointerEvents = 'none';
            editBtn.style.display = 'none';
          }
        } else {
          darkNftsBtn.style.backgroundColor = '#2a2a2a';
          darkNftsBtn.style.color = '#ffffff';
          darkNftsBtn.style.borderColor = '#4a4a4a';
          darkNftsBtn.style.cursor = 'pointer';
          darkNftsBtn.style.opacity = '1';
          darkNftsBtn.disabled = false;
          darkNftsBtn.removeAttribute('disabled');
          // Edit button visibility will be controlled by active state (only show if Dark NFTs is active)
          const editBtn = document.getElementById('dark-traits-edit-btn');
          if (editBtn) {
            const isDarkActive = darkNftsBtn.classList.contains('active');
            if (isDarkActive) {
              // Show if Dark NFTs is active
              editBtn.style.setProperty('visibility', 'visible', 'important');
              editBtn.style.setProperty('pointer-events', 'auto', 'important');
              editBtn.style.setProperty('display', 'flex', 'important');
              setTimeout(() => editBtn.style.setProperty('opacity', '1', 'important'), 10);
            } else {
              // Hide if Dark NFTs is not active
              editBtn.style.setProperty('opacity', '0', 'important');
              editBtn.style.setProperty('visibility', 'hidden', 'important');
              editBtn.style.setProperty('pointer-events', 'none', 'important');
              editBtn.style.setProperty('display', 'none', 'important');
            }
          }
        }
      }
      
      // Update Create NFT button - can create NFT even if none displayed yet
      // Note: If popup is showing, we already returned early, so buttons stay greyed out
      // CRITICAL: Start greyed out if no NFT exists yet (even if requirements are met)
      // This ensures the button doesn't show green on initial project load
      const createNftBtn = document.getElementById('nft-action-create-btn');
      if (createNftBtn) {
        if (!hasMinimumRequirements || !hasNFT) {
          console.log('[DEBUG] Disabling Create NFT button - requirements:', hasMinimumRequirements, 'hasNFT:', hasNFT);
          this._applyDisabledStyles(createNftBtn);
          // Border is already removed by _applyDisabledStyles
          createNftBtn.disabled = true;
          createNftBtn.setAttribute('disabled', 'disabled');
        } else {
          console.log('[DEBUG] Enabling Create NFT button');
          // Check if Dark NFTs is active - if so, apply dark mode styling
          const darkNftsBtn = document.getElementById('generate-dark-nfts');
          const isDarkActive = darkNftsBtn && darkNftsBtn.classList.contains('active');
          
          if (isDarkActive) {
            // Apply Dark NFTs background color and halo effect, but preserve original text color and size
            createNftBtn.style.setProperty('background-color', '#00ff88', 'important');
            createNftBtn.style.setProperty('border', '2px solid #00ff88', 'important');
            createNftBtn.style.setProperty('border-color', '#00ff88', 'important');
            createNftBtn.style.setProperty('box-shadow', 'inset 0 3px 5px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)', 'important');
            // Preserve original text color and properties
            createNftBtn.style.setProperty('color', '#ffffff', 'important');
            createNftBtn.style.setProperty('font-weight', 'bold', 'important');
            createNftBtn.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
            createNftBtn.classList.add('dark-mode-active');
          } else {
            // Apply default styling
            createNftBtn.style.setProperty('background-color', '#047857', 'important');
            createNftBtn.style.setProperty('border', '2px solid #047857', 'important'); // Restore border when active
            createNftBtn.style.setProperty('border-color', '#047857', 'important');
            createNftBtn.style.setProperty('color', '#ffffff', 'important');
            createNftBtn.style.setProperty('box-shadow', '', 'important');
            createNftBtn.classList.remove('dark-mode-active');
          }
          createNftBtn.style.setProperty('cursor', 'pointer', 'important');
          createNftBtn.style.setProperty('opacity', '1', 'important');
          createNftBtn.style.pointerEvents = 'auto';
          createNftBtn.disabled = false;
          createNftBtn.removeAttribute('disabled');
        }
      } else {
        console.log('[DEBUG] Create NFT button not found');
      }
      
      // Update Add to Collection button - requires NFT to be displayed
      const addToCollectionBtn = document.getElementById('nft-action-add-btn');
      if (addToCollectionBtn) {
        if (!shouldEnableContent) {
          this._applyDisabledStyles(addToCollectionBtn);
          // Border is already removed by _applyDisabledStyles
          addToCollectionBtn.disabled = true;
          addToCollectionBtn.setAttribute('disabled', 'disabled');
        } else {
          addToCollectionBtn.style.setProperty('background-color', '#1e40af', 'important');
          addToCollectionBtn.style.setProperty('border', '2px solid #1e40af', 'important'); // Restore border when active
          addToCollectionBtn.style.setProperty('border-color', '#1e40af', 'important');
          addToCollectionBtn.style.setProperty('color', '#ffffff', 'important');
          addToCollectionBtn.style.setProperty('cursor', 'pointer', 'important');
          addToCollectionBtn.style.setProperty('opacity', '1', 'important');
          addToCollectionBtn.style.pointerEvents = 'auto';
          addToCollectionBtn.disabled = false;
          addToCollectionBtn.removeAttribute('disabled');
        }
      }
      
      // Update Bulk Generation button - requires NFT to be displayed
      // Note: If popup is showing, we already returned early, so buttons stay greyed out
      const bulkGenerationBtn = document.getElementById('nft-action-bulk-btn');
      if (bulkGenerationBtn) {
        if (!shouldEnableContent) {
          this._applyDisabledStyles(bulkGenerationBtn);
          // Border is already removed by _applyDisabledStyles
          bulkGenerationBtn.disabled = true;
          bulkGenerationBtn.setAttribute('disabled', 'disabled');
        } else {
          bulkGenerationBtn.style.setProperty('background-color', '#ea580c', 'important');
          bulkGenerationBtn.style.setProperty('border', '2px solid #ea580c', 'important'); // Restore border when active
          bulkGenerationBtn.style.setProperty('border-color', '#ea580c', 'important');
          bulkGenerationBtn.style.setProperty('color', '#ffffff', 'important');
          bulkGenerationBtn.style.setProperty('cursor', 'pointer', 'important');
          bulkGenerationBtn.style.setProperty('opacity', '1', 'important');
          bulkGenerationBtn.style.pointerEvents = 'auto';
          bulkGenerationBtn.disabled = false;
          bulkGenerationBtn.removeAttribute('disabled');
        }
      }
      
      // Update Edit Collection button - requires NFT to be displayed
      const editCollectionBtn = document.getElementById('nft-action-edit-btn');
      if (editCollectionBtn) {
        if (!shouldEnableContent) {
          this._applyDisabledStyles(editCollectionBtn);
          editCollectionBtn.style.border = '2px solid #84a0b0';
          editCollectionBtn.disabled = true;
          editCollectionBtn.setAttribute('disabled', 'disabled');
        } else {
          editCollectionBtn.style.setProperty('background-color', '#dc2626', 'important');
          editCollectionBtn.style.setProperty('border-color', '#dc2626', 'important');
          editCollectionBtn.style.setProperty('color', '#ffffff', 'important');
          editCollectionBtn.style.setProperty('cursor', 'pointer', 'important');
          editCollectionBtn.style.setProperty('opacity', '1', 'important');
          editCollectionBtn.style.pointerEvents = 'auto';
          editCollectionBtn.disabled = false;
          editCollectionBtn.removeAttribute('disabled');
        }
      }
      
      // Update NFT count container
      const nftCountPanel = document.getElementById('nft-count-panel');
      if (nftCountPanel) {
        if (!shouldEnableContent) {
          nftCountPanel.style.backgroundColor = '#23232b';
          nftCountPanel.style.borderColor = '#84a0b0';
        } else {
          nftCountPanel.style.backgroundColor = '#000000';
          nftCountPanel.style.borderColor = '#8b5cf6';
        }
      }
      
      // Update nft-count-container styling
      const nftCountContainer = document.querySelector('.nft-count-container');
      if (nftCountContainer) {
        // Always ensure border-radius is set to match the panel
        nftCountContainer.style.setProperty('border-radius', '8px', 'important');
        if (!shouldEnableContent) {
          nftCountContainer.style.setProperty('opacity', '0.6', 'important');
          nftCountContainer.style.setProperty('background-color', '#23232b', 'important'); /* Grey background when inactive */
        } else {
          nftCountContainer.style.setProperty('opacity', '1', 'important');
          nftCountContainer.style.setProperty('background-color', 'transparent', 'important'); /* Transparent when active */
        }
      }
      
      const nftCountText = document.querySelector('.nft-count-text');
      if (nftCountText) {
        if (!shouldEnableContent) {
          nftCountText.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
          nftCountText.style.setProperty('text-shadow', 'none', 'important');
        } else {
          nftCountText.style.setProperty('color', '#ffffff', 'important');
          nftCountText.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
        }
      }
      
      const nftsLabel = nftCountPanel ? nftCountPanel.querySelector('div:last-child') : null;
      if (nftsLabel && nftsLabel.textContent === 'NFTs') {
        if (!shouldEnableContent) {
          nftsLabel.style.setProperty('color', '#a0a0b0', 'important'); // Match placeholder color (var(--text-secondary))
          nftsLabel.style.setProperty('text-shadow', 'none', 'important');
        } else {
          nftsLabel.style.setProperty('color', '#ffffff', 'important');
          nftsLabel.style.setProperty('text-shadow', '2px 2px 0 #000000', 'important');
        }
      }
  },

  // Move all the control row rendering logic into a new _renderControlRows(projectData) method on the module
  _renderControlRows: function(projectData) {
    // Store reference to this module for use in event listeners
    const self = this;
    
    // Check if minimum requirements are met
    const hasMinimumRequirements = this._hasMinimumRequirements(projectData);
    const hasNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
    
    // 1. Container 2: Dark NFTs button, Seed label, number, copy button (all in one row)
    const parentContainer = document.querySelector('.nft-seed-controls-parent');
    const raritySeedRow = parentContainer ? parentContainer.querySelector('.nft-rarity-seed-row') : document.querySelector('.nft-rarity-seed-row');
    if (raritySeedRow) {
      // Set up rarity seed row as Container 2: flex row with 496px width and 32px height
      raritySeedRow.style.display = 'flex';
      raritySeedRow.style.flexDirection = 'row';
      raritySeedRow.style.alignItems = 'center';
      raritySeedRow.style.gap = '8px';
      raritySeedRow.style.width = '496px';
      raritySeedRow.style.height = '32px';
      raritySeedRow.style.margin = '0';
      raritySeedRow.style.padding = '0';
      
      // Clear existing content but preserve Dark NFTs button if it exists
      const existingDarkNftsBtn = raritySeedRow.querySelector('#generate-dark-nfts');
      const existingSeedDisplay = raritySeedRow.querySelector('.seed-display-container');
      
      // Clear all children except Dark NFTs button
      const childrenToRemove = [];
      for (let child of raritySeedRow.children) {
        if (child.id !== 'generate-dark-nfts' && !child.querySelector('#generate-dark-nfts')) {
          childrenToRemove.push(child);
        }
      }
      childrenToRemove.forEach(child => child.remove());
      
      // Create seed display container (will contain Seed:, seed number, copy button)
      const rowFlex = document.createElement('div');
      rowFlex.className = 'seed-display-container';
      rowFlex.id = 'seed-display-container';
      rowFlex.style.display = 'flex';
      rowFlex.style.alignItems = 'center';
      rowFlex.style.justifyContent = 'flex-end';
      rowFlex.style.gap = '0px';
      rowFlex.style.flex = '1'; // Take remaining space after Dark NFTs button
      rowFlex.style.height = '32px';
      rowFlex.style.background = 'none';
      rowFlex.style.padding = '0';
      rowFlex.style.margin = '0';
      rowFlex.style.minWidth = '0'; // Allow flex shrinking
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
      if (hasNFT && projectData) {
        deterministicSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, window.lastGeneratedNFT);
      } else {
        // Show greyed out placeholder when no NFT
        deterministicSeed = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx';
      }
      seedBox.textContent = deterministicSeed;
      
      // CRITICAL: Check if "Please Wait" popup is showing - keep grey during popup
      const generateNftsTab = document.getElementById('generate-nfts');
      let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
      if (!popup) {
        popup = document.querySelector('.nft-rendering-popup');
      }
      // Also check for "Please Wait" popup
      const pleaseWaitPopup = document.getElementById('nft-edit-please-wait-popup');
      const isPopupShowing = popup || pleaseWaitPopup;
      
      // Apply greyed out style to seed box and seed label when no NFT OR when popup is showing
      if (!hasNFT || isPopupShowing) {
        seedBox.style.color = '#84a0b0';
        seedLabel.style.color = '#a0a0b0'; // Match Dark NFTs button text color when greyed out
      } else {
        seedBox.style.color = '#fff';
        seedLabel.style.color = '#fff'; // White when enabled
      }
      
      const copyBtn = document.createElement('button');
      copyBtn.className = 'nft-seed-copy-btn tooltip';
      copyBtn.style.background = 'none';
      copyBtn.style.border = 'none';
      copyBtn.style.outline = 'none';
      copyBtn.style.padding = '0';
      copyBtn.style.marginLeft = '2px';
      copyBtn.style.fontSize = '18px';
      copyBtn.style.fontWeight = 'bold';
      
      // Create custom tooltip
      const copyTooltipText = document.createElement('span');
      copyTooltipText.className = 'tooltiptext';
      copyTooltipText.textContent = 'copy the NFT seed number';
      // Set tooltip styling: black background, white text, high z-index
      copyTooltipText.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
      copyTooltipText.style.background = 'rgba(0, 0, 0, 0.9)';
      copyTooltipText.style.color = '#ffffff';
      copyTooltipText.style.zIndex = '2147483647';
      copyTooltipText.style.borderRadius = '6px';
      copyTooltipText.style.padding = '8px 10px';
      copyTooltipText.style.boxShadow = '0 3px 10px rgba(0, 0, 0, 0.5)';
      copyTooltipText.style.position = 'fixed';
      copyTooltipText.style.visibility = 'hidden';
      copyTooltipText.style.opacity = '0';
      copyTooltipText.style.pointerEvents = 'none';
      copyTooltipText.style.transition = 'opacity 1s';
      copyBtn.appendChild(copyTooltipText);
      
      // Position tooltip on hover
      copyBtn.addEventListener('mouseenter', function() {
        const rect = copyBtn.getBoundingClientRect();
        const tooltipRect = copyTooltipText.getBoundingClientRect();
        // Position tooltip above the button
        const top = rect.top - tooltipRect.height - 8; // 8px gap above button
        const left = rect.left + (rect.width / 2); // Center horizontally
        copyTooltipText.style.top = `${top}px`;
        copyTooltipText.style.left = `${left}px`;
        copyTooltipText.style.transform = 'translateX(-50%)';
        copyTooltipText.style.visibility = 'visible';
        copyTooltipText.style.opacity = '1';
      });
      
      copyBtn.addEventListener('mouseleave', function() {
        copyTooltipText.style.visibility = 'hidden';
        copyTooltipText.style.opacity = '0';
      });
      
      // Grey out copy button when no NFT or requirements not met (but don't disable it)
      if (!hasNFT || !hasMinimumRequirements) {
        // Clear any pending timeout from previous copy action
        if (copyBtn.dataset.copyTimeoutId) {
          clearTimeout(parseInt(copyBtn.dataset.copyTimeoutId));
          delete copyBtn.dataset.copyTimeoutId;
        }
        copyBtn.style.color = '#a0a0b0'; // Match placeholder color (var(--text-secondary))
        copyBtn.style.cursor = 'not-allowed';
        copyBtn.removeAttribute('disabled'); // Remove disabled to allow clicks
        copyTooltipText.textContent = 'No NFT generated yet';
      } else {
        // Clear any pending timeout from previous copy action
        if (copyBtn.dataset.copyTimeoutId) {
          clearTimeout(parseInt(copyBtn.dataset.copyTimeoutId));
          delete copyBtn.dataset.copyTimeoutId;
        }
        // Immediately set blue color when enabled
        copyBtn.style.setProperty('color', '#007bff', 'important'); // Same blue as Generate Seed button
        copyBtn.style.cursor = 'pointer';
        copyBtn.removeAttribute('disabled');
        copyTooltipText.textContent = 'copy the NFT seed number';
      }
      
      copyBtn.textContent = '⧉';
      copyBtn.onmousedown = e => e.preventDefault(); // Prevent focus outline
      copyBtn.onclick = async function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // Check if there's actually a valid seed value to copy
        const seedBox = document.querySelector('.nft-seed-box');
        if (!seedBox || !seedBox.textContent) {
          return; // No seed box found
        }
        
        const seedValue = seedBox.textContent.trim();
        // Check if seed is valid (not placeholder)
        if (!seedValue || seedValue === 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' || seedValue.length < 10) {
          return; // Invalid or placeholder seed
        }
        
          try {
            // Copy to clipboard
          await navigator.clipboard.writeText(seedValue);
            
            // Clear any existing timeout
            if (copyBtn.dataset.copyTimeoutId) {
              clearTimeout(parseInt(copyBtn.dataset.copyTimeoutId));
            }
            
            // CRITICAL: Store and maintain seed box color to prevent it from changing
            const seedBoxCurrentColor = seedBox.style.color || window.getComputedStyle(seedBox).color;
            const seedBoxOriginalColor = seedBoxCurrentColor;
            
            // Store original values
            const originalText = copyBtn.textContent;
            
            // Change to verified green state
            copyBtn.textContent = '✔';
          copyBtn.style.setProperty('color', '#00ff3c', 'important'); // Verified green color as requested
            copyBtn.style.transition = 'color 0.3s ease';
            
            // CRITICAL: Explicitly maintain seed box color - prevent it from changing
            if (seedBoxOriginalColor) {
              seedBox.style.setProperty('color', seedBoxOriginalColor, 'important');
            }
            
            // Revert after 2 seconds - check current button state to use correct color
            const timeoutId = setTimeout(() => {
              copyBtn.textContent = originalText;
              // Check if button should be enabled (has NFT and requirements met)
              const seedBoxCheck = document.querySelector('.nft-seed-box');
              const hasValidSeed = seedBoxCheck && seedBoxCheck.textContent && 
                                   seedBoxCheck.textContent.trim() !== 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' &&
                                   seedBoxCheck.textContent.trim().length >= 10;
              const hasNFTCheck = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
              const hasMinimumRequirementsCheck = window.currentProject && 
                                                  window.currentProject.traits && 
                                                  window.currentProject.traits.filter(layer => layer.traits && layer.traits.length > 0).length >= 2;
              
              if (hasValidSeed && hasNFTCheck && hasMinimumRequirementsCheck) {
                // Button should be enabled - use blue color
                copyBtn.style.setProperty('color', '#007bff', 'important');
            } else {
                // Button should be disabled - use grey color
                copyBtn.style.setProperty('color', '#a0a0b0', 'important');
            }
              
              // CRITICAL: Ensure seed box color is maintained after timeout
              if (seedBoxCheck && seedBoxOriginalColor) {
                seedBoxCheck.style.setProperty('color', seedBoxOriginalColor, 'important');
              }
              
              delete copyBtn.dataset.copyTimeoutId;
            }, 2000);
            copyBtn.dataset.copyTimeoutId = timeoutId.toString();
          } catch (error) {
            console.error('Failed to copy seed to clipboard:', error);
            // Show brief error feedback
            const originalText = copyBtn.textContent;
            const originalColor = copyBtn.style.color;
            copyBtn.textContent = '✗';
          copyBtn.style.setProperty('color', '#ff0000', 'important'); // Red for error
            setTimeout(() => {
              copyBtn.textContent = originalText;
            if (originalColor) {
              copyBtn.style.setProperty('color', originalColor, 'important');
            } else {
              copyBtn.style.removeProperty('color');
            }
            }, 2000);
        }
      };
      rowFlex.appendChild(seedLabel);
      rowFlex.appendChild(seedBox);
      rowFlex.appendChild(copyBtn);
      
      // Append seed display container to rarity seed row (Container 2)
      // Dark NFTs button will be added first (leftmost) when it's created
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
      // CRITICAL: Don't set color on initial render - wait until after "Please Wait" popup is shown
      // This prevents green background from flashing before the popup appears
      seedListCounter.style.color = '#fff'; // Set default white color initially
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
    // 3. Container 3: Seed toggle, input field, Generate Seed button (all in one row)
    const parentContainerForSeedInput = document.querySelector('.nft-seed-controls-parent');
    const seedInputRow = parentContainerForSeedInput ? parentContainerForSeedInput.querySelector('.nft-seedinput-row') : document.querySelector('.nft-seedinput-row');
    if (seedInputRow) {
      seedInputRow.innerHTML = '';
      // Set up seed input row as Container 3: flex row with 496px width and 32px height
      seedInputRow.style.display = 'flex';
      seedInputRow.style.flexDirection = 'row';
      seedInputRow.style.alignItems = 'center';
      seedInputRow.style.justifyContent = 'flex-end'; // Align to right to match Container 2
      seedInputRow.style.gap = '8px';
      seedInputRow.style.width = '496px';
      seedInputRow.style.height = '32px';
      seedInputRow.style.margin = '0';
      seedInputRow.style.padding = '0';

      // Elements will be appended directly to seedInputRow (Container 3)
      // No need for extra wrapper containers

      // Create the toggle button
      const toggleButton = document.createElement('button');
      toggleButton.className = 'toggle-button tooltip';
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
        height: 32px;
        width: 99px;
        min-width: 99px;
        display: flex;
        align-items: center;
        justify-content: center;
        white-space: nowrap;
      `;
      
      // Create tooltip text
      const seedTooltipText = document.createElement('span');
      seedTooltipText.className = 'tooltiptext';
      seedTooltipText.innerHTML = 'activate it if you want to generate a particular NFT<br>based on a specific Seed Number.';
      toggleButton.appendChild(seedTooltipText);
      
      // Position Seed NFT tooltip using fixed positioning to avoid being cut off
      toggleButton.addEventListener('mouseenter', function() {
        const rect = toggleButton.getBoundingClientRect();
        
        // Temporarily show tooltip off-screen to get accurate dimensions
        seedTooltipText.style.position = 'fixed';
        seedTooltipText.style.visibility = 'hidden';
        seedTooltipText.style.opacity = '0';
        seedTooltipText.style.display = 'block';
        seedTooltipText.style.top = '-9999px';
        seedTooltipText.style.left = '-9999px';
        seedTooltipText.style.transform = 'none';
        
        // Force reflow to get accurate measurements
        void seedTooltipText.offsetHeight;
        
        const tooltipRect = seedTooltipText.getBoundingClientRect();
        const tooltipHeight = tooltipRect.height || 60; // Fallback height
        const tooltipWidth = tooltipRect.width || 200; // Fallback width
        
        // Calculate button center position
        const buttonCenterX = rect.left + (rect.width / 2);
        const buttonTop = rect.top;
        
        // Position tooltip ABOVE the button, horizontally centered
        const top = buttonTop - tooltipHeight - 8; // 8px gap above button
        const left = buttonCenterX; // Center point of button
        
        // Apply positioning
        seedTooltipText.style.position = 'fixed';
        seedTooltipText.style.top = `${top}px`;
        seedTooltipText.style.left = `${left}px`;
        seedTooltipText.style.transform = 'translateX(-50%)'; // Center horizontally
        seedTooltipText.style.zIndex = '2147483647';
        
        // Show the tooltip
        seedTooltipText.style.visibility = 'visible';
        seedTooltipText.style.opacity = '1';
        seedTooltipText.style.display = 'block';
      });
      
      toggleButton.addEventListener('mouseleave', function() {
        seedTooltipText.style.visibility = 'hidden';
        seedTooltipText.style.opacity = '0';
      });
      
      // CRITICAL: Check if "Please Wait" popup is showing - keep grey during popup
      const generateNftsTabCheck = document.getElementById('generate-nfts');
      let popupCheck = generateNftsTabCheck ? generateNftsTabCheck.querySelector('.nft-rendering-popup') : null;
      if (!popupCheck) {
        popupCheck = document.querySelector('.nft-rendering-popup');
      }
      // Also check for "Please Wait" popup
      const pleaseWaitPopupCheck = document.getElementById('nft-edit-please-wait-popup');
      const isPopupShowingForButton = popupCheck || pleaseWaitPopupCheck;
      
      // CRITICAL: Seed NFT toggle only needs minimum requirements (2 layers with 1 trait each)
      // It doesn't need an existing NFT because it's meant to GENERATE one with a seed
      // BUT: Keep grey during popup even if requirements are met
      if (!hasMinimumRequirements || isPopupShowingForButton) {
        toggleButton.style.backgroundColor = '#23232b';
        toggleButton.style.color = '#a0a0b0'; // Match placeholder color (var(--text-secondary))
        toggleButton.style.borderColor = '#84a0b0';
        toggleButton.style.cursor = 'not-allowed';
        toggleButton.style.opacity = '0.6';
        toggleButton.style.pointerEvents = 'none'; // Completely prevent hover interactions
        toggleButton.disabled = true;
      } else {
        // Enable if minimum requirements are met (regardless of existing NFT)
        toggleButton.style.backgroundColor = '#2a2a2a';
        toggleButton.style.color = '#ffffff';
        toggleButton.style.borderColor = '#4a4a4a';
        toggleButton.style.cursor = 'pointer';
        toggleButton.style.opacity = '1';
        toggleButton.style.pointerEvents = 'auto'; // Re-enable hover interactions when enabled
        toggleButton.disabled = false;
        toggleButton.removeAttribute('disabled');
      }
      
      // Add click handler to toggle the button state
      toggleButton.addEventListener('click', function() {
        // Check minimum requirements dynamically
        const currentProjectData = self.projectData || window.currentProject;
        const currentHasMinimumRequirements = self._hasMinimumRequirements(currentProjectData);
        
        if (!currentHasMinimumRequirements) {
          console.warn('[Seed NFT Toggle] Minimum requirements not met');
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              "You need at least 2 trait layers with at least one trait each to use Seed NFT.",
              "warning",
              3000
            );
          }
          return; // Don't allow toggling if requirements not met
        }
        
        // Check if button is disabled
        if (toggleButton.disabled) {
          console.warn('[Seed NFT Toggle] Button is disabled');
          return;
        }
        
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
      seedInput.style.height = '32px';
      seedInput.style.fontSize = '13px';
      seedInput.style.margin = '0';
      seedInput.style.padding = '0 8px';
      seedInput.style.borderRadius = '8px'; /* Changed from 4px to match app rounded corners */
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
      generateSeedBtn.style.height = '32px';
      generateSeedBtn.style.fontSize = '13px';
      generateSeedBtn.style.margin = '0';
      generateSeedBtn.style.borderRadius = '4px';
      
      // CRITICAL: Generate Seed button only needs minimum requirements (2 layers with 1 trait each)
      // It doesn't need an existing NFT because it's meant to GENERATE one with a seed
      // CRITICAL: Check if popup is showing - if so, keep button greyed out
      const generateNftsTabCheckForSeed = document.getElementById('generate-nfts');
      let popupCheckForSeed = generateNftsTabCheckForSeed ? generateNftsTabCheckForSeed.querySelector('.nft-rendering-popup') : null;
      if (!popupCheckForSeed) {
        popupCheckForSeed = document.querySelector('.nft-rendering-popup');
      }
      // Also check for "Please Wait" popup
      const pleaseWaitPopupCheckForSeed = document.getElementById('nft-edit-please-wait-popup');
      const isPopupShowingCheck = popupCheckForSeed || pleaseWaitPopupCheckForSeed;
      
      if (!hasMinimumRequirements || isPopupShowingCheck) {
        // Disable if minimum requirements not met OR popup is showing
        // Apply disabled styles but override border to grey
        generateSeedBtn.style.setProperty('background-color', '#23232b', 'important');
        generateSeedBtn.style.setProperty('color', '#84a0b0', 'important');
        generateSeedBtn.style.setProperty('cursor', 'not-allowed', 'important');
        generateSeedBtn.style.setProperty('opacity', '0.6', 'important');
        generateSeedBtn.style.setProperty('border', '1px solid #84a0b0', 'important'); // Grey border when disabled
        generateSeedBtn.style.setProperty('border-color', '#84a0b0', 'important'); // Ensure grey border color
        generateSeedBtn.style.pointerEvents = 'none';
        generateSeedBtn.disabled = true;
        generateSeedBtn.setAttribute('disabled', 'disabled');
      } else {
        // Enable if minimum requirements are met (regardless of existing NFT) AND popup is not showing
        generateSeedBtn.style.setProperty('border', '1px solid #007bff', 'important'); // Blue border when active
        generateSeedBtn.style.setProperty('border-color', '#007bff', 'important'); // Ensure blue border color
        generateSeedBtn.style.background = '#007bff';
        generateSeedBtn.style.color = '#fff';
        generateSeedBtn.disabled = false;
        generateSeedBtn.removeAttribute('disabled');
        generateSeedBtn.style.opacity = '1';
        generateSeedBtn.style.cursor = 'pointer';
      }

      // Remove existing Dark NFTs button if it exists
      const existingDarkNftsBtn = document.getElementById('generate-dark-nfts');
      if (existingDarkNftsBtn) {
        existingDarkNftsBtn.remove();
      }
      
      // Get Container 2 (rarity seed row) to add Dark NFTs button directly to it
      const parentContainerForDarkNfts = document.querySelector('.nft-seed-controls-parent');
      const raritySeedRowForDarkNfts = parentContainerForDarkNfts ? parentContainerForDarkNfts.querySelector('.nft-rarity-seed-row') : document.querySelector('.nft-rarity-seed-row');
      
      // Create Dark NFTs toggle button - will be added directly to Container 2 (first, leftmost)
      const duplicateGenerateSeedBtn = document.createElement('button');
      duplicateGenerateSeedBtn.id = 'generate-dark-nfts';
      duplicateGenerateSeedBtn.className = 'toggle-button';
      duplicateGenerateSeedBtn.textContent = 'Dark NFTs';
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
        height: 32px;
        width: 99px;
        min-width: 99px;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        text-align: center;
        z-index: 1000;
      `;
      
      // Apply disabled styles if no NFT or requirements not met
      // NOTE: Dark NFTs button should always be visible, just disabled if requirements not met
      if (!hasNFT || !hasMinimumRequirements) {
        duplicateGenerateSeedBtn.style.backgroundColor = '#23232b';
        duplicateGenerateSeedBtn.style.color = '#a0a0b0'; // Match placeholder color (var(--text-secondary))
        duplicateGenerateSeedBtn.style.borderColor = '#84a0b0';
        duplicateGenerateSeedBtn.style.cursor = 'not-allowed';
        duplicateGenerateSeedBtn.style.opacity = '0.6';
        duplicateGenerateSeedBtn.disabled = true;
        // Note: Edit button will be hidden after it's created (see below)
      } else {
        duplicateGenerateSeedBtn.style.backgroundColor = '#2a2a2a';
        duplicateGenerateSeedBtn.style.color = '#ffffff';
        duplicateGenerateSeedBtn.style.borderColor = '#4a4a4a';
        duplicateGenerateSeedBtn.style.cursor = 'pointer';
        duplicateGenerateSeedBtn.style.opacity = '1';
        duplicateGenerateSeedBtn.disabled = false;
        // Edit button visibility will be controlled by active state
      }
      
      // Ensure button is always visible (not hidden)
      duplicateGenerateSeedBtn.style.display = 'flex';
      duplicateGenerateSeedBtn.style.visibility = 'visible';
      
      // Create a wrapper div for the Dark NFTs button to hold the edit button
      const darkNftsWrapper = document.createElement('div');
      darkNftsWrapper.style.position = 'relative';
      darkNftsWrapper.style.display = 'flex';
      darkNftsWrapper.style.alignItems = 'center';
      darkNftsWrapper.style.overflow = 'visible';
      
      // Add Dark NFTs button to wrapper
      darkNftsWrapper.appendChild(duplicateGenerateSeedBtn);

      // Append toggle, input and button directly to Container 3 (seedInputRow)
      seedInputRow.appendChild(toggleButton);
      seedInputRow.appendChild(seedInput);
      seedInputRow.appendChild(generateSeedBtn);
      
      // Set seedInputRow position for any absolute positioned elements
      seedInputRow.style.position = 'relative';
      seedInputRow.style.overflow = 'visible'; // Allow edit button to display outside bounds
      
      // Create edit button for Dark NFTs configuration (initially hidden)
      // Position it relative to Dark NFTs button - only show when Dark NFTs is active
      // NO TOOLTIP - tooltip removed as requested
      const darkTraitsEditBtn = document.createElement('button');
      darkTraitsEditBtn.id = 'dark-traits-edit-btn';
      darkTraitsEditBtn.className = 'dark-traits-edit-btn'; // Removed 'tooltip' class - no tooltip
      darkTraitsEditBtn.innerHTML = 'EDIT';
      darkTraitsEditBtn.style.cssText = `
        position: absolute;
        top: -11px;
        left: -10px;
        width: 40px;
        height: 20px;
        background: #ff6b35;
        color: white;
        border: 2px solid #000;
        border-radius: 4px;
        font-size: 10px;
        font-weight: bold;
        cursor: pointer;
        display: flex;
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: all 0.3s ease;
        z-index: 10000;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        align-items: center;
        justify-content: center;
      `;
      
      // NO TOOLTIP - tooltip removed as requested
      // No tooltip element created, no tooltip event listeners added
      
      // CRITICAL: Hide edit button when Dark NFTs button is disabled/greyed out (if it was disabled above)
      if (!hasNFT || !hasMinimumRequirements) {
        darkTraitsEditBtn.style.setProperty('opacity', '0', 'important');
        darkTraitsEditBtn.style.setProperty('visibility', 'hidden', 'important');
        darkTraitsEditBtn.style.setProperty('pointer-events', 'none', 'important');
        darkTraitsEditBtn.style.setProperty('display', 'none', 'important');
      }
      
      // Add edit button to darkNftsWrapper (positioned relative to Dark NFTs button)
      darkNftsWrapper.appendChild(darkTraitsEditBtn);
      
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
      
      // Add Dark NFTs button wrapper directly to Container 2 (rarity seed row) as first element (leftmost)
      if (raritySeedRowForDarkNfts) {
        // Remove existing Dark NFTs button if it exists to avoid duplicates
        const existingBtn = raritySeedRowForDarkNfts.querySelector('#generate-dark-nfts');
        if (existingBtn) {
          existingBtn.parentElement.remove();
        }
        
        // Insert Dark NFTs wrapper at the beginning (first, leftmost position)
        const firstChild = raritySeedRowForDarkNfts.firstChild;
        if (firstChild) {
          raritySeedRowForDarkNfts.insertBefore(darkNftsWrapper, firstChild);
        } else {
          raritySeedRowForDarkNfts.appendChild(darkNftsWrapper);
        }
      }
      
      // Elements are already appended directly to seedInputRow (Container 3)
      
      // Update event listener to work as radio toggle - mutually exclusive with Dark NFTs
      toggleButton.addEventListener('change', function() {
        const isActive = this.classList.contains('active');
        seedInput.disabled = !isActive;
        generateSeedBtn.disabled = !isActive;
        
        if (isActive) {
          // Seed NFT is now active - deactivate Dark NFTs
          duplicateGenerateSeedBtn.classList.remove('active');
          duplicateGenerateSeedBtn.style.backgroundColor = '#2a2a2a';
          duplicateGenerateSeedBtn.style.borderColor = '#4a4a4a';
          duplicateGenerateSeedBtn.style.color = '#ffffff';
          
          const self = window.NFTApp.getModule('generateNftsUI');
          if (self) self.darkModeEnabled = false;
          
          // Hide Dark NFT Edit button
          const editBtn = document.getElementById('dark-traits-edit-btn');
          if (editBtn) {
            editBtn.style.opacity = '0';
            editBtn.style.visibility = 'hidden';
            editBtn.style.pointerEvents = 'none';
            editBtn.style.display = 'none';
          }
          
          // Restore Create NFT button to default styling
          const createNftBtn = document.getElementById('nft-action-create-btn');
          if (createNftBtn) {
            createNftBtn.style.backgroundColor = '#047857';
            createNftBtn.style.borderColor = '#047857';
            createNftBtn.style.color = '#ffffff';
            createNftBtn.style.boxShadow = '';
            createNftBtn.style.fontWeight = 'bold';
            createNftBtn.style.textShadow = '2px 2px 0 #000000';
            createNftBtn.style.animation = '';
            createNftBtn.style.width = '102px';
            createNftBtn.style.height = '66px';
            createNftBtn.style.borderRadius = '8px';
            createNftBtn.style.border = '2px solid #047857';
            createNftBtn.classList.remove('dark-mode-active');
          }
          
          console.log('[DEBUG] Seed NFT activated - Dark NFTs deactivated');
        }
        // Note: Both buttons remain clickable at all times (radio button behavior)
      });
      
      // Set initial state - radio toggle behavior
      const isInitiallyActive = toggleButton.classList.contains('active');
      seedInput.disabled = !isInitiallyActive;
      generateSeedBtn.disabled = !isInitiallyActive;
      
      // Ensure Dark NFTs button is always clickable (radio button behavior)
      duplicateGenerateSeedBtn.disabled = false;
      
      // If Seed NFT is initially active, deactivate and hide Dark NFTs
      if (isInitiallyActive) {
        duplicateGenerateSeedBtn.classList.remove('active');
        const self = window.NFTApp.getModule('generateNftsUI');
        if (self) self.darkModeEnabled = false;
        
        darkTraitsEditBtn.style.setProperty('opacity', '0', 'important');
        darkTraitsEditBtn.style.setProperty('visibility', 'hidden', 'important');
        darkTraitsEditBtn.style.setProperty('pointer-events', 'none', 'important');
        darkTraitsEditBtn.style.setProperty('display', 'none', 'important');
        
        // Restore Create NFT button to default styling
        const createNftBtn = document.getElementById('nft-action-create-btn');
        if (createNftBtn) {
          createNftBtn.style.backgroundColor = '#047857';
          createNftBtn.style.borderColor = '#047857';
          createNftBtn.style.color = '#ffffff';
          createNftBtn.style.boxShadow = '';
          createNftBtn.style.fontWeight = 'bold';
          createNftBtn.style.textShadow = '2px 2px 0 #000000';
          createNftBtn.style.animation = '';
          createNftBtn.style.width = '102px';
          createNftBtn.style.height = '66px';
          createNftBtn.style.borderRadius = '8px';
          createNftBtn.style.border = '2px solid #047857';
          createNftBtn.classList.remove('dark-mode-active');
        }
      }
      
      generateSeedBtn.addEventListener('click', () => {
        // CRITICAL: Check minimum requirements before allowing click
        const pd = (window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').projectData) || window.currentProject || null;
        if (!pd) {
          console.warn('[Generate Seed NFT] No project data available');
          return;
        }
        
        // Check if minimum requirements are met (2 layers with at least 1 trait each)
        const hasMinimumRequirements = self._hasMinimumRequirements(pd);
        if (!hasMinimumRequirements) {
          console.warn('[Generate Seed NFT] Minimum requirements not met');
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              "You need at least 2 trait layers with at least one trait each to generate NFTs with a seed.",
              "warning",
              3000
            );
          }
          return;
        }
        
        // Check if button is disabled
        if (generateSeedBtn.disabled) {
          console.warn('[Generate Seed NFT] Button is disabled');
          return;
        }
        
        // Requirements met - proceed with generation
        window.NFTApp.getModule('generateNftsUI').generateSeedNFT(pd);
      });
      
      // Add dark mode toggle functionality - Radio toggle: when activated, deactivate Seed NFT
      duplicateGenerateSeedBtn.addEventListener('click', function() {
        const seedToggle = document.getElementById('single-seed-toggle');
        
        // Toggle Dark NFTs state
        this.classList.toggle('active');
        const isDarkActive = this.classList.contains('active');
        
        if (isDarkActive) {
          // Dark NFTs is now active - deactivate Seed NFT if it was active
          const isSeedToggleActive = seedToggle && seedToggle.classList.contains('active');
          if (isSeedToggleActive) {
            seedToggle.classList.remove('active');
            seedInput.disabled = true;
            generateSeedBtn.disabled = true;
            
            // Dispatch change event to update Seed NFT state
            const changeEvent = new Event('change', { bubbles: true });
            seedToggle.dispatchEvent(changeEvent);
            
            console.log('[DEBUG] Seed NFT automatically deselected - Dark NFTs activated');
          }
        }
        
        // Trigger change event for Dark NFTs listeners
        const changeEvent = new Event('change', { bubbles: true });
        this.dispatchEvent(changeEvent);
      });
      
      // Add change event listener for dark mode functionality
      duplicateGenerateSeedBtn.addEventListener('change', function() {
        const isActive = this.classList.contains('active');
        const self = window.NFTApp.getModule('generateNftsUI');
        self.darkModeEnabled = isActive;
        
        // Show/hide edit button with animation - only show when Dark NFTs is active AND button is not disabled
        const editBtn = document.getElementById('dark-traits-edit-btn');
        if (editBtn) {
          // Get current state dynamically
          const darkNftsBtn = document.getElementById('generate-dark-nfts');
          const isButtonDisabled = this.disabled || this.classList.contains('disabled') || 
                                   (darkNftsBtn && (darkNftsBtn.disabled || darkNftsBtn.classList.contains('disabled')));
          
          if (isActive && !isButtonDisabled) {
            // Show edit button only when Dark NFTs is active and button is enabled
            editBtn.style.setProperty('visibility', 'visible', 'important');
            editBtn.style.setProperty('pointer-events', 'auto', 'important');
            editBtn.style.setProperty('display', 'flex', 'important');
            setTimeout(() => editBtn.style.setProperty('opacity', '1', 'important'), 10);
          } else {
            // Hide edit button when Dark NFTs is inactive or button is disabled
            editBtn.style.setProperty('opacity', '0', 'important');
            editBtn.style.setProperty('visibility', 'hidden', 'important');
            editBtn.style.setProperty('pointer-events', 'none', 'important');
            setTimeout(() => editBtn.style.setProperty('display', 'none', 'important'), 300);
          }
        }
        
        // Update Create NFT button visual
        const createNftBtn = document.getElementById('nft-action-create-btn');
        if (createNftBtn) {
          if (isActive) {
            // Apply Dark NFTs background color and halo effect, but preserve original text color and size
            createNftBtn.style.backgroundColor = '#00ff88';
            createNftBtn.style.borderColor = '#00ff88';
            // Preserve original text color (#ffffff) - do not change
            // Preserve original font-weight (bold) - do not change
            // Preserve original text-shadow (2px 2px 0 #000000) - do not change
            createNftBtn.style.boxShadow = 'inset 0 3px 5px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 255, 136, 0.5), 0 0 20px rgba(0, 255, 136, 0.3)';
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
    
    // CRITICAL: After rendering all controls, ensure buttons are greyed out if popup is not showing yet
    // This prevents buttons from appearing enabled before the "Please Wait" popup is displayed
    const generateNftsTabFinal = document.getElementById('generate-nfts');
    let popupFinal = generateNftsTabFinal ? generateNftsTabFinal.querySelector('.nft-rendering-popup') : null;
    if (!popupFinal) {
      popupFinal = document.querySelector('.nft-rendering-popup');
    }
    const pleaseWaitPopupFinal = document.getElementById('nft-edit-please-wait-popup');
    const isPopupShowingFinal = popupFinal || pleaseWaitPopupFinal;
    
    if (!isPopupShowingFinal) {
      // Popup not showing yet - ensure buttons are greyed out
      if (this._ensureButtonsGreyedOut) {
        this._ensureButtonsGreyedOut();
      }
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
      // CRITICAL: Check if "Please Wait" popup is showing - don't update counter until it's hidden
      const generateNftsTabCounter = document.getElementById('generate-nfts');
      let popupCounter = generateNftsTabCounter ? generateNftsTabCounter.querySelector('.nft-rendering-popup') : null;
      if (!popupCounter) {
        popupCounter = document.querySelector('.nft-rendering-popup');
      }
      // Also check for "Please Wait" popup
      const pleaseWaitPopupCounter = document.getElementById('nft-edit-please-wait-popup');
      if (popupCounter || pleaseWaitPopupCounter) {
        console.log('[DEBUG] ensureNftPreviewContainerExists: Popup is still showing, skipping counter update');
        // Don't update counter text or color while popup is visible
        seedListCounter.style.color = '#fff'; // Keep white during popup
        return;
      }
      
      seedListCounter.textContent = `${self.formatNumberWithCommas(seedList.length || 0)} / ${self.formatNumberWithCommas(totalSupply)}`;
      // Popup is hidden, safe to update
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
        // Remove title and add custom tooltip
        thumb.removeAttribute('title');
        if (forbiddenMsg) {
          thumb.classList.add('tooltip');
          let thumbTooltip = thumb.querySelector('.tooltiptext');
          if (!thumbTooltip) {
            thumbTooltip = document.createElement('span');
            thumbTooltip.className = 'tooltiptext';
            thumb.appendChild(thumbTooltip);
          }
          thumbTooltip.textContent = forbiddenMsg || 'This trait is forbidden by current rules.';
      } else {
          thumb.classList.remove('tooltip');
          const thumbTooltip = thumb.querySelector('.tooltiptext');
          if (thumbTooltip) thumbTooltip.remove();
        }
      } else {
        thumb.removeAttribute('title');
        thumb.classList.remove('tooltip');
        const thumbTooltip = thumb.querySelector('.tooltiptext');
        if (thumbTooltip) thumbTooltip.remove();
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
    // CRITICAL: Check if "Please Wait" popup is showing - don't update counter until it's hidden
    const generateNftsTab = document.getElementById('generate-nfts');
    let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
    if (!popup) {
      popup = document.querySelector('.nft-rendering-popup');
    }
    // Also check for "Please Wait" popup
    const pleaseWaitPopup = document.getElementById('nft-edit-please-wait-popup');
    if (popup || pleaseWaitPopup) {
      console.log('[DEBUG] _performRefresh: Popup is still showing, skipping counter update');
      // Don't update counter text or color while popup is visible
      return;
    }
    
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
    
    // CRITICAL FIX: Check if modal instance exists and use its seedList if available
    let seedCount = 0;
    if (window.savedSeedsModalInstance && window.savedSeedsModalInstance.seedList) {
      seedCount = window.savedSeedsModalInstance.seedList.length;
      console.log('[DEBUG] refreshSeedListCounter: Using seedList from modal instance:', seedCount, 'items');
    } else {
      // Fallback to reading from localStorage
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
      seedCount = seedList.length || 0;
      console.log('[DEBUG] refreshSeedListCounter: Using seedList from localStorage:', seedCount, 'items');
    }
    const text = `${self.formatNumberWithCommas(seedCount)} / ${self.formatNumberWithCommas(totalSupply)}`;
    
    // Update display - popup is hidden, safe to update
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
              // Update all button states after re-rendering
              if (typeof window.NFTApp.getModule('generateNftsUI')._updateAllButtonStates === 'function') {
                window.NFTApp.getModule('generateNftsUI')._updateAllButtonStates();
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
    align-items: center !important;
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
      container.style.alignItems = 'center';
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
        container.style.alignItems = 'center';
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

