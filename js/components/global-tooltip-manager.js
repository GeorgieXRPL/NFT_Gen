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

    let tooltipTimeout = null;

    element.addEventListener("mouseenter", () => {
      // Hide any currently displayed tooltip
      this.hideCurrentTooltip();

      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // Show tooltip after 1 second delay
      tooltipTimeout = setTimeout(() => {
        // Double-check if another tooltip started showing
        if (this.currentTooltip && this.currentTooltip !== tooltip) {
          // Another tooltip is showing, hide it first
          this.hideCurrentTooltip();
        }

        // Set this as the current tooltip
        this.currentTooltip = tooltip;
        this.currentElement = element;

        const rect = element.getBoundingClientRect();
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
        tooltip.style.setProperty("z-index", "2147483647", "important");
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");

        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");

        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const elementRect = element.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        const topPosition = elementRect.top - tooltipHeight - 5;
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");

        // Fade in with transition
        requestAnimationFrame(() => {
          tooltip.style.opacity = "1";
        });

        tooltipTimeout = null;
      }, 1000); // 1 second delay
    });

    element.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // Hide tooltip if it's the current one
      if (this.currentTooltip === tooltip) {
        this.hideCurrentTooltip();
      } else {
        // Fade out this tooltip
        tooltip.style.opacity = "0";
        // Wait for fade out transition to complete before hiding
        setTimeout(() => {
          tooltip.style.visibility = "hidden";
        }, 1000);
      }
    });
  },

  // Hide the currently displayed tooltip
  hideCurrentTooltip: function() {
    if (this.currentTooltip) {
      this.currentTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.style.visibility = "hidden";
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

