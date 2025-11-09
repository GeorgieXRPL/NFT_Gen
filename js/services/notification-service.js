// Notification Service Module
window.NFTApp.registerModule("notificationService", {
  // Show notification to the user
  show: (message, type = "info", duration = 3000) => {
    console.log(`Notification: ${message} (${type})`)

    // Create notification container if it doesn't exist
    let container = document.querySelector(".fixed-notification-container")
    if (!container) {
      container = document.createElement("div")
      container.className = "fixed-notification-container"

      // Position it at the top right of the viewport, but not overlapping with nav buttons
      container.style.position = "fixed"
      container.style.top = "20px"
      container.style.right = "20px"
      container.style.zIndex = "10000"
      container.style.maxWidth = "350px"
      container.style.width = "auto"

      document.body.appendChild(container)
    }

    // Create the notification element
    const notification = document.createElement("div")
    notification.className = `notification notification-${type}`

    // Icon based on notification type
    let iconSvg = ""
    switch (type) {
      case "success":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
        break
      case "error":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
        break
      case "warning":
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
        break
      default:
        iconSvg =
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    }

    // Build notification content
    notification.innerHTML = `
      <div class="notification-icon">${iconSvg}</div>
      <div class="notification-message">${message}</div>
      <button class="notification-close">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
        // Add fade-out animation
        notification.style.opacity = "0"
        notification.style.transform = "translateX(30px)"
        notification.style.transition = "opacity 0.3s ease, transform 0.3s ease"

        // Remove after animation completes
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove()
          }
        }, 300)
      }
    }, duration)

    return notification
  },
})
