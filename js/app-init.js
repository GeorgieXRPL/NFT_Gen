// This file ensures the app initializes correctly when the start button is clicked

// Define the global app object if it doesn't exist
window.app = window.app || {}

// Define the initApp function that will be called when the start button is clicked
function initApp() {
  console.log("App initialization started...")

  // Initialize all modules
  initializeModules()

  // Declare the variables for the modules
  let NavigationModule
  let GeneralInfoModule
  let TraitLayersModule
  let CombinationRulesModule
  let ProjectInterfaceModule
  let KeyboardShortcutsModule
  let TooltipModule

  // Set up the navigation
  if (typeof NavigationModule !== "undefined" && typeof NavigationModule.init === "function") {
    NavigationModule.init()
  }

  // Initialize the general info module
  if (typeof GeneralInfoModule !== "undefined" && typeof GeneralInfoModule.init === "function") {
    GeneralInfoModule.init()
  }

  // Initialize the trait layers module
  if (typeof TraitLayersModule !== "undefined" && typeof TraitLayersModule.init === "function") {
    TraitLayersModule.init()
  }

  // Initialize the combination rules module
  if (typeof CombinationRulesModule !== "undefined" && typeof CombinationRulesModule.init === "function") {
    CombinationRulesModule.init()
  }

  // Initialize the project interface
  if (typeof ProjectInterfaceModule !== "undefined" && typeof ProjectInterfaceModule.init === "function") {
    ProjectInterfaceModule.init()
  }

  // Initialize keyboard shortcuts
  if (typeof KeyboardShortcutsModule !== "undefined" && typeof KeyboardShortcutsModule.init === "function") {
    KeyboardShortcutsModule.init()
  }

  // Initialize tooltips
  if (typeof TooltipModule !== "undefined" && typeof TooltipModule.init === "function") {
    TooltipModule.init()
  }

  console.log("App initialization completed!")
}

// Function to initialize all modules
function initializeModules() {
  console.log("Initializing modules...")

  // Get all modules
  const modules = window.AppModules || []

  // Initialize each module
  modules.forEach((module) => {
    if (module && typeof module.init === "function") {
      try {
        console.log(`Initializing module: ${module.name || "Unknown"}`)
        module.init()
      } catch (error) {
        console.error(`Error initializing module ${module.name || "Unknown"}:`, error)
      }
    }
  })
}

// Make the initApp function globally available
window.initApp = initApp

// Also add it to the app object
window.app.init = initApp

console.log("App initialization script loaded!")
