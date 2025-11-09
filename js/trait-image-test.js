/**
 * Trait Image Test Script
 * This script provides functions to test and verify trait image availability
 */
(function() {
  console.log("🧪 Initializing Trait Image Test Script...");

  // Test function to check trait image availability
  window.testTraitImages = function() {
    console.log("🧪 TESTING TRAIT IMAGE AVAILABILITY...");
    console.log("=====================================");

    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return false;
    }

    let totalTraits = 0;
    let traitsWithImages = 0;
    let traitsWithoutImages = 0;
    const missingTraits = [];

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        console.log(`\n📁 Layer: ${layer.name}`);
        for (const trait of layer.traits) {
          totalTraits++;
          if (trait.imageData) {
            traitsWithImages++;
            console.log(`  ✅ ${trait.name}: Has imageData`);
          } else {
            traitsWithoutImages++;
            missingTraits.push({ layer: layer.name, trait: trait.name });
            console.log(`  ❌ ${trait.name}: Missing imageData`);
          }
        }
      }
    }

    console.log("\n📊 TEST RESULTS:");
    console.log(`Total traits: ${totalTraits}`);
    console.log(`✅ With images: ${traitsWithImages}`);
    console.log(`❌ Without images: ${traitsWithoutImages}`);
    console.log(`📈 Coverage: ${((traitsWithImages / totalTraits) * 100).toFixed(1)}%`);

    if (missingTraits.length > 0) {
      console.log("\n❌ MISSING TRAITS:");
      missingTraits.forEach(missing => {
        console.log(`  - ${missing.layer}: ${missing.trait}`);
      });
    }

    return {
      total: totalTraits,
      withImages: traitsWithImages,
      withoutImages: traitsWithoutImages,
      coverage: (traitsWithImages / totalTraits) * 100,
      missingTraits: missingTraits
    };
  };

  // Test function to check trait thumbnails in modals
  window.testTraitThumbnails = function() {
    console.log("🧪 TESTING TRAIT THUMBNAILS IN MODALS...");
    console.log("=========================================");

    // Test combination rules modal
    const combinationModal = document.getElementById("combination-rule-modal");
    if (combinationModal) {
      const traitImages = combinationModal.querySelectorAll(".nft-trait-thumb");
      console.log(`\n📋 Combination Rules Modal: ${traitImages.length} trait thumbnails found`);
      
      let workingThumbnails = 0;
      let brokenThumbnails = 0;
      
      traitImages.forEach((img, index) => {
        if (img.src && img.src !== '' && !img.src.includes('data:image/svg')) {
          workingThumbnails++;
          console.log(`  ✅ Thumbnail ${index + 1}: Working`);
        } else {
          brokenThumbnails++;
          console.log(`  ❌ Thumbnail ${index + 1}: Broken or missing`);
        }
      });
      
      console.log(`📊 Thumbnail Status: ${workingThumbnails} working, ${brokenThumbnails} broken`);
    } else {
      console.log("❌ Combination rules modal not found");
    }

    // Test trait layers UI
    const traitLayersContainer = document.querySelector("#traits-rules");
    if (traitLayersContainer) {
      const traitThumbnails = traitLayersContainer.querySelectorAll(".trait-thumbnail, .nft-trait-thumb");
      console.log(`\n📁 Trait Layers UI: ${traitThumbnails.length} trait thumbnails found`);
      
      let workingThumbnails = 0;
      let brokenThumbnails = 0;
      
      traitThumbnails.forEach((img, index) => {
        if (img.src && img.src !== '' && !img.src.includes('data:image/svg')) {
          workingThumbnails++;
          console.log(`  ✅ Thumbnail ${index + 1}: Working`);
        } else {
          brokenThumbnails++;
          console.log(`  ❌ Thumbnail ${index + 1}: Broken or missing`);
        }
      });
      
      console.log(`📊 Thumbnail Status: ${workingThumbnails} working, ${brokenThumbnails} broken`);
    } else {
      console.log("❌ Trait layers container not found");
    }
  };

  // Test function to force restore all trait images
  window.forceRestoreAllTraitImages = function() {
    console.log("🧪 FORCE RESTORING ALL TRAIT IMAGES...");
    console.log("=====================================");

    if (!window.currentProject || !window.currentProject.traits) {
      console.log("❌ No project data available");
      return false;
    }

    let restoredCount = 0;
    let alreadyPresentCount = 0;
    let stillMissingCount = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (trait.imageData) {
            alreadyPresentCount++;
            console.log(`✅ ${trait.name}: Already has imageData`);
          } else {
            // Try to restore from various sources
            let restored = false;
            
            if (trait.image) {
              trait.imageData = trait.image;
              restored = true;
            } else if (trait.imageSrc) {
              trait.imageData = trait.imageSrc;
              restored = true;
            } else if (trait.src) {
              trait.imageData = trait.src;
              restored = true;
            } else if (trait.id) {
              // Try localStorage backup
              const backupKey = `trait_backup_${trait.id}`;
              const backupData = localStorage.getItem(backupKey);
              if (backupData) {
                try {
                  const backup = JSON.parse(backupData);
                  if (backup.imageData) {
                    trait.imageData = backup.imageData;
                    restored = true;
                  }
                } catch (e) {
                  console.warn(`Failed to parse backup for trait: ${trait.name}`);
                }
              }
            }
            
            if (restored) {
              restoredCount++;
              console.log(`✅ ${trait.name}: Restored imageData`);
            } else {
              stillMissingCount++;
              console.log(`❌ ${trait.name}: Cannot restore imageData`);
            }
          }
        }
      }
    }

    console.log("\n📊 RESTORATION RESULTS:");
    console.log(`✅ Already present: ${alreadyPresentCount}`);
    console.log(`🔄 Restored: ${restoredCount}`);
    console.log(`❌ Still missing: ${stillMissingCount}`);
    console.log(`📈 Final coverage: ${(((alreadyPresentCount + restoredCount) / (alreadyPresentCount + restoredCount + stillMissingCount)) * 100).toFixed(1)}%`);

    return {
      alreadyPresent: alreadyPresentCount,
      restored: restoredCount,
      stillMissing: stillMissingCount,
      finalCoverage: ((alreadyPresentCount + restoredCount) / (alreadyPresentCount + restoredCount + stillMissingCount)) * 100
    };
  };

  // Run comprehensive test
  window.runTraitImageTest = function() {
    console.log("🧪 RUNNING COMPREHENSIVE TRAIT IMAGE TEST...");
    console.log("===========================================");
    
    // Test 1: Check trait imageData availability
    const imageTest = window.testTraitImages();
    
    // Test 2: Check trait thumbnails in UI
    window.testTraitThumbnails();
    
    // Test 3: Try to restore missing images
    if (imageTest && imageTest.withoutImages > 0) {
      console.log("\n🔄 Attempting to restore missing images...");
      window.forceRestoreAllTraitImages();
    }
    
    console.log("\n✅ Comprehensive test completed!");
    console.log("Use window.testTraitImages(), window.testTraitThumbnails(), or window.forceRestoreAllTraitImages() for individual tests.");
  };

  console.log("🧪 Trait Image Test Script initialized!");
  console.log("Available functions:");
  console.log("  - window.testTraitImages()");
  console.log("  - window.testTraitThumbnails()");
  console.log("  - window.forceRestoreAllTraitImages()");
  console.log("  - window.runTraitImageTest()");

})();
