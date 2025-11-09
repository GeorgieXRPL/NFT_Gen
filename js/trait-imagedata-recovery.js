/**
 * Trait ImageData Recovery and Fix
 * This script fixes the missing imageData issue by providing multiple recovery methods
 */
(function() {
  console.log("🔧 Initializing Trait ImageData Recovery and Fix...");

  // Function to check if we can access file system
  function canAccessFileSystem() {
    return 'showOpenFilePicker' in window;
  }

  // Function to load imageData from file using File System Access API
  async function loadImageDataFromFile(trait) {
    if (!canAccessFileSystem()) {
      console.log("🔧 File System Access API not available");
      return null;
    }

    try {
      console.log(`🔧 Attempting to load imageData for trait: ${trait.name}`);
      
      // Show file picker
      const [fileHandle] = await window.showOpenFilePicker({
        types: [{
          description: 'Image files',
          accept: {
            'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
          }
        }],
        excludeAcceptAllOption: true,
        multiple: false
      });

      const file = await fileHandle.getFile();
      
      // Convert to data URL
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log(`🔧 User cancelled file selection for trait: ${trait.name}`);
      } else {
        console.error(`🔧 Error loading file for trait ${trait.name}:`, error);
      }
      return null;
    }
  }

  // Function to recover imageData for a single trait
  async function recoverTraitImageData(trait, layer) {
    console.log(`🔧 Recovering imageData for: ${layer.name} - ${trait.name}`);
    
    // Try to load from file
    const imageData = await loadImageDataFromFile(trait);
    if (imageData) {
      trait.imageData = imageData;
      console.log(`✅ Successfully recovered imageData for: ${trait.name}`);
      return true;
    }
    
    return false;
  }

  // Function to recover all missing imageData
  async function recoverAllMissingImageData() {
    if (!window.currentProject || !window.currentProject.traits) {
      console.log("🔧 No project data available");
      return;
    }

    console.log("🔧 Starting recovery of all missing imageData...");
    
    const missingTraits = [];
    
    // Find all traits missing imageData
    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          if (!trait.imageData && trait.filePath) {
            missingTraits.push({ trait, layer });
          }
        }
      }
    }

    console.log(`🔧 Found ${missingTraits.length} traits missing imageData`);

    if (missingTraits.length === 0) {
      console.log("✅ All traits already have imageData");
      return;
    }

    // Recover each trait
    let recoveredCount = 0;
    for (const { trait, layer } of missingTraits) {
      const success = await recoverTraitImageData(trait, layer);
      if (success) {
        recoveredCount++;
      }
      
      // Add a small delay between file selections
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`🔧 Recovery complete: ${recoveredCount}/${missingTraits.length} traits recovered`);

    if (recoveredCount > 0) {
      // Save the project to preserve the recovered imageData
      console.log("🔧 Saving project to preserve recovered imageData...");
      const projectService = window.NFTApp?.getModule("projectService");
      if (projectService && projectService.save) {
        try {
          await projectService.save();
          console.log("✅ Project saved with recovered imageData");
        } catch (error) {
          console.error("❌ Error saving project:", error);
        }
      }
    }
  }

  // Function to create a simple recovery interface
  function createRecoveryInterface() {
    // Remove existing interface if it exists
    const existingInterface = document.getElementById('imageData-recovery-interface');
    if (existingInterface) {
      existingInterface.remove();
    }

    const interface = document.createElement('div');
    interface.id = 'imageData-recovery-interface';
    interface.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 8px;
      padding: 20px;
      z-index: 10000;
      font-family: 'Archivo', sans-serif;
      color: #fff;
      max-width: 300px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    `;

    interface.innerHTML = `
      <h3 style="margin: 0 0 15px 0; color: #fff; font-size: 16px;">🔧 ImageData Recovery</h3>
      <p style="margin: 0 0 15px 0; color: #ccc; font-size: 14px; line-height: 1.4;">
        Your traits are missing imageData. This tool will help you recover them by re-uploading the images.
      </p>
      <div style="display: flex; gap: 10px; margin-bottom: 15px;">
        <button id="recover-all-images" style="
          background: #3498db;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
          font-family: 'Archivo', sans-serif;
        ">Recover All</button>
        <button id="close-recovery-interface" style="
          background: #555;
          color: #fff;
          border: none;
          border-radius: 4px;
          padding: 8px 12px;
          font-size: 12px;
          cursor: pointer;
          font-family: 'Archivo', sans-serif;
        ">Close</button>
      </div>
      <div id="recovery-status" style="font-size: 12px; color: #ccc;"></div>
    `;

    document.body.appendChild(interface);

    // Add event listeners
    document.getElementById('recover-all-images').addEventListener('click', async () => {
      const statusDiv = document.getElementById('recovery-status');
      statusDiv.textContent = 'Starting recovery...';
      statusDiv.style.color = '#3498db';
      
      try {
        await recoverAllMissingImageData();
        statusDiv.textContent = 'Recovery complete!';
        statusDiv.style.color = '#27ae60';
      } catch (error) {
        statusDiv.textContent = 'Recovery failed: ' + error.message;
        statusDiv.style.color = '#e74c3c';
      }
    });

    document.getElementById('close-recovery-interface').addEventListener('click', () => {
      interface.remove();
    });
  }

  // Function to check if recovery is needed
  function checkIfRecoveryNeeded() {
    if (!window.currentProject || !window.currentProject.traits) {
      return false;
    }

    let missingCount = 0;
    let totalCount = 0;

    for (const layer of window.currentProject.traits) {
      if (layer.traits) {
        for (const trait of layer.traits) {
          totalCount++;
          if (!trait.imageData && trait.filePath) {
            missingCount++;
          }
        }
      }
    }

    return missingCount > 0;
  }

  // Global functions
  window.traitImageDataRecovery = {
    recoverAll: recoverAllMissingImageData,
    recoverTrait: recoverTraitImageData,
    createInterface: createRecoveryInterface,
    checkNeeded: checkIfRecoveryNeeded,
    
    // Quick recovery function
    quickRecover: async function() {
      if (checkIfRecoveryNeeded()) {
        console.log("🔧 Recovery needed, starting...");
        await recoverAllMissingImageData();
      } else {
        console.log("✅ No recovery needed - all traits have imageData");
      }
    }
  };

  // Auto-check and show interface if needed
  function autoCheckRecovery() {
    if (checkIfRecoveryNeeded()) {
      console.log("🔧 ImageData recovery needed - showing interface");
      createRecoveryInterface();
    }
  }

  // Initialize when DOM is ready
  document.addEventListener("DOMContentLoaded", function() {
    setTimeout(() => {
      autoCheckRecovery();
      console.log("🔧 Trait ImageData Recovery and Fix initialized");
      console.log("Available functions:");
      console.log("  - window.traitImageDataRecovery.quickRecover()");
      console.log("  - window.traitImageDataRecovery.createInterface()");
      console.log("  - window.traitImageDataRecovery.checkNeeded()");
    }, 2000);
  });

  console.log("🔧 Trait ImageData Recovery and Fix ready!");
})();
