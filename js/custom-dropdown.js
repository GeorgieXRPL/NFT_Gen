// Custom Dropdown Implementation
window.NFTApp.customDropdown = {
  init: function () {
    console.log("Initializing custom dropdowns")
    
    // CRITICAL: First, comprehensive cleanup of ALL duplicates
    // For rules-filter-dropdown specifically, ensure only ONE exists
    const rulesFilterDropdowns = document.querySelectorAll('#rules-filter-dropdown');
    if (rulesFilterDropdowns.length > 1) {
      console.log("[CLEANUP] Found", rulesFilterDropdowns.length, "duplicate rules-filter-dropdown select elements, removing duplicates");
      // Keep only the first one, remove ALL others
      const firstDropdown = rulesFilterDropdowns[0];
      const firstContainer = firstDropdown.closest('.combination-rules-filter-container');
      for (let i = 1; i < rulesFilterDropdowns.length; i++) {
        const duplicate = rulesFilterDropdowns[i];
        const duplicateContainer = duplicate.closest('.combination-rules-filter-container');
        const duplicateWrapper = duplicate.closest('.rules-filter-dropdown-wrapper');
        if (duplicateContainer && duplicateContainer !== firstContainer) {
          console.log("[CLEANUP] Removing duplicate filter container");
          duplicateContainer.remove();
        } else if (duplicateWrapper && duplicateWrapper !== firstContainer?.querySelector('.rules-filter-dropdown-wrapper')) {
          console.log("[CLEANUP] Removing duplicate dropdown wrapper");
          duplicateWrapper.remove();
        } else {
          console.log("[CLEANUP] Removing duplicate dropdown element");
          duplicate.remove();
        }
      }
    }
    
    // CRITICAL: Clean up any duplicate custom dropdowns
    // Find all custom dropdowns and check for duplicates
    const allCustomDropdowns = document.querySelectorAll('.custom-dropdown');
    const seenDropdowns = new Map(); // Track dropdowns by their data-for attribute
    
    allCustomDropdowns.forEach(customDropdown => {
      const dataForElement = customDropdown.querySelector('[data-for]');
      if (dataForElement) {
        const dataFor = dataForElement.getAttribute('data-for');
        if (seenDropdowns.has(dataFor)) {
          // Duplicate found - remove it (keep the first one)
          console.log("Removing duplicate custom dropdown for", dataFor);
          customDropdown.remove();
        } else {
          seenDropdowns.set(dataFor, customDropdown);
        }
      }
    });
    
    // Find all select elements that need to be converted to custom dropdowns
    const selectElements = document.querySelectorAll(".custom-dropdown-convert")
    console.log("Found", selectElements.length, "select elements to convert")

    selectElements.forEach((select) => {
      // CRITICAL: Skip if already converted to prevent duplicates
      if (select.customDropdown) {
        console.log("Skipping", select.id, "- already converted");
        return;
      }
      // CRITICAL: Check if a custom dropdown already exists next to this select
      const nextSibling = select.nextElementSibling;
      if (nextSibling && nextSibling.classList.contains('custom-dropdown') && 
          nextSibling.querySelector(`[data-for="${select.id}"]`)) {
        console.log("Skipping", select.id, "- custom dropdown already exists");
        // Link the select to the existing dropdown
        select.customDropdown = nextSibling;
        select.style.display = "none";
        return;
      }
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
    
    // CRITICAL: Check if this select is already converted
    if (selectElement.customDropdown) {
      console.log("Select already converted, updating instead")
      this.updateDropdown(selectElement)
      return
    }
    
    // CRITICAL: Check if a custom dropdown already exists for this select (prevent duplicates)
    // Look for existing custom dropdown containers that might have been created
    const existingCustomDropdown = selectElement.nextElementSibling;
    if (existingCustomDropdown && existingCustomDropdown.classList.contains('custom-dropdown') && 
        existingCustomDropdown.querySelector(`[data-for="${selectElement.id}"]`)) {
      console.log("Custom dropdown already exists for this select, linking to existing")
      selectElement.customDropdown = existingCustomDropdown;
      // Ensure the select is hidden
      selectElement.style.display = "none";
      return;
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

    // CRITICAL: Ensure default selection is set before conversion
    // For rules-filter-dropdown, ensure "All Rule Types" (empty value) is selected by default
    if (selectElement.id === 'rules-filter-dropdown' && selectElement.options.length > 0) {
      const firstOption = selectElement.options[0];
      if (firstOption.value === '' && (selectElement.selectedIndex !== 0 || selectElement.value !== '')) {
        selectElement.selectedIndex = 0;
        selectElement.value = '';
        console.log('[DEBUG] Set rules-filter-dropdown default to "All Rule Types"');
      }
    }

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
      // CRITICAL: For "All Rule Types" (empty value), don't show icon in expanded list either
      const iconHTML = option.value === '' ? '' : this.getIconForOption(option)
      const text = option.textContent

      // CRITICAL: For "All Rule Types", show only text, no icon
      if (option.value === '') {
        optionElement.innerHTML = `<span class="custom-dropdown-text">${text}</span>`
        const textSpan = optionElement.querySelector('.custom-dropdown-text');
        if (textSpan) textSpan.style.setProperty('color', '#ffffff', 'important');
      } else {
      optionElement.innerHTML = `
        <span class="custom-dropdown-icon">${iconHTML}</span>
        <span class="custom-dropdown-text">${text}</span>
      `
      }

      // --- FORCE COLOR PATCH: Set color on option icon and text (only for options with values) ---
      // Skip color patch for "All Rule Types" (empty value) - it should stay white
      if (option.value !== '') {
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

    // CRITICAL: Check if a custom dropdown already exists next to this select (prevent duplicates)
    const nextSibling = selectElement.nextElementSibling;
    if (nextSibling && nextSibling.classList.contains('custom-dropdown') && 
        nextSibling.querySelector(`[data-for="${selectElement.id}"]`)) {
      console.log("Custom dropdown already exists for", selectElement.id, "- removing duplicate");
      // Link the select to the existing dropdown and hide the select
      selectElement.customDropdown = nextSibling;
      // CRITICAL: Hide the native select completely
      selectElement.style.setProperty('display', 'none', 'important');
      selectElement.style.setProperty('visibility', 'hidden', 'important');
      selectElement.style.setProperty('opacity', '0', 'important');
      selectElement.style.setProperty('position', 'absolute', 'important');
      selectElement.style.setProperty('width', '0', 'important');
      selectElement.style.setProperty('height', '0', 'important');
      selectElement.style.setProperty('pointer-events', 'none', 'important');
      // Don't insert a new dropdown - use the existing one
      return;
    }

    // CRITICAL: Hide the original select completely before inserting custom dropdown
    selectElement.style.setProperty('display', 'none', 'important');
    selectElement.style.setProperty('visibility', 'hidden', 'important');
    selectElement.style.setProperty('opacity', '0', 'important');
    selectElement.style.setProperty('position', 'absolute', 'important');
    selectElement.style.setProperty('width', '0', 'important');
    selectElement.style.setProperty('height', '0', 'important');
    selectElement.style.setProperty('pointer-events', 'none', 'important');
    selectElement.parentNode.insertBefore(dropdownContainer, selectElement.nextSibling)

    // Store a reference to the custom dropdown in the select element
    selectElement.customDropdown = dropdownContainer
    
    // CRITICAL: Remove any duplicate custom dropdowns that might exist
    // Look for other custom dropdowns with the same data-for attribute
    const allCustomDropdowns = document.querySelectorAll('.custom-dropdown');
    allCustomDropdowns.forEach(customDropdown => {
      if (customDropdown !== dropdownContainer) {
        const dataFor = customDropdown.querySelector(`[data-for="${selectId}"]`);
        if (dataFor) {
          console.log("Removing duplicate custom dropdown for", selectId);
          customDropdown.remove();
        }
      }
    });
    
    // CRITICAL: For rules-filter-dropdown, also check for duplicate select elements
    if (selectId === 'rules-filter-dropdown') {
      const allSelects = document.querySelectorAll('#rules-filter-dropdown');
      if (allSelects.length > 1) {
        console.log("Found", allSelects.length, "duplicate rules-filter-dropdown select elements, removing duplicates");
        // Keep only the first one (the one we just converted), remove the rest
        for (let i = 1; i < allSelects.length; i++) {
          const duplicate = allSelects[i];
          const duplicateWrapper = duplicate.closest('.rules-filter-dropdown-wrapper');
          const duplicateContainer = duplicate.closest('.combination-rules-filter-container');
          if (duplicateContainer) {
            console.log("Removing duplicate filter container");
            duplicateContainer.remove();
          } else if (duplicateWrapper) {
            console.log("Removing duplicate dropdown wrapper");
            duplicateWrapper.remove();
          } else {
            console.log("Removing duplicate dropdown element");
            duplicate.remove();
          }
        }
      }
    }
    
    console.log("Custom dropdown created for:", selectId)
  },

  updateSelectedDisplay: function (selectedDisplay, selectedOption) {
    if (!selectedDisplay || !selectedOption) return

    // Get the icon and text for the selected option
    // CRITICAL: For "All Rule Types" (empty value), don't show icon
    const iconHTML = selectedOption.value === '' ? '' : this.getIconForOption(selectedOption)
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
    
    // CRITICAL: For "All Rule Types" (empty value), show only text in white, no icon
    if (selectedOption.value === '') {
      selectedDisplay.innerHTML = `<span class="custom-dropdown-text">${text}</span>`
      const textSpan = selectedDisplay.querySelector('.custom-dropdown-text');
      if (textSpan) textSpan.style.setProperty('color', '#ffffff', 'important');
    } else {
    selectedDisplay.innerHTML = `
      <span class="custom-dropdown-icon">${iconHTML}</span>
      <span class="custom-dropdown-text">${text}</span>
    `
    // --- FORCE COLOR PATCH: Set color on selected display and icon ---
    if (color) {
      const icon = selectedDisplay.querySelector('.custom-dropdown-icon svg');
      if (icon) icon.style.setProperty('stroke', color, 'important');
      const textSpan = selectedDisplay.querySelector('.custom-dropdown-text');
      if (textSpan) textSpan.style.setProperty('color', color, 'important');
    }
    // --- END FORCE COLOR PATCH ---
    }

    // Store the selected value as a data attribute
    selectedDisplay.setAttribute("data-value", selectedOption.value)
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
    
    // Use centralized RULE_TYPE_COLORS if available
    const RULE_TYPE_COLORS = window.RULE_TYPE_COLORS || {
      'never-combine': '#ff0000',
      'always-combine': '#00b894',
      'conditional-restriction': '#fdcb6e',
      'always-on-top': '#006cff',
      'always-on-bottom': '#ff6600',
      'always-above': '#006cff',
      'always-below': '#ff6600',
      'immediately-above': '#9000ff',
      'immediately-below': '#ffe400',
    };
    const color = RULE_TYPE_COLORS[ruleType] || 'currentColor';
    
    // CRITICAL: Use centralized SVG icon definitions for consistency
    // Map legacy rule types to current ones
    let mappedRuleType = ruleType;
    if (ruleType === 'always-on-top') mappedRuleType = 'always-above';
    if (ruleType === 'always-on-bottom') mappedRuleType = 'always-below';
    
    if (window.RULE_TYPE_SVG_ICONS && window.RULE_TYPE_SVG_ICONS[mappedRuleType]) {
      return window.RULE_TYPE_SVG_ICONS[mappedRuleType](color);
    }
    
    // Fallback to inline definitions if global not available
    if (ruleType === 'never-combine') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-never-icon"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
    } else if (ruleType === 'always-combine') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-always-icon"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else if (ruleType === 'conditional-restriction') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-conditional-icon"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
    } else if (ruleType === 'always-on-top' || ruleType === 'always-above') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-above-icon"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
    } else if (ruleType === 'always-on-bottom' || ruleType === 'always-below') {
      return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="rule-type-below-icon"><polyline points="17 11 12 16 7 11"></polyline><polyline points="17 4 12 9 7 4"></polyline></svg>`;
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
