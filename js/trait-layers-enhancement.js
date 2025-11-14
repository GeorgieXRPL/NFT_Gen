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
    // CRITICAL: Only observe the trait-layers-container, not the entire document.body
    // This prevents the observer from firing on every tab switch and causing flickering
    try {
      let enhancementTimeout = null;
      const debouncedEnhancement = () => {
        // Clear any pending timeout
        if (enhancementTimeout) {
          clearTimeout(enhancementTimeout);
        }
        // Debounce the enhancement to prevent excessive calls
        enhancementTimeout = setTimeout(() => {
          setupTraitLayersEnhancements();
          enhancementTimeout = null;
        }, 100); // 100ms debounce
      };
      
      const observer = new MutationObserver(mutations => {
        // Check if any of the mutations affected the trait layers
        const shouldEnhance = mutations.some(mutation => {
          const target = mutation.target;
          // Only enhance if the mutation is directly in the trait-layers-container
          // or if it's a class change on a trait-layer-bar
          return target && (
            target.classList?.contains("trait-layers-container") ||
            target.classList?.contains("trait-layer-bar") ||
            target.closest?.(".trait-layers-container")
          );
        });
        
        if (shouldEnhance) {
          debouncedEnhancement();
        }
      });
      
      // CRITICAL: Only observe the trait-layers-container when it exists
      // Don't observe the entire document.body to prevent firing on tab switches
      const setupObserver = () => {
        const container = document.querySelector(".trait-layers-container");
        if (container) {
          // Only observe the container, not the entire document
          observer.observe(container, { 
            childList: true, 
            subtree: true,
            attributes: true,
            attributeFilter: ['class', 'draggable']
          });
        } else {
          // If container doesn't exist yet, try again after a delay
          setTimeout(setupObserver, 500);
        }
      };
      
      // Setup observer after initial delay
      setTimeout(setupObserver, 500);
    } catch (error) {
      console.error("Error setting up mutation observer:", error);
      // Fallback: periodically check for changes (but less frequently)
      setInterval(setupTraitLayersEnhancements, 5000); // Increased from 2000 to 5000
    }
  });
})(); 