// Layer Rename Rule Updater
// This module updates combination rules when a layer is renamed

// Declare NFTApp if it's not already declared
if (typeof NFTApp === "undefined") {
  NFTApp = {}
}

NFTApp.layerRenameRuleUpdater = {
  // Update all rules that reference a layer when it's renamed
  updateRulesOnLayerRename: (projectData, layerId, newLayerName) => {
    if (!projectData.rules || projectData.rules.length === 0) {
      return // No rules to update
    }

    // Loop through all rules and update any references to the renamed layer
    projectData.rules.forEach((rule) => {
      // Update between-layers rules
      if (rule.appliesTo === "between-layers") {
        if (rule.firstLayerId === layerId) {
          rule.firstLayerName = newLayerName
        }
        if (rule.secondLayerId === layerId) {
          rule.secondLayerName = newLayerName
        }
      }

      // Update between-traits rules
      else if (rule.appliesTo === "between-traits") {
        // Update first traits layer name if needed
        if (rule.firstTraits && rule.firstTraits.length > 0 && rule.firstTraits[0].layerId === layerId) {
          rule.firstTraits.forEach((trait) => {
            trait.layerName = newLayerName
          })
        }

        // Update second traits layer name if needed
        if (rule.secondTraits && rule.secondTraits.length > 0 && rule.secondTraits[0].layerId === layerId) {
          rule.secondTraits.forEach((trait) => {
            trait.layerName = newLayerName
          })
        }
      }

      // Update layer-to-traits or traits-to-layer rules
      else if (rule.appliesTo === "layer-to-traits" || rule.appliesTo === "traits-to-layer") {
        // Update layer name if needed
        if (rule.layerId === layerId) {
          rule.layerName = newLayerName
        }

        // Update traits layer name if needed
        if (rule.traits && rule.traits.length > 0 && rule.traits[0].layerId === layerId) {
          rule.traits.forEach((trait) => {
            trait.layerName = newLayerName
          })
        }
      }
    })

    // Update the UI to reflect the changes
    if (typeof NFTApp.getModule === "function" && NFTApp.getModule("combinationRules")) {
      NFTApp.getModule("combinationRules").updateRulesUI(projectData)
    }
  },
}

// Hook into the trait layers module to update rules when a layer is renamed
document.addEventListener("DOMContentLoaded", () => {
  // Wait for the trait layers module to be loaded
  const checkInterval = setInterval(() => {
    if (typeof NFTApp.getModule === "function" && NFTApp.getModule("traitLayers")) {
      clearInterval(checkInterval)

      // Store a reference to the original renameLayer function
      const originalRenameLayer = NFTApp.getModule("traitLayers").renameLayer

      // Override the renameLayer function to also update combination rules
      NFTApp.getModule("traitLayers").renameLayer = function (layerId, newName, projectData) {
        // Call the original function first
        const result = originalRenameLayer.call(this, layerId, newName, projectData)

        // Then update the combination rules
        NFTApp.layerRenameRuleUpdater.updateRulesOnLayerRename(projectData, layerId, newName)

        return result
      }

      console.log("Layer rename rule updater initialized")
    }
  }, 100)
})
