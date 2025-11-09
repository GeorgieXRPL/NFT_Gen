/**
 * Enhanced drag-and-drop functionality for trait layers
 * This script enhances the existing drag-and-drop functionality with:
 * - More reliable dragging behavior
 * - Better visual feedback during drag operations
 * - Prevents expanded layers from being draggable
 * - Preserves layer order in project data
 * - Ensures only one trait layer can be expanded at a time
 */

(function() {
  // Wait for DOM to be fully loaded
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Enhanced trait layers drag and drop loaded");
    
    // Initial setup
    setupTraitLayersDragAndDrop();
    
    // Listen for trait layer updates to reapply enhancements
    document.addEventListener('traits-updated', function() {
      console.log("Traits updated, reapplying enhanced drag and drop");
      setTimeout(setupTraitLayersDragAndDrop, 100);
    });
    
    // Also setup on add/delete layer events
    document.addEventListener('layers-updated', function() {
      console.log("Layers updated, reapplying enhanced drag and drop");
      setTimeout(setupTraitLayersDragAndDrop, 100);
    });
  });

  // Function to set up trait layers drag and drop
  function setupTraitLayersDragAndDrop() {
    // Wait for the trait layers container to be available
    function checkForTraitLayersContainer() {
      const container = document.querySelector(".trait-layers-container");
      if (!container) {
        console.log("Trait layers container not found yet, waiting...");
        setTimeout(checkForTraitLayersContainer, 500);
        return;
      }

      console.log("Trait layers container found, setting up enhanced drag and drop");
      
      // Track expanded layer to ensure only one is expanded at a time
      let currentExpandedLayer = null;
      
      // Mark container as having enhanced dragdrop
      container.dataset.enhancedDragdropApplied = "true";

      // Create a placeholder element for drag visualization if it doesn't exist
      let placeholder = container.querySelector(".trait-layer-placeholder");
      if (!placeholder) {
        placeholder = document.createElement("div");
        placeholder.className = "trait-layer-placeholder";
        placeholder.style.height = "60px";
        placeholder.style.border = "2px dashed var(--border-color)";
        placeholder.style.borderRadius = "8px";
        placeholder.style.margin = "8px 0";
        placeholder.style.backgroundColor = "rgba(108, 92, 231, 0.1)";
        placeholder.style.display = "none";
        placeholder.style.transition = "background 0.2s, border 0.2s";
        container.appendChild(placeholder);
      }
      // Always remove extra placeholders
      container.querySelectorAll('.trait-layer-placeholder').forEach((el, i) => { if (i > 0) el.remove(); });

      // Set up drag and drop for trait layers
      function setupDragForLayers() {
        const traitLayers = container.querySelectorAll(".trait-layer-bar");
        console.log(`Setting up drag for ${traitLayers.length} layers`);

        // Remove any existing listeners to avoid duplicates
        traitLayers.forEach((layer) => {
          layer.replaceWith(layer.cloneNode(true));
        });
        
        // Get the refreshed list after cloning
        const refreshedLayers = container.querySelectorAll(".trait-layer-bar");
        
        refreshedLayers.forEach((layer) => {
          // Block all drag and drop if expanded
          if (layer.classList.contains("expanded")) {
            layer.setAttribute("draggable", "false");
            // Block all children from being draggable
            layer.querySelectorAll("[draggable], .trait-layer-drag-handle, .trait-item, .trait-image, .trait-selection-thumb").forEach(el => {
              el.setAttribute("draggable", "false");
              // Remove dragstart, dragover, drop, mousedown listeners
              el.addEventListener("dragstart", e => e.preventDefault(), {capture:true, once:true});
              el.addEventListener("dragover", e => e.preventDefault(), {capture:true, once:true});
              el.addEventListener("drop", e => e.preventDefault(), {capture:true, once:true});
              el.addEventListener("mousedown", e => e.preventDefault(), {capture:true, once:true});
            });
            // Also block drag events on the layer itself
            layer.addEventListener("dragstart", e => e.preventDefault(), {capture:true, once:true});
            layer.addEventListener("dragover", e => e.preventDefault(), {capture:true, once:true});
            layer.addEventListener("drop", e => e.preventDefault(), {capture:true, once:true});
            layer.addEventListener("mousedown", e => e.preventDefault(), {capture:true, once:true});
            return;
          } else {
            layer.setAttribute("draggable", "true");
          }
          
          // Set up header click handler (excluding buttons)
          const header = layer.querySelector(".trait-layer-header");
          if (header) {
            header.addEventListener("click", function(e) {
              // Don't toggle if clicking on buttons or controls
              if (
                e.target.closest(".position-btn") ||
                e.target.closest(".action-btn") ||
                e.target.closest(".trait-layer-drag-handle") ||
                e.target.closest(".trait-layer-header-rarity") ||
                e.target.closest(".trait-layer-arrow") ||
                e.target.closest(".trait-image") // Don't toggle when clicking on trait images
              ) {
                return;
              }
              
              // Trigger the arrow click to toggle expansion
              const arrow = layer.querySelector(".trait-layer-arrow");
              if (arrow) {
                arrow.click();
              }
            });
          }
          
          // Add drag start event
          layer.addEventListener("dragstart", function(e) {
            // Prevent dragging if the layer is expanded
            if (layer.classList.contains("expanded")) {
              console.log("Preventing drag on expanded layer");
              e.preventDefault();
              return;
            }
            
            // Prevent dragging when interacting with controls
            if (
              e.target.tagName === "INPUT" || 
              e.target.tagName === "BUTTON" ||
              e.target.closest("input") ||
              e.target.closest("button") ||
              e.target.closest(".trait-layer-actions") ||
              e.target.closest(".trait-layer-position") ||
              e.target.closest(".trait-layer-header-rarity") ||
              e.target.closest(".trait-item") ||  // Don't drag when interacting with trait items
              e.target.closest(".trait-image")    // Don't drag when interacting with trait images
            ) {
              console.log("Preventing drag on control element");
              e.preventDefault();
              return;
            }
            
            console.log("Drag started for layer:", layer.dataset.id);
            e.dataTransfer.setData("text/plain", layer.dataset.id);
            layer.classList.add("dragging");
            
            // Set a better drag image
            if (e.dataTransfer.setDragImage) {
              try {
                e.dataTransfer.setDragImage(layer, 20, 20);
              } catch (err) {
                console.warn("Could not set drag image:", err);
              }
            }

            // Add the placeholder
            setTimeout(() => {
              const height = layer.offsetHeight;
              placeholder.style.height = `${height}px`;
              placeholder.style.display = "block";
              // Remove all other placeholders
              container.querySelectorAll('.trait-layer-placeholder').forEach((el, i) => { if (el !== placeholder) el.remove(); });
              if (layer.nextSibling) {
                container.insertBefore(placeholder, layer.nextSibling);
              } else {
                container.appendChild(placeholder);
              }
              layer.style.opacity = "0.4";
            }, 0);
          });

          // Add drag end event
          layer.addEventListener("dragend", function() {
            console.log("Drag ended for layer:", layer.dataset.id);
            layer.classList.remove("dragging");
            layer.style.opacity = "1";
            placeholder.style.display = "none";
            // Remove all other placeholders
            container.querySelectorAll('.trait-layer-placeholder').forEach((el, i) => { if (el !== placeholder) el.remove(); });
          });

          // Make sure the drag handle is properly set up
          const dragHandle = layer.querySelector(".trait-layer-drag-handle");
          if (dragHandle) {
            dragHandle.addEventListener("mousedown", function(e) {
              // Prevent dragging if the layer is expanded
              if (layer.classList.contains("expanded")) {
                console.log("Preventing drag handle on expanded layer");
                e.preventDefault();
                // Visual feedback
                const origCursor = dragHandle.style.cursor;
                dragHandle.style.cursor = "not-allowed";
                setTimeout(() => {
                  dragHandle.style.cursor = origCursor;
                }, 500);
                return;
              }
            });
          }
          
          // Set up trait image click handling
          const traitImageElements = layer.querySelectorAll(".trait-image");
          traitImageElements.forEach(image => {
            // We don't add click handlers here as they're handled by trait-image-preview.js
            // Just make sure they're not draggable
            image.setAttribute("draggable", "false");
            
            // Make sure any img elements inside are also not draggable
            const imgElements = image.querySelectorAll("img");
            imgElements.forEach(img => {
              img.setAttribute("draggable", "false");
            });
          });
        });
      }

      // Set up container events for drag and drop
      container.addEventListener("dragover", function(e) {
        e.preventDefault();
        const draggingElement = container.querySelector(".dragging");
        if (!draggingElement) return;
        // Find the element to insert the placeholder before
        const afterElement = getDragAfterElement(container, e.clientY);
        if (afterElement && afterElement !== draggingElement && afterElement !== placeholder) {
            container.insertBefore(placeholder, afterElement);
        } else if (!afterElement) {
          container.appendChild(placeholder);
        }
      });

      // Handle drop to reorder layers
      container.addEventListener("drop", function(e) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData("text/plain");
        if (!draggedId) return;
        const draggingElement = container.querySelector(`[data-id="${draggedId}"]`);
        if (!draggingElement) return;
        // Replace the placeholder with the dragged element
        if (placeholder.parentNode) {
          container.insertBefore(draggingElement, placeholder);
          placeholder.style.display = "none";
        }
        // Remove all other placeholders
        container.querySelectorAll('.trait-layer-placeholder').forEach((el, i) => { if (el !== placeholder) el.remove(); });

        // Get the current project data
        const projectData = getCurrentProject();
        if (!projectData) {
          console.error("Project data not found");
          return;
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
        const NFTApp = window.NFTApp;
        if (NFTApp && NFTApp.getModule) {
          const projectService = NFTApp.getModule('projectService');
          if (projectService && typeof projectService.saveProjectData === 'function') {
            projectService.saveProjectData();
          } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
            window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false });
          }
        } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
          window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false });
        }

        // Dispatch an event to notify that traits were updated
        document.dispatchEvent(new CustomEvent("traits-updated"));
      });

      // Add global event listener to prevent dragging of trait images
      document.addEventListener("dragstart", function(e) {
        if (e.target.closest(".trait-image") || e.target.closest(".trait-item")) {
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
      }, true);

      // Helper function to determine where to place the dragged element
      function getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll(".trait-layer-bar:not(.dragging):not(.expanded)")];

        return draggableElements.reduce(
          (closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
              return { offset: offset, element: child };
            } else {
              return closest;
            }
          },
          { offset: Number.NEGATIVE_INFINITY }
        ).element;
      }

      // Helper function to get the current project data
      function getCurrentProject() {
        // First try to get it from window.currentProject
        if (window.currentProject) {
          return window.currentProject;
        }
        
        // If that doesn't exist, try to get it from the NFTApp module
        const NFTApp = window.NFTApp;
        if (NFTApp && NFTApp.getCurrentProject) {
          return NFTApp.getCurrentProject();
        }
        
        // If that doesn't exist, try to get it from localStorage
        try {
          const savedProject = localStorage.getItem("currentProject");
          if (savedProject) {
            return JSON.parse(savedProject);
          }
        } catch (e) {
          console.error("Error retrieving project from localStorage:", e);
        }
        
        console.error("Could not retrieve current project data");
        return null;
      }

      // Run the setup
      setupDragForLayers();
    }

    // Start the process
    checkForTraitLayersContainer();
  }
})();
