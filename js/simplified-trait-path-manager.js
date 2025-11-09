/**
 * Simplified Trait Path Manager
 * This script provides a simple, robust solution for saving and loading trait paths
 */
(function() {
  console.log("🔧 SIMPLIFIED TRAIT PATH MANAGER LOADING...");
  
  // Global trait path manager
  window.TraitPathManager = {
    // Save trait path information
    saveTraitPath: function(trait, file) {
      console.log(`💾 Saving path for trait: ${trait.name}`);
      
      // Store file information
      trait.fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        timestamp: Date.now()
      };
      
      // Store absolute path reference (for web, we use file name as reference)
      trait.absolutePath = file.name;
      trait.fileName = file.name;
      trait.fileSize = file.size;
      trait.fileType = file.type;
      trait.lastModified = file.lastModified;
      
      // ALSO save as filePath for compatibility with project loading system
      // Try to get the full path if available
      let fullPath = file.webkitRelativePath || file.name;
      
      // Try to get more path information
      console.log('%c📁 FILE OBJECT ANALYSIS:', 'color: blue; font-weight: bold;');
      console.log('  - file.name:', file.name);
      console.log('  - file.webkitRelativePath:', file.webkitRelativePath);
      console.log('  - file.path:', file.path);
      console.log('  - file.handle:', file.handle);
      console.log('  - file.size:', file.size);
      console.log('  - file.type:', file.type);
      console.log('  - file.lastModified:', file.lastModified);
      
      // Check if we can get the full path from the file object
      if (file.path) {
        fullPath = file.path;
        console.log('%c🎯 FOUND FULL PATH:', 'color: green; font-weight: bold;');
        console.log('  - Full path:', file.path);
      } else if (file.webkitRelativePath) {
        fullPath = file.webkitRelativePath;
        console.log('%c📂 USING WEBKIT RELATIVE PATH:', 'color: orange; font-weight: bold;');
        console.log('  - Relative path:', file.webkitRelativePath);
      } else {
        console.log('%c⚠️  ONLY FILENAME AVAILABLE:', 'color: red; font-weight: bold;');
        console.log('  - Filename only:', file.name);
      }
      
      trait.filePath = fullPath;
      
      console.log(`✅ Path saved for trait ${trait.name}:`, trait.fileInfo);
      console.log('%c📂 FINAL FILEPATH SAVED: ' + trait.filePath, 'color: green; font-weight: bold;');
      
      // Save to project data
      this.saveAllTraitPaths();
      
      return true;
    },
    
    // Save trait path with full path (new method for better path handling)
    saveTraitPathWithFullPath: function(trait, file, fullPath) {
      console.log(`💾 Saving FULL PATH for trait: ${trait.name}`);
      
      // Store file information
      trait.fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
        timestamp: Date.now(),
        fullPath: fullPath
      };
      
      // Store the full path
      trait.absolutePath = fullPath;
      trait.fileName = file.name;
      trait.fileSize = file.size;
      trait.fileType = file.type;
      trait.lastModified = file.lastModified;
      trait.filePath = fullPath;
      
      console.log(`✅ FULL PATH saved for trait ${trait.name}:`, trait.fileInfo);
      console.log('%c📂 FULL FILEPATH SAVED: ' + trait.filePath, 'color: green; font-weight: bold;');
      
      // Save to project data
      this.saveAllTraitPaths();
      
      return true;
    },
    
    // Save all trait paths to project
    saveAllTraitPaths: function() {
      if (!window.currentProject) {
        console.log("❌ No current project to save trait paths");
        return false;
      }
      
      console.log("💾 Saving all trait paths to project...");
      
      let savedCount = 0;
      if (window.currentProject.traits) {
        window.currentProject.traits.forEach(layer => {
          if (layer.traits) {
            layer.traits.forEach(trait => {
              if (trait.fileInfo || trait.absolutePath) {
                savedCount++;
                console.log(`  - Trait ${trait.name}: ${trait.fileName || 'No filename'}`);
              }
            });
          }
        });
      }
      
      console.log(`✅ Saved ${savedCount} trait paths to project`);
      return true;
    },
    
    // Load trait paths from project
    loadAllTraitPaths: function() {
      if (!window.currentProject) {
        console.log("❌ No current project to load trait paths");
        return Promise.resolve(false);
      }
      
      console.log("📂 Loading all trait paths from project...");
      
      let loadedCount = 0;
      if (window.currentProject.traits) {
        window.currentProject.traits.forEach(layer => {
          if (layer.traits) {
            layer.traits.forEach(trait => {
              if (trait.fileInfo || trait.absolutePath) {
                loadedCount++;
                console.log(`  - Trait ${trait.name}: ${trait.fileName || 'No filename'}`);
              }
            });
          }
        });
      }
      
      console.log(`✅ Loaded ${loadedCount} trait paths from project`);
      return Promise.resolve(true);
    },
    
    // Get trait path statistics
    getTraitPathStats: function() {
      if (!window.currentProject || !window.currentProject.traits) {
        return { totalTraits: 0, traitsWithPaths: 0, traitsWithoutPaths: 0 };
      }
      
      let totalTraits = 0;
      let traitsWithPaths = 0;
      
      window.currentProject.traits.forEach(layer => {
        if (layer.traits) {
          layer.traits.forEach(trait => {
            totalTraits++;
            if (trait.fileInfo || trait.absolutePath) {
              traitsWithPaths++;
            }
          });
        }
      });
      
      return {
        totalTraits: totalTraits,
        traitsWithPaths: traitsWithPaths,
        traitsWithoutPaths: totalTraits - traitsWithPaths
      };
    }
  };
  
  // Enhanced replace image handler
  function createEnhancedReplaceImageHandler() {
    console.log("🔧 Creating enhanced replace image handler...");
    
    // Override the existing replace image functionality
    const originalHandler = function(input, projectData) {
      const file = input.files[0];
      if (!file) return;
      
      const traitId = input.getAttribute("data-trait-id");
      const layerId = input.getAttribute("data-layer-id");
      
      console.log(`🔄 Enhanced replace image for trait ${traitId} in layer ${layerId}`);
      
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
      
      // Read the file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        console.log(`✅ Image loaded for trait ${trait.name}`);
        
        // Update trait with new image data
        trait.imageData = event.target.result;
        trait.image = event.target.result;
        
        // Save trait path information
        window.TraitPathManager.saveTraitPath(trait, file);
        
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
              nftTraitObj.trait.fileInfo = trait.fileInfo;
              nftTraitObj.trait.absolutePath = trait.absolutePath;
              console.log(`🔄 Updated NFT trait ${trait.name} with new image and path`);
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
        
        console.log(`🎉 Successfully replaced image for trait ${trait.name} with path saving`);
      };
      
      reader.onerror = (error) => {
        console.error("Error reading file:", error);
        const traitLayersModule = window.NFTApp?.getModule("traitLayers");
        if (traitLayersModule && traitLayersModule.showFeedback) {
          traitLayersModule.showFeedback(`Error loading image for trait "${trait.name}"`, "error");
        }
      };
      
      reader.readAsDataURL(file);
    };
    
    return originalHandler;
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
    
    console.log("✅ Trait layers module found, enhancing replace image...");
    
    // Override the setupTraitLayerBarEvents method
    const originalSetupTraitLayerBarEvents = traitLayersModule.setupTraitLayerBarEvents;
    if (originalSetupTraitLayerBarEvents) {
      traitLayersModule.setupTraitLayerBarEvents = function(traitLayerBar, layer, projectData) {
        console.log("🎯 Setting up enhanced trait layer bar events...");
        
        // Call original method first
        originalSetupTraitLayerBarEvents.call(this, traitLayerBar, layer, projectData);
        
        // Override replace image inputs with our enhanced handler
        const replaceImageInputs = traitLayerBar.querySelectorAll(".replace-image-input");
        replaceImageInputs.forEach((input) => {
          // Remove existing event listeners by cloning the element
          const newInput = input.cloneNode(true);
          input.parentNode.replaceChild(newInput, input);
          
          // Add our enhanced event listener
          newInput.addEventListener("change", (e) => {
            const enhancedHandler = createEnhancedReplaceImageHandler();
            enhancedHandler(newInput, projectData);
          });
        });
        
        console.log(`✅ Enhanced ${replaceImageInputs.length} replace image inputs`);
      };
    }
  }
  
  // Function to enhance project saving
  function enhanceProjectSaving() {
    console.log("🔧 Enhancing project saving...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectSaving, 1000);
      return;
    }
    
    console.log("✅ Project service found, enhancing saving...");
    
    // Override the save method
    const originalSave = projectService.save;
    if (originalSave) {
      projectService.save = function(showPicker = false) {
        console.log("💾 Enhanced save: Saving project with trait paths...");
        
        // Save trait paths before saving
        window.TraitPathManager.saveAllTraitPaths();
        
        // Call original save method
        return originalSave.call(this, showPicker);
      };
    }
  }
  
  // Function to enhance project loading
  function enhanceProjectLoading() {
    console.log("🔧 Enhancing project loading...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectLoading, 1000);
      return;
    }
    
    console.log("✅ Project service found, enhancing loading...");
    
    // Override the load method
    const originalLoad = projectService.load;
    if (originalLoad) {
      projectService.load = function(event) {
        console.log("📂 Enhanced load: Loading project with trait path restoration...");
        
        // Call original load method
        const result = originalLoad.call(this, event);
        
        // After loading, restore trait paths
        setTimeout(() => {
          window.TraitPathManager.loadAllTraitPaths().then(() => {
            console.log("✅ Trait paths restored after loading");
            
            // Update UI after loading
            const traitLayersModule = window.NFTApp?.getModule("traitLayers");
            if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
              traitLayersModule.updateTraitLayerUI(window.currentProject);
            }
          });
        }, 1500);
        
        return result;
      };
    }
  }
  
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM ready, initializing simplified trait path manager...");
    
    // Wait for modules to load
    setTimeout(() => {
      enhanceReplaceImageFunctionality();
      enhanceProjectSaving();
      enhanceProjectLoading();
      
      console.log("🎉 Simplified Trait Path Manager initialized!");
    }, 2000);
  });
  
  // Global functions for manual control
  window.saveTraitPaths = function() {
    return window.TraitPathManager.saveAllTraitPaths();
  };
  
  window.loadTraitPaths = function() {
    return window.TraitPathManager.loadAllTraitPaths();
  };
  
  window.getTraitPathStats = function() {
    return window.TraitPathManager.getTraitPathStats();
  };
  
  console.log("🎉 SIMPLIFIED TRAIT PATH MANAGER LOADED!");
})();
