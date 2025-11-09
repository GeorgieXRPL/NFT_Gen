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

      // Add mouseenter event to position the tooltip
      tooltip.addEventListener("mouseenter", () => {
        positionTooltip(tooltip, tooltipText)
      })

      // Add mousemove event to update position on mouse movement
      tooltip.addEventListener("mousemove", () => {
        positionTooltip(tooltip, tooltipText)
      })
    })
  }

  // Initialize tooltips
  initTooltips()

  // Add a special function to handle the randomize tooltip
  function handleRandomizeTooltip() {
    const randomizeButtons = document.querySelectorAll(".randomize-rarities-tiered-btn")

    randomizeButtons.forEach((button) => {
      const tooltip = button.querySelector(".tooltiptext.randomize-tooltip")
      if (!tooltip) return

      button.addEventListener("mouseenter", () => {
        // Position the tooltip below the button
        const buttonRect = button.getBoundingClientRect()

        // Make tooltip visible to get its dimensions
        tooltip.style.visibility = "visible"
        tooltip.style.opacity = "0"
        const tooltipRect = tooltip.getBoundingClientRect()

        // Position the tooltip
        tooltip.style.top = `${buttonRect.bottom + 10}px`
        tooltip.style.left = `${buttonRect.left + (buttonRect.width / 2) - tooltipRect.width / 2}px`
        tooltip.style.visibility = "visible"
        tooltip.style.opacity = "1"
        tooltip.style.zIndex = "999999"

        // Add bottom class to ensure arrow points up
        tooltip.classList.add("tooltip-bottom")
      })

      button.addEventListener("mouseleave", () => {
        tooltip.style.visibility = "hidden"
        tooltip.style.opacity = "0"
      })
    })
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
