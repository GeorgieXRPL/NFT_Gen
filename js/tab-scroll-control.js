/**
 * Tab Scroll Control Module
 * Controls which tabs should be scrollable vs fixed
 * All tabs are scrollable by default, specific tabs can be disabled
 */

window.NFTApp.registerModule("tabScrollControl", {
  // Configuration: which tabs should NOT scroll
  nonScrollableTabs: [
    // Add tab IDs here that should NOT scroll
    // Example: 'collection-info', 'general-info'
  ],

  // Initialize the scroll control
  init: function() {
    console.log('[TabScrollControl] Initializing...');
    this.setupScrollControl();
    this.setupTabChangeListener();
  },

  // Set up scroll control for all tabs
  setupScrollControl: function() {
    // Make all tabs scrollable by default
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => {
      this.enableScrolling(tab);
    });
  },

  // Enable scrolling for a tab
  enableScrolling: function(tab) {
    if (!tab) return;
    
    // Remove scroll-disabled class
    tab.classList.remove('scroll-disabled');
    
    // Ensure scrolling is enabled
    tab.style.overflowY = 'auto';
    tab.style.overflowX = 'hidden';
    tab.style.scrollbarWidth = 'auto';
    tab.style.msOverflowStyle = 'scrollbar';
    
    console.log(`[TabScrollControl] Scrolling ENABLED for tab: ${tab.id}`);
  },

  // Disable scrolling for a tab
  disableScrolling: function(tab) {
    if (!tab) return;
    
    // Add scroll-disabled class
    tab.classList.add('scroll-disabled');
    
    // Disable scrolling
    tab.style.overflowY = 'hidden';
    tab.style.overflowX = 'hidden';
    tab.style.scrollbarWidth = 'none';
    tab.style.msOverflowStyle = 'none';
    
    console.log(`[TabScrollControl] Scrolling DISABLED for tab: ${tab.id}`);
  },

  // Set up listener for tab changes
  setupTabChangeListener: function() {
    // Listen for tab changes
    document.addEventListener('click', (e) => {
      const tabButton = e.target.closest('[data-tab]');
      if (tabButton) {
        const tabId = tabButton.getAttribute('data-tab');
        if (tabId) {
          setTimeout(() => {
            this.handleTabChange(tabId);
          }, 100);
        }
      }
    });

    // Also listen for programmatic tab changes
    const originalShowTab = window.NFTApp?.getModule?.('navigation')?.showTab;
    if (originalShowTab) {
      window.NFTApp.getModule('navigation').showTab = (tabId, isUserInitiated) => {
        const result = originalShowTab.call(this, tabId, isUserInitiated);
        setTimeout(() => {
          this.handleTabChange(tabId);
        }, 100);
        return result;
      };
    }
  },

  // Handle tab change
  handleTabChange: function(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return;

    // Check if this tab should be non-scrollable
    if (this.nonScrollableTabs.includes(tabId)) {
      this.disableScrolling(tab);
    } else {
      this.enableScrolling(tab);
    }
  },

  // Add a tab to the non-scrollable list
  addNonScrollableTab: function(tabId) {
    if (!this.nonScrollableTabs.includes(tabId)) {
      this.nonScrollableTabs.push(tabId);
      console.log(`[TabScrollControl] Added ${tabId} to non-scrollable tabs`);
    }
  },

  // Remove a tab from the non-scrollable list
  removeNonScrollableTab: function(tabId) {
    const index = this.nonScrollableTabs.indexOf(tabId);
    if (index > -1) {
      this.nonScrollableTabs.splice(index, 1);
      console.log(`[TabScrollControl] Removed ${tabId} from non-scrollable tabs`);
    }
  },

  // Get current scroll state of a tab
  getScrollState: function(tabId) {
    const tab = document.getElementById(tabId);
    if (!tab) return null;
    
    return {
      isScrollable: !tab.classList.contains('scroll-disabled'),
      canScroll: tab.scrollHeight > tab.clientHeight,
      scrollHeight: tab.scrollHeight,
      clientHeight: tab.clientHeight
    };
  }
});

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.NFTApp.getModule('tabScrollControl')?.init();
  });
} else {
  // DOM already loaded
  setTimeout(() => {
    window.NFTApp.getModule('tabScrollControl')?.init();
  }, 100);
}
