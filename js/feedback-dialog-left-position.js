// Feedback Dialog Left Position - Ensures notifications are positioned to the left of the "New Project" button
document.addEventListener("DOMContentLoaded", () => {
  console.log("Feedback Dialog Left Position: Initializing...")

  // Function to force the left positioning of notifications
  function forceLeftPositioning() {
    // Find all notification containers
    const containers = document.querySelectorAll(".fixed-notification-container")

    if (containers.length === 0) {
      console.log("Feedback Dialog Left Position: No containers found")
      return false
    }

    // Find the "New Project" button
    const newProjectBtn =
      document.querySelector(".btn-new") ||
      document.querySelector("[data-action='new-project']") ||
      document.querySelector("button:contains('New Project')")

    if (!newProjectBtn) {
      console.log("Feedback Dialog Left Position: New Project button not found")
      return false
    }

    // Get button position
    const btnRect = newProjectBtn.getBoundingClientRect()
    const topPosition = btnRect.top - 30 // Position above the button
    const leftPosition = btnRect.left // Align with the left edge of the button

    // Apply position to all containers
    containers.forEach((container) => {
      container.style.top = `${topPosition}px`
      container.style.left = `${leftPosition}px`
      container.style.right = "auto"
      container.style.transform = "none"
      container.classList.add("feedback-left-aligned")
    })

    console.log(`Feedback Dialog Left Position: Positioned at top: ${topPosition}px, left: ${leftPosition}px`)
    return true
  }

  // Apply positioning immediately and periodically
  if (!forceLeftPositioning()) {
    const interval = setInterval(() => {
      if (forceLeftPositioning()) {
        clearInterval(interval)
      }
    }, 500)
  }

  // Apply positioning when window is resized
  window.addEventListener("resize", forceLeftPositioning)

  // Apply positioning when scrolling
  window.addEventListener("scroll", forceLeftPositioning)

  // Apply positioning when DOM changes
  const observer = new MutationObserver(() => {
    forceLeftPositioning()
  })

  // Start observing the document body
  observer.observe(document.body, { childList: true, subtree: true })

  // Ensure positioning is applied after any potential UI updates
  setTimeout(forceLeftPositioning, 1000)
  setTimeout(forceLeftPositioning, 2000)
  setTimeout(forceLeftPositioning, 3000)
})
