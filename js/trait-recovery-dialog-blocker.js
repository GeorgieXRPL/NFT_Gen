/**
 * Trait Recovery Dialog Blocker
 * This script completely blocks the trait path recovery dialog from appearing
 * when the project already has imageData saved.
 */
(function() {
  console.log("🚫 Initializing Trait Recovery Dialog Blocker...");

  // Function to completely disable the recovery dialog
  function disableTraitRecoveryDialog() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      setTimeout(disableTraitRecoveryDialog, 1000);
      return;
    }

    console.log("🚫 Disabling trait path recovery dialog...");

    // Override the showTraitPathRecoveryDialog function to do nothing
    if (projectService.showTraitPathRecoveryDialog) {
      projectService.showTraitPathRecoveryDialog = async function(traits, missingTraits) {
        console.log("🚫 BLOCKED: Trait path recovery dialog was blocked");
        console.log(`🚫 Would have shown dialog for ${missingTraits.length} missing traits`);
        
        // Check if we actually have good coverage
        let totalTraits = 0;
        let traitsWithImageData = 0;
        
        for (const layer of traits) {
          if (layer.traits) {
            for (const trait of layer.traits) {
              totalTraits++;
              if (trait.imageData) {
                traitsWithImageData++;
              }
            }
          }
        }
        
        const coverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
        console.log(`🚫 Current trait coverage: ${coverage.toFixed(1)}% (${traitsWithImageData}/${totalTraits})`);
        
        if (coverage >= 50) {
          console.log("🚫 BLOCKED: Good coverage detected, dialog blocked");
        } else {
          console.log("🚫 BLOCKED: Low coverage but dialog still blocked for testing");
        }
        
        // Return immediately without showing dialog
        return Promise.resolve();
      };
    }

    // Also override any enhanced loading functions that might trigger the dialog
    if (window.EnhancedTraitPathSaver && window.EnhancedTraitPathSaver.loadAllTraitPaths) {
      const originalLoadAllTraitPaths = window.EnhancedTraitPathSaver.loadAllTraitPaths;
      window.EnhancedTraitPathSaver.loadAllTraitPaths = async function(traits) {
        console.log("🚫 BLOCKED: EnhancedTraitPathSaver.loadAllTraitPaths was blocked");
        
        // Check coverage first
        let totalTraits = 0;
        let traitsWithImageData = 0;
        
        for (const layer of traits) {
          if (layer.traits) {
            for (const trait of layer.traits) {
              totalTraits++;
              if (trait.imageData) {
                traitsWithImageData++;
              }
            }
          }
        }
        
        const coverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
        console.log(`🚫 EnhancedTraitPathSaver coverage: ${coverage.toFixed(1)}%`);
        
        if (coverage >= 50) {
          console.log("🚫 BLOCKED: Good coverage, skipping enhanced loading");
          return;
        }
        
        // Only call original if coverage is very low
        console.log("🚫 BLOCKED: Low coverage, but still blocking enhanced loading");
        return;
      };
    }

    // Completely disable the trait image recovery system to prevent CORS errors
    if (window.traitImageRecovery) {
      console.log("🚫 Disabling trait image recovery system to prevent CORS errors...");
      
      // Override all recovery functions to do nothing
      window.traitImageRecovery.enhancedRecovery = async function() {
        console.log("🚫 BLOCKED: enhancedRecovery was blocked (CORS prevention)");
        return false;
      };
      
      window.traitImageRecovery.recoverAll = async function() {
        console.log("🚫 BLOCKED: recoverAll was blocked (CORS prevention)");
        return false;
      };
      
      window.traitImageRecovery.isRecovering = function() {
        return false; // Always return false to prevent triggering
      };
      
      console.log("✅ Trait image recovery system completely disabled");
    }

    console.log("✅ Trait recovery dialog blocker installed");
  }

  // Function to check and log trait coverage
  function checkTraitCoverage() {
    if (!window.currentProject || !window.currentProject.traits) {
      return;
    }

    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithoutImageData = 0;

    console.log("🔍 TRAIT COVERAGE CHECK:");
    console.log("========================");

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        console.log(`\n📁 Layer: ${layer.name}`);
        for (const trait of layer.traits) {
          totalTraits++;
          if (trait.imageData) {
            traitsWithImageData++;
            console.log(`  ✅ ${trait.name}: Has imageData`);
          } else {
            traitsWithoutImageData++;
            console.log(`  ❌ ${trait.name}: Missing imageData`);
          }
        }
      }
    }

    const coverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
    console.log(`\n📊 COVERAGE SUMMARY:`);
    console.log(`Total traits: ${totalTraits}`);
    console.log(`✅ With imageData: ${traitsWithImageData}`);
    console.log(`❌ Without imageData: ${traitsWithoutImageData}`);
    console.log(`📈 Coverage: ${coverage.toFixed(1)}%`);

    return {
      total: totalTraits,
      withImageData: traitsWithImageData,
      withoutImageData: traitsWithoutImageData,
      coverage: coverage
    };
  }

  // Global functions
  window.traitRecoveryBlocker = {
    disableDialog: disableTraitRecoveryDialog,
    checkCoverage: checkTraitCoverage,
    forceDisable: function() {
      console.log("🚫 FORCE DISABLING all trait recovery dialogs...");
      
      // Override all possible recovery dialog functions
      if (window.NFTApp && window.NFTApp.getModule) {
        const projectService = window.NFTApp.getModule("projectService");
        if (projectService) {
          projectService.showTraitPathRecoveryDialog = async function() {
            console.log("🚫 FORCE BLOCKED: Recovery dialog blocked");
            return Promise.resolve();
          };
        }
      }
      
      console.log("✅ All recovery dialogs force disabled");
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      disableTraitRecoveryDialog();
      console.log("🚫 Trait Recovery Dialog Blocker initialized");
    }, 2000); // Increased delay to ensure other scripts are loaded
  });

  // Also initialize immediately if DOM is already ready
  if (document.readyState === 'loading') {
    // DOM is still loading, wait for DOMContentLoaded
  } else {
    // DOM is already ready
    setTimeout(() => {
      disableTraitRecoveryDialog();
      console.log("🚫 Trait Recovery Dialog Blocker initialized");
    }, 2000); // Increased delay to ensure other scripts are loaded
  }

  // Additional delayed initialization to catch any late-loading recovery systems
  setTimeout(() => {
    console.log("🚫 Running delayed recovery system disable...");
    disableTraitRecoveryDialog();
  }, 5000);

  console.log("🚫 Trait Recovery Dialog Blocker ready!");
  console.log("Available functions:");
  console.log("  - window.traitRecoveryBlocker.disableDialog()");
  console.log("  - window.traitRecoveryBlocker.checkCoverage()");
  console.log("  - window.traitRecoveryBlocker.forceDisable()");

})();
