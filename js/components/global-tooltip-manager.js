// Global Tooltip Manager
// Ensures only one tooltip displays at a time across the entire app
// All tooltips use orange text (#f39c12) and black background (#000000)
// 1 second delay before displaying
// Display above object, horizontally centered
// Never interferes with object styles

window.NFTApp.registerModule("globalTooltipManager", {
  currentTooltip: null, // Currently displayed tooltip
  currentTimeout: null, // Current timeout for showing tooltip
  currentElement: null, // Element that currently has tooltip showing

  // Setup a tooltip for an element
  setupTooltip: function(element, tooltip) {
    if (!element || !tooltip) return;

    // Ensure tooltip has correct styling
    this.ensureTooltipStyle(tooltip);
    
    // CRITICAL: Ensure tooltip has 1 second transition for fade in/out
    tooltip.style.setProperty("transition", "opacity 1s ease", "important");

    // CRITICAL: Also set up tooltip on SVG elements inside the button
    // This ensures hovering over the SVG icon also shows the tooltip
    const svgElements = element.querySelectorAll ? element.querySelectorAll("svg") : [];
    const parentButton = element.tagName === "SVG" ? element.closest("button") : element;
    const targetElement = parentButton || element; // Use parent button if element is SVG, otherwise use element itself

    let tooltipTimeout = null;

    // Helper function to show tooltip
    const showTooltip = (triggerElement) => {
      // Hide any currently displayed tooltip
      this.hideCurrentTooltip();

      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // CRITICAL: Navigation tabs have 4 second delay, other tooltips have 1 second delay
      const isNavTab = targetElement.classList.contains('nav-tab') || targetElement.closest('.nav-tab');
      const delay = isNavTab ? 4000 : 1000; // 4 seconds for navigation tabs, 1 second for others
      
      // Show tooltip after delay
      tooltipTimeout = setTimeout(() => {
        // Double-check if another tooltip started showing
        if (this.currentTooltip && this.currentTooltip !== tooltip) {
          // Another tooltip is showing, hide it first
          this.hideCurrentTooltip();
        }

        // Set this as the current tooltip
        this.currentTooltip = tooltip;
        this.currentElement = targetElement;

        // Use the button element's position for tooltip (not SVG if triggerElement is SVG)
        const rect = targetElement.getBoundingClientRect();
        // Make tooltip temporarily visible to measure height, but keep it off-screen
        tooltip.style.visibility = "visible";
        tooltip.style.opacity = "0";
        tooltip.style.top = "-9999px";
        tooltip.style.left = "-9999px";
        tooltip.style.transform = "none";
        void tooltip.offsetHeight; // Force reflow
        const tooltipWidth = tooltip.offsetWidth || 200;
        const tooltipHeight = tooltip.offsetHeight;

        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        tooltip.style.setProperty("position", "fixed", "important");
        // CRITICAL: Ensure Export NFTs / Metadata navigation tab tooltip has highest z-index
        const isExportNavTab = (targetElement.classList.contains('nav-tab') && targetElement.dataset.tab === 'export-nfts') || 
                                (targetElement.closest('.nav-tab') && targetElement.closest('.nav-tab').dataset.tab === 'export-nfts');
        tooltip.style.setProperty("z-index", "2147483647", "important");
        if (isExportNavTab) {
          tooltip.style.setProperty("display", "block", "important");
        }
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");

        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");

        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const elementRect = targetElement.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        // CRITICAL: For navigation tabs, move tooltip 20px down from original position
        const isNavTab = targetElement.classList.contains('nav-tab') || targetElement.closest('.nav-tab');
        // CRITICAL: Check if element is inside nft-action-buttons-container and move tooltip 15px up
        const isInNftActionButtonsContainer = targetElement.closest('.nft-action-buttons-container') !== null;
        const baseOffset = 5;
        const navTabOffset = isNavTab ? 20 : 0;
        const nftActionButtonsOffset = isInNftActionButtonsContainer ? -15 : 0; // Move 15px up (negative offset)
        const topPosition = elementRect.top - tooltipHeight - baseOffset + navTabOffset + nftActionButtonsOffset;
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");

        // CRITICAL: Ensure transition is set before fade in
        tooltip.style.setProperty("transition", "opacity 1s ease", "important");
        // Fade in with transition
        requestAnimationFrame(() => {
          tooltip.style.setProperty("visibility", "visible", "important");
          tooltip.style.setProperty("opacity", "1", "important");
        });

        tooltipTimeout = null;
      }, delay); // 4 seconds for navigation tabs, 1 second for others
    };

    // Helper function to hide tooltip
    const hideTooltip = () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // Hide tooltip if it's the current one
      if (this.currentTooltip === tooltip) {
        this.hideCurrentTooltip();
      } else {
        // CRITICAL: Ensure transition is set before fade out
        tooltip.style.setProperty("transition", "opacity 1s ease", "important");
        // Fade out this tooltip
        tooltip.style.setProperty("opacity", "0", "important");
        // Wait for fade out transition to complete before hiding
        setTimeout(() => {
          tooltip.style.setProperty("visibility", "hidden", "important");
        }, 1000);
      }
    };

    element.addEventListener("mouseenter", () => {
      showTooltip(element);
    });

    element.addEventListener("mouseleave", () => {
      hideTooltip();
    });

    // Also set up tooltip on SVG elements inside the button
    svgElements.forEach(svg => {
      // Add cursor help to SVG
      svg.style.setProperty("cursor", "help", "important");
      
      svg.addEventListener("mouseenter", () => {
        showTooltip(svg);
      });

      svg.addEventListener("mouseleave", () => {
        hideTooltip();
      });
    });
  },

  // Hide the currently displayed tooltip
  hideCurrentTooltip: function() {
    if (this.currentTooltip) {
      // CRITICAL: Ensure transition is set for fade out
      this.currentTooltip.style.setProperty("transition", "opacity 1s ease", "important");
      this.currentTooltip.style.setProperty("opacity", "0", "important");
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.style.setProperty("visibility", "hidden", "important");
        }
      }, 1000);
      this.currentTooltip = null;
      this.currentElement = null;
    }
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  },

  // Ensure tooltip has correct styling
  ensureTooltipStyle: function(tooltip) {
    // Set base styles if not already set
    if (!tooltip.style.backgroundColor || tooltip.style.backgroundColor === "") {
      tooltip.style.backgroundColor = "#000000";
      tooltip.style.background = "#000000";
      tooltip.style.color = "#f39c12";
      tooltip.style.textAlign = "center";
      tooltip.style.borderRadius = "6px";
      tooltip.style.padding = "8px 10px";
      tooltip.style.fontSize = "11px";
      tooltip.style.lineHeight = "1.4";
      tooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
      tooltip.style.pointerEvents = "none";
      tooltip.style.whiteSpace = "normal";
      tooltip.style.wordWrap = "break-word";
      tooltip.style.overflowWrap = "break-word";
      tooltip.style.boxSizing = "border-box";
      tooltip.style.transition = "opacity 1s";
      tooltip.style.visibility = "hidden";
      tooltip.style.opacity = "0";
      tooltip.style.position = "fixed";
      tooltip.style.zIndex = "2147483647";
    }
  }
});

