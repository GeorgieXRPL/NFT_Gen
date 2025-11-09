/**
 * Force Tab Freeze and NFT Traits Fix
 * This script ensures tabs are properly frozen and NFT Traits text is visible
 */

(function() {
  console.log('🔒 Starting force tab freeze and NFT Traits fix...');
  
  // Function to force freeze tabs
  function forceFreezeTabs() {
    console.log('🔒 Force freezing tabs...');
    
    // Freeze Collection Info tab
    const collectionInfo = document.getElementById('collection-info') || document.getElementById('general-info');
    if (collectionInfo) {
      collectionInfo.style.setProperty('overflow-y', 'hidden', 'important');
      collectionInfo.style.setProperty('overflow-x', 'hidden', 'important');
      collectionInfo.style.setProperty('scrollbar-width', 'none', 'important');
      collectionInfo.style.setProperty('-ms-overflow-style', 'none', 'important');
      console.log('✅ Collection Info tab force frozen');
    }
    
    // Freeze Generate NFTs tab
    const generateNfts = document.getElementById('generate-nfts');
    if (generateNfts) {
      generateNfts.style.setProperty('overflow-y', 'hidden', 'important');
      generateNfts.style.setProperty('overflow-x', 'hidden', 'important');
      generateNfts.style.setProperty('scrollbar-width', 'none', 'important');
      generateNfts.style.setProperty('-ms-overflow-style', 'none', 'important');
      console.log('✅ Generate NFTs tab force frozen');
    }
  }
  
  // Function to ensure NFT Traits text is visible
  function ensureNFTTraitsVisible() {
    console.log('🔍 Ensuring NFT Traits text is visible...');
    
    const generateNfts = document.getElementById('generate-nfts');
    if (generateNfts) {
      const traitsTitle = generateNfts.querySelector('.traits-title');
      if (traitsTitle) {
        traitsTitle.style.setProperty('display', 'block', 'important');
        traitsTitle.style.setProperty('visibility', 'visible', 'important');
        traitsTitle.style.setProperty('opacity', '1', 'important');
        traitsTitle.style.setProperty('color', '#fff', 'important');
        traitsTitle.style.setProperty('font-size', '1.8rem', 'important');
        traitsTitle.style.setProperty('font-weight', '600', 'important');
        traitsTitle.style.setProperty('text-align', 'center', 'important');
        console.log('✅ NFT Traits title made visible');
      } else {
        console.log('⚠️ NFT Traits title not found in Generate NFTs tab');
      }
    } else {
      console.log('⚠️ Generate NFTs tab not found');
    }
  }
  
  // Function to run fixes
  function runFixes() {
    forceFreezeTabs();
    ensureNFTTraitsVisible();
  }
  
  // Run fixes immediately
  runFixes();
  
  // Run fixes when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runFixes);
  }
  
  // Run fixes periodically to catch dynamically loaded content
  setInterval(runFixes, 2000);
  
  // Also run fixes when Generate NFTs tab is clicked
  document.addEventListener('click', function(e) {
    const tabButton = e.target.closest('[data-tab="generate-nfts"]');
    if (tabButton) {
      setTimeout(runFixes, 500);
    }
  });
  
  console.log('🎉 Force tab freeze and NFT Traits fix system initialized!');
})();
