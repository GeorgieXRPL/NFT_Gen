// Consolidated Tooltip Handler
document.addEventListener("DOMContentLoaded", () => {
  // Function to position tooltip to ensure it's fully visible
  function positionTooltip(parent, tooltip) {
    // Get the parent's position and dimensions
    const parentRect = parent.getBoundingClientRect()
    const viewportHeight = window.innerHeight
    const viewportWidth = window.innerWidth

    // Reset any previous positioning to get the natural size
    tooltip.style.top = ""
    tooltip.style.left = ""
    tooltip.style.bottom = ""
    tooltip.style.right = ""

    // Make sure tooltip is visible to get its dimensions
    const originalVisibility = tooltip.style.visibility
    const originalOpacity = tooltip.style.opacity
    tooltip.style.visibility = "visible"
    tooltip.style.opacity = "0"

    // Get the tooltip's dimensions
    const tooltipRect = tooltip.getBoundingClientRect()

    // Restore original visibility
    tooltip.style.visibility = originalVisibility
    tooltip.style.opacity = originalOpacity

    // Default position (above the element)
    let top = parentRect.top - tooltipRect.height - 10 // 10px gap
    let left = parentRect.left + parentRect.width / 2 - tooltipRect.width / 2

    // Check if tooltip would go off the top of the screen
    if (top < 10) {
      // Position below the element instead
      top = parentRect.bottom + 10
      tooltip.classList.add("tooltip-bottom")
    } else {
      tooltip.classList.remove("tooltip-bottom")
    }

    // Check if tooltip would go off the left of the screen
    if (left < 10) {
      left = 10
      tooltip.classList.add("tooltip-left")
    } else {
      tooltip.classList.remove("tooltip-left")
    }

    // Check if tooltip would go off the right of the screen
    if (left + tooltipRect.width > viewportWidth - 10) {
      left = viewportWidth - tooltipRect.width - 10
      tooltip.classList.add("tooltip-right")
    } else {
      tooltip.classList.remove("tooltip-right")
    }

    // Set the position
    tooltip.style.top = `${top}px`
    tooltip.style.left = `${left}px`

    // Ensure tooltip is visible
    tooltip.style.visibility = "visible"

    // Force the tooltip to be on top of everything
    tooltip.style.zIndex = "999999"
  }

  // Function to initialize tooltips
  function initTooltips() {
    // Add event listeners to all tooltip elements
    const tooltips = document.querySelectorAll(".tooltip")

    tooltips.forEach((tooltip) => {
      const tooltipText = tooltip.querySelector(".tooltiptext")
      if (!tooltipText) return

      // CRITICAL: Skip navigation tabs - they are handled by navigation.js with proper 1-second delay
      if (tooltip.classList.contains('nav-tab') || tooltip.closest('.nav-tabs')) {
        // Navigation tabs are handled by navigation.js setupNavTabTooltip
        // Ensure tooltip stays hidden - navigation.js will control it with 1-second delay
        tooltipText.style.visibility = "hidden"
        tooltipText.style.opacity = "0"
        return // Skip - handled by navigation.js with 1-second delay
      }
      
      // Skip if this tooltip is inside the export tab (handled by export-nfts-module.js)
      const exportTab = document.getElementById("export-nfts")
      if (exportTab && exportTab.contains(tooltip)) {
        // Ensure tooltip stays hidden and off-screen - JavaScript will control it
        tooltipText.style.visibility = "hidden"
        tooltipText.style.opacity = "0"
        tooltipText.style.top = "-9999px"
        tooltipText.style.left = "-9999px"
        tooltipText.style.transform = "none"
        return // Skip - handled by export-nfts-module.js with 1-second delay
      }

      // CRITICAL: Skip buttons that are handled by trait-layers.js setupTooltipPositioning
      // These buttons have their tooltips set up explicitly with proper positioning
      const buttonIds = [
        "add-layer-btn",
        "add-folders-btn", 
        "delete-all-layers",
        "jump-to-rules-btn",
        "jump-to-rules-bottom-btn",
        "jump-to-layers-btn",
        "jump-to-layers-bottom-btn"
      ]
      
      // CRITICAL: Skip randomize and normalize rarities buttons - handled by trait-layers.js
      const isRarityButton = tooltip.classList.contains('randomize-rarities-tiered-btn') ||
                             tooltip.classList.contains('randomize-unique-rarities-btn') ||
                             tooltip.classList.contains('normalize-unique-rarities-btn') ||
                             tooltip.classList.contains('normalize-rarities-btn');
      
      // CRITICAL: Skip trait layer header buttons (position-btn, rename-layer, delete-layer)
      // These are handled by trait-layers.js setupTooltipPositioning with local implementation
      const isTraitLayerHeaderButton = tooltip.classList.contains('position-btn') || 
                                        tooltip.classList.contains('rename-layer') || 
                                        tooltip.classList.contains('delete-layer') ||
                                        tooltip.classList.contains('action-btn') ||
                                        tooltip.closest('.trait-layer-header');
      
      // Check if the tooltip element itself is one of these buttons (the tooltip element IS the button with class "tooltip")
      if (buttonIds.some(id => tooltip.id === id || tooltip.classList.contains(id.replace("#", "").replace(".", "")))) {
        // Skip - these are handled by trait-layers.js setupTooltipPositioning
        return
      }
      
      // CRITICAL: Skip trait layer header buttons - they are handled by trait-layers.js
      if (isTraitLayerHeaderButton) {
        // Ensure tooltip stays hidden - trait-layers.js will control it with 1-second delay
        tooltipText.style.visibility = "hidden"
        tooltipText.style.opacity = "0"
        return // Skip - handled by trait-layers.js setupTooltipPositioning with local implementation
      }
      
      // CRITICAL: Skip randomize and normalize rarities buttons - handled by trait-layers.js
      if (isRarityButton) {
        // Ensure tooltip stays hidden - trait-layers.js will control it with 1-second delay
        tooltipText.style.visibility = "hidden"
        tooltipText.style.opacity = "0"
        return // Skip - handled by trait-layers.js setupTooltipPositioning
      }

      // Store timeout reference
      let tooltipTimeout = null

      // CRITICAL: Ensure tooltip has transition for fade in/out (1 second to match Export NFTs tab)
      tooltipText.style.transition = "opacity 1s ease"
      
      // CRITICAL: Ensure orange text on black background
      tooltipText.style.setProperty("background-color", "#000000", "important")
      tooltipText.style.setProperty("background", "#000000", "important")
      tooltipText.style.setProperty("color", "#f39c12", "important")
      
      // CRITICAL: Add cursor help to parent element
      tooltip.style.cursor = "help"

      // Add mouseenter event to position the tooltip with 1-second delay (applies to ALL tooltips)
      tooltip.addEventListener("mouseenter", () => {
        // Clear any existing timeout
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout)
          tooltipTimeout = null
        }

        // 1-second delay for ALL tooltips across the entire app
        tooltipTimeout = setTimeout(() => {
        positionTooltip(tooltip, tooltipText)
          // Fade in with transition
          requestAnimationFrame(() => {
            tooltipText.style.opacity = "1"
            tooltipText.style.visibility = "visible"
          })
          tooltipTimeout = null
        }, 1000)
      })

      // Add mouseleave to clear timeout and fade out
      tooltip.addEventListener("mouseleave", () => {
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout)
          tooltipTimeout = null
        }
        // Fade out with transition
        if (tooltipText) {
          tooltipText.style.opacity = "0"
          // Hide after fade completes (1 second to match Export NFTs tab)
          setTimeout(() => {
            tooltipText.style.visibility = "hidden"
          }, 1000) // Match transition duration
        }
      })

      // Add mousemove event to update position on mouse movement
      tooltip.addEventListener("mousemove", () => {
        // Only update position if tooltip is already visible
        if (tooltipText.style.visibility === "visible" || tooltipText.style.opacity === "1") {
        positionTooltip(tooltip, tooltipText)
        }
      })
    })
  }

  // Initialize tooltips
  initTooltips()

  // CRITICAL: Skip randomize tooltip handler - these buttons are now handled by trait-layers.js setupTooltipPositioning
  // This function is kept for backward compatibility but should not interfere
  function handleRandomizeTooltip() {
    // Skip - handled by trait-layers.js setupTooltipPositioning
    return;
    
    /* DISABLED - Now handled by trait-layers.js
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")

    randomizeButtons.forEach((button) => {
      const tooltip = button.querySelector(".tooltiptext.randomize-tooltip")
      if (!tooltip) return

      let randomizeTooltipTimeout = null
      button.addEventListener("mouseenter", () => {
        // Clear any existing timeout
        if (randomizeTooltipTimeout) {
          clearTimeout(randomizeTooltipTimeout)
          randomizeTooltipTimeout = null
        }

        // Check if we're in the export tab
        const exportTab = document.getElementById("export-nfts")
        const isInExportTab = exportTab && exportTab.contains(button)

        // CRITICAL: Ensure tooltip has transition for fade in/out (1 second to match Export NFTs tab)
        tooltip.style.transition = "opacity 1s ease"
        
        // CRITICAL: Ensure orange text on black background
        tooltip.style.setProperty("background-color", "#000000", "important")
        tooltip.style.setProperty("background", "#000000", "important")
        tooltip.style.setProperty("color", "#f39c12", "important")
        
        // CRITICAL: Add cursor help to button
        button.style.cursor = "help"

        const showTooltip = () => {
        // Position the tooltip above the button (centered)
        const buttonRect = button.getBoundingClientRect()

        // Make tooltip visible to get its dimensions
        tooltip.style.visibility = "visible"
        tooltip.style.opacity = "0"
        const tooltipRect = tooltip.getBoundingClientRect()

        // Position the tooltip above and centered
        const tooltipWidth = tooltipRect.width || 200
        const tooltipHeight = tooltipRect.height
        tooltip.style.position = "fixed"
        tooltip.style.top = `${buttonRect.top - tooltipHeight - 5}px`
        tooltip.style.left = `${buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2)}px`
        tooltip.style.zIndex = "2147483647"
        tooltip.style.transform = "none"

          // Fade in with transition
          requestAnimationFrame(() => {
            tooltip.style.opacity = "1"
            tooltip.style.visibility = "visible"
          })
        }

        // 1-second delay for ALL tooltips across the entire app
        randomizeTooltipTimeout = setTimeout(() => {
          showTooltip()
          randomizeTooltipTimeout = null
        }, 1000)
      })

      button.addEventListener("mouseleave", () => {
        // Clear timeout if mouse leaves before delay completes
        if (randomizeTooltipTimeout) {
          clearTimeout(randomizeTooltipTimeout)
          randomizeTooltipTimeout = null
        }
        // Fade out with transition
        tooltip.style.opacity = "0"
        // Hide after fade completes (1 second to match Export NFTs tab)
        setTimeout(() => {
          tooltip.style.visibility = "hidden"
        }, 1000) // Match transition duration
      })
    })
    */
  }

  // Call the function after initializing tooltips
  handleRandomizeTooltip()

  // Set up mutation observer to detect new tooltips
  const observer = new MutationObserver((mutations) => {
    let shouldRefreshTooltips = false

    mutations.forEach((mutation) => {
      if (mutation.type === "childList" && mutation.addedNodes.length) {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            // Element node
            if (
              (node.classList && node.classList.contains("tooltip")) ||
              (node.querySelector && node.querySelector(".tooltip"))
            ) {
              shouldRefreshTooltips = true
            }
          }
        })
      }
    })

    // Also add it to the observer callback
    if (shouldRefreshTooltips) {
      initTooltips()
      handleRandomizeTooltip() // Add this line
    }
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  })

  // Add window resize listener to reposition tooltips
  window.addEventListener("resize", () => {
    const visibleTooltips = document.querySelectorAll(".tooltip:hover .tooltiptext")
    visibleTooltips.forEach((tooltip) => {
      const parent = tooltip.closest(".tooltip")
      if (parent) {
        positionTooltip(parent, tooltip)
      }
    })
  })

  // Add scroll listener to reposition tooltips
  window.addEventListener(
    "scroll",
    () => {
      const visibleTooltips = document.querySelectorAll(".tooltip:hover .tooltiptext")
      visibleTooltips.forEach((tooltip) => {
        const parent = tooltip.closest(".tooltip")
        if (parent) {
          positionTooltip(parent, tooltip)
        }
      })
    },
    true,
  )
})
