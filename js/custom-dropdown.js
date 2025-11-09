// Custom Dropdown Implementation
window.NFTApp.customDropdown = {
  init: function () {
    console.log("Initializing custom dropdowns")
    // Find all select elements that need to be converted to custom dropdowns
    const selectElements = document.querySelectorAll(".custom-dropdown-convert")
    console.log("Found", selectElements.length, "select elements to convert")

    selectElements.forEach((select) => {
      this.convertToCustomDropdown(select)
    })

    // Close all dropdowns when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".custom-dropdown")) {
        this.closeAllDropdowns()
      }
    })
  },

  convertToCustomDropdown: function (selectElement) {
    console.log("Converting select to custom dropdown:", selectElement.id)
    // Check if this select is already converted
    if (selectElement.customDropdown) {
      console.log("Select already converted, updating instead")
      this.updateDropdown(selectElement)
      return
    }

    // Create the custom dropdown container
    const dropdownContainer = document.createElement("div")
    dropdownContainer.className = "custom-dropdown"

    // Get the select's ID and classes to maintain any existing references
    const selectId = selectElement.id
    const selectClasses = selectElement.className.replace("custom-dropdown-convert", "").trim()

    // Create the selected display element
    const selectedDisplay = document.createElement("div")
    selectedDisplay.className = `custom-dropdown-selected ${selectClasses}`
    selectedDisplay.setAttribute("data-for", selectId)

    // Create the options container
    const optionsContainer = document.createElement("div")
    optionsContainer.className = "custom-dropdown-options"

    // Get the currently selected option
    const selectedOption = selectElement.options[selectElement.selectedIndex]

    // Set the initial selected display
    this.updateSelectedDisplay(selectedDisplay, selectedOption)

    // Add options to the dropdown
    Array.from(selectElement.options).forEach((option, index) => {
      const optionElement = document.createElement("div")
      optionElement.className = `custom-dropdown-option ${option.className}`
      if (index === selectElement.selectedIndex) {
        optionElement.classList.add("selected")
      }
      optionElement.setAttribute("data-value", option.value)

      // Get icon and text from the option
      const iconHTML = this.getIconForOption(option)
      const text = option.textContent

      optionElement.innerHTML = `
        <span class="custom-dropdown-icon">${iconHTML}</span>
        <span class="custom-dropdown-text">${text}</span>
      `

      // --- FORCE COLOR PATCH: Set color on option icon and text ---
      let color = null;
      if (option.className.includes("never-combine-option") || option.value === "never-combine") color = '#ff0000';
      else if (option.className.includes("always-combine-option") || option.value === "always-combine") color = '#00b894';
      else if (option.className.includes("conditional-restriction-option") || option.value === "conditional-restriction") color = '#fdcb6e';
      else if (option.className.includes("always-on-top-option") || option.value === "always-on-top") color = '#006cff';
      else if (option.className.includes("always-on-bottom-option") || option.value === "always-on-bottom") color = '#ff6600';
      else if (option.className.includes("always-above-option") || option.value === "always-above") color = '#006cff';
      else if (option.className.includes("always-below-option") || option.value === "always-below") color = '#ff6600';
      else if (option.className.includes("immediately-above-option") || option.value === "immediately-above") color = '#9000ff';
      else if (option.className.includes("immediately-below-option") || option.value === "immediately-below") color = '#ffe400';
      else if (option.className.includes("between-layers-option") || option.value === "between-layers") color = '#5c6bc0';
      else if (option.className.includes("between-traits-option") || option.value === "between-traits") color = '#a29bfe';
      else if (option.className.includes("layer-to-traits-option") || option.value === "layer-to-traits") color = '#74b9ff';
      else if (option.className.includes("traits-to-layer-option") || option.value === "traits-to-layer") color = '#81ecec';
      if (color) {
        const icon = optionElement.querySelector('.custom-dropdown-icon svg');
        if (icon) icon.style.setProperty('stroke', color, 'important');
        const textSpan = optionElement.querySelector('.custom-dropdown-text');
        if (textSpan) textSpan.style.setProperty('color', color, 'important');
      }
      // --- END FORCE COLOR PATCH ---

      // Add click event to select this option
      optionElement.addEventListener("click", () => {
        this.selectOption(selectElement, optionElement, optionsContainer, selectedDisplay)
      })

      optionsContainer.appendChild(optionElement)
    })

    // Add click event to toggle the dropdown
    selectedDisplay.addEventListener("click", (e) => {
      e.stopPropagation()
      this.toggleDropdown(optionsContainer)
    })

    // Insert the custom dropdown elements
    dropdownContainer.appendChild(selectedDisplay)
    dropdownContainer.appendChild(optionsContainer)

    // Hide the original select and insert our custom dropdown after it
    selectElement.style.display = "none"
    selectElement.parentNode.insertBefore(dropdownContainer, selectElement.nextSibling)

    // Store a reference to the custom dropdown in the select element
    selectElement.customDropdown = dropdownContainer
    console.log("Custom dropdown created for:", selectId)
  },

  updateSelectedDisplay: function (selectedDisplay, selectedOption) {
    if (!selectedDisplay || !selectedOption) return

    // Get the icon and text for the selected option
    const iconHTML = this.getIconForOption(selectedOption)
    const text = selectedOption.textContent || selectedOption.text

    // Determine the color class for the selected option based on its class or value
    let colorClass = ""
    let color = null;
    if (
      selectedOption.className.includes("never-combine-option") ||
      selectedOption.value === "never-combine"
    ) {
      colorClass = "rule-type-never-color"
      color = '#ff0000';
    } else if (
      selectedOption.className.includes("always-combine-option") ||
      selectedOption.value === "always-combine"
    ) {
      colorClass = "rule-type-always-color"
      color = '#00b894';
    } else if (
      selectedOption.className.includes("conditional-restriction-option") ||
      selectedOption.value === "conditional-restriction"
    ) {
      colorClass = "rule-type-conditional-color"
      color = '#fdcb6e';
    } else if (
      selectedOption.className.includes("always-on-top-option") ||
      selectedOption.value === "always-on-top"
    ) {
      colorClass = "rule-type-top-color"
      color = '#006cff';
    } else if (
      selectedOption.className.includes("always-on-bottom-option") ||
      selectedOption.value === "always-on-bottom"
    ) {
      colorClass = "rule-type-bottom-color"
      color = '#ff6600';
    } else if (
      selectedOption.className.includes("always-above-option") ||
      selectedOption.value === "always-above"
    ) {
      colorClass = "rule-type-above-color"
      color = '#006cff';
    } else if (
      selectedOption.className.includes("always-below-option") ||
      selectedOption.value === "always-below"
    ) {
      colorClass = "rule-type-below-color"
      color = '#ff6600';
    } else if (
      selectedOption.className.includes("immediately-above-option") ||
      selectedOption.value === "immediately-above"
    ) {
      colorClass = "rule-type-immediately-above-color"
      color = '#9000ff';
    } else if (
      selectedOption.className.includes("immediately-below-option") ||
      selectedOption.value === "immediately-below"
    ) {
      colorClass = "rule-type-immediately-below-color"
      color = '#ffe400';
    } else if (
      selectedOption.className.includes("between-layers-option") ||
      selectedOption.value === "between-layers"
    ) {
      colorClass = "between-layers-option"
      color = '#5c6bc0';
    } else if (
      selectedOption.className.includes("between-traits-option") ||
      selectedOption.value === "between-traits"
    ) {
      colorClass = "between-traits-option"
      color = '#a29bfe';
    } else if (
      selectedOption.className.includes("layer-to-traits-option") ||
      selectedOption.value === "layer-to-traits"
    ) {
      colorClass = "layer-to-traits-option"
      color = '#74b9ff';
    } else if (
      selectedOption.className.includes("traits-to-layer-option") ||
      selectedOption.value === "traits-to-layer"
    ) {
      colorClass = "traits-to-layer-option"
      color = '#81ecec';
    }

    // Update the content of the selected display
    selectedDisplay.className = `custom-dropdown-selected ${colorClass}`
    selectedDisplay.innerHTML = `
      <span class="custom-dropdown-icon">${iconHTML}</span>
      <span class="custom-dropdown-text">${text}</span>
    `

    // Store the selected value as a data attribute
    selectedDisplay.setAttribute("data-value", selectedOption.value)

    // --- FORCE COLOR PATCH: Set color on selected display and icon ---
    if (color) {
      const icon = selectedDisplay.querySelector('.custom-dropdown-icon svg');
      if (icon) icon.style.setProperty('stroke', color, 'important');
      const textSpan = selectedDisplay.querySelector('.custom-dropdown-text');
      if (textSpan) textSpan.style.setProperty('color', color, 'important');
    }
    // --- END FORCE COLOR PATCH ---
  },

  applyOptionClasses: (element, option) => {
    // Remove any existing option-specific classes
    element.className = element.className
      .replace(/rule-type-[a-z]+-color|rule-type-[a-z]+-option|between-[a-z]+-option|[a-z]+-to-[a-z]+-option/g, "")
      .trim()

    // Add the appropriate class based on the option's value and class
    if (option.className.includes("never-combine-option")) {
      element.classList.add("rule-type-never-color")
    } else if (option.className.includes("always-combine-option")) {
      element.classList.add("rule-type-always-color")
    } else if (option.className.includes("conditional-restriction-option")) {
      element.classList.add("rule-type-conditional-color")
    } else if (option.className.includes("always-on-top-option")) {
      element.classList.add("rule-type-top-color")
    }

    // Add the original option class if it exists
    if (option.className) {
      element.classList.add(option.className)
    }
  },

  getIconForOption: function (option) {
    let ruleType = option.value;
    if (option.classList.contains('never-combine-option')) ruleType = 'never-combine';
    if (option.classList.contains('always-combine-option')) ruleType = 'always-combine';
    if (option.classList.contains('conditional-restriction-option')) ruleType = 'conditional-restriction';
    if (option.classList.contains('always-on-top-option')) ruleType = 'always-on-top';
    if (option.classList.contains('always-on-bottom-option')) ruleType = 'always-on-bottom';
    if (option.classList.contains('always-above-option')) ruleType = 'always-above';
    if (option.classList.contains('always-below-option')) ruleType = 'always-below';
    if (option.classList.contains('immediately-above-option')) ruleType = 'immediately-above';
    if (option.classList.contains('immediately-below-option')) ruleType = 'immediately-below';
    const color = RULE_TYPE_COLORS[ruleType] || 'currentColor';
    // Now use color for the SVG stroke attribute for all rule type icons:
    if (ruleType === 'never-combine') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-never-icon"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
    } else if (ruleType === 'always-combine') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-always-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (ruleType === 'conditional-restriction') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-conditional-icon"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
    } else if (ruleType === 'always-on-top') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-top-icon"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
    } else if (ruleType === 'always-on-bottom') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-bottom-icon"><polyline points="17 11 12 16 7 11"></polyline><polyline points="17 4 12 9 7 4"></polyline></svg>`;
    } else if (ruleType === 'always-above') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-above-icon"><polyline points="17 11 12 6 7 11"></polyline></svg>`;
    } else if (ruleType === 'always-below') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-below-icon"><polyline points="7 13 12 18 17 13"></polyline></svg>`;
    } else if (ruleType === 'immediately-above') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-above-icon"><polyline points="17 11 12 6 7 11"></polyline></svg>`;
    } else if (ruleType === 'immediately-below') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-below-icon"><polyline points="7 13 12 18 17 13"></polyline></svg>`;
    }
    // Default icon if none of the above match
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle></svg>`;
  },

  selectOption: function (selectElement, optionElement, optionsContainer, selectedDisplay) {
    console.log("Selecting option:", optionElement.getAttribute("data-value"))
    // Update the original select element
    const value = optionElement.getAttribute("data-value")
    selectElement.value = value

    // Trigger change event on the original select
    const event = new Event("change", { bubbles: true })
    selectElement.dispatchEvent(event)

    // Update the selected display
    const selectedIndex = Array.from(selectElement.options).findIndex((opt) => opt.value === value)
    this.updateSelectedDisplay(selectedDisplay, selectElement.options[selectedIndex])

    // Update the selected class on options
    const options = optionsContainer.querySelectorAll(".custom-dropdown-option")
    options.forEach((opt) => opt.classList.remove("selected"))
    optionElement.classList.add("selected")

    // Close the dropdown
    this.closeDropdown(optionsContainer)
  },

  toggleDropdown: function (optionsContainer) {
    console.log("Toggling dropdown")
    // Close all other dropdowns first
    this.closeAllDropdowns()

    // Toggle this dropdown
    optionsContainer.classList.toggle("show")

    // Check if the dropdown would go off the bottom of the screen
    if (optionsContainer.classList.contains("show")) {
      const rect = optionsContainer.getBoundingClientRect()
      const windowHeight = window.innerHeight

      if (rect.bottom > windowHeight) {
        optionsContainer.classList.add("dropdown-up")
      } else {
        optionsContainer.classList.remove("dropdown-up")
      }

      // Scroll the selected option into view
      const selectedOption = optionsContainer.querySelector(".selected")
      if (selectedOption) {
        selectedOption.scrollIntoView({ block: "nearest" })
      }
    }
  },

  closeDropdown: (optionsContainer) => {
    optionsContainer.classList.remove("show")
  },

  closeAllDropdowns: () => {
    const allDropdowns = document.querySelectorAll(".custom-dropdown-options")
    allDropdowns.forEach((dropdown) => {
      dropdown.classList.remove("show")
    })
  },

  // Method to update a custom dropdown when the original select is programmatically changed
  updateDropdown: function (selectElement) {
    console.log("Updating dropdown for:", selectElement.id)
    if (!selectElement.customDropdown) {
      console.log("No custom dropdown found, creating new one")
      this.convertToCustomDropdown(selectElement)
      return
    }

    const selectedDisplay = selectElement.customDropdown.querySelector(".custom-dropdown-selected")
    const optionsContainer = selectElement.customDropdown.querySelector(".custom-dropdown-options")
    const selectedOption = selectElement.options[selectElement.selectedIndex]

    // Update the selected display
    this.updateSelectedDisplay(selectedDisplay, selectedOption)

    // Update the selected class on options
    const options = optionsContainer.querySelectorAll(".custom-dropdown-option")
    options.forEach((opt) => opt.classList.remove("selected"))

    const selectedValue = selectedOption.value
    const selectedOptionElement = Array.from(options).find((opt) => opt.getAttribute("data-value") === selectedValue)
    if (selectedOptionElement) {
      selectedOptionElement.classList.add("selected")
    }
  },
}
