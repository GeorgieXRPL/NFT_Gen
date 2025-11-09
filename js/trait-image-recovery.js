/**
 * Trait Image Recovery System
 * This script aggressively recovers missing trait images by loading them from file paths
 * and then saving them to the project file for future use.
 */
(function() {
  console.log("🚑 Initializing Trait Image Recovery System...");

  // Configuration
  const config = {
    maxConcurrentLoads: 5,
    retryDelay: 1000,
    maxRetries: 3,
    debugMode: true
  };

  let isRecovering = false;
  let recoveryQueue = [];
  let activeLoads = 0;

  // Function to load image from file path
  function loadImageFromPath(filePath) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        // Convert to data URL
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        const dataURL = canvas.toDataURL('image/png');
        resolve(dataURL);
      };
      
      img.onerror = () => {
        reject(new Error(`Failed to load image: ${filePath}`));
      };
      
      img.src = filePath;
    });
  }

  // Function to recover a single trait image
  async function recoverTraitImage(trait, layer) {
    if (!trait.filePath) {
      console.warn(`🚑 No file path for trait: ${trait.name}`);
      return false;
    }

    try {
      console.log(`🚑 Attempting to recover: ${layer.name} - ${trait.name} from ${trait.filePath}`);
      
      const imageData = await loadImageFromPath(trait.filePath);
      trait.imageData = imageData;
      
      console.log(`✅ Successfully recovered: ${trait.name}`);
      return true;
    } catch (error) {
      console.warn(`❌ Failed to recover ${trait.name}:`, error.message);
      return false;
    }
  }

  // Function to recover all missing trait images
  async function recoverAllMissingTraitImages() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🚑 No project data available for recovery");
      return false;
    }

    if (isRecovering) {
      console.log("🚑 Recovery already in progress");
      return false;
    }

    isRecovering = true;
    console.log("🚑 Starting aggressive trait image recovery...");

    let totalMissing = 0;
    let recoveredCount = 0;
    let failedCount = 0;
    const missingTraits = [];

    // First pass: identify all missing traits
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData && trait.filePath) {
            totalMissing++;
            missingTraits.push({ trait, layer });
          }
        }
      }
    }

    console.log(`🚑 Found ${totalMissing} missing traits to recover`);

    if (totalMissing === 0) {
      console.log("✅ No missing traits found");
      isRecovering = false;
      return true;
    }

    // Process traits in batches to avoid overwhelming the browser
    const batchSize = config.maxConcurrentLoads;
    for (let i = 0; i < missingTraits.length; i += batchSize) {
      const batch = missingTraits.slice(i, i + batchSize);
      
      console.log(`🚑 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(missingTraits.length / batchSize)}`);
      
      const batchPromises = batch.map(async ({ trait, layer }) => {
        const success = await recoverTraitImage(trait, layer);
        if (success) {
          recoveredCount++;
        } else {
          failedCount++;
        }
        return success;
      });

      await Promise.allSettled(batchPromises);
      
      // Small delay between batches
      if (i + batchSize < missingTraits.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`🚑 RECOVERY COMPLETE:`);
    console.log(`✅ Recovered: ${recoveredCount}`);
    console.log(`❌ Failed: ${failedCount}`);
    console.log(`📊 Success rate: ${((recoveredCount / totalMissing) * 100).toFixed(1)}%`);

    // Save the project with recovered images
    if (recoveredCount > 0) {
      console.log("🚑 Saving project with recovered images...");
      await saveProjectWithRecoveredImages();
    }

    isRecovering = false;
    return recoveredCount > 0;
  }

  // Function to save project with recovered images
  async function saveProjectWithRecoveredImages() {
    try {
      const projectService = window.NFTApp?.getModule("projectService");
      if (projectService && projectService.save) {
        // Trigger a save to preserve the recovered images
        console.log("🚑 Triggering project save to preserve recovered images...");
        
        // Create a synthetic event for the save function
        const syntheticEvent = {
          preventDefault: () => {},
          target: { files: [] }
        };
        
        await projectService.save(syntheticEvent);
        console.log("✅ Project saved with recovered images");
      } else {
        console.warn("🚑 Project service not available for saving");
      }
    } catch (error) {
      console.error("🚑 Error saving project:", error);
    }
  }

  // Function to create file paths for traits that don't have them
  function createFilePathsForTraits() {
    if (!window.currentProject || !window.currentProject.traits) return;

    let createdPaths = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.filePath && !trait.imageData) {
            // Create a file path based on trait name
            const fileName = `${trait.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}.png`;
            trait.filePath = fileName;
            createdPaths++;
            console.log(`🚑 Created file path for trait: ${trait.name} -> ${fileName}`);
          }
        }
      }
    }

    if (createdPaths > 0) {
      console.log(`🚑 Created ${createdPaths} file paths for traits`);
    }
  }

  // Function to try loading from common image directories
  async function tryLoadFromCommonPaths(trait) {
    const commonPaths = [
      `images/${trait.name}.png`,
      `images/${trait.name}.jpg`,
      `images/${trait.name}.jpeg`,
      `traits/${trait.name}.png`,
      `traits/${trait.name}.jpg`,
      `assets/${trait.name}.png`,
      `assets/${trait.name}.jpg`,
      `${trait.name}.png`,
      `${trait.name}.jpg`
    ];

    for (const path of commonPaths) {
      try {
        const imageData = await loadImageFromPath(path);
        trait.imageData = imageData;
        trait.filePath = path;
        console.log(`✅ Loaded from common path: ${trait.name} -> ${path}`);
        return true;
      } catch (error) {
        // Continue to next path
      }
    }

    return false;
  }

  // Enhanced recovery function that tries multiple strategies
  async function enhancedRecovery() {
    console.log("🚑 Starting enhanced trait image recovery...");

    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🚑 No project data available");
      return false;
    }

    let recoveredCount = 0;
    let totalMissing = 0;

    // Strategy 1: Try to recover from existing file paths
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData) {
            totalMissing++;
            
            if (trait.filePath) {
              // Try to load from existing file path
              const success = await recoverTraitImage(trait, layer);
              if (success) recoveredCount++;
            } else {
              // Try to load from common paths
              const success = await tryLoadFromCommonPaths(trait);
              if (success) recoveredCount++;
            }
          }
        }
      }
    }

    console.log(`🚑 Enhanced recovery: ${recoveredCount}/${totalMissing} traits recovered`);

    // Strategy 2: Create file paths for remaining traits
    if (recoveredCount < totalMissing) {
      createFilePathsForTraits();
    }

    return recoveredCount > 0;
  }

  // Global functions for manual control
  window.traitImageRecovery = {
    recoverAll: recoverAllMissingTraitImages,
    enhancedRecovery: enhancedRecovery,
    createFilePaths: createFilePathsForTraits,
    isRecovering: () => isRecovering,
    getRecoveryStatus: () => {
      if (!window.currentProject || !window.currentProject.traits) {
        return { total: 0, missing: 0, coverage: 0 };
      }

      let total = 0;
      let missing = 0;

      for (const layer of window.currentProject.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            total++;
            if (!trait.imageData) missing++;
          }
        }
      }

      return {
        total,
        missing,
        coverage: ((total - missing) / total * 100).toFixed(1)
      };
    }
  };

  // Auto-start recovery when project is loaded (DISABLED)
  function startAutoRecovery() {
    console.log("🚑 Auto-recovery disabled to prevent interference with project loading");
    return; // Disabled to prevent conflicts
    
    // Wait for project to be loaded
    const checkInterval = setInterval(() => {
      if (window.currentProject && window.currentProject.traits) {
        clearInterval(checkInterval);
        
        // Check if we need recovery
        const status = window.traitImageRecovery.getRecoveryStatus();
        if (status.missing > 0) {
          console.log(`🚑 Auto-starting recovery for ${status.missing} missing traits...`);
          setTimeout(() => {
            enhancedRecovery();
          }, 3000); // Wait 3 seconds after project load
        }
      }
    }, 1000);

    // Stop checking after 30 seconds
    setTimeout(() => {
      clearInterval(checkInterval);
    }, 30000);
  }

  // Initialize when DOM is ready (DISABLED)
  document.addEventListener("DOMContentLoaded", function() {
    console.log("🚑 DOM ready, but Trait Image Recovery is DISABLED to prevent CORS errors");
    // setTimeout(startAutoRecovery, 2000); // DISABLED
  });

  // Also initialize immediately if DOM is already ready (DISABLED)
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already ready
    console.log("🚑 DOM already ready, but Trait Image Recovery is DISABLED to prevent CORS errors");
    // setTimeout(startAutoRecovery, 2000); // DISABLED
  }

  console.log("🚑 Trait Image Recovery System initialized!");
  console.log("Available functions:");
  console.log("  - window.traitImageRecovery.recoverAll()");
  console.log("  - window.traitImageRecovery.enhancedRecovery()");
  console.log("  - window.traitImageRecovery.getRecoveryStatus()");

})();
