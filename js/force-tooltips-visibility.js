/**
 * Force Tooltips Visibility
 * This script ensures that tooltips are always visible by:
 * 1. Removing any overflow:hidden that might be hiding tooltips
 * 2. Ensuring tooltips have the highest z-index
 * 3. Forcing tooltips to be positioned correctly
 */

;(() => {
  // Function to force tooltip visibility
  // CRITICAL: Optimized to only update tooltips that actually need updating
  function forceTooltipVisibility() {
    // CRITICAL: Remove console.log in production to improve performance
    // console.log("Forcing tooltip visibility")

    // 1. Find all elements that might have overflow:hidden
    const potentiallyHidingElements = document.querySelectorAll(`
      .trait-layer-header,
      .trait-layer-content,
      .trait-layer-bar,
      .trait-layers-container,
      .nav-tabs-container,
      .nav-actions,
      .trait-layer-actions,
      .trait-layer-position,
      .modal,
      .modal-body,
      .modal-content,
      .dropdown-menu,
      .trait-item,
      .trait-details,
      .trait-actions,
      .rule-actions
    `)

    // Force overflow:visible on these elements
    potentiallyHidingElements.forEach((el) => {
      el.style.overflow = "visible"
    })

    // 2. Find all tooltips and ensure they have high z-index
    const tooltips = document.querySelectorAll(`
      .specific-tooltip,
      .tooltiptext,
      .randomize-tooltip-content,
      .randomize-direct-tooltip,
      .override-randomize-tooltip
    `)

    tooltips.forEach((tooltip) => {
      tooltip.style.zIndex = "9999999"
    })
  }

  // Run immediately
  forceTooltipVisibility()

  // Run again when DOM is loaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", forceTooltipVisibility)
  }

  // CRITICAL: Debounce function to prevent excessive calls
  let debounceTimeout = null;
  const debouncedForceTooltipVisibility = () => {
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    debounceTimeout = setTimeout(() => {
      forceTooltipVisibility();
      debounceTimeout = null;
    }, 500); // Only run every 500ms at most
  };

  // Set up a MutationObserver to detect when new elements are added
  // CRITICAL: Use debounced version to prevent performance issues
  const observer = new MutationObserver(() => {
    debouncedForceTooltipVisibility();
  })

  // Start observing
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "class"],
  })

  // CRITICAL: Remove setInterval - it's too heavy and causes performance issues
  // The MutationObserver will handle dynamic tooltips, and we don't need to run every second
  // setInterval(forceTooltipVisibility, 1000) // REMOVED - too heavy
})()
