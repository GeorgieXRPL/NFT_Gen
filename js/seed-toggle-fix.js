/**
 * Seed Toggle Fix
 * This script fixes issues with the seed toggle behavior, ensuring it
 * stays in the state the user sets it to.
 */

console.log("Initializing Seed Toggle Fix");

document.addEventListener("DOMContentLoaded", function() {
  console.log("DOM content loaded, applying seed toggle fix");
  
  // Apply fix after a short delay to ensure DOM is fully set up
  setTimeout(function() {
    applySeedToggleFix();
  }, 300);
});

function applySeedToggleFix() {
  // Get the toggle and related elements
  const singleSeedToggle = document.getElementById('single-seed-toggle');
  const singleSeedInput = document.getElementById('single-seed-input');
  const generateSeedBtn = document.getElementById('generate-seed-nft-btn');
  
  if (!singleSeedToggle || !singleSeedInput || !generateSeedBtn) {
    console.warn("Could not find all seed toggle elements, will retry later");
    
    // Retry after a short delay
    setTimeout(function() {
      applySeedToggleFix();
    }, 300);
    
    return;
  }
  
  console.log("Found seed toggle elements, applying fix");
  
  // Store the original toggle state for comparison
  let previousToggleState = singleSeedToggle.checked;
  console.log(`Initial seed toggle state: ${previousToggleState ? 'enabled' : 'disabled'}`);
  
  // Handle changes to the toggle state with custom flag
  singleSeedToggle.addEventListener('change', function(e) {
    // Tag this event with a custom property to identify user actions
    e._isUserAction = e.isTrusted;
    
    // Get current state
    const isEnabled = this.checked;
    
    // Update input and button states
    singleSeedInput.disabled = !isEnabled;
    generateSeedBtn.disabled = !isEnabled;
    
    // Log state change
    if (isEnabled !== previousToggleState) {
      console.log(`Seed toggle changed to: ${isEnabled ? 'enabled' : 'disabled'} (${e.isTrusted ? 'by user' : 'programmatic'})`);
      
      // Update previous state for next comparison
      previousToggleState = isEnabled;
    }
  });
  
  // Add protection to prevent unwanted changes to seed toggle
  const randomizeBtn = document.getElementById('randomize-nft-btn');
  const overrideBtn = document.getElementById('randomize-override-btn');
  
  if (randomizeBtn) {
    const originalClickHandler = randomizeBtn.onclick;
    
    randomizeBtn.addEventListener('click', function(e) {
      // Remember the current toggle state before randomizing
      const currentToggleState = singleSeedToggle ? singleSeedToggle.checked : false;
      
      // Call the original handler if it exists (after a slight delay to ensure our state is captured)
      setTimeout(() => {
        // After the original handler runs, check if the toggle state changed unexpectedly
        if (singleSeedToggle && singleSeedToggle.checked !== currentToggleState) {
          console.log("Seed toggle changed unexpectedly, restoring previous state:", currentToggleState);
          
          // Restore the original state
          singleSeedToggle.checked = currentToggleState;
          singleSeedInput.disabled = !currentToggleState;
          generateSeedBtn.disabled = !currentToggleState;
        }
      }, 10);
    }, true); // Use capturing phase to run before original handler
  }
  
  // Do the same for the override button
  if (overrideBtn) {
    const originalOverrideClickHandler = overrideBtn.onclick;
    
    overrideBtn.addEventListener('click', function(e) {
      // Remember the current toggle state before randomizing
      const currentToggleState = singleSeedToggle ? singleSeedToggle.checked : false;
      
      // Call the original handler if it exists (after a slight delay to ensure our state is captured)
      setTimeout(() => {
        // After the original handler runs, check if the toggle state changed unexpectedly
        if (singleSeedToggle && singleSeedToggle.checked !== currentToggleState) {
          console.log("Seed toggle changed unexpectedly after override, restoring previous state:", currentToggleState);
          
          // Restore the original state
          singleSeedToggle.checked = currentToggleState;
          singleSeedInput.disabled = !currentToggleState;
          generateSeedBtn.disabled = !currentToggleState;
        }
      }, 10);
    }, true); // Use capturing phase to run before original handler
  }
  
  console.log("Seed toggle fix applied successfully");
}

console.log("Seed Toggle Fix initialized"); 