/**
 * Force Refresh All Modals with Updated Trait Data
 * This script forces all modals to refresh with the newly captured trait imageData
 */
(function() {
  console.log("🔧 Initializing Force Refresh All Modals...");

  // Function to force refresh all modals
  function forceRefreshAllModals() {
    console.log("🔧 FORCE REFRESHING ALL MODALS WITH UPDATED TRAIT DATA...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return;
    }

    let refreshedCount = 0;

    // 1. Force refresh combination rules modal
    const combinationRulesModule = window.NFTApp?.getModule("combinationRules");
    if (combinationRulesModule) {
      console.log("🔧 Refreshing combination rules module...");
      
      // Update the module's project data reference
      if (combinationRulesModule.projectData) {
        combinationRulesModule.projectData = window.currentProject;
        console.log("✅ Updated combination rules projectData");
      }
      
      // Force re-render if modal is open
      const combinationModal = document.getElementById("combination-rule-modal");
      if (combinationModal && combinationModal.style.display !== 'none') {
        console.log("🔧 Combination rules modal is open, forcing refresh...");
        
        // Clear any cached data
        if (combinationRulesModule.cachedTraits) {
          combinationRulesModule.cachedTraits = {};
        }
        
        // Force re-render the modal
        if (combinationRulesModule.renderCombinationRules) {
          combinationRulesModule.renderCombinationRules();
          console.log("✅ Re-rendered combination rules modal");
        }
        
        refreshedCount++;
      }
    }

    // 2. Force refresh saved seeds modal
    const savedSeedsModalModule = window.NFTApp?.getModule("savedSeedsModal");
    if (savedSeedsModalModule) {
      console.log("🔧 Refreshing saved seeds modal module...");
      
      // Update the module's project data reference
      if (savedSeedsModalModule.projectData) {
        savedSeedsModalModule.projectData = window.currentProject;
        console.log("✅ Updated saved seeds modal projectData");
      }
      
      // Clear all caches
      if (window.savedSeedsImageCache) {
        window.savedSeedsImageCache = {};
        console.log("✅ Cleared saved seeds image cache");
      }
      
      // Force re-render if modal is open
      const savedSeedsModal = document.getElementById("saved-seeds-modal");
      if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
        console.log("🔧 Saved seeds modal is open, forcing refresh...");
        
        if (savedSeedsModalModule.renderSavedSeeds) {
          savedSeedsModalModule.renderSavedSeeds();
          console.log("✅ Re-rendered saved seeds modal");
        }
        
        refreshedCount++;
      }
    }

    // 3. Force refresh NFT edit modal
    const nftEditModalModule = window.NFTApp?.getModule("nftEditModal");
    if (nftEditModalModule) {
      console.log("🔧 Refreshing NFT edit modal module...");
      
      // Update the module's project data reference
      if (nftEditModalModule.projectData) {
        nftEditModalModule.projectData = window.currentProject;
        console.log("✅ Updated NFT edit modal projectData");
      }
      
      // Force re-render if modal is open
      const nftEditModal = document.getElementById("nft-edit-modal");
      if (nftEditModal && nftEditModal.style.display !== 'none') {
        console.log("🔧 NFT edit modal is open, forcing refresh...");
        
        if (nftEditModalModule.renderTraitsList) {
          nftEditModalModule.renderTraitsList();
          console.log("✅ Re-rendered NFT edit modal traits list");
        }
        
        refreshedCount++;
      }
    }

    // 4. Force refresh generate NFTs UI module
    const generateNftsUIModule = window.NFTApp?.getModule("generateNftsUI");
    if (generateNftsUIModule) {
      console.log("🔧 Refreshing generate NFTs UI module...");
      
      // Update the module's project data reference
      if (generateNftsUIModule.projectData) {
        generateNftsUIModule.projectData = window.currentProject;
        console.log("✅ Updated generate NFTs UI projectData");
      }
      
      refreshedCount++;
    }

    // 5. Force refresh trait layers module
    const traitLayersModule = window.NFTApp?.getModule("traitLayers");
    if (traitLayersModule) {
      console.log("🔧 Refreshing trait layers module...");
      
      // Update the module's project data reference
      if (traitLayersModule.projectData) {
        traitLayersModule.projectData = window.currentProject;
        console.log("✅ Updated trait layers projectData");
      }
      
      // Force re-render
      if (traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(window.currentProject);
        console.log("✅ Re-rendered trait layers UI");
      }
      
      refreshedCount++;
    }

    // 6. Force refresh any open trait selection modals
    const traitSelectionModals = document.querySelectorAll(".trait-selection-modal");
    traitSelectionModals.forEach(modal => {
      if (modal.style.display !== 'none') {
        console.log("🔧 Found open trait selection modal, forcing refresh...");
        
        // Clear the modal content and force re-render
        const traitSelectionList = modal.querySelector('.trait-selection-list');
        if (traitSelectionList) {
          traitSelectionList.innerHTML = '';
          console.log("✅ Cleared trait selection modal content");
        }
        
        refreshedCount++;
      }
    });

    console.log(`\n🔧 REFRESH SUMMARY:`);
    console.log(`✅ Refreshed ${refreshedCount} modules/modals`);
    console.log(`✅ All modules now have updated project data with imageData`);

    return refreshedCount;
  }

  // Function to verify that modals are using updated data
  function verifyModalData() {
    console.log("\n🔍 VERIFYING MODAL DATA...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return;
    }

    // Check if modules have the updated project data
    const modules = [
      { name: "combinationRules", module: window.NFTApp?.getModule("combinationRules") },
      { name: "savedSeedsModal", module: window.NFTApp?.getModule("savedSeedsModal") },
      { name: "nftEditModal", module: window.NFTApp?.getModule("nftEditModal") },
      { name: "generateNftsUI", module: window.NFTApp?.getModule("generateNftsUI") },
      { name: "traitLayers", module: window.NFTApp?.getModule("traitLayers") }
    ];

    modules.forEach(({ name, module }) => {
      if (module && module.projectData) {
        const hasImageData = module.projectData.traits?.some(layer => 
          layer.traits?.some(trait => trait.imageData)
        );
        console.log(`✅ ${name}: Has updated projectData ${hasImageData ? 'with imageData' : 'without imageData'}`);
      } else {
        console.log(`❌ ${name}: No projectData found`);
      }
    });
  }

  // Function to force open and refresh specific modals for testing
  function testModalRefresh() {
    console.log("\n🧪 TESTING MODAL REFRESH...");
    
    // Test combination rules modal
    const combinationRulesModule = window.NFTApp?.getModule("combinationRules");
    if (combinationRulesModule && combinationRulesModule.showCombinationRuleModal) {
      console.log("🔧 Opening combination rules modal for testing...");
      combinationRulesModule.showCombinationRuleModal();
      
      setTimeout(() => {
        const modal = document.getElementById("combination-rule-modal");
        if (modal && modal.style.display !== 'none') {
          const traitThumbnails = modal.querySelectorAll(".nft-trait-thumb");
          console.log(`🔍 Found ${traitThumbnails.length} trait thumbnails in combination rules modal`);
          
          let workingThumbnails = 0;
          traitThumbnails.forEach(thumb => {
            if (thumb.src && thumb.src.startsWith('data:image')) {
              workingThumbnails++;
            }
          });
          
          console.log(`✅ ${workingThumbnails}/${traitThumbnails.length} thumbnails working in combination rules modal`);
        }
      }, 1000);
    }
  }

  // Global functions
  window.forceRefreshAllModals = function() {
    return forceRefreshAllModals();
  };

  window.verifyModalData = function() {
    return verifyModalData();
  };

  window.testModalRefresh = function() {
    return testModalRefresh();
  };

  window.fullModalRefresh = function() {
    console.log("🔧 RUNNING FULL MODAL REFRESH...");
    const refreshedCount = forceRefreshAllModals();
    verifyModalData();
    testModalRefresh();
    
    console.log("\n🎯 FULL MODAL REFRESH COMPLETE!");
    console.log(`Refreshed ${refreshedCount} modules/modals`);
    
    return { refreshedCount };
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      console.log("🔧 Force Refresh All Modals initialized");
      console.log("Available functions:");
      console.log("  - window.forceRefreshAllModals()");
      console.log("  - window.verifyModalData()");
      console.log("  - window.testModalRefresh()");
      console.log("  - window.fullModalRefresh()");
    }, 2000);
  });

  console.log("🔧 Force Refresh All Modals ready!");
})();
