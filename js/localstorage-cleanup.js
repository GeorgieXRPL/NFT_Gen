/**
 * localStorage Cleanup Script
 * This script immediately clears localStorage backups to prevent quota errors
 */
(function() {
  console.log("🧹 Clearing localStorage trait backups to prevent quota errors...");

  try {
    const backupKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trait_backup_')) {
        backupKeys.push(key);
      }
    }

    backupKeys.forEach(key => {
      localStorage.removeItem(key);
    });

    console.log(`✅ Cleared ${backupKeys.length} trait backups from localStorage`);
    
    // Also clear any other large data that might be causing issues
    const largeKeys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value && value.length > 100000) { // >100KB
            largeKeys.push(key);
          }
        } catch (e) {
          // Skip if we can't read the value
        }
      }
    }

    if (largeKeys.length > 0) {
      console.log(`🧹 Found ${largeKeys.length} large localStorage items, clearing them...`);
      largeKeys.forEach(key => {
        localStorage.removeItem(key);
      });
    }

    console.log("✅ localStorage cleanup completed");
    
  } catch (error) {
    console.error("❌ Error during localStorage cleanup:", error);
  }

  // Add global function to manually clear backups
  window.clearTraitBackups = function() {
    try {
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trait_backup_')) {
          backupKeys.push(key);
        }
      }

      backupKeys.forEach(key => {
        localStorage.removeItem(key);
      });

      console.log(`🧹 Manually cleared ${backupKeys.length} trait backups`);
      return backupKeys.length;
    } catch (error) {
      console.error("❌ Error clearing backups:", error);
      return 0;
    }
  };

  console.log("🧹 localStorage cleanup script loaded");
  console.log("Use window.clearTraitBackups() to manually clear backups");

})();
