// Update trait layer rarity
updateTraitLayerRarity: function (layerId, newRarity) {
  const layer = this.projectData.traits.find(l => l.id === layerId)
  if (!layer) return

  const oldRarity = layer.rarity
  layer.rarity = newRarity

  // Adjust all traits in the layer proportionally
  if (layer.traits && layer.traits.length > 0) {
    const ratio = newRarity / oldRarity
    layer.traits.forEach(trait => {
      trait.rarity = Math.round(trait.rarity * ratio)
    })
  }

  this.saveProjectData()
  this.renderTraitsList()
},

// Update trait rarity
updateTraitRarity: function (layerId, traitId, newRarity) {
  const layer = this.projectData.traits.find(l => l.id === layerId)
  if (!layer) return

  const trait = layer.traits.find(t => t.id === traitId)
  if (!trait) return

  const oldRarity = trait.rarity
  trait.rarity = newRarity

  // Calculate the difference in rarity
  const rarityDiff = newRarity - oldRarity

  // Adjust other traits proportionally
  if (layer.traits.length > 1) {
    const otherTraits = layer.traits.filter(t => t.id !== traitId)
    const totalOtherRarity = otherTraits.reduce((sum, t) => sum + t.rarity, 0)
    
    if (totalOtherRarity > 0) {
      otherTraits.forEach(t => {
        const ratio = t.rarity / totalOtherRarity
        t.rarity = Math.round(t.rarity - (rarityDiff * ratio))
      })
    }
  }

  this.saveProjectData()
  this.renderTraitsList()
},

initializeDragAndDrop: function() {
  const container = document.querySelector('.trait-layers-container')
  if (!container) return

  let draggedItem = null
  let placeholder = null

  // Create placeholder element
  const createPlaceholder = () => {
    const ph = document.createElement('div')
    ph.className = 'trait-layer-placeholder'
    ph.style.height = '60px'
    ph.style.border = '2px dashed var(--border-color)'
    ph.style.borderRadius = '8px'
    ph.style.margin = '8px 0'
    return ph
  }

  // Handle drag start
  container.addEventListener('dragstart', (e) => {
    const layerHeader = e.target.closest('.trait-layer-header')
    if (!layerHeader) return

    draggedItem = layerHeader.closest('.trait-layer-bar')
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox

    // Create and insert placeholder
    placeholder = createPlaceholder()
    draggedItem.parentNode.insertBefore(placeholder, draggedItem.nextSibling)
    
    // Add dragging class
    draggedItem.classList.add('dragging')
  })

  // Handle drag over
  container.addEventListener('dragover', (e) => {
    e.preventDefault()
    if (!draggedItem) return

    const targetLayer = e.target.closest('.trait-layer-bar')
    if (!targetLayer || targetLayer === draggedItem) return

    const rect = targetLayer.getBoundingClientRect()
    const midpoint = rect.top + rect.height / 2
    
    if (e.clientY < midpoint) {
      targetLayer.parentNode.insertBefore(placeholder, targetLayer)
    } else {
      targetLayer.parentNode.insertBefore(placeholder, targetLayer.nextSibling)
    }
  })

  // Handle drop
  container.addEventListener('drop', (e) => {
    e.preventDefault()
    if (!draggedItem || !placeholder) return

    // Move the dragged item to the placeholder position
    placeholder.parentNode.insertBefore(draggedItem, placeholder)
    
    // Remove placeholder and dragging class
    placeholder.remove()
    draggedItem.classList.remove('dragging')
    
    // Update layer order in project data
    this.updateLayerOrder()
    
    draggedItem = null
    placeholder = null
  })

  // Handle drag end
  container.addEventListener('dragend', () => {
    if (placeholder) {
      placeholder.remove()
    }
    if (draggedItem) {
      draggedItem.classList.remove('dragging')
    }
    draggedItem = null
    placeholder = null
  })
},

updateLayerOrder: function() {
  const container = document.querySelector('.trait-layers-container')
  if (!container) return

  const layers = Array.from(container.querySelectorAll('.trait-layer-bar'))
  const newOrder = layers.map(layer => {
    const layerId = layer.dataset.layerId
    return this.projectData.traits.find(l => l.id === layerId)
  }).filter(Boolean)

  this.projectData.traits = newOrder
  this.saveProjectData()
}, 