/**
 * Global Error Handler
 * 
 * This script provides centralized error tracking and handling for the application.
 * It catches JavaScript errors, resource loading errors, and provides fallbacks.
 */

console.log("Initializing Global Error Handler...");

// Create global ErrorHandler namespace
window.ErrorHandler = (function() {
  // Configuration
  const config = {
    maxErrorsTracked: 50,
    showErrorToasts: true,
    logToConsole: true,
    suppressedErrorTypes: [
      // Errors to not show to the user
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Export cancelled by user"
    ]
  };
  
  // Flag to track if we're running from file:// protocol
  const isFileProtocol = window.location.protocol === 'file:';
  
  // Error tracking storage
  const errorLog = {
    jsErrors: [],
    resourceErrors: [],
    lastError: null
  };
  
  // Initialize error handling
  function init() {
    // Set up global error listener
    window.addEventListener('error', function(errorEvent) {
      // Only handle JavaScript errors (not resource errors)
      if (!errorEvent.target || 
          (errorEvent.target === window) || 
          (errorEvent.target.nodeName === 'SCRIPT' && !errorEvent.target.src)) {
        
        handleJsError(errorEvent);
      }
    });
    
    // Set up unhandled promise rejection listener
    window.addEventListener('unhandledrejection', function(event) {
      handlePromiseError(event);
    });
    
    // Log initialization
    console.log("Global error handler initialized");
  }
  
  // Handle JavaScript errors
  function handleJsError(errorEvent) {
    // Skip suppressed errors
    if (shouldSuppressError(errorEvent.error)) {
      return;
    }
    
    // Format error details
    const errorDetails = {
      message: errorEvent.message,
      stack: errorEvent.error ? errorEvent.error.stack : null,
      timestamp: new Date(),
      url: errorEvent.filename,
      line: errorEvent.lineno,
      column: errorEvent.colno
    };
    
    // Check if this is a critical error that could cause a crash
    const isCritical = isCriticalError(errorDetails);
    
    if (isCritical) {
      // Show save warning before the app potentially crashes
      showSaveWarning(errorDetails);
    }
    
    // Log error
    logError(errorDetails);
    
    // Track error
    trackError(errorDetails, 'jsErrors');
    
    // Show error UI if appropriate
    if (config.showErrorToasts) {
      showErrorToast(errorDetails);
    }
  }
  
  // Handle Promise errors
  function handlePromiseError(event) {
    // Skip suppressed errors
    if (shouldSuppressError(event.reason)) {
      return;
    }
    
    // Format error details
    const errorDetails = {
      message: event.reason ? (event.reason.message || 'Unhandled Promise Rejection') : 'Unhandled Promise Rejection',
      stack: event.reason && event.reason.stack ? event.reason.stack : null,
      timestamp: new Date(),
      type: 'promise'
    };
    
    // Check if this is a critical error that could cause a crash
    const isCritical = isCriticalError(errorDetails);
    
    if (isCritical) {
      // Show save warning before the app potentially crashes
      showSaveWarning(errorDetails);
    }
    
    // Log error
    logError(errorDetails);
    
    // Track error
    trackError(errorDetails, 'jsErrors');
    
    // Show error UI if appropriate
    if (config.showErrorToasts) {
      showErrorToast(errorDetails);
    }
  }
  
  // Handle resource errors (called from resource-error-handler-improved.js)
  function handleResourceError(resourceType, resourceUrl) {
    // Skip some common errors for file:// protocol
    if (isFileProtocol) {
      // For file protocol, don't show these common resource errors
      if (resourceUrl.includes('file:///') || resourceUrl === window.location.href || resourceUrl.includes('index.html')) {
        return;
      }
    }
    
    // Format error details
    const errorDetails = {
      message: `Failed to load ${resourceType} from ${resourceUrl}`,
      timestamp: new Date(),
      resourceType: resourceType,
      resourceUrl: resourceUrl
    };
    
    // Log error to console
    console.error(`Resource Error: ${errorDetails.message}`);
    
    // Track error
    trackError(errorDetails, 'resourceErrors');
    
    // Don't show toast for resource errors - they're too common
    // and are usually handled by fallbacks
  }
  
  // Track error in the application error log
  function trackError(errorDetails, errorType) {
    // Add to the appropriate error log
    errorLog[errorType].push(errorDetails);
    
    // Limit error logs to prevent memory leaks
    if (errorLog[errorType].length > config.maxErrorsTracked) {
      errorLog[errorType].shift();
    }
    
    // Update last error
    errorLog.lastError = errorDetails;
    
    // Dispatch error event for any listeners
    document.dispatchEvent(new CustomEvent('app:error', { 
      detail: { error: errorDetails, type: errorType } 
    }));
  }
  
  // Log error to console with formatting
  function logError(errorDetails) {
    if (!config.logToConsole) return;
    
    console.group('%c App Error', 'color: #721c24; background: #f8d7da; padding: 0.3em 0.5em; border-radius: 3px; font-weight: bold;');
    console.error(errorDetails.message);
    
    if (errorDetails.url) {
      console.log(`Location: ${errorDetails.url}:${errorDetails.line}:${errorDetails.column}`);
    }
    
    if (errorDetails.stack) {
      console.log('Stack trace:', errorDetails.stack);
    }
    
    console.groupEnd();
  }
  
  // Show error toast notification
  function showErrorToast(errorDetails) {
    try {
      // Create toast if it doesn't exist
      let toastContainer = document.getElementById('error-toast-container');
      
      if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'error-toast-container';
        toastContainer.style.position = 'fixed';
        toastContainer.style.bottom = '20px';
        toastContainer.style.right = '20px';
        toastContainer.style.zIndex = '10000';
        document.body.appendChild(toastContainer);
      }
      
      // Create toast
      const toast = document.createElement('div');
      toast.className = 'error-toast';
      toast.style.backgroundColor = '#f8d7da';
      toast.style.color = '#721c24';
      toast.style.padding = '10px 15px';
      toast.style.borderLeft = '5px solid #721c24';
      toast.style.borderRadius = '3px';
      toast.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
      toast.style.marginTop = '10px';
      toast.style.position = 'relative';
      toast.style.maxWidth = '350px';
      toast.style.wordBreak = 'break-word';
      
      // Create close button
      const closeBtn = document.createElement('button');
      closeBtn.textContent = '×';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '5px';
      closeBtn.style.right = '5px';
      closeBtn.style.border = 'none';
      closeBtn.style.background = 'none';
      closeBtn.style.fontSize = '18px';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.color = '#721c24';
      
      // Create title
      const title = document.createElement('div');
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '5px';
      title.textContent = 'Application Error';
      
      // Create message
      const message = document.createElement('div');
      message.textContent = truncateErrorMessage(errorDetails.message);
      
      // Assemble toast
      toast.appendChild(closeBtn);
      toast.appendChild(title);
      toast.appendChild(message);
      
      // Add close handler
      closeBtn.addEventListener('click', function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      });
      
      // Auto-remove after 10 seconds
      setTimeout(function() {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 10000);
      
      // Add to container
      toastContainer.appendChild(toast);
    } catch (e) {
      // Fail silently if we can't show toast - don't cause a cascading error
      console.warn('Failed to show error toast:', e);
    }
  }
  
  // Truncate error message if too long
  function truncateErrorMessage(message) {
    if (!message) return 'Unknown error';
    
    if (message.length > 150) {
      return message.substring(0, 147) + '...';
    }
    
    return message;
  }
  
  // Check if an error should be suppressed
  function shouldSuppressError(error) {
    if (!error) return false;
    
    // Check if message matches any suppressed error types
    const errorMessage = error.message || error.toString();
    return config.suppressedErrorTypes.some(suppressedType => 
      errorMessage.includes(suppressedType)
    );
  }
  
  // Check if an error is critical (likely to cause crash)
  function isCriticalError(errorDetails) {
    if (!errorDetails || !errorDetails.message) return false;
    
    const message = errorDetails.message.toLowerCase();
    const criticalIndicators = [
      'out of memory',
      'memory',
      'maximum call stack',
      'stack overflow',
      'too many',
      'cannot read property',
      'cannot read properties',
      'undefined is not',
      'null is not',
      'quotaexceedederror',
      'invalid string length',
      'allocation failed',
      'rangeerror',
      'internalerror'
    ];
    
    return criticalIndicators.some(indicator => message.includes(indicator));
  }
  
  // Show save warning dialog before potential crash
  function showSaveWarning(errorDetails) {
    // Check if warning was already shown recently (within last 10 seconds)
    const lastWarningTime = showSaveWarning.lastShown || 0;
    const now = Date.now();
    if (now - lastWarningTime < 10000) {
      return; // Don't show multiple warnings in quick succession
    }
    showSaveWarning.lastShown = now;
    
    try {
      // Try to use confirmation modal if available
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
        window.NFTApp.getModule("confirmationModal").show(
          "⚠️ Critical Error Detected",
          "The application has encountered a critical error that may cause it to crash.",
          "⚠️ IMPORTANT: Please save your project immediately to prevent data loss!\n\nClick 'OK' to acknowledge and try to save your work.",
          () => {
            // Try to save project if save function is available
            try {
              if (window.NFTApp && window.NFTApp.getModule('projectService')) {
                const projectService = window.NFTApp.getModule('projectService');
                if (typeof projectService.saveProjectData === 'function') {
                  projectService.saveProjectData();
                  console.log('[ErrorHandler] Project saved automatically');
                }
              }
            } catch (saveError) {
              console.error('[ErrorHandler] Failed to auto-save:', saveError);
            }
          }
        );
      } else {
        // Fallback to alert if confirmation modal not available
        const userResponse = confirm(
          "⚠️ CRITICAL ERROR DETECTED ⚠️\n\n" +
          "The application has encountered a critical error that may cause it to crash.\n\n" +
          "⚠️ IMPORTANT: Please save your project immediately to prevent data loss!\n\n" +
          "Error: " + (errorDetails.message || 'Unknown error') + "\n\n" +
          "Click OK to acknowledge and try to save your work."
        );
        
        if (userResponse) {
          // Try to save project if save function is available
          try {
            if (window.NFTApp && window.NFTApp.getModule('projectService')) {
              const projectService = window.NFTApp.getModule('projectService');
              if (typeof projectService.saveProjectData === 'function') {
                projectService.saveProjectData();
                console.log('[ErrorHandler] Project saved automatically');
              }
            }
          } catch (saveError) {
            console.error('[ErrorHandler] Failed to auto-save:', saveError);
          }
        }
      }
    } catch (warningError) {
      console.error('[ErrorHandler] Failed to show save warning:', warningError);
      // Last resort: just alert
      alert("⚠️ CRITICAL ERROR: Please save your project immediately!");
    }
  }
  
  // Get error statistics
  function getErrorStats() {
    return {
      totalJsErrors: errorLog.jsErrors.length,
      totalResourceErrors: errorLog.resourceErrors.length,
      lastError: errorLog.lastError
    };
  }
  
  // Get full error log
  function getFullErrorLog() {
    return {
      ...errorLog
    };
  }
  
  // Clear error log
  function clearErrorLog() {
    errorLog.jsErrors = [];
    errorLog.resourceErrors = [];
    errorLog.lastError = null;
  }
  
  // Initialize the error handler
  init();
  
  // Public API
  return {
    handleResourceError,
    getErrorStats,
    getFullErrorLog,
    clearErrorLog,
    showSaveWarning, // Export for use in other modules
    isCriticalError  // Export for use in other modules
  };
})();

console.log("Global Error Handler loaded successfully"); 