/**
 * Trait Image Preview
 * Adds functionality to preview trait images in a modal when clicked
 */

(function() {
  document.addEventListener('DOMContentLoaded', function() {
    console.log('Trait image preview module loaded');
    
    // Create the image preview modal if it doesn't exist
    if (!document.getElementById('trait-image-preview-modal')) {
      const modal = document.createElement('div');
      modal.id = 'trait-image-preview-modal';
      modal.className = 'modal-overlay';
      modal.style.display = 'none';
      modal.innerHTML = `
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">Trait Image Preview</h3>
            <button class="modal-close" style="background: none; border: none; color: #fff; font-size: 24px; cursor: pointer; z-index: 10;">&times;</button>
          </div>
          <div class="modal-body" style="padding: 20px; text-align: center;">
            <!-- Image will be inserted here -->
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      
      // Add close button event listener
      modal.querySelector('.modal-close').addEventListener('click', function() {
        closeImagePreview();
      });
      
      // Also close on clicking outside the image
      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          closeImagePreview();
        }
      });
      
      // Close on ESC key
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
          closeImagePreview();
        }
      });
    }
    
    // Function to open the image preview
    function openImagePreview(imageUrl, traitName) {
      const modal = document.getElementById('trait-image-preview-modal');
      const modalBody = modal.querySelector('.modal-body');
      const modalTitle = modal.querySelector('.modal-title');
      
      // Update the modal title with trait name
      if (traitName) {
        modalTitle.textContent = traitName;
      } else {
        modalTitle.textContent = 'Trait Image Preview';
      }
      
      // Clear any existing image
      const existingImg = modalBody.querySelector('img');
      if (existingImg) {
        existingImg.remove();
      }
      
      // Create and add the image element only if we have a valid URL
      if (imageUrl && imageUrl.trim() !== '') {
        const modalImg = document.createElement('img');
        modalImg.src = imageUrl;
        modalImg.alt = traitName || 'Trait Preview';
        modalImg.style.maxWidth = '80vw';
        modalImg.style.maxHeight = '70vh';
        modalImg.style.objectFit = 'contain';
        modalImg.style.borderRadius = '8px';
        modalImg.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
        modalImg.style.display = 'block';
        modalImg.style.margin = '0 auto';
        modalBody.appendChild(modalImg);
      }
      
      // Show the modal
      modal.style.setProperty('display', 'flex');
      modal.style.setProperty('opacity', '1');
      modal.style.setProperty('pointer-events', 'auto');
    }
    
    // Function to close the image preview
    function closeImagePreview() {
      const modal = document.getElementById('trait-image-preview-modal');
      
      // Hide the modal with smooth transition
      modal.style.setProperty('opacity', '0');
      modal.style.setProperty('pointer-events', 'none');
      
      // After transition, hide completely
      setTimeout(() => {
        modal.style.display = 'none';
      }, 300);
    }
    
    // Add click event listeners to trait images using event delegation
    function setupTraitImageClickHandlers() {
      document.addEventListener('click', function(e) {
        // Don't trigger preview if inside combination rule modal - card click should only toggle selection
        const isInCombinationRuleModal = e.target.closest('#combination-rule-modal') || 
                                         e.target.closest('.combination-rule-modal') ||
                                         e.target.closest('.trait-checkbox-label') ||
                                         e.target.closest('.trait-checkbox-thumb') ||
                                         e.target.closest('.trait-grid-item');
        if (isInCombinationRuleModal) {
          return; // Let the combination rule modal handle its own clicks
        }
        
        // Check if the click was on a trait image
        const traitImage = e.target.closest('.trait-image');
        if (traitImage) {
          // Disable thumbnail click-to-preview inside expanded/collapsed trait layers
          const inTraitLayers = traitImage.closest('.trait-layer-content') || traitImage.closest('.trait-layer-trait-item') || traitImage.closest('.trait-layer');
          if (inTraitLayers) {
            return;
          }
          const img = traitImage.querySelector('img');
          if (img && img.src) {
            // Find the trait name, layer name, and rarity
            let traitName = 'Trait Preview';
            let layerName = '';
            let rarity = '';
            const traitItem = traitImage.closest('.trait-layer-trait-item') || traitImage.closest('.trait-item');
            if (traitItem) {
              // Try multiple possible selectors for trait name
              const nameElement = traitItem.querySelector('.trait-layer-trait-name-ellipsis-list') ||
                                  traitItem.querySelector('.trait-name-ellipsis-list') || 
                                  traitItem.querySelector('.trait-name') || 
                                  traitItem.querySelector('.trait-name-ellipsis-combo');
              if (nameElement) {
                traitName = nameElement.textContent || nameElement.innerText;
              } else {
                // Fallback: try to get name from title/alt
                traitName = img.alt || traitName;
              }
              
              // Find rarity from the rarity input field
              const rarityInput = traitItem.querySelector('.trait-rarity-input');
              if (rarityInput) {
                rarity = rarityInput.value;
              }
              
              // Find layer name - search in the parent layer container
              const layerItem = traitItem.closest('.trait-layer');
              if (layerItem) {
                // Find layer name from header - it's inside .trait-layer-header
                const layerHeader = layerItem.querySelector('.trait-layer-header');
                if (layerHeader) {
                  // Try to find the layer name element with multiple selectors
                  let layerNameElement = layerHeader.querySelector('.trait-layer-info .trait-layer-name');
                  if (!layerNameElement) {
                    layerNameElement = layerHeader.querySelector('.trait-layer-name');
                  }
                  if (!layerNameElement) {
                    layerNameElement = layerHeader.querySelector('.layer-name');
                  }
                  if (!layerNameElement) {
                    // Try to find span with layer-name class
                    layerNameElement = layerItem.querySelector('.layer-name span');
                  }
                  
                  if (layerNameElement) {
                    layerName = layerNameElement.textContent || layerNameElement.innerText;
                  } else {
                    // Additional fallback: look for any element with layer name in the header
                    const headerText = layerHeader.textContent || layerHeader.innerText;
                    if (headerText) {
                      // Extract layer name from header text (usually first line)
                      const lines = headerText.split('\n').filter(line => line.trim());
                      if (lines.length > 0) {
                        layerName = lines[0].trim();
                      }
                    }
                  }
                }
              }
            }
            
            // Use Trait Full-Size Popup for visual consistency
            const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
            if (generateNftsUI && generateNftsUI.showTraitFullSizePopup) {
              console.log('[Trait Image Preview] Found layer name:', layerName, 'for trait:', traitName);
              const traitObj = { 
                trait: { 
                  image: img.src, 
                  imageData: img.src, 
                  name: traitName,
                  rarity: rarity 
                }, 
                layer: { name: layerName } 
              };
              generateNftsUI.showTraitFullSizePopup(traitObj, layerName || 'Unknown Layer', traitName);
            } else {
              // Fallback to old preview system
              openImagePreview(img.src, traitName);
            }
            
            // Prevent any other click handlers
            e.stopPropagation();
          }
        }
        
        // Also check for .nft-trait-thumb images (in the traits info panel)
        const traitThumb = e.target.closest('.nft-trait-thumb');
        if (traitThumb && !traitImage) {
          // Don't trigger if inside the Edit NFT modal (it has its own handler)
          const isInsideEditModal = e.target.closest('.nft-edit-modal-content') || e.target.closest('.nft-edit-traits-list-card');
          if (isInsideEditModal) {
            return; // Let the Edit NFT modal's handler take care of it
          }
          
          // Don't trigger if inside combination rule modal
          const isInCombinationRuleModal = e.target.closest('#combination-rule-modal') || 
                                           e.target.closest('.combination-rule-modal') ||
                                           e.target.closest('.trait-checkbox-label') ||
                                           e.target.closest('.trait-checkbox-thumb') ||
                                           e.target.closest('.trait-grid-item');
          if (isInCombinationRuleModal) {
            return; // Let the combination rule modal handle its own clicks
          }
          
          const img = traitThumb.querySelector('img');
          if (img && img.src) {
            // Get trait name from parent .nft-trait-info-item if available
            let traitName = 'Trait Preview';
            const traitInfoItem = traitThumb.closest('.nft-trait-info-item');
            if (traitInfoItem) {
              const layerNameElem = traitInfoItem.querySelector('.nft-trait-layer-name');
              const traitNameElem = traitInfoItem.querySelector('.nft-trait-name');
              
              if (layerNameElem && traitNameElem) {
                traitName = `${layerNameElem.textContent}: ${traitNameElem.textContent}`;
              } else if (traitNameElem) {
                traitName = traitNameElem.textContent;
              }
            }
            
            // Use the built-in image preview if the clicked image already has a click handler
            if (!e.target.hasClickHandler) {
              openImagePreview(img.src, traitName);
              e.stopPropagation();
            }
          }
        }
      });
    }
    
    // Set up click handlers
    setupTraitImageClickHandlers();
    
    // Re-apply when traits are updated
    document.addEventListener('traits-updated', function() {
      console.log('Traits updated, ensuring image preview handlers are active');
    });
    
    // Export functions for potential external use
    window.traitImagePreview = {
      open: openImagePreview,
      close: closeImagePreview
    };
  });
})(); 