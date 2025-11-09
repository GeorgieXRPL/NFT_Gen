/**
 * Project Data Debugger
 * This script helps debug what's actually saved in the project file
 * and what's missing during loading.
 */
(function() {
  console.log("🔍 Initializing Project Data Debugger...");

  // Function to analyze project data
  function analyzeProjectData(project, label = "Project Data") {
    if (!project) {
      console.log(`🔍 ${label}: No project data`);
      return;
    }

    console.log(`\n🔍 ========== ${label.toUpperCase()} ANALYSIS ==========`);
    console.log(`Project Name: ${project.name || 'Unknown'}`);
    console.log(`Project Description: ${project.description || 'None'}`);
    console.log(`Total Layers: ${project.traits ? project.traits.length : 0}`);

    if (!project.traits) {
      console.log("❌ No traits array found");
      return;
    }

    let totalTraits = 0;
    let traitsWithImageData = 0;
    let traitsWithoutImageData = 0;
    let traitsWithFilePath = 0;
    let traitsWithFileName = 0;
    let traitsWithImage = 0;
    let traitsWithImageSrc = 0;
    let traitsWithSrc = 0;

    console.log("\n📊 TRAIT ANALYSIS:");
    console.log("==================");

    for (const layer of project.traits) {
      console.log(`\n📁 Layer: ${layer.name} (ID: ${layer.id})`);
      
      if (!layer.traits) {
        console.log("  ❌ No traits array in layer");
        continue;
      }

      console.log(`  Total traits in layer: ${layer.traits.length}`);

      for (const trait of layer.traits) {
        totalTraits++;
        
        console.log(`    🎨 Trait: ${trait.name} (ID: ${trait.id})`);
        
        // Check imageData
        if (trait.imageData) {
          traitsWithImageData++;
          console.log(`      ✅ Has imageData (${trait.imageData.length} chars)`);
        } else {
          traitsWithoutImageData++;
          console.log(`      ❌ Missing imageData`);
        }

        // Check other image properties
        if (trait.image) {
          traitsWithImage++;
          console.log(`      📷 Has image property (${trait.image.length} chars)`);
        }
        if (trait.imageSrc) {
          traitsWithImageSrc++;
          console.log(`      🖼️ Has imageSrc property (${trait.imageSrc.length} chars)`);
        }
        if (trait.src) {
          traitsWithSrc++;
          console.log(`      🔗 Has src property (${trait.src.length} chars)`);
        }

        // Check file properties
        if (trait.filePath) {
          traitsWithFilePath++;
          console.log(`      📂 Has filePath: ${trait.filePath}`);
        }
        if (trait.fileName) {
          traitsWithFileName++;
          console.log(`      📄 Has fileName: ${trait.fileName}`);
        }

        // Check rarity
        console.log(`      🎯 Rarity: ${trait.rarity || 'Not set'}`);
      }
    }

    console.log(`\n📈 SUMMARY:`);
    console.log(`Total traits: ${totalTraits}`);
    console.log(`✅ With imageData: ${traitsWithImageData}`);
    console.log(`❌ Without imageData: ${traitsWithoutImageData}`);
    console.log(`📷 With image: ${traitsWithImage}`);
    console.log(`🖼️ With imageSrc: ${traitsWithImageSrc}`);
    console.log(`🔗 With src: ${traitsWithSrc}`);
    console.log(`📂 With filePath: ${traitsWithFilePath}`);
    console.log(`📄 With fileName: ${traitsWithFileName}`);

    const coverage = totalTraits > 0 ? (traitsWithImageData / totalTraits) * 100 : 0;
    console.log(`📊 ImageData Coverage: ${coverage.toFixed(1)}%`);

    console.log(`🔍 ===========================================\n`);

    return {
      totalTraits,
      traitsWithImageData,
      traitsWithoutImageData,
      traitsWithImage,
      traitsWithImageSrc,
      traitsWithSrc,
      traitsWithFilePath,
      traitsWithFileName,
      coverage
    };
  }

  // Function to check what's in localStorage
  function checkLocalStorageBackups() {
    console.log("\n🔍 ========== LOCALSTORAGE BACKUP CHECK ==========");
    
    let backupCount = 0;
    let totalBackupSize = 0;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('trait_backup_')) {
        backupCount++;
        const data = localStorage.getItem(key);
        if (data) {
          totalBackupSize += data.length;
          try {
            const backup = JSON.parse(data);
            console.log(`📦 Backup ${backupCount}: ${backup.name || 'Unknown'} (${data.length} chars)`);
          } catch (e) {
            console.log(`📦 Backup ${backupCount}: Invalid JSON (${data.length} chars)`);
          }
        }
      }
    }

    console.log(`\n📊 LOCALSTORAGE SUMMARY:`);
    console.log(`Total trait backups: ${backupCount}`);
    console.log(`Total backup size: ${(totalBackupSize / 1024).toFixed(1)}KB`);
    console.log(`🔍 ===========================================\n`);
  }

  // Function to check project file content
  function checkProjectFileContent() {
    console.log("\n🔍 ========== PROJECT FILE CONTENT CHECK ==========");
    
    // Try to find project file input
    const fileInput = document.querySelector('input[type="file"][accept*="json"]');
    if (fileInput) {
      console.log("📁 Found project file input");
    } else {
      console.log("❌ No project file input found");
    }

    // Check if there's a current project
    if (window.currentProject) {
      console.log("✅ Current project found in window.currentProject");
      analyzeProjectData(window.currentProject, "Current Project");
    } else {
      console.log("❌ No current project found in window.currentProject");
    }

    console.log(`🔍 ===========================================\n`);
  }

  // Function to monitor project loading
  function monitorProjectLoading() {
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      setTimeout(monitorProjectLoading, 1000);
      return;
    }

    console.log("🔍 Monitoring project loading...");

    // Override the load method to debug
    const originalLoad = projectService.load;
    if (originalLoad) {
      projectService.load = function(event) {
        console.log("🔍 PROJECT LOADING DEBUG: Starting load...");
        
        const result = originalLoad.call(this, event);
        
        // After loading, analyze the loaded project
        setTimeout(() => {
          if (window.currentProject) {
            console.log("🔍 PROJECT LOADING DEBUG: Project loaded, analyzing...");
            analyzeProjectData(window.currentProject, "Loaded Project");
            checkLocalStorageBackups();
          }
        }, 2000);
        
        return result;
      };
    }
  }

  // Global functions
  window.projectDataDebugger = {
    analyze: analyzeProjectData,
    checkLocalStorage: checkLocalStorageBackups,
    checkProjectFile: checkProjectFileContent,
    monitor: monitorProjectLoading,
    
    // Quick analysis function
    quickAnalysis: function() {
      console.log("🔍 Running quick project analysis...");
      if (window.currentProject) {
        analyzeProjectData(window.currentProject, "Quick Analysis");
      } else {
        console.log("❌ No current project to analyze");
      }
    },

    // Check what's missing
    findMissingImageData: function() {
      if (!window.currentProject || !window.currentProject.traits) {
        console.log("❌ No project data to check");
        return;
      }

      console.log("🔍 Finding traits missing imageData...");
      const missingTraits = [];

      for (const layer of window.currentProject.traits) {
        if (layer.traits) {
          for (const trait of layer.traits) {
            if (!trait.imageData) {
              missingTraits.push({
                layer: layer.name,
                trait: trait.name,
                id: trait.id,
                hasImage: !!trait.image,
                hasImageSrc: !!trait.imageSrc,
                hasSrc: !!trait.src,
                hasFilePath: !!trait.filePath,
                hasFileName: !!trait.fileName
              });
            }
          }
        }
      }

      console.log(`🔍 Found ${missingTraits.length} traits missing imageData:`);
      missingTraits.forEach(missing => {
        console.log(`  ❌ ${missing.layer} - ${missing.trait}`);
        console.log(`     Has image: ${missing.hasImage}, imageSrc: ${missing.hasImageSrc}, src: ${missing.hasSrc}`);
        console.log(`     Has filePath: ${missing.hasFilePath}, fileName: ${missing.hasFileName}`);
      });

      return missingTraits;
    }
  };

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      monitorProjectLoading();
      console.log("🔍 Project Data Debugger initialized");
      console.log("Available functions:");
      console.log("  - window.projectDataDebugger.quickAnalysis()");
      console.log("  - window.projectDataDebugger.findMissingImageData()");
      console.log("  - window.projectDataDebugger.checkLocalStorage()");
      console.log("  - window.projectDataDebugger.checkProjectFile()");
    }, 1000);
  });

  console.log("🔍 Project Data Debugger ready!");
})();
