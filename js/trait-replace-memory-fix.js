/**
 * Trait Replace Image Memory Fix
 * This script fixes the memory issue where replacing one trait image
 * causes other traits in the same layer to lose their thumbnails.
 */
(function() {
  console.log("🔧 Initializing Trait Replace Image Memory Fix...");

  // Track active replace operations to prevent conflicts
  let activeReplaceOperations = new Set();
  let originalReplaceHandlers = new Map();

  // Safe trait replacement function
  function safeReplaceTraitImage(traitId, layerId, file, projectData) {
    // Prevent multiple simultaneous operations on the same trait
    const operationKey = `${layerId}-${traitId}`;
    if (activeReplaceOperations.has(operationKey)) {
      console.warn(`🔧 Replace operation already in progress for trait ${traitId}`);
      return;
    }

    activeReplaceOperations.add(operationKey);

    try {
      console.log(`🔧 Safe replacing trait ${traitId} in layer ${layerId}`);

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

      // Create a backup of the original trait data
      const originalTraitData = {
        imageData: trait.imageData,
        image: trait.image,
        filePath: trait.filePath,
        fileName: trait.fileName
      };

      // Read the file as data URL
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          console.log(`✅ Image loaded for trait ${trait.name}`);

          // Update ONLY the specific trait, not the entire layer
          trait.imageData = event.target.result;
          trait.image = event.target.result;
          trait.filePath = file.webkitRelativePath || file.name;
          trait.fileName = file.name;
          trait.fileSize = file.size;
          trait.fileType = file.type;
          trait.lastModified = file.lastModified;

          // Update the trait in the current NFT if it exists (without affecting other traits)
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
                nftTraitObj.trait.filePath = trait.filePath;
                console.log(`🔄 Updated NFT trait ${trait.name} with new image`);
              }
            }
          }

          // Update ALL trait thumbnails across the entire app
          updateAllTraitThumbnails(traitId, layerId, event.target.result);

          // Show success feedback
          showTraitReplaceSuccess(trait.name);

          // Regenerate NFT image and seed
          if (window.regenerateNftImageAndSeed) {
            window.regenerateNftImageAndSeed();
          }

          // Notify Saved Seeds modal that traits have changed
          if (window.SavedSeedsModal && window.SavedSeedsModal.notifyTraitChange) {
            window.SavedSeedsModal.notifyTraitChange();
          }

        } catch (error) {
          console.error(`❌ Error updating trait ${trait.name}:`, error);
          
          // Restore original trait data on error
          trait.imageData = originalTraitData.imageData;
          trait.image = originalTraitData.image;
          trait.filePath = originalTraitData.filePath;
          trait.fileName = originalTraitData.fileName;
        } finally {
          // Remove from active operations
          activeReplaceOperations.delete(operationKey);
        }
      };

      reader.onerror = () => {
        console.error(`❌ Error reading file for trait ${trait.name}`);
        activeReplaceOperations.delete(operationKey);
      };

      reader.readAsDataURL(file);

    } catch (error) {
      console.error(`❌ Error in safe replace operation:`, error);
      activeReplaceOperations.delete(operationKey);
    }
  }

  // Update ALL trait thumbnails for the specific trait across the entire app
  function updateAllTraitThumbnails(traitId, layerId, imageData) {
    try {
      console.log(`🔄 Refreshing ALL thumbnails for trait ${traitId}...`);
      
      let updatedCount = 0;
      
      // 1. Update trait layer thumbnails
      const traitItems = document.querySelectorAll(`[data-id="${traitId}"]`);
      traitItems.forEach(traitItem => {
        const thumbnails = traitItem.querySelectorAll('.trait-thumbnail, .nft-trait-thumb, img');
        thumbnails.forEach(thumbnail => {
          if (thumbnail.src !== imageData) {
            thumbnail.src = imageData;
            updatedCount++;
          }
        });
      });
      
      // 2. Update thumbnails in trait selection modals
      const modalThumbnails = document.querySelectorAll(`[data-trait-id="${traitId}"] img, .trait-selection-thumb img`);
      modalThumbnails.forEach(thumbnail => {
        if (thumbnail.src !== imageData) {
          thumbnail.src = imageData;
          updatedCount++;
        }
      });
      
      // 3. Update thumbnails in combination rules modal
      const rulesModalThumbnails = document.querySelectorAll(`#combination-rule-modal [data-trait-id="${traitId}"] img, #combination-rule-modal .nft-trait-thumb`);
      rulesModalThumbnails.forEach(thumbnail => {
        if (thumbnail.src !== imageData) {
          thumbnail.src = imageData;
          updatedCount++;
        }
      });
      
      // 4. Update thumbnails in saved seeds modal
      const savedSeedsThumbnails = document.querySelectorAll(`#saved-seeds-modal [data-trait-id="${traitId}"] img`);
      savedSeedsThumbnails.forEach(thumbnail => {
        if (thumbnail.src !== imageData) {
          thumbnail.src = imageData;
          updatedCount++;
        }
      });
      
      // 5. Update thumbnails in NFT edit modal
      const editModalThumbnails = document.querySelectorAll(`#nft-edit-modal [data-trait-id="${traitId}"] img`);
      editModalThumbnails.forEach(thumbnail => {
        if (thumbnail.src !== imageData) {
          thumbnail.src = imageData;
          updatedCount++;
        }
      });
      
      // 6. Force refresh any cached images by adding timestamp
      const allTraitImages = document.querySelectorAll(`img[src*="data:image"], img[alt*="${traitId}"]`);
      allTraitImages.forEach(img => {
        if (img.src === imageData) {
          // Force refresh by temporarily changing src and back
          const originalSrc = img.src;
          img.src = '';
          setTimeout(() => {
            img.src = originalSrc;
          }, 10);
          updatedCount++;
        }
      });
      
      // 7. Trigger a custom event for other components to refresh
      const refreshEvent = new CustomEvent('traitImageUpdated', {
        detail: {
          traitId: traitId,
          layerId: layerId,
          imageData: imageData,
          timestamp: Date.now()
        }
      });
      document.dispatchEvent(refreshEvent);
      
      console.log(`✅ Refreshed ${updatedCount} thumbnails for trait ${traitId}`);
      
      // 8. Force UI refresh for trait layers module
      setTimeout(() => {
        const traitLayersModule = window.NFTApp?.getModule("traitLayers");
        if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
          console.log(`🔄 Forcing trait layer UI refresh for trait ${traitId}`);
          traitLayersModule.updateTraitLayerUI(window.currentProject);
        }
      }, 100);
      
    } catch (error) {
      console.warn(`⚠️ Error refreshing thumbnails for trait ${traitId}:`, error);
    }
  }

  // Show success feedback
  function showTraitReplaceSuccess(traitName) {
    const traitLayersModule = window.NFTApp?.getModule("traitLayers");
    if (traitLayersModule && traitLayersModule.showFeedback) {
      traitLayersModule.showFeedback(`Image for trait "${traitName}" updated successfully`, "success");
    }
  }

  // Override the replace image functionality
  function overrideReplaceImageHandlers() {
    console.log("🔧 Overriding replace image handlers to prevent memory issues...");

    // Find all replace image buttons and inputs
    const replaceButtons = document.querySelectorAll('.replace-trait-image');
    const replaceInputs = document.querySelectorAll('.replace-image-input');

    // Override button click handlers
    replaceButtons.forEach(button => {
      // Remove existing event listeners by cloning the button
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);

      // Add safe click handler
      newButton.addEventListener('click', (e) => {
        e.preventDefault();
        
        const traitId = newButton.getAttribute('data-trait-id');
        const layerId = newButton.getAttribute('data-layer-id');
        
        // Find the corresponding input
        const input = document.querySelector(`input[data-trait-id="${traitId}"][data-layer-id="${layerId}"]`);
        if (input) {
          input.click();
        }
      });
    });

    // Override input change handlers
    replaceInputs.forEach(input => {
      // Remove existing event listeners by cloning the input
      const newInput = input.cloneNode(true);
      input.parentNode.replaceChild(newInput, input);

      // Add safe change handler
      newInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const traitId = newInput.getAttribute('data-trait-id');
        const layerId = newInput.getAttribute('data-layer-id');
        
        // Use safe replacement function
        safeReplaceTraitImage(traitId, layerId, file, window.currentProject);
        
        // Clear the input so the same file can be selected again
        e.target.value = '';
      });
    });

    console.log(`✅ Overrode ${replaceButtons.length} buttons and ${replaceInputs.length} inputs`);
  }

  // Monitor for new replace image elements
  function monitorForNewReplaceElements() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // Check if new replace buttons or inputs were added
              const newButtons = node.querySelectorAll ? node.querySelectorAll('.replace-trait-image') : [];
              const newInputs = node.querySelectorAll ? node.querySelectorAll('.replace-image-input') : [];
              
              if (newButtons.length > 0 || newInputs.length > 0) {
                console.log("🔧 New replace elements detected, applying safe handlers...");
                setTimeout(overrideReplaceImageHandlers, 100);
              }
            }
          });
        }
      });
    });

    // Start observing
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }

  // Initialize the fix
  function initializeTraitReplaceFix() {
    console.log("🔧 Initializing trait replace image memory fix...");
    
    // Override existing handlers
    overrideReplaceImageHandlers();
    
    // Start monitoring for new elements
    monitorForNewReplaceElements();
    
    // Setup event listener for trait image updates
    setupTraitImageUpdateListener();
    
    console.log("✅ Trait replace image memory fix initialized");
  }

  // Add event listener for trait image updates
  function setupTraitImageUpdateListener() {
    document.addEventListener('traitImageUpdated', (event) => {
      const { traitId, layerId, imageData } = event.detail;
      console.log(`🔄 Received trait image update event for trait ${traitId}`);
      
      // Additional refresh for any components that might have missed the direct update
      setTimeout(() => {
        updateAllTraitThumbnails(traitId, layerId, imageData);
      }, 50);
    });
  }

  // Global functions for debugging and manual control
  window.traitReplaceFix = {
    getActiveOperations: () => Array.from(activeReplaceOperations),
    clearActiveOperations: () => activeReplaceOperations.clear(),
    overrideHandlers: overrideReplaceImageHandlers,
    safeReplace: safeReplaceTraitImage,
    refreshAllThumbnails: updateAllTraitThumbnails,
    refreshTraitThumbnails: (traitId, layerId) => {
      if (!window.currentProject) {
        console.warn('No project data available');
        return;
      }
      
      const layer = window.currentProject.traits.find(l => l.id === layerId);
      if (!layer) {
        console.warn(`Layer ${layerId} not found`);
        return;
      }
      
      const trait = layer.traits.find(t => t.id === traitId);
      if (!trait || !trait.imageData) {
        console.warn(`Trait ${traitId} not found or missing imageData`);
        return;
      }
      
      updateAllTraitThumbnails(traitId, layerId, trait.imageData);
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(initializeTraitReplaceFix, 2000);
  });

  // Also initialize immediately if DOM is already ready
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already ready
    setTimeout(initializeTraitReplaceFix, 2000);
  }

  console.log("🔧 Trait Replace Image Memory Fix initialized!");
  console.log("Available functions:");
  console.log("  - window.traitReplaceFix.getActiveOperations()");
  console.log("  - window.traitReplaceFix.clearActiveOperations()");
  console.log("  - window.traitReplaceFix.overrideHandlers()");
  console.log("  - window.traitReplaceFix.refreshAllThumbnails(traitId, layerId, imageData)");
  console.log("  - window.traitReplaceFix.refreshTraitThumbnails(traitId, layerId)");

})();
