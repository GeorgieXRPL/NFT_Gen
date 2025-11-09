// Feedback Position Updater - Ensures notifications stay positioned above the "New Project" button
;(() => {
  console.log("Feedback Position Updater: Initializing...")

  // Function to update the position of the notification container
  function updateNotificationPosition() {
    // Find the "New Project" button
    const newProjectBtn =
      document.querySelector(".btn-new") ||
      document.querySelector("[data-action='new-project']") ||
      document.querySelector("button:contains('New Project')")

    if (!newProjectBtn) {
      console.log("Feedback Position Updater: New Project button not found")
      return
    }

    // Find the notification container
    const notificationContainer = document.querySelector(".fixed-notification-container")

    if (!notificationContainer) {
      console.log("Feedback Position Updater: Notification container not found")
      return
    }

    // Position the container to align with the left edge of the New Project button
    const btnRect = newProjectBtn.getBoundingClientRect()
    const topPosition = btnRect.top - 30 // Position above the button
    const leftPosition = btnRect.left // Align with the left edge of the button

    notificationContainer.style.top = `${topPosition}px`
    notificationContainer.style.left = `${leftPosition}px`

    console.log(`Feedback Position Updater: Updated position to top: ${topPosition}px, left: ${leftPosition}px`)
  }

  // Update position when scrolling
  window.addEventListener("scroll", updateNotificationPosition)

  // Update position when resizing
  window.addEventListener("resize", updateNotificationPosition)

  // Update position periodically
  setInterval(updateNotificationPosition, 1000)

  // Initial update
  setTimeout(updateNotificationPosition, 500)
  setTimeout(updateNotificationPosition, 1000)
  setTimeout(updateNotificationPosition, 2000)
})()
