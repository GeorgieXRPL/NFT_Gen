/**
 * Enhanced drag-and-drop functionality for adding trait layers from folders
 * This script adds drag-and-drop support for multiple folders to create trait layers
 */

(function() {
  // Wait for DOM to be fully loaded
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Trait folders drag and drop handler loaded");
    
    // Find the dropzone for folders
    function setupFolderDragAndDrop() {
      const dropzones = [
        document.querySelector(".trait-layers-dropzone"),
        document.querySelector(".dropzone"),
        document.getElementById("trait-layers-dropzone")
      ];
      
      const validDropzone = dropzones.find(zone => zone !== null);
      
      if (!validDropzone) {
        console.log("Trait layers dropzone not found yet, trying again in 500ms");
        setTimeout(setupFolderDragAndDrop, 500);
        return;
      }
      
      console.log("Found dropzone for folder drag and drop:", validDropzone);
      
      // Store the NFTApp reference for later use
      const NFTApp = window.NFTApp;
      if (!NFTApp) {
        console.error("NFTApp not found");
        return;
      }
      
      // Get the trait layers module
      const traitLayersModule = NFTApp.getModule("traitLayers");
      if (!traitLayersModule) {
        console.error("Trait layers module not found");
        return;
      }

      // Add drag and drop event listeners if they don't already exist
      if (validDropzone.dataset.folderDragdropInitialized === "true") {
        console.log("Folder drag and drop already initialized");
        return;
      }
      
      // Mark as initialized to avoid duplicate event binding
      validDropzone.dataset.folderDragdropInitialized = "true";
      
      // Style for active dropzone
      const addActiveStyles = () => {
        validDropzone.classList.add("active");
        validDropzone.style.borderColor = "var(--accent-primary)";
        validDropzone.style.backgroundColor = "rgba(108, 92, 231, 0.1)";
        validDropzone.style.boxShadow = "0 0 10px rgba(108, 92, 231, 0.3)";
      };
      
      // Remove active styles
      const removeActiveStyles = () => {
        validDropzone.classList.remove("active");
        validDropzone.style.borderColor = "";
        validDropzone.style.backgroundColor = "";
        validDropzone.style.boxShadow = "";
      };
      
      // Handle dragenter event
      validDropzone.addEventListener("dragenter", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Folder drag enter");
        addActiveStyles();
      });
      
      // Handle dragover event
      validDropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.stopPropagation();
        // Keep the dropzone active
        addActiveStyles();
      });
      
      // Handle dragleave event
      validDropzone.addEventListener("dragleave", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Folder drag leave");
        removeActiveStyles();
      });
      
      // Handle drop event
      validDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log("Folders dropped");
        removeActiveStyles();
        
        // Get the dropped files/folders
        const items = e.dataTransfer.items;
        const files = e.dataTransfer.files;
        
        // Make sure the trait layers module has the required functions
        if (!traitLayersModule.handleFolderSelection) {
          console.error("handleFolderSelection method not found in traitLayersModule");
          if (traitLayersModule.showFeedback) {
            traitLayersModule.showFeedback("Error: Cannot process dropped folders", "error");
          }
          return;
        }
        
        // Use our existing methods to show processing indicators
        let processingIndicator = null;
        if (traitLayersModule.showProcessingIndicator) {
          processingIndicator = traitLayersModule.showProcessingIndicator();
        }
        
        // Process the dropped items, prioritizing folder handling
        if (items && items.length > 0) {
          // In Chrome, it's possible to access the file system entries
          handleFolderItemsChrome(items).then(success => {
            if (!success && files && files.length > 0) {
              // Fallback to regular file handling
              console.log("Falling back to regular file handling");
              traitLayersModule.handleFolderSelection({ target: { files: files } }, window.currentProject);
            }
            // Hide processing indicator if we created one
            if (processingIndicator && traitLayersModule.hideProcessingIndicator) {
              traitLayersModule.hideProcessingIndicator(processingIndicator);
            }
          });
        } else if (files && files.length > 0) {
          // Direct file handling for browsers that don't support DataTransferItemList
          console.log("Using direct file handling");
          traitLayersModule.handleFolderSelection({ target: { files: files } }, window.currentProject);
          // Hide processing indicator if we created one
          if (processingIndicator && traitLayersModule.hideProcessingIndicator) {
            traitLayersModule.hideProcessingIndicator(processingIndicator);
          }
        } else {
          console.log("No valid files or folders found in the drop");
          // Hide processing indicator if we created one
          if (processingIndicator && traitLayersModule.hideProcessingIndicator) {
            traitLayersModule.hideProcessingIndicator(processingIndicator);
          }
          // Show an error message
          if (traitLayersModule.showFeedback) {
            traitLayersModule.showFeedback("No valid files or folders found in the drop", "error");
          }
        }
      });
      
      // Handle Chrome-specific folder drag and drop
      async function handleFolderItemsChrome(items) {
        console.log("Handling Chrome folder items");
        const entries = [];
        
        // Collect all entries
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          if (item.webkitGetAsEntry) {
            const entry = item.webkitGetAsEntry();
            if (entry) {
              entries.push(entry);
            }
          }
        }
        
        if (entries.length === 0) {
          console.log("No valid entries found");
          if (traitLayersModule.showFeedback) {
            traitLayersModule.showFeedback("No valid folders found", "error");
          }
          return false;
        }
        
        // Process entries recursively to collect all files
        const allFiles = [];
        
        // Function to recursively process directories
        async function processEntry(entry, path = "") {
          return new Promise((resolve) => {
            if (entry.isFile) {
              entry.file(file => {
                // Create a custom file object with path information
                const customFile = new File([file], file.name, {
                  type: file.type,
                  lastModified: file.lastModified
                });
                // Add webkitRelativePath manually
                customFile.webkitRelativePath = path + file.name;
                allFiles.push(customFile);
                resolve();
              }, () => resolve());
            } else if (entry.isDirectory) {
              const dirReader = entry.createReader();
              const readEntries = () => {
                dirReader.readEntries(async (entries) => {
                  if (entries.length === 0) {
                    resolve();
                  } else {
                    const promises = entries.map(entry => {
                      return processEntry(entry, path + entry.name + "/");
                    });
                    await Promise.all(promises);
                    readEntries(); // Continue reading if there are more entries
                  }
                }, () => resolve());
              };
              readEntries();
            }
          });
        }
        
        // Process all top-level entries
        const promises = entries.map(entry => {
          return processEntry(entry, entry.name + "/");
        });
        
        await Promise.all(promises);
        
        if (allFiles.length === 0) {
          console.log("No files found in the dropped folders");
          if (traitLayersModule.showFeedback) {
            traitLayersModule.showFeedback("No image files found in the dropped folders", "error");
          }
          return false;
        }
        
        console.log(`Processed ${allFiles.length} files from dropped folders`);
        
        // Count unique top-level folders for better feedback
        const folderSet = new Set();
        allFiles.forEach(file => {
          if (file.webkitRelativePath) {
            const parts = file.webkitRelativePath.split('/');
            if (parts.length > 1) {
              folderSet.add(parts[0]);
            }
          }
        });
        
        console.log(`Found ${folderSet.size} unique folders in drop operation`);
        
        // Create a custom event object to mimic folder input
        const customEvent = {
          target: {
            files: allFiles
          }
        };
        
        // Process the files using the trait layers module
        traitLayersModule.handleFolderSelection(customEvent, window.currentProject);
        return true;
      }
    }
    
    // Set up the folder drag and drop functionality
    setupFolderDragAndDrop();
    
    // Re-initialize on project load
    document.addEventListener("project-loaded", function() {
      console.log("Project loaded, re-initializing folder drag and drop");
      setupFolderDragAndDrop();
    });
    
    // Re-initialize when traits are updated
    document.addEventListener("traits-updated", function() {
      console.log("Traits updated, checking folder drag and drop");
      setupFolderDragAndDrop();
    });
    
    // Also fix the Add Folders button if needed
    function ensureAddFoldersButtonWorks() {
      const addFoldersBtn = document.getElementById("add-folders-btn");
      if (!addFoldersBtn) {
        setTimeout(ensureAddFoldersButtonWorks, 500);
        return;
      }
      
      // Check if we already fixed this button
      if (addFoldersBtn.dataset.enhancedMultipleFolder === "true") {
        return;
      }
      
      addFoldersBtn.dataset.enhancedMultipleFolder = "true";
      
      // Get the trait layers module
      const NFTApp = window.NFTApp;
      if (!NFTApp || !NFTApp.getModule) {
        console.error("NFTApp not found");
        return;
      }
      
      const traitLayersModule = NFTApp.getModule("traitLayers");
      if (!traitLayersModule) {
        console.error("Trait layers module not found");
        return;
      }
    }
    
    // Ensure the Add Folders button works with multiple folders
    ensureAddFoldersButtonWorks();
  });
})(); 