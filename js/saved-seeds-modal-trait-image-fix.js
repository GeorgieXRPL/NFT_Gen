/**
 * Saved Seeds Modal Trait Image Fix
 * This script specifically fixes trait image loading in the saved seeds modal
 */
(function() {
  console.log("🔧 Initializing Saved Seeds Modal Trait Image Fix...");

  // Wait for the saved seeds modal to be available
  function waitForSavedSeedsModal() {
    if (window.SavedSeedsModal) {
      console.log("✅ SavedSeedsModal found, applying trait image fix...");
      fixSavedSeedsModalTraitImages();
    } else {
      console.log("🔧 SavedSeedsModal not ready, retrying...");
      setTimeout(waitForSavedSeedsModal, 1000);
      return;
    }
  }

  function fixSavedSeedsModalTraitImages() {
    // Override the getImageForSeed method to ensure trait imageData is available
    const originalGetImageForSeed = window.SavedSeedsModal.prototype.getImageForSeed;
    
    if (originalGetImageForSeed) {
      window.SavedSeedsModal.prototype.getImageForSeed = async function(seed) {
        console.log("🔧 Enhanced getImageForSeed called for:", seed.substring(0, 20) + "...");
        
        // First, ensure all traits have imageData
        await ensureTraitsHaveImageData();
        
        // Call the original method
        const result = await originalGetImageForSeed.call(this, seed);
        
        return result;
      };
      
      console.log("✅ Enhanced getImageForSeed method");
    }

    // Override the loadAndDrawImagesSequentially method to ensure trait imageData
    const originalLoadAndDrawImagesSequentially = window.SavedSeedsModal.prototype.loadAndDrawImagesSequentially;
    
    if (originalLoadAndDrawImagesSequentially) {
      window.SavedSeedsModal.prototype.loadAndDrawImagesSequentially = async function(sortedTraits, projectData, canvas, ctx) {
        console.log("🔧 Enhanced loadAndDrawImagesSequentially called");
        
        // First, ensure all traits have imageData
        await ensureTraitsHaveImageData();
        
        // Call the original method
        const result = await originalLoadAndDrawImagesSequentially.call(this, sortedTraits, projectData, canvas, ctx);
        
        return result;
      };
      
      console.log("✅ Enhanced loadAndDrawImagesSequentially method");
    }

    // Override the renderNFTWithTraits method to ensure trait imageData
    const originalRenderNFTWithTraits = window.SavedSeedsModal.prototype.renderNFTWithTraits;
    
    if (originalRenderNFTWithTraits) {
      window.SavedSeedsModal.prototype.renderNFTWithTraits = async function(traits, projectData) {
        console.log("🔧 Enhanced renderNFTWithTraits called");
        
        // First, ensure all traits have imageData
        await ensureTraitsHaveImageData();
        
        // Call the original method
        const result = await originalRenderNFTWithTraits.call(this, traits, projectData);
        
        return result;
      };
      
      console.log("✅ Enhanced renderNFTWithTraits method");
    }
  }

  async function ensureTraitsHaveImageData() {
    console.log("🔧 Ensuring all traits have imageData...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🔧 No currentProject available");
      return;
    }

    let restoredCount = 0;
    let totalTraits = 0;

    // Ensure all traits in currentProject have imageData
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalTraits++;
          
          if (!trait.imageData && trait.image) {
            trait.imageData = trait.image;
            restoredCount++;
            console.log(`✅ Restored imageData for trait: ${trait.name}`);
          }
        }
      }
    }

    console.log(`🔧 Restored imageData for ${restoredCount}/${totalTraits} traits`);

    // Also ensure the generateNftsUI module has the updated data
    const generateNftsUI = window.NFTApp?.getModule("generateNftsUI");
    if (generateNftsUI && generateNftsUI.projectData) {
      console.log("🔧 Syncing generateNftsUI projectData...");
      
      for (const layer of generateNftsUI.projectData.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            if (!trait.imageData && trait.image) {
              trait.imageData = trait.image;
              console.log(`✅ Synced imageData for trait: ${trait.name}`);
            }
          }
        }
      }
    }
  }

  // Function to force refresh all saved seed thumbnails
  function forceRefreshSavedSeedThumbnails() {
    console.log("🔧 Force refreshing all saved seed thumbnails...");
    
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      const seedCards = savedSeedsModal.querySelectorAll(".seed-card");
      console.log(`🔧 Found ${seedCards.length} seed cards to refresh`);
      
      seedCards.forEach((card, index) => {
        const thumbnail = card.querySelector(".seed-card-thumbnail img");
        if (thumbnail) {
          // Force refresh by temporarily changing src
          const originalSrc = thumbnail.src;
          thumbnail.src = '';
          setTimeout(() => {
            thumbnail.src = originalSrc;
          }, index * 50); // Stagger the refreshes
        }
      });
      
      console.log("✅ Force refreshed all seed card thumbnails");
    } else {
      console.log("ℹ️ Saved seeds modal not open");
    }
  }

  // Function to clear saved seeds image cache
  function clearSavedSeedsImageCache() {
    console.log("🔧 Clearing saved seeds image cache...");
    
    if (window.savedSeedsImageCache) {
      const cacheSize = Object.keys(window.savedSeedsImageCache).length;
      window.savedSeedsImageCache = {};
      console.log(`✅ Cleared ${cacheSize} cached images`);
    }
    
    // Also clear the modal's internal cache
    if (window.SavedSeedsModal && window.SavedSeedsModal.imageCache) {
      const modalCacheSize = Object.keys(window.SavedSeedsModal.imageCache).length;
      window.SavedSeedsModal.imageCache = {};
      console.log(`✅ Cleared ${modalCacheSize} modal cached images`);
    }
  }

  // Global functions
  window.fixSavedSeedsTraitImages = function() {
    console.log("🔧 Manual fix for saved seeds trait images requested...");
    ensureTraitsHaveImageData().then(() => {
      forceRefreshSavedSeedThumbnails();
    });
  };

  window.clearSavedSeedsCache = function() {
    clearSavedSeedsImageCache();
  };

  window.refreshSavedSeedsThumbnails = function() {
    forceRefreshSavedSeedThumbnails();
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      waitForSavedSeedsModal();
      console.log("🔧 Saved Seeds Modal Trait Image Fix initialized");
      console.log("Available functions:");
      console.log("  - window.fixSavedSeedsTraitImages()");
      console.log("  - window.clearSavedSeedsCache()");
      console.log("  - window.refreshSavedSeedsThumbnails()");
    }, 2000);
  });

  console.log("🔧 Saved Seeds Modal Trait Image Fix ready!");
})();
