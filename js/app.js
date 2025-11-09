// Define NFTApp if it's not already defined
window.NFTApp = window.NFTApp || {}

// Helper function to check if NFTApp is properly initialized
window.isNFTAppReady = () =>
  typeof window.NFTApp !== "undefined" &&
  typeof window.NFTApp.registerModule === "function" &&
  typeof window.NFTApp.getModule === "function" &&
  typeof window.NFTApp.initModules === "function"

// Module System
;(() => {
  // Store all modules
  window.NFTApp.modules = window.NFTApp.modules || {}

  // Register a new module
  window.NFTApp.registerModule =
    window.NFTApp.registerModule ||
    function (name, module) {
      console.log(`Registering module: ${name}`)
      this.modules[name] = module
      return module
    }

  // Get a registered module
  window.NFTApp.getModule =
    window.NFTApp.getModule ||
    function (name) {
      const module = this.modules[name]
      if (!module) {
        console.warn(`Module '${name}' not found`)
      }
      return module
    }

  // Initialize all modules
  window.NFTApp.initModules =
    window.NFTApp.initModules ||
    function () {
      console.log("Initializing all modules...")
      for (const moduleName in this.modules) {
        if (this.modules[moduleName] && typeof this.modules[moduleName].init === "function") {
          console.log(`Initializing module: ${moduleName}`)
          try {
            this.modules[moduleName].init()
          } catch (error) {
            console.error(`Error initializing module ${moduleName}:`, error)
          }
        }
      }
      console.log("All modules initialized")
    }
})()

// Utility Functions
;(() => {
  const utils = {
    // Generate a unique ID
    generateUniqueId: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5),

    // Format a date to a readable string
    formatDate: (date) => new Date(date).toLocaleString(),

    // Deep clone an object
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

    // Check if two arrays have the same elements
    arraysEqual: (a, b) => {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    },

    // Shuffle an array (Fisher-Yates algorithm)
    shuffleArray: (array) => {
      const newArray = [...array]
      for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
      }
      return newArray
    },

    // Download a file
    downloadFile: (content, fileName, contentType) => {
      const a = document.createElement("a")
      const file = new Blob([content], { type: contentType })
      a.href = URL.createObjectURL(file)
      a.download = fileName
      a.click()
      URL.revokeObjectURL(a.href)
    },

    // Convert a data URL to a Blob
    dataURLtoBlob: (dataURL) => {
      const parts = dataURL.split(";base64,")
      const contentType = parts[0].split(":")[1]
      const raw = window.atob(parts[1])
      const rawLength = raw.length
      const uInt8Array = new Uint8Array(rawLength)

      for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i)
      }

      return new Blob([uInt8Array], { type: contentType })
    },

    // Format file size
    formatFileSize: (bytes) => {
      if (bytes === 0) return "0 Bytes"
      const k = 1024
      const sizes = ["Bytes", "KB", "MB", "GB"]
      const i = Math.floor(Math.log(bytes) / Math.log(k))
      return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    },

    // Debounce function to limit how often a function is called
    debounce: (func, wait) => {
      let timeout
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout)
          func(...args)
        }
        clearTimeout(timeout)
        timeout = setTimeout(later, wait)
      }
    },

    // Show notification to the user
    showNotification: (message, type = "info", duration = 3000) => {
      // Create notification container if it doesn't exist
      let container = document.querySelector(".notification-container")
      if (!container) {
        container = document.createElement("div")
        container.className = "notification-container"
        document.body.appendChild(container)
      }

      // Create notification element
      const notification = document.createElement("div")

      // For successful operations, always use success type
      if (
        message.includes("successfully") ||
        message.includes("added") ||
        message.includes("updated") ||
        message.includes("saved") ||
        message.includes("moved") ||
        message.includes("renamed") ||
        message.includes("loaded")
      ) {
        type = "success"
      }

      notification.className = `notification ${type}`

      // Icon based on notification type
      let iconSvg = ""
      switch (type) {
        case "success":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
          break
        case "error":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
          break
        case "warning":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
          break
        default:
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
      }

      // Build notification content
      notification.innerHTML = `
        <div class="notification-icon">${iconSvg}</div>
        <div class="notification-message ${type === "error" ? "error-message" : (type === "success" ? "success-message" : "")}">${message}</div>
        <button class="notification-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `

      // Add to container
      container.appendChild(notification)

      // Add close button functionality
      const closeBtn = notification.querySelector(".notification-close")
      closeBtn.addEventListener("click", () => {
        notification.remove()
      })

      // Auto-remove after duration
      setTimeout(() => {
        if (notification.parentNode) {
          notification.remove()
        }
      }, duration)

      return notification
    },

    init: () => {
      console.log("Initializing utils module")
    },
  }

  // Register the utils module
  window.NFTApp.registerModule("utils", utils)
})()

// Notification Service Module
;(() => {
  const notificationService = {
    init: function () {
      console.log("Initializing notification service module")
      this.createContainer()
    },

    createContainer: () => {
      // Create notification container if it doesn't exist
      if (!document.querySelector(".notification-container")) {
        const container = document.createElement("div")
        container.className = "notification-container"
        document.body.appendChild(container)
      }
    },

    show: function (message, type = "info", duration = 3000) {
      this.createContainer()
      const container = document.querySelector(".notification-container")

      // Create notification element
      const notification = document.createElement("div")

      // For successful operations, always use success type
      if (
        message.includes("successfully") ||
        message.includes("added") ||
        message.includes("updated") ||
        message.includes("saved") ||
        message.includes("moved") ||
        message.includes("renamed") ||
        message.includes("loaded")
      ) {
        type = "success"
      }

      notification.className = `notification ${type}`
      
      // Store duration on notification element for reference
      notification._duration = duration

      // Icon based on notification type
      let iconSvg = ""
      switch (type) {
        case "success":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
          break
        case "error":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
          break
        case "warning":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
          break
        default:
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
      }

      // Build notification content
      notification.innerHTML = `
        <div class="notification-icon">${iconSvg}</div>
        <div class="notification-message ${type === "error" ? "error-message" : (type === "success" ? "success-message" : "")}">${message}</div>
        <button class="notification-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `

      // Add to container
      container.appendChild(notification)

      // Add close button functionality
      const closeBtn = notification.querySelector(".notification-close")
      closeBtn.addEventListener("click", () => {
        if (notification._autoRemoveTimeout) {
          clearTimeout(notification._autoRemoveTimeout);
        }
        notification.remove()
      })

      // Auto-remove after duration - store timeout ID so it can't be accidentally cleared
      // This ensures the notification disappears after the specified duration (3 seconds) 
      // regardless of "Please Wait" popup state
      const timeoutId = setTimeout(() => {
        if (notification.parentNode) {
          notification.remove()
        }
      }, duration)
      
      // Store timeout ID on notification element to prevent accidental clearing
      notification._autoRemoveTimeout = timeoutId

      return notification
    },
  }

  // Register the notification service module
  window.NFTApp.registerModule("notificationService", notificationService)
})()

// Confirmation Modal Module
;(() => {
  const confirmationModal = {
    init: function () {
      console.log("Initializing confirmation modal module")
      this.setup()
    },

    setup: function () {
      this.modal = document.getElementById("confirmation-modal")
      this.title = document.getElementById("confirmation-modal-title")
      this.message = document.getElementById("confirmation-modal-message")
      this.description = document.getElementById("confirmation-modal-description")
      this.confirmBtn = document.getElementById("confirmation-modal-confirm")
      this.cancelBtn = document.getElementById("confirmation-modal-cancel")

      // Set up event listeners
      this.cancelBtn.addEventListener("click", () => {
        this.hide()
        this.callback = null
      })

      this.confirmBtn.addEventListener("click", () => {
        this.hide()
        if (this.callback) {
          this.callback()
        }
        this.callback = null
      })
    },

    show: function (title, message, description, callback, confirmText, confirmVariant) {
      // Handle empty title - hide title element if it exists, center content
      if (this.title) {
        if (title && title.trim() !== "") {
          this.title.textContent = title
          this.title.style.display = "block"
        } else {
          this.title.textContent = ""
          this.title.style.display = "none"
        }
      }
      this.message.innerHTML = message
      this.description.innerHTML = description || ""
      this.callback = callback
      // Customize confirm button
      if (confirmText) this.confirmBtn.textContent = confirmText
      // Reset possible variants
      this.confirmBtn.classList.remove('btn-danger')
      if (confirmVariant === 'danger') {
        this.confirmBtn.classList.add('btn-danger')
      }
      this.modal.style.display = "flex"
    },

    hide: function () {
      this.modal.style.display = "none"
    },
  }

  // Register the confirmation modal module
  window.NFTApp.registerModule("confirmationModal", confirmationModal)
})()

// Project Service Module
;(() => {
  const projectService = {
    // This is a duplicate implementation that's causing the double save dialog issue
    // The real implementation is in js/services/project-service.js
    // Just keep the init method as a placeholder to avoid breaking references
    init: function () {
      console.log("App.js projectService init - using implementation from project-service.js")
      // Removed the duplicate bindEvents to prevent double event listeners
    }
    
    // Removed all the duplicate methods (bindEvents, save, load, etc.)
    // The proper implementation is in js/services/project-service.js
  }

  // Register the project service module
  window.NFTApp.registerModule("projectService", projectService)
})()

// Add the Project Interface Module after the Project Service Module and before the Main application logic

// Project Interface Module
;(() => {
  const projectInterface = {
    init: () => {
      console.log("Initializing project interface module")
    },

    start: (projectData) => {
      console.log("Starting project interface for:", projectData.name)

      const appContainer = document.getElementById("app")

      // Create the navigation and content structure
      const appInterface = document.createElement("div")
      appInterface.className = "project-interface"

      appInterface.innerHTML = `
        <div class="nav-container">
          <div class="nav-header">
            <div class="nav-header-content">
              <div class="nav-title">NFT Collection Creator Pro</div>
              <div class="nav-byline">by AstroCrafts</div>
            </div>
          </div>
          <div class="nav-tabs-container">
            <div class="nav-tabs">
              <div class="nav-tab active" data-tab="general-info">
                Collection Info
              </div>
              <div class="nav-tab tooltip" data-tab="traits-rules">
                Traits & Rules
                <span class="tooltiptext">Manage traits and combination rules</span>
              </div>
              <div class="nav-tab tooltip" data-tab="generate-nfts">
                Generate NFTs
                <span class="tooltiptext">Create NFT images</span>
              </div>
              <div class="nav-tab tooltip" data-tab="export-nfts">
                <span class="tab-label">Export NFTs / Metadata</span>
                <span class="tooltiptext">Export your collection</span>
              </div>
              
            </div>
            
          </div>
        </div>
        
        <div class="content-area">
          <div id="general-info" class="tab-content active">
            <h2 class="section-title">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="16" x2="12" y2="12"></line>
                <line x1="12" y1="8" x2="12.01" y2="8"></line>
              </svg>
              General Information
            </h2>
            <p class="section-description">Configure your collection's basic information here.</p>
            
            <div class="form-container two-column-form">
              <div class="form-column">
                <div class="form-group">
                  <label for="collection-name">Collection Name <span class="required">*</span></label>
                  <input type="text" id="collection-name" class="form-control" placeholder="Choose the name for your NFT Collection" value="${projectData.name || ""}">
                </div>
                
                <div class="form-group">
                  <label for="collection-description">Collection Description <span class="required">*</span></label>
                  <textarea id="collection-description" class="form-control" rows="4" placeholder="Describe your NFT collection...">${projectData.description || ""}</textarea>
                </div>
                
                <div class="form-group">
                  <label for="default-nft-description">Default NFT Description <span class="optional">(Optional)</span></label>
                  <textarea id="default-nft-description" class="form-control" rows="3" placeholder="Default description for each NFT in your collection...">${projectData.defaultNftDescription || ""}</textarea>
                  <div class="form-help">This description will be used for all NFTs unless overridden individually.</div>
                </div>
              </div>
              
              <div class="form-column">
                <div class="form-group">
                  <label for="total-supply">Total Supply <span class="required">*</span></label>
                  <input type="text" id="total-supply" class="form-control" placeholder="10,000" value="${projectData.size || ""}">
                  <div class="form-help">The total number of NFTs to generate in your collection.</div>
                </div>
                
                <div class="form-group">
                  <label for="filename-prefix">Image/Metadata Filename Prefix <span class="optional">(Optional)</span></label>
                  <input type="text" id="filename-prefix" class="form-control" placeholder="NFT" value="${projectData.filenamePrefix || ""}">
                  <div class="form-help">Prefix for your image and metadata filenames (e.g., "NFT" will result in NFT #01.png, NFT #01.png, etc.)</div>
                </div>
              </div>
            </div>
          </div>
          
          <div id="traits-rules" class="tab-content">
            <!-- Traits & Rules content will be loaded by the trait layers module -->
            
            <div class="traits-section">
              <h3 class="subsection-title">Trait Layers</h3>
              <p class="subsection-description">Add and manage trait layers for your NFT collection.</p>
              
              <div class="trait-layers-actions">
                <div class="trait-layers-actions-left">
                  <input type="file" id="folder-input" webkitdirectory directory multiple class="file-input">
                  <div class="add-layer-container">
                    <input type="text" id="add-layer-input" class="add-layer-input" placeholder="Enter layer name">
                    <button id="add-layer-btn" class="app-action-btn tooltip">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                      </svg>
                      Add Layer
                      <span class="tooltiptext">Create a new empty layer</span>
                    </button>
                  </div>
                  <button id="add-folders-btn" class="add-folders-btn tooltip">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
                      <line x1="12" y1="11" x2="12" y2="17"></line>
                      <line x1="9" y1="14" x2="15" y2="14"></line>
                    </svg>
                    Add Folders
                    <span class="tooltiptext">Select folders to add as trait layers</span>
                  </button>
                </div>
                <div class="trait-layers-actions-right">
                  <button id="delete-all-layers" class="app-action-btn app-action-btn--danger tooltip" style="display: none;">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                      <polyline points="3 6 5 6 21 6"></polyline>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    Delete All Layers
                    <span class="tooltiptext">Remove all trait layers</span>
                  </button>
                </div>
              </div>
              
              <div id="trait-layers-dropzone" class="dropzone">
                <div class="dropzone-content">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  <p>Drag & drop folders here to add trait layers</p>
                  <div class="dropzone-help">Each folder will be added as a trait layer. The folder name will be used as the layer name, and image files inside the folder will be added as traits.</div>
                </div>
              </div>
              
              <div id="trait-layers-container" class="trait-layers-container">
                <!-- Trait layers will be added here dynamically -->
              </div>
              
              <div class="stacking-order-info tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="16" x2="12" y2="12"></line>
                  <line x1="12" y1="8" x2="12.01" y2="8"></line>
                </svg>
                <p>Trait Layers are stacked from bottom to top. The top layer in the list will appear on top of the NFT.</p>
                <span class="tooltiptext">Drag layers to reorder them</span>
              </div>
              
              <div class="divider"></div>
            </div>
            
            <div class="rules-section">
              <div class="subsection-header">
                <h3 class="subsection-title">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="16" x2="12" y2="12"></line>
                    <line x1="12" y1="8" x2="12.01" y2="8"></line>
                  </svg>
                  Combination Rules
                </h3>
                <p class="subsection-description">Set up rules for trait combinations to ensure certain traits always or never appear together.</p>
              </div>
              
              <button id="add-combination-rule" class="app-action-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              Add Combination Rule
              <span class="tooltiptext">Create a new trait combination rule</span>
            </button>
            
            <div id="combination-rules-container" class="combination-rules-container">
              <!-- Combination rules will be added here dynamically -->
            </div>
          </div>
          </div>
          
          <div id="generate-nfts" class="tab-content">
            <h2 class="section-title">Generate NFTs</h2>
            <p class="section-description">Generate your NFT collection based on your traits and rules.</p>
            <!-- Content will be added based on your instructions -->
          </div>
          
          <div id="export-nfts" class="tab-content">
            <h2 class="section-title">Export NFTs / Metadata</h2>
            <p class="section-description">Customize and Export Metadata and NFT Batches to be minted.</p>
            
            <!-- Content will be dynamically generated by export-nfts-module.js -->
          </div>
        </div>
        
        <!-- Confirmation Modal Template -->
        <div id="confirmation-modal" class="modal-overlay" style="display: none;">
          <div class="modal confirmation-modal">
            <button class="modal-close" id="confirmation-modal-close">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div class="modal-body">
              <div class="modal-icon">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              </div>
              <div id="confirmation-modal-message" class="modal-message">Are you sure you want to proceed?</div>
              <div id="confirmation-modal-description" class="modal-description">This action cannot be undone.</div>
            </div>
            <div class="modal-footer">
              <button class="btn btn-secondary" id="confirmation-modal-cancel">Cancel</button>
              <button class="btn btn-danger" id="confirmation-modal-confirm">Confirm</button>
            </div>
          </div>
        </div>
      `

      appContainer.innerHTML = ""
      appContainer.appendChild(appInterface)

      // Show the navigation and content area
      document.querySelector(".nav-container").style.display = "block"
      document.querySelector(".content-area").style.display = "block"

      // Set up navigation
      if (window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
        window.NFTApp.getModule("navigation").setupTabNavigation()
      } else {
        console.warn("Navigation module not found, tab navigation may not work properly")
      }

      // Set up confirmation modal
      if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
        window.NFTApp.getModule("confirmationModal").setup()
      } else {
        console.warn("Confirmation modal module not found, confirmations may not work properly")
      }

      // Store the project data in a global variable
      window.currentProject = projectData

      // Show the first tab by default
      if (window.NFTApp.getModule && window.NFTApp.getModule("navigation")) {
        window.NFTApp.getModule("navigation").showTab("general-info")
      }

      // Set up general info tab
      if (window.NFTApp.getModule && window.NFTApp.getModule("generalInfo")) {
        window.NFTApp.getModule("generalInfo").setupEventListeners(projectData)
      } else {
        console.warn("General info module not found, general info tab may not work properly")
      }

      // Add event listener for saving project
      document.getElementById("save-project").addEventListener("click", () => {
        if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
          window.NFTApp.getModule("projectService").save(projectData)
        } else {
          console.warn("Project service module not found, saving may not work properly")
        }
      })

      // Add event listener for new project button
      document.getElementById("new-project").addEventListener("click", () => {
        if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
          window.NFTApp.getModule("confirmationModal").show(
            "Start New Project",
            "Are you sure you want to start a new project?",
            "Any unsaved changes to the current project will be lost.",
            () => {
              window.NFTApp.getModule("projectService").startNew()
            },
          )
        } else {
          console.warn("Project service module not found, new project functionality may not work properly")
        }
      })

      // Add event listener for load project button
      document.getElementById("load-project-btn").addEventListener("click", () => {
        document.getElementById("load-project-input").click()
      })

      // Ensure file input accepts both old and new formats
      const loadProjectInput = document.getElementById("load-project-input")
      if (loadProjectInput) {
        loadProjectInput.accept = ".json,.json.gz,.gz"
      }

      // Add event listener for load project input
      document.getElementById("load-project-input").addEventListener("change", (event) => {
        if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
          window.NFTApp.getModule("projectService").load(event)
        } else {
          console.warn("Project service module not found, loading may not work properly")
        }
      })

      // Load trait layers module if it exists
      if (window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
        window.NFTApp.getModule("traitLayers").setup(projectData)
      } else {
        console.warn("Trait layers module not found, trait layers tab may not work properly")
      }

      // Load combination rules module if it exists
      if (window.NFTApp.getModule && window.NFTApp.getModule("combinationRules")) {
        window.NFTApp.getModule("combinationRules").setup(projectData)
      } else {
        console.warn("Combination rules module not found, combination rules tab may not work properly")
      }

      // Load generate NFTs module if it exists
      console.log("Attempting to load generateNfts module...")
      const generateNftsModule = window.NFTApp.getModule("generateNfts")
      if (generateNftsModule) {
        console.log("Found generateNfts module, setting up...")
        generateNftsModule.setup(projectData)
      } else {
        console.error("Generate NFTs module not found! Available modules:", Object.keys(window.NFTApp.modules))
      }
    },
  }

  // Register the project interface module
  window.NFTApp.registerModule("projectInterface", projectInterface)
})()

// Add the General Info Module after the Project Interface Module and before the Main application logic

// General Info Module
;(() => {
  const generalInfo = {
    init: () => {
      console.log("Initializing general info module")
    },

    setupEventListeners: (projectData) => {
      console.log("Setting up general info event listeners")

      // Collection Name
      const collectionNameInput = document.getElementById("collection-name")
      if (collectionNameInput) {
        collectionNameInput.value = projectData.name || ""
        collectionNameInput.addEventListener("input", (e) => {
          projectData.name = e.target.value
        })
      }

      // Collection Description
      const collectionDescriptionInput = document.getElementById("collection-description")
      if (collectionDescriptionInput) {
        collectionDescriptionInput.value = projectData.description || ""
        collectionDescriptionInput.addEventListener("input", (e) => {
          projectData.description = e.target.value
        })
      }

      // Default NFT Description
      const defaultNftDescriptionInput = document.getElementById("default-nft-description")
      if (defaultNftDescriptionInput) {
        defaultNftDescriptionInput.value = projectData.defaultNftDescription || ""
        defaultNftDescriptionInput.addEventListener("input", (e) => {
          projectData.defaultNftDescription = e.target.value
        })
      }

      // Total Supply
      const totalSupplyInput = document.getElementById("total-supply")
      if (totalSupplyInput) {
        // Format initial value if it exists
        if (projectData.size && !isNaN(projectData.size)) {
          const num = Number(projectData.size)
          try {
            const formatted = num.toLocaleString('en-US')
            // Check if it actually used commas (not spaces)
            if (formatted.includes(',')) {
              totalSupplyInput.value = formatted
            } else {
              // If it used spaces, use dots instead
              totalSupplyInput.value = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
            }
          } catch (e) {
            totalSupplyInput.value = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
          }
        } else {
          totalSupplyInput.value = (projectData.size && projectData.size > 0) ? projectData.size : ""
        }
        
        // Smart input formatting
        totalSupplyInput.addEventListener('focus', function() {
          var rawValue = this.value.replace(/[,.]/g, '') // Remove commas and dots
          if (!isNaN(rawValue) && rawValue !== '') {
            this.value = rawValue
          }
        })
        
        totalSupplyInput.addEventListener('blur', function() {
          var rawValue = this.value.replace(/[,.]/g, '') // Remove any existing commas or dots
          if (!isNaN(rawValue) && rawValue !== '') {
            var numValue = parseInt(rawValue)
            if (numValue > 0) {
              try {
                const formatted = numValue.toLocaleString('en-US')
                // Check if it actually used commas (not spaces)
                if (formatted.includes(',')) {
                  this.value = formatted
                } else {
                  // If it used spaces, use dots instead
                  this.value = numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')
                }
              } catch (e) {
                // Fallback: manual comma formatting
                this.value = numValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
              }
            } else {
              this.value = ''
            }
          } else {
            this.value = ''
          }
        })
        
        totalSupplyInput.addEventListener("input", (e) => {
          // Remove all non-numeric characters
          e.target.value = e.target.value.replace(/[^0-9]/g, '')
          projectData.size = Number.parseInt(e.target.value) || 0
        })
        
        // Prevent non-numeric keys
        totalSupplyInput.addEventListener('keydown', function(e) {
          if ([8, 9, 27, 13, 46, 35, 36, 37, 38, 39, 40].indexOf(e.keyCode) !== -1 ||
              (e.keyCode === 65 && e.ctrlKey === true) ||
              (e.keyCode === 67 && e.ctrlKey === true) ||
              (e.keyCode === 86 && e.ctrlKey === true) ||
              (e.keyCode === 88 && e.ctrlKey === true)) {
            return
          }
          if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
            e.preventDefault()
          }
        })
      }

      // Filename Prefix
      const filenamePrefixInput = document.getElementById("filename-prefix")
      if (filenamePrefixInput) {
        filenamePrefixInput.value = projectData.filenamePrefix || ""
        filenamePrefixInput.addEventListener("input", (e) => {
          projectData.filenamePrefix = e.target.value
        })
      }
    },
  }

  // Register the general info module
  window.NFTApp.registerModule("generalInfo", generalInfo)
})()

// Add the Trait Layers Module after the General Info Module and before the Main application logic

// Trait Layers Module
;(() => {
  const traitLayers = {
    init: () => {
      console.log("Initializing trait layers module")
    },

    setup: function (projectData) {
      console.log("Setting up trait layers")

      // Initialize trait layers array if it doesn't exist
      if (!projectData.traits) {
        projectData.traits = []
      }

      // Set up event listeners
      this.setupEventListeners(projectData)

      // Render existing trait layers
      this.renderTraitLayers(projectData)
    },

    setupEventListeners: function (projectData) {
      console.log("Setting up trait layers event listeners")

      // Add Layer button
      const addLayerBtn = document.getElementById("add-layer-btn")
      if (addLayerBtn) {
        addLayerBtn.addEventListener("click", () => {
          const layerNameInput = document.getElementById("add-layer-input")
          const layerName = layerNameInput ? layerNameInput.value.trim() : ""

          this.addEmptyLayer(projectData, layerName)
        })
      }

      // Add Folders button
      const addFoldersBtn = document.getElementById("add-folders-btn")
      if (addFoldersBtn) {
        addFoldersBtn.addEventListener("click", () => {
          const folderInput = document.getElementById("folder-input")
          if (folderInput) {
            folderInput.click()
          }
        })
      }

      // Folder input
      const folderInput = document.getElementById("folder-input")
      if (folderInput) {
        folderInput.addEventListener("change", (event) => {
          this.handleFolderSelection(event, projectData)
        })
      }

      // Delete All Layers button
      const deleteAllLayersBtn = document.getElementById("delete-all-layers")
      if (deleteAllLayersBtn) {
        deleteAllLayersBtn.addEventListener("click", () => {
          if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
            window.NFTApp.getModule("confirmationModal").show(
              "", // Remove title - message will be centered
              '<div style="color: #ffffff; font-size: 18px; font-weight: 500; text-align: center;">Are you sure you want to delete all trait layers?</div>',
              '<div style="color: #ff4444; font-size: 12px; text-align: center;">This action cannot be undone and will remove<br>all trait layers and their traits from this project.</div>',
              () => {
                this.deleteAllLayers(projectData)
              },
            )
          } else {
            if (confirm("Are you sure you want to delete all trait layers? This action cannot be undone.")) {
              this.deleteAllLayers(projectData)
            }
          }
        })
      }

      // Set up dropzone
      this.setupDropzone(projectData)
    },

    setupDropzone: function (projectData) {
      console.log("Setting up trait layers dropzone")

      const dropzone = document.getElementById("trait-layers-dropzone")
      if (!dropzone) {
        console.warn("Trait layers dropzone not found")
        return
      }

      // Prevent default drag behaviors
      dropzone.addEventListener(
        "dragenter",
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          dropzone.classList.add("dragover")
        },
        false,
      )

      dropzone.addEventListener(
        "dragover",
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          dropzone.classList.add("dragover")
        },
        false,
      )

      dropzone.addEventListener(
        "dragleave",
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          dropzone.classList.remove("dragover")
        },
        false,
      )

      dropzone.addEventListener(
        "drop",
        (e) => {
          e.preventDefault()
          e.stopPropagation()
          dropzone.classList.remove("dragover")

          const items = e.dataTransfer.items
          if (items) {
            // Use DataTransferItemList interface to access the files
            for (let i = 0; i < items.length; i++) {
              const item = items[i]
              if (item.kind === "file" && item.webkitGetAsEntry().isDirectory) {
                console.log("Directory dropped:", item.webkitGetAsEntry().name)
                // Process the directory (this is a placeholder - actual implementation would be more complex)
                this.addEmptyLayer(projectData, item.webkitGetAsEntry().name)
              }
            }
          }
        },
        false,
      )
    },

    renderTraitLayers: function (projectData) {
      console.log("Rendering trait layers")

      const container = document.getElementById("trait-layers-container")
      if (!container) {
        console.warn("Trait layers container not found")
        return
      }

      // Clear container
      container.innerHTML = ""

      // Show/hide delete all layers button
      const deleteAllLayersBtn = document.getElementById("delete-all-layers")
      if (deleteAllLayersBtn) {
        deleteAllLayersBtn.style.display = projectData.traits.length > 0 ? "flex" : "none"
      }

      // If no layers, show empty state
      if (projectData.traits.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            <p>No trait layers added yet</p>
            <p class="empty-state-help">Add trait layers by clicking the "Add Layer" button or by dragging and dropping folders.</p>
          </div>
        `
        return
      }

      // Render each trait layer
      projectData.traits.forEach((layer, index) => {
        const layerElement = document.createElement("div")
        layerElement.className = "trait-layer"
        layerElement.setAttribute("data-layer-id", layer.id)

        layerElement.innerHTML = `
          <div class="trait-layer-header">
            <div class="trait-layer-name">
              <span class="layer-name">${layer.name}</span>
              <input type="text" class="edit-layer-name" value="${layer.name}" style="display: none;">
            </div>
            <div class="trait-layer-actions">
              <button class="btn btn-icon btn-sm edit-layer-name-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span class="tooltiptext">Rename layer</span>
              </button>
              <button class="btn btn-icon btn-sm delete-layer-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span class="tooltiptext">Delete layer</span>
              </button>
            </div>
          </div>
          <div class="trait-layer-content">
            <div class="trait-layer-info">
              <div class="trait-count">${layer.traits ? layer.traits.length : 0} traits</div>
              <button class="btn btn-sm btn-secondary add-trait-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
                Add Trait
                <span class="tooltiptext">Add a new trait to this layer</span>
              </button>
            </div>
            <div class="traits-container">
              ${
                layer.traits && layer.traits.length > 0
                  ? layer.traits
                      .map(
                        (trait) => `
                  <div class="trait-item" data-trait-id="${trait.id}">
                    <div class="trait-preview">
                      ${
                        trait.image
                          ? `<img src="${trait.image}" alt="${trait.name}">`
                          : `<div class="no-preview">No Preview</div>`
                      }
                    </div>
                    <div class="trait-details">
                      <div class="trait-name">${trait.name}</div>
                      <div class="trait-rarity">${trait.rarity || 100}%</div>
                    </div>
                    <div class="trait-actions">
                      <button class="btn btn-icon btn-xs edit-trait-btn tooltip">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                        <span class="tooltiptext">Edit trait</span>
                      </button>
                      <button class="btn btn-icon btn-xs delete-trait-btn tooltip">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="12" height="12">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                        <span class="tooltiptext">Delete trait</span>
                      </button>
                    </div>
                  </div>
                `,
                      )
                      .join("")
                  : `<div class="empty-traits">
                  <p>No traits added to this layer yet</p>
                  <p class="empty-traits-help">Click "Add Trait" to add traits to this layer</p>
                </div>`
              }
            </div>
          </div>
        `

        container.appendChild(layerElement)

        // Add event listeners for layer actions
        this.setupLayerEventListeners(layerElement, layer, projectData)
      })
    },

    setupLayerEventListeners: function (layerElement, layer, projectData) {
      // Edit layer name
      const editLayerNameBtn = layerElement.querySelector(".edit-layer-name-btn")
      const layerNameSpan = layerElement.querySelector(".layer-name")
      const editLayerNameInput = layerElement.querySelector(".edit-layer-name")

      if (editLayerNameBtn && layerNameSpan && editLayerNameInput) {
        editLayerNameBtn.addEventListener("click", () => {
          layerNameSpan.style.display = "none"
          editLayerNameInput.style.display = "block"
          editLayerNameInput.focus()
          editLayerNameInput.select()
        })

        editLayerNameInput.addEventListener("blur", () => {
          const newName = editLayerNameInput.value.trim()
          if (newName) {
            layer.name = newName
            layerNameSpan.textContent = newName
          }

          layerNameSpan.style.display = "block"
          editLayerNameInput.style.display = "none"
        })

        editLayerNameInput.addEventListener("keydown", (e) => {
          if (e.key === "Enter") {
            editLayerNameInput.blur()
          } else if (e.key === "Escape") {
            editLayerNameInput.value = layer.name
            editLayerNameInput.blur()
          }
        })
      }

      // Delete layer
      const deleteLayerBtn = layerElement.querySelector(".delete-layer-btn")
      if (deleteLayerBtn) {
        deleteLayerBtn.addEventListener("click", () => {
          if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
            window.NFTApp.getModule("confirmationModal").show(
              "Delete Layer",
              `Are you sure you want to delete the "${layer.name}" layer?`,
              "This action cannot be undone.",
              () => {
                this.deleteLayer(projectData, layer.id)
              },
            )
          } else {
            if (confirm(`Are you sure you want to delete the "${layer.name}" layer? This action cannot be undone.`)) {
              this.deleteLayer(projectData, layer.id)
            }
          }
        })
      }

      // Add trait
      const addTraitBtn = layerElement.querySelector(".add-trait-btn")
      if (addTraitBtn) {
        addTraitBtn.addEventListener("click", () => {
          this.addTrait(projectData, layer.id)
        })
      }

      // Edit trait
      const editTraitBtns = layerElement.querySelectorAll(".edit-trait-btn")
      editTraitBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const traitElement = btn.closest(".trait-item")
          const traitId = traitElement.getAttribute("data-trait-id")
          this.editTrait(projectData, layer.id, traitId)
        })
      })

      // Delete trait
      const deleteTraitBtns = layerElement.querySelectorAll(".delete-trait-btn")
      deleteTraitBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
          const traitElement = btn.closest(".trait-item")
          const traitId = traitElement.getAttribute("data-trait-id")
          const trait = layer.traits.find((t) => t.id === traitId)

          if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
            window.NFTApp.getModule("confirmationModal").show(
              "Delete Trait",
              `Are you sure you want to delete the "${trait.name}" trait?`,
              "This action cannot be undone.",
              () => {
                this.deleteTrait(projectData, layer.id, traitId)
              },
            )
          } else {
            if (confirm(`Are you sure you want to delete the "${trait.name}" trait? This action cannot be undone.`)) {
              this.deleteTrait(projectData, layer.id, traitId)
            }
          }
        })
      })
    },

    addEmptyLayer: function (projectData, layerName) {
      console.log("Adding empty layer:", layerName)

      if (!layerName) {
        if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Please enter a layer name", "error")
        } else {
          alert("Please enter a layer name")
        }
        return
      }

      // Create new layer
      const newLayer = {
        id: Date.now().toString(),
        name: layerName,
        traits: [],
      }

      // Add to project data
      projectData.traits.push(newLayer)

      // Clear input
      const layerNameInput = document.getElementById("add-layer-input")
      if (layerNameInput) {
        layerNameInput.value = ""
      }

      // Re-render trait layers
      this.renderTraitLayers(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Layer "${layerName}" added successfully`, "success")
      }
    },

    deleteLayer: function (projectData, layerId) {
      console.log("Deleting layer:", layerId)

      // Find layer index
      const layerIndex = projectData.traits.findIndex((layer) => layer.id === layerId)
      if (layerIndex === -1) {
        console.warn("Layer not found:", layerId)
        return
      }

      // Get layer name for notification
      const layerName = projectData.traits[layerIndex].name

      // Remove from project data
      projectData.traits.splice(layerIndex, 1)

      // Re-render trait layers
      this.renderTraitLayers(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Layer "${layerName}" deleted successfully`, "success")
      }
    },

    deleteAllLayers: function (projectData) {
      console.log("Deleting all layers")

      // Clear traits array
      projectData.traits = []

      // Re-render trait layers
      this.renderTraitLayers(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("All layers deleted successfully", "success")
      }
    },

    addTrait: function (projectData, layerId) {
      console.log("Adding trait to layer:", layerId)

      // Find layer
      const layer = projectData.traits.find((layer) => layer.id === layerId)
      if (!layer) {
        console.warn("Layer not found:", layerId)
        return
      }

      // Create new trait
      const newTrait = {
        id: Date.now().toString(),
        name: "New Trait",
        rarity: 100,
      }

      // Initialize traits array if it doesn't exist
      if (!layer.traits) {
        layer.traits = []
      }

      // Add to layer
      layer.traits.push(newTrait)

      // Re-render trait layers
      this.renderTraitLayers(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Trait added to "${layer.name}" layer`, "success")
      }
    },

    editTrait: (projectData, layerId, traitId) => {
      console.log("Editing trait:", traitId, "in layer:", layerId)

      // Find layer
      const layer = projectData.traits.find((layer) => layer.id === layerId)
      if (!layer) {
        console.warn("Layer not found:", layerId)
        return
      }

      // Find trait
      const trait = layer.traits.find((trait) => trait.id === traitId)
      if (!trait) {
        console.warn("Trait not found:", traitId)
        return
      }

      // For now, just show an alert (in a real implementation, this would open a modal)
      alert(`Editing trait "${trait.name}" in layer "${layer.name}" (not implemented yet)`)
    },

    deleteTrait: function (projectData, layerId, traitId) {
      console.log("Deleting trait:", traitId, "from layer:", layerId)

      // Find layer
      const layer = projectData.traits.find((layer) => layer.id === layerId)
      if (!layer) {
        console.warn("Layer not found:", layerId)
        return
      }

      // Find trait index
      const traitIndex = layer.traits.findIndex((trait) => trait.id === traitId)
      if (traitIndex === -1) {
        console.warn("Trait not found:", traitId)
        return
      }

      // Get trait name for notification
      const traitName = layer.traits[traitIndex].name

      // Remove from layer
      layer.traits.splice(traitIndex, 1)

      // Re-render trait layers
      this.renderTraitLayers(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Trait "${traitName}" deleted successfully`, "success")
      }
    },

    handleFolderSelection: function (event, projectData) {
      console.log("Handling folder selection")

      const files = event.target.files
      if (!files || files.length === 0) {
        console.warn("No files selected")
        return
      }

      // Process files (this is a placeholder - actual implementation would be more complex)
      // In a real implementation, this would group files by directory and create layers

      // For now, just create a layer for each directory
      const directories = new Set()
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const path = file.webkitRelativePath
        const parts = path.split("/")

        if (parts.length > 1) {
          directories.add(parts[0])
        }
      }

      // Add a layer for each directory
      directories.forEach((dir) => {
        this.addEmptyLayer(projectData, dir)
      })

      // Clear input
      event.target.value = ""
    },
  }

  // Register the trait layers module
  window.NFTApp.registerModule("traitLayers", traitLayers)
})()

// Add the Combination Rules Module after the Trait Layers Module and before the Main application logic

/*
// Combination Rules Module
;(() => {
  const combinationRules = {
    init: () => {
      console.log("Initializing combination rules module")
    },

    setup: function (projectData) {
      console.log("Setting up combination rules")

      // Initialize rules array if it doesn't exist
      if (!projectData.rules) {
        projectData.rules = []
      }

      // Set up event listeners
      this.setupEventListeners(projectData)

      // Render existing rules
      this.renderRules(projectData)
    },

    setupEventListeners: function (projectData) {
      console.log("Setting up combination rules event listeners")

      // Add Combination Rule button
      const addRuleBtn = document.getElementById("add-combination-rule")
      if (addRuleBtn) {
        addRuleBtn.addEventListener("click", () => {
          this.addRule(projectData)
        })
      }
    },

    renderRules: function (projectData) {
      console.log("Rendering combination rules")

      const container = document.getElementById("combination-rules-container")
      if (!container) {
        console.warn("Combination rules container not found")
        return
      }

      // Clear container
      container.innerHTML = ""

      // If no rules, show empty state
      if (projectData.rules.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
              <line x1="12" y1="9" x2="12" y2="13"></line>
              <line x1="12" y1="17" x2="12.01" y2="17"></line>
            </svg>
            <p>No combination rules added yet</p>
            <p class="empty-state-help">Add rules to control which traits can or cannot appear together.</p>
          </div>
        `
        return
      }

      // Render each rule
      projectData.rules.forEach((rule, index) => {
        const ruleElement = document.createElement("div")
        ruleElement.className = "combination-rule"
        ruleElement.setAttribute("data-rule-id", rule.id)

        ruleElement.innerHTML = `
          <div class="combination-rule-header">
            <div class="combination-rule-name">
              <span class="rule-name">Rule #${index + 1}: ${rule.name || "Unnamed Rule"}</span>
            </div>
            <div class="combination-rule-actions">
              <button class="btn btn-icon btn-sm edit-rule-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                <span class="tooltiptext">Edit rule</span>
              </button>
              <button class="btn btn-icon btn-sm delete-rule-btn tooltip">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
                <span class="tooltiptext">Delete rule</span>
              </button>
            </div>
          </div>
          <div class="combination-rule-content">
            <div class="rule-type">
              <span class="rule-type-label">Rule Type:</span>
              <span class="rule-type-value">${rule.type === "include" ? "Must Include" : "Must Exclude"}</span>
            </div>
            <div class="rule-conditions">
              <div class="rule-condition">
                <span class="rule-condition-label">If trait:</span>
                <span class="rule-condition-value">${rule.ifTrait ? rule.ifTrait.name : "Any"}</span>
                <span class="rule-condition-layer">${rule.ifTrait ? `(${rule.ifTrait.layer})` : ""}</span>
              </div>
              <div class="rule-condition">
                <span class="rule-condition-label">Then ${rule.type === "include" ? "include" : "exclude"} trait:</span>
                <span class="rule-condition-value">${rule.thenTrait ? rule.thenTrait.name : "Any"}</span>
                <span class="rule-condition-layer">${rule.thenTrait ? `(${rule.thenTrait.layer})` : ""}</span>
              </div>
            </div>
          </div>
        `

        container.appendChild(ruleElement)

        // Add event listeners for rule actions
        this.setupRuleEventListeners(ruleElement, rule, projectData)
      })
    },

    setupRuleEventListeners: function (ruleElement, rule, projectData) {
      // Edit rule
      const editRuleBtn = ruleElement.querySelector(".edit-rule-btn")
      if (editRuleBtn) {
        editRuleBtn.addEventListener("click", () => {
          this.editRule(projectData, rule.id)
        })
      }

      // Delete rule
      const deleteRuleBtn = ruleElement.querySelector(".delete-rule-btn")
      if (deleteRuleBtn) {
        deleteRuleBtn.addEventListener("click", () => {
          if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
            window.NFTApp.getModule("confirmationModal").show(
              "Delete Rule",
              `Are you sure you want to delete this rule?`,
              "This action cannot be undone.",
              () => {
                this.deleteRule(projectData, rule.id)
              },
            )
          } else {
            if (confirm(`Are you sure you want to delete this rule? This action cannot be undone.`)) {
              this.deleteRule(projectData, rule.id)
            }
          }
        })
      }
    },

    addRule: function (projectData) {
      console.log("Adding new combination rule")

      // Create new rule
      const newRule = {
        id: Date.now().toString(),
        name: "New Rule",
        type: "include", // or "exclude"
        ifTrait: null,
        thenTrait: null,
      }

      // Add to project data
      projectData.rules.push(newRule)

      // Re-render rules
      this.renderRules(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("New rule added successfully", "success")
      }

      // Edit the new rule
      this.editRule(projectData, newRule.id)
    },

    editRule: (projectData, ruleId) => {
      console.log("Editing rule:", ruleId)

      // Find rule
      const rule = projectData.rules.find((rule) => rule.id === ruleId)
      if (!rule) {
        console.warn("Rule not found:", ruleId)
        return
      }

      // For now, just show an alert (in a real implementation, this would open a modal)
      alert(`Editing rule "${rule.name}" (not implemented yet)`)
    },

    deleteRule: function (projectData, ruleId) {
      console.log("Deleting rule:", ruleId)

      // Find rule index
      const ruleIndex = projectData.rules.findIndex((rule) => rule.id === ruleId)
      if (ruleIndex === -1) {
        console.warn("Rule not found:", ruleId)
        return
      }

      // Remove from project data
      projectData.rules.splice(ruleIndex, 1)

      // Re-render rules
      this.renderRules(projectData)

      // Show notification
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Rule deleted successfully", "success")
      }
    },
  }

  // Register the combination rules module
  window.NFTApp.registerModule("combinationRules", combinationRules)
})()
*/
// Main application logic
document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM content loaded, initializing app...")

  // Check if NFTApp is properly initialized
  if (!window.isNFTAppReady()) {
    console.error("NFTApp is not properly initialized. Attempting to fix...")
    // The module system should already be initialized at the top of this file
  }

  // Initialize all modules
  window.NFTApp.initModules()

  // Hide loading screen if it exists
  const loadingScreen = document.querySelector(".loading-screen")
  if (loadingScreen) {
    loadingScreen.style.display = "none"
  }

  // Start with a new project
  if (window.NFTApp.getModule && window.NFTApp.getModule("projectService")) {
    console.log("Starting new project...")
    window.NFTApp.getModule("projectService").startNew()
  } else {
    console.error("Project service module not found")
  }

  // Add direct event listeners for trait layers functionality
  const addLayerBtn = document.getElementById("add-layer-btn")
  if (addLayerBtn) {
    addLayerBtn.addEventListener("click", () => {
      console.log("Add Layer button clicked (direct handler)")
      const layerNameInput = document.getElementById("add-layer-input")
      const layerName = layerNameInput ? layerNameInput.value.trim() : ""

      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
        window.NFTApp.getModule("traitLayers").addEmptyLayer(window.currentProject, layerName)
      } else {
        console.error("traitLayers module not found for adding layer")
      }
    })
  }

  const addFoldersBtn = document.getElementById("add-folders-btn")
  if (addFoldersBtn) {
    addFoldersBtn.addEventListener("click", () => {
      console.log("Add Folders button clicked (direct handler)")
      const folderInput = document.getElementById("folder-input")
      if (folderInput) {
        folderInput.click()
      } else {
        console.error("Folder input element not found")
      }
    })
  }

  // Add event listener for folder input
  const folderInput = document.getElementById("folder-input")
  if (folderInput) {
    folderInput.addEventListener("change", (event) => {
      console.log("Folder input changed (direct handler)", event.target.files)
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
        window.NFTApp.getModule("traitLayers").handleFolderSelection(event, window.currentProject)
      } else {
        console.error("traitLayers module not found for handling folder selection")
      }
    })
  }
})

// Initialize modules
NFTApp.getModule("projectInterface").init()
NFTApp.getModule("generalInfo").init()
NFTApp.getModule("traitLayers").init()
// NFTApp.getModule("combinationRules").init()

console.log('[DEBUG] At end of app.js: typeof window.NFTApp.registerModule =', typeof window.NFTApp && window.NFTApp.registerModule, window.NFTApp && window.NFTApp.registerModule);
