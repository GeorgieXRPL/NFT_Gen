/**
 * Resource Error Handler
 * This script helps debug and handle 404 errors from resource loading
 * and patches document.createElement to prevent undefined paths
 */

(function() {
  console.log("Resource error handler initialized");
  
  // Monkey-patch createElement to prevent undefined URLs in src and href attributes
  const originalCreateElement = document.createElement;
  
  document.createElement = function(tagName) {
    const element = originalCreateElement.call(document, tagName);
    
    // For elements that can have src or href attributes
    if (tagName.toLowerCase() === 'script' || tagName.toLowerCase() === 'link' || tagName.toLowerCase() === 'img') {
      // Create a setter that checks for undefined values
      const originalSrcSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'src');
      const originalHrefSetter = Object.getOwnPropertyDescriptor(element.__proto__, 'href');
      
      // If this element has a src property, override its setter
      if (originalSrcSetter && originalSrcSetter.set) {
        Object.defineProperty(element, 'src', {
          set: function(value) {
            if (value === undefined || value === 'undefined' || (typeof value === 'string' && value.includes('/undefined'))) {
              console.warn('Prevented setting undefined URL as src:', value);
              console.trace('Stack trace for undefined URL');
              // Set to a blank data URL instead of undefined
              originalSrcSetter.set.call(this, 'data:,');
            } else {
              originalSrcSetter.set.call(this, value);
            }
          },
          get: originalSrcSetter.get,
          configurable: true
        });
      }
      
      // If this element has an href property, override its setter
      if (originalHrefSetter && originalHrefSetter.set) {
        Object.defineProperty(element, 'href', {
          set: function(value) {
            if (value === undefined || value === 'undefined' || (typeof value === 'string' && value.includes('/undefined'))) {
              console.warn('Prevented setting undefined URL as href:', value);
              console.trace('Stack trace for undefined URL');
              // Set to a blank data URL instead of undefined
              originalHrefSetter.set.call(this, 'data:,');
            } else {
              originalHrefSetter.set.call(this, value);
            }
          },
          get: originalHrefSetter.get,
          configurable: true
        });
      }
    }
    
    return element;
  };
  
  // Capture all resource loading errors
  window.addEventListener('error', function(event) {
    // Check if it's a resource loading error
    if (event.target && (event.target.tagName === 'SCRIPT' || event.target.tagName === 'LINK' || event.target.tagName === 'IMG')) {
      console.error('Resource loading error:', event.target.src || event.target.href);
      
      // Prevent the default browser error handling
      event.preventDefault();
      
      // Check for undefined path
      const path = event.target.src || event.target.href;
      if (path && path.includes('undefined')) {
        console.error('Detected undefined in resource path:', path);
        
        // Replace the undefined URL with an empty data URL
        if (event.target.tagName === 'IMG') {
          event.target.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'; // Transparent 1px gif
        }
      }
    }
  }, true);
  
  // Log all script tags on the page for debugging
  document.addEventListener("DOMContentLoaded", function() {
    console.log("Checking all loaded scripts and CSS files:");
    
    // Check all scripts
    const scripts = document.querySelectorAll('script');
    scripts.forEach(script => {
      if (script.src) {
        console.log('Script:', script.src);
      }
    });
    
    // Check all CSS
    const links = document.querySelectorAll('link[rel="stylesheet"]');
    links.forEach(link => {
      if (link.href) {
        console.log('CSS:', link.href);
      }
    });
  });
})(); 