// Confirmation Modal Module
window.NFTApp.registerModule("confirmationModal", {
  // Show confirmation modal
  show: function (title, message, description, confirmCallback) {
    const modalOverlay = document.getElementById("confirmation-modal")
    const modalMessage = document.getElementById("confirmation-message")
    const modalDescription = document.getElementById("confirmation-description")
    const confirmButton = document.getElementById("confirm-action")
    const cancelButton = document.getElementById("cancel-confirmation")
    const closeButton = document.getElementById("close-confirmation-modal")

    // Check if all required elements exist
    if (!modalOverlay || !modalMessage || !modalDescription || !confirmButton || !cancelButton || !closeButton) {
      console.error("Confirmation modal elements not found in DOM")
      return
    }

    // Use innerHTML to allow HTML formatting in message and description
    // Include title in the message since there's no separate title element
    modalMessage.innerHTML = `<strong>${title}</strong><br>${message}`
    modalDescription.innerHTML = description

    // Show the modal with highest z-index to appear on top of all other modals/popups
    // Must be above: Trait Selection Modal (1000000)
    modalOverlay.style.display = "flex"
    modalOverlay.style.setProperty('z-index', '2000000', 'important')

    // Set up event listeners
    confirmButton.onclick = () => {
      confirmCallback()
      this.close()
    }

    cancelButton.onclick = () => {
      this.close()
    }

    closeButton.onclick = () => {
      this.close()
    }
  },

  // Close the confirmation modal
  close: () => {
    const modalOverlay = document.getElementById("confirmation-modal")
    const confirmButton = document.getElementById("confirm-action")
    const cancelButton = document.getElementById("cancel-confirmation")
    const closeButton = document.getElementById("close-confirmation-modal")

    if (modalOverlay) {
      modalOverlay.style.display = "none"
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
