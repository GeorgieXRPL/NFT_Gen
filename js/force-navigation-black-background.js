// Force navigation black background
document.addEventListener("DOMContentLoaded", () => {
  console.log("Forcing navigation black background")

  // Function to apply black background to navigation elements
  function forceNavigationBlackBackground() {
    // Get all navigation elements
    const navElements = document.querySelectorAll(
      ".nav-container, .nav-header, .nav-tabs-container, .nav-tabs, .nav-header-content, .nav-actions, .project-actions",
    )

    // Apply black background to all navigation elements
    navElements.forEach((element) => {
      element.style.backgroundColor = "#000000"
      element.style.borderBottom = "none"
      element.style.borderTop = "none"
    })

    // Get all child elements of navigation elements
    const navChildElements = document.querySelectorAll(
      ".nav-container *, .nav-header *, .nav-tabs-container *, .nav-tabs *, .nav-header-content *, .nav-actions *, .project-actions *",
    )

    // Apply black background to all child elements of navigation elements
    navChildElements.forEach((element) => {
      // Skip buttons that should maintain their styling
      if (!element.classList.contains("btn") && !element.classList.contains("nav-tab")) {
        element.style.backgroundColor = "#000000"
      }
    })

    console.log("Navigation black background applied")
  }

  // Apply black background immediately
  forceNavigationBlackBackground()

  // Apply black background after a short delay to ensure it overrides any other styles
  setTimeout(forceNavigationBlackBackground, 100)

  // Apply black background after the page has fully loaded
  window.addEventListener("load", forceNavigationBlackBackground)

  // Apply black background whenever the navigation is shown
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === "attributes" && mutation.attributeName === "style") {
        const navContainer = document.querySelector(".nav-container")
        if (navContainer && navContainer.style.display !== "none") {
          forceNavigationBlackBackground()
        }
      }
    })
  })

  const navContainer = document.querySelector(".nav-container")
  if (navContainer) {
    observer.observe(navContainer, { attributes: true })
  }
})
