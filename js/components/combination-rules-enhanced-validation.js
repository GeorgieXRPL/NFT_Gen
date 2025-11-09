// Enhanced Combination Rules Module with Improved Validation
// This extends the original combination rules module with the new validation utility

// Declare NFTApp if it's not already declared
var NFTApp = typeof NFTApp !== "undefined" ? NFTApp : {}

// Helper function to generate a unique ID
function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9)
}

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
  // Try to use NFTApp notification service if available and not this function
  if (
    NFTApp &&
    NFTApp.notificationService &&
    typeof NFTApp.notificationService.show === "function" &&
    NFTApp.notificationService.show !== showNotification
  ) {
    NFTApp.notificationService.show(message, type)
    return
  }

  // Try to use window.showNotification if available and not this function
  if (typeof window.showNotification === "function" && window.showNotification !== showNotification) {
    window.showNotification(message, type)
    return
  }

  // If we get here, create our own notification
  return createNotification(message, type)
}

// Ensure NFTApp.getModule exists and returns something
if (typeof NFTApp.getModule !== "function") {
  NFTApp.getModule = (moduleName) => {
    console.warn(
      `NFTApp.getModule called for ${moduleName}, but getModule is not properly defined. Returning an empty object.`,
    )
    return {} // Return an empty object to avoid errors
  }
}

// Ensure NFTApp.ruleValidationUtility exists
if (typeof NFTApp.ruleValidationUtility === "undefined") {
  NFTApp.ruleValidationUtility = {
    validateRule: (rule, existingRules, isUpdate, ruleId) => {
      console.warn("NFTApp.ruleValidationUtility.validateRule is not defined. Returning a default valid result.")
      return { valid: true, message: "" }
    },
  }
}

// Ensure NFTApp.notificationService exists
if (typeof NFTApp.notificationService === "undefined") {
  NFTApp.notificationService = {
    show: (message, type) => {
      createNotification(message, type)
    },
  }
}

// Ensure NFTApp.commonUtils exists
if (typeof NFTApp.commonUtils === "undefined") {
  NFTApp.commonUtils = {
    generateUniqueId: generateUniqueId,
  }
}

// Initialize the enhanced validation module
function initEnhancedValidation() {
  console.log("Initializing enhanced combination rules validation")

  // Make sure NFTApp exists
  if (typeof NFTApp === "undefined") {
    console.error("NFTApp is not defined. Cannot initialize enhanced validation.")
    return
  }

  // Make sure the required modules exist
  if (!NFTApp.getModule || !NFTApp.getModule("combinationRules")) {
    console.error("Combination rules module not found. Cannot initialize enhanced validation.")
    return
  }

  // Define the isDuplicateRule function
  const isDuplicateRule = (newRule, existingRules) => {
    if (!existingRules || existingRules.length === 0) return false

    return existingRules.some((rule) => {
      // Different rule types are never duplicates
      if (rule.type !== newRule.type) return false

      // Different applies to are never duplicates
      if (rule.appliesTo !== newRule.appliesTo) return false

      // Check based on applies to
      switch (rule.appliesTo) {
        case "between-layers":
          // Check if the same layers are involved (in any order for never-combine and always-combine)
          if (rule.type === "never-combine" || rule.type === "always-combine") {
            return (
              (rule.firstLayerId === newRule.firstLayerId && rule.secondLayerId === newRule.secondLayerId) ||
              (rule.firstLayerId === newRule.secondLayerId && rule.secondLayerId === newRule.firstLayerId)
            )
          } else {
            // For conditional and always-on-top, order matters
            return rule.firstLayerId === newRule.firstLayerId && rule.secondLayerId === newRule.secondLayerId
          }

        case "between-traits":
          // Check if the same traits are involved
          const ruleFirstTraitIds = rule.firstTraits.map((t) => t.id).sort()
          const ruleSecondTraitIds = rule.secondTraits.map((t) => t.id).sort()
          const newRuleFirstTraitIds = newRule.firstTraits.map((t) => t.id).sort()
          const newRuleSecondTraitIds = newRule.secondTraits.map((t) => t.id).sort()

          // For never-combine and always-combine, order doesn't matter
          if (rule.type === "never-combine" || rule.type === "always-combine") {
            return (
              (JSON.stringify(ruleFirstTraitIds) === JSON.stringify(newRuleFirstTraitIds) &&
                JSON.stringify(ruleSecondTraitIds) === JSON.stringify(newRuleSecondTraitIds)) ||
              (JSON.stringify(ruleFirstTraitIds) === JSON.stringify(newRuleSecondTraitIds) &&
                JSON.stringify(ruleSecondTraitIds) === JSON.stringify(newRuleFirstTraitIds))
            )
          } else {
            // For conditional and always-on-top, order matters
            return (
              JSON.stringify(ruleFirstTraitIds) === JSON.stringify(newRuleFirstTraitIds) &&
              JSON.stringify(ruleSecondTraitIds) === JSON.stringify(newRuleSecondTraitIds)
            )
          }

        case "layer-to-traits":
        case "traits-to-layer":
          // Check if the same layer and traits are involved
          const ruleTraitIds = rule.traits.map((t) => t.id).sort()
          const newRuleTraitIds = newRule.traits.map((t) => t.id).sort()

          return rule.layerId === newRule.layerId && JSON.stringify(ruleTraitIds) === JSON.stringify(newRuleTraitIds)

        default:
          return false
      }
    })
  }

  // Store references to the original functions
  const originalSaveRule = NFTApp.getModule("combinationRules").saveRule
  const originalUpdateRule = NFTApp.getModule("combinationRules").updateRule

  // Create new saveRule function that uses the original one
  NFTApp.getModule("combinationRules").saveRule = (projectData, modalOverlay) => {
    // Get form values
    const ruleType = document.getElementById("rule-type").value
    const ruleAppliesTo = document.getElementById("rule-applies-to").value
    const firstLayerId = document.getElementById("first-layer").value
    const secondLayerId = document.getElementById("second-layer").value

    // Clear any previous error messages
    const clearErrorMessages = () => {
      const errorMessages = modalOverlay.querySelectorAll(".validation-error")
      errorMessages.forEach((msg) => {
        msg.remove()
      })

      // Remove error highlighting
      modalOverlay.querySelectorAll(".error-highlight").forEach((el) => {
        el.classList.remove("error-highlight")
      })
    }

    clearErrorMessages()

    // Add error message to a specific element
    const addErrorMessage = (element, message) => {
      // Highlight the element
      element.classList.add("error-highlight")

      // Create error message
      const errorDiv = document.createElement("div")
      errorDiv.className = "validation-error"
      errorDiv.textContent = message

      // Insert after the element
      element.parentNode.insertBefore(errorDiv, element.nextSibling)
    }

    // Highlight specific traits that cause conflicts
    const highlightConflictingTraits = (traitIds, containerPrefix) => {
      // Clear any previous error highlights in this container
      const container = document.getElementById(`${containerPrefix}-traits-container`)
      if (!container) return

      // Don't highlight the container itself
      container.classList.remove("error-highlight")

      // Find all trait checkboxes in this container
      const traitItems = container.querySelectorAll(".trait-selection-item")
      traitItems.forEach((item) => {
        item.classList.remove("error-highlight")
        const checkbox = item.querySelector(".trait-checkbox")
        if (checkbox) {
          const traitId = checkbox.getAttribute("data-trait-id")
          if (traitIds.includes(traitId)) {
            // Highlight only the specific trait item
            item.classList.add("error-highlight")
          }
        }
      })
    }

    // Get the selected layers
    const firstLayer = projectData.traits.find((layer) => layer.id === firstLayerId)
    const secondLayer = projectData.traits.find((layer) => layer.id === secondLayerId)

    // Validate layers are selected
    let hasErrors = false

    if (!firstLayer) {
      const firstLayerSelect = document.getElementById("first-layer")
      addErrorMessage(firstLayerSelect, "Please select a valid layer")
      hasErrors = true
    }

    if (!secondLayer) {
      const secondLayerSelect = document.getElementById("second-layer")
      addErrorMessage(secondLayerSelect, "Please select a valid layer")
      hasErrors = true
    }

    // For between-layers, validate that different layers are selected
    if (ruleAppliesTo === "between-layers" && firstLayerId === secondLayerId) {
      const secondLayerSelect = document.getElementById("second-layer")
      addErrorMessage(secondLayerSelect, "Please select a different layer")
      hasErrors = true
    }

    // Validate trait selections based on rule type
    if (
      ruleAppliesTo === "between-traits" ||
      ruleType === "immediately-above" ||
      ruleType === "immediately-below"
    ) {
      // Check first traits selection
      const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
      if (firstTraitsSelected.length === 0) {
        const firstTraitsContainer = document.getElementById("first-traits-container")
        addErrorMessage(firstTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }

      // Check second traits selection
      const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
      if (secondTraitsSelected.length === 0) {
        const secondTraitsContainer = document.getElementById("second-traits-container")
        addErrorMessage(secondTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }
    } else if (ruleAppliesTo === "layer-to-traits") {
      const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
      if (secondTraitsSelected.length === 0) {
        const secondTraitsContainer = document.getElementById("second-traits-container")
        addErrorMessage(secondTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }
    } else if (ruleAppliesTo === "traits-to-layer") {
      const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
      if (firstTraitsSelected.length === 0) {
        const firstTraitsContainer = document.getElementById("first-traits-container")
        addErrorMessage(firstTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }
    }

    // If there are validation errors, stop here
    if (hasErrors) {
      return
    }

    // Create the rule object
    const rule = {
      id: generateUniqueId(),
      type: ruleType,
      appliesTo: ruleAppliesTo,
      created: new Date().toISOString(),
    }

    // Add specific properties based on rule type
    switch (ruleAppliesTo) {
      case "between-layers":
        rule.firstLayerId = firstLayerId
        rule.secondLayerId = secondLayerId
        rule.firstLayerName = firstLayer.name
        rule.secondLayerName = secondLayer.name
        break

      case "between-traits":
        // Get selected traits from first layer
        const firstTraits = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = firstLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: firstLayerId,
            layerName: firstLayer.name
          };
        });
        const secondTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = secondLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: secondLayerId,
            layerName: secondLayer.name
          };
        });
        rule.firstTraits = firstTraits;
        rule.secondTraits = secondTraits;
        break

      case "layer-to-traits":
        const layerToTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = secondLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: secondLayerId,
            layerName: secondLayer.name
          };
        });
        rule.layerId = firstLayerId;
        rule.layerName = firstLayer.name;
        rule.traits = layerToTraits;
        break

      case "traits-to-layer":
        const traitsToLayer = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = firstLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: firstLayerId,
            layerName: firstLayer.name
          };
        });
        rule.traits = traitsToLayer;
        rule.layerId = secondLayerId;
        rule.layerName = secondLayer.name;
        break
    }

    // Check for duplicate rules
    if (isDuplicateRule(rule, projectData.rules)) {
      showNotification("This rule already exists. Please create a different rule.", "error")
      return
    }

    // Use the new validation utility to check for conflicts
    if (NFTApp.ruleValidationUtility && typeof NFTApp.ruleValidationUtility.validateRule === "function") {
      const validationResult = NFTApp.ruleValidationUtility.validateRule(rule, projectData.rules)

      if (!validationResult.valid) {
        // Create a more detailed error message
        const errorContainer = document.createElement("div")
        errorContainer.className = "rule-conflict-error"
        errorContainer.innerHTML = `
          <div class="validation-error conflict-error">
            <strong>Rule Conflict Error:</strong> ${validationResult.message}
          </div>
        `

        // Add the error message to the top of the modal
        const modalBody = modalOverlay.querySelector(".modal-body")
        if (modalBody) {
          modalBody.insertBefore(errorContainer, modalBody.firstChild)
        }

        // Highlight the rule type dropdown to indicate the conflict
        const ruleTypeSelect = document.getElementById("rule-type")
        if (ruleTypeSelect) {
          ruleTypeSelect.classList.add("error-highlight")
        }

        // Add this code to highlight the relevant fields based on conflict type
        if (validationResult.conflictType === "layer-trait-contradiction") {
          // Highlight both layer selects or trait containers depending on the rule type
          if (ruleAppliesTo === "between-layers") {
            document.getElementById("first-layer").classList.add("error-highlight")
            document.getElementById("second-layer").classList.add("error-highlight")
          } else if (ruleAppliesTo === "between-traits") {
            // Highlight only the specific conflicting traits if they're provided
            if (validationResult.conflictingTraits) {
              if (validationResult.conflictingTraits.firstTraits) {
                highlightConflictingTraits(validationResult.conflictingTraits.firstTraits, "first")
              }
              if (validationResult.conflictingTraits.secondTraits) {
                highlightConflictingTraits(validationResult.conflictingTraits.secondTraits, "second")
              }
            } else {
              // If no specific traits are provided, highlight the selected traits
              const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
              firstTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })

              const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
              secondTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })
            }
          } else if (ruleAppliesTo === "layer-to-traits") {
            document.getElementById("first-layer").classList.add("error-highlight")

            // Highlight only the specific conflicting traits
            if (validationResult.conflictingTraits && validationResult.conflictingTraits.secondTraits) {
              highlightConflictingTraits(validationResult.conflictingTraits.secondTraits, "second")
            } else {
              const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
              secondTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })
            }
          } else if (ruleAppliesTo === "traits-to-layer") {
            document.getElementById("second-layer").classList.add("error-highlight")

            // Highlight only the specific conflicting traits
            if (validationResult.conflictingTraits && validationResult.conflictingTraits.firstTraits) {
              highlightConflictingTraits(validationResult.conflictingTraits.firstTraits, "first")
            } else {
              const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
              firstTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })
            }
          }
        }

        return
      }
    }

    // Add the rule to the project data
    if (!projectData.rules) {
      projectData.rules = []
    }

    projectData.rules.push(rule)

    // Update the UI
    NFTApp.getModule("combinationRules").updateRulesUI(projectData)

    // Close the modal
    modalOverlay.style.display = "none"

    // Show success notification using our custom function
    showNotification("Combination rule added successfully", "success")
  }

  // Create new updateRule function that uses the original one
  NFTApp.getModule("combinationRules").updateRule = (ruleId, projectData, modalOverlay) => {
    // Get form values
    const ruleType = document.getElementById("rule-type").value
    const ruleAppliesTo = document.getElementById("rule-applies-to").value
    const firstLayerId = document.getElementById("first-layer").value
    const secondLayerId = document.getElementById("second-layer").value

    // Clear any previous error messages
    const clearErrorMessages = () => {
      const errorMessages = modalOverlay.querySelectorAll(".validation-error")
      errorMessages.forEach((msg) => {
        msg.remove()
      })

      // Remove error highlighting
      modalOverlay.querySelectorAll(".error-highlight").forEach((el) => {
        el.classList.remove("error-highlight")
      })
    }

    clearErrorMessages()

    // Add error message to a specific element
    const addErrorMessage = (element, message) => {
      // Highlight the element
      element.classList.add("error-highlight")

      // Create error message
      const errorDiv = document.createElement("div")
      errorDiv.className = "validation-error"
      errorDiv.textContent = message

      // Insert after the element
      element.parentNode.insertBefore(errorDiv, element.nextSibling)
    }

    // Highlight specific traits that cause conflicts
    const highlightConflictingTraits = (traitIds, containerPrefix) => {
      // Clear any previous error highlights in this container
      const container = document.getElementById(`${containerPrefix}-traits-container`)
      if (!container) return

      // Don't highlight the container itself
      container.classList.remove("error-highlight")

      // Find all trait checkboxes in this container
      const traitItems = container.querySelectorAll(".trait-selection-item")
      traitItems.forEach((item) => {
        item.classList.remove("error-highlight")
        const checkbox = item.querySelector(".trait-checkbox")
        if (checkbox) {
          const traitId = checkbox.getAttribute("data-trait-id")
          if (traitIds.includes(traitId)) {
            // Highlight only the specific trait item
            item.classList.add("error-highlight")
          }
        }
      })
    }

    // Get the selected layers
    const firstLayer = projectData.traits.find((layer) => layer.id === firstLayerId)
    const secondLayer = projectData.traits.find((layer) => layer.id === secondLayerId)

    // Validate layers are selected
    let hasErrors = false

    if (!firstLayer) {
      const firstLayerSelect = document.getElementById("first-layer")
      addErrorMessage(firstLayerSelect, "Please select a valid layer")
      hasErrors = true
    }

    if (!secondLayer) {
      const secondLayerSelect = document.getElementById("second-layer")
      addErrorMessage(secondLayerSelect, "Please select a valid layer")
      hasErrors = true
    }

    // For between-layers, validate that different layers are selected
    if (ruleAppliesTo === "between-layers" && firstLayerId === secondLayerId) {
      const secondLayerSelect = document.getElementById("second-layer")
      addErrorMessage(secondLayerSelect, "Please select a different layer")
      hasErrors = true
    }

    // Validate trait selections based on rule type
    if (
      ruleAppliesTo === "between-traits" ||
      ruleType === "immediately-above" ||
      ruleType === "immediately-below"
    ) {
      // Check first traits selection
      const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
      if (firstTraitsSelected.length === 0) {
        const firstTraitsContainer = document.getElementById("first-traits-container")
        addErrorMessage(firstTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }

      // Check second traits selection
      const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
      if (secondTraitsSelected.length === 0) {
        const secondTraitsContainer = document.getElementById("second-traits-container")
        addErrorMessage(secondTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }
    } else if (ruleAppliesTo === "layer-to-traits") {
      const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
      if (secondTraitsSelected.length === 0) {
        const secondTraitsContainer = document.getElementById("second-traits-container")
        addErrorMessage(secondTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }
    } else if (ruleAppliesTo === "traits-to-layer") {
      const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
      if (firstTraitsSelected.length === 0) {
        const firstTraitsContainer = document.getElementById("first-traits-container")
        addErrorMessage(firstTraitsContainer, "Please select at least one trait")
        hasErrors = true
      }
    }

    // If there are validation errors, stop here
    if (hasErrors) {
      return
    }

    // Find the rule index
    const ruleIndex = projectData.rules.findIndex((r) => r.id === ruleId)
    if (ruleIndex === -1) {
      showNotification("Rule not found", "error")
      return
    }

    // Create the updated rule object
    const updatedRule = {
      id: ruleId,
      type: ruleType,
      appliesTo: ruleAppliesTo,
      created: projectData.rules[ruleIndex].created, // Keep the original creation date
      updated: new Date().toISOString(),
    }

    // Add specific properties based on rule type
    switch (ruleAppliesTo) {
      case "between-layers":
        updatedRule.firstLayerId = firstLayerId
        updatedRule.secondLayerId = secondLayerId
        updatedRule.firstLayerName = firstLayer.name
        updatedRule.secondLayerName = secondLayer.name
        break

      case "between-traits":
        // Get selected traits from first layer
        const firstTraits = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = firstLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: firstLayerId,
            layerName: firstLayer.name
          };
        });
        const secondTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = secondLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: secondLayerId,
            layerName: secondLayer.name
          };
        });
        updatedRule.firstTraits = firstTraits;
        updatedRule.secondTraits = secondTraits;
        break

      case "layer-to-traits":
        const layerToTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = secondLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: secondLayerId,
            layerName: secondLayer.name
          };
        });
        updatedRule.layerId = firstLayerId;
        updatedRule.layerName = firstLayer.name;
        updatedRule.traits = layerToTraits;
        break

      case "traits-to-layer":
        const traitsToLayer = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = firstLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: firstLayerId,
            layerName: firstLayer.name
          };
        });
        updatedRule.traits = traitsToLayer;
        updatedRule.layerId = secondLayerId;
        updatedRule.layerName = secondLayer.name;
        break
    }

    // Check for duplicate rules (excluding the current rule being edited)
    const otherRules = projectData.rules.filter((r) => r.id !== ruleId)
    if (isDuplicateRule(updatedRule, otherRules)) {
      showNotification("This rule already exists. Please create a different rule.", "error")
      return
    }

    // Use the new validation utility to check for conflicts
    if (NFTApp.ruleValidationUtility && typeof NFTApp.ruleValidationUtility.validateRule === "function") {
      const validationResult = NFTApp.ruleValidationUtility.validateRule(updatedRule, projectData.rules, true, ruleId)

      if (!validationResult.valid) {
        // Create a more detailed error message
        const errorContainer = document.createElement("div")
        errorContainer.className = "rule-conflict-error"
        errorContainer.innerHTML = `
          <div class="validation-error conflict-error">
            <strong>Rule Conflict Error:</strong> ${validationResult.message}
          </div>
        `

        // Add the error message to the top of the modal
        const modalBody = modalOverlay.querySelector(".modal-body")
        if (modalBody) {
          modalBody.insertBefore(errorContainer, modalBody.firstChild)
        }

        // Highlight the rule type dropdown to indicate the conflict
        const ruleTypeSelect = document.getElementById("rule-type")
        if (ruleTypeSelect) {
          ruleTypeSelect.classList.add("error-highlight")
        }

        // Add this code to highlight the relevant fields based on conflict type
        if (validationResult.conflictType === "layer-trait-contradiction") {
          // Highlight both layer selects or trait containers depending on the rule type
          if (ruleAppliesTo === "between-layers") {
            document.getElementById("first-layer").classList.add("error-highlight")
            document.getElementById("second-layer").classList.add("error-highlight")
          } else if (ruleAppliesTo === "between-traits") {
            // Highlight only the specific conflicting traits if they're provided
            if (validationResult.conflictingTraits) {
              if (validationResult.conflictingTraits.firstTraits) {
                highlightConflictingTraits(validationResult.conflictingTraits.firstTraits, "first")
              }
              if (validationResult.conflictingTraits.secondTraits) {
                highlightConflictingTraits(validationResult.conflictingTraits.secondTraits, "second")
              }
            } else {
              // If no specific traits are provided, highlight the selected traits
              const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
              firstTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })

              const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
              secondTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })
            }
          } else if (ruleAppliesTo === "layer-to-traits") {
            document.getElementById("first-layer").classList.add("error-highlight")

            // Highlight only the specific conflicting traits
            if (validationResult.conflictingTraits && validationResult.conflictingTraits.secondTraits) {
              highlightConflictingTraits(validationResult.conflictingTraits.secondTraits, "second")
            } else {
              const secondTraitsSelected = document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
              secondTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })
            }
          } else if (ruleAppliesTo === "traits-to-layer") {
            document.getElementById("second-layer").classList.add("error-highlight")

            // Highlight only the specific conflicting traits
            if (validationResult.conflictingTraits && validationResult.conflictingTraits.firstTraits) {
              highlightConflictingTraits(validationResult.conflictingTraits.firstTraits, "first")
            } else {
              const firstTraitsSelected = document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
              firstTraitsSelected.forEach((checkbox) => {
                checkbox.closest(".trait-selection-item").classList.add("error-highlight")
              })
            }
          }
        }

        return
      }
    }

    // Update the rule
    projectData.rules[ruleIndex] = updatedRule

    // Update the UI
    NFTApp.getModule("combinationRules").updateRulesUI(projectData)

    // Close the modal
    modalOverlay.style.display = "none"

    // Show success notification using our custom function
    showNotification("Combination rule updated successfully", "success")
  }

  console.log("Enhanced combination rules validation initialized successfully")
}

// Initialize the enhanced validation module
// Ensure NFTApp is declared before use
if (typeof NFTApp === "undefined") {
  var NFTApp = {}
}

// Wait for document to be fully loaded before initializing
document.addEventListener("DOMContentLoaded", () => {
  // Initialize the enhanced validation module
  initEnhancedValidation()
})
