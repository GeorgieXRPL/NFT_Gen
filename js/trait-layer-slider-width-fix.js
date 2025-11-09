document.addEventListener("DOMContentLoaded", () => {
  console.log("Applying trait layer slider width fix")

  // Function to apply the fix
  function applySliderWidthFix() {
    // Get all trait layer header rarity containers
    const rarityContainers = document.querySelectorAll(".trait-layer-header-rarity")

    rarityContainers.forEach((container) => {
      // Ensure the container takes up all available space
      container.style.flex = "1"
      container.style.width = "100%"
      container.style.maxWidth = "none"

      // Find the slider within this container
      const slider = container.querySelector(".trait-layer-header-rarity-slider")
      if (slider) {
        // Make the slider take up all available space
        slider.style.width = "100%"
        slider.style.flex = "1"
      }
    })

    console.log("Trait layer slider width fix applied to", rarityContainers.length, "sliders")
  }

  // Apply immediately
  applySliderWidthFix()

  // Also apply after a short delay to ensure DOM is fully rendered
  setTimeout(applySliderWidthFix, 500)

  // Apply whenever trait layers are updated
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length > 0) {
        // Check if any trait layers were added
        mutation.addedNodes.forEach((node) => {
          if (
            node.classList &&
            (node.classList.contains("trait-layer-bar") ||
              (node.querySelector && node.querySelector(".trait-layer-bar")))
          ) {
            applySliderWidthFix()
          }
        })
      }
    })
  })

  // Start observing the trait layers container
  const traitLayersContainer = document.getElementById("trait-layers-container")
  if (traitLayersContainer) {
    observer.observe(traitLayersContainer, { childList: true, subtree: true })
  }
})
