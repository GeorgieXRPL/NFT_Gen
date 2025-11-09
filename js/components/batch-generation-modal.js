class BatchGenerationModal {
  constructor() {
    console.log('[DEBUG] BatchGenerationModal constructor called');
    this.modal = null;
    this.generatedNFTs = [];
    this.selectedNFTs = new Set();
    this.isGenerating = false;
    this.isCancelled = false;
    this.currentPage = 1;
    this.pageSize = 30; // 10 columns x 3 rows
    this.progressPopup = null;
    this.darkModeEnabled = false; // Generate Dark NFTs toggle state
    
    // Temporary seeds list for bulk generation session
    this.temporarySeedsList = []; // In-memory temporary storage
    this.editedNFTs = new Set(); // Track which NFTs have been edited
    
    // Cache for rarity scores to avoid recalculating
    this.rarityScoreCache = new Map();
    
    // Cross-page drag and drop properties
    this.dragOverPageNumber = null; // Track which page number is being hovered during drag
    this.dragOverPageTimeout = null; // Timeout for page switching
    this.originalPage = null; // Store original page when drag starts
    
    // Register the modal globally
    window.BatchGenerationModal = BatchGenerationModal;
    console.log('[DEBUG] BatchGenerationModal constructor completed');
  }

  createModal() {
    console.log('[DEBUG] createModal() called');
    
    // Remove existing modal if it exists
    const existingModal = document.getElementById('batch-generation-modal');
    if (existingModal) {
      console.log('[DEBUG] Removing existing modal');
      existingModal.remove();
    }

    // Create modal container
    this.modal = document.createElement('div');
    this.modal.id = 'batch-generation-modal';
    this.modal.className = 'batch-generation-modal';
    this.modal.style.display = 'none';
    console.log('[DEBUG] Modal container created:', this.modal);

    // Create modal content
    this.modal.innerHTML = `
      <div class="batch-generation-overlay">
        <div class="batch-generation-container">
          <div class="batch-generation-header">
            <div class="batch-generation-title-container">
              <h2 class="batch-generation-title">Bulk Generation</h2>
              <span class="batch-generation-tip">*generate a batch of random NFTs. Select the ones you most like and add them to your collection or if you prefer add the entire batch.</span>
            </div>
            <div class="batch-generation-actions">
              <div class="total-counter" id="total-counter">
                <div class="counter-line-1"><span id="total-count">0</span> NFTs</div>
                <div class="counter-line-2">generated</div>
              </div>
              <button id="generate-batch-btn" class="batch-generation-btn generate-btn" title="Input the number of random NFTs you want to generate and press the Generate Batch button.">Generate Batch</button>
              <input type="number" id="batch-count-input" placeholder="100" min="1" max="10000" class="batch-count-input">
              <button id="dark-mode-toggle" class="batch-generation-btn dark-mode-toggle" title="When activated, generates NFTs using mostly dark traits (dark, black, grey colors). Background and eyes are excluded.">
                <span class="toggle-icon">🌙</span>
                <span class="toggle-label">Generate Dark NFTs</span>
              </button>
              <button id="add-batch-btn" class="batch-generation-btn add-batch-btn" title="Add entire Generated Batch NFTs to your Collection">Add Batch</button>
              <div class="selected-count-display" id="selected-count-display">
                <span id="selected-count-text">0</span> NFTs selected
              </div>
              <button id="add-selected-btn" class="batch-generation-btn add-selected-btn" title="Add Selected NFTs to your Collection">Add Selected</button>
              <button id="copy-selected-seeds-btn" class="batch-generation-btn copy-selected-seeds-btn" style="visibility: hidden;" title="Copy All Seeds from selected NFTs to clipboard if you are having any memry problem when adding them to your collection (for huge collections). You will still be able to Import them manually to your collection (you can do it by pressing "Edit NFT Collection" and then using the Seeds Import feature).">Copy Seeds</button>
              <button id="close-batch-modal" class="batch-generation-btn close-btn">&times;</button>
            </div>
          </div>
          <div id="batch-nfts-grid" class="saved-seeds-grid">
            <div class="no-seeds">No NFTs generated yet. Click "Generate Batch" to start.</div>
          </div>
          <div id="batch-pagination" class="pagination"></div>
          
          <!-- Collection Space Counter -->
          <div id="collection-space-counter" class="collection-space-counter">
            <div class="space-counter-content">
              <div class="space-counter-title">Collection Space</div>
              <div class="space-counter-value">
                <span id="available-space">0</span> / <span id="total-space">0</span>
              </div>
              <div class="space-counter-label">NFTs Available</div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add modal to document
    document.body.appendChild(this.modal);
    console.log('[DEBUG] Modal added to document body');
    
    // Setup event listeners
    this.setupEventListeners();
    console.log('[DEBUG] Event listeners setup completed');
    
    // Initialize collection space counter
    this.updateCollectionSpaceCounter();
    console.log('[DEBUG] Collection space counter initialized');
    
    // Set up periodic counter updates every 5 seconds
    this.counterUpdateInterval = setInterval(() => {
      this.updateCollectionSpaceCounter();
    }, 5000);
    
    console.log('[DEBUG] createModal() completed, modal:', this.modal);
  }

  setupEventListeners() {
    if (!this.modal) return;

    // Close button
    const closeBtn = this.modal.querySelector('#close-batch-modal');
    if (closeBtn) {
      closeBtn.onclick = () => this.hide();
    }

    // Generate batch button
    const generateBtn = this.modal.querySelector('#generate-batch-btn');
    if (generateBtn) {
      generateBtn.onclick = () => this.startBatchGeneration();
    }

    // Dark mode toggle button
    const darkModeToggle = this.modal.querySelector('#dark-mode-toggle');
    if (darkModeToggle) {
      darkModeToggle.onclick = () => this.toggleDarkMode();
      
      // Create overlapped edit button for Dark NFTs configuration
      this.createDarkTraitsEditButton(darkModeToggle);
    }

    // Add batch button
    const addBatchBtn = this.modal.querySelector('#add-batch-btn');
    if (addBatchBtn) {
      addBatchBtn.onclick = () => this.addBatchToCollection();
    }

    // Add selected button
    const addSelectedBtn = this.modal.querySelector('#add-selected-btn');
    if (addSelectedBtn) {
      addSelectedBtn.onclick = () => this.addSelectedToCollection();
    }

    // Copy selected seeds button
    const copySelectedSeedsBtn = this.modal.querySelector('#copy-selected-seeds-btn');
    if (copySelectedSeedsBtn) {
      copySelectedSeedsBtn.onclick = () => this.copySelectedSeeds();
    }

    // Input validation
    const countInput = this.modal.querySelector('#batch-count-input');
    if (countInput) {
      countInput.addEventListener('input', (e) => {
        let value = parseInt(e.target.value);
        if (value > 10000) {
          e.target.value = 10000;
        } else if (value < 1) {
          e.target.value = 1;
        }
      });
    }

    // Close modal when clicking outside
    this.modal.onclick = (e) => {
      if (e.target === this.modal) {
        this.hide();
      }
    };

    // Add event delegation for all card interactions
    this.modal.addEventListener('click', (e) => {
      console.log('[DEBUG] Modal click event:', e.target, e.target.classList);
      console.log('[DEBUG] Event target tagName:', e.target.tagName);
      console.log('[DEBUG] Event target textContent:', e.target.textContent);
      
      // Handle button clicks first
      if (e.target.classList.contains('copy-btn') || e.target.closest('.copy-btn')) {
        console.log('[DEBUG] Copy button clicked');
        e.stopPropagation();
        e.preventDefault();
        const button = e.target.classList.contains('copy-btn') ? e.target : e.target.closest('.copy-btn');
        const card = button.closest('.saved-seed-card');
        const seed = card.dataset.seed;
        console.log('[DEBUG] Copy - seed:', seed);
        if (seed) {
          navigator.clipboard.writeText(seed).then(() => {
            alert('Seed copied to clipboard!');
          }).catch(() => {
            alert('Failed to copy seed');
          });
        }
        return;
      } else if (e.target.classList.contains('view-btn') || e.target.closest('.view-btn')) {
        console.log('[DEBUG] View button clicked');
        e.stopPropagation();
        e.preventDefault();
        const button = e.target.classList.contains('view-btn') ? e.target : e.target.closest('.view-btn');
        const card = button.closest('.saved-seed-card');
        const nftId = card.dataset.nftId;
        console.log('[DEBUG] View - nftId:', nftId, 'card:', card);
        if (nftId) {
          this.showNFTViewer(nftId, card);
        }
        return;
      } else if (e.target.classList.contains('delete-btn') || e.target.closest('.delete-btn')) {
        console.log('[DEBUG] Delete button clicked');
        e.stopPropagation();
        e.preventDefault();
        const button = e.target.classList.contains('delete-btn') ? e.target : e.target.closest('.delete-btn');
        const card = button.closest('.saved-seed-card');
        const nftId = card.dataset.nftId;
        console.log('[DEBUG] Delete - nftId:', nftId, 'card:', card);
        if (nftId) {
          this.deleteNFTFromBatch(nftId, card);
        }
        return;
      }
      
      // Handle card selection (only if no button was clicked)
      if (e.target.closest('.saved-seed-card') && !e.target.closest('.seed-card-btn')) {
        console.log('[DEBUG] Card clicked for selection via event delegation');
        const card = e.target.closest('.saved-seed-card');
        const nftId = card.dataset.nftId;
        console.log('[DEBUG] Card selection - nftId:', nftId, 'card:', card);
        if (nftId) {
          this.toggleSelection(nftId, card);
        }
      }
    });

    // Add separate mousedown event listener for card selection
    this.modal.addEventListener('mousedown', (e) => {
      console.log('[DEBUG] Modal mousedown event:', e.target, e.target.classList);
      
      // Handle card selection (only if no button was clicked)
      if (e.target.closest('.saved-seed-card') && !e.target.closest('.seed-card-btn')) {
        console.log('[DEBUG] Card mousedown for selection via event delegation');
        const card = e.target.closest('.saved-seed-card');
        const nftId = card.dataset.nftId;
        console.log('[DEBUG] Card selection - nftId:', nftId, 'card:', card);
        if (nftId) {
          // Use a small delay to distinguish from drag operations
          setTimeout(() => {
            if (!this.draggedElement) { // Only if not currently dragging
              this.toggleSelection(nftId, card);
            }
          }, 10);
        }
      }
    });
  }

  async show() {
    console.log('[DEBUG] BatchGenerationModal show() called');
    
    // Get project data from the UI module
    this.projectData = window.NFTApp.getModule('generateNftsUI')?.projectData;
    if (!this.projectData) {
      console.error('[DEBUG] Project data not available');
      return;
    }
    
    this.createModal();
    if (this.modal) {
      console.log('[DEBUG] Modal created, displaying it');
      this.modal.style.display = 'flex';
      
      // Update button states to ensure "Add Batch" button starts disabled
      this.updateButtonStates();
      
      // Update collection space counter when modal is shown
      this.updateCollectionSpaceCounter();
      
      await this.renderPage(1);
      console.log('[DEBUG] Modal displayed and page rendered');
    } else {
      console.error('[DEBUG] Modal creation failed');
    }
  }

  hide() {
    if (this.modal) {
      this.modal.style.display = 'none';
      this.hideProgressPopup();
      this.resetModal();
      // Clear temporary seeds data when modal closes
      this.clearTemporaryData();
      
      // Clear the counter update interval
      if (this.counterUpdateInterval) {
        clearInterval(this.counterUpdateInterval);
        this.counterUpdateInterval = null;
      }
    }
  }

  resetModal() {
    // Reset all data when modal is closed
    this.generatedNFTs = [];
    this.selectedNFTs.clear();
    this.isGenerating = false;
    this.isCancelled = false;
    
    // Clear rarity score cache
    this.rarityScoreCache.clear();
    
    // Update counters
    this.updateTotalCounter();
    this.updateSelectionCounter();
  }

  toggleDarkMode() {
    this.darkModeEnabled = !this.darkModeEnabled;
    const toggle = this.modal.querySelector('#dark-mode-toggle');
    
    if (toggle) {
      if (this.darkModeEnabled) {
        toggle.classList.add('active');
        console.log('[DEBUG] Dark Mode enabled - will generate NFTs with mostly dark traits');
        // Show the edit button when dark mode is enabled
        this.showDarkTraitsEditButton();
      } else {
        toggle.classList.remove('active');
        console.log('[DEBUG] Dark Mode disabled - will generate NFTs with random traits');
        // Hide the edit button when dark mode is disabled
        this.hideDarkTraitsEditButton();
      }
    }
  }

  createDarkTraitsEditButton(darkModeToggle) {
    // Create the overlapped edit button
    const editButton = document.createElement('button');
    editButton.id = 'batch-dark-traits-edit-btn';
    editButton.className = 'batch-dark-traits-edit-btn';
    editButton.innerHTML = 'EDIT';
    editButton.title = 'Configure Dark NFT traits - Select which traits to use for Dark NFT generation';
    editButton.style.cssText = `
      position: absolute;
      top: -18px;
      right: -14px;
      width: 40px;
      height: 20px;
      border-radius: 4px;
      background: #e17055;
      color: #fff;
      border: 2px solid #000;
      font-size: 8px;
      font-weight: bold;
      cursor: pointer;
      display: none;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      align-items: center;
      justify-content: center;
    `;

    // Add hover effects
    editButton.addEventListener('mouseenter', () => {
      editButton.style.background = '#d63031';
      editButton.style.transform = 'scale(1.1)';
    });

    editButton.addEventListener('mouseleave', () => {
      editButton.style.background = '#e17055';
      editButton.style.transform = 'scale(1)';
    });

    // Add click event to open Dark NFTs modal
    editButton.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      console.log('[DEBUG] Dark traits edit button clicked in batch modal');
      
      // Open the Dark NFTs modal
      const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
      if (generateNftsUI && typeof generateNftsUI.openDarkTraitsModal === 'function') {
        generateNftsUI.openDarkTraitsModal();
      } else {
        console.error('[DEBUG] generateNftsUI module or openDarkTraitsModal function not found');
      }
    });

    // Make the dark mode toggle container relative positioned
    darkModeToggle.style.position = 'relative';
    
    // Add the edit button to the dark mode toggle
    darkModeToggle.appendChild(editButton);
    
    // Store reference for show/hide methods
    this.darkTraitsEditButton = editButton;
  }

  showDarkTraitsEditButton() {
    if (this.darkTraitsEditButton) {
      this.darkTraitsEditButton.style.display = 'flex';
    }
  }

  hideDarkTraitsEditButton() {
    if (this.darkTraitsEditButton) {
      this.darkTraitsEditButton.style.display = 'none';
    }
  }

  async startBatchGeneration() {
    const countInput = this.modal.querySelector('#batch-count-input');
    const count = parseInt(countInput.value) || 100;
    
    if (count < 1 || count > 10000) {
      alert('Please enter a number between 1 and 10000');
      return;
    }

    this.isGenerating = true;
    this.isCancelled = false;
    // Don't clear existing NFTs - append new ones
    // this.generatedNFTs = [];
    // this.selectedNFTs.clear();
    
    // Update button states
    this.updateButtonStates();
    
    // Show progress popup
    this.showProgressPopup(count);
    
    // Start generation
    await this.generateNFTs(count);
  }

  async generateNFTs(count) {
    let generated = 0;
    
    // Don't clear the grid - append new NFTs to existing ones
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;
    
    for (let i = 0; i < count; i++) {
      if (this.isCancelled) {
        break;
      }
      
        try {
          // Generate a random NFT
          const nft = await this.generateSingleNFT();
          if (nft) {
            const nftData = {
              ...nft,
              id: `batch_${Date.now()}_${i}`,
              originalIndex: i
            };
            this.generatedNFTs.push(nftData);
            generated++;
            
            // Update progress and counters
            this.updateProgressPopup(generated, count);
            this.updateTotalCounter();
            
            // Append the new NFT card directly to the grid (async)
            await this.appendNFTCardToGrid(nftData, this.generatedNFTs.length - 1);
            
            // Rarity rank calculation disabled for performance
            // this.calculateRarityRankForSingleNFT(nftData);
          }
          
          // Force DOM update by yielding to browser's event loop
          // This ensures progress is visible in real-time
          await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
        
      } catch (error) {
        console.error('Error generating NFT:', error);
      }
    }
    
    // Generation completed
    this.isGenerating = false;
    this.updateButtonStates();
    
    // Save temporary seeds list for this bulk generation session
    this.saveTemporarySeedsList();
    
    if (!this.isCancelled) {
      // Show success message in progress pop-up
      this.showSuccessMessage(generated);
    } else {
      this.hideProgressPopup();
    }
  }

  // Save temporary seeds list for bulk generation session
  saveTemporarySeedsList() {
    console.log('[DEBUG] Saving temporary seeds list...');
    this.temporarySeedsList = this.generatedNFTs.map(nft => nft.seed);
    console.log('[DEBUG] Temporary seeds list saved:', this.temporarySeedsList.length, 'seeds');
  }

  // Update seed in temporary list when NFT is edited
  updateTemporarySeed(nftIndex, newSeed) {
    if (nftIndex >= 0 && nftIndex < this.temporarySeedsList.length) {
      const oldSeed = this.temporarySeedsList[nftIndex];
      this.temporarySeedsList[nftIndex] = newSeed;
      this.editedNFTs.add(nftIndex);
      console.log('[DEBUG] Updated temporary seed at index', nftIndex, 'from', oldSeed.substring(0, 20) + '...', 'to', newSeed.substring(0, 20) + '...');
    }
  }

  // Clear temporary data when modal closes
  clearTemporaryData() {
    console.log('[DEBUG] Clearing temporary seeds data...');
    this.temporarySeedsList = [];
    this.editedNFTs.clear();
  }

  // Show edited icon on NFT card
  showEditedIcon(nftIndex) {
    const card = this.modal.querySelector(`[data-index="${nftIndex}"]`);
    if (card) {
      const editedIcon = card.querySelector('.edited-icon');
      if (editedIcon) {
        editedIcon.style.display = 'flex';
        console.log('[DEBUG] Showing edited icon for NFT at index:', nftIndex);
      }
    }
  }

  // Get seeds for selected NFTs to add to collection
  getSeedsForSelectedNFTs() {
    const selectedIndices = Array.from(this.selectedNFTs);
    const seedsToAdd = selectedIndices.map(index => this.temporarySeedsList[index]).filter(seed => seed);
    console.log('[DEBUG] Getting seeds for selected NFTs:', seedsToAdd.length, 'seeds');
    return seedsToAdd;
  }

  async generateSingleNFT() {
    try {
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule) {
        throw new Error('Generate NFTs module not found');
      }
      
      // Get project data from the UI module
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
      if (!projectData) {
        throw new Error('Project data not available');
      }
      
      // Generate a random seed for each NFT to ensure uniqueness
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      // Generate NFT with rules enabled, random seed, and dark mode preference
      const result = await generateNftsModule.generateSingleNFT(
        projectData, 
        false, 
        randomSeed, 
        this.darkModeEnabled
      );
      
      if (result && result.seed) {
        return {
          seed: result.seed,
          traits: result.traits || {},
          imageData: result.imageData || null,
          rarity: result.rarity || 'Unknown'
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error in generateSingleNFT:', error);
      return null;
    }
  }

  stopGeneration() {
    this.isCancelled = true;
    this.isGenerating = false;
    this.hideProgressPopup();
    this.updateButtonStates();
    
    // Cancel any ongoing rarity calculations
    console.log('[DEBUG] Batch generation stopped - cancelling rarity calculations');
  }

  showProgressPopup(total) {
    this.hideProgressPopup();
    
    this.progressPopup = document.createElement('div');
    this.progressPopup.className = 'violation-progress-popup';
    this.progressPopup.id = 'batch-progress-popup';
    this.progressPopup.innerHTML = `
      <div class="progress-title">Generating NFTs</div>
      <div class="progress-text">Generated: 0 / ${total}</div>
      <div class="progress-count">Progress: 0%</div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: 0%"></div>
      </div>
      <button class="cancel-btn" id="cancel-batch-generation">Cancel Generation</button>
    `;
    
    document.body.appendChild(this.progressPopup);
    
    // Add cancel event listener
    this.progressPopup.querySelector('#cancel-batch-generation').onclick = () => {
      this.stopGeneration();
    };
  }

  hideProgressPopup() {
    if (this.progressPopup) {
      this.progressPopup.remove();
      this.progressPopup = null;
    }
  }

  showSuccessMessage(generated) {
    if (this.progressPopup) {
      // Update the pop-up to show success message
      this.progressPopup.innerHTML = `
        <div class="progress-title">Generation Complete!</div>
        <div class="progress-text">Successfully generated ${generated} NFTs!</div>
        <div class="progress-count">All NFTs have been added to the batch.</div>
        <div class="progress-bar">
          <div class="progress-bar-fill" style="width: 100%"></div>
        </div>
      `;
      
      // Add click listener to dismiss popup immediately when clicked anywhere
      this.progressPopup.addEventListener('click', () => {
        this.hideProgressPopup();
      });
      
      // Auto-close after 3 seconds (fallback)
      setTimeout(() => {
        this.hideProgressPopup();
      }, 3000);
    }
  }

  updateProgressPopup(generated, total) {
    if (this.progressPopup) {
      const progressText = this.progressPopup.querySelector('.progress-text');
      const progressCount = this.progressPopup.querySelector('.progress-count');
      const progressBarFill = this.progressPopup.querySelector('.progress-bar-fill');
      
      if (progressText) {
        progressText.textContent = `Generated: ${generated} / ${total}`;
      }
      
      if (progressCount) {
        const percentage = Math.round((generated / total) * 100);
        progressCount.textContent = `Progress: ${percentage}%`;
      }
      
      if (progressBarFill) {
        const percentage = (generated / total) * 100;
        progressBarFill.style.width = `${percentage}%`;
      }
    }
  }

  updateButtonStates() {
    const generateBtn = this.modal.querySelector('#generate-batch-btn');
    const addBatchBtn = this.modal.querySelector('#add-batch-btn');
    const addSelectedBtn = this.modal.querySelector('#add-selected-btn');
    const copySelectedSeedsBtn = this.modal.querySelector('#copy-selected-seeds-btn');
    
    if (this.isGenerating) {
      generateBtn.disabled = true;
      addBatchBtn.disabled = true;
      addSelectedBtn.disabled = true;
      if (copySelectedSeedsBtn) {
        copySelectedSeedsBtn.disabled = true;
      }
    } else {
      generateBtn.disabled = false;
      addBatchBtn.disabled = this.generatedNFTs.length === 0;
      addSelectedBtn.disabled = this.selectedNFTs.size === 0;
      if (copySelectedSeedsBtn) {
        copySelectedSeedsBtn.disabled = this.selectedNFTs.size === 0;
      }
    }
  }

  async renderPage(page) {
    if (!this.modal) return;
    
    const grid = this.modal.querySelector('#batch-nfts-grid');
    const pagination = this.modal.querySelector('#batch-pagination');
    
    if (!grid) return;
    
    if (!this.generatedNFTs.length) {
      grid.innerHTML = '<div class="no-seeds">No NFTs generated yet. Click "Generate Batch" to start.</div>';
      if (pagination) pagination.innerHTML = '';
      return;
    }

    // Clear grid
    grid.innerHTML = '';

    // Render all NFTs instead of paginated view (async)
    for (let i = 0; i < this.generatedNFTs.length; i++) {
      const nft = this.generatedNFTs[i];
      const card = await this.createNFTCard(nft, i);
      
      // Restore selection state if this NFT was selected
      if (this.selectedNFTs.has(nft.id)) {
        card.classList.add('selected');
      }
      
      grid.appendChild(card);
    }

    // Remove pagination since we're showing all NFTs
    if (pagination) {
      pagination.innerHTML = '';
    }
    
    // Update selection counter
    this.updateSelectionCounter();
  }

  async createNFTCard(nft, index) {
    const card = document.createElement('div');
    card.className = 'saved-seed-card';
    card.dataset.seed = nft.seed;
    card.dataset.nftId = nft.id; // Add the missing nftId attribute
    card.dataset.index = index;
    
    // Add drag and drop attributes
    card.draggable = true;
    card.dataset.dragIndex = index;

    // Rarity rank display disabled for performance
    let rarityDisplay = '';
    
    // Rarity calculation disabled for performance
    // this.calculateRarityRankAsync(nft.seed, card);

    // Calculate NFT number based on current position in batch
    const nftNumber = index + 1;
    const nftNumberDisplay = `<div class="seed-card-number-display">#${nftNumber}</div>`;

    card.innerHTML = `
      <div class="seed-card-thumbnail">
        <div class="seed-card-loading">Loading<span class="loading-dots">...</span> Please Wait.</div>
        ${rarityDisplay}
        ${nftNumberDisplay}
        <div class="edited-icon" style="display: none; position: absolute; top: 8px; right: 8px; background: #ff6b35; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; box-shadow: 0 2px 4px rgba(0,0,0,0.3);" title="This NFT has been edited">✎</div>
      </div>
      <div class="seed-card-info">
        <div class="seed-card-number">${nft.seed}</div>
        <div class="seed-card-buttons">
          <button class="seed-card-btn edit-btn" data-action="edit">Edit</button>
          <button class="seed-card-btn copy-btn" data-action="copy">Copy</button>
          <button class="seed-card-btn delete-btn" data-action="delete">Delete</button>
        </div>
      </div>
    `;
    
    // Ensure draggable is set after innerHTML
    card.draggable = true;
    card.style.cursor = 'grab';
    
    // Add selection event listener
    // Card selection is now handled through event delegation
    
    // Add drag event listeners
    this.setupCardDragAndDrop(card, index);
    
    // Ensure buttons are clickable by adding direct event listeners as backup
    const buttons = card.querySelectorAll('.seed-card-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        console.log('[DEBUG] Direct button click:', btn.className, 'action:', btn.dataset.action);
        e.stopPropagation();
        
        const action = btn.dataset.action;
        const card = btn.closest('.saved-seed-card');
        const nftId = card.dataset.nftId;
        console.log('[DEBUG] Direct button - action:', action, 'nftId:', nftId, 'card:', card);
        
        if (action === 'edit' && nftId) {
          console.log('[DEBUG] Direct edit button click - calling editNFT');
          this.editNFT(nftId, index);
        } else if (action === 'delete' && nftId) {
          console.log('[DEBUG] Direct delete button click - calling deleteNFTFromBatch');
          this.deleteNFTFromBatch(nftId, card);
        } else if (action === 'copy') {
          console.log('[DEBUG] Direct copy button click');
          const seed = card.dataset.seed;
          if (seed) {
            navigator.clipboard.writeText(seed).then(() => {
              // Change button to show "copied" feedback
              const copyBtn = card.querySelector('.copy-btn');
              if (copyBtn) {
                const originalText = copyBtn.textContent;
                const originalBackground = copyBtn.style.backgroundColor;
                
                // Set copied state
                copyBtn.textContent = 'Copied';
                copyBtn.style.backgroundColor = '#00ff00'; // Vivid green
                copyBtn.style.color = '#000000'; // Black text for contrast
                copyBtn.style.fontWeight = 'bold';
                
                // Reset after 1.5 seconds
                setTimeout(() => {
                  copyBtn.textContent = originalText;
                  copyBtn.style.backgroundColor = originalBackground;
                  copyBtn.style.color = '';
                  copyBtn.style.fontWeight = '';
                }, 1500);
              }
            }).catch(() => {
              // If clipboard fails, show brief error feedback
              const copyBtn = card.querySelector('.copy-btn');
              if (copyBtn) {
                const originalText = copyBtn.textContent;
                copyBtn.textContent = 'Failed';
                copyBtn.style.backgroundColor = '#ff0000'; // Red for error
                copyBtn.style.color = '#ffffff';
                
                setTimeout(() => {
                  copyBtn.textContent = originalText;
                  copyBtn.style.backgroundColor = '';
                  copyBtn.style.color = '';
                }, 1500);
              }
            });
          }
        }
      });
    });
    
    // Add direct click handler for card selection as backup
    // Use mousedown instead of click to work around draggable conflicts
    let mouseDownTime = 0;
    let isDragging = false;
    
    card.addEventListener('mousedown', (e) => {
      console.log('[DEBUG] Card mousedown - target:', e.target, 'closest button:', e.target.closest('.seed-card-btn'));
      mouseDownTime = Date.now();
      isDragging = false;
      
      // Only handle if no button was clicked
      if (!e.target.closest('.seed-card-btn')) {
        // Set a timeout to check if this becomes a drag operation
        setTimeout(() => {
          if (!isDragging && Date.now() - mouseDownTime < 200) {
            console.log('[DEBUG] Card mousedown for selection (not drag)');
            const nftId = card.dataset.nftId;
            console.log('[DEBUG] Direct card selection - nftId:', nftId, 'card:', card);
            if (nftId) {
              console.log('[DEBUG] Direct card selection - calling toggleSelection');
              this.toggleSelection(nftId, card);
            }
          }
        }, 50);
      }
    });
    
    // Track drag operations
    card.addEventListener('dragstart', (e) => {
      isDragging = true;
      console.log('[DEBUG] Drag started - preventing selection');
    });
    
    // Load the NFT image asynchronously
    this.loadNFTCardImage(card, nft);
    
    return card;
  }

  toggleSelection(nftId, card) {
    if (this.selectedNFTs.has(nftId)) {
      this.selectedNFTs.delete(nftId);
      card.classList.remove('selected');
    } else {
      this.selectedNFTs.add(nftId);
      card.classList.add('selected');
    }
    
    this.updateSelectionCounter();
    this.updateButtonStates();
  }

  updateSelectionCounter() {
    const selectedDisplay = this.modal.querySelector('#selected-count-display');
    const selectedCountText = this.modal.querySelector('#selected-count-text');
    const copySelectedSeedsBtn = this.modal.querySelector('#copy-selected-seeds-btn');
    
    if (selectedDisplay && selectedCountText) {
      selectedCountText.textContent = this.selectedNFTs.size;
      
      // Always show the display, but change text color based on selection
      selectedDisplay.style.display = 'flex';
      
      if (this.selectedNFTs.size > 0) {
        selectedDisplay.style.color = '#e17055'; // Orange when selected
        selectedCountText.style.color = '#e17055'; // Orange when selected
        
        // Show the copy selected seeds button when at least one NFT is selected
        if (copySelectedSeedsBtn) {
          copySelectedSeedsBtn.style.visibility = 'visible';
        }
      } else {
        selectedDisplay.style.color = '#313131'; // Grey when not selected
        selectedCountText.style.color = '#313131'; // Grey when not selected
        
        // Hide the copy selected seeds button when no NFTs are selected (but keep its space)
        if (copySelectedSeedsBtn) {
          copySelectedSeedsBtn.style.visibility = 'hidden';
        }
      }
    }
  }

  updateTotalCounter() {
    const totalCounter = this.modal.querySelector('#total-counter');
    const totalCountSpan = this.modal.querySelector('#total-count');
    if (totalCounter && totalCountSpan) {
      totalCountSpan.textContent = this.generatedNFTs.length;
    }
  }

  createPagination(container, totalPages) {
    if (totalPages <= 1) {
      container.innerHTML = '';
      return;
    }

    let paginationHTML = '';
    
    // Previous button
    if (this.currentPage > 1) {
      paginationHTML += `<button class="page-btn" data-page="${this.currentPage - 1}">‹</button>`;
    }
    
    // Page numbers
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(totalPages, this.currentPage + 2);
    
    for (let i = startPage; i <= endPage; i++) {
      const activeClass = i === this.currentPage ? 'active' : '';
      paginationHTML += `<button class="page-btn ${activeClass}" data-page="${i}">${i}</button>`;
    }
    
    // Next button
    if (this.currentPage < totalPages) {
      paginationHTML += `<button class="page-btn" data-page="${this.currentPage + 1}">›</button>`;
    }
    
    container.innerHTML = paginationHTML;
    
    // Add event listeners
    container.querySelectorAll('.page-btn').forEach(btn => {
      btn.onclick = () => {
        const page = parseInt(btn.dataset.page);
        this.renderPage(page);
      };
    });
  }

  async addBatchToCollection() {
    if (this.generatedNFTs.length === 0) return;
    
    try {
      // Get project data to check collection size limit
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
      if (!projectData) {
        alert('Project data not available. Cannot add NFTs to collection.');
        return;
      }

      // Helper function to get total supply (same as generate-nfts-ui.js)
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
        return null; // No default fallback for batch operations
      }

      // Get current saved seeds to check collection size
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      const currentCollectionSize = savedSeeds.length;
      const maxCollectionSize = getTotalSupply(projectData);
      
      // Calculate how many NFTs can be added
      const availableSpace = maxCollectionSize - currentCollectionSize;
      
      if (availableSpace <= 0) {
        alert(`Collection is full! Maximum size is ${maxCollectionSize} NFTs.`);
        return;
      }

      // Determine how many NFTs to add and how many to skip
      const nftsToAdd = Math.min(this.generatedNFTs.length, availableSpace);
      const nftsToSkip = this.generatedNFTs.length - nftsToAdd;
      
      // Use the app's styled confirmation modal instead of browser confirm
      if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
        const modalTitle = "Add Generated NFTs to Collection";
        const modalMessage = `<div style="margin-top: 12px;">Are you sure you want to add <strong>${nftsToAdd}</strong> generated NFT${nftsToAdd > 1 ? 's' : ''} to your collection?</div>`;
        
        let modalDescription = '';
        if (nftsToSkip > 0) {
          modalDescription = `
            <div style="text-align: left; margin-top: 16px; line-height: 1.6;">
              <div style="color: #f39c12; margin-bottom: 12px;"><strong>⚠️ Collection space limit reached</strong></div>
              <div style="color: #95a5a6; margin-bottom: 8px;">Collection details:</div>
              <div style="margin-left: 10px; margin-top: 8px; color: #bdc3c7;">
                <div style="margin-bottom: 4px;">📊 Maximum collection size: <strong>${maxCollectionSize} NFTs</strong></div>
                <div style="margin-bottom: 4px;">📦 Current collection: <strong>${currentCollectionSize} NFTs</strong></div>
                <div style="margin-bottom: 4px;">✅ Available space: <strong>${availableSpace} NFTs</strong></div>
              </div>
              <div style="color: #e74c3c; margin-top: 12px; font-size: 13px;">
                ⚠️ <strong>${nftsToSkip} NFT${nftsToSkip > 1 ? 's' : ''}</strong> will be skipped due to collection size limit.
              </div>
            </div>
          `;
        } else {
          modalDescription = `
            <div style="text-align: left; margin-top: 16px; line-height: 1.6;">
              <div style="color: #95a5a6; margin-bottom: 8px;">This will add the generated NFTs to your collection.</div>
              <div style="margin-left: 10px; margin-top: 8px; color: #bdc3c7;">
                <div style="margin-bottom: 4px;">📦 Current collection: <strong>${currentCollectionSize} NFTs</strong></div>
                <div style="margin-bottom: 4px;">➕ NFTs to add: <strong>${nftsToAdd} NFTs</strong></div>
                <div style="margin-bottom: 4px;">📊 New total: <strong>${currentCollectionSize + nftsToAdd} NFTs</strong></div>
              </div>
            </div>
          `;
        }
        
        window.NFTApp.getModule("confirmationModal").show(
          modalTitle,
          modalMessage,
          modalDescription,
          () => {
            // User confirmed - proceed with adding NFTs
            this.continueAddingToCollection(nftsToAdd);
          }
        );
        return;
      }
      
      // Fallback to browser confirm if modal not available
      let confirmMessage = `Add ${nftsToAdd} generated NFTs to your collection?`;
      if (nftsToSkip > 0) {
        confirmMessage += `\n\n⚠️ Collection space limit: ${maxCollectionSize} NFTs\n` +
                        `Current collection: ${currentCollectionSize} NFTs\n` +
                        `Available space: ${availableSpace} NFTs\n\n` +
                        `The last ${nftsToSkip} NFTs will be skipped due to collection size limit.`;
      }
      
      const confirmed = confirm(confirmMessage);
      if (!confirmed) return;
      
      // Continue with adding NFTs
      this.continueAddingToCollection(nftsToAdd);
      
    } catch (error) {
      console.error('Error adding batch to collection:', error);
      
      // Use styled notification
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error adding NFTs to collection',
          'error',
          3000
        );
      } else {
        alert('Error adding NFTs to collection. Please try again.');
      }
    }
  }

  // Helper method to complete the addition process after confirmation
  continueAddingToCollection(nftsToAdd) {
    try {
      // Get storage keys
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Calculate how many NFTs will be skipped
      const nftsToSkip = this.generatedNFTs.length - nftsToAdd;
      
      // Add only the NFTs that fit
      const nftsToAddList = this.generatedNFTs.slice(0, nftsToAdd);
      
      // Use the same lightweight approach as Add Selected (seed-only)
      let added = 0;
      let duplicates = 0;
      
      console.log('[DEBUG] Adding batch of', nftsToAddList.length, 'NFTs using lightweight approach');
      
      nftsToAddList.forEach((nft, index) => {
        // Use temporary seed or fallback to nft.seed
        const seed = this.temporarySeedsList[index] || nft.seed;
        
        if (!savedSeeds.some(s => s.seed === seed)) {
          // Create minimal seed object (like import seed method)
          const seedObj = {
            seed: seed,
            traits: [], // Will be populated when thumbnail is generated
            rarity: 'common',
            rarityScore: 0,
            timestamp: Date.now()
            // No imageData - will be generated on demand
          };
          savedSeeds.push(seedObj);
          added++;
        } else {
          duplicates++;
        }
      });
      
      if (added > 0) {
        // Save to localStorage (much smaller data)
        localStorage.setItem(seedListKey, JSON.stringify(savedSeeds));
        
        // Update project data
        const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
        if (projectData) {
          projectData.savedSeeds = savedSeeds;
        }
        
        // Update all counters
        window.updateAllCounters();
        
        // Show success message with details
        let message = `Successfully added ${added} NFT${added !== 1 ? 's' : ''} to your collection.`;
        if (duplicates > 0) {
          message += `\n\n${duplicates} duplicate${duplicates !== 1 ? 's' : ''} were skipped.`;
        }
        if (nftsToSkip > 0) {
          message += `\n\n${nftsToSkip} NFT${nftsToSkip !== 1 ? 's' : ''} were skipped due to collection size limit.`;
        }
        
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(message, 'success', 4000);
        } else {
          alert(message);
        }
        
        console.log('[DEBUG] Batch addition completed:', { added, duplicates, skipped: nftsToSkip, totalSeeds: savedSeeds.length });
        
        // Generate thumbnails in background (like import seed method)
        setTimeout(() => {
          this.generateThumbnailsForAddedSeeds(nftsToAddList.map((nft, index) => this.temporarySeedsList[index] || nft.seed)).catch(error => {
            console.error('[DEBUG] Background thumbnail generation failed:', error);
          });
        }, 1000);
        
      } else {
        alert('No new NFTs were added. All generated NFTs already exist in your collection.');
      }
      
    } catch (error) {
      console.error('Error completing NFT addition:', error);
      alert('Error adding NFTs to collection. Please try again.');
    }
  }

  async addSelectedToCollection() {
    if (this.selectedNFTs.size === 0) return;
    
    try {
      // Get selected NFTs in the order they were generated
      const selectedNFTs = this.generatedNFTs.filter(nft => this.selectedNFTs.has(nft.id));
      
      // Extract seeds and join them with line breaks (one per line)
      const seedsList = selectedNFTs.map(nft => nft.seed).join('\n');
      
      // Calculate collection space limits
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      const maxCollectionSize = this.getMaxCollectionSize(projectData);
      const currentCollectionSize = this.getCurrentCollectionSize();
      const availableSpace = Math.max(0, maxCollectionSize - currentCollectionSize);
      const nftsToAdd = Math.min(selectedNFTs.length, availableSpace);
      const nftsToSkip = Math.max(0, selectedNFTs.length - availableSpace);
      
      // Show confirmation with space limit info using styled modal
      const confirmTitle = "Add Selected NFTs to Collection";
      const confirmMessage = `<div style="margin-top: 12px;">Add <strong>${selectedNFTs.length}</strong> selected NFT${selectedNFTs.length !== 1 ? 's' : ''} to your collection?</div>`;
      let confirmDescription = '';
      
      if (nftsToSkip > 0) {
        confirmDescription = `
          <div style="text-align: left; margin-top: 12px; line-height: 1.6;">
            <div style="margin-bottom: 8px; color: #fbbf24;"><strong>⚠️ Collection Space Limit</strong></div>
            <div style="margin-left: 10px; margin-bottom: 6px;">Collection space limit: <strong>${maxCollectionSize} NFTs</strong></div>
            <div style="margin-left: 10px; margin-bottom: 6px;">Current collection: <strong>${currentCollectionSize} NFTs</strong></div>
            <div style="margin-left: 10px; margin-bottom: 12px;">Available space: <strong>${availableSpace} NFTs</strong></div>
            <div style="color: #ef4444; margin-top: 12px;">The last <strong>${nftsToSkip}</strong> NFT${nftsToSkip !== 1 ? 's' : ''} will be skipped due to collection size limit.</div>
          </div>
        `;
      }
      
      // Use the app's styled confirmation modal
      if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
        window.NFTApp.getModule("confirmationModal").show(
          confirmTitle,
          confirmMessage,
          confirmDescription,
          () => {
            // User confirmed - automatically add seeds to project
            const nftsToAddList = selectedNFTs.slice(0, nftsToAdd);
            this.autoImportSeedsToProject(nftsToAddList, nftsToSkip);
          }
        );
        return; // Exit early, the callback will handle the rest
      }
      
      // Fallback to browser confirm if modal not available
      let fallbackMessage = `Add ${nftsToAdd} selected NFTs to your collection?`;
      if (nftsToSkip > 0) {
        fallbackMessage += `\n\n⚠️ Collection space limit: ${maxCollectionSize} NFTs\n` +
                        `Current collection: ${currentCollectionSize} NFTs\n` +
                        `Available space: ${availableSpace} NFTs\n\n` +
                        `The last ${nftsToSkip} NFTs will be skipped due to collection size limit.`;
      }
      
      const confirmed = confirm(fallbackMessage);
      if (!confirmed) return;
      
      // Automatically add seeds to project
      const nftsToAddList = selectedNFTs.slice(0, nftsToAdd);
      this.autoImportSeedsToProject(nftsToAddList, nftsToSkip);
    } catch (error) {
      console.error('Error adding selected NFTs to collection:', error);
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error adding NFTs to collection',
          'error',
          3000
        );
      }
    }
  }

  async continueAddSelectedToCollection(nftsToAddList, nftsToSkip) {
    try {
      // Get storage keys
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Add only essential NFT data (storage-efficient approach)
      // Use temporary seeds list to get the correct seeds (including edited ones)
      const newSeeds = nftsToAddList.map(nft => {
        const nftIndex = this.generatedNFTs.findIndex(generatedNft => generatedNft.id === nft.id);
        const seed = this.temporarySeedsList[nftIndex] || nft.seed; // Fallback to nft.seed if not found
        return {
          seed: seed,
          traits: nft.traits || [],
          rarity: nft.rarity || 'common',
          rarityScore: nft.rarityScore || 0,
          timestamp: Date.now()
          // imageData is intentionally omitted to avoid storage issues
        };
      });
      
      // Check storage quota before attempting to add
      const estimatedSize = this.estimateStorageSize(newSeeds);
      if (!this.canAddNFTs(estimatedSize)) {
        const currentSize = this.getLocalStorageSize();
        const currentSizeMB = (currentSize / 1024 / 1024).toFixed(2);
        const estimatedSizeMB = (estimatedSize / 1024 / 1024).toFixed(2);
        
        // Offer workaround: save without image data (images will regenerate on demand)
        if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
          window.NFTApp.getModule("confirmationModal").show(
            "Storage Quota Exceeded",
            `<div style="margin-top: 12px;">Cannot add ${nftsToAddList.length} selected NFT${nftsToAddList.length !== 1 ? 's' : ''}: Storage quota would be exceeded.</div>`,
            `<div style="text-align: left; margin-top: 12px; line-height: 1.6;">
              <div style="margin-bottom: 8px; color: #fbbf24;"><strong>Current Storage Usage:</strong></div>
              <div style="margin-left: 10px; margin-bottom: 6px;">• Current usage: <strong>${currentSizeMB}MB</strong></div>
              <div style="margin-left: 10px; margin-bottom: 6px;">• Estimated additional: <strong>${estimatedSizeMB}MB</strong></div>
              <div style="margin-left: 10px; margin-bottom: 12px;">• Maximum allowed: <strong>4.5MB</strong></div>
              <div style="margin-bottom: 8px; color: #4ade80; margin-top: 16px;"><strong>💡 Workaround Available:</strong></div>
              <div style="margin-left: 10px; margin-bottom: 6px;">✅ Save seeds WITHOUT image previews</div>
              <div style="margin-left: 10px; margin-bottom: 6px;">✅ Images will regenerate automatically when viewed</div>
              <div style="margin-left: 10px; margin-bottom: 12px;">✅ Saves up to 80% storage space</div>
              <div style="color: #95a5a6; margin-top: 12px; font-size: 12px;">Click <strong>Confirm</strong> to save NFTs without thumbnails, or <strong>Cancel</strong> to try adding fewer NFTs.</div>
            </div>`,
            () => {
              // User confirmed - save without image data
              this.continueAddingSelectedWithoutImages(nftsToAddList, nftsToSkip);
            }
          );
        } else {
          // Fallback
          const confirmWithoutImages = confirm(
            `Cannot add NFTs: Storage quota would be exceeded.\n\n` +
            `Current usage: ${currentSizeMB}MB\n` +
            `Estimated additional: ${estimatedSizeMB}MB\n` +
            `Maximum allowed: 4.5MB\n\n` +
            `💡 WORKAROUND: Save seeds WITHOUT image previews?\n` +
            `(Images will regenerate automatically when viewed)`
          );
          
          if (confirmWithoutImages) {
            this.continueAddingSelectedWithoutImages(nftsToAddList, nftsToSkip);
          }
        }
        return;
      }
      
      // Try to add seeds in smaller batches to avoid localStorage size limits
      let successfullyAdded = 0;
      let failedToAdd = 0;
      
      try {
        // First, try to add all at once
        savedSeeds.push(...newSeeds);
        localStorage.setItem(seedListKey, JSON.stringify(savedSeeds));
        successfullyAdded = nftsToAddList.length;
      } catch (error) {
        console.warn('Failed to add all NFTs at once, trying individual addition:', error);
        
        // If that fails, try adding one by one
        for (let i = 0; i < newSeeds.length; i++) {
          try {
            const currentSavedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
            currentSavedSeeds.push(newSeeds[i]);
            localStorage.setItem(seedListKey, JSON.stringify(currentSavedSeeds));
            successfullyAdded++;
          } catch (individualError) {
            console.error(`Failed to add NFT ${i + 1}:`, individualError);
            failedToAdd++;
            
            // If we're hitting storage limits, stop trying
            if (individualError.name === 'QuotaExceededError' || 
                individualError.message.includes('string length') ||
                individualError.message.includes('RangeError')) {
              console.warn('Storage limit reached, stopping addition process');
              break;
            }
          }
        }
      }
      
      // Update seed counter
      this.updateSeedCounter();
      
      // Update NFT count panel
      if (window.updateNftCountPanel) {
        window.updateNftCountPanel();
      }
      
      // Show success message with details
      let successMessage = `Successfully added ${successfullyAdded} NFT${successfullyAdded !== 1 ? 's' : ''} to your collection!`;
      
      // Calculate total failed NFTs (both due to collection size limit and storage limitations)
      const totalFailed = nftsToSkip + failedToAdd;
      
      if (totalFailed > 0) {
        successMessage += ` (${totalFailed} NFT${totalFailed !== 1 ? 's' : ''} could not be added)`;
      }
      
      // Use styled notification
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          successMessage,
          totalFailed > 0 ? 'warning' : 'success',
          5000
        );
      } else {
        // Fallback
        alert(successMessage);
      }
      
    } catch (error) {
      console.error('Error adding selected NFTs to collection:', error);
      
      // Use styled notification
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error adding NFTs to collection',
          'error',
          3000
        );
      } else {
        alert('Error adding NFTs to collection. Please try again.');
      }
    }
  }

  // Helper method to add NFTs WITHOUT image data (storage workaround)
  continueAddingWithoutImages(nftsToAdd) {
    try {
      console.log(`[DEBUG] Adding ${nftsToAdd} NFTs without image data (storage workaround)`);
      
      // Get storage keys
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Calculate how many NFTs will be skipped
      const nftsToSkip = this.generatedNFTs.length - nftsToAdd;
      
      // Add only the NFTs that fit
      const nftsToAddList = this.generatedNFTs.slice(0, nftsToAdd);
      
      // Add to saved seeds WITHOUT imageData (will regenerate on demand)
      const newSeeds = nftsToAddList.map(nft => ({
        seed: nft.seed,
        traits: nft.traits,
        // imageData: nft.imageData, // OMITTED to save storage
        rarity: nft.rarity,
        timestamp: Date.now()
      }));
      
      console.log(`[DEBUG] Storage usage WITHOUT images: ${(this.estimateStorageSize(newSeeds) / 1024).toFixed(2)} KB`);
      
      // Try to add seeds without images
      let successfullyAdded = 0;
      let failedToAdd = 0;
      
      try {
        // First, try to add all at once
        savedSeeds.push(...newSeeds);
        localStorage.setItem(seedListKey, JSON.stringify(savedSeeds));
        successfullyAdded = nftsToAddList.length;
        console.log(`[DEBUG] Successfully added all ${successfullyAdded} NFTs without images`);
      } catch (error) {
        console.warn('[DEBUG] Failed to add all NFTs at once, trying individual addition:', error);
        
        // If that fails, try adding one by one
        for (let i = 0; i < newSeeds.length; i++) {
          try {
            const currentSavedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
            currentSavedSeeds.push(newSeeds[i]);
            localStorage.setItem(seedListKey, JSON.stringify(currentSavedSeeds));
            successfullyAdded++;
          } catch (individualError) {
            console.error(`[DEBUG] Failed to add NFT ${i + 1}:`, individualError);
            failedToAdd++;
            
            // If we're hitting storage limits, stop trying
            if (individualError.name === 'QuotaExceededError' || 
                individualError.message.includes('string length') ||
                individualError.message.includes('RangeError')) {
              console.warn('[DEBUG] Storage limit reached even without images, stopping');
              break;
            }
          }
        }
      }
      
      // Update seed counter
      this.updateSeedCounter();
      
      // Update NFT count panel
      if (window.updateNftCountPanel) {
        window.updateNftCountPanel();
      }
      
      // Show styled success message
      if (window.NFTApp && window.NFTApp.notificationService) {
        let message = `Successfully added ${successfullyAdded} NFTs to your collection (without thumbnails)!`;
        
        const totalFailed = nftsToSkip + failedToAdd;
        if (totalFailed > 0) {
          message += ` ${totalFailed} NFTs could not be added.`;
        }
        
        window.NFTApp.notificationService.show(message, "success", 5000);
      } else {
        // Fallback
        let successMessage = `✅ Successfully added ${successfullyAdded} NFTs to your collection!\n\n`;
        successMessage += `💡 Images were not saved (to conserve storage).\n`;
        successMessage += `   Thumbnails will regenerate automatically when you open the collection.`;
        
        const totalFailed = nftsToSkip + failedToAdd;
        if (totalFailed > 0) {
          successMessage += `\n\n⚠️ ${totalFailed} NFTs failed to be added.`;
        }
        
        alert(successMessage);
      }
      
      console.log(`[DEBUG] Addition complete: ${successfullyAdded} added, ${failedToAdd + nftsToSkip} failed/skipped`);
      
    } catch (error) {
      console.error('[DEBUG] Error in continueAddingWithoutImages:', error);
      
      if (window.NFTApp && window.NFTApp.notificationService) {
        window.NFTApp.notificationService.show(
          'Error adding NFTs to collection. Check console for details.',
          "error",
          4000
        );
      } else {
        alert('Error adding NFTs to collection. Please check console for details.');
      }
    }
  }

  // Helper method to add SELECTED NFTs WITHOUT image data (storage workaround)
  continueAddingSelectedWithoutImages(nftsToAddList, nftsToSkip) {
    try {
      console.log(`[DEBUG] Adding ${nftsToAddList.length} selected NFTs without image data (storage workaround)`);
      
      // Get storage key - MUST match the key used in continueAddSelectedToCollection
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Add to saved seeds WITHOUT imageData (will regenerate on demand)
      const newSeeds = nftsToAddList.map(nft => ({
        seed: nft.seed,
        traits: nft.traits,
        // imageData: nft.imageData, // OMITTED to save storage
        rarity: nft.rarity || 'common', // Ensure rarity is set
        timestamp: Date.now()
      }));
      
      console.log(`[DEBUG] Storage usage WITHOUT images: ${(this.estimateStorageSize(newSeeds) / 1024).toFixed(2)} KB`);
      
      // Try to add seeds without images
      let successfullyAdded = 0;
      let failedToAdd = 0;
      
      try {
        // First, try to add all at once
        savedSeeds.push(...newSeeds);
        localStorage.setItem(seedListKey, JSON.stringify(savedSeeds));
        successfullyAdded = nftsToAddList.length;
        console.log(`[DEBUG] Successfully added all ${successfullyAdded} selected NFTs without images`);
      } catch (error) {
        console.warn('[DEBUG] Failed to add all NFTs at once, trying individual addition:', error);
        
        // If that fails, try adding one by one
        for (let i = 0; i < newSeeds.length; i++) {
          try {
            const currentSavedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
            currentSavedSeeds.push(newSeeds[i]);
            localStorage.setItem(seedListKey, JSON.stringify(currentSavedSeeds));
            successfullyAdded++;
          } catch (individualError) {
            console.error(`[DEBUG] Failed to add selected NFT ${i + 1}:`, individualError);
            failedToAdd++;
            
            // If we're hitting storage limits, stop trying
            if (individualError.name === 'QuotaExceededError' || 
                individualError.message.includes('string length') ||
                individualError.message.includes('RangeError')) {
              console.warn('[DEBUG] Storage limit reached even without images, stopping');
              break;
            }
          }
        }
      }
      
      // Update seed counter
      this.updateSeedCounter();
      
      // Update NFT count panel
      if (window.updateNftCountPanel) {
        window.updateNftCountPanel();
      }
      
      // Update NFT count panel
      if (window.updateNftCountPanel) {
        window.updateNftCountPanel();
      }
      
      // Show styled success message
      if (window.NFTApp && window.NFTApp.notificationService) {
        let message = `Successfully added ${successfullyAdded} selected NFTs to your collection (without thumbnails)!`;
        
        const totalFailed = nftsToSkip + failedToAdd;
        if (totalFailed > 0) {
          message += ` ${totalFailed} NFTs could not be added.`;
        }
        
        window.NFTApp.notificationService.show(message, "success", 5000);
      } else {
        // Fallback
        let successMessage = `✅ Successfully added ${successfullyAdded} selected NFTs to your collection!\n\n`;
        successMessage += `💡 Images were not saved (to conserve storage).\n`;
        successMessage += `   Thumbnails will regenerate automatically when you open the collection.`;
        
        const totalFailed = nftsToSkip + failedToAdd;
        if (totalFailed > 0) {
          successMessage += `\n\n⚠️ ${totalFailed} NFTs failed to be added.`;
        }
        
        alert(successMessage);
      }
      
      console.log(`[DEBUG] Selected addition complete: ${successfullyAdded} added, ${failedToAdd + nftsToSkip} failed/skipped`);
      
      // Update collection space counter after adding selected NFTs
      this.updateCollectionSpaceCounter();
      
    } catch (error) {
      console.error('[DEBUG] Error in continueAddingSelectedWithoutImages:', error);
      
      if (window.NFTApp && window.NFTApp.notificationService) {
        window.NFTApp.notificationService.show(
          'Error adding selected NFTs to collection. Check console for details.',
          "error",
          4000
        );
      } else {
        alert('Error adding selected NFTs to collection. Please check console for details.');
      }
    }
  }

  copySelectedSeeds() {
    if (this.selectedNFTs.size === 0) {
      console.warn('No NFTs selected to copy seeds');
      return;
    }
    
    try {
      // Get selected NFTs in the order they were generated
      const selectedNFTs = this.generatedNFTs.filter(nft => this.selectedNFTs.has(nft.id));
      
      // Extract seeds and join them with line breaks (one per line)
      const seedsList = selectedNFTs.map(nft => nft.seed).join('\n');
      
      // Copy to clipboard
      this.copySeedsToClipboard(seedsList, selectedNFTs.length);
    } catch (error) {
      console.error('[DEBUG] Error copying selected seeds:', error);
      alert('Error copying seeds. Please try again.');
    }
  }

  copySeedsToClipboard(seedsList, count) {
    navigator.clipboard.writeText(seedsList).then(() => {
      console.log(`[DEBUG] Copied ${count} seeds to clipboard`);
      
      // Show success notification
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          `Copied ${count} seed${count > 1 ? 's' : ''} to clipboard`, 
          "success", 
          2500
        );
      } else {
        alert(`Copied ${count} seed${count > 1 ? 's' : ''} to clipboard`);
      }
    }).catch(err => {
      console.error('[DEBUG] Failed to copy seeds to clipboard:', err);
      
      // Fallback: Show seeds in an alert if clipboard API fails
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Failed to copy to clipboard. Check console for seeds.", 
          "error", 
          3000
        );
      } else {
        alert('Failed to copy to clipboard. Please try again.');
      }
    });
  }

  // Auto-import seeds to project (like the seed import feature)
  autoImportSeedsToProject(nftsToAddList, nftsToSkip) {
    try {
      // Validate inputs
      if (!nftsToAddList || nftsToAddList.length === 0) {
        console.warn('[DEBUG] No NFTs to add to collection');
        return;
      }

      const seedListKey = this.getSeedListKey();
      if (!seedListKey) {
        throw new Error('Could not determine seed list key for current project');
      }

      // Get existing seeds from localStorage
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      let added = 0;
      let duplicates = 0;
      
      console.log('[DEBUG] Auto-importing', nftsToAddList.length, 'seeds to project (seed-only approach)');
      
      // Process each NFT - only save the seed (like import seed method)
      nftsToAddList.forEach(nft => {
        if (!nft || !nft.seed) {
          console.warn('[DEBUG] Skipping invalid NFT:', nft);
          return;
        }

        // Check if seed already exists
        if (!savedSeeds.some(s => s.seed === nft.seed)) {
          // Create a minimal seed object (like import seed method)
          const seedObj = {
            seed: nft.seed,
            traits: [], // Will be populated when thumbnail is generated
            rarity: 'common',
            rarityScore: 0,
            timestamp: Date.now()
            // No imageData - will be generated on demand
          };
          savedSeeds.push(seedObj);
          added++;
        } else {
          duplicates++;
        }
      });
      
      if (added > 0) {
        // Save to localStorage (much smaller data)
        localStorage.setItem(seedListKey, JSON.stringify(savedSeeds));
        
        // Update project data
        const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
        if (projectData) {
          projectData.savedSeeds = savedSeeds;
        }
        
        // Update all counters
        window.updateAllCounters();
        
        // Show success message with details
        let message = `Successfully added ${added} NFT${added !== 1 ? 's' : ''} to your collection.`;
        if (duplicates > 0) {
          message += `\n\n${duplicates} duplicate${duplicates !== 1 ? 's' : ''} were skipped.`;
        }
        if (nftsToSkip > 0) {
          message += `\n\n${nftsToSkip} NFT${nftsToSkip !== 1 ? 's' : ''} were skipped due to collection size limit.`;
        }
        
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(message, 'success', 4000);
        } else {
          alert(message);
        }
        
        console.log('[DEBUG] Auto-import completed:', { added, duplicates, skipped: nftsToSkip, totalSeeds: savedSeeds.length });
        
        // Generate thumbnails in background (like import seed method)
        setTimeout(() => {
          this.generateThumbnailsForAddedSeeds(nftsToAddList.map(nft => nft.seed)).catch(error => {
            console.error('[DEBUG] Background thumbnail generation failed:', error);
          });
        }, 1000);
        
      } else {
        alert('No new NFTs were added. All selected NFTs already exist in your collection.');
      }
      
    } catch (error) {
      console.error('[DEBUG] Error auto-importing seeds:', error);
      const errorMessage = error.message || 'Unknown error occurred';
      
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          `Error adding NFTs to collection: ${errorMessage}`,
          'error',
          5000
        );
      } else {
        alert(`Error adding NFTs to collection: ${errorMessage}`);
      }
    }
  }

  updateSeedCounter() {
    // Update the global seed counter
    const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
    if (generateNftsUIModule && generateNftsUIModule.refreshSeedListCounter) {
      generateNftsUIModule.refreshSeedListCounter();
    }
  }

  // Generate thumbnails for added seeds (like import seed method)
  async generateThumbnailsForAddedSeeds(addedSeeds) {
    console.log('[DEBUG] Generating thumbnails for', addedSeeds.length, 'added seeds');
    
    const seedListKey = this.getSeedListKey();
    const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
    
    // Process seeds one by one
    for (let i = 0; i < addedSeeds.length; i++) {
      const seed = addedSeeds[i];
      try {
        console.log(`[DEBUG] Processing seed ${i + 1}/${addedSeeds.length}:`, seed);
        
        // Find the seed object in the seed list
        const seedObj = savedSeeds.find(s => s.seed === seed);
        if (!seedObj) {
          console.warn('[DEBUG] Seed object not found for:', seed);
          continue;
        }

        // Generate image for the seed using the NFT generator
        if (window.NFTApp && window.NFTApp.getModule('generateNfts')) {
          const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
          if (projectData) {
            // Generate NFT with the specific seed
            const nft = window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, seed);
            if (nft && nft.imageData) {
              console.log('[DEBUG] Successfully generated image for seed:', seed);
              
              // Update the seed object with the generated data
              seedObj.imageData = nft.imageData;
              seedObj.thumbnail = nft.imageData;
              seedObj.traits = nft.traits || [];
              seedObj.rarity = nft.rarity || 'common';
              seedObj.rarityScore = nft.rarityScore || 0;
              
              console.log('[DEBUG] Generated thumbnail for seed:', seed);
            } else {
              console.error('[DEBUG] No image data generated for seed:', seed);
            }
          }
        }
        
        // Small delay to prevent blocking the UI
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error('[DEBUG] Error generating thumbnail for seed:', seed, error);
      }
    }
    
    // Save updated seed list with thumbnails
    localStorage.setItem(seedListKey, JSON.stringify(savedSeeds));
    console.log('[DEBUG] Background thumbnail generation completed');
  }

  // Get the correct localStorage key for the current project
  // IMPORTANT: This must return the same format as used in saved-seeds-modal.js
  getSeedListKey() {
    const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    return 'nftSeedList_' + (projectData && projectData.name ? encodeURIComponent(projectData.name) : 'default');
  }

  // Get maximum collection size from project data
  getMaxCollectionSize(projectData) {
    if (!projectData) return 10000; // Default fallback
    
    // Check total supply input field first (most current value)
    const totalSupplyInput = document.getElementById('total-supply');
    if (totalSupplyInput && totalSupplyInput.value) {
      const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
      const parsed = parseInt(cleanValue, 10);
      if (parsed && parsed > 0) return parsed;
    }
    
    // Fallback to project data
    if (projectData.totalSupply) {
      return parseInt(projectData.totalSupply, 10) || 10000;
    }
    if (projectData.size) {
      return parseInt(projectData.size, 10) || 10000;
    }
    
    return 10000; // Default fallback
  }

  // Get current collection size from localStorage
  getCurrentCollectionSize() {
    try {
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      return savedSeeds.length;
    } catch (error) {
      console.error('[DEBUG] Error getting current collection size:', error);
      return 0;
    }
  }


  // Get rarity rank for a seed considering it as part of the collection
  async getRarityRank(seed) {
    try {
      // Check cache first to avoid repeated calculations
      if (this.rarityScoreCache && this.rarityScoreCache.has(seed)) {
        const cachedData = this.rarityScoreCache.get(seed);
        if (cachedData.timestamp && (Date.now() - cachedData.timestamp) < 30000) { // 30 second cache
          return cachedData.rank || '---';
        }
      }

      // Rarity rank calculation disabled for batch generation performance
      if (this.isGenerating) {
        return '---';
      }

      // Get project data
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
      if (!projectData) {
        return '---';
      }

      // Get current saved seeds (existing collection)
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Calculate rarity rank for this NFT compared to the existing collection
      const rarityRank = await this.calculateRarityRankForSeed(seed, savedSeeds, projectData);
      
      // Cache the result
      if (this.rarityScoreCache) {
        this.rarityScoreCache.set(seed, {
          rank: rarityRank,
          timestamp: Date.now()
        });
      }
      
      return rarityRank || '---';
    } catch (error) {
      console.error('Error calculating rarity rank:', error);
      return '---';
    }
  }

  // Calculate rarity rank for a specific seed
  async calculateRarityRankForSeed(seed, seedList, projectData) {
    try {
      // Get the NFT data for this seed
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule) {
        return '---';
      }

      // Generate the NFT to get its traits and averageRarityScore
      const nft = await generateNftsModule.generateSingleNFT(projectData, false, seed);
      if (!nft || !nft.traits) {
        return '---';
      }

      // Calculate rarity rank based on averageRarityScore compared to existing collection
      const rarityRank = await this.calculateRarityRankFromScore(nft.averageRarityScore, seedList, projectData);
      
      return rarityRank;
    } catch (error) {
      console.error('Error in calculateRarityRankForSeed:', error);
      return '---';
    }
  }

  // Calculate rarity score for NFT traits
  calculateRarityScore(traits, projectData) {
    let totalScore = 0;
    
    // Calculate score based on trait rarities
    for (const [traitName, traitValue] of Object.entries(traits)) {
      const layer = projectData.traits.find(l => l.name === traitName);
      if (layer && layer.traits) {
        const trait = layer.traits.find(t => t.name === traitValue);
        if (trait && trait.rarity) {
          totalScore += parseFloat(trait.rarity) || 0;
        }
      }
    }
    
    return totalScore;
  }

  // Calculate rarity rank from score by comparing against existing collection
  async calculateRarityRankFromScore(score, seedList, projectData) {
    try {
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule) {
        return '---';
      }

      // Generate all existing NFTs to get their scores for comparison
      const nftScores = [];
      
      // Process seeds in batches to avoid performance issues
      const batchSize = 10;
      for (let i = 0; i < seedList.length; i += batchSize) {
        const batch = seedList.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (seedObj) => {
          try {
            // Check cache first
            const cacheKey = seedObj.seed;
            if (this.rarityScoreCache.has(cacheKey)) {
              return this.rarityScoreCache.get(cacheKey);
            }
            
            const nft = await generateNftsModule.generateSingleNFT(projectData, false, seedObj.seed);
            const score = nft ? nft.averageRarityScore : 100;
            
            // Cache the score
            this.rarityScoreCache.set(cacheKey, score);
            
            return score;
          } catch (error) {
            console.error('Error generating NFT for score calculation:', error);
            return 100; // Default score if generation fails
          }
        });
        
        const batchScores = await Promise.all(batchPromises);
        nftScores.push(...batchScores);
      }
      
      // Sort scores in ascending order (lower score = more rare = better rank)
      nftScores.sort((a, b) => a - b);
      
      // Find how many existing NFTs have a lower (better) score than the current NFT
      const betterCount = nftScores.filter(existingScore => existingScore < score).length;
      
      // The rank is the position among all NFTs (existing + current)
      const rank = betterCount + 1;
      
      return rank.toString();
    } catch (error) {
      console.error('Error in calculateRarityRankFromScore:', error);
      return '---';
    }
  }

  // Setup drag and drop for NFT cards (replicated from Saved Seeds modal)
  setupCardDragAndDrop(card, index) {
    console.log('[DEBUG] Setting up drag and drop for card at index:', index);
    
    const globalIndex = parseInt(card.dataset.index);
    const seed = card.dataset.seed;
    
    if (globalIndex === undefined || !seed) {
      console.warn('[DEBUG] Invalid card data for drag and drop:', { globalIndex, seed });
      return;
    }
    
    // Prevent buttons from interfering with drag
    const buttons = card.querySelectorAll('.seed-card-btn');
    buttons.forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        // Don't prevent propagation for button mousedown
        // This allows click events to work properly
      });
      
      btn.addEventListener('dragstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Drag start event
    card.addEventListener('dragstart', (e) => {
      console.log('[DEBUG] ===== DRAG STARTED =====');
      console.log('[DEBUG] Card index:', globalIndex);
      console.log('[DEBUG] Card seed:', seed);
      console.log('[DEBUG] Event target:', e.target);
      console.log('[DEBUG] Card element:', card);
      
      e.dataTransfer.setData('text/plain', globalIndex.toString());
      e.dataTransfer.effectAllowed = 'move';
      
      // Add visual feedback
      card.classList.add('dragging');
      card.style.cursor = 'grabbing';
      
      // Store the dragged element
      this.draggedElement = card;
      this.draggedIndex = globalIndex;
      
      // Store original page for cross-page drag
      this.originalPage = this.currentPage;
      
      // Show drop zones between cards
      this.createDropZones();
      
      // Set up cross-page drag detection
      this.setupCrossPageDragDetection();
    });

    // Drag end event
    card.addEventListener('dragend', (e) => {
      console.log('[DEBUG] ===== DRAG ENDED =====');
      
      // Remove visual feedback
      card.classList.remove('dragging');
      card.style.cursor = 'grab';
      
      // Clear dragged element
      this.draggedElement = null;
      this.draggedIndex = null;
      
      // Clean up cross-page drag detection
      this.cleanupCrossPageDragDetection();
      
      // Hide drop zones
      this.removeDropZones();
    });
  }

  // Create drop zones between cards (replicated from Saved Seeds modal)
  createDropZones() {
    console.log('[DEBUG] Creating drop zones between cards');
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;

    // Enable drag mode
    grid.classList.add('drag-mode');

    const cards = grid.querySelectorAll('.saved-seed-card');
    console.log('[DEBUG] Creating drop zones for', cards.length, 'cards');

    // Add visual indicators and drop event handlers to cards
    cards.forEach((card, i) => {
      // Add a visual indicator that shows this card can be a drop target
      card.classList.add('drop-target');
      
      // Add data attributes for positioning
      const globalIndex = i; // Since we're showing all NFTs, index is global
      card.dataset.globalIndex = globalIndex;
      card.dataset.position = i;
      
      // Add dragover event listener
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (this.draggedElement && this.draggedElement !== card) {
          card.classList.add('drag-over');
        }
      });
      
      // Add dragleave event listener
      card.addEventListener('dragleave', (e) => {
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('drag-over');
        }
      });
      
      // Add drop event listener
      card.addEventListener('drop', async (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        console.log('[DEBUG] Drop on card at global index:', globalIndex);
        console.log('[DEBUG] Dragged index:', draggedIndex);
        
        if (draggedIndex !== globalIndex && draggedIndex !== undefined && !isNaN(draggedIndex)) {
          console.log('[DEBUG] Moving NFT from index', draggedIndex, 'to index', globalIndex);
          await this.reorderNFTs(draggedIndex, globalIndex);
        }
      });
    });
  }

  // Remove all drop zones (replicated from Saved Seeds modal)
  removeDropZones() {
    console.log('[DEBUG] Removing drop zones');
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;

    // Disable drag mode
    grid.classList.remove('drag-mode');

    // Remove visual indicators from cards
    const cards = grid.querySelectorAll('.saved-seed-card');
    cards.forEach(card => {
      card.classList.remove('drop-target', 'drag-over');
    });
  }

  // Set up cross-page drag detection
  setupCrossPageDragDetection() {
    if (!this.modal) return;
    
    const pagination = this.modal.querySelector('#batch-pagination');
    if (!pagination) return;
    
    // Add dragover event to pagination container
    pagination.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Find the page number button being hovered
      const pageButton = e.target.closest('.pagination-btn');
      if (pageButton && !pageButton.disabled && pageButton.textContent.match(/^\d+$/)) {
        const pageNumber = parseInt(pageButton.textContent);
        this.handleDragOverPage(pageNumber);
      }
    });
    
    // Add dragleave event to pagination container
    pagination.addEventListener('dragleave', (e) => {
      // Only clear if leaving the pagination area entirely
      if (!pagination.contains(e.relatedTarget)) {
        this.clearDragOverPage();
      }
    });
    
    // Add drop event to pagination container
    pagination.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDropOnPage();
    });
  }

  // Handle drag over a page number
  handleDragOverPage(pageNumber) {
    if (this.dragOverPageNumber === pageNumber) return;
    
    // Clear any existing timeout
    if (this.dragOverPageTimeout) {
      clearTimeout(this.dragOverPageTimeout);
    }
    
    this.dragOverPageNumber = pageNumber;
    
    // Add visual feedback to the page button
    this.highlightPageButton(pageNumber);
    
    // Set a timeout to switch pages (500ms delay for better UX)
    this.dragOverPageTimeout = setTimeout(() => {
      if (this.dragOverPageNumber === pageNumber && pageNumber !== this.currentPage) {
        console.log('[DEBUG] Switching to page', pageNumber, 'during drag');
        this.switchToPageDuringDrag(pageNumber);
      }
    }, 500);
  }

  // Clear drag over page state
  clearDragOverPage() {
    if (this.dragOverPageTimeout) {
      clearTimeout(this.dragOverPageTimeout);
      this.dragOverPageTimeout = null;
    }
    
    if (this.dragOverPageNumber) {
      this.unhighlightPageButton(this.dragOverPageNumber);
      this.dragOverPageNumber = null;
    }
  }

  // Clean up cross-page drag detection
  cleanupCrossPageDragDetection() {
    this.clearDragOverPage();
    
    // Remove all event listeners from pagination
    if (this.modal) {
      const pagination = this.modal.querySelector('#batch-pagination');
      if (pagination) {
        pagination.removeEventListener('dragover', this.handleDragOverPage);
        pagination.removeEventListener('dragleave', this.clearDragOverPage);
        pagination.removeEventListener('drop', this.handleDropOnPage);
      }
    }
  }

  // Highlight a page button during drag
  highlightPageButton(pageNumber) {
    const pagination = this.modal.querySelector('#batch-pagination');
    if (!pagination) return;
    
    const pageButtons = pagination.querySelectorAll('.pagination-btn');
    pageButtons.forEach(btn => {
      if (btn.textContent === pageNumber.toString()) {
        btn.classList.add('drag-over-page');
        btn.style.backgroundColor = '#4a90e2';
        btn.style.color = 'white';
        btn.style.transform = 'scale(1.1)';
        btn.style.transition = 'all 0.2s ease';
      }
    });
  }

  // Unhighlight a page button
  unhighlightPageButton(pageNumber) {
    const pagination = this.modal.querySelector('#batch-pagination');
    if (!pagination) return;
    
    const pageButtons = pagination.querySelectorAll('.pagination-btn');
    pageButtons.forEach(btn => {
      if (btn.textContent === pageNumber.toString()) {
        btn.classList.remove('drag-over-page');
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.transform = '';
        btn.style.transition = '';
      }
    });
  }

  // Switch to a page during drag
  switchToPageDuringDrag(pageNumber) {
    if (pageNumber === this.currentPage) return;
    
    console.log('[DEBUG] Switching to page', pageNumber, 'during drag');
    
    // Switch to the new page
    this.goToPage(pageNumber);
    
    // Recreate drop zones on the new page
    this.createDropZones();
  }

  // Handle drop on a page (when dropping on pagination area)
  handleDropOnPage() {
    if (this.dragOverPageNumber && this.dragOverPageNumber !== this.currentPage) {
      // Switch to the target page first
      this.switchToPageDuringDrag(this.dragOverPageNumber);
      
      // Then handle the drop on the first position of that page
      setTimeout(() => {
        this.handleDropOnPagePosition(0);
      }, 100);
    }
  }

  // Handle drop on a specific position within a page
  handleDropOnPagePosition(position) {
    if (!this.draggedElement || this.draggedIndex === null) return;
    
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const targetIndex = startIndex + position;
    
    console.log('[DEBUG] Dropping at page position', position, 'global index', targetIndex);
    
    // Perform the reorder
    this.reorderNFTs(this.draggedIndex, targetIndex);
  }

  // Reorder NFTs in the batch
  async reorderNFTs(fromIndex, toIndex) {
    console.log('[DEBUG] ===== REORDERING NFTS =====');
    console.log('[DEBUG] Reordering NFTs from index', fromIndex, 'to index', toIndex);
    
    // Validate indices
    if (fromIndex < 0 || fromIndex >= this.generatedNFTs.length ||
        toIndex < 0 || toIndex >= this.generatedNFTs.length) {
      console.log('[DEBUG] Invalid indices for reordering');
      return;
    }
    
    // Perform the reorder
    const nft = this.generatedNFTs.splice(fromIndex, 1)[0];
    this.generatedNFTs.splice(toIndex, 0, nft);
    
    console.log('[DEBUG] Reorder completed');
    
    // Re-render all NFTs to reflect the new order (async)
    await this.renderPage(1);
  }

  // Calculate rarity rank asynchronously without blocking the UI
  async calculateRarityRankAsync(seed, card) {
    try {
      const rarityRank = await this.getRarityRank(seed);
      const rarityElement = card.querySelector('.seed-card-rarity');
      
      if (rarityElement) {
        if (rarityRank && rarityRank !== '---') {
          rarityElement.textContent = `rarity rank: ${rarityRank}`;
        } else {
          rarityElement.textContent = 'error';
        }
      }
    } catch (error) {
      console.error('Error calculating rarity rank:', error);
      const rarityElement = card.querySelector('.seed-card-rarity');
      if (rarityElement) {
        rarityElement.textContent = 'error';
      }
    }
  }

  // Calculate rarity rank for a single NFT as if it belonged to the collection
  async calculateRarityRankForSingleNFT(nftData) {
    // Check if generation was cancelled
    if (this.isCancelled) {
      console.log('[DEBUG] Rarity calculation cancelled for NFT:', nftData.id);
      return;
    }

    try {
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
      if (!projectData) {
        console.log('[DEBUG] No project data available for rarity calculation');
        return;
      }

      // Get existing saved seeds (current collection)
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Create a temporary seed list that includes this NFT as if it were in the collection
      const tempSeedList = [...savedSeeds, { seed: nftData.seed }];
      
      // Calculate rarity rank for this NFT considering it as part of the collection
      const rarityRank = await this.calculateRarityRankForSeed(nftData.seed, tempSeedList, projectData);
      
      // Update the NFT card with the calculated rarity rank
      const card = this.modal.querySelector(`[data-nft-id="${nftData.id}"]`);
      if (card) {
        // Preserve selection state before updating
        const wasSelected = card.classList.contains('selected');
        
        const rarityElement = card.querySelector('.seed-card-rarity');
        if (rarityElement) {
          if (rarityRank && rarityRank !== '---') {
            rarityElement.textContent = `rarity rank: ${rarityRank}`;
          } else {
            rarityElement.textContent = 'error';
          }
        }
        
        // Restore selection state after updating
        if (wasSelected) {
          card.classList.add('selected');
        }
      }
      
      // Cache the result
      if (this.rarityScoreCache) {
        this.rarityScoreCache.set(nftData.seed, {
          rank: rarityRank,
          timestamp: Date.now()
        });
      }
      
      console.log('[DEBUG] Rarity rank calculated for NFT:', nftData.id, 'Rank:', rarityRank);
    } catch (error) {
      console.error('Error calculating rarity rank for single NFT:', error);
      const card = this.modal.querySelector(`[data-nft-id="${nftData.id}"]`);
      if (card) {
        const rarityElement = card.querySelector('.seed-card-rarity');
        if (rarityElement) {
          rarityElement.textContent = 'error';
        }
      }
    }
  }

  // Calculate rarity ranks for all generated NFTs after batch generation is complete
  async calculateRarityRanksForBatch() {
    console.log('[DEBUG] Calculating rarity ranks for batch...');
    
    // Process NFTs in small batches to avoid blocking
    const batchSize = 5;
    for (let i = 0; i < this.generatedNFTs.length; i += batchSize) {
      const batch = this.generatedNFTs.slice(i, i + batchSize);
      
      // Process each NFT in the batch
      const promises = batch.map(async (nft) => {
        try {
          const rarityRank = await this.getRarityRank(nft.seed);
          
          // Update the rarity display in the card
          const card = this.modal.querySelector(`[data-nft-id="${nft.id}"]`);
          if (card) {
            const rarityElement = card.querySelector('.seed-card-rarity');
            if (rarityElement) {
              if (rarityRank && rarityRank !== '---') {
                rarityElement.textContent = `rarity rank: ${rarityRank}`;
              } else {
                rarityElement.textContent = 'error';
              }
            }
          }
        } catch (error) {
          console.error('Error calculating rarity rank for NFT:', nft.id, error);
        }
      });
      
      // Wait for this batch to complete
      await Promise.all(promises);
      
      // Small delay to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('[DEBUG] Rarity ranks calculation completed');
  }

  // Load NFT card image asynchronously
  async loadNFTCardImage(card, nft) {
    const thumbnail = card.querySelector('.seed-card-thumbnail');
    const loading = thumbnail.querySelector('.seed-card-loading');
    
    try {
      if (nft.imageData) {
        const img = new Image();
        img.onload = () => {
          loading.style.display = 'none';
          
          // Get existing elements safely
          const rarityElement = thumbnail.querySelector('.seed-card-rarity');
          const numberElement = thumbnail.querySelector('.seed-card-number-display');
          
          // Build innerHTML safely
          let innerHTML = `<img src="${nft.imageData}" alt="NFT ${nft.seed}" style="width: 100%; height: 100%; object-fit: cover;">`;
          
          if (rarityElement) {
            innerHTML += rarityElement.outerHTML;
          }
          
          if (numberElement) {
            innerHTML += numberElement.outerHTML;
          }
          
          thumbnail.innerHTML = innerHTML;
        };
        img.onerror = () => {
          loading.style.display = 'none';
          
          // Get existing elements safely
          const rarityElement = thumbnail.querySelector('.seed-card-rarity');
          const numberElement = thumbnail.querySelector('.seed-card-number-display');
          
          // Build innerHTML safely
          let innerHTML = `<div class="no-image">No Image</div>`;
          
          if (rarityElement) {
            innerHTML += rarityElement.outerHTML;
          }
          
          if (numberElement) {
            innerHTML += numberElement.outerHTML;
          }
          
          thumbnail.innerHTML = innerHTML;
        };
        img.src = nft.imageData;
      } else {
        loading.style.display = 'none';
        
        // Get existing elements safely
        const rarityElement = thumbnail.querySelector('.seed-card-rarity');
        const numberElement = thumbnail.querySelector('.seed-card-number-display');
        
        // Build innerHTML safely
        let innerHTML = `<div class="no-image">No Image</div>`;
        
        if (rarityElement) {
          innerHTML += rarityElement.outerHTML;
        }
        
        if (numberElement) {
          innerHTML += numberElement.outerHTML;
        }
        
        thumbnail.innerHTML = innerHTML;
      }
    } catch (error) {
      console.error('Error loading NFT image:', error);
      loading.style.display = 'none';
      
      // Get existing elements safely
      const rarityElement = thumbnail.querySelector('.seed-card-rarity');
      const numberElement = thumbnail.querySelector('.seed-card-number-display');
      
      // Build innerHTML safely
      let innerHTML = `<div class="error-image">Error</div>`;
      
      if (rarityElement) {
        innerHTML += rarityElement.outerHTML;
      }
      
      if (numberElement) {
        innerHTML += numberElement.outerHTML;
      }
      
      thumbnail.innerHTML = innerHTML;
    }
  }

  // Append a new NFT card directly to the grid without re-rendering
  async appendNFTCardToGrid(nft, index) {
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;
    
    // Remove "no-seeds" message if it exists
    const noSeedsMessage = grid.querySelector('.no-seeds');
    if (noSeedsMessage) {
      noSeedsMessage.remove();
    }
    
    // Create the NFT card (async)
    const card = await this.createNFTCard(nft, index);
    
    // Check if this NFT should be selected
    if (this.selectedNFTs.has(nft.id)) {
      card.classList.add('selected');
    }
    
    // Rarity calculation disabled for performance
    // No additional rarity processing needed
    
    // Append it to the grid
    grid.appendChild(card);
  }

  // Edit NFT from batch
  async editNFT(nftId, index) {
    try {
      console.log('[DEBUG] Opening NFT Edit Modal for batch NFT:', nftId, 'at index:', index);
      
      // Find the NFT in the generatedNFTs array
      const nft = this.generatedNFTs.find(n => n.id === nftId);
      if (!nft) {
        console.error('[DEBUG] NFT not found:', nftId);
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'NFT not found',
            'error',
            3000
          );
        }
        return;
      }
      
      // Get the project data
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData || !projectData.traits || projectData.traits.length === 0) {
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'No project data available for editing',
            'error',
            3000
          );
        }
        return;
      }
      
      console.log('[DEBUG] NFT found, opening edit modal');
      
      // Open the NFT Edit Modal
      if (window.NFTEditModal) {
        window.NFTEditModal.open(
          nft,
          projectData,
          'batch-generation',
          index,
          async (updatedNFT, nftIndex) => {
            // Update callback: update the NFT in the batch generation collection
            console.log('[DEBUG] Updating NFT in batch generation collection at index:', nftIndex);
            
            // Find the NFT again to update it
            const nftToUpdateIndex = this.generatedNFTs.findIndex(n => n.id === nftId);
            if (nftToUpdateIndex !== -1) {
              // Update the NFT with new data (lightweight approach - no NFT imageData but preserve trait imageData)
              this.generatedNFTs[nftToUpdateIndex] = {
                ...this.generatedNFTs[nftToUpdateIndex],
                seed: updatedNFT.seed,
                traits: (updatedNFT.traits || []).map(trait => ({
                  ...trait,
                  // PRESERVE: imageData for trait thumbnails (essential for UI)
                  imageData: trait.imageData
                })),
                rarity: updatedNFT.rarity || 'common',
                rarityScore: updatedNFT.rarityScore || 0,
                timestamp: updatedNFT.timestamp || Date.now()
                // NFT imageData and thumbnail are omitted, but trait imageData is preserved
              };
              
              // Update temporary seeds list with new seed at the same position
              this.updateTemporarySeed(nftToUpdateIndex, updatedNFT.seed);
              
              // Show edited icon on the NFT card
              this.showEditedIcon(nftToUpdateIndex);
              
              // Refresh the display to show the updated NFT
              await this.renderPage(this.currentPage);
              
              console.log('[DEBUG] NFT updated successfully in batch generation');
            } else {
              console.error('[DEBUG] Could not find NFT to update');
            }
          }
        );
      } else {
        console.error('[DEBUG] NFT Edit Modal not available');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Edit modal not available',
            'error',
            3000
          );
        }
      }
      
    } catch (error) {
      console.error('[DEBUG] Error editing NFT:', error);
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error loading NFT for editing',
          'error',
          3000
        );
      }
    }
  }

  // Delete NFT from batch
  deleteNFTFromBatch(nftId, card) {
    const seedValue = card.dataset.seed;
    
    // Use the app's styled confirmation modal instead of browser confirm
    if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
      window.NFTApp.getModule("confirmationModal").show(
        "Delete NFT",
        `<div style="margin-top: 12px;">Are you sure you want to delete this NFT from the batch with seed:</div>`,
        `<div style="font-size: 11px; color: #95a5a6; margin-top: 4px; margin-bottom: 16px; word-break: break-all;">"${seedValue}"</div><div style="color: #fff; margin-top: 8px;">This action cannot be undone.</div>`,
        () => {
          // Remove from generatedNFTs array
          const index = this.generatedNFTs.findIndex(nft => nft.id === nftId);
          if (index !== -1) {
            this.generatedNFTs.splice(index, 1);
          }
          
          // Remove from selectedNFTs if it was selected
          this.selectedNFTs.delete(nftId);
          
          // Remove the card from DOM
          card.remove();
          
          // Update counters
          this.updateSelectionCounter();
          this.updateTotalCounter();
          
          // Update button states
          this.updateButtonStates();
        }
      );
    } else {
      // Fallback to browser confirm if modal not available
      const confirmed = confirm(`Delete NFT with seed "${seedValue}" from batch?`);
      if (!confirmed) return;
      
      // Remove from generatedNFTs array
      const index = this.generatedNFTs.findIndex(nft => nft.id === nftId);
      if (index !== -1) {
        this.generatedNFTs.splice(index, 1);
      }
      
      // Remove from selectedNFTs if it was selected
      this.selectedNFTs.delete(nftId);
      
      // Remove the card from DOM
      card.remove();
      
      // Update counters
      this.updateSelectionCounter();
      this.updateTotalCounter();
      
      // Update button states
      this.updateButtonStates();
    }
  }

  // Show NFT viewer pop-up
  showNFTViewer(nftId, card) {
    const nft = this.generatedNFTs.find(n => n.id === nftId);
    if (!nft) return;

    // Use the same simple image display as Saved Seeds modal
    this.showLargePreview(nft.imageData);
  }

  showLargePreview(imageData) {
    const preview = document.createElement('div');
    preview.style.position = 'fixed';
    preview.style.top = '0';
    preview.style.left = '0';
    preview.style.width = '100vw';
    preview.style.height = '100vh';
    preview.style.background = 'rgba(0,0,0,0.9)';
    preview.style.zIndex = '10020';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
    preview.innerHTML = `<img src="${imageData}" style="max-width:90vw;max-height:90vh;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" />`;
    document.body.appendChild(preview);
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        preview.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    
    preview.onclick = () => {
      preview.remove();
      document.removeEventListener('keydown', escHandler);
    };
    
    document.addEventListener('keydown', escHandler);
  }

  // Update collection space counter
  updateCollectionSpaceCounter() {
    try {
      // Get project data
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
      if (!projectData) {
        console.log('[DEBUG] No project data available for collection space counter');
        return;
      }

      // Helper function to get total supply (same as addBatchToCollection)
      const getTotalSupply = (pd) => {
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
        return null; // No default fallback
      };

      // Get current saved seeds to check collection size
      const seedListKey = this.getSeedListKey();
      const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      const currentCollectionSize = savedSeeds.length;
      const maxCollectionSize = getTotalSupply(projectData);
      
      // Calculate available space
      const availableSpace = maxCollectionSize ? Math.max(0, maxCollectionSize - currentCollectionSize) : 0;
      
      // Update the counter display
      const availableSpaceElement = document.getElementById('available-space');
      const totalSpaceElement = document.getElementById('total-space');
      
      if (availableSpaceElement && totalSpaceElement) {
        availableSpaceElement.textContent = availableSpace.toLocaleString();
        totalSpaceElement.textContent = maxCollectionSize ? maxCollectionSize.toLocaleString() : '0';
        
        console.log('[DEBUG] Collection space counter updated:', {
          current: currentCollectionSize,
          max: maxCollectionSize,
          available: availableSpace
        });
      }
    } catch (error) {
      console.error('[DEBUG] Error updating collection space counter:', error);
    }
  }

}

// Register the modal globally
window.BatchGenerationModal = BatchGenerationModal;
