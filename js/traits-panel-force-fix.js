/**
 * Traits Panel Force Fix
 * This script ensures all trait thumbnails properly fill their containers
 */
(function() {
  // Add global storage for the last NFT and project data
  window.lastGeneratedNFT = null;
  window.lastProjectData = null;
  
  // Monitor NFT generation to save data
  const originalRandomizeSingleNFT = NFTApp.getModule("generateNfts").randomizeSingleNFT;
  if (originalRandomizeSingleNFT) {
    NFTApp.getModule("generateNfts").randomizeSingleNFT = function(projectData, overrideRules = false) {
      // Store project data globally
      window.lastProjectData = projectData;
      
      // Call the original function
      return originalRandomizeSingleNFT.call(this, projectData, overrideRules);
    };
  }
  
  // Fix the showTraitSelectionModal function to use stored data when needed
  const originalShowTraitSelectionModal = NFTApp.getModule("generateNfts").showTraitSelectionModal;
  if (originalShowTraitSelectionModal) {
    NFTApp.getModule("generateNfts").showTraitSelectionModal = function(layerName, traitIndex, nft, projectData) {
      // If nft or projectData are missing, use the stored values
      if (!nft && window.lastGeneratedNFT) {
        nft = window.lastGeneratedNFT;
        console.log("Using stored NFT data for trait selection modal");
      }
      if (!projectData && window.lastProjectData) {
        projectData = window.lastProjectData;
        console.log("Using stored project data for trait selection modal");
      }
      // Always call the latest showTraitSelectionModal from generateNftsUI
      return window.NFTApp.getModule('generateNftsUI').showTraitSelectionModal(layerName, traitIndex, nft, projectData);
    };
  }
  
  // Apply thumbnail styling overrides as soon as the DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    applyThumbnailFixes();
    
    // Set up mutation observer to detect when new thumbnails are added
    setupTraitObserver();
  });
  
  // Apply fixes for any thumbnails that are already in the DOM
  function applyThumbnailFixes() {
    fixExistingThumbnails();
  }
  
  // Apply fixes to thumbnails that are already in the DOM
  function fixExistingThumbnails() {
    // Find all trait thumbnails
    const thumbs = document.querySelectorAll('.nft-trait-thumb');
    thumbs.forEach(thumb => {
      // Make sure images inside fill their container
      const img = thumb.querySelector('img');
      if (img) {
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'contain';
        img.style.padding = '0';
      }
      
      // Make sure SVG placeholders fill their container
      const svg = thumb.querySelector('svg');
      if (svg) {
        svg.style.width = '100%';
        svg.style.height = '100%';
      }
      
      // Make sure "None" placeholders fill their container
      const span = thumb.querySelector('span');
      if (span) {
        span.style.width = '100%';
        span.style.height = '100%';
        span.style.display = 'flex';
        span.style.alignItems = 'center';
        span.style.justifyContent = 'center';
        span.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        span.style.fontSize = '16px';
      }
      
      // DO NOT touch or restyle .trait-forbidden-overlay or .trait-forbidden-grey overlays
      // Adjust parent trait item container if needed
      const traitItem = thumb.closest('.nft-trait-info-item');
      if (traitItem) {
        traitItem.style.aspectRatio = 'auto';
        traitItem.style.height = 'auto';
        traitItem.style.minHeight = '210px';
        traitItem.style.padding = '8px';
      }
    });
  }
  
  // Set up an observer to watch for new thumbnails
  function setupTraitObserver() {
    // Create observer instance
    const observer = new MutationObserver(function(mutations) {
      let shouldFix = false;
      
      mutations.forEach(function(mutation) {
        // Check if new nodes were added
        if (mutation.addedNodes.length) {
          // Check if any of them are trait thumbnails or contain trait thumbnails
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              if (node.classList && node.classList.contains('nft-trait-thumb')) {
                shouldFix = true;
              } else if (node.querySelector && node.querySelector('.nft-trait-thumb')) {
                shouldFix = true;
              }
              
              // Also check if this is a trait selection modal that needs the 4-column grid
              if (node.id === 'trait-selection-modal' || 
                  (node.querySelector && node.querySelector('.trait-selection-list'))) {
                //                setTimeout(function() {
                //                  // Force the trait selection list to have 4 columns
                //                  const selectionList = document.querySelector('.trait-selection-list');
                //                  if (selectionList) {
                //                    selectionList.style.display = 'grid';
                //                    selectionList.style.gridTemplateColumns = 'repeat(4, 1fr)';
                //                    selectionList.style.gap = '16px';
                //                    selectionList.style.width = '100%';
                //                  }
                //                }, 50);
              }
            }
          });
        }
      });
      
      // If we found trait thumbnails, fix them
      if (shouldFix) {
        fixExistingThumbnails();
      }
    });
    
    // Start observing the document with the configured parameters
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();

// Create a mutation observer to detect DOM changes and reapply fix
document.addEventListener("DOMContentLoaded", function() {
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === "childList" && 
          document.querySelector('#generate-nfts.active')) {
        const leftSideColumn = document.querySelector('.nft-preview-panel');
        const traitsCard = document.querySelector('.traits-list-card');
        
        if (leftSideColumn && traitsCard) {
          const leftHeight = leftSideColumn.offsetHeight;
          if (leftHeight > 0) {
            traitsCard.style.height = leftHeight + 'px';
            traitsCard.style.minHeight = leftHeight + 'px';
            traitsCard.style.maxHeight = leftHeight + 'px';
          }
        }
        
        // Look for any trait selection modal that appeared and force it to use 4 columns
        //                const selectionList = document.querySelector('.trait-selection-list');
        //                if (selectionList) {
        //                  selectionList.style.display = 'grid';
        //                  selectionList.style.gridTemplateColumns = 'repeat(4, 1fr)';
        //                  selectionList.style.gap = '16px';
        //                  selectionList.style.width = '100%';
        //                  selectionList.style.boxSizing = 'border-box';
        //                }
      }
    });
  });
  
  // Start observing the entire document for changes
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}); 