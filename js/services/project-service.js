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

      // Reset all module states before creating new project
      this.resetAllModuleStates();

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
      
      // Do NOT show "Please Wait" popup yet - wait until Loading Project window closes

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
      
      // Store file info for compression detection
      const isCompressedFile = file.name.endsWith('.gz') || file.name.endsWith('.json.gz');
      
      // Read as ArrayBuffer if potentially compressed, otherwise as text
      if (isCompressedFile) {
        reader.readAsArrayBuffer(file);
      } else {
        reader.readAsText(file);
      }
      
      // Add error handler for FileReader
      reader.onerror = (error) => {
        console.error("Error reading project file:", error);
        // Hide NFT rendering popup on error
        const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
        if (generateNftsUI && generateNftsUI.hideNftRenderingPopup) {
          generateNftsUI.hideNftRenderingPopup();
        }
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
          let jsonString;
          const fileData = e.target.result;
          
          // BACKWARD COMPATIBILITY: Handle both old (.json) and new (.json.gz) formats
          // Priority: Extension detection first, then content detection as fallback
          
          // Primary detection: File extension (.gz or .json.gz = compressed)
          if (isCompressedFile) {
            // File extension indicates compression
            if (typeof pako === 'undefined') {
              throw new Error('Compressed file (.json.gz) detected but pako compression library is not available. Please reload the page and try again.');
            }
            
            try {
              console.log('[DEBUG] 📂 LOAD: Detected compressed file by extension, decompressing...');
              const uint8Array = fileData instanceof ArrayBuffer ? new Uint8Array(fileData) : fileData;
              const decompressed = pako.inflate(uint8Array, { to: 'string' });
              jsonString = decompressed;
              console.log('[DEBUG] 📂 LOAD: File decompressed successfully');
            } catch (decompError) {
              throw new Error('Failed to decompress file. The file may be corrupted. Error: ' + decompError.message);
            }
          } else {
            // Old format: Regular JSON file (.json extension)
            // This ensures full backward compatibility with existing project files
            console.log('[DEBUG] 📂 LOAD: Loading as regular JSON file (backward compatible mode)');
            
            if (fileData instanceof ArrayBuffer) {
              // If somehow read as ArrayBuffer (shouldn't happen for .json files), convert
              jsonString = new TextDecoder().decode(fileData);
            } else {
              // Normal case: already a string
              jsonString = fileData;
            }
            
            // CRITICAL: Validate it's actually JSON, not accidentally compressed
            // Check if it starts with JSON-like characters (allow whitespace)
            const trimmed = jsonString.trim();
            if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) {
              // Doesn't look like JSON - might be compressed without .gz extension
              // Try to decompress as fallback
              if (typeof pako !== 'undefined') {
                try {
                  console.log('[DEBUG] 📂 LOAD: Content doesn\'t look like JSON, attempting decompression...');
                  const uint8Array = new Uint8Array(fileData instanceof ArrayBuffer ? fileData : new TextEncoder().encode(jsonString));
                  const decompressed = pako.inflate(uint8Array, { to: 'string' });
                  jsonString = decompressed;
                  console.log('[DEBUG] 📂 LOAD: Successfully decompressed (file was compressed without .gz extension)');
                } catch (decompError) {
                  // Not compressed after all - proceed with original string
                  console.log('[DEBUG] 📂 LOAD: Decompression failed, treating as plain JSON');
                }
              }
            }
          }
          
          // Validate JSON before parsing
          if (!jsonString || (typeof jsonString !== 'string') || jsonString.trim() === '') {
            throw new Error('Empty or invalid file content');
          }
          
          // Parse JSON - this will throw if invalid, which is caught below
          const loadedProject = JSON.parse(jsonString);
          
          // CRITICAL VERIFICATION: Log what's being loaded from the file
          console.log('[DEBUG] 📂 LOAD: Project file loaded successfully');
          console.log('[DEBUG] 📂 LOAD: loadedProject.savedSeeds exists:', !!loadedProject.savedSeeds);
          console.log('[DEBUG] 📂 LOAD: loadedProject.savedSeeds type:', Array.isArray(loadedProject.savedSeeds) ? 'Array' : typeof loadedProject.savedSeeds);
          console.log('[DEBUG] 📂 LOAD: loadedProject.savedSeeds length:', Array.isArray(loadedProject.savedSeeds) ? loadedProject.savedSeeds.length : 'N/A');
          if (Array.isArray(loadedProject.savedSeeds) && loadedProject.savedSeeds.length > 0) {
            console.log('[DEBUG] 📂 LOAD: Sample loadedProject.savedSeeds[0]:', { seed: loadedProject.savedSeeds[0].seed, hasTraits: !!loadedProject.savedSeeds[0].traits });
            console.log('[DEBUG] 📂 LOAD: First 3 seeds:', loadedProject.savedSeeds.slice(0, 3).map(s => typeof s === 'object' ? (s.seed || 'no seed prop') : s));
          } else if (loadedProject.savedSeeds === undefined) {
            console.log('[DEBUG] 📂 LOAD: ⚠️ WARNING - loadedProject.savedSeeds is undefined!');
          } else if (!Array.isArray(loadedProject.savedSeeds)) {
            console.log('[DEBUG] 📂 LOAD: ⚠️ WARNING - loadedProject.savedSeeds is not an array! Type:', typeof loadedProject.savedSeeds);
          }
          
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
            settings: loadedProject.settings || {},
            // CRITICAL: Preserve savedSeeds from loaded project file
            savedSeeds: Array.isArray(loadedProject.savedSeeds) ? loadedProject.savedSeeds : []
          }
          
          // Remove exportNftsState from loaded project to ensure fresh start
          delete project.exportNftsState;

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

          // Reset all module states before loading project
          this.resetAllModuleStates();
          
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

          // CRITICAL: Update savedSeedsModal instance EARLY with correct key and seeds
          // This must happen BEFORE project interface starts to ensure correct key is used
          if (window.SavedSeedsModal) {
            // Ensure modal instance exists
            if (!window.savedSeedsModalInstance) {
              window.savedSeedsModalInstance = new window.SavedSeedsModal();
            }
            
            // Set the correct seedListKey based on the loaded project name
            const correctSeedListKey = 'nftSeedList_' + (project.name ? encodeURIComponent(project.name) : 'default');
            window.savedSeedsModalInstance.seedListKey = correctSeedListKey;
            console.log('[DEBUG] ✅ EARLY: Set modal seedListKey to:', correctSeedListKey, 'for project:', project.name || 'unknown');
            
            // If project has savedSeeds, load them now
            if (project.savedSeeds && Array.isArray(project.savedSeeds) && project.savedSeeds.length > 0) {
              const normalizedSeeds = project.savedSeeds.map(seed => {
                if (typeof seed === 'string' || typeof seed === 'number') {
                  return { seed: String(seed) };
                } else if (seed && seed.seed) {
                  return { seed: String(seed.seed) };
                }
                return null;
              }).filter(seed => seed && seed.seed);
              
              window.savedSeedsModalInstance.seedList = normalizedSeeds;
              console.log('[DEBUG] ✅ EARLY: Pre-loaded', normalizedSeeds.length, 'seeds into modal instance from project data');
            }
          }

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
              // console.log("[DEBUG] Starting project interface with new project");
              window.NFTApp.getModule("projectInterface").start(project);
              // console.log("[DEBUG] Project interface started successfully");
            } catch (error) {
              console.error("[DEBUG] Error starting project interface:", error);
              console.error("[DEBUG] Error stack:", error.stack);
              console.error("[DEBUG] Error details:", {
                message: error.message,
                name: error.name,
                fileName: error.fileName,
                lineNumber: error.lineNumber
              });
              // Hide NFT rendering popup on error
              const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
              if (generateNftsUI && generateNftsUI.hideNftRenderingPopup) {
                generateNftsUI.hideNftRenderingPopup();
              }
              this.hideLoadingAnimation();
              this.isLoading = false;
              if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
                window.NFTApp.getModule("notificationService").show("Error initializing project interface: " + error.message, "error");
              }
              return;
            }
          } else {
            console.error("Project interface module not found");
            // Hide "Please Wait" popup on error
            if (window.SavedSeedsModal && typeof window.SavedSeedsModal.hidePleaseWaitPopup === 'function') {
              window.SavedSeedsModal.hidePleaseWaitPopup();
            }
            this.hideLoadingAnimation();
            this.isLoading = false;
            alert("Sorry, the project interface is not available. Please try refreshing the page.");
            return;
          }

          // Hide "Loading Project" window first
          this.hideLoadingAnimation()
          
          this.isLoading = false; // Reset loading flag on success
          
          // Show "Project loaded successfully" notification with standard duration (3 seconds)
          // This notification should display immediately and hide after 3 seconds, independent of "Please Wait" popup
          if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show("Project loaded successfully", "success", 3000)
          }
          
          // NOW show "Please Wait" popup after showing the notification
          // Use a small delay to ensure notification appears first
          setTimeout(() => {
            const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
            if (generateNftsUI && generateNftsUI.showNftRenderingPopup) {
              generateNftsUI.showNftRenderingPopup();
            }
          }, 100);

          // Restore the active tab
          if (currentTab && window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
            window.NFTApp.getModule("navigation").showTab(currentTab)
          }

          // Reset the file input so the same file can be reloaded if needed
          if (event && event.target) {
            event.target.value = "";
          }

          // Popup will automatically transition from loading message to tasks
          // when the first task (selecting-traits) starts via updateTaskStatus

          // Restore the last generated NFT preview if it exists in the project
          if (project.lastGeneratedNFT && project.lastGeneratedNFT.seed) {
            console.log('[DEBUG] Restoring last generated NFT preview:', project.lastGeneratedNFT.seed);
            
            // Set a flag to indicate restoration is in progress
            window.nftRestorationInProgress = true;
            
            // Ensure preview container exists before restoring
            const ensurePreviewContainer = () => {
              const previewPanelElem = document.querySelector('.nft-preview-image-area');
              if (previewPanelElem) {
                let previewContainer = previewPanelElem.querySelector('#nft-preview-container');
                if (!previewContainer) {
                  previewContainer = document.createElement('div');
                  previewContainer.id = 'nft-preview-container';
                  previewPanelElem.appendChild(previewContainer);
                }
                return true;
              }
              return false;
            };
            
            // Function to restore NFT - will be called when ready
            const restoreNFT = async () => {
              try {
                // Keep Generate NFTs tab enabled - content inside will be greyed out until NFT renders
                if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
                  window.NFTApp.getModule('navigation').enableGenerateNftsTab();
                }
                
                // Ensure preview container exists
                if (!ensurePreviewContainer()) {
                  console.warn('[DEBUG] Preview container not found, retrying...');
                  setTimeout(restoreNFT, 300);
                  return;
                }
                
                const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
                const generateNfts = window.NFTApp.getModule('generateNfts');
                
                if (generateNftsUI && generateNfts && generateNfts.generateSingleNFT) {
                  console.log('[DEBUG] Generating NFT with seed:', project.lastGeneratedNFT.seed);
                  
                  // Generate the NFT using the saved seed to restore the exact same NFT
                  // Note: generateSingleNFT will handle task status updates internally
                  const restoredNFT = await generateNfts.generateSingleNFT(project, false, project.lastGeneratedNFT.seed);
                  
                  if (restoredNFT) {
                    console.log('[DEBUG] NFT generated successfully, updating preview...');
                    
                    // Update the global NFT reference
                    window.lastGeneratedNFT = restoredNFT;
                    
                    // Mark that NFT has been generated to prevent auto-generation
                    if (window.NFTApp.getModule('navigation')) {
                      window.NFTApp.getModule('navigation').firstNftGenerated = true;
                    }
                    
                    // Remove "No Project Loaded" card before updating preview
                    const noProjectCard = document.querySelector('.no-project-card');
                    if (noProjectCard) {
                      noProjectCard.remove();
                    }
                    
                    // Update the UI to show the restored NFT
                    // This will work even if the Generate NFTs tab is not active
                    generateNftsUI.updateSinglePreviewPanel(project, restoredNFT);
                    generateNftsUI.updateTraitInfoPanel(restoredNFT, project);
                    
                    // CRITICAL: Update button states after NFT is restored and displayed
                    // Use multiple delayed calls to ensure buttons get their colors even if image loads asynchronously
                    setTimeout(() => {
                      if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
                        generateNftsUI._updateAllButtonStates();
                      }
                    }, 100);
                    
                    setTimeout(() => {
                      if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
                        generateNftsUI._updateAllButtonStates();
                      }
                    }, 500);
                    
                    setTimeout(() => {
                      if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
                        generateNftsUI._updateAllButtonStates();
                      }
                    }, 1000);
                    
                    console.log('[DEBUG] Successfully restored NFT preview:', restoredNFT.seed);
                  } else {
                    console.warn('[DEBUG] Failed to generate NFT from seed');
                    // Fall back to auto-generation if restoration fails
                    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                      window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project);
                    }
                  }
                } else {
                  console.warn('[DEBUG] Generate NFTs modules not available');
                  // Fall back to auto-generation if modules not available
                  if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                    window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project);
                  }
                }
              } catch (error) {
                console.error('[DEBUG] Error restoring NFT preview:', error);
                // Fall back to auto-generation if restoration fails
                if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                  window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project);
                }
              } finally {
                // Clear the restoration flag
                window.nftRestorationInProgress = false;
              }
            };
            
            // Start restoration after a short delay to ensure DOM is ready
            // Increased delay slightly to ensure all modules are initialized
            setTimeout(restoreNFT, 500);
          } else {
            // CRITICAL: ALWAYS generate an NFT when project loads if no saved NFT exists
            // This ensures an NFT is always displayed after project load
            setTimeout(() => {
              const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
              const generateNfts = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNfts');
              
              if (generateNftsUI && generateNfts && generateNfts.generateSingleNFT && project && project.traits && project.traits.length > 0) {
                // Set flag to indicate NFT generation is in progress
                window.nftRestorationInProgress = true;
                
                console.log('[DEBUG] No saved NFT found - generating new NFT automatically after project load');
                
                // Generate a new random NFT
                generateNfts.generateSingleNFT(project, false).then((nft) => {
                  if (nft) {
                    // Update the global NFT reference
                    window.lastGeneratedNFT = nft;
                    
                    // Mark that NFT has been generated
                    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
                      window.NFTApp.getModule('navigation').firstNftGenerated = true;
                    }
                    
                    // Update project data to include this NFT as the last generated NFT
                    if (project) {
                      project.lastGeneratedNFT = {
                        seed: nft.seed,
                        traits: nft.traits || {},
                        rarity: nft.rarity || 'Unknown',
                        rarityScore: nft.rarityScore || 0,
                        timestamp: Date.now()
                      };
                    }
                    if (window.currentProject) {
                      window.currentProject.lastGeneratedNFT = {
                        seed: nft.seed,
                        traits: nft.traits || {},
                        rarity: nft.rarity || 'Unknown',
                        rarityScore: nft.rarityScore || 0,
                        timestamp: Date.now()
                      };
                    }
                    
                    // Remove "No Project Loaded" card before updating preview
                    const noProjectCard = document.querySelector('.no-project-card');
                    if (noProjectCard) {
                      noProjectCard.remove();
                    }
                    
                    // Update the UI to show the generated NFT
                    generateNftsUI.updateSinglePreviewPanel(project, nft);
                    generateNftsUI.updateTraitInfoPanel(nft, project);
                    
                    // CRITICAL: Update button states after NFT is generated and displayed
                    setTimeout(() => {
                      if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
                        generateNftsUI._updateAllButtonStates();
                      }
                    }, 100);
                    
                    setTimeout(() => {
                      if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
                        generateNftsUI._updateAllButtonStates();
                      }
                    }, 500);
                    
                    setTimeout(() => {
                      if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
                        generateNftsUI._updateAllButtonStates();
                      }
                    }, 1000);
                    
                    console.log('[DEBUG] Successfully generated and displayed NFT after project load:', nft.seed);
                  }
                  
                  // Clear the restoration flag
                  window.nftRestorationInProgress = false;
                }).catch((error) => {
                  console.error('[DEBUG] Error generating NFT after project load:', error);
                  window.nftRestorationInProgress = false;
                  
                  // Fallback: try traitLayers auto-generation
                  if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                    window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project);
                  }
                });
              } else {
                // Fallback: use traitLayers auto-generation if modules not available
                if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers')) {
                  window.NFTApp.getModule('traitLayers').checkAndAutoGenerateNFT(project);
                }
              }
            }, 500); // Small delay to ensure DOM and modules are ready
          }
          
          // If no NFT to restore, the popup will be hidden when NFT is auto-generated and displayed

          // Helper to get project-specific seed list key
          function getSeedListKey(project) {
            return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
          }

          const seedListKey = getSeedListKey(project);
          // console.log('[DEBUG] Seed list key for loaded project:', seedListKey);
          
          // CRITICAL DEBUG: Check what's actually in loadedProject.savedSeeds
          console.log('[DEBUG] 🔍 loadedProject.savedSeeds type:', typeof loadedProject.savedSeeds);
          console.log('[DEBUG] 🔍 loadedProject.savedSeeds isArray:', Array.isArray(loadedProject.savedSeeds));
          console.log('[DEBUG] 🔍 loadedProject.savedSeeds length:', Array.isArray(loadedProject.savedSeeds) ? loadedProject.savedSeeds.length : 'N/A');
          if (Array.isArray(loadedProject.savedSeeds) && loadedProject.savedSeeds.length > 0) {
            console.log('[DEBUG] 🔍 First 3 savedSeeds preview:', loadedProject.savedSeeds.slice(0, 3).map(s => typeof s === 'object' ? (s.seed || 'no seed prop') : s));
          }
          console.log('[DEBUG] 🔍 project.savedSeeds (after merge) type:', typeof project.savedSeeds);
          console.log('[DEBUG] 🔍 project.savedSeeds (after merge) isArray:', Array.isArray(project.savedSeeds));
          console.log('[DEBUG] 🔍 project.savedSeeds (after merge) length:', Array.isArray(project.savedSeeds) ? project.savedSeeds.length : 'N/A');
          
          // CRITICAL: Check if project file has seeds BEFORE clearing localStorage
          // If project file has empty seeds but localStorage has seeds, preserve localStorage seeds
          const hasSeedsInFile = Array.isArray(loadedProject.savedSeeds) && loadedProject.savedSeeds.length > 0;
          const existingLocalStorageSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
          const hasSeedsInLocalStorage = Array.isArray(existingLocalStorageSeeds) && existingLocalStorageSeeds.length > 0;
          
          console.log('[DEBUG] 🔍 hasSeedsInFile:', hasSeedsInFile);
          console.log('[DEBUG] 🔍 hasSeedsInLocalStorage:', hasSeedsInLocalStorage, '(count:', existingLocalStorageSeeds.length, ')');
          
          // Only clear the specific project's seed list if file has seeds to replace it with
          // If file has no seeds but localStorage has seeds, PRESERVE localStorage seeds
          if (hasSeedsInFile) {
            // File has seeds - clear localStorage and use file seeds
            if (localStorage.getItem(seedListKey)) {
              console.log('[DEBUG] Project file has seeds, clearing existing localStorage seed list');
              localStorage.removeItem(seedListKey);
            }
          } else if (hasSeedsInLocalStorage) {
            // File has no seeds but localStorage has seeds - PRESERVE localStorage seeds
            console.log('[DEBUG] ⚠️ Project file has NO seeds, but localStorage has', existingLocalStorageSeeds.length, 'seeds - PRESERVING localStorage seeds');
            // Don't clear localStorage - keep existing seeds
          } else {
            // Both are empty - ensure localStorage is empty
            if (localStorage.getItem(seedListKey)) {
              console.log('[DEBUG] Both file and localStorage empty, ensuring localStorage is empty');
              localStorage.removeItem(seedListKey);
            }
          }
          
          // CRITICAL: Check both loadedProject.savedSeeds AND existing localStorage seeds
          // Use loadedProject.savedSeeds as primary source (from file), fallback to localStorage if file is empty
          const seedsToProcess = hasSeedsInFile 
            ? loadedProject.savedSeeds 
            : (hasSeedsInLocalStorage 
              ? existingLocalStorageSeeds 
              : (Array.isArray(project.savedSeeds) && project.savedSeeds.length > 0 ? project.savedSeeds : []));
          
          console.log('[DEBUG] 🔍 seedsToProcess source:', hasSeedsInFile ? 'project file' : (hasSeedsInLocalStorage ? 'localStorage (preserved)' : 'project.savedSeeds or empty'));
          console.log('[DEBUG] 🔍 seedsToProcess length:', seedsToProcess.length);
          
          if (seedsToProcess.length > 0) {
            try {
              const source = hasSeedsInFile ? 'project file' : (hasSeedsInLocalStorage ? 'localStorage (preserved)' : 'project data');
              console.log('[DEBUG] ✅ Processing', seedsToProcess.length, 'seeds from', source);
              
              // CRITICAL: First normalize all seeds to extract seed numbers, handling all formats
              // This must happen BEFORE any processing to ensure we have valid seed numbers
              const normalizedSeeds = [];
              const processedSeedsForRarityScores = [];
              
              for (let i = 0; i < seedsToProcess.length; i++) {
                const seedEntry = seedsToProcess[i];
                let seedNumber = null;
                let seedObj = null;
                
                // Extract seed number from various formats
                if (typeof seedEntry === 'string' || typeof seedEntry === 'number') {
                  // Plain string or number
                  seedNumber = String(seedEntry);
                  seedObj = { seed: seedNumber };
                } else if (seedEntry && seedEntry.seed) {
                  // Object with seed property
                  seedNumber = String(seedEntry.seed);
                  seedObj = { seed: seedNumber };
                } else {
                  // Invalid format, skip it
                  console.warn('[DEBUG] Skipping invalid seed entry at index', i, ':', seedEntry);
                  continue;
                }
                
                if (!seedNumber) {
                  console.warn('[DEBUG] Could not extract seed number from entry:', seedEntry);
                  continue;
                }
                
                // Add to normalized list (minimal format for localStorage)
                normalizedSeeds.push(seedObj);
                
                // Also preserve full data for rarity score restoration (if available)
                if (seedEntry && typeof seedEntry === 'object') {
                  processedSeedsForRarityScores.push({
                    seed: seedNumber,
                    rarity: seedEntry.rarity,
                    rarityScore: seedEntry.rarityScore || 0,
                    timestamp: seedEntry.timestamp || Date.now(),
                    traits: seedEntry.traits || []
                  });
                } else {
                  // For string/number seeds, create minimal rarity entry
                  processedSeedsForRarityScores.push({
                    seed: seedNumber,
                    rarity: null,
                    rarityScore: 0,
                    timestamp: Date.now(),
                    traits: []
                  });
                }
              }
              
              // Try to save to localStorage with quota protection (minimal format)
              const success = this.safeLocalStorageSetItem(seedListKey, normalizedSeeds);
              if (success) {
                console.log('[DEBUG] ✅ Restored', normalizedSeeds.length, 'NFTs to localStorage (minimal format - seed numbers only)');
              } else {
                console.warn('[DEBUG] ⚠️ Failed to save seeds to localStorage - seeds will be in project data only');
                // Still set in project data as fallback
                project.savedSeeds = normalizedSeeds;
              }
              
              // IMPORTANT: Also add saved seeds to project data for immediate availability
              project.savedSeeds = normalizedSeeds;
              // console.log('[DEBUG] Added', normalizedSeeds.length, 'saved seeds to project data');
              
              // CRITICAL: Update savedSeedsModal instance if it exists to use the loaded seeds
              // This must happen BEFORE any other code tries to use the modal instance
              if (window.savedSeedsModalInstance) {
                window.savedSeedsModalInstance.seedListKey = seedListKey;
                window.savedSeedsModalInstance.seedList = normalizedSeeds;
                console.log('[DEBUG] ✅ Updated savedSeedsModal instance with loaded seeds:', normalizedSeeds.length, 'seeds');
                console.log('[DEBUG] ✅ Updated modal seedListKey to:', seedListKey);
                
                // Force reload to ensure modal instance is fully synced
                if (typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
                  // CRITICAL: Force reload (true) to ensure we get fresh data from localStorage
                  // This prevents showing 0 NFTs when reopening a saved project
                  window.savedSeedsModalInstance.loadSeedList(true);
                }
                
                // Update counters immediately after loading seeds
                if (window.updateAllCounters && typeof window.updateAllCounters === 'function') {
                  window.updateAllCounters();
                }
              } else if (window.SavedSeedsModal) {
                // Create modal instance if it doesn't exist yet
                window.savedSeedsModalInstance = new window.SavedSeedsModal();
                window.savedSeedsModalInstance.seedListKey = seedListKey;
                window.savedSeedsModalInstance.seedList = normalizedSeeds;
                console.log('[DEBUG] ✅ Created savedSeedsModal instance with loaded seeds:', normalizedSeeds.length, 'seeds');
                console.log('[DEBUG] ✅ Set modal seedListKey to:', seedListKey);
                
                // Force load to ensure localStorage is synced
                if (typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
                  // CRITICAL: Force reload (true) to ensure we get fresh data from localStorage
                  // This prevents showing 0 NFTs when reopening a saved project
                  window.savedSeedsModalInstance.loadSeedList(true);
                }
                
                // Update counters immediately after loading seeds
                if (window.updateAllCounters && typeof window.updateAllCounters === 'function') {
                  window.updateAllCounters();
                }
              }
              
              // Restore rarity scores for each seed (with quota protection)
              // Use processedSeedsForRarityScores to get rarity scores
              processedSeedsForRarityScores.forEach(seedObj => {
                if (seedObj && seedObj.seed && typeof seedObj.rarityScore === 'number') {
                  try {
                    localStorage.setItem('nftScore_' + String(seedObj.seed), String(seedObj.rarityScore));
                  } catch (quotaError) {
                    console.warn('[DEBUG] QuotaExceededError when saving rarity score for seed:', seedObj.seed);
                    // Skip saving individual rarity scores if quota exceeded
                  }
                }
              });
              
              console.log('[DEBUG] Rarity scores restored from project file');
            } catch (e) { console.warn('Could not restore savedSeeds to localStorage', e); }
          } else {
            // CRITICAL: Initialize savedSeeds as empty array if not present in project file
            console.log('[DEBUG] ⚠️ No saved seeds found in project file. loadedProject.savedSeeds:', loadedProject.savedSeeds, 'project.savedSeeds:', project.savedSeeds);
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

          // Restore rarity status (Calculate Rarity ranks button state)
          if (loadedProject.rarityStatus) {
            project.rarityStatus = loadedProject.rarityStatus;
            // CRITICAL FIX: Also restore collection size if available
            if (loadedProject.rarityStatusCollectionSize !== undefined) {
              project.rarityStatusCollectionSize = loadedProject.rarityStatusCollectionSize;
              console.log(`Restored rarity status from project file: ${loadedProject.rarityStatus} with collection size: ${loadedProject.rarityStatusCollectionSize}`);
            } else {
              console.log(`Restored rarity status from project file: ${loadedProject.rarityStatus} (no collection size found)`);
            }
          } else {
            console.log('No rarity status found in project file');
          }

          // Restore trait rarities status (Calculate Trait Rarities button state)
          if (loadedProject.traitRaritiesStatus) {
            project.traitRaritiesStatus = loadedProject.traitRaritiesStatus;
            if (loadedProject.traitRaritiesCollectionSize) {
              project.traitRaritiesCollectionSize = loadedProject.traitRaritiesCollectionSize;
            }
            console.log(`Restored trait rarities status from project file: ${loadedProject.traitRaritiesStatus}`);
          } else {
            console.log('No trait rarities status found in project file');
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

            // NOTE: Modal instance is already updated earlier in the load sequence
            // But verify it has the correct seeds after all processing is done
            if (window.savedSeedsModalInstance && project.savedSeeds && Array.isArray(project.savedSeeds) && project.savedSeeds.length > 0) {
              // Ensure the seedList is up to date after all normalization
              const normalizedSeeds = project.savedSeeds.map(seed => {
                if (typeof seed === 'string' || typeof seed === 'number') {
                  return { seed: String(seed) };
                } else if (seed && seed.seed) {
                  return { seed: String(seed.seed) };
                }
                return null;
              }).filter(seed => seed && seed.seed);
              
              // Only update if counts don't match
              if (window.savedSeedsModalInstance.seedList.length !== normalizedSeeds.length) {
                window.savedSeedsModalInstance.seedList = normalizedSeeds;
                console.log('[DEBUG] ✅ Verified and updated modal instance with', normalizedSeeds.length, 'seeds');
              }
            }
            
            // Update all counters after loading the project
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
              // Update the module's projectData
              window.NFTApp.getModule('generateNftsUI').projectData = project;
              
              // CRITICAL: Update counters immediately and multiple times to ensure accuracy
              const updateCountersNow = () => {
                // Use unified counter update system
                if (window.updateAllCounters) {
                  window.updateAllCounters();
                  // console.log('[DEBUG] All counters updated after project load');
                } else {
                  // Fallback to individual updates if unified system not available
                  if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
                    window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true);
                    console.log('[DEBUG] Seed counter updated after project load (fallback)');
                  }
                  
                  if (window.updateNftCountPanel) {
                    window.updateNftCountPanel();
                    console.log('[DEBUG] NFT count panel updated after project load (fallback)');
                  }
                }
              };
              
              // CRITICAL: Force update counters immediately with delay to ensure localStorage is read
              // Use multiple attempts with increasing delays to catch all cases
              const forceCounterUpdate = () => {
                // Force refresh seed list counter
                if (typeof window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter === 'function') {
                  window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter(true);
                }
                // Force update NFT count panel
                if (window.updateNftCountPanel) {
                  window.updateNftCountPanel();
                }
                // Use unified system
                if (window.updateAllCounters) {
                  window.updateAllCounters();
                }
                // console.log('[DEBUG] Force counter update completed');
              };
              
              // PERFORMANCE: Defer counter updates until after popup closes (they're non-critical)
              // Counter updates will be handled by hideNftRenderingPopup -> animateNftCountAfterLoad
              // This prevents unnecessary work during loading
              
              // CRITICAL: Don't update counters before popup is shown - wait until popup is displayed
              // This prevents the green color from flashing before the "Please Wait" popup appears
              // The popup is shown 100ms after project load, so we should wait at least that long
              // Counter updates will be handled by hideNftRenderingPopup -> animateNftCountAfterLoad
              // Skip counter updates here - they will happen after popup closes
              // REMOVED: updateCountersNow() and forceCounterUpdate() calls to prevent green flash
              // Counters will be updated after "Please Wait" popup is hidden
                  
                  // CRITICAL: Ensure saved-seeds-modal instance exists and loads seedList on project load
              // This ensures saved seeds are always counted when a project loads
              let savedSeedsModal = window.savedSeedsModalInstance;
              
              // If modal instance doesn't exist, try to find it or create it
              if (!savedSeedsModal) {
                const modalElement = document.querySelector('#saved-seeds-modal');
                if (modalElement && modalElement.savedSeedsModalInstance) {
                  savedSeedsModal = modalElement.savedSeedsModalInstance;
                  window.savedSeedsModalInstance = savedSeedsModal;
                  console.log('[DEBUG] Found modal instance from DOM element');
                } else if (window.SavedSeedsModal) {
                  // Create new instance if class exists but instance doesn't
                  savedSeedsModal = new window.SavedSeedsModal();
                  window.savedSeedsModalInstance = savedSeedsModal;
                  console.log('[DEBUG] Created new SavedSeedsModal instance');
                }
              }
              
              // If we have the modal instance, ensure it has the correct key and loads data
              if (savedSeedsModal) {
                // Update seedListKey to match current project
                if (typeof savedSeedsModal.getSeedListKey === 'function') {
                  const correctKey = savedSeedsModal.getSeedListKey();
                  savedSeedsModal.seedListKey = correctKey;
                  // console.log('[DEBUG] Updated modal seedListKey to:', correctKey, 'for project:', project.name || 'unknown');
                }
                
                // CRITICAL: Always load seedList on project load to ensure accurate counting
                // Clear existing seedList to force reload from localStorage
                savedSeedsModal.seedList = [];
                
                // Force load seedList if method exists
                if (typeof savedSeedsModal.loadSeedList === 'function') {
                  savedSeedsModal.loadSeedList(true); // Force reload
                  const seedCount = savedSeedsModal.seedList?.length || 0;
                  // console.log('[DEBUG] ✅ Loaded seedList on project load:', seedCount, 'saved seeds');
                  
                  // Verify seeds were loaded correctly
                  // if (seedCount > 0) {
                  //   console.log('[DEBUG] Sample seeds:', savedSeedsModal.seedList.slice(0, 3).map(s => {
                  //     if (typeof s === 'string' || typeof s === 'number') return s;
                  //     return s?.seed || 'unknown';
                  //   }));
                  // }
                } else {
                  console.warn('[DEBUG] Modal instance does not have loadSeedList method');
                }
                
                // PERFORMANCE: Defer counter updates until after popup closes
                // Counter updates will be handled by hideNftRenderingPopup -> animateNftCountAfterLoad
                // Check if popup is showing before updating
                const generateNftsTabCheck = document.getElementById('generate-nfts');
                const popupCheck = generateNftsTabCheck ? generateNftsTabCheck.querySelector('.nft-rendering-popup') : null;
                if (!popupCheck) {
                  // No popup, safe to update counters
                  setTimeout(() => {
                    updateCountersNow();
                    forceCounterUpdate();
                  }, 100);
                }
                // If popup is showing, counters will be updated after popup closes
              } else {
                console.warn('[DEBUG] SavedSeedsModal instance not found - counters will use localStorage directly');
              }
              
              // PERFORMANCE: Skip this additional update if popup is showing
              const generateNftsTabFinal = document.getElementById('generate-nfts');
              const popupFinal = generateNftsTabFinal ? generateNftsTabFinal.querySelector('.nft-rendering-popup') : null;
              if (!popupFinal) {
                setTimeout(() => {
                  updateCountersNow();
                  forceCounterUpdate();
                }, 600); // PERFORMANCE: Reduced from 1000ms to 600ms
              }
              
              // PERFORMANCE: Skip final update if popup is showing (will be handled after popup closes)
              // Final update after everything is settled (only if no popup)
              const generateNftsTabFinalCheck = document.getElementById('generate-nfts');
              const popupFinalCheck = generateNftsTabFinalCheck ? generateNftsTabFinalCheck.querySelector('.nft-rendering-popup') : null;
              if (!popupFinalCheck) {
                setTimeout(forceCounterUpdate, 1500); // PERFORMANCE: Reduced from 2000ms to 1500ms
              }
              
              // One more update after modal instance has loaded its data
              setTimeout(() => {
                // Ensure modal instance loads its seedList
                if (window.savedSeedsModalInstance && typeof window.savedSeedsModalInstance.loadSeedList === 'function') {
                  if (!window.savedSeedsModalInstance.seedList || window.savedSeedsModalInstance.seedList.length === 0) {
                    window.savedSeedsModalInstance.seedList = [];
                    window.savedSeedsModalInstance.loadSeedList(true); // Force reload
                    console.log('[DEBUG] Final modal seedList load, count:', window.savedSeedsModalInstance.seedList?.length || 0);
                  }
                }
                forceCounterUpdate();
              }, 2500);
            } // Close if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) block from line 1017
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
      
      // CRITICAL: FileReader is already initialized and reading started above (lines 276-280)
      // Do NOT call readAsText or readAsArrayBuffer again here as it causes "already busy" error
    },

    save: async function(forceNewFile = false) {
      console.log("Saving project", forceNewFile ? "as new file" : "with existing handle if available")

      if (!window.currentProject) {
        console.warn("No project to save")
        return
      }

      // Store the current active tab at the beginning so it's accessible throughout
      const currentTab = document.querySelector('.nav-tab.active')?.dataset.tab;

      // Show loading animation immediately
      // Always show loading animation (not transparent) so user can see the saving window
      this.showLoadingAnimation("Preparing to save project...", false);

      // Set the saving flag to prevent duplicate save operations
      this.isSaving = true;

      // CRITICAL: If using File System Access API and need to show picker,
      // show it IMMEDIATELY (before setTimeout) to preserve user gesture context
      let fileHandle = null;
      if (window.showSaveFilePicker && (forceNewFile || !this.lastFileHandle)) {
        try {
          const suggestedFileName = window.currentProject.name + (typeof pako !== 'undefined' ? '.json.gz' : '.json');
          const options = {
            suggestedName: suggestedFileName,
            types: [{
              description: 'Project Files',
              accept: {
                'application/json': ['.json'],
                'application/gzip': ['.json.gz', '.gz']
              }
            }]
          };
          
          if (this.lastProjectDir) {
            options.startIn = this.lastProjectDir;
          }
          
          console.log("Showing file picker immediately (within user gesture)...");
          fileHandle = await window.showSaveFilePicker(options);
          this.lastFileHandle = fileHandle;
          
          // Ensure loading animation is visible after file picker closes
          this.showLoadingAnimation("Preparing to save project...", false);
          
          // Store handle info
          try {
            if (window.localStorage && fileHandle && fileHandle.name) {
              window.localStorage.setItem('nftcc_lastProjectPath', fileHandle.name);
            }
          } catch (e) { console.warn('Could not save last project path', e); }
        } catch (pickerError) {
          if (pickerError.name === 'AbortError') {
            console.log('[DEBUG] User cancelled file picker');
            this.hideLoadingAnimation();
            this.isSaving = false;
            return;
          }
          // If picker fails, continue with fallback method
          console.warn("File picker failed, will use fallback:", pickerError);
          fileHandle = null;
        }
      } else if (window.showSaveFilePicker && this.lastFileHandle) {
        // Use existing handle
        fileHandle = this.lastFileHandle;
      }

      // Use setTimeout to allow the browser to render the loading animation before processing
      setTimeout(async () => {
        try {

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

            // Save Export NFTs / Metadata state
            if (window.NFTApp.getModule("exportNfts")) {
              window.NFTApp.getModule("exportNfts").saveState();
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
        } catch (prepError) {
          console.error("[DEBUG] Error during save preparation:", prepError);
          // Hide loading animation on preparation error
          this.hideLoadingAnimation();
          this.isSaving = false;
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show("Error preparing project for save: " + (prepError.message || "Unknown error"), "error");
          }
          return; // Exit early if preparation fails
        }

        try {
          // Remove seedAlgorithm before saving
          const projectToSave = { ...window.currentProject };
          delete projectToSave.seedAlgorithm;

      // Helper to get project-specific seed list key
      function getSeedListKey(project) {
        return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
      }

      const seedListKeySave = getSeedListKey(window.currentProject);
      
      // CRITICAL: Define project variable for use throughout this block
      const project = window.currentProject;
      
      // CRITICAL: Define savedSeeds outside try block to ensure it's always in scope
      let savedSeeds = [];
      
      try {
        // CRITICAL: Always use localStorage as primary source for project saving
        // This ensures we get the most up-to-date data after NFT edits
        const localStorageSeeds = JSON.parse(localStorage.getItem(seedListKeySave) || '[]');
        
        if (localStorageSeeds.length > 0) {
          savedSeeds = localStorageSeeds;
          console.log('Using localStorage as primary source for saved seeds:', savedSeeds.length, 'seeds');
        } else if (window.savedSeedsModalInstance && window.savedSeedsModalInstance.seedList && Array.isArray(window.savedSeedsModalInstance.seedList) && window.savedSeedsModalInstance.seedList.length > 0) {
          // CRITICAL FALLBACK: Check modal instance (it might have seeds even if localStorage was cleared)
          savedSeeds = window.savedSeedsModalInstance.seedList;
          console.log('localStorage empty, using savedSeedsModalInstance.seedList:', savedSeeds.length, 'seeds');
        } else if (window.MemoryManager && window.MemoryManager.state.currentProject.savedSeeds && window.MemoryManager.state.currentProject.savedSeeds.length > 0) {
          savedSeeds = window.MemoryManager.state.currentProject.savedSeeds;
          console.log('Modal instance empty, falling back to MemoryManager:', savedSeeds.length, 'seeds');
        } else if (window.currentProject.savedSeeds && window.currentProject.savedSeeds.length > 0) {
          savedSeeds = window.currentProject.savedSeeds;
          console.log('MemoryManager empty, falling back to project data:', savedSeeds.length, 'seeds');
        } else {
          savedSeeds = [];
          console.log('All sources empty, using empty array');
        }
        
        console.log('========== SAVING PROJECT ==========');
        console.log('[DEBUG] Save: Found', savedSeeds.length, 'seeds total');
        console.log('[DEBUG] Save: localStorage count:', localStorageSeeds.length);
        console.log('[DEBUG] Save: Modal instance count:', window.savedSeedsModalInstance?.seedList?.length || 0);
        
        // Generate full seed data for project file from seed numbers
        // localStorage only has seed numbers, but project file needs trait data
        const generateNftsModule = window.NFTApp.getModule('generateNfts');
        const optimizedSeeds = [];
        
        // CRITICAL: Preserve order by iterating in sequence and logging for verification
        console.log('[DEBUG] 💾 SAVE: Processing', savedSeeds.length, 'seeds in order');
        console.log('[DEBUG] 💾 SAVE: First seed:', savedSeeds[0] ? (typeof savedSeeds[0] === 'object' ? savedSeeds[0].seed : savedSeeds[0]) : 'N/A');
        console.log('[DEBUG] 💾 SAVE: Last seed:', savedSeeds.length > 0 ? (typeof savedSeeds[savedSeeds.length - 1] === 'object' ? savedSeeds[savedSeeds.length - 1].seed : savedSeeds[savedSeeds.length - 1]) : 'N/A');
        
        for (let idx = 0; idx < savedSeeds.length; idx++) {
          const seedEntry = savedSeeds[idx];
          // Extract seed number (could be string, number, or object with seed property)
          const seedNumber = typeof seedEntry === 'string' || typeof seedEntry === 'number' 
            ? String(seedEntry) 
            : (seedEntry && seedEntry.seed ? String(seedEntry.seed) : null);
          
          if (!seedNumber) {
            console.warn('[DEBUG] 💾 SAVE: Skipping invalid seed entry at index', idx, ':', seedEntry);
            continue;
          }
          
          const optimizedSeed = {
            seed: seedNumber
          };
          
          // Try to get trait data from rarityRanks if available (contains complete trait info)
          let traitDataFromRanks = null;
          if (window.currentProject.rarityRanks && window.currentProject.rarityRanks[seedNumber]) {
            const rankData = window.currentProject.rarityRanks[seedNumber];
            if (rankData && rankData.traits && Array.isArray(rankData.traits)) {
              traitDataFromRanks = rankData.traits.map(trait => ({
              layerId: trait.layerId,
              traitId: trait.traitId,
              layerName: trait.layerName,
              traitName: trait.traitName,
                // Get trait imageData from project traits
                imageData: (() => {
                  const layer = window.currentProject.traits?.find(l => l.id === trait.layerId);
                  if (layer) {
                    const traitObj = layer.traits?.find(t => t.id === trait.traitId);
                    return traitObj?.imageData || null;
                  }
                  return null;
                })()
              }));
            }
            // Also get rarity data from ranks
            if (rankData.rarity) optimizedSeed.rarity = rankData.rarity;
            if (rankData.rarityScore) optimizedSeed.rarityScore = rankData.rarityScore;
          }
          
          // If we don't have traits from rarityRanks, try to get from saved seed entry
          if (!traitDataFromRanks && seedEntry.traits && Array.isArray(seedEntry.traits) && seedEntry.traits.length > 0) {
            traitDataFromRanks = seedEntry.traits.map(trait => ({
              layerId: trait.layerId,
              traitId: trait.traitId,
              layerName: trait.layerName,
              traitName: trait.traitName,
              // Get trait imageData from project traits or use saved one
              imageData: trait.imageData || (() => {
                const layer = window.currentProject.traits?.find(l => l.id === trait.layerId);
                if (layer) {
                  const traitObj = layer.traits?.find(t => t.id === trait.traitId);
                  return traitObj?.imageData || null;
                }
                return null;
              })()
            }));
            if (seedEntry.rarity) optimizedSeed.rarity = seedEntry.rarity;
            if (seedEntry.rarityScore) optimizedSeed.rarityScore = seedEntry.rarityScore;
          }
          
          // SKIPPED: Trait regeneration during save - too slow for large collections
          // If traits are not available in rarityRanks or saved entry, save seed without traits
          // Traits will be regenerated when project is loaded if needed
          // This makes save operations much faster for large collections
          
          // Add traits if found
          if (traitDataFromRanks && traitDataFromRanks.length > 0) {
            optimizedSeed.traits = traitDataFromRanks;
          }
          
          // Get rarityScore from localStorage if not already set
          if (!optimizedSeed.rarityScore) {
            const rarityScore = localStorage.getItem('nftScore_' + seedNumber);
          if (rarityScore !== null) {
              optimizedSeed.rarityScore = Number(rarityScore);
            }
          }
          
          // Add timestamp if present
          if (seedEntry.timestamp) {
            optimizedSeed.timestamp = seedEntry.timestamp;
          }
          
          optimizedSeeds.push(optimizedSeed);
        }
        
        // CRITICAL: Verify order and count before saving
        if (optimizedSeeds.length !== savedSeeds.length) {
          console.error('[DEBUG] ⚠️ SAVE WARNING: Seed count mismatch! Expected', savedSeeds.length, 'but processed', optimizedSeeds.length);
          console.error('[DEBUG] ⚠️ Some seeds may have been skipped due to invalid format');
        } else {
          console.log('[DEBUG] ✅ SAVE: All', savedSeeds.length, 'seeds processed successfully');
        }
        
        // Verify order is preserved by checking first and last seeds match
        const originalFirst = savedSeeds[0] ? (typeof savedSeeds[0] === 'object' ? savedSeeds[0].seed : String(savedSeeds[0])) : null;
        const originalLast = savedSeeds.length > 0 ? (typeof savedSeeds[savedSeeds.length - 1] === 'object' ? savedSeeds[savedSeeds.length - 1].seed : String(savedSeeds[savedSeeds.length - 1])) : null;
        const savedFirst = optimizedSeeds[0]?.seed;
        const savedLast = optimizedSeeds.length > 0 ? optimizedSeeds[optimizedSeeds.length - 1]?.seed : null;
        
        if (originalFirst && savedFirst && originalFirst !== savedFirst) {
          console.error('[DEBUG] ⚠️ SAVE ERROR: Order mismatch at start! Original first:', originalFirst, 'Saved first:', savedFirst);
        } else if (originalFirst && savedFirst) {
          console.log('[DEBUG] ✅ SAVE: Order verified - first seed matches:', savedFirst);
        }
        
        if (originalLast && savedLast && originalLast !== savedLast) {
          console.error('[DEBUG] ⚠️ SAVE ERROR: Order mismatch at end! Original last:', originalLast, 'Saved last:', savedLast);
        } else if (originalLast && savedLast) {
          console.log('[DEBUG] ✅ SAVE: Order verified - last seed matches:', savedLast);
        }
        
        projectToSave.savedSeeds = optimizedSeeds;
        console.log('[DEBUG] 💾 SAVE: Saved', optimizedSeeds.length, 'NFTs to project file (optimized format - no image data)');
        console.log('[DEBUG] 💾 SAVE: savedSeeds array length:', optimizedSeeds.length);
        console.log('[DEBUG] 💾 SAVE: First 3 seeds preview:', optimizedSeeds.slice(0, 3).map(s => ({ seed: s.seed, hasTraits: !!s.traits, traitsCount: s.traits?.length || 0 })));
        console.log('[DEBUG] 💾 SAVE: Last 3 seeds preview:', optimizedSeeds.slice(-3).map(s => ({ seed: s.seed, hasTraits: !!s.traits, traitsCount: s.traits?.length || 0 })));
        
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
                
                // CRITICAL: Always keep imageData for local development
                // Browsers cannot access local file paths, so imageData is essential
                // Only remove imageData if we have a valid web URL (http/https) that can be accessed
                if (trait.imageData) {
                  if (trait.filePath && (trait.filePath.startsWith('http://') || trait.filePath.startsWith('https://'))) {
                    // Web URL exists - can be loaded remotely, so remove imageData to save space
                    // This reduces file size for web-hosted projects
                    console.log('Removing imageData (has web URL):', trait.name, trait.filePath.substring(0, 50));
                  } else {
                    // Local file path or no filePath - MUST keep imageData
                    // Browsers cannot access local file system, so imageData is required
                    console.log('Keeping imageData (local development):', trait.name);
                    optimizedTrait.imageData = trait.imageData;
                  }
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
        console.error('[DEBUG] ⚠️ CRITICAL ERROR saving seeds:', e);
        console.error('[DEBUG] ⚠️ Error stack:', e.stack);
        
        // CRITICAL: Get savedSeeds from localStorage as fallback if error occurred before it was defined
        // savedSeeds is already declared outside try block, just reassign if needed
        try {
          const localStorageSeeds = JSON.parse(localStorage.getItem(seedListKeySave) || '[]');
          if (localStorageSeeds && localStorageSeeds.length > 0) {
            savedSeeds = localStorageSeeds;
          } else if (window.savedSeedsModalInstance && window.savedSeedsModalInstance.seedList && Array.isArray(window.savedSeedsModalInstance.seedList) && window.savedSeedsModalInstance.seedList.length > 0) {
            savedSeeds = window.savedSeedsModalInstance.seedList;
          } else if (window.currentProject.savedSeeds && window.currentProject.savedSeeds.length > 0) {
            savedSeeds = window.currentProject.savedSeeds;
          }
        } catch (err) {
          console.error('[DEBUG] Error getting savedSeeds in catch block:', err);
        }
        
        console.error('[DEBUG] ⚠️ Attempted to save', savedSeeds.length, 'seeds');
        
        // CRITICAL: Don't set to empty array if we had seeds to save!
        // Instead, try to save minimal seed data (just seed numbers) as fallback
        if (savedSeeds && savedSeeds.length > 0) {
          console.log('[DEBUG] 💾 FALLBACK: Saving minimal seed data (seed numbers only)');
          try {
            const minimalSeeds = savedSeeds.map(seedEntry => {
              const seedNumber = typeof seedEntry === 'string' || typeof seedEntry === 'number' 
                ? String(seedEntry) 
                : (seedEntry && seedEntry.seed ? String(seedEntry.seed) : null);
              return seedNumber ? { seed: seedNumber } : null;
            }).filter(s => s !== null);
            
            projectToSave.savedSeeds = minimalSeeds;
            console.log('[DEBUG] ✅ FALLBACK: Saved', minimalSeeds.length, 'minimal seeds (seed numbers only)');
          } catch (fallbackError) {
            console.error('[DEBUG] ⚠️ FALLBACK also failed:', fallbackError);
            // Only set to empty if we absolutely can't save anything
            // But keep the original seeds in projectToSave if they exist
            if (!projectToSave.savedSeeds || projectToSave.savedSeeds.length === 0) {
              projectToSave.savedSeeds = [];
              console.error('[DEBUG] ⚠️ WARNING: Saved empty savedSeeds array due to errors');
            }
          }
        } else {
          // Only set to empty if we actually had no seeds to save
          projectToSave.savedSeeds = [];
          console.log('[DEBUG] No seeds to save - set to empty array');
        }
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
      // CRITICAL VERIFICATION: Log what's about to be saved
      console.log('[DEBUG] 💾 SAVE: Final verification before stringifying:');
      console.log('[DEBUG] 💾 SAVE: projectToSave.savedSeeds exists:', !!projectToSave.savedSeeds);
      console.log('[DEBUG] 💾 SAVE: projectToSave.savedSeeds type:', Array.isArray(projectToSave.savedSeeds) ? 'Array' : typeof projectToSave.savedSeeds);
      console.log('[DEBUG] 💾 SAVE: projectToSave.savedSeeds length:', Array.isArray(projectToSave.savedSeeds) ? projectToSave.savedSeeds.length : 'N/A');
      
      // CRITICAL: Verify savedSeeds is not accidentally empty when it shouldn't be
      // Get savedSeeds from localStorage if not already defined in scope
      let savedSeedsForRecovery = [];
      try {
        const localStorageSeedsCheck = JSON.parse(localStorage.getItem(seedListKeySave) || '[]');
        if (localStorageSeedsCheck && localStorageSeedsCheck.length > 0) {
          savedSeedsForRecovery = localStorageSeedsCheck;
        } else if (window.savedSeedsModalInstance && window.savedSeedsModalInstance.seedList && Array.isArray(window.savedSeedsModalInstance.seedList) && window.savedSeedsModalInstance.seedList.length > 0) {
          savedSeedsForRecovery = window.savedSeedsModalInstance.seedList;
        }
      } catch (err) {
        console.error('[DEBUG] Error getting savedSeeds for recovery:', err);
      }
      
      if ((!projectToSave.savedSeeds || projectToSave.savedSeeds.length === 0) && savedSeedsForRecovery && savedSeedsForRecovery.length > 0) {
        console.error('[DEBUG] ⚠️ CRITICAL WARNING: savedSeeds is empty but we had', savedSeedsForRecovery.length, 'seeds to save!');
        console.error('[DEBUG] ⚠️ Attempting emergency recovery...');
        // Emergency recovery: save minimal seed data
        try {
          const emergencySeeds = savedSeedsForRecovery.map(seedEntry => {
            const seedNumber = typeof seedEntry === 'string' || typeof seedEntry === 'number' 
              ? String(seedEntry) 
              : (seedEntry && seedEntry.seed ? String(seedEntry.seed) : null);
            return seedNumber ? { seed: seedNumber } : null;
          }).filter(s => s !== null);
          
          projectToSave.savedSeeds = emergencySeeds;
          console.log('[DEBUG] ✅ EMERGENCY RECOVERY: Saved', emergencySeeds.length, 'minimal seeds');
        } catch (recoveryError) {
          console.error('[DEBUG] ⚠️ EMERGENCY RECOVERY FAILED:', recoveryError);
        }
      }
      
      if (Array.isArray(projectToSave.savedSeeds) && projectToSave.savedSeeds.length > 0) {
        console.log('[DEBUG] 💾 SAVE: Sample savedSeeds[0]:', { seed: projectToSave.savedSeeds[0].seed, hasTraits: !!projectToSave.savedSeeds[0].traits });
        console.log('[DEBUG] 💾 SAVE: Sample savedSeeds[last]:', { 
          seed: projectToSave.savedSeeds[projectToSave.savedSeeds.length - 1].seed, 
          hasTraits: !!projectToSave.savedSeeds[projectToSave.savedSeeds.length - 1].traits 
        });
      } else {
        console.warn('[DEBUG] ⚠️ SAVE: savedSeeds is empty or invalid!');
      }
      
      // Final double-check before stringifying
      const finalSeedCount = Array.isArray(projectToSave.savedSeeds) ? projectToSave.savedSeeds.length : 0;
      console.log('[DEBUG] 💾 SAVE: FINAL seed count in projectToSave:', finalSeedCount);
      
      // NOTE: Trait imageData is kept for local file paths (required for local development)
      // Only imageData for web URLs (http/https) is removed to save space
      // This ensures local projects work correctly since browsers cannot access local file paths
      
      const projectJson = JSON.stringify(projectToSave, null, 2);
      const uncompressedSize = projectJson.length;
      console.log('[DEBUG] 💾 Project JSON size (uncompressed):', (uncompressedSize / 1024 / 1024).toFixed(2), 'MB');
      
      let blob;
      let suggestedFileName;
      
      // Use compression if pako library is available (can reduce size by 70-90%)
      if (typeof pako !== 'undefined') {
        try {
          console.log('[DEBUG] 💾 Compressing project file with gzip...');
          const compressed = pako.deflate(projectJson, { level: 9 });
          blob = new Blob([compressed], { type: 'application/gzip' });
          suggestedFileName = window.currentProject.name + '.json.gz';
          const compressedSize = compressed.length;
          const compressionRatio = ((1 - compressedSize / uncompressedSize) * 100).toFixed(1);
          console.log('[DEBUG] 💾 Compressed size:', (compressedSize / 1024 / 1024).toFixed(2), 'MB');
          console.log('[DEBUG] 💾 Compression ratio:', compressionRatio + '%');
        } catch (compressionError) {
          console.warn('[DEBUG] Compression failed, saving uncompressed:', compressionError);
          blob = new Blob([projectJson], { type: 'application/json' });
          suggestedFileName = window.currentProject.name + '.json';
        }
      } else {
        blob = new Blob([projectJson], { type: 'application/json' });
        suggestedFileName = window.currentProject.name + '.json';
        console.log('[DEBUG] 💾 Pako compression library not available, saving uncompressed JSON');
      }

      // Check if we're in a modern browser that supports the File System Access API
      if (window.showSaveFilePicker && fileHandle) {
        console.log("Using modern File System Access API for saving");
        
        // Use immediately invoked async function
        (async () => {
          try {
            // fileHandle was already obtained above (before setTimeout) to preserve user gesture
            // Use it directly - no need to show picker again

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
              const currentTabForFallback = document.querySelector('.nav-tab.active')?.dataset.tab || currentTab;
              this.fallbackToDownload(blob, suggestedFileName, null, currentTabForFallback);
              this.hideLoadingAnimation();
              return;
            }
            
            // Hide loading animation
            this.hideLoadingAnimation();
            
            // Show success notification
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
              window.NFTApp.getModule("notificationService").show("Project saved successfully", "success");
            }
            
            // Trigger resource monitoring after successful save
            document.dispatchEvent(new CustomEvent('project:saved', { 
              detail: { projectName: project.name } 
            }));
            
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
              const currentTabForFallback = document.querySelector('.nav-tab.active')?.dataset.tab || currentTab;
              this.fallbackToDownload(blob, suggestedFileName, null, currentTabForFallback);
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
      fileInput.accept = '.json,.json.gz,.gz'
      
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
                    
                    // Trigger resource monitoring after successful save
                    document.dispatchEvent(new CustomEvent('project:saved', { 
                      detail: { projectName: project.name } 
                    }));
                    
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
      
      // CRITICAL: Set a timeout to hide loading animation if save dialog doesn't appear or gets stuck
      // This prevents the loading animation from staying forever if user cancels or dialog fails
      setTimeout(() => {
        // Check if still saving (in case dialog was cancelled or stuck)
        if (this.isSaving) {
          // Check if we have the loading animation visible
          const loadingOverlay = document.getElementById("loading-overlay");
          if (loadingOverlay && loadingOverlay.style.display !== 'none') {
            console.log('[DEBUG] Save dialog appears stuck - hiding loading animation after timeout');
            this.hideLoadingAnimation();
            this.isSaving = false;
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
              window.NFTApp.getModule("notificationService").show("Save operation timed out. Please try again.", "error");
            }
          }
        }
      }, 10000); // 10 second timeout - should be plenty for file dialog
      
        } catch (saveError) {
          // Catch any errors during the save process
          console.error("[DEBUG] Error during save process:", saveError);
          console.error("[DEBUG] Error stack:", saveError.stack);
          // Hide loading animation on error
          this.hideLoadingAnimation();
          this.isSaving = false;
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show("Error saving project: " + (saveError.message || "Unknown error"), "error");
          }
        }
      }, 0); // End setTimeout - allows UI to update before processing
    },

    // Reset all module states (called when starting new project or loading project)
    resetAllModuleStates: function() {
      console.log("[Project Service] Resetting all module states...");
      
      // Reset Export NFTs module
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("exportNfts")) {
        try {
          window.NFTApp.getModule("exportNfts").resetAllState();
        } catch (e) {
          console.warn("[Project Service] Error resetting exportNfts module:", e);
        }
      }
      
      // Reset Generate NFTs UI module if it has a reset function
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("generateNftsUI")) {
        try {
          const generateNftsUI = window.NFTApp.getModule("generateNftsUI");
          if (typeof generateNftsUI.resetAllState === 'function') {
            generateNftsUI.resetAllState();
          }
        } catch (e) {
          console.warn("[Project Service] Error resetting generateNftsUI module:", e);
        }
      }
      
      // Reset Trait Layers module if it has a reset function
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
        try {
          const traitLayers = window.NFTApp.getModule("traitLayers");
          if (typeof traitLayers.resetAllState === 'function') {
            traitLayers.resetAllState();
          }
        } catch (e) {
          console.warn("[Project Service] Error resetting traitLayers module:", e);
        }
      }
      
      // Clear all global caches
      if (window._imageDataCache) {
        window._imageDataCache.clear();
      }
      if (window.savedSeedsImageCache) {
        window.savedSeedsImageCache = {};
      }
      
      // Clear localStorage project-specific data (but keep app settings)
      try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('nftSeedList_') ||
            key.startsWith('nftDescriptions_') ||
            key.startsWith('exportNftsState_') ||
            key.startsWith('batchData_')
          )) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        console.log("[Project Service] Cleared project-specific localStorage data");
      } catch (e) {
        console.warn("[Project Service] Error clearing localStorage:", e);
      }
      
      // Reset global project references
      window.lastGeneratedNFT = null;
      
      console.log("[Project Service] All module states reset complete");
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
      
      // Trigger resource monitoring after successful save
      document.dispatchEvent(new CustomEvent('project:saved', { 
        detail: { projectName: window.currentProject?.name || 'unknown' } 
      }));
      
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

      // Show the loading overlay with high z-index
      loadingOverlay.style.display = "flex"
      loadingOverlay.style.zIndex = "99999"
      loadingOverlay.style.position = "fixed"
      
      // Ensure animation is running (restart if needed)
      this.restartLoadingAnimation()
      
      // Set up visibility change listener to restart animation when tab becomes visible
      // Remove any existing listener first to avoid duplicates
      if (this._visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this._visibilityChangeHandler)
      }
      
      // Create new visibility change handler
      this._visibilityChangeHandler = () => {
        if (!document.hidden && loadingOverlay && loadingOverlay.style.display !== "none") {
          // Tab became visible and loading overlay is still showing - restart animation
          this.restartLoadingAnimation()
        }
      }
      
      // Create window focus/blur handlers for browser minimize/maximize
      this._windowFocusHandler = () => {
        if (loadingOverlay && loadingOverlay.style.display !== "none") {
          // Window regained focus and loading overlay is still showing - restart animation
          this.restartLoadingAnimation()
        }
      }
      
      this._windowBlurHandler = () => {
        // Window lost focus - animation will pause, but we'll restart it when focus returns
        // No action needed here, focus handler will restart it
      }
      
      // Add the visibility change listener
      document.addEventListener('visibilitychange', this._visibilityChangeHandler)
      
      // Add window focus/blur listeners for browser minimize/maximize
      window.addEventListener('focus', this._windowFocusHandler)
      window.addEventListener('blur', this._windowBlurHandler)
    },
    
    // Restart loading animation (useful when tab becomes visible again or window is restored)
    restartLoadingAnimation: function() {
      const loadingOverlay = document.getElementById("loading-overlay")
      if (!loadingOverlay || loadingOverlay.style.display === "none" || loadingOverlay.style.visibility === "hidden") {
        return
      }
      
      const spinner = loadingOverlay.querySelector('.spinner')
      const path = loadingOverlay.querySelector('.path')
      
      if (spinner && path) {
        // More aggressive restart: completely remove and re-add animations
        // Step 1: Remove all animation properties
        spinner.style.removeProperty('animation')
        spinner.style.removeProperty('animation-name')
        spinner.style.removeProperty('animation-duration')
        spinner.style.removeProperty('animation-timing-function')
        spinner.style.removeProperty('animation-iteration-count')
        spinner.style.removeProperty('animation-play-state')
        spinner.style.removeProperty('will-change')
        
        path.style.removeProperty('animation')
        path.style.removeProperty('animation-name')
        path.style.removeProperty('animation-duration')
        path.style.removeProperty('animation-timing-function')
        path.style.removeProperty('animation-iteration-count')
        path.style.removeProperty('animation-play-state')
        path.style.removeProperty('will-change')
        
        // Force multiple reflows to ensure removal
        void spinner.offsetWidth
        void path.offsetWidth
        void spinner.offsetHeight
        void path.offsetHeight
        
        // Step 2: Use requestAnimationFrame to ensure browser has processed the removal
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            // Step 3: Re-apply animations with will-change hint for better performance
            spinner.style.willChange = 'transform'
            path.style.willChange = 'stroke-dasharray, stroke-dashoffset'
            
            // Step 4: Force another reflow
            void spinner.offsetWidth
            void path.offsetWidth
            
            // Step 5: Apply animations
            requestAnimationFrame(() => {
              spinner.style.animation = 'spinner-rotate 2s linear infinite'
              spinner.style.animationPlayState = 'running'
              path.style.animation = 'spinner-dash 1.5s ease-in-out infinite'
              path.style.animationPlayState = 'running'
              
              // Force repaint
              void spinner.offsetWidth
              void path.offsetWidth
              
              // Step 6: Verify animations are running and restart if needed
              setTimeout(() => {
                const checkSpinnerStyle = window.getComputedStyle(spinner)
                const checkPathStyle = window.getComputedStyle(path)
                const spinnerAnimName = checkSpinnerStyle.animationName
                const pathAnimName = checkPathStyle.animationName
                const spinnerPlayState = checkSpinnerStyle.animationPlayState
                const pathPlayState = checkPathStyle.animationPlayState
                
                // If animations aren't running, force restart one more time
                if (spinnerPlayState === 'paused' || pathPlayState === 'paused' ||
                    spinnerAnimName === 'none' || pathAnimName === 'none' ||
                    !spinnerAnimName || !pathAnimName) {
                  // Last resort: completely reset
                  spinner.style.animation = 'none'
                  path.style.animation = 'none'
                  void spinner.offsetWidth
                  void path.offsetWidth
                  
                  requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                      spinner.style.animation = 'spinner-rotate 2s linear infinite'
                      spinner.style.animationPlayState = 'running'
                      path.style.animation = 'spinner-dash 1.5s ease-in-out infinite'
                      path.style.animationPlayState = 'running'
                      void spinner.offsetWidth
                      void path.offsetWidth
                    })
                  })
                }
              }, 100)
            })
          })
        })
      }
    },

    hideLoadingAnimation: function() {
      const loadingOverlay = document.getElementById("loading-overlay")
      if (loadingOverlay) {
        loadingOverlay.style.display = "none"
        loadingOverlay.style.visibility = "hidden"
        loadingOverlay.style.opacity = "0"
      }
      // Also check for any other loading overlays that might exist
      const nftLoadingOverlay = document.getElementById("nft-loading-overlay")
      if (nftLoadingOverlay) {
        nftLoadingOverlay.style.display = "none"
        nftLoadingOverlay.style.visibility = "hidden"
        nftLoadingOverlay.style.opacity = "0"
      }
      
      // Remove visibility change listener when hiding loading animation
      if (this._visibilityChangeHandler) {
        document.removeEventListener('visibilitychange', this._visibilityChangeHandler)
        this._visibilityChangeHandler = null
      }
      
      // Remove window focus/blur listeners when hiding loading animation
      if (this._windowFocusHandler) {
        window.removeEventListener('focus', this._windowFocusHandler)
        this._windowFocusHandler = null
      }
      if (this._windowBlurHandler) {
        window.removeEventListener('blur', this._windowBlurHandler)
        this._windowBlurHandler = null
      }
    },

    // Load trait images from file paths
    loadTraitImagesFromPaths: async function(traits) {
      console.log('Starting to load trait images from file paths...');
      
      // PERFORMANCE: Initialize in-memory image cache (not saved to project file)
      if (!window._imageDataCache) {
        window._imageDataCache = new Map();
      }
      
      let loadedCount = 0;
      let skippedCount = 0;
      let errorCount = 0;
      const missingTraits = [];
      
      // PERFORMANCE: Collect all image loading promises first, then load in parallel
      const imageLoadPromises = [];
      
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
              // PERFORMANCE: Check in-memory cache first
              const cacheKey = trait.filePath;
              if (window._imageDataCache.has(cacheKey)) {
                trait.imageData = window._imageDataCache.get(cacheKey);
                skippedCount++;
                continue;
              }
              
              // Only try to load from file path if it's NOT a local filename
              // PERFORMANCE: Create promise for parallel loading instead of await
              const loadPromise = (async () => {
                try {
                  // Try to fetch the file (for web URLs or full paths)
                  const response = await fetch(trait.filePath);
                  if (response.ok) {
                    const blob = await response.blob();
                    const reader = new FileReader();
                    
                    return new Promise((resolve, reject) => {
                      reader.onload = () => {
                        trait.imageData = reader.result;
                        // PERFORMANCE: Cache the image data in memory (not saved to project)
                        window._imageDataCache.set(cacheKey, reader.result);
                        loadedCount++;
                        resolve({ success: true, trait, layer });
                      };
                      
                      reader.onerror = () => {
                        console.warn('Could not read file from path:', trait.filePath);
                        errorCount++;
                        missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                        resolve({ success: false, trait, layer });
                      };
                      
                      reader.readAsDataURL(blob);
                    });
                  } else {
                    console.warn('Could not fetch file from path:', trait.filePath, 'Status:', response.status);
                    errorCount++;
                    missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                    return { success: false, trait, layer };
                  }
                } catch (error) {
                  console.warn('Loading from file path failed:', trait.filePath, error);
                  errorCount++;
                  missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                  return { success: false, trait, layer };
                }
              })();
              
              imageLoadPromises.push(loadPromise);
            } else if (isLocalFile) {
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
      
      // PERFORMANCE: Wait for all images to load in parallel instead of sequentially
      if (imageLoadPromises.length > 0) {
        console.log(`Loading ${imageLoadPromises.length} images in parallel...`);
        await Promise.all(imageLoadPromises);
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
  // Set up visibility change and window focus listeners to restart animations when tab/window becomes visible
  // This fixes the issue where animations pause when browser is minimized
  if (typeof document !== 'undefined') {
    // Function to restart all loading animations with aggressive restart logic
    const restartAllAnimations = function() {
      // Check if loading overlay is visible
      const loadingOverlay = document.getElementById("loading-overlay")
      if (loadingOverlay && loadingOverlay.style.display !== "none" && loadingOverlay.style.display !== "" && loadingOverlay.style.visibility !== "hidden") {
        // Restart the loading animation
        if (projectService.restartLoadingAnimation) {
          projectService.restartLoadingAnimation()
        }
      }
      
      // Also check NFT loading overlay
      const nftLoadingOverlay = document.getElementById("nft-loading-overlay")
      if (nftLoadingOverlay && nftLoadingOverlay.style.display !== "none" && nftLoadingOverlay.style.display !== "") {
        // Restart NFT loading animation
        const spinner = nftLoadingOverlay.querySelector('.loading-spinner')
        if (spinner) {
          // Force reflow to restart animation
          void spinner.offsetWidth
          // Remove and re-add animation to force restart
          spinner.style.animation = 'none'
          spinner.style.animationPlayState = 'paused'
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                spinner.style.animation = ''
                spinner.style.animationPlayState = 'running'
                void spinner.offsetWidth
                // Check if animation is running, if not, try again
                setTimeout(() => {
                  const checkStyle = window.getComputedStyle(spinner)
                  if (checkStyle.animationPlayState === 'paused' || checkStyle.animation === 'none') {
                    spinner.style.animation = 'none'
                    void spinner.offsetWidth
                    requestAnimationFrame(() => {
                      spinner.style.animation = ''
                      spinner.style.animationPlayState = 'running'
                      void spinner.offsetWidth
                    })
                  }
                }, 50)
              })
            })
          })
        }
      }
      
      // Also check for NFT rendering popup animation
      const nftRenderingPopup = document.querySelector('.nft-rendering-popup')
      if (nftRenderingPopup && nftRenderingPopup.style.display !== "none") {
        // Restart any animated dots in the popup
        const animatedDots = nftRenderingPopup.querySelectorAll('.task-dots span')
        animatedDots.forEach(dot => {
          void dot.offsetWidth // Force reflow
          dot.style.animation = 'none'
          dot.style.animationPlayState = 'paused'
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                dot.style.animation = ''
                dot.style.animationPlayState = 'running'
                void dot.offsetWidth
              })
            })
          })
        })
      }
    }
    
    // Set up a monitoring system to continuously check if animations are running
    let animationMonitorInterval = null
    const startAnimationMonitor = function() {
      // Clear any existing monitor
      if (animationMonitorInterval) {
        clearInterval(animationMonitorInterval)
      }
      
      // Check every 500ms if animations are running and restart if needed
      animationMonitorInterval = setInterval(() => {
        const loadingOverlay = document.getElementById("loading-overlay")
        if (loadingOverlay && loadingOverlay.style.display !== "none" && loadingOverlay.style.visibility !== "hidden") {
          const spinner = loadingOverlay.querySelector('.spinner')
          const path = loadingOverlay.querySelector('.path')
          
          if (spinner && path) {
            const spinnerStyle = window.getComputedStyle(spinner)
            const pathStyle = window.getComputedStyle(path)
            
            // Check if animations are actually running
            if (spinnerStyle.animationPlayState === 'paused' || 
                pathStyle.animationPlayState === 'paused' ||
                spinnerStyle.animationName === 'none' ||
                pathStyle.animationName === 'none' ||
                !spinnerStyle.animationName ||
                !pathStyle.animationName) {
              // Animations are not running - restart them
              if (projectService.restartLoadingAnimation) {
                projectService.restartLoadingAnimation()
              }
            }
          }
        }
      }, 500)
    }
    
    // Start monitoring when page loads
    if (typeof document !== 'undefined') {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startAnimationMonitor)
      } else {
        startAnimationMonitor()
      }
    }
    
    // Listen for visibility change (tab switching)
    document.addEventListener('visibilitychange', function() {
      // When tab becomes visible again
      if (!document.hidden) {
        // Immediate restart
        restartAllAnimations()
        // Multiple attempts with delays to ensure animations restart
        setTimeout(() => {
          restartAllAnimations()
        }, 10)
        setTimeout(() => {
          restartAllAnimations()
        }, 50)
        setTimeout(() => {
          restartAllAnimations()
        }, 150)
        setTimeout(() => {
          restartAllAnimations()
        }, 300)
        setTimeout(() => {
          restartAllAnimations()
        }, 500)
      }
    })
    
    // Also listen for window focus (window minimize/restore)
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', function() {
        // Immediate restart
        restartAllAnimations()
        // Multiple attempts with delays to ensure animations restart
        setTimeout(() => {
          restartAllAnimations()
        }, 10)
        setTimeout(() => {
          restartAllAnimations()
        }, 50)
        setTimeout(() => {
          restartAllAnimations()
        }, 150)
        setTimeout(() => {
          restartAllAnimations()
        }, 300)
        setTimeout(() => {
          restartAllAnimations()
        }, 500)
      })
      
      // Also listen for pageshow event (fires when page is loaded from cache, including when window is restored)
      window.addEventListener('pageshow', function(event) {
        // If page was loaded from cache (back/forward navigation or window restore)
        if (event.persisted) {
          restartAllAnimations()
          setTimeout(() => {
            restartAllAnimations()
          }, 10)
          setTimeout(() => {
            restartAllAnimations()
          }, 50)
          setTimeout(() => {
            restartAllAnimations()
          }, 150)
          setTimeout(() => {
            restartAllAnimations()
          }, 300)
          setTimeout(() => {
            restartAllAnimations()
          }, 500)
        }
      })
      
      // Also listen for window resize (sometimes fires when window is restored)
      let resizeTimeout
      window.addEventListener('resize', function() {
        clearTimeout(resizeTimeout)
        resizeTimeout = setTimeout(() => {
          restartAllAnimations()
        }, 100)
      })
      
      // Listen for window blur (when minimized) - prepare for restart
      window.addEventListener('blur', function() {
        // When window loses focus, we'll restart on focus
      })
    }
  }

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