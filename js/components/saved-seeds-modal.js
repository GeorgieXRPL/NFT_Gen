/**
 * Saved Seeds Modal - Clean Implementation
 * Displays a grid of 10 columns x 3 rows of NFT cards
 * Each card shows: thumbnail, seed number, and 3 buttons (edit, copy, delete)
 */

class SavedSeedsModal {
  constructor() {
    this.modal = null;
    this.currentPage = 1;
    this.pageSize = 30; // 10 columns x 3 rows
    this.seedList = [];
    this.filteredSeedList = [];
    this.seedListKey = this.getSeedListKey();
    this.imageCache = {}; // Cache for generated images
    this.activePosition = 1; // Track the relative position of active page in the 10-page window (1-10)
    this.windowStart = 1; // Track the start of the current 10-page window
    this.draggedElement = null;
    this.draggedIndex = null;
    this.traitObserver = null;
    this.monitoringInterval = null;
    this.rarityRanks = {}; // Cache for rarity ranks
    this.rarityCalculationInProgress = false; // Flag to prevent multiple calculations
    this.rarityCalculationComplete = false; // Flag to track if calculation is done
    this.nftDescriptions = {}; // Per-seed descriptions
    this.isFilteringViolations = false;
    this.isFilteringByRarity = false; // Flag to track rarity search filtering
    this.isFilteringByTrait = false; // Flag to track trait search filtering
    this.isFilteringByPosition = false; // Flag to track position search filtering
    this.traitSearchTerm = null; // Store current trait search term
    this.raritySearchMode = 'rarity'; // Toggle between 'rarity' and 'position'
    this.isCancelled = false;
    this.violationsCache = new Map(); // Cache for rule violation results
    this.emptyPositions = new Set(); // Track empty positions during search to prevent conflicts
    this.originalSearchResults = []; // Store original search results before any deletions
    this.correctedNFTs = new Set(); // Track seeds of NFTs that have been corrected
    this.lastTraitSearchTerm = null; // Track last trait search term for resumption
    this.lastSearchedIndex = 0; // Track last NFT index searched for resumption
    this.traitChangeTimestamp = Date.now(); // Track when traits were last modified
    this.currentRenderPage = null; // Track which page is currently being rendered
    this.renderCancelled = false; // Flag to cancel current rendering
    this.pendingThumbnails = new Set(); // Track pending thumbnail loads for cancellation
    this.ruleChangeTimestamp = Date.now(); // Track when rules were last modified
    this.lastKnownRules = null; // Store last known rules for comparison
    
    // Cross-page drag and drop properties
    this.dragOverPageNumber = null; // Track which page number is being hovered during drag
    this.dragOverPageTimeout = null; // Timeout for page switching
    this.dragOverNavigationButton = null; // Track which navigation button (<, <<) is being hovered
    this.navigationSwitchInterval = null; // Interval for continuous page switching while hovering
    this.originalPage = null; // Store original page when drag starts
    
    // Auto-fix control
    this.autoFixEnabled = true; // Default to enabled
    
    // MEMORY OPTIMIZATION: Limit cache sizes for large collections
    this.maxImageCacheSize = 100; // Maximum number of images to keep in cache
    this.maxViolationsCacheSize = 500; // Maximum number of violation results to cache
    this.memoryCleanupInterval = null; // Interval for periodic memory cleanup
    this.lastMemoryCleanup = Date.now();
    
    // Track seeds deleted during this session to prevent re-appearing after navigation
    this.deletedSeedsSession = new Set();
    
    // Start memory cleanup for large collections
    this.startMemoryCleanup();
  }

  // MEMORY OPTIMIZATION: Start periodic memory cleanup
  startMemoryCleanup() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
    }
    
    // Run cleanup every 30 seconds for large collections
    this.memoryCleanupInterval = setInterval(() => {
      this.performMemoryCleanup();
    }, 30000);
  }
  
  // MEMORY OPTIMIZATION: Perform memory cleanup
  performMemoryCleanup() {
    const now = Date.now();
    
    // Only cleanup if it's been more than 30 seconds since last cleanup
    if (now - this.lastMemoryCleanup < 30000) {
      return;
    }
    
    // console.log('[DEBUG] Performing memory cleanup...');
    
    // Cleanup image cache if it's too large
    if (this.imageCache && Object.keys(this.imageCache).length > this.maxImageCacheSize) {
      const keys = Object.keys(this.imageCache);
      const keysToRemove = keys.slice(0, keys.length - this.maxImageCacheSize);
      
      keysToRemove.forEach(key => {
        delete this.imageCache[key];
      });
      
      console.log(`[DEBUG] Cleaned up ${keysToRemove.length} images from instance cache`);
    }
    
    // Cleanup global image cache if it's too large
    if (window.savedSeedsImageCache && Object.keys(window.savedSeedsImageCache).length > this.maxImageCacheSize * 2) {
      const keys = Object.keys(window.savedSeedsImageCache);
      const keysToRemove = keys.slice(0, keys.length - (this.maxImageCacheSize * 2));
      
      keysToRemove.forEach(key => {
        delete window.savedSeedsImageCache[key];
      });
      
      console.log(`[DEBUG] Cleaned up ${keysToRemove.length} images from global cache`);
    }
    
    // Cleanup violations cache if it's too large
    if (this.violationsCache && this.violationsCache.size > this.maxViolationsCacheSize) {
      const entries = Array.from(this.violationsCache.entries());
      const entriesToRemove = entries.slice(0, entries.length - this.maxViolationsCacheSize);
      
      entriesToRemove.forEach(([key]) => {
        this.violationsCache.delete(key);
      });
      
      console.log(`[DEBUG] Cleaned up ${entriesToRemove.length} violation cache entries`);
    }
    
    // Force garbage collection if available
    if (window.gc) {
      window.gc();
      // console.log('[DEBUG] Forced garbage collection');
    }
    
    this.lastMemoryCleanup = now;
    // console.log('[DEBUG] Memory cleanup completed');
  }
  
  // MEMORY OPTIMIZATION: Stop memory cleanup
  stopMemoryCleanup() {
    if (this.memoryCleanupInterval) {
      clearInterval(this.memoryCleanupInterval);
      this.memoryCleanupInterval = null;
    }
  }

  // Check if the image cache is stale due to trait changes or rule changes
  isCacheStale() {
    // Check if there's a global trait change timestamp
    if (window.traitChangeTimestamp && window.traitChangeTimestamp > this.traitChangeTimestamp) {
      console.log('Cache is stale due to trait changes');
      this.traitChangeTimestamp = window.traitChangeTimestamp;
      return true;
    }
    
    // Check if there's a global rule change timestamp
    if (window.ruleChangeTimestamp && window.ruleChangeTimestamp > this.ruleChangeTimestamp) {
      console.log('Cache is stale due to rule changes');
      this.ruleChangeTimestamp = window.ruleChangeTimestamp;
      return true;
    }
    
    // Check if rules have changed since last check
    if (this.haveRulesChanged()) {
      console.log('Cache is stale due to rule changes detected');
      this.updateLastKnownRules();
      return true;
    }
    
    return false;
  }

  // Notify that rules have been changed (call this when rules are added/modified/deleted)
  static notifyRuleChange() {
    window.ruleChangeTimestamp = Date.now();
    console.log('Rule change notified, timestamp:', window.ruleChangeTimestamp);
    
    // Clear the global image cache
    if (window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
      console.log('Cleared saved seeds image cache due to rule changes');
    }
    
    // Clear violations cache as rule changes affect violation detection
    if (window.SavedSeedsModal && window.SavedSeedsModal.instance) {
      window.SavedSeedsModal.instance.violationsCache.clear();
      window.SavedSeedsModal.instance.saveViolationsCache();
      console.log('Cleared violations cache due to rule changes');
    }
  }

  // Check if rules have changed since last known state
  haveRulesChanged() {
    try {
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData) {
        return false;
      }
      
      const currentRules = projectData.rules || [];
      
      // If we don't have a previous state, consider it changed
      if (!this.lastKnownRules) {
        return true;
      }
      
      // Compare rule counts
      if (currentRules.length !== this.lastKnownRules.length) {
        console.log('Rule count changed:', this.lastKnownRules.length, '->', currentRules.length);
        return true;
      }
      
      // Compare rule content (deep comparison)
      for (let i = 0; i < currentRules.length; i++) {
        const currentRule = currentRules[i];
        const lastRule = this.lastKnownRules[i];
        
        if (!this.rulesAreEqual(currentRule, lastRule)) {
          console.log('Rule content changed at index', i);
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('[DEBUG] Error checking rule changes:', error);
      return true; // If we can't check, assume changed to be safe
    }
  }

  // Compare two rules for equality
  rulesAreEqual(rule1, rule2) {
    if (!rule1 || !rule2) {
      return rule1 === rule2;
    }
    
    // Compare basic properties
    if (rule1.type !== rule2.type || rule1.id !== rule2.id) {
      return false;
    }
    
    // Compare rule-specific properties based on type
    switch (rule1.type) {
      case 'always-above':
      case 'always-below':
        return rule1.firstLayerId === rule2.firstLayerId;
        
      case 'immediately-above':
      case 'immediately-below':
        return rule1.firstLayerId === rule2.firstLayerId && 
               rule1.secondLayerId === rule2.secondLayerId;
               
      case 'never-combine':
      case 'always-combine':
        return this.traitArraysEqual(rule1.firstTraits, rule2.firstTraits) &&
               this.traitArraysEqual(rule1.secondTraits, rule2.secondTraits);
               
      default:
        // For other rule types, do a deep comparison
        return JSON.stringify(rule1) === JSON.stringify(rule2);
    }
  }

  // Compare two trait arrays for equality
  traitArraysEqual(arr1, arr2) {
    if (!arr1 || !arr2) {
      return arr1 === arr2;
    }
    
    if (arr1.length !== arr2.length) {
      return false;
    }
    
    // Sort both arrays by trait ID for comparison
    const sorted1 = [...arr1].sort((a, b) => a.id.localeCompare(b.id));
    const sorted2 = [...arr2].sort((a, b) => a.id.localeCompare(b.id));
    
    for (let i = 0; i < sorted1.length; i++) {
      if (sorted1[i].id !== sorted2[i].id) {
        return false;
      }
    }
    
    return true;
  }

  // Update the last known rules state
  updateLastKnownRules() {
    try {
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData && projectData.rules) {
        // Deep clone the rules for comparison
        this.lastKnownRules = JSON.parse(JSON.stringify(projectData.rules));
        console.log('[DEBUG] Updated last known rules:', this.lastKnownRules.length, 'rules');
      }
    } catch (error) {
      console.error('[DEBUG] Error updating last known rules:', error);
    }
  }

  // Utility function to check localStorage usage
  static getLocalStorageUsage() {
    let totalSize = 0;
    for (let key in localStorage) {
      if (localStorage.hasOwnProperty(key)) {
        totalSize += localStorage[key].length;
      }
    }
    return {
      used: totalSize,
      usedMB: (totalSize / 1024 / 1024).toFixed(2),
      available: 5 * 1024 * 1024 - totalSize, // Assume 5MB limit
      availableMB: ((5 * 1024 * 1024 - totalSize) / 1024 / 1024).toFixed(2)
    };
  }

  // Calculate rarity ranks for all seeds based on trait combination usage (async)
  async calculateRarityRanks(forceRecalculate = false) {
    // Prevent multiple simultaneous calculations
    if (this.rarityCalculationInProgress) {
      console.log('[DEBUG] Rarity calculation already in progress, skipping...');
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Rarity calculation already in progress...", "info", 2000);
      }
      return;
    }
    
    // Skip if already calculated for this session (unless force recalculate)
    if (!forceRecalculate && this.rarityCalculationComplete && Object.keys(this.rarityRanks).length > 0) {
      console.log('[DEBUG] Rarity ranks already calculated for this session, skipping...');
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Rarity ranks already calculated. Use 'Force Recalculate' to recalculate.", "info", 3000);
      }
      return;
    }
    
    console.log('===== STARTING RARITY CALCULATION =====');
    console.log('Calculating rarity ranks for', this.seedList.length, 'seeds');
    
    // Initialize cancellation flag
    this.rarityCalculationCancelled = false;
    this.rarityCalculationInProgress = true;
    
    // IMMEDIATELY clear all saved rarity ranks from memory as requested
    console.log('CLEARING all rarity ranks from memory immediately');
    this.rarityRanks = {};
    
    // Show loading popup
    this.showRarityCalculationPopup();
    
    if (this.seedList.length === 0) {
      this.rarityRanks = {};
      this.rarityCalculationInProgress = false;
      this.rarityCalculationComplete = true;
      return;
    }

    // Get project data to access trait layers
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    console.log('[DEBUG] Project data:', projectData);
    console.log('[DEBUG] Project traits:', projectData?.traits);
    
    if (!projectData || !projectData.traits) {
      console.log('[DEBUG] No project data available for rarity calculation');
      this.rarityRanks = {};
      this.rarityCalculationInProgress = false;
      this.rarityCalculationComplete = true;
      return;
    }

    // Clear old rarity ranks from project data before calculating new ones
    if (projectData.rarityRanks) {
      console.log('[DEBUG] Clearing old rarity ranks from project data (had', Object.keys(projectData.rarityRanks).length, 'ranks)');
      projectData.rarityRanks = {};
    }

    // NEW APPROACH: Calculate rarity based on individual trait frequencies (rarity scores)
    // This provides meaningful rankings even when all NFTs have unique trait combinations
    
    console.log('Calculating trait-based rarity scores...');
    
    // Step 1: Count frequency of each individual trait across all NFTs
    const traitFrequencies = new Map(); // Map of "layerName:traitName" -> count
    const seedToTraits = new Map(); // Store trait data for each seed
    
    // OPTIMIZATION: Use larger batches and less frequent yields for better performance
    const batchSize = 100; // Process 100 NFTs per batch (increased from 10)
    let processedCount = 0;
    let generatedCount = 0; // Track how many we actually had to generate
    
    for (let i = 0; i < this.seedList.length; i += batchSize) {
      // Check for cancellation
      if (this.rarityCalculationCancelled) {
        console.log('[DEBUG] Rarity calculation cancelled by user');
        this.rarityCalculationInProgress = false;
        this.hideRarityCalculationPopup();
        return;
      }
      
      const batch = this.seedList.slice(i, i + batchSize);
      
      for (const seedObj of batch) {
        // Check for cancellation
        if (this.rarityCalculationCancelled) {
          console.log('[DEBUG] Rarity calculation cancelled by user');
          this.rarityCalculationInProgress = false;
          this.hideRarityCalculationPopup();
          return;
        }
        
        try {
          // Update progress (less frequently for performance)
          processedCount++;
          if (processedCount % 50 === 0 || processedCount === this.seedList.length) {
            this.updateRarityCalculationPopup(processedCount, this.seedList.length, `Analyzing traits...`);
          }
          
          let traits = null;
          
          // OPTIMIZATION: Check if traits are already stored in seedObj (much faster!)
          if (seedObj.traits && Array.isArray(seedObj.traits) && seedObj.traits.length > 0) {
            // Use existing traits - no need to generate!
            traits = seedObj.traits;
          } else {
            // Only generate if traits are missing
            generatedCount++;
            const nft = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, seedObj.seed);
            if (nft && nft.traits) {
              traits = nft.traits;
            }
          }
          
          if (traits) {
            seedToTraits.set(seedObj.seed, traits);
            
            // Count each individual trait
            for (const trait of traits) {
              if (trait && trait.layer && trait.trait) {
                const traitKey = `${trait.layer.name}:${trait.trait.name}`;
                traitFrequencies.set(traitKey, (traitFrequencies.get(traitKey) || 0) + 1);
              }
            }
          }
        } catch (error) {
          console.error('[DEBUG] Error processing seed', seedObj.seed.substring(0, 20), ':', error.message);
        }
      }
      
      // Yield control to browser less frequently (only every 100 NFTs)
      // Uses MessageChannel for background tabs which is less throttled
      if (typeof yieldToBrowser === 'function') {
        await yieldToBrowser();
      } else {
        // Fallback if utility function not available
        await new Promise(resolve => {
          if (!document.hidden) {
            requestAnimationFrame(() => setTimeout(resolve, 0));
          } else {
            const channel = new MessageChannel();
            channel.port1.onmessage = () => {
              channel.port1.close();
              channel.port2.close();
              resolve();
            };
            channel.port2.postMessage(null);
          }
        });
      }
    }
    
    console.log('[DEBUG] Trait analysis complete. Generated:', generatedCount, '/ Used cached:', (processedCount - generatedCount));
    console.log('[DEBUG] Found', traitFrequencies.size, 'unique traits across', this.seedList.length, 'NFTs');

    // Step 2: Calculate rarity score for each NFT (fast - all in memory)
    // Rarity score = sum of (1 / frequency) for each trait
    // Lower score = more common traits = higher rank number
    // Higher score = rarer traits = lower rank number (rank 1 is rarest)
    
    this.updateRarityCalculationPopup(this.seedList.length, this.seedList.length, 'Calculating scores...');
    
    const seedToRarityScore = new Map();
    
    for (const [seed, traits] of seedToTraits.entries()) {
      let rarityScore = 0;
      
      for (const trait of traits) {
        if (trait && trait.layer && trait.trait) {
          const traitKey = `${trait.layer.name}:${trait.trait.name}`;
          const frequency = traitFrequencies.get(traitKey) || 1;
          // Each trait contributes (1 / frequency) to the score
          // Rarer traits (low frequency) contribute more to the score
          rarityScore += (1 / frequency);
        }
      }
      
      seedToRarityScore.set(seed, rarityScore);
    }

    console.log('[DEBUG] Rarity scores calculated for', seedToRarityScore.size, 'NFTs');
    
    // Step 3: Sort NFTs by rarity score (descending = rarest first)
    this.updateRarityCalculationPopup(this.seedList.length, this.seedList.length, 'Ranking NFTs...');
    
    const sortedSeeds = Array.from(seedToRarityScore.entries())
      .sort((a, b) => b[1] - a[1]); // Higher score = rarer = rank 1

    // Step 4: Assign ranks
    this.rarityRanks = {};
    let currentRank = 1;
    let prevScore = null;
    let sameRankCount = 0;
    
    for (let i = 0; i < sortedSeeds.length; i++) {
      const [seed, score] = sortedSeeds[i];
      
      // Handle ties: NFTs with identical scores get the same rank
      if (prevScore !== null && Math.abs(score - prevScore) < 0.000001) {
        // Same score as previous, same rank
        sameRankCount++;
      } else {
        // Different score, new rank (skip ranks if there were ties)
        currentRank += sameRankCount;
        sameRankCount = 1;
      }
      
      this.rarityRanks[seed] = currentRank;
      prevScore = score;
    }

    console.log('[DEBUG] Rarity ranks assigned for', Object.keys(this.rarityRanks).length, 'NFTs');
    console.log('[DEBUG] Top 5 rarest: Ranks', sortedSeeds.slice(0, 5).map((_, i) => i + 1).join(', '));
    
    // Mark calculation as complete
    this.rarityCalculationInProgress = false;
    this.rarityCalculationComplete = true;
    
    // Save rarity ranks to localStorage
    this.saveRarityRanks();
    
    // Update rarity status to "Updated"
    this.updateRarityStatus('updated');
    // Immediately refresh visible card displays to show ranks (remove '---')
    if (this.modal && this.rarityRankEnabled) {
      this.refreshRarityDisplayOnAllCards();
    }
    
    // Hide popup and show completion
    this.hideRarityCalculationPopup();
    
    // Show completion notification
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
      window.NFTApp.getModule("notificationService").show(`Rarity ranks calculated successfully! Processed ${Object.keys(this.rarityRanks).length} NFTs.`, "success", 4000);
    }
  }

  // Create a unique key for a trait combination
  createTraitCombinationKey(traits) {
    if (!Array.isArray(traits)) {
      console.warn('[DEBUG] createTraitCombinationKey: traits is not an array:', traits);
      return 'invalid_traits';
    }
    
    return traits
      .filter(trait => trait && typeof trait === 'object' && trait.layer && trait.trait)
      .sort((a, b) => {
        // Sort by layer order instead of name to maintain consistent ordering
        const orderA = (a.layer && a.layer.order) ? a.layer.order : (a.sortIndex || 0);
        const orderB = (b.layer && b.layer.order) ? b.layer.order : (b.sortIndex || 0);
        return orderA - orderB;
      })
      .map(trait => {
        const layerName = (trait.layer && trait.layer.name) ? trait.layer.name : 'unknown';
        const traitName = (trait.trait && trait.trait.name) ? trait.trait.name : 'unknown';
        return `${layerName}:${traitName}`;
      })
      .join('|');
  }

  // Get rarity rank for a specific seed
  getRarityRank(seed) {
    console.log('[DEBUG] getRarityRank called for seed:', seed);
    
    // First try to get from local calculation
    if (this.rarityRanks[seed]) {
      console.log('[DEBUG] Found rarity rank in local calculation:', this.rarityRanks[seed]);
      return this.rarityRanks[seed];
    }
    
    // Try to get from project's saved rarity ranks
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    console.log('[DEBUG] Project data:', projectData?.name, 'has rarityRanks:', !!projectData?.rarityRanks);
    
    if (projectData && projectData.rarityRanks) {
      // Check if rarityRanks is an object with seed strings as keys (preferred format)
      if (typeof projectData.rarityRanks === 'object' && !Array.isArray(projectData.rarityRanks)) {
        console.log('[DEBUG] Project rarityRanks is an object, checking for seed:', seed);
        if (projectData.rarityRanks[seed] !== undefined && projectData.rarityRanks[seed] !== null) {
          console.log('[DEBUG] Found rarity rank in project data:', projectData.rarityRanks[seed]);
          return projectData.rarityRanks[seed];
        }
      } else {
        // Legacy array format - CRITICAL: Try seed-based lookup first if array has seed info
        // Check if array format is actually [[seed, rank], [seed, rank], ...]
        if (Array.isArray(projectData.rarityRanks) && projectData.rarityRanks.length > 0 && Array.isArray(projectData.rarityRanks[0])) {
          // Array of arrays format - find by seed
          for (const [arraySeed, rank] of projectData.rarityRanks) {
            if (arraySeed === seed && rank !== undefined && rank !== null) {
              console.log('[DEBUG] Found rarity rank in project data array format:', rank);
              return rank;
            }
          }
        }
        
        // Fallback to index-based lookup (may break after deletions, but try anyway)
        const seedIndex = this.seedList.findIndex(s => s.seed === seed);
        console.log('[DEBUG] Seed index in list:', seedIndex, 'rarity rank at index:', projectData.rarityRanks[seedIndex]);
        console.log('[DEBUG] Rarity ranks array length:', projectData.rarityRanks.length, 'seed list length:', this.seedList.length);
        
        if (seedIndex !== -1 && seedIndex < projectData.rarityRanks.length && projectData.rarityRanks[seedIndex] !== undefined && projectData.rarityRanks[seedIndex] !== null) {
          console.log('[DEBUG] Found rarity rank in project data (index-based):', projectData.rarityRanks[seedIndex]);
          return projectData.rarityRanks[seedIndex];
        } else if (seedIndex !== -1) {
          console.log('[DEBUG] Seed index', seedIndex, 'exists but rarity rank is undefined/null or out of bounds');
          console.log('[DEBUG] Available rarity ranks at nearby indices:');
          for (let i = Math.max(0, seedIndex - 2); i <= Math.min(projectData.rarityRanks.length - 1, seedIndex + 2); i++) {
            console.log('[DEBUG]   Index', i, ':', projectData.rarityRanks[i]);
          }
        }
      }
    }
    
    // Try to get from localStorage - check all rarity rank keys
    const allKeys = Object.keys(localStorage);
    const rarityRankKeys = allKeys.filter(key => key.startsWith('rarityRanks_'));
    console.log('[DEBUG] Checking localStorage keys:', rarityRankKeys);
    
    for (const rarityKey of rarityRankKeys) {
      const storedRarityRanks = localStorage.getItem(rarityKey);
      console.log('[DEBUG] Checking localStorage key:', rarityKey, 'found:', !!storedRarityRanks);
      
      if (storedRarityRanks) {
        try {
          let rarityRanks;
          try {
            rarityRanks = JSON.parse(storedRarityRanks);
          } catch (parseError) {
            console.error('[DEBUG] Error parsing rarity ranks:', parseError);
            return null;
          }
          
          // Check if rarityRanks is an object with seed strings as keys (preferred format)
          if (typeof rarityRanks === 'object' && !Array.isArray(rarityRanks)) {
            console.log('[DEBUG] localStorage rarityRanks is an object, checking for seed:', seed);
            if (rarityRanks[seed] !== undefined && rarityRanks[seed] !== null) {
              console.log('[DEBUG] Found rarity rank in localStorage:', rarityRanks[seed]);
              return rarityRanks[seed];
            }
          } else if (Array.isArray(rarityRanks)) {
            // Handle array format - could be [rank, rank, ...] or [[seed, rank], [seed, rank], ...]
            console.log('[DEBUG] localStorage rarityRanks is an array, checking format...');
            
            if (rarityRanks.length > 0 && Array.isArray(rarityRanks[0])) {
              // Format: [[seed, rank], [seed, rank], ...] - CRITICAL: find by seed, not index
              console.log('[DEBUG] Array format: [[seed, rank], [seed, rank], ...]');
              for (const [arraySeed, rank] of rarityRanks) {
                if (arraySeed === seed && rank !== undefined && rank !== null) {
                  console.log('[DEBUG] Found rarity rank in localStorage array format:', rank);
                  return rank;
                }
              }
            } else {
              // Format: [rank, rank, ...] - find by seed index (may break after deletions)
              console.log('[DEBUG] Array format: [rank, rank, ...]');
              const seedIndex = this.seedList.findIndex(s => s.seed === seed);
              console.log('[DEBUG] Seed index in localStorage list:', seedIndex, 'rarity rank at index:', rarityRanks[seedIndex]);
              console.log('[DEBUG] localStorage rarity ranks length:', rarityRanks.length, 'seed list length:', this.seedList.length);
              
              if (seedIndex !== -1 && seedIndex < rarityRanks.length && rarityRanks[seedIndex] !== undefined && rarityRanks[seedIndex] !== null) {
                console.log('[DEBUG] Found rarity rank in localStorage (index-based):', rarityRanks[seedIndex]);
                return rarityRanks[seedIndex];
              }
            }
          }
        } catch (e) {
          console.warn('Error parsing stored rarity ranks from key', rarityKey, ':', e);
        }
      }
    }
    
    console.log('[DEBUG] No rarity rank found for seed:', seed);
    return null;
  }

  // Show loading popup for rarity calculation
  showRarityCalculationPopup() {
    // Remove any existing popup
    this.hideRarityCalculationPopup();
    
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'rarity-calculation-popup scan-progress-popup';
    popup.id = 'rarity-calculation-popup';
    popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c3e50; padding: 30px 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 10002; min-width: 400px; text-align: center;';
    popup.innerHTML = `
      <div class="scan-title-container" style="text-align: center; margin-bottom: 20px;">
        <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Calculating Rarity Ranks</div>
        <div class="scan-subtitle" style="font-size: 14px; color: #ffffff; text-align: right; display: inline-block; width: auto;">(Analyzing trait combinations)</div>
        </div>
      <div class="scan-percentage" id="rarity-percentage" style="font-size: 24px; font-weight: 700; color: #3498db; margin-bottom: 10px;">
        0%<span class="scan-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
        </div>
      <div class="scan-progress-info" style="font-size: 14px; color: #ffffff; margin-bottom: 10px;">
        Processing: <span id="rarity-processed">0</span> / <span id="rarity-total">${this.seedList.length}</span>
      </div>
      <div class="scan-eta" id="rarity-eta" style="font-size: 13px; color: #ffffff; margin-bottom: 15px; min-height: 20px;">
        Calculating time remaining...
      </div>
      <button class="scan-cancel-btn" id="cancel-rarity-calculation">Cancel</button>
    `;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Make popup draggable
    let isDraggingCalc = false;
    let currentXCalc;
    let currentYCalc;
    let initialXCalc;
    let initialYCalc;
    let xOffsetCalc = 0;
    let yOffsetCalc = 0;
    
    const dragAreaCalc = popup.querySelector('.scan-title-container');
    if (dragAreaCalc) {
      dragAreaCalc.style.cursor = 'move';
      dragAreaCalc.style.userSelect = 'none';
      
      dragAreaCalc.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDraggingCalc = true;
        initialXCalc = e.clientX - xOffsetCalc;
        initialYCalc = e.clientY - yOffsetCalc;
        popup.style.cursor = 'grabbing';
      });
    }
    
    const dragMouseMoveCalc = (e) => {
      if (isDraggingCalc) {
        e.preventDefault();
        currentXCalc = e.clientX - initialXCalc;
        currentYCalc = e.clientY - initialYCalc;
        xOffsetCalc = currentXCalc;
        yOffsetCalc = currentYCalc;
        
        popup.style.transform = `translate(${currentXCalc}px, ${currentYCalc}px)`;
      }
    };
    
    const dragMouseUpCalc = () => {
      if (isDraggingCalc) {
        isDraggingCalc = false;
        popup.style.cursor = 'move';
      }
    };
    
    document.addEventListener('mousemove', dragMouseMoveCalc);
    document.addEventListener('mouseup', dragMouseUpCalc);
    
    // Store cleanup function
    popup._cleanupDrag = () => {
      document.removeEventListener('mousemove', dragMouseMoveCalc);
      document.removeEventListener('mouseup', dragMouseUpCalc);
    };
    
    // Track timing for ETA calculation
    this.rarityStartTime = Date.now();
    this.rarityLastPercentageMilestone = 0;
    
    // Add event listener for cancel button
    popup.querySelector('#cancel-rarity-calculation').onclick = () => {
      this.cancelRarityCalculation();
    };
  }

  // Hide loading popup for rarity calculation
  hideRarityCalculationPopup() {
    const popup = document.getElementById('rarity-calculation-popup');
    if (popup) {
      popup.remove();
    }
  }

  // Update rarity calculation popup
  updateRarityCalculationPopup(processed, total, details = '') {
    const popup = document.getElementById('rarity-calculation-popup');
    if (popup) {
      const percentageEl = popup.querySelector('#rarity-percentage');
      const processedEl = popup.querySelector('#rarity-processed');
      const etaEl = popup.querySelector('#rarity-eta');
      
      // Update percentage
      if (percentageEl) {
        const percentage = Math.floor((processed / total) * 100);
        const dotsHTML = percentageEl.querySelector('.scan-dots');
        if (dotsHTML && percentageEl.childNodes[0]) {
          percentageEl.childNodes[0].textContent = `${percentage}%`;
        } else {
          percentageEl.textContent = `${percentage}%`;
        }
      }
      
      // Update processed count
      if (processedEl) {
        processedEl.textContent = processed;
      }
      
      // Calculate and display ETA at 1%, then 5%, then every 5% increment
      if (etaEl) {
        const currentPercentage = Math.floor((processed / total) * 100);
        const currentMilestone = Math.floor(currentPercentage / 5) * 5;
        
        // Update ETA when we reach 1%, 5%, or any new 5% milestone
        const shouldUpdateETA = (currentPercentage >= 1 && this.rarityLastPercentageMilestone === 0) || 
                                (currentMilestone >= 5 && currentMilestone > this.rarityLastPercentageMilestone);
        
        if (shouldUpdateETA && processed < total) {
          this.rarityLastPercentageMilestone = currentMilestone > 0 ? currentMilestone : 1;
          
          const elapsedMs = Date.now() - this.rarityStartTime;
          const avgTimePerNFT = elapsedMs / processed;
          const remainingNFTs = total - processed;
          const estimatedRemainingMs = avgTimePerNFT * remainingNFTs;
          
          // Format time remaining (hours and minutes only)
          const totalMinutes = Math.ceil(estimatedRemainingMs / 60000);
          let timeText;
          if (totalMinutes < 60) {
            timeText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
          } else {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if (minutes > 0) {
              timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
              timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
            }
          }
          
          etaEl.textContent = `Estimated time remaining: ${timeText}`;
          console.log(`[DEBUG] Rarity ETA updated at ${currentPercentage}%: ${timeText}`);
        } else if (processed >= total) {
          etaEl.textContent = 'Completing...';
        }
      }
    }
  }

  // Cancel rarity calculation
  cancelRarityCalculation() {
    console.log('[DEBUG] Rarity calculation cancelled by user');
    this.rarityCalculationCancelled = true;
    this.rarityCalculationInProgress = false;
    this.hideRarityCalculationPopup();
    
    // Show cancellation notification
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
      window.NFTApp.getModule("notificationService").show("Rarity calculation cancelled", "info", 2000);
    }
  }

  // Test method to manually trigger rarity calculation
  async testRarityCalculation() {
    console.log('[DEBUG] ===== MANUAL RARITY CALCULATION TEST =====');
    console.log('[DEBUG] Current seed list length:', this.seedList.length);
    console.log('[DEBUG] Current rarity ranks:', this.rarityRanks);
    
    // Reset flags to force calculation
    this.rarityCalculationInProgress = false;
    this.rarityCalculationComplete = false;
    this.rarityRanks = {};
    
    // Also clear project data rarity ranks to ensure complete cleanup
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (projectData) {
      projectData.rarityRanks = {};
      console.log('[DEBUG] Cleared old rarity ranks from project data before recalculation');
    }
    
    await this.calculateRarityRanks();
    
    console.log('[DEBUG] After calculation - rarity ranks:', this.rarityRanks);
    console.log('[DEBUG] Calculation complete:', this.rarityCalculationComplete);
    
    // Re-render to show results
    this.renderPage(this.currentPage);
  }

  // Test method to force show rarity ranks on all cards
  testForceShowRarityRanks() {
    console.log('[DEBUG] ===== FORCE SHOWING RARITY RANKS TEST =====');
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.error('[DEBUG] No grid found!');
      return;
    }

    const cards = grid.querySelectorAll('.saved-seed-card');
    console.log('[DEBUG] Found', cards.length, 'cards to force show rarity ranks');
    
    cards.forEach((card, index) => {
      const seed = card.dataset.seed;
      const thumbnail = card.querySelector('.seed-card-thumbnail');
      
      if (thumbnail) {
        // Remove existing rarity element
        const existingRarity = thumbnail.querySelector('.seed-card-rarity');
        if (existingRarity) {
          existingRarity.remove();
        }
        
        // Force add rarity element with test rank and highly visible style
        const testRank = index + 1;
        const rarityDisplay = `<div class="seed-card-rarity" style="position: absolute !important; top: 4px !important; left: 4px !important; background: red !important; color: yellow !important; font-size: 14px !important; font-weight: bold !important; padding: 5px !important; border: 3px solid yellow !important; z-index: 9999 !important;">TEST RARITY: ${testRank}</div>`;
        thumbnail.insertAdjacentHTML('beforeend', rarityDisplay);
        console.log('[DEBUG] Force added highly visible rarity rank for card', index, 'rank:', testRank);
        
        // Verify it was added
        const addedRarity = thumbnail.querySelector('.seed-card-rarity');
        if (addedRarity) {
          console.log('[DEBUG] Rarity element verified:', addedRarity.outerHTML);
          console.log('[DEBUG] Computed styles:', window.getComputedStyle(addedRarity));
          console.log('[DEBUG] Element position:', addedRarity.offsetTop, 'x', addedRarity.offsetLeft);
          console.log('[DEBUG] Element dimensions:', addedRarity.offsetWidth, 'x', addedRarity.offsetHeight);
          console.log('[DEBUG] Element visibility:', addedRarity.style.display, addedRarity.style.visibility, addedRarity.style.opacity);
        } else {
          console.error('[DEBUG] Rarity element verification failed!');
        }
      }
    });
  }

  // Test method to check if rarity elements exist but are hidden
  testCheckRarityVisibility() {
    console.log('[DEBUG] ===== CHECKING RARITY ELEMENT VISIBILITY =====');
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.error('[DEBUG] No grid found!');
      return;
    }

    const cards = grid.querySelectorAll('.saved-seed-card');
    console.log('[DEBUG] Found', cards.length, 'cards to check');
    
    cards.forEach((card, index) => {
      const thumbnail = card.querySelector('.seed-card-thumbnail');
      const rarityElement = thumbnail.querySelector('.seed-card-rarity');
      
      console.log(`[DEBUG] Card ${index}:`);
      console.log('  - Thumbnail exists:', !!thumbnail);
      console.log('  - Rarity element exists:', !!rarityElement);
      
      if (rarityElement) {
        const computedStyle = window.getComputedStyle(rarityElement);
        console.log('  - Rarity element HTML:', rarityElement.outerHTML);
        console.log('  - Position:', computedStyle.position);
        console.log('  - Top:', computedStyle.top);
        console.log('  - Left:', computedStyle.left);
        console.log('  - Z-index:', computedStyle.zIndex);
        console.log('  - Display:', computedStyle.display);
        console.log('  - Visibility:', computedStyle.visibility);
        console.log('  - Opacity:', computedStyle.opacity);
        console.log('  - Background:', computedStyle.backgroundColor);
        console.log('  - Color:', computedStyle.color);
        console.log('  - Font-size:', computedStyle.fontSize);
        console.log('  - Offset dimensions:', rarityElement.offsetWidth, 'x', rarityElement.offsetHeight);
        console.log('  - Offset position:', rarityElement.offsetTop, 'x', rarityElement.offsetLeft);
      }
    });
  }

  // Utility function to optimize seed list for storage
  static optimizeSeedListForStorage(seedList, includeImageData = true) {
    if (!includeImageData) {
      return seedList.map(seed => ({
        seed: seed.seed,
        timestamp: seed.timestamp
      }));
    }
    return seedList;
  }

  getSeedListKey() {
    // Get the current project data to determine the correct key
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject || null;
    const key = 'nftSeedList_' + (projectData && projectData.name ? encodeURIComponent(projectData.name) : 'default');
    // console.log('[DEBUG] Generated seed list key:', key, 'for project:', projectData?.name || 'unknown');
    return key;
  }

  // Check if modal data needs refresh by comparing with localStorage
  needsDataRefresh() {
    try {
      const stored = localStorage.getItem(this.seedListKey);
      let storedSeeds = [];
      if (stored) {
        try {
          storedSeeds = JSON.parse(stored);
        } catch (parseError) {
          console.error('[DEBUG] Error parsing seed list for refresh check:', parseError);
          localStorage.removeItem(this.seedListKey);
          storedSeeds = [];
        }
      }
      
      console.log('[DEBUG] Checking data refresh - current length:', this.seedList.length, 'stored length:', storedSeeds.length);
      
      // Always refresh if we have no data
      if (this.seedList.length === 0 && storedSeeds.length > 0) {
        console.log('[DEBUG] No current data but stored data exists - refresh needed');
        return true;
      }
      
      // Compare lengths
      if (this.seedList.length !== storedSeeds.length) {
        console.log('[DEBUG] Seed list length changed:', this.seedList.length, '->', storedSeeds.length);
        return true;
      }
      
      // Compare all seeds (not just first few)
      for (let i = 0; i < this.seedList.length; i++) {
        if (this.seedList[i] && storedSeeds[i] && 
            this.seedList[i].seed && storedSeeds[i].seed && 
            this.seedList[i].seed !== storedSeeds[i].seed) {
          console.log('[DEBUG] Seed at index', i, 'changed:', this.seedList[i].seed, '->', storedSeeds[i].seed);
          return true;
        }
      }
      
      console.log('[DEBUG] No data changes detected');
      return false;
    } catch (error) {
      console.error('[DEBUG] Error checking if data needs refresh:', error);
      return true; // If we can't check, assume it needs refresh
    }
  }

  // Filter NFTs to show only those with rule violations
  async filterViolations() {
    if (this.isInConflictView) {
      // If in conflict view, restore original view
      this.restoreOriginalView();
      return;
    }
    
    // Clear any previous filtered results
    this.filteredSeedList = [];
    this.isInConflictView = true;
    this.currentPage = 1;
    
    console.log('[DEBUG] Starting rule violations scan from filter button...');
    
    // Start the scan and fix process
    await this.switchToConflictView();
    
    console.log('[DEBUG] Rule violations scan complete');
  }
  
  // Clear filter results and return to normal view
  clearFilterResults() {
    this.filteredSeedList = [];
    this.isFilteringViolations = false;
    this.isCancelled = false;
    this.currentPage = 1;
    
    // Clear empty positions when clearing filters
    this.emptyPositions.clear();
    console.log('[DEBUG] Cleared empty positions when clearing filters');
    
    // Hide Delete All button and show Rule Violations NFTs button
    this.hideDeleteAllButton();
    const filterBtn = this.modal.querySelector('#filter-violations');
    if (filterBtn) {
      filterBtn.classList.remove('hidden');
      console.log('[DEBUG] Filter violations button shown in clearFilterResults');
    }
    
    this.renderPage(1);
    this.updateFilterButtons();
  }

  // Show progress popup window
  showProgressPopup() {
    // Remove any existing popup
    this.hideProgressPopup();
    
    // Create popup element
    const popup = document.createElement('div');
    popup.className = 'violation-progress-popup';
    popup.id = 'violation-progress-popup';
    popup.innerHTML = `
      <div class="progress-title">Searching for Rule Violations</div>
      <div class="progress-text">Checked: 0 / ${this.formatNumberWithCommas(this.seedList.length)}</div>
      <div class="progress-count">Found: 0 NFTs with violations</div>
      <div class="progress-bar">
        <div class="progress-bar-fill" style="width: 0%"></div>
      </div>
      <button class="violation-cancel-btn" id="cancel-violation-search-popup">Cancel Search</button>
    `;
    
    // Add to document
    document.body.appendChild(popup);
    
    // Add event listener for cancel button
    popup.querySelector('#cancel-violation-search-popup').onclick = () => {
      this.cancelViolationSearch();
    };
  }
  
  // Hide progress popup window
  hideProgressPopup() {
    const popup = document.getElementById('violation-progress-popup');
    if (popup) {
      popup.remove();
    }
  }
  
  // Update progress popup window
  updateProgressPopup(checked, found) {
    const popup = document.getElementById('violation-progress-popup');
    if (popup) {
      const progressText = popup.querySelector('.progress-text');
      const progressCount = popup.querySelector('.progress-count');
      const progressBarFill = popup.querySelector('.progress-bar-fill');
      
      if (progressText) {
        progressText.textContent = `Checked: ${this.formatNumberWithCommas(checked)} / ${this.formatNumberWithCommas(this.seedList.length)}`;
      }
      
      if (progressCount) {
        progressCount.textContent = `Found: ${this.formatNumberWithCommas(found)} NFTs with violations`;
      }
      
      if (progressBarFill) {
        const percentage = (checked / this.seedList.length) * 100;
        progressBarFill.style.width = `${percentage}%`;
      }
    }
  }
  
  // Cancel violation search
  cancelViolationSearch() {
    console.log('[DEBUG] Canceling violation search...');
    
    // Set cancellation flag
    this.isCancelled = true;
    
    // Hide progress popup
    this.hideProgressPopup();
    
    // Reset filter state but preserve cancellation flag
    this.resetFilterStateCancelled();
    
    // Show cancellation message
    if (window.NFTApp.getModule('notificationService')) {
      window.NFTApp.getModule('notificationService').show(
        'Violation search cancelled.',
        'info',
        3000
      );
    }
  }
  
  // Start the violation search process
  async startViolationSearch() {
    let checkedCount = 0;
    let foundCount = 0;
    
    // Process NFTs one by one for immediate display
    for (let i = 0; i < this.seedList.length; i++) {
      // Check if cancelled
      if (this.isCancelled) {
        console.log('[DEBUG] Violation search cancelled during processing');
        this.resetFilterStateCancelled();
        return;
      }
      
      const seedObj = this.seedList[i];
      const seed = seedObj.seed;
      
      if (seed) {
        checkedCount++;
        
        // Update progress popup
        this.updateProgressPopup(checkedCount, foundCount);
        
        // Check cache first
        if (this.violationsCache.has(seed)) {
          const hasViolations = this.violationsCache.get(seed);
          if (hasViolations) {
            foundCount++;
            this.addViolationToList({ ...seedObj, originalIndex: i });
          }
        } else {
          // Check for violations
          const hasViolations = await this.checkSeedForRuleViolations(seed);
          this.violationsCache.set(seed, hasViolations);
          this.saveViolationsCache();
          
          if (hasViolations) {
            foundCount++;
            this.addViolationToList({ ...seedObj, originalIndex: i });
          }
        }
        
        // Small delay to keep UI responsive
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
    
    // Search completed
    if (!this.isCancelled) {
      this.showSearchComplete(foundCount);
    }
  }
  
  // Add a violation to the list and update display
  addViolationToList(violationObj) {
    this.filteredSeedList.push(violationObj);
    
    // Use the original index from the violation object to maintain correct NFT position
    const originalIndex = violationObj.originalIndex || (this.filteredSeedList.length - 1);
    
    // Create and add the NFT card immediately
    const card = this.createNFTCard(violationObj, originalIndex);
    
    // Immediately add violation overlay to the card
    this.addViolationOverlayToCard(card);
    
    const grid = this.modal?.querySelector('#saved-seeds-grid');
    if (grid) {
      // If this is the first violation, clear the grid and show violations
      if (this.filteredSeedList.length === 1) {
        grid.innerHTML = '';
      }
      
      // Add the card to the grid
      grid.appendChild(card);
      
      // Show Delete All button when first violation is found
      if (this.filteredSeedList.length === 1) {
        this.showDeleteAllButton();
      }
    }
  }
  
  // Show Delete All button when violations are found
  showDeleteAllButton() {
    const deleteBtn = this.modal?.querySelector('#delete-all-violations');
    if (deleteBtn) {
      deleteBtn.classList.add('visible');
      deleteBtn.disabled = false;
      deleteBtn.classList.remove('disabled');
    }
  }
  
  // Hide Delete All button
  hideDeleteAllButton() {
    const deleteBtn = this.modal?.querySelector('#delete-all-violations');
    if (deleteBtn) {
      deleteBtn.classList.remove('visible');
      deleteBtn.disabled = true;
      deleteBtn.classList.add('disabled');
    }
  }
  
  // Update search progress
  updateSearchProgress(checked, found) {
    const progressElement = this.modal?.querySelector('.violation-search-progress');
    const countElement = this.modal?.querySelector('.violation-search-count');
    
    if (progressElement) {
      progressElement.textContent = `Checked: ${this.formatNumberWithCommas(checked)} / ${this.formatNumberWithCommas(this.seedList.length)}`;
    }
    
    if (countElement) {
      countElement.textContent = `Found: ${this.formatNumberWithCommas(found)} NFTs with violations`;
    }
  }
  
  // Update violation count in the UI
  updateViolationCount() {
    const countElement = this.modal?.querySelector('.violation-search-count');
    if (countElement) {
      countElement.textContent = `Found: ${this.filteredSeedList.length} NFTs with violations`;
    }
  }
  
  // Show search complete message
  showSearchComplete(foundCount) {
    // Hide progress popup
    this.hideProgressPopup();
    
    // Update button states after search completion
    this.updateFilterButtons();
    
    // If no violations found, show message in grid
    if (foundCount === 0) {
      const grid = this.modal?.querySelector('#saved-seeds-grid');
      if (grid) {
        grid.innerHTML = '<div class="no-seeds">No NFTs with rule violations found.</div>';
      }
    }
  }
  
  // Cancel the filtering process
  cancelFiltering() {
    this.isCancelled = true;
    this.resetFilterState();
  }
  
  // Reset filter state
  resetFilterState() {
    this.isFilteringViolations = false;
    this.isCancelled = false;
    // Don't clear filteredSeedList - keep violations found so far
    this.currentPage = 1;
    
    // Hide progress popup
    this.hideProgressPopup();
    
    this.renderPage(1);
    this.updateFilterButtons();
  }
  
  // Reset filter state when cancelled (preserves cancellation flag)
  resetFilterStateCancelled() {
    this.isFilteringViolations = false;
    // Don't reset isCancelled - keep it true
    // Don't clear filteredSeedList - keep violations found so far
    this.currentPage = 1;
    
    this.renderPage(1);
    this.updateFilterButtons();
  }
  
  // Update filter button states
  updateFilterButtons() {
    const filterBtn = this.modal.querySelector('#filter-violations');
    const deleteBtn = this.modal.querySelector('#delete-all-violations');
    const clearSearchBtn = this.modal.querySelector('#clear-search-btn');
    
    if (filterBtn && deleteBtn) {
      if (this.isInConflictView) {
        // In conflict view, show appropriate buttons
        filterBtn.textContent = 'Show All NFTs';
        filterBtn.classList.add('active');
        // Show Delete All if conflicts were found
        if (this.filteredSeedList.length > 0) {
          this.showDeleteAllButton();
        } else {
          this.hideDeleteAllButton();
        }
      } else if (this.isFilteringViolations) {
        filterBtn.textContent = 'Cancel Search';
        filterBtn.classList.add('active');
        // Keep Delete All hidden during search
        this.hideDeleteAllButton();
      } else {
        // Only show violation-related buttons if we're filtering violations, not rarity, position, or traits
        if (this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait) {
          // During rarity, position, or trait filtering, keep violation buttons in their default state
          filterBtn.textContent = 'Rule Violations NFTs';
          filterBtn.classList.remove('active');
          this.hideDeleteAllButton();
        } else {
          // Check if we have filtered results from a previous violation search
          if (this.filteredSeedList.length > 0) {
            filterBtn.textContent = 'Clear Filter';
            filterBtn.classList.remove('active');
            
            // Show Delete All if violations were found
            this.showDeleteAllButton();
          } else {
            filterBtn.textContent = 'Rule Violations NFTs';
            filterBtn.classList.remove('active');
            
            // Hide Delete All if no violations
            this.hideDeleteAllButton();
          }
        }
      }
    }

    // Update clear search button state
    this.updateClearSearchButton();
  }
  
  // Delete all NFTs with rule violations
  async deleteAllViolations() {
    if (this.filteredSeedList.length === 0) {
      return;
    }
    
    // Use the app's styled confirmation modal instead of browser confirm
    if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
      const count = this.filteredSeedList.length;
      const modalTitle = "Delete All NFTs with Rule Violations";
      const modalMessage = `<div style="margin-top: 12px;">Are you sure you want to delete all <strong>${count}</strong> NFT${count > 1 ? 's' : ''} with rule violations?</div>`;
      const modalDescription = `
        <div style="text-align: left; margin-top: 16px; line-height: 1.6;">
          <div style="color: #e74c3c; margin-bottom: 12px;"><strong>⚠️ This action cannot be undone</strong></div>
          <div style="color: #95a5a6; margin-bottom: 8px;">This will permanently remove these NFTs from your collection:</div>
          <div style="margin-left: 10px; margin-top: 8px; color: #bdc3c7;">
            <div style="margin-bottom: 4px;">❌ All NFT data will be deleted</div>
            <div style="margin-bottom: 4px;">❌ Generated images will be removed</div>
            <div style="margin-bottom: 4px;">❌ This operation cannot be reversed</div>
          </div>
        </div>
      `;
      
      window.NFTApp.getModule("confirmationModal").show(
        modalTitle,
        modalMessage,
        modalDescription,
        () => {
          // User confirmed - proceed with deletion
          // Sort by original index in descending order to avoid index shifting issues
          const sortedViolations = this.filteredSeedList.sort((a, b) => b.originalIndex - a.originalIndex);
          
          // Remove from seedList
          for (const violation of sortedViolations) {
            this.seedList.splice(violation.originalIndex, 1);
          }
          
          // Continue with the rest of the deletion logic
          this.continueDeleteAllViolations();
        }
      );
      return;
    }
    
    // Fallback to browser confirm if modal not available
    const confirmed = confirm(`Are you sure you want to delete all ${this.filteredSeedList.length} NFTs with rule violations?\n\nThis action cannot be undone and will permanently remove these NFTs from your collection.`);
    if (!confirmed) {
      return;
    }
    
    // Sort by original index in descending order to avoid index shifting issues
    const sortedViolations = this.filteredSeedList.sort((a, b) => b.originalIndex - a.originalIndex);
    
    // Remove from seedList
    for (const violation of sortedViolations) {
      this.seedList.splice(violation.originalIndex, 1);
    }
    
    // Continue with the rest of the deletion logic
    this.continueDeleteAllViolations();
  }
  
  // Helper method to complete the deletion process after confirmation
  continueDeleteAllViolations() {
    const deletedCount = this.filteredSeedList.length;
    
    console.log(`[DEBUG] Deleting ${deletedCount} NFTs with rule violations`);
    
    // STEP 1: Delete images and rarity data from all caches for each NFT being deleted
    for (const violation of this.filteredSeedList) {
      const seed = violation.seed;
      console.log(`[DEBUG] Deleting all data for seed: ${seed}`);
      
      // Clear from instance image cache
      if (this.imageCache && this.imageCache[seed]) {
        delete this.imageCache[seed];
        console.log(`[DEBUG] Deleted from instance imageCache: ${seed}`);
      }
      
      // Clear from global image cache
      if (window.savedSeedsImageCache && window.savedSeedsImageCache[seed]) {
        delete window.savedSeedsImageCache[seed];
        console.log(`[DEBUG] Deleted from global savedSeedsImageCache: ${seed}`);
      }
      
      // Clear from violations cache
      if (this.violationsCache && this.violationsCache.has(seed)) {
        this.violationsCache.delete(seed);
      }
      
      // Clear rarity rank for this NFT
      if (this.rarityRanks && this.rarityRanks[seed]) {
        delete this.rarityRanks[seed];
        console.log(`[DEBUG] Deleted rarity rank for seed: ${seed}`);
      }
      
      // Also clear from project data to ensure it's not saved
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData && projectData.rarityRanks && projectData.rarityRanks[seed]) {
        delete projectData.rarityRanks[seed];
        console.log(`[DEBUG] Deleted rarity rank from project data for seed: ${seed}`);
      }
    }
    
    console.log('[DEBUG] All image data and rarity ranks deleted from caches');
    
    // STEP 2: Update localStorage with the modified seedList
    localStorage.setItem(this.seedListKey, JSON.stringify(this.seedList));
    console.log('[DEBUG] Updated seedList saved to localStorage');
    
    // STEP 3: Save violations cache
    this.saveViolationsCache();
    console.log('[DEBUG] Violations cache saved');
    
    // STEP 4: Save updated rarity ranks (with deleted NFTs removed)
    this.saveRarityRanks();
    console.log('[DEBUG] Updated rarity ranks saved (deleted NFTs removed)');
    
    // STEP 5: Reset filter and clear all data
    this.isFilteringViolations = false;
    this.filteredSeedList = [];
    this.currentPage = 1;
    
    // STEP 6: Reload and render empty state
    this.loadSeedList();
    this.renderPage(1);
    
    // Hide Delete All button
    this.hideDeleteAllButton();
    
    // Mark buttons as outdated when NFTs are deleted
    this.markButtonsOutdated();
    
    // Update filter buttons
    this.updateFilterButtons();
    
    // Update the seed list counter
    this.updateSeedListCounter();
    
    // Also update the global seed counter if available
    if (window.NFTApp && window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter) {
      window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter();
    }
    
    // Update NFT count panel
    if (window.updateNftCountPanel) {
      window.updateNftCountPanel();
    }
    
    console.log(`[DEBUG] Successfully deleted ${deletedCount} NFT${deletedCount > 1 ? 's' : ''} with all associated data`);
    
    // Show success message using app's notification system if available
    if (window.NFTApp && window.NFTApp.notificationService) {
      window.NFTApp.notificationService.show(
        `Successfully deleted ${deletedCount} NFT${deletedCount > 1 ? 's' : ''} with rule violations`,
        'success',
        4000
      );
    } else {
      alert(`Successfully deleted ${deletedCount} NFTs with rule violations from your collection.`);
    }
  }

  // Show dialog to choose re-render mode
  showRerenderOptionsDialog() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.7); display: flex; align-items: center; justify-content: center; z-index: 10001; font-family: "Archivo", sans-serif;';
    
    // Create dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = 'background: #2c3e50; padding: 30px; border-radius: 12px; max-width: 600px; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8); border: 2px solid #3498db;';
    
    dialog.innerHTML = `
      <h3 style="color: #ecf0f1; margin: 0 0 20px 0; font-size: 20px; font-weight: 600; text-align: center;">Choose Re-render Mode</h3>
      
      <div style="margin-bottom: 25px;">
        <button id="smart-rerender-btn" style="
          width: 100%;
          padding: 20px;
          margin-bottom: 15px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.2s;
          text-align: left;
        ">
          <div style="font-size: 18px; margin-bottom: 8px;">🔍 Smart Re-render</div>
          <div style="font-size: 13px; opacity: 0.9; line-height: 1.5;">
            Only re-renders NFTs with detected stacking violations (faster)<br>
            <strong>Recommended:</strong> When you've added/modified a few specific rules
          </div>
        </button>
        
        <button id="force-rerender-btn" style="
          width: 100%;
          padding: 20px;
          margin-bottom: 15px;
          background: #e74c3c;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 600;
          transition: background 0.2s;
          text-align: left;
        ">
          <div style="font-size: 18px; margin-bottom: 8px;">🔄 Force Re-render All</div>
          <div style="font-size: 13px; opacity: 0.9; line-height: 1.5;">
            Re-renders entire collection (${this.seedList.length} NFTs) - 100% guaranteed accuracy (slower)<br>
            <strong>Recommended:</strong> After major rule changes or to ensure perfect consistency
          </div>
        </button>
        
        <button id="cancel-rerender-dialog-btn" style="
          width: 100%;
          padding: 12px;
          background: #95a5a6;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s;
        ">
          Cancel
        </button>
      </div>
    `;
    
    // Add hover effects
    const smartBtn = dialog.querySelector('#smart-rerender-btn');
    const forceBtn = dialog.querySelector('#force-rerender-btn');
    const cancelBtn = dialog.querySelector('#cancel-rerender-dialog-btn');
    
    smartBtn.onmouseover = () => smartBtn.style.background = '#2980b9';
    smartBtn.onmouseout = () => smartBtn.style.background = '#3498db';
    
    forceBtn.onmouseover = () => forceBtn.style.background = '#c0392b';
    forceBtn.onmouseout = () => forceBtn.style.background = '#e74c3c';
    
    cancelBtn.onmouseover = () => cancelBtn.style.background = '#7f8c8d';
    cancelBtn.onmouseout = () => cancelBtn.style.background = '#95a5a6';
    
    // Add event listeners
    smartBtn.onclick = () => {
      overlay.remove();
      this.rerenderAllThumbnails(false); // Smart mode
    };
    
    forceBtn.onclick = () => {
      overlay.remove();
      this.rerenderAllThumbnails(true); // Force all mode
    };
    
    cancelBtn.onclick = () => {
      overlay.remove();
    };
    
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        overlay.remove();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
    
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  // Update thumbnail click handler to use fresh image data
  updateThumbnailClickHandler(nftCard, seed, imageData) {
    try {
      console.log('[DEBUG] Updating thumbnail click handler for seed:', seed);
      
      const thumbnail = nftCard.querySelector('.seed-card-thumbnail');
      if (!thumbnail) {
        console.warn('[DEBUG] Thumbnail element not found for click handler update');
        return;
      }
      
      // Remove existing click listeners by cloning the element
      const newThumbnail = thumbnail.cloneNode(true);
      thumbnail.parentNode.replaceChild(newThumbnail, thumbnail);
      
      // Add new click handler that uses the fresh image data directly
      newThumbnail.addEventListener('click', async () => {
        try {
          console.log('[DEBUG] Thumbnail clicked for seed:', seed, 'using fresh image data');
          
          // Use the fresh image data directly instead of calling getImageForSeed
          if (imageData) {
            this.showLargePreview(imageData, seed);
            console.log('[DEBUG] ✅ Showing large preview with fresh image data for seed:', seed);
          } else {
            console.warn('[DEBUG] No image data available for seed:', seed);
            alert('No image available for this seed');
          }
        } catch (error) {
          console.error('[DEBUG] Error showing large preview:', error);
          alert('Error loading image');
        }
      });
      
      console.log('[DEBUG] ✅ Updated thumbnail click handler for seed:', seed);
      
    } catch (error) {
      console.error('[DEBUG] Error updating thumbnail click handler for seed:', seed, error);
    }
  }

  // Save corrected NFTs state to localStorage
  saveCorrectedNFTsState() {
    try {
      const correctedNFTsArray = Array.from(this.correctedNFTs);
      localStorage.setItem('savedSeedsCorrectedNFTs', JSON.stringify(correctedNFTsArray));
      console.log('[DEBUG] Saved corrected NFTs state:', correctedNFTsArray);
    } catch (error) {
      console.error('[DEBUG] Error saving corrected NFTs state:', error);
    }
  }

  // Load corrected NFTs state from localStorage
  loadCorrectedNFTsState() {
    try {
      const saved = localStorage.getItem('savedSeedsCorrectedNFTs');
      if (saved) {
        const correctedNFTsArray = JSON.parse(saved);
        this.correctedNFTs = new Set(correctedNFTsArray);
        console.log('[DEBUG] Loaded corrected NFTs state:', correctedNFTsArray);
      }
    } catch (error) {
      console.error('[DEBUG] Error loading corrected NFTs state:', error);
    }
  }

  // Show "Please Wait..." popup to prevent user interaction during heavy operations
  static showPleaseWaitPopup() {
    // Remove any existing popup first
    this.hidePleaseWaitPopup();
    
    // Close "Project loaded successfully" notification if it exists
    // Check both notification container types
    const notificationContainers = [
      document.querySelector(".fixed-notification-container"),
      document.querySelector(".notification-container")
    ].filter(Boolean);
    
    notificationContainers.forEach(container => {
      const notifications = container.querySelectorAll(".notification");
      notifications.forEach(notification => {
        const messageEl = notification.querySelector(".notification-message");
        if (messageEl && messageEl.textContent.includes("Project loaded successfully")) {
          notification.remove();
        }
      });
    });
    
    const popup = document.createElement('div');
    popup.id = 'nft-edit-please-wait-popup';
    // Initialize flag to indicate process is still running
    popup.dataset.processFinished = 'false';
    popup.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.85) !important;
      display: none !important; /* CRITICAL: Hide popup but keep code - loading animation is now displayed instead */
      align-items: center !important;
      justify-content: center !important;
      z-index: 99999 !important;
      font-family: 'Archivo', sans-serif !important;
      pointer-events: none !important; /* CRITICAL: Disable pointer events since popup is hidden */
    `;
    
    // CRITICAL: Prevent tab navigation while popup is showing (same as project loading)
    const navTabs = document.querySelectorAll('.nav-tab');
    navTabs.forEach(tab => {
      tab.style.setProperty('pointer-events', 'none', 'important');
      tab.style.setProperty('opacity', '0.5', 'important');
      tab.style.setProperty('cursor', 'not-allowed', 'important');
    });
    
    // Store reference to popup for cleanup
    popup._blockedTabs = navTabs;
    
    popup.innerHTML = `
      <div style="
        background: #2a2a3e;
        padding: 40px 60px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        border: 1px solid #444;
      ">
        <div style="
          font-size: 24px;
          font-weight: 600;
          color: #3498db;
          margin-bottom: 20px;
        ">
          Please Wait...
        </div>
        <div style="
          font-size: 16px;
          color: #95a5a6;
          margin-bottom: 20px;
        ">
          Loading project and processing operations. Please wait...
        </div>
        <div style="
          display: flex;
          justify-content: center;
          align-items: center;
          margin-top: 20px;
        ">
          <div class="loading-spinner" style="
            width: 40px;
            height: 40px;
            border: 4px solid #333;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
          "></div>
        </div>
      </div>
    `;
    
    // Add CSS animation for spinner
    if (!document.getElementById('please-wait-spinner-styles')) {
      const style = document.createElement('style');
      style.id = 'please-wait-spinner-styles';
      style.textContent = `
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(popup);
    console.log('[DEBUG] Please Wait popup displayed');
  }

  // Hide "Please Wait..." popup
  // Auto-closes after 2 seconds, or immediately on click after process finishes
  static hidePleaseWaitPopup() {
    const popup = document.getElementById('nft-edit-please-wait-popup');
    if (!popup) {
      return;
    }
    
    // CRITICAL: Restore tab navigation (same as project loading)
    if (popup._blockedTabs) {
      popup._blockedTabs.forEach(tab => {
        tab.style.removeProperty('pointer-events');
        tab.style.removeProperty('opacity');
        tab.style.removeProperty('cursor');
      });
      popup._blockedTabs = null;
    }
    
    // Mark that the process has finished
    popup.dataset.processFinished = 'true';
    
    // IMMEDIATELY allow pointer events to pass through so tabs can be clicked
    // This prevents the overlay from blocking tab clicks
    popup.style.pointerEvents = 'none';
    
    // Remove any existing auto-close timeout
    if (popup._autoCloseTimeout) {
      clearTimeout(popup._autoCloseTimeout);
      popup._autoCloseTimeout = null;
    }
    
    // Remove any existing click listener
    if (popup._clickListener) {
      document.removeEventListener('click', popup._clickListener);
      popup._clickListener = null;
    }
    
    // Function to actually remove the popup
    const removePopup = () => {
      if (popup._autoCloseTimeout) {
        clearTimeout(popup._autoCloseTimeout);
        popup._autoCloseTimeout = null;
      }
      if (popup._clickListener) {
        document.removeEventListener('click', popup._clickListener);
        popup._clickListener = null;
      }
      popup.remove();
      console.log('[DEBUG] Please Wait popup hidden');
      
      // CRITICAL: Hide loading animation when popup is hidden (popup is now hidden but code kept)
      // Loading animation should be hidden when all operations complete
      const projectService = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('projectService');
      if (projectService && projectService.hideLoadingAnimation) {
        projectService.hideLoadingAnimation();
      }
      
      // CRITICAL: Update button states after "Please Wait" popup is hidden
      // This ensures buttons are enabled only after all tasks are completed
      setTimeout(() => {
        const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
        if (generateNftsUI && generateNftsUI._updateAllButtonStates) {
          generateNftsUI._updateAllButtonStates();
        }
      }, 100);
      
      // CRITICAL: Update counters after "Please Wait" popup is hidden
      // This ensures counters show colors only after loading is complete
      setTimeout(() => {
        if (window.updateAllCounters) {
          window.updateAllCounters();
        } else {
          if (window.updateNftCountPanel) {
            window.updateNftCountPanel();
          }
          const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUI && typeof generateNftsUI.refreshSeedListCounter === 'function') {
            generateNftsUI.refreshSeedListCounter(true);
          }
        }
      }, 100);
    };
    
    // Set up click listener on the popup content (not the overlay) for immediate close after finishing
    // Only the inner content div should be clickable to close, allowing clicks elsewhere to pass through
    const popupContent = popup.querySelector('div > div');
    if (popupContent) {
      popupContent.style.pointerEvents = 'auto';
      popupContent.style.cursor = 'pointer';
      
      popup._clickListener = (e) => {
        // Only close if clicking on the popup content itself
        if (popupContent.contains(e.target) || popupContent === e.target) {
          e.preventDefault();
          e.stopPropagation();
          removePopup();
        }
      };
      popupContent.addEventListener('click', popup._clickListener);
    }
    
    // Schedule auto-close after 2 seconds
    popup._autoCloseTimeout = setTimeout(() => {
      removePopup();
    }, 2000);
  }


  // Check and update violation status for a specific NFT card
  async checkAndUpdateViolationStatus(nftCard, seed, nftData) {
    try {
      console.log('[DEBUG] Checking violation status for updated seed:', seed);
      
      // Skip violation check if this NFT has been corrected
      if (this.correctedNFTs.has(seed)) {
        console.log('[DEBUG] Skipping violation check for corrected NFT:', seed);
        // Ensure no violation overlay is present for corrected NFTs (now wrapped in tooltip)
        const existingOverlay = nftCard.querySelector('.seed-card-violation-overlay');
        if (existingOverlay) {
          const tooltipWrapper = existingOverlay.closest('.tooltip');
          if (tooltipWrapper) {
            tooltipWrapper.remove();
          } else {
            existingOverlay.remove();
          }
          console.log('[DEBUG] ✅ Removed violation overlay for corrected NFT:', seed);
        }
        return;
      }
      
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData || !projectData.rules || projectData.rules.length === 0) {
        console.log('[DEBUG] No project rules found, no violations to check');
        return;
      }
      
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule) {
        console.log('[DEBUG] No generateNfts module found, cannot check violations');
        return;
      }
      
      // Check for rule violations using the updated NFT data
      // Wrap in try-catch to prevent crashes during batch edits
      let violations = [];
      let hasViolations = false;
      try {
        violations = generateNftsModule.checkForRuleViolations(nftData, projectData.rules);
        hasViolations = violations && violations.length > 0;
      } catch (violationError) {
        console.error('[DEBUG] Error checking violations for seed:', seed, violationError);
        // If violation check fails, show save warning but continue
        if (window.ErrorHandler && typeof window.ErrorHandler.showSaveWarning === 'function') {
          const errorDetails = {
            message: `Error checking rule violations: ${violationError.message}`,
            stack: violationError.stack,
            timestamp: new Date(),
            url: 'saved-seeds-modal.js',
            line: 1847
          };
          // Only show warning if it's a critical error
          if (window.ErrorHandler.isCriticalError && window.ErrorHandler.isCriticalError(errorDetails)) {
            window.ErrorHandler.showSaveWarning(errorDetails);
          }
        }
        // Continue without showing violations if check fails
        hasViolations = false;
      }
      
      console.log('[DEBUG] Violation check result for seed:', seed, 'Has violations:', hasViolations);
      if (hasViolations) {
        console.log('[DEBUG] Violations found:', violations);
      }
      
      // Update violation overlay based on the result
      if (hasViolations) {
        // Add violation overlay if it doesn't exist
        const existingOverlay = nftCard.querySelector('.seed-card-violation-overlay');
        if (!existingOverlay) {
          this.addViolationOverlayToCard(nftCard);
          console.log('[DEBUG] ✅ Added violation overlay for seed with violations:', seed);
        }
      } else {
        // Remove violation overlay if it exists (now wrapped in tooltip)
        const existingOverlay = nftCard.querySelector('.seed-card-violation-overlay');
        if (existingOverlay) {
          const tooltipWrapper = existingOverlay.closest('.tooltip');
          if (tooltipWrapper) {
            tooltipWrapper.remove();
          } else {
            existingOverlay.remove();
          }
          console.log('[DEBUG] ✅ Removed violation overlay for seed without violations:', seed);
        }
      }
      
    } catch (error) {
      console.error('[DEBUG] Error checking violation status for seed:', seed, error);
    }
  }

  // Regenerate thumbnail for a specific seed
  async regenerateThumbnailForSeed(seed, index) {
    try {
      console.log('[DEBUG] Regenerating thumbnail for seed:', seed, 'at index:', index);
      
      // Check if we already have the imageData in the seed list
      if (this.seedList[index] && this.seedList[index].imageData) {
        console.log('[DEBUG] Using existing imageData from seed list for seed:', seed);
        const nftData = {
          imageData: this.seedList[index].imageData,
          thumbnail: this.seedList[index].thumbnail || this.seedList[index].imageData,
          traits: this.seedList[index].traits,
          rarity: this.seedList[index].rarity,
          rarityScore: this.seedList[index].rarityScore
        };
        
        // Update the NFT card thumbnail in the UI directly
        const nftCard = document.querySelector(`[data-seed="${seed}"]`);
        if (nftCard) {
          let thumbnailImg = nftCard.querySelector('.seed-card-thumbnail img');
          if (!thumbnailImg) {
            thumbnailImg = nftCard.querySelector('.seed-card-thumbnail');
          }
          if (!thumbnailImg) {
            thumbnailImg = nftCard.querySelector('img');
          }
          
          if (thumbnailImg) {
            // CRITICAL FIX: Add cache-busting timestamp to force browser to reload image
            const timestamp = Date.now();
            const cacheBustedImageData = nftData.imageData.startsWith('data:') 
              ? nftData.imageData 
              : `${nftData.imageData}?t=${timestamp}`;
            
            if (thumbnailImg.tagName === 'IMG') {
              thumbnailImg.src = cacheBustedImageData;
              // Initialize description button after image loads
              thumbnailImg.onload = () => {
                this.initializeDescriptionButton(nftCard, seed);
              };
            } else {
              // Preserve existing elements (rarity, number, description button)
              const existingRarity = thumbnailImg.querySelector('.seed-card-rarity');
              const existingNumber = thumbnailImg.querySelector('.seed-card-number-display');
              const existingDescBtn = thumbnailImg.querySelector('.seed-desc-btn');
              const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
              const numberHTML = existingNumber ? existingNumber.outerHTML : '';
              const descBtnHTML = existingDescBtn ? existingDescBtn.outerHTML : '';
              
              thumbnailImg.innerHTML = `<img src="${cacheBustedImageData}" alt="NFT Preview" data-timestamp="${timestamp}" />${rarityHTML}${numberHTML}${descBtnHTML}`;
              
              // CRITICAL: Verify description button is in DOM after innerHTML update
              const descBtnAfterRender = thumbnailImg.querySelector('.seed-desc-btn');
              if (!descBtnAfterRender && descBtnHTML) {
                console.warn('[DEBUG] Description button lost after thumbnail render (refreshNFTData-cached), re-adding it');
                // Re-add the description button if it was lost
                thumbnailImg.insertAdjacentHTML('beforeend', descBtnHTML);
              }
              
              // Initialize description button after image loads
              const img = thumbnailImg.querySelector('img');
              if (img) {
                img.onload = () => {
                  // Double-check button exists before initializing
                  const descBtn = thumbnailImg.querySelector('.seed-desc-btn');
                  if (descBtn) {
                  this.initializeDescriptionButton(nftCard, seed);
                  } else {
                    console.error('[DEBUG] Description button not found in DOM after image load (refreshNFTData-cached) for seed:', seed);
                  }
                };
                // If image already loaded (cached), initialize immediately
                if (img.complete) {
                  const descBtn = thumbnailImg.querySelector('.seed-desc-btn');
                  if (descBtn) {
                  this.initializeDescriptionButton(nftCard, seed);
                  } else {
                    console.error('[DEBUG] Description button not found in DOM (image already loaded, refreshNFTData-cached) for seed:', seed);
                  }
                }
              } else {
                // If no image, still initialize the button if it exists
                const descBtn = thumbnailImg.querySelector('.seed-desc-btn');
                if (descBtn) {
                  this.initializeDescriptionButton(nftCard, seed);
                }
              }
            }
            console.log('[DEBUG] ✅ Updated NFT card thumbnail using cached data for seed:', seed, 'with cache-busting timestamp:', timestamp);
          }
          
          // Check the new seed for rule violations
          this.checkAndUpdateViolationStatus(nftCard, seed, nftData);
          
          // Update the thumbnail click handler to use the fresh data
          this.updateThumbnailClickHandler(nftCard, seed, nftData.imageData);
        }
        return;
      }
      
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData) {
        console.warn('[DEBUG] No project data available for thumbnail regeneration');
        return;
      }
      
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule) {
        console.warn('[DEBUG] No generateNfts module available for thumbnail regeneration');
        return;
      }
      
      // Generate the NFT with the updated seed
      const nftData = await generateNftsModule.generateSingleNFT(projectData, false, seed);
      
      if (nftData?.imageData) {
        // Update the thumbnail and traits in the seed list
        this.seedList[index].thumbnail = nftData.imageData;
        this.seedList[index].traits = nftData.traits || [];
        this.seedList[index].rarity = nftData.rarity || 'common';
        this.seedList[index].rarityScore = nftData.rarityScore || 0;
        
        // Update the image cache
        this.imageCache[seed] = nftData.imageData;
        if (!window.savedSeedsImageCache) {
          window.savedSeedsImageCache = {};
        }
        window.savedSeedsImageCache[seed] = nftData.imageData;
        
        // Force cache to be considered fresh for this seed
        // This ensures getImageForSeed will use the updated cache
        console.log('[DEBUG] ✅ Updated both caches for seed:', seed);
        console.log('[DEBUG] Cache size:', window.savedSeedsImageCache[seed]?.length || 'undefined');
        
        // CRITICAL: Also update the seed object's imageData and thumbnail to ensure consistency
        this.seedList[index].imageData = nftData.imageData;
        this.seedList[index].thumbnail = nftData.imageData;
        console.log('[DEBUG] ✅ Updated seed object imageData and thumbnail for seed:', seed);
        
        // Update the NFT card thumbnail in the UI
        const nftCard = document.querySelector(`[data-seed="${seed}"]`);
        console.log('[DEBUG] Looking for NFT card with seed:', seed);
        console.log('[DEBUG] Found NFT card:', nftCard);
        
        if (nftCard) {
          // Remove any existing violation overlay first (now wrapped in tooltip)
          const existingOverlay = nftCard.querySelector('.seed-card-violation-overlay');
          if (existingOverlay) {
            const tooltipWrapper = existingOverlay.closest('.tooltip');
            if (tooltipWrapper) {
              tooltipWrapper.remove();
            } else {
              existingOverlay.remove();
            }
            console.log('[DEBUG] ✅ Removed existing violation overlay for seed:', seed);
          }
          
          // Try multiple possible thumbnail selectors
          let thumbnailImg = nftCard.querySelector('.seed-card-thumbnail img');
          if (!thumbnailImg) {
            thumbnailImg = nftCard.querySelector('.seed-card-thumbnail');
          }
          if (!thumbnailImg) {
            thumbnailImg = nftCard.querySelector('img');
          }
          
          console.log('[DEBUG] Found thumbnail element:', thumbnailImg);
          
          if (thumbnailImg) {
            // CRITICAL FIX: Add cache-busting timestamp to force browser to reload image
            const timestamp = Date.now();
            const cacheBustedImageData = nftData.imageData.startsWith('data:') 
              ? nftData.imageData 
              : `${nftData.imageData}?t=${timestamp}`;
            
            // If it's a container, update its innerHTML, otherwise update src
            if (thumbnailImg.tagName === 'IMG') {
              thumbnailImg.src = cacheBustedImageData;
              // Initialize description button after image loads
              thumbnailImg.onload = () => {
                this.initializeDescriptionButton(nftCard, seed);
              };
              // If image already loaded (cached), initialize immediately
              if (thumbnailImg.complete) {
                this.initializeDescriptionButton(nftCard, seed);
              }
            } else {
              // Preserve existing elements (rarity, number, description button)
              const existingRarity = thumbnailImg.querySelector('.seed-card-rarity');
              const existingNumber = thumbnailImg.querySelector('.seed-card-number-display');
              const existingDescBtn = thumbnailImg.querySelector('.seed-desc-btn');
              const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
              const numberHTML = existingNumber ? existingNumber.outerHTML : '';
              const descBtnHTML = existingDescBtn ? existingDescBtn.outerHTML : '';
              
              thumbnailImg.innerHTML = `<img src="${cacheBustedImageData}" alt="NFT Preview" data-timestamp="${timestamp}" />${rarityHTML}${numberHTML}${descBtnHTML}`;
              
              // CRITICAL: Verify description button is in DOM after innerHTML update
              const descBtnAfterRender = thumbnailImg.querySelector('.seed-desc-btn');
              if (!descBtnAfterRender && descBtnHTML) {
                console.warn('[DEBUG] Description button lost after thumbnail render (refreshNFTData-new), re-adding it');
                // Re-add the description button if it was lost
                thumbnailImg.insertAdjacentHTML('beforeend', descBtnHTML);
              }
              
              // Initialize description button after image loads
              const img = thumbnailImg.querySelector('img');
              if (img) {
                img.onload = () => {
                  // Double-check button exists before initializing
                  const descBtn = thumbnailImg.querySelector('.seed-desc-btn');
                  if (descBtn) {
                  this.initializeDescriptionButton(nftCard, seed);
                  } else {
                    console.error('[DEBUG] Description button not found in DOM after image load (refreshNFTData-new) for seed:', seed);
                  }
                };
                // If image already loaded (cached), initialize immediately
                if (img.complete) {
                  const descBtn = thumbnailImg.querySelector('.seed-desc-btn');
                  if (descBtn) {
                  this.initializeDescriptionButton(nftCard, seed);
                  } else {
                    console.error('[DEBUG] Description button not found in DOM (image already loaded, refreshNFTData-new) for seed:', seed);
                  }
                }
              } else {
                // If no image, still initialize the button if it exists
                const descBtn = thumbnailImg.querySelector('.seed-desc-btn');
                if (descBtn) {
                  this.initializeDescriptionButton(nftCard, seed);
                }
              }
            }
            console.log('[DEBUG] ✅ Updated NFT card thumbnail for seed:', seed, 'with cache-busting timestamp:', timestamp);
          } else {
            console.warn('[DEBUG] Thumbnail img element not found for seed:', seed);
            console.log('[DEBUG] Available elements in card:', nftCard.innerHTML.substring(0, 200));
          }
          
          // Check the new seed for rule violations
          this.checkAndUpdateViolationStatus(nftCard, seed, nftData);
          
          // CRITICAL: Update the thumbnail click handler to use the fresh data
          this.updateThumbnailClickHandler(nftCard, seed, nftData.imageData);
        } else {
          console.warn('[DEBUG] NFT card not found for seed:', seed, '- will retry in 100ms');
          // Retry after a short delay in case the DOM hasn't updated yet
          setTimeout(() => {
            const retryCard = document.querySelector(`[data-seed="${seed}"]`);
            console.log('[DEBUG] Retry - Found NFT card:', retryCard);
            if (retryCard) {
              // Remove any existing violation overlay (now wrapped in tooltip)
              const existingOverlay = retryCard.querySelector('.seed-card-violation-overlay');
              if (existingOverlay) {
                const tooltipWrapper = existingOverlay.closest('.tooltip');
                if (tooltipWrapper) {
                  tooltipWrapper.remove();
                } else {
                  existingOverlay.remove();
                }
                console.log('[DEBUG] ✅ Removed existing violation overlay on retry for seed:', seed);
              }
              
              let retryThumbnailImg = retryCard.querySelector('.seed-card-thumbnail img');
              if (!retryThumbnailImg) {
                retryThumbnailImg = retryCard.querySelector('.seed-card-thumbnail');
              }
              if (!retryThumbnailImg) {
                retryThumbnailImg = retryCard.querySelector('img');
              }
              
              if (retryThumbnailImg) {
                // CRITICAL FIX: Add cache-busting timestamp to force browser to reload image
                const timestamp = Date.now();
                const cacheBustedImageData = nftData.imageData.startsWith('data:') 
                  ? nftData.imageData 
                  : `${nftData.imageData}?t=${timestamp}`;
                
                if (retryThumbnailImg.tagName === 'IMG') {
                  retryThumbnailImg.src = cacheBustedImageData;
                } else {
                  retryThumbnailImg.innerHTML = `<img src="${cacheBustedImageData}" alt="NFT Preview" data-timestamp="${timestamp}" />`;
                }
                console.log('[DEBUG] ✅ Updated NFT card thumbnail on retry for seed:', seed, 'with cache-busting timestamp:', timestamp);
                
                // Check the new seed for rule violations
                this.checkAndUpdateViolationStatus(retryCard, seed, nftData);
                
                // CRITICAL: Update the thumbnail click handler to use the fresh data
                this.updateThumbnailClickHandler(retryCard, seed, nftData.imageData);
              } else {
                console.error('[DEBUG] ❌ Thumbnail element still not found on retry for seed:', seed);
              }
            } else {
              console.error('[DEBUG] ❌ NFT card still not found after retry for seed:', seed);
            }
          }, 100);
        }
        
        // Save the updated seed list
        this.saveSeedList();
        
        console.log('[DEBUG] ✅ Thumbnail regenerated successfully for seed:', seed);
      } else {
        console.error('[DEBUG] Failed to generate NFT data for seed:', seed);
      }
    } catch (error) {
      console.error('[DEBUG] Error regenerating thumbnail for seed:', seed, error);
    }
  }

  // Re-render all outdated thumbnails
  async rerenderAllThumbnails(forceAll = false) {
    console.log('[DEBUG] ==========================================');
    console.log('[DEBUG] RE-RENDER THUMBNAILS STARTED');
    console.log('[DEBUG] Mode:', forceAll ? 'FORCE ALL' : 'SMART (violations only)');
    console.log('[DEBUG] ==========================================');
    
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData) {
      console.error('[DEBUG] No project loaded!');
      window.NFTApp.getModule('notificationService').show('No project loaded', 'error');
      return;
    }
    console.log('[DEBUG] Project loaded:', projectData.name);
    
    const generateNftsModule = window.NFTApp.getModule('generateNfts');
    if (!generateNftsModule?.generateSingleNFT) {
      console.error('[DEBUG] NFT generator not available!');
      window.NFTApp.getModule('notificationService').show('NFT generator not available', 'error');
      return;
    }
    console.log('[DEBUG] Generate NFTs module loaded');
    
    // Check if there are any stacking rules to apply
    const hasStackingRules = projectData.rules && projectData.rules.some(r => 
      r.type === 'always-above' || r.type === 'always-below' || 
      r.type === 'immediately-above' || r.type === 'immediately-below'
    );
    
    if (!hasStackingRules) {
      window.NFTApp.getModule('notificationService').show('No stacking rules found. Add stacking rules first to re-render thumbnails.', 'info');
      return;
    }
    
    // Initialize violations cache if needed
    if (!this.violationsCache) {
      this.violationsCache = new Map();
    }
    
    let nftsWithViolations = [];
    
    // FORCE ALL MODE: Skip violation scanning and re-render entire collection
    if (forceAll) {
      console.log('[DEBUG] FORCE ALL mode: Re-rendering entire collection without violation checking');
      nftsWithViolations = this.seedList.map((seedObj, index) => ({ seedObj, index }));
      console.log('[DEBUG] Will re-render all', nftsWithViolations.length, 'NFTs');
    } 
    // SMART MODE: Scan for violations first
    else {
      console.log('[DEBUG] SMART mode: Scanning for violations first...');
      
      // Show scanning popup
      const scanPopup = document.createElement('div');
      scanPopup.className = 'scan-progress-popup';
      scanPopup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c3e50; padding: 30px 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 10002; min-width: 400px; text-align: center;';
      scanPopup.innerHTML = `
        <div class="scan-title-container" style="text-align: center; margin-bottom: 20px;">
          <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Scanning for Violations</div>
          <div class="scan-subtitle" style="font-size: 14px; color: #ffffff; text-align: right; display: inline-block; width: auto;">(Checking for rule violations)</div>
        </div>
        <div class="scan-percentage" id="initial-scan-percentage" style="font-size: 24px; font-weight: 700; color: #3498db; margin-bottom: 10px;">
          0%<span class="scan-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="scan-progress-info" style="font-size: 14px; color: #ffffff; margin-bottom: 10px;">
        Processing: <span id="scan-count">0</span> / <span id="scan-total">${this.seedList.length}</span>
        </div>
      `;
      document.body.appendChild(scanPopup);
      
      // Make popup draggable
      let isDraggingPopup = false;
      let currentXPopup;
      let currentYPopup;
      let initialXPopup;
      let initialYPopup;
      let xOffsetPopup = 0;
      let yOffsetPopup = 0;
      
      const dragAreaPopup = scanPopup.querySelector('.scan-title-container');
      if (dragAreaPopup) {
        dragAreaPopup.style.cursor = 'move';
        dragAreaPopup.style.userSelect = 'none';
        
        dragAreaPopup.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isDraggingPopup = true;
          initialXPopup = e.clientX - xOffsetPopup;
          initialYPopup = e.clientY - yOffsetPopup;
          scanPopup.style.cursor = 'grabbing';
        });
      }
      
      const dragMouseMovePopup = (e) => {
        if (isDraggingPopup) {
          e.preventDefault();
          currentXPopup = e.clientX - initialXPopup;
          currentYPopup = e.clientY - initialYPopup;
          xOffsetPopup = currentXPopup;
          yOffsetPopup = currentYPopup;
          
          scanPopup.style.transform = `translate(${currentXPopup}px, ${currentYPopup}px)`;
        }
      };
      
      const dragMouseUpPopup = () => {
        if (isDraggingPopup) {
          isDraggingPopup = false;
          scanPopup.style.cursor = 'move';
        }
      };
      
      document.addEventListener('mousemove', dragMouseMovePopup);
      document.addEventListener('mouseup', dragMouseUpPopup);
      
      // Store cleanup function
      scanPopup._cleanupDrag = () => {
        document.removeEventListener('mousemove', dragMouseMovePopup);
        document.removeEventListener('mouseup', dragMouseUpPopup);
      };
      
      // OPTIMIZATION: Process in batches with cached traits
      const batchSize = 100;
      for (let i = 0; i < this.seedList.length; i += batchSize) {
        const batch = this.seedList.slice(i, Math.min(i + batchSize, this.seedList.length));
        
        // Process batch in parallel
        const batchPromises = batch.map(async (seedObj, batchIndex) => {
          const actualIndex = i + batchIndex;
          try {
            let nftData = null;
            
            // OPTIMIZATION: Use cached traits if available (much faster!)
            if (seedObj.traits && Array.isArray(seedObj.traits) && seedObj.traits.length > 0) {
              nftData = { traits: seedObj.traits, seed: seedObj.seed };
            } else {
              // Only generate if traits are missing
              nftData = await generateNftsModule.generateSingleNFT(projectData, false, seedObj.seed);
            }
            
            if (nftData && nftData.traits) {
              // Check for violations
              const violations = generateNftsModule.checkForRuleViolations(nftData, projectData.rules);
              
              if (violations && violations.length > 0) {
                return { seedObj, index: actualIndex };
              }
            }
          } catch (error) {
            console.error(`[DEBUG] Error checking NFT #${actualIndex + 1}:`, error.message);
          }
          return null;
        });
        
        // Wait for batch to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Add non-null results to violations list
        batchResults.forEach(result => {
          if (result) {
            nftsWithViolations.push(result);
          }
        });
        
        // Update progress after each batch
        const processed = Math.min(i + batchSize, this.seedList.length);
        const scanCountEl = scanPopup.querySelector('#scan-count');
        if (scanCountEl) {
          scanCountEl.textContent = processed;
        }
        
        const percentageEl = scanPopup.querySelector('#initial-scan-percentage');
        if (percentageEl) {
          const percentage = Math.floor((processed / this.seedList.length) * 100);
          const dotsHTML = percentageEl.querySelector('.scan-dots');
          if (dotsHTML && percentageEl.childNodes[0]) {
            percentageEl.childNodes[0].textContent = `${percentage}%`;
          }
        }
        
        // Force DOM update by yielding to browser's event loop
        // This ensures progress is visible in real-time
        // Uses MessageChannel for background tabs which is less throttled
        if (typeof yieldToBrowser === 'function') {
          await yieldToBrowser();
        } else {
          // Fallback if utility function not available
          await new Promise(resolve => {
            if (!document.hidden) {
              requestAnimationFrame(() => setTimeout(resolve, 0));
            } else {
              const channel = new MessageChannel();
              channel.port1.onmessage = () => {
                channel.port1.close();
                channel.port2.close();
                resolve();
              };
              channel.port2.postMessage(null);
            }
          });
        }
      }
      
      // Remove scanning popup
      document.body.removeChild(scanPopup);
      
      console.log('[DEBUG] Found', nftsWithViolations.length, 'NFTs with violations');
      
      if (nftsWithViolations.length === 0) {
        window.NFTApp.getModule('notificationService').show('No NFTs with rule violations found. All NFTs are clean!', 'info');
        return;
      }
    }
    
    const total = nftsWithViolations.length;
    const totalCollection = this.seedList.length;
    
    // Different confirmation messages based on mode
    let modalTitle, modalMessage, modalDescription;
    if (forceAll) {
      modalTitle = "Force Re-render All NFTs";
      modalMessage = `<div style="margin-top: 12px;">This will re-render ALL <strong>${total}</strong> NFTs in your collection to ensure 100% consistency with current rules.</div>`;
      modalDescription = `
        <div style="text-align: left; margin-top: 12px; line-height: 1.6;">
          <div style="margin-bottom: 8px; color: #4ade80;"><strong>This will:</strong></div>
          <div style="margin-left: 10px; margin-bottom: 6px;">✅ Update every NFT with latest stacking rules</div>
          <div style="margin-left: 10px; margin-bottom: 6px;">✅ Guarantee perfect consistency across collection</div>
          <div style="margin-left: 10px; margin-bottom: 6px;">✅ Remove any outdated images</div>
          <div style="margin-left: 10px; margin-bottom: 12px;">✅ Keep the same seeds (traits won't change)</div>
          <div style="color: #fbbf24; margin-top: 12px;">⏱️ This may take several minutes for large collections.</div>
        </div>
      `;
    } else {
      modalTitle = "Smart Re-render Mode";
      modalMessage = `<div style="margin-top: 12px;">Found <strong>${total}</strong> NFT${total > 1 ? 's' : ''} with detected stacking violations out of ${totalCollection} total.</div>`;
      modalDescription = `
        <div style="text-align: left; margin-top: 12px; line-height: 1.6;">
          <div style="margin-bottom: 8px;">This will re-render <strong>ONLY</strong> the NFTs with detected violations.</div>
          <div style="margin-bottom: 8px; color: #4ade80; margin-top: 12px;"><strong>This will:</strong></div>
          <div style="margin-left: 10px; margin-bottom: 6px;">✅ Fix stacking order violations (visual layering)</div>
          <div style="margin-left: 10px; margin-bottom: 6px;">✅ Remove forbidden signs from fixed NFTs</div>
          <div style="margin-left: 10px; margin-bottom: 12px;">✅ Keep the same seeds (traits won't change)</div>
          <div style="color: #fbbf24; margin-top: 12px; font-size: 12px;">Note: Combination rule violations that cannot be fixed by re-ordering will remain.</div>
        </div>
      `;
    }
    
    // Use the app's styled confirmation modal
    if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
      window.NFTApp.getModule("confirmationModal").show(
        modalTitle,
        modalMessage,
        modalDescription,
        () => {
          // Continue with re-rendering
          this.continueRerender(forceAll, nftsWithViolations, total);
        }
      );
      return;
    }
    
    // Fallback to browser confirm if modal not available
    const confirmMessage = forceAll 
      ? `FORCE RE-RENDER ALL MODE\n\nThis will re-render ALL ${total} NFTs in your collection to ensure 100% consistency with current rules.\n\nThis will:\n✅ Update every NFT with latest stacking rules\n✅ Guarantee perfect consistency across collection\n✅ Remove any outdated images\n✅ Keep the same seeds (traits won't change)\n\n⏱️ This may take several minutes for large collections.\n\nContinue?`
      : `SMART RE-RENDER MODE\n\nFound ${total} NFT${total > 1 ? 's' : ''} with detected stacking violations out of ${totalCollection} total.\n\nThis will re-render ONLY the NFTs with detected violations.\n\nThis will:\n✅ Fix stacking order violations (visual layering)\n✅ Remove forbidden signs from fixed NFTs\n✅ Keep the same seeds (traits won't change)\n\nNote: Combination rule violations that cannot be fixed by re-ordering will remain.\n\nContinue?`;
    
    const confirmed = confirm(confirmMessage);
    if (!confirmed) {
      return;
    }
    
    this.continueRerender(forceAll, nftsWithViolations, total);
  }

  async continueRerender(forceAll, nftsWithViolations, total) {
    
    // Show progress popup
    const progressPopup = document.createElement('div');
    progressPopup.id = 'rerender-progress-popup';
    progressPopup.className = 'scan-progress-popup';
    progressPopup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c3e50; padding: 30px 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 10002; min-width: 400px; text-align: center;';
    
    const subtitleText = forceAll ? '(Force re-rendering entire collection)' : '(Fixing stacking violations)';
    
    progressPopup.innerHTML = `
      <div class="scan-title-container" style="text-align: center; margin-bottom: 20px;">
        <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Re-rendering Thumbnails / NFTs</div>
        <div class="scan-subtitle" style="font-size: 14px; color: #ffffff; text-align: right; display: inline-block; width: auto;">${subtitleText}</div>
      </div>
      <div class="scan-percentage" id="rerender-percentage" style="font-size: 24px; font-weight: 700; color: #3498db; margin-bottom: 10px;">
        0%<span class="scan-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
        </div>
      <div class="scan-progress-info" style="font-size: 14px; color: #ffffff; margin-bottom: 10px;">
        Processing: <span id="rerender-processed">0</span> / <span id="rerender-total">${total}</span>
      </div>
      <div class="scan-eta" id="rerender-eta" style="font-size: 13px; color: #ffffff; margin-bottom: 15px; min-height: 20px;">
        Calculating time remaining...
      </div>
      <div class="scan-counts-container">
        <div class="scan-fixed-count"><span id="rerender-fixed-count">0</span> fixed</div>
      </div>
      <button class="scan-cancel-btn" id="cancel-rerender-btn">Cancel</button>
    `;
    document.body.appendChild(progressPopup);
    
    // Make popup draggable
    let isDraggingRerender = false;
    let currentXRerender;
    let currentYRerender;
    let initialXRerender;
    let initialYRerender;
    let xOffsetRerender = 0;
    let yOffsetRerender = 0;
    
    const dragAreaRerender = progressPopup.querySelector('.scan-title-container');
    if (dragAreaRerender) {
      dragAreaRerender.style.cursor = 'move';
      dragAreaRerender.style.userSelect = 'none';
      
      dragAreaRerender.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDraggingRerender = true;
        initialXRerender = e.clientX - xOffsetRerender;
        initialYRerender = e.clientY - yOffsetRerender;
        progressPopup.style.cursor = 'grabbing';
      });
    }
    
    const dragMouseMoveRerender = (e) => {
      if (isDraggingRerender) {
        e.preventDefault();
        currentXRerender = e.clientX - initialXRerender;
        currentYRerender = e.clientY - initialYRerender;
        xOffsetRerender = currentXRerender;
        yOffsetRerender = currentYRerender;
        
        progressPopup.style.transform = `translate(${currentXRerender}px, ${currentYRerender}px)`;
      }
    };
    
    const dragMouseUpRerender = () => {
      if (isDraggingRerender) {
        isDraggingRerender = false;
        progressPopup.style.cursor = 'move';
      }
    };
    
    document.addEventListener('mousemove', dragMouseMoveRerender);
    document.addEventListener('mouseup', dragMouseUpRerender);
    
    // Store cleanup function
    progressPopup._cleanupDrag = () => {
      document.removeEventListener('mousemove', dragMouseMoveRerender);
      document.removeEventListener('mouseup', dragMouseUpRerender);
    };
    
    // Track timing for ETA calculation
    const rerenderStartTime = Date.now();
    let rerenderLastPercentageMilestone = 0;
    
    let processed = 0;
    let fixedViolations = 0;
    let isRerenderCancelled = false;
    
    // Add cancel button event listener
    const cancelBtn = progressPopup.querySelector('#cancel-rerender-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        isRerenderCancelled = true;
        cancelBtn.disabled = true;
        cancelBtn.style.background = '#95a5a6';
        cancelBtn.textContent = 'Cancelling...';
        console.log('[DEBUG] User cancelled re-render process');
      });
      
      // Add hover effect
      cancelBtn.addEventListener('mouseenter', () => {
        if (!cancelBtn.disabled) cancelBtn.style.background = '#c0392b';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        if (!cancelBtn.disabled) cancelBtn.style.background = '#e74c3c';
      });
    }
    
    // Force UI update before starting processing
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Process only NFTs with violations
      for (let i = 0; i < total; i++) {
        // Check if user cancelled
        if (isRerenderCancelled) {
          console.log('[DEBUG] Re-render cancelled by user at NFT #' + (i + 1));
          break;
        }
        
        const { seedObj, index: originalIndex } = nftsWithViolations[i];
        
        try {
          // This NFT definitely has violations (we just scanned for it)
          const hadViolationsBefore = true;
          
          // STEP 1: DELETE old image from memory completely
          // Clear from seedList (use originalIndex)
          if (this.seedList[originalIndex].thumbnail) {
            delete this.seedList[originalIndex].thumbnail;
          }
          
          // Clear from instance cache
          if (this.imageCache[seedObj.seed]) {
            delete this.imageCache[seedObj.seed];
          }
          
          // Clear from global cache
          if (window.savedSeedsImageCache && window.savedSeedsImageCache[seedObj.seed]) {
            delete window.savedSeedsImageCache[seedObj.seed];
          }
          
          // STEP 2: RE-GENERATE the NFT with updated stacking rules
          // Pass darkModeEnabled as false to ensure proper regeneration
          const nftData = await generateNftsModule.generateSingleNFT(projectData, false, seedObj.seed, false);
          
          if (nftData?.imageData) {
            // STEP 3: SAVE the new image to memory
            // Update thumbnail in seedList (using imageData, not thumbnail, use originalIndex)
            this.seedList[originalIndex].thumbnail = nftData.imageData;
            
            // Update BOTH caches - instance cache and global cache
            this.imageCache[seedObj.seed] = nftData.imageData;
            
            // CRITICAL: Also update the global cache that getImageForSeed() uses
            if (!window.savedSeedsImageCache) {
              window.savedSeedsImageCache = {};
            }
            window.savedSeedsImageCache[seedObj.seed] = nftData.imageData;
            
            // Check if this NFT still has violations after re-rendering
            const violations = generateNftsModule.checkForRuleViolations(nftData, projectData.rules);
            const hasViolations = violations && violations.length > 0;
            
            if (!hasViolations) {
              // NFT is now clean! Remove from violations cache
                this.violationsCache.delete(seedObj.seed);
                this.saveViolationsCache();
                fixedViolations++;
            } else {
              // Still has violations - keep in cache
              this.violationsCache.set(seedObj.seed, true);
              this.saveViolationsCache();
            }
            
            // Update the card in the current view if visible
            const card = this.modal?.querySelector(`[data-seed="${seedObj.seed}"]`);
            if (card) {
              const thumbnail = card.querySelector('.seed-card-thumbnail');
              if (thumbnail) {
                // Preserve rarity and number displays
                const existingRarity = thumbnail.querySelector('.seed-card-rarity');
                const existingNumber = thumbnail.querySelector('.seed-card-number-display');
                const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
                const numberHTML = existingNumber ? existingNumber.outerHTML : '';
                
                // Clear the old image from screen
                const oldImg = thumbnail.querySelector('img');
                if (oldImg) {
                  oldImg.remove();
                }
                
                // Show temporary loading placeholder while re-rendering
                thumbnail.innerHTML = rarityHTML + numberHTML + '<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; color: #95a5a6; font-size: 12px;">Re-rendering...</div>';
                await new Promise(resolve => setTimeout(resolve, 50)); // Brief pause to show deletion
                
                // Remove any forbidden signs if violations are fixed
                const forbiddenSign = thumbnail.querySelector('.violation-indicator');
                if (forbiddenSign && !hasViolations) {
                  forbiddenSign.remove();
                }
                
                // Create new image element with timestamp to prevent browser caching
                const timestamp = Date.now();
                const newImg = document.createElement('img');
                newImg.src = nftData.imageData;
                newImg.alt = 'NFT Preview';
                newImg.dataset.updated = timestamp;
                newImg.style.opacity = '0'; // Start invisible for fade-in effect
                
                // Update thumbnail with new image while preserving overlays
                thumbnail.innerHTML = rarityHTML + numberHTML;
                thumbnail.insertBefore(newImg, thumbnail.firstChild);
                
                // CRITICAL: Force browser to recognize new image with fade-in transition
                void newImg.offsetHeight; // Force reflow
                requestAnimationFrame(() => {
                  newImg.style.transition = 'opacity 0.6s ease-in-out';
                  newImg.style.opacity = '1'; // Fade in
                });
                
                // Show success indicator if violations were fixed
                if (!hasViolations && hadViolationsBefore) {
                  this.showFixSuccessIndicator(thumbnail);
                }
              }
            }
          } else {
            console.error(`[DEBUG] Failed to generate NFT #${i + 1}, no imageData returned`);
          }
          
          processed++;
          
          // Update progress on every NFT (not every 10) to show real-time updates
          const percentage = Math.floor((processed / total) * 100);
            const percentageEl = progressPopup.querySelector('#rerender-percentage');
            const processedEl = progressPopup.querySelector('#rerender-processed');
            const fixedCountEl = progressPopup.querySelector('#rerender-fixed-count');
            const etaEl = progressPopup.querySelector('#rerender-eta');
          
          // Update percentage display
          if (percentageEl) {
              // Update only the text node, preserve the animated dots HTML
              const dotsHTML = percentageEl.querySelector('.scan-dots');
              if (dotsHTML && percentageEl.childNodes[0]) {
                percentageEl.childNodes[0].textContent = `${percentage}%`;
              } else {
            percentageEl.textContent = `${percentage}%`;
              }
            }
            
          // Update processed count
            if (processedEl) {
              processedEl.textContent = processed;
            }
          
          // Update fixed violations count
          if (fixedCountEl) {
            fixedCountEl.textContent = fixedViolations;
          }
          
          // Calculate and display ETA at 1%, then 5%, then every 5% increment
            if (etaEl) {
              const currentPercentage = Math.floor((processed / total) * 100);
              const currentMilestone = Math.floor(currentPercentage / 5) * 5;
              
              // Update ETA when we reach 1%, 5%, or any new 5% milestone
              const shouldUpdateETA = (currentPercentage >= 1 && rerenderLastPercentageMilestone === 0) || 
                                      (currentMilestone >= 5 && currentMilestone > rerenderLastPercentageMilestone);
              
              if (shouldUpdateETA && processed < total) {
                rerenderLastPercentageMilestone = currentMilestone > 0 ? currentMilestone : 1;
                
                const elapsedMs = Date.now() - rerenderStartTime;
                const avgTimePerNFT = elapsedMs / processed;
                const remainingNFTs = total - processed;
                const estimatedRemainingMs = avgTimePerNFT * remainingNFTs;
                
                // Format time remaining (hours and minutes only)
                const totalMinutes = Math.ceil(estimatedRemainingMs / 60000);
                let timeText;
                if (totalMinutes < 60) {
                  timeText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
                } else {
                  const hours = Math.floor(totalMinutes / 60);
                  const minutes = totalMinutes % 60;
                  if (minutes > 0) {
                    timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                  } else {
                    timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
                  }
                }
                
                etaEl.textContent = `Estimated time remaining: ${timeText}`;
              } else if (processed >= total) {
                etaEl.textContent = 'Completing...';
            }
          }
          
        } catch (error) {
          console.error(`[DEBUG] Failed to re-render seed ${seedObj.seed}:`, error);
          processed++;
          
          // Still need to update progress display even on error
          const percentage = Math.floor((processed / total) * 100);
          const percentageEl = progressPopup.querySelector('#rerender-percentage');
          const processedEl = progressPopup.querySelector('#rerender-processed');
          
          if (percentageEl) {
            const dotsHTML = percentageEl.querySelector('.scan-dots');
            if (dotsHTML && percentageEl.childNodes[0]) {
              percentageEl.childNodes[0].textContent = `${percentage}%`;
            } else {
              percentageEl.textContent = `${percentage}%`;
            }
          }
          
          if (processedEl) {
            processedEl.textContent = processed;
          }
        }
        
        // Force DOM update by yielding to browser's event loop
        // This ensures progress is visible in real-time
        await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 0)));
      }
      
      // FINAL STEP: Save all re-rendered NFTs to localStorage
      console.log('[DEBUG] ==========================================');
      console.log('[DEBUG] 💾 FINAL STEP: Saving all re-rendered NFTs to localStorage...');
      console.log('[DEBUG] ==========================================');
      
      // Try to save the updated seed list with new thumbnails
      // Wrap in try-catch to handle potential localStorage quota issues
      try {
        this.saveSeedList();
        console.log('[DEBUG] ✅ Seed list saved successfully to localStorage');
        console.log('[DEBUG]    Total NFTs in collection: ' + this.seedList.length);
        console.log('[DEBUG]    NFTs re-rendered: ' + total);
        console.log('[DEBUG]    NFTs fixed (violations removed): ' + fixedViolations);
      } catch (saveError) {
        console.warn('[DEBUG] ⚠️ Could not save seed list to localStorage (possibly quota exceeded):', saveError.message);
        console.log('[DEBUG] Images are cached in memory and will be regenerated on demand if needed');
      }
      
      // Violations cache has been updated throughout the process (individually for each NFT)
      // Final save to ensure all changes are persisted
      try {
        this.saveViolationsCache();
        console.log('[DEBUG] ✅ Violations cache saved successfully to localStorage');
      } catch (cacheError) {
        console.warn('[DEBUG] ⚠️ Could not save violations cache:', cacheError.message);
      }
      
      console.log('[DEBUG] ==========================================');
      console.log('[DEBUG] ✅ RE-RENDER PROCESS COMPLETE!');
      console.log('[DEBUG] ==========================================');
      
      // CRITICAL: Reset cache staleness timestamps so the cache is considered fresh
      // Set both local AND global timestamps to NOW to mark the cache as fresh
      const now = Date.now();
      this.traitChangeTimestamp = now;
      this.ruleChangeTimestamp = now;
      window.traitChangeTimestamp = now;
      window.ruleChangeTimestamp = now;
      
      console.log('[DEBUG] Cache timestamps reset to:', now, 'to mark cache as fresh');
      
      // Update rarity status as outdated
      this.updateRarityStatus('outdated');
      
      // Remove progress popup
      progressPopup.remove();
      
      // Show success or cancellation message
      if (isRerenderCancelled) {
        // Process was cancelled - show partial results
        let cancelMessage = `Re-render cancelled. Processed ${processed} of ${total} NFTs`;
        if (fixedViolations > 0) {
          cancelMessage += `. Fixed ${fixedViolations} NFT(s) with rule violations! ✓`;
        }
        window.NFTApp.getModule('notificationService').show(cancelMessage, 'warning', 6000);
        console.log('[DEBUG] ========================================');
        console.log('[DEBUG] Re-rendering CANCELLED by user');
        console.log('[DEBUG] Processed:', processed, 'out of', total);
        console.log('[DEBUG] Fixed violations:', fixedViolations);
      } else {
        // Process completed normally
        let successMessage;
        if (forceAll) {
          successMessage = `✅ FORCE RE-RENDER COMPLETE!\n\nSuccessfully re-rendered all ${processed} NFTs in your collection.\n\n100% guaranteed consistency with current rules. Remember to save your project!`;
        } else {
          successMessage = `✅ SMART RE-RENDER COMPLETE!\n\nSuccessfully re-rendered ${processed} NFT(s)`;
        if (fixedViolations > 0) {
            successMessage += `.\n\nFixed ${fixedViolations} NFT(s) with stacking violations! Remember to save your project.`;
          }
        }
        window.NFTApp.getModule('notificationService').show(successMessage, 'success', 7000);
        console.log('[DEBUG] ========================================');
        console.log('[DEBUG] Re-rendering complete, refreshing page display');
        console.log('[DEBUG] Total thumbnails updated:', processed);
      }
      console.log('[DEBUG] seedList size:', this.seedList.length);
      console.log('[DEBUG] imageCache size:', Object.keys(this.imageCache || {}).length);
      console.log('[DEBUG] savedSeedsImageCache size:', Object.keys(window.savedSeedsImageCache || {}).length);
      
      // Log first few seeds to verify they were updated
      console.log('[DEBUG] First 5 NFTs in seedList:');
      for (let i = 0; i < Math.min(5, this.seedList.length); i++) {
        const seedObj = this.seedList[i];
        console.log(`  NFT #${i + 1}:`, {
          seed: seedObj.seed,
          hasThumbnail: !!seedObj.thumbnail,
          thumbnailLength: seedObj.thumbnail?.length || 0,
          inImageCache: !!this.imageCache[seedObj.seed],
          inGlobalCache: !!window.savedSeedsImageCache[seedObj.seed]
        });
      }
      console.log('[DEBUG] ========================================');
      
      // NO NEED to call renderPage() - cards were already updated during the loop!
      // Just refresh rarity displays to ensure they're still visible
      console.log('[DEBUG] Skipping renderPage() - cards already updated during re-render loop');
      console.log('[DEBUG] Refreshing rarity displays...');
      
      // Refresh rarity displays on all visible cards
      this.refreshRarityDisplayOnAllCards();
      
      console.log('[DEBUG] Re-rendering complete, display should now show updated thumbnails');
      
    } catch (error) {
      console.error('[DEBUG] Error during thumbnail re-rendering:', error);
      progressPopup.remove();
      window.NFTApp.getModule('notificationService').show('Error re-rendering thumbnails', 'error');
    }
  }

  // Check for specific NFT updates (like NFT #2)
  checkForSpecificNFTUpdates() {
    // Check if NFT #2 (index 1) exists and log its details
    if (this.seedList.length > 1 && this.seedList[1]) {
      const nft2 = this.seedList[1];
      
      // Check if this NFT has rule violations
      if (nft2.seed) {
        this.checkSeedForRuleViolations(nft2.seed).then(hasViolations => {
          // Violation check completed
        });
      }
    }
    
    // Check if there was a recent update
    if (window.editingSeedIndex !== undefined) {
      if (window.editingSeedIndex < this.seedList.length && this.seedList[window.editingSeedIndex]) {
        const updatedNFT = this.seedList[window.editingSeedIndex];
        // Updated NFT found
      }
    }
  }

  // Force refresh all modal data
  forceRefreshModalData() {
    // Always refresh when modal is opened to ensure latest data
    // NOTE: seedListKey should be set BEFORE calling this method
    console.log('[DEBUG] forceRefreshModalData called');
    console.log('[DEBUG] Current seedListKey:', this.seedListKey);
    console.log('[DEBUG] Current seedList.length:', this.seedList.length);
    
    // Clear any cached data
    this.seedList = [];
    this.currentPage = 1;
    
    // Force reload from localStorage
    this.loadSeedList();
    
    // Force refresh all images to ensure they're generated from current seeds
    this.forceImageRefresh = true;
    
    // If modal exists, re-render it
    if (this.modal) {
      this.renderPage(this.currentPage);
    }
  }

  show() {
    // Show loading popup immediately
    this.showLoadingPopup();
    
    // Force close any existing modal completely
    this.close();
    
    // Reset modal state
    this.modal = null;
    this.currentPage = 1;
    
    // CRITICAL FIX: Always recalculate seed list key to ensure it matches current project
    this.seedListKey = this.getSeedListKey();
    console.log('[DEBUG] Updated seedListKey:', this.seedListKey, 'for project:', window.currentProject?.name || 'unknown');
    
    // CRITICAL FIX: Immediately load the seed list with the correct key (force reload to get latest)
    this.loadSeedList(true); // Force reload to ensure we get the latest data from localStorage
    console.log('[DEBUG] After loadSeedList, seedList.length:', this.seedList.length);
    
    // Verify order is correct - log first and last few seeds
    if (this.seedList.length > 0) {
      console.log('[DEBUG] First 3 seeds:', this.seedList.slice(0, 3).map(s => typeof s === 'object' ? s.seed : s));
      console.log('[DEBUG] Last 3 seeds:', this.seedList.slice(-3).map(s => typeof s === 'object' ? s.seed : s));
    }
    
    // Load corrected NFTs state from localStorage
    this.loadCorrectedNFTsState();
    
    // Initialize rule tracking
    this.updateLastKnownRules();
    
    // Clear image cache to ensure fresh thumbnails
    if (!window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
    }
    
    // CRITICAL FIX: Clear all caches to force fresh NFT data
    this.clearImageCache();
    
    // Remove any existing modal first (double-check)
    const existing = document.getElementById('saved-seeds-modal');
    if (existing) {
      existing.remove();
    }
    
    // Create fresh modal
    this.createModal();
    
    // Update all counters
    window.updateAllCounters();
    
    // Also update the collection space counter specifically for this modal
    this.updateCollectionSpaceCounter();
    
    // Check for rule changes and notify user
    if (this.haveRulesChanged()) {
      console.log('[DEBUG] Rule changes detected when opening saved seeds modal');
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Rule changes detected! NFT thumbnails will be updated to reflect new stacking order.",
          "info",
          5000
        );
      }
    }
    
    // Ensure modal is fully created before proceeding
    if (!this.modal) {
      return;
    }
    
    // Double-check that the modal exists in the DOM
    if (!document.getElementById('saved-seeds-modal')) {
      this.modal = null;
      return;
    }
    
    // Small delay to ensure DOM is fully updated
    setTimeout(async () => {
      if (!this.modal) {
        this.hideLoadingPopup(); // Hide loading popup if modal creation failed
        return;
      }
      
      this.renderPage(1);
      this.setupEventListeners();
      
      // CRITICAL: Set up all tooltips in the modal with standard format
      this.setupAllTooltips();
      
      // Initialize tooltip content based on current mode
      this.updateRaritySearchTooltip();
      
      // Load rarity ranks from project data
      console.log('[DEBUG] Loading rarity ranks on modal open...');
      const rarityRanksLoaded = this.loadRarityRanks();
      
      console.log('[DEBUG] Load results:');
      console.log('[DEBUG] - rarityRanksLoaded:', rarityRanksLoaded);
      console.log('[DEBUG] - rarityRanks count after load:', Object.keys(this.rarityRanks).length);
      
      // Force refresh the current page to ensure latest data is displayed
      this.loadSeedList();
      
      // Initialize rarity status AFTER seedList is loaded (loads from project file)
      // CRITICAL: Must be called after loadSeedList() to ensure accurate collection size check
      this.initializeRarityStatus();
      this.rarityStatusInitialized = true; // Mark as initialized to allow consistency checks in renderPage
      this.rarityCalculationComplete = true;
      
      // Initialize trait rarities status AFTER seedList is loaded (loads from project file)
      // CRITICAL: Must be called after loadSeedList() to ensure accurate collection size check
      // Note: Trait Rarities and Rarity Rank statuses work independently
      this.initializeTraitRaritiesStatus();
      
      // Render page
      if (this.modal) {
        this.renderPage(this.currentPage);
        
        // Only display existing rarity ranks if toggle is enabled
        if (this.rarityRankEnabled) {
          this.renderPage(this.currentPage);
        }
        
        // Refresh any updated seeds in the display
        await this.refreshUpdatedSeeds();
        
        // Check for specific NFT updates
        this.checkForSpecificNFTUpdates();
        
        // Check for violations on the current page
        await this.checkViolationsForCurrentPage();
        
        // Ensure pagination is visible after modal is fully loaded
        this.ensurePaginationVisible();
        
        // CRITICAL: Force footer to be visible
        this.forceFooterVisible();
      }
      
      // Don't hide loading popup here - let renderPage() handle it after cards are rendered
      // The renderPage() function will hide the popup after the first page is fully rendered (line ~2451)
    }, 50);
  }

  showLoadingPopup() {
    console.log('[DEBUG] showLoadingPopup() called');
    // Remove any existing loading popup
    const existing = document.getElementById('loading-popup');
    if (existing) {
      existing.remove();
    }

    const loadingPopup = document.createElement('div');
    loadingPopup.id = 'loading-popup';
    loadingPopup.className = 'loading-popup';
    
    // Aggressive inline styles with !important - increased z-index to be above everything
    loadingPopup.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100vw !important;
      height: 100vh !important;
      background: rgba(0, 0, 0, 0.85) !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      z-index: 999999 !important;
      visibility: visible !important;
      opacity: 1 !important;
      pointer-events: all !important;
    `;
    
    loadingPopup.innerHTML = `
      <div class="loading-content" style="
        background: rgba(44, 62, 80, 0.98) !important;
        padding: 40px 60px !important;
        border-radius: 12px !important;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8) !important;
        text-align: center !important;
        border: 2px solid #6c5ce7 !important;
      ">
        <div class="loading-spinner" style="
          width: 60px !important;
          height: 60px !important;
          border: 4px solid rgba(108, 92, 231, 0.2) !important;
          border-top-color: #6c5ce7 !important;
          border-radius: 50% !important;
          animation: spin 0.8s linear infinite !important;
          margin: 0 auto 20px !important;
        "></div>
        <div class="loading-text" style="
          color: #ecf0f1 !important;
          font-size: 18px !important;
          font-weight: 500 !important;
          font-family: 'Archivo', sans-serif !important;
        ">Please Wait<span class="loading-dots" style="color: #6c5ce7 !important;">...</span></div>
      </div>
    `;
    
    document.body.appendChild(loadingPopup);
    console.log('[DEBUG] Loading popup added to DOM');
    
    // Force immediate display with reflow
    loadingPopup.offsetHeight; // Force reflow
    loadingPopup.style.display = 'flex';
    loadingPopup.style.visibility = 'visible';
    loadingPopup.style.opacity = '1';
    
        console.log('[DEBUG] Loading popup forced visible');
    console.log('[DEBUG] Popup z-index:', window.getComputedStyle(loadingPopup).zIndex);
    console.log('[DEBUG] Popup display:', window.getComputedStyle(loadingPopup).display);
  }

  hideLoadingPopup() {
    console.log('[DEBUG] hideLoadingPopup() called');
    const loadingPopup = document.getElementById('loading-popup');
    if (loadingPopup) {
      loadingPopup.remove();
      console.log('[DEBUG] Loading popup removed');
    }
  }

  loadSeedList(forceReload) {
    // Default parameter handling (ES5 compatible)
    if (forceReload === undefined) {
      forceReload = false;
    }
    
    try {
      // console.log('[DEBUG] Loading seed list with key:', this.seedListKey, 'forceReload:', forceReload);
      
      // Check if data already exists in memory (from previous modal opening)
      // CRITICAL: Only skip reload if forceReload is false AND we have data AND counts match
      // When loading from project file, always reload to ensure sync with localStorage
      if (!forceReload && this.seedList && this.seedList.length > 0) {
        // Double-check: if localStorage has different count, we should reload
        const stored = localStorage.getItem(this.seedListKey);
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length !== this.seedList.length) {
              console.log('[DEBUG] ⚠️ Seed count mismatch - localStorage has', parsed.length, 'but seedList has', this.seedList.length, '- forcing reload');
              forceReload = true; // Force reload if counts don't match
            }
          } catch (e) {
            // If we can't parse, continue to reload
          }
        }
        
        if (!forceReload) {
          // console.log('[DEBUG] seedList already exists in memory with', this.seedList.length, 'items, preserving it');
          // Load violations cache
          this.loadViolationsCache();
          return;
        }
      }
      
      // Get stored data from localStorage (or use value from check above)
      const stored = localStorage.getItem(this.seedListKey);
      // console.log('[DEBUG] Stored data from localStorage for key', this.seedListKey, ':', stored ? 'exists' : 'null');
      // console.log('[DEBUG] Stored data preview:', stored ? stored.substring(0, 200) : 'none');
      
      // Also check project data as fallback source
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      const projectSeeds = projectData?.savedSeeds || [];
      
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // console.log('[DEBUG] Parsed data length:', Array.isArray(parsed) ? parsed.length : 'not an array');
          
          // CRITICAL: Handle multiple seed formats (string, number, object)
          // Normalize all seeds to { seed: "..." } format
          const seedMap = new Map();
          const duplicatesRemoved = [];
          
          for (let i = 0; i < parsed.length; i++) {
            const seedEntry = parsed[i];
            let seedNumber = null;
            let seedObj = null;
            
            // Extract seed number from various formats
            if (typeof seedEntry === 'string' || typeof seedEntry === 'number') {
              // Plain string or number
              seedNumber = String(seedEntry);
              seedObj = { seed: seedNumber };
            } else if (seedEntry && seedEntry.seed) {
              // Object with seed property
              seedNumber = String(seedEntry.seed);
              seedObj = { seed: seedNumber };
            } else if (seedEntry && typeof seedEntry === 'object') {
              // Invalid format, skip it
              console.warn('[DEBUG] Skipping invalid seed entry:', seedEntry);
              continue;
            } else {
              // Null/undefined, skip
              continue;
            }
            
            // Check for duplicates
            if (seedMap.has(seedNumber)) {
              // Duplicate found
              duplicatesRemoved.push(seedNumber);
              // console.log('[DEBUG] Duplicate seed found and removed:', seedNumber);
            } else {
              // First occurrence - keep it
              seedMap.set(seedNumber, seedObj);
            }
          }
          
          // Convert map back to array (normalized format)
          // CRITICAL: Map preserves insertion order, so this maintains the original order from localStorage
          this.seedList = Array.from(seedMap.values());
          
          // Verify order is preserved by comparing with original parsed array
          if (parsed.length > 0 && this.seedList.length > 0) {
            const firstOriginalSeed = typeof parsed[0] === 'string' || typeof parsed[0] === 'number' 
              ? String(parsed[0]) 
              : (parsed[0] && parsed[0].seed ? String(parsed[0].seed) : null);
            const firstLoadedSeed = this.seedList[0]?.seed;
            
            if (firstOriginalSeed && firstLoadedSeed && firstOriginalSeed !== firstLoadedSeed) {
              console.warn('[DEBUG] ⚠️ ORDER MISMATCH DETECTED! First seed in parsed array:', firstOriginalSeed, 'but first in seedList:', firstLoadedSeed);
            }
          }
          
          if (duplicatesRemoved.length > 0) {
            // console.log('[DEBUG] Removed', duplicatesRemoved.length, 'duplicate seed(s):', duplicatesRemoved);
            // Save the cleaned list back to localStorage
            localStorage.setItem(this.seedListKey, JSON.stringify(this.seedList));
            // console.log('[DEBUG] Saved cleaned seed list to localStorage');
          }
          
          // console.log('[DEBUG] Loaded', this.seedList.length, 'unique seeds from localStorage');
        } catch (parseError) {
          console.error('[DEBUG] Error parsing seed list from localStorage:', parseError);
          console.error('[DEBUG] Corrupted data:', stored.substring(0, 200));
          // Clear corrupted data and start fresh
          localStorage.removeItem(this.seedListKey);
          this.seedList = [];
          console.log('[DEBUG] Cleared corrupted seed list data');
        }
      } else {
        console.log('[DEBUG] No data found in localStorage for key:', this.seedListKey);
        
        // CRITICAL: Fallback to project data if localStorage is empty
        if (projectSeeds && Array.isArray(projectSeeds) && projectSeeds.length > 0) {
          console.log('[DEBUG] Using project.savedSeeds as fallback, count:', projectSeeds.length);
          
          // Normalize project seeds to { seed: "..." } format
          const normalizedProjectSeeds = projectSeeds.map(seed => {
            if (typeof seed === 'string' || typeof seed === 'number') {
              return { seed: String(seed) };
            } else if (seed && seed.seed) {
              return { seed: String(seed.seed) };
            }
            return null;
          }).filter(seed => seed && seed.seed);
          
          this.seedList = normalizedProjectSeeds;
          
          // Try to save to localStorage for future use
          try {
            localStorage.setItem(this.seedListKey, JSON.stringify(normalizedProjectSeeds));
            console.log('[DEBUG] ✅ Saved normalized project seeds to localStorage');
          } catch (error) {
            console.warn('[DEBUG] Could not save project seeds to localStorage:', error);
          }
        } else {
          this.seedList = [];
          console.log('[DEBUG] No seeds found in localStorage or project data');
        }
      }
      
      // Load violations cache
      this.loadViolationsCache();
      
      // Check if there was a recent update and verify the seed is in the list
      if (window.editingOriginalSeed && window.editingSeedIndex !== undefined) {
        console.log('[DEBUG] Checking for updated seed from recent edit...');
        console.log('[DEBUG] Original seed was:', window.editingOriginalSeed);
        console.log('[DEBUG] Expected index:', window.editingSeedIndex);
        
        if (window.editingSeedIndex < this.seedList.length) {
          const currentSeed = this.seedList[window.editingSeedIndex].seed;
          console.log('[DEBUG] Current seed at index', window.editingSeedIndex, ':', currentSeed);
          
          if (currentSeed !== window.editingOriginalSeed) {
            console.log('[DEBUG] ✅ Seed was successfully updated in the list');
          } else {
            console.log('[DEBUG] ⚠️ Seed appears unchanged - update may not have worked');
          }
        } else {
          console.log('[DEBUG] ❌ Index out of bounds for updated seed check');
        }
      }
    } catch (error) {
      console.error('[DEBUG] Error loading seed list:', error);
      console.log('[DEBUG] Falling back to empty seedList');
      this.seedList = [];
    }
  }
  
  // Save violations cache to localStorage
  saveViolationsCache() {
    try {
      if (!this.violationsCache) return;
      
      // Convert Map to array of [key, value] pairs for JSON serialization
      const cacheArray = Array.from(this.violationsCache.entries());
      const cacheKey = this.seedListKey + '_violations';
      localStorage.setItem(cacheKey, JSON.stringify(cacheArray));
      console.log(`[DEBUG] Saved violations cache with ${cacheArray.length} entries`);
    } catch (error) {
      console.error('[DEBUG] Error saving violations cache:', error);
      // If storage fails, just continue - cache will be rebuilt
    }
  }
  
  // Load violations cache from localStorage
  loadViolationsCache() {
    try {
      const cacheKey = this.seedListKey + '_violations';
      const stored = localStorage.getItem(cacheKey);
      
      if (stored) {
        const cacheArray = JSON.parse(stored);
        this.violationsCache = new Map(cacheArray);
        console.log(`[DEBUG] Loaded violations cache with ${this.violationsCache.size} entries`);
      } else {
        this.violationsCache = new Map();
        console.log('[DEBUG] No violations cache found, initialized empty cache');
      }
    } catch (error) {
      console.error('[DEBUG] Error loading violations cache:', error);
      this.violationsCache = new Map();
    }
  }

  createModal() {
    // Remove existing modal
    const existing = document.getElementById('saved-seeds-modal');
    if (existing) existing.remove();

    // Create modal HTML
    this.modal = document.createElement('div');
    this.modal.id = 'saved-seeds-modal';
    this.modal.className = 'saved-seeds-modal';
    
    this.modal.innerHTML = `
      <div class="saved-seeds-overlay">
        <div class="saved-seeds-container">
          <div class="saved-seeds-header">
            <div class="saved-seeds-title-container">
              <h2 class="saved-seeds-title">NFTs Collection</h2>
              <div class="saved-seeds-tip">* View, edit, reorder, scan and<br>find any NFT on your collection.</div>
            </div>
            <button id="close-saved-seeds-modal" class="saved-seeds-close-btn">
              &times;
            </button>
            <div class="saved-seeds-actions">
              <button id="calculate-rarity-ranks" class="saved-seeds-btn calculate-rarity-btn tooltip">
                <span class="calculate-text">Calculate</span>
                <span class="rarity-text">Rarity Ranks</span>
                <span class="tooltiptext">Calculate rarity ranks for the entire<br>collection based on trait combinations.</span>
              </button>
              <div class="rarity-status-container">
                <div class="rarity-status-line1">Rarity Rank:</div>
                <div id="rarity-status-text" class="rarity-status-text">---</div>
              </div>
              <div class="rerender-btn-container">
                <button id="rerender-thumbnails" class="saved-seeds-btn rerender-btn tooltip">
                  <span class="rerender-text-line1">Calculate</span>
                  <span class="rerender-text-line2">Trait Rarities</span>
                  <span class="tooltiptext">Calculates trait rarities based on actual usage across your collection and updates them accordingly.</span>
                </button>
              </div>
              <div id="trait-Rarities-status-container" class="rarity-status-container">
                <div class="trait-rarities-status-line1">Trait Rarities:</div>
                <div id="trait-Rarities-status-text" class="rarity-status-text">---</div>
              </div>
              <div class="rarity-search-container">
                <label for="rarity-search-input" class="rarity-search-label tooltip" id="rarity-search-label" style="cursor: help;">Find Rarity:
                  <span class="tooltiptext">Click to toggle Between<br>Rarity and Position search.</span>
                </label>
                <div class="rarity-search-input-wrapper tooltip">
                  <input type="text" id="rarity-search-input" class="rarity-search-input" placeholder="Enter rarity rank or interval (e.g., 20 or 1-8)">
                  <span class="tooltiptext" id="rarity-search-tooltip">
                    Find Rarity: Enter a rarity rank number or<br>range to find NFTs with specific rarity ranks.<br><br>
                    For example, "20" finds the NFT with rank 20,<br>or "1-8" finds NFTs with ranks between 1 and 8.
                  </span>
                </div>
                <button id="search-rarity-btn" class="saved-seeds-btn search-rarity-btn tooltip">Search
                  <span class="tooltiptext">Run the search using the current mode ('Find Rarity'<br>or 'Find NFT #') and show matching NFTs.</span>
                </button>
                <button id="clear-search-btn" class="saved-seeds-btn clear-search-btn tooltip">Clear
                  <span class="tooltiptext">Clear the current search<br>and display all NFTs.</span>
                </button>
              </div>
              <div class="trait-search-container">
                <label for="trait-search-input" class="trait-search-label">Find Trait:</label>
                <div class="trait-search-input-wrapper tooltip">
                  <input type="text" id="trait-search-input" class="trait-search-input" placeholder="e.g., bandana, eyes, hat AND red, background OR eyes">
                  <span class="tooltiptext">
                    Search for words like "red" or multiple<br>words like "red hat" for precise results<br><br>
                    Advanced Search Options:<br>Use OR search with "hat OR cap" to<br>find traits matching either term.<br>
                    Complex Search Patters:<br>Use AND search with "hat AND red"<br>or comma separated terms like<br>"hat, red".<br><br>
                    <em>This powerful search functionality<br>works on both trait names and layer<br>names throughout the entire collection!</em>
                  </span>
                </div>
                <button id="search-trait-btn" class="saved-seeds-btn search-trait-btn tooltip" style="display: none;">Search
                  <span class="tooltiptext">Search NFTs by trait names and advanced operators.</span>
                </button>
                <button id="clear-trait-search-btn" class="saved-seeds-btn clear-trait-search-btn tooltip" style="display: none;">Clear
                  <span class="tooltiptext">Clear the trait search and restore the full list.</span>
                </button>
              </div>
              <div class="seeds-container">
                <label class="seeds-label">Seeds:</label>
                <button id="copy-all-seeds" class="saved-seeds-btn copy-all-btn tooltip">Copy
                  <span class="tooltiptext">Copy the entire collection seed<br>numbers to the clipboard</span>
                </button>
                <button id="import-seeds" class="saved-seeds-btn import-btn tooltip">Import
                  <span class="tooltiptext">Import a list of seeds from text<br>to populate the collection</span>
                </button>
                <button id="clear-storage" class="saved-seeds-btn clear-btn tooltip">Delete
                  <span class="tooltiptext">Delete all saved seeds for this project.<br>This action cannot be undone</span>
                </button>
              </div>
              <div class="violations-rules-container">
                <div class="violations-left-group">
                  <div class="violations-top-row">
                    <button id="filter-violations" class="saved-seeds-btn filter-violations-btn tooltip">Rule Violations NFTs
                      <span class="tooltiptext">Scan your collection for NFTs that<br>violate your combination rules.</span>
                    </button>
                    <button id="delete-all-violations" class="saved-seeds-btn delete-all-btn" disabled>Delete All</button>
                  </div>
                  <div class="auto-fix-toggle tooltip">
                    <label>
                      <input type="checkbox" id="auto-fix-violations" checked>
                      Auto-fix violations
                      <span class="tooltiptext">Automatically tries to fix violations by re-rendering NFTs with the correct trait stacking order. Only order-based issues can be fixed.</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div id="saved-seeds-grid" class="saved-seeds-grid">
            <!-- NFT cards will be inserted here -->
          </div>
          <div class="saved-seeds-footer">
            <!-- Pagination with embedded counters -->
            <div id="saved-seeds-pagination" class="saved-seeds-pagination">
              <!-- Pagination will be inserted here -->
            </div>
            
            <!-- Collection Space Counter - Outside pagination container for better alignment -->
            <div id="saved-seeds-collection-space-counter" class="collection-space-counter">
              <div class="space-counter-content">
                <div class="space-counter-title">Collection Space</div>
                <div class="space-counter-value">
                  <span id="saved-seeds-available-space">0</span> / <span id="saved-seeds-total-space">0</span>
                </div>
                <div class="space-counter-label">NFTs Available</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Store instance reference for global access
    this.modal.savedSeedsModalInstance = this;
    
    document.body.appendChild(this.modal);
    console.log('[DEBUG] Modal created and appended to body');
    
    // Verify the modal was properly created
    if (!this.modal || !document.getElementById('saved-seeds-modal')) {
      console.error('[DEBUG] Modal creation failed - modal not found in DOM');
      this.modal = null;
      return;
    }
    
    console.log('[DEBUG] Modal successfully created and verified');
    
    // CRITICAL: Force footer to be visible immediately after creation
    setTimeout(() => {
      this.forceFooterVisible();
    }, 100);
  }

  setupEventListeners() {
    if (!this.modal) {
      console.error('[DEBUG] Modal not created yet, cannot setup event listeners');
      return;
    }
    
    // CRITICAL FIX: Set up event delegation for robust NFT card interactions
    this.setupEventDelegation();
    
    // Close modal
    this.modal.querySelector('#close-saved-seeds-modal').onclick = () => {
      // Prevent closing if scan is ACTIVELY in progress (scan popup is visible)
      const scanPopupActive = document.getElementById('scan-progress-popup');
      if (scanPopupActive) {
        window.NFTApp.getModule('notificationService').show(
          'Please cancel the scan process first before closing the modal',
          'warning'
        );
        return;
      }
      this.close();
    };
    
    // Calculate rarity ranks for all NFTs
    this.modal.querySelector('#calculate-rarity-ranks').onclick = async () => {
      console.log('[DEBUG] Calculate Rarity Rank button clicked');
      
      const button = this.modal.querySelector('#calculate-rarity-ranks');
      const calculateText = button.querySelector('.calculate-text');
      const rarityText = button.querySelector('.rarity-text');
      
      // Store original text
      const originalCalculateText = calculateText.textContent;
      const originalRarityText = rarityText.textContent;
      
      // Show loading state
      button.disabled = true;
      calculateText.textContent = 'Calculating';
      rarityText.textContent = '...';
      button.style.opacity = '0.7';
      
      try {
        // Force recalculation when button is clicked
        await this.calculateRarityRanks(true);
        console.log('[DEBUG] Calculate Rarity Rank completed');
        
        // Check if calculation was cancelled - if so, don't show success or update button
        if (this.rarityCalculationCancelled) {
          console.log('[DEBUG] Calculate Rarity Rank was cancelled - not showing success message or updating button state');
          return;
        }
        
        // Mark calculate button as updated (rarity ranks have been calculated)
        this.updateButtonState('calculate', true);
        
        // Show success popup
        this.showSuccessPopup("Rarity ranks successfully calculated for all NFTs in your collection!");
        
        // Re-render the page to show the results
        this.renderPage(this.currentPage);
        
      } catch (error) {
        console.error('[DEBUG] Error in calculateRarityRanks:', error);
        
        // Show error notification
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Error calculating rarity ranks. Please try again.", "error", 3000);
        }
      } finally {
        // Restore button state
        button.disabled = false;
        calculateText.textContent = originalCalculateText;
        rarityText.textContent = originalRarityText;
        button.style.opacity = '1';
        // CRITICAL: Re-setup tooltip after button is restored to ensure it works
        const tooltipText = button.querySelector('.tooltiptext');
        if (tooltipText) {
          const tooltipManagerRestore = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
          if (tooltipManagerRestore && tooltipManagerRestore.setupTooltip) {
            button.removeAttribute('data-tooltip-setup');
            tooltipManagerRestore.setupTooltip(button, tooltipText);
          }
        }
      }
    };
    
    // Rarity/Position search toggle
    const raritySearchLabel = this.modal.querySelector('#rarity-search-label');
    const raritySearchInput = this.modal.querySelector('#rarity-search-input');
    
    if (raritySearchLabel) {
      // Initialize visual state classes
      raritySearchLabel.classList.toggle('mode-rarity', this.raritySearchMode !== 'position');
      raritySearchLabel.classList.toggle('mode-position', this.raritySearchMode === 'position');
      raritySearchLabel.addEventListener('click', () => {
        this.toggleRaritySearchMode();
      });
    }
    
    // Rarity search functionality
    this.modal.querySelector('#search-rarity-btn').onclick = () => {
      if (this.raritySearchMode === 'rarity') {
        this.searchByRarity();
      } else {
        this.searchByPosition();
      }
    };
    this.modal.querySelector('#clear-search-btn').onclick = () => this.clearRaritySearch();
    
    // Add event listeners using the already declared raritySearchInput variable
    raritySearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        if (this.raritySearchMode === 'rarity') {
        this.searchByRarity();
        } else {
          this.searchByPosition();
        }
      }
    });
    
    // Update clear button state as user types
    raritySearchInput.addEventListener('input', () => {
      this.updateClearSearchButton();
    });

    // Trait search functionality
    const traitSearchInput = this.modal.querySelector('#trait-search-input');
    const traitSearchBtn = this.modal.querySelector('#search-trait-btn');
    const clearTraitSearchBtn = this.modal.querySelector('#clear-trait-search-btn');
    const rerenderBtnElement = this.modal.querySelector('#rerender-thumbnails');
    const violationsContainer = this.modal.querySelector('.violations-rules-container');
    const traitSearchContainer = this.modal.querySelector('.trait-search-container');
    
    console.log('[DEBUG] Trait search elements:', {
      input: !!traitSearchInput,
      searchBtn: !!traitSearchBtn,
      clearBtn: !!clearTraitSearchBtn,
      rerenderBtn: !!rerenderBtnElement
    });
    
    // Show/hide button based on input content and focus state
    if (traitSearchInput && rerenderBtnElement) {
      traitSearchInput.addEventListener('input', (e) => {
        const hasValue = e.target.value.trim().length > 0;
        console.log('[DEBUG] Trait input changed. Has value:', hasValue, 'Value:', e.target.value);
        
        if (traitSearchBtn) {
          traitSearchBtn.style.display = hasValue ? 'inline-block' : 'none';
        }
        if (clearTraitSearchBtn) {
          clearTraitSearchBtn.style.display = hasValue ? 'inline-block' : 'none';
        }
        
        // Hide/show re-render button based on trait search input state
        // Use setProperty with 'important' to override CSS !important rule
        console.log('[DEBUG] Setting rerender button display to:', hasValue ? 'none' : 'flex');
        if (hasValue) {
          rerenderBtnElement.style.setProperty('display', 'none', 'important');
        } else {
          rerenderBtnElement.style.setProperty('display', 'flex', 'important');
        }
        
        // Force reflow to ensure change is applied
        void rerenderBtnElement.offsetHeight;
      });
      // On focus inside the input or container, hide violations panel FIRST, then show Search and Clear buttons
      const showSearchButtons = () => {
        // Hide violations container first (CSS transition is 0.5s, so wait for it to complete)
        if (violationsContainer) {
          violationsContainer.classList.add('violations-hidden');
          // Force a reflow to ensure the hide operation starts
          void violationsContainer.offsetHeight;
          // Wait for the CSS transition (0.5s) to complete before showing buttons
          setTimeout(() => {
            if (traitSearchBtn) traitSearchBtn.style.display = 'inline-block';
            if (clearTraitSearchBtn) clearTraitSearchBtn.style.display = 'inline-block';
          }, 500); // Match the CSS transition duration
        } else {
          // If no violations container, show buttons immediately
          if (traitSearchBtn) traitSearchBtn.style.display = 'inline-block';
          if (clearTraitSearchBtn) clearTraitSearchBtn.style.display = 'inline-block';
        }
      };
      
      traitSearchInput.addEventListener('focus', showSearchButtons);
      if (traitSearchContainer) {
        traitSearchContainer.addEventListener('mousedown', showSearchButtons);
      }
      console.log('[DEBUG] Trait search input event listener attached successfully');
    } else {
      console.error('[DEBUG] Failed to attach trait search input listener - missing elements');
    }
    
    // Search button click
    traitSearchBtn.onclick = () => this.searchByTrait();
    
    // Clear button click
    clearTraitSearchBtn.onclick = () => this.clearTraitSearch();
    
    // Enter key to search
    traitSearchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && traitSearchInput.value.trim().length > 0) {
        this.searchByTrait();
      }
    });

    // Copy all seeds
    this.modal.querySelector('#copy-all-seeds').onclick = () => this.copyAllSeeds();
    
    // Import seeds
    this.modal.querySelector('#import-seeds').onclick = () => this.importSeeds();
    
    // Clear storage
    this.modal.querySelector('#clear-storage').onclick = () => this.clearStorage();
    
    // Filter violations
    this.modal.querySelector('#filter-violations').onclick = () => this.filterViolations();
    
    // Delete all violations
    this.modal.querySelector('#delete-all-violations').onclick = () => this.deleteAllViolations();
    
    // Auto-fix checkbox
    const autoFixCheckbox = this.modal.querySelector('#auto-fix-violations');
    const autoFixToggle = this.modal.querySelector('.auto-fix-toggle');
    if (autoFixCheckbox) {
      autoFixCheckbox.addEventListener('change', (e) => {
        this.autoFixEnabled = e.target.checked;
        console.log('[DEBUG] Auto-fix', this.autoFixEnabled ? 'enabled' : 'disabled');
      });
      // Fade out violations panel when user focuses or clicks inside trait-search-container;
      // only fade back in when clicking outside the container
      if (violationsContainer && traitSearchContainer) {
        const showViolations = () => violationsContainer.classList.remove('violations-hidden');
        document.addEventListener('mousedown', (evt) => {
          if (!traitSearchContainer.contains(evt.target)) {
            // Hide buttons when leaving the area and show violations block
            if (traitSearchBtn) traitSearchBtn.style.display = 'none';
            if (clearTraitSearchBtn) clearTraitSearchBtn.style.display = 'none';
            showViolations();
          }
        });
      }
    }
    
    // Position auto-fix tooltip correctly with fixed positioning
    if (autoFixToggle) {
      const tooltip = autoFixToggle.querySelector('.tooltiptext');
      if (tooltip) {
        // CRITICAL: Use global tooltip manager for standard format
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(autoFixToggle, tooltip);
        }
      }
    }
    
    // Calculate Trait Rarities
    const rerenderBtn = this.modal.querySelector('#rerender-thumbnails');
    if (rerenderBtn) {
      // Remove any existing event listeners first
      const newRerenderBtn = rerenderBtn.cloneNode(true);
      rerenderBtn.parentNode.replaceChild(newRerenderBtn, rerenderBtn);
      const freshRerenderBtn = this.modal.querySelector('#rerender-thumbnails');
      
      // CRITICAL: Set up tooltip for Calculate Trait Rarities button after cloning
      // This ensures the tooltip is positioned correctly (above and horizontally centered)
      const rerenderTooltipText = freshRerenderBtn.querySelector('.tooltiptext');
      if (rerenderTooltipText) {
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          // Remove data-tooltip-setup attribute to allow re-setup after cloning
          freshRerenderBtn.removeAttribute('data-tooltip-setup');
          tooltipManager.setupTooltip(freshRerenderBtn, rerenderTooltipText);
        }
      }
      
      freshRerenderBtn.addEventListener('click', async (e) => {
        // Prevent action if button is disabled, but allow tooltip to show
        if (freshRerenderBtn.disabled) {
          e.preventDefault();
          e.stopPropagation();
          console.log('[DEBUG] Recalculate button is disabled');
          return;
        }
        console.log('[DEBUG] CALCULATE TRAIT RARITIES BUTTON CLICKED!');
        
        // Get text elements
        const line1 = freshRerenderBtn.querySelector('.rerender-text-line1');
        const line2 = freshRerenderBtn.querySelector('.rerender-text-line2');
        
        // Store original text
        const originalLine1 = line1 ? line1.textContent : '';
        const originalLine2 = line2 ? line2.textContent : '';
        
        // Show loading state
        if (line1) line1.textContent = 'Calculating';
        if (line2) line2.textContent = '...';
        freshRerenderBtn.disabled = true;
        freshRerenderBtn.style.opacity = '0.7';
        freshRerenderBtn.style.cursor = 'not-allowed';
        
        try {
          await this.recalculateTraitRarities();
          console.log('[DEBUG] Calculate trait rarities completed successfully');
        } catch (error) {
          console.error('[DEBUG] Error in recalculateTraitRarities:', error);
          // Show error notification to user
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show(
              `Error recalculating trait rarities: ${error.message || 'Unknown error'}`,
              "error",
              5000
            );
          }
        } finally {
          // Restore button state
          if (line1) line1.textContent = originalLine1;
          if (line2) line2.textContent = originalLine2;
          freshRerenderBtn.disabled = false;
          freshRerenderBtn.style.opacity = '1';
          freshRerenderBtn.style.cursor = 'pointer';
          // Re-check button state after completion
          this.updateRecalculateButtonState();
        }
      });
      // Update button state based on collection completeness
      this.updateRecalculateButtonState();
      console.log('[DEBUG] Calculate Trait Rarities button event listener attached');
    } else {
      console.error('[DEBUG] Calculate Trait Rarities button not found!');
    }
    
    // Rarity status is now always visible - no toggle needed
    
    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        this.close();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // CRITICAL: Set up all tooltips in the saved seeds modal with standard format
  setupAllTooltips() {
    if (!this.modal) return;
    
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
    
    // List of all tooltip elements in the modal
    const tooltipSelectors = [
      '#close-saved-seeds-modal',
      '#calculate-rarity-ranks',
      '#rerender-thumbnails',
      '#search-rarity-btn',
      '#clear-search-btn',
      '#search-trait-btn',
      '#clear-trait-search-btn',
      '#copy-all-seeds',
      '#import-seeds',
      '#clear-storage',
      '#filter-violations',
      '.auto-fix-toggle',
      '.rarity-search-label',
      '.rarity-search-input-wrapper',
      '.trait-search-input-wrapper',
      '.seed-card-btn',
      '.seed-desc-btn'
    ];
    
    tooltipSelectors.forEach(selector => {
      const elements = this.modal.querySelectorAll(selector);
      elements.forEach(element => {
        if (element.classList.contains('tooltip')) {
          const tooltipText = element.querySelector('.tooltiptext');
          if (tooltipText) {
            // Apply standard tooltip styling
            tooltipText.style.setProperty('background-color', '#000000', 'important');
            tooltipText.style.setProperty('background', '#000000', 'important');
            tooltipText.style.setProperty('color', '#f39c12', 'important');
            tooltipText.style.setProperty('z-index', '2147483647', 'important');
            tooltipText.style.setProperty('position', 'fixed', 'important');
            tooltipText.style.setProperty('transition', 'opacity 1s ease', 'important');
            
            // Use global tooltip manager if available
            if (tooltipManager && tooltipManager.setupTooltip) {
              tooltipManager.setupTooltip(element, tooltipText);
            } else if (generateNftsUI && generateNftsUI.setupTooltipPositioning) {
              // Fallback to generateNftsUI setupTooltipPositioning
              generateNftsUI.setupTooltipPositioning(element, tooltipText);
            }
          }
        }
      });
    });
    
    // Also set up tooltips for seed card buttons (they're created dynamically)
    // This will be called when cards are created, but we also set it up here for existing cards
    const seedCardButtons = this.modal.querySelectorAll('.seed-card-btn.tooltip');
    seedCardButtons.forEach(btn => {
      const tooltipText = btn.querySelector('.tooltiptext');
      if (tooltipText) {
        // Apply standard tooltip styling
        tooltipText.style.setProperty('background-color', '#000000', 'important');
        tooltipText.style.setProperty('background', '#000000', 'important');
        tooltipText.style.setProperty('color', '#f39c12', 'important');
        tooltipText.style.setProperty('z-index', '2147483647', 'important');
        tooltipText.style.setProperty('position', 'fixed', 'important');
        tooltipText.style.setProperty('transition', 'opacity 1s ease', 'important');
        
        // Use global tooltip manager if available
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(btn, tooltipText);
        } else if (generateNftsUI && generateNftsUI.setupTooltipPositioning) {
          generateNftsUI.setupTooltipPositioning(btn, tooltipText);
        }
      }
    });
  }

  renderPage(page) {
    console.log('[DEBUG] ===== RENDER PAGE CALLED =====');
    console.log('[DEBUG] Page:', page, 'rarityRankEnabled:', this.rarityRankEnabled);
    
    // Cancel any ongoing rendering for a different page
    if (this.currentRenderPage && this.currentRenderPage !== page) {
      console.log('[DEBUG] Cancelling previous render for page:', this.currentRenderPage);
      this.renderCancelled = true;
      this.cancelPendingThumbnails();
    }
    
    // Set current render page and reset cancellation flag
    this.currentRenderPage = page;
    this.renderCancelled = false;
    
    if (!this.modal) {
      console.error('[DEBUG] Modal not created yet, cannot render page');
      return;
    }
    
    // CRITICAL FIX: Force NFT update on page change to avoid visual errors
    const isPageChange = page !== this.currentPage;
    if (isPageChange) {
      console.log('[DEBUG] Page change detected - forcing NFT data refresh');
      this.forceImageRefresh = true; // Force image refresh for all NFTs on this page
      this.clearImageCache(); // Clear cached images to ensure fresh data
    }
    
    // Show loading popup for page navigation (except for initial page load)
    if (page !== this.currentPage && this.currentPage !== 1) {
      console.log('[DEBUG] Showing loading popup for page navigation from', this.currentPage, 'to', page);
      this.showLoadingPopup();
    }
    
    const grid = this.modal.querySelector('#saved-seeds-grid');
    const pagination = this.modal.querySelector('#saved-seeds-pagination');
    
    if (!grid || !pagination) {
      console.error('[DEBUG] Grid or pagination elements not found in modal');
      return;
    }
    
    if (!this.seedList.length) {
      grid.innerHTML = '<div class="no-seeds">No saved seeds found.</div>';
      // Don't clear pagination - show empty message instead
      this.createPagination(0, pagination);
      return;
    }

    // Ensure rarity status reflects current data shape (deletions/additions)
    // CRITICAL: Only check consistency AFTER initial status has been loaded from project file
    // This prevents incorrectly marking as outdated when just opening/closing the modal
    // Only mark as outdated if there's a REAL mismatch and the status is currently "updated"
    // NOTE: This check only runs during renderPage AFTER initialization, not during initial modal open
    if (this.rarityStatusInitialized) {
      try {
        const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
        const currentStatus = projectData?.rarityStatus || localStorage.getItem(`rarityStatus_${this.getProjectName()}`);
        
        // Only run consistency check if status is currently "updated" (not already outdated)
        // This prevents overriding a freshly loaded status unnecessarily
        if (currentStatus === 'updated') {
          const seedsCount = this.seedList ? this.seedList.length : 0;
          const savedCollectionSize = projectData?.rarityStatusCollectionSize;
          
          // CRITICAL FIX: Use savedCollectionSize which is saved in the project file
          // This is more reliable than comparing this.rarityRanks (which may not be loaded yet)
          // Only mark as outdated if savedCollectionSize exists and doesn't match current count
          // AND seedsCount > 0 (seedList is loaded)
          if (savedCollectionSize !== undefined && seedsCount > 0 && seedsCount !== savedCollectionSize) {
            console.log('[DEBUG] Rarity status: collection size changed since last update:', {
              savedCollectionSize,
              currentCollectionSize: seedsCount,
              currentStatus
            });
            // Only update if there's a real difference (NFTs were added/deleted)
            this.updateRarityStatus('outdated');
          }
          // REMOVED: ranksCount check - not reliable since this.rarityRanks may not be loaded yet
          // The savedCollectionSize check is sufficient and more reliable
        }
      } catch (e) {
        console.warn('[DEBUG] Rarity status consistency check failed:', e);
      }
    }

    // CRITICAL: Ensure seedList is up-to-date before rendering any page
    // Reload from localStorage if we suspect the data might be stale (especially when navigating to last page)
    if (!this.isFilteringViolations && !this.isFilteringByRarity && !this.isFilteringByPosition && !this.isFilteringByTrait && !this.isInConflictView) {
      // Not in filtered mode - verify seedList is current
      const seedListKey = this.seedListKey || this.getSeedListKey();
      try {
        const latestSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
        if (Array.isArray(latestSeeds) && latestSeeds.length !== this.seedList.length) {
          console.log('[DEBUG] ⚠️ Seed count mismatch detected! localStorage has', latestSeeds.length, 'but seedList has', this.seedList.length, '- reloading...');
          this.loadSeedList(true); // Force reload if count doesn't match
        } else if (latestSeeds.length > 0 && this.seedList.length > 0) {
          // Verify the last seed matches (to ensure order is correct)
          const lastLocalStorageSeed = typeof latestSeeds[latestSeeds.length - 1] === 'string' || typeof latestSeeds[latestSeeds.length - 1] === 'number'
            ? String(latestSeeds[latestSeeds.length - 1])
            : (latestSeeds[latestSeeds.length - 1]?.seed ? String(latestSeeds[latestSeeds.length - 1].seed) : null);
          const lastSeedListSeed = this.seedList[this.seedList.length - 1]?.seed;
          
          if (lastLocalStorageSeed && lastSeedListSeed && lastLocalStorageSeed !== lastSeedListSeed) {
            console.log('[DEBUG] ⚠️ Last seed mismatch detected! localStorage last:', lastLocalStorageSeed, 'but seedList last:', lastSeedListSeed, '- reloading...');
            this.loadSeedList(true); // Force reload if last seed doesn't match (order issue)
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error verifying seedList:', error);
      }
    }
    
    // Use filtered list if filtering is active OR if we have filtered results from a cancelled search OR if we're in conflict view
    const selectedList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.isInConflictView || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    // Ensure session-deleted seeds never render again in this session
    const currentList = selectedList.filter(s => !this.deletedSeedsSession.has(s.seed));
    
    console.log('[DEBUG] ===== RENDER PAGE - LIST SELECTION =====');
    console.log('[DEBUG] isFilteringViolations:', this.isFilteringViolations);
    console.log('[DEBUG] isFilteringByRarity:', this.isFilteringByRarity);
    console.log('[DEBUG] isInConflictView:', this.isInConflictView);
    console.log('[DEBUG] filteredSeedList.length:', this.filteredSeedList.length);
    console.log('[DEBUG] seedList.length:', this.seedList.length);
    console.log('[DEBUG] currentList selected:', selectedList === this.filteredSeedList ? 'FILTERED' : 'FULL');
    console.log('[DEBUG] currentList.length:', currentList.length);
    console.log('[DEBUG] First 3 seeds in currentList:', currentList.slice(0, 3).map(s => s.seed));
    
    if (!currentList.length) {
      console.log('[DEBUG] ⚠️ currentList is EMPTY!');
      if (this.isInConflictView) {
        grid.innerHTML = '<div class="no-seeds">No NFTs with rule conflicts found.</div>';
      } else if (this.isFilteringViolations) {
        grid.innerHTML = '<div class="no-seeds">No NFTs with rule violations found.</div>';
      } else if (this.isFilteringByRarity) {
        grid.innerHTML = '<div class="no-seeds">No NFTs found with the specified rarity rank.</div>';
      } else if (this.isFilteringByPosition) {
        grid.innerHTML = '<div class="no-seeds">No NFTs found at the specified positions.</div>';
      } else if (this.isFilteringByTrait) {
        grid.innerHTML = '<div class="no-seeds">No NFTs found with the specified trait.</div>';
      } else {
        grid.innerHTML = '<div class="no-seeds">No saved seeds found.</div>';
      }
      // Don't clear pagination - show empty message instead
      this.createPagination(0, pagination);
      return;
    }

    this.currentPage = page;
    const totalPages = Math.ceil(currentList.length / this.pageSize);
    const startIndex = (page - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, currentList.length);
    const pageSeeds = currentList.slice(startIndex, endIndex);

    console.log('[DEBUG] ===== RENDER PAGE DEBUG =====');
    console.log('[DEBUG] page:', page);
    console.log('[DEBUG] currentList.length:', currentList.length);
    console.log('[DEBUG] this.pageSize:', this.pageSize);
    console.log('[DEBUG] totalPages:', totalPages);
    console.log('[DEBUG] startIndex:', startIndex);
    console.log('[DEBUG] endIndex:', endIndex);
    console.log('[DEBUG] pageSeeds.length:', pageSeeds.length);
    console.log('[DEBUG] isFilteringViolations:', this.isFilteringViolations);
    console.log('[DEBUG] isFilteringByRarity:', this.isFilteringByRarity);
    console.log('[DEBUG] isInConflictView:', this.isInConflictView);
    console.log('[DEBUG] filteredSeedList.length:', this.filteredSeedList.length);
    console.log('[DEBUG] seedList.length:', this.seedList.length);

    console.log('[DEBUG] Rendering page', page, 'with', pageSeeds.length, 'seeds', this.isFilteringViolations ? '(filtered)' : '');
    console.log('[DEBUG] Page seeds (order check):', pageSeeds.map(s => s.seed));
    
    // CRITICAL: Verify order integrity for last page - ensure newly added NFTs appear last
    if (page === totalPages && !this.isFilteringViolations && !this.isFilteringByRarity && !this.isFilteringByPosition && !this.isFilteringByTrait && !this.isInConflictView) {
      // On last page, verify the seeds are in the correct order
      const lastIndex = currentList.length - 1;
      const expectedLastSeed = currentList[lastIndex]?.seed;
      const actualLastSeed = pageSeeds[pageSeeds.length - 1]?.seed;
      
      if (expectedLastSeed && actualLastSeed && expectedLastSeed !== actualLastSeed) {
        console.error('[DEBUG] ⚠️ CRITICAL ORDER ERROR: Last seed mismatch on last page!');
        console.error('[DEBUG] Expected last seed (from currentList):', expectedLastSeed, 'at index', lastIndex);
        console.error('[DEBUG] Actual last seed (from pageSeeds):', actualLastSeed);
        console.error('[DEBUG] currentList length:', currentList.length);
        console.error('[DEBUG] pageSeeds length:', pageSeeds.length);
        console.error('[DEBUG] startIndex:', startIndex, 'endIndex:', endIndex);
        
        // Force reload and re-render
        console.log('[DEBUG] Reloading seedList and re-rendering...');
        this.loadSeedList(true);
        const updatedCurrentList = this.seedList;
        const updatedTotalPages = Math.ceil(updatedCurrentList.length / this.pageSize);
        const updatedStartIndex = (updatedTotalPages - 1) * this.pageSize;
        const updatedEndIndex = updatedCurrentList.length;
        const updatedPageSeeds = updatedCurrentList.slice(updatedStartIndex, updatedEndIndex);
        
        console.log('[DEBUG] After reload - updated pageSeeds (last page):', updatedPageSeeds.map(s => s.seed));
        
        // Clear grid and render with corrected data
        grid.innerHTML = '';
        pageSeeds.length = 0;
        pageSeeds.push(...updatedPageSeeds);
      } else {
        // Order is correct - log for verification
        console.log('[DEBUG] ✅ Order verified: Last seed matches correctly on last page');
      }
    }

    // Clear grid and remove any existing drag mode
    grid.innerHTML = '';
    grid.classList.remove('drag-mode');
    
    // Clear dragged element references
    this.draggedElement = null;
    this.draggedIndex = null;

    // CRITICAL: Create all cards first, then append them in order to ensure correct display order
    // This ensures newly added NFTs appear last, even if their thumbnails load faster
    const cards = [];
    
    // Performance optimization: Build a Map for O(1) lookup when filtering
    // This avoids O(n) findIndex calls for each card
    let seedToIndexMap = null;
    if (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.filteredSeedList.length > 0) {
      seedToIndexMap = new Map();
      this.seedList.forEach((seed, idx) => {
        seedToIndexMap.set(seed.seed, idx);
      });
    }
    
    // Create NFT cards synchronously with cancellation support
    for (let i = 0; i < pageSeeds.length; i++) {
      // Check if rendering was cancelled
      if (this.renderCancelled) {
        console.log('[DEBUG] Rendering cancelled, stopping NFT card creation');
        return;
      }
      
      const seedObj = pageSeeds[i];
      const globalIndex = startIndex + i;
      
      // Check if this position should be empty during search
      if (this.emptyPositions.has(globalIndex)) {
        console.log(`[DEBUG] Position ${globalIndex} is marked as empty during search - creating empty placeholder`);
        const emptyCard = this.createEmptyCard(globalIndex);
        cards.push(emptyCard);
        continue;
      }
      
      // Find the original index in the main collection
      let originalIndex = startIndex + i;
      
      // If we're filtering, use the Map for O(1) lookup instead of O(n) findIndex
      if (seedToIndexMap) {
        const originalIndexInCollection = seedToIndexMap.get(seedObj.seed);
        if (originalIndexInCollection !== undefined) {
          originalIndex = originalIndexInCollection;
        }
      }
      
      console.log('[DEBUG] Creating NFT card for seed:', seedObj.seed, 'filtered index:', startIndex + i, 'original index:', originalIndex, 'rarityRankEnabled:', this.rarityRankEnabled);
      const card = this.createNFTCard(seedObj, originalIndex);
      
      // Check again if rendering was cancelled after card creation
      if (this.renderCancelled) {
        console.log('[DEBUG] Rendering cancelled after card creation, stopping');
        return;
      }
      
      // Store card in array at the correct position to maintain order
      cards.push(card);
    }
    
    // CRITICAL: Append all cards to grid in correct order (regardless of thumbnail load order)
    // This ensures newly added NFTs always appear last on the last page
    for (let i = 0; i < cards.length; i++) {
      grid.appendChild(cards[i]);
    }
    
    console.log('[DEBUG] All', cards.length, 'cards appended to grid in correct order');
    
    // Load thumbnails sequentially and initialize description buttons after each thumbnail loads
    // This ensures description buttons are only rendered after their thumbnails are complete
    this.loadThumbnailsAndInitializeButtons(cards, pageSeeds);
    
    // Drag and drop is now set up directly in createNFTCard method
    
    // Refresh rarity display after all cards are created (reduced delay since cards render faster now)
    setTimeout(() => {
      if (this.modal) {
        this.refreshRarityDisplayOnAllCards();
      }
    }, 50);

    // Initialize window start if not set
    if (!this.windowStart || this.windowStart < 1) {
      this.windowStart = Math.max(1, page); // Start window at the current page
      this.activePosition = 1; // Put active page at position 1
    }

    // Create pagination
    this.createPagination(totalPages, pagination);
    
    // Ensure pagination is visible after creation
    this.ensurePaginationVisible();
    
    // CRITICAL: Force footer to be visible
    this.forceFooterVisible();
    
    // Check violations for NFTs on this page (after rendering is complete)
    // Reduced timeout since cards now render much faster with parallel thumbnail loading
    setTimeout(() => {
      this.checkViolationsForCurrentPage();
      
      // Hide loading popup after page rendering is complete and cards are visible
      this.hideLoadingPopup();
      
      // CRITICAL FIX: Reset forceImageRefresh flag after page rendering is complete
      this.forceImageRefresh = false;
      console.log('[DEBUG] Page rendering complete - reset forceImageRefresh flag');
    }, 200);
  }

  // Create an empty placeholder card for deleted positions during search
  createEmptyCard(globalIndex) {
    const emptyCard = document.createElement('div');
    emptyCard.className = 'saved-seed-card empty-position';
    emptyCard.style.cssText = `
      width: 118px;
      height: 118px;
      background: #2a2a2a;
      border: 2px dashed #555;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      cursor: not-allowed;
      opacity: 0.5;
    `;
    
    // Add empty position indicator
    const emptyIndicator = document.createElement('div');
    emptyIndicator.style.cssText = `
      color: #666;
      font-size: 12px;
      text-align: center;
      line-height: 1.2;
    `;
    emptyIndicator.innerHTML = 'Empty<br>Position';
    emptyCard.appendChild(emptyIndicator);
    
    // Add custom tooltip
    emptyCard.removeAttribute('title');
    emptyCard.classList.add('tooltip');
    const emptyTooltip = document.createElement('span');
    emptyTooltip.className = 'tooltiptext';
    emptyTooltip.textContent = 'This position is empty due to NFT deletion during search. Close and reopen the modal to reset.';
    emptyCard.appendChild(emptyTooltip);
    
    return emptyCard;
  }

  // Check and add violation overlay to a specific card (page-based)
  async checkAndAddViolationOverlay(card, seed) {
    try {
      // Check cache first
      if (this.violationsCache.has(seed)) {
        const hasViolations = this.violationsCache.get(seed);
        if (hasViolations) {
          this.addViolationOverlayToCard(card);
        }
        return;
      }
      
      // Check for violations
      const hasViolations = await this.checkSeedForRuleViolations(seed);
      this.violationsCache.set(seed, hasViolations);
      this.saveViolationsCache();
      
      if (hasViolations) {
        this.addViolationOverlayToCard(card);
      }
    } catch (error) {
      console.error('Error checking violations for card:', seed, error);
    }
  }
  
  // Check violations for all NFTs on the current page
  async checkViolationsForCurrentPage() {
    if (!this.modal) return;
    
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) return;
    
    const cards = grid.querySelectorAll('.saved-seed-card');
    
    // Process cards one by one to avoid overwhelming the system
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i];
      const seedElement = card.querySelector('.seed-card-number');
      
      if (seedElement && seedElement.textContent) {
        const seed = seedElement.textContent.trim();
        await this.checkAndAddViolationOverlay(card, seed);
        
        // Small delay to keep UI responsive
        if (i < cards.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
  }
  
  // Add violation overlay to a specific card (using exact same symbol as NFT Traits modal)
  addViolationOverlayToCard(card) {
    const thumbnail = card.querySelector('.seed-card-thumbnail');
    if (thumbnail) {
      // Check if overlay already exists (check for tooltip wrapper or direct overlay)
      const existingTooltip = thumbnail.querySelector('.tooltip .seed-card-violation-overlay');
      const existingOverlay = thumbnail.querySelector('.seed-card-violation-overlay');
      if (!existingTooltip && !existingOverlay) {
        // Get the seed to check for violations
        const seedElement = card.querySelector('.seed-card-number');
        const seed = seedElement ? seedElement.textContent.trim() : null;
        
        // Create tooltip wrapper
        const tooltipWrapper = document.createElement('div');
        tooltipWrapper.className = 'tooltip';
        tooltipWrapper.style.position = 'absolute';
        tooltipWrapper.style.top = '50%';
        tooltipWrapper.style.left = '50%';
        tooltipWrapper.style.transform = 'translate(-50%, -50%)';
        tooltipWrapper.style.width = '40px';
        tooltipWrapper.style.height = '40px';
        tooltipWrapper.style.display = 'flex';
        tooltipWrapper.style.alignItems = 'center';
        tooltipWrapper.style.justifyContent = 'center';
        tooltipWrapper.style.pointerEvents = 'auto';
        tooltipWrapper.style.zIndex = '1000';
        tooltipWrapper.style.cursor = 'help';
        
        // Create violation overlay
        const violationOverlay = document.createElement('div');
        violationOverlay.className = 'seed-card-violation-overlay';
        violationOverlay.style.position = 'relative';
        violationOverlay.style.width = '40px';
        violationOverlay.style.height = '40px';
        violationOverlay.style.opacity = '1';
        violationOverlay.style.background = 'none';
        violationOverlay.style.borderRadius = '0';
        violationOverlay.style.display = 'flex';
        violationOverlay.style.alignItems = 'center';
        violationOverlay.style.justifyContent = 'center';
        violationOverlay.style.pointerEvents = 'none';
        
        // Use the exact same SVG as NFT Traits modal
        violationOverlay.innerHTML = `<svg width="40" height="40" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="30" cy="30" r="26" stroke="#ff2222" stroke-width="8" fill="none"/><line x1="15" y1="45" x2="45" y2="15" stroke="#ff2222" stroke-width="8" stroke-linecap="round"/></svg>`;
        
        // Create tooltip text
        const tooltipText = document.createElement('span');
        tooltipText.className = 'tooltiptext';
        tooltipText.textContent = 'This NFT violates one or more combination rules.';
        
        // Add tooltip text to wrapper
        tooltipWrapper.appendChild(violationOverlay);
        tooltipWrapper.appendChild(tooltipText);
        
        thumbnail.appendChild(tooltipWrapper);
      }
    }
  }

  // Check if a seed has rule violations
  async checkSeedForRuleViolations(seed) {
    try {
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject || null;
      
      if (!projectData || !projectData.rules || projectData.rules.length === 0) {
        return false; // No rules defined, no violations possible
      }
      
      // OPTIMIZATION: Check if traits are already in seedList (much faster!)
      const seedObj = this.seedList.find(s => s.seed === seed);
      let nft = null;
      
      if (seedObj && seedObj.traits && Array.isArray(seedObj.traits) && seedObj.traits.length > 0) {
        // Use cached traits - no need to generate!
        nft = { traits: seedObj.traits, seed: seed };
      } else {
        // Only generate if traits are missing
        nft = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, seed);
      }
      
      if (nft && nft.traits) {
        const violations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(nft, projectData.rules);
        
        // Additional validation to prevent false positives
        if (violations && violations.length > 0) {
          // Double-check each violation by re-running the rule check manually
          const validatedViolations = [];
          for (const violation of violations) {
            // Extract rule information from violation message
            if (violation.includes('should never be combined')) {
              const match = violation.match(/Traits "(.+?)" and "(.+?)" should never be combined/);
              if (match) {
                const [, trait1, trait2] = match;
                
                // Check if these traits actually exist in the NFT
                const hasTrait1 = nft.traits.some(t => 
                  t.trait && (t.trait.name === trait1 || t.trait.name === trait2)
                );
                const hasTrait2 = nft.traits.some(t => 
                  t.trait && (t.trait.name === trait1 || t.trait.name === trait2)
                );
                
                // Only add violation if both traits actually exist
                if (hasTrait1 && hasTrait2) {
                  validatedViolations.push(violation);
                }
              }
            } else {
              // For other violation types, keep them as-is
              validatedViolations.push(violation);
            }
          }
          
          // Use validated violations instead of original
          if (validatedViolations.length !== violations.length) {
            violations.length = 0;
            violations.push(...validatedViolations);
          }
        }
        
        // Return true if there are any violations (both ordering and combination rules)
        return violations && violations.length > 0;
      }
    } catch (error) {
      console.error('Error checking rule violations for seed:', seed, error);
    }
    return false;
  }

  // Refresh rule violation overlays for all visible cards
  async refreshRuleViolationOverlays() {
    if (!this.modal) {
      return;
    }
    
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      return;
    }
    
    const cards = grid.querySelectorAll('.saved-seed-card');
    
    // Process cards in batches to avoid blocking the UI
    const batchSize = 3;
    for (let i = 0; i < cards.length; i += batchSize) {
      const batch = Array.from(cards).slice(i, i + batchSize);
      
      // Process batch in parallel
      const promises = batch.map(async (card, batchIndex) => {
        const globalIndex = i + batchIndex;
        const seed = card.dataset.seed;
        
        if (seed) {
          const hasViolations = await this.checkSeedForRuleViolations(seed);
          
          const thumbnail = card.querySelector('.seed-card-thumbnail');
          const existingOverlay = thumbnail.querySelector('.seed-card-violation-overlay');
          
          if (hasViolations && !existingOverlay) {
            // Add violation overlay (using the new tooltip structure)
            this.addViolationOverlayToCard(card);
          } else if (!hasViolations && existingOverlay) {
            // Remove violation overlay (now wrapped in tooltip)
            const tooltipWrapper = existingOverlay.closest('.tooltip');
            if (tooltipWrapper) {
              tooltipWrapper.remove();
            } else {
              existingOverlay.remove();
            }
          }
        }
      });
      
      // Wait for batch to complete
      await Promise.all(promises);
      
      // Small delay between batches to keep UI responsive
      if (i + batchSize < cards.length) {
        await new Promise(resolve => setTimeout(resolve, 10));
      }
    }
  }

  createEmptyCard(globalIndex) {
    const card = document.createElement('div');
    card.className = 'saved-seed-card empty-card';
    card.dataset.empty = 'true';
    card.dataset.index = globalIndex;
    
    // Create empty placeholder content
    card.innerHTML = `
      <div class="seed-card-thumbnail">
        <div class="empty-placeholder">
          <div class="empty-icon">🗑️</div>
          <div class="empty-text">Deleted</div>
        </div>
      </div>
      <div class="seed-card-info">
        <div class="seed-card-number">Empty</div>
        <div class="seed-card-buttons">
          <button class="seed-card-btn disabled-btn" disabled>Empty</button>
        </div>
      </div>
    `;
    
    // Style the empty card
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
    card.style.cursor = 'default';
    
    return card;
  }


  createNFTCard(seedObj, index) {
    const card = document.createElement('div');
    card.className = 'saved-seed-card';
    card.dataset.seed = seedObj.seed;
    card.dataset.index = index;
    
    // Add drag and drop attributes
    card.draggable = true;
    card.dataset.dragIndex = index;

    // Always get rarity rank for this seed - CRITICAL: Display outdated ranks for user reference
    // Outdated ranks are still useful information even if calculation needs to be redone
    let rarityDisplay = '';
    const rarityRank = this.getRarityRank(seedObj.seed);
    
    // Show rank if it exists (even if outdated) - only show --- for NFTs that never had a rank calculated
    if (rarityRank !== null && rarityRank !== undefined && rarityRank !== '---' && typeof rarityRank === 'number') {
      rarityDisplay = `<div class="seed-card-rarity">rarity rank: ${rarityRank}</div>`;
      console.log('[DEBUG] Creating rarity display for seed:', seedObj.seed, 'rank:', rarityRank, '(may be outdated)');
    } else {
      rarityDisplay = `<div class="seed-card-rarity">---</div>`;
      console.log('[DEBUG] No rarity rank found for seed:', seedObj.seed, '- showing --- (NFT never had rank calculated)');
    }

    // Calculate NFT number based on global position in collection
    // The 'index' parameter is already the global index passed from renderPage
    const nftNumber = index + 1;
    const nftNumberDisplay = `<div class="seed-card-number-display">#${nftNumber}</div>`;
    // CRITICAL: Make ID unique per card to avoid duplicate IDs (use seed value for uniqueness)
    const nftDescriptionId = `nft-description-${seedObj.seed}`;

    card.innerHTML = `
      <div class="seed-card-thumbnail">
        <div class="seed-card-loading">Loading<span class="loading-dots">...</span><br>Please Wait.</div>
        ${rarityDisplay}
        ${nftNumberDisplay}
          <button id="${nftDescriptionId}" class="seed-desc-btn tooltip" data-action="edit-description" aria-label="Edit description">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M12 20h9"/>
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
            </svg>
            <span class="tooltiptext">Create or edit a description<br>for this NFT</span>
          </button>
      </div>
      <div class="seed-card-info">
        <div class="seed-card-number">${seedObj.seed}</div>
        <div class="seed-card-buttons">
          <button class="seed-card-btn edit-btn tooltip" data-action="edit">EDIT
            <span class="tooltiptext">Open this NFT to edit it's<br>traits and regenerate it.</span>
          </button>
          <button class="seed-card-btn copy-btn tooltip" data-action="copy">COPY
            <span class="tooltiptext">Copy this NFT's seed<br>to your clipboard</span>
          </button>
          <button class="seed-card-btn delete-btn tooltip" data-action="delete">DELETE
            <span class="tooltiptext">Delete this NFT from<br>your Collection</span>
          </button>
        </div>
      </div>
    `;
    
    // Ensure draggable is set after innerHTML
    card.draggable = true;
    card.style.cursor = 'grab';
    
    // Add drag event listeners directly to ensure they're attached
    this.setupCardDragAndDrop(card, index);
    
    // Debug: Check if rarity element was created
    if (rarityDisplay) {
      const thumbnail = card.querySelector('.seed-card-thumbnail');
      const rarityElement = thumbnail.querySelector('.seed-card-rarity');
      if (rarityElement) {
        console.log('[DEBUG] Rarity element created in card HTML:', rarityElement.outerHTML);
        console.log('[DEBUG] Thumbnail dimensions:', thumbnail.offsetWidth, 'x', thumbnail.offsetHeight);
      } else {
        console.error('[DEBUG] Rarity element not found in card HTML!');
      }
    }

    // CRITICAL FIX: Don't load thumbnail immediately - it will be loaded sequentially in renderPage
    // to maintain proper render order (preventing last added NFT from appearing before others)
    
    // CRITICAL FIX: Force NFT data refresh on page change
    if (this.forceImageRefresh) {
      console.log('[DEBUG] Force refreshing NFT data for seed:', seedObj.seed);
      this.refreshNFTData(card, seedObj.seed);
    }

    // Add click handler for full-size image popup
    const thumbnail = card.querySelector('.seed-card-thumbnail');
    thumbnail.addEventListener('click', async () => {
      try {
        const imageData = await this.getImageForSeed(seedObj.seed);
        if (imageData) {
          this.showLargePreview(imageData, seedObj.seed);
        } else {
          alert('No image available for this seed');
        }
      } catch (error) {
        console.error('Error showing large preview:', error);
        alert('Error loading image');
      }
    });

    // Add button event listeners
    this.setupCardButtons(card, seedObj, index);
    
    // CRITICAL: Set up tooltips for seed card buttons with standard format
    const seedCardButtons = card.querySelectorAll('.seed-card-btn.tooltip');
    const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
    const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
    
    seedCardButtons.forEach(btn => {
      const tooltipText = btn.querySelector('.tooltiptext');
      if (tooltipText) {
        // Apply standard tooltip styling
        tooltipText.style.setProperty('background-color', '#000000', 'important');
        tooltipText.style.setProperty('background', '#000000', 'important');
        tooltipText.style.setProperty('color', '#f39c12', 'important');
        tooltipText.style.setProperty('z-index', '2147483647', 'important');
        tooltipText.style.setProperty('position', 'fixed', 'important');
        tooltipText.style.setProperty('transition', 'opacity 1s ease', 'important');
        
        // Use global tooltip manager if available
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(btn, tooltipText);
        } else if (generateNftsUI && generateNftsUI.setupTooltipPositioning) {
          generateNftsUI.setupTooltipPositioning(btn, tooltipText);
        }
      }
    });

    // CRITICAL: Don't initialize description button here - it will be initialized after all thumbnails are loaded
    // This prevents the button from being covered by thumbnail images during rendering

    return card;
  }

  // Shared NFT card creation method for consistent styling across all modals
  static createUnifiedNFTCard(nft, index, options = {}) {
    const {
      showButtons = true,
      showDragDrop = false,
      showRarityRank = true,
      showNFTNumber = true,
      cardClass = 'unified-nft-card',
      size = 'normal', // 'normal', 'compact', 'large'
      globalIndex = null // Optional global index for NFT numbering
    } = options;

    const card = document.createElement('div');
    card.className = cardClass;
    card.dataset.seed = nft.seed;
    card.dataset.index = index;
    
    // Set size-specific styles
    if (size === 'compact') {
      card.style.width = '118px';
      card.style.height = '118px';
      card.style.minWidth = '118px';
      card.style.minHeight = '118px';
      card.style.maxWidth = '118px';
      card.style.maxHeight = '118px';
    } else if (size === 'large') {
      card.style.width = '200px';
      card.style.height = '200px';
    } else {
      // Normal size - use CSS defaults
    }

    // Add drag and drop attributes if enabled
    if (showDragDrop) {
      card.draggable = true;
      card.dataset.dragIndex = index;
      card.style.cursor = 'grab';
    }

    // Get rarity rank
    let rarityDisplay = '';
    if (showRarityRank) {
      const rarityRank = SavedSeedsModal.getRarityRankForNFT(nft, index);
      if (rarityRank && rarityRank !== '---') {
        rarityDisplay = `<div class="seed-card-rarity">rarity rank: ${rarityRank}</div>`;
      } else {
        rarityDisplay = `<div class="seed-card-rarity">---</div>`;
      }
    }

    // Calculate NFT number based on global position in collection
    let nftNumberDisplay = '';
    if (showNFTNumber) {
      // Use globalIndex if provided, otherwise calculate from current context
      const nftIndex = globalIndex !== null ? globalIndex : index;
      const nftNumber = nftIndex + 1;
      nftNumberDisplay = `<div class="seed-card-number-display">#${nftNumber}</div>`;
    }

    // Create buttons HTML
    let buttonsHTML = '';
    if (showButtons) {
      buttonsHTML = `
        <div class="seed-card-buttons">
          <button class="seed-card-btn edit-btn" data-action="edit">EDIT</button>
          <button class="seed-card-btn copy-btn" data-action="copy">COPY</button>
          <button class="seed-card-btn delete-btn" data-action="delete">DELETE</button>
        </div>
      `;
    }

    card.innerHTML = `
      <div class="seed-card-thumbnail">
        <div class="seed-card-loading">Loading<span class="loading-dots">...</span><br>Please Wait.</div>
        ${rarityDisplay}
        ${nftNumberDisplay}
      </div>
      <div class="seed-card-info">
        <div class="seed-card-number">${nft.seed}</div>
        ${buttonsHTML}
      </div>
    `;

    return card;
  }

  // Static method to get rarity rank for any NFT
  static getRarityRankForNFT(nft, index) {
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    
    if (!projectData || !projectData.rarityRanks) {
      return null;
    }

    // Try to find by seed first
    const seedIndex = projectData.savedSeeds?.findIndex(s => s.seed === nft.seed);
    if (seedIndex !== -1 && projectData.rarityRanks[seedIndex]) {
      return projectData.rarityRanks[seedIndex];
    }

    // Fallback to index-based lookup
    if (projectData.rarityRanks[index]) {
      return projectData.rarityRanks[index];
    }

    return null;
  }

  // Setup drag and drop for a single card
  setupCardDragAndDrop(card, index) {
    console.log('[DEBUG] Setting up drag and drop for card at index:', index);
    
    const globalIndex = parseInt(card.dataset.index);
    const seed = card.dataset.seed;
    
    if (globalIndex === undefined || !seed) {
      console.warn('[DEBUG] Invalid card data for drag and drop:', { globalIndex, seed });
      return;
    }
    
    // Prevent buttons from interfering with drag
    const buttons = card.querySelectorAll('.seed-card-btn');
    buttons.forEach(btn => {
      btn.addEventListener('mousedown', (e) => {
        e.stopPropagation();
      });
      
      btn.addEventListener('dragstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });
    });

    // Drag start event
    card.addEventListener('dragstart', (e) => {
      console.log('[DEBUG] ===== DRAG STARTED =====');
      console.log('[DEBUG] Card index:', globalIndex);
      console.log('[DEBUG] Card seed:', seed);
      console.log('[DEBUG] Event target:', e.target);
      console.log('[DEBUG] Card element:', card);
      
      e.dataTransfer.setData('text/plain', globalIndex.toString());
      e.dataTransfer.effectAllowed = 'move';
      
      // Add visual feedback
      card.classList.add('dragging');
      card.style.cursor = 'grabbing';
      
      // Store the dragged element
      this.draggedElement = card;
      this.draggedIndex = globalIndex;
      
      // Store original page for cross-page drag
      this.originalPage = this.currentPage;
      
      // Show drop zones between cards
      this.createDropZones();
      
      // Set up cross-page drag detection
      this.setupCrossPageDragDetection();
    });

    // Drag end event
    card.addEventListener('dragend', (e) => {
      console.log('[DEBUG] ===== DRAG ENDED =====');
      
      // Remove visual feedback
      card.classList.remove('dragging');
      card.style.cursor = 'grab';
      
      // Clear dragged element
      this.draggedElement = null;
      this.draggedIndex = null;
      
      // Clean up cross-page drag detection
      this.cleanupCrossPageDragDetection();
      
      // Hide drop zones
      this.removeDropZones();
    });
  }


  cancelPendingThumbnails() {
    console.log('[DEBUG] Cancelling pending thumbnails:', this.pendingThumbnails.size);
    this.pendingThumbnails.clear();
  }

  cancelCurrentRender() {
    console.log('[DEBUG] Cancelling current render for page:', this.currentRenderPage);
    this.renderCancelled = true;
    this.cancelPendingThumbnails();
  }

  // Load thumbnails sequentially to maintain proper render order
  async loadThumbnailsAndInitializeButtons(cards, pageSeeds) {
    console.log('[DEBUG] Loading thumbnails in parallel for', cards.length, 'cards');
    
    // Start loading all thumbnails immediately in parallel for maximum performance
    // The browser will handle loading order naturally, so no artificial delays needed
    const thumbnailPromises = [];
    
    for (let i = 0; i < cards.length; i++) {
      // Check if rendering was cancelled
      if (this.renderCancelled) {
        console.log('[DEBUG] Rendering cancelled, stopping thumbnail loading');
        return;
      }
      
      const card = cards[i];
      const seedObj = pageSeeds[i];
      
      if (!card || !seedObj) {
        console.warn('[DEBUG] Missing card or seedObj at index', i);
        continue;
      }
      
      // Start loading thumbnail for this card immediately (no delay)
      // All thumbnails will load in parallel for maximum speed
      const loadPromise = this.loadThumbnail(card, seedObj.seed, this.forceImageRefresh || false);
      thumbnailPromises.push(loadPromise);
    }
    
    // Don't wait for thumbnails to complete - let them load asynchronously
    // This allows the page to render immediately while images load in the background
    // The Promise.all is intentionally not awaited to prevent blocking
    Promise.all(thumbnailPromises).then(() => {
      console.log('[DEBUG] All thumbnails loaded');
    }).catch((error) => {
      console.warn('[DEBUG] Some thumbnails failed to load:', error);
    });
    
    console.log('[DEBUG] Thumbnail loading started in parallel (non-blocking)');
  }

  async loadThumbnail(card, seed, forceRefresh = false) {
    const thumbnail = card.querySelector('.seed-card-thumbnail');
    
    try {
      console.log('[DEBUG] Loading thumbnail for seed:', seed, 'forceRefresh:', forceRefresh);
      
      // If forceRefresh is true, temporarily mark cache as stale
      let originalTraitTimestamp = null;
      if (forceRefresh) {
        originalTraitTimestamp = this.traitChangeTimestamp;
        this.traitChangeTimestamp = 0; // Force cache to be considered stale
        console.log('[DEBUG] Force refresh enabled - bypassing cache');
      }
      
      const imageData = await this.getImageForSeed(seed);
      
      // Restore original timestamp if we temporarily changed it
      if (forceRefresh && originalTraitTimestamp !== null) {
        this.traitChangeTimestamp = originalTraitTimestamp;
      }
      
      console.log('[DEBUG] Image data result:', imageData ? 'Found' : 'Not found');
      
      // Get the existing rarity element to preserve it
      const existingRarity = thumbnail.querySelector('.seed-card-rarity');
      const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
      console.log('[DEBUG] Existing rarity element:', existingRarity ? existingRarity.outerHTML : 'None');
      console.log('[DEBUG] Rarity HTML to preserve:', rarityHTML);
      
      if (imageData) {
        // Get the existing rarity, number, and description button elements to preserve them
        const existingRarity = thumbnail.querySelector('.seed-card-rarity');
        const existingNumber = thumbnail.querySelector('.seed-card-number-display');
        const existingDescBtn = thumbnail.querySelector('.seed-desc-btn');
        const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
        const numberHTML = existingNumber ? existingNumber.outerHTML : '';
        const descBtnHTML = existingDescBtn ? existingDescBtn.outerHTML : '';
        
        // If forcing refresh, clear the thumbnail first to prevent browser caching
        if (forceRefresh) {
          const oldImg = thumbnail.querySelector('img');
          if (oldImg) {
            oldImg.src = ''; // Clear src
            oldImg.remove(); // Remove from DOM
          }
        }
        
        // Set the image content with timestamp attribute to bust browser cache
        // CRITICAL: Preserve description button by including it in innerHTML
        const timestamp = Date.now();
        thumbnail.innerHTML = `<img src="${imageData}" alt="NFT Preview" data-timestamp="${timestamp}" />${rarityHTML}${numberHTML}${descBtnHTML}`;
        
        // Force browser to recognize the new image by triggering a reflow
        if (forceRefresh) {
          const newImg = thumbnail.querySelector('img');
          if (newImg) {
            void newImg.offsetHeight; // Force reflow
          }
        }
        
        // CRITICAL: Verify description button is in DOM after innerHTML update
        const descBtnAfterRender = thumbnail.querySelector('.seed-desc-btn');
        if (!descBtnAfterRender && descBtnHTML) {
          console.warn('[DEBUG] Description button lost after thumbnail render, re-adding it');
          // Re-add the description button if it was lost
          thumbnail.insertAdjacentHTML('beforeend', descBtnHTML);
        }
        
        // CRITICAL: Initialize description button after thumbnail image loads
        const newImg = thumbnail.querySelector('img');
        if (newImg) {
          newImg.onload = () => {
            // Double-check button exists before initializing
            const descBtn = thumbnail.querySelector('.seed-desc-btn');
            if (descBtn) {
            this.initializeDescriptionButton(card, seed);
            } else {
              console.error('[DEBUG] Description button not found in DOM after image load for seed:', seed);
            }
          };
          // If image already loaded (cached), initialize immediately
          if (newImg.complete) {
            const descBtn = thumbnail.querySelector('.seed-desc-btn');
            if (descBtn) {
              this.initializeDescriptionButton(card, seed);
            } else {
              console.error('[DEBUG] Description button not found in DOM (image already loaded) for seed:', seed);
            }
          }
        } else {
          // If no image, still initialize the button if it exists
          const descBtn = thumbnail.querySelector('.seed-desc-btn');
          if (descBtn) {
            this.initializeDescriptionButton(card, seed);
          }
        }
        
        console.log('[DEBUG] Thumbnail image set successfully with rarity element:', rarityHTML ? 'Yes' : 'No', 'number element:', numberHTML ? 'Yes' : 'No');
        
        // Verify elements are still there after image load
        const newRarity = thumbnail.querySelector('.seed-card-rarity');
        const newNumber = thumbnail.querySelector('.seed-card-number-display');
        if (newRarity) {
          console.log('[DEBUG] Rarity element preserved after image load:', newRarity.outerHTML);
        } else if (rarityHTML) {
          console.error('[DEBUG] Rarity element lost after image load!');
        }
        if (newNumber) {
          console.log('[DEBUG] Number element preserved after image load:', newNumber.outerHTML);
        } else if (numberHTML) {
          console.error('[DEBUG] Number element lost after image load!');
        }
      } else {
        // Get the existing rarity and number elements to preserve them
        const existingRarity = thumbnail.querySelector('.seed-card-rarity');
        const existingNumber = thumbnail.querySelector('.seed-card-number-display');
        const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
        const numberHTML = existingNumber ? existingNumber.outerHTML : '';
        
        // Set the placeholder content and immediately add back the rarity and number elements
        thumbnail.innerHTML = `<div class="no-image">No Image</div>${rarityHTML}${numberHTML}`;
        
        console.log('[DEBUG] No image data, showing placeholder with rarity element:', rarityHTML ? 'Yes' : 'No', 'number element:', numberHTML ? 'Yes' : 'No');
        
        // Verify elements are still there after placeholder load
        const newRarity = thumbnail.querySelector('.seed-card-rarity');
        const newNumber = thumbnail.querySelector('.seed-card-number-display');
        if (newRarity) {
          console.log('[DEBUG] Rarity element preserved after placeholder load:', newRarity.outerHTML);
        } else if (rarityHTML) {
          console.error('[DEBUG] Rarity element lost after placeholder load!');
        }
        if (newNumber) {
          console.log('[DEBUG] Number element preserved after placeholder load:', newNumber.outerHTML);
        } else if (numberHTML) {
          console.error('[DEBUG] Number element lost after placeholder load!');
        }
      }
    } catch (error) {
      console.error('Error loading thumbnail:', error);
      // Get the existing rarity and number elements to preserve them
      const existingRarity = thumbnail.querySelector('.seed-card-rarity');
      const existingNumber = thumbnail.querySelector('.seed-card-number-display');
      const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
      const numberHTML = existingNumber ? existingNumber.outerHTML : '';
      
      // Set the error content and immediately add back the rarity and number elements
      thumbnail.innerHTML = `<div class="error-image">Error</div>${rarityHTML}${numberHTML}`;
      
      console.log('[DEBUG] Error handled, preserved rarity element:', rarityHTML ? 'Yes' : 'No', 'number element:', numberHTML ? 'Yes' : 'No');
    }
  }

  // Refresh rarity display on all cards after they're created
  refreshRarityDisplayOnAllCards() {
    console.log('[DEBUG] ===== REFRESHING RARITY DISPLAY ON ALL CARDS =====');
    console.log('[DEBUG] Rarity rank enabled:', this.rarityRankEnabled);
    
    if (!this.modal) {
      console.error('[DEBUG] Modal not created yet, cannot refresh rarity display');
      return;
    }
    
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.error('[DEBUG] No grid found!');
      return;
    }

    const cards = grid.querySelectorAll('.saved-seed-card');
    console.log('[DEBUG] Found', cards.length, 'cards to refresh rarity display');
    
    cards.forEach(card => {
      const seed = card.dataset.seed;
      if (seed) {
        const thumbnail = card.querySelector('.seed-card-thumbnail');
        
        if (thumbnail) {
          // Remove existing rarity element if it exists
          const existingRarity = thumbnail.querySelector('.seed-card-rarity');
          if (existingRarity) {
            existingRarity.remove();
          }
          
          // Always add rarity element - CRITICAL: Display outdated ranks for user reference
          // Outdated ranks are still useful information even if calculation needs to be redone
          const rarityRank = this.getRarityRank(seed);
          console.log('[DEBUG] refreshRarityDisplayOnAllCards - seed:', seed, 'rarityRank:', rarityRank);
          
          // Show rank if it exists (even if outdated) - only show --- for NFTs that never had a rank calculated
          if (rarityRank !== null && rarityRank !== undefined && rarityRank !== '---' && typeof rarityRank === 'number') {
            const rarityDisplay = `<div class="seed-card-rarity">rarity rank: ${rarityRank}</div>`;
            thumbnail.insertAdjacentHTML('beforeend', rarityDisplay);
            console.log('[DEBUG] Adding rarity rank for seed', seed, 'rank:', rarityRank, '(may be outdated)');
            
            // Verify the element was added
            const addedRarity = thumbnail.querySelector('.seed-card-rarity');
            if (addedRarity) {
              console.log('[DEBUG] Rarity element successfully added:', addedRarity.outerHTML);
              console.log('[DEBUG] Thumbnail dimensions:', thumbnail.offsetWidth, 'x', thumbnail.offsetHeight);
              console.log('[DEBUG] Rarity element position:', addedRarity.offsetTop, addedRarity.offsetLeft);
            } else {
              console.error('[DEBUG] Rarity element was not added!');
            }
          } else {
            const rarityDisplay = `<div class="seed-card-rarity">---</div>`;
            thumbnail.insertAdjacentHTML('beforeend', rarityDisplay);
            console.log('[DEBUG] No rarity rank found for seed', seed, '- showing --- (NFT never had rank calculated)');
          }
        }
      }
    });
  }

  // Update rarity status display
  updateRarityStatus() {
    const statusElement = this.modal.querySelector('#rarity-status-text');
    if (!statusElement) return;
    
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData;
    
    // First, check if rarity ranks exist and have been calculated
    // If no rarity ranks exist or they're empty, show '---'
    if (!projectData || !projectData.rarityRanks || Object.keys(projectData.rarityRanks).length === 0) {
      statusElement.textContent = '---';
      statusElement.className = 'rarity-status-text';
      // Save '---' to projectData
      if (projectData) {
        projectData.rarityStatus = '---';
      }
      return;
    }
    
    // Check if there's a saved status in projectData (only if rarity ranks exist)
    if (projectData && projectData.rarityStatus) {
      const savedStatus = projectData.rarityStatus;
      if (savedStatus === 'updated' || savedStatus === 'outdated') {
        this.updateRarityStatus(savedStatus);
        return;
      } else if (savedStatus === '---') {
        statusElement.textContent = '---';
        statusElement.className = 'rarity-status-text';
        return;
      }
    }
    
    // Check if rarity ranks are outdated
    const isOutdated = this.isRarityOutdated();
    
    if (isOutdated) {
      statusElement.textContent = 'outdated';
      statusElement.className = 'rarity-status-text outdated';
      this.saveRarityStatus('outdated');
    } else {
      statusElement.textContent = 'updated';
      statusElement.className = 'rarity-status-text updated';
      this.saveRarityStatus('updated');
    }
  }

  // Update button states (rerender and calculate buttons)
  updateButtonState(buttonType, isUpdated) {
    // buttonType: 'rerender' or 'calculate'
    // isUpdated: true for updated, false for outdated
    
    if (buttonType === 'rerender') {
      const rerenderBtn = this.modal?.querySelector('#rerender-thumbnails');
      
      if (rerenderBtn) {
        // Ensure tooltip class is always present
        rerenderBtn.classList.add('tooltip');
        
        // Store original tooltip if not already stored
        if (!rerenderBtn.dataset.originalTooltip) {
          const existingTip = rerenderBtn.querySelector('.tooltiptext');
          if (existingTip) {
            rerenderBtn.dataset.originalTooltip = existingTip.innerHTML;
          } else {
            rerenderBtn.dataset.originalTooltip = 'Calculates trait rarities based on actual usage across your collection and updates them accordingly.';
          }
        }
        
        if (isUpdated) {
          rerenderBtn.classList.add('button-updated');
          rerenderBtn.classList.remove('button-outdated');
          // Tooltip for updated state
          let tip = rerenderBtn.querySelector('.tooltiptext');
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'tooltiptext';
            rerenderBtn.appendChild(tip);
          }
          tip.innerHTML = 'updated: trait rarities are in sync with current collection.';
          // CRITICAL: Re-setup tooltip with global tooltip manager after state change (ensures horizontal centering)
          const tooltipManagerRerenderUpdated = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
          if (tooltipManagerRerenderUpdated && tooltipManagerRerenderUpdated.setupTooltip) {
            rerenderBtn.removeAttribute('data-tooltip-setup');
            tooltipManagerRerenderUpdated.setupTooltip(rerenderBtn, tip);
          }
        } else {
          rerenderBtn.classList.remove('button-updated');
          rerenderBtn.classList.add('button-outdated');
          // Tooltip for outdated state
          let tip = rerenderBtn.querySelector('.tooltiptext');
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'tooltiptext';
            rerenderBtn.appendChild(tip);
          }
          tip.innerHTML = 'outdated: recalculate trait rarities to reflect actual usage.';
          // CRITICAL: Re-setup tooltip with global tooltip manager after state change (ensures horizontal centering)
          const tooltipManagerRerenderOutdated = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
          if (tooltipManagerRerenderOutdated && tooltipManagerRerenderOutdated.setupTooltip) {
            rerenderBtn.removeAttribute('data-tooltip-setup');
            tooltipManagerRerenderOutdated.setupTooltip(rerenderBtn, tip);
          }
        }
      }
    } else if (buttonType === 'calculate') {
      const calculateBtn = this.modal?.querySelector('#calculate-rarity-ranks');
      
      if (calculateBtn) {
        // Ensure tooltip class is always present
        calculateBtn.classList.add('tooltip');
        
        // Store original tooltip if not already stored
        if (!calculateBtn.dataset.originalTooltip) {
          const existingTip = calculateBtn.querySelector('.tooltiptext');
          if (existingTip) {
            calculateBtn.dataset.originalTooltip = existingTip.innerHTML;
          } else {
            calculateBtn.dataset.originalTooltip = 'Calculate rarity ranks for the entire<br>collection based on trait combinations.';
          }
        }
        
        if (isUpdated) {
          calculateBtn.classList.add('button-updated');
          calculateBtn.classList.remove('button-outdated');
          // Update the rarity status text and save to project data
          const statusElement = this.modal.querySelector('#rarity-status-text');
          if (statusElement) {
            statusElement.textContent = 'updated';
            statusElement.className = 'rarity-status-text updated';
          }
          // Save status to project data (project file)
          this.saveRarityStatus('updated');
          // Tooltip for updated state
          let tip = calculateBtn.querySelector('.tooltiptext');
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'tooltiptext';
            calculateBtn.appendChild(tip);
          }
          tip.innerHTML = 'updated: rarity ranks are current.';
          // CRITICAL: Re-setup tooltip with global tooltip manager after state change
          const tooltipManagerCalcUpdated = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
          if (tooltipManagerCalcUpdated && tooltipManagerCalcUpdated.setupTooltip) {
            calculateBtn.removeAttribute('data-tooltip-setup');
            tooltipManagerCalcUpdated.setupTooltip(calculateBtn, tip);
          }
        } else {
          calculateBtn.classList.remove('button-updated');
          calculateBtn.classList.add('button-outdated');
          // Update the rarity status text and save to project data
          const statusElement = this.modal.querySelector('#rarity-status-text');
          if (statusElement) {
            statusElement.textContent = 'outdated';
            statusElement.className = 'rarity-status-text outdated';
          }
          // Save status to project data (project file)
          this.saveRarityStatus('outdated');
          // Tooltip for outdated state
          let tip = calculateBtn.querySelector('.tooltiptext');
          if (!tip) {
            tip = document.createElement('span');
            tip.className = 'tooltiptext';
            calculateBtn.appendChild(tip);
          }
          tip.innerHTML = 'outdated: run calculation to refresh rarity ranks.';
          // CRITICAL: Re-setup tooltip with global tooltip manager after state change
          const tooltipManagerCalcOutdated = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
          if (tooltipManagerCalcOutdated && tooltipManagerCalcOutdated.setupTooltip) {
            calculateBtn.removeAttribute('data-tooltip-setup');
            tooltipManagerCalcOutdated.setupTooltip(calculateBtn, tip);
          }
        }
      }
    }
  }

  // Mark buttons as outdated when collection changes
  markButtonsOutdated() {
    // Mark rerender button as outdated (trait rarities need recalculation)
    this.updateButtonState('rerender', false);
    // Mark calculate button as outdated (rarity ranks need recalculation)
    this.updateButtonState('calculate', false);
    
    // Immediately update rarity-status-text to outdated
    const statusElement = this.modal?.querySelector('#rarity-status-text');
    if (statusElement) {
      statusElement.textContent = 'outdated';
      statusElement.className = 'rarity-status-text outdated';
    }
    
    // Mark trait rarities status as outdated when collection changes
    this.updateTraitRaritiesStatus('outdated');
  }

  // Update trait rarities status display
  updateTraitRaritiesStatus(status) {
    const statusElement = this.modal?.querySelector('#trait-Rarities-status-text');
    if (!statusElement) return;
    
    // Save status to project data (project file) for persistence
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (projectData) {
      projectData.traitRaritiesStatus = status;
      if (status === 'updated') {
        // Also save the collection size at the time of update to detect changes
        projectData.traitRaritiesCollectionSize = this.seedList.length;
      }
      console.log('[DEBUG] Trait rarities status saved to projectData:', status);
      
      // Also save to localStorage as backup
      if (projectData.name) {
        const statusKey = 'traitRaritiesStatus_' + encodeURIComponent(projectData.name);
        const collectionSizeKey = 'traitRaritiesCollectionSize_' + encodeURIComponent(projectData.name);
        if (status === 'updated') {
          localStorage.setItem(statusKey, 'updated');
          localStorage.setItem(collectionSizeKey, String(this.seedList.length));
        } else if (status === 'outdated' || status === '---') {
          localStorage.setItem(statusKey, status);
        }
      }
    }
    
    // Update display
    if (status === 'updated') {
      statusElement.textContent = 'updated';
      statusElement.className = 'rarity-status-text updated';
      // Tooltip for trait rarities updated
      statusElement.classList.add('tooltip');
      let tip = statusElement.querySelector('.tooltiptext');
      if (!tip) {
        tip = document.createElement('span');
        tip.className = 'tooltiptext';
        statusElement.appendChild(tip);
      }
      tip.innerHTML = 'your collection displays now the<br>exact rarity of every single trait.';
      // CRITICAL: Setup tooltip with global tooltip manager to ensure it's displayed
      const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
      if (tooltipManager && tooltipManager.setupTooltip) {
        tooltipManager.setupTooltip(statusElement, tip);
      }
    } else if (status === 'outdated') {
      statusElement.textContent = 'outdated';
      statusElement.className = 'rarity-status-text outdated';
      statusElement.classList.add('tooltip');
      let tip = statusElement.querySelector('.tooltiptext');
      if (!tip) {
        tip = document.createElement('span');
        tip.className = 'tooltiptext';
        statusElement.appendChild(tip);
      }
      tip.innerHTML = 'Trait rarities are outdated.<br>Recalculate to reflect actual usage.';
      // CRITICAL: Setup tooltip with global tooltip manager to ensure it's displayed
      const tooltipManagerOutdated = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
      if (tooltipManagerOutdated && tooltipManagerOutdated.setupTooltip) {
        tooltipManagerOutdated.setupTooltip(statusElement, tip);
      }
    } else {
      statusElement.textContent = '---';
      statusElement.className = 'rarity-status-text';
      const tip = statusElement.querySelector('.tooltiptext');
      if (tip) tip.remove();
    }

    // Reflect status on the Calculate Trait Rarities button appearance
    const rerenderBtn = this.modal?.querySelector('#rerender-thumbnails');
    if (rerenderBtn) {
      if (status === 'updated') {
        rerenderBtn.classList.add('button-updated');
        rerenderBtn.classList.remove('button-outdated');
      } else if (status === 'outdated') {
        rerenderBtn.classList.remove('button-updated');
        rerenderBtn.classList.add('button-outdated');
      } else {
        rerenderBtn.classList.remove('button-updated');
        rerenderBtn.classList.remove('button-outdated');
      }
    }
  }

  // Check and initialize trait rarities status from project data (project file)
  initializeTraitRaritiesStatus() {
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData) {
      this.updateTraitRaritiesStatus('---');
      return;
    }
    
    // First, try to load from project data (project file)
    let savedStatus = projectData.traitRaritiesStatus;
    let savedCollectionSize = projectData.traitRaritiesCollectionSize;
    
    // Fallback to localStorage if not in project data (for migration)
    if (!savedStatus && projectData.name) {
      const statusKey = 'traitRaritiesStatus_' + encodeURIComponent(projectData.name);
      const collectionSizeKey = 'traitRaritiesCollectionSize_' + encodeURIComponent(projectData.name);
      savedStatus = localStorage.getItem(statusKey);
      savedCollectionSize = localStorage.getItem(collectionSizeKey);
      
      // If found in localStorage, migrate to projectData
      if (savedStatus) {
        projectData.traitRaritiesStatus = savedStatus;
        if (savedCollectionSize) {
          projectData.traitRaritiesCollectionSize = parseInt(savedCollectionSize, 10);
        }
      }
    }
    
    // CRITICAL: Ensure seedList is loaded before checking collection size
    // This prevents incorrect outdated status when modal is just opened
    const currentCollectionSize = this.seedList ? this.seedList.length : 0;
    
    // Only check for collection size mismatch if:
    // 1. Status is currently "updated" (not already outdated)
    // 2. We have a saved collection size to compare against
    // 3. Current collection size is > 0 (seedList is loaded)
    // 4. There's an actual significant mismatch
    if (savedStatus === 'updated' && savedCollectionSize && currentCollectionSize > 0) {
      const savedSize = parseInt(savedCollectionSize, 10);
      if (savedSize !== currentCollectionSize) {
        console.log('[DEBUG] Trait rarities status: collection size mismatch detected:', {
          savedSize,
          currentCollectionSize,
          savedStatus
        });
        // Only mark as outdated if there's a real change (NFTs added/deleted)
        this.updateTraitRaritiesStatus('outdated');
        return;
      }
    }
    
    // If status is updated or outdated, use it (don't override unnecessarily)
    if (savedStatus === 'updated' || savedStatus === 'outdated') {
      this.updateTraitRaritiesStatus(savedStatus);
    } else {
      this.updateTraitRaritiesStatus('---');
    }
  }

  // Show success popup that auto-closes after 5 seconds
  showSuccessPopup(message) {
    // Remove any existing success popup
    const existingPopup = document.getElementById('success-popup-overlay');
    if (existingPopup) {
      existingPopup.remove();
    }

    // Create overlay
    const overlay = document.createElement('div');
    overlay.id = 'success-popup-overlay';
    overlay.style.cssText = `
      position: fixed !important;
      top: 0 !important;
      left: 0 !important;
      width: 100% !important;
      height: 100% !important;
      background: rgba(0, 0, 0, 0.7) !important;
      z-index: 10003 !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 0 !important;
      padding: 0 !important;
    `;

    // Create popup
    const popup = document.createElement('div');
    popup.className = 'scan-progress-popup';
    popup.style.cssText = `
      position: relative !important;
      background: #2c3e50 !important;
      padding: 30px 40px !important;
      border-radius: 12px !important;
      box-shadow: 0 8px 32px rgba(0,0,0,0.5) !important;
      z-index: 10004 !important;
      min-width: 400px !important;
      max-width: 600px !important;
      text-align: center !important;
      margin: 0 !important;
      top: auto !important;
      left: auto !important;
      right: auto !important;
      bottom: auto !important;
      transform: none !important;
    `;

    popup.innerHTML = `
      <div class="scan-title-container" style="text-align: center; margin-bottom: 20px;">
        <div class="scan-title" style="font-size: 20px; font-weight: 600; margin-bottom: 10px; color: #27ae60;">
          ✓ Success
        </div>
      </div>
      <div style="font-size: 14px; color: #ecf0f1; line-height: 1.6; margin-bottom: 20px; white-space: pre-line;">
        ${message}
      </div>
      <div style="font-size: 12px; color: #ffffff; margin-top: 15px;">
        This popup will close automatically in 5 seconds...
      </div>
    `;

    overlay.appendChild(popup);
    document.body.appendChild(overlay);

    // Auto-close after 5 seconds
    setTimeout(() => {
      if (overlay && overlay.parentNode) {
        // Fade out animation
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (overlay && overlay.parentNode) {
            overlay.remove();
          }
        }, 300);
      }
    }, 5000);

    // Allow clicking to close immediately
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (overlay && overlay.parentNode) {
            overlay.remove();
          }
        }, 300);
      }
    });
  }
  
  // Check if rarity ranks are outdated
  isRarityOutdated() {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData;
    if (!projectData || !projectData.rarityRanks) return true;
    
    // Check if any NFTs have been added or modified since last calculation
    const currentSeedCount = this.seedList.length;
    // Support both array (legacy) and object map formats
    const savedSeedCount = Array.isArray(projectData.rarityRanks)
      ? projectData.rarityRanks.length
      : Object.keys(projectData.rarityRanks).length;
    
    console.log('[DEBUG] isRarityOutdated check:', {
      currentSeedCount,
      savedSeedCount,
      projectDataName: projectData.name
    });
    
    if (currentSeedCount !== savedSeedCount) {
      console.log('[DEBUG] Rarity ranks outdated: different seed count');
      return true; // Different number of seeds
    }
    
    // Check if there's an outdated flag in localStorage
    const outdatedKey = 'rarityRanksOutdated_' + encodeURIComponent(projectData.name);
    const isMarkedOutdated = localStorage.getItem(outdatedKey) === 'true';
    
    if (isMarkedOutdated) {
      console.log('[DEBUG] Rarity ranks outdated: marked as outdated in localStorage');
      return true;
    }
    
    console.log('[DEBUG] Rarity ranks are up-to-date');
    return false; // No changes detected
  }

  // Check if any rarity ranks exist (regardless of outdated status)
  hasAnyRarityRanks() {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    console.log('[DEBUG] Checking for any rarity ranks, projectData:', projectData?.name);
    
    if (!projectData) {
      console.log('[DEBUG] No project data found');
      return false;
    }

    // Check if rarity ranks exist in project data
    if (projectData.rarityRanks && Array.isArray(projectData.rarityRanks) && projectData.rarityRanks.length > 0) {
      console.log('[DEBUG] Found rarity ranks in project data:', projectData.rarityRanks.length);
      return true;
    }

    // Check if rarity ranks exist in localStorage
    const rarityKey = 'rarityRanks_' + encodeURIComponent(projectData.name);
    const storedRarityRanks = localStorage.getItem(rarityKey);
    console.log('[DEBUG] Checking localStorage key:', rarityKey, 'found:', !!storedRarityRanks);
    
    if (storedRarityRanks) {
      try {
        let rarityRanks;
        try {
          rarityRanks = JSON.parse(storedRarityRanks);
        } catch (parseError) {
          console.error('[DEBUG] Error parsing rarity ranks:', parseError);
          return false;
        }
        const hasAny = Array.isArray(rarityRanks) && rarityRanks.length > 0;
        console.log('[DEBUG] Parsed rarity ranks from localStorage:', rarityRanks.length, 'has any:', hasAny);
        return hasAny;
      } catch (e) {
        console.warn('Error parsing stored rarity ranks:', e);
      }
    }

    console.log('[DEBUG] No rarity ranks found at all');
    return false;
  }

  // Check if rarity ranks are complete (match seed list length)
  areRarityRanksComplete() {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    
    if (!projectData || !projectData.rarityRanks) return false;

    const rarityLength = Array.isArray(projectData.rarityRanks)
      ? projectData.rarityRanks.length
      : Object.keys(projectData.rarityRanks).length;
    const seedLength = this.seedList.length;
    const isComplete = rarityLength === seedLength;
    
    console.log('[DEBUG] Rarity ranks completeness check:', {
      rarityLength,
      seedLength,
      isComplete,
      missingCount: seedLength - rarityLength
    });
    
    return isComplete;
  }

  // Check if valid rarity ranks exist (up-to-date)
  hasValidRarityRanks() {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    console.log('[DEBUG] Checking for valid rarity ranks, projectData:', projectData?.name);
    
    if (!projectData) {
      console.log('[DEBUG] No project data found');
      return false;
    }

    // Check if rarity ranks exist in project data
    if (projectData.rarityRanks && Array.isArray(projectData.rarityRanks) && projectData.rarityRanks.length > 0) {
      console.log('[DEBUG] Found rarity ranks in project data:', projectData.rarityRanks.length);
      return true;
    }

    // Check if rarity ranks exist in localStorage
    const rarityKey = 'rarityRanks_' + encodeURIComponent(projectData.name);
    const storedRarityRanks = localStorage.getItem(rarityKey);
    console.log('[DEBUG] Checking localStorage key:', rarityKey, 'found:', !!storedRarityRanks);
    
    if (storedRarityRanks) {
      try {
        let rarityRanks;
        try {
          rarityRanks = JSON.parse(storedRarityRanks);
        } catch (parseError) {
          console.error('[DEBUG] Error parsing rarity ranks:', parseError);
          return false;
        }
        const isValid = Array.isArray(rarityRanks) && rarityRanks.length > 0;
        console.log('[DEBUG] Parsed rarity ranks from localStorage:', rarityRanks.length, 'valid:', isValid);
        return isValid;
      } catch (e) {
        console.warn('Error parsing stored rarity ranks:', e);
      }
    }

    console.log('[DEBUG] No valid rarity ranks found');
    return false;
  }

  // Check if rarity ranks are outdated (NFTs have been edited)
  areRarityRanksOutdated() {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    if (!projectData) return false;

    // Check if there's a flag indicating NFTs have been edited since last calculation
    const outdatedKey = 'rarityRanksOutdated_' + encodeURIComponent(projectData.name);
    return localStorage.getItem(outdatedKey) === 'true';
  }

  // Show error tip when no rarity ranks exist
  showRarityErrorTip() {
    this.hideRarityTips(); // Hide any existing tips first
    
    const toggleContainer = this.modal.querySelector('.rarity-toggle-container');
    if (toggleContainer) {
      const errorTip = document.createElement('div');
      errorTip.className = 'rarity-error-popup';
      errorTip.innerHTML = '* please go back to the Generate NFTs tab and press "Calculate Rarity Rank for All NFTs" before proceeding.';
      
      // Position the popup relative to the toggle
      const toggleSlider = toggleContainer.querySelector('.rarity-toggle-slider');
      if (toggleSlider) {
        const rect = toggleSlider.getBoundingClientRect();
        errorTip.style.position = 'absolute';
        errorTip.style.top = (rect.bottom + 8) + 'px';
        errorTip.style.left = (rect.left - 100) + 'px'; // Center it relative to toggle
        errorTip.style.zIndex = '10001';
      }
      
      document.body.appendChild(errorTip);
      
      // Auto-hide after 5 seconds
      setTimeout(() => {
        if (errorTip.parentNode) {
          errorTip.remove();
        }
      }, 5000);
    }
  }

  // Show outdated tip when rarity ranks are outdated
  showRarityOutdatedTip() {
    // Note: This method is no longer needed since rarity status is shown directly in the status indicator
    console.log('[DEBUG] Rarity status is now shown directly in the status indicator');
  }

  // Show updated tip when rarity ranks are up-to-date
  showRarityUpdatedTip() {
    this.hideRarityTips(); // Hide any existing tips first
    
    const outdatedText = this.modal.querySelector('#rarity-outdated-text');
    const updatedText = this.modal.querySelector('#rarity-updated-text');
    
    if (updatedText) {
      updatedText.style.display = 'block';
      // Remove title and add custom tooltip
      updatedText.removeAttribute('title');
      updatedText.classList.add('tooltip');
      let updatedTooltip = updatedText.querySelector('.tooltiptext');
      if (!updatedTooltip) {
        updatedTooltip = document.createElement('span');
        updatedTooltip.className = 'tooltiptext';
        updatedText.appendChild(updatedTooltip);
      }
      updatedTooltip.textContent = 'Rarity ranks are up-to-date and accurate.';
      console.log('[DEBUG] Showing permanent updated text');
    } else {
      console.log('[DEBUG] Rarity status is now shown directly in the status indicator');
    }
    
    if (outdatedText) {
      outdatedText.style.display = 'none';
    }
  }

  // Hide all rarity tips
  hideRarityTips() {
    const toggleContainer = this.modal.querySelector('.rarity-toggle-container');
    if (toggleContainer) {
      const existingTips = toggleContainer.querySelectorAll('.rarity-error-tip, .rarity-outdated-tip');
      existingTips.forEach(tip => tip.remove());
    }
    
    // Hide both permanent texts
    const outdatedText = this.modal.querySelector('#rarity-outdated-text');
    const updatedText = this.modal.querySelector('#rarity-updated-text');
    
    if (outdatedText) {
      outdatedText.style.display = 'none';
    }
    if (updatedText) {
      updatedText.style.display = 'none';
    }
    
    console.log('[DEBUG] Hiding all permanent rarity status texts');
    
    // Also hide popup tooltips
    const existingPopups = document.querySelectorAll('.rarity-error-popup');
    existingPopups.forEach(popup => popup.remove());
  }

  async getImageForSeed(seed) {
    return new Promise((resolve) => {
      try {
        console.log('[DEBUG] getImageForSeed called for seed:', seed.substring(0, 50) + '...');
        console.log('[DEBUG] Cache exists:', !!window.savedSeedsImageCache);
        console.log('[DEBUG] Seed in cache:', !!window.savedSeedsImageCache?.[seed]);
        console.log('[DEBUG] Cache stale:', this.isCacheStale());
        
        // Check if this seed has been edited (has saved traits)
        const seedObjForCache = this.seedList.find(s => s.seed === seed);
        const hasEditedTraits = seedObjForCache && seedObjForCache.traits && seedObjForCache.traits.length > 0;
        
        // CRITICAL: Check if seedObj has a saved thumbnail/imageData and use it
        if (seedObjForCache && seedObjForCache.thumbnail) {
          console.log('[DEBUG] ✅ Using thumbnail from seedObj for seed:', seed.substring(0, 50) + '...');
          resolve(seedObjForCache.thumbnail);
          return;
        }
        if (seedObjForCache && seedObjForCache.imageData) {
          console.log('[DEBUG] ✅ Using imageData from seedObj for seed:', seed.substring(0, 50) + '...');
          resolve(seedObjForCache.imageData);
          return;
        }
        
        // If we have a fresh cache entry (just updated), use it immediately
        if (window.savedSeedsImageCache && window.savedSeedsImageCache[seed]) {
          console.log('[DEBUG] ✅ Using fresh cached image for seed:', seed.substring(0, 50) + '...', 'Length:', window.savedSeedsImageCache[seed].length);
          resolve(window.savedSeedsImageCache[seed]);
          return;
        }
        
        // If seed has edited traits but no cache, regenerate to ensure we use the saved traits
        if (hasEditedTraits) {
          console.log('[DEBUG] Seed has edited traits, forcing regeneration');
          // Clear cache for this specific seed to force regeneration
          if (window.savedSeedsImageCache && window.savedSeedsImageCache[seed]) {
            delete window.savedSeedsImageCache[seed];
          }
        }
        
        // Check cache first, but only if traits haven't been updated and seed hasn't been edited
        if (window.savedSeedsImageCache && window.savedSeedsImageCache[seed] && !this.isCacheStale() && !hasEditedTraits) {
          console.log('[DEBUG] ✅ Using cached image for seed:', seed.substring(0, 50) + '...', 'Length:', window.savedSeedsImageCache[seed].length);
          resolve(window.savedSeedsImageCache[seed]);
          return;
        } else {
          console.log('[DEBUG] ❌ NOT using cache - will regenerate NFT');
          if (!window.savedSeedsImageCache) {
            console.log('[DEBUG]   Reason: Cache does not exist');
          } else if (!window.savedSeedsImageCache[seed]) {
            console.log('[DEBUG]   Reason: Seed not in cache');
          } else if (this.isCacheStale()) {
            console.log('[DEBUG]   Reason: Cache is stale');
          } else if (hasEditedTraits) {
            console.log('[DEBUG]   Reason: Seed has edited traits');
          }
        }
        
        // Try to get from lastGeneratedNFT if matches
        if (window.lastGeneratedNFT && window.lastGeneratedNFT.seed === seed && window.lastGeneratedNFT.imageData) {
          console.log('[DEBUG] Found image in lastGeneratedNFT for seed:', seed);
          if (!window.savedSeedsImageCache) {
            window.savedSeedsImageCache = {};
          }
          window.savedSeedsImageCache[seed] = window.lastGeneratedNFT.imageData;
          resolve(window.lastGeneratedNFT.imageData);
          return;
        }
        
        const projectData = window.NFTApp.getModule('generateNftsUI').projectData;
        console.log('[DEBUG] Project data:', projectData);
        console.log('[DEBUG] Trait layers:', projectData?.traits?.length);
        
        if (!projectData || !projectData.traits || projectData.traits.length === 0) {
          console.log('[DEBUG] No project data or traits available');
          resolve(null);
          return;
        }
        
        const generateNftsModule = window.NFTApp.getModule('generateNfts');
        console.log('[DEBUG] GenerateNfts module:', generateNftsModule);
        console.log('[DEBUG] generateSingleNFT function:', typeof generateNftsModule?.generateSingleNFT);
        
        if (!generateNftsModule) {
          console.log('[DEBUG] generateNfts module not available');
          resolve(null);
          return;
        }
        
        console.log('[DEBUG] Generating image for seed:', seed);
        
        // Check if we have saved traits for this seed
        const seedObjForTraits = this.seedList.find(s => s.seed === seed);
        if (seedObjForTraits && seedObjForTraits.traits && seedObjForTraits.traits.length > 0) {
          console.log('[DEBUG] Found saved traits for seed, using custom rendering:', seedObjForTraits.traits.length, 'traits');
          
          // Use custom canvas rendering with saved traits
          this.renderNFTWithTraits(seedObjForTraits.traits, projectData).then((imageData) => {
            if (imageData) {
              console.log('[DEBUG] Successfully generated image using saved traits for seed:', seed);
              if (!window.savedSeedsImageCache) {
                window.savedSeedsImageCache = {};
              }
              window.savedSeedsImageCache[seed] = imageData;
              resolve(imageData);
            } else {
              console.log('[DEBUG] Failed to generate image with saved traits, falling back to random generation');
              // Fallback to random generation
                  generateNftsModule.generateSingleNFT(projectData, false, seed).then((nft) => {
                    if (nft && nft.imageData) {
                  console.log('[DEBUG] Successfully generated random image for seed:', seed);
                      if (!window.savedSeedsImageCache) {
                        window.savedSeedsImageCache = {};
                      }
                      window.savedSeedsImageCache[seed] = nft.imageData;
                      resolve(nft.imageData);
                    } else {
                      console.log('[DEBUG] No image data generated for seed:', seed);
                      resolve(null);
                    }
                  }).catch((error) => {
                console.error('[DEBUG] Error generating random image for seed:', seed, error);
                    resolve(null);
                  });
            }
          }).catch((error) => {
            console.error('[DEBUG] Error generating image with saved traits:', error);
            // Fallback to random generation
            generateNftsModule.generateSingleNFT(projectData, false, seed).then((nft) => {
              if (nft && nft.imageData) {
                console.log('[DEBUG] Successfully generated random image for seed:', seed);
                if (!window.savedSeedsImageCache) {
                  window.savedSeedsImageCache = {};
                }
                window.savedSeedsImageCache[seed] = nft.imageData;
                resolve(nft.imageData);
              } else {
                console.log('[DEBUG] No image data generated for seed:', seed);
                resolve(null);
              }
            }).catch((error) => {
              console.error('[DEBUG] Error generating random image for seed:', seed, error);
              resolve(null);
            });
          });
        } else {
          console.log('[DEBUG] No saved traits found, using random generation for seed:', seed);
          // No saved traits, use random generation
          generateNftsModule.generateSingleNFT(projectData, false, seed).then((nft) => {
            if (nft && nft.imageData) {
              console.log('[DEBUG] Successfully generated random image for seed:', seed);
              if (!window.savedSeedsImageCache) {
                window.savedSeedsImageCache = {};
              }
              window.savedSeedsImageCache[seed] = nft.imageData;
              resolve(nft.imageData);
            } else {
              console.log('[DEBUG] No image data generated for seed:', seed);
              resolve(null);
            }
          }).catch((error) => {
            console.error('[DEBUG] Error generating random image for seed:', seed, error);
            resolve(null);
          });
        }
      } catch (error) {
        console.error('[DEBUG] Error in getImageForSeed:', error);
        resolve(null);
      }
    });
  }

  async renderNFTWithTraits(traits, projectData) {
    return new Promise((resolve) => {
      try {
        console.log('[DEBUG] renderNFTWithTraits called with', traits.length, 'traits');
        console.log('[DEBUG] Traits details:', traits.map(t => ({ 
          layer: t.layer?.name || t.layer, 
          trait: t.trait?.name || t.trait 
        })));
        
        // Create canvas and render the NFT with saved traits
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Sort traits by layer order to ensure correct stacking
        const sortedTraits = [...traits].sort((a, b) => {
          const layerA = projectData.traits.find(l => 
            l.id === a.layer?.id || l.name === a.layer?.name || l.name === a.layer
          );
          const layerB = projectData.traits.find(l => 
            l.id === b.layer?.id || l.name === b.layer?.name || l.name === b.layer
          );
          
          // Sort by layer order (background first, foreground last)
          const orderA = layerA ? (layerA.order || 0) : 0;
          const orderB = layerB ? (layerB.order || 0) : 0;
          return orderA - orderB;
        });
        
        console.log('[DEBUG] Sorted traits by layer order:', sortedTraits.map(t => ({
          layer: t.layer?.name || t.layer,
          trait: t.trait?.name || t.trait,
          order: projectData.traits.find(l => l.id === t.layer?.id || l.name === t.layer?.name)?.order || 0
        })));
        
        // Load and draw images sequentially in correct layer order
        this.loadAndDrawImagesSequentially(sortedTraits, projectData, canvas, ctx).then((success) => {
          if (success) {
            try {
              const imageData = canvas.toDataURL('image/png');
              console.log('[DEBUG] Successfully rendered NFT with saved traits, imageData length:', imageData.length);
              resolve(imageData);
            } catch (error) {
              console.error('[DEBUG] Error converting canvas to data URL:', error);
              resolve(null);
            }
          } else {
            console.error('[DEBUG] Failed to load and draw images sequentially');
            resolve(null);
          }
        });
        
      } catch (error) {
        console.error('[DEBUG] Error in renderNFTWithTraits:', error);
        resolve(null);
      }
    });
  }

  // Helper method to load and draw images sequentially in correct layer order
  async loadAndDrawImagesSequentially(sortedTraits, projectData, canvas, ctx) {
    try {
      for (const traitInfo of sortedTraits) {
        const trait = traitInfo.trait;
        
        // Skip 'none' traits
        if (!trait || trait === 'none' || trait.name === 'none' || trait.id === 'none') {
          continue;
        }
        
        // Get the trait image
        let imagePath = trait.image || trait.imageData || trait.imageSrc || trait.src;
        
        if (!imagePath && projectData && projectData.traits) {
          // Try to find the trait in project data
          const layerData = projectData.traits.find(l => 
            l.id === traitInfo.layer?.id || l.name === traitInfo.layer?.name || l.name === traitInfo.layer
          );
          
          if (layerData && layerData.traits) {
            const projectTrait = layerData.traits.find(t => 
              t.id === trait.id || t.name === trait.name
            );
            
            if (projectTrait) {
              imagePath = projectTrait.image || projectTrait.imageData || projectTrait.imageSrc || projectTrait.src;
            }
          }
        }
        
        if (imagePath) {
          console.log('[DEBUG] Loading trait image sequentially:', imagePath.substring(0, 50) + '...');
          
          // Load image and wait for it to complete before moving to next
          const success = await this.loadAndDrawImage(imagePath, canvas, ctx);
          if (!success) {
            console.warn('[DEBUG] Failed to load image for trait:', trait?.name || trait);
            // Continue with next trait even if this one fails
          }
        } else {
          console.log('[DEBUG] No image path found for trait:', trait?.name || trait);
        }
      }
      
      return true; // Success
    } catch (error) {
      console.error('[DEBUG] Error in loadAndDrawImagesSequentially:', error);
      return false;
    }
  }

  // Helper method to load and draw a single image
  loadAndDrawImage(imagePath, canvas, ctx) {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          console.log('[DEBUG] Successfully loaded trait image, drawing to canvas');
          // Draw image at full canvas size to ensure proper layering
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(true);
        } catch (error) {
          console.error('[DEBUG] Error drawing trait image:', error);
          resolve(false);
        }
      };
      
      img.onerror = () => {
        console.error('[DEBUG] Error loading trait image:', imagePath);
        resolve(false);
      };
      
      if (imagePath.startsWith('data:')) {
        img.src = imagePath;
      } else {
        img.src = imagePath;
      }
    });
  }

  setupCardButtons(card, seedObj, index) {
    const buttons = card.querySelectorAll('.seed-card-btn');
    
    buttons.forEach(btn => {
      // Remove any existing event listeners to prevent duplicates
      btn.onclick = null;
      
      btn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        const action = btn.dataset.action;
        
        switch (action) {
          case 'edit':
            // Get the index from the card's dataset to ensure it's accurate
            const cardIndex = parseInt(card.dataset.index);
            const cardSeed = card.dataset.seed;
            
            // Find the current seed in seedList by seed value (more reliable than index)
            const currentSeedIndex = this.seedList.findIndex(seed => seed.seed === cardSeed);
            if (currentSeedIndex !== -1) {
              console.log('[DEBUG] Edit button - using fresh data from seedList at index:', currentSeedIndex);
              this.editSeed(this.seedList[currentSeedIndex], currentSeedIndex);
            } else {
              console.error('[DEBUG] Edit button - could not find seed in seedList:', cardSeed);
            }
            break;
          case 'copy':
            this.copySeed(seedObj, btn);
            break;
          case 'delete':
            // Get the index from the card's dataset to ensure it's accurate
            const deleteCardIndex = parseInt(card.dataset.index);
            const deleteCardSeed = card.dataset.seed;
            
            // Find the current seed in seedList by seed value (more reliable than index)
            const deleteSeedIndex = this.seedList.findIndex(seed => seed.seed === deleteCardSeed);
            if (deleteSeedIndex !== -1) {
              console.log('[DEBUG] Delete button - using fresh data from seedList at index:', deleteSeedIndex);
              this.deleteSeed(this.seedList[deleteSeedIndex], deleteSeedIndex);
            } else {
              console.error('[DEBUG] Delete button - could not find seed in seedList:', deleteCardSeed);
            }
            break;
        }
      };
    });
    // Description button (separate from seed-card-btn set)
    const descBtn = card.querySelector('.seed-desc-btn');
    if (descBtn) {
      descBtn.onclick = (e) => {
        e.stopPropagation();
        e.preventDefault();
        this.openDescriptionModal(seedObj.seed);
      };
    }
  }

  // CRITICAL FIX: Refresh event listeners for all visible cards after deletion
  refreshCardEventListeners() {
    console.log('[DEBUG] Refreshing event listeners for all visible cards');
    
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.error('[DEBUG] Grid not found for event listener refresh');
      return;
    }
    
    const visibleCards = grid.querySelectorAll('.saved-seed-card');
    let refreshedCount = 0;
    
    visibleCards.forEach((card, index) => {
      // Only refresh cards that are visible (not hidden)
      if (card.style.visibility !== 'hidden' && card.style.opacity !== '0') {
        const seed = card.dataset.seed;
        if (seed) {
          // Find the seed object in the current seedList
          const seedObj = this.seedList.find(s => s.seed === seed);
          if (seedObj) {
            console.log(`[DEBUG] Refreshing event listeners for card ${index} with seed: ${seed}`);
            this.setupCardButtons(card, seedObj, index);
            // Ensure description button color reflects current data
            const descBtn = card.querySelector('.seed-desc-btn');
            if (descBtn) this.updateDescriptionButtonState(descBtn, seed);
            refreshedCount++;
          } else {
            console.warn(`[DEBUG] Could not find seed object for card with seed: ${seed}`);
          }
        }
      }
    });
    
    console.log(`[DEBUG] Refreshed event listeners for ${refreshedCount} visible cards`);
  }

  // Initialize description button after thumbnail image is loaded
  initializeDescriptionButton(card, seed) {
    const descBtn = card.querySelector('.seed-desc-btn');
    if (descBtn && !descBtn.dataset.initialized) {
      descBtn.dataset.initialized = 'true';
      this.updateDescriptionButtonState(descBtn, seed);
      descBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.openDescriptionModal(seed);
      });
      
      // CRITICAL: Use global tooltip manager for description button tooltip with standard format
      const tooltipText = descBtn.querySelector('.tooltiptext');
      if (tooltipText) {
        // Apply standard tooltip styling
        tooltipText.style.setProperty('background-color', '#000000', 'important');
        tooltipText.style.setProperty('background', '#000000', 'important');
        tooltipText.style.setProperty('color', '#f39c12', 'important');
        tooltipText.style.setProperty('z-index', '2147483647', 'important');
        
        // Use global tooltip manager if available
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(descBtn, tooltipText);
        } else {
          // Fallback: Use setupTooltipPositioning from generateNftsUI if available
          const generateNftsUI = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('generateNftsUI');
          if (generateNftsUI && generateNftsUI.setupTooltipPositioning) {
            generateNftsUI.setupTooltipPositioning(descBtn, tooltipText);
          }
        }
      }
    }
  }

  // Update description button color based on presence of description
  updateDescriptionButtonState(buttonEl, seed) {
    const hasDesc = this.getNftDescription(seed, false, true);
    buttonEl.classList.toggle('has-description', hasDesc);
    buttonEl.classList.toggle('no-description', !hasDesc);
  }

  // Open modal to edit per-NFT description (visuals similar to Import Seeds modal)
  openDescriptionModal(seed) {
    const existing = document.getElementById('nft-description-modal');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'nft-description-modal';
    modal.className = 'saved-seeds-modal';
    modal.innerHTML = `
      <div class="saved-seeds-overlay">
        <div class="saved-seeds-container" style="width: 500px; max-width: 90vw;">
          <div class="saved-seeds-header">
            <div class="saved-seeds-title-container">
              <h2 class="saved-seeds-title">NFT Description</h2>
              <div class="saved-seeds-tip" style="white-space: nowrap;">Write a personalized description for this NFT. Leave empty to use your collection General Description. (if necessary change the Collection General Description on the Collection Info tab)</div>
            </div>
            <button class="saved-seeds-close-btn" id="close-desc-modal" aria-label="Close">&times;</button>
          </div>
          <div class="saved-seeds-body" style="padding: 24px;">
            <textarea id="nft-description-textarea" style="width:100%;height:500px;max-height:600px;min-height:500px;background:#333;color:#fff;border:1px solid #555;border-radius:8px;padding:12px;resize:vertical;outline:none;box-sizing:border-box;font-family:'Archivo',sans-serif;font-size:14px;"></textarea>
          </div>
          <div class="saved-seeds-footer" style="display:flex;justify-content:flex-end;gap:12px;padding:0 24px 24px 24px;margin-top:16px;width:100%;box-sizing:border-box;">
            <button class="saved-seeds-btn clear-btn" id="desc-delete-btn" style="background:#666;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-family:'Archivo',sans-serif;cursor:pointer;width:auto;min-width:auto;white-space:nowrap;">Delete</button>
            <button class="saved-seeds-btn import-btn" id="desc-save-btn" style="background:#6c5ce7;color:#fff;border:none;border-radius:8px;padding:8px 16px;font-family:'Archivo',sans-serif;cursor:pointer;width:auto;min-width:auto;white-space:nowrap;">Save</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Prefill with existing description
    const textarea = modal.querySelector('#nft-description-textarea');
    textarea.value = this.getNftDescription(seed, true) || '';

    // Wire actions
    modal.querySelector('#close-desc-modal').onclick = () => modal.remove();
    modal.querySelector('#desc-save-btn').onclick = () => {
      const value = textarea.value.trim();
      if (value) {
        this.setNftDescription(seed, value);
      } else {
        this.deleteNftDescription(seed);
      }
      // Update card button state
      const card = this.modal?.querySelector(`.saved-seed-card[data-seed="${seed}"]`);
      const btn = card?.querySelector('.seed-desc-btn');
      if (btn) this.updateDescriptionButtonState(btn, seed);
      modal.remove();
    };
    modal.querySelector('#desc-delete-btn').onclick = () => {
      this.deleteNftDescription(seed);
      const card = this.modal?.querySelector(`.saved-seed-card[data-seed="${seed}"]`);
      const btn = card?.querySelector('.seed-desc-btn');
      if (btn) this.updateDescriptionButtonState(btn, seed);
      modal.remove();
    };
  }

  // Persist single-NFT description
  setNftDescription(seed, text) {
    this.nftDescriptions[seed] = text;
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (projectData) {
      projectData.nftDescriptions = projectData.nftDescriptions || {};
      projectData.nftDescriptions[seed] = text;
    }
    try {
      const key = `nftDescriptions_${this.getProjectName()}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      stored[seed] = text;
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}
  }

  deleteNftDescription(seed) {
    delete this.nftDescriptions[seed];
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (projectData && projectData.nftDescriptions) delete projectData.nftDescriptions[seed];
    try {
      const key = `nftDescriptions_${this.getProjectName()}`;
      const stored = JSON.parse(localStorage.getItem(key) || '{}');
      delete stored[seed];
      localStorage.setItem(key, JSON.stringify(stored));
    } catch {}
  }

  // If checkOnly=true returns boolean; otherwise returns description with fallback
  getNftDescription(seed, preferEmpty = false, checkOnly = false) {
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    const fromState = this.nftDescriptions?.[seed];
    const fromProject = projectData?.nftDescriptions?.[seed];
    let desc = (fromState !== undefined ? fromState : fromProject);
    if (checkOnly) return !!desc && desc.trim().length > 0;
    if (desc !== undefined && (preferEmpty || (desc && desc.trim().length))) return desc;
    return projectData?.metadata?.description || projectData?.generalDescription || '';
  }

  // ENHANCED FIX: Set up event delegation for more robust event handling
  setupEventDelegation() {
    console.log('[DEBUG] Setting up event delegation for NFT cards');
    
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.error('[DEBUG] Grid not found for event delegation setup');
      return;
    }
    
    // Remove any existing delegation listeners to prevent duplicates
    if (grid.dataset.delegationSetup === 'true') {
      console.log('[DEBUG] Event delegation already set up, skipping');
      return;
    }
    
    // Use event delegation for button clicks
    grid.addEventListener('click', (e) => {
      const button = e.target.closest('.seed-card-btn');
      if (!button) return;
      
      e.stopPropagation();
      e.preventDefault();
      
      const card = button.closest('.saved-seed-card');
      if (!card) return;
      
      const action = button.dataset.action;
      const seed = card.dataset.seed;
      
      if (!seed) {
        console.error('[DEBUG] No seed found for card');
        return;
      }
      
      // Find the seed object - use filteredSeedList if filtering, otherwise use seedList
      const searchList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
      const seedObj = searchList.find(s => s.seed === seed);
      if (!seedObj) {
        console.error('[DEBUG] Could not find seed object for seed:', seed);
        return;
      }
      
      // CRITICAL: Always find the index in the FULL seedList, not the filtered one
      // This ensures the NFT stays in its original position in the collection
      const seedIndex = this.seedList.findIndex(s => s.seed === seed);
      
      console.log(`[DEBUG] Event delegation - action: ${action}, seed: ${seed}, index: ${seedIndex}`);
      
      switch (action) {
        case 'edit':
          console.log('[DEBUG] Event delegation - edit button clicked');
          this.editSeed(seedObj, seedIndex);
          break;
        case 'copy':
          console.log('[DEBUG] Event delegation - copy button clicked');
          this.copySeed(seedObj, button);
          break;
        case 'delete':
          console.log('[DEBUG] Event delegation - delete button clicked');
          this.deleteSeed(seedObj, seedIndex);
          break;
        default:
          console.warn('[DEBUG] Unknown action:', action);
      }
    });
    
    grid.dataset.delegationSetup = 'true';
    console.log('[DEBUG] Event delegation set up successfully');
  }

  // CRITICAL FIX: Clear image cache to force fresh NFT data
  clearImageCache() {
    console.log('[DEBUG] Clearing image cache to force fresh NFT data');
    
    // Clear local image cache
    this.imageCache = {};
    
    // Clear global image cache if it exists
    if (window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
    }
    
    // Clear violations cache as well since NFT data might have changed
    this.violationsCache.clear();
    
    console.log('[DEBUG] Image cache cleared successfully');
  }

  // CRITICAL FIX: Refresh NFT data for a specific card
  async refreshNFTData(card, seed) {
    console.log('[DEBUG] Refreshing NFT data for seed:', seed);
    
    try {
      // Get fresh project data
      const projectData = window.NFTApp?.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData) {
        console.error('[DEBUG] No project data available for NFT refresh');
        return;
      }
      
      // Generate fresh NFT data for this seed
      const generateNfts = window.NFTApp?.getModule('generateNfts');
      if (!generateNfts) {
        console.error('[DEBUG] GenerateNfts module not available');
        return;
      }
      
      console.log('[DEBUG] Generating fresh NFT for seed:', seed);
      const freshNFT = await generateNfts.generateSingleNFT(projectData, false, seed);
      
      if (freshNFT) {
        console.log('[DEBUG] Fresh NFT generated for seed:', seed);
        
        // Update the seed object in the seedList with fresh data
        const seedIndex = this.seedList.findIndex(s => s.seed === seed);
        if (seedIndex !== -1) {
          // Preserve the original seed value but update other data
          this.seedList[seedIndex] = {
            ...this.seedList[seedIndex],
            traits: freshNFT.traits,
            imageData: freshNFT.imageData,
            thumbnail: freshNFT.thumbnail
          };
          
          console.log('[DEBUG] Updated seedList with fresh NFT data for seed:', seed);
          
          // Force reload the thumbnail with fresh data
          this.loadThumbnail(card, seed, true);
          
          // Update rarity display if needed
          setTimeout(() => {
            this.refreshRarityDisplayOnCard(card, seed);
          }, 100);
        }
      } else {
        console.warn('[DEBUG] Failed to generate fresh NFT for seed:', seed);
      }
    } catch (error) {
      console.error('[DEBUG] Error refreshing NFT data for seed:', seed, error);
    }
  }

  // Helper method to refresh rarity display on a specific card
  refreshRarityDisplayOnCard(card, seed) {
    const rarityElement = card.querySelector('.seed-card-rarity');
    if (rarityElement) {
      const rarityRank = this.getRarityRank(seed);
      if (rarityRank && rarityRank !== '---') {
        rarityElement.textContent = `rarity rank: ${rarityRank}`;
      } else {
        rarityElement.textContent = '---';
      }
    }
  }


  // Create drop zones between cards (simplified approach)
  createDropZones() {
    console.log('[DEBUG] Creating drop zones between cards');
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) return;

    // Enable drag mode
    grid.classList.add('drag-mode');

    const cards = grid.querySelectorAll('.saved-seed-card');
    console.log('[DEBUG] Creating drop zones for', cards.length, 'cards');

    // Add visual indicators and drop event handlers to cards
    cards.forEach((card, i) => {
      // Add a visual indicator that shows this card can be a drop target
      card.classList.add('drop-target');
      
      // Add data attributes for positioning
      const startIndex = (this.currentPage - 1) * this.pageSize;
      const globalIndex = startIndex + i;
      card.dataset.globalIndex = globalIndex;
      card.dataset.position = i;
      
      // Add dragover event listener
      card.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        if (this.draggedElement && this.draggedElement !== card) {
          card.classList.add('drag-over');
          console.log('[DEBUG] Dragover on card at global index:', globalIndex);
        }
      });

      // Add dragleave event listener
      card.addEventListener('dragleave', (e) => {
        if (!card.contains(e.relatedTarget)) {
          card.classList.remove('drag-over');
        }
      });

      // Add drop event listener
      card.addEventListener('drop', (e) => {
        e.preventDefault();
        card.classList.remove('drag-over');
        
        const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
        console.log('[DEBUG] Drop on card at global index:', globalIndex);
        console.log('[DEBUG] Dragged index:', draggedIndex);
        
        if (draggedIndex !== globalIndex && draggedIndex !== undefined && !isNaN(draggedIndex)) {
          console.log('[DEBUG] Moving seed from index', draggedIndex, 'to index', globalIndex);
          this.reorderSeeds(draggedIndex, globalIndex);
        }
      });
    });
  }


  // Remove all drop zones
  removeDropZones() {
    console.log('[DEBUG] Removing drop zones');
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) return;

    // Disable drag mode
    grid.classList.remove('drag-mode');

    // Remove visual indicators from cards
    const cards = grid.querySelectorAll('.saved-seed-card');
    cards.forEach(card => {
      card.classList.remove('drop-target', 'drag-over');
    });
  }

  // Set up cross-page drag detection
  setupCrossPageDragDetection() {
    if (!this.modal) return;
    
    const pagination = this.modal.querySelector('#saved-seeds-pagination');
    if (!pagination) return;
    
    // Add dragover event to pagination container
    pagination.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      // Find the pagination button being hovered
      const pageButton = e.target.closest('.pagination-btn');
      if (!pageButton || pageButton.disabled) return;
      
      const buttonText = pageButton.innerHTML || pageButton.textContent;
      const normalizedText = buttonText.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
      
      // Handle page number buttons (with delay)
      if (normalizedText.match(/^\d+$/)) {
        const pageNumber = parseInt(normalizedText);
        this.handleDragOverPage(pageNumber);
      }
      // Handle navigation buttons (<, <<, >, >>) - switch continuously while hovering
      else if (normalizedText === '<' || normalizedText === '<<' || normalizedText === '>' || normalizedText === '>>') {
        // Track that we're hovering over a navigation button
        if (this.dragOverNavigationButton !== normalizedText) {
          // New navigation button hover - start continuous navigation
          this.dragOverNavigationButton = normalizedText;
          this.startContinuousNavigation(normalizedText, pageButton);
        }
        
        // Always add visual feedback when hovering over navigation buttons
        pageButton.classList.add('drag-hover');
        // Remove highlight from other buttons
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
          if (btn !== pageButton) {
            btn.classList.remove('drag-hover');
          }
        });
      }
    });
    
    // Add dragleave event to pagination container
    pagination.addEventListener('dragleave', (e) => {
      // Check if we're leaving a specific button
      const pageButton = e.target.closest('.pagination-btn');
      if (pageButton) {
        // Check if it's a navigation button
        const buttonText = pageButton.innerHTML || pageButton.textContent;
        const normalizedText = buttonText.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
        
        if (normalizedText === '<' || normalizedText === '<<' || normalizedText === '>' || normalizedText === '>>') {
          // Leaving a navigation button - stop continuous navigation
          if (this.dragOverNavigationButton === normalizedText) {
            this.stopContinuousNavigation();
          }
        }
        
        // Remove drag-hover class from the button being left
        pageButton.classList.remove('drag-hover');
      }
      
      // Only clear page state if leaving the pagination area entirely
      if (!pagination.contains(e.relatedTarget)) {
        this.clearDragOverPage();
        
        // Remove drag-hover class from all buttons
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
          btn.classList.remove('drag-hover');
        });
      }
    });
    
    // Add drop event to pagination container
    pagination.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDropOnPage();
    });
  }

  // Handle drag over a page number
  handleDragOverPage(pageNumber) {
    if (this.dragOverPageNumber === pageNumber) return;
    
    // Clear any existing timeout
    if (this.dragOverPageTimeout) {
      clearTimeout(this.dragOverPageTimeout);
    }
    
    this.dragOverPageNumber = pageNumber;
    
    // Add visual feedback to the page button
    this.highlightPageButton(pageNumber);
    
    // Set a timeout to switch pages (500ms delay for better UX)
    this.dragOverPageTimeout = setTimeout(() => {
      if (this.dragOverPageNumber === pageNumber && pageNumber !== this.currentPage) {
        console.log('[DEBUG] Switching to page', pageNumber, 'during drag');
        this.switchToPageDuringDrag(pageNumber);
      }
    }, 500);
  }

  // Clear drag over page state
  clearDragOverPage() {
    if (this.dragOverPageTimeout) {
      clearTimeout(this.dragOverPageTimeout);
      this.dragOverPageTimeout = null;
    }
    
    if (this.dragOverPageNumber) {
      this.unhighlightPageButton(this.dragOverPageNumber);
      this.dragOverPageNumber = null;
    }
    
    // Also stop continuous navigation if active
    this.stopContinuousNavigation();
  }
  
  // Start continuous page navigation while hovering over <, <<, >, or >>
  startContinuousNavigation(buttonText, pageButton) {
    // Stop any existing navigation
    this.stopContinuousNavigation();
    
    // Get the initial target page
    const initialTarget = this.getTargetPageForButton(pageButton, buttonText);
    if (initialTarget === null || initialTarget === this.currentPage) {
      return; // Can't navigate further
    }
    
    // Switch to initial page immediately
    console.log('[DEBUG] Starting continuous navigation:', buttonText, '- initial target:', initialTarget);
    this.switchToPageDuringDrag(initialTarget);
    
    // Set up interval to continue switching while hovering
    // Use a delay to allow the page switch to complete before calculating next page
    this.navigationSwitchInterval = setInterval(() => {
      // Recalculate target page based on current page (which may have changed)
      const currentTarget = this.getTargetPageForButton(pageButton, buttonText);
      
      if (currentTarget !== null && currentTarget !== this.currentPage && currentTarget >= 1) {
        console.log('[DEBUG] Continuous navigation:', buttonText, '- switching to page', currentTarget);
        this.switchToPageDuringDrag(currentTarget);
      } else {
        // Can't navigate further, stop
        this.stopContinuousNavigation();
      }
    }, 2000); // Switch every 2000ms (2 seconds) while hovering
  }
  
  // Stop continuous page navigation
  stopContinuousNavigation() {
    if (this.navigationSwitchInterval) {
      clearInterval(this.navigationSwitchInterval);
      this.navigationSwitchInterval = null;
    }
    
    if (this.dragOverNavigationButton) {
      // Remove visual feedback from all navigation buttons
      const pagination = this.modal?.querySelector('#saved-seeds-pagination');
      if (pagination) {
        pagination.querySelectorAll('.pagination-btn').forEach(btn => {
          btn.classList.remove('drag-hover');
        });
      }
      this.dragOverNavigationButton = null;
    }
  }

  // Clean up cross-page drag detection
  cleanupCrossPageDragDetection() {
    this.clearDragOverPage();
    
    // Remove all event listeners from pagination
    if (this.modal) {
      const pagination = this.modal.querySelector('#saved-seeds-pagination');
      if (pagination) {
        pagination.removeEventListener('dragover', this.handleDragOverPage);
        pagination.removeEventListener('dragleave', this.clearDragOverPage);
        pagination.removeEventListener('drop', this.handleDropOnPage);
      }
    }
  }

  // Highlight a page button during drag
  highlightPageButton(pageNumber) {
    const pagination = this.modal.querySelector('#saved-seeds-pagination');
    if (!pagination) return;
    
    const pageButtons = pagination.querySelectorAll('.pagination-btn');
    pageButtons.forEach(btn => {
      if (btn.textContent === pageNumber.toString()) {
        btn.classList.add('drag-over-page');
        btn.style.backgroundColor = '#4a90e2';
        btn.style.color = 'white';
        btn.style.transform = 'scale(1.1)';
        btn.style.transition = 'all 0.2s ease';
      }
    });
  }

  // Unhighlight a page button
  unhighlightPageButton(pageNumber) {
    const pagination = this.modal.querySelector('#saved-seeds-pagination');
    if (!pagination) return;
    
    const pageButtons = pagination.querySelectorAll('.pagination-btn');
    pageButtons.forEach(btn => {
      if (btn.textContent === pageNumber.toString()) {
        btn.classList.remove('drag-over-page');
        btn.style.backgroundColor = '';
        btn.style.color = '';
        btn.style.transform = '';
        btn.style.transition = '';
      }
    });
  }

  // Switch to a page during drag
  switchToPageDuringDrag(pageNumber) {
    if (pageNumber === this.currentPage) return;
    
    console.log('[DEBUG] Switching to page', pageNumber, 'during drag');
    
    // Switch to the new page
    this.goToPage(pageNumber, false);
    
    // Recreate drop zones on the new page
    this.createDropZones();
  }

  // Handle drop on a page (when dropping on pagination area)
  handleDropOnPage() {
    if (this.dragOverPageNumber && this.dragOverPageNumber !== this.currentPage) {
      // Switch to the target page first
      this.switchToPageDuringDrag(this.dragOverPageNumber);
      
      // Then handle the drop on the first position of that page
      setTimeout(() => {
        this.handleDropOnPagePosition(0);
      }, 100);
    }
  }

  // Handle drop on a specific position within a page
  handleDropOnPagePosition(position) {
    if (!this.draggedElement || this.draggedIndex === null) return;
    
    const currentList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    const totalPages = Math.ceil(currentList.length / this.pageSize);
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const targetIndex = startIndex + position;
    
    console.log('[DEBUG] Dropping at page position', position, 'global index', targetIndex);
    
    // Perform the reorder
    this.reorderSeeds(this.draggedIndex, targetIndex);
  }

  // Setup drag and drop for all cards on the current page
  setupDragAndDropForAllCards() {
    console.log('[DEBUG] Setting up drag and drop for all cards');
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.error('[DEBUG] No grid found for drag and drop setup');
      return;
    }

    const cards = grid.querySelectorAll('.saved-seed-card');
    console.log('[DEBUG] Found', cards.length, 'cards to setup drag and drop');
    
    if (cards.length === 0) {
      console.warn('[DEBUG] No cards found for drag and drop setup');
      return;
    }
    
    cards.forEach((card, index) => {
      const globalIndex = parseInt(card.dataset.index);
      const seed = card.dataset.seed;
      
      if (globalIndex !== undefined && seed) {
        console.log('[DEBUG] Setting up drag and drop for card', globalIndex, 'seed', seed);
        
        // Make sure the card is draggable
        card.draggable = true;
        card.style.cursor = 'grab';
        
        // Prevent buttons from interfering with drag
        const buttons = card.querySelectorAll('.seed-card-btn');
        buttons.forEach(btn => {
          btn.addEventListener('mousedown', (e) => {
            e.stopPropagation();
          });
          
          btn.addEventListener('dragstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
          });
        });

        // Drag start event
        card.addEventListener('dragstart', (e) => {
          console.log('[DEBUG] ===== DRAG STARTED =====');
          console.log('[DEBUG] Card index:', globalIndex);
          console.log('[DEBUG] Card seed:', seed);
          console.log('[DEBUG] Event target:', e.target);
          console.log('[DEBUG] Card element:', card);
          
          e.dataTransfer.setData('text/plain', globalIndex.toString());
          e.dataTransfer.effectAllowed = 'move';
          
          // Add visual feedback
          card.classList.add('dragging');
          card.style.cursor = 'grabbing';
          
          // Store the dragged element and original page
          this.draggedElement = card;
          this.draggedIndex = globalIndex;
          this.originalPage = this.currentPage;
          
          // Enable pagination buttons during drag
          this.enablePaginationDuringDrag();
          
          // Show drop zones between cards
          this.createDropZones();
        });

        // Drag end event
        card.addEventListener('dragend', (e) => {
          console.log('[DEBUG] ===== DRAG ENDED =====');
          
          // Remove visual feedback
          card.classList.remove('dragging');
          card.style.cursor = 'grab';
          
          // Clear dragged element
          this.draggedElement = null;
          this.draggedIndex = null;
          this.originalPage = null;
          
          // Disable pagination buttons after drag (restore normal state)
          this.disablePaginationAfterDrag();
          
          // Hide drop zones
          this.removeDropZones();
        });
      }
    });
  }

  reorderSeeds(fromIndex, toIndex) {
    console.log('[DEBUG] ===== REORDERING SEEDS =====');
    console.log('[DEBUG] Reordering seeds from index', fromIndex, 'to index', toIndex);
    console.log('[DEBUG] Current page:', this.currentPage, 'Page size:', this.pageSize);
    
    // The indices passed are already global indices (from createNFTCard)
    const globalFromIndex = fromIndex;
    const globalToIndex = toIndex;
    
    console.log('[DEBUG] Using global indices directly - from:', globalFromIndex, 'to:', globalToIndex);
    console.log('[DEBUG] Seed list length:', this.seedList.length);
    
    // Show before state
    console.log('[DEBUG] BEFORE reorder - seeds:', this.seedList.map(s => s.seed));
    
    // Validate indices
    if (globalFromIndex < 0 || globalFromIndex >= this.seedList.length ||
        globalToIndex < 0 || globalToIndex >= this.seedList.length) {
      console.log('[DEBUG] Invalid indices for reordering');
      return;
    }
    
    // Reorder the seed list - handle index shifting correctly
    const seedToMove = this.seedList[globalFromIndex];
    
    if (globalFromIndex < globalToIndex) {
      // Moving down: remove first, then insert at adjusted position
      this.seedList.splice(globalFromIndex, 1);
      this.seedList.splice(globalToIndex - 1, 0, seedToMove);
    } else {
      // Moving up: insert first, then remove at adjusted position
      this.seedList.splice(globalToIndex, 0, seedToMove);
      this.seedList.splice(globalFromIndex + 1, 1);
    }
    
    console.log('[DEBUG] Seed reordered successfully');
    console.log('[DEBUG] AFTER reorder - seeds:', this.seedList.map(s => s.seed));
    console.log('[DEBUG] Moved seed:', seedToMove.seed, 'from position', globalFromIndex, 'to position', globalToIndex);
    
    // Also reorder rarity ranks to maintain correspondence
    this.reorderRarityRanks(globalFromIndex, globalToIndex);
    
    // Save the updated seed list to localStorage (working copy)
    const saveSuccess = this.saveSeedList();
    
    if (!saveSuccess) {
      console.log('[DEBUG] Failed to save reordered seeds to localStorage');
      return;
    }
    
    // Instead of rerendering, just move the DOM cards and update their data attributes
    this.reorderCardsInDOM(globalFromIndex, globalToIndex);
    
    // Update NFT numbers for affected cards
    this.updateNFTNumbersAfterReorder(globalFromIndex, globalToIndex);
    
    // Note: Rarity status remains unchanged when NFTs are reordered
    // Only the positions change, not the rarity ranks themselves
    
    // Update the seed list counter to reflect any changes
    this.updateSeedListCounter();
    
    // Show success message
    if (window.NFTApp.getModule('notificationService')) {
      window.NFTApp.getModule('notificationService').show(
        `Seed moved successfully! Changes saved to working copy. Save project to persist permanently.`,
        'success',
        3000
      );
    } else {
      console.log('[DEBUG] Seed moved successfully! Changes saved to working copy. Save project to persist permanently.');
    }
  }

  // Reorder cards in the DOM without rerendering - efficient drag and drop
  reorderCardsInDOM(fromIndex, toIndex) {
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) return;
    
    const cards = Array.from(grid.querySelectorAll('.saved-seed-card'));
    if (cards.length === 0) return;
    
    // Get the current list to determine what's on the current page
    const currentList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, currentList.length);
    
    // Check if both indices are on the current page
    const fromOnPage = fromIndex >= startIndex && fromIndex < endIndex;
    const toOnPage = toIndex >= startIndex && toIndex < endIndex;
    
    if (!fromOnPage || !toOnPage) {
      // If the move involves cards not on the current page, we need to rerender
      console.log('[DEBUG] Reorder involves cards not on current page, rerendering needed');
      if (this.modal) {
        this.renderPage(this.currentPage);
      }
      return;
    }
    
    // Convert global indices to page-local indices
    const fromLocalIndex = fromIndex - startIndex;
    const toLocalIndex = toIndex - startIndex;
    
    // Get the cards to move
    const fromCard = cards[fromLocalIndex];
    const toCard = cards[toLocalIndex];
    
    if (!fromCard || !toCard || fromCard === toCard) {
      console.log('[DEBUG] Cards not found or same card, cannot reorder in DOM');
      return;
    }
    
    // Move the card in the DOM
    if (fromIndex < toIndex) {
      // Moving down: insert after the target card
      toCard.after(fromCard);
    } else {
      // Moving up: insert before the target card
      toCard.before(fromCard);
    }
    
    // Update all data-index attributes on visible cards to match their new order
    const reorderedCards = Array.from(grid.querySelectorAll('.saved-seed-card'));
    reorderedCards.forEach((card, position) => {
      const newGlobalIndex = startIndex + position;
      card.dataset.index = newGlobalIndex;
      card.dataset.dragIndex = newGlobalIndex;
    });
    
    console.log('[DEBUG] Card moved in DOM from index', fromIndex, 'to', toIndex);
  }

  // Update NFT numbers for cards affected by reordering
  updateNFTNumbersAfterReorder(fromIndex, toIndex) {
    const grid = this.modal.querySelector('#saved-seeds-grid');
    if (!grid) return;
    
    const cards = Array.from(grid.querySelectorAll('.saved-seed-card'));
    
    // Determine the range of cards that need number updates
    const minIndex = Math.min(fromIndex, toIndex);
    const maxIndex = Math.max(fromIndex, toIndex);
    
    // Get the current list to determine what's on the current page
    const currentList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = Math.min(startIndex + this.pageSize, currentList.length);
    
    // Only update cards that are visible on the current page and affected by the reorder
    cards.forEach((card, cardPosition) => {
      const globalIndex = parseInt(card.dataset.index);
      
      if (globalIndex >= startIndex && globalIndex < endIndex && globalIndex >= minIndex && globalIndex <= maxIndex) {
        // Calculate the new NFT number (1-based, relative to the entire list)
        const nftNumber = globalIndex + 1;
        const numberDisplay = card.querySelector('.seed-card-number-display');
        if (numberDisplay) {
          numberDisplay.textContent = `#${nftNumber}`;
        }
      }
    });
    
    console.log('[DEBUG] NFT numbers updated for reordered cards');
  }

  // Update NFT numbers for all cards based on current order
  updateNFTNumbers() {
    console.log('[DEBUG] Updating NFT numbers for all cards');
    
    const cards = this.modal.querySelectorAll('.saved-seed-card');
    cards.forEach((card, index) => {
      const numberDisplay = card.querySelector('.seed-card-number-display');
      if (numberDisplay) {
        // Calculate global NFT number based on current page and local index
        // This ensures NFT numbers reflect their actual position in the collection
        const globalIndex = (this.currentPage - 1) * this.pageSize + index;
        const newNumber = globalIndex + 1;
        numberDisplay.textContent = `#${newNumber}`;
        console.log('[DEBUG] Updated card', index, 'to global number', newNumber, '(page', this.currentPage, ', local index', index, ')');
      }
    });
    
    console.log('[DEBUG] NFT numbers updated for', cards.length, 'cards on page', this.currentPage);
  }

  // Reorder rarity ranks to maintain correspondence with seed list
  reorderRarityRanks(fromIndex, toIndex) {
    console.log('[DEBUG] ===== REORDERING RARITY RANKS =====');
    console.log('[DEBUG] Reordering rarity ranks from index', fromIndex, 'to index', toIndex);
    
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    
    if (!projectData || !projectData.rarityRanks || !Array.isArray(projectData.rarityRanks)) {
      console.log('[DEBUG] No rarity ranks found in project data - skipping rarity reorder');
      return;
    }
    
    const rarityRanks = projectData.rarityRanks;
    console.log('[DEBUG] Rarity ranks array length:', rarityRanks.length);
    console.log('[DEBUG] BEFORE rarity reorder - first 5:', rarityRanks.slice(0, 5));
    
    // Validate indices
    if (fromIndex < 0 || fromIndex >= rarityRanks.length ||
        toIndex < 0 || toIndex >= rarityRanks.length) {
      console.log('[DEBUG] Invalid indices for rarity reordering');
      return;
    }
    
    // Reorder the rarity ranks array using the same logic as seeds
    const rarityToMove = rarityRanks[fromIndex];
    
    if (fromIndex < toIndex) {
      // Moving down: remove first, then insert at adjusted position
      rarityRanks.splice(fromIndex, 1);
      rarityRanks.splice(toIndex - 1, 0, rarityToMove);
    } else {
      // Moving up: insert first, then remove at adjusted position
      rarityRanks.splice(toIndex, 0, rarityToMove);
      rarityRanks.splice(fromIndex + 1, 1);
    }
    
    console.log('[DEBUG] Rarity ranks reordered successfully');
    console.log('[DEBUG] AFTER rarity reorder - first 5:', rarityRanks.slice(0, 5));
    console.log('[DEBUG] Moved rarity rank:', rarityToMove, 'from position', fromIndex, 'to position', toIndex);
    
    // Also update localStorage if it exists
    this.updateLocalStorageRarityRanks(rarityRanks);
    
    // Update the project data in memory (without saving file)
    this.updateProjectRarityRanks(rarityRanks);
  }

  // Update localStorage rarity ranks
  updateLocalStorageRarityRanks(rarityRanks) {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    if (!projectData) return;
    
    try {
      const rarityKey = 'rarityRanks_' + encodeURIComponent(projectData.name);
      localStorage.setItem(rarityKey, JSON.stringify(rarityRanks));
      console.log('[DEBUG] Updated localStorage rarity ranks for', rarityRanks.length, 'NFTs');
    } catch (e) {
      console.warn('Failed to update localStorage rarity ranks:', e);
    }
  }

  // Update project rarity ranks in memory (without saving file)
  updateProjectRarityRanks(rarityRanks) {
    const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
    if (!projectData) return;
    
    try {
      // Update the project data in memory only
      projectData.rarityRanks = rarityRanks;
      console.log('[DEBUG] Updated project rarity ranks in memory (not saved to file)');
    } catch (e) {
      console.warn('Failed to update project rarity ranks:', e);
    }
  }

  // Test method to manually test reordering logic
  testReorderLogic() {
    console.log('[DEBUG] ===== TESTING REORDER LOGIC =====');
    
    if (this.seedList.length < 2) {
      console.log('[DEBUG] Need at least 2 seeds to test reordering');
      return;
    }
    
    console.log('[DEBUG] Original order:', this.seedList.map(s => s.seed));
    
    // Test moving first seed to second position
    const testFromIndex = 0;
    const testToIndex = 1;
    
    console.log('[DEBUG] Testing move from index', testFromIndex, 'to index', testToIndex);
    
    // Perform the reorder
    const seedToMove = this.seedList[testFromIndex];
    this.seedList.splice(testFromIndex, 1);
    this.seedList.splice(testToIndex, 0, seedToMove);
    
    console.log('[DEBUG] After test reorder:', this.seedList.map(s => s.seed));
    
    // Save and reload
    this.saveSeedList();
    this.loadSeedList();
    
    console.log('[DEBUG] After save/reload:', this.seedList.map(s => s.seed));
  }

  finalReorderVerification(originalFromIndex, originalToIndex, movedSeed) {
    console.log('[DEBUG] ===== FINAL REORDER VERIFICATION =====');
    
    // Reload from localStorage to get the actual saved state
    this.loadSeedList();
    
    console.log('[DEBUG] Current seed list after reload:', this.seedList.map(s => s.seed));
    console.log('[DEBUG] Looking for moved seed:', movedSeed.seed);
    
    // Find where the moved seed is now
    const currentPosition = this.seedList.findIndex(s => s.seed === movedSeed.seed);
    console.log('[DEBUG] Moved seed is now at position:', currentPosition);
    console.log('[DEBUG] Expected position:', originalToIndex);
    
    if (currentPosition === originalToIndex) {
      console.log('[DEBUG] ✅ REORDER SUCCESSFUL - Seed is in correct position');
    } else {
      console.log('[DEBUG] ❌ REORDER FAILED - Seed is not in expected position');
      console.log('[DEBUG] Expected:', originalToIndex, 'Actual:', currentPosition);
    }
    
    // Also check the visual display
    const modal = document.getElementById('saved-seeds-modal');
    if (modal) {
      const cards = modal.querySelectorAll('.saved-seed-card');
      console.log('[DEBUG] Visual cards count:', cards.length);
      cards.forEach((card, index) => {
        const seedNumber = card.querySelector('.seed-card-number');
        if (seedNumber) {
          console.log('[DEBUG] Visual card', index, 'shows seed:', seedNumber.textContent);
        }
      });
    }
  }

  verifyReorderSaved() {
    try {
      // Reload the seed list from localStorage to verify it was saved correctly
      const savedData = localStorage.getItem(this.seedListKey);
      let savedSeedList = [];
      if (savedData) {
        try {
          savedSeedList = JSON.parse(savedData);
        } catch (parseError) {
          console.error('[DEBUG] Error parsing saved data for verification:', parseError);
          localStorage.removeItem(this.seedListKey);
          return;
        }
      }
      console.log('[DEBUG] Verifying reorder - saved data length:', savedSeedList.length);
      console.log('[DEBUG] Verifying reorder - current data length:', this.seedList.length);
      
      if (savedSeedList.length === this.seedList.length) {
        // Check if the order matches
        const orderMatches = savedSeedList.every((savedSeed, index) => {
          return savedSeed.seed === this.seedList[index].seed;
        });
        
        if (orderMatches) {
          console.log('[DEBUG] ✅ Reorder verification successful - order matches');
        } else {
          console.log('[DEBUG] ⚠️ Reorder verification failed - order mismatch');
          console.log('[DEBUG] Saved order:', savedSeedList.map(s => s.seed));
          console.log('[DEBUG] Current order:', this.seedList.map(s => s.seed));
        }
      } else {
        console.log('[DEBUG] ⚠️ Reorder verification failed - length mismatch');
      }
    } catch (error) {
      console.error('[DEBUG] Error verifying reorder:', error);
    }
  }

  updateSeedDisplay(seed) {
    console.log('[DEBUG] Updating seed display with:', seed);
    
    // Update the main seed box
    const seedBox = document.querySelector('.nft-seed-box');
    if (seedBox) {
      seedBox.textContent = seed;
      console.log('[DEBUG] Updated .nft-seed-box with:', seed);
    } else {
      console.log('[DEBUG] .nft-seed-box not found');
    }
    
    // Update the seed number display
    const seedNumber = document.querySelector('.seed-number');
    if (seedNumber) {
      seedNumber.textContent = seed;
      console.log('[DEBUG] Updated .seed-number with:', seed);
    } else {
      console.log('[DEBUG] .seed-number not found');
    }
    
    // Update the seed input field if it exists
    const seedInput = document.querySelector('input[type="text"][placeholder*="seed" i]');
    if (seedInput) {
      seedInput.value = seed;
      console.log('[DEBUG] Updated seed input with:', seed);
    } else {
      console.log('[DEBUG] Seed input not found');
    }
    
    // Also update the lastGeneratedNFT seed
    if (window.lastGeneratedNFT) {
      window.lastGeneratedNFT.seed = seed;
      console.log('[DEBUG] Updated window.lastGeneratedNFT.seed with:', seed);
    }
  }

  verifyTraitsPanelUpdate(nft, expectedSeed) {
    console.log('[DEBUG] Verifying traits panel update for seed:', expectedSeed);
    
    // Check if the traits panel shows the correct traits
    const traitInfoList = document.querySelector('.nft-trait-info-list');
    if (!traitInfoList) {
      console.log('[DEBUG] ❌ Traits panel not found');
      return;
    }
    
    const traitItems = traitInfoList.querySelectorAll('.nft-trait-info-item');
    console.log('[DEBUG] Found', traitItems.length, 'trait items in panel');
    
    // Check if the traits match the NFT
    if (nft && nft.traits) {
      console.log('[DEBUG] NFT traits count:', nft.traits.length);
      console.log('[DEBUG] NFT traits:', nft.traits.map(t => `${t.layer?.name || t.layer}: ${t.trait?.name || t.trait}`));
      
      // Verify each trait in the panel matches the NFT
      traitItems.forEach((item, index) => {
        const layerName = item.querySelector('.nft-trait-layer-name')?.textContent;
        const traitName = item.querySelector('.nft-trait-name')?.textContent;
        
        if (layerName && traitName) {
          console.log('[DEBUG] Panel trait', index, ':', layerName, '->', traitName);
          
          // Find matching trait in NFT
          const matchingTrait = nft.traits.find(t => 
            (t.layer?.name || t.layer) === layerName && 
            (t.trait?.name || t.trait) === traitName
          );
          
          if (matchingTrait) {
            console.log('[DEBUG] ✅ Trait matches NFT');
          } else {
            console.log('[DEBUG] ❌ Trait does not match NFT');
          }
        }
      });
    }
    
    // Check if the seed matches in various seed display elements
    const seedBox = document.querySelector('.nft-seed-box');
    const seedNumber = document.querySelector('.seed-number');
    
    if (seedBox) {
      const displayedSeed = seedBox.textContent;
      console.log('[DEBUG] Seed box displayed seed:', displayedSeed, 'Expected:', expectedSeed);
      if (displayedSeed === expectedSeed) {
        console.log('[DEBUG] ✅ Seed box matches');
      } else {
        console.log('[DEBUG] ❌ Seed box does not match');
      }
    }
    
    if (seedNumber) {
      const displayedSeed = seedNumber.textContent;
      console.log('[DEBUG] Seed number displayed seed:', displayedSeed, 'Expected:', expectedSeed);
      if (displayedSeed === expectedSeed) {
        console.log('[DEBUG] ✅ Seed number matches');
      } else {
        console.log('[DEBUG] ❌ Seed number does not match');
      }
    }
  }

  async editSeed(seedObj, index) {
    try {
      console.log('[DEBUG] Opening NFT Edit Modal for seed at index:', index);
      
      // Use the passed seedObj (which is now fresh data from seedList)
      const currentSeedObj = seedObj;
      if (!currentSeedObj) {
        console.error('[DEBUG] No seed found at index:', index);
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Seed not found',
            'error',
            3000
          );
        }
        return;
      }
      
      console.log('[DEBUG] Using fresh seed data:', currentSeedObj.seed, 'at index:', index);
      
      // Get the project data
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (!projectData || !projectData.traits || projectData.traits.length === 0) {
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'No project data available for editing',
            'error',
            3000
          );
        }
        return;
      }
      
      console.log('[DEBUG] Using saved traits for editing:', currentSeedObj.traits);
      console.log('[DEBUG] Full currentSeedObj structure:', currentSeedObj);
      console.log('[DEBUG] Project data available:', !!projectData);
      console.log('[DEBUG] Project traits:', projectData?.traits?.length);
      
      // Create NFT object using fresh saved traits instead of regenerating
      const nft = {
        seed: currentSeedObj.seed,
        traits: currentSeedObj.traits || [],
        rarityScore: currentSeedObj.rarityScore || 0,
        thumbnail: currentSeedObj.thumbnail || '',
        imageData: currentSeedObj.imageData || currentSeedObj.thumbnail || ''
      };
      
      console.log('[DEBUG] Using fresh NFT data from seeds list - no cache dependencies');
      console.log('[DEBUG] Current seedObj from seeds list:', JSON.stringify(currentSeedObj, null, 2));
      console.log('[DEBUG] Created NFT object:', JSON.stringify(nft, null, 2));
      
      // If we have saved traits, regenerate the image using those traits
      if (nft.traits && nft.traits.length > 0) {
        console.log('[DEBUG] Regenerating image using saved traits...');
        
        // Create canvas and render the NFT with saved traits
        const canvas = document.createElement('canvas');
        canvas.width = 1000;
        canvas.height = 1000;
        const ctx = canvas.getContext('2d');
        
        // Load all trait images and render them
        const imagePromises = [];
        
        for (const traitInfo of nft.traits) {
          const trait = traitInfo.trait;
          
          // Skip 'none' traits
          if (!trait || trait === 'none' || trait.name === 'none' || trait.id === 'none') {
            continue;
          }
          
          // Get the trait image
          let imagePath = trait.image || trait.imageData || trait.imageSrc || trait.src;
          
          if (!imagePath && projectData && projectData.traits) {
            // Try to find the trait in project data
            const layerData = projectData.traits.find(l => 
              l.id === traitInfo.layer?.id || l.name === traitInfo.layer?.name || l.name === traitInfo.layer
            );
            
            if (layerData && layerData.traits) {
              const projectTrait = layerData.traits.find(t => 
                t.id === trait.id || t.name === trait.name
              );
              
              if (projectTrait) {
                imagePath = projectTrait.image || projectTrait.imageData || projectTrait.imageSrc || projectTrait.src;
              }
            }
          }
          
          if (imagePath) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            imagePromises.push(
              new Promise((resolve) => {
                img.onload = () => {
                  ctx.drawImage(img, 0, 0, 1000, 1000);
                  resolve();
                };
                img.onerror = () => {
                  console.warn('[DEBUG] Failed to load trait image:', imagePath);
                  resolve();
                };
                img.src = imagePath;
              })
            );
          }
        }
        
        // Wait for all images to load and render
        await Promise.all(imagePromises);
        
        // Convert canvas to image data
        nft.imageData = canvas.toDataURL('image/png');
        console.log('[DEBUG] Image regenerated using saved traits');
        
        // Update the thumbnail as well for consistency
        nft.thumbnail = nft.imageData;
      } else {
        console.log('[DEBUG] No saved traits found, generating NFT from seed...');
        
        // Fallback: Generate NFT using the original seed
        const generateNftsModule = window.NFTApp.getModule('generateNfts');
        if (generateNftsModule) {
          try {
            const generatedNFT = await generateNftsModule.generateSingleNFT(projectData, false, seedObj.seed);
            if (generatedNFT) {
              nft.traits = generatedNFT.traits;
              nft.imageData = generatedNFT.imageData;
              nft.thumbnail = generatedNFT.imageData;
              console.log('[DEBUG] NFT generated from seed as fallback');
            }
          } catch (error) {
            console.error('[DEBUG] Error generating NFT from seed:', error);
          }
        }
      }
      
      console.log('[DEBUG] NFT prepared for editing, opening edit modal');
      
      // Open the NFT Edit Modal
      if (window.NFTEditModal) {
        window.NFTEditModal.open(
          nft,
          projectData,
          'saved-seeds',
          index,
          (updatedNFT, nftIndex) => {
            // Update callback: update the NFT in the saved seeds collection (immediate)
            console.log('[DEBUG] Updating NFT in saved seeds collection at index:', nftIndex);
            
            // Start timing the update process
            const startTime = Date.now();
            
            // Store the original seed before updating
            const originalSeed = this.seedList[nftIndex].seed;
            console.log('[DEBUG] Original seed:', originalSeed, 'New seed:', updatedNFT.seed);
            
            // Update the seed list with the new NFT data (include imageData if available)
            this.seedList[nftIndex] = {
              seed: updatedNFT.seed,
              traits: updatedNFT.traits,
              rarity: updatedNFT.rarity || 'common',
              rarityScore: updatedNFT.rarityScore,
              imageData: updatedNFT.imageData || null,
              thumbnail: updatedNFT.thumbnail || updatedNFT.imageData || null,
              timestamp: Date.now()
            };
            
            // Mark trait rarities as outdated when NFT is edited
            this.updateTraitRaritiesStatus('outdated');
            
            // Also update the image cache with the new image
            if (updatedNFT.imageData) {
              this.imageCache[updatedNFT.seed] = updatedNFT.imageData;
              if (!window.savedSeedsImageCache) {
                window.savedSeedsImageCache = {};
              }
              window.savedSeedsImageCache[updatedNFT.seed] = updatedNFT.imageData;
              console.log('[DEBUG] Updated image cache for new seed:', updatedNFT.seed);
            }
            
            console.log('[DEBUG] Updated seedList at index', nftIndex, 'with new seed:', updatedNFT.seed);
            
            // CRITICAL: Update NFT data - simplified approach
            try {
              console.log('[DEBUG] Updating NFT after editing...');
              
              // 1. Update MemoryManager first (highest priority for project saving)
              if (window.MemoryManager) {
                try {
                  const memoryManagerStart = Date.now();
                  console.log('[DEBUG] Updating MemoryManager with edited NFT...');
                  console.log('[DEBUG] MemoryManager state:', {
                    hasCurrentProject: !!window.MemoryManager.state.currentProject,
                    projectName: window.MemoryManager.state.currentProject?.name,
                    savedSeedsCount: window.MemoryManager.state.currentProject?.savedSeeds?.length || 0,
                    originalSeed: originalSeed,
                    newSeed: updatedNFT.seed
                  });
                  
                  // Check if the original seed exists in MemoryManager
                  const memoryManagerSeeds = window.MemoryManager.state.currentProject?.savedSeeds || [];
                  const seedExists = memoryManagerSeeds.some(seed => seed.seed === originalSeed);
                  console.log('[DEBUG] Original seed exists in MemoryManager:', seedExists);
                  
                  if (!seedExists) {
                    console.warn('[DEBUG] Original seed not found in MemoryManager, skipping update');
                  } else {
                    // Call MemoryManager immediately (no await)
                    window.MemoryManager.updateNftInCollection(originalSeed, {
                      seed: updatedNFT.seed,
                      traits: updatedNFT.traits,
                      rarity: updatedNFT.rarity || 'common',
                      rarityScore: updatedNFT.rarityScore,
                      timestamp: Date.now()
                    });
                    console.log('[DEBUG] ✅ MemoryManager updated immediately');
                  }
                  const memoryManagerTime = Date.now() - memoryManagerStart;
                  console.log('[DEBUG] MemoryManager update took:', memoryManagerTime, 'ms');
                } catch (memoryError) {
                  console.error('[DEBUG] ❌ MemoryManager update failed:', memoryError);
                  // Don't throw error, just log it - we can continue with other updates
                }
              }
              
              // 2. Update the local seed list
              const saveStart = Date.now();
              this.saveSeedList();
              const saveTime = Date.now() - saveStart;
              console.log('[DEBUG] ✅ Local seed list saved in:', saveTime, 'ms');
              
              // 3. Update project data (both references)
              const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
              if (projectData && projectData.savedSeeds) {
                // Find by original seed to update the correct entry, then write new seed
                const projectSeedIndex = projectData.savedSeeds.findIndex(seed => seed.seed === originalSeed);
                if (projectSeedIndex !== -1) {
                  projectData.savedSeeds[projectSeedIndex] = {
                    seed: updatedNFT.seed,
                    traits: updatedNFT.traits,
                    rarity: updatedNFT.rarity,
                    rarityScore: updatedNFT.rarityScore,
                    timestamp: Date.now()
                  };
                  console.log('[DEBUG] ✅ Updated NFT in project data at index:', projectSeedIndex);
                } else {
                  console.warn('[DEBUG] Could not find NFT in project data with original seed:', originalSeed);
                }
              }
              
              // 4. Update window.currentProject
              if (window.currentProject && window.currentProject.savedSeeds) {
                const currentProjectSeedIndex = window.currentProject.savedSeeds.findIndex(seed => seed.seed === originalSeed);
                if (currentProjectSeedIndex !== -1) {
                  window.currentProject.savedSeeds[currentProjectSeedIndex] = {
                    seed: updatedNFT.seed,
                    traits: updatedNFT.traits,
                    rarity: updatedNFT.rarity,
                    rarityScore: updatedNFT.rarityScore,
                    timestamp: Date.now()
                  };
                  console.log('[DEBUG] ✅ Updated NFT in window.currentProject at index:', currentProjectSeedIndex);
                } else {
                  console.warn('[DEBUG] Could not find NFT in window.currentProject with original seed:', originalSeed);
                }
              }
              
              // 5. Ensure both references are identical
              if (window.currentProject && projectData) {
                window.currentProject.savedSeeds = [...projectData.savedSeeds];
                console.log('[DEBUG] ✅ Synchronized project references');
              }
              
              const totalTime = Date.now() - startTime;
              console.log('[DEBUG] ✅ NFT update completed successfully in:', totalTime, 'ms');
              
            } catch (error) {
              console.error('[DEBUG] ❌ Error updating NFT:', error);
            }
            
            // Update the specific NFT card seed number and data attribute FIRST
            console.log('[DEBUG] Updating specific NFT card seed info...');
            try {
              // CRITICAL: Find card by index first (most reliable), then fallback to original seed
              let nftCard = null;
              
              // Method 1: Find by index in the grid (most reliable)
              const grid = document.querySelector('#saved-seeds-grid');
              if (grid && nftIndex >= 0 && nftIndex < grid.children.length) {
                nftCard = grid.children[nftIndex];
                console.log('[DEBUG] Found NFT card by index:', nftIndex);
              }
              
              // Method 2: Fallback - find by original seed
              if (!nftCard) {
                nftCard = document.querySelector(`[data-seed="${originalSeed}"]`);
                console.log('[DEBUG] Found NFT card by original seed:', originalSeed);
              }
              
              // Method 3: Fallback - find by new seed (in case it was already updated)
              if (!nftCard) {
                nftCard = document.querySelector(`[data-seed="${updatedNFT.seed}"]`);
                console.log('[DEBUG] Found NFT card by new seed:', updatedNFT.seed);
              }
              
              if (nftCard) {
                // Update the seed number display IMMEDIATELY
                const seedNumberDisplay = nftCard.querySelector('.seed-card-number');
                if (seedNumberDisplay) {
                  seedNumberDisplay.textContent = updatedNFT.seed;
                  console.log('[DEBUG] Updated NFT card seed number to:', updatedNFT.seed);
                }
                
                // Update the data attribute IMMEDIATELY
                nftCard.dataset.seed = updatedNFT.seed;
                console.log('[DEBUG] Updated NFT card data-seed attribute to:', updatedNFT.seed);
                
                // CRITICAL FIX: Update thumbnail IMMEDIATELY if imageData is available
                if (updatedNFT.imageData) {
                  console.log('[DEBUG] Updating thumbnail immediately with imageData');
                  let thumbnailImg = nftCard.querySelector('.seed-card-thumbnail img');
                  let thumbnailContainer = nftCard.querySelector('.seed-card-thumbnail');
                  
                  if (thumbnailImg && thumbnailImg.tagName === 'IMG') {
                    // Direct update of img src
                    thumbnailImg.src = updatedNFT.imageData;
                    console.log('[DEBUG] Updated thumbnail img src directly');
                  } else if (thumbnailContainer) {
                    // Update container while preserving other elements
                    const existingRarity = thumbnailContainer.querySelector('.seed-card-rarity');
                    const existingNumber = thumbnailContainer.querySelector('.seed-card-number-display');
                    const existingDescBtn = thumbnailContainer.querySelector('.seed-desc-btn');
                    const rarityHTML = existingRarity ? existingRarity.outerHTML : '';
                    const numberHTML = existingNumber ? existingNumber.outerHTML : '';
                    const descBtnHTML = existingDescBtn ? existingDescBtn.outerHTML : '';
                    
                    thumbnailContainer.innerHTML = `<img src="${updatedNFT.imageData}" alt="NFT Preview" />${rarityHTML}${numberHTML}${descBtnHTML}`;
                    console.log('[DEBUG] Updated thumbnail container innerHTML');
                    
                    // Re-initialize description button if it exists
                    if (existingDescBtn) {
                      const newDescBtn = thumbnailContainer.querySelector('.seed-desc-btn');
                      if (newDescBtn) {
                        this.initializeDescriptionButton(nftCard, updatedNFT.seed);
                      }
                    }
                  } else {
                    console.warn('[DEBUG] Could not find thumbnail element to update');
                  }
                } else {
                  console.warn('[DEBUG] No imageData available for thumbnail update');
                }
                
                // Also call regenerateThumbnailForSeed as a fallback/verification
                const correctIndex = this.seedList.findIndex(seedObj => seedObj.seed === updatedNFT.seed);
                if (correctIndex !== -1) {
                  this.regenerateThumbnailForSeed(updatedNFT.seed, correctIndex);
                  console.log('[DEBUG] Thumbnail regeneration initiated with correct index:', correctIndex);
                } else {
                  console.error('[DEBUG] Could not find seed in seedList for new seed:', updatedNFT.seed);
                }
              } else {
                console.warn('[DEBUG] Could not find NFT card to update - tried index, original seed, and new seed');
              }
            } catch (updateError) {
              console.error('[DEBUG] Error updating NFT card:', updateError);
              // Don't throw error, just log it
            }
            
            console.log('[DEBUG] NFT updated successfully in collection');
            
            // Mark the NFT as corrected to prevent forbidden sign from reappearing
            this.correctedNFTs.add(updatedNFT.seed);
            this.saveCorrectedNFTsState(); // Persist the corrected state
            console.log('[DEBUG] Marked NFT as corrected:', updatedNFT.seed);
            
            // CRITICAL FIX: Do not re-render the page as it causes the old image to flash
            // The thumbnail has already been updated by regenerateThumbnailForSeed above
            console.log('[DEBUG] Skipping page re-render to prevent image flashing');
            
            // Only show visual feedback without full page re-render
            const nftCard = document.querySelector(`[data-seed="${updatedNFT.seed}"]`);
            if (nftCard) {
              nftCard.classList.add('nft-edited-recently');
              console.log('[DEBUG] Marked NFT card as recently edited');
              
              // Remove the class after 2 seconds
              setTimeout(() => {
                nftCard.classList.remove('nft-edited-recently');
              }, 2000);
            }
            
            // Mark buttons as outdated since NFT was edited
            this.markButtonsOutdated();
            
            // Show success notification after the card has been updated
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
              // Small delay to ensure card is fully rendered
              setTimeout(() => {
                window.NFTApp.getModule('notificationService').show(
                  'NFT updated successfully!',
                  'success',
                  2000
                );
              }, 100);
            }
          }
        );
      } else {
        console.error('[DEBUG] NFT Edit Modal not available');
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Edit modal not available',
            'error',
            3000
          );
        }
      }
      
    } catch (error) {
      console.error('[DEBUG] Error editing seed:', error);
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(
          'Error loading NFT for editing',
          'error',
          3000
        );
      }
    }
  }

  async copySeed(seedObj, button) {
    try {
      await navigator.clipboard.writeText(seedObj.seed);
      // Get the text node (the button text "COPY") - preserve tooltip
      let textNode = null;
      for (let node of button.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          textNode = node;
          break;
        }
      }
      const originalText = textNode ? textNode.textContent.trim() : 'COPY';
      const originalBackground = button.style.backgroundColor;
      const originalColor = button.style.color;
      const originalFontWeight = button.style.fontWeight;
      
      // Set copied state with vivid green - CRITICAL: Preserve tooltip element
      // Only change the text node, not the entire content (preserves tooltip)
      if (textNode) {
        textNode.textContent = 'Copied';
      } else {
        // If no text node found, create one and insert before tooltip
        const copiedNode = document.createTextNode('Copied');
        const tooltipElement = button.querySelector('.tooltiptext');
        if (tooltipElement) {
          button.insertBefore(copiedNode, tooltipElement);
        } else {
          button.appendChild(copiedNode);
        }
      }
      button.style.backgroundColor = '#00ff00'; // Vivid green
      button.style.color = '#000000'; // Black text for contrast
      button.style.fontWeight = 'bold';
      
      setTimeout(() => {
        // Restore button text while preserving tooltip
        const currentTextNode = Array.from(button.childNodes).find(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        if (currentTextNode) {
          currentTextNode.textContent = originalText;
        } else {
          // If no text node found, create one and insert before tooltip
          const textNodeToRestore = document.createTextNode(originalText);
          const tooltipToPreserve = button.querySelector('.tooltiptext');
          if (tooltipToPreserve) {
            button.insertBefore(textNodeToRestore, tooltipToPreserve);
          } else {
            button.appendChild(textNodeToRestore);
          }
        }
        button.style.backgroundColor = originalBackground;
        button.style.color = originalColor;
        button.style.fontWeight = originalFontWeight;
      }, 1500);
    } catch (error) {
      console.error('Failed to copy seed:', error);
      // Show brief error feedback instead of alert - CRITICAL: Preserve tooltip element
      // Get the text node (the button text "COPY") - preserve tooltip
      let textNodeForError = null;
      for (let node of button.childNodes) {
        if (node.nodeType === Node.TEXT_NODE && node.textContent.trim()) {
          textNodeForError = node;
          break;
        }
      }
      const originalText = textNodeForError ? textNodeForError.textContent.trim() : 'COPY';
      
      // Change only the text node, not the entire content (preserves tooltip)
      if (textNodeForError) {
        textNodeForError.textContent = 'Failed';
      } else {
        // If no text node found, create one and insert before tooltip
        const failedNode = document.createTextNode('Failed');
        const tooltipElement = button.querySelector('.tooltiptext');
        if (tooltipElement) {
          button.insertBefore(failedNode, tooltipElement);
        } else {
          button.appendChild(failedNode);
        }
      }
      button.style.backgroundColor = '#ff0000'; // Red for error
      button.style.color = '#ffffff';
      
      setTimeout(() => {
        // Restore button text while preserving tooltip
        const currentTextNodeForError = Array.from(button.childNodes).find(node => 
          node.nodeType === Node.TEXT_NODE && node.textContent.trim()
        );
        if (currentTextNodeForError) {
          currentTextNodeForError.textContent = originalText;
        } else {
          // If no text node found, create one and insert before tooltip
          const textNodeToRestoreError = document.createTextNode(originalText);
          const tooltipToPreserveError = button.querySelector('.tooltiptext');
          if (tooltipToPreserveError) {
            button.insertBefore(textNodeToRestoreError, tooltipToPreserveError);
          } else {
            button.appendChild(textNodeToRestoreError);
          }
        }
        button.style.backgroundColor = '';
        button.style.color = '';
      }, 1500);
    }
  }

  deleteSeed(seedObj, index) {
    // Use the app's styled confirmation modal instead of browser confirm
    if (window.NFTApp && window.NFTApp.getModule("confirmationModal")) {
      window.NFTApp.getModule("confirmationModal").show(
        "Delete NFT",
        `<div style="margin-top: 12px;">Are you sure you want to delete NFT with seed:</div>`,
        `<div style="font-size: 11px; color: #95a5a6; margin-top: 4px; margin-bottom: 16px; word-break: break-all;">"${seedObj.seed}"</div><div style="color: #fff; margin-top: 8px;">This action cannot be undone.</div>`,
        () => {
          // CRITICAL FIX: Find NFT by both seed AND index to handle edited NFTs
          let originalIndex = this.seedList.findIndex(seed => seed.seed === seedObj.seed);
          
          // If not found by seed, try to find by index (for edited NFTs with new seeds)
          if (originalIndex === -1 && index >= 0 && index < this.seedList.length) {
            console.log(`[DEBUG] NFT not found by seed, using index ${index} for deletion`);
            originalIndex = index;
          }
          
          if (originalIndex !== -1) {
            const nftToDelete = this.seedList[originalIndex];
            console.log(`[DEBUG] Deleting NFT at index ${originalIndex} with seed: ${nftToDelete.seed}`);
            
            // STEP 1: Delete image and rarity data from all caches
            // Clear from instance image cache
            if (this.imageCache && this.imageCache[nftToDelete.seed]) {
              delete this.imageCache[nftToDelete.seed];
              console.log(`[DEBUG] Deleted from instance imageCache: ${nftToDelete.seed}`);
            }
            
            // Clear from global image cache
            if (window.savedSeedsImageCache && window.savedSeedsImageCache[nftToDelete.seed]) {
              delete window.savedSeedsImageCache[nftToDelete.seed];
              console.log(`[DEBUG] Deleted from global savedSeedsImageCache: ${nftToDelete.seed}`);
            }
            
            // Clear from violations cache
            if (this.violationsCache && this.violationsCache.has(nftToDelete.seed)) {
              this.violationsCache.delete(nftToDelete.seed);
              this.saveViolationsCache();
              console.log(`[DEBUG] Deleted from violations cache: ${nftToDelete.seed}`);
            }
            
            // Clear rarity rank for this NFT (use the actual NFT being deleted)
            if (this.rarityRanks && this.rarityRanks[nftToDelete.seed]) {
              delete this.rarityRanks[nftToDelete.seed];
              console.log(`[DEBUG] Deleted rarity rank for seed: ${nftToDelete.seed}`);
            }
            
            // Also clear from project data to ensure it's not saved
            const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
            if (projectData && projectData.rarityRanks && projectData.rarityRanks[nftToDelete.seed]) {
              delete projectData.rarityRanks[nftToDelete.seed];
              console.log(`[DEBUG] Deleted rarity rank from project data for seed: ${nftToDelete.seed}`);
            }
            
            // STEP 2: Remove from main seedList
            this.seedList.splice(originalIndex, 1);
            this.saveSeedList();
            console.log(`[DEBUG] Removed from seedList at index ${originalIndex}`);
            
            // Track as session-deleted to prevent re-appearance after navigation
            if (!this.deletedSeedsSession) this.deletedSeedsSession = new Set();
            this.deletedSeedsSession.add(nftToDelete.seed);
            
            // STEP 3: Save updated rarity ranks (with this NFT removed)
            this.saveRarityRanks();
            console.log(`[DEBUG] Updated rarity ranks saved (deleted NFT removed)`);
            
            // Mark rarity status as outdated when NFT is deleted
            this.updateRarityStatus('outdated');
            
            // Mark trait rarities status as outdated when NFT is deleted
            this.updateTraitRaritiesStatus('outdated');
            
            // If we're currently showing filtered results, handle deletion appropriately
            if (this.filteredSeedList.length > 0) {
              const filteredIndex = this.filteredSeedList.findIndex(seed => seed.seed === seedObj.seed);
              if (filteredIndex !== -1) {
                // During search mode, mark this position as empty instead of removing
                if (this.isFilteringByTrait || this.isFilteringByRarity || this.isFilteringByPosition) {
                  // Calculate the global index based on current page and position
                  const globalIndex = (this.currentPage - 1) * this.pageSize + filteredIndex;
                  this.emptyPositions.add(globalIndex);
                  console.log(`[DEBUG] Marked global position ${globalIndex} as empty during search`);
                  
                  // Store original search results if not already stored
                  if (this.originalSearchResults.length === 0) {
                    this.originalSearchResults = [...this.filteredSeedList];
                    console.log(`[DEBUG] Stored original search results: ${this.originalSearchResults.length} items`);
                  }
                } else {
                  this.filteredSeedList.splice(filteredIndex, 1);
                }
                
                // If no more violations, clear filter state
                if (this.filteredSeedList.length === 0) {
                  this.isFilteringViolations = false;
                  this.currentPage = 1;
                }
              }
            }
            
            // If in conflict view OR trait search mode, just hide the card - don't re-render
            if (this.isInConflictView || this.isFilteringByTrait) {
              console.log('[DEBUG] Deleted during scan/search - hiding card for seed:', seedObj.seed);
              const card = document.querySelector(`[data-seed="${seedObj.seed}"]`);
              if (card) {
                // Replace the card with an empty placeholder
                const globalIndex = (this.currentPage - 1) * this.pageSize + this.filteredSeedList.findIndex(s => s.seed === seedObj.seed);
                this.emptyPositions.add(globalIndex);
                const emptyCard = this.createEmptyCard(globalIndex);
                card.replaceWith(emptyCard);
                console.log('[DEBUG] Card replaced with empty placeholder');
                
                // CRITICAL FIX: Refresh event listeners for all remaining visible cards
                // This ensures that cards that moved into the deleted card's position remain interactive
                setTimeout(() => {
                  this.refreshCardEventListeners();
                  // Also ensure event delegation is still active
                  this.setupEventDelegation();
                }, 100);
              }
            } else {
              // Normal mode: re-render the page
              this.renderPage(this.currentPage);
            }
            
            // Update filter buttons
            this.updateFilterButtons();
            
            // Update the seed list counter
            this.updateSeedListCounter();
            
            // Also update the global seed counter if available
            if (window.NFTApp && window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter) {
              window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter();
            }
            
            // Update NFT count panel
            if (window.updateNftCountPanel) {
              window.updateNftCountPanel();
            }
            
            // Update all counters
            window.updateAllCounters();
          }
        }
      );
    } else {
      // Fallback to browser confirm if modal not available
    if (confirm(`Delete seed "${seedObj.seed}"?`)) {
      // Find the original index in the main seedList
      const originalIndex = this.seedList.findIndex(seed => seed.seed === seedObj.seed);
      
      if (originalIndex !== -1) {
        // Remove from main seedList
        this.seedList.splice(originalIndex, 1);
        this.saveSeedList();
        
        // Mark rarity status as outdated when NFT is deleted
        this.updateRarityStatus('outdated');
        
        // If we're currently showing filtered violations, remove from filtered list too
        if (this.filteredSeedList.length > 0) {
          const filteredIndex = this.filteredSeedList.findIndex(seed => seed.seed === seedObj.seed);
          if (filteredIndex !== -1) {
            this.filteredSeedList.splice(filteredIndex, 1);
            
            // If no more violations, clear filter state
            if (this.filteredSeedList.length === 0) {
              this.isFilteringViolations = false;
              this.currentPage = 1;
            }
          }
        }
        
        // If in conflict view (scan in progress), just hide the card - don't re-render
        if (this.isInConflictView) {
          console.log('[DEBUG] Deleted during scan - hiding card for seed:', seedObj.seed);
          const card = document.querySelector(`[data-seed="${seedObj.seed}"]`);
          if (card) {
            card.style.opacity = '0';
            card.style.pointerEvents = 'none';
            card.style.visibility = 'hidden';
            console.log('[DEBUG] Card hidden, empty space preserved');
          }
        } else {
          // Normal mode: re-render the page
          this.renderPage(this.currentPage);
        }
        
        // Update filter buttons
        this.updateFilterButtons();
        
        // Update the seed list counter
        this.updateSeedListCounter();
        
        // Also update the global seed counter if available
        if (window.NFTApp && window.NFTApp.getModule('generateNftsUI') && window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter) {
          window.NFTApp.getModule('generateNftsUI').refreshSeedListCounter();
        }
        
        // Update NFT count panel
        if (window.updateNftCountPanel) {
          window.updateNftCountPanel();
        }
        
        // Update all counters
        window.updateAllCounters();
      }
    }
    }
  }
  
  updateSeedListCounter() {
    console.log('[DEBUG] updateSeedListCounter called');
    // Update the seed list counter using the existing refreshSeedListCounter function
    // Fixed syntax error - method properly defined
    const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
    if (generateNftsUIModule && generateNftsUIModule.refreshSeedListCounter) {
      generateNftsUIModule.refreshSeedListCounter();
    } else {
      // Fallback: manually update the counter
      const seedListCounter = document.getElementById('seed-list-counter');
      if (seedListCounter) {
        const projectData = window.NFTApp.getModule('generateNftsUI').projectData || window.currentProject;
        const totalSupply = this.getTotalSupply(projectData);
        seedListCounter.textContent = `${this.formatNumberWithCommas(this.seedList.length || 0)} / ${this.formatNumberWithCommas(totalSupply)}`;
        this.setSeedListCounterColor(seedListCounter, this.seedList.length || 0, totalSupply);
      }
    }
  }

  copyAllSeeds() {
    // Check if any cards are selected - if not, copy all seeds
    const selectedCards = this.modal.querySelectorAll('.saved-seed-card.selected');
    
    let seeds;
    let showTooltip = false;
    
    if (selectedCards.length === 0) {
      // No cards selected - copy all seeds
      seeds = this.seedList.map(s => s.seed).join('\n');
      showTooltip = true;
    } else {
      // Copy selected seeds only
      seeds = Array.from(selectedCards)
        .map(card => card.dataset.seed)
        .filter(seed => seed)
        .join('\n');
    }
    
    navigator.clipboard.writeText(seeds).then(() => {
      const btn = this.modal.querySelector('#copy-all-seeds');
      
      // Store original styles and tooltip structure
      const tooltipSpan = btn.querySelector('.tooltiptext');
      const originalText = btn.childNodes[0] ? btn.childNodes[0].textContent.trim() : 'Copy';
      const originalBackground = btn.style.backgroundColor || window.getComputedStyle(btn).backgroundColor;
      const originalColor = btn.style.color || window.getComputedStyle(btn).color;
      
      // Set copied state - preserve tooltip structure
      if (btn.childNodes[0] && btn.childNodes[0].nodeType === Node.TEXT_NODE) {
        btn.childNodes[0].textContent = 'Copied!';
      } else {
        // If no text node, create one
        const textNode = document.createTextNode('Copied!');
        btn.insertBefore(textNode, btn.firstChild);
      }
      btn.style.backgroundColor = '#00ff6c';
      btn.style.color = '#000000';
      btn.style.fontWeight = 'bold';
      
      // Show tooltip if copying all seeds
      if (showTooltip && window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          `All ${this.seedList.length} seeds copied to clipboard`,
          "info",
          3000
        );
      }
      
      // Restore original state after delay - preserve tooltip structure
      setTimeout(() => {
        if (btn.childNodes[0] && btn.childNodes[0].nodeType === Node.TEXT_NODE) {
          btn.childNodes[0].textContent = originalText;
        }
        btn.style.backgroundColor = originalBackground;
        btn.style.color = originalColor;
        btn.style.fontWeight = '';
      }, 2000);
    }).catch(error => {
      console.error('Failed to copy seeds:', error);
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Failed to copy seeds to clipboard",
          "error",
          3000
        );
      }
    });
  }

  importSeeds() {
    this.showImportDialog();
  }

  showImportDialog() {
    // Create modal overlay
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    // Create dialog container
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #222;
      border-radius: 12px;
      padding: 24px;
      width: 500px;
      max-width: 90vw;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    `;

    dialog.innerHTML = `
      <div style="margin-bottom: 16px;">
        <h3 style="color: #fff; margin: 0 0 8px 0; font-family: 'Archivo', sans-serif;">Import Seeds</h3>
        <p style="color: #ccc; margin: 0; font-size: 14px;">Paste or enter seed numbers (one per line):</p>
      </div>
      <textarea 
        id="seed-import-textarea" 
        placeholder="Enter seed numbers, one per line..."
        style="
          width: 100%;
          height: 200px;
          background: #333;
          border: 1px solid #555;
          border-radius: 8px;
          padding: 12px;
          color: #fff;
          font-family: 'Archivo', sans-serif;
          font-size: 14px;
          resize: vertical;
          outline: none;
          box-sizing: border-box;
        "
      ></textarea>
      <div style="margin-top: 16px; display: flex; gap: 12px; justify-content: flex-end;">
        <button id="import-cancel" style="
          background: #666;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-family: 'Archivo', sans-serif;
          cursor: pointer;
        ">Cancel</button>
        <button id="import-confirm" style="
          background: #6c5ce7;
          color: #fff;
          border: none;
          border-radius: 8px;
          padding: 8px 16px;
          font-family: 'Archivo', sans-serif;
          cursor: pointer;
        ">Import Seeds</button>
      </div>
    `;

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    // Focus the textarea
    const textarea = dialog.querySelector('#seed-import-textarea');
    textarea.focus();

    // Add event listeners
    const cancelBtn = dialog.querySelector('#import-cancel');
    const confirmBtn = dialog.querySelector('#import-confirm');

    const cleanup = () => {
      if (overlay && overlay.parentNode === document.body) {
        document.body.removeChild(overlay);
      }
    };

    cancelBtn.onclick = cleanup;

    confirmBtn.onclick = () => {
      const input = textarea.value.trim();
      if (!input) {
        alert('Please enter at least one seed number.');
        return;
      }

      this.processImportedSeeds(input);
      cleanup();
    };

    // ESC key to close
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        cleanup();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);

    // Click outside to close
    overlay.onclick = (e) => {
      if (e.target === overlay) {
        cleanup();
      }
    };
  }

  processImportedSeeds(input) {
    const newSeeds = input.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    let added = 0;
    let duplicates = 0;
    
    console.log('[DEBUG] Processing', newSeeds.length, 'imported seeds');
    
    // CRITICAL: Validate collection capacity BEFORE adding (prevent exceeding limit)
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    const maxCollectionSize = this.getTotalSupply(projectData);
    const currentCollectionSize = this.seedList ? this.seedList.length : 0;
    const availableSpace = Math.max(0, maxCollectionSize - currentCollectionSize);
    
    let skipped = 0;
    
    // Use regular for loop so we can break when capacity is reached
    for (let i = 0; i < newSeeds.length; i++) {
      const seed = newSeeds[i];
      
      // Skip if we've reached capacity
      if (currentCollectionSize + added >= maxCollectionSize) {
        skipped = newSeeds.length - i;
        break;
      }
      
      if (!this.seedList.some(s => s.seed === seed)) {
        // Create a proper seed object with all necessary properties
        const seedObj = {
          seed: seed,
          traits: [], // Will be populated when thumbnail is generated
          rarity: 'common',
          rarityScore: 0,
          timestamp: Date.now()
        };
        this.seedList.push(seedObj);
        added++;
      } else {
        duplicates++;
      }
    }
    
    if (added > 0) {
      this.saveSeedList();
      this.renderPage(this.currentPage);
      
      // Mark rarity status as outdated when new NFTs are added
      this.updateRarityStatus('outdated');
      
      // Update the seed counter
      this.updateSeedListCounter();
      
      // Update all counters
      window.updateAllCounters();
      
      // Trigger resource monitoring after importing seeds
      document.dispatchEvent(new CustomEvent('seeds:imported', { 
        detail: { count: added, totalCount: this.seedList.length } 
      }));
      
      // Update NFT count panel
      if (window.updateNftCountPanel) {
        window.updateNftCountPanel();
      }
      
      // Show success message with details
      let message = `Successfully imported ${added} new seeds.`;
      if (duplicates > 0) {
        message += `\n\n${duplicates} duplicate seeds were skipped.`;
      }
      if (skipped > 0) {
        message += `\n\n${skipped} seed(s) were skipped due to collection capacity limit (${currentCollectionSize + added}/${maxCollectionSize}).`;
      }
      
      if (window.NFTApp.getModule('notificationService')) {
        const messageType = skipped > 0 ? 'warning' : 'success';
        window.NFTApp.getModule('notificationService').show(message, messageType, 5000);
      } else {
        alert(message);
      }
      
      console.log('[DEBUG] Import completed:', { added, duplicates, totalSeeds: this.seedList.length });
      
      // Generate thumbnails in background without blocking the UI
      setTimeout(() => {
        this.generateThumbnailsForImportedSeeds(newSeeds).catch(error => {
          console.error('[DEBUG] Background thumbnail generation failed:', error);
        });
      }, 1000);
      
    } else {
      let message = `No new seeds were added.`;
      if (duplicates > 0) {
        message += `\n\n${duplicates} seed(s) already exist in the collection.`;
      }
      if (skipped > 0) {
        message += `\n\n${skipped} seed(s) were skipped due to collection capacity limit (${currentCollectionSize}/${maxCollectionSize}).`;
      }
      
      if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
        window.NFTApp.getModule('notificationService').show(message, 'warning', 5000);
      } else {
        alert(message);
      }
    }
  }

  async generateThumbnailsForImportedSeeds(importedSeeds) {
    console.log('[DEBUG] Generating thumbnails for', importedSeeds.length, 'imported seeds using existing getImageForSeed method');
    
    // Process seeds one by one using the existing working method
    for (let i = 0; i < importedSeeds.length; i++) {
      const seed = importedSeeds[i];
      try {
        console.log(`[DEBUG] Processing seed ${i + 1}/${importedSeeds.length}:`, seed);
        
        // Find the seed object in the seed list
        const seedObj = this.seedList.find(s => s.seed === seed);
        if (!seedObj) {
          console.warn('[DEBUG] Seed object not found for:', seed);
          continue;
        }

        // Use the existing getImageForSeed method which works properly
        console.log('[DEBUG] Using getImageForSeed for imported seed:', seed);
        const imageData = await this.getImageForSeed(seed);
        
        if (imageData) {
          console.log('[DEBUG] Successfully generated image for seed:', seed);
          
          // Update the seed object with the generated data
          seedObj.imageData = imageData;
          seedObj.thumbnail = imageData;
          
          // Cache the image data
          this.imageCache[seed] = imageData;
          if (window.savedSeedsImageCache) {
            window.savedSeedsImageCache[seed] = imageData;
          }
          
          console.log('[DEBUG] Generated thumbnail for seed:', seed);
        } else {
          console.error('[DEBUG] No image data generated for seed:', seed);
          // Set a placeholder to prevent infinite retries
          seedObj.imageData = null;
          seedObj.thumbnail = null;
        }
        
        // Small delay between generations to prevent overwhelming the system
        await new Promise(resolve => setTimeout(resolve, 200));
        
      } catch (error) {
        console.error('[DEBUG] Error generating thumbnail for seed', seed, ':', error);
        // Continue with next seed even if one fails
        const seedObj = this.seedList.find(s => s.seed === seed);
        if (seedObj) {
          seedObj.imageData = null;
          seedObj.thumbnail = null;
        }
      }
    }

    // Save the updated seed list with thumbnails
    this.saveSeedList();
    
    // Force re-render the current page to show the new thumbnails
    this.renderPage(this.currentPage);
    
    console.log('[DEBUG] Thumbnail generation completed for imported seeds');
  }

  clearStorage() {
    const storageUsage = SavedSeedsModal.getLocalStorageUsage();
    
    // Prefer app-styled confirmation modal
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
      const confirmation = window.NFTApp.getModule("confirmationModal");
      const title = "Clear All Saved Seeds";
      const body = `
        <div style=\"margin-top: 6px; color: #fca311; font-weight: 600;\">This will remove all saved seeds.</div>
        <div style=\"margin-top: 8px; color:#cbd5e1;\">Total seeds: <strong>${this.seedList.length}</strong></div>
        <div style=\"margin-top: 4px; color:#cbd5e1;\">Space to be freed: <strong>${storageUsage.usedMB}MB</strong></div>
        <div style=\"margin-top: 12px; color:#ef4444; font-weight:600;\">This action cannot be undone.</div>
      `;
      confirmation.show(title, body, "", () => {
        try {
          // Clear the current project's seed list
          localStorage.removeItem(this.seedListKey);
          
          // Also clear any other seed lists to free up space
          const keysToRemove = [];
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('nftSeedList_')) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach(key => localStorage.removeItem(key));
          
          // Clear image cache
          if (window.savedSeedsImageCache) {
            window.savedSeedsImageCache = {};
          }
          
          // Reset the current seed list
          this.seedList = [];
          this.renderPage(1);
          
          // Mark rarity status as outdated when NFTs are cleared
          this.updateRarityStatus('outdated');
          
          // Update seed counter
          this.updateSeedListCounter();
          
          // Update all counters
          window.updateAllCounters();
          
          const newUsage = SavedSeedsModal.getLocalStorageUsage();
          if (window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              `Storage cleared successfully! Freed ${storageUsage.usedMB}MB. Remaining: ${newUsage.usedMB}MB used`,
              'success',
              3500
            );
          }
        } catch (error) {
          console.error('Error clearing storage:', error);
          alert('Error clearing storage: ' + error.message);
        }
      }, 'Delete', 'danger');
      return;
    }

    const confirmMessage = `Are you sure you want to clear all saved seeds?\n\n` +
      `This will remove all ${this.seedList.length} saved seeds and free up ${storageUsage.usedMB}MB of storage space.\n\n` +
      `This action cannot be undone!`;
    
    if (confirm(confirmMessage)) {
      try {
        // Clear the current project's seed list
        localStorage.removeItem(this.seedListKey);
        
        // Also clear any other seed lists to free up space
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith('nftSeedList_')) {
            keysToRemove.push(key);
          }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        // Clear image cache
        if (window.savedSeedsImageCache) {
          window.savedSeedsImageCache = {};
        }
        
        // Reset the current seed list
        this.seedList = [];
        this.renderPage(1);
        
        // Mark rarity status as outdated when NFTs are cleared
        this.updateRarityStatus('outdated');
        
        // Update seed counter
        this.updateSeedListCounter();
        
        // Update all counters
        window.updateAllCounters();
        
        const newUsage = SavedSeedsModal.getLocalStorageUsage();
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Storage cleared successfully! Freed ${storageUsage.usedMB}MB. Remaining: ${newUsage.usedMB}MB used`,
            'success',
            3500
          );
        } else {
          alert(`Storage cleared successfully!\n\n` +
            `Freed up: ${storageUsage.usedMB}MB\n` +
            `Remaining: ${newUsage.usedMB}MB used`);
        }
        
      } catch (error) {
        console.error('Error clearing storage:', error);
        alert('Error clearing storage: ' + error.message);
      }
    }
  }

  // CRITICAL: Force footer to be visible and properly positioned
  forceFooterVisible() {
    console.log('[DEBUG] ===== FORCE FOOTER VISIBLE CALLED =====');
    
    if (!this.modal) {
      console.log('[DEBUG] No modal, returning');
      return;
    }
    
    const container = this.modal.querySelector('.saved-seeds-container');
    const footer = this.modal.querySelector('.saved-seeds-footer');
    const grid = this.modal.querySelector('#saved-seeds-grid');
    
    console.log('[DEBUG] container found:', !!container);
    console.log('[DEBUG] footer found:', !!footer);
    console.log('[DEBUG] grid found:', !!grid);
    
    if (container) {
      container.style.overflow = 'visible';
      container.style.height = 'auto';
      container.style.minHeight = '800px';
      container.style.maxHeight = 'none';
      console.log('[DEBUG] Container overflow set to visible');
    }
    
    if (footer) {
      footer.style.display = 'flex';
      footer.style.visibility = 'visible';
      footer.style.opacity = '1';
      footer.style.position = 'relative';
      footer.style.zIndex = '100';
      footer.style.marginTop = 'auto';
      footer.style.flexShrink = '0';
      footer.style.minHeight = '60px';
      console.log('[DEBUG] Footer forced visible');
    }
    
    if (grid) {
      grid.style.maxHeight = 'calc(100% - 200px)';
      grid.style.minHeight = '400px';
      console.log('[DEBUG] Grid height constrained for footer space');
    }
  }

  // Ensure pagination is always visible
  ensurePaginationVisible() {
    console.log('[DEBUG] ===== ENSURE PAGINATION VISIBLE CALLED =====');
    console.log('[DEBUG] this.modal exists:', !!this.modal);
    
    if (!this.modal) {
      console.log('[DEBUG] No modal, returning');
      return;
    }
    
    const pagination = this.modal.querySelector('#saved-seeds-pagination');
    const footer = this.modal.querySelector('.saved-seeds-footer');
    
    console.log('[DEBUG] pagination element found:', !!pagination);
    console.log('[DEBUG] footer element found:', !!footer);
    
    if (pagination) {
      console.log('[DEBUG] pagination current styles:', {
        display: pagination.style.display,
        visibility: pagination.style.visibility,
        opacity: pagination.style.opacity
      });
      pagination.style.display = 'flex';
      pagination.style.visibility = 'visible';
      pagination.style.opacity = '1';
      console.log('[DEBUG] Pagination visibility ensured');
    } else {
      console.log('[DEBUG] ERROR: Pagination element not found!');
    }
    
    if (footer) {
      console.log('[DEBUG] footer current styles:', {
        display: footer.style.display,
        visibility: footer.style.visibility,
        opacity: footer.style.opacity
      });
      footer.style.display = 'flex';
      footer.style.visibility = 'visible';
      footer.style.opacity = '1';
      console.log('[DEBUG] Footer visibility ensured');
    } else {
      console.log('[DEBUG] ERROR: Footer element not found!');
    }
  }

  createPagination(totalPages, container) {
    console.log('[DEBUG] ===== CREATE PAGINATION CALLED =====');
    console.log('[DEBUG] totalPages:', totalPages);
    console.log('[DEBUG] container:', container);
    console.log('[DEBUG] container exists:', !!container);
    
    // Find the collection space counter to use as insert reference
    const footer = document.querySelector('.saved-seeds-footer');
    const spaceCounter = footer ? footer.querySelector('#saved-seeds-collection-space-counter') : null;
    
    // Clear only pagination controls, not the counters
    const existingControls = container.querySelectorAll('.pagination-btn, .pagination-empty-message');
    existingControls.forEach(control => control.remove());
    
    if (totalPages < 1) {
      console.log('[DEBUG] totalPages < 1, showing empty pagination message');
      // Show a message that there are no NFTs instead of hiding pagination completely
      const emptyMessage = document.createElement('div');
      emptyMessage.className = 'pagination-empty-message';
      emptyMessage.style.cssText = 'display: flex; align-items: center; justify-content: center; padding: 16px; color: #95a5a6; font-size: 14px; font-family: "Archivo", sans-serif;';
      emptyMessage.textContent = 'No NFTs to display';
      container.appendChild(emptyMessage);
      return;
    }

    console.log('[DEBUG] Creating pagination with', totalPages, 'pages');
    
    const windowSize = 10;
    
    // Calculate the 10-page window based on current window start
    let windowStart = this.windowStart;
    let windowEnd = Math.min(totalPages, windowStart + windowSize - 1);
    
    // Adjust if we're near the end and don't have a full window
    if (windowEnd - windowStart + 1 < windowSize) {
      windowStart = Math.max(1, windowEnd - windowSize + 1);
      this.windowStart = windowStart;
    }
    
    console.log('[DEBUG] Pagination window:', {
      currentPage: this.currentPage,
      totalPages: totalPages,
      windowStart: windowStart,
      windowEnd: windowEnd,
      activePosition: this.activePosition
    });
    
    console.log('[DEBUG] Creating pagination buttons for', totalPages, 'pages');
    
    // First page button (First)
    const firstBtn = this.createPaginationButton('First', this.currentPage > 1, () => {
      this.goToPage(1, true);
    });
    // Remove title and add custom tooltip
    firstBtn.removeAttribute('title');
    firstBtn.classList.add('tooltip');
    let firstTooltip = firstBtn.querySelector('.tooltiptext');
    if (!firstTooltip) {
      firstTooltip = document.createElement('span');
      firstTooltip.className = 'tooltiptext';
      firstBtn.appendChild(firstTooltip);
    }
    firstTooltip.textContent = 'Go to first page';
    container.appendChild(firstBtn);
    
    // Jump 10 pages left button (<<)
    const jumpLeftBtn = this.createPaginationButton('&lt;&lt;', this.windowStart > windowSize, () => {
      this.jumpPages(-windowSize);
    });
    jumpLeftBtn.removeAttribute('title');
    jumpLeftBtn.classList.add('tooltip');
    let jumpLeftTooltip = jumpLeftBtn.querySelector('.tooltiptext');
    if (!jumpLeftTooltip) {
      jumpLeftTooltip = document.createElement('span');
      jumpLeftTooltip.className = 'tooltiptext';
      jumpLeftBtn.appendChild(jumpLeftTooltip);
    }
    jumpLeftTooltip.textContent = 'Jump 10 pages left';
    container.appendChild(jumpLeftBtn);
    
    // Previous button (<)
    const prevBtn = this.createPaginationButton('&lt;', this.currentPage > 1, () => {
      this.moveActivePosition(-1);
    });
    prevBtn.removeAttribute('title');
    prevBtn.classList.add('tooltip');
    let prevTooltip = prevBtn.querySelector('.tooltiptext');
    if (!prevTooltip) {
      prevTooltip = document.createElement('span');
      prevTooltip.className = 'tooltiptext';
      prevBtn.appendChild(prevTooltip);
    }
    prevTooltip.textContent = 'Previous page';
    container.appendChild(prevBtn);

    // 10-page window
    for (let i = windowStart; i <= windowEnd; i++) {
      const pageBtn = this.createPaginationButton(i.toString(), true, () => {
        this.goToPage(i, false);
      });
      if (i === this.currentPage) {
        pageBtn.classList.add('active');
      }
      pageBtn.removeAttribute('title');
      pageBtn.classList.add('tooltip');
      let pageTooltip = pageBtn.querySelector('.tooltiptext');
      if (!pageTooltip) {
        pageTooltip = document.createElement('span');
        pageTooltip.className = 'tooltiptext';
        pageBtn.appendChild(pageTooltip);
      }
      pageTooltip.textContent = `Go to page ${i}`;
      container.appendChild(pageBtn);
    }

    // Next button (>)
    const nextBtn = this.createPaginationButton('&gt;', this.currentPage < totalPages, () => {
      this.moveActivePosition(1);
    });
    nextBtn.removeAttribute('title');
    nextBtn.classList.add('tooltip');
    let nextTooltip = nextBtn.querySelector('.tooltiptext');
    if (!nextTooltip) {
      nextTooltip = document.createElement('span');
      nextTooltip.className = 'tooltiptext';
      nextBtn.appendChild(nextTooltip);
    }
    nextTooltip.textContent = 'Next page';
    container.appendChild(nextBtn);
    
    // Jump 10 pages right button (>>)
    const jumpRightBtn = this.createPaginationButton('&gt;&gt;', this.windowStart <= totalPages - windowSize, () => {
      this.jumpPages(windowSize);
    });
    jumpRightBtn.removeAttribute('title');
    jumpRightBtn.classList.add('tooltip');
    let jumpRightTooltip = jumpRightBtn.querySelector('.tooltiptext');
    if (!jumpRightTooltip) {
      jumpRightTooltip = document.createElement('span');
      jumpRightTooltip.className = 'tooltiptext';
      jumpRightBtn.appendChild(jumpRightTooltip);
    }
    jumpRightTooltip.textContent = 'Jump 10 pages right';
    container.appendChild(jumpRightBtn);
    
    // Last page button (Last)
    const lastBtn = this.createPaginationButton('Last', this.currentPage < totalPages, () => {
      this.goToPage(totalPages, true);
    });
    lastBtn.removeAttribute('title');
    lastBtn.classList.add('tooltip');
    let lastTooltip = lastBtn.querySelector('.tooltiptext');
    if (!lastTooltip) {
      lastTooltip = document.createElement('span');
      lastTooltip.className = 'tooltiptext';
      lastBtn.appendChild(lastTooltip);
    }
    lastTooltip.textContent = 'Go to last page';
    container.appendChild(lastBtn);
    
    console.log('[DEBUG] Pagination creation complete. Total buttons created:', container.children.length);
    
    // Ensure pagination is visible after creation
    this.ensurePaginationVisible();
    
    // CRITICAL: Force pagination to be visible with multiple approaches
    setTimeout(() => {
      if (container) {
        container.style.display = 'flex';
        container.style.visibility = 'visible';
        container.style.opacity = '1';
        container.style.position = 'relative';
        container.style.zIndex = '100';
        console.log('[DEBUG] Pagination forced visible with setTimeout');
      }
      
      // Also force footer visibility
      const footer = this.modal?.querySelector('.saved-seeds-footer');
      if (footer) {
        footer.style.display = 'flex';
        footer.style.visibility = 'visible';
        footer.style.opacity = '1';
        footer.style.position = 'relative';
        footer.style.zIndex = '100';
        console.log('[DEBUG] Footer forced visible with setTimeout');
      }
    }, 100);
  }

  createPaginationButton(text, enabled, onClick) {
    const btn = document.createElement('button');
    btn.className = 'pagination-btn';
    btn.innerHTML = text;
    btn.disabled = !enabled;
    
    // Store original onClick for later restoration
    btn.dataset.originalOnClick = onClick ? 'true' : 'false';
    
    // Wrap onClick to support drag mode
    if (onClick) {
      btn.onclick = (e) => {
        // If dragging, use drag-aware navigation
        if (this.draggedElement && this.draggedIndex !== null) {
          // Determine target page based on button type
          const targetPage = this.getTargetPageForButton(btn, text);
          if (targetPage !== null && targetPage !== this.currentPage) {
            this.switchToPageDuringDrag(targetPage);
          }
        } else {
          // Normal navigation
          onClick(e);
        }
      };
    }
    
    console.log('[DEBUG] Created pagination button:', text, 'enabled:', enabled);
    return btn;
  }
  
  // Enable pagination buttons during drag operations
  enablePaginationDuringDrag() {
    console.log('[DEBUG] Enabling pagination buttons during drag');
    const pagination = this.modal?.querySelector('#saved-seeds-pagination');
    if (!pagination) return;
    
    const buttons = pagination.querySelectorAll('.pagination-btn');
    buttons.forEach(btn => {
      // Remove disabled state temporarily
      btn.dataset.originalDisabled = btn.disabled ? 'true' : 'false';
      btn.disabled = false;
      btn.classList.add('drag-enabled');
    });
  }
  
  // Disable pagination buttons after drag (restore normal state)
  disablePaginationAfterDrag() {
    console.log('[DEBUG] Disabling pagination buttons after drag');
    const pagination = this.modal?.querySelector('#saved-seeds-pagination');
    if (!pagination) return;
    
    const buttons = pagination.querySelectorAll('.pagination-btn');
    buttons.forEach(btn => {
      // Restore original disabled state
      if (btn.dataset.originalDisabled === 'true') {
        btn.disabled = true;
      }
      btn.classList.remove('drag-enabled');
      delete btn.dataset.originalDisabled;
    });
  }
  
  // Get target page number for a pagination button
  getTargetPageForButton(btn, text) {
    const currentList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    const totalPages = Math.ceil(currentList.length / this.pageSize);
    
    // Normalize text by removing HTML entities
    const normalizedText = text.replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    
    if (normalizedText === 'First' || normalizedText === 'first') {
      return 1;
    } else if (normalizedText === 'Last' || normalizedText === 'last') {
      return totalPages;
    } else if (normalizedText === '<' || normalizedText === '&lt;') {
      // Previous page - go to page directly before current page
      return Math.max(1, this.currentPage - 1);
    } else if (normalizedText === '>' || normalizedText === '&gt;') {
      // Next page - move active position by +1
      const newActivePosition = this.activePosition + 1;
      if (newActivePosition >= 1 && newActivePosition <= 10) {
        // Stay within current window
        return this.windowStart + newActivePosition - 1;
      } else {
        // Need to shift window
        return Math.min(totalPages, this.currentPage + 1);
      }
    } else if (normalizedText === '<<' || normalizedText === '&lt;&lt;') {
      // Jump 10 pages left from current page (allows repeated jumps)
      const windowSize = 10;
      const newPage = Math.max(1, this.currentPage - windowSize);
      return newPage;
    } else if (normalizedText === '>>' || normalizedText === '&gt;&gt;') {
      // Jump 10 pages right
      const windowSize = 10;
      const newWindowStart = Math.min(totalPages - windowSize + 1, this.windowStart + windowSize);
      // Return the page at the same position in the new window
      const newPage = newWindowStart + this.activePosition - 1;
      return Math.max(1, Math.min(totalPages, newPage));
    } else {
      // Number button - extract page number
      const pageNum = parseInt(normalizedText);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) {
        return pageNum;
      }
    }
    
    return null;
  }

  // Switch to conflict view (show only NFTs with violations)
  async switchToConflictView() {
    console.log('[DEBUG] Switching to conflict view - showing only NFTs with violations');
    console.log('[DEBUG] Current seedList length:', this.seedList.length);
    
    // Set flag to indicate we're in conflict view
    this.isInConflictView = true;
    
    // Clear existing filtered list
    this.filteredSeedList = [];
    
    // Find all NFTs with violations
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData || !projectData.rules || projectData.rules.length === 0) {
      console.log('[DEBUG] No rules defined - no conflicts to show');
      return Promise.resolve();
    }
    
    console.log('[DEBUG] Checking all NFTs for violations...');
    console.log('[DEBUG] Project data rules:', projectData.rules.length);
    
    // Hide pagination during scan
    const paginationElement = this.modal.querySelector('#saved-seeds-pagination');
    if (paginationElement) {
      paginationElement.style.display = 'none';
      console.log('[DEBUG] Pagination hidden for scan');
    }
    
    // Hide "Rule Violations NFTs" button during scan
    const filterBtn = this.modal.querySelector('#filter-violations');
    if (filterBtn) {
      filterBtn.classList.add('hidden');
      console.log('[DEBUG] Filter violations button hidden during scan');
    }
    
    // Delete All button will appear when first violation is found (not at scan start)
    this.hideDeleteAllButton();
    
    // Create scan progress popup overlay
    const scanPopup = document.createElement('div');
    scanPopup.id = 'scan-progress-popup';
    scanPopup.className = 'scan-progress-popup';
    scanPopup.innerHTML = `
      <div class="scan-title-container" style="text-align: left; margin-bottom: 20px;">
        <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Scanning collection for rule violations</div>
        <div class="scan-subtitle" style="font-size: 14px; color: #ffffff; text-align: right;">${this.autoFixEnabled ? '(Auto-fix enabled)' : '(Scan only)'}</div>
      </div>
      <div class="scan-percentage" id="scan-percentage">
        0%<span class="scan-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
      <div class="scan-progress-info" style="font-size: 14px; color: #ffffff; margin-bottom: 10px;">
        Processing: <span id="scan-processed">0</span> / <span id="scan-total">${this.seedList.length}</span>
      </div>
      <div class="scan-eta" id="scan-eta" style="font-size: 13px; color: #ffffff; margin-bottom: 15px; min-height: 20px;">
        Calculating time remaining...
      </div>
      <div class="scan-counts-container">
        <div class="scan-violations-count"><span id="scan-violations-found">0</span> violations found</div>
        <div class="scan-fixed-count"><span id="scan-fixed-count">0</span> fixed</div>
      </div>
      <button class="scan-cancel-btn" id="scan-cancel-btn">Cancel</button>
    `;
    document.body.appendChild(scanPopup);
    console.log('[DEBUG] Scan progress popup created');
    
    // Make popup draggable
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;
    
    const dragArea = scanPopup.querySelector('.scan-title-container');
    if (dragArea) {
      dragArea.style.cursor = 'move';
      dragArea.style.userSelect = 'none';
      
      dragArea.addEventListener('mousedown', (e) => {
        e.preventDefault();
        isDragging = true;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        scanPopup.style.cursor = 'grabbing';
      });
    }
    
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        xOffset = currentX;
        yOffset = currentY;
        
        scanPopup.style.transform = `translate(${currentX}px, ${currentY}px)`;
      }
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        scanPopup.style.cursor = 'move';
      }
    });
    
    // Track timing for ETA calculation
    const scanStartTime = Date.now();
    let lastPercentageMilestone = 0;
    
    // Set up cancel button
    let isScanCancelled = false;
    const scanCancelBtn = document.getElementById('scan-cancel-btn');
    if (scanCancelBtn) {
      scanCancelBtn.onclick = () => {
        console.log('[DEBUG] Scan cancelled by user');
        isScanCancelled = true;
        scanPopup.remove();
        this.isInConflictView = false;
        this.filteredSeedList = [];
        
    // Show pagination again after cancel
    const pagination = this.modal.querySelector('#saved-seeds-pagination');
    if (pagination) {
      pagination.style.display = 'flex';
      pagination.style.visibility = 'visible';
      pagination.style.opacity = '1';
      console.log('[DEBUG] Pagination shown after cancel');
    }
        
        // Show "Rule Violations NFTs" button and hide "Delete All" button
        const filterBtn = this.modal.querySelector('#filter-violations');
        if (filterBtn) {
          filterBtn.classList.remove('hidden');
          console.log('[DEBUG] Filter violations button shown after cancel');
        }
        this.hideDeleteAllButton();
        
        this.renderPage(1);
        
        if (window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Scan cancelled.',
            'info',
            3000
          );
        }
      };
    }
    
    // Track fixed count
    let fixedCount = 0;
    
    // Clear the grid and prepare for NFT cards
    const grid = document.getElementById('saved-seeds-grid');
    if (grid) {
      grid.innerHTML = '';
      grid.classList.remove('drag-mode');
      console.log('[DEBUG] Grid cleared for real-time NFT card display');
    }
    
    // OPTIMIZATION: Process NFTs in larger batches for better performance
    const batchSize = 100; // Increased from 50
    const totalNFTs = this.seedList.length;
    
    for (let i = 0; i < this.seedList.length; i += batchSize) {
      // Check if scan was cancelled
      if (isScanCancelled) {
        console.log('[DEBUG] Scan loop stopped due to cancellation');
        return Promise.resolve();
      }
      
      const batch = this.seedList.slice(i, i + batchSize);
      
      // Process batch in parallel
      const batchPromises = batch.map(async (seedObj, batchIndex) => {
        const actualIndex = i + batchIndex;
        try {
          const hasViolations = await this.checkSeedForRuleViolations(seedObj.seed);
          if (hasViolations) {
            return { ...seedObj, originalIndex: actualIndex };
          }
          return null;
        } catch (error) {
          // Only log errors, not every check
          console.error('[DEBUG] Error checking violations for seed:', seedObj.seed.substring(0, 20), error.message);
          return null;
        }
      });
      
      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);
      
      // Add non-null results to filtered list, TRY TO FIX (if enabled), and display immediately
      for (const result of batchResults) {
        if (result) {
          // Get the original index
          const originalIndex = result.originalIndex || this.seedList.findIndex(s => s.seed === result.seed);
          
          let wasFixed = false;
          
          // Only attempt fix if auto-fix is enabled
          if (this.autoFixEnabled) {
            try {
              // Add timeout protection to prevent hanging
              const fixPromise = this.attemptToFixNFT(result, projectData, originalIndex);
              const fixResult = await Promise.race([
                fixPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Fix timeout after 5 seconds')), 5000))
              ]);
              
              wasFixed = fixResult.wasFixed;
              if (wasFixed) {
                result.thumbnail = fixResult.thumbnail;
                fixedCount++;
                
                // Update fixed count in popup immediately
                const scanFixedEl = document.getElementById('scan-fixed-count');
                if (scanFixedEl) {
                  scanFixedEl.textContent = fixedCount;
                }
              }
            } catch (fixError) {
              // Only log errors, not every attempt
              if (fixError.message !== 'Fix timeout after 5 seconds') {
                console.error(`[DEBUG] Fix failed:`, fixError.message);
              }
              wasFixed = false;
            }
          }
          
          // IMMEDIATELY create and display the NFT card in the main grid
          if (grid) {
            const card = this.createNFTCard(result, originalIndex);
            grid.appendChild(card);
            
            // Apply visual indicator based on fix status
            if (wasFixed) {
              // Show green verified checkmark - but DON'T add to filtered list (it's fixed!)
              setTimeout(() => {
                this.showFixSuccessIndicator(result);
                card.offsetHeight; // Force reflow
                console.log(`[DEBUG] ✅ NFT card displayed with SUCCESS indicator for seed: ${result.seed}`);
              }, 100);
            } else {
              // Show red forbidden sign - ADD to filtered list (still has violations)
              this.filteredSeedList.push(result);
              
              // Show Delete All button when first violation is found
              if (this.filteredSeedList.length === 1) {
                const deleteBtn = this.modal.querySelector('#delete-all-violations');
                if (deleteBtn) {
                  deleteBtn.classList.add('visible');
                  deleteBtn.classList.remove('disabled');
                  deleteBtn.disabled = false;
                  console.log('[DEBUG] Delete All button shown - first violation found');
                }
              }
              
              setTimeout(() => {
                this.showViolationIndicator(result);
                card.offsetHeight; // Force reflow
                console.log(`[DEBUG] ⚠️ NFT card displayed with VIOLATION indicator for seed: ${result.seed}`);
              }, 100);
            }
          }
        }
      }
      
      // Update scan progress display - ONLY show exact 1% increments
      const processed = Math.min(i + batchSize, totalNFTs);
      const exactPercentage = (processed / totalNFTs) * 100;
      const displayPercentage = Math.floor(exactPercentage); // Only show integer percentages
      
      const scanPercentageEl = document.getElementById('scan-percentage');
      const scanViolationsEl = document.getElementById('scan-violations-found');
      const scanFixedEl = document.getElementById('scan-fixed-count');
      const scanProcessedEl = document.getElementById('scan-processed');
      const scanEtaEl = document.getElementById('scan-eta');
      
      // Only update percentage display when we reach exactly the next 1%
      if (scanPercentageEl) {
        const currentDisplayed = parseInt(scanPercentageEl.textContent) || 0;
        if (displayPercentage > currentDisplayed) {
          // Update only the text node, preserve the dots HTML
          const dotsHTML = scanPercentageEl.querySelector('.scan-dots');
          scanPercentageEl.childNodes[0].textContent = `${displayPercentage}%`;
        }
      }
      
      // Update processed count
      if (scanProcessedEl) {
        scanProcessedEl.textContent = processed;
      }
      
      // Calculate and display ETA at 1%, then 5%, then every 5% increment
      if (scanEtaEl) {
        const currentPercentage = Math.floor((processed / totalNFTs) * 100);
        const currentMilestone = Math.floor(currentPercentage / 5) * 5;
        
        // Update ETA when we reach 1%, 5%, or any new 5% milestone
        const shouldUpdateETA = (currentPercentage >= 1 && lastPercentageMilestone === 0) || 
                                (currentMilestone >= 5 && currentMilestone > lastPercentageMilestone);
        
        if (shouldUpdateETA && processed < totalNFTs) {
          lastPercentageMilestone = currentMilestone > 0 ? currentMilestone : 1;
          
          const elapsedMs = Date.now() - scanStartTime;
          const avgTimePerNFT = elapsedMs / processed;
          const remainingNFTs = totalNFTs - processed;
          const estimatedRemainingMs = avgTimePerNFT * remainingNFTs;
          
          // Format time remaining (hours and minutes only)
          const totalMinutes = Math.ceil(estimatedRemainingMs / 60000);
          let timeText;
          if (totalMinutes < 60) {
            timeText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
          } else {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if (minutes > 0) {
              timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
              timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
            }
          }
          
          scanEtaEl.textContent = `Estimated time remaining: ${timeText}`;
          console.log(`[DEBUG] ETA updated at ${currentPercentage}%: ${timeText}`);
        } else if (processed >= totalNFTs) {
          scanEtaEl.textContent = 'Completing...';
        }
      }
      
      // Always update violations and fixed counts
      if (scanViolationsEl) {
        scanViolationsEl.textContent = this.filteredSeedList.length;
      }
      if (scanFixedEl) {
        scanFixedEl.textContent = fixedCount;
      }
      
      console.log(`[DEBUG] Scan progress: ${displayPercentage}% (${processed}/${totalNFTs}), Found: ${this.filteredSeedList.length} violations, Fixed: ${fixedCount}`);
      
      // Small delay between batches to keep UI responsive
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log(`[DEBUG] Found ${this.filteredSeedList.length} NFTs with violations`);
    console.log('[DEBUG] Filtered seed list:', this.filteredSeedList.map(s => s.seed));
    
    // CRITICAL: Save all fixed NFTs to localStorage so they persist between sessions
    if (fixedCount > 0) {
      console.log(`[DEBUG] Saving ${fixedCount} fixed NFT(s) to localStorage...`);
      this.saveSeedList();
      console.log('[DEBUG] Fixed NFTs saved successfully to localStorage');
      
      // Notify user to save the project to persist the fixes
      console.log('[DEBUG] ⚠️ IMPORTANT: User should save the project to persist these fixes to the project file!');
      window.NFTApp.getModule('notificationService').show(
        `${fixedCount} NFT${fixedCount !== 1 ? 's' : ''} fixed! Remember to save your project to persist the changes.`,
        'info',
        6000
      );
    }
    
    // Update the display to show only NFTs with conflicts
    this.currentPage = 1;
    
    // Scan complete - remove progress popup
    console.log('[DEBUG] ===== SCAN COMPLETE =====');
    console.log('[DEBUG] Total violations found:', this.filteredSeedList.length);
    console.log('[DEBUG] isInConflictView:', this.isInConflictView);
    
    // Remove the scan progress popup
    const scanPopupElement = document.getElementById('scan-progress-popup');
    if (scanPopupElement) {
      scanPopupElement.remove();
      console.log('[DEBUG] Scan progress popup removed');
    }
    
    // Show pagination again after scan
    const paginationAfterScan = this.modal.querySelector('#saved-seeds-pagination');
    if (paginationAfterScan) {
      paginationAfterScan.style.display = 'flex';
      paginationAfterScan.style.visibility = 'visible';
      paginationAfterScan.style.opacity = '1';
      console.log('[DEBUG] Pagination shown after scan');
    }
    
    // Show completion notification with results
    const totalScanned = this.seedList.length;
    const violationsFound = this.filteredSeedList.length;
    
    // If no violations found, show success message
    if (violationsFound === 0) {
      // Show "Rule Violations NFTs" button and hide "Delete All" button (no violations to delete)
      const filterBtn = this.modal.querySelector('#filter-violations');
      if (filterBtn) {
        filterBtn.classList.remove('hidden');
        console.log('[DEBUG] Filter violations button shown after scan (no violations)');
      }
      this.hideDeleteAllButton();
      const gridElement = document.getElementById('saved-seeds-grid');
      if (gridElement) {
        gridElement.innerHTML = '<div class="no-seeds" style="font-size: 16px; color: #27ae60; text-align: center; padding: 40px;">✓ No NFTs with rule violations found! All NFTs comply with the rules.</div>';
      }
      
      // Show success notification
      let successMessage = `Scan complete! All ${totalScanned} NFTs comply with the rules. ✓`;
      if (fixedCount > 0) {
        successMessage = `Scan complete! Fixed ${fixedCount} NFT${fixedCount !== 1 ? 's' : ''}. All ${totalScanned} NFTs now comply with the rules. ✓`;
      }
      window.NFTApp.getModule('notificationService').show(successMessage, 'success', 5000);
      console.log('[DEBUG] No violations found - displaying success message');
      return Promise.resolve();
    }
    
    // Violations found - show results notification
    let resultsMessage = `Scan complete! Found ${violationsFound} NFT${violationsFound !== 1 ? 's' : ''} with rule violations`;
    if (fixedCount > 0) {
      const remainingViolations = violationsFound;
      resultsMessage = `Scan complete! Fixed ${fixedCount} NFT${fixedCount !== 1 ? 's' : ''}. ${remainingViolations} NFT${remainingViolations !== 1 ? 's' : ''} still need${remainingViolations === 1 ? 's' : ''} attention.`;
    }
    window.NFTApp.getModule('notificationService').show(resultsMessage, 'info', 5000);
    console.log('[DEBUG] Violations found - displaying results notification');
    
    // Hide Delete All button and show filter button after scan completes
    this.hideDeleteAllButton();
    const filterBtnAfterScan = this.modal.querySelector('#filter-violations');
    if (filterBtnAfterScan) {
      filterBtnAfterScan.classList.remove('hidden');
      console.log('[DEBUG] Filter violations button shown after scan (violations found)');
    }
    
    // Update filter buttons to reflect conflict view (will change text to "Show All NFTs")
    this.updateFilterButtons();
    
    console.log('[DEBUG] NFT cards already displayed during scan:', this.filteredSeedList.length, 'cards');
    
    // Refresh rarity display on all cards after scan completes
    setTimeout(() => {
      if (this.modal && this.rarityRankEnabled) {
        this.refreshRarityDisplayOnAllCards();
        console.log('[DEBUG] Rarity display refreshed for all violation cards');
      }
    }, 100);
    
    console.log('[DEBUG] Conflict view setup complete');
    return Promise.resolve();
  }

  // Attempt to fix an NFT by regenerating with correct stacking order
  async attemptToFixNFT(result, projectData, originalIndex) {
    console.log(`[DEBUG] attemptToFixNFT called for seed: ${result.seed}`);
    
    const generateNftsModule = window.NFTApp.getModule('generateNfts');
    if (!generateNftsModule?.generateSingleNFT) {
      throw new Error('generateSingleNFT not available');
    }
    
    console.log(`[DEBUG] Calling generateSingleNFT...`);
    const nftData = await generateNftsModule.generateSingleNFT(projectData, false, result.seed);
    console.log(`[DEBUG] generateSingleNFT returned:`, nftData ? 'Data received' : 'No data');
    console.log(`[DEBUG]   Has imageData:`, !!nftData?.imageData);
    console.log(`[DEBUG]   Has traits:`, !!nftData?.traits);
    
    // CRITICAL FIX: generateSingleNFT returns imageData, not thumbnail
    if (nftData?.imageData && nftData?.traits) {
      console.log(`[DEBUG] Checking for remaining violations...`);
      
      // Use the generate-nfts module's checkForRuleViolations, not the local one
      const violations = generateNftsModule.checkForRuleViolations(nftData, projectData.rules);
      const stillHasViolations = violations && violations.length > 0;
      
      console.log(`[DEBUG] Violations check result:`, stillHasViolations ? `${violations.length} violations` : 'No violations');
      
      if (!stillHasViolations) {
        console.log(`[DEBUG] ✅ NFT FIXED! Updating thumbnail and saving...`);
        // Store the imageData as thumbnail
        result.thumbnail = nftData.imageData;
        this.seedList[originalIndex].thumbnail = nftData.imageData;
        
        // Update caches
        this.imageCache[result.seed] = nftData.imageData;
        if (!window.savedSeedsImageCache) {
          window.savedSeedsImageCache = {};
        }
        window.savedSeedsImageCache[result.seed] = nftData.imageData;
        
        // Remove from violations cache
        this.violationsCache.delete(result.seed);
        this.saveViolationsCache();
        
        console.log(`[DEBUG] NFT fixed and saved successfully`);
        return { wasFixed: true, thumbnail: nftData.imageData };
      } else {
        console.log(`[DEBUG] ❌ NFT still has ${violations.length} violations after regeneration`);
        violations.forEach((v, idx) => console.log(`[DEBUG]   Violation ${idx + 1}: ${v}`));
        
        // Keep in violations cache
        this.violationsCache.set(result.seed, true);
        this.saveViolationsCache();
      }
    } else {
      console.log(`[DEBUG] ❌ No imageData or traits in generated NFT data`);
    }
    
    return { wasFixed: false, thumbnail: result.thumbnail };
  }

  // Restore original view (show all NFTs)
  restoreOriginalView() {
    console.log('[DEBUG] Restoring original view - showing all NFTs');
    
    // Clear conflict view flag
    this.isInConflictView = false;
    
    // Clear filtered list to show all NFTs
    this.filteredSeedList = [];
    
    // Hide Delete All button and show Rule Violations NFTs button
    this.hideDeleteAllButton();
    const filterBtn = this.modal.querySelector('#filter-violations');
    if (filterBtn) {
      filterBtn.classList.remove('hidden');
      console.log('[DEBUG] Filter violations button shown in restoreOriginalView');
    }
    
    // Update the display to show all NFTs
    this.currentPage = 1;
    this.renderPage(1);
    this.updateFilterButtons();
  }

  // Update processing progress display
  updateProcessingProgress(processed, fixed, total) {
    console.log(`[DEBUG] ========== UPDATE PROCESSING PROGRESS ==========`);
    console.log(`[DEBUG] processed=${processed}, fixed=${fixed}, total=${total}`);
    
    // Get processing message container first
    const processingMessage = document.getElementById('processing-message');
    console.log('[DEBUG] Processing message container:', processingMessage);
    
    if (!processingMessage) {
      console.error('[DEBUG] ⚠️ CRITICAL: Processing message container not found!');
      return;
    }
    
    // Always search for elements in DOM to ensure we have the latest references
    const processedCountEl = document.querySelector('.processed-count');
    const fixedCountEl = document.querySelector('.fixed-count');
    const progressPercentageEl = document.querySelector('.progress-percentage');
    
    console.log('[DEBUG] Elements found:', {
      processedCountEl: !!processedCountEl,
      fixedCountEl: !!fixedCountEl,
      progressPercentageEl: !!progressPercentageEl,
      processedCountElHTML: processedCountEl ? processedCountEl.outerHTML : 'N/A',
      fixedCountElHTML: fixedCountEl ? fixedCountEl.outerHTML : 'N/A',
      progressPercentageElHTML: progressPercentageEl ? progressPercentageEl.outerHTML : 'N/A'
    });
    
    if (!processedCountEl || !fixedCountEl || !progressPercentageEl) {
      console.error('[DEBUG] ⚠️ CRITICAL: Processing elements not found in DOM!');
      console.error('[DEBUG] Processing message innerHTML:', processingMessage.innerHTML);
      return;
    }
    
    // Update the elements
    try {
      const oldProcessedValue = processedCountEl.textContent;
      processedCountEl.textContent = processed;
      console.log(`[DEBUG] ✅ Updated processed count from ${oldProcessedValue} to: ${processed}`);
      
      const oldFixedValue = fixedCountEl.textContent;
      fixedCountEl.textContent = fixed;
      console.log(`[DEBUG] ✅ Updated fixed count from ${oldFixedValue} to: ${fixed}`);
      
      if (total > 0) {
        const percentage = Math.round((processed / total) * 100);
        const oldPercentage = progressPercentageEl.textContent;
        progressPercentageEl.textContent = `${percentage}%`;
        console.log(`[DEBUG] ✅ Updated progress percentage from ${oldPercentage} to: ${percentage}%`);
      }
      
      // Force a reflow to ensure changes are visible
      processedCountEl.offsetHeight;
      fixedCountEl.offsetHeight;
      progressPercentageEl.offsetHeight;
      
      console.log('[DEBUG] ========== UPDATE COMPLETE ==========');
      console.log('[DEBUG] Current displayed values:', {
        processed: processedCountEl.textContent,
        fixed: fixedCountEl.textContent,
        percentage: progressPercentageEl.textContent
      });
    } catch (error) {
      console.error('[DEBUG] ❌ Error updating progress elements:', error);
      console.error('[DEBUG] Error stack:', error.stack);
    }
  }
  
  // Test function to debug auto-reorder issues
  async testAutoReorderDebug() {
    console.log('[DEBUG] Starting auto-reorder debug test...');
    
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData) {
      console.error('[DEBUG] No project data available');
      return;
    }
    
    console.log('[DEBUG] Project data:', projectData);
    console.log('[DEBUG] Rules:', projectData.rules);
    
    if (!projectData.rules || projectData.rules.length === 0) {
      console.log('[DEBUG] No rules defined - nothing to fix');
      return;
    }
    
    console.log(`[DEBUG] Found ${projectData.rules.length} rules to apply`);
    
    // Test with first few NFTs
    const testNFTs = this.seedList.slice(0, 3).filter(seedObj => seedObj.seed);
    console.log(`[DEBUG] Testing with ${testNFTs.length} NFTs`);
    
    for (let i = 0; i < testNFTs.length; i++) {
      const seedObj = testNFTs[i];
      console.log(`[DEBUG] Testing NFT ${i + 1} with seed: ${seedObj.seed}`);
      
      try {
        // Generate NFT from seed
        const nft = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, seedObj.seed);
        
        if (!nft || !nft.traits) {
          console.log('[DEBUG] Failed to generate NFT or NFT has no traits');
          continue;
        }
        
        console.log(`[DEBUG] Generated NFT with traits: ${nft.traits.map(t => t.layer.name).join(' -> ')}`);
        
        // Check for violations
        const violations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(nft, projectData.rules);
        
        console.log(`[DEBUG] Violations found:`, violations);
        
        if (violations && violations.length > 0) {
          console.log(`[DEBUG] Found ${violations.length} violations, attempting to fix...`);
          
          // Apply rule fixes
          const fixedNFT = this.applyRuleFixes(nft, projectData);
          
          if (fixedNFT && fixedNFT.traits) {
            console.log(`[DEBUG] After fixes: ${fixedNFT.traits.map(t => t.layer.name).join(' -> ')}`);
            
            // Check if the fixed NFT still has violations
            const remainingViolations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(fixedNFT, projectData.rules);
            
            if (remainingViolations.length === 0) {
              console.log('[DEBUG] All violations fixed!');
              
              // Generate new seed from fixed NFT
              const newSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, fixedNFT);
              
              console.log(`[DEBUG] Original seed: ${seedObj.seed}`);
              console.log(`[DEBUG] New seed: ${newSeed}`);
              console.log(`[DEBUG] Seeds are different: ${newSeed !== seedObj.seed}`);
            } else {
              console.log(`[DEBUG] Still have ${remainingViolations.length} violations after fixes:`, remainingViolations);
            }
          } else {
            console.log('[DEBUG] Failed to apply fixes or fixed NFT is invalid');
          }
        } else {
          console.log(`[DEBUG] No violations found for NFT ${i + 1}`);
        }
      } catch (error) {
        console.error(`[DEBUG] Error testing NFT ${i + 1}:`, error);
      }
    }
    
    console.log('[DEBUG] Auto-reorder debug test completed');
  }
  
  // Test function to demonstrate seed behavior with trait ordering
  async testSeedOrderingBehavior() {
    console.log('[DEBUG] Testing seed behavior with trait ordering...');
    
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData) {
      console.error('[DEBUG] No project data available');
      return;
    }
    
    console.log('[DEBUG] Project data:', projectData);
    console.log('[DEBUG] Rules:', projectData.rules);
    
    if (!projectData.rules || projectData.rules.length === 0) {
      console.log('[DEBUG] No rules defined - creating a test rule');
      // Create a test rule for demonstration
      const testRule = {
        id: 'test-rule-' + Date.now(),
        type: 'always-above',
        appliesTo: 'between-layers',
        firstLayerId: 'test-layer-a',
        secondLayerId: 'test-layer-b',
        firstLayerName: 'Layer A',
        secondLayerName: 'Layer B'
      };
      projectData.rules = [testRule];
      console.log('[DEBUG] Created test rule:', testRule);
    }
    
    // Test with first NFT
    const testNFT = this.seedList[0];
    if (!testNFT || !testNFT.seed) {
      console.log('[DEBUG] No test NFT available');
      return;
    }
    
    console.log(`[DEBUG] Testing with NFT seed: ${testNFT.seed}`);
    
    try {
      // Generate original NFT
      const originalNFT = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, testNFT.seed);
      console.log(`[DEBUG] Original NFT traits order: ${originalNFT.traits.map(t => t.layer.name).join(' -> ')}`);
      
      // Generate seed from original NFT
      const originalSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, originalNFT);
      console.log(`[DEBUG] Original seed: ${originalSeed}`);
      
      // Apply rule fixes to change trait order
      const fixedNFT = this.applyRuleFixes(originalNFT, projectData);
      console.log(`[DEBUG] Fixed NFT traits order: ${fixedNFT.traits.map(t => t.layer.name).join(' -> ')}`);
      
      // Generate seed from fixed NFT
      const fixedSeed = window.NFTApp.getModule('generateNfts').computeDeterministicSeed(projectData, fixedNFT);
      console.log(`[DEBUG] Fixed seed: ${fixedSeed}`);
      
      // Compare seeds
      console.log(`[DEBUG] Seeds are different: ${originalSeed !== fixedSeed}`);
      
      if (originalSeed !== fixedSeed) {
        console.log('[DEBUG] ✅ Seeds are different - trait ordering IS included in seed generation');
      } else {
        console.log('[DEBUG] ❌ Seeds are the same - trait ordering is NOT included in seed generation');
      }
      
      // Test the seed service method too
      const seedService = window.NFTApp.getModule('seedService');
      if (seedService && projectData.seedAlgorithm) {
        const originalTraitCombination = originalNFT.traits.map(t => ({
          layer: t.layer.name,
          trait: t.trait.name
        }));
        const fixedTraitCombination = fixedNFT.traits.map(t => ({
          layer: t.layer.name,
          trait: t.trait.name
        }));
        
        const generateNftsModule = window.NFTApp.getModule('generateNfts');
        const originalSeedService = generateNftsModule.computeDeterministicSeed(projectData, { traits: originalTraitCombination });
        const fixedSeedService = generateNftsModule.computeDeterministicSeed(projectData, { traits: fixedTraitCombination });
        
        console.log(`[DEBUG] Seed service original: ${originalSeedService}`);
        console.log(`[DEBUG] Seed service fixed: ${fixedSeedService}`);
        console.log(`[DEBUG] Seed service seeds are different: ${originalSeedService !== fixedSeedService}`);
      }
      
    } catch (error) {
      console.error('[DEBUG] Error testing seed ordering behavior:', error);
    }
    
    console.log('[DEBUG] Seed ordering behavior test completed');
  }
  
  // Test function to debug the new applyRuleFixes method
  async testApplyRuleFixes() {
    console.log('[DEBUG] Testing applyRuleFixes method...');
    
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData) {
      console.error('[DEBUG] No project data available');
      return;
    }
    
    console.log('[DEBUG] Project data:', projectData);
    console.log('[DEBUG] Rules:', projectData.rules);
    
    if (!projectData.rules || projectData.rules.length === 0) {
      console.log('[DEBUG] No rules defined - nothing to test');
      return;
    }
    
    // Test with first NFT
    const testNFT = this.seedList[0];
    if (!testNFT || !testNFT.seed) {
      console.log('[DEBUG] No test NFT available');
      return;
    }
    
    console.log(`[DEBUG] Testing with NFT seed: ${testNFT.seed}`);
    
    try {
      // Generate original NFT
      const originalNFT = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, testNFT.seed);
      console.log(`[DEBUG] Original NFT traits order: ${originalNFT.traits.map(t => t.layer.name).join(' -> ')}`);
      
      // Check for violations
      const violations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(originalNFT, projectData.rules);
      console.log(`[DEBUG] Original violations:`, violations);
      
      // Filter ordering violations
      const orderingViolations = violations.filter(v => 
        v.includes('must be rendered above') || 
        v.includes('must be rendered below') ||
        v.includes('must be rendered immediately above') ||
        v.includes('must be rendered immediately below')
      );
      
      console.log(`[DEBUG] Ordering violations:`, orderingViolations);
      
      if (orderingViolations.length > 0) {
        console.log(`[DEBUG] Testing applyRuleFixes with ${orderingViolations.length} ordering violations...`);
        
        // Apply rule fixes
        const fixedNFT = this.applyRuleFixes(originalNFT, projectData);
        console.log(`[DEBUG] Fixed NFT traits order: ${fixedNFT.traits.map(t => t.layer.name).join(' -> ')}`);
        
        // Check if violations are fixed
        const remainingViolations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(fixedNFT, projectData.rules);
        const remainingOrderingViolations = remainingViolations.filter(v => 
          v.includes('must be rendered above') || 
          v.includes('must be rendered below') ||
          v.includes('must be rendered immediately above') ||
          v.includes('must be rendered immediately below')
        );
        
        console.log(`[DEBUG] Remaining ordering violations:`, remainingOrderingViolations);
        
        if (remainingOrderingViolations.length === 0) {
          console.log('[DEBUG] ✅ All trait ordering violations fixed!');
        } else {
          console.log('[DEBUG] ❌ Still have trait ordering violations after fixes');
        }
      } else {
        console.log('[DEBUG] No trait ordering violations to fix');
      }
      
    } catch (error) {
      console.error('[DEBUG] Error testing applyRuleFixes:', error);
    }
    
    console.log('[DEBUG] applyRuleFixes test completed');
  }
  
  // Remove error indicators from a fixed NFT
  removeErrorIndicatorsFromNFT(seedObj) {
    console.log('[DEBUG] Removing error indicators from NFT with seed:', seedObj.seed);
    
    // Find the NFT card in the current view
    const nftCard = this.findNFTCardBySeed(seedObj.seed);
    if (nftCard) {
      // Remove violation overlay if it exists
      const violationOverlay = nftCard.querySelector('.violation-overlay');
      if (violationOverlay) {
        violationOverlay.remove();
        console.log('[DEBUG] Removed violation overlay from NFT card');
      }
      
      // Remove any error styling
      nftCard.classList.remove('has-violations');
      nftCard.classList.add('violations-fixed');
      
      // Add success indicator temporarily
      const successIndicator = document.createElement('div');
      successIndicator.className = 'fix-success-indicator';
      successIndicator.innerHTML = '✅';
      successIndicator.style.cssText = `
        position: absolute;
        top: 5px;
        right: 5px;
        background: #27ae60;
        color: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        z-index: 10;
        animation: fadeIn 0.3s ease-in;
      `;
      
      nftCard.appendChild(successIndicator);
      
      // Remove success indicator after 3 seconds
      setTimeout(() => {
        if (successIndicator && successIndicator.parentNode) {
          successIndicator.remove();
        }
      }, 3000);
    }
    
    // Update violation cache to mark this NFT as fixed
    this.violationsCache.set(seedObj.seed, false);
    this.saveViolationsCache();
    
    // If we're currently filtering violations, remove this NFT from the filtered list
    if (this.isFilteringViolations) {
      const index = this.filteredSeedList.findIndex(item => item.seed === seedObj.seed);
      if (index !== -1) {
        this.filteredSeedList.splice(index, 1);
        console.log('[DEBUG] Removed fixed NFT from violation search results');
        
        // Update the display
        this.renderPage(this.currentPage);
        this.updateFilterButtons();
      }
    }
  }

  // Show violations during processing
  showViolationsDuringProcessing(seedObj, violations) {
    console.log('[DEBUG] Showing violations during processing for seed:', seedObj.seed);
    
    // Find the NFT card in the current page
    const card = document.querySelector(`[data-seed="${seedObj.seed}"]`);
    if (card) {
      // Remove existing violation overlay if any
      const existingOverlay = card.querySelector('.violation-overlay');
      if (existingOverlay) {
        existingOverlay.remove();
      }
      
      // Create violation overlay
      const violationOverlay = document.createElement('div');
      violationOverlay.className = 'violation-overlay';
      violationOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(231, 76, 60, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-weight: bold;
        font-size: 24px;
        z-index: 100;
        border-radius: 8px;
      `;
      violationOverlay.innerHTML = '⚠';
      
      card.appendChild(violationOverlay);
      
      // Add violation details as custom tooltip
      violationOverlay.removeAttribute('title');
      violationOverlay.classList.add('tooltip');
      let violationTooltip = violationOverlay.querySelector('.tooltiptext');
      if (!violationTooltip) {
        violationTooltip = document.createElement('span');
        violationTooltip.className = 'tooltiptext';
        violationOverlay.appendChild(violationTooltip);
      }
      violationTooltip.textContent = violations.join('\n');
    }
  }

  // Show success indicator for fixed NFTs
  // Update NFT card thumbnail in real-time
  updateNFTCardThumbnail(seedObj) {
    console.log('[DEBUG] Updating NFT card thumbnail for seed:', seedObj.seed);
    
    // Find the card in the current page
    const cards = document.querySelectorAll('.saved-seeds-card');
    for (const card of cards) {
      const cardSeed = card.getAttribute('data-seed');
      if (cardSeed === seedObj.seed) {
        console.log('[DEBUG] Found card, updating thumbnail');
        
        // Update the thumbnail image
        const thumbnail = card.querySelector('.saved-seeds-thumbnail');
        if (thumbnail && seedObj.thumbnail) {
          thumbnail.src = seedObj.thumbnail;
          console.log('[DEBUG] Thumbnail updated successfully');
        }
        
        break;
      }
    }
  }

  showFixSuccessIndicator(seedObj) {
    console.log('[DEBUG] Showing fix success indicator for seed:', seedObj.seed);
    
    // Find the NFT card in the current page
    const card = document.querySelector(`[data-seed="${seedObj.seed}"]`);
    if (card) {
      // Remove violation overlay
      const violationOverlay = card.querySelector('.violation-overlay');
      if (violationOverlay) {
        violationOverlay.remove();
      }
      
      // Add fixed styling
      card.classList.add('violations-fixed');
      
      // Show green check mark
      const successIndicator = document.createElement('div');
      successIndicator.className = 'fix-success-indicator';
      successIndicator.innerHTML = '✓';
      successIndicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #27ae60;
        color: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 14px;
        z-index: 1000;
        animation: fadeIn 0.3s ease-in;
      `;
      
      card.appendChild(successIndicator);
      
      // Keep the success indicator permanently (don't remove it)
      console.log('[DEBUG] Success indicator added permanently');
    }
  }

  // Show violation indicator (forbidden sign) for unfixed NFTs
  showViolationIndicator(seedObj) {
    console.log('[DEBUG] Showing violation indicator for seed:', seedObj.seed);
    
    // Find the NFT card in the current page
    const card = document.querySelector(`[data-seed="${seedObj.seed}"]`);
    if (card) {
      // Show red forbidden sign
      const violationIndicator = document.createElement('div');
      violationIndicator.className = 'violation-overlay';
      violationIndicator.innerHTML = '🚫';
      violationIndicator.style.cssText = `
        position: absolute;
        top: 10px;
        right: 10px;
        background: #e74c3c;
        color: white;
        border-radius: 50%;
        width: 28px;
        height: 28px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        font-size: 16px;
        z-index: 1000;
        animation: fadeIn 0.3s ease-in;
      `;
      
      card.appendChild(violationIndicator);
      
      console.log('[DEBUG] Violation indicator added');
    }
  }

  // Keep violation indicators for unfixed NFTs
  keepViolationIndicators(seedObj, violations) {
    console.log('[DEBUG] Keeping violation indicators for unfixed NFT:', seedObj.seed);
    
    // Find the NFT card in the current page
    const card = document.querySelector(`[data-seed="${seedObj.seed}"]`);
    if (card) {
      // Ensure violation overlay exists
      let violationOverlay = card.querySelector('.violation-overlay');
      if (!violationOverlay) {
        violationOverlay = document.createElement('div');
        violationOverlay.className = 'violation-overlay';
        violationOverlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(231, 76, 60, 0.8);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
          z-index: 100;
          border-radius: 8px;
        `;
        card.appendChild(violationOverlay);
      }
      
      violationOverlay.innerHTML = '⚠';
      // Remove title and add custom tooltip
      violationOverlay.removeAttribute('title');
      violationOverlay.classList.add('tooltip');
      let violationTooltip = violationOverlay.querySelector('.tooltiptext');
      if (!violationTooltip) {
        violationTooltip = document.createElement('span');
        violationTooltip.className = 'tooltiptext';
        violationOverlay.appendChild(violationTooltip);
      }
      violationTooltip.textContent = violations.join('\n');
    }
  }

  // Remove NFT from violation cache
  removeFromViolationCache(seedObj) {
    console.log('[DEBUG] Removing NFT from violation cache:', seedObj.seed);
    
    // Update violations cache - remove this NFT from violations
    if (this.violationsCache) {
      this.violationsCache.set(seedObj.seed, false);
      this.saveViolationsCache();
    }
    
    // If currently filtering violations, remove this NFT from the filtered list
    if (this.isFilteringViolations && this.filteredSeedList) {
      this.filteredSeedList = this.filteredSeedList.filter(s => s.seed !== seedObj.seed);
    }
    
    console.log('[DEBUG] Successfully removed NFT from violation cache');
  }
  
  // Find NFT card by seed
  findNFTCardBySeed(seed) {
    const cards = this.modal.querySelectorAll('.saved-seeds-card');
    for (const card of cards) {
      const seedElement = card.querySelector('.seed-number');
      if (seedElement && seedElement.textContent === seed) {
        return card;
      }
    }
    return null;
  }

  // Handle direct page clicks - keep same window, just change active page
  goToPage(pageNumber, resetWindow = false) {
    console.log('[DEBUG] Going to page:', pageNumber, 'resetWindow:', resetWindow);
    
    // CRITICAL: When navigating to last page, verify seedList is current before rendering
    const seedListKey = this.seedListKey || this.getSeedListKey();
    if (!this.isFilteringViolations && !this.isFilteringByRarity && !this.isFilteringByPosition && !this.isFilteringByTrait && !this.isInConflictView) {
      try {
        const latestSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
        const totalPages = Math.ceil((latestSeeds.length || this.seedList.length) / this.pageSize);
        
        // If navigating to last page, double-check we have the latest data
        if (pageNumber === totalPages && Array.isArray(latestSeeds) && latestSeeds.length > 0) {
          // Verify count and last seed match
          if (latestSeeds.length !== this.seedList.length) {
            console.log('[DEBUG] ⚠️ Navigate to last page: Count mismatch - reloading seedList');
            this.loadSeedList(true);
          } else {
            // Verify last seed matches
            const lastLocalStorageSeed = typeof latestSeeds[latestSeeds.length - 1] === 'string' || typeof latestSeeds[latestSeeds.length - 1] === 'number'
              ? String(latestSeeds[latestSeeds.length - 1])
              : (latestSeeds[latestSeeds.length - 1]?.seed ? String(latestSeeds[latestSeeds.length - 1].seed) : null);
            const lastSeedListSeed = this.seedList[this.seedList.length - 1]?.seed;
            
            if (lastLocalStorageSeed && lastSeedListSeed && lastLocalStorageSeed !== lastSeedListSeed) {
              console.log('[DEBUG] ⚠️ Navigate to last page: Last seed mismatch - reloading seedList');
              this.loadSeedList(true);
            }
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error verifying seedList before navigation:', error);
      }
    }
    
    if (resetWindow) {
      // For First/Last buttons, reset the window and position
      this.windowStart = Math.max(1, pageNumber); // Start window at the page
      this.activePosition = 1; // Put active page at position 1
    } else {
      // For direct page clicks, calculate new active position within current window
      this.activePosition = pageNumber - this.windowStart + 1;
      
      // If the clicked page is outside the current window, adjust the window
      if (this.activePosition < 1 || this.activePosition > 10) {
        this.windowStart = Math.max(1, pageNumber); // Start window at the page
        this.activePosition = 1; // Put active page at position 1
      }
    }
    
    this.currentPage = pageNumber;
    this.renderPage(pageNumber);
  }

  // Handle shifting window by 1 page while maintaining active position (< and > buttons)
  moveActivePosition(direction) {
    console.log('[DEBUG] Shifting window by:', direction);
    
    const windowSize = 10;
    // Use filtered list if filtering is active, otherwise use full seed list
    const currentList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.isInConflictView || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    const totalPages = Math.ceil(currentList.length / this.pageSize);
    
    // Shift the window by 1 page
    let newWindowStart = this.windowStart + direction;
    newWindowStart = Math.max(1, newWindowStart);
    newWindowStart = Math.min(totalPages - windowSize + 1, newWindowStart);
    
    // Calculate new current page maintaining the same active position
    let newCurrentPage = newWindowStart + this.activePosition - 1;
    
    // Ensure we don't go beyond total pages
    newCurrentPage = Math.min(totalPages, Math.max(1, newCurrentPage));
    
    // Adjust active position if we hit boundaries
    if (newCurrentPage === totalPages && this.activePosition > (totalPages - newWindowStart + 1)) {
      this.activePosition = totalPages - newWindowStart + 1;
    }
    if (newCurrentPage === 1 && this.activePosition < 1) {
      this.activePosition = 1;
    }
    
    console.log('[DEBUG] Shift window:', {
      direction: direction,
      oldWindowStart: this.windowStart,
      newWindowStart: newWindowStart,
      oldCurrentPage: this.currentPage,
      newCurrentPage: newCurrentPage,
      activePosition: this.activePosition
    });
    
    this.windowStart = newWindowStart;
    this.currentPage = newCurrentPage;
    
    this.renderPage(this.currentPage);
  }

  // Handle jumping by 10 pages while maintaining active position (<< and >> buttons)
  jumpPages(direction) {
    console.log('[DEBUG] Jumping by 10 pages:', direction > 0 ? 'right' : 'left');
    console.log('[DEBUG] Direction value:', direction);
    
    const windowSize = 10;
    // Use filtered list if filtering is active, otherwise use full seed list
    const currentList = (this.isFilteringViolations || this.isFilteringByRarity || this.isFilteringByPosition || this.isFilteringByTrait || this.isInConflictView || this.filteredSeedList.length > 0) ? this.filteredSeedList : this.seedList;
    const totalPages = Math.ceil(currentList.length / this.pageSize);
    
    // Calculate new window start by shifting 10 pages
    // direction is already -10 or +10, so we use it directly
    let newWindowStart = this.windowStart + direction;
    newWindowStart = Math.max(1, newWindowStart);
    newWindowStart = Math.min(totalPages - windowSize + 1, newWindowStart);
    
    // Calculate new current page maintaining the same relative position
    const newCurrentPage = newWindowStart + this.activePosition - 1;
    
    console.log('[DEBUG] Jump navigation:', {
      direction: direction,
      totalPages: totalPages,
      oldWindowStart: this.windowStart,
      newWindowStart: newWindowStart,
      oldCurrentPage: this.currentPage,
      newCurrentPage: newCurrentPage,
      activePosition: this.activePosition
    });
    
    this.windowStart = newWindowStart;
    this.currentPage = Math.min(totalPages, Math.max(1, newCurrentPage));
    
    // Adjust active position if we hit boundaries
    if (this.currentPage === totalPages && this.activePosition > (totalPages - this.windowStart + 1)) {
      this.activePosition = totalPages - this.windowStart + 1;
    }
    if (this.currentPage === 1 && this.activePosition < 1) {
      this.activePosition = 1;
    }
    
    this.renderPage(this.currentPage);
  }

  saveSeedList() {
    try {
      console.log('[DEBUG] Saving seed list with', this.seedList.length, 'seeds');
      
      // Validate seed data before saving
      const validatedSeedList = this.seedList.map(seed => {
        // Ensure seed has required properties and valid data
        const validatedSeed = {
          seed: seed.seed || '',
          thumbnail: seed.thumbnail || seed.imageData || '',
          traits: seed.traits || [],
          rarityScore: seed.rarityScore || 0
        };
        
        // Include imageData if it exists and is not too large
        if (seed.imageData && typeof seed.imageData === 'string') {
          if (seed.imageData.length > 1000000) {
            console.warn('[DEBUG] ImageData too large for seed:', seed.seed, 'size:', seed.imageData.length);
            // Keep thumbnail but remove imageData to save space
            // thumbnail is already set above with fallback
          } else {
            validatedSeed.imageData = seed.imageData;
            validatedSeed.thumbnail = seed.imageData; // Use imageData as thumbnail for consistency
          }
        }
        
        return validatedSeed;
      });
      
      const jsonString = JSON.stringify(validatedSeedList);
      
      // Check if the string is too large
      if (jsonString.length > 5000000) { // 5MB limit
        console.warn('[DEBUG] Seed list too large, trying optimized storage...');
        const optimizedSeedList = SavedSeedsModal.optimizeSeedListForStorage(validatedSeedList, false);
        
        // Use MemoryManager's safe localStorage method if available
        if (window.safeLocalStorageSetItem) {
          const success = window.safeLocalStorageSetItem(this.seedListKey, JSON.stringify(optimizedSeedList));
          if (success) {
            console.log('[DEBUG] ✅ Optimized seed list saved via MemoryManager');
          } else {
            console.log('[DEBUG] ⚠️ Optimized seed list saved via fallback localStorage method');
          }
        } else {
          localStorage.setItem(this.seedListKey, JSON.stringify(optimizedSeedList));
          console.log('[DEBUG] ✅ Optimized seed list saved (without imageData)');
        }
      } else {
        // Use MemoryManager's safe localStorage method if available
        if (window.safeLocalStorageSetItem) {
          const success = window.safeLocalStorageSetItem(this.seedListKey, jsonString);
          if (success) {
            console.log('[DEBUG] ✅ Seed list saved successfully via MemoryManager');
          } else {
            console.log('[DEBUG] ⚠️ Seed list saved via fallback localStorage method');
          }
        } else {
          localStorage.setItem(this.seedListKey, jsonString);
          console.log('[DEBUG] ✅ Seed list saved successfully');
        }
      }
      
      // Update all counters after saving
      window.updateAllCounters();
      
    } catch (error) {
      console.error('[DEBUG] Error saving seed list:', error);
      
      if (error.name === 'QuotaExceededError' || error.message.includes('Invalid string length')) {
        console.log('[DEBUG] ⚠️ localStorage quota exceeded or invalid string length, trying optimized storage...');
        
        // Try saving without imageData to reduce size
        const optimizedSeedList = SavedSeedsModal.optimizeSeedListForStorage(this.seedList, false);
        
        try {
          // Use MemoryManager's safe localStorage method if available
          if (window.safeLocalStorageSetItem) {
            const success = window.safeLocalStorageSetItem(this.seedListKey, JSON.stringify(optimizedSeedList));
            if (success) {
              console.log('[DEBUG] ✅ Optimized seed list saved via MemoryManager');
            } else {
              console.log('[DEBUG] ⚠️ Optimized seed list saved via fallback localStorage method');
            }
          } else {
            localStorage.setItem(this.seedListKey, JSON.stringify(optimizedSeedList));
            console.log('[DEBUG] ✅ Optimized seed list saved (without imageData)');
          }
          
          // Update all counters after successful fallback save
          window.updateAllCounters();
        } catch (secondError) {
          console.error('[DEBUG] ❌ Failed to save even optimized seed list:', secondError);
          
          // Last resort: try to save just the essential data
          const minimalSeedList = this.seedList.map(seed => ({
            seed: seed.seed || '',
            traits: seed.traits || [],
            rarityScore: seed.rarityScore || 0
          }));
          
          try {
            // Use MemoryManager's safe localStorage method if available
            if (window.safeLocalStorageSetItem) {
              const success = window.safeLocalStorageSetItem(this.seedListKey, JSON.stringify(minimalSeedList));
              if (success) {
                console.log('[DEBUG] ✅ Minimal seed list saved via MemoryManager');
              } else {
                console.log('[DEBUG] ⚠️ Minimal seed list saved via fallback localStorage method');
              }
            } else {
              localStorage.setItem(this.seedListKey, JSON.stringify(minimalSeedList));
              console.log('[DEBUG] ✅ Minimal seed list saved (essential data only)');
            }
            
            // Update all counters after successful minimal save
            window.updateAllCounters();
          } catch (finalError) {
            console.error('[DEBUG] ❌ Complete storage failure during save:', finalError);
            if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
              window.NFTApp.getModule('notificationService').show(
                'Failed to save NFT changes due to storage limitations. Please try clearing some data.',
                'error',
                5000
              );
            } else {
              alert('Failed to save NFT changes due to storage limitations. Please try clearing some data.');
            }
            return false;
          }
        }
      } else {
        console.error('[DEBUG] ❌ Other localStorage error during save:', error);
        if (window.NFTApp && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Failed to save NFT changes: ' + error.message,
            'error',
            5000
          );
        } else {
          alert('Failed to save NFT changes: ' + error.message);
        }
        return false;
      }
    }
    return true;
  }

  async showLargePreview(imageData, seed = null) {
    const preview = document.createElement('div');
    preview.style.position = 'fixed';
    preview.style.top = '0';
    preview.style.left = '0';
    preview.style.width = '100vw';
    preview.style.height = '100vh';
    preview.style.background = 'rgba(0,0,0,0.9)';
    preview.style.zIndex = '10020';
    preview.style.display = 'flex';
    preview.style.alignItems = 'center';
    preview.style.justifyContent = 'center';
    preview.style.flexDirection = 'column';
    preview.style.gap = '20px';
    
    // Create image container
    const imgContainer = document.createElement('div');
    imgContainer.innerHTML = `<img src="${imageData}" style="max-width:90vw;max-height:70vh;border-radius:8px;box-shadow:0 10px 30px rgba(0,0,0,0.5);" />`;
    preview.appendChild(imgContainer);
    
    // Check for violations if seed is provided
    if (seed) {
      try {
        const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
        if (projectData && projectData.rules && projectData.rules.length > 0) {
          const nft = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, seed);
          if (nft && nft.traits) {
            const violations = window.NFTApp.getModule('generateNfts').checkForRuleViolations(nft, projectData.rules);
            
            if (violations && violations.length > 0) {
              // Create violations display panel
              const violationsPanel = document.createElement('div');
              violationsPanel.style.background = 'rgba(231, 76, 60, 0.9)';
              violationsPanel.style.color = '#fff';
              violationsPanel.style.padding = '15px 25px';
              violationsPanel.style.borderRadius = '8px';
              violationsPanel.style.maxWidth = '80vw';
              violationsPanel.style.maxHeight = '20vh';
              violationsPanel.style.overflowY = 'auto';
              violationsPanel.style.fontFamily = 'Archivo, sans-serif';
              violationsPanel.style.fontSize = '14px';
              violationsPanel.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
              
              let violationsHTML = '<div style="font-weight: 600; margin-bottom: 10px; font-size: 16px;">⚠️ Rule Violations:</div>';
              violationsHTML += '<ul style="margin: 0; padding-left: 20px; list-style-type: disc;">';
              violations.forEach(violation => {
                violationsHTML += `<li style="margin: 5px 0;">${violation}</li>`;
              });
              violationsHTML += '</ul>';
              
              violationsPanel.innerHTML = violationsHTML;
              preview.appendChild(violationsPanel);
            }
          }
        }
      } catch (error) {
        console.error('[DEBUG] Error checking violations for preview:', error);
      }
    }
    
    document.body.appendChild(preview);
    
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        if (preview && preview.parentNode) {
          preview.remove();
        }
        document.removeEventListener('keydown', escHandler);
      }
    };
    
    preview.onclick = () => {
      if (preview && preview.parentNode) {
        preview.remove();
      }
      document.removeEventListener('keydown', escHandler);
    };
    
    document.addEventListener('keydown', escHandler);
  }

  setupUpdateNFTFunctionality() {
    console.log('[DEBUG] Setting up Update NFT functionality...');
    
    // Wait for the NFT to be displayed, then set up the update functionality
    setTimeout(() => {
      console.log('[DEBUG] Setting up monitoring after delay...');
      this.monitorTraitChanges();
      this.setupMutationObserver();
      this.setupCustomEventListeners();
      
      // Set up periodic monitoring to catch dynamically added elements
      this.setupPeriodicMonitoring();
    }, 500);
  }
  
  setupPeriodicMonitoring() {
    // Check every 2 seconds for new trait elements
    this.monitoringInterval = setInterval(() => {
      if (window.editingOriginalSeed) {
        console.log('[DEBUG] Periodic monitoring check...');
        // Find the current modal instance and monitor trait changes
        const modal = document.getElementById('saved-seeds-modal');
        if (modal && modal.savedSeedsModalInstance) {
          modal.savedSeedsModalInstance.monitorTraitChanges();
        } else {
          // Fallback: create a temporary instance to monitor
          const tempModal = new SavedSeedsModal();
          tempModal.monitorTraitChanges();
        }
      }
    }, 2000);
  }
  
  setupCustomEventListeners() {
    // Listen for custom events that indicate trait changes
    document.addEventListener('traitChanged', () => {
      console.log('[DEBUG] Trait changed event received');
      if (window.editingOriginalSeed) {
        console.log('[DEBUG] Currently editing, showing update button');
        // Find the current modal instance and show the button
        const modal = document.getElementById('saved-seeds-modal');
        if (modal && modal.savedSeedsModalInstance) {
          modal.savedSeedsModalInstance.showUpdateNFTButton();
        } else {
          // Fallback: create a temporary instance to show the button
          const tempModal = new SavedSeedsModal();
          tempModal.showUpdateNFTButton();
        }
      }
    });
    
    // Listen for when the trait selection modal is closed
    document.addEventListener('traitModalClosed', () => {
      console.log('[DEBUG] Trait modal closed event received');
      if (window.editingOriginalSeed) {
        console.log('[DEBUG] Currently editing, showing update button');
        // Find the current modal instance and show the button
        const modal = document.getElementById('saved-seeds-modal');
        if (modal && modal.savedSeedsModalInstance) {
          modal.savedSeedsModalInstance.showUpdateNFTButton();
        } else {
          // Fallback: create a temporary instance to show the button
          const tempModal = new SavedSeedsModal();
          tempModal.showUpdateNFTButton();
        }
      }
    });
  }
  
  setupMutationObserver() {
    // Watch for changes in the trait info panel to detect trait changes
    const traitInfoList = document.querySelector('.nft-trait-info-list');
    if (traitInfoList) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList' || mutation.type === 'attributes') {
            console.log('[DEBUG] Trait info panel changed, showing update button');
            if (window.editingOriginalSeed) {
              // Find the current modal instance and show the button
              const modal = document.getElementById('saved-seeds-modal');
              if (modal && modal.savedSeedsModalInstance) {
                modal.savedSeedsModalInstance.showUpdateNFTButton();
              } else {
                // Fallback: create a temporary instance to show the button
                const tempModal = new SavedSeedsModal();
                tempModal.showUpdateNFTButton();
              }
            }
          }
        });
      });
      
      observer.observe(traitInfoList, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'data-index']
      });
      
      // Store observer for cleanup
      this.traitObserver = observer;
    }
  }

  monitorTraitChanges() {
    console.log('[DEBUG] Setting up trait change monitoring...');
    
    // Monitor for trait edit button clicks (main way to change traits)
    const traitEditButtons = document.querySelectorAll('.nft-trait-edit-btn');
    console.log('[DEBUG] Found trait edit buttons:', traitEditButtons.length);
    
    traitEditButtons.forEach(button => {
      // Remove any existing listeners to prevent duplicates
      button.removeEventListener('click', this.traitEditClickHandler);
      this.traitEditClickHandler = () => {
        console.log('[DEBUG] Trait edit button clicked');
        // Show the Update NFT button when traits are changed
        this.showUpdateNFTButton();
      };
      button.addEventListener('click', this.traitEditClickHandler);
    });
    
    // Monitor for trait selection modal changes
    const traitSelectionThumbs = document.querySelectorAll('.trait-selection-thumb');
    console.log('[DEBUG] Found trait selection thumbs:', traitSelectionThumbs.length);
    
    traitSelectionThumbs.forEach(thumb => {
      // Remove any existing listeners to prevent duplicates
      thumb.removeEventListener('click', this.traitSelectionClickHandler);
      this.traitSelectionClickHandler = () => {
        console.log('[DEBUG] Trait selection thumb clicked');
        this.showUpdateNFTButton();
      };
      thumb.addEventListener('click', this.traitSelectionClickHandler);
    });
    
    // Also monitor for any trait info items (fallback)
    const traitInfoItems = document.querySelectorAll('.nft-trait-info-item');
    console.log('[DEBUG] Found trait info items:', traitInfoItems.length);
    
    traitInfoItems.forEach(item => {
      // Remove any existing listeners to prevent duplicates
      item.removeEventListener('click', this.traitInfoClickHandler);
      this.traitInfoClickHandler = () => {
        console.log('[DEBUG] Trait info item clicked');
        this.showUpdateNFTButton();
      };
      item.addEventListener('click', this.traitInfoClickHandler);
    });
    
    // Monitor for any changes in the trait selection modal
    const traitSelectionButtons = document.querySelectorAll('.trait-selection-btn');
    console.log('[DEBUG] Found trait selection buttons:', traitSelectionButtons.length);
    
    traitSelectionButtons.forEach(button => {
      // Remove any existing listeners to prevent duplicates
      button.removeEventListener('click', this.traitSelectionButtonClickHandler);
      this.traitSelectionButtonClickHandler = () => {
        console.log('[DEBUG] Trait selection button clicked');
        this.showUpdateNFTButton();
      };
      button.addEventListener('click', this.traitSelectionButtonClickHandler);
    });
  }

  showUpdateNFTButton() {
    console.log('[DEBUG] showUpdateNFTButton called - using existing showSaveNftOverlay system');
    console.log('[DEBUG] Current editing state:', {
      editingOriginalSeed: window.editingOriginalSeed,
      editingSeedIndex: window.editingSeedIndex
    });
    
    // Check if we're currently editing
    if (!window.editingOriginalSeed) {
      console.log('[DEBUG] Not currently editing, not showing button');
      return;
    }
    
    // Use the existing showSaveNftOverlay system instead of creating a new button
    const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
    if (generateNftsUIModule && generateNftsUIModule.showSaveNftOverlay) {
      console.log('[DEBUG] Using existing showSaveNftOverlay system');
      generateNftsUIModule.showSaveNftOverlay(() => {
        console.log('[DEBUG] Update NFT button clicked via existing system');
        console.log('[DEBUG] About to call updateNFTFromEdit with state:', {
          editingOriginalSeed: window.editingOriginalSeed,
          editingSeedIndex: window.editingSeedIndex
        });
        SavedSeedsModal.updateNFTFromEdit();
      });
    } else {
      console.log('[DEBUG] showSaveNftOverlay not available, falling back to custom button');
      this.createCustomUpdateButton();
    }
  }
  
  createCustomUpdateButton() {
    console.log('[DEBUG] Creating custom Update NFT button...');
    
    // Find or create the Update NFT button
    let updateBtn = document.getElementById('update-nft-from-edit');
    console.log('[DEBUG] Existing button found:', !!updateBtn);
    
    if (!updateBtn) {
      console.log('[DEBUG] Creating new Update NFT button...');
      updateBtn = document.createElement('button');
      updateBtn.id = 'update-nft-from-edit';
      updateBtn.textContent = 'Update NFT';
      updateBtn.className = 'update-nft-btn';
      updateBtn.style.cssText = `
        background: #6c5ce7 !important;
        color: white !important;
        border: none !important;
        border-radius: 8px !important;
        padding: 8px 16px !important;
        font-size: 14px !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        margin-top: 10px !important;
        font-family: 'Archivo', sans-serif !important;
        transition: all 0.2s ease !important;
        z-index: 9999 !important;
        position: relative !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        width: auto !important;
        height: auto !important;
        min-width: 120px !important;
        min-height: 40px !important;
      `;
      
      // Add hover effect
      updateBtn.addEventListener('mouseenter', () => {
        updateBtn.style.background = '#5b4dc7';
      });
      
      updateBtn.addEventListener('mouseleave', () => {
        updateBtn.style.background = '#6c5ce7';
      });
      
      // Add click handler
      updateBtn.addEventListener('click', () => {
        SavedSeedsModal.updateNFTFromEdit();
      });
      
      // Find the preview panel and add the button
      const previewPanel = document.querySelector('.nft-preview-panel');
      console.log('[DEBUG] Preview panel found:', !!previewPanel);
      
      if (previewPanel) {
        console.log('[DEBUG] Adding button to preview panel...');
        previewPanel.appendChild(updateBtn);
        console.log('[DEBUG] Button added to preview panel successfully');
      } else {
        console.log('[DEBUG] No preview panel found, trying other locations...');
        
        // Try different possible locations
        const nftPreview = document.querySelector('.nft-preview');
        const mainContent = document.querySelector('.main-content');
        const appContainer = document.querySelector('.app-container');
        
        if (nftPreview) {
          console.log('[DEBUG] Adding button to nft-preview...');
          nftPreview.appendChild(updateBtn);
        } else if (mainContent) {
          console.log('[DEBUG] Adding button to main-content...');
          mainContent.appendChild(updateBtn);
        } else if (appContainer) {
          console.log('[DEBUG] Adding button to app-container...');
          appContainer.appendChild(updateBtn);
        } else {
          console.log('[DEBUG] Adding button to body...');
          document.body.appendChild(updateBtn);
        }
      }
    }
    
    updateBtn.style.display = 'block';
    console.log('[DEBUG] Button display set to block, button visible:', updateBtn.offsetParent !== null);
  }

  async refreshUpdatedSeeds() {
    console.log('[DEBUG] Refreshing updated seeds in modal display...');
    
    // Check if there are any updated seeds that need refreshing
    if (window.editingSeedIndex !== undefined && window.editingOriginalSeed) {
      console.log('[DEBUG] Found updated seed at index:', window.editingSeedIndex);
      
      // Get the current seed list to find the updated seed
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject || null;
      const seedListKey = 'nftSeedList_' + (projectData && projectData.name ? encodeURIComponent(projectData.name) : 'default');
      let currentSeedList = [];
      try {
        currentSeedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      } catch (parseError) {
        console.error('[DEBUG] Error parsing seed list:', parseError);
        currentSeedList = [];
      }
      
      if (window.editingSeedIndex < currentSeedList.length) {
        const updatedSeed = currentSeedList[window.editingSeedIndex];
        console.log('[DEBUG] Refreshing seed:', updatedSeed.seed);
        
        // Update the modal display for this seed
        SavedSeedsModal.updateModalDisplay(window.editingSeedIndex, updatedSeed);
        
        // Also refresh rule violation overlays for all cards
        if (this.modal) {
          await this.refreshRuleViolationOverlays();
        }
      }
    }
  }

  // Static method to show update button when traits are changed
  static showUpdateButtonForEdit() {
    console.log('[DEBUG] Static showUpdateButtonForEdit called');
    if (window.editingOriginalSeed) {
      console.log('[DEBUG] Currently editing, showing update button');
      // Find the current modal instance and show the button
      const modal = document.getElementById('saved-seeds-modal');
      if (modal && modal.savedSeedsModalInstance) {
        modal.savedSeedsModalInstance.showUpdateNFTButton();
      } else {
        // Fallback: create a temporary instance to show the button
        const tempModal = new SavedSeedsModal();
        tempModal.showUpdateNFTButton();
      }
    }
  }

  static updateModalDisplay(seedIndex, newNft) {
    console.log('[DEBUG] Updating modal display for seed at index:', seedIndex);
    
    // Check if the modal is still open
    const modal = document.getElementById('saved-seeds-modal');
    if (!modal) {
      console.log('[DEBUG] Modal is closed, no need to update display');
      return;
    }
    
    // Find the NFT card at the specified index
    const grid = modal.querySelector('#saved-seeds-grid');
    if (!grid) {
      console.log('[DEBUG] Grid not found in modal');
      return;
    }
    
    const cards = grid.querySelectorAll('.seed-card');
    if (seedIndex >= cards.length) {
      console.log('[DEBUG] Seed index out of bounds for modal update');
      return;
    }
    
    const card = cards[seedIndex];
    if (!card) {
      console.log('[DEBUG] Card not found at index:', seedIndex);
      return;
    }
    
    // Update the seed number display
    const seedNumber = card.querySelector('.seed-card-number');
    if (seedNumber) {
      seedNumber.textContent = newNft.seed;
      console.log('[DEBUG] Updated seed number in modal to:', newNft.seed);
    }
    
    // CRITICAL FIX: Update the card's data-seed attribute to match the new seed
    card.dataset.seed = newNft.seed;
    console.log('[DEBUG] Updated card data-seed attribute to:', newNft.seed);
    
    // Update the thumbnail
    const thumbnail = card.querySelector('.seed-card-thumbnail');
    if (thumbnail && newNft.imageData) {
      thumbnail.innerHTML = `<img src="${newNft.imageData}" alt="NFT Preview" />`;
      console.log('[DEBUG] Updated thumbnail in modal');
    }
    
    // Update the image cache (we'll store it globally for static access)
    if (!window.savedSeedsImageCache) {
      window.savedSeedsImageCache = {};
    }
    window.savedSeedsImageCache[newNft.seed] = newNft.imageData;
    
    console.log('[DEBUG] Modal display updated successfully');
  }

  static async updateSeedWithNewNft(newNft) {
    console.log('[DEBUG] ===== UPDATE SEED WITH NEW NFT =====');
    console.log('[DEBUG] New NFT details:', {
      seed: newNft.seed,
      hasImageData: !!newNft.imageData,
      traitsCount: newNft.traits ? newNft.traits.length : 0
    });
    
    // Update the seed list directly from localStorage since modal might be closed
    if (window.editingSeedIndex !== undefined) {
      console.log('[DEBUG] ✅ Updating seed at index:', window.editingSeedIndex);
      
      // Get the current seed list from localStorage
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject || null;
      const seedListKey = 'nftSeedList_' + (projectData && projectData.name ? encodeURIComponent(projectData.name) : 'default');
      let currentSeedList = [];
      try {
        currentSeedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      } catch (parseError) {
        console.error('[DEBUG] Error parsing seed list:', parseError);
        currentSeedList = [];
      }
      
      console.log('[DEBUG] Seed list details:', {
        seedListKey: seedListKey,
        currentSeedListLength: currentSeedList.length,
        originalSeedAtIndex: currentSeedList[window.editingSeedIndex]?.seed,
        newSeed: newNft.seed
      });
      
      if (window.editingSeedIndex < currentSeedList.length) {
        // Get the original seed before updating
        const originalSeed = currentSeedList[window.editingSeedIndex].seed;
        
        // Update the seed in the same position
        currentSeedList[window.editingSeedIndex].seed = newNft.seed;

        // IMPORTANT: Clear any existing rarity rank for the NEW seed position so UI shows '---' until recalculated
        try {
          const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
          const projectName = this.getProjectName();
          const rarityKey = `rarityRanks_${projectName}`;
          // In-memory project data
          if (projectData && projectData.rarityRanks) {
            if (Array.isArray(projectData.rarityRanks)) {
              projectData.rarityRanks[window.editingSeedIndex] = undefined;
            } else {
              delete projectData.rarityRanks[newNft.seed];
            }
          }
          // Local in-session ranks cache
          if (this.rarityRanks) {
            delete this.rarityRanks[newNft.seed];
          }
          // Persisted localStorage (both object and array formats)
          const stored = localStorage.getItem(rarityKey);
          if (stored) {
            try {
              const parsed = JSON.parse(stored);
              if (Array.isArray(parsed)) {
                parsed[window.editingSeedIndex] = undefined;
              } else if (parsed && typeof parsed === 'object') {
                delete parsed[newNft.seed];
              }
              localStorage.setItem(rarityKey, JSON.stringify(parsed));
            } catch (e) {
              console.warn('[DEBUG] Could not clear stored rarity rank for new seed:', e);
            }
          }
        } catch (e) {
          console.warn('[DEBUG] Error clearing rarity rank for new seed:', e);
        }
        
        // Update the traits with the edited traits
        if (newNft.traits && newNft.traits.length > 0) {
          currentSeedList[window.editingSeedIndex].traits = JSON.parse(JSON.stringify(newNft.traits));
          console.log('[DEBUG] ✅ Updated traits for seed:', newNft.traits.length, 'traits');
          
          // Clear the image cache for BOTH original and new seeds to force regeneration
          if (window.savedSeedsImageCache) {
            if (originalSeed && window.savedSeedsImageCache[originalSeed]) {
              delete window.savedSeedsImageCache[originalSeed];
              console.log('[DEBUG] ✅ Cleared image cache for original seed:', originalSeed.substring(0, 50) + '...');
            }
            if (newNft.seed && window.savedSeedsImageCache[newNft.seed]) {
              delete window.savedSeedsImageCache[newNft.seed];
              console.log('[DEBUG] ✅ Cleared image cache for new seed:', newNft.seed.substring(0, 50) + '...');
            }
          }
        }
        
        // Also update the imageData if available
        if (newNft.imageData) {
          currentSeedList[window.editingSeedIndex].imageData = newNft.imageData;
          currentSeedList[window.editingSeedIndex].thumbnail = newNft.imageData;
        }
        
        // Check localStorage usage before saving
        const storageUsage = SavedSeedsModal.getLocalStorageUsage();
        console.log('[DEBUG] localStorage usage:', storageUsage);
        
        // Mark rarity ranks as outdated since NFT was edited
        const outdatedKey = 'rarityRanksOutdated_' + encodeURIComponent(projectData.name);
        localStorage.setItem(outdatedKey, 'true');
        console.log('[DEBUG] Marked rarity ranks as outdated due to NFT edit');
        
        // CRITICAL: Use MemoryManager to update NFT in collection
        if (window.MemoryManager) {
          try {
            console.log('[DEBUG] Using MemoryManager to update NFT...');
            await window.MemoryManager.updateNftInCollection(originalSeed, {
              seed: newNft.seed,
              traits: newNft.traits || [],
              rarity: newNft.rarity || 'common',
              rarityScore: newNft.rarityScore || 0,
              timestamp: Date.now()
            });
            console.log('[DEBUG] ✅ NFT updated via MemoryManager');
          } catch (memoryError) {
            console.error('[DEBUG] ❌ MemoryManager update failed:', memoryError);
            
            // Fallback to direct updates if MemoryManager fails
            if (projectData && projectData.savedSeeds) {
              const projectSeedIndex = projectData.savedSeeds.findIndex(seed => seed.seed === originalSeed);
              if (projectSeedIndex !== -1) {
                projectData.savedSeeds[projectSeedIndex] = {
                  seed: newNft.seed,
                  traits: newNft.traits || [],
                  rarity: newNft.rarity || 'common',
                  rarityScore: newNft.rarityScore || 0,
                  timestamp: Date.now()
                };
                console.log('[DEBUG] ✅ Fallback: Updated NFT in project data at index:', projectSeedIndex);
              }
            }
            
            if (window.currentProject && window.currentProject.savedSeeds) {
              const currentProjectSeedIndex = window.currentProject.savedSeeds.findIndex(seed => seed.seed === originalSeed);
              if (currentProjectSeedIndex !== -1) {
                window.currentProject.savedSeeds[currentProjectSeedIndex] = {
                  seed: newNft.seed,
                  traits: newNft.traits || [],
                  rarity: newNft.rarity || 'common',
                  rarityScore: newNft.rarityScore || 0,
                  timestamp: Date.now()
                };
                console.log('[DEBUG] ✅ Fallback: Updated NFT in window.currentProject at index:', currentProjectSeedIndex);
              }
            }
          }
        } else {
          console.warn('[DEBUG] MemoryManager not available, using direct updates');
          
          // Fallback to direct updates if MemoryManager is not available
          if (projectData && projectData.savedSeeds) {
            const projectSeedIndex = projectData.savedSeeds.findIndex(seed => seed.seed === originalSeed);
            if (projectSeedIndex !== -1) {
              projectData.savedSeeds[projectSeedIndex] = {
                seed: newNft.seed,
                traits: newNft.traits || [],
                rarity: newNft.rarity || 'common',
                rarityScore: newNft.rarityScore || 0,
                timestamp: Date.now()
              };
              console.log('[DEBUG] ✅ Updated NFT in project data at index:', projectSeedIndex);
            }
          }
          
          if (window.currentProject && window.currentProject.savedSeeds) {
            const currentProjectSeedIndex = window.currentProject.savedSeeds.findIndex(seed => seed.seed === originalSeed);
            if (currentProjectSeedIndex !== -1) {
              window.currentProject.savedSeeds[currentProjectSeedIndex] = {
                seed: newNft.seed,
                traits: newNft.traits || [],
                rarity: newNft.rarity || 'common',
                rarityScore: newNft.rarityScore || 0,
                timestamp: Date.now()
              };
              console.log('[DEBUG] ✅ Updated NFT in window.currentProject at index:', currentProjectSeedIndex);
            }
          }
        }
        
        // Save the updated seed list to localStorage with error handling
        try {
          // Use MemoryManager's safe localStorage method if available
          if (window.safeLocalStorageSetItem) {
            const success = window.safeLocalStorageSetItem(seedListKey, JSON.stringify(currentSeedList));
            if (success) {
              console.log('[DEBUG] ✅ Seed list saved successfully via MemoryManager');
            } else {
              console.log('[DEBUG] ⚠️ Seed list saved via fallback localStorage method');
            }
          } else {
            // Fallback to direct localStorage
            localStorage.setItem(seedListKey, JSON.stringify(currentSeedList));
            console.log('[DEBUG] ✅ Seed list saved successfully to localStorage');
          }
          
          // Show success notification
          if (window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              'NFT updated successfully!',
              'success',
              3000
            );
          }
        } catch (error) {
          if (error.name === 'QuotaExceededError') {
            console.log('[DEBUG] ⚠️ localStorage quota exceeded, trying optimized storage...');
            
            // Try saving without imageData to reduce size
            const optimizedSeedList = SavedSeedsModal.optimizeSeedListForStorage(currentSeedList, false);
            
            try {
              localStorage.setItem(seedListKey, JSON.stringify(optimizedSeedList));
              console.log('[DEBUG] ✅ Optimized seed list saved (without imageData)');
              
              // Show warning to user
              if (window.NFTApp.getModule('notificationService')) {
                window.NFTApp.getModule('notificationService').show(
                  `Seed updated successfully! Note: Image data was removed to save storage space. (Used: ${storageUsage.usedMB}MB)`,
                  'warning',
                  5000
                );
              } else {
                alert(`Seed updated successfully! Note: Image data was removed to save storage space. (Used: ${storageUsage.usedMB}MB)`);
              }
            } catch (secondError) {
              console.error('[DEBUG] ❌ Failed to save even optimized seed list:', secondError);
              
              // Last resort: try to save just the essential data
              const minimalSeedList = currentSeedList.map(seed => ({
                seed: seed.seed
              }));
              
              try {
                localStorage.setItem(seedListKey, JSON.stringify(minimalSeedList));
                console.log('[DEBUG] ✅ Minimal seed list saved (seed only)');
                
                if (window.NFTApp.getModule('notificationService')) {
                  window.NFTApp.getModule('notificationService').show(
                    `Seed updated successfully! Note: Only seed numbers were saved due to storage limitations. (Used: ${storageUsage.usedMB}MB)`,
                    'warning',
                    5000
                  );
                } else {
                  alert(`Seed updated successfully! Note: Only seed numbers were saved due to storage limitations. (Used: ${storageUsage.usedMB}MB)`);
                }
              } catch (finalError) {
                console.error('[DEBUG] ❌ Complete storage failure:', finalError);
                
                // Provide helpful error message with storage info
                const errorMessage = `Failed to save seed update due to storage limitations.\n\n` +
                  `Storage Usage: ${storageUsage.usedMB}MB used, ${storageUsage.availableMB}MB available\n\n` +
                  `Please try:\n` +
                  `1. Clear some saved seeds\n` +
                  `2. Use a different browser\n` +
                  `3. Export your seeds and start fresh`;
                
                alert(errorMessage);
                return;
              }
            }
          } else {
            console.error('[DEBUG] ❌ Other localStorage error:', error);
            alert('Failed to save seed update: ' + error.message);
            return;
          }
        }
        
        console.log('[DEBUG] Seed list updated in localStorage, new seed at index', window.editingSeedIndex, ':', currentSeedList[window.editingSeedIndex].seed);
        
        // Verify the data was saved correctly
        let verifyData = [];
        try {
          verifyData = JSON.parse(localStorage.getItem(seedListKey) || '[]');
          console.log('[DEBUG] Verification - saved data length:', verifyData.length);
          console.log('[DEBUG] Verification - seed at index', window.editingSeedIndex, ':', verifyData[window.editingSeedIndex]?.seed);
        } catch (parseError) {
          console.error('[DEBUG] Error verifying saved data:', parseError);
        }
        
        // Verify the update was successful
        if (currentSeedList[window.editingSeedIndex].seed === newNft.seed) {
          console.log('[DEBUG] ✅ Seed update successful - position maintained');
        } else {
          console.log('[DEBUG] ❌ Seed update failed - position may have changed');
        }
        
        // Update the project data to ensure it's saved with the project
        if (projectData && projectData.savedSeeds) {
          // Find the corresponding NFT in the project's savedSeeds and update it
          const projectSeedIndex = projectData.savedSeeds.findIndex(seed => seed.seed === originalSeed);
          if (projectSeedIndex !== -1) {
            projectData.savedSeeds[projectSeedIndex] = {
              seed: newNft.seed,
              traits: newNft.traits || [],
              rarity: newNft.rarity,
              rarityScore: newNft.rarityScore || 0,
              timestamp: Date.now()
            };
            console.log('[DEBUG] ✅ Updated NFT in project data at index:', projectSeedIndex);

            // CRITICAL: Also update window.currentProject to ensure project saving works
            if (window.currentProject && window.currentProject.savedSeeds) {
              const currentProjectSeedIndex = window.currentProject.savedSeeds.findIndex(seed => seed.seed === originalSeed);
              if (currentProjectSeedIndex !== -1) {
                window.currentProject.savedSeeds[currentProjectSeedIndex] = {
                  seed: newNft.seed,
                  traits: newNft.traits || [],
                  rarity: newNft.rarity,
                  rarityScore: newNft.rarityScore || 0,
                  timestamp: Date.now()
                };
                console.log('[DEBUG] ✅ Updated NFT in window.currentProject at index:', currentProjectSeedIndex);
              } else {
                console.warn('[DEBUG] Could not find NFT in window.currentProject to update');
              }
            } else {
              console.warn('[DEBUG] window.currentProject or savedSeeds not available');
            }
          } else {
            console.warn('[DEBUG] Could not find NFT in project data to update');
          }
        } else {
          console.warn('[DEBUG] Project data or savedSeeds not available for updating');
        }

        // CRITICAL: Force update both project data references to be identical
        if (window.currentProject && projectData) {
          window.currentProject.savedSeeds = [...projectData.savedSeeds];
          console.log('[DEBUG] ✅ Synchronized window.currentProject.savedSeeds with projectData.savedSeeds');
        }
        
        // Update the seed list counter using the existing system
        const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
        if (generateNftsUIModule && generateNftsUIModule.refreshSeedListCounter) {
          generateNftsUIModule.refreshSeedListCounter();
        }
        
        console.log('[DEBUG] Seed updated in list:', newNft.seed);
        
        // Update the modal display if it's still open
        SavedSeedsModal.updateModalDisplay(window.editingSeedIndex, newNft);
        
        // Show success message
        if (window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'NFT updated successfully! The seed has been updated in the saved seeds list.',
            'success',
            3000
          );
        } else {
          alert('NFT updated successfully! The seed has been updated in the saved seeds list.');
        }
      } else {
        console.log('[DEBUG] ❌ Index out of bounds - editingSeedIndex:', window.editingSeedIndex, 'seedList length:', currentSeedList.length);
      }
    } else {
      console.log('[DEBUG] Cannot update seed - editingSeedIndex:', window.editingSeedIndex);
    }
  }

  static async updateNFTFromEdit() {
    try {
      console.log('[DEBUG] ===== UPDATE NFT FROM EDIT STARTED =====');
      
      // Show "Please Wait..." popup immediately to prevent user interaction during heavy operations
      this.showPleaseWaitPopup();
      
      console.log('[DEBUG] Current editing state:', {
        editingOriginalSeed: window.editingOriginalSeed,
        editingSeedIndex: window.editingSeedIndex
      });
      
      // Get the current NFT (with any trait changes)
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      const projectData = window.NFTApp.getModule('generateNftsUI').projectData;
      
      console.log('[DEBUG] Modules available:', {
        generateNftsModule: !!generateNftsModule,
        projectData: !!projectData
      });
      
      if (!generateNftsModule || !projectData) {
        console.log('[DEBUG] ❌ Modules not available');
        
        // Hide the "Please Wait..." popup on error
        this.hidePleaseWaitPopup();
        console.log('[DEBUG] Please Wait popup hidden - modules not available');
        
        alert('Unable to update NFT - modules not available');
        return;
      }
      
      // Get the current NFT that's being displayed (with updated traits)
      const currentNft = window.lastGeneratedNFT;
      
      if (!currentNft || !currentNft.seed) {
        console.log('[DEBUG] No current NFT available, generating new one');
        // Fallback: generate new NFT with current traits
        const newNft = await generateNftsModule.generateSingleNFT(projectData, true);
        
        if (!newNft || !newNft.seed) {
          // Hide the "Please Wait..." popup on error
          this.hidePleaseWaitPopup();
          console.log('[DEBUG] Please Wait popup hidden - failed to generate NFT');
          
          alert('Failed to generate updated NFT');
          return;
        }
        
        console.log('[DEBUG] New NFT generated with seed:', newNft.seed);
        await this.updateSeedWithNewNft(newNft);
        
        // Hide the "Please Wait..." popup after successful generation and update
        this.hidePleaseWaitPopup();
        console.log('[DEBUG] Please Wait popup hidden after NFT generation and update');
        
        return;
      }
      
      console.log('[DEBUG] Using current NFT with seed:', currentNft.seed);
      console.log('[DEBUG] Current NFT traits:', currentNft.traits);
      
      // Use the current NFT (which already has the updated traits)
      await this.updateSeedWithNewNft(currentNft);
      
      // Hide the Update NFT button using existing system
      const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
      if (generateNftsUIModule && generateNftsUIModule.removeSaveNftOverlay) {
        generateNftsUIModule.removeSaveNftOverlay();
      }
      
      // Also hide custom button if it exists
      const updateBtn = document.getElementById('update-nft-from-edit');
      if (updateBtn) {
        updateBtn.style.display = 'none';
      }
      
      // Clear the editing state
      window.editingOriginalSeed = null;
      window.editingSeedIndex = null;
      
      // Clean up monitoring
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval);
        this.monitoringInterval = null;
      }
      
      if (this.traitObserver) {
        this.traitObserver.disconnect();
        this.traitObserver = null;
      }
      
      // Hide the "Please Wait..." popup now that the operation is complete
      this.hidePleaseWaitPopup();
      console.log('[DEBUG] Please Wait popup hidden after successful NFT update');
      
    } catch (error) {
      console.error('[DEBUG] Error updating NFT:', error);
      
      // Hide the "Please Wait..." popup on error
      this.hidePleaseWaitPopup();
      console.log('[DEBUG] Please Wait popup hidden after error');
      
      alert('Error updating NFT: ' + error.message);
    }
  }

  formatNumberWithCommas(number) {
    // Helper function to format numbers with commas
    if (typeof number !== 'number' || isNaN(number)) {
      return number;
    }
    return number.toLocaleString();
  }

  getTotalSupply(projectData) {
    // Helper function to get total supply - check input field first, then projectData
    try {
      // Always use the latest value from the input field if present (most current value)
      const totalSupplyInput = document.getElementById('total-supply');
      if (totalSupplyInput && totalSupplyInput.value) {
        // Remove commas, dots, and other formatting characters before parsing
        const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
        const parsed = parseInt(cleanValue, 10);
        if (parsed && parsed > 0) {
          return parsed;
        }
      }
      
      // Fallback to project data
      if (projectData && projectData.totalSupply) {
        const parsed = parseInt(projectData.totalSupply, 10);
        if (parsed && parsed > 0) {
          return parsed;
        }
      }
      
      // Also check for 'size' property (legacy support)
      if (projectData && projectData.size) {
        const parsed = parseInt(projectData.size, 10);
        if (parsed && parsed > 0) {
          return parsed;
        }
      }
      
      // Default fallback (shouldn't happen in normal use)
      // CRITICAL: Return 1 instead of 10000 to prevent counter from showing "10000 / 10000" with green background
      console.warn('[DEBUG] getTotalSupply: No valid total supply found, using default 1');
      return 1;
    } catch (error) {
      console.error('[DEBUG] Error in getTotalSupply:', error);
      // CRITICAL: Return 1 instead of 10000 to prevent counter from showing "10000 / 10000" with green background
      return 1;
    }
  }

  setSeedListCounterColor(counter, current, total) {
    // Helper function to set counter color
    try {
      if (current >= total) {
        counter.style.color = '#e74c3c';
      } else if (current >= total * 0.8) {
        counter.style.color = '#f39c12';
      } else {
        counter.style.color = '#27ae60';
      }
    } catch (error) {
      console.error('Error setting counter color:', error);
    }
  }

  close() {
    // Hide loading popup if it's still showing
    this.hideLoadingPopup();
    
    // Stop memory cleanup
    this.stopMemoryCleanup();
    
    // Clear all caches to free memory
    this.imageCache = {};
    this.violationsCache.clear();
    this.rarityRanks = {};
    
    // Clear empty positions, original search results, and corrected NFTs when modal is closed
    this.emptyPositions.clear();
    this.originalSearchResults = [];
    this.correctedNFTs.clear();
    
    // Reset all filtering states when modal closes
    this.isFilteringViolations = false;
    this.isFilteringByRarity = false;
    this.isFilteringByTrait = false;
    this.isFilteringByPosition = false;
    this.filteredSeedList = [];
    this.traitSearchTerm = null;
    this.isInConflictView = false;
    
    console.log('[DEBUG] Cleared empty positions, original search results, and corrected NFTs when modal closed');
    console.log('[DEBUG] Reset all filtering states on modal close');
    
    // CRITICAL FIX: Preserve seedList and seedListKey when closing modal to ensure data persists
    console.log('[DEBUG] Modal closing - preserving seedList (length:', this.seedList.length, '), seedListKey:', this.seedListKey);
    
    // Clear global cache if it's too large
    if (window.savedSeedsImageCache && Object.keys(window.savedSeedsImageCache).length > 200) {
      window.savedSeedsImageCache = {};
      console.log('[DEBUG] Cleared global image cache on modal close');
    }
    
    if (this.modal) {
      this.modal.remove();
      this.modal = null;
    }
    
    // Reset rarity calculation flags for next session
    this.rarityCalculationInProgress = false;
    this.rarityCalculationComplete = false;
    
    // Clean up the mutation observer
    if (this.traitObserver) {
      this.traitObserver.disconnect();
      this.traitObserver = null;
    }
    
    // Clean up the monitoring interval
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    console.log('[Saved Seeds Modal] Modal closed and memory cleaned up (seedList preserved with', this.seedList.length, 'items)');
  }

  // Apply rule fixes to an NFT to resolve stacking order violations
  applyRuleFixes(nft, projectData) {
    try {
      console.log('[DEBUG] Starting to apply rule fixes to NFT...');
      
      if (!nft || !nft.traits || !projectData || !projectData.rules) {
        console.log('[DEBUG] Missing required data for rule fixes');
        return nft;
      }

      console.log(`[DEBUG] Original NFT traits order: ${nft.traits.map(t => t.layer.name).join(' -> ')}`);

      // Create a copy of the NFT to modify
      const fixedNFT = JSON.parse(JSON.stringify(nft));
      
      // Get all violations for this NFT
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule) {
        console.log('[DEBUG] GenerateNfts module not available');
        return nft;
      }
      
      const violations = generateNftsModule.checkForRuleViolations(fixedNFT, projectData.rules);
      
      // Filter only trait ordering violations
      const orderingViolations = violations.filter(v => 
        v.includes('must be rendered above') || 
        v.includes('must be rendered below') ||
        v.includes('must be rendered immediately above') ||
        v.includes('must be rendered immediately below')
      );
      
      console.log(`[DEBUG] Found ${orderingViolations.length} trait ordering violations to fix`);
      
      if (orderingViolations.length === 0) {
        console.log('[DEBUG] No trait ordering violations to fix');
        return fixedNFT;
      }
      
      // Apply fixes for each ordering violation
      let fixAttempts = 0;
      const maxFixAttempts = 10;
      
      while (orderingViolations.length > 0 && fixAttempts < maxFixAttempts) {
        let fixed = false;
        
      for (const violation of [...orderingViolations]) {
        console.log(`[DEBUG] Attempting to fix violation: ${violation}`);

        // Handle "immediately above" violations (layer to layer)
        let match = violation.match(/Layer "(.+?)" must be rendered immediately above "(.+?)"/);
        if (match) {
          const aboveName = match[1];
          const belowName = match[2];
          const aboveIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === aboveName);
          const belowIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === belowName);

          if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx !== belowIdx + 1) {
            const [aboveTrait] = fixedNFT.traits.splice(aboveIdx, 1);
            fixedNFT.traits.splice(belowIdx + 1, 0, aboveTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed immediately above rule: moved '${aboveName}' above '${belowName}'`);
          }
          continue;
        }

        // Handle "immediately below" violations (layer to layer)
        match = violation.match(/Layer "(.+?)" must be rendered immediately below "(.+?)"/);
        if (match) {
          const belowName = match[1];
          const aboveName = match[2];
          const belowIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === belowName);
          const aboveIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === aboveName);

          if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx !== aboveIdx + 1) {
            const [belowTrait] = fixedNFT.traits.splice(belowIdx, 1);
            fixedNFT.traits.splice(aboveIdx + 1, 0, belowTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed immediately below rule: moved '${belowName}' below '${aboveName}'`);
          }
          continue;
        }

        // Handle "above" violations (layer to layer)
        match = violation.match(/Layer "(.+?)" must be rendered above "(.+?)"/);
        if (match) {
          const aboveName = match[1];
          const belowName = match[2];
          const aboveIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === aboveName);
          const belowIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === belowName);

          if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx >= belowIdx) {
            const [aboveTrait] = fixedNFT.traits.splice(aboveIdx, 1);
            fixedNFT.traits.splice(belowIdx, 0, aboveTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed above rule: moved '${aboveName}' above '${belowName}'`);
          }
          continue;
        }

        // Handle "below" violations (layer to layer)
        match = violation.match(/Layer "(.+?)" must be rendered below "(.+?)"/);
        if (match) {
          const belowName = match[1];
          const aboveName = match[2];
          const belowIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === belowName);
          const aboveIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === aboveName);

          if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx <= aboveIdx) {
            const [belowTrait] = fixedNFT.traits.splice(belowIdx, 1);
            fixedNFT.traits.splice(aboveIdx + 1, 0, belowTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed below rule: moved '${belowName}' below '${aboveName}'`);
          }
          continue;
        }

        // Handle "above" violations (trait to trait)
        match = violation.match(/Trait "(.+?)" must be rendered above "(.+?)"/);
        if (match) {
          const aboveTraitName = match[1];
          const belowTraitName = match[2];
          const aboveIdx = fixedNFT.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);
          const belowIdx = fixedNFT.traits.findIndex(t => t.trait && t.trait.name === belowTraitName);

          if (aboveIdx !== -1 && belowIdx !== -1 && aboveIdx >= belowIdx) {
            const [aboveTrait] = fixedNFT.traits.splice(aboveIdx, 1);
            fixedNFT.traits.splice(belowIdx, 0, aboveTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed trait above rule: moved '${aboveTraitName}' above '${belowTraitName}'`);
          }
          continue;
        }

        // Handle "below" violations (trait to trait)
        match = violation.match(/Trait "(.+?)" must be rendered below "(.+?)"/);
        if (match) {
          const belowTraitName = match[1];
          const aboveTraitName = match[2];
          const belowIdx = fixedNFT.traits.findIndex(t => t.trait && t.trait.name === belowTraitName);
          const aboveIdx = fixedNFT.traits.findIndex(t => t.trait && t.trait.name === aboveTraitName);

          if (belowIdx !== -1 && aboveIdx !== -1 && belowIdx <= aboveIdx) {
            const [belowTrait] = fixedNFT.traits.splice(belowIdx, 1);
            fixedNFT.traits.splice(aboveIdx + 1, 0, belowTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed trait below rule: moved '${belowTraitName}' below '${aboveTraitName}'`);
          }
          continue;
        }

        // Handle "below" violations (layer to trait)
        match = violation.match(/Layer "(.+?)" must be rendered below trait "(.+?)"/);
        if (match) {
          const layerName = match[1];
          const traitName = match[2];
          const layerIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === layerName);
          const traitIdx = fixedNFT.traits.findIndex(t => t.trait && t.trait.name === traitName);

          if (layerIdx !== -1 && traitIdx !== -1 && layerIdx <= traitIdx) {
            const [layerTrait] = fixedNFT.traits.splice(layerIdx, 1);
            fixedNFT.traits.splice(traitIdx + 1, 0, layerTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed layer below trait rule: moved '${layerName}' below '${traitName}'`);
          }
          continue;
        }

        // Handle "above" violations (layer to trait)
        match = violation.match(/Layer "(.+?)" must be rendered above trait "(.+?)"/);
        if (match) {
          const layerName = match[1];
          const traitName = match[2];
          const layerIdx = fixedNFT.traits.findIndex(t => t.layer && t.layer.name === layerName);
          const traitIdx = fixedNFT.traits.findIndex(t => t.trait && t.trait.name === traitName);

          if (layerIdx !== -1 && traitIdx !== -1 && layerIdx >= traitIdx) {
            const [layerTrait] = fixedNFT.traits.splice(layerIdx, 1);
            fixedNFT.traits.splice(traitIdx, 0, layerTrait);
            fixed = true;
            console.log(`[DEBUG] Fixed layer above trait rule: moved '${layerName}' above '${traitName}'`);
          }
          continue;
        }

        console.log(`[DEBUG] No matching pattern found for violation: ${violation}`);
      }
        
        if (!fixed) {
          console.log('[DEBUG] No more fixes possible');
          break;
        }
        
        fixAttempts++;
        
        // Re-check violations after fixes
        const newViolations = generateNftsModule.checkForRuleViolations(fixedNFT, projectData.rules);
        const newOrderingViolations = newViolations.filter(v => 
          v.includes('must be rendered above') || 
          v.includes('must be rendered below') ||
          v.includes('must be rendered immediately above') ||
          v.includes('must be rendered immediately below')
        );
        
        // Update the violations array
        orderingViolations.length = 0;
        orderingViolations.push(...newOrderingViolations);
        
        console.log(`[DEBUG] After fix attempt ${fixAttempts}: ${orderingViolations.length} violations remaining`);
      }
      
      console.log(`[DEBUG] Final fixed NFT traits order: ${fixedNFT.traits.map(t => t.layer.name).join(' -> ')}`);
      return fixedNFT;
    } catch (error) {
      console.error('[DEBUG] Error applying rule fixes:', error);
      return nft; // Return original NFT if fixing fails
    }
  }

  // Show rarity search progress popup
  showRaritySearchPopup(searchValue, isInterval) {
    // Remove existing popup if any
    this.hideRaritySearchPopup();
    
    const popup = document.createElement('div');
    popup.className = 'rarity-search-popup';
    popup.id = 'rarity-search-popup';
    
    const searchType = isInterval ? 'interval' : 'single rank';
    const searchDescription = isInterval ? `rarity ranks ${searchValue}` : `rarity rank ${searchValue}`;
    
    popup.innerHTML = `
      <div class="rarity-search-popup-content">
        <h3>Searching NFTs by Rarity</h3>
        <div class="search-info">Searching for NFTs with ${searchDescription}...</div>
        <div class="rarity-search-progress">
          <div class="rarity-search-progress-bar" id="search-progress-bar"></div>
        </div>
        <div class="rarity-search-status" id="search-status">Initializing search...</div>
        <div class="rarity-search-results" id="search-results" style="display: none;"></div>
        <div style="display: flex; justify-content: center; margin-top: 15px;">
          <button id="cancel-rarity-search-btn" class="saved-seeds-btn cancel-search-btn">Cancel</button>
        </div>
      </div>
    `;
    
    document.body.appendChild(popup);
    
    // Store popup reference
    this.raritySearchPopup = popup;
    this.isSearchCancelled = false;
    
    // Add cancel button event listener
    const cancelBtn = popup.querySelector('#cancel-rarity-search-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        console.log('[DEBUG] Rarity search cancelled by user');
        this.isSearchCancelled = true;
        this.hideRaritySearchPopup();
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Rarity search cancelled", "info", 2000);
        }
      };
    }
    
    return popup;
  }

  // Hide rarity search progress popup
  hideRaritySearchPopup() {
    const popup = document.getElementById('rarity-search-popup');
    if (popup) {
      popup.remove();
    }
    this.raritySearchPopup = null;
  }

  // Update search progress
  updateSearchProgress(progress, status, results = null) {
    if (!this.raritySearchPopup) return;
    
    const progressBar = this.raritySearchPopup.querySelector('#search-progress-bar');
    const statusElement = this.raritySearchPopup.querySelector('#search-status');
    const resultsElement = this.raritySearchPopup.querySelector('#search-results');
    
    if (progressBar) {
      progressBar.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    }
    
    if (statusElement) {
      statusElement.textContent = status;
    }
    
    if (results !== null) {
      resultsElement.textContent = `Found ${results} NFT(s)`;
      resultsElement.style.display = 'block';
    }
  }

  // Search NFTs by rarity rank
  async searchByRarity() {
    // Clear empty positions, original search results, and corrected NFTs when starting a new search
    this.emptyPositions.clear();
    this.originalSearchResults = [];
    this.correctedNFTs.clear();
    console.log('[DEBUG] Cleared empty positions, original search results, and corrected NFTs for new rarity search');
    
    const searchInput = this.modal.querySelector('#rarity-search-input');
    const searchValue = searchInput.value.trim();
    
    console.log('[DEBUG] Rarity search called with value:', searchValue);
    console.log('[DEBUG] Available rarity ranks:', Object.keys(this.rarityRanks).length);
    console.log('[DEBUG] Sample rarity ranks:', Object.entries(this.rarityRanks).slice(0, 5));
    
    // Debug localStorage contents
    this.debugLocalStorage();
    
    // Validate input format - only allow numbers and intervals
    if (!searchValue || !/^(\d+)(\s*-\s*\d+)?$/.test(searchValue)) {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Please enter a valid rarity rank or interval (e.g., 20, 1-8, 1 - 8)", "warning", 3000);
      }
      return;
    }
    
    // Check if it's an interval search (contains - or - with spaces)
    const intervalMatch = searchValue.match(/^(\d+)\s*-\s*(\d+)$/);
    let minRank, maxRank, isInterval;
    
    if (intervalMatch) {
      minRank = parseInt(intervalMatch[1]);
      maxRank = parseInt(intervalMatch[2]);
      isInterval = true;
      
      if (minRank < 1 || maxRank < 1 || minRank > maxRank) {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Please enter a valid rarity interval (e.g., 1-8, 1 - 8)", "warning", 3000);
        }
        return;
      }
    } else {
      // Single rank search
      const rarityRank = parseInt(searchValue);
      isInterval = false;
      
      if (!rarityRank || rarityRank < 1) {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Please enter a valid rarity rank number (e.g., 20)", "warning", 3000);
        }
        return;
      }
      
      minRank = maxRank = rarityRank;
    }

    // Show search popup
    this.showRaritySearchPopup(searchValue, isInterval);
    this.updateSearchProgress(10, "Validating input...");

    // Check if rarity ranks have been calculated
    if (Object.keys(this.rarityRanks).length === 0) {
      this.updateSearchProgress(20, "Loading rarity ranks from storage...");
      console.log('[DEBUG] No rarity ranks found in memory, attempting to load from localStorage...');
      
      // Try to load rarity ranks from localStorage
      const rarityRanksLoaded = this.loadRarityRanks();
      
      if (!rarityRanksLoaded || Object.keys(this.rarityRanks).length === 0) {
        console.log('[DEBUG] No rarity ranks found in localStorage either');
        
        // Try alternative approach - check if there are any rarity-related keys
        const allKeys = Object.keys(localStorage);
        const rarityKeys = allKeys.filter(key => key.includes('rarity'));
        console.log('[DEBUG] Found rarity keys in localStorage:', rarityKeys);
        
        if (rarityKeys.length > 0) {
          // Try to load from any rarity key (only rarityRanks keys, not status keys)
          const rarityRankKeys = rarityKeys.filter(key => key.startsWith('rarityRanks_'));
          console.log('[DEBUG] Found rarity rank keys:', rarityRankKeys);
          
          for (const key of rarityRankKeys) {
            try {
              const data = localStorage.getItem(key);
              if (data) {
                const parsed = JSON.parse(data);
                if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                  this.rarityRanks = parsed;
                  console.log('[DEBUG] Successfully loaded rarity ranks from key:', key, 'with', Object.keys(this.rarityRanks).length, 'ranks');
                  break;
                }
              }
            } catch (error) {
              console.error('[DEBUG] Error parsing rarity data from key:', key, error);
            }
          }
        }
        
        // Final check
        if (Object.keys(this.rarityRanks).length === 0) {
          this.hideRaritySearchPopup();
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show("Rarity ranks have not been calculated yet. Please calculate rarity ranks first.", "warning", 4000);
          }
          return;
        }
      } else {
        console.log('[DEBUG] Successfully loaded rarity ranks from localStorage:', Object.keys(this.rarityRanks).length, 'ranks');
      }
    }

    // Debug seed matching
    this.updateSearchProgress(30, "Analyzing collection...");
    console.log('[DEBUG] Seed list length:', this.seedList.length);
    console.log('[DEBUG] Sample seeds from collection:', this.seedList.slice(0, 3).map(s => s.seed));
    console.log('[DEBUG] Sample rarity ranks:', Object.entries(this.rarityRanks).slice(0, 3));
    
    // Check if any seeds from collection have rarity ranks
    const seedsWithRanks = this.seedList.filter(seedObj => this.rarityRanks.hasOwnProperty(seedObj.seed));
    console.log('[DEBUG] Seeds with rarity ranks:', seedsWithRanks.length, 'out of', this.seedList.length);
    
    if (seedsWithRanks.length === 0) {
      console.log('[DEBUG] No seeds from collection have rarity ranks!');
      console.log('[DEBUG] Collection seeds:', this.seedList.map(s => s.seed).slice(0, 5));
      console.log('[DEBUG] Rarity rank seeds:', Object.keys(this.rarityRanks).slice(0, 5));
    }

    this.updateSearchProgress(50, "Filtering NFTs by rarity...");

    // Build an ordinal rank map without gaps (handles deletions gracefully)
    const rankedCurrentSeeds = this.seedList
      .map(s => ({ seed: s.seed, rank: parseInt(this.getRarityRank(s.seed)) }))
      .filter(x => x.rank && Number.isFinite(x.rank))
      .sort((a, b) => a.rank - b.rank);
    const ordinalRankMap = new Map();
    let ordinal = 1;
    for (const item of rankedCurrentSeeds) {
      ordinalRankMap.set(item.seed, ordinal++);
    }

    // Filter seeds by rarity rank using the enhanced getRarityRank method (optimized)
    this.filteredSeedList = [];
    const totalSeeds = this.seedList.length;
    const batchSize = 100; // Process 100 seeds at a time
    
    for (let i = 0; i < this.seedList.length; i += batchSize) {
      // Check if search was cancelled
      if (this.isSearchCancelled) {
        this.hideRaritySearchPopup();
        return;
      }
      
      // Process batch
      const batch = this.seedList.slice(i, Math.min(i + batchSize, this.seedList.length));
      for (const seedObj of batch) {
        const seedRarity = this.getRarityRank(seedObj.seed);
        const rarityNum = parseInt(seedRarity);
        const ordinalRank = ordinalRankMap.get(seedObj.seed);
        const rankToCompare = ordinalRank || rarityNum;
        const matches = rankToCompare && rankToCompare >= minRank && rankToCompare <= maxRank;
        
        if (matches) {
          this.filteredSeedList.push(seedObj);
        }
      }
      
      // Update progress after each batch
      const progress = 50 + Math.floor((i / this.seedList.length) * 30);
      this.updateSearchProgress(progress, `Filtering NFTs... (${Math.min(i + batchSize, totalSeeds)}/${totalSeeds})`);
      
      // Allow UI to update (only once per batch)
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    console.log('[DEBUG] Filtered results:', this.filteredSeedList.length, 'NFTs found');

    this.updateSearchProgress(80, "Sorting results by rarity rank...");

    // Sort by rarity rank (ascending order)
    this.filteredSeedList.sort((a, b) => {
      const rankA = parseInt(this.getRarityRank(a.seed));
      const rankB = parseInt(this.getRarityRank(b.seed));
      return rankA - rankB;
    });

    console.log('[DEBUG] Filtered results:', this.filteredSeedList.length, 'NFTs found');

    if (this.filteredSeedList.length === 0) {
      this.updateSearchProgress(100, "No NFTs found");
      const searchType = minRank === maxRank ? `rarity rank ${minRank}` : `rarity ranks ${minRank}-${maxRank}`;
      
      // Wait a moment to show the "no results" state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      this.hideRaritySearchPopup();
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`No NFTs found with ${searchType}`, "info", 3000);
      }
      return;
    }

    this.updateSearchProgress(90, "Updating display...");

    // Store original search results for empty position tracking
    this.originalSearchResults = [...this.filteredSeedList];
    console.log(`[DEBUG] Stored original rarity search results: ${this.originalSearchResults.length} items`);
    
    // Update UI
    this.currentPage = 1;
    this.isFilteringByRarity = true;
    this.renderPage(1);
    this.updateFilterButtons();
    this.updateClearSearchButton();

    this.updateSearchProgress(100, "Search complete!");
    this.updateSearchProgress(100, "Search complete!", this.filteredSeedList.length);

    const searchType = minRank === maxRank ? `rarity rank ${minRank}` : `rarity ranks ${minRank}-${maxRank}`;
    
    // Wait a moment to show completion, then hide popup
    await new Promise(resolve => setTimeout(resolve, 1500));
    this.hideRaritySearchPopup();
    
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
      window.NFTApp.getModule("notificationService").show(`Found ${this.filteredSeedList.length} NFT(s) with ${searchType}`, "success", 3000);
    }
  }

  // Clear rarity search and return to normal view
  clearRaritySearch() {
    console.log('[DEBUG] Clearing rarity/position search');
    
    this.isFilteringByRarity = false;
    this.isFilteringByPosition = false;
    this.filteredSeedList = [];
    this.currentPage = 1;
    
    // Clear empty positions, original search results, and corrected NFTs
    this.emptyPositions.clear();
    this.originalSearchResults = [];
    this.correctedNFTs.clear();
    console.log('[DEBUG] Cleared empty positions, original search results, and corrected NFTs');
    
    // Clear search input
    const searchInput = this.modal.querySelector('#rarity-search-input');
    if (searchInput) {
      searchInput.value = '';
    }
    
    // Return to normal view with full Saved Seeds list
    this.renderPage(1);
    this.updateFilterButtons();
    this.updateClearSearchButton();

    const searchType = this.raritySearchMode === 'rarity' ? 'Rarity' : 'NFT #';
    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
      window.NFTApp.getModule("notificationService").show(`${searchType} search cleared. Showing all NFTs.`, "info", 2000);
    }
  }

  toggleRaritySearchMode() {
    this.raritySearchMode = this.raritySearchMode === 'rarity' ? 'position' : 'rarity';
    
    const label = this.modal?.querySelector('#rarity-search-label');
    const input = this.modal?.querySelector('#rarity-search-input');
    
    if (label) {
      label.textContent = this.raritySearchMode === 'rarity' ? 'Find Rarity:' : 'Find NFT #:';
      // Toggle visual state classes for button-like styles
      label.classList.toggle('mode-rarity', this.raritySearchMode === 'rarity');
      label.classList.toggle('mode-position', this.raritySearchMode === 'position');
      // CRITICAL: Ensure help cursor is always shown for tooltip
      label.style.cursor = 'help';
      // CRITICAL: Ensure tooltip class is present
      if (!label.classList.contains('tooltip')) {
        label.classList.add('tooltip');
      }
      // CRITICAL: Re-setup tooltip after mode change to ensure it works correctly
      const labelTooltip = label.querySelector('.tooltiptext');
      if (labelTooltip) {
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          label.removeAttribute('data-tooltip-setup');
          delete label.dataset.tooltipSetup;
          tooltipManager.setupTooltip(label, labelTooltip);
        }
      }
    }
    
    if (input) {
      if (this.raritySearchMode === 'rarity') {
        input.placeholder = 'Enter rarity rank or interval (e.g., 20 or 1-8)';
      } else {
        input.placeholder = 'Enter position (e.g., #234, 1-10, 1,5,10)';
      }
      // Clear input when toggling
      input.value = '';
    }
    
    // Update tooltip based on current mode
    this.updateRaritySearchTooltip();
    
    // Clear any active search
    if (this.isFilteringByRarity || this.isFilteringByPosition) {
      this.clearRaritySearch();
    }
    
    // Update clear button state after clearing input
    this.updateClearSearchButton();
    
    console.log(`[DEBUG] Toggled search mode to: ${this.raritySearchMode}`);
  }

  // Update tooltip content based on current search mode
  updateRaritySearchTooltip() {
    const tooltip = this.modal?.querySelector('#rarity-search-tooltip');
    if (!tooltip) return;
    
    // Mode-specific description with justified text
    const baseOpen = '<div style="text-align: justify;">';
    const baseDescription = ''; // Base description removed per user request
    
    // Mode-specific description
    let modeDescription = '';
    if (this.raritySearchMode === 'rarity') {
      modeDescription = 'Find Rarity: Enter a rarity rank number or<br>range to find NFTs with specific rarity ranks.<br><br>For example, "20" finds the NFT with rank 20,<br>or "1-8" finds NFTs with ranks between 1 and 8.';
    } else {
      modeDescription = '<strong>Find NFT #:</strong> Enter a position number or range to find NFTs at specific positions in your collection.<br><br>For example, "#234" finds the NFT at position 234, "1-10" finds NFTs at positions 1 through 10, or "1,5,10" finds NFTs at positions 1, 5, and 10.';
    }
    
    const baseClose = '</div>';
    tooltip.innerHTML = baseOpen + baseDescription + modeDescription + baseClose;
  }

  searchByPosition() {
    // Clear empty positions, original search results, and corrected NFTs when starting a new search
    this.emptyPositions.clear();
    this.originalSearchResults = [];
    this.correctedNFTs.clear();
    console.log('[DEBUG] Cleared empty positions, original search results, and corrected NFTs for new position search');
    
    const searchInput = this.modal.querySelector('#rarity-search-input');
    const searchValue = searchInput.value.trim();
    
    console.log('[DEBUG] Position search called with value:', searchValue);
    
    if (!searchValue) {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Please enter a position number or range", "warning", 3000);
      }
      return;
    }
    
    // Remove # symbols
    const cleanValue = searchValue.replace(/#/g, '');
    
    // Parse the input: can be single number, comma-separated, or ranges
    const positions = new Set();
    const parts = cleanValue.split(',').map(p => p.trim());
    
    try {
      for (const part of parts) {
        // Check if it's a range (e.g., "1-10")
        const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
        if (rangeMatch) {
          const start = parseInt(rangeMatch[1]);
          const end = parseInt(rangeMatch[2]);
          
          if (start < 1 || end < 1 || start > end) {
            throw new Error(`Invalid range: ${part}`);
          }
          
          // Add all positions in range
          for (let i = start; i <= end; i++) {
            positions.add(i);
          }
        } else {
          // Single number
          const pos = parseInt(part);
          if (isNaN(pos) || pos < 1) {
            throw new Error(`Invalid position: ${part}`);
          }
          positions.add(pos);
        }
      }
      
      if (positions.size === 0) {
        throw new Error('No valid positions found');
      }
      
      console.log(`[DEBUG] Searching for positions:`, Array.from(positions).sort((a, b) => a - b));
      
      // Filter NFTs by position (position is 1-based, array is 0-based)
      this.filteredSeedList = [];
      const posArray = Array.from(positions).sort((a, b) => a - b);
      
      for (const pos of posArray) {
        const index = pos - 1; // Convert to 0-based
        if (index >= 0 && index < this.seedList.length) {
          this.filteredSeedList.push(this.seedList[index]);
        } else {
          console.warn(`[DEBUG] Position ${pos} is out of range (collection size: ${this.seedList.length})`);
        }
      }
      
      if (this.filteredSeedList.length === 0) {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("No NFTs found at the specified positions", "info", 3000);
        }
        return;
      }
      
      // Store original search results for empty position tracking
      this.originalSearchResults = [...this.filteredSeedList];
      console.log(`[DEBUG] Stored original position search results: ${this.originalSearchResults.length} items`);
      
      // Set filtering state
      this.isFilteringByPosition = true;
      this.currentPage = 1;
      
      // Render the filtered results
      this.renderPage(1);
      this.updateFilterButtons();
      this.updateClearSearchButton();
      
      const posText = this.filteredSeedList.length === 1 ? 
        `position ${posArray[0]}` : 
        `${this.filteredSeedList.length} positions`;
      
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Found ${this.filteredSeedList.length} NFT${this.filteredSeedList.length > 1 ? 's' : ''} at ${posText}`, "success", 3000);
      }
      
    } catch (error) {
      console.error('[DEBUG] Position search error:', error.message);
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Invalid position format: ${error.message}`, "error", 3000);
      }
    }
  }

  // Enhanced search query parser
  parseSearchQuery(searchValue) {
    const trimmedValue = searchValue.trim();
    
    // Check for different search modes
    if (trimmedValue.includes(' AND ')) {
      // AND mode: "layer1 AND trait1" - must have both
      const terms = trimmedValue.split(' AND ').map(term => term.trim().toLowerCase()).filter(term => term.length > 0);
      return {
        mode: 'AND',
        terms: terms,
        description: `NFTs containing ALL of: "${terms.join('" AND "')}"`
      };
    } else if (trimmedValue.includes(' OR ')) {
      // OR mode: "layer1 OR trait1" - can have either
      const terms = trimmedValue.split(' OR ').map(term => term.trim().toLowerCase()).filter(term => term.length > 0);
      return {
        mode: 'OR',
        terms: terms,
        description: `NFTs containing ANY of: "${terms.join('" OR "')}"`
      };
    } else if (trimmedValue.includes(',')) {
      // Comma-separated mode (legacy): "term1, term2" - can have either
      const terms = trimmedValue.split(',').map(term => term.trim().toLowerCase()).filter(term => term.length > 0);
      return {
        mode: 'OR',
        terms: terms,
        description: `NFTs containing ANY of: "${terms.join('", "')}"`
      };
    } else if (trimmedValue.includes(' ')) {
      // Multi-word mode: "red hat" - must have all words in same trait
      const words = trimmedValue.split(' ').map(word => word.trim().toLowerCase()).filter(word => word.length > 0);
      return {
        mode: 'MULTI_WORD',
        terms: words,
        description: `NFTs with traits containing ALL words: "${words.join('", "')}"`
      };
    } else {
      // Single term mode
      return {
        mode: 'SINGLE',
        terms: [trimmedValue.toLowerCase()],
        description: `NFTs containing: "${trimmedValue}"`
      };
    }
  }

  // Enhanced layer matching based on search mode
  findMatchingLayers(projectData, searchConfig) {
    const matchingLayers = new Set();
    
    if (!projectData.traits || !Array.isArray(projectData.traits)) {
      console.warn('[DEBUG] projectData.traits is not available or not an array!');
      return matchingLayers;
    }
    
    console.log('[DEBUG] PROJECT DATA LAYERS ANALYSIS:');
    console.log('[DEBUG] Number of layers:', projectData.traits.length);
    console.log('[DEBUG] All layer names:');
    projectData.traits.forEach((layer, idx) => {
      console.log(`[DEBUG]   Layer ${idx + 1}: "${layer.name}" (ID: ${layer.id})`);
    });
    
    projectData.traits.forEach(layer => {
      const layerName = (layer.name || '').toLowerCase();
      console.log(`[DEBUG]   Checking layer "${layer.name}" (lowercase: "${layerName}")`);
      
      let matchesTerms = false;
      
      switch (searchConfig.mode) {
        case 'AND':
          // For AND mode, layer must match ALL terms
          matchesTerms = searchConfig.terms.every(term => layerName.includes(term));
          break;
        case 'OR':
          // For OR mode, layer must match ANY term
          matchesTerms = searchConfig.terms.some(term => layerName.includes(term));
          break;
        case 'MULTI_WORD':
          // For multi-word mode, layer must contain ALL words
          matchesTerms = searchConfig.terms.every(word => layerName.includes(word));
          break;
        case 'SINGLE':
          // For single term mode, layer must contain the term
          matchesTerms = layerName.includes(searchConfig.terms[0]);
          break;
      }
      
      if (matchesTerms) {
        matchingLayers.add(layer.id);
        console.log(`[DEBUG]   ✅ LAYER MATCH: "${layer.name}" (ID: ${layer.id}) matches search criteria!`);
      }
    });
    
    return matchingLayers;
  }

  // Enhanced trait matching based on search mode
  checkTraitMatches(traits, searchConfig, matchingLayers) {
    const validTraits = traits.filter(traitObj => {
      if (!traitObj || !traitObj.trait || !traitObj.layer) {
        return false;
      }
      
      const traitName = (traitObj.trait.name || '').toLowerCase();
      
      // Skip "none" traits
      if (traitName === 'none' || traitObj.trait.id === 'none') {
        return false;
      }
      
      return true;
    });
    
    if (validTraits.length === 0) {
      return false;
    }
    
    switch (searchConfig.mode) {
      case 'AND':
        // For AND mode, NFT must have traits that match ALL search terms
        // Each term can match either a layer name or trait name
        return searchConfig.terms.every(term => {
          return validTraits.some(traitObj => {
            const traitName = (traitObj.trait.name || '').toLowerCase();
            const layerName = (traitObj.layer.name || '').toLowerCase();
            return traitName.includes(term) || layerName.includes(term);
          });
        });
        
      case 'OR':
        // For OR mode, NFT must have traits that match ANY search term
        return searchConfig.terms.some(term => {
          return validTraits.some(traitObj => {
            const traitName = (traitObj.trait.name || '').toLowerCase();
            const layerName = (traitObj.layer.name || '').toLowerCase();
            return traitName.includes(term) || layerName.includes(term);
          });
        });
        
      case 'MULTI_WORD':
        // For multi-word mode, NFT must have at least one trait that contains ALL words
        return validTraits.some(traitObj => {
          const traitName = (traitObj.trait.name || '').toLowerCase();
          const layerName = (traitObj.layer.name || '').toLowerCase();
          const combinedText = `${traitName} ${layerName}`;
          
          // Check if this trait/layer combination contains all words
          return searchConfig.terms.every(word => combinedText.includes(word));
        });
        
      case 'SINGLE':
        // For single term mode, NFT must have traits that contain the term
        const term = searchConfig.terms[0];
        return validTraits.some(traitObj => {
          const traitName = (traitObj.trait.name || '').toLowerCase();
          const layerName = (traitObj.layer.name || '').toLowerCase();
          return traitName.includes(term) || layerName.includes(term);
        });
        
      default:
        return false;
    }
  }

  async searchByTrait() {
    // Clear empty positions when starting a new search
    this.emptyPositions.clear();
    console.log('[DEBUG] Cleared empty positions for new trait search');
    
    const searchInput = this.modal?.querySelector('#trait-search-input');
    if (!searchInput) {
      console.error('[DEBUG] Trait search input not found');
      return;
    }
    
    const searchValue = searchInput.value.trim();
    
    // Check if this is resuming a previous search with the same term
    const isResuming = this.lastTraitSearchTerm === searchValue && this.lastSearchedIndex > 0;
    console.log('[DEBUG] Trait search called with value:', searchValue);
    console.log('[DEBUG] Resuming search?', isResuming, 'Last term:', this.lastTraitSearchTerm, 'Last index:', this.lastSearchedIndex);
    
    if (!searchValue) {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show("Please enter a trait name to search", "warning", 3000);
      }
      return;
    }
    
    try {
      const generateNftsModule = window.NFTApp?.getModule('generateNfts');
      const projectData = window.NFTApp?.getModule('generateNftsUI')?.projectData || window.currentProject;
      
      console.log('[DEBUG] generateNftsModule:', generateNftsModule ? 'Found' : 'NOT FOUND');
      console.log('[DEBUG] projectData:', projectData ? 'Found' : 'NOT FOUND');
      console.log('[DEBUG] projectData.traits (layers):', projectData?.traits ? projectData.traits.length : 'NO LAYERS');
      
      if (!projectData) {
        console.error('[DEBUG] No project data available');
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("No project loaded. Please load a project first.", "error", 3000);
        }
        return;
      }
      
      if (!generateNftsModule) {
        console.error('[DEBUG] generateNfts module not found');
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("NFT generator module not available.", "error", 3000);
        }
        return;
      }
      
      // Check if we have NFTs to search
      if (!this.seedList || this.seedList.length === 0) {
        console.error('[DEBUG] No NFTs in seedList');
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("No NFTs in collection. Generate or import NFTs first.", "warning", 3000);
        }
        return;
      }
      
      // Enhanced search parsing with support for multiple search modes
      const searchConfig = this.parseSearchQuery(searchValue);
      const totalNFTs = this.seedList.length;
      
      console.log(`[DEBUG] Searching ${totalNFTs} NFTs with enhanced search:`, searchConfig);
      console.log(`[DEBUG] Search mode:`, searchConfig.mode);
      console.log(`[DEBUG] Search terms:`, searchConfig.terms);
      
      // Create progress popup
      const progressPopup = document.createElement('div');
      progressPopup.id = 'trait-search-progress-popup';
      progressPopup.className = 'scan-progress-popup';
      progressPopup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c3e50; padding: 30px 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 10002; min-width: 400px; text-align: center; font-family: "Archivo", sans-serif;';
      
      progressPopup.innerHTML = `
        <div class="scan-title-container" style="text-align: center; margin-bottom: 20px;">
          <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Enhanced Trait Search</div>
          <div class="scan-subtitle" style="font-size: 14px; color: #95a5a6; text-align: center; display: inline-block; width: auto;">(${searchConfig.description})</div>
        </div>
        <div class="scan-percentage" id="trait-search-percentage" style="font-size: 24px; font-weight: 700; color: #3498db; margin-bottom: 10px;">
          0%<span class="scan-dots">
            <span></span>
            <span></span>
            <span></span>
          </span>
        </div>
        <div class="scan-progress-info" style="font-size: 14px; color: #95a5a6; margin-bottom: 10px;">
          Processing: <span id="trait-search-processed">0</span> / <span id="trait-search-total">${totalNFTs}</span>
        </div>
        <div class="scan-counts-container" style="margin-bottom: 20px;">
          <div class="scan-violations-count"><span id="trait-search-found">0</span> matches found</div>
        </div>
        <div class="scan-eta" id="trait-search-eta" style="font-size: 14px; color: #ffffff; margin-bottom: 20px;">
          Starting...
        </div>
        <button class="scan-cancel-btn" id="cancel-trait-search-btn">Cancel</button>
      `;
      document.body.appendChild(progressPopup);
      
      // Make popup draggable
      let isDragging = false;
      let currentX;
      let currentY;
      let initialX;
      let initialY;
      let xOffset = 0;
      let yOffset = 0;
      
      const dragArea = progressPopup.querySelector('.scan-title-container');
      if (dragArea) {
        dragArea.style.cursor = 'move';
        dragArea.style.userSelect = 'none';
        
        dragArea.addEventListener('mousedown', (e) => {
          e.preventDefault();
          isDragging = true;
          initialX = e.clientX - xOffset;
          initialY = e.clientY - yOffset;
          progressPopup.style.cursor = 'grabbing';
        });
      }
      
      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          xOffset = currentX;
          yOffset = currentY;
          
          progressPopup.style.transform = `translate(${currentX}px, ${currentY}px)`;
        }
      });
      
      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          progressPopup.style.cursor = 'move';
        }
      });
      
      let isCancelled = false;
      const cancelBtn = progressPopup.querySelector('#cancel-trait-search-btn');
      
      // ETA calculation variables
      const searchStartTime = Date.now();
      let lastPercentageMilestone = 0;
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          isCancelled = true;
          cancelBtn.disabled = true;
          cancelBtn.style.background = '#95a5a6';
          cancelBtn.textContent = 'Cancelling...';
          console.log('[DEBUG] User cancelled trait search');
        });
        
        // Add hover effect
        cancelBtn.addEventListener('mouseenter', () => {
          if (!cancelBtn.disabled) cancelBtn.style.background = '#c0392b';
        });
        cancelBtn.addEventListener('mouseleave', () => {
          if (!cancelBtn.disabled) cancelBtn.style.background = '#e74c3c';
        });
      }
      
      // Force UI update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // Set filtering state and initialize empty filtered list for real-time updates
      this.isFilteringByTrait = true;
      this.traitSearchTerm = searchValue;
      
      // If resuming, keep existing results; otherwise start fresh
      if (!isResuming) {
        this.filteredSeedList = [];
        this.lastTraitSearchTerm = searchValue;
        this.lastSearchedIndex = 0;
      }
      
      this.currentPage = 1;
      
      // Clear empty positions, original search results, and corrected NFTs for new search
      this.emptyPositions.clear();
      this.originalSearchResults = [];
      this.correctedNFTs.clear();
      console.log('[DEBUG] Cleared empty positions, original search results, and corrected NFTs for new trait search');
      
      // Get the grid element
      const grid = this.modal.querySelector('#saved-seeds-grid');
      if (grid) {
        // Clear only at start of search
        grid.innerHTML = '';
      }
      
      this.updateFilterButtons();
      
      // Enhanced layer matching based on search mode
      const matchingLayers = this.findMatchingLayers(projectData, searchConfig);
      console.log('[DEBUG] ========================================');
      console.log('[DEBUG] ENHANCED LAYER MATCHING RESULTS:');
      console.log('[DEBUG] Search mode:', searchConfig.mode);
      console.log('[DEBUG] Search terms:', searchConfig.terms);
      console.log('[DEBUG] Total matching layers:', matchingLayers.size);
      console.log('[DEBUG] Matching layer IDs:', Array.from(matchingLayers));
      console.log('[DEBUG] ========================================')
      
      const matchedNFTSeeds = new Set(); // Track already matched NFTs to avoid duplicates
      
      // Start from last searched index if resuming
      const startIndex = isResuming ? this.lastSearchedIndex : 0;
      console.log('[DEBUG] Starting search from index:', startIndex);
      
      // Search through all NFTs starting from the checkpoint
      for (let i = startIndex; i < this.seedList.length; i++) {
        const seedObj = this.seedList[i];
        
        // Check if user cancelled
        if (isCancelled) {
          console.log('[DEBUG] Trait search cancelled by user at NFT #' + (i + 1));
          // Save the current index for resumption
          this.lastSearchedIndex = i;
          this.lastTraitSearchTerm = searchValue;
          console.log('[DEBUG] Saved checkpoint - will resume from index:', i);
          progressPopup.remove();
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            window.NFTApp.getModule("notificationService").show("Trait search cancelled. Restart to resume from where you left off.", "info", 3000);
          }
          return;
        }
        
        // Skip if already matched
        if (matchedNFTSeeds.has(seedObj.seed)) {
          continue;
        }
        
        try {
          // Generate the NFT to get its traits
          console.log(`[DEBUG] Generating NFT #${i + 1} with seed: ${seedObj.seed.substring(0, 20)}...`);
          const nft = await generateNftsModule.generateSingleNFT(projectData, false, seedObj.seed);
          console.log(`[DEBUG] NFT #${i + 1} generated successfully, has traits:`, nft && nft.traits ? nft.traits.length : 'NO TRAITS');
          
          // Log first NFT's traits structure for debugging
          if (i === 0 && nft && nft.traits && Array.isArray(nft.traits)) {
            console.log('[DEBUG] ========================================');
            console.log('[DEBUG] FIRST NFT TRAITS STRUCTURE:');
            nft.traits.forEach((traitObj, idx) => {
              console.log(`[DEBUG]   Trait ${idx + 1}:`, {
                traitName: traitObj.trait?.name,
                traitId: traitObj.trait?.id,
                layerName: traitObj.layer?.name,
                layerId: traitObj.layer?.id
              });
            });
            console.log('[DEBUG] ========================================');
          }
          
          if (nft && nft.traits && Array.isArray(nft.traits)) {
            // Enhanced trait matching based on search mode
            const hasMatchingTrait = this.checkTraitMatches(nft.traits, searchConfig, matchingLayers);
            
            if (hasMatchingTrait) {
              // Check if this NFT was already in the filtered list (means it was edited)
              const wasAlreadyFound = this.filteredSeedList.some(foundSeed => foundSeed.seed === seedObj.seed);
              
              // Add to filtered list immediately for real-time display
              this.filteredSeedList.push(seedObj);
              matchedNFTSeeds.add(seedObj.seed);
              
              // Log matched traits for debugging
              const matchedTraitNames = nft.traits
                .filter(t => {
                  if (!t || !t.trait || !t.layer) return false;
                  const traitName = (t.trait.name || '').toLowerCase();
                  if (traitName === 'none' || t.trait.id === 'none') return false;
                  
                  // Check if this trait matches the search criteria
                  const layerName = (t.layer.name || '').toLowerCase();
                  switch (searchConfig.mode) {
                    case 'AND':
                      return searchConfig.terms.some(term => 
                        traitName.includes(term) || layerName.includes(term)
                      );
                    case 'OR':
                      return searchConfig.terms.some(term => 
                        traitName.includes(term) || layerName.includes(term)
                      );
                    case 'MULTI_WORD':
                      const combinedText = `${traitName} ${layerName}`;
                      return searchConfig.terms.every(word => combinedText.includes(word));
                    case 'SINGLE':
                      return traitName.includes(searchConfig.terms[0]) || layerName.includes(searchConfig.terms[0]);
                    default:
                      return false;
                  }
                })
                .map(t => `${t.trait?.name || 'Unknown'} (${t.layer?.name || 'Unknown'})`)
                .join(', ');
              
              console.log(`[DEBUG] Match found in NFT #${i + 1}: ${matchedTraitNames}`);
              
              // Calculate which page this NFT belongs to
              const newIndex = this.filteredSeedList.length - 1;
              const targetPage = Math.floor(newIndex / this.pageSize) + 1;
              
              // Only re-render if:
              // 1. This is one of the first 3 results (initial display)
              // 2. The NFT was already found before (it was edited)
              const shouldFullRender = this.filteredSeedList.length <= 3 || wasAlreadyFound;
              
              if (shouldFullRender) {
                // Use requestAnimationFrame to ensure smooth rendering
                requestAnimationFrame(() => {
                  this.renderPage(this.currentPage);
                });
              } else {
                // Check if the new NFT should be displayed on the current page or if we need to render a new page
                if (targetPage === this.currentPage) {
                  // NFT belongs on current page - append it
                  requestAnimationFrame(() => {
                    const grid = this.modal?.querySelector('#saved-seeds-grid');
                    if (grid) {
                      // Find the original index in the main collection
                      const originalIndex = this.seedList.findIndex(s => s.seed === seedObj.seed);
                      const card = this.createNFTCard(seedObj, originalIndex !== -1 ? originalIndex : newIndex);
                      
                      // Check if a card with this seed already exists (was edited)
                      const existingCard = grid.querySelector(`[data-seed="${seedObj.seed}"]`);
                      if (existingCard) {
                        // NFT was edited - replace the existing card
                        existingCard.replaceWith(card);
                        // Load thumbnail for the replaced card
                        const pageSeeds = [seedObj];
                        this.loadThumbnailsSequentially([card], pageSeeds);
                      } else {
                        // New NFT - just append it
                        grid.appendChild(card);
                        // Load thumbnail for the new card
                        const pageSeeds = [seedObj];
                        this.loadThumbnailsSequentially([card], pageSeeds);
                      }
                      
                      // Update found count in progress popup
                      const foundEl = document.querySelector('#trait-search-found');
                      if (foundEl) {
                        foundEl.textContent = this.filteredSeedList.length;
                      }
                    }
                  });
                } else if (targetPage > this.currentPage) {
                  // NFT belongs on a new page - render that page immediately with all NFTs found so far for that page
                  requestAnimationFrame(() => {
                    this.renderPage(targetPage);
                    // Update current page to show the newly populated page
                    this.currentPage = targetPage;
                    
                    // Update found count in progress popup
                    const foundEl = document.querySelector('#trait-search-found');
                    if (foundEl) {
                      foundEl.textContent = this.filteredSeedList.length;
                    }
                  });
                }
              }
            }
          } else {
            console.warn(`[DEBUG] NFT #${i + 1} has no valid traits array`);
          }
        } catch (nftError) {
          console.error(`[DEBUG] Error processing NFT #${i + 1}:`, nftError.message);
          console.error(`[DEBUG] NFT error stack:`, nftError.stack);
          // Continue with next NFT instead of stopping the entire search
        }
        
        // Update progress - use i instead of i+1 to show correct percentage
        const percentage = Math.floor((i / totalNFTs) * 100);
        const percentageEl = progressPopup.querySelector('#trait-search-percentage');
        const processedEl = progressPopup.querySelector('#trait-search-processed');
        const foundEl = progressPopup.querySelector('#trait-search-found');
        const etaEl = progressPopup.querySelector('#trait-search-eta');
        
        if (percentageEl) {
          const dotsHTML = percentageEl.querySelector('.scan-dots');
          if (dotsHTML && percentageEl.childNodes[0]) {
            percentageEl.childNodes[0].textContent = `${percentage}%`;
          } else {
            percentageEl.textContent = `${percentage}%`;
          }
        }
        
        if (processedEl) {
          processedEl.textContent = i + 1;
        }
        
        if (foundEl) {
          foundEl.textContent = this.filteredSeedList.length;
        }
        
        // Calculate and display ETA at 1%, then 5%, then every 5% increment
        if (etaEl) {
          const currentPercentage = Math.floor((i / totalNFTs) * 100);
          const currentMilestone = Math.floor(currentPercentage / 5) * 5;
          
          // Update ETA when we reach 1%, 5%, or any new 5% milestone
          const shouldUpdateETA = (currentPercentage >= 1 && lastPercentageMilestone === 0) || 
                                  (currentMilestone >= 5 && currentMilestone > lastPercentageMilestone);
          
          if (shouldUpdateETA && i < totalNFTs) {
            lastPercentageMilestone = currentMilestone > 0 ? currentMilestone : 1;
            
            const elapsedMs = Date.now() - searchStartTime;
            const avgTimePerNFT = elapsedMs / (i + 1);
            const remainingNFTs = totalNFTs - (i + 1);
            const estimatedRemainingMs = avgTimePerNFT * remainingNFTs;
            
            // Format time remaining (hours and minutes only)
            const totalMinutes = Math.ceil(estimatedRemainingMs / 60000);
            let timeText;
            if (totalMinutes < 60) {
              timeText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
            } else {
              const hours = Math.floor(totalMinutes / 60);
              const minutes = totalMinutes % 60;
              if (minutes > 0) {
                timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
              } else {
                timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
              }
            }
            
            etaEl.textContent = `Estimated time remaining: ${timeText}`;
            console.log(`[DEBUG] Trait search ETA updated at ${currentPercentage}%: ${timeText}`);
          } else if (i >= totalNFTs - 1) {
            etaEl.textContent = 'Completing...';
          }
        }
        
        // Small delay to keep UI responsive
        if (i % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1));
        }
      }
      
      // Final render to ensure all results are displayed
      this.renderPage(this.currentPage);
      
      // Close progress popup
      progressPopup.remove();
      
      // Reset checkpoint since search completed
      this.lastSearchedIndex = 0;
      this.lastTraitSearchTerm = null;
      console.log('[DEBUG] Search complete - reset checkpoint');
      
      const totalFound = this.filteredSeedList.length;
      console.log(`[DEBUG] Found ${totalFound} NFTs with matching traits`);
      
      if (totalFound === 0) {
        // Clear filtering state if no results
        this.isFilteringByTrait = false;
        this.filteredSeedList = [];
        this.renderPage(1);
        this.updateFilterButtons();
        
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(`No NFTs found with traits/layers: "${searchValue}"`, "info", 3000);
        }
        return;
      }
      
      // Store original search results for empty position tracking
      this.originalSearchResults = [...this.filteredSeedList];
      console.log(`[DEBUG] Stored original search results: ${this.originalSearchResults.length} items`);
      
      // Final render to ensure page is up to date
      this.renderPage(this.currentPage);
      this.updateFilterButtons();
      
      // Use searchConfig.terms to build the notification message
      const termText = searchConfig.terms.length > 1 ? `terms: "${searchConfig.terms.join('", "')}"` : `"${searchValue}"`;
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Found ${totalFound} NFT${totalFound > 1 ? 's' : ''} matching ${termText}`, "success", 3000);
      }
    } catch (error) {
      console.error('[DEBUG] ====== TRAIT SEARCH ERROR ======');
      console.error('[DEBUG] Error type:', error.name);
      console.error('[DEBUG] Error message:', error.message);
      console.error('[DEBUG] Error stack:', error.stack);
      console.error('[DEBUG] ================================');
      
      // Close progress popup if it exists
      const popup = document.getElementById('trait-search-progress-popup');
      if (popup) {
        popup.remove();
      }
      
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(`Error searching for traits: ${error.message}`, "error", 5000);
      }
    }
  }

  clearTraitSearch() {
    console.log('[DEBUG] Clearing trait search');
    
    this.isFilteringByTrait = false;
    this.traitSearchTerm = null;
    this.filteredSeedList = [];
    this.currentPage = 1;
    
    // Clear empty positions, original search results, and corrected NFTs
    this.emptyPositions.clear();
    this.originalSearchResults = [];
    this.correctedNFTs.clear();
    console.log('[DEBUG] Cleared empty positions, original search results, and corrected NFTs');
    
    // Clear search input and hide buttons
    const searchInput = this.modal?.querySelector('#trait-search-input');
    const searchBtn = this.modal?.querySelector('#search-trait-btn');
    const clearBtn = this.modal?.querySelector('#clear-trait-search-btn');
    const rerenderBtnElement = this.modal?.querySelector('#rerender-thumbnails');
    
    if (searchInput) {
      searchInput.value = '';
    }
    if (searchBtn) {
      searchBtn.style.display = 'none';
    }
    if (clearBtn) {
      clearBtn.style.display = 'none';
    }
    
    // Show re-render button again
    if (rerenderBtnElement) {
      console.log('[DEBUG] Restoring rerender button visibility');
      // Use setProperty with 'important' to override CSS !important rule
      rerenderBtnElement.style.setProperty('display', 'flex', 'important');
      // Force reflow to ensure change is applied
      void rerenderBtnElement.offsetHeight;
    }
    
    // Return to normal view
    this.renderPage(1);
    this.updateFilterButtons();

    if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
      window.NFTApp.getModule("notificationService").show("Trait search cleared", "info", 2000);
    }
  }

  // Update clear search button state
  updateClearSearchButton() {
    const clearBtn = this.modal.querySelector('#clear-search-btn');
    const searchInput = this.modal.querySelector('#rarity-search-input');
    if (!clearBtn) return;
    
    // Enable clear button if there's an active filter OR if input has text
    const hasInputValue = searchInput && searchInput.value.trim() !== '';
    const hasActiveFilter = this.isFilteringByRarity || this.isFilteringByPosition;
    
    if (hasActiveFilter || hasInputValue) {
      clearBtn.classList.add('active');
      clearBtn.disabled = false;
    } else {
      clearBtn.classList.remove('active');
      clearBtn.disabled = true;
    }
  }

  // Update rarity status text
  updateRarityStatus(status) {
    const statusElement = this.modal.querySelector('#rarity-status-text');
    if (!statusElement) return;

    // Normalize status to lowercase for consistency
    const normalizedStatus = status ? status.toLowerCase() : '---';

    switch (normalizedStatus) {
      case 'updated':
        statusElement.textContent = 'updated';
        statusElement.className = 'rarity-status-text updated';
        // Add tooltip for updated status
        statusElement.classList.add('tooltip');
        let tooltipText = statusElement.querySelector('.tooltiptext');
        if (!tooltipText) {
          tooltipText = document.createElement('span');
          tooltipText.className = 'tooltiptext';
          const total = this.seedList?.length || 0;
          tooltipText.innerHTML = `Every NFT in your collection has it's correct<br>Rarity Rank calculated (from 1 to ${total || 'total supply'}).`;
          statusElement.appendChild(tooltipText);
        } else {
          const total = this.seedList?.length || 0;
          tooltipText.innerHTML = `Every NFT in your collection has it's correct<br>Rarity Rank calculated (from 1 to ${total || 'total supply'}).`;
        }
        // CRITICAL: Setup tooltip with global tooltip manager
        const tooltipManager = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManager && tooltipManager.setupTooltip) {
          tooltipManager.setupTooltip(statusElement, tooltipText);
        }
        break;
      case 'outdated':
        statusElement.textContent = 'outdated';
        statusElement.className = 'rarity-status-text outdated';
        // Add tooltip for outdated status
        statusElement.classList.add('tooltip');
        let tooltipTextOutdated = statusElement.querySelector('.tooltiptext');
        if (!tooltipTextOutdated) {
          tooltipTextOutdated = document.createElement('span');
          tooltipTextOutdated.className = 'tooltiptext';
          tooltipTextOutdated.innerHTML = 'outdated: re-run calculations<br>to update Rarity Ranks';
          statusElement.appendChild(tooltipTextOutdated);
        } else {
          tooltipTextOutdated.innerHTML = 'outdated: re-run calculations<br>to update Rarity Ranks';
        }
        // CRITICAL: Setup tooltip with global tooltip manager
        const tooltipManagerOutdated = window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('globalTooltipManager');
        if (tooltipManagerOutdated && tooltipManagerOutdated.setupTooltip) {
          tooltipManagerOutdated.setupTooltip(statusElement, tooltipTextOutdated);
        }
        break;
      case 'calculating':
        statusElement.textContent = 'calculating...';
        statusElement.className = 'rarity-status-text';
        statusElement.classList.remove('tooltip');
        if (statusElement.querySelector('.tooltiptext')) statusElement.querySelector('.tooltiptext').remove();
        break;
      default:
        statusElement.textContent = '---';
        statusElement.className = 'rarity-status-text';
        statusElement.classList.remove('tooltip');
        if (statusElement.querySelector('.tooltiptext')) statusElement.querySelector('.tooltiptext').remove();
        break;
    }

    // Save status to project data (project file)
    if (normalizedStatus === 'updated' || normalizedStatus === 'outdated') {
      this.saveRarityStatus(normalizedStatus);
    } else {
      // For '---' or other values, still save to show that no status is saved
      this.saveRarityStatus('---');
    }

    // Reflect status on the Calculate Rarity Ranks button appearance
    const calculateBtn = this.modal?.querySelector('#calculate-rarity-ranks');
    if (calculateBtn) {
      if (normalizedStatus === 'updated') {
        calculateBtn.classList.add('button-updated');
        calculateBtn.classList.remove('button-outdated');
      } else if (normalizedStatus === 'outdated') {
        calculateBtn.classList.remove('button-updated');
        calculateBtn.classList.add('button-outdated');
      } else {
        calculateBtn.classList.remove('button-updated');
        calculateBtn.classList.remove('button-outdated');
      }
    }
  }

  // Save rarity ranks to localStorage
  saveRarityRanks() {
    try {
      const projectName = this.getProjectName();
      const rarityRanksKey = `rarityRanks_${projectName}`;
      console.log('[DEBUG] Saving rarity ranks with key:', rarityRanksKey);
      console.log('[DEBUG] Saving rarity ranks:', Object.keys(this.rarityRanks).length, 'ranks');
      console.log('[DEBUG] Sample ranks being saved:', Object.entries(this.rarityRanks).slice(0, 3));
      
      // Save to localStorage
      localStorage.setItem(rarityRanksKey, JSON.stringify(this.rarityRanks));
      console.log('[DEBUG] Rarity ranks saved to localStorage successfully');
      
      // ALSO save to project data so it gets saved to the project file
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData) {
        // Clear old rarity ranks to ensure fresh data
        projectData.rarityRanks = {};
        
        // Save new rarity ranks to project data
        projectData.rarityRanks = { ...this.rarityRanks };
        console.log('[DEBUG] Rarity ranks updated in project data (will be saved to file when project is saved)');
        console.log('[DEBUG] Project data now has', Object.keys(projectData.rarityRanks).length, 'rarity ranks');
      } else {
        console.warn('[DEBUG] Could not update project data - projectData not found');
      }
    } catch (error) {
      console.error('[DEBUG] Error saving rarity ranks:', error);
    }
  }

  // Load rarity ranks from project data or localStorage
  loadRarityRanks() {
    try {
      // First, try to load from project data (has priority as it's saved in the project file)
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData && projectData.rarityRanks && Object.keys(projectData.rarityRanks).length > 0) {
        this.rarityRanks = { ...projectData.rarityRanks };
        console.log('[DEBUG] Rarity ranks loaded from project data:', Object.keys(this.rarityRanks).length, 'ranks');
        console.log('[DEBUG] Sample loaded ranks from project:', Object.entries(this.rarityRanks).slice(0, 3));
        
        // Also update localStorage to keep it in sync
      const projectName = this.getProjectName();
      const rarityRanksKey = `rarityRanks_${projectName}`;
        localStorage.setItem(rarityRanksKey, JSON.stringify(this.rarityRanks));
        console.log('[DEBUG] Synced rarity ranks to localStorage');
        return true;
      }
      
      // Fallback to loading from localStorage if not in project data
      const projectName = this.getProjectName();
      const rarityRanksKey = `rarityRanks_${projectName}`;
      console.log('[DEBUG] Attempting to load rarity ranks from localStorage with key:', rarityRanksKey);
      
      let storedRanks = localStorage.getItem(rarityRanksKey);
      console.log('[DEBUG] Stored ranks data in localStorage:', storedRanks ? 'found' : 'not found');
      
      if (storedRanks) {
        this.rarityRanks = JSON.parse(storedRanks);
        console.log('[DEBUG] Rarity ranks loaded from localStorage:', Object.keys(this.rarityRanks).length, 'ranks');
        console.log('[DEBUG] Data type:', Array.isArray(this.rarityRanks) ? 'Array' : 'Object');
        console.log('[DEBUG] Sample loaded ranks:', Object.entries(this.rarityRanks).slice(0, 3));
        console.log('[DEBUG] First few keys:', Object.keys(this.rarityRanks).slice(0, 5));
        
        // Sync to project data
        if (projectData) {
          projectData.rarityRanks = { ...this.rarityRanks };
          console.log('[DEBUG] Synced rarity ranks from localStorage to project data');
        }
        return true;
      } else {
        console.log('[DEBUG] No stored rarity ranks found for project:', projectName);
        
        // Try to find any rarity ranks key with data
        const allKeys = Object.keys(localStorage);
        const rarityRankKeys = allKeys.filter(key => key.startsWith('rarityRanks_'));
        console.log('[DEBUG] Found all rarity rank keys:', rarityRankKeys);
        
        for (const key of rarityRankKeys) {
          const data = localStorage.getItem(key);
          if (data) {
            try {
              const parsed = JSON.parse(data);
              if (typeof parsed === 'object' && Object.keys(parsed).length > 0) {
                this.rarityRanks = parsed;
                console.log('[DEBUG] Successfully loaded rarity ranks from fallback key:', key, 'with', Object.keys(this.rarityRanks).length, 'ranks');
                console.log('[DEBUG] Data type:', Array.isArray(parsed) ? 'Array' : 'Object');
                console.log('[DEBUG] Sample loaded ranks:', Object.entries(this.rarityRanks).slice(0, 3));
                console.log('[DEBUG] First few keys:', Object.keys(this.rarityRanks).slice(0, 5));
                return true;
              }
            } catch (error) {
              console.error('[DEBUG] Error parsing rarity data from key:', key, error);
            }
          }
        }
        
        console.log('[DEBUG] No valid rarity ranks found in any key');
      }
    } catch (error) {
      console.error('[DEBUG] Error loading rarity ranks:', error);
    }
    return false;
  }

  // Save rarity status to project data (project file)
  saveRarityStatus(status) {
    try {
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData) {
        projectData.rarityStatus = status;
        if (status === 'updated') {
          // Also save the collection size at the time of update to detect changes
          projectData.rarityStatusCollectionSize = this.seedList ? this.seedList.length : 0;
          console.log('[DEBUG] Rarity status saved to projectData:', status, 'with collection size:', projectData.rarityStatusCollectionSize);
        } else {
          // Clear collection size if status is not updated
          delete projectData.rarityStatusCollectionSize;
          console.log('[DEBUG] Rarity status saved to projectData:', status);
        }
        
        // Also save to localStorage as backup
        const rarityStatusKey = `rarityStatus_${this.getProjectName()}`;
        const collectionSizeKey = `rarityStatusCollectionSize_${this.getProjectName()}`;
        localStorage.setItem(rarityStatusKey, status);
        if (status === 'updated' && this.seedList) {
          localStorage.setItem(collectionSizeKey, String(this.seedList.length));
        } else {
          localStorage.removeItem(collectionSizeKey);
        }
      } else {
        console.warn('[DEBUG] Cannot save rarity status - no projectData available');
      }
    } catch (error) {
      console.error('[DEBUG] Error saving rarity status:', error);
    }
  }

  // Load rarity status from project data (project file) with localStorage fallback
  loadRarityStatus() {
    try {
      // First, try to load from project data (has priority as it's saved in the project file)
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData && projectData.rarityStatus) {
        console.log('[DEBUG] Rarity status loaded from projectData:', projectData.rarityStatus);
        
        // Also load collection size if available
        const savedCollectionSize = projectData.rarityStatusCollectionSize;
        if (savedCollectionSize !== undefined) {
          console.log('[DEBUG] Rarity status collection size loaded:', savedCollectionSize);
        }
        
        return projectData.rarityStatus;
      }
      
      // Fallback to localStorage if not in project data
      const rarityStatusKey = `rarityStatus_${this.getProjectName()}`;
      const collectionSizeKey = `rarityStatusCollectionSize_${this.getProjectName()}`;
      const storedStatus = localStorage.getItem(rarityStatusKey);
      const storedCollectionSize = localStorage.getItem(collectionSizeKey);
      
      if (storedStatus) {
        console.log('[DEBUG] Rarity status loaded from localStorage:', storedStatus);
        // Migrate to projectData
        if (projectData) {
          projectData.rarityStatus = storedStatus;
          if (storedCollectionSize) {
            projectData.rarityStatusCollectionSize = parseInt(storedCollectionSize, 10);
            console.log('[DEBUG] Rarity status collection size migrated from localStorage:', projectData.rarityStatusCollectionSize);
          }
        }
        return storedStatus;
      }
      
      console.log('[DEBUG] No rarity status found');
      return null;
    } catch (error) {
      console.error('[DEBUG] Error loading rarity status:', error);
    }
    return null;
  }
  
  // Initialize rarity status from project data, checking collection size
  initializeRarityStatus() {
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData) {
      return;
    }
    
    // Load saved status and collection size
    let savedStatus = projectData.rarityStatus;
    let savedCollectionSize = projectData.rarityStatusCollectionSize;
    
    // Fallback to localStorage if not in project data
    if (!savedStatus) {
      const rarityStatusKey = `rarityStatus_${this.getProjectName()}`;
      const collectionSizeKey = `rarityStatusCollectionSize_${this.getProjectName()}`;
      savedStatus = localStorage.getItem(rarityStatusKey);
      savedCollectionSize = localStorage.getItem(collectionSizeKey);
      
      // Migrate to projectData if found
      if (savedStatus) {
        projectData.rarityStatus = savedStatus;
        if (savedCollectionSize) {
          projectData.rarityStatusCollectionSize = parseInt(savedCollectionSize, 10);
        }
      }
    }
    
    // CRITICAL: Ensure seedList is loaded before checking collection size
    const currentCollectionSize = this.seedList ? this.seedList.length : 0;
    
    // Only check for collection size mismatch if:
    // 1. Status is currently "updated" (not already outdated)
    // 2. We have a saved collection size to compare against
    // 3. Current collection size is > 0 (seedList is loaded)
    // 4. There's an actual mismatch
    // CRITICAL FIX: Only mark as outdated if we have BOTH saved status AND saved collection size
    // If collection size is missing but status is "updated", trust the status (might be from older version)
    if (savedStatus === 'updated' && savedCollectionSize !== undefined && currentCollectionSize > 0) {
      const savedSize = parseInt(savedCollectionSize, 10);
      if (savedSize !== currentCollectionSize) {
        console.log('[DEBUG] Rarity status: collection size mismatch detected:', {
          savedSize,
          currentCollectionSize,
          savedStatus
        });
        // Only mark as outdated if there's a real change (NFTs added/deleted)
        this.updateRarityStatus('outdated');
        return;
      }
    } else if (savedStatus === 'updated' && savedCollectionSize === undefined) {
      // CRITICAL FIX: If status is "updated" but collection size is missing (old project file),
      // don't mark as outdated - trust the saved status. The collection size will be saved on next save.
      console.log('[DEBUG] Rarity status is "updated" but collection size not found - trusting saved status (may be from older version)');
    }
    
    // CRITICAL: Check if rarity ranks actually exist before showing "updated"
    // If no rarity ranks exist, always show '---' regardless of saved status
    if (!projectData.rarityRanks || Object.keys(projectData.rarityRanks).length === 0) {
      this.updateRarityStatus('---');
      return;
    }
    
    // If status is updated or outdated, use it (don't override unnecessarily)
    if (savedStatus === 'updated' || savedStatus === 'outdated') {
      this.updateRarityStatus(savedStatus);
    } else {
      this.updateRarityStatus('---');
    }
  }

  // Get project name for localStorage keys
  getProjectName() {
    const projectService = window.NFTApp.getModule('projectService');
    const projectData = projectService ? projectService.projectData : null;
    const projectName = projectData ? projectData.name : 'default';
    
    console.log('[DEBUG] getProjectName called:');
    console.log('[DEBUG] - projectService exists:', !!projectService);
    console.log('[DEBUG] - projectData exists:', !!projectData);
    console.log('[DEBUG] - projectName:', projectName);
    
    return projectName;
  }

  // Debug method to check localStorage contents
  debugLocalStorage() {
    console.log('[DEBUG] ===== LOCALSTORAGE DEBUG =====');
    
    // Check project name
    const projectName = this.getProjectName();
    console.log('[DEBUG] Current project name:', projectName);
    
    // Check all localStorage keys
    const allKeys = Object.keys(localStorage);
    console.log('[DEBUG] All localStorage keys:', allKeys);
    
    // Check rarity-related keys
    const rarityKeys = allKeys.filter(key => key.includes('rarity'));
    console.log('[DEBUG] Rarity-related keys:', rarityKeys);
    
    // Check project-specific keys
    const projectKeys = allKeys.filter(key => key.includes(projectName));
    console.log('[DEBUG] Project-specific keys:', projectKeys);
    
    // Check specific rarity ranks key
    const rarityRanksKey = `rarityRanks_${projectName}`;
    const rarityRanksData = localStorage.getItem(rarityRanksKey);
    console.log('[DEBUG] Rarity ranks key:', rarityRanksKey);
    console.log('[DEBUG] Rarity ranks data exists:', !!rarityRanksData);
    if (rarityRanksData) {
      try {
        const parsed = JSON.parse(rarityRanksData);
        console.log('[DEBUG] Rarity ranks count:', Object.keys(parsed).length);
        console.log('[DEBUG] Sample rarity ranks:', Object.entries(parsed).slice(0, 3));
      } catch (error) {
        console.error('[DEBUG] Error parsing rarity ranks data:', error);
      }
    }
    
    // Check rarity status key
    const rarityStatusKey = `rarityStatus_${projectName}`;
    const rarityStatusData = localStorage.getItem(rarityStatusKey);
    console.log('[DEBUG] Rarity status key:', rarityStatusKey);
    console.log('[DEBUG] Rarity status data:', rarityStatusData);
    
    console.log('[DEBUG] ===== END LOCALSTORAGE DEBUG =====');
  }

  // Force reload rarity ranks from localStorage
  forceReloadRarityRanks() {
    console.log('[DEBUG] Force reloading rarity ranks...');
    const rarityRanksLoaded = this.loadRarityRanks();
    console.log('[DEBUG] Force reload result:', rarityRanksLoaded);
    console.log('[DEBUG] Rarity ranks count after force reload:', Object.keys(this.rarityRanks).length);
    return rarityRanksLoaded;
  }

  // Update collection space counter
  updateCollectionSpaceCounter() {
    console.log('[DEBUG] updateCollectionSpaceCounter called');
    try {
      // Use seedList from modal instance which is already loaded from localStorage
      // CRITICAL: Use this.seedList.length instead of reloading from localStorage
      const currentCollectionSize = this.seedList ? this.seedList.length : 0;
      console.log('[DEBUG] Current collection size from this.seedList:', currentCollectionSize);
      
      // Get total supply with proper comma handling (same as batch generation modal)
      const getTotalSupply = () => {
        const totalSupplyInput = document.getElementById('total-supply');
        if (totalSupplyInput && totalSupplyInput.value) {
          // Remove commas, dots, and other formatting characters before parsing
          const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
          return parseInt(cleanValue, 10) || 0;
        }
        // Fallback to project data if input field is empty
        const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
        if (projectData && typeof projectData.totalSupply !== 'undefined' && projectData.totalSupply !== null && projectData.totalSupply !== '') {
          return parseInt(projectData.totalSupply, 10);
        } else if (projectData && typeof projectData.size !== 'undefined' && projectData.size !== null && projectData.size !== '') {
          return parseInt(projectData.size, 10);
        }
        return 0;
      };
      
      const maxCollectionSize = getTotalSupply();
      const availableSpace = Math.max(0, maxCollectionSize - currentCollectionSize);

      const availableSpaceElement = document.getElementById('saved-seeds-available-space');
      const totalSpaceElement = document.getElementById('saved-seeds-total-space');
      
      console.log('[DEBUG] Collection space counter elements found:', {
        availableSpaceElement: !!availableSpaceElement,
        totalSpaceElement: !!totalSpaceElement
      });
      
      console.log('[DEBUG] Saved seeds collection space counter update:', {
        current: currentCollectionSize,
        max: maxCollectionSize,
        available: availableSpace,
        seedListKey: this.seedListKey,
        availableSpaceElement: availableSpaceElement,
        totalSpaceElement: totalSpaceElement
      });
      
      if (availableSpaceElement && totalSpaceElement) {
        availableSpaceElement.textContent = availableSpace.toLocaleString();
        totalSpaceElement.textContent = maxCollectionSize ? maxCollectionSize.toLocaleString() : '0';
        
        console.log('[DEBUG] Saved seeds collection space counter updated successfully');
      } else {
        console.warn('[DEBUG] Counter elements not found:', {
          availableSpaceElement: availableSpaceElement,
          totalSpaceElement: totalSpaceElement
        });
      }
      
      // Update recalculate button state
      this.updateRecalculateButtonState();
    } catch (error) {
      console.error('[DEBUG] Error updating saved seeds collection space counter:', error);
    }
  }

  // Update Calculate Trait Rarities button state based on collection completeness
  updateRecalculateButtonState() {
    const rerenderBtn = this.modal?.querySelector('#rerender-thumbnails');
    if (!rerenderBtn) return;

    try {
      // Get current collection size
      const currentCollectionSize = this.seedList ? this.seedList.length : 0;
      
      // Get total supply
      const getTotalSupply = () => {
        const totalSupplyInput = document.getElementById('total-supply');
        if (totalSupplyInput && totalSupplyInput.value) {
          const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
          return parseInt(cleanValue, 10) || 0;
        }
        const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
        if (projectData && typeof projectData.totalSupply !== 'undefined' && projectData.totalSupply !== null && projectData.totalSupply !== '') {
          return parseInt(projectData.totalSupply, 10);
        } else if (projectData && typeof projectData.size !== 'undefined' && projectData.size !== null && projectData.size !== '') {
          return parseInt(projectData.size, 10);
        }
        return 0;
      };
      
      const maxCollectionSize = getTotalSupply();
      const isComplete = maxCollectionSize > 0 && currentCollectionSize >= maxCollectionSize;

      // Enable/disable button based on completeness
      rerenderBtn.disabled = !isComplete;
      rerenderBtn.style.opacity = isComplete ? '1' : '0.5';
      rerenderBtn.style.cursor = isComplete ? 'pointer' : 'not-allowed';
      // Ensure tooltip works even when disabled by keeping title attribute and allowing pointer events
      rerenderBtn.style.pointerEvents = isComplete ? 'auto' : 'auto'; // Always allow for tooltip
    } catch (error) {
      console.error('[DEBUG] Error updating recalculate button state:', error);
      rerenderBtn.disabled = true;
      rerenderBtn.style.opacity = '0.5';
    }
  }

  // Calculate trait rarities based on actual collection usage
  async recalculateTraitRarities() {
    // Note: We don't check if button is disabled here because the click handler
    // disables it to show loading state, and we don't want to return early.
    // The click handler already checks if button is disabled before calling this.

    // Check if collection is complete
    const currentCollectionSize = this.seedList ? this.seedList.length : 0;
    const getTotalSupply = () => {
      const totalSupplyInput = document.getElementById('total-supply');
      if (totalSupplyInput && totalSupplyInput.value) {
        const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
        return parseInt(cleanValue, 10) || 0;
      }
      const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
      if (projectData && typeof projectData.totalSupply !== 'undefined' && projectData.totalSupply !== null && projectData.totalSupply !== '') {
        return parseInt(projectData.totalSupply, 10);
      } else if (projectData && typeof projectData.size !== 'undefined' && projectData.size !== null && projectData.size !== '') {
        return parseInt(projectData.size, 10);
      }
      return 0;
    };
    
    const maxCollectionSize = getTotalSupply();
    if (maxCollectionSize === 0 || currentCollectionSize < maxCollectionSize) {
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          `Collection must be 100% complete (${currentCollectionSize}/${maxCollectionSize}) to recalculate rarities.`,
          "warning",
          3000
        );
      }
      return;
    }

    // Get project data
    const projectData = window.NFTApp.getModule('generateNftsUI')?.projectData || window.currentProject;
    if (!projectData || !projectData.traits) {
      console.error('[DEBUG] No project data available');
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "No project data available. Please ensure you have a project with trait layers loaded.",
          "error",
          4000
        );
      }
      return;
    }

    // Create progress popup
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    `;

    const recalcPopup = document.createElement('div');
    recalcPopup.id = 'recalculate-rarities-popup';
    recalcPopup.className = 'scan-progress-popup';
    recalcPopup.innerHTML = `
      <div class="scan-title-container" style="text-align: left; margin-bottom: 20px;">
        <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">Recalculating Trait Rarities</div>
        <div class="scan-subtitle" id="recalc-phase-status" style="font-size: 14px; color: #ffffff;">Initializing...</div>
      </div>
      <div class="scan-percentage" id="recalc-percentage">
        0%<span class="scan-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
      <div class="scan-progress-info" id="recalc-main-progress" style="font-size: 14px; color: #ffffff; margin-bottom: 8px;">
        <span id="recalc-current-item">Starting...</span>
      </div>
      <div class="scan-progress-info" id="recalc-current-detail" style="font-size: 12px; color: #ffffff; margin-bottom: 10px; min-height: 18px; font-style: italic;">
        <span id="recalc-detail-text"></span>
      </div>
      <div class="scan-eta" id="recalc-eta" style="font-size: 13px; color: #ffffff; margin-bottom: 15px; min-height: 20px;">
        Calculating time remaining...
      </div>
      <button class="scan-cancel-btn" id="recalc-cancel-btn">Cancel</button>
      <div style="margin-top: 20px; padding-top: 15px; border-top: 1px solid rgba(255, 255, 255, 0.1); font-size: 11px; color: #ffffff; line-height: 1.4; text-align: left;">
        * The trait rarities calculation will update the project rarities for traits and trait layers<br>
        with great accuracy regarding the actual use of each trait across the entire collection.
      </div>
    `;
    overlay.appendChild(recalcPopup);
    document.body.appendChild(overlay);

    let isCancelled = false;
    const cancelBtn = document.getElementById('recalc-cancel-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        isCancelled = true;
        overlay.remove();
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show("Rarity recalculation cancelled", "info", 2000);
        }
      };
    }

    try {
      // Get DOM elements for progress updates (declared once, reused throughout)
      const percentageEl = document.getElementById('recalc-percentage');
      const phaseStatusEl = document.getElementById('recalc-phase-status');
      const currentItemEl = document.getElementById('recalc-current-item');
      const detailTextEl = document.getElementById('recalc-detail-text');
      const etaEl = document.getElementById('recalc-eta');

      // Get all unique traits from project data
      const allTraits = [];
      projectData.traits.forEach(layer => {
        if (layer.traits && Array.isArray(layer.traits)) {
          layer.traits.forEach(trait => {
            allTraits.push({ layerId: layer.id, layerName: layer.name, traitId: trait.id, traitName: trait.name });
          });
        }
      });

      const totalTraits = allTraits.length;
      const traitUsageCounts = new Map(); // Map<string, number> - key: "layerId:traitId"

      // Initialize usage counts
      allTraits.forEach(({ layerId, traitId }) => {
        traitUsageCounts.set(`${layerId}:${traitId}`, 0);
      });

      // Update UI with initial status
      
      if (phaseStatusEl) {
        phaseStatusEl.textContent = 'Phase 1: Analyzing NFT collection...';
      }
      
      if (currentItemEl) {
        currentItemEl.textContent = `Preparing to scan ${this.seedList.length.toLocaleString()} NFTs...`;
      }
      
      if (detailTextEl) {
        detailTextEl.textContent = `Found ${totalTraits.toLocaleString()} unique traits across ${projectData.traits.length} layers`;
      }

      // Count trait usage across all NFTs
      // CRITICAL: Need to generate NFT from seed to get traits (seeds are stored as { seed: "..." } only)
      const generateNftsModule = window.NFTApp.getModule('generateNfts');
      if (!generateNftsModule || !generateNftsModule.generateSingleNFT) {
        console.error('[DEBUG] Generate NFTs module or generateSingleNFT method not found');
        overlay.remove();
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(
            "Error: Cannot generate NFTs from seeds. Please refresh the page.",
            "error",
            3000
          );
        }
        return;
      }

      const startTime = Date.now();
      let lastPercentageMilestone = 0;
      let processedNFTs = 0;

      // Update progress immediately to show we've started
      
      if (percentageEl) {
        const dotsHTML = percentageEl.querySelector('.scan-dots');
        if (dotsHTML && percentageEl.childNodes[0]) {
          percentageEl.childNodes[0].textContent = '0%';
        }
      }
      
      if (currentItemEl) {
        currentItemEl.textContent = `Starting scan: 0 / ${this.seedList.length.toLocaleString()} NFTs`;
      }
      
      if (detailTextEl) {
        detailTextEl.textContent = 'Beginning analysis...';
      }

      for (let i = 0; i < this.seedList.length; i++) {
        if (isCancelled) break;

        const seedObj = this.seedList[i];
        const seedNumber = seedObj && seedObj.seed ? String(seedObj.seed) : (typeof seedObj === 'string' ? seedObj : null);
        
        if (!seedNumber) {
          console.warn('[DEBUG] Skipping invalid seed at index', i, ':', seedObj);
          processedNFTs++;
          continue;
        }

        try {
          let traitsToProcess = [];
          
          // First, try to use saved traits from seed (if available and valid)
          if (seedObj && seedObj.traits && Array.isArray(seedObj.traits) && seedObj.traits.length > 0) {
            traitsToProcess = seedObj.traits;
          } else {
            // Generate NFT from seed to get its traits
            const nft = await generateNftsModule.generateSingleNFT(projectData, false, seedNumber);
            if (nft && nft.traits && Array.isArray(nft.traits)) {
              traitsToProcess = nft.traits;
            }
          }
          
          // Process traits and count usage
          if (traitsToProcess.length > 0) {
            traitsToProcess.forEach((traitInfo, traitIdx) => {
              // Skip 'none' traits
              if (!traitInfo || 
                  traitInfo === 'none' || 
                  (traitInfo.trait && (traitInfo.trait === 'none' || traitInfo.trait.name === 'none')) ||
                  (traitInfo.traitName === 'none') ||
                  (typeof traitInfo === 'string' && traitInfo === 'none')) {
                return;
              }
              
              // Handle different trait structure formats
              let layerId = traitInfo.layer?.id || traitInfo.layerId;
              let traitId = traitInfo.trait?.id || traitInfo.traitId;
              let layerName = traitInfo.layer?.name || traitInfo.layerName;
              let traitName = traitInfo.trait?.name || traitInfo.traitName;
              
              // If IDs are missing, try to find by name
              if (!layerId || !traitId) {
                if (layerName && traitName && projectData && projectData.traits) {
                  // Find layer by name
                  const foundLayer = projectData.traits.find(l => 
                    l.name === layerName || l.id === layerId || 
                    (typeof l.name === 'string' && typeof layerName === 'string' && l.name.toLowerCase() === layerName.toLowerCase())
                  );
                  if (foundLayer) {
                    layerId = foundLayer.id;
                    // Find trait by name within the found layer
                    if (foundLayer.traits && Array.isArray(foundLayer.traits)) {
                      const foundTrait = foundLayer.traits.find(t => 
                        t.name === traitName || t.id === traitId ||
                        (typeof t.name === 'string' && typeof traitName === 'string' && t.name.toLowerCase() === traitName.toLowerCase())
                      );
                      if (foundTrait) {
                        traitId = foundTrait.id;
                      }
                    }
                  }
                }
              }
              
              // Only count if we have valid IDs
              if (layerId && traitId) {
                const key = `${layerId}:${traitId}`;
                if (traitUsageCounts.has(key)) {
                  const currentCount = traitUsageCounts.get(key);
                  traitUsageCounts.set(key, currentCount + 1);
                } else {
                  // This trait combination wasn't in our initialized map, but we found it in use
                  // Initialize it to 1
                  traitUsageCounts.set(key, 1);
                }
              } else if (traitIdx < 5 || (i < 10 && traitIdx === 0)) {
                // Only warn for first few traits to avoid spam
                console.warn('[DEBUG] Could not determine layerId/traitId for trait:', {
                  layerId, traitId, layerName, traitName,
                  traitInfoStructure: Object.keys(traitInfo || {})
                });
              }
            });
          } else {
            console.warn('[DEBUG] Seed', seedNumber.substring(0, 20), 'has no traits');
          }
        } catch (error) {
          console.error('[DEBUG] Error processing seed', seedNumber.substring(0, 20), ':', error);
        }

        processedNFTs++;

        // Update progress every 10 NFTs or at milestones
        if (processedNFTs % 10 === 0 || processedNFTs === this.seedList.length) {
          const nftProgress = (processedNFTs / this.seedList.length) * 50; // First 50% is counting NFTs
          
          // Calculate actual percentage (0-100%) based on collection size
          // For example: 10/1000 = 1%, not rounded
          const actualPercentage = Math.floor((processedNFTs / this.seedList.length) * 100);

          // Update progress popup

          if (percentageEl) {
            const dotsHTML = percentageEl.querySelector('.scan-dots');
            if (dotsHTML && percentageEl.childNodes[0]) {
              percentageEl.childNodes[0].textContent = `${actualPercentage}%`;
            }
          }

          // Update phase status and main progress for Phase 1: NFT Analysis
          if (phaseStatusEl) {
            phaseStatusEl.textContent = 'Phase 1: Analyzing NFT collection...';
          }
          
          if (currentItemEl) {
            currentItemEl.textContent = `Scanning NFTs: ${processedNFTs.toLocaleString()} / ${this.seedList.length.toLocaleString()}`;
          }
          
          if (detailTextEl) {
            const remainingNFTs = this.seedList.length - processedNFTs;
            if (remainingNFTs > 0) {
              detailTextEl.textContent = `Counting trait usage across ${remainingNFTs.toLocaleString()} remaining NFTs...`;
            } else {
              detailTextEl.textContent = 'Analysis complete. Calculating rarities...';
            }
          }

          // Update ETA for NFT counting phase
          if (etaEl && processedNFTs < this.seedList.length) {
            const currentPercentage = Math.floor(nftProgress);
            const currentMilestone = Math.floor(currentPercentage / 5) * 5;
            
            const shouldUpdateETA = (currentPercentage >= 1 && lastPercentageMilestone === 0) || 
                                  (currentMilestone >= 5 && currentMilestone > lastPercentageMilestone);
            
            if (shouldUpdateETA) {
              lastPercentageMilestone = currentMilestone > 0 ? currentMilestone : 1;
              
              const elapsedMs = Date.now() - startTime;
              const avgTimePerNFT = elapsedMs / processedNFTs;
              const remainingNFTs = this.seedList.length - processedNFTs;
              const estimatedRemainingMs = avgTimePerNFT * remainingNFTs;
              
              const totalMinutes = Math.ceil(estimatedRemainingMs / 60000);
              let timeText;
              if (totalMinutes < 60) {
                timeText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
              } else {
                const hours = Math.floor(totalMinutes / 60);
                const minutes = totalMinutes % 60;
                if (minutes > 0) {
                  timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
                } else {
                  timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
                }
              }
              
              etaEl.textContent = `Calculating time remaining... (${timeText})`;
            }
          }

          // Small delay to allow UI update - uses MessageChannel for background tabs
          if (typeof yieldToBrowser === 'function') {
            await yieldToBrowser();
          } else {
            // Fallback if utility function not available
            await new Promise(resolve => {
              if (!document.hidden) {
                requestAnimationFrame(() => setTimeout(resolve, 0));
              } else {
                const channel = new MessageChannel();
                channel.port1.onmessage = () => {
                  channel.port1.close();
                  channel.port2.close();
                  resolve();
                };
                channel.port2.postMessage(null);
              }
            });
          }
        }
      }

      if (isCancelled) return;

      // Debug: Log usage counts summary
      const totalCounts = Array.from(traitUsageCounts.values()).reduce((sum, count) => sum + count, 0);
      console.log('[DEBUG] Recalculate rarities - Total trait usage counts:', totalCounts);
      console.log('[DEBUG] Recalculate rarities - Unique trait combinations found:', traitUsageCounts.size);
      console.log('[DEBUG] Recalculate rarities - Total NFTs processed:', this.seedList.length);
      
      if (totalCounts === 0) {
        console.error('[DEBUG] WARNING: No trait usage counts recorded! This will result in all rarities being 0.');
        console.error('[DEBUG] Check if seed traits structure matches project trait IDs.');
      }

      // Now calculate rarities (second phase - 50% to 100%)
      // CRITICAL FIX: Track actual Phase 2 start time for accurate elapsed time calculation
      const phase2StartTime = Date.now();
      let processedTraits = 0;
      const totalNFTs = this.seedList.length;

      for (let i = 0; i < allTraits.length; i++) {
        if (isCancelled) break;

        const { layerId, traitId } = allTraits[i];
        const key = `${layerId}:${traitId}`;
        const usageCount = traitUsageCounts.get(key) || 0;
        
        // Calculate rarity as percentage
        const rarity = totalNFTs > 0 ? (usageCount / totalNFTs) * 100 : 0;

        // Update trait rarity in project data
        const layer = projectData.traits.find(l => l.id === layerId);
        if (layer && layer.traits) {
          const trait = layer.traits.find(t => t.id === traitId);
          if (trait) {
            trait.rarity = rarity;
            // Debug log for traits with non-zero usage
            if (usageCount > 0) {
              console.log(`[DEBUG] Trait ${trait.name} (${layer.name}): ${usageCount} uses, ${rarity.toFixed(2)}% rarity`);
            }
          } else {
            console.warn(`[DEBUG] Trait not found in layer: layerId=${layerId}, traitId=${traitId}`);
          }
        } else {
          console.warn(`[DEBUG] Layer not found: layerId=${layerId}`);
        }

        processedTraits++;

        // Update progress (50% to 100%)
        const traitProgress = 50 + ((processedTraits / totalTraits) * 50);
        
        // Calculate actual percentage for Phase 2
        // Phase 1 accounts for 50%, Phase 2 accounts for remaining 50%
        const phase2Percentage = Math.floor((processedTraits / totalTraits) * 50);
        const actualPercentage = 50 + phase2Percentage;

        if (percentageEl) {
          const dotsHTML = percentageEl.querySelector('.scan-dots');
          if (dotsHTML && percentageEl.childNodes[0]) {
            percentageEl.childNodes[0].textContent = `${actualPercentage}%`;
          }
        }

        // Update phase status and main progress for Phase 2: Trait Rarity Updates
        if (phaseStatusEl) {
          phaseStatusEl.textContent = 'Phase 2: Updating trait rarities...';
        }
        
        if (currentItemEl) {
          currentItemEl.textContent = `Updating rarities: ${processedTraits.toLocaleString()} / ${totalTraits.toLocaleString()} traits`;
        }
        
        // Show current trait being processed
        if (detailTextEl) {
          const { layerName, traitName } = allTraits[i];
          const usageCount = traitUsageCounts.get(key) || 0;
          const rarity = totalNFTs > 0 ? ((usageCount / totalNFTs) * 100) : 0;
          
          if (layerName && traitName) {
            detailTextEl.textContent = `${layerName} > ${traitName} (Used: ${usageCount.toLocaleString()} / ${totalNFTs.toLocaleString()} NFTs, Rarity: ${rarity.toFixed(2)}%)`;
          } else {
            detailTextEl.textContent = `Processing trait ${processedTraits} of ${totalTraits}...`;
          }
        }

        // Update ETA for trait processing phase
        if (etaEl && processedTraits < totalTraits) {
          // CRITICAL FIX: Use actual Phase 2 start time instead of approximation
          const elapsedMs = Date.now() - phase2StartTime;
          const avgTimePerTrait = elapsedMs / processedTraits;
          const remainingTraits = totalTraits - processedTraits;
          const estimatedRemainingMs = avgTimePerTrait * remainingTraits;
          
          const totalMinutes = Math.ceil(estimatedRemainingMs / 60000);
          let timeText;
          if (totalMinutes < 1) {
            timeText = 'Less than a minute';
          } else if (totalMinutes < 60) {
            timeText = `${totalMinutes} minute${totalMinutes !== 1 ? 's' : ''}`;
          } else {
            const hours = Math.floor(totalMinutes / 60);
            const minutes = totalMinutes % 60;
            if (minutes > 0) {
              timeText = `${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
              timeText = `${hours} hour${hours !== 1 ? 's' : ''}`;
            }
          }
          
          etaEl.textContent = `Calculating time remaining... (${timeText})`;
        }

        // Small delay to allow UI update
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      if (isCancelled) return;

      // Update UI to show completion phase
      
      if (percentageEl) {
        const dotsHTML = percentageEl.querySelector('.scan-dots');
        if (dotsHTML && percentageEl.childNodes[0]) {
          percentageEl.childNodes[0].textContent = '100%';
        }
      }
      
      if (phaseStatusEl) {
        phaseStatusEl.textContent = 'Finalizing...';
      }
      
      if (currentItemEl) {
        currentItemEl.textContent = 'All traits processed!';
      }
      
      if (detailTextEl) {
        detailTextEl.textContent = 'Calculating layer rarities and saving project...';
      }
      
      if (etaEl) {
        etaEl.textContent = 'Almost done...';
      }

      // Calculate layer rarities (sum of all traits in each layer)
      projectData.traits.forEach(layer => {
        if (layer.traits && Array.isArray(layer.traits)) {
          const layerRarity = layer.traits.reduce((sum, trait) => sum + (trait.rarity || 0), 0);
          layer.rarity = layerRarity;
        }
      });

      // Save project data
      if (window.NFTApp && window.NFTApp.getModule('projectService')) {
        const projectService = window.NFTApp.getModule('projectService');
        if (typeof projectService.saveProjectData === 'function') {
          projectService.saveProjectData();
        } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
          window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false });
        }
      } else if (window.MemoryManager && typeof window.MemoryManager.updateProject === 'function') {
        window.MemoryManager.updateProject({ traits: projectData.traits }, { syncToModules: false });
      }

      // Update trait layers UI
      if (window.NFTApp && window.NFTApp.getModule('traitLayers')) {
        const traitLayersModule = window.NFTApp.getModule('traitLayers');
        if (traitLayersModule.updateTraitLayerUI) {
          traitLayersModule.updateTraitLayerUI(projectData);
        }
      }

      // Close popup
      overlay.remove();

      // Mark rerender button as updated (trait rarities have been recalculated)
      this.updateButtonState('rerender', true);

      // Mark trait rarities status as updated
      this.updateTraitRaritiesStatus('updated');

      // Show success popup
      this.showSuccessPopup("Trait rarities successfully recalculated and updated in the Traits & Rules tab!");

      console.log('[DEBUG] Trait rarities recalculation completed successfully');
    } catch (error) {
      console.error('[DEBUG] Error recalculating trait rarities:', error);
      overlay.remove();
      
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "Error recalculating trait rarities. Please try again.",
          "error",
          3000
        );
      }
    }
  }
}

// Make it globally available
window.SavedSeedsModal = SavedSeedsModal;

// Global unified counter update system
window.updateAllCounters = function() {
  // CRITICAL: Check if "Please Wait" popup is showing - don't update counters until it's hidden
  const generateNftsTab = document.getElementById('generate-nfts');
  let popup = generateNftsTab ? generateNftsTab.querySelector('.nft-rendering-popup') : null;
  if (!popup) {
    popup = document.querySelector('.nft-rendering-popup');
  }
  // Also check for "Please Wait" popup
  const pleaseWaitPopup = document.getElementById('nft-edit-please-wait-popup');
  if (popup || pleaseWaitPopup) {
    console.log('[DEBUG] updateAllCounters: Popup is still showing, skipping counter updates');
    return; // Don't update counters while popup is visible
  }
  
  // console.log('[DEBUG] updateAllCounters called - updating all 4 counters');
  
  try {
    // Get current collection data
    const generateNftsUIModule = window.NFTApp.getModule('generateNftsUI');
    const projectData = generateNftsUIModule?.projectData || window.currentProject;
    
    if (!projectData) {
      console.warn('[DEBUG] No project data available for counter updates');
      return;
    }
    
    // Get the correct localStorage key for the current project
    const getSeedListKey = (project) => {
      return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
    };
    
    const seedListKey = getSeedListKey(projectData);
    
    // CRITICAL FIX: Check if modal instance exists and use its seedList if available
    let currentCount = 0;
    let savedSeeds = [];
    if (window.savedSeedsModalInstance && window.savedSeedsModalInstance.seedList) {
      currentCount = window.savedSeedsModalInstance.seedList.length;
      savedSeeds = window.savedSeedsModalInstance.seedList;
      console.log('[DEBUG] Using seedList from modal instance:', currentCount, 'items');
    } else {
      // Fallback to reading from localStorage
      try {
        savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
        currentCount = savedSeeds.length;
        console.log('[DEBUG] Using seedList from localStorage:', currentCount, 'items');
      } catch (parseError) {
        console.error('[DEBUG] Error parsing seed list:', parseError);
        savedSeeds = [];
        currentCount = 0;
      }
    }
    
    // Get total supply with proper comma handling (same as batch generation modal)
    const getTotalSupply = () => {
      const totalSupplyInput = document.getElementById('total-supply');
      if (totalSupplyInput && totalSupplyInput.value) {
        // Remove commas, dots, and other formatting characters before parsing
        const cleanValue = totalSupplyInput.value.replace(/[,.]/g, '');
        return parseInt(cleanValue, 10) || 0;
      }
      if (projectData && typeof projectData.totalSupply !== 'undefined' && projectData.totalSupply !== null && projectData.totalSupply !== '') {
        return parseInt(projectData.totalSupply, 10);
      } else if (projectData && typeof projectData.size !== 'undefined' && projectData.size !== null && projectData.size !== '') {
        return parseInt(projectData.size, 10);
      }
      return 0;
    };
    
    const totalSupply = getTotalSupply();
    const availableSpace = Math.max(0, totalSupply - currentCount);
    
    // console.log('[DEBUG] Counter update data:', { 
    //   currentCount, 
    //   totalSupply, 
    //   availableSpace, 
    //   seedListKey,
    //   savedSeedsFromLocalStorage: savedSeeds.length,
    //   projectData: projectData
    // });
    
    // 1. Update seed counter (seed-list-counter)
    if (generateNftsUIModule && generateNftsUIModule.refreshSeedListCounter) {
      generateNftsUIModule.refreshSeedListCounter(true); // Force refresh
    }
    
    // 2. Update NFT count text (nft-count-text)
    if (window.updateNftCountPanel) {
      window.updateNftCountPanel();
    }
    
    // 3. Update batch generation collection space counter
    // CRITICAL: Only update if we have valid data and the batch generation modal instance exists
    // This prevents overwriting with incorrect data when modal instance isn't loaded yet
    const batchAvailableSpace = document.getElementById('available-space');
    const batchTotalSpace = document.getElementById('total-space');
    if (batchAvailableSpace && batchTotalSpace) {
      // Verify the count makes sense - if availableSpace equals totalSupply, double-check
      // This prevents showing incorrect "10000/10000" when there are actually NFTs
      if (availableSpace === totalSupply && currentCount === 0 && totalSupply > 0) {
        // Might have incorrect count - verify from localStorage directly
        const verifyKey = 'nftSeedList_' + (projectData && projectData.name ? encodeURIComponent(projectData.name) : 'default');
        try {
          const verifySeeds = JSON.parse(localStorage.getItem(verifyKey) || '[]');
          const verifyCount = Array.isArray(verifySeeds) ? verifySeeds.length : 0;
          if (verifyCount > 0) {
            // We have a mismatch - use the verified count
            const correctedAvailableSpace = Math.max(0, totalSupply - verifyCount);
            batchAvailableSpace.textContent = correctedAvailableSpace.toLocaleString();
            console.log('[DEBUG] Corrected batch generation counter - verified count:', verifyCount, 'available:', correctedAvailableSpace);
          } else {
            // Verified count is also 0, so the display is correct
            batchAvailableSpace.textContent = availableSpace.toLocaleString();
          }
        } catch (verifyError) {
          // Error verifying - use calculated value
          batchAvailableSpace.textContent = availableSpace.toLocaleString();
        }
      } else {
        // Count looks valid - use it
        batchAvailableSpace.textContent = availableSpace.toLocaleString();
      }
      batchTotalSpace.textContent = totalSupply ? totalSupply.toLocaleString() : '0';
      // console.log('[DEBUG] Batch generation collection space counter updated');
    }
    
    // 4. Update NFT collection collection space counter
    const savedSeedsAvailableSpace = document.getElementById('saved-seeds-available-space');
    const savedSeedsTotalSpace = document.getElementById('saved-seeds-total-space');
    if (savedSeedsAvailableSpace && savedSeedsTotalSpace) {
      savedSeedsAvailableSpace.textContent = availableSpace.toLocaleString();
      savedSeedsTotalSpace.textContent = totalSupply ? totalSupply.toLocaleString() : '0';
      // console.log('[DEBUG] NFT collection collection space counter updated');
    }
    
    // console.log('[DEBUG] All 4 counters updated successfully');
    
  } catch (error) {
    console.error('[DEBUG] Error updating all counters:', error);
  }
};

// Global test function for debugging
window.testRarityCalculation = async function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (modal && modal.testRarityCalculation) {
    await modal.testRarityCalculation();
  }
};

// Global debug function for localStorage
window.debugRarityStorage = function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (modal && modal.debugLocalStorage) {
    modal.debugLocalStorage();
  } else {
    console.error('SavedSeedsModal not found or debugLocalStorage method not available');
  }
};

// Global function to force reload rarity ranks
window.forceReloadRarityRanks = function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (modal && modal.forceReloadRarityRanks) {
    return modal.forceReloadRarityRanks();
  } else {
    console.error('SavedSeedsModal not found or forceReloadRarityRanks method not available');
    return false;
  }
};

// Manual rarity calculation test
window.manualRarityTest = async function() {
  const modal = document.getElementById('saved-seeds-modal');
  if (!modal) {
    return;
  }
  
  const modalInstance = modal.savedSeedsModalInstance;
  if (!modalInstance) {
    return;
  }
  
  // Reset flags
  modalInstance.rarityCalculationInProgress = false;
  modalInstance.rarityCalculationComplete = false;
  modalInstance.rarityRanks = {};
  
  // Show loading tip
  modalInstance.showRarityCalculationTip();
  
  // Calculate rarity
  await modalInstance.calculateRarityRanks();
  
  // Hide loading tip
  modalInstance.hideRarityCalculationTip();
  
  // Re-render
  modalInstance.renderPage(modalInstance.currentPage);
};

// Global test function for drag and drop
window.testDragAndDrop = function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (modal && modal.setupDragAndDropForAllCards) {
    modal.setupDragAndDropForAllCards();
  }
};

// Global function to check drag and drop status
window.checkDragAndDropStatus = function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (!modal) {
    return;
  }
  
  const grid = modal.modal?.querySelector('#saved-seeds-grid');
  if (!grid) {
    return;
  }
  
  const cards = grid.querySelectorAll('.saved-seed-card');
  
  cards.forEach((card, index) => {
    const globalIndex = parseInt(card.dataset.index);
    const seed = card.dataset.seed;
    const draggable = card.draggable;
  });
};

// Global function for testing rarity rank display
window.testRarityDisplay = function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (modal && modal.testForceShowRarityRanks) {
    modal.testForceShowRarityRanks();
  }
};

// Global function for checking rarity visibility
window.checkRarityVisibility = function() {
  const modal = window.NFTApp.getModule('savedSeedsModal');
  if (modal && modal.testCheckRarityVisibility) {
    modal.testCheckRarityVisibility();
  }
};

// Global comprehensive debugging function
window.debugSavedSeedsModal = function() {
  // Check if modal exists
  const modal = document.getElementById('saved-seeds-modal');
  
  if (modal) {
    // Check grid
    const grid = modal.querySelector('#saved-seeds-grid');
    
    if (grid) {
      // Check cards
      const cards = grid.querySelectorAll('.saved-seed-card');
      
      cards.forEach((card, index) => {
        // Check event listeners
        const dragStartListeners = getEventListeners ? getEventListeners(card).dragstart : 'unknown';
        const dragEndListeners = getEventListeners ? getEventListeners(card).dragend : 'unknown';
      });
      
      // Check rarity ranks
      const modalInstance = modal.savedSeedsModalInstance;
      if (modalInstance) {
        // Modal instance exists
      }
    }
  }
};
