/**
 * Trait ImageData Diagnostic Script
 * This script diagnoses what's happening with trait imageData throughout the app
 */
(function() {
  console.log("🔍 Initializing Trait ImageData Diagnostic...");

  // Function to diagnose trait imageData status
  function diagnoseTraitImageData() {
    console.log("🔍 DIAGNOSING TRAIT IMAGEDATA STATUS...");
    console.log("==========================================");

    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No currentProject or traits found");
      return;
    }

    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithImage = 0;
    let traitsWithBoth = 0;
    let traitsWithNeither = 0;

    console.log("📊 TRAIT IMAGEDATA ANALYSIS:");
    console.log("=============================");

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        console.log(`\n📁 Layer: ${layer.name} (${layer.traits.length} traits)`);
        
        for (const trait of layer.traits) {
          totalTraits++;
          
          const hasImageData = !!trait.imageData;
          const hasImage = !!trait.image;
          
          if (hasImageData && hasImage) {
            traitsWithBoth++;
            console.log(`  ✅ ${trait.name}: Has both imageData and image`);
          } else if (hasImageData) {
            traitsWithImageData++;
            console.log(`  ✅ ${trait.name}: Has imageData only`);
          } else if (hasImage) {
            traitsWithImage++;
            console.log(`  ⚠️ ${trait.name}: Has image only (no imageData)`);
          } else {
            traitsWithNeither++;
            console.log(`  ❌ ${trait.name}: Has neither imageData nor image`);
          }
        }
      }
    }

    console.log("\n📊 SUMMARY:");
    console.log("============");
    console.log(`Total traits: ${totalTraits}`);
    console.log(`Traits with imageData: ${traitsWithImageData}`);
    console.log(`Traits with image: ${traitsWithImage}`);
    console.log(`Traits with both: ${traitsWithBoth}`);
    console.log(`Traits with neither: ${traitsWithNeither}`);

    // Check UI components
    console.log("\n🖥️ UI COMPONENT CHECK:");
    console.log("=======================");

    // Check trait layers
    const traitLayersContainer = document.querySelector("#traits-rules");
    if (traitLayersContainer) {
      const traitImages = traitLayersContainer.querySelectorAll("img");
      console.log(`Trait Layers: ${traitImages.length} images found`);
      
      let workingImages = 0;
      let brokenImages = 0;
      
      traitImages.forEach((img, index) => {
        if (img.src && img.src !== '' && !img.src.includes('data:image/svg')) {
          workingImages++;
        } else {
          brokenImages++;
        }
      });
      
      console.log(`  - Working images: ${workingImages}`);
      console.log(`  - Broken/missing images: ${brokenImages}`);
    } else {
      console.log("❌ Trait layers container not found");
    }

    // Check combination rules modal
    const combinationModal = document.getElementById("combination-rule-modal");
    if (combinationModal) {
      const traitThumbnails = combinationModal.querySelectorAll(".nft-trait-thumb");
      console.log(`Combination Rules Modal: ${traitThumbnails.length} thumbnails found`);
    } else {
      console.log("ℹ️ Combination rules modal not found (may not be open)");
    }

    // Check saved seeds modal
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal) {
      const seedCards = savedSeedsModal.querySelectorAll(".seed-card");
      console.log(`Saved Seeds Modal: ${seedCards.length} seed cards found`);
    } else {
      console.log("ℹ️ Saved seeds modal not found (may not be open)");
    }
  }

  // Function to check module data
  function checkModuleData() {
    console.log("\n🔍 MODULE DATA CHECK:");
    console.log("=====================");

    // Check generateNftsUI module
    const generateNftsUI = window.NFTApp?.getModule("generateNftsUI");
    if (generateNftsUI) {
      console.log("✅ generateNftsUI module found");
      if (generateNftsUI.projectData) {
        console.log("✅ generateNftsUI has projectData");
        
        let moduleTraitsWithImageData = 0;
        let moduleTotalTraits = 0;
        
        if (generateNftsUI.projectData.traits) {
          for (const layer of generateNftsUI.projectData.traits) {
            if (layer.traits) {
              for (const trait of layer.traits) {
                moduleTotalTraits++;
                if (trait.imageData) {
                  moduleTraitsWithImageData++;
                }
              }
            }
          }
        }
        
        console.log(`  - Module traits with imageData: ${moduleTraitsWithImageData}/${moduleTotalTraits}`);
      } else {
        console.log("❌ generateNftsUI has no projectData");
      }
    } else {
      console.log("❌ generateNftsUI module not found");
    }

    // Check traitLayers module
    const traitLayers = window.NFTApp?.getModule("traitLayers");
    if (traitLayers) {
      console.log("✅ traitLayers module found");
    } else {
      console.log("❌ traitLayers module not found");
    }
  }

  // Function to force restore imageData
  function forceRestoreImageData() {
    console.log("\n🔧 FORCE RESTORING IMAGEDATA...");
    console.log("================================");

    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return;
    }

    let restoredCount = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData && trait.image) {
            trait.imageData = trait.image;
            restoredCount++;
            console.log(`✅ Restored imageData for: ${trait.name}`);
          }
        }
      }
    }

    console.log(`\n🔧 Restored imageData for ${restoredCount} traits`);

    if (restoredCount > 0) {
      console.log("🔧 Forcing UI refresh...");
      
      // Force refresh trait layers
      const traitLayersModule = window.NFTApp?.getModule("traitLayers");
      if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(window.currentProject);
        console.log("✅ Refreshed trait layers UI");
      }
    }
  }

  // Global functions
  window.diagnoseTraitImages = function() {
    diagnoseTraitImageData();
    checkModuleData();
  };

  window.forceRestoreTraitImages = function() {
    forceRestoreImageData();
  };

  window.fullTraitDiagnostic = function() {
    diagnoseTraitImageData();
    checkModuleData();
    forceRestoreImageData();
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      console.log("🔍 Trait ImageData Diagnostic initialized");
      console.log("Available functions:");
      console.log("  - window.diagnoseTraitImages()");
      console.log("  - window.forceRestoreTraitImages()");
      console.log("  - window.fullTraitDiagnostic()");
    }, 2000);
  });

  console.log("🔍 Trait ImageData Diagnostic ready!");
})();
