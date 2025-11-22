// Remove inline styles from project-interface when Generate NFTs tab is active
// This ensures CSS rules can properly control the dimensions (1557x931px)
// Also fixes content-area margin-top and height to remove 675px empty space
// CRITICAL: This must override ALL CSS rules including:
// - traits-panel-override.css: body .content-area { height: calc(100vh - 110px) !important; margin-top: 110px !important; }
// - main.css: .content-area { margin-top: 110px !important; }
// - styles.css: .content-area { margin-top: 110px !important; }

(function() {
  // INJECT STYLE TAG DIRECTLY INTO PAGE - This ensures CSS is loaded and has highest priority
  function injectStyleTag() {
    // Remove existing style tag if present
    const existingStyle = document.getElementById('generate-nfts-content-area-fix-inline');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    // Create new style tag with maximum specificity rules
    const styleTag = document.createElement('style');
    styleTag.id = 'generate-nfts-content-area-fix-inline';
    styleTag.textContent = `
      /* INJECTED STYLE - HIGHEST PRIORITY - LOADS AFTER ALL CSS */
      body .content-area.generate-nfts-content-active,
      .content-area.generate-nfts-content-active,
      body body .content-area.generate-nfts-content-active,
      html body .content-area.generate-nfts-content-active,
      html body body .content-area.generate-nfts-content-active,
      body #app .content-area.generate-nfts-content-active,
      body #app .project-interface .content-area.generate-nfts-content-active,
      html body #app .project-interface .content-area.generate-nfts-content-active,
      html html body body #app .project-interface .content-area.generate-nfts-content-active,
      body body #app .project-interface .content-area.generate-nfts-content-active,
      body body #app body .project-interface .content-area.generate-nfts-content-active,
      body body body #app .project-interface .content-area.generate-nfts-content-active {
        margin-top: 0 !important;
        padding-top: 0 !important;
        height: auto !important; /* Use auto to fit content and eliminate empty space */
        min-height: 0 !important;
        max-height: none !important;
        width: 1557px !important;
        max-width: 1557px !important;
        min-width: 1557px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-sizing: border-box !important;
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        overflow: visible !important;
      }
      
      html body #app .project-interface .content-area:has(#generate-nfts.tab-content.active),
      body .content-area:has(#generate-nfts.tab-content.active),
      html body body #app .project-interface .content-area:has(#generate-nfts.tab-content.active),
      body body #app .project-interface .content-area:has(#generate-nfts.tab-content.active) {
        margin-top: 0 !important;
        padding-top: 0 !important;
        height: auto !important; /* Use auto to fit content and eliminate empty space */
        min-height: 0 !important;
        max-height: none !important;
        width: 1557px !important;
        max-width: 1557px !important;
        min-width: 1557px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-sizing: border-box !important;
        position: relative !important;
        top: 0 !important;
        left: 0 !important;
        overflow: visible !important;
      }
    `;
    document.head.appendChild(styleTag);
  }
  
  function removeInlineStyles() {
    const generateNftsTab = document.getElementById('generate-nfts');
    const projectInterface = document.querySelector('.project-interface');
    const contentArea = document.querySelector('.content-area');
    
    // Always remove inline height styles from project-interface when Generate NFTs is active
    if (generateNftsTab && generateNftsTab.classList.contains('active')) {
      // Remove inline height styles from generate-nfts tab
      generateNftsTab.style.removeProperty('height');
      generateNftsTab.style.removeProperty('min-height');
      generateNftsTab.style.removeProperty('max-height');
      
      // Remove inline height styles from project-interface - CRITICAL
      // Just remove them - CSS will handle the dimensions with !important
      if (projectInterface) {
        projectInterface.style.removeProperty('height');
        projectInterface.style.removeProperty('min-height');
        projectInterface.style.removeProperty('max-height');
        // Add class to enable CSS targeting
        projectInterface.classList.add('generate-nfts-active');
      }
      
      // CRITICAL: Remove margin-top AND height from content-area to eliminate 675px empty space
      // This must override ALL CSS rules: traits-panel-override.css, main.css, styles.css
      if (contentArea) {
        // CRITICAL: If we're in the middle of a tab switch, preserve the current height
        // to prevent flickering. Only set to auto after the tab is fully visible.
        // Check data attribute FIRST (most reliable), then inline styles
        const preservedHeightAttr = contentArea.getAttribute('data-preserved-height');
        const currentHeight = contentArea.style.getPropertyValue('height');
        const currentMinHeight = contentArea.style.getPropertyValue('min-height');
        
        // CRITICAL: Data attribute is the source of truth - if it exists, use it
        // Otherwise, check inline styles for a pixel value
        const heightToPreserve = preservedHeightAttr || 
                                 (currentHeight && currentHeight !== 'auto' && currentHeight.includes('px') ? currentHeight : null) ||
                                 (currentMinHeight && currentMinHeight !== '0' && currentMinHeight !== '0px' && currentMinHeight.includes('px') ? currentMinHeight : null);
        
        // Only preserve if we're switching tabs AND we have a height to preserve
        const shouldPreserveHeight = isTabSwitching && heightToPreserve;
        
        if (shouldPreserveHeight) {
          // console.log(`[FLICKER DEBUG] removeInlineStyles: Preserving height during tab switch: attr=${preservedHeightAttr}, height=${currentHeight}, min-height=${currentMinHeight}, using=${heightToPreserve}`);
        } else if (isTabSwitching) {
          // console.log(`[FLICKER DEBUG] removeInlineStyles: Tab switching but no preserved height found: attr=${preservedHeightAttr}, height=${currentHeight}, min-height=${currentMinHeight}`);
        }
        
        // Force remove margin-top but preserve height if we're switching tabs
        contentArea.style.removeProperty('margin-top');
        if (!shouldPreserveHeight) {
          // Only remove height if we're not in the middle of a tab switch
          contentArea.style.removeProperty('height');
          contentArea.style.removeProperty('min-height');
        }
        contentArea.style.removeProperty('max-height');
        // Add class to enable CSS targeting
        contentArea.classList.add('generate-nfts-content-active');
        // Force apply via JavaScript IMMEDIATELY - inline styles override CSS
        // This ensures the fix works even if CSS doesn't load or is overridden
        contentArea.style.setProperty('margin-top', '0', 'important');
        if (!shouldPreserveHeight) {
          // Only set to auto if we're not preserving height
          contentArea.style.setProperty('height', 'auto', 'important'); // Use auto to fit content and eliminate empty space
          contentArea.style.setProperty('min-height', '0', 'important');
        } else {
          // CRITICAL: Re-apply preserved height from data attribute or inline style
          // This ensures the height stays preserved even if something cleared the inline styles
          if (heightToPreserve) {
            contentArea.style.setProperty('height', heightToPreserve, 'important');
            contentArea.style.setProperty('min-height', heightToPreserve, 'important');
            // Also ensure data attribute is set (in case it was missing)
            if (!preservedHeightAttr) {
              contentArea.setAttribute('data-preserved-height', heightToPreserve);
            }
            // console.log(`[FLICKER DEBUG] removeInlineStyles: Re-applied preserved height: ${heightToPreserve}`);
          }
        }
        contentArea.style.setProperty('max-height', 'none', 'important');
        // CRITICAL: Removed all aggressive setTimeout calls that were setting height to 853.55px
        // These were overriding the preserved height during tab switches, causing flickering
        // The preserved height mechanism and deferred operations now handle height management properly
      }
    } else {
      // Remove class when Generate NFTs is not active
      if (projectInterface) {
        projectInterface.classList.remove('generate-nfts-active');
      }
      if (contentArea) {
        contentArea.classList.remove('generate-nfts-content-active');
      }
    }
  }
  
  // CRITICAL: Force apply fix immediately using requestAnimationFrame for immediate DOM updates
  function forceApplyFix() {
    const contentArea = document.querySelector('.content-area');
    const generateNftsTab = document.getElementById('generate-nfts');
    
    if (contentArea && generateNftsTab && generateNftsTab.classList.contains('active')) {
      // Force add class if not present
      contentArea.classList.add('generate-nfts-content-active');
      // Force apply inline styles IMMEDIATELY - these override ALL CSS
      // CRITICAL: Also check computed styles and force override if needed
      const computedStyle = window.getComputedStyle(contentArea);
      const computedHeight = computedStyle.height;
      const computedMarginTop = computedStyle.marginTop;
      
      // If computed styles show wrong values, force override
      // Check if height contains calc() or is not 853.55px
      if (computedHeight.includes('calc') || (computedHeight !== '853.55px' && parseFloat(computedHeight) > 853.55)) {
        // Force remove any inline styles that might interfere
        contentArea.style.removeProperty('height');
        contentArea.style.removeProperty('min-height');
        contentArea.style.removeProperty('max-height');
      }
      // Check if margin-top is greater than 0
      if (parseFloat(computedMarginTop) > 0) {
        contentArea.style.removeProperty('margin-top');
      }
      
      // Now force apply correct values
      contentArea.style.setProperty('margin-top', '0', 'important');
      contentArea.style.setProperty('height', 'auto', 'important'); // Use auto to fit content and eliminate empty space
      contentArea.style.setProperty('min-height', '0', 'important');
      contentArea.style.setProperty('max-height', 'none', 'important');
      
      // Also check if parent elements are affecting it
      const projectInterface = contentArea.closest('.project-interface');
      if (projectInterface) {
        projectInterface.classList.add('generate-nfts-active');
      }
    }
  }

  // Run immediately and on DOMContentLoaded
  function init() {
    // Inject style tag FIRST
    injectStyleTag();
    removeInlineStyles();
    forceApplyFix();
    // Use requestAnimationFrame for immediate updates
    requestAnimationFrame(forceApplyFix);
    requestAnimationFrame(() => requestAnimationFrame(forceApplyFix));
    
    // CRITICAL: Removed all aggressive setTimeout calls that were causing flickering
    // These were constantly modifying styles during tab switches, causing visual glitches
    // The MutationObserver and hookIntoNavigation will handle style fixes when needed
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Run when Generate NFTs tab becomes active - OPTIMIZED to prevent flickering
  let isProcessing = false; // Prevent multiple simultaneous operations
  let isTabSwitching = false; // Track if we're in the middle of a tab switch
  const observer = new MutationObserver(function(mutations) {
    // DEBUG: Track MutationObserver activity
    const mutationTime = performance.now();
    // console.log(`[FLICKER DEBUG] MutationObserver fired: isProcessing=${isProcessing}, isTabSwitching=${isTabSwitching}, mutations=${mutations.length}`);
    
    // Skip if already processing or if we're switching tabs to prevent flickering
    if (isProcessing || isTabSwitching) {
      // console.log(`[FLICKER DEBUG] MutationObserver skipped: isProcessing=${isProcessing}, isTabSwitching=${isTabSwitching}`);
      return;
    }
    
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        // console.log(`[FLICKER DEBUG] MutationObserver: attribute change on ${target.id || target.className}, attribute=${mutation.attributeName}`);
        
        if (target.id === 'generate-nfts' && target.classList.contains('active')) {
          // console.log(`[FLICKER DEBUG] MutationObserver: generate-nfts became active, processing...`);
          isProcessing = true;
          // Inject style tag to ensure CSS is available
          injectStyleTag();
          // Execute immediately - no delays to prevent flickering
          removeInlineStyles();
          forceApplyFix();
          // Use single requestAnimationFrame for layout-dependent operations only
          requestAnimationFrame(() => {
            forceApplyFix();
            isProcessing = false;
            // console.log(`[FLICKER DEBUG] MutationObserver: finished processing generate-nfts active`);
          });
        }
        // Also watch for project-interface style changes - OPTIMIZED
        if (target.classList && target.classList.contains('project-interface') && !isProcessing) {
          // console.log(`[FLICKER DEBUG] MutationObserver: project-interface style change, processing...`);
          isProcessing = true;
          requestAnimationFrame(() => {
            removeInlineStyles();
            forceApplyFix();
            isProcessing = false;
            // console.log(`[FLICKER DEBUG] MutationObserver: finished processing project-interface`);
          });
        }
        // Watch for content-area style changes - OPTIMIZED
        if (target.classList && target.classList.contains('content-area') && !isProcessing) {
          // console.log(`[FLICKER DEBUG] MutationObserver: content-area style change, processing...`);
          isProcessing = true;
          requestAnimationFrame(() => {
            removeInlineStyles();
            forceApplyFix();
            isProcessing = false;
            // console.log(`[FLICKER DEBUG] MutationObserver: finished processing content-area`);
          });
        }
      }
    });
  });
  
  // Observe the generate-nfts element, project-interface, and content-area
  const generateNftsTab = document.getElementById('generate-nfts');
  const projectInterface = document.querySelector('.project-interface');
  const contentArea = document.querySelector('.content-area');
  
  if (generateNftsTab) {
    observer.observe(generateNftsTab, { attributes: true, attributeFilter: ['class'] });
  }
  if (projectInterface) {
    observer.observe(projectInterface, { attributes: true, attributeFilter: ['style', 'class'] });
  }
  if (contentArea) {
    observer.observe(contentArea, { attributes: true, attributeFilter: ['style', 'class'] });
    // Also observe style changes directly - OPTIMIZED to prevent flickering
    let styleProcessing = false;
    const styleObserver = new MutationObserver(function(mutations) {
      // Skip if already processing to prevent flickering
      if (styleProcessing) return;
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          // Only process if generate-nfts tab is active
          const generateNftsTab = document.getElementById('generate-nfts');
          if (generateNftsTab && generateNftsTab.classList.contains('active')) {
            styleProcessing = true;
            // Use single requestAnimationFrame to prevent flickering
            requestAnimationFrame(() => {
              forceApplyFix();
              styleProcessing = false;
            });
          }
        }
      });
    });
    styleObserver.observe(contentArea, { attributes: true, attributeFilter: ['style'] });
  }
  
  // Also observe tab switching via navigation - OPTIMIZED to prevent flickering
  // Use a single requestAnimationFrame instead of multiple setTimeout calls
  // Note: isTabSwitching is already declared above in the MutationObserver scope
  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-tab="generate-nfts"]')) {
      // Mark that we're switching tabs to prevent MutationObserver interference
      isTabSwitching = true;
      // Use single requestAnimationFrame to defer operations until after tab switch completes
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          removeInlineStyles();
          forceApplyFix();
          isTabSwitching = false;
        });
      });
    }
  });
  
  // Hook into navigation module's showTab function
  // CRITICAL: Use a module-level flag to prevent duplicate hooks across all attempts
  let _hookAttempted = false;
  let _hookSuccess = false;
  
  function hookIntoNavigation() {
    // CRITICAL: Prevent duplicate hook attempts
    if (_hookAttempted && _hookSuccess) {
      // console.log(`[FLICKER DEBUG] remove-inline-styles: Hook already successful, skipping`);
      return;
    }
    
    _hookAttempted = true;
    
    const navigationModule = window.NFTApp?.getModule('navigation');
    /* console.log(`[FLICKER DEBUG] remove-inline-styles: Attempting to hook into navigation module`, {
      hasNFTApp: !!window.NFTApp,
      hasNavigationModule: !!navigationModule,
      hasShowTab: !!(navigationModule && typeof navigationModule.showTab === 'function'),
      alreadyHooked: !!(navigationModule && navigationModule.showTab && navigationModule.showTab._removeInlineStylesHooked),
      hookSuccess: _hookSuccess
    }); */
    
    if (navigationModule && typeof navigationModule.showTab === 'function') {
      // Check if already hooked to prevent duplicate hooks
      if (navigationModule.showTab._removeInlineStylesHooked) {
        // console.log(`[FLICKER DEBUG] remove-inline-styles: Already hooked, marking as success`);
        _hookSuccess = true;
        return; // Already hooked
      }
      
      const originalShowTab = navigationModule.showTab;
      navigationModule.showTab = function(tabId, isUserInitiated) {
        // console.log(`[FLICKER DEBUG] remove-inline-styles hook: showTab(${tabId}) called`);
        
        // CRITICAL: Set isTabSwitching flag BEFORE calling originalShowTab to prevent MutationObserver from firing
        if (tabId === 'generate-nfts') {
          // console.log(`[FLICKER DEBUG] remove-inline-styles: Setting isTabSwitching=true BEFORE showTab`);
          isTabSwitching = true;
        }
        
        const result = originalShowTab.call(this, tabId, isUserInitiated);
        
        // Defer operations to avoid blocking tab switch
        if (tabId === 'generate-nfts') {
          // console.log(`[FLICKER DEBUG] remove-inline-styles: Deferring operations for generate-nfts`);
          // Use triple requestAnimationFrame to ensure tab is fully visible and height is stable
          // This prevents removeInlineStyles from clearing the preserved height too early
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              requestAnimationFrame(() => {
                // console.log(`[FLICKER DEBUG] remove-inline-styles: Executing deferred operations (tab should be fully visible now)`);
                
                // CRITICAL: Check if height was preserved and needs to be set to auto
                // Check both the data attribute (most reliable) and inline styles
                const contentArea = document.querySelector('.content-area');
                const generateNftsTab = document.getElementById('generate-nfts');
                
                if (contentArea) {
                  const preservedHeightAttr = contentArea.getAttribute('data-preserved-height');
                  const currentHeight = contentArea.style.getPropertyValue('height');
                  const currentMinHeight = contentArea.style.getPropertyValue('min-height');
                  
                  // Check if we have a preserved height (from data attribute or inline style)
                  const hasPreservedHeight = preservedHeightAttr || 
                                            (currentHeight && currentHeight !== 'auto' && currentHeight.includes('px')) ||
                                            (currentMinHeight && currentMinHeight !== '0' && currentMinHeight !== '0px' && currentMinHeight.includes('px'));
                  
                  // console.log(`[FLICKER DEBUG] remove-inline-styles: Checking preserved height: attr=${preservedHeightAttr}, height=${currentHeight}, minHeight=${currentMinHeight}, hasPreserved=${!!hasPreservedHeight}`);
                  
                  if (hasPreservedHeight) {
                    // CRITICAL: Before setting to auto, ensure the generate-nfts tab content is fully rendered
                    // Check if the tab has actual content height to prevent collapse
                    const tabContentHeight = generateNftsTab ? generateNftsTab.offsetHeight : 0;
                    const tabScrollHeight = generateNftsTab ? generateNftsTab.scrollHeight : 0;
                    const actualContentHeight = Math.max(tabContentHeight, tabScrollHeight);
                    
                    // console.log(`[FLICKER DEBUG] remove-inline-styles: Tab content height check: offsetHeight=${tabContentHeight}, scrollHeight=${tabScrollHeight}, actual=${actualContentHeight}`);
                    
                    // Use the data attribute value if available, otherwise use the inline style
                    const heightToUse = preservedHeightAttr || currentHeight || currentMinHeight;
                    
                    // Only set to auto if the tab content has actual height (is rendered)
                    // Otherwise, keep the preserved height to prevent collapse
                    if (actualContentHeight > 100) {
                      // console.log(`[FLICKER DEBUG] remove-inline-styles: Preserved height detected (${heightToUse}), tab content is rendered (${actualContentHeight}px), setting to auto now`);
                      // Set to auto now that tab is fully visible and stable
                      contentArea.style.setProperty('height', 'auto', 'important');
                      contentArea.style.setProperty('min-height', '0', 'important');
                      // Clear the data attribute since we've now set it to auto
                      contentArea.removeAttribute('data-preserved-height');
                    } else {
                      // console.log(`[FLICKER DEBUG] remove-inline-styles: Preserved height detected (${heightToUse}), but tab content not fully rendered yet (${actualContentHeight}px), keeping preserved height`);
                      // Re-apply preserved height to ensure it doesn't collapse
                      if (heightToUse) {
                        contentArea.style.setProperty('height', heightToUse, 'important');
                        contentArea.style.setProperty('min-height', heightToUse, 'important');
                      }
                      // Retry after a short delay
                      setTimeout(() => {
                        const retryContentHeight = generateNftsTab ? generateNftsTab.offsetHeight : 0;
                        if (retryContentHeight > 100) {
                          // console.log(`[FLICKER DEBUG] remove-inline-styles: Retry - tab content now rendered (${retryContentHeight}px), setting to auto`);
                          contentArea.style.setProperty('height', 'auto', 'important');
                          contentArea.style.setProperty('min-height', '0', 'important');
                          contentArea.removeAttribute('data-preserved-height');
                        }
                      }, 50);
                    }
                  } else {
                    // console.log(`[FLICKER DEBUG] remove-inline-styles: No preserved height detected, skipping height=auto`);
                  }
                }
                
                // Now it's safe to remove inline styles
                isTabSwitching = false; // Clear flag BEFORE calling removeInlineStyles
                removeInlineStyles();
                forceApplyFix();
                // console.log(`[FLICKER DEBUG] remove-inline-styles: Finished deferred operations, isTabSwitching=false`);
              });
            });
          });
        } else {
          // If switching away from generate-nfts, reset the flag
          // console.log(`[FLICKER DEBUG] remove-inline-styles: Switching away from generate-nfts, resetting flag`);
          isTabSwitching = false;
        }
        return result;
      };
      
      // Mark as hooked to prevent duplicate hooks
      navigationModule.showTab._removeInlineStylesHooked = true;
      _hookSuccess = true;
      console.log(`[FLICKER DEBUG] remove-inline-styles: Successfully hooked into navigation.showTab`);
    } else {
      console.log(`[FLICKER DEBUG] remove-inline-styles: Navigation module not available yet, will retry`);
      _hookAttempted = false; // Reset so we can retry
    }
  }
  
  // CRITICAL: Only attempt to hook once, using a single retry mechanism
  // This prevents duplicate hooks that cause flickering
  let hookAttempts = 0;
  const MAX_HOOK_ATTEMPTS = 3;
  
  const attemptHook = () => {
    if (_hookSuccess) {
      return; // Already successful, don't retry
    }
    
    hookAttempts++;
    if (hookAttempts > MAX_HOOK_ATTEMPTS) {
      console.log(`[FLICKER DEBUG] remove-inline-styles: Max hook attempts reached, giving up`);
      return;
    }
    
    hookIntoNavigation();
    
    // If not successful, retry after a delay
    if (!_hookSuccess && hookAttempts < MAX_HOOK_ATTEMPTS) {
      setTimeout(attemptHook, 100 * hookAttempts); // Exponential backoff
    }
  };
  
  // Try to hook into navigation - use requestAnimationFrame for immediate execution
  requestAnimationFrame(() => {
    attemptHook();
  });
  
  // Also try when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(attemptHook, 50);
    });
  } else {
    // DOM already ready, try after a short delay
    setTimeout(attemptHook, 100);
  }

  // CONSTANT MONITORING: Check periodically (not every frame) if Generate NFTs is active and apply fix
  // Use throttling to avoid performance issues
  let lastMonitorTime = 0;
  const MONITOR_INTERVAL = 100; // Check every 100ms instead of every frame
  
  function constantMonitor() {
    const now = performance.now();
    if (now - lastMonitorTime < MONITOR_INTERVAL) {
      return; // Skip if called too frequently
    }
    lastMonitorTime = now;
    
    const generateNftsTab = document.getElementById('generate-nfts');
    const contentArea = document.querySelector('.content-area');
    
    if (generateNftsTab && generateNftsTab.classList.contains('active') && contentArea) {
      // Ensure class is always present
      contentArea.classList.add('generate-nfts-content-active');
      // Force apply fix - this will override any CSS
      forceApplyFix();
      
      // Also check if styles are being overridden and reapply
      const currentHeight = contentArea.style.getPropertyValue('height');
      const currentMarginTop = contentArea.style.getPropertyValue('margin-top');
      
      // Check if height is not auto or margin-top is not 0
      if ((currentHeight !== 'auto' && currentHeight !== '') || (currentMarginTop !== '0px' && currentMarginTop !== '')) {
        forceApplyFix();
      }
    }
  }
  
  // Run constant monitoring periodically (not every frame) - OPTIMIZED
  setInterval(function() {
    constantMonitor();
    injectStyleTag(); // Re-inject style tag periodically to ensure it's always present
  }, MONITOR_INTERVAL); // Use same interval as throttling
})();

