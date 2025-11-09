/**
 * Trait Layers Enhancement Script
 * Handles the additional features for trait layers:
 * - Only one trait layer expanded at a time
 * - Block drag and drop for expanded layers
 * - Better placeholders during drag and drop
 */

(function() {
  // Wait for DOM to be fully loaded
  document.addEventListener("DOMContentLoaded", function() {
    // Setup function to be called initially and when trait layers are updated
    function setupTraitLayersEnhancements() {
      console.log("Setting up trait layers enhancements");
      
      // Get the trait layers container
      const container = document.querySelector(".trait-layers-container");
      if (!container) {
        console.log("Trait layers container not found, enhancement will run when available");
        return;
      }
      
      // Get all trait layer bars
      const traitLayers = container.querySelectorAll(".trait-layer-bar");
      if (!traitLayers || traitLayers.length === 0) {
        console.log("No trait layers found, enhancement will run when layers are added");
        return;
      }
      
      // Ensure only one layer is expanded
      let expandedLayer = null;
      
      // Find if any layer is currently expanded
      traitLayers.forEach(layer => {
        if (layer && layer.classList && layer.classList.contains("expanded")) {
          if (expandedLayer) {
            // If we already found an expanded layer, collapse this one
            layer.classList.remove("expanded");
            const content = layer.querySelector(".trait-layer-content");
            if (content) content.classList.remove("expanded");
            layer.setAttribute("draggable", "true");
          } else {
            expandedLayer = layer;
            // Make expanded layer not draggable
            layer.setAttribute("draggable", "false");
          }
        }
      });
      
      // Apply proper draggable state to all layers
      traitLayers.forEach(layer => {
        if (layer && layer.classList) {
          if (layer.classList.contains("expanded")) {
            layer.setAttribute("draggable", "false");
          } else {
            layer.setAttribute("draggable", "true");
          }
        }
      });
    }
    
    // Run enhancement setup immediately
    setTimeout(setupTraitLayersEnhancements, 500); // Add slight delay for DOM to fully populate
    
    // Also run when traits are updated
    document.addEventListener("traits-updated", setupTraitLayersEnhancements);
    
    // Add a MutationObserver to detect changes to the DOM
    try {
      const observer = new MutationObserver(mutations => {
        // Check if any of the mutations affected the trait layers
        const shouldEnhance = mutations.some(mutation => {
          // Check if the mutation target is or contains trait layers
          return mutation.target && 
                (mutation.target.classList?.contains("trait-layers-container") || 
                 mutation.target.querySelector?.(".trait-layers-container"));
        });
        
        if (shouldEnhance) {
          setupTraitLayersEnhancements();
        }
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.body, { 
        childList: true, 
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
    } catch (error) {
      console.error("Error setting up mutation observer:", error);
      // Fallback: periodically check for changes
      setInterval(setupTraitLayersEnhancements, 2000);
    }
  });
})(); 