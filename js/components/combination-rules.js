// Combination Rules Module
console.log('[DEBUG] combination-rules.js start: typeof window.NFTApp =', typeof window.NFTApp, window.NFTApp);
console.log("[DEBUG] At start of combination-rules.js: typeof window.NFTApp =", typeof window.NFTApp, window.NFTApp);
console.log('[DEBUG] combination-rules.js before registerModule: typeof window.NFTApp =', typeof window.NFTApp, window.NFTApp);

// Define preservedSelections at the top-level scope so it is always available
var preservedSelections = { firstLayerId: null, secondLayerId: null, firstTraits: [], secondLayerId: null, secondTraits: [] };

// Add this at the top, after preservedSelections is defined
var lastModalSelections = {
  ruleType: null,
  ruleAppliesTo: null,
  firstLayerId: null,
  secondLayerId: null,
  firstTraits: [],
  secondTraits: []
};

// Add at the top of the module (after preservedSelections and lastModalSelections)
const RULE_TYPE_COLORS = {
  'never-combine': '#ff0000',
  'always-combine': '#00b894',
  'conditional-restriction': '#fdcb6e',
  'always-above': '#006cff',
  'always-below': '#ff6600',
  'immediately-above': '#9000ff',
  'immediately-below': '#ffe400',
};

// CRITICAL: Centralized SVG icon definitions for all rule types
// These must be used consistently across all three locations:
// 1. Add Combination Rule modal dropdown
// 2. Added rules headers
// 3. "All Rule Types" filter dropdown (collapsed and expanded)
const RULE_TYPE_SVG_ICONS = {
  'never-combine': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-never-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`,
  'always-combine': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-always-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`,
  'conditional-restriction': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-conditional-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`,
  'always-above': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-above-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`,
  'always-below': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-below-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 16 7 11"></polyline><polyline points="17 4 12 9 7 4"></polyline></svg>`,
  'immediately-above': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-above-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline></svg>`,
  'immediately-below': (color) => `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-below-icon" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline></svg>`,
};

// Make RULE_TYPE_COLORS and RULE_TYPE_SVG_ICONS globally accessible
window.RULE_TYPE_COLORS = RULE_TYPE_COLORS;
window.RULE_TYPE_SVG_ICONS = RULE_TYPE_SVG_ICONS;

// Color map for "Rules Applies to" options (must match colors in custom-dropdown.js)
const RULE_APPLIES_TO_COLORS = {
  'between-layers': '#5c6bc0',      // Indigo/Blue (matches dropdown)
  'between-traits': '#a29bfe',      // Purple (matches dropdown)
  'layer-to-traits': '#74b9ff',     // Light Blue (matches dropdown)
  'traits-to-layer': '#81ecec',     // Cyan (matches dropdown)
};

// Register the module safely, waiting for NFTApp if needed
(function() {
  function registerCombinationRulesModule() {
    if (window.NFTApp && typeof window.NFTApp.registerModule === "function") {
      window.NFTApp.registerModule("combinationRules", window.NFTApp._combinationRulesModuleDef);
    }
  }

  // Store the module definition on NFTApp for later registration if needed
window.NFTApp = window.NFTApp || {};
  window.NFTApp._combinationRulesModuleDef = {
  // CRITICAL: Reordering state for animation (similar to trait layers)
  _reorderingState: {
    isAnimating: false,
    pendingTimeouts: [],
    transitionEndHandlers: []
  },

  // Helper to cancel all pending animations
  _cancelPendingAnimations: function() {
    // Cancel all pending timeouts
    this._reorderingState.pendingTimeouts.forEach(timeout => clearTimeout(timeout));
    this._reorderingState.pendingTimeouts = [];
    
    // Remove all transitionend handlers
    this._reorderingState.transitionEndHandlers.forEach(({ element, handler }) => {
      element.removeEventListener('transitionend', handler);
    });
    this._reorderingState.transitionEndHandlers = [];
    
    // Clean up any elements still in reordering state
    const container = document.getElementById("combination-rules-container");
    if (container) {
      const reorderingElements = container.querySelectorAll(".rule-item.reordering");
      reorderingElements.forEach(element => {
        element.style.transition = "";
        element.style.transform = "";
        element.style.zIndex = "";
        element.classList.remove("reordering");
      });
    }
    
    this._reorderingState.isAnimating = false;
  },

  // Set up the combination rules functionality
  setup: function (projectData) {
    console.log("Setting up combination rules module")

    // CRITICAL: Check visibility ONCE when project is loaded
    // Use a single timeout to ensure project data is fully loaded
    setTimeout(() => {
      this.updateRulesSectionVisibility(projectData)
    }, 500)

    // Set up event listeners
    this.setupEventListeners(projectData)

    // Initialize the rules container
    this.initRulesContainer(projectData)
  },

  // Initialize the rules container
  initRulesContainer: function (projectData) {
    // Note: updateRulesSectionVisibility is called in setup() - no need to call it here
    
    // Function to try updating rules UI
    const tryUpdateRules = () => {
      const rulesContainer = document.getElementById("combination-rules-container")
      if (!rulesContainer) {
        console.warn("[Combination Rules] Container not found, retrying...")
        return false
      }
      
      // If there are existing rules, display them
      if (projectData.rules && projectData.rules.length > 0) {
        this.updateRulesUI(projectData)
        this.updateCheckConflictsButtonState(projectData)
      } else {
        // Even if no rules, ensure container is initialized (shows "No combination rules added yet")
        this.updateRulesUI(projectData)
      }
      return true
    }
    
    // Try immediately
    if (!tryUpdateRules()) {
      // If container not found, retry after a short delay
      setTimeout(() => {
        if (!tryUpdateRules()) {
          // One more retry after a longer delay
          setTimeout(() => {
            tryUpdateRules()
          }, 500)
        }
      }, 100)
    }
  },

  // CRITICAL FIX: Update rules section visibility based on trait layers count and traits
  // ONCE minimum conditions are met, the section stays visible FOREVER (never hidden again)
  updateRulesSectionVisibility: function (projectData) {
    console.log("[DEBUG] Updating rules section visibility")
    
    const rulesSection = document.querySelector('.rules-section')
    if (!rulesSection) {
      // console.warn("[DEBUG] Rules section not found")
      return
    }
    
    // Also get the subsection header to hide it when conditions aren't met
    const subsectionHeader = rulesSection.querySelector('.subsection-header')
    const subsectionTitle = rulesSection.querySelector('.subsection-title')
    const combinationRulesContainer = rulesSection.querySelector('.combination-rules-container')
    
    // CRITICAL: Always use window.currentProject FIRST as it's the most up-to-date source
    // This ensures we get newly added rules immediately, even if stale projectData is passed
    // Priority: 1) window.currentProject (most up-to-date), 2) provided projectData, 3) MemoryManager, 4) module projectData
    let currentProjectData = null
    
    // CRITICAL: Always check window.currentProject FIRST to get the latest rules
    if (window.currentProject && window.currentProject.rules && Array.isArray(window.currentProject.rules)) {
      currentProjectData = window.currentProject
      console.log("[DEBUG] Using window.currentProject for rules visibility check (has", currentProjectData.rules.length, "rules)")
    } else if (projectData && projectData.rules && Array.isArray(projectData.rules)) {
      // Fallback to provided projectData if currentProject doesn't have rules
      currentProjectData = projectData
      console.log("[DEBUG] Using provided projectData for rules visibility check (has", currentProjectData.rules.length, "rules)")
    } else {
      // Try other sources
      if (window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject) {
        const memProject = window.MemoryManager.state.currentProject
        if (memProject && memProject.rules && Array.isArray(memProject.rules)) {
          currentProjectData = memProject
          console.log("[DEBUG] Using MemoryManager.currentProject for rules visibility check (has", currentProjectData.rules.length, "rules)")
        }
      }
      if ((!currentProjectData || !currentProjectData.rules) && window.NFTApp?.getModule('combinationRules')?.projectData) {
        const moduleProjectData = window.NFTApp.getModule('combinationRules').projectData
        if (moduleProjectData && moduleProjectData.rules && Array.isArray(moduleProjectData.rules)) {
          currentProjectData = moduleProjectData
          console.log("[DEBUG] Using combinationRules module projectData for rules visibility check (has", currentProjectData.rules.length, "rules)")
        }
      }
      // Last resort: use provided projectData even if it doesn't have rules
      if (!currentProjectData && projectData) {
        currentProjectData = projectData
        console.log("[DEBUG] Using provided projectData as fallback (may not have rules)")
      }
    }
    
    // CRITICAL: Also check the DOM for existing rules as a final safeguard
    // This prevents hiding the section if rules exist in the DOM but projectData is stale
    const rulesContainer = document.getElementById('combination-rules-container');
    const existingRulesInDOM = rulesContainer ? rulesContainer.querySelectorAll('.rule-item, [data-rule-id]').length : 0;
    const hasRulesInDOM = existingRulesInDOM > 0;
    
    if (hasRulesInDOM && (!currentProjectData || !currentProjectData.rules || currentProjectData.rules.length === 0)) {
      console.log("[DEBUG] Rules exist in DOM but not in projectData - using DOM count (", existingRulesInDOM, "rules)");
      // Create a temporary projectData-like object with rules count from DOM
      if (!currentProjectData) {
        currentProjectData = { rules: [] };
      }
      // Set a flag to indicate rules exist
      currentProjectData._hasRulesInDOM = true;
      currentProjectData._rulesCountFromDOM = existingRulesInDOM;
    }
    
    // Also ensure traits array exists
    if (!currentProjectData || !currentProjectData.traits || !Array.isArray(currentProjectData.traits) || currentProjectData.traits.length === 0) {
      // Try to get from window.currentProject
      if (window.currentProject && window.currentProject.traits && Array.isArray(window.currentProject.traits)) {
        // Merge traits from window.currentProject but keep rules from currentProjectData
        if (currentProjectData) {
          currentProjectData.traits = window.currentProject.traits
        } else {
        currentProjectData = window.currentProject
        }
        console.log("[DEBUG] Using window.currentProject traits for rules visibility check")
      }
    }
    
    // CRITICAL: Check if section has ever been visible (minimum conditions met)
    // Once this flag is set, the section will NEVER be hidden again
    const hasEverBeenVisible = rulesSection.dataset.hasEverBeenVisible === 'true';
    
    // CRITICAL: If section has ever been visible AND we have project data with traits, ALWAYS show it and return immediately
    // This ensures once minimum conditions are met, it stays visible forever
    // BUT: On project load, we still need to check conditions first to set the flag
    if (hasEverBeenVisible && currentProjectData && currentProjectData.traits && Array.isArray(currentProjectData.traits) && currentProjectData.traits.length > 0) {
      console.log("[DEBUG] Rules section has ever been visible - ALWAYS showing (never hiding again)");
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('flex-direction', 'column', 'important');
      rulesSection.style.setProperty('align-items', 'flex-start', 'important');
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'block', 'important');
        combinationRulesContainer.style.setProperty('visibility', 'visible', 'important');
        combinationRulesContainer.style.setProperty('opacity', '1', 'important');
      }
      return; // Early return - never check conditions again once visible
    }
    
    // CRITICAL: Check if rules section is currently being updated - if so, don't hide it
    const isUpdatingRules = rulesSection && rulesSection.dataset.updatingRules === 'true';
    
    // CRITICAL: Check if rules exist first - if so, always show the section
    // Check both projectData and DOM
    const hasRulesInProjectData = currentProjectData && currentProjectData.rules && Array.isArray(currentProjectData.rules) && currentProjectData.rules.length > 0;
    const hasRules = hasRulesInProjectData || hasRulesInDOM || (currentProjectData && currentProjectData._hasRulesInDOM);
    
    console.log("[DEBUG] Rules check - projectData:", hasRulesInProjectData ? currentProjectData.rules.length : 0, "DOM:", existingRulesInDOM, "hasRules:", hasRules, "isUpdating:", isUpdatingRules);
    
    // CRITICAL: If rules section is being updated, always show it
    if (isUpdatingRules) {
      console.log("[DEBUG] Rules section is being updated - forcing visibility");
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'block', 'important');
        combinationRulesContainer.style.setProperty('visibility', 'visible', 'important');
        combinationRulesContainer.style.setProperty('opacity', '1', 'important');
      }
      return; // Early return - don't hide while updating
    }
    
    // CRITICAL: If rules exist (in projectData OR DOM), ALWAYS show the section - this is the most important check
    // This prevents hiding even if called with stale projectData
    if (hasRules) {
      console.log("[DEBUG] Rules exist - ALWAYS showing rules section (projectData:", hasRulesInProjectData ? currentProjectData.rules.length : 0, "DOM:", existingRulesInDOM, ")");
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('flex-direction', 'column', 'important');
      rulesSection.style.setProperty('align-items', 'flex-start', 'important');
      if (subsectionHeader) {
        subsectionHeader.style.setProperty('display', 'flex', 'important');
        subsectionHeader.style.setProperty('visibility', 'visible', 'important');
        subsectionHeader.style.setProperty('opacity', '1', 'important');
      }
      if (subsectionTitle) {
        subsectionTitle.style.setProperty('display', 'flex', 'important');
        subsectionTitle.style.setProperty('visibility', 'visible', 'important');
        subsectionTitle.style.setProperty('opacity', '1', 'important');
      }
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'block', 'important');
        combinationRulesContainer.style.setProperty('visibility', 'visible', 'important');
        combinationRulesContainer.style.setProperty('opacity', '1', 'important');
      }
      return; // Early return - NEVER hide if rules exist
    }
    
    // CRITICAL: Re-check DOM rules one more time before hiding (in case rules were just added)
    // This is a final safeguard against race conditions
    const finalDOMCheck = rulesContainer ? rulesContainer.querySelectorAll('.rule-item, [data-rule-id]').length : 0;
    if (finalDOMCheck > 0) {
      console.log("[DEBUG] Final DOM check found", finalDOMCheck, "rules - showing section");
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'block', 'important');
        combinationRulesContainer.style.setProperty('visibility', 'visible', 'important');
        combinationRulesContainer.style.setProperty('opacity', '1', 'important');
      }
      return; // Early return - NEVER hide if DOM has rules
    }
    
    // Check if projectData exists and has traits
    // CRITICAL: Only hide if there are NO rules (in projectData OR DOM) AND no traits
    // Note: We've already checked hasRules above, so if we reach here, there are no rules
    if (!currentProjectData || ((!currentProjectData.traits || !Array.isArray(currentProjectData.traits)) && !hasRules && finalDOMCheck === 0)) {
      // CRITICAL: Only hide if section has NEVER been visible (minimum conditions never met)
      // If it has ever been visible, NEVER hide it again
      if (!hasEverBeenVisible) {
        // Only hide if there are no rules AND no traits
        console.log("[DEBUG] No project data or traits array, and no rules - hiding rules section (has never been visible)")
      rulesSection.style.setProperty('display', 'none', 'important')
      rulesSection.style.setProperty('visibility', 'hidden', 'important')
      rulesSection.style.setProperty('opacity', '0', 'important')
      if (subsectionHeader) {
        subsectionHeader.style.setProperty('display', 'none', 'important')
        subsectionHeader.style.setProperty('visibility', 'hidden', 'important')
        subsectionHeader.style.setProperty('opacity', '0', 'important')
      }
      if (subsectionTitle) {
        subsectionTitle.style.setProperty('display', 'none', 'important')
        subsectionTitle.style.setProperty('visibility', 'hidden', 'important')
        subsectionTitle.style.setProperty('opacity', '0', 'important')
      }
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'none', 'important')
        combinationRulesContainer.style.setProperty('visibility', 'hidden', 'important')
        combinationRulesContainer.style.setProperty('opacity', '0', 'important')
      }
      return
      } else if (hasEverBeenVisible) {
        // Section has been visible before - keep it visible even if conditions aren't met
        console.log("[DEBUG] Rules section has ever been visible - keeping visible (never hiding again)")
        rulesSection.style.setProperty('display', 'flex', 'important')
        rulesSection.style.setProperty('visibility', 'visible', 'important')
        rulesSection.style.setProperty('opacity', '1', 'important')
        if (combinationRulesContainer) {
          combinationRulesContainer.style.setProperty('display', 'block', 'important')
          combinationRulesContainer.style.setProperty('visibility', 'visible', 'important')
          combinationRulesContainer.style.setProperty('opacity', '1', 'important')
        }
        return
      }
    }
    
    // Check conditions:
    // 1. At least 1 trait layer exists (changed back to 1 to match traits-rules-layout-fix.js)
    // 2. Each trait layer has at least one trait loaded
    const traitLayersCount = currentProjectData.traits.length
    const hasAtLeastOneLayer = traitLayersCount >= 1
    const allLayersHaveTraits = currentProjectData.traits.every(layer => 
      layer && layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0
    )
    
    const shouldShow = hasAtLeastOneLayer && allLayersHaveTraits
    
    // CRITICAL: Also check if there are existing rules - if so, always show the section
    // This prevents the section from being hidden when rules exist, even if conditions aren't fully met
    // Note: hasRules was already checked above, but we check again here to be safe
    const shouldShowWithRules = shouldShow || hasRules;
    
    console.log("[DEBUG] Rules visibility check:", {
      traitLayersCount,
      hasAtLeastOneLayer,
      allLayersHaveTraits,
      shouldShow,
      hasRules,
      shouldShowWithRules,
      rulesCount: hasRules ? currentProjectData.rules.length : 0,
      traits: currentProjectData.traits.map(l => ({ name: l.name, traitCount: l.traits?.length || 0 }))
    })
    
    if (shouldShowWithRules) {
      // Show the rules section with flex display to maintain layout
      rulesSection.style.setProperty('display', 'flex', 'important')
      rulesSection.style.setProperty('visibility', 'visible', 'important')
      rulesSection.style.setProperty('opacity', '1', 'important')
      rulesSection.style.setProperty('flex-direction', 'column', 'important')
      rulesSection.style.setProperty('align-items', 'flex-start', 'important')
      
      // Show subsection header and title
      if (subsectionHeader) {
        subsectionHeader.style.setProperty('display', 'flex', 'important')
        subsectionHeader.style.setProperty('visibility', 'visible', 'important')
        subsectionHeader.style.setProperty('opacity', '1', 'important')
      }
      if (subsectionTitle) {
        subsectionTitle.style.setProperty('display', 'flex', 'important')
        subsectionTitle.style.setProperty('visibility', 'visible', 'important')
        subsectionTitle.style.setProperty('opacity', '1', 'important')
      }
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'block', 'important')
        combinationRulesContainer.style.setProperty('visibility', 'visible', 'important')
        combinationRulesContainer.style.setProperty('opacity', '1', 'important')
      }
      
      console.log("[DEBUG] Rules section is now visible")
      
      // CRITICAL: Mark that section has ever been visible - this means it will NEVER be hidden again
      // Set this flag ONCE when minimum conditions are first met
      if (!hasEverBeenVisible) {
        rulesSection.dataset.hasEverBeenVisible = 'true';
        console.log("[DEBUG] Rules section minimum conditions met - marking as permanently visible (will never hide again)");
      }
      
      // CRITICAL: Ensure bottom buttons are visible when rules section is shown
      setTimeout(() => {
        const bottomButtons = combinationRulesContainer?.querySelector('.bottom-shortcut-buttons')
        if (bottomButtons) {
          bottomButtons.style.cssText = `
            display: flex !important;
            visibility: visible !important;
            opacity: 1 !important;
            position: absolute !important;
            bottom: 0 !important;
            left: 0 !important;
            right: 0 !important;
            width: 100% !important;
            z-index: 100 !important;
            justify-content: flex-end !important;
            align-items: center !important;
            gap: 0 !important;
            padding: 1rem !important;
            padding-left: 0 !important;
            padding-right: 1rem !important;
            margin: 0 !important;
            border-top: 1px solid var(--border-color) !important;
            background: transparent !important;
            pointer-events: auto !important;
            box-sizing: border-box !important;
          `
          console.log("[DEBUG] Bottom buttons forced visible in combination-rules.js")
        }
      }, 100)
    } else {
      // CRITICAL: Only hide if section has NEVER been visible (minimum conditions never met)
      // If it has ever been visible, NEVER hide it again
      if (!hasEverBeenVisible) {
      // Hide the rules section and all its child elements
      rulesSection.style.setProperty('display', 'none', 'important')
      rulesSection.style.setProperty('visibility', 'hidden', 'important')
      rulesSection.style.setProperty('opacity', '0', 'important')
      
      if (subsectionHeader) {
        subsectionHeader.style.setProperty('display', 'none', 'important')
        subsectionHeader.style.setProperty('visibility', 'hidden', 'important')
        subsectionHeader.style.setProperty('opacity', '0', 'important')
      }
      if (subsectionTitle) {
        subsectionTitle.style.setProperty('display', 'none', 'important')
        subsectionTitle.style.setProperty('visibility', 'hidden', 'important')
        subsectionTitle.style.setProperty('opacity', '0', 'important')
      }
      if (combinationRulesContainer) {
        combinationRulesContainer.style.setProperty('display', 'none', 'important')
        combinationRulesContainer.style.setProperty('visibility', 'hidden', 'important')
        combinationRulesContainer.style.setProperty('opacity', '0', 'important')
      }
      
        // CRITICAL: Don't hide if rules exist
        if (hasRules) {
          console.log("[DEBUG] Rules exist but conditions not met - showing section anyway (has", currentProjectData.rules.length, "rules)")
          // Show the section because rules exist
          rulesSection.style.setProperty('display', 'flex', 'important')
          rulesSection.style.setProperty('visibility', 'visible', 'important')
          rulesSection.style.setProperty('opacity', '1', 'important')
          rulesSection.style.setProperty('flex-direction', 'column', 'important')
          rulesSection.style.setProperty('align-items', 'flex-start', 'important')
          if (subsectionHeader) {
            subsectionHeader.style.setProperty('display', 'flex', 'important')
            subsectionHeader.style.setProperty('visibility', 'visible', 'important')
            subsectionHeader.style.setProperty('opacity', '1', 'important')
          }
          if (subsectionTitle) {
            subsectionTitle.style.setProperty('display', 'flex', 'important')
            subsectionTitle.style.setProperty('visibility', 'visible', 'important')
            subsectionTitle.style.setProperty('opacity', '1', 'important')
          }
          if (combinationRulesContainer) {
            combinationRulesContainer.style.setProperty('display', 'block', 'important')
            combinationRulesContainer.style.setProperty('visibility', 'visible', 'important')
            combinationRulesContainer.style.setProperty('opacity', '1', 'important')
          }
          return
        }
        
        if (!hasAtLeastOneLayer) {
          console.log("[DEBUG] Rules section is now hidden - need at least 1 trait layer")
      } else {
        console.log("[DEBUG] Rules section is now hidden - each layer needs at least one trait loaded")
        }
      } else if (hasEverBeenVisible) {
        // Section has been visible before - keep it visible even if conditions aren't met
        console.log("[DEBUG] Rules section has ever been visible - keeping visible (never hiding again)")
        rulesSection.style.setProperty('display', 'flex', 'important')
        rulesSection.style.setProperty('visibility', 'visible', 'important')
        rulesSection.style.setProperty('opacity', '1', 'important')
        if (combinationRulesContainer) {
          combinationRulesContainer.style.setProperty('display', 'block', 'important')
          combinationRulesContainer.style.setProperty('visibility', 'visible', 'important')
          combinationRulesContainer.style.setProperty('opacity', '1', 'important')
        }
      }
    }
  },

  // Set up event listeners for the combination rules
  setupEventListeners: function (projectData) {
    console.log("Setting up combination rules event listeners")
    
    // Note: updateRulesSectionVisibility is only called on project load and when layers are deleted
    // It's not needed on every layer update - once visible, it stays visible

    // Add event listener for add combination rule button
    const addRuleBtn = document.getElementById("add-combination-rule")
    if (addRuleBtn) {
      // Remove any existing event listeners to prevent duplicates
      const newBtn = addRuleBtn.cloneNode(true)
      if (addRuleBtn.parentNode) {
        addRuleBtn.parentNode.replaceChild(newBtn, addRuleBtn)
      }

      // Add the event listener with proper binding to maintain 'this' context
      newBtn.addEventListener("click", () => {
        console.log("Add combination rule button clicked")
        this.addCombinationRule(projectData)
      })
      
      // Setup tooltip for Add Combination Rule button
      const tooltip = newBtn.querySelector(".tooltiptext")
      if (tooltip) {
        // CRITICAL: Ensure cursor is help for tooltip
        newBtn.style.setProperty("cursor", "help", "important");
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          newBtn.removeAttribute('data-tooltip-setup');
          delete newBtn.dataset.tooltipSetup;
          tooltipManager.setupTooltip(newBtn, tooltip);
        }
      }
    } else {
      console.error("Add combination rule button not found")
    }

    // Add event listener for check conflicts button
    const checkConflictsBtn = document.getElementById("check-rule-conflicts")
    if (checkConflictsBtn) {
      // Remove any existing event listeners to prevent duplicates
      const newConflictsBtn = checkConflictsBtn.cloneNode(true)
      if (checkConflictsBtn.parentNode) {
        checkConflictsBtn.parentNode.replaceChild(newConflictsBtn, checkConflictsBtn)
      }

      // Add the event listener
      newConflictsBtn.addEventListener("click", () => {
        console.log("Check conflicts button clicked")
        this.checkRuleConflicts(projectData)
      })
      
      // Setup tooltip for Check Rule Conflicts button
      const tooltip = newConflictsBtn.querySelector(".tooltiptext")
      if (tooltip) {
        // CRITICAL: Ensure cursor is help for tooltip (even when disabled)
        newConflictsBtn.style.setProperty("cursor", "help", "important");
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          newConflictsBtn.removeAttribute('data-tooltip-setup');
          delete newConflictsBtn.dataset.tooltipSetup;
          tooltipManager.setupTooltip(newConflictsBtn, tooltip);
        }
      }
    }

    // Update check conflicts button state
    this.updateCheckConflictsButtonState(projectData)
  },

  // Setup tooltip for rule action buttons (edit, delete, move up/down)
  setupRuleActionTooltip: function(btn, tooltip) {
    if (!btn || !tooltip) return;
    
    // CRITICAL: Skip all tooltips inside Collection Info tab (general-info)
    const isInCollectionInfoTab = btn.closest('#general-info') !== null || 
                                   btn.closest('.tab-content#general-info') !== null ||
                                   (btn.id === 'general-info');
    if (isInCollectionInfoTab) {
      // Remove tooltip class and tooltip element if present
      btn.classList.remove('tooltip');
      const existingTooltip = btn.querySelector('.tooltiptext') || btn.querySelector('.tooltip-text');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      btn.style.cursor = btn.disabled ? "not-allowed" : "default";
      return;
    }
    
    // CRITICAL: Always use global tooltip manager if available - it handles delays and visibility correctly
    // Remove old setup flag to allow re-setup
    if (btn.dataset.tooltipSetup === "true") {
      delete btn.dataset.tooltipSetup;
    }
    
    // CRITICAL: Add cursor help to element (use setProperty with important to override CSS)
    btn.style.setProperty("cursor", "help", "important");
    
    // CRITICAL: Use global tooltip manager - it handles delays and visibility correctly
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    if (tooltipManager && tooltipManager.setupTooltip) {
      tooltipManager.setupTooltip(btn, tooltip);
      return;
    }
    
    // CRITICAL: Skip if already set up to prevent duplicate event listeners (only for fallback)
    if (btn.dataset.tooltipSetup === "true") {
      return;
    }
    btn.dataset.tooltipSetup = "true";

    // CRITICAL: Ensure tooltip has 1 second transition (matching All Rule Types tooltip)
    tooltip.style.setProperty("transition", "opacity 1s ease", "important");
    
    // CRITICAL: Ensure tooltip starts hidden
    tooltip.style.setProperty("visibility", "hidden", "important");
    tooltip.style.setProperty("opacity", "0", "important");
    
    // CRITICAL: Set initial tooltip styling to match All Rule Types tooltip
    tooltip.style.setProperty("position", "fixed", "important");
    tooltip.style.setProperty("z-index", "2147483647", "important");
    tooltip.style.setProperty("background-color", "#000000", "important");
    tooltip.style.setProperty("background", "#000000", "important");
    tooltip.style.setProperty("color", "#f39c12", "important");
    tooltip.style.setProperty("border-radius", "6px", "important");
    tooltip.style.setProperty("padding", "8px 12px", "important");
    tooltip.style.setProperty("font-size", "11px", "important");
    tooltip.style.setProperty("font-family", "'Archivo', sans-serif", "important");
    tooltip.style.setProperty("line-height", "1.4", "important");
    tooltip.style.setProperty("box-shadow", "0 3px 10px rgba(0, 0, 0, 0.5)", "important");
    tooltip.style.setProperty("text-align", "center", "important");
    tooltip.style.setProperty("white-space", "normal", "important");
    tooltip.style.setProperty("word-wrap", "break-word", "important");
    tooltip.style.setProperty("max-width", "300px", "important");
    tooltip.style.setProperty("width", "max-content", "important");
    tooltip.style.setProperty("pointer-events", "none", "important");
    tooltip.style.setProperty("display", "block", "important");
    tooltip.style.setProperty("top", "auto", "important");
    tooltip.style.setProperty("left", "auto", "important");
    tooltip.style.setProperty("bottom", "auto", "important");
    tooltip.style.setProperty("right", "auto", "important");
    tooltip.style.setProperty("transform", "none", "important");
    tooltip.style.setProperty("margin", "0", "important");
    tooltip.style.setProperty("overflow", "visible", "important");
    tooltip.style.setProperty("clip", "auto", "important");
    tooltip.style.setProperty("clip-path", "none", "important");

    // Fallback to local implementation (matching All Rule Types tooltip behavior)
    let tooltipTimeout = null;
    
    btn.addEventListener("mouseenter", () => {
      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      // Show tooltip after 1 second delay (matching All Rule Types tooltip)
      tooltipTimeout = setTimeout(() => {
        // CRITICAL: Set position fixed and z-index FIRST, before making tooltip visible
        // CRITICAL: z-index must be BELOW custom-dropdown (10001 and 999999) to prevent overlap
        tooltip.style.setProperty("position", "fixed", "important");
        // Check if tooltip is in combination-rules-filter-container
        const isInFilterContainer = btn.closest('.combination-rules-filter-container');
        const tooltipZIndex = isInFilterContainer ? "999998" : "9998";
        tooltip.style.setProperty("z-index", tooltipZIndex, "important");
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");
        // CRITICAL: Keep tooltip hidden while measuring, positioned off-screen
        tooltip.style.setProperty("visibility", "hidden", "important");
        tooltip.style.setProperty("opacity", "0", "important");
        tooltip.style.setProperty("top", "-9999px", "important");
        tooltip.style.setProperty("left", "-9999px", "important");
        // Force reflow to ensure styles are applied
        void tooltip.offsetHeight;
        // Now measure tooltip dimensions
        const tooltipWidth = tooltip.offsetWidth || 200;
        const tooltipHeight = tooltip.offsetHeight;
        // CRITICAL: Calculate position BEFORE making tooltip visible
        const elementRect = btn.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (tooltipWidth / 2);
        // CRITICAL: Position tooltip above button (matching All Rule Types tooltip)
        const topPosition = elementRect.top - tooltipHeight - 5;
        // CRITICAL: Set position BEFORE making visible
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
          tooltip.style.setProperty("visibility", "visible", "important");
          tooltip.style.setProperty("opacity", "1", "important");
        });
        tooltipTimeout = null;
      }, 1000);
    });
    
    btn.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      tooltip.style.setProperty("opacity", "0", "important");
      // Wait for fade out transition to complete before hiding (1 second to match All Rule Types tooltip)
      setTimeout(() => {
        tooltip.style.setProperty("visibility", "hidden", "important");
      }, 1000);
    });
  },

  // Add a combination rule
  addCombinationRule: function (projectData) {
    console.log("Add combination rule function called")

    // Check if there are at least 2 trait layers with at least 1 trait each
    if (!this.validateTraitLayers(projectData)) {
      NFTApp.getModule("notificationService").show(
        "Please add at least 2 trait layers with traits in order to be able to add any Combination Rule",
        "error",
      )
      return
    }

    // Show the combination rule modal
    this.showCombinationRuleModal(projectData)
  },

  // Validate that there are at least 2 trait layers with at least 1 trait each
  validateTraitLayers: (projectData) => {
    // Check if there are at least 2 trait layers
    if (!projectData.traits || projectData.traits.length < 2) {
      return false
    }

    // Count how many trait layers have at least 1 trait
    let layersWithTraits = 0
    for (const layer of projectData.traits) {
      if (layer.traits && layer.traits.length > 0) {
        layersWithTraits++
      }
    }

    // Return true if at least 2 layers have traits
    return layersWithTraits >= 2
  },

  // Update the state of the check conflicts button
  updateCheckConflictsButtonState: function(projectData) {
    const checkConflictsBtn = document.getElementById("check-rule-conflicts")
    const conflictBadge = document.getElementById("conflict-badge")
    
    if (checkConflictsBtn) {
      const hasEnoughRules = projectData.rules && projectData.rules.length >= 2
      checkConflictsBtn.disabled = !hasEnoughRules
      
      if (hasEnoughRules) {
        checkConflictsBtn.classList.remove('app-action-btn--disabled')
        
        // Detect conflicts and update badge
        const conflicts = this.detectAllConflicts(projectData)
        if (conflictBadge) {
          if (conflicts.length > 0) {
            conflictBadge.textContent = conflicts.length
            conflictBadge.style.display = 'inline-flex'
          } else {
            conflictBadge.style.display = 'none'
          }
        }
      } else {
        checkConflictsBtn.classList.add('app-action-btn--disabled')
        if (conflictBadge) {
          conflictBadge.style.display = 'none'
        }
      }
    }
  },

  // Check for conflicts between rules
  checkRuleConflicts: function(projectData) {
    console.log("[DEBUG] Checking for rule conflicts...")
    
    if (!projectData.rules || projectData.rules.length < 2) {
      NFTApp.getModule("notificationService").show("Need at least 2 rules to check for conflicts", "info")
      return
    }

    const conflicts = this.detectAllConflicts(projectData)
    
    if (conflicts.length === 0) {
      NFTApp.getModule("notificationService").show("No conflicts found! ✅", "success")
      
      // Update badge to hide it since there are no conflicts
      const conflictBadge = document.getElementById("conflict-badge")
      if (conflictBadge) {
        conflictBadge.style.display = 'none'
      }
    } else {
      console.log("[DEBUG] Found", conflicts.length, "conflicts")
      this.showConflictsModal(projectData, conflicts)
    }
  },

  // Comprehensive conflict detection for ALL rule types
  detectAllConflicts: function(projectData) {
    const conflicts = []
    const rules = projectData.rules || []

    // Check each pair of rules for conflicts
    for (let i = 0; i < rules.length; i++) {
      for (let j = i + 1; j < rules.length; j++) {
        const rule1 = rules[i]
        const rule2 = rules[j]

        // Detect various types of conflicts
        const conflict = this.detectConflictBetweenRules(rule1, rule2, i, j)
        if (conflict) {
          conflicts.push(conflict)
        }
      }
    }

    // Check for circular dependencies
    const circularConflicts = this.detectCircularDependencies(rules)
    conflicts.push(...circularConflicts)

    return conflicts
  },

  // Detect conflict between two specific rules
  detectConflictBetweenRules: function(rule1, rule2, index1, index2) {
    // 1. Check combination rule conflicts (never-combine vs always-combine)
    if ((rule1.type === 'never-combine' || rule1.type === 'conditional-restriction') && 
        (rule2.type === 'always-combine')) {
      if (this.rulesAffectSameTraits(rule1, rule2)) {
        return {
          type: 'combination-conflict',
          rule1: rule1,
          rule2: rule2,
          index1: index1,
          index2: index2,
          description: 'Rules have contradictory requirements: one requires traits to combine, another forbids them from combining'
        }
      }
    }

    // 2. Check stacking order conflicts (above vs below)
    if ((rule1.type === 'always-above' || rule1.type === 'immediately-above') &&
        (rule2.type === 'always-below' || rule2.type === 'immediately-below')) {
      if (this.rulesAffectSameStackingOrder(rule1, rule2)) {
        return {
          type: 'stacking-conflict',
          rule1: rule1,
          rule2: rule2,
          index1: index1,
          index2: index2,
          description: 'Rules have contradictory stacking orders: one requires layer/trait to be above, another requires it to be below'
        }
      }
    }

    // 3. Check immediately-above/below conflicts with always-above/below
    if ((rule1.type === 'immediately-above' && rule2.type === 'always-below') ||
        (rule1.type === 'immediately-below' && rule2.type === 'always-above')) {
      if (this.rulesAffectSameStackingOrder(rule1, rule2)) {
        return {
          type: 'stacking-immediacy-conflict',
          rule1: rule1,
          rule2: rule2,
          index1: index1,
          index2: index2,
          description: 'Rules have contradictory stacking requirements: immediate positioning conflicts with general positioning'
        }
      }
    }

    // 4. Check for same-type conflicts (e.g., two always-above rules with opposite directions)
    if (rule1.type === rule2.type && 
        (rule1.type === 'always-above' || rule1.type === 'always-below' || 
         rule1.type === 'immediately-above' || rule1.type === 'immediately-below')) {
      if (this.rulesAffectOppositeStackingOrder(rule1, rule2)) {
        return {
          type: 'same-type-opposite-direction',
          rule1: rule1,
          rule2: rule2,
          index1: index1,
          index2: index2,
          description: `Both rules are "${rule1.type}" but specify opposite orders (A above B vs B above A)`
        }
      }
    }

    // 5. Check conditional restriction conflicts
    if (rule1.type === 'conditional-restriction' && rule2.type === 'conditional-restriction') {
      if (this.hasConditionalConflict(rule1, rule2)) {
        return {
          type: 'conditional-conflict',
          rule1: rule1,
          rule2: rule2,
          index1: index1,
          index2: index2,
          description: 'Conditional restrictions create impossible combinations'
        }
      }
    }

    return null
  },

  // Check if rules affect the same traits/layers
  rulesAffectSameTraits: function(rule1, rule2) {
    // Get all traits/layers involved in both rules
    const getInvolvedEntities = (rule) => {
      const entities = []
      
      if (rule.firstLayerId) entities.push(`layer:${rule.firstLayerId}`)
      if (rule.secondLayerId) entities.push(`layer:${rule.secondLayerId}`)
      if (rule.layerId) entities.push(`layer:${rule.layerId}`)
      
      if (rule.firstTraits) {
        rule.firstTraits.forEach(t => entities.push(`trait:${t.layerId}:${t.id}`))
      }
      if (rule.secondTraits) {
        rule.secondTraits.forEach(t => entities.push(`trait:${t.layerId}:${t.id}`))
      }
      if (rule.traits) {
        rule.traits.forEach(t => entities.push(`trait:${t.layerId}:${t.id}`))
      }
      
      return entities
    }

    const entities1 = getInvolvedEntities(rule1)
    const entities2 = getInvolvedEntities(rule2)
    
    // Check if there's any overlap
    return entities1.some(e => entities2.includes(e))
  },

  // Check if rules affect the same stacking order
  rulesAffectSameStackingOrder: function(rule1, rule2) {
    // For a conflict, both rules must be talking about the SAME ordering relationship
    // E.g., "A must be above B" conflicts with "A must be below B"
    //       "A must be above B" conflicts with "B must be above A"
    // But "A must be above B" does NOT conflict with "C must be below D"
    
    // Get the entities (layers or specific traits) involved in each rule
    const getEntities = (rule) => {
      const first = []
      const second = []
      
      // For trait-based rules (between-traits, traits-to-layer, layer-to-traits)
      // ONLY use traits if they exist, don't fallback to layers
      if (rule.appliesTo === 'between-traits') {
        // Only add traits, not layers
        if (rule.firstTraits && rule.firstTraits.length > 0) {
          rule.firstTraits.forEach(t => first.push(`trait:${t.layerId}:${t.id}`))
        }
        if (rule.secondTraits && rule.secondTraits.length > 0) {
          rule.secondTraits.forEach(t => second.push(`trait:${t.layerId}:${t.id}`))
        }
      } else if (rule.appliesTo === 'traits-to-layer') {
        // First = traits, Second = layer
        if (rule.traits && rule.traits.length > 0) {
          rule.traits.forEach(t => first.push(`trait:${t.layerId}:${t.id}`))
        }
        if (rule.layerId) {
          second.push(`layer:${rule.layerId}`)
        }
      } else if (rule.appliesTo === 'layer-to-traits') {
        // First = layer, Second = traits
        if (rule.layerId) {
          first.push(`layer:${rule.layerId}`)
        }
        if (rule.traits && rule.traits.length > 0) {
          rule.traits.forEach(t => second.push(`trait:${t.layerId}:${t.id}`))
        }
      } else if (rule.appliesTo === 'between-layers') {
        // Both are layers
        if (rule.firstLayerId) {
          first.push(`layer:${rule.firstLayerId}`)
        }
        if (rule.secondLayerId) {
          second.push(`layer:${rule.secondLayerId}`)
        }
      }
      
      return { first, second }
    }
    
    const entities1 = getEntities(rule1)
    const entities2 = getEntities(rule2)
    
    // If either rule has no entities defined, there's no conflict
    if (entities1.first.length === 0 || entities1.second.length === 0 ||
        entities2.first.length === 0 || entities2.second.length === 0) {
      return false
    }
    
    // Check if the rules are talking about the same relationship
    // Case 1: Same entities, same direction (e.g., both say "A above B")
    const sameDirection = 
      entities1.first.some(e1 => entities2.first.includes(e1)) &&
      entities1.second.some(e2 => entities2.second.includes(e2))
    
    // Case 2: Reversed entities (e.g., "A above B" vs "B above A")
    const reversedDirection =
      entities1.first.some(e1 => entities2.second.includes(e1)) &&
      entities1.second.some(e2 => entities2.first.includes(e2))
    
    return sameDirection || reversedDirection
  },

  // Check if rules specify opposite stacking orders
  rulesAffectOppositeStackingOrder: function(rule1, rule2) {
    // For same-type rules, check if they specify opposite orders
    // E.g., "A above B" vs "B above A" (both are "always-above" but reversed)
    
    // Get the entities involved (use same logic as rulesAffectSameStackingOrder)
    const getEntities = (rule) => {
      const first = []
      const second = []
      
      // For trait-based rules, ONLY use traits if they exist
      if (rule.appliesTo === 'between-traits') {
        if (rule.firstTraits && rule.firstTraits.length > 0) {
          rule.firstTraits.forEach(t => first.push(`trait:${t.layerId}:${t.id}`))
        }
        if (rule.secondTraits && rule.secondTraits.length > 0) {
          rule.secondTraits.forEach(t => second.push(`trait:${t.layerId}:${t.id}`))
        }
      } else if (rule.appliesTo === 'traits-to-layer') {
        if (rule.traits && rule.traits.length > 0) {
          rule.traits.forEach(t => first.push(`trait:${t.layerId}:${t.id}`))
        }
        if (rule.layerId) {
          second.push(`layer:${rule.layerId}`)
        }
      } else if (rule.appliesTo === 'layer-to-traits') {
        if (rule.layerId) {
          first.push(`layer:${rule.layerId}`)
        }
        if (rule.traits && rule.traits.length > 0) {
          rule.traits.forEach(t => second.push(`trait:${t.layerId}:${t.id}`))
        }
      } else if (rule.appliesTo === 'between-layers') {
        if (rule.firstLayerId) {
          first.push(`layer:${rule.firstLayerId}`)
        }
        if (rule.secondLayerId) {
          second.push(`layer:${rule.secondLayerId}`)
        }
      }
      
      return { first, second }
    }
    
    const entities1 = getEntities(rule1)
    const entities2 = getEntities(rule2)
    
    // If either rule has no entities defined, there's no conflict
    if (entities1.first.length === 0 || entities1.second.length === 0 ||
        entities2.first.length === 0 || entities2.second.length === 0) {
      return false
    }
    
    // Check if rule1 says "A above B" and rule2 says "B above A" (reversed)
    const isReversed =
      entities1.first.some(e1 => entities2.second.includes(e1)) &&
      entities1.second.some(e2 => entities2.first.includes(e2))
    
    return isReversed
  },

  // Check for conditional conflicts
  hasConditionalConflict: function(rule1, rule2) {
    // If rule1 says "if A then forbid B" and rule2 says "if A then forbid C"
    // and there's a third rule that requires B and C together, it's a conflict
    // This is a simplified check
    if (rule1.ifLayerId && rule2.ifLayerId && rule1.ifLayerId === rule2.ifLayerId) {
      // Same trigger layer - check if forbidden traits overlap
      return true
    }
    return false
  },

  // Detect circular dependencies
  detectCircularDependencies: function(rules) {
    const conflicts = []
    
    // Build a dependency graph for stacking rules
    const stackingGraph = {}
    const stackingRuleIndices = {}
    
    rules.forEach((rule, index) => {
      if (rule.type === 'always-above' || rule.type === 'immediately-above' ||
          rule.type === 'always-below' || rule.type === 'immediately-below') {
        const from = rule.firstLayerId || (rule.firstTraits && rule.firstTraits[0] ? rule.firstTraits[0].id : null)
        const to = rule.secondLayerId || (rule.secondTraits && rule.secondTraits[0] ? rule.secondTraits[0].id : null)
        
        if (from && to) {
          if (!stackingGraph[from]) stackingGraph[from] = []
          const direction = (rule.type === 'always-above' || rule.type === 'immediately-above') ? 'above' : 'below'
          stackingGraph[from].push({ to, direction, index })
          
          if (!stackingRuleIndices[from]) stackingRuleIndices[from] = {}
          stackingRuleIndices[from][to] = index
        }
      }
    })
    
    // Detect cycles using DFS
    const visited = {}
    const recursionStack = {}
    const path = []
    
    const detectCycle = (node) => {
      visited[node] = true
      recursionStack[node] = true
      path.push(node)
      
      if (stackingGraph[node]) {
        for (const edge of stackingGraph[node]) {
          if (!visited[edge.to]) {
            if (detectCycle(edge.to)) {
              return true
            }
          } else if (recursionStack[edge.to]) {
            // Found a cycle
            const cycleStart = path.indexOf(edge.to)
            const cyclePath = path.slice(cycleStart)
            
            conflicts.push({
              type: 'circular-dependency',
              rule1: rules[edge.index],
              rule2: null,
              index1: edge.index,
              index2: null,
              description: `Circular stacking dependency detected: ${cyclePath.join(' → ')} → ${edge.to}`,
              cyclePath: cyclePath
            })
            
            return true
          }
        }
      }
      
      path.pop()
      recursionStack[node] = false
      return false
    }
    
    Object.keys(stackingGraph).forEach(node => {
      if (!visited[node]) {
        detectCycle(node)
      }
    })
    
    return conflicts
  },

  // Show the conflicts modal with side-by-side display
  showConflictsModal: function(projectData, conflicts) {
    // Create modal overlay
    let modalOverlay = document.getElementById("conflicts-modal")
    if (modalOverlay) {
      modalOverlay.remove()
    }

    modalOverlay = document.createElement("div")
    modalOverlay.id = "conflicts-modal"
    modalOverlay.className = "modal-overlay conflicts-modal-overlay"
    modalOverlay.style.cssText = "display: flex; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 9999; align-items: center; justify-content: center;"

    // Create modal content
    const modalContent = document.createElement("div")
    modalContent.className = "modal conflicts-modal"
    modalContent.style.cssText = "background: #0c0c0e; border-radius: 12px; width: 90%; max-width: 1200px; max-height: 90vh; overflow: hidden; display: flex; flex-direction: column;"

    // Modal header
    const header = document.createElement("div")
    header.className = "conflicts-modal-header"
    header.style.cssText = "padding: 20px; border-bottom: 1px solid #333; display: flex; justify-content: space-between; align-items: center; background: #252530; border-radius: 12px 12px 0 0;"
    header.innerHTML = `
      <h3 style="margin: 0; color: #fff; font-size: 20px; display: flex; align-items: center; gap: 10px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#ff4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="24" height="24">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        ${conflicts.length} Rule Conflict${conflicts.length > 1 ? 's' : ''} Detected
      </h3>
      <button class="conflicts-modal-close-btn" style="width: 32px; height: 32px; border: none; background: #444; color: #fff; font-size: 18px; border-radius: 50%; cursor: pointer;">×</button>
    `

    // Modal body with conflicts
    const body = document.createElement("div")
    body.className = "conflicts-modal-body"
    body.style.cssText = "padding: 20px; overflow-y: auto; flex: 1;"

    conflicts.forEach((conflict, index) => {
      const conflictCard = this.createConflictCard(conflict, index, projectData)
      body.appendChild(conflictCard)
    })

    // Modal footer
    const footer = document.createElement("div")
    footer.className = "conflicts-modal-footer"
    footer.style.cssText = "padding: 15px 20px; border-top: 1px solid #333; display: flex; justify-content: flex-end; background: #252530; border-radius: 0 0 12px 12px;"
    footer.innerHTML = `
      <button class="btn btn-secondary conflicts-modal-close-btn" style="padding: 10px 20px; border-radius: 6px;">Close</button>
    `

    // Assemble modal
    modalContent.appendChild(header)
    modalContent.appendChild(body)
    modalContent.appendChild(footer)
    modalOverlay.appendChild(modalContent)
    document.body.appendChild(modalOverlay)

    // Event listeners
    const closeButtons = modalOverlay.querySelectorAll(".conflicts-modal-close-btn")
    closeButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        modalOverlay.remove()
      })
    })

    // Close on overlay click
    modalOverlay.addEventListener("click", (e) => {
      if (e.target === modalOverlay) {
        modalOverlay.remove()
      }
    })
  },

  // Create a conflict card showing two rules side-by-side
  createConflictCard: function(conflict, index, projectData) {
    const card = document.createElement("div")
    card.className = "conflict-card"
    card.style.cssText = "background: #252530; border: 1px solid #ff4444; border-radius: 12px; padding: 20px; margin-bottom: 20px;"

    // Conflict header
    const header = document.createElement("div")
    header.style.cssText = "margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px solid #444;"
    header.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
        <span style="background: #ff4444; color: #fff; padding: 4px 12px; border-radius: 4px; font-size: 12px; font-weight: 600;">CONFLICT ${index + 1}</span>
        <span style="color: #ff8888; font-size: 13px; text-transform: uppercase; font-weight: 500;">${this.getConflictTypeLabel(conflict.type)}</span>
      </div>
      <p style="color: #ccc; margin: 0; font-size: 14px;">${conflict.description}</p>
    `
    card.appendChild(header)

    // Rules comparison (side-by-side)
    const comparison = document.createElement("div")
    comparison.style.cssText = "display: grid; grid-template-columns: 1fr 1fr; gap: 20px;"

    // Rule 1
    if (conflict.rule1) {
      const rule1Card = this.createRuleDisplayCard(conflict.rule1, conflict.index1, projectData, 1, conflict.rule2)
      comparison.appendChild(rule1Card)
    }

    // Rule 2 (or empty if circular dependency)
    if (conflict.rule2) {
      const rule2Card = this.createRuleDisplayCard(conflict.rule2, conflict.index2, projectData, 2, conflict.rule1)
      comparison.appendChild(rule2Card)
    } else if (conflict.type === 'circular-dependency') {
      const cycleInfo = document.createElement("div")
      cycleInfo.style.cssText = "background: #0c0c0e; border: 1px solid #666; border-radius: 6px; padding: 15px;"
      cycleInfo.innerHTML = `
        <div style="color: #ff8888; font-weight: 600; margin-bottom: 8px;">Circular Path:</div>
        <div style="color: #ccc; font-size: 13px; font-family: monospace;">${conflict.cyclePath ? conflict.cyclePath.join(' → ') : 'N/A'}</div>
      `
      comparison.appendChild(cycleInfo)
    }

    card.appendChild(comparison)
    return card
  },

  // Create a display card for a single rule with Edit/Delete buttons
  createRuleDisplayCard: function(rule, ruleIndex, projectData, ruleNumber, conflictingRule = null) {
    const ruleCard = document.createElement("div")
    ruleCard.style.cssText = "background: #0c0c0e; border: 1px solid #666; border-radius: 6px; padding: 15px; display: flex; flex-direction: column; gap: 10px;"

    // Rule header
    const ruleHeader = document.createElement("div")
    ruleHeader.style.cssText = "display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;"
    ruleHeader.innerHTML = `
      <span style="color: #6c5ce7; font-weight: 600; font-size: 14px;">Rule #${ruleIndex + 1}</span>
      <span style="color: #fff; background: ${RULE_TYPE_COLORS[rule.type] || '#666'}; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${this.getRuleTypeLabel(rule.type)}</span>
    `
    ruleCard.appendChild(ruleHeader)

    // Rule details
    const ruleDetails = document.createElement("div")
    ruleDetails.style.cssText = "color: #ccc; font-size: 13px; flex: 1;"
    ruleDetails.innerHTML = this.formatRuleDetails(rule, projectData, conflictingRule)
    ruleCard.appendChild(ruleDetails)

    // Action buttons
    const actions = document.createElement("div")
    actions.style.cssText = "display: flex; gap: 8px; margin-top: 10px; padding-top: 10px; border-top: 1px solid #333;"
    actions.innerHTML = `
      <button class="btn btn-sm btn-primary edit-conflict-rule" data-rule-index="${ruleIndex}" style="flex: 1; padding: 6px 12px; font-size: 12px; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 5px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
        Edit
      </button>
      <button class="btn btn-sm btn-danger delete-conflict-rule" data-rule-index="${ruleIndex}" style="flex: 1; padding: 6px 12px; font-size: 12px; border-radius: 4px; display: flex; align-items: center; justify-content: center; gap: 5px;">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="14" height="14">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
        Delete
      </button>
    `
    ruleCard.appendChild(actions)

    // Add event listeners for Edit/Delete
    setTimeout(() => {
      const editBtn = actions.querySelector(".edit-conflict-rule")
      const deleteBtn = actions.querySelector(".delete-conflict-rule")

      if (editBtn) {
        editBtn.addEventListener("click", () => {
          this.editRuleFromConflictModal(projectData, ruleIndex)
        })
      }

      if (deleteBtn) {
        deleteBtn.addEventListener("click", () => {
          this.deleteRuleFromConflictModal(projectData, ruleIndex)
        })
      }
    }, 0)

    return ruleCard
  },

  // Format rule details for display
  formatRuleDetails: function(rule, projectData, conflictingRule = null) {
    let details = ''
    
    console.log('[DEBUG] Formatting rule:', rule)

    // Helper function to get conflicting entities
    const getConflictingEntities = (rule1, rule2) => {
      if (!rule2) return { first: new Set(), second: new Set() }
      
      const entities1 = this.extractEntitiesFromRule(rule1)
      const entities2 = this.extractEntitiesFromRule(rule2)
      
      const conflictingFirst = new Set()
      const conflictingSecond = new Set()
      
      // Find overlapping entities
      entities1.first.forEach(e1 => {
        if (entities2.first.some(e2 => e2 === e1) || entities2.second.some(e2 => e2 === e1)) {
          conflictingFirst.add(e1)
        }
      })
      
      entities1.second.forEach(e2 => {
        if (entities2.first.some(e1 => e1 === e2) || entities2.second.some(e1 => e1 === e2)) {
          conflictingSecond.add(e2)
        }
      })
      
      return { first: conflictingFirst, second: conflictingSecond }
    }
    
    // Helper function to highlight names
    const highlightIfConflict = (names, entityIds, conflictingSet) => {
      if (!conflictingRule || conflictingSet.size === 0) {
        return `<strong>${names}</strong>`
      }
      
      const nameArray = names.split(', ')
      const highlighted = nameArray.map((name, idx) => {
        const entityId = entityIds[idx]
        if (conflictingSet.has(entityId)) {
          return `<strong style="color: #ff0000; font-weight: 700;">${name}</strong>`
        }
        return `<strong>${name}</strong>`
      })
      
      return highlighted.join(', ')
    }
    
    const conflicting = conflictingRule ? getConflictingEntities(rule, conflictingRule) : { first: new Set(), second: new Set() }

    if (rule.type === 'never-combine' || rule.type === 'always-combine') {
      const layer1 = projectData.traits.find(l => l.id === rule.firstLayerId)
      const layer2 = projectData.traits.find(l => l.id === rule.secondLayerId)
      const actionText = rule.type === 'never-combine' ? 'never combine with' : 'always combine with'
      const actionColor = RULE_TYPE_COLORS[rule.type] || '#ccc'
      const action = `<span style="color: ${actionColor}; font-weight: 500;">${actionText}</span>`
      
      if (rule.appliesTo === 'between-layers') {
        const layer1Display = highlightIfConflict(layer1?.name || 'Unknown', [`layer:${rule.firstLayerId}`], conflicting.first)
        const layer2Display = highlightIfConflict(layer2?.name || 'Unknown', [`layer:${rule.secondLayerId}`], conflicting.second)
        details = `${layer1Display} ${action} ${layer2Display}`
      } else if (rule.appliesTo === 'between-traits') {
        const traits1Names = rule.firstTraits?.map(t => t.name).join(', ') || 'Unknown'
        const traits1Ids = rule.firstTraits?.map(t => `trait:${t.layerId}:${t.id}`) || []
        const traits2Names = rule.secondTraits?.map(t => t.name).join(', ') || 'Unknown'
        const traits2Ids = rule.secondTraits?.map(t => `trait:${t.layerId}:${t.id}`) || []
        
        const traits1Display = highlightIfConflict(traits1Names, traits1Ids, conflicting.first)
        const traits2Display = highlightIfConflict(traits2Names, traits2Ids, conflicting.second)
        details = `Traits ${traits1Display} ${action} ${traits2Display}`
      }
    } else if (rule.type === 'conditional-restriction') {
      const ifLayer = projectData.traits.find(l => l.id === rule.ifLayerId)
      const thenLayer = projectData.traits.find(l => l.id === rule.thenLayerId)
      const forbidColor = RULE_TYPE_COLORS[rule.type] || '#ccc'
      const ifDisplay = highlightIfConflict(ifLayer?.name || 'Unknown', [`layer:${rule.ifLayerId}`], conflicting.first)
      const thenDisplay = highlightIfConflict(thenLayer?.name || 'Unknown', [`layer:${rule.thenLayerId}`], conflicting.second)
      details = `If ${ifDisplay} <span style="color: ${forbidColor}; font-weight: 500;">then forbid</span> ${thenDisplay}`
    } else if (rule.type === 'always-above' || rule.type === 'always-below' || 
               rule.type === 'immediately-above' || rule.type === 'immediately-below') {
      const firstId = rule.firstLayerId || rule.layerId
      const secondId = rule.secondLayerId || (rule.traits && rule.traits[0] ? rule.traits[0].layerId : null)
      
      let layer1 = projectData.traits.find(l => l.id === firstId)
      let layer2 = projectData.traits.find(l => l.id === secondId)
      
      const layer1Name = layer1?.name || rule.firstLayerName || rule.layerName
      const layer2Name = layer2?.name || rule.secondLayerName
      
      let firstDescription = layer1Name
      let secondDescription = layer2Name
      let firstIds = []
      let secondIds = []
      
      if (rule.appliesTo === 'traits-to-layer' && rule.traits && rule.traits.length > 0) {
        firstDescription = rule.traits.map(t => t.name || t.id).join(', ')
        firstIds = rule.traits.map(t => `trait:${t.layerId}:${t.id}`)
        secondDescription = layer2Name || rule.layerName
        secondIds = [rule.layerId ? `layer:${rule.layerId}` : `layer:${secondId}`]
      } else if (rule.appliesTo === 'layer-to-traits' && rule.traits && rule.traits.length > 0) {
        firstDescription = layer1Name || rule.layerName
        firstIds = [rule.layerId ? `layer:${rule.layerId}` : `layer:${firstId}`]
        secondDescription = rule.traits.map(t => t.name || t.id).join(', ')
        secondIds = rule.traits.map(t => `trait:${t.layerId}:${t.id}`)
      } else if (rule.appliesTo === 'between-traits') {
        if (rule.firstTraits && rule.firstTraits.length > 0) {
          firstDescription = rule.firstTraits.map(t => t.name || t.id).join(', ')
          firstIds = rule.firstTraits.map(t => `trait:${t.layerId}:${t.id}`)
        }
        if (rule.secondTraits && rule.secondTraits.length > 0) {
          secondDescription = rule.secondTraits.map(t => t.name || t.id).join(', ')
          secondIds = rule.secondTraits.map(t => `trait:${t.layerId}:${t.id}`)
        }
      } else if (rule.appliesTo === 'between-layers') {
        firstIds = [`layer:${firstId}`]
        secondIds = [`layer:${secondId}`]
      }
      
      const position = rule.type.includes('above') ? 'above' : 'below'
      const immediacy = rule.type.includes('immediately') ? 'immediately ' : ''
      const actionColor = RULE_TYPE_COLORS[rule.type] || '#ccc'
      const actionText = `must be ${immediacy}${position}`
      
      const firstDisplay = highlightIfConflict(firstDescription || 'Layer/Trait', firstIds, conflicting.first)
      const secondDisplay = highlightIfConflict(secondDescription || 'Layer/Trait', secondIds, conflicting.second)
      
      details = `${firstDisplay} <span style="color: ${actionColor}; font-weight: 500;">${actionText}</span> ${secondDisplay}`
    }

    return details || '<em>Rule details unavailable</em>'
  },
  
  // Helper to extract entities from a rule (for conflict highlighting)
  extractEntitiesFromRule: function(rule) {
    const first = []
    const second = []
    
    if (rule.appliesTo === 'between-traits') {
      if (rule.firstTraits && rule.firstTraits.length > 0) {
        rule.firstTraits.forEach(t => first.push(`trait:${t.layerId}:${t.id}`))
      }
      if (rule.secondTraits && rule.secondTraits.length > 0) {
        rule.secondTraits.forEach(t => second.push(`trait:${t.layerId}:${t.id}`))
      }
    } else if (rule.appliesTo === 'traits-to-layer') {
      if (rule.traits && rule.traits.length > 0) {
        rule.traits.forEach(t => first.push(`trait:${t.layerId}:${t.id}`))
      }
      if (rule.layerId) {
        second.push(`layer:${rule.layerId}`)
      }
    } else if (rule.appliesTo === 'layer-to-traits') {
      if (rule.layerId) {
        first.push(`layer:${rule.layerId}`)
      }
      if (rule.traits && rule.traits.length > 0) {
        rule.traits.forEach(t => second.push(`trait:${t.layerId}:${t.id}`))
      }
    } else if (rule.appliesTo === 'between-layers') {
      if (rule.firstLayerId) {
        first.push(`layer:${rule.firstLayerId}`)
      }
      if (rule.secondLayerId) {
        second.push(`layer:${rule.secondLayerId}`)
      }
    }
    
    return { first, second }
  },

  // Get human-readable conflict type label
  getConflictTypeLabel: function(type) {
    const labels = {
      'combination-conflict': 'Combination Conflict',
      'stacking-conflict': 'Stacking Order Conflict',
      'stacking-immediacy-conflict': 'Stacking Immediacy Conflict',
      'same-type-opposite-direction': 'Opposite Direction',
      'conditional-conflict': 'Conditional Conflict',
      'circular-dependency': 'Circular Dependency'
    }
    return labels[type] || type
  },

  // Get human-readable rule type label
  getRuleTypeLabel: function(type) {
    const labels = {
      'never-combine': 'Never Combine',
      'always-combine': 'Always Combine',
      'conditional-restriction': 'Conditional',
      'always-above': 'Always Above',
      'always-below': 'Always Below',
      'immediately-above': 'Immediately Above',
      'immediately-below': 'Immediately Below'
    }
    return labels[type] || type
  },

  // Edit rule from conflict modal
  editRuleFromConflictModal: function(projectData, ruleIndex) {
    const rule = projectData.rules[ruleIndex]
    if (!rule) {
      console.error("Rule not found at index", ruleIndex)
      return
    }

    // DON'T close conflicts modal - keep it open in background
    // Mark that we're editing from conflicts
    this.editingFromConflicts = true
    this.conflictsBeforeEdit = this.detectAllConflicts(projectData)

    // Open edit modal (it will appear on top)
    this.showCombinationRuleModal(projectData, rule)
    
    // Set higher z-index for edit modal to appear on top of conflicts modal
    setTimeout(() => {
      const editModal = document.getElementById("combination-rule-modal")
      if (editModal) {
        editModal.style.zIndex = "10000" // Higher than conflicts modal (9999)
      }
    }, 0)
  },

  // Delete rule from conflict modal
  deleteRuleFromConflictModal: function(projectData, ruleIndex) {
    const rule = projectData.rules[ruleIndex]
    if (!rule) {
      console.error("Rule not found at index", ruleIndex)
      return
    }

    // Show confirmation
    if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
      window.NFTApp.getModule("confirmationModal").show(
        "Delete Rule",
        `Are you sure you want to delete this rule?`,
        "This action cannot be undone.",
        () => {
          // Delete the rule
          projectData.rules.splice(ruleIndex, 1)
          this.updateRulesUI(projectData)
          this.updateCheckConflictsButtonState(projectData)

          // Close and re-check for conflicts
          const conflictsModal = document.getElementById("conflicts-modal")
          if (conflictsModal) {
            conflictsModal.remove()
          }

          // Notification
          NFTApp.getModule("notificationService").show("Rule deleted successfully", "success")

          // Re-check if there are still conflicts
          if (projectData.rules.length >= 2) {
            setTimeout(() => {
              this.checkRuleConflicts(projectData)
            }, 300)
          }
        }
      )
    } else {
      if (confirm("Are you sure you want to delete this rule? This action cannot be undone.")) {
        projectData.rules.splice(ruleIndex, 1)
        this.updateRulesUI(projectData)
        this.updateCheckConflictsButtonState(projectData)

        const conflictsModal = document.getElementById("conflicts-modal")
        if (conflictsModal) {
          conflictsModal.remove()
        }

        if (projectData.rules.length >= 2) {
          setTimeout(() => {
            this.checkRuleConflicts(projectData)
          }, 300)
        }
      }
    }
  },

  // Show the combination rule modal
  showCombinationRuleModal: function (projectData, ruleToEdit = null) {
      // Clear lastModalSelections to prevent stale data from previous edits
      if (window.lastModalSelections) {
        window.lastModalSelections.firstLayerId = null;
        window.lastModalSelections.secondLayerId = null;
        window.lastModalSelections.firstTraits = [];
        window.lastModalSelections.secondTraits = [];
        window.lastModalSelections.ruleType = null;
        window.lastModalSelections.ruleAppliesTo = null;
      }
      
      // If editing, store the current selections
      if (ruleToEdit) {
        preservedSelections.firstLayerId = ruleToEdit.firstLayerId || ruleToEdit.layerId || (ruleToEdit.firstTraits && ruleToEdit.firstTraits[0] ? ruleToEdit.firstTraits[0].layerId : null);
        preservedSelections.secondLayerId = ruleToEdit.secondLayerId || ruleToEdit.layerId || (ruleToEdit.secondTraits && ruleToEdit.secondTraits[0] ? ruleToEdit.secondTraits[0].layerId : null);
        preservedSelections.firstTraits = ruleToEdit.firstTraits ? ruleToEdit.firstTraits.map(t => t.id) : (ruleToEdit.traits && ruleToEdit.appliesTo === 'traits-to-layer' ? ruleToEdit.traits.map(t => t.id) : []);
        preservedSelections.secondTraits = ruleToEdit.secondTraits ? ruleToEdit.secondTraits.map(t => t.id) : (ruleToEdit.traits && ruleToEdit.appliesTo === 'layer-to-traits' ? ruleToEdit.traits.map(t => t.id) : []);
      }

    // Create modal overlay if it doesn't exist
    let modalOverlay = document.getElementById("combination-rule-modal")
    if (!modalOverlay) {
      modalOverlay = document.createElement("div")
      modalOverlay.id = "combination-rule-modal"
      modalOverlay.className = "modal-overlay"
      document.body.appendChild(modalOverlay)
    }

    // Get default layers for the dropdowns
    const defaultFirstLayer = projectData.traits[projectData.traits.length - 1] // Bottom layer
    const defaultSecondLayer = projectData.traits[projectData.traits.length - 2] || projectData.traits[0] // Layer above bottom

    // Set default values or use values from rule to edit
    const defaultRuleType = ruleToEdit ? ruleToEdit.type : "never-combine"
    const defaultRuleAppliesTo = ruleToEdit ? ruleToEdit.appliesTo : "between-layers"
    
    // Determine first layer ID based on rule type
    let defaultFirstLayerId = defaultFirstLayer.id
    if (ruleToEdit) {
      if (ruleToEdit.appliesTo === 'traits-to-layer') {
        // For traits-to-layer: first layer is where the traits are from
        defaultFirstLayerId = ruleToEdit.traits && ruleToEdit.traits[0] ? ruleToEdit.traits[0].layerId : defaultFirstLayer.id
      } else if (ruleToEdit.appliesTo === 'layer-to-traits') {
        // For layer-to-traits: first layer is the layer (from layerId)
        defaultFirstLayerId = ruleToEdit.layerId || ruleToEdit.firstLayerId || defaultFirstLayer.id
      } else {
        // For other types: use firstLayerId or firstTraits
        defaultFirstLayerId = ruleToEdit.firstLayerId || 
          (ruleToEdit.firstTraits && ruleToEdit.firstTraits[0] ? ruleToEdit.firstTraits[0].layerId : defaultFirstLayer.id)
      }
    }
    
    // Determine second layer ID based on rule type
    let defaultSecondLayerId = defaultSecondLayer.id
    if (ruleToEdit) {
      if (ruleToEdit.appliesTo === 'layer-to-traits') {
        // For layer-to-traits: second layer is where the traits are from
        defaultSecondLayerId = ruleToEdit.traits && ruleToEdit.traits[0] ? ruleToEdit.traits[0].layerId : defaultSecondLayer.id
      } else if (ruleToEdit.appliesTo === 'traits-to-layer') {
        // For traits-to-layer: second layer is the layer (from layerId)
        defaultSecondLayerId = ruleToEdit.layerId || ruleToEdit.secondLayerId || defaultSecondLayer.id
      } else {
        // For other types: use secondLayerId or secondTraits
        defaultSecondLayerId = ruleToEdit.secondLayerId || 
          (ruleToEdit.secondTraits && ruleToEdit.secondTraits[0] ? ruleToEdit.secondTraits[0].layerId : defaultSecondLayer.id)
      }
    }

    // Create modal content matching Dark NFT Traits/Select Trait modal style
    modalOverlay.innerHTML = `
      <div class="combination-rule-overlay">
        <div class="combination-rule-container">
          <div class="combination-rule-header">
            <div class="combination-rule-title-container">
              <h2 class="combination-rule-title">${ruleToEdit ? "Edit" : "Add"} Combination Rule</h2>
              <div class="combination-rule-tip">Configure rules to control how traits can or cannot appear together in your NFTs</div>
            </div>
            <button id="close-combination-rule-modal" class="combination-rule-close-btn">
              &times;
            </button>
          </div>
          
          <div class="combination-rule-body">
            <div class="rule-controls-row">
              <div class="form-group">
                <label for="rule-type">Rule Type:</label>
                <select id="rule-type" class="form-control rule-type-select custom-dropdown-convert">
                  <option value="never-combine" class="never-combine-option" ${
                    defaultRuleType === "never-combine" ? "selected" : ""
                  }>Never Combine</option>
                  <option value="always-combine" class="always-combine-option" ${
                    defaultRuleType === "always-combine" ? "selected" : ""
                  }>Always Combine</option>
                  <option value="always-above" class="always-above-option" ${
                    defaultRuleType === "always-above" ? "selected" : ""
                  }>Always Above</option>
                  <option value="always-below" class="always-below-option" ${
                    defaultRuleType === "always-below" ? "selected" : ""
                  }>Always Below</option>
                  <option value="immediately-above" class="immediately-above-option" ${
                    defaultRuleType === "immediately-above" ? "selected" : ""
                  }>Immediately Above</option>
                  <option value="immediately-below" class="immediately-below-option" ${
                    defaultRuleType === "immediately-below" ? "selected" : ""
                  }>Immediately Below</option>
                </select>
              </div>

              <div class="form-group">
                <label for="rule-applies-to">Rule Applies to:</label>
                <select id="rule-applies-to" class="form-control custom-dropdown-convert">
                  <option value="between-layers" class="between-layers-option" ${
                    defaultRuleAppliesTo === "between-layers" ? "selected" : ""
                  }>Between Entire Layers</option>
                  <option value="between-traits" class="between-traits-option" ${
                    defaultRuleAppliesTo === "between-traits" ? "selected" : ""
                  }>Between Specific Traits</option>
                  <option value="layer-to-traits" class="layer-to-traits-option" ${
                    defaultRuleAppliesTo === "layer-to-traits" ? "selected" : ""
                  }>Between Layer and Specific Trait(s)</option>
                  <option value="traits-to-layer" class="traits-to-layer-option" ${
                    defaultRuleAppliesTo === "traits-to-layer" ? "selected" : ""
                  }>Between Specific Trait(s) and Layer</option>
                </select>
              </div>
            </div>
              
            <div class="rule-selectors" style="display: flex; gap: 10px;">
              <div class="form-group first-selector" style="flex: 1; min-width: 0;">
                <label for="first-layer" id="first-selector-label">First Layer:</label>
                <select id="first-layer" class="form-control">
                  ${this.generateLayerOptions(projectData, defaultFirstLayerId)}
                </select>
                <div id="first-traits-container" class="traits-selection-container" style="display: none;">
                  <div class="traits-selection-header">
                    <span>Select trait(s):</span>
                    <div class="traits-selection-actions">
                      <button class="btn btn-sm btn-secondary select-all-traits" data-target="first">Select All</button>
                      <button class="btn btn-sm btn-secondary deselect-all-traits" data-target="first">Deselect All</button>
                    </div>
                  </div>
                  <div id="first-traits-list" class="traits-selection-list">
                    ${this.generateTraitsList(
                      projectData.traits.find((layer) => layer.id === defaultFirstLayerId),
                      "first",
                      ruleToEdit,
                    )}
                  </div>
                </div>
              </div>
              
              <div class="form-group second-selector" style="flex: 1; min-width: 0;">
                <label for="second-layer" id="second-selector-label">Second Layer:</label>
                <select id="second-layer" class="form-control">
                  ${this.generateLayerOptions(projectData, defaultSecondLayerId)}
                </select>
                <div id="second-traits-container" class="traits-selection-container" style="display: none;">
                  <div class="traits-selection-header">
                    <span>Select trait(s):</span>
                    <div class="traits-selection-actions">
                      <button class="btn btn-sm btn-secondary select-all-traits" data-target="second">Select All</button>
                      <button class="btn btn-sm btn-secondary deselect-all-traits" data-target="second">Deselect All</button>
                    </div>
                  </div>
                  <div id="second-traits-list" class="traits-selection-list">
                    ${this.generateTraitsList(
                      projectData.traits.find((layer) => layer.id === defaultSecondLayerId),
                      "second",
                      ruleToEdit,
                    )}
                  </div>
                </div>
              </div>
            </div>
              
            <div class="rule-description">
              <p id="rule-description-text">This rule will prevent traits from these layers from appearing together in the same NFT.</p>
            </div>
          </div>
          
          <div class="combination-rule-footer">
            <button class="btn btn-secondary" id="cancel-rule">Cancel</button>
            <button class="btn btn-primary" id="save-rule">${ruleToEdit ? "Update" : "Add"} Rule</button>
          </div>
        </div>
      </div>
  `

      // Tooltip functionality removed - no longer needed

    // Show the modal
    modalOverlay.style.display = "flex"

    // Initialize custom dropdowns
    setTimeout(() => {
      console.log("Initializing custom dropdowns after modal is shown")
      // CRITICAL: Only init if not already initialized for rules-filter-dropdown
      // The rules-filter-dropdown should already be initialized by setupRulesFilter
      // This init is only for modal dropdowns
      if (NFTApp.customDropdown && typeof NFTApp.customDropdown.init === 'function') {
      NFTApp.customDropdown.init()
      }
      
      // Function to remove tooltips from dropdowns
      const removeTooltipsFromDropdowns = () => {
        const firstLayerSelect = document.getElementById("first-layer")
        const secondLayerSelect = document.getElementById("second-layer")
        
        if (firstLayerSelect) {
          firstLayerSelect.classList.remove("tooltip")
          const tooltipText = firstLayerSelect.querySelector(".tooltiptext")
          if (tooltipText) tooltipText.remove()
        }
        
        if (secondLayerSelect) {
          secondLayerSelect.classList.remove("tooltip")
          const tooltipText = secondLayerSelect.querySelector(".tooltiptext")
          if (tooltipText) tooltipText.remove()
        }
        
        // Also remove from custom dropdown containers if they exist
        const firstCustomDropdown = firstLayerSelect?.customDropdown || firstLayerSelect?.parentElement?.querySelector(".custom-dropdown")
        const secondCustomDropdown = secondLayerSelect?.customDropdown || secondLayerSelect?.parentElement?.querySelector(".custom-dropdown")
        
        if (firstCustomDropdown) {
          firstCustomDropdown.classList.remove("tooltip")
          const tooltipElements = firstCustomDropdown.querySelectorAll(".tooltiptext")
          tooltipElements.forEach(el => el.remove())
          const selectedDisplay = firstCustomDropdown.querySelector(".custom-dropdown-selected")
          if (selectedDisplay) {
            selectedDisplay.classList.remove("tooltip")
            const tooltipText = selectedDisplay.querySelector(".tooltiptext")
            if (tooltipText) tooltipText.remove()
          }
        }
        
        if (secondCustomDropdown) {
          secondCustomDropdown.classList.remove("tooltip")
          const tooltipElements = secondCustomDropdown.querySelectorAll(".tooltiptext")
          tooltipElements.forEach(el => el.remove())
          const selectedDisplay = secondCustomDropdown.querySelector(".custom-dropdown-selected")
          if (selectedDisplay) {
            selectedDisplay.classList.remove("tooltip")
            const tooltipText = selectedDisplay.querySelector(".tooltiptext")
            if (tooltipText) tooltipText.remove()
          }
        }
      }
      
      // Remove tooltips immediately and also after a delay to catch any late-created dropdowns
      removeTooltipsFromDropdowns()
      setTimeout(removeTooltipsFromDropdowns, 300)
    }, 100)

    // Set up event listeners for the modal
    this.setupModalEventListeners(projectData, modalOverlay, ruleToEdit)

    // Ensure the modal is scrolled to the top when opened
    const modalBody = modalOverlay.querySelector(".combination-rule-body")
    if (modalBody) {
      modalBody.scrollTop = 0
    }

      // --- PATCH: Garantir selects e checkboxes corretos ao editar ---
      if (ruleToEdit) {
        setTimeout(() => {
          // Set selects FIRST
          const ruleTypeSelect = document.getElementById("rule-type");
          const ruleAppliesToSelect = document.getElementById("rule-applies-to");
          const firstLayerSelect = document.getElementById("first-layer");
          const secondLayerSelect = document.getElementById("second-layer");
          if (ruleTypeSelect && ruleToEdit.type) ruleTypeSelect.value = ruleToEdit.type;
          if (ruleAppliesToSelect && ruleToEdit.appliesTo) ruleAppliesToSelect.value = ruleToEdit.appliesTo;
          
          // Handle layer-to-traits: first layer is the layer, second layer is where traits come from
          if (ruleToEdit.appliesTo === 'layer-to-traits') {
            if (firstLayerSelect && ruleToEdit.layerId) firstLayerSelect.value = ruleToEdit.layerId;
            if (secondLayerSelect && ruleToEdit.traits && ruleToEdit.traits.length > 0) {
              secondLayerSelect.value = ruleToEdit.traits[0].layerId;
            }
          }
          // Handle traits-to-layer: first layer is where traits come from, second layer is the layer
          else if (ruleToEdit.appliesTo === 'traits-to-layer') {
            if (firstLayerSelect && ruleToEdit.traits && ruleToEdit.traits.length > 0) {
              firstLayerSelect.value = ruleToEdit.traits[0].layerId;
            }
            if (secondLayerSelect && ruleToEdit.layerId) secondLayerSelect.value = ruleToEdit.layerId;
          }
          // Handle other rule types
          else {
            if (firstLayerSelect && (ruleToEdit.firstLayerId || ruleToEdit.layerId)) firstLayerSelect.value = ruleToEdit.firstLayerId || ruleToEdit.layerId;
            if (secondLayerSelect && (ruleToEdit.secondLayerId || ruleToEdit.layerId)) secondLayerSelect.value = ruleToEdit.secondLayerId || ruleToEdit.layerId;
          }

          // Update selectors (renders trait lists) - AFTER setting layer values
          this.updateSelectors(projectData, ruleToEdit);

          // Mark checkboxes for traits (for all rule types)
          const markTraitCheckboxes = (prefix, traitObjs) => {
            if (!traitObjs || traitObjs.length === 0) return;
            
            const retryMarkTraitCheckboxes = (attempts = 0) => {
              if (attempts > 10) return; // Increase max attempts
              
              let allFound = true;
              traitObjs.forEach(trait => {
                const id = trait.id || trait;
                const label = document.querySelector(`#${prefix}-traits-list .trait-checkbox-label[data-trait-id='${id}']`);
                if (label) {
                  label.classList.add('selected');
                  label.setAttribute('data-selected', '1');
                } else {
                  allFound = false;
                }
              });
              
              if (!allFound && attempts < 10) {
                setTimeout(() => retryMarkTraitCheckboxes(attempts + 1), 100);
              }
            };
            
            retryMarkTraitCheckboxes();
          };
          
          // Wait a bit longer for trait lists to be rendered before marking
          setTimeout(() => {
            // For all rule types, always mark the correct traits
            if (ruleToEdit.firstTraits) markTraitCheckboxes('first', ruleToEdit.firstTraits);
            if (ruleToEdit.secondTraits) markTraitCheckboxes('second', ruleToEdit.secondTraits);
            // For rules with a single traits array (like traits-to-layer/layer-to-traits)
            if (ruleToEdit.traits) {
              if (ruleToEdit.appliesTo === 'traits-to-layer') {
                markTraitCheckboxes('first', ruleToEdit.traits);
              }
              if (ruleToEdit.appliesTo === 'layer-to-traits') {
                markTraitCheckboxes('second', ruleToEdit.traits);
              }
            }
          }, 300);
        }, 200);
      }
      // --- END PATCH ---

      // Add Select All / Deselect All event listeners for both trait lists
      ['first', 'second'].forEach(prefix => {
        const selectAllBtn = modalOverlay.querySelector(`.select-all-traits[data-target="${prefix}"]`);
        const deselectAllBtn = modalOverlay.querySelector(`.deselect-all-traits[data-target="${prefix}"]`);
        const traitsList = document.getElementById(`${prefix}-traits-list`);
        if (selectAllBtn && traitsList) {
          selectAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const labels = traitsList.querySelectorAll('.trait-checkbox-label');
            labels.forEach(label => {
              label.classList.add('selected');
              label.setAttribute('data-selected', '1');
            });
          });
        }
        if (deselectAllBtn && traitsList) {
          deselectAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const labels = traitsList.querySelectorAll('.trait-checkbox-label');
            labels.forEach(label => {
              label.classList.remove('selected');
              label.setAttribute('data-selected', '0');
            });
          });
        }
      });
  },

  // Generate options for layer select dropdowns
  generateLayerOptions: (projectData, selectedLayerId) =>
    projectData.traits
      .map(
        (layer) =>
          `<option value="${layer.id}" ${layer.id === selectedLayerId ? "selected" : ""}>${layer.name}</option>`,
      )
      .join(""),

  // Generate traits list for selection
  generateTraitsList: (layer, prefix, ruleToEdit = null, selectedTraitIdsArg = null) => {
    if (!layer || !layer.traits || layer.traits.length === 0) {
      return '<div class="empty-traits-message">No traits available in this layer</div>'
    }

    // Get selected trait IDs if editing a rule or from argument
    let selectedTraitIds = []
    if (selectedTraitIdsArg) {
      selectedTraitIds = selectedTraitIdsArg
    } else if (ruleToEdit) {
      if (
        ruleToEdit.type === 'always-above' ||
        ruleToEdit.type === 'always-below' ||
        ruleToEdit.type === 'immediately-above' ||
        ruleToEdit.type === 'immediately-below'
      ) {
        if (prefix === 'first' && ruleToEdit.firstTraits) {
          selectedTraitIds = ruleToEdit.firstTraits.map(t => t.id)
        } else if (prefix === 'second' && ruleToEdit.secondTraits) {
          selectedTraitIds = ruleToEdit.secondTraits.map(t => t.id)
        }
      } else {
        if (prefix === 'first' && ruleToEdit.firstTraits) {
          selectedTraitIds = ruleToEdit.firstTraits.map(t => t.id)
        } else if (prefix === 'second' && ruleToEdit.secondTraits) {
          selectedTraitIds = ruleToEdit.secondTraits.map(t => t.id)
        } else if (ruleToEdit.traits) {
          // Check for traits-to-layer or layer-to-traits
          if (
            (prefix === 'first' && ruleToEdit.appliesTo === 'traits-to-layer') ||
            (prefix === 'second' && ruleToEdit.appliesTo === 'layer-to-traits')
          ) {
            selectedTraitIds = ruleToEdit.traits.map(t => t.id)
          }
        }
      }
    }

    // Sort traits alphabetically by name
    const sortedTraits = [...layer.traits].sort((a, b) => a.name.localeCompare(b.name))

    // Render trait checkboxes with ellipsis and tooltip
    return `
        <div class="traits-list-for-rule-grid">
        ${sortedTraits
          .map(
            (trait) => {
              const rarity = (trait.rarity || 0).toFixed(1);
              return `
                <div class="trait-grid-item">
                  <label class="trait-checkbox-label${selectedTraitIds.includes(trait.id) ? ' selected' : ''}" data-trait-id="${trait.id}" tabindex="0">
                    <span class="trait-checkbox-thumb">
                      ${trait.imageData ? `<img src="${trait.imageData}" alt="${trait.name}" class="nft-trait-thumb">` : ''}
                    </span>
                    <span class="combination-rule-trait-rarity">${rarity}%</span>
                    <button class="combination-rule-trait-view-btn" type="button" title="View full-size preview of ${trait.name}">VIEW</button>
                    <span class="trait-selection-name" style="height: 22px;">
                      <span class="trait-name-ellipsis-combo">${trait.name}</span>
                    </span>
                  </label>
                </div>
            `
            }
          )
          .join('')}
      </div>
    `
  },

  // Set up event listeners for the combination rule modal
  setupModalEventListeners: function (projectData, modalOverlay, ruleToEdit = null) {
    // Store ruleToEdit for use in event listeners
    this.currentlyEditingRule = ruleToEdit;
    
    // Close button
    const closeBtn = document.getElementById("close-combination-rule-modal")
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        modalOverlay.style.display = "none"
        this.currentlyEditingRule = null; // Clear on close
      })
    }

    // Cancel button
    const cancelBtn = document.getElementById("cancel-rule")
    if (cancelBtn) {
      cancelBtn.addEventListener("click", () => {
        modalOverlay.style.display = "none"
        this.currentlyEditingRule = null; // Clear on close
      })
    }

    // Save button
    const saveBtn = document.getElementById("save-rule")
    if (saveBtn) {
      saveBtn.addEventListener("click", () => {
        if (ruleToEdit) {
          this.updateRule(ruleToEdit.id, projectData, modalOverlay)
        } else {
          this.saveRule(projectData, modalOverlay)
        }
      })
    }

    // Rule type dropdown
    const ruleTypeSelect = document.getElementById("rule-type")
    if (ruleTypeSelect) {
      ruleTypeSelect.addEventListener("change", () => {
        // Always clear errors when switching rule type
        if (typeof clearErrorMessages === 'function') clearErrorMessages();
        // Store current selections before UI update
        lastModalSelections.firstLayerId = document.getElementById("first-layer")?.value;
        lastModalSelections.secondLayerId = document.getElementById("second-layer")?.value;
        lastModalSelections.firstTraits = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
        lastModalSelections.secondTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
        this.updateRuleDescription()
        this.updateRuleAppliesToOptions()
        this.updateSelectors(projectData, ruleToEdit)
        setTimeout(() => {
          NFTApp.customDropdown.updateDropdown(ruleTypeSelect)
          // Re-apply selections after UI update
          if (lastModalSelections.firstLayerId) document.getElementById("first-layer").value = lastModalSelections.firstLayerId;
          if (lastModalSelections.secondLayerId) document.getElementById("second-layer").value = lastModalSelections.secondLayerId;
          // Mark trait checkboxes
          lastModalSelections.firstTraits.forEach(id => {
            const label = document.querySelector(`#first-traits-list .trait-checkbox-label[data-trait-id='${id}']`);
            if (label) {
              label.classList.add('selected');
              label.setAttribute('data-selected', '1');
            }
          });
          lastModalSelections.secondTraits.forEach(id => {
            const label = document.querySelector(`#second-traits-list .trait-checkbox-label[data-trait-id='${id}']`);
            if (label) {
              label.classList.add('selected');
              label.setAttribute('data-selected', '1');
            }
          });
        }, 100);
      })
    }

    // Rule applies to dropdown
    const ruleAppliesToSelect = document.getElementById("rule-applies-to")
    if (ruleAppliesToSelect) {
      ruleAppliesToSelect.addEventListener("change", () => {
        // Always clear errors when switching applies-to
        if (typeof clearErrorMessages === 'function') clearErrorMessages();
        // Store current selections before UI update
        lastModalSelections.firstLayerId = document.getElementById("first-layer")?.value;
        lastModalSelections.secondLayerId = document.getElementById("second-layer")?.value;
        lastModalSelections.firstTraits = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
        lastModalSelections.secondTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
        // Update selectors based on the new "Rule Applies To" value
        this.updateSelectors(projectData, ruleToEdit)
        setTimeout(() => {
          NFTApp.customDropdown.updateDropdown(ruleAppliesToSelect)
          // Re-apply selections after UI update
          if (lastModalSelections.firstLayerId) document.getElementById("first-layer").value = lastModalSelections.firstLayerId;
          if (lastModalSelections.secondLayerId) document.getElementById("second-layer").value = lastModalSelections.secondLayerId;
          // Mark trait checkboxes
          lastModalSelections.firstTraits.forEach(id => {
            const label = document.querySelector(`#first-traits-list .trait-checkbox-label[data-trait-id='${id}']`);
            if (label) {
              label.classList.add('selected');
              label.setAttribute('data-selected', '1');
            }
          });
          lastModalSelections.secondTraits.forEach(id => {
            const label = document.querySelector(`#second-traits-list .trait-checkbox-label[data-trait-id='${id}']`);
            if (label) {
              label.classList.add('selected');
              label.setAttribute('data-selected', '1');
            }
          });
        }, 100);
      })
    }

    // First layer dropdown
    const firstLayerSelectEl = document.getElementById("first-layer")
    if (firstLayerSelectEl) {
      firstLayerSelectEl.addEventListener("change", () => {
        // Pass currentlyEditingRule to preserve trait selections when editing
        this.updateTraitsList(projectData, "first", this.currentlyEditingRule)

        // Add validation when layer changes to check if both dropdowns have the same layer
        const secondLayerSelect = document.getElementById("second-layer")
        if (secondLayerSelect && firstLayerSelectEl.value === secondLayerSelect.value) {
          // Show warning about same layer selection
          this.showSameLayerWarning(modalOverlay)
        } else {
          // Clear any same layer warnings
          this.clearSameLayerWarning(modalOverlay)
        }
      })
    }

    // Second layer dropdown
    const secondLayerSelect = document.getElementById("second-layer")
    if (secondLayerSelect) {
      secondLayerSelect.addEventListener("change", () => {
        // Pass currentlyEditingRule to preserve trait selections when editing
        this.updateTraitsList(projectData, "second", this.currentlyEditingRule)

        // Add validation when layer changes to check if both dropdowns have the same layer
        const firstLayerSelectEl = document.getElementById("first-layer")
        if (firstLayerSelectEl && firstLayerSelectEl.value === secondLayerSelect.value) {
          // Show warning about same layer selection
          this.showSameLayerWarning(modalOverlay)
        } else {
          // Clear any same layer warnings
          this.clearSameLayerWarning(modalOverlay)
        }
      })
    }

    // Initialize the UI based on default selections
    this.updateRuleDescription()
    // Initialize the Rule Applies To options based on the default rule type
    this.updateRuleAppliesToOptions()
    this.updateSelectors(projectData, ruleToEdit)

    // Check if the initial layer selections are the same and show warning if needed
    // Reuse the already declared firstLayerSelectEl variable
    if (firstLayerSelectEl && secondLayerSelect && firstLayerSelectEl.value === secondLayerSelect.value) {
      this.showSameLayerWarning(modalOverlay)
    }

    // Add this to the setupModalEventListeners function after the existing layer change event listeners
    // Check initial state of layers and disable save button if needed
    setTimeout(() => {
      const firstLayerSelectEl = document.getElementById("first-layer")
      const secondLayerSelect = document.getElementById("second-layer")
      if (firstLayerSelectEl && secondLayerSelect && firstLayerSelectEl.value === secondLayerSelect.value) {
        this.showSameLayerWarning(modalOverlay)
      }
    }, 100)

      // Remove checkbox logic and add label click logic for selection
      // Patch: Only attach trait selection listeners if both trait lists exist
      const firstTraitsList = document.getElementById('first-traits-list');
      const secondTraitsList = document.getElementById('second-traits-list');
      if (firstTraitsList && secondTraitsList) {
        ['first', 'second'].forEach(prefix => {
          const traitsList = document.getElementById(`${prefix}-traits-list`);
          if (traitsList) {
            // Add VIEW button click handlers
            traitsList.addEventListener('click', function(e) {
              const viewBtn = e.target.closest('.combination-rule-trait-view-btn');
              if (viewBtn) {
                e.stopPropagation();
                const label = viewBtn.closest('.trait-checkbox-label');
                if (label) {
                  const traitId = label.getAttribute('data-trait-id');
                  const traitItem = label.closest('.trait-grid-item');
                  
                  // Find the layer and trait data
                  const allLayers = projectData.traits || [];
                  let traitData = null;
                  let layerData = null;
                  
                  for (const layer of allLayers) {
                    traitData = layer.traits?.find(t => t.id === traitId);
                    if (traitData) {
                      layerData = layer;
                      break;
                    }
                  }
                  
                  if (traitData && (traitData.imageData || traitData.image)) {
                    const generateNftsUI = window.NFTApp?.getModule?.('generateNftsUI');
                    if (generateNftsUI && generateNftsUI.showTraitFullSizePopup) {
                      const traitObj = {
                        trait: {
                          image: traitData.image || traitData.imageData,
                          imageData: traitData.imageData || traitData.image,
                          name: traitData.name,
                          rarity: traitData.rarity
                        },
                        layer: { name: layerData?.name || 'Unknown Layer' }
                      };
                      generateNftsUI.showTraitFullSizePopup(
                        traitObj,
                        layerData?.name || 'Unknown Layer',
                        traitData.name
                      );
                    }
                  }
                }
                return;
              }
              
              // Handle label or trait-grid-item click (trait selection)
              // Only toggle selection, don't open preview
              const label = e.target.closest('.trait-checkbox-label');
              const traitGridItem = e.target.closest('.trait-grid-item');
              
              // Don't toggle if clicking on VIEW button (handled above)
              if (e.target.closest('.combination-rule-trait-view-btn')) {
                return;
              }
              
              // Toggle selection when clicking on label or any part of the trait-grid-item
              if (label || traitGridItem) {
                e.preventDefault();
                e.stopPropagation();
                
                // If clicked on trait-grid-item, find its label
                const targetLabel = label || traitGridItem?.querySelector('.trait-checkbox-label');
                if (targetLabel) {
                  targetLabel.classList.toggle('selected');
                  targetLabel.setAttribute('data-selected', targetLabel.classList.contains('selected') ? '1' : '0');
                  // --- DEBUG: Log selected trait IDs after every click ---
                  const selectedFirst = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
                  const selectedSecond = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
                  console.log('[DEBUG] Trait selection changed:', { first: selectedFirst, second: selectedSecond });
                }
              }
            });
            traitsList.addEventListener('keydown', function(e) {
              if ((e.key === 'Enter' || e.key === ' ') && e.target.classList.contains('trait-checkbox-label')) {
                e.preventDefault();
                e.target.classList.toggle('selected');
                e.target.setAttribute('data-selected', e.target.classList.contains('selected') ? '1' : '0');
                // --- DEBUG: Log selected trait IDs after every keyboard toggle ---
                const selectedFirst = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
                const selectedSecond = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(l => l.getAttribute('data-trait-id'));
                console.log('[DEBUG] Trait selection changed:', { first: selectedFirst, second: selectedSecond });
              }
            });
          }
        });
      } else {
        console.warn('[CombinationRules] One or both trait lists missing in modal, skipping trait selection event listeners.', { firstTraitsList, secondTraitsList });
      }
  },

  // Show warning when the same layer is selected in both dropdowns
  showSameLayerWarning: function (modalOverlay) {
    // Remove any existing warnings first
    this.clearSameLayerWarning(modalOverlay)

    // Create warning element
    const warningDiv = document.createElement("div")
    warningDiv.id = "same-layer-warning"
    warningDiv.className = "validation-warning"
    warningDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px; vertical-align: middle;">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>Warning: You've selected the same layer in both dropdowns. Rules cannot be created within the same layer.</span>
    `

    // Add warning as a child of rule-selectors (will be absolutely positioned)
    const ruleSelectors = modalOverlay.querySelector(".rule-selectors")
    if (ruleSelectors) {
      ruleSelectors.appendChild(warningDiv)
    }

    // Disable the save button
    const saveBtn = document.getElementById("save-rule")
    if (saveBtn) {
      saveBtn.disabled = true
      saveBtn.classList.add("disabled")
      // Remove title and add custom tooltip
      saveBtn.removeAttribute('title');
      saveBtn.classList.add('tooltip');
      let saveTooltip = saveBtn.querySelector('.tooltiptext');
      if (!saveTooltip) {
        saveTooltip = document.createElement('span');
        saveTooltip.className = 'tooltiptext';
        saveBtn.appendChild(saveTooltip);
      }
      saveTooltip.textContent = "Cannot create rules with the same layer selected in both dropdowns";
    }
  },

  // Clear same layer warning
  clearSameLayerWarning: (modalOverlay) => {
    const existingWarning = modalOverlay.querySelector("#same-layer-warning")
    if (existingWarning) {
      existingWarning.remove()
    }

    // Re-enable the save button
    const saveBtn = document.getElementById("save-rule")
    if (saveBtn) {
      saveBtn.disabled = false
      saveBtn.classList.remove("disabled")
      // Remove title and custom tooltip
      saveBtn.removeAttribute('title');
      saveBtn.classList.remove('tooltip');
      const saveTooltip = saveBtn.querySelector('.tooltiptext');
      if (saveTooltip) saveTooltip.remove();
    }
  },

  // Update the rule description based on the selected rule type
  updateRuleDescription: () => {
    const ruleType = document.getElementById("rule-type").value
    const descriptionText = document.getElementById("rule-description-text")

    if (!descriptionText) return

    switch (ruleType) {
      case "never-combine":
        descriptionText.textContent =
          "This rule will prevent traits from these layers from appearing together in the same NFT."
        break
      case "always-combine":
        descriptionText.textContent =
          "This rule will ensure that traits from these layers always appear together in the same NFT."
        break
      case "always-above":
        descriptionText.textContent =
          "This rule will ensure that the selected traits or layers always appear above the other selected traits or layers."
        break
      case "always-below":
        descriptionText.textContent =
          "This rule will ensure that the selected traits or layers always appear below the other selected traits or layers."
        break
        case "immediately-above":
          descriptionText.textContent =
            "This rule will ensure that the selected traits or layers appear immediately above the other selected traits or layers."
          break
        case "immediately-below":
          descriptionText.textContent =
            "This rule will ensure that the selected traits or layers appear immediately below the other selected traits or layers."
          break
      default:
        descriptionText.textContent = ""
    }
  },

  // Update the selectors based on the selected rule applies to option
  updateSelectors: function (projectData, ruleToEdit = null) {
    const ruleType = document.getElementById("rule-type").value
    const ruleAppliesTo = document.getElementById("rule-applies-to").value
    const firstSelectorLabel = document.getElementById("first-selector-label")
    const secondSelectorLabel = document.getElementById("second-selector-label")
    const firstLayerSelect = document.getElementById("first-layer")
    const secondLayerSelect = document.getElementById("second-layer")
    const firstTraitsContainer = document.getElementById("first-traits-container")
    const secondTraitsContainer = document.getElementById("second-traits-container")

    // Reset visibility - ensure containers exist before manipulating
    if (firstLayerSelect) firstLayerSelect.style.setProperty("display", "block", "important")
    if (secondLayerSelect) secondLayerSelect.style.setProperty("display", "block", "important")
    if (firstTraitsContainer) firstTraitsContainer.style.setProperty("display", "none", "important")
    if (secondTraitsContainer) secondTraitsContainer.style.setProperty("display", "none", "important")

    // Show/hide trait selection based on appliesTo option (regardless of rule type)
    // Use setProperty with important to override any CSS !important rules
    if (firstTraitsContainer && secondTraitsContainer) {
      switch (ruleAppliesTo) {
        case "between-layers":
          // Between Entire Layers: hide traits on both sides
          firstTraitsContainer.style.setProperty("display", "none", "important")
          secondTraitsContainer.style.setProperty("display", "none", "important")
          break
        
        case "between-traits":
          // Between Specific Traits: show traits on both sides
          firstTraitsContainer.style.setProperty("display", "flex", "important")
          secondTraitsContainer.style.setProperty("display", "flex", "important")
          break
        
        case "layer-to-traits":
          // Between Layer and Specific Trait(s): hide traits on left (first), show on right (second)
          firstTraitsContainer.style.setProperty("display", "none", "important")
          secondTraitsContainer.style.setProperty("display", "flex", "important")
          break
        
        case "traits-to-layer":
          // Between Specific Trait(s) and Layer: show traits on left (first), hide on right (second)
          firstTraitsContainer.style.setProperty("display", "flex", "important")
          secondTraitsContainer.style.setProperty("display", "none", "important")
          break
        
        default:
          // Default: hide both (should not reach here, but safety fallback)
          firstTraitsContainer.style.setProperty("display", "none", "important")
          secondTraitsContainer.style.setProperty("display", "none", "important")
      }
    }

    // Handle conditional restriction with different applies to options (additional labels)
    if (ruleType === "conditional-restriction") {
      // Get color for the applies-to option
      const appliesToColor = RULE_APPLIES_TO_COLORS[ruleAppliesTo] || '#ddd';
      
      switch (ruleAppliesTo) {
        case "between-layers":
          firstSelectorLabel.textContent = "IF Condition Layer:"
          secondSelectorLabel.textContent = "THEN Restrict Target Layer:"
          break

        case "between-traits":
          firstSelectorLabel.textContent = "IF any of these Trait(s) are used:"
          secondSelectorLabel.textContent = "THEN Allow ONLY these Trait(s) from the selected Trait Layer:"
          break

        case "layer-to-traits":
          firstSelectorLabel.textContent = "IF this Trait Layer is used:"
          secondSelectorLabel.textContent = "THEN Allow ONLY these Trait(s) from the selected Trait Layer:"
          break
          
        case "traits-to-layer":
          firstSelectorLabel.textContent = "IF any of these Trait(s) are used:"
          secondSelectorLabel.textContent = "THEN Restrict the selected Layer from being used:"
          break
      }
      
      // Apply color to both labels
      firstSelectorLabel.style.color = appliesToColor;
      secondSelectorLabel.style.color = appliesToColor;
    } else {
      // Get color for the applies-to option
      const appliesToColor = RULE_APPLIES_TO_COLORS[ruleAppliesTo] || '#ddd';
      
      // Handle other rule types with dynamic labels based on appliesTo
      switch (ruleAppliesTo) {
        case "between-layers":
          firstSelectorLabel.textContent = "Select the First Layer:"
          secondSelectorLabel.textContent = "Select the Second Layer:"
          break

        case "between-traits":
          firstSelectorLabel.textContent = "Select Trait(s) from one Trait Layer:"
          secondSelectorLabel.textContent = "Select Trait(s) from another Trait Layer:"
          break

        case "layer-to-traits":
          firstSelectorLabel.textContent = "Select Trait Layer:"
          secondSelectorLabel.textContent = "Select Trait(s) from another Trait Layer:"
          break
          
        case "traits-to-layer":
          firstSelectorLabel.textContent = "Select Trait(s) from one Trait Layer:"
          secondSelectorLabel.textContent = "Select another Trait Layer:"
          break
      }
      
      // Apply color to both labels
      firstSelectorLabel.style.color = appliesToColor;
      secondSelectorLabel.style.color = appliesToColor;
    }

    // Update traits lists
    let firstSelectedTraitIds = null;
    let secondSelectedTraitIds = null;
    
    // Priority 1: Use lastModalSelections if available (preserves current user selections)
    if (window.lastModalSelections) {
      firstSelectedTraitIds = window.lastModalSelections.firstTraits;
      secondSelectedTraitIds = window.lastModalSelections.secondTraits;
    }
    // Priority 2: If editing and no lastModalSelections, extract from ruleToEdit
    else if (ruleToEdit) {
      // For traits-to-layer: traits are in ruleToEdit.traits and should be on the FIRST side
      if (ruleToEdit.appliesTo === 'traits-to-layer' && ruleToEdit.traits) {
        firstSelectedTraitIds = ruleToEdit.traits.map(t => t.id);
      }
      // For layer-to-traits: traits are in ruleToEdit.traits and should be on the SECOND side
      else if (ruleToEdit.appliesTo === 'layer-to-traits' && ruleToEdit.traits) {
        secondSelectedTraitIds = ruleToEdit.traits.map(t => t.id);
      }
      // For other rule types (between-traits, stacking rules, etc.)
      else {
        if (ruleToEdit.firstTraits) {
          firstSelectedTraitIds = ruleToEdit.firstTraits.map(t => t.id);
        }
        if (ruleToEdit.secondTraits) {
          secondSelectedTraitIds = ruleToEdit.secondTraits.map(t => t.id);
        }
      }
    }
    
    this.updateTraitsList(projectData, "first", ruleToEdit, firstSelectedTraitIds)
    this.updateTraitsList(projectData, "second", ruleToEdit, secondSelectedTraitIds)
  },

  // Update the traits list for a specific selector
  updateTraitsList: function (projectData, prefix, ruleToEdit = null, selectedTraitIdsArg = null) {
    const layerSelect = document.getElementById(`${prefix}-layer`)
    const traitsList = document.getElementById(`${prefix}-traits-list`)

    if (!layerSelect || !traitsList) return

    const selectedLayerId = layerSelect.value
    const selectedLayer = projectData.traits.find((layer) => layer.id === selectedLayerId)

    // Use selectedTraitIdsArg if provided, otherwise use lastModalSelections if available
    let selectedTraitIds = selectedTraitIdsArg;
    if (!selectedTraitIds && window.lastModalSelections) {
      selectedTraitIds = prefix === 'first' ? window.lastModalSelections.firstTraits : window.lastModalSelections.secondTraits;
    }

    if (selectedLayer) {
      // Generate and update the traits list HTML
      traitsList.innerHTML = this.generateTraitsList(selectedLayer, prefix, ruleToEdit, selectedTraitIds)

      // If we're editing a rule with traits-to-layer, ensure correct layer is selected
      if (ruleToEdit && ruleToEdit.appliesTo === "traits-to-layer" && prefix === "first" && ruleToEdit.traits) {
        // Get the layer ID the traits should be from
        const traitsLayerId = ruleToEdit.traits.length > 0 ? ruleToEdit.traits[0].layerId : null;
        // If the current selected layer doesn't match the layer in the rule, update it
        if (traitsLayerId && selectedLayerId !== traitsLayerId) {
          console.log(`Updating first layer selection to match traits layer: ${traitsLayerId}`);
          layerSelect.value = traitsLayerId;
          // Re-fetch the layer and regenerate the traits list
          const correctLayer = projectData.traits.find(layer => layer.id === traitsLayerId);
          if (correctLayer) {
            traitsList.innerHTML = this.generateTraitsList(correctLayer, prefix, ruleToEdit, selectedTraitIds);
          }
        }
      }
    } else {
      traitsList.innerHTML = '<div class="empty-traits-message">No layer selected</div>'
    }
  },

  // Update the Rule Applies To dropdown options based on the selected rule type
  updateRuleAppliesToOptions: () => {
    const ruleType = document.getElementById("rule-type").value
    const ruleAppliesToSelect = document.getElementById("rule-applies-to")

    if (!ruleAppliesToSelect) return

    // Store the current selection
    const currentSelection = ruleAppliesToSelect.value

    // Clear existing options
    while (ruleAppliesToSelect.firstChild) {
      ruleAppliesToSelect.removeChild(ruleAppliesToSelect.firstChild)
    }

    // Add options based on rule type
    if (ruleType === "conditional-restriction") {
      // Only show specific options for conditional restriction
      const options = [
        { value: "between-layers", text: "Between Entire Layers", className: "between-layers-option" },
        { value: "between-traits", text: "Between Specific Traits", className: "between-traits-option" },
        { value: "layer-to-traits", text: "Between Layer and Specific Trait(s)", className: "layer-to-traits-option" },
        { value: "traits-to-layer", text: "Between Specific Trait(s) and Layer", className: "traits-to-layer-option" },
      ]

      options.forEach((option) => {
        const optionElement = document.createElement("option")
        optionElement.value = option.value
        optionElement.textContent = option.text
        optionElement.className = option.className
        ruleAppliesToSelect.appendChild(optionElement)
      })

      // Try to restore previous selection if it's still valid
      if (["between-layers", "between-traits", "layer-to-traits"].includes(currentSelection)) {
        ruleAppliesToSelect.value = currentSelection
      } else {
        // Default to between-layers if previous selection is no longer valid
        ruleAppliesToSelect.value = "between-layers"
      }
    } else {
      // Show all options for other rule types
      const ruleOptions = [
        { value: "between-layers", text: "Between Entire Layers", className: "between-layers-option" },
        { value: "between-traits", text: "Between Specific Traits", className: "between-traits-option" },
        { value: "layer-to-traits", text: "Between Layer and Specific Trait(s)", className: "layer-to-traits-option" },
        { value: "traits-to-layer", text: "Between Specific Trait(s) and Layer", className: "traits-to-layer-option" },
      ]

      ruleOptions.forEach((option) => {
        const optionElement = document.createElement("option")
        optionElement.value = option.value
        optionElement.textContent = option.text
        optionElement.className = option.className
        ruleAppliesToSelect.appendChild(optionElement)
      })

      // Restore previous selection
      ruleAppliesToSelect.value = currentSelection
    }

    // Update the custom dropdown if it exists
    setTimeout(() => {
      if (NFTApp.customDropdown && typeof NFTApp.customDropdown.updateDropdown === "function") {
        NFTApp.customDropdown.updateDropdown(ruleAppliesToSelect)
      }
    }, 50)
  },

  // Get rule type and applies to text for display
  getRuleTypeAndAppliesToText: (rule) => {
    let ruleTypeText = ""
    let appliesToText = ""

    // Get rule type text
    switch (rule.type) {
      case "never-combine":
        ruleTypeText = "Never Combine"
        break
      case "always-combine":
        ruleTypeText = "Always Combine"
        break
      case "conditional-restriction":
        ruleTypeText = "Conditional Restriction"
        break
      case "always-above":
        ruleTypeText = "Always Above"
        break
      case "always-below":
        ruleTypeText = "Always Below"
        break
        case "immediately-above":
          ruleTypeText = "Immediately Above"
          break
        case "immediately-below":
          ruleTypeText = "Immediately Below"
          break
    }

    // Get applies to text
    switch (rule.appliesTo) {
      case "between-layers":
        appliesToText = "Between Entire Layers"
        break
      case "between-traits":
        appliesToText = "Between Specific Traits"
        break
      case "layer-to-traits":
        appliesToText = "Between Layer and Specific Trait(s)"
        break
      case "traits-to-layer":
        appliesToText = "Between Specific Trait(s) and Layer"
        break
    }

    return { ruleTypeText, appliesToText }
  },

  // Check if a rule is redundant
  isRuleRedundant: function (newRule, existingRules) {
    if (!existingRules || existingRules.length === 0) return false;

    return existingRules.some(existingRule => {
      // Check if rules are of the same type
      if (existingRule.type !== newRule.type || existingRule.appliesTo !== newRule.appliesTo) {
        return false;
      }

      // Check for redundancy based on rule type
      switch (newRule.type) {
        case "exclusive":
          return this.isExclusiveRuleRedundant(newRule, existingRule);
        case "inclusive":
          return this.isInclusiveRuleRedundant(newRule, existingRule);
        case "required":
          return this.isRequiredRuleRedundant(newRule, existingRule);
        case "forbidden":
          return this.isForbiddenRuleRedundant(newRule, existingRule);
        default:
          return false;
      }
    });
  },

  // Check if an exclusive rule is redundant
  isExclusiveRuleRedundant: function (newRule, existingRule) {
    switch (newRule.appliesTo) {
      case "between-layers":
        // Check if the same layers are involved
        return (newRule.firstLayerId === existingRule.firstLayerId && 
                newRule.secondLayerId === existingRule.secondLayerId) ||
               (newRule.firstLayerId === existingRule.secondLayerId && 
                newRule.secondLayerId === existingRule.firstLayerId);

      case "between-traits":
        // Check if the same traits are involved
        return this.areTraitSetsEqual(newRule.firstTraits, existingRule.firstTraits) &&
               this.areTraitSetsEqual(newRule.secondTraits, existingRule.secondTraits);

      case "layer-to-traits":
      case "traits-to-layer":
        // Check if the same layer and traits are involved
        return newRule.layerId === existingRule.layerId &&
               this.areTraitSetsEqual(newRule.traits, existingRule.traits);

      default:
        return false;
    }
  },

  // Check if an inclusive rule is redundant
  isInclusiveRuleRedundant: function (newRule, existingRule) {
    switch (newRule.appliesTo) {
      case "between-layers":
        // Check if the same layers are involved
        return (newRule.firstLayerId === existingRule.firstLayerId && 
                newRule.secondLayerId === existingRule.secondLayerId) ||
               (newRule.firstLayerId === existingRule.secondLayerId && 
                newRule.secondLayerId === existingRule.firstLayerId);

      case "between-traits":
        // Check if the same traits are involved
        return this.areTraitSetsEqual(newRule.firstTraits, existingRule.firstTraits) &&
               this.areTraitSetsEqual(newRule.secondTraits, existingRule.secondTraits);

      case "layer-to-traits":
      case "traits-to-layer":
        // Check if the same layer and traits are involved
        return newRule.layerId === existingRule.layerId &&
               this.areTraitSetsEqual(newRule.traits, existingRule.traits);

      default:
        return false;
    }
  },

  // Check if a required rule is redundant
  isRequiredRuleRedundant: function (newRule, existingRule) {
    switch (newRule.appliesTo) {
      case "between-layers":
        // Check if the same layers are involved
        return (newRule.firstLayerId === existingRule.firstLayerId && 
                newRule.secondLayerId === existingRule.secondLayerId) ||
               (newRule.firstLayerId === existingRule.secondLayerId && 
                newRule.secondLayerId === existingRule.firstLayerId);

      case "between-traits":
        // Check if the same traits are involved
        return this.areTraitSetsEqual(newRule.firstTraits, existingRule.firstTraits) &&
               this.areTraitSetsEqual(newRule.secondTraits, existingRule.secondTraits);

      case "layer-to-traits":
      case "traits-to-layer":
        // Check if the same layer and traits are involved
        return newRule.layerId === existingRule.layerId &&
               this.areTraitSetsEqual(newRule.traits, existingRule.traits);

      default:
        return false;
    }
  },

  // Check if a forbidden rule is redundant
  isForbiddenRuleRedundant: function (newRule, existingRule) {
    switch (newRule.appliesTo) {
      case "between-layers":
        // Check if the same layers are involved
        return (newRule.firstLayerId === existingRule.firstLayerId && 
                newRule.secondLayerId === existingRule.secondLayerId) ||
               (newRule.firstLayerId === existingRule.secondLayerId && 
                newRule.secondLayerId === existingRule.firstLayerId);

      case "between-traits":
        // Check if the same traits are involved
        return this.areTraitSetsEqual(newRule.firstTraits, existingRule.firstTraits) &&
               this.areTraitSetsEqual(newRule.secondTraits, existingRule.secondTraits);

      case "layer-to-traits":
      case "traits-to-layer":
        // Check if the same layer and traits are involved
        return newRule.layerId === existingRule.layerId &&
               this.areTraitSetsEqual(newRule.traits, existingRule.traits);

      default:
        return false;
    }
  },

  // Helper function to check if two sets of traits are equal
  areTraitSetsEqual: function (traits1, traits2) {
    if (!traits1 || !traits2 || traits1.length !== traits2.length) {
      return false;
    }

    // Create sets of trait IDs for comparison
    const traitIds1 = new Set(traits1.map(t => `${t.layerId}-${t.id}`));
    const traitIds2 = new Set(traits2.map(t => `${t.layerId}-${t.id}`));

    // Check if all traits from set 1 are in set 2
    for (const traitId of traitIds1) {
      if (!traitIds2.has(traitId)) {
        return false;
      }
    }

    return true;
  },

  // Save the rule
  saveRule: function (projectData, modalOverlay) {
    const ruleType = document.getElementById("rule-type").value
    const ruleAppliesTo = document.getElementById("rule-applies-to").value
    const firstLayerId = document.getElementById("first-layer").value
    const secondLayerId = document.getElementById("second-layer").value

    console.log('[DEBUG RULE ADDITION] Starting saveRule:', {
      ruleType,
      ruleAppliesTo,
      firstLayerId,
      secondLayerId,
      timestamp: new Date().toISOString()
    });

    // Prevent saving if the same layer is selected in both dropdowns
    if (firstLayerId === secondLayerId) {
      console.log('[DEBUG RULE ADDITION] ERROR: Same layer selected in both dropdowns:', firstLayerId);
      // Show the warning if it's not already shown
      this.showSameLayerWarning(modalOverlay)
      return // Stop execution here
    }

    // Clear any previous error messages
    const clearErrorMessages = () => {
      const errorMessages = modalOverlay.querySelectorAll(".validation-error")
      errorMessages.forEach((msg) => msg.remove())

      // Remove error highlighting
      modalOverlay.querySelectorAll(".error-highlight").forEach((el) => {
        el.classList.remove("error-highlight")
      })
    }

    clearErrorMessages()

    // Add error message to a specific element
    const addErrorMessage = (element, message) => {
      // Highlight the element
      element.classList.add("error-highlight")

      // Create error message
      const errorDiv = document.createElement("div")
      errorDiv.className = "validation-error"
      errorDiv.textContent = message

      // Insert after the element
      element.parentNode.insertBefore(errorDiv, element.nextSibling)
    }

    // Get the selected layers
    const firstLayer = projectData.traits.find((layer) => layer.id === firstLayerId)
    const secondLayer = projectData.traits.find((layer) => layer.id === secondLayerId)

    // Validate layers are selected
    let hasErrors = false

    if (!firstLayer) {
      const firstLayerSelect = document.getElementById("first-layer")
      addErrorMessage(firstLayerSelect, "Please select a valid layer")
      hasErrors = true
    }

    if (!secondLayer) {
      const secondLayerSelect = document.getElementById("second-layer")
      addErrorMessage(secondLayerSelect, "Please select a valid layer")
      hasErrors = true
    }

    // If validation fails, stop here
    if (hasErrors) {
      return
    }

    // Create the rule object with all necessary properties
    const rule = {
      id: NFTApp.getModule("commonUtils").generateUniqueId(),
      type: ruleType,
      appliesTo: ruleAppliesTo,
      created: new Date().toISOString(),
      updated: new Date().toISOString(),
      // Layer-specific properties
      firstLayerId: firstLayerId,
      secondLayerId: secondLayerId,
      firstLayerName: firstLayer.name,
      secondLayerName: secondLayer.name,
      // Initialize arrays for trait-specific properties
      firstTraits: [],
      secondTraits: [],
      // Initialize layer-to-traits properties
      layerId: null,
      layerName: null,
      traits: []
    }

    // Check if the rule is redundant
    if (this.isRuleRedundant(rule, projectData.rules)) {
      this.showFeedback("This rule is redundant with an existing rule", "error");
      return;
    }

    // Add specific properties based on rule type
    switch (ruleAppliesTo) {
      case "between-layers":
        // For between-layers, we already have all the necessary information
        // CRITICAL: No trait validation needed for between-layers rules
        // Just ensure layers are different (already checked above)
        console.log('[DEBUG RULE ADDITION] Adding between-layers rule:', {
          ruleType,
          firstLayerId,
          secondLayerId,
          firstLayerName: firstLayer.name,
          secondLayerName: secondLayer.name
        });
        // CRITICAL: Ensure rule object has all required properties for between-layers
        rule.firstLayerId = firstLayerId;
        rule.secondLayerId = secondLayerId;
        rule.firstLayerName = firstLayer.name;
        rule.secondLayerName = secondLayer.name;
        // CRITICAL: For between-layers, traits arrays should be empty
        rule.firstTraits = [];
        rule.secondTraits = [];
        console.log('[DEBUG RULE ADDITION] between-layers rule created successfully:', rule);
        break

      case "between-traits": {
        // Get selected traits from first layer
        const firstTraitsList = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = firstLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: firstLayerId,
            layerName: firstLayer.name
          };
        });
        // Get selected traits from second layer
        const secondTraitsList = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(label => {
          const traitId = label.getAttribute('data-trait-id');
          const trait = secondLayer.traits.find((t) => t.id === traitId);
          return {
            id: traitId,
            name: trait ? trait.name : 'Unknown Trait',
            layerId: secondLayerId,
            layerName: secondLayer.name
          };
        });
        // --- DEBUG: Log selected trait IDs ---
        console.log('[DEBUG] saveRule: selected firstTraitsList', firstTraitsList.map(t => t.id));
        console.log('[DEBUG] saveRule: selected secondTraitsList', secondTraitsList.map(t => t.id));
        // CRITICAL: Skip trait validation for between-layers rules - they don't need traits
        // Only validate traits for between-traits rules
        if (ruleAppliesTo !== "between-layers") {
          // Validate that at least one trait is selected from each layer
          if (ruleType === "always-above" || ruleType === "always-below" || ruleType === "immediately-above" || ruleType === "immediately-below") {
            if (firstTraitsList.length === 0) {
              const firstTraitsListEl = document.getElementById("first-traits-list")
              addErrorMessage(firstTraitsListEl, "Please select at least one trait from the first layer")
              hasErrors = true
              console.log('[DEBUG] saveRule: no first traits selected (immediately-above/below)');
            }
            if (secondTraitsList.length === 0) {
              const secondTraitsListEl = document.getElementById("second-traits-list")
              addErrorMessage(secondTraitsListEl, "Please select at least one trait from the second layer")
              hasErrors = true
              console.log('[DEBUG] saveRule: no second traits selected (immediately-above/below)');
            }
          } else if (firstTraitsList.length === 0 || secondTraitsList.length === 0) {
            if (firstTraitsList.length === 0) {
              const firstTraitsListEl = document.getElementById("first-traits-list")
              addErrorMessage(firstTraitsListEl, "Please select at least one trait from the first layer")
              hasErrors = true
              console.log('[DEBUG] saveRule: no first traits selected');
            }
            if (secondTraitsList.length === 0) {
              const secondTraitsListEl = document.getElementById("second-traits-list")
              addErrorMessage(secondTraitsListEl, "Please select at least one trait from the second layer")
              hasErrors = true
              console.log('[DEBUG] saveRule: no second traits selected');
            }
          }
        }
        if (hasErrors) {
          return
        }
        rule.firstTraits = firstTraitsList
        rule.secondTraits = secondTraitsList
        break
      }
      case "layer-to-traits": {
        // Get selected traits from second layer
        const secondTraitsListLayer = Array.from(
          document.querySelectorAll("#second-traits-list .trait-checkbox-label.selected")
        ).map(label => {
          const traitId = label.getAttribute("data-trait-id")
          const trait = secondLayer.traits.find((t) => t.id === traitId)
          return {
            id: traitId,
            name: trait ? trait.name : "Unknown Trait",
            layerId: secondLayerId,
            layerName: secondLayer.name
          }
        })
        // Validate that at least one trait is selected
        if (secondTraitsListLayer.length === 0) {
          const secondTraitsListEl = document.getElementById("second-traits-list")
          addErrorMessage(secondTraitsListEl, "Please select at least one trait")
          hasErrors = true
        }
        if (hasErrors) {
          return
        }
        rule.layerId = firstLayerId
        rule.layerName = firstLayer.name
        rule.traits = secondTraitsListLayer
        break
      }
      case "traits-to-layer": {
        // Get selected traits from first layer
        const firstTraitsListLayer = Array.from(
          document.querySelectorAll("#first-traits-list .trait-checkbox-label.selected")
        ).map(label => {
          const traitId = label.getAttribute("data-trait-id")
          const trait = firstLayer.traits.find((t) => t.id === traitId)
          return {
            id: traitId,
            name: trait ? trait.name : "Unknown Trait",
            layerId: firstLayerId,
            layerName: firstLayer.name
          }
        })
        // Validate that at least one trait is selected
        if (firstTraitsListLayer.length === 0) {
          const firstTraitsListEl = document.getElementById("first-traits-list")
          addErrorMessage(firstTraitsListEl, "Please select at least one trait")
          hasErrors = true
        }
        if (hasErrors) {
          return
        }
        rule.layerId = secondLayerId
        rule.layerName = secondLayer.name
        rule.traits = firstTraitsListLayer
        break
      }
    }

    // For Always on Top, Always on Bottom, Immediately Above, and Immediately Below rules, use the same logic as above
    // CRITICAL: Only collect traits if rule applies to traits, NOT for between-layers
    if (
      ruleAppliesTo !== "between-layers" &&
      (ruleType === "always-above" ||
      ruleType === "always-below" ||
      ruleType === "immediately-above" ||
      ruleType === "immediately-below")
    ) {
      console.log('[DEBUG RULE ADDITION] Collecting traits for stacking order rule (not between-layers):', ruleType);
      // Get selected traits from both selectors
      rule.firstTraits = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected')).map(label => {
        const traitId = label.getAttribute('data-trait-id');
        const trait = firstLayer.traits.find((t) => t.id === traitId);
        return {
          id: traitId,
          name: trait ? trait.name : 'Unknown Trait',
          layerId: firstLayerId,
          layerName: firstLayer.name
        };
      });
      rule.secondTraits = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected')).map(label => {
        const traitId = label.getAttribute('data-trait-id');
        const trait = secondLayer.traits.find((t) => t.id === traitId);
        return {
          id: traitId,
          name: trait ? trait.name : 'Unknown Trait',
          layerId: secondLayerId,
          layerName: secondLayer.name
        };
      });
      console.log('[DEBUG RULE ADDITION] Collected traits:', {
        firstTraits: rule.firstTraits.length,
        secondTraits: rule.secondTraits.length
      });
    } else if (ruleAppliesTo === "between-layers") {
      // CRITICAL: For between-layers, ensure traits arrays are empty
      console.log('[DEBUG RULE ADDITION] Ensuring empty traits arrays for between-layers rule');
      rule.firstTraits = rule.firstTraits || []
      rule.secondTraits = rule.secondTraits || []
      rule.layerId = null
      rule.layerName = null
      rule.traits = []
    }

    // Add the new rule to the project data
    projectData.rules = projectData.rules || []
    console.log('[DEBUG RULE ADDITION] Adding rule to projectData:', {
      ruleId: rule.id,
      ruleType: rule.type,
      appliesTo: rule.appliesTo,
      firstLayerId: rule.firstLayerId,
      secondLayerId: rule.secondLayerId,
      totalRulesBefore: projectData.rules.length
    });
    projectData.rules.push(rule)
    console.log('[DEBUG RULE ADDITION] Rule added successfully. Total rules now:', projectData.rules.length);
    
    // CRITICAL: Ensure window.currentProject is updated with the new rule
    // This ensures updateRulesSectionVisibility can see the newly added rule
    if (window.currentProject) {
      // If currentProject is the same reference, it's already updated
      // If it's a different reference, update it
      if (window.currentProject !== projectData) {
        window.currentProject.rules = projectData.rules;
        console.log('[DEBUG] Updated window.currentProject.rules with new rule (now has', window.currentProject.rules.length, 'rules)');
      } else {
        console.log('[DEBUG] window.currentProject is same reference as projectData, already updated (has', window.currentProject.rules.length, 'rules)');
      }
    } else {
      // If currentProject doesn't exist, set it
      window.currentProject = projectData;
      console.log('[DEBUG] Set window.currentProject to projectData (has', projectData.rules.length, 'rules)');
    }
    
    // CRITICAL: Also update the combinationRules module's projectData reference
    if (this.projectData && this.projectData !== projectData) {
      this.projectData.rules = projectData.rules;
      console.log('[DEBUG] Updated combinationRules module projectData.rules');
    } else if (!this.projectData) {
      this.projectData = projectData;
      console.log('[DEBUG] Set combinationRules module projectData');
    }

    // Notify that rules have changed
    if (window.SavedSeedsModal && window.SavedSeedsModal.notifyRuleChange) {
      window.SavedSeedsModal.notifyRuleChange();
    }

    // Auto-update thumbnails if this is a stacking order rule
    if (ruleType === "always-above" || ruleType === "always-below" || 
        ruleType === "immediately-above" || ruleType === "immediately-below") {
      this.autoUpdateThumbnailsForRule(rule, projectData);
    }

    // CRITICAL: Set updating flag and hasEverBeenVisible flag BEFORE any UI updates to prevent visibility checks from hiding the section
    const rulesSection = document.querySelector('.rules-section');
    if (rulesSection) {
      // CRITICAL: Set hasEverBeenVisible flag IMMEDIATELY since we're adding a rule (rules will exist)
      // This ensures the section stays visible even during the brief moment when innerHTML is cleared
      rulesSection.dataset.hasEverBeenVisible = 'true';
      rulesSection.dataset.updatingRules = 'true';
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      console.log('[DEBUG] saveRule - Set hasEverBeenVisible and updatingRules flags BEFORE UI update');
    }
    
    // CRITICAL: Update the UI with flicker prevention
    // Ensure container is visible BEFORE updating UI to prevent flicker
    const rulesContainer = document.getElementById("combination-rules-container");
    if (rulesContainer) {
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
    }
    if (rulesSection) {
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
    }
    
    // CRITICAL: Use requestAnimationFrame to batch DOM updates and prevent flicker
    // But ensure visibility is set synchronously first
    console.log('[DEBUG RULE ADDITION] About to update UI, rules count:', projectData.rules ? projectData.rules.length : 0);
    requestAnimationFrame(() => {
      console.log('[DEBUG RULE ADDITION] Updating UI in requestAnimationFrame');
      this.updateRulesUI(projectData);
      this.updateCheckConflictsButtonState(projectData);
    });
    
    // CRITICAL: Force rules section to stay visible after update
    // Use requestAnimationFrame to ensure visibility is set after DOM updates
    requestAnimationFrame(() => {
      if (rulesSection) {
        rulesSection.style.setProperty('display', 'flex', 'important');
        rulesSection.style.setProperty('visibility', 'visible', 'important');
        rulesSection.style.setProperty('opacity', '1', 'important');
      }
      const rulesContainer = document.getElementById("combination-rules-container");
      if (rulesContainer) {
        rulesContainer.style.setProperty('display', 'block', 'important');
        rulesContainer.style.setProperty('visibility', 'visible', 'important');
        rulesContainer.style.setProperty('opacity', '1', 'important');
      }
      
      // Note: updateRulesSectionVisibility is not called here - once visible, section stays visible
      // It's only checked on project load and when layers are deleted
      
      // CRITICAL: Clear the updating flag after a delay, but keep hasEverBeenVisible
      // Use a longer delay to ensure all visibility checks have completed
      setTimeout(() => {
        if (rulesSection) {
          delete rulesSection.dataset.updatingRules;
          // Force visibility one more time after clearing flag
          rulesSection.style.setProperty('display', 'flex', 'important');
          rulesSection.style.setProperty('visibility', 'visible', 'important');
          rulesSection.style.setProperty('opacity', '1', 'important');
          console.log('[DEBUG] saveRule - Cleared updatingRules flag, kept hasEverBeenVisible');
        }
      }, 1200); // Increased delay to prevent any race conditions
    });

    // Close the modal
    modalOverlay.style.display = "none"
    modalOverlay.style.zIndex = "" // Reset z-index

    // If we're editing from conflicts modal, re-check and update conflicts
    if (this.editingFromConflicts) {
      this.editingFromConflicts = false
      
      setTimeout(() => {
        const conflictsAfterEdit = this.detectAllConflicts(projectData)
        
        // Update the conflicts modal if it still exists
        const conflictsModal = document.getElementById("conflicts-modal")
        if (conflictsModal) {
          if (conflictsAfterEdit.length === 0) {
            // No conflicts anymore - close the modal and show success
            conflictsModal.remove()
            NFTApp.getModule("notificationService").show("All conflicts resolved! ✅", "success")
          } else {
            // Re-show conflicts with updated list
            conflictsModal.remove()
            this.showConflictsModal(projectData, conflictsAfterEdit)
          }
        }
      }, 100)
    }

    // Show success notification
    NFTApp.getModule("notificationService").show("Combination rule added successfully", "success")
  },

  // Update an existing rule
  updateRule: function (ruleId, projectData, modalOverlay) {
    const ruleType = document.getElementById("rule-type").value
    const ruleAppliesTo = document.getElementById("rule-applies-to").value
    const firstLayerId = document.getElementById("first-layer").value
    const secondLayerId = document.getElementById("second-layer").value

    // Prevent saving if the same layer is selected in both dropdowns
    if (firstLayerId === secondLayerId) {
      // Show the warning if it's not already shown
      this.showSameLayerWarning(modalOverlay)
      return // Stop execution here
    }

    // Find the rule to update
    const ruleIndex = projectData.rules.findIndex(rule => rule.id === ruleId)
    if (ruleIndex === -1) {
      console.error("Rule not found:", ruleId)
      return
    }

    // Clear any existing error messages
    if (typeof clearErrorMessages === 'function') clearErrorMessages()

    // Create the updated rule object with all properties initialized
    const updatedRule = {
      id: ruleId,
      type: ruleType,
      appliesTo: ruleAppliesTo,
      name: `${ruleType} rule`,
      firstLayerId: firstLayerId,
      secondLayerId: secondLayerId,
      firstLayerName: projectData.traits.find(l => l.id === firstLayerId)?.name || '',
      secondLayerName: projectData.traits.find(l => l.id === secondLayerId)?.name || '',
      // Initialize all possible properties to ensure clean state
      firstTraits: [],
      secondTraits: [],
      traits: [],
      layerId: null,
      layerName: null
    }

    // Handle different rule types and applies to options
    let hasErrors = false

    switch (ruleAppliesTo) {
      case "between-layers": {
        // For between-layers rules, store layer IDs, not traits
        updatedRule.firstLayerId = firstLayerId
        updatedRule.secondLayerId = secondLayerId
        updatedRule.firstLayerName = firstLayer.name
        updatedRule.secondLayerName = secondLayer.name
        break
      }
      case "between-traits": {
        // Collect selected traits from both layers
        const firstTraitsList = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected'))
          .map(label => {
            const traitId = label.getAttribute('data-trait-id')
            const layer = projectData.traits.find(l => l.id === firstLayerId)
            const trait = layer?.traits?.find(t => t.id === traitId)
            return {
              id: traitId,
              name: trait?.name || '',
              layerId: firstLayerId,
              layerName: layer?.name || ''
            }
          })
        const secondTraitsList = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected'))
          .map(label => {
            const traitId = label.getAttribute('data-trait-id')
            const layer = projectData.traits.find(l => l.id === secondLayerId)
            const trait = layer?.traits?.find(t => t.id === traitId)
            return {
              id: traitId,
              name: trait?.name || '',
              layerId: secondLayerId,
              layerName: layer?.name || ''
            }
          })

        // CRITICAL: Skip trait validation for between-layers rules - they don't need traits
        // Only validate traits for between-traits rules
        if (ruleAppliesTo !== "between-layers") {
          // Validate that at least one trait is selected from each layer
          if (ruleType === "always-above" || ruleType === "always-below" || ruleType === "immediately-above" || ruleType === "immediately-below") {
            if (firstTraitsList.length === 0) {
              const firstTraitsListEl = document.getElementById("first-traits-list")
              addErrorMessage(firstTraitsListEl, "Please select at least one trait from the first layer")
              hasErrors = true
            }
            if (secondTraitsList.length === 0) {
              const secondTraitsListEl = document.getElementById("second-traits-list")
              addErrorMessage(secondTraitsListEl, "Please select at least one trait from the second layer")
              hasErrors = true
            }
          } else if (firstTraitsList.length === 0 || secondTraitsList.length === 0) {
            if (firstTraitsList.length === 0) {
              const firstTraitsListEl = document.getElementById("first-traits-list")
              addErrorMessage(firstTraitsListEl, "Please select at least one trait from the first layer")
              hasErrors = true
            }
            if (secondTraitsList.length === 0) {
              const secondTraitsListEl = document.getElementById("second-traits-list")
              addErrorMessage(secondTraitsListEl, "Please select at least one trait from the second layer")
              hasErrors = true
            }
          }
        }
        if (hasErrors) {
          return
        }
        updatedRule.firstTraits = firstTraitsList
        updatedRule.secondTraits = secondTraitsList
        break
      }
      case "layer-to-traits": {
        // Collect selected traits from the second layer only
        const secondTraitsList = Array.from(document.querySelectorAll('#second-traits-list .trait-checkbox-label.selected'))
          .map(label => {
            const traitId = label.getAttribute('data-trait-id')
            const layer = projectData.traits.find(l => l.id === secondLayerId)
            const trait = layer?.traits?.find(t => t.id === traitId)
            return {
              id: traitId,
              name: trait?.name || '',
              layerId: secondLayerId,
              layerName: layer?.name || ''
            }
          })

        if (secondTraitsList.length === 0) {
          const secondTraitsListEl = document.getElementById("second-traits-list")
          addErrorMessage(secondTraitsListEl, "Please select at least one trait from the target layer")
          hasErrors = true
        }
        if (hasErrors) {
          return
        }
        updatedRule.layerId = firstLayerId
        updatedRule.layerName = projectData.traits.find(l => l.id === firstLayerId)?.name || ''
        updatedRule.traits = secondTraitsList
        break
      }
      case "traits-to-layer": {
        // Collect selected traits from the first layer only
        const firstTraitsList = Array.from(document.querySelectorAll('#first-traits-list .trait-checkbox-label.selected'))
          .map(label => {
            const traitId = label.getAttribute('data-trait-id')
            const layer = projectData.traits.find(l => l.id === firstLayerId)
            const trait = layer?.traits?.find(t => t.id === traitId)
            return {
              id: traitId,
              name: trait?.name || '',
              layerId: firstLayerId,
              layerName: layer?.name || ''
            }
          })

        if (firstTraitsList.length === 0) {
          const firstTraitsListEl = document.getElementById("first-traits-list")
          addErrorMessage(firstTraitsListEl, "Please select at least one trait from the source layer")
          hasErrors = true
        }
        if (hasErrors) {
          return
        }
        updatedRule.layerId = secondLayerId
        updatedRule.layerName = projectData.traits.find(l => l.id === secondLayerId)?.name || ''
        updatedRule.traits = firstTraitsList
        break
      }
    }

    // Update the rule in the project data
    projectData.rules[ruleIndex] = updatedRule

    // Notify that rules have changed
    if (window.SavedSeedsModal && window.SavedSeedsModal.notifyRuleChange) {
      window.SavedSeedsModal.notifyRuleChange();
    }

    // Auto-update thumbnails if this is a stacking order rule
    if (ruleType === "always-above" || ruleType === "always-below" || 
        ruleType === "immediately-above" || ruleType === "immediately-below") {
      this.autoUpdateThumbnailsForRule(updatedRule, projectData);
    }

    // Update the UI
    this.updateRulesUI(projectData)
    this.updateCheckConflictsButtonState(projectData)

    // Close the modal
    modalOverlay.style.display = "none"
    modalOverlay.style.zIndex = "" // Reset z-index

    // If we're editing from conflicts modal, re-check and update conflicts
    if (this.editingFromConflicts) {
      this.editingFromConflicts = false
      
      setTimeout(() => {
        const conflictsAfterEdit = this.detectAllConflicts(projectData)
        
        // Update the conflicts modal if it still exists
        const conflictsModal = document.getElementById("conflicts-modal")
        if (conflictsModal) {
          if (conflictsAfterEdit.length === 0) {
            // No conflicts anymore - close the modal and show success
            conflictsModal.remove()
            NFTApp.getModule("notificationService").show("All conflicts resolved! ✅", "success")
          } else {
            // Re-show conflicts with updated list
            conflictsModal.remove()
            this.showConflictsModal(projectData, conflictsAfterEdit)
          }
        }
      }, 100)
    }

    // Show success notification
    NFTApp.getModule("notificationService").show("Combination rule updated successfully", "success")
  },

  // Update the rules UI
  updateRulesUI: function (projectData) {
    const rulesContainer = document.getElementById("combination-rules-container")

    if (!rulesContainer) {
      console.error("Combination rules container not found")
      return
    }

    // CRITICAL: Ensure container stays visible BEFORE any operations to prevent black screen
    const rulesSection = document.querySelector('.rules-section');
    if (rulesContainer) {
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
      rulesContainer.style.setProperty('background', 'transparent', 'important');
      rulesContainer.style.setProperty('background-color', 'transparent', 'important');
      rulesContainer.style.setProperty('background-image', 'none', 'important');
    }
    if (rulesSection) {
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('background', 'transparent', 'important');
      rulesSection.style.setProperty('background-color', 'transparent', 'important');
      rulesSection.style.setProperty('background-image', 'none', 'important');
      
      // CRITICAL: Set a flag to prevent updateRulesSectionVisibility from hiding it immediately
      // This flag should already be set before updateRulesUI is called, but set it again to be safe
      // Also set a timestamp to track when update started
      rulesSection.dataset.updatingRules = 'true';
      rulesSection.dataset.updateStartTime = Date.now().toString();
      // Clear the flag after a longer delay to ensure all visibility checks have completed
      // Use a longer timeout to prevent race conditions with calls from trait-layers.js
      setTimeout(() => {
        if (rulesSection) {
          // Before clearing, do a final check to ensure rules exist
          const rulesContainer = document.getElementById('combination-rules-container');
          const hasRulesInDOM = rulesContainer ? rulesContainer.querySelectorAll('.rule-item, [data-rule-id]').length > 0 : false;
          const hasRulesInProject = projectData && projectData.rules && Array.isArray(projectData.rules) && projectData.rules.length > 0;
          
          if (hasRulesInDOM || hasRulesInProject) {
            // Rules exist, safe to clear flag but force visibility
            delete rulesSection.dataset.updatingRules;
            rulesSection.style.setProperty('display', 'flex', 'important');
            rulesSection.style.setProperty('visibility', 'visible', 'important');
            rulesSection.style.setProperty('opacity', '1', 'important');
          } else {
            // No rules, keep flag a bit longer and check again
            setTimeout(() => {
              if (rulesSection) {
                delete rulesSection.dataset.updatingRules;
              }
            }, 300);
          }
        }
      }, 800); // Increased from 500ms to 800ms
    }

    // CRITICAL: Preserve bottom-shortcut-buttons reference (don't clone - use existing element)
    // The buttons are already created in project-interface.js, so we just need to preserve the reference
    let bottomButtonsElement = rulesContainer.querySelector('.bottom-shortcut-buttons')
    
    // CRITICAL: Only clear rule items, not the entire container (which might contain other elements)
    // Remove only .rule-item elements and .rules-list, preserve everything else including bottom buttons
    // CRITICAL: Ensure container stays visible during removal operations
    // CRITICAL: Create new rules-list FIRST and render content BEFORE removing old one to prevent empty container
    let newRulesList = document.createElement("div")
    newRulesList.className = "rules-list"
    
    // CRITICAL: Ensure container stays visible before any operations
    rulesContainer.style.setProperty('display', 'block', 'important');
    rulesContainer.style.setProperty('visibility', 'visible', 'important');
    rulesContainer.style.setProperty('opacity', '1', 'important');
    rulesContainer.style.setProperty('background', 'transparent', 'important');
    rulesContainer.style.setProperty('background-color', 'transparent', 'important');
    rulesContainer.style.setProperty('background-image', 'none', 'important');
    
    // CRITICAL: Get existing rules-list but DON'T remove it yet - we'll swap atomically
    const existingRulesList = rulesContainer.querySelector('.rules-list')
    
    // CRITICAL: Check if there are rules to display
    const hasRules = projectData.rules && projectData.rules.length > 0
    
    // CRITICAL: Now atomically swap - add new list BEFORE removing old one to prevent empty container
    // This ensures there's always content visible and prevents flicker
    // Do the swap synchronously to maintain atomicity, but force reflow to prevent flicker
    if (existingRulesList) {
      // Insert new list right before old one, then remove old one atomically
      // This ensures there's always content visible during the swap
      rulesContainer.insertBefore(newRulesList, existingRulesList);
      // Force reflow to ensure new list is painted before removing old one
      void newRulesList.offsetHeight;
      existingRulesList.remove();
    } else {
      // No existing list, just append
      rulesContainer.appendChild(newRulesList);
      // Force reflow to ensure new list is painted
      void newRulesList.offsetHeight;
    }
    
    // CRITICAL: Force visibility again after swap to prevent flicker
    rulesContainer.style.setProperty('display', 'block', 'important');
    rulesContainer.style.setProperty('visibility', 'visible', 'important');
    rulesContainer.style.setProperty('opacity', '1', 'important');
    
    // CRITICAL: Also remove any orphaned rule items that might exist outside rules-list
    const existingRuleItems = rulesContainer.querySelectorAll('.rule-item:not(.rules-list .rule-item)')
    existingRuleItems.forEach(item => {
      item.remove()
    })
    
    // CRITICAL: Force visibility again after swap to prevent black screen
    rulesContainer.style.setProperty('display', 'block', 'important');
    rulesContainer.style.setProperty('visibility', 'visible', 'important');
    rulesContainer.style.setProperty('opacity', '1', 'important');
    rulesContainer.style.setProperty('background', 'transparent', 'important');
    rulesContainer.style.setProperty('background-color', 'transparent', 'important');
    rulesContainer.style.setProperty('background-image', 'none', 'important');
    
    // CRITICAL: Ensure bottom buttons are right-aligned if they exist
    if (bottomButtonsElement) {
      bottomButtonsElement.style.cssText = `
        display: flex !important;
        visibility: visible !important;
        opacity: 1 !important;
        position: absolute !important;
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 1557px !important;
        max-width: 1557px !important;
        min-width: 1557px !important;
        z-index: 100 !important;
        justify-content: flex-end !important;
        align-items: center !important;
        gap: 10px !important;
        row-gap: 10px !important;
        column-gap: 10px !important;
        padding: 1rem !important;
        padding-left: 0 !important;
        padding-right: 1rem !important;
        margin: 0 !important;
        border-top: 1px solid var(--border-color) !important;
        background: transparent !important;
        pointer-events: auto !important;
        box-sizing: border-box !important;
        text-align: right !important;
      `
    }

    // CRITICAL: Use the rules-list we already created and swapped above (newRulesList)
    // This prevents empty container that causes black screen
    // CRITICAL: Always use newRulesList which is already in the DOM after the swap
    const rulesList = newRulesList
    if (!rulesList) {
      console.error('[ERROR] newRulesList not found after swap - this should not happen')
      // CRITICAL: Create fallback list if newRulesList is somehow missing
      const fallbackList = document.createElement("div")
      fallbackList.className = "rules-list"
      rulesContainer.appendChild(fallbackList)
      // Use fallback
      const actualRulesList = fallbackList
      
      // CRITICAL: Ensure container stays visible
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
      
      if (!hasRules) {
        actualRulesList.innerHTML = "<p>No combination rules added yet.</p>"
      }
      // Don't return - continue to render rules if they exist
    } else {
      // CRITICAL: Ensure rulesList is in the DOM and visible
      if (!rulesContainer.contains(rulesList)) {
        console.warn('[WARN] rulesList not in container, appending it')
        rulesContainer.appendChild(rulesList)
      }
    }
    
    // CRITICAL: Ensure container stays visible
    rulesContainer.style.setProperty('display', 'block', 'important');
    rulesContainer.style.setProperty('visibility', 'visible', 'important');
    rulesContainer.style.setProperty('opacity', '1', 'important');
    rulesContainer.style.setProperty('background', 'transparent', 'important');
    rulesContainer.style.setProperty('background-color', 'transparent', 'important');
    rulesContainer.style.setProperty('background-image', 'none', 'important');
    
    // CRITICAL: Add warning OUTSIDE of rules-list, in a fixed position above the rules
    // Remove any existing warning first to prevent duplicates
    const existingWarning = rulesContainer.querySelector('.combination-rules-warning');
    if (existingWarning) {
      existingWarning.remove();
    }
    
    if (hasRules) {
      const warningDiv = document.createElement("div")
      warningDiv.className = "combination-rules-warning"
      warningDiv.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="#f39c12" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
        <line x1="12" y1="9" x2="12" y2="13"></line>
        <line x1="12" y1="17" x2="12.01" y2="17"></line>
      </svg>
      <span>
        <strong>Warning:</strong> Combination rules can significantly impact your collection's traits. Make sure to test your rules thoroughly before generating your final collection.
      </span>
      `
      // Insert warning BEFORE rules-list, so it stays fixed above rules
      rulesContainer.insertBefore(warningDiv, rulesList);
    }
    
    // If there are no rules, display a message and return early
    if (!hasRules) {
      // CRITICAL: Ensure container stays visible before setting innerHTML
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
      rulesContainer.style.setProperty('background', 'transparent', 'important');
      rulesContainer.style.setProperty('background-color', 'transparent', 'important');
      rulesContainer.style.setProperty('background-image', 'none', 'important');
      
      rulesList.innerHTML = "<p>No combination rules added yet.</p>"
      
      // CRITICAL: Ensure container stays visible after setting innerHTML
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
      rulesContainer.style.setProperty('background', 'transparent', 'important');
      rulesContainer.style.setProperty('background-color', 'transparent', 'important');
      rulesContainer.style.setProperty('background-image', 'none', 'important');
      
      // CRITICAL: Bottom buttons are already in the container from project-interface.js, no need to append
      // Just ensure they're properly styled and have event listeners
      if (bottomButtonsElement) {
        // Ensure event listeners are attached (they should be handled by traits-rules-layout-fix.js)
        // But we'll ensure they work here as well
        setTimeout(() => {
          const jumpToLayersBtn = document.getElementById('jump-to-layers-bottom-btn')
          const jumpToRulesBtn = document.getElementById('jump-to-rules-bottom-btn')
          
          // CRITICAL: Use consistent attribute name (dataset.listenerAdded) to match traits-rules-layout-fix.js
          if (jumpToLayersBtn && !jumpToLayersBtn.dataset.listenerAdded) {
            jumpToLayersBtn.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()
              
              // Find the subsection-description with the specific text (same as top button)
              const allDescriptions = document.querySelectorAll('.subsection-description')
              let targetDescription = null
              
              for (const desc of allDescriptions) {
                if (desc.textContent && desc.textContent.includes('Add and manage trait layers for your NFT collection')) {
                  targetDescription = desc
                  break
                }
              }
              
              if (targetDescription) {
                // Get the traits-rules tab-content container (the actual scrolling container)
                const traitsRulesTab = document.getElementById('traits-rules')
                if (traitsRulesTab) {
                  // Calculate position relative to the scrolling container
                  const containerRect = traitsRulesTab.getBoundingClientRect()
                  const targetRect = targetDescription.getBoundingClientRect()
                  
                  // Calculate scroll position: target position relative to container + current scroll position
                  const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100
                  
                  // Scroll the container instead of the window
                  traitsRulesTab.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                  })
                } else {
                  // Fallback to window scroll if container not found
                  const navContainer = document.querySelector('.nav-container')
                  const navHeight = navContainer ? navContainer.offsetHeight : 110
                  const targetPosition = targetDescription.getBoundingClientRect().top + window.pageYOffset - navHeight - 100
                  window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                  })
                }
              }
            }, { capture: true })
            jumpToLayersBtn.dataset.listenerAdded = 'true'
          }
          
          // CRITICAL: Use consistent attribute name (dataset.listenerAdded) to match traits-rules-layout-fix.js
          if (jumpToRulesBtn && !jumpToRulesBtn.dataset.listenerAdded) {
            jumpToRulesBtn.addEventListener('click', (e) => {
              e.preventDefault()
              e.stopPropagation()
              e.stopImmediatePropagation()
              
              // Find the subsection-description with the specific text (same as top button)
              const allDescriptions = document.querySelectorAll('.subsection-description')
              let targetDescription = null
              
              for (const desc of allDescriptions) {
                if (desc.textContent && desc.textContent.includes('Set up rules for trait combinations to ensure certain traits always or never appear together')) {
                  targetDescription = desc
                  break
                }
              }
              
              if (targetDescription) {
                // Get the traits-rules tab-content container (the actual scrolling container)
                const traitsRulesTab = document.getElementById('traits-rules')
                if (traitsRulesTab) {
                  // Calculate position relative to the scrolling container
                  const containerRect = traitsRulesTab.getBoundingClientRect()
                  const targetRect = targetDescription.getBoundingClientRect()
                  
                  // Calculate scroll position: target position relative to container + current scroll position
                  const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100
                  
                  // Scroll the container instead of the window
                  traitsRulesTab.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth'
                  })
                } else {
                  // Fallback to window scroll if container not found
                  const navContainer = document.querySelector('.nav-container')
                  const navHeight = navContainer ? navContainer.offsetHeight : 110
                  const targetPosition = targetDescription.getBoundingClientRect().top + window.pageYOffset - navHeight - 100
                  window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                  })
                }
              }
            }, { capture: true })
            jumpToRulesBtn.dataset.listenerAdded = 'true'
          }
        }, 50)
      }
      return
    }

    // CRITICAL: Ensure rulesList exists and is in the DOM before rendering rules
    // This should never be null at this point, but double-check
    if (!rulesList) {
      console.error('[ERROR] rulesList is null when trying to render rules - this should not happen')
      return
    }
    if (!rulesContainer.contains(rulesList)) {
      console.warn('[WARN] rulesList not in container before rendering, appending it')
      rulesContainer.appendChild(rulesList)
    }
    
    // CRITICAL: Set flags BEFORE any DOM manipulation to prevent flicker
    if (rulesSection) {
      rulesSection.dataset.updatingRules = 'true';
      if (hasRules && rulesSection.dataset.hasEverBeenVisible !== 'true') {
        rulesSection.dataset.hasEverBeenVisible = 'true';
      }
      // CRITICAL: Force visibility BEFORE any DOM changes to prevent flicker
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
    }
    rulesContainer.style.setProperty('display', 'block', 'important');
    rulesContainer.style.setProperty('visibility', 'visible', 'important');
    rulesContainer.style.setProperty('opacity', '1', 'important');
    
    // CRITICAL: Don't clear innerHTML - rulesList is already empty (newly created)
    // This prevents any flicker from clearing existing content
    // rulesList is a fresh element, so no need to clear it

    // CRITICAL: Log rules count for debugging
    // console.log('[DEBUG] updateRulesUI - About to render', projectData.rules.length, 'rules');
    // console.log('[DEBUG] updateRulesUI - rulesList exists:', !!rulesList, 'rulesList in container:', rulesContainer.contains(rulesList));

    // Loop through the rules and add them to the list (render in reverse order)
    [...projectData.rules].slice().reverse().forEach((rule, i) => {
      const index = projectData.rules.length - 1 - i;
      // DEBUG: Log each rule being rendered
      // console.log('[DEBUG] updateRulesUI - rendering rule:', index, rule.type, rule.id);
      const { ruleTypeText, appliesToText } = this.getRuleTypeAndAppliesToText(rule)

      // Create rule item
      const ruleItem = document.createElement("div")
      ruleItem.className = `rule-item rule-item-${index % 2 === 0 ? 'odd' : 'even'}`
      ruleItem.setAttribute("data-rule-id", rule.id)
      ruleItem.setAttribute("data-rule-type", rule.type)

      // Determine rule type class and icon
      let ruleTypeClass = ""
      let ruleTypeIcon = ""
      let ruleTypeColor = RULE_TYPE_COLORS[rule.type] || '#fff';

      switch (rule.type) {
        case "never-combine":
          ruleTypeClass = "rule-type-never";
          break;
        case "always-combine":
          ruleTypeClass = "rule-type-always";
          break;
        case "conditional-restriction":
          ruleTypeClass = "rule-type-conditional";
          break;
        case "always-above":
          ruleTypeClass = "rule-type-above";
          break;
        case "always-below":
          ruleTypeClass = "rule-type-below";
          break;
        case "immediately-above":
          ruleTypeClass = "rule-type-above";
          break;
        case "immediately-below":
          ruleTypeClass = "rule-type-below";
          break;
      }
      // Use centralized SVG icon definitions for consistency across all locations
      if (window.RULE_TYPE_SVG_ICONS && window.RULE_TYPE_SVG_ICONS[rule.type]) {
        ruleTypeIcon = window.RULE_TYPE_SVG_ICONS[rule.type](ruleTypeColor);
      } else {
        // Fallback to inline definitions if global not available
      switch (rule.type) {
        case "never-combine":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-never-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
          break;
        case "always-combine":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-always-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
          break;
        case "conditional-restriction":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-conditional-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>`;
          break;
        case "always-above":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-above-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline><polyline points="17 18 12 13 7 18"></polyline></svg>`;
          break;
        case "always-below":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-below-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 16 7 11"></polyline><polyline points="17 4 12 9 7 4"></polyline></svg>`;
          break;
        case "immediately-above":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-above-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="17 11 12 6 7 11"></polyline></svg>`;
          break;
        case "immediately-below":
          ruleTypeIcon = `<svg xmlns="http://www.w3.org/2000/svg" class="rule-type-below-icon" viewBox="0 0 24 24" fill="none" stroke="${ruleTypeColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="7 13 12 18 17 13"></polyline></svg>`;
          break;
        }
      }

      // CRITICAL: Disabled logic - rules are rendered in reverse order
      // Array index 0 = oldest rule = visually at bottom
      // Array index N-1 = newest rule = visually at top
      // move-up-rule moves UP visually (to higher array index), so disable when already at top (index === length - 1)
      // move-down-rule moves DOWN visually (to lower array index), so disable when already at bottom (index === 0)
      const moveUpDisabled = index === projectData.rules.length - 1 ? 'disabled' : '';
      const moveDownDisabled = index === 0 ? 'disabled' : '';
      
      // Get color for the applies-to text
      const appliesToColor = RULE_APPLIES_TO_COLORS[rule.appliesTo] || '#ddd';
      
      // CRITICAL: Drag handle is now outside header to be vertically centered with entire rule item
      let dragHandle = `
        <div class="rule-drag-handle tooltip">
          <!-- Enhanced drag handle icon: six dots in two columns -->
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="7" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="7" cy="18" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="6" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="12" r="1.5" fill="currentColor"/>
            <circle cx="13" cy="18" r="1.5" fill="currentColor"/>
          </svg>
          <span class="tooltiptext">Drag to reorder</span>
        </div>
      `;
      
      let ruleHeader = `
        <div class="rule-header">
          <div class="rule-type ${ruleTypeClass}">
            ${ruleTypeIcon}
            <span class="${ruleTypeClass} rule-type-text-colored" style="color: ${ruleTypeColor} !important;">${ruleTypeText}</span>
            <span class="rule-applies-to-text" style="color: ${appliesToColor} !important;"> - ${appliesToText}</span>
          </div>
          <div class="rule-actions" style="display: flex; gap: 8px; align-items: center;">
            <button class="action-btn move-up-rule tooltip" data-rule-idx="${index}" aria-label="Move rule up" ${moveUpDisabled}>
              ${moveUpDisabled ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              ` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
              `}
              <div class="tooltip-text">${moveUpDisabled ? 'Cannot move up<br>(already at top)' : 'Move this rule<br>up in the list.'}</div>
              <div class="tooltip-text">Rules on Top (last added Rules) have priority over the Rules on Bottom (older added Rules)</div>
            </button>
            <button class="action-btn move-down-rule tooltip" data-rule-idx="${index}" aria-label="Move rule down" ${moveDownDisabled}>
              ${moveDownDisabled ? `
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                </svg>
              ` : `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              `}
              <div class="tooltip-text">${moveDownDisabled ? 'Cannot move down<br>(already at bottom)' : 'Move this rule<br>down in the list.'}</div>
              <div class="tooltip-text">Rules on Top (last added Rules) have priority over the Rules on Bottom (older added Rules)</div>
            </button>
            <button class="action-btn edit-rule tooltip" data-rule-id="${rule.id}" aria-label="Edit rule">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
              <div class="tooltip-text">Edit rule</div>
            </button>
            <button class="action-btn delete-rule tooltip" data-rule-id="${rule.id}" aria-label="Delete rule">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                <line x1="10" y1="11" x2="10" y2="17"></line>
                <line x1="14" y1="11" x2="14" y2="17"></line>
              </svg>
              <div class="tooltip-text">Delete rule</div>
            </button>
          </div>
        </div>
      `;
      // Build the rule description
      // CRITICAL: Align description text with header text
      // Header: padding-left 72px + icon (20px + 8px margin = 28px) = text starts at 100px
      // Description: padding-left should be 100px to align with header text
      // Drag handle is at left: 16px, width: 24px, so we need 16px + 24px + 1rem margin = ~72px total
      // But to align text, we need 72px + 28px (icon width) = 100px
      let ruleDescription = '<div class="rule-description-details" style="padding-left:100px !important;padding-right:1rem !important;padding-bottom:15px !important;padding-top:0.5rem !important;">';
      const labelStyle = 'font-style: italic; color: #888;';
      if (rule.appliesTo === 'between-layers') {
        // Between Entire Layers
        ruleDescription += `<div><span style="${labelStyle}">First Layer:</span> <span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${rule.firstLayerName || ''}</span></div>`;
        ruleDescription += `<div><span style="${labelStyle}">Second Layer:</span> <span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${rule.secondLayerName || ''}</span></div>`;
      } else if (rule.appliesTo === 'between-traits') {
        // Between Specific Trait(s)
        if (rule.firstTraits && rule.firstTraits.length > 0) {
          const layerName = rule.firstTraits[0].layerName || '';
          const traitNames = rule.firstTraits.map(t => t.name).join(', ');
          ruleDescription += `<div><span style="${labelStyle}">First Trait(s) (</span><span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${layerName}</span><span style="${labelStyle}">):</span><br><span class="rule-description-traits-list">${traitNames}</span></div>`;
        }
        if (rule.secondTraits && rule.secondTraits.length > 0) {
          const layerName = rule.secondTraits[0].layerName || '';
          const traitNames = rule.secondTraits.map(t => t.name).join(', ');
          ruleDescription += `<div><span style="${labelStyle}">Second Trait(s) (</span><span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${layerName}</span><span style="${labelStyle}">):</span><br><span class="rule-description-traits-list">${traitNames}</span></div>`;
        }
      } else if (rule.appliesTo === 'layer-to-traits') {
        // Between Layer and Specific Trait(s)
        ruleDescription += `<div><span style="${labelStyle}">First Layer:</span> <span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${rule.firstLayerName || rule.layerName || ''}</span></div>`;
        if (rule.traits && rule.traits.length > 0) {
          const layerName = rule.traits[0].layerName || '';
          const traitNames = rule.traits.map(t => t.name).join(', ');
          ruleDescription += `<div><span style="${labelStyle}">Second Trait(s) (</span><span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${layerName}</span><span style="${labelStyle}">):</span><br><span class="rule-description-traits-list">${traitNames}</span></div>`;
        }
      } else if (rule.appliesTo === 'traits-to-layer') {
        // Between Specific Trait(s) and Layer
        if (rule.traits && rule.traits.length > 0) {
          const layerName = rule.traits[0].layerName || '';
          const traitNames = rule.traits.map(t => t.name).join(', ');
          ruleDescription += `<div><span style="${labelStyle}">First Trait(s) (</span><span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${layerName}</span><span style="${labelStyle}">):</span><br><span class="rule-description-traits-list">${traitNames}</span></div>`;
        }
        ruleDescription += `<div><span style="${labelStyle}">Second Layer:</span> <span class="rule-description-label-highlight rule-description-label-${ruleTypeClass}">${rule.secondLayerName || rule.layerName || ''}</span></div>`;
      }
      ruleDescription += '</div>';
      // CRITICAL: Drag handle is first, then header and description, so it can be vertically centered
      ruleItem.innerHTML = dragHandle + ruleHeader + ruleDescription;
      
      // CRITICAL: Ensure container stays visible while appending each rule item
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
      rulesContainer.style.setProperty('background', 'transparent', 'important');
      rulesContainer.style.setProperty('background-color', 'transparent', 'important');
      rulesContainer.style.setProperty('background-image', 'none', 'important');
      
      // CRITICAL: Ensure rulesList is still in the DOM before appending
      if (!rulesContainer.contains(rulesList)) {
        console.warn('[WARN] rulesList not in container during append, re-adding it')
        rulesContainer.appendChild(rulesList)
      }
      
      // CRITICAL: Ensure rulesList is not null/undefined before appending
      if (!rulesList) {
        console.error('[ERROR] rulesList became null during rule rendering - this should not happen');
        return; // Skip this rule if rulesList is missing
      }
      
      // CRITICAL: Ensure container stays visible while appending
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
      
      rulesList.appendChild(ruleItem);
      // console.log('[DEBUG] updateRulesUI - appended rule', index, 'Total children:', rulesList.children.length);
    });
    
    // CRITICAL: Final check - ensure rulesList has content and is visible
    const finalRuleCount = rulesList ? rulesList.children.length : 0;
    // console.log('[DEBUG] updateRulesUI - Final check: rulesList.children.length =', finalRuleCount, 'projectData.rules.length =', projectData.rules ? projectData.rules.length : 0);
    
    if (finalRuleCount === 0 && projectData.rules && projectData.rules.length > 0) {
      console.error('[ERROR] No rules were appended to rulesList despite having', projectData.rules.length, 'rules in projectData');
      console.error('[ERROR] rulesList exists:', !!rulesList, 'rulesList in container:', rulesContainer.contains(rulesList));
      // Force re-render as fallback
      setTimeout(() => {
        // console.log('[DEBUG] Retrying updateRulesUI after 100ms');
        this.updateRulesUI(projectData)
      }, 100)
    }
    // else if (finalRuleCount > 0) {
    //   console.log('[DEBUG] Successfully rendered', finalRuleCount, 'rules');
    // }
    
    // CRITICAL: Ensure container stays visible after all operations
    // Apply immediately, don't defer to requestAnimationFrame
    rulesContainer.style.setProperty('display', 'block', 'important');
    rulesContainer.style.setProperty('visibility', 'visible', 'important');
    rulesContainer.style.setProperty('opacity', '1', 'important');
    rulesContainer.style.setProperty('background', 'transparent', 'important');
    rulesContainer.style.setProperty('background-color', 'transparent', 'important');
    rulesContainer.style.setProperty('background-image', 'none', 'important');
    
    if (rulesSection) {
      // CRITICAL: Clear updatingRules flag after all operations complete
      requestAnimationFrame(() => {
        delete rulesSection.dataset.updatingRules;
      });
      rulesSection.style.setProperty('display', 'flex', 'important');
      rulesSection.style.setProperty('visibility', 'visible', 'important');
      rulesSection.style.setProperty('opacity', '1', 'important');
      rulesSection.style.setProperty('background', 'transparent', 'important');
      rulesSection.style.setProperty('background-color', 'transparent', 'important');
      rulesSection.style.setProperty('background-image', 'none', 'important');
    }
    
    // CRITICAL: Re-apply filter after rendering rules to ensure correct visibility
    // This ensures that if a filter is active, it's applied to newly rendered rules
    // BUT: Only apply filter if dropdown exists and has a value (not empty/"All Rule Types")
    setTimeout(() => {
      const dropdown = document.getElementById('rules-filter-dropdown');
      if (dropdown && dropdown.value !== undefined && dropdown.value !== '' && dropdown.value !== 'all') {
        // Trigger filter update if filterRules function exists
        if (typeof window.filterRules === 'function') {
          window.filterRules(dropdown.value);
        } else {
          // Try to find filterRules in traits-rules-layout-fix scope
          // Since it's in a closure, we'll trigger the change event instead
          const changeEvent = new Event('change', { bubbles: true });
          dropdown.dispatchEvent(changeEvent);
        }
      } else {
        // CRITICAL: If "All Rule Types" is selected (or no filter), ensure all rules are visible
        const ruleElements = rulesContainer.querySelectorAll('.rule-item, [data-rule-id]');
        ruleElements.forEach(element => {
          element.style.removeProperty('display');
          element.style.removeProperty('visibility');
          element.style.removeProperty('position');
          element.style.removeProperty('height');
          element.style.removeProperty('overflow');
        });
      }
      
      // CRITICAL: Ensure rules section stays visible after filter application
      if (rulesSection) {
        rulesSection.style.setProperty('display', 'flex', 'important');
        rulesSection.style.setProperty('visibility', 'visible', 'important');
        rulesSection.style.setProperty('opacity', '1', 'important');
      }
      rulesContainer.style.setProperty('display', 'block', 'important');
      rulesContainer.style.setProperty('visibility', 'visible', 'important');
      rulesContainer.style.setProperty('opacity', '1', 'important');
    }, 50);
    
    // Also ensure visibility in next frame as backup
    requestAnimationFrame(() => {
          rulesContainer.style.setProperty('display', 'block', 'important');
          rulesContainer.style.setProperty('visibility', 'visible', 'important');
          rulesContainer.style.setProperty('opacity', '1', 'important');
          rulesContainer.style.setProperty('background', 'transparent', 'important');
          rulesContainer.style.setProperty('background-color', 'transparent', 'important');
          rulesContainer.style.setProperty('background-image', 'none', 'important');
      
        if (rulesSection) {
          rulesSection.style.setProperty('display', 'flex', 'important');
          rulesSection.style.setProperty('visibility', 'visible', 'important');
          rulesSection.style.setProperty('opacity', '1', 'important');
          rulesSection.style.setProperty('background', 'transparent', 'important');
          rulesSection.style.setProperty('background-color', 'transparent', 'important');
          rulesSection.style.setProperty('background-image', 'none', 'important');
        }
    });
    
    // CRITICAL: Update button visibility after rules are rendered
    setTimeout(() => {
      try {
        // Try to get layout fix module, but don't error if it doesn't exist
        let layoutFix = null;
        if (window.NFTApp && typeof window.NFTApp.getModule === 'function') {
          try {
            layoutFix = window.NFTApp.getModule('traitsRulesLayoutFix');
          } catch (error) {
            // Module not found or not registered - this is okay, continue without it
            layoutFix = null;
          }
        }
        if (layoutFix && layoutFix.updateVisibility) {
          layoutFix.updateVisibility();
        }
      } catch (error) {
        // Module not found or not available - this is okay, just skip the update
        // console.log('traitsRulesLayoutFix module not available:', error);
      }
      
      // CRITICAL: Final visibility check after all operations complete
          rulesContainer.style.setProperty('display', 'block', 'important');
          rulesContainer.style.setProperty('visibility', 'visible', 'important');
          rulesContainer.style.setProperty('opacity', '1', 'important');
          rulesContainer.style.setProperty('background', 'transparent', 'important');
          rulesContainer.style.setProperty('background-color', 'transparent', 'important');
          rulesContainer.style.setProperty('background-image', 'none', 'important');
      
        if (rulesSection) {
          rulesSection.style.setProperty('display', 'flex', 'important');
          rulesSection.style.setProperty('visibility', 'visible', 'important');
          rulesSection.style.setProperty('opacity', '1', 'important');
          rulesSection.style.setProperty('background', 'transparent', 'important');
          rulesSection.style.setProperty('background-color', 'transparent', 'important');
          rulesSection.style.setProperty('background-image', 'none', 'important');
        }
    }, 50);

    // Add event listeners for move up/down buttons using direct click listeners (like trait layers)
    // This is simpler and more reliable than delegation
    // Just call reattachMoveButtonListeners which handles everything
    this.reattachMoveButtonListeners(projectData);
    
    // Add event listeners for edit rule buttons
    rulesList.querySelectorAll('.edit-rule').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const ruleId = btn.getAttribute('data-rule-id');
        const rule = projectData.rules.find(r => r.id === ruleId);
        if (rule) {
          this.showCombinationRuleModal(projectData, rule);
        }
      });
      // Setup tooltip for edit rule button
      // CRITICAL: Check both .tooltiptext and .tooltip-text classes
      const tooltip = btn.querySelector('.tooltiptext') || btn.querySelector('.tooltip-text');
      if (tooltip) {
        this.setupRuleActionTooltip(btn, tooltip);
      }
    });
    // Add event listeners for delete rule buttons
    rulesList.querySelectorAll('.delete-rule').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const ruleId = btn.getAttribute('data-rule-id');
        const idx = projectData.rules.findIndex(r => r.id === ruleId);
        if (idx !== -1) {
          // Use custom confirmation modal if available, otherwise fallback to window.confirm
          if (window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
            window.NFTApp.getModule("confirmationModal").show(
              "Delete Rule",
              "Are you sure you want to delete this rule?",
              "This action cannot be undone.",
              () => {
                projectData.rules.splice(idx, 1);
                
                // Notify that rules have changed
                if (window.SavedSeedsModal && window.SavedSeedsModal.notifyRuleChange) {
                  window.SavedSeedsModal.notifyRuleChange();
                }
                
                this.updateRulesUI(projectData);
                this.updateCheckConflictsButtonState(projectData);
              }
            );
          } else {
            if (window.confirm('Are you sure you want to delete this rule?')) {
              projectData.rules.splice(idx, 1);
              
              // Notify that rules have changed
              if (window.SavedSeedsModal && window.SavedSeedsModal.notifyRuleChange) {
                window.SavedSeedsModal.notifyRuleChange();
              }
              
              this.updateRulesUI(projectData);
              this.updateCheckConflictsButtonState(projectData);
            }
          }
        }
      });
      // Setup tooltip for delete rule button
      // CRITICAL: Check both .tooltiptext and .tooltip-text classes
      const tooltip = btn.querySelector('.tooltiptext') || btn.querySelector('.tooltip-text');
      if (tooltip) {
        this.setupRuleActionTooltip(btn, tooltip);
      }
    });
    // Setup tooltips for move up/down rule buttons
    rulesList.querySelectorAll('.move-up-rule, .move-down-rule').forEach(btn => {
      // CRITICAL: Check both .tooltiptext and .tooltip-text classes
      const tooltips = btn.querySelectorAll('.tooltiptext, .tooltip-text');
      if (tooltips.length > 0) {
        // Use the first tooltip (the short one) for standard tooltip
        // Hide the second tooltip (the long one) to avoid conflicts
        if (tooltips.length > 1) {
          tooltips[1].style.display = 'none';
        }
        // Setup tooltip for the first (visible) tooltip
        this.setupRuleActionTooltip(btn, tooltips[0]);
      }
    });
    
    // CRITICAL: Call reattachMoveButtonListeners to ensure all listeners are properly attached
    // This ensures buttons work correctly after DOM updates (including drag-and-drop)
    setTimeout(() => {
      this.reattachMoveButtonListeners(projectData);
    }, 50);
    
    // CRITICAL: Setup tooltips for all action buttons that weren't set up above
    rulesList.querySelectorAll('.action-btn.tooltip').forEach(btn => {
      // Skip if already set up
      if (btn.dataset.tooltipSetup === "true") {
        return;
      }
      // CRITICAL: Check both .tooltiptext and .tooltip-text classes
      const tooltip = btn.querySelector('.tooltiptext') || btn.querySelector('.tooltip-text');
      if (tooltip && (!tooltip.style.display || tooltip.style.display !== 'none')) {
        this.setupRuleActionTooltip(btn, tooltip);
        btn.dataset.tooltipSetup = "true";
      }
    });

    // CRITICAL: Setup tooltips for drag handles - use global tooltip manager (same as trait-layer-drag-handle)
    rulesList.querySelectorAll('.rule-drag-handle.tooltip').forEach(dragHandle => {
      const tooltip = dragHandle.querySelector('.tooltiptext');
      if (tooltip) {
        // CRITICAL: Use global tooltip manager (same approach as trait-layer-drag-handle)
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(dragHandle, tooltip);
              } else {
          // Fallback: use setupRuleActionTooltip if global manager not available
          this.setupRuleActionTooltip(dragHandle, tooltip);
        }
      }
    });


    // --- FORCE COLOR PATCH: After rendering, set color directly on all .rule-type-text-colored spans and icons ---
    setTimeout(() => {
      rulesList.querySelectorAll('.rule-type-text-colored').forEach(span => {
        const classList = span.className.split(' ');
        let color = null;
        if (classList.includes('rule-type-never')) color = '#ff0000';
        if (classList.includes('rule-type-always')) color = '#00b894';
        if (classList.includes('rule-type-conditional')) color = '#fdcb6e';
        if (classList.includes('rule-type-top')) color = '#006cff';
        if (classList.includes('rule-type-bottom')) color = '#ff6600';
        if (classList.includes('rule-type-above')) color = '#006cff';
        if (classList.includes('rule-type-below')) color = '#ff6600';
        if (color) span.style.setProperty('color', color, 'important');
      });
      // Force color for immediately-above/below (purple/yellow)
      rulesList.querySelectorAll('.rule-item[data-rule-type="immediately-above"] .rule-type-above').forEach(span => span.style.setProperty('color', '#9000ff', 'important'));
      rulesList.querySelectorAll('.rule-item[data-rule-type="immediately-below"] .rule-type-below').forEach(span => span.style.setProperty('color', '#ffe400', 'important'));
      // Now force icon SVG stroke color
      rulesList.querySelectorAll('.rule-type-never-icon').forEach(svg => svg.style.setProperty('stroke', '#ff0000', 'important'));
      rulesList.querySelectorAll('.rule-type-always-icon').forEach(svg => svg.style.setProperty('stroke', '#00b894', 'important'));
      rulesList.querySelectorAll('.rule-type-conditional-icon').forEach(svg => svg.style.setProperty('stroke', '#fdcb6e', 'important'));
      rulesList.querySelectorAll('.rule-type-top-icon').forEach(svg => svg.style.setProperty('stroke', '#006cff', 'important'));
      rulesList.querySelectorAll('.rule-type-bottom-icon').forEach(svg => svg.style.setProperty('stroke', '#ff6600', 'important'));
      // Handle always-above/below (blue/orange) vs immediately-above/below (purple/yellow)
      rulesList.querySelectorAll('.rule-item[data-rule-type="always-above"] .rule-type-above-icon').forEach(svg => svg.style.setProperty('stroke', '#006cff', 'important'));
      rulesList.querySelectorAll('.rule-item[data-rule-type="always-below"] .rule-type-below-icon').forEach(svg => svg.style.setProperty('stroke', '#ff6600', 'important'));
      rulesList.querySelectorAll('.rule-item[data-rule-type="immediately-above"] .rule-type-above-icon').forEach(svg => svg.style.setProperty('stroke', '#9000ff', 'important'));
      rulesList.querySelectorAll('.rule-item[data-rule-type="immediately-below"] .rule-type-below-icon').forEach(svg => svg.style.setProperty('stroke', '#ffe400', 'important'));
    }, 0);
    // --- END FORCE COLOR PATCH ---
    
    // CRITICAL: Bottom buttons are already in the container from project-interface.js
    // No need to append them again - they're already there and styled correctly
    // Just ensure event listeners are attached
    if (bottomButtonsElement) {
      // Reattach event listeners if they exist
      setTimeout(() => {
        const jumpToLayersBtn = document.getElementById('jump-to-layers-bottom-btn')
        const jumpToRulesBtn = document.getElementById('jump-to-rules-bottom-btn')
        
        if (jumpToLayersBtn && !jumpToLayersBtn.dataset.listenerAdded) {
          jumpToLayersBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            
            // Find the subsection-description with the specific text (same as top button)
            const allDescriptions = document.querySelectorAll('.subsection-description')
            let targetDescription = null
            
            for (const desc of allDescriptions) {
              if (desc.textContent && desc.textContent.includes('Add and manage trait layers for your NFT collection')) {
                targetDescription = desc
                break
              }
            }
            
            if (targetDescription) {
              // Get the traits-rules tab-content container (the actual scrolling container)
              const traitsRulesTab = document.getElementById('traits-rules')
              if (traitsRulesTab) {
                // Calculate position relative to the scrolling container
                const containerRect = traitsRulesTab.getBoundingClientRect()
                const targetRect = targetDescription.getBoundingClientRect()
                
                // Calculate scroll position: target position relative to container + current scroll position
                const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100
                
                // Scroll the container instead of the window
                traitsRulesTab.scrollTo({
                  top: scrollPosition,
                  behavior: 'smooth'
                })
              } else {
                // Fallback to window scroll if container not found
                const navContainer = document.querySelector('.nav-container')
                const navHeight = navContainer ? navContainer.offsetHeight : 110
                const targetPosition = targetDescription.getBoundingClientRect().top + window.pageYOffset - navHeight - 100
                window.scrollTo({
                  top: targetPosition,
                  behavior: 'smooth'
                })
              }
            }
          }, { capture: true })
          jumpToLayersBtn.dataset.listenerAdded = 'true'
        }
        
        if (jumpToRulesBtn && !jumpToRulesBtn.dataset.listenerAdded) {
          jumpToRulesBtn.addEventListener('click', (e) => {
            e.preventDefault()
            e.stopPropagation()
            e.stopImmediatePropagation()
            
            // Find the subsection-description with the specific text (same as top button)
            const allDescriptions = document.querySelectorAll('.subsection-description')
            let targetDescription = null
            
            for (const desc of allDescriptions) {
              if (desc.textContent && desc.textContent.includes('Set up rules for trait combinations to ensure certain traits always or never appear together')) {
                targetDescription = desc
                break
              }
            }
            
            if (targetDescription) {
              // Get the traits-rules tab-content container (the actual scrolling container)
              const traitsRulesTab = document.getElementById('traits-rules')
              if (traitsRulesTab) {
                // Calculate position relative to the scrolling container
                const containerRect = traitsRulesTab.getBoundingClientRect()
                const targetRect = targetDescription.getBoundingClientRect()
                
                // Calculate scroll position: target position relative to container + current scroll position
                const scrollPosition = traitsRulesTab.scrollTop + (targetRect.top - containerRect.top) - 100
                
                // Scroll the container instead of the window
                traitsRulesTab.scrollTo({
                  top: scrollPosition,
                  behavior: 'smooth'
                })
              } else {
                // Fallback to window scroll if container not found
                const navContainer = document.querySelector('.nav-container')
                const navHeight = navContainer ? navContainer.offsetHeight : 110
                const targetPosition = targetDescription.getBoundingClientRect().top + window.pageYOffset - navHeight - 100
                window.scrollTo({
                  top: targetPosition,
                  behavior: 'smooth'
                })
              }
            }
          }, { capture: true })
          jumpToRulesBtn.dataset.listenerAdded = 'true'
        }
      }, 50)
      
      // Button visibility will be updated by traits-rules-layout-fix.js
      // The buttons are hidden by default and will be shown by updateButtonVisibility() 
      // when the requirements are met (at least 2 trait layers with 1 trait each)
    }
    
    // Note: updateRulesSectionVisibility is not called here - once visible, section stays visible
    // It's only checked on project load and when layers are deleted
  },

  // At the end of the module object, add an init function to inject CSS
  init: function() {
    // Add Combination Rule Thumb CSS
    if (!document.getElementById('combination-rules-style')) {
      const style = document.createElement('style');
      style.id = 'combination-rules-style';
      style.textContent = `
        .trait-selection-thumb {
            width: 75px !important;
            height: 75px !important;
            min-width: 75px !important;
            min-height: 75px !important;
            max-width: 75px !important;
            max-height: 75px !important;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(0,0,0,0.12);
          border-radius: 6px;
          margin: 0 6px 6px 0;
          position: relative;
          overflow: hidden;
        }
        .trait-selection-thumb img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border-radius: 4px;
          background: transparent;
        }
          .traits-list-for-rule-grid {
            display: grid;
            grid-template-columns: repeat(4, 141px);
            gap: 10px;
            width: calc(4 * 141px + 3 * 10px);
            margin: 0 auto 12px auto;
          }
          .trait-checkbox-label {
            width: 141px !important;
            height: 165px !important;
            min-width: 141px !important;
            max-width: 141px !important;
            overflow: hidden;
            padding: 8px !important;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            background: rgba(0,0,0,0.04);
            border-radius: 8px;
            position: relative;
            box-sizing: border-box;
            border: 2px solid transparent;
            transition: border-color 0.2s;
          }
          .trait-checkbox-label.selected {
            border: 3px solid #e17055 !important;
            box-shadow: 0 0 15px rgba(225, 112, 85, 0.5) !important;
          }
          .trait-checkbox-thumb {
            width: 135px !important;
            height: 106px !important;
            min-width: 135px !important;
            max-width: 135px !important;
            min-height: 106px !important;
            max-height: 106px !important;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 8px auto;
            overflow: hidden;
          }
          .nft-trait-thumb {
            width: 100% !important;
            height: 100% !important;
            min-width: 135px !important;
            min-height: 106px !important;
            object-fit: contain !important;
            border-radius: 4px !important;
            background: transparent !important;
            display: block !important;
          }
          .combination-rule-modal .trait-selection-name,
          .combination-rule-modal .trait-name-ellipsis {
            color: #fff !important;
            font-family: 'Archivo', sans-serif !important;
            font-size: 13px !important;
            font-weight: 600 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            width: 100% !important;
            display: block !important;
            margin-top: 2px !important;
            text-align: center !important;
            text-shadow: 0 1px 4px #000 !important;
            z-index: 10 !important;
            opacity: 1 !important;
            background: none !important;
            border: none !important;
          }
          /* Custom tooltip styles removed - no longer needed */
          .rule-description-details {
            font-family: 'Archivo', sans-serif !important;
            font-size: 12px !important;
            color: #fff !important;
            background: none !important;
            margin: 6px 0 0 0 !important;
            padding: 0 0 0 2px !important;
            line-height: 1.5 !important;
            letter-spacing: 0.01em !important;
          }
          .rule-description-traits-list {
            display: block;
            margin: 2px 0 0 0;
            color: #fff !important;
            font-size: 12px !important;
            font-family: 'Archivo', sans-serif !important;
            font-weight: 400 !important;
          }
          .rule-description-label-highlight.rule-description-label-rule-type-never,
          .rule-description-label-highlight.rule-description-label-rule-type-never {
            color: #ff0000 !important;
          }
          .never-combine-option,
          .custom-dropdown .never-combine-option,
          .custom-dropdown-item.never-combine-option {
            color: #ff0000 !important;
          }
          .rule-description-label-highlight.rule-description-label-rule-type-always {
            color: #00b894 !important;
          }
          .rule-description-label-highlight.rule-description-label-rule-type-conditional {
            color: #fdcb6e !important;
          }
          .rule-description-label-highlight.rule-description-label-rule-type-top {
            color: #006cff !important;
          }
          .rule-description-label-highlight.rule-description-label-rule-type-bottom {
            color: #ff6600 !important;
          }
          /* Always Above/Below use blue/orange, Immediately Above/Below use purple/yellow */
          .rule-description-label-highlight.rule-description-label-rule-type-above {
            color: #006cff !important;
          }
          .rule-description-label-highlight.rule-description-label-rule-type-below {
            color: #ff6600 !important;
          }
          /* Override for immediately-above/below using data attribute */
          .rule-item[data-rule-type="immediately-above"] .rule-description-label-highlight.rule-description-label-rule-type-above {
            color: #9000ff !important;
          }
          .rule-item[data-rule-type="immediately-below"] .rule-description-label-highlight.rule-description-label-rule-type-below {
            color: #ffe400 !important;
          }
          .immediately-below-option,
          .custom-dropdown .immediately-below-option,
          .custom-dropdown-item.immediately-below-option {
            color: #ffe400 !important;
          }
          .always-above-option,
          .custom-dropdown .always-above-option,
          .custom-dropdown-item.always-above-option {
            color: #006cff !important;
          }
          .always-below-option,
          .custom-dropdown .always-below-option,
          .custom-dropdown-item.always-below-option {
            color: #ff6600 !important;
          }
          .immediately-above-option,
          .custom-dropdown .immediately-above-option,
          .custom-dropdown-item.immediately-above-option {
            color: #9000ff !important;
          }
          .rule-type-text-colored.rule-type-never {
            color: #ff0000 !important;
          }
          .rule-type-text-colored.rule-type-always {
            color: #00b894 !important;
          }
          .rule-type-text-colored.rule-type-below {
            color: #ff6600 !important;
          }
          .rule-type-text-colored.rule-type-above {
            color: #006cff !important;
          }
          .rule-type-text-colored.rule-type-top {
            color: #006cff !important;
          }
          .rule-type-text-colored.rule-type-bottom {
            color: #ff6600 !important;
          }
          /* Immediately Above/Below use different colors */
          .rule-item[data-rule-type="immediately-above"] .rule-type-above {
            color: #9000ff !important;
          }
          .rule-item[data-rule-type="immediately-below"] .rule-type-below {
            color: #ffe400 !important;
          }
      `;
      document.head.appendChild(style);
    }

    // Add CSS for .rule-placeholder if not present
    if (!document.getElementById('combination-rules-dnd-style')) {
      const dndStyle = document.createElement('style');
      dndStyle.id = 'combination-rules-dnd-style';
      dndStyle.textContent = `
        .rule-placeholder {
          opacity: 1 !important;
          background: rgba(108,92,231,0.12) !important;
          border: 2px dashed #6c5ce7 !important;
          min-height: 48px !important;
          margin: 8px 0 !important;
        }
        .rule-item.dragging {
          opacity: 0.4 !important;
        }
      `;
      document.head.appendChild(dndStyle);
    }
  },
  moveRuleUp: function(projectData, idx) {
    // CRITICAL: Cancel any pending animations to prevent conflicts
    if (this._reorderingState.isAnimating) {
      this._cancelPendingAnimations();
    }

    if (idx <= 0) return; // Already at the top

    // Get DOM elements before updating
    const rulesContainer = document.getElementById("combination-rules-container");
    const rulesList = rulesContainer?.querySelector('.rules-list');
    
    if (!rulesList) {
      // Fallback to instant update if container not found
      const rules = projectData.rules;
      [rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];
      this.updateRulesUI(projectData);
      setTimeout(() => {
        this.reattachMoveButtonListeners(projectData);
      }, 50);
      return;
    }

    // Rules are rendered in reverse order (newest first)
    // idx is the array index, so we need to find elements in reversed DOM
    const rules = projectData.rules;
    const reversedIdx1 = rules.length - 1 - idx; // Current rule position in reversed DOM
    const reversedIdx2 = rules.length - 1 - (idx - 1); // Rule above position in reversed DOM
    
    // CRITICAL: Only select .rule-item elements, exclude warning and other elements
    const ruleItems = Array.from(rulesList.querySelectorAll('.rule-item')).filter(item => 
      item.classList.contains('rule-item') && !item.classList.contains('combination-rules-warning')
    );
    const currentRuleItem = ruleItems[reversedIdx1];
    const aboveRuleItem = ruleItems[reversedIdx2];
    
    if (!currentRuleItem || !aboveRuleItem) {
      // Fallback to instant update if elements not found
      [rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];
      this.updateRulesUI(projectData);
      setTimeout(() => {
        this.reattachMoveButtonListeners(projectData);
      }, 50);
      return;
    }

    // Mark animation as in progress
    this._reorderingState.isAnimating = true;

    // Calculate the distance to move (move current rule to where above rule is)
    const currentRect = currentRuleItem.getBoundingClientRect();
    const aboveRect = aboveRuleItem.getBoundingClientRect();
    // Distance to move current rule up (negative value)
    const moveDistance = aboveRect.top - currentRect.top;
    // Distance to move above rule down (positive value) - current rule's height + gap
    const aboveMoveDistance = currentRect.bottom - aboveRect.top;

    // CRITICAL: Ensure both elements are visible and in document flow before animation
    currentRuleItem.style.visibility = "visible";
    currentRuleItem.style.opacity = "1";
    currentRuleItem.style.display = "";
    aboveRuleItem.style.visibility = "visible";
    aboveRuleItem.style.opacity = "1";
    aboveRuleItem.style.display = "";
    
    // Clean up any existing transforms first
    currentRuleItem.style.transition = "";
    currentRuleItem.style.transform = "";
    currentRuleItem.style.zIndex = "";
    aboveRuleItem.style.transition = "";
    aboveRuleItem.style.transform = "";
    aboveRuleItem.style.zIndex = "";
    
    // Force reflow to ensure styles are reset
    void currentRuleItem.offsetHeight;
    void aboveRuleItem.offsetHeight;

    // Add animation class to both elements simultaneously
    currentRuleItem.classList.add("reordering");
    aboveRuleItem.classList.add("reordering");
    
    // CRITICAL: Use faster, smoother animation with optimized cubic-bezier timing for fluid motion
    const animationDuration = 200; // 0.2 seconds total for fluid reordering animation
    
    // CRITICAL: Enable hardware acceleration and prevent flickering
    currentRuleItem.style.backfaceVisibility = "hidden";
    currentRuleItem.style.transform = "translateZ(0)";
    aboveRuleItem.style.backfaceVisibility = "hidden";
    aboveRuleItem.style.transform = "translateZ(0)";
    
    // CRITICAL: Set transition on both elements simultaneously with optimized easing
    currentRuleItem.style.transition = `transform ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    aboveRuleItem.style.transition = `transform ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    
    // CRITICAL: Set z-index on both elements to ensure they're both visible during animation
    currentRuleItem.style.zIndex = "1000";
    aboveRuleItem.style.zIndex = "1000";
    
    // Force reflow to ensure transition and z-index are set before transform
    void currentRuleItem.offsetHeight;
    void aboveRuleItem.offsetHeight;
    
    // CRITICAL: Apply transforms to both elements in the same frame to ensure simultaneous animation
    // Use double requestAnimationFrame for smoother start (browser optimization)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        currentRuleItem.style.transform = `translateZ(0) translateY(${moveDistance}px)`;
        aboveRuleItem.style.transform = `translateZ(0) translateY(${aboveMoveDistance}px)`;
      });
    });

    // Update the data order - swap rules in array
    [rules[idx - 1], rules[idx]] = [rules[idx], rules[idx - 1]];

    // Use transitionend events for reliable cleanup (more reliable than setTimeout)
    let completedCount = 0;
    const requiredCompletions = 2; // Both elements need to complete
    
    const cleanup = () => {
      completedCount++;
      if (completedCount >= requiredCompletions) {
        // CRITICAL: Move DOM elements FIRST while transforms are still visually applied
        // This ensures the elements are in their new positions before removing transforms
        const container = document.getElementById("combination-rules-container");
        const rulesList = container?.querySelector('.rules-list');
        if (rulesList) {
          // CRITICAL: Get all rule items in current DOM order, exclude warning and other elements
          const allItems = Array.from(rulesList.querySelectorAll('.rule-item')).filter(item => 
            item.classList.contains('rule-item') && !item.classList.contains('combination-rules-warning')
          );
          
          // Reorder DOM elements to match projectData.rules order (already swapped above)
          // Rules are rendered in reverse, so we need to reverse the array indices
          rules.forEach((rule, arrayIdx) => {
            const domIdx = rules.length - 1 - arrayIdx; // Reverse index for DOM
            const item = allItems.find(i => i.getAttribute('data-rule-id') === rule.id);
            if (item && item.parentNode === rulesList) {
              // Move element to correct position if needed
              const currentIndex = Array.from(rulesList.children).indexOf(item);
              const targetIndex = domIdx;
              if (currentIndex !== targetIndex) {
                const referenceNode = rulesList.children[targetIndex];
                if (referenceNode && referenceNode !== item) {
                  rulesList.insertBefore(item, referenceNode);
                } else if (!referenceNode) {
                  rulesList.appendChild(item);
                }
              }
            }
          });
        }
        
        // CRITICAL: Now remove transforms - elements are already in new DOM positions
      requestAnimationFrame(() => {
        // Remove transforms - elements are already in correct DOM positions
        currentRuleItem.style.transition = "";
        currentRuleItem.style.transform = "";
        currentRuleItem.style.zIndex = "";
        currentRuleItem.classList.remove("reordering");
        
        aboveRuleItem.style.transition = "";
        aboveRuleItem.style.transform = "";
        aboveRuleItem.style.zIndex = "";
        aboveRuleItem.classList.remove("reordering");
        
          // CRITICAL: Update button states and reattach listeners after DOM manipulation
          setTimeout(() => {
            // CRITICAL: Update button data attributes and disabled states
            // Only select .rule-item elements, exclude warning and other elements
            const allItems = Array.from(rulesList.querySelectorAll('.rule-item')).filter(item => 
              item.classList.contains('rule-item') && !item.classList.contains('combination-rules-warning')
            );
            allItems.forEach((item, domIdx) => {
              const arrayIdx = rules.length - 1 - domIdx; // Reverse to get array index
              const moveUpBtn = item.querySelector('.move-up-rule');
              const moveDownBtn = item.querySelector('.move-down-rule');
              
              if (moveUpBtn) {
                moveUpBtn.setAttribute('data-rule-idx', arrayIdx);
                const isUpDisabled = (arrayIdx === rules.length - 1);
                moveUpBtn.disabled = isUpDisabled;
                if (isUpDisabled) {
                  moveUpBtn.setAttribute('disabled', 'disabled');
                  // Update icon to forbidden sign
                  const svg = moveUpBtn.querySelector('svg');
                  if (svg && !svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    `;
                  }
                } else {
                  moveUpBtn.removeAttribute('disabled');
                  // Update icon to up arrow if currently showing forbidden
                  const svg = moveUpBtn.querySelector('svg');
                  if (svg && svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    `;
                  }
                }
              }
              if (moveDownBtn) {
                moveDownBtn.setAttribute('data-rule-idx', arrayIdx);
                const isDownDisabled = (arrayIdx === 0);
                moveDownBtn.disabled = isDownDisabled;
                if (isDownDisabled) {
                  moveDownBtn.setAttribute('disabled', 'disabled');
                  // Update icon to forbidden sign
                  const svg = moveDownBtn.querySelector('svg');
                  if (svg && !svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    `;
                  }
                } else {
                  moveDownBtn.removeAttribute('disabled');
                  // Update icon to down arrow if currently showing forbidden
                  const svg = moveDownBtn.querySelector('svg');
                  if (svg && svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    `;
                  }
                }
              }
            });
            
            // Reattach move button listeners after DOM manipulation
            this.reattachMoveButtonListeners(projectData);
            
            // Update conflict check button state
            this.updateCheckConflictsButtonState(projectData);
            
            // Save project data after reordering
            if (window.NFTApp && window.NFTApp.getModule) {
              const projectService = window.NFTApp.getModule('projectService');
              if (projectService && typeof projectService.saveProjectData === 'function') {
                projectService.saveProjectData();
              } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
                window.MemoryManager.updateProject({ rules: projectData.rules }, { syncToModules: false });
              }
            } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
              window.MemoryManager.updateProject({ rules: projectData.rules }, { syncToModules: false });
            }
          }, 50);
        });
        
        // Reset animation state
        this._reorderingState.isAnimating = false;
        this._reorderingState.pendingTimeouts = [];
        this._reorderingState.transitionEndHandlers = [];
      }
    };

    // Add transitionend handlers
    const currentHandler = (e) => {
      if (e.target === currentRuleItem && e.propertyName === 'transform') {
        cleanup();
        currentRuleItem.removeEventListener('transitionend', currentHandler);
      }
    };
    
    const aboveHandler = (e) => {
      if (e.target === aboveRuleItem && e.propertyName === 'transform') {
        cleanup();
        aboveRuleItem.removeEventListener('transitionend', aboveHandler);
      }
    };

    currentRuleItem.addEventListener('transitionend', currentHandler);
    aboveRuleItem.addEventListener('transitionend', aboveHandler);
    
    // Store handlers for potential cleanup
    this._reorderingState.transitionEndHandlers.push(
      { element: currentRuleItem, handler: currentHandler },
      { element: aboveRuleItem, handler: aboveHandler }
    );

    // Fallback timeout in case transitionend doesn't fire (shouldn't happen, but safety net)
    const fallbackTimeout = setTimeout(() => {
      if (this._reorderingState.isAnimating) {
        cleanup();
      }
    }, 500); // Slightly longer than animation duration
    
    this._reorderingState.pendingTimeouts.push(fallbackTimeout);
  },
  moveRuleDown: function(projectData, idx) {
    // CRITICAL: Cancel any pending animations to prevent conflicts
    if (this._reorderingState.isAnimating) {
      this._cancelPendingAnimations();
    }

    const rules = projectData.rules;
    if (idx >= rules.length - 1) return; // Already at the bottom

    // Get DOM elements before updating
    const rulesContainer = document.getElementById("combination-rules-container");
    const rulesList = rulesContainer?.querySelector('.rules-list');
    
    if (!rulesList) {
      // Fallback to instant update if container not found
      [rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];
      this.updateRulesUI(projectData);
      setTimeout(() => {
        this.reattachMoveButtonListeners(projectData);
      }, 50);
      return;
    }

    // Rules are rendered in reverse order (newest first)
    // idx is the array index, so we need to find elements in reversed DOM
    const reversedIdx1 = rules.length - 1 - idx; // Current rule position in reversed DOM
    const reversedIdx2 = rules.length - 1 - (idx + 1); // Rule below position in reversed DOM
    
    // CRITICAL: Only select .rule-item elements, exclude warning and other elements
    const ruleItems = Array.from(rulesList.querySelectorAll('.rule-item')).filter(item => 
      item.classList.contains('rule-item') && !item.classList.contains('combination-rules-warning')
    );
    const currentRuleItem = ruleItems[reversedIdx1];
    const belowRuleItem = ruleItems[reversedIdx2];
    
    if (!currentRuleItem || !belowRuleItem) {
      // Fallback to instant update if elements not found
      [rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];
      this.updateRulesUI(projectData);
      setTimeout(() => {
        this.reattachMoveButtonListeners(projectData);
      }, 50);
      return;
    }

    // Mark animation as in progress
    this._reorderingState.isAnimating = true;

    // Calculate the distance to move (move current rule to where below rule is)
    const currentRect = currentRuleItem.getBoundingClientRect();
    const belowRect = belowRuleItem.getBoundingClientRect();
    // Distance to move current rule down (positive value)
    const moveDistance = belowRect.top - currentRect.top;
    // Distance to move below rule up (negative value) - current rule's height + gap
    const belowMoveDistance = -(belowRect.top - currentRect.bottom);

    // CRITICAL: Ensure both elements are visible and in document flow before animation
    currentRuleItem.style.visibility = "visible";
    currentRuleItem.style.opacity = "1";
    currentRuleItem.style.display = "";
    belowRuleItem.style.visibility = "visible";
    belowRuleItem.style.opacity = "1";
    belowRuleItem.style.display = "";
    
    // Clean up any existing transforms first
    currentRuleItem.style.transition = "";
    currentRuleItem.style.transform = "";
    currentRuleItem.style.zIndex = "";
    belowRuleItem.style.transition = "";
    belowRuleItem.style.transform = "";
    belowRuleItem.style.zIndex = "";
    
    // Force reflow to ensure styles are reset
    void currentRuleItem.offsetHeight;
    void belowRuleItem.offsetHeight;

    // Add animation class to both elements simultaneously
    currentRuleItem.classList.add("reordering");
    belowRuleItem.classList.add("reordering");
    
    // CRITICAL: Use faster, smoother animation with optimized cubic-bezier timing for fluid motion
    const animationDuration = 200; // 0.2 seconds total for fluid reordering animation
    
    // CRITICAL: Enable hardware acceleration and prevent flickering
    currentRuleItem.style.backfaceVisibility = "hidden";
    currentRuleItem.style.transform = "translateZ(0)";
    belowRuleItem.style.backfaceVisibility = "hidden";
    belowRuleItem.style.transform = "translateZ(0)";
    
    // CRITICAL: Set transition on both elements simultaneously with optimized easing
    currentRuleItem.style.transition = `transform ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    belowRuleItem.style.transition = `transform ${animationDuration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    
    // CRITICAL: Set z-index on both elements to ensure they're both visible during animation
    currentRuleItem.style.zIndex = "1000";
    belowRuleItem.style.zIndex = "1000";
    
    // Force reflow to ensure transition and z-index are set before transform
    void currentRuleItem.offsetHeight;
    void belowRuleItem.offsetHeight;
    
    // CRITICAL: Apply transforms to both elements in the same frame to ensure simultaneous animation
    // Use double requestAnimationFrame for smoother start (browser optimization)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        currentRuleItem.style.transform = `translateZ(0) translateY(${moveDistance}px)`;
        belowRuleItem.style.transform = `translateZ(0) translateY(${belowMoveDistance}px)`;
      });
    });

    // Update the data order - swap rules in array
    [rules[idx], rules[idx + 1]] = [rules[idx + 1], rules[idx]];

    // Use transitionend events for reliable cleanup (more reliable than setTimeout)
    let completedCount = 0;
    const requiredCompletions = 2; // Both elements need to complete
    
    const cleanup = () => {
      completedCount++;
      if (completedCount >= requiredCompletions) {
        // CRITICAL: Move DOM elements FIRST while transforms are still visually applied
        // This ensures the elements are in their new positions before removing transforms
        const container = document.getElementById("combination-rules-container");
        const rulesList = container?.querySelector('.rules-list');
        if (rulesList) {
          // CRITICAL: Get all rule items in current DOM order, exclude warning and other elements
          const allItems = Array.from(rulesList.querySelectorAll('.rule-item')).filter(item => 
            item.classList.contains('rule-item') && !item.classList.contains('combination-rules-warning')
          );
          
          // Reorder DOM elements to match projectData.rules order (already swapped above)
          // Rules are rendered in reverse, so we need to reverse the array indices
          rules.forEach((rule, arrayIdx) => {
            const domIdx = rules.length - 1 - arrayIdx; // Reverse index for DOM
            const item = allItems.find(i => i.getAttribute('data-rule-id') === rule.id);
            if (item && item.parentNode === rulesList) {
              // Move element to correct position if needed
              const currentIndex = Array.from(rulesList.children).indexOf(item);
              const targetIndex = domIdx;
              if (currentIndex !== targetIndex) {
                const referenceNode = rulesList.children[targetIndex];
                if (referenceNode && referenceNode !== item) {
                  rulesList.insertBefore(item, referenceNode);
                } else if (!referenceNode) {
                  rulesList.appendChild(item);
                }
              }
            }
          });
        }
        
        // CRITICAL: Now remove transforms - elements are already in new DOM positions
      requestAnimationFrame(() => {
        // Remove transforms - elements are already in correct DOM positions
        currentRuleItem.style.transition = "";
        currentRuleItem.style.transform = "";
        currentRuleItem.style.zIndex = "";
        currentRuleItem.classList.remove("reordering");
        
        belowRuleItem.style.transition = "";
        belowRuleItem.style.transform = "";
        belowRuleItem.style.zIndex = "";
        belowRuleItem.classList.remove("reordering");
        
          // CRITICAL: Update button states and reattach listeners after DOM manipulation
          setTimeout(() => {
            // CRITICAL: Update button data attributes and disabled states
            // Only select .rule-item elements, exclude warning and other elements
            const allItems = Array.from(rulesList.querySelectorAll('.rule-item')).filter(item => 
              item.classList.contains('rule-item') && !item.classList.contains('combination-rules-warning')
            );
            allItems.forEach((item, domIdx) => {
              const arrayIdx = rules.length - 1 - domIdx; // Reverse to get array index
              const moveUpBtn = item.querySelector('.move-up-rule');
              const moveDownBtn = item.querySelector('.move-down-rule');
              
              if (moveUpBtn) {
                moveUpBtn.setAttribute('data-rule-idx', arrayIdx);
                const isUpDisabled = (arrayIdx === rules.length - 1);
                moveUpBtn.disabled = isUpDisabled;
                if (isUpDisabled) {
                  moveUpBtn.setAttribute('disabled', 'disabled');
                  // Update icon to forbidden sign
                  const svg = moveUpBtn.querySelector('svg');
                  if (svg && !svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    `;
                  }
                } else {
                  moveUpBtn.removeAttribute('disabled');
                  // Update icon to up arrow if currently showing forbidden
                  const svg = moveUpBtn.querySelector('svg');
                  if (svg && svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    `;
                  }
                }
              }
              if (moveDownBtn) {
                moveDownBtn.setAttribute('data-rule-idx', arrayIdx);
                const isDownDisabled = (arrayIdx === 0);
                moveDownBtn.disabled = isDownDisabled;
                if (isDownDisabled) {
                  moveDownBtn.setAttribute('disabled', 'disabled');
                  // Update icon to forbidden sign
                  const svg = moveDownBtn.querySelector('svg');
                  if (svg && !svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                      </svg>
                    `;
                  }
                } else {
                  moveDownBtn.removeAttribute('disabled');
                  // Update icon to down arrow if currently showing forbidden
                  const svg = moveDownBtn.querySelector('svg');
                  if (svg && svg.querySelector('line[x1="4.93"]')) {
                    svg.outerHTML = `
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    `;
                  }
                }
              }
            });
            
            // Reattach move button listeners after DOM manipulation
            this.reattachMoveButtonListeners(projectData);
            
            // Update conflict check button state
            this.updateCheckConflictsButtonState(projectData);
            
            // Save project data after reordering
            if (window.NFTApp && window.NFTApp.getModule) {
              const projectService = window.NFTApp.getModule('projectService');
              if (projectService && typeof projectService.saveProjectData === 'function') {
                projectService.saveProjectData();
              } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
                window.MemoryManager.updateProject({ rules: projectData.rules }, { syncToModules: false });
              }
            } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
              window.MemoryManager.updateProject({ rules: projectData.rules }, { syncToModules: false });
            }
          }, 50);
        });
        
        // Reset animation state
        this._reorderingState.isAnimating = false;
        this._reorderingState.pendingTimeouts = [];
        this._reorderingState.transitionEndHandlers = [];
      }
    };

    // Add transitionend handlers
    const currentHandler = (e) => {
      if (e.target === currentRuleItem && e.propertyName === 'transform') {
        cleanup();
        currentRuleItem.removeEventListener('transitionend', currentHandler);
      }
    };
    
    const belowHandler = (e) => {
      if (e.target === belowRuleItem && e.propertyName === 'transform') {
        cleanup();
        belowRuleItem.removeEventListener('transitionend', belowHandler);
      }
    };

    currentRuleItem.addEventListener('transitionend', currentHandler);
    belowRuleItem.addEventListener('transitionend', belowHandler);
    
    // Store handlers for potential cleanup
    this._reorderingState.transitionEndHandlers.push(
      { element: currentRuleItem, handler: currentHandler },
      { element: belowRuleItem, handler: belowHandler }
    );

    // Fallback timeout in case transitionend doesn't fire (shouldn't happen, but safety net)
    const fallbackTimeout = setTimeout(() => {
      if (this._reorderingState.isAnimating) {
        cleanup();
      }
    }, 500); // Slightly longer than animation duration
    
    this._reorderingState.pendingTimeouts.push(fallbackTimeout);
  },
  
  // CRITICAL: Reattach event listeners for move up/down buttons after DOM changes
  // This ensures the arrow buttons continue to work after drag-and-drop or DOM swaps
  reattachMoveButtonListeners: function(projectData) {
    const rulesContainer = document.getElementById("combination-rules-container");
    if (!rulesContainer) return;
    
    const rulesList = rulesContainer.querySelector('.rules-list');
    if (!rulesList) return;
    
    // Use direct click listeners like trait layers (simpler and more reliable)
    const combinationRulesModule = this;
    
    // Move up buttons - move visually up (call moveRuleDown to increase array index)
    rulesList.querySelectorAll('.move-up-rule').forEach((btn) => {
      // Clone button to remove old listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Update disabled state
      const idx = parseInt(newBtn.getAttribute('data-rule-idx'), 10);
      if (!isNaN(idx)) {
        const isDisabled = (idx === projectData.rules.length - 1);
        newBtn.disabled = isDisabled;
        if (isDisabled) {
          newBtn.setAttribute('disabled', 'disabled');
          // Update icon to forbidden sign
          const svg = newBtn.querySelector('svg');
          if (svg) {
            svg.outerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            `;
          }
          // Update tooltip text
          const tooltipText = newBtn.querySelector('.tooltip-text');
          if (tooltipText) {
            tooltipText.textContent = 'Cannot move up\n(already at top)';
          }
        } else {
          newBtn.removeAttribute('disabled');
          // Update icon to up arrow
          const svg = newBtn.querySelector('svg');
          if (svg && svg.querySelector('line[x1="4.93"]')) {
            svg.outerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
            `;
          }
          // Update tooltip text
          const tooltipText = newBtn.querySelector('.tooltip-text');
          if (tooltipText && tooltipText.textContent.includes('Cannot move up')) {
            tooltipText.textContent = 'Move this rule\nup in the list.';
          }
        }
      }
      
      // Attach click listener (like trait layers)
      newBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const button = this;
        if (button.disabled || button.hasAttribute('disabled')) {
          return;
        }
        
        const idx = parseInt(button.getAttribute('data-rule-idx'), 10);
        if (!isNaN(idx) && idx < projectData.rules.length - 1) {
          combinationRulesModule.moveRuleDown(projectData, idx);
        }
      });
    });
    
    // Move down buttons - move visually down (call moveRuleUp to decrease array index)
    rulesList.querySelectorAll('.move-down-rule').forEach((btn) => {
      // Clone button to remove old listeners
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      // Update disabled state
      const idx = parseInt(newBtn.getAttribute('data-rule-idx'), 10);
      if (!isNaN(idx)) {
        const isDisabled = (idx === 0);
        newBtn.disabled = isDisabled;
        if (isDisabled) {
          newBtn.setAttribute('disabled', 'disabled');
          // Update icon to forbidden sign
          const svg = newBtn.querySelector('svg');
          if (svg) {
            svg.outerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            `;
          }
          // Update tooltip text
          const tooltipText = newBtn.querySelector('.tooltip-text');
          if (tooltipText) {
            tooltipText.textContent = 'Cannot move down\n(already at bottom)';
          }
        } else {
          newBtn.removeAttribute('disabled');
          // Update icon to down arrow
          const svg = newBtn.querySelector('svg');
          if (svg && svg.querySelector('line[x1="4.93"]')) {
            svg.outerHTML = `
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
            `;
          }
          // Update tooltip text
          const tooltipText = newBtn.querySelector('.tooltip-text');
          if (tooltipText && tooltipText.textContent.includes('Cannot move down')) {
            tooltipText.textContent = 'Move this rule\ndown in the list.';
          }
        }
      }
      
      // Attach click listener (like trait layers)
      newBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const button = this;
        if (button.disabled || button.hasAttribute('disabled')) {
          return;
        }
        
        const idx = parseInt(button.getAttribute('data-rule-idx'), 10);
        if (!isNaN(idx) && idx > 0) {
          combinationRulesModule.moveRuleUp(projectData, idx);
        }
      });
    });
  },

  // Auto-update thumbnails for NFTs affected by a stacking order rule
  autoUpdateThumbnailsForRule: async function(rule, projectData) {
    // Get seed list from localStorage
    const savedSeedsKey = `${projectData.name}-saved-seeds`;
    const savedSeeds = localStorage.getItem(savedSeedsKey);
    if (!savedSeeds) {
      console.log('[DEBUG] No saved seeds found, skipping auto-update');
      return;
    }

    let seedList;
    try {
      seedList = JSON.parse(savedSeeds);
    } catch (error) {
      console.error('[DEBUG] Error parsing saved seeds:', error);
      return;
    }

    if (!seedList || seedList.length === 0) {
      console.log('[DEBUG] Seed list is empty, skipping auto-update');
      return;
    }

    // Get generateNfts module
    const generateNftsModule = window.NFTApp.getModule('generateNfts');
    if (!generateNftsModule?.generateSingleNFT) {
      console.error('[DEBUG] generateSingleNFT not available');
      return;
    }

    // Extract trait/layer IDs affected by this rule
    const affectedTraitIds = new Set();
    const affectedLayerIds = new Set();
    
    if (rule.appliesTo === 'between-layers' || rule.appliesTo === 'layer-to-traits' || rule.appliesTo === 'traits-to-layer') {
      if (rule.firstLayerId) affectedLayerIds.add(rule.firstLayerId);
      if (rule.secondLayerId) affectedLayerIds.add(rule.secondLayerId);
      if (rule.layerId) affectedLayerIds.add(rule.layerId);
    }
    
    if (rule.appliesTo === 'between-traits' || rule.appliesTo === 'layer-to-traits' || rule.appliesTo === 'traits-to-layer') {
      if (rule.firstTraits && Array.isArray(rule.firstTraits)) {
        rule.firstTraits.forEach(t => {
          affectedTraitIds.add(t.id);
          if (t.layerId) affectedLayerIds.add(t.layerId);
        });
      }
      if (rule.secondTraits && Array.isArray(rule.secondTraits)) {
        rule.secondTraits.forEach(t => {
          affectedTraitIds.add(t.id);
          if (t.layerId) affectedLayerIds.add(t.layerId);
        });
      }
      if (rule.traits && Array.isArray(rule.traits)) {
        rule.traits.forEach(t => {
          affectedTraitIds.add(t.id);
          if (t.layerId) affectedLayerIds.add(t.layerId);
        });
      }
    }

    console.log('[DEBUG] Rule affects layers:', Array.from(affectedLayerIds));
    console.log('[DEBUG] Rule affects traits:', Array.from(affectedTraitIds));

    // Find NFTs that contain any of the affected traits/layers
    const affectedNFTs = [];
    seedList.forEach((seedObj, index) => {
      if (!seedObj.seed) return;
      
      // Parse seed to get trait composition
      const seed = seedObj.seed;
      // Seeds are in format: layerId1:traitId1,layerId2:traitId2,...
      const traits = seed.split(',').map(part => {
        const [layerId, traitId] = part.split(':');
        return { layerId, traitId };
      });
      
      // Check if this NFT uses any affected layers or traits
      const isAffected = traits.some(t => 
        affectedLayerIds.has(t.layerId) || affectedTraitIds.has(t.traitId)
      );
      
      if (isAffected) {
        affectedNFTs.push({ seedObj, index });
      }
    });

    if (affectedNFTs.length === 0) {
      console.log('[DEBUG] No NFTs affected by this rule');
      return;
    }

    console.log(`[DEBUG] Found ${affectedNFTs.length} NFTs affected by this rule`);

    // Show progress window
    const progressWindow = document.createElement('div');
    progressWindow.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: #2a2a3e;
      padding: 30px 40px;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5);
      z-index: 999999;
      min-width: 400px;
      text-align: center;
      font-family: 'Archivo', sans-serif;
    `;
    progressWindow.innerHTML = `
      <div style="font-size: 18px; font-weight: 600; color: #ecf0f1; margin-bottom: 15px;">
        Please Wait...
      </div>
      <div style="font-size: 16px; color: #95a5a6; margin-bottom: 10px;">
        Updating Thumbnails
      </div>
      <div id="thumbnail-update-progress" style="font-size: 14px; color: #3498db; font-weight: 600;">
        0 / ${affectedNFTs.length}
      </div>
    `;
    document.body.appendChild(progressWindow);

    // Update thumbnails in batches
    const batchSize = 5;
    let updated = 0;

    try {
      for (let i = 0; i < affectedNFTs.length; i += batchSize) {
        const batch = affectedNFTs.slice(i, Math.min(i + batchSize, affectedNFTs.length));
        
        await Promise.all(batch.map(async ({ seedObj, index }) => {
          try {
            const nftData = await generateNftsModule.generateSingleNFT(projectData, false, seedObj.seed);
            if (nftData?.thumbnail) {
              seedList[index].thumbnail = nftData.thumbnail;
              updated++;
              
              // Update progress
              const progressEl = document.getElementById('thumbnail-update-progress');
              if (progressEl) {
                progressEl.textContent = `${updated} / ${affectedNFTs.length}`;
              }
            }
          } catch (error) {
            console.error(`[DEBUG] Failed to update thumbnail for seed ${seedObj.seed}:`, error);
          }
        }));

        // Force DOM update by yielding to browser's event loop
        // This ensures progress is visible in real-time
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      }

      // Save updated seed list
      localStorage.setItem(savedSeedsKey, JSON.stringify(seedList));
      
      // Remove progress window
      progressWindow.remove();

      // Show success notification
      window.NFTApp.getModule('notificationService').show(
        `Updated ${updated} thumbnail${updated !== 1 ? 's' : ''} affected by the new rule`,
        'success'
      );

    } catch (error) {
      console.error('[DEBUG] Error during auto-update:', error);
      progressWindow.remove();
      window.NFTApp.getModule('notificationService').show(
        'Error updating thumbnails',
        'error'
      );
    }
  },
  }

  if (typeof window.NFTApp.registerModule === "function") {
    registerCombinationRulesModule();
  } else {
    document.addEventListener("NFTAppReady", function() {
      registerCombinationRulesModule();
    });
  }
})();

// Add a global Escape key handler for all modals
if (!window._globalEscapeModalHandlerAdded) {
  window._globalEscapeModalHandlerAdded = true;
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' || e.key === 'Esc') {
      // Close all modal overlays
      document.querySelectorAll('.modal-overlay').forEach(function(modal) {
        const style = window.getComputedStyle(modal);
        if (style.display === 'flex' || style.display === 'block') {
          modal.style.display = 'none';
        }
      });
      // Close all modals with .modal.visible
      document.querySelectorAll('.modal.visible').forEach(function(modal) {
        modal.classList.remove('visible');
      });
    }
  });
}

// ... existing code ...

// PATCH: After rendering the rule type dropdown, always apply the correct color class to the selected/collapsed display and to the rule name in the header, for all rule types.
function applyRuleTypeDropdownColors() {
  const ruleTypeSelect = document.getElementById('rule-type');
  if (!ruleTypeSelect) return;
  const selectedOption = ruleTypeSelect.options[ruleTypeSelect.selectedIndex];
  const dropdown = ruleTypeSelect.closest('.custom-dropdown');
  if (!dropdown) return;
  // Remove all rule-type color classes
  dropdown.classList.remove(
    'never-combine-option',
    'always-combine-option',
    'always-above-option',
    'always-below-option',
    'immediately-above-option',
    'immediately-below-option',
    'rule-type-never-option',
    'rule-type-always-option',
    'rule-type-top-option',
    'rule-type-bottom-option',
    'rule-type-above-option',
    'rule-type-below-option',
    'rule-type-conditional-option',
    'conditional-restriction-option'
  );
  // Add the correct class
  if (selectedOption) {
    if (selectedOption.classList.contains('never-combine-option')) dropdown.classList.add('never-combine-option');
    if (selectedOption.classList.contains('always-combine-option')) dropdown.classList.add('always-combine-option');
    if (selectedOption.classList.contains('always-above-option')) dropdown.classList.add('always-above-option');
    if (selectedOption.classList.contains('always-below-option')) dropdown.classList.add('always-below-option');
    if (selectedOption.classList.contains('immediately-above-option')) dropdown.classList.add('immediately-above-option');
    if (selectedOption.classList.contains('immediately-below-option')) dropdown.classList.add('immediately-below-option');
    if (selectedOption.classList.contains('conditional-restriction-option')) dropdown.classList.add('conditional-restriction-option');
  }
}
// Patch: call this after dropdown init and on change
setTimeout(() => {
  const ruleTypeSelect = document.getElementById('rule-type');
  if (ruleTypeSelect) {
    ruleTypeSelect.addEventListener('change', applyRuleTypeDropdownColors);
    applyRuleTypeDropdownColors();
  }
}, 500);
// ... existing code ...

// --- BEGIN: Color fix for Always on Top/Bottom options ---
function applyAlwaysOnTopBottomColorFix() {
  // Native select options
  const ruleTypeSelect = document.getElementById('rule-type');
  if (ruleTypeSelect) {
    Array.from(ruleTypeSelect.options).forEach(option => {
      if (option.value === 'always-on-top') {
        option.style.color = '#006cff';
      } else if (option.value === 'always-on-bottom') {
        option.style.color = '#ff6600';
      } else if (option.value === 'always-above') {
        option.style.color = '#006cff';
      } else if (option.value === 'always-below') {
        option.style.color = '#ff6600';
      } else {
        option.style.color = '';
      }
    });
  }
  // Custom dropdown items
  const customDropdownItems = document.querySelectorAll('.custom-dropdown-item');
  customDropdownItems.forEach(item => {
    if (item.textContent.trim() === 'Always on Top') {
      item.style.color = '#006cff';
    } else if (item.textContent.trim() === 'Always on Bottom') {
      item.style.color = '#ff6600';
    } else if (item.textContent.trim() === 'Always Above') {
      item.style.color = '#006cff';
    } else if (item.textContent.trim() === 'Always Below') {
      item.style.color = '#ff6600';
    } else {
      item.style.color = '';
    }
  });
}
// --- END: Color fix ---

// Patch: call color fix after dropdown init and on change
setTimeout(() => {
  const ruleTypeSelect = document.getElementById('rule-type');
  if (ruleTypeSelect) {
    ruleTypeSelect.addEventListener('change', () => {
      applyRuleTypeDropdownColors();
      applyAlwaysOnTopBottomColorFix();
    });
    applyRuleTypeDropdownColors();
    applyAlwaysOnTopBottomColorFix();
  }
  const ruleAppliesToSelect = document.getElementById('rule-applies-to');
  if (ruleAppliesToSelect) {
    ruleAppliesToSelect.addEventListener('change', applyAlwaysOnTopBottomColorFix);
  }
}, 500);
// Also call after modal is shown
const origShowCombinationRuleModal = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('combinationRules') && window.NFTApp.getModule('combinationRules').showCombinationRuleModal;
if (origShowCombinationRuleModal) {
  window.NFTApp.getModule('combinationRules').showCombinationRuleModal = function(projectData, ruleToEdit) {
    origShowCombinationRuleModal.call(this, projectData, ruleToEdit);
    setTimeout(applyAlwaysOnTopBottomColorFix, 150);
  };
}
// ... existing code ...

// --- FORCE COLOR PATCH FOR COLLAPSED DROPDOWN ---
function forceRuleTypeDropdownCollapsedColor() {
  const ruleTypeSelect = document.getElementById('rule-type');
  if (!ruleTypeSelect) return;
  const selectedValue = ruleTypeSelect.value;
  const colorMap = {
    'never-combine': '#ff0000',
    'always-combine': '#00b894',
    'conditional-restriction': '#fdcb6e',
    'always-on-top': '#006cff',
    'always-on-bottom': '#ff6600',
    'always-above': '#006cff',
    'always-below': '#ff6600',
    'immediately-above': '#9000ff',
    'immediately-below': '#ffe400',
  };
  const color = colorMap[selectedValue] || '#fff';
  // Find the custom dropdown display element
  const dropdown = ruleTypeSelect.closest('.custom-dropdown');
  if (dropdown) {
    // Try to find the display element (collapsed value)
    const display = dropdown.querySelector('.custom-dropdown-selected, .custom-dropdown__selected, .custom-dropdown-value, .custom-dropdown__value');
    if (display) {
      display.style.setProperty('color', color, 'important');
    }
  }
}
setTimeout(() => {
  forceRuleTypeDropdownCollapsedColor();
  const ruleTypeSelect = document.getElementById('rule-type');
  if (ruleTypeSelect) {
    ruleTypeSelect.addEventListener('change', forceRuleTypeDropdownCollapsedColor);
  }
}, 500);
// --- END FORCE COLOR PATCH FOR COLLAPSED DROPDOWN ---
