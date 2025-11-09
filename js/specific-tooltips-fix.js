/**
 * Specific Tooltips Fix
 * This script specifically targets and fixes tooltips for:
 * 1. "Randomize Rarities (tiered)" button
 * 2. Trait buttons and sliders (when trait layer is expanded)
 * 3. Combination rules header buttons (edit rule and delete rule buttons)
 */

;(() => {
  // Configuration for specific tooltips
  const TOOLTIP_CONFIG = {
    // Randomize rarities button tooltip content
    randomizeRarities: `
      Assign random rarities based on tiers:<br>
      • Mythic (3%)<br>
      • Legendary (5%)<br>
      • Epic (12%)<br>
      • Rare (20%)<br>
      • Uncommon (25%)<br>
      • Common (35%)
    `,

    // Selectors for elements that should have tooltips
    selectors: {
      // Randomize rarities button
      randomizeRaritiesBtn: ".randomize-rarities-tiered-btn",

      // Trait buttons (only when trait layer is expanded)
      traitButtons: ".trait-layer-content.expanded .trait-item .action-btn",

      // Trait sliders (only when trait layer is expanded)
      traitSliders: ".trait-layer-content.expanded .trait-rarity-slider",

      // Combination rules buttons
      combinationRuleButtons: ".rule-actions .action-btn",
    },
  }

  // Function to create and position a tooltip
  function createTooltip(element, content) {
    // Skip if already processed
    if (element.dataset.specificTooltipApplied === "true") return

    // Mark as processed
    element.dataset.specificTooltipApplied = "true"

    // Create tooltip element
    const tooltip = document.createElement("div")
    tooltip.className = "specific-tooltip"
    tooltip.innerHTML = content
    tooltip.style.display = "none"

    // Add tooltip to document body for absolute positioning
    document.body.appendChild(tooltip)

    // Show tooltip on mouseenter
    element.addEventListener("mouseenter", () => {
      const rect = element.getBoundingClientRect()

      // Position the tooltip
      tooltip.style.position = "fixed"
      tooltip.style.zIndex = "9999999"
      tooltip.style.display = "block"

      // Calculate position (default: below the element)
      let top = rect.bottom + 10
      let left = rect.left + rect.width / 2

      // Adjust if it would go off-screen
      if (top + tooltip.offsetHeight > window.innerHeight) {
        // Position above instead
        top = rect.top - tooltip.offsetHeight - 10
        tooltip.classList.add("tooltip-top")
      } else {
        tooltip.classList.remove("tooltip-top")
      }

      // Ensure it doesn't go off the sides
      if (left - tooltip.offsetWidth / 2 < 10) {
        left = tooltip.offsetWidth / 2 + 10
      } else if (left + tooltip.offsetWidth / 2 > window.innerWidth - 10) {
        left = window.innerWidth - tooltip.offsetWidth / 2 - 10
      }

      tooltip.style.top = `${top}px`
      tooltip.style.left = `${left}px`
      tooltip.style.transform = "translateX(-50%)"

      console.log(`Showing tooltip for ${element.className}`)
    })

    // Hide tooltip on mouseleave
    element.addEventListener("mouseleave", () => {
      tooltip.style.display = "none"
    })

    return tooltip
  }

  // Function to apply tooltips to specific elements
  function applySpecificTooltips() {
    console.log("Applying specific tooltips")

    // 1. Randomize Rarities button
    document.querySelectorAll(TOOLTIP_CONFIG.selectors.randomizeRaritiesBtn).forEach((btn) => {
      if (!btn.dataset.specificTooltipApplied) {
        const tooltip = createTooltip(btn, TOOLTIP_CONFIG.randomizeRarities)
        tooltip.classList.add("randomize-tooltip")
      }
    })

    // 2. Trait buttons (when trait layer is expanded)
    document.querySelectorAll(TOOLTIP_CONFIG.selectors.traitButtons).forEach((btn) => {
      if (!btn.dataset.specificTooltipApplied) {
        // Get the tooltip text from the existing tooltiptext element
        const existingTooltip = btn.querySelector(".tooltiptext")
        const tooltipContent = existingTooltip ? existingTooltip.innerHTML : ""

        if (tooltipContent) {
          const tooltip = createTooltip(btn, tooltipContent)
          tooltip.classList.add("trait-button-tooltip")
        }
      }
    })

    // 3. Combination rule buttons
    document.querySelectorAll(TOOLTIP_CONFIG.selectors.combinationRuleButtons).forEach((btn) => {
      if (!btn.dataset.specificTooltipApplied) {
        // Determine tooltip content based on button class
        let tooltipContent = ""

        if (btn.classList.contains("edit-rule")) {
          tooltipContent = "Edit rule"
        } else if (btn.classList.contains("delete-rule")) {
          tooltipContent = "Delete rule"
        }

        if (tooltipContent) {
          const tooltip = createTooltip(btn, tooltipContent)
          tooltip.classList.add("rule-button-tooltip")
        }
      }
    })
  }

  // Function to handle trait layer expansion
  function handleTraitLayerExpansion() {
    document.body.addEventListener("click", (event) => {
      // Check if a trait layer arrow or header was clicked
      const arrow = event.target.closest(".trait-layer-arrow")
      const header = event.target.closest(".trait-layer-header")

      if (
        arrow ||
        (header &&
          !event.target.closest(".action-btn") &&
          !event.target.closest(".position-btn") &&
          !event.target.closest(".trait-layer-drag-handle") &&
          !event.target.closest(".trait-layer-header-rarity"))
      ) {
        // Wait for the content to expand
        setTimeout(applySpecificTooltips, 100)
      }
    })
  }

  // Run immediately
  applySpecificTooltips()
  handleTraitLayerExpansion()

  // Run again when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      applySpecificTooltips()
      handleTraitLayerExpansion()
    })
  }

  // Set up a MutationObserver to detect when new elements are added
  const observer = new MutationObserver((mutations) => {
    let shouldApply = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            // Check if any of our target elements were added
            if (
              (node.classList &&
                (node.classList.contains("randomize-rarities-tiered-btn") ||
                  node.classList.contains("trait-item") ||
                  node.classList.contains("rule-actions"))) ||
              (node.querySelector &&
                (node.querySelector(".randomize-rarities-tiered-btn") ||
                  node.querySelector(".trait-item .action-btn") ||
                  node.querySelector(".rule-actions .action-btn")))
            ) {
              shouldApply = true
            }
          }
        })
      }
    })

    if (shouldApply) {
      setTimeout(applySpecificTooltips, 50)
    }
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Also check for class changes that might indicate expansion
  const classObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "class" &&
        mutation.target.classList.contains("expanded")
      ) {
        setTimeout(applySpecificTooltips, 50)
      }
    })
  })

  // Start observing class changes
  classObserver.observe(document.body, {
    attributes: true,
    attributeFilter: ["class"],
    subtree: true,
  })

  // Handle window resize to reposition visible tooltips
  window.addEventListener("resize", () => {
    const visibleTooltips = document.querySelectorAll(".specific-tooltip[style*='display: block']")
    if (visibleTooltips.length > 0) {
      // Hide all tooltips on resize
      visibleTooltips.forEach((tooltip) => {
        tooltip.style.display = "none"
      })
    }
  })

  // Handle scroll events to reposition visible tooltips
  window.addEventListener(
    "scroll",
    () => {
      const visibleTooltips = document.querySelectorAll(".specific-tooltip[style*='display: block']")
      if (visibleTooltips.length > 0) {
        // Hide all tooltips on scroll
        visibleTooltips.forEach((tooltip) => {
          tooltip.style.display = "none"
        })
      }
    },
    true,
  )
})()
