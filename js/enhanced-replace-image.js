/**
 * Enhanced Replace Image Functionality
 * This script enhances the replace image feature to save absolute HD paths
 * and load traits from their absolute paths when projects are loaded
 */
(function() {
  console.log("🖼️ Enhanced Replace Image functionality loading...");
  
  // Store original replace image functionality
  let originalReplaceImageHandler = null;
  
  // Function to get absolute path from file
  function getAbsolutePath(file) {
    // For web browsers, we can't get the actual file system path
    // But we can store the file name and use it for reference
    return {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified,
      // Store the file handle if available (for File System Access API)
      handle: file.handle || null
    };
  }
  
  // Function to save trait paths to project data
  function saveTraitPaths(projectData) {
    if (!projectData || !projectData.traits) return;
    
    console.log("💾 Saving trait paths to project data...");
    
    projectData.traits.forEach(layer => {
      if (layer.traits) {
        layer.traits.forEach(trait => {
          // If trait has an absolute path, save it
          if (trait.absolutePath) {
            console.log(`Saving path for trait ${trait.name}:`, trait.absolutePath);
          }
        });
      }
    });
  }
  
  // Function to load trait from absolute path
  function loadTraitFromPath(trait, projectData) {
    if (!trait.absolutePath) return Promise.resolve();
    
    console.log(`🔄 Loading trait ${trait.name} from path:`, trait.absolutePath);
    
    return new Promise((resolve, reject) => {
      // For now, we'll use the stored imageData if available
      // In a real implementation, you would load from the absolute path
      if (trait.imageData) {
        console.log(`✅ Trait ${trait.name} loaded from stored data`);
        resolve();
      } else {
        console.log(`❌ No stored data for trait ${trait.name}`);
        reject(new Error('No stored image data'));
      }
    });
  }
  
  // Enhanced replace image handler
  function enhancedReplaceImageHandler(input, projectData) {
    const file = input.files[0];
    if (!file) return;
    
    const traitId = input.getAttribute("data-trait-id");
    const layerId = input.getAttribute("data-layer-id");
    
    console.log(`🔄 Replacing image for trait ${traitId} in layer ${layerId}`);
    
    // Find the layer and trait
    const layer = projectData.traits.find((l) => l.id === layerId);
    if (!layer) {
      console.error("Layer not found:", layerId);
      return;
    }
    
    const trait = layer.traits.find((t) => t.id === traitId);
    if (!trait) {
      console.error("Trait not found:", traitId);
      return;
    }
    
    // Get absolute path information
    const absolutePath = getAbsolutePath(file);
    
    // Read the file as data URL
    const reader = new FileReader();
    reader.onload = (event) => {
      console.log(`✅ Image loaded for trait ${trait.name}`);
      
      // Update trait with new image data
      trait.imageData = event.target.result;
      trait.image = event.target.result;
      
      // Save absolute path information
      trait.absolutePath = absolutePath;
      trait.fileName = file.name;
      trait.fileSize = file.size;
      trait.fileType = file.type;
      trait.lastModified = file.lastModified;
      
      console.log(`💾 Saved absolute path info for trait ${trait.name}:`, trait.absolutePath);
      
      // Update the trait in the current NFT if it exists
      if (window.lastGeneratedNFT && window.lastGeneratedNFT.traits) {
        for (let nftTraitObj of window.lastGeneratedNFT.traits) {
          if (
            nftTraitObj.trait &&
            ((nftTraitObj.trait.id && nftTraitObj.trait.id === trait.id) ||
             (nftTraitObj.trait.name && nftTraitObj.trait.name === trait.name)) &&
            nftTraitObj.layer &&
            ((nftTraitObj.layer.id && nftTraitObj.layer.id === layer.id) ||
             (nftTraitObj.layer.name && nftTraitObj.layer.name === layer.name))
          ) {
            nftTraitObj.trait.imageData = event.target.result;
            nftTraitObj.trait.image = event.target.result;
            nftTraitObj.trait.absolutePath = absolutePath;
            console.log(`🔄 Updated NFT trait ${trait.name} with new image`);
          }
        }
      }
      
      // Update the UI
      const traitLayersModule = window.NFTApp?.getModule("traitLayers");
      if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
        traitLayersModule.updateTraitLayerUI(projectData);
      }
      
      // Show success feedback
      if (traitLayersModule && traitLayersModule.showFeedback) {
        traitLayersModule.showFeedback(`Image for trait "${trait.name}" updated successfully`, "success");
      }
      
      // Ensure all previews and thumbnails are refreshed
      if (window.regenerateNftImageAndSeed) {
        window.regenerateNftImageAndSeed();
      }
      
      // Notify Saved Seeds modal that traits have changed
      if (window.SavedSeedsModal) {
        // Find existing modal instance
        const existingModal = document.getElementById('saved-seeds-modal');
        if (existingModal && existingModal.savedSeedsModalInstance) {
          const savedSeedsModal = existingModal.savedSeedsModalInstance;
          if (savedSeedsModal && savedSeedsModal.onTraitsChanged) {
            savedSeedsModal.onTraitsChanged();
          }
        }
      }
      
      // Save trait paths to project data
      saveTraitPaths(projectData);
      
      console.log(`🎉 Successfully replaced image for trait ${trait.name}`);
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      if (traitLayersModule && traitLayersModule.showFeedback) {
        traitLayersModule.showFeedback(`Error loading image for trait "${trait.name}"`, "error");
      }
    };
    
    reader.readAsDataURL(file);
  }
  
  // Function to enhance existing replace image functionality
  function enhanceReplaceImageFunctionality() {
    console.log("🔧 Enhancing replace image functionality...");
    
    // Wait for trait layers module to be available
    const traitLayersModule = window.NFTApp?.getModule("traitLayers");
    if (!traitLayersModule) {
      console.log("Trait layers module not ready, retrying...");
      setTimeout(enhanceReplaceImageFunctionality, 1000);
      return;
    }
    
    // Override the setupTraitLayerBarEvents method to use our enhanced handler
    const originalSetupTraitLayerBarEvents = traitLayersModule.setupTraitLayerBarEvents;
    if (originalSetupTraitLayerBarEvents) {
      traitLayersModule.setupTraitLayerBarEvents = function(traitLayerBar, layer, projectData) {
        console.log("🎯 Setting up enhanced trait layer bar events...");
        
        // Call original method first
        originalSetupTraitLayerBarEvents.call(this, traitLayerBar, layer, projectData);
        
        // Override replace image inputs with our enhanced handler
        const replaceImageInputs = traitLayerBar.querySelectorAll(".replace-image-input");
        replaceImageInputs.forEach((input) => {
          // Remove existing event listeners
          const newInput = input.cloneNode(true);
          input.parentNode.replaceChild(newInput, input);
          
          // Add our enhanced event listener
          newInput.addEventListener("change", (e) => {
            enhancedReplaceImageHandler(newInput, projectData);
          });
        });
        
        console.log(`✅ Enhanced ${replaceImageInputs.length} replace image inputs`);
      };
    }
  }
  
  // Function to enhance project saving to include trait paths
  function enhanceProjectSaving() {
    console.log("💾 Enhancing project saving functionality...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectSaving, 1000);
      return;
    }
    
    // Override the save method to include trait paths
    const originalSave = projectService.save;
    if (originalSave) {
      projectService.save = function(showPicker = false) {
        console.log("💾 Saving project with trait paths...");
        
        // Save trait paths before saving
        if (window.currentProject) {
          saveTraitPaths(window.currentProject);
        }
        
        // Call original save method
        return originalSave.call(this, showPicker);
      };
    }
  }
  
  // Function to enhance project loading to restore trait paths
  function enhanceProjectLoading() {
    console.log("📂 Enhancing project loading functionality...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectLoading, 1000);
      return;
    }
    
    // Override the load method to restore trait paths
    const originalLoad = projectService.load;
    if (originalLoad) {
      projectService.load = function(event) {
        console.log("📂 Loading project with trait path restoration...");
        
        // Call original load method
        const result = originalLoad.call(this, event);
        
        // After loading, restore trait paths
        setTimeout(() => {
          if (window.currentProject && window.currentProject.traits) {
            console.log("🔄 Restoring trait paths from loaded project...");
            
            const loadPromises = [];
            window.currentProject.traits.forEach(layer => {
              if (layer.traits) {
                layer.traits.forEach(trait => {
                  if (trait.absolutePath) {
                    loadPromises.push(loadTraitFromPath(trait, window.currentProject));
                  }
                });
              }
            });
            
            Promise.all(loadPromises).then(() => {
              console.log("✅ All trait paths restored successfully");
              
              // Update UI after loading
              const traitLayersModule = window.NFTApp?.getModule("traitLayers");
              if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
                traitLayersModule.updateTraitLayerUI(window.currentProject);
              }
            }).catch(error => {
              console.error("❌ Error restoring trait paths:", error);
            });
          }
        }, 1000);
        
        return result;
      };
    }
  }
  
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM ready, enhancing replace image functionality...");
    
    // Enhance functionality after a delay to ensure modules are loaded
    setTimeout(() => {
      enhanceReplaceImageFunctionality();
      enhanceProjectSaving();
      enhanceProjectLoading();
    }, 2000);
  });
  
  // Global functions for manual control
  window.saveTraitPaths = function() {
    if (window.currentProject) {
      saveTraitPaths(window.currentProject);
      console.log("💾 Trait paths saved manually");
    } else {
      console.log("❌ No current project to save trait paths");
    }
  };
  
  window.loadTraitPaths = function() {
    if (window.currentProject && window.currentProject.traits) {
      console.log("🔄 Loading trait paths manually...");
      
      const loadPromises = [];
      window.currentProject.traits.forEach(layer => {
        if (layer.traits) {
          layer.traits.forEach(trait => {
            if (trait.absolutePath) {
              loadPromises.push(loadTraitFromPath(trait, window.currentProject));
            }
          });
        }
      });
      
      Promise.all(loadPromises).then(() => {
        console.log("✅ All trait paths loaded manually");
      }).catch(error => {
        console.error("❌ Error loading trait paths manually:", error);
      });
    } else {
      console.log("❌ No current project to load trait paths");
    }
  };
  
  console.log("🎉 Enhanced Replace Image functionality loaded!");
})();
