/**
 * Trait Image Capture and Save Fix
 * This script captures the currently displayed trait images and saves them back to the trait objects
 */
(function() {
  console.log("🔧 Initializing Trait Image Capture and Save Fix...");

  // Function to capture and save trait images
  function captureAndSaveTraitImages() {
    console.log("🔧 CAPTURING AND SAVING TRAIT IMAGES...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return;
    }

    let capturedCount = 0;
    let skippedCount = 0;

    // Get all trait images from the UI
    const traitImages = document.querySelectorAll("#traits-rules img");
    console.log(`🔧 Found ${traitImages.length} trait images in UI`);

    // Create a map of trait images by their alt text (trait name)
    const imageMap = new Map();
    traitImages.forEach(img => {
      if (img.src && img.src.startsWith('data:image') && img.alt) {
        imageMap.set(img.alt, img.src);
      }
    });

    console.log(`🔧 Mapped ${imageMap.size} images by trait name`);

    // Update trait objects with captured images
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          const imageData = imageMap.get(trait.name);
          if (imageData) {
            trait.imageData = imageData;
            capturedCount++;
            console.log(`✅ Captured image for: ${trait.name}`);
          } else {
            skippedCount++;
            console.log(`❌ No image found for: ${trait.name}`);
          }
        }
      }
    }

    console.log(`\n🔧 CAPTURE SUMMARY:`);
    console.log(`✅ Captured: ${capturedCount} traits`);
    console.log(`❌ Skipped: ${skippedCount} traits`);

    if (capturedCount > 0) {
      console.log("🔧 Forcing UI refresh after capture...");
      
      // Force refresh trait layers
      const traitLayersModule = window.NFTApp?.getModule("traitLayers");
      if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(window.currentProject);
        console.log("✅ Refreshed trait layers UI");
      }

      // Force refresh other modules
      const generateNftsUIModule = window.NFTApp?.getModule("generateNftsUI");
      if (generateNftsUIModule && generateNftsUIModule.projectData) {
        generateNftsUIModule.projectData = window.currentProject;
        console.log("✅ Updated generateNftsUI projectData");
      }

      // Force refresh combination rules
      const combinationRulesModule = window.NFTApp?.getModule("combinationRules");
      if (combinationRulesModule && combinationRulesModule.projectData) {
        combinationRulesModule.projectData = window.currentProject;
        console.log("✅ Updated combinationRules projectData");
      }

      // Force refresh saved seeds modal
      const savedSeedsModalModule = window.NFTApp?.getModule("savedSeedsModal");
      if (savedSeedsModalModule && savedSeedsModalModule.projectData) {
        savedSeedsModalModule.projectData = window.currentProject;
        console.log("✅ Updated savedSeedsModal projectData");
      }

      console.log("✅ All modules updated with captured trait images");
    }

    return { captured: capturedCount, skipped: skippedCount };
  }

  // Function to verify the capture worked
  function verifyCapture() {
    console.log("\n🔍 VERIFYING CAPTURE...");
    
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return;
    }

    let totalTraits = 0;
    let traitsWithImageData = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalTraits++;
          if (trait.imageData) {
            traitsWithImageData++;
          }
        }
      }
    }

    const coverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
    console.log(`📊 VERIFICATION RESULTS:`);
    console.log(`Total traits: ${totalTraits}`);
    console.log(`Traits with imageData: ${traitsWithImageData}`);
    console.log(`Coverage: ${coverage.toFixed(1)}%`);

    if (coverage >= 80) {
      console.log("✅ SUCCESS: High coverage achieved!");
    } else if (coverage >= 50) {
      console.log("⚠️ PARTIAL: Moderate coverage achieved");
    } else {
      console.log("❌ FAILED: Low coverage");
    }

    return { total: totalTraits, withImageData: traitsWithImageData, coverage };
  }

  // Function to force refresh all UI components
  function forceRefreshAllUI() {
    console.log("\n🔄 FORCING REFRESH OF ALL UI COMPONENTS...");
    
    // Clear all caches
    if (window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
      console.log("✅ Cleared saved seeds image cache");
    }

    // Force refresh trait layers
    const traitLayersModule = window.NFTApp?.getModule("traitLayers");
    if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
      traitLayersModule.updateTraitLayerUI(window.currentProject);
      console.log("✅ Refreshed trait layers UI");
    }

    // Force refresh combination rules
    const combinationRulesModule = window.NFTApp?.getModule("combinationRules");
    if (combinationRulesModule && combinationRulesModule.renderCombinationRules) {
      combinationRulesModule.renderCombinationRules();
      console.log("✅ Refreshed combination rules UI");
    }

    // Force refresh saved seeds modal if open
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal && savedSeedsModal.style.display !== 'none') {
      const savedSeedsModalModule = window.NFTApp?.getModule("savedSeedsModal");
      if (savedSeedsModalModule && savedSeedsModalModule.renderSavedSeeds) {
        savedSeedsModalModule.renderSavedSeeds();
        console.log("✅ Refreshed saved seeds modal");
      }
    }

    console.log("✅ All UI components refreshed");
  }

  // Global functions
  window.captureTraitImages = function() {
    return captureAndSaveTraitImages();
  };

  window.verifyTraitCapture = function() {
    return verifyCapture();
  };

  window.refreshAllUI = function() {
    forceRefreshAllUI();
  };

  window.fullTraitImageFix = function() {
    console.log("🔧 RUNNING FULL TRAIT IMAGE FIX...");
    const captureResult = captureAndSaveTraitImages();
    const verifyResult = verifyCapture();
    forceRefreshAllUI();
    
    console.log("\n🎯 FULL FIX COMPLETE!");
    console.log(`Captured: ${captureResult.captured} traits`);
    console.log(`Coverage: ${verifyResult.coverage.toFixed(1)}%`);
    
    return { capture: captureResult, verify: verifyResult };
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      console.log("🔧 Trait Image Capture and Save Fix initialized");
      console.log("Available functions:");
      console.log("  - window.captureTraitImages()");
      console.log("  - window.verifyTraitCapture()");
      console.log("  - window.refreshAllUI()");
      console.log("  - window.fullTraitImageFix()");
    }, 2000);
  });

  console.log("🔧 Trait Image Capture and Save Fix ready!");
})();
