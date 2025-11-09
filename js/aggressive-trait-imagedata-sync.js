/**
 * Aggressive Trait ImageData Sync
 * This script aggressively syncs trait imageData across all modules and UI components
 * to ensure consistency throughout the app.
 */
(function() {
  console.log("🔧 Initializing Aggressive Trait ImageData Sync...");

  // Function to sync trait imageData across all modules
  function syncTraitImageDataAcrossModules() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🔧 No project data available for sync");
      return;
    }

    console.log("🔧 Aggressively syncing trait imageData across all modules...");
    
    // Create a map of all traits with their imageData
    const traitImageDataMap = new Map();
    
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (trait.imageData) {
            traitImageDataMap.set(trait.id, trait.imageData);
          }
        }
      }
    }
    
    console.log(`🔧 Found ${traitImageDataMap.size} traits with imageData`);
    
    // Sync with all modules that might have trait data
    syncWithGenerateNftsUI(traitImageDataMap);
    syncWithTraitLayers(traitImageDataMap);
    syncWithCombinationRules(traitImageDataMap);
    syncWithSavedSeedsModal(traitImageDataMap);
    syncWithNFTEditModal(traitImageDataMap);
    
    // Force refresh all UI components
    forceRefreshAllUIComponents();
    
    console.log("✅ Aggressive trait imageData sync complete");
  }

  function syncWithGenerateNftsUI(traitImageDataMap) {
    const generateNftsUI = window.NFTApp?.getModule("generateNftsUI");
    if (generateNftsUI && generateNftsUI.projectData) {
      console.log("🔧 Syncing with generateNftsUI...");
      
      for (const layer of generateNftsUI.projectData.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            if (traitImageDataMap.has(trait.id) && !trait.imageData) {
              trait.imageData = traitImageDataMap.get(trait.id);
              console.log(`✅ Synced imageData for trait: ${trait.name}`);
            }
          }
        }
      }
    }
  }

  function syncWithTraitLayers(traitImageDataMap) {
    const traitLayers = window.NFTApp?.getModule("traitLayers");
    if (traitLayers) {
      console.log("🔧 Syncing with traitLayers...");
      
      // Force update the trait layer UI
      if (traitLayers.updateTraitLayerUI) {
        traitLayers.updateTraitLayerUI(window.currentProject);
        console.log("✅ Updated traitLayers UI");
      }
    }
  }

  function syncWithCombinationRules(traitImageDataMap) {
    const combinationRules = window.NFTApp?.getModule("combinationRules");
    if (combinationRules) {
      console.log("🔧 Syncing with combinationRules...");
      
      // Force refresh any cached trait data
      if (combinationRules.refreshTraitData) {
        combinationRules.refreshTraitData(window.currentProject);
        console.log("✅ Updated combinationRules trait data");
      }
    }
  }

  function syncWithSavedSeedsModal(traitImageDataMap) {
    const savedSeedsModal = window.SavedSeedsModal;
    if (savedSeedsModal) {
      console.log("🔧 Syncing with savedSeedsModal...");
      
      // Clear image cache to force refresh
      if (savedSeedsModal.imageCache) {
        savedSeedsModal.imageCache = {};
        console.log("✅ Cleared savedSeedsModal image cache");
      }
    }
  }

  function syncWithNFTEditModal(traitImageDataMap) {
    const nftEditModal = window.NFTApp?.getModule("nftEditModal");
    if (nftEditModal) {
      console.log("🔧 Syncing with nftEditModal...");
      
      // Force refresh if modal is open
      const modal = document.getElementById("nft-edit-modal");
      if (modal && modal.style.display !== 'none') {
        if (nftEditModal.renderNFT) {
          nftEditModal.renderNFT();
          console.log("✅ Refreshed nftEditModal");
        }
      }
    }
  }

  function forceRefreshAllUIComponents() {
    console.log("🔧 Force refreshing all UI components...");
    
    // 1. Force refresh trait layers
    const traitLayersContainer = document.querySelector("#traits-rules");
    if (traitLayersContainer) {
      const traitLayersModule = window.NFTApp?.getModule("traitLayers");
      if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(window.currentProject);
        console.log("✅ Force refreshed trait layers");
      }
    }
    
    // 2. Force refresh combination rules modal if open
    const combinationModal = document.getElementById("combination-rule-modal");
    if (combinationModal && combinationModal.style.display !== 'none') {
      // Trigger a re-render by dispatching a custom event
      const event = new CustomEvent('forceRefreshCombinationRules');
      document.dispatchEvent(event);
      console.log("✅ Force refreshed combination rules modal");
    }
    
    // 3. Force refresh saved seeds modal if open
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      // Trigger a re-render by dispatching a custom event
      const event = new CustomEvent('forceRefreshSavedSeeds');
      document.dispatchEvent(event);
      console.log("✅ Force refreshed saved seeds modal");
    }
    
    // 4. Force refresh NFT edit modal if open
    const nftEditModal = document.getElementById("nft-edit-modal");
    if (nftEditModal && nftEditModal.style.display !== 'none') {
      // Trigger a re-render by dispatching a custom event
      const event = new CustomEvent('forceRefreshNFTEdit');
      document.dispatchEvent(event);
      console.log("✅ Force refreshed NFT edit modal");
    }
    
    // 5. Force refresh any trait selection modals
    const traitSelectionModals = document.querySelectorAll(".trait-selection-modal");
    traitSelectionModals.forEach(modal => {
      if (modal.style.display !== 'none') {
        // Trigger a re-render by dispatching a custom event
        const event = new CustomEvent('forceRefreshTraitSelection');
        document.dispatchEvent(event);
        console.log("✅ Force refreshed trait selection modal");
      }
    });
  }

  // Global function to manually sync trait imageData
  window.syncTraitImageData = function() {
    console.log("🔧 Manual trait imageData sync requested...");
    syncTraitImageDataAcrossModules();
  };

  // Global function to force refresh specific component
  window.forceRefreshComponent = function(componentName) {
    console.log(`🔧 Force refreshing ${componentName}...`);
    
    switch (componentName) {
      case 'traitLayers':
        const traitLayersModule = window.NFTApp?.getModule("traitLayers");
        if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
          traitLayersModule.updateTraitLayerUI(window.currentProject);
        }
        break;
      case 'combinationRules':
        const event1 = new CustomEvent('forceRefreshCombinationRules');
        document.dispatchEvent(event1);
        break;
      case 'savedSeeds':
        const event2 = new CustomEvent('forceRefreshSavedSeeds');
        document.dispatchEvent(event2);
        break;
      case 'nftEdit':
        const event3 = new CustomEvent('forceRefreshNFTEdit');
        document.dispatchEvent(event3);
        break;
      case 'traitSelection':
        const event4 = new CustomEvent('forceRefreshTraitSelection');
        document.dispatchEvent(event4);
        break;
      case 'all':
        forceRefreshAllUIComponents();
        break;
      default:
        console.warn(`Unknown component: ${componentName}`);
    }
  };

  // Auto-sync when project is loaded
  function autoSyncOnProjectLoad() {
    // Listen for project load completion
    const originalSetCurrentProject = window.setCurrentProject;
    if (originalSetCurrentProject) {
      window.setCurrentProject = function(project) {
        const result = originalSetCurrentProject.call(this, project);
        
        // Sync after project is set
        setTimeout(() => {
          syncTraitImageDataAcrossModules();
        }, 1000);
        
        return result;
      };
    }
    
    // Also listen for direct currentProject updates
    let lastProjectHash = null;
    setInterval(() => {
      if (window.currentProject) {
        const currentHash = JSON.stringify(window.currentProject.traits?.map(l => l.id));
        if (currentHash !== lastProjectHash) {
          lastProjectHash = currentHash;
          setTimeout(() => {
            syncTraitImageDataAcrossModules();
          }, 500);
        }
      }
    }, 2000);
  }

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      autoSyncOnProjectLoad();
      console.log("🔧 Aggressive Trait ImageData Sync initialized");
      console.log("Available functions:");
      console.log("  - window.syncTraitImageData()");
      console.log("  - window.forceRefreshComponent('componentName')");
      console.log("  - window.forceRefreshComponent('all')");
    }, 2000);
  });

  console.log("🔧 Aggressive Trait ImageData Sync ready!");
})();
