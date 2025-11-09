// Title Case Fix - This script ensures the title is in the correct case and not uppercase
document.addEventListener("DOMContentLoaded", () => {
  // Function to fix the title case
  function fixTitleCase() {
    console.log("Applying title case fix...")

    // Get the landing title element
    const landingTitle = document.querySelector(".landing-page .landing-title")

    if (landingTitle) {
      // Ensure the title has the correct case
      landingTitle.style.textTransform = "none"

      // Apply other styles to ensure they're not overridden
      landingTitle.style.letterSpacing = "-1px"
      landingTitle.style.fontWeight = "700"
      landingTitle.style.fontSize =
        window.innerWidth <= 480
          ? "2rem"
          : window.innerWidth <= 768
            ? "2.5rem"
            : window.innerWidth <= 1200
              ? "3rem"
              : "3.5rem"
    }

    // Get the title container
    const titleContainer = document.querySelector(".landing-page .title-container")

    if (titleContainer) {
      // Ensure the title container has the correct width
      titleContainer.style.width = "100%"
      titleContainer.style.maxWidth = "1200px"
      titleContainer.style.marginLeft = "auto"
      titleContainer.style.marginRight = "auto"
    }
  }

  // Apply the fix immediately
  fixTitleCase()

  // Apply the fix after a short delay
  setTimeout(fixTitleCase, 100)
  setTimeout(fixTitleCase, 500)
  setTimeout(fixTitleCase, 1000)

  // Apply the fix when the window is resized
  window.addEventListener("resize", fixTitleCase)

  // Apply the fix periodically to ensure it's not overridden
  setInterval(fixTitleCase, 1000)
})
