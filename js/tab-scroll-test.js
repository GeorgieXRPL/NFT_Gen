/**
 * Tab Scroll Test Script
 * Use this to test and control tab scrolling behavior
 */

// Test function to check current scroll state
window.testTabScrolling = function() {
  console.log('=== TAB SCROLLING TEST ===');
  
  const tabs = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    const state = {
      id: tab.id,
      isActive: tab.classList.contains('active'),
      isScrollable: !tab.classList.contains('scroll-disabled'),
      canScroll: tab.scrollHeight > tab.clientHeight,
      scrollHeight: tab.scrollHeight,
      clientHeight: tab.clientHeight,
      overflowY: tab.style.overflowY || getComputedStyle(tab).overflowY
    };
    console.log(`Tab ${tab.id}:`, state);
  });
  
  console.log('=== TEST COMPLETE ===');
};

// Function to disable scrolling for a specific tab
window.disableTabScrolling = function(tabId) {
  const tabScrollControl = window.NFTApp?.getModule?.('tabScrollControl');
  if (tabScrollControl) {
    tabScrollControl.addNonScrollableTab(tabId);
    console.log(`✅ Disabled scrolling for tab: ${tabId}`);
  } else {
    console.log('❌ TabScrollControl module not found');
  }
};

// Function to enable scrolling for a specific tab
window.enableTabScrolling = function(tabId) {
  const tabScrollControl = window.NFTApp?.getModule?.('tabScrollControl');
  if (tabScrollControl) {
    tabScrollControl.removeNonScrollableTab(tabId);
    console.log(`✅ Enabled scrolling for tab: ${tabId}`);
  } else {
    console.log('❌ TabScrollControl module not found');
  }
};

// Function to fix Generate NFTs tab scrolling
window.fixGenerateNftsScrolling = function() {
  console.log('🚀 Fixing Generate NFTs tab scrolling...');
  
  // Navigate to Generate NFTs tab
  const navTab = document.querySelector('[data-tab="generate-nfts"]');
  if (navTab) {
    navTab.click();
    console.log('✅ Clicked Generate NFTs tab');
    
    // Wait for tab to load and ensure scrolling is enabled
    setTimeout(() => {
      const tab = document.getElementById('generate-nfts');
      if (tab) {
        // Enable scrolling
        tab.classList.remove('scroll-disabled');
        tab.style.overflowY = 'auto';
        tab.style.scrollbarWidth = 'auto';
        tab.style.msOverflowStyle = 'scrollbar';
        
        console.log('✅ Generate NFTs tab scrolling enabled!');
        console.log('Tab classes:', tab.className);
        
        // Test scrolling
        const canScroll = tab.scrollHeight > tab.clientHeight;
        console.log('📊 Can scroll:', canScroll);
        console.log('📏 Scroll info:', {
          scrollHeight: tab.scrollHeight,
          clientHeight: tab.clientHeight,
          needsScrolling: canScroll
        });
      } else {
        console.log('❌ Generate NFTs tab not found');
      }
    }, 500);
  } else {
    console.log('❌ Generate NFTs nav tab not found');
  }
};

// Function to clean up localStorage
window.cleanupLocalStorage = function() {
  console.log('🧹 Cleaning up localStorage...');
  
  let removedCount = 0;
  const keysToRemove = [];
  
  // Find large or unnecessary localStorage items
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      // Remove old trait backups
      if (key.startsWith('trait_backup_')) {
        keysToRemove.push(key);
      }
      // Remove old seed lists (keep only current project)
      if (key.startsWith('nftSeedList_') && !key.includes('currentProject')) {
        keysToRemove.push(key);
      }
      // Remove large items (>100KB)
      try {
        const value = localStorage.getItem(key);
        if (value && value.length > 100000) {
          keysToRemove.push(key);
        }
      } catch (e) {
        // Skip if we can't read the value
      }
    }
  }
  
  // Remove the identified keys
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    removedCount++;
  });
  
  console.log(`✅ Cleaned up ${removedCount} localStorage items`);
  console.log('💾 Remaining localStorage usage:', JSON.stringify(localStorage).length, 'characters');
};

console.log('🔧 Tab Scroll Test Functions Loaded!');
console.log('Available functions:');
console.log('- testTabScrolling() - Check current scroll state of all tabs');
console.log('- disableTabScrolling(tabId) - Disable scrolling for a specific tab');
console.log('- enableTabScrolling(tabId) - Enable scrolling for a specific tab');
console.log('- fixGenerateNftsScrolling() - Fix Generate NFTs tab scrolling');
console.log('- cleanupLocalStorage() - Clean up localStorage to reduce quota errors');
