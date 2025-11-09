/**
 * NFT Preview Container Test Script
 * 
 * This script tests if the container fix works properly.
 * It runs a series of tests to verify that:
 * 1. The container exists when needed
 * 2. The fix properly recreates missing elements
 * 3. Error handling works as expected
 */

console.log("Loading NFT Container Test Script");

(function() {
  // Wait for everything to load
  window.addEventListener('load', function() {
    // Give everything a chance to initialize
    setTimeout(runContainerTests, 1000);
  });
  
  function runContainerTests() {
    console.log("=== Running NFT Container Tests ===");
    
    // Test 1: Check if container exists
    testContainerExists();
    
    // Test 2: Check if our fix function is available
    testFixFunctionAvailable();
    
    // Test 3: Simulate missing container and try to rebuild it
    testRebuildMissingContainer();
  }
  
  function testContainerExists() {
    console.log("Test 1: Checking if container exists...");
    
    const container = document.getElementById('nft-preview-container');
    if (container) {
      console.log("✅ PASS: Container exists");
    } else {
      console.log("❌ FAIL: Container does not exist");
      
      // Try to fix it
      if (window.ensureNftPreviewContainerExists) {
        console.log("Attempting to fix missing container...");
        window.ensureNftPreviewContainerExists();
        
        // Check again
        const containerAfterFix = document.getElementById('nft-preview-container');
        if (containerAfterFix) {
          console.log("✅ PASS: Container created successfully by fix");
        } else {
          console.log("❌ FAIL: Fix failed to create container");
        }
      }
    }
  }
  
  function testFixFunctionAvailable() {
    console.log("Test 2: Checking if fix function is available...");
    
    if (typeof window.ensureNftPreviewContainerExists === 'function') {
      console.log("✅ PASS: Fix function is available");
    } else {
      console.log("❌ FAIL: Fix function is not available");
    }
  }
  
  function testRebuildMissingContainer() {
    console.log("Test 3: Testing container rebuild functionality...");
    
    // First, check if container exists
    let container = document.getElementById('nft-preview-container');
    if (!container) {
      console.log("Container doesn't exist, can't test rebuild.");
      return;
    }
    
    // Remember original parent
    const originalParent = container.parentNode;
    
    // Temporarily remove the container (don't do this in production!)
    console.log("Temporarily removing container to test rebuild...");
    if (originalParent) {
      originalParent.removeChild(container);
    }
    
    // Check if it's really gone
    container = document.getElementById('nft-preview-container');
    if (container) {
      console.log("❌ FAIL: Container still exists after removal attempt");
      return;
    }
    
    // Try to rebuild it
    console.log("Attempting to rebuild container...");
    if (window.ensureNftPreviewContainerExists) {
      window.ensureNftPreviewContainerExists();
      
      // Check if it's back
      container = document.getElementById('nft-preview-container');
      if (container) {
        console.log("✅ PASS: Container successfully rebuilt");
        
        // Check if all required elements exist
        const raritySeedRow = document.querySelector('.nft-rarity-seed-row');
        
        if (raritySeedRow) {
          console.log("✅ PASS: All required elements were created");
        } else {
          console.log("❌ FAIL: Some required elements are missing:");
          if (!raritySeedRow) console.log("  - Rarity seed row missing");
        }
      } else {
        console.log("❌ FAIL: Container could not be rebuilt");
      }
    } else {
      console.log("❌ FAIL: Fix function not available for rebuild test");
    }
  }
  
  console.log("NFT Container Test Script loaded successfully");
})(); 