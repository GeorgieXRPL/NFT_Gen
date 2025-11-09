// Keyboard Shortcuts Module

window.NFTApp.registerModule("keyboardShortcuts", {
  // Initialize keyboard shortcuts
  init: function () {
    console.log("Initializing keyboard shortcuts module")
    this.setupEscapeKeyHandler()
  },

  // Set up the Escape key handler to close any open modals
  setupEscapeKeyHandler: function () {
    document.addEventListener("keydown", (event) => {
      // Check if the Escape key was pressed
      if (event.key === "Escape") {
        this.closeAllModals()
      }
    })
  },

  // Close all open modals
  closeAllModals: () => {
    // Close confirmation modal if open
    const confirmationModal = document.getElementById("confirmation-modal")
    if (confirmationModal && confirmationModal.style.display === "flex") {
      confirmationModal.style.display = "none"
      console.log("Closed confirmation modal with Escape key")
    }

    // Close combination rule modal if open
    const combinationRuleModal = document.getElementById("combination-rule-modal")
    if (combinationRuleModal && combinationRuleModal.style.display === "flex") {
      combinationRuleModal.style.display = "none"
      console.log("Closed combination rule modal with Escape key")
    }

    // Close any other modals that might be added in the future
    // This selects all elements with class "modal-overlay" that are currently visible
    const openModals = document.querySelectorAll('.modal-overlay[style*="display: flex"]')
    openModals.forEach((modal) => {
      if (modal.id !== "confirmation-modal" && modal.id !== "combination-rule-modal") {
        modal.style.display = "none"
        console.log(`Closed modal ${modal.id} with Escape key`)
      }
    })
  },
})
