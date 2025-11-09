/**
 * Direct Saved Seeds Modal Fix
 * This script directly fixes the saved seeds modal by ensuring it can access
 * the captured trait imageData when regenerating NFTs.
 */
(function() {
  console.log("🔧 Initializing Direct Saved Seeds Modal Fix...");

  // Function to fix saved seeds modal data
  function fixSavedSeedsModalData() {
    console.log("🔧 FIXING SAVED SEEDS MODAL DATA...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return;
    }

    // Get the saved seeds modal instance from the DOM
    const savedSeedsModalElement = document.getElementById("saved-seeds-modal");
    if (!savedSeedsModalElement) {
      console.log("❌ Saved seeds modal element not found");
      return;
    }

    // Get the modal instance from the element
    const savedSeedsModalInstance = savedSeedsModalElement.savedSeedsModalInstance;
    if (!savedSeedsModalInstance) {
      console.log("❌ Saved seeds modal instance not found");
      return;
    }

    console.log("✅ Found saved seeds modal instance");

    // Update the instance's project data
    savedSeedsModalInstance.projectData = window.currentProject;
    console.log("✅ Updated saved seeds modal projectData");

    // Clear all caches
    if (window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
      console.log("✅ Cleared saved seeds image cache");
    }

    // Force refresh the modal data
    if (savedSeedsModalInstance.forceRefreshModalData) {
      savedSeedsModalInstance.forceRefreshModalData();
      console.log("✅ Forced refresh of modal data");
    }

    // If modal is open, force re-render
    if (savedSeedsModalElement.style.display !== 'none') {
      console.log("🔧 Modal is open, forcing re-render...");
      
      if (savedSeedsModalInstance.renderPage) {
        savedSeedsModalInstance.renderPage(savedSeedsModalInstance.currentPage || 1);
        console.log("✅ Re-rendered current page");
      }
    }

    console.log("✅ Saved seeds modal data fix complete");
  }

  // Function to enhance the getImageForSeed method
  function enhanceGetImageForSeed() {
    console.log("🔧 ENHANCING GETIMAGEFORSEED METHOD...");
    
    if (!window.SavedSeedsModal) {
      console.log("❌ SavedSeedsModal not found");
      return;
    }

    // Override the getImageForSeed method
    const originalGetImageForSeed = window.SavedSeedsModal.prototype.getImageForSeed;
    
    if (originalGetImageForSeed) {
      window.SavedSeedsModal.prototype.getImageForSeed = async function(seed) {
        console.log("🔧 ENHANCED: getImageForSeed called for:", seed.substring(0, 20) + "...");
        
        // Force clear cache
        if (window.savedSeedsImageCache && window.savedSeedsImageCache[seed]) {
          delete window.savedSeedsImageCache[seed];
          console.log("🔧 Cleared cached image for seed");
        }
        
        // Get the seed data
        const seedData = this.findSeedData(seed);
        if (!seedData) {
          console.log("❌ No seed data found");
          return null;
        }
        
        // Ensure we have current project data with imageData
        const projectData = window.currentProject || this.projectData;
        if (!projectData || !projectData.traits) {
          console.log("❌ No project data available");
          return null;
        }
        
        // Force regenerate using current project data
        const imageData = await this.forceRegenerateNFTWithCurrentData(seedData, projectData);
        return imageData;
      };
      
      console.log("✅ Enhanced getImageForSeed method");
    }

    // Add enhanced regeneration method
    window.SavedSeedsModal.prototype.forceRegenerateNFTWithCurrentData = async function(seedData, projectData) {
      console.log("🔧 FORCE REGENERATING NFT WITH CURRENT DATA for seed:", seedData.seed.substring(0, 20) + "...");
      
      try {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Process traits and ensure they have imageData from current project
        const processedTraits = [];
        
        for (const traitInfo of seedData.traits) {
          const trait = traitInfo.trait;
          const layer = traitInfo.layer;
          
          // Skip 'none' traits
          if (!trait || trait === 'none' || trait.name === 'none' || trait.id === 'none') {
            continue;
          }
          
          // Find the trait in current project data
          const projectLayer = projectData.traits.find(l => 
            l.id === layer?.id || l.name === layer?.name || l.name === layer
          );
          
          if (projectLayer && projectLayer.traits) {
            const projectTrait = projectLayer.traits.find(t => 
              t.id === trait.id || t.name === trait.name
            );
            
            if (projectTrait && projectTrait.imageData) {
              processedTraits.push({
                trait: projectTrait,
                layer: projectLayer,
                order: projectLayer.order || 0
              });
              console.log(`✅ Found trait with imageData: ${projectTrait.name}`);
            } else {
              console.log(`❌ Trait not found or missing imageData: ${trait.name}`);
            }
          } else {
            console.log(`❌ Layer not found: ${layer?.name || layer}`);
          }
        }
        
        // Sort traits by layer order
        processedTraits.sort((a, b) => a.order - b.order);
        
        console.log(`🔧 Processing ${processedTraits.length} traits for rendering`);
        
        // Load and draw images sequentially
        for (const traitInfo of processedTraits) {
          const trait = traitInfo.trait;
          
          if (trait.imageData) {
            console.log(`🔧 Loading image for trait: ${trait.name}`);
            
            try {
              const img = new Image();
              img.crossOrigin = "anonymous";
              
              await new Promise((resolve, reject) => {
                img.onload = () => {
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  console.log(`✅ Drew trait: ${trait.name}`);
                  resolve();
                };
                img.onerror = () => {
                  console.log(`❌ Failed to load image for trait: ${trait.name}`);
                  resolve(); // Continue with next trait
                };
                img.src = trait.imageData;
              });
            } catch (error) {
              console.log(`❌ Error loading trait ${trait.name}:`, error);
            }
          }
        }
        
        // Convert canvas to image data
        const imageData = canvas.toDataURL("image/png");
        
        // Cache the result
        if (!window.savedSeedsImageCache) {
          window.savedSeedsImageCache = {};
        }
        window.savedSeedsImageCache[seedData.seed] = imageData;
        
        console.log("✅ Force regeneration complete");
        return imageData;
        
      } catch (error) {
        console.error("❌ Error in force regeneration:", error);
        return null;
      }
    };

    console.log("✅ Enhanced regeneration method added");
  }

  // Function to force refresh the modal if it's open
  function forceRefreshOpenModal() {
    console.log("🔧 FORCE REFRESHING OPEN MODAL...");
    
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      console.log("🔧 Modal is open, forcing complete refresh...");
      
      const savedSeedsModalInstance = savedSeedsModal.savedSeedsModalInstance;
      if (savedSeedsModalInstance) {
        // Force close and reopen
        if (savedSeedsModalInstance.close) {
          savedSeedsModalInstance.close();
        }
        
        setTimeout(() => {
          if (savedSeedsModalInstance.show) {
            savedSeedsModalInstance.show();
            console.log("✅ Modal reopened with fresh data");
          }
        }, 500);
      }
    } else {
      console.log("ℹ️ Modal is not open");
    }
  }

  // Global functions
  window.fixSavedSeedsModalData = function() {
    return fixSavedSeedsModalData();
  };

  window.enhanceGetImageForSeed = function() {
    return enhanceGetImageForSeed();
  };

  window.forceRefreshOpenModal = function() {
    return forceRefreshOpenModal();
  };

  window.directSavedSeedsFix = function() {
    console.log("🔧 RUNNING DIRECT SAVED SEEDS FIX...");
    fixSavedSeedsModalData();
    enhanceGetImageForSeed();
    forceRefreshOpenModal();
    
    console.log("\n🎯 DIRECT SAVED SEEDS FIX COMPLETE!");
    console.log("The saved seeds modal should now be able to access trait imageData");
    
    return true;
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      console.log("🔧 Direct Saved Seeds Modal Fix initialized");
      console.log("Available functions:");
      console.log("  - window.fixSavedSeedsModalData()");
      console.log("  - window.enhanceGetImageForSeed()");
      console.log("  - window.forceRefreshOpenModal()");
      console.log("  - window.directSavedSeedsFix()");
    }, 2000);
  });

  console.log("🔧 Direct Saved Seeds Modal Fix ready!");
})();
