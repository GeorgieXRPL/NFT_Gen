/**
 * Syntax Error Fix - Handles syntax errors in JavaScript files
 */
;(() => {
  console.log("Initializing syntax error fix...")

  // Robustly define NFTApp and its methods if missing
  window.NFTApp = window.NFTApp || {};
  window.NFTApp.modules = window.NFTApp.modules || {};
  window.NFTApp.registerModule = window.NFTApp.registerModule || function (name, module) {
    console.log(`Registering module: ${name}`)
    this.modules[name] = module
    return module
  };
  window.NFTApp.getModule = window.NFTApp.getModule || function (moduleName) {
    const module = this.modules[moduleName]
    if (!module) {
      console.warn(`Module '${moduleName}' not found`)
    }
    return module
  };
  window.NFTApp.initModules = window.NFTApp.initModules || function () {
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
  };

  // Function to check if a module is properly loaded
  function checkModuleLoaded(moduleName, fallbackFn) {
    if (typeof NFTApp === "undefined" || !NFTApp.getModule || !NFTApp.getModule(moduleName)) {
      console.log(`Module ${moduleName} not loaded properly, applying fallback...`)
      if (typeof fallbackFn === "function") {
        fallbackFn()
      }
      return false
    }
    return true
  }

  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", () => {
    // Check for trait layers module specifically
    setTimeout(() => {
      checkModuleLoaded("traitLayers", () => {
        console.log("Loading trait-layers-fix.js as fallback")

        // Add direct event listeners for buttons
        const addLayerBtn = document.getElementById("add-layer-btn")
        if (addLayerBtn) {
          addLayerBtn.addEventListener("click", () => {
            console.log("Add Layer button clicked (fallback handler)")
            const layerNameInput = document.getElementById("add-layer-input")
            const layerName = layerNameInput ? layerNameInput.value.trim() : ""

            if (window.currentProject) {
              // Simple fallback implementation
              if (!window.currentProject.traits) {
                window.currentProject.traits = []
              }

              window.currentProject.traits.push({
                id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
                name: layerName || "New Layer",
                traits: [],
                order: window.currentProject.traits.length,
                rarity: 100,
              })

              // Show notification
              if (typeof NFTApp !== "undefined" && NFTApp.getModule && NFTApp.getModule("notificationService")) {
                NFTApp.getModule("notificationService").show(`Layer "${layerName}" created`, "success")
              } else {
                console.log(`Layer "${layerName}" created`)
              }
            }
          })
        }

        const addFoldersBtn = document.getElementById("add-folders-btn")
        if (addFoldersBtn) {
          addFoldersBtn.addEventListener("click", () => {
            console.log("Add Folders button clicked (fallback handler)")
            const folderInput = document.getElementById("folder-input")
            if (folderInput) {
              folderInput.click()
            } else {
              console.error("Folder input element not found")
            }
          })
        }
      })
    }, 1000)
  })
})()
