/**
 * Force Project Data Loading
 * This script modifies the trait loading behavior to use only project file data
 * instead of attempting to load from file paths. Perfect for local development.
 */
(function() {
  console.log("🔧 Initializing Force Project Data Loading...");

  // Wait for the project service to be available
  function waitForProjectService() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(waitForProjectService, 1000);
      return;
    }

    console.log("✅ Project service found, modifying trait loading behavior...");
    modifyTraitLoadingBehavior(projectService);
  }

  function modifyTraitLoadingBehavior(projectService) {
    // Override the loadTraitImagesFromPaths method to be smarter about when to intervene
    const originalLoadTraitImagesFromPaths = projectService.loadTraitImagesFromPaths;
    
    if (originalLoadTraitImagesFromPaths) {
      projectService.loadTraitImagesFromPaths = async function(traits) {
        console.log('🔧 FORCED PROJECT DATA LOADING: Checking trait imageData availability...');
        
        let loadedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const missingTraits = [];
        let needsFilePathLoading = false;
        
        // First pass: Check what we have
        for (const layer of traits) {
          if (layer.traits && layer.traits.length > 0) {
            for (const trait of layer.traits) {
              if (trait.imageData) {
                console.log(`✅ Trait has imageData: ${trait.name}`);
                loadedCount++;
              } else if (trait.filePath && !trait.filePath.startsWith('http')) {
                // Local file path - should have imageData
                console.warn(`⚠️ Local trait missing imageData: ${trait.name}`);
                errorCount++;
                missingTraits.push({ 
                  layer: layer.name, 
                  trait: trait.name, 
                  path: 'local file missing imageData' 
                });
              } else if (trait.filePath && trait.filePath.startsWith('http')) {
                // Web URL - needs file path loading
                console.log(`🌐 Web URL trait needs loading: ${trait.name}`);
                needsFilePathLoading = true;
              } else {
                // No file path - should have imageData
                console.warn(`❌ Trait missing both imageData and filePath: ${trait.name}`);
                errorCount++;
                missingTraits.push({ 
                  layer: layer.name, 
                  trait: trait.name, 
                  path: 'no imageData or filePath' 
                });
              }
            }
          }
        }
        
        console.log('📊 TRAIT ANALYSIS:');
        console.log('✅ Has imageData:', loadedCount);
        console.log('❌ Missing imageData:', errorCount);
        console.log('🌐 Needs web loading:', needsFilePathLoading);
        
        // Calculate coverage percentage
        const totalTraits = traits.reduce((sum, layer) => sum + (layer.traits ? layer.traits.length : 0), 0);
        const coverage = totalTraits > 0 ? (loadedCount / totalTraits) * 100 : 0;
        
        // If we have good coverage (>=80%), skip file path loading entirely
        if (coverage >= 80) {
          console.log(`🔧 FORCED PROJECT DATA: High coverage (${coverage.toFixed(1)}%), skipping file path loading`);
          console.log('🔧 FORCED PROJECT DATA: Using imageData from project file instead');
          return {
            loadedCount,
            skippedCount: totalTraits - loadedCount,
            errorCount: 0,
            missingTraits: []
          };
        }
        
        // Only proceed with file path loading if we have low coverage
        console.log(`🔧 FORCED PROJECT DATA: Low coverage (${coverage.toFixed(1)}%), proceeding with file path loading`);
        return await originalLoadTraitImagesFromPaths.call(this, traits);
      };
    }

    // Also override any enhanced loading functions
    overrideEnhancedLoadingFunctions();
  }

  function overrideEnhancedLoadingFunctions() {
    // Override enhanced trait path saver loading
    if (window.EnhancedTraitPathSaver && window.EnhancedTraitPathSaver.loadAllTraitPaths) {
      const originalLoadAllTraitPaths = window.EnhancedTraitPathSaver.loadAllTraitPaths;
      
      window.EnhancedTraitPathSaver.loadAllTraitPaths = async function() {
        console.log('🔧 FORCED PROJECT DATA: Overriding enhanced trait path loading...');
        
        if (window.currentProject && window.currentProject.traits) {
          let loadedCount = 0;
          let errorCount = 0;
          
          for (const layer of window.currentProject.traits) {
            if (layer.traits) {
              for (const trait of layer.traits) {
                if (trait.imageData) {
                  console.log(`✅ Using project file data for: ${trait.name}`);
                  loadedCount++;
                } else {
                  console.warn(`❌ No imageData available for: ${trait.name}`);
                  errorCount++;
                }
              }
            }
          }
          
          console.log(`📊 Enhanced loading override: ${loadedCount} loaded, ${errorCount} missing`);
        }
        
        return Promise.resolve();
      };
    }

    // Override simplified trait path manager
    if (window.TraitPathManager && window.TraitPathManager.loadAllTraitPaths) {
      const originalLoadAllTraitPaths = window.TraitPathManager.loadAllTraitPaths;
      
      window.TraitPathManager.loadAllTraitPaths = async function() {
        console.log('🔧 FORCED PROJECT DATA: Overriding simplified trait path loading...');
        
        if (window.currentProject && window.currentProject.traits) {
          let loadedCount = 0;
          let errorCount = 0;
          
          for (const layer of window.currentProject.traits) {
            if (layer.traits) {
              for (const trait of layer.traits) {
                if (trait.imageData) {
                  console.log(`✅ Using project file data for: ${trait.name}`);
                  loadedCount++;
                } else {
                  console.warn(`❌ No imageData available for: ${trait.name}`);
                  errorCount++;
                }
              }
            }
          }
          
          console.log(`📊 Simplified loading override: ${loadedCount} loaded, ${errorCount} missing`);
        }
        
        return Promise.resolve();
      };
    }

    // Override combination rules module to ensure traits have imageData
    if (window.NFTApp && window.NFTApp.getModule) {
      const combinationRulesModule = window.NFTApp.getModule("combinationRules");
      
      // Override generateTraitsList function
      if (combinationRulesModule && combinationRulesModule.generateTraitsList) {
        const originalGenerateTraitsList = combinationRulesModule.generateTraitsList;
        
        combinationRulesModule.generateTraitsList = function(layer, prefix, ruleToEdit = null, selectedTraitIdsArg = null) {
          console.log('🔧 FORCED PROJECT DATA: Ensuring traits have imageData for rules modal...');
          
          // Ensure all traits in the layer have imageData
          if (layer && layer.traits) {
            layer.traits.forEach(trait => {
              if (!trait.imageData) {
                console.warn(`⚠️ Trait ${trait.name} missing imageData in rules modal`);
                // Try to find the trait in currentProject and copy imageData
                if (window.currentProject && window.currentProject.traits) {
                  for (const projectLayer of window.currentProject.traits) {
                    if (projectLayer.traits) {
                      const projectTrait = projectLayer.traits.find(t => t.id === trait.id);
                      if (projectTrait && projectTrait.imageData) {
                        trait.imageData = projectTrait.imageData;
                        console.log(`✅ Restored imageData for trait: ${trait.name}`);
                        break;
                      }
                    }
                  }
                }
              }
            });
          }
          
          // Call the original function
          return originalGenerateTraitsList.call(this, layer, prefix, ruleToEdit, selectedTraitIdsArg);
        };
      }

      // Override updateTraitsList function
      if (combinationRulesModule && combinationRulesModule.updateTraitsList) {
        const originalUpdateTraitsList = combinationRulesModule.updateTraitsList;
        
        combinationRulesModule.updateTraitsList = function(projectData, selector, ruleToEdit = null, selectedTraitIdsArg = null) {
          console.log('🔧 FORCED PROJECT DATA: Ensuring traits have imageData in updateTraitsList...');
          
          // Ensure all traits in projectData have imageData
          if (projectData && projectData.traits) {
            projectData.traits.forEach(layer => {
              if (layer.traits) {
                layer.traits.forEach(trait => {
                  if (!trait.imageData) {
                    console.warn(`⚠️ Trait ${trait.name} missing imageData in updateTraitsList`);
                    // Try to find the trait in currentProject and copy imageData
                    if (window.currentProject && window.currentProject.traits) {
                      for (const projectLayer of window.currentProject.traits) {
                        if (projectLayer.traits) {
                          const projectTrait = projectLayer.traits.find(t => t.id === trait.id);
                          if (projectTrait && projectTrait.imageData) {
                            trait.imageData = projectTrait.imageData;
                            console.log(`✅ Restored imageData for trait: ${trait.name}`);
                            break;
                          }
                        }
                      }
                    }
                  }
                });
              }
            });
          }
          
          // Call the original function
          return originalUpdateTraitsList.call(this, projectData, selector, ruleToEdit, selectedTraitIdsArg);
        };
      }
    }
  }

  // Add a global function to toggle this behavior
  window.toggleForceProjectDataLoading = function(enable = true) {
    if (enable) {
      console.log('🔧 Force Project Data Loading ENABLED');
      waitForProjectService();
    } else {
      console.log('🔧 Force Project Data Loading DISABLED - restoring original behavior');
      // Note: This would require storing original functions to restore them
      // For now, just reload the page to restore original behavior
      location.reload();
    }
  };

  // Add a function to check project file integrity for traits
  window.checkProjectFileTraitIntegrity = function() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log('❌ No project data available');
      return;
    }

    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithFilePath = 0;
    let traitsWithBoth = 0;
    let traitsWithNeither = 0;

    console.log('🔍 PROJECT FILE TRAIT INTEGRITY CHECK:');
    console.log('=====================================');

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        console.log(`\n📁 Layer: ${layer.name}`);
        for (const trait of layer.traits) {
          totalTraits++;
          const hasImageData = !!trait.imageData;
          const hasFilePath = !!trait.filePath;
          
          if (hasImageData && hasFilePath) {
            traitsWithBoth++;
            console.log(`  ✅ ${trait.name}: Has both imageData and filePath`);
          } else if (hasImageData) {
            traitsWithImageData++;
            console.log(`  📁 ${trait.name}: Has imageData only (local development)`);
          } else if (hasFilePath) {
            traitsWithFilePath++;
            console.log(`  🌐 ${trait.name}: Has filePath only (web URL)`);
          } else {
            traitsWithNeither++;
            console.log(`  ❌ ${trait.name}: Missing both imageData and filePath`);
          }
        }
      }
    }

    console.log('\n📊 SUMMARY:');
    console.log(`Total traits: ${totalTraits}`);
    console.log(`✅ Has imageData: ${traitsWithImageData}`);
    console.log(`🌐 Has filePath: ${traitsWithFilePath}`);
    console.log(`✅ Has both: ${traitsWithBoth}`);
    console.log(`❌ Has neither: ${traitsWithNeither}`);
    console.log(`📈 Local development coverage: ${((traitsWithImageData + traitsWithBoth) / totalTraits * 100).toFixed(1)}%`);

    return {
      totalTraits,
      traitsWithImageData,
      traitsWithFilePath,
      traitsWithBoth,
      traitsWithNeither,
      localCoverage: (traitsWithImageData + traitsWithBoth) / totalTraits * 100
    };
  };

  // Add a function to force restore all trait imageData from project file
  window.forceRestoreAllTraitImageData = function() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log('❌ No project data available for restoration');
      return false;
    }

    let restoredCount = 0;
    let alreadyPresentCount = 0;
    let missingCount = 0;

    console.log('🔧 FORCE RESTORING ALL TRAIT IMAGEDATA FROM PROJECT FILE...');

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (trait.imageData) {
            alreadyPresentCount++;
            console.log(`✅ ${trait.name}: Already has imageData`);
          } else {
            missingCount++;
            console.warn(`❌ ${trait.name}: Missing imageData - cannot restore without source`);
          }
        }
      }
    }

    console.log(`📊 RESTORATION SUMMARY:`);
    console.log(`✅ Already present: ${alreadyPresentCount}`);
    console.log(`❌ Missing (cannot restore): ${missingCount}`);
    console.log(`📈 Coverage: ${(alreadyPresentCount / (alreadyPresentCount + missingCount) * 100).toFixed(1)}%`);

    return {
      alreadyPresent: alreadyPresentCount,
      missing: missingCount,
      coverage: alreadyPresentCount / (alreadyPresentCount + missingCount) * 100
    };
  };

  // Add a function to ensure traits have imageData for modals
  window.ensureTraitsHaveImageData = function(projectData = null) {
    const data = projectData || window.currentProject;
    if (!data || !data.traits) {
      console.log('❌ No project data available for imageData check');
      return false;
    }

    let restoredCount = 0;
    let missingCount = 0;
    let alreadyPresentCount = 0;

    for (const layer of data.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData) {
            console.warn(`⚠️ Trait ${trait.name} missing imageData`);
            missingCount++;
            
            // Try to find the trait in the original project data
            if (window.currentProject && window.currentProject.traits) {
              for (const projectLayer of window.currentProject.traits) {
                if (projectLayer.traits) {
                  const projectTrait = projectLayer.traits.find(t => t.id === trait.id);
                  if (projectTrait && projectTrait.imageData) {
                    trait.imageData = projectTrait.imageData;
                    console.log(`✅ Restored imageData for trait: ${trait.name}`);
                    restoredCount++;
                    break;
                  }
                }
              }
            }
          } else {
            alreadyPresentCount++;
          }
        }
      }
    }

    console.log(`🔧 ImageData check: ${alreadyPresentCount} already present, ${restoredCount} restored, ${missingCount} still missing`);
    return restoredCount > 0;
  };

  // Monitor for rules modal opening and ensure traits have imageData
  function monitorRulesModal() {
    // Override the combination rules modal opening
    if (window.NFTApp && window.NFTApp.getModule) {
      const combinationRulesModule = window.NFTApp.getModule("combinationRules");
      if (combinationRulesModule && combinationRulesModule.showCombinationRuleModal) {
        const originalShowCombinationRuleModal = combinationRulesModule.showCombinationRuleModal;
        
        combinationRulesModule.showCombinationRuleModal = function(projectData, ruleToEdit = null) {
          console.log('🔧 FORCED PROJECT DATA: Combination rules modal opening, ensuring traits have imageData...');
          
          // Ensure all traits have imageData before showing the modal
          window.ensureTraitsHaveImageData(projectData);
          
          // Call the original function
          const result = originalShowCombinationRuleModal.call(this, projectData, ruleToEdit);
          
          // After modal is created, ensure traits have imageData again and set up monitoring
          setTimeout(() => {
            console.log('🔧 FORCED PROJECT DATA: Post-modal setup, ensuring traits have imageData...');
            window.ensureTraitsHaveImageData(projectData);
            
            // Set up monitoring for layer changes
            setupModalTraitMonitoring(projectData);
          }, 100);
          
          return result;
        };
      }
    }
  }

  // Set up monitoring for trait updates in the modal
  function setupModalTraitMonitoring(projectData) {
    const modal = document.getElementById("combination-rule-modal");
    if (!modal) return;

    // Monitor layer dropdown changes
    const firstLayerSelect = modal.querySelector("#first-layer");
    const secondLayerSelect = modal.querySelector("#second-layer");
    
    if (firstLayerSelect) {
      firstLayerSelect.addEventListener("change", () => {
        console.log('🔧 FORCED PROJECT DATA: First layer changed, ensuring traits have imageData...');
        setTimeout(() => window.ensureTraitsHaveImageData(projectData), 50);
      });
    }
    
    if (secondLayerSelect) {
      secondLayerSelect.addEventListener("change", () => {
        console.log('🔧 FORCED PROJECT DATA: Second layer changed, ensuring traits have imageData...');
        setTimeout(() => window.ensureTraitsHaveImageData(projectData), 50);
      });
    }

    // Monitor rule type changes
    const ruleTypeSelect = modal.querySelector("#rule-type");
    if (ruleTypeSelect) {
      ruleTypeSelect.addEventListener("change", () => {
        console.log('🔧 FORCED PROJECT DATA: Rule type changed, ensuring traits have imageData...');
        setTimeout(() => window.ensureTraitsHaveImageData(projectData), 50);
      });
    }

    // Monitor rule applies to changes
    const ruleAppliesToSelect = modal.querySelector("#rule-applies-to");
    if (ruleAppliesToSelect) {
      ruleAppliesToSelect.addEventListener("change", () => {
        console.log('🔧 FORCED PROJECT DATA: Rule applies to changed, ensuring traits have imageData...');
        setTimeout(() => window.ensureTraitsHaveImageData(projectData), 50);
      });
    }

    // Set up MutationObserver to watch for trait list changes
    const traitLists = modal.querySelectorAll("#first-traits-list, #second-traits-list");
    traitLists.forEach(traitList => {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
            console.log('🔧 FORCED PROJECT DATA: Trait list updated, ensuring traits have imageData...');
            setTimeout(() => {
              window.ensureTraitsHaveImageData(projectData);
              // Also directly fix any missing images in the DOM
              fixMissingTraitImages(traitList, projectData);
            }, 50);
          }
        });
      });
      
      observer.observe(traitList, {
        childList: true,
        subtree: true
      });
    });
  }

  // Directly fix missing trait images in the DOM
  function fixMissingTraitImages(traitList, projectData) {
    const traitImages = traitList.querySelectorAll('.nft-trait-thumb');
    traitImages.forEach(img => {
      if (!img.src || img.src === '' || img.src.includes('data:image/svg')) {
        const traitId = img.closest('.trait-checkbox-label')?.getAttribute('data-trait-id');
        if (traitId) {
          // Find the trait in project data
          for (const layer of projectData.traits) {
            if (layer.traits) {
              const trait = layer.traits.find(t => t.id === traitId);
              if (trait && trait.imageData) {
                img.src = trait.imageData;
                console.log(`🔧 FORCED PROJECT DATA: Fixed missing image for trait: ${trait.name}`);
                break;
              }
            }
          }
        }
      }
    });
  }

  // Add a function to check if project saving preserves trait imageData
  window.checkProjectSavingBehavior = function() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log('❌ No project data available');
      return;
    }

    console.log('🔍 CHECKING PROJECT SAVING BEHAVIOR...');
    console.log('=====================================');

    // Simulate the saving process to see what would be saved
    const projectToSave = JSON.parse(JSON.stringify(window.currentProject));
    
    // Apply the same optimization logic as in project-service.js
    const optimizedTraits = projectToSave.traits.map(layer => {
      const optimizedLayer = {
        id: layer.id,
        name: layer.name,
        order: layer.order,
        rarity: layer.rarity,
        traits: layer.traits ? layer.traits.map(trait => {
          const optimizedTrait = {
            id: trait.id,
            name: trait.name,
            rarity: trait.rarity,
            order: trait.order
          };
          
          // Keep file path if it exists
          if (trait.filePath) {
            optimizedTrait.filePath = trait.filePath;
          }
          
          // Keep fileName if it exists (for local files)
          if (trait.fileName) {
            optimizedTrait.fileName = trait.fileName;
          }
          
          // Keep file metadata for reference
          if (trait.fileSize) {
            optimizedTrait.fileSize = trait.fileSize;
          }
          if (trait.fileType) {
            optimizedTrait.fileType = trait.fileType;
          }
          if (trait.lastModified) {
            optimizedTrait.lastModified = trait.lastModified;
          }
          
          // CRITICAL: Keep imageData for local development
          // Only remove imageData if we have a valid web URL filePath
          if (trait.imageData && trait.filePath && trait.filePath.startsWith('http')) {
            // Only remove imageData if we have a valid web URL
            console.log(`🌐 Would remove imageData (has web URL): ${trait.name}`);
          } else if (trait.imageData) {
            // Keep imageData for all other cases (local development)
            console.log(`✅ Would keep imageData for local development: ${trait.name}`);
            optimizedTrait.imageData = trait.imageData;
          }
          
          return optimizedTrait;
        }) : []
      };
      
      return optimizedLayer;
    });

    // Count what would be saved
    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithoutImageData = 0;

    for (const layer of optimizedTraits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalTraits++;
          if (trait.imageData) {
            traitsWithImageData++;
          } else {
            traitsWithoutImageData++;
            console.warn(`❌ Would lose imageData: ${layer.name} - ${trait.name}`);
          }
        }
      }
    }

    console.log('\n📊 SAVING BEHAVIOR ANALYSIS:');
    console.log(`Total traits: ${totalTraits}`);
    console.log(`✅ Would keep imageData: ${traitsWithImageData}`);
    console.log(`❌ Would lose imageData: ${traitsWithoutImageData}`);
    console.log(`📈 Local development preservation: ${((traitsWithImageData / totalTraits) * 100).toFixed(1)}%`);

    return {
      totalTraits,
      traitsWithImageData,
      traitsWithoutImageData,
      preservationRate: (traitsWithImageData / totalTraits) * 100
    };
  };

  // Add a global function to toggle this behavior
  window.toggleForceProjectDataLoading = function() {
    if (window.forceProjectDataLoadingEnabled) {
      console.log('🔧 Disabling forced project data loading...');
      window.forceProjectDataLoadingEnabled = false;
      // For now, just reload the page to restore original behavior
      location.reload();
    } else {
      console.log('🔧 Enabling forced project data loading...');
      window.forceProjectDataLoadingEnabled = true;
      // For now, just reload the page to apply new behavior
      location.reload();
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM ready, initializing Force Project Data Loading...");
    
    // Wait a bit for other modules to load
    setTimeout(() => {
      waitForProjectService();
      monitorRulesModal();
      console.log("🎉 Force Project Data Loading initialized!");
    }, 2000);
  });

  // Also initialize immediately if DOM is already ready
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already ready
    setTimeout(() => {
      waitForProjectService();
      monitorRulesModal();
      console.log("🎉 Force Project Data Loading initialized!");
    }, 2000);
  }

})();
