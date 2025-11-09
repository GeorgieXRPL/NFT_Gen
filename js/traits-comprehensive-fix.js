/**
 * Comprehensive Traits Loading Fix
 * This script ensures traits load properly by addressing all possible initialization issues
 */
(function() {
  console.log("=== COMPREHENSIVE TRAITS FIX LOADING ===");
  
  // Global state tracking
  let traitsFixState = {
    initialized: false,
    retryCount: 0,
    maxRetries: 10,
    lastCheck: 0
  };
  
  // Function to check if all required components are ready
  function areComponentsReady() {
    const checks = {
      nftApp: !!(window.NFTApp && window.NFTApp.getModule),
      projectService: !!(window.NFTApp?.getModule("projectService")),
      traitLayers: !!(window.NFTApp?.getModule("traitLayers")),
      currentProject: !!(window.currentProject),
      traitsTab: !!(document.getElementById("traits-rules")),
      traitLayersContainer: !!(document.getElementById("trait-layers-container"))
    };
    
    console.log("Component readiness check:", checks);
    return Object.values(checks).every(check => check === true);
  }
  
  // Function to force initialize trait layers
  function forceInitializeTraitLayers() {
    console.log("=== FORCE INITIALIZING TRAIT LAYERS ===");
    
    try {
      // Ensure we have a current project
      if (!window.currentProject) {
        console.log("Creating default project structure...");
        window.currentProject = {
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
          }
        };
      }
      
      // Ensure traits array exists
      if (!window.currentProject.traits) {
        window.currentProject.traits = [];
      }
      
      // Get the trait layers module
      const traitLayersModule = window.NFTApp.getModule("traitLayers");
      if (!traitLayersModule) {
        console.error("Trait layers module not found!");
        return false;
      }
      
      // Force setup the trait layers module
      if (traitLayersModule.setup) {
        console.log("Calling traitLayers.setup...");
        traitLayersModule.setup(window.currentProject);
      }
      
      // Force update the UI
      if (traitLayersModule.updateTraitLayerUI) {
        console.log("Calling traitLayers.updateTraitLayerUI...");
        traitLayersModule.updateTraitLayerUI(window.currentProject);
      }
      
      // Ensure the traits tab is visible and active
      const traitsTab = document.getElementById("traits-rules");
      if (traitsTab) {
        traitsTab.style.display = "block";
        console.log("Traits tab made visible");
      }
      
      console.log("=== TRAIT LAYERS FORCE INITIALIZATION COMPLETE ===");
      return true;
      
    } catch (error) {
      console.error("Error in forceInitializeTraitLayers:", error);
      return false;
    }
  }
  
  // Function to create missing UI elements if they don't exist
  function ensureUIElementsExist() {
    console.log("Ensuring UI elements exist...");
    
    // Check if traits tab exists
    let traitsTab = document.getElementById("traits-rules");
    if (!traitsTab) {
      console.log("Creating traits tab...");
      traitsTab = document.createElement("div");
      traitsTab.id = "traits-rules";
      traitsTab.className = "tab-content";
      
      // Find the content area and add the traits tab
      const contentArea = document.querySelector(".content-area");
      if (contentArea) {
        contentArea.appendChild(traitsTab);
      }
    }
    
    // Check if trait layers container exists
    let traitLayersContainer = document.getElementById("trait-layers-container");
    if (!traitLayersContainer) {
      console.log("Creating trait layers container...");
      traitLayersContainer = document.createElement("div");
      traitLayersContainer.id = "trait-layers-container";
      traitLayersContainer.className = "trait-layers-container";
      
      // Add basic structure
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
    
    console.log("UI elements ensured");
  }
  
  // Main initialization function
  function initializeTraitsComprehensive() {
    console.log("=== COMPREHENSIVE TRAITS INITIALIZATION STARTED ===");
    
    // Prevent multiple simultaneous initializations
    if (traitsFixState.initialized) {
      console.log("Traits already initialized, skipping...");
      return;
    }
    
    const now = Date.now();
    if (now - traitsFixState.lastCheck < 1000) {
      console.log("Too soon since last check, skipping...");
      return;
    }
    traitsFixState.lastCheck = now;
    
    // Check if components are ready
    if (!areComponentsReady()) {
      traitsFixState.retryCount++;
      console.log(`Components not ready, retry ${traitsFixState.retryCount}/${traitsFixState.maxRetries}`);
      
      if (traitsFixState.retryCount < traitsFixState.maxRetries) {
        setTimeout(initializeTraitsComprehensive, 2000);
        return;
      } else {
        console.error("Max retries reached, forcing initialization anyway...");
      }
    }
    
    try {
      // Ensure UI elements exist
      ensureUIElementsExist();
      
      // Force initialize trait layers
      const success = forceInitializeTraitLayers();
      
      if (success) {
        traitsFixState.initialized = true;
        console.log("=== COMPREHENSIVE TRAITS INITIALIZATION SUCCESSFUL ===");
        
        // Dispatch custom event to notify other components
        document.dispatchEvent(new CustomEvent('traits-initialized', {
          detail: { project: window.currentProject }
        }));
        
      } else {
        console.error("Traits initialization failed");
      }
      
    } catch (error) {
      console.error("Error in comprehensive traits initialization:", error);
    }
  }
  
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM ready, starting comprehensive traits fix...");
    
    // Start initialization after a short delay
    setTimeout(initializeTraitsComprehensive, 1000);
  });
  
  // Also listen for window load event as backup
  window.addEventListener("load", function() {
    console.log("Window loaded, ensuring traits are initialized...");
    setTimeout(initializeTraitsComprehensive, 500);
  });
  
  // Hook into project service to ensure traits load when starting new projects
  const originalStartNew = window.NFTApp?.getModule("projectService")?.startNew;
  if (originalStartNew) {
    window.NFTApp.getModule("projectService").startNew = function() {
      console.log("New project started, ensuring traits are initialized...");
      const result = originalStartNew.call(this);
      
      // Reset initialization state for new project
      traitsFixState.initialized = false;
      traitsFixState.retryCount = 0;
      
      // Ensure traits are initialized after starting a new project
      setTimeout(initializeTraitsComprehensive, 1000);
      
      return result;
    };
  }
  
  // Global function to manually force traits initialization
  window.forceTraitsInitialization = function() {
    console.log("Manual traits initialization requested...");
    traitsFixState.initialized = false;
    traitsFixState.retryCount = 0;
    initializeTraitsComprehensive();
  };
  
  // Global function to check traits status
  window.checkTraitsStatus = function() {
    console.log("=== TRAITS STATUS CHECK ===");
    console.log("Components ready:", areComponentsReady());
    console.log("Initialized:", traitsFixState.initialized);
    console.log("Retry count:", traitsFixState.retryCount);
    console.log("Current project:", window.currentProject);
    console.log("Trait layers module:", window.NFTApp?.getModule("traitLayers"));
    console.log("Traits tab:", document.getElementById("traits-rules"));
    console.log("Trait layers container:", document.getElementById("trait-layers-container"));
  };
  
  console.log("=== COMPREHENSIVE TRAITS FIX LOADED ===");
})();
