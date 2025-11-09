/**
 * Direct Tooltip Injection
 * This script directly injects tooltips into the DOM for specific buttons
 * that absolutely need tooltips to be visible
 */

;(() => {
  // Function to directly inject tooltips
  function injectTooltips() {
    console.log("Injecting tooltips directly")

    // 1. Randomize Rarities button
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")
    randomizeButtons.forEach((btn) => {
      // Skip if already processed
      if (btn.dataset.tooltipInjected === "true") return

      // Mark as processed
      btn.dataset.tooltipInjected = "true"

      // Get the button's inner HTML
      const originalHTML = btn.innerHTML

      // Check if it already has our tooltip
      if (originalHTML.includes("injected-tooltip")) return

      // Extract the text content
      const textContent = btn.textContent.trim()

      // Replace with new HTML including tooltip
      btn.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <polyline points="16 3 21 3 21 8"></polyline>
          <line x1="4" y1="20" x2="21" y2="3"></line>
          <polyline points="21 16 21 21 16 21"></polyline>
          <line x1="15" y1="15" x2="21" y2="21"></line>
          <line x1="4" y1="4" x2="9" y2="9"></line>
        </svg>
        ${textContent}
        <div class="injected-tooltip randomize-tooltip">
          Assign random rarities based on tiers:<br>
          • Mythic (3%)<br>
          • Legendary (5%)<br>
          • Epic (12%)<br>
          • Rare (20%)<br>
          • Uncommon (25%)<br>
          • Common (35%)
        </div>
      `
    })

    // 2. Combination rule buttons
    const ruleButtons = document.querySelectorAll(".rule-actions .action-btn")
    ruleButtons.forEach((btn) => {
      // Skip if already processed
      if (btn.dataset.tooltipInjected === "true") return

      // Mark as processed
      btn.dataset.tooltipInjected = "true"

      // Determine tooltip content based on button class
      let tooltipContent = ""
      if (btn.classList.contains("edit-rule")) {
        tooltipContent = "Edit rule"
      } else if (btn.classList.contains("delete-rule")) {
        tooltipContent = "Delete rule"
      }

      if (tooltipContent) {
        // Get the button's inner HTML
        const originalHTML = btn.innerHTML

        // Check if it already has our tooltip
        if (originalHTML.includes("injected-tooltip")) return

        // Add tooltip
        btn.innerHTML = `
          ${originalHTML}
          <div class="injected-tooltip rule-tooltip">${tooltipContent}</div>
        `
      }
    })
  }

  // Run immediately
  injectTooltips()

  // Run again when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectTooltips)
  }

  // Set up a MutationObserver to detect when new buttons are added
  const observer = new MutationObserver((mutations) => {
    let shouldInject = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (
              (node.classList &&
                (node.classList.contains("randomize-rarities-tiered-btn") || node.classList.contains("rule-actions"))) ||
              (node.querySelector &&
                (node.querySelector(".randomize-rarities-tiered-btn") || node.querySelector(".rule-actions .action-btn")))
            ) {
              shouldInject = true
            }
          }
        })
      }
    })

    if (shouldInject) {
      setTimeout(injectTooltips, 50)
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
      setTimeout(injectTooltips, 100)
    }
  })
})()
