/**
 * Simple Tab Scroll Test
 * Test which tabs are scrollable vs frozen
 */

// Simple test function - copy and paste this into console
window.testTabScrollSetup = function() {
  console.log('=== TAB SCROLL SETUP TEST ===');
  
  const tabs = document.querySelectorAll('.tab-content');
  if (tabs.length === 0) {
    console.log('❌ No tabs found');
    return;
  }
  
  tabs.forEach(tab => {
    const computedStyle = getComputedStyle(tab);
    const state = {
      id: tab.id,
      isActive: tab.classList.contains('active'),
      overflowY: computedStyle.overflowY,
      scrollbarWidth: computedStyle.scrollbarWidth,
      canScroll: tab.scrollHeight > tab.clientHeight,
      scrollHeight: tab.scrollHeight,
      clientHeight: tab.clientHeight
    };
    
    // Determine if tab is frozen or scrollable
    const isFrozen = state.overflowY === 'hidden';
    const status = isFrozen ? '🔒 FROZEN' : '📜 SCROLLABLE';
    
    console.log(`${status} - Tab ${tab.id}:`, state);
  });
  
  console.log('=== TEST COMPLETE ===');
  console.log('Expected: Collection Info and Generate NFTs should be FROZEN');
  console.log('Expected: All other tabs should be SCROLLABLE');
};

// Simple cleanup function - copy and paste this into console
window.cleanupLocalStorage = function() {
  console.log('🧹 Cleaning up localStorage...');
  
  let removedCount = 0;
  const keysToRemove = [];
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      if (key.startsWith('trait_backup_') || 
          (key.startsWith('nftSeedList_') && !key.includes('currentProject'))) {
        keysToRemove.push(key);
      }
      try {
        const value = localStorage.getItem(key);
        if (value && value.length > 100000) {
          keysToRemove.push(key);
        }
      } catch (e) {}
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    removedCount++;
  });
  
  console.log(`✅ Cleaned up ${removedCount} localStorage items`);
};

// Force freeze specific tabs - copy and paste this into console
window.forceFreezeTabs = function() {
  console.log('🔒 Force freezing Collection Info and Generate NFTs tabs...');
  
  // Freeze Collection Info tab
  const collectionInfo = document.getElementById('collection-info') || document.getElementById('general-info');
  if (collectionInfo) {
    collectionInfo.style.overflowY = 'hidden';
    collectionInfo.style.overflowX = 'hidden';
    collectionInfo.style.scrollbarWidth = 'none';
    collectionInfo.style.msOverflowStyle = 'none';
    console.log('✅ Collection Info tab frozen');
  } else {
    console.log('❌ Collection Info tab not found');
  }
  
  // Freeze Generate NFTs tab
  const generateNfts = document.getElementById('generate-nfts');
  if (generateNfts) {
    generateNfts.style.overflowY = 'hidden';
    generateNfts.style.overflowX = 'hidden';
    generateNfts.style.scrollbarWidth = 'none';
    generateNfts.style.msOverflowStyle = 'none';
    console.log('✅ Generate NFTs tab frozen');
  } else {
    console.log('❌ Generate NFTs tab not found');
  }
  
  console.log('🔒 Force freeze complete!');
};

console.log('🔧 Simple Tab Scroll Test Functions Loaded!');
console.log('Available functions:');
console.log('- testTabScrollSetup() - Test which tabs are scrollable vs frozen');
console.log('- cleanupLocalStorage() - Clean up localStorage to reduce quota errors');
console.log('- forceFreezeTabs() - Force freeze Collection Info and Generate NFTs tabs');
