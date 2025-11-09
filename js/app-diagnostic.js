/**
 * COMPREHENSIVE APP DIAGNOSTIC SCRIPT
 * This script will diagnose EVERY possible issue with the app
 */
(function() {
  console.log("🚨 COMPREHENSIVE APP DIAGNOSTIC STARTING...");
  
  // Diagnostic results
  let diagnosticResults = {
    serverRunning: false,
    indexHtmlLoaded: false,
    scriptsLoaded: [],
    modulesLoaded: [],
    errors: [],
    traitsWorking: false,
    traitPathWorking: false
  };
  
  // Function to check server
  function checkServer() {
    console.log("🌐 CHECKING SERVER...");
    
    // Check if we can access the page
    if (window.location.href.includes('localhost:8080')) {
      diagnosticResults.serverRunning = true;
      console.log("✅ Server is running on localhost:8080");
    } else {
      diagnosticResults.serverRunning = false;
      console.log("❌ Server not running or wrong URL");
    }
  }
  
  // Function to check if index.html loaded
  function checkIndexHtml() {
    console.log("📄 CHECKING INDEX.HTML...");
    
    const title = document.title;
    const body = document.body;
    
    if (title && body) {
      diagnosticResults.indexHtmlLoaded = true;
      console.log("✅ index.html loaded successfully");
      console.log(`   Title: ${title}`);
      console.log(`   Body has ${body.children.length} children`);
    } else {
      diagnosticResults.indexHtmlLoaded = false;
      console.log("❌ index.html not loaded properly");
    }
  }
  
  // Function to check scripts
  function checkScripts() {
    console.log("📜 CHECKING SCRIPTS...");
    
    const scripts = document.querySelectorAll('script[src]');
    console.log(`Found ${scripts.length} script tags`);
    
    scripts.forEach(script => {
      const src = script.src;
      const fileName = src.split('/').pop();
      
      // Check if script loaded
      if (script.textContent || script.innerHTML) {
        diagnosticResults.scriptsLoaded.push({ file: fileName, loaded: true });
        console.log(`✅ ${fileName} - LOADED`);
      } else {
        diagnosticResults.scriptsLoaded.push({ file: fileName, loaded: false });
        console.log(`❌ ${fileName} - NOT LOADED`);
      }
    });
  }
  
  // Function to check modules
  function checkModules() {
    console.log("🔧 CHECKING MODULES...");
    
    const requiredModules = [
      'NFTApp',
      'traitLayers',
      'projectService',
      'projectInterface',
      'generateNfts',
      'generateNftsUI'
    ];
    
    requiredModules.forEach(moduleName => {
      if (moduleName === 'NFTApp') {
        if (window.NFTApp && window.NFTApp.getModule) {
          diagnosticResults.modulesLoaded.push({ module: moduleName, loaded: true });
          console.log(`✅ ${moduleName} - LOADED`);
        } else {
          diagnosticResults.modulesLoaded.push({ module: moduleName, loaded: false });
          console.log(`❌ ${moduleName} - NOT LOADED`);
        }
      } else {
        const module = window.NFTApp?.getModule(moduleName);
        if (module) {
          diagnosticResults.modulesLoaded.push({ module: moduleName, loaded: true });
          console.log(`✅ ${moduleName} - LOADED`);
        } else {
          diagnosticResults.modulesLoaded.push({ module: moduleName, loaded: false });
          console.log(`❌ ${moduleName} - NOT LOADED`);
        }
      }
    });
  }
  
  // Function to check traits functionality
  function checkTraitsFunctionality() {
    console.log("🎨 CHECKING TRAITS FUNCTIONALITY...");
    
    // Check if traits tab exists
    const traitsTab = document.getElementById('traits-rules');
    if (traitsTab) {
      console.log("✅ Traits tab found");
      
      // Check if trait layers container exists
      const traitLayersContainer = document.getElementById('trait-layers-container');
      if (traitLayersContainer) {
        console.log("✅ Trait layers container found");
        
        // Check if add layer button exists
        const addLayerBtn = document.getElementById('add-layer-btn');
        if (addLayerBtn) {
          console.log("✅ Add layer button found");
          diagnosticResults.traitsWorking = true;
        } else {
          console.log("❌ Add layer button not found");
        }
      } else {
        console.log("❌ Trait layers container not found");
      }
    } else {
      console.log("❌ Traits tab not found");
    }
  }
  
  // Function to check trait path functionality
  function checkTraitPathFunctionality() {
    console.log("🛤️ CHECKING TRAIT PATH FUNCTIONALITY...");
    
    // Check if TraitPathManager exists
    if (window.TraitPathManager) {
      console.log("✅ TraitPathManager found");
      
      // Check if global functions exist
      if (window.saveTraitPaths && window.loadTraitPaths) {
        console.log("✅ Trait path functions found");
        diagnosticResults.traitPathWorking = true;
      } else {
        console.log("❌ Trait path functions not found");
      }
    } else {
      console.log("❌ TraitPathManager not found");
    }
  }
  
  // Function to check for errors
  function checkForErrors() {
    console.log("🚨 CHECKING FOR ERRORS...");
    
    // Check console for errors
    const originalError = console.error;
    console.error = function(...args) {
      diagnosticResults.errors.push(args.join(' '));
      originalError.apply(console, args);
    };
    
    // Check for JavaScript errors
    window.addEventListener('error', function(e) {
      diagnosticResults.errors.push(`JavaScript Error: ${e.message} at ${e.filename}:${e.lineno}`);
    });
  }
  
  // Function to test basic functionality
  function testBasicFunctionality() {
    console.log("🧪 TESTING BASIC FUNCTIONALITY...");
    
    // Test if we can create a new project
    if (window.NFTApp?.getModule('projectService')?.startNew) {
      console.log("✅ Can create new project");
      
      // Test if we can add a trait layer
      if (window.NFTApp?.getModule('traitLayers')?.addEmptyLayer) {
        console.log("✅ Can add trait layer");
      } else {
        console.log("❌ Cannot add trait layer");
      }
    } else {
      console.log("❌ Cannot create new project");
    }
  }
  
  // Function to provide recommendations
  function provideRecommendations() {
    console.log("\n💡 RECOMMENDATIONS:");
    
    if (!diagnosticResults.serverRunning) {
      console.log("- Start the server: python server.py");
    }
    
    if (!diagnosticResults.indexHtmlLoaded) {
      console.log("- Check if index.html exists and is accessible");
    }
    
    const failedScripts = diagnosticResults.scriptsLoaded.filter(s => !s.loaded);
    if (failedScripts.length > 0) {
      console.log("- Fix script loading issues:");
      failedScripts.forEach(s => console.log(`  - ${s.file}`));
    }
    
    const failedModules = diagnosticResults.modulesLoaded.filter(m => !m.loaded);
    if (failedModules.length > 0) {
      console.log("- Fix module loading issues:");
      failedModules.forEach(m => console.log(`  - ${m.module}`));
    }
    
    if (!diagnosticResults.traitsWorking) {
      console.log("- Traits functionality is not working - check trait layers module");
    }
    
    if (!diagnosticResults.traitPathWorking) {
      console.log("- Trait path functionality is not working - check simplified trait path manager");
    }
    
    if (diagnosticResults.errors.length > 0) {
      console.log("- Fix JavaScript errors:");
      diagnosticResults.errors.forEach(e => console.log(`  - ${e}`));
    }
  }
  
  // Main diagnostic function
  function runDiagnostic() {
    console.log("🔍 RUNNING COMPREHENSIVE DIAGNOSTIC...");
    
    checkServer();
    checkIndexHtml();
    checkScripts();
    checkModules();
    checkTraitsFunctionality();
    checkTraitPathFunctionality();
    checkForErrors();
    testBasicFunctionality();
    
    console.log("\n📊 DIAGNOSTIC RESULTS:");
    console.log(`Server Running: ${diagnosticResults.serverRunning ? '✅' : '❌'}`);
    console.log(`Index.html Loaded: ${diagnosticResults.indexHtmlLoaded ? '✅' : '❌'}`);
    console.log(`Scripts Loaded: ${diagnosticResults.scriptsLoaded.filter(s => s.loaded).length}/${diagnosticResults.scriptsLoaded.length}`);
    console.log(`Modules Loaded: ${diagnosticResults.modulesLoaded.filter(m => m.loaded).length}/${diagnosticResults.modulesLoaded.length}`);
    console.log(`Traits Working: ${diagnosticResults.traitsWorking ? '✅' : '❌'}`);
    console.log(`Trait Path Working: ${diagnosticResults.traitPathWorking ? '✅' : '❌'}`);
    console.log(`Errors Found: ${diagnosticResults.errors.length}`);
    
    provideRecommendations();
    
    return diagnosticResults;
  }
  
  // Wait for DOM to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM ready, starting diagnostic...");
    
    // Run diagnostic after a delay to ensure everything loads
    setTimeout(runDiagnostic, 3000);
  });
  
  // Global functions for manual control
  window.runAppDiagnostic = function() {
    console.log("🔍 MANUAL DIAGNOSTIC TRIGGERED");
    return runDiagnostic();
  };
  
  window.getDiagnosticResults = function() {
    return diagnosticResults;
  };
  
  console.log("🎉 COMPREHENSIVE APP DIAGNOSTIC SCRIPT LOADED!");
})();
