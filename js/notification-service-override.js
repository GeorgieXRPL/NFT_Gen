// Notification Service Override - Ensures all notifications use the new style
;(() => {
  console.log("Notification Service Override: Initializing...")

  // Function to override the notification service
  function overrideNotificationService() {
    if (!window.NFTApp || !window.NFTApp.notificationService) {
      console.log("Notification Service Override: NFTApp.notificationService not found, will retry")
      return false
    }

    // Store the original show method
    const originalShow = window.NFTApp.notificationService.show

    // Override the show method
    window.NFTApp.notificationService.show = (message, type, duration) => {
      console.log(`Notification Service Override: Showing notification: ${message}`)

      // Create notification container if it doesn't exist
      let container = document.querySelector(".fixed-notification-container")
      if (!container) {
        container = document.createElement("div")
        container.className = "fixed-notification-container feedback-fixed-position"
        document.body.appendChild(container)
        console.log("Notification Service Override: Created new container")
      } else if (!container.classList.contains("feedback-fixed-position")) {
        container.classList.add("feedback-fixed-position")
        console.log("Notification Service Override: Added feedback-fixed-position class to container")
      }

      // Create the notification element
      const notification = document.createElement("div")
      notification.className = `notification notification-${type} feedback-single-line`

      // Icon based on notification type
      let iconSvg = ""
      switch (type) {
        case "success":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
          break
        case "error":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
          break
        case "warning":
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
          break
        default:
          iconSvg =
            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
      }

      // Build notification content
      notification.innerHTML = `
        <div class="notification-icon">
          ${iconSvg}
        </div>
        <div class="notification-message feedback-message-text">${message}</div>
        <button class="notification-close">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      `

      // Add to container
      container.appendChild(notification)

      // Add close button functionality
      const closeBtn = notification.querySelector(".notification-close")
      closeBtn.addEventListener("click", () => {
        notification.remove()
      })

      // Auto-remove after duration
      setTimeout(() => {
        if (notification.parentNode) {
          notification.style.opacity = "0"
          notification.style.transform = "translateX(30px)"

          setTimeout(() => {
            if (notification.parentNode) {
              notification.remove()
            }
          }, 300)
        }
      }, duration || 3000)

      // Update position
      updateNotificationPosition()

      return notification
    }

    console.log("Notification Service Override: Successfully overridden notification service")
    return true
  }

  // Function to update notification position
  function updateNotificationPosition() {
    // Find the "New Project" button
    const newProjectBtn =
      document.querySelector(".btn-new") ||
      document.querySelector("[data-action='new-project']") ||
      document.querySelector("button:contains('New Project')")

    if (!newProjectBtn) {
      return
    }

    // Find the notification container
    const notificationContainer = document.querySelector(".fixed-notification-container")

    if (!notificationContainer) {
      return
    }

    // Position the container above the New Project button
    const btnRect = newProjectBtn.getBoundingClientRect()
    const topPosition = btnRect.top - 40 // 40px above the button
    const leftPosition = btnRect.left

    notificationContainer.style.top = `${topPosition}px`
    notificationContainer.style.left = `${leftPosition}px`
  }

  // Try to override immediately
  if (!overrideNotificationService()) {
    // If not successful, retry when more elements are loaded
    let attempts = 0
    const maxAttempts = 20

    const checkInterval = setInterval(() => {
      attempts++
      if (overrideNotificationService() || attempts >= maxAttempts) {
        clearInterval(checkInterval)
      }
    }, 500)
  }
})()
