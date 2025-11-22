/**
 * Smooth Drag-and-Drop System for Trait Layers and Combination Rules
 * Works seamlessly with existing up/down arrow reorder system
 */

(function() {
  'use strict';

  // State management
  const dragState = {
    pos: { x: null, y: null },
    diff: { x: null, y: null },
    mouseDown: false,
    selectedItem: null,
    resetTransition: false,
    transitionTime: 400,
    isDragging: false,
    container: null,
    itemHeight: null,
    itemGap: null,
    initialOrder: null
  };

  /**
   * Initialize drag-and-drop for trait layers
   */
  function initTraitLayersDragDrop() {
    const container = document.getElementById('trait-layers-container');
    if (!container) return;

    // Remove old listeners by cloning nodes
    const items = container.querySelectorAll('.trait-layer-bar:not(.expanded)');
    if (items.length === 0) return;

    // Calculate item height and gap from first two items
    if (items.length > 0) {
      const firstRect = items[0].getBoundingClientRect();
      const secondRect = items[1]?.getBoundingClientRect();
      dragState.itemHeight = firstRect.height;
      dragState.itemGap = secondRect ? (secondRect.top - firstRect.bottom) : 12;
    }

    // Set initial order attributes
    items.forEach((item, index) => {
      item.setAttribute('data-order', index + 1);
    });

    // Add event listeners to each drag handle only
    items.forEach((item) => {
      const dragHandle = item.querySelector('.trait-layer-drag-handle');
      if (!dragHandle) return;

      // Skip if item is expanded
      if (item.classList.contains('expanded')) return;

      // Remove old listeners by cloning
      const newDragHandle = dragHandle.cloneNode(true);
      dragHandle.parentNode.replaceChild(newDragHandle, dragHandle);

      newDragHandle.addEventListener('mousedown', function(e) {
        // CRITICAL: Stop propagation immediately to prevent drag-to-scroll from interfering
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Don't start drag if clicking on tooltip or if already dragging
        if (
          e.target.closest('.tooltiptext') ||
          dragState.resetTransition ||
          dragState.isDragging
        ) {
          return;
        }

        dragState.mouseDown = true;
        dragState.selectedItem = item;
        dragState.isDragging = true;
        dragState.initialOrder = parseInt(item.getAttribute('data-order'), 10);

        const rect = item.getBoundingClientRect();
        const containerRect = container.getBoundingClientRect();
        
        dragState.diff.y = e.clientY - rect.top;
        dragState.diff.x = e.clientX - rect.left;

        item.style.position = 'absolute';
        item.style.top = rect.top - containerRect.top + container.scrollTop + 'px';
        item.style.left = rect.left - containerRect.left + 'px';
        item.style.width = rect.width + 'px';
        item.style.zIndex = '1000';
        item.style.transition = 'none';
        item.style.opacity = '0.9';
        item.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
        item.setAttribute('data-dragging', 'yes');
        item.classList.add('dragging');

        // Update other items positions
        updateTraitItemPositions(item);

        e.preventDefault();
      }, true); // Use capture phase to ensure this handler runs before drag-to-scroll
    });

  }

  /**
   * Update positions of trait items during drag
   */
  function updateTraitItemPositions(draggedItem) {
    const container = document.getElementById('trait-layers-container');
    if (!container) return;

    const items = Array.from(container.querySelectorAll('.trait-layer-bar:not(.expanded)'));
    const draggedOrder = parseInt(draggedItem.getAttribute('data-order'), 10);
    const draggedRect = draggedItem.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const draggedY = draggedRect.top + (draggedRect.height / 2) - containerRect.top + container.scrollTop;

    items.forEach((item) => {
      if (item === draggedItem) return;

      const itemOrder = parseInt(item.getAttribute('data-order'), 10);
      const itemRect = item.getBoundingClientRect();
      const itemY = itemRect.top + (itemRect.height / 2) - containerRect.top + container.scrollTop;

      // Check if we should swap positions
      if (draggedOrder < itemOrder && draggedY > itemY) {
        // Moving down
        item.setAttribute('data-order', itemOrder - 1);
        draggedItem.setAttribute('data-order', draggedOrder + 1);
      } else if (draggedOrder > itemOrder && draggedY < itemY) {
        // Moving up
        item.setAttribute('data-order', itemOrder + 1);
        draggedItem.setAttribute('data-order', draggedOrder - 1);
      }
    });

    // Reposition all items except dragged one using transform
    items.forEach((item) => {
      if (item === draggedItem) return;
      const currentOrder = parseInt(item.getAttribute('data-order'), 10);
      const originalOrder = parseInt(item.getAttribute('data-original-order') || currentOrder, 10);
      
      // Store original order if not set
      if (!item.hasAttribute('data-original-order')) {
        item.setAttribute('data-original-order', originalOrder);
      }
      
      const offset = (currentOrder - originalOrder) * (dragState.itemHeight + dragState.itemGap);
      item.style.transition = 'transform 0.2s ease-out';
      item.style.transform = `translateY(${offset}px)`;
    });
  }

  /**
   * Finish trait drag and update project data
   */
  function finishTraitDrag() {
    if (!dragState.selectedItem) return;

    const container = document.getElementById('trait-layers-container');
    if (!container) return;

    dragState.mouseDown = false;
    dragState.resetTransition = true;

    const items = Array.from(container.querySelectorAll('.trait-layer-bar:not(.expanded)'));
    items.sort((a, b) => {
      return parseInt(a.getAttribute('data-order'), 10) - parseInt(b.getAttribute('data-order'), 10);
    });

    // Update final positions
    items.forEach((item, index) => {
      const order = index + 1;
      
      if (item === dragState.selectedItem) {
        const top = index * (dragState.itemHeight + dragState.itemGap);
        item.style.transition = 'top 0.4s ease-out, left 0.4s ease-out';
        item.style.top = top + 'px';
        item.style.left = '0';
        setTimeout(() => {
          item.style.position = '';
          item.style.top = '';
          item.style.left = '';
          item.style.width = '';
          item.style.zIndex = '';
          item.style.opacity = '';
          item.style.boxShadow = '';
          item.removeAttribute('data-dragging');
          item.removeAttribute('data-original-order');
          item.classList.remove('dragging');
        }, 400);
      } else {
        // Reset transform for non-dragged items
        item.style.transition = 'transform 0.4s ease-out';
        item.style.transform = '';
        item.removeAttribute('data-original-order');
      }
      item.setAttribute('data-order', order);
    });

    // Update project data
    setTimeout(() => {
      const projectData = window.projectData || window.currentProjectData;
      if (projectData && projectData.traits) {
        const newOrder = items.map(item => {
          const layerId = item.dataset.id;
          return projectData.traits.find(l => l.id === layerId);
        }).filter(Boolean);

        // Update order values
        newOrder.forEach((layer, index) => {
          layer.order = index + 1;
        });

        projectData.traits = newOrder;
        projectData.traits.sort((a, b) => a.order - b.order);

        // Save project data
        if (typeof window.projectService !== 'undefined' && window.projectService.saveProjectData) {
          window.projectService.saveProjectData(projectData);
        }

        // Update UI to ensure buttons are reattached
        if (typeof window.traitLayersModule !== 'undefined' && window.traitLayersModule.updateTraitLayerUI) {
          window.traitLayersModule.updateTraitLayerUI(projectData);
        }
      }

      // Reset container styles
      items.forEach(item => {
        item.style.position = '';
        item.style.top = '';
        item.style.transition = '';
        item.style.transform = '';
      });

      dragState.resetTransition = false;
      dragState.selectedItem = null;
      dragState.isDragging = false;
    }, 400);
  }

  /**
   * Initialize drag-and-drop for combination rules
   */
  function initRulesDragDrop() {
    const container = document.getElementById('combination-rules-container');
    if (!container) return;

    const rulesList = container.querySelector('.rules-list');
    if (!rulesList) return;

    const items = rulesList.querySelectorAll('.rule-item');
    if (items.length === 0) return;

    // Calculate item height and gap
    if (items.length > 0) {
      const firstRect = items[0].getBoundingClientRect();
      const secondRect = items[1]?.getBoundingClientRect();
      dragState.itemHeight = firstRect.height;
      dragState.itemGap = secondRect ? (secondRect.top - firstRect.bottom) : 12;
    }

    // Set initial order attributes
    items.forEach((item, index) => {
      item.setAttribute('data-order', index + 1);
    });

    // Add event listeners to each drag handle only
    items.forEach((item) => {
      const dragHandle = item.querySelector('.rule-drag-handle');
      if (!dragHandle) return;

      // Remove old listeners by cloning
      const newDragHandle = dragHandle.cloneNode(true);
      dragHandle.parentNode.replaceChild(newDragHandle, dragHandle);

      newDragHandle.addEventListener('mousedown', function(e) {
        // CRITICAL: Stop propagation immediately to prevent drag-to-scroll from interfering
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Don't start drag if clicking on tooltip or if already dragging
        if (
          e.target.closest('.tooltiptext') ||
          dragState.resetTransition ||
          dragState.isDragging
        ) {
          return;
        }

        dragState.mouseDown = true;
        dragState.selectedItem = item;
        dragState.isDragging = true;
        dragState.initialOrder = parseInt(item.getAttribute('data-order'), 10);

        const rect = item.getBoundingClientRect();
        const containerRect = rulesList.getBoundingClientRect();
        
        dragState.diff.y = e.clientY - rect.top;
        dragState.diff.x = e.clientX - rect.left;

        item.style.position = 'absolute';
        item.style.top = rect.top - containerRect.top + rulesList.scrollTop + 'px';
        item.style.left = rect.left - containerRect.left + 'px';
        item.style.width = rect.width + 'px';
        item.style.zIndex = '1000';
        item.style.transition = 'none';
        item.style.opacity = '0.9';
        item.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.3)';
        item.setAttribute('data-dragging', 'yes');
        item.classList.add('dragging');

        // Update other items positions
        updateRuleItemPositions(item, rulesList);

        e.preventDefault();
      }, true); // Use capture phase to ensure this handler runs before drag-to-scroll
    });
  }

  /**
   * Update positions of rule items during drag
   */
  function updateRuleItemPositions(draggedItem, rulesList) {
    const items = Array.from(rulesList.querySelectorAll('.rule-item'));
    const draggedOrder = parseInt(draggedItem.getAttribute('data-order'), 10);
    const draggedRect = draggedItem.getBoundingClientRect();
    const containerRect = rulesList.getBoundingClientRect();
    const draggedY = draggedRect.top + (draggedRect.height / 2) - containerRect.top + rulesList.scrollTop;

    items.forEach((item) => {
      if (item === draggedItem) return;

      const itemOrder = parseInt(item.getAttribute('data-order'), 10);
      const itemRect = item.getBoundingClientRect();
      const itemY = itemRect.top + (itemRect.height / 2) - containerRect.top + rulesList.scrollTop;

      // Check if we should swap positions
      if (draggedOrder < itemOrder && draggedY > itemY) {
        // Moving down
        item.setAttribute('data-order', itemOrder - 1);
        draggedItem.setAttribute('data-order', draggedOrder + 1);
      } else if (draggedOrder > itemOrder && draggedY < itemY) {
        // Moving up
        item.setAttribute('data-order', itemOrder + 1);
        draggedItem.setAttribute('data-order', draggedOrder - 1);
      }
    });

    // Reposition all items except dragged one using transform
    items.forEach((item) => {
      if (item === draggedItem) return;
      const currentOrder = parseInt(item.getAttribute('data-order'), 10);
      const originalOrder = parseInt(item.getAttribute('data-original-order') || currentOrder, 10);
      
      // Store original order if not set
      if (!item.hasAttribute('data-original-order')) {
        item.setAttribute('data-original-order', originalOrder);
      }
      
      const offset = (currentOrder - originalOrder) * (dragState.itemHeight + dragState.itemGap);
      item.style.transition = 'transform 0.2s ease-out';
      item.style.transform = `translateY(${offset}px)`;
    });
  }

  /**
   * Finish rule drag and update project data
   */
  function finishRuleDrag(rulesList) {
    if (!dragState.selectedItem || !rulesList) return;

    dragState.mouseDown = false;
    dragState.resetTransition = true;

    const items = Array.from(rulesList.querySelectorAll('.rule-item'));
    items.sort((a, b) => {
      return parseInt(a.getAttribute('data-order'), 10) - parseInt(b.getAttribute('data-order'), 10);
    });

    // Update final positions
    items.forEach((item, index) => {
      const order = index + 1;
      
      if (item === dragState.selectedItem) {
        const top = index * (dragState.itemHeight + dragState.itemGap);
        item.style.transition = 'top 0.4s ease-out, left 0.4s ease-out';
        item.style.top = top + 'px';
        item.style.left = '0';
        setTimeout(() => {
          item.style.position = '';
          item.style.top = '';
          item.style.left = '';
          item.style.width = '';
          item.style.zIndex = '';
          item.style.opacity = '';
          item.style.boxShadow = '';
          item.removeAttribute('data-dragging');
          item.removeAttribute('data-original-order');
          item.classList.remove('dragging');
        }, 400);
      } else {
        // Reset transform for non-dragged items
        item.style.transition = 'transform 0.4s ease-out';
        item.style.transform = '';
        item.removeAttribute('data-original-order');
      }
      item.setAttribute('data-order', order);
    });

    // Update project data
    setTimeout(() => {
      const projectData = window.projectData || window.currentProjectData;
      if (projectData && projectData.rules) {
        // Rules are displayed in reverse order (newest first in array)
        // So we need to reverse when updating
        const reversedItems = [...items].reverse();
        const newOrder = reversedItems.map(item => {
          const ruleIdx = parseInt(item.querySelector('.move-up-rule')?.getAttribute('data-rule-idx') || '0', 10);
          return projectData.rules[ruleIdx];
        }).filter(Boolean);

        // Update the rules array
        projectData.rules = newOrder;

        // Save project data
        if (typeof window.projectService !== 'undefined' && window.projectService.saveProjectData) {
          window.projectService.saveProjectData(projectData);
        }

        // Update UI to ensure buttons are reattached
        if (typeof window.combinationRulesModule !== 'undefined' && window.combinationRulesModule.updateRulesUI) {
          window.combinationRulesModule.updateRulesUI(projectData);
        }
      }

      // Reset container styles
      items.forEach(item => {
        item.style.position = '';
        item.style.top = '';
        item.style.transition = '';
        item.style.transform = '';
      });

      dragState.resetTransition = false;
      dragState.selectedItem = null;
      dragState.isDragging = false;
    }, 400);
  }

  /**
   * Global mousemove handler
   */
  function handleMouseMove(e) {
    // Update mouse position
    dragState.pos.x = e.clientX;
    dragState.pos.y = e.clientY;

    if (!dragState.mouseDown || !dragState.selectedItem) return;

    // CRITICAL: Prevent drag-to-scroll from interfering during drag-and-drop
    e.preventDefault();
    e.stopPropagation();

    const container = dragState.selectedItem.closest('.trait-layers-container') || 
                      dragState.selectedItem.closest('.rules-list');
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const scrollTop = container.scrollTop || 0;
    
    const offsetY = dragState.pos.y - containerRect.top + scrollTop - dragState.diff.y;
    const offsetX = dragState.pos.x - containerRect.left - dragState.diff.x;

    dragState.selectedItem.style.top = offsetY + 'px';
    dragState.selectedItem.style.left = offsetX + 'px';

    // Update positions of other items
    if (dragState.selectedItem.classList.contains('trait-layer-bar')) {
      updateTraitItemPositions(dragState.selectedItem);
    } else {
      const rulesList = container.querySelector('.rules-list') || container;
      updateRuleItemPositions(dragState.selectedItem, rulesList);
    }
  }

  /**
   * Global mouseup handler
   */
  function handleMouseUp(e) {
    if (!dragState.mouseDown || !dragState.selectedItem) return;

    const traitContainer = dragState.selectedItem.closest('.trait-layers-container');
    const rulesList = dragState.selectedItem.closest('.rules-list');

    if (traitContainer) {
      finishTraitDrag();
    } else if (rulesList) {
      finishRuleDrag(rulesList);
    }
  }

  /**
   * Initialize the drag-and-drop system
   * DISABLED: Drag-and-drop feature removed per user request
   */
  function init() {
    // DRAG-AND-DROP DISABLED: Feature removed per user request
    // All drag-and-drop functionality has been disabled
    return;
    
    /* DISABLED CODE - Drag-and-drop removed
    // Add global mousemove and mouseup listeners with capture phase to ensure priority
    window.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('mouseup', handleMouseUp, true);

    // Initialize for trait layers
    const traitContainer = document.getElementById('trait-layers-container');
    if (traitContainer) {
      // Use MutationObserver to reinitialize when items are added/removed
      const traitObserver = new MutationObserver(function(mutations) {
        if (!dragState.isDragging) {
          setTimeout(() => {
            initTraitLayersDragDrop();
          }, 100);
        }
      });
      traitObserver.observe(traitContainer, { childList: true, subtree: true });
      initTraitLayersDragDrop();
    }

    // Initialize for rules
    const rulesContainer = document.getElementById('combination-rules-container');
    if (rulesContainer) {
      // Use MutationObserver to reinitialize when items are added/removed
      const rulesObserver = new MutationObserver(function(mutations) {
        if (!dragState.isDragging) {
          setTimeout(() => {
            initRulesDragDrop();
          }, 100);
        }
      });
      rulesObserver.observe(rulesContainer, { childList: true, subtree: true });
      initRulesDragDrop();
    }
    */
  }

  // DRAG-AND-DROP DISABLED: Do not initialize
  // Initialize when DOM is ready
  // if (document.readyState === 'loading') {
  //   document.addEventListener('DOMContentLoaded', init);
  // } else {
  //   init();
  // }

  // Also initialize after a short delay to catch dynamically loaded content
  // setTimeout(init, 500);

  // Export for manual initialization if needed (disabled)
  window.smoothDragDrop = {
    init: function() { return; }, // Disabled
    initTraitLayersDragDrop: function() { return; }, // Disabled
    initRulesDragDrop: function() { return; } // Disabled
  };

})();
