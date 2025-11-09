/**
 * Trait ImageData Propagation Fix
 * This script ensures that trait imageData is properly propagated to all UI components
 * throughout the app after project loading.
 */
(function() {
  console.log("🔧 Initializing Trait ImageData Propagation Fix...");

  // Wait for the project service to be available
  function waitForProjectService() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("🔧 Project service not ready, retrying...");
      setTimeout(waitForProjectService, 1000);
      return;
    }

    console.log("✅ Project service found, applying imageData propagation fix...");
    fixImageDataPropagation(projectService);
  }

  function fixImageDataPropagation(projectService) {
    // Store the original load function
    const originalLoad = projectService.load;
    
    if (!originalLoad) {
      console.warn("🔧 Original load function not found");
      return;
    }

    // Override the load function to ensure proper imageData propagation
    projectService.load = function(event) {
      console.log("🔧 Loading project with imageData propagation fix...");
      
      // Call the original load function
      const result = originalLoad.call(this, event);
      
      // After loading, propagate imageData to all UI components
      setTimeout(() => {
        console.log("🔧 Post-load imageData propagation...");
        propagateImageDataToAllComponents();
      }, 4000); // Wait longer to ensure all loading is complete
      
      return result;
    };

    console.log("✅ ImageData propagation fix applied");
  }

  function propagateImageDataToAllComponents() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🔧 No project data available for propagation");
      return;
    }

    console.log("🔧 Propagating imageData to all UI components...");
    
    // 1. Update all module references to use the current project data
    updateModuleReferences();
    
    // 2. Force refresh all UI components that display traits
    refreshAllTraitDisplays();
    
    // 3. Update cached data in various modules
    updateCachedTraitData();
    
    console.log("✅ ImageData propagation complete");
  }

  function updateModuleReferences() {
    console.log("🔧 Updating module references...");
    
    // Update generateNftsUI module
    const generateNftsUI = window.NFTApp?.getModule("generateNftsUI");
    if (generateNftsUI) {
      generateNftsUI.projectData = window.currentProject;
      console.log("✅ Updated generateNftsUI.projectData");
    }
    
    // Update traitLayers module
    const traitLayers = window.NFTApp?.getModule("traitLayers");
    if (traitLayers) {
      // Force update the trait layer UI
      if (traitLayers.updateTraitLayerUI) {
        traitLayers.updateTraitLayerUI(window.currentProject);
        console.log("✅ Updated traitLayers UI");
      }
    }
    
    // Update combination rules module
    const combinationRules = window.NFTApp?.getModule("combinationRules");
    if (combinationRules) {
      // Force refresh any cached trait data
      if (combinationRules.refreshTraitData) {
        combinationRules.refreshTraitData(window.currentProject);
        console.log("✅ Updated combinationRules trait data");
      }
    }
  }

  function refreshAllTraitDisplays() {
    console.log("🔧 Refreshing all trait displays...");
    
    // 1. Refresh trait layers display
    refreshTraitLayersDisplay();
    
    // 2. Refresh combination rules modal if open
    refreshCombinationRulesModal();
    
    // 3. Refresh saved seeds modal if open
    refreshSavedSeedsModal();
    
    // 4. Refresh NFT edit modal if open
    refreshNFTEditModal();
    
    // 5. Refresh trait selection modals
    refreshTraitSelectionModals();
  }

  function refreshTraitLayersDisplay() {
    const traitLayersContainer = document.querySelector("#traits-rules");
    if (traitLayersContainer) {
      // Force re-render of trait layers
      const traitLayersModule = window.NFTApp?.getModule("traitLayers");
      if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(window.currentProject);
        console.log("✅ Refreshed trait layers display");
      }
    }
  }

  function refreshCombinationRulesModal() {
    const combinationModal = document.getElementById("combination-rule-modal");
    if (combinationModal && combinationModal.style.display !== 'none') {
      // Force refresh trait thumbnails in the modal
      const traitThumbnails = combinationModal.querySelectorAll(".nft-trait-thumb");
      traitThumbnails.forEach(thumbnail => {
        const traitId = thumbnail.closest('[data-trait-id]')?.dataset.traitId;
        if (traitId) {
          const trait = findTraitById(traitId);
          if (trait && trait.imageData) {
            thumbnail.src = trait.imageData;
          }
        }
      });
      console.log("✅ Refreshed combination rules modal");
    }
  }

  function refreshSavedSeedsModal() {
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      // Force refresh all seed card thumbnails
      const seedCards = savedSeedsModal.querySelectorAll(".seed-card");
      seedCards.forEach(card => {
        const thumbnail = card.querySelector(".seed-card-thumbnail img");
        if (thumbnail && thumbnail.src && thumbnail.src.includes('data:image')) {
          // Force refresh by temporarily changing src
          const originalSrc = thumbnail.src;
          thumbnail.src = '';
          setTimeout(() => {
            thumbnail.src = originalSrc;
          }, 10);
        }
      });
      console.log("✅ Refreshed saved seeds modal");
    }
  }

  function refreshNFTEditModal() {
    const nftEditModal = document.getElementById("nft-edit-modal");
    if (nftEditModal && nftEditModal.style.display !== 'none') {
      // Force refresh trait thumbnails in the modal
      const traitThumbnails = nftEditModal.querySelectorAll(".nft-trait-thumb");
      traitThumbnails.forEach(thumbnail => {
        const traitId = thumbnail.closest('[data-trait-id]')?.dataset.traitId;
        if (traitId) {
          const trait = findTraitById(traitId);
          if (trait && trait.imageData) {
            thumbnail.src = trait.imageData;
          }
        }
      });
      console.log("✅ Refreshed NFT edit modal");
    }
  }

  function refreshTraitSelectionModals() {
    // Find any open trait selection modals
    const traitSelectionModals = document.querySelectorAll(".trait-selection-modal");
    traitSelectionModals.forEach(modal => {
      if (modal.style.display !== 'none') {
        const traitThumbnails = modal.querySelectorAll(".trait-selection-thumb img");
        traitThumbnails.forEach(thumbnail => {
          const traitId = thumbnail.closest('[data-trait-id]')?.dataset.traitId;
          if (traitId) {
            const trait = findTraitById(traitId);
            if (trait && trait.imageData) {
              thumbnail.src = trait.imageData;
            }
          }
        });
      }
    });
    console.log("✅ Refreshed trait selection modals");
  }

  function updateCachedTraitData() {
    console.log("🔧 Updating cached trait data...");
    
    // Update global trait change timestamp to force cache refresh
    if (window.traitChangeTimestamp !== undefined) {
      window.traitChangeTimestamp = Date.now();
      console.log("✅ Updated trait change timestamp");
    }
    
    // Clear any cached image data that might be stale
    if (window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
      console.log("✅ Cleared saved seeds image cache");
    }
    
    // Force refresh of any cached trait data in modules
    const savedSeedsModal = window.SavedSeedsModal;
    if (savedSeedsModal && savedSeedsModal.imageCache) {
      savedSeedsModal.imageCache = {};
      console.log("✅ Cleared saved seeds modal image cache");
    }
  }

  function findTraitById(traitId) {
    if (!window.currentProject || !window.currentProject.traits) {
      return null;
    }
    
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (trait.id === traitId) {
            return trait;
          }
        }
      }
    }
    
    return null;
  }

  // Global function to manually propagate imageData
  window.propagateTraitImageData = function() {
    console.log("🔧 Manual imageData propagation requested...");
    propagateImageDataToAllComponents();
  };

  // Global function to refresh specific UI component
  window.refreshTraitDisplay = function(componentName) {
    console.log(`🔧 Refreshing ${componentName} trait display...`);
    
    switch (componentName) {
      case 'traitLayers':
        refreshTraitLayersDisplay();
        break;
      case 'combinationRules':
        refreshCombinationRulesModal();
        break;
      case 'savedSeeds':
        refreshSavedSeedsModal();
        break;
      case 'nftEdit':
        refreshNFTEditModal();
        break;
      case 'traitSelection':
        refreshTraitSelectionModals();
        break;
      case 'all':
        refreshAllTraitDisplays();
        break;
      default:
        console.warn(`Unknown component: ${componentName}`);
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      waitForProjectService();
      console.log("🔧 Trait ImageData Propagation Fix initialized");
      console.log("Available functions:");
      console.log("  - window.propagateTraitImageData()");
      console.log("  - window.refreshTraitDisplay('componentName')");
      console.log("  - window.refreshTraitDisplay('all')");
    }, 2000);
  });

  console.log("🔧 Trait ImageData Propagation Fix ready!");
})();
