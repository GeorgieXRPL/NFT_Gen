// Feedback Dialog Fix - Positions all notifications above the "New Project" button
document.addEventListener("DOMContentLoaded", () => {
  console.log("Feedback Dialog Fix: Initializing...")

  // Function to apply the fix
  function applyFeedbackDialogFix() {
    // Find the "New Project" button
    const newProjectBtn =
      document.querySelector(".btn-new") ||
      document.querySelector("[data-action='new-project']") ||
      document.querySelector("button:contains('New Project')")

    if (!newProjectBtn) {
      console.log("Feedback Dialog Fix: New Project button not found, will retry later")
      return false
    }

    console.log("Feedback Dialog Fix: New Project button found")

    // Create or update the notification container
    let notificationContainer = document.querySelector(".fixed-notification-container")

    if (!notificationContainer) {
      notificationContainer = document.createElement("div")
      notificationContainer.className = "fixed-notification-container feedback-fixed-position"
      document.body.appendChild(notificationContainer)
      console.log("Feedback Dialog Fix: Created new notification container")
    } else {
      notificationContainer.classList.add("feedback-fixed-position")
      console.log("Feedback Dialog Fix: Updated existing notification container")
    }

    // Position the container to align with the left edge of the New Project button
    const btnRect = newProjectBtn.getBoundingClientRect()
    const topPosition = btnRect.top - 30 // Position above the button
    const leftPosition = btnRect.left // Align with the left edge of the button

    notificationContainer.style.top = `${topPosition}px`
    notificationContainer.style.left = `${leftPosition}px`
    notificationContainer.style.right = "auto"
    notificationContainer.style.transform = "none"

    console.log(`Feedback Dialog Fix: Positioned at top: ${topPosition}px, left: ${leftPosition}px`)

    // Override the notification service to use our container
    if (window.NFTApp && window.NFTApp.notificationService) {
      const originalShow = window.NFTApp.notificationService.show

      window.NFTApp.notificationService.show = (message, type, duration) => {
        console.log(`Feedback Dialog Fix: Showing notification: ${message}`)

        // Create notification element
        const notification = document.createElement("div")
        notification.className = `notification notification-${type} feedback-single-line`

        // Build notification content
        notification.innerHTML = `
          <div class="notification-icon">
            ${getIconSvg(type)}
          </div>
          <div class="notification-message feedback-message-text">${message}</div>
          <button class="notification-close">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        `

        // Add to container
        notificationContainer.appendChild(notification)

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

        return notification
      }

      console.log("Feedback Dialog Fix: Notification service overridden")
    } else {
      console.log("Feedback Dialog Fix: NFTApp.notificationService not found")
    }

    return true
  }

  // Helper function to get icon SVG based on notification type
  function getIconSvg(type) {
    switch (type) {
      case "success":
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      case "error":
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
      case "warning":
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
      default:
        return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
    }
  }

  // Try to apply the fix immediately
  if (!applyFeedbackDialogFix()) {
    // If not successful, retry when more elements are loaded
    let attempts = 0
    const maxAttempts = 10

    const checkInterval = setInterval(() => {
      attempts++
      if (applyFeedbackDialogFix() || attempts >= maxAttempts) {
        clearInterval(checkInterval)
        console.log(`Feedback Dialog Fix: ${attempts >= maxAttempts ? "Max attempts reached" : "Successfully applied"}`)
      }
    }, 500)
  }

  // Update position when window is resized
  window.addEventListener("resize", () => {
    applyFeedbackDialogFix()
  })

  // Create a MutationObserver to watch for DOM changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if any notifications were added
        const hasNotifications = Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.classList?.contains("notification") || node.querySelector?.(".notification")),
        )

        if (hasNotifications) {
          applyFeedbackDialogFix()
          break
        }
      }
    }
  })

  // Start observing the document body
  observer.observe(document.body, { childList: true, subtree: true })

  // Also handle dynamically created notification containers
  const documentObserver = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
        // Check if a notification container was added
        const hasContainer = Array.from(mutation.addedNodes).some(
          (node) =>
            node.nodeType === Node.ELEMENT_NODE &&
            (node.classList?.contains("fixed-notification-container") ||
              node.querySelector?.(".fixed-notification-container")),
        )

        if (hasContainer) {
          applyFeedbackDialogFix()
          break
        }
      }
    }
  })

  // Start observing the document body for container additions
  documentObserver.observe(document.body, { childList: true })
})
