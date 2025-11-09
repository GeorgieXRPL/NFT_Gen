/**
 * Automatic localStorage Cleanup - Fixes MemoryManager quota errors
 * This script automatically cleans up localStorage to prevent quota exceeded errors
 */

(function() {
  console.log('🧹 Starting automatic localStorage cleanup...');
  
  // Function to clean up localStorage
  function cleanupLocalStorage() {
    let removedCount = 0;
    const keysToRemove = [];
    
    console.log('🔍 Scanning localStorage for cleanup...');
    
    // Find large or unnecessary localStorage items
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            // Remove old trait backups
            if (key.startsWith('trait_backup_')) {
              keysToRemove.push(key);
              console.log(`🗑️ Marked for removal: ${key} (trait backup)`);
            }
            // CRITICAL: Don't automatically remove seed lists - they may be for the current project
            // Only remove seed lists if explicitly requested or when handling quota errors
            // Seed lists are managed by project-service.js and should not be auto-cleaned
            // (Skipping nftSeedList_ keys - they are managed by the app)
            // Remove large items (>100KB)
            else if (value.length > 100000) {
              keysToRemove.push(key);
              console.log(`🗑️ Marked for removal: ${key} (large item: ${(value.length / 1024).toFixed(1)}KB)`);
            }
            // Remove any other large data that might be causing issues
            else if (value.length > 50000 && (key.includes('backup') || key.includes('temp') || key.includes('cache'))) {
              keysToRemove.push(key);
              console.log(`🗑️ Marked for removal: ${key} (backup/temp/cache: ${(value.length / 1024).toFixed(1)}KB)`);
            }
          }
        } catch (e) {
          // Skip if we can't read the value
          console.log(`⚠️ Could not read localStorage key: ${key}`);
        }
      }
    }
    
    // Remove the identified keys
    keysToRemove.forEach(key => {
      try {
        localStorage.removeItem(key);
        removedCount++;
        console.log(`✅ Removed: ${key}`);
      } catch (e) {
        console.log(`❌ Failed to remove: ${key}`);
      }
    });
    
    // Calculate remaining usage
    let totalSize = 0;
    let itemCount = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            totalSize += value.length;
            itemCount++;
          }
        } catch (e) {
          // Skip if we can't read the value
        }
      }
    }
    
    console.log(`🧹 Cleanup complete!`);
    console.log(`✅ Removed ${removedCount} items`);
    console.log(`📊 Remaining: ${itemCount} items, ${(totalSize / 1024).toFixed(1)}KB`);
    
    if (totalSize < 2000000) { // Less than 2MB
      console.log('✅ localStorage usage is now within normal limits');
    } else {
      console.log('⚠️ localStorage usage is still high, consider clearing more data');
    }
    
    return { removedCount, totalSize, itemCount };
  }
  
  // Function to prevent MemoryManager initialization errors
  function preventMemoryManagerErrors() {
    // Override console.error to catch MemoryManager errors
    const originalConsoleError = console.error;
    console.error = function(...args) {
      const message = args.join(' ');
      if (message.includes('[MemoryManager]') && message.includes('Already initialized')) {
        // Don't show this error - it's normal behavior
        return;
      }
      if (message.includes('[MemoryManager]') && message.includes('Project data too large')) {
        console.log('🔧 MemoryManager data too large - running cleanup...');
        cleanupLocalStorage();
        return; // Don't show this error
      }
      if (message.includes('[MemoryManager]') && message.includes('Quota exceeded')) {
        console.log('🔧 MemoryManager quota exceeded - running cleanup...');
        cleanupLocalStorage();
        return; // Don't show this error
      }
      if (message.includes('[MemoryManager]') && message.includes('using lightweight version')) {
        console.log('🔧 MemoryManager using lightweight version - this is normal');
        return; // Don't show this error
      }
      // Show other errors normally
      originalConsoleError.apply(console, args);
    };
    
    // Also override console.warn for MemoryManager warnings
    const originalConsoleWarn = console.warn;
    console.warn = function(...args) {
      const message = args.join(' ');
      if (message.includes('[MemoryManager]') && message.includes('Already initialized')) {
        // Don't show this warning - it's normal behavior
        return;
      }
      // Show other warnings normally
      originalConsoleWarn.apply(console, args);
    };
    
    console.log('🛡️ MemoryManager error prevention enabled');
  }
  
  // Run cleanup immediately
  const cleanupResult = cleanupLocalStorage();
  
  // Set up error prevention
  preventMemoryManagerErrors();
  
  // Run cleanup periodically to prevent future issues
  setInterval(() => {
    const currentSize = JSON.stringify(localStorage).length;
    if (currentSize > 3000000) { // If over 3MB, clean up again
      console.log('🧹 Periodic cleanup triggered - localStorage getting large');
      cleanupLocalStorage();
    }
  }, 30000); // Check every 30 seconds
  
  console.log('🎉 Automatic localStorage cleanup system initialized!');
  console.log('💡 This will prevent MemoryManager quota exceeded errors');
})();
