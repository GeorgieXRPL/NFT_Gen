console.log('[DEBUG] trait-selection-handler.js loaded');
/**
 * Trait Selection Handler
 * Improves the trait selection modal functionality
 * Updates NFT preview when traits are changed
 */
(function() {
  // Track the original NFT state before edits
  let originalNft = null;
  let currentEditingLayerName = null;
  let currentEditingTraitIndex = null;
  let currentEditingTraitName = null;
  
  // Wait for the DOM to be fully loaded
  document.addEventListener('DOMContentLoaded', function() {
    console.log('[DEBUG] DOMContentLoaded in trait-selection-handler.js');
    // Listen for trait edit modal events
    setupTraitSelectionHandler();
    
    // Also hook into the showTraitSelectionModal function to sort traits alphabetically
    enhanceTraitSelectionModal();
  });
  
  // Patch the correct modal function for trait selection
  function enhanceTraitSelectionModal() {
    // Get reference to the original function
    const originalShowModal = NFTApp.getModule('generateNftsUI').showTraitSelectionModal;
    if (originalShowModal) {
      NFTApp.getModule('generateNftsUI').showTraitSelectionModal = function(layerName, traitIndex, nft, projectData) {
        // Store the current trait index for later use
        currentEditingTraitIndex = traitIndex;
        // Store the current layer name for later use
        currentEditingLayerName = layerName;
        // Store the current trait name for later use
        if (nft && nft.traits && typeof traitIndex === 'number' && nft.traits[traitIndex]) {
          currentEditingTraitName = nft.traits[traitIndex].trait && nft.traits[traitIndex].trait.name ? nft.traits[traitIndex].trait.name : null;
        } else {
          currentEditingTraitName = null;
        }
        // Log the trait being edited
        console.log(`Editing trait at index ${traitIndex} for layer ${layerName}`);
        // Always call the latest showTraitSelectionModal from generateNftsUI
        window.NFTApp.getModule('generateNftsUI')._originalShowTraitSelectionModal(layerName, traitIndex, nft, projectData);
        // After original function creates the modal, add search functionality and sort the traits
        setTimeout(() => {
          // REMOVE sortTraitsAlphabetically();
          enhanceTraitThumbnails();
        }, 50);
      };
      // Save the original for future wrappers
      NFTApp.getModule('generateNftsUI')._originalShowTraitSelectionModal = originalShowModal;
    }
  }
  
  // Enhance trait thumbnails to improve display
  function enhanceTraitThumbnails() {
    console.log('[DEBUG] enhanceTraitThumbnails called');
    const modal = document.getElementById('trait-selection-modal');
    console.log('[DEBUG] Modal found:', modal);
    if (!modal) return;
    
    const traitThumbs = modal.querySelectorAll('.trait-selection-thumb');
    console.log(`Enhancing ${traitThumbs.length} trait thumbnails in modal`);
    
    traitThumbs.forEach((thumb, index) => {
      // Add image container for better centering if it doesn't exist
      const img = thumb.querySelector('img');
      if (img) {
        console.log(`Processing thumbnail ${index}: ${thumb.getAttribute('data-trait-id')}`);
        
        // Add hover title for trait name
        const traitName = thumb.querySelector('div:first-of-type')?.textContent?.trim();
        if (traitName) {
          img.setAttribute('title', traitName);
        }
        
        // Make sure image is not already in a container
        if (!img.parentNode.classList.contains('trait-image-container')) {
          // Wrap image in container for better centering
          const container = document.createElement('div');
          container.className = 'trait-image-container';
          img.parentNode.insertBefore(container, img);
          container.appendChild(img);
          
          // Add enhanced styling directly on the element
          img.style.position = 'absolute';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'contain';
          img.style.padding = '10px';
          img.style.top = '0';
          img.style.left = '0';
          img.style.right = '0';
          img.style.bottom = '0';
          img.style.margin = 'auto';
          img.style.transition = 'transform 0.2s ease';
          
          // Add container styling
          container.style.position = 'absolute';
          container.style.width = '100%';
          container.style.height = '100%';
          container.style.display = 'flex';
          container.style.alignItems = 'center';
          container.style.justifyContent = 'center';
          container.style.zIndex = '1';
          container.style.top = '0';
          container.style.left = '0';
          container.style.padding = '10px';
          container.style.boxSizing = 'border-box';
          
          console.log(`Added image container to thumbnail ${index}`);
        }
        
        // Add hover effects
        thumb.addEventListener('mouseover', () => {
          img.style.transform = 'scale(1.05)';
        });
        thumb.addEventListener('mouseout', () => {
          img.style.transform = 'scale(1)';
        });
      } else {
        console.log(`No image found in thumbnail ${index}`);
      }
    });
    
    // After sorting/enhancement, re-apply overlays using the modal's NFT/project data
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI') && typeof window.NFTApp.getModule('generateNftsUI').applyForbiddenOverlaysToModal === 'function') {
      // Find the modal, get the current NFT and projectData from the modal context if possible
      const modal = document.getElementById('trait-selection-modal');
      let nft = modal && modal._nft ? modal._nft : window.lastGeneratedNFT;
      let projectData = modal && modal._projectData ? modal._projectData : window.currentProject;
      console.log('[DEBUG] Calling applyForbiddenOverlaysToModal with NFT:', nft, 'projectData:', projectData);
      window.NFTApp.getModule('generateNftsUI').applyForbiddenOverlaysToModal(modal, nft, projectData);
    }
    
    // Force resizing of modal to ensure proper layout
    setTimeout(() => {
      const modalElement = modal.querySelector('.modal');
      if (modalElement) {
        const currentWidth = modalElement.style.width;
        modalElement.style.width = 'calc(95% - 1px)';
        setTimeout(() => {
          modalElement.style.width = currentWidth || '95%';
        }, 10);
      }
    }, 100);
    
    // Grid layout is now handled in the main modal - no need to override here
    
    console.log("Enhanced trait thumbnails");
  }
  
  // Sort traits alphabetically in the trait selection modal
  function sortTraitsAlphabetically() {
    const modal = document.getElementById('trait-selection-modal');
    if (!modal) return;
    
    const traitsList = modal.querySelector('.trait-selection-list');
    if (!traitsList) return;
    
    // Get all trait thumbnails, but exclude the "None" option
    let traitItems = Array.from(traitsList.querySelectorAll('.trait-selection-thumb:not([data-trait-id="none"])'));
    
    // Sort the trait items alphabetically by trait name
    traitItems.sort((a, b) => {
      const nameA = a.querySelector('div:first-of-type')?.textContent?.trim().toLowerCase() || '';
      const nameB = b.querySelector('div:first-of-type')?.textContent?.trim().toLowerCase() || '';
      return nameA.localeCompare(nameB);
    });
    
    // Find the "None" option, which should always be first
    const noneItem = traitsList.querySelector('.trait-selection-thumb[data-trait-id="none"]');
    
    // Clear the trait list
    traitsList.innerHTML = '';
    
    // Add the "None" option back first if it exists
    if (noneItem) {
      traitsList.appendChild(noneItem);
    }
    
    // Add the sorted traits back to the list
    traitItems.forEach(item => {
      // Improve image centering by wrapping in container
      const img = item.querySelector('img');
      if (img && !img.parentNode.classList.contains('trait-image-container')) {
        const container = document.createElement('div');
        container.className = 'trait-image-container';
        img.parentNode.insertBefore(container, img);
        container.appendChild(img);
      }
      
      traitsList.appendChild(item);
    });
    
    // Re-attach click handlers to all thumbnails
    const allThumbs = traitsList.querySelectorAll('.trait-selection-thumb');
    allThumbs.forEach(thumb => {
      // Do NOT set thumb.onclick here anymore (handled in generate-nfts-ui.js)
    });
  }
  
  // Set up event handlers for trait selection modal
  function setupTraitSelectionHandler() {
    console.log("Setting up trait selection handler");
    // Watch for modal opening
    document.addEventListener('click', function(event) {
      // Check if this is a click on an edit button
      if (event.target.classList.contains('nft-trait-edit-btn') || 
          event.target.closest('.nft-trait-edit-btn')) {
        console.log("Edit button clicked, preparing for modal interaction");
        // Store the current NFT state
        if (window.lastGeneratedNFT) {
          originalNft = JSON.parse(JSON.stringify(window.lastGeneratedNFT));
          console.log("Stored original NFT state for reference");
        }
        // Get layer name and trait index from button
        const button = event.target.classList.contains('nft-trait-edit-btn') ? 
                        event.target : event.target.closest('.nft-trait-edit-btn');
        currentEditingLayerName = button.getAttribute('data-layer');
        currentEditingTraitIndex = parseInt(button.getAttribute('data-idx'), 10);
        console.log(`Retrieved edit metadata - Layer: ${currentEditingLayerName}, Index: ${currentEditingTraitIndex}`);
        // Wait for modal to appear in the DOM
        setTimeout(() => {
          setupModalEventListeners();
        }, 100);
      }
    });
  }
  
  // Helper function to close the modal after applying changes
  function closeModalAfterChange() {
    const modal = document.getElementById('trait-selection-modal');
    if (!modal) return;
    // Remove any MutationObservers attached to the modal
    if (modal._mutationObservers) {
      modal._mutationObservers.forEach(obs => { try { obs.disconnect(); } catch (e) {} });
      modal._mutationObservers = null;
    }
    // Remove Escape key handler
    document.removeEventListener('keydown', escModalHandler, true);
    // Remove all event listeners from modal children to prevent leaks
    const clone = modal.cloneNode(false); // shallow clone, no children
    if (modal.parentNode) modal.parentNode.replaceChild(clone, modal);
    setTimeout(() => { if (clone.parentNode) clone.parentNode.removeChild(clone); }, 200);
    // Ensure modal event listeners are always re-setup on next open
    setTimeout(() => { setupModalEventListeners(); }, 300);
    // Remove any lingering references
    window.currentEditingLayerName = null;
    window.currentEditingTraitIndex = null;
    window.currentEditingTraitName = null;
  }

  // Escape key handler for modal
  function escModalHandler(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeModalAfterChange();
    }
  }
  
  // Set up event listeners for the modal once it appears
  function setupModalEventListeners() {
    const modal = document.getElementById('trait-selection-modal');
    if (!modal) {
      console.log("Modal not found, will try again");
      setTimeout(setupModalEventListeners, 100);
      return;
    }
    console.log("Modal found, setting up event listeners");
    // Add Escape key handler
    document.addEventListener('keydown', escModalHandler, true);
    // Force all trait-selection-thumb and trait-selection-img to 75x75px
    const thumbs = modal.querySelectorAll('.trait-selection-thumb');
    thumbs.forEach(thumb => {
      thumb.style.width = '75px';
      thumb.style.height = '75px';
      const imgDiv = thumb.querySelector('.trait-selection-img');
      if (imgDiv) {
        imgDiv.style.width = '75px';
        imgDiv.style.height = '75px';
      }
      // Do NOT set thumb.onclick here anymore (handled in generate-nfts-ui.js)
    });
    // Handle apply button click
    const applyBtn = modal.querySelector('#modal-apply-btn');
    if (applyBtn) {
      // Remove any existing listeners to prevent duplicates
      const newApplyBtn = applyBtn.cloneNode(true);
      applyBtn.parentNode.replaceChild(newApplyBtn, applyBtn);
      // Add new click handler for the apply button
      newApplyBtn.addEventListener('click', function() {
        applyTraitChange(modal);
        closeModalAfterChange();
      });
    }
    // Handle cancel button click
    const cancelBtn = modal.querySelector('#modal-cancel-btn');
    if (cancelBtn) {
      // Remove any existing listeners to prevent duplicates
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      newCancelBtn.addEventListener('click', function() {
        closeModalAfterChange();
      });
    }
  }
  
  // --- Add getRulesForLayer helper (copied from generate-nfts-ui.js if not present) ---
  function getRulesForLayer(projectData, layer) {
    if (!projectData || !projectData.rules || !layer) return [];
    return projectData.rules.filter(rule => {
      // between-layers
      if (rule.firstLayerId && rule.secondLayerId) {
        return rule.firstLayerId === layer.id || rule.secondLayerId === layer.id;
      }
      // between-traits
      if (rule.firstTraits && rule.secondTraits) {
        return (rule.firstTraits.some(t => t.layerId === layer.id) || rule.secondTraits.some(t => t.layerId === layer.id));
      }
      // layer-to-traits or traits-to-layer
      if (rule.layerId) {
        if (rule.layerId === layer.id) return true;
        if (rule.traits && rule.traits.some(t => t.layerId === layer.id)) return true;
      }
      return false;
    });
  }
  
  // Function to apply a trait change
  function applyTraitChange(modal) {
    console.log("Applying trait change");
    // Get the selected trait
    const selectedThumb = modal.querySelector('.trait-selection-thumb.selected');
    if (!selectedThumb) {
      console.log("No trait selected, cannot apply changes");
      return;
    }
    const traitId = selectedThumb.getAttribute('data-trait-id');
    const layerId = selectedThumb.getAttribute('data-layer-id');
    console.log(`Applying trait change: Layer ID ${layerId}, Trait ID ${traitId}`);
    // Get the NFT and project data
    const nft = window.lastGeneratedNFT;
    const projectData = window.currentProject;
    // Save a backup of the NFT before changes
    const nftBackup = JSON.parse(JSON.stringify(nft));
    // Find the layer
    const layer = projectData.traits.find(l => l.id === layerId);
    if (!layer) {
      console.error(`Layer with ID ${layerId} not found`);
      closeModalAfterChange();
      return;
    }
    // Find the trait
    let newTrait = null;
    if (traitId === 'none') {
      newTrait = { id: 'none', name: 'none' };
    } else {
      newTrait = layer.traits.find(t => t.id === traitId);
      if (!newTrait) {
        console.error(`Trait with ID ${traitId} not found in layer ${layer.name}`);
        closeModalAfterChange();
        return;
      }
    }
    // --- PREVIEW THE TRAIT CHANGE ON A DEEP COPY ---
    const nftPreview = JSON.parse(JSON.stringify(nft));
    let traitToUpdateIdx = nftPreview.traits.findIndex(t => t.layer && (t.layer.id === layerId || t.layer.name === layer.name));
    if (traitToUpdateIdx === -1) {
      console.error(`Could not find trait to update for layer '${layer.name}' in NFT.`);
      closeModalAfterChange();
      return;
    }
    nftPreview.traits[traitToUpdateIdx].trait = JSON.parse(JSON.stringify(newTrait));
    // --- CHECK FOR RULE VIOLATIONS BEFORE APPLYING (ONLY RELEVANT RULES) ---
    let hasViolation = false;
    let violationMsg = '';
    const layerRules = getRulesForLayer(projectData, layer);
    if (layerRules.length > 0 && window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("generateNfts")) {
      const violations = window.NFTApp.getModule("generateNfts").checkForRuleViolations(nftPreview, layerRules);
      if (violations.length > 0) {
        hasViolation = true;
        violationMsg = Array.isArray(violations) ? violations.join('\n') : violations;
      }
    }
    // --- If violation, show confirmation modal ---
    const doApply = () => {
      let traitToUpdateIdxReal = nft.traits.findIndex(t => t.layer && (t.layer.id === layerId || t.layer.name === layer.name));
      if (traitToUpdateIdxReal === -1) {
        console.error(`Could not find trait to update for layer '${layer.name}' in NFT.`);
        closeModalAfterChange();
        return;
      }
      nft.traits[traitToUpdateIdxReal].trait = JSON.parse(JSON.stringify(newTrait));
      // --- UNIVERSAL RULE AUTO-FIX LOGIC ---
      if (projectData.rules && projectData.rules.length > 0 && window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("generateNfts")) {
        let fixAttempts = 0;
        const maxFixAttempts = 5;
        let violations = window.NFTApp.getModule("generateNfts").checkForRuleViolations(nft, layerRules);
        while (violations.length > 0 && fixAttempts < maxFixAttempts) {
          let fixed = false;
          for (const violation of violations) {
            // Layer above layer
            let match = violation.match(/Layer \"(.+?)\" must be rendered immediately above \"(.+?)\"/);
            if (match) {
              const above = match[1];
              const below = match[2];
              const aboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === above);
              const belowIdx = nft.traits.findIndex(t => t.layer && t.layer.name === below);
              if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx !== belowIdx + 1) {
                const [aboveTrait] = nft.traits.splice(aboveIdx, 1);
                nft.traits.splice(belowIdx + 1, 0, aboveTrait);
                fixed = true;
              }
              continue;
            }
            // Layer below layer
            match = violation.match(/Layer \"(.+?)\" must be rendered immediately below \"(.+?)\"/);
            if (match) {
              const below = match[1];
              const above = match[2];
              const belowIdx = nft.traits.findIndex(t => t.layer && t.layer.name === below);
              const aboveIdx = nft.traits.findIndex(t => t.layer && t.layer.name === above);
              if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx !== aboveIdx + 1) {
                const [belowTrait] = nft.traits.splice(belowIdx, 1);
                nft.traits.splice(aboveIdx + 1, 0, belowTrait);
                fixed = true;
              }
              continue;
            }
            // Trait above trait
            match = violation.match(/Trait \"(.+?)\" must be rendered immediately above \"(.+?)\"/);
            if (match) {
              const above = match[1];
              const below = match[2];
              const aboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === above);
              const belowIdx = nft.traits.findIndex(t => t.trait && t.trait.name === below);
              if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx !== belowIdx + 1) {
                const [aboveTrait] = nft.traits.splice(aboveIdx, 1);
                nft.traits.splice(belowIdx + 1, 0, aboveTrait);
                fixed = true;
              }
              continue;
            }
            // Trait below trait
            match = violation.match(/Trait \"(.+?)\" must be rendered immediately below \"(.+?)\"/);
            if (match) {
              const below = match[1];
              const above = match[2];
              const belowIdx = nft.traits.findIndex(t => t.trait && t.trait.name === below);
              const aboveIdx = nft.traits.findIndex(t => t.trait && t.trait.name === above);
              if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx !== aboveIdx - 1) {
                const [belowTrait] = nft.traits.splice(belowIdx, 1);
                nft.traits.splice(aboveIdx, 0, belowTrait);
                fixed = true;
              }
              continue;
            }
          }
          fixAttempts++;
          violations = window.NFTApp.getModule("generateNfts").checkForRuleViolations(nft, layerRules);
          if (!fixed) break;
        }
      }
      // --- END UNIVERSAL RULE AUTO-FIX LOGIC ---
      // --- ALWAYS UPDATE SEED AFTER TRAIT CHANGE ---
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("generateNfts")) {
        const newSeed = window.NFTApp.getModule("generateNfts").computeDeterministicSeed(projectData, nft);
        nft.seed = newSeed;
        // Update seed display in UI
        const seedDisplay = document.querySelector('.seed-number');
        if (seedDisplay) {
          seedDisplay.textContent = newSeed;
        }
      }
      // --- END SEED UPDATE ---
      // Use the main generator to create the NFT image and update the preview
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("generateNfts")) {
        window.NFTApp.getModule("generateNfts").generateSingleNFT(projectData, true, nft.seed)
          .then(newNft => {
            // Update the NFT object with the new image and traits
            Object.assign(nft, newNft);
            // Ensure imageData is properly set
            if (newNft.imageData) {
              nft.imageData = newNft.imageData;
            }
            window.lastGeneratedNFT = nft;
            console.log('[DEBUG] Updated NFT after trait change:', nft);
            console.log('[DEBUG] NFT has imageData:', !!nft.imageData);
            // Update the preview and trait info list
            if (window.NFTApp.getModule("generateNftsUI")) {
              window.NFTApp.getModule("generateNftsUI").updateSinglePreviewPanel(projectData, nft);
            }
            // Check if we need to show the Update NFT button
            console.log('[DEBUG] Trait change detected in trait-selection-handler, checking for Update NFT button');
          closeModalAfterChange();
        })
        .catch(error => {
          console.error("Error regenerating NFT image:", error);
            if (window.NFTApp.getModule("generateNftsUI")) {
              window.NFTApp.getModule("generateNftsUI").updateTraitInfoPanel(nft, projectData);
            }
          closeModalAfterChange();
        });
      }
    };
    if (hasViolation) {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('confirmationModal')) {
        // Format violations for the small text, always one per line, and remove duplicates
        let uniqueViolations = Array.from(new Set(violationMsg.split('\n').map(v => v.replace(/^Rule Violation: /, '').trim())));
        let violationsList = uniqueViolations.join('<br>');
        // Main message and question, each on its own line, with clear formatting
        const mainMsg = '<div style="font-size:14px;font-weight:500;color:#ff2222;line-height:1.2;margin-bottom:8px;">This trait combination does not respect one or more active rules.</div>';
        const question = '<div style="font-size:15px;font-weight:600;color:#fff;margin-bottom:2px;">Are you sure you want to apply this trait anyway?</div>';
        const consequence = '<div style="font-size:13px;color:#fff;margin-bottom:10px;">This may result in an invalid or non-compliant NFT.</div>';
        const hr = '<hr style="border:0;border-top:1px solid #444;margin:10px 0 10px 0;">';
        const ruleHeader = '<div style="font-size:13px;color:#ffbaba;font-weight:600;margin-bottom:2px;">Rule violation(s):</div>';
        const ruleList = `<div style="font-size:13px;color:#ffbaba;line-height:1.5;">${violationsList}</div>`;
        // Compose the full description
        const fullDescription = question + consequence + hr + ruleHeader + ruleList;
        // Show modal (pass HTML for message and description)
        window.NFTApp.getModule('confirmationModal').show(
          'Forbidden Trait Combination',
          mainMsg,
          fullDescription,
          doApply
        );
      } else {
        doApply();
      }
      return;
    }
    // No violation, apply directly
    doApply();
  }
  
  // Helper function to update the NFT preview image
  function updateNftPreviewImage(imageData) {
    const previewPanel = document.querySelector('.nft-preview-image-area');
    if (!previewPanel) {
      console.error("Preview panel not found, cannot update NFT image");
      return;
    }
    
    // Only update if we have new image data
    if (imageData) {
      // Get or create preview container
      let previewContainer = previewPanel.querySelector('#nft-preview-container');
      if (!previewContainer) {
        previewContainer = document.createElement('div');
        previewContainer.id = 'nft-preview-container';
        previewContainer.style.position = 'relative';
        previewContainer.style.width = '100%';
        previewContainer.style.height = '100%';
        previewPanel.appendChild(previewContainer);
      }
      
      // Dim existing NFTs and render new one on top
      const existingItems = previewContainer.querySelectorAll('.nft-preview-item');
      existingItems.forEach(item => {
        item.style.opacity = '0.3';
        item.style.zIndex = '1';
      });
      
      // Create new NFT preview item
      const previewItem = document.createElement('div');
      previewItem.className = 'nft-preview-item';
      previewItem.style.position = 'absolute';
      previewItem.style.top = '0';
      previewItem.style.left = '0';
      previewItem.style.width = '100%';
      previewItem.style.height = '100%';
      previewItem.style.zIndex = '2';
      previewItem.style.opacity = '1';
      previewItem.style.display = 'flex';
      previewItem.style.alignItems = 'center';
      previewItem.style.justifyContent = 'center';
      previewItem.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
      previewItem.style.borderRadius = '8px';
      
      // Create the image element
      const img = document.createElement('img');
      if (typeof window.traitImageLoader !== 'undefined' && window.traitImageLoader.normalizeImageUrl) {
        img.src = window.traitImageLoader.normalizeImageUrl(imageData);
      } else {
        img.src = imageData.startsWith('data:') ? imageData : `${imageData}?t=${Date.now()}`;
      }
      img.alt = "NFT Preview";
      img.style.maxWidth = '100%';
      img.style.maxHeight = '100%';
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      
      // Add error handling
      img.onerror = function() {
        console.error("Failed to load NFT preview image");
        this.onerror = null;
        this.style.display = 'none';
      };
      
      // Once the new image is fully loaded, remove old NFT preview items
      img.onload = () => {
        // Remove all old NFT preview items except the current one
        const allItems = previewContainer.querySelectorAll('.nft-preview-item');
        allItems.forEach(item => {
          if (item !== previewItem) {
            item.remove();
          }
        });
      };
      
      previewItem.appendChild(img);
      previewContainer.appendChild(previewItem);
      
      // Add click handler to open full-size NFT popup
      previewItem.addEventListener('click', () => {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
          window.NFTApp.getModule('generateNftsUI').openNftPopup(window.lastGeneratedNFT);
        }
      });
      
      // Add cursor pointer to indicate clickable
      previewItem.style.cursor = 'pointer';
    }
    
    // CRITICAL: Always update the traits panel to match the displayed NFT
    if (window.lastGeneratedNFT && window.NFTApp && window.NFTApp.getModule) {
      const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
      if (generateNftsUIModule && generateNftsUIModule.updateTraitInfoPanel) {
        console.log('[DEBUG] updateNftPreviewImage: Updating traits panel to match displayed NFT');
        const projectData = generateNftsUIModule.projectData || window.currentProject;
        if (projectData) {
          generateNftsUIModule.updateTraitInfoPanel(window.lastGeneratedNFT, projectData);
        } else {
          console.warn('[DEBUG] updateNftPreviewImage: No project data available for traits panel update');
        }
      }
    }
    
    console.log("Updated NFT preview image successfully");
  }

  // Update the UI after a trait change
  function updateUiAfterTraitChange(nft, projectData) {
    // This function can be simplified as most of the work is now done in applyTraitChange
    console.log("Updating UI after trait change");
    // Ensure the lastGeneratedNFT is up to date
    window.lastGeneratedNFT = nft;
    // Update seed display
    const seedDisplay = document.querySelector('.seed-number');
    if (seedDisplay) {
      seedDisplay.textContent = nft.seed;
    }
    // Use the correct forbidden overlay logic from generate-nfts-ui.js
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
      window.NFTApp.getModule('generateNftsUI').updateTraitInfoPanel(nft, projectData);
    }
    // Update the NFT image
    if (nft.imageData) {
      updateNftPreviewImage(nft.imageData);
    }
    // Show success notification
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
      window.NFTApp.getModule("notificationService").show(
        "NFT updated successfully!",
        "success",
        3000
      );
    }
  }

  // Global helper to regenerate NFT image and seed after direct trait image replacement
  window.regenerateNftImageAndSeed = function() {
    const nft = window.lastGeneratedNFT;
    const projectData = window.currentProject;
    if (!nft || !projectData) return;
    // Generate a deterministic seed based on the new trait combination
    const seedService = window.NFTApp.getModule && window.NFTApp.getModule("seedService");
    let newSeed = null;
    if (seedService && projectData.seedAlgorithm) {
      const traitCombination = nft.traits.map(t => ({
        layer: t.layer && t.layer.name ? t.layer.name : (typeof t.layer === 'string' ? t.layer : ''),
        trait: t.trait && t.trait.name ? t.trait.name : (typeof t.trait === 'string' ? t.trait : '')
      }));
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (generateNftsModule) {
        newSeed = generateNftsModule.computeDeterministicSeed(projectData, nft);
      } else {
        // Fallback to old method if generateNfts module not available
        newSeed = seedService.generateSeed(traitCombination, projectData.seedAlgorithm);
      }
    } else {
      const timestamp = Date.now();
      const randomPart = Math.floor(Math.random() * 1000000);
      newSeed = `${randomPart}-${timestamp}`;
    }
    nft.seed = newSeed;
    window.lastGeneratedNFT = nft;

    // Regenerate the NFT image (canvas logic)
    const canvas = document.createElement("canvas");
    canvas.width = 1000;
    canvas.height = 1000;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // --- FIX: Always sort traits to match stacking order (background at bottom) ---
    let traitsToRender = [...nft.traits];
    if (projectData && projectData.traits && Array.isArray(projectData.traits)) {
      const stackingOrder = projectData.traits.map(l => l.name || l.id);
      traitsToRender.sort((a, b) => {
        const aIdx = stackingOrder.indexOf(a.layer && a.layer.name ? a.layer.name : a.layer);
        const bIdx = stackingOrder.indexOf(b.layer && b.layer.name ? b.layer.name : b.layer);
        return aIdx - bIdx;
      });
    }
    // --- END FIX ---

    const imagePromises = [];
    for (let i = 0; i < traitsToRender.length; i++) {
      const traitObj = traitsToRender[i];
      if (traitObj.trait === 'none' || (traitObj.trait && traitObj.trait.name === 'none')) continue;
      let imgSrc = '';
      if (traitObj.trait) {
        if (traitObj.trait.imageData) {
          imgSrc = traitObj.trait.imageData;
        } else if (traitObj.trait.image) {
          imgSrc = typeof traitObj.trait.image === 'object' ? traitObj.trait.image.src : traitObj.trait.image;
        }
      }
      if (!imgSrc) continue;
      const promise = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
          traitObj.trait.loadedImage = img;
          resolve();
        };
        img.onerror = () => resolve();
        img.src = imgSrc;
      });
      imagePromises.push(promise);
    }
    Promise.all(imagePromises).then(() => {
      traitsToRender.forEach(traitObj => {
        if (!traitObj || !traitObj.trait) return;
        const trait = traitObj.trait;
        if (trait === 'none' || trait.name === 'none') return;
        if (trait.loadedImage) {
          ctx.drawImage(trait.loadedImage, 0, 0, canvas.width, canvas.height);
        }
      });
      const imageData = canvas.toDataURL("image/png");
      nft.imageData = imageData;
      window.lastGeneratedNFT.imageData = imageData;
      if (window.updateUiAfterTraitChange) {
        window.updateUiAfterTraitChange(window.lastGeneratedNFT, window.currentProject);
      }
    });
  };

  // Helper to clear NFT preview and trait info before rendering a new NFT
  function clearNftPreviewAndTraits() {
    // Only clear trait info, keep old NFT visible until new one renders
    const traitInfoList = document.querySelector('.nft-trait-info-list');
    if (traitInfoList) traitInfoList.innerHTML = '';
    
    // Don't clear preview panel to keep old NFT visible during generation
    // The new NFT will be layered on top of the old one
  }

  // Patch: Always clear preview and trait info before rendering new NFT
  const origUpdateNftPreviewImage = window.updateNftPreviewImage;
  window.updateNftPreviewImage = function(imageData) {
    clearNftPreviewAndTraits();
    origUpdateNftPreviewImage.call(this, imageData);
  };
  if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
    const origDisplaySingleNFT = window.NFTApp.getModule('generateNftsUI').displaySingleNFT;
    window.NFTApp.getModule('generateNftsUI').displaySingleNFT = function(nft) {
      clearNftPreviewAndTraits();
      origDisplaySingleNFT.call(this, nft);
    };
  }

  // Add this helper at the top-level of the IIFE
  function setSelectedTraitThumb(thumb) {
    const modal = document.getElementById('trait-selection-modal');
    const allThumbs = modal.querySelectorAll('.trait-selection-thumb');
    allThumbs.forEach(t => {
      t.classList.remove('selected');
      t.style.border = '';
      t.style.boxShadow = '';
      t.style.zIndex = '';
      const indicator = t.querySelector('.trait-selected-indicator');
      if (indicator) indicator.remove();
    });
    thumb.classList.add('selected');
    thumb.style.border = 'none';
    thumb.style.boxShadow = '0 0 0 3px #6c5ce7';
    thumb.style.zIndex = '20';
    if (!thumb.querySelector('.trait-selected-indicator')) {
      const checkmark = document.createElement('div');
      checkmark.className = 'trait-selected-indicator';
      checkmark.textContent = '✓';
      checkmark.style.position = 'absolute';
      checkmark.style.top = '2px';
      checkmark.style.right = '4px';
      checkmark.style.color = '#6c5ce7';
      checkmark.style.fontWeight = 'bold';
      checkmark.style.zIndex = '10';
      thumb.appendChild(checkmark);
    }
  }
})(); 