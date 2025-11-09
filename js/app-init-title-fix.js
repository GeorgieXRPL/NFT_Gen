// App Init Title Fix - This script will run when the app is initialized
;(() => {
  // Function to apply our styles
  function applyTitleFix() {
    console.log("Applying title fix from app-init...")

    // Get the elements
    const titleContainer = document.querySelector(".title-container")
    const landingTitle = document.querySelector(".landing-title")

    if (titleContainer) {
      // Apply our styles directly to the element
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
    }

    if (landingTitle) {
      // Apply our styles directly to the element
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

  // Check if the app is already initialized
  if (window.NFTApp) {
    // Register a module to apply our styles
    const titleFixModule = {
      init: () => {
        console.log("Initializing title fix module...")
        applyTitleFix()

        // Apply our styles periodically
        setInterval(applyTitleFix, 1000)
      },
    }

    // Register the module
    if (window.NFTApp.registerModule) {
      window.NFTApp.registerModule("titleFix", titleFixModule)
    }
  }

  // Apply our styles immediately
  applyTitleFix()

  // Apply our styles when the DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyTitleFix)
  }

  // Apply our styles when the window is loaded
  window.addEventListener("load", applyTitleFix)

  // Apply our styles after a short delay
  setTimeout(applyTitleFix, 100)
  setTimeout(applyTitleFix, 500)
  setTimeout(applyTitleFix, 1000)

  console.log("App init title fix initialized")
})()
