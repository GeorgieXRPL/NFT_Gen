/**
 * Trait Image Guarantee System
 * This script ensures that trait images are ALWAYS available throughout the app
 * by monitoring and restoring trait imageData whenever it's missing.
 */
(function() {
  console.log("🛡️ Initializing Trait Image Guarantee System...");

  // Configuration
  const config = {
    checkInterval: 2000, // Check every 2 seconds
    maxRetries: 10,
    debugMode: true
  };

  let checkCount = 0;
  let isMonitoring = false;

  // Main function to ensure all traits have imageData
  function ensureAllTraitsHaveImages() {
    if (!window.currentProject || !window.currentProject.traits) {
      if (config.debugMode) console.log("🛡️ No project data available yet");
      return false;
    }

    let restoredCount = 0;
    let missingCount = 0;
    let totalTraits = 0;

    console.log("🛡️ TRAIT IMAGE GUARANTEE CHECK #" + (++checkCount));

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalTraits++;
          
          if (!trait.imageData) {
            missingCount++;
            console.warn(`🛡️ Missing imageData for trait: ${layer.name} - ${trait.name}`);
            
            // Try to restore from various sources
            if (restoreTraitImageData(trait, layer)) {
              restoredCount++;
              console.log(`✅ Restored imageData for: ${trait.name}`);
            }
          }
        }
      }
    }

    if (config.debugMode) {
      console.log(`🛡️ GUARANTEE SUMMARY: ${totalTraits} total, ${restoredCount} restored, ${missingCount} still missing`);
    }

    return restoredCount > 0;
  }

  // Function to restore trait imageData from various sources
  function restoreTraitImageData(trait, layer) {
    // Source 1: Check if trait has image property
    if (trait.image && typeof trait.image === 'string') {
      trait.imageData = trait.image;
      return true;
    }

    // Source 2: Check if trait has imageSrc property
    if (trait.imageSrc) {
      trait.imageData = trait.imageSrc;
      return true;
    }

    // Source 3: Check if trait has src property
    if (trait.src) {
      trait.imageData = trait.src;
      return true;
    }

    // Source 4: Try to find in localStorage backup
    const backupKey = `trait_backup_${trait.id}`;
    const backupData = localStorage.getItem(backupKey);
    if (backupData) {
      try {
        const backup = JSON.parse(backupData);
        if (backup.imageData) {
          trait.imageData = backup.imageData;
          return true;
        }
      } catch (e) {
        console.warn("Failed to parse backup data for trait:", trait.name);
      }
    }

    // Source 5: Check if there's a file path and try to load it
    if (trait.filePath && !trait.filePath.startsWith('http')) {
      // For local files, we should have imageData - this shouldn't happen
      console.warn(`🛡️ Local file trait missing imageData: ${trait.name} (${trait.filePath})`);
      
      // DISABLED: Don't trigger recovery system to prevent CORS errors
      console.log(`🛡️ Skipping recovery for local file trait: ${trait.name} (CORS prevention)`);
    }

    return false;
  }

  // Function to backup trait imageData to localStorage (with size check)
  function backupTraitImageData(trait) {
    if (!trait.imageData || !trait.id) return;

    const backupKey = `trait_backup_${trait.id}`;
    const backupData = {
      id: trait.id,
      name: trait.name,
      imageData: trait.imageData,
      timestamp: Date.now()
    };

    try {
      // Check if the data would exceed localStorage quota
      const dataString = JSON.stringify(backupData);
      const dataSize = new Blob([dataString]).size;
      
      // If data is too large (>1MB), skip localStorage backup
      if (dataSize > 1024 * 1024) {
        console.log(`⚠️ Skipping localStorage backup for trait ${trait.name} (${(dataSize / 1024).toFixed(1)}KB - too large)`);
        return;
      }

      localStorage.setItem(backupKey, dataString);
      console.log(`✅ Backed up trait ${trait.name} to localStorage (${(dataSize / 1024).toFixed(1)}KB)`);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.warn(`⚠️ localStorage quota exceeded, skipping backup for trait ${trait.name}`);
        // Clean up old backups to make space
        cleanupOldBackups();
      } else {
        console.error(`❌ Error backing up trait ${trait.name}:`, error);
      }
    }
  }

  // Function to clean up old backups to free localStorage space
  function cleanupOldBackups() {
    try {
      const backupKeys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('trait_backup_')) {
          backupKeys.push(key);
        }
      }

      // Sort by timestamp (oldest first)
      backupKeys.sort((a, b) => {
        try {
          const dataA = JSON.parse(localStorage.getItem(a));
          const dataB = JSON.parse(localStorage.getItem(b));
          return (dataA.timestamp || 0) - (dataB.timestamp || 0);
        } catch {
          return 0;
        }
      });

      // Remove oldest 25% of backups
      const removeCount = Math.floor(backupKeys.length * 0.25);
      for (let i = 0; i < removeCount; i++) {
        localStorage.removeItem(backupKeys[i]);
        console.log(`🗑️ Removed old backup: ${backupKeys[i]}`);
      }

      console.log(`🧹 Cleaned up ${removeCount} old backups`);
    } catch (error) {
      console.error('❌ Error cleaning up backups:', error);
    }
  }

  // Function to backup all trait imageData (with size management)
  function backupAllTraitImageData() {
    if (!window.currentProject || !window.currentProject.traits) return;

    let backupCount = 0;
    let skippedCount = 0;
    let totalSize = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (trait.imageData) {
            // Check size before attempting backup
            const dataString = JSON.stringify({
              id: trait.id,
              name: trait.name,
              imageData: trait.imageData,
              timestamp: Date.now()
            });
            const dataSize = new Blob([dataString]).size;
            totalSize += dataSize;

            // Only backup if size is reasonable (<1MB per trait)
            if (dataSize < 1024 * 1024) {
              backupTraitImageData(trait);
              backupCount++;
            } else {
              console.log(`⚠️ Skipping backup for large trait: ${trait.name} (${(dataSize / 1024).toFixed(1)}KB)`);
              skippedCount++;
            }
          }
        }
      }
    }

    if (config.debugMode) {
      console.log(`🛡️ Backup summary: ${backupCount} backed up, ${skippedCount} skipped, total size: ${(totalSize / 1024 / 1024).toFixed(2)}MB`);
    }
  }

  // Function to restore all trait imageData from localStorage
  function restoreAllTraitImageDataFromBackup() {
    if (!window.currentProject || !window.currentProject.traits) return;

    let restoredCount = 0;
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData) {
            const backupKey = `trait_backup_${trait.id}`;
            const backupData = localStorage.getItem(backupKey);
            if (backupData) {
              try {
                const backup = JSON.parse(backupData);
                if (backup.imageData) {
                  trait.imageData = backup.imageData;
                  restoredCount++;
                }
              } catch (e) {
                console.warn("Failed to restore backup for trait:", trait.name);
              }
            }
          }
        }
      }
    }

    if (config.debugMode) {
      console.log(`🛡️ Restored ${restoredCount} trait images from localStorage backup`);
    }

    return restoredCount;
  }

  // Monitor for project changes
  function startMonitoring() {
    if (isMonitoring) return;
    isMonitoring = true;

    console.log("🛡️ Starting trait image monitoring...");

    // Initial backup
    setTimeout(() => {
      backupAllTraitImageData();
    }, 1000);

    // Periodic checks
    const monitorInterval = setInterval(() => {
      if (ensureAllTraitsHaveImages()) {
        // If we restored any images, backup them
        backupAllTraitImageData();
      }
    }, config.checkInterval);

    // Stop monitoring after max retries
    setTimeout(() => {
      clearInterval(monitorInterval);
      isMonitoring = false;
      console.log("🛡️ Trait image monitoring completed");
    }, config.checkInterval * config.maxRetries);
  }

  // Override project loading to ensure trait images are preserved
  function enhanceProjectLoading() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      setTimeout(enhanceProjectLoading, 1000);
      return;
    }

    // Override the load method
    const originalLoad = projectService.load;
    if (originalLoad) {
      projectService.load = function(event) {
        console.log("🛡️ Project loading with trait image guarantee...");
        
        const result = originalLoad.call(this, event);
        
        // After loading, ensure trait images are available
        setTimeout(() => {
          console.log("🛡️ Post-load trait image check...");
          ensureAllTraitsHaveImages();
          backupAllTraitImageData();
          startMonitoring();
        }, 2000);
        
        return result;
      };
    }
  }

  // Override trait image loading to ensure images are always available
  function enhanceTraitImageLoading() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) return;

    // Override loadTraitImagesFromPaths
    const originalLoadTraitImagesFromPaths = projectService.loadTraitImagesFromPaths;
    if (originalLoadTraitImagesFromPaths) {
      projectService.loadTraitImagesFromPaths = async function(traits) {
        console.log("🛡️ Enhanced trait image loading with guarantee...");
        
        // First, ensure all traits have imageData
        ensureAllTraitsHaveImages();
        
        // Call original function
        const result = await originalLoadTraitImagesFromPaths.call(this, traits);
        
        // After loading, ensure images are still available
        setTimeout(() => {
          ensureAllTraitsHaveImages();
          backupAllTraitImageData();
        }, 1000);
        
        return result;
      };
    }
  }

  // Function to clear all localStorage backups
  function clearAllBackups() {
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

      console.log(`🧹 Cleared ${backupKeys.length} trait backups from localStorage`);
      return backupKeys.length;
    } catch (error) {
      console.error('❌ Error clearing backups:', error);
      return 0;
    }
  }

  // Global functions for manual control
  window.traitImageGuarantee = {
    ensureAll: ensureAllTraitsHaveImages,
    backupAll: backupAllTraitImageData,
    restoreAll: restoreAllTraitImageDataFromBackup,
    startMonitoring: startMonitoring,
    clearBackups: clearAllBackups,
    cleanupOldBackups: cleanupOldBackups,
    checkIntegrity: function() {
      if (!window.currentProject || !window.currentProject.traits) {
        console.log("❌ No project data available");
        return;
      }

      let totalTraits = 0;
      let traitsWithImages = 0;
      let traitsWithoutImages = 0;

      for (const layer of window.currentProject.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            totalTraits++;
            if (trait.imageData) {
              traitsWithImages++;
            } else {
              traitsWithoutImages++;
              console.warn(`❌ Missing imageData: ${layer.name} - ${trait.name}`);
            }
          }
        }
      }

      console.log(`🛡️ INTEGRITY CHECK: ${totalTraits} total, ${traitsWithImages} with images, ${traitsWithoutImages} missing`);
      console.log(`📈 Coverage: ${((traitsWithImages / totalTraits) * 100).toFixed(1)}%`);

      return {
        total: totalTraits,
        withImages: traitsWithImages,
        withoutImages: traitsWithoutImages,
        coverage: (traitsWithImages / totalTraits) * 100
      };
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("🛡️ DOM ready, initializing Trait Image Guarantee...");
    
    setTimeout(() => {
      enhanceProjectLoading();
      enhanceTraitImageLoading();
      startMonitoring();
      console.log("🛡️ Trait Image Guarantee System initialized!");
    }, 2000);
  });

  // Also initialize immediately if DOM is already ready
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already ready
    setTimeout(() => {
      enhanceProjectLoading();
      enhanceTraitImageLoading();
      startMonitoring();
      console.log("🛡️ Trait Image Guarantee System initialized!");
    }, 2000);
  }

})();
