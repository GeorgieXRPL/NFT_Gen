/**
 * Project Loading ImageData Fix
 * This script ensures that imageData is properly preserved during project loading
 * by fixing the order of operations and preventing interference from other scripts.
 */
(function() {
  console.log("🔧 Initializing Project Loading ImageData Fix...");

  // Wait for the project service to be available
  function waitForProjectService() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("🔧 Project service not ready, retrying...");
      setTimeout(waitForProjectService, 1000);
      return;
    }

    console.log("✅ Project service found, applying imageData fix...");
    fixProjectLoading(projectService);
  }

  function fixProjectLoading(projectService) {
    // Store the original load function
    const originalLoad = projectService.load;
    
    if (!originalLoad) {
      console.warn("🔧 Original load function not found");
      return;
    }

    // Override the load function to ensure proper imageData handling
    projectService.load = function(event) {
      console.log("🔧 Loading project with imageData preservation fix...");
      
      // Call the original load function
      const result = originalLoad.call(this, event);
      
      // After loading, ensure imageData is properly preserved
      setTimeout(() => {
        console.log("🔧 Post-load imageData verification...");
        verifyAndFixImageData();
      }, 3000); // Wait longer to ensure all loading is complete
      
      return result;
    };

    console.log("✅ Project loading fix applied");
  }

  function verifyAndFixImageData() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🔧 No project data available for verification");
      return;
    }

    console.log("🔧 Verifying imageData in loaded project...");
    
    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithoutImageData = 0;
    const missingTraits = [];

    // Check all traits for imageData
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalTraits++;
          
          if (trait.imageData) {
            traitsWithImageData++;
            console.log(`✅ Trait has imageData: ${layer.name} - ${trait.name}`);
          } else {
            traitsWithoutImageData++;
            missingTraits.push({ trait, layer });
            console.warn(`❌ Trait missing imageData: ${layer.name} - ${trait.name}`);
          }
        }
      }
    }

    const coverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
    console.log(`🔧 ImageData coverage: ${coverage.toFixed(1)}% (${traitsWithImageData}/${totalTraits})`);

    if (coverage < 80) {
      console.warn(`🔧 Low imageData coverage detected: ${coverage.toFixed(1)}%`);
      console.log("🔧 This indicates that imageData was lost during loading");
      
      // Try to restore from alternative sources
      restoreMissingImageData(missingTraits);
    } else {
      console.log("✅ ImageData coverage is good, no action needed");
    }
  }

  function restoreMissingImageData(missingTraits) {
    console.log(`🔧 Attempting to restore imageData for ${missingTraits.length} traits...`);
    
    let restoredCount = 0;
    
    for (const { trait, layer } of missingTraits) {
      // Try to restore from alternative properties
      if (trait.image && typeof trait.image === 'string') {
        trait.imageData = trait.image;
        console.log(`✅ Restored from image property: ${trait.name}`);
        restoredCount++;
      } else if (trait.imageSrc) {
        trait.imageData = trait.imageSrc;
        console.log(`✅ Restored from imageSrc property: ${trait.name}`);
        restoredCount++;
      } else if (trait.src) {
        trait.imageData = trait.src;
        console.log(`✅ Restored from src property: ${trait.name}`);
        restoredCount++;
      } else {
        console.warn(`❌ No alternative imageData source found for: ${trait.name}`);
      }
    }

    console.log(`🔧 Restored imageData for ${restoredCount}/${missingTraits.length} traits`);

    if (restoredCount > 0) {
      console.log("🔧 Saving project to preserve restored imageData...");
      
      // Save the project to preserve the restored imageData
      const projectService = window.NFTApp?.getModule("projectService");
      if (projectService && projectService.save) {
        try {
          // Create a synthetic event for the save function
          const syntheticEvent = {
            preventDefault: () => {},
            target: { files: [] }
          };
          
          projectService.save(syntheticEvent).then(() => {
            console.log("✅ Project saved with restored imageData");
          }).catch(error => {
            console.error("❌ Error saving project:", error);
          });
        } catch (error) {
          console.error("❌ Error saving project:", error);
        }
      }
    }
  }

  // Global function to manually verify imageData
  window.verifyProjectImageData = function() {
    console.log("🔧 Manual imageData verification requested...");
    verifyAndFixImageData();
  };

  // Global function to force imageData restoration
  window.restoreProjectImageData = function() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🔧 No project data available");
      return;
    }

    const missingTraits = [];
    
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData) {
            missingTraits.push({ trait, layer });
          }
        }
      }
    }

    if (missingTraits.length > 0) {
      restoreMissingImageData(missingTraits);
    } else {
      console.log("✅ All traits already have imageData");
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      waitForProjectService();
      console.log("🔧 Project Loading ImageData Fix initialized");
      console.log("Available functions:");
      console.log("  - window.verifyProjectImageData()");
      console.log("  - window.restoreProjectImageData()");
    }, 2000);
  });

  console.log("🔧 Project Loading ImageData Fix ready!");
})();
