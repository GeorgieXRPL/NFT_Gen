// Direct Title Fix - This script will run after the page loads
document.addEventListener("DOMContentLoaded", () => {
  console.log("Direct title fix running...")

  // Function to apply the fix
  function applyTitleFix() {
    // Get the elements
    const titleContainer = document.querySelector(".landing-page .title-container")
    const landingTitle = document.querySelector(".landing-page .landing-title")

    if (titleContainer && landingTitle) {
      console.log("Found title elements, applying fix...")

      // Apply styles directly to the elements
      titleContainer.setAttribute(
        "style",
        `
        width: 100% !important;
        max-width: 1200px !important;
        margin-left: auto !important;
        margin-right: auto !important;
        box-sizing: border-box !important;
        padding-left: 0 !important;
        padding-right: 0 !important;
        display: flex !important;
        flex-direction: column !important;
        align-items: flex-end !important;
        text-align: right !important;
      `,
      )

      landingTitle.setAttribute(
        "style",
        `
        letter-spacing: -1px !important;
        font-weight: 700 !important;
        text-transform: none !important;
        font-size: 3.5rem !important;
        background: linear-gradient(to right, var(--accent-primary), var(--accent-secondary)) !important;
        -webkit-background-clip: text !important;
        background-clip: text !important;
        color: transparent !important;
        margin-bottom: 0.5rem !important;
      `,
      )
    }
  }

  // Apply the fix immediately
  applyTitleFix()

  // Apply the fix after a short delay
  setTimeout(applyTitleFix, 100)
  setTimeout(applyTitleFix, 500)
  setTimeout(applyTitleFix, 1000)

  // Apply the fix when the window is resized
  window.addEventListener("resize", applyTitleFix)
})
