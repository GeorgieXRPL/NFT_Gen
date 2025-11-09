/**
 * Override Randomize Tooltip
 * This script completely overrides the tooltip behavior for the randomize button
 * by replacing the button with a custom implementation
 */

;(() => {
  // Function to override randomize buttons
  function overrideRandomizeButtons() {
    console.log("Overriding randomize buttons")

    // Find all randomize buttons
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")

    randomizeButtons.forEach((button) => {
      // Skip if already processed
      if (button.dataset.overrideApplied === "true") return

      // Mark as processed
      button.dataset.overrideApplied = "true"

      // Store the original click handler
      const originalClickHandler = button.onclick

      // Create a tooltip element
      const tooltip = document.createElement("div")
      tooltip.className = "override-randomize-tooltip"
      tooltip.innerHTML = `
        Assign random rarities based on tiers:<br>
        • Mythic (3%)<br>
        • Legendary (5%)<br>
        • Epic (12%)<br>
        • Rare (20%)<br>
        • Uncommon (25%)<br>
        • Common (35%)
      `

      // Add the tooltip to the document body
      document.body.appendChild(tooltip)

      // Add mouseenter event
      button.addEventListener("mouseenter", (e) => {
        const buttonRect = button.getBoundingClientRect()

        // Position the tooltip
        tooltip.style.top = `${buttonRect.bottom + 10}px`
        tooltip.style.left = `${buttonRect.left + buttonRect.width / 2}px`
        tooltip.style.transform = "translateX(-50%)"
        tooltip.style.visibility = "visible"
        tooltip.style.opacity = "1"

        console.log("Showing override tooltip")
      })

      // Add mouseleave event
      button.addEventListener("mouseleave", () => {
        tooltip.style.visibility = "hidden"
        tooltip.style.opacity = "0"
      })

      // Preserve the original click functionality
      button.onclick = function (e) {
        if (originalClickHandler) {
          originalClickHandler.call(this, e)
        }
      }

      console.log("Override applied to button:", button)
    })
  }

  // Run immediately
  overrideRandomizeButtons()

  // Run again when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", overrideRandomizeButtons)
  }

  // Set up a MutationObserver to detect when new buttons are added
  const observer = new MutationObserver((mutations) => {
    let shouldOverride = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (node.classList && node.classList.contains("randomize-rarities-tiered-btn")) {
              shouldOverride = true
            } else if (node.querySelector && node.querySelector(".randomize-rarities-tiered-btn")) {
              shouldOverride = true
            }
          }
        })
      }
    })

    if (shouldOverride) {
      setTimeout(overrideRandomizeButtons, 50)
    }
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
      setTimeout(overrideRandomizeButtons, 100)
    }
  })
})()
