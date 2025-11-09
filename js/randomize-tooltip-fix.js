// Randomize Tooltip Fix
// This script ensures the tooltip for the "Randomize Rarities (tiered)" button works correctly

document.addEventListener("DOMContentLoaded", () => {
  // Function to fix randomize tooltip
  function fixRandomizeTooltip() {
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")

    randomizeButtons.forEach((button) => {
      // Check if button already has event listeners (to avoid duplicates)
      if (button.dataset.tooltipInitialized) return

      const tooltip = button.querySelector(".tooltiptext.randomize-tooltip")
      if (!tooltip) return

      // Mark as initialized
      button.dataset.tooltipInitialized = "true"

      // Add mouseenter event to position the tooltip
      button.addEventListener("mouseenter", () => {
        // Get button position
        const buttonRect = button.getBoundingClientRect()

        // Make tooltip visible but transparent to calculate its size
        tooltip.style.visibility = "visible"
        tooltip.style.opacity = "0"

        // Get tooltip dimensions
        const tooltipRect = tooltip.getBoundingClientRect()

        // Position the tooltip below the button
        tooltip.style.top = `${buttonRect.bottom + 10}px`
        tooltip.style.left = `${buttonRect.left + (buttonRect.width / 2) - tooltipRect.width / 2}px`

        // Make tooltip fully visible
        tooltip.style.opacity = "1"
        tooltip.style.zIndex = "999999"

        // Add bottom class to ensure arrow points up
        tooltip.classList.add("tooltip-bottom")
      })

      // Add mouseleave event to hide the tooltip
      button.addEventListener("mouseleave", () => {
        tooltip.style.opacity = "0"
        tooltip.style.visibility = "hidden"
      })
    })
  }

  // Run the fix immediately
  fixRandomizeTooltip()

  // Set up a MutationObserver to detect when new randomize buttons are added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        // Check if any added nodes contain randomize buttons
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (node.classList && node.classList.contains("randomize-rarities-tiered-btn")) {
              fixRandomizeTooltip()
            } else if (node.querySelector) {
              const buttons = node.querySelectorAll(".randomize-rarities-tiered-btn")
              if (buttons.length > 0) {
                fixRandomizeTooltip()
              }
            }
          }
        })
      }
    })
  })

  // Start observing the document body
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Also run the fix when a trait layer is expanded
  document.body.addEventListener("click", (event) => {
    const arrow = event.target.closest(".trait-layer-arrow")
    if (arrow) {
      // Wait for the content to expand
      setTimeout(fixRandomizeTooltip, 100)
    }
  })
})
