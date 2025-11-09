/**
 * ULTIMATE TRAITS LOADING SOLUTION
 * This script addresses EVERY possible issue that could prevent traits from loading
 */
(function() {
  console.log("🚀 ULTIMATE TRAITS SOLUTION LOADING...");
  
  // Global state
  let ultimateState = {
    initialized: false,
    attempts: 0,
    maxAttempts: 20,
    lastAttempt: 0,
    debugMode: true
  };
  
  // Debug logging function
  function debugLog(message, data = null) {
    if (ultimateState.debugMode) {
      console.log(`[ULTIMATE TRAITS] ${message}`, data || '');
    }
  }
  
  // Function to check EVERYTHING
  function checkEverything() {
    debugLog("🔍 CHECKING EVERYTHING...");
    
    const checks = {
      // Core NFTApp system
      nftAppExists: !!(window.NFTApp),
      nftAppRegisterModule: !!(window.NFTApp?.registerModule),
      nftAppGetModule: !!(window.NFTApp?.getModule),
      nftAppInitModules: !!(window.NFTApp?.initModules),
      
      // Required modules
      projectServiceModule: !!(window.NFTApp?.getModule("projectService")),
      traitLayersModule: !!(window.NFTApp?.getModule("traitLayers")),
      projectInterfaceModule: !!(window.NFTApp?.getModule("projectInterface")),
      
      // Project data
      currentProjectExists: !!(window.currentProject),
      currentProjectTraitsArray: !!(window.currentProject?.traits),
      
      // DOM elements
      appContainer: !!(document.getElementById("app")),
      traitsTab: !!(document.getElementById("traits-rules")),
      traitLayersContainer: !!(document.getElementById("trait-layers-container")),
      
      // Module functions
      traitLayersSetup: !!(window.NFTApp?.getModule("traitLayers")?.setup),
      traitLayersUpdateUI: !!(window.NFTApp?.getModule("traitLayers")?.updateTraitLayerUI),
      projectInterfaceStart: !!(window.NFTApp?.getModule("projectInterface")?.start)
    };
    
    debugLog("📊 READINESS CHECK RESULTS:");
    Object.entries(checks).forEach(([key, value]) => {
      debugLog(`  ${value ? '✅' : '❌'} ${key}: ${value}`);
    });
    
    const allReady = Object.values(checks).every(check => check === true);
    debugLog(`🎯 OVERALL STATUS: ${allReady ? 'READY' : 'NOT READY'}`);
    
    return { checks, allReady };
  }
  
  // Function to create ALL missing elements
  function createAllMissingElements() {
    debugLog("🔧 CREATING ALL MISSING ELEMENTS...");
    
    // Ensure app container exists
    let appContainer = document.getElementById("app");
    if (!appContainer) {
      debugLog("Creating app container...");
      appContainer = document.createElement("div");
      appContainer.id = "app";
      appContainer.className = "app";
      document.body.appendChild(appContainer);
    }
    
    // Ensure project interface exists
    let projectInterface = document.querySelector(".project-interface");
    if (!projectInterface) {
      debugLog("Creating project interface...");
      projectInterface = document.createElement("div");
      projectInterface.className = "project-interface";
      appContainer.appendChild(projectInterface);
    }
    
    // Ensure content area exists
    let contentArea = document.querySelector(".content-area");
    if (!contentArea) {
      debugLog("Creating content area...");
      contentArea = document.createElement("div");
      contentArea.className = "content-area";
      projectInterface.appendChild(contentArea);
    }
    
    // Ensure traits tab exists
    let traitsTab = document.getElementById("traits-rules");
    if (!traitsTab) {
      debugLog("Creating traits tab...");
      traitsTab = document.createElement("div");
      traitsTab.id = "traits-rules";
      traitsTab.className = "tab-content";
      traitsTab.style.display = "block";
      contentArea.appendChild(traitsTab);
    }
    
    // Ensure trait layers container exists
    let traitLayersContainer = document.getElementById("trait-layers-container");
    if (!traitLayersContainer) {
      debugLog("Creating trait layers container...");
      traitLayersContainer = document.createElement("div");
      traitLayersContainer.id = "trait-layers-container";
      traitLayersContainer.className = "trait-layers-container";
      
      // Create complete trait layers structure
      traitLayersContainer.innerHTML = `
        <div class="section-header">
          <h2 class="section-title">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
            </svg>
            Trait Layers
          </h2>
          <p class="section-description">Add and manage your trait layers here.</p>
        </div>
        
        <div class="trait-layers-controls">
          <div class="add-layer-controls">
            <input type="text" id="add-layer-input" class="form-control" placeholder="Layer name (optional)">
            <button id="add-layer-btn" class="btn btn-primary">Add Layer</button>
          </div>
          <div class="add-folders-controls">
            <input type="file" id="folder-input" class="file-input" webkitdirectory multiple accept="image/*" style="display: none;">
            <button id="add-folders-btn" class="btn btn-secondary">Add Folders</button>
          </div>
          <div class="delete-all-controls">
            <button id="delete-all-layers" class="btn btn-danger" style="display: none;">Delete All Layers</button>
          </div>
        </div>
        
        <div id="trait-layers-dropzone" class="trait-layers-dropzone">
          <div class="dropzone-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-15"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <p>Drag and drop trait folders here or use the buttons above</p>
          </div>
        </div>
        
        <div id="trait-layers-list" class="trait-layers-list">
          <!-- Trait layers will be rendered here -->
        </div>
      `;
      
      traitsTab.appendChild(traitLayersContainer);
    }
    
    debugLog("✅ All missing elements created");
  }
  
  // Function to ensure project data exists
  function ensureProjectData() {
    debugLog("📋 ENSURING PROJECT DATA...");
    
    if (!window.currentProject) {
      debugLog("Creating default project...");
      window.currentProject = {
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
        }
      };
    }
    
    // Ensure traits array exists
    if (!window.currentProject.traits) {
      debugLog("Creating traits array...");
      window.currentProject.traits = [];
    }
    
    debugLog("✅ Project data ensured");
  }
  
  // Function to force initialize trait layers module
  function forceInitializeTraitLayers() {
    debugLog("🎯 FORCE INITIALIZING TRAIT LAYERS...");
    
    try {
      const traitLayersModule = window.NFTApp.getModule("traitLayers");
      if (!traitLayersModule) {
        debugLog("❌ Trait layers module not found!");
        return false;
      }
      
      debugLog("✅ Trait layers module found");
      
      // Call all available methods
      const methods = ['setup', 'setupUI', 'updateTraitLayerUI', 'init'];
      methods.forEach(method => {
        if (traitLayersModule[method] && typeof traitLayersModule[method] === 'function') {
          debugLog(`Calling traitLayers.${method}...`);
          try {
            if (method === 'init') {
              traitLayersModule[method]();
            } else {
              traitLayersModule[method](window.currentProject);
            }
            debugLog(`✅ traitLayers.${method} completed`);
          } catch (error) {
            debugLog(`❌ Error calling traitLayers.${method}:`, error);
          }
        }
      });
      
      debugLog("✅ Trait layers force initialization complete");
      return true;
      
    } catch (error) {
      debugLog("❌ Error in forceInitializeTraitLayers:", error);
      return false;
    }
  }
  
  // Function to force initialize project interface
  function forceInitializeProjectInterface() {
    debugLog("🎯 FORCE INITIALIZING PROJECT INTERFACE...");
    
    try {
      const projectInterfaceModule = window.NFTApp.getModule("projectInterface");
      if (!projectInterfaceModule) {
        debugLog("❌ Project interface module not found!");
        return false;
      }
      
      debugLog("✅ Project interface module found");
      
      // Call start method if available
      if (projectInterfaceModule.start && typeof projectInterfaceModule.start === 'function') {
        debugLog("Calling projectInterface.start...");
        try {
          projectInterfaceModule.start(window.currentProject);
          debugLog("✅ projectInterface.start completed");
        } catch (error) {
          debugLog("❌ Error calling projectInterface.start:", error);
        }
      }
      
      debugLog("✅ Project interface force initialization complete");
      return true;
      
    } catch (error) {
      debugLog("❌ Error in forceInitializeProjectInterface:", error);
      return false;
    }
  }
  
  // Main initialization function
  function initializeUltimateTraits() {
    debugLog("🚀 ULTIMATE TRAITS INITIALIZATION STARTED");
    
    const now = Date.now();
    if (now - ultimateState.lastAttempt < 1000) {
      debugLog("⏳ Too soon since last attempt, skipping...");
      return;
    }
    ultimateState.lastAttempt = now;
    
    ultimateState.attempts++;
    debugLog(`🔄 Attempt ${ultimateState.attempts}/${ultimateState.maxAttempts}`);
    
    // Check everything
    const { checks, allReady } = checkEverything();
    
    // Always create missing elements and ensure project data
    createAllMissingElements();
    ensureProjectData();
    
    // If everything is ready, initialize
    if (allReady) {
      debugLog("✅ Everything is ready, initializing...");
      
      const traitLayersSuccess = forceInitializeTraitLayers();
      const projectInterfaceSuccess = forceInitializeProjectInterface();
      
      if (traitLayersSuccess || projectInterfaceSuccess) {
        ultimateState.initialized = true;
        debugLog("🎉 ULTIMATE TRAITS INITIALIZATION SUCCESSFUL!");
        
        // Dispatch success event
        document.dispatchEvent(new CustomEvent('ultimate-traits-initialized', {
          detail: { 
            project: window.currentProject,
            attempts: ultimateState.attempts
          }
        }));
        
        return;
      }
    }
    
    // If not ready or failed, retry
    if (ultimateState.attempts < ultimateState.maxAttempts) {
      debugLog("⏳ Not ready or failed, retrying in 2 seconds...");
      setTimeout(initializeUltimateTraits, 2000);
    } else {
      debugLog("❌ Max attempts reached, forcing initialization anyway...");
      forceInitializeTraitLayers();
      forceInitializeProjectInterface();
    }
  }
  
  // Wait for DOM
  document.addEventListener("DOMContentLoaded", function() {
    debugLog("📄 DOM ready, starting ultimate traits fix...");
    setTimeout(initializeUltimateTraits, 1000);
  });
  
  // Also listen for window load
  window.addEventListener("load", function() {
    debugLog("🌐 Window loaded, ensuring traits are initialized...");
    setTimeout(initializeUltimateTraits, 500);
  });
  
  // Hook into project service
  const originalStartNew = window.NFTApp?.getModule("projectService")?.startNew;
  if (originalStartNew) {
    window.NFTApp.getModule("projectService").startNew = function() {
      debugLog("🆕 New project started, ensuring traits are initialized...");
      const result = originalStartNew.call(this);
      
      // Reset state for new project
      ultimateState.initialized = false;
      ultimateState.attempts = 0;
      
      // Ensure traits are initialized
      setTimeout(initializeUltimateTraits, 1000);
      
      return result;
    };
  }
  
  // Global functions for manual control
  window.forceUltimateTraitsInitialization = function() {
    debugLog("🔧 Manual ultimate traits initialization requested...");
    ultimateState.initialized = false;
    ultimateState.attempts = 0;
    initializeUltimateTraits();
  };
  
  window.checkUltimateTraitsStatus = function() {
    debugLog("📊 ULTIMATE TRAITS STATUS CHECK:");
    const { checks, allReady } = checkEverything();
    debugLog(`🎯 Overall Status: ${allReady ? 'READY' : 'NOT READY'}`);
    debugLog(`🔄 Attempts: ${ultimateState.attempts}/${ultimateState.maxAttempts}`);
    debugLog(`✅ Initialized: ${ultimateState.initialized}`);
    return { checks, allReady, state: ultimateState };
  };
  
  window.toggleUltimateTraitsDebug = function() {
    ultimateState.debugMode = !ultimateState.debugMode;
    debugLog(`🐛 Debug mode: ${ultimateState.debugMode ? 'ON' : 'OFF'}`);
  };
  
  debugLog("🎉 ULTIMATE TRAITS SOLUTION LOADED!");
})();
