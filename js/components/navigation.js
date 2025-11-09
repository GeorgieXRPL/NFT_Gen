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
          console.log("[DEBUG] First NFT generation detected, updating navigation flag");
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
        
        // If Generate NFTs tab is clicked, check if we need to generate first NFT
        if (tabId === "generate-nfts") {
          // Check if NFT restoration is in progress
          if (window.nftRestorationInProgress) {
            console.log("[DEBUG] Generate NFTs tab clicked - waiting for NFT restoration to complete");
            // Wait for restoration to complete, then show the tab
            const checkRestoration = () => {
              if (!window.nftRestorationInProgress) {
                this.showTab(tabId);
              } else {
                setTimeout(checkRestoration, 100);
              }
            };
            checkRestoration();
            return;
          }
          
          // Check if this is the first time accessing the tab OR if no NFT has been generated yet
          const hasGeneratedNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
          
          // Mark tab as visited
          this.generateNftsTabVisited = true;
          
          // If we already have a generated NFT (from project load), mark as generated
          if (hasGeneratedNFT) {
            this.firstNftGenerated = true;
            console.log("[DEBUG] Generate NFTs tab clicked - NFT already exists from project load");
          }
          
          // Only generate a new NFT if we don't have one and haven't generated one yet
          if (!hasGeneratedNFT && !this.firstNftGenerated) {
            console.log("[DEBUG] Generate NFTs tab clicked - generating initial NFT before showing contents");
            
            // Check if project data exists
            const projectData = window.NFTApp?.getModule('generateNftsUI')?.projectData || window.currentProject;
            if (projectData && projectData.traits && projectData.traits.length > 0) {
              // Generate one NFT before showing the tab contents
              try {
                const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
                if (generateNftsUI && generateNftsUI.showLoadingOverlay) {
                  generateNftsUI.showLoadingOverlay("Preparing NFT preview...", true);
                }
                
                // Generate a random NFT
                const generateNfts = window.NFTApp.getModule('generateNfts');
                if (generateNfts && generateNfts.generateSingleNFT) {
                  const nft = await generateNfts.generateSingleNFT(projectData, false);
                  
                  // Update the preview panels
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
                  }
                  
                  // Mark that the first NFT has been generated
                  this.firstNftGenerated = true;
                  console.log("[DEBUG] Initial NFT generated successfully");
                  
                  // Show the tab AFTER the NFT is generated and preview is loaded
                  this.showTab(tabId);
                  return; // Exit early to prevent double showTab call
                }
              } catch (error) {
                console.error("[DEBUG] Error generating initial NFT:", error);
                const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
                if (generateNftsUI && generateNftsUI.hideLoadingOverlay) {
                  generateNftsUI.hideLoadingOverlay();
                }
                
                // Show the tab even if NFT generation failed
                this.showTab(tabId);
                return; // Exit early to prevent double showTab call
              }
            } else {
              // No project data or traits available, show tab anyway
              console.log("[DEBUG] No project data available, showing tab without NFT generation");
              this.showTab(tabId);
              return;
            }
          } else {
            // NFT already exists, just show the tab
            console.log("[DEBUG] Generate NFTs tab clicked - showing existing NFT");
            this.showTab(tabId);
            return; // Exit early to prevent double showTab call
          }
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

    // Show the selected tab content
    const selectedContent = document.getElementById(tabId)
    if (selectedContent) {
      selectedContent.classList.add("active")
      
      // Use the appropriate display style based on the tab
      if (tabId === "generate-nfts") {
        // For Generate NFTs tab, only show content if first NFT has been generated
        if (this.firstNftGenerated || (window.lastGeneratedNFT && window.lastGeneratedNFT.seed)) {
          selectedContent.style.display = "flex"
        } else {
          // Hide the content if no NFT has been generated yet
          selectedContent.style.display = "none"
          console.log("[DEBUG] Generate NFTs tab content hidden - no NFT generated yet")
        }
      } else if (tabId === "generate-metadata") {
        // For generate-metadata tab, delay display until all elements are rendered
        selectedContent.style.display = "none"; // Keep hidden initially
        this.initializeGenerateMetadataTab(selectedContent);
      } else {
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

  // Initialize generate-metadata tab with proper default state
  initializeGenerateMetadataTab: function(selectedContent) {
    console.log("Initializing generate-metadata tab with default 1 batch state");
    
    // Show the tab content immediately
    selectedContent.style.display = "block";
    
    // Wait for DOM to be ready
    setTimeout(() => {
      // Initialize num-batches-input to 1 by default
      const numBatchesInput = document.getElementById('num-batches-input');
      if (numBatchesInput) {
        numBatchesInput.value = 1;
        console.log("Set num-batches-input to 1");
        
        // Trigger the apply button click to initialize batch cards
        const applyBtn = document.getElementById('apply-batch-count-btn');
        if (applyBtn) {
          applyBtn.click();
          console.log("Triggered apply button click");
          
          // Wait a bit for the batch elements to be rendered
          setTimeout(() => {
            // Ensure all elements are visible
            this.ensureAllElementsVisible(selectedContent);
            console.log("Generate-metadata tab fully initialized with 1 batch default");
          }, 100);
        }
      }
    }, 50);
  },
  
  // Ensure all elements in the generate-metadata tab are visible
  ensureAllElementsVisible: function(selectedContent) {
    // Show section title and description
    const sectionTitle = selectedContent.querySelector(".section-title");
    const sectionDescription = selectedContent.querySelector(".section-description");
    
    if (sectionTitle) {
      sectionTitle.style.display = "flex";
    }
    
    if (sectionDescription) {
      sectionDescription.style.display = "block";
    }
    
    // Ensure batch management section is visible
    const batchManagementSection = document.getElementById('batch-management-section');
    if (batchManagementSection) {
      batchManagementSection.style.display = "block";
    }
    
    // Ensure NFT's per Batch title is visible
    const nftsPerBatchTitle = document.getElementById('nfts-per-batch-title');
    if (nftsPerBatchTitle) {
      nftsPerBatchTitle.style.display = "block";
    }
    
    // Ensure batches list is visible
    const batchesList = document.getElementById('batches-list');
    if (batchesList) {
      batchesList.style.display = "block";
    }
    
    // Ensure export options are visible
    const metadataExportOptions = document.getElementById('metadata-export-options');
    if (metadataExportOptions) {
      metadataExportOptions.style.display = "block";
    }
    
    const nftsMetadataExport = document.getElementById('nfts-metadata-export');
    if (nftsMetadataExport) {
      nftsMetadataExport.style.display = "block";
    }
    
    // Ensure all blockchain toggles are visible
    const blockchainToggles = selectedContent.querySelectorAll('#solana-toggle, #ethereum-toggle, #bitcoin-toggle, #cosmos-toggle, #tezos-toggle, #xrpl-toggle');
    blockchainToggles.forEach(toggle => {
      toggle.style.display = "flex";
    });
    
    // Ensure blockchain toggles container is visible
    const blockchainTogglesContainer = selectedContent.querySelector('.blockchain-toggles-container');
    if (blockchainTogglesContainer) {
      blockchainTogglesContainer.style.display = "grid";
    }
    
    // Ensure rarity toggle is visible
    const rarityToggle = document.getElementById('metadata.rarity.rank');
    if (rarityToggle) {
      rarityToggle.style.display = "flex";
    }
    
    // Ensure export button is visible
    const exportBtn = selectedContent.querySelector('.btn.btn-success');
    if (exportBtn) {
      exportBtn.style.display = "inline-block";
    }
  }
})
