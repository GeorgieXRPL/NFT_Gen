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

  // Position tooltips on window resize
  window.addEventListener("resize", positionTooltips)

  // Position tooltips on scroll
  document.addEventListener("scroll", positionTooltips)

  // Set up a MutationObserver to handle dynamically added tooltips
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        positionTooltips()
      }
    })
  })

  observer.observe(document.body, { childList: true, subtree: true })
})
