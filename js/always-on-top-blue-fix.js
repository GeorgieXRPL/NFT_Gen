// JavaScript to ensure "Always on Top" option is blue and "Always on Bottom" option is purple
document.addEventListener("DOMContentLoaded", () => {
  // Apply the fix immediately
  applyAlwaysOnTopBlueFix()
  applyAlwaysOnBottomPurpleFix()

  // Also apply it after a short delay to catch dynamically created elements
  setTimeout(applyAlwaysOnTopBlueFix, 500)
  setTimeout(applyAlwaysOnBottomPurpleFix, 500)

  // And apply it whenever a modal is opened
  document.addEventListener("click", (e) => {
    if (
      e.target &&
      (e.target.id === "add-combination-rule" ||
        e.target.closest("#add-combination-rule") ||
        e.target.classList.contains("edit-rule") ||
        e.target.closest(".edit-rule"))
    ) {
      setTimeout(applyAlwaysOnTopBlueFix, 300)
      setTimeout(applyAlwaysOnBottomPurpleFix, 300)
    }
  })

  // Apply whenever a dropdown is clicked
  document.addEventListener("click", (e) => {
    if (
      e.target &&
      (e.target.classList.contains("custom-dropdown-selected") || e.target.closest(".custom-dropdown-selected"))
    ) {
      setTimeout(applyAlwaysOnTopBlueFix, 100)
      setTimeout(applyAlwaysOnBottomPurpleFix, 100)
    }
  })
})

function applyAlwaysOnTopBlueFix() {
  console.log("Applying Always on Top blue fix")

  // Direct style application to select option
  const ruleTypeSelect = document.getElementById("rule-type")
  if (ruleTypeSelect) {
    const alwaysOnTopOption = ruleTypeSelect.querySelector('option[value="always-on-top"]')
    if (alwaysOnTopOption) {
      alwaysOnTopOption.style.color = "#3498db"
    }
  }

  // Apply to custom dropdown options
  const customDropdownOptions = document.querySelectorAll(".custom-dropdown-option")
  customDropdownOptions.forEach((option) => {
    if (
      option.textContent.includes("Always on Top") ||
      option.classList.contains("always-on-top-option") ||
      option.getAttribute("data-value") === "always-on-top"
    ) {
      option.style.color = "#3498db"

      // Apply to any SVG inside
      const svgs = option.querySelectorAll("svg")
      svgs.forEach((svg) => {
        svg.style.stroke = "#3498db"
      })

      // Apply to text element
      const textEl = option.querySelector(".custom-dropdown-text")
      if (textEl) {
        textEl.style.color = "#3498db"
      }
    }
  })

  // Apply to selected value
  const selectedValues = document.querySelectorAll(".custom-dropdown-selected")
  selectedValues.forEach((selected) => {
    if (
      selected.textContent.includes("Always on Top") ||
      selected.classList.contains("always-on-top-option") ||
      selected.getAttribute("data-value") === "always-on-top"
    ) {
      selected.style.color = "#3498db"

      // Apply to any SVG inside
      const svgs = selected.querySelectorAll("svg")
      svgs.forEach((svg) => {
        svg.style.stroke = "#3498db"
      })

      // Apply to text element
      const textEl = selected.querySelector(".custom-dropdown-text")
      if (textEl) {
        textEl.style.color = "#3498db"
      }
    }
  })
}

function applyAlwaysOnBottomPurpleFix() {
  console.log("Applying Always on Bottom purple fix")

  // Direct style application to select option
  const ruleTypeSelect = document.getElementById("rule-type")
  if (ruleTypeSelect) {
    const alwaysOnBottomOption = ruleTypeSelect.querySelector('option[value="always-on-bottom"]')
    if (alwaysOnBottomOption) {
      alwaysOnBottomOption.style.color = "#9c27b0"
    }
  }

  // Apply to custom dropdown options
  const customDropdownOptions = document.querySelectorAll(".custom-dropdown-option")
  customDropdownOptions.forEach((option) => {
    if (
      option.textContent.includes("Always on Bottom") ||
      option.classList.contains("always-on-bottom-option") ||
      option.getAttribute("data-value") === "always-on-bottom"
    ) {
      option.style.color = "#9c27b0"

      // Apply to any SVG inside
      const svgs = option.querySelectorAll("svg")
      svgs.forEach((svg) => {
        svg.style.stroke = "#9c27b0"
      })

      // Apply to text element
      const textEl = option.querySelector(".custom-dropdown-text")
      if (textEl) {
        textEl.style.color = "#9c27b0"
      }
    }
  })

  // Apply to selected value
  const selectedValues = document.querySelectorAll(".custom-dropdown-selected")
  selectedValues.forEach((selected) => {
    if (
      selected.textContent.includes("Always on Bottom") ||
      selected.classList.contains("always-on-bottom-option") ||
      selected.getAttribute("data-value") === "always-on-bottom"
    ) {
      selected.style.color = "#9c27b0"

      // Apply to any SVG inside
      const svgs = selected.querySelectorAll("svg")
      svgs.forEach((svg) => {
        svg.style.stroke = "#9c27b0"
      })

      // Apply to text element
      const textEl = selected.querySelector(".custom-dropdown-text")
      if (textEl) {
        textEl.style.color = "#9c27b0"
      }
    }
  })
}
