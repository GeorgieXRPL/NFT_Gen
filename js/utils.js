// Utility functions for the NFT Collection Creator

// Generate a unique ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5)
}

// Format a date to a readable string
function formatDate(date) {
  return new Date(date).toLocaleString()
}

// Deep clone an object
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

// Check if two arrays have the same elements
function arraysEqual(a, b) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false
  }
  return true
}

// Shuffle an array (Fisher-Yates algorithm)
function shuffleArray(array) {
  const newArray = [...array]
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
  }
  return newArray
}

// Download a file
function downloadFile(content, fileName, contentType) {
  const a = document.createElement("a")
  const file = new Blob([content], { type: contentType })
  a.href = URL.createObjectURL(file)
  a.download = fileName
  a.click()
  URL.revokeObjectURL(a.href)
}

// Convert a data URL to a Blob
function dataURLtoBlob(dataURL) {
  const parts = dataURL.split(";base64,")
  const contentType = parts[0].split(":")[1]
  const raw = window.atob(parts[1])
  const rawLength = raw.length
  const uInt8Array = new Uint8Array(rawLength)

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i)
  }

  return new Blob([uInt8Array], { type: contentType })
}

// Format file size
function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

// Debounce function to limit how often a function is called
function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Show notification to the user
function showNotification(message, type = "info", duration = 3000) {
  // Create notification container if it doesn't exist
  let container = document.querySelector(".notification-container")
  if (!container) {
    container = document.createElement("div")
    container.className = "notification-container"
    document.body.appendChild(container)
  }

  // Create notification element
  const notification = document.createElement("div")

  // For successful operations, always use success type
  if (
    message.includes("successfully") ||
    message.includes("added") ||
    message.includes("updated") ||
    message.includes("saved") ||
    message.includes("moved") ||
    message.includes("renamed") ||
    message.includes("loaded")
  ) {
    type = "success"
  }

  notification.className = `notification ${type}`

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
    <div class="notification-message ${type === "error" ? "error-message" : ""}">${message}</div>
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
      notification.remove()
    }
  }, duration)

  return notification
}
