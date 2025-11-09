/**
 * Ultimate Saved Seeds Modal Fix
 * This script completely bypasses the module system and works directly
 * with the global SavedSeedsModal class and DOM elements.
 */
(function() {
  console.log("🚀 Initializing Ultimate Saved Seeds Modal Fix...");

  // Function to find and fix the saved seeds modal instance
  function findAndFixSavedSeedsModal() {
    console.log("🚀 FINDING AND FIXING SAVED SEEDS MODAL...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return false;
    }

    // Method 1: Try to find existing modal element
    let savedSeedsModalElement = document.getElementById("saved-seeds-modal");
    let savedSeedsModalInstance = null;

    if (savedSeedsModalElement && savedSeedsModalElement.savedSeedsModalInstance) {
      savedSeedsModalInstance = savedSeedsModalElement.savedSeedsModalInstance;
      console.log("✅ Found existing modal instance from DOM element");
    } else {
      // Method 2: Try to find global instance
      if (window.SavedSeedsModal) {
        console.log("✅ Found global SavedSeedsModal class");
        
        // Create a new instance if none exists
        if (!window.savedSeedsModalInstance) {
          window.savedSeedsModalInstance = new window.SavedSeedsModal();
          console.log("✅ Created new SavedSeedsModal instance");
        }
        savedSeedsModalInstance = window.savedSeedsModalInstance;
      } else {
        console.log("❌ No SavedSeedsModal class found");
        return false;
      }
    }

    if (!savedSeedsModalInstance) {
      console.log("❌ No modal instance available");
      return false;
    }

    console.log("✅ Found modal instance, updating project data...");

    // Update the instance's project data
    savedSeedsModalInstance.projectData = window.currentProject;
    console.log("✅ Updated modal projectData with current project");

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

    return true;
  }

  // Function to enhance the getImageForSeed method globally
  function enhanceGetImageForSeedGlobally() {
    console.log("🚀 ENHANCING GETIMAGEFORSEED METHOD GLOBALLY...");
    
    if (!window.SavedSeedsModal) {
      console.log("❌ SavedSeedsModal class not found");
      return false;
    }

    // Override the getImageForSeed method
    const originalGetImageForSeed = window.SavedSeedsModal.prototype.getImageForSeed;
    
    if (originalGetImageForSeed) {
      window.SavedSeedsModal.prototype.getImageForSeed = async function(seed) {
        console.log("🚀 ULTIMATE FIX: getImageForSeed called for:", seed.substring(0, 20) + "...");
        
        // Force clear cache
        if (window.savedSeedsImageCache && window.savedSeedsImageCache[seed]) {
          delete window.savedSeedsImageCache[seed];
          console.log("🚀 Cleared cached image for seed");
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
      
      console.log("✅ Enhanced getImageForSeed method globally");
    }

    // Add enhanced regeneration method
    window.SavedSeedsModal.prototype.forceRegenerateNFTWithCurrentData = async function(seedData, projectData) {
      console.log("🚀 FORCE REGENERATING NFT WITH CURRENT DATA for seed:", seedData.seed.substring(0, 20) + "...");
      
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
        
        console.log(`🚀 Processing ${processedTraits.length} traits for rendering`);
        
        // Load and draw images sequentially
        for (const traitInfo of processedTraits) {
          const trait = traitInfo.trait;
          
          if (trait.imageData) {
            console.log(`🚀 Loading image for trait: ${trait.name}`);
            
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

    console.log("✅ Enhanced regeneration method added globally");
    return true;
  }

  // Function to force refresh the modal if it's open
  function forceRefreshOpenModal() {
    console.log("🚀 FORCE REFRESHING OPEN MODAL...");
    
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      console.log("🚀 Modal is open, forcing complete refresh...");
      
      const savedSeedsModalInstance = savedSeedsModal.savedSeedsModalInstance || window.savedSeedsModalInstance;
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
  window.findAndFixSavedSeedsModal = function() {
    return findAndFixSavedSeedsModal();
  };

  window.enhanceGetImageForSeedGlobally = function() {
    return enhanceGetImageForSeedGlobally();
  };

  window.forceRefreshOpenModal = function() {
    return forceRefreshOpenModal();
  };

  window.ultimateSavedSeedsFix = function() {
    console.log("🚀 RUNNING ULTIMATE SAVED SEEDS FIX...");
    
    const fixResult = findAndFixSavedSeedsModal();
    const enhanceResult = enhanceGetImageForSeedGlobally();
    forceRefreshOpenModal();
    
    console.log("\n🎯 ULTIMATE SAVED SEEDS FIX COMPLETE!");
    console.log(`Modal fix: ${fixResult ? 'SUCCESS' : 'FAILED'}`);
    console.log(`Enhancement: ${enhanceResult ? 'SUCCESS' : 'FAILED'}`);
    console.log("The saved seeds modal should now be able to access trait imageData");
    
    return { fixResult, enhanceResult };
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      console.log("🚀 Ultimate Saved Seeds Modal Fix initialized");
      console.log("Available functions:");
      console.log("  - window.findAndFixSavedSeedsModal()");
      console.log("  - window.enhanceGetImageForSeedGlobally()");
      console.log("  - window.forceRefreshOpenModal()");
      console.log("  - window.ultimateSavedSeedsFix()");
    }, 2000);
  });

  console.log("🚀 Ultimate Saved Seeds Modal Fix ready!");
})();


