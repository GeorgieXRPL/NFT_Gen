/**
 * Traits Loading Fix
 * This script ensures traits load properly and handles any initialization issues
 */
(function() {
  console.log("Loading traits loading fix...");
  
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("DOM ready, applying traits loading fix...");
    
    // Function to ensure traits are properly loaded
    function ensureTraitsLoaded() {
      console.log("Checking if traits are properly loaded...");
      
      // Check if we have a current project
      if (!window.currentProject) {
        console.log("No current project found, waiting...");
        setTimeout(ensureTraitsLoaded, 1000);
        return;
      }
      
      // Check if trait layers module is available
      if (!window.NFTApp || !window.NFTApp.getModule || !window.NFTApp.getModule("traitLayers")) {
        console.log("Trait layers module not found, waiting...");
        setTimeout(ensureTraitsLoaded, 1000);
        return;
      }
      
      // Check if the traits tab content exists
      const traitsTab = document.getElementById("traits-rules");
      if (!traitsTab) {
        console.log("Traits tab not found, waiting...");
        setTimeout(ensureTraitsLoaded, 1000);
        return;
      }
      
      // Check if trait layers container exists
      const traitLayersContainer = document.getElementById("trait-layers-container");
      if (!traitLayersContainer) {
        console.log("Trait layers container not found, waiting...");
        setTimeout(ensureTraitsLoaded, 1000);
        return;
      }
      
      console.log("All components found, ensuring traits are set up...");
      
      // Ensure the trait layers module is properly set up
      const traitLayersModule = window.NFTApp.getModule("traitLayers");
      if (traitLayersModule && traitLayersModule.setup) {
        console.log("Setting up trait layers module...");
        traitLayersModule.setup(window.currentProject);
      }
      
      // Force a refresh of the trait layers UI
      if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
        console.log("Updating trait layers UI...");
        traitLayersModule.updateTraitLayerUI(window.currentProject);
      }
      
      console.log("Traits loading fix applied successfully!");
    }
    
    // Start checking after a short delay to allow other modules to initialize
    setTimeout(ensureTraitsLoaded, 2000);
    
    // Also listen for project changes
    const originalStartNew = window.NFTApp?.getModule("projectService")?.startNew;
    if (originalStartNew) {
      window.NFTApp.getModule("projectService").startNew = function() {
        console.log("New project started, ensuring traits are loaded...");
        const result = originalStartNew.call(this);
        
        // Ensure traits are loaded after starting a new project
        setTimeout(ensureTraitsLoaded, 1000);
        
        return result;
      };
    }
  });
  
  // Also add a global function to manually refresh traits
  window.refreshTraits = function() {
    console.log("Manually refreshing traits...");
    
    if (window.currentProject && window.NFTApp?.getModule("traitLayers")) {
      const traitLayersModule = window.NFTApp.getModule("traitLayers");
      if (traitLayersModule.setup) {
        traitLayersModule.setup(window.currentProject);
      }
      if (traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(window.currentProject);
      }
      console.log("Traits refreshed successfully!");
    } else {
      console.log("Cannot refresh traits - project or module not available");
    }
  };
  
  console.log("Traits loading fix loaded successfully!");
})();
