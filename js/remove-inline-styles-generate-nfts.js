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
        // Force remove ALL height and margin styles first - IMMEDIATELY
        contentArea.style.removeProperty('margin-top');
        contentArea.style.removeProperty('height');
        contentArea.style.removeProperty('min-height');
        contentArea.style.removeProperty('max-height');
        // Add class to enable CSS targeting
        contentArea.classList.add('generate-nfts-content-active');
        // Force apply via JavaScript IMMEDIATELY - inline styles override CSS
        // This ensures the fix works even if CSS doesn't load or is overridden
        contentArea.style.setProperty('margin-top', '0', 'important');
        contentArea.style.setProperty('height', 'auto', 'important'); // Use auto to fit content and eliminate empty space
        contentArea.style.setProperty('min-height', '0', 'important');
        contentArea.style.setProperty('max-height', 'none', 'important');
        // Also force multiple times to catch any late-applied styles
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 0);
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 10);
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 25);
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 50);
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 100);
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 200);
        setTimeout(function() {
          if (contentArea.classList.contains('generate-nfts-content-active')) {
            contentArea.style.setProperty('margin-top', '0', 'important');
            contentArea.style.setProperty('height', '853.55px', 'important');
            contentArea.style.setProperty('min-height', '853.55px', 'important');
            contentArea.style.setProperty('max-height', '853.55px', 'important');
          }
        }, 500);
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
    // Also run periodically to catch any late-applied styles - VERY AGGRESSIVE
    setTimeout(removeInlineStyles, 0);
    setTimeout(forceApplyFix, 0);
    setTimeout(removeInlineStyles, 10);
    setTimeout(forceApplyFix, 10);
    setTimeout(removeInlineStyles, 25);
    setTimeout(forceApplyFix, 25);
    setTimeout(removeInlineStyles, 50);
    setTimeout(forceApplyFix, 50);
    setTimeout(removeInlineStyles, 75);
    setTimeout(forceApplyFix, 75);
    setTimeout(removeInlineStyles, 100);
    setTimeout(forceApplyFix, 100);
    setTimeout(removeInlineStyles, 150);
    setTimeout(forceApplyFix, 150);
    setTimeout(removeInlineStyles, 200);
    setTimeout(forceApplyFix, 200);
    setTimeout(removeInlineStyles, 300);
    setTimeout(forceApplyFix, 300);
    setTimeout(removeInlineStyles, 500);
    setTimeout(forceApplyFix, 500);
    setTimeout(removeInlineStyles, 750);
    setTimeout(forceApplyFix, 750);
    setTimeout(removeInlineStyles, 1000);
    setTimeout(forceApplyFix, 1000);
    setTimeout(removeInlineStyles, 1500);
    setTimeout(forceApplyFix, 1500);
    setTimeout(removeInlineStyles, 2000);
    setTimeout(forceApplyFix, 2000);
  }
  
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  
  // Run when Generate NFTs tab becomes active
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'attributes') {
        const target = mutation.target;
        if (target.id === 'generate-nfts' && target.classList.contains('active')) {
          // Inject style tag to ensure CSS is available
          injectStyleTag();
          // Very aggressive - remove styles immediately and multiple times
          removeInlineStyles();
          forceApplyFix();
          requestAnimationFrame(forceApplyFix);
          setTimeout(removeInlineStyles, 0);
          setTimeout(forceApplyFix, 0);
          setTimeout(removeInlineStyles, 10);
          setTimeout(forceApplyFix, 10);
          setTimeout(removeInlineStyles, 25);
          setTimeout(forceApplyFix, 25);
          setTimeout(removeInlineStyles, 50);
          setTimeout(forceApplyFix, 50);
          setTimeout(removeInlineStyles, 100);
          setTimeout(forceApplyFix, 100);
          setTimeout(removeInlineStyles, 200);
          setTimeout(forceApplyFix, 200);
        }
        // Also watch for project-interface style changes
        if (target.classList && target.classList.contains('project-interface')) {
          setTimeout(removeInlineStyles, 0);
          setTimeout(forceApplyFix, 0);
          setTimeout(removeInlineStyles, 10);
          setTimeout(forceApplyFix, 10);
        }
        // Watch for content-area style changes - CRITICAL
        if (target.classList && target.classList.contains('content-area')) {
          setTimeout(removeInlineStyles, 0);
          setTimeout(forceApplyFix, 0);
          setTimeout(removeInlineStyles, 10);
          setTimeout(forceApplyFix, 10);
          // Also watch for style attribute changes
          if (mutation.attributeName === 'style') {
            setTimeout(forceApplyFix, 0);
            setTimeout(forceApplyFix, 10);
            setTimeout(forceApplyFix, 50);
          }
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
    // Also observe style changes directly
    const styleObserver = new MutationObserver(function(mutations) {
      mutations.forEach(function(mutation) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
          forceApplyFix();
          requestAnimationFrame(forceApplyFix);
        }
      });
    });
    styleObserver.observe(contentArea, { attributes: true, attributeFilter: ['style'] });
  }
  
  // Also observe tab switching via navigation
  document.addEventListener('click', function(e) {
    if (e.target.closest('[data-tab="generate-nfts"]')) {
      setTimeout(removeInlineStyles, 0);
      setTimeout(forceApplyFix, 0);
      setTimeout(removeInlineStyles, 50);
      setTimeout(forceApplyFix, 50);
      setTimeout(removeInlineStyles, 200);
      setTimeout(forceApplyFix, 200);
      setTimeout(removeInlineStyles, 500);
      setTimeout(forceApplyFix, 500);
    }
  });
  
  // Hook into navigation module's showTab function
  function hookIntoNavigation() {
    const navigationModule = window.NFTApp?.getModule('navigation');
    if (navigationModule && typeof navigationModule.showTab === 'function') {
      const originalShowTab = navigationModule.showTab;
      navigationModule.showTab = function(tabId, isUserInitiated) {
        const result = originalShowTab.call(this, tabId, isUserInitiated);
        // Run after tab switch - VERY AGGRESSIVE
        if (tabId === 'generate-nfts') {
          setTimeout(removeInlineStyles, 0);
          setTimeout(forceApplyFix, 0);
          requestAnimationFrame(forceApplyFix);
          setTimeout(removeInlineStyles, 10);
          setTimeout(forceApplyFix, 10);
          setTimeout(removeInlineStyles, 100);
          setTimeout(forceApplyFix, 100);
          setTimeout(removeInlineStyles, 500);
          setTimeout(forceApplyFix, 500);
        }
        return result;
      };
    }
  }
  
  // Try to hook into navigation after a delay
  setTimeout(hookIntoNavigation, 100);
  setTimeout(hookIntoNavigation, 500);
  setTimeout(hookIntoNavigation, 1000);
  
  // Listen for custom events that might indicate tab switching
  window.addEventListener('tab-switched', function(e) {
    if (e.detail && e.detail.tab === 'generate-nfts') {
      setTimeout(removeInlineStyles, 0);
      setTimeout(forceApplyFix, 0);
      requestAnimationFrame(forceApplyFix);
      setTimeout(removeInlineStyles, 50);
      setTimeout(forceApplyFix, 50);
      setTimeout(removeInlineStyles, 200);
      setTimeout(forceApplyFix, 200);
      setTimeout(removeInlineStyles, 500);
      setTimeout(forceApplyFix, 500);
    }
  });

  // CONSTANT MONITORING: Check every frame if Generate NFTs is active and apply fix
  function constantMonitor() {
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
  
  // Run constant monitoring every frame - VERY AGGRESSIVE
  setInterval(function() {
    constantMonitor();
    injectStyleTag(); // Re-inject style tag every frame to ensure it's always present
  }, 16); // ~60fps
  
  requestAnimationFrame(function loop() {
    constantMonitor();
    requestAnimationFrame(loop);
  });
})();

