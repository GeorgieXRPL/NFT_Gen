// NFT Generation Module

console.log('TEST123: generate-nfts.js loaded');
console.log("Loading generate-nfts.js module")

// Debug flag for conditional logging
// Set to true to enable debug logs in NFT generation
const debug = false;

window.NFTApp.registerModule("generateNfts", {
  init: function() {
    console.log("Initializing NFT generation module")
    
    // Create an error panel that will be shown immediately when the app starts
    this.createInitialErrorPanel();
    
    // Track validation state to prevent flickering
    this.validationState = {
      isValid: false,
      lastCheck: 0
    };
    
    // Add a delayed initialization to ensure everything is set up properly
    this.setupDelayedInitialization();
  },
  
  setupDelayedInitialization: function() {
    console.log("Setting up delayed initialization for NFT generation module");
    
    // Wait for document to be fully loaded
    if (document.readyState === 'complete') {
      this.performDelayedInitialization();
    } else {
      window.addEventListener('load', () => {
        this.performDelayedInitialization();
      });
    }
  },
  
  performDelayedInitialization: function() {
    console.log("Performing delayed initialization");
    
    // Wait a short time to ensure other modules have initialized
    setTimeout(() => {
      // Ensure UI elements for traits are properly set up
      this.ensureTraitsListPanelExists();
      
      // Make sure the validation runs with force=true when loading the page
      if (this.projectData) {
        console.log("Project data exists, forcing validation check");
        this.validationState = { isValid: null, lastCheck: 0 };
        this.validateProjectData(this.projectData, true);
      } else {
        console.log("No project data available for validation check during initialization");
      }
      
      // Add a tab change listener to ensure validation runs when the Generate tab is selected
      this.setupTabChangeListener();
      
      console.log("Delayed initialization complete");
    }, 500);
  },
  
  // Setup a listener for tab changes to ensure validation runs
  setupTabChangeListener: function() {
    // Try multiple selector strategies to find navigation tabs
    const navLinks = document.querySelectorAll('.nav-link, .nav-item a, .tab-link, [data-tab]');
    
    if (navLinks && navLinks.length > 0) {
      navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
          // Check if this is the generate tab being selected using multiple possible attributes
          const href = link.getAttribute('href');
          const dataTab = link.getAttribute('data-tab');
          const tabId = link.getAttribute('data-tab-id');
          
          if ((href && (href === '#generate-nfts' || href === '#generate')) || 
              (dataTab && (dataTab === 'generate-nfts' || dataTab === 'generate')) ||
              (tabId && (tabId === 'generate-nfts' || tabId === 'generate'))) {
            console.log("Generate NFTs tab selected, running validation");
            // If we have project data, run validation with force=true
            if (this.projectData) {
              setTimeout(() => {
                this.validateProjectData(this.projectData, true);
                // Removed auto-generation - user must manually click randomize button
              }, 200);
            }
          }
        });
      });
      console.log("Set up tab change listener for validation");
    } else {
      // Fallback to a global click listener for tab elements
      document.addEventListener('click', (e) => {
        // Look for any element that might be a tab navigator
        const target = e.target.closest('.nav-link, .nav-item a, .tab-link, [data-tab]');
        if (target) {
          const href = target.getAttribute('href');
          const dataTab = target.getAttribute('data-tab');
          const tabId = target.getAttribute('data-tab-id');
          
          if ((href && (href === '#generate-nfts' || href === '#generate')) || 
              (dataTab && (dataTab === 'generate-nfts' || dataTab === 'generate')) ||
              (tabId && (tabId === 'generate-nfts' || tabId === 'generate'))) {
            console.log("Generate NFTs tab selected via global listener, running validation");
            if (this.projectData) {
              setTimeout(() => {
                this.validateProjectData(this.projectData, true);
                // Removed auto-generation - user must manually click randomize button
              }, 100);
            }
          }
        }
      });
      console.log("Set up global click listener for tab navigation");
    }
  },
  
  ensureTraitsListPanelExists: function() {
    // Check if the traits list panel exists, create it if not
    const traitsListPanel = document.querySelector('.nft-trait-info-list');
    if (!traitsListPanel) {
      console.log("Creating missing traits list panel");
      
      const traitsPanel = document.querySelector('.nft-trait-info-panel');
      if (traitsPanel) {
        const newTraitsListPanel = document.createElement('div');
        newTraitsListPanel.className = 'nft-trait-info-list';
        
        // Create placeholder content
        newTraitsListPanel.innerHTML = `
          <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; padding: 20px; text-align: center; color: var(--text-secondary);">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 32px; height: 32px; margin-bottom: 12px;">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"></path>
            </svg>
            <div style="font-size: 15px; font-weight: 500; margin-bottom: 8px;">Traits will appear here</div>
            <div style="font-size: 13px; line-height: 1.4;">
              Generate an NFT to see its traits
            </div>
          </div>
        `;
        
        traitsPanel.appendChild(newTraitsListPanel);
        console.log("Traits list panel created successfully");
      }
    }
  },
  
  createInitialErrorPanel: function() {
    // Wait for DOM to be fully loaded
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      this.initializeErrorPanel();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        this.initializeErrorPanel();
      });
    }
  },
  
  initializeErrorPanel: function() {
    console.log("Setting up initial error message in NFT preview panel");
    // Remove creation of the unused previewPanelPlaceholder
    // The error message will be handled elsewhere as needed
    // Store the error element for future reference (if needed)
    // this.initialErrorElement = errorElement;
  },

  setup: function(projectData) {
    console.log("Setting up generate-nfts module with project data:", projectData)

    // Ensure project has a seed algorithm
    if (!projectData.seedAlgorithm && window.NFTApp.getModule && window.NFTApp.getModule("seedService")) {
      console.log("Creating a new seed algorithm for the project");
      projectData.seedAlgorithm = window.NFTApp.getModule("seedService").createSeedAlgorithm();
      console.log("New seed algorithm created:", projectData.seedAlgorithm);
      // Notify user to save the project
      if (window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Project upgraded: deterministic NFT seeds enabled. Please save your project to keep this change.",
          "info",
          5000
        );
      }
    } else if (projectData.seedAlgorithm) {
      console.log("Project already has seed algorithm:", projectData.seedAlgorithm);
    } else {
      console.error("Could not create or access seed algorithm! NFT seeds will NOT be consistent across sessions.");
    }
    
    // Ensure project has settings object
    if (!projectData.settings) {
      projectData.settings = {};
    }
    
    // Initialize default settings if not present
    if (projectData.settings.generateUniqueNfts === undefined) {
      projectData.settings.generateUniqueNfts = true;
    }
    
    
    // Verify deterministic seed system
    this.verifySeedConsistency(projectData);
    
    // Initialize project data for later use
    this.projectData = projectData;
    
    // Create UI elements first
    window.NFTApp.getModule('generateNftsUI').setupUI(projectData);
    
    // Setup debug tools for rule analysis (this was missing)
    this.setupDebugTools();
    
    // Perform initial validation once
    // Reset validation state to ensure the first check uses forced validation
    this.validationState = { isValid: null, lastCheck: 0 };
    const isValid = this.validateProjectData(projectData);
    console.log(`Initial validation result: ${isValid ? 'Valid' : 'Invalid'}`);
    
    // Set up listeners for future events that might require validation
    this.setupValidationListeners(projectData);

    // Show initial error or welcome message after tab content is created
    setTimeout(() => {
      // Only update if we need to - don't overwrite what validateProjectData already did
      if (this.validationState.isValid === null) {
        this.validateProjectData(projectData);
      }
    }, 50);
  },

  setupEventListeners: function(projectData) {
    console.log("Setting up event listeners for generate-nfts module");
    // Initialize toggle listeners (settings panel toggles)
    this._initToggleListeners();
    // Remove call to _initRandomizeBtns to avoid duplicate handlers
    // this._initRandomizeBtns();
    // Add window resize listener for layout adjustments
    window.addEventListener('resize', () => {
      this.syncCardHeights();
    });
    // Store project data for reference in event handlers
    this.projectData = projectData;
  },

  // Add the missing _initToggleListeners function
  _initToggleListeners: function() {
    console.log("Initializing toggle listeners");
    
    // Get all toggles
    const uniqueNftsToggle = document.getElementById('unique-nfts-toggle');
    const singleSeedToggle = document.getElementById('single-seed-toggle');
    const singleSeedInput = document.getElementById('single-seed-input');
    const generateSeedBtn = document.getElementById('generate-seed-nft-btn');
    
    // Initialize unique NFTs toggle
    if (uniqueNftsToggle) {
      uniqueNftsToggle.addEventListener('change', () => {
        if (this.projectData) {
          this.projectData.settings.generateUniqueNfts = uniqueNftsToggle.checked;
          console.log(`Unique NFTs set to: ${uniqueNftsToggle.checked}`);
        }
      });
    }
    
    
    // Initialize single seed toggle for individual NFT generation
    if (singleSeedToggle && singleSeedInput && generateSeedBtn) {
      // Store original state to prevent unwanted changes
      let previousState = false;
      
      singleSeedToggle.addEventListener('change', (e) => {
        // Only update if the change was triggered by actual user interaction
        const isUserAction = e.isTrusted || e._isUserAction;
        
        // Check if toggle is active (for button-style toggle)
        const isActive = singleSeedToggle.classList.contains('active');
        
        // Enable/disable input and button based on toggle state
        singleSeedInput.disabled = !isActive;
        generateSeedBtn.disabled = !isActive;
        
        // Only log if this was a user action (not a programmatic change)
        if (isUserAction) {
          console.log(`Single seed toggle set to: ${isActive} (by user)`);
          previousState = isActive;
        } else {
          console.log(`Single seed toggle set to: ${isActive} (programmatic)`);
          
          // Critical fix: If this was not triggered by a user and toggle is being
          // activated against user wishes, restore the previous state
          if (!isUserAction && previousState !== isActive) {
            console.log(`Restoring previous toggle state: ${previousState}`);
            // Use setTimeout to avoid immediate change getting overridden
            setTimeout(() => {
              if (previousState) {
                singleSeedToggle.classList.add('active');
              } else {
                singleSeedToggle.classList.remove('active');
              }
              singleSeedInput.disabled = !previousState;
              generateSeedBtn.disabled = !previousState;
            }, 0);
          }
        }
      });
    }
  },

  syncCardHeights: function() {
    const leftSideColumn = document.querySelector('.nft-preview-panel');
    const traitsCard = document.querySelector('.traits-list-card');
    
    if (leftSideColumn && traitsCard) {
      // Calculate total height of left side column (settings + preview panels)
      const leftHeight = leftSideColumn.offsetHeight;
      
      // Set the traits card height to match exactly the height of the left column
      if (leftHeight > 0) {
        // Force height to be fixed to the left side column height
        traitsCard.style.height = leftHeight + 'px';
        traitsCard.style.minHeight = leftHeight + 'px';
        traitsCard.style.maxHeight = leftHeight + 'px';
        traitsCard.style.visibility = 'visible';
        traitsCard.style.opacity = '1';
        traitsCard.style.overflow = 'hidden';
      }
    }
    
    // Always ensure the traits list panel is visible and properly positioned
    const traitsWrapper = document.querySelector('.traits-list-wrapper');
    const traitsList = document.querySelector('.nft-trait-info-list');
    
    if (traitsWrapper) {
      traitsWrapper.style.visibility = 'visible';
      traitsWrapper.style.display = 'flex';
      
      // Ensure the traits list wrapper has the correct width
      traitsWrapper.style.width = '640px';
      traitsWrapper.style.minWidth = '640px';
      traitsWrapper.style.maxWidth = '640px';
      traitsWrapper.style.flex = '0 0 640px';
    }
    
    if (traitsList) {
      traitsList.style.visibility = 'visible';
      traitsList.style.opacity = '1';
      traitsList.style.display = 'flex';
      traitsList.style.flexDirection = 'column';
      traitsList.style.overflowY = 'auto';
      traitsList.style.height = 'calc(100% - 24px)';
      
      // Apply scrollbar styling directly
      traitsList.style.scrollbarWidth = 'thin';
      traitsList.style.scrollbarColor = '#333 #1a1a1a';
    }
    
    // Make sure the layout is updated when content changes
    setTimeout(() => {
      if (leftSideColumn && traitsCard) {
        const updatedHeight = leftSideColumn.offsetHeight;
        if (updatedHeight > 0) {
          traitsCard.style.height = updatedHeight + 'px';
          traitsCard.style.minHeight = updatedHeight + 'px';
          traitsCard.style.maxHeight = updatedHeight + 'px';
        }
      }
    }, 100);
  },

  // Validate Dark NFTs configuration
  validateDarkTraitsConfig: function(projectData) {
    const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
    if (!generateNftsUI?.darkTraitsConfig?.customConfig) {
      return true; // No custom config, validation not needed
    }
    
    const selectedTraits = generateNftsUI.darkTraitsConfig.selectedTraits;
    if (selectedTraits.size === 0) {
      console.warn('[DARK MODE VALIDATION] No traits selected in Dark NFTs configuration');
      return false;
    }
    
    // Check if selected traits exist in project data
    let validTraits = 0;
    projectData.traits.forEach(layer => {
      layer.traits.forEach(trait => {
        const traitId = `${layer.id}_${trait.id}`;
        if (selectedTraits.has(traitId)) {
          validTraits++;
        }
      });
    });
    
    console.log(`[DARK MODE VALIDATION] Found ${validTraits} valid traits out of ${selectedTraits.size} selected`);
    
    if (validTraits === 0) {
      console.error('[DARK MODE VALIDATION] No valid traits found in Dark NFTs configuration');
      return false;
    }
    
    return true;
  },

  generateSingleNFT: function(projectData, overrideRules = false, seed = null, darkModeEnabled = false) {
    // Generating single NFT
    // Log generation parameters
    if (window.DEBUG_RULE_APPLICATION) {
      console.log("----------------------------------------------");
      console.log(`Generating NFT: ${overrideRules ? "OVERRIDING RULES" : "FOLLOWING RULES"}`);
      console.log(`Seed: ${seed || "random"}`);
      console.log(`Dark Mode: ${darkModeEnabled ? "ENABLED" : "DISABLED"}`);
      console.log(`Rule count: ${projectData.rules ? projectData.rules.length : 0}`);
      console.log("----------------------------------------------");
    }
    
    // Validate Dark NFTs configuration if dark mode is enabled
    if (darkModeEnabled && !this.validateDarkTraitsConfig(projectData)) {
      console.error('[DARK MODE] Invalid Dark NFTs configuration - falling back to regular generation');
      darkModeEnabled = false; // Disable dark mode if configuration is invalid
    }
    
    // Ensure the project has a seed algorithm
    if (!projectData.seedAlgorithm && window.NFTApp.getModule && window.NFTApp.getModule("seedService")) {
      console.log("Creating a new seed algorithm for the project");
      projectData.seedAlgorithm = window.NFTApp.getModule("seedService").createSeedAlgorithm();
    }
    // --- NEW: Check if seed is a deterministic seed string ---
    const numLayers = projectData.traits.length;
    console.log(`[DEBUG] Seed check: seed="${seed}", type=${typeof seed}, length=${seed?.length}, numLayers=${numLayers}, expectedLength=${numLayers * 2}`);
    
    if (seed && typeof seed === 'string' && /^\d+$/.test(seed) && seed.length === numLayers * 2) {
      // Deterministic seed detected: decode trait indices
      const orderedLayers = [...projectData.traits].slice().reverse();
      let selectedTraits = [];  // Changed from const to let to allow reassignment after stacking
      let validTraitCount = 0;
      let overallRarityScore = 0;
      let selectedTraitObjects = {};
      for (let i = 0; i < numLayers; i++) {
        const layer = orderedLayers[i];
        const traitIdx = parseInt(seed.substr(i * 2, 2), 10) - 1;
        let trait = null;
        if (traitIdx >= 0 && layer.traits && layer.traits.length > 0) {
          // Sort traits alphabetically by name to match encoding
          const sortedTraits = [...layer.traits].sort((a, b) => a.name.localeCompare(b.name));
          trait = sortedTraits[traitIdx] || { name: 'none', rarity: 0, image: null, imageData: null };
        } else {
          trait = { name: 'none', rarity: 0, image: null, imageData: null };
        }
        selectedTraits.push({ layer: layer, trait: trait, sortIndex: layer.order || i });
        selectedTraitObjects[layer.id] = { layer: layer, trait: trait };
        if (trait.name !== 'none') {
          overallRarityScore += trait.rarity || 100;
          validTraitCount++;
        }
      }
      // Preload images for selected traits
      const imagePromises = [];
      selectedTraits.forEach(traitInfo => {
        const trait = traitInfo.trait;
        if (trait.image || trait.imageData) {
          const imgPromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => { trait.loadedImage = img; resolve(); };
            img.onerror = () => { resolve(); };
            img.src = trait.image || trait.imageData;
          });
          imagePromises.push(imgPromise);
        }
      });
      const canvas = document.createElement("canvas");
      canvas.width = 1000;
      canvas.height = 1000;
      const ctx = canvas.getContext("2d");
      const finalRarityScore = validTraitCount > 0 ? overallRarityScore / validTraitCount : 100;
      // Render after images are loaded
      return Promise.all(imagePromises).then(() => {
        // CRITICAL FIX: Apply stacking order rules to deterministic seed path
        // This ensures re-rendered thumbnails respect stacking rules
        if (!overrideRules) {
          const rules = projectData.rules || [];
          console.log('[RE-RENDER DEBUG] ==========================================');
          console.log('Applying stacking rules to seed:', seed?.substring(0, 20) + '...');
          console.log('[RE-RENDER DEBUG] Rules count:', rules.length);
          console.log('[RE-RENDER DEBUG] Stacking rules:', rules.filter(r => 
            r.type === 'always-above' || r.type === 'always-below' || 
            r.type === 'immediately-above' || r.type === 'immediately-below'
          ).map(r => `${r.type} (${r.appliesTo})`));
          console.log('[RE-RENDER DEBUG] Before reorder:', selectedTraits.map(t => `${t.layer?.name}:${t.trait?.name}`).join(' -> '));
          
          // Enable detailed debugging for rule application
          const debugBackup = window.DEBUG_RULE_APPLICATION;
          window.DEBUG_RULE_APPLICATION = true;
          
          let reorderedTraits = this.applyStackingOrderRules(selectedTraits, rules);
          
          // Repeat stacking until stable (fix for complex/multiple rules)
          let stable = false;
          let maxPasses = 10; // Prevent infinite loops
          let passCount = 0;
          while (!stable && maxPasses-- > 0) {
            passCount++;
            const before = JSON.stringify(reorderedTraits.map(t => (t.layer?.id || '') + ':' + (t.trait?.id || '')));
            console.log(`[RE-RENDER DEBUG] Stacking pass #${passCount}...`);
            reorderedTraits = this.applyStackingOrderRules(reorderedTraits, rules);
            const after = JSON.stringify(reorderedTraits.map(t => (t.layer?.id || '') + ':' + (t.trait?.id || '')));
            stable = before === after;
            if (stable) {
              console.log(`[RE-RENDER DEBUG] Stacking stabilized after ${passCount} pass(es)`);
            }
          }
          
          // Restore debug setting
          window.DEBUG_RULE_APPLICATION = debugBackup;
          
          console.log('[RE-RENDER DEBUG] After reorder:', reorderedTraits.map(t => `${t.layer?.name}:${t.trait?.name}`).join(' -> '));
          console.log('[RE-RENDER DEBUG] ==========================================');
          
          // Use reordered traits for rendering
          selectedTraits = reorderedTraits;
        }
        
        for (const traitInfo of selectedTraits) {
          const { trait, layer } = traitInfo;
          if (trait === 'none' || trait.name === 'none') continue;
          if (trait.loadedImage) {
            ctx.drawImage(trait.loadedImage, 0, 0, canvas.width, canvas.height);
          } else if (trait.image && typeof trait.image === 'object' && trait.image.complete) {
            ctx.drawImage(trait.image, 0, 0, canvas.width, canvas.height);
          } else if (trait.imageData) {
            const img = new Image();
            img.src = trait.imageData;
            if (img.complete) {
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            } else {
              img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
            }
          }
        }
        const imageData = canvas.toDataURL();
        const overallTier = 'Common'; // You can add tier logic if needed
        const nft = {
          image: canvas,
          imageData: imageData,
          traits: selectedTraits,
          averageRarityScore: finalRarityScore,
          overallTier: overallTier,
          overallTierColor: '#ffffff',
          seed: seed // Use the deterministic seed as the NFT seed
        };
        return nft;
      });
    }
    // --- END NEW ---
    
    // Store the original input seed for consistent reference
    const originalSeed = seed;
    
    // Generate numeric seed value for deterministic operations
    let numericSeed;
    
    // Normalize seed to ensure consistency
    if (seed) {
      // Handle different seed formats
      if (typeof seed === 'number') {
        // If seed is already a number, use it directly
        numericSeed = seed;
      } else if (typeof seed === 'string') {
        if (/^-?\d+$/.test(seed)) {
          // If the string is a valid integer, handle it carefully
          if (seed.length <= 15) {
            // For short seeds, parse as integer
            numericSeed = parseInt(seed, 10);
            if (isNaN(numericSeed)) {
              // Fallback to hash if parsing fails
              numericSeed = this.stringToHashCode(seed);
            }
          } else {
            // For long seeds, use hash to avoid precision loss
            console.log(`[DEBUG] Long seed detected (${seed.length} chars), using hash instead of parseInt to avoid precision loss`);
            numericSeed = this.stringToHashCode(seed);
          }
        } else {
          // For non-numeric strings, use the hash code
          numericSeed = this.stringToHashCode(seed);
        }
      } else {
        // For any other type, convert to string and hash
        numericSeed = this.stringToHashCode(String(seed));
      }
      
      console.log(`Using normalized numeric seed: ${numericSeed} (from input: ${originalSeed})`);
    } else {
      // Generate a new seed if none is provided
      if (window.NFTApp.getModule && window.NFTApp.getModule("seedService") && 
          projectData && projectData.seedAlgorithm) {
        // Use the seed service to generate a seed
        const seedInputs = [
          Date.now().toString(),
          Math.random().toString(),
          (projectData.currentNFTIndex || 0).toString()
        ];
        const seedStr = window.NFTApp.getModule("seedService").generateSeed(
          seedInputs, 
          projectData.seedAlgorithm
        );
        numericSeed = parseInt(seedStr, 10) || Math.floor(Math.random() * 1000000);
      } else {
        // Fallback to a simple random number
        numericSeed = Math.floor(Math.random() * 1000000);
      }
      console.log("Generated new numeric seed:", numericSeed);
    }
    
    // Ensure numericSeed is always a valid number
    if (isNaN(numericSeed) || numericSeed === undefined) {
      numericSeed = Math.floor(Math.random() * 1000000);
      console.log("Invalid seed detected, using fallback random seed:", numericSeed);
    }
    
    // Create a canvas for the NFT
    const canvas = document.createElement("canvas")
    canvas.width = 1000
    canvas.height = 1000
    const ctx = canvas.getContext("2d")

    // Initialize traits array and overall rarity score
    const selectedTraits = []
    let overallRarityScore = 0
    let validTraitCount = 0
    
    // Store selected trait objects for rule checking
    let selectedTraitObjects = {}

    // Generate traits for each layer (background to foreground)
    const orderedLayers = [...projectData.traits].slice().reverse();

    // Create a promise array for image loading
    const imagePromises = [];

    // Initialize traits with deterministic seeding for each layer
    orderedLayers.forEach((layer, layerIndex) => {
      // Check if this layer is compatible with the rules given current selectedTraitObjects
      if (!this.isLayerCompatibleWithRules(layer, selectedTraitObjects, projectData.rules)) {
        if (window.DEBUG_RULE_APPLICATION) {
          console.log(`[RULES] Skipping layer '${layer.name}' because it is not compatible with current selection and rules.`);
        }
        return;
      }
      // Create a deterministic layer seed based on the main seed
      const layerSeedNum = numericSeed + layerIndex * 1000;
      const layerSeedStr = `${numericSeed}-layer-${layer.id}-${layerIndex}`;
      
      // First check if this layer should be included based on its rarity
      const shouldIncludeLayer = this.shouldIncludeLayer(layer, projectData, layerSeedNum);
      
      if (shouldIncludeLayer && layer.traits && layer.traits.length > 0) {
        let validTraits = layer.traits;
        // Apply rules filtering if needed
        if (!overrideRules && projectData.rules && projectData.rules.length > 0) {
          validTraits = layer.traits.filter(trait => {
            const compatible = this.isTraitCompatibleWithRules(trait, layer, selectedTraitObjects, projectData.rules);
            return compatible;
          });
        }
        // If no valid traits remain after filtering, add a 'none' trait for this layer
          if (validTraits.length === 0) {
          selectedTraits.push({
            layer: layer,
            trait: { name: 'none', rarity: 0, image: null, imageData: null },
            sortIndex: layer.order || layerIndex
          });
          selectedTraitObjects[layer.id] = {
            layer: layer,
            trait: { name: 'none', rarity: 0, image: null, imageData: null }
          };
          return;
        }
        // Create a deterministic trait seed
        const traitSeedNum = numericSeed + layerIndex * 1000 + 500;
        const traitSeedStr = `${numericSeed}-trait-${layer.id}-${layerIndex}`;
        // Select trait using deterministic method
        const selectedTrait = this.selectRandomTrait(validTraits, projectData, overrideRules, traitSeedNum, layer, darkModeEnabled);
        if (!selectedTrait) {
          // No trait selected for this layer based on rarity, add a 'none' trait
          if (window.DEBUG_RULE_APPLICATION) {
            console.log(`[RARITY] No trait selected for layer '${layer.name}' based on rarity. Adding 'none' trait for this layer.`);
          }
          selectedTraits.push({
            layer: layer,
            trait: { name: 'none', rarity: 0, image: null, imageData: null },
            sortIndex: layer.order || layerIndex
          });
          selectedTraitObjects[layer.id] = {
            layer: layer,
            trait: { name: 'none', rarity: 0, image: null, imageData: null }
          };
          return;
        }
        // Store the selected trait with its layer information
        selectedTraits.push({
          layer: layer,
          trait: selectedTrait,
          sortIndex: layer.order || layerIndex
        });
        // Store for rule checking in subsequent layers
        selectedTraitObjects[layer.id] = {
          layer: layer,
          trait: selectedTrait
        };
        // Add trait rarity to overall score
        overallRarityScore += selectedTrait.rarity || 100;
        validTraitCount++;
        // Preload the image
        if (selectedTrait.image || selectedTrait.imageData) {
          const imgPromise = new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
              // Store the loaded image for later use
              selectedTrait.loadedImage = img;
              resolve();
            };
            img.onerror = () => {
              console.warn(`Failed to load image for trait: ${selectedTrait.name}`);
              resolve(); // Resolve anyway to avoid hanging
            };
            img.src = selectedTrait.image || selectedTrait.imageData;
          });
          imagePromises.push(imgPromise);
        }
      }
    });
    
    // Calculate overall rarity score
    const finalRarityScore = validTraitCount > 0 ? overallRarityScore / validTraitCount : 100;
    
    // Debug: Log selected traits before stacking
    // Traits selected, proceeding to stacking
    
    // Apply stacking order rules
    const rules = projectData.rules || [];
    let reorderedTraits = this.applyStackingOrderRules(selectedTraits, rules);

    // --- REPEAT stacking until stable (fix for complex/multiple rules) ---
    let stable = false;
    let maxPasses = 10; // Prevent infinite loops
    while (!stable && maxPasses-- > 0) {
      const before = JSON.stringify(reorderedTraits.map(t => (t.layer?.id || '') + ':' + (t.trait?.id || '')));
      reorderedTraits = this.applyStackingOrderRules(reorderedTraits, rules);
      const after = JSON.stringify(reorderedTraits.map(t => (t.layer?.id || '') + ':' + (t.trait?.id || '')));
      stable = before === after;
    }

    // Traits reordered after stacking


    // --- POST-SELECTION: ENFORCE ALL RULES ---
    if (!overrideRules && projectData.rules && projectData.rules.length > 0) {
      // Create a temporary NFT object for rule checking
      const tempNFT = { traits: reorderedTraits };
      const violations = this.checkForRuleViolations(tempNFT, projectData.rules);
      if (violations && violations.length > 0) {
        if (window.DEBUG_RULE_APPLICATION) {
          console.log(`[RULE VIOLATION] NFT violates rules:`, violations, 'Retrying NFT generation.');
        }
        // Retry with a new seed (simple approach: increment seed)
        return this.generateSingleNFT(projectData, overrideRules, (numericSeed + 1));
      }
    }
    
    // Promise to ensure all images are loaded before rendering
    return Promise.all(imagePromises).then(() => {
      // Now render all traits in the correct order
    for (const traitInfo of reorderedTraits) {
      const { trait, layer } = traitInfo;
      // Skip if trait is 'none'
      if (trait === 'none' || trait.name === 'none') {
        continue;
      }
      // Draw the trait image
      if (trait.loadedImage) {
        ctx.drawImage(trait.loadedImage, 0, 0, canvas.width, canvas.height);
      } else if (trait.image && typeof trait.image === 'object' && trait.image.complete) {
        ctx.drawImage(trait.image, 0, 0, canvas.width, canvas.height);
      } else if (trait.imageData) {
        const img = new Image();
        img.src = trait.imageData;
        if (img.complete) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        } else {
          img.onload = () => { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); };
        }
      }
    }
    
      // Convert the canvas to image data
    let imageData = canvas.toDataURL("image/png");
    // If the canvas is blank (no images drawn), return empty string
    if (!imageData || imageData === 'data:,' || imageData === undefined) {
      imageData = '';
    }
    
      // Calculate overall tier
    let overallTier = 'Common';
    let overallTierColor = '#ffffff';
    
    if (finalRarityScore <= 10) {
      overallTier = 'Mythic';
      overallTierColor = '#ff0000';
    } else if (finalRarityScore <= 25) {
      overallTier = 'Legendary';
      overallTierColor = '#e2b84a';
    } else if (finalRarityScore <= 40) {
      overallTier = 'Epic';
      overallTierColor = '#9b4a9b';
    } else if (finalRarityScore <= 60) {
      overallTier = 'Rare';
      overallTierColor = '#4a90e2';
    } else if (finalRarityScore <= 80) {
      overallTier = 'Uncommon';
      overallTierColor = '#7ed957';
    }
    
    // Compute deterministic seed
    const deterministicSeed = this.computeDeterministicSeed(projectData, { traits: selectedTraits });
    // Update the UI seed display (if present)
    const seedDisplay = document.getElementById('nft-seed-display');
    if (seedDisplay) {
      seedDisplay.textContent = deterministicSeed;
    }
    
    const nft = {
      image: canvas,
        imageData: imageData,
      traits: selectedTraits,
      averageRarityScore: finalRarityScore,
      overallTier: overallTier,
      overallTierColor: overallTierColor,
        seed: deterministicSeed
      };
    
    // Debug: Check if any trait was drawn
    if (reorderedTraits.every(t => t.trait === 'none' || t.trait.name === 'none')) {
      console.warn('[DEBUG] No valid traits were drawn on the canvas.');
    }
    
    return nft;
    }).catch(error => {
      console.error("Error generating NFT:", error);
      
      // Return a basic NFT even if there's an error
      return {
        imageData: '',
        traits: selectedTraits || [],
        averageRarityScore: finalRarityScore || 100,
        overallTier: 'Error',
        overallTierColor: '#ff0000',
        seed: deterministicSeed || String(numericSeed || Math.floor(Math.random() * 1000000))
      };
    });
  },

  // Helper method to convert string to a consistent numeric hash code
  stringToHashCode: function(str) {
    let hash = 0;
    if (!str || str.length === 0) return hash;
    
    // Ensure the input is a string
    const inputStr = String(str);
    
    for (let i = 0; i < inputStr.length; i++) {
      const char = inputStr.charCodeAt(i);
      // This is a commonly used string hash function (djb2)
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    // Ensure positive value by using unsigned right shift
    return Math.abs(hash >>> 0);
  },

  // Create a simple deterministic PRNG
  createPRNG: function(seed) {
    // Ensure seed is a positive integer
    let s = Math.abs(parseInt(seed, 10));
    if (isNaN(s) || s === 0) {
      s = 1;
    }
    
    // Mulberry32 algorithm - a fast, simple, and good quality 32-bit PRNG
    return function() {
      s = ((s + 0x6D2B79F5) | 0);
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  },

  // Update shouldIncludeLayer for more consistent behavior
  shouldIncludeLayer: function(layer, projectData, seed) {
    // If layer doesn't have a rarity, include it by default
    if (layer.rarity === undefined || layer.rarity === null) {
      return true;
    }
    
    // Get a random value for this layer to determine inclusion
    let randomValue;
    
    // Use seed directly if it's a number
    if (typeof seed === 'number') {
      // Create a deterministic PRNG using the seed
      const prng = this.createPRNG(seed);
      randomValue = prng();
          
          if (window.DEBUG_RULE_APPLICATION) {
        console.log(`Layer ${layer.name}: Using numeric seed ${seed} to generate random value: ${randomValue}`);
      }
    } 
    // Use string seed if provided
    else if (typeof seed === 'string' && window.NFTApp.getModule && window.NFTApp.getModule("seedService") && projectData && projectData.seedAlgorithm) {
      // Generate a layer-specific seed by combining the original seed and layer name/id
      const layerSeedStr = `${seed}-layer-${layer.id || layer.name}`;
      randomValue = window.NFTApp.getModule("seedService").generateRandom(layerSeedStr, projectData.seedAlgorithm);
        
        if (window.DEBUG_RULE_APPLICATION) {
        console.log(`Layer ${layer.name}: Using string seed "${layerSeedStr}" to generate random value: ${randomValue}`);
      }
    } else {
      // Fallback to a deterministic method using a hash from the layer name
      const fallbackSeed = this.stringToHashCode(layer.name || layer.id || 'layer') * 123456789;
      const prng = this.createPRNG(fallbackSeed);
      randomValue = prng();
          
          if (window.DEBUG_RULE_APPLICATION) {
        console.log(`Layer ${layer.name}: Using fallback hash seed ${fallbackSeed} to generate random value: ${randomValue}`);
      }
    }
    
    // The layer should be included if the random value is less than the rarity percentage
    // Convert layer rarity from percentage (0-100) to decimal (0-1)
    const rarityAsDecimal = layer.rarity / 100;
    
    return randomValue <= rarityAsDecimal;
  },

  // Restore the accidentally removed isTraitCompatibleWithRules function
  isTraitCompatibleWithRules: function(trait, currentLayer, selectedTraits, rules) {
    // If no rules or no selected traits yet, all traits are compatible
    if (!rules || rules.length === 0 || Object.keys(selectedTraits).length === 0) {
      return true;
    }
    
    // Check each rule
    for (const rule of rules) {
      // Only process never-combine rules for now (could be extended to support other rule types)
      if (rule.type === "never-combine") {
        // Check between-layers rules
        if (rule.appliesTo === "between-layers") {
          if ((rule.firstLayerId === currentLayer.id && selectedTraits[rule.secondLayerId]) || 
              (rule.secondLayerId === currentLayer.id && selectedTraits[rule.firstLayerId])) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait "${trait.name}" due to never-combine between-layers rule between "${currentLayer.name}" and another layer`);
            }
            return false;
          }
        }
        // Check between-traits rules
        else if (rule.appliesTo === "between-traits") {
          // Check if this trait is in the first traits list and any of the second traits are selected
          if (rule.firstTraits.some(t => t.layerId === currentLayer.id && t.id === trait.id) && 
              rule.secondTraits.some(t => {
                const selectedLayer = selectedTraits[t.layerId];
                return selectedLayer && selectedLayer.trait.id === t.id;
              })) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait "${trait.name}" due to never-combine between-traits rule (trait in first group)`);
            }
            return false;
          }
          
          // Check if this trait is in the second traits list and any of the first traits are selected
          if (rule.secondTraits.some(t => t.layerId === currentLayer.id && t.id === trait.id) && 
              rule.firstTraits.some(t => {
                const selectedLayer = selectedTraits[t.layerId];
                return selectedLayer && selectedLayer.trait.id === t.id;
              })) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait "${trait.name}" due to never-combine between-traits rule (trait in second group)`);
            }
            return false;
          }
        }
        // Check layer-to-traits rules
        else if (rule.appliesTo === "layer-to-traits") {
          // If the current layer is the one specified in the rule, check if any of the traits are selected
          if (rule.layerId === currentLayer.id) {
            const hasSelectedRuleTrait = rule.traits.some(t => {
              const selectedLayer = selectedTraits[t.layerId];
              return selectedLayer && selectedLayer.trait.id === t.id;
            });
            
            if (hasSelectedRuleTrait) {
              if (window.DEBUG_RULE_APPLICATION) {
                console.log(`Rejecting trait "${trait.name}" due to never-combine layer-to-traits rule (this layer should not be used with selected traits)`);
              }
              return false;
            }
          }
          // If the trait is in the traits list, check if the specified layer is selected
          else if (rule.traits.some(t => t.layerId === currentLayer.id && t.id === trait.id) && 
                 selectedTraits[rule.layerId]) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait "${trait.name}" due to never-combine layer-to-traits rule (this trait should not be used with a selected layer)`);
            }
            return false;
          }
        }
        // Check traits-to-layer rules
        else if (rule.appliesTo === "traits-to-layer") {
          // If the current layer is Layer B (the specified layer), check if any specific traits from Layer A are selected
          if (currentLayer.id === rule.layerId && 
              rule.traits.some(t => {
                const selectedLayer = selectedTraits[t.layerId];
                return selectedLayer && selectedLayer.trait.id === t.id;
              })) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait "${trait.name}" from layer "${currentLayer.name}" due to never-combine traits-to-layer rule (this layer should not be used with selected traits)`);
            }
            return false;
          }
          // If the current trait is one of the specific traits from Layer A, check if Layer B has any trait selected
          else if (rule.traits.some(t => t.layerId === currentLayer.id && t.id === trait.id) && 
                 selectedTraits[rule.layerId]) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait "${trait.name}" due to never-combine traits-to-layer rule (this trait should not be used with the specified layer)`);
            }
            return false;
          }
        }
      }
      
      // Add support for always-combine rules
      if (rule.type === "always-combine") {
        // between-layers: if a trait from one layer is selected, the other must also be selected
        if (rule.appliesTo === "between-layers") {
          // If current trait is from firstLayer and secondLayer is not selected, disallow
          if (rule.firstLayerId === currentLayer.id && !selectedTraits[rule.secondLayerId]) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait '${trait.name}' because always-combine between-layers: '${currentLayer.name}' requires '${rule.secondLayerId}' to be selected.`);
            }
            return false;
          }
          // If current trait is from secondLayer and firstLayer is not selected, disallow
          if (rule.secondLayerId === currentLayer.id && !selectedTraits[rule.firstLayerId]) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait '${trait.name}' because always-combine between-layers: '${currentLayer.name}' requires '${rule.firstLayerId}' to be selected.`);
            }
            return false;
          }
        }
        // between-traits: if a trait from one group is selected, a trait from the other group must also be selected
        else if (rule.appliesTo === "between-traits") {
          // If current trait is in firstTraits and no secondTrait is selected, disallow
          if (rule.firstTraits.some(t => t.layerId === currentLayer.id && t.id === trait.id)) {
            const anySecondSelected = rule.secondTraits.some(t => {
              const selectedLayer = selectedTraits[t.layerId];
              return selectedLayer && selectedLayer.trait.id === t.id;
            });
            if (!anySecondSelected) {
              if (window.DEBUG_RULE_APPLICATION) {
                console.log(`Rejecting trait '${trait.name}' because always-combine between-traits: trait in first group requires a trait in second group to be selected.`);
              }
              return false;
            }
          }
          // If current trait is in secondTraits and no firstTrait is selected, disallow
          if (rule.secondTraits.some(t => t.layerId === currentLayer.id && t.id === trait.id)) {
            const anyFirstSelected = rule.firstTraits.some(t => {
              const selectedLayer = selectedTraits[t.layerId];
              return selectedLayer && selectedLayer.trait.id === t.id;
            });
            if (!anyFirstSelected) {
              if (window.DEBUG_RULE_APPLICATION) {
                console.log(`Rejecting trait '${trait.name}' because always-combine between-traits: trait in second group requires a trait in first group to be selected.`);
              }
              return false;
            }
          }
        }
        // layer-to-traits: if any trait from Layer A is used, one of the specific traits from Layer B must be used, and vice versa
        else if (rule.appliesTo === "layer-to-traits") {
          // If current trait is from Layer A (the specified layer) and none of the specific traits from Layer B are selected, disallow
          if (rule.layerId === currentLayer.id) {
            const anyRuleTraitSelected = rule.traits.some(t => {
              const selectedLayer = selectedTraits[t.layerId];
              return selectedLayer && selectedLayer.trait.id === t.id;
            });
            if (!anyRuleTraitSelected) {
              if (window.DEBUG_RULE_APPLICATION) {
                console.log(`Rejecting trait '${trait.name}' because always-combine layer-to-traits: Layer A requires one of the specific traits from Layer B to be selected.`);
              }
              return false;
            }
          }
          // If current trait is one of the specific traits from Layer B and Layer A is not selected, disallow
          if (rule.traits.some(t => t.layerId === currentLayer.id && t.id === trait.id) && 
              !selectedTraits[rule.layerId]) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait '${trait.name}' because always-combine layer-to-traits: this trait requires Layer A to have a trait selected.`);
            }
            return false;
          }
        }
        // traits-to-layer: if one of the specific traits from Layer A is used, any trait from Layer B must be used, and vice versa
        else if (rule.appliesTo === "traits-to-layer") {
          // If current trait is one of the specific traits from Layer A and Layer B is not selected, disallow
          if (rule.traits.some(t => t.layerId === currentLayer.id && t.id === trait.id) && 
              !selectedTraits[rule.layerId]) {
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`Rejecting trait '${trait.name}' because always-combine traits-to-layer: this trait requires Layer B to have a trait selected.`);
            }
            return false;
          }
          // If current trait is from Layer B and none of the specific traits from Layer A are selected, disallow
          if (currentLayer.id === rule.layerId) {
            const anyRuleTraitSelected = rule.traits.some(t => {
              const selectedLayer = selectedTraits[t.layerId];
              return selectedLayer && selectedLayer.trait.id === t.id;
            });
            if (!anyRuleTraitSelected) {
              if (window.DEBUG_RULE_APPLICATION) {
                console.log(`Rejecting trait '${trait.name}' because always-combine traits-to-layer: Layer B requires one of the specific traits from Layer A to be selected.`);
              }
              return false;
            }
          }
        }
      }
    }
    
    // All rules passed, trait is compatible
    return true;
  },

  // Improved stacking order function
  applyStackingOrderRules: function(selectedTraits, rules) {
    if (!rules || rules.length === 0 || !selectedTraits || selectedTraits.length <= 1) {
      return selectedTraits;
    }
    const debug = window.DEBUG_RULE_APPLICATION || false;
    if (debug) {
      console.log("Applying stacking order rules to selected traits");
      console.log(`Starting trait order: ${selectedTraits.map(t => t.layer.name).join(' -> ')}`);
    }
    let reorderedTraits = [...selectedTraits];
    // Always-above: move specified layer(s) or trait(s) to be above the target (not necessarily immediately)
    rules.filter(r => r.type === "always-above").forEach(rule => {
      if (rule.appliesTo === "between-layers") {
        // Check if specific traits are selected (trait arrays populated)
        if (rule.firstTraits && rule.firstTraits.length > 0 && rule.secondTraits && rule.secondTraits.length > 0) {
          // Treat as between-traits when specific traits are selected
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA > idxB) {
                // Trait A is already above trait B (higher index), no action needed
                if (debug) console.log(`[Stacking] Trait '${aObj.name}' is already above '${bObj.name}'`);
              } else if (idxA !== -1 && idxB !== -1) {
                // Move trait A to be above trait B (insert after B, at higher index)
                const [traitA] = reorderedTraits.splice(idxA, 1);
                const newIdxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdxB + 1, 0, traitA);
                if (debug) console.log(`[Stacking] (Always Above - between-layers with traits) Moved trait '${traitA.trait.name}' to be above '${bObj.name}'`);
              }
            });
          });
        } else {
          // Apply to entire layers when no specific traits selected
          const idxA = reorderedTraits.findIndex(t => t.layer.id === rule.firstLayerId);
          const idxB = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
          if (idxA !== -1 && idxB !== -1 && idxA > idxB) {
            // First layer is already above second layer (higher index), no action needed
            if (debug) console.log(`[Stacking] Layer '${rule.firstLayerName}' is already above '${rule.secondLayerName}'`);
          } else if (idxA !== -1 && idxB !== -1) {
            // Move first layer to be above second layer (insert after B, at higher index)
            const [layerA] = reorderedTraits.splice(idxA, 1);
            const newIdxB = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
            reorderedTraits.splice(newIdxB + 1, 0, layerA);
            if (debug) console.log(`[Stacking] (Always Above) Moved layer '${layerA.layer.name}' to be above '${rule.secondLayerName}'`);
          }
        }
      } else if (rule.appliesTo === "between-traits") {
        if (rule.firstTraits && Array.isArray(rule.firstTraits) && rule.secondTraits && Array.isArray(rule.secondTraits)) {
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA > idxB) {
                // Trait A is already above trait B (higher index), no action needed
                if (debug) console.log(`[Stacking] Trait '${aObj.name}' is already above '${bObj.name}'`);
              } else if (idxA !== -1 && idxB !== -1) {
                // Move trait A to be above trait B (insert after B, at higher index)
                const [traitA] = reorderedTraits.splice(idxA, 1);
                const newIdxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdxB + 1, 0, traitA);
                if (debug) console.log(`[Stacking] (Always Above) Moved trait '${traitA.trait.name}' to be above '${bObj.name}'`);
              }
            });
          });
        }
      } else if (rule.appliesTo === "traits-to-layer") {
        // CRITICAL FIX: For traits-to-layer, traits are in rule.traits and layer is in rule.layerId
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(aObj => {
            const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
            const idxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA > idxB) {
              // Trait A is already above layer B (higher index), no action needed
              if (debug) console.log(`[Stacking] Trait '${aObj.name}' is already above layer '${rule.layerName}'`);
            } else if (idxA !== -1 && idxB !== -1) {
              // Move trait A to be above layer B (insert after B, at higher index)
              const [traitA] = reorderedTraits.splice(idxA, 1);
              const newIdxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
              reorderedTraits.splice(newIdxB + 1, 0, traitA);
              if (debug) console.log(`[Stacking] (Always Above) Moved trait '${traitA.trait.name}' to be above layer '${rule.layerName}'`);
            }
          });
        }
      } else if (rule.appliesTo === "layer-to-traits") {
        // CRITICAL FIX: For layer-to-traits, traits are in rule.traits (not rule.secondTraits)
        // and layer is in rule.layerId (not rule.firstLayerId)
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(bObj => {
            const idxA = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA > idxB) {
              // Layer A is already above trait B (higher index), no action needed
              if (debug) console.log(`[Stacking] Layer '${rule.layerName}' is already above trait '${bObj.name}'`);
            } else if (idxA !== -1 && idxB !== -1) {
              // Move layer A to be above trait B (insert after B, at higher index)
              const [layerA] = reorderedTraits.splice(idxA, 1);
              const newIdxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              reorderedTraits.splice(newIdxB + 1, 0, layerA);
              if (debug) console.log(`[Stacking] (Always Above) Moved layer '${layerA.layer.name}' to be above trait '${bObj.name}'`);
            }
          });
        }
      }
    });
    // Always-below: move specified layer(s) or trait(s) to be below the target (not necessarily immediately)
    rules.filter(r => r.type === "always-below").forEach(rule => {
      if (rule.appliesTo === "between-layers") {
        // Check if specific traits are selected (trait arrays populated)
        if (rule.firstTraits && rule.firstTraits.length > 0 && rule.secondTraits && rule.secondTraits.length > 0) {
          // Treat as between-traits when specific traits are selected
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
                // Trait A is already below trait B (lower index), no action needed
                if (debug) console.log(`[Stacking] Trait '${aObj.name}' is already below '${bObj.name}'`);
              } else if (idxA !== -1 && idxB !== -1) {
                // Move trait A to be below trait B (insert at idxB, shifting B to higher index)
                const [traitA] = reorderedTraits.splice(idxA, 1);
                const newIdxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdxB, 0, traitA);
                if (debug) console.log(`[Stacking] (Always Below - between-layers with traits) Moved trait '${traitA.trait.name}' to be below '${bObj.name}'`);
              }
            });
          });
        } else {
          // Apply to entire layers when no specific traits selected
          const idxA = reorderedTraits.findIndex(t => t.layer.id === rule.firstLayerId);
          const idxB = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
          if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
            // First layer is already below second layer (lower index), no action needed
            if (debug) console.log(`[Stacking] Layer '${rule.firstLayerName}' is already below '${rule.secondLayerName}'`);
          } else if (idxA !== -1 && idxB !== -1) {
            // Move first layer to be below second layer (insert at idxB, shifting B to higher index)
            const [layerA] = reorderedTraits.splice(idxA, 1);
            const newIdxB = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
            reorderedTraits.splice(newIdxB, 0, layerA);
            if (debug) console.log(`[Stacking] (Always Below) Moved layer '${layerA.layer.name}' to be below '${rule.secondLayerName}'`);
          }
        }
      } else if (rule.appliesTo === "between-traits") {
        if (rule.firstTraits && Array.isArray(rule.firstTraits) && rule.secondTraits && Array.isArray(rule.secondTraits)) {
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
                // Trait A is already below trait B (lower index), no action needed
                if (debug) console.log(`[Stacking] Trait '${aObj.name}' is already below '${bObj.name}'`);
              } else if (idxA !== -1 && idxB !== -1) {
                // Move trait A to be below trait B (insert at idxB, shifting B to higher index)
                const [traitA] = reorderedTraits.splice(idxA, 1);
                const newIdxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdxB, 0, traitA);
                if (debug) console.log(`[Stacking] (Always Below) Moved trait '${traitA.trait.name}' to be below '${bObj.name}'`);
              }
            });
          });
        }
      } else if (rule.appliesTo === "traits-to-layer") {
        // CRITICAL FIX: For traits-to-layer, traits are in rule.traits and layer is in rule.layerId
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(aObj => {
            const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
            const idxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
              // Trait A is already below layer B (lower index), no action needed
              if (debug) console.log(`[Stacking] Trait '${aObj.name}' is already below layer '${rule.layerName}'`);
            } else if (idxA !== -1 && idxB !== -1) {
              // Move trait A to be below layer B (insert at idxB, shifting B to higher index)
              const [traitA] = reorderedTraits.splice(idxA, 1);
              const newIdxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
              reorderedTraits.splice(newIdxB, 0, traitA);
              if (debug) console.log(`[Stacking] (Always Below) Moved trait '${traitA.trait.name}' to be below layer '${rule.layerName}'`);
            }
          });
        }
      } else if (rule.appliesTo === "layer-to-traits") {
        // CRITICAL FIX: For layer-to-traits, traits are in rule.traits (not rule.secondTraits)
        // and layer is in rule.layerId (not rule.firstLayerId)
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(bObj => {
            const idxA = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA < idxB) {
              // Layer A is already below trait B (lower index), no action needed
              if (debug) console.log(`[Stacking] Layer '${rule.layerName}' is already below trait '${bObj.name}'`);
            } else if (idxA !== -1 && idxB !== -1) {
              // Move layer A to be below trait B (insert at idxB, shifting B to higher index)
              const [layerA] = reorderedTraits.splice(idxA, 1);
              const newIdxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              reorderedTraits.splice(newIdxB, 0, layerA);
              if (debug) console.log(`[Stacking] (Always Below) Moved layer '${layerA.layer.name}' to be below trait '${bObj.name}'`);
            }
          });
        }
      }
    });
    
    // Immediately-above: move specified layer(s) or trait(s) to be directly above the target
    rules.filter(r => r.type === "immediately-above").forEach(rule => {
      if (rule.appliesTo === "between-layers") {
        // Check if specific traits are selected (trait arrays populated)
        if (rule.firstTraits && rule.firstTraits.length > 0 && rule.secondTraits && rule.secondTraits.length > 0) {
          // Treat as between-traits when specific traits are selected
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
                const [a] = reorderedTraits.splice(idxA, 1);
                const newIdx = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdx + 1, 0, a);
                if (debug) console.log(`[Stacking] (Immediately Above - between-layers with traits) Moved trait '${a.trait.name}' to be directly above '${bObj.name}'`);
              }
            });
          });
        } else {
          // Apply to entire layers when no specific traits selected
          const idxA = reorderedTraits.findIndex(t => t.layer.id === rule.firstLayerId);
          const idxB = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
          if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
            const [a] = reorderedTraits.splice(idxA, 1);
            const newIdx = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
            reorderedTraits.splice(newIdx + 1, 0, a);
            if (debug) console.log(`[Stacking] (Immediately Above) Moved layer '${a.layer.name}' to be directly above '${rule.secondLayerName}'`);
          }
        }
      } else if (rule.appliesTo === "between-traits") {
        if (rule.firstTraits && Array.isArray(rule.firstTraits) && rule.secondTraits && Array.isArray(rule.secondTraits)) {
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
                const [a] = reorderedTraits.splice(idxA, 1);
                const newIdx = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdx + 1, 0, a);
                if (debug) console.log(`[Stacking] (Immediately Above) Moved trait '${a.trait.name}' to be directly above '${bObj.name}'`);
              }
            });
          });
        }
      } else if (rule.appliesTo === "traits-to-layer") {
        // CRITICAL FIX: For traits-to-layer, traits are in rule.traits and layer is in rule.layerId
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(aObj => {
            const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
            const idxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
              const [a] = reorderedTraits.splice(idxA, 1);
              // Recalculate idxB after splicing since indices may have changed
              const newIdxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
              reorderedTraits.splice(newIdxB + 1, 0, a);
              if (debug) console.log(`[Stacking] (Immediately Above) Moved trait '${a.trait.name}' to be directly above layer '${rule.layerName}'`);
            }
          });
        }
      } else if (rule.appliesTo === "layer-to-traits") {
        // CRITICAL FIX: For layer-to-traits, traits are in rule.traits (not rule.secondTraits)
        // and layer is in rule.layerId (not rule.firstLayerId)
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(bObj => {
            const idxA = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
              const [a] = reorderedTraits.splice(idxA, 1);
              const newIdx = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              reorderedTraits.splice(newIdx + 1, 0, a);
              if (debug) console.log(`[Stacking] (Immediately Above) Moved layer '${a.layer.name}' to be directly above trait '${bObj.name}'`);
            }
          });
        }
      }
    });
    
    // Immediately-below: move specified layer(s) or trait(s) to be directly below the target
    rules.filter(r => r.type === "immediately-below").forEach(rule => {
      if (rule.appliesTo === "between-layers") {
        // Check if specific traits are selected (trait arrays populated)
        if (rule.firstTraits && rule.firstTraits.length > 0 && rule.secondTraits && rule.secondTraits.length > 0) {
          // Treat as between-traits when specific traits are selected
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
                const [a] = reorderedTraits.splice(idxA, 1);
                const newIdx = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdx, 0, a);
                if (debug) console.log(`[Stacking] (Immediately Below - between-layers with traits) Moved trait '${a.trait.name}' to be directly below '${bObj.name}'`);
              }
            });
          });
        } else {
          // Apply to entire layers when no specific traits selected
          const idxA = reorderedTraits.findIndex(t => t.layer.id === rule.firstLayerId);
          const idxB = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
          if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
            const [a] = reorderedTraits.splice(idxA, 1);
            const newIdx = reorderedTraits.findIndex(t => t.layer.id === rule.secondLayerId);
            reorderedTraits.splice(newIdx, 0, a);
            if (debug) console.log(`[Stacking] (Immediately Below) Moved layer '${a.layer.name}' to be directly below '${rule.secondLayerName}'`);
          }
        }
      } else if (rule.appliesTo === "between-traits") {
        if (rule.firstTraits && Array.isArray(rule.firstTraits) && rule.secondTraits && Array.isArray(rule.secondTraits)) {
          rule.firstTraits.forEach(aObj => {
            rule.secondTraits.forEach(bObj => {
              const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
              const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
                const [a] = reorderedTraits.splice(idxA, 1);
                const newIdx = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
                reorderedTraits.splice(newIdx, 0, a);
                if (debug) console.log(`[Stacking] (Immediately Below) Moved trait '${a.trait.name}' to be directly below '${bObj.name}'`);
              }
            });
          });
        }
      } else if (rule.appliesTo === "traits-to-layer") {
        // CRITICAL FIX: For traits-to-layer, traits are in rule.traits and layer is in rule.layerId
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(aObj => {
            const idxA = reorderedTraits.findIndex(t => t.trait && t.trait.id === aObj.id && t.layer && t.layer.id === aObj.layerId);
            const idxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
              const [a] = reorderedTraits.splice(idxA, 1);
              // Recalculate idxB after splicing since indices may have changed
              const newIdxB = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
              reorderedTraits.splice(newIdxB, 0, a);
              if (debug) console.log(`[Stacking] (Immediately Below) Moved trait '${a.trait.name}' to be directly below layer '${rule.layerName}'`);
            }
          });
        }
      } else if (rule.appliesTo === "layer-to-traits") {
        // CRITICAL FIX: For layer-to-traits, traits are in rule.traits (not rule.secondTraits)
        // and layer is in rule.layerId (not rule.firstLayerId)
        if (rule.traits && Array.isArray(rule.traits)) {
          rule.traits.forEach(bObj => {
            const idxA = reorderedTraits.findIndex(t => t.layer && t.layer.id === rule.layerId);
            const idxB = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
            if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
              const [a] = reorderedTraits.splice(idxA, 1);
              const newIdx = reorderedTraits.findIndex(t => t.trait && t.trait.id === bObj.id && t.layer && t.layer.id === bObj.layerId);
              reorderedTraits.splice(newIdx, 0, a);
              if (debug) console.log(`[Stacking] (Immediately Below) Moved layer '${a.layer.name}' to be directly below trait '${bObj.name}'`);
            }
          });
        }
      }
    });
    
    if (debug) {
      console.log(`Final trait order after stacking: ${reorderedTraits.map(t => t.layer.name).join(' -> ')}`);
    }
    return reorderedTraits;
  },

  // Also restore the function to check for rule violations
  checkForRuleViolations: function(nft, rules) {
    if (!rules || rules.length === 0 || !nft || !nft.traits || nft.traits.length === 0) {
      return [];
    }
    const violationsSet = new Set();
    // Create a map of selected traits by layer ID for easy lookup
    const selectedTraitsByLayerId = {};
    nft.traits.forEach(traitObj => {
      if (traitObj.layer && traitObj.layer.id && traitObj.trait && traitObj.trait.name !== 'none' && traitObj.trait.id !== 'none') {
        selectedTraitsByLayerId[traitObj.layer.id] = traitObj;
      }
    });
    
    // PRIORITY SYSTEM: Sort rules by priority (never-combine has highest priority)
    const rulePriority = {
      'never-combine': 1,      // HIGHEST PRIORITY - Cannot be overridden
      'always-above': 2,       // Medium priority
      'always-below': 2,       // Medium priority  
      'immediately-above': 3,  // Lower priority
      'immediately-below': 3,  // Lower priority
      'always-combine': 4      // LOWEST PRIORITY - Can be overridden by never-combine
    };
    
    const sortedRules = [...rules].sort((a, b) => {
      const priorityA = rulePriority[a.type] || 999;
      const priorityB = rulePriority[b.type] || 999;
      return priorityA - priorityB;
    });
    
    console.log('[DEBUG] Rule processing order (by priority):', sortedRules.map(r => `${r.type} (priority: ${rulePriority[r.type] || 999})`));
    
    // Check each rule in priority order
    for (const rule of sortedRules) {
      // NEVER COMBINE
      if (rule.type === "never-combine") {
        // between-layers
        if (rule.appliesTo === "between-layers") {
          const firstTrait = selectedTraitsByLayerId[rule.firstLayerId];
          const secondTrait = selectedTraitsByLayerId[rule.secondLayerId];
          if (
            firstTrait && secondTrait &&
            firstTrait.trait && firstTrait.trait.name !== 'none' && firstTrait.trait.id !== 'none' &&
            secondTrait.trait && secondTrait.trait.name !== 'none' && secondTrait.trait.id !== 'none'
          ) {
            const firstLayerName = rule.firstLayerName || 'Unknown';
            const secondLayerName = rule.secondLayerName || 'Unknown';
            violationsSet.add(`Rule Violation: Layers "${firstLayerName}" and "${secondLayerName}" should never be combined`);
          }
        }
        // between-traits (forbidden trait pairs)
        if (rule.appliesTo === "between-traits" && rule.firstTraits && rule.secondTraits) {
          rule.firstTraits.forEach(firstTrait => {
            rule.secondTraits.forEach(secondTrait => {
              if (!firstTrait || !secondTrait) return;
              if (firstTrait.name === 'none' || firstTrait.id === 'none' || secondTrait.name === 'none' || secondTrait.id === 'none') return;
              const hasFirst = nft.traits.some(t => t.layer && t.layer.id === firstTrait.layerId && t.trait && t.trait.id === firstTrait.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              const hasSecond = nft.traits.some(t => t.layer && t.layer.id === secondTrait.layerId && t.trait && t.trait.id === secondTrait.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              if (hasFirst && hasSecond) {
                const firstName = firstTrait.name || 'Trait A';
                const secondName = secondTrait.name || 'Trait B';
                // Use sorted names to avoid duplicate messages for the same pair
                const sorted = [firstName, secondName].sort();
                violationsSet.add(`Rule Violation: Traits "${sorted[0]}" and "${sorted[1]}" should never be combined`);
              }
            });
          });
        }
      }
      
      // ALWAYS COMBINE - Check for violations (but never-combine takes priority)
      if (rule.type === "always-combine") {
        // between-layers: if a trait from one layer is selected, the other must also be selected
        if (rule.appliesTo === "between-layers") {
          const firstTrait = selectedTraitsByLayerId[rule.firstLayerId];
          const secondTrait = selectedTraitsByLayerId[rule.secondLayerId];
          
          // Check if there's a never-combine rule that conflicts with this always-combine rule
          const hasNeverCombineConflict = this.checkNeverCombineConflict(rule, sortedRules, selectedTraitsByLayerId);
          
          if (!hasNeverCombineConflict) {
            // Only enforce always-combine if there's no never-combine conflict
            if (firstTrait && !secondTrait) {
              const firstLayerName = rule.firstLayerName || 'Unknown';
              const secondLayerName = rule.secondLayerName || 'Unknown';
              violationsSet.add(`Rule Violation: Layer "${firstLayerName}" requires "${secondLayerName}" to be combined`);
            } else if (secondTrait && !firstTrait) {
              const firstLayerName = rule.firstLayerName || 'Unknown';
              const secondLayerName = rule.secondLayerName || 'Unknown';
              violationsSet.add(`Rule Violation: Layer "${secondLayerName}" requires "${firstLayerName}" to be combined`);
            }
          } else {
            console.log(`[DEBUG] Always-combine rule skipped due to never-combine conflict: ${rule.firstLayerName} <-> ${rule.secondLayerName}`);
          }
        }
        // between-traits: if a trait from one group is selected, a trait from the other group must also be selected
        else if (rule.appliesTo === "between-traits" && rule.firstTraits && rule.secondTraits) {
          const hasFirstGroup = rule.firstTraits.some(ft => {
            return nft.traits.some(t => t.layer && t.layer.id === ft.layerId && t.trait && t.trait.id === ft.id && t.trait.name !== 'none' && t.trait.id !== 'none');
          });
          const hasSecondGroup = rule.secondTraits.some(st => {
            return nft.traits.some(t => t.layer && t.layer.id === st.layerId && t.trait && t.trait.id === st.id && t.trait.name !== 'none' && t.trait.id !== 'none');
          });
          
          // Check for never-combine conflicts
          const hasNeverCombineConflict = this.checkNeverCombineConflict(rule, sortedRules, selectedTraitsByLayerId);
          
          if (!hasNeverCombineConflict) {
            if (hasFirstGroup && !hasSecondGroup) {
              violationsSet.add(`Rule Violation: First trait group requires second trait group to be combined`);
            } else if (hasSecondGroup && !hasFirstGroup) {
              violationsSet.add(`Rule Violation: Second trait group requires first trait group to be combined`);
            }
          } else {
            console.log(`[DEBUG] Always-combine between-traits rule skipped due to never-combine conflict`);
          }
        }
        // layer-to-traits: if any trait from Layer A is used, one of the specific traits from Layer B must be used
        else if (rule.appliesTo === "layer-to-traits") {
          const hasLayerA = selectedTraitsByLayerId[rule.layerId];
          const hasRequiredTrait = rule.traits.some(t => {
            return nft.traits.some(nftTrait => nftTrait.layer && nftTrait.layer.id === t.layerId && nftTrait.trait && nftTrait.trait.id === t.id && nftTrait.trait.name !== 'none' && nftTrait.trait.id !== 'none');
          });
          
          const hasNeverCombineConflict = this.checkNeverCombineConflict(rule, sortedRules, selectedTraitsByLayerId);
          
          if (!hasNeverCombineConflict) {
            if (hasLayerA && !hasRequiredTrait) {
              const layerName = rule.layerName || 'Unknown';
              violationsSet.add(`Rule Violation: Layer "${layerName}" requires specific traits to be combined`);
            } else if (hasRequiredTrait && !hasLayerA) {
              const layerName = rule.layerName || 'Unknown';
              violationsSet.add(`Rule Violation: Specific traits require Layer "${layerName}" to be combined`);
            }
          } else {
            console.log(`[DEBUG] Always-combine layer-to-traits rule skipped due to never-combine conflict`);
          }
        }
        // traits-to-layer: if one of the specific traits from Layer A is used, any trait from Layer B must be used
        else if (rule.appliesTo === "traits-to-layer") {
          const hasRequiredTrait = rule.traits.some(t => {
            return nft.traits.some(nftTrait => nftTrait.layer && nftTrait.layer.id === t.layerId && nftTrait.trait && nftTrait.trait.id === t.id && nftTrait.trait.name !== 'none' && nftTrait.trait.id !== 'none');
          });
          const hasLayerB = selectedTraitsByLayerId[rule.layerId];
          
          const hasNeverCombineConflict = this.checkNeverCombineConflict(rule, sortedRules, selectedTraitsByLayerId);
          
          if (!hasNeverCombineConflict) {
            if (hasRequiredTrait && !hasLayerB) {
              const layerName = rule.layerName || 'Unknown';
              violationsSet.add(`Rule Violation: Specific traits require Layer "${layerName}" to be combined`);
            } else if (hasLayerB && !hasRequiredTrait) {
              const layerName = rule.layerName || 'Unknown';
              violationsSet.add(`Rule Violation: Layer "${layerName}" requires specific traits to be combined`);
            }
          } else {
            console.log(`[DEBUG] Always-combine traits-to-layer rule skipped due to never-combine conflict`);
          }
        }
      }
      
      // Always-above: group A must be above group B (not necessarily immediately)
      // "Above" in RENDERING means rendered LAST (visually on top) = LATER in array = HIGHER index
      // So "A above B" means idxA > idxB (A comes after B in array, renders last, visually above)
      // VIOLATION occurs when A is NOT above B (i.e., idxA <= idxB)
      if (rule.type === "always-above") {
        if (rule.appliesTo === "between-layers") {
          const idxC = nft.traits.findIndex(t => t.layer && t.layer.id === rule.firstLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          const idxD = nft.traits.findIndex(t => t.layer && t.layer.id === rule.secondLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          if (idxC !== -1 && idxD !== -1) {
            // TRULY FIXED: "C above D" means C should be later (idxC > idxD)
            // Violation when C is NOT later (idxC <= idxD)
            if (idxC <= idxD) {
              const firstLayerName = rule.firstLayerName || 'Unknown';
              const secondLayerName = rule.secondLayerName || 'Unknown';
              violationsSet.add(`Rule Violation: Layer "${firstLayerName}" must be rendered above "${secondLayerName}"`);
            }
          }
        } else if (rule.appliesTo === "between-traits") {
          rule.firstTraits.forEach(c => {
            rule.secondTraits.forEach(d => {
              if (!c || !d) return;
              if (c.name === 'none' || c.id === 'none' || d.name === 'none' || d.id === 'none') return;
              const idxC = nft.traits.findIndex(t => t.layer && t.layer.id === c.layerId && t.trait && t.trait.id === c.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              const idxD = nft.traits.findIndex(t => t.layer && t.layer.id === d.layerId && t.trait && t.trait.id === d.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              // TRULY FIXED: Violation when C is NOT later than D
              if (idxC !== -1 && idxD !== -1 && idxC <= idxD) {
                const cName = c.name || 'Trait C';
                const dName = d.name || 'Trait D';
                violationsSet.add(`Rule Violation: Trait "${cName}" must be rendered above "${dName}"`);
              }
            });
          });
        } else if (rule.appliesTo === "traits-to-layer") {
          rule.traits.forEach(trait => {
            if (!trait || trait.name === 'none' || trait.id === 'none') return;
            const idxTrait = nft.traits.findIndex(t => t.layer && t.layer.id === trait.layerId && t.trait && t.trait.id === trait.id && t.trait.name !== 'none' && t.trait.id !== 'none');
            const idxLayer = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
            // TRULY FIXED: "Trait above Layer" means Trait later (idxTrait > idxLayer)
            // Violation when Trait is NOT later (idxTrait <= idxLayer)
            if (idxTrait !== -1 && idxLayer !== -1 && idxTrait <= idxLayer) {
              // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
              const actualTrait = nft.traits[idxTrait];
              const actualLayer = nft.traits[idxLayer];
              const traitName = actualTrait?.trait?.name || trait.name || 'Trait';
              const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
              violationsSet.add(`Rule Violation: Trait "${traitName}" must be rendered above layer "${layerName}"`);
            }
          });
        } else if (rule.appliesTo === "layer-to-traits") {
          rule.traits.forEach(trait => {
            if (!trait || trait.name === 'none' || trait.id === 'none') return;
            const idxLayer = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
            const idxTrait = nft.traits.findIndex(t => t.layer && t.layer.id === trait.layerId && t.trait && t.trait.id === trait.id && t.trait.name !== 'none' && t.trait.id !== 'none');
            // TRULY FIXED: "Layer above Trait" means Layer later (idxLayer > idxTrait)
            // Violation when Layer is NOT later (idxLayer <= idxTrait)
            if (idxLayer !== -1 && idxTrait !== -1 && idxLayer <= idxTrait) {
              // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
              const actualLayer = nft.traits[idxLayer];
              const actualTrait = nft.traits[idxTrait];
              const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
              const traitName = actualTrait?.trait?.name || trait.name || 'Trait';
              violationsSet.add(`Rule Violation: Layer "${layerName}" must be rendered above trait "${traitName}"`);
            }
          });
        }
      }
      // Always-below: group A must be below group B (not necessarily immediately)
      // "Below" in RENDERING means rendered FIRST (visually underneath) = EARLIER in array = LOWER index
      // So "A below B" means idxA < idxB (A comes before B in array, renders first, visually below)
      // VIOLATION occurs when A is NOT below B (i.e., idxA >= idxB)
      if (rule.type === "always-below") {
        if (rule.appliesTo === "between-layers") {
          const idxC = nft.traits.findIndex(t => t.layer && t.layer.id === rule.firstLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          const idxD = nft.traits.findIndex(t => t.layer && t.layer.id === rule.secondLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          if (idxC !== -1 && idxD !== -1) {
            // TRULY FIXED: "C below D" means C should be earlier (idxC < idxD)
            // Violation when C is NOT earlier (idxC >= idxD)
            if (idxC >= idxD) {
              const firstLayerName = rule.firstLayerName || 'Unknown';
              const secondLayerName = rule.secondLayerName || 'Unknown';
              violationsSet.add(`Rule Violation: Layer "${firstLayerName}" must be rendered below "${secondLayerName}"`);
            }
          }
        } else if (rule.appliesTo === "between-traits") {
          rule.firstTraits.forEach(c => {
            rule.secondTraits.forEach(d => {
              if (!c || !d) return;
              if (c.name === 'none' || c.id === 'none' || d.name === 'none' || d.id === 'none') return;
              const idxC = nft.traits.findIndex(t => t.layer && t.layer.id === c.layerId && t.trait && t.trait.id === c.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              const idxD = nft.traits.findIndex(t => t.layer && t.layer.id === d.layerId && t.trait && t.trait.id === d.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              // TRULY FIXED: Violation when C is NOT earlier than D
              if (idxC !== -1 && idxD !== -1 && idxC >= idxD) {
                const cName = c.name || 'Trait C';
                const dName = d.name || 'Trait D';
                violationsSet.add(`Rule Violation: Trait "${cName}" must be rendered below "${dName}"`);
              }
            });
          });
        } else if (rule.appliesTo === "traits-to-layer") {
          rule.traits.forEach(trait => {
            if (!trait || trait.name === 'none' || trait.id === 'none') return;
            const idxTrait = nft.traits.findIndex(t => t.layer && t.layer.id === trait.layerId && t.trait && t.trait.id === trait.id && t.trait.name !== 'none' && t.trait.id !== 'none');
            const idxLayer = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
            // TRULY FIXED: "Trait below Layer" means Trait earlier (idxTrait < idxLayer)
            // Violation when Trait is NOT earlier (idxTrait >= idxLayer)
            if (idxTrait !== -1 && idxLayer !== -1 && idxTrait >= idxLayer) {
              // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
              const actualTrait = nft.traits[idxTrait];
              const actualLayer = nft.traits[idxLayer];
              const traitName = actualTrait?.trait?.name || trait.name || 'Trait';
              const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
              violationsSet.add(`Rule Violation: Trait "${traitName}" must be rendered below layer "${layerName}"`);
            }
          });
        } else if (rule.appliesTo === "layer-to-traits") {
          rule.traits.forEach(trait => {
            if (!trait || trait.name === 'none' || trait.id === 'none') return;
            const idxLayer = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
            const idxTrait = nft.traits.findIndex(t => t.layer && t.layer.id === trait.layerId && t.trait && t.trait.id === trait.id && t.trait.name !== 'none' && t.trait.id !== 'none');
            // TRULY FIXED: "Layer below Trait" means Layer earlier (idxLayer < idxTrait)
            // Violation when Layer is NOT earlier (idxLayer >= idxTrait)
            if (idxLayer !== -1 && idxTrait !== -1 && idxLayer >= idxTrait) {
              // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
              const actualLayer = nft.traits[idxLayer];
              const actualTrait = nft.traits[idxTrait];
              const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
              const traitName = actualTrait?.trait?.name || trait.name || 'Trait';
              violationsSet.add(`Rule Violation: Layer "${layerName}" must be rendered below trait "${traitName}"`);
            }
          });
        }
      }
      // Immediately-above: check if specified layer(s) or trait(s) are directly above the target
      // "A immediately above B" means A renders JUST AFTER B = A is directly after B in array (idxA = idxB + 1)
      // VIOLATION occurs when A is NOT immediately above B (i.e., idxA ≠ idxB + 1)
      if (rule.type === "immediately-above") {
        if (rule.appliesTo === "between-layers") {
          const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === rule.firstLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === rule.secondLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          // TRULY FIXED: "A immediately above B" means idxA = idxB + 1
          // Violation when idxA !== idxB + 1
          if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
            const firstLayerName = rule.firstLayerName || 'Unknown';
            const secondLayerName = rule.secondLayerName || 'Unknown';
            violationsSet.add(`Rule Violation: Layer "${firstLayerName}" must be rendered immediately above "${secondLayerName}"`);
          }
        } else if (rule.appliesTo === "between-traits") {
          if (rule.firstTraits && Array.isArray(rule.firstTraits) && rule.secondTraits && Array.isArray(rule.secondTraits)) {
            rule.firstTraits.forEach(aObj => {
              rule.secondTraits.forEach(bObj => {
                if (!aObj || !bObj) return;
                if (aObj.name === 'none' || aObj.id === 'none' || bObj.name === 'none' || bObj.id === 'none') return;
                const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === aObj.layerId && t.trait && t.trait.id === aObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
                const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === bObj.layerId && t.trait && t.trait.id === bObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
                // TRULY FIXED: Check if A is NOT immediately above B (idxA ≠ idxB + 1)
                if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
                  const aName = aObj.name || 'Trait A';
                  const bName = bObj.name || 'Trait B';
                  violationsSet.add(`Rule Violation: Trait "${aName}" must be rendered immediately above "${bName}"`);
                }
              });
            });
          }
        } else if (rule.appliesTo === "traits-to-layer") {
          // CRITICAL FIX: For traits-to-layer, traits are in rule.traits and layer is in rule.layerId
          if (rule.traits && Array.isArray(rule.traits)) {
            rule.traits.forEach(aObj => {
              if (!aObj || aObj.name === 'none' || aObj.id === 'none') return;
              const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === aObj.layerId && t.trait && t.trait.id === aObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
              // TRULY FIXED: Check if Trait is NOT immediately above Layer (idxA ≠ idxB + 1)
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
                // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
                const actualTrait = nft.traits[idxA];
                const actualLayer = nft.traits[idxB];
                const aName = actualTrait?.trait?.name || aObj.name || 'Trait';
                const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
                violationsSet.add(`Rule Violation: Trait "${aName}" must be rendered immediately above layer "${layerName}"`);
              }
            });
          }
        } else if (rule.appliesTo === "layer-to-traits") {
          // CRITICAL FIX: For layer-to-traits, traits are in rule.traits (not rule.secondTraits)
          // and layer is in rule.layerId (not rule.firstLayerId)
          if (rule.traits && Array.isArray(rule.traits)) {
            rule.traits.forEach(bObj => {
              if (!bObj || bObj.name === 'none' || bObj.id === 'none') return;
              const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
              const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === bObj.layerId && t.trait && t.trait.id === bObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              // TRULY FIXED: Check if Layer is NOT immediately above Trait (idxA ≠ idxB + 1)
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB + 1) {
                // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
                const actualLayer = nft.traits[idxA];
                const actualTrait = nft.traits[idxB];
                const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
                const bName = actualTrait?.trait?.name || bObj.name || 'Trait';
                violationsSet.add(`Rule Violation: Layer "${layerName}" must be rendered immediately above trait "${bName}"`);
              }
            });
          }
        }
      }
      // Immediately-below: check if specified layer(s) or trait(s) are directly below the target
      // "A immediately below B" means A renders JUST BEFORE B = A is directly before B in array (idxA = idxB - 1)
      // VIOLATION occurs when A is NOT immediately below B (i.e., idxA ≠ idxB - 1)
      if (rule.type === "immediately-below") {
        if (rule.appliesTo === "between-layers") {
          const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === rule.firstLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === rule.secondLayerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
          // TRULY FIXED: "A immediately below B" means idxA = idxB - 1
          // Violation when idxA !== idxB - 1
          if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
            const firstLayerName = rule.firstLayerName || 'Unknown';
            const secondLayerName = rule.secondLayerName || 'Unknown';
            violationsSet.add(`Rule Violation: Layer "${firstLayerName}" must be rendered immediately below "${secondLayerName}"`);
          }
        } else if (rule.appliesTo === "between-traits") {
          if (rule.firstTraits && Array.isArray(rule.firstTraits) && rule.secondTraits && Array.isArray(rule.secondTraits)) {
            rule.firstTraits.forEach(aObj => {
              rule.secondTraits.forEach(bObj => {
                if (!aObj || !bObj) return;
                if (aObj.name === 'none' || aObj.id === 'none' || bObj.name === 'none' || bObj.id === 'none') return;
                const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === aObj.layerId && t.trait && t.trait.id === aObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
                const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === bObj.layerId && t.trait && t.trait.id === bObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
                // TRULY FIXED: Check if A is NOT immediately below B (idxA ≠ idxB - 1)
                if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
                  const aName = aObj.name || 'Trait A';
                  const bName = bObj.name || 'Trait B';
                  violationsSet.add(`Rule Violation: Trait "${aName}" must be rendered immediately below "${bName}"`);
                }
              });
            });
          }
        } else if (rule.appliesTo === "traits-to-layer") {
          // CRITICAL FIX: For traits-to-layer, traits are in rule.traits and layer is in rule.layerId
          if (rule.traits && Array.isArray(rule.traits)) {
            rule.traits.forEach(aObj => {
              if (!aObj || aObj.name === 'none' || aObj.id === 'none') return;
              const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === aObj.layerId && t.trait && t.trait.id === aObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
              // TRULY FIXED: Check if Trait is NOT immediately below Layer (idxA ≠ idxB - 1)
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
                // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
                const actualTrait = nft.traits[idxA];
                const actualLayer = nft.traits[idxB];
                const aName = actualTrait?.trait?.name || aObj.name || 'Trait';
                const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
                violationsSet.add(`Rule Violation: Trait "${aName}" must be rendered immediately below layer "${layerName}"`);
              }
            });
          }
        } else if (rule.appliesTo === "layer-to-traits") {
          // CRITICAL FIX: For layer-to-traits, traits are in rule.traits (not rule.secondTraits)
          // and layer is in rule.layerId (not rule.firstLayerId)
          if (rule.traits && Array.isArray(rule.traits)) {
            rule.traits.forEach(bObj => {
              if (!bObj || bObj.name === 'none' || bObj.id === 'none') return;
              const idxA = nft.traits.findIndex(t => t.layer && t.layer.id === rule.layerId && t.trait && t.trait.name !== 'none' && t.trait.id !== 'none');
              const idxB = nft.traits.findIndex(t => t.layer && t.layer.id === bObj.layerId && t.trait && t.trait.id === bObj.id && t.trait.name !== 'none' && t.trait.id !== 'none');
              // TRULY FIXED: Check if Layer is NOT immediately below Trait (idxA ≠ idxB - 1)
              if (idxA !== -1 && idxB !== -1 && idxA !== idxB - 1) {
                // CRITICAL FIX: Use ACTUAL trait/layer names from NFT at found indices
                const actualLayer = nft.traits[idxA];
                const actualTrait = nft.traits[idxB];
                const layerName = actualLayer?.layer?.name || rule.layerName || 'Layer';
                const bName = actualTrait?.trait?.name || bObj.name || 'Trait';
                violationsSet.add(`Rule Violation: Layer "${layerName}" must be rendered immediately below trait "${bName}"`);
              }
            });
          }
        }
      }
      // TODO: Add support for between-traits and other rule types as needed
    }
    return Array.from(violationsSet);
  },

  // Helper method to check if an always-combine rule conflicts with never-combine rules
  checkNeverCombineConflict: function(alwaysCombineRule, allRules, selectedTraitsByLayerId) {
    // Find all never-combine rules that could conflict with this always-combine rule
    const neverCombineRules = allRules.filter(rule => rule.type === 'never-combine');
    
    for (const neverRule of neverCombineRules) {
      // Check between-layers conflicts
      if (neverRule.appliesTo === 'between-layers') {
        // Check if the always-combine rule involves the same layers as a never-combine rule
        if (alwaysCombineRule.appliesTo === 'between-layers') {
          if ((alwaysCombineRule.firstLayerId === neverRule.firstLayerId && alwaysCombineRule.secondLayerId === neverRule.secondLayerId) ||
              (alwaysCombineRule.firstLayerId === neverRule.secondLayerId && alwaysCombineRule.secondLayerId === neverRule.firstLayerId)) {
            console.log(`[DEBUG] Found never-combine conflict: Layers ${neverRule.firstLayerName} and ${neverRule.secondLayerName} should never be combined`);
            return true;
          }
        }
        // Check if always-combine layer-to-traits conflicts with never-combine between-layers
        else if (alwaysCombineRule.appliesTo === 'layer-to-traits') {
          if (alwaysCombineRule.layerId === neverRule.firstLayerId || alwaysCombineRule.layerId === neverRule.secondLayerId) {
            // Check if any of the required traits are in the conflicting layer
            const conflictingLayerId = alwaysCombineRule.layerId === neverRule.firstLayerId ? neverRule.secondLayerId : neverRule.firstLayerId;
            const hasConflictingTrait = alwaysCombineRule.traits.some(t => t.layerId === conflictingLayerId);
            if (hasConflictingTrait) {
              console.log(`[DEBUG] Found never-combine conflict: Layer-to-traits rule conflicts with never-combine between layers`);
              return true;
            }
          }
        }
        // Check if always-combine traits-to-layer conflicts with never-combine between-layers
        else if (alwaysCombineRule.appliesTo === 'traits-to-layer') {
          if (alwaysCombineRule.layerId === neverRule.firstLayerId || alwaysCombineRule.layerId === neverRule.secondLayerId) {
            // Check if any of the required traits are in the conflicting layer
            const conflictingLayerId = alwaysCombineRule.layerId === neverRule.firstLayerId ? neverRule.secondLayerId : neverRule.firstLayerId;
            const hasConflictingTrait = alwaysCombineRule.traits.some(t => t.layerId === conflictingLayerId);
            if (hasConflictingTrait) {
              console.log(`[DEBUG] Found never-combine conflict: Traits-to-layer rule conflicts with never-combine between layers`);
              return true;
            }
          }
        }
      }
      
      // Check between-traits conflicts
      else if (neverRule.appliesTo === 'between-traits' && neverRule.firstTraits && neverRule.secondTraits) {
        if (alwaysCombineRule.appliesTo === 'between-traits' && alwaysCombineRule.firstTraits && alwaysCombineRule.secondTraits) {
          // Check if any traits from always-combine first group conflict with never-combine rules
          const hasFirstGroupConflict = alwaysCombineRule.firstTraits.some(ft => {
            return neverRule.firstTraits.some(nft => nft.layerId === ft.layerId && nft.id === ft.id) ||
                   neverRule.secondTraits.some(nst => nst.layerId === ft.layerId && nst.id === ft.id);
          });
          
          // Check if any traits from always-combine second group conflict with never-combine rules
          const hasSecondGroupConflict = alwaysCombineRule.secondTraits.some(st => {
            return neverRule.firstTraits.some(nft => nft.layerId === st.layerId && nft.id === st.id) ||
                   neverRule.secondTraits.some(nst => nst.layerId === st.layerId && nst.id === st.id);
          });
          
          if (hasFirstGroupConflict && hasSecondGroupConflict) {
            console.log(`[DEBUG] Found never-combine conflict: Always-combine between-traits rule conflicts with never-combine between-traits`);
            return true;
          }
        }
        // Check layer-to-traits conflicts with between-traits never-combine
        else if (alwaysCombineRule.appliesTo === 'layer-to-traits') {
          const hasLayerConflict = neverRule.firstTraits.some(ft => ft.layerId === alwaysCombineRule.layerId) ||
                                  neverRule.secondTraits.some(st => st.layerId === alwaysCombineRule.layerId);
          
          if (hasLayerConflict) {
            const hasTraitConflict = alwaysCombineRule.traits.some(t => {
              return neverRule.firstTraits.some(ft => ft.layerId === t.layerId && ft.id === t.id) ||
                     neverRule.secondTraits.some(st => st.layerId === t.layerId && st.id === t.id);
            });
            
            if (hasTraitConflict) {
              console.log(`[DEBUG] Found never-combine conflict: Layer-to-traits rule conflicts with never-combine between-traits`);
              return true;
            }
          }
        }
        // Check traits-to-layer conflicts with between-traits never-combine
        else if (alwaysCombineRule.appliesTo === 'traits-to-layer') {
          const hasLayerConflict = neverRule.firstTraits.some(ft => ft.layerId === alwaysCombineRule.layerId) ||
                                  neverRule.secondTraits.some(st => st.layerId === alwaysCombineRule.layerId);
          
          if (hasLayerConflict) {
            const hasTraitConflict = alwaysCombineRule.traits.some(t => {
              return neverRule.firstTraits.some(ft => ft.layerId === t.layerId && ft.id === t.id) ||
                     neverRule.secondTraits.some(st => st.layerId === t.layerId && st.id === t.id);
            });
            
            if (hasTraitConflict) {
              console.log(`[DEBUG] Found never-combine conflict: Traits-to-layer rule conflicts with never-combine between-traits`);
              return true;
            }
          }
        }
      }
    }
    
    return false;
  },

  // Update selectRandomTrait for consistent behavior
  selectRandomTrait: function(traits, projectData, overrideRules = false, seed = null, layer = null, darkModeEnabled = false) {
    // Dark mode trait filtering
    let filteredTraits = traits;
    
    if (darkModeEnabled && layer) {
      // Check if custom dark traits configuration exists
      const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
      let customDarkTraits = [];
      
      if (generateNftsUI?.darkTraitsConfig?.customConfig && generateNftsUI.darkTraitsConfig.selectedTraits.size > 0) {
        // Use custom dark traits configuration from Dark NFTs modal
        const layerTraits = generateNftsUI.darkTraitsConfig.selectedTraits;
        customDarkTraits = traits.filter(trait => {
          const traitId = `${layer.id}_${trait.id}`;
          return layerTraits.has(traitId);
        });
        
        if (window.DEBUG_RULE_APPLICATION) {
          console.log(`[DARK MODE] Layer '${layer.name}': Using custom dark traits configuration (${customDarkTraits.length} traits selected)`);
        }
      } else {
        // Fallback to default dark keywords when no custom configuration
        const darkKeywords = ['dark', 'black', 'grey', 'gray', 'charcoal', 'ebony', 'shadow', 'night', 'midnight'];
        customDarkTraits = traits.filter(trait => {
          const traitName = trait.name.toLowerCase();
          return darkKeywords.some(keyword => traitName.includes(keyword));
        });
        
        if (window.DEBUG_RULE_APPLICATION) {
          console.log(`[DARK MODE] Layer '${layer.name}': Using default dark keywords (${customDarkTraits.length} traits found)`);
        }
      }
      
      // If dark traits are found (custom or default), use them with probability based on count
      if (customDarkTraits.length > 0) {
        // Create a deterministic random for dark mode check
        const darkSeed = typeof seed === 'number' ? seed + 999999 : 999999;
        const prng = this.createPRNG(darkSeed);
        const darkCheck = prng();
        
        // If only 1 dark trait exists, use 50% probability (more balanced)
        // If 2+ dark traits exist, use 90% probability (strong preference)
        const darkProbability = customDarkTraits.length === 1 ? 0.50 : 0.90;
        
        if (darkCheck < darkProbability) {
          filteredTraits = customDarkTraits;
          if (window.DEBUG_RULE_APPLICATION) {
            console.log(`[DARK MODE] Layer '${layer.name}': Using ${customDarkTraits.length} dark trait${customDarkTraits.length > 1 ? 's' : ''} (${darkProbability * 100}% probability)`);
            console.log(`[DARK MODE] Selected traits: ${customDarkTraits.map(t => t.name).join(', ')}`);
          }
        } else {
          // FIXED: When dark mode is enabled and custom config exists, NEVER use non-dark traits
          // Only fallback to all traits if using default dark keywords (no custom config)
          if (generateNftsUI?.darkTraitsConfig?.customConfig) {
            // Custom configuration exists - ONLY use selected dark traits
            filteredTraits = customDarkTraits;
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`[DARK MODE] Layer '${layer.name}': Custom config active - ONLY using ${customDarkTraits.length} selected dark traits (no fallback)`);
              console.log(`[DARK MODE] Selected traits: ${customDarkTraits.map(t => t.name).join(', ')}`);
            }
          } else {
            // Default dark keywords - allow fallback to all traits
            if (window.DEBUG_RULE_APPLICATION) {
              console.log(`[DARK MODE] Layer '${layer.name}': Using all ${traits.length} traits (${(1 - darkProbability) * 100}% probability - default keywords)`);
            }
          }
        }
      } else {
        // No dark traits found in this layer - use all traits normally (like background/eyes)
        if (window.DEBUG_RULE_APPLICATION) {
          console.log(`[DARK MODE] Layer '${layer.name}': No dark traits found, using all ${traits.length} traits normally`);
        }
      }
    }
    
    // Calculate total rarity
    const totalRarity = filteredTraits.reduce((sum, trait) => sum + (trait.rarity || 0), 0);
    
    // Generate deterministic random number based on seed
    let random;
    
    // Debug info if needed
    if (window.DEBUG_RULE_APPLICATION) {
      console.log(`Selecting trait from ${filteredTraits.length} options with seed: ${seed}`);
      console.log(`Available traits: ${filteredTraits.map(t => `${t.name}: ${t.rarity}%`).join(', ')}`);
    }
    
    // Use numeric seed directly
    if (typeof seed === 'number') {
      // Create a deterministic PRNG using the seed
      const prng = this.createPRNG(seed);
      random = prng();
      
      if (window.DEBUG_RULE_APPLICATION) {
        console.log(`Using numeric seed ${seed} to generate random value: ${random.toFixed(6)}`);
      }
    }
    // Use string seed if provided
    else if (typeof seed === 'string' && window.NFTApp.getModule && window.NFTApp.getModule("seedService") && projectData && projectData.seedAlgorithm) {
      if (window.DEBUG_RULE_APPLICATION) {
        console.log(`Using string seed "${seed}" with algorithm`);
      }
        random = window.NFTApp.getModule("seedService").generateRandom(seed, projectData.seedAlgorithm);
    } 
    // Fallback to creating a deterministic seed from trait information
    else {
      // Create a seed based on traits information
      const traitNames = traits.map(t => t.name).join('-');
      const fallbackSeed = this.stringToHashCode(traitNames) * 31;
      const prng = this.createPRNG(fallbackSeed);
      random = prng();
      
      if (window.DEBUG_RULE_APPLICATION) {
        console.log(`Using fallback seed ${fallbackSeed} from trait names to generate random value: ${random.toFixed(6)}`);
      }
    }
    
    // Select trait based on rarity and the random value
    // FIX: Use random number between 0 and totalRarity, and select trait whose cumulative rarity exceeds this value
    let cumulative = 0;
    const randomValue = random * totalRarity; // random is in [0,1), scale to [0,totalRarity)
    for (const trait of filteredTraits) {
      cumulative += trait.rarity || 0;
      if (randomValue < cumulative) {
        if (window.DEBUG_RULE_APPLICATION) {
          console.log(`Selected trait: ${trait.name} (${trait.rarity}%) with randomValue: ${randomValue.toFixed(2)} / cumulative: ${cumulative}`);
        }
        return trait;
      }
    }
    // If no trait is selected, return undefined (do not fallback to first trait)
    if (window.DEBUG_RULE_APPLICATION) {
      console.log(`No trait selected by probability - skipping this layer.`);
    }
    return undefined;
  },

  generateNFTCollection: function(projectData) {
    const nfts = []
    const usedCombinations = new Set() // Track used trait combinations for uniqueness

    // Initialize currentNFTIndex for seed-based generation
    projectData.currentNFTIndex = 0

    for (let i = 0; i < projectData.size; i++) {
      projectData.currentNFTIndex = i
      const nft = this.generateSingleNFT(projectData)

      // Check for uniqueness if required
      if (projectData.generateUniqueNfts) {
        const traitCombination = JSON.stringify(nft.traits)
        if (usedCombinations.has(traitCombination)) {
          // If duplicate found and uniqueness is required, try again
          i-- // Retry this index
          continue
        }
        usedCombinations.add(traitCombination)
      }

      nfts.push(nft)
    }

    // --- RARITY RANKING LOGIC ---
    // Create an array of {score, originalIndex, nft}
    const scored = nfts.map((nft, idx) => ({
      score: nft.averageRarityScore,
      originalIndex: idx,
      nft: nft
    }))
    // Sort by score ascending (most rare first), then by original index
    scored.sort((a, b) => {
      if (a.score !== b.score) return a.score - b.score
      return a.originalIndex - b.originalIndex
    })
    // Assign unique rarity_rank (1 = most rare)
    let currentRank = 1
    let lastScore = null
    let sameScoreCount = 0
    for (let i = 0; i < scored.length; i++) {
      const entry = scored[i]
      if (lastScore !== null && entry.score === lastScore) {
        sameScoreCount++
      } else {
        sameScoreCount = 0
      }
      // The rank is currentRank + sameScoreCount
      entry.nft.rarity_rank = currentRank + sameScoreCount
      lastScore = entry.score
      currentRank++
    }
    // Restore original order (not needed, nfts array is untouched)
    return nfts
  },

  // Method to generate an NFT with a specific seed
  generateSingleNFTWithSeed: function(projectData) {
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
      return;
    }
    
    // Remember the current state of the toggle
    const wasToggleEnabled = singleSeedToggle ? singleSeedToggle.classList.contains('active') : false;
    
    // Get the seed from the input
    const seedValue = singleSeedInput.value;
    
    console.log(`Generating NFT with specific seed: ${seedValue}`);
    
    // Show loading overlay without clearing the current NFT preview
    this.showLoadingOverlay("Generating NFT with specific seed...", true);
    
    try {
      // Generate an NFT with this seed - now handling the Promise
      window.NFTApp.getModule('generateNfts').generateSingleNFT(
        projectData, false, seedValue
      ).then(nft => {
          // Update the global NFT reference
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
          
          // Update the UI without modifying the toggle state
          window.NFTApp.getModule('generateNftsUI').updateSinglePreviewPanel(projectData, nft);
          
          // Update trait info panel
          window.NFTApp.getModule('generateNftsUI').updateTraitInfoPanel(nft, projectData);
          
          // Show success notification
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              "NFT generated with seed: " + seedValue, 
              "success", 
              3000
            );
          }
          
          // Verify the seed after a short delay to ensure UI has updated
          setTimeout(() => {
            this.verifyDeterministicSeed(nft, projectData);
          }, 300);
          
          // Restore the toggle state if it was changed by other functions
          if (singleSeedToggle && singleSeedToggle.classList.contains('active') !== wasToggleEnabled) {
            if (wasToggleEnabled) {
              singleSeedToggle.classList.add('active');
            } else {
              singleSeedToggle.classList.remove('active');
            }
            singleSeedToggle.dispatchEvent(new Event('change'));
          }
          
          console.log("Successfully generated NFT with seed:", seedValue);
        })
        .catch(err => {
          console.error(`Error generating NFT with seed ${seedValue}:`, err);
          
          // Show error notification
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              "Error generating NFT with this seed", 
              "error", 
              3000
            );
          }
        })
        .finally(() => {
          // Hide loading overlay
          window.NFTApp.getModule('generateNftsUI').hideLoadingOverlay();
        });
    } catch (err) {
      console.error(`Error initiating NFT generation with seed ${seedValue}:`, err);
      
      // Show error notification
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Error generating NFT with this seed", 
          "error", 
          3000
        );
      }
      
      // Hide loading overlay
      window.NFTApp.getModule('generateNftsUI').hideLoadingOverlay();
    }
  },

  generateSeedNFT: function(projectData) {
    // Call our new implementation that handles seed verification animation
    this.generateSingleNFTWithSeed(projectData);
  },

  verifySeedConsistency: function(projectData) {
    // Verify the deterministic seed system works properly
    console.log("Verifying seed consistency for deterministic NFT generation");
    if (!window.NFTApp || !window.NFTApp.getModule || !window.NFTApp.getModule("seedService")) {
      console.warn("Seed service not available, skipping seed consistency verification");
      return;
    }
    // Create a test set of traits
    const testTraits = [
      { layer: "Background", trait: "Blue" },
      { layer: "Body", trait: "Basic" },
      { layer: "Eyes", trait: "Normal" }
    ];
    try {
      const seed1 = window.NFTApp.getModule("seedService").generateSeed(testTraits, projectData.seedAlgorithm);
      const seed2 = window.NFTApp.getModule("seedService").generateSeed(testTraits, projectData.seedAlgorithm);
      if (seed1 === seed2) {
        console.log("✅ Seed consistency verified: The same traits produce the same seed");
      } else {
        console.error("❌ Seed consistency failed: The same traits produced different seeds!");
        console.log(`First seed: ${seed1}, Second seed: ${seed2}`);
      }
    } catch (error) {
      console.error("Error during seed consistency verification:", error);
    }
  },

  setupDebugTools: function() {
    console.log("Setting up debug tools for rule analysis");
    window.DEBUG_RULE_APPLICATION = false;
    const debugToolbar = document.getElementById('debug-toolbar');
    if (debugToolbar) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'debug-toggle-btn';
      toggleBtn.textContent = 'Toggle Rule Debug';
      toggleBtn.addEventListener('click', () => {
        window.DEBUG_RULE_APPLICATION = !window.DEBUG_RULE_APPLICATION;
        toggleBtn.classList.toggle('active', window.DEBUG_RULE_APPLICATION);
        console.log(`Rule application debugging ${window.DEBUG_RULE_APPLICATION ? 'enabled' : 'disabled'}`);
      });
      debugToolbar.appendChild(toggleBtn);
    } else {
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log("Development environment detected, enabling extended debugging options");
        window.toggleRuleDebug = function() {
          window.DEBUG_RULE_APPLICATION = !window.DEBUG_RULE_APPLICATION;
          console.log(`Rule application debugging ${window.DEBUG_RULE_APPLICATION ? 'enabled' : 'disabled'}`);
          return window.DEBUG_RULE_APPLICATION;
        };
      }
    }
  },

  validateProjectData: function(projectData, force = false) {
    console.log("Validating project data for NFT generation");
    const now = Date.now();
    if (!force && this.validationState && this.validationState.lastCheck > 0) {
      const timeSinceLastCheck = now - this.validationState.lastCheck;
      if (timeSinceLastCheck < 500 && this.validationState.isValid !== null) {
        console.log(`Using cached validation result: ${this.validationState.isValid ? 'Valid' : 'Invalid'} (${timeSinceLastCheck}ms ago)`);
        return this.validationState.isValid;
      }
    }
    if (this.validationState) {
      this.validationState.lastCheck = now;
    }
    if (!projectData.traits || projectData.traits.length === 0) {
      console.log("Validation failed: No trait layers defined");
      window.NFTApp.getModule('generateNftsUI').showError("You need to add at least one trait layer before generating NFTs.");
      if (this.validationState) this.validationState.isValid = false;
      return false;
    }
    let totalTraitCount = 0;
    let layersWithTraits = 0;
    projectData.traits.forEach(layer => {
      if (layer.traits && layer.traits.length > 0) {
        totalTraitCount += layer.traits.length;
        layersWithTraits++;
      }
    });
    if (totalTraitCount < 2) {
      console.log(`Validation failed: Only ${totalTraitCount} trait(s) found, need at least 2`);
      window.NFTApp.getModule('generateNftsUI').showError(`You need to add at least 2 traits across all layers. Currently you have ${totalTraitCount}.`);
      if (this.validationState) this.validationState.isValid = false;
      return false;
    }
    if (layersWithTraits < 1) {
      console.log(`Validation failed: No layers with traits found`);
      window.NFTApp.getModule('generateNftsUI').showError("You need at least one layer with traits.");
      if (this.validationState) this.validationState.isValid = false;
      return false;
    }
    const emptyLayers = projectData.traits.filter(layer => !layer.traits || layer.traits.length === 0);
    if (emptyLayers.length > 0) {
      const emptyLayerNames = emptyLayers.map(layer => layer.name).join(", ");
      console.warn(`Warning: The following layers have no traits: ${emptyLayerNames}`);
    }
    console.log("Project data validation successful");
    window.NFTApp.getModule('generateNftsUI').clearErrorInPreviewPanel();
    // Only show the placeholder if no NFT is currently rendered and the trait info list is empty or only contains a placeholder
    const previewGrid = document.querySelector('.nft-preview-grid');
    const infoList = document.querySelector('.nft-trait-info-list');
    const hasNFT = previewGrid && previewGrid.querySelector('img');
    // Check if the traits panel has any actual trait items
    const hasTraitItems = infoList && infoList.querySelector('.nft-trait-info-item');
    const onlyPlaceholder = infoList && (
      !infoList.innerHTML ||
      infoList.innerHTML.trim() === '' ||
      (infoList.children.length === 1 && infoList.querySelector('.nft-trait-info-list-placeholder'))
    );
    // Only show the placeholder if no NFT is currently rendered and the trait info list is empty or only contains a placeholder, and there are no trait items
    if (!hasNFT && !hasTraitItems && onlyPlaceholder && !(window.NFTApp && window.NFTApp.isRenderingNFT)) {
      window.NFTApp.getModule('generateNftsUI').showTraitsListPlaceholder(projectData);
    } else {
      // If an NFT is rendered or trait items exist, ensure the placeholder is removed
      if (infoList) {
        const placeholder = infoList.querySelector('.nft-trait-info-list-placeholder');
        if (placeholder) placeholder.remove();
        // Also clear the infoList if an NFT is rendered
        if (hasNFT) infoList.innerHTML = '';
      }
    }
    if (this.validationState) this.validationState.isValid = true;
    return true;
  },

  showErrorInPreviewPanel: function(message) {
    console.log(`Showing error in preview panel: ${message}`);
    const previewPanel = document.querySelector('.nft-preview-image-area');
    if (!previewPanel) {
      console.error("NFT preview panel not found for showing error message");
      return;
    }
    
    // Get or create preview container
    let previewContainer = previewPanel.querySelector('#nft-preview-container');
    if (!previewContainer) {
      previewContainer = document.createElement('div');
      previewContainer.id = 'nft-preview-container';
      previewContainer.style.position = 'relative';
      previewContainer.style.width = '100%';
      previewContainer.style.height = '100%';
      previewPanel.appendChild(previewContainer);
    }
    
    // Dim existing NFTs and show error on top
    const existingItems = previewContainer.querySelectorAll('.nft-preview-item');
    existingItems.forEach(item => {
      item.style.opacity = '0.3';
      item.style.zIndex = '1';
    });
    
    const errorElement = document.createElement('div');
    errorElement.className = 'nft-preview-error nft-preview-item';
    errorElement.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 2;
      opacity: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 0, 0, 0.1);
      border-radius: 8px;
    `;
    errorElement.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; text-align: center; padding: 20px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 48px; height: 48px; margin-bottom: 16px;">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
        <div style="color: #ff4444; font-size: 16px; font-weight: 500; max-width: 300px; line-height: 1.5;">
          ${message}
        </div>
      </div>
    `;
    previewContainer.appendChild(errorElement);
    // Clear traits panel if it exists
    this.clearTraitsPanel();
  },

  clearTraitsPanel: function() {
    const traitsPanel = document.querySelector('.nft-trait-info-list');
    if (!traitsPanel) return;
    traitsPanel.innerHTML = `
      <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; min-height: 200px; padding: 20px; text-align: center; color: var(--text-secondary);">
        <svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\" style=\"width: 32px; height: 32px; margin-bottom: 12px;\">
          <path d=\"M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3\"></path>
        </svg>
        <div style=\"font-size: 15px; font-weight: 500; margin-bottom: 8px;\">Traits will appear here</div>
        <div style=\"font-size: 13px; line-height: 1.4;\">
          Generate an NFT to see its traits
        </div>
      </div>
    `;
  },

  setupValidationListeners: function(projectData) {
    // Set up listeners for future events that might require validation
    // This is a placeholder for now, implementation will be added as needed
    console.log("Setting up validation listeners for NFT generation");
  },

  showLoadingOverlay: function(message, transparent = false) {
    window.NFTApp.getModule('generateNftsUI').showLoadingOverlay(message, transparent);
  },
  hideLoadingOverlay: function() {
    window.NFTApp.getModule('generateNftsUI').hideLoadingOverlay();
  },
  showError: function(message) {
    window.NFTApp.getModule('generateNftsUI').showError(message);
  },
  showSuccess: function(message) {
    window.NFTApp.getModule('generateNftsUI').showSuccess(message);
  },
  // Check if a layer can be included given current selected traits and all rules
  isLayerCompatibleWithRules: function(layer, selectedTraits, rules) {
    if (!rules || rules.length === 0) return true;
    
    // PRIORITY SYSTEM: Sort rules by priority (never-combine has highest priority)
    const rulePriority = {
      'never-combine': 1,      // HIGHEST PRIORITY - Cannot be overridden
      'always-above': 2,       // Medium priority
      'always-below': 2,       // Medium priority  
      'immediately-above': 3,  // Lower priority
      'immediately-below': 3,  // Lower priority
      'always-combine': 4      // LOWEST PRIORITY - Can be overridden by never-combine
    };
    
    const sortedRules = [...rules].sort((a, b) => {
      const priorityA = rulePriority[a.type] || 999;
      const priorityB = rulePriority[b.type] || 999;
      return priorityA - priorityB;
    });
    
    // Check never-combine rules first (highest priority)
    for (const rule of sortedRules) {
      if (rule.type === 'never-combine' && rule.appliesTo === 'between-layers') {
        if (selectedTraits[rule.firstLayerId] && layer.id === rule.secondLayerId) {
          console.log(`[DEBUG] Layer ${layer.name} rejected due to never-combine rule with ${rule.firstLayerName}`);
          return false;
        }
        if (selectedTraits[rule.secondLayerId] && layer.id === rule.firstLayerId) {
          console.log(`[DEBUG] Layer ${layer.name} rejected due to never-combine rule with ${rule.secondLayerName}`);
          return false;
        }
      }
    }
    
    // Check other rules only if never-combine doesn't block
    for (const rule of sortedRules) {
      // Always combine: if this layer requires another layer to be present
      if (rule.type === 'always-combine' && rule.appliesTo === 'between-layers') {
        // Check if there's a never-combine rule that would prevent this always-combine
        const hasNeverCombineConflict = this.checkNeverCombineConflict(rule, sortedRules, selectedTraits);
        
        if (!hasNeverCombineConflict) {
          if (layer.id === rule.firstLayerId && selectedTraits[rule.secondLayerId] === undefined) {
            console.log(`[DEBUG] Layer ${layer.name} rejected due to always-combine rule requiring ${rule.secondLayerName}`);
            return false;
          }
          if (layer.id === rule.secondLayerId && selectedTraits[rule.firstLayerId] === undefined) {
            console.log(`[DEBUG] Layer ${layer.name} rejected due to always-combine rule requiring ${rule.firstLayerName}`);
            return false;
          }
        } else {
          console.log(`[DEBUG] Always-combine rule skipped for layer ${layer.name} due to never-combine conflict`);
        }
      }
    }
    
    return true;
  },
  // Compute deterministic seed for an NFT
  computeDeterministicSeed: function(projectData, nft) {
    // Validate projectData has traits
    if (!projectData || !projectData.traits || !Array.isArray(projectData.traits)) {
      console.warn('[computeDeterministicSeed] Invalid projectData or traits not available');
      return '';
    }
    // Get all layers in bottom-to-top order (REVERSED for bottom-to-top)
    const layers = [...projectData.traits].slice().reverse();
    // Map: layerId -> traitId for this NFT
    const traitMap = {};
    if (nft && nft.traits) {
      nft.traits.forEach(ti => {
        if (ti.trait && ti.trait.name !== 'none') {
          traitMap[ti.layer.id] = ti.trait.id;
        }
      });
    }
    // Build the seed string
    let seed = '';
    layers.forEach(layer => {
      if (!traitMap[layer.id]) {
        seed += '00';
      } else {
        // Sort traits alphabetically by name
        const sortedTraits = [...layer.traits].sort((a, b) => a.name.localeCompare(b.name));
        const traitIdx = sortedTraits.findIndex(t => t.id === traitMap[layer.id]);
        // traitIdx is 0-based, so add 1 and pad to 2 digits
        seed += traitIdx >= 0 ? String(traitIdx + 1).padStart(2, '0') : '00';
      }
    });
    return seed;
  },
}) 