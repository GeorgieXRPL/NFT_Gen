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

    // CRITICAL: Set up tooltips for all navigation tabs
    navTabs.forEach((tab) => {
      // Ensure all navigation tabs have the tooltip class
      if (!tab.classList.contains('tooltip')) {
        tab.classList.add('tooltip');
      }
      
      let tooltip = tab.querySelector('.tooltiptext');
      
      // CRITICAL: Create tooltip if it doesn't exist (especially for Export NFTs / Metadata)
      if (!tooltip) {
        tooltip = document.createElement('span');
        tooltip.className = 'tooltiptext';
        
        // Set tooltip text based on tab type
        const tabId = tab.dataset.tab;
        if (tabId === 'general-info') {
          tooltip.innerHTML = 'Configure your collection<br>basic information';
        } else if (tabId === 'traits-rules') {
          tooltip.innerHTML = 'Manage Traits and<br>Combination Rules';
        } else if (tabId === 'generate-nfts') {
          tooltip.innerHTML = 'Create NFT images and<br>manage your collection';
        } else if (tabId === 'export-nfts') {
          tooltip.textContent = 'Export your collection';
        }
        
        tab.appendChild(tooltip);
      }
      
      // Setup tooltip positioning
      if (tooltip) {
        this.setupNavTabTooltip(tab, tooltip);
      }
    });

    navTabs.forEach((tab) => {
      tab.addEventListener("click", async () => {
        const tabId = tab.dataset.tab
        
        // If Generate NFTs tab is clicked, always show it immediately
        if (tabId === "generate-nfts") {
          // CRITICAL: Show tab FIRST synchronously to prevent flickering
          // This ensures instant tab switching without any visual glitches
          this.showTab(tabId);
          
          // CRITICAL: Force immediate reflow to prevent flickering
          void document.getElementById('generate-nfts')?.offsetHeight;
          
          // Defer all heavy operations to run after tab is visible
          requestAnimationFrame(() => {
            // Remove disabled class to ensure tab is always accessible
            const generateTab = document.querySelector('.nav-tab[data-tab="generate-nfts"]');
            if (generateTab) {
              generateTab.classList.remove('disabled');
              generateTab.style.pointerEvents = 'auto';
              generateTab.style.opacity = '1';
            }
            
            // Check if this is the first time accessing the tab OR if no NFT has been generated yet
            const hasGeneratedNFT = window.lastGeneratedNFT && window.lastGeneratedNFT.seed;
            
            // Mark tab as visited
            this.generateNftsTabVisited = true;
            
            // Get project data
            const projectData = window.NFTApp?.getModule('generateNftsUI')?.projectData || window.currentProject;
            const generateNftsUI = window.NFTApp.getModule('generateNftsUI');
            
            // Always set up UI elements when tab is shown (deferred)
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
              
              // Update all button states when tab is shown (deferred to avoid blocking and flickering)
              if (generateNftsUI._updateAllButtonStates) {
                // Use double requestAnimationFrame to defer this heavy operation until after tab is fully visible
                // This prevents button state updates from causing flickering during tab switch
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => {
                    generateNftsUI._updateAllButtonStates();
                  });
                });
              }
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
            }
          });
          
          return; // Exit early to prevent double showTab call
        }
        
        this.showTab(tabId)
      })
    })
  },

  // Show a specific tab
  showTab: function(tabId, isUserInitiated = false) {
    // DEBUG: Track tab switching to diagnose flickering
    const debugStartTime = performance.now();
    console.log(`[FLICKER DEBUG] ========== START showTab(${tabId}) ==========`);
    console.log(`[FLICKER DEBUG] Timestamp: ${debugStartTime.toFixed(2)}ms`);
    
    // Get container references
    const contentArea = document.querySelector('.content-area');
    const exportNftsContentArea = document.querySelector('.export-nfts-content-area');
    const projectInterface = document.querySelector('.project-interface');
    const body = document.body;
    const html = document.documentElement;
    
    // CRITICAL: Track which tabs were previously active BEFORE hiding them
    // This is especially important for Collection Info and Traits & Rules tabs
    const generalInfoTab = document.getElementById('general-info');
    const traitsRulesTab = document.getElementById('traits-rules');
    const wasGeneralInfoActive = generalInfoTab && generalInfoTab.classList.contains('active');
    const wasTraitsRulesActive = traitsRulesTab && traitsRulesTab.classList.contains('active');
    
    console.log(`[FLICKER DEBUG] Previous active tabs: general-info=${wasGeneralInfoActive}, traits-rules=${wasTraitsRulesActive}`);
    
    // CRITICAL: If switching to Generate NFTs from Collection Info or Traits & Rules,
    // hide those tabs FIRST and update content-area styles BEFORE showing Generate NFTs
    if (tabId === 'generate-nfts' && (wasGeneralInfoActive || wasTraitsRulesActive)) {
      console.log(`[FLICKER DEBUG] Switching to generate-nfts from Collection Info or Traits & Rules - applying special handling`);
      
      // DEBUG: Check content-area state before changes
      if (contentArea) {
        console.log(`[FLICKER DEBUG] content-area BEFORE changes:`, {
          height: contentArea.style.height || 'not set',
          marginTop: contentArea.style.marginTop || 'not set',
          classes: Array.from(contentArea.classList),
          computedHeight: window.getComputedStyle(contentArea).height,
          computedMarginTop: window.getComputedStyle(contentArea).marginTop
        });
      }
      
      // CRITICAL STEP 0: Preserve content-area height BEFORE removing active classes
      // This must happen FIRST, before any DOM changes that might cause collapse
      // Store in a variable accessible to the later check
      let preservedHeight = null;
      if (contentArea) {
        const offsetHeight = contentArea.offsetHeight;
        const computedHeight = window.getComputedStyle(contentArea).height;
        preservedHeight = offsetHeight > 0 ? `${offsetHeight}px` : (computedHeight !== '0px' && computedHeight !== 'auto' ? computedHeight : '400px');
        console.log(`[FLICKER DEBUG] Preserving content-area height BEFORE changes: offsetHeight=${offsetHeight}, computedHeight=${computedHeight}, preserved=${preservedHeight}`);
        
        // CRITICAL: Set the preserved height IMMEDIATELY to prevent any collapse
        contentArea.style.setProperty('height', preservedHeight, 'important');
        contentArea.style.setProperty('min-height', preservedHeight, 'important');
        // Force immediate reflow to lock in the height
        void contentArea.offsetHeight;
        console.log(`[FLICKER DEBUG] Locked content-area height to: ${preservedHeight}`);
        
        // CRITICAL: Store preserved height in a data attribute so we can check it later
        // This ensures we can detect it even if inline styles get modified
        contentArea.setAttribute('data-preserved-height', preservedHeight);
      }
      
      // STEP 1: Remove active class FIRST to stop CSS :has() selectors from matching
      if (wasGeneralInfoActive && generalInfoTab) {
        generalInfoTab.classList.remove("active");
      }
      if (wasTraitsRulesActive && traitsRulesTab) {
        traitsRulesTab.classList.remove("active");
      }
      
      // STEP 2: Force immediate reflow to ensure CSS :has() selectors are re-evaluated
      // This prevents content-area from still matching :has(#general-info.tab-content.active)
      const reflow1Time = performance.now();
      void document.body.offsetHeight;
      console.log(`[FLICKER DEBUG] Reflow 1 (after removing active classes): ${(performance.now() - reflow1Time).toFixed(2)}ms`);
      
      // STEP 3: Force hide Collection Info tab completely if it was active
      if (wasGeneralInfoActive && generalInfoTab) {
        generalInfoTab.style.setProperty('display', 'none', 'important');
        generalInfoTab.style.setProperty('visibility', 'hidden', 'important');
        generalInfoTab.style.setProperty('opacity', '0', 'important');
        generalInfoTab.style.setProperty('height', '0', 'important');
        generalInfoTab.style.setProperty('overflow', 'hidden', 'important');
        generalInfoTab.style.setProperty('position', 'absolute', 'important');
        generalInfoTab.style.setProperty('width', '0', 'important');
        generalInfoTab.style.removeProperty('transition');
        const reflow2Time = performance.now();
        void generalInfoTab.offsetHeight; // Force reflow
        console.log(`[FLICKER DEBUG] Reflow 2 (after hiding general-info): ${(performance.now() - reflow2Time).toFixed(2)}ms`);
      }
      
      // STEP 4: Force hide Traits & Rules tab completely if it was active
      if (wasTraitsRulesActive && traitsRulesTab) {
        traitsRulesTab.style.setProperty('display', 'none', 'important');
        traitsRulesTab.style.setProperty('visibility', 'hidden', 'important');
        traitsRulesTab.style.setProperty('opacity', '0', 'important');
        traitsRulesTab.style.setProperty('height', '0', 'important');
        traitsRulesTab.style.setProperty('overflow', 'hidden', 'important');
        traitsRulesTab.style.setProperty('position', 'absolute', 'important');
        traitsRulesTab.style.setProperty('width', '0', 'important');
        traitsRulesTab.style.removeProperty('transition');
        const reflow3Time = performance.now();
        void traitsRulesTab.offsetHeight; // Force reflow
        console.log(`[FLICKER DEBUG] Reflow 3 (after hiding traits-rules): ${(performance.now() - reflow3Time).toFixed(2)}ms`);
      }
      
      // STEP 5: Force another reflow to ensure tabs are fully hidden
      const reflow4Time = performance.now();
      void document.body.offsetHeight;
      console.log(`[FLICKER DEBUG] Reflow 4 (after hiding both tabs): ${(performance.now() - reflow4Time).toFixed(2)}ms`);
      
      // STEP 6: Update content-area styles IMMEDIATELY to prevent CSS :has() selector conflicts
      // This must happen AFTER removing active classes and hiding tabs
      // CRITICAL: Height is already preserved and locked above, so we just need to update other properties
      if (contentArea) {
        // CRITICAL: Remove any conflicting classes first
        contentArea.classList.remove('general-info-content-active');
        contentArea.classList.remove('traits-rules-content-active');
        
        // CRITICAL: Add generate-nfts class to override :has() selectors
        contentArea.classList.add('generate-nfts-content-active');
        
        // CRITICAL: Update other properties but KEEP the preserved height
        // The height and min-height are already set above, so we just update the rest
        contentArea.style.setProperty('margin-top', '0', 'important');
        contentArea.style.setProperty('padding-top', '0', 'important');
        contentArea.style.setProperty('max-height', 'none', 'important');
        contentArea.style.setProperty('width', '1557px', 'important');
        contentArea.style.setProperty('max-width', '1557px', 'important');
        contentArea.style.setProperty('min-width', '1557px', 'important');
        
        // CRITICAL: Ensure height is still preserved (in case something tried to override it)
        if (preservedHeight) {
          contentArea.style.setProperty('height', preservedHeight, 'important');
          contentArea.style.setProperty('min-height', preservedHeight, 'important');
        }
        
        // CRITICAL: Force immediate reflow to ensure all styles are applied
        void contentArea.offsetHeight;
        
        console.log(`[FLICKER DEBUG] Updated content-area styles, height preserved: ${preservedHeight}`);
        
        // DEBUG: Check content-area state after setting styles
        const afterStylesTime = performance.now();
        const afterStylesComputed = window.getComputedStyle(contentArea);
        console.log(`[FLICKER DEBUG] content-area AFTER setting styles:`, {
          height: contentArea.style.height || 'not set',
          minHeight: contentArea.style.minHeight || 'not set',
          marginTop: contentArea.style.marginTop || 'not set',
          classes: Array.from(contentArea.classList),
          computedHeight: afterStylesComputed.height,
          computedMinHeight: afterStylesComputed.minHeight,
          computedMarginTop: afterStylesComputed.marginTop,
          offsetHeight: contentArea.offsetHeight
        });
        
        // CRITICAL: Force reflow to ensure CSS :has() selectors are re-evaluated
        const reflow5Time = performance.now();
        void contentArea.offsetHeight;
        console.log(`[FLICKER DEBUG] Reflow 5 (after updating content-area styles, first): ${(performance.now() - reflow5Time).toFixed(2)}ms`);
        
        // CRITICAL: Force another reflow to ensure all styles are applied
        const reflow6Time = performance.now();
        void contentArea.offsetHeight;
        console.log(`[FLICKER DEBUG] Reflow 6 (after updating content-area styles, second): ${(performance.now() - reflow6Time).toFixed(2)}ms`);
        
        // DEBUG: Check content-area state after reflows
        const afterReflowsComputed = window.getComputedStyle(contentArea);
        console.log(`[FLICKER DEBUG] content-area AFTER reflows:`, {
          computedHeight: afterReflowsComputed.height,
          computedMinHeight: afterReflowsComputed.minHeight,
          computedMarginTop: afterReflowsComputed.marginTop,
          offsetHeight: contentArea.offsetHeight
        });
      }
      
      // STEP 7: Final reflow to ensure all changes are applied and CSS is stable
      const reflow7Time = performance.now();
      void document.body.offsetHeight;
      console.log(`[FLICKER DEBUG] Reflow 7 (final reflow): ${(performance.now() - reflow7Time).toFixed(2)}ms`);
      
      // STEP 8: One more reflow after a microtask to ensure CSS :has() selectors have fully updated
      Promise.resolve().then(() => {
        const reflow8Time = performance.now();
        void document.body.offsetHeight;
        console.log(`[FLICKER DEBUG] Reflow 8 (after microtask): ${(performance.now() - reflow8Time).toFixed(2)}ms`);
      });
    }
    
    // Hide all tabs immediately (no animation) - set all properties atomically to prevent flickering
    const hideTabsStartTime = performance.now();
    console.log(`[FLICKER DEBUG] Starting to hide all tabs`);
    const allTabContents = document.querySelectorAll(".tab-content")
    allTabContents.forEach((content) => {
      // CRITICAL: For Collection Info and Traits & Rules tabs, hide them with maximum specificity
      // This prevents their specific CSS rules (height, overflow) from causing flickering
      if (content.id === 'general-info' || content.id === 'traits-rules') {
        // Only hide if not already hidden (to avoid double work when switching to Generate NFTs)
        // When switching to Generate NFTs, these tabs are already hidden above
        if (tabId === 'generate-nfts' && (wasGeneralInfoActive || wasTraitsRulesActive)) {
          // Already handled above, just ensure active class is removed
          content.classList.remove("active");
        } else {
          // Normal hiding for other tab switches
          content.style.setProperty('display', 'none', 'important');
          content.style.setProperty('visibility', 'hidden', 'important');
          content.style.setProperty('opacity', '0', 'important');
          content.style.setProperty('height', '0', 'important');
          content.style.setProperty('overflow', 'hidden', 'important');
          content.style.setProperty('position', 'absolute', 'important');
          content.style.setProperty('width', '0', 'important');
          content.classList.remove("active");
          content.style.removeProperty('transition');
        }
      } else {
        // Set all hiding properties atomically to prevent flickering for other tabs
        content.style.setProperty('display', 'none', 'important');
        content.style.setProperty('visibility', 'hidden', 'important');
        content.style.setProperty('opacity', '0', 'important');
        content.classList.remove("active");
        // Remove any transition styles that might interfere
        content.style.removeProperty('transition');
      }
    })
    console.log(`[FLICKER DEBUG] Finished hiding all tabs: ${(performance.now() - hideTabsStartTime).toFixed(2)}ms`);

    // Remove active class from all tabs
    const navTabs = document.querySelectorAll(".nav-tab")
    navTabs.forEach((tab) => {
      tab.classList.remove("active")
    })

    // Update project-interface class for Generate NFTs tab
    // projectInterface already declared above
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
    // contentArea and exportNftsContentArea already declared above
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
      } else {
        contentArea.classList.remove('generate-nfts-content-active');
        // Restore default margin-top for other tabs
        contentArea.style.removeProperty('margin-top');
        contentArea.style.removeProperty('padding-top');
      }
    }

    // Show the selected tab content immediately (no animation)
    const showTabStartTime = performance.now();
    console.log(`[FLICKER DEBUG] Starting to show tab: ${tabId}`);
    const selectedContent = document.getElementById(tabId)
    if (selectedContent) {
      // CRITICAL: Remove any transition/opacity/visibility styles that cause flickering
      selectedContent.style.removeProperty('transition')
      selectedContent.style.removeProperty('opacity')
      selectedContent.style.removeProperty('visibility')
      
      // CRITICAL: Add active class FIRST to ensure CSS rules apply correctly
      const addActiveClassTime = performance.now();
      selectedContent.classList.add("active")
      console.log(`[FLICKER DEBUG] Added active class to ${tabId}: ${(performance.now() - addActiveClassTime).toFixed(2)}ms`);
      
      // Use the appropriate display style based on the tab
      if (tabId === "generate-nfts") {
        // Always show Generate NFTs tab - no longer locked
        // Set all properties atomically to prevent flickering
        // CRITICAL: Collection Info and Traits & Rules tabs are already hidden above if they were active
        selectedContent.style.setProperty('display', 'flex', 'important');
        selectedContent.style.setProperty('visibility', 'visible', 'important');
        selectedContent.style.setProperty('opacity', '1', 'important');
        selectedContent.style.setProperty('position', 'relative', 'important');
        selectedContent.style.setProperty('height', 'auto', 'important');
        selectedContent.style.setProperty('width', '100%', 'important');
        selectedContent.style.setProperty('overflow', 'hidden', 'important');
        
        // DEBUG: Check generate-nfts tab state after setting display properties
        console.log(`[FLICKER DEBUG] generate-nfts tab AFTER setting display properties:`, {
          display: selectedContent.style.display || 'not set',
          visibility: selectedContent.style.visibility || 'not set',
          opacity: selectedContent.style.opacity || 'not set',
          classes: Array.from(selectedContent.classList),
          computedDisplay: window.getComputedStyle(selectedContent).display,
          computedVisibility: window.getComputedStyle(selectedContent).visibility
        });
        
        // CRITICAL: Force immediate reflow after setting all properties to prevent flickering
        const reflow9Time = performance.now();
        void selectedContent.offsetHeight;
        console.log(`[FLICKER DEBUG] Reflow 9 (after setting generate-nfts display properties): ${(performance.now() - reflow9Time).toFixed(2)}ms`);
        
        // CRITICAL: Now that generate-nfts tab is visible, set content-area height to auto
        // This allows it to expand to fit the content without flickering
        // BUT: Only do this if we didn't preserve a height during the tab switch
        // The removeInlineStyles() function will handle setting it to auto after the tab is fully stable
        if (contentArea && tabId === 'generate-nfts') {
          // CRITICAL: Check if we preserved a height by looking at the data attribute
          // This is the most reliable way since it won't be affected by style changes
          const preservedHeightAttr = contentArea.getAttribute('data-preserved-height');
          const currentHeight = contentArea.style.getPropertyValue('height') || contentArea.style.height;
          const currentMinHeight = contentArea.style.getPropertyValue('min-height') || contentArea.style.minHeight;
          const hasPreservedHeight = preservedHeightAttr || 
                                    (currentHeight && currentHeight !== 'auto' && currentHeight.includes('px')) ||
                                    (currentMinHeight && currentMinHeight !== '0' && currentMinHeight !== '0px' && currentMinHeight.includes('px'));
          
          console.log(`[FLICKER DEBUG] Checking for preserved height: attr=${preservedHeightAttr}, height=${currentHeight}, minHeight=${currentMinHeight}, hasPreserved=${hasPreservedHeight}`);
          
          if (!hasPreservedHeight) {
            // No preserved height, safe to set to auto immediately
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                contentArea.style.setProperty('height', 'auto', 'important');
                contentArea.style.setProperty('min-height', '0', 'important');
                console.log(`[FLICKER DEBUG] Set content-area height to auto after generate-nfts tab is visible (no preserved height)`);
              });
            });
          } else {
            // Height was preserved, let removeInlineStyles() handle it after tab is fully stable
            console.log(`[FLICKER DEBUG] Skipping height=auto (preserved height detected: attr=${preservedHeightAttr}, height=${currentHeight}, minHeight=${currentMinHeight}, will be handled by removeInlineStyles)`);
          }
        }
        
        // CRITICAL: Ensure content-area styles are applied (in case they weren't set above)
        if (contentArea && !contentArea.classList.contains('generate-nfts-content-active')) {
          console.log(`[FLICKER DEBUG] content-area doesn't have generate-nfts-content-active class, adding it now`);
          contentArea.classList.add('generate-nfts-content-active');
          contentArea.style.setProperty('margin-top', '0', 'important');
          contentArea.style.setProperty('padding-top', '0', 'important');
          // Don't set height here - it's already set above or will be set after tab is visible
          contentArea.style.setProperty('max-height', 'none', 'important');
          const reflow10Time = performance.now();
          void contentArea.offsetHeight; // Force reflow
          console.log(`[FLICKER DEBUG] Reflow 10 (after ensuring content-area styles): ${(performance.now() - reflow10Time).toFixed(2)}ms`);
        }
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
        // Set all properties atomically to prevent flickering
        selectedContent.style.setProperty('display', 'block', 'important');
        selectedContent.style.setProperty('visibility', 'visible', 'important');
        selectedContent.style.setProperty('opacity', '1', 'important');
        selectedContent.style.setProperty('position', 'relative', 'important');
        selectedContent.style.setProperty('height', 'auto', 'important');
        selectedContent.style.setProperty('width', 'auto', 'important');
      }
      
      // Active class already added above for generate-nfts, but ensure it's set for other tabs too
      if (tabId !== "generate-nfts") {
        selectedContent.classList.add("active")
      }
      
      // CRITICAL: Always hide scrollbars for ALL tabs - no scrollbars anywhere in the app
      selectedContent.style.setProperty('overflow', 'hidden', 'important');
      selectedContent.style.setProperty('overflow-y', 'hidden', 'important');
      selectedContent.style.setProperty('overflow-x', 'hidden', 'important');
      selectedContent.style.setProperty('scrollbar-width', 'none', 'important');
      selectedContent.style.setProperty('-ms-overflow-style', 'none', 'important');
      
      // CRITICAL: Always hide scrollbars on all containers - no scrollbars anywhere in the app
      if (contentArea) {
        contentArea.style.setProperty('overflow', 'hidden', 'important');
        contentArea.style.setProperty('overflow-y', 'hidden', 'important');
        contentArea.style.setProperty('overflow-x', 'hidden', 'important');
        contentArea.style.setProperty('scrollbar-width', 'none', 'important');
        contentArea.style.setProperty('-ms-overflow-style', 'none', 'important');
      }
      if (exportNftsContentArea) {
        exportNftsContentArea.style.setProperty('overflow', 'hidden', 'important');
        exportNftsContentArea.style.setProperty('overflow-y', 'hidden', 'important');
        exportNftsContentArea.style.setProperty('overflow-x', 'hidden', 'important');
        exportNftsContentArea.style.setProperty('scrollbar-width', 'none', 'important');
        exportNftsContentArea.style.setProperty('-ms-overflow-style', 'none', 'important');
      }
      if (projectInterface) {
        projectInterface.style.setProperty('overflow', 'hidden', 'important');
        projectInterface.style.setProperty('overflow-y', 'hidden', 'important');
        projectInterface.style.setProperty('overflow-x', 'hidden', 'important');
        projectInterface.style.setProperty('scrollbar-width', 'none', 'important');
        projectInterface.style.setProperty('-ms-overflow-style', 'none', 'important');
      }
      // CRITICAL: Always hide scrollbars on body/html - no scrollbars anywhere in the app
      if (body) {
        body.style.setProperty('overflow', 'hidden', 'important');
        body.style.setProperty('overflow-y', 'hidden', 'important');
        body.style.setProperty('overflow-x', 'hidden', 'important');
        body.style.setProperty('scrollbar-width', 'none', 'important');
        body.style.setProperty('-ms-overflow-style', 'none', 'important');
      }
      if (html) {
        html.style.setProperty('overflow', 'hidden', 'important');
        html.style.setProperty('overflow-y', 'hidden', 'important');
        html.style.setProperty('overflow-x', 'hidden', 'important');
        html.style.setProperty('scrollbar-width', 'none', 'important');
        html.style.setProperty('-ms-overflow-style', 'none', 'important');
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
    const navTabActiveTime = performance.now();
    const activeTab = document.querySelector(`.nav-tab[data-tab="${tabId}"]`)
    if (activeTab) {
      activeTab.classList.add("active")
      console.log(`[FLICKER DEBUG] Added active class to nav-tab: ${(performance.now() - navTabActiveTime).toFixed(2)}ms`);
    }
    
    const totalTime = performance.now() - debugStartTime;
    console.log(`[FLICKER DEBUG] ========== END showTab(${tabId}) - Total time: ${totalTime.toFixed(2)}ms ==========`);
  },

  // Set up tooltip positioning for navigation tabs
  setupNavTabTooltip: function(element, tooltip) {
    if (!element || !tooltip) return;
    
    // CRITICAL: Skip if already set up to prevent duplicate event listeners
    if (element.dataset.tooltipSetup === "true") {
      return;
    }
    element.dataset.tooltipSetup = "true";
    
    // CRITICAL: Remove help cursor - user requested to remove "?" cursor from navigation tabs
    // element.style.setProperty("cursor", "help", "important");
    
    // CRITICAL: Ensure tooltip has 1 second transition for fade in/out (matches app-wide tooltip behavior)
    tooltip.style.setProperty("transition", "opacity 1s ease", "important");
    
    // CRITICAL: Ensure tooltip starts hidden
    tooltip.style.setProperty("visibility", "hidden", "important");
    tooltip.style.setProperty("opacity", "0", "important");
    
    // Use global tooltip manager if available
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    if (tooltipManager && tooltipManager.setupTooltip) {
      tooltipManager.setupTooltip(element, tooltip);
      return;
    }

    // Fallback to local implementation if manager not available
    let tooltipTimeout = null;
    
    element.addEventListener("mouseenter", () => {
      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // Show tooltip after 4 seconds delay (navigation tabs have longer delay to prevent accidental display)
      tooltipTimeout = setTimeout(() => {
        // CRITICAL: Set position fixed and z-index FIRST, before making tooltip visible
        tooltip.style.setProperty("position", "fixed", "important");
        tooltip.style.setProperty("z-index", "2147483647", "important");
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");
        // CRITICAL: Keep tooltip hidden while measuring, positioned off-screen
        tooltip.style.setProperty("visibility", "hidden", "important");
        tooltip.style.setProperty("opacity", "0", "important");
        tooltip.style.setProperty("top", "-9999px", "important");
        tooltip.style.setProperty("left", "-9999px", "important");
        // Force reflow to ensure styles are applied
        void tooltip.offsetHeight;
        // Now measure tooltip dimensions
        const tooltipWidth = tooltip.offsetWidth || 200;
        const tooltipHeight = tooltip.offsetHeight;
        // CRITICAL: Calculate position BEFORE making tooltip visible
        const elementRect = element.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        // CRITICAL: Move all navigation tooltips 20px down from original position
        const topPosition = elementRect.top - tooltipHeight - 5 + 20;
        // CRITICAL: Ensure Export NFTs / Metadata tooltip has highest z-index
        const isExportTab = element.dataset.tab === 'export-nfts' || element.classList.contains('export-nfts');
        if (isExportTab) {
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("display", "block", "important");
        }
        // Set final position while still hidden
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // CRITICAL: Ensure transition is set before fade in
        tooltip.style.setProperty("transition", "opacity 1s ease", "important");
        // Now make tooltip visible and fade in with transition
        requestAnimationFrame(() => {
          tooltip.style.setProperty("visibility", "visible", "important");
          tooltip.style.setProperty("opacity", "1", "important");
        });
        tooltipTimeout = null;
      }, 4000); // 4 seconds delay for navigation tabs to prevent accidental display
    });

    element.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // CRITICAL: Ensure transition is set before fade out
      tooltip.style.setProperty("transition", "opacity 1s ease", "important");
      // Fade out tooltip with transition
      tooltip.style.setProperty("opacity", "0", "important");
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        tooltip.style.setProperty("visibility", "hidden", "important");
      }, 1000);
    });
  },

  // Apply nav-actions transform via JavaScript to ensure it takes effect
  applyNavActionsTransform: function() {
    // CRITICAL: Only apply transform once, not repeatedly
    // The CSS rules in final-overrides.css already handle this, so we don't need a setInterval
    const applyTransform = () => {
      const navActions = document.querySelector('.nav-actions');
      if (navActions) {
        // Check if transform is already applied to avoid unnecessary DOM manipulation
        const currentTransform = navActions.style.getPropertyValue('transform');
        if (currentTransform !== 'translateX(-161px)') {
          // Force apply transform via inline style to override any CSS conflicts
          navActions.style.setProperty('transform', 'translateX(-161px)', 'important');
          navActions.style.setProperty('margin-left', '0', 'important');
          // Only log in debug mode to reduce console noise
          // console.log('[DEBUG] Nav-actions transform applied via JavaScript');
        }
      }
      
      // Also ensure Generate NFTs tab is always enabled
      this.enableGenerateNftsTab();
    };

    // Apply immediately
    applyTransform();

    // Apply after DOM is ready (only if not already applied)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', applyTransform);
    } else {
      // DOM is already ready, apply once more to ensure it's set
      applyTransform();
    }

    // Apply after window load (only if not already applied)
    if (document.readyState !== 'complete') {
      window.addEventListener('load', applyTransform);
    } else {
      // Window is already loaded, apply once more to ensure it's set
      applyTransform();
    }

    // CRITICAL: Removed setInterval to prevent repeated calls and flickering
    // The CSS rules in final-overrides.css already handle the transform, so we don't need periodic updates
    // If something overrides it, we can use a MutationObserver on nav-actions instead (but only if needed)
  }
})
