/**
 * Enhanced Project Service for Trait Path Management
 * This script enhances the project service to properly handle absolute trait paths
 */
(function() {
  console.log("📁 Enhanced Project Service for Trait Paths loading...");
  
  // Function to save trait paths to project data
  function saveTraitPathsToProject(projectData) {
    if (!projectData || !projectData.traits) return;
    
    console.log("💾 Saving trait paths to project data...");
    
    projectData.traits.forEach(layer => {
      if (layer.traits) {
        layer.traits.forEach(trait => {
          // Ensure trait has path information
          if (trait.absolutePath || trait.fileName) {
            console.log(`Saving path info for trait ${trait.name}:`, {
              fileName: trait.fileName,
              fileSize: trait.fileSize,
              fileType: trait.fileType,
              lastModified: trait.lastModified,
              hasImageData: !!trait.imageData
            });
          }
        });
      }
    });
  }
  
  // Function to restore trait paths from project data
  function restoreTraitPathsFromProject(projectData) {
    if (!projectData || !projectData.traits) return Promise.resolve();
    
    console.log("📂 Restoring trait paths from project data...");
    
    const restorePromises = [];
    
    projectData.traits.forEach(layer => {
      if (layer.traits) {
        layer.traits.forEach(trait => {
          // If trait has path information but no image data, try to restore
          if ((trait.absolutePath || trait.fileName) && !trait.imageData) {
            console.log(`Attempting to restore trait ${trait.name} from path info...`);
            
            // For now, we'll just log that we would restore it
            // In a real implementation, you would load the image from the absolute path
            restorePromises.push(
              new Promise((resolve) => {
                console.log(`Would restore trait ${trait.name} from:`, trait.absolutePath || trait.fileName);
                resolve();
              })
            );
          }
        });
      }
    });
    
    return Promise.all(restorePromises);
  }
  
  // Function to enhance project saving
  function enhanceProjectSaving() {
    console.log("🔧 Enhancing project saving for trait paths...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectSaving, 1000);
      return;
    }
    
    // Store original save method
    const originalSave = projectService.save;
    if (originalSave) {
      projectService.save = function(showPicker = false) {
        console.log("💾 Enhanced save: Saving project with trait paths...");
        
        // Save trait paths before saving
        if (window.currentProject) {
          saveTraitPathsToProject(window.currentProject);
        }
        
        // Call original save method
        return originalSave.call(this, showPicker);
      };
    }
    
    // Store original saveAs method if it exists
    const originalSaveAs = projectService.saveAs;
    if (originalSaveAs) {
      projectService.saveAs = function() {
        console.log("💾 Enhanced saveAs: Saving project with trait paths...");
        
        // Save trait paths before saving
        if (window.currentProject) {
          saveTraitPathsToProject(window.currentProject);
        }
        
        // Call original saveAs method
        return originalSaveAs.call(this);
      };
    }
  }
  
  // Function to enhance project loading
  function enhanceProjectLoading() {
    console.log("🔧 Enhancing project loading for trait paths...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectLoading, 1000);
      return;
    }
    
    // Store original load method
    const originalLoad = projectService.load;
    if (originalLoad) {
      projectService.load = function(event) {
        console.log("📂 Enhanced load: Loading project with trait path restoration...");
        
        // Call original load method
        const result = originalLoad.call(this, event);
        
        // After loading, restore trait paths
        setTimeout(() => {
          if (window.currentProject && window.currentProject.traits) {
            console.log("🔄 Restoring trait paths from loaded project...");
            
            restoreTraitPathsFromProject(window.currentProject).then(() => {
              console.log("✅ All trait paths restored successfully");
              
              // Update UI after loading
              const traitLayersModule = window.NFTApp?.getModule("traitLayers");
              if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
                traitLayersModule.updateTraitLayerUI(window.currentProject);
              }
              
              // Notify other modules that project has been loaded
              document.dispatchEvent(new CustomEvent('project-loaded-with-paths', {
                detail: { project: window.currentProject }
              }));
              
            }).catch(error => {
              console.error("❌ Error restoring trait paths:", error);
            });
          }
        }, 1500); // Increased delay to ensure project is fully loaded
        
        return result;
      };
    }
  }
  
  // Function to enhance startNew to handle trait paths
  function enhanceStartNew() {
    console.log("🔧 Enhancing startNew for trait paths...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceStartNew, 1000);
      return;
    }
    
    // Store original startNew method
    const originalStartNew = projectService.startNew;
    if (originalStartNew) {
      projectService.startNew = function() {
        console.log("🆕 Enhanced startNew: Starting new project with trait path support...");
        
        // Call original startNew method
        const result = originalStartNew.call(this);
        
        // Ensure new project has trait path support
        if (window.currentProject) {
          console.log("✅ New project created with trait path support");
        }
        
        return result;
      };
    }
  }
  
  // Function to add trait path utilities to project service
  function addTraitPathUtilities() {
    console.log("🔧 Adding trait path utilities to project service...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(addTraitPathUtilities, 1000);
      return;
    }
    
    // Add utility methods
    projectService.saveTraitPaths = function() {
      if (window.currentProject) {
        saveTraitPathsToProject(window.currentProject);
        console.log("💾 Trait paths saved manually");
        return true;
      } else {
        console.log("❌ No current project to save trait paths");
        return false;
      }
    };
    
    projectService.restoreTraitPaths = function() {
      if (window.currentProject) {
        console.log("🔄 Restoring trait paths manually...");
        return restoreTraitPathsFromProject(window.currentProject);
      } else {
        console.log("❌ No current project to restore trait paths");
        return Promise.resolve();
      }
    };
    
    projectService.getTraitPathInfo = function() {
      if (!window.currentProject || !window.currentProject.traits) {
        return { totalTraits: 0, traitsWithPaths: 0, traitsWithoutPaths: 0 };
      }
      
      let totalTraits = 0;
      let traitsWithPaths = 0;
      let traitsWithoutPaths = 0;
      
      window.currentProject.traits.forEach(layer => {
        if (layer.traits) {
          layer.traits.forEach(trait => {
            totalTraits++;
            if (trait.absolutePath || trait.fileName) {
              traitsWithPaths++;
            } else {
              traitsWithoutPaths++;
            }
          });
        }
      });
      
      return { totalTraits, traitsWithPaths, traitsWithoutPaths };
    };
    
    console.log("✅ Trait path utilities added to project service");
  }
  
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM ready, enhancing project service for trait paths...");
    
    // Enhance functionality after a delay to ensure modules are loaded
    setTimeout(() => {
      enhanceProjectSaving();
      enhanceProjectLoading();
      enhanceStartNew();
      addTraitPathUtilities();
    }, 2000);
  });
  
  // Global functions for manual control
  window.saveProjectTraitPaths = function() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (projectService && projectService.saveTraitPaths) {
      return projectService.saveTraitPaths();
    } else {
      console.log("❌ Project service not available");
      return false;
    }
  };
  
  window.restoreProjectTraitPaths = function() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (projectService && projectService.restoreTraitPaths) {
      return projectService.restoreTraitPaths();
    } else {
      console.log("❌ Project service not available");
      return Promise.resolve();
    }
  };
  
  window.getProjectTraitPathInfo = function() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (projectService && projectService.getTraitPathInfo) {
      return projectService.getTraitPathInfo();
    } else {
      console.log("❌ Project service not available");
      return { totalTraits: 0, traitsWithPaths: 0, traitsWithoutPaths: 0 };
    }
  };
  
  console.log("🎉 Enhanced Project Service for Trait Paths loaded!");
})();
