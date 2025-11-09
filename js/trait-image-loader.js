/**
 * Trait Image Loader
 * Handles proper loading and error handling for trait images in the selection modal
 */
(function() {
  // Add CSS styles for trait images
  function addTraitImageStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      .trait-image-container {
        width: 100%;
        height: 100%;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 0, 0, 0.15);
        border-radius: 4px;
      }
      
      .trait-image-container img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        display: block;
      }
      
      .image-load-error {
        position: relative;
        border: 1px solid rgba(255, 0, 0, 0.3);
      }
      
      .image-load-error::after {
        content: "!";
        position: absolute;
        top: 2px;
        right: 2px;
        width: 14px;
        height: 14px;
        background-color: red;
        color: white;
        font-size: 10px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      }
      
      /* For trait info list */
      .nft-trait-thumb {
        position: relative;
        overflow: hidden;
        border-radius: 4px;
        background-color: rgba(0, 0, 0, 0.2);
      }
      
      .nft-trait-thumb img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      /* Trait selection modal */
      .trait-selection-thumb {
        position: relative;
        border-radius: 6px;
        overflow: hidden;
        transition: all 0.2s ease;
      }
      
      .trait-selection-thumb:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }
    `;
    document.head.appendChild(styleElement);
  }

  // Helper function to create a fallback image data URL (disabled - no placeholder shown)
  function createFallbackImageDataUrl(text = 'No Image') {
    // Return empty string to hide placeholder images
    return '';
  }

  // Helper function to clean and normalize image URLs
  function normalizeImageUrl(imageSource) {
    if (!imageSource || typeof imageSource !== 'string') {
      return null;
    }
    
    // Data URLs should be used as-is
    if (imageSource.startsWith('data:')) {
      return imageSource;
    } 
    
    // Handle absolute URLs
    if (imageSource.startsWith('http://') || imageSource.startsWith('https://')) {
      return imageSource.includes('?') ? imageSource : `${imageSource}?t=${Date.now()}`;
    }
    
    // Handle relative URLs
    const cleanPath = imageSource.replace(/^\/+/, ''); // Remove leading slashes
    return cleanPath.includes('?') ? cleanPath : `${cleanPath}?t=${Date.now()}`;
  }
  
  // Function to preload images for better performance
  function preloadTraitImages(traits) {
    if (!traits || !Array.isArray(traits)) return;
    
    console.log(`Preloading ${traits.length} trait images`);
    
    traits.forEach(trait => {
      if (!trait) return;
      
      // Get image source from different possible properties
      let imageSource = trait.imageData;
      
      if (!imageSource && trait.image) {
        imageSource = typeof trait.image === 'object' ? trait.image.src : trait.image;
      }
      
      // Skip if no valid image source
      if (!imageSource) {
        console.warn('No image source found for trait:', trait.name);
        return;
      }
      
      // Normalize the URL
      const normalizedUrl = normalizeImageUrl(imageSource);
      if (!normalizedUrl) return;
      
      // Preload the image
      const img = new Image();
      img.crossOrigin = "Anonymous"; // Enable cross-origin image loading
      img.onload = function() {
        // Store the successfully loaded image in the trait for faster access
        if (!trait.cachedImage) {
          trait.cachedImage = normalizedUrl;
        }
      };
      img.onerror = function() {
        console.warn('Failed to preload trait image:', trait.name);
      };
      img.src = normalizedUrl;
    });
  }
  
  // Function to fix trait images in the selection modal
  function fixTraitSelectionModalImages() {
    const modal = document.getElementById('trait-selection-modal');
    if (!modal) return;
    
    console.log('Fixing trait selection modal images');
    
    const imageContainers = modal.querySelectorAll('.trait-image-container');
    imageContainers.forEach(container => {
      const img = container.querySelector('img');
      if (!img) return;
      
      // Handle image loading error - hide image instead of showing placeholder
      img.onerror = function() {
        this.onerror = null;
        // Hide the image instead of showing placeholder
        this.style.display = 'none';
        
        // Add a class to indicate image load error
        container.classList.add('image-load-error');
      };
      
      // Force reload of the image with proper URL handling
      const currentSrc = img.getAttribute('src');
      if (currentSrc) {
        const normalizedUrl = normalizeImageUrl(currentSrc);
        if (normalizedUrl) {
          img.setAttribute('src', normalizedUrl);
        }
      }
    });
  }
  
  // Create a mutation observer to detect when the trait selection modal is opened
  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        Array.from(mutation.addedNodes).forEach(node => {
          if (node.id === 'trait-selection-modal' || 
              (node.querySelector && node.querySelector('#trait-selection-modal'))) {
            // Modal has been added to the DOM
            console.log('Trait selection modal added to DOM, fixing images');
            setTimeout(fixTraitSelectionModalImages, 100);
          }
        });
      }
      
      if (mutation.type === 'attributes' && 
          mutation.target.id === 'trait-selection-modal' && 
          mutation.attributeName === 'style' && 
          mutation.target.style.display === 'flex') {
        // Modal has been shown
        console.log('Trait selection modal shown, fixing images');
        setTimeout(fixTraitSelectionModalImages, 100);
      }
    });
  });
  
  // Start observing changes to the body
  observer.observe(document.body, { 
    childList: true, 
    subtree: true,
    attributes: true,
    attributeFilter: ['style']
  });
  
  // Add styles immediately
  addTraitImageStyles();
  
  // Export functions to window for external use
  window.traitImageLoader = {
    preloadTraitImages: preloadTraitImages,
    fixTraitSelectionModalImages: fixTraitSelectionModalImages,
    normalizeImageUrl: normalizeImageUrl,
    createFallbackImageDataUrl: createFallbackImageDataUrl
  };
})(); 