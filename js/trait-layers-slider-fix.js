// Trait layers slider fix
document.addEventListener("DOMContentLoaded", () => {
  console.log("Trait layers slider fix loaded")

  // Function to apply inline styles to all sliders
  function applySliderStyles() {
    // Get all sliders
    const sliders = document.querySelectorAll(".trait-layer-header-rarity-slider")
    const containers = document.querySelectorAll(".trait-layer-header-rarity")

    // Apply styles to containers
    containers.forEach((container) => {
      container.style.flex = "1 1 auto"
      container.style.width = "100%"
      container.style.minWidth = "300px"
      container.style.maxWidth = "none"
    })

    // Apply styles to sliders
    sliders.forEach((slider) => {
      slider.style.width = "100%"
      slider.style.flex = "1 1 auto"
      slider.style.minWidth = "200px"
      slider.style.height = "10px"
    })

    console.log(`Applied styles to ${sliders.length} sliders`)
  }

  // Override the trait layer HTML generation in the trait-layers.js file
  if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("traitLayers")) {
    const originalGenerateTraitLayerBar = window.NFTApp.getModule("traitLayers").generateTraitLayerBar

    if (originalGenerateTraitLayerBar) {
      window.NFTApp.getModule("traitLayers").generateTraitLayerBar = function (layer, index, sortedTraits) {
        // Call the original function
        const result = originalGenerateTraitLayerBar.call(this, layer, index, sortedTraits)

        // Apply our styles
        setTimeout(applySliderStyles, 0)

        return result
      }

      console.log("Successfully overrode trait layer bar generation function")
    }
  }

  // Apply styles immediately
  applySliderStyles()

  // Apply styles after a delay
  setTimeout(applySliderStyles, 500)
  setTimeout(applySliderStyles, 1500)

  // Apply styles when the window is resized
  window.addEventListener("resize", applySliderStyles)

  // Apply styles when any tab is clicked
  document.addEventListener("click", (e) => {
    if (e.target.closest(".nav-tab")) {
      // Execute immediately - no delay needed
      applySliderStyles()
    }
  })
})
