// Navigation Module

// Declare NFTApp if it's not already defined (e.g., if it's a global object)
if (typeof NFTApp === "undefined") {
  NFTApp = {}
}

NFTApp.registerModule("navigation", {
  generateNftsTabVisited: false, // Track if Generate NFTs tab has been visited
  firstNftGenerated: false, // Track if the first NFT has been generated

  init: function () {
    console.log("Initializing navigation module")
    this.setupTabNavigation()
    this.setupNftGenerationListener()
    this.applyNavActionsTransform()
    // Keep Generate NFTs tab enabled - content inside will be greyed out until NFT renders
    this.enableGenerateNftsTab()
  },

  // Enable Generate NFTs tab - remove any disabled state
  enableGenerateNftsTab: function() {
    const generateTab = document.querySelector('.nav-tab[data-tab="generate-nfts"]');
    if (generateTab) {
      generateTab.classList.remove('disabled');
      generateTab.style.pointerEvents = 'auto';
      generateTab.style.opacity = '1';
      generateTab.style.cursor = 'pointer';
    }
  },

  // Disable Generate NFTs tab - grey it out
  disableGenerateNftsTab: function() {
    const generateTab = document.querySelector('.nav-tab[data-tab="generate-nfts"]');
    if (generateTab) {
      generateTab.classList.add('disabled');
      generateTab.style.pointerEvents = 'none';
      generateTab.style.opacity = '0.5';
      generateTab.style.cursor = 'not-allowed';
    }
  },

  // Set up a listener to track when NFTs are generated
  setupNftGenerationListener: function() {
    // Override the window.lastGeneratedNFT setter to track NFT generation
    let originalLastGeneratedNFT = window.lastGeneratedNFT;
    
    Object.defineProperty(window, 'lastGeneratedNFT', {
      get: function() {
        return originalLastGeneratedNFT;
      },
      set: function(value) {
        originalLastGeneratedNFT = value;
        // Mark that the first NFT has been generated
        if (value && value.seed && window.NFTApp && window.NFTApp.getModule('navigation')) {
          window.NFTApp.getModule('navigation').firstNftGenerated = true;
          // console.log("[DEBUG] First NFT generation detected, updating navigation flag");
        }
      },
      configurable: true
    });
  },

  // Set up tab navigation
  setupTabNavigation: function () {
    const navTabs = document.querySelectorAll(".nav-tab")

    navTabs.forEach((tab) => {
      tab.addEventListener("click", async () => {
        const tabId = tab.dataset.tab
        
        // If Generate NFTs tab is clicked, always show it immediately
        if (tabId === "generate-nfts") {
          // Remove disabled class to ensure tab is always accessible
          const generateTab = document.querySelector('.nav-tab[data-tab="generate-nfts"]');
          if (generateTab) {
            generateTab.classList.remove('disabled');
            generateTab.style.pointerEvents = 'auto';
            generateTab.style.opacity = '1';
          }
          
          // Always show the tab immediately - no locking feature
          this.showTab(tabId);
          
          // Check if this is the first time accessing the tab OR if no NFT has been generated yet
          const hasGeneratedNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
          
          // Mark tab as visited
          this.generateNftsTabVisited = true;
          
          // Get project data
          const projectData = window.NFTApp?.getModule('generateNftsUI')?.projectData || window.currentProject;
          const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
          
          // Always set up UI elements when tab is shown
          if (generateNftsUI) {
            // If no project is loaded or no traits exist
            if (!projectData || !projectData.traits || projectData.traits.length === 0) {
              // Show message in preview panel explaining no project is loaded
              generateNftsUI.showNoProjectMessageInPreviewPanel();
              // Show placeholder in traits panel
              generateNftsUI.showTraitsListPlaceholder(projectData);
            } else {
              // Project exists - check if NFT image is actually loaded and displayed
              const previewContainer = document.querySelector('.nft-preview-image-area #nft-preview-container');
              const previewItems = previewContainer ? previewContainer.querySelectorAll('.nft-preview-item') : [];
              const hasNFTDisplayed = previewItems.length > 0;
              
              // Also check if image is loaded
              const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
              const isNFTImageLoaded = previewImage && previewImage.complete && previewImage.naturalWidth > 0;
              
              // CRITICAL: Only show "No Project" message if no NFT is displayed AND no image is loaded
              // If NFT items exist, don't show the message even if image isn't fully loaded yet
              if (!hasNFTDisplayed && !isNFTImageLoaded) {
                // NFT is not rendered yet - show "No Project Loaded" card and placeholder (same as no project)
                generateNftsUI.showNoProjectMessageInPreviewPanel();
                generateNftsUI.showTraitsListPlaceholder(projectData);
              } else {
                // NFT exists or is loading - remove any no-project card
                const noProjectCard = document.querySelector('.no-project-card');
                if (noProjectCard) {
                  noProjectCard.remove();
                }
              }
              // If NFT image is loaded, it will be displayed by displaySingleNFT
            }
            
            // Update all button states when tab is shown (after a delay to ensure buttons exist)
            setTimeout(() => {
              if (generateNftsUI._updateAllButtonStates) {
                generateNftsUI._updateAllButtonStates();
              }
            }, 200);
          }
          
          // If we already have a generated NFT (from project load), mark as generated
          // Tab stays enabled - content inside will be greyed out until image loads
          if (hasGeneratedNFT) {
            this.firstNftGenerated = true;
            this.enableGenerateNftsTab(); // Tab itself is always enabled
            console.log("[DEBUG] Generate NFTs tab clicked - NFT already exists from project load");
            return; // Exit early since tab is already shown
          }
          
          // Only generate a new NFT if we don't have one and haven't generated one yet
          if (!this.firstNftGenerated && projectData && projectData.traits && projectData.traits.length > 0) {
            console.log("[DEBUG] Generate NFTs tab clicked - generating initial NFT in background");
            
            // Generate a random NFT in the background (don't await - let it run async)
            const generateNfts = window.NFTApp.getModule('generateNfts');
            if (generateNfts && generateNfts.generateSingleNFT) {
              generateNfts.generateSingleNFT(projectData, false).then((nft) => {
                // Update the preview panels
                const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
                if (generateNftsUI) {
                  window.lastGeneratedNFT = nft;
                  
                  // Update project data to include this NFT as the last generated NFT
                  if (projectData) {
                    projectData.lastGeneratedNFT = {
                      seed: nft.seed,
                      traits: nft.traits || {},
                      rarity: nft.rarity || 'Unknown',
                      rarityScore: nft.rarityScore || 0,
                      timestamp: Date.now()
                    };
                    console.log('[DEBUG] Updated project data with last generated NFT:', nft.seed);
                  }
                  
                  // Also update window.currentProject if it exists
                  if (window.currentProject) {
                    window.currentProject.lastGeneratedNFT = {
                      seed: nft.seed,
                      traits: nft.traits || {},
                      rarity: nft.rarity || 'Unknown',
                      rarityScore: nft.rarityScore || 0,
                      timestamp: Date.now()
                    };
                    console.log('[DEBUG] Updated window.currentProject with last generated NFT:', nft.seed);
                  }
                  
                  generateNftsUI.updateSinglePreviewPanel(projectData, nft);
                  generateNftsUI.updateTraitInfoPanel(nft, projectData);
                  generateNftsUI.hideLoadingOverlay();
                  
                  // Tab stays enabled - content inside will be greyed out until image loads
                  const navModule = window.NFTApp.getModule('navigation');
                  if (navModule) {
                    navModule.enableGenerateNftsTab(); // Tab itself is always enabled
                  }
                }
                
                // Mark that the first NFT has been generated
                const navModule = window.NFTApp.getModule('navigation');
                if (navModule) {
                  navModule.firstNftGenerated = true;
                }
                console.log("[DEBUG] Initial NFT generated successfully");
              }).catch((error) => {
                console.error("[DEBUG] Error generating initial NFT:", error);
                const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
                if (generateNftsUI && generateNftsUI.hideLoadingOverlay) {
                  generateNftsUI.hideLoadingOverlay();
                }
              });
            }
            return; // Exit early to prevent double showTab call
          }
          
          return; // Exit early to prevent double showTab call
        }
        
        this.showTab(tabId)
      })
    })
  },

  // Show a specific tab
  showTab: function(tabId, isUserInitiated = false) {
    console.log("Showing tab:", tabId)
    
    // First, hide ALL tab contents to ensure nothing shows
    const allTabContents = document.querySelectorAll(".tab-content")
    allTabContents.forEach((content) => {
      content.style.display = "none"
      content.classList.remove("active")
    })

    // Remove active class from all tabs
    const navTabs = document.querySelectorAll(".nav-tab")
    navTabs.forEach((tab) => {
      tab.classList.remove("active")
    })

    // Update project-interface class for Generate NFTs tab
    const projectInterface = document.querySelector('.project-interface');
    if (projectInterface) {
      if (tabId === 'generate-nfts') {
        projectInterface.classList.add('generate-nfts-active');
        // Remove inline height styles
        projectInterface.style.removeProperty('height');
        projectInterface.style.removeProperty('min-height');
        projectInterface.style.removeProperty('max-height');
      } else {
        projectInterface.classList.remove('generate-nfts-active');
      }
    }

    // Update content-area class for Generate NFTs tab to remove margin-top
    const contentArea = document.querySelector('.content-area');
    const exportNftsContentArea = document.querySelector('.export-nfts-content-area');
    if (contentArea) {
      if (tabId === 'generate-nfts') {
        contentArea.classList.add('generate-nfts-content-active');
        // Remove inline styles that might override - INCLUDING HEIGHT
        contentArea.style.removeProperty('margin-top');
        contentArea.style.removeProperty('padding-top');
        contentArea.style.removeProperty('height');
        contentArea.style.removeProperty('min-height');
        contentArea.style.removeProperty('max-height');
        // Force apply IMMEDIATELY - inline styles override ALL CSS
        contentArea.style.setProperty('margin-top', '0', 'important');
        contentArea.style.setProperty('padding-top', '0', 'important');
        contentArea.style.setProperty('height', 'auto', 'important'); // Use auto to fit content and eliminate empty space
        contentArea.style.setProperty('min-height', '0', 'important');
        contentArea.style.setProperty('max-height', 'none', 'important');
        
        // Force set margin-top: 0 and height: 853.55px as fallback if CSS doesn't work - MULTIPLE TIMES
        requestAnimationFrame(() => {
          contentArea.style.setProperty('margin-top', '0', 'important');
          contentArea.style.setProperty('padding-top', '0', 'important');
          contentArea.style.setProperty('height', 'auto', 'important'); // Use auto to fit content
          contentArea.style.setProperty('min-height', '0', 'important');
          contentArea.style.setProperty('max-height', 'none', 'important');
        });
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 0);
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 10);
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 25);
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 50);
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 100);
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 200);
        setTimeout(() => {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('padding-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 500);
      } else {
        contentArea.classList.remove('generate-nfts-content-active');
        // Restore default margin-top for other tabs
        contentArea.style.removeProperty('margin-top');
        contentArea.style.removeProperty('padding-top');
      }
    }

    // Show the selected tab content
    const selectedContent = document.getElementById(tabId)
    if (selectedContent) {
      selectedContent.classList.add("active")
      
      // Use the appropriate display style based on the tab
      if (tabId === "generate-nfts") {
        // Always show Generate NFTs tab - no longer locked
        selectedContent.style.display = "flex"
      } else if (tabId === "export-nfts") {
        // For export-nfts tab, show export-nfts-content-area and hide main content-area
        if (contentArea) {
          contentArea.style.setProperty('display', 'none', 'important');
        }
        if (exportNftsContentArea) {
          exportNftsContentArea.style.setProperty('display', 'block', 'important');
        }
        // For export-nfts tab, initialize the module
        // Ensure tab content is visible with !important
        selectedContent.style.setProperty('display', 'block', 'important');
        selectedContent.style.setProperty('visibility', 'visible', 'important');
        selectedContent.style.setProperty('opacity', '1', 'important');
        selectedContent.style.setProperty('position', 'relative', 'important');
        selectedContent.style.setProperty('height', 'auto', 'important');
        selectedContent.style.setProperty('width', 'auto', 'important');
        const exportNftsModule = window.NFTApp?.getModule('exportNfts');
        if (exportNftsModule && exportNftsModule.initializeTab) {
          exportNftsModule.initializeTab();
        }
      } else {
        // For other tabs, show main content-area and hide export-nfts-content-area
        if (contentArea) {
          contentArea.style.setProperty('display', 'block', 'important');
        }
        if (exportNftsContentArea) {
          exportNftsContentArea.style.setProperty('display', 'none', 'important');
        }
        selectedContent.style.display = "block"
      }
      
      // Ensure section title and description are visible
      const sectionTitle = selectedContent.querySelector(".section-title")
      const sectionDescription = selectedContent.querySelector(".section-description")
      
      if (sectionTitle) {
        sectionTitle.style.display = "flex" // Section titles use flex
      }
      
      if (sectionDescription) {
        sectionDescription.style.display = "block"
      }
    }

    // Add active class to the clicked tab
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`)
    if (activeTab) {
      activeTab.classList.add("active")
    }
    
    console.log("Tab visibility updated for:", tabId)
  },

  // Apply nav-actions transform via JavaScript to ensure it takes effect
  applyNavActionsTransform: function() {
    const applyTransform = () => {
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        // Force apply transform via inline style to override any CSS conflicts
        navActions.style.setProperty('transform', 'translateX(-161px)', 'important');
        navActions.style.setProperty('margin-left', '0', 'important');
        console.log('[DEBUG] Nav-actions transform applied via JavaScript');
      }
      
      // Also ensure Generate NFTs tab is always enabled
      this.enableGenerateNftsTab();
    };

    // Apply immediately
    applyTransform();

    // Apply after DOM is ready
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTransform);
    }

    // Apply after window load
    window.addEventListener('load', applyTransform);

    // Apply periodically to ensure it stays (in case something overrides it)
    setInterval(() => {
      applyTransform.call(this);
    }, 1000);
  }
})
