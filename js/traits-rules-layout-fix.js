// Traits & Rules Layout Fix
// This script ensures the CSS layout is maintained after JavaScript DOM manipulation

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.traitsRulesLayoutFixInitialized) {
    // console.log('[DEBUG] Traits Rules Layout Fix already initialized, skipping');
    return;
  }
  window.traitsRulesLayoutFixInitialized = true;
  
  // Log script loading for debugging
  // console.log('[DEBUG] Traits & Rules Layout Fix loaded - Script execution #' + (window.traitsRulesLayoutFixCount || 0));
  window.traitsRulesLayoutFixCount = (window.traitsRulesLayoutFixCount || 0) + 1;
  
  // Check if this script is being loaded multiple times
  if (window.traitsRulesLayoutFixCount > 1) {
    // console.warn('[DEBUG] WARNING: Traits Rules Layout Fix script loaded multiple times! This may cause conflicts.');
  }
  
  // Track MemoryManager errors to see if they're related to our script
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('MemoryManager')) {
      // console.log('[DEBUG] MemoryManager error detected - checking if related to our script');
      console.trace('[DEBUG] MemoryManager error stack trace');
    }
    originalConsoleError.apply(console, args);
  };
  
  // Track if setup has been completed to prevent duplicate event listeners
  let setupCompleted = false;
  let buttonSetupCompleted = false;
  
  // Function to enforce the CSS layout
  function enforceTraitsRulesLayout() {
    // console.log('[DEBUG] Enforcing Traits & Rules layout');
    
    // Get the traits-rules tab
    const traitsRulesTab = document.getElementById('traits-rules');
    if (!traitsRulesTab) {
      // console.log('[DEBUG] Traits & Rules tab not found');
      return;
    }
    
    // Get the traits section and rules section
    const traitsSection = traitsRulesTab.querySelector('.traits-section');
    const rulesSection = traitsRulesTab.querySelector('.rules-section');
    
    if (!traitsSection || !rulesSection) {
      console.log('[DEBUG] Traits or Rules section not found');
      return;
    }
    
    // Force the layout to be block-based with proper spacing
    traitsSection.style.cssText = `
      display: block !important;
      width: 100% !important;
      margin-bottom: 0 !important;
      padding-bottom: 2rem !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    `;
    
    rulesSection.style.cssText = `
      display: block !important;
      width: 100% !important;
      margin-top: 0 !important;
      margin-bottom: 2rem !important;
      padding-top: 2rem !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
    `;
    
    // Ensure the combination rules container doesn't interfere
    const combinationRulesContainer = traitsRulesTab.querySelector('.combination-rules-container');
    if (combinationRulesContainer) {
      combinationRulesContainer.style.cssText = `
        display: block !important;
        width: 100% !important;
        margin-top: 0 !important;
        margin-bottom: 50px !important;
        padding-top: 0 !important;
        padding-bottom: 80px !important;
        overflow: visible !important;
        height: auto !important;
        min-height: 100px !important;
        max-height: none !important;
        position: relative !important;
      `;
      
      // Ensure bottom buttons are visible inside combination-rules-container
      const bottomButtons = combinationRulesContainer.querySelector('.bottom-shortcut-buttons');
      if (bottomButtons) {
        bottomButtons.style.cssText = `
          display: flex !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: absolute !important;
          bottom: 0 !important;
          left: 0 !important;
          right: 0 !important;
          width: 100% !important;
          z-index: 100 !important;
          justify-content: center !important;
          align-items: center !important;
          gap: 1rem !important;
          padding: 1rem !important;
          margin: 0 !important;
          border-top: 1px solid var(--border-color) !important;
          background: transparent !important;
          pointer-events: auto !important;
          box-sizing: border-box !important;
        `;
        console.log('[DEBUG] Bottom buttons styled and should be visible');
      } else {
        console.log('[DEBUG] Bottom buttons not found in combination-rules-container');
      }
    }
    
    // console.log('[DEBUG] Layout enforcement complete');
  }

  // Hook into combination rules updateRulesUI to enforce layout
  function hookIntoUpdateRulesUI() {
    const combinationRulesModule = window.NFTApp?.getModule('combinationRules');
    if (combinationRulesModule && typeof combinationRulesModule.updateRulesUI === 'function') {
      const originalUpdateRulesUI = combinationRulesModule.updateRulesUI;
      combinationRulesModule.updateRulesUI = function(projectData) {
        const result = originalUpdateRulesUI.call(this, projectData);
        setTimeout(() => {
          enforceTraitsRulesLayout();
          updateButtonVisibility();
          updateRulesFilterVisibility();
        }, 100);
        return result;
      };
      console.log('[DEBUG] Hooked into combinationRules.updateRulesUI');
    }
  }

  // Hook into combination rules setup
  function hookIntoSetup() {
    const combinationRulesModule = window.NFTApp?.getModule('combinationRules');
    if (combinationRulesModule && typeof combinationRulesModule.setup === 'function') {
      const originalSetup = combinationRulesModule.setup;
      combinationRulesModule.setup = function(projectData) {
        const result = originalSetup.call(this, projectData);
        setTimeout(() => {
          enforceTraitsRulesLayout();
          updateButtonVisibility();
          updateRulesFilterVisibility();
        }, 100);
        return result;
      };
      console.log('[DEBUG] Hooked into combinationRules.setup');
    }
  }

  // Hook into navigation module to update rules section visibility when switching tabs
  // CRITICAL: Add debouncing to prevent multiple calls
  let isProcessingTabSwitch = false;
  let tabSwitchTimeout = null;
  
  function hookIntoNavigation() {
    try {
      const navigationModule = window.NFTApp?.getModule('navigation');
      if (navigationModule && typeof navigationModule.showTab === 'function') {
        // Check if already hooked to prevent duplicate hooks
        if (navigationModule.showTab._traitsRulesHooked) {
          return; // Already hooked
        }
        
        const originalShowTab = navigationModule.showTab;
        navigationModule.showTab = function(tabId, isUserInitiated) {
          const result = originalShowTab.call(this, tabId, isUserInitiated);
          
          // Debounce to prevent multiple rapid calls
          if (tabSwitchTimeout) {
            clearTimeout(tabSwitchTimeout);
          }
          
          if (isProcessingTabSwitch) {
            return result; // Already processing
          }
          
          isProcessingTabSwitch = true;
          tabSwitchTimeout = setTimeout(() => {
            // Note: updateRulesSectionVisibility is only called on project load and layer deletion
            // Once visible, the section stays visible until conditions are not met
            if (tabId === 'traits-rules') {
              forceNativeScrollbar();
            }
            
            // If switching to generate-nfts tab, handle viewport changes
            if (tabId === 'generate-nfts') {
              // CRITICAL: Always ensure scrollbars are hidden - never enable scrolling
              const generateNftsTab = document.getElementById('generate-nfts');
              if (generateNftsTab) {
                // Always hide scrollbars - no scrolling allowed
                generateNftsTab.style.setProperty('overflow', 'hidden', 'important');
                generateNftsTab.style.setProperty('overflow-y', 'hidden', 'important');
                generateNftsTab.style.setProperty('overflow-x', 'hidden', 'important');
                generateNftsTab.style.setProperty('scrollbar-width', 'none', 'important');
                generateNftsTab.style.setProperty('-ms-overflow-style', 'none', 'important');
              }
              // Removed handleViewportChange call since it was enabling scrolling
              // handleViewportChange();
            }
            
            isProcessingTabSwitch = false;
            tabSwitchTimeout = null;
          }, 0); // Use 0ms timeout to defer to next tick but still be fast
          
          return result;
        };
        
        // Mark as hooked to prevent duplicate hooks
        navigationModule.showTab._traitsRulesHooked = true;
        console.log('[DEBUG] Successfully hooked into navigation module');
      } else {
        console.log('[DEBUG] Navigation module not available, using fallback tab detection');
        setupFallbackTabDetection();
      }
    } catch (error) {
      console.log('[DEBUG] Error hooking into navigation module:', error);
      setupFallbackTabDetection();
    }
  }

  // Fallback tab detection when navigation module is not available
  function setupFallbackTabDetection() {
    // Use MutationObserver to watch for tab changes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('tab-content') && target.classList.contains('active')) {
            const tabId = target.id;
            
            // If switching to traits-rules tab
            if (tabId === 'traits-rules') {
              setTimeout(() => {
                // Note: updateRulesSectionVisibility is only called on project load and layer deletion
                forceNativeScrollbar();
              }, 100);
            }
            
            // If switching to generate-nfts tab
            if (tabId === 'generate-nfts') {
              setTimeout(() => {
                handleViewportChange();
                // Force enable scrolling for Generate NFTs tab
                const generateNftsTab = document.getElementById('generate-nfts');
                if (generateNftsTab) {
                  generateNftsTab.style.overflowY = 'auto';
                  generateNftsTab.style.scrollbarWidth = 'auto';
                  generateNftsTab.style.msOverflowStyle = 'scrollbar';
                  console.log('[DEBUG] Fallback: Enabled scrolling for Generate NFTs tab');
                }
              }, 100);
            }
          }
        }
      });
    });
    
    // Observe all tab content elements
    document.querySelectorAll('.tab-content').forEach(tab => {
      observer.observe(tab, { attributes: true });
    });
    
    console.log('[DEBUG] Fallback tab detection setup complete');
  }

  // Hook into trait layers module functions
  function hookIntoTraitLayers() {
    const traitLayersModule = window.NFTApp?.getModule('traitLayers');
    if (traitLayersModule) {
      // Hook into updateTraitLayerUI
      if (typeof traitLayersModule.updateTraitLayerUI === 'function') {
        const originalUpdateTraitLayerUI = traitLayersModule.updateTraitLayerUI;
        traitLayersModule.updateTraitLayerUI = function(...args) {
          // CRITICAL: Don't run calculations if reordering animation is in progress
          if (traitLayersModule._reorderingState && traitLayersModule._reorderingState.isAnimating) {
            // Skip calculations during animation - they'll be done after animation completes
            return originalUpdateTraitLayerUI.apply(this, args);
          }
          
          const result = originalUpdateTraitLayerUI.apply(this, args);
          // Defer non-critical operations to avoid blocking
          requestAnimationFrame(() => {
            updateButtonVisibility();
            // Note: updateRulesSectionVisibility is only called on project load and layer deletion
            forceNativeScrollbar();
          });
          return result;
        };
      }
      
      // Hook into addTrait
      if (typeof traitLayersModule.addTrait === 'function') {
        const originalAddTrait = traitLayersModule.addTrait;
        traitLayersModule.addTrait = function(...args) {
          const result = originalAddTrait.apply(this, args);
          // Defer non-critical operations to avoid blocking
          requestAnimationFrame(() => {
            updateButtonVisibility();
            // Note: updateRulesSectionVisibility is only called on project load and layer deletion
            forceNativeScrollbar();
          });
          return result;
        };
      }
      
      // Hook into deleteTrait
      if (typeof traitLayersModule.deleteTrait === 'function') {
        const originalDeleteTrait = traitLayersModule.deleteTrait;
        traitLayersModule.deleteTrait = function(...args) {
          const result = originalDeleteTrait.apply(this, args);
          // Defer non-critical operations to avoid blocking
          requestAnimationFrame(() => {
            updateButtonVisibility();
            // Note: updateRulesSectionVisibility is only called on project load and layer deletion
            forceNativeScrollbar();
          });
          return result;
        };
      }
      
      // Hook into deleteTraitLayer
      if (typeof traitLayersModule.deleteTraitLayer === 'function') {
        const originalDeleteTraitLayer = traitLayersModule.deleteTraitLayer;
        traitLayersModule.deleteTraitLayer = function(...args) {
          const result = originalDeleteTraitLayer.apply(this, args);
          setTimeout(() => {
            updateButtonVisibility();
            // CRITICAL: Update rules section visibility when layer is deleted
            // This is one of the only two places where it should be called
            updateRulesSectionVisibility();
            forceNativeScrollbar();
          }, 100);
          return result;
        };
      }
      
      // Hook into deleteAllTraitLayers
      if (typeof traitLayersModule.deleteAllTraitLayers === 'function') {
        const originalDeleteAllTraitLayers = traitLayersModule.deleteAllTraitLayers;
        traitLayersModule.deleteAllTraitLayers = function(...args) {
          const result = originalDeleteAllTraitLayers.apply(this, args);
          setTimeout(() => {
            updateButtonVisibility();
            // CRITICAL: Update rules section visibility when all layers are deleted
            // This is one of the only two places where it should be called
            updateRulesSectionVisibility();
            forceNativeScrollbar();
          }, 100);
          return result;
        };
      }
      
      // Hook into loadProject
      if (typeof traitLayersModule.loadProject === 'function') {
        const originalLoadProject = traitLayersModule.loadProject;
        traitLayersModule.loadProject = function(...args) {
          const result = originalLoadProject.apply(this, args);
          setTimeout(() => {
            updateButtonVisibility();
            updateRulesFilterVisibility();
            // Note: updateRulesSectionVisibility is only called on project load and layer deletion
          }, 100);
          return result;
        };
      }
      
      console.log('[DEBUG] Hooked into traitLayers module functions');
    }
  }

  // Add functionality to the jump to rules button
  function setupJumpToRulesButton() {
    // Setup jump-to-rules-btn button (in Trait Layers section)
    const jumpButton = document.getElementById('jump-to-rules-btn');
    
    const buttonsToSetup = [jumpButton].filter(btn => btn !== null);
    
    if (buttonsToSetup.length === 0) {
      console.log('[DEBUG] Jump to rules buttons not found, retrying...');
      setTimeout(setupJumpToRulesButton, 100);
      return;
    }
    
    // console.log('[DEBUG] Setting up jump to rules buttons');
    
    buttonsToSetup.forEach(jumpButton => {
      // Prevent duplicate event listeners
      if (jumpButton.dataset.listenerAdded) {
        // console.log('[DEBUG] Jump to rules button already has event listener');
        return;
      }
      
      jumpButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('[DEBUG] Jump to rules button clicked');
      
      // Find the subsection-description with the specific text
      const allDescriptions = document.querySelectorAll('.subsection-description');
      let targetDescription = null;
      
      for (const desc of allDescriptions) {
        if (desc.textContent && desc.textContent.includes('Set up rules for trait combinations to ensure certain traits always or never appear together')) {
          targetDescription = desc;
          break;
        }
      }
      
      if (targetDescription) {
        console.log('[DEBUG] Subsection description found, scrolling...');
        
        // Get the traits-rules tab-content container (the actual scrolling container)
        const traitsRulesTab = document.getElementById('traits-rules');
        if (!traitsRulesTab) {
          console.warn('[DEBUG] Traits-rules tab not found');
          return;
        }
        
        // Calculate position relative to the scrolling container
        const containerRect = traitsRulesTab.getBoundingClientRect();
        const targetRect = targetDescription.getBoundingClientRect();
        
        // Calculate scroll position: target position relative to container + current scroll position
        const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100;
        
        // Scroll the container instead of the window
        traitsRulesTab.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show('Scrolled to Combination Rules', 'info');
        }
        
        console.log('[DEBUG] Scrolled to subsection description');
      } else {
        console.warn('[DEBUG] Subsection description not found');
      }
    }, { capture: true });
    
    // Mark as having event listener
    jumpButton.dataset.listenerAdded = 'true';
    });
    
    console.log('[DEBUG] Jump to rules buttons setup complete');
  }

  // Position jump-to-layers button - Now inside combination-rules-filter-container
  // No positioning needed as it's handled by CSS flex layout
  function positionJumpToLayersButton() {
    const jumpButton = document.getElementById('jump-to-layers-btn');
    if (!jumpButton) {
      console.log('[DEBUG] Jump to layers button not found for positioning');
      return;
    }
    
    // Button is now inside combination-rules-filter-container and positioned with CSS
    // Reset any absolute positioning that might interfere
    jumpButton.style.position = 'static';
    jumpButton.style.top = 'auto';
    jumpButton.style.right = 'auto';
    jumpButton.style.left = 'auto';
    jumpButton.style.transform = 'none';
    
    // Removed debug log to reduce console noise
    // console.log('[DEBUG] Jump to layers button positioning reset - now using flex layout');
  }

  // Add functionality to the jump to layers button
  function setupJumpToLayersButton() {
    const jumpButton = document.getElementById('jump-to-layers-btn');
    if (!jumpButton) {
      console.log('[DEBUG] Jump to layers button not found, retrying...');
      setTimeout(setupJumpToLayersButton, 100);
      return;
    }
    
    // Prevent duplicate event listeners
    if (jumpButton.dataset.listenerAdded) {
      // console.log('[DEBUG] Jump to layers button already has event listener');
      return;
    }
    
    // console.log('[DEBUG] Setting up jump to layers button');
    
    // Button is now inside combination-rules-filter-container, positioning handled by CSS
    // Reset any absolute positioning that might interfere
    positionJumpToLayersButton();
    
    jumpButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('[DEBUG] Jump to layers button clicked');
      
      // Find the subsection-description with the specific text
      const allDescriptions = document.querySelectorAll('.subsection-description');
      let targetDescription = null;
      
      for (const desc of allDescriptions) {
        if (desc.textContent && desc.textContent.includes('Add and manage trait layers for your NFT collection')) {
          targetDescription = desc;
          break;
        }
      }
      
      if (targetDescription) {
        console.log('[DEBUG] Subsection description found, scrolling...');
        
        // Get the traits-rules tab-content container (the actual scrolling container)
        const traitsRulesTab = document.getElementById('traits-rules');
        if (!traitsRulesTab) {
          console.warn('[DEBUG] Traits-rules tab not found');
          return;
        }
        
        // Calculate position relative to the scrolling container
        const containerRect = traitsRulesTab.getBoundingClientRect();
        const targetRect = targetDescription.getBoundingClientRect();
        
        // Calculate scroll position: target position relative to container + current scroll position
        const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100;
        
        // Scroll the container instead of the window
        traitsRulesTab.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show('Scrolled to Trait Layers', 'info');
        }
        
        console.log('[DEBUG] Scrolled to subsection description');
      } else {
        console.warn('[DEBUG] Subsection description not found');
      }
    }, { capture: true });
    
    // Mark as having event listener
    jumpButton.dataset.listenerAdded = 'true';
    
    // Add window resize listener to reposition button
    window.addEventListener('resize', () => {
      setTimeout(positionJumpToLayersButton, 100);
    });
    
    // Add scroll listener to reposition button
    window.addEventListener('scroll', () => {
      setTimeout(positionJumpToLayersButton, 100);
    });
    
    // Add tab change listener to hide/show button based on active tab
    const checkActiveTab = () => {
      const traitsRulesTab = document.getElementById('traits-rules');
      const isTraitsRulesActive = traitsRulesTab && traitsRulesTab.classList.contains('active');
      
      if (jumpButton) {
        jumpButton.style.display = isTraitsRulesActive ? 'flex' : 'none';
        // Removed debug log to reduce console noise
        // console.log(`[DEBUG] Jump to layers button visibility based on tab: ${isTraitsRulesActive ? 'visible' : 'hidden'}`);
        
        if (isTraitsRulesActive) {
          setTimeout(positionJumpToLayersButton, 100);
        }
      }
    };
    
    // Check tab on setup
    checkActiveTab();
    
    // Listen for tab changes
    const tabObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          const target = mutation.target;
          if (target.classList.contains('tab-content')) {
            checkActiveTab();
          }
        }
      });
    });
    
    // Observe all tab content elements
    document.querySelectorAll('.tab-content').forEach(tab => {
      tabObserver.observe(tab, { attributes: true });
    });
    
    console.log('[DEBUG] Jump to layers button setup complete');
    
    // Debug: Log button state
    setTimeout(() => {
      console.log('[DEBUG] Jump to layers button final state:', {
        exists: !!jumpButton,
        display: jumpButton.style.display,
        visibility: jumpButton.style.visibility,
        opacity: jumpButton.style.opacity,
        position: jumpButton.style.position,
        zIndex: jumpButton.style.zIndex,
        top: jumpButton.style.top,
        right: jumpButton.style.right,
        left: jumpButton.style.left,
        computedStyle: window.getComputedStyle(jumpButton).display
      });
    }, 500);
  }

  // Add functionality to the bottom buttons
  function setupBottomButtons() {
    const jumpToLayersBottomBtn = document.getElementById('jump-to-layers-bottom-btn');
    const jumpToRulesBottomBtn = document.getElementById('jump-to-rules-bottom-btn');
    
    if (!jumpToLayersBottomBtn || !jumpToRulesBottomBtn) {
      console.log('[DEBUG] Bottom buttons not found, retrying...');
      setTimeout(setupBottomButtons, 100);
      return;
    }
    
    // Prevent duplicate event listeners
    if (jumpToLayersBottomBtn.dataset.listenerAdded && jumpToRulesBottomBtn.dataset.listenerAdded) {
      // console.log('[DEBUG] Bottom buttons already have event listeners');
      return;
    }
    
    // console.log('[DEBUG] Setting up bottom buttons');
    
    // Jump to layers bottom button
    if (!jumpToLayersBottomBtn.dataset.listenerAdded) {
      jumpToLayersBottomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Jump to layers bottom button clicked');
        
        // Find the subsection-description with the specific text
        const allDescriptions = document.querySelectorAll('.subsection-description');
        let targetDescription = null;
        
        for (const desc of allDescriptions) {
          if (desc.textContent && desc.textContent.includes('Add and manage trait layers for your NFT collection')) {
            targetDescription = desc;
            break;
          }
        }
        
        if (targetDescription) {
          console.log('[DEBUG] Subsection description found, scrolling...');
          
          // Get the traits-rules tab-content container (the actual scrolling container)
          const traitsRulesTab = document.getElementById('traits-rules');
          if (!traitsRulesTab) {
            console.warn('[DEBUG] Traits-rules tab not found');
            return;
          }
          
          // Calculate position relative to the scrolling container
          const containerRect = traitsRulesTab.getBoundingClientRect();
          const targetRect = targetDescription.getBoundingClientRect();
          
          // Calculate scroll position: target position relative to container + current scroll position
          const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100;
          
          // Scroll the container instead of the window
          traitsRulesTab.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
          
          // Add a subtle highlight effect to the parent section
          const traitsSection = targetDescription.closest('.traits-section') || document.getElementById('traits-section');
          if (traitsSection) {
            traitsSection.style.transition = 'box-shadow 0.3s ease';
            traitsSection.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.5)';
            
            setTimeout(() => {
              traitsSection.style.boxShadow = '';
            }, 2000);
          }
          
          // Show notification
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Trait Layers', 'info');
          }
          
          console.log('[DEBUG] Scrolled to subsection description');
        } else {
          console.warn('[DEBUG] Subsection description not found');
        }
      }, { capture: true });
      jumpToLayersBottomBtn.dataset.listenerAdded = 'true';
    }
    
    // Jump to rules bottom button
    if (!jumpToRulesBottomBtn.dataset.listenerAdded) {
      jumpToRulesBottomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Jump to rules bottom button clicked');
        
        // Find the subsection-description with the specific text
        const allDescriptions = document.querySelectorAll('.subsection-description');
        let targetDescription = null;
        
        for (const desc of allDescriptions) {
          if (desc.textContent && desc.textContent.includes('Set up rules for trait combinations to ensure certain traits always or never appear together')) {
            targetDescription = desc;
            break;
          }
        }
        
        if (targetDescription) {
          console.log('[DEBUG] Subsection description found, scrolling...');
          
          // Get the traits-rules tab-content container (the actual scrolling container)
          const traitsRulesTab = document.getElementById('traits-rules');
          if (!traitsRulesTab) {
            console.warn('[DEBUG] Traits-rules tab not found');
            return;
          }
          
          // Calculate position relative to the scrolling container
          const containerRect = traitsRulesTab.getBoundingClientRect();
          const targetRect = targetDescription.getBoundingClientRect();
          
          // Calculate scroll position: target position relative to container + current scroll position
          const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100;
          
          // Scroll the container instead of the window
          traitsRulesTab.scrollTo({
            top: scrollPosition,
            behavior: 'smooth'
          });
          
          // Show notification
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Combination Rules', 'info');
          }
          
          console.log('[DEBUG] Scrolled to subsection description');
        } else {
          console.warn('[DEBUG] Subsection description not found');
        }
      }, { capture: true });
      jumpToRulesBottomBtn.dataset.listenerAdded = 'true';
    }
    
    console.log('[DEBUG] Bottom buttons setup complete');
  }

  // Function to check if buttons should be visible
  function updateButtonVisibility() {
    // console.log('[DEBUG] updateButtonVisibility called');
    
    // Try multiple ways to get project data
    let projectData = null;
    
    // Method 1: Try generateNftsUI module
    if (window.NFTApp?.getModule('generateNftsUI')?.projectData) {
      projectData = window.NFTApp.getModule('generateNftsUI').projectData;
      // console.log('[DEBUG] Got project data from generateNftsUI module');
    }
    
    // Method 2: Try currentProject global variable
    if (!projectData && window.currentProject) {
      projectData = window.currentProject;
      // console.log('[DEBUG] Got project data from currentProject global');
    }
    
    // Method 3: Try to get from trait layers module
    if (!projectData && window.NFTApp?.getModule('traitLayers')?.projectData) {
      projectData = window.NFTApp.getModule('traitLayers').projectData;
      // console.log('[DEBUG] Got project data from traitLayers module');
    }
    
    // Method 4: Try to get from combination rules module
    if (!projectData && window.NFTApp?.getModule('combinationRules')?.projectData) {
      projectData = window.NFTApp.getModule('combinationRules').projectData;
      // console.log('[DEBUG] Got project data from combinationRules module');
    }
    
    // Method 5: Try to get from project interface module
    if (!projectData && window.NFTApp?.getModule('projectInterface')?.projectData) {
      projectData = window.NFTApp.getModule('projectInterface').projectData;
      // console.log('[DEBUG] Got project data from projectInterface module');
    }
    
    if (!projectData) {
      // console.log('[DEBUG] No project data available for button visibility check');
      // console.log('[DEBUG] Available modules:', Object.keys(window.NFTApp?.getModule ? {} : {}));
      // Hide all buttons if no project data
      hideAllButtons();
      return;
    }
    
    // Validate trait layers using the combination-rules module validation function
    // Jump to Rules buttons should only be visible when at least 2 trait layers with 1 trait each exist
    let shouldShowJumpToRulesButtons = false;
    
    // Use the validateTraitLayers function from combination-rules module if available
    const combinationRulesModule = window.NFTApp?.getModule('combinationRules');
    if (combinationRulesModule && combinationRulesModule.validateTraitLayers) {
      shouldShowJumpToRulesButtons = combinationRulesModule.validateTraitLayers(projectData);
    } else {
      // Fallback validation: Check if there are at least 2 trait layers with at least 1 trait each
      if (projectData.traits && Array.isArray(projectData.traits) && projectData.traits.length >= 2) {
        let layersWithTraits = 0;
        for (const layer of projectData.traits) {
          if (layer && layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0) {
            layersWithTraits++;
          }
        }
        shouldShowJumpToRulesButtons = layersWithTraits >= 2;
      }
    }
    
    // CRITICAL: jump-to-layers-bottom-btn now uses the same conditions as other jump-to buttons
    // Removed shouldShowJumpToLayersBottom - all buttons now use shouldShowJumpToRulesButtons
    // (at least 2 trait layers with 1 trait each)
    
    // console.log('[DEBUG] Button visibility check:', {
    //   shouldShowJumpToRulesButtons,
    //   traitLayersCount: projectData.traits ? projectData.traits.length : 0,
    //   combinationRulesCount: projectData.rules ? projectData.rules.length : 0,
    //   projectData: !!projectData
    // });
    
    // Update visibility of Jump to Rules buttons - only show when requirements are met
    const jumpToRulesButtons = [
      'jump-to-rules-btn',
      'jump-to-rules-bottom-btn'
    ];
    
    // CRITICAL: Also update jump-to-layers-btn visibility (it's in combination-rules-buttons-container)
    const jumpToLayersBtn = document.getElementById('jump-to-layers-btn');
    if (jumpToLayersBtn && jumpToLayersBtn.closest('.combination-rules-buttons-container')) {
      // CRITICAL: Use visibility instead of display to keep space when hidden
      if (shouldShowJumpToRulesButtons) {
        jumpToLayersBtn.style.setProperty('display', 'flex', 'important');
        jumpToLayersBtn.style.setProperty('visibility', 'visible', 'important');
        jumpToLayersBtn.style.setProperty('opacity', '1', 'important');
        
        // CRITICAL: Ensure parent container is visible
        const parentContainer = jumpToLayersBtn.closest('.jump-to-layers-container');
        if (parentContainer) {
          parentContainer.style.setProperty('display', 'flex', 'important');
          parentContainer.style.setProperty('visibility', 'visible', 'important');
          parentContainer.style.setProperty('opacity', '1', 'important');
        }
        
        // CRITICAL: Re-setup tooltip when button becomes visible
        setTimeout(() => {
          const tooltip = jumpToLayersBtn.querySelector(".tooltiptext");
          if (tooltip) {
            if (!jumpToLayersBtn.contains(tooltip)) {
              jumpToLayersBtn.appendChild(tooltip);
            }
            const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
            if (tooltipManager && tooltipManager.setupTooltip) {
              jumpToLayersBtn.removeAttribute('data-tooltip-setup');
              delete jumpToLayersBtn.dataset.tooltipSetup;
              tooltipManager.setupTooltip(jumpToLayersBtn, tooltip);
            }
          }
        }, 50);
      } else {
        // CRITICAL: Use visibility: hidden instead of display: none to keep space
        jumpToLayersBtn.style.setProperty('display', 'flex', 'important');
        jumpToLayersBtn.style.setProperty('visibility', 'hidden', 'important');
        jumpToLayersBtn.style.setProperty('opacity', '0', 'important');
      }
    }
    
    jumpToRulesButtons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        if (shouldShowJumpToRulesButtons) {
          // CRITICAL: Use visibility instead of display to keep space when hidden
          // CRITICAL: Display stays flex to reserve space, visibility controls actual visibility
          button.style.setProperty('display', 'flex', 'important');
          button.style.setProperty('visibility', 'visible', 'important');
          button.style.setProperty('opacity', '1', 'important');
          // CRITICAL: Remove inline style="display: none;" if present
          if (button.getAttribute('style') && button.getAttribute('style').includes('display: none')) {
            button.setAttribute('style', button.getAttribute('style').replace(/display:\s*none[^;]*;?/gi, ''));
          }
          
          // CRITICAL: Ensure parent container is visible (for jump-to-rules-btn in trait layers section)
          if (buttonId === 'jump-to-rules-btn') {
            const parentContainer = button.closest('.trait-layers-actions-right');
            if (parentContainer) {
              parentContainer.style.setProperty('display', 'flex', 'important');
              parentContainer.style.setProperty('visibility', 'visible', 'important');
              parentContainer.style.setProperty('opacity', '1', 'important');
            }
          }
          
          // CRITICAL: Re-setup tooltip when button becomes visible to ensure it works
          // CRITICAL: Use setTimeout to ensure DOM is ready and tooltip can be properly attached
          setTimeout(() => {
            const tooltip = button.querySelector(".tooltiptext");
            if (tooltip) {
              // CRITICAL: Ensure tooltip is properly attached to button before setup
              if (!button.contains(tooltip)) {
                button.appendChild(tooltip);
              }
              const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
              if (tooltipManager && tooltipManager.setupTooltip) {
                button.removeAttribute('data-tooltip-setup');
                delete button.dataset.tooltipSetup;
                tooltipManager.setupTooltip(button, tooltip);
              } else {
                // Fallback to trait-layers setupTooltipPositioning
                const traitLayersModule = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('traitLayers');
                if (traitLayersModule && traitLayersModule.setupTooltipPositioning) {
                  button.removeAttribute('data-tooltip-setup');
                  delete button.dataset.tooltipSetup;
                  traitLayersModule.setupTooltipPositioning(button, tooltip);
                }
              }
            }
          }, 50);
          // console.log(`[DEBUG] Button ${buttonId} is now VISIBLE`);
        } else {
          // CRITICAL: Use visibility: hidden instead of display: none to keep space
          // This prevents layout shift when button is hidden/shown
          button.style.setProperty('display', 'flex', 'important'); // Keep flex to reserve space
          button.style.setProperty('visibility', 'hidden', 'important');
          button.style.setProperty('opacity', '0', 'important');
          // console.log(`[DEBUG] Button ${buttonId} is now HIDDEN (space reserved)`);
        }
      } else {
        // console.warn(`[DEBUG] Button ${buttonId} not found in DOM - will retry on next update`);
      }
    });
    
    // CRITICAL: Update visibility of Jump to Layers bottom button - use same conditions as other jump-to buttons
    // Must use shouldShowJumpToRulesButtons (at least 2 trait layers with 1 trait each) instead of shouldShowJumpToLayersBottom
    const jumpToLayersBottomBtn = document.getElementById('jump-to-layers-bottom-btn');
    if (jumpToLayersBottomBtn) {
      if (shouldShowJumpToRulesButtons) {
        // CRITICAL: Use visibility instead of display to keep space when hidden (consistent with other buttons)
        jumpToLayersBottomBtn.style.setProperty('display', 'flex', 'important');
        jumpToLayersBottomBtn.style.setProperty('visibility', 'visible', 'important');
        jumpToLayersBottomBtn.style.setProperty('opacity', '1', 'important');
        
        // CRITICAL: Re-setup tooltip when button becomes visible
        setTimeout(() => {
          const tooltip = jumpToLayersBottomBtn.querySelector(".tooltiptext");
          if (tooltip) {
            if (!jumpToLayersBottomBtn.contains(tooltip)) {
              jumpToLayersBottomBtn.appendChild(tooltip);
            }
            const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
            if (tooltipManager && tooltipManager.setupTooltip) {
              jumpToLayersBottomBtn.removeAttribute('data-tooltip-setup');
              delete jumpToLayersBottomBtn.dataset.tooltipSetup;
              tooltipManager.setupTooltip(jumpToLayersBottomBtn, tooltip);
            }
          }
        }, 50);
        // console.log(`[DEBUG] Button jump-to-layers-bottom-btn is now VISIBLE`);
      } else {
        // CRITICAL: Use visibility: hidden instead of display: none to keep space (consistent with other buttons)
        jumpToLayersBottomBtn.style.setProperty('display', 'flex', 'important'); // Keep flex to reserve space
        jumpToLayersBottomBtn.style.setProperty('visibility', 'hidden', 'important');
        jumpToLayersBottomBtn.style.setProperty('opacity', '0', 'important');
        // console.log(`[DEBUG] Button jump-to-layers-bottom-btn is now HIDDEN (space reserved)`);
      }
    }
    
    // Note: jump-to-layers-btn is now inside the combination-rules-filter-container
    // and will be managed by the filter container visibility
    
    // Update visibility of bottom buttons container - Show when rules section is visible
    const bottomContainer = document.querySelector('.bottom-shortcut-buttons');
    const rulesSection = document.querySelector('.rules-section');
    const isRulesSectionVisible = rulesSection && rulesSection.style.display !== 'none' && !rulesSection.classList.contains('hidden');
    
    if (bottomContainer) {
      // CRITICAL: Show bottom container if rules section is visible AND at least one button should be visible
      // Since jump-to-layers-bottom-btn now uses shouldShowJumpToRulesButtons, we only need to check that
      const shouldShowContainer = isRulesSectionVisible && shouldShowJumpToRulesButtons;
      if (shouldShowContainer) {
        bottomContainer.style.display = 'flex';
        bottomContainer.style.visibility = 'visible';
        bottomContainer.style.opacity = '1';
      } else {
        bottomContainer.style.display = 'none';
      }
      // console.log(`[DEBUG] Bottom container visibility: ${shouldShowContainer ? 'visible' : 'hidden'}`);
    }
  }

  // Hide all buttons
  function hideAllButtons() {
    const buttons = [
      'jump-to-rules-btn',
      'jump-to-rules-bottom-btn',
      'jump-to-layers-bottom-btn'
    ];
    
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = 'none';
      }
    });
    
    const bottomContainer = document.querySelector('.bottom-shortcut-buttons');
    if (bottomContainer) {
      bottomContainer.style.display = 'none';
    }
    
    // Hide the filter container (which contains jump-to-layers-btn)
    const filterContainer = document.getElementById('combination-rules-filter-container');
    if (filterContainer) {
      filterContainer.style.display = 'none';
    }
  }

  // Show all buttons
  function showAllButtons() {
    const buttons = [
      'jump-to-rules-btn',
      'jump-to-rules-bottom-btn',
      'jump-to-layers-bottom-btn'
    ];
    
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = 'flex';
      }
    });
    
    const bottomContainer = document.querySelector('.bottom-shortcut-buttons');
    if (bottomContainer) {
      bottomContainer.style.display = 'flex';
    }
    
    // Show the filter container (which contains jump-to-layers-btn)
    const filterContainer = document.getElementById('combination-rules-filter-container');
    if (filterContainer) {
      filterContainer.style.display = 'flex';
    }
  }

  // Hide rules filter
  function hideRulesFilter() {
    const filterContainer = document.getElementById('combination-rules-filter-container');
    if (filterContainer) {
      filterContainer.style.display = 'none';
    }
  }

  // CRITICAL: Global cleanup function to remove ALL duplicate dropdowns
  // Expose it globally so it can be called from anywhere
  window.cleanupDuplicateDropdowns = function cleanupDuplicateDropdowns() {
    // CRITICAL: Find the CORRECT dropdown (the one in the correct container from project-interface.js)
    const filterContainer = document.getElementById('combination-rules-filter-container');
    const correctDropdown = filterContainer ? filterContainer.querySelector('#rules-filter-dropdown') : null;
    
    // CRITICAL: If custom dropdown exists for rules-filter-dropdown, hide the native select
    const allCustomDropdowns = document.querySelectorAll('.custom-dropdown');
    const rulesFilterCustomDropdown = Array.from(allCustomDropdowns).find(cd => {
      const dataFor = cd.querySelector('[data-for="rules-filter-dropdown"]');
      return dataFor !== null;
    });
    
    // If custom dropdown exists, hide ALL native select elements
    if (rulesFilterCustomDropdown) {
      const allDropdowns = document.querySelectorAll('#rules-filter-dropdown');
      allDropdowns.forEach((dropdown) => {
        // Hide the native select - custom dropdown will handle display
        dropdown.style.setProperty('display', 'none', 'important');
        dropdown.style.setProperty('visibility', 'hidden', 'important');
        dropdown.style.setProperty('opacity', '0', 'important');
        dropdown.style.setProperty('position', 'absolute', 'important');
        dropdown.style.setProperty('width', '0', 'important');
        dropdown.style.setProperty('height', '0', 'important');
        dropdown.style.setProperty('pointer-events', 'none', 'important');
        console.log('[CLEANUP] Hiding native rules-filter-dropdown select (custom dropdown exists)');
      });
    }
    
    // Remove ALL duplicate select elements - keep ONLY the correct one
    const allDropdowns = document.querySelectorAll('#rules-filter-dropdown');
    if (allDropdowns.length > 1 || (allDropdowns.length === 1 && allDropdowns[0] !== correctDropdown)) {
      console.log('[CLEANUP] Found', allDropdowns.length, 'rules-filter-dropdown select elements, cleaning up duplicates');
      allDropdowns.forEach((dropdown, index) => {
        if (dropdown !== correctDropdown) {
          const duplicateContainer = dropdown.closest('.combination-rules-filter-container');
          const duplicateWrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
          if (duplicateContainer && duplicateContainer !== filterContainer) {
            console.log('[CLEANUP] Removing duplicate filter container', index);
            duplicateContainer.remove();
          } else if (duplicateWrapper && duplicateWrapper !== filterContainer?.querySelector('.rules-filter-dropdown-wrapper')) {
            console.log('[CLEANUP] Removing duplicate dropdown wrapper', index);
            duplicateWrapper.remove();
          } else {
            console.log('[CLEANUP] Removing duplicate dropdown element', index);
            dropdown.remove();
          }
        }
      });
    }
    
    // CRITICAL: Remove ALL duplicate custom dropdown containers - keep ONLY the one for the correct dropdown
    // Reuse allCustomDropdowns variable declared above
    const rulesFilterCustomDropdowns = Array.from(allCustomDropdowns).filter(cd => {
      const dataFor = cd.querySelector('[data-for="rules-filter-dropdown"]');
      return dataFor !== null;
    });
    
    // Find the correct custom dropdown (the one next to the correct select)
    const correctCustomDropdown = correctDropdown && correctDropdown.nextElementSibling && 
                                   correctDropdown.nextElementSibling.classList.contains('custom-dropdown') &&
                                   correctDropdown.nextElementSibling.querySelector('[data-for="rules-filter-dropdown"]') ?
                                   correctDropdown.nextElementSibling : null;
    
    if (rulesFilterCustomDropdowns.length > 1 || (rulesFilterCustomDropdowns.length === 1 && rulesFilterCustomDropdowns[0] !== correctCustomDropdown)) {
      console.log('[CLEANUP] Found', rulesFilterCustomDropdowns.length, 'custom dropdown containers, cleaning up duplicates');
      rulesFilterCustomDropdowns.forEach((customDropdown, index) => {
        if (customDropdown !== correctCustomDropdown) {
          console.log('[CLEANUP] Removing duplicate custom dropdown container', index);
          customDropdown.remove();
        }
      });
    }
    
    // Remove any custom display overlays that might conflict with custom-dropdown.js
    const allWrappers = document.querySelectorAll('.rules-filter-dropdown-wrapper');
    allWrappers.forEach(wrapper => {
      const customDisplay = wrapper.querySelector('.rules-filter-dropdown-custom-display');
      const select = wrapper.querySelector('#rules-filter-dropdown');
      if (customDisplay && select && select.classList.contains('custom-dropdown-convert')) {
        // If select has custom-dropdown-convert class, custom-dropdown.js will handle it
        // Remove the custom display overlay to prevent conflicts
        console.log('[CLEANUP] Removing custom display overlay - custom-dropdown.js will handle it');
        customDisplay.remove();
      }
    });
    
    // CRITICAL: Final check - ensure only ONE dropdown exists
    const finalCheck = document.querySelectorAll('#rules-filter-dropdown');
    if (finalCheck.length > 1) {
      console.error('[CLEANUP ERROR] Still found', finalCheck.length, 'dropdowns after cleanup! Removing all but first');
      for (let i = 1; i < finalCheck.length; i++) {
        finalCheck[i].closest('.combination-rules-filter-container')?.remove() || finalCheck[i].remove();
      }
    }
  }
  
  // CRITICAL: Set up a MutationObserver to aggressively clean up duplicates whenever DOM changes
  if (typeof MutationObserver !== 'undefined') {
    const cleanupObserver = new MutationObserver(() => {
      const dropdownCount = document.querySelectorAll('#rules-filter-dropdown').length;
      const customDropdownCount = document.querySelectorAll('.custom-dropdown [data-for="rules-filter-dropdown"]').length;
      
      // If custom dropdown exists, hide all native selects
      if (customDropdownCount > 0) {
        const allDropdowns = document.querySelectorAll('#rules-filter-dropdown');
        allDropdowns.forEach((dropdown) => {
          dropdown.style.setProperty('display', 'none', 'important');
          dropdown.style.setProperty('visibility', 'hidden', 'important');
          dropdown.style.setProperty('opacity', '0', 'important');
          dropdown.style.setProperty('position', 'absolute', 'important');
          dropdown.style.setProperty('width', '0', 'important');
          dropdown.style.setProperty('height', '0', 'important');
          dropdown.style.setProperty('pointer-events', 'none', 'important');
        });
      }
      
      if (dropdownCount > 1) {
        console.log('[CLEANUP OBSERVER] Detected', dropdownCount, 'dropdowns, running cleanup');
        window.cleanupDuplicateDropdowns();
      }
    });
    
    // Start observing when DOM is ready
    if (document.body) {
      cleanupObserver.observe(document.body, {
        childList: true,
        subtree: true
      });
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        cleanupObserver.observe(document.body, {
          childList: true,
          subtree: true
        });
      });
    }
  }

    // Setup the rules filter functionality
    function setupRulesFilter() {
      // CRITICAL: Run cleanup FIRST, before any checks
      cleanupDuplicateDropdowns();
      
      // CRITICAL: Prevent multiple initializations
      if (window._rulesFilterSetupComplete) {
        // console.log('[DEBUG] Rules filter already set up, skipping');
        return;
      }
      
      // console.log('[DEBUG] Setting up rules filter');
      
      // Cleanup already done by cleanupDuplicateDropdowns() above
      // Now get the filter container after cleanup
      const filterContainer = document.getElementById('combination-rules-filter-container');
      
      // CRITICAL: Check for and remove any duplicate dropdowns
      // Find all select elements with id="rules-filter-dropdown" - there should only be one
      const allDropdowns = document.querySelectorAll('#rules-filter-dropdown');
      if (allDropdowns.length > 1) {
        console.log('[DEBUG] Found', allDropdowns.length, 'duplicate rules-filter-dropdown elements, removing duplicates');
        // Keep only the first one (the one in the correct container), remove the rest
        const correctContainer = filterContainer?.querySelector('#rules-filter-dropdown');
        for (let i = 0; i < allDropdowns.length; i++) {
          const dropdown = allDropdowns[i];
          if (dropdown !== correctContainer) {
            const duplicateWrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
            const duplicateContainer = dropdown.closest('.combination-rules-filter-container');
            if (duplicateContainer && duplicateContainer !== filterContainer) {
              console.log('[DEBUG] Removing duplicate filter container');
              duplicateContainer.remove();
            } else if (duplicateWrapper && duplicateWrapper !== filterContainer?.querySelector('.rules-filter-dropdown-wrapper')) {
              console.log('[DEBUG] Removing duplicate dropdown wrapper');
              duplicateWrapper.remove();
            } else {
              console.log('[DEBUG] Removing duplicate dropdown element');
              dropdown.remove();
            }
          }
        }
      }
      
      // CRITICAL: Also check for duplicate custom dropdown containers
      const allCustomDropdownsCheck = document.querySelectorAll('.custom-dropdown');
      const rulesFilterCustomDropdowns = Array.from(allCustomDropdownsCheck).filter(cd => {
        const dataFor = cd.querySelector('[data-for="rules-filter-dropdown"]');
        return dataFor !== null;
      });
      if (rulesFilterCustomDropdowns.length > 1) {
        console.log('[DEBUG] Found', rulesFilterCustomDropdowns.length, 'duplicate custom dropdown containers for rules-filter-dropdown, removing duplicates');
        // Keep only the first one, remove the rest
        for (let i = 1; i < rulesFilterCustomDropdowns.length; i++) {
          console.log('[DEBUG] Removing duplicate custom dropdown container');
          rulesFilterCustomDropdowns[i].remove();
        }
      }
      
      const clearBtn = document.getElementById('clear-rules-filter-btn');
      const dropdown = document.getElementById('rules-filter-dropdown');
      const jumpBtn = document.getElementById('jump-to-layers-btn');
      
      // CRITICAL: Remove any title attribute from dropdown to prevent native browser tooltip
      if (dropdown) {
        dropdown.removeAttribute('title');
        dropdown.setAttribute('title', ''); // Set empty title to prevent native tooltip
        // Ensure dropdown doesn't have tooltip class
        dropdown.classList.remove('tooltip');
        // CRITICAL: Ensure dropdown is enabled and clickable
        dropdown.removeAttribute('disabled');
        dropdown.removeAttribute('readonly');
        dropdown.disabled = false;
        // CRITICAL: Ensure dropdown has proper appearance settings to remove native arrows
        dropdown.style.setProperty('appearance', 'none', 'important');
        dropdown.style.setProperty('-webkit-appearance', 'none', 'important');
        dropdown.style.setProperty('-moz-appearance', 'none', 'important');
        // CRITICAL: Ensure dropdown can receive clicks
        dropdown.style.setProperty('pointer-events', 'auto', 'important');
        dropdown.style.setProperty('z-index', '2', 'important');
        dropdown.style.setProperty('position', 'relative', 'important');
        // CRITICAL: Remove any child elements that might be icons or checkmarks
        const dropdownChildren = Array.from(dropdown.children);
        dropdownChildren.forEach(child => {
          // Remove any elements that aren't option elements (like icons or checkmarks)
          if (child.tagName !== 'OPTION') {
            child.remove();
          }
        });
        // CRITICAL: Force remove any pseudo-elements or conflicting styles
        dropdown.style.setProperty('background-image', 'url("data:image/svg+xml,%3csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 20 20\'%3e%3cpath stroke=\'%236b7280\' stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'1.5\' d=\'m6 8 4 4 4-4\'/%3e%3c/svg%3e")', 'important');
        dropdown.style.setProperty('background-position', 'right 0.75rem center', 'important');
        dropdown.style.setProperty('background-repeat', 'no-repeat', 'important');
        dropdown.style.setProperty('background-size', '1rem', 'important');
        dropdown.style.setProperty('padding-right', '2.5rem', 'important');
      }
    
    if (!filterContainer || !clearBtn || !dropdown || !jumpBtn) {
      // console.log('[DEBUG] Rules filter elements not found, retrying...', {
      //   filterContainer: !!filterContainer,
      //   clearBtn: !!clearBtn,
      //   dropdown: !!dropdown,
      //   jumpBtn: !!jumpBtn
      // });
      setTimeout(setupRulesFilter, 100);
      return;
    }
    
    // Prevent duplicate event listeners AND duplicate custom display setup
    if (clearBtn.dataset.listenerAdded && dropdown.dataset.listenerAdded && jumpBtn.dataset.listenerAdded) {
      // Check if custom display already exists
      const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
      if (wrapper && wrapper.querySelector('.rules-filter-dropdown-custom-display')) {
        // console.log('[DEBUG] Rules filter already has event listeners and custom display');
        // CRITICAL: Still ensure "All Rule Types" is selected by default
        if (dropdown && dropdown.options.length > 0 && dropdown.options[0].value === '') {
          if (dropdown.selectedIndex !== 0 || dropdown.value !== '') {
            dropdown.selectedIndex = 0;
            dropdown.value = '';
            // Update display if custom display exists
            const customDisplay = wrapper.querySelector('.rules-filter-dropdown-custom-display');
            if (customDisplay) {
              // Force update display
              const selectedOption = dropdown.options[0];
              if (selectedOption) {
                customDisplay.innerHTML = `<span style="color: #ffffff;">All Rule Types</span>`;
                customDisplay.style.color = '#ffffff';
              }
            }
          }
        }
      return;
      }
    }
    
    // console.log('[DEBUG] All filter elements found, setting up event listeners');
    
    // Clear filter button functionality
    if (!clearBtn.dataset.listenerAdded) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // console.log('[DEBUG] Clear filter button clicked');
        dropdown.value = '';
        filterRules('');
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show('Filter cleared', 'success');
        }
      }, { capture: true });
      clearBtn.dataset.listenerAdded = 'true';
      // console.log('[DEBUG] Clear button event listener added');
      
      // CRITICAL: Setup tooltip for Clear Filter button
      const setupClearFilterTooltip = () => {
        if (!clearBtn || !document.body.contains(clearBtn)) {
          return;
        }
        
        const computedStyle = window.getComputedStyle(clearBtn);
        if (computedStyle.display === 'none' || computedStyle.visibility === 'hidden') {
          setTimeout(setupClearFilterTooltip, 500);
          return;
        }
        
        let tooltip = clearBtn.querySelector(".tooltiptext");
        
        if (!tooltip) {
          const tooltipId = clearBtn.getAttribute('data-tooltip-id');
          if (tooltipId) {
            tooltip = document.getElementById(tooltipId);
          }
          if (!tooltip && clearBtn.parentElement) {
            tooltip = clearBtn.parentElement.querySelector(`.tooltiptext[data-for="${clearBtn.id}"]`);
          }
        }
        
        if (tooltip) {
          if (!clearBtn.contains(tooltip)) {
            clearBtn.appendChild(tooltip);
          }
          clearBtn.style.setProperty("cursor", "default", "important");
          if (!clearBtn.classList.contains('tooltip')) {
            clearBtn.classList.add('tooltip');
          }
          
          const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
          if (tooltipManager && tooltipManager.setupTooltip) {
            clearBtn.removeAttribute('data-tooltip-setup');
            delete clearBtn.dataset.tooltipSetup;
            tooltipManager.setupTooltip(clearBtn, tooltip);
          }
        } else {
          setTimeout(setupClearFilterTooltip, 500);
        }
      };
      
      // Setup tooltip immediately and retry if needed
      setupClearFilterTooltip();
      setTimeout(setupClearFilterTooltip, 100);
      setTimeout(setupClearFilterTooltip, 300);
      setTimeout(setupClearFilterTooltip, 500);
      setTimeout(setupClearFilterTooltip, 1000);
      setTimeout(setupClearFilterTooltip, 2000);
      
      // CRITICAL: Also ensure tooltip is set up when button becomes visible
      // Use MutationObserver to watch for visibility changes
      if (clearBtn && typeof MutationObserver !== 'undefined') {
        const tooltipObserver = new MutationObserver(() => {
          const computedStyle = window.getComputedStyle(clearBtn);
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            setupClearFilterTooltip();
          }
        });
        
        tooltipObserver.observe(clearBtn, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true,
          subtree: true
        });
      }
    }
    
    // CRITICAL: Setup custom display overlay for dropdown to show colors and symbols
    // This avoids creating duplicate dropdowns while still showing colored text and symbols
    // NOTE: If custom-dropdown.js is converting this dropdown, it will handle the display
    // But we still set up the overlay as a fallback for collapsed state consistency
    function setupDropdownCustomDisplay() {
      const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
      if (!wrapper) return;
      
      // Check if custom-dropdown.js has already converted this dropdown
      // Custom-dropdown.js hides the select and creates a new container after it
      // So we check if the select is hidden (display: none) and if there's a custom-dropdown container nearby
      const isSelectHidden = dropdown.style.display === 'none' || window.getComputedStyle(dropdown).display === 'none';
      const nextSibling = dropdown.nextElementSibling;
      const hasCustomDropdown = nextSibling && nextSibling.classList && nextSibling.classList.contains('custom-dropdown');
      
      if (isSelectHidden && hasCustomDropdown) {
        // Custom-dropdown.js is handling this, so we don't need the overlay
        // The custom dropdown will handle both collapsed and expanded states
        console.log('[DEBUG] Custom-dropdown.js is handling rules-filter-dropdown, skipping custom display overlay');
        return;
      }
      
      // Check if custom display already exists to prevent duplicates
      let customDisplay = wrapper.querySelector('.rules-filter-dropdown-custom-display');
      if (customDisplay) {
        // Update existing display
        updateDropdownDisplay();
        return;
      }
      
      // Create custom display element
      customDisplay = document.createElement('div');
      customDisplay.className = 'rules-filter-dropdown-custom-display';
      customDisplay.setAttribute('aria-hidden', 'true');
      
      // CRITICAL: Ensure custom display is visible and properly styled
      customDisplay.style.cssText = `
        position: absolute !important;
        top: 0 !important;
        left: 0 !important;
        right: 2.5rem !important;
        height: 100% !important;
        display: flex !important;
        align-items: center !important;
        padding: 0.75rem 1rem !important;
        pointer-events: none !important;
        z-index: 1 !important;
        font-family: "Archivo", sans-serif !important;
        font-size: 0.9rem !important;
        line-height: 1.5 !important;
        box-sizing: border-box !important;
        background: transparent !important;
        overflow: hidden !important;
      `;
      
      // Insert custom display inside wrapper, after select (positioned absolutely to overlay)
      wrapper.appendChild(customDisplay);
      
      // CRITICAL: Ensure custom display doesn't block clicks - set pointer-events via JS as well
      customDisplay.style.pointerEvents = 'none';
      customDisplay.style.setProperty('pointer-events', 'none', 'important');
      
      // CRITICAL: Ensure all children of custom display also don't block clicks
      const observer = new MutationObserver(() => {
        const children = customDisplay.querySelectorAll('*');
        children.forEach(child => {
          child.style.setProperty('pointer-events', 'none', 'important');
        });
      });
      observer.observe(customDisplay, { childList: true, subtree: true });
      
      // Update display initially
      updateDropdownDisplay();
      
      // Update display on change (separate listener to avoid conflicts)
      const changeHandler = () => {
        updateDropdownDisplay();
      };
      dropdown.addEventListener('change', changeHandler);
      
      // CRITICAL: Ensure select element can receive clicks - make sure it's above custom display
      dropdown.style.setProperty('z-index', '2', 'important');
      dropdown.style.setProperty('position', 'relative', 'important');
      dropdown.style.setProperty('pointer-events', 'auto', 'important');
      
      // Update display when dropdown opens/closes (for visual feedback)
      dropdown.addEventListener('focus', () => {
        customDisplay.classList.add('focused');
        // Hide custom display when dropdown is open (native options should be visible)
        customDisplay.style.setProperty('opacity', '0', 'important');
        customDisplay.style.setProperty('visibility', 'hidden', 'important');
      });
      dropdown.addEventListener('blur', () => {
        customDisplay.classList.remove('focused');
        // Show custom display when dropdown closes (collapsed state)
        customDisplay.style.setProperty('opacity', '1', 'important');
        customDisplay.style.setProperty('visibility', 'visible', 'important');
        // CRITICAL: Update display on blur to ensure correct selection is shown when collapsed
        updateDropdownDisplay();
      });
    }
    
    // Function to update the custom display with correct colors and symbols
    function updateDropdownDisplay() {
      const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
      if (!wrapper) return;
      
      const customDisplay = wrapper.querySelector('.rules-filter-dropdown-custom-display');
      if (!customDisplay) return;
      
      const selectedOption = dropdown.options[dropdown.selectedIndex];
      if (!selectedOption) return;
      
      const ruleType = selectedOption.value;
      const optionText = selectedOption.textContent.trim();
      
      // CRITICAL: Use centralized color and SVG icon definitions for consistency
      const RULE_TYPE_COLORS = window.RULE_TYPE_COLORS || {
        'never-combine': '#ff0000',
        'always-combine': '#00b894',
        'conditional-restriction': '#fdcb6e',
        'always-above': '#006cff',
        'always-below': '#ff6600',
        'immediately-above': '#9000ff',
        'immediately-below': '#ffe400',
      };
      
      let color = RULE_TYPE_COLORS[ruleType] || '#ffffff';
      let symbol = '';
      
      // CRITICAL: Use centralized SVG icon definitions
      if (window.RULE_TYPE_SVG_ICONS && window.RULE_TYPE_SVG_ICONS[ruleType]) {
        // Get the SVG from centralized definitions and add inline styles for dropdown display
        const svgIcon = window.RULE_TYPE_SVG_ICONS[ruleType](color);
        // Add inline styles for proper display in dropdown
        symbol = svgIcon.replace('<svg', `<svg style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"`);
      } else {
        // Fallback to inline definitions if global not available
      if (ruleType === 'never-combine') {
        symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-never-icon" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
      } else if (ruleType === 'always-combine') {
        symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-always-icon" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
      } else if (ruleType === 'always-above') {
        symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-above-icon" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
      } else if (ruleType === 'always-below') {
        symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-below-icon" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"><polyline points="17 11 12 16 7 11"></polyline><polyline points="17 4 12 9 7 4"></polyline></svg>`;
      } else if (ruleType === 'immediately-above') {
        symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-above-icon" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"><polyline points="17 11 12 6 7 11"></polyline></svg>`;
      } else if (ruleType === 'immediately-below') {
        symbol = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-below-icon" style="width: 16px; height: 16px; display: inline-block; vertical-align: middle; margin-right: 6px;"><polyline points="7 13 12 18 17 13"></polyline></svg>`;
        }
      }
      
      // Update custom display content
      // For "All Rule Types" (empty value), don't show symbol
      if (ruleType === '') {
        customDisplay.innerHTML = `<span style="color: #ffffff !important;">All Rule Types</span>`;
        customDisplay.style.color = '#ffffff';
        customDisplay.style.setProperty('color', '#ffffff', 'important');
      } else {
        customDisplay.innerHTML = symbol + `<span style="color: ${color} !important;">${optionText}</span>`;
      customDisplay.style.color = color;
        customDisplay.style.setProperty('color', color, 'important');
        // CRITICAL: Ensure SVG icon color is set correctly
        const svgIcon = customDisplay.querySelector('svg');
        if (svgIcon) {
          svgIcon.style.setProperty('stroke', color, 'important');
        }
      }
    }
    
    // CRITICAL: Ensure "All Rule Types" is selected by default FIRST (before setting up display)
    // Only set if not already set to avoid unnecessary updates
    if (dropdown && dropdown.options.length > 0 && dropdown.options[0].value === '') {
      if (dropdown.selectedIndex !== 0 || dropdown.value !== '') {
        dropdown.selectedIndex = 0;
        dropdown.value = '';
      }
    }
    
    // CRITICAL: Check if custom-dropdown.js should handle this dropdown
    // If it has custom-dropdown-convert class, let custom-dropdown.js handle it
    const shouldUseCustomDropdown = dropdown.classList.contains('custom-dropdown-convert');
    
    if (shouldUseCustomDropdown) {
      // Custom-dropdown.js will handle this, so we don't need the custom display overlay
      // CRITICAL: Remove any existing custom display overlay to prevent duplicates
      const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
      if (wrapper) {
        const existingCustomDisplay = wrapper.querySelector('.rules-filter-dropdown-custom-display');
        if (existingCustomDisplay) {
          console.log('[DEBUG] Removing custom display overlay - custom-dropdown.js will handle it');
          existingCustomDisplay.remove();
        }
      }
      
      // But we need to ensure custom-dropdown.js initializes it
      if (window.NFTApp && window.NFTApp.customDropdown && typeof window.NFTApp.customDropdown.init === 'function') {
        // Check if already converted
        const isAlreadyConverted = dropdown.customDropdown || (dropdown.nextElementSibling && dropdown.nextElementSibling.classList.contains('custom-dropdown'));
        
        if (!isAlreadyConverted) {
          // Initialize custom dropdown for this specific element
          console.log('[DEBUG] Initializing custom-dropdown.js for rules-filter-dropdown');
          // Call init which will find and convert all .custom-dropdown-convert elements
          window.NFTApp.customDropdown.init();
        } else {
          // Already converted, just update it
          if (window.NFTApp.customDropdown.updateDropdown) {
            window.NFTApp.customDropdown.updateDropdown(dropdown);
          }
        }
      }
    } else {
      // Setup custom display overlay (only if not using custom-dropdown.js)
      setupDropdownCustomDisplay();
      
      // CRITICAL: Function to ensure dropdown display is correct
      const ensureDropdownDisplay = () => {
        updateDropdownDisplay();
        // Also ensure the select text is transparent so custom display shows (only when not focused)
        if (dropdown && !dropdown.matches(':focus')) {
          dropdown.style.setProperty('color', 'transparent', 'important');
        }
        // Ensure custom display is visible when collapsed
        const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
        const customDisplay = wrapper ? wrapper.querySelector('.rules-filter-dropdown-custom-display') : null;
        if (customDisplay && !dropdown.matches(':focus')) {
          customDisplay.style.setProperty('opacity', '1', 'important');
          customDisplay.style.setProperty('visibility', 'visible', 'important');
        }
      };
      
      // CRITICAL: Force update display after setup to ensure it shows correctly with icon and color
      // Use multiple timeouts to ensure it updates even if DOM isn't ready
      setTimeout(ensureDropdownDisplay, 50);
      setTimeout(ensureDropdownDisplay, 150);
      setTimeout(ensureDropdownDisplay, 300);
      
      // CRITICAL: Also update on any focus/blur to ensure correct display
      // Only set up these handlers if using custom display overlay (not custom-dropdown.js)
      if (!dropdown.dataset.displayHandlerAdded) {
        dropdown.addEventListener('focus', () => {
          // Hide custom display when focused (dropdown is open)
          const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
          const customDisplay = wrapper ? wrapper.querySelector('.rules-filter-dropdown-custom-display') : null;
          if (customDisplay) {
            customDisplay.style.setProperty('opacity', '0', 'important');
            customDisplay.style.setProperty('visibility', 'hidden', 'important');
          }
          dropdown.style.setProperty('color', '#ffffff', 'important');
        });
        
        dropdown.addEventListener('blur', () => {
          // Show custom display when blurred (dropdown is closed)
          setTimeout(() => {
            if (typeof ensureDropdownDisplay === 'function') {
              ensureDropdownDisplay();
            }
          }, 100); // Small delay to ensure selection is updated
        });
        
        dropdown.dataset.displayHandlerAdded = 'true';
      }
      
      // CRITICAL: Mark setup as complete to prevent re-initialization
      window._rulesFilterSetupComplete = true;
    }
    
    // Dropdown change functionality
    if (!dropdown.dataset.listenerAdded) {
      dropdown.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // console.log('[DEBUG] Rules filter dropdown changed to:', e.target.value);
        filterRules(e.target.value);
        
        // CRITICAL: Update custom display immediately when selection changes
        updateDropdownDisplay();
        
        // CRITICAL: Ensure custom display is visible when collapsed (after change)
        const wrapper = dropdown.closest('.rules-filter-dropdown-wrapper');
        const customDisplay = wrapper ? wrapper.querySelector('.rules-filter-dropdown-custom-display') : null;
        if (customDisplay) {
          customDisplay.style.setProperty('opacity', '1', 'important');
          customDisplay.style.setProperty('visibility', 'visible', 'important');
        }
        
        // CRITICAL: Ensure select text is transparent so custom display shows
        if (!dropdown.matches(':focus')) {
          dropdown.style.setProperty('color', 'transparent', 'important');
        }
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          const filterText = e.target.value ? `Filtered by ${e.target.value}` : 'Showing all rules';
          window.NFTApp.getModule('notificationService').show(filterText, 'info');
        }
      }, { capture: true });
      dropdown.dataset.listenerAdded = 'true';
      // console.log('[DEBUG] Dropdown event listener added');
    }
    
    // Jump to layers button functionality (inside filter container)
    if (!jumpBtn.dataset.listenerAdded) {
      jumpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        // console.log('[DEBUG] Jump to layers button clicked (from filter container)');
        
        // Find the traits section
        const traitsSection = document.querySelector('#traits-rules .traits-section');
        if (traitsSection) {
          // console.log('[DEBUG] Traits section found, scrolling...');
          
          // Get the traits-rules tab-content container (the actual scrolling container)
          const traitsRulesTab = document.getElementById('traits-rules');
          if (traitsRulesTab) {
            // Calculate position relative to the scrolling container
            const containerRect = traitsRulesTab.getBoundingClientRect();
            const targetRect = traitsSection.getBoundingClientRect();
            
            // Calculate scroll position: target position relative to container + current scroll position
            const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100;
            
            // Scroll the container instead of using scrollIntoView
            traitsRulesTab.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          } else {
            // Fallback to scrollIntoView if container not found
            traitsSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
          
          // Add a subtle highlight effect
          traitsSection.style.transition = 'box-shadow 0.3s ease';
          traitsSection.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.5)';
          
          // Remove the highlight after 2 seconds
          setTimeout(() => {
            traitsSection.style.boxShadow = '';
          }, 2000);
          
          // Show notification
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Trait Layers', 'info');
          }
        } else {
          // console.warn('[DEBUG] Traits section not found');
        }
      }, { capture: true });
      jumpBtn.dataset.listenerAdded = 'true';
      // console.log('[DEBUG] Jump to layers button event listener added');
    }
    
    // console.log('[DEBUG] Rules filter setup complete');
  }

  // Update rules filter visibility based on rule count
  function updateRulesFilterVisibility() {
    // console.log('[DEBUG] updateRulesFilterVisibility called');
    
    // Try multiple ways to get project data
    let projectData = null;
    
    if (window.NFTApp?.getModule('generateNftsUI')?.projectData) {
      projectData = window.NFTApp.getModule('generateNftsUI').projectData;
    } else if (window.currentProject) {
      projectData = window.currentProject;
    } else if (window.NFTApp?.getModule('traitLayers')?.projectData) {
      projectData = window.NFTApp.getModule('traitLayers').projectData;
    } else if (window.NFTApp?.getModule('combinationRules')?.projectData) {
      projectData = window.NFTApp.getModule('combinationRules').projectData;
    } else if (window.NFTApp?.getModule('projectInterface')?.projectData) {
      projectData = window.NFTApp.getModule('projectInterface').projectData;
    }
    
    if (!projectData) {
      // console.log('[DEBUG] No project data available for rules filter visibility check');
      hideRulesFilter();
      return;
    }
    
    const rulesCount = projectData.rules ? projectData.rules.length : 0;
    const traitsCount = projectData.traits ? projectData.traits.length : 0;
    
    // Show filter container if there are 5+ rules OR 5+ traits
    // (same condition as updateButtonVisibility for consistency)
    const shouldShowFilter = rulesCount >= 5 || traitsCount >= 5;
    
    // console.log('[DEBUG] Rules filter visibility check:', {
    //   rulesCount,
    //   traitsCount,
    //   shouldShowFilter
    // });
    
    const filterContainer = document.getElementById('combination-rules-filter-container');
    if (filterContainer) {
      filterContainer.style.display = shouldShowFilter ? 'flex' : 'none';
      // console.log(`[DEBUG] Rules filter visibility: ${shouldShowFilter ? 'visible' : 'hidden'}`);
      
      // Show/hide individual elements within the filter container
      const clearBtn = document.getElementById('clear-rules-filter-btn');
      const dropdown = document.getElementById('rules-filter-dropdown');
      const jumpBtn = document.getElementById('jump-to-layers-btn');
      
      // Show filter elements only if there are rules to filter
      if (clearBtn) {
        clearBtn.style.display = rulesCount >= 5 ? 'flex' : 'none';
      }
      if (dropdown) {
        dropdown.style.display = rulesCount >= 5 ? 'block' : 'none';
      }
      
      // Show jump-to-layers-btn using the same conditions as other jump buttons
      // Should show if there are 5+ traits OR 5+ rules (same as updateButtonVisibility)
      // CRITICAL: jump-to-layers-btn is in combination-rules-buttons-container, not filter container
      // This code handles the button if it's in the filter container (legacy)
      if (jumpBtn && jumpBtn.closest('#combination-rules-filter-container')) {
        const shouldShow = rulesCount >= 5 || traitsCount >= 5;
        // CRITICAL: Use visibility instead of display to keep space when hidden
        jumpBtn.style.setProperty('display', 'flex', 'important');
        jumpBtn.style.setProperty('visibility', shouldShow ? 'visible' : 'hidden', 'important');
        jumpBtn.style.setProperty('opacity', shouldShow ? '1' : '0', 'important');
        // console.log(`[DEBUG] Jump-to-layers-btn visibility: ${shouldShow ? 'visible' : 'hidden'} (traits count: ${traitsCount}, rules count: ${rulesCount})`);
        
        // CRITICAL: Ensure parent container is visible
        const parentContainer = jumpBtn.closest('.jump-to-layers-container');
        if (parentContainer) {
          parentContainer.style.setProperty('display', 'flex', 'important');
          parentContainer.style.setProperty('visibility', 'visible', 'important');
          parentContainer.style.setProperty('opacity', '1', 'important');
        }
      }
    } else {
      // console.log('[DEBUG] Rules filter container not found');
    }
  }

  // Force native scrollbar for traits-rules tab
  function forceNativeScrollbar() {
    const traitsRulesTab = document.getElementById('traits-rules');
    if (traitsRulesTab) {
      // Reset any custom scrollbar styles
      traitsRulesTab.style.scrollbarWidth = 'auto';
      traitsRulesTab.style.msOverflowStyle = 'scrollbar';
      
      // Hide ALL custom webkit scrollbars with maximum specificity
      const style = document.createElement('style');
      style.textContent = `
        /* ULTIMATE SOLUTION: Hide ALL custom scrollbars for traits-rules tab */
        html body #app .project-interface .content-area #traits-rules.tab-content::-webkit-scrollbar,
        html body #app .project-interface .content-area #traits-rules.tab-content.active::-webkit-scrollbar,
        #traits-rules.tab-content::-webkit-scrollbar,
        #traits-rules.tab-content.active::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        /* Hide ALL custom webkit scrollbars for ALL elements inside traits-rules tab */
        html body #app .project-interface .content-area #traits-rules.tab-content *::-webkit-scrollbar,
        html body #app .project-interface .content-area #traits-rules.tab-content.active *::-webkit-scrollbar,
        #traits-rules.tab-content *::-webkit-scrollbar,
        #traits-rules.tab-content.active *::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
      style.id = 'traits-rules-native-scrollbar';
      
      // Remove existing style if it exists
      const existingStyle = document.getElementById('traits-rules-native-scrollbar');
      if (existingStyle) {
        existingStyle.remove();
      }
      
      document.head.appendChild(style);
      
      // console.log('[DEBUG] Applied native scrollbar fix to traits-rules tab - hiding all custom scrollbars');
    }
  }

  // CRITICAL FIX: Update rules section visibility based on trait layers count
  // ONCE minimum conditions are met, the section stays visible FOREVER (never hidden again)
  function updateRulesSectionVisibility() {
    // console.log('[DEBUG] updateRulesSectionVisibility called');
    
    const rulesSection = document.querySelector('.rules-section');
    if (!rulesSection) {
      // console.warn('[DEBUG] Rules section not found');
      return;
    }
    
    // CRITICAL: Check if project is currently loading - if so, don't hide the section to prevent flicker
    const projectService = window.NFTApp?.getModule('projectService');
    const isLoading = projectService?.isLoading === true || (projectService?._projectWasLoaded === false && projectService?.isLoading !== false);
    
    // CRITICAL: Also check if interface is being swapped (happens at 80% progress)
    const appContainer = document.getElementById('app');
    const isSwappingInterface = appContainer?.dataset.swappingInterface === 'true';
    
    if (isLoading || isSwappingInterface) {
      // During project load or interface swap, ensure section stays visible to prevent flicker
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      return; // Early return during loading/swap to prevent flicker
    }
    
    // CRITICAL: Check if section has ever been visible (minimum conditions met)
    // Once this flag is set, the section will NEVER be hidden again
    const hasEverBeenVisible = rulesSection.dataset.hasEverBeenVisible === 'true';
    
    // CRITICAL: Get project data FIRST before checking hasEverBeenVisible
    // This ensures we can properly evaluate conditions on project load
    let projectData = null;
    
    // CRITICAL: Always prefer window.currentProject first as it's the most up-to-date source
    // This ensures we get newly added rules immediately
    if (window.currentProject) {
      projectData = window.currentProject;
      // console.log('[DEBUG] Using window.currentProject for rules visibility check (has', projectData.rules?.length || 0, 'rules)');
    } else if (window.NFTApp?.getModule('combinationRules')?.projectData) {
      projectData = window.NFTApp.getModule('combinationRules').projectData;
      // console.log('[DEBUG] Using combinationRules module projectData for rules visibility check');
    } else if (window.NFTApp?.getModule('generateNftsUI')?.projectData) {
      projectData = window.NFTApp.getModule('generateNftsUI').projectData;
    } else if (window.NFTApp?.getModule('traitLayers')?.projectData) {
      projectData = window.NFTApp.getModule('traitLayers').projectData;
    } else if (window.NFTApp?.getModule('projectInterface')?.projectData) {
      projectData = window.NFTApp.getModule('projectInterface').projectData;
    }
    
    // If section has ever been visible AND we have project data, ALWAYS show it and return immediately
    // This ensures once minimum conditions are met, it stays visible forever
    // BUT: On project load, we still need to check conditions first to set the flag
    if (hasEverBeenVisible && projectData && projectData.traits && Array.isArray(projectData.traits) && projectData.traits.length > 0) {
      // console.log('[DEBUG] Rules section has ever been visible - ALWAYS showing (never hiding again)');
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('flex-direction', 'column', 'important');
      rulesSection.style.setProperty('align-items', 'flex-start', 'important');
      const combinationRulesContainer = document.getElementById('combination-rules-container');
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'block', 'important');
        combinationRulesContainer.style.setProperty('visibility', 'visible', 'important');
        combinationRulesContainer.style.setProperty('opacity', '1', 'important');
      }
      return; // Early return - never check conditions again once visible
    }
    
    // If we don't have project data yet, try to get it
    if (!projectData) {
      // CRITICAL: Try multiple ways to get project data, prioritizing the most up-to-date source
      // Priority: 1) window.currentProject (most up-to-date), 2) combinationRules module, 3) other modules
      if (window.currentProject) {
        projectData = window.currentProject;
        // console.log('[DEBUG] Using window.currentProject for rules visibility check (has', projectData.rules?.length || 0, 'rules)');
      } else if (window.NFTApp?.getModule('combinationRules')?.projectData) {
        projectData = window.NFTApp.getModule('combinationRules').projectData;
        // console.log('[DEBUG] Using combinationRules module projectData for rules visibility check');
      } else if (window.NFTApp?.getModule('generateNftsUI')?.projectData) {
        projectData = window.NFTApp.getModule('generateNftsUI').projectData;
      } else if (window.NFTApp?.getModule('traitLayers')?.projectData) {
        projectData = window.NFTApp.getModule('traitLayers').projectData;
      } else if (window.NFTApp?.getModule('projectInterface')?.projectData) {
        projectData = window.NFTApp.getModule('projectInterface').projectData;
      }
    }
    
    if (!projectData) {
      // console.log('[DEBUG] No project data available for rules section visibility check');
      return;
    }
    
    // CRITICAL: Check if rules section is currently being updated - if so, don't hide it
    const isUpdatingRules = rulesSection.dataset.updatingRules === 'true';
    if (isUpdatingRules) {
      // console.log('[DEBUG] Rules section is being updated - forcing visibility');
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      return; // Early return - don't hide while updating
    }
    
    // CRITICAL: Check if rules exist first - if so, always show the section
    // This prevents the section from being hidden when rules exist, even if other conditions aren't met
    // Check both projectData and DOM as a safeguard against stale data
    const hasRulesInProjectData = projectData.rules && Array.isArray(projectData.rules) && projectData.rules.length > 0;
    
    // CRITICAL: Also check the DOM for existing rules as a final safeguard
    // This prevents hiding the section if rules exist in the DOM but projectData is stale
    const rulesContainer = document.getElementById('combination-rules-container');
    const existingRulesInDOM = rulesContainer ? rulesContainer.querySelectorAll('.rule-item, [data-rule-id]').length : 0;
    const hasRulesInDOM = existingRulesInDOM > 0;
    
    const hasRules = hasRulesInProjectData || hasRulesInDOM;
    
    // CRITICAL: If rules exist (in projectData OR DOM), ALWAYS show the section immediately and return early
    // This is the most important check - never hide if rules exist
    if (hasRules) {
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('flex-direction', 'column', 'important');
      rulesSection.style.setProperty('align-items', 'flex-start', 'important');
      // console.log('[DEBUG] Rules exist - showing rules section (projectData:', hasRulesInProjectData ? projectData.rules.length : 0, 'DOM:', existingRulesInDOM, ')');
      return; // Early return - NEVER hide if rules exist
    }
    
    // CRITICAL: Final DOM check before hiding (in case rules were just added)
    // This is a final safeguard against race conditions
    const finalDOMCheck = rulesContainer ? rulesContainer.querySelectorAll('.rule-item, [data-rule-id]').length : 0;
    if (finalDOMCheck > 0) {
      // console.log('[DEBUG] Final DOM check found', finalDOMCheck, 'rules - showing section');
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('flex-direction', 'column', 'important');
      rulesSection.style.setProperty('align-items', 'flex-start', 'important');
      return; // Early return - NEVER hide if DOM has rules
    }
    
    // Check if projectData has traits array
    // Only check this if there are no rules
    if (!projectData.traits || !Array.isArray(projectData.traits)) {
      // Hide the rules section only if there are no rules
      rulesSection.style.setProperty('display', 'none', 'important');
      // console.log('[DEBUG] Rules section is now hidden - no traits array and no rules');
      return;
    }
    
    // Check conditions:
    // 1. At least 1 trait layer exists
    // 2. Each trait layer has at least one trait loaded
    const traitLayersCount = projectData.traits.length;
    const hasAtLeastOneLayer = traitLayersCount >= 1;
    const allLayersHaveTraits = projectData.traits.every(layer => 
      layer && layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0
    );
    
    const shouldShow = hasAtLeastOneLayer && allLayersHaveTraits;
    
    // CRITICAL: Also check if there are existing rules - if so, always show the section
    // Note: hasRules was already declared above at line 1683
    // If we reach this point, hasRules should be false (otherwise we would have returned early)
    // But we check again to be safe in case projectData was updated between the early return check and here
    // Re-check rules (can't redeclare const, so we check the condition again)
    const hasRulesNow = projectData.rules && Array.isArray(projectData.rules) && projectData.rules.length > 0;
    const shouldShowWithRules = shouldShow || hasRulesNow;
    
    // console.log('[DEBUG] Rules section visibility check:', {
    //   traitLayersCount,
    //   hasAtLeastOneLayer,
    //   allLayersHaveTraits,
    //   shouldShow,
    //   hasRules,
    //   shouldShowWithRules
    // });
    
    if (shouldShowWithRules) {
      // Show the rules section
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('flex-direction', 'column', 'important');
      rulesSection.style.setProperty('align-items', 'flex-start', 'important');
      
      // CRITICAL: Mark that section has ever been visible - this means it will NEVER be hidden again
      // Set this flag ONCE when minimum conditions are first met
      if (!hasEverBeenVisible) {
        rulesSection.dataset.hasEverBeenVisible = 'true';
        // console.log('[DEBUG] Rules section minimum conditions met - marking as permanently visible (will never hide again)');
      }
      // console.log('[DEBUG] Rules section is now visible');
      
      // CRITICAL: Ensure bottom buttons are visible when rules section is shown
      setTimeout(() => {
        const combinationRulesContainer = rulesSection.querySelector('.combination-rules-container');
        const bottomButtons = combinationRulesContainer?.querySelector('.bottom-shortcut-buttons');
        if (bottomButtons) {
          bottomButtons.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 1557px !important;
            max-width: 1557px !important;
            min-width: 1557px !important;
            z-index: 100 !important;
            justify-content: flex-end !important;
            align-items: center !important;
            gap: 10px !important;
            row-gap: 10px !important;
            column-gap: 10px !important;
            padding: 1rem !important;
            padding-left: 0 !important;
            padding-right: 1rem !important;
            margin: 0 !important;
            border-top: 1px solid var(--border-color) !important;
            background: transparent !important;
            pointer-events: auto !important;
            box-sizing: border-box !important;
            text-align: right !important;
          `;
          console.log('[DEBUG] Bottom buttons forced visible in updateRulesSectionVisibility');
        }
      }, 100);
    } else {
      // CRITICAL: Only hide if section has NEVER been visible (minimum conditions never met)
      // If it has ever been visible, NEVER hide it again
      if (!hasEverBeenVisible) {
      // Hide the rules section
      rulesSection.style.setProperty('display', 'none', 'important');
      if (!hasAtLeastOneLayer) {
          // console.log('[DEBUG] Rules section is now hidden - need at least 1 trait layer (has never been visible)');
      } else {
          // console.log('[DEBUG] Rules section is now hidden - each layer needs at least one trait loaded (has never been visible)');
        }
      } else {
        // Section has been visible before - keep it visible even if conditions aren't met
        rulesSection.style.setProperty('display', 'flex', 'important');
        rulesSection.style.setProperty('visibility', 'visible', 'important');
        rulesSection.style.setProperty('opacity', '1', 'important');
      }
    }
  }

  // Filter rules by type
  function filterRules(ruleType) {
    console.log('[DEBUG] Filtering rules by type:', ruleType);
    
    const rulesContainer = document.getElementById('combination-rules-container');
    if (!rulesContainer) {
      console.log('[DEBUG] Rules container not found');
      return;
    }
    
    // CRITICAL: Ensure rules container doesn't affect Trait Layers section positioning
    // Use position: relative and ensure it doesn't cause layout shifts
    rulesContainer.style.setProperty('position', 'relative', 'important');
    rulesContainer.style.setProperty('min-height', '0', 'important');
    rulesContainer.style.setProperty('height', 'auto', 'important');
    
    // Look for all possible rule element selectors
    const ruleElements = rulesContainer.querySelectorAll('.rule-item, .combination-rule-item, .combination-rule, [data-rule-id]');
    
    if (!ruleType || ruleType === 'all' || ruleType === '') {
      // Show all rules - CRITICAL: Reset ALL style properties that might have been set during filtering
      ruleElements.forEach(element => {
        // Reset all properties that were set during filtering
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
        element.style.removeProperty('position');
        element.style.removeProperty('height');
        element.style.removeProperty('overflow');
        // Ensure element is visible by removing inline styles that might hide it
        // CSS will handle the default display/visibility
      });
      console.log('[DEBUG] Showing all rules');
    } else {
      // Filter by rule type
      // CRITICAL: First reset all elements to ensure clean state before filtering
      ruleElements.forEach(element => {
        // Reset all properties that might have been set during previous filtering
        element.style.removeProperty('display');
        element.style.removeProperty('visibility');
        element.style.removeProperty('position');
        element.style.removeProperty('height');
        element.style.removeProperty('overflow');
      });
      
      let visibleCount = 0;
      ruleElements.forEach(element => {
        // CRITICAL: Only check data-rule-type attribute (rule items don't have classes matching rule type directly)
        const ruleTypeAttr = element.getAttribute('data-rule-type');
        
        if (ruleTypeAttr === ruleType) {
          // Show matching rule - ensure all display properties are reset
          element.style.removeProperty('display');
          element.style.removeProperty('visibility');
          element.style.removeProperty('position');
          element.style.removeProperty('height');
          element.style.removeProperty('overflow');
          visibleCount++;
        } else {
          // Hide non-matching rule - CRITICAL: Use display: none but ensure it doesn't affect layout
          element.style.display = 'none';
          element.style.visibility = 'hidden';
          element.style.position = 'absolute';
          element.style.height = '0';
          element.style.overflow = 'hidden';
        }
      });
      console.log(`[DEBUG] Showing ${visibleCount} rules of type: ${ruleType}`);
    }
    
    // CRITICAL: Ensure Trait Layers section remains fixed and unaffected
    const traitsSection = document.querySelector('#traits-rules .traits-section');
    if (traitsSection) {
      // Force traits section to maintain its position - prevent any layout shifts
      traitsSection.style.setProperty('position', 'relative', 'important');
      traitsSection.style.setProperty('top', 'auto', 'important');
      traitsSection.style.setProperty('left', 'auto', 'important');
      traitsSection.style.setProperty('transform', 'none', 'important');
      traitsSection.style.setProperty('margin-top', '0', 'important');
      traitsSection.style.setProperty('margin-bottom', '0', 'important');
      traitsSection.style.setProperty('margin-left', 'auto', 'important');
      traitsSection.style.setProperty('margin-right', 'auto', 'important');
      // CRITICAL: Ensure traits section doesn't participate in flex layout that might shift it
      traitsSection.style.setProperty('flex-shrink', '0', 'important');
      traitsSection.style.setProperty('flex-grow', '0', 'important');
      traitsSection.style.setProperty('align-self', 'auto', 'important');
    }
    
    // CRITICAL: Ensure rules section doesn't affect traits section position
    const rulesSection = document.querySelector('#traits-rules .rules-section');
    if (rulesSection) {
      // Ensure rules section is isolated and doesn't affect parent layout
      rulesSection.style.setProperty('position', 'relative', 'important');
      rulesSection.style.setProperty('margin-top', '0', 'important');
      rulesSection.style.setProperty('flex-shrink', '1', 'important');
      rulesSection.style.setProperty('flex-grow', '0', 'important');
    }
  }

  // Wait for NFTApp to be available
  function waitForNFTApp() {
    // Prevent multiple NFTApp setups
    if (window.nftAppSetupCompleted) {
      console.log('[DEBUG] NFTApp setup already completed, skipping');
      return;
    }
    
    if (window.NFTApp && window.NFTApp.getModule) {
      window.nftAppSetupCompleted = true;
      console.log('[DEBUG] NFTApp is available, setting up hooks');
      
      // Setup hooks that don't depend on specific modules
      hookIntoUpdateRulesUI();
      hookIntoSetup();
      hookIntoTraitLayers();
      hookIntoProjectLoading();
      
      // Try to hook into navigation with error handling
      setTimeout(() => {
        try {
          hookIntoNavigation();
        } catch (error) {
          console.log('[DEBUG] Navigation hook failed, using fallback:', error);
          setupFallbackTabDetection();
        }
      }, 500);
      
    } else {
      console.log('[DEBUG] NFTApp not available yet, retrying...');
      setTimeout(waitForNFTApp, 100);
    }
  }

  // Hook into project loading
  function hookIntoProjectLoading() {
    // Hook into projectInterface.start
    const projectInterfaceModule = window.NFTApp?.getModule('projectInterface');
    if (projectInterfaceModule && typeof projectInterfaceModule.start === 'function') {
      const originalStart = projectInterfaceModule.start;
      projectInterfaceModule.start = function(projectData) {
        const result = originalStart.call(this, projectData);
        // CRITICAL: Use requestAnimationFrame instead of setTimeout to prevent content disappearing
        // This ensures updates happen immediately after render, not after a delay
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            updateButtonVisibility();
            updateRulesFilterVisibility();
            // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
            forceNativeScrollbar();
          });
        });
        return result;
      };
    }

    // Hook into projectService.startNew
    const projectServiceModule = window.NFTApp?.getModule('projectService');
    if (projectServiceModule && typeof projectServiceModule.startNew === 'function') {
      const originalStartNew = projectServiceModule.startNew;
      projectServiceModule.startNew = function() {
        const result = originalStartNew.call(this);
        // CRITICAL: Use requestAnimationFrame instead of setTimeout to prevent content disappearing
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            updateButtonVisibility();
            updateRulesFilterVisibility();
            // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
            forceNativeScrollbar();
          });
        });
        return result;
      };
    }

    // Hook into MemoryManager.updateProject
    if (window.MemoryManager) {
      const originalUpdateProject = window.MemoryManager.updateProject;
      if (originalUpdateProject) {
        window.MemoryManager.updateProject = function(updates, options = {}) {
          const result = originalUpdateProject.call(this, updates, options);
          setTimeout(() => {
            updateButtonVisibility();
            updateRulesFilterVisibility();
            // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
            forceNativeScrollbar();
          }, 500);
          return result;
        };
      }
    }

    // CRITICAL: Hook into projectService.load to ensure button visibility is updated when project is loaded
    if (projectServiceModule && typeof projectServiceModule.load === 'function') {
      const originalLoad = projectServiceModule.load;
      projectServiceModule.load = function(event) {
        const result = originalLoad.call(this, event);
        // CRITICAL: Ensure tab-content stays visible during loading
        const activeTabContent = document.querySelector('.tab-content.active');
        if (activeTabContent) {
          activeTabContent.style.setProperty("display", "block", "important");
          activeTabContent.style.setProperty("visibility", "visible", "important");
          activeTabContent.style.setProperty("opacity", "1", "important");
        }
        // CRITICAL: Use requestAnimationFrame instead of setTimeout to prevent content disappearing
        // Update immediately, then check again after render
        requestAnimationFrame(() => {
          updateButtonVisibility();
          updateRulesFilterVisibility();
            // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
          forceNativeScrollbar();
          // Ensure tab-content remains visible
          if (activeTabContent) {
            activeTabContent.style.setProperty("display", "block", "important");
            activeTabContent.style.setProperty("visibility", "visible", "important");
            activeTabContent.style.setProperty("opacity", "1", "important");
          }
          // Additional check after next frame
          requestAnimationFrame(() => {
            updateButtonVisibility();
            updateRulesFilterVisibility();
            // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
            forceNativeScrollbar();
          });
        });
        return result;
      };
    }
  }

  // Comprehensive setup function
  function performCompleteSetup() {
    // console.log('[DEBUG] Performing complete setup...');
    
    // CRITICAL: Hide all jump buttons by default before checking conditions
    hideAllButtons();
    
    // Setup all buttons and filters
    setupJumpToRulesButton();
    setupJumpToLayersButton();
    setupBottomButtons();
    setupRulesFilter();
    
    // Update visibility (will show buttons if conditions are met)
    updateButtonVisibility();
    updateRulesFilterVisibility();
    // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
    
    // Force setup of jump-to-layers-btn if it's in the filter container
    const jumpBtn = document.getElementById('jump-to-layers-btn');
    if (jumpBtn && !jumpBtn.dataset.listenerAdded) {
      console.log('[DEBUG] Setting up jump-to-layers-btn from filter container');
      jumpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Jump to layers button clicked');
        
        const traitsSection = document.querySelector('#traits-rules .traits-section');
        if (traitsSection) {
          // Get the traits-rules tab-content container (the actual scrolling container)
          const traitsRulesTab = document.getElementById('traits-rules');
          if (traitsRulesTab) {
            // Calculate position relative to the scrolling container
            const containerRect = traitsRulesTab.getBoundingClientRect();
            const targetRect = traitsSection.getBoundingClientRect();
            
            // Calculate scroll position: target position relative to container + current scroll position
            const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100;
            
            // Scroll the container instead of using scrollIntoView
            traitsRulesTab.scrollTo({
              top: scrollPosition,
              behavior: 'smooth'
            });
          } else {
            // Fallback to scrollIntoView if container not found
            traitsSection.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
            });
          }
          
          traitsSection.style.transition = 'box-shadow 0.3s ease';
          traitsSection.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.5)';
          
          setTimeout(() => {
            traitsSection.style.boxShadow = '';
          }, 2000);
          
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Trait Layers', 'info');
          }
        }
      }, { capture: true });
      jumpBtn.dataset.listenerAdded = 'true';
    }
    
    // console.log('[DEBUG] Complete setup finished');
  }

  // Setup the button when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    if (setupCompleted) {
      console.log('[DEBUG] Setup already completed, skipping...');
      return;
    }
    
    // CRITICAL: Hide all jump buttons by default on startup
    hideAllButtons();
    
    // Multiple attempts to ensure setup works
    setTimeout(performCompleteSetup, 100);
    setTimeout(performCompleteSetup, 500);
    setTimeout(performCompleteSetup, 1000);
    setTimeout(performCompleteSetup, 2000);
    
    // Add periodic check for button visibility and setup
    setInterval(() => {
      updateButtonVisibility();
      updateRulesFilterVisibility();
      
      // Re-setup if elements are missing listeners
      const jumpBtn = document.getElementById('jump-to-layers-btn');
      const clearBtn = document.getElementById('clear-rules-filter-btn');
      const dropdown = document.getElementById('rules-filter-dropdown');
      
      if (jumpBtn && !jumpBtn.dataset.listenerAdded) {
        // console.log('[DEBUG] Re-setting up jump-to-layers-btn');
        performCompleteSetup();
      }
      if (clearBtn && !clearBtn.dataset.listenerAdded) {
        // console.log('[DEBUG] Re-setting up clear button');
        performCompleteSetup();
      }
      if (dropdown && !dropdown.dataset.listenerAdded) {
        // console.log('[DEBUG] Re-setting up dropdown');
        performCompleteSetup();
      }
    }, 3000);
    
    // Force visibility check when traits-rules tab is clicked
    const traitsRulesTab = document.querySelector('[data-tab="traits-rules"]');
    if (traitsRulesTab) {
      traitsRulesTab.addEventListener('click', () => {
        setTimeout(() => {
          console.log('[DEBUG] Traits-rules tab clicked, forcing complete setup');
          performCompleteSetup();
        }, 1000);
      });
    }
    
    // Add comprehensive error handling
    window.addEventListener('error', (e) => {
      if (e.message && (e.message.includes('jump-to') || e.message.includes('filter'))) {
        console.error('[DEBUG] Error related to shortcut buttons or filters:', e.message);
        setTimeout(performCompleteSetup, 1000);
      }
    });
    
    setupCompleted = true;
    console.log('[DEBUG] Initial setup completed');
  });

  // Also update visibility when the traits-rules tab becomes active
  document.addEventListener('click', (e) => {
    if (e.target && e.target.getAttribute('data-tab') === 'traits-rules') {
      setTimeout(() => {
        enforceTraitsRulesLayout();
        updateButtonVisibility();
        updateRulesFilterVisibility();
        // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
        // Once visible, the section stays visible until conditions are not met
      }, 100);
    }
  });

  // Also listen for tab changes via other methods
  document.addEventListener('click', (e) => {
    // Check if clicking on tab navigation
    if (e.target && e.target.classList.contains('nav-tab') && e.target.getAttribute('data-tab') === 'traits-rules') {
      setTimeout(() => {
        console.log('[DEBUG] Traits & Rules tab clicked, updating button visibility');
        updateButtonVisibility();
        updateRulesFilterVisibility();
        // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
        // Once visible, the section stays visible until conditions are not met
      }, 200);
    }
  });

  // Listen for any changes to the traits-rules tab content visibility
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const target = mutation.target;
        if (target.id === 'traits-rules' && target.classList.contains('active')) {
          setTimeout(() => {
            updateButtonVisibility();
            updateRulesFilterVisibility();
            // CRITICAL: Don't call updateRulesSectionVisibility here - it can cause flicker
            // The section should stay visible once hasEverBeenVisible is set
            // Only check visibility on project load and layer deletion
          }, 100);
        }
      }
    });
  });

  const traitsRulesTab = document.getElementById('traits-rules');
  if (traitsRulesTab) {
    observer.observe(traitsRulesTab, { attributes: true });
  }

  // Expose functions globally for debugging and manual setup
  window.debugShortcutButtons = {
    setup: performCompleteSetup,
    updateVisibility: () => {
      updateButtonVisibility();
      updateRulesFilterVisibility();
    },
    testButtons: () => {
      console.log('[DEBUG] Testing button functionality...');
      const jumpBtn = document.getElementById('jump-to-layers-btn');
      const clearBtn = document.getElementById('clear-rules-filter-btn');
      const dropdown = document.getElementById('rules-filter-dropdown');
      
      console.log('[DEBUG] Button states:', {
        jumpBtn: {
          exists: !!jumpBtn,
          hasListener: !!jumpBtn?.dataset.listenerAdded,
          display: jumpBtn?.style.display || 'default'
        },
        clearBtn: {
          exists: !!clearBtn,
          hasListener: !!clearBtn?.dataset.listenerAdded,
          display: clearBtn?.style.display || 'default'
        },
        dropdown: {
          exists: !!dropdown,
          hasListener: !!dropdown?.dataset.listenerAdded,
          display: dropdown?.style.display || 'default'
        }
      });
      
      // Test click events
      if (jumpBtn) {
        console.log('[DEBUG] Testing jump-to-layers-btn click...');
        jumpBtn.click();
      }
      if (clearBtn) {
        console.log('[DEBUG] Testing clear button click...');
        clearBtn.click();
      }
    }
  };

  // Start waiting for NFTApp
  waitForNFTApp();

  // Function to handle viewport changes (console open/close)
  function handleViewportChange() {
    const generateNftsTab = document.getElementById('generate-nfts');
    if (generateNftsTab && generateNftsTab.classList.contains('active')) {
      const viewportHeight = window.innerHeight;
      const availableHeight = viewportHeight - 110; // Account for header
      
      // Force a layout recalculation
      generateNftsTab.style.height = 'auto';
      generateNftsTab.offsetHeight; // Force reflow
      
      const contentHeight = generateNftsTab.scrollHeight;
      const clientHeight = generateNftsTab.clientHeight;
      
      console.log('[DEBUG] Viewport change detected:', {
        viewportHeight,
        availableHeight,
        contentHeight,
        clientHeight,
        needsScrolling: contentHeight > availableHeight,
        currentOverflow: generateNftsTab.style.overflowY || 'not set'
      });
      
      // CRITICAL: Never enable scrolling - always keep it disabled
      // The tab-scroll-control.js module handles scroll control, and we never want scrolling
      generateNftsTab.style.setProperty('overflow', 'hidden', 'important');
      generateNftsTab.style.setProperty('overflow-y', 'hidden', 'important');
      generateNftsTab.style.setProperty('overflow-x', 'hidden', 'important');
      generateNftsTab.style.setProperty('scrollbar-width', 'none', 'important');
      generateNftsTab.style.setProperty('-ms-overflow-style', 'none', 'important');
      
      // Set height constraints - REMOVED to allow CSS to control project-interface height
      // generateNftsTab.style.minHeight = 'calc(100vh - 110px)';
      // generateNftsTab.style.maxHeight = 'calc(100vh - 110px)';
      
      // Removed debug log to reduce console noise
      // console.log('[DEBUG] Enabled scrolling for Generate NFTs tab - viewport change detected');
    }
  }

  // Start waiting for NFTApp
  waitForNFTApp();

  // Setup console detection immediately (doesn't depend on NFTApp)
  setupConsoleDetection();

  // Function to setup console detection independently
  function setupConsoleDetection() {
    // Prevent multiple console detection setups
    if (window.consoleDetectionSetup) {
      console.log('[DEBUG] Console detection already setup, skipping');
      return;
    }
    window.consoleDetectionSetup = true;
    
    console.log('[DEBUG] Setting up console detection...');
    
    // Listen for viewport changes (console open/close)
    let viewportHeight = window.innerHeight;
    let isConsoleOpen = false;
    
    // Function to detect if console is open
    function detectConsoleState() {
      const currentHeight = window.innerHeight;
      const heightDiff = Math.abs(currentHeight - viewportHeight);
      
      // If height decreased significantly, console is likely open
      if (currentHeight < viewportHeight - 100) {
        isConsoleOpen = true;
        // console.log('[DEBUG] Console detected as OPEN - height decreased by', heightDiff);
      } else if (currentHeight > viewportHeight + 50) {
        isConsoleOpen = false;
        // console.log('[DEBUG] Console detected as CLOSED - height increased by', heightDiff);
      }
      
      viewportHeight = currentHeight;
      return isConsoleOpen;
    }
    
    // Function to force enable scrolling for Generate NFTs tab
    function forceEnableGenerateNftsScrolling() {
      const generateNftsTab = document.getElementById('generate-nfts');
      if (generateNftsTab) {
        // Add CSS class to enable scrolling
        generateNftsTab.classList.add('console-scroll-enabled');
        console.log('[DEBUG] Added console-scroll-enabled class to Generate NFTs tab');
        return true;
      }
      return false;
    }

    // Function to disable scrolling for Generate NFTs tab
    function disableGenerateNftsScrolling() {
      const generateNftsTab = document.getElementById('generate-nfts');
      if (generateNftsTab) {
        // Remove CSS class to disable scrolling
        generateNftsTab.classList.remove('console-scroll-enabled');
        console.log('[DEBUG] Removed console-scroll-enabled class from Generate NFTs tab');
        return true;
      }
      return false;
    }
    
    window.addEventListener('resize', () => {
      const consoleState = detectConsoleState();
      
      // Always handle viewport change when there's a significant change
      if (Math.abs(window.innerHeight - viewportHeight) > 50) {
        setTimeout(() => {
          // If console is open, force enable scrolling for Generate NFTs tab
          if (isConsoleOpen) {
            const generateNftsTab = document.getElementById('generate-nfts');
            if (generateNftsTab && generateNftsTab.classList.contains('active')) {
              forceEnableGenerateNftsScrolling();
              console.log('[DEBUG] Forced scrolling enabled due to console being open');
            }
          } else {
            // If console is closed, disable scrolling
            const generateNftsTab = document.getElementById('generate-nfts');
            if (generateNftsTab && generateNftsTab.classList.contains('active')) {
              disableGenerateNftsScrolling();
              console.log('[DEBUG] Scrolling disabled due to console being closed');
            }
          }
        }, 100);
      }
    });
    
    // Also add a periodic check to ensure scrolling is enabled when console is open
    setInterval(() => {
      if (isConsoleOpen) {
        const generateNftsTab = document.getElementById('generate-nfts');
        if (generateNftsTab && generateNftsTab.classList.contains('active')) {
          if (!generateNftsTab.classList.contains('console-scroll-enabled')) {
            forceEnableGenerateNftsScrolling();
            console.log('[DEBUG] Periodic check: Re-enabled scrolling for Generate NFTs tab');
          }
        }
      }
    }, 2000); // Check every 2 seconds
    
    console.log('[DEBUG] Console detection setup complete');
  }

  // Also listen for orientation changes
  window.addEventListener('orientationchange', () => {
    setTimeout(handleViewportChange, 200);
  });

  // Debug function for Generate NFTs tab viewport issues
  window.debugGenerateNftsViewport = function() {
    const generateNftsTab = document.getElementById('generate-nfts');
    if (!generateNftsTab) {
      console.log('[DEBUG] Generate NFTs tab not found');
      return;
    }
    
    const isActive = generateNftsTab.classList.contains('active');
    const computedStyle = window.getComputedStyle(generateNftsTab);
    const rect = generateNftsTab.getBoundingClientRect();
    
    console.log('[DEBUG] Generate NFTs tab viewport debug:', {
      isActive: isActive,
      viewportHeight: window.innerHeight,
      tabHeight: rect.height,
      tabMaxHeight: computedStyle.maxHeight,
      tabMinHeight: computedStyle.minHeight,
      tabOverflowY: computedStyle.overflowY,
      tabScrollHeight: generateNftsTab.scrollHeight,
      tabClientHeight: generateNftsTab.clientHeight,
      contentFits: generateNftsTab.scrollHeight <= generateNftsTab.clientHeight,
      rect: rect
    });
    
    if (isActive) {
      // Force height recalculation
      handleViewportChange();
      console.log('[DEBUG] Height recalculation triggered');
    }
  };

  // Debug function for Generate NFTs tab viewport issues
  window.debugGenerateNftsViewport = function() {
    const generateNftsTab = document.getElementById('generate-nfts');
    if (!generateNftsTab) {
      console.log('[DEBUG] Generate NFTs tab not found');
      return;
    }
    
    const isActive = generateNftsTab.classList.contains('active');
    const computedStyle = window.getComputedStyle(generateNftsTab);
    const rect = generateNftsTab.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - 110;
    const contentHeight = generateNftsTab.scrollHeight;
    
    console.log('[DEBUG] Generate NFTs tab viewport debug:', {
      isActive: isActive,
      viewportHeight: viewportHeight,
      availableHeight: availableHeight,
      tabHeight: rect.height,
      contentHeight: contentHeight,
      tabMaxHeight: computedStyle.maxHeight,
      tabMinHeight: computedStyle.minHeight,
      tabOverflowY: computedStyle.overflowY,
      tabScrollHeight: generateNftsTab.scrollHeight,
      tabClientHeight: generateNftsTab.clientHeight,
      contentFits: contentHeight <= availableHeight,
      needsScrolling: contentHeight > availableHeight,
      rect: rect
    });
    
    if (isActive) {
      // Force height recalculation
      handleViewportChange();
      console.log('[DEBUG] Height recalculation triggered');
    }
  };

  // Manual function to force enable scrolling
  window.forceGenerateNftsScrolling = function() {
    const generateNftsTab = document.getElementById('generate-nfts');
    if (generateNftsTab) {
      generateNftsTab.classList.add('console-scroll-enabled');
      console.log('[DEBUG] Forced scrolling enabled for Generate NFTs tab via class');
    } else {
      console.log('[DEBUG] Generate NFTs tab not found');
    }
  };

  // Simple manual test for console detection
  window.testConsoleFix = function() {
    console.log('=== CONSOLE DETECTION TEST ===');
    
    // Check if Generate NFTs tab exists and is active
    const generateNftsTab = document.getElementById('generate-nfts');
    if (!generateNftsTab) {
      console.log('❌ Generate NFTs tab not found');
      return;
    }
    
    const isActive = generateNftsTab.classList.contains('active');
    console.log('✅ Generate NFTs tab found:', isActive ? 'ACTIVE' : 'INACTIVE');
    
    if (!isActive) {
      console.log('⚠️ Please switch to Generate NFTs tab first, then run this test again');
      return;
    }
    
    // Check current scrolling state
    const hasScrollClass = generateNftsTab.classList.contains('console-scroll-enabled');
    console.log('📊 Current scrolling state:', hasScrollClass ? 'ENABLED' : 'DISABLED');
    
    // Check viewport height
    const viewportHeight = window.innerHeight;
    console.log('📏 Viewport height:', viewportHeight);
    
    // Force enable scrolling
    generateNftsTab.classList.add('console-scroll-enabled');
    console.log('✅ Forced scrolling ENABLED - check if you can now scroll the Generate NFTs tab');
    
    // Check if content is scrollable
    const scrollHeight = generateNftsTab.scrollHeight;
    const clientHeight = generateNftsTab.clientHeight;
    console.log('📊 Scroll info:', {
      scrollHeight: scrollHeight,
      clientHeight: clientHeight,
      needsScrolling: scrollHeight > clientHeight
    });
    
    console.log('=== TEST COMPLETE ===');
    console.log('If you can now scroll the Generate NFTs tab, the fix is working!');
  };

  // Manual debug function - can be called from console
  window.debugJumpToLayersButton = function() {
    const jumpButton = document.getElementById('jump-to-layers-btn');
    const traitsRulesTab = document.getElementById('traits-rules');
    const isTraitsRulesActive = traitsRulesTab && traitsRulesTab.classList.contains('active');
    
    if (!jumpButton) {
      console.log('[DEBUG] Jump to layers button not found in DOM');
      return;
    }
    
    console.log('[DEBUG] Jump to layers button debug info:', {
      element: jumpButton,
      traitsRulesTabActive: isTraitsRulesActive,
      display: jumpButton.style.display,
      visibility: jumpButton.style.visibility,
      opacity: jumpButton.style.opacity,
      position: jumpButton.style.position,
      zIndex: jumpButton.style.zIndex,
      top: jumpButton.style.top,
      right: jumpButton.style.right,
      left: jumpButton.style.left,
      computedDisplay: window.getComputedStyle(jumpButton).display,
      computedVisibility: window.getComputedStyle(jumpButton).visibility,
      computedOpacity: window.getComputedStyle(jumpButton).opacity,
      computedPosition: window.getComputedStyle(jumpButton).position,
      computedZIndex: window.getComputedStyle(jumpButton).zIndex,
      rect: jumpButton.getBoundingClientRect(),
      parentElement: jumpButton.parentElement,
      parentDisplay: jumpButton.parentElement ? window.getComputedStyle(jumpButton.parentElement).display : 'no parent'
    });
    
    // Only force make it visible if we're on the traits-rules tab
    if (isTraitsRulesActive) {
      jumpButton.style.display = 'flex !important';
      jumpButton.style.visibility = 'visible !important';
      jumpButton.style.opacity = '1 !important';
      jumpButton.style.position = 'fixed !important';
      jumpButton.style.zIndex = '1000 !important';
      jumpButton.style.top = '50% !important';
      jumpButton.style.right = '2rem !important';
      jumpButton.style.transform = 'translateY(-50%) !important';
      
      console.log('[DEBUG] Jump to layers button forced visible on traits-rules tab');
    } else {
      console.log('[DEBUG] Jump to layers button hidden - not on traits-rules tab');
    }
  };

  // Comprehensive test function - can be called from console
  window.testJumpToLayersFunctionality = function() {
    console.log('=== JUMP TO LAYERS FUNCTIONALITY TEST ===');
    
    // Test 1: Check if button exists
    const jumpButton = document.getElementById('jump-to-layers-btn');
    console.log('✅ Test 1 - Button exists:', !!jumpButton);
    
    if (!jumpButton) {
      console.log('❌ Button not found - stopping tests');
      return;
    }
    
    // Test 2: Check tab state
    const traitsRulesTab = document.getElementById('traits-rules');
    const isTraitsRulesActive = traitsRulesTab && traitsRulesTab.classList.contains('active');
    console.log('✅ Test 2 - Traits Rules tab active:', isTraitsRulesActive);
    
    // Test 3: Check button visibility
    const computedDisplay = window.getComputedStyle(jumpButton).display;
    const shouldBeVisible = isTraitsRulesActive && computedDisplay !== 'none';
    console.log('✅ Test 3 - Button visibility:', {
      computedDisplay,
      shouldBeVisible,
      actualVisible: shouldBeVisible
    });
    
    // Test 4: Check positioning
    const rect = jumpButton.getBoundingClientRect();
    console.log('✅ Test 4 - Button positioning:', {
      top: rect.top,
      left: rect.left,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height
    });
    
    // Test 5: Check reference buttons
    const deleteAllLayersBtn = document.getElementById('delete-all-layers');
    const clearRulesFilterBtn = document.getElementById('clear-rules-filter-btn');
    console.log('✅ Test 5 - Reference buttons:', {
      deleteAllLayers: !!deleteAllLayersBtn,
      clearRulesFilter: !!clearRulesFilterBtn
    });
    
    // Test 6: Check event listeners
    const hasListener = jumpButton.dataset.listenerAdded === 'true';
    console.log('✅ Test 6 - Event listener attached:', hasListener);
    
    // Test 7: Test click functionality
    if (shouldBeVisible) {
      console.log('✅ Test 7 - Testing click functionality...');
      jumpButton.click();
      console.log('✅ Test 7 - Click test completed');
    } else {
      console.log('⏭️ Test 7 - Skipped (button not visible)');
    }
    
    // Test 8: Check CSS rules
    const cssRules = {
      position: window.getComputedStyle(jumpButton).position,
      zIndex: window.getComputedStyle(jumpButton).zIndex,
      backgroundColor: window.getComputedStyle(jumpButton).backgroundColor
    };
    console.log('✅ Test 8 - CSS rules:', cssRules);
    
    console.log('=== TEST COMPLETED ===');
    
    // Summary
    const allTestsPassed = !!jumpButton && hasListener;
    console.log(`🎯 Overall Status: ${allTestsPassed ? 'PASS' : 'FAIL'}`);
    
    return {
      buttonExists: !!jumpButton,
      tabActive: isTraitsRulesActive,
      buttonVisible: shouldBeVisible,
      hasListener: hasListener,
      allTestsPassed
    };
  };

  // ===== DRAG-TO-SCROLL FUNCTIONALITY FOR TRAITS & RULES TAB =====
  // Allow users to drag the page up and down since the vertical scrollbar is hidden
  
  function setupDragToScroll() {
    const traitsRulesTab = document.getElementById('traits-rules');
    if (!traitsRulesTab) {
      console.log('[DEBUG] Traits Rules tab not found, drag-to-scroll not initialized');
      return;
    }

    let isDragging = false;
    let startY = 0;
    let startScrollTop = 0;
    let dragStartTime = 0;

    // Check if the target element should allow dragging (not buttons, inputs, draggable elements, etc.)
    function canDrag(element) {
      if (!element) return false;
      
      // CRITICAL: Don't allow drag-to-scroll if clicking on drag handles (they have their own drag-and-drop functionality)
      if (element.classList && (
        element.classList.contains('trait-layer-drag-handle') ||
        element.classList.contains('rule-drag-handle')
      )) {
        return false;
      }
      
      // Don't allow dragging on interactive elements
      const interactiveTags = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'A'];
      if (interactiveTags.includes(element.tagName)) {
        return false;
      }
      
      // Don't allow dragging on elements with draggable attribute set to true (like trait layers)
      if (element.draggable === true) {
        return false;
      }
      
      // Don't allow dragging on elements with pointer-events: none
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle.pointerEvents === 'none') {
        return false;
      }
      
      // Check parent elements for drag handles, draggable attributes or trait layer classes
      let parent = element.parentElement;
      while (parent && parent !== traitsRulesTab) {
        // CRITICAL: Don't allow scrolling if clicking on drag handles (they have their own drag-and-drop functionality)
        if (parent.classList && (
          parent.classList.contains('trait-layer-drag-handle') ||
          parent.classList.contains('rule-drag-handle')
        )) {
          return false;
        }
        
        // Don't allow scrolling if clicking on trait layer elements (they have their own drag functionality)
        if (parent.classList && (
          parent.classList.contains('trait-layer-bar') ||
          parent.classList.contains('trait-layer-header') ||
          parent.classList.contains('trait-layer-content') ||
          parent.classList.contains('trait-item') ||
          parent.classList.contains('saved-seed-card') ||
          parent.classList.contains('rule-item') ||
          parent.classList.contains('rule-header')
        )) {
          return false;
        }
        
        // Don't allow if parent is draggable
        if (parent.draggable === true) {
          return false;
        }
        
        parent = parent.parentElement;
      }
      
      return true;
    }

    // Mouse down handler
    function handleMouseDown(e) {
      // Only allow dragging with left mouse button
      if (e.button !== 0) return;
      
      // CRITICAL: Check if clicking on drag handles first - they should NOT trigger drag-to-scroll
      const clickedDragHandle = e.target.closest('.trait-layer-drag-handle, .rule-drag-handle');
      if (clickedDragHandle) {
        // Don't interfere with drag-and-drop functionality
        return;
      }
      
      // Check if we can drag from this element
      if (!canDrag(e.target)) {
        return;
      }

      isDragging = true;
      startY = e.clientY;
      startScrollTop = traitsRulesTab.scrollTop;
      dragStartTime = Date.now();
      
      // Change cursor to indicate dragging
      traitsRulesTab.style.cursor = 'grabbing';
      traitsRulesTab.style.userSelect = 'none';
      
      // Prevent default to avoid text selection
      e.preventDefault();
      e.stopPropagation();
    }

    // Mouse move handler
    function handleMouseMove(e) {
      if (!isDragging) return;
      
      // CRITICAL: Don't interfere if drag-and-drop is active
      const activeDragItem = document.querySelector('.trait-layer-bar[data-dragging="yes"], .rule-item[data-dragging="yes"]');
      if (activeDragItem) {
        // Drag-and-drop is active, don't scroll
        isDragging = false;
        traitsRulesTab.style.cursor = '';
        traitsRulesTab.style.userSelect = '';
        return;
      }
      
      const deltaY = startY - e.clientY;
      const newScrollTop = startScrollTop + deltaY;
      
      // Scroll the container
      traitsRulesTab.scrollTop = newScrollTop;
      
      // Prevent default to avoid text selection
      e.preventDefault();
    }

    // Mouse up handler
    function handleMouseUp(e) {
      if (!isDragging) return;
      
      isDragging = false;
      
      // Restore cursor
      traitsRulesTab.style.cursor = '';
      traitsRulesTab.style.userSelect = '';
    }

    // Touch handlers for mobile support
    function handleTouchStart(e) {
      if (e.touches.length !== 1) return;
      
      // CRITICAL: Check if clicking on drag handles first - they should NOT trigger drag-to-scroll
      const clickedDragHandle = e.target.closest('.trait-layer-drag-handle, .rule-drag-handle');
      if (clickedDragHandle) {
        // Don't interfere with drag-and-drop functionality
        return;
      }
      
      // Check if we can drag from this element
      if (!canDrag(e.target)) {
        return;
      }

      isDragging = true;
      startY = e.touches[0].clientY;
      startScrollTop = traitsRulesTab.scrollTop;
      dragStartTime = Date.now();
      
      traitsRulesTab.style.userSelect = 'none';
    }

    function handleTouchMove(e) {
      if (!isDragging || e.touches.length !== 1) return;
      
      const deltaY = startY - e.touches[0].clientY;
      const newScrollTop = startScrollTop + deltaY;
      
      traitsRulesTab.scrollTop = newScrollTop;
      
      // Prevent default scrolling behavior
      e.preventDefault();
    }

    function handleTouchEnd(e) {
      if (!isDragging) return;
      
      isDragging = false;
      traitsRulesTab.style.userSelect = '';
    }

    // Add event listeners with capture phase to ensure drag handles get priority
    // Use capture: false so drag handles can stop propagation first
    traitsRulesTab.addEventListener('mousedown', handleMouseDown, false);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Touch events for mobile
    traitsRulesTab.addEventListener('touchstart', handleTouchStart, { passive: false });
    traitsRulesTab.addEventListener('touchmove', handleTouchMove, { passive: false });
    traitsRulesTab.addEventListener('touchend', handleTouchEnd);
    
    // Clean up on mouse leave (in case mouse is released outside)
    traitsRulesTab.addEventListener('mouseleave', handleMouseUp);
    
    // console.log('[DEBUG] Drag-to-scroll functionality initialized for Traits & Rules tab');
  }

  // Initialize drag-to-scroll when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(setupDragToScroll, 100);
    });
  } else {
    setTimeout(setupDragToScroll, 100);
  }

  // Also re-initialize when the tab becomes active (in case it's loaded dynamically)
  const dragScrollObserver = new MutationObserver(() => {
    const traitsRulesTab = document.getElementById('traits-rules');
    if (traitsRulesTab && traitsRulesTab.classList.contains('active')) {
      // Check if drag-to-scroll is already set up
      if (!traitsRulesTab.dataset.dragScrollInitialized) {
        traitsRulesTab.dataset.dragScrollInitialized = 'true';
        setTimeout(setupDragToScroll, 100);
      }
    }
  });

  dragScrollObserver.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class']
  });

  // Register as NFTApp module so it can be accessed by other modules
  if (window.NFTApp && typeof window.NFTApp.registerModule === 'function') {
    const traitsRulesLayoutFixModule = {
      updateVisibility: function() {
        updateButtonVisibility();
        updateRulesFilterVisibility();
        // Note: updateRulesSectionVisibility is only called on project load (in setup) and layer deletion
        forceNativeScrollbar();
      },
      updateButtonVisibility: updateButtonVisibility,
      updateRulesFilterVisibility: updateRulesFilterVisibility,
      updateRulesSectionVisibility: updateRulesSectionVisibility,
      forceNativeScrollbar: forceNativeScrollbar
    };
    
    window.NFTApp.registerModule('traitsRulesLayoutFix', traitsRulesLayoutFixModule);
    // console.log('[DEBUG] Registered traitsRulesLayoutFix module');
  }

})();