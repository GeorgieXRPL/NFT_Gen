// Global Tooltip Manager
// Ensures only one tooltip displays at a time across the entire app
// All tooltips use orange text (#f39c12) and black background (#000000)
// 1 second delay before displaying
// Display above object, horizontally centered
// Never interferes with object styles

window.NFTApp.registerModule("globalTooltipManager", {
  currentTooltip: null, // Currently displayed tooltip
  currentTimeout: null, // Current timeout for showing tooltip
  currentElement: null, // Element that currently has tooltip showing

  // CRITICAL: Cleanup function to remove all tooltips from Collection Info tab
  // IMPORTANT: This function ONLY removes tooltip classes and tooltip text elements
  // It does NOT remove input fields or any other form elements
  cleanupCollectionInfoTooltips: function() {
    const generalInfoTab = document.getElementById('general-info');
    if (!generalInfoTab) return;
    
    // CRITICAL: Explicitly preserve the input fields - never remove them
    const collectionDescriptionField = document.getElementById('collection-description');
    const defaultNftDescriptionField = document.getElementById('default-nft-description');
    
    // CRITICAL: If fields don't exist, log error but don't proceed with cleanup
    // This prevents errors when cleanup is called before fields are created
    if (!collectionDescriptionField || !defaultNftDescriptionField) {
      console.warn('[WARNING] Input fields not found during cleanupCollectionInfoTooltips - fields may not be created yet');
      // Still proceed with other cleanup, but skip field-specific cleanup
    }
    
    // Remove tooltip class from all elements in Collection Info tab (including nested elements)
    // BUT: Skip the input fields themselves - we'll handle them separately
    const tooltipElements = generalInfoTab.querySelectorAll('.tooltip');
    tooltipElements.forEach(element => {
      // CRITICAL: Skip the input fields - they should not have tooltip class removed here
      // They are handled separately below to ensure they remain visible
      if (element.id === 'collection-description' || element.id === 'default-nft-description') {
        return; // Skip these fields - they are handled separately
      }
      element.classList.remove('tooltip');
      element.style.cursor = element.disabled ? "not-allowed" : "default";
      // Also remove any tooltip text elements inside
      const tooltipTexts = element.querySelectorAll('.tooltiptext, .tooltip-text');
      tooltipTexts.forEach(tooltip => tooltip.remove());
    });
    
    // CRITICAL: Handle input fields separately - only remove tooltip classes and tooltip text elements
    // DO NOT remove the input fields themselves - they MUST remain in the DOM
    if (collectionDescriptionField) {
      // CRITICAL: Only remove tooltip-related classes and elements, NEVER remove the field itself
      collectionDescriptionField.classList.remove('tooltip');
      const existingTooltip = collectionDescriptionField.querySelector('.tooltiptext') || collectionDescriptionField.querySelector('.tooltip-text');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      collectionDescriptionField.style.cursor = "text";
      // CRITICAL: Ensure the field remains visible and in the DOM - clear any hiding styles
      collectionDescriptionField.style.display = '';
      collectionDescriptionField.style.visibility = '';
      collectionDescriptionField.style.opacity = '';
      // CRITICAL: Remove any inline styles that might hide the field
      collectionDescriptionField.style.removeProperty('display');
      collectionDescriptionField.style.removeProperty('visibility');
      collectionDescriptionField.style.removeProperty('opacity');
      // CRITICAL: Ensure the field is not removed from DOM - check if it still exists
      if (!document.getElementById('collection-description')) {
        console.error('[CRITICAL ERROR] collection-description field was removed from DOM! This should never happen.');
      }
    }
    if (defaultNftDescriptionField) {
      // CRITICAL: Only remove tooltip-related classes and elements, NEVER remove the field itself
      defaultNftDescriptionField.classList.remove('tooltip');
      const existingTooltip = defaultNftDescriptionField.querySelector('.tooltiptext') || defaultNftDescriptionField.querySelector('.tooltip-text');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      defaultNftDescriptionField.style.cursor = "text";
      // CRITICAL: Ensure the field remains visible and in the DOM - clear any hiding styles
      defaultNftDescriptionField.style.display = '';
      defaultNftDescriptionField.style.visibility = '';
      defaultNftDescriptionField.style.opacity = '';
      // CRITICAL: Remove any inline styles that might hide the field
      defaultNftDescriptionField.style.removeProperty('display');
      defaultNftDescriptionField.style.removeProperty('visibility');
      defaultNftDescriptionField.style.removeProperty('opacity');
      // CRITICAL: Ensure the field is not removed from DOM - check if it still exists
      if (!document.getElementById('default-nft-description')) {
        console.error('[CRITICAL ERROR] default-nft-description field was removed from DOM! This should never happen.');
      }
    }
    
    // Remove all tooltip text elements anywhere in Collection Info tab
    // BUT: Make sure we're not removing the input fields themselves
    const tooltipTexts = generalInfoTab.querySelectorAll('.tooltiptext, .tooltip-text');
    tooltipTexts.forEach(tooltip => {
      // CRITICAL: Only remove tooltip text elements, not input fields
      if (tooltip.id !== 'collection-description' && tooltip.id !== 'default-nft-description') {
        tooltip.remove();
      }
    });
    
    // Remove tooltip class from the nav tab itself if it has one
    const generalInfoNavTab = document.querySelector('.nav-tab[data-tab="general-info"]');
    if (generalInfoNavTab) {
      generalInfoNavTab.classList.remove('tooltip');
      const navTabTooltip = generalInfoNavTab.querySelector('.tooltiptext, .tooltip-text');
      if (navTabTooltip) {
        navTabTooltip.remove();
      }
    }
    
    // Hide any currently displayed tooltip if it's from Collection Info tab
    if (this.currentTooltip && this.currentElement && generalInfoTab.contains(this.currentElement)) {
      this.hideCurrentTooltip();
    }
  },

  // Setup a tooltip for an element
  setupTooltip: function(element, tooltip) {
    if (!element || !tooltip) {
      console.warn("[Tooltips] globalTooltipManager.setupTooltip called with missing element or tooltip", { element: !!element, tooltip: !!tooltip });
      return;
    }
    
    // CRITICAL: Ensure tooltip element is properly attached to the DOM before setting up
    // This prevents issues where tooltip isn't ready on first hover
    if (!tooltip.parentElement || tooltip.parentElement !== element) {
      // Tooltip might be detached - ensure it's properly attached
      if (element.contains(tooltip)) {
        // Tooltip is already in element, but might need to be re-attached for proper setup
        const tempParent = tooltip.parentElement;
        if (tempParent && tempParent !== element) {
          // Move tooltip to element if it's in a different parent
          element.appendChild(tooltip);
        }
      } else {
        // Tooltip is not in element - attach it
        element.appendChild(tooltip);
      }
    }
    
    // CRITICAL: Prevent tooltips on Collection Description and Default NFT Description fields
    // Check both by ID, data-no-tooltip attribute, and by checking if element is one of these fields
    if (element.id === 'collection-description' || element.id === 'default-nft-description' ||
        element.getAttribute('data-no-tooltip') === 'true' ||
        (element.tagName === 'TEXTAREA' && (element.id === 'collection-description' || element.id === 'default-nft-description'))) {
      // CRITICAL: Only remove tooltip-related classes and elements, NEVER remove the field itself
      element.classList.remove('tooltip');
      const existingTooltip = element.querySelector('.tooltiptext') || element.querySelector('.tooltip-text');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      // CRITICAL: Return early to prevent tooltip setup
      return;
    }
    
    // CRITICAL: Skip all tooltips inside Collection Info tab (general-info) - but allow other elements
    const isInCollectionInfoTab = element.closest('#general-info') !== null || 
                                   element.closest('.tab-content#general-info') !== null ||
                                   (element.id === 'general-info');
    if (isInCollectionInfoTab) {
      // Skip tooltip setup for Collection Info tab elements (except buttons and other interactive elements)
      // Only skip for form fields and labels
      if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA' || element.tagName === 'LABEL') {
        return;
      }
      // Remove tooltip class and tooltip element if present
      element.classList.remove('tooltip');
      const existingTooltip = element.querySelector('.tooltiptext') || element.querySelector('.tooltip-text');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      // Remove tooltip from parent if element is the tooltip itself
      if (element.classList.contains('tooltiptext') || element.classList.contains('tooltip-text')) {
        const parent = element.parentElement;
        if (parent) {
          parent.classList.remove('tooltip');
          element.remove();
        }
      }
      element.style.cursor = element.disabled ? "not-allowed" : "default";
      return;
    }
    
    // CRITICAL: Skip if tooltip is disabled (e.g., when tab is greyed out)
    if (element.dataset.tooltipDisabled === "true") {
      element.style.cursor = "default";
      return;
    }
    
    // CRITICAL: Skip if data-no-tooltip is set (prevents tooltips on specific elements)
    if (element.dataset.noTooltip === "true" || element.getAttribute("data-no-tooltip") === "true") {
      element.style.cursor = element.disabled ? "not-allowed" : "text";
      return;
    }
    
    // CRITICAL: Skip export image dimension inputs
    if (element.id && ['export-image-width-input', 'export-image-height-input'].includes(element.id)) {
      element.style.cursor = element.disabled ? "not-allowed" : "text";
      return;
    }
    
    // CRITICAL: Skip Collection Info tab input fields (Collection Description and Default NFT Description)
    // These fields should not display tooltips
    if (element.id && ['collection-description', 'default-nft-description'].includes(element.id)) {
      element.classList.remove('tooltip');
      const existingTooltip = element.querySelector('.tooltiptext') || element.querySelector('.tooltip-text');
      if (existingTooltip) {
        existingTooltip.remove();
      }
      element.style.cursor = element.disabled ? "not-allowed" : "text";
      return;
    }
    
    // CRITICAL: Skip all close modal buttons - tooltips must never be visible on close buttons
    const isCloseButton = element.classList.contains('close-btn') ||
                         element.classList.contains('saved-seeds-close-btn') ||
                         element.classList.contains('select-trait-close-btn') ||
                         element.classList.contains('combination-rule-close-btn') ||
                         element.classList.contains('modal-close-btn') ||
                         element.classList.contains('modal-close') ||
                         element.classList.contains('nft-edit-close-btn') ||
                         (element.id && element.id.includes('close') && element.id.includes('modal')) ||
                         element.id === 'close-batch-modal' ||
                         element.id === 'close-saved-seeds-modal' ||
                         element.id === 'close-dark-traits-modal' ||
                         element.id === 'close-combination-rule-modal';
    if (isCloseButton) {
      element.style.cursor = "pointer";
      return;
    }

    // CRITICAL: Allow re-setup to fix broken tooltips
    // Remove old setup flag to allow re-setup - this ensures tooltips work even if they were set up incorrectly before
    if (element.dataset.tooltipSetup === "true") {
      delete element.dataset.tooltipSetup;
    }
    element.dataset.tooltipSetup = "true";
    
    // CRITICAL: Removed console.log for performance - tooltips were slow due to excessive logging

    // Ensure tooltip has correct styling
    this.ensureTooltipStyle(tooltip);
    
    // CRITICAL: Ensure tooltip starts completely hidden and positioned off-screen
    tooltip.style.setProperty("visibility", "hidden", "important");
    tooltip.style.setProperty("opacity", "0", "important");
    tooltip.style.setProperty("display", "block", "important");
    tooltip.style.setProperty("position", "fixed", "important");
    tooltip.style.setProperty("top", "-9999px", "important");
    tooltip.style.setProperty("left", "-9999px", "important");
    tooltip.style.setProperty("pointer-events", "none", "important");
    
    // CRITICAL: Ensure tooltip has 1 second transition for fade in/out
    tooltip.style.setProperty("transition", "opacity 1s ease", "important");

    // CRITICAL: Also set up tooltip on SVG elements inside the button
    // This ensures hovering over the SVG icon also shows the tooltip
    const svgElements = element.querySelectorAll ? element.querySelectorAll("svg") : [];
    const parentButton = element.tagName === "SVG" ? element.closest("button") : element;
    const targetElement = parentButton || element; // Use parent button if element is SVG, otherwise use element itself

    let tooltipTimeout = null;

    // Helper function to show tooltip
    const showTooltip = (triggerElement) => {
      // CRITICAL: Don't show tooltip if it's explicitly disabled via data attribute (e.g., when tab is greyed out)
      // BUT: Allow tooltips on disabled buttons (disabled attribute) - they should explain why button is disabled
      // CRITICAL: Check both targetElement and element for data-tooltip-disabled
      if (targetElement.dataset.tooltipDisabled === "true" || element.dataset.tooltipDisabled === "true") {
        return;
      }
      
      // CRITICAL: Ensure tooltip element exists and is in DOM
      if (!tooltip || !tooltip.parentNode) {
        console.warn("[Tooltips] Tooltip element missing or not in DOM:", tooltip);
        return;
      }
      
      // Hide any currently displayed tooltip
      this.hideCurrentTooltip();

      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // CRITICAL: Navigation tabs have 3 second delay, other tooltips have 1 second delay
      const isNavTab = targetElement.classList.contains('nav-tab') || targetElement.closest('.nav-tab');
      const delay = isNavTab ? 3000 : 1000; // 3 seconds for navigation tabs, 1 second for others
      
      // Show tooltip after delay
      tooltipTimeout = setTimeout(() => {
        // CRITICAL: Removed console.log for performance - tooltips were slow due to excessive logging
        // CRITICAL: Double-check tooltip is still enabled before showing
        if (targetElement.dataset.tooltipDisabled === "true") {
          return;
        }
        // Double-check if another tooltip started showing
        if (this.currentTooltip && this.currentTooltip !== tooltip) {
          // Another tooltip is showing, hide it first
          this.hideCurrentTooltip();
        }

        // Set this as the current tooltip
        this.currentTooltip = tooltip;
        this.currentElement = targetElement;

        // CRITICAL: Update tooltip content if it has dynamic content (e.g., for rarity buttons with selected traits)
        // Check if the element has a data-update-tooltip attribute or is a rarity action button
        const isRarityActionButton = targetElement.classList.contains('randomize-rarities-tiered-btn') ||
                                      targetElement.classList.contains('randomize-unique-rarities-btn') ||
                                      targetElement.classList.contains('normalize-unique-rarities-btn');
        if (isRarityActionButton) {
          // Find the trait layer bar to check for selected cards
          const traitLayerBar = targetElement.closest('.trait-layer-bar');
          if (traitLayerBar) {
            const selectedCount = traitLayerBar.querySelectorAll('.expanded-trait-layer-card.selected').length;
            let baseHtml = tooltip.getAttribute('data-base-html');
            if (!baseHtml) {
              // Store base HTML if not already stored - remove any existing purple text first
              baseHtml = tooltip.innerHTML.replace(/<br><br><span style="color:#6c5ce7;font-weight:600;">\*this feature will only be used<br>on the selected traits\.<\/span>/g, '');
              tooltip.setAttribute('data-base-html', baseHtml);
            } else {
              // Ensure baseHtml doesn't contain purple text (in case it was added before)
              baseHtml = baseHtml.replace(/<br><br><span style="color:#6c5ce7;font-weight:600;">\*this feature will only be used<br>on the selected traits\.<\/span>/g, '');
            }
            // CRITICAL: Update content with purple text if traits are selected - use innerHTML to preserve HTML
            const newContent = baseHtml + (selectedCount > 0 ? `<br><br><span style="color:#6c5ce7;font-weight:600;">*this feature will only be used<br>on the selected traits.</span>` : '');
            tooltip.innerHTML = newContent;
            // CRITICAL: Also update data-base-html if it was just created, to ensure consistency
            if (!tooltip.getAttribute('data-base-html')) {
              tooltip.setAttribute('data-base-html', baseHtml);
            }
            // CRITICAL: Clear cached dimensions when content changes to force re-measurement
            // This ensures tooltip displays correctly on first hover even if content was modified
            tooltip.dataset.cachedWidth = '';
            tooltip.dataset.cachedHeight = '';
          }
        }

        // CRITICAL: Optimize tooltip measurement - reduce reflows for better performance
        // Use cached dimensions if available, otherwise measure once
        let tooltipWidth = tooltip.dataset.cachedWidth ? parseInt(tooltip.dataset.cachedWidth) : null;
        let tooltipHeight = tooltip.dataset.cachedHeight ? parseInt(tooltip.dataset.cachedHeight) : null;
        
        // CRITICAL: Check if this is Seed NFT button - always measure on first display to ensure accurate positioning
        const isSeedNftButton = targetElement.id === 'single-seed-toggle' || 
                                targetElement.id === 'seed-nft-toggle' ||
                                (targetElement.classList.contains('toggle-button') && 
                                 targetElement.textContent && targetElement.textContent.trim() === 'Seed NFT');
        // CRITICAL: Check if this is Calculate Trait Rarities button - ensure proper centering
        const isCalculateTraitRaritiesButton = targetElement.id === 'rerender-thumbnails' ||
                                              (targetElement.classList.contains('rerender-btn') && 
                                               targetElement.textContent && targetElement.textContent.includes('Trait Rarities'));
        // CRITICAL: Check if this is a seed card button (EDIT, COPY, DELETE) - ensure proper measurement and centering
        const isSeedCardButtonForMeasurement = targetElement.classList.contains('seed-card-btn') ||
                                               targetElement.closest('.seed-card-buttons') !== null;
        // CRITICAL: Check if this is NFT Description button (seed-desc-btn) - ensure proper measurement and centering
        // Note: ID format is nft-description-{seed} to ensure uniqueness per card
        const isNftDescriptionButtonForMeasurement = (targetElement.id && targetElement.id.startsWith('nft-description')) ||
                                                     targetElement.classList.contains('seed-desc-btn') ||
                                                     targetElement.closest('.seed-desc-btn') !== null;
        
        // CRITICAL: Check if this is Jump to Rules button (for measurement and positioning)
        const isJumpToRulesButton = targetElement.id === 'jump-to-rules-btn' || 
                                    targetElement.id === 'jump-to-rules-bottom-btn' ||
                                    targetElement.classList.contains('jump-to-rules-btn');
        
        // CRITICAL: Check if this is Add Trait Layer, Add Folders, or Delete All Layers button (for measurement)
        const isActionButtonForMeasurement = targetElement.id === 'add-layer-btn' || 
                                            targetElement.id === 'add-folders-btn' || 
                                            targetElement.id === 'delete-all-layers' ||
                                            (targetElement.classList.contains('app-action-btn') && targetElement.closest('#traits-section')) ||
                                            (targetElement.classList.contains('add-folders-btn')) ||
                                            (targetElement.classList.contains('app-action-btn--danger') && targetElement.closest('#traits-section'));
        
        // CRITICAL: Check if this is a combination rule action button (for measurement)
        const isCombinationRuleActionBtnForMeasurement = (targetElement.closest('.combination-rule-modal') !== null ||
                                                          targetElement.closest('.rule-item') !== null ||
                                                          targetElement.closest('#combination-rules-container') !== null) &&
                                                         (targetElement.classList.contains('rule-action-btn') ||
                                                          targetElement.classList.contains('action-btn') ||
                                                          targetElement.classList.contains('edit-rule') ||
                                                          targetElement.classList.contains('edit-rule-btn') ||
                                                          targetElement.classList.contains('delete-rule') ||
                                                          targetElement.classList.contains('delete-rule-btn') ||
                                                          targetElement.classList.contains('move-up-rule') ||
                                                          targetElement.classList.contains('move-up-btn') ||
                                                          targetElement.classList.contains('move-down-rule') ||
                                                          targetElement.classList.contains('move-down-btn') ||
                                                          targetElement.closest('.rule-actions') !== null);
        
        // CRITICAL: Check if this is a Generate NFTs tab button (for measurement)
        const isGenerateNftsTabButtonForMeasurement = targetElement.classList.contains('nft-seed-copy-btn') || 
                                                     targetElement.classList.contains('copy-seed-btn') ||
                                                     targetElement.id === 'single-seed-toggle' || 
                                                     targetElement.id === 'seed-nft-toggle' ||
                                                     targetElement.id === 'generate-seed-nft-btn' ||
                                                     (targetElement.closest('#generate-nfts') !== null && 
                                                      targetElement.classList.contains('tooltip') &&
                                                      (targetElement.classList.contains('toggle-button') || 
                                                       targetElement.classList.contains('btn-primary')));
        
        // Only measure if dimensions not cached, or if Seed NFT button, Calculate Trait Rarities button, seed card button, description button, action buttons, combination rule buttons, or Generate NFTs tab buttons and dimensions seem incorrect
        // CRITICAL: Calculate Trait Rarities button needs proper measurement to ensure correct positioning above button
        // CRITICAL: Action buttons (Add Layer, Add Folders, Delete All Layers) need proper measurement for correct centering
        // CRITICAL: Combination rule action buttons need proper measurement for correct centering
        // CRITICAL: Generate NFTs tab buttons need proper measurement for correct centering
        // CRITICAL: Jump to Rules buttons need proper measurement for correct positioning
        if (!tooltipWidth || !tooltipHeight || 
            (isSeedNftButton && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isCalculateTraitRaritiesButton && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isSeedCardButtonForMeasurement && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isNftDescriptionButtonForMeasurement && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isActionButtonForMeasurement && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isCombinationRuleActionBtnForMeasurement && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isGenerateNftsTabButtonForMeasurement && (tooltipWidth < 50 || tooltipHeight < 20)) ||
            (isJumpToRulesButton && (tooltipWidth < 50 || tooltipHeight < 20))) {
          // Make tooltip temporarily visible to measure, but keep it off-screen
          tooltip.style.visibility = "visible";
          tooltip.style.opacity = "0";
          tooltip.style.top = "-9999px";
          tooltip.style.left = "-9999px";
          tooltip.style.transform = "none";
          tooltip.style.setProperty("display", "block", "important");
          tooltip.style.setProperty("position", "fixed", "important");
          // CRITICAL: For Seed NFT button, Calculate Trait Rarities button, seed card buttons, or description button, force re-measurement even if cached to ensure accurate positioning
          // CRITICAL: Calculate Trait Rarities button needs proper measurement to ensure tooltip displays above button correctly
          if ((isSeedNftButton || isCalculateTraitRaritiesButton || isSeedCardButtonForMeasurement || isNftDescriptionButtonForMeasurement) && tooltipWidth && tooltipWidth < 50) {
            // Clear incorrect cache
            tooltip.dataset.cachedWidth = '';
            tooltip.dataset.cachedHeight = '';
          }
          // CRITICAL: Ensure tooltip is moved to body before measurement to escape container constraints
          // This is especially important for action buttons, combination rule buttons, Generate NFTs tab buttons, seed card buttons, NFT description buttons, and Jump to Rules buttons that might be in containers with overflow hidden
          if ((isActionButtonForMeasurement || isCombinationRuleActionBtnForMeasurement || isGenerateNftsTabButtonForMeasurement || isSeedCardButtonForMeasurement || isNftDescriptionButtonForMeasurement || isJumpToRulesButton) && tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
          }
          
          // CRITICAL: Single reflow for measurement (reduced from multiple reflows)
          // Force multiple reflows for Seed NFT, Calculate Trait Rarities, seed card buttons, description button, action buttons, combination rule buttons, Generate NFTs tab buttons, or Jump to Rules buttons to ensure content is fully rendered
          // CRITICAL: Calculate Trait Rarities button needs multiple reflows to ensure accurate tooltip height measurement
          // CRITICAL: Action buttons, combination rule buttons, Generate NFTs tab buttons, and Jump to Rules buttons need multiple reflows to ensure accurate measurement
          if (isSeedNftButton || isCalculateTraitRaritiesButton || isSeedCardButtonForMeasurement || isNftDescriptionButtonForMeasurement || isActionButtonForMeasurement || isCombinationRuleActionBtnForMeasurement || isGenerateNftsTabButtonForMeasurement || isJumpToRulesButton) {
            void tooltip.offsetHeight; // Force first reflow
            void tooltip.offsetWidth; // Force second reflow to ensure width is calculated
          }
          void tooltip.offsetHeight; // Force one reflow
          tooltipWidth = tooltip.offsetWidth || 200;
          tooltipHeight = tooltip.offsetHeight || 40;
          // Cache dimensions for future use
          tooltip.dataset.cachedWidth = tooltipWidth.toString();
          tooltip.dataset.cachedHeight = tooltipHeight.toString();
        }
        
        const finalTooltipWidth = tooltipWidth;

        // CRITICAL: Ensure Export NFTs / Metadata navigation tab tooltip has highest z-index
        const isExportNavTab = (targetElement.classList.contains('nav-tab') && targetElement.dataset.tab === 'export-nfts') || 
                                (targetElement.closest('.nav-tab') && targetElement.closest('.nav-tab').dataset.tab === 'export-nfts');
        // CRITICAL: Check if this is an EDIT button from trait cards - needs higher z-index than NFT Traits text
        const isTraitEditBtn = targetElement.classList.contains('nft-trait-edit-btn') || targetElement.closest('.nft-trait-edit-btn');
        // CRITICAL: Check if this is Calculate Trait Rarities button - needs higher z-index than Find Rarity button
        const isCalculateTraitRaritiesBtn = targetElement.id === 'rerender-thumbnails' || 
                                           (targetElement.classList.contains('rerender-btn') && 
                                            targetElement.textContent && targetElement.textContent.includes('Trait Rarities'));
        // CRITICAL: Check if this is a rule-drag-handle or combination-rules-warning tooltip that should be below custom-dropdown
        const isRuleDragHandle = targetElement.classList.contains('rule-drag-handle');
        const isCombinationRulesWarning = targetElement.classList.contains('combination-rules-warning');
        const isInFilterContainer = targetElement.closest('.combination-rules-filter-container');
        
        // CRITICAL: For rule-drag-handle and combination-rules-warning tooltips, use lower z-index to prevent overlap with custom-dropdown
        if (isRuleDragHandle || isCombinationRulesWarning) {
          const tooltipZIndex = isInFilterContainer ? "999998" : "9998";
          tooltip.style.setProperty("z-index", tooltipZIndex, "important");
          console.log('[DEBUG TOOLTIP Z-INDEX] Setting lower z-index for', isRuleDragHandle ? 'rule-drag-handle' : 'combination-rules-warning', 'tooltip:', tooltipZIndex);
        } else if (isSeedNftButton) {
          // CRITICAL: Seed NFT tooltip needs maximum z-index and isolation to appear above Dark NFTs EDIT button tooltip
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("isolation", "isolate", "important");
        } else if (isCalculateTraitRaritiesBtn) {
          // CRITICAL: Trait Rarities tooltip needs maximum z-index and isolation to appear above Find Rarity button
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("isolation", "isolate", "important");
        } else {
          tooltip.style.setProperty("z-index", "2147483647", "important");
        }
        if (isExportNavTab || isTraitEditBtn) {
          tooltip.style.setProperty("display", "block", "important");
        }
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");

        // CRITICAL: Ensure orange text and black background
        tooltip.style.setProperty("background-color", "#000000", "important");
        tooltip.style.setProperty("background", "#000000", "important");
        tooltip.style.setProperty("color", "#f39c12", "important");

        // CRITICAL: Optimize positioning - get element rect once and calculate position
        const elementRect = targetElement.getBoundingClientRect();
        const centeredLeft = elementRect.left + (elementRect.width / 2) - (finalTooltipWidth / 2);
        
        // CRITICAL: Check positioning flags once
        const isNavTab = targetElement.classList.contains('nav-tab') || targetElement.closest('.nav-tab');
        const isInNftActionButtonsContainer = targetElement.closest('.nft-action-buttons-container') !== null;
        // CRITICAL: Check if this is a seed card button (EDIT, COPY, DELETE) - position tooltip ABOVE and horizontally centered
        // Check both the element itself and if it's inside a seed-card-buttons container (for both Saved Seeds and Bulk Generation modals)
        const isSeedCardButton = targetElement.classList.contains('seed-card-btn') ||
                                 targetElement.closest('.seed-card-buttons') !== null ||
                                 (targetElement.closest('.batch-generation-modal') !== null && targetElement.classList.contains('seed-card-btn')) ||
                                 (targetElement.closest('#saved-seeds-modal') !== null && targetElement.classList.contains('seed-card-btn'));
        // CRITICAL: Check if this is Auto-fix violations toggle - position tooltip below to avoid overlapping Rule Violations NFTs button
        const isAutoFixToggle = targetElement.classList.contains('auto-fix-toggle') ||
                                targetElement.closest('.auto-fix-toggle') !== null;
        // CRITICAL: Check if this is Find Trait input wrapper - position tooltip below to avoid screen clipping
        const isTraitSearchInputWrapper = targetElement.classList.contains('trait-search-input-wrapper') ||
                                          targetElement.closest('.trait-search-input-wrapper') !== null;
        const isTooltipBottom = targetElement.classList.contains('tooltip-bottom') || 
                                targetElement.closest('.tooltip-bottom') !== null ||
                                targetElement.closest('.nft-preview-title') !== null ||
                                targetElement.closest('.traits-title') !== null ||
                                // CRITICAL: Seed card buttons tooltips should be ABOVE (not below) - removed from isTooltipBottom
                                isAutoFixToggle || // CRITICAL: Auto-fix toggle tooltip should be below
                                isTraitSearchInputWrapper; // CRITICAL: Find Trait tooltip should be below
        // CRITICAL: Check if this is Dark NFTs button from Generate NFTs tab - position to the left
        const isDarkNftsButton = targetElement.id === 'generate-dark-nfts' || 
                                 (targetElement.classList.contains('toggle-button') && 
                                  targetElement.textContent && targetElement.textContent.trim() === 'Dark NFTs');
        
        // CRITICAL: Check if this is Dark NFTs EDIT button - position horizontally centered above
        const isDarkTraitsEditBtn = targetElement.id === 'dark-traits-edit-btn' || 
                                    targetElement.id === 'batch-dark-traits-edit-btn' ||
                                    targetElement.classList.contains('dark-traits-edit-btn') ||
                                    targetElement.classList.contains('batch-dark-traits-edit-btn');
        
        // CRITICAL: Check if this is Calculate Trait Rarities button - position horizontally centered above
        // Note: isCalculateTraitRaritiesBtn is already declared above for z-index purposes
        // CRITICAL: Check by ID first (most reliable), then by class, then by text content (which may be in nested spans)
        const isCalculateTraitRaritiesBtnForPositioning = targetElement.id === 'rerender-thumbnails' || 
                                                          targetElement.classList.contains('rerender-btn') ||
                                                          (targetElement.textContent && targetElement.textContent.includes('Trait Rarities')) ||
                                                          (targetElement.querySelector && targetElement.querySelector('.rerender-text-line1, .rerender-text-line2'));
        
        // CRITICAL: Check if this is Jump to Rules button (for positioning)
        const isJumpToRulesButtonForPositioning = targetElement.id === 'jump-to-rules-btn' || 
                                                 targetElement.id === 'jump-to-rules-bottom-btn' ||
                                                 targetElement.classList.contains('jump-to-rules-btn');
        
        // CRITICAL: Check if this is NFT Description button (seed-desc-btn) - position horizontally centered above
        // Note: ID format is nft-description-{seed} to ensure uniqueness per card
        const isNftDescriptionButton = (targetElement.id && targetElement.id.startsWith('nft-description')) ||
                                       targetElement.classList.contains('seed-desc-btn') ||
                                       targetElement.closest('.seed-desc-btn') !== null;
        
        // CRITICAL: Check if this is Add Trait Layer, Add Folders, or Delete All Layers button
        // These buttons need proper measurement and centering
        const isAddLayerBtn = targetElement.id === 'add-layer-btn';
        const isAddFoldersBtn = targetElement.id === 'add-folders-btn' || 
                               targetElement.classList.contains('add-folders-btn');
        const isDeleteAllLayersBtn = targetElement.id === 'delete-all-layers';
        const isActionButton = isAddLayerBtn || isAddFoldersBtn || isDeleteAllLayersBtn;
        
        // CRITICAL: Check if this is a combination rule button (Add Rule, Check Conflicts, Clear Filter, Jump to Layers, Jump to Rules)
        const isCombinationRuleButton = targetElement.id === 'add-combination-rule' ||
                                       targetElement.id === 'check-rule-conflicts' ||
                                       targetElement.id === 'clear-rules-filter-btn' ||
                                       targetElement.id === 'jump-to-layers-btn' ||
                                       targetElement.id === 'jump-to-layers-bottom-btn' ||
                                       targetElement.id === 'jump-to-rules-bottom-btn' ||
                                       targetElement.classList.contains('jump-to-layers-btn') ||
                                       targetElement.classList.contains('jump-to-rules-btn');
        
        // CRITICAL: Check if this is a trait card button (Delete, Replace Image, VIEW)
        const isTraitCardButton = targetElement.classList.contains('expanded-trait-layer-card-delete-btn') ||
                                 targetElement.classList.contains('expanded-trait-layer-card-replace-btn') ||
                                 targetElement.classList.contains('expanded-trait-layer-card-view-btn');
        
        // CRITICAL: Check if this is a combination rule action button (edit, delete, move up/down)
        // These buttons are inside combination rule modals or rule-items and need proper positioning
        const isCombinationRuleActionBtn = (targetElement.closest('.combination-rule-modal') !== null ||
                                           targetElement.closest('.rule-item') !== null ||
                                           targetElement.closest('#combination-rules-container') !== null) &&
                                          (targetElement.classList.contains('rule-action-btn') ||
                                           targetElement.classList.contains('action-btn') ||
                                           targetElement.classList.contains('edit-rule') ||
                                           targetElement.classList.contains('edit-rule-btn') ||
                                           targetElement.classList.contains('delete-rule') ||
                                           targetElement.classList.contains('delete-rule-btn') ||
                                           targetElement.classList.contains('move-up-rule') ||
                                           targetElement.classList.contains('move-up-btn') ||
                                           targetElement.classList.contains('move-down-rule') ||
                                           targetElement.classList.contains('move-down-btn') ||
                                           targetElement.closest('.rule-actions') !== null);
        
        // CRITICAL: Check if this is a Generate NFTs tab button (copy seed, Seed NFT toggle, Generate Seed)
        // These buttons need proper positioning and may be in containers with overflow hidden
        const isCopySeedBtn = targetElement.classList.contains('nft-seed-copy-btn') || 
                             targetElement.classList.contains('copy-seed-btn') ||
                             (targetElement.classList.contains('tooltip') && targetElement.querySelector('.tooltiptext') && 
                              targetElement.querySelector('.tooltiptext').textContent && 
                              targetElement.querySelector('.tooltiptext').textContent.includes('Copy'));
        const isSeedNftToggle = targetElement.id === 'single-seed-toggle' || 
                               targetElement.id === 'seed-nft-toggle' ||
                               (targetElement.classList.contains('toggle-button') && 
                                targetElement.textContent && targetElement.textContent.trim() === 'Seed NFT');
        const isGenerateSeedBtn = targetElement.id === 'generate-seed-nft-btn' || 
                                 (targetElement.classList.contains('btn-primary') && 
                                  targetElement.textContent && targetElement.textContent.includes('Generate Seed'));
        const isGenerateNftsTabButton = isCopySeedBtn || isSeedNftToggle || isGenerateSeedBtn;
        
        // Calculate position offsets
        const baseOffset = 5;
        const navTabOffset = isNavTab ? 20 : 0;
        const nftActionButtonsOffset = isInNftActionButtonsContainer ? -15 : 0;
        
        // CRITICAL: Position Dark NFTs tooltip to the left instead of above
        if (isDarkNftsButton) {
          // Position to the left of the button, vertically centered
          const leftPosition = elementRect.left - finalTooltipWidth - baseOffset;
          const topPosition = elementRect.top + (elementRect.height / 2) - (tooltipHeight / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${leftPosition}px`, "important");
        } else if (isDarkTraitsEditBtn) {
          // CRITICAL: Position Dark NFTs EDIT button tooltip horizontally centered above the button
          const topPosition = elementRect.top - tooltipHeight - baseOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = elementRect.left + (elementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        } else if (isSeedCardButton) {
          // CRITICAL: Position seed card button tooltips (EDIT, COPY, DELETE) horizontally centered ABOVE the button
          // CRITICAL: Ensure tooltip is moved to body before positioning to escape container constraints (modals, cards, etc.)
          if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
            // CRITICAL: Mark tooltip as seed card tooltip for CSS targeting
            tooltip.setAttribute('data-seed-card-tooltip', 'true');
          }
          // Recalculate element rect after moving tooltip to body (in case layout changed)
          const updatedElementRect = targetElement.getBoundingClientRect();
          const topPosition = updatedElementRect.top - tooltipHeight - baseOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = updatedElementRect.left + (updatedElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
          // CRITICAL: Ensure maximum z-index and isolation for seed card tooltips
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("isolation", "isolate", "important");
          tooltip.style.setProperty("contain", "layout style paint", "important");
          tooltip.style.setProperty("transform", "translateZ(0)", "important");
          tooltip.style.setProperty("will-change", "transform, opacity", "important");
          tooltip.style.setProperty("backface-visibility", "hidden", "important");
        } else if (isNftDescriptionButton) {
          // CRITICAL: Position NFT Description button tooltip horizontally centered ABOVE the button
          // CRITICAL: Ensure tooltip is moved to body before positioning to escape container constraints (modals, cards, etc.)
          if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
            // CRITICAL: Mark tooltip as NFT description tooltip for CSS targeting
            tooltip.setAttribute('data-nft-description-tooltip', 'true');
          }
          // Recalculate element rect after moving tooltip to body (in case layout changed)
          const updatedElementRect = targetElement.getBoundingClientRect();
          // Ensure tooltip height is properly measured (should already be measured above, but double-check)
          const finalTooltipHeight = tooltipHeight || tooltip.offsetHeight || 40;
          // Use larger offset for description button to ensure it doesn't overlap
          const descriptionOffset = 8; // Increased from baseOffset (5) to ensure clear separation
          const topPosition = updatedElementRect.top - finalTooltipHeight - descriptionOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = updatedElementRect.left + (updatedElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
          // CRITICAL: Ensure maximum z-index and isolation for NFT description tooltips
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("isolation", "isolate", "important");
          tooltip.style.setProperty("contain", "layout style paint", "important");
          tooltip.style.setProperty("transform", "translateZ(0)", "important");
          tooltip.style.setProperty("will-change", "transform, opacity", "important");
          tooltip.style.setProperty("backface-visibility", "hidden", "important");
        } else if (isJumpToRulesButtonForPositioning) {
          // CRITICAL: Position Jump to Rules button tooltip horizontally centered ABOVE the button
          // CRITICAL: Ensure tooltip is moved to body before positioning to escape container constraints
          if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
            // CRITICAL: Mark tooltip as Jump to Rules tooltip for CSS targeting
            tooltip.setAttribute('data-jump-to-rules-tooltip', 'true');
          }
          // Recalculate element rect after moving tooltip to body (in case layout changed)
          const updatedElementRect = targetElement.getBoundingClientRect();
          const topPosition = updatedElementRect.top - tooltipHeight - baseOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = updatedElementRect.left + (updatedElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
          // CRITICAL: Ensure maximum z-index and isolation for Jump to Rules tooltips
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("isolation", "isolate", "important");
          tooltip.style.setProperty("contain", "layout style paint", "important");
          tooltip.style.setProperty("transform", "translateZ(0)", "important");
          tooltip.style.setProperty("will-change", "transform, opacity", "important");
          tooltip.style.setProperty("backface-visibility", "hidden", "important");
        } else if (isCalculateTraitRaritiesBtnForPositioning) {
          // CRITICAL: Position Calculate Trait Rarities button tooltip horizontally centered ABOVE the button
          // CRITICAL: Ensure tooltip is moved to body before positioning to escape container constraints
          if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
          }
          // Recalculate element rect after moving tooltip to body (in case layout changed)
          const updatedElementRect = targetElement.getBoundingClientRect();
          const topPosition = updatedElementRect.top - tooltipHeight - baseOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = updatedElementRect.left + (updatedElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        } else if (isActionButton) {
          // CRITICAL: Position action buttons (Add Trait Layer, Add Folders, Delete All Layers) tooltips horizontally centered ABOVE the button
          // CRITICAL: Ensure tooltip is moved to body before positioning to escape container constraints
          if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
          }
          // Recalculate element rect after moving tooltip to body (in case layout changed)
          const updatedElementRect = targetElement.getBoundingClientRect();
          const topPosition = updatedElementRect.top - tooltipHeight - baseOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = updatedElementRect.left + (updatedElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        } else if (isCombinationRuleButton || isCombinationRuleActionBtn) {
        // CRITICAL: Position combination rule buttons (Add Rule, Check Conflicts, Clear Filter, Jump to Layers, edit, delete, move up/down) tooltips horizontally centered ABOVE the button
        // CRITICAL: Also position trait card buttons (Delete, Replace Image, VIEW) tooltips above the button
        // CRITICAL: Ensure tooltip is moved to body before positioning to escape modal container constraints
        if (tooltip.parentNode !== document.body) {
          document.body.appendChild(tooltip);
          // CRITICAL: Mark tooltip as combination rule tooltip for CSS targeting
          tooltip.setAttribute('data-combination-rule-tooltip', 'true');
        }
        // Recalculate element rect after moving tooltip to body (in case layout changed)
        const updatedElementRect = targetElement.getBoundingClientRect();
        // CRITICAL: For check-rule-conflicts button, account for conflict badge when positioning
        let buttonWidth = updatedElementRect.width;
        if (targetElement.id === 'check-rule-conflicts') {
          const conflictBadge = targetElement.querySelector('.conflict-badge');
          if (conflictBadge && conflictBadge.offsetParent !== null) {
            // Badge is visible, but doesn't affect horizontal centering - tooltip should still be centered on button
            // The badge is positioned absolutely, so button width is still correct for centering
          }
        }
        const topPosition = updatedElementRect.top - tooltipHeight - baseOffset;
        // Horizontally center the tooltip above the button
        const centeredLeft = updatedElementRect.left + (buttonWidth / 2) - (finalTooltipWidth / 2);
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // CRITICAL: Set z-index based on element type - tooltips for rule-drag-handle and combination-rules-warning should be BELOW custom-dropdown
        const isRuleDragHandle = targetElement.classList.contains('rule-drag-handle');
        const isCombinationRulesWarning = targetElement.classList.contains('combination-rules-warning');
        const isInFilterContainer = targetElement.closest('.combination-rules-filter-container');
        
        // CRITICAL: For rule-drag-handle and combination-rules-warning tooltips, use lower z-index to prevent overlap with custom-dropdown
        if (isRuleDragHandle || isCombinationRulesWarning) {
          const tooltipZIndex = isInFilterContainer ? "999998" : "9998";
          tooltip.style.setProperty("z-index", tooltipZIndex, "important");
          console.log('[DEBUG TOOLTIP Z-INDEX] Setting lower z-index for', isRuleDragHandle ? 'rule-drag-handle' : 'combination-rules-warning', 'tooltip:', tooltipZIndex);
        } else {
          // CRITICAL: Ensure maximum z-index and isolation for combination rule tooltips and trait card button tooltips
          tooltip.style.setProperty("z-index", "2147483647", "important");
        tooltip.style.setProperty("isolation", "isolate", "important");
        tooltip.style.setProperty("contain", "layout style paint", "important");
        tooltip.style.setProperty("transform", "translateZ(0)", "important");
        tooltip.style.setProperty("will-change", "transform, opacity", "important");
        tooltip.style.setProperty("backface-visibility", "hidden", "important");
        } else if (isGenerateNftsTabButton) {
          // CRITICAL: Position Generate NFTs tab buttons (copy seed, Seed NFT toggle, Generate Seed) tooltips horizontally centered ABOVE the button
          // CRITICAL: Ensure tooltip is moved to body before positioning to escape container constraints
          if (tooltip.parentNode !== document.body) {
            document.body.appendChild(tooltip);
          }
          // Recalculate element rect after moving tooltip to body (in case layout changed)
          const updatedElementRect = targetElement.getBoundingClientRect();
          const topPosition = updatedElementRect.top - tooltipHeight - baseOffset;
          // Horizontally center the tooltip above the button
          const centeredLeft = updatedElementRect.left + (updatedElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        } else {
          // Calculate top position for other tooltips (above or below)
          const topPosition = isTooltipBottom 
            ? elementRect.bottom + baseOffset
            : elementRect.top - tooltipHeight - baseOffset + navTabOffset + nftActionButtonsOffset;
          
          // CRITICAL: Set position in one batch to minimize reflows
          // For Seed NFT button, dimensions should already be correctly measured above
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        }

        // CRITICAL: Set all visibility properties in one batch to minimize reflows
        // CRITICAL: Ensure tooltip is moved to body for action buttons, combination rule buttons, trait card buttons, Generate NFTs tab buttons, seed card buttons, NFT description buttons, Jump to Rules buttons, and Calculate Trait Rarities button before making visible
        // Note: Jump to Rules button tooltip is already positioned above, so skip it here
        // CRITICAL: Include isCombinationRuleButton and isTraitCardButton in the check to ensure all buttons are handled
        if ((isActionButton || isCombinationRuleButton || isTraitCardButton || isCombinationRuleActionBtn || isGenerateNftsTabButton || isSeedCardButton || isNftDescriptionButton || isCalculateTraitRaritiesBtnForPositioning) && !isJumpToRulesButtonForPositioning && tooltip.parentNode !== document.body) {
          document.body.appendChild(tooltip);
          // Recalculate element rect one more time after moving to body
          const finalElementRect = targetElement.getBoundingClientRect();
          // Use appropriate offset based on button type
          const finalOffset = isNftDescriptionButton ? 8 : baseOffset; // NFT description uses larger offset
          const finalTopPosition = finalElementRect.top - tooltipHeight - finalOffset;
          const finalCenteredLeft = finalElementRect.left + (finalElementRect.width / 2) - (finalTooltipWidth / 2);
          tooltip.style.setProperty("top", `${finalTopPosition}px`, "important");
          tooltip.style.setProperty("left", `${finalCenteredLeft}px`, "important");
        }
        
        tooltip.style.setProperty("transition", "opacity 1s ease", "important");
        tooltip.style.setProperty("display", "block", "important");
        tooltip.style.setProperty("visibility", "visible", "important");
        tooltip.style.setProperty("opacity", "1", "important");

        tooltipTimeout = null;
      }, delay); // 3 seconds for navigation tabs, 1 second for others
    };

    // Helper function to hide tooltip
    const hideTooltip = () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }

      // CRITICAL: For Add Combination Rule and Jump to Layers buttons, ensure tooltip doesn't hide too quickly
      // Only hide if tooltip is actually visible (opacity > 0)
      const isAddCombinationRuleBtn = targetElement.id === 'add-combination-rule';
      const isJumpToLayersBtn = targetElement.id === 'jump-to-layers-btn' || 
                                targetElement.id === 'jump-to-layers-bottom-btn' ||
                                targetElement.classList.contains('jump-to-layers-btn');
      if ((isAddCombinationRuleBtn || isJumpToLayersBtn) && tooltip.style.opacity !== '1' && tooltip.style.visibility !== 'visible') {
        // Tooltip wasn't shown yet, don't hide it
        return;
      }

      // Hide tooltip if it's the current one
      if (this.currentTooltip === tooltip) {
        this.hideCurrentTooltip();
      } else {
        // CRITICAL: Ensure transition is set before fade out
        tooltip.style.setProperty("transition", "opacity 1s ease", "important");
        // Fade out this tooltip
        tooltip.style.setProperty("opacity", "0", "important");
        // Wait for fade out transition to complete before hiding
        setTimeout(() => {
          tooltip.style.setProperty("visibility", "hidden", "important");
        }, 1000);
      }
    };

    element.addEventListener("mouseenter", () => {
      showTooltip(element);
    });

    element.addEventListener("mouseleave", () => {
      hideTooltip();
    });

    // Also set up tooltip on SVG elements inside the button
    svgElements.forEach(svg => {
      // Add cursor help to SVG
      svg.style.setProperty("cursor", "help", "important");
      
      svg.addEventListener("mouseenter", () => {
        showTooltip(svg);
      });

      svg.addEventListener("mouseleave", () => {
        hideTooltip();
      });
    });
  },

  // Hide the currently displayed tooltip
  hideCurrentTooltip: function() {
    if (this.currentTooltip) {
      // CRITICAL: Ensure transition is set for fade out
      this.currentTooltip.style.setProperty("transition", "opacity 1s ease", "important");
      this.currentTooltip.style.setProperty("opacity", "0", "important");
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        if (this.currentTooltip) {
          this.currentTooltip.style.setProperty("visibility", "hidden", "important");
        }
      }, 1000);
      this.currentTooltip = null;
      this.currentElement = null;
    }
    if (this.currentTimeout) {
      clearTimeout(this.currentTimeout);
      this.currentTimeout = null;
    }
  },

  // Ensure tooltip has correct styling
  ensureTooltipStyle: function(tooltip) {
    // Check if this tooltip belongs to a toggle-button
    const parentElement = tooltip.parentElement;
    const isToggleButton = parentElement && parentElement.classList && parentElement.classList.contains('toggle-button');
    
    // Check if this tooltip belongs to Generate Seed button (force 2 lines)
    const isGenerateSeedBtn = parentElement && parentElement.id === 'generate-seed-nft-btn';
    
    // Set base styles if not already set - use setProperty with !important for critical properties
    if (!tooltip.style.backgroundColor || tooltip.style.backgroundColor === "") {
      tooltip.style.setProperty("background-color", "#000000", "important");
      tooltip.style.setProperty("background", "#000000", "important");
      tooltip.style.setProperty("color", "#f39c12", "important");
      tooltip.style.textAlign = "center";
      tooltip.style.borderRadius = "6px";
      tooltip.style.padding = "8px 10px";
      tooltip.style.fontSize = "11px";
      tooltip.style.lineHeight = "1.4";
      tooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
      tooltip.style.pointerEvents = "none";
      tooltip.style.whiteSpace = "normal";
      tooltip.style.wordWrap = "break-word";
      tooltip.style.overflowWrap = "break-word";
      tooltip.style.boxSizing = "border-box";
      tooltip.style.setProperty("transition", "opacity 1s ease", "important");
      tooltip.style.setProperty("visibility", "hidden", "important");
      tooltip.style.setProperty("opacity", "0", "important");
      tooltip.style.setProperty("position", "fixed", "important");
      tooltip.style.zIndex = "2147483647";
      
      // For toggle-button tooltips, force 2 lines and auto width
      if (isToggleButton) {
        tooltip.style.setProperty("width", "auto", "important");
        tooltip.style.setProperty("min-width", "auto", "important");
        tooltip.style.setProperty("max-width", "250px", "important");
        tooltip.style.setProperty("display", "flex", "important");
        tooltip.style.setProperty("flex-direction", "column", "important");
      }
      
      // CRITICAL: For Generate Seed button, allow full auto-sizing (no max-width restriction)
      if (isGenerateSeedBtn) {
        tooltip.style.setProperty("width", "auto", "important");
        tooltip.style.setProperty("min-width", "auto", "important");
        tooltip.style.setProperty("max-width", "none", "important");
        tooltip.style.setProperty("display", "block", "important");
      }
    }
  }
});

