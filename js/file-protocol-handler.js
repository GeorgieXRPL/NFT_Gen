/**
 * File Protocol Handler
 * 
 * This script provides special handling for applications running from file:// protocol,
 * fixing common issues with resource loading and path resolution.
 */

console.log("Initializing File Protocol Handler...");

(function() {
  // Check if we're running on file:// protocol
  const isFileProtocol = window.location.protocol === 'file:';
  
  if (!isFileProtocol) {
    console.log("Not running on file:// protocol, skipping file protocol handler");
    return;
  }
  
  console.log("Running on file:// protocol, applying file protocol fixes");
  
  // Handle DOMContentLoaded to fix all initial resources
  document.addEventListener('DOMContentLoaded', function() {
    // Fix resource references
    fixResourceReferences();
    
    // Display informational banner about file:// protocol
    showFileProtocolBanner();
  });
  
  // Fix resource references in the document
  function fixResourceReferences() {
    // Fix image sources
    document.querySelectorAll('img').forEach(fixElementSrc);
    
    // Fix script sources
    document.querySelectorAll('script[src]').forEach(fixElementSrc);
    
    // Fix stylesheet links
    document.querySelectorAll('link[rel="stylesheet"]').forEach(fixElementHref);
    
    // Fix anchor links
    document.querySelectorAll('a[href]').forEach(fixElementHref);
    
    console.log("Fixed resource references for file:// protocol");
  }
  
  // Fix src attribute for elements
  function fixElementSrc(element) {
    const src = element.getAttribute('src');
    if (src && src.startsWith('/')) {
      const newSrc = src.substring(1);
      console.log(`Fixing src path: ${src} -> ${newSrc}`);
      element.src = newSrc;
    }
  }
  
  // Fix href attribute for elements
  function fixElementHref(element) {
    const href = element.getAttribute('href');
    if (href && href.startsWith('/') && !href.startsWith('//')) {
      const newHref = href.substring(1);
      console.log(`Fixing href path: ${href} -> ${newHref}`);
      element.href = newHref;
    }
  }
  
  // Show informational banner about file:// protocol
  function showFileProtocolBanner() {
    // Create banner if it doesn't exist already
    if (document.getElementById('file-protocol-banner')) {
      return;
    }
    
    // Wait a bit to let the page load
    setTimeout(function() {
      const banner = document.createElement('div');
      banner.id = 'file-protocol-banner';
      banner.style.position = 'fixed';
      banner.style.bottom = '0';
      banner.style.left = '0';
      banner.style.right = '0';
      banner.style.backgroundColor = '#fff3cd';
      banner.style.color = '#856404';
      banner.style.padding = '10px 15px';
      banner.style.fontSize = '14px';
      banner.style.textAlign = 'center';
      banner.style.boxShadow = '0 -2px 10px rgba(0,0,0,0.1)';
      banner.style.zIndex = '9999';
      banner.style.display = 'flex';
      banner.style.justifyContent = 'space-between';
      banner.style.alignItems = 'center';
      
      banner.innerHTML = `
        <div>
          <strong>Local File Mode:</strong> 
          For best results, please run <code>python -m http.server 8081</code> in your project folder and access via 
          <a href="http://localhost:8081" style="color: #856404; font-weight: bold;">http://localhost:8081</a>
        </div>
        <button id="hide-file-protocol-banner" style="background: none; border: none; cursor: pointer; font-size: 20px; line-height: 1; color: #856404;">×</button>
      `;
      
      document.body.appendChild(banner);
      
      // Add event listener to hide button
      document.getElementById('hide-file-protocol-banner').addEventListener('click', function() {
        if (banner.parentNode) {
          banner.parentNode.removeChild(banner);
          // Store in session storage to prevent showing again in this session
          try {
            sessionStorage.setItem('hideFileProtocolBanner', 'true');
          } catch (e) {
            // Ignore storage errors
          }
        }
      });
      
      // Check if banner should be hidden based on session storage
      try {
        if (sessionStorage.getItem('hideFileProtocolBanner') === 'true') {
          if (banner.parentNode) {
            banner.parentNode.removeChild(banner);
          }
        }
      } catch (e) {
        // Ignore storage errors
      }
    }, 2000);
  }
  
  // Patch XMLHttpRequest to handle file:// protocol better
  patchXHRForFileProtocol();
  
  function patchXHRForFileProtocol() {
    const originalOpen = XMLHttpRequest.prototype.open;
    
    XMLHttpRequest.prototype.open = function() {
      // If the URL starts with '/', remove the leading slash for file:// protocol
      if (arguments[1] && typeof arguments[1] === 'string' && arguments[1].startsWith('/') && !arguments[1].startsWith('//')) {
        const newUrl = arguments[1].substring(1);
        console.log(`Fixing XHR URL: ${arguments[1]} -> ${newUrl}`);
        arguments[1] = newUrl;
      }
      
      return originalOpen.apply(this, arguments);
    };
  }
  
  // Patch fetch to handle file:// protocol better
  patchFetchForFileProtocol();
  
  function patchFetchForFileProtocol() {
    const originalFetch = window.fetch;
    
    window.fetch = function() {
      // If the URL starts with '/', remove the leading slash for file:// protocol
      if (arguments[0] && typeof arguments[0] === 'string' && arguments[0].startsWith('/') && !arguments[0].startsWith('//')) {
        const newUrl = arguments[0].substring(1);
        console.log(`Fixing fetch URL: ${arguments[0]} -> ${newUrl}`);
        arguments[0] = newUrl;
      }
      
      return originalFetch.apply(this, arguments);
    };
  }
  
  console.log("File Protocol Handler loaded successfully");
})(); 