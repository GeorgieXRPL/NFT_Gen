// Seed Service Module - Provides consistent random number generation across sessions
;(() => {
  const seedService = {
    // Initialize the seed service
    init: function() {
      console.log("Initializing seed service module");
    },
    
    // Create a new seed algorithm for a project
    // This now returns fixed parameters for absolute determinism
    createSeedAlgorithm: function() {
      return {
        multiplier: 37, // fixed prime
        offset: 123456, // fixed offset
        modulus: 999983, // fixed large prime
        created: 0 // not used, just for compatibility
      };
    },
    
    // Generate a consistent hash value using the stored algorithm
    generateHash: function(input, algorithm) {
      if (!algorithm) {
        console.error("No seed algorithm provided");
        return Math.random(); // Fallback to pure random
      }
      
      // Convert input string to a consistent hash using the algorithm parameters
      let hash = 0;
      for (let i = 0; i < input.length; i++) {
        const char = input.charCodeAt(i);
        hash = ((hash * algorithm.multiplier) + char) % algorithm.modulus;
      }
      
      // Apply the offset and ensure it's positive
      hash = (hash + algorithm.offset) % algorithm.modulus;
      return hash;
    },
    
    // Generate a normalized random number between 0 and 1
    generateRandom: function(input, algorithm) {
      const hash = this.generateHash(input, algorithm);
      return hash / algorithm.modulus; // Normalize to 0-1 range
    },
    
    // NEW: Generate a deterministic seed string from a trait combination
    // This ensures the same traits will always produce the same seed
    // DEPRECATED: This method generates short 6-digit seeds (e.g., "505285")
    // Use generateNfts.computeDeterministicSeed() for proper long seeds (e.g., "15021200070302290003021000000000030000120000")
    generateSeed: function(traitCombination, algorithm) {
      if (!algorithm) {
        throw new Error("No seed algorithm provided for generating seed from traits. Determinism requires a fixed algorithm.");
      }
      // Build trait string: order matters, only use layer and trait names
      let traitString = '';
      if (Array.isArray(traitCombination)) {
        traitString = traitCombination
          .filter(t => t && typeof t === 'object' && t.layer && t.trait)
          .sort((a, b) => {
            // Sort by layer order to maintain consistent ordering
            const orderA = (a.layer && a.layer.order) ? a.layer.order : (a.sortIndex || 0);
            const orderB = (b.layer && b.layer.order) ? b.layer.order : (b.sortIndex || 0);
            return orderA - orderB;
          })
          .map(t => {
            const layerName = (t.layer && t.layer.name) ? t.layer.name : (t.layer || '').toString();
            const traitName = (t.trait && t.trait.name) ? t.trait.name : (t.trait || '').toString();
            return `${layerName}:${traitName}`;
          })
          .join('|'); // Order matters for deterministic seeds
      } else if (typeof traitCombination === 'object' && traitCombination.traits && Array.isArray(traitCombination.traits)) {
        traitString = traitCombination.traits
          .filter(t => t && typeof t === 'object' && t.layer && t.trait)
          .sort((a, b) => {
            // Sort by layer order to maintain consistent ordering
            const orderA = (a.layer && a.layer.order) ? a.layer.order : (a.sortIndex || 0);
            const orderB = (b.layer && b.layer.order) ? b.layer.order : (b.sortIndex || 0);
            return orderA - orderB;
          })
          .map(t => {
            const layerName = (t.layer && t.layer.name) ? t.layer.name : (t.layer || '').toString();
            const traitName = (t.trait && t.trait.name) ? t.trait.name : (t.trait || '').toString();
            return `${layerName}:${traitName}`;
          })
          .join('|');
      } else if (typeof traitCombination === 'string') {
        traitString = traitCombination;
      } else {
        traitString = String(traitCombination);
      }
      // Debug logging
      console.log('[SeedService] Deterministic seed with:', { traitString, algorithm });
      // Hash and return
      const hash = this.generateHash(traitString, algorithm);
      return (hash % 1000000).toString().padStart(6, '0');
    },
    
    // Get a random prime number in a specified range
    getRandomPrime: function(min, max) {
      let num = Math.floor(Math.random() * (max - min)) + min;
      while (!this.isPrime(num)) {
        num = Math.floor(Math.random() * (max - min)) + min;
      }
      return num;
    },
    
    // Get a specific prime number from a small range (more efficient)
    getPrimeInRange: function(min, max) {
      const primes = [31, 37, 41, 43, 47, 53];
      return primes.filter(p => p >= min && p <= max)[Math.floor(Math.random() * primes.length)];
    },
    
    // Check if a number is prime (fairly efficient for small numbers)
    isPrime: function(num) {
      if (num <= 1) return false;
      if (num <= 3) return true;
      if (num % 2 === 0 || num % 3 === 0) return false;
      
      // Check divisibility by numbers of form 6k±1 up to sqrt(num)
      for (let i = 5; i * i <= num; i += 6) {
        if (num % i === 0 || num % (i + 2) === 0) return false;
      }
      
      return true;
    }
  };

  // Register the seed service module
  window.NFTApp.registerModule("seedService", seedService);
})(); 