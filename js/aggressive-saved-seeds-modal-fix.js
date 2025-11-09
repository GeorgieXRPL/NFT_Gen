/**
 * Aggressive Saved Seeds Modal Fix
 * This script aggressively fixes the saved seeds modal by forcing it to use
 * the current project's trait data with proper imageData.
 */
(function() {
  console.log("🔧 Initializing Aggressive Saved Seeds Modal Fix...");

  // Wait for the saved seeds modal to be available
  function waitForSavedSeedsModal() {
    if (window.SavedSeedsModal) {
      console.log("✅ SavedSeedsModal found, applying aggressive fix...");
      applyAggressiveFix();
    } else {
      console.log("🔧 SavedSeedsModal not ready, retrying...");
      setTimeout(waitForSavedSeedsModal, 1000);
      return;
    }
  }

  function applyAggressiveFix() {
    // Override the getImageForSeed method completely
    const originalGetImageForSeed = window.SavedSeedsModal.prototype.getImageForSeed;
    
    if (originalGetImageForSeed) {
      window.SavedSeedsModal.prototype.getImageForSeed = async function(seed) {
        console.log("🔧 AGGRESSIVE FIX: getImageForSeed called for:", seed.substring(0, 20) + "...");
        
        // Force clear cache to ensure fresh rendering
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
        
        // Force regenerate using current project data
        const imageData = await this.forceRegenerateNFT(seedData);
        return imageData;
      };
      
      console.log("✅ Applied aggressive getImageForSeed override");
    }

    // Add force regeneration method
    window.SavedSeedsModal.prototype.forceRegenerateNFT = async function(seedData) {
      console.log("🔧 FORCE REGENERATING NFT for seed:", seedData.seed.substring(0, 20) + "...");
      
      try {
        // Get current project data
        const projectData = window.currentProject || window.NFTApp?.getModule('generateNftsUI')?.projectData;
        if (!projectData || !projectData.traits) {
          console.log("❌ No project data available");
          return null;
        }
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Process traits and ensure they have imageData
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
            
            if (projectTrait) {
              // Ensure the trait has imageData
              if (!projectTrait.imageData && projectTrait.image) {
                projectTrait.imageData = projectTrait.image;
                console.log(`✅ Restored imageData for trait: ${projectTrait.name}`);
              }
              
              if (projectTrait.imageData) {
                processedTraits.push({
                  trait: projectTrait,
                  layer: projectLayer,
                  order: projectLayer.order || 0
                });
                console.log(`✅ Added trait: ${projectTrait.name} with imageData`);
              } else {
                console.log(`❌ Trait ${projectTrait.name} has no imageData`);
              }
            } else {
              console.log(`❌ Trait not found in project: ${trait.name}`);
            }
          } else {
            console.log(`❌ Layer not found in project: ${layer?.name || layer}`);
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

    // Add helper method to find seed data
    window.SavedSeedsModal.prototype.findSeedData = function(seed) {
      // Look in various places for seed data
      if (this.seedList && this.seedList.length > 0) {
        const found = this.seedList.find(s => s.seed === seed);
        if (found) return found;
      }
      
      if (window.currentProject && window.currentProject.savedSeeds) {
        const found = window.currentProject.savedSeeds.find(s => s.seed === seed);
        if (found) return found;
      }
      
      // Try localStorage
      try {
        const seedListKey = 'nftcc_seedList_' + encodeURIComponent(window.currentProject?.name || 'default');
        const storedSeeds = localStorage.getItem(seedListKey);
        if (storedSeeds) {
          const seeds = JSON.parse(storedSeeds);
          const found = seeds.find(s => s.seed === seed);
          if (found) return found;
        }
      } catch (error) {
        console.log("Error reading from localStorage:", error);
      }
      
      return null;
    };
  }

  // Function to force refresh all saved seed thumbnails
  function forceRefreshAllThumbnails() {
    console.log("🔧 FORCE REFRESHING ALL SAVED SEED THUMBNAILS...");
    
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      const seedCards = savedSeedsModal.querySelectorAll(".seed-card");
      console.log(`🔧 Found ${seedCards.length} seed cards to refresh`);
      
      // Clear all cached images
      if (window.savedSeedsImageCache) {
        window.savedSeedsImageCache = {};
        console.log("🔧 Cleared all cached images");
      }
      
      // Force reload each thumbnail
      seedCards.forEach((card, index) => {
        const thumbnail = card.querySelector(".seed-card-thumbnail img");
        if (thumbnail) {
          // Remove the image to force reload
          thumbnail.src = '';
          thumbnail.style.display = 'none';
          
          // Trigger reload after a delay
          setTimeout(() => {
            const seedElement = card.querySelector('.seed-card-seed');
            if (seedElement) {
              const seed = seedElement.textContent.trim();
              console.log(`🔧 Reloading thumbnail for seed: ${seed.substring(0, 20)}...`);
              
              // Trigger the loadThumbnail method
              if (window.SavedSeedsModal && window.SavedSeedsModal.loadThumbnail) {
                window.SavedSeedsModal.loadThumbnail(card, seed, true);
              }
            }
          }, index * 100); // Stagger the reloads
        }
      });
      
      console.log("✅ Force refresh initiated for all thumbnails");
    } else {
      console.log("ℹ️ Saved seeds modal not open");
    }
  }

  // Global functions
  window.forceRefreshSavedSeeds = function() {
    forceRefreshAllThumbnails();
  };

  window.clearAllSavedSeedsCache = function() {
    if (window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
      console.log("✅ Cleared all saved seeds cache");
    }
  };

  window.forceRegenerateAllSavedSeeds = function() {
    console.log("🔧 FORCE REGENERATING ALL SAVED SEEDS...");
    
    // Clear cache first
    window.clearAllSavedSeedsCache();
    
    // Force refresh all thumbnails
    window.forceRefreshSavedSeeds();
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      waitForSavedSeedsModal();
      console.log("🔧 Aggressive Saved Seeds Modal Fix initialized");
      console.log("Available functions:");
      console.log("  - window.forceRefreshSavedSeeds()");
      console.log("  - window.clearAllSavedSeedsCache()");
      console.log("  - window.forceRegenerateAllSavedSeeds()");
    }, 2000);
  });

  console.log("🔧 Aggressive Saved Seeds Modal Fix ready!");
})();
