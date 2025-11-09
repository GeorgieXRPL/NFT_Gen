// Traits & Rules Layout Fix
// This script ensures the CSS layout is maintained after JavaScript DOM manipulation

(function() {
  'use strict';

  // Prevent multiple initializations
  if (window.traitsRulesLayoutFixInitialized) {
    console.log('[DEBUG] Traits Rules Layout Fix already initialized, skipping');
    return;
  }
  window.traitsRulesLayoutFixInitialized = true;
  
  // Log script loading for debugging
  console.log('[DEBUG] Traits & Rules Layout Fix loaded - Script execution #' + (window.traitsRulesLayoutFixCount || 0));
  window.traitsRulesLayoutFixCount = (window.traitsRulesLayoutFixCount || 0) + 1;
  
  // Check if this script is being loaded multiple times
  if (window.traitsRulesLayoutFixCount > 1) {
    console.warn('[DEBUG] WARNING: Traits Rules Layout Fix script loaded multiple times! This may cause conflicts.');
  }
  
  // Track MemoryManager errors to see if they're related to our script
  const originalConsoleError = console.error;
  console.error = function(...args) {
    if (args[0] && args[0].includes && args[0].includes('MemoryManager')) {
      console.log('[DEBUG] MemoryManager error detected - checking if related to our script');
      console.trace('[DEBUG] MemoryManager error stack trace');
    }
    originalConsoleError.apply(console, args);
  };
  
  // Track if setup has been completed to prevent duplicate event listeners
  let setupCompleted = false;
  let buttonSetupCompleted = false;
  
  // Function to enforce the CSS layout
  function enforceTraitsRulesLayout() {
    console.log('[DEBUG] Enforcing Traits & Rules layout');
    
    // Get the traits-rules tab
    const traitsRulesTab = document.getElementById('traits-rules');
    if (!traitsRulesTab) {
      console.log('[DEBUG] Traits & Rules tab not found');
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
      margin-bottom: 4rem !important;
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
        margin-bottom: 0 !important;
        padding-top: 0 !important;
        padding-bottom: 0 !important;
        overflow: visible !important;
        height: auto !important;
        max-height: none !important;
      `;
    }
    
    console.log('[DEBUG] Layout enforcement complete');
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
  function hookIntoNavigation() {
    try {
      const navigationModule = window.NFTApp?.getModule('navigation');
      if (navigationModule && typeof navigationModule.showTab === 'function') {
        const originalShowTab = navigationModule.showTab;
        navigationModule.showTab = function(tabId, isUserInitiated) {
          const result = originalShowTab.call(this, tabId, isUserInitiated);
          
          // If switching to traits-rules tab, update rules section visibility
          if (tabId === 'traits-rules') {
            setTimeout(() => {
              updateRulesSectionVisibility();
              forceNativeScrollbar();
            }, 100);
          }
          
          // If switching to generate-nfts tab, handle viewport changes
          if (tabId === 'generate-nfts') {
            setTimeout(() => {
              handleViewportChange();
              // Also check if scrolling is needed after a short delay
              setTimeout(() => {
                const generateNftsTab = document.getElementById('generate-nfts');
                if (generateNftsTab) {
                  const viewportHeight = window.innerHeight;
                  const availableHeight = viewportHeight - 110;
                  const contentHeight = generateNftsTab.scrollHeight;
                  
                  if (contentHeight > availableHeight) {
                    generateNftsTab.style.overflowY = 'auto';
                    generateNftsTab.style.scrollbarWidth = 'auto';
                    generateNftsTab.style.msOverflowStyle = 'scrollbar';
                    console.log('[DEBUG] Enabled scrolling for Generate NFTs tab on tab switch');
                  }
                }
              }, 500);
            }, 100);
          }
          
          return result;
        };
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
                updateRulesSectionVisibility();
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
          const result = originalUpdateTraitLayerUI.apply(this, args);
          setTimeout(() => {
            updateButtonVisibility();
            updateRulesSectionVisibility();
            forceNativeScrollbar();
          }, 100);
          return result;
        };
      }
      
      // Hook into addTrait
      if (typeof traitLayersModule.addTrait === 'function') {
        const originalAddTrait = traitLayersModule.addTrait;
        traitLayersModule.addTrait = function(...args) {
          const result = originalAddTrait.apply(this, args);
          setTimeout(() => {
            updateButtonVisibility();
            updateRulesSectionVisibility();
            forceNativeScrollbar();
          }, 100);
          return result;
        };
      }
      
      // Hook into deleteTrait
      if (typeof traitLayersModule.deleteTrait === 'function') {
        const originalDeleteTrait = traitLayersModule.deleteTrait;
        traitLayersModule.deleteTrait = function(...args) {
          const result = originalDeleteTrait.apply(this, args);
          setTimeout(() => {
            updateButtonVisibility();
            updateRulesSectionVisibility();
            forceNativeScrollbar();
          }, 100);
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
            updateRulesSectionVisibility();
          }, 100);
          return result;
        };
      }
      
      console.log('[DEBUG] Hooked into traitLayers module functions');
    }
  }

  // Add functionality to the jump to rules button
  function setupJumpToRulesButton() {
    const jumpButton = document.getElementById('jump-to-rules-btn');
    if (!jumpButton) {
      console.log('[DEBUG] Jump to rules button not found, retrying...');
      setTimeout(setupJumpToRulesButton, 100);
      return;
    }
    
    // Prevent duplicate event listeners
    if (jumpButton.dataset.listenerAdded) {
      console.log('[DEBUG] Jump to rules button already has event listener');
      return;
    }
    
    console.log('[DEBUG] Setting up jump to rules button');
    
    jumpButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('[DEBUG] Jump to rules button clicked');
      
      // Find the rules section
      const rulesSection = document.querySelector('#traits-rules .rules-section');
      if (rulesSection) {
        console.log('[DEBUG] Rules section found, scrolling...');
        
        // Scroll to the rules section with smooth behavior
        rulesSection.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        
        // Add a subtle highlight effect
        rulesSection.style.transition = 'box-shadow 0.3s ease';
        rulesSection.style.boxShadow = '0 0 20px rgba(108, 92, 231, 0.5)';
        
        setTimeout(() => {
          rulesSection.style.boxShadow = '';
        }, 2000);
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show('Scrolled to Combination Rules', 'info');
        }
      } else {
        console.warn('[DEBUG] Rules section not found');
      }
    }, { capture: true });
    
    // Mark as having event listener
    jumpButton.dataset.listenerAdded = 'true';
    
    console.log('[DEBUG] Jump to rules button setup complete');
  }

  // Position jump-to-layers button aligned to Delete All Layers (horizontal) and clear-rules-filter-btn (vertical)
  function positionJumpToLayersButton() {
    const jumpButton = document.getElementById('jump-to-layers-btn');
    if (!jumpButton) {
      console.log('[DEBUG] Jump to layers button not found for positioning');
      return;
    }
    
    console.log('[DEBUG] Positioning jump to layers button...');
    
    // Find the Delete All Layers button
    const deleteAllLayersBtn = document.getElementById('delete-all-layers');
    // Find the clear rules filter button
    const clearRulesFilterBtn = document.getElementById('clear-rules-filter-btn');
    
    console.log('[DEBUG] Reference buttons found:', {
      deleteAllLayers: !!deleteAllLayersBtn,
      clearRulesFilter: !!clearRulesFilterBtn
    });
    
    if (deleteAllLayersBtn && clearRulesFilterBtn) {
      // Get positions of both buttons
      const deleteBtnRect = deleteAllLayersBtn.getBoundingClientRect();
      const clearBtnRect = clearRulesFilterBtn.getBoundingClientRect();
      
      // Horizontal alignment: Align with Delete All Layers button (same left position)
      const horizontalPosition = deleteBtnRect.left;
      
      // Vertical alignment: Center-align to clear-rules-filter-btn
      const verticalPosition = clearBtnRect.top + (clearBtnRect.height / 2);
      
      // Position the jump button
      jumpButton.style.left = `${horizontalPosition}px`;
      jumpButton.style.top = `${verticalPosition}px`;
      jumpButton.style.right = 'auto'; // Override right positioning
      jumpButton.style.transform = 'translateY(-50%)';
      
      console.log('[DEBUG] Jump to layers button positioned - Horizontal:', horizontalPosition, 'Vertical:', verticalPosition);
    } else {
      // Fallback: center vertically and right-align
      jumpButton.style.top = '50%';
      jumpButton.style.right = '2rem';
      jumpButton.style.left = 'auto';
      jumpButton.style.transform = 'translateY(-50%)';
      console.log('[DEBUG] Jump to layers button positioned at center-right (fallback) - missing reference buttons');
    }
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
      console.log('[DEBUG] Jump to layers button already has event listener');
      return;
    }
    
    console.log('[DEBUG] Setting up jump to layers button');
    
    // FORCE VISIBILITY - Override any conflicting styles
    jumpButton.style.display = 'flex !important';
    jumpButton.style.visibility = 'visible !important';
    jumpButton.style.opacity = '0.9 !important';
    jumpButton.style.position = 'fixed !important';
    jumpButton.style.zIndex = '1000 !important';
    
    console.log('[DEBUG] Jump to layers button forced visible');
    
    // Position the button at virtual intersection
    positionJumpToLayersButton();
    
    // Ensure button is visible initially (fallback)
    if (jumpButton.style.display === 'none' || !jumpButton.style.display) {
      jumpButton.style.display = 'flex';
      console.log('[DEBUG] Jump to layers button made visible (fallback)');
    }
    
    jumpButton.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      console.log('[DEBUG] Jump to layers button clicked');
      
      // Find the "Jump to Rules" button (which is in the traits section header)
      const jumpToRulesButton = document.querySelector('#jump-to-rules-btn');
      if (jumpToRulesButton) {
        console.log('[DEBUG] Jump to Rules button found, scrolling...');
        
        // Scroll to the Jump to Rules button with smooth behavior
        jumpToRulesButton.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
        
        // Add a subtle highlight effect to the Jump to Rules button
        jumpToRulesButton.style.transition = 'box-shadow 0.3s ease';
        jumpToRulesButton.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.5)';
        
        // Remove the highlight after 2 seconds
        setTimeout(() => {
          jumpToRulesButton.style.boxShadow = '';
        }, 2000);
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show('Scrolled to Jump to Rules button', 'info');
        }
      } else {
        console.log('[DEBUG] Jump to Rules button not found, falling back to traits section header');
        
        // Fallback: Find the traits section subsection header
        const traitsSectionHeader = document.querySelector('#traits-rules .traits-section .subsection-header');
        if (traitsSectionHeader) {
          console.log('[DEBUG] Traits section header found, scrolling...');
          
          // Scroll to the traits section header with smooth behavior
          traitsSectionHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Add a subtle highlight effect to the entire traits section
          const traitsSection = document.querySelector('#traits-rules .traits-section');
          if (traitsSection) {
            traitsSection.style.transition = 'box-shadow 0.3s ease';
            traitsSection.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.5)';
            
            // Remove the highlight after 2 seconds
            setTimeout(() => {
              traitsSection.style.boxShadow = '';
            }, 2000);
          }
          
          // Show notification
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Trait Layers', 'info');
          }
        } else {
          console.warn('[DEBUG] Traits section header not found');
        }
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
        console.log(`[DEBUG] Jump to layers button visibility based on tab: ${isTraitsRulesActive ? 'visible' : 'hidden'}`);
        
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
      console.log('[DEBUG] Bottom buttons already have event listeners');
      return;
    }
    
    console.log('[DEBUG] Setting up bottom buttons');
    
    // Jump to layers bottom button
    if (!jumpToLayersBottomBtn.dataset.listenerAdded) {
      jumpToLayersBottomBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Jump to layers bottom button clicked');
        
        // Find the traits section subsection header (where the "Jump to Rules" button is)
        const traitsSectionHeader = document.querySelector('#traits-rules .traits-section .subsection-header');
        if (traitsSectionHeader) {
          console.log('[DEBUG] Traits section header found, scrolling...');
          
          // Scroll to the traits section header with smooth behavior
          traitsSectionHeader.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          // Add a subtle highlight effect to the entire traits section
          const traitsSection = document.querySelector('#traits-rules .traits-section');
          if (traitsSection) {
            traitsSection.style.transition = 'box-shadow 0.3s ease';
            traitsSection.style.boxShadow = '0 0 20px rgba(0, 184, 148, 0.5)';
            
            // Remove the highlight after 2 seconds
            setTimeout(() => {
              traitsSection.style.boxShadow = '';
            }, 2000);
          }
          
          // Show notification
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Trait Layers', 'info');
          }
        } else {
          console.warn('[DEBUG] Traits section header not found');
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
        
        const rulesSection = document.querySelector('#traits-rules .rules-section');
        if (rulesSection) {
          rulesSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
          rulesSection.style.transition = 'box-shadow 0.3s ease';
          rulesSection.style.boxShadow = '0 0 20px rgba(108, 92, 231, 0.5)';
          
          setTimeout(() => {
            rulesSection.style.boxShadow = '';
          }, 2000);
          
          // Show notification
          if (window.NFTApp?.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show('Scrolled to Combination Rules', 'info');
          }
        }
      }, { capture: true });
      jumpToRulesBottomBtn.dataset.listenerAdded = 'true';
    }
    
    console.log('[DEBUG] Bottom buttons setup complete');
  }

  // Function to check if buttons should be visible
  function updateButtonVisibility() {
    console.log('[DEBUG] updateButtonVisibility called');
    
    // Try multiple ways to get project data
    let projectData = null;
    
    // Method 1: Try generateNftsUI module
    if (window.NFTApp?.getModule('generateNftsUI')?.projectData) {
      projectData = window.NFTApp.getModule('generateNftsUI').projectData;
      console.log('[DEBUG] Got project data from generateNftsUI module');
    }
    
    // Method 2: Try currentProject global variable
    if (!projectData && window.currentProject) {
      projectData = window.currentProject;
      console.log('[DEBUG] Got project data from currentProject global');
    }
    
    // Method 3: Try to get from trait layers module
    if (!projectData && window.NFTApp?.getModule('traitLayers')?.projectData) {
      projectData = window.NFTApp.getModule('traitLayers').projectData;
      console.log('[DEBUG] Got project data from traitLayers module');
    }
    
    // Method 4: Try to get from combination rules module
    if (!projectData && window.NFTApp?.getModule('combinationRules')?.projectData) {
      projectData = window.NFTApp.getModule('combinationRules').projectData;
      console.log('[DEBUG] Got project data from combinationRules module');
    }
    
    // Method 5: Try to get from project interface module
    if (!projectData && window.NFTApp?.getModule('projectInterface')?.projectData) {
      projectData = window.NFTApp.getModule('projectInterface').projectData;
      console.log('[DEBUG] Got project data from projectInterface module');
    }
    
    if (!projectData) {
      console.log('[DEBUG] No project data available for button visibility check');
      console.log('[DEBUG] Available modules:', Object.keys(window.NFTApp?.getModule ? {} : {}));
      // Hide all buttons if no project data
      hideAllButtons();
      return;
    }
    
    // Count trait layers
    const traitLayersCount = projectData.traits ? projectData.traits.length : 0;
    
    // Count combination rules
    const combinationRulesCount = projectData.rules ? projectData.rules.length : 0;
    
    // Show buttons if there are more than 5 trait layers OR more than 5 combination rules
    const shouldShowButtons = traitLayersCount > 5 || combinationRulesCount > 5;
    
    console.log('[DEBUG] Button visibility check:', {
      traitLayersCount,
      combinationRulesCount,
      shouldShowButtons,
      projectData: !!projectData,
      projectDataKeys: projectData ? Object.keys(projectData) : [],
      traits: projectData.traits ? projectData.traits.length : 'no traits',
      rules: projectData.rules ? projectData.rules.length : 'no rules'
    });
    
    // Update visibility of all buttons
    const buttons = [
      'jump-to-rules-btn',
      'jump-to-rules-bottom-btn',
      'jump-to-layers-bottom-btn'
    ];
    
    buttons.forEach(buttonId => {
      const button = document.getElementById(buttonId);
      if (button) {
        button.style.display = shouldShowButtons ? 'flex' : 'none';
        console.log(`[DEBUG] Button ${buttonId} visibility: ${shouldShowButtons ? 'visible' : 'hidden'}`);
      } else {
        console.log(`[DEBUG] Button ${buttonId} not found`);
      }
    });
    
    // Note: jump-to-layers-btn is now inside the combination-rules-filter-container
    // and will be managed by the filter container visibility
    
    // Update visibility of bottom buttons container
    const bottomContainer = document.querySelector('.bottom-shortcut-buttons');
    if (bottomContainer) {
      bottomContainer.style.display = shouldShowButtons ? 'flex' : 'none';
      console.log(`[DEBUG] Bottom container visibility: ${shouldShowButtons ? 'visible' : 'hidden'}`);
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

  // Setup the rules filter functionality
  function setupRulesFilter() {
    console.log('[DEBUG] Setting up rules filter');
    
    const filterContainer = document.getElementById('combination-rules-filter-container');
    const clearBtn = document.getElementById('clear-rules-filter-btn');
    const dropdown = document.getElementById('rules-filter-dropdown');
    const jumpBtn = document.getElementById('jump-to-layers-btn');
    
    if (!filterContainer || !clearBtn || !dropdown || !jumpBtn) {
      console.log('[DEBUG] Rules filter elements not found, retrying...', {
        filterContainer: !!filterContainer,
        clearBtn: !!clearBtn,
        dropdown: !!dropdown,
        jumpBtn: !!jumpBtn
      });
      setTimeout(setupRulesFilter, 100);
      return;
    }
    
    // Prevent duplicate event listeners
    if (clearBtn.dataset.listenerAdded && dropdown.dataset.listenerAdded && jumpBtn.dataset.listenerAdded) {
      console.log('[DEBUG] Rules filter already has event listeners');
      return;
    }
    
    console.log('[DEBUG] All filter elements found, setting up event listeners');
    
    // Clear filter button functionality
    if (!clearBtn.dataset.listenerAdded) {
      clearBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Clear filter button clicked');
        dropdown.value = '';
        filterRules('');
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show('Filter cleared', 'success');
        }
      }, { capture: true });
      clearBtn.dataset.listenerAdded = 'true';
      console.log('[DEBUG] Clear button event listener added');
    }
    
    // Dropdown change functionality
    if (!dropdown.dataset.listenerAdded) {
      dropdown.addEventListener('change', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Rules filter dropdown changed to:', e.target.value);
        filterRules(e.target.value);
        
        // Show notification
        if (window.NFTApp?.getModule('notificationService')) {
          const filterText = e.target.value ? `Filtered by ${e.target.value}` : 'Showing all rules';
          window.NFTApp.getModule('notificationService').show(filterText, 'info');
        }
      }, { capture: true });
      dropdown.dataset.listenerAdded = 'true';
      console.log('[DEBUG] Dropdown event listener added');
    }
    
    // Jump to layers button functionality (inside filter container)
    if (!jumpBtn.dataset.listenerAdded) {
      jumpBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        console.log('[DEBUG] Jump to layers button clicked (from filter container)');
        
        // Find the traits section
        const traitsSection = document.querySelector('#traits-rules .traits-section');
        if (traitsSection) {
          console.log('[DEBUG] Traits section found, scrolling...');
          
          // Scroll to the traits section with smooth behavior
          traitsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
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
          console.warn('[DEBUG] Traits section not found');
        }
      }, { capture: true });
      jumpBtn.dataset.listenerAdded = 'true';
      console.log('[DEBUG] Jump to layers button event listener added');
    }
    
    console.log('[DEBUG] Rules filter setup complete');
  }

  // Update rules filter visibility based on rule count
  function updateRulesFilterVisibility() {
    console.log('[DEBUG] updateRulesFilterVisibility called');
    
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
      console.log('[DEBUG] No project data available for rules filter visibility check');
      hideRulesFilter();
      return;
    }
    
    const rulesCount = projectData.rules ? projectData.rules.length : 0;
    const traitsCount = projectData.traits ? projectData.traits.length : 0;
    
    // Show filter container if there are 5+ rules OR 5+ traits (for jump-to-layers-btn)
    const shouldShowFilter = rulesCount >= 5 || traitsCount >= 5;
    
    console.log('[DEBUG] Rules filter visibility check:', {
      rulesCount,
      traitsCount,
      shouldShowFilter
    });
    
    const filterContainer = document.getElementById('combination-rules-filter-container');
    if (filterContainer) {
      filterContainer.style.display = shouldShowFilter ? 'flex' : 'none';
      console.log(`[DEBUG] Rules filter visibility: ${shouldShowFilter ? 'visible' : 'hidden'}`);
      
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
      
      // Show jump-to-layers-btn if there are any traits (not just 5+)
      if (jumpBtn) {
        const shouldShow = traitsCount > 0;
        jumpBtn.style.display = shouldShow ? 'flex' : 'none';
        console.log(`[DEBUG] Jump-to-layers-btn visibility: ${shouldShow ? 'visible' : 'hidden'} (traits count: ${traitsCount})`);
        
        // Reposition the button after visibility changes
        if (shouldShow) {
          setTimeout(() => {
            if (typeof positionJumpToLayersButton === 'function') {
              positionJumpToLayersButton();
            }
          }, 100);
        }
      }
    } else {
      console.log('[DEBUG] Rules filter container not found');
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
      
      console.log('[DEBUG] Applied native scrollbar fix to traits-rules tab - hiding all custom scrollbars');
    }
  }

  // CRITICAL FIX: Update rules section visibility based on trait layers count
  function updateRulesSectionVisibility() {
    console.log('[DEBUG] updateRulesSectionVisibility called');
    
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
      console.log('[DEBUG] No project data available for rules section visibility check');
      return;
    }
    
    const rulesSection = document.querySelector('.rules-section');
    if (!rulesSection) {
      console.warn('[DEBUG] Rules section not found');
      return;
    }
    
    // Count trait layers
    const traitLayersCount = projectData.traits ? projectData.traits.length : 0;
    const hasMinimumLayers = traitLayersCount >= 2;
    
    console.log('[DEBUG] Rules section visibility check:', {
      traitLayersCount,
      hasMinimumLayers
    });
    
    if (hasMinimumLayers) {
      // Show the rules section
      rulesSection.style.setProperty('display', 'block', 'important');
      console.log('[DEBUG] Rules section is now visible');
    } else {
      // Hide the rules section
      rulesSection.style.setProperty('display', 'none', 'important');
      console.log('[DEBUG] Rules section is now hidden - need at least 2 trait layers');
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
    
    // Look for all possible rule element selectors
    const ruleElements = rulesContainer.querySelectorAll('.rule-item, .combination-rule-item, .combination-rule, [data-rule-id]');
    
    if (!ruleType) {
      // Show all rules
      ruleElements.forEach(element => {
        element.style.display = '';
        element.style.visibility = '';
      });
      console.log('[DEBUG] Showing all rules');
    } else {
      // Filter by rule type
      let visibleCount = 0;
      ruleElements.forEach(element => {
        const ruleTypeAttr = element.getAttribute('data-rule-type');
        const ruleTypeClass = element.classList.contains(ruleType);
        
        if (ruleTypeAttr === ruleType || ruleTypeClass) {
          element.style.display = '';
          element.style.visibility = '';
          visibleCount++;
        } else {
          element.style.display = 'none';
          element.style.visibility = 'hidden';
        }
      });
      console.log(`[DEBUG] Showing ${visibleCount} rules of type: ${ruleType}`);
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
        setTimeout(() => {
          updateButtonVisibility();
          updateRulesFilterVisibility();
          updateRulesSectionVisibility();
          forceNativeScrollbar();
        }, 1000);
        return result;
      };
    }

    // Hook into projectService.startNew
    const projectServiceModule = window.NFTApp?.getModule('projectService');
    if (projectServiceModule && typeof projectServiceModule.startNew === 'function') {
      const originalStartNew = projectServiceModule.startNew;
      projectServiceModule.startNew = function() {
        const result = originalStartNew.call(this);
        setTimeout(() => {
          updateButtonVisibility();
          updateRulesFilterVisibility();
          updateRulesSectionVisibility();
          forceNativeScrollbar();
        }, 1000);
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
            updateRulesSectionVisibility();
            forceNativeScrollbar();
          }, 500);
          return result;
        };
      }
    }
  }

  // Comprehensive setup function
  function performCompleteSetup() {
    console.log('[DEBUG] Performing complete setup...');
    
    // Setup all buttons and filters
    setupJumpToRulesButton();
    setupJumpToLayersButton();
    setupBottomButtons();
    setupRulesFilter();
    
    // Update visibility
    updateButtonVisibility();
    updateRulesFilterVisibility();
    updateRulesSectionVisibility();
    
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
          traitsSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
          
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
    
    console.log('[DEBUG] Complete setup finished');
  }

  // Setup the button when the page loads
  document.addEventListener('DOMContentLoaded', () => {
    if (setupCompleted) {
      console.log('[DEBUG] Setup already completed, skipping...');
      return;
    }
    
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
        console.log('[DEBUG] Re-setting up jump-to-layers-btn');
        performCompleteSetup();
      }
      if (clearBtn && !clearBtn.dataset.listenerAdded) {
        console.log('[DEBUG] Re-setting up clear button');
        performCompleteSetup();
      }
      if (dropdown && !dropdown.dataset.listenerAdded) {
        console.log('[DEBUG] Re-setting up dropdown');
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
      
      // Always enable scrolling when viewport is reduced (console open)
      // This is a more aggressive approach to ensure content is accessible
      generateNftsTab.style.overflowY = 'auto';
      generateNftsTab.style.scrollbarWidth = 'auto';
      generateNftsTab.style.msOverflowStyle = 'scrollbar';
      
      // Set height constraints
      generateNftsTab.style.minHeight = 'calc(100vh - 110px)';
      generateNftsTab.style.maxHeight = 'calc(100vh - 110px)';
      
      console.log('[DEBUG] Enabled scrolling for Generate NFTs tab - viewport change detected');
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
        console.log('[DEBUG] Console detected as OPEN - height decreased by', heightDiff);
      } else if (currentHeight > viewportHeight + 50) {
        isConsoleOpen = false;
        console.log('[DEBUG] Console detected as CLOSED - height increased by', heightDiff);
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

})();