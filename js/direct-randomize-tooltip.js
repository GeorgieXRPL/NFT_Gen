/**
 * Direct Randomize Tooltip
 * This script directly injects tooltips into the randomize buttons
 * by overriding the existing HTML structure
 */

;(() => {
  // Function to directly inject tooltips
  function injectRandomizeTooltips() {
    console.log("Injecting randomize tooltips directly")

    // Find all randomize buttons
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")

    randomizeButtons.forEach((button) => {
      // Skip if already processed
      if (button.dataset.directTooltipInjected === "true") return

      // Mark as processed
      button.dataset.directTooltipInjected = "true"

      // Get the button's inner HTML
      const originalHTML = button.innerHTML

      // Check if it already has our tooltip
      if (originalHTML.includes("randomize-direct-tooltip")) return

      // Replace the tooltip content
      const newHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
        Randomize Rarities (tiered)
        <div class="randomize-direct-tooltip">
          Assign random rarities based on tiers:<br>
          • Mythic (3%)<br>
          • Legendary (5%)<br>
          • Epic (12%)<br>
          • Rare (20%)<br>
          • Uncommon (25%)<br>
          • Common (35%)
        </div>
      `

      // Update the button's HTML
      button.innerHTML = newHTML

      console.log("Injected direct tooltip into button:", button)
    })
  }

  // Run immediately
  injectRandomizeTooltips()

  // Run again when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectRandomizeTooltips)
  }

  // Set up a MutationObserver to detect when new buttons are added
  const observer = new MutationObserver((mutations) => {
    let shouldInject = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (node.classList && node.classList.contains("randomize-rarities-tiered-btn")) {
              shouldInject = true
            } else if (node.querySelector && node.querySelector(".randomize-rarities-tiered-btn")) {
              shouldInject = true
            }
          }
        })
      }
    })

    if (shouldInject) {
      setTimeout(injectRandomizeTooltips, 50)
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
      setTimeout(injectRandomizeTooltips, 100)
    }
  })
})()
