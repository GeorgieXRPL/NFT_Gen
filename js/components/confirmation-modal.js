// Confirmation Modal Module
window.NFTApp.registerModule("confirmationModal", {
  // Show confirmation modal
  show: function (title, message, description, confirmCallback, options) {
    const modalOverlay = document.getElementById("confirmation-modal")
    const modalMessage = document.getElementById("confirmation-message")
    const modalDescription = document.getElementById("confirmation-description")
    const confirmButton = document.getElementById("confirm-action")
    const cancelButton = document.getElementById("cancel-confirmation")
    const closeButton = document.getElementById("close-confirmation-modal")
    const buttonContainer = cancelButton ? cancelButton.parentElement : null

    // Check if all required elements exist
    if (!modalOverlay || !modalMessage || !modalDescription || !confirmButton || !closeButton) {
      console.error("Confirmation modal elements not found in DOM")
      return
    }

    // Default options
    options = options || {}
    const singleButton = options.singleButton || false
    const confirmText = options.confirmText || "Confirm"
    const cancelText = options.cancelText || "Cancel"

    // Use innerHTML to allow HTML formatting in message and description
    // Check if title element exists, otherwise include in message
    const titleElement = document.getElementById("confirmation-title")
    if (titleElement) {
      titleElement.textContent = title
      titleElement.style.display = title && title.trim() !== "" ? "block" : "none"
      modalMessage.innerHTML = message
    } else {
      // Fallback: include title in message if no separate title element
      modalMessage.innerHTML = `<strong>${title}</strong><br>${message}`
    }
    modalDescription.innerHTML = description

    // Configure buttons based on single button mode
    if (singleButton) {
      // Hide cancel button, show only confirm button (renamed to OK)
      if (cancelButton) {
        cancelButton.style.display = "none"
      }
      confirmButton.textContent = confirmText
      confirmButton.style.marginLeft = "auto"
      if (buttonContainer) {
        buttonContainer.style.justifyContent = "flex-end"
      }
    } else {
      // Show both buttons
      if (cancelButton) {
        cancelButton.style.display = "block"
      }
      confirmButton.textContent = confirmText
      if (cancelButton) {
        cancelButton.textContent = cancelText
      }
      if (buttonContainer) {
        buttonContainer.style.justifyContent = "flex-end"
      }
    }

    // Show the modal with highest z-index to appear on top of all other modals/popups
    // Must be above: Trait Selection Modal (1000000)
    modalOverlay.style.display = "flex"
    modalOverlay.style.setProperty('z-index', '2000000', 'important')

    // Set up event listeners
    confirmButton.onclick = () => {
      if (confirmCallback && typeof confirmCallback === 'function') {
        confirmCallback()
      }
      this.close()
    }

    if (cancelButton) {
      cancelButton.onclick = () => {
        this.close()
      }
    }

    closeButton.onclick = () => {
      this.close()
    }

    // Close modal when clicking outside (on the overlay, not on the content)
    const overlayClickHandler = (e) => {
      // Only close if clicking directly on the overlay (not on any child elements)
      if (e.target === modalOverlay) {
        this.close()
      }
    }
    
    // Remove any existing listener to prevent duplicates
    modalOverlay.removeEventListener('click', overlayClickHandler)
    modalOverlay.addEventListener('click', overlayClickHandler)
    
    // Store the handler for cleanup
    modalOverlay._overlayClickHandler = overlayClickHandler
  },

  // Close the confirmation modal
  close: () => {
    const modalOverlay = document.getElementById("confirmation-modal")
    const confirmButton = document.getElementById("confirm-action")
    const cancelButton = document.getElementById("cancel-confirmation")
    const closeButton = document.getElementById("close-confirmation-modal")

    if (modalOverlay) {
      modalOverlay.style.display = "none"
      // Remove the overlay click handler
      if (modalOverlay._overlayClickHandler) {
        modalOverlay.removeEventListener('click', modalOverlay._overlayClickHandler)
        delete modalOverlay._overlayClickHandler
      }
    }
    if (confirmButton) {
      confirmButton.onclick = null
    }
    if (cancelButton) {
      cancelButton.onclick = null
    }
    if (closeButton) {
      closeButton.onclick = null
    }
  },

  // Set up the confirmation modal
  setup: () => {
    // The modal is already set up in the HTML, so we don't need to do anything here
  },
})
