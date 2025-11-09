// Title Width Fix
document.addEventListener("DOMContentLoaded", () => {
  // Function to ensure the title container has the same width as the feature list
  function fixTitleWidth() {
    console.log("Applying title width fix")

    const titleContainer = document.querySelector(".title-container")
    const featureList = document.querySelector(".feature-list")

    if (titleContainer && featureList) {
      // Get the computed style of the feature list
      const featureListStyle = window.getComputedStyle(featureList)
      const featureListWidth = featureListStyle.width
      const featureListMaxWidth = featureListStyle.maxWidth

      // Apply the same width and max-width to the title container
      titleContainer.style.width = "100%"
      titleContainer.style.maxWidth = "1200px"
      titleContainer.style.marginLeft = "auto"
      titleContainer.style.marginRight = "auto"
      titleContainer.style.boxSizing = "border-box"
      titleContainer.style.paddingLeft = "1rem"
      titleContainer.style.paddingRight = "1rem"

      console.log(
        "Title width fix applied. Title container width:",
        titleContainer.style.width,
        "max-width:",
        titleContainer.style.maxWidth,
      )
    } else {
      console.warn("Could not find title container or feature list")
    }
  }

  // Apply the fix immediately
  fixTitleWidth()

  // Also apply the fix after a short delay to ensure all styles are loaded
  setTimeout(fixTitleWidth, 100)

  // Apply the fix when the window is resized
  window.addEventListener("resize", fixTitleWidth)
})
