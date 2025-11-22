# Project Loading Operations - Complete List

This document lists all operations that occur behind the scenes while the "project loading..." window is displayed.

## Phase 1: Initial Setup & File Reading

1. **Loading Flag Management**
   - Set `isLoading = true` to prevent concurrent loads
   - Check if another project is already loading (show warning if so)

2. **Navigation Actions Positioning**
   - Apply `nav-actions` transform (`translateX(-161px)`) to prevent movement during load
   - Set margin-left, position, right, and left properties
   - Call navigation module's `applyNavActionsTransform()` function

3. **Loading Animation Display**
   - Create or update loading overlay element
   - Set loading message ("Loading project...")
   - Display overlay with high z-index (99999)
   - Start JavaScript-based spinner animation immediately
   - Set up visibility change listeners to restart animation when tab becomes visible
   - Set up window focus/blur handlers for browser minimize/maximize

4. **File Information Storage**
   - Store file directory path in localStorage (`nftcc_lastProjectDir`)
   - Store file path/handle in localStorage (`nftcc_lastProjectPath`)
   - Store file name in localStorage (`nftcc_lastProjectFileName`)
   - Store file handle object in localStorage (`nftcc_lastProjectHandle`)

5. **Animation Yield Points (Before File Read)**
   - Multiple `requestAnimationFrame` calls to ensure animation starts
   - Yield to allow animation to begin before blocking file operations

6. **File Reading**
   - Create FileReader instance
   - Detect compression format (.gz vs .json)
   - Read file as ArrayBuffer (if compressed) or Text (if JSON)
   - Handle FileReader errors

## Phase 2: File Processing & Parsing

7. **Compression Detection & Decompression**
   - Check file extension (.gz or .json.gz = compressed)
   - If compressed: Use pako library to decompress file
   - Convert ArrayBuffer to Uint8Array for decompression
   - Fallback: Try content-based detection if extension doesn't match

8. **JSON Validation**
   - Validate JSON string is not empty
   - Check if content starts with JSON-like characters ({ or [)
   - Attempt decompression if content doesn't look like JSON

9. **Animation Yield Points (Before Parsing)**
   - Multiple `requestAnimationFrame` calls before JSON parsing
   - Ensures animation continues during parsing

10. **JSON Parsing (Non-Blocking)**
    - Create Web Worker for JSON parsing (prevents main thread blocking)
    - Worker code: `JSON.parse()` in background thread
    - Set 30-second timeout for worker
    - Handle worker success/error messages
    - Fallback: Direct `JSON.parse()` if Worker fails or unavailable
    - Clean up worker and blob URL after parsing

11. **Animation Yield Points (After Parsing)**
    - Multiple `requestAnimationFrame` calls after parsing completes
    - Allows animation to catch up after heavy parsing operation

12. **Project Data Validation**
    - Verify loaded project is a valid object
    - Log debug information about `savedSeeds` array
    - Check array types and lengths

## Phase 3: Project Data Processing

13. **Default Project Structure Creation**
    - Create default project object with:
      - name: "Untitled Collection"
      - description: ""
      - size: 0
      - traits: []
      - rules: []
      - batches: [{ size: '', minted: false }]
      - selectedBatches: []
      - selectedBlockchains: []
      - blockchainPerNft: {}
      - settings: { generateUniqueNfts: true }
      - savedSeeds: []

14. **Project Data Merging**
    - Merge loaded project with default values
    - Ensure arrays are properly initialized (traits, rules, batches, etc.)
    - Preserve `savedSeeds` from loaded project file
    - Handle missing or invalid properties

15. **Project Data Migration**
    - Call `migrateProjectData()` function
    - Migrate old default values (size: 0 → null, totalSupply: 10000 → null)
    - Log migration operations

16. **Trait ImageData Preservation**
    - Call `preserveTraitImageData()` function
    - Preserve existing `imageData` for all traits
    - Try to restore from alternative sources (`image`, `imageSrc` properties)
    - Log preservation statistics

17. **Seed Algorithm Initialization**
    - Always ignore `seedAlgorithm` from file
    - Create new deterministic seed algorithm using seedService
    - Ensures consistent NFT generation across sessions

## Phase 4: Module State Reset & Cleanup

18. **Module State Reset**
    - Call `resetAllModuleStates()` function
    - Reset Export NFTs module state
    - Reset Generate NFTs UI module state
    - Reset Trait Layers module state
    - Clear global image caches (`_imageDataCache`, `savedSeedsImageCache`)
    - Clear localStorage project-specific data (but keep app settings)
    - Remove project-specific keys from localStorage

19. **Saved Seeds Modal Cleanup**
    - Close modal if open
    - Reset modal state:
      - seedList: []
      - filteredSeedList: []
      - imageCache: {}
      - violationsCache: null
      - currentPage: 1
      - isInConflictView: false
      - isFilteringViolations: false
      - isCancelled: false

20. **Global Cache Clearing**
    - Clear `savedSeedsImageCache` object
    - Update `traitChangeTimestamp` to current time
    - Update `ruleChangeTimestamp` to current time

## Phase 5: Project Data Assignment

21. **Global Project Assignment**
    - Set `window.currentProject = project`
    - Update MemoryManager with loaded project (without syncing to localStorage)
    - Normalize project data through MemoryManager
    - Update generateNftsUI module with project data reference

22. **Saved Seeds Modal Early Setup**
    - Ensure modal instance exists (create if needed)
    - Set correct `seedListKey` based on project name
    - Pre-load seeds from project data if available
    - Normalize seed formats (string/number → object with seed property)

## Phase 6: UI Preparation

23. **Reload Detection**
    - Check if app container has existing content
    - Remove existing project interface if reload detected
    - Reset navigation state (`generateNftsTabVisited = false`)

24. **Project Interface Initialization**
    - Call `projectInterface.start(project)`
    - Create project interface HTML structure
    - Set up navigation tabs
    - Set up confirmation modal
    - Show navigation and content area
    - Hide export-nfts-content-area by default

## Phase 7: Module Setup

25. **Trait Layers Module Setup**
    - Call `traitLayers.setup(projectData)`
    - Initialize trait layers UI
    - Set up drag-and-drop functionality
    - Render all trait layers and traits
    - Set up event listeners for layer operations

26. **Combination Rules Module Setup**
    - Call `combinationRules.setup(projectData)`
    - Initialize combination rules UI
    - Render all existing rules
    - Set up event listeners for rule operations
    - Set up tooltips for rule buttons

27. **Generate NFTs Module Setup**
    - Call `generateNfts.setup(projectData)`
    - Initialize NFT generation UI
    - Sync card heights after setup

28. **Navigation Module Setup**
    - Call `navigation.setupTabNavigation()`
    - Set up tab switching functionality
    - Show default tab (general-info)

## Phase 8: Saved Seeds Processing

29. **Seed List Key Generation**
    - Generate project-specific seed list key: `nftSeedList_${projectName}`
    - Encode project name for use in localStorage key

30. **Seed Source Detection**
    - Check if project file has `savedSeeds` array
    - Check if localStorage has existing seeds for this project
    - Determine which source to use (file takes priority)

31. **Seed Normalization**
    - Extract seed numbers from various formats:
      - Plain string/number → `{ seed: "..." }`
      - Object with seed property → `{ seed: "..." }`
    - Filter out invalid entries
    - Create normalized seed list

32. **Seed Storage**
    - Save normalized seeds to localStorage (with quota protection)
    - Update project data with normalized seeds
    - Update savedSeedsModal instance with seed list
    - Force reload seed list from localStorage

33. **Rarity Score Restoration**
    - Restore rarity scores for each seed
    - Save individual rarity scores to localStorage (`nftScore_${seed}`)
    - Handle quota exceeded errors gracefully

## Phase 9: Trait Images Loading

34. **ImageData Coverage Check**
    - Count traits with existing `imageData`
    - Calculate coverage percentage
    - Log coverage statistics

35. **Trait Images from Paths Loading** (if coverage < 80%)
    - Call `loadTraitImagesFromPaths()` function
    - Check in-memory cache first
    - Create parallel loading promises for all images
    - Fetch images from file paths (HTTP/HTTPS URLs)
    - Convert fetched images to base64 `imageData`
    - Cache loaded images in memory
    - Handle missing or failed image loads
    - Log loading statistics (loaded, skipped, errors)

## Phase 10: Additional Data Restoration

36. **Rarity Ranks Restoration**
    - Check if project has `rarityRanks` data
    - Save to localStorage (`rarityRanks_${projectName}`)
    - Set in project data for immediate availability
    - Log rank count

37. **Rarity Status Restoration**
    - Restore `rarityStatus` (Calculate Rarity button state)
    - Restore `rarityStatusCollectionSize` if available
    - Log restoration status

38. **Trait Rarities Status Restoration**
    - Restore `traitRaritiesStatus` (Calculate Trait Rarities button state)
    - Restore `traitRaritiesCollectionSize` if available
    - Log restoration status

39. **Dark NFTs Configuration Restoration**
    - Restore `darkTraitsConfig` if exists
    - Convert selectedTraits array to Set
    - Update both project data and generateNftsUI module
    - Log restoration status

## Phase 11: Counter Updates

40. **Saved Seeds Modal Instance Verification**
    - Verify modal instance has correct seeds after all processing
    - Update seed list if counts don't match
    - Force reload seed list from localStorage

41. **Counter Update Scheduling**
    - Schedule multiple counter updates at different intervals:
      - Immediate update
      - 100ms delay
      - 500ms delay
      - 600ms delay
      - 1500ms delay
      - 2500ms delay
    - Check for popup visibility before updating
    - Use unified `updateAllCounters()` function
    - Fallback to individual counter updates if unified system unavailable

## Phase 12: NFT Preview Restoration/Generation

42. **Last Generated NFT Check**
    - Check if project has `lastGeneratedNFT` with seed
    - Set restoration flag (`nftRestorationInProgress = true`)

43. **NFT Preview Container Setup**
    - Ensure preview container exists in DOM
    - Create container if missing

44. **NFT Restoration** (if saved NFT exists)
    - Enable Generate NFTs tab
    - Generate NFT using saved seed
    - Update global `lastGeneratedNFT` reference
    - Mark that NFT has been generated
    - Remove "No Project Loaded" card
    - Update preview panel and trait info panel
    - Update button states multiple times (100ms, 500ms, 1000ms delays)
    - Clear restoration flag

45. **Auto NFT Generation** (if no saved NFT)
    - Generate new random NFT automatically
    - Update global `lastGeneratedNFT` reference
    - Save NFT info to project data
    - Remove "No Project Loaded" card
    - Update preview panel and trait info panel
    - Update button states multiple times
    - Clear generation flag

## Phase 13: Finalization

46. **Active Tab Restoration**
    - Restore previously active tab if available
    - Call `navigation.showTab(currentTab)`

47. **File Input Reset**
    - Reset file input value to allow same file reload

48. **Loading Flag Reset**
    - Set `isLoading = false` on success
    - Reset flag on error

49. **Loading Animation Cleanup**
    - Hide loading overlay (after all operations complete)
    - Stop JavaScript animation
    - Remove visibility change listeners
    - Remove window focus/blur listeners
    - Cancel any pending animation frames

50. **Success Notification**
    - Show "Project loaded successfully" notification
    - Display notification after loading overlay closes

## Performance Optimizations During Loading

- **Web Worker for JSON Parsing**: Prevents main thread blocking
- **Multiple Yield Points**: Allows animation to continue during heavy operations
- **Parallel Image Loading**: Loads multiple trait images simultaneously
- **In-Memory Caching**: Caches loaded images to avoid redundant loads
- **Deferred Counter Updates**: Updates counters after popup closes to prevent UI blocking
- **RequestAnimationFrame Throttling**: Ensures smooth animation during load

## Error Handling

- File read errors → Show error notification, hide loading animation
- JSON parse errors → Show error notification, hide loading animation
- Worker timeout (30s) → Fallback to direct parsing
- Worker failure → Fallback to direct parsing
- Image load failures → Log warnings, continue with available images
- Module initialization errors → Log warnings, continue with available modules
- localStorage quota exceeded → Try cleanup, fallback to project data only

## Total Operations Count

Approximately **50+ distinct operations** occur during project loading, including:
- File I/O operations
- Data parsing and validation
- Module state management
- UI initialization
- Image loading
- Counter updates
- NFT generation/restoration

