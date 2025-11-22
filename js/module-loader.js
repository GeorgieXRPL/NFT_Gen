// Module Loader
// This script ensures that the NFTApp object is properly initialized
// before any modules try to register themselves

console.log("Module loader started")

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

// Add a global function to check if NFTApp is ready
window.isNFTAppReady = () =>
  typeof window.NFTApp !== "undefined" &&
  typeof window.NFTApp.registerModule === "function" &&
  typeof window.NFTApp.getModule === "function"

console.log("Module loader completed. NFTApp ready:", window.isNFTAppReady())
