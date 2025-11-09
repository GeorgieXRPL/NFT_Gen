/**
 * Index HTML Reference Fix
 * 
 * This script specifically fixes issues with resources trying to load from index.html,
 * which is a common problem when using the file:// protocol.
 */

console.log("Initializing Index HTML Reference Fix...");

(function() {
  // Track whether we've applied the fix
  let fixApplied = false;
  
  // Apply the fix when the DOM is ready
  document.addEventListener('DOMContentLoaded', function() {
    fixIndexHtmlReferences();
  });
  
  // Also run immediately in case DOMContentLoaded has already fired
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    fixIndexHtmlReferences();
  }
  
  // Fix any elements that try to load resources from index.html
  function fixIndexHtmlReferences() {
    if (fixApplied) return;
    
    // First check if the problem exists
    const problemElements = findElementsWithIndexHtmlReference();
    
    if (problemElements.length === 0) {
      console.log("No elements with index.html references found");
      return;
    }
    
    console.log(`Found ${problemElements.length} elements with index.html references, fixing...`);
    
    // Fix each problematic element
    problemElements.forEach(fixElement);
    
    // Set up MutationObserver to catch dynamically added elements
    setupObserver();
    
    // Mark fix as applied
    fixApplied = true;
    console.log("Index HTML reference fix applied");
  }
  
  // Find elements with index.html references
  function findElementsWithIndexHtmlReference() {
    const elements = [];
    
    // Check images
    document.querySelectorAll('img').forEach(img => {
      if (img.src && (img.src === window.location.href || img.src.endsWith('index.html'))) {
        elements.push(img);
      }
    });
    
    // Check background images in inline styles
    document.querySelectorAll('[style*="background-image"]').forEach(el => {
      const style = el.getAttribute('style');
      if (style && style.includes('index.html')) {
        elements.push(el);
      }
    });
    
    return elements;
  }
  
  // Fix a single element with index.html reference
  function fixElement(element) {
    if (element.tagName === 'IMG') {
      // For images, provide a transparent placeholder
      console.log(`Fixing img with src=${element.src}`);
      element.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      element.setAttribute('data-original-src', element.src);
      element.setAttribute('data-fixed', 'true');
    } else if (element.hasAttribute('style')) {
      // For elements with background-image in style
      const style = element.getAttribute('style');
      const fixedStyle = style.replace(/url\(['"]?(index\.html|file:\/\/\/[^'"\)]+index\.html)['"]?\)/g, 
                                      'url("data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7")');
      element.setAttribute('style', fixedStyle);
      element.setAttribute('data-original-style', style);
      element.setAttribute('data-fixed', 'true');
    }
  }
  
  // Set up observer to catch dynamically added elements
  function setupObserver() {
    const observer = new MutationObserver(function(mutations) {
      let newProblemElements = [];
      
      mutations.forEach(function(mutation) {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach(function(node) {
            // Check if the node is an element with an index.html reference
            if (node.nodeType === Node.ELEMENT_NODE) {
              if (node.tagName === 'IMG' && node.src && 
                 (node.src === window.location.href || node.src.endsWith('index.html'))) {
                newProblemElements.push(node);
              }
              
              // Also check for elements with style attributes
              if (node.hasAttribute && node.hasAttribute('style')) {
                const style = node.getAttribute('style');
                if (style && style.includes('index.html')) {
                  newProblemElements.push(node);
                }
              }
              
              // Check children of the added node
              if (node.querySelectorAll) {
                // Check for img elements
                node.querySelectorAll('img').forEach(img => {
                  if (img.src && (img.src === window.location.href || img.src.endsWith('index.html'))) {
                    newProblemElements.push(img);
                  }
                });
                
                // Check for elements with background-image in inline styles
                node.querySelectorAll('[style*="background-image"]').forEach(el => {
                  const style = el.getAttribute('style');
                  if (style && style.includes('index.html')) {
                    newProblemElements.push(el);
                  }
                });
              }
            }
          });
        }
      });
      
      // Fix any new problem elements
      if (newProblemElements.length > 0) {
        console.log(`Found ${newProblemElements.length} dynamically added elements with index.html references, fixing...`);
        newProblemElements.forEach(fixElement);
      }
    });
    
    // Start observing the document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  
  // Override Image constructor to prevent loading from index.html
  const originalImage = window.Image;
  window.Image = function() {
    const img = new originalImage(...arguments);
    
    // Override the src setter to catch index.html references
    const originalSrcDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    
    if (originalSrcDescriptor && originalSrcDescriptor.set) {
      Object.defineProperty(img, 'src', {
        set: function(value) {
          // Check if this is an index.html reference
          if (value === window.location.href || (typeof value === 'string' && value.endsWith('index.html'))) {
            console.log(`Intercepted attempt to set img.src to ${value}, using transparent placeholder instead`);
            value = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
          }
          // Call the original setter
          originalSrcDescriptor.set.call(this, value);
        },
        get: originalSrcDescriptor.get,
        configurable: true
      });
    }
    
    return img;
  };
  
  // Ensure prototype chain is maintained
  window.Image.prototype = originalImage.prototype;
  
  console.log("Index HTML Reference Fix loaded successfully");
})(); 