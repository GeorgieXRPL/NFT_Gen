/**
 * TAB SCROLLING CONTROLLER
 * 
 * This module provides dynamic control over tab scrolling behavior.
 * You can enable/disable scrolling for specific tabs programmatically.
 * 
 * Usage:
 * - TabScrollingController.enableScrolling('tab-id')
 * - TabScrollingController.disableScrolling('tab-id')
 * - TabScrollingController.toggleScrolling('tab-id')
 * - TabScrollingController.setScrollingConfig(config)
 */

class TabScrollingController {
  constructor() {
    this.scrollingConfig = {
      'general-info': false,     // Collection Info - SCROLL DISABLED
      'traits-rules': true,      // Traits & Rules - SCROLL ENABLED  
      'generate-nfts': false,    // Generate NFTs - SCROLL DISABLED
      'generate-metadata': false, // Generate Metadata - SCROLL DISABLED (user will decide later)
      'export-nfts': false       // Export NFTs - SCROLL DISABLED (user will decide later)
    };
    
    this.init();
  }

  /**
   * Initialize the scrolling controller
   */
  init() {
    console.log('[TabScrollingController] Initializing...');
    
    // Apply initial scrolling configuration
    this.applyScrollingConfig();
    
    // Listen for tab changes to apply scrolling settings
    this.setupTabChangeListener();
    
    console.log('[TabScrollingController] Initialized successfully');
  }

  /**
   * Apply the current scrolling configuration to all tabs
   */
  applyScrollingConfig() {
    Object.entries(this.scrollingConfig).forEach(([tabId, canScroll]) => {
      const tab = document.getElementById(tabId);
      if (tab) {
        if (canScroll) {
          this.enableScrolling(tabId);
        } else {
          this.disableScrolling(tabId);
        }
      }
    });
  }

  /**
   * Enable scrolling for a specific tab
   * @param {string} tabId - The ID of the tab
   */
  enableScrolling(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
      // Remove scroll-disabled class
      tab.classList.remove('scroll-disabled');
      
      // Add scroll-enabled class
      tab.classList.add('scroll-enabled');
      
      // Apply scrolling styles - use browser's native scrollbar
      tab.style.overflowY = 'auto';
      tab.style.overflowX = 'hidden';
      
      // Remove any custom scrollbar styling to use browser's native scrollbar
      tab.style.scrollbarWidth = 'auto';
      tab.style.msOverflowStyle = 'scrollbar';
      
      // Update configuration
      this.scrollingConfig[tabId] = true;
      
      console.log(`[TabScrollingController] Scrolling ENABLED for tab: ${tabId}`);
    } else {
      console.warn(`[TabScrollingController] Tab not found: ${tabId}`);
    }
  }

  /**
   * Disable scrolling for a specific tab
   * @param {string} tabId - The ID of the tab
   */
  disableScrolling(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
      // Remove scroll-enabled class
      tab.classList.remove('scroll-enabled');
      
      // Add scroll-disabled class
      tab.classList.add('scroll-disabled');
      
      // Apply non-scrolling styles
      tab.style.overflowY = 'hidden';
      tab.style.overflowX = 'hidden';
      
      // Update configuration
      this.scrollingConfig[tabId] = false;
      
      console.log(`[TabScrollingController] Scrolling DISABLED for tab: ${tabId}`);
    } else {
      console.warn(`[TabScrollingController] Tab not found: ${tabId}`);
    }
  }

  /**
   * Toggle scrolling for a specific tab
   * @param {string} tabId - The ID of the tab
   */
  toggleScrolling(tabId) {
    const currentState = this.scrollingConfig[tabId];
    if (currentState) {
      this.disableScrolling(tabId);
    } else {
      this.enableScrolling(tabId);
    }
  }

  /**
   * Set scrolling configuration for multiple tabs
   * @param {Object} config - Configuration object with tab IDs as keys and boolean values
   */
  setScrollingConfig(config) {
    this.scrollingConfig = { ...this.scrollingConfig, ...config };
    this.applyScrollingConfig();
    console.log('[TabScrollingController] Scrolling configuration updated:', this.scrollingConfig);
  }

  /**
   * Get current scrolling configuration
   * @returns {Object} Current scrolling configuration
   */
  getScrollingConfig() {
    return { ...this.scrollingConfig };
  }

  /**
   * Setup listener for tab changes to apply scrolling settings
   */
  setupTabChangeListener() {
    // Listen for navigation tab clicks
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab');
      if (tab && tab.dataset.tab) {
        const tabId = tab.dataset.tab;
        setTimeout(() => {
          this.applyScrollingToTab(tabId);
        }, 100); // Small delay to ensure tab content is loaded
      }
    });

    // Listen for programmatic tab changes
    const originalShowTab = window.NFTApp?.getModule?.('navigation')?.showTab;
    if (originalShowTab) {
      window.NFTApp.getModule('navigation').showTab = (tabId, isUserInitiated) => {
        const result = originalShowTab.call(this, tabId, isUserInitiated);
        setTimeout(() => {
          this.applyScrollingToTab(tabId);
        }, 100);
        return result;
      };
    }
  }

  /**
   * Apply scrolling settings to a specific tab
   * @param {string} tabId - The ID of the tab
   */
  applyScrollingToTab(tabId) {
    const canScroll = this.scrollingConfig[tabId];
    if (canScroll !== undefined) {
      if (canScroll) {
        this.enableScrolling(tabId);
      } else {
        this.enableScrolling(tabId);
      }
    }
  }

  /**
   * Get scrolling status for a specific tab
   * @param {string} tabId - The ID of the tab
   * @returns {boolean|null} True if scrolling enabled, false if disabled, null if tab not found
   */
  getScrollingStatus(tabId) {
    return this.scrollingConfig[tabId] ?? null;
  }

  /**
   * Reset all tabs to default scrolling behavior
   */
  resetToDefaults() {
    this.scrollingConfig = {
      'general-info': false,     // Collection Info - SCROLL DISABLED
      'traits-rules': true,      // Traits & Rules - SCROLL ENABLED  
      'generate-nfts': false,    // Generate NFTs - SCROLL DISABLED
      'generate-metadata': false, // Generate Metadata - SCROLL DISABLED (user will decide later)
      'export-nfts': false       // Export NFTs - SCROLL DISABLED (user will decide later)
    };
    this.applyScrollingConfig();
    console.log('[TabScrollingController] Reset to default configuration');
  }

  /**
   * Enable debugging mode (shows visual indicators)
   */
  enableDebugMode() {
    const style = document.createElement('style');
    style.textContent = `
      .tab-content.scroll-enabled::before,
      .tab-content.scroll-disabled::before {
        display: block !important;
      }
    `;
    document.head.appendChild(style);
    console.log('[TabScrollingController] Debug mode enabled');
  }

  /**
   * Disable debugging mode
   */
  disableDebugMode() {
    const debugStyles = document.querySelectorAll('style');
    debugStyles.forEach(style => {
      if (style.textContent.includes('TabScrollingController')) {
        style.remove();
      }
    });
    console.log('[TabScrollingController] Debug mode disabled');
  }
}

// Create global instance
window.TabScrollingController = new TabScrollingController();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TabScrollingController;
}
