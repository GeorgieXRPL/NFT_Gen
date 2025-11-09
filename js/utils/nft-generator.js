// NFT Generator Utility Module

// Replace all NFTApp. with window.NFTApp.

NFTApp.registerModule("nftGenerator", {
  // Generate a single NFT
  generateNFT: async function(projectData, index) {
    console.log(`Generating NFT #${index}`)
    
    // Create a canvas for the NFT
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    // Set canvas size (assuming square NFTs)
    canvas.width = 1000
    canvas.height = 1000
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Get trait layers in order (bottom to top)
    const layers = [...projectData.traits].reverse()
    
    // Generate traits for each layer
    const selectedTraits = []
    for (const layer of layers) {
      // Skip if layer has no traits
      if (!layer.traits || layer.traits.length === 0) continue
      
      // Select a trait based on rarity
      const trait = this.selectTraitByRarity(layer.traits)
      if (trait) {
        selectedTraits.push({
          layer: layer.name,
          trait: trait.name,
          rarity: trait.rarity
        })
        
        // Load and draw the trait image
        if (trait.image) {
          await this.drawTraitImage(ctx, trait.image)
        }
      }
    }
    
    // Convert canvas to data URL
    const imageData = canvas.toDataURL('image/png')
    
    // Create NFT data
    const nft = {
      id: index,
      name: `${projectData.filenamePrefix || 'NFT'} #${String(index).padStart(String(projectData.size).length, '0')}`,
      description: projectData.defaultNftDescription || '',
      image: imageData,
      traits: selectedTraits
    }
    
    return nft
  },
  
  // Select a trait based on rarity
  selectTraitByRarity: function(traits) {
    // Calculate total rarity
    const totalRarity = traits.reduce((sum, trait) => sum + trait.rarity, 0)
    
    // Generate random number between 0 and total rarity
    const random = Math.random() * totalRarity
    
    // Select trait based on rarity
    let currentSum = 0
    for (const trait of traits) {
      currentSum += trait.rarity
      if (random <= currentSum) {
        return trait
      }
    }
    
    // Fallback to first trait if something goes wrong
    return traits[0]
  },
  
  // Draw a trait image on the canvas
  drawTraitImage: async function(ctx, imageUrl) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height)
        resolve()
      }
      img.onerror = reject
      img.src = imageUrl
    })
  },
  
  // Generate multiple NFTs
  generateNFTs: async function(projectData, count, onProgress) {
    console.log(`Generating ${count} NFTs`)
    
    const nfts = []
    for (let i = 0; i < count; i++) {
      // Generate NFT
      const nft = await this.generateNFT(projectData, i + 1)
      nfts.push(nft)
      
      // Report progress
      if (onProgress) {
        onProgress(i + 1, count)
      }
    }
    
    return nfts
  },
  
  // Preview NFTs
  previewNFTs: async function(projectData, count) {
    console.log(`Previewing ${count} NFTs`)
    return this.generateNFTs(projectData, count)
  },
  
  // Validate project data for generation
  validateProjectData: function(projectData) {
    const errors = []
    
    // Check if project has traits
    if (!projectData.traits || projectData.traits.length === 0) {
      errors.push('No trait layers defined')
    }
    
    // Check if total supply is set
    if (!projectData.size || projectData.size <= 0) {
      errors.push('Total supply must be greater than 0')
    }
    
    // Check if collection name is set
    if (!projectData.name) {
      errors.push('Collection name is required')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
}) 