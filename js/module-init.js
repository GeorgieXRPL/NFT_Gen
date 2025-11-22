// Module Initialization
;(() => {
  // Function to load a JavaScript file
  function loadScript(src, callback) {
    const script = document.createElement("script")
    script.src = src
    script.onload = callback
    document.head.appendChild(script)
  }

  // Function to load a CSS file
  function loadCSS(href) {
    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = href
    document.head.appendChild(link)
  }

  // This script ensures all modules are properly initialized
  console.log("Module initialization started")

  // Robustly define NFTApp and its methods if missing
  window.NFTApp = window.NFTApp || {};
  window.NFTApp.modules = window.NFTApp.modules || {};
  window.NFTApp.registerModule = window.NFTApp.registerModule || function (name, module) {
    console.log(`Registering module: ${name}`)
    this.modules[name] = module
    return module
  };
  window.NFTApp.getModule = window.NFTApp.getModule || function (name, suppressWarning) {
    const module = this.modules[name]
    if (!module && !suppressWarning) {
      // Only warn if suppressWarning is not true (allows optional chaining to work silently)
      // Suppress warnings for modules that may not be loaded yet during initialization
      const modulesThatMayNotExistYet = ['generateNftsUI', 'generateNfts', 'combinationRules', 'traitsRulesLayoutFix'];
      if (!modulesThatMayNotExistYet.includes(name)) {
        console.warn(`Module '${name}' not found`)
      }
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

  // Initialize modules if they haven't been initialized yet
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM loaded, checking if modules need initialization")

    if (typeof window.NFTApp !== "undefined" && typeof window.NFTApp.initModules === "function") {
      // Check if modules have already been initialized
      let modulesInitialized = false
      for (const moduleName in window.NFTApp.modules) {
        if (window.NFTApp.modules[moduleName] && window.NFTApp.modules[moduleName].initialized) {
          modulesInitialized = true
          break
        }
      }

      if (!modulesInitialized) {
        console.log("Initializing modules from module-init.js")
        window.NFTApp.initModules()

        // Mark modules as initialized
        for (const moduleName in window.NFTApp.modules) {
          if (window.NFTApp.modules[moduleName]) {
            window.NFTApp.modules[moduleName].initialized = true
          }
        }
      } else {
        console.log("Modules already initialized, skipping")
      }
    } else {
      console.error("NFTApp or initModules function not found in module-init.js")
    }
  })

  console.log("Module initialization script loaded")
})()
