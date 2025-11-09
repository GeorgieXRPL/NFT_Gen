/**
 * DEFINITIVE TRAITS LOADING FIX
 * This script ensures traits load properly by addressing ALL possible issues
 */
(function() {
  console.log("=== DEFINITIVE TRAITS FIX LOADING ===");
  
  // Global state
  let definitiveFixState = {
    initialized: false,
    attempts: 0,
    maxAttempts: 15,
    lastAttempt: 0
  };
  
  // Function to check if everything is ready
  function isEverythingReady() {
    const checks = {
      nftApp: !!(window.NFTApp && window.NFTApp.getModule),
      projectService: !!(window.NFTApp?.getModule("projectService")),
      traitLayers: !!(window.NFTApp?.getModule("traitLayers")),
      projectInterface: !!(window.NFTApp?.getModule("projectInterface")),
      currentProject: !!(window.currentProject),
      traitsTab: !!(document.getElementById("traits-rules")),
      traitLayersContainer: !!(document.getElementById("trait-layers-container")),
      appContainer: !!(document.getElementById("app"))
    };
    
    console.log("=== READINESS CHECK ===");
    Object.entries(checks).forEach(([key, value]) => {
      console.log(`${key}: ${value ? '✓' : '✗'}`);
    });
    
    return Object.values(checks).every(check => check === true);
  }
  
  // Function to create missing elements
  function createMissingElements() {
    console.log("Creating missing elements...");
    
    // Ensure app container exists
    let appContainer = document.getElementById("app");
    if (!appContainer) {
      console.log("Creating app container...");
      appContainer = document.createElement("div");
      appContainer.id = "app";
      document.body.appendChild(appContainer);
    }
    
    // Ensure traits tab exists
    let traitsTab = document.getElementById("traits-rules");
    if (!traitsTab) {
      console.log("Creating traits tab...");
      traitsTab = document.createElement("div");
      traitsTab.id = "traits-rules";
      traitsTab.className = "tab-content";
      traitsTab.style.display = "block";
      
      // Find or create content area
      let contentArea = document.querySelector(".content-area");
      if (!contentArea) {
        contentArea = document.createElement("div");
        contentArea.className = "content-area";
        appContainer.appendChild(contentArea);
      }
      
      contentArea.appendChild(traitsTab);
    }
    
    // Ensure trait layers container exists
    let traitLayersContainer = document.getElementById("trait-layers-container");
    if (!traitLayersContainer) {
      console.log("Creating trait layers container...");
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
    
    console.log("Missing elements created");
  }
  
  // Function to force initialize everything
  function forceInitializeEverything() {
    console.log("=== FORCE INITIALIZING EVERYTHING ===");
    
    try {
      // Create missing elements first
      createMissingElements();
      
      // Ensure we have a current project
      if (!window.currentProject) {
        console.log("Creating default project...");
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
      
      // Force initialize trait layers module
      const traitLayersModule = window.NFTApp.getModule("traitLayers");
      if (traitLayersModule) {
        console.log("Force setting up trait layers module...");
        
        // Call setup if it exists
        if (traitLayersModule.setup) {
          traitLayersModule.setup(window.currentProject);
        }
        
        // Call setupUI if it exists
        if (traitLayersModule.setupUI) {
          traitLayersModule.setupUI(window.currentProject);
        }
        
        // Call updateTraitLayerUI if it exists
        if (traitLayersModule.updateTraitLayerUI) {
          traitLayersModule.updateTraitLayerUI(window.currentProject);
        }
        
        console.log("Trait layers module setup complete");
      } else {
        console.error("Trait layers module not found!");
      }
      
      // Force initialize project interface if needed
      const projectInterfaceModule = window.NFTApp.getModule("projectInterface");
      if (projectInterfaceModule && projectInterfaceModule.start) {
        console.log("Ensuring project interface is started...");
        // Don't call start again if already started, just ensure traits are set up
        if (traitLayersModule && traitLayersModule.setup) {
          traitLayersModule.setup(window.currentProject);
        }
      }
      
      console.log("=== FORCE INITIALIZATION COMPLETE ===");
      return true;
      
    } catch (error) {
      console.error("Error in forceInitializeEverything:", error);
      return false;
    }
  }
  
  // Main initialization function
  function initializeTraitsDefinitively() {
    console.log("=== DEFINITIVE TRAITS INITIALIZATION STARTED ===");
    
    const now = Date.now();
    if (now - definitiveFixState.lastAttempt < 1000) {
      console.log("Too soon since last attempt, skipping...");
      return;
    }
    definitiveFixState.lastAttempt = now;
    
    definitiveFixState.attempts++;
    console.log(`Attempt ${definitiveFixState.attempts}/${definitiveFixState.maxAttempts}`);
    
    // Check if everything is ready
    if (isEverythingReady()) {
      console.log("Everything is ready, initializing...");
      const success = forceInitializeEverything();
      
      if (success) {
        definitiveFixState.initialized = true;
        console.log("=== DEFINITIVE TRAITS INITIALIZATION SUCCESSFUL ===");
        
        // Dispatch event
        document.dispatchEvent(new CustomEvent('traits-definitively-initialized', {
          detail: { project: window.currentProject }
        }));
        
        return;
      }
    }
    
    // If not ready or failed, retry
    if (definitiveFixState.attempts < definitiveFixState.maxAttempts) {
      console.log("Not ready or failed, retrying...");
      setTimeout(initializeTraitsDefinitively, 2000);
    } else {
      console.error("Max attempts reached, forcing initialization anyway...");
      forceInitializeEverything();
    }
  }
  
  // Wait for DOM
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM ready, starting definitive traits fix...");
    setTimeout(initializeTraitsDefinitively, 1000);
  });
  
  // Also listen for window load
  window.addEventListener("load", function() {
    console.log("Window loaded, ensuring traits are initialized...");
    setTimeout(initializeTraitsDefinitively, 500);
  });
  
  // Hook into project service
  const originalStartNew = window.NFTApp?.getModule("projectService")?.startNew;
  if (originalStartNew) {
    window.NFTApp.getModule("projectService").startNew = function() {
      console.log("New project started, ensuring traits are initialized...");
      const result = originalStartNew.call(this);
      
      // Reset state for new project
      definitiveFixState.initialized = false;
      definitiveFixState.attempts = 0;
      
      // Ensure traits are initialized
      setTimeout(initializeTraitsDefinitively, 1000);
      
      return result;
    };
  }
  
  // Global functions for manual control
  window.forceTraitsInitialization = function() {
    console.log("Manual traits initialization requested...");
    definitiveFixState.initialized = false;
    definitiveFixState.attempts = 0;
    initializeTraitsDefinitively();
  };
  
  window.checkTraitsStatus = function() {
    console.log("=== TRAITS STATUS CHECK ===");
    console.log("Everything ready:", isEverythingReady());
    console.log("Initialized:", definitiveFixState.initialized);
    console.log("Attempts:", definitiveFixState.attempts);
    console.log("Current project:", window.currentProject);
    console.log("Trait layers module:", window.NFTApp?.getModule("traitLayers"));
    console.log("Project interface module:", window.NFTApp?.getModule("projectInterface"));
  };
  
  console.log("=== DEFINITIVE TRAITS FIX LOADED ===");
})();
