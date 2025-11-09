/**
 * Automatic Tab Freeze - No console input required
 * This script automatically freezes Collection Info and Generate NFTs tabs
 */

(function() {
  console.log('🔒 Auto-freezing Collection Info and Generate NFTs tabs...');
  
  // Function to freeze a tab
  function freezeTab(tabId) {
    const tab = document.getElementById(tabId);
    if (tab) {
      // For Generate NFTs tab, wait for content to be loaded first
      if (tabId === 'generate-nfts') {
        // Check if the tab has content (traits section)
        const traitsSection = tab.querySelector('.traits-section');
        if (!traitsSection) {
          console.log(`⏳ Generate NFTs tab not ready yet, will retry...`);
          setTimeout(() => freezeTab(tabId), 1000);
          return false;
        }
      }
      
      // Force freeze with inline styles (highest priority)
      tab.style.setProperty('overflow-y', 'hidden', 'important');
      tab.style.setProperty('overflow-x', 'hidden', 'important');
      tab.style.setProperty('scrollbar-width', 'none', 'important');
      tab.style.setProperty('-ms-overflow-style', 'none', 'important');
      
      // Also hide webkit scrollbars
      const style = document.createElement('style');
      style.textContent = `
        #${tabId}::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
      `;
      document.head.appendChild(style);
      
      console.log(`✅ ${tabId} tab frozen automatically`);
      return true;
    }
    return false;
  }
  
  // Function to freeze tabs when they become available
  function autoFreezeTabs() {
    let frozenCount = 0;
    
    // Try to freeze Collection Info (try both possible IDs)
    if (freezeTab('collection-info')) frozenCount++;
    if (freezeTab('general-info')) frozenCount++;
    
    // Try to freeze Generate NFTs
    if (freezeTab('generate-nfts')) frozenCount++;
    
    if (frozenCount > 0) {
      console.log(`🎉 Successfully frozen ${frozenCount} tab(s) automatically!`);
    } else {
      console.log('⏳ Tabs not ready yet, will retry...');
      // Retry after a short delay
      setTimeout(autoFreezeTabs, 500);
    }
  }
  
  // Start the auto-freeze process
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      // Wait a bit longer for Generate NFTs tab to load
      setTimeout(autoFreezeTabs, 2000);
    });
  } else {
    // DOM already loaded
    setTimeout(autoFreezeTabs, 2000);
  }
  
  // Also freeze tabs when they are created dynamically
  const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) { // Element node
            if (node.id === 'collection-info' || node.id === 'general-info' || node.id === 'generate-nfts') {
              console.log(`🔄 New tab detected: ${node.id}, freezing...`);
              freezeTab(node.id);
            }
          }
        });
      }
    });
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('🔒 Auto-freeze system initialized - no console input required!');
})();
