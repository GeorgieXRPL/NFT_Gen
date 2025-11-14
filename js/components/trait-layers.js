console.log('[DEBUG] trait-layers.js before registerModule: typeof window.NFTApp.registerModule =', typeof window.NFTApp && window.NFTApp.registerModule, window.NFTApp && window.NFTApp.registerModule);
// Helper function to generate a unique ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Trait Layers Module
window.NFTApp = window.NFTApp || {};
window.NFTApp.registerModule("traitLayers", {
  // Animation state tracking to prevent overlapping animations
  _reorderingState: {
    isAnimating: false,
    pendingTimeouts: [],
    transitionEndHandlers: []
  },

  // Helper to cancel all pending animations
  _cancelPendingAnimations: function() {
    // Cancel all pending timeouts
    this._reorderingState.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this._reorderingState.pendingTimeouts = [];
    
    // Remove all transitionend handlers
    this._reorderingState.transitionEndHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('transitionend', handler);
    });
    this._reorderingState.transitionEndHandlers = [];
    
    // Clean up any elements still in reordering state
    const container = document.getElementById("trait-layers-container");
    if (container) {
      const reorderingElements = container.querySelectorAll(".trait-layer-bar.reordering");
      reorderingElements.forEach(element => {
        element.style.transition = "";
        element.style.transform = "";
        element.style.zIndex = "";
        element.classList.remove("reordering");
      });
    }
    
    this._reorderingState.isAnimating = false;
  },

  // Set up the trait layers functionality
  setup: function (projectData) {
    console.log("Setting up trait layers module")

    // CRITICAL: Ensure buttons are visible before any other setup
    this.ensureButtonsVisible()

    // Set up the trait layers UI
    this.setupUI(projectData)

    // Update the Delete All Layers button visibility
    this.updateDeleteAllLayersButtonVisibility(projectData)

    // Set up event listeners
    this.setupEventListeners(projectData)

    // Initialize the rename modal
    this.initRenameModal()
  },

  // CRITICAL: Ensure Add Layer, Add Folders, and Delete All Layers buttons are visible
  ensureButtonsVisible: function() {
    // Add Layer button
    const addLayerBtn = document.getElementById("add-layer-btn")
    if (addLayerBtn) {
      addLayerBtn.style.setProperty("display", "flex", "important")
      addLayerBtn.style.setProperty("visibility", "visible", "important")
      addLayerBtn.style.setProperty("opacity", "1", "important")
    } else {
      console.warn("[Trait Layers] Add Layer button not found in DOM")
    }

    // Add Folders button
    const addFoldersBtn = document.getElementById("add-folders-btn")
    if (addFoldersBtn) {
      addFoldersBtn.style.setProperty("display", "flex", "important")
      addFoldersBtn.style.setProperty("visibility", "visible", "important")
      addFoldersBtn.style.setProperty("opacity", "1", "important")
    } else {
      console.warn("[Trait Layers] Add Folders button not found in DOM")
    }

    // Delete All Layers button (will be shown/hidden based on layer count)
    const deleteAllLayersBtn = document.getElementById("delete-all-layers")
    if (deleteAllLayersBtn) {
      // Only set visibility/opacity, not display (display is controlled by layer count)
      deleteAllLayersBtn.style.setProperty("visibility", "visible", "important")
      deleteAllLayersBtn.style.setProperty("opacity", "1", "important")
    } else {
      console.warn("[Trait Layers] Delete All Layers button not found in DOM")
    }

    // Ensure trait-layers-actions container is visible
    const actionsContainer = document.querySelector(".trait-layers-actions")
    if (actionsContainer) {
      actionsContainer.style.setProperty("display", "flex", "important")
      actionsContainer.style.setProperty("visibility", "visible", "important")
      actionsContainer.style.setProperty("opacity", "1", "important")
    }

    // Ensure trait-layers-actions-left is visible
    const actionsLeft = document.querySelector(".trait-layers-actions-left")
    if (actionsLeft) {
      actionsLeft.style.setProperty("display", "flex", "important")
      actionsLeft.style.setProperty("visibility", "visible", "important")
      actionsLeft.style.setProperty("opacity", "1", "important")
    }

    // Ensure trait-layers-actions-right is visible
    const actionsRight = document.querySelector(".trait-layers-actions-right")
    if (actionsRight) {
      actionsRight.style.setProperty("display", "flex", "important")
      actionsRight.style.setProperty("visibility", "visible", "important")
      actionsRight.style.setProperty("opacity", "1", "important")
    }
  },

  // Set up the trait layers UI
  setupUI: function (projectData) {
    // Update the trait layers container
    this.updateTraitLayerUI(projectData)
  },

  // Create the rename modal if it doesn't exist
  createRenameModal: function () {
    // Check if modal already exists
    if (document.getElementById("rename-modal")) {
      return
    }

    // Create modal HTML
    const modal = document.createElement("div")
    modal.id = "rename-modal"
    modal.style.cssText = `
      display: none;
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      z-index: 999999;
      background: rgba(0, 0, 0, 0.85);
      align-items: center;
      justify-content: center;
      font-family: 'Archivo', sans-serif;
    `

    modal.innerHTML = `
      <div style="background: #2a2a2a; padding: 30px; border-radius: 12px; min-width: 400px; max-width: 600px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); display: flex; flex-direction: column; align-items: stretch; border: 1px solid #444; position: relative;">
        <button id="close-rename-modal" style="position: absolute; top: 15px; right: 15px; width: 32px; height: 32px; border: none; background: #444; color: #fff; font-size: 18px; font-weight: bold; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: all 0.2s ease; z-index: 100;" onmouseover="this.style.background='#ff4444';this.style.transform='scale(1.1)'" onmouseout="this.style.background='#444';this.style.transform='scale(1)'">&times;</button>
        <div id="rename-modal-title" style="font-size: 20px; font-weight: 700; color: #ecf0f1; margin-bottom: 16px; padding-right: 40px; line-height: 1.4; text-align: center;"></div>
        <input type="text" id="rename-modal-input" style="background: #1a1a1a; border: 1px solid #444; border-radius: 6px; padding: 12px; color: #fff; font-size: 16px; font-family: 'Archivo', sans-serif; margin-bottom: 24px; outline: none; transition: border-color 0.2s ease;" onfocus="this.style.borderColor='#8b5cf6'" onblur="this.style.borderColor='#444'">
        <div style="display: flex; justify-content: flex-end; gap: 12px;">
          <button id="cancel-rename" style="background: #555; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'Archivo', sans-serif; transition: all 0.2s ease;" onmouseover="this.style.background='#666'" onmouseout="this.style.background='#555'">Cancel</button>
          <button id="confirm-rename" style="background: #3498db; color: #fff; border: none; border-radius: 6px; padding: 10px 24px; font-size: 14px; font-weight: 500; cursor: pointer; font-family: 'Archivo', sans-serif; transition: all 0.2s ease;" onmouseover="this.style.background='#2980b9'" onmouseout="this.style.background='#3498db'">Confirm</button>
        </div>
      </div>
    `

    document.body.appendChild(modal)
  },

  // Initialize the rename modal
  initRenameModal: function () {
    // Create modal if it doesn't exist
    this.createRenameModal()

    // Add event listeners for the modal buttons
    const modal = document.getElementById("rename-modal")
    const cancelBtn = document.getElementById("cancel-rename")
    const confirmBtn = document.getElementById("confirm-rename")
    const input = document.getElementById("rename-modal-input")
    const closeBtn = document.getElementById("close-rename-modal")

    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modal.style.display = "none"
        this.currentRenameCallback = null
      })
    }

    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => {
        if (this.currentRenameCallback) {
          const newName = input.value.trim()
          this.currentRenameCallback(newName)
        }
        modal.style.display = "none"
        this.currentRenameCallback = null
      })
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modal.style.display = "none"
        this.currentRenameCallback = null
      })
    }

    // Handle Enter key in the input field
    if (input) {
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter" && this.currentRenameCallback) {
          const newName = input.value.trim()
          this.currentRenameCallback(newName)
          modal.style.display = "none"
          this.currentRenameCallback = null
        }
      })
    }

    // Handle Escape key to close modal
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal && modal.style.display !== "none") {
        modal.style.display = "none"
        this.currentRenameCallback = null
      }
    })
  },

  // Show the rename modal
  showRenameModal: function (title, currentName, callback) {
    // Create modal if it doesn't exist
    this.createRenameModal()

    const modal = document.getElementById("rename-modal")
    const modalTitle = document.getElementById("rename-modal-title")
    const input = document.getElementById("rename-modal-input")

    // CRITICAL: Add null checks to prevent errors if modal elements don't exist
    if (!modal) {
      console.error("[Trait Layers] Rename modal not found in DOM")
      return
    }
    if (!modalTitle) {
      console.error("[Trait Layers] Rename modal title element not found in DOM")
      return
    }
    if (!input) {
      console.error("[Trait Layers] Rename modal input element not found in DOM")
      return
    }

    modalTitle.textContent = title
    input.value = currentName
    this.currentRenameCallback = callback

    modal.style.display = "flex"
    input.focus()
    input.select()
  },

  // Set up event listeners for the trait layers
  setupEventListeners: function (projectData) {
    console.log("Setting up trait layers event listeners")

    // Add event listener for Add Folders button
    const addFoldersBtn = document.getElementById("add-folders-btn")
    if (addFoldersBtn) {
      addFoldersBtn.addEventListener("click", () => {
        console.log("Add Folders button clicked")
        const folderInput = document.getElementById("folder-input")
        if (folderInput) {
          // Ensure multiple attribute is set
          folderInput.setAttribute("webkitdirectory", "");
          folderInput.setAttribute("directory", "");
          folderInput.setAttribute("multiple", "");
          
          // Show visual feedback
          this.showFeedback("Select multiple folders to add as trait layers", "info");
          
          // Clear the input to ensure onChange triggers even if selecting the same folders
          folderInput.value = "";
          
          // Trigger click to open the file dialog
          folderInput.click()
        } else {
          console.error("Folder input element not found")
        }
      })
      // Setup tooltip for Add Folders button
      const addFoldersTooltip = addFoldersBtn.querySelector(".tooltiptext")
      if (addFoldersTooltip) {
        this.setupTooltipPositioning(addFoldersBtn, addFoldersTooltip)
      }
    } else {
      console.error("Add Folders button not found")
    }

    // Add event listener for selecting folders button
    const selectFoldersBtn = document.getElementById("select-folders-btn")
    if (selectFoldersBtn) {
      selectFoldersBtn.addEventListener("click", () => {
        console.log("Select folders button clicked")
        const folderInput = document.getElementById("folder-input")
        if (folderInput) {
          // Ensure multiple attribute is set
          folderInput.setAttribute("webkitdirectory", "");
          folderInput.setAttribute("directory", "");
          folderInput.setAttribute("multiple", "");
          
          // Clear the input to ensure onChange triggers even if selecting the same folders
          folderInput.value = "";
          
          // Trigger click to open the file dialog
          folderInput.click()
        } else {
          console.error("Folder input element not found")
        }
      })
    }

    // Add event listener for folder input
    const folderInput = document.getElementById("folder-input")
    if (folderInput) {
      // Remove any existing event listeners to avoid duplicates
      const newFolderInput = folderInput.cloneNode(true);
      folderInput.parentNode.replaceChild(newFolderInput, folderInput);
      
      // Add event listener to the fresh input element
      newFolderInput.addEventListener("change", (event) => {
        console.log("Folder input changed", event.target.files)
        if (event.target.files && event.target.files.length > 0) {
          console.log(`Processing ${event.target.files.length} files from ${this.countTopLevelFolders(event.target.files)} folders`);
          
          // Show processing feedback
          this.showFeedback(`Processing ${this.countTopLevelFolders(event.target.files)} folders...`, "info")
          
          // Process the selected folders
          this.handleFolderSelection(event, projectData)
        } else {
          console.log("No files selected")
        }
      })
    } else {
      console.error("Folder input element not found")
    }

    // Add event listener for delete all layers button
    const deleteAllLayersBtn = document.getElementById("delete-all-layers")
    if (deleteAllLayersBtn) {
      deleteAllLayersBtn.addEventListener("click", () => {
        NFTApp.getModule("confirmationModal").show(
          "", // Remove title - message will be centered
          '<div style="color: #ffffff; font-size: 18px; font-weight: 500; text-align: center;">Are you sure you want to delete all trait layers?</div>',
          '<div style="color: #ff4444; font-size: 12px; text-align: center;">This action cannot be undone and will remove<br>all trait layers and their traits from this project.</div>',
          () => {
            this.deleteAllTraitLayers(projectData)
          },
        )
      })
      // Setup tooltip for Delete All Layers button
      const deleteAllLayersTooltip = deleteAllLayersBtn.querySelector(".tooltiptext")
      if (deleteAllLayersTooltip) {
        this.setupTooltipPositioning(deleteAllLayersBtn, deleteAllLayersTooltip)
      }
    }

    // Add event listener for add layer button
    const addLayerBtn = document.getElementById("add-layer-btn")
    if (addLayerBtn) {
      addLayerBtn.addEventListener("click", () => {
        console.log("Add Layer button clicked")
        const layerNameInput = document.getElementById("add-layer-input")
        const layerName = layerNameInput ? layerNameInput.value.trim() : ""
        this.addEmptyLayer(projectData, layerName)
      })
      // Setup tooltip for Add Layer button
      const addLayerTooltip = addLayerBtn.querySelector(".tooltiptext")
      if (addLayerTooltip) {
        this.setupTooltipPositioning(addLayerBtn, addLayerTooltip)
      }
    } else {
      console.error("Add Layer button not found")
    }

    // Add event listener for layer name input to handle Enter key
    const layerNameInput = document.getElementById("add-layer-input")
    if (layerNameInput) {
      layerNameInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const addLayerBtn = document.getElementById("add-layer-btn")
          if (addLayerBtn) {
            addLayerBtn.click()
          }
        }
      })
    }

    // Set up trait layers drag and drop
    const dropzone = document.getElementById("trait-layers-dropzone")
    if (dropzone) {
      this.setupTraitLayersDragAndDrop(dropzone, projectData)
    }

    // Setup all tooltips in Traits & Rules tab
    this.setupTraitsRulesTooltips()
  },

  // Setup all tooltips in Traits & Rules tab
  setupTraitsRulesTooltips: function() {
    console.log("[Tooltips] Setting up all tooltips in Traits & Rules tab");
    
    // Setup tooltip for Jump to Rules button
    const jumpToRulesBtn = document.getElementById("jump-to-rules-btn")
    if (jumpToRulesBtn) {
      const jumpToRulesTooltip = jumpToRulesBtn.querySelector(".tooltiptext")
      if (jumpToRulesTooltip) {
        console.log("[Tooltips] Setting up tooltip for jump-to-rules-btn");
        this.setupTooltipPositioning(jumpToRulesBtn, jumpToRulesTooltip)
      } else {
        console.warn("[Tooltips] Tooltip element not found for jump-to-rules-btn");
      }
    } else {
      console.warn("[Tooltips] Button jump-to-rules-btn not found");
    }

    // Setup tooltip for Jump to Layers buttons (multiple instances)
    const jumpToLayersBtns = document.querySelectorAll("#jump-to-layers-btn, #jump-to-layers-bottom-btn")
    if (jumpToLayersBtns.length > 0) {
      jumpToLayersBtns.forEach(btn => {
        const tooltip = btn.querySelector(".tooltiptext")
        if (tooltip) {
          console.log(`[Tooltips] Setting up tooltip for ${btn.id}`);
          this.setupTooltipPositioning(btn, tooltip)
        } else {
          console.warn(`[Tooltips] Tooltip element not found for ${btn.id}`);
        }
      })
    } else {
      console.warn("[Tooltips] Jump to Layers buttons not found");
    }

    // Setup tooltip for Jump to Rules bottom button
    const jumpToRulesBottomBtn = document.getElementById("jump-to-rules-bottom-btn")
    if (jumpToRulesBottomBtn) {
      const tooltip = jumpToRulesBottomBtn.querySelector(".tooltiptext")
      if (tooltip) {
        console.log("[Tooltips] Setting up tooltip for jump-to-rules-bottom-btn");
        this.setupTooltipPositioning(jumpToRulesBottomBtn, tooltip)
      } else {
        console.warn("[Tooltips] Tooltip element not found for jump-to-rules-bottom-btn");
      }
    } else {
      console.warn("[Tooltips] Button jump-to-rules-bottom-btn not found");
    }

    // Setup tooltip for Add Combination Rule button
    const addCombinationRuleBtn = document.getElementById("add-combination-rule")
    if (addCombinationRuleBtn) {
      const tooltip = addCombinationRuleBtn.querySelector(".tooltiptext")
      if (tooltip) {
        this.setupTooltipPositioning(addCombinationRuleBtn, tooltip)
      }
    }

    // Setup tooltip for Check Rule Conflicts button
    const checkRuleConflictsBtn = document.getElementById("check-rule-conflicts")
    if (checkRuleConflictsBtn) {
      const tooltip = checkRuleConflictsBtn.querySelector(".tooltiptext")
      if (tooltip) {
        this.setupTooltipPositioning(checkRuleConflictsBtn, tooltip)
      }
    }

    // Setup tooltip for Clear Filter button
    const clearFilterBtn = document.getElementById("clear-rules-filter-btn")
    if (clearFilterBtn) {
      const tooltip = clearFilterBtn.querySelector(".tooltiptext")
      if (tooltip) {
        this.setupTooltipPositioning(clearFilterBtn, tooltip)
      }
    }

    // Setup tooltip for rules filter dropdown wrapper
    const rulesFilterDropdownWrapper = document.querySelector(".rules-filter-dropdown-wrapper.tooltip")
    if (rulesFilterDropdownWrapper) {
      // CRITICAL: Ensure the select element inside doesn't have a title attribute or tooltip class
      const dropdown = rulesFilterDropdownWrapper.querySelector("#rules-filter-dropdown, .rules-filter-dropdown")
      if (dropdown) {
        dropdown.removeAttribute('title');
        dropdown.setAttribute('title', ''); // Set empty title to prevent native browser tooltip
        dropdown.classList.remove('tooltip'); // Remove tooltip class if present
      }
      
      const tooltip = rulesFilterDropdownWrapper.querySelector(".tooltiptext")
      if (tooltip) {
        // CRITICAL: Update tooltip text to two lines if not already updated
        if (tooltip.textContent && !tooltip.innerHTML.includes('<br>')) {
          tooltip.innerHTML = 'Filter Rules by type.<br>Only available when you have 5+ rules.';
        }
        this.setupTooltipPositioning(rulesFilterDropdownWrapper, tooltip)
      }
    }

    // Setup tooltip for stacking order info
    const stackingOrderInfo = document.querySelector(".stacking-order-info.tooltip")
    if (stackingOrderInfo) {
      const tooltip = stackingOrderInfo.querySelector(".tooltiptext")
      if (tooltip) {
        this.setupTooltipPositioning(stackingOrderInfo, tooltip)
      }
    }

    // Setup tooltip for Add Layer button (CRITICAL: Ensure this is set up even if already set up in setupEventListeners)
    const addLayerBtn = document.getElementById("add-layer-btn")
    if (addLayerBtn) {
      const tooltip = addLayerBtn.querySelector(".tooltiptext")
      if (tooltip) {
        console.log("[Tooltips] Setting up tooltip for add-layer-btn");
        this.setupTooltipPositioning(addLayerBtn, tooltip)
      } else {
        console.warn("[Tooltips] Tooltip element not found for add-layer-btn");
      }
    } else {
      console.warn("[Tooltips] Button add-layer-btn not found");
    }

    // Setup tooltip for Add Folders button (CRITICAL: Ensure this is set up even if already set up in setupEventListeners)
    const addFoldersBtn = document.getElementById("add-folders-btn")
    if (addFoldersBtn) {
      const tooltip = addFoldersBtn.querySelector(".tooltiptext")
      if (tooltip) {
        console.log("[Tooltips] Setting up tooltip for add-folders-btn");
        this.setupTooltipPositioning(addFoldersBtn, tooltip)
      } else {
        console.warn("[Tooltips] Tooltip element not found for add-folders-btn");
      }
    } else {
      console.warn("[Tooltips] Button add-folders-btn not found");
    }

    // Setup tooltip for Delete All Layers button (CRITICAL: Ensure this is set up even if already set up in setupEventListeners)
    const deleteAllLayersBtn = document.getElementById("delete-all-layers")
    if (deleteAllLayersBtn) {
      const tooltip = deleteAllLayersBtn.querySelector(".tooltiptext")
      if (tooltip) {
        console.log("[Tooltips] Setting up tooltip for delete-all-layers");
        this.setupTooltipPositioning(deleteAllLayersBtn, tooltip)
      } else {
        console.warn("[Tooltips] Tooltip element not found for delete-all-layers");
      }
    } else {
      console.warn("[Tooltips] Button delete-all-layers not found");
    }
    
    console.log("[Tooltips] Finished setting up all tooltips in Traits & Rules tab");
  },

  // Set up trait layers drag and drop
  setupTraitLayersDragAndDrop: function (dropzone, projectData) {
    console.log("Setting up trait layers drag and drop")

    if (!dropzone) {
      console.error("Trait layers dropzone not found")
      return
    }

    // Prevent default drag behaviors
    dropzone.addEventListener(
      "dragenter",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.add("active")
      },
      false,
    )

    dropzone.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.add("active")
      },
      false,
    )

    dropzone.addEventListener(
      "dragleave",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.remove("active")
      },
      false,
    )

    dropzone.addEventListener(
      "drop",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.remove("active")

        const dt = e.dataTransfer
        const files = dt.files

        console.log("Files dropped:", files.length)

        // Process the dropped files as folders
        if (files && files.length > 0) {
          this.handleFolderSelection({ target: { files: files } }, projectData)
        }
      },
      false,
    )
  },

  // Handle folder selection for adding trait layers
  handleFolderSelection: function (event, projectData) {
    console.log("Handling folder selection", event.target.files)

    if (!event.target.files || event.target.files.length === 0) {
      console.log("No files selected")
      this.showFeedback("No folders selected", "error");
      return
    }

    // Add a processing indicator
    const processingIndicator = this.showProcessingIndicator();
    
    // Process the selected folders
    const files = Array.from(event.target.files)
    
    // Count unique top-level folders for better user feedback
    const topLevelFolders = new Set();
    files.forEach(file => {
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          topLevelFolders.add(parts[0]);
        }
      }
    });
    
    console.log(`Processing ${files.length} files from ${topLevelFolders.size} folders`);

    // Group files by directory
    const folderMap = new Map()

    files.forEach((file) => {
      // Get the folder path (everything before the last slash)
      const pathParts = file.webkitRelativePath.split("/")

      if (pathParts.length < 2) return // Skip if not in a subfolder

      // For multiple folder support, we need to get the top-level folder
      const topLevelFolder = pathParts[0]

      // For nested folders, create a proper folder structure
      // If it's a direct subfolder of the selected folder, use that as the layer name
      // Otherwise, use the full path except the filename as the layer name
      let folderName
      if (pathParts.length === 2) {
        // Direct child of selected folder
        folderName = topLevelFolder
      } else {
        // Nested folder - use the full path except filename
        folderName = pathParts.slice(0, -1).join("/")
      }

      const fileName = pathParts[pathParts.length - 1] // Last part is the file name

      // Skip non-image files
      if (!fileName.match(/\.(jpe?g|png|gif|bmp|webp|svg)$/i)) {
        console.log(`Skipping non-image file: ${fileName}`)
        return
      }

      // Create folder entry if it doesn't exist
      if (!folderMap.has(folderName)) {
        folderMap.set(folderName, [])
      }

      // Add file to the folder
      folderMap.get(folderName).push(file)
    })

    console.log("Processed folders:", folderMap)

    // Check if any valid folders were found
    if (folderMap.size === 0) {
      // Hide the processing indicator
      this.hideProcessingIndicator(processingIndicator);
      this.showFeedback("No valid image folders found", "error")
      return
    }

    // Update progress indicator message
    processingIndicator.querySelector('.processing-text').textContent = `Processing ${folderMap.size} folders...`;
    
    // Process each folder as a trait layer
    let addedLayers = 0
    const duplicateFolders = [] // Track duplicate folders
    const foldersToProcess = folderMap.size;
    let foldersProcessed = 0;

    const updateProgressIndicator = () => {
      foldersProcessed++;
      const progressPercentage = Math.round((foldersProcessed / foldersToProcess) * 100);
      processingIndicator.querySelector('.processing-text').textContent = 
        `Processing folders... ${progressPercentage}% (${foldersProcessed}/${foldersToProcess})`;
    };

    // Create an array of promises to track all folder processing
    const folderProcessingPromises = [];

    folderMap.forEach((files, folderName) => {
      // Skip if no image files in folder
      if (files.length === 0) {
        updateProgressIndicator();
        return;
      }

      // Check if a layer with this name already exists
      if (projectData.traits && projectData.traits.some((layer) => layer.name === folderName)) {
        // Add to duplicate folders list instead of just showing a warning
        duplicateFolders.push(folderName);
        updateProgressIndicator();
        return;
      }

      // Create a new trait layer
      const layerId = generateUniqueId()
      const traitLayer = {
        id: layerId,
        name: folderName,
        traits: [],
        order: projectData.traits ? projectData.traits.length + addedLayers : addedLayers,
        rarity: 100, // Default layer rarity
      }

      // Process each file in the folder
      const processFilePromises = files.map((file) => {
        return new Promise((resolve) => {
          const reader = new FileReader()

          reader.onload = (e) => {
            // Create trait object
            const traitName = file.name.replace(/\.[^/.]+$/, "") // Remove file extension
            const trait = {
              id: generateUniqueId(),
              name: traitName,
              imageData: e.target.result,
              rarity: 100 / files.length, // Distribute rarity evenly
            }

            // Add trait to layer
            traitLayer.traits.push(trait)
            resolve()
          }

          reader.onerror = () => {
            console.error(`Error reading file: ${file.name}`)
            resolve() // Resolve anyway to continue processing
          }

          reader.readAsDataURL(file)
        })
      })

      // Create a promise for processing this folder and add it to the promises array
      const folderPromise = Promise.all(processFilePromises).then(() => {
        // Add trait layer to project data
        if (!projectData.traits) {
          projectData.traits = []
        }

        // Add to the beginning of the array to make it the bottom layer
        projectData.traits.unshift(traitLayer)
        addedLayers++

        // Update order for all layers
        projectData.traits.forEach((layer, index) => {
          layer.order = index
        })

        // Update progress indicator
        updateProgressIndicator();
      });
      
      folderProcessingPromises.push(folderPromise);
    });

    // When all folders have been processed
    Promise.all(folderProcessingPromises).then(() => {
      // Hide the processing indicator
      this.hideProcessingIndicator(processingIndicator);
      
      // Update the UI
      this.updateTraitLayerUI(projectData);

      // Update the Delete All Layers button visibility
      this.updateDeleteAllLayersButtonVisibility(projectData);
      
      // Update rules section visibility
      if (NFTApp.getModule && NFTApp.getModule("combinationRules") && NFTApp.getModule("combinationRules").updateRulesSectionVisibility) {
        NFTApp.getModule("combinationRules").updateRulesSectionVisibility(projectData);
      }
      
      // Show success message for added layers
      if (addedLayers > 0) {
        this.showFeedback(`Successfully added ${addedLayers} trait layers`, "success");
      }

      // Show error feedback for duplicate folders
      if (duplicateFolders.length > 0) {
        const folderNames = duplicateFolders.join('", "')
        const message =
          duplicateFolders.length === 1
            ? `Error: A layer named "${folderNames}" already exists. The folder was skipped.`
            : `Error: Layers named "${folderNames}" already exist. These folders were skipped.`

        this.showFeedback(message, "error")

        // If no valid folders were added (all were duplicates)
        if (addedLayers === 0 && duplicateFolders.length === folderMap.size) {
          this.showFeedback("No new layers were added. All selected folders already exist as layers.", "error")
        }
      }
    }).catch(error => {
      console.error("Error processing folders:", error);
      // Hide the processing indicator
      this.hideProcessingIndicator(processingIndicator);
      this.showFeedback("Error processing folders: " + error.message, "error");
    });
  },
  
  // Helper function to show processing indicator
  showProcessingIndicator: function() {
    const existingIndicator = document.querySelector('.processing-indicator');
    if (existingIndicator) {
      return existingIndicator;
    }
    
    const processingIndicator = document.createElement("div");
    processingIndicator.className = "processing-indicator";
    processingIndicator.innerHTML = `
      <div class="processing-spinner"></div>
      <div class="processing-text">Processing folders...</div>
    `;
    
    // Add to body
    document.body.appendChild(processingIndicator);
    return processingIndicator;
  },
  
  // Helper function to hide processing indicator
  hideProcessingIndicator: function(indicator) {
    if (indicator && indicator.parentNode) {
      // Fade out
      indicator.style.opacity = "0";
      setTimeout(() => {
        if (indicator.parentNode) {
          indicator.parentNode.removeChild(indicator);
        }
      }, 300);
    }
  },

  // Helper function to get rarity color class
  getRarityColorClass: (rarity, isBackground = false, totalRarity = 100) => {
    const prefix = isBackground ? "bg-" : ""

    // Calculate relative percentage
    const relativePercentage = (rarity / totalRarity) * 100

    // Apply the new color scheme
    if (relativePercentage === 0) return `${prefix}rarity-zero` // 0%: dark grey
    if (relativePercentage <= 3) return `${prefix}rarity-very-low` // >0% to 3%: red
    if (relativePercentage <= 8) return `${prefix}rarity-low` // >3% to 8%: orange
    if (relativePercentage <= 28) return `${prefix}rarity-medium` // >8% to 28%: purple
    if (relativePercentage <= 53) return `${prefix}rarity-high` // >28% to 53%: blue
    if (relativePercentage <= 78) return `${prefix}rarity-very-high` // >53% to 78%: green
    return `${prefix}rarity-max` // >78% to 100%: white
  },

  // Helper function to format rarity value for display
  formatRarityValue: (rarity) => {
    const value = Number.parseFloat(rarity)
    if (isNaN(value)) return "0.00%"
    // If value is exactly 100 or very close (within 0.01), display "100%" instead of "100.00%"
    if (Math.abs(value - 100) < 0.01) return "100%"
    return `${value.toFixed(2)}%`
  },

  // Helper function to get rarity text based on percentage
  getRarityText: (rarity, totalRarity = 100) => {
    // Calculate relative percentage
    const relativePercentage = (rarity / totalRarity) * 100

    if (relativePercentage === 0) return "None"
    if (relativePercentage <= 3) return "Mythic"
    if (relativePercentage <= 8) return "Legendary"
    if (relativePercentage <= 28) return "Rare"
    if (relativePercentage <= 53) return "Uncommon"
    if (relativePercentage <= 78) return "Common"
    return "Abundant"
  },

  // Update the trait layer UI
  updateTraitLayerUI: function (projectData) {
    const container = document.getElementById("trait-layers-container")
    if (!container) return

    // CRITICAL: Ensure buttons are visible before updating UI
    this.ensureButtonsVisible()

    // Store expanded states before updating UI
    const expandedStates = {}
    const existingLayers = container.querySelectorAll(".trait-layer-bar")
    existingLayers.forEach((layer) => {
      const layerId = layer.dataset.id
      const content = layer.querySelector(".trait-layer-content")
      if (content && content.classList.contains("expanded")) {
        expandedStates[layerId] = true
      }
    })

    // Clear the container
    container.innerHTML = ""

    // If no traits, just leave the container empty - removed empty state
    if (!projectData.traits || projectData.traits.length === 0) {
      // Update the Delete All Layers button visibility
      this.updateDeleteAllLayersButtonVisibility(projectData)
      // Use our safe helper method
      this.safelyUpdatePreviewPanel(projectData, null);
      // CRITICAL: Ensure buttons are still visible after clearing
      setTimeout(() => this.ensureButtonsVisible(), 100)
      return
    }

    // Sort trait layers by order (first added = bottom = higher order number)
    const sortedTraits = [...projectData.traits].sort((a, b) => a.order - b.order)

    // Create trait layer bars
    sortedTraits.forEach((layer, index) => {
      const traitLayerBar = document.createElement("div")
      traitLayerBar.className = "trait-layer-bar"
      traitLayerBar.dataset.id = layer.id
      traitLayerBar.draggable = true

      // Check if this layer was expanded before
      const wasExpanded = expandedStates[layer.id] || false

      // Get color class for layer rarity
      const layerRarityColorClass = this.getRarityColorClass(layer.rarity || 0, false, 100)

      // Create the collapsed view with rarity slider in the header
      traitLayerBar.innerHTML = `
      <div class="trait-layer-header">
        <div class="trait-layer-drag-handle tooltip" draggable="true">
          <!-- Enhanced drag handle icon: six dots in two columns -->
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="18" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="18" r="1.5" fill="currentColor"/>
          </svg>
          <span class="tooltiptext">Drag to reorder</span>
        </div>
        <div class="trait-layer-arrow tooltip ${wasExpanded ? "expanded" : ""}">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="9 18 15 12 9 6"></polyline>
          </svg>
          <span class="tooltiptext">Expand/Collapse layer</span>
        </div>
        <div class="trait-layer-info">
          <div class="trait-layer-name tooltip">${layer.name}
            <span class="tooltiptext">Trait layer name: ${layer.name}</span>
          </div>
          <div class="trait-layer-stats tooltip">${layer.traits.length} traits
            <span class="tooltiptext">Total number of traits in this layer: ${layer.traits.length}</span>
          </div>
        </div>
        <div class="trait-layer-header-rarity">
          <input type="range" class="trait-layer-header-rarity-slider" value="${layer.rarity || 0}" min="0" max="100" step="0.5">
          <div class="trait-layer-header-rarity-value-wrapper tooltip">
            <input type="text" class="trait-layer-header-rarity-value ${layerRarityColorClass}" value="${this.formatRarityValue(layer.rarity || 0)}">
            <span class="tooltiptext">Layer Rarity percentage: controls how often<br>this layer traits appears in generated NFTs</span>
          </div>
        </div>
        <div class="trait-layer-position">
          <div class="position-controls">
            <button class="position-btn move-up tooltip" ${index === 0 ? "disabled" : ""}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="18 15 12 9 6 15"></polyline>
              </svg>
              <span class="tooltiptext">Move Trait Layer up</span>
            </button>
            <button class="position-btn move-down tooltip" ${index === sortedTraits.length - 1 ? "disabled" : ""}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
              <span class="tooltiptext">Move Trait Layer down</span>
            </button>
          </div>
        </div>
        <div class="trait-layer-actions">
          <button class="action-btn rename-layer tooltip">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            <span class="tooltiptext">Rename Trait Layer</span>
          </button>
          <button class="action-btn delete-layer tooltip">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
            <span class="tooltiptext">Delete Trait Layer</span>
          </button>
        </div>
      </div>
      <div class="trait-layer-content ${wasExpanded ? "expanded" : ""}">
        <div class="trait-layer-dropzone" data-layer-id="${layer.id}">
          <div class="dropzone-content">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>Drag & drop images here to add more traits</p>
            <button class="app-action-btn add-traits-btn tooltip">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Traits
              <span class="tooltiptext">Click to add more Traits to this Trait Layer.</span>
            </button>
            <input type="file" class="file-input trait-file-input" accept="image/*" multiple>
          </div>
        </div>
        <div class="trait-rarity-actions">
          <button class="app-action-btn randomize-rarities-tiered-btn tooltip">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <polyline points="16 3 21 3 21 8"></polyline>
              <line x1="4" y1="20" x2="21" y2="3"></line>
              <polyline points="21 16 21 21 16 21"></polyline>
              <line x1="15" y1="15" x2="21" y2="21"></line>
              <line x1="4" y1="4" x2="9" y2="9"></line>
            </svg>
            Randomize Rarities (tiered)
            <span class="tooltiptext">Tier Distribution:<br>Mythic (3%)<br>Legendary (5%)<br>Epic (12%)<br>Rare (20%)<br>Uncommon (25%)<br>Common (35%)</span>
          </button>
          <button class="app-action-btn randomize-unique-rarities-btn tooltip">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Randomize Unique Rarities
            <span class="tooltiptext">Assign random unique rarity values to all traits in this layer</span>
          </button>
          <button class="app-action-btn normalize-unique-rarities-btn tooltip">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
              <path d="M21 3v5h-5"></path>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
              <path d="M3 21v-5h5"></path>
            </svg>
            Normalize Rarities
            <span class="tooltiptext">Make all the rarities equal between each other.</span>
          </button>
        </div>
        <div class="expanded-trait-layer-cards-grid">
          ${this.generateTraitItems(layer)}
        </div>
      </div>
    `

      container.appendChild(traitLayerBar)

      // Process centered thumbnails after DOM insertion
      setTimeout(() => {
        const thumbImgs = traitLayerBar.querySelectorAll('.expanded-trait-layer-card-thumb-img[data-original-image]')
        thumbImgs.forEach(thumbImg => {
          if (!thumbImg.dataset.hasCentered) {
            const originalImageData = thumbImg.dataset.originalImage
            if (originalImageData) {
              this.extractCenteredTraitForThumbnail(thumbImg, originalImageData)
            }
          }
        })
      }, 100)

      // If this layer was expanded, restore its expanded state and update IDs
      if (wasExpanded) {
        traitLayerBar.classList.add("expanded")
        traitLayerBar.setAttribute("draggable", "false")
        // Update trait-image IDs to trait-layer-trait-image when expanded
        const traitImages = traitLayerBar.querySelectorAll(".trait-image")
        traitImages.forEach(img => {
          img.id = "trait-layer-trait-image"
        })
      }

      // Setup tooltip positioning for drag handle
      const dragHandle = traitLayerBar.querySelector(".trait-layer-drag-handle")
      if (dragHandle) {
        const dragHandleTooltip = dragHandle.querySelector(".tooltiptext")
        if (dragHandleTooltip) {
          this.setupTooltipPositioning(dragHandle, dragHandleTooltip)
        }
      }

      // Add event listeners for the trait layer bar
      this.setupTraitLayerBarEvents(traitLayerBar, layer, projectData)
    })

    // CRITICAL: Ensure buttons are visible after rendering all layers
    setTimeout(() => this.ensureButtonsVisible(), 100)

    // Set up drag and drop for trait layers
    this.setupTraitLayerDragAndDrop(container, projectData)

    // Update the Delete All Layers button visibility
    this.updateDeleteAllLayersButtonVisibility(projectData)
    // Use our safe helper method
    this.safelyUpdatePreviewPanel(projectData, null);
  },

  // Generate trait items HTML with rarity indicators - NEW STYLE matching Edit Combination Rule modal
  generateTraitItems: function (layer) {
    if (!layer.traits || layer.traits.length === 0) return "";

    // Sort traits alphabetically by name
    const sortedTraits = [...layer.traits].sort((a, b) => a.name.localeCompare(b.name));

    // Generate unique ID for each trait card
    return sortedTraits
      .map(trait => {
        const rarity = (trait.rarity || 0).toFixed(2);
        const thumbId = `trait-thumb-${layer.id}-${trait.id}`;
        
        return `
          <div class="expanded-trait-layer-cards-grid-item">
            <div class="expanded-trait-layer-card" data-trait-id="${trait.id}" data-layer-id="${layer.id}" tabindex="0">
              <span class="expanded-trait-layer-card-thumb">
                ${trait.imageData ? `<img id="${thumbId}" src="${trait.imageData}" alt="${trait.name}" class="expanded-trait-layer-card-thumb-img" data-original-image="${trait.imageData}">` : ''}
              </span>
              <input type="text" class="expanded-trait-layer-card-rarity-input" value="${rarity}%" data-trait-id="${trait.id}" data-layer-id="${layer.id}" data-original-value="${trait.rarity}">
              <div class="expanded-trait-layer-card-buttons">
                <button class="expanded-trait-layer-card-delete-btn tooltip" type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                  <span class="tooltiptext">Delete this trait from the layer</span>
                </button>
                <button class="expanded-trait-layer-card-replace-btn tooltip" type="button" data-trait-id="${trait.id}" data-layer-id="${layer.id}">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12 20h9"></path>
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"></path>
                  </svg>
                  <span class="tooltiptext">Replace the image for this trait</span>
                </button>
                <button class="expanded-trait-layer-card-view-btn tooltip" type="button">
                  <span class="tooltiptext">View full-size preview of ${trait.name}</span>
                  VIEW
                </button>
              </div>
              <span class="expanded-trait-layer-card-name">
                <span class="expanded-trait-layer-card-name-ellipsis">${trait.name}</span>
              </span>
              <div class="expanded-trait-layer-card-rarity-slider-container">
                <input type="range" class="expanded-trait-layer-card-rarity-slider" value="${trait.rarity}" min="0" max="${layer.rarity || 100}" step="0.5" data-original-value="${trait.rarity}" data-trait-id="${trait.id}">
              </div>
              <input type="file" accept="image/*" class="expanded-trait-layer-card-replace-input" data-trait-id="${trait.id}" data-layer-id="${layer.id}" style="display:none">
            </div>
          </div>
        `;
      })
      .join("");
  },

  // Extract centered trait from composite image for thumbnail display
  extractCenteredTraitForThumbnail: function(thumbImgElement, imageData) {
    if (!imageData || !thumbImgElement) return;
    
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        // Create canvas to analyze the image
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image to canvas
        ctx.drawImage(img, 0, 0);
        
        // Get image data to analyze transparency
        const imageDataArray = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageDataArray.data;
        
        // Find bounding box of non-transparent pixels
        let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
        let hasContent = false;
        
        for (let y = 0; y < canvas.height; y++) {
          for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const alpha = data[index + 3];
            
            if (alpha > 0) { // Non-transparent pixel
              hasContent = true;
              minX = Math.min(minX, x);
              minY = Math.min(minY, y);
              maxX = Math.max(maxX, x);
              maxY = Math.max(maxY, y);
            }
          }
        }
        
        if (!hasContent) {
          return;
        }
        
        // Add padding to bounding box
        const padding = 10;
        minX = Math.max(0, minX - padding);
        minY = Math.max(0, minY - padding);
        maxX = Math.min(canvas.width, maxX + padding);
        maxY = Math.min(canvas.height, maxY + padding);
        
        const width = maxX - minX;
        const height = maxY - minY;
        
        // Create new canvas for centered crop
        const cropCanvas = document.createElement('canvas');
        const cropCtx = cropCanvas.getContext('2d');
        
        // Use the larger dimension to create a square
        const size = Math.max(width, height);
        cropCanvas.width = size;
        cropCanvas.height = size;
        
        // Clear with transparent background
        cropCtx.clearRect(0, 0, size, size);
        
        // Calculate centered position
        const offsetX = (size - width) / 2;
        const offsetY = (size - height) / 2;
        
        // Draw the cropped region centered
        cropCtx.drawImage(
          canvas,
          minX, minY, width, height, // Source region
          offsetX, offsetY, width, height // Destination centered
        );
        
        // Convert to data URL and update thumbnail
        const centeredDataUrl = cropCanvas.toDataURL('image/png');
        if (thumbImgElement && !thumbImgElement.dataset.hasCentered) {
          thumbImgElement.src = centeredDataUrl;
          thumbImgElement.dataset.hasCentered = 'true';
        }
      } catch (error) {
        console.error('[Trait Layers] Error extracting centered trait:', error);
      }
    };
    
    img.onerror = () => {
      console.error('[Trait Layers] Error loading image for centered extraction');
    };
    
    img.src = imageData;
  },

  // Helper function to setup tooltip positioning using global tooltip manager
  setupTooltipPositioning: function(element, tooltip) {
    if (!element || !tooltip) return;
    
    // CRITICAL: Skip if already set up to prevent duplicate event listeners
    if (element.dataset.tooltipSetup === "true") {
      return;
    }
    element.dataset.tooltipSetup = "true";
    
    // CRITICAL: Add cursor help to element (use setProperty with important to override CSS)
    element.style.setProperty("cursor", "help", "important");
    
    // CRITICAL: Ensure SVG icons inside the element also trigger the tooltip
    // Find all SVG elements inside the button and ensure they're part of the tooltip trigger area
    const svgElements = element.querySelectorAll("svg");
    svgElements.forEach(svg => {
      // Add cursor help to SVG as well
      svg.style.setProperty("cursor", "help", "important");
    });
    
    // CRITICAL: Ensure tooltip has 1 second transition
    tooltip.style.setProperty("transition", "opacity 1s ease", "important");
    
    // CRITICAL: Ensure tooltip starts hidden
    tooltip.style.setProperty("visibility", "hidden", "important");
    tooltip.style.setProperty("opacity", "0", "important");
    
    // CRITICAL: For trait layer header buttons (position-btn, rename-layer, delete-layer) and
    // rarity action buttons (randomize-rarities-tiered-btn, randomize-unique-rarities-btn, normalize-unique-rarities-btn),
    // use local implementation to ensure reliable tooltip display
    // The global tooltip manager might interfere with these buttons due to event conflicts
    const isTraitLayerHeaderButton = element.classList.contains('position-btn') || 
                                      element.classList.contains('rename-layer') || 
                                      element.classList.contains('delete-layer') ||
                                      element.closest('.trait-layer-header');
    
    const isRarityActionButton = element.classList.contains('randomize-rarities-tiered-btn') ||
                                  element.classList.contains('randomize-unique-rarities-btn') ||
                                  element.classList.contains('normalize-unique-rarities-btn') ||
                                  element.classList.contains('normalize-rarities-btn');
    
    // Use global tooltip manager if available, but NOT for trait layer header buttons or rarity action buttons
    if (!isTraitLayerHeaderButton && !isRarityActionButton) {
      const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
      if (tooltipManager && tooltipManager.setupTooltip) {
        tooltipManager.setupTooltip(element, tooltip);
        return;
      }
    }

    // Fallback to local implementation if manager not available
    let tooltipTimeout = null;
    let isDragging = false;
    
    // CRITICAL: For draggable elements, we need to handle drag events to prevent tooltip interference
    // Check if element or parent is draggable
    const isDraggable = element.draggable === true || element.closest('[draggable="true"]');
    
    if (isDraggable) {
      // Prevent drag from interfering with tooltip
      element.addEventListener("dragstart", () => {
        isDragging = true;
        // Clear any pending tooltip timeout
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          tooltipTimeout = null;
        }
        // Hide tooltip immediately if showing
        tooltip.style.opacity = "0";
        tooltip.style.visibility = "hidden";
      });
      
      element.addEventListener("dragend", () => {
        isDragging = false;
      });
    }
    
    element.addEventListener("mouseenter", (e) => {
      // Don't show tooltip if dragging
      if (isDragging) return;
      
      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      tooltipTimeout = setTimeout(() => {
        // Double-check we're not dragging
        if (isDragging) return;
        
        // CRITICAL: Set ALL positioning properties FIRST before making tooltip visible
        // This prevents tooltip from appearing in wrong position or being hidden
        tooltip.style.setProperty("position", "fixed", "important");
        tooltip.style.setProperty("z-index", "2147483647", "important");
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");
        // CRITICAL: Keep tooltip hidden while measuring, positioned off-screen
        tooltip.style.setProperty("visibility", "hidden", "important");
        tooltip.style.setProperty("opacity", "0", "important");
        tooltip.style.setProperty("top", "-9999px", "important");
        tooltip.style.setProperty("left", "-9999px", "important");
        // Force reflow to ensure styles are applied
        void tooltip.offsetHeight;
        // Now measure tooltip dimensions
        const tooltipWidth = tooltip.offsetWidth || 200;
        const tooltipHeight = tooltip.offsetHeight;
        // CRITICAL: Calculate position BEFORE making tooltip visible
        const elementRect = element.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        const topPosition = elementRect.top - tooltipHeight - 5;
        // Set final position while still hidden (CRITICAL: Do this BEFORE making visible)
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Now make tooltip visible and fade in (position is already set correctly)
        requestAnimationFrame(() => {
          tooltip.style.setProperty("visibility", "visible", "important");
          tooltip.style.setProperty("opacity", "1", "important");
        });
        tooltipTimeout = null;
      }, 1000);
    });
    
    element.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      tooltip.style.setProperty("opacity", "0", "important");
      // Wait for fade out transition to complete before hiding (1 second to match Export NFTs tab)
      setTimeout(() => {
        tooltip.style.setProperty("visibility", "hidden", "important");
      }, 1000);
    });
    
    // CRITICAL: Also set up tooltip on SVG elements inside the button
    // This ensures hovering over the SVG icon also shows the tooltip
    svgElements.forEach(svg => {
      // Create a shared tooltip handler function
      const showTooltip = () => {
        // Don't show tooltip if dragging
        if (isDragging) return;
        
        // Clear any existing timeout
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          tooltipTimeout = null;
        }
        // Show tooltip after 1 second delay
        tooltipTimeout = setTimeout(() => {
          // Double-check we're not dragging
          if (isDragging) return;
          
          // Use the button element's position for tooltip (not SVG)
          tooltip.style.setProperty("position", "fixed", "important");
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("bottom", "auto", "important");
          tooltip.style.setProperty("right", "auto", "important");
          tooltip.style.setProperty("margin", "0", "important");
          tooltip.style.setProperty("transform", "none", "important");
          tooltip.style.setProperty("background-color", "#000000", "important");
          tooltip.style.setProperty("background", "#000000", "important");
          tooltip.style.setProperty("color", "#f39c12", "important");
          tooltip.style.setProperty("visibility", "hidden", "important");
          tooltip.style.setProperty("opacity", "0", "important");
          tooltip.style.setProperty("top", "-9999px", "important");
          tooltip.style.setProperty("left", "-9999px", "important");
          void tooltip.offsetHeight;
          const tooltipWidth = tooltip.offsetWidth || 200;
          const tooltipHeight = tooltip.offsetHeight;
          // Use button element's position (not SVG)
          const elementRect = element.getBoundingClientRect();
          const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
          const topPosition = elementRect.top - tooltipHeight - 5;
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
          requestAnimationFrame(() => {
            tooltip.style.setProperty("visibility", "visible", "important");
            tooltip.style.setProperty("opacity", "1", "important");
          });
          tooltipTimeout = null;
        }, 1000);
      };
      
      const hideTooltip = () => {
        // Clear the show timeout if mouse leaves before delay completes
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          tooltipTimeout = null;
        }
        tooltip.style.setProperty("opacity", "0", "important");
        setTimeout(() => {
          tooltip.style.setProperty("visibility", "hidden", "important");
        }, 1000);
      };
      
      // Add event listeners to SVG
      svg.addEventListener("mouseenter", showTooltip);
      svg.addEventListener("mouseleave", hideTooltip);
    });
  },

  // Set up event listeners for a trait layer bar
  setupTraitLayerBarEvents: function (traitLayerBar, layer, projectData) {
    // Toggle expand/collapse
    const header = traitLayerBar.querySelector(".trait-layer-header")
    const content = traitLayerBar.querySelector(".trait-layer-content")
    const arrow = traitLayerBar.querySelector(".trait-layer-arrow")

    // Arrow click handler for expand/collapse
    arrow.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleTraitLayerExpansion(traitLayerBar)
    })
    
    // Setup tooltip for expand arrow
    const arrowTooltip = arrow.querySelector(".tooltiptext")
    if (arrowTooltip) {
      this.setupTooltipPositioning(arrow, arrowTooltip)
    }

    // Header click handler (excluding buttons and controls)
    header.addEventListener("click", (e) => {
      // Don't toggle if clicking on buttons, drag handle, or rarity controls
      if (
        e.target.closest(".position-btn") ||
        e.target.closest(".action-btn") ||
        e.target.closest(".trait-layer-drag-handle") ||
        e.target.closest(".trait-layer-header-rarity") ||
        e.target.closest(".trait-layer-arrow")
      ) {
        return
      }

      this.toggleTraitLayerExpansion(traitLayerBar)
    })

    // Move up button
    const moveUpBtn = traitLayerBar.querySelector(".move-up")
    if (moveUpBtn) {
      moveUpBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.moveTraitLayerUp(layer.id, projectData)
      })
      // Setup tooltip positioning
      const moveUpTooltip = moveUpBtn.querySelector(".tooltiptext")
      if (moveUpTooltip) {
        this.setupTooltipPositioning(moveUpBtn, moveUpTooltip)
      }
    }

    // Move down button
    const moveDownBtn = traitLayerBar.querySelector(".move-down")
    if (moveDownBtn) {
      moveDownBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.moveTraitLayerDown(layer.id, projectData)
      })
      // Setup tooltip positioning
      const moveDownTooltip = moveDownBtn.querySelector(".tooltiptext")
      if (moveDownTooltip) {
        this.setupTooltipPositioning(moveDownBtn, moveDownTooltip)
      }
    }

    // Rename layer button
    const renameLayerBtn = traitLayerBar.querySelector(".rename-layer")
    if (renameLayerBtn) {
      renameLayerBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this.showRenameModal("Rename Trait Layer", layer.name, (newName) => {
          if (!newName || newName.trim() === "") {
            this.showFeedback("Layer name cannot be empty", "error")
            return
          }

          // Check if a layer with this name already exists
          if (projectData.traits.some((l) => l.id !== layer.id && l.name === newName)) {
            this.showFeedback(`A layer named "${newName}" already exists`, "error")
            return
          }

          // Store the old name for updating combination rules
          const oldName = layer.name

          // Update the layer name
          layer.name = newName

          // Update combination rules that reference this layer
          this.updateCombinationRulesAfterLayerRename(projectData, layer.id, oldName, newName)

          // Preserve expansion state
          const isExpanded = content.classList.contains("expanded")

          // Update the UI
          this.updateTraitLayerUI(projectData)

          // Re-expand the layer if it was expanded before
          if (isExpanded) {
            const updatedTraitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layer.id}"]`)
            if (updatedTraitLayerBar) {
              const content = updatedTraitLayerBar.querySelector(".trait-layer-content")
              const arrow = updatedTraitLayerBar.querySelector(".trait-layer-arrow")
              if (content && arrow) {
                content.classList.add("expanded")
                arrow.classList.add("expanded")
              }
            }
          }

          this.showFeedback(`Layer renamed to "${newName}"`, "success")
        })
      })
      // Setup tooltip positioning
      const renameTooltip = renameLayerBtn.querySelector(".tooltiptext")
      if (renameTooltip) {
        this.setupTooltipPositioning(renameLayerBtn, renameTooltip)
      }
    }

    // Delete layer button
    const deleteLayerBtn = traitLayerBar.querySelector(".delete-layer")
    if (deleteLayerBtn) {
      deleteLayerBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        NFTApp.getModule("confirmationModal").show(
          "Delete Trait Layer",
          `Are you sure you want to delete the "${layer.name}" trait layer?`,
          "This action cannot be undone and will remove all traits in this layer.",
          () => {
            this.deleteTraitLayer(layer.id, projectData)
          },
        )
      })
      // Setup tooltip positioning
      const deleteTooltip = deleteLayerBtn.querySelector(".tooltiptext")
      if (deleteTooltip) {
        this.setupTooltipPositioning(deleteLayerBtn, deleteTooltip)
      }
    }

    // Setup tooltip for trait layer name
    const traitLayerName = traitLayerBar.querySelector(".trait-layer-name")
    if (traitLayerName) {
      const nameTooltip = traitLayerName.querySelector(".tooltiptext")
      if (nameTooltip) {
        this.setupTooltipPositioning(traitLayerName, nameTooltip)
      }
    }

    // Setup tooltip for trait count
    const traitLayerStats = traitLayerBar.querySelector(".trait-layer-stats")
    if (traitLayerStats) {
      const statsTooltip = traitLayerStats.querySelector(".tooltiptext")
      if (statsTooltip) {
        this.setupTooltipPositioning(traitLayerStats, statsTooltip)
      }
    }

    // Setup tooltip for rarity value
    const rarityValueWrapper = traitLayerBar.querySelector(".trait-layer-header-rarity-value-wrapper")
    if (rarityValueWrapper) {
      const rarityTooltip = rarityValueWrapper.querySelector(".tooltiptext")
      if (rarityTooltip) {
        this.setupTooltipPositioning(rarityValueWrapper, rarityTooltip)
      }
    }

    // Header rarity slider and input
    const headerRaritySlider = traitLayerBar.querySelector(".trait-layer-header-rarity-slider")
    const headerRarityValue = traitLayerBar.querySelector(".trait-layer-header-rarity-value")

    if (headerRaritySlider && headerRarityValue) {
      // Prevent drag and drop when interacting with the slider
      headerRaritySlider.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        // Temporarily disable draggable on the parent
        traitLayerBar.setAttribute("draggable", "false")
      })

      headerRaritySlider.addEventListener("mouseup", () => {
        // Re-enable draggable on the parent
        traitLayerBar.setAttribute("draggable", "true")
      })

      headerRarityValue.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        // Temporarily disable draggable on the parent
        traitLayerBar.setAttribute("draggable", "false")
      })

      headerRarityValue.addEventListener("mouseup", () => {
        // Re-enable draggable on the parent
        traitLayerBar.setAttribute("draggable", "true")
      })

      // Prevent propagation to avoid toggling the layer when adjusting rarity
      headerRaritySlider.addEventListener("click", (e) => e.stopPropagation())
      headerRarityValue.addEventListener("click", (e) => e.stopPropagation())

      // Update the value display when slider changes
      headerRaritySlider.addEventListener("input", (e) => {
        e.stopPropagation()
        const value = Number.parseFloat(e.target.value)
        headerRarityValue.value = this.formatRarityValue(value)

        // Update color class based on new rarity value
        const colorClass = this.getRarityColorClass(value, false, 100)
        headerRarityValue.className = `trait-layer-header-rarity-value ${colorClass}`
      })

      // Update the layer rarity and adjust trait rarities proportionally when slider changes
      headerRaritySlider.addEventListener("change", (e) => {
        e.stopPropagation()
        const newLayerRarity = Number.parseFloat(e.target.value)
        // Preserve expansion state
        const isExpanded = content.classList.contains("expanded")
        this.updateLayerRarity(layer.id, newLayerRarity, projectData, isExpanded)
      })

      // Update slider when input value changes
      headerRarityValue.addEventListener("input", (e) => {
        e.stopPropagation()
        let value = e.target.value.replace(/[^0-9.]/g, "")
        value = Number.parseFloat(value)
        if (!isNaN(value)) {
          value = Math.min(Math.max(value, 0), 100)
          headerRaritySlider.value = value

          // Update color class based on new rarity value
          const colorClass = this.getRarityColorClass(value, false, 100)
          headerRarityValue.className = `trait-layer-header-rarity-value ${colorClass}`
        }
      })

      // Update layer rarity when input loses focus
      headerRarityValue.addEventListener("blur", (e) => {
        e.stopPropagation()
        let value = Number.parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
        if (isNaN(value)) value = 0
        value = Math.min(Math.max(value, 0), 100)
        e.target.value = this.formatRarityValue(value)
        headerRaritySlider.value = value

        // Update color class based on new rarity value
        const colorClass = this.getRarityColorClass(value)
        headerRarityValue.className = `trait-layer-header-rarity-value ${colorClass}`

        // Preserve expansion state
        const isExpanded = content.classList.contains("expanded")
        this.updateLayerRarity(layer.id, value, projectData, isExpanded)
      })

      // Handle enter key on input
      headerRarityValue.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.blur()
        }
      })
    }

    // Add traits button
    const addTraitsBtn = traitLayerBar.querySelector(".add-traits-btn")
    const traitFileInput = traitLayerBar.querySelector(".trait-file-input")

    if (addTraitsBtn && traitFileInput) {
      // CRITICAL: Ensure tooltip class is present and tooltip element exists
      addTraitsBtn.classList.add("tooltip")
      let addTraitsTooltip = addTraitsBtn.querySelector(".tooltiptext")
      if (!addTraitsTooltip) {
        addTraitsTooltip = document.createElement("span")
        addTraitsTooltip.className = "tooltiptext"
        addTraitsTooltip.textContent = "Click to add more Traits to this Trait Layer."
        addTraitsBtn.appendChild(addTraitsTooltip)
      } else {
        // Update tooltip text if it exists
        addTraitsTooltip.textContent = "Click to add more Traits to this Trait Layer."
      }
      
      // CRITICAL: Setup tooltip positioning with standard app behavior
      if (addTraitsTooltip) {
        this.setupTooltipPositioning(addTraitsBtn, addTraitsTooltip)
      }
      
      addTraitsBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        e.preventDefault() // Add this to prevent any default behavior
        console.log("Add Traits button clicked") // Add logging
        traitFileInput.click()
      })

      traitFileInput.addEventListener("change", (e) => {
        console.log("Trait file input changed", e.target.files) // Add logging
        // Preserve expansion state
        const isExpanded = content.classList.contains("expanded")
        this.addTraitsToLayer(e.target.files, layer.id, projectData, isExpanded)
      })
    }

    // Set up trait dropzone
    const traitDropzone = traitLayerBar.querySelector(".trait-layer-dropzone")
    if (traitDropzone) {
      this.setupTraitDropzone(traitDropzone, layer.id, projectData)
    }

    // Randomize rarities (tiered) button - respect selected traits
    const randomizeRaritiesTieredBtn = traitLayerBar.querySelector(".randomize-rarities-tiered-btn")
    if (randomizeRaritiesTieredBtn) {
      const randomizeTieredTooltip = randomizeRaritiesTieredBtn.querySelector('.tooltiptext');
      // CRITICAL: Setup tooltip positioning FIRST before any other event listeners
      if (randomizeTieredTooltip) {
        // Store base HTML before setup
        const baseHtml = randomizeTieredTooltip.innerHTML;
        if (!randomizeTieredTooltip.getAttribute('data-base-html')) {
          randomizeTieredTooltip.setAttribute('data-base-html', baseHtml);
        }
        this.setupTooltipPositioning(randomizeRaritiesTieredBtn, randomizeTieredTooltip)
      }
      // Dynamic tooltip note when traits are selected - update content but don't interfere with positioning
      randomizeRaritiesTieredBtn.addEventListener('mouseenter', () => {
        const tip = randomizeRaritiesTieredBtn.querySelector('.tooltiptext');
        if (!tip) return;
        const selectedCount = traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected').length;
        const baseHtml = tip.getAttribute('data-base-html') || tip.innerHTML;
        if (!tip.getAttribute('data-base-html')) tip.setAttribute('data-base-html', baseHtml);
        // Update content but preserve tooltip visibility/positioning set by setupTooltipPositioning
        tip.innerHTML = baseHtml + (selectedCount > 0 ? `<br><br><span style="color:#6c5ce7;font-weight:600;">*this feature will only be used<br>on the selected traits.</span>` : '');
      }, { passive: true });
      randomizeRaritiesTieredBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const selectedIds = Array.from(traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected')).map(card => card.dataset.traitId)
        this.randomizeTraitRarities(layer.id, projectData, selectedIds)
      })
    }

    // Randomize unique rarities button - respect selected traits
    const randomizeUniqueRaritiesBtn = traitLayerBar.querySelector(".randomize-unique-rarities-btn")
    if (randomizeUniqueRaritiesBtn) {
      const randomizeUniqueTooltip = randomizeUniqueRaritiesBtn.querySelector('.tooltiptext');
      // CRITICAL: Setup tooltip positioning FIRST before any other event listeners
      if (randomizeUniqueTooltip) {
        // Store base HTML before setup
        const baseHtml = randomizeUniqueTooltip.innerHTML;
        if (!randomizeUniqueTooltip.getAttribute('data-base-html')) {
          randomizeUniqueTooltip.setAttribute('data-base-html', baseHtml);
        }
        this.setupTooltipPositioning(randomizeUniqueRaritiesBtn, randomizeUniqueTooltip)
      }
      // Dynamic tooltip note when traits are selected - update content but don't interfere with positioning
      randomizeUniqueRaritiesBtn.addEventListener('mouseenter', () => {
        const tip = randomizeUniqueRaritiesBtn.querySelector('.tooltiptext');
        if (!tip) return;
        const selectedCount = traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected').length;
        const baseHtml = tip.getAttribute('data-base-html') || tip.innerHTML;
        if (!tip.getAttribute('data-base-html')) tip.setAttribute('data-base-html', baseHtml);
        // Update content but preserve tooltip visibility/positioning set by setupTooltipPositioning
        tip.innerHTML = baseHtml + (selectedCount > 0 ? `<br><br><span style="color:#6c5ce7;font-weight:600;">*this feature will only be used<br>on the selected traits.</span>` : '');
      }, { passive: true });
      randomizeUniqueRaritiesBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const selectedIds = Array.from(traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected')).map(card => card.dataset.traitId)
        this.randomizeUniqueTraitRarities(layer.id, projectData, selectedIds)
      })
    }

    // Normalize unique rarities button - respect selected traits
    const normalizeUniqueRaritiesBtn = traitLayerBar.querySelector(".normalize-unique-rarities-btn")
    if (normalizeUniqueRaritiesBtn) {
      const normalizeTooltip = normalizeUniqueRaritiesBtn.querySelector('.tooltiptext');
      // CRITICAL: Setup tooltip positioning FIRST before any other event listeners
      if (normalizeTooltip) {
        // Store base HTML before setup
        const baseHtml = normalizeTooltip.innerHTML;
        if (!normalizeTooltip.getAttribute('data-base-html')) {
          normalizeTooltip.setAttribute('data-base-html', baseHtml);
        }
        this.setupTooltipPositioning(normalizeUniqueRaritiesBtn, normalizeTooltip)
      }
      // Dynamic tooltip note when traits are selected - update content but don't interfere with positioning
      normalizeUniqueRaritiesBtn.addEventListener('mouseenter', () => {
        const tip = normalizeUniqueRaritiesBtn.querySelector('.tooltiptext');
        if (!tip) return;
        const selectedCount = traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected').length;
        const baseHtml = tip.getAttribute('data-base-html') || tip.innerHTML;
        if (!tip.getAttribute('data-base-html')) tip.setAttribute('data-base-html', baseHtml);
        // Update content but preserve tooltip visibility/positioning set by setupTooltipPositioning
        tip.innerHTML = baseHtml + (selectedCount > 0 ? `<br><br><span style="color:#6c5ce7;font-weight:600;">*this feature will only be used<br>on the selected traits.</span>` : '');
      }, { passive: true });
      normalizeUniqueRaritiesBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        const selectedIds = Array.from(traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected')).map(card => card.dataset.traitId)
        this.normalizeUniqueTraitRarities(layer.id, projectData, selectedIds)
      })
    }

    // Toggle selection on trait items - NEW CARDS
    // CRITICAL: Only the card itself should be selectable, not buttons/sliders
    const traitCards = traitLayerBar.querySelectorAll('.expanded-trait-layer-card')
    traitCards.forEach(card => {
      card.addEventListener('click', (e) => {
        // Ignore clicks on any controls/buttons/sliders/percentage input - prevent card selection
        if (
          e.target.closest('.expanded-trait-layer-card-delete-btn') ||
          e.target.closest('.expanded-trait-layer-card-replace-btn') ||
          e.target.closest('.expanded-trait-layer-card-view-btn') ||
          e.target.closest('.expanded-trait-layer-card-rarity-slider') ||
          e.target.closest('.expanded-trait-layer-card-rarity-slider-container') ||
          e.target.closest('.expanded-trait-layer-card-rarity-input') ||
          e.target.closest('.expanded-trait-layer-card-buttons') ||
          e.target.closest('button') ||
          (e.target.closest('input') && !e.target.closest('.expanded-trait-layer-card').classList.contains('selected'))
        ) return
        card.classList.toggle('selected')
      })
    })

    // VIEW button handlers - NEW CARDS (use generateNftsUI.showTraitFullSizePopup if available)
    // VIEW shows the trait in its actual position in the NFT (not centered)
    const viewBtns = traitLayerBar.querySelectorAll('.expanded-trait-layer-card-view-btn')
    viewBtns.forEach(btn => {
      // Setup tooltip for VIEW button
      const viewTooltip = btn.querySelector(".tooltiptext")
      if (viewTooltip) {
        this.setupTooltipPositioning(btn, viewTooltip)
      }
      
      btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const traitCard = btn.closest('.expanded-trait-layer-card')
        const traitId = traitCard?.dataset?.traitId
        const trait = layer.traits.find(t => t.id === traitId)
        if (!trait) return
        
        // Use original imageData (not centered version) for VIEW preview
        // Get original image from data attribute if available, otherwise use trait.imageData
        const thumbImg = traitCard?.querySelector('.expanded-trait-layer-card-thumb-img')
        const originalImageData = thumbImg?.dataset?.originalImage || trait.imageData || trait.image
        
        const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')
        if (generateNftsUI && generateNftsUI.showTraitFullSizePopup) {
          const traitObj = { trait: { image: trait.image, imageData: originalImageData, name: trait.name }, layer: { name: layer.name } }
          generateNftsUI.showTraitFullSizePopup(traitObj, layer.name, trait.name)
        }
      })
    })

    // Delete trait buttons - NEW CARDS
    const deleteTraitBtns = traitLayerBar.querySelectorAll(".expanded-trait-layer-card-delete-btn")
    deleteTraitBtns.forEach((btn) => {
      // Setup tooltip for delete button
      const deleteTooltip = btn.querySelector(".tooltiptext")
      if (deleteTooltip) {
        this.setupTooltipPositioning(btn, deleteTooltip)
      }
      
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const traitCard = btn.closest(".expanded-trait-layer-card")
        const traitId = traitCard?.dataset?.traitId
        const trait = layer.traits.find((t) => t.id === traitId)

        if (trait) {
          NFTApp.getModule("confirmationModal").show(
            "Delete Trait",
            `Are you sure you want to delete the "${trait.name}" trait?`,
            "This action cannot be undone.",
            () => {
              // Preserve expansion state
              const isExpanded = content.classList.contains("expanded")
              this.deleteTrait(layer.id, traitId, projectData, isExpanded)
            },
          )
        }
      })
    })

    // Trait rarity slider change events - NEW CARDS
    const traitRaritySliders = traitLayerBar.querySelectorAll(".expanded-trait-layer-card-rarity-slider")

    traitRaritySliders.forEach((slider) => {
      const traitCard = slider.closest(".expanded-trait-layer-card")
      const traitId = traitCard?.dataset?.traitId || slider.dataset.traitId
      const rarityInput = traitCard?.querySelector(".expanded-trait-layer-card-rarity-input")

      // Prevent drag and drop when interacting with the slider
      slider.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        // Temporarily disable draggable on the parent
        traitLayerBar.setAttribute("draggable", "false")
      })

      slider.addEventListener("mouseup", () => {
        // Re-enable draggable on the parent
        traitLayerBar.setAttribute("draggable", "true")
      })

      // Prevent propagation to avoid triggering parent events
      slider.addEventListener("click", (e) => e.stopPropagation())

      // Update the value display when slider changes - NEW CARDS
      slider.addEventListener("input", (e) => {
        e.stopPropagation()
        const value = Number.parseFloat(e.target.value)
        const valueFormatted = value.toFixed(2)
        // Update rarity input field
        if (rarityInput) {
          rarityInput.value = `${valueFormatted}%`
        }
      })

      // Update the trait rarity in the data when slider change is complete
      slider.addEventListener("change", (e) => {
        e.stopPropagation()
        const value = Number.parseFloat(e.target.value)
        // Preserve expansion state
        const isExpanded = content.classList.contains("expanded")
        this.updateTraitRarity(layer.id, traitId, value, projectData, isExpanded)
      })
    })

    // Set up trait rarity input fields for expanded trait layer cards
    const expandedTraitRarityInputs = traitLayerBar.querySelectorAll(".expanded-trait-layer-card-rarity-input")
    expandedTraitRarityInputs.forEach((input) => {
      const traitCard = input.closest(".expanded-trait-layer-card")
      const traitId = input.dataset.traitId || traitCard?.dataset?.traitId
      const slider = traitCard?.querySelector(".expanded-trait-layer-card-rarity-slider")
      const layerRarity = layer.rarity || 100

      // Prevent drag and drop when interacting with the input
      input.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        traitLayerBar.setAttribute("draggable", "false")
      })

      input.addEventListener("mouseup", () => {
        traitLayerBar.setAttribute("draggable", "true")
      })

      // Prevent propagation to avoid triggering parent events
      input.addEventListener("click", (e) => e.stopPropagation())

      // Select all text on focus for easy editing
      input.addEventListener("focus", (e) => {
        e.stopPropagation()
        input.select()
      })

      // Update slider when input changes
      input.addEventListener("input", (e) => {
        e.stopPropagation()
        // Remove % and parse value
        let value = Number.parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
        if (isNaN(value)) value = 0
        // Clamp to valid range
        value = Math.min(Math.max(value, 0), Number.parseFloat(layerRarity))
        // Update slider
        if (slider) {
          slider.value = value
        }
      })

      // Update the trait rarity in the data when input loses focus
      input.addEventListener("blur", (e) => {
        e.stopPropagation()
        // Remove % and parse value
        let value = Number.parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
        if (isNaN(value)) value = 0
        // Clamp to valid range
        value = Math.min(Math.max(value, 0), Number.parseFloat(layerRarity))
        // Format and update input display
        e.target.value = `${value.toFixed(2)}%`
        // Update slider
        if (slider) {
          slider.value = value
        }
        // Preserve expansion state
        const isExpanded = content.classList.contains("expanded")
        this.updateTraitRarity(layer.id, traitId, value, projectData, isExpanded)
      })

      // Handle enter key on input
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.stopPropagation()
          e.target.blur()
        }
      })
    })

    // Set up trait rarity input fields (old style - keep for compatibility)
    const traitRarityInputFields = traitLayerBar.querySelectorAll(".trait-rarity-input")

    traitRarityInputFields.forEach((input) => {
      const traitItem = input.closest(".trait-layer-trait-item") || input.closest(".trait-item")
      const traitId = traitItem.dataset.id
      const slider = traitItem.querySelector(".trait-layer-trait-rarity-slider")

      // Prevent drag and drop when interacting with the input
      input.addEventListener("mousedown", (e) => {
        e.stopPropagation()
        traitLayerBar.setAttribute("draggable", "false")
      })

      input.addEventListener("mouseup", () => {
        traitLayerBar.setAttribute("draggable", "true")
      })

      // Prevent propagation
      input.addEventListener("click", (e) => e.stopPropagation())

      // Update slider when input value changes
      input.addEventListener("input", (e) => {
        e.stopPropagation()
        let value = e.target.value.replace(/[^0-9.]/g, "")
        value = Number.parseFloat(value)
        if (!isNaN(value)) {
          value = Math.min(Math.max(value, 0), Number.parseFloat(layer.rarity || 100))
          slider.value = value

          // Update color class based on new rarity value
          const colorClass = this.getRarityColorClass(value)
          input.className = `trait-rarity-input ${colorClass}`

          // Update the rarity indicator color
          const indicator = traitItem.querySelector(".trait-rarity-indicator")

          if (indicator) {
            const bgColorClass = this.getRarityColorClass(value, true)
            // Remove all existing bg-rarity classes
            indicator.classList.forEach((cls) => {
              if (cls.startsWith("bg-rarity-")) {
                indicator.classList.remove(cls)
              }
            })
            // Add the new bg-rarity class
            indicator.classList.add(bgColorClass)
          }
        }
      })

      // Update trait rarity when input loses focus
      input.addEventListener("blur", (e) => {
        e.stopPropagation()
        let value = Number.parseFloat(e.target.value.replace(/[^0-9.]/g, ""))
        if (isNaN(value)) value = 0
        value = Math.min(Math.max(value, 0), Number.parseFloat(layer.rarity || 100))
        e.target.value = `${value.toFixed(2)}%`
        slider.value = value

        // Update color class based on new rarity value
        const colorClass = this.getRarityColorClass(value)
        input.className = `trait-rarity-input ${colorClass}`

        // Preserve expansion state
        const isExpanded = content.classList.contains("expanded")
        this.updateTraitRarity(layer.id, traitId, value, projectData, isExpanded)
      })

      // Handle enter key on input
      input.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          e.target.blur()
        }
      })
    })

    // Add event listener for replace image button - NEW CARDS
    const replaceImageBtns = traitLayerBar.querySelectorAll(".expanded-trait-layer-card-replace-btn")
    replaceImageBtns.forEach((btn) => {
      // Setup tooltip for replace button
      const replaceTooltip = btn.querySelector(".tooltiptext")
      if (replaceTooltip) {
        this.setupTooltipPositioning(btn, replaceTooltip)
      }
      
      btn.addEventListener("click", (e) => {
        e.stopPropagation()
        const traitId = btn.getAttribute("data-trait-id")
        const layerId = btn.getAttribute("data-layer-id")
        const fileInput = traitLayerBar.querySelector(`input.expanded-trait-layer-card-replace-input[data-trait-id='${traitId}'][data-layer-id='${layerId}']`)
        if (fileInput) fileInput.click()
      })
    })
    // Add event listener for file input change - NEW CARDS
    const replaceImageInputs = traitLayerBar.querySelectorAll(".expanded-trait-layer-card-replace-input")
    replaceImageInputs.forEach((input) => {
      input.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (!file) return
        const traitId = input.getAttribute("data-trait-id")
        const layerId = input.getAttribute("data-layer-id")
        // Find the layer and trait
        const layer = projectData.traits.find((l) => l.id === layerId)
        if (!layer) return
        const trait = layer.traits.find((t) => t.id === traitId)
        if (!trait) return
        
        // Save the file path for this trait
        const filePath = file.webkitRelativePath || file.name;
        console.log('%c[DEBUG] 💾 SAVING FILE PATH for trait: ' + trait.name + ' path: ' + filePath, 'color: green; font-weight: bold;');
        console.log('%c[DEBUG] 📂 SAVING PATH: ' + filePath, 'color: green;');
        console.log('%c[DEBUG] 🔍 BEFORE: trait.filePath = ' + (trait.filePath || 'undefined'), 'color: orange;');
        trait.filePath = filePath;
        console.log('%c[DEBUG] 🔍 AFTER: trait.filePath = ' + trait.filePath, 'color: orange;');
        
        // Read the file as data URL
        const reader = new FileReader()
        reader.onload = (event) => {
          trait.imageData = event.target.result
          trait.image = event.target.result
          
          // Also update the trait in the current NFT if it exists
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
                nftTraitObj.trait.filePath = filePath; // Also save path in NFT trait
              }
            }
          }
          
          // Store selected trait IDs before updating (to preserve selection state)
          const selectedTraitIds = Array.from(traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected')).map(card => card.dataset.traitId)
          
          // Update only the image, not the entire UI
          const traitCard = traitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${traitId}"]`)
          if (traitCard) {
            const thumbImg = traitCard.querySelector('.expanded-trait-layer-card-thumb-img')
            if (thumbImg) {
              thumbImg.src = event.target.result
              thumbImg.dataset.originalImage = event.target.result
              // Reset centered extraction flag so it can be re-extracted
              delete thumbImg.dataset.hasCentered
              // Re-extract centered trait if needed
              if (this.extractCenteredTraitForThumbnail) {
                this.extractCenteredTraitForThumbnail(thumbImg, event.target.result)
              }
            }
          }
          
          // Restore selection state for all previously selected traits
          if (selectedTraitIds.length > 0) {
            selectedTraitIds.forEach(selectedTraitId => {
              const selectedCard = traitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${selectedTraitId}"]`)
              if (selectedCard) {
                selectedCard.classList.add('selected')
              }
            })
          }
          
          this.showFeedback(`Image for trait "${trait.name}" updated successfully (path saved)`, "success")
          
          // Ensure all previews and thumbnails are refreshed and seed is recalculated
          if (window.regenerateNftImageAndSeed) {
            window.regenerateNftImageAndSeed();
          }
          
          // Notify Saved Seeds modal that traits have changed
          if (window.SavedSeedsModal && window.SavedSeedsModal.notifyTraitChange) {
            window.SavedSeedsModal.notifyTraitChange();
          }
        }
        reader.readAsDataURL(file)
      })
    })
  },

  // Update only the rarity percentage displays for traits in a layer (without refreshing entire UI)
  updateTraitRarityDisplays: function(layerId, projectData) {
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer) return

    const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
    if (!traitLayerBar) return

    // Store selected trait IDs before updating (to preserve selection state)
    const selectedTraitIds = Array.from(traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected')).map(card => card.dataset.traitId)

    // Update rarity displays for all trait cards in this layer
    layer.traits.forEach((trait) => {
      const traitCard = traitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${trait.id}"]`)
      if (traitCard) {
        const rarityInput = traitCard.querySelector(".expanded-trait-layer-card-rarity-input")
        const raritySlider = traitCard.querySelector(".expanded-trait-layer-card-rarity-slider")
        
        if (rarityInput) {
          rarityInput.value = `${(trait.rarity || 0).toFixed(2)}%`
        }
        
        if (raritySlider) {
          raritySlider.value = trait.rarity || 0
          raritySlider.setAttribute("data-original-value", trait.rarity || 0)
          // Update max value in case layer rarity changed
          const layerRarity = layer.rarity || 100
          raritySlider.max = layerRarity
        }
      }
    })

    // Restore selection state for previously selected traits
    if (selectedTraitIds.length > 0) {
      selectedTraitIds.forEach(traitId => {
        const traitCard = traitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${traitId}"]`)
        if (traitCard) {
          traitCard.classList.add('selected')
        }
      })
    }
  },

  /**
   * Toggle trait layer expansion
   * Ensures only one trait layer can be expanded at a time.
   * When expanding a layer, it first collapses any currently expanded layers.
   * This provides better visibility and prevents conflicts with trait layers.
   */
  toggleTraitLayerExpansion: function(traitLayerBar) {
    const content = traitLayerBar.querySelector(".trait-layer-content");
    const arrow = traitLayerBar.querySelector(".trait-layer-arrow");
    const isExpanded = content.classList.contains("expanded");
    const projectData = window.currentProject || NFTApp.getCurrentProject && NFTApp.getCurrentProject();
    if (!isExpanded) {
      // First collapse any currently expanded layers
      const allExpandedContents = document.querySelectorAll(".trait-layer-content.expanded");
      const allExpandedArrows = document.querySelectorAll(".trait-layer-arrow.expanded");
      const allExpandedBars = document.querySelectorAll(".trait-layer-bar.expanded");
      allExpandedContents.forEach(expandedContent => {
        expandedContent.classList.remove("expanded");
      });
      allExpandedArrows.forEach(expandedArrow => {
        expandedArrow.classList.remove("expanded");
      });
      allExpandedBars.forEach(expandedBar => {
        expandedBar.classList.remove("expanded");
        // Re-enable dragging for the collapsed layer
        expandedBar.setAttribute("draggable", "true");
        // Remove trait-layer-trait-image IDs when collapsed
        const traitImages = expandedBar.querySelectorAll("#trait-layer-trait-image");
        traitImages.forEach(img => {
          img.removeAttribute("id");
        });
      });
      // Now expand this layer
      content.classList.add("expanded");
      arrow.classList.add("expanded");
      traitLayerBar.classList.add("expanded");
      // Disable dragging for expanded layer
      traitLayerBar.setAttribute("draggable", "false");
      // Update trait-image IDs to trait-layer-trait-image when expanded
      const traitImages = traitLayerBar.querySelectorAll(".trait-image");
      traitImages.forEach(img => {
        img.id = "trait-layer-trait-image";
      });
      // --- REMOVE AUTO-REFRESH TRAITS LIST FOR PERFORMANCE ---
      // if (this.updateTraitLayerUI && typeof this.updateTraitLayerUI === 'function' && projectData) {
      //   this.updateTraitLayerUI(projectData);
      //   // After UI update, re-disable dragging for the expanded layer
      //   setTimeout(() => {
      //     const updatedBar = document.querySelector(`.trait-layer-bar[data-id="${traitLayerBar.dataset.id}"]`);
      //     if (updatedBar) updatedBar.setAttribute("draggable", "false");
      //   }, 50);
      // }
    } else {
      // Collapse this layer
      content.classList.remove("expanded");
      arrow.classList.remove("expanded");
      traitLayerBar.classList.remove("expanded");
      // Deselect any selected trait items on collapse
      const selectedItems = traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected');
      selectedItems.forEach(item => item.classList.remove('selected'));
      // Re-enable dragging
      traitLayerBar.setAttribute("draggable", "true");
      // Remove trait-layer-trait-image IDs when collapsed
      const traitImages = traitLayerBar.querySelectorAll("#trait-layer-trait-image");
      traitImages.forEach(img => {
        img.removeAttribute("id");
      });
    }
  },

  // Set up drag and drop for trait layers
  setupTraitLayerDragAndDrop: function (container, projectData) {
    // Check if enhanced drag and drop is already set up
    if (container.dataset.enhancedDragdropApplied === "true") {
      console.log("Enhanced drag and drop is already active, skipping standard setup");
      return;
    }
    
    const traitLayers = container.querySelectorAll(".trait-layer-bar");
    
    // Create placeholder element for drag and drop visualization
    const placeholder = document.createElement("div");
    placeholder.className = "trait-layer-placeholder";
    placeholder.style.height = "60px";
    placeholder.style.border = "2px dashed var(--border-color)";
    placeholder.style.borderRadius = "8px";
    placeholder.style.margin = "8px 0";
    placeholder.style.backgroundColor = "rgba(108, 92, 231, 0.1)";
    placeholder.style.display = "none";
    container.appendChild(placeholder);

    traitLayers.forEach((layer) => {
      // Make the layer draggable
      layer.setAttribute("draggable", "true");
      
      // If the layer is expanded, make it not draggable
      if (layer.classList.contains("expanded")) {
        layer.setAttribute("draggable", "false");
      }

      layer.addEventListener("dragstart", (e) => {
        // Prevent dragging if the layer is expanded
        if (layer.classList.contains("expanded")) {
          e.preventDefault();
          return;
        }

        e.dataTransfer.setData("text/plain", layer.dataset.id);
        layer.classList.add("dragging");
        
        // Add the placeholder
        setTimeout(() => {
          // Get the height of the dragged element for the placeholder
          const height = layer.offsetHeight;
          placeholder.style.height = `${height}px`;
          placeholder.style.display = "block";
          
          // Insert placeholder where the dragged element was
          container.insertBefore(placeholder, layer);
          layer.style.opacity = "0.4";
        }, 0);
      });

      layer.addEventListener("dragend", () => {
        layer.classList.remove("dragging");
        layer.style.opacity = "1";
        
        // Hide the placeholder
        placeholder.style.display = "none";
      });
    });

    container.addEventListener("dragover", (e) => {
      e.preventDefault();
      const draggingElement = container.querySelector(".dragging");
      if (!draggingElement) return;

      // Find the element to insert before
      const afterElement = this.getDragAfterElement(container, e.clientY);

      if (afterElement) {
        // Don't insert before itself or the placeholder
        if (afterElement !== draggingElement && afterElement !== placeholder) {
          container.insertBefore(placeholder, afterElement);
        }
      } else {
        container.appendChild(placeholder);
      }
    });

    container.addEventListener("drop", (e) => {
      e.preventDefault();
      const draggedId = e.dataTransfer.getData("text/plain");
      const draggingElement = container.querySelector(`[data-id="${draggedId}"]`);

      if (!draggingElement) return;

      // Replace the placeholder with the dragged element
      if (placeholder.parentNode) {
        container.insertBefore(draggingElement, placeholder);
        placeholder.style.display = "none";
      }

      // Update the order in the project data
      const newOrder = Array.from(container.querySelectorAll(".trait-layer-bar")).map((el) => el.dataset.id);

      // Update the order property for each layer
      newOrder.forEach((id, index) => {
        const layer = projectData.traits.find((l) => l.id === id);
        if (layer) {
          layer.order = index;
        }
      });

      // Sort the traits array by order
      projectData.traits.sort((a, b) => a.order - b.order);

      // Save project data without re-rendering the UI
      // The DOM is already updated, we just need to persist the new order
      if (window.NFTApp && window.NFTApp.getModule('projectService')) {
        const projectService = window.NFTApp.getModule('projectService');
        if (typeof projectService.saveProjectData === 'function') {
          projectService.saveProjectData();
        }
      } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
        window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false });
      }
      
      // Dispatch an event to notify that traits were updated
      document.dispatchEvent(new CustomEvent('traits-updated'));
    });
  },

  // Helper function to determine where to place the dragged element
  getDragAfterElement: (container, y) => {
    const draggableElements = [...container.querySelectorAll(".trait-layer-bar:not(.dragging)")]

    return draggableElements.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect()
        const offset = y - box.top - box.height / 2

        if (offset < 0 && offset > closest.offset) {
          return { offset: offset, element: child }
        } else {
          return closest
        }
      },
      { offset: Number.NEGATIVE_INFINITY },
    ).element
  },

  // Set up trait dropzone for adding traits to a layer
  setupTraitDropzone: function (dropzone, layerId, projectData) {
    // Prevent default drag behaviors
    dropzone.addEventListener(
      "dragenter",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.add("highlight")
      },
      false,
    )

    dropzone.addEventListener(
      "dragover",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.add("highlight")
      },
      false,
    )

    dropzone.addEventListener(
      "dragleave",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.remove("highlight")
      },
      false,
    )

    dropzone.addEventListener(
      "drop",
      (e) => {
        e.preventDefault()
        e.stopPropagation()
        dropzone.classList.remove("highlight")

        const files = e.dataTransfer.files
        if (files && files.length > 0) {
          // Find the layer
          const layer = projectData.traits.find((l) => l.id === layerId)
          if (layer) {
            // Preserve expansion state
            const traitLayerBar = dropzone.closest(".trait-layer-bar")
            const content = traitLayerBar ? traitLayerBar.querySelector(".trait-layer-content") : null
            const isExpanded = content ? content.classList.contains("expanded") : true

            // Add traits to the layer
            this.addTraitsToLayer(files, layerId, projectData, isExpanded)
          }
        }
      },
      false,
    )
  },

  // Add traits to a layer from selected files
  addTraitsToLayer: function (files, layerId, projectData, preserveExpanded = true) {
    if (!files || files.length === 0) return

    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer) return

    // Filter for image files
    const imageFiles = Array.from(files).filter((file) => file.type.match(/image\/(jpeg|jpg|png|gif|bmp|webp|svg)/))

    if (imageFiles.length === 0) {
      this.showFeedback("No valid image files selected", "error")
      return
    }

    // Track duplicate traits for error feedback
    const duplicateTraits = []
    let addedTraits = 0

    // Process each image file
    const processFilePromises = imageFiles.map((file) => {
      return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (e) => {
          // Create trait name from file name (remove extension)
          const traitName = file.name.replace(/\.[^/.]+$/, "")

          // Check if a trait with this name already exists in the layer
          const traitExists = layer.traits.some((t) => t.name === traitName)

          if (traitExists) {
            // Add to duplicate traits list for error feedback
            duplicateTraits.push(traitName)
            resolve()
            return
          }

          // Create trait object
          const trait = {
            id: generateUniqueId(),
            name: traitName,
            imageData: e.target.result,
            rarity: 100 / (layer.traits.length + imageFiles.length - duplicateTraits.length), // Distribute rarity evenly
          }

          // Add trait to layer
          layer.traits.push(trait)
          addedTraits++
          resolve()
        }

        reader.onerror = () => {
          console.error(`Error reading file: ${file.name}`)
          resolve() // Resolve anyway to continue processing
        }

        reader.readAsDataURL(file)
      })
    })

    // Wait for all files to be processed, then update the UI
    Promise.all(processFilePromises).then(() => {
      // Show error feedback for duplicate traits
      if (duplicateTraits.length > 0) {
        const traitNames = duplicateTraits.join('", "')
        this.showFeedback(
          `Skipped ${duplicateTraits.length} duplicate trait${duplicateTraits.length > 1 ? "s" : ""}: "${traitNames}"`,
          "error",
        )
      }

      // Only proceed if we added at least one trait
      if (addedTraits > 0) {
        // Normalize rarities to ensure they sum to the layer rarity
        this.normalizeTraitRarities(layerId, projectData, false)

        // Update the UI
        this.updateTraitLayerUI(projectData)

        // Re-expand the layer if it was expanded before
        if (preserveExpanded) {
          const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
          if (traitLayerBar) {
            const content = traitLayerBar.querySelector(".trait-layer-content")
            const arrow = traitLayerBar.querySelector(".trait-layer-arrow")
            if (content && arrow) {
              content.classList.add("expanded")
              arrow.classList.add("expanded")
            }
          }
        }

        this.showFeedback(`Added ${addedTraits} traits to "${layer.name}"`, "success")
        
        // Check if we should auto-generate an NFT
        this.checkAndAutoGenerateNFT(projectData)
      } else if (duplicateTraits.length === imageFiles.length) {
        // All traits were duplicates
        this.showFeedback(`No traits added. All selected traits already exist in layer "${layer.name}".`, "error")
      }
    })
  },

  // Normalize trait rarities to ensure they sum to the layer rarity
  normalizeTraitRarities: function (layerId, projectData, updateUI = true) {
    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer || !layer.traits || layer.traits.length === 0) return

    // Calculate the normalized rarity value
    const normalizedRarity = layer.rarity / layer.traits.length

    // Update each trait's rarity
    layer.traits.forEach((trait) => {
      trait.rarity = normalizedRarity
    })

    // Update the UI if requested
    if (updateUI) {
      // Preserve expansion state and selected traits
      const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
      const isExpanded = traitLayerBar
        ? traitLayerBar.querySelector(".trait-layer-content").classList.contains("expanded")
        : false
      
      // Store selected trait IDs before updating UI (to restore selection after)
      const selectedTraitIds = Array.from(traitLayerBar?.querySelectorAll('.expanded-trait-layer-card.selected') || []).map(card => card.dataset.traitId)

      this.updateTraitLayerUI(projectData)

      // Re-expand the layer if it was expanded before and restore selection
      if (isExpanded) {
        const updatedTraitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
        if (updatedTraitLayerBar) {
          const content = updatedTraitLayerBar.querySelector(".trait-layer-content")
          const arrow = updatedTraitLayerBar.querySelector(".trait-layer-arrow")
          if (content && arrow) {
            content.classList.add("expanded")
            arrow.classList.add("expanded")
            updatedTraitLayerBar.classList.add("expanded")
          }
          
          // Restore selection state after UI update
          if (selectedTraitIds.length > 0) {
            const restoreSelection = () => {
              let allRestored = true
              selectedTraitIds.forEach(traitId => {
                const traitCard = updatedTraitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${traitId}"]`)
                if (traitCard) {
                  traitCard.classList.add('selected')
                } else {
                  allRestored = false
                }
              })
              // If not all cards were found, try again after a short delay
              if (!allRestored) {
                setTimeout(restoreSelection, 100)
              }
            }
            // Use requestAnimationFrame to ensure DOM is ready, then setTimeout for event handlers
            requestAnimationFrame(() => {
              setTimeout(restoreSelection, 150)
            })
          }
        }
      }

      this.showFeedback(`Normalized rarities for "${layer.name}"`, "success")
    }
  },

  // Randomize trait rarities based on tiers
  // CRITICAL: Sum of all traits must always equal layer rarity (principal)
  // Tier percentages are percentages OF the layer rarity (principal), not absolute values
  randomizeTraitRarities: function (layerId, projectData, selectedIds = []) {
    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer || !layer.traits || layer.traits.length === 0) return

    // Get layer rarity (principal) - this is the total to be distributed
    const layerRarity = layer.rarity || 100

    // Define rarity tiers as percentages OF the layer rarity (3% of layer, 5% of layer, etc.)
    const rarityTiers = [
      { name: "Mythic", percentage: 3 },    // 3% of layer rarity
      { name: "Legendary", percentage: 5 },  // 5% of layer rarity
      { name: "Epic", percentage: 12 },      // 12% of layer rarity
      { name: "Rare", percentage: 20 },      // 20% of layer rarity
      { name: "Uncommon", percentage: 25 },  // 25% of layer rarity
      { name: "Common", percentage: 35 },    // 35% of layer rarity
    ]
    // Note: These percentages sum to 100% (3+5+12+20+25+35=100)

    // Target traits: selected only if provided, otherwise all
    const traitSet = new Set(selectedIds || [])
    const selectedTraits = (selectedIds && selectedIds.length > 0)
      ? layer.traits.filter(t => traitSet.has(t.id))
      : [...layer.traits]
    
    const unselectedTraits = (selectedIds && selectedIds.length > 0)
      ? layer.traits.filter(t => !traitSet.has(t.id))
      : []

    // Shuffle selected traits to randomize which ones get which tier
    const shuffledSelectedTraits = [...selectedTraits].sort(() => Math.random() - 0.5)

    // Calculate total tier percentages assigned (may be less than 100% if fewer traits than tiers)
    let totalTierPercentage = 0
    shuffledSelectedTraits.forEach((trait, index) => {
      if (index < rarityTiers.length) {
        totalTierPercentage += rarityTiers[index].percentage
      } else {
        // If more traits than tiers, assign the last tier (Common = 35%)
        totalTierPercentage += rarityTiers[rarityTiers.length - 1].percentage
      }
    })

    // Assign tier percentages to selected traits (as percentages OF layer rarity)
    shuffledSelectedTraits.forEach((trait, index) => {
      if (index < rarityTiers.length) {
        // Assign as percentage of layer rarity: tierPercentage% of layerRarity
        trait.rarity = (rarityTiers[index].percentage / 100) * layerRarity
      } else {
        // If more traits than tiers, assign the last tier (Common = 35% of layer rarity)
        const lastTierPercentage = rarityTiers[rarityTiers.length - 1].percentage
        trait.rarity = (lastTierPercentage / 100) * layerRarity
      }
    })

    // Calculate what's left for unselected traits
    const selectedTraitsTotal = shuffledSelectedTraits.reduce((sum, trait) => sum + trait.rarity, 0)
    const remainingForUnselected = layerRarity - selectedTraitsTotal

    // Adjust unselected traits
    if (unselectedTraits.length > 0) {
      if (remainingForUnselected > 0) {
        // If there's remaining value, distribute it equally among unselected traits
        const equalShare = remainingForUnselected / unselectedTraits.length
        unselectedTraits.forEach((trait) => {
          trait.rarity = equalShare
        })
      } else {
        // If no remaining (selected traits used 100% of layer rarity), set all unselected to 0
        unselectedTraits.forEach((trait) => {
          trait.rarity = 0
        })
      }
    }

    // Verify and fix any floating point precision issues
    const finalTotal = layer.traits.reduce((sum, trait) => sum + (trait.rarity || 0), 0)
    if (Math.abs(finalTotal - layerRarity) > 0.01) {
      const adjustmentFactor = layerRarity / finalTotal
      layer.traits.forEach((trait) => {
        trait.rarity = (trait.rarity || 0) * adjustmentFactor
      })
    }

    // Preserve expansion state and selected traits
    const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
    const isExpanded = traitLayerBar
      ? traitLayerBar.querySelector(".trait-layer-content").classList.contains("expanded")
      : false
    
    // Store selected trait IDs before UI update (to restore selection after)
    const selectedTraitIds = selectedIds && selectedIds.length > 0 ? [...selectedIds] : []

    // Update the UI
    this.updateTraitLayerUI(projectData)

    // Re-expand the layer if it was expanded before and restore selection
    if (isExpanded) {
      const updatedTraitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
      if (updatedTraitLayerBar) {
        const content = updatedTraitLayerBar.querySelector(".trait-layer-content")
        const arrow = updatedTraitLayerBar.querySelector(".trait-layer-arrow")
        if (content && arrow) {
          content.classList.add("expanded")
          arrow.classList.add("expanded")
          updatedTraitLayerBar.classList.add("expanded")
        }
        
        // Restore selection state after UI update - use multiple attempts to ensure it works
        if (selectedTraitIds.length > 0) {
          const restoreSelection = () => {
            let allRestored = true
            selectedTraitIds.forEach(traitId => {
              const traitCard = updatedTraitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${traitId}"]`)
              if (traitCard) {
                traitCard.classList.add('selected')
              } else {
                allRestored = false
              }
            })
            // If not all cards were found, try again after a short delay
            if (!allRestored) {
              setTimeout(restoreSelection, 100)
            }
          }
          // Use requestAnimationFrame to ensure DOM is ready, then setTimeout for event handlers
          requestAnimationFrame(() => {
            setTimeout(restoreSelection, 150)
          })
        }
      }
    }

    this.showFeedback(`Randomized rarities for "${layer.name}"${selectedIds && selectedIds.length ? ' (selected traits only)' : ''}`, "success")
  },

  // Randomize unique trait rarities - each trait gets a unique random rarity
  // CRITICAL: Sum of all traits must always equal layer rarity (principal)
  randomizeUniqueTraitRarities: function (layerId, projectData, selectedIds = []) {
    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer || !layer.traits || layer.traits.length === 0) return

    // Get layer rarity (principal) - this is the total to be distributed
    const layerRarity = layer.rarity || 100

    // Target traits: selected only if provided, otherwise all
    const traitSet = new Set(selectedIds || [])
    const selectedTraits = (selectedIds && selectedIds.length > 0)
      ? layer.traits.filter(t => traitSet.has(t.id))
      : [...layer.traits]
    
    const unselectedTraits = (selectedIds && selectedIds.length > 0)
      ? layer.traits.filter(t => !traitSet.has(t.id))
      : []

    if (selectedIds && selectedIds.length > 0) {
      // CASE: Some traits are selected
      // Sum selected traits' current rarities
      const selectedTraitsSum = selectedTraits.reduce((sum, t) => sum + (t.rarity || 0), 0)
      
      // Generate random percentages for selected traits that sum to selectedTraitsSum
      const selectedCount = selectedTraits.length
      const randomRarities = []
      
      // Generate random values that will sum to selectedTraitsSum
      let remainingSum = selectedTraitsSum
      for (let i = 0; i < selectedCount - 1; i++) {
        // Generate random value between 0 and remainingSum
        const randomValue = Math.random() * remainingSum
        randomRarities.push(randomValue)
        remainingSum -= randomValue
      }
      // Last trait gets the remaining sum
      randomRarities.push(remainingSum)
      
      // Shuffle the traits to randomize which trait gets which rarity
      const shuffledSelectedTraits = [...selectedTraits].sort(() => Math.random() - 0.5)
      
      // Assign the random rarities
      shuffledSelectedTraits.forEach((trait, index) => {
        trait.rarity = randomRarities[index]
      })
      
      // Calculate what's left for unselected traits
      const selectedTraitsTotal = shuffledSelectedTraits.reduce((sum, trait) => sum + trait.rarity, 0)
      const remainingForUnselected = layerRarity - selectedTraitsTotal
      
      // Adjust unselected traits so total equals layer rarity
      if (unselectedTraits.length > 0) {
        if (remainingForUnselected > 0) {
          // Distribute remaining proportionally among unselected traits
          const unselectedTotal = unselectedTraits.reduce((sum, t) => sum + (t.rarity || 0), 0)
          if (unselectedTotal > 0) {
            const unselectedScaleFactor = remainingForUnselected / unselectedTotal
            unselectedTraits.forEach((trait) => {
              trait.rarity = (trait.rarity || 0) * unselectedScaleFactor
            })
          } else {
            // If unselected had no rarity, distribute equally
            const equalShare = remainingForUnselected / unselectedTraits.length
            unselectedTraits.forEach((trait) => {
              trait.rarity = equalShare
            })
          }
        } else {
          // If no remaining, set all unselected to 0
          unselectedTraits.forEach((trait) => {
            trait.rarity = 0
          })
        }
      }
    } else {
      // CASE: No traits selected - apply to all traits
      const traitCount = selectedTraits.length
      const randomRarities = []
      
      // Generate random values that will sum to layerRarity
      let remainingSum = layerRarity
      for (let i = 0; i < traitCount - 1; i++) {
        const randomValue = Math.random() * remainingSum
        randomRarities.push(randomValue)
        remainingSum -= randomValue
      }
      randomRarities.push(remainingSum)
      
      // Shuffle the traits to randomize which trait gets which rarity
      const shuffledTraits = [...selectedTraits].sort(() => Math.random() - 0.5)
      
      // Assign the random rarities
      shuffledTraits.forEach((trait, index) => {
        trait.rarity = randomRarities[index]
      })
    }

    // Verify and fix any floating point precision issues
    const finalTotal = layer.traits.reduce((sum, trait) => sum + (trait.rarity || 0), 0)
    if (Math.abs(finalTotal - layerRarity) > 0.01) {
      const adjustmentFactor = layerRarity / finalTotal
      layer.traits.forEach((trait) => {
        trait.rarity = (trait.rarity || 0) * adjustmentFactor
      })
    }
    
    // Preserve expansion state and selected traits
    const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
    const isExpanded = traitLayerBar
      ? traitLayerBar.querySelector(".trait-layer-content").classList.contains("expanded")
      : false
    
    // Store selected trait IDs before UI update (to restore selection after)
    const selectedTraitIds = selectedIds && selectedIds.length > 0 ? [...selectedIds] : []
    
    // Update the UI
    this.updateTraitLayerUI(projectData)
    
    // Re-expand the layer if it was expanded before and restore selection
    if (isExpanded) {
      const updatedTraitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
      if (updatedTraitLayerBar) {
        const content = updatedTraitLayerBar.querySelector(".trait-layer-content")
        const arrow = updatedTraitLayerBar.querySelector(".trait-layer-arrow")
        if (content && arrow) {
          content.classList.add("expanded")
          arrow.classList.add("expanded")
          updatedTraitLayerBar.classList.add("expanded")
        }
        
        // Restore selection state after UI update - use multiple attempts to ensure it works
        if (selectedTraitIds.length > 0) {
          const restoreSelection = () => {
            let allRestored = true
            selectedTraitIds.forEach(traitId => {
              const traitCard = updatedTraitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${traitId}"]`)
              if (traitCard) {
                traitCard.classList.add('selected')
              } else {
                allRestored = false
              }
            })
            // If not all cards were found, try again after a short delay
            if (!allRestored) {
              setTimeout(restoreSelection, 100)
            }
          }
          // Use requestAnimationFrame to ensure DOM is ready, then setTimeout for event handlers
          requestAnimationFrame(() => {
            setTimeout(restoreSelection, 150)
          })
        }
      }
    }
    
    this.showFeedback(`Randomized unique rarities for "${layer.name}"${selectedIds && selectedIds.length ? ' (selected traits only)' : ''}`, "success")
  },

  // Normalize unique trait rarities - divide equally among selected or all traits
  // CRITICAL: Sum of all traits must always equal layer rarity (principal)
  normalizeUniqueTraitRarities: function (layerId, projectData, selectedIds = []) {
    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer || !layer.traits || layer.traits.length === 0) return

    // Get layer rarity (principal) - this is the total to be distributed
    const layerRarity = layer.rarity || 100
    
    const traitSet = new Set(selectedIds || [])
    const selectedTraits = (selectedIds && selectedIds.length > 0)
      ? layer.traits.filter(t => traitSet.has(t.id))
      : [...layer.traits]
    
    const unselectedTraits = (selectedIds && selectedIds.length > 0)
      ? layer.traits.filter(t => !traitSet.has(t.id))
      : []

    if (selectedIds && selectedIds.length > 0) {
      // CASE: Some traits are selected
      // Sum selected traits' current rarities
      const selectedTraitsSum = selectedTraits.reduce((sum, t) => sum + (t.rarity || 0), 0)
      
      // Divide equally among selected traits
      const newEach = selectedTraits.length > 0 ? (selectedTraitsSum / selectedTraits.length) : 0
      
      // Assign equal rarity to each selected trait
      selectedTraits.forEach((trait) => {
        trait.rarity = newEach
      })
      
      // Calculate what's left for unselected traits
      const selectedTraitsTotal = selectedTraits.reduce((sum, trait) => sum + trait.rarity, 0)
      const remainingForUnselected = layerRarity - selectedTraitsTotal
      
      // Adjust unselected traits so total equals layer rarity
      if (unselectedTraits.length > 0) {
        if (remainingForUnselected > 0) {
          // Distribute remaining proportionally among unselected traits
          const unselectedTotal = unselectedTraits.reduce((sum, t) => sum + (t.rarity || 0), 0)
          if (unselectedTotal > 0) {
            const unselectedScaleFactor = remainingForUnselected / unselectedTotal
            unselectedTraits.forEach((trait) => {
              trait.rarity = (trait.rarity || 0) * unselectedScaleFactor
            })
          } else {
            // If unselected had no rarity, distribute equally
            const equalShare = remainingForUnselected / unselectedTraits.length
            unselectedTraits.forEach((trait) => {
              trait.rarity = equalShare
            })
          }
        } else {
          // If no remaining, set all unselected to 0
          unselectedTraits.forEach((trait) => {
            trait.rarity = 0
          })
        }
      }
    } else {
      // CASE: No traits selected - divide layer rarity equally among all traits
      const equalShare = selectedTraits.length > 0 ? (layerRarity / selectedTraits.length) : 0
      
      selectedTraits.forEach((trait) => {
        trait.rarity = equalShare
      })
    }

    // Verify and fix any floating point precision issues
    const finalTotal = layer.traits.reduce((sum, trait) => sum + (trait.rarity || 0), 0)
    if (Math.abs(finalTotal - layerRarity) > 0.01) {
      const adjustmentFactor = layerRarity / finalTotal
      layer.traits.forEach((trait) => {
        trait.rarity = (trait.rarity || 0) * adjustmentFactor
      })
    }
    
    // Preserve expansion state and selected traits
    const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
    const isExpanded = traitLayerBar
      ? traitLayerBar.querySelector(".trait-layer-content").classList.contains("expanded")
      : false
    
    // Store selected trait IDs before UI update (to restore selection after)
    const selectedTraitIds = selectedIds && selectedIds.length > 0 ? [...selectedIds] : []
    
    // Update the UI
    this.updateTraitLayerUI(projectData)
    
    // Re-expand the layer if it was expanded before and restore selection
    if (isExpanded) {
      const updatedTraitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
      if (updatedTraitLayerBar) {
        const content = updatedTraitLayerBar.querySelector(".trait-layer-content")
        const arrow = updatedTraitLayerBar.querySelector(".trait-layer-arrow")
        if (content && arrow) {
          content.classList.add("expanded")
          arrow.classList.add("expanded")
          updatedTraitLayerBar.classList.add("expanded")
        }
        
        // Restore selection state after UI update - use multiple attempts to ensure it works
        if (selectedTraitIds.length > 0) {
          const restoreSelection = () => {
            let allRestored = true
            selectedTraitIds.forEach(traitId => {
              const traitCard = updatedTraitLayerBar.querySelector(`.expanded-trait-layer-card[data-trait-id="${traitId}"]`)
              if (traitCard) {
                traitCard.classList.add('selected')
              } else {
                allRestored = false
              }
            })
            // If not all cards were found, try again after a short delay
            if (!allRestored) {
              setTimeout(restoreSelection, 100)
            }
          }
          // Use requestAnimationFrame to ensure DOM is ready, then setTimeout for event handlers
          requestAnimationFrame(() => {
            setTimeout(restoreSelection, 150)
          })
        }
      }
    }
    
    this.showFeedback(`Normalized rarities for "${layer.name}"${selectedIds && selectedIds.length ? ' (selected traits only)' : ''}`, "success")
  },

  // Update layer rarity
  updateLayerRarity: function (layerId, newRarity, projectData, preserveExpanded = true) {
    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer) return

    // Store the old rarity for proportion calculation
    const oldRarity = layer.rarity || 100

    // Update the layer rarity
    layer.rarity = newRarity

    // Adjust trait rarities proportionally
    if (layer.traits && layer.traits.length > 0) {
      // Calculate the proportion factor
      const proportionFactor = newRarity / oldRarity

      // Adjust each trait's rarity proportionally
        layer.traits.forEach((trait) => {
        trait.rarity = trait.rarity * proportionFactor
        })

      // Ensure the sum of trait rarities equals the layer rarity
      const totalTraitRarity = layer.traits.reduce((sum, trait) => sum + trait.rarity, 0)
      if (Math.abs(totalTraitRarity - newRarity) > 0.01) { // Allow for small floating point differences
        const adjustmentFactor = newRarity / totalTraitRarity
        layer.traits.forEach((trait) => {
          trait.rarity = trait.rarity * adjustmentFactor
        })
      }
    }

    // Update the UI
    this.updateTraitLayerUI(projectData)

    // Save the project data to persist the rarity changes
    if (window.NFTApp && window.NFTApp.getModule('projectService')) {
      const projectService = window.NFTApp.getModule('projectService')
      if (typeof projectService.saveProjectData === 'function') {
        projectService.saveProjectData()
      } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
        window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false })
      }
    } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
      window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false })
    }

    // Re-expand the layer if it was expanded before
    if (preserveExpanded) {
      const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
      if (traitLayerBar) {
        const content = traitLayerBar.querySelector(".trait-layer-content")
        const arrow = traitLayerBar.querySelector(".trait-layer-arrow")
        if (content && arrow) {
          content.classList.add("expanded")
          arrow.classList.add("expanded")
        }
      }
    }
  },

  // Update trait rarity
  updateTraitRarity: function (layerId, traitId, newRarity, projectData, preserveExpanded = true) {
    // Find the layer and trait
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer) return

    const trait = layer.traits.find((t) => t.id === traitId)
    if (!trait) return

    // Store the old rarity for proportion calculation
    const oldRarity = trait.rarity

    // Update the trait rarity
    trait.rarity = newRarity

    // Calculate the difference in rarity
    const rarityDifference = newRarity - oldRarity

    // If there are other traits, adjust their rarities proportionally
    if (layer.traits.length > 1) {
      // Get all other traits
      const otherTraits = layer.traits.filter((t) => t.id !== traitId)
      
      // Calculate total rarity of other traits
      const totalOtherRarity = otherTraits.reduce((sum, t) => sum + t.rarity, 0)
      
      if (totalOtherRarity > 0) {
        // Calculate adjustment factor to maintain layer rarity
        const adjustmentFactor = (layer.rarity - newRarity) / totalOtherRarity
        
        // Adjust other traits proportionally
        otherTraits.forEach((t) => {
          t.rarity = t.rarity * adjustmentFactor
        })
      } else {
        // If other traits have zero rarity, distribute remaining rarity evenly
        const equalRarity = (layer.rarity - newRarity) / otherTraits.length
        otherTraits.forEach((t) => {
          t.rarity = equalRarity
        })
      }
    }

    // Update only the rarity displays instead of refreshing the entire UI
    this.updateTraitRarityDisplays(layerId, projectData)

    // Save the project data to persist the rarity changes
    if (window.NFTApp && window.NFTApp.getModule('projectService')) {
      const projectService = window.NFTApp.getModule('projectService')
      if (typeof projectService.saveProjectData === 'function') {
        projectService.saveProjectData()
      } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
        window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false })
      }
    } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
      window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false })
    }

    // No need to re-expand since we're not refreshing the UI
  },

  // Delete trait
  deleteTrait: function (layerId, traitId, projectData, preserveExpanded = true) {
    // Find the layer
    const layer = projectData.traits.find((l) => l.id === layerId)
    if (!layer) return
    // Find the trait index
    const traitIndex = layer.traits.findIndex((t) => t.id === traitId)
    if (traitIndex === -1) return
    // Get the trait name for the notification
    const traitName = layer.traits[traitIndex].name
    // Remove the trait
    layer.traits.splice(traitIndex, 1)
    // Update combination rules that reference this trait
    this.updateCombinationRulesAfterTraitDeletion(projectData, layerId, layer.name, traitId, traitName)
    // Normalize the remaining traits' rarities
    if (layer.traits.length > 0) {
      this.normalizeTraitRarities(layerId, projectData, false)
    }
    // Update the UI
    this.updateTraitLayerUI(projectData)
    // Re-expand the layer if it was expanded before
    if (preserveExpanded) {
      const traitLayerBar = document.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
      if (traitLayerBar) {
        const content = traitLayerBar.querySelector(".trait-layer-content")
        const arrow = traitLayerBar.querySelector(".trait-layer-arrow")
        if (content && arrow) {
          // Force reflow to fix bad display after trait deletion
          content.classList.remove("expanded")
          arrow.classList.remove("expanded")
          // Use requestAnimationFrame to ensure DOM update
          requestAnimationFrame(() => {
            content.classList.add("expanded")
            arrow.classList.add("expanded")
          })
        }
      }
    }
    // Update rules section visibility
    if (NFTApp.getModule && NFTApp.getModule("combinationRules") && NFTApp.getModule("combinationRules").updateRulesSectionVisibility) {
      NFTApp.getModule("combinationRules").updateRulesSectionVisibility(projectData)
    }
    this.showFeedback(`Trait "${traitName}" deleted`, "success")
  },

  // Move trait layer up (decrease order)
  moveTraitLayerUp: function (layerId, projectData) {
    // CRITICAL: Cancel any pending animations to prevent conflicts
    if (this._reorderingState.isAnimating) {
      this._cancelPendingAnimations();
    }

    // Find the layer
    const layerIndex = projectData.traits.findIndex((l) => l.id === layerId)
    if (layerIndex <= 0) return // Already at the top

    // Get DOM elements before updating
    const container = document.getElementById("trait-layers-container")
    if (!container) {
      // Fallback to instant update if container not found
      const currentOrder = projectData.traits[layerIndex].order
      const aboveOrder = projectData.traits[layerIndex - 1].order
      projectData.traits[layerIndex].order = aboveOrder
      projectData.traits[layerIndex - 1].order = currentOrder
      projectData.traits.sort((a, b) => a.order - b.order)
      this.updateTraitLayerUI(projectData)
      return
    }

    const currentLayerBar = container.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
    const aboveLayerBar = container.querySelector(`.trait-layer-bar[data-id="${projectData.traits[layerIndex - 1].id}"]`)
    
    if (!currentLayerBar || !aboveLayerBar) {
      // Fallback to instant update if elements not found
      const currentOrder = projectData.traits[layerIndex].order
      const aboveOrder = projectData.traits[layerIndex - 1].order
      projectData.traits[layerIndex].order = aboveOrder
      projectData.traits[layerIndex - 1].order = currentOrder
      projectData.traits.sort((a, b) => a.order - b.order)
      this.updateTraitLayerUI(projectData)
      return
    }

    // Mark animation as in progress
    this._reorderingState.isAnimating = true;

    // Calculate the distance to move (move current layer to where above layer is)
    const currentRect = currentLayerBar.getBoundingClientRect()
    const aboveRect = aboveLayerBar.getBoundingClientRect()
    // Distance to move current layer up (negative value)
    const moveDistance = aboveRect.top - currentRect.top
    // Distance to move above layer down (positive value) - current layer's height + gap
    const aboveMoveDistance = currentRect.bottom - aboveRect.top

    // CRITICAL: Ensure both elements are visible and in document flow before animation
    // This prevents disappearing during animation
    currentLayerBar.style.visibility = "visible"
    currentLayerBar.style.opacity = "1"
    currentLayerBar.style.display = ""
    aboveLayerBar.style.visibility = "visible"
    aboveLayerBar.style.opacity = "1"
    aboveLayerBar.style.display = ""
    
    // Clean up any existing transforms first
    currentLayerBar.style.transition = ""
    currentLayerBar.style.transform = ""
    currentLayerBar.style.zIndex = ""
    aboveLayerBar.style.transition = ""
    aboveLayerBar.style.transform = ""
    aboveLayerBar.style.zIndex = ""
    
    // Force reflow to ensure styles are reset
    void currentLayerBar.offsetHeight;
    void aboveLayerBar.offsetHeight;

    // Add animation class to both elements simultaneously
    currentLayerBar.classList.add("reordering")
    aboveLayerBar.classList.add("reordering")
    
    // CRITICAL: Use faster, smoother animation with cubic-bezier timing for fluid motion
    const animationDuration = 200; // 0.2 seconds total for fluid reordering animation
    
    // CRITICAL: Set transition on both elements simultaneously
    currentLayerBar.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    aboveLayerBar.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    
    // CRITICAL: Set z-index on both elements to ensure they're both visible during animation
    currentLayerBar.style.zIndex = "1000"
    aboveLayerBar.style.zIndex = "1000"
    
    // Force reflow to ensure transition and z-index are set before transform
    void currentLayerBar.offsetHeight;
    void aboveLayerBar.offsetHeight;
    
    // CRITICAL: Apply transforms to both elements in the same frame to ensure simultaneous animation
    // Use requestAnimationFrame to ensure both transforms are applied together
    requestAnimationFrame(() => {
      currentLayerBar.style.transform = `translateY(${moveDistance}px)`
      aboveLayerBar.style.transform = `translateY(${aboveMoveDistance}px)`
    })

    // Update the data order
    const currentOrder = projectData.traits[layerIndex].order
    const aboveOrder = projectData.traits[layerIndex - 1].order
    projectData.traits[layerIndex].order = aboveOrder
    projectData.traits[layerIndex - 1].order = currentOrder

    // Sort the traits array by order
    projectData.traits.sort((a, b) => a.order - b.order)

    // Use transitionend events for reliable cleanup (more reliable than setTimeout)
    let completedCount = 0;
    const requiredCompletions = 2; // Both elements need to complete
    
    const cleanup = () => {
      completedCount++;
      if (completedCount >= requiredCompletions) {
        // CRITICAL: Move DOM elements FIRST while transforms are still visually applied
        // This ensures the elements are in their new positions before removing transforms
        const container = document.getElementById("trait-layers-container");
        if (container) {
          // Get all layer bars in current DOM order
          const allBars = Array.from(container.querySelectorAll('.trait-layer-bar'));
          
          // Reorder DOM elements to match projectData.traits order (already sorted above)
          // Do this while transforms are still applied so elements stay visually in place
          projectData.traits.forEach((trait, index) => {
            const bar = allBars.find(b => b.dataset.id === trait.id);
            if (bar && bar.parentNode === container) {
              // Move element to correct position if needed
              const currentIndex = Array.from(container.children).indexOf(bar);
              if (currentIndex !== index) {
                const referenceNode = container.children[index];
                if (referenceNode && referenceNode !== bar) {
                  container.insertBefore(bar, referenceNode);
                } else if (!referenceNode) {
                  container.appendChild(bar);
                }
              }
            }
          });
        }
        
        // CRITICAL: Now remove transforms - elements are already in new DOM positions
        // They will stay in place because DOM position matches visual position
        // Use requestAnimationFrame to ensure DOM move completes before removing transforms
        requestAnimationFrame(() => {
          // Remove transforms - elements are already in correct DOM positions
          currentLayerBar.style.transition = ""
          currentLayerBar.style.transform = ""
          currentLayerBar.style.zIndex = ""
          currentLayerBar.classList.remove("reordering")
          
          aboveLayerBar.style.transition = ""
          aboveLayerBar.style.transform = ""
          aboveLayerBar.style.zIndex = ""
          aboveLayerBar.classList.remove("reordering")
          
          // CRITICAL: Only update UI after transforms are removed and DOM is in final position
          setTimeout(() => {
            // Only update UI state if needed, but don't re-render the list
            // The DOM is already in the correct order
            const traitLayersModule = window.NFTApp?.getModule('traitLayers');
            if (traitLayersModule && traitLayersModule.updateDeleteAllLayersButtonVisibility) {
              traitLayersModule.updateDeleteAllLayersButtonVisibility(projectData);
            }
          }, 50);
        });
        
        // Reset animation state
        this._reorderingState.isAnimating = false;
        this._reorderingState.pendingTimeouts = [];
        this._reorderingState.transitionEndHandlers = [];
      }
    };

    // Add transitionend handlers
    const currentHandler = (e) => {
      if (e.target === currentLayerBar && e.propertyName === 'transform') {
        cleanup();
        currentLayerBar.removeEventListener('transitionend', currentHandler);
      }
    };
    
    const aboveHandler = (e) => {
      if (e.target === aboveLayerBar && e.propertyName === 'transform') {
        cleanup();
        aboveLayerBar.removeEventListener('transitionend', aboveHandler);
      }
    };

    currentLayerBar.addEventListener('transitionend', currentHandler);
    aboveLayerBar.addEventListener('transitionend', aboveHandler);
    
    // Store handlers for potential cleanup
    this._reorderingState.transitionEndHandlers.push(
      { element: currentLayerBar, handler: currentHandler },
      { element: aboveLayerBar, handler: aboveHandler }
    );

    // Fallback timeout in case transitionend doesn't fire (shouldn't happen, but safety net)
    const fallbackTimeout = setTimeout(() => {
      if (this._reorderingState.isAnimating) {
        cleanup();
      }
    }, 500); // Slightly longer than animation duration
    
    this._reorderingState.pendingTimeouts.push(fallbackTimeout);
  },

  // Move trait layer down (increase order)
  moveTraitLayerDown: function (layerId, projectData) {
    // CRITICAL: Cancel any pending animations to prevent conflicts
    if (this._reorderingState.isAnimating) {
      this._cancelPendingAnimations();
    }

    // Find the layer
    const layerIndex = projectData.traits.findIndex((l) => l.id === layerId)
    if (layerIndex === -1 || layerIndex >= projectData.traits.length - 1) return // Already at the bottom

    // Get DOM elements before updating
    const container = document.getElementById("trait-layers-container")
    if (!container) {
      // Fallback to instant update if container not found
      const currentOrder = projectData.traits[layerIndex].order
      const belowOrder = projectData.traits[layerIndex + 1].order
      projectData.traits[layerIndex].order = belowOrder
      projectData.traits[layerIndex + 1].order = currentOrder
      projectData.traits.sort((a, b) => a.order - b.order)
      this.updateTraitLayerUI(projectData)
      return
    }

    const currentLayerBar = container.querySelector(`.trait-layer-bar[data-id="${layerId}"]`)
    const belowLayerBar = container.querySelector(`.trait-layer-bar[data-id="${projectData.traits[layerIndex + 1].id}"]`)
    
    if (!currentLayerBar || !belowLayerBar) {
      // Fallback to instant update if elements not found
      const currentOrder = projectData.traits[layerIndex].order
      const belowOrder = projectData.traits[layerIndex + 1].order
      projectData.traits[layerIndex].order = belowOrder
      projectData.traits[layerIndex + 1].order = currentOrder
      projectData.traits.sort((a, b) => a.order - b.order)
      this.updateTraitLayerUI(projectData)
      return
    }

    // Mark animation as in progress
    this._reorderingState.isAnimating = true;

    // Calculate the distance to move (move current layer to where below layer is)
    const currentRect = currentLayerBar.getBoundingClientRect()
    const belowRect = belowLayerBar.getBoundingClientRect()
    // Distance to move current layer down (positive value)
    const moveDistance = belowRect.top - currentRect.top
    // Distance to move below layer up (negative value) - current layer's height + gap
    const belowMoveDistance = -(belowRect.top - currentRect.bottom)

    // CRITICAL: Ensure both elements are visible and in document flow before animation
    // This prevents disappearing during animation
    currentLayerBar.style.visibility = "visible"
    currentLayerBar.style.opacity = "1"
    currentLayerBar.style.display = ""
    belowLayerBar.style.visibility = "visible"
    belowLayerBar.style.opacity = "1"
    belowLayerBar.style.display = ""
    
    // Clean up any existing transforms first
    currentLayerBar.style.transition = ""
    currentLayerBar.style.transform = ""
    currentLayerBar.style.zIndex = ""
    belowLayerBar.style.transition = ""
    belowLayerBar.style.transform = ""
    belowLayerBar.style.zIndex = ""
    
    // Force reflow to ensure styles are reset
    void currentLayerBar.offsetHeight;
    void belowLayerBar.offsetHeight;

    // Add animation class to both elements simultaneously
    currentLayerBar.classList.add("reordering")
    belowLayerBar.classList.add("reordering")
    
    // CRITICAL: Use faster, smoother animation with cubic-bezier timing for fluid motion
    const animationDuration = 200; // 0.2 seconds total for fluid reordering animation
    
    // CRITICAL: Set transition on both elements simultaneously
    currentLayerBar.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    belowLayerBar.style.transition = `transform ${animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
    
    // CRITICAL: Set z-index on both elements to ensure they're both visible during animation
    currentLayerBar.style.zIndex = "1000"
    belowLayerBar.style.zIndex = "1000"
    
    // Force reflow to ensure transition and z-index are set before transform
    void currentLayerBar.offsetHeight;
    void belowLayerBar.offsetHeight;
    
    // CRITICAL: Apply transforms to both elements in the same frame to ensure simultaneous animation
    // Use requestAnimationFrame to ensure both transforms are applied together
    requestAnimationFrame(() => {
      currentLayerBar.style.transform = `translateY(${moveDistance}px)`
      belowLayerBar.style.transform = `translateY(${belowMoveDistance}px)`
    })

    // Update the data order
    const currentOrder = projectData.traits[layerIndex].order
    const belowOrder = projectData.traits[layerIndex + 1].order
    projectData.traits[layerIndex].order = belowOrder
    projectData.traits[layerIndex + 1].order = currentOrder

    // Sort the traits array by order
    projectData.traits.sort((a, b) => a.order - b.order)

    // Use transitionend events for reliable cleanup (more reliable than setTimeout)
    let completedCount = 0;
    const requiredCompletions = 2; // Both elements need to complete
    
    const cleanup = () => {
      completedCount++;
      if (completedCount >= requiredCompletions) {
        // CRITICAL: Move DOM elements FIRST while transforms are still visually applied
        // This ensures the elements are in their new positions before removing transforms
        const container = document.getElementById("trait-layers-container");
        if (container) {
          // Get all layer bars in current DOM order
          const allBars = Array.from(container.querySelectorAll('.trait-layer-bar'));
          
          // Reorder DOM elements to match projectData.traits order (already sorted above)
          // Do this while transforms are still applied so elements stay visually in place
          projectData.traits.forEach((trait, index) => {
            const bar = allBars.find(b => b.dataset.id === trait.id);
            if (bar && bar.parentNode === container) {
              // Move element to correct position if needed
              const currentIndex = Array.from(container.children).indexOf(bar);
              if (currentIndex !== index) {
                const referenceNode = container.children[index];
                if (referenceNode && referenceNode !== bar) {
                  container.insertBefore(bar, referenceNode);
                } else if (!referenceNode) {
                  container.appendChild(bar);
                }
              }
            }
          });
        }
        
        // CRITICAL: Now remove transforms - elements are already in new DOM positions
        // They will stay in place because DOM position matches visual position
        // Use requestAnimationFrame to ensure DOM move completes before removing transforms
        requestAnimationFrame(() => {
          // Remove transforms - elements are already in correct DOM positions
          currentLayerBar.style.transition = ""
          currentLayerBar.style.transform = ""
          currentLayerBar.style.zIndex = ""
          currentLayerBar.classList.remove("reordering")
          
          belowLayerBar.style.transition = ""
          belowLayerBar.style.transform = ""
          belowLayerBar.style.zIndex = ""
          belowLayerBar.classList.remove("reordering")
          
          // CRITICAL: Only update UI after transforms are removed and DOM is in final position
          setTimeout(() => {
            // Only update UI state if needed, but don't re-render the list
            // The DOM is already in the correct order
            const traitLayersModule = window.NFTApp?.getModule('traitLayers');
            if (traitLayersModule && traitLayersModule.updateDeleteAllLayersButtonVisibility) {
              traitLayersModule.updateDeleteAllLayersButtonVisibility(projectData);
            }
          }, 50);
        });
        
        // Reset animation state
        this._reorderingState.isAnimating = false;
        this._reorderingState.pendingTimeouts = [];
        this._reorderingState.transitionEndHandlers = [];
      }
    };

    // Add transitionend handlers
    const currentHandler = (e) => {
      if (e.target === currentLayerBar && e.propertyName === 'transform') {
        cleanup();
        currentLayerBar.removeEventListener('transitionend', currentHandler);
      }
    };
    
    const belowHandler = (e) => {
      if (e.target === belowLayerBar && e.propertyName === 'transform') {
        cleanup();
        belowLayerBar.removeEventListener('transitionend', belowHandler);
      }
    };

    currentLayerBar.addEventListener('transitionend', currentHandler);
    belowLayerBar.addEventListener('transitionend', belowHandler);
    
    // Store handlers for potential cleanup
    this._reorderingState.transitionEndHandlers.push(
      { element: currentLayerBar, handler: currentHandler },
      { element: belowLayerBar, handler: belowHandler }
    );

    // Fallback timeout in case transitionend doesn't fire (shouldn't happen, but safety net)
    const fallbackTimeout = setTimeout(() => {
      if (this._reorderingState.isAnimating) {
        cleanup();
      }
    }, animationDuration + 100); // Slightly longer than animation duration to ensure it completes
    
    this._reorderingState.pendingTimeouts.push(fallbackTimeout);
  },

  // Update the visibility of the Delete All Layers button
  updateDeleteAllLayersButtonVisibility: (projectData) => {
    const deleteAllLayersBtn = document.getElementById("delete-all-layers")
    if (deleteAllLayersBtn) {
      // Show button only if there's at least one trait layer
      if (projectData.traits && projectData.traits.length > 0) {
        deleteAllLayersBtn.style.display = "flex"
      } else {
        deleteAllLayersBtn.style.display = "none"
      }
    }
  },

  // Delete all trait layers
  deleteAllTraitLayers: function (projectData) {
    // Update combination rules to remove references to deleted layers
    if (projectData.traits && projectData.traits.length > 0) {
      // Remove all rules that reference any of the layers being deleted
      if (projectData.rules && projectData.rules.length > 0) {
        projectData.rules = projectData.rules.filter((rule) => {
          // Keep rules that don't reference any trait layers
          return false
        })

        // Update the combination rules UI if the module is available
        if (NFTApp.getModule && NFTApp.getModule("combinationRules")) {
          NFTApp.getModule("combinationRules").updateRulesUI(projectData)
        }
      }
    }

    projectData.traits = []
    this.updateTraitLayerUI(projectData)
    // Explicitly update the Delete All Layers button visibility
    this.updateDeleteAllLayersButtonVisibility(projectData)
    // Update rules section visibility
    if (NFTApp.getModule && NFTApp.getModule("combinationRules") && NFTApp.getModule("combinationRules").updateRulesSectionVisibility) {
      NFTApp.getModule("combinationRules").updateRulesSectionVisibility(projectData)
    }
    NFTApp.getModule("notificationService").show("All trait layers deleted", "success")
  },

  // Delete trait layer
  deleteTraitLayer: function (layerId, projectData) {
    const layerIndex = projectData.traits.findIndex((l) => l.id === layerId)
    if (layerIndex === -1) return

    const layerName = projectData.traits[layerIndex].name

    // Update combination rules to remove references to the deleted layer
    this.updateCombinationRulesAfterLayerDeletion(projectData, layerId, layerName)

    projectData.traits.splice(layerIndex, 1)

    // Update order for all layers
    projectData.traits.forEach((layer, index) => {
      layer.order = index
    })

    this.updateTraitLayerUI(projectData)
    // Update the Delete All Layers button visibility
    this.updateDeleteAllLayersButtonVisibility(projectData)
    // Update rules section visibility
    if (NFTApp.getModule && NFTApp.getModule("combinationRules") && NFTApp.getModule("combinationRules").updateRulesSectionVisibility) {
      NFTApp.getModule("combinationRules").updateRulesSectionVisibility(projectData)
    }
    NFTApp.getModule("notificationService").show("Trait layer deleted", "success")
  },

  // Add a new function to add an empty layer
  addEmptyLayer: function (projectData, layerName) {
    console.log("Adding empty layer with name:", layerName)

    // Validate layer name
    if (!layerName || layerName.trim() === "") {
      this.showFeedback("Please enter a layer name", "error")
      return false
    }

    // Check if a layer with this name already exists
    if (projectData.traits && projectData.traits.some((layer) => layer.name === layerName)) {
      this.showFeedback(`A layer named "${layerName}" already exists`, "error")
      return false
    }

    // Create a new trait layer object
    const traitLayer = {
      id: generateUniqueId(), // Use the utility function to generate a unique ID
      name: layerName,
      traits: [],
      order: projectData.traits ? projectData.traits.length : 0,
      rarity: 100, // Default layer rarity
    }

    // Add trait layer to project data
    if (!projectData.traits) {
      projectData.traits = []
    }

    // Add to the beginning of the array to make it the bottom layer
    projectData.traits.unshift(traitLayer)

    // Update order for all layers
    projectData.traits.forEach((layer, index) => {
      layer.order = index
    })

    // Update the UI
    this.updateTraitLayerUI(projectData)

    // Update the Delete All Layers button visibility
    this.updateDeleteAllLayersButtonVisibility(projectData)
    
    // Update rules section visibility
    if (NFTApp.getModule && NFTApp.getModule("combinationRules") && NFTApp.getModule("combinationRules").updateRulesSectionVisibility) {
      NFTApp.getModule("combinationRules").updateRulesSectionVisibility(projectData)
    }

    // Show success message
    this.showFeedback(`Layer "${layerName}" has been created`, "success")

    // Clear the input field
    document.getElementById("add-layer-input").value = ""

    // Check if we should auto-generate an NFT
    this.checkAndAutoGenerateNFT(projectData)

    return true
  },

  // Check if conditions are met for auto-generating an NFT
  checkAndAutoGenerateNFT: function(projectData) {
    // Don't auto-generate if NFT restoration is in progress
    if (window.nftRestorationInProgress) {
      console.log('[AUTO-GENERATE] Skipping check - NFT restoration in progress')
      return false
    }
    
    // Don't auto-generate if there's already a loaded NFT
    if (window.lastGeneratedNFT && window.lastGeneratedNFT.imageData) {
      console.log('[AUTO-GENERATE] Skipping check - NFT already exists')
      return false
    }
    
    // Don't auto-generate if first NFT has already been generated
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
      const navModule = window.NFTApp.getModule('navigation');
      if (navModule.firstNftGenerated) {
        console.log('[AUTO-GENERATE] Skipping check - First NFT already generated')
        return false
      }
    }
    
    // Don't auto-generate if NFT preview is already visible
    const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
    if (previewImage && previewImage.complete && previewImage.naturalWidth > 0) {
      console.log('[AUTO-GENERATE] Skipping check - NFT preview already visible')
      return false
    }
    
    // Check if we have at least 2 trait layers with at least one trait each
    if (!projectData.traits || projectData.traits.length < 2) {
      return false
    }

    let layersWithTraits = 0
    let totalTraitCount = 0

    projectData.traits.forEach(layer => {
      if (layer.traits && layer.traits.length > 0) {
        layersWithTraits++
        totalTraitCount += layer.traits.length
      }
    })

    // Check if we have at least 2 layers with traits and at least 2 total traits
    if (layersWithTraits >= 2 && totalTraitCount >= 2) {
      console.log('[AUTO-GENERATE] Conditions met for auto-generating NFT:', {
        layersWithTraits,
        totalTraitCount,
        totalLayers: projectData.traits.length
      })

      // Enable Generate NFTs and Export Metadata tabs
      this.enableGenerationTabs()

      // Auto-generate an NFT (only when conditions are met during layer/trait addition or project loading)
      this.autoGenerateNFT(projectData)

      return true
    }

    return false
  },


  // Enable Generate NFTs and Export Metadata tabs
  enableGenerationTabs: function() {
    const generateTab = document.querySelector('.nav-tab[data-tab="generate-nfts"]')
    const exportTab = document.querySelector('.nav-tab[data-tab="export-nfts"]')

    if (generateTab) {
      generateTab.style.display = 'flex'
      generateTab.style.opacity = '1'
      generateTab.style.pointerEvents = 'auto'
    }

    if (exportTab) {
      exportTab.style.display = 'flex'
      exportTab.style.opacity = '1'
      exportTab.style.pointerEvents = 'auto'
    }

    console.log('[AUTO-GENERATE] Generation tabs enabled')
  },

  // Auto-generate an NFT
  autoGenerateNFT: function(projectData) {
    // Don't auto-generate if NFT restoration is in progress
    if (window.nftRestorationInProgress) {
      console.log('[AUTO-GENERATE] Skipping auto-generation - NFT restoration in progress')
      return
    }
    
    // Don't auto-generate if there's already a loaded NFT
    if (window.lastGeneratedNFT && window.lastGeneratedNFT.imageData) {
      console.log('[AUTO-GENERATE] Skipping auto-generation - NFT already exists')
      return
    }
    
    // Don't auto-generate if first NFT has already been generated
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
      const navModule = window.NFTApp.getModule('navigation');
      if (navModule.firstNftGenerated) {
        console.log('[AUTO-GENERATE] Skipping auto-generation - First NFT already generated')
        return
      }
    }
    
    // Don't auto-generate if NFT preview is already visible
    const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
    if (previewImage && previewImage.complete && previewImage.naturalWidth > 0) {
      console.log('[AUTO-GENERATE] Skipping auto-generation - NFT preview already visible')
      return
    }
    
    console.log('[AUTO-GENERATE] Starting auto-generation of NFT')
    
    // Use a small delay to ensure UI is ready
    setTimeout(() => {
      // Triple-check all conditions before generating
      if (window.nftRestorationInProgress) {
        console.log('[AUTO-GENERATE] Cancelled - NFT restoration started during delay')
        return
      }
      
      if (window.lastGeneratedNFT && window.lastGeneratedNFT.imageData) {
        console.log('[AUTO-GENERATE] Cancelled - NFT created during delay')
        return
      }
      
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('navigation')) {
        const navModule = window.NFTApp.getModule('navigation');
        if (navModule.firstNftGenerated) {
          console.log('[AUTO-GENERATE] Cancelled - First NFT generated during delay')
          return
        }
      }
      
      const previewImage = document.querySelector('.nft-preview-image-area img, .nft-preview-item img');
      if (previewImage && previewImage.complete && previewImage.naturalWidth > 0) {
        console.log('[AUTO-GENERATE] Cancelled - NFT preview appeared during delay')
        return
      }
      
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI')) {
        // Call the randomize function to generate an NFT
        window.NFTApp.getModule('generateNftsUI').randomizeSingleNFT(projectData)
        console.log('[AUTO-GENERATE] NFT generation initiated')
      } else {
        console.warn('[AUTO-GENERATE] Generate NFTs UI module not available')
      }
    }, 500)
  },

  // Update combination rules after layer rename
  updateCombinationRulesAfterLayerRename: (projectData, layerId, oldName, newName) => {
    if (!projectData.rules || projectData.rules.length === 0) return

    let rulesUpdated = false

    projectData.rules.forEach((rule) => {
      // Update layer names in rules
      switch (rule.appliesTo) {
        case "between-layers":
          if (rule.firstLayerId === layerId) {
            rule.firstLayerName = newName
            rulesUpdated = true
          }
          if (rule.secondLayerId === layerId) {
            rule.secondLayerName = newName
            rulesUpdated = true
          }
          break

        case "between-traits":
          // Update layer names in trait references
          if (rule.firstTraits && rule.firstTraits.length > 0) {
            rule.firstTraits.forEach((trait) => {
              if (trait.layerId === layerId) {
                trait.layerName = newName
                rulesUpdated = true
              }
            })
          }
          if (rule.secondTraits && rule.secondTraits.length > 0) {
            rule.secondTraits.forEach((trait) => {
              if (trait.layerId === layerId) {
                trait.layerName = newName
                rulesUpdated = true
              }
            })
          }
          break

        case "layer-to-traits":
        case "traits-to-layer":
          // Update layer name
          if (rule.layerId === layerId) {
            rule.layerName = newName
            rulesUpdated = true
          }
          // Update layer name in trait references
          if (rule.traits && rule.traits.length > 0) {
            rule.traits.forEach((trait) => {
              if (trait.layerId === layerId) {
                trait.layerName = newName
                rulesUpdated = true
              }
            })
          }
          break
      }
    })

    // Update the combination rules UI if any rules were updated
    if (rulesUpdated && NFTApp.getModule && NFTApp.getModule("combinationRules")) {
      NFTApp.getModule("combinationRules").updateRulesUI(projectData)
    }
  },

  // Update combination rules after trait rename
  updateCombinationRulesAfterTraitRename: (projectData, layerId, layerName, traitId, oldName, newName) => {
    if (!projectData.rules || projectData.rules.length === 0) return

    let rulesUpdated = false

    projectData.rules.forEach((rule) => {
      // Update trait names in rules
      switch (rule.appliesTo) {
        case "between-traits":
          // Update trait names in first traits
          if (rule.firstTraits && rule.firstTraits.length > 0) {
            rule.firstTraits.forEach((trait) => {
              if (trait.layerId === layerId && trait.id === traitId) {
                trait.name = newName
                rulesUpdated = true
              }
            })
          }
          // Update trait names in second traits
          if (rule.secondTraits && rule.secondTraits.length > 0) {
            rule.secondTraits.forEach((trait) => {
              if (trait.layerId === layerId && trait.id === traitId) {
                trait.name = newName
                rulesUpdated = true
              }
            })
          }
          break

        case "layer-to-traits":
        case "traits-to-layer":
          // Update trait names in traits
          if (rule.traits && rule.traits.length > 0) {
            rule.traits.forEach((trait) => {
              if (trait.layerId === layerId && trait.id === traitId) {
                trait.name = newName
                rulesUpdated = true
              }
            })
          }
          break
      }
    })

    // Update the combination rules UI if any rules were updated
    if (rulesUpdated && NFTApp.getModule && NFTApp.getModule("combinationRules")) {
      NFTApp.getModule("combinationRules").updateRulesUI(projectData)
    }
  },

  // Update combination rules after layer deletion
  updateCombinationRulesAfterLayerDeletion: (projectData, layerId, layerName) => {
    if (!projectData.rules || projectData.rules.length === 0) return

    // Filter out rules that reference the deleted layer
    const updatedRules = projectData.rules.filter((rule) => {
      switch (rule.appliesTo) {
        case "between-layers":
          // Remove rules where either layer is the deleted layer
          return rule.firstLayerId !== layerId && rule.secondLayerId !== layerId

        case "between-traits":
          // Keep rules that don't have traits from the deleted layer
          const hasFirstTraitsFromLayer = rule.firstTraits && rule.firstTraits.some((t) => t.layerId === layerId)
          const hasSecondTraitsFromLayer = rule.secondTraits && rule.secondTraits.some((t) => t.layerId === layerId)
          return !hasFirstTraitsFromLayer && !hasSecondTraitsFromLayer

        case "layer-to-traits":
        case "traits-to-layer":
          // Remove rules where the layer is the deleted layer or traits are from the deleted layer
          const isLayerDeleted = rule.layerId === layerId
          const hasTraitsFromLayer = rule.traits && rule.traits.some((t) => t.layerId === layerId)
          return !isLayerDeleted && !hasTraitsFromLayer

        default:
          return true
      }
    })

    // Update the project data with the filtered rules
    if (updatedRules.length !== projectData.rules.length) {
      projectData.rules = updatedRules

      // Update the combination rules UI
      if (NFTApp.getModule && NFTApp.getModule("combinationRules")) {
        NFTApp.getModule("combinationRules").updateRulesUI(projectData)
      }
    }
  },

  // Update combination rules after trait deletion
  updateCombinationRulesAfterTraitDeletion: (projectData, layerId, layerName, traitId, traitName) => {
    if (!projectData.rules || projectData.rules.length === 0) return

    let rulesUpdated = false
    const rulesToRemove = []

    projectData.rules.forEach((rule, index) => {
      switch (rule.appliesTo) {
        case "between-traits":
          // Remove the deleted trait from firstTraits
          if (rule.firstTraits && rule.firstTraits.length > 0) {
            const originalLength = rule.firstTraits.length
            rule.firstTraits = rule.firstTraits.filter((t) => !(t.layerId === layerId && t.id === traitId))

            // If all traits were removed, mark the rule for removal
            if (rule.firstTraits.length === 0 && originalLength > 0) {
              rulesToRemove.push(index)
              rulesUpdated = true
            } else if (rule.firstTraits.length !== originalLength) {
              rulesUpdated = true
            }
          }

          // Remove the deleted trait from secondTraits
          if (rule.secondTraits && rule.secondTraits.length > 0) {
            const originalLength = rule.secondTraits.length
            rule.secondTraits = rule.secondTraits.filter((t) => !(t.layerId === layerId && t.id === traitId))

            // If all traits were removed, mark the rule for removal
            if (rule.secondTraits.length === 0 && originalLength > 0) {
              if (!rulesToRemove.includes(index)) {
                rulesToRemove.push(index)
              }
              rulesUpdated = true
            } else if (rule.secondTraits.length !== originalLength) {
              rulesUpdated = true
            }
          }
          break

        case "layer-to-traits":
        case "traits-to-layer":
          // Remove the deleted trait from traits
          if (rule.traits && rule.traits.length > 0) {
            const originalLength = rule.traits.length
            rule.traits = rule.traits.filter((t) => !(t.layerId === layerId && t.id === traitId))

            // If all traits were removed, mark the rule for removal
            if (rule.traits.length === 0 && originalLength > 0) {
              rulesToRemove.push(index)
              rulesUpdated = true
            } else if (rule.traits.length !== originalLength) {
              rulesUpdated = true
            }
          }
          break
      }
    })

    // Remove rules that no longer have any traits
    if (rulesToRemove.length > 0) {
      // Remove rules in reverse order to avoid index shifting issues
      rulesToRemove
        .sort((a, b) => b - a)
        .forEach((index) => {
          projectData.rules.splice(index, 1)
        })
    }

    // Update the combination rules UI if any rules were updated
    if (rulesUpdated && NFTApp.getModule && NFTApp.getModule("combinationRules")) {
      NFTApp.getModule("combinationRules").updateRulesUI(projectData)
    }
  },

  // Update the showFeedback function to use the notification service
  showFeedback: (message, type = "info") => {
    // Use the notification service instead of creating a custom feedback element
    if (NFTApp.getModule && NFTApp.getModule("notificationService")) {
      NFTApp.getModule("notificationService").show(message, type, 3000)
    } else {
      // Fallback to console if notification service is not available
      console.log(`Feedback (${type}): ${message}`)
    }
  },

  // Helper function to generate a unique ID
  generateUniqueId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5),

  addLayer: function(projectData) {
    // Create a new layer with a unique ID and a default name
    const newLayer = {
      id: this.generateUniqueId(),
      name: `Layer ${projectData.traits.length + 1}`,
      rarity: 100,
      traits: []
    }
    
    // Add the new layer to the project
    projectData.traits.push(newLayer)
    
    // Update the UI
    this.updateTraitLayerUI(projectData)
    
    // Dispatch an event to notify other components
    document.dispatchEvent(new CustomEvent('layers-updated'));
  },
  
  deleteLayer: function(layerId, projectData) {
    // Find the index of the layer to delete
    const layerIndex = projectData.traits.findIndex(layer => layer.id === layerId)
    
    if (layerIndex === -1) {
      console.error(`Layer with ID ${layerId} not found`)
      return
    }
    
    // Remove the layer from the project
    projectData.traits.splice(layerIndex, 1)
    
    // Update the UI
    this.updateTraitLayerUI(projectData)
    
    // Dispatch an event to notify other components
    document.dispatchEvent(new CustomEvent('layers-updated'));
  },

  addTrait: function(layerId, projectData) {
    // Find the layer to add a trait to
    const layer = projectData.traits.find(layer => layer.id === layerId)
    
    if (!layer) {
      console.error(`Layer with ID ${layerId} not found`)
      return
    }
    
    // Create a new trait with a unique ID and a default name
    const newTrait = {
      id: this.generateUniqueId(),
      name: `Trait ${layer.traits.length + 1}`,
      rarity: 10
    }
    
    // Add the new trait to the layer
    layer.traits.push(newTrait)
    
    // Update the UI
    this.updateTraitLayerUI(projectData)
    
    // Dispatch an event to notify other components
    document.dispatchEvent(new CustomEvent('traits-updated'));
  },
  
  deleteTrait: function(layerId, traitId, projectData) {
    // Find the layer
    const layer = projectData.traits.find(layer => layer.id === layerId)
    
    if (!layer) {
      console.error(`Layer with ID ${layerId} not found`)
      return
    }
    
    // Find the index of the trait to delete
    const traitIndex = layer.traits.findIndex(trait => trait.id === traitId)
    
    if (traitIndex === -1) {
      console.error(`Trait with ID ${traitId} not found in layer ${layer.name}`)
      return
    }
    
    // Remove the trait from the layer
    layer.traits.splice(traitIndex, 1)
    
    // Update the UI
    this.updateTraitLayerUI(projectData)
    
    // Update rules section visibility
    if (NFTApp.getModule && NFTApp.getModule("combinationRules") && NFTApp.getModule("combinationRules").updateRulesSectionVisibility) {
      NFTApp.getModule("combinationRules").updateRulesSectionVisibility(projectData)
    }
    
    // Dispatch an event to notify other components
    document.dispatchEvent(new CustomEvent('traits-updated'));
  },

  // Handle expanding and collapsing of trait layer content
  handleTraitLayerExpand: function (layer, projectData) {
    const content = layer.querySelector(".trait-layer-content")
    const isExpanded = content.classList.contains("expanded")

    // If expanding, first collapse any currently expanded layers
    if (!isExpanded) {
      // Find all expanded trait layers and collapse them
      const allExpandedLayers = document.querySelectorAll(".trait-layer-content.expanded")
      allExpandedLayers.forEach((expandedContent) => {
        expandedContent.classList.remove("expanded")
        // Get the parent trait layer bar and remove expanded class
        const expandedLayerBar = expandedContent.closest(".trait-layer-bar")
        if (expandedLayerBar) {
          expandedLayerBar.classList.remove("expanded")
          // Re-enable dragging for the collapsed layer
          expandedLayerBar.setAttribute("draggable", "true")
        }
      })

      // Expand this layer
      content.classList.add("expanded")
      layer.classList.add("expanded")
      // Disable dragging for expanded layer
      layer.setAttribute("draggable", "false")
    } else {
      // Collapse this layer
      content.classList.remove("expanded")
      layer.classList.remove("expanded")
      // Re-enable dragging
      layer.setAttribute("draggable", "true")
    }

    // Update the trait layer UI
    this.updateTraitLayerUI(projectData)
  },

  // Modify the click handler for trait layer toggle
  addEventListenersToTraitLayer: function (layer, projectData) {
    // Add click event listener to the toggle button
    const toggleBtn = layer.querySelector(".trait-layer-toggle")
    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        this.handleTraitLayerExpand(layer, projectData)
      })
    }
    
    // Add click event listener to the layer header (for toggling)
    const header = layer.querySelector(".trait-layer-header")
    if (header) {
      header.addEventListener("click", (e) => {
        // Don't toggle if clicking on a button or input within the header
        if (
          e.target.tagName === "BUTTON" ||
          e.target.tagName === "INPUT" ||
          e.target.closest("button") ||
          e.target.closest("input") ||
          e.target.closest(".trait-layer-actions") ||
          e.target.closest(".trait-layer-position")
        ) {
          return
        }
        
        this.handleTraitLayerExpand(layer, projectData)
      })
    }
    
    // Add event listeners for other buttons...
    // ... existing code for other event listeners ...
  },

  // Helper method to count unique top-level folders
  countTopLevelFolders: function(files) {
    if (!files || files.length === 0) return 0;
    
    const folderSet = new Set();
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.webkitRelativePath) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
          folderSet.add(parts[0]);
        }
      }
    }
    
    return folderSet.size;
  },
  
  // Show feedback message to the user
  showFeedback: function(message, type = "success") {
    // Check if we already have a feedback element
    let feedbackContainer = document.getElementById("trait-layers-feedback");
    
    if (!feedbackContainer) {
      // Create a new feedback container
      feedbackContainer = document.createElement("div");
      feedbackContainer.id = "trait-layers-feedback";
      feedbackContainer.className = "folder-feedback";
      
      // Insert it at the top of the trait layers area
      const traitLayersArea = document.querySelector(".trait-layers-container");
      if (traitLayersArea && traitLayersArea.parentNode) {
        traitLayersArea.parentNode.insertBefore(feedbackContainer, traitLayersArea);
      } else {
        // Fallback - add to body
        document.body.appendChild(feedbackContainer);
      }
    }
    
    // Update the feedback contents
    feedbackContainer.textContent = message;
    feedbackContainer.className = `folder-feedback ${type}`;
    
    // Add remove timer
    setTimeout(() => {
      if (feedbackContainer.parentNode) {
        // Fade out
        feedbackContainer.style.opacity = "0";
        setTimeout(() => {
          if (feedbackContainer.parentNode) {
            feedbackContainer.parentNode.removeChild(feedbackContainer);
          }
        }, 300);
      }
    }, 5000);
  },

  // Add a helper function to safely update the preview panel
  safelyUpdatePreviewPanel: function(projectData, nft = null) {
    // Check if generate module exists
    if (!NFTApp.getModule || !NFTApp.getModule('generateNftsUI')) {
      console.warn("Generate NFTs UI module not available");
      return;
    }
    // Only update if the preview grid exists (i.e., the Generate NFTs tab is active)
    const previewGrid = document.querySelector('.nft-preview-grid');
    if (!previewGrid) {
      console.debug('[safelyUpdatePreviewPanel] .nft-preview-grid not found in DOM, skipping preview update.');
      return;
    }
    try {
      // Ensure container exists before attempting to update the preview panel
      if (window.ensureNftPreviewContainerExists) {
        window.ensureNftPreviewContainerExists();
      }
      NFTApp.getModule('generateNftsUI').updateSinglePreviewPanel(projectData, nft);
    } catch (err) {
      console.warn("Error updating preview panel:", err.message);
      // Try again after a short delay
      setTimeout(() => {
        try {
          if (window.ensureNftPreviewContainerExists) {
            window.ensureNftPreviewContainerExists();
          }
          NFTApp.getModule('generateNftsUI').updateSinglePreviewPanel(projectData, nft);
        } catch (retryErr) {
          console.error("Failed to update preview panel even after retry:", retryErr.message);
        }
      }, 500);
    }
  },

  // At the end of the module object, add an init function to inject CSS and log debug
  init: function() {
    // Add/Update CSS for .traits-grid, .trait-item, and custom tooltip
    if (!document.getElementById('trait-layers-style')) {
      const style = document.createElement('style');
      style.id = 'trait-layers-style';
      style.textContent = `
        .traits-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          width: 100%;
          align-items: flex-start;
          justify-content: flex-start;
          min-height: 0;
          max-height: none;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #222 #111;
        }
        .traits-grid::-webkit-scrollbar {
          width: 8px;
          background: #111;
        }
        .traits-grid::-webkit-scrollbar-thumb {
          background: #222;
          border-radius: 6px;
        }
        .trait-item {
          box-sizing: border-box;
          width: 120px;
          min-width: 0;
          max-width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          margin: 0;
          background: rgba(0,0,0,0.04);
          border-radius: 6px;
          padding: 6px 2px 6px 2px;
          overflow: hidden;
          position: relative;
        }
        .trait-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
          cursor: pointer;
          position: relative;
        }
        .custom-tooltip {
          display: none;
          position: absolute;
          left: 50%;
          top: -36px;
          transform: translateX(-50%);
          background: #222;
          color: #fff;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          white-space: pre-line;
          z-index: 99999;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s;
        }
        .custom-tooltip-anchor:hover .custom-tooltip {
          display: block;
          opacity: 1;
          pointer-events: auto;
        }
      `;
      document.head.appendChild(style);
    }
    console.log("[DEBUG] test-debug.js loaded");
  },
})

