/**
 * Simple Trait Loading Diagnostic
 * This script provides a simple way to check what's happening with trait loading
 */
(function() {
  console.log("🔍 Initializing Simple Trait Loading Diagnostic...");

  // Simple function to check trait data
  function checkTraitData() {
    console.log("🔍 SIMPLE TRAIT DATA CHECK");
    console.log("==========================");

    if (!window.currentProject) {
      console.log("❌ No currentProject found");
      return;
    }

    if (!window.currentProject.traits) {
      console.log("❌ No traits in currentProject");
      return;
    }

    console.log(`📊 Project: ${window.currentProject.name}`);
    console.log(`📊 Total layers: ${window.currentProject.traits.length}`);

    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithImage = 0;
    let traitsWithNeither = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        console.log(`\n📁 Layer: ${layer.name} (${layer.traits.length} traits)`);
        
        for (const trait of layer.traits) {
          totalTraits++;
          
          const hasImageData = !!trait.imageData;
          const hasImage = !!trait.image;
          
          if (hasImageData) {
            traitsWithImageData++;
            console.log(`  ✅ ${trait.name}: Has imageData`);
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
    console.log(`Total traits: ${totalTraits}`);
    console.log(`Traits with imageData: ${traitsWithImageData}`);
    console.log(`Traits with image only: ${traitsWithImage}`);
    console.log(`Traits with neither: ${traitsWithNeither}`);
  }

  // Simple function to check UI elements
  function checkUIElements() {
    console.log("\n🔍 UI ELEMENTS CHECK");
    console.log("====================");

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
          if (index < 5) { // Show first 5 for debugging
            console.log(`  ✅ Image ${index + 1}: ${img.src.substring(0, 50)}...`);
          }
        } else {
          brokenImages++;
          if (index < 5) { // Show first 5 for debugging
            console.log(`  ❌ Image ${index + 1}: No src or broken`);
          }
        }
      });
      
      console.log(`  Working images: ${workingImages}`);
      console.log(`  Broken images: ${brokenImages}`);
    } else {
      console.log("❌ Trait layers container not found");
    }

    // Check saved seeds modal
    const savedSeedsModal = document.getElementById("saved-seeds-modal");
    if (savedSeedsModal) {
      const seedCards = savedSeedsModal.querySelectorAll(".seed-card");
      console.log(`Saved Seeds Modal: ${seedCards.length} seed cards found`);
      
      if (seedCards.length > 0) {
        const firstCard = seedCards[0];
        const thumbnail = firstCard.querySelector(".seed-card-thumbnail img");
        if (thumbnail) {
          console.log(`  First thumbnail src: ${thumbnail.src ? thumbnail.src.substring(0, 50) + '...' : 'No src'}`);
        }
      }
    } else {
      console.log("ℹ️ Saved seeds modal not found (may not be open)");
    }
  }

  // Simple function to force restore imageData
  function forceRestoreImageData() {
    console.log("\n🔧 FORCE RESTORING IMAGEDATA");
    console.log("============================");

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

  // Simple function to check what's in the project file
  function checkProjectFile() {
    console.log("\n🔍 PROJECT FILE CHECK");
    console.log("====================");

    if (!window.currentProject) {
      console.log("❌ No currentProject available");
      return;
    }

    console.log("Project file structure:");
    console.log(`- Name: ${window.currentProject.name}`);
    console.log(`- Description: ${window.currentProject.description}`);
    console.log(`- Total Supply: ${window.currentProject.totalSupply}`);
    console.log(`- Traits layers: ${window.currentProject.traits?.length || 0}`);
    console.log(`- Saved seeds: ${window.currentProject.savedSeeds?.length || 0}`);

    if (window.currentProject.traits && window.currentProject.traits.length > 0) {
      const firstLayer = window.currentProject.traits[0];
      console.log(`\nFirst layer example: ${firstLayer.name}`);
      console.log(`- Layer ID: ${firstLayer.id}`);
      console.log(`- Traits count: ${firstLayer.traits?.length || 0}`);
      
      if (firstLayer.traits && firstLayer.traits.length > 0) {
        const firstTrait = firstLayer.traits[0];
        console.log(`\nFirst trait example: ${firstTrait.name}`);
        console.log(`- Trait ID: ${firstTrait.id}`);
        console.log(`- Has imageData: ${!!firstTrait.imageData}`);
        console.log(`- Has image: ${!!firstTrait.image}`);
        console.log(`- Has filePath: ${!!firstTrait.filePath}`);
        console.log(`- Has fileName: ${!!firstTrait.fileName}`);
        
        if (firstTrait.imageData) {
          console.log(`- imageData length: ${firstTrait.imageData.length}`);
          console.log(`- imageData type: ${firstTrait.imageData.substring(0, 20)}...`);
        }
      }
    }
  }

  // Global functions
  window.simpleTraitCheck = function() {
    checkTraitData();
    checkUIElements();
    checkProjectFile();
  };

  window.simpleRestoreTraits = function() {
    forceRestoreImageData();
  };

  window.simpleFullCheck = function() {
    checkTraitData();
    checkUIElements();
    checkProjectFile();
    forceRestoreImageData();
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      console.log("🔍 Simple Trait Loading Diagnostic initialized");
      console.log("Available functions:");
      console.log("  - window.simpleTraitCheck()");
      console.log("  - window.simpleRestoreTraits()");
      console.log("  - window.simpleFullCheck()");
    }, 2000);
  });

  console.log("🔍 Simple Trait Loading Diagnostic ready!");
})();
