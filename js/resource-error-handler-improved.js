/**
 * Improved Resource Error Handler
 * 
 * This script catches and logs resource loading errors,
 * displaying more helpful error messages in the console.
 */

(function() {
  console.log("Initializing Improved Resource Error Handler...");
  
  // Flag to track if we're running from file:// protocol
  const isFileProtocol = window.location.protocol === 'file:';
  
  // Store whether we've already shown the file protocol warning
  let hasShownFileProtocolWarning = false;
  
  // Listen for all resource errors
  window.addEventListener('error', function(event) {
    // Only handle resource loading errors
    if (event.target && (
        event.target.tagName === 'IMG' || 
        event.target.tagName === 'SCRIPT' || 
        event.target.tagName === 'LINK' || 
        event.target.tagName === 'AUDIO' || 
        event.target.tagName === 'VIDEO')) {
      
      // Get resource information
      const resourceType = event.target.tagName.toLowerCase();
      const resourceUrl = event.target.src || event.target.href;
      
      // Check if this is a file:// protocol error
      if (isFileProtocol && !hasShownFileProtocolWarning) {
        // Show a more helpful message for file:// protocol
        console.warn(
          '%c⚠️ File Protocol Warning ⚠️',
          'background: #FFF3CD; color: #856404; font-size: 14px; font-weight: bold; padding: 5px;'
        );
        console.warn(
          '%cYou are running the application from a local file path (file://), which may cause resource loading issues.',
          'background: #FFF3CD; color: #856404; font-size: 12px; padding: 5px;'
        );
        console.warn(
          '%cFor best results, please use the included server.py script or run "python -m http.server 8081" and access the application at http://localhost:8081',
          'background: #FFF3CD; color: #856404; font-size: 12px; padding: 5px;'
        );
        
        // Mark that we've shown the warning
        hasShownFileProtocolWarning = true;
      }
      
      // For file:// protocol, suppress common errors once we've shown the warning
      if (isFileProtocol && hasShownFileProtocolWarning) {
        // If it's an image loading error from file:// or index.html, just ignore it since we're fixing it
        if ((resourceType === 'img' && (resourceUrl.includes('file:///') || resourceUrl.includes('index.html')))) {
          // Suppress the error by preventing default
          event.preventDefault();
          return;
        }
      }
      
      // Log resource error with improved formatting
      console.error(
        '%c Resource loading error: %s',
        'background: #f8d7da; color: #721c24; font-size: 12px; padding: 5px;',
        resourceUrl
      );
      
      // Notify the error handler
      if (window.ErrorHandler && window.ErrorHandler.handleResourceError) {
        window.ErrorHandler.handleResourceError(resourceType, resourceUrl);
      }
      
      // Prevent the error from showing in the console as a standard error
      if (isFileProtocol && (resourceUrl.includes('file://') || resourceUrl.includes('index.html'))) {
        event.preventDefault();
      }
    }
  }, true);
  
  console.log("Improved Resource Error Handler loaded successfully");
})(); 