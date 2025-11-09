// Memory Manager Migration Script
// This script helps migrate existing code to use the new centralized memory manager

;(() => {
  const MemoryMigration = {
    // Migrate existing localStorage operations to use MemoryManager
    migrateLocalStorageOperations: function() {
      // console.log('[MemoryMigration] Starting localStorage operations migration...');

      // Create helper functions instead of overriding localStorage methods
      // This is safer and avoids conflicts
      window.safeLocalStorageSetItem = function(key, value) {
        // Check if this is a project-related operation
        if (key.includes('seedList_') || key.includes('rarityRanks_') || key.includes('darkTraitsConfig_')) {
          // console.log('[MemoryMigration] Using MemoryManager for:', key);
          
          // Use MemoryManager instead
          if (window.MemoryManager) {
            try {
              // Parse the value and update the appropriate project data
              const parsedValue = JSON.parse(value);
              
              if (key.includes('seedList_')) {
                window.MemoryManager.updateProject({ savedSeeds: parsedValue });
              } else if (key.includes('rarityRanks_')) {
                window.MemoryManager.updateProject({ rarityRanks: parsedValue });
              } else if (key.includes('darkTraitsConfig_')) {
                const config = {
                  ...parsedValue,
                  selectedTraits: new Set(parsedValue.selectedTraits || [])
                };
                window.MemoryManager.updateProject({ darkTraitsConfig: config });
              }
              
              // console.log('[MemoryMigration] Successfully migrated operation to MemoryManager');
              return true;
            } catch (error) {
              // console.error('[MemoryMigration] Error migrating operation:', error);
              // Fall back to original method
              localStorage.setItem(key, value);
              return false;
            }
          } else {
            // Fall back to original method if MemoryManager not available
            localStorage.setItem(key, value);
            return false;
          }
        } else {
          // Use original method for non-project operations
          localStorage.setItem(key, value);
          return true;
        }
      };

      window.safeLocalStorageGetItem = function(key) {
        // Check if this is a project-related operation
        if (key.includes('seedList_') || key.includes('rarityRanks_') || key.includes('darkTraitsConfig_')) {
          // console.log('[MemoryMigration] Using MemoryManager for:', key);
          
          // Use MemoryManager instead
          if (window.MemoryManager) {
            try {
              const project = window.MemoryManager.getCurrentProject();
              
              if (key.includes('seedList_')) {
                return JSON.stringify(project.savedSeeds || []);
              } else if (key.includes('rarityRanks_')) {
                return JSON.stringify(project.rarityRanks || {});
              } else if (key.includes('darkTraitsConfig_')) {
                const config = {
                  ...project.darkTraitsConfig,
                  selectedTraits: Array.from(project.darkTraitsConfig?.selectedTraits || [])
                };
                return JSON.stringify(config);
              }
            } catch (error) {
              // console.error('[MemoryMigration] Error migrating getItem operation:', error);
              // Fall back to original method
              return localStorage.getItem(key);
            }
          } else {
            // Fall back to original method if MemoryManager not available
            return localStorage.getItem(key);
          }
        } else {
          // Use original method for non-project operations
          return localStorage.getItem(key);
        }
      };

      // console.log('[MemoryMigration] Safe localStorage helper functions created');
    },

    // Migrate window.currentProject operations
    migrateCurrentProjectOperations: function() {
      // console.log('[MemoryMigration] Starting window.currentProject operations migration...');

      // Override window.currentProject setter
      let _currentProject = window.currentProject;
      
      Object.defineProperty(window, 'currentProject', {
        get: function() {
          if (window.MemoryManager) {
            return window.MemoryManager.getCurrentProject();
          }
          return _currentProject;
        },
        set: function(value) {
          // console.log('[MemoryMigration] Intercepting window.currentProject assignment');
          
          if (window.MemoryManager) {
            // Use MemoryManager to update project
            window.MemoryManager.updateProject(value, { syncToModules: false });
            _currentProject = window.MemoryManager.getCurrentProject();
          } else {
            _currentProject = value;
          }
        },
        configurable: true
      });

      // console.log('[MemoryMigration] window.currentProject operations migration completed');
    },

    // Migrate specific functions to use MemoryManager
    migrateSpecificFunctions: function() {
      // console.log('[MemoryMigration] Starting specific functions migration...');

      // Migrate NFT adding functions
      this.migrateNftAddingFunctions();
      
      // Migrate project data access functions
      this.migrateProjectDataAccessFunctions();

      // console.log('[MemoryMigration] Specific functions migration completed');
    },

    // Migrate NFT adding functions
    migrateNftAddingFunctions: function() {
      // This will be called by the existing code to use MemoryManager
      window.addNftToCollectionViaMemoryManager = function(nftData) {
        if (window.MemoryManager) {
          return window.MemoryManager.addNftToCollection(nftData);
        } else {
          console.warn('[MemoryMigration] MemoryManager not available, falling back to original method');
          // Fall back to original implementation
          return Promise.reject(new Error('MemoryManager not available'));
        }
      };

      window.removeNftFromCollectionViaMemoryManager = function(seed) {
        if (window.MemoryManager) {
          return window.MemoryManager.removeNftFromCollection(seed);
        } else {
          console.warn('[MemoryMigration] MemoryManager not available, falling back to original method');
          return Promise.reject(new Error('MemoryManager not available'));
        }
      };

      window.updateNftInCollectionViaMemoryManager = function(originalSeed, updatedNftData) {
        if (window.MemoryManager) {
          return window.MemoryManager.updateNftInCollection(originalSeed, updatedNftData);
        } else {
          console.warn('[MemoryMigration] MemoryManager not available, falling back to original method');
          return Promise.reject(new Error('MemoryManager not available'));
        }
      };
    },

    // Migrate project data access functions
    migrateProjectDataAccessFunctions: function() {
      window.getCurrentProjectViaMemoryManager = function() {
        if (window.MemoryManager) {
          return window.MemoryManager.getCurrentProject();
        } else {
          console.warn('[MemoryMigration] MemoryManager not available, falling back to window.currentProject');
          return window.currentProject;
        }
      };

      window.updateProjectViaMemoryManager = function(updates, options) {
        if (window.MemoryManager) {
          return window.MemoryManager.updateProject(updates, options);
        } else {
          console.warn('[MemoryMigration] MemoryManager not available, falling back to direct assignment');
          window.currentProject = { ...window.currentProject, ...updates };
          return Promise.resolve(window.currentProject);
        }
      };
    },

    // Initialize migration
    init: function() {
      // console.log('[MemoryMigration] Initializing memory migration...');

      // Wait for MemoryManager to be available
      const checkMemoryManager = () => {
        if (window.MemoryManager) {
          this.migrateLocalStorageOperations();
          this.migrateCurrentProjectOperations();
          this.migrateSpecificFunctions();
          // console.log('[MemoryMigration] Migration completed successfully');
        } else {
          // console.log('[MemoryMigration] Waiting for MemoryManager...');
          setTimeout(checkMemoryManager, 100);
        }
      };

      checkMemoryManager();
    },

    // Rollback migration (for testing)
    rollback: function() {
      // console.log('[MemoryMigration] Rolling back migration...');
      
      // Restore original localStorage methods
      // Note: This is a simplified rollback - in production you'd want to store the original methods
      console.warn('[MemoryMigration] Rollback not fully implemented - restart required');
    }
  };

  // Auto-initialize migration
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => MemoryMigration.init());
  } else {
    MemoryMigration.init();
  }

  // Export for manual control
  window.MemoryMigration = MemoryMigration;

})();
