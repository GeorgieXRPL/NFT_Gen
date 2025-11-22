class BatchGenerationModal {
  constructor() {
    console.log('[DEBUG] BatchGenerationModal constructor called');
    this.modal = null;
    this.generatedNFTs = [];
    this.selectedNFTs = new Set();
    this.selectedNFTsOrder = []; // Track selection order for adding to collection
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
              <button id="generate-batch-btn" class="batch-generation-btn generate-btn tooltip">Generate Batch
                <span class="tooltiptext">Input the number of random nfts<br>you want to generate and press<br> the 'Generate Batch' button.</span>
              </button>
              <input type="number" id="batch-count-input" placeholder="100" min="1" max="10000" class="batch-count-input">
              <button id="dark-mode-toggle" class="batch-generation-btn dark-mode-toggle tooltip">
                <span class="toggle-label">Dark NFTs</span>
                <span class="tooltiptext">use this filter in case you want to generate nfts considering only part of the traits on your collection. This is useful to create nfts with particular styles or using particular dominant colors (like dark colors, for instance). By default, the app will consider a major percentage of dark traits, but this can be personalized ("EDIT" button).</span>
              </button>
              <button id="add-batch-btn" class="batch-generation-btn add-batch-btn tooltip">Add Batch
                <span class="tooltiptext">Add entire Generated Batch<br>NFTs to your Collection</span>
              </button>
              <div class="selected-count-display" id="selected-count-display">
                <span id="selected-count-text">0</span> NFTs selected
              </div>
              <button id="add-selected-btn" class="batch-generation-btn add-selected-btn tooltip" disabled>Add Selected
                <span class="tooltiptext">Add Selected NFTs<br>to your Collection</span>
              </button>
              <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; margin-top: -18px;">
                <div style="display: flex; align-items: center; gap: 4px;">
                  <div style="color: #555; font-size: 12px; font-weight: 500; line-height: 1;">┌</div>
                  <div style="color: #fff; font-size: 12px; font-weight: 500;">Seeds</div>
                  <div style="color: #555; font-size: 12px; font-weight: 500; line-height: 1;">┐</div>
                </div>
                <div style="display: flex; gap: 8px;">
                  <button id="copy-selected-seeds-btn" class="batch-generation-btn copy-selected-seeds-btn tooltip" style="background: #555; opacity: 1; cursor: not-allowed; color: #888;" disabled>Copy
                    <span class="tooltiptext">Copy All Seeds from<br>selected NFTs to clipboard</span>
                  </button>
                  <button id="import-seeds-btn" class="batch-generation-btn import-seeds-btn tooltip" style="background: #10b981; color: #fff;">Import
                    <span class="tooltiptext">Import NFTs<br>from seed list</span>
                  </button>
                </div>
              </div>
            </div>
            <button id="close-batch-modal" class="close-btn">
              &times;
            </button>
          </div>
          <div id="batch-nfts-grid" class="saved-seeds-grid">
            <div class="no-seeds">No NFTs generated yet. Click "Generate Batch" to start.</div>
          </div>
          
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
      
      // Setup Dark NFTs tooltip using global tooltip manager (positioned ABOVE button)
      const darkTooltipText = darkModeToggle.querySelector('.tooltiptext');
      if (darkTooltipText) {
        // Use global tooltip manager for consistent behavior and standard tooltip styles
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          // Setup tooltip with custom positioning (above button, not below)
          tooltipManager.setupTooltip(darkModeToggle, darkTooltipText, {
            position: 'above', // Position above button
            zIndex: 2147483647 // Higher z-index for Dark NFTs tooltip
          });
        } else {
          // Fallback: Use setupTooltipPositioning from generateNftsUI if available
          const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUI && generateNftsUI.setupTooltipPositioning) {
            generateNftsUI.setupTooltipPositioning(darkModeToggle, darkTooltipText);
          } else {
            // Final fallback: Custom positioning above button
            let tooltipTimeout = null;
            
            darkModeToggle.addEventListener('mouseenter', function() {
              // Only show tooltip if button is NOT active
              if (darkModeToggle.classList.contains('active')) {
                darkTooltipText.style.setProperty('visibility', 'hidden', 'important');
                darkTooltipText.style.setProperty('opacity', '0', 'important');
                return;
              }
              
              // Clear any existing timeout
              if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
              }
              
              // Show tooltip after 1 second delay (standard tooltip delay)
              tooltipTimeout = setTimeout(() => {
                requestAnimationFrame(() => {
                  const rect = darkModeToggle.getBoundingClientRect();
                  
                  // Temporarily show tooltip to get its dimensions (but keep it invisible)
                  darkTooltipText.style.setProperty('position', 'fixed', 'important');
                  darkTooltipText.style.setProperty('visibility', 'hidden', 'important');
                  darkTooltipText.style.setProperty('opacity', '0', 'important');
                  darkTooltipText.style.setProperty('display', 'block', 'important');
                  darkTooltipText.style.setProperty('top', '-9999px', 'important');
                  darkTooltipText.style.setProperty('left', '-9999px', 'important');
                  darkTooltipText.style.setProperty('transform', 'none', 'important');
                  
                  // Force reflow to get accurate measurements
                  void darkTooltipText.offsetHeight;
                  const tooltipRect = darkTooltipText.getBoundingClientRect();
                  const tooltipHeight = tooltipRect.height || 60;
                  
                  // Position tooltip ABOVE the button (arrow points down)
                  const top = rect.top - tooltipHeight - 8; // 8px gap above button
                  const left = rect.left + (rect.width / 2); // Center horizontally
                  
                  // Apply standard tooltip styles from tooltip.css
                  darkTooltipText.style.setProperty('position', 'fixed', 'important');
                  darkTooltipText.style.setProperty('top', `${top}px`, 'important');
                  darkTooltipText.style.setProperty('left', `${left}px`, 'important');
                  darkTooltipText.style.setProperty('transform', 'translateX(-50%)', 'important');
                  darkTooltipText.style.setProperty('z-index', '2147483647', 'important');
                  
                  // Fade in with transition
                  requestAnimationFrame(() => {
                    darkTooltipText.style.setProperty('visibility', 'visible', 'important');
                    darkTooltipText.style.setProperty('opacity', '1', 'important');
                  });
                });
                tooltipTimeout = null;
              }, 1000); // 1 second delay
            });
            
            darkModeToggle.addEventListener('mouseleave', function() {
              // Clear timeout if mouse leaves before delay completes
              if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
              }
              // Fade out with transition
              darkTooltipText.style.setProperty('opacity', '0', 'important');
              setTimeout(() => {
                darkTooltipText.style.setProperty('visibility', 'hidden', 'important');
              }, 1000);
            });
          }
        }
      }
      
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

    // Import seeds button
    const importSeedsBtn = this.modal.querySelector('#import-seeds-btn');
    if (importSeedsBtn) {
      importSeedsBtn.onclick = () => this.openImportSeedsModal();
    }

    // CRITICAL: Set up tooltips for batch generation modal buttons using global tooltip manager
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    if (tooltipManager && tooltipManager.setupTooltip) {
      // Set up tooltips for all batch generation modal header buttons
      const batchButtons = [
        this.modal.querySelector('#generate-batch-btn'),
        this.modal.querySelector('#add-batch-btn'),
        this.modal.querySelector('#add-selected-btn'),
        this.modal.querySelector('#copy-selected-seeds-btn'),
        this.modal.querySelector('#import-seeds-btn')
      ];
      
      batchButtons.forEach(button => {
        if (button) {
          const tooltip = button.querySelector('.tooltiptext');
          if (tooltip) {
            tooltipManager.setupTooltip(button, tooltip);
          }
        }
      });
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
      
      // CRITICAL: Add Enter key support - pressing Enter triggers Generate Batch button
      countInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.keyCode === 13) {
          e.preventDefault(); // Prevent form submission if inside a form
          
          // Only trigger if input has a valid number
          const value = parseInt(countInput.value);
          if (value && value >= 1 && value <= 10000) {
            // Get Generate Batch button reference
            const generateBatchBtn = this.modal.querySelector('#generate-batch-btn');
            // Trigger Generate Batch button click
            if (generateBatchBtn && !generateBatchBtn.disabled) {
              generateBatchBtn.click();
            } else {
              // Fallback: call startBatchGeneration directly if button click doesn't work
              this.startBatchGeneration();
            }
          }
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
      // Force update to ensure we get the latest count from localStorage or modal instance
      setTimeout(() => {
        this.updateCollectionSpaceCounter();
      }, 100); // Small delay to ensure localStorage and modal instance are synced
      this.updateCollectionSpaceCounter(); // Also update immediately
      
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
    this.selectedNFTsOrder = []; // Clear selection order when resetting
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
    editButton.className = 'batch-dark-traits-edit-btn tooltip';
    editButton.innerHTML = 'EDIT';
    editButton.style.cssText = `
      position: absolute;
      top: -14px;
      right: 63px;
      width: 40px;
      height: 20px;
      border-radius: 4px;
      background: #e17055;
      color: #fff;
      border: 2px solid #000;
      font-size: 12px;
      font-weight: bold;
      cursor: pointer;
      display: none;
      z-index: 1000;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.2s ease;
      align-items: center;
      justify-content: center;
    `;

    // Create tooltip text
    // CRITICAL: Use exact same tooltip text as Generate NFTs tab Dark NFTs EDIT button
    const tooltipText = document.createElement('span');
    tooltipText.className = 'tooltiptext';
    tooltipText.innerHTML = 'Configure which traits are used for Dark NFT generation.<br>By default, the app considers a major percentage of dark traits,<br>but this can be personalized to match your collection style.';
    editButton.appendChild(tooltipText);

    // CRITICAL: Use global tooltip manager for EDIT button tooltip (ensures only one tooltip shows at a time)
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    if (tooltipManager && tooltipManager.setupTooltip) {
      tooltipManager.setupTooltip(editButton, tooltipText);
    }

    // Add hover effects (scale transform) - separate from tooltip
    editButton.addEventListener('mouseenter', () => {
      // Apply hover effect (scale transform)
      editButton.style.background = '#d63031';
      editButton.style.transform = 'scale(1.1)';
    });

    editButton.addEventListener('mouseleave', () => {
      // Remove hover effect
      editButton.style.background = '#e17055';
      editButton.style.transform = 'scale(1)';
      
      // CRITICAL: Hide tooltip using global tooltip manager (if available)
      if (tooltipManager && tooltipManager.hideCurrentTooltip) {
        tooltipManager.hideCurrentTooltip();
      } else if (tooltipText) {
        // Fallback: hide tooltip directly
        tooltipText.style.visibility = 'hidden';
        tooltipText.style.opacity = '0';
      }
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
          // Uses MessageChannel for background tabs which is less throttled
          if (typeof yieldToBrowser === 'function') {
            await yieldToBrowser();
          } else {
            // Fallback if utility function not available
            await new Promise(resolve => {
              if (!document.hidden) {
                requestAnimationFrame(() => setTimeout(resolve, 0));
              } else {
                const channel = new MessageChannel();
                channel.port1.onmessage = () => {
                  channel.port1.close();
                  channel.port2.close();
                  resolve();
                };
                channel.port2.postMessage(null);
              }
            });
          }
        
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
    const importSeedsBtn = this.modal.querySelector('#import-seeds-btn');
    
    if (this.isGenerating) {
      generateBtn.disabled = true;
      addBatchBtn.disabled = true;
      addSelectedBtn.disabled = true;
      if (copySelectedSeedsBtn) {
        copySelectedSeedsBtn.disabled = true;
        copySelectedSeedsBtn.style.background = '#555';
        copySelectedSeedsBtn.style.color = '#888';
        copySelectedSeedsBtn.style.cursor = 'not-allowed';
      }
      if (importSeedsBtn) {
        importSeedsBtn.disabled = true;
      }
    } else {
      generateBtn.disabled = false;
      addBatchBtn.disabled = this.generatedNFTs.length === 0;
      addSelectedBtn.disabled = this.selectedNFTs.size === 0;
      if (copySelectedSeedsBtn) {
        copySelectedSeedsBtn.disabled = this.selectedNFTs.size === 0;
        if (this.selectedNFTs.size === 0) {
          copySelectedSeedsBtn.style.background = '#555';
          copySelectedSeedsBtn.style.color = '#888';
          copySelectedSeedsBtn.style.cursor = 'not-allowed';
        } else {
          copySelectedSeedsBtn.style.background = '#6c5ce7';
          copySelectedSeedsBtn.style.color = '#fff';
          copySelectedSeedsBtn.style.cursor = 'pointer';
        }
      }
      // Import button is always enabled (doesn't depend on selection)
      if (importSeedsBtn) {
        importSeedsBtn.disabled = false;
      }
    }
  }

  async renderPage(page) {
    if (!this.modal) return;
    
    const grid = this.modal.querySelector('#batch-nfts-grid');
    
    if (!grid) return;
    
    if (!this.generatedNFTs.length) {
      grid.innerHTML = '<div class="no-seeds">No NFTs generated yet. Click "Generate Batch" to start.</div>';
      return;
    }

    // Clear grid
    grid.innerHTML = '';

    // Render all NFTs instead of paginated view (async)
    for (let i = 0; i < this.generatedNFTs.length; i++) {
      const nft = this.generatedNFTs[i];
      const card = await this.createNFTCard(nft, i);
      
      // Check if this NFT has been deleted (added to collection)
      if (nft.deleted) {
        this.markCardAsDeleted(card);
      } else {
        // Restore selection state if this NFT was selected (only if not deleted)
        if (this.selectedNFTs.has(nft.id)) {
          card.classList.add('selected');
        }
      }
      
      grid.appendChild(card);
    }

    // Pagination removed from batch generation modal (no longer needed)
    // All NFTs are shown in a scrollable grid
    
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
        <div class="seed-card-loading">Loading<span class="loading-dots">...</span><br>Please Wait.</div>
        ${rarityDisplay}
        ${nftNumberDisplay}
      </div>
      <div class="seed-card-info">
        <div class="seed-card-number">${nft.seed}</div>
        <div class="seed-card-buttons">
          <button class="seed-card-btn edit-btn tooltip" data-action="edit">EDIT
            <span class="tooltiptext">Open this NFT to edit it's<br>traits and regenerate it.</span>
          </button>
          <button class="seed-card-btn copy-btn tooltip" data-action="copy">COPY
            <span class="tooltiptext">Copy this NFT's seed<br>to your clipboard</span>
          </button>
          <button class="seed-card-btn delete-btn tooltip" data-action="delete">DELETE
            <span class="tooltiptext">Remove this NFT from<br>the Bulk Generated list</span>
          </button>
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
    // Setup tooltips using global tooltip manager for consistent behavior
    const buttons = card.querySelectorAll('.seed-card-btn');
    buttons.forEach(btn => {
      const tooltipText = btn.querySelector('.tooltiptext');
      if (tooltipText) {
        // Use global tooltip manager for consistent behavior and standard tooltip styles
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(btn, tooltipText);
        } else {
          // Fallback: Use setupTooltipPositioning from generateNftsUI if available
          const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUI && generateNftsUI.setupTooltipPositioning) {
            generateNftsUI.setupTooltipPositioning(btn, tooltipText);
          } else {
            // Final fallback: Custom positioning with standard tooltip styles
            // CRITICAL: Apply standard tooltip styling from tooltip.css
            tooltipText.style.setProperty('background-color', '#000000', 'important');
            tooltipText.style.setProperty('background', '#000000', 'important');
            tooltipText.style.setProperty('color', '#f39c12', 'important');
            tooltipText.style.setProperty('border-radius', '6px', 'important');
            tooltipText.style.setProperty('padding', '8px 12px', 'important');
            tooltipText.style.setProperty('font-size', '11px', 'important');
            tooltipText.style.setProperty('font-family', "'Archivo', sans-serif", 'important');
            tooltipText.style.setProperty('line-height', '1.2', 'important');
            tooltipText.style.setProperty('box-shadow', '0 3px 10px rgba(0, 0, 0, 0.5)', 'important');
            tooltipText.style.setProperty('text-align', 'center', 'important');
            tooltipText.style.setProperty('white-space', 'normal', 'important');
            tooltipText.style.setProperty('max-width', '300px', 'important');
            tooltipText.style.setProperty('width', 'max-content', 'important');
            tooltipText.style.setProperty('z-index', '2147483647', 'important');
            tooltipText.style.setProperty('position', 'fixed', 'important');
            tooltipText.style.setProperty('transition', 'opacity 1s ease', 'important');
            tooltipText.style.setProperty('visibility', 'hidden', 'important');
            tooltipText.style.setProperty('opacity', '0', 'important');
            tooltipText.style.setProperty('pointer-events', 'none', 'important');
            tooltipText.style.setProperty('display', 'block', 'important');
            
            let tooltipTimeout = null;
            
            btn.addEventListener('mouseenter', function() {
              if (!tooltipText) return;
              
              // Clear any existing timeout
              if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
              }
              
              // Show tooltip after 1 second delay (standard tooltip delay)
              tooltipTimeout = setTimeout(() => {
                // Use double requestAnimationFrame to ensure button is fully positioned before calculating
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    const rect = btn.getBoundingClientRect();
                    
                    // Temporarily show tooltip to get its dimensions (but keep it invisible)
                    tooltipText.style.setProperty('position', 'fixed', 'important');
                    tooltipText.style.setProperty('visibility', 'hidden', 'important');
                    tooltipText.style.setProperty('opacity', '0', 'important');
                    tooltipText.style.setProperty('display', 'block', 'important');
                    tooltipText.style.setProperty('top', '-9999px', 'important');
                    tooltipText.style.setProperty('left', '-9999px', 'important');
                    tooltipText.style.setProperty('transform', 'none', 'important');
                    
                    // Force reflow to get accurate measurements
                    void tooltipText.offsetHeight;
                    
                    const tooltipRect = tooltipText.getBoundingClientRect();
                    const tooltipWidth = tooltipRect.width || 200;
                    const tooltipHeight = tooltipRect.height || 60;
                    
                    // Position tooltip above the button, horizontally centered
                    const top = rect.top - tooltipHeight - 5; // 5px gap above button
                    const left = rect.left + (rect.width / 2); // Center horizontally on button
                    
                    // Apply final positioning with all necessary properties
                    tooltipText.style.setProperty('position', 'fixed', 'important');
                    tooltipText.style.setProperty('top', `${top}px`, 'important');
                    tooltipText.style.setProperty('left', `${left}px`, 'important');
                    tooltipText.style.setProperty('transform', 'translateX(-50%)', 'important'); // Center tooltip on button
                    tooltipText.style.setProperty('z-index', '2147483647', 'important');
                    
                    // Fade in with transition
                    requestAnimationFrame(() => {
                      tooltipText.style.setProperty('visibility', 'visible', 'important');
                      tooltipText.style.setProperty('opacity', '1', 'important');
                    });
                  });
                });
                tooltipTimeout = null;
              }, 1000); // 1 second delay
            });
            
            btn.addEventListener('mouseleave', function() {
              if (tooltipText) {
                // Clear timeout if mouse leaves before delay completes
                if (tooltipTimeout) {
                  clearTimeout(tooltipTimeout);
                  tooltipTimeout = null;
                }
                // Fade out with transition
                tooltipText.style.setProperty('opacity', '0', 'important');
                setTimeout(() => {
                  tooltipText.style.setProperty('visibility', 'hidden', 'important');
                }, 1000);
              }
            });
          }
        }
      }
      
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
              // Change button to show "copied" feedback - CRITICAL: Preserve tooltip element
              const copyBtn = card.querySelector('.copy-btn');
              if (copyBtn) {
                // Get the text node (the button text "COPY") - preserve tooltip
                let textNode = null;
                for (let node of copyBtn.childNodes) {
                  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    textNode = node;
                    break;
                  }
                }
                const originalText = textNode ? textNode.textContent.trim() : 'COPY';
                const originalBackground = copyBtn.style.backgroundColor;
                
                // Set copied state - only change the text node, not the entire content (preserves tooltip)
                if (textNode) {
                  textNode.textContent = 'Copied';
                } else {
                  // If no text node found, create one and insert before tooltip
                  const copiedNode = document.createTextNode('Copied');
                  const tooltipElement = copyBtn.querySelector('.tooltiptext');
                  if (tooltipElement) {
                    copyBtn.insertBefore(copiedNode, tooltipElement);
                  } else {
                    copyBtn.appendChild(copiedNode);
                  }
                }
                copyBtn.style.backgroundColor = '#00ff00'; // Vivid green
                copyBtn.style.color = '#000000'; // Black text for contrast
                copyBtn.style.fontWeight = 'bold';
                
                // Reset after 1.5 seconds
                setTimeout(() => {
                  // Restore button text while preserving tooltip
                  const currentTextNode = Array.from(copyBtn.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                  );
                  if (currentTextNode) {
                    currentTextNode.textContent = originalText;
                  } else {
                    // If no text node found, create one and insert before tooltip
                    const textNodeToRestore = document.createTextNode(originalText);
                    const tooltipToPreserve = copyBtn.querySelector('.tooltiptext');
                    if (tooltipToPreserve) {
                      copyBtn.insertBefore(textNodeToRestore, tooltipToPreserve);
                    } else {
                      copyBtn.appendChild(textNodeToRestore);
                    }
                  }
                  copyBtn.style.backgroundColor = originalBackground;
                  copyBtn.style.color = '';
                  copyBtn.style.fontWeight = '';
                }, 1500);
              }
            }).catch(() => {
              // If clipboard fails, show brief error feedback - CRITICAL: Preserve tooltip element
              const copyBtn = card.querySelector('.copy-btn');
              if (copyBtn) {
                // Get the text node (the button text "COPY") - preserve tooltip
                let textNodeForError = null;
                for (let node of copyBtn.childNodes) {
                  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
                    textNodeForError = node;
                    break;
                  }
                }
                const originalText = textNodeForError ? textNodeForError.textContent.trim() : 'COPY';
                
                // Change only the text node, not the entire content (preserves tooltip)
                if (textNodeForError) {
                  textNodeForError.textContent = 'Failed';
                } else {
                  // If no text node found, create one and insert before tooltip
                  const failedNode = document.createTextNode('Failed');
                  const tooltipElement = copyBtn.querySelector('.tooltiptext');
                  if (tooltipElement) {
                    copyBtn.insertBefore(failedNode, tooltipElement);
                  } else {
                    copyBtn.appendChild(failedNode);
                  }
                }
                copyBtn.style.backgroundColor = '#ff0000'; // Red for error
                copyBtn.style.color = '#ffffff';
                
                setTimeout(() => {
                  // Restore button text while preserving tooltip
                  const currentTextNodeForError = Array.from(copyBtn.childNodes).find(node => 
                    node.nodeType === Node.TEXT_NODE && node.textContent.trim()
                  );
                  if (currentTextNodeForError) {
                    currentTextNodeForError.textContent = originalText;
                  } else {
                    // If no text node found, create one and insert before tooltip
                    const textNodeToRestoreError = document.createTextNode(originalText);
                    const tooltipToPreserveError = copyBtn.querySelector('.tooltiptext');
                    if (tooltipToPreserveError) {
                      copyBtn.insertBefore(textNodeToRestoreError, tooltipToPreserveError);
                    } else {
                      copyBtn.appendChild(textNodeToRestoreError);
                    }
                  }
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
    // Prevent selecting deleted NFTs
    const nft = this.generatedNFTs.find(n => n.id === nftId);
    if (nft && nft.deleted) {
      console.log('[DEBUG] Cannot select deleted NFT:', nftId);
      return;
    }
    if (this.selectedNFTs.has(nftId)) {
      // Deselecting - remove from both Set and order array
      this.selectedNFTs.delete(nftId);
      const orderIndex = this.selectedNFTsOrder.indexOf(nftId);
      if (orderIndex > -1) {
        this.selectedNFTsOrder.splice(orderIndex, 1);
      }
      card.classList.remove('selected');
    } else {
      // Selecting - add to Set and append to order array
      this.selectedNFTs.add(nftId);
      this.selectedNFTsOrder.push(nftId);
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
        
        // Enable the copy button when NFTs are selected
        if (copySelectedSeedsBtn) {
          copySelectedSeedsBtn.disabled = false;
          copySelectedSeedsBtn.style.opacity = '1';
          copySelectedSeedsBtn.style.cursor = 'pointer';
        }
      } else {
        selectedDisplay.style.color = '#313131'; // Grey when not selected
        selectedCountText.style.color = '#313131'; // Grey when not selected
        
        // Disable the copy button when no NFTs are selected
        if (copySelectedSeedsBtn) {
          copySelectedSeedsBtn.disabled = true;
          copySelectedSeedsBtn.style.opacity = '0.5';
          copySelectedSeedsBtn.style.cursor = 'not-allowed';
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
        // Use styled confirmation modal instead of browser alert
        if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
          window.NFTApp.getModule("confirmationModal").show(
            "Collection is Full",
            `<div style="margin-top: 12px;">Maximum size is <strong>${maxCollectionSize} NFTs</strong>.</div>`,
            "",
            () => {
              // No action needed, just close
            },
            {
              singleButton: true,
              confirmText: "OK"
            }
          );
        } else {
          alert(`Collection is full! Maximum size is ${maxCollectionSize} NFTs.`);
        }
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
                ⚠️ <strong>${nftsToSkip} NFT${nftsToSkip > 1 ? 's' : ''} to be selected</strong> will be skipped due to collection size limit.
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
                        `The last ${nftsToSkip} NFTs to be selected will be skipped due to collection size limit.`;
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
        
        // Mark buttons as outdated in saved seeds modal since NFTs were added
        if (window.savedSeedsModalInstance && typeof window.savedSeedsModalInstance.markButtonsOutdated === 'function') {
          window.savedSeedsModalInstance.markButtonsOutdated();
        }
        
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
      // Get selected NFTs in the order they were SELECTED (preserving user's selection order)
      const selectedNFTs = this.selectedNFTsOrder
        .map(nftId => this.generatedNFTs.find(nft => nft.id === nftId))
        .filter(nft => nft && !nft.deleted); // Filter out deleted NFTs
      
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
      
      // Always show the order note in blue
      const orderNote = `<div style="color: #2680eb; margin-top: 12px; margin-bottom: 12px; font-size: 13px;">* NFTs will be added to your collection by the same order you have selected them.</div>`;
      
      if (nftsToSkip > 0) {
        confirmDescription = `
          <div style="text-align: left; margin-top: 12px; line-height: 1.6;">
            ${orderNote}
            <div style="text-align: center; margin-top: 16px; margin-bottom: 8px;">
              <div style="margin-bottom: 8px; color: #fbbf24;"><strong>⚠️ Collection Space Limit</strong></div>
              <div style="margin-bottom: 6px;">Collection space limit: <strong>${maxCollectionSize} NFTs</strong></div>
              <div style="margin-bottom: 6px;">Current collection: <strong>${currentCollectionSize} NFTs</strong></div>
              <div style="margin-bottom: 12px;">Available space: <strong>${availableSpace} NFTs</strong></div>
            </div>
            <div style="text-align: center; color: #ef4444; margin-top: 12px; line-height: 1.5;">
              <div style="margin-bottom: 4px;">The last <strong>${nftsToSkip}</strong> NFT${nftsToSkip !== 1 ? 's' : ''} to be selected will be</div>
              <div>skipped due to collection size limit.</div>
            </div>
          </div>
        `;
      } else {
        // Show the order note even when there are no NFTs to skip
        confirmDescription = `
          <div style="text-align: left; margin-top: 12px; line-height: 1.6;">
            ${orderNote}
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
      let fallbackMessage = `Add ${nftsToAdd} selected NFTs to your collection?\n\n* NFTs will be added to your collection by the same order you have selected them.`;
      if (nftsToSkip > 0) {
        fallbackMessage += `\n\n⚠️ Collection space limit: ${maxCollectionSize} NFTs\n` +
                        `Current collection: ${currentCollectionSize} NFTs\n` +
                        `Available space: ${availableSpace} NFTs\n\n` +
                        `The last ${nftsToSkip} NFTs to be selected will be skipped due to collection size limit.`;
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
      
      // CRITICAL: Validate collection capacity BEFORE adding (prevent exceeding limit)
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      const maxCollectionSize = this.getMaxCollectionSize(projectData);
      const currentCollectionSize = savedSeeds.length;
      const availableSpace = Math.max(0, maxCollectionSize - currentCollectionSize);
      
      // Limit the NFTs to add based on available space
      if (availableSpace <= 0) {
        console.warn('[DEBUG] Collection is already at capacity (', currentCollectionSize, '/', maxCollectionSize, '). Cannot add more NFTs.');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Collection is already at capacity (${currentCollectionSize}/${maxCollectionSize}). Cannot add more NFTs.`,
            'warning',
            4000
          );
        }
        return;
      }
      
      // Enforce the limit: only add up to available space
      const actualNftsToAdd = Math.min(nftsToAddList.length, availableSpace);
      if (actualNftsToAdd < nftsToAddList.length) {
        const skipped = nftsToAddList.length - actualNftsToAdd;
        console.warn('[DEBUG] Collection capacity limit: Only', actualNftsToAdd, 'of', nftsToAddList.length, 'NFTs can be added. Skipping', skipped, 'NFT(s).');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Collection capacity limit reached. Only ${actualNftsToAdd} of ${nftsToAddList.length} NFTs can be added (${skipped} will be skipped).`,
            'warning',
            5000
          );
        }
        // Trim the list to only include what we can add
        nftsToAddList = nftsToAddList.slice(0, actualNftsToAdd);
      }
      
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
            
            // Check capacity before adding each seed
            if (currentSavedSeeds.length >= maxCollectionSize) {
              console.warn('[DEBUG] Collection capacity reached during one-by-one addition. Stopping at', currentSavedSeeds.length, '/', maxCollectionSize);
              failedToAdd = newSeeds.length - i;
              break;
            }
            
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
      
      // CRITICAL: Update saved seeds modal instance if it exists
      if (window.savedSeedsModalInstance) {
        // Reload seedList from localStorage to get the updated count
        if (typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
          window.savedSeedsModalInstance.seedList = [];
          window.savedSeedsModalInstance.loadSeedList(true); // Force reload
          console.log('[DEBUG] Reloaded modal seedList after adding selected NFTs (without images), count:', window.savedSeedsModalInstance.seedList?.length || 0);
        }
        
        // Update recalculate button state if modal is open
        if (window.savedSeedsModalInstance.updateRecalculateButtonState) {
          window.savedSeedsModalInstance.updateRecalculateButtonState();
        }
        
        // Update collection space counter
        if (window.savedSeedsModalInstance.updateCollectionSpaceCounter) {
          window.savedSeedsModalInstance.updateCollectionSpaceCounter();
        }
      }
      
      // Update ALL counters using unified system
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
      
      // Also update batch modal's own counter
      this.updateSeedCounter();
      
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
      
      // CRITICAL: Validate collection capacity BEFORE adding (prevent exceeding limit)
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      const maxCollectionSize = this.getMaxCollectionSize(projectData);
      const currentCollectionSize = savedSeeds.length;
      const availableSpace = Math.max(0, maxCollectionSize - currentCollectionSize);
      
      // Limit the NFTs to add based on available space
      if (availableSpace <= 0) {
        console.warn('[DEBUG] Collection is already at capacity (', currentCollectionSize, '/', maxCollectionSize, '). Cannot add more NFTs.');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Collection is already at capacity (${currentCollectionSize}/${maxCollectionSize}). Cannot add more NFTs.`,
            'warning',
            4000
          );
        }
        return;
      }
      
      // Enforce the limit: only add up to available space
      const actualNftsToAdd = Math.min(nftsToAddList.length, availableSpace);
      if (actualNftsToAdd < nftsToAddList.length) {
        const skipped = nftsToAddList.length - actualNftsToAdd;
        console.warn('[DEBUG] Collection capacity limit: Only', actualNftsToAdd, 'of', nftsToAddList.length, 'NFTs can be added. Skipping', skipped, 'NFT(s).');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Collection capacity limit reached. Only ${actualNftsToAdd} of ${nftsToAddList.length} NFTs can be added (${skipped} will be skipped).`,
            'warning',
            5000
          );
        }
        // Trim the list to only include what we can add
        nftsToAddList = nftsToAddList.slice(0, actualNftsToAdd);
      }
      
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
            
            // Check capacity before adding each seed
            if (currentSavedSeeds.length >= maxCollectionSize) {
              console.warn('[DEBUG] Collection capacity reached during one-by-one addition. Stopping at', currentSavedSeeds.length, '/', maxCollectionSize);
              failedToAdd = newSeeds.length - i;
              break;
            }
            
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
      // Get selected NFTs in the order they were SELECTED (preserving user's selection order)
      const selectedNFTs = this.selectedNFTsOrder
        .map(nftId => this.generatedNFTs.find(nft => nft.id === nftId))
        .filter(nft => nft && !nft.deleted); // Filter out deleted NFTs
      
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

      // CRITICAL: Validate collection capacity BEFORE adding (prevent exceeding limit)
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      const maxCollectionSize = this.getMaxCollectionSize(projectData);
      const currentCollectionSize = this.getCurrentCollectionSize();
      const availableSpace = Math.max(0, maxCollectionSize - currentCollectionSize);
      
      // Limit the NFTs to add based on available space
      if (availableSpace <= 0) {
        console.warn('[DEBUG] Collection is already at capacity (', currentCollectionSize, '/', maxCollectionSize, '). Cannot add more NFTs.');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Collection is already at capacity (${currentCollectionSize}/${maxCollectionSize}). Cannot add more NFTs.`,
            'warning',
            4000
          );
        }
        return;
      }
      
      // Enforce the limit: only add up to available space
      const actualNftsToAdd = Math.min(nftsToAddList.length, availableSpace);
      if (actualNftsToAdd < nftsToAddList.length) {
        const skipped = nftsToAddList.length - actualNftsToAdd;
        console.warn('[DEBUG] Collection capacity limit: Only', actualNftsToAdd, 'of', nftsToAddList.length, 'NFTs can be added. Skipping', skipped, 'NFT(s).');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Collection capacity limit reached. Only ${actualNftsToAdd} of ${nftsToAddList.length} NFTs can be added (${skipped} will be skipped).`,
            'warning',
            5000
          );
        }
        // Trim the list to only include what we can add
        nftsToAddList = nftsToAddList.slice(0, actualNftsToAdd);
      }

      // CRITICAL: Ensure modal instance has correct key before using its data
      if (window.savedSeedsModalInstance) {
        if (window.savedSeedsModalInstance.seedListKey !== seedListKey) {
          console.log('[DEBUG] Modal instance key mismatch. Updating from', window.savedSeedsModalInstance.seedListKey, 'to', seedListKey);
          window.savedSeedsModalInstance.seedListKey = seedListKey;
          // Force reload if key changed
          if (typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
            window.savedSeedsModalInstance.loadSeedList(true);
          }
        }
      }

      // CRITICAL: Always read from localStorage as the source of truth FIRST
      // Then compare with modal instance to ensure consistency
      let savedSeeds = [];
      try {
        savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
        console.log('[DEBUG] 🔍 Read from localStorage:', savedSeeds.length, 'seeds (key:', seedListKey, ')');
      } catch (parseError) {
        console.error('[DEBUG] Error parsing localStorage seedList:', parseError);
        savedSeeds = [];
      }
      
      // If localStorage is empty or has fewer seeds than modal instance, check modal instance
      // (But modal instance should be synced from localStorage, so this is a safety check)
      if (window.savedSeedsModalInstance && 
          window.savedSeedsModalInstance.seedListKey === seedListKey &&
          window.savedSeedsModalInstance.seedList && 
          Array.isArray(window.savedSeedsModalInstance.seedList)) {
        
        const modalSeedCount = window.savedSeedsModalInstance.seedList.length;
        
        if (modalSeedCount > savedSeeds.length) {
          // Modal instance has more seeds - use it (but this shouldn't normally happen)
          console.log('[DEBUG] ⚠️ Modal instance has MORE seeds (', modalSeedCount, ') than localStorage (', savedSeeds.length, ') - using modal instance');
          savedSeeds = window.savedSeedsModalInstance.seedList;
        } else if (savedSeeds.length > 0 && modalSeedCount === 0) {
          // localStorage has seeds but modal instance is empty - update modal instance
          console.log('[DEBUG] ✅ localStorage has seeds but modal instance is empty - updating modal instance');
          window.savedSeedsModalInstance.seedList = savedSeeds;
          window.savedSeedsModalInstance.seedListKey = seedListKey;
        } else if (savedSeeds.length === 0 && modalSeedCount === 0) {
          // Both are empty - this is expected for a new project
          console.log('[DEBUG] Both localStorage and modal instance are empty - starting fresh');
        }
      } else if (window.savedSeedsModalInstance && savedSeeds.length > 0) {
        // Modal instance doesn't have correct key or doesn't exist - update it
        window.savedSeedsModalInstance.seedList = savedSeeds;
        window.savedSeedsModalInstance.seedListKey = seedListKey;
        console.log('[DEBUG] Updated modal instance with seeds from localStorage');
      }
      
      // CRITICAL DEBUG: Log what we found
      console.log('[DEBUG] Auto-importing', nftsToAddList.length, 'seeds to project (seed-only approach)');
      console.log('[DEBUG] Existing seeds found:', savedSeeds.length);
      
      let added = 0;
      let duplicates = 0;
      
      // CRITICAL: Proactively optimize existing seedList to minimal format first
      // This prevents storage issues and ensures consistency
      const optimizedSeeds = savedSeeds.map(seed => {
        if (typeof seed === 'string' || typeof seed === 'number') {
          return { seed: String(seed) };
        }
        if (seed && seed.seed) {
          return { seed: String(seed.seed) };
        }
        return seed;
      }).filter(seed => seed && seed.seed);
      
      // Process each NFT - only save the seed number (lightest solution)
      nftsToAddList.forEach(nft => {
        if (!nft || !nft.seed) {
          console.warn('[DEBUG] Skipping invalid NFT:', nft);
          return;
        }

        const seedNumber = String(nft.seed);
        
        // Check if seed already exists (handle both object and plain formats)
        const seedExists = optimizedSeeds.some(s => {
          const existingSeed = typeof s === 'string' || typeof s === 'number' 
            ? String(s) 
            : (s && s.seed ? String(s.seed) : null);
          return existingSeed === seedNumber;
        });
        
        if (!seedExists) {
          // Save only the seed number (minimal format)
          optimizedSeeds.push({ seed: seedNumber });
          added++;
          console.log('[DEBUG] Added seed to collection:', seedNumber);
        } else {
          duplicates++;
          console.log('[DEBUG] Duplicate seed skipped:', seedNumber);
        }
      });
      
      if (added > 0) {
        // CRITICAL DEBUG: Log what we're about to save
        console.log('[DEBUG] 💾 Saving', optimizedSeeds.length, 'total seeds (original:', savedSeeds.length, '+ added:', added, ')');
        console.log('[DEBUG] 💾 First 3 existing seeds:', savedSeeds.slice(0, 3).map(s => typeof s === 'object' ? s.seed : s));
        console.log('[DEBUG] 💾 Last 3 saved seeds (including new):', optimizedSeeds.slice(-3).map(s => typeof s === 'object' ? s.seed : s));
        
        // Save optimized seedList to localStorage (minimal format - only seed numbers)
        try {
          localStorage.setItem(seedListKey, JSON.stringify(optimizedSeeds));
          console.log('[DEBUG] ✅ Saved', optimizedSeeds.length, 'seeds to localStorage (seedListKey:', seedListKey, ')');
          
          // CRITICAL: Verify what was actually saved
          const verify = JSON.parse(localStorage.getItem(seedListKey) || '[]');
          console.log('[DEBUG] ✅ Verified: localStorage now contains', verify.length, 'seeds');
          if (verify.length !== optimizedSeeds.length) {
            console.error('[DEBUG] ⚠️ MISMATCH! Expected', optimizedSeeds.length, 'but localStorage has', verify.length);
          }
          
          // Trigger resource monitoring after saving seeds
          document.dispatchEvent(new CustomEvent('seeds:imported', { 
            detail: { count: optimizedSeeds.length } 
          }));
        } catch (error) {
          console.error('[DEBUG] Error saving seeds to localStorage:', error);
          if (error.name === 'QuotaExceededError') {
            throw new Error('Storage quota exceeded. Please try adding fewer NFTs at a time.');
          }
          throw error;
        }
        
        // CRITICAL: Update savedSeedsModal instance if it exists (must match what we saved)
        if (window.savedSeedsModalInstance) {
          window.savedSeedsModalInstance.seedList = optimizedSeeds;
          window.savedSeedsModalInstance.seedListKey = seedListKey; // Ensure key matches
          console.log('[DEBUG] ✅ Updated modal instance seedList, count:', optimizedSeeds.length, 'key:', seedListKey);
          
          // Update recalculate button state if modal is open
          if (window.savedSeedsModalInstance.updateRecalculateButtonState) {
            window.savedSeedsModalInstance.updateRecalculateButtonState();
          }
          
          // Update collection space counter
          if (window.savedSeedsModalInstance.updateCollectionSpaceCounter) {
            window.savedSeedsModalInstance.updateCollectionSpaceCounter();
          }
        }
        
        // Update project data
        const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
        if (projectData) {
          projectData.savedSeeds = optimizedSeeds;
        }
        
        // CRITICAL: Update all counters to reflect new collection count
        if (window.updateAllCounters) {
          window.updateAllCounters();
          console.log('[DEBUG] Called updateAllCounters after adding seeds');
        }
        
        // Also force update individual counters
        if (window.updateNftCountPanel) {
          window.updateNftCountPanel();
          console.log('[DEBUG] Called updateNftCountPanel after adding seeds');
        }
        
        if (window.NFTApp && window.NFTApp.getModule('generateNftsUI') && 
            typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
          window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true);
          console.log('[DEBUG] Called refreshSeedListCounter after adding seeds');
        }
        
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
        
        console.log('[DEBUG] Auto-import completed:', { added, duplicates, skipped: nftsToSkip, totalSeeds: optimizedSeeds.length });
        
        // Mark added NFTs as deleted in the bulk generation modal
        // This leaves blank/deleted cards in the UI
        nftsToAddList.forEach(nft => {
          // Find the NFT in generatedNFTs array and mark as deleted
          const nftIndex = this.generatedNFTs.findIndex(g => g.id === nft.id);
          if (nftIndex !== -1) {
            this.generatedNFTs[nftIndex].deleted = true;
            // Remove from selectedNFTs if it was selected
            this.selectedNFTs.delete(nft.id);
            // Also remove from selection order array
            const orderIndex = this.selectedNFTsOrder.indexOf(nft.id);
            if (orderIndex > -1) {
              this.selectedNFTsOrder.splice(orderIndex, 1);
            }
            
            // Update the card UI to show as deleted
            const grid = this.modal.querySelector('#batch-nfts-grid');
            if (grid) {
              const card = grid.querySelector(`[data-nft-id="${nft.id}"]`);
              if (card) {
                this.markCardAsDeleted(card);
              }
            }
          }
        });
        
        // Update counters and button states after marking as deleted
        this.updateSelectionCounter();
        this.updateTotalCounter();
        this.updateButtonStates();
        
        // Generate thumbnails in background (like import seed method)
        setTimeout(() => {
          this.generateThumbnailsForAddedSeeds(nftsToAddList.map(nft => nft.seed)).catch(error => {
            console.error('[DEBUG] Background thumbnail generation failed:', error);
          });
        }, 1000);
        
      } else {
        const message = 'No new NFTs were added. All selected NFTs already exist in your collection.';
        
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(message, 'warning', 4000);
        } else {
          alert(message);
        }
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
    
    // Pagination removed from batch generation modal
    // No pagination exists, so no cross-page drag detection needed
    return;
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
    
    // Pagination removed, no cleanup needed
  }

  // Highlight a page button during drag (no pagination in batch generation)
  highlightPageButton(pageNumber) {
    // No pagination in batch generation modal
    return;
  }

  // Unhighlight a page button (no pagination in batch generation)
  unhighlightPageButton(pageNumber) {
    // No pagination in batch generation modal
    return;
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
    
    // Perform the reorder in the data array
    const nft = this.generatedNFTs.splice(fromIndex, 1)[0];
    this.generatedNFTs.splice(toIndex, 0, nft);
    
    console.log('[DEBUG] Reorder completed in data array');
    
    // Instead of rerendering, just move the DOM cards and update their data attributes
    this.reorderCardsInDOM(fromIndex, toIndex);
    
    // Update NFT numbers for affected cards
    this.updateNFTNumbersAfterReorder(fromIndex, toIndex);
    
    console.log('[DEBUG] NFT reordered successfully without full rerender');
  }

  // Reorder cards in the DOM without rerendering - efficient drag and drop
  reorderCardsInDOM(fromIndex, toIndex) {
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;
    
    const cards = Array.from(grid.querySelectorAll('.saved-seed-card'));
    if (cards.length === 0) return;
    
    // Get the cards to move (indices are global since batch modal shows all NFTs)
    const fromCard = cards[fromIndex];
    const toCard = cards[toIndex];
    
    if (!fromCard || !toCard || fromCard === toCard) {
      console.log('[DEBUG] Cards not found or same card, cannot reorder in DOM');
      return;
    }
    
    // Move the card in the DOM
    if (fromIndex < toIndex) {
      // Moving down: insert after the target card
      toCard.after(fromCard);
    } else {
      // Moving up: insert before the target card
      toCard.before(fromCard);
    }
    
    // Update all data-index attributes on cards to match their new order
    const reorderedCards = Array.from(grid.querySelectorAll('.saved-seed-card'));
    reorderedCards.forEach((card, position) => {
      card.dataset.index = position;
      card.dataset.dragIndex = position;
    });
    
    console.log('[DEBUG] Card moved in DOM from index', fromIndex, 'to', toIndex);
  }

  // Update NFT numbers for cards affected by reordering
  updateNFTNumbersAfterReorder(fromIndex, toIndex) {
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;
    
    const cards = Array.from(grid.querySelectorAll('.saved-seed-card'));
    
    // Determine the range of cards that need number updates
    const minIndex = Math.min(fromIndex, toIndex);
    const maxIndex = Math.max(fromIndex, toIndex);
    
    // Update NFT numbers for all cards in the affected range
    cards.forEach((card, cardPosition) => {
      const globalIndex = parseInt(card.dataset.index) || cardPosition;
      
      if (globalIndex >= minIndex && globalIndex <= maxIndex) {
        // Update the NFT number display (1-based)
        const nftNumberElement = card.querySelector('.seed-card-number-display');
        if (nftNumberElement) {
          nftNumberElement.textContent = `#${globalIndex + 1}`;
        }
      }
    });
    
    console.log('[DEBUG] Updated NFT numbers for cards between', minIndex, 'and', maxIndex);
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

  // Refresh a single NFT card without re-rendering the entire grid
  async refreshSingleNFTCard(nftId, index) {
    const grid = this.modal.querySelector('#batch-nfts-grid');
    if (!grid) return;
    
    // Find the existing card
    const existingCard = grid.querySelector(`[data-nft-id="${nftId}"]`);
    if (!existingCard) {
      console.error('[DEBUG] Could not find existing card for NFT:', nftId);
      return;
    }
    
    // Get the NFT data
    const nft = this.generatedNFTs[index];
    if (!nft) {
      console.error('[DEBUG] NFT not found at index:', index);
      return;
    }
    
    // Preserve selection state
    const wasSelected = existingCard.classList.contains('selected');
    const wasDeleted = existingCard.classList.contains('deleted');
    
    // Create new card with updated data
    const newCard = await this.createNFTCard(nft, index);
    
    // Restore selection and deleted state
    if (wasSelected) {
      newCard.classList.add('selected');
    }
    if (wasDeleted) {
      this.markCardAsDeleted(newCard);
    }
    
    // Replace the old card with the new one
    existingCard.parentNode.replaceChild(newCard, existingCard);
    
    console.log('[DEBUG] Single NFT card refreshed:', nftId);
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
      
      // Save scroll position before opening edit modal
      const grid = this.modal.querySelector('#batch-nfts-grid');
      const scrollPosition = grid ? grid.scrollTop : 0;
      console.log('[DEBUG] Saved scroll position:', scrollPosition);
      
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
              // Update the NFT with new data (include imageData for thumbnail refresh)
              const updatedNFTData = {
                ...this.generatedNFTs[nftToUpdateIndex],
                seed: updatedNFT.seed,
                traits: (updatedNFT.traits || []).map(trait => ({
                  ...trait,
                  // PRESERVE: imageData for trait thumbnails (essential for UI)
                  imageData: trait.imageData
                })),
                rarity: updatedNFT.rarity || 'common',
                rarityScore: updatedNFT.rarityScore || 0,
                timestamp: updatedNFT.timestamp || Date.now(),
                // Include imageData if available for card refresh
                imageData: updatedNFT.imageData || this.generatedNFTs[nftToUpdateIndex].imageData,
                thumbnail: updatedNFT.imageData || updatedNFT.thumbnail || this.generatedNFTs[nftToUpdateIndex].thumbnail
              };
              
              this.generatedNFTs[nftToUpdateIndex] = updatedNFTData;
              
              // Update temporary seeds list with new seed at the same position
              this.updateTemporarySeed(nftToUpdateIndex, updatedNFT.seed);
              
              // Refresh only the specific NFT card instead of entire page
              await this.refreshSingleNFTCard(nftId, nftToUpdateIndex);
              
              // Restore scroll position after update
              if (grid) {
                grid.scrollTop = scrollPosition;
                console.log('[DEBUG] Restored scroll position:', scrollPosition);
              }
              
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

  // Mark a card as deleted (after being added to collection)
  markCardAsDeleted(card) {
    card.classList.add('deleted');
    card.style.opacity = '0.3';
    card.style.pointerEvents = 'none';
    card.style.cursor = 'not-allowed';
    
    // Update card content to show deleted state
    const thumbnail = card.querySelector('.seed-card-thumbnail');
    const info = card.querySelector('.seed-card-info');
    const buttons = card.querySelector('.seed-card-buttons');
    
    if (thumbnail) {
      // Add "Deleted" overlay
      let deletedOverlay = thumbnail.querySelector('.deleted-overlay');
      if (!deletedOverlay) {
        deletedOverlay = document.createElement('div');
        deletedOverlay.className = 'deleted-overlay';
        thumbnail.style.position = 'relative';
        thumbnail.appendChild(deletedOverlay);
      }
      
      // Update overlay styles and content (in case it already existed)
      deletedOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.7);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: #fff;
        z-index: 10;
        border-radius: 8px;
        text-align: center;
        padding: 10px;
        box-sizing: border-box;
      `;
      deletedOverlay.innerHTML = `
        <div style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 4px;">DELETED</div>
        <div style="font-size: 11px; opacity: 0.9; margin-bottom: 2px;">NFT was added</div>
        <div style="font-size: 11px; opacity: 0.9;">to Collection</div>
      `;
    }
    
    // Hide or disable buttons
    if (buttons) {
      buttons.style.pointerEvents = 'none';
      buttons.style.opacity = '0.3';
    }
    
    // Disable drag
    card.draggable = false;
    card.style.cursor = 'not-allowed';
  }

  // Delete NFT from batch
  deleteNFTFromBatch(nftId, card) {
    const seedValue = card.dataset.seed;
    
    // Use the app's styled confirmation modal instead of browser confirm
    if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
      window.NFTApp.getModule("confirmationModal").show(
        "Delete NFT",
        `<div style="margin-top: 12px;">Are you sure you want to delete this<br>NFT from the batch with this seed?</div>`,
        `<div style="font-size: 11px; color: #95a5a6; margin-top: 4px; margin-bottom: 16px; word-break: break-all;">"${seedValue}"</div><div style="color: #fff; margin-top: 8px;">This action cannot be undone.</div>`,
        () => {
          // Remove from generatedNFTs array
          const index = this.generatedNFTs.findIndex(nft => nft.id === nftId);
          if (index !== -1) {
            this.generatedNFTs.splice(index, 1);
          }
          
          // Remove from selectedNFTs if it was selected
          this.selectedNFTs.delete(nftId);
          // Also remove from selection order array
          const orderIndex = this.selectedNFTsOrder.indexOf(nftId);
          if (orderIndex > -1) {
            this.selectedNFTsOrder.splice(orderIndex, 1);
          }
          
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
      const confirmed = confirm(`Are you sure you want to delete this\nNFT from the batch with this seed?\n\n"${seedValue}"\n\nThis action cannot be undone.`);
      if (!confirmed) return;
      
      // Remove from generatedNFTs array
      const index = this.generatedNFTs.findIndex(nft => nft.id === nftId);
      if (index !== -1) {
        this.generatedNFTs.splice(index, 1);
      }
      
      // Remove from selectedNFTs if it was selected
      this.selectedNFTs.delete(nftId);
      // Also remove from selection order array
      const orderIndex = this.selectedNFTsOrder.indexOf(nftId);
      if (orderIndex > -1) {
        this.selectedNFTsOrder.splice(orderIndex, 1);
      }
      
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
          return parseInt(cleanValue, 10) || 10000;
        }
        if (pd && typeof pd.totalSupply !== 'undefined' && pd.totalSupply !== null && pd.totalSupply !== '') {
          return parseInt(pd.totalSupply, 10) || 10000;
        } else if (pd && typeof pd.size !== 'undefined' && pd.size !== null && pd.size !== '') {
          return parseInt(pd.size, 10) || 10000;
        }
        return 10000; // Default fallback to 10000
      };

      // Get current saved seeds to check collection size
      // CRITICAL: Check multiple sources to get the most accurate count
      const seedListKey = this.getSeedListKey();
      let currentCollectionSize = 0;
      
      // First, try to use the modal instance if it exists and has the same key
      if (window.savedSeedsModalInstance && 
          window.savedSeedsModalInstance.seedListKey === seedListKey &&
          window.savedSeedsModalInstance.seedList && 
          Array.isArray(window.savedSeedsModalInstance.seedList)) {
        currentCollectionSize = window.savedSeedsModalInstance.seedList.length;
        console.log('[DEBUG] Current collection size from modal instance:', currentCollectionSize, 'seedListKey:', seedListKey);
      } else {
        // Fallback to localStorage
        try {
          const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
          currentCollectionSize = Array.isArray(savedSeeds) ? savedSeeds.length : 0;
          console.log('[DEBUG] Current collection size from localStorage:', currentCollectionSize, 'seedListKey:', seedListKey);
        } catch (error) {
          console.error('[DEBUG] Error reading from localStorage:', error);
          currentCollectionSize = 0;
        }
      }
      
      const maxCollectionSize = getTotalSupply(projectData);
      
      // Calculate available space
      const availableSpace = maxCollectionSize ? Math.max(0, maxCollectionSize - currentCollectionSize) : 0;
      
      // Update the counter display
      const availableSpaceElement = document.getElementById('available-space');
      const totalSpaceElement = document.getElementById('total-space');
      
      if (availableSpaceElement && totalSpaceElement) {
        availableSpaceElement.textContent = availableSpace.toLocaleString();
        totalSpaceElement.textContent = (maxCollectionSize || 0).toLocaleString();
        
        console.log('[DEBUG] Collection space counter updated:', {
          current: currentCollectionSize,
          max: maxCollectionSize,
          available: availableSpace
        });
      } else {
        console.warn('[DEBUG] Counter elements not found');
      }
    } catch (error) {
      console.error('[DEBUG] Error updating collection space counter:', error);
    }
  }

  openImportSeedsModal() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create dialog container
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #222;
      border-radius: 12px;
      padding: 24px;
      width: 500px;
      max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    dialog.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="color: #fff; margin: 0 0 8px 0; font-family: 'Archivo', sans-serif;">Import Seeds</h3>
        <p style="color: #ccc; margin: 0 0 4px 0; font-size: 14px;">Paste or enter seed numbers (one per line).</p>
        <p style="color: #ccc; margin: 0; font-size: 14px;">NFTs will be generated and added to the batch:</p>
      </div>
      <textarea 
        id="batch-seed-import-textarea" 
        placeholder="Enter seed numbers, one per line..."
        style="
          width: 100%;
          height: 200px;
          background: #333;
          border: 1px solid #555;
          border-radius: 8px;
          padding: 12px;
          color: #fff;
          font-family: 'Archivo', sans-serif;
          font-size: 14px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        "
      ></textarea>
      <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
        <button id="batch-import-cancel" style="
          background: #666;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-family: 'Archivo', sans-serif;
          cursor: pointer;
        ">Cancel</button>
        <button id="batch-import-confirm" style="
          background: #6c5ce7;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-family: 'Archivo', sans-serif;
          cursor: pointer;
        ">Import Seeds</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus the textarea
    const textarea = dialog.querySelector('#batch-seed-import-textarea');
    textarea.focus();

    // Add event listeners
    const cancelBtn = dialog.querySelector('#batch-import-cancel');
    const confirmBtn = dialog.querySelector('#batch-import-confirm');

    const cleanup = () => {
      if (overlay && overlay.parentNode === document.body) {
        document.body.removeChild(overlay);
      }
    };

    cancelBtn.onclick = cleanup;

    confirmBtn.onclick = async () => {
      const input = textarea.value.trim();
      if (!input) {
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Please enter at least one seed number.',
            'info',
            3000
          );
        } else {
          alert('Please enter at least one seed number.');
        }
        return;
      }

      await this.processImportedSeedsForBatch(input);
      cleanup();
    };

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Click outside to close
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
      }
    };
  }

  async processImportedSeedsForBatch(input) {
    const seeds = input.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    console.log('[Batch Generation Modal] Processing', seeds.length, 'imported seeds');
    
    if (seeds.length === 0) {
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Please enter at least one valid seed number.',
          'info',
          3000
        );
      } else {
        alert('Please enter at least one valid seed number.');
      }
      return;
    }

    try {
      // Get existing seed set to check for duplicates
      const existingSeedsSet = new Set(this.generatedNFTs.map(nft => nft.seed));
      console.log('[Batch Generation Modal] Existing seeds in batch:', Array.from(existingSeedsSet));
      
      // Check for duplicates within the imported list
      const seenInImport = new Set();
      const duplicatesInImport = [];
      const uniqueSeeds = [];
      
      for (const seed of seeds) {
        if (seenInImport.has(seed)) {
          duplicatesInImport.push(seed);
        } else {
          seenInImport.add(seed);
          uniqueSeeds.push(seed);
        }
      }
      
      // Filter out seeds that already exist in the batch
      const newSeeds = uniqueSeeds.filter(seed => !existingSeedsSet.has(seed));
      const alreadyExists = uniqueSeeds.filter(seed => existingSeedsSet.has(seed));
      
      console.log('[Batch Generation Modal] Duplicate stats:', {
        totalImported: seeds.length,
        duplicatesInImport: duplicatesInImport.length,
        alreadyInBatch: alreadyExists.length,
        newSeeds: newSeeds.length
      });
      
      if (newSeeds.length === 0) {
        let message = '';
        if (alreadyExists.length > 0 && duplicatesInImport.length > 0) {
          message = `All seeds are duplicates:\n- ${duplicatesInImport.length} duplicate(s) in the import list\n- ${alreadyExists.length} seed(s) already exist in the batch`;
        } else if (alreadyExists.length > 0) {
          message = `${alreadyExists.length} seed(s) already exist in the batch`;
        } else if (duplicatesInImport.length > 0) {
          message = `${duplicatesInImport.length} duplicate(s) in the import list`;
        }
        
        // Use notification service instead of alert
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            message || 'No valid new seeds to import.',
            'info',
            4000
          );
        } else {
          alert(message || 'No valid new seeds to import.');
        }
        return;
      }

      // Show loading notification with info about skipped seeds
      const skippedInfo = [];
      if (duplicatesInImport.length > 0) skippedInfo.push(`${duplicatesInImport.length} duplicate(s) in list`);
      if (alreadyExists.length > 0) skippedInfo.push(`${alreadyExists.length} already in batch`);
      
      const message = `Generating ${newSeeds.length} NFT${newSeeds.length > 1 ? 's' : ''}...${skippedInfo.length > 0 ? '\nSkipped: ' + skippedInfo.join(', ') : ''}`;
      
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          message,
          'info',
          4000
        );
      }

      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      const projectData = this.projectData || window.NFTApp.getModule('generateNftsUI')?.projectData;
      
      if (!generateNftsModule || !projectData) {
        throw new Error('Generate NFTs module or project data not available');
      }

      let generatedCount = 0;
      const newNFTs = [];

      // Generate NFTs for each unique new seed
      for (let i = 0; i < newSeeds.length; i++) {
        const seed = newSeeds[i];
        
        try {
          console.log(`[Batch Generation Modal] Generating NFT ${i + 1}/${newSeeds.length} from seed:`, seed);
          
          // Generate NFT with the seed
          const nft = await generateNftsModule.generateSingleNFT(projectData, false, seed, this.darkModeEnabled);
          
          if (nft && nft.seed && nft.imageData) {
            const nftObj = {
              id: `imported-${Date.now()}-${i}`, // Unique ID for imported NFT
              seed: nft.seed,
              traits: nft.traits || [],
              imageData: nft.imageData,
              rarity: nft.rarity || 'common',
              rarityScore: nft.rarityScore || 0,
              timestamp: Date.now()
            };
            
            newNFTs.push(nftObj);
            generatedCount++;
            
            console.log(`[Batch Generation Modal] Successfully generated NFT from seed:`, seed);
          } else {
            console.warn(`[Batch Generation Modal] Invalid NFT generated for seed:`, seed);
          }
        } catch (error) {
          console.error(`[Batch Generation Modal] Error generating NFT from seed ${seed}:`, error);
        }
      }

      if (generatedCount > 0) {
        try {
          // Add the new NFTs to the batch generation modal
          this.generatedNFTs.push(...newNFTs);
          
          // Re-render the grid to show the new NFTs
          const currentPage = this.currentPage || 1;
          await this.renderPage(currentPage);
          
          // Show success notification with info about skipped seeds
          const successMessage = `Successfully imported ${generatedCount} NFT${generatedCount > 1 ? 's' : ''}${skippedInfo.length > 0 ? '\nSkipped: ' + skippedInfo.join(', ') : ''}`;
          
          if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              successMessage,
              'success',
              4000
            );
          }
          
          console.log(`[Batch Generation Modal] Successfully imported ${generatedCount} NFTs from seeds`);
        } catch (renderError) {
          console.error('[Batch Generation Modal] Error rendering imported NFTs:', renderError);
          // Still show success notification because NFTs were imported successfully
          if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              `Successfully imported ${generatedCount} NFT${generatedCount > 1 ? 's' : ''}${skippedInfo.length > 0 ? '\nSkipped: ' + skippedInfo.join(', ') : ''}`,
              'success',
              4000
            );
          }
        }
      } else {
        // Use notification service instead of alert
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'No valid NFTs were generated from the imported seeds.',
            'info',
            4000
          );
        } else {
          alert('No valid NFTs were generated from the imported seeds.');
        }
      }
    } catch (error) {
      console.error('[Batch Generation Modal] Error processing imported seeds:', error);
      
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error importing seeds. Please try again.',
          'error',
          3000
        );
      } else {
        alert('Error importing seeds. Please try again.');
      }
    }
  }

}

// Register the modal globally
window.BatchGenerationModal = BatchGenerationModal;
