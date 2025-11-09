// Script to update index.html to include the layer-rename-rule-updater.js script

document.addEventListener("DOMContentLoaded", () => {
  // Check if the script is already included
  const scriptExists = Array.from(document.querySelectorAll("script")).some(
    (script) => script.src && script.src.includes("layer-rename-rule-updater.js"),
  )

  if (!scriptExists) {
    // Create the script element
    const script = document.createElement("script")
    script.src = "js/layer-rename-rule-updater.js"

    // Find a good place to insert it - after the combination-rules.js script
    const combinationRulesScript = Array.from(document.querySelectorAll("script")).find(
      (script) => script.src && script.src.includes("combination-rules.js"),
    )

    if (combinationRulesScript) {
      // Insert after the combination-rules.js script
      combinationRulesScript.parentNode.insertBefore(script, combinationRulesScript.nextSibling)
    } else {
      // If combination-rules.js script is not found, append to the body
      document.body.appendChild(script)
    }

    console.log("Layer rename rule updater script added to the page")
  }
})
