// Fix missing image paths
(function() {
  // No placeholder image - hide broken images instead
  const placeholderImage = '';

  // Function to fix broken image sources
  function fixBrokenImageSources() {
    // Find all images on the page
    const images = document.querySelectorAll('img');
    
    // Fix any empty or root URL sources
    images.forEach(img => {
      const src = img.getAttribute('src') || '';
      
      // Check if source is empty, just the root URL, or only has query parameters
      if (!src || src === '/' || src === window.location.origin + '/' || 
          src === window.location.href || src.startsWith('?') || 
          src === 'http://localhost:8081/' || src === 'https://localhost:8081/') {
        console.log('Fixing broken image source:', src);
        img.setAttribute('src', placeholderImage);
        
        // Add title to indicate the image is a placeholder
        if (!img.hasAttribute('title')) {
          img.setAttribute('title', 'Placeholder (original source was invalid)');
        }
        
        // Add data attribute to track the original source (only if not empty)
        if (src && src.trim() !== '') {
          img.setAttribute('data-original-src', src);
        }
      }
    });
  }

  // Run immediately when the script loads
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    fixBrokenImageSources();
  } else {
    document.addEventListener('DOMContentLoaded', fixBrokenImageSources);
  }
  
  // Also run whenever content is dynamically added to the page
  // We use a mutation observer to watch for new images
  const observer = new MutationObserver(mutations => {
    let shouldFixImages = false;
    
    mutations.forEach(mutation => {
      // Check for added nodes that might be or contain images
      if (mutation.addedNodes && mutation.addedNodes.length > 0) {
        for (let i = 0; i < mutation.addedNodes.length; i++) {
          const node = mutation.addedNodes[i];
          if (node.nodeType === 1) { // Element node
            if (node.tagName === 'IMG' || node.querySelectorAll('img').length > 0) {
              shouldFixImages = true;
              break;
            }
          }
        }
      }
    });
    
    if (shouldFixImages) {
      fixBrokenImageSources();
    }
  });
  
  // Start observing the document
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
  
  // Also handle image error events directly
  document.addEventListener('error', function(e) {
    const target = e.target;
    
    // Check if the error event is from an image
    if (target.tagName === 'IMG') {
      const src = target.getAttribute('src') || '';
      
      // Only replace if it's an empty source or root URL
      if (!src || src === '/' || src === window.location.origin + '/' || 
          src === window.location.href || src.startsWith('?') || 
          src === 'http://localhost:8081/' || src === 'https://localhost:8081/') {
        console.log('Handling error event for broken image:', src);
        target.setAttribute('src', placeholderImage);
        if (src && src.trim() !== '') {
          target.setAttribute('data-original-src', src);
        }
        
        // Prevent the error from bubbling up
        e.stopPropagation();
      }
    }
  }, true); // Use capture phase to intercept before other handlers
})(); 