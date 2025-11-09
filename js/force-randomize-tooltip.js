/**
 * Force Randomize Tooltip
 * This script specifically targets the "Randomize Rarities (tiered)" button tooltip
 * and ensures it's always displayed correctly, regardless of other tooltip settings.
 */

;(() => {
  // Run immediately and also after DOM is fully loaded
  function initRandomizeTooltip() {
    console.log("Initializing randomize tooltip fix")

    // Function to create and attach the tooltip
    function setupRandomizeTooltip(button) {
      // Skip if already processed
      if (button.dataset.tooltipFixed === "true") return

      console.log("Setting up randomize tooltip for button:", button)

      // Mark as processed
      button.dataset.tooltipFixed = "true"

      // Remove any existing tooltip to avoid duplicates
      const existingTooltip = button.querySelector(".randomize-tooltip-content")
      if (existingTooltip) existingTooltip.remove()

      // Create a new tooltip element
      const tooltip = document.createElement("div")
      tooltip.className = "randomize-tooltip-content"
      tooltip.innerHTML = `
        Assign random rarities based on tiers:<br>
        • Mythic (3%)<br>
        • Legendary (5%)<br>
        • Epic (12%)<br>
        • Rare (20%)<br>
        • Uncommon (25%)<br>
        • Common (35%)
      `

      // Add the tooltip to the button
      button.appendChild(tooltip)

      // Add event listeners
      button.addEventListener("mouseenter", () => {
        // Position the tooltip
        const buttonRect = button.getBoundingClientRect()
        tooltip.style.visibility = "visible"
        tooltip.style.opacity = "1"

        // Position below the button
        tooltip.style.top = `${buttonRect.height + 10}px`
        tooltip.style.left = "50%"
        tooltip.style.transform = "translateX(-50%)"

        console.log("Showing randomize tooltip")
      })

      button.addEventListener("mouseleave", () => {
        tooltip.style.visibility = "hidden"
        tooltip.style.opacity = "0"
      })
    }

    // Find all randomize buttons and set up tooltips
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")
    randomizeButtons.forEach(setupRandomizeTooltip)

    console.log(`Found ${randomizeButtons.length} randomize buttons`)
  }

  // Run immediately
  initRandomizeTooltip()

  // Run again when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initRandomizeTooltip)
  }

  // Set up a MutationObserver to detect when new buttons are added
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        // Check if any randomize buttons were added
        let shouldInit = false

        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (node.classList && node.classList.contains("randomize-rarities-tiered-btn")) {
              shouldInit = true
            } else if (node.querySelector && node.querySelector(".randomize-rarities-tiered-btn")) {
              shouldInit = true
            }
          }
        })

        if (shouldInit) {
          console.log("New randomize button detected, initializing tooltip")
          initRandomizeTooltip()
        }
      }
    })
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Also run when a trait layer is expanded
  document.body.addEventListener("click", (event) => {
    const arrow = event.target.closest(".trait-layer-arrow")
    if (arrow) {
      // Wait for the content to expand
      setTimeout(initRandomizeTooltip, 100)
    }
  })
})()
