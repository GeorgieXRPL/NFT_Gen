// NFT Edit Modal Component
// Allows editing of individual NFTs from saved seeds or batch generation modals

class NFTEditModal {
  constructor() {
    this.modal = null;
    this.currentNFT = null;
    this.originalNFT = null;
    this.projectData = null;
    this.sourceType = null; // 'saved-seeds' or 'batch-generation'
    this.sourceIndex = null; // Index in the source collection
    this.onUpdateCallback = null;
    this.hasChanges = false;
    this.newSeed = null; // New seed for replacement
    this.isUpdating = false; // Flag to prevent multiple simultaneous updates
  }

  /**
   * Open the edit modal
   * @param {Object} nft - The NFT object to edit
   * @param {Object} projectData - The current project data
   * @param {String} sourceType - 'saved-seeds' or 'batch-generation'
   * @param {Number} sourceIndex - Index in the source collection
   * @param {Function} onUpdateCallback - Callback to execute after update
   */
  open(nft, projectData, sourceType, sourceIndex, onUpdateCallback) {
    console.log('[NFT Edit Modal] Opening edit modal', { sourceType, sourceIndex });
    console.log('[NFT Edit Modal] Received NFT data:', nft);
    console.log('[NFT Edit Modal] NFT traits:', nft?.traits);
    console.log('[NFT Edit Modal] NFT imageData:', nft?.imageData);
    console.log('[NFT Edit Modal] Project data:', projectData);
    
    this.currentNFT = nft;
    this.originalNFT = JSON.parse(JSON.stringify(nft)); // Deep clone
    this.projectData = projectData;
    this.sourceType = sourceType;
    this.sourceIndex = sourceIndex;
    this.onUpdateCallback = onUpdateCallback;
    this.hasChanges = false;

    this.createModal();
    this.renderNFT();
  }

  createModal() {
    // Remove existing modal if present
    if (this.modal) {
      this.modal.remove();
    }

    // Create modal overlay
    this.modal = document.createElement('div');
    this.modal.className = 'nft-edit-modal-overlay';
    this.modal.style.cssText = `
      display: flex;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.9);
      z-index: 100000;
      align-items: center;
      justify-content: center;
      font-family: 'Archivo', sans-serif;
    `;

    // Create modal content container
    const modalContent = document.createElement('div');
    modalContent.className = 'nft-edit-modal-content';
    modalContent.style.cssText = `
      background: #1a1a1a;
      border-radius: 12px;
      padding: 24px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: visible;
      position: relative;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
      display: flex;
      flex-direction: column;
    `;

    modalContent.innerHTML = `
      <!-- Close button -->
      <button class="nft-edit-close-btn" style="
        position: absolute;
        top: 12px;
        right: 12px;
        background: none;
        border: none;
        color: #95a5a6;
        font-size: 32px;
        cursor: pointer;
        line-height: 1;
        padding: 4px 8px;
        z-index: 1;
        transition: color 0.2s ease;
      ">&times;</button>

      <!-- Modal title -->
      <div style="text-align: center; margin-bottom: 20px; flex-shrink: 0;">
        <h2 style="color: #fff; font-size: 24px; font-weight: 600; margin: 0;">Edit NFT</h2>
        <p style="color: #95a5a6; font-size: 14px; margin: 8px 0 0 0;">Modify traits and update the NFT</p>
      </div>

      <!-- Main content area (matching Generate NFTs tab style) -->
      <div class="nft-edit-main-row" style="display: flex; flex-direction: row; gap: 20px; align-items: flex-start; width: 100%; justify-content: center; flex: 1; min-height: 0; overflow: visible;">
        
        <!-- NFT Preview Section (Left) -->
        <div class="nft-edit-preview-section" style="flex: 0 0 440px; max-width: 440px; min-width: 340px; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0; height: auto;">
          <div class="nft-edit-preview-title" style="text-align: center; color: #fff; font-size: 1.5rem; font-weight: 600; margin: 0;">
            NFT Preview
          </div>
          <div class="nft-edit-preview-panel" style="display: flex; flex-direction: column; gap: 12px;">
            <!-- Preview image container -->
            <div class="nft-edit-preview-image-area" style="
              background: #23232b;
              border-radius: 12px;
              padding: 18px;
              border: 1.5px solid #29293a;
              box-shadow: 0 2px 8px rgba(0,0,0,0.10);
            ">
              <div id="nft-edit-preview-container" style="
                width: 100%;
                max-width: 400px;
                margin: 0 auto;
                aspect-ratio: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0,0,0,0.2);
                border-radius: 8px;
                overflow: hidden;
              ">
                <img src="" alt="NFT Preview" style="width: 100%; height: 100%; object-fit: contain;">
              </div>
            </div>

            <!-- Seed display -->
            <div class="nft-edit-seed-display" style="
              background: #23232b;
              border-radius: 8px;
              padding: 12px;
              border: 1.5px solid #29293a;
              text-align: center;
            ">
              <div style="color: #95a5a6; font-size: 12px; margin-bottom: 4px;">Current Seed</div>
              <div class="nft-edit-seed-value" style="color: #fff; font-size: 13px; font-family: monospace; word-break: break-all;"></div>
            </div>

            <!-- New seed input -->
            <div class="nft-edit-new-seed-section" style="
              background: #23232b;
              border-radius: 8px;
              padding: 12px;
              border: 1.5px solid #29293a;
              text-align: center;
            ">
              <div style="color: #95a5a6; font-size: 12px; margin-bottom: 8px;">Replace with new seed:</div>
              <input 
                type="text" 
                id="nft-edit-new-seed-input" 
                class="nft-edit-new-seed-input"
                placeholder="Paste new seed number here"
                style="
                  width: 100%;
                  padding: 8px 12px;
                  background: #1a1a1a;
                  border: 1px solid #333;
                  border-radius: 6px;
                  color: #fff;
                  font-size: 13px;
                  font-family: monospace;
                  text-align: center;
                  outline: none;
                  transition: border-color 0.2s ease;
                "
              />
            </div>
          </div>
        </div>

        <!-- Traits Section (Right) -->
        <div class="nft-edit-traits-section" style="flex: 0 0 auto; width: 220px; min-width: 220px; max-width: 220px; max-height: 100%; display: flex; flex-direction: column;">
          <div class="nft-edit-traits-title tooltip tooltip-bottom" style="text-align: center; color: #fff; font-size: 1.8rem; font-weight: 600; margin: 0 0 0.5rem 0; padding: 0; cursor: help; position: relative; flex-shrink: 0;">
            NFT Traits
            <span class="tooltiptext"></span>
            <div class="custom-tooltip-text" style="visibility: hidden; opacity: 0; position: absolute; bottom: calc(100% + 10px); left: 50%; transform: translateX(-50%); background: #000000; color: #fff; padding: 12px 16px; border-radius: 8px; font-size: 13px; font-weight: 400; white-space: normal; z-index: 999999; pointer-events: none; box-shadow: 0 4px 12px rgba(0,0,0,0.3); text-align: center; line-height: 1.4; width: 180px; transition: opacity 1s ease, visibility 1s ease;">
              Check the list of<br>traits being used on<br>the generated NFT and<br>edit them as you like
            </div>
          </div>
          <div class="nft-edit-traits-list-card traits-list-card" style="
            display: flex;
            flex-direction: column;
            background: #23232b;
            border-radius: 16px;
            padding: 20px 16px;
            border: 1.5px solid #232323;
            box-shadow: 0 2px 12px rgba(0,0,0,0.10);
            height: 717px;
            max-height: 717px;
            overflow-y: auto;
            overflow-x: hidden;
            scrollbar-width: thin;
            scrollbar-color: #333 #1a1a1a;
          ">
            <div class="nft-edit-trait-info-panel nft-trait-info-panel">
              <ul class="nft-edit-trait-info-list nft-trait-info-list" style="
                list-style: none;
                padding: 16px 8px 60px 8px;
                margin: 0;
                display: flex;
                flex-direction: column;
                gap: 10px;
              "></ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Action buttons -->
      <div class="nft-edit-actions" style="
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        margin-top: 0;
        flex-shrink: 0;
        width: 440px;
        height: 40px;
        margin-left: 0;
        margin-right: 0;
        position: relative;
        top: 10px;
      ">
        <button class="nft-edit-cancel-btn" style="
          background: #555;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          width: 129px;
          min-width: 129px;
          max-width: 129px;
          height: 40px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Archivo', sans-serif;
          transition: all 0.2s ease;
        ">Cancel</button>
        <button class="nft-edit-update-btn" style="
          background: #8b5cf6;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 0 16px;
          width: 129px;
          min-width: 129px;
          max-width: 129px;
          height: 40px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          font-family: 'Archivo', sans-serif;
          transition: all 0.2s ease;
          visibility: hidden;
        ">Update NFT</button>
      </div>
    `;

    this.modal.appendChild(modalContent);
    document.body.appendChild(this.modal);

    // Add custom scrollbar styling for webkit browsers
    const scrollbarStyle = document.createElement('style');
    scrollbarStyle.textContent = `
      .nft-edit-traits-list-card::-webkit-scrollbar {
        width: 8px;
      }
      .nft-edit-traits-list-card::-webkit-scrollbar-track {
        background: #1a1a1a;
        border-radius: 4px;
      }
      .nft-edit-traits-list-card::-webkit-scrollbar-thumb {
        background: #333;
        border-radius: 4px;
      }
      .nft-edit-traits-list-card::-webkit-scrollbar-thumb:hover {
        background: #444;
      }
    `;
    document.head.appendChild(scrollbarStyle);

    // Setup event listeners
    this.setupEventListeners();

    // Setup tooltip for NFT Traits title
    this.setupTooltip();
  }

  setupTooltip() {
    const titleElement = this.modal.querySelector('.nft-edit-traits-title');
    const tooltipText = titleElement.querySelector('.custom-tooltip-text');
    
    if (titleElement && tooltipText) {
      titleElement.addEventListener('mouseenter', () => {
        tooltipText.style.visibility = 'visible';
        tooltipText.style.opacity = '1';
      });
      
      titleElement.addEventListener('mouseleave', () => {
        tooltipText.style.visibility = 'hidden';
        tooltipText.style.opacity = '0';
      });
    }
  }

  setupEventListeners() {
    // Close button
    const closeBtn = this.modal.querySelector('.nft-edit-close-btn');
    closeBtn.addEventListener('click', () => this.close());

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = '#fff';
    });
    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = '#95a5a6';
    });

    // Cancel button
    const cancelBtn = this.modal.querySelector('.nft-edit-cancel-btn');
    cancelBtn.addEventListener('click', () => this.close());

    cancelBtn.addEventListener('mouseenter', () => {
      cancelBtn.style.background = '#666';
    });
    cancelBtn.addEventListener('mouseleave', () => {
      cancelBtn.style.background = '#555';
    });

    // Update button
    const updateBtn = this.modal.querySelector('.nft-edit-update-btn');
    updateBtn.addEventListener('click', () => this.updateNFT());

    updateBtn.addEventListener('mouseenter', () => {
      updateBtn.style.background = '#7c3aed';
    });
    updateBtn.addEventListener('mouseleave', () => {
      updateBtn.style.background = '#8b5cf6';
    });

    // Close on overlay click (but not when clicking inside modal content or during text selection)
    this.modal.addEventListener('click', (e) => {
      // Only close if:
      // 1. Clicking directly on the modal overlay (not on any child elements)
      // 2. Not during text selection
      // 3. Not on input fields or interactive elements
      if (e.target === this.modal && 
          !e.target.closest('.nft-edit-modal-content') &&
          !window.getSelection().toString() && // No text selected
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA' &&
          e.target.tagName !== 'BUTTON') {
        this.close();
      }
    });
    
    // Prevent modal from closing when interacting with input fields or selecting text
    this.modal.addEventListener('mousedown', (e) => {
      // If the mousedown starts on an input field, prevent the click event from bubbling
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        e.stopPropagation();
      }
    });

    // Prevent modal from closing during text selection
    this.modal.addEventListener('selectstart', (e) => {
      e.stopPropagation();
    });

    // Prevent modal from closing during text selection
    this.modal.addEventListener('select', (e) => {
      e.stopPropagation();
    });

    // Prevent modal from closing during scrolling
    this.modal.addEventListener('wheel', (e) => {
      e.stopPropagation();
    });

    // Prevent modal from closing during touch events (mobile)
    this.modal.addEventListener('touchstart', (e) => {
      e.stopPropagation();
    });

    this.modal.addEventListener('touchmove', (e) => {
      e.stopPropagation();
    });

    // ESC key to close
    this.escHandler = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        this.close();
      }
    };
    document.addEventListener('keydown', this.escHandler);

    // New seed input field
    const newSeedInput = this.modal.querySelector('#nft-edit-new-seed-input');
    if (newSeedInput) {
      newSeedInput.addEventListener('input', (e) => {
        this.handleNewSeedInput(e.target.value);
      });
      
      newSeedInput.addEventListener('paste', (e) => {
        // Handle paste event with a slight delay to ensure the value is updated
        setTimeout(() => {
          this.handleNewSeedInput(e.target.value);
        }, 10);
      });
      
      // Prevent modal from closing when interacting with this input
      newSeedInput.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      
      newSeedInput.addEventListener('click', (e) => {
        e.stopPropagation();
      });
      
      newSeedInput.addEventListener('select', (e) => {
        e.stopPropagation();
      });
      
      newSeedInput.addEventListener('selectstart', (e) => {
        e.stopPropagation();
      });
    }
  }

  async renderNFT() {
    console.log('[NFT Edit Modal] Rendering NFT', this.currentNFT);
    console.log('[NFT Edit Modal] Current NFT traits:', this.currentNFT?.traits);
    console.log('[NFT Edit Modal] Current NFT imageData:', this.currentNFT?.imageData);
    console.log('[NFT Edit Modal] Current NFT thumbnail:', this.currentNFT?.thumbnail);

    // Update preview image
    const previewImg = this.modal.querySelector('#nft-edit-preview-container img');
    if (this.currentNFT.imageData) {
      previewImg.src = this.currentNFT.imageData;
      console.log('[NFT Edit Modal] Set preview image from imageData');
    } else if (this.currentNFT.thumbnail) {
      previewImg.src = this.currentNFT.thumbnail;
      console.log('[NFT Edit Modal] Set preview image from thumbnail');
    } else {
      console.log('[NFT Edit Modal] No image data available');
    }

    // Add NFT number display if editing from collection (saved-seeds)
    this.updateNFTNumberDisplay();

    // Update seed display
    const seedValue = this.modal.querySelector('.nft-edit-seed-value');
    if (this.currentNFT.seed) {
      seedValue.textContent = this.currentNFT.seed;
      console.log('[NFT Edit Modal] Set seed value:', this.currentNFT.seed);
    }

    // Add click handler to copy seed to clipboard
    this.setupSeedCopyHandler();

    // Clear new seed input and reset state
    const newSeedInput = this.modal.querySelector('#nft-edit-new-seed-input');
    if (newSeedInput) {
      newSeedInput.value = '';
      newSeedInput.style.borderColor = '#333';
    }
    this.newSeed = null;

    // Render traits list
    this.renderTraitsList();
  }

  updateNFTNumberDisplay() {
    const previewContainer = this.modal.querySelector('#nft-edit-preview-container');
    if (!previewContainer) return;

    // Remove existing NFT number display if any
    const existingNumberDisplay = previewContainer.querySelector('.nft-number-display');
    if (existingNumberDisplay) {
      existingNumberDisplay.remove();
    }

    // Only show NFT number if editing from collection (saved-seeds)
    if (this.sourceType === 'saved-seeds') {
      // Create NFT number display
      const numberDisplay = document.createElement('div');
      numberDisplay.className = 'nft-number-display';
      numberDisplay.style.cssText = `
        position: absolute;
        bottom: 8px;
        right: 8px;
        background: rgba(0, 0, 0, 0.8);
        color: #ffffff;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: bold;
        font-family: 'Archivo', sans-serif;
        z-index: 10;
        pointer-events: none;
        user-select: none;
      `;
      
      // Calculate NFT number (sourceIndex + 1 since it's 0-based)
      const nftNumber = this.sourceIndex + 1;
      numberDisplay.textContent = `#${nftNumber}`;
      
      // Make sure preview container has relative positioning
      previewContainer.style.position = 'relative';
      
      // Add the number display to the preview container
      previewContainer.appendChild(numberDisplay);
      
      console.log('[NFT Edit Modal] Added NFT number display:', nftNumber);
    } else {
      console.log('[NFT Edit Modal] Not showing NFT number - source type is:', this.sourceType);
    }
  }

  renderTraitsList() {
    const traitsList = this.modal.querySelector('.nft-edit-trait-info-list');
    traitsList.innerHTML = '';

    if (!this.currentNFT.traits || this.currentNFT.traits.length === 0) {
      traitsList.innerHTML = '<li style="color: #95a5a6; text-align: center; padding: 20px;">No traits available</li>';
      return;
    }

    console.log('[NFT Edit Modal] renderTraitsList - START');
    console.log('[NFT Edit Modal] Current NFT traits:', this.currentNFT.traits.map(t => ({ 
      layer: t.layer?.name || t.layer, 
      trait: t.trait?.name || t.trait 
    })));
    console.log('[NFT Edit Modal] Rendering traits list:', this.currentNFT.traits.length, 'traits');
    console.log('[NFT Edit Modal] Project data layers:', this.projectData?.traits?.length);

    // CRITICAL: Show ALL layers from projectData, not just the ones currently in the NFT
    // This allows editing an NFT to use traits from layers that weren't previously used
    if (!this.projectData || !this.projectData.traits || !Array.isArray(this.projectData.traits)) {
      console.warn('[NFT Edit Modal] No project data traits available');
      return;
    }

    // CRITICAL: Use the same order as NFT Traits section (background first, foreground last)
    // This matches the display order in updateTraitInfoPanel
    const allLayers = [...this.projectData.traits];

    // Render each layer - showing the trait used in this NFT, or 'none' if not used
    allLayers.forEach((projectLayer, displayIndex) => {
      // Use the same index as the original array
      const layerIndex = displayIndex;
      
      // Find if this layer has a trait in the current NFT
      let traitObj = this.currentNFT.traits.find(t => {
        if (t.layer && projectLayer.id && t.layer.id) return t.layer.id === projectLayer.id;
        return (t.layer && t.layer.name === projectLayer.name) || t.layer === projectLayer.name;
      });
      
      // If no trait found for this layer, use 'none'
      if (!traitObj) {
        traitObj = { layer: projectLayer, trait: { id: 'none', name: 'none' } };
      }
      
      const layer = traitObj.layer || projectLayer;
      const trait = traitObj.trait || { id: 'none', name: 'none' };

      console.log(`[NFT Edit Modal] Processing layer ${layerIndex}:`, {
        layer: layer,
        trait: trait,
        traitObj: traitObj,
        projectLayer: projectLayer
      });

      const layerName = projectLayer?.name || layer?.name || layer || 'Unknown';
      const traitName = trait?.name || trait || 'None';
      const traitId = trait?.id || trait || 'none';

      // Find the trait image from projectLayer (we already have it from the loop)
      let traitImageSrc = '';
      if (projectLayer && traitId !== 'none') {
        // CRITICAL: Use 'traits' property (not 'items') to match generate-nfts-ui.js
        const traitsList = projectLayer.traits || projectLayer.items || [];
        const projectTrait = traitsList.find(t => 
          t.id === traitId || 
          t.name === traitName ||
          t.id === trait?.id ||
          t.name === trait?.name
        );
        
        if (projectTrait) {
          // Get the image - could be in different properties (matching generate-nfts-ui.js)
          traitImageSrc = projectTrait.image || projectTrait.imageData || projectTrait.imageSrc || projectTrait.src || '';
          console.log('[NFT Edit Modal] Found trait image:', traitImageSrc ? 'YES' : 'NO', 'for trait:', traitName, 'in layer:', layerName);
        } else {
          // Also try to get image directly from trait object
          if (typeof trait === 'object' && trait) {
            traitImageSrc = trait.image || trait.imageData || trait.imageSrc || trait.src || '';
            if (traitImageSrc) {
              console.log('[NFT Edit Modal] Found trait image from trait object for:', traitName);
            }
          }
          
          if (!traitImageSrc && traitId !== 'none') {
            console.warn('[NFT Edit Modal] Could not find trait in project layer:', traitName, 'Layer:', layerName, 'Available traits:', traitsList.map(t => t.name));
          }
        }
      }

      const traitItem = document.createElement('li');
      traitItem.className = 'nft-trait-info-item';
      traitItem.style.cssText = `
        width: 141px;
        min-width: 141px;
        max-width: 141px;
        height: 165px;
        min-height: 165px;
        max-height: 165px;
        position: relative;
        display: flex;
        align-items: flex-end;
        justify-content: center;
        background: none;
        border-radius: 20px;
        padding: 0;
        box-shadow: none;
        margin-bottom: 10px;
        margin-left: auto;
        margin-right: auto;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      `;
      
      // Add hover effect
      traitItem.addEventListener('mouseenter', () => {
        traitItem.style.transform = 'translateY(-2px)';
        traitItem.style.boxShadow = '0 4px 12px rgba(139, 92, 246, 0.4)';
      });
      
      traitItem.addEventListener('mouseleave', () => {
        traitItem.style.transform = 'translateY(0)';
        traitItem.style.boxShadow = 'none';
      });

      // Create thumbnail container
      const thumbContainer = document.createElement('div');
      thumbContainer.className = 'nft-trait-thumb';
      thumbContainer.style.cssText = `
        width: 141px;
        height: 141px;
        border-radius: 20px;
        object-fit: cover;
        background: #333;
        border: 1px solid #222;
        position: absolute;
        top: 0;
        left: 0;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
      `;

      if (traitImageSrc) {
        const img = document.createElement('img');
        img.src = traitImageSrc;
        img.alt = traitName;
        img.style.cssText = `
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
          width: auto;
          height: auto;
        `;
        img.onerror = function() {
          this.style.display = 'none';
          const noImageDiv = document.createElement('div');
          noImageDiv.id = 'no-image-to-display';
          noImageDiv.textContent = 'No Image';
          noImageDiv.style.cssText = `
            color: #666;
            font-size: 12px;
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            display: flex;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            pointer-events: none;
          `;
          thumbContainer.appendChild(noImageDiv);
        };
        thumbContainer.appendChild(img);
      } else {
        const noImageDiv = document.createElement('div');
        noImageDiv.id = 'no-image-to-display';
        noImageDiv.textContent = 'No Image';
        noImageDiv.style.cssText = `
          color: #666;
          font-size: 12px;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
          pointer-events: none;
        `;
        thumbContainer.appendChild(noImageDiv);
      }

      // Create info text container (overlaid at bottom)
      const infoText = document.createElement('div');
      infoText.className = 'nft-trait-info-text';
      infoText.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        background: rgba(20, 20, 20, 0.75);
        color: #fff;
        border-radius: 0 0 20px 20px;
        padding: 10px 10px 14px 10px;
        z-index: 2;
        display: flex;
        flex-direction: column;
        gap: 2px;
        align-items: center;
        top: auto;
        pointer-events: none;
      `;

      // Layer name (top, grey)
      const layerNameDiv = document.createElement('div');
      layerNameDiv.id = 'edit-nft-trait-layer-name';
      layerNameDiv.style.cssText = `
        font-size: 8px;
        color: #95a5a6;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        line-height: 1.2;
        margin-bottom: 2px;
        width: 100%;
        text-align: left;
      `;
      layerNameDiv.textContent = layerName;

      // Trait name (bottom, white)
      const traitNameDiv = document.createElement('div');
      traitNameDiv.id = 'edit-nft-trait-name';
      traitNameDiv.style.cssText = `
        font-size: 11px;
        color: #fff;
        font-weight: 600;
        line-height: 1.2;
        width: 100%;
        text-align: left;
        word-wrap: break-word;
        overflow-wrap: break-word;
      `;
      traitNameDiv.textContent = traitName.length > 21 ? traitName.slice(0, 21) + '...' : traitName;
      if (traitName.length > 21) {
        // Remove title and add custom tooltip
        traitNameDiv.removeAttribute('title');
        traitNameDiv.classList.add('tooltip');
        let nameTooltip = traitNameDiv.querySelector('.tooltiptext');
        if (!nameTooltip) {
          nameTooltip = document.createElement('span');
          nameTooltip.className = 'tooltiptext';
          traitNameDiv.appendChild(nameTooltip);
        }
        nameTooltip.textContent = traitName;
      } else {
        traitNameDiv.removeAttribute('title');
      }

      infoText.appendChild(traitNameDiv);
      infoText.appendChild(layerNameDiv);

      // Rarity element (top left of thumbnail)
      const rarityElem = document.createElement('div');
      rarityElem.className = 'nft-edit-modal-trait-rarity';
      rarityElem.style.cssText = `
        position: absolute;
        top: 3px;
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
      
      // Get rarity from projectLayer (we already have it)
      let traitRarity = '';
      if (projectLayer && traitId !== 'none') {
        const traitsList = projectLayer.traits || projectLayer.items || [];
        const projectTrait = traitsList.find(t => 
          t.id === traitId || 
          t.name === traitName ||
          t.id === trait?.id ||
          t.name === trait?.name
        );
        
        if (projectTrait && typeof projectTrait.rarity !== 'undefined') {
          traitRarity = projectTrait.rarity;
        }
      }
      
      if (traitRarity === '' || traitRarity === null || typeof traitRarity === 'undefined') {
        rarityElem.textContent = '—';
      } else {
        rarityElem.textContent = parseFloat(traitRarity).toFixed(2) + '%';
      }
      
      // Edit button
      const editBtn = document.createElement('button');
      editBtn.className = 'nft-edit-modal-trait-edit-btn';
      editBtn.setAttribute('data-trait-index', layerIndex);
      editBtn.setAttribute('data-layer-name', layerName);
      editBtn.innerHTML = '<i class="fas fa-pencil-alt"></i> EDIT';
      editBtn.style.cssText = `
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
        transition: background 0.2s ease;
        pointer-events: auto;
        height: 20px;
        min-height: 20px;
        max-height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
      `;

      // Assemble the trait item
      traitItem.appendChild(thumbContainer);
      traitItem.appendChild(infoText);

      // Create a trait card container to group thumbnail, info, and edit button
      const traitCard = document.createElement('div');
      traitCard.className = 'edit-modal-nft-trait-card';
      traitCard.style.display = 'flex';
      traitCard.style.flexDirection = 'column';
      traitCard.style.alignItems = 'center';
      traitCard.style.justifyContent = 'flex-start';
      traitCard.style.width = '141px';
      traitCard.style.height = '165px';
      traitCard.style.minWidth = '141px';
      traitCard.style.minHeight = '165px';
      traitCard.style.maxWidth = '141px';
      traitCard.style.maxHeight = '165px';
      traitCard.style.position = 'relative';
      
      // Add only the required children in order
      traitCard.appendChild(infoText);
      traitCard.appendChild(thumbContainer);
      traitCard.appendChild(rarityElem);
      traitCard.appendChild(editBtn);

      // --- [FORBIDDEN OVERLAY LOGIC FOR EDIT MODAL] ---
      // Only check for forbidden overlays if this trait is not 'none'
      if (traitObj.trait && traitObj.trait.name !== 'none' && traitObj.trait.id !== 'none' && traitName !== 'None') {
        let forbidden = false;
        let forbiddenMsg = '';
        
        // Check for rule violations using the same logic as the main NFT modal
        if (this.projectData && this.projectData.rules && Array.isArray(this.projectData.rules)) {
          for (const rule of this.projectData.rules) {
            if (rule.type === 'never-combine' && rule.appliesTo === 'between-traits' && rule.firstTraits && rule.secondTraits) {
              // Check if this trait is in the forbidden pairs
              for (const ft of rule.firstTraits) {
                for (const st of rule.secondTraits) {
                  if ((trait.id === ft.id && layer.id === ft.layerId) || (trait.id === st.id && layer.id === st.layerId)) {
                    // Check if the other trait in the pair is also selected
                    const otherTraitId = trait.id === ft.id ? st.id : ft.id;
                    const otherLayerId = trait.id === ft.id ? st.layerId : ft.layerId;
                    
                    const otherTraitObj = this.currentNFT.traits.find(t => 
                      (t.trait && t.trait.id === otherTraitId && t.layer && t.layer.id === otherLayerId) ||
                      (t.trait && t.trait.name === otherTraitId && t.layer && t.layer.name === otherLayerId)
                    );
                    
                    if (otherTraitObj && otherTraitObj.trait && otherTraitObj.trait.name !== 'none') {
                      forbidden = true;
                      forbiddenMsg = `Forbidden: "${trait.name}" and "${otherTraitObj.trait.name}" should never be combined.`;
                      break;
                    }
                  }
                }
                if (forbidden) break;
              }
              if (forbidden) break;
            }
            
            // Check between-layers rules
            if (rule.type === 'never-combine' && rule.appliesTo === 'between-layers' && rule.firstLayerId && rule.secondLayerId) {
              const firstTrait = this.currentNFT.traits.find(t => 
                (t.layer && (t.layer.id === rule.firstLayerId || t.layer.name === rule.firstLayerName)) && 
                t.trait && t.trait.name !== 'none'
              );
              const secondTrait = this.currentNFT.traits.find(t => 
                (t.layer && (t.layer.id === rule.secondLayerId || t.layer.name === rule.secondLayerName)) && 
                t.trait && t.trait.name !== 'none'
              );
              
              if (firstTrait && secondTrait && 
                  (layer.id === rule.firstLayerId || layer.id === rule.secondLayerId || 
                   layer.name === rule.firstLayerName || layer.name === rule.secondLayerName)) {
                forbidden = true;
                forbiddenMsg = `Forbidden: Layer "${rule.firstLayerName || rule.firstLayerId}" and Layer "${rule.secondLayerName || rule.secondLayerId}" should never be combined.`;
                break;
              }
            }
            
            // Check layer-to-traits or traits-to-layer rules
            if ((rule.type === 'never-combine' && (rule.appliesTo === 'layer-to-traits' || rule.appliesTo === 'traits-to-layer')) && 
                rule.layerId && rule.traits) {
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
        
        // Add forbidden overlays if needed
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
          greyDiv.style.zIndex = '3';
          greyDiv.style.pointerEvents = 'none';
          greyDiv.style.borderRadius = '20px';
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
          forbiddenDiv.style.zIndex = '4';
          forbiddenDiv.innerHTML = `<svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="26" stroke="#ff2222" stroke-width="8" fill="none"/><line x1="15" y1="45" x2="45" y2="15" stroke="#ff2222" stroke-width="8" stroke-linecap="round"/></svg>`;
          thumbContainer.appendChild(forbiddenDiv);
          
          // Remove title and add custom tooltip with forbidden message
          traitCard.removeAttribute('title');
          traitCard.classList.add('tooltip');
          let cardTooltip = traitCard.querySelector('.tooltiptext');
          if (!cardTooltip) {
            cardTooltip = document.createElement('span');
            cardTooltip.className = 'tooltiptext';
            traitCard.appendChild(cardTooltip);
          }
          cardTooltip.textContent = forbiddenMsg || 'This trait is forbidden by current rules.';
          
          console.log(`[NFT Edit Modal] Added forbidden overlay for trait: ${traitName} (Layer: ${layerName}) - ${forbiddenMsg}`);
        } else {
          traitCard.removeAttribute('title');
          traitCard.classList.remove('tooltip');
          const cardTooltip = traitCard.querySelector('.tooltiptext');
          if (cardTooltip) cardTooltip.remove();
        }
      }

      traitsList.appendChild(traitCard);

      // Add event listener to entire trait card for full-size preview
      traitCard.addEventListener('click', (e) => {
        // Only open preview if not clicking the edit button
        if (!e.target.closest('.nft-edit-modal-trait-edit-btn')) {
          if (traitImageSrc) {
            e.stopPropagation(); // Prevent global trait-image-preview.js from triggering
            this.showTraitPreview(traitImageSrc, layerName, traitName);
          }
        }
      });

      // Add event listener to edit button
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent trait item click
        this.showTraitSelectionModal(layerIndex);
      });
    });
  }

  showTraitPreview(imageSrc, layerName, traitName) {
    console.log('[NFT Edit Modal] Opening trait preview for:', traitName);

    // Use Trait Full-Size Popup for visual consistency
    const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
    if (generateNftsUI && generateNftsUI.showTraitFullSizePopup) {
      const traitObj = { 
        trait: { image: imageSrc, imageData: imageSrc, name: traitName }, 
        layer: { name: layerName } 
      };
      generateNftsUI.showTraitFullSizePopup(traitObj, layerName, traitName);
      return;
    }

    // Fallback: Create preview modal overlay
    const previewModal = document.createElement('div');
    previewModal.className = 'nft-trait-preview-modal';
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

    // Close functionality
    const closeModal = () => {
      previewModal.remove();
    };

    closeBtn.addEventListener('click', closeModal);
    
    // Close on overlay click (but not on image click)
    previewModal.addEventListener('click', (e) => {
      if (e.target === previewModal) {
        closeModal();
      }
    });

    // Close on ESC key
    const escHandler = (e) => {
      if (e.key === 'Escape' || e.key === 'Esc') {
        closeModal();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Assemble modal
    imageContainer.appendChild(img);
    contentContainer.appendChild(title);
    contentContainer.appendChild(imageContainer);
    previewModal.appendChild(closeBtn);
    previewModal.appendChild(contentContainer);

    // Add to DOM
    document.body.appendChild(previewModal);

    // Fade in animation
    previewModal.style.opacity = '0';
    setTimeout(() => {
      previewModal.style.transition = 'opacity 0.2s ease';
      previewModal.style.opacity = '1';
    }, 10);
  }

  showTraitSelectionModal(layerIndexOrLayerName) {
    // layerIndexOrLayerName can be either the layer index in projectData.traits or the layer name
    let layerName;
    let traitIndexInNFT;
    
    if (typeof layerIndexOrLayerName === 'number') {
      // It's an index - get the layer from projectData
      const layer = this.projectData?.traits?.[layerIndexOrLayerName];
      layerName = layer?.name || 'Unknown';
      
      // Find the trait index in currentNFT.traits for this layer
      traitIndexInNFT = this.currentNFT.traits.findIndex(t => {
        if (t.layer && layer.id && t.layer.id) return t.layer.id === layer.id;
        return (t.layer && t.layer.name === layer.name) || t.layer === layer.name;
      });
    } else {
      // It's a layer name
      layerName = layerIndexOrLayerName;
      
      // Find the trait index in currentNFT.traits for this layer
      traitIndexInNFT = this.currentNFT.traits.findIndex(t => {
        const tLayerName = t.layer?.name || t.layer;
        return tLayerName === layerName;
      });
    }
    
    console.log('[NFT Edit Modal] Opening trait selection for layer:', layerName, 'traitIndexInNFT:', traitIndexInNFT);

    // Use the existing trait selection modal from generateNftsUI
    if (window.NFTApp && window.NFTApp.getModule('generateNftsUI')) {
      const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
      
      // Store reference to this modal for callback
      window._nftEditModalInstance = this;
      window._nftEditTraitIndex = traitIndexInNFT >= 0 ? traitIndexInNFT : null;

      // CRITICAL: Remove any existing trait change listeners to prevent duplicates
      if (this.traitChangeHandler) {
        document.removeEventListener('traitChanged', this.traitChangeHandler);
      }
      if (this.traitModalClosedHandler) {
        document.removeEventListener('traitModalClosed', this.traitModalClosedHandler);
      }

      // Create new handlers for this trait selection
      this.traitChangeHandler = async (e) => {
        console.log('[NFT Edit Modal] traitChanged event received', e.detail);
        
        // Get the updated NFT from the event or window.lastGeneratedNFT
        const updatedNFT = e.detail?.nft || window.lastGeneratedNFT;
        
        console.log('[NFT Edit Modal] Current NFT before update:', {
          seed: this.currentNFT.seed,
          traits: this.currentNFT.traits.map(t => ({ layer: t.layer?.name || t.layer, trait: t.trait?.name || t.trait }))
        });
        
        console.log('[NFT Edit Modal] Updated NFT from event:', {
          seed: updatedNFT?.seed,
          traits: updatedNFT?.traits?.map(t => ({ layer: t.layer?.name || t.layer, trait: t.trait?.name || t.trait })),
          hasImageData: !!updatedNFT?.imageData
        });
        
        if (updatedNFT && updatedNFT.traits) {
          console.log('[NFT Edit Modal] Updating traits from event');
          
          // Check if nft reference is the same
          console.log('[NFT Edit Modal] NFT reference check:', {
            isSameObject: updatedNFT === this.currentNFT,
            currentNFTId: this.currentNFT.id,
            updatedNFTId: updatedNFT.id
          });
          
          // CRITICAL: Preserve full trait objects with layer references from projectData
          // This ensures all traits are properly loaded with their image paths
          // STRATEGY: Start with all existing traits from currentNFT, then update only the changed one
          
          console.log('[NFT Edit Modal] Before trait preservation:', {
            currentNFTTraitsCount: this.currentNFT.traits.length,
            updatedNFTTraitsCount: updatedNFT.traits.length,
            projectDataLayersCount: this.projectData?.traits?.length || 0
          });
          
          // Create a map of existing traits by layer for easy lookup
          // Use multiple keys to ensure we can match layers correctly
          const existingTraitsMap = new Map();
          this.currentNFT.traits.forEach(traitInfo => {
            const layerId = traitInfo.layer?.id;
            const layerName = traitInfo.layer?.name || traitInfo.layer;
            if (layerId) existingTraitsMap.set(`id:${layerId}`, traitInfo);
            if (layerName) existingTraitsMap.set(`name:${layerName}`, traitInfo);
            // Also try to match by the layer object itself
            if (traitInfo.layer && typeof traitInfo.layer === 'object') {
              const layerKey = traitInfo.layer.id || traitInfo.layer.name;
              if (layerKey) existingTraitsMap.set(layerKey, traitInfo);
            }
          });
          
          // Create a map of updated traits from the event to identify which one changed
          const updatedTraitsMap = new Map();
          updatedNFT.traits.forEach(traitInfo => {
            const layerId = traitInfo.layer?.id;
            const layerName = traitInfo.layer?.name || traitInfo.layer;
            if (layerId) updatedTraitsMap.set(`id:${layerId}`, traitInfo);
            if (layerName) updatedTraitsMap.set(`name:${layerName}`, traitInfo);
            // Also try to match by the layer object itself
            if (traitInfo.layer && typeof traitInfo.layer === 'object') {
              const layerKey = traitInfo.layer.id || traitInfo.layer.name;
              if (layerKey) updatedTraitsMap.set(layerKey, traitInfo);
            }
          });
          
          console.log('[NFT Edit Modal] Trait maps created:', {
            existingTraitsKeys: Array.from(existingTraitsMap.keys()),
            updatedTraitsKeys: Array.from(updatedTraitsMap.keys())
          });
          
          // Build preserved traits: use existing traits, but update with any changes from updatedNFT
          const preservedTraits = [];
          
          // Process all layers from projectData to ensure we have a trait for each layer
          if (this.projectData && this.projectData.traits) {
            this.projectData.traits.forEach(layerData => {
              const layerId = layerData.id;
              const layerName = layerData.name;
              
              // Try multiple ways to find the updated trait
              let updatedTraitInfo = updatedTraitsMap.get(`id:${layerId}`) || 
                                    updatedTraitsMap.get(`name:${layerName}`) ||
                                    updatedTraitsMap.get(layerId) ||
                                    updatedTraitsMap.get(layerName);
              
              // Also try to find by matching layer objects
              if (!updatedTraitInfo) {
                updatedTraitsMap.forEach((traitInfo, key) => {
                  if (!updatedTraitInfo) {
                    const traitLayer = traitInfo.layer;
                    if (traitLayer && typeof traitLayer === 'object') {
                      if (traitLayer.id === layerId || traitLayer.name === layerName) {
                        updatedTraitInfo = traitInfo;
                      }
                    } else if (traitLayer === layerId || traitLayer === layerName) {
                      updatedTraitInfo = traitInfo;
                    }
                  }
                });
              }
              
              if (updatedTraitInfo) {
                // This layer has an update - use the updated trait from projectData
                const projectTrait = layerData.traits.find(t => 
                  t.id === updatedTraitInfo.trait?.id || t.name === updatedTraitInfo.trait?.name ||
                  (typeof updatedTraitInfo.trait === 'string' && (t.name === updatedTraitInfo.trait || t.id === updatedTraitInfo.trait))
                );
                
                if (projectTrait) {
                  preservedTraits.push({
                    layer: layerData,
                    trait: projectTrait
                  });
                  console.log('[NFT Edit Modal] Preserved updated trait:', {
                    layer: layerData.name,
                    trait: projectTrait.name || projectTrait.id,
                    hasImage: !!(projectTrait.image || projectTrait.imageData)
                  });
                } else {
                  // Trait not found in projectData, use existing trait if available
                  const existingTrait = existingTraitsMap.get(`id:${layerId}`) || 
                                       existingTraitsMap.get(`name:${layerName}`) ||
                                       existingTraitsMap.get(layerId) ||
                                       existingTraitsMap.get(layerName);
                  if (existingTrait) {
                    // Update the layer reference to use full layerData
                    preservedTraits.push({
                      layer: layerData,
                      trait: existingTrait.trait
                    });
                    console.log('[NFT Edit Modal] Preserved existing trait (updated layer ref):', {
                      layer: layerData.name,
                      trait: existingTrait.trait?.name || existingTrait.trait
                    });
                  } else {
                    console.warn('[NFT Edit Modal] Could not find trait for layer:', layerData.name);
                  }
                }
              } else {
                // No update for this layer - preserve existing trait
                const existingTrait = existingTraitsMap.get(`id:${layerId}`) || 
                                     existingTraitsMap.get(`name:${layerName}`) ||
                                     existingTraitsMap.get(layerId) ||
                                     existingTraitsMap.get(layerName);
                if (existingTrait) {
                  // Update the layer reference to use full layerData and ensure trait has image path
                  const existingTraitObj = existingTrait.trait;
                  let finalTrait = existingTraitObj;
                  
                  // If trait doesn't have image path, try to find it in projectData
                  if (!(existingTraitObj?.image || existingTraitObj?.imageData)) {
                    const projectTrait = layerData.traits.find(t => 
                      t.id === existingTraitObj?.id || t.name === existingTraitObj?.name ||
                      (typeof existingTraitObj === 'string' && (t.name === existingTraitObj || t.id === existingTraitObj))
                    );
                    if (projectTrait) {
                      finalTrait = projectTrait;
                    }
                  }
                  
                  preservedTraits.push({
                    layer: layerData,
                    trait: finalTrait
                  });
                  console.log('[NFT Edit Modal] Preserved existing trait:', {
                    layer: layerData.name,
                    trait: finalTrait?.name || finalTrait?.id || finalTrait,
                    hasImage: !!(finalTrait?.image || finalTrait?.imageData)
                  });
                } else {
                  console.warn('[NFT Edit Modal] No existing trait found for layer:', layerData.name);
                }
              }
            });
          } else {
            // Fallback: if no projectData, merge existing and updated traits
            const allLayers = new Set();
            existingTraitsMap.forEach((trait, key) => allLayers.add(key));
            updatedTraitsMap.forEach((trait, key) => allLayers.add(key));
            
            allLayers.forEach(layerKey => {
              const updatedTraitInfo = updatedTraitsMap.get(layerKey);
              if (updatedTraitInfo) {
                preservedTraits.push(updatedTraitInfo);
              } else {
                const existingTrait = existingTraitsMap.get(layerKey);
                if (existingTrait) {
                  preservedTraits.push(existingTrait);
                }
              }
            });
          }
          
          // Update traits with preserved full objects
          this.currentNFT.traits = preservedTraits;
          
          // Update the image data if available
          if (updatedNFT.imageData) {
            this.currentNFT.imageData = updatedNFT.imageData;
            this.currentNFT.thumbnail = updatedNFT.imageData;
          }
          
          console.log('[NFT Edit Modal] After copying traits:', {
            traits: this.currentNFT.traits.map(t => ({ 
              layer: t.layer?.name || t.layer, 
              trait: t.trait?.name || t.trait,
              hasImage: !!(t.trait?.image || t.trait?.imageData),
              hasLayer: !!t.layer
            }))
          });
          
          // Mark as changed (this shows the Update button)
          this.markAsChanged();
          
          // Re-generate the NFT preview with full trait objects
          await this.regenerateNFTPreview();
          
          // Re-render traits list to show new selection
          this.renderTraitsList();
          
          console.log('[NFT Edit Modal] Trait update complete');
        } else {
          console.error('[NFT Edit Modal] No valid NFT data in event');
        }
      };

      this.traitModalClosedHandler = () => {
        console.log('[NFT Edit Modal] traitModalClosed event received');
        // Clean up event listeners when modal closes
        if (this.traitChangeHandler) {
          document.removeEventListener('traitChanged', this.traitChangeHandler);
          this.traitChangeHandler = null;
        }
        if (this.traitModalClosedHandler) {
          document.removeEventListener('traitModalClosed', this.traitModalClosedHandler);
          this.traitModalClosedHandler = null;
        }
      };

      // Add the event listeners
      document.addEventListener('traitChanged', this.traitChangeHandler);
      document.addEventListener('traitModalClosed', this.traitModalClosedHandler);

      // Show the trait selection modal
      // Pass the layer index in projectData.traits (not trait index in NFT)
      const layerIndexInProject = this.projectData?.traits?.findIndex(l => 
        l.name === layerName
      );
      
      generateNftsUI.showTraitSelectionModal(
        layerName,
        layerIndexInProject >= 0 ? layerIndexInProject : 0,
        this.currentNFT,
        this.projectData
      );

      // CRITICAL FIX: Increase z-index of trait selection modal to appear above everything
      setTimeout(() => {
        const traitSelectionModal = document.getElementById('trait-selection-modal');
        if (traitSelectionModal) {
          // Set to 1000000 to ensure it's above saved seeds modal (10000) and edit modal (100000)
          traitSelectionModal.style.zIndex = '1000000';
          traitSelectionModal.style.position = 'fixed'; // Ensure it's positioned correctly
          console.log('[NFT Edit Modal] Trait selection modal z-index set to 1000000');
        }
      }, 100);
    }
  }


  async regenerateNFTPreview() {
    console.log('[NFT Edit Modal] Regenerating NFT preview with current traits');

    try {
      // Create canvas and render the NFT with current traits
      const canvas = document.createElement('canvas');
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext('2d');
      
      console.log('[NFT Edit Modal] Starting regenerateNFTPreview with traits:', {
        totalTraits: this.currentNFT.traits.length,
        traits: this.currentNFT.traits.map(t => ({
          layer: t.layer?.name || t.layer?.id || t.layer,
          trait: t.trait?.name || t.trait?.id || t.trait,
          hasTrait: !!t.trait,
          hasLayer: !!t.layer
        }))
      });
      
      // CRITICAL: Sort traits by layer order to ensure correct stacking order
      // This ensures that when a trait is replaced, it takes the exact same relative position
      const traitsToRender = [...this.currentNFT.traits];
      if (this.projectData && this.projectData.traits && Array.isArray(this.projectData.traits)) {
        traitsToRender.sort((a, b) => {
          const layerA = this.projectData.traits.find(l => 
            l.id === a.layer?.id || l.name === a.layer?.name || l.name === a.layer
          );
          const layerB = this.projectData.traits.find(l => 
            l.id === b.layer?.id || l.name === b.layer?.name || l.name === b.layer
          );
          
          // Sort by layer order (background first, foreground last)
          const orderA = layerA ? (layerA.order || 0) : 0;
          const orderB = layerB ? (layerB.order || 0) : 0;
          return orderA - orderB;
        });
      }
      
      console.log('[NFT Edit Modal] Traits to render (after sorting):', {
        totalTraits: traitsToRender.length,
        traits: traitsToRender.map(t => ({
          layer: t.layer?.name || t.layer?.id || t.layer,
          trait: t.trait?.name || t.trait?.id || t.trait,
          order: this.projectData?.traits?.find(l => 
            l.id === t.layer?.id || l.name === t.layer?.name
          )?.order || 0
        }))
      });
      
      // Load all trait images and render them
      const imagePromises = [];
      let traitsWithImages = 0;
      let traitsWithoutImages = 0;
      
      for (const traitInfo of traitsToRender) {
        const trait = traitInfo.trait;
        
        // Skip 'none' traits
        if (!trait || trait === 'none' || trait.name === 'none' || trait.id === 'none') {
          console.log('[NFT Edit Modal] Skipping "none" trait for layer:', traitInfo.layer?.name || traitInfo.layer);
          continue;
        }
        
        // Get the trait image
        let imagePath = trait.image || trait.imageData || trait.imageSrc || trait.src;
        
        if (!imagePath && this.projectData && this.projectData.traits) {
          // Try to find the trait in project data
          const layerData = this.projectData.traits.find(l => 
            l.id === traitInfo.layer?.id || l.name === traitInfo.layer?.name || l.name === traitInfo.layer
          );
          
          if (layerData && layerData.traits) {
            const projectTrait = layerData.traits.find(t => 
              t.id === trait.id || t.name === trait.name ||
              (typeof trait === 'string' && (t.name === trait || t.id === trait))
            );
            
            if (projectTrait) {
              imagePath = projectTrait.image || projectTrait.imageData || projectTrait.imageSrc || projectTrait.src;
            } else {
              console.warn('[NFT Edit Modal] Trait not found in projectData:', {
                layerName: layerData?.name,
                traitName: trait?.name || trait?.id || trait,
                traitType: typeof trait,
                availableTraits: layerData.traits.map(t => t.name || t.id)
              });
            }
          } else {
            console.warn('[NFT Edit Modal] Layer not found in projectData:', {
              layerId: traitInfo.layer?.id,
              layerName: traitInfo.layer?.name || traitInfo.layer,
              layerType: typeof traitInfo.layer,
              availableLayers: this.projectData.traits.map(l => ({ id: l.id, name: l.name }))
            });
          }
        }
        
        if (imagePath) {
          traitsWithImages++;
          console.log('[NFT Edit Modal] Loading trait image:', {
            layer: traitInfo.layer?.name || traitInfo.layer,
            trait: trait?.name || trait?.id,
            imagePath: imagePath.substring(0, 50) + '...'
          });
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const promise = new Promise((resolve, reject) => {
            img.onload = () => {
              console.log('[NFT Edit Modal] Successfully loaded image for:', trait?.name || trait?.id, 'layer:', traitInfo.layer?.name || traitInfo.layer);
              resolve({ img, traitInfo });
            };
            img.onerror = () => {
              console.error('[NFT Edit Modal] Failed to load image:', imagePath, 'for trait:', trait?.name || trait?.id);
              resolve({ img: null, traitInfo });
            };
          });
          img.src = imagePath;
          imagePromises.push(promise);
        } else {
          traitsWithoutImages++;
          console.error('[NFT Edit Modal] No image path found for trait:', {
            layer: traitInfo.layer?.name || traitInfo.layer,
            trait: trait?.name || trait?.id,
            traitType: typeof trait,
            traitHasImage: !!(trait?.image || trait?.imageData),
            layerHasImage: !!(traitInfo.layer?.image || traitInfo.layer?.imageData),
            layerId: traitInfo.layer?.id,
            traitId: trait?.id
          });
        }
      }
      
      console.log('[NFT Edit Modal] Image loading summary:', {
        totalTraits: traitsToRender.length,
        traitsWithImages,
        traitsWithoutImages,
        imagePromisesCount: imagePromises.length
      });
      
      // Wait for all images to load, then render
      const loadedImages = await Promise.all(imagePromises);
      console.log('[NFT Edit Modal] All images loaded, rendering preview...', {
        loadedImagesCount: loadedImages.length,
        imagesWithData: loadedImages.filter(li => li.img !== null).length,
        imagesWithoutData: loadedImages.filter(li => li.img === null).length
      });
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw each image in order (sorted by layer order)
      for (const { img, traitInfo } of loadedImages) {
        if (img) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        }
      }
      
      // Get the image data
      const newImageData = canvas.toDataURL('image/png');
      
      if (newImageData) {
        // Update the preview image
        const previewImg = this.modal.querySelector('#nft-edit-preview-container img');
        if (previewImg) {
          previewImg.src = newImageData;
        }
        
        // Update the current NFT's image data
        this.currentNFT.imageData = newImageData;
        this.currentNFT.thumbnail = newImageData;
        
        // CRITICAL: Generate a new seed for the updated traits
        // This ensures each trait combination has a unique seed
        if (this.projectData) {
          try {
            console.log('[NFT Edit Modal] Generating new seed for updated traits...');
            const generateNftsModule = window.NFTApp.getModule('generateNfts');
            if (generateNftsModule) {
              const newSeed = generateNftsModule.computeDeterministicSeed(this.projectData, this.currentNFT);
              if (newSeed) {
                this.currentNFT.seed = newSeed;
                console.log('[NFT Edit Modal] New seed generated:', newSeed);
                
                // Update the seed display in the modal
                const seedValue = this.modal.querySelector('.nft-edit-seed-value');
                if (seedValue) {
                  seedValue.textContent = newSeed;
                }
              }
            }
          } catch (error) {
            console.error('[NFT Edit Modal] Error generating new seed:', error);
          }
        }
        
        console.log('[NFT Edit Modal] Preview regenerated successfully with custom traits');
      }
    } catch (error) {
      console.error('[NFT Edit Modal] Error regenerating preview:', error);
    }
  }

  async handleNewSeedInput(newSeedValue) {
    console.log('[NFT Edit Modal] New seed input:', newSeedValue);
    
    const newSeedInput = this.modal.querySelector('#nft-edit-new-seed-input');
    
    if (newSeedValue && newSeedValue.trim() !== '') {
      const trimmedSeed = newSeedValue.trim();
      
      // Validate seed format first
      if (!this.isValidSeedFormat(trimmedSeed)) {
        console.log('[NFT Edit Modal] Invalid seed format:', trimmedSeed);
        if (newSeedInput) {
          newSeedInput.style.borderColor = '#e74c3c'; // Red for invalid
        }
        return;
      }
      
      // Highlight the input field
      if (newSeedInput) {
        newSeedInput.style.borderColor = '#ff6b35';
      }
      
      // Mark as changed to enable Update NFT button
      this.markAsChanged();
      
      // Store the new seed for later use
      this.newSeed = trimmedSeed;
      
      console.log('[NFT Edit Modal] New seed detected:', this.newSeed);
      
      // Generate and update the NFT preview with the new seed
      try {
        await this.updatePreviewWithNewSeed(trimmedSeed);
      } catch (error) {
        console.error('[NFT Edit Modal] Error updating preview with new seed:', error);
      }
    } else {
      if (newSeedInput) {
        newSeedInput.style.borderColor = '#333';
      }
      
      // Clear the new seed and restore original preview
      this.newSeed = null;
      this.restoreOriginalPreview();
    }
  }
  
  async updatePreviewWithNewSeed(seed) {
    try {
      console.log('[NFT Edit Modal] Updating preview with seed:', seed);
      
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      
      if (!generateNftsModule || !projectData) {
        console.error('[NFT Edit Modal] Generate NFTs module or project data not available');
        return;
      }
      
      // Generate NFT with the new seed
      const nft = await generateNftsModule.generateSingleNFT(projectData, false, seed, false);
      
      if (nft && nft.imageData) {
        // Update the preview image
        const previewImg = this.modal.querySelector('#nft-edit-preview-container img');
        if (previewImg) {
          previewImg.src = nft.imageData;
          console.log('[NFT Edit Modal] Preview updated with new seed');
        }
        
        // Update current NFT to reflect the new seed (temporarily for preview)
        this.currentNFT.imageData = nft.imageData;
        this.currentNFT.thumbnail = nft.imageData;
        
        // Update the traits to match the new NFT
        if (nft.traits && Array.isArray(nft.traits)) {
          this.currentNFT.traits = nft.traits;
          console.log('[NFT Edit Modal] Traits updated with new seed');
          
          // Re-render the traits list to show the new traits
          const traitsContainer = this.modal.querySelector('.nft-edit-trait-info-list');
          if (traitsContainer) {
            this.renderTraitsList(nft);
          }
        }
      }
    } catch (error) {
      console.error('[NFT Edit Modal] Error generating NFT from new seed:', error);
    }
  }
  
  restoreOriginalPreview() {
    console.log('[NFT Edit Modal] Restoring original preview');
    
    // Restore original imageData
    if (this.originalNFT) {
      this.currentNFT.imageData = this.originalNFT.imageData;
      this.currentNFT.thumbnail = this.originalNFT.thumbnail;
      
      // Update the preview image
      const previewImg = this.modal.querySelector('#nft-edit-preview-container img');
      if (previewImg && this.originalNFT.imageData) {
        previewImg.src = this.originalNFT.imageData;
      }
    }
  }

  markAsChanged() {
    this.hasChanges = true;
    
    // Show the Update NFT button - ensure it's always visible
    const updateBtn = this.modal.querySelector('.nft-edit-update-btn');
    if (updateBtn) {
      updateBtn.style.visibility = 'visible';
      updateBtn.style.display = 'block';
      // Force display even if there are conflicting styles
      updateBtn.style.setProperty('visibility', 'visible', 'important');
      updateBtn.style.setProperty('display', 'block', 'important');
    }
    
    console.log('[NFT Edit Modal] NFT marked as changed, Update button should be visible');
  }

  async updateNFT() {
    console.log('[NFT Edit Modal] ===== UPDATE NFT STARTED =====');
    console.log('[NFT Edit Modal] Source:', { sourceType: this.sourceType, sourceIndex: this.sourceIndex });
    console.log('[NFT Edit Modal] Has changes:', this.hasChanges);
    console.log('[NFT Edit Modal] New seed:', this.newSeed);
    console.log('[NFT Edit Modal] Current NFT seed:', this.currentNFT?.seed);

    if (!this.hasChanges) {
      console.log('[NFT Edit Modal] No changes detected, closing modal');
      this.close();
      return;
    }

    // Prevent multiple simultaneous updates
    if (this.isUpdating) {
      console.log('[NFT Edit Modal] Update already in progress, ignoring');
      return;
    }
    this.isUpdating = true;

    // Show loading state
    const updateBtn = this.modal.querySelector('.nft-edit-update-btn');
    const originalText = updateBtn.textContent;
    updateBtn.innerHTML = 'Updating<span class="loading-dots">...</span>';
    updateBtn.disabled = true;
    updateBtn.style.opacity = '0.6';
    
    console.log('[NFT Edit Modal] Loading state set, starting update process...');

    try {
      console.log('[NFT Edit Modal] Starting seed replacement check...');
      
      // Check if we need to replace the seed (either manually entered or from trait changes)
      let needsSeedReplacement = false;
      let newSeedToUse = null;
      
      // Case 1: User manually entered a new seed
      if (this.newSeed && this.newSeed !== this.currentNFT.seed) {
        console.log('[NFT Edit Modal] Case 1: User manually entered new seed:', this.newSeed);
        needsSeedReplacement = true;
        newSeedToUse = this.newSeed;
      }
      // Case 2: Traits were edited, need to generate new seed based on edited traits
      else if (this.hasChanges && this.currentNFT.traits) {
        console.log('[NFT Edit Modal] Case 2: Traits were edited, generating new seed based on current traits');
        needsSeedReplacement = true;
        newSeedToUse = null; // Will be generated from traits
      }
      
      console.log('[NFT Edit Modal] Seed replacement needed:', needsSeedReplacement);
      
      // SIMPLE APPROACH: Just calculate the new seed and update the NFT
      console.log('[NFT Edit Modal] Using simple seed calculation approach...');
      
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData) {
        throw new Error('Project data not available');
      }
      
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule || !generateNftsModule.computeDeterministicSeed) {
        throw new Error('NFT generation module not available');
      }
      
      let newSeed = null;
      
      // Case 1: User manually entered a new seed
      if (this.newSeed && this.newSeed !== this.currentNFT.seed) {
        console.log('[NFT Edit Modal] Case 1: Validating manually entered seed:', this.newSeed);
        
        // Validate seed format
        if (!this.isValidSeedFormat(this.newSeed)) {
          console.log('[NFT Edit Modal] Invalid seed format:', this.newSeed);
          
          // Show error message and keep modal open
          if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              'Invalid seed format. Seeds should be numeric (e.g., 01020304)',
              'error',
              4000
            );
          }
          
          // Clear the invalid seed and return without closing modal
          this.newSeed = null;
          return;
        }
        
        console.log('[NFT Edit Modal] Case 1: Using manually entered seed:', this.newSeed);
        newSeed = this.newSeed;
      }
      // Case 2: Traits were edited, calculate new seed based on edited traits
      else if (this.hasChanges && this.currentNFT.traits) {
        console.log('[NFT Edit Modal] Case 2: Calculating new seed from edited traits');
        newSeed = generateNftsModule.computeDeterministicSeed(projectData, this.currentNFT);
        console.log('[NFT Edit Modal] New seed calculated:', newSeed);
      }
      
      if (!newSeed) {
        throw new Error('Could not determine new seed');
      }
      
      // Generate the new NFT with the new seed to get the updated image
      // ALWAYS generate the image when the seed changes, regardless of how it changed
      let updatedNFT = null;
      if (newSeed && newSeed !== this.currentNFT.seed) {
        console.log('[NFT Edit Modal] Generating new NFT with seed:', newSeed);
        updatedNFT = await generateNftsModule.generateSingleNFT(projectData, false, newSeed, false);
        console.log('[NFT Edit Modal] New NFT generated:', updatedNFT);
      }
      
      // CRITICAL: Use the current NFT's imageData if available (from regenerateNFTPreview)
      // This ensures the updated image is always included when traits are edited
      const finalImageData = updatedNFT?.imageData || this.currentNFT.imageData || null;
      
      // Create a lightweight NFT object for seed replacement
      const lightweightNFT = {
        seed: newSeed,
        traits: updatedNFT?.traits || this.currentNFT.traits || [],
        rarity: updatedNFT?.rarity || this.currentNFT.rarity || 'common',
        rarityScore: updatedNFT?.rarityScore || this.currentNFT.rarityScore || 0,
        imageData: finalImageData,
        thumbnail: finalImageData,
        timestamp: Date.now()
      };
      
      console.log('[NFT Edit Modal] Created NFT for seed replacement:', {
        seed: lightweightNFT.seed,
        traits: lightweightNFT.traits,
        rarity: lightweightNFT.rarity,
        hasImageData: !!lightweightNFT.imageData,
        imageDataSource: updatedNFT?.imageData ? 'from new seed generation' : (this.currentNFT.imageData ? 'from current NFT (regenerated)' : 'none')
      });
      
      // Update the current NFT with the new seed and image
      this.currentNFT.seed = newSeed;
      if (finalImageData) {
        this.currentNFT.imageData = finalImageData;
        this.currentNFT.thumbnail = finalImageData;
      }
      console.log('[NFT Edit Modal] NFT updated with new seed and image:', newSeed);
      
      // Clear the newSeed to prevent re-processing
      this.newSeed = null;

      // Call the update callback immediately (no delays)
      console.log('[NFT Edit Modal] Calling update callback immediately...');
      if (this.onUpdateCallback) {
        console.log('[NFT Edit Modal] Update callback available, calling it...');
        console.log('[NFT Edit Modal] Lightweight NFT data:', {
          seed: lightweightNFT.seed,
          traits: lightweightNFT.traits,
          rarity: lightweightNFT.rarity,
          timestamp: lightweightNFT.timestamp
        });
        
        // Call the callback immediately without timeout or delays
        this.onUpdateCallback(lightweightNFT, this.sourceIndex);
        console.log('[NFT Edit Modal] Update callback completed immediately');
      } else {
        console.log('[NFT Edit Modal] No update callback available');
      }

      // Note: Notification is now shown by the update callback after card rendering completes

      // Close modal immediately
      console.log('[NFT Edit Modal] Closing modal immediately...');
      this.close();
    } catch (error) {
      console.error('[NFT Edit Modal] ===== ERROR IN UPDATE NFT =====');
      console.error('[NFT Edit Modal] Error details:', error);
      console.error('[NFT Edit Modal] Error message:', error.message);
      console.error('[NFT Edit Modal] Error stack:', error.stack);
      
      // Check if this is a critical error that could cause crash
      const isCritical = error.message && (
        error.message.toLowerCase().includes('out of memory') ||
        error.message.toLowerCase().includes('stack overflow') ||
        error.message.toLowerCase().includes('maximum call stack') ||
        error.message.toLowerCase().includes('quotaexceedederror') ||
        error.message.toLowerCase().includes('allocation failed')
      );
      
      // If critical, show save warning
      if (isCritical && window.ErrorHandler) {
        const errorDetails = {
          message: error.message,
          stack: error.stack,
          timestamp: new Date(),
          url: 'nft-edit-modal.js',
          line: 1688
        };
        if (typeof window.ErrorHandler.showSaveWarning === 'function') {
          window.ErrorHandler.showSaveWarning(errorDetails);
        }
      }
      
      // Show specific error message based on error type
      let errorMessage = 'Error updating NFT';
      if (error.message && error.message.includes('Invalid string length')) {
        errorMessage = 'Failed to save NFT changes due to storage limitations. Please try clearing some data.';
      } else if (error.message && error.message.includes('timeout')) {
        errorMessage = 'Update timed out. Please try again.';
      } else if (error.message) {
        errorMessage = 'Error updating NFT: ' + error.message;
      }
      
      // Add critical error warning to message
      if (isCritical) {
        errorMessage = '⚠️ CRITICAL ERROR: ' + errorMessage + '\n\n⚠️ Please save your project immediately!';
      }
      
      console.log('[NFT Edit Modal] Showing error notification:', errorMessage);
      
      // Show error notification
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          errorMessage,
          'error',
          8000
        );
      } else {
        alert(errorMessage);
      }

      // Reset button state
      console.log('[NFT Edit Modal] Resetting button state...');
      updateBtn.innerHTML = originalText;
      updateBtn.disabled = false;
      updateBtn.style.opacity = '1';
    } finally {
      // Ensure button state is always reset and flag is cleared
      console.log('[NFT Edit Modal] Finally block - resetting state...');
      this.isUpdating = false;
      updateBtn.innerHTML = originalText;
      updateBtn.disabled = false;
      updateBtn.style.opacity = '1';
      console.log('[NFT Edit Modal] ===== UPDATE NFT COMPLETED =====');
    }
  }

  // Validate seed format
  isValidSeedFormat(seed) {
    if (!seed || typeof seed !== 'string') {
      return false;
    }
    
    // Seeds should be numeric strings with even length (2 digits per trait)
    // Examples: "01020304", "123456", "000102"
    const numericPattern = /^\d+$/;
    return numericPattern.test(seed) && seed.length > 0 && seed.length % 2 === 0;
  }

  close() {
    console.log('[NFT Edit Modal] Closing edit modal');

    // Remove event listener
    if (this.escHandler) {
      document.removeEventListener('keydown', this.escHandler);
    }

    // CRITICAL: Clean up trait change event listeners
    if (this.traitChangeHandler) {
      document.removeEventListener('traitChanged', this.traitChangeHandler);
      this.traitChangeHandler = null;
    }
    if (this.traitModalClosedHandler) {
      document.removeEventListener('traitModalClosed', this.traitModalClosedHandler);
      this.traitModalClosedHandler = null;
    }

    // Remove modal
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }

    // Clear references
    this.currentNFT = null;
    this.originalNFT = null;
    this.projectData = null;
    this.sourceType = null;
    this.sourceIndex = null;
    this.onUpdateCallback = null;
    this.hasChanges = false;
  }

  setupSeedCopyHandler() {
    const seedDisplay = this.modal.querySelector('.nft-edit-seed-display');
    const seedValue = this.modal.querySelector('.nft-edit-seed-value');
    const seedLabel = seedDisplay ? seedDisplay.querySelector('div:first-child') : null;
    
    if (!seedDisplay || !seedValue) return;
    
    const copySeedToClipboard = async () => {
      if (!this.currentNFT.seed) return;
      
      try {
        // Copy to clipboard
        await navigator.clipboard.writeText(this.currentNFT.seed);
        
        // Show info notification
        if (window.NFTApp && window.NFTApp.notificationService) {
          window.NFTApp.notificationService.show('Seed copied to clipboard', 'info', 2000);
        }
        
        // Turn seed green for 2 seconds
        const originalColor = seedValue.style.color;
        seedValue.style.color = '#00ff2a';
        seedValue.style.transition = 'color 0.3s ease';
        
        setTimeout(() => {
          seedValue.style.color = originalColor;
        }, 2000);
        
        console.log('[NFT Edit Modal] Seed copied to clipboard:', this.currentNFT.seed);
      } catch (error) {
        console.error('[NFT Edit Modal] Error copying seed to clipboard:', error);
        if (window.NFTApp && window.NFTApp.notificationService) {
          window.NFTApp.notificationService.show('Failed to copy seed', 'error', 2000);
        }
      }
    };
    
    // Add click handler to seed value
    seedValue.style.cursor = 'pointer';
    seedValue.addEventListener('click', copySeedToClipboard);
    
    // Add click handler to "Current Seed" label if it exists
    if (seedLabel) {
      seedLabel.style.cursor = 'pointer';
      seedLabel.addEventListener('click', copySeedToClipboard);
    }
  }
}

// Register the modal as a global instance
window.NFTEditModal = window.NFTEditModal || new NFTEditModal();

console.log('[NFT Edit Modal] Component loaded');

