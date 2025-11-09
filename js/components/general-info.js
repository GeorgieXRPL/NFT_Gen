// General Info Module

// Update the filename help text
window.NFTApp.registerModule("generalInfo", {
  // Track original values to detect changes
  originalValues: {},

  // Update the filename help text
  updateFilenameHelp: () => {
    const totalSupplyInput = document.getElementById("total-supply")
    const filenamePrefixInput = document.getElementById("filename-prefix")
    const filenameHelp = document.querySelector("#filename-prefix").nextElementSibling

    if (!filenameHelp) return

    const totalSupply = Number.parseInt(totalSupplyInput.value) || 0
    const filenamePrefix = filenamePrefixInput.value || "NFT"

    // Determine the padding length based on total supply
    let padLength = 2 // Default for small collections (up to 99)
    if (totalSupply >= 100) padLength = 3 // For 100-999
    if (totalSupply >= 1000) padLength = 4 // For 1000-9999
    if (totalSupply >= 10000) padLength = 5 // For 10000+

    // Create properly formatted examples
    const example1 = "#" + "1".padStart(padLength, "0")
    const example2 = "#" + "2".padStart(padLength, "0")

    // Update the help text with dynamic examples
    filenameHelp.textContent = `Image and metadata filenames will be ${filenamePrefix} ${example1}, ${filenamePrefix} ${example2}, etc.`
  },

  // Remove the Save Information button since we're auto-saving
  removeSaveButton: () => {
    const saveButton = document.getElementById("save-general-info")
    if (saveButton) {
      saveButton.remove()
    }
  },

  // Save general info data
  saveGeneralInfo: function (projectData, showNotification = false) {
    // Get values from form fields
    const collectionName = document.getElementById("collection-name").value
    const collectionDescription = document.getElementById("collection-description").value
    const defaultNftDescription = document.getElementById("default-nft-description").value
    const totalSupply = document.getElementById("total-supply").value.replace(/,/g, '')
    const filenamePrefix = document.getElementById("filename-prefix").value

    // Check if any values have changed
    const hasChanges =
      collectionName !== this.originalValues.collectionName ||
      collectionDescription !== this.originalValues.collectionDescription ||
      defaultNftDescription !== this.originalValues.defaultNftDescription ||
      totalSupply !== this.originalValues.totalSupply ||
      filenamePrefix !== this.originalValues.filenamePrefix

    // Update project data
    projectData.name = collectionName
    projectData.description = collectionDescription
    projectData.defaultNftDescription = defaultNftDescription
    projectData.size = totalSupply
    projectData.filenamePrefix = filenamePrefix

    // Update original values to match current values
    this.originalValues = {
      collectionName,
      collectionDescription,
      defaultNftDescription,
      totalSupply,
      filenamePrefix,
    }

    // Show notification only if there were changes and showNotification is true
    if (hasChanges && showNotification) {
      if (window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("General information saved", "success", 1500)
      }
    }

    // Update project title if it exists
    const projectTitle = document.querySelector(".project-title h1")
    if (projectTitle) {
      projectTitle.textContent = collectionName || "Untitled Collection"
    }

    return projectData
  },

  // Set up event listeners for the general info tab
  setupEventListeners: function (projectData) {
    console.log("Setting up general info event listeners")

    // Remove the Save Information button if it exists
    this.removeSaveButton()

    // Store original values
    this.originalValues = {
      collectionName: document.getElementById("collection-name").value,
      collectionDescription: document.getElementById("collection-description").value,
      defaultNftDescription: document.getElementById("default-nft-description").value,
      totalSupply: document.getElementById("total-supply").value.replace(/,/g, ''),
      filenamePrefix: document.getElementById("filename-prefix").value,
    }

    // Get all input fields in the general info tab
    const inputFields = document.querySelectorAll("#general-info input, #general-info textarea")

    // Add event listeners to each input field
    inputFields.forEach((input) => {
      // Track if the field has been modified during the current focus
      let fieldModified = false

      // When the field gets focus, reset the modification flag
      input.addEventListener("focus", () => {
        fieldModified = false
      })

      // When the field content changes, set the modification flag
      input.addEventListener("input", () => {
        fieldModified = true

        // Update filename help text if total supply or filename prefix changes
        if (input.id === "total-supply" || input.id === "filename-prefix") {
          this.updateFilenameHelp()
        }

        // Save data when input changes (debounced)
        clearTimeout(input.debounceTimeout)
        input.debounceTimeout = setTimeout(() => {
          this.saveGeneralInfo(projectData, true) // Show notification
        }, 500) // Wait 500ms after typing stops
      })

      // Save data when input loses focus, but only show notification if modified
      input.addEventListener("blur", () => {
        clearTimeout(input.debounceTimeout) // Clear any pending debounce
        this.saveGeneralInfo(projectData, fieldModified) // Only show notification if modified
      })
    })

    // Add specific event listeners for the total supply and filename prefix fields
    const totalSupplyInput = document.getElementById("total-supply")
    const filenamePrefixInput = document.getElementById("filename-prefix")

    if (totalSupplyInput) {
      totalSupplyInput.addEventListener("input", () => {
        this.updateFilenameHelp();
        // Dispatch event for total supply update
        window.dispatchEvent(new CustomEvent('total-supply-updated'));
      })
    }

    if (filenamePrefixInput) {
      filenamePrefixInput.addEventListener("input", () => this.updateFilenameHelp())
    }

    // Add specific validation for total supply to ensure it's an integer
    if (totalSupplyInput) {
      // Force integer values by removing decimal points and non-numeric characters
      totalSupplyInput.addEventListener("input", function (e) {
        // Get the current value and cursor position
        const cursorPosition = this.selectionStart
        const currentValue = this.value

        // Remove any non-digit characters
        const newValue = currentValue.replace(/[^\d]/g, "")

        // Only update if the value has changed to avoid cursor jumping
        if (newValue !== currentValue) {
          this.value = newValue

          // Adjust cursor position if characters were removed before the cursor
          const cursorOffset = currentValue.length - newValue.length
          this.setSelectionRange(cursorPosition - cursorOffset, cursorPosition - cursorOffset)
        }
      })

      // Ensure integer value on blur (in case of empty field or other edge cases)
      totalSupplyInput.addEventListener("blur", function () {
        // If empty, set to minimum value
        if (!this.value) {
          this.value = "1"
        }

        // Ensure it's an integer (no decimals)
        this.value = Number.parseInt(this.value, 10)
      })
    }

    // Initialize the filename help text
    this.updateFilenameHelp()
  },
})
