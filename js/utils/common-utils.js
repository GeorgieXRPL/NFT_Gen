// Common utility functions for the NFT Collection Creator

// Register the common utils module
window.NFTApp.registerModule("commonUtils", {
  // Generate a unique ID
  generateUniqueId: () => Date.now().toString(36) + Math.random().toString(36).substring(2, 9),

  // Format a date to a readable string
  formatDate: (date) => new Date(date).toLocaleString(),

  // Deep clone an object
  deepClone: (obj) => JSON.parse(JSON.stringify(obj)),

  // Check if two arrays have the same elements
  arraysEqual: (a, b) => {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false
    }
    return true
  },

  // Shuffle an array (Fisher-Yates algorithm)
  shuffleArray: (array) => {
    const newArray = [...array]
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[newArray[i], newArray[j]] = [newArray[j], newArray[i]]
    }
    return newArray
  },

  // Download a file
  downloadFile: (content, fileName, contentType) => {
    const a = document.createElement("a")
    const file = new Blob([content], { type: contentType })
    a.href = URL.createObjectURL(file)
    a.download = fileName
    a.click()
    URL.revokeObjectURL(a.href)
  },

  // Convert a data URL to a Blob
  dataURLtoBlob: (dataURL) => {
    const parts = dataURL.split(";base64,")
    const contentType = parts[0].split(":")[1]
    const raw = window.atob(parts[1])
    const rawLength = raw.length
    const uInt8Array = new Uint8Array(rawLength)

    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i)
    }

    return new Blob([uInt8Array], { type: contentType })
  },

  // Format file size
  formatFileSize: (bytes) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  },

  // Debounce function to limit how often a function is called
  debounce: (func, wait) => {
    let timeout
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout)
        func(...args)
      }
      clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  },
})

// Make sure the module is accessible directly
window.NFTApp.commonUtils = window.NFTApp.getModule("commonUtils")
