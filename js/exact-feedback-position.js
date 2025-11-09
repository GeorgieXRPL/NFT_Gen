// Exact Feedback Position - Forces feedback dialogs to align exactly with the left edge of the "New Project" button
document.addEventListener("DOMContentLoaded", () => {
  console.log("Exact Feedback Position: Initializing...")

  // Function to force exact positioning
  function forceExactPositioning() {
    // Find the "New Project" button with multiple selectors for reliability
    const newProjectBtn =
      document.querySelector(".btn-new") ||
      document.querySelector("[data-action='new-project']") ||
      document.querySelector("button:contains('New Project')") ||
      Array.from(document.querySelectorAll("button")).find((btn) =>
        btn.textContent.toLowerCase().includes("new project"),
      )

    if (!newProjectBtn) {
      console.log("Exact Feedback Position: New Project button not found")
      return false
    }

    // Find all notification containers and notifications
    const containers = document.querySelectorAll(".fixed-notification-container")
    const notifications = document.querySelectorAll(".notification")

    if (containers.length === 0 && notifications.length === 0) {
      console.log("Exact Feedback Position: No notifications found")
      return false
    }

    // Get exact button position
    const btnRect = newProjectBtn.getBoundingClientRect()
    const topPosition = btnRect.top - 30 // Position above the button
    const leftPosition = btnRect.left // Align with the left edge of the button

    // Apply position to all containers
    containers.forEach((container) => {
      container.style.position = "fixed !important"
      container.style.top = `${topPosition}px`
      container.style.left = `${leftPosition}px`
      container.style.right = "auto"
      container.style.bottom = "auto"
      container.style.transform = "none"

      // Apply inline !important styles
      container.setAttribute(
        "style",
        `
        position: fixed !important;
        top: ${topPosition}px !important;
        left: ${leftPosition}px !important;
        right: auto !important;
        bottom: auto !important;
        transform: none !important;
        z-index: 9999999 !important;
      `,
      )
    })

    // If no containers but direct notifications exist, position them directly
    if (containers.length === 0 && notifications.length > 0) {
      notifications.forEach((notification) => {
        notification.style.position = "fixed"
        notification.style.top = `${topPosition}px`
        notification.style.left = `${leftPosition}px`
        notification.style.right = "auto"
        notification.style.transform = "none"
        notification.style.fontSize = "8px"

        // Apply inline !important styles
        notification.setAttribute(
          "style",
          `
          position: fixed !important;
          top: ${topPosition}px !important;
          left: ${leftPosition}px !important;
          right: auto !important;
          transform: none !important;
          font-size: 8px !important;
          z-index: 9999999 !important;
        `,
        )
      })
    }

    console.log(`Exact Feedback Position: Positioned at top: ${topPosition}px, left: ${leftPosition}px`)
    return true
  }

  // Apply positioning immediately and periodically
  forceExactPositioning()

  // Set up continuous monitoring
  setInterval(forceExactPositioning, 500)

  // Apply positioning when window is resized
  window.addEventListener("resize", forceExactPositioning)

  // Apply positioning when scrolling
  window.addEventListener("scroll", forceExactPositioning)

  // Apply positioning when DOM changes
  const observer = new MutationObserver(() => {
    forceExactPositioning()
  })

  // Start observing the document body
  observer.observe(document.body, { childList: true, subtree: true })
})
