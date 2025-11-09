// Project Service Module
;(() => {
  // Create the project service module
  const projectService = {
    fileInput: null,

    // Helper function to safely save to localStorage with quota protection
    safeLocalStorageSetItem: function(key, value) {
      try {
        const valueString = typeof value === 'string' ? value : JSON.stringify(value);
        const valueSize = valueString.length;
        
        // Check if the data is too large for localStorage
        if (valueSize > 5 * 1024 * 1024) { // 5MB limit
          console.warn('Data too large for localStorage:', key, 'size:', (valueSize / 1024 / 1024).toFixed(2), 'MB');
          return false;
        }
        
        localStorage.setItem(key, valueString);
        return true;
      } catch (quotaError) {
        console.warn('QuotaExceededError when saving to localStorage:', key, quotaError);
        
        // Try to free up some space
        try {
          console.log('Attempting to free up localStorage space...');
          
          // Remove old seed lists from other projects
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const storageKey = localStorage.key(i);
            if (storageKey && storageKey.startsWith('nftSeedList_') && storageKey !== key) {
              keysToRemove.push(storageKey);
            }
          }
          
          // Remove up to 5 old seed lists
          keysToRemove.slice(0, 5).forEach(storageKey => {
            localStorage.removeItem(storageKey);
            console.log('Removed old seed list:', storageKey);
          });
          
          // Try saving again
          const valueString = typeof value === 'string' ? value : JSON.stringify(value);
          localStorage.setItem(key, valueString);
          console.log('Successfully saved after cleanup:', key);
          return true;
        } catch (retryError) {
          console.warn('Still unable to save after cleanup:', key, retryError);
          return false;
        }
      }
    },
    isSaving: false, // Add a flag to track save operations
    isLoading: false, // Add a flag to track load operations
    lastFileHandle: null, // Store the most recent file handle for reuse
    lastProjectDir: null, // Store the last used directory for project files

    init: function () {
      console.log("Initializing project service module")
      // Restore last file handle/path from localStorage if available
      try {
        if (window.localStorage) {
          const lastPath = window.localStorage.getItem('nftcc_lastProjectPath');
          if (lastPath) {
            this.lastFileHandle = lastPath;
          }
          // Restore last used directory
          const lastDir = window.localStorage.getItem('nftcc_lastProjectDir');
          if (lastDir) {
            this.lastProjectDir = lastDir;
          }
        }
      } catch (e) { console.warn('Could not access localStorage for last project path/dir', e); }
      this.bindEvents()
    },

    bindEvents: function () {
      console.log("Binding project service events")

      // Save Project button
      const saveProjectBtn = document.getElementById("save-project")
      if (saveProjectBtn) {
        // Remove this block entirely, as Save Project is being deleted
      }

      // Save As button (if exists)
      const saveAsProjectBtn = document.getElementById("save-project-as")
      if (saveAsProjectBtn) {
        saveAsProjectBtn.addEventListener("click", () => {
          if (!this.isSaving) {
            this.save(true) // true = always show picker (save as mode)
          } else {
            console.log("Save operation already in progress, ignoring duplicate request")
          }
        })
      }

      // New Project button in navigation
      const newProjectNavBtn = document.getElementById("new-project")
      if (newProjectNavBtn) {
        newProjectNavBtn.addEventListener("click", () => {
          this.startNew()
        })
      }

      // Load Project button in navigation
      const loadProjectNavBtn = document.getElementById("load-project-btn")
      if (loadProjectNavBtn) {
        loadProjectNavBtn.addEventListener("click", () => {
          const loadProjectInput = document.getElementById("load-project-input")
          if (loadProjectInput) {
            loadProjectInput.click()
          }
        })
      }

      // Load Project input
      const loadProjectInput = document.getElementById("load-project-input")
      if (loadProjectInput) {
        loadProjectInput.addEventListener("change", (event) => {
          this.load(event)
        })
      }
    },

    startNew: function() {
      console.log("Starting new project")

      // Create a new project
      const newProject = {
        name: "Untitled Collection",
        description: "",
        size: null,
        traits: [],
        rules: [],
        defaultNftDescription: "",
        filenamePrefix: "NFT",
        batches: [{ size: '', minted: false }],
        selectedBatches: [],
        selectedBlockchains: [],
        blockchainPerNft: {},
        settings: {
          generateUniqueNfts: true
        },
        savedSeeds: []
      }

      // Initialize seed algorithm using the seed service
      if (window.NFTApp.getModule && window.NFTApp.getModule("seedService")) {
        newProject.seedAlgorithm = window.NFTApp.getModule("seedService").createSeedAlgorithm();
        console.log("Created new seed algorithm for project:", newProject.seedAlgorithm);
      } else {
        console.warn("Seed service not available, consistent NFT generation across sessions may not work");
      }

      // Set the current project
      window.currentProject = newProject

      // Show the project interface
      if (window.NFTApp.getModule && window.NFTApp.getModule("projectInterface")) {
        window.NFTApp.getModule("projectInterface").start(newProject)
      } else {
        console.error("Project interface module not found")
        alert("Sorry, the project interface is not available. Please try refreshing the page.")
      }

      // Update all counters for new project
      setTimeout(() => {
        // Use unified counter update system
        if (window.updateAllCounters) {
          window.updateAllCounters();
          console.log("All counters updated for new project");
        } else {
          // Fallback to individual updates if unified system not available
          if (window.updateNftCountPanel) {
            window.updateNftCountPanel();
            console.log("Updated NFT count panel for new project (fallback)");
          }
        }
      }, 1000); // Delay to ensure UI is fully rendered

      // Update all counters after starting a new project (debounced)
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
        // Update the module's projectData
        window.NFTApp.getModule('generateNftsUI').projectData = newProject;
        
        // Debounce counter updates to avoid multiple rapid calls
        clearTimeout(this._counterUpdateTimeout);
        this._counterUpdateTimeout = setTimeout(() => {
          // Use unified counter update system
          if (window.updateAllCounters) {
            window.updateAllCounters();
            console.log('[DEBUG] All counters updated after starting new project');
          } else {
            // Fallback to individual updates if unified system not available
            if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
              window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(false);
              console.log('[DEBUG] Seed counter updated after starting new project (fallback)');
            }
            
            if (window.updateNftCountPanel) {
              window.updateNftCountPanel();
              console.log('[DEBUG] NFT count panel updated after starting new project (fallback)');
            }
          }
        }, 500); // Increased debounce time
      }
    },

    load: function(event) {
      console.log("Loading project")

      const file = event.target.files[0]
      if (!file) {
        console.warn("No file selected")
        return
      }
      
      // Prevent concurrent loads
      if (this.isLoading) {
        console.warn("[DEBUG] Another project is currently loading, please wait...");
        if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Another project is loading. Please wait...", "warning");
        }
        event.target.value = "";
        return;
      }
      
      this.isLoading = true;
        console.log("Loading project file:", file.name);

      // Store the current active tab
      const currentTab = document.querySelector('.nav-tab.active')?.dataset.tab

      // Show loading animation
      this.showLoadingAnimation("Loading project...")

      // Store the directory of the loaded file (if available)
      try {
        if (window.localStorage && file.webkitRelativePath) {
          // Use the directory part of the path
          const dir = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
          window.localStorage.setItem('nftcc_lastProjectDir', dir);
          this.lastProjectDir = dir;
        } else if (window.localStorage && file.path) {
          // For NW.js/Electron, use the parent directory
          const dir = file.path.substring(0, file.path.lastIndexOf(require('path').sep));
          window.localStorage.setItem('nftcc_lastProjectDir', dir);
          this.lastProjectDir = dir;
        }
      } catch (e) { /* ignore if not available */ }

      // Store the file path/handle for future saves
      try {
        if (window.localStorage && file.path) {
          window.localStorage.setItem('nftcc_lastProjectPath', file.path);
          this.lastFileHandle = file.path;
        }
        // Also store the file name and handle in localStorage for fallback and modern browsers
        if (window.localStorage && file.name) {
          window.localStorage.setItem('nftcc_lastProjectFileName', file.name);
        }
        if (window.localStorage && file instanceof Object && file.name) {
          window.localStorage.setItem('nftcc_lastProjectHandle', JSON.stringify({ name: file.name }));
          this.lastFileHandle = file;
        }
      } catch (e) { console.warn('Could not save last project path', e); }

      const reader = new FileReader()
      
      // Add error handler for FileReader
      reader.onerror = (error) => {
        console.error("Error reading project file:", error);
        this.hideLoadingAnimation();
        this.isLoading = false; // Reset loading flag
        if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Error reading file. Please try again.", "error");
        }
        // Reset the file input
        if (event && event.target) {
          event.target.value = "";
        }
      };
      
      reader.onload = async (e) => {
        try {
          // Validate JSON before parsing
          const jsonString = e.target.result;
          if (!jsonString || typeof jsonString !== 'string' || jsonString.trim() === '') {
            throw new Error('Empty or invalid file content');
          }
          
          const loadedProject = JSON.parse(jsonString);
          
          // Validate that it's actually a project file
          if (!loadedProject || typeof loadedProject !== 'object') {
            throw new Error('Invalid project file format');
          }
          
          // Create a new project with default values
          const defaultProject = {
            name: "Untitled Collection",
            description: "",
            size: 0,
            traits: [],
            rules: [],
            defaultNftDescription: "",
            filenamePrefix: "NFT",
            batches: [{ size: '', minted: false }],
            selectedBatches: [],
            selectedBlockchains: [],
            blockchainPerNft: {},
            settings: {
              generateUniqueNfts: true
            },
            savedSeeds: []
          }

          // Merge loaded project with default values
          const project = {
            ...defaultProject,
            ...loadedProject,
            // Ensure arrays are properly initialized
            traits: Array.isArray(loadedProject.traits) ? loadedProject.traits : [],
            rules: Array.isArray(loadedProject.rules) ? loadedProject.rules : [],
            batches: Array.isArray(loadedProject.batches) ? loadedProject.batches : defaultProject.batches,
            selectedBatches: Array.isArray(loadedProject.selectedBatches) ? loadedProject.selectedBatches : [],
            selectedBlockchains: Array.isArray(loadedProject.selectedBlockchains) ? loadedProject.selectedBlockchains : [],
            blockchainPerNft: (loadedProject.blockchainPerNft && typeof loadedProject.blockchainPerNft === 'object') ? loadedProject.blockchainPerNft : {},
            settings: loadedProject.settings || {}
          }

          // Migrate old project data to new format
          this.migrateProjectData(project);

          // CRITICAL: Ensure trait imageData is preserved after loading
          this.preserveTraitImageData(project);

          // Always ignore any seedAlgorithm from file and use the default
          if (window.NFTApp.getModule && window.NFTApp.getModule("seedService")) {
            project.seedAlgorithm = window.NFTApp.getModule("seedService").createSeedAlgorithm();
            console.log("Using hardcoded deterministic seed algorithm for all projects.");
          } else {
            console.error("Seed service not available, consistent NFT generation across sessions may not work");
          }

          // COMPREHENSIVE CLEANUP BEFORE LOADING NEW PROJECT
          console.log("Starting cleanup before loading new project");
          
          // Clean up saved seeds modal state
          if (window.SavedSeedsModal) {
            try {
              // Clean up saved seeds modal state
              
              // Find existing modal instance
              const existingModal = document.getElementById('saved-seeds-modal');
              if (existingModal && existingModal.savedSeedsModalInstance) {
                const savedSeedsModal = existingModal.savedSeedsModalInstance;
                
                // Close modal if open
                if (savedSeedsModal.modal && savedSeedsModal.modal.style.display === 'flex') {
                  savedSeedsModal.close();
                }
                
                // Reset all modal state
                savedSeedsModal.seedList = [];
                savedSeedsModal.filteredSeedList = [];
                savedSeedsModal.imageCache = {};
                savedSeedsModal.violationsCache = null;
                savedSeedsModal.currentPage = 1;
                savedSeedsModal.isInConflictView = false;
                savedSeedsModal.isFilteringViolations = false;
                savedSeedsModal.isCancelled = false;
                
                console.log("Saved seeds modal state cleaned up");
              }
            } catch (e) {
              console.warn("Error cleaning up saved seeds modal:", e);
            }
          }
          
          // Clear global image cache
          if (window.savedSeedsImageCache) {
            window.savedSeedsImageCache = {};
          }
          
          // Clear global cache timestamps
          if (window.traitChangeTimestamp !== undefined) {
            window.traitChangeTimestamp = Date.now();
          }
          if (window.ruleChangeTimestamp !== undefined) {
            window.ruleChangeTimestamp = Date.now();
          }
          
          // Set the current project first
          window.currentProject = project;
          
          // CRITICAL: Update MemoryManager with the loaded project (without syncing to localStorage)
          if (window.MemoryManager) {
            try {
              console.log("Updating MemoryManager with loaded project");
              // Load project into MemoryManager but don't sync to localStorage yet
              const normalizedProject = window.MemoryManager.normalizeProjectData(project);
              window.MemoryManager.state.currentProject = normalizedProject;
              window.currentProject = normalizedProject;
              console.log("MemoryManager updated successfully");
            } catch (error) {
              console.error("Error updating MemoryManager:", error);
              console.log("Continuing without MemoryManager - using direct project setting");
              // Continue without MemoryManager if it fails
            }
          } else {
            console.log("MemoryManager not available, using direct project setting");
          }
          
          // Update generateNftsUI module with the same project data reference
          if (window.NFTApp.getModule && window.NFTApp.getModule("generateNftsUI")) {
            try {
              const generateNftsUI = window.NFTApp.getModule("generateNftsUI");
              console.log("[DEBUG] Updating generateNftsUI with new project data");
              generateNftsUI.projectData = window.currentProject; // Use the same reference
            } catch (e) {
              console.warn("[DEBUG] Error updating generateNftsUI:", e);
            }
          }
          
          // Note: localStorage will be cleared and repopulated after project interface starts
          console.log("[DEBUG] localStorage will be cleared and repopulated with new project data");

          // Check if this is a reload (app container has content)
          const appContainer = document.getElementById("app");
          const isReload = appContainer && appContainer.children.length > 0;
          
          if (isReload) {
            console.log("[DEBUG] Detected project reload - clearing existing interface");
            
            // Remove existing project interface
            const existingInterface = appContainer.querySelector('.project-interface');
            if (existingInterface) {
              existingInterface.remove();
              console.log("[DEBUG] Existing project interface removed");
            }
            
            // Reset module states that might cause issues
            if (window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
              try {
                const navigation = window.NFTApp.getModule("navigation");
                navigation.generateNftsTabVisited = false;
                console.log("[DEBUG] Navigation state reset");
              } catch (e) {
                console.warn("[DEBUG] Could not reset navigation state:", e);
              }
            }
          }

          // Show the project interface
          if (window.NFTApp.getModule && window.NFTApp.getModule("projectInterface")) {
            try {
              console.log("[DEBUG] Starting project interface with new project");
              window.NFTApp.getModule("projectInterface").start(project);
              console.log("[DEBUG] Project interface started successfully");
            } catch (error) {
              console.error("[DEBUG] Error starting project interface:", error);
              console.error("[DEBUG] Error stack:", error.stack);
              console.error("[DEBUG] Error details:", {
                message: error.message,
                name: error.name,
                fileName: error.fileName,
                lineNumber: error.lineNumber
              });
              this.hideLoadingAnimation();
              this.isLoading = false;
              if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                window.NFTApp.getModule("notificationService").show("Error initializing project interface: " + error.message, "error");
              }
              return;
            }
          } else {
            console.error("Project interface module not found");
            this.hideLoadingAnimation();
            this.isLoading = false;
            alert("Sorry, the project interface is not available. Please try refreshing the page.");
            return;
          }

          // Show success notification
          this.hideLoadingAnimation()
          this.isLoading = false; // Reset loading flag on success
          
          if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show("Project loaded successfully", "success")
          }

          // Restore the active tab
          if (currentTab && window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
            window.NFTApp.getModule("navigation").showTab(currentTab)
          }

          // Reset the file input so the same file can be reloaded if needed
          if (event && event.target) {
            event.target.value = "";
          }

          // Restore the last generated NFT preview if it exists in the project
          if (project.lastGeneratedNFT && project.lastGeneratedNFT.seed) {
            console.log('[DEBUG] Restoring last generated NFT preview:', project.lastGeneratedNFT.seed);
            
            // Set a flag to indicate restoration is in progress
            window.nftRestorationInProgress = true;
            
            setTimeout(async () => {
              try {
                const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
                const generateNfts = window.NFTApp.getModule('generateNfts');
                
                if (generateNftsUI && generateNfts && generateNfts.generateSingleNFT) {
                  // Generate the NFT using the saved seed to restore the exact same NFT
                  const restoredNFT = await generateNfts.generateSingleNFT(project, false, project.lastGeneratedNFT.seed);
                  
                  if (restoredNFT) {
                    // Update the global NFT reference
                    window.lastGeneratedNFT = restoredNFT;
                    
                    // Update the UI to show the restored NFT
                    generateNftsUI.updateSinglePreviewPanel(project, restoredNFT);
                    generateNftsUI.updateTraitInfoPanel(restoredNFT, project);
                    
                    // Update the navigation flag to indicate NFT has been generated
                    if (window.NFTApp.getModule('navigation')) {
                      window.NFTApp.getModule('navigation').firstNftGenerated = true;
                    }
                    
                    console.log('[DEBUG] Successfully restored NFT preview:', restoredNFT.seed);
                  }
                }
              } catch (error) {
                console.warn('[DEBUG] Error restoring NFT preview:', error);
                // Fall back to auto-generation if restoration fails
                if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                  window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project);
                }
              } finally {
                // Clear the restoration flag
                window.nftRestorationInProgress = false;
              }
            }, 500); // Give time for UI to initialize, but restore before auto-generation
          } else {
            // Check if we should auto-generate an NFT after project load (if no saved NFT to restore)
            setTimeout(() => {
              if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project)
              }
            }, 1000) // Give time for UI to fully load
          }

          // Helper to get project-specific seed list key
          function getSeedListKey(project) {
            return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
          }

          const seedListKey = getSeedListKey(project);
          // Clear all old seed lists from localStorage (optional, for safety)
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('nftSeedList_')) localStorage.removeItem(key);
          });
          if (Array.isArray(loadedProject.savedSeeds)) {
            try {
              // Skip image data for ALL seeds (both old and new format) to force real-time rendering
              const processedSeeds = loadedProject.savedSeeds.map(seed => {
                
                // Always skip imageData and thumbnail to force real-time rendering for ALL NFTs
                return {
                  seed: seed.seed,
                  traits: (seed.traits || []).map(trait => ({
                    // Keep essential trait data including imageData for trait thumbnails
                    layerId: trait.layerId,
                    traitId: trait.traitId,
                    layerName: trait.layerName,
                    traitName: trait.traitName,
                    // PRESERVE: imageData for trait thumbnails (essential for UI)
                    imageData: trait.imageData
                  })),
                  rarity: seed.rarity,
                  rarityScore: seed.rarityScore || 0,
                  timestamp: seed.timestamp || Date.now()
                  // imageData and thumbnail are always omitted - ALL NFTs will be rendered in real-time
                };
              });
              
              // Try to save to localStorage with quota protection
              const success = this.safeLocalStorageSetItem(seedListKey, processedSeeds);
              if (success) {
                console.log('Restored', processedSeeds.length, 'NFTs to localStorage (converted to real-time rendering format)');
              } else {
                console.log('Seeds will be available in project data only');
              }
              
              // IMPORTANT: Also add saved seeds to project data for immediate availability
              project.savedSeeds = processedSeeds;
              console.log('Added', processedSeeds.length, 'saved seeds to project data');
              
              // Restore rarity scores for each seed (with quota protection)
              processedSeeds.forEach(seedObj => {
                if (seedObj.seed && typeof seedObj.rarityScore === 'number') {
                  try {
                    localStorage.setItem('nftScore_' + seedObj.seed, String(seedObj.rarityScore));
                  } catch (quotaError) {
                    console.warn('[DEBUG] QuotaExceededError when saving rarity score for seed:', seedObj.seed);
                    // Skip saving individual rarity scores if quota exceeded
                  }
                }
              });
            } catch (e) { console.warn('Could not restore savedSeeds to localStorage', e); }
          } else {
            // CRITICAL: Initialize savedSeeds as empty array if not present in project file
            project.savedSeeds = [];
            const success = this.safeLocalStorageSetItem(seedListKey, []);
            if (success) {
              console.log('[DEBUG] No saved seeds in project file - initialized empty savedSeeds array');
            } else {
              console.log('[DEBUG] Seeds will be available in project data only');
            }
          }
          
          // Load trait images from file paths if they exist (only if imageData is missing)
          if (project.traits && project.traits.length > 0) {
            console.log('Checking if trait images need to be loaded from file paths...');
            
            // Check if we already have imageData for most traits (use processed project data)
            let traitsWithImageData = 0;
            let totalTraits = 0;
            
            for (const layer of project.traits) {
              if (layer.traits) {
                for (const trait of layer.traits) {
                  totalTraits++;
                  if (trait.imageData) {
                    traitsWithImageData++;
                  }
                }
              }
            }
            
            const imageDataCoverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
            console.log(`📊 Trait imageData coverage: ${imageDataCoverage.toFixed(1)}% (${traitsWithImageData}/${totalTraits})`);
            
            // Only try to load from file paths if we have less than 80% coverage
            if (imageDataCoverage < 80) {
              console.log('Low imageData coverage, attempting to load from file paths...');
              this.loadTraitImagesFromPaths(project.traits);
            } else {
              console.log('✅ High imageData coverage, skipping file path loading');
            }
          }

          // Restore rarity ranks if they exist (can be array or object)
          if (loadedProject.rarityRanks && typeof loadedProject.rarityRanks === 'object') {
            try {
              const rarityKey = 'rarityRanks_' + encodeURIComponent(project.name);
              
              // Save to localStorage for backward compatibility
              localStorage.setItem(rarityKey, JSON.stringify(loadedProject.rarityRanks));
              
              // IMPORTANT: Also set in project data for immediate availability
              project.rarityRanks = loadedProject.rarityRanks;
              
              const rankCount = Array.isArray(loadedProject.rarityRanks) 
                ? loadedProject.rarityRanks.length 
                : Object.keys(loadedProject.rarityRanks).length;
              console.log(`Restored ${rankCount} rarity ranks from project file`);
              console.log(`Rarity ranks set in both localStorage and project data`);
            } catch (e) { 
              console.warn('Could not restore rarity ranks from project', e); 
            }
          } else {
            console.log('No rarity ranks found in project file');
          }

          // Restore Dark NFTs configuration if it exists
          if (loadedProject.darkTraitsConfig) {
            try {
              // Set in project data
              project.darkTraitsConfig = {
                selectedTraits: new Set(loadedProject.darkTraitsConfig.selectedTraits || []),
                customConfig: loadedProject.darkTraitsConfig.customConfig || false
              };
              
              // Also update the generateNftsUI module
              const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
              if (generateNftsUI) {
                generateNftsUI.darkTraitsConfig = {
                  selectedTraits: new Set(loadedProject.darkTraitsConfig.selectedTraits || []),
                  customConfig: loadedProject.darkTraitsConfig.customConfig || false
                };
                console.log('Restored Dark NFTs configuration to generateNftsUI module');
              }
              
              console.log(`Restored Dark NFTs configuration: ${project.darkTraitsConfig.selectedTraits.size} selected traits`);
            } catch (e) {
              console.warn('Could not restore Dark NFTs configuration:', e);
            }
          } else {
            console.log('No Dark NFTs configuration found in project file');
          }

            // Update all counters after loading the project (debounced)
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
              // Update the module's projectData
              window.NFTApp.getModule('generateNftsUI').projectData = project;
              
              // Debounce counter updates to avoid multiple rapid calls
              clearTimeout(this._counterUpdateTimeout);
              this._counterUpdateTimeout = setTimeout(() => {
                // Use unified counter update system
                if (window.updateAllCounters) {
                  window.updateAllCounters();
                  console.log('All counters updated after project load');
                } else {
                  // Fallback to individual updates if unified system not available
                  if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
                    window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(false);
                    console.log('Seed counter updated after project load (fallback)');
                  }
                  
                  if (window.updateNftCountPanel) {
                    window.updateNftCountPanel();
                    console.log('NFT count panel updated after project load (fallback)');
                  }
                }
                
                // CRITICAL: Refresh saved-seeds-modal to load updated seeds from localStorage
                const savedSeedsModal = document.querySelector('#saved-seeds-modal')?.savedSeedsModalInstance;
                if (savedSeedsModal && typeof savedSeedsModal.forceRefreshModalData === 'function') {
                  savedSeedsModal.forceRefreshModalData();
                  console.log('Saved seeds modal refreshed after project load');
                }
              }, 500); // Increased debounce time
            }
        } catch (error) {
          console.error("Error parsing project file:", error);
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack
          });
          
          this.hideLoadingAnimation();
          this.isLoading = false; // Reset loading flag on error
          
          let errorMessage = "Error loading project: ";
          if (error.message.includes('JSON')) {
            errorMessage += "Invalid JSON format";
          } else if (error.message.includes('Empty')) {
            errorMessage += "File is empty";
          } else if (error.message.includes('Invalid project')) {
            errorMessage += "Not a valid project file";
          } else {
            errorMessage += error.message || "Unknown error";
          }
          
          if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(errorMessage, "error");
          }
          
          // Reset the file input
          if (event && event.target) {
            event.target.value = "";
          }
        }
      }

      reader.readAsText(file)
    },

    save: function(forceNewFile = false) {
      console.log("Saving project", forceNewFile ? "as new file" : "with existing handle if available")

      if (!window.currentProject) {
        console.warn("No project to save")
        return
      }

      // Show loading animation immediately
      this.showLoadingAnimation("Preparing to save project...", true);

      // Set the saving flag to prevent duplicate save operations
      this.isSaving = true;

      // Use setTimeout to allow the browser to render the loading animation before processing
      setTimeout(async () => {
        // Store the current active tab
        const currentTab = document.querySelector('.nav-tab.active')?.dataset.tab

        // Ensure all data is up to date before saving
      if (window.NFTApp && window.NFTApp.getModule) {
        // Update general info
        if (window.NFTApp.getModule("generalInfo")) {
          // Get the current collection name from the input field
          const collectionNameInput = document.getElementById("collection-name")
          if (collectionNameInput) {
            window.currentProject.name = collectionNameInput.value.trim()
          }
          window.NFTApp.getModule("generalInfo").saveGeneralInfo(window.currentProject)
        }

        // Update trait layers
        if (window.NFTApp.getModule("traitLayers")) {
          // Any pending trait layer updates would be saved here
        }

        // Update combination rules
        if (window.NFTApp.getModule("combinationRules")) {
          // Any pending rule updates would be saved here
        }
      }

      // CRITICAL: Sync MemoryManager before saving
      if (window.MemoryManager) {
        try {
          console.log("[DEBUG] Syncing MemoryManager before project save");
          await window.MemoryManager.syncToLocalStorage();
          console.log("[DEBUG] MemoryManager synced successfully");
        } catch (error) {
          console.error("[DEBUG] Error syncing MemoryManager:", error);
          // Continue with save even if MemoryManager sync fails
        }
      }

      // Remove seedAlgorithm before saving
      const projectToSave = { ...window.currentProject };
      delete projectToSave.seedAlgorithm;

      // Helper to get project-specific seed list key
      function getSeedListKey(project) {
        return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
      }

      const seedListKeySave = getSeedListKey(window.currentProject);
      try {
        // CRITICAL: Always use localStorage as primary source for project saving
        // This ensures we get the most up-to-date data after NFT edits
        let savedSeeds = [];
        const localStorageSeeds = JSON.parse(localStorage.getItem(seedListKeySave) || '[]');
        
        if (localStorageSeeds.length > 0) {
          savedSeeds = localStorageSeeds;
          console.log('Using localStorage as primary source for saved seeds:', savedSeeds.length, 'seeds');
        } else if (window.MemoryManager && window.MemoryManager.state.currentProject.savedSeeds && window.MemoryManager.state.currentProject.savedSeeds.length > 0) {
          savedSeeds = window.MemoryManager.state.currentProject.savedSeeds;
          console.log('localStorage empty, falling back to MemoryManager:', savedSeeds.length, 'seeds');
        } else if (window.currentProject.savedSeeds && window.currentProject.savedSeeds.length > 0) {
          savedSeeds = window.currentProject.savedSeeds;
          console.log('MemoryManager empty, falling back to project data:', savedSeeds.length, 'seeds');
        } else {
          savedSeeds = [];
          console.log('All sources empty, using empty array');
        }
        
        console.log('========== SAVING PROJECT ==========');
        console.log('Found', savedSeeds.length, 'seeds in localStorage');
        
        // Optimize saved seeds for project file (remove NFT image data but keep trait imageData)
        const optimizedSeeds = savedSeeds.map(seed => {
          
          const optimizedSeed = {
            seed: seed.seed,
            traits: (seed.traits || []).map(trait => ({
              // Keep essential trait data including imageData for trait thumbnails
              layerId: trait.layerId,
              traitId: trait.traitId,
              layerName: trait.layerName,
              traitName: trait.traitName,
              // PRESERVE: imageData for trait thumbnails (essential for UI)
              imageData: trait.imageData
            })),
            rarity: seed.rarity,
            rarityScore: seed.rarityScore || 0,
            timestamp: seed.timestamp
            // NFT imageData and thumbnail are omitted to save space - will be rendered in real-time
          };
          
          // Attach rarityScore from localStorage if not already present
          if (!optimizedSeed.rarityScore) {
            const rarityScore = localStorage.getItem('nftScore_' + seed.seed);
          if (rarityScore !== null) {
              optimizedSeed.rarityScore = Number(rarityScore);
            }
          }
          
          return optimizedSeed;
        });
        
        projectToSave.savedSeeds = optimizedSeeds;
        console.log('Saved', optimizedSeeds.length, 'NFTs to project file (optimized format - no image data)');
        
        // Check if any saved seeds still have imageData (should be 0)
        let seedsWithImages = 0;
        let seedsWithThumbnails = 0;
        let totalSeedsImageDataSize = 0;
        optimizedSeeds.forEach(seed => {
          if (seed.imageData) {
            seedsWithImages++;
            totalSeedsImageDataSize += seed.imageData.length;
          }
          if (seed.thumbnail) {
            seedsWithThumbnails++;
            totalSeedsImageDataSize += seed.thumbnail.length;
          }
        });
        console.log(`SavedSeeds with image data: ${seedsWithImages} (should be 0)`);
        console.log(`SavedSeeds with thumbnails: ${seedsWithThumbnails} (should be 0)`);
        if (totalSeedsImageDataSize > 0) {
          console.log(`Total image data size in savedSeeds: ${(totalSeedsImageDataSize / 1024 / 1024).toFixed(2)} MB`);
        }
        
        // Calculate the size of the optimized seeds
        const optimizedSize = JSON.stringify(optimizedSeeds).length;
        console.log('Optimized seeds size:', (optimizedSize / 1024 / 1024).toFixed(2), 'MB');
        
        // Calculate the size of the entire project AFTER all optimizations
        const finalProjectSize = JSON.stringify(projectToSave).length;
        console.log('FINAL project size (includes imageData for local development):', (finalProjectSize / 1024 / 1024).toFixed(2), 'MB'); // Fixed projectSize reference
        
        // Additional analysis - check for any large properties we might have missed
        console.log('=== COMPREHENSIVE SIZE ANALYSIS ===');
        const allKeys = Object.keys(projectToSave);
        allKeys.forEach(key => {
          const value = projectToSave[key];
          const size = JSON.stringify(value).length;
          if (size > 1024 * 1024) { // Only show properties larger than 1MB
            console.log(`- ${key}: ${(size / 1024 / 1024).toFixed(2)} MB`);
          }
        });
        
        // Check for trait duplication across different sections
        console.log('=== TRAIT DUPLICATION ANALYSIS ===');
        
        // 1. Check main traits
        const mainTraitsSize = JSON.stringify(projectToSave.traits || []).length;
        console.log(`Main traits size: ${(mainTraitsSize / 1024 / 1024).toFixed(2)} MB`);
        
        // 2. Check if savedSeeds contain trait data
        let seedsTraitsSize = 0;
        let seedsWithTraits = 0;
        if (projectToSave.savedSeeds) {
          projectToSave.savedSeeds.forEach(seed => {
            if (seed.traits && seed.traits.length > 0) {
              seedsWithTraits++;
              seedsTraitsSize += JSON.stringify(seed.traits).length;
            }
          });
        }
        console.log(`SavedSeeds with traits: ${seedsWithTraits}`);
        console.log(`SavedSeeds traits total size: ${(seedsTraitsSize / 1024 / 1024).toFixed(2)} MB`);
        
        // 3. Check if rarityRanks contain trait data
        let rarityTraitsSize = 0;
        let rarityWithTraits = 0;
        if (projectToSave.rarityRanks) {
          Object.values(projectToSave.rarityRanks).forEach(rank => {
            if (rank && rank.traits && rank.traits.length > 0) {
              rarityWithTraits++;
              rarityTraitsSize += JSON.stringify(rank.traits).length;
            }
          });
        }
        console.log(`RarityRanks with traits: ${rarityWithTraits}`);
        console.log(`RarityRanks traits total size: ${(rarityTraitsSize / 1024 / 1024).toFixed(2)} MB`);
        
        // 4. Calculate total trait data size
        const totalTraitDataSize = mainTraitsSize + seedsTraitsSize + rarityTraitsSize;
        console.log(`TOTAL trait data size: ${(totalTraitDataSize / 1024 / 1024).toFixed(2)} MB`);
        
        if (totalTraitDataSize > mainTraitsSize * 1.1) { // More than 10% overhead
          console.log('⚠️  WARNING: Potential trait duplication detected!');
          console.log('Traits appear to be saved in multiple locations.');
        } else {
          console.log('✅ No significant trait duplication detected.');
        }
        
        // Check what's taking up space in the project
        console.log('Project components analysis:');
        console.log('- savedSeeds size:', (optimizedSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('- traits count:', projectToSave.traits?.length || 0);
        console.log('- rules count:', projectToSave.rules?.length || 0);
        console.log('- rarityRanks count:', projectToSave.rarityRanks ? Object.keys(projectToSave.rarityRanks).length : 0);
        
        // Detailed size breakdown
        const savedSeedsSize = JSON.stringify(projectToSave.savedSeeds || []).length;
        const traitsSizeAfter = JSON.stringify(projectToSave.traits || []).length;
        const rulesSize = JSON.stringify(projectToSave.rules || []).length;
        const rarityRanksSize = JSON.stringify(projectToSave.rarityRanks || {}).length;
        const darkTraitsConfigSize = JSON.stringify(projectToSave.darkTraitsConfig || {}).length;
        const otherDataSize = finalProjectSize - savedSeedsSize - traitsSizeAfter - rulesSize - rarityRanksSize - darkTraitsConfigSize;
        
        console.log('Detailed size breakdown:');
        console.log('- savedSeeds:', (savedSeedsSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('- traits:', (traitsSizeAfter / 1024 / 1024).toFixed(2), 'MB');
        console.log('- rules:', (rulesSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('- rarityRanks:', (rarityRanksSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('- darkTraitsConfig:', (darkTraitsConfigSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('- other data:', (otherDataSize / 1024 / 1024).toFixed(2), 'MB');
        
        // Check if traits contain large image data and optimize them
        let traitsSize = 0;
        if (projectToSave.traits && projectToSave.traits.length > 0) {
          traitsSize = JSON.stringify(projectToSave.traits).length;
          console.log('- traits size:', (traitsSize / 1024 / 1024).toFixed(2), 'MB');
          
          // Check first trait for image data
          const firstTrait = projectToSave.traits[0];
          if (firstTrait && firstTrait.traits && firstTrait.traits.length > 0) {
            const firstTraitItem = firstTrait.traits[0];
            console.log('- first trait item has imageData:', !!firstTraitItem?.imageData);
            if (firstTraitItem?.imageData) {
              console.log('- first trait item imageData size:', (firstTraitItem.imageData.length / 1024 / 1024).toFixed(2), 'MB');
            }
          }
          
          // Optimize traits by removing image data but keeping file paths
          console.log('Optimizing traits - removing image data but keeping file paths');
          
          const optimizedTraits = projectToSave.traits.map(layer => {
            const optimizedLayer = {
              id: layer.id,
              name: layer.name,
              order: layer.order,
              rarity: layer.rarity,  // NEW: Include layer rarity
              traits: layer.traits ? layer.traits.map(trait => {
                const optimizedTrait = {
                  id: trait.id,
                  name: trait.name,
                  rarity: trait.rarity,
                  order: trait.order
                };
                
                // Keep file path if it exists
                if (trait.filePath) {
                  optimizedTrait.filePath = trait.filePath;
                }
                
                // Keep fileName if it exists (for local files)
                if (trait.fileName) {
                  optimizedTrait.fileName = trait.fileName;
                }
                
                // Keep file metadata for reference
                if (trait.fileSize) {
                  optimizedTrait.fileSize = trait.fileSize;
                }
                if (trait.fileType) {
                  optimizedTrait.fileType = trait.fileType;
                }
                if (trait.lastModified) {
                  optimizedTrait.lastModified = trait.lastModified;
                }
                
                // CRITICAL: Keep imageData for local development
                // Only remove imageData if we have a valid web URL filePath
                if (trait.imageData && trait.filePath && trait.filePath.startsWith('http')) {
                  // Only remove imageData if we have a valid web URL
                  console.log('Removing imageData (has web URL):', trait.name);
                } else if (trait.imageData) {
                  // Keep imageData for all other cases (local development)
                  console.log('Keeping imageData for local development:', trait.name);
                  optimizedTrait.imageData = trait.imageData;
                }
                
                return optimizedTrait;
              }) : []
            };
            
            return optimizedLayer;
          });
          
          projectToSave.traits = optimizedTraits;
          
        // Calculate new traits size
        const optimizedTraitsSize = JSON.stringify(optimizedTraits).length;
        console.log('Optimized traits size:', (optimizedTraitsSize / 1024 / 1024).toFixed(2), 'MB');
        console.log('Space saved in traits:', ((traitsSize - optimizedTraitsSize) / 1024 / 1024).toFixed(2), 'MB');
        
        // Check if traits have imageData and count them
        let traitsWithImages = 0;
        let totalTraitsImageDataSize = 0;
        optimizedTraits.forEach(layer => {
          if (layer.traits) {
            layer.traits.forEach(trait => {
              if (trait.imageData) {
                traitsWithImages++;
                totalTraitsImageDataSize += trait.imageData.length;
              }
            });
          }
        });
        console.log(`Traits with image data: ${traitsWithImages}`);
        if (totalTraitsImageDataSize > 0) {
          console.log(`Total image data size in traits: ${(totalTraitsImageDataSize / 1024 / 1024).toFixed(2)} MB`);
        }
        }
        
      } catch (e) {
        console.error('Error saving seeds:', e);
        projectToSave.savedSeeds = [];
      }

      // Save rarity ranks if they exist - prioritize in-memory data over localStorage
      try {
        // First check if rarity ranks exist in the current project (in-memory)
        if (window.currentProject.rarityRanks && typeof window.currentProject.rarityRanks === 'object') {
          // Optimize rarity ranks by removing imageData to reduce file size
          const optimizedRarityRanks = {};
          for (const [key, value] of Object.entries(window.currentProject.rarityRanks)) {
            if (value && typeof value === 'object') {
              // Keep only essential data, remove imageData and optimize traits
              optimizedRarityRanks[key] = {
                seed: value.seed,
                traits: (value.traits || []).map(trait => ({
                  // Only keep essential trait data, remove any imageData or large objects
                  layerId: trait.layerId,
                  traitId: trait.traitId,
                  layerName: trait.layerName,
                  traitName: trait.traitName
                  // REMOVED: any imageData, filePath, or other large data from traits
                })),
                rarity: value.rarity,
                rarityScore: value.rarityScore,
                timestamp: value.timestamp
                // REMOVED: imageData - this was causing massive file size increase
              };
            } else {
              // Keep simple values as-is
              optimizedRarityRanks[key] = value;
            }
          }
          projectToSave.rarityRanks = optimizedRarityRanks;
          const rankCount = Object.keys(projectToSave.rarityRanks).length;
          console.log(`Saved ${rankCount} rarity ranks from project data to project file (optimized - no image data)`);
          
          // Check if any rarity ranks still have imageData (should be 0)
          let rarityRanksWithImages = 0;
          let totalImageDataSize = 0;
          for (const [key, value] of Object.entries(projectToSave.rarityRanks)) {
            if (value && typeof value === 'object' && value.imageData) {
              rarityRanksWithImages++;
              totalImageDataSize += value.imageData.length;
            }
          }
          console.log(`RarityRanks with image data: ${rarityRanksWithImages} (should be 0)`);
          if (totalImageDataSize > 0) {
            console.log(`Total image data size in rarityRanks: ${(totalImageDataSize / 1024 / 1024).toFixed(2)} MB`);
          }
        } else {
          // Fallback to localStorage if not in project data
          const rarityKey = 'rarityRanks_' + encodeURIComponent(window.currentProject.name);
          const rarityRanks = localStorage.getItem(rarityKey);
          if (rarityRanks) {
            const parsedRanks = JSON.parse(rarityRanks);
            // Optimize rarity ranks by removing imageData
            const optimizedRarityRanks = {};
            for (const [key, value] of Object.entries(parsedRanks)) {
              if (value && typeof value === 'object') {
                // Keep only essential data, remove imageData and optimize traits
                optimizedRarityRanks[key] = {
                  seed: value.seed,
                  traits: (value.traits || []).map(trait => ({
                    // Only keep essential trait data, remove any imageData or large objects
                    layerId: trait.layerId,
                    traitId: trait.traitId,
                    layerName: trait.layerName,
                    traitName: trait.traitName
                    // REMOVED: any imageData, filePath, or other large data from traits
                  })),
                  rarity: value.rarity,
                  rarityScore: value.rarityScore,
                  timestamp: value.timestamp
                  // REMOVED: imageData - this was causing massive file size increase
                };
              } else {
                // Keep simple values as-is
                optimizedRarityRanks[key] = value;
              }
            }
            projectToSave.rarityRanks = optimizedRarityRanks;
            const rankCount = Object.keys(projectToSave.rarityRanks).length;
            console.log(`Saved ${rankCount} rarity ranks from localStorage to project file (optimized - no image data)`);
            
            // Check if any rarity ranks still have imageData (should be 0)
            let rarityRanksWithImages = 0;
            let totalImageDataSize = 0;
            for (const [key, value] of Object.entries(projectToSave.rarityRanks)) {
              if (value && typeof value === 'object' && value.imageData) {
                rarityRanksWithImages++;
                totalImageDataSize += value.imageData.length;
              }
            }
            console.log(`RarityRanks with image data: ${rarityRanksWithImages} (should be 0)`);
            if (totalImageDataSize > 0) {
              console.log(`Total image data size in rarityRanks: ${(totalImageDataSize / 1024 / 1024).toFixed(2)} MB`);
            }
          } else {
            console.log('No rarity ranks found to save');
          }
        }
      } catch (e) {
        console.warn('Could not save rarity ranks to project:', e);
      }

      // Persist export metadata/batch configuration
      try {
        // Ensure current in-memory UI state is synced to project before saving
        if (!Array.isArray(projectToSave.batches) && window.currentProject && Array.isArray(window.currentProject.batches)) {
          projectToSave.batches = window.currentProject.batches;
        }
        projectToSave.selectedBatches = Array.isArray(window.currentProject.selectedBatches) ? window.currentProject.selectedBatches : [];
        projectToSave.selectedBlockchains = Array.isArray(window.currentProject.selectedBlockchains) ? window.currentProject.selectedBlockchains : [];
        projectToSave.blockchainPerNft = (window.currentProject.blockchainPerNft && typeof window.currentProject.blockchainPerNft === 'object') ? window.currentProject.blockchainPerNft : {};
        
        // Save Dark NFTs configuration (only IDs, not full trait data)
        if (window.currentProject.darkTraitsConfig) {
          projectToSave.darkTraitsConfig = {
            selectedTraits: Array.from(window.currentProject.darkTraitsConfig.selectedTraits || []),
            customConfig: window.currentProject.darkTraitsConfig.customConfig || false
          };
          console.log('Saved Dark NFTs configuration:', projectToSave.darkTraitsConfig.selectedTraits.length, 'selected traits');
        } else {
          // Try to get from generateNftsUI module
          const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
          if (generateNftsUI?.darkTraitsConfig) {
            projectToSave.darkTraitsConfig = {
              selectedTraits: Array.from(generateNftsUI.darkTraitsConfig.selectedTraits || []),
              customConfig: generateNftsUI.darkTraitsConfig.customConfig || false
            };
            console.log('Saved Dark NFTs configuration from module:', projectToSave.darkTraitsConfig.selectedTraits.length, 'selected traits');
          }
        }
      } catch (e) { 
        console.warn('Could not save Dark NFTs configuration:', e);
      }

      // Add the last generated NFT seed to the project (for preview restoration)
      try {
        if (window.lastGeneratedNFT && window.lastGeneratedNFT.seed) {
          // Create a lightweight version of the last generated NFT for preview restoration
          projectToSave.lastGeneratedNFT = {
            seed: window.lastGeneratedNFT.seed,
            traits: window.lastGeneratedNFT.traits || {},
            rarity: window.lastGeneratedNFT.rarity || 'Unknown',
            rarityScore: window.lastGeneratedNFT.rarityScore || 0,
            timestamp: window.lastGeneratedNFT.timestamp || Date.now()
            // Note: We don't include imageData to keep the project file size small
            // The image will be regenerated when the project is loaded
          };
          console.log('Added last generated NFT seed to project:', projectToSave.lastGeneratedNFT.seed);
        } else {
          console.log('No last generated NFT found to save with project');
        }
      } catch (e) {
        console.warn('Could not save last generated NFT to project:', e);
      }

      // Convert the project to JSON
      const projectJson = JSON.stringify(projectToSave, null, 2)
      
      // Create a Blob with the project data
      const blob = new Blob([projectJson], { type: 'application/json' })
      const suggestedFileName = window.currentProject.name + '.json';

      // Check if we're in a modern browser that supports the File System Access API
      if (window.showSaveFilePicker) {
        console.log("Using modern File System Access API for saving");
        
        // Use immediately invoked async function
        (async () => {
          try {
            let fileHandle;
            
            // If we should force a new file or don't have a cached handle, show the file picker
            if (forceNewFile || !this.lastFileHandle) {
              // Set up options for the file picker
              const options = {
                suggestedName: suggestedFileName,
                types: [{
                  description: 'JSON Files',
                  accept: {'application/json': ['.json']}
                }]
              };
              
              // If we have a last used directory, try to use it (if supported)
              if (this.lastProjectDir) {
                options.startIn = this.lastProjectDir;
              }
              
              // Show the file picker dialog
              fileHandle = await window.showSaveFilePicker(options);
              // Cache the file handle for future saves
              this.lastFileHandle = fileHandle;
              // Save handle info in localStorage if possible
              try {
                if (window.localStorage && fileHandle && fileHandle.name) {
                  window.localStorage.setItem('nftcc_lastProjectPath', fileHandle.name);
                }
                // Also store the handle in localStorage if possible (for browsers that support serialization)
                if (window.localStorage && fileHandle && fileHandle instanceof Object) {
                  window.localStorage.setItem('nftcc_lastProjectHandle', JSON.stringify({ name: fileHandle.name }));
                }
                // Save the directory if available (File System Access API may provide a directory handle)
                if (window.localStorage && fileHandle && fileHandle.getFile) {
                  const file = await fileHandle.getFile();
                  if (file && file.name) {
                    // Try to extract directory from file handle (best effort)
                    if (file.webkitRelativePath) {
                      const dir = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
                      window.localStorage.setItem('nftcc_lastProjectDir', dir);
                      this.lastProjectDir = dir;
                    } else if (file.path) {
                      const path = file.path;
                      const sep = path.includes('/') ? '/' : '\\';
                      const dir = path.substring(0, path.lastIndexOf(sep));
                      window.localStorage.setItem('nftcc_lastProjectDir', dir);
                      this.lastProjectDir = dir;
                    }
                  }
                }
              } catch (e) { console.warn('Could not save last project path/dir', e); }
            } else {
              // Use the existing handle (overwrite the file)
              fileHandle = this.lastFileHandle;
            }

            // Show loading animation now that user has selected a location
            this.showLoadingAnimation("Saving project...");
            
            // Get a writable stream and write the blob to it
            if (typeof fileHandle.createWritable === 'function') {
              const writableStream = await fileHandle.createWritable();
              await writableStream.write(blob);
              await writableStream.close();
            } else {
              // Fallback: If createWritable is not available, use download fallback
              console.warn('File System Access API: createWritable not available, using fallback download.');
              this.fallbackToDownload(blob, suggestedFileName, null, currentTab);
              this.hideLoadingAnimation();
              return;
            }
            
            // Hide loading animation
            this.hideLoadingAnimation();
            
            // Show success notification
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
              window.NFTApp.getModule("notificationService").show("Project saved successfully", "success");
            }
            
            // Restore the active tab
            if (currentTab && window.NFTApp.getModule("navigation")) {
              window.NFTApp.getModule("navigation").showTab(currentTab);
            }
            // Always record the last file handle and directory after a successful save
            this.lastFileHandle = fileHandle;
            try {
              if (window.localStorage && fileHandle && fileHandle.name) {
                window.localStorage.setItem('nftcc_lastProjectPath', fileHandle.name);
              }
              if (window.localStorage && fileHandle && fileHandle instanceof Object) {
                window.localStorage.setItem('nftcc_lastProjectHandle', JSON.stringify({ name: fileHandle.name }));
              }
              // Save the directory if available (File System Access API may provide a directory handle)
              if (window.localStorage && fileHandle && fileHandle.getFile) {
                const file = await fileHandle.getFile();
                if (file && file.name) {
                  // Try to extract directory from file handle (best effort)
                  if (file.webkitRelativePath) {
                    const dir = file.webkitRelativePath.substring(0, file.webkitRelativePath.lastIndexOf('/'));
                    window.localStorage.setItem('nftcc_lastProjectDir', dir);
                    this.lastProjectDir = dir;
                  } else if (file.path) {
                    const path = file.path;
                    const sep = path.includes('/') ? '/' : '\\';
                    const dir = path.substring(0, path.lastIndexOf(sep));
                    window.localStorage.setItem('nftcc_lastProjectDir', dir);
                    this.lastProjectDir = dir;
                  }
                }
              }
            } catch (e) { console.warn('Could not save last project path/dir', e); }
          } catch (error) {
            if (error.name === 'AbortError') {
              // User cancelled the save dialog: not an error, just exit silently
              this.hideLoadingAnimation();
              // Optionally: console.log("Save operation cancelled by user");
            } else {
              console.error("Error using File System Access API:", error);
              // Check if permission denied - may happen with cached handles 
              if (error.name === 'SecurityError' || error.name === 'NotAllowedError') {
                console.log("Permission issue with stored handle, trying with new picker...");
                // Clear the cached handle and try again without it
                this.lastFileHandle = null;
                this.isSaving = false;
                this.save(true); // Force new picker
                return;
              }
              // Fall back to traditional download if there was an unexpected error
              this.fallbackToDownload(blob, suggestedFileName, null, currentTab);
            }
          } finally {
            // Reset the saving flag
            this.isSaving = false;
          }
        })();
        return;
      }
      
      // For older browsers or if File System Access API failed, use the file input approach
      // Create a hidden file input element
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.style.display = 'none'
      fileInput.accept = '.json'
      
      // Important: Allow selecting existing files for overwriting
      // Use proper NW.js attributes for saving
      try {
        // Check if we're in NW.js environment
        if (typeof window.nw !== 'undefined' || typeof window.require === 'function') {
          // Set working directory if available
          let workingDir = '';
          if (this.lastProjectDir) {
            workingDir = this.lastProjectDir;
          } else if (typeof process !== 'undefined' && process.cwd) {
            workingDir = process.cwd();
          }
          if (workingDir) {
            fileInput.setAttribute('nwworkingdir', workingDir);
          }
          
          // The nwsaveas attribute is used to set the default filename in the save dialog
          fileInput.setAttribute('nwsaveas', suggestedFileName);
        }
      } catch (e) {
        console.warn("Error setting up NW.js file input attributes:", e);
      }

      // Handle the file input change event
      fileInput.addEventListener('change', (event) => {
        if (event.target.files.length > 0) {
          // Show loading animation only after user has selected a location
          this.showLoadingAnimation("Saving project...")
          
          const file = event.target.files[0]
          const fileName = file.name
          
          // Save file path and directory for future saves
          try {
            if (window.localStorage && file.path) {
              window.localStorage.setItem('nftcc_lastProjectPath', file.path);
              this.lastFileHandle = file.path;
              // Save the directory as well
              let dir = '';
              if (file.path) {
                const sep = file.path.includes('/') ? '/' : '\\';
                dir = file.path.substring(0, file.path.lastIndexOf(sep));
              }
              if (dir) {
                window.localStorage.setItem('nftcc_lastProjectDir', dir);
                this.lastProjectDir = dir;
              }
            }
            // Also store the file name in localStorage for fallback
            if (window.localStorage && fileName) {
              window.localStorage.setItem('nftcc_lastProjectFileName', fileName);
            }
          } catch (e) { console.warn('Could not save last project path/dir', e); }
          
          // Check if we're running in a browser or desktop app environment
          if (typeof window.require === 'function') {
            // We're in an Electron or NW.js environment - use Node.js file system
            try {
              const fs = window.require('fs')
              const path = window.require('path')
              const filePath = file.path || fileName
              
              // Use fs.promises for better error handling if available
              if (fs.promises) {
                // Modern async/await approach
                (async () => {
                  try {
                    // Check if file exists
                    try {
                      await fs.promises.access(filePath, fs.constants.F_OK)
                      console.log(`File ${filePath} exists, will be overwritten.`)
                    } catch (err) {
                      // File doesn't exist, which is fine
                      console.log(`Creating new file: ${filePath}`)
                    }
                    
                    // Write to file - will automatically overwrite
                    await fs.promises.writeFile(filePath, projectJson, 'utf8')
                    
                    this.hideLoadingAnimation()
                    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                      window.NFTApp.getModule("notificationService").show("Project saved successfully", "success")
                    }
                    
                    // Restore the active tab
                    if (currentTab && window.NFTApp.getModule("navigation")) {
                      window.NFTApp.getModule("navigation").showTab(currentTab)
                    }
                  } catch (err) {
                    console.error("Error saving file:", err)
                    this.hideLoadingAnimation()
                    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                      window.NFTApp.getModule("notificationService").show("Error saving project: " + (err.message || "Unknown error"), "error")
                    }
                  } finally {
                    // Clean up
                    document.body.removeChild(fileInput)
                    // Reset the saving flag
                    this.isSaving = false;
                  }
                })()
              } else {
                // Fallback to callback API
                // Check if file exists before writing (not necessary but adds clarity)
                fs.access(filePath, fs.constants.F_OK, (err) => {
                  if (!err) {
                    console.log(`File ${filePath} exists, will be overwritten.`)
                  }
                  
                  // Write directly to the selected file - will overwrite existing
                  fs.writeFile(filePath, projectJson, 'utf8', (err) => {
                    if (err) {
                      console.error("Error saving file:", err)
                      this.hideLoadingAnimation()
                      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                        window.NFTApp.getModule("notificationService").show("Error saving project: " + err.message, "error")
                      }
                    } else {
                      this.hideLoadingAnimation()
                      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                        window.NFTApp.getModule("notificationService").show("Project saved successfully", "success")
                      }
                  
                      // Restore the active tab
                      if (currentTab && window.NFTApp.getModule("navigation")) {
                        window.NFTApp.getModule("navigation").showTab(currentTab)
                      }
                    }
                
                    // Clean up
                    document.body.removeChild(fileInput)
                    // Reset the saving flag
                    this.isSaving = false;
                  })
                })
              }
            } catch (error) {
              console.error("Error with Node.js file system:", error)
              this.fallbackToDownload(blob, fileName, fileInput, currentTab)
              // Reset the saving flag in case of error
              this.isSaving = false;
            }
          } else {
            // Use the download fallback for non-File System Access API browsers
            this.fallbackToDownload(blob, fileName, fileInput, currentTab);
          }
        } else {
          // User cancelled the save dialog
          document.body.removeChild(fileInput)
          // Reset the saving flag when user cancels
          this.isSaving = false;
        }
      })
      
      // Add the file input to the document and trigger it immediately
      document.body.appendChild(fileInput)
      fileInput.click()
      }, 0); // End setTimeout - allows UI to update before processing
    },

    // Fallback method for browser environments
    fallbackToDownload: function(blob, fileName, fileInput, currentTab) {
      console.log("Using download fallback for saving");
      
      // Create a download link
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(blob);
      downloadLink.download = fileName;
      
      // Trigger the download (traditional method)
      document.body.appendChild(downloadLink);
      downloadLink.click();
      
      // Clean up
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(downloadLink.href);
      if (fileInput && fileInput.parentNode) {
        document.body.removeChild(fileInput);
      }
      
      // Hide loading animation
      this.hideLoadingAnimation();
      
      // Show success notification
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Project saved successfully", "success");
      }
      
      // Restore the active tab
      if (currentTab && window.NFTApp.getModule("navigation")) {
        window.NFTApp.getModule("navigation").showTab(currentTab);
      }
      
      // Reset the saving flag
      this.isSaving = false;
    },
    
    showLoadingAnimation: function(message = "Loading...", transparent = false) {
      // Create loading overlay if it doesn't exist
      let loadingOverlay = document.getElementById("loading-overlay")
      
      if (!loadingOverlay) {
        loadingOverlay = document.createElement("div")
        loadingOverlay.id = "loading-overlay"
        loadingOverlay.className = transparent ? "loading-overlay transparent" : "loading-overlay"
        loadingOverlay.innerHTML = `
          <div class="loading-content">
            <div class="spinner-wrapper">
              <svg class="spinner" viewBox="0 0 50 50">
                <circle class="path" cx="25" cy="25" r="20" fill="none" stroke-width="5"></circle>
              </svg>
            </div>
            <div class="loading-text">${message}</div>
          </div>
        `
        document.body.appendChild(loadingOverlay)
      } else {
        // Update the message if the overlay already exists
        const loadingText = loadingOverlay.querySelector('.loading-text')
        if (loadingText) {
          loadingText.textContent = message
        }
        
        // Update transparency class based on message
        if (transparent) {
          loadingOverlay.classList.add("transparent")
        } else {
          loadingOverlay.classList.remove("transparent")
        }
      }

      // Show the loading overlay
      loadingOverlay.style.display = "flex"
    },

    hideLoadingAnimation: function() {
      const loadingOverlay = document.getElementById("loading-overlay")
      if (loadingOverlay) {
        loadingOverlay.style.display = "none"
      }
    },

    // Load trait images from file paths
    loadTraitImagesFromPaths: async function(traits) {
      console.log('Starting to load trait images from file paths...');
      
      let loadedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const missingTraits = [];
      
        for (const layer of traits) {
          if (layer.traits && layer.traits.length > 0) {
            for (const trait of layer.traits) {
              // Check if trait has filePath
              // Priority 1: Check if it's a local file path (filename only)
              const isLocalFile = trait.filePath && 
                                !trait.filePath.startsWith('http') && 
                                !trait.filePath.startsWith('https') && 
                                !trait.filePath.includes('/') && 
                                !trait.filePath.includes('\\') &&
                                (trait.filePath.includes('.png') || trait.filePath.includes('.jpg') || trait.filePath.includes('.jpeg'));
              
              if (trait.filePath && !isLocalFile) {
                // Only try to load from file path if it's NOT a local filename
                try {
                  // Load from file path
                  
                  // Try to fetch the file (for web URLs or full paths)
                  const response = await fetch(trait.filePath);
                  if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    
                    reader.onload = () => {
                      trait.imageData = reader.result;
                      loadedCount++;
                      // Successfully loaded from file path
                    };
                    
                    reader.onerror = () => {
                      console.warn('Could not read file from path:', trait.filePath);
                      errorCount++;
                      missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                    };
                    
                    reader.readAsDataURL(blob);
                  } else {
                    console.warn('Could not fetch file from path:', trait.filePath, 'Status:', response.status);
                    errorCount++;
                    missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                  }
                } catch (error) {
                  console.warn('Loading from file path failed:', trait.filePath, error);
                  errorCount++;
                  missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                }
              } else if (isLocalFile) {
                // For local filenames, skip trying to load and use existing imageData
                // For local filenames, skip trying to load and use existing imageData
                
                if (trait.imageData) {
                  loadedCount++;
                } else {
                  console.warn('No image data available for local filename:', trait.name);
                  errorCount++;
                  missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                }
              }
              // Priority 2: Use existing imageData as fallback (only if no filePath)
              else if (trait.imageData) {
                // Use existing imageData from project file
                skippedCount++;
              }
              // Priority 3: No path or imageData available
              else {
                console.warn('No data available:', trait.name, '(no filePath or imageData)');
                skippedCount++;
              }
            }
          }
        }
      
      console.log('Trait loading summary:');
      console.log('Loaded from file paths:', loadedCount);
      console.log('Used project file data:', skippedCount);
      console.log('Loading errors:', errorCount);
      console.log('Missing traits:', missingTraits.length);
      
      // If there are missing traits, show recovery dialog (but only if we have significant missing data)
      if (missingTraits.length > 0) {
        const totalTraits = traits.reduce((sum, layer) => sum + (layer.traits ? layer.traits.length : 0), 0);
        const missingPercentage = (missingTraits.length / totalTraits) * 100;
        
        console.log(`Found ${missingTraits.length} missing trait images (${missingPercentage.toFixed(1)}% of total)`);
        
        // Only show recovery dialog if more than 20% of traits are missing
        if (missingPercentage > 20) {
          console.log('High percentage of missing traits, showing recovery dialog');
          await this.showTraitPathRecoveryDialog(traits, missingTraits);
        } else {
          console.log('Low percentage of missing traits, skipping recovery dialog');
        }
      }
    },

    // Show trait path recovery dialog
    showTraitPathRecoveryDialog: async function(traits, missingTraits) {
      return new Promise((resolve) => {
        console.log('[DEBUG] Showing trait path recovery dialog for', missingTraits.length, 'missing traits');
        
        // Analyze missing traits to find the first layer
        const missingLayers = [...new Set(missingTraits.map(t => t.layer))];
        const firstMissingLayer = missingLayers[0];
        const originalPaths = missingTraits.filter(t => t.layer === firstMissingLayer);
        
        console.log('[DEBUG] Missing layers:', missingLayers);
        console.log('[DEBUG] First missing layer:', firstMissingLayer);
        console.log('[DEBUG] Original paths for first layer:', originalPaths.map(t => t.path));
        
        // Create the recovery dialog
        const dialog = document.createElement('div');
        dialog.id = 'trait-path-recovery-dialog';
        dialog.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0, 0, 0, 0.8);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 10000;
          font-family: 'Archivo', sans-serif;
        `;
        
        dialog.innerHTML = `
          <div style="
            background: white;
            border-radius: 12px;
            padding: 30px;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          ">
            <h2 style="
              margin: 0 0 20px 0;
              color: #333;
              font-size: 24px;
              font-weight: 600;
            ">🔍 Trait Images Not Found</h2>
            
            <p style="
              margin: 0 0 20px 0;
              color: #666;
              line-height: 1.5;
            ">
              Some trait images couldn't be loaded because the folders have been moved. 
              Please locate the <strong>${firstMissingLayer}</strong> folder to help us find all your trait layers.
            </p>
            
            <div style="
              background: #f8f9fa;
              border: 1px solid #e9ecef;
              border-radius: 8px;
              padding: 15px;
              margin: 20px 0;
            ">
              <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px;">Missing Layers:</h3>
              <ul style="margin: 0; padding-left: 20px; color: #6c757d;">
                ${missingLayers.map(layer => `<li>${layer}</li>`).join('')}
              </ul>
            </div>
            
            <div style="margin: 20px 0;">
              <label style="
                display: block;
                margin-bottom: 8px;
                color: #333;
                font-weight: 500;
              ">Select the ${firstMissingLayer} folder:</label>
              <input type="file" id="trait-folder-input" webkitdirectory directory multiple style="
                width: 100%;
                padding: 10px;
                border: 2px dashed #007bff;
                border-radius: 8px;
                background: #f8f9ff;
                cursor: pointer;
              " />
              <p style="
                margin: 8px 0 0 0;
                color: #6c757d;
                font-size: 14px;
              ">Select the folder containing your ${firstMissingLayer} trait images</p>
            </div>
            
            <div style="
              display: flex;
              gap: 12px;
              justify-content: flex-end;
              margin-top: 30px;
            ">
              <button id="skip-recovery" style="
                padding: 12px 24px;
                border: 1px solid #6c757d;
                background: white;
                color: #6c757d;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
              ">Skip for Now</button>
              <button id="locate-folder" style="
                padding: 12px 24px;
                border: none;
                background: #007bff;
                color: white;
                border-radius: 6px;
                cursor: pointer;
                font-size: 14px;
                font-weight: 500;
                opacity: 0.5;
              " disabled>Locate Folder</button>
            </div>
          </div>
        `;
        
        document.body.appendChild(dialog);
        
        const folderInput = dialog.querySelector('#trait-folder-input');
        const locateButton = dialog.querySelector('#locate-folder');
        const skipButton = dialog.querySelector('#skip-recovery');
        
        // Enable locate button when folder is selected
        folderInput.addEventListener('change', (e) => {
          if (e.target.files.length > 0) {
            locateButton.disabled = false;
            locateButton.style.opacity = '1';
          }
        });
        
        // Handle folder selection
        locateButton.addEventListener('click', async () => {
          if (folderInput.files.length === 0) return;
          
          const selectedFolder = folderInput.files[0].webkitRelativePath.split('/')[0];
          console.log('[DEBUG] User selected folder:', selectedFolder);
          
          // Extract the base path from the selected folder
          const basePath = folderInput.files[0].webkitRelativePath.split('/').slice(0, -1).join('/');
          const newBasePath = basePath.replace(selectedFolder, '');
          
          console.log('[DEBUG] Detected base path:', newBasePath);
          
          // Auto-discover sibling folders
          const discoveredPaths = await this.autoDiscoverSiblingFolders(traits, missingLayers, newBasePath);
          
          if (discoveredPaths.length > 0) {
            console.log('[DEBUG] Successfully discovered', discoveredPaths.length, 'sibling folders');
            
            // Update trait paths
            await this.updateTraitPaths(traits, discoveredPaths);
            
            // Close dialog and reload images
            document.body.removeChild(dialog);
            await this.loadTraitImagesFromPaths(traits);
            resolve();
          } else {
            alert('Could not find the other trait folders. Please make sure all trait folders are in the same directory.');
          }
        });
        
        // Handle skip
        skipButton.addEventListener('click', () => {
          console.log('[DEBUG] User skipped trait path recovery');
          document.body.removeChild(dialog);
          resolve();
        });
      });
    },

    // Auto-discover sibling folders
    autoDiscoverSiblingFolders: async function(traits, missingLayers, basePath) {
      console.log('[DEBUG] Auto-discovering sibling folders for layers:', missingLayers);
      console.log('[DEBUG] Base path:', basePath);
      
      const discoveredPaths = [];
      
      for (const layer of missingLayers) {
        // Try to find the layer folder
        const layerPath = basePath + '/' + layer;
        console.log('[DEBUG] Looking for layer folder:', layerPath);
        
        try {
          // Test if the folder exists by trying to access it
          const testResponse = await fetch(layerPath + '/test.txt', { method: 'HEAD' });
          if (testResponse.status !== 404) {
            discoveredPaths.push({ layer, path: layerPath });
            console.log('[DEBUG] Found layer folder:', layer, 'at:', layerPath);
          }
        } catch (error) {
          console.log('[DEBUG] Layer folder not found:', layerPath);
        }
      }
      
      return discoveredPaths;
    },

    // Update trait paths after discovery
    updateTraitPaths: async function(traits, discoveredPaths) {
      console.log('[DEBUG] Updating trait paths with discovered paths:', discoveredPaths);
      
      for (const layer of traits) {
        const discoveredPath = discoveredPaths.find(dp => dp.layer === layer.name);
        if (discoveredPath && layer.traits) {
          console.log('[DEBUG] Updating paths for layer:', layer.name, 'to:', discoveredPath.path);
          
          for (const trait of layer.traits) {
            if (trait.filePath) {
              // Extract the trait filename from the original path
              const originalPath = trait.filePath;
              const traitFileName = originalPath.split('/').pop();
              
              // Update to new path
              trait.filePath = discoveredPath.path + '/' + traitFileName;
              console.log('[DEBUG] Updated trait path:', trait.name, 'from:', originalPath, 'to:', trait.filePath);
            }
          }
        }
      }
    },

    // Migrate old project data to new format
    migrateProjectData: function(project) {
      if (!project) return;
      
      let needsMigration = false;
      
      // Migrate old default values
      if (project.size === 0) {
        project.size = null;
        needsMigration = true;
        console.log('Migrated project.size from 0 to null');
      }
      
      if (project.totalSupply === 10000) {
        project.totalSupply = null;
        needsMigration = true;
        console.log('Migrated project.totalSupply from 10000 to null');
      }
      
      if (needsMigration) {
        console.log('Project data migrated successfully');
      }
    },

    // CRITICAL: Preserve trait imageData after project loading
    preserveTraitImageData: function(project) {
      if (!project || !project.traits) {
        console.log('No project traits to preserve');
        return;
      }

      let preservedCount = 0;
      let missingCount = 0;

      console.log('🛡️ PRESERVING TRAIT IMAGEDATA AFTER PROJECT LOAD...');

      for (const layer of project.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            if (trait.imageData) {
              preservedCount++;
              console.log(`✅ Preserved imageData for: ${layer.name} - ${trait.name}`);
            } else {
              missingCount++;
              console.warn(`❌ Missing imageData for: ${layer.name} - ${trait.name}`);
              
              // Try to restore from alternative sources
              if (trait.image) {
                trait.imageData = trait.image;
                console.log(`✅ Restored from image property: ${trait.name}`);
                preservedCount++;
                missingCount--;
              } else if (trait.imageSrc) {
                trait.imageData = trait.imageSrc;
                console.log(`✅ Restored from imageSrc property: ${trait.name}`);
                preservedCount++;
                missingCount--;
              } else if (trait.src) {
                trait.imageData = trait.src;
                console.log(`✅ Restored from src property: ${trait.name}`);
                preservedCount++;
                missingCount--;
              }
            }
          }
        }
      }

      console.log(`🛡️ TRAIT IMAGEDATA PRESERVATION: ${preservedCount} preserved, ${missingCount} still missing`);
      
      // If we have missing traits, try to restore from localStorage backup
      if (missingCount > 0) {
        console.log('🛡️ Attempting to restore missing traits from localStorage backup...');
        this.restoreTraitImageDataFromBackup(project);
      }
    },

    // Restore trait imageData from localStorage backup
    restoreTraitImageDataFromBackup: function(project) {
      if (!project || !project.traits) return;

      let restoredCount = 0;
      
      for (const layer of project.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            if (!trait.imageData && trait.id) {
              const backupKey = `trait_backup_${trait.id}`;
              const backupData = localStorage.getItem(backupKey);
              
              if (backupData) {
                try {
                  const backup = JSON.parse(backupData);
                  if (backup.imageData) {
                    trait.imageData = backup.imageData;
                    console.log(`✅ Restored from backup: ${trait.name}`);
                    restoredCount++;
                  }
                } catch (e) {
                  console.warn(`Failed to parse backup for trait: ${trait.name}`);
                }
              }
            }
          }
        }
      }

      if (restoredCount > 0) {
        console.log(`🛡️ Restored ${restoredCount} traits from localStorage backup`);
      }
    }
  }

  // Register the project service module
  if (window.NFTApp && window.NFTApp.registerModule) {
    window.NFTApp.registerModule("projectService", projectService)
  } else {
    console.error("Failed to register project service module: NFTApp or registerModule not found")
    // Create a fallback
    window.NFTApp = window.NFTApp || {}
    window.NFTApp.modules = window.NFTApp.modules || {}
    window.NFTApp.modules.projectService = projectService
  }
})()