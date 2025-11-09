/**
 * Trait Memory Management System
 * This script provides comprehensive memory management for traits to prevent
 * memory corruption and ensure trait data integrity.
 */
(function() {
  console.log("🧠 Initializing Trait Memory Management System...");

  // Configuration
  const config = {
    maxMemoryUsage: 100 * 1024 * 1024, // 100MB
    cleanupInterval: 30000, // 30 seconds
    debugMode: true
  };

  // Memory tracking
  let traitMemoryUsage = 0;
  let traitReferences = new Map();
  let cleanupTimer = null;

  // Track trait memory usage
  function trackTraitMemory(trait) {
    if (!trait.id) return;

    const traitData = {
      id: trait.id,
      name: trait.name,
      imageDataSize: trait.imageData ? trait.imageData.length : 0,
      timestamp: Date.now(),
      references: 0
    };

    traitReferences.set(trait.id, traitData);
    traitMemoryUsage += traitData.imageDataSize;

    if (config.debugMode) {
      console.log(`🧠 Tracking trait memory: ${trait.name} (${(traitData.imageDataSize / 1024).toFixed(1)}KB)`);
    }
  }

  // Update trait memory tracking
  function updateTraitMemory(trait) {
    if (!trait.id) return;

    const existingData = traitReferences.get(trait.id);
    if (existingData) {
      // Subtract old size
      traitMemoryUsage -= existingData.imageDataSize;
      
      // Update with new size
      existingData.imageDataSize = trait.imageData ? trait.imageData.length : 0;
      existingData.timestamp = Date.now();
      
      // Add new size
      traitMemoryUsage += existingData.imageDataSize;

      if (config.debugMode) {
        console.log(`🧠 Updated trait memory: ${trait.name} (${(existingData.imageDataSize / 1024).toFixed(1)}KB)`);
      }
    } else {
      trackTraitMemory(trait);
    }
  }

  // Clean up unused trait memory
  function cleanupTraitMemory() {
    const now = Date.now();
    const maxAge = 5 * 60 * 1000; // 5 minutes
    let cleanedCount = 0;
    let freedMemory = 0;

    for (const [traitId, data] of traitReferences.entries()) {
      if (now - data.timestamp > maxAge && data.references === 0) {
        traitReferences.delete(traitId);
        traitMemoryUsage -= data.imageDataSize;
        freedMemory += data.imageDataSize;
        cleanedCount++;
      }
    }

    if (cleanedCount > 0 && config.debugMode) {
      console.log(`🧠 Cleaned up ${cleanedCount} unused traits, freed ${(freedMemory / 1024).toFixed(1)}KB`);
    }
  }

  // Get memory usage statistics
  function getMemoryStats() {
    const stats = {
      totalMemory: traitMemoryUsage,
      totalMemoryMB: (traitMemoryUsage / (1024 * 1024)).toFixed(2),
      traitCount: traitReferences.size,
      maxMemoryMB: (config.maxMemoryUsage / (1024 * 1024)).toFixed(0),
      memoryUsagePercent: ((traitMemoryUsage / config.maxMemoryUsage) * 100).toFixed(1)
    };

    return stats;
  }

  // Validate trait data integrity
  function validateTraitIntegrity(trait) {
    const issues = [];

    if (!trait.id) {
      issues.push("Missing ID");
    }

    if (!trait.name) {
      issues.push("Missing name");
    }

    if (!trait.imageData) {
      issues.push("Missing imageData");
    } else if (typeof trait.imageData !== 'string') {
      issues.push("Invalid imageData type");
    } else if (!trait.imageData.startsWith('data:image/')) {
      issues.push("Invalid imageData format");
    }

    if (issues.length > 0) {
      console.warn(`🧠 Trait integrity issues for ${trait.name}:`, issues);
      return false;
    }

    return true;
  }

  // Safe trait update function
  function safeUpdateTrait(traitId, layerId, updates, projectData) {
    try {
      const layer = projectData.traits.find((l) => l.id === layerId);
      if (!layer) {
        throw new Error(`Layer ${layerId} not found`);
      }

      const trait = layer.traits.find((t) => t.id === traitId);
      if (!trait) {
        throw new Error(`Trait ${traitId} not found`);
      }

      // Validate current trait integrity
      if (!validateTraitIntegrity(trait)) {
        console.warn(`🧠 Trait ${trait.name} has integrity issues before update`);
      }

      // Create backup
      const backup = {
        imageData: trait.imageData,
        image: trait.image,
        filePath: trait.filePath,
        fileName: trait.fileName,
        fileSize: trait.fileSize,
        fileType: trait.fileType,
        lastModified: trait.lastModified
      };

      // Apply updates
      Object.assign(trait, updates);

      // Validate updated trait integrity
      if (!validateTraitIntegrity(trait)) {
        console.error(`🧠 Trait ${trait.name} has integrity issues after update, restoring backup`);
        Object.assign(trait, backup);
        return false;
      }

      // Update memory tracking
      updateTraitMemory(trait);

      if (config.debugMode) {
        console.log(`🧠 Successfully updated trait ${trait.name}`);
      }

      return true;

    } catch (error) {
      console.error(`🧠 Error updating trait ${traitId}:`, error);
      return false;
    }
  }

  // Monitor trait memory usage
  function startMemoryMonitoring() {
    if (cleanupTimer) return;

    cleanupTimer = setInterval(() => {
      const stats = getMemoryStats();
      
      if (config.debugMode) {
        console.log(`🧠 Memory stats: ${stats.traitCount} traits, ${stats.totalMemoryMB}MB (${stats.memoryUsagePercent}%)`);
      }

      // Clean up if memory usage is high
      if (traitMemoryUsage > config.maxMemoryUsage * 0.8) {
        console.log("🧠 High memory usage detected, cleaning up...");
        cleanupTraitMemory();
      }
    }, config.cleanupInterval);

    console.log("🧠 Memory monitoring started");
  }

  // Stop memory monitoring
  function stopMemoryMonitoring() {
    if (cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
      console.log("🧠 Memory monitoring stopped");
    }
  }

  // Initialize trait memory tracking for existing traits
  function initializeTraitTracking() {
    if (!window.currentProject || !window.currentProject.traits) {
      return;
    }

    let trackedCount = 0;
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          trackTraitMemory(trait);
          trackedCount++;
        }
      }
    }

    console.log(`🧠 Initialized tracking for ${trackedCount} traits`);
  }

  // Global functions
  window.traitMemoryManager = {
    track: trackTraitMemory,
    update: updateTraitMemory,
    safeUpdate: safeUpdateTrait,
    validate: validateTraitIntegrity,
    getStats: getMemoryStats,
    cleanup: cleanupTraitMemory,
    startMonitoring: startMemoryMonitoring,
    stopMonitoring: stopMemoryMonitoring,
    initialize: initializeTraitTracking
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      initializeTraitTracking();
      startMemoryMonitoring();
      console.log("🧠 Trait Memory Management System initialized");
    }, 3000);
  });

  // Also initialize immediately if DOM is already ready
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already ready
    setTimeout(() => {
      initializeTraitTracking();
      startMemoryMonitoring();
      console.log("🧠 Trait Memory Management System initialized");
    }, 3000);
  }

  console.log("🧠 Trait Memory Management System ready!");
  console.log("Available functions:");
  console.log("  - window.traitMemoryManager.getStats()");
  console.log("  - window.traitMemoryManager.safeUpdate()");
  console.log("  - window.traitMemoryManager.validate()");

})();
