/**
 * Resource Path Fix
 * 
 * This script fixes resource loading errors when running from a local file path
 * by ensuring all resource paths are properly resolved.
 */

console.log("Initializing Resource Path Fix...");

(function() {
  // Wait for DOM to be ready
  document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, applying resource path fixes");
    
    // Fix for images loaded from relative paths when using file:// protocol
    fixResourcePaths();
    
    // Set up observer to fix dynamically loaded content
    setupObserver();
  });
  
  // Function to fix resource paths
  function fixResourcePaths() {
    // Check if we're running from file:// protocol
    const isFileProtocol = window.location.protocol === 'file:';
    if (!isFileProtocol) {
      console.log("Not running from file:// protocol, no need for path fixes");
      return;
    }
    
    console.log("Running from file:// protocol, applying path fixes");
    
    // Fix image paths
    fixImagePaths();
    
    // Fix background image paths in CSS
    fixCSSBackgroundImages();
  }
  
  // Fix all image paths
  function fixImagePaths() {
    const images = document.querySelectorAll('img');
    
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src && src.startsWith('/')) {
        // Remove leading slash for file protocol
        const newSrc = src.substring(1);
        console.log(`Fixing image path: ${src} -> ${newSrc}`);
        img.src = newSrc;
      } else if (src && (src.startsWith('file:///') || src === 'index.html')) {
        // Handle case where browsers might insert the full file path
        console.log(`Fixing invalid image path: ${src}`);
        
        // Set a data URI placeholder instead of the invalid path
        img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNmZmYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
      }
    });
  }
  
  // Fix CSS background images
  function fixCSSBackgroundImages() {
    // Get all style elements
    const styleElements = document.querySelectorAll('style');
    
    styleElements.forEach(style => {
      if (style.textContent) {
        // Replace url('/path') with url('path') for file protocol
        let css = style.textContent;
        css = css.replace(/url\(['"]?\/([^'"\)]+)['"]?\)/g, "url('$1')");
        style.textContent = css;
      }
    });
    
    // Fix inline styles with background-image
    const elementsWithBgImage = document.querySelectorAll('[style*="background-image"]');
    
    elementsWithBgImage.forEach(element => {
      const style = element.getAttribute('style');
      if (style && style.includes('url(')) {
        // Replace url('/path') with url('path') for file protocol
        const newStyle = style.replace(/url\(['"]?\/([^'"\)]+)['"]?\)/g, "url('$1')");
        element.setAttribute('style', newStyle);
      }
    });
  }
  
  // Set up observer to fix dynamically added content
  function setupObserver() {
    // Create a mutation observer to watch for dynamically added content
    const observer = new MutationObserver(mutations => {
      // For each mutation, check if images were added
      mutations.forEach(mutation => {
        if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
          // Check for added images
          mutation.addedNodes.forEach(node => {
            // Fix direct image nodes
            if (node.nodeName === 'IMG') {
              fixSingleImagePath(node);
            }
            
            // Fix images within added DOM trees
            if (node.querySelectorAll) {
              const images = node.querySelectorAll('img');
              images.forEach(fixSingleImagePath);
              
              // Also fix elements with background images
              const elementsWithBgImage = node.querySelectorAll('[style*="background-image"]');
              elementsWithBgImage.forEach(fixBackgroundImagePath);
            }
          });
        }
      });
    });
    
    // Start observing the entire document
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }
  
  // Helper function to fix a single image path
  function fixSingleImagePath(img) {
    if (!img || !img.src) return;
    
    const src = img.getAttribute('src');
    if (src && src.startsWith('/')) {
      // Remove leading slash for file protocol
      const newSrc = src.substring(1);
      console.log(`Fixing dynamic image path: ${src} -> ${newSrc}`);
      img.src = newSrc;
    } else if (src && (src.startsWith('file:///') || src === 'index.html')) {
      console.log(`Fixing invalid dynamic image path: ${src}`);
      img.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNmZmYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }
  }
  
  // Helper function to fix background image paths in inline styles
  function fixBackgroundImagePath(element) {
    const style = element.getAttribute('style');
    if (style && style.includes('url(')) {
      // Replace url('/path') with url('path') for file protocol
      const newStyle = style.replace(/url\(['"]?\/([^'"\)]+)['"]?\)/g, "url('$1')");
      element.setAttribute('style', newStyle);
    }
  }
  
  // Override the default Image constructor to fix paths
  const originalImageConstructor = window.Image;
  window.Image = function() {
    const img = new originalImageConstructor(...arguments);
    
    // Override the src setter to fix paths
    const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
    Object.defineProperty(img, 'src', {
      set: function(value) {
        // Fix path if needed
        if (value && typeof value === 'string') {
          if (value.startsWith('/')) {
            value = value.substring(1);
          } else if (value.startsWith('file:///') || value === 'index.html') {
            value = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgYWxpZ25tZW50LWJhc2VsaW5lPSJtaWRkbGUiIGZpbGw9IiNmZmYiPkltYWdlPC90ZXh0Pjwvc3ZnPg==';
          }
        }
        // Call the original setter
        originalSrcSetter.call(this, value);
      },
      configurable: true
    });
    
    return img;
  };
  window.Image.prototype = originalImageConstructor.prototype;
  
  console.log("Resource Path Fix loaded successfully");
})(); 