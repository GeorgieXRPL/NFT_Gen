/**
 * Enhanced Randomize Tooltip
 * Improves the tooltip display for the Randomize Rarities button
 * with better formatting and visual representation of tier distribution
 */

(function() {
  // Function to enhance the randomize buttons
  function enhanceRandomizeTooltips() {
    console.log("Enhancing randomize tooltips");

    // Find all randomize buttons
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn");

    randomizeButtons.forEach((button) => {
      // Skip if already enhanced
      if (button.dataset.tooltipEnhanced === "true") return;

      // Get the existing tooltip
      const existingTooltip = button.querySelector(".tooltiptext.randomize-tooltip");
      
      if (!existingTooltip) return;
      
      // Mark as enhanced
      button.dataset.tooltipEnhanced = "true";
      
      // Save the original tooltip content
      const originalContent = existingTooltip.innerHTML;
      
      // Update the tooltip content
      existingTooltip.innerHTML = "";
      
      // Make sure the tooltip is properly positioned when shown
      button.addEventListener("mouseenter", () => {
        const buttonRect = button.getBoundingClientRect();
        
        // Ensure the tooltip is visible to calculate its size
        existingTooltip.style.visibility = "visible";
        existingTooltip.style.opacity = "0";
        
        // Position the tooltip centered below the button
        existingTooltip.style.top = `${buttonRect.bottom + 10}px`;
        existingTooltip.style.left = `${buttonRect.left + (buttonRect.width / 2)}px`;
        existingTooltip.style.opacity = "1";
        
        // Ensure tooltip is above everything else
        existingTooltip.style.zIndex = "2147483647";
        
        // Add tooltip bottom class for arrow positioning
        existingTooltip.classList.add("tooltip-bottom");
      });
      
      // Hide tooltip on mouse leave
      button.addEventListener("mouseleave", () => {
        existingTooltip.style.visibility = "hidden";
        existingTooltip.style.opacity = "0";
      });
    });
  }

  // Run on document ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", enhanceRandomizeTooltips);
  } else {
    enhanceRandomizeTooltips();
  }

  // Also run when trait layers are updated
  document.addEventListener("traits-updated", () => {
    setTimeout(enhanceRandomizeTooltips, 100);
  });

  // Run when layers are expanded
  document.addEventListener("click", (e) => {
    if (e.target.closest(".trait-layer-arrow")) {
      setTimeout(enhanceRandomizeTooltips, 100);
    }
  });

  // Set up a MutationObserver to detect when new elements are added
  const observer = new MutationObserver((mutations) => {
    let shouldRun = false;
    
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) { // Element node
            if (node.classList && node.classList.contains("randomize-rarities-tiered-btn")) {
              shouldRun = true;
            } else if (node.querySelector && node.querySelector(".randomize-rarities-tiered-btn")) {
              shouldRun = true;
            }
          }
        });
      }
    });
    
    if (shouldRun) {
      setTimeout(enhanceRandomizeTooltips, 50);
    }
  });
  
  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})(); 