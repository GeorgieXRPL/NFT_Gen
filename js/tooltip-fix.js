document.addEventListener("DOMContentLoaded", () => {
  // Function to position tooltips
  function positionTooltips() {
    const tooltips = document.querySelectorAll(".tooltip")

    tooltips.forEach((tooltip) => {
      const tooltipText = tooltip.querySelector(".tooltiptext")
      if (!tooltipText) return

      // Reset any previous positioning
      tooltipText.style.left = ""
      tooltipText.style.right = ""
      tooltipText.style.bottom = ""
      tooltipText.style.top = ""
      tooltipText.style.transform = ""

      // Get tooltip and tooltip text dimensions
      const tooltipRect = tooltip.getBoundingClientRect()
      const tooltipTextRect = tooltipText.getBoundingClientRect()

      // Check if tooltip would go off screen to the left or right
      if (tooltipRect.left + tooltipTextRect.width / 2 > window.innerWidth) {
        // Too far right, align right edge
        tooltipText.classList.add("tooltip-right")
      } else if (tooltipRect.left - tooltipTextRect.width / 2 < 0) {
        // Too far left, align left edge
        tooltipText.classList.add("tooltip-left")
      }

      // Check if tooltip would go off screen to the top
      if (tooltipRect.top - tooltipTextRect.height < 0) {
        // Too high, show below
        tooltipText.classList.add("tooltip-bottom")
      }
    })
  }

  // Position tooltips on load
  positionTooltips()

  // CRITICAL: Debounce resize and scroll listeners to improve performance
  let resizeTimeout = null;
  let scrollTimeout = null;
  let mutationDebounceTimeout = null;

  // Position tooltips on window resize
  window.addEventListener("resize", () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      positionTooltips();
      resizeTimeout = null;
    }, 150); // Debounce to 150ms
  })

  // Position tooltips on scroll
  document.addEventListener("scroll", () => {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    scrollTimeout = setTimeout(() => {
      positionTooltips();
      scrollTimeout = null;
    }, 100); // Debounce to 100ms for scroll
  })

  // Set up a MutationObserver to handle dynamically added tooltips
  // CRITICAL: Use debounced version to prevent performance issues
  const observer = new MutationObserver((mutations) => {
    let hasNewTooltips = false;
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        // CRITICAL: Only check if added nodes contain tooltips
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1 && (
            (node.classList && node.classList.contains("tooltip")) ||
            (node.querySelector && node.querySelector(".tooltip, .tooltiptext"))
          )) {
            hasNewTooltips = true;
            return;
          }
        });
        if (hasNewTooltips) return;
      }
    });
    
    // CRITICAL: Only position tooltips if new tooltips were actually added
    if (hasNewTooltips) {
      if (mutationDebounceTimeout) {
        clearTimeout(mutationDebounceTimeout);
      }
      mutationDebounceTimeout = setTimeout(() => {
        positionTooltips();
        mutationDebounceTimeout = null;
      }, 300); // Debounce to 300ms
    }
  })

  // CRITICAL: Only observe childList to reduce overhead
  observer.observe(document.body, { childList: true, subtree: true })
})
