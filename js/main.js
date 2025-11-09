// Self-contained notification function that doesn't rely on external modules
function createNotification(message, type) {
  console.log(`Notification: ${message} (${type})`)

  // Fallback to creating our own notification
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
  notification.style.backgroundColor = type === "success" ? "#4caf50" : type === "error" ? "#f44336" : "#ff9800"
  notification.style.color = "#fff"
  notification.style.padding = "12px 16px"
  notification.style.marginBottom = "10px"
  notification.style.borderRadius = "4px"
  notification.style.boxShadow = "0 2px 5px rgba(0,0,0,0.2)"
  notification.style.display = "flex"
  notification.style.alignItems = "center"
  notification.style.justifyContent = "space-between"
  notification.style.opacity = "1"
  notification.style.transition = "opacity 0.3s ease, transform 0.3s ease"

  // Icon based on notification type
  let iconSvg = ""
  switch (type) {
    case "success":
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
      break
    case "error":
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>'
      break
    case "warning":
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>'
      break
    default:
      iconSvg =
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="20" height="20"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>'
  }

  // Build notification content
  notification.innerHTML = `
    <div style="display: flex; align-items: center;">
      <div style="margin-right: 10px;">${iconSvg}</div>
      <div>${message}</div>
    </div>
    <button style="background: none; border: none; color: white; cursor: pointer; padding: 0; margin-left: 10px;">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
  `

  // Add to container
  container.appendChild(notification)

  // Add close button functionality
  const closeBtn = notification.querySelector("button")
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
  }, 3000)

  return notification
}

// Safe notification function that avoids recursive calls
function showNotification(message, type) {
  // Always use our createNotification function directly
  return createNotification(message, type)
}

// Main application logic
document.addEventListener("DOMContentLoaded", () => {
  console.log("NFT Collection Creator initializing...")

  // Load the landing page directly
  loadLandingPage()
})

// Load the landing page
function loadLandingPage() {
  const appContainer = document.getElementById("app")

  // Check if the landing page already exists
  if (appContainer.querySelector(".landing-page")) {
    console.log("Landing page already exists, no need to recreate it")
    return
  }

  // Create landing page content
  const landingPage = document.createElement("div")
  landingPage.className = "landing-page"

  landingPage.innerHTML = `
    <div class="title-container">
      <h1 class="landing-title">NFT Collection Creator Pro</h1>
      <h2 class="landing-byline">by AstroCrafts</h2>
    </div>
    
    <p class="landing-description">
      Create, customize, and export your own NFT collections with our powerful and intuitive tools.
    </p>
    <p class="landing-description">
      Design unique traits, set rarity rules, generate stunning NFT art, and export ready-to-mint metadata.
    </p>
    
    <div class="feature-list">
      <div class="feature-item">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
        </div>
        <h3 class="feature-title">Custom Traits</h3>
        <p class="feature-description">Create and manage custom traits with different rarity levels.</p>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9"></path>
          </svg>
        </div>
        <h3 class="feature-title">Advanced Settings</h3>
        <p class="feature-description">Configure advanced settings for your NFT collection.</p>
      </div>
      
      <div class="feature-item">
        <div class="feature-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
            <line x1="8" y1="21" x2="16" y2="21"></line>
            <line x1="12" y1="17" x2="12" y2="21"></line>
          </svg>
        </div>
        <h3 class="feature-title">Export Metadata</h3>
        <p class="feature-description">Export your NFT collection metadata in a format ready for minting.</p>
      </div>
    </div>
  `

  appContainer.appendChild(landingPage)
}
