// Tooltip Handler Module
window.NFTApp.registerModule("tooltipHandler", {
  setup: function () {
    console.log("Setting up tooltip handler module")

    // Initialize tooltips
    this.initTooltips()

    // Set up event listeners
    this.setupEventListeners()
  },

  initTooltips: function () {
    // Position all tooltips on the page
    this.positionTooltips()
  },

  setupEventListeners: function () {
    // Position tooltips on window resize
    window.addEventListener("resize", this.positionTooltips.bind(this))

    // Position tooltips on scroll
    document.addEventListener("scroll", this.positionTooltips.bind(this))

    // Set up a MutationObserver to handle dynamically added tooltips
    const observer = new MutationObserver(this.handleDOMChanges.bind(this))
    observer.observe(document.body, { childList: true, subtree: true })
  },

  handleDOMChanges: function (mutations) {
    mutations.forEach(
      function (mutation) {
        if (mutation.addedNodes.length) {
          this.positionTooltips()
        }
      }.bind(this),
    )
  },

  positionTooltips: () => {
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
      tooltipText.className = "tooltiptext"

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

      // Special handling for randomize tooltip
      if (tooltipText.textContent.includes("Assign random rarities based on tiers")) {
        tooltipText.classList.add("randomize-tooltip")
      }
    })
  },
})
