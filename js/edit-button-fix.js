// Edit Button Fix - ensures buttons are clickable

(function() {
  // Function to fix edit buttons
  function fixEditButtons() {
    // console.log("Applying edit button fix");
    
    // Find all edit buttons in the traits list
    const editButtons = document.querySelectorAll('.nft-trait-edit-btn');
    
    if (editButtons.length > 0) {
      // console.log(`Found ${editButtons.length} edit buttons to fix`);
      
      // Apply fixes to each button
      editButtons.forEach((btn) => {
        // Ensure high z-index
        btn.style.zIndex = '9999';
        
        // Enable pointer events
        btn.style.pointerEvents = 'auto';
        
        // Make button visible
        btn.style.opacity = '0.9';
        
        // Do NOT replace or override the click handler
      });
    } else {
      // console.log("No edit buttons found to fix yet");
    }
  }
  
  // Run on page load
  window.addEventListener('load', function() {
    // Allow time for the UI to render
    setTimeout(fixEditButtons, 1000);
  });
  
  // Run periodically to catch dynamically added buttons
  setInterval(fixEditButtons, 3000);
  
  // Store function for direct calling if needed
  window.fixEditButtons = fixEditButtons;
  
  // Attach to NFTApp for direct access
  if (window.NFTApp) {
    if (!window.NFTApp._fixes) {
      window.NFTApp._fixes = {};
    }
    window.NFTApp._fixes.editButtons = fixEditButtons;
  }
})(); 