// Force slider width to take up all available space
;(() => {
  console.log("Force slider width script loaded")

  // Function to calculate and set the optimal slider width
  function forceSliderWidth() {
    console.log("Forcing slider width")

    // Get all trait layer headers
    const headers = document.querySelectorAll(".trait-layer-header")

    headers.forEach((header) => {
      // Get the components
      const info = header.querySelector(".trait-layer-info")
      const rarityContainer = header.querySelector(".trait-layer-header-rarity")
      const slider = rarityContainer ? rarityContainer.querySelector(".trait-layer-header-rarity-slider") : null
      const position = header.querySelector(".trait-layer-position")
      const actions = header.querySelector(".trait-layer-actions")
      const dragHandle = header.querySelector(".trait-layer-drag-handle")

      if (!rarityContainer || !slider) return

      // Calculate the available width
      const headerWidth = header.offsetWidth
      const infoWidth = info ? info.offsetWidth : 0
      const positionWidth = position ? position.offsetWidth : 0
      const actionsWidth = actions ? actions.offsetWidth : 0
      const dragHandleWidth = dragHandle ? dragHandle.offsetWidth : 0
      const valueWidth = rarityContainer.querySelector(".trait-layer-header-rarity-value")
        ? rarityContainer.querySelector(".trait-layer-header-rarity-value").offsetWidth
        : 0

      // Calculate padding and margins
      const padding = 40 // Estimate for padding and margins

      // Calculate the available width for the slider
      const availableWidth =
        headerWidth - infoWidth - positionWidth - actionsWidth - dragHandleWidth - valueWidth - padding

      // Set the width of the slider container
      rarityContainer.style.flex = "1 1 auto"
      rarityContainer.style.width = "100%"
      rarityContainer.style.minWidth = "300px"
      rarityContainer.style.maxWidth = "none"

      // Set the width of the slider itself
      slider.style.width = "100%"
      slider.style.flex = "1 1 auto"
      slider.style.minWidth = "200px"

      // Ensure the info section doesn't take too much space
      if (info) {
        info.style.flex = "0 0 auto"
        info.style.minWidth = "150px"
        info.style.maxWidth = "150px"
      }

      // Make sure the position controls and actions don't take too much space
      if (position) position.style.flex = "0 0 auto"
      if (actions) actions.style.flex = "0 0 auto"

      console.log(`Header width: ${headerWidth}px, Available for slider: ${availableWidth}px`)
    })
  }

  // Apply the fix at multiple points

  // 1. On DOMContentLoaded
  document.addEventListener("DOMContentLoaded", () => {
    console.log("DOMContentLoaded - applying slider width fix")
    forceSliderWidth()
  })

  // 2. After a short delay
  setTimeout(forceSliderWidth, 500)

  // 3. After a longer delay
  setTimeout(forceSliderWidth, 1500)

  // 4. On window load
  window.addEventListener("load", () => {
    console.log("Window loaded - applying slider width fix")
    forceSliderWidth()

    // Apply again after a short delay
    setTimeout(forceSliderWidth, 500)
  })

  // 5. When trait layers are added or modified
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "childList" || (mutation.type === "attributes" && mutation.attributeName === "class")) {
        console.log("DOM mutation detected - applying slider width fix")
        forceSliderWidth()

        // Apply again after a short delay to ensure everything is rendered
        setTimeout(forceSliderWidth, 200)
      }
    })
  })

  // Start observing once the DOM is ready
  document.addEventListener("DOMContentLoaded", () => {
    const traitLayersContainer = document.getElementById("trait-layers-container")
    if (traitLayersContainer) {
      observer.observe(traitLayersContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["class"],
      })
      console.log("Mutation observer started for trait layers container")
    }
  })

  // 6. Apply when a trait layer is expanded
  document.addEventListener("click", (e) => {
    const header = e.target.closest(".trait-layer-header")
    if (header) {
      // Wait for the expansion animation to complete
      setTimeout(forceSliderWidth, 300)
    }
  })

  // 7. Apply when the window is resized
  window.addEventListener("resize", () => {
    console.log("Window resized - applying slider width fix")
    forceSliderWidth()
  })

  // 8. Apply when any tab is clicked (in case trait layers are in a tab)
  document.addEventListener("click", (e) => {
    if (e.target.closest(".nav-tab")) {
      console.log("Tab clicked - applying slider width fix")
      setTimeout(forceSliderWidth, 300)
    }
  })

  // 9. Add a direct style tag to the head for maximum override
  const styleTag = document.createElement("style")
  styleTag.textContent = `
    .trait-layer-header .trait-layer-header-rarity {
      flex: 1 1 auto !important;
      width: 100% !important;
      min-width: 300px !important;
      max-width: none !important;
    }
    
    .trait-layer-header .trait-layer-header-rarity .trait-layer-header-rarity-slider {
      width: 100% !important;
      min-width: 200px !important;
      flex: 1 1 auto !important;
      height: 10px !important;
    }
  `
  document.head.appendChild(styleTag)
  console.log("Added inline style tag for slider width")
})()
