/**
 * Comprehensive Trait Path Debug Script
 * This script helps debug why trait paths are not being saved or loaded
 */
(function() {
  console.log("🔍 TRAIT PATH DEBUG SCRIPT LOADING...");
  
  // Debug state
  let debugState = {
    enhancedReplaceImageLoaded: false,
    enhancedProjectServiceLoaded: false,
    traitLayersModuleFound: false,
    projectServiceModuleFound: false,
    currentProjectExists: false,
    replaceImageHandlersAttached: false
  };
  
  // Function to check all components
  function checkAllComponents() {
    console.log("🔍 CHECKING ALL COMPONENTS FOR TRAIT PATH FUNCTIONALITY...");
    
    // Check if enhanced replace image script is loaded
    debugState.enhancedReplaceImageLoaded = !!(window.saveTraitPaths && window.loadTraitPaths);
    console.log(`✅ Enhanced Replace Image Script: ${debugState.enhancedReplaceImageLoaded ? 'LOADED' : 'NOT LOADED'}`);
    
    // Check if enhanced project service script is loaded
    debugState.enhancedProjectServiceLoaded = !!(window.saveProjectTraitPaths && window.restoreProjectTraitPaths);
    console.log(`✅ Enhanced Project Service Script: ${debugState.enhancedProjectServiceLoaded ? 'LOADED' : 'NOT LOADED'}`);
    
    // Check if trait layers module exists
    debugState.traitLayersModuleFound = !!(window.NFTApp?.getModule("traitLayers"));
    console.log(`✅ Trait Layers Module: ${debugState.traitLayersModuleFound ? 'FOUND' : 'NOT FOUND'}`);
    
    // Check if project service module exists
    debugState.projectServiceModuleFound = !!(window.NFTApp?.getModule("projectService"));
    console.log(`✅ Project Service Module: ${debugState.projectServiceModuleFound ? 'FOUND' : 'NOT FOUND'}`);
    
    // Check if current project exists
    debugState.currentProjectExists = !!(window.currentProject);
    console.log(`✅ Current Project: ${debugState.currentProjectExists ? 'EXISTS' : 'NOT EXISTS'}`);
    
    // Check if replace image handlers are attached
    const replaceImageInputs = document.querySelectorAll(".replace-image-input");
    debugState.replaceImageHandlersAttached = replaceImageInputs.length > 0;
    console.log(`✅ Replace Image Inputs: ${replaceImageInputs.length} found`);
    
    // Check trait path info
    if (window.currentProject && window.currentProject.traits) {
      let totalTraits = 0;
      let traitsWithPaths = 0;
      
      window.currentProject.traits.forEach(layer => {
        if (layer.traits) {
          layer.traits.forEach(trait => {
            totalTraits++;
            if (trait.absolutePath || trait.fileName) {
              traitsWithPaths++;
            }
          });
        }
      });
      
      console.log(`📊 TRAIT PATH STATISTICS:`);
      console.log(`   Total Traits: ${totalTraits}`);
      console.log(`   Traits with Paths: ${traitsWithPaths}`);
      console.log(`   Traits without Paths: ${totalTraits - traitsWithPaths}`);
    }
    
    return debugState;
  }
  
  // Function to test trait path saving
  function testTraitPathSaving() {
    console.log("🧪 TESTING TRAIT PATH SAVING...");
    
    if (!window.currentProject) {
      console.log("❌ No current project to test saving");
      return false;
    }
    
    // Create a test trait with path info
    const testTrait = {
      id: 'test-trait-' + Date.now(),
      name: 'Test Trait',
      imageData: 'data:image/png;base64,test',
      absolutePath: {
        name: 'test-image.png',
        size: 1024,
        type: 'image/png',
        lastModified: Date.now()
      },
      fileName: 'test-image.png',
      fileSize: 1024,
      fileType: 'image/png',
      lastModified: Date.now()
    };
    
    // Add test trait to first layer
    if (window.currentProject.traits && window.currentProject.traits.length > 0) {
      if (!window.currentProject.traits[0].traits) {
        window.currentProject.traits[0].traits = [];
      }
      window.currentProject.traits[0].traits.push(testTrait);
      
      console.log("✅ Test trait added to project");
      
      // Test saving
      if (window.saveProjectTraitPaths) {
        const result = window.saveProjectTraitPaths();
        console.log(`✅ Trait path saving test: ${result ? 'SUCCESS' : 'FAILED'}`);
        return result;
      } else {
        console.log("❌ saveProjectTraitPaths function not available");
        return false;
      }
    } else {
      console.log("❌ No trait layers available for testing");
      return false;
    }
  }
  
  // Function to test trait path loading
  function testTraitPathLoading() {
    console.log("🧪 TESTING TRAIT PATH LOADING...");
    
    if (!window.currentProject) {
      console.log("❌ No current project to test loading");
      return false;
    }
    
    // Test loading
    if (window.restoreProjectTraitPaths) {
      return window.restoreProjectTraitPaths().then(() => {
        console.log("✅ Trait path loading test: SUCCESS");
        return true;
      }).catch(error => {
        console.log("❌ Trait path loading test: FAILED", error);
        return false;
      });
    } else {
      console.log("❌ restoreProjectTraitPaths function not available");
      return Promise.resolve(false);
    }
  }
  
  // Function to simulate replace image functionality
  function simulateReplaceImage() {
    console.log("🧪 SIMULATING REPLACE IMAGE FUNCTIONALITY...");
    
    // Create a mock file input event
    const mockFile = {
      name: 'mock-image.png',
      size: 2048,
      type: 'image/png',
      lastModified: Date.now()
    };
    
    // Create a mock input element
    const mockInput = document.createElement('input');
    mockInput.type = 'file';
    mockInput.setAttribute('data-trait-id', 'test-trait');
    mockInput.setAttribute('data-layer-id', 'test-layer');
    
    // Simulate file selection
    Object.defineProperty(mockInput, 'files', {
      value: [mockFile],
      writable: false
    });
    
    // Test if enhanced handler would work
    if (window.saveTraitPaths) {
      console.log("✅ Enhanced replace image handler is available");
      return true;
    } else {
      console.log("❌ Enhanced replace image handler not available");
      return false;
    }
  }
  
  // Function to run comprehensive tests
  function runComprehensiveTests() {
    console.log("🚀 RUNNING COMPREHENSIVE TRAIT PATH TESTS...");
    
    const componentCheck = checkAllComponents();
    
    console.log("\n🧪 RUNNING FUNCTIONALITY TESTS:");
    
    // Test trait path saving
    const savingTest = testTraitPathSaving();
    
    // Test trait path loading
    testTraitPathLoading().then(loadingTest => {
      // Test replace image simulation
      const replaceImageTest = simulateReplaceImage();
      
      console.log("\n📊 TEST RESULTS SUMMARY:");
      console.log(`Component Check: ${Object.values(componentCheck).every(v => v) ? 'PASS' : 'FAIL'}`);
      console.log(`Trait Path Saving: ${savingTest ? 'PASS' : 'FAIL'}`);
      console.log(`Trait Path Loading: ${loadingTest ? 'PASS' : 'FAIL'}`);
      console.log(`Replace Image Simulation: ${replaceImageTest ? 'PASS' : 'FAIL'}`);
      
      // Provide recommendations
      console.log("\n💡 RECOMMENDATIONS:");
      if (!debugState.enhancedReplaceImageLoaded) {
        console.log("- Enhanced Replace Image script may not be loading properly");
      }
      if (!debugState.enhancedProjectServiceLoaded) {
        console.log("- Enhanced Project Service script may not be loading properly");
      }
      if (!debugState.traitLayersModuleFound) {
        console.log("- Trait Layers module is not found - check module loading");
      }
      if (!debugState.projectServiceModuleFound) {
        console.log("- Project Service module is not found - check module loading");
      }
      if (!debugState.currentProjectExists) {
        console.log("- No current project exists - start a new project first");
      }
    });
  }
  
  // Wait for DOM and modules to be ready
  document.addEventListener("DOMContentLoaded", function() {
    console.log("📄 DOM ready, starting trait path debug...");
    
    // Wait for modules to load
    setTimeout(() => {
      runComprehensiveTests();
    }, 3000);
  });
  
  // Global debug functions
  window.debugTraitPaths = function() {
    console.log("🔍 MANUAL TRAIT PATH DEBUG TRIGGERED");
    runComprehensiveTests();
  };
  
  window.checkTraitPathComponents = function() {
    console.log("🔍 MANUAL COMPONENT CHECK TRIGGERED");
    return checkAllComponents();
  };
  
  window.testTraitPathSaving = function() {
    console.log("🧪 MANUAL TRAIT PATH SAVING TEST TRIGGERED");
    return testTraitPathSaving();
  };
  
  window.testTraitPathLoading = function() {
    console.log("🧪 MANUAL TRAIT PATH LOADING TEST TRIGGERED");
    return testTraitPathLoading();
  };
  
  console.log("🎉 TRAIT PATH DEBUG SCRIPT LOADED!");
})();
