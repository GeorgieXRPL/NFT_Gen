/**
 * Enhanced Trait Path Saver
 * This script provides a solution for saving full file paths using File System Access API
 */
(function() {
  console.log("🔧 ENHANCED TRAIT PATH SAVER LOADING...");
  console.log("🔍 Script file loaded successfully");
  console.log("🔍 Current URL:", window.location.href);
  console.log("🔍 Document ready state:", document.readyState);
  
  // Enhanced trait path saver
  window.EnhancedTraitPathSaver = {
    
    // Check if File System Access API is supported
    isFileSystemAccessSupported: function() {
      const supported = 'showOpenFilePicker' in window;
      console.log('🔍 File System Access API support check:', supported);
      if (supported) {
        console.log('✅ File System Access API is available');
      } else {
        console.log('❌ File System Access API is NOT available');
        console.log('💡 Browser info:', {
          userAgent: navigator.userAgent,
          chrome: !!window.chrome,
          edge: !!window.edge,
          firefox: navigator.userAgent.includes('Firefox'),
          safari: navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome')
        });
      }
      return supported;
    },
    
    // Prompt user to select file and get file handle
    async selectFileWithHandle() {
      if (!this.isFileSystemAccessSupported()) {
        console.log('⚠️ File System Access API not supported in this browser');
        
        // Fallback: Try to get more path information using a different approach
        console.log('💡 Attempting fallback method...');
        
        // Create a temporary file input to get more file information
        return new Promise((resolve) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.style.display = 'none';
          
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              console.log('📁 Fallback file selected:', file.name);
              
              // Try to get more path information
              let fullPath = file.name;
              
              // Check if we can get webkitRelativePath
              if (file.webkitRelativePath) {
                fullPath = file.webkitRelativePath;
                console.log('📂 Using webkitRelativePath:', fullPath);
              }
              
              // Create a mock file handle object
              const mockFileHandle = {
                name: fullPath,
                getFile: () => Promise.resolve(file)
              };
              
              console.log('✅ Mock file handle created:', mockFileHandle.name);
              resolve(mockFileHandle);
            } else {
              resolve(null);
            }
            
            // Clean up
            document.body.removeChild(input);
          };
          
          // Add to DOM and trigger click
          document.body.appendChild(input);
          input.click();
        });
      }
      
      try {
        console.log('🔧 Opening file picker with File System Access API...');
        const [fileHandle] = await window.showOpenFilePicker({
          types: [
            {
              description: 'Image files',
              accept: {
                'image/png': ['.png'],
                'image/jpeg': ['.jpg', '.jpeg'],
                'image/gif': ['.gif'],
                'image/webp': ['.webp']
              }
            }
          ],
          excludeAcceptAllOption: true,
          multiple: false
        });
        
        console.log('✅ File handle obtained:', fileHandle.name);
        return fileHandle;
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('👤 User cancelled file selection');
        } else {
          console.error('❌ Error getting file handle:', error);
        }
        return null;
      }
    },
    
    // Get file from handle and save full path
    async saveTraitWithFullPath(trait, layer, projectData) {
      console.log(`🔧 Starting enhanced trait replacement for: ${trait.name}`);
      
      // Get file handle using File System Access API
      const fileHandle = await this.selectFileWithHandle();
      if (!fileHandle) {
        console.log('❌ No file handle obtained, falling back to regular method');
        return false;
      }
      
      try {
        // Get the file from the handle
        const file = await fileHandle.getFile();
        console.log(`📁 File obtained from handle: ${file.name}`);
        
        // Read the file
        const reader = new FileReader();
        reader.onload = (event) => {
          console.log(`✅ Image loaded for trait ${trait.name}`);
          
          // Update trait with new image data
          trait.imageData = event.target.result;
          trait.image = event.target.result;
          
          // Save the file handle and full path information
          trait.fileHandle = fileHandle;
          trait.filePath = fileHandle.name; // This will be the full path
          trait.fileInfo = {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            timestamp: Date.now(),
            fileHandle: fileHandle
          };
          
          // Store additional path information
          trait.absolutePath = fileHandle.name;
          trait.fileName = file.name;
          trait.fileSize = file.size;
          trait.fileType = file.type;
          trait.lastModified = file.lastModified;
          
          console.log(`✅ FULL PATH saved for trait ${trait.name}: ${trait.filePath}`);
          console.log('%c📂 FULL FILEPATH SAVED: ' + trait.filePath, 'color: green; font-weight: bold;');
          
          // Update the trait in the current NFT if it exists
          if (window.lastGeneratedNFT && window.lastGeneratedNFT.traits) {
            for (let nftTraitObj of window.lastGeneratedNFT.traits) {
              if (
                nftTraitObj.trait &&
                ((nftTraitObj.trait.id && nftTraitObj.trait.id === trait.id) ||
                 (nftTraitObj.trait.name && nftTraitObj.trait.name === trait.name)) &&
                nftTraitObj.layer &&
                ((nftTraitObj.layer.id && nftTraitObj.layer.id === layer.id) ||
                 (nftTraitObj.layer.name && nftTraitObj.layer.name === layer.name))
              ) {
                nftTraitObj.trait.imageData = event.target.result;
                nftTraitObj.trait.image = event.target.result;
                nftTraitObj.trait.fileHandle = fileHandle;
                nftTraitObj.trait.filePath = trait.filePath;
                console.log(`🔄 Updated NFT trait ${trait.name} with file handle`);
              }
            }
          }
          
          // Update the UI
          const traitLayersModule = window.NFTApp?.getModule("traitLayers");
          if (traitLayersModule && traitLayersModule.updateTraitLayerUI) {
            traitLayersModule.updateTraitLayerUI(projectData);
          }
          
          // Show success feedback
          if (traitLayersModule && traitLayersModule.showFeedback) {
            traitLayersModule.showFeedback(`Image for trait "${trait.name}" updated with full path access`, "success");
          }
          
          // Ensure all previews and thumbnails are refreshed
          if (window.regenerateNftImageAndSeed) {
            window.regenerateNftImageAndSeed();
          }
          
          console.log(`🎉 Successfully replaced image for trait ${trait.name} with full path access`);
        };
        
        reader.onerror = (error) => {
          console.error("Error reading file:", error);
        };
        
        reader.readAsDataURL(file);
        return true;
        
      } catch (error) {
        console.error('❌ Error processing file:', error);
        return false;
      }
    },
    
    // Load trait from file handle
    async loadTraitFromHandle(trait) {
      if (!trait.fileHandle) {
        console.log(`⚠️ No file handle for trait: ${trait.name}`);
        return false;
      }
      
      try {
        console.log(`🔧 Loading trait ${trait.name} from file handle...`);
        const file = await trait.fileHandle.getFile();
        
        const reader = new FileReader();
        reader.onload = (event) => {
          trait.imageData = event.target.result;
          console.log(`✅ Successfully loaded trait ${trait.name} from file handle`);
        };
        
        reader.readAsDataURL(file);
        return true;
        
      } catch (error) {
        console.error(`❌ Error loading trait ${trait.name} from file handle:`, error);
        return false;
      }
    }
  };
  
  // Function to enhance replace image buttons
  function enhanceReplaceImageButtons() {
    console.log("🔧 Enhancing replace image buttons with full path support...");
    
    // Find all replace image buttons
    const replaceButtons = document.querySelectorAll('.replace-trait-image');
    
    replaceButtons.forEach(button => {
      // Remove existing event listeners
      const newButton = button.cloneNode(true);
      button.parentNode.replaceChild(newButton, button);
      
      // Add enhanced click handler
      newButton.addEventListener('click', async (e) => {
        e.preventDefault();
        
        const traitId = newButton.getAttribute('data-trait-id');
        const layerId = newButton.getAttribute('data-layer-id');
        
        console.log(`🔧 Enhanced replace clicked for trait ${traitId} in layer ${layerId}`);
        
        // Find the trait and layer
        const projectData = window.currentProject;
        if (!projectData) {
          console.error('No current project found');
          return;
        }
        
        const layer = projectData.traits.find((l) => l.id === layerId);
        if (!layer) {
          console.error('Layer not found:', layerId);
          return;
        }
        
        const trait = layer.traits.find((t) => t.id === traitId);
        if (!trait) {
          console.error('Trait not found:', traitId);
          return;
        }
        
        // Use enhanced path saver
        const success = await window.EnhancedTraitPathSaver.saveTraitWithFullPath(trait, layer, projectData);
        
        if (success) {
          console.log(`✅ Enhanced trait replacement completed for ${trait.name}`);
        } else {
          console.log(`❌ Enhanced trait replacement failed for ${trait.name}`);
        }
      });
    });
    
    console.log(`✅ Enhanced ${replaceButtons.length} replace image buttons`);
  }
  
  // Function to enhance project loading to use file handles
  function enhanceProjectLoading() {
    console.log("🔧 Enhancing project loading with file handle support...");
    
    const projectService = window.NFTApp?.getModule("projectService");
    if (!projectService) {
      console.log("Project service not ready, retrying...");
      setTimeout(enhanceProjectLoading, 1000);
      return;
    }
    
    // Override the loadTraitImagesFromPaths method
    const originalLoadTraitImagesFromPaths = projectService.loadTraitImagesFromPaths;
    if (originalLoadTraitImagesFromPaths) {
      projectService.loadTraitImagesFromPaths = async function(traits) {
        console.log('[DEBUG] Starting enhanced trait image loading with file handles...');
        
        let loadedCount = 0;
        let skippedCount = 0;
        let errorCount = 0;
        const missingTraits = [];
        
        for (const layer of traits) {
          if (layer.traits && layer.traits.length > 0) {
            for (const trait of layer.traits) {
              console.log('%c[DEBUG] 🔍 CHECKING TRAIT: ' + trait.name + ' fileHandle = ' + (trait.fileHandle ? 'EXISTS' : 'undefined'), 'color: blue;');
              
              // Priority 1: Try to load from file handle
              if (trait.fileHandle) {
                try {
                  console.log('%c[DEBUG] 🔗 LOADING FROM FILE HANDLE: ' + trait.name, 'color: green; font-weight: bold;');
                  
                  const success = await window.EnhancedTraitPathSaver.loadTraitFromHandle(trait);
                  if (success) {
                    loadedCount++;
                    console.log('%c[DEBUG] ✅ SUCCESS: Loaded from FILE HANDLE - ' + trait.name, 'color: green; font-weight: bold;');
                  } else {
                    errorCount++;
                    missingTraits.push({ layer: layer.name, trait: trait.name, path: 'file handle' });
                  }
                } catch (error) {
                  console.warn('%c[DEBUG] ❌ ERROR: Loading from file handle failed: ' + trait.name, 'color: red; font-weight: bold;');
                  console.warn('[DEBUG] Error details:', error);
                  errorCount++;
                  missingTraits.push({ layer: layer.name, trait: trait.name, path: 'file handle' });
                }
              }
              // Priority 2: Try to load from file path (fallback)
              else if (trait.filePath) {
                console.log('%c[DEBUG] 🔗 LOADING FROM FILE PATH: ' + trait.name + ' from: ' + trait.filePath, 'color: green; font-weight: bold;');
                
                // Check if it's a local file path (filename only)
                const isLocalFile = trait.filePath && 
                                  !trait.filePath.startsWith('http') && 
                                  !trait.filePath.startsWith('https') && 
                                  !trait.filePath.includes('/') && 
                                  !trait.filePath.includes('\\') &&
                                  (trait.filePath.includes('.png') || trait.filePath.includes('.jpg') || trait.filePath.includes('.jpeg'));
                
                if (isLocalFile) {
                  console.log('%c[DEBUG] 📁 LOCAL FILENAME DETECTED: ' + trait.filePath, 'color: orange; font-weight: bold;');
                  console.log('%c[DEBUG] 💡 SKIPPING FETCH - Will use existing imageData', 'color: blue;');
                  
                  if (trait.imageData) {
                    console.log('%c[DEBUG] ✅ USING EXISTING IMAGE DATA for local filename: ' + trait.name, 'color: green; font-weight: bold;');
                    loadedCount++;
                  } else {
                    console.log('%c[DEBUG] ❌ NO IMAGE DATA AVAILABLE for local filename: ' + trait.name, 'color: red; font-weight: bold;');
                    console.log('%c[DEBUG] 💡 SUGGESTION: Replace this trait using the enhanced replace button to get full path access', 'color: blue; font-weight: bold;');
                    errorCount++;
                    missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                  }
                } else {
                  // Try to fetch web URLs
                  try {
                    const response = await fetch(trait.filePath);
                    if (response.ok) {
                      const blob = await response.blob();
                      const reader = new FileReader();
                      
                      reader.onload = () => {
                        trait.imageData = reader.result;
                        loadedCount++;
                        console.log('%c[DEBUG] ✅ SUCCESS: Loaded from FILE PATH - ' + trait.name + ' from: ' + trait.filePath, 'color: green; font-weight: bold;');
                      };
                      
                      reader.readAsDataURL(blob);
                    } else {
                      console.warn('%c[DEBUG] ❌ FAILED: Could not fetch file from path: ' + trait.filePath, 'color: red; font-weight: bold;');
                      errorCount++;
                      missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                    }
                  } catch (error) {
                    console.warn('%c[DEBUG] ❌ ERROR: Loading from file path failed: ' + trait.filePath, 'color: red; font-weight: bold;');
                    errorCount++;
                    missingTraits.push({ layer: layer.name, trait: trait.name, path: trait.filePath });
                  }
                }
              }
              // Priority 3: Use existing imageData as fallback
              else if (trait.imageData) {
                console.log('%c[DEBUG] 📁 USING PROJECT FILE DATA: ' + trait.name + ' (no filePath or fileHandle available)', 'color: #8B4513; font-weight: bold;');
                skippedCount++;
              }
              // Priority 4: No data available
              else {
                console.log('[DEBUG] ⚠️  NO DATA AVAILABLE:', trait.name, '(no filePath, fileHandle, or imageData)');
                skippedCount++;
              }
            }
          }
        }
        
        console.log('[DEBUG] ========== ENHANCED TRAIT LOADING SUMMARY ==========');
        console.log('%c[DEBUG] 🔗 Loaded from FILE HANDLES: ' + loadedCount, 'color: green; font-weight: bold;');
        console.log('%c[DEBUG] 📁 Used PROJECT FILE DATA: ' + skippedCount, 'color: #8B4513; font-weight: bold;');
        console.log('[DEBUG] ❌ Loading ERRORS:', errorCount);
        console.log('[DEBUG] ⚠️  Missing traits:', missingTraits.length);
        console.log('[DEBUG] ===========================================');
        
        // If there are missing traits, show recovery dialog (but only if significant)
        if (missingTraits.length > 0) {
          const totalTraits = traits.reduce((sum, layer) => sum + (layer.traits ? layer.traits.length : 0), 0);
          const missingPercentage = (missingTraits.length / totalTraits) * 100;
          
          console.log(`[DEBUG] Found ${missingTraits.length} missing trait images (${missingPercentage.toFixed(1)}% of total)`);
          
          // Only show recovery dialog if more than 30% of traits are missing
          if (missingPercentage > 30) {
            console.log('[DEBUG] High percentage of missing traits, showing recovery dialog');
            await this.showTraitPathRecoveryDialog(traits, missingTraits);
          } else {
            console.log('[DEBUG] Low percentage of missing traits, skipping recovery dialog');
          }
        }
      };
    }
    
    console.log("✅ Project loading enhanced with file handle support");
  }
  
  // Function to actively find and enhance replace buttons (defined outside conditional blocks)
  function findAndEnhanceReplaceButtons() {
    console.log("🔍 Searching for replace buttons...");
    
    // Try different selectors that might be used for replace buttons
    const selectors = [
      '.replace-trait-image',
      '.replace-image',
      '.replace-image-input',
      'button[data-trait-id]',
      'input[type="file"]',
      '.action-btn',
      '.replace-btn'
    ];
    
    let foundButtons = [];
    
    selectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`🔍 Found ${elements.length} elements with selector: ${selector}`);
        foundButtons.push(...Array.from(elements));
      }
    });
    
    console.log(`🔍 Total replace buttons found: ${foundButtons.length}`);
    
    // Remove duplicates
    const uniqueButtons = [...new Set(foundButtons)];
    
    uniqueButtons.forEach((button, index) => {
      console.log(`🔍 Button ${index + 1}:`, {
        tagName: button.tagName,
        className: button.className,
        id: button.id,
        dataTraitId: button.getAttribute('data-trait-id'),
        dataLayerId: button.getAttribute('data-layer-id'),
        type: button.type
      });
      
      // Add our enhanced click handler directly to the button
      button.addEventListener('click', async (e) => {
        console.log("🔧 Direct button click intercepted!");
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        const traitId = button.getAttribute('data-trait-id');
        const layerId = button.getAttribute('data-layer-id');
        
        if (traitId && layerId) {
          console.log(`🔧 Processing replace for trait ${traitId} in layer ${layerId}`);
          await handleEnhancedReplaceClick(button);
        } else {
          console.log("⚠️ Button missing required attributes:", { traitId, layerId });
        }
      }, true);
    });
    
    return uniqueButtons.length;
  }
  
  // Function to handle enhanced replace click (defined outside conditional blocks)
  async function handleEnhancedReplaceClick(button) {
    const traitId = button.getAttribute('data-trait-id');
    const layerId = button.getAttribute('data-layer-id');
    
    console.log(`🔧 Enhanced replace clicked for trait ${traitId} in layer ${layerId}`);
    
    // Find the trait and layer
    const projectData = window.currentProject;
    if (!projectData) {
      console.error('No current project found');
      return;
    }
    
    const layer = projectData.traits.find((l) => l.id === layerId);
    if (!layer) {
      console.error('Layer not found:', layerId);
      return;
    }
    
    const trait = layer.traits.find((t) => t.id === traitId);
    if (!trait) {
      console.error('Trait not found:', traitId);
      return;
    }
    
    // Use enhanced path saver
    const success = await window.EnhancedTraitPathSaver.saveTraitWithFullPath(trait, layer, projectData);
    
    if (success) {
      console.log(`✅ Enhanced trait replacement completed for ${trait.name}`);
    } else {
      console.log(`❌ Enhanced trait replacement failed for ${trait.name}`);
    }
  }

  // Function to initialize the enhanced trait path saver
  function initializeEnhancedTraitPathSaver() {
    console.log("🔧 DOM ready, setting up enhanced trait path saver...");
    console.log("🔍 DOMContentLoaded event fired");
    console.log("🔍 Document ready state now:", document.readyState);
    
    // Check if File System Access API is supported
    const apiSupported = window.EnhancedTraitPathSaver.isFileSystemAccessSupported();
    console.log("🔍 File System Access API support check result:", apiSupported);
    
    if (apiSupported) {
      console.log("✅ File System Access API is supported!");
      
      // Enhance project loading
      enhanceProjectLoading();
      
      // Add comprehensive click debugging
      document.addEventListener('click', (e) => {
        // Only log clicks that might be related to replace buttons
        if (e.target.closest('.trait-layer-bar') || e.target.closest('.trait-item')) {
          console.log("🔍 Click in trait area detected:", {
            target: e.target.tagName,
            className: e.target.className,
            id: e.target.id,
            closestReplace: !!e.target.closest('.replace-trait-image'),
            hasReplaceClass: e.target.classList.contains('replace-trait-image')
          });
        }
      }, true);
      
      
      // Run the search immediately and multiple times to ensure it works
      console.log("🔧 Starting button detection...");
      
      // Run immediately
      findAndEnhanceReplaceButtons();
      
      // Run after 1 second
      setTimeout(() => {
        console.log("🔧 Running button detection after 1 second...");
        findAndEnhanceReplaceButtons();
      }, 1000);
      
      // Run after 3 seconds
      setTimeout(() => {
        console.log("🔧 Running button detection after 3 seconds...");
        findAndEnhanceReplaceButtons();
      }, 3000);
      
      // Run after 5 seconds
      setTimeout(() => {
        console.log("🔧 Running button detection after 5 seconds...");
        findAndEnhanceReplaceButtons();
      }, 5000);
      
      // Also run it periodically to catch dynamically added buttons
      setInterval(() => {
        console.log("🔧 Periodic button detection...");
        findAndEnhanceReplaceButtons();
      }, 10000);
      
      // Use event delegation with capture phase to intercept before other handlers
      document.addEventListener('click', (e) => {
        console.log("🔍 Click detected on:", e.target.className, e.target.tagName, e.target);
        
        // Check for replace button clicks more specifically
        const replaceButton = e.target.closest('.replace-trait-image');
        if (replaceButton) {
          console.log("🔧 Replace button clicked, using enhanced functionality...");
          console.log("🔍 Button attributes:", {
            traitId: replaceButton.getAttribute('data-trait-id'),
            layerId: replaceButton.getAttribute('data-layer-id'),
            className: replaceButton.className,
            element: replaceButton
          });
          
          // Stop all event propagation to prevent other handlers
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Handle the click with enhanced functionality
          handleEnhancedReplaceClick(replaceButton);
        } else if (e.target.classList.contains('replace-trait-image')) {
          console.log("🔧 Replace button clicked (direct), using enhanced functionality...");
          console.log("🔍 Button attributes:", {
            traitId: e.target.getAttribute('data-trait-id'),
            layerId: e.target.getAttribute('data-layer-id'),
            className: e.target.className,
            element: e.target
          });
          
          // Stop all event propagation to prevent other handlers
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          
          // Handle the click with enhanced functionality
          handleEnhancedReplaceClick(e.target);
        }
      }, true); // Use capture phase to intercept before other handlers
      
      
    } else {
      console.log("⚠️ File System Access API not supported, falling back to regular method");
      
      // Even without File System Access API, we can still enhance the buttons
      console.log("🔧 Setting up fallback button enhancement...");
      
      // Run button detection with fallback
      setTimeout(() => {
        console.log("🔧 Running fallback button detection...");
        findAndEnhanceReplaceButtons();
      }, 2000);
    }
  }
  
  // Wait for DOM to be ready, with fallback
  if (document.readyState === 'loading') {
    console.log("🔍 Document still loading, waiting for DOMContentLoaded...");
    document.addEventListener('DOMContentLoaded', initializeEnhancedTraitPathSaver);
  } else {
    console.log("🔍 Document already loaded, initializing immediately...");
    initializeEnhancedTraitPathSaver();
  }
  
  console.log("✅ Enhanced Trait Path Saver loaded");
})();
