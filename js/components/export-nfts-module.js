// Export NFTs / Metadata Module
// This module handles all functionality for the Export NFTs / Metadata tab

// FORCE CONSOLE LOG - If you see this, the script is loading
// console.log("=========================================");
// console.log("[Export NFTs] MODULE SCRIPT IS LOADING!");
// console.log("=========================================");

if (typeof NFTApp === "undefined") {
  NFTApp = {};
  // console.log("[Export NFTs] Created NFTApp object");
}

// Store module reference before registering
const exportNftsModuleDefinition = {
  // State
  imageFormat: { jpg: true, png: false }, // JPG selected by default
  metadataFormat: { json: true, csv: false }, // JSON selected by default
  numBatches: 20,
  currentBatchPage: 1, // Current page for batch cards pagination (1 or 2)
  batchData: {}, // Stores batch quantities and states
  previousBatchSelection: {}, // Stores previous batch selection state before "SELECT ALL BATCHES" is activated
  selectAllBatchesActive: false, // Flag to track if "SELECT ALL BATCHES" is active
  blockchainToggles: {
    ethereum: false,
    solana: false,
    bitcoin: false,
    cosmos: false,
    tezos: false,
    xrpl: false,
    polygon: false,
    immutablex: false,
    base: false,
    avalanche: false,
    flow: false,
    arbitrum: false
  },
  rarityRankEnabled: false,
  metadataPerNftEnabled: false, // Flag for "1 Metadata/NFT" toggle
  isExporting: false, // Flag to prevent multiple simultaneous exports
  isInitializing: false, // Flag to prevent saving during initialization
  saveStateTimer: null, // Timer for debouncing saveState calls
  traitCheckInterval: null, // Interval for checking trait additions
  exportLastPercentageMilestone: 0, // Track last ETA update milestone
  exportRecentTimes: [], // Store recent processing times for better ETA calculation
  exportLastUpdateTime: null, // Track last update time
  exportLastProcessedCount: 0, // Track last processed count for time calculation
  useOriginalImageSize: true, // Flag for image dimensions: true = original, false = custom
  originalImageWidth: 0, // Store original image width (0 until first trait is added)
  originalImageHeight: 0, // Store original image height (0 until first trait is added)
  customImageWidth: 0, // Custom width for export
  customImageHeight: 0, // Custom height for export

  init: function() {
    // console.log("[Export NFTs] Initializing module");
    
    // Ensure tab label is correct
    this.fixTabLabel();
    
    // Wait for DOM to be ready
    const initModule = () => {
    this.setupTabListener();
      this.setupProjectLoadListener();
      // Disable scrolling on Export NFTs tab
      this.disableScrolling();
      // Check if tab is already active
      const exportTab = document.getElementById("export-nfts");
      if (exportTab && exportTab.classList.contains("active")) {
        this.initializeTab();
        // Re-disable scrolling when tab is active
        this.disableScrolling();
      }
    };
    
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initModule);
    } else {
      // If already loaded, wait a bit for DOM to be fully ready
      setTimeout(initModule, 100);
    }
  },
  
  // Also call init immediately if DOM is ready
  _autoInit: function() {
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      // console.log("[Export NFTs] Auto-initializing module");
      this.init();
    } else {
      document.addEventListener('DOMContentLoaded', () => {
        // console.log("[Export NFTs] Auto-initializing module after DOM ready");
        this.init();
      });
    }
  },

  // Fix tab label to ensure it's correct (preserve .tab-label structure for purple marker)
  fixTabLabel: function() {
    const fixLabel = () => {
      const navTab = document.querySelector('.nav-tab[data-tab="export-nfts"]');
      if (navTab) {
        const textContent = navTab.textContent.trim();
        let tabLabel = navTab.querySelector('.tab-label');
        
        // Check if it needs fixing
        if (textContent.includes('Export Metadata / NFTs') || 
            textContent === 'Export Metadata / NFTs' ||
            (!textContent.includes('Export NFTs / Metadata') && textContent !== 'Export NFTs / Metadata')) {
          
          // If .tab-label doesn't exist, create it
          if (!tabLabel) {
            // Remove all content but preserve structure
          navTab.innerHTML = '';
            tabLabel = document.createElement('span');
            tabLabel.className = 'tab-label';
            navTab.appendChild(tabLabel);
          }
          
          // Update the label text
          tabLabel.textContent = 'Export NFTs / Metadata';
          
        } else {
          // Ensure .tab-label exists even if text is correct
          if (!tabLabel) {
            // Remove all content but preserve structure
            navTab.innerHTML = '';
            tabLabel = document.createElement('span');
            tabLabel.className = 'tab-label';
            tabLabel.textContent = 'Export NFTs / Metadata';
            navTab.appendChild(tabLabel);
          } else {
            // Just ensure text is correct
            tabLabel.textContent = 'Export NFTs / Metadata';
          }
        }
      }
      // If tab not found yet, silently return (it might not be created yet)
      // The tab will be created by project-interface.js when the project loads
    };
    
    // Try immediately
    fixLabel();
    
    // Also try after DOM is ready (but only once more to avoid spam)
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(fixLabel, 500);
      });
    } else {
      // If DOM is already ready, wait a bit for project-interface.js to create the tab
      setTimeout(fixLabel, 500);
    }
  },

  // Setup listener for when tab is clicked
  // Disable scrolling on Export NFTs tab
  disableScrolling: function() {
    const exportTab = document.getElementById('export-nfts');
    if (exportTab) {
      // Function to force hide scrollbars
      const forceHideScrollbars = () => {
        if (exportTab.classList.contains('active')) {
          // Force hide scrollbar on export tab itself
          exportTab.style.setProperty('overflow-y', 'hidden', 'important');
          exportTab.style.setProperty('overflow-x', 'hidden', 'important');
          exportTab.style.setProperty('overflow', 'hidden', 'important');
          exportTab.style.setProperty('scrollbar-width', 'none', 'important');
          exportTab.style.setProperty('-ms-overflow-style', 'none', 'important');
          exportTab.style.setProperty('overscroll-behavior', 'none', 'important');
          exportTab.style.setProperty('touch-action', 'none', 'important');
          exportTab.scrollTop = 0;
          exportTab.scrollLeft = 0;
          
          // Also hide scrollbar on content-area
          const contentArea = exportTab.closest('.content-area');
          if (contentArea) {
            contentArea.style.setProperty('overflow-y', 'hidden', 'important');
            contentArea.style.setProperty('overflow-x', 'hidden', 'important');
            contentArea.style.setProperty('overflow', 'hidden', 'important');
            contentArea.style.setProperty('scrollbar-width', 'none', 'important');
            contentArea.style.setProperty('-ms-overflow-style', 'none', 'important');
            contentArea.style.setProperty('overscroll-behavior', 'none', 'important');
            contentArea.scrollTop = 0;
            contentArea.scrollLeft = 0;
          }
          
          // Also hide scrollbar on export-nfts-content-area if it exists
          const exportNftsContentArea = document.querySelector('.export-nfts-content-area');
          if (exportNftsContentArea) {
            exportNftsContentArea.style.setProperty('overflow-y', 'hidden', 'important');
            exportNftsContentArea.style.setProperty('overflow-x', 'hidden', 'important');
            exportNftsContentArea.style.setProperty('overflow', 'hidden', 'important');
            exportNftsContentArea.style.setProperty('scrollbar-width', 'none', 'important');
            exportNftsContentArea.style.setProperty('-ms-overflow-style', 'none', 'important');
            exportNftsContentArea.scrollTop = 0;
            exportNftsContentArea.scrollLeft = 0;
          }
        }
      };
      
      // Prevent all scroll events
      exportTab.addEventListener('wheel', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
      
      exportTab.addEventListener('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
      }, { passive: false });
      
      exportTab.addEventListener('scroll', (e) => {
        exportTab.scrollTop = 0;
        exportTab.scrollLeft = 0;
      });
      
      // Also prevent scrolling on parent containers (content-area)
      const contentArea = exportTab.closest('.content-area');
      if (contentArea) {
        // Watch for tab activation changes
        const observer = new MutationObserver(() => {
          forceHideScrollbars();
        });
        observer.observe(exportTab, { attributes: true, attributeFilter: ['class'] });
        
        // Also set immediately if tab is already active
        forceHideScrollbars();
        
        // Apply periodically to ensure it stays hidden
        setInterval(forceHideScrollbars, 100);
        
        contentArea.addEventListener('wheel', (e) => {
          if (exportTab.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, { passive: false });
        
        contentArea.addEventListener('touchmove', (e) => {
          if (exportTab.classList.contains('active')) {
            e.preventDefault();
            e.stopPropagation();
          }
        }, { passive: false });
        
        contentArea.addEventListener('scroll', (e) => {
          if (exportTab.classList.contains('active')) {
            contentArea.scrollTop = 0;
            contentArea.scrollLeft = 0;
          }
        });
      }
    }
  },
  
  // Setup listener for project load events
  setupProjectLoadListener: function() {
    // Listen for project loaded events
    document.addEventListener('project-loaded-with-paths', () => {
      // console.log("[Export NFTs] Project loaded event received, updating state");
      setTimeout(() => {
        // Restore state after project is loaded
        this.restoreState();
        // Apply restored state to UI
        this.applyRestoredState();
        // Check export button state
        this.checkExportButtonState();
        // Re-disable scrolling after project load
        this.disableScrolling();
      }, 500);
    });
    
    // Also listen for any changes to window.currentProject
    let lastProject = window.currentProject;
    setInterval(() => {
      if (window.currentProject !== lastProject) {
        // console.log("[Export NFTs] window.currentProject changed, updating state");
        lastProject = window.currentProject;
        // Restore state and update UI
        setTimeout(() => {
          this.restoreState();
          this.applyRestoredState();
          this.checkExportButtonState();
        }, 500);
      }
    }, 1000);
  },

  setupTabListener: function() {
    // Use event delegation to handle dynamically added tabs
    document.addEventListener('click', (e) => {
      const tab = e.target.closest('.nav-tab[data-tab="export-nfts"]');
      if (tab) {
        setTimeout(() => {
          this.initializeTab();
          // Disable scrolling when tab becomes active
          this.disableScrolling();
        }, 50);
      }
      
      // Save state when user clicks on any other tab (leaving Export NFTs tab)
      const otherTab = e.target.closest('.nav-tab[data-tab]');
      if (otherTab && otherTab.dataset.tab !== 'export-nfts') {
        const exportTab = document.getElementById('export-nfts');
        if (exportTab && exportTab.classList.contains('active')) {
          // User is leaving Export NFTs tab, save state
          this.saveState();
        }
      }
    });
  },

  // Initialize the tab content
  initializeTab: function() {
    const tabContent = document.getElementById("export-nfts");
    if (!tabContent) {
      // console.warn("[Export NFTs] Tab content not found");
      return;
    }

    // console.log("[Export NFTs] Initializing tab content");

    // Set flag to prevent saving during initialization
    this.isInitializing = true;

    // Use visibility to hide content during initialization (preserves layout, prevents reflow)
    const originalVisibility = tabContent.style.visibility;
    tabContent.style.visibility = 'hidden';
    tabContent.style.opacity = '0';

    // Clear ALL existing content
    tabContent.innerHTML = '';

    // Build the structure
    this.buildTabStructure(tabContent);
    
    // Enforce correct sizes immediately after building structure (before rendering)
    this.enforceSectionSizes();
    
    // Restore state from project data (retrocompatible - uses defaults if not found)
    this.restoreState();
    
    // Render batch cards immediately (up to 20 batches total, 10 per page)
    this.renderBatchCards();
    
    // Initialize default values (sets num-batches-input, but doesn't need to click Apply)
    this.initializeDefaults();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply restored state to UI elements
    this.applyRestoredState();
    
    // Check for trait image size after UI is ready (in case traits were added before tab initialization)
    setTimeout(() => {
      this.detectFirstTraitImageSize();
    }, 500);
    
    // Set up periodic check for trait additions (every 2 seconds)
    if (this.traitCheckInterval) {
      clearInterval(this.traitCheckInterval);
    }
    this.traitCheckInterval = setInterval(() => {
      this.detectFirstTraitImageSize();
    }, 2000);
    
    // Validate batch quantities after state is restored to ensure proper visualization
    this.validateBatchQuantities();
    
    // Enforce sizes again after all content is rendered to ensure consistency
    this.enforceSectionSizes();
    
    // Show tab content immediately after all synchronous operations complete
    // Use Promise microtask to ensure it happens before next paint but after current execution
    Promise.resolve().then(() => {
      tabContent.style.visibility = originalVisibility || 'visible';
      tabContent.style.opacity = '1';
    });
    
    // Ensure export button has event listener after tab initialization
    // This is critical after project load when tab might be reinitialized
    setTimeout(() => {
      const exportBtn = document.getElementById("export-metadata-nfts-btn");
      if (exportBtn && !exportBtn._exportHandler) {
        // console.log("[Export NFTs] Re-attaching export button handler after tab initialization");
        const self = this;
        const handleExportClick = async (e) => {
          e.preventDefault();
          e.stopPropagation();
          // console.log("[Export NFTs] Export button clicked (re-attached handler)");
          
          // Check if export is already in progress - prevent duplicate clicks
          if (self.isExporting) {
            // console.warn("[Export NFTs] Export already in progress, ignoring duplicate click");
            return;
          }
          
          // Always try to call handleExport - it will handle its own validation
          try {
            // console.log("[Export NFTs] Calling handleExport from re-attached handler...");
            await self.handleExport();
            // console.log("[Export NFTs] handleExport completed from re-attached handler");
          } catch (error) {
            // console.error("[Export NFTs] Error in handleExport:", error);
            // console.error("[Export NFTs] Error stack:", error.stack);
            if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
              window.NFTApp.getModule("notificationService").show(
                `Export failed: ${error.message || "Unknown error"}`,
                "error",
                5000
              );
            } else {
              alert(`Export failed: ${error.message || "Unknown error"}`);
            }
          }
        };
        exportBtn.addEventListener("click", handleExportClick);
        exportBtn._exportHandler = handleExportClick;
      }
      
      // Check export button state after initialization
      this.checkExportButtonState();
      // Reset initialization flag after UI is fully set up
      this.isInitializing = false;
    }, 500); // Increased delay to ensure everything is ready
    
    // console.log("[Export NFTs] Tab content initialized successfully");
  },

  // Build the complete tab structure
  buildTabStructure: function(container) {
    // Ensure container has no top padding/margin
    container.style.paddingTop = "0";
    container.style.marginTop = "0";
    
    // Create section header first (like Collection Info tab)
    const sectionHeader = document.createElement("div");
    sectionHeader.className = "section-header";
    sectionHeader.style.display = "flex";
    sectionHeader.style.alignItems = "baseline";
    sectionHeader.style.flexWrap = "wrap";
    sectionHeader.style.marginTop = "71px";
    sectionHeader.style.marginBottom = "2rem";
    sectionHeader.style.paddingTop = "0";
    sectionHeader.style.paddingLeft = "24px";
    sectionHeader.style.paddingRight = "24px";
    sectionHeader.style.width = "100%";
    sectionHeader.style.maxWidth = "none";
    sectionHeader.style.visibility = "visible";
    sectionHeader.style.opacity = "1";
    
    const sectionTitle = document.createElement("h2");
    sectionTitle.className = "section-title";
    sectionTitle.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="16" x2="12" y2="12"></line>
        <line x1="12" y1="8" x2="12.01" y2="8"></line>
      </svg>
      Export NFTs / Metadata
    `;
    sectionTitle.style.display = "inline-block";
    sectionTitle.style.visibility = "visible";
    sectionTitle.style.opacity = "1";
    sectionTitle.style.marginTop = "0";
    sectionTitle.style.marginBottom = "0";
    sectionTitle.style.marginRight = "1rem";
    sectionTitle.style.fontSize = "1.8rem";
    sectionTitle.style.fontWeight = "600";
    sectionTitle.style.color = "var(--text-primary)";
    
    const sectionDescription = document.createElement("p");
    sectionDescription.className = "section-description";
    sectionDescription.textContent = "Customize and Export Metadata and NFT Batches to be minted.";
    sectionDescription.style.display = "inline-block";
    sectionDescription.style.visibility = "visible";
    sectionDescription.style.opacity = "1";
    sectionDescription.style.marginTop = "0";
    sectionDescription.style.marginBottom = "0";
    sectionDescription.style.fontSize = "1rem";
    sectionDescription.style.color = "var(--text-secondary)";
    
    sectionHeader.appendChild(sectionTitle);
    sectionHeader.appendChild(sectionDescription);
    container.appendChild(sectionHeader);
    
    // Create main two-column form container - Match Collection Info styling
    const formContainer = document.createElement("div");
    formContainer.id = "export-nfts-form-container";
    formContainer.className = "form-container two-column-form";
    // Match Collection Info styling: width 1557px, border 2px dashed, background #222230
    formContainer.style.display = "flex";
    formContainer.style.background = "#222230";
    formContainer.style.padding = "2rem";
    formContainer.style.paddingLeft = "0";
    formContainer.style.paddingRight = "0";
    formContainer.style.borderRadius = "12px";
    formContainer.style.border = "2px dashed var(--border-color)";
    formContainer.style.width = "1557px";
    formContainer.style.maxWidth = "1557px";
    formContainer.style.height = "630px";
    formContainer.style.minHeight = "630px";
    formContainer.style.maxHeight = "630px";
    formContainer.style.marginLeft = "auto";
    formContainer.style.marginRight = "auto";
    formContainer.style.marginTop = "35px";
    formContainer.style.marginBottom = "0";
    formContainer.style.padding = "2rem";
    formContainer.style.paddingTop = "2rem";
    formContainer.style.paddingBottom = "2rem";
    formContainer.style.boxSizing = "border-box";
    formContainer.style.gap = "2rem";

    // LEFT COLUMN - Vertical stack of containers
    const leftColumn = document.createElement("div");
    leftColumn.id = "export-nfts-form-column-left";
    leftColumn.className = "form-column";
    // Match Collection Info form-column styling: background #222230, padding 2rem left/right
    leftColumn.style.background = "#222230";
    leftColumn.style.paddingLeft = "2rem";
    leftColumn.style.paddingRight = "2rem";
    leftColumn.style.flex = "0 0 auto";
    leftColumn.style.width = "248px";
    leftColumn.style.height = "593px";
    leftColumn.style.minWidth = "248px";
    leftColumn.style.maxWidth = "248px";
    leftColumn.style.minHeight = "593px";
    leftColumn.style.maxHeight = "593px";
    leftColumn.style.display = "flex";
    leftColumn.style.flexDirection = "column";
    leftColumn.style.gap = "0";
    leftColumn.style.paddingTop = "0";
    leftColumn.style.paddingBottom = "0";
    leftColumn.style.justifyContent = "start";
    leftColumn.style.alignItems = "start";

    // Container 1: Image Format Export (Top)
    leftColumn.appendChild(this.createImageFormatContainer());

    // Container 2: Metadata Format Export (Below Image Format)
    leftColumn.appendChild(this.createMetadataFormatContainer());

    // Container 3: Number of Batches (Below Metadata Format)
    leftColumn.appendChild(this.createNumberOfBatchesContainer());

    // Container 4: Export NFTs Metadata (Below Number of Batches)
    leftColumn.appendChild(this.createExportNftsMetadataContainer());

    // RIGHT COLUMN - Batches + Blockchain toggles
    const rightColumn = document.createElement("div");
    rightColumn.id = "export-nfts-form-column-right";
    rightColumn.className = "form-column";
    // Match Collection Info form-column styling: background #222230, padding 2rem left/right
    rightColumn.style.background = "#222230";
    rightColumn.style.paddingLeft = "2rem";
    rightColumn.style.paddingRight = "2rem";
    rightColumn.style.flex = "0 0 auto";
    rightColumn.style.width = "1128px";
    rightColumn.style.height = "593px";
    rightColumn.style.minWidth = "1128px";
    rightColumn.style.maxWidth = "1128px";
    rightColumn.style.minHeight = "593px";
    rightColumn.style.maxHeight = "593px";
    rightColumn.style.marginLeft = "0px";

    // Create NFTs Metadata Export container
    rightColumn.appendChild(this.createRightColumnContent());

    formContainer.appendChild(leftColumn);
    formContainer.appendChild(rightColumn);
    container.appendChild(formContainer);
  },

  // Container 1: Image Format Export
  createImageFormatContainer: function() {
    const container = document.createElement("div");
    container.id = "image-format-export-form-container-left";
    container.className = "form-container";
    container.style.width = "248px";
    container.style.height = "108px";
    container.style.minWidth = "248px";
    container.style.maxWidth = "248px";
    container.style.minHeight = "108px";
    container.style.maxHeight = "108px";
    container.style.padding = "20px";
    container.style.margin = "0";
    container.style.marginBottom = "20px";
    container.style.marginTop = "0";
    container.style.marginLeft = "0";
    container.style.marginRight = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";

    const title = document.createElement("h3");
    title.textContent = "Image Format to Export:";
    title.style.fontSize = "12px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text-primary)";
    title.style.marginBottom = "12px";
    title.style.marginTop = "0";
    title.style.cursor = "help";
    title.style.position = "relative";
    title.classList.add("tooltip");
    
    // Add tooltip to title
    const imageFormatTooltip = document.createElement("span");
    imageFormatTooltip.className = "tooltiptext";
    imageFormatTooltip.innerHTML = "Choose the image format for exported NFTs.<br>JPG: Smaller file size, lossy compression<br>PNG: Larger file size, lossless quality";
    imageFormatTooltip.style.visibility = "hidden";
    imageFormatTooltip.style.width = "280px";
    imageFormatTooltip.style.minWidth = "280px";
    imageFormatTooltip.style.maxWidth = "280px";
    imageFormatTooltip.style.backgroundColor = "#000000";
    imageFormatTooltip.style.color = "#f39c12";
    imageFormatTooltip.style.textAlign = "center";
    imageFormatTooltip.style.borderRadius = "6px";
    imageFormatTooltip.style.padding = "8px 10px";
    imageFormatTooltip.style.position = "fixed";
    imageFormatTooltip.style.zIndex = "2147483647";
    imageFormatTooltip.style.bottom = "auto";
    imageFormatTooltip.style.top = "auto";
    imageFormatTooltip.style.left = "auto";
    imageFormatTooltip.style.right = "auto";
    imageFormatTooltip.style.opacity = "0";
    imageFormatTooltip.style.transition = "opacity 1s";
    imageFormatTooltip.style.fontSize = "11px";
    imageFormatTooltip.style.lineHeight = "1.4";
    imageFormatTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    imageFormatTooltip.style.pointerEvents = "none";
    imageFormatTooltip.style.whiteSpace = "normal";
    imageFormatTooltip.style.wordWrap = "break-word";
    imageFormatTooltip.style.overflowWrap = "break-word";
    imageFormatTooltip.style.boxSizing = "border-box";
    imageFormatTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    imageFormatTooltip.style.top = "-9999px";
    imageFormatTooltip.style.left = "-9999px";
    title.appendChild(imageFormatTooltip);
    
    // Show tooltip on hover
    let imageFormatTooltipTimeout = null;
    title.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (imageFormatTooltipTimeout) {
        clearTimeout(imageFormatTooltipTimeout);
        imageFormatTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      imageFormatTooltipTimeout = setTimeout(() => {
      const rect = title.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      imageFormatTooltip.style.visibility = "visible";
      imageFormatTooltip.style.opacity = "0";
      imageFormatTooltip.style.top = "-9999px";
      imageFormatTooltip.style.left = "-9999px";
        imageFormatTooltip.style.transform = "none";
      void imageFormatTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = imageFormatTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        imageFormatTooltip.style.setProperty("position", "fixed", "important");
        imageFormatTooltip.style.setProperty("z-index", "2147483647", "important");
        imageFormatTooltip.style.setProperty("bottom", "auto", "important");
        imageFormatTooltip.style.setProperty("right", "auto", "important");
        imageFormatTooltip.style.setProperty("margin", "0", "important");
        imageFormatTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const titleRect = title.getBoundingClientRect();
        const centeredLeft = titleRect.left + (titleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = titleRect.top - tooltipHeight - 5;
        imageFormatTooltip.style.setProperty("top", `${topPosition}px`, "important");
        imageFormatTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      imageFormatTooltip.style.opacity = "1";
        });
        imageFormatTooltipTimeout = null;
      }, 1000);
    });
    title.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (imageFormatTooltipTimeout) {
        clearTimeout(imageFormatTooltipTimeout);
        imageFormatTooltipTimeout = null;
      }
      imageFormatTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        imageFormatTooltip.style.visibility = "hidden";
      }, 1000);
    });

    const togglesContainer = document.createElement("div");
    togglesContainer.style.display = "flex";
    togglesContainer.style.gap = "8px";
    togglesContainer.style.alignItems = "center";
    togglesContainer.style.justifyContent = "center";

    // Create JPG toggle - Match Batch toggle styling exactly
    const jpgToggle = document.createElement("button");
    jpgToggle.id = "jpg-toggle";
    jpgToggle.type = "button";
    jpgToggle.className = "toggle-button";
    jpgToggle.textContent = "JPG";
    jpgToggle.style.padding = "8px 14px";
    jpgToggle.style.border = "2px solid #4a4a4a";
    jpgToggle.style.borderRadius = "6px";
    jpgToggle.style.backgroundColor = "#2a2a2a";
    jpgToggle.style.color = "#ffffff";
    jpgToggle.style.fontSize = "12px";
    jpgToggle.style.fontWeight = "600";
    jpgToggle.style.cursor = "pointer";
    jpgToggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    jpgToggle.style.transform = "none";
    jpgToggle.style.animation = "none";
    
    // Exclude from auto-tooltip system
    jpgToggle.dataset.noTooltip = "true";
    jpgToggle.removeAttribute("title");
    jpgToggle.classList.remove("tooltip");
    
    // Use MutationObserver to prevent tooltips
    const jpgObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          jpgToggle.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              node.remove();
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && jpgToggle.classList.contains('tooltip')) {
          jpgToggle.classList.remove("tooltip");
        }
      });
    });
    jpgObserver.observe(jpgToggle, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    // Set JPG as active by default
    jpgToggle.classList.add("active");
    jpgToggle.style.backgroundColor = "#00ff88";
    jpgToggle.style.borderColor = "#00ff88";
    jpgToggle.style.color = "#000000";
    jpgToggle.style.fontWeight = "bold";
    jpgToggle.style.boxShadow = `
      inset 0 3px 5px rgba(0, 0, 0, 0.5),
      0 0 10px rgba(0, 255, 136, 0.5),
      0 0 20px rgba(0, 255, 136, 0.3)
    `;
    exportNftsModuleDefinition.imageFormat.jpg = true;
    
    jpgToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const self = exportNftsModuleDefinition;
      const isActive = jpgToggle.classList.contains("active");
      
      if (isActive) {
        jpgToggle.classList.remove("active");
        jpgToggle.style.backgroundColor = "#2a2a2a";
        jpgToggle.style.borderColor = "#4a4a4a";
        jpgToggle.style.color = "#ffffff";
        jpgToggle.style.fontWeight = "600";
        jpgToggle.style.boxShadow = "none";
        self.imageFormat.jpg = false;
      } else {
        jpgToggle.classList.add("active");
        jpgToggle.style.backgroundColor = "#00ff88";
        jpgToggle.style.borderColor = "#00ff88";
        jpgToggle.style.color = "#000000";
        jpgToggle.style.fontWeight = "bold";
        jpgToggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
        self.imageFormat.jpg = true;
      }
      self.checkExportButtonState();
    });

    // Create PNG toggle - Match Batch toggle styling exactly
    const pngToggle = document.createElement("button");
    pngToggle.id = "png-toggle";
    pngToggle.type = "button";
    pngToggle.className = "toggle-button";
    pngToggle.textContent = "PNG";
    pngToggle.style.padding = "8px 14px";
    pngToggle.style.border = "2px solid #4a4a4a";
    pngToggle.style.borderRadius = "6px";
    pngToggle.style.backgroundColor = "#2a2a2a";
    pngToggle.style.color = "#ffffff";
    pngToggle.style.fontSize = "12px";
    pngToggle.style.fontWeight = "600";
    pngToggle.style.cursor = "pointer";
    pngToggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    pngToggle.style.transform = "none";
    pngToggle.style.animation = "none";
    
    // Exclude from auto-tooltip system
    pngToggle.dataset.noTooltip = "true";
    pngToggle.removeAttribute("title");
    pngToggle.classList.remove("tooltip");
    
    // Use MutationObserver to prevent tooltips
    const pngObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          pngToggle.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              node.remove();
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && pngToggle.classList.contains('tooltip')) {
          pngToggle.classList.remove("tooltip");
        }
      });
    });
    pngObserver.observe(pngToggle, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    pngToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const self = exportNftsModuleDefinition;
      const isActive = pngToggle.classList.contains("active");
      
      if (isActive) {
        pngToggle.classList.remove("active");
        pngToggle.style.backgroundColor = "#2a2a2a";
        pngToggle.style.borderColor = "#4a4a4a";
        pngToggle.style.color = "#ffffff";
        pngToggle.style.fontWeight = "600";
        pngToggle.style.boxShadow = "none";
        self.imageFormat.png = false;
      } else {
        pngToggle.classList.add("active");
        pngToggle.style.backgroundColor = "#00ff88";
        pngToggle.style.borderColor = "#00ff88";
        pngToggle.style.color = "#000000";
        pngToggle.style.fontWeight = "bold";
        pngToggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
        self.imageFormat.png = true;
      }
      self.checkExportButtonState();
    });

    togglesContainer.appendChild(jpgToggle);
    togglesContainer.appendChild(pngToggle);

    container.appendChild(title);
    container.appendChild(togglesContainer);

    return container;
  },

  // Container 2: Metadata Format Export
  createMetadataFormatContainer: function() {
    const container = document.createElement("div");
    container.id = "metadata-format-export-form-container-right";
    container.className = "form-container";
    container.style.width = "248px";
    container.style.height = "108px";
    container.style.minWidth = "248px";
    container.style.maxWidth = "248px";
    container.style.minHeight = "108px";
    container.style.maxHeight = "108px";
    container.style.padding = "20px";
    container.style.margin = "0";
    container.style.marginBottom = "20px";
    container.style.marginTop = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";

    const title = document.createElement("h3");
    title.textContent = "Metadata Format to Export:";
    title.style.fontSize = "12px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text-primary)";
    title.style.marginBottom = "12px";
    title.style.marginTop = "0";
    title.style.cursor = "help";
    title.style.position = "relative";
    title.classList.add("tooltip");
    
    // Add tooltip to title
    const metadataFormatTooltip = document.createElement("span");
    metadataFormatTooltip.className = "tooltiptext";
    metadataFormatTooltip.innerHTML = "Choose the metadata format for exported NFTs.<br>JSON: Standard format, widely supported<br>CSV: Spreadsheet-compatible format";
    metadataFormatTooltip.style.visibility = "hidden";
    metadataFormatTooltip.style.width = "280px";
    metadataFormatTooltip.style.minWidth = "280px";
    metadataFormatTooltip.style.maxWidth = "280px";
    metadataFormatTooltip.style.backgroundColor = "#000000";
    metadataFormatTooltip.style.color = "#f39c12";
    metadataFormatTooltip.style.textAlign = "center";
    metadataFormatTooltip.style.borderRadius = "6px";
    metadataFormatTooltip.style.padding = "8px 10px";
    metadataFormatTooltip.style.position = "fixed";
    metadataFormatTooltip.style.zIndex = "2147483647";
    metadataFormatTooltip.style.bottom = "auto";
    metadataFormatTooltip.style.top = "auto";
    metadataFormatTooltip.style.left = "auto";
    metadataFormatTooltip.style.right = "auto";
    metadataFormatTooltip.style.opacity = "0";
    metadataFormatTooltip.style.transition = "opacity 1s";
    metadataFormatTooltip.style.fontSize = "11px";
    metadataFormatTooltip.style.lineHeight = "1.4";
    metadataFormatTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    metadataFormatTooltip.style.pointerEvents = "none";
    metadataFormatTooltip.style.whiteSpace = "normal";
    metadataFormatTooltip.style.wordWrap = "break-word";
    metadataFormatTooltip.style.overflowWrap = "break-word";
    metadataFormatTooltip.style.boxSizing = "border-box";
    metadataFormatTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    metadataFormatTooltip.style.top = "-9999px";
    metadataFormatTooltip.style.left = "-9999px";
    title.appendChild(metadataFormatTooltip);
    
    // Show tooltip on hover
    let metadataFormatTooltipTimeout = null;
    title.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (metadataFormatTooltipTimeout) {
        clearTimeout(metadataFormatTooltipTimeout);
        metadataFormatTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      metadataFormatTooltipTimeout = setTimeout(() => {
      const rect = title.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      metadataFormatTooltip.style.visibility = "visible";
      metadataFormatTooltip.style.opacity = "0";
      metadataFormatTooltip.style.top = "-9999px";
      metadataFormatTooltip.style.left = "-9999px";
        metadataFormatTooltip.style.transform = "none";
      void metadataFormatTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = metadataFormatTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        metadataFormatTooltip.style.setProperty("position", "fixed", "important");
        metadataFormatTooltip.style.setProperty("z-index", "2147483647", "important");
        metadataFormatTooltip.style.setProperty("bottom", "auto", "important");
        metadataFormatTooltip.style.setProperty("right", "auto", "important");
        metadataFormatTooltip.style.setProperty("margin", "0", "important");
        metadataFormatTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const titleRect = title.getBoundingClientRect();
        const centeredLeft = titleRect.left + (titleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = titleRect.top - tooltipHeight - 5;
        metadataFormatTooltip.style.setProperty("top", `${topPosition}px`, "important");
        metadataFormatTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      metadataFormatTooltip.style.opacity = "1";
        });
        metadataFormatTooltipTimeout = null;
      }, 1000);
    });
    title.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (metadataFormatTooltipTimeout) {
        clearTimeout(metadataFormatTooltipTimeout);
        metadataFormatTooltipTimeout = null;
      }
      metadataFormatTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        metadataFormatTooltip.style.visibility = "hidden";
      }, 1000);
    });

    const togglesContainer = document.createElement("div");
    togglesContainer.style.display = "flex";
    togglesContainer.style.gap = "8px";
    togglesContainer.style.alignItems = "center";
    togglesContainer.style.justifyContent = "center";

    // Create JSON toggle - Match Batch toggle styling exactly
    const jsonToggle = document.createElement("button");
    jsonToggle.id = "json-toggle";
    jsonToggle.type = "button";
    jsonToggle.className = "toggle-button";
    jsonToggle.textContent = "JSON";
    jsonToggle.style.padding = "8px 14px";
    jsonToggle.style.border = "2px solid #4a4a4a";
    jsonToggle.style.borderRadius = "6px";
    jsonToggle.style.backgroundColor = "#2a2a2a";
    jsonToggle.style.color = "#ffffff";
    jsonToggle.style.fontSize = "12px";
    jsonToggle.style.fontWeight = "600";
    jsonToggle.style.cursor = "pointer";
    jsonToggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    jsonToggle.style.transform = "none";
    jsonToggle.style.animation = "none";
    
    // Exclude from auto-tooltip system
    jsonToggle.dataset.noTooltip = "true";
    jsonToggle.removeAttribute("title");
    jsonToggle.classList.remove("tooltip");
    
    // Use MutationObserver to prevent tooltips
    const jsonObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          jsonToggle.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              node.remove();
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && jsonToggle.classList.contains('tooltip')) {
          jsonToggle.classList.remove("tooltip");
        }
      });
    });
    jsonObserver.observe(jsonToggle, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    // Set JSON as active by default
    jsonToggle.classList.add("active");
    jsonToggle.style.backgroundColor = "#00ff88";
    jsonToggle.style.borderColor = "#00ff88";
    jsonToggle.style.color = "#000000";
    jsonToggle.style.fontWeight = "bold";
    jsonToggle.style.boxShadow = `
      inset 0 3px 5px rgba(0, 0, 0, 0.5),
      0 0 10px rgba(0, 255, 136, 0.5),
      0 0 20px rgba(0, 255, 136, 0.3)
    `;
    exportNftsModuleDefinition.metadataFormat.json = true;
    
    jsonToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const self = exportNftsModuleDefinition;
      const isActive = jsonToggle.classList.contains("active");
      
      if (isActive) {
        jsonToggle.classList.remove("active");
        jsonToggle.style.backgroundColor = "#2a2a2a";
        jsonToggle.style.borderColor = "#4a4a4a";
        jsonToggle.style.color = "#ffffff";
        jsonToggle.style.fontWeight = "600";
        jsonToggle.style.boxShadow = "none";
        self.metadataFormat.json = false;
      } else {
        jsonToggle.classList.add("active");
        jsonToggle.style.backgroundColor = "#00ff88";
        jsonToggle.style.borderColor = "#00ff88";
        jsonToggle.style.color = "#000000";
        jsonToggle.style.fontWeight = "bold";
        jsonToggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
        self.metadataFormat.json = true;
      }
      self.checkExportButtonState();
    });

    // Create CSV toggle - Match Batch toggle styling exactly
    const csvToggle = document.createElement("button");
    csvToggle.id = "csv-toggle";
    csvToggle.type = "button";
    csvToggle.className = "toggle-button";
    csvToggle.textContent = "CSV";
    csvToggle.style.padding = "8px 14px";
    csvToggle.style.border = "2px solid #4a4a4a";
    csvToggle.style.borderRadius = "6px";
    csvToggle.style.backgroundColor = "#2a2a2a";
    csvToggle.style.color = "#ffffff";
    csvToggle.style.fontSize = "12px";
    csvToggle.style.fontWeight = "600";
    csvToggle.style.cursor = "pointer";
    csvToggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    csvToggle.style.transform = "none";
    csvToggle.style.animation = "none";
    
    // Exclude from auto-tooltip system
    csvToggle.dataset.noTooltip = "true";
    csvToggle.removeAttribute("title");
    csvToggle.classList.remove("tooltip");
    
    // Use MutationObserver to prevent tooltips
    const csvObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          csvToggle.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              node.remove();
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && csvToggle.classList.contains('tooltip')) {
          csvToggle.classList.remove("tooltip");
        }
      });
    });
    csvObserver.observe(csvToggle, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    csvToggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const self = exportNftsModuleDefinition;
      const isActive = csvToggle.classList.contains("active");
      
      if (isActive) {
        csvToggle.classList.remove("active");
        csvToggle.style.backgroundColor = "#2a2a2a";
        csvToggle.style.borderColor = "#4a4a4a";
        csvToggle.style.color = "#ffffff";
        csvToggle.style.fontWeight = "600";
        csvToggle.style.boxShadow = "none";
        self.metadataFormat.csv = false;
      } else {
        csvToggle.classList.add("active");
        csvToggle.style.backgroundColor = "#00ff88";
        csvToggle.style.borderColor = "#00ff88";
        csvToggle.style.color = "#000000";
        csvToggle.style.fontWeight = "bold";
        csvToggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
        self.metadataFormat.csv = true;
      }
      self.checkExportButtonState();
    });

    togglesContainer.appendChild(jsonToggle);
    togglesContainer.appendChild(csvToggle);

    container.appendChild(title);
    container.appendChild(togglesContainer);

    return container;
  },

  // Container 3: Number of Batches
  createNumberOfBatchesContainer: function() {
    const container = document.createElement("div");
    container.id = "number-of-batches-section";
    container.className = "form-container";
    container.style.width = "248px";
    container.style.height = "108px";
    container.style.minWidth = "248px";
    container.style.maxWidth = "248px";
    container.style.minHeight = "108px";
    container.style.maxHeight = "108px";
    container.style.padding = "20px";
    container.style.margin = "0";
    container.style.marginBottom = "20px";
    container.style.marginTop = "0";
    container.style.marginLeft = "0";
    container.style.marginRight = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";
    container.style.transition = "none";
    container.style.transform = "none";
    container.style.animation = "none";
    container.style.willChange = "auto";

    const title = document.createElement("h3");
    title.innerHTML = "Number of batches<br>in your collection:";
    title.style.fontSize = "12px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text-primary)";
    title.style.marginBottom = "12px";
    title.style.marginTop = "0";
    title.style.cursor = "help";
    title.style.position = "relative";
    title.classList.add("tooltip");
    
    // Add tooltip to title
    const titleTooltip = document.createElement("span");
    titleTooltip.className = "tooltiptext";
    titleTooltip.innerHTML = "Set how many batches you want in your collection. Exporting in multiple batches helps avoid memory errors by processing smaller amounts at a time. Each batch can have a different size and can be minted separately.";
    titleTooltip.style.visibility = "hidden";
    titleTooltip.style.width = "320px";
    titleTooltip.style.minWidth = "320px";
    titleTooltip.style.maxWidth = "320px";
    titleTooltip.style.backgroundColor = "#000000";
    titleTooltip.style.color = "#f39c12";
    titleTooltip.style.textAlign = "center";
    titleTooltip.style.borderRadius = "6px";
    titleTooltip.style.padding = "8px 10px";
    titleTooltip.style.position = "fixed";
    titleTooltip.style.zIndex = "2147483647";
    titleTooltip.style.bottom = "auto";
    titleTooltip.style.top = "auto";
    titleTooltip.style.left = "auto";
    titleTooltip.style.right = "auto";
    titleTooltip.style.opacity = "0";
    titleTooltip.style.transition = "opacity 1s";
    titleTooltip.style.fontSize = "11px";
    titleTooltip.style.lineHeight = "1.4";
    titleTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    titleTooltip.style.pointerEvents = "none";
    titleTooltip.style.whiteSpace = "normal";
    titleTooltip.style.wordWrap = "break-word";
    titleTooltip.style.overflowWrap = "break-word";
    titleTooltip.style.boxSizing = "border-box";
    titleTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    titleTooltip.style.top = "-9999px";
    titleTooltip.style.left = "-9999px";
    // CRITICAL: Append to body instead of title to escape stacking context and ensure highest z-index
    document.body.appendChild(titleTooltip);
    // Store reference on title for easy access
    title.dataset.tooltipId = titleTooltip.id || "number-of-batches-tooltip";
    if (!titleTooltip.id) {
      titleTooltip.id = "number-of-batches-tooltip";
    }
    
    // Show tooltip on hover
    let titleTooltipTimeout = null;
    title.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (titleTooltipTimeout) {
        clearTimeout(titleTooltipTimeout);
        titleTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      titleTooltipTimeout = setTimeout(() => {
      const rect = title.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      titleTooltip.style.visibility = "visible";
      titleTooltip.style.opacity = "0";
      titleTooltip.style.top = "-9999px";
      titleTooltip.style.left = "-9999px";
        titleTooltip.style.transform = "none";
      void titleTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 320; // Fixed width
      const tooltipHeight = titleTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        titleTooltip.style.setProperty("position", "fixed", "important");
        titleTooltip.style.setProperty("z-index", "2147483647", "important");
        titleTooltip.style.setProperty("bottom", "auto", "important");
        titleTooltip.style.setProperty("right", "auto", "important");
        titleTooltip.style.setProperty("margin", "0", "important");
        titleTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const titleRect = title.getBoundingClientRect();
        const centeredLeft = titleRect.left + (titleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = titleRect.top - tooltipHeight - 5;
        titleTooltip.style.setProperty("top", `${topPosition}px`, "important");
        titleTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      titleTooltip.style.opacity = "1";
        });
        titleTooltipTimeout = null;
      }, 1000);
    });
    title.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (titleTooltipTimeout) {
        clearTimeout(titleTooltipTimeout);
        titleTooltipTimeout = null;
      }
      titleTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        titleTooltip.style.visibility = "hidden";
      }, 1000);
    });

    const inputContainer = document.createElement("div");
    inputContainer.style.display = "flex";
    inputContainer.style.gap = "8px";
    inputContainer.style.alignItems = "center";

    const input = document.createElement("input");
    input.id = "num-batches-input";
    input.type = "number";
    input.min = "1";
    input.max = "20";
    input.value = "20";
    input.style.width = "60px";
    input.style.padding = "8px";
    input.style.border = "1px solid var(--border-color)";
    input.style.borderRadius = "6px";
    input.style.background = "var(--bg-primary)";
    input.style.color = "var(--text-primary)";
    input.style.fontSize = "14px";
    
    // Select text on click/focus
    input.addEventListener("click", function() {
      this.select();
    });
    
    input.addEventListener("focus", function() {
      this.select();
    });
    
    // Handle Enter key press to trigger Apply button
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.keyCode === 13) {
        e.preventDefault();
        this.handleApplyBatches();
      }
    });

    const applyBtn = document.createElement("button");
    applyBtn.textContent = "Apply";
    applyBtn.className = "btn";
    applyBtn.style.width = "80px";
    applyBtn.style.height = "32px";
    applyBtn.style.minWidth = "80px";
    applyBtn.style.maxWidth = "80px";
    applyBtn.style.minHeight = "32px";
    applyBtn.style.maxHeight = "32px";
    applyBtn.style.padding = "8px 14px";
    applyBtn.style.background = "#8b5cf6";
    applyBtn.style.color = "#ffffff";
    applyBtn.style.border = "2px solid #8b5cf6";
    applyBtn.style.borderRadius = "6px";
    applyBtn.style.cursor = "pointer";
    applyBtn.style.fontSize = "12px";
    applyBtn.style.fontWeight = "bold";
    applyBtn.style.boxSizing = "border-box";
    applyBtn.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    // Purple halo effect matching json-toggle style but with purple color
    applyBtn.style.boxShadow = `
      inset 0 3px 5px rgba(0, 0, 0, 0.5),
      0 0 10px rgba(139, 92, 246, 0.5),
      0 0 20px rgba(139, 92, 246, 0.3)
    `;
    applyBtn.addEventListener("click", () => {
      this.handleApplyBatches();
    });

    // Create arrow icon pointing to the right
    const arrowIcon = document.createElement("span");
    arrowIcon.innerHTML = "→";
    arrowIcon.style.fontSize = "18px";
    arrowIcon.style.fontWeight = "900";
    arrowIcon.style.color = "#8b5cf6";
    arrowIcon.style.marginLeft = "8px";
    arrowIcon.style.display = "inline-flex";
    arrowIcon.style.alignItems = "center";
    arrowIcon.style.justifyContent = "center";
    arrowIcon.style.transition = "transform 0.3s ease, color 0.3s ease";
    arrowIcon.style.cursor = "default";
    arrowIcon.id = "batches-arrow-indicator";
    
    // Add hover effect to arrow and trigger border animations
    const triggerBorderAnimation = () => {
      const batchManagementSection = document.getElementById("batch-management-section");
      const numberOfBatchesSection = document.getElementById("number-of-batches-section");
      if (batchManagementSection) {
        // Remove any conflicting inline styles
        batchManagementSection.style.removeProperty("box-shadow");
        batchManagementSection.style.removeProperty("border");
        batchManagementSection.style.removeProperty("transition");
        // Add class to trigger gradient border animation (CSS handles the animation)
        batchManagementSection.classList.add("border-pulsing");
        // Force a reflow to ensure animation starts
        void batchManagementSection.offsetHeight;
      }
      if (numberOfBatchesSection) {
        // Remove any conflicting inline styles
        numberOfBatchesSection.style.removeProperty("box-shadow");
        numberOfBatchesSection.style.removeProperty("animation");
        numberOfBatchesSection.style.removeProperty("border");
        numberOfBatchesSection.style.removeProperty("border-color");
        numberOfBatchesSection.style.removeProperty("transition");
        // Add class to trigger gradient border animation (CSS handles the animation)
        numberOfBatchesSection.classList.add("border-pulsing");
        // Force a reflow to ensure animation starts
        void numberOfBatchesSection.offsetHeight;
      }
    };
    
    const removeBorderAnimation = () => {
      const batchManagementSection = document.getElementById("batch-management-section");
      const numberOfBatchesSection = document.getElementById("number-of-batches-section");
      if (batchManagementSection) {
        // Remove the pulsing class (CSS will handle the removal of styles)
        batchManagementSection.classList.remove("border-pulsing");
        // Remove any inline styles that might conflict
        batchManagementSection.style.removeProperty("border");
        batchManagementSection.style.removeProperty("transition");
        batchManagementSection.style.removeProperty("animation");
        batchManagementSection.style.removeProperty("box-shadow");
      }
      if (numberOfBatchesSection) {
        // Remove the pulsing class (CSS will handle the removal of styles)
        numberOfBatchesSection.classList.remove("border-pulsing");
        // Remove any inline styles that might conflict
        numberOfBatchesSection.style.removeProperty("animation");
        numberOfBatchesSection.style.removeProperty("border");
        numberOfBatchesSection.style.removeProperty("border-color");
        numberOfBatchesSection.style.removeProperty("transition");
      }
    };
    
    // Trigger animation on inputContainer hover (includes arrow)
    inputContainer.addEventListener("mouseenter", () => {
      arrowIcon.style.transform = "translateX(4px)";
      arrowIcon.style.color = "#7c3aed";
      triggerBorderAnimation();
    });
    
    inputContainer.addEventListener("mouseleave", () => {
      arrowIcon.style.transform = "translateX(0)";
      arrowIcon.style.color = "#8b5cf6";
      removeBorderAnimation();
    });
    
    // Also trigger directly on arrow hover for better reliability
    arrowIcon.addEventListener("mouseenter", () => {
      arrowIcon.style.transform = "translateX(4px)";
      arrowIcon.style.color = "#7c3aed";
      triggerBorderAnimation();
    });
    
    arrowIcon.addEventListener("mouseleave", () => {
      arrowIcon.style.transform = "translateX(0)";
      arrowIcon.style.color = "#8b5cf6";
      // Only remove animation if mouse is not over inputContainer
      if (!inputContainer.matches(":hover")) {
        removeBorderAnimation();
      }
    });
    
    // Also trigger on input focus
    input.addEventListener("focus", () => {
      triggerBorderAnimation();
    });
    
    input.addEventListener("blur", () => {
      removeBorderAnimation();
    });

    inputContainer.appendChild(input);
    inputContainer.appendChild(applyBtn);
    inputContainer.appendChild(arrowIcon);

    container.appendChild(title);
    container.appendChild(inputContainer);

    return container;
  },

  // Container 4: Batch Management
  createBatchManagementContainer: function() {
    const container = document.createElement("div");
    container.id = "batch-management-section";
    container.className = "form-container";
    container.style.width = "921px";
    container.style.height = "364px";
    container.style.minWidth = "921px";
    container.style.maxWidth = "921px";
    container.style.minHeight = "364px";
    container.style.maxHeight = "364px";
    container.style.padding = "20px";
    container.style.margin = "0";
    container.style.marginTop = "0";
    container.style.marginBottom = "0";
    container.style.marginLeft = "0";
    container.style.marginRight = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(5, 1fr)"; // 5 columns for 5 cards per row
    container.style.gridTemplateRows = "auto repeat(2, auto)"; // Header row + 2 rows of batch cards (10 per page, up to 20 total)
    container.style.gap = "8px";
    container.style.rowGap = "8px";
    container.style.overflowX = "auto";
    container.style.overflowY = "hidden";
    container.style.justifyItems = "center";
    container.style.alignSelf = "flex-start"; // Prevent stretching in flex parent

    // Create wrapper container for collection-size-display, nfts-per-batch, and batch-pagination-container
    // Use CSS Grid to align with batch card columns
    const headerWrapper = document.createElement("div");
    headerWrapper.id = "batch-header-wrapper";
    headerWrapper.style.gridColumn = "1 / -1"; // Spans all columns
    headerWrapper.style.gridRow = "1";
    headerWrapper.style.display = "grid";
    headerWrapper.style.gridTemplateColumns = "repeat(5, 1fr)"; // Same 5 columns as batch cards
    headerWrapper.style.alignItems = "center"; // Vertically center all children
    headerWrapper.style.justifyItems = "start"; // Align items to start of their grid cell
    headerWrapper.style.gap = "8px";
    headerWrapper.style.marginBottom = "8px";

    // Collection Size rectangle (will be created in renderBatchCards, but we'll append it here)
    // We'll create a placeholder that will be replaced in renderBatchCards
    const collectionSizePlaceholder = document.createElement("div");
    collectionSizePlaceholder.id = "collection-size-display-placeholder";
    collectionSizePlaceholder.style.gridColumn = "1"; // Align with batch card 01 (column 1)
    collectionSizePlaceholder.style.justifySelf = "start"; // Align to start of column
    headerWrapper.appendChild(collectionSizePlaceholder);

    // Title spans 2 lines
    const titleContainer = document.createElement("div");
    titleContainer.id = "nfts-per-batch";
    titleContainer.style.gridColumn = "3"; // Align with batch card 03 (column 3)
    titleContainer.style.justifySelf = "center"; // Center align to the 3rd batch container
    titleContainer.style.fontSize = "12px";
    titleContainer.style.fontWeight = "600";
    titleContainer.style.color = "var(--text-primary)";
    titleContainer.style.display = "flex";
    titleContainer.style.flexDirection = "column";
    titleContainer.style.alignItems = "center"; // Center align "NFT's PER BATCH" to "(0 NFTs to be distributed)"
    
    const titleLine1 = document.createElement("div");
    titleLine1.textContent = "NFT's PER BATCH";
    titleLine1.style.fontSize = "12px";
    titleLine1.style.marginBottom = "4px";
    
    const titleLine2 = document.createElement("div");
    titleLine2.id = "batch-distribution-text";
    titleLine2.style.fontWeight = "600";
    titleLine2.style.fontSize = "11px";
    titleLine2.style.cursor = "help"; // Indicate that tooltip is available
    
    // Create a text span that will be updated (to preserve tooltip)
    const textSpan = document.createElement("span");
    textSpan.id = "batch-distribution-text-content";
    textSpan.textContent = "(0 NFTs to be distributed)";
    textSpan.style.color = "#f39c12";
    titleLine2.appendChild(textSpan);
    
    // Add tooltip to batch distribution text
    titleLine2.classList.add("tooltip");
    const batchDistributionTooltip = document.createElement("span");
    batchDistributionTooltip.className = "tooltiptext";
    batchDistributionTooltip.innerHTML = "This shows how many NFTs still need to be distributed across batches. When it shows 0, all NFTs from your collection have been allocated to batches. A positive number means more NFTs need to be distributed, and a negative number (shown as 'Over by X NFTs') means batches exceed the total collection size.";
    batchDistributionTooltip.style.visibility = "hidden";
    batchDistributionTooltip.style.width = "320px";
    batchDistributionTooltip.style.minWidth = "320px";
    batchDistributionTooltip.style.maxWidth = "320px";
    batchDistributionTooltip.style.backgroundColor = "#000000";
    batchDistributionTooltip.style.color = "#f39c12";
    batchDistributionTooltip.style.textAlign = "center";
    batchDistributionTooltip.style.borderRadius = "6px";
    batchDistributionTooltip.style.padding = "8px 10px";
    batchDistributionTooltip.style.position = "fixed";
    batchDistributionTooltip.style.zIndex = "2147483647";
    batchDistributionTooltip.style.bottom = "auto";
    batchDistributionTooltip.style.top = "auto";
    batchDistributionTooltip.style.left = "auto";
    batchDistributionTooltip.style.right = "auto";
    batchDistributionTooltip.style.opacity = "0";
    batchDistributionTooltip.style.transition = "opacity 1s";
    batchDistributionTooltip.style.fontSize = "11px";
    batchDistributionTooltip.style.lineHeight = "1.4";
    batchDistributionTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    batchDistributionTooltip.style.pointerEvents = "none";
    batchDistributionTooltip.style.whiteSpace = "normal";
    batchDistributionTooltip.style.wordWrap = "break-word";
    batchDistributionTooltip.style.overflowWrap = "break-word";
    batchDistributionTooltip.style.boxSizing = "border-box";
    batchDistributionTooltip.style.textTransform = "none"; // Ensure tooltip text is not uppercase
    batchDistributionTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    batchDistributionTooltip.style.top = "-9999px";
    batchDistributionTooltip.style.left = "-9999px";
    titleLine2.appendChild(batchDistributionTooltip);
    
    // Show tooltip on hover
    let batchDistributionTooltipTimeout = null;
    titleLine2.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (batchDistributionTooltipTimeout) {
        clearTimeout(batchDistributionTooltipTimeout);
        batchDistributionTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      batchDistributionTooltipTimeout = setTimeout(() => {
      const rect = titleLine2.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      batchDistributionTooltip.style.visibility = "visible";
      batchDistributionTooltip.style.opacity = "0";
      batchDistributionTooltip.style.top = "-9999px";
      batchDistributionTooltip.style.left = "-9999px";
        batchDistributionTooltip.style.transform = "none";
      void batchDistributionTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 320; // Fixed width
      const tooltipHeight = batchDistributionTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        batchDistributionTooltip.style.setProperty("position", "fixed", "important");
        batchDistributionTooltip.style.setProperty("z-index", "2147483647", "important");
        batchDistributionTooltip.style.setProperty("bottom", "auto", "important");
        batchDistributionTooltip.style.setProperty("right", "auto", "important");
        batchDistributionTooltip.style.setProperty("margin", "0", "important");
        batchDistributionTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const titleRect = titleLine2.getBoundingClientRect();
        const centeredLeft = titleRect.left + (titleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = titleRect.top - tooltipHeight - 5;
        batchDistributionTooltip.style.setProperty("top", `${topPosition}px`, "important");
        batchDistributionTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      batchDistributionTooltip.style.opacity = "1";
        });
        batchDistributionTooltipTimeout = null;
      }, 1000);
    });
    titleLine2.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (batchDistributionTooltipTimeout) {
        clearTimeout(batchDistributionTooltipTimeout);
        batchDistributionTooltipTimeout = null;
      }
      batchDistributionTooltip.style.opacity = "0";
      setTimeout(() => {
        batchDistributionTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    titleContainer.appendChild(titleLine1);
    titleContainer.appendChild(titleLine2);
    headerWrapper.appendChild(titleContainer);

    // Pagination controls container (positioned to align with batch card 05)
    const paginationContainer = document.createElement("div");
    paginationContainer.id = "batch-pagination-container";
    paginationContainer.style.display = "none"; // Hidden by default, shown when numBatches > 10 (supports up to 20 batches, will be changed to "flex")
    paginationContainer.style.gridColumn = "5"; // Align with batch card 05 (column 5)
    paginationContainer.style.justifySelf = "end"; // Right align to end of column
    paginationContainer.style.justifyContent = "flex-end";
    paginationContainer.style.alignItems = "center";
    paginationContainer.style.gap = "12px";
    // Match collection-size-display border and height style
    paginationContainer.style.border = "2px solid #666666"; // Grey border, same thickness as batch cards
    paginationContainer.style.borderRadius = "8px"; // Same rounded borders as batch cards
    paginationContainer.style.width = "161.38px";
    paginationContainer.style.minWidth = "161.38px";
    paginationContainer.style.maxWidth = "161.38px";
    paginationContainer.style.height = "30px";
    paginationContainer.style.minHeight = "30px";
    paginationContainer.style.maxHeight = "30px";
    paginationContainer.style.padding = "0 8px"; // Add horizontal padding for content
    paginationContainer.style.boxSizing = "border-box";
    
    const prevButton = document.createElement("button");
    prevButton.id = "batch-pagination-prev";
    prevButton.textContent = "<";
    prevButton.className = "btn";
    prevButton.style.padding = "0";
    prevButton.style.fontSize = "14px";
    prevButton.style.fontWeight = "600";
    prevButton.style.background = "#8b5cf6"; // Purple square background
    prevButton.style.border = "none";
    prevButton.style.borderRadius = "4px"; // Rounded corners
    prevButton.style.color = "#ffffff";
    prevButton.style.cursor = "pointer";
    prevButton.style.minWidth = "24px";
    prevButton.style.width = "24px";
    prevButton.style.height = "20px";
    prevButton.style.minHeight = "20px";
    prevButton.style.maxHeight = "20px";
    prevButton.style.display = "flex";
    prevButton.style.alignItems = "center";
    prevButton.style.justifyContent = "center";
    prevButton.style.transition = "background-color 0.3s ease, color 0.3s ease";
    
    // Exclude from auto-tooltip system
    prevButton.dataset.noTooltip = "true";
    prevButton.removeAttribute("title");
    prevButton.classList.remove("tooltip");
    
    // Use MutationObserver to prevent tooltips
    const prevObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          prevButton.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              node.remove();
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && prevButton.classList.contains('tooltip')) {
          prevButton.classList.remove("tooltip");
        }
      });
    });
    prevObserver.observe(prevButton, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    const pageIndicator = document.createElement("span");
    pageIndicator.id = "batch-pagination-indicator";
    pageIndicator.style.fontSize = "12px";
    pageIndicator.style.fontWeight = "600";
    pageIndicator.style.color = "#666666";
    pageIndicator.style.textAlign = "center";
    pageIndicator.style.display = "inline-block";
    pageIndicator.style.whiteSpace = "nowrap";
    pageIndicator.style.cursor = "help"; // Indicate that tooltip is available
    
    // Create a text span that will be updated (to preserve tooltip)
    const pageIndicatorText = document.createElement("span");
    pageIndicatorText.id = "batch-pagination-indicator-text";
    pageIndicatorText.textContent = "PAGE 1 OF 1";
    pageIndicator.appendChild(pageIndicatorText);
    
    // Add tooltip to page indicator
    pageIndicator.classList.add("tooltip");
    const pageIndicatorTooltip = document.createElement("span");
    pageIndicatorTooltip.className = "tooltiptext";
    pageIndicatorTooltip.innerHTML = "This indicator shows the current page when browsing the batch cards list. Use the previous and next buttons to navigate between pages.";
    pageIndicatorTooltip.style.visibility = "hidden";
    pageIndicatorTooltip.style.width = "280px";
    pageIndicatorTooltip.style.minWidth = "280px";
    pageIndicatorTooltip.style.maxWidth = "280px";
    pageIndicatorTooltip.style.backgroundColor = "#000000";
    pageIndicatorTooltip.style.color = "#f39c12";
    pageIndicatorTooltip.style.textAlign = "center";
    pageIndicatorTooltip.style.borderRadius = "6px";
    pageIndicatorTooltip.style.padding = "8px 10px";
    pageIndicatorTooltip.style.position = "fixed";
    pageIndicatorTooltip.style.zIndex = "2147483647";
    pageIndicatorTooltip.style.bottom = "auto";
    pageIndicatorTooltip.style.top = "auto";
    pageIndicatorTooltip.style.left = "auto";
    pageIndicatorTooltip.style.right = "auto";
    pageIndicatorTooltip.style.opacity = "0";
    pageIndicatorTooltip.style.transition = "opacity 1s";
    pageIndicatorTooltip.style.fontSize = "11px";
    pageIndicatorTooltip.style.lineHeight = "1.4";
    pageIndicatorTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    pageIndicatorTooltip.style.pointerEvents = "none";
    pageIndicatorTooltip.style.whiteSpace = "normal";
    pageIndicatorTooltip.style.wordWrap = "break-word";
    pageIndicatorTooltip.style.overflowWrap = "break-word";
    pageIndicatorTooltip.style.boxSizing = "border-box";
    pageIndicatorTooltip.style.textTransform = "none"; // Ensure tooltip text is not uppercase
    pageIndicatorTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    pageIndicatorTooltip.style.top = "-9999px";
    pageIndicatorTooltip.style.left = "-9999px";
    pageIndicator.appendChild(pageIndicatorTooltip);
    
    // Show tooltip on hover
    let pageIndicatorTooltipTimeout = null;
    pageIndicator.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (pageIndicatorTooltipTimeout) {
        clearTimeout(pageIndicatorTooltipTimeout);
        pageIndicatorTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      pageIndicatorTooltipTimeout = setTimeout(() => {
      const rect = pageIndicator.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      pageIndicatorTooltip.style.visibility = "visible";
      pageIndicatorTooltip.style.opacity = "0";
      pageIndicatorTooltip.style.top = "-9999px";
      pageIndicatorTooltip.style.left = "-9999px";
        pageIndicatorTooltip.style.transform = "none";
      void pageIndicatorTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = pageIndicatorTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        pageIndicatorTooltip.style.setProperty("position", "fixed", "important");
        pageIndicatorTooltip.style.setProperty("z-index", "2147483647", "important");
        pageIndicatorTooltip.style.setProperty("bottom", "auto", "important");
        pageIndicatorTooltip.style.setProperty("right", "auto", "important");
        pageIndicatorTooltip.style.setProperty("margin", "0", "important");
        pageIndicatorTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const pageRect = pageIndicator.getBoundingClientRect();
        const centeredLeft = pageRect.left + (pageRect.width / 2) - (tooltipWidth / 2);
        const topPosition = pageRect.top - tooltipHeight - 5;
        pageIndicatorTooltip.style.setProperty("top", `${topPosition}px`, "important");
        pageIndicatorTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      pageIndicatorTooltip.style.opacity = "1";
        });
        pageIndicatorTooltipTimeout = null;
      }, 1000);
    });
    pageIndicator.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (pageIndicatorTooltipTimeout) {
        clearTimeout(pageIndicatorTooltipTimeout);
        pageIndicatorTooltipTimeout = null;
      }
      pageIndicatorTooltip.style.opacity = "0";
      setTimeout(() => {
        pageIndicatorTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    const nextButton = document.createElement("button");
    nextButton.id = "batch-pagination-next";
    nextButton.textContent = ">";
    nextButton.className = "btn";
    nextButton.style.padding = "0";
    nextButton.style.fontSize = "14px";
    nextButton.style.fontWeight = "600";
    nextButton.style.background = "#8b5cf6"; // Purple square background
    nextButton.style.border = "none";
    nextButton.style.borderRadius = "4px"; // Rounded corners
    nextButton.style.color = "#ffffff";
    nextButton.style.cursor = "pointer";
    nextButton.style.minWidth = "24px";
    nextButton.style.width = "24px";
    nextButton.style.height = "20px";
    nextButton.style.minHeight = "20px";
    nextButton.style.maxHeight = "20px";
    nextButton.style.display = "flex";
    nextButton.style.alignItems = "center";
    nextButton.style.justifyContent = "center";
    nextButton.style.transition = "background-color 0.3s ease, color 0.3s ease";
    
    // Exclude from auto-tooltip system
    nextButton.dataset.noTooltip = "true";
    nextButton.removeAttribute("title");
    nextButton.classList.remove("tooltip");
    
    // Use MutationObserver to prevent tooltips
    const nextObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          nextButton.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              node.remove();
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && nextButton.classList.contains('tooltip')) {
          nextButton.classList.remove("tooltip");
        }
      });
    });
    nextObserver.observe(nextButton, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    // Hover effects
    prevButton.addEventListener("mouseenter", () => {
      prevButton.style.background = "#7c3aed"; // Darker purple on hover
    });
    prevButton.addEventListener("mouseleave", () => {
      prevButton.style.background = "#8b5cf6"; // Return to original purple
    });
    
    nextButton.addEventListener("mouseenter", () => {
      nextButton.style.background = "#7c3aed"; // Darker purple on hover
    });
    nextButton.addEventListener("mouseleave", () => {
      nextButton.style.background = "#8b5cf6"; // Return to original purple
    });
    
    paginationContainer.appendChild(prevButton);
    paginationContainer.appendChild(pageIndicator);
    paginationContainer.appendChild(nextButton);
    headerWrapper.appendChild(paginationContainer);
    
    container.appendChild(headerWrapper);

    // This will be populated with batch cards
    // For now, we'll create them in renderBatchCards()

    return container;
  },

  // Container: Utilities Section
  createUtilitiesContainer: function() {
    const container = document.createElement("div");
    container.id = "utilities-section";
    container.className = "form-container";
    container.style.width = "256px";
    container.style.height = "556px";
    container.style.minWidth = "256px";
    container.style.maxWidth = "256px";
    container.style.minHeight = "556px";
    container.style.maxHeight = "556px";
    container.style.padding = "20px";
    container.style.margin = "0";
    container.style.marginLeft = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.gap = "16px";
    
    // Title: "Utilities:" (12px) - horizontally aligned with utilities-card
    const title = document.createElement("div");
    title.textContent = "Utilities:";
    title.style.fontSize = "12px";
    title.style.fontWeight = "600";
    title.style.color = "var(--text-primary)";
    title.style.marginBottom = "0";
    title.style.marginTop = "-20px"; // Move 20px up
    title.style.marginLeft = "auto"; // Center horizontally
    title.style.marginRight = "auto"; // Center horizontally
    title.style.textAlign = "center"; // Center-align text
    title.style.lineHeight = "30px"; // Match the height of collection-size-display (30px) for baseline alignment
    title.style.display = "flex";
    title.style.alignItems = "center"; // Vertically center to match batch-header-wrapper alignment
    title.style.justifyContent = "center"; // Center content horizontally
    container.appendChild(title);
    
    // Card 1: Maximum number of NFTs allowed for exportation
    const maxNftsCard = document.createElement("div");
    maxNftsCard.className = "utilities-card";
    maxNftsCard.style.marginTop = "0px"; // Reset to original position (moved 10px down from -10px)
    maxNftsCard.style.padding = "12px";
    maxNftsCard.style.border = "2px solid #666666";
    maxNftsCard.style.borderRadius = "8px";
    maxNftsCard.style.background = "#111111";
    maxNftsCard.style.display = "flex";
    maxNftsCard.style.flexDirection = "column";
    maxNftsCard.style.gap = "12px";
    maxNftsCard.style.width = "174px";
    maxNftsCard.style.minWidth = "174px";
    maxNftsCard.style.maxWidth = "174px";
    maxNftsCard.style.boxSizing = "border-box";
    
    const maxNftsLabel = document.createElement("div");
    maxNftsLabel.innerHTML = "Maximum number of<br>NFTs allowed per batch:";
    maxNftsLabel.style.fontSize = "11px";
    maxNftsLabel.style.fontWeight = "600";
    maxNftsLabel.style.color = "var(--text-primary)";
    maxNftsLabel.style.lineHeight = "1.4";
    maxNftsLabel.className = "tooltip";
    maxNftsLabel.style.cursor = "help";
    maxNftsLabel.style.position = "relative";
    
    // Add tooltip to label
    const maxNftsLabelTooltip = document.createElement("span");
    maxNftsLabelTooltip.className = "tooltiptext";
    maxNftsLabelTooltip.style.visibility = "hidden";
    maxNftsLabelTooltip.style.width = "280px";
    maxNftsLabelTooltip.style.backgroundColor = "#000000";
    maxNftsLabelTooltip.style.background = "#000000";
    maxNftsLabelTooltip.style.color = "#f39c12";
    maxNftsLabelTooltip.style.textAlign = "left";
    maxNftsLabelTooltip.style.padding = "8px";
    maxNftsLabelTooltip.style.borderRadius = "6px";
    maxNftsLabelTooltip.style.position = "fixed";
    maxNftsLabelTooltip.style.zIndex = "2147483647";
    maxNftsLabelTooltip.style.bottom = "auto";
    maxNftsLabelTooltip.style.top = "auto";
    maxNftsLabelTooltip.style.left = "auto";
    maxNftsLabelTooltip.style.right = "auto";
    maxNftsLabelTooltip.style.opacity = "0";
    maxNftsLabelTooltip.style.transition = "opacity 1s";
    maxNftsLabelTooltip.style.fontSize = "11px";
    maxNftsLabelTooltip.style.lineHeight = "1.4";
    maxNftsLabelTooltip.style.pointerEvents = "none";
    maxNftsLabelTooltip.style.boxShadow = "0 3px 10px rgba(0, 0, 0, 0.5)";
    maxNftsLabelTooltip.innerHTML = "This limit helps prevent memory issues when exporting large collections.<br><br>If you experience crashes or slow performance during export, reduce this number. Each batch quantity cannot exceed this maximum.";
    maxNftsLabelTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    maxNftsLabelTooltip.style.top = "-9999px";
    maxNftsLabelTooltip.style.left = "-9999px";
    maxNftsLabel.appendChild(maxNftsLabelTooltip);
    
    // Update tooltip position on mouse move for fixed positioning
    maxNftsLabel.addEventListener("mousemove", (e) => {
      if (maxNftsLabelTooltip.style.visibility === "visible") {
        const rect = maxNftsLabel.getBoundingClientRect();
        const tooltipWidth = 280; // Fixed width
        const tooltipHeight = maxNftsLabelTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        maxNftsLabelTooltip.style.setProperty("position", "fixed", "important");
        maxNftsLabelTooltip.style.setProperty("z-index", "2147483647", "important");
        maxNftsLabelTooltip.style.setProperty("bottom", "auto", "important");
        maxNftsLabelTooltip.style.setProperty("right", "auto", "important");
        maxNftsLabelTooltip.style.setProperty("margin", "0", "important");
        maxNftsLabelTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const labelRect = maxNftsLabel.getBoundingClientRect();
        const centeredLeft = labelRect.left + (labelRect.width / 2) - (tooltipWidth / 2);
        const topPosition = labelRect.top - tooltipHeight - 5;
        maxNftsLabelTooltip.style.setProperty("top", `${topPosition}px`, "important");
        maxNftsLabelTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
      }
    });
    
    let maxNftsLabelTooltipTimeout = null;
    maxNftsLabel.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (maxNftsLabelTooltipTimeout) {
        clearTimeout(maxNftsLabelTooltipTimeout);
        maxNftsLabelTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      maxNftsLabelTooltipTimeout = setTimeout(() => {
      const rect = maxNftsLabel.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      maxNftsLabelTooltip.style.visibility = "visible";
      maxNftsLabelTooltip.style.opacity = "0";
      maxNftsLabelTooltip.style.top = "-9999px";
      maxNftsLabelTooltip.style.left = "-9999px";
        maxNftsLabelTooltip.style.transform = "none";
      void maxNftsLabelTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = maxNftsLabelTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        maxNftsLabelTooltip.style.setProperty("position", "fixed", "important");
        maxNftsLabelTooltip.style.setProperty("z-index", "2147483647", "important");
        maxNftsLabelTooltip.style.setProperty("bottom", "auto", "important");
        maxNftsLabelTooltip.style.setProperty("right", "auto", "important");
        maxNftsLabelTooltip.style.setProperty("margin", "0", "important");
        maxNftsLabelTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const labelRect = maxNftsLabel.getBoundingClientRect();
        const centeredLeft = labelRect.left + (labelRect.width / 2) - (tooltipWidth / 2);
        const topPosition = labelRect.top - tooltipHeight - 5;
        maxNftsLabelTooltip.style.setProperty("top", `${topPosition}px`, "important");
        maxNftsLabelTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      maxNftsLabelTooltip.style.opacity = "1";
        });
        maxNftsLabelTooltipTimeout = null;
      }, 1000);
    });
    
    maxNftsLabel.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (maxNftsLabelTooltipTimeout) {
        clearTimeout(maxNftsLabelTooltipTimeout);
        maxNftsLabelTooltipTimeout = null;
      }
      maxNftsLabelTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        maxNftsLabelTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    const maxNftsInputContainer = document.createElement("div");
    maxNftsInputContainer.style.display = "flex";
    maxNftsInputContainer.style.alignItems = "center";
    maxNftsInputContainer.style.gap = "8px";
    
    // Create wrapper for input with fixed "NFTs" text inside
    const maxNftsInputWrapper = document.createElement("div");
    maxNftsInputWrapper.style.position = "relative";
    maxNftsInputWrapper.style.display = "inline-block";
    
    const maxNftsInput = document.createElement("input");
    maxNftsInput.type = "number";
    maxNftsInput.id = "max-nfts-export-input";
    maxNftsInput.min = "1";
    maxNftsInput.value = "2000";
    maxNftsInput.style.width = "80px";
    maxNftsInput.style.padding = "6px 8px 6px 8px"; // Add right padding for "NFTs" text
    maxNftsInput.style.paddingRight = "40px"; // Space for "NFTs" text
    maxNftsInput.style.border = "1px solid #666666";
    maxNftsInput.style.borderRadius = "4px";
    maxNftsInput.style.background = "var(--bg-primary)";
    maxNftsInput.style.color = "var(--text-primary)";
    maxNftsInput.style.fontSize = "12px";
    maxNftsInput.style.textAlign = "left";
    // Remove number input arrows
    maxNftsInput.style.appearance = "textfield";
    maxNftsInput.style.webkitAppearance = "textfield";
    maxNftsInput.style.boxSizing = "border-box";
    
    // Add fixed "NFTs" text inside the input
    const nftsLabelInside = document.createElement("span");
    nftsLabelInside.id = "max-nfts-export-input-label";
    nftsLabelInside.textContent = "NFTs";
    nftsLabelInside.style.position = "absolute";
    nftsLabelInside.style.right = "8px";
    nftsLabelInside.style.top = "50%";
    nftsLabelInside.style.transform = "translateY(-50%)";
    nftsLabelInside.style.fontSize = "12px";
    nftsLabelInside.style.color = "var(--text-primary)";
    nftsLabelInside.style.pointerEvents = "none"; // Don't interfere with input clicks
    nftsLabelInside.style.userSelect = "none";
    
    // Add tooltip to wrapper
    const maxNftsInputTooltip = document.createElement("span");
    maxNftsInputTooltip.className = "tooltiptext";
    maxNftsInputTooltip.style.visibility = "hidden";
    maxNftsInputTooltip.style.width = "280px";
    maxNftsInputTooltip.style.backgroundColor = "#000000";
    maxNftsInputTooltip.style.background = "#000000";
    maxNftsInputTooltip.style.color = "#f39c12";
    maxNftsInputTooltip.style.textAlign = "left";
    maxNftsInputTooltip.style.padding = "8px";
    maxNftsInputTooltip.style.borderRadius = "6px";
    maxNftsInputTooltip.style.position = "fixed";
    maxNftsInputTooltip.style.zIndex = "2147483647";
    maxNftsInputTooltip.style.bottom = "auto";
    maxNftsInputTooltip.style.top = "auto";
    maxNftsInputTooltip.style.left = "auto";
    maxNftsInputTooltip.style.right = "auto";
    maxNftsInputTooltip.style.opacity = "0";
    maxNftsInputTooltip.style.transition = "opacity 1s";
    maxNftsInputTooltip.style.fontSize = "11px";
    maxNftsInputTooltip.style.lineHeight = "1.4";
    maxNftsInputTooltip.style.pointerEvents = "none";
    maxNftsInputTooltip.style.boxShadow = "0 3px 10px rgba(0, 0, 0, 0.5)";
    maxNftsInputTooltip.innerHTML = "This limit helps prevent memory issues when exporting large collections.<br><br>If you experience crashes or slow performance during export, reduce this number. Each batch quantity cannot exceed this maximum.";
    maxNftsInputTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    maxNftsInputTooltip.style.top = "-9999px";
    maxNftsInputTooltip.style.left = "-9999px";
    
    maxNftsInputWrapper.appendChild(maxNftsInput);
    maxNftsInputWrapper.appendChild(nftsLabelInside);
    maxNftsInputWrapper.appendChild(maxNftsInputTooltip);
    maxNftsInputWrapper.className = "tooltip";
    maxNftsInputWrapper.style.cursor = "help";
    
    let maxNftsInputTooltipTimeout = null;
    maxNftsInputWrapper.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (maxNftsInputTooltipTimeout) {
        clearTimeout(maxNftsInputTooltipTimeout);
        maxNftsInputTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      maxNftsInputTooltipTimeout = setTimeout(() => {
      const rect = maxNftsInputWrapper.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      maxNftsInputTooltip.style.visibility = "visible";
      maxNftsInputTooltip.style.opacity = "0";
      maxNftsInputTooltip.style.top = "-9999px";
      maxNftsInputTooltip.style.left = "-9999px";
        maxNftsInputTooltip.style.transform = "none";
      void maxNftsInputTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = maxNftsInputTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        maxNftsInputTooltip.style.setProperty("position", "fixed", "important");
        maxNftsInputTooltip.style.setProperty("z-index", "2147483647", "important");
        maxNftsInputTooltip.style.setProperty("bottom", "auto", "important");
        maxNftsInputTooltip.style.setProperty("right", "auto", "important");
        maxNftsInputTooltip.style.setProperty("margin", "0", "important");
        maxNftsInputTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const inputRect = maxNftsInputWrapper.getBoundingClientRect();
        const centeredLeft = inputRect.left + (inputRect.width / 2) - (tooltipWidth / 2);
        const topPosition = inputRect.top - tooltipHeight - 5;
        maxNftsInputTooltip.style.setProperty("top", `${topPosition}px`, "important");
        maxNftsInputTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      maxNftsInputTooltip.style.opacity = "1";
        });
        maxNftsInputTooltipTimeout = null;
      }, 1000);
    });
    
    maxNftsInputWrapper.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (maxNftsInputTooltipTimeout) {
        clearTimeout(maxNftsInputTooltipTimeout);
        maxNftsInputTooltipTimeout = null;
      }
      maxNftsInputTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        maxNftsInputTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    // Only allow numbers
    maxNftsInput.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
        e.preventDefault();
      }
    });
    
    // Validate batches when maximum changes
    maxNftsInput.addEventListener("input", () => {
      this.validateBatchQuantities();
      this.checkExportButtonState();
    });
    
    maxNftsInput.addEventListener("blur", () => {
      this.validateBatchQuantities();
      this.checkExportButtonState();
    });
    
    maxNftsInputContainer.appendChild(maxNftsInputWrapper);
    
    maxNftsCard.appendChild(maxNftsLabel);
    maxNftsCard.appendChild(maxNftsInputContainer);
    container.appendChild(maxNftsCard);
    
    // Card 2: Export options (3 radio-style toggles)
    const exportOptionsCard = document.createElement("div");
    exportOptionsCard.id = "export-nfts-metadata-options";
    exportOptionsCard.className = "utilities-card";
    exportOptionsCard.style.marginTop = "4px"; // 4px spacing from utilities-card
    exportOptionsCard.style.padding = "12px";
    exportOptionsCard.style.border = "2px solid #666666";
    exportOptionsCard.style.borderRadius = "8px";
    exportOptionsCard.style.background = "#111111";
    exportOptionsCard.style.display = "flex";
    exportOptionsCard.style.flexDirection = "column";
    exportOptionsCard.style.gap = "8px";
    exportOptionsCard.style.width = "174px";
    exportOptionsCard.style.height = "128px";
    exportOptionsCard.style.minWidth = "174px";
    exportOptionsCard.style.maxWidth = "174px";
    exportOptionsCard.style.minHeight = "128px";
    exportOptionsCard.style.maxHeight = "128px";
    exportOptionsCard.style.boxSizing = "border-box";
    
    // Create 3 radio-style toggle buttons
    const exportOptions = [
      { 
        id: "export-option-nfts-only", 
        text: "Export NFTs Only",
        tooltip: "Export only image files. Use this option if you experience memory problems - it reduces memory usage by skipping metadata processing"
      },
      { 
        id: "export-option-metadata-only", 
        text: "Export Metadata Only",
        tooltip: "Export only metadata files. Use this option if you experience memory problems - it reduces memory usage by skipping image processing"
      },
      { 
        id: "export-option-nfts-metadata", 
        text: "Export NFTs/Metadata",
        tooltip: "Export both images and metadata files. Uses more memory but exports everything in one go"
      }
    ];
    
    // Initialize state: "Export NFTs/Metadata" is default
    this.exportOption = "export-option-nfts-metadata";
    
    exportOptions.forEach((option, index) => {
      const toggle = document.createElement("button");
      toggle.id = option.id;
      toggle.type = "button";
      toggle.className = "export-option-toggle tooltip";
      toggle.textContent = option.text;
      
      // Add tooltip with proper styling
      const tooltip = document.createElement("span");
      tooltip.className = "tooltiptext";
      tooltip.textContent = option.tooltip;
      tooltip.style.visibility = "hidden";
      tooltip.style.width = "280px";
      tooltip.style.minWidth = "280px";
      tooltip.style.maxWidth = "280px";
      tooltip.style.backgroundColor = "#000000";
      tooltip.style.color = "#f39c12";
      tooltip.style.textAlign = "center";
      tooltip.style.borderRadius = "6px";
      tooltip.style.padding = "8px 10px";
      tooltip.style.position = "fixed";
      tooltip.style.zIndex = "2147483647";
      tooltip.style.bottom = "auto";
      tooltip.style.top = "auto";
      tooltip.style.left = "auto";
      tooltip.style.right = "auto";
      tooltip.style.opacity = "0";
      tooltip.style.transition = "opacity 1s ease";
      // Ensure transition works even with !important opacity
      tooltip.style.setProperty("transition", "opacity 1s ease", "important");
      tooltip.style.fontSize = "11px";
      tooltip.style.lineHeight = "1.4";
      tooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
      tooltip.style.pointerEvents = "none";
      tooltip.style.whiteSpace = "normal";
      tooltip.style.wordWrap = "break-word";
      tooltip.style.overflowWrap = "break-word";
      tooltip.style.boxSizing = "border-box";
      tooltip.style.transform = "none";
      // Ensure tooltip is always fully opaque when visible, even if parent has opacity: 0.5
      tooltip.style.setProperty("opacity", "0", "important");
      toggle.appendChild(tooltip);
      
      // Store timeout reference for fade out
      let tooltipTimeout = null;
      
      // Show tooltip on hover with proper positioning
      // Hide other export option tooltips when showing this one (with fade out)
      toggle.addEventListener("mouseenter", (e) => {
        // Clear any existing timeout for this tooltip
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
          tooltipTimeout = null;
        }
        
        // Show tooltip after 1 second delay (to prevent accidental display when moving cursor)
        tooltipTimeout = setTimeout(() => {
          // Fade out all other export option tooltips first
          exportOptions.forEach((opt) => {
            const otherToggle = document.getElementById(opt.id);
            if (otherToggle && otherToggle !== toggle) {
              const otherTooltip = otherToggle.querySelector(".tooltiptext");
              if (otherTooltip) {
                // Fade out other tooltip
                otherTooltip.style.setProperty("opacity", "0", "important");
                // Clear any existing timeout for other tooltip
                if (otherToggle._tooltipTimeout) {
                  clearTimeout(otherToggle._tooltipTimeout);
                }
                // Hide after fade out completes
                otherToggle._tooltipTimeout = setTimeout(() => {
                  otherTooltip.style.visibility = "hidden";
                  otherToggle._tooltipTimeout = null;
                }, 1000);
              }
            }
          });
          
        const rect = toggle.getBoundingClientRect();
        // Make tooltip temporarily visible to measure height, but keep it off-screen
        tooltip.style.visibility = "visible";
          tooltip.style.setProperty("opacity", "0", "important");
        tooltip.style.top = "-9999px";
        tooltip.style.left = "-9999px";
          tooltip.style.transform = "none";
        void tooltip.offsetHeight; // Force reflow
        const tooltipWidth = 280; // Fixed width
        const tooltipHeight = tooltip.offsetHeight;
          // CRITICAL: Set position fixed and use setProperty with important to override CSS
          tooltip.style.setProperty("position", "fixed", "important");
          tooltip.style.setProperty("z-index", "2147483647", "important");
          tooltip.style.setProperty("bottom", "auto", "important");
          tooltip.style.setProperty("right", "auto", "important");
          tooltip.style.setProperty("margin", "0", "important");
          tooltip.style.setProperty("transform", "none", "important");
          // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
          const toggleRect = toggle.getBoundingClientRect();
          const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
          const topPosition = toggleRect.top - tooltipHeight - 5;
          tooltip.style.setProperty("top", `${topPosition}px`, "important");
          tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
          // Fade in - use requestAnimationFrame to ensure transition works
          // CRITICAL: Always set opacity to 1 with !important to override parent opacity
          requestAnimationFrame(() => {
            tooltip.style.setProperty("opacity", "1", "important");
            // Force a reflow to ensure the opacity is applied
            void tooltip.offsetHeight;
            // Set again to ensure it sticks even if parent has opacity: 0.5
            tooltip.style.setProperty("opacity", "1", "important");
          });
          tooltipTimeout = null;
        }, 1000); // 1 second delay to prevent accidental display
      });
      
      toggle.addEventListener("mouseleave", () => {
        // Clear any existing timeout
        if (tooltipTimeout) {
          clearTimeout(tooltipTimeout);
        }
        // Fade out
        tooltip.style.setProperty("opacity", "0", "important");
        // Wait for fade out transition to complete before hiding
        tooltipTimeout = setTimeout(() => {
          tooltip.style.visibility = "hidden";
          tooltipTimeout = null;
        }, 1000); // Match the 1s transition duration
      });
      toggle.style.padding = "8px 12px";
      toggle.style.border = "2px solid #4a4a4a";
      toggle.style.borderRadius = "6px";
      toggle.style.background = index === 2 ? "#8b5cf6" : "#2a2a2a"; // Default: Export NFTs/Metadata
      toggle.style.color = index === 2 ? "#ffffff" : "#666"; // Use #666 (same as #666666) to match greyed out objects // Grey text for inactive
      toggle.style.fontSize = "11px";
      toggle.style.fontWeight = index === 2 ? "600" : "400";
      toggle.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      toggle.style.cursor = "help"; // Show help cursor for objects with tooltips
      toggle.style.width = "100%";
      toggle.style.minWidth = "100%";
      toggle.style.maxWidth = "100%";
      toggle.style.height = "auto";
      toggle.style.minHeight = "auto";
      toggle.style.maxHeight = "none";
      toggle.style.textAlign = "center";
      toggle.style.boxSizing = "border-box";
      toggle.style.display = "block";
      // For "Export NFTs & Metadata", keep text on one line using setProperty with !important
      if (option.id === "export-option-nfts-metadata") {
        toggle.style.setProperty("white-space", "nowrap", "important");
        toggle.style.setProperty("word-wrap", "normal", "important");
        toggle.style.setProperty("overflow", "hidden", "important");
        toggle.style.setProperty("text-overflow", "ellipsis", "important");
      } else {
        toggle.style.whiteSpace = "normal";
        toggle.style.wordWrap = "break-word";
      }
      toggle.style.transition = "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease";
      
      if (index === 2) {
        toggle.classList.add("active");
      }
      
      toggle.addEventListener("click", () => {
        // Deactivate all toggles and grey them out
        exportOptions.forEach((opt) => {
          const otherToggle = document.getElementById(opt.id);
          if (otherToggle) {
            otherToggle.classList.remove("active");
            otherToggle.style.background = "#2a2a2a";
            otherToggle.style.borderColor = "#4a4a4a";
            otherToggle.style.color = "#666"; // Use #666 to match greyed out objects
            otherToggle.style.fontWeight = "400";
            otherToggle.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
            otherToggle.style.cursor = "pointer";
          }
        });
        
        // Activate clicked toggle
        toggle.classList.add("active");
        toggle.style.background = "#8b5cf6";
        toggle.style.borderColor = "#8b5cf6";
        toggle.style.color = "#ffffff";
        toggle.style.fontWeight = "600";
        toggle.style.opacity = "1";
        toggle.style.cursor = "pointer";
        
        // Update state
        this.exportOption = option.id;
      });
      
      exportOptionsCard.appendChild(toggle);
    });
    
    container.appendChild(exportOptionsCard);
    
    // Card 3: Image Dimensions for Exportation
    const imageDimensionsCard = document.createElement("div");
    imageDimensionsCard.id = "export-image-dimensions-options";
    imageDimensionsCard.className = "utilities-card";
    imageDimensionsCard.style.marginTop = "3px"; // 3px spacing from export-nfts-metadata-options (reduced by 1px from 4px)
    imageDimensionsCard.style.padding = "12px";
    imageDimensionsCard.style.border = "2px solid #666666";
    imageDimensionsCard.style.borderRadius = "8px";
    imageDimensionsCard.style.background = "#111111";
    imageDimensionsCard.style.display = "flex";
    imageDimensionsCard.style.flexDirection = "column";
    imageDimensionsCard.style.gap = "8px";
    imageDimensionsCard.style.width = "174px";
    imageDimensionsCard.style.height = "auto";
    imageDimensionsCard.style.minWidth = "174px";
    imageDimensionsCard.style.maxWidth = "174px";
    imageDimensionsCard.style.minHeight = "auto";
    imageDimensionsCard.style.maxHeight = "none";
    imageDimensionsCard.style.boxSizing = "border-box";
    
    // Title: "Image Dimensions" and "for Exportation" (2 lines, 12px each)
    const titleContainer = document.createElement("div");
    titleContainer.style.display = "flex";
    titleContainer.style.flexDirection = "column";
    titleContainer.style.gap = "0";
    titleContainer.style.marginBottom = "8px";
    
    const titleLine1 = document.createElement("div");
    titleLine1.textContent = "Image Dimensions";
    titleLine1.style.fontSize = "12px";
    titleLine1.style.fontWeight = "600";
    titleLine1.style.color = "var(--text-primary)";
    
    const titleLine2 = document.createElement("div");
    titleLine2.textContent = "for Exportation:";
    titleLine2.style.fontSize = "12px";
    titleLine2.style.fontWeight = "600";
    titleLine2.style.color = "var(--text-primary)";
    
    titleContainer.appendChild(titleLine1);
    titleContainer.appendChild(titleLine2);
    imageDimensionsCard.appendChild(titleContainer);
    
    // Toggle buttons: ORIGINAL and CUSTOM
    const dimensionTogglesContainer = document.createElement("div");
    dimensionTogglesContainer.style.display = "flex";
    dimensionTogglesContainer.style.gap = "8px";
    dimensionTogglesContainer.style.marginBottom = "8px";
    dimensionTogglesContainer.style.width = "146px"; // Total width: 69px + 8px + 69px = 146px
    dimensionTogglesContainer.style.boxSizing = "border-box";
    
    const originalToggle = document.createElement("button");
    originalToggle.id = "image-dimension-original-toggle";
    originalToggle.type = "button";
    originalToggle.className = "export-option-toggle tooltip";
    originalToggle.textContent = "ORIGINAL";
    originalToggle.style.padding = "8px 6px"; // Reduced horizontal padding
    originalToggle.style.border = "2px solid #4a4a4a";
    originalToggle.style.borderRadius = "6px";
    originalToggle.style.background = "#8b5cf6"; // Active by default
    originalToggle.style.color = "#ffffff";
    originalToggle.style.fontSize = "10px"; // Reduced from 11px
    originalToggle.style.fontWeight = "600";
    originalToggle.style.opacity = "1";
    originalToggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    originalToggle.style.width = "69px"; // (146 - 8) / 2 = 69px per button
    originalToggle.style.minWidth = "69px";
    originalToggle.style.maxWidth = "69px";
    originalToggle.style.boxSizing = "border-box";
    originalToggle.style.whiteSpace = "nowrap";
    originalToggle.style.flexShrink = "0";
    originalToggle.style.flexGrow = "0";
    originalToggle.classList.add("active");
    
    // Add tooltip to ORIGINAL toggle with proper styling
    const originalTooltip = document.createElement("span");
    originalTooltip.className = "tooltiptext";
    originalTooltip.innerHTML = "Export NFTs using their original<br>dimensions from trait images.";
    originalTooltip.style.visibility = "hidden";
    originalTooltip.style.width = "260px";
    originalTooltip.style.minWidth = "260px";
    originalTooltip.style.maxWidth = "260px";
    originalTooltip.style.backgroundColor = "#000000";
    originalTooltip.style.color = "#f39c12";
    originalTooltip.style.textAlign = "center";
    originalTooltip.style.borderRadius = "6px";
    originalTooltip.style.padding = "8px 10px";
    originalTooltip.style.position = "fixed";
    originalTooltip.style.zIndex = "2147483647";
    originalTooltip.style.bottom = "auto";
    originalTooltip.style.top = "auto";
    originalTooltip.style.left = "auto";
    originalTooltip.style.right = "auto";
    originalTooltip.style.opacity = "0";
    originalTooltip.style.transition = "opacity 1s";
    originalTooltip.style.fontSize = "11px";
    originalTooltip.style.lineHeight = "1.4";
    originalTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    originalTooltip.style.pointerEvents = "none";
    originalTooltip.style.whiteSpace = "normal";
    originalTooltip.style.wordWrap = "break-word";
    originalTooltip.style.overflowWrap = "break-word";
    originalTooltip.style.boxSizing = "border-box";
    originalTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    originalTooltip.style.top = "-9999px";
    originalTooltip.style.left = "-9999px";
    originalToggle.appendChild(originalTooltip);
    
    // Show tooltip on hover with proper positioning
    let originalTooltipTimeout = null;
    originalToggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (originalTooltipTimeout) {
        clearTimeout(originalTooltipTimeout);
        originalTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      originalTooltipTimeout = setTimeout(() => {
      const rect = originalToggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      originalTooltip.style.visibility = "visible";
      originalTooltip.style.opacity = "0";
      originalTooltip.style.top = "-9999px";
      originalTooltip.style.left = "-9999px";
        originalTooltip.style.transform = "none";
      void originalTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = originalTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        originalTooltip.style.setProperty("position", "fixed", "important");
        originalTooltip.style.setProperty("z-index", "2147483647", "important");
        originalTooltip.style.setProperty("bottom", "auto", "important");
        originalTooltip.style.setProperty("right", "auto", "important");
        originalTooltip.style.setProperty("margin", "0", "important");
        originalTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = originalToggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        originalTooltip.style.setProperty("top", `${topPosition}px`, "important");
        originalTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      originalTooltip.style.opacity = "1";
        });
        originalTooltipTimeout = null;
      }, 1000);
    });
    originalToggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (originalTooltipTimeout) {
        clearTimeout(originalTooltipTimeout);
        originalTooltipTimeout = null;
      }
      originalTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        originalTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    const customToggle = document.createElement("button");
    customToggle.id = "image-dimension-custom-toggle";
    customToggle.type = "button";
    customToggle.className = "export-option-toggle tooltip";
    customToggle.textContent = "CUSTOM";
    customToggle.style.padding = "8px 6px"; // Reduced horizontal padding
    customToggle.style.border = "2px solid #4a4a4a";
    customToggle.style.borderRadius = "6px";
    customToggle.style.background = "#2a2a2a"; // Inactive by default
    customToggle.style.color = "#666"; // Use #666 to match greyed out objects
    customToggle.style.fontSize = "10px"; // Reduced from 11px
    customToggle.style.fontWeight = "400";
    customToggle.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    customToggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    customToggle.style.width = "69px"; // (146 - 8) / 2 = 69px per button
    customToggle.style.minWidth = "69px";
    customToggle.style.maxWidth = "69px";
    customToggle.style.boxSizing = "border-box";
    customToggle.style.whiteSpace = "nowrap";
    customToggle.style.flexShrink = "0";
    customToggle.style.flexGrow = "0";
    
    // Add tooltip to CUSTOM toggle with proper styling
    const customTooltip = document.createElement("span");
    customTooltip.className = "tooltiptext";
    customTooltip.textContent = "Set custom width and height for exported images";
    customTooltip.style.visibility = "hidden";
    customTooltip.style.width = "260px";
    customTooltip.style.minWidth = "260px";
    customTooltip.style.maxWidth = "260px";
    customTooltip.style.backgroundColor = "#000000";
    customTooltip.style.color = "#f39c12";
    customTooltip.style.textAlign = "center";
    customTooltip.style.borderRadius = "6px";
    customTooltip.style.padding = "8px 10px";
    customTooltip.style.position = "fixed";
    customTooltip.style.zIndex = "2147483647";
    customTooltip.style.bottom = "auto";
    customTooltip.style.top = "auto";
    customTooltip.style.left = "auto";
    customTooltip.style.right = "auto";
    customTooltip.style.opacity = "0";
    customTooltip.style.transition = "opacity 1s";
    customTooltip.style.fontSize = "11px";
    customTooltip.style.lineHeight = "1.4";
    customTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    customTooltip.style.pointerEvents = "none";
    customTooltip.style.whiteSpace = "normal";
    customTooltip.style.wordWrap = "break-word";
    customTooltip.style.overflowWrap = "break-word";
    customTooltip.style.boxSizing = "border-box";
    customTooltip.style.transform = "none";
    // Position off-screen initially to prevent global handlers from positioning incorrectly
    customTooltip.style.top = "-9999px";
    customTooltip.style.left = "-9999px";
    customToggle.appendChild(customTooltip);
    
    // Show tooltip on hover with proper positioning
    let customTooltipTimeout = null;
    customToggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (customTooltipTimeout) {
        clearTimeout(customTooltipTimeout);
        customTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      customTooltipTimeout = setTimeout(() => {
      const rect = customToggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      customTooltip.style.visibility = "visible";
      customTooltip.style.opacity = "0";
      customTooltip.style.top = "-9999px";
      customTooltip.style.left = "-9999px";
        customTooltip.style.transform = "none";
      void customTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = customTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        customTooltip.style.setProperty("position", "fixed", "important");
        customTooltip.style.setProperty("z-index", "2147483647", "important");
        customTooltip.style.setProperty("bottom", "auto", "important");
        customTooltip.style.setProperty("right", "auto", "important");
        customTooltip.style.setProperty("margin", "0", "important");
        customTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = customToggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        customTooltip.style.setProperty("top", `${topPosition}px`, "important");
        customTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      customTooltip.style.opacity = "1";
        });
        customTooltipTimeout = null;
      }, 1000);
    });
    customToggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (customTooltipTimeout) {
        clearTimeout(customTooltipTimeout);
        customTooltipTimeout = null;
      }
      customTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        customTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    // Toggle click handlers
    const updateDimensionToggles = () => {
      if (this.useOriginalImageSize) {
        originalToggle.classList.add("active");
        originalToggle.style.background = "#8b5cf6";
        originalToggle.style.borderColor = "#8b5cf6";
        originalToggle.style.color = "#ffffff";
        originalToggle.style.fontWeight = "600";
        originalToggle.style.opacity = "1";
        
        customToggle.classList.remove("active");
        customToggle.style.background = "#2a2a2a";
        customToggle.style.borderColor = "#4a4a4a";
        customToggle.style.color = "#666"; // Use #666 to match greyed out objects
        customToggle.style.fontWeight = "400";
        customToggle.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      } else {
        customToggle.classList.add("active");
        customToggle.style.background = "#8b5cf6";
        customToggle.style.borderColor = "#8b5cf6";
        customToggle.style.color = "#ffffff";
        customToggle.style.fontWeight = "600";
        customToggle.style.opacity = "1";
        
        originalToggle.classList.remove("active");
        originalToggle.style.background = "#2a2a2a";
        originalToggle.style.borderColor = "#4a4a4a";
        originalToggle.style.color = "#666"; // Use #666 to match greyed out objects
        originalToggle.style.fontWeight = "400";
        originalToggle.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      }
    };
    
    originalToggle.addEventListener("click", () => {
      this.useOriginalImageSize = true;
      updateDimensionToggles();
      // Disable inputs and reset to original values
      widthInput.disabled = true;
      heightInput.disabled = true;
      widthInput.value = this.originalImageWidth;
      heightInput.value = this.originalImageHeight;
      this.customImageWidth = this.originalImageWidth;
      this.customImageHeight = this.originalImageHeight;
      // Grey out the inputs and labels
      widthInput.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      heightInput.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      widthInput.style.cursor = "not-allowed";
      heightInput.style.cursor = "not-allowed";
      xLabel.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      pxLabel.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    });
    
    customToggle.addEventListener("click", () => {
      this.useOriginalImageSize = false;
      updateDimensionToggles();
      // Enable inputs
      widthInput.disabled = false;
      heightInput.disabled = false;
      // Make inputs and labels look normal (not greyed out)
      widthInput.style.opacity = "1";
      heightInput.style.opacity = "1";
      widthInput.style.cursor = "text";
      heightInput.style.cursor = "text";
      xLabel.style.opacity = "1";
      pxLabel.style.opacity = "1";
    });
    
    dimensionTogglesContainer.appendChild(originalToggle);
    dimensionTogglesContainer.appendChild(customToggle);
    imageDimensionsCard.appendChild(dimensionTogglesContainer);
    
    // Width and Height input fields
    const dimensionsInputContainer = document.createElement("div");
    dimensionsInputContainer.style.display = "flex";
    dimensionsInputContainer.style.gap = "8px";
    dimensionsInputContainer.style.alignItems = "center";
    dimensionsInputContainer.style.justifyContent = "center";
    
    const widthInput = document.createElement("input");
    widthInput.id = "export-image-width-input";
    widthInput.type = "number";
    widthInput.min = "1";
    widthInput.value = this.originalImageWidth;
    widthInput.style.width = "60px";
    widthInput.style.padding = "6px 8px";
    widthInput.style.border = "1px solid #666666";
    widthInput.style.borderRadius = "4px";
    widthInput.style.background = "var(--bg-primary)";
    widthInput.style.color = "var(--text-primary)";
    widthInput.style.fontSize = "12px";
    widthInput.style.textAlign = "center";
    widthInput.style.appearance = "textfield";
    widthInput.style.webkitAppearance = "textfield";
    widthInput.style.boxSizing = "border-box";
    widthInput.disabled = true; // Disabled by default (ORIGINAL selected)
    widthInput.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    widthInput.style.cursor = "not-allowed"; // Show not-allowed cursor when disabled
    
    const xLabel = document.createElement("span");
    xLabel.id = "export-image-x-label";
    xLabel.textContent = "x";
    xLabel.style.fontSize = "12px";
    xLabel.style.color = "var(--text-primary)";
    xLabel.style.fontWeight = "600";
    xLabel.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    
    const heightInput = document.createElement("input");
    heightInput.id = "export-image-height-input";
    heightInput.type = "number";
    heightInput.min = "1";
    heightInput.value = this.originalImageHeight;
    heightInput.style.width = "60px";
    heightInput.style.padding = "6px 8px";
    heightInput.style.border = "1px solid #666666";
    heightInput.style.borderRadius = "4px";
    heightInput.style.background = "var(--bg-primary)";
    heightInput.style.color = "var(--text-primary)";
    heightInput.style.fontSize = "12px";
    heightInput.style.textAlign = "center";
    heightInput.style.appearance = "textfield";
    heightInput.style.webkitAppearance = "textfield";
    heightInput.style.boxSizing = "border-box";
    heightInput.disabled = true; // Disabled by default (ORIGINAL selected)
    heightInput.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    heightInput.style.cursor = "not-allowed"; // Show not-allowed cursor when disabled
    
    const pxLabel = document.createElement("span");
    pxLabel.id = "export-image-px-label";
    pxLabel.textContent = "px";
    pxLabel.style.fontSize = "12px";
    pxLabel.style.color = "var(--text-primary)";
    pxLabel.style.fontWeight = "600";
    pxLabel.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    
    // Store aspect ratio based on original dimensions
    const getAspectRatio = () => {
      return this.originalImageWidth / this.originalImageHeight;
    };
    
    // Width input handler - maintain aspect ratio
    widthInput.addEventListener("input", () => {
      const newWidth = parseInt(widthInput.value) || 1;
      if (newWidth > 0 && !this.useOriginalImageSize) {
        const aspectRatio = getAspectRatio();
        const newHeight = Math.round(newWidth / aspectRatio);
        heightInput.value = newHeight;
        this.customImageWidth = newWidth;
        this.customImageHeight = newHeight;
      }
    });
    
    // Height input handler - maintain aspect ratio
    heightInput.addEventListener("input", () => {
      const newHeight = parseInt(heightInput.value) || 1;
      if (newHeight > 0 && !this.useOriginalImageSize) {
        const aspectRatio = getAspectRatio();
        const newWidth = Math.round(newHeight * aspectRatio);
        widthInput.value = newWidth;
        this.customImageWidth = newWidth;
        this.customImageHeight = newHeight;
      }
    });
    
    // Only allow integers
    widthInput.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
        e.preventDefault();
      }
    });
    
    heightInput.addEventListener("keypress", (e) => {
      if (!/[0-9]/.test(e.key) && e.key !== "Backspace" && e.key !== "Delete" && e.key !== "ArrowLeft" && e.key !== "ArrowRight") {
        e.preventDefault();
      }
    });
    
    // Update custom values when custom toggle is activated
    customToggle.addEventListener("click", () => {
      // Update custom values to match original initially
      this.customImageWidth = this.originalImageWidth;
      this.customImageHeight = this.originalImageHeight;
      widthInput.value = this.originalImageWidth;
      heightInput.value = this.originalImageHeight;
    });
    
    dimensionsInputContainer.appendChild(widthInput);
    dimensionsInputContainer.appendChild(xLabel);
    dimensionsInputContainer.appendChild(heightInput);
    dimensionsInputContainer.appendChild(pxLabel);
    imageDimensionsCard.appendChild(dimensionsInputContainer);
    
    container.appendChild(imageDimensionsCard);
    
    // Button: "Merge Metadata Files"
    const mergeButton = document.createElement("button");
    mergeButton.id = "merge-metadata-files-btn";
    mergeButton.textContent = "Merge Metadata Files";
    mergeButton.className = "btn tooltip";
    mergeButton.style.width = "174px";
    mergeButton.style.minWidth = "174px";
    mergeButton.style.maxWidth = "174px";
    mergeButton.style.height = "40px";
    mergeButton.style.padding = "8px 16px";
    mergeButton.style.background = "#3b82f6";
    mergeButton.style.color = "#ffffff";
    mergeButton.style.border = "none";
    mergeButton.style.borderRadius = "6px";
    mergeButton.style.cursor = "help"; // Show help cursor for objects with tooltips
    mergeButton.style.fontSize = "12px";
    mergeButton.style.fontWeight = "600";
    mergeButton.style.boxSizing = "border-box";
    mergeButton.style.marginTop = "0"; // No margin-top
    mergeButton.style.marginBottom = "0";
    mergeButton.style.transform = "translateY(3px)"; // Move 3px down (from -7px, moved 10px down)
    
    // Add tooltip explaining what the button does
    const tooltip = document.createElement("span");
    tooltip.className = "tooltiptext";
    tooltip.innerHTML = "Combine multiple JSON or CSV metadata files into one file,<br>if you need only one metadata file to mint your collection.";
    tooltip.style.visibility = "hidden";
    tooltip.style.width = "auto";
    tooltip.style.minWidth = "auto";
    tooltip.style.maxWidth = "350px";
    tooltip.style.height = "auto";
    tooltip.style.minHeight = "auto";
    tooltip.style.maxHeight = "none";
    tooltip.style.backgroundColor = "#000000";
    tooltip.style.color = "#f39c12";
    tooltip.style.textAlign = "center";
    tooltip.style.borderRadius = "6px";
    tooltip.style.padding = "8px 12px";
    tooltip.style.position = "fixed";
    tooltip.style.zIndex = "2147483647";
    tooltip.style.bottom = "auto";
    tooltip.style.top = "auto";
    tooltip.style.left = "auto";
    tooltip.style.right = "auto";
    tooltip.style.opacity = "0";
    tooltip.style.transition = "opacity 1s";
    tooltip.style.fontSize = "11px";
    tooltip.style.lineHeight = "1.2";
    tooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    tooltip.style.pointerEvents = "none";
    tooltip.style.whiteSpace = "normal";
    tooltip.style.wordWrap = "break-word";
    tooltip.style.overflowWrap = "break-word";
    tooltip.style.boxSizing = "border-box";
    tooltip.style.transform = "none";
    // Append to body instead of button to escape stacking context and ensure visibility
    document.body.appendChild(tooltip);
    // Store reference on button for easy access
    mergeButton.dataset.tooltipId = tooltip.id || "merge-metadata-files-tooltip";
    if (!tooltip.id) {
      tooltip.id = "merge-metadata-files-tooltip";
    }
    
    // Store timeout reference to clear it if needed
    let tooltipTimeout = null;
    
    // Show tooltip on hover with proper positioning
    mergeButton.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      tooltipTimeout = setTimeout(() => {
      const rect = mergeButton.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      tooltip.style.visibility = "visible";
      tooltip.style.opacity = "0";
      tooltip.style.top = "-9999px";
      tooltip.style.left = "-9999px";
        tooltip.style.transform = "none";
      void tooltip.offsetHeight; // Force reflow
        const tooltipWidth = tooltip.offsetWidth; // Auto width based on content
      const tooltipHeight = tooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        tooltip.style.setProperty("position", "fixed", "important");
        tooltip.style.setProperty("z-index", "2147483647", "important");
        tooltip.style.setProperty("bottom", "auto", "important");
        tooltip.style.setProperty("right", "auto", "important");
        tooltip.style.setProperty("margin", "0", "important");
        tooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const buttonRect = mergeButton.getBoundingClientRect();
        const centeredLeft = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
        const topPosition = buttonRect.top - tooltipHeight - 5;
        tooltip.style.setProperty("top", `${topPosition}px`, "important");
        tooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in
        requestAnimationFrame(() => {
      tooltip.style.opacity = "1";
        });
        tooltipTimeout = null;
      }, 1000);
    });
    
    // Hide tooltip on mouse leave with fade out
    const hideTooltip = () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (tooltipTimeout) {
        clearTimeout(tooltipTimeout);
        tooltipTimeout = null;
      }
      // Start fade out
      tooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      const fadeOutTimeout = setTimeout(() => {
        tooltip.style.visibility = "hidden";
      }, 1000); // Match the 1s transition duration
      // Store fade out timeout separately to avoid conflicts
      mergeButton._fadeOutTimeout = fadeOutTimeout;
    };
    
    mergeButton.addEventListener("mouseleave", hideTooltip);
    
    // Also hide tooltip when mouse leaves the tooltip itself (in case it's somehow hoverable)
    tooltip.addEventListener("mouseleave", hideTooltip);
    
    // Add click handler for merge functionality
    mergeButton.addEventListener("click", () => {
      this.handleMergeMetadataFiles();
    });
    
    container.appendChild(mergeButton);

    return container;
  },

  // Container: Blockchain Management (copy of batch-management-section structure, initially empty)
  createBlockchainManagementContainer: function() {
    const container = document.createElement("div");
    container.id = "blockchain-management-section";
    container.className = "form-container";
    container.style.width = "921px";
    container.style.height = "172px";
    container.style.minHeight = "172px";
    container.style.maxHeight = "172px";
    container.style.minWidth = "921px";
    container.style.maxWidth = "921px";
    container.style.padding = "20px";
    container.style.paddingTop = "0";
    container.style.paddingBottom = "0";
    container.style.margin = "0";
    container.style.marginTop = "0";
    container.style.marginBottom = "0";
    container.style.marginLeft = "0";
    container.style.marginRight = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";
    container.style.display = "grid";
    container.style.gridTemplateColumns = "repeat(5, 1fr)"; // 5 columns for 5 cards per row
    container.style.gridTemplateRows = "auto repeat(2, auto)"; // Title row + 2 rows (for potential cards)
    container.style.gap = "8px";
    container.style.rowGap = "8px";
    container.style.overflowX = "auto";
    container.style.overflowY = "hidden";
    container.style.justifyItems = "center";
    container.style.alignSelf = "flex-start"; // Align vertically with batch-management-section

    // Title spans 2 lines (empty for now, can be customized)
    const titleContainer = document.createElement("div");
    titleContainer.style.gridColumn = "1 / -1";
    titleContainer.style.fontSize = "12px";
    titleContainer.style.fontWeight = "600";
    titleContainer.style.color = "var(--text-primary)";
    titleContainer.style.marginBottom = "8px";
    titleContainer.style.textAlign = "center";
    titleContainer.style.justifySelf = "center";
    
    const titleLine1 = document.createElement("div");
    titleLine1.textContent = "Blockchains where you want to mint your collection:";
    titleLine1.style.fontSize = "12px";
    titleLine1.style.marginBottom = "4px";
    titleLine1.style.textAlign = "center";
    
    const titleLine2 = document.createElement("div");
    titleLine2.textContent = ""; // Empty subtitle
    titleLine2.style.color = "#f39c12";
    titleLine2.style.fontWeight = "600";
    titleLine2.style.fontSize = "11px";
    
    titleContainer.appendChild(titleLine1);
    titleContainer.appendChild(titleLine2);
    container.appendChild(titleContainer);

    // Blockchain Toggles Container - moved from inline creation
    const blockchainContainer = document.createElement("div");
    blockchainContainer.className = "blockchain-toggles-container";
    blockchainContainer.id = "blockchain-toggles-container";
    blockchainContainer.style.display = "grid";
    blockchainContainer.style.gridTemplateColumns = "repeat(6, 1fr)";
    blockchainContainer.style.gridTemplateRows = "repeat(2, auto)";
    blockchainContainer.style.gap = "8px";
    blockchainContainer.style.rowGap = "8px";
    blockchainContainer.style.width = "100%";
    blockchainContainer.style.gridColumn = "1 / -1"; // Span all columns
    blockchainContainer.style.marginTop = "0";
    blockchainContainer.style.marginBottom = "0";
    blockchainContainer.style.justifySelf = "center";
    blockchainContainer.style.justifyItems = "center";

    const blockchains = [
      // Linha 1 - Coluna 1 a 6 (primeira blockchain de cada par)
      { id: "ethereum", name: "Ethereum", color: "#627EEA", row: 1, col: 1 },
      { id: "polygon", name: "Polygon", color: "#8247E5", row: 1, col: 2 },
      { id: "tezos", name: "Tezos", color: "#2C7DF7", row: 1, col: 3 },
      { id: "bitcoin", name: "Bitcoin Ordinals<br>(Inscriptions)", color: "#f7931a", row: 1, col: 4 },
      { id: "immutablex", name: "Immutable X", color: "#0F63D4", row: 1, col: 5 },
      { id: "base", name: "Base", color: "#0052FF", row: 1, col: 6 },
      // Linha 2 - Coluna 1 a 6 (segunda blockchain de cada par)
      { id: "solana", name: "Solana", color: "#00FFA3", row: 2, col: 1 },
      { id: "xrpl", name: "XRPL", color: "#000000", row: 2, col: 2 },
      { id: "avalanche", name: "Avalanche", color: "#E84142", row: 2, col: 3 },
      { id: "cosmos", name: "Cosmos<br>(Inscriptions)", color: "#2F3149", row: 2, col: 4 },
      { id: "arbitrum", name: "Arbitrum", color: "#2D374B", row: 2, col: 5 },
      { id: "flow", name: "Flow", color: "#00EF8B", row: 2, col: 6 }
    ];

    blockchains.forEach(blockchain => {
      const toggle = this.createBlockchainToggle(blockchain.id, blockchain.name, blockchain.color);
      // Set grid position: row and column
      toggle.style.gridRow = blockchain.row;
      toggle.style.gridColumn = blockchain.col;
      blockchainContainer.appendChild(toggle);
    });

    container.appendChild(blockchainContainer);

    return container;
  },

  // Right Column Content
  createRightColumnContent: function() {
    const mainContainer = document.createElement("div");
    mainContainer.id = "nfts-metadata-export";
    mainContainer.className = "form-container";
    mainContainer.style.background = "transparent";
    mainContainer.style.padding = "0";
    mainContainer.style.margin = "0";
    mainContainer.style.marginTop = "0";
    mainContainer.style.marginBottom = "0";
    mainContainer.style.marginLeft = "0";
    mainContainer.style.marginRight = "0";
    mainContainer.style.borderRadius = "0";
    mainContainer.style.border = "none";
    mainContainer.style.display = "flex";
    mainContainer.style.flexDirection = "column";
    mainContainer.style.gap = "20px";

    // Create a wrapper for batch-management-section and utilities-section (side by side)
    const batchUtilitiesWrapper = document.createElement("div");
    batchUtilitiesWrapper.style.display = "flex";
    batchUtilitiesWrapper.style.flexDirection = "row";
    batchUtilitiesWrapper.style.alignItems = "flex-start";
    batchUtilitiesWrapper.style.gap = "30px";
    batchUtilitiesWrapper.style.width = "100%";
    batchUtilitiesWrapper.style.height = "364px"; // Match batch-management-section height
    batchUtilitiesWrapper.style.minHeight = "364px";
    batchUtilitiesWrapper.style.maxHeight = "364px";
    batchUtilitiesWrapper.style.marginBottom = "0px"; // Set to 0 for vertical alignment with export-nfts-metadata
    batchUtilitiesWrapper.style.overflow = "visible"; // Allow utilities section to extend if needed

    // Add Batch Management section at the top
    const batchManagementSection = this.createBatchManagementContainer();
    batchManagementSection.style.marginTop = "0"; // Remove top margin since it's at the top
    // Enforce correct sizes
    batchManagementSection.style.setProperty("width", "921px", "important");
    batchManagementSection.style.setProperty("height", "364px", "important");
    batchManagementSection.style.setProperty("min-width", "921px", "important");
    batchManagementSection.style.setProperty("max-width", "921px", "important");
    batchManagementSection.style.setProperty("min-height", "364px", "important");
    batchManagementSection.style.setProperty("max-height", "364px", "important");
    batchUtilitiesWrapper.appendChild(batchManagementSection);
    
    // Add Utilities section 32px to the right of batch-management-section
    const utilitiesSection = this.createUtilitiesContainer();
    batchUtilitiesWrapper.appendChild(utilitiesSection);
    
    mainContainer.appendChild(batchUtilitiesWrapper);

    // Add Blockchain Management section below the wrapper (empty container with same structure)
    const blockchainManagementSection = this.createBlockchainManagementContainer();
    // Enforce correct sizes
    blockchainManagementSection.style.setProperty("width", "921px", "important");
    blockchainManagementSection.style.setProperty("height", "172px", "important");
    blockchainManagementSection.style.setProperty("min-width", "921px", "important");
    blockchainManagementSection.style.setProperty("max-width", "921px", "important");
    blockchainManagementSection.style.setProperty("min-height", "172px", "important");
    blockchainManagementSection.style.setProperty("max-height", "172px", "important");
    mainContainer.appendChild(blockchainManagementSection);

    // Note: Include Rarity Rank + Export Button Container has been moved to export-nfts-metadata container
    // which is now in the left column
    // Note: batch-toggles-container has been removed - batch selection is now done via batch cards

    return mainContainer;
  },

  // Container: Export NFTs Metadata (copy of number-of-batches-section structure)
  createExportNftsMetadataContainer: function() {
    const container = document.createElement("div");
    container.id = "export-nfts-metadata";
    container.className = "form-container";
    container.style.width = "248px";
    container.style.height = "172px";
    container.style.minWidth = "248px";
    container.style.maxWidth = "248px";
    container.style.minHeight = "172px";
    container.style.maxHeight = "172px";
    container.style.padding = "20px";
    container.style.margin = "0";
    container.style.marginBottom = "20px";
    container.style.marginTop = "0";
    container.style.marginLeft = "0";
    container.style.marginRight = "0";
    container.style.border = "1px solid var(--border-color)";
    container.style.borderRadius = "12px";
    container.style.background = "#111111";
    container.style.boxSizing = "border-box";
    container.style.transition = "none";
    container.style.transform = "none";
    container.style.animation = "none";
    container.style.willChange = "auto";
    container.style.display = "flex";
    container.style.flexDirection = "column";
    container.style.justifyContent = "flex-start";
    container.style.alignItems = "center";
    container.style.gap = "12px";

    // Top row: Rarity Rank and 1 Metadata/NFT toggles side by side
    const topRowContainer = document.createElement("div");
    topRowContainer.style.display = "flex";
    topRowContainer.style.flexDirection = "row";
    topRowContainer.style.gap = "12px";
    topRowContainer.style.width = "100%";
    topRowContainer.style.justifyContent = "space-between";
    topRowContainer.style.alignItems = "flex-start";

    // Left side: Rarity Rank (label + toggle vertically aligned)
    const rarityGroup = document.createElement("div");
    rarityGroup.style.display = "flex";
    rarityGroup.style.flexDirection = "column";
    rarityGroup.style.alignItems = "center";
    rarityGroup.style.gap = "4px";
    rarityGroup.style.flex = "0 0 auto";

    const rarityLabel = document.createElement("label");
    rarityLabel.innerHTML = "Rarity Rank:";
    rarityLabel.style.fontWeight = "500";
    rarityLabel.style.color = "var(--text-color)";
    rarityLabel.style.fontSize = "11px";
    rarityLabel.style.textAlign = "center";
    rarityLabel.style.marginBottom = "0px";
    rarityLabel.style.cursor = "help";
    rarityLabel.style.position = "relative";
    
    // Add tooltip to label
    const labelTooltip = document.createElement("span");
    labelTooltip.className = "tooltiptext";
    labelTooltip.innerHTML = "Include Rarity Rank as<br>Trait in your Collection";
    labelTooltip.style.visibility = "hidden";
    labelTooltip.style.width = "180px";
    labelTooltip.style.minWidth = "180px";
    labelTooltip.style.maxWidth = "180px";
    labelTooltip.style.backgroundColor = "#000000";
    labelTooltip.style.color = "#f39c12";
    labelTooltip.style.textAlign = "center";
    labelTooltip.style.borderRadius = "6px";
    labelTooltip.style.padding = "8px 10px";
    labelTooltip.style.position = "fixed";
    labelTooltip.style.zIndex = "2147483647";
    labelTooltip.style.bottom = "auto";
    labelTooltip.style.top = "auto";
    labelTooltip.style.left = "auto";
    labelTooltip.style.right = "auto";
    labelTooltip.style.opacity = "0";
    labelTooltip.style.transition = "opacity 1s";
    labelTooltip.style.fontSize = "11px";
    labelTooltip.style.lineHeight = "1.4";
    labelTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    labelTooltip.style.pointerEvents = "none";
    labelTooltip.style.whiteSpace = "normal";
    labelTooltip.style.wordWrap = "break-word";
    labelTooltip.style.overflowWrap = "break-word";
    labelTooltip.style.boxSizing = "border-box";
    labelTooltip.style.transform = "none";
    rarityLabel.appendChild(labelTooltip);
    
    // Show tooltip on hover
    let rarityLabelTooltipTimeout = null;
    rarityLabel.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (rarityLabelTooltipTimeout) {
        clearTimeout(rarityLabelTooltipTimeout);
        rarityLabelTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      rarityLabelTooltipTimeout = setTimeout(() => {
      const rect = rarityLabel.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      labelTooltip.style.visibility = "visible";
      labelTooltip.style.opacity = "0";
      labelTooltip.style.top = "-9999px";
      labelTooltip.style.left = "-9999px";
        labelTooltip.style.transform = "none";
      void labelTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 180; // Fixed width
      const tooltipHeight = labelTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        labelTooltip.style.setProperty("position", "fixed", "important");
        labelTooltip.style.setProperty("z-index", "2147483647", "important");
        labelTooltip.style.setProperty("bottom", "auto", "important");
        labelTooltip.style.setProperty("right", "auto", "important");
        labelTooltip.style.setProperty("margin", "0", "important");
        labelTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const labelRect = rarityLabel.getBoundingClientRect();
        const centeredLeft = labelRect.left + (labelRect.width / 2) - (tooltipWidth / 2);
        const topPosition = labelRect.top - tooltipHeight - 5;
        labelTooltip.style.setProperty("top", `${topPosition}px`, "important");
        labelTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      labelTooltip.style.opacity = "1";
        });
        rarityLabelTooltipTimeout = null;
      }, 1000);
    });
    rarityLabel.addEventListener("mouseleave", () => {
      labelTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        labelTooltip.style.visibility = "hidden";
      }, 1000);
    });

    const rarityToggle = this.createToggle("metadata.rarity.rank", "OFF", false);
    rarityToggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    rarityToggle.style.position = "relative";
    
    // Remove all tooltip-related attributes and elements (but keep our custom tooltip)
    rarityToggle.removeAttribute("title");
    rarityToggle.classList.remove("tooltip");
    
    // Remove any existing tooltiptext child elements (except our custom one)
    const existingTooltips = rarityToggle.querySelectorAll(".tooltiptext");
    existingTooltips.forEach(el => {
      // Only remove if it's not our custom tooltip (check by content or other identifier)
      if (!el.dataset.customTooltip) {
        el.remove();
      }
    });
    
    // Exclude from auto-tooltip system
    rarityToggle.dataset.noTooltip = "true";
    
    // Add custom tooltip to toggle
    const toggleTooltip = document.createElement("span");
    toggleTooltip.className = "tooltiptext";
    toggleTooltip.dataset.customTooltip = "true";
    toggleTooltip.innerHTML = "Include Rarity Rank as<br>Trait in your Collection";
    toggleTooltip.style.visibility = "hidden";
    toggleTooltip.style.width = "180px";
    toggleTooltip.style.minWidth = "180px";
    toggleTooltip.style.maxWidth = "180px";
    toggleTooltip.style.backgroundColor = "#000000";
    toggleTooltip.style.color = "#f39c12";
    toggleTooltip.style.textAlign = "center";
    toggleTooltip.style.borderRadius = "6px";
    toggleTooltip.style.padding = "8px 10px";
    toggleTooltip.style.position = "fixed";
    toggleTooltip.style.zIndex = "2147483647";
    toggleTooltip.style.bottom = "auto";
    toggleTooltip.style.top = "auto";
    toggleTooltip.style.left = "auto";
    toggleTooltip.style.right = "auto";
    toggleTooltip.style.opacity = "0";
    toggleTooltip.style.transition = "opacity 1s";
    toggleTooltip.style.fontSize = "11px";
    toggleTooltip.style.lineHeight = "1.4";
    toggleTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    toggleTooltip.style.pointerEvents = "none";
    toggleTooltip.style.whiteSpace = "normal";
    toggleTooltip.style.wordWrap = "break-word";
    toggleTooltip.style.overflowWrap = "break-word";
    toggleTooltip.style.boxSizing = "border-box";
    toggleTooltip.style.transform = "none";
    rarityToggle.appendChild(toggleTooltip);
    
    // Show tooltip on hover
    let rarityToggleTooltipTimeout = null;
    rarityToggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (rarityToggleTooltipTimeout) {
        clearTimeout(rarityToggleTooltipTimeout);
        rarityToggleTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      rarityToggleTooltipTimeout = setTimeout(() => {
      const rect = rarityToggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      toggleTooltip.style.visibility = "visible";
      toggleTooltip.style.opacity = "0";
      toggleTooltip.style.top = "-9999px";
      toggleTooltip.style.left = "-9999px";
        toggleTooltip.style.transform = "none";
      void toggleTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 180; // Fixed width
      const tooltipHeight = toggleTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        toggleTooltip.style.setProperty("position", "fixed", "important");
        toggleTooltip.style.setProperty("z-index", "2147483647", "important");
        toggleTooltip.style.setProperty("bottom", "auto", "important");
        toggleTooltip.style.setProperty("right", "auto", "important");
        toggleTooltip.style.setProperty("margin", "0", "important");
        toggleTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = rarityToggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        toggleTooltip.style.setProperty("top", `${topPosition}px`, "important");
        toggleTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      toggleTooltip.style.opacity = "1";
        });
        rarityToggleTooltipTimeout = null;
      }, 1000);
    });
    rarityToggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (rarityToggleTooltipTimeout) {
        clearTimeout(rarityToggleTooltipTimeout);
        rarityToggleTooltipTimeout = null;
      }
      toggleTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        toggleTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    // Use MutationObserver to watch for unwanted tooltips being added and remove them
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          rarityToggle.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              // Only remove if it's not our custom tooltip
              if (!node.dataset.customTooltip) {
                node.remove();
              }
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && rarityToggle.classList.contains('tooltip')) {
          rarityToggle.classList.remove("tooltip");
        }
      });
    });
    
    observer.observe(rarityToggle, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    rarityToggle.style.width = "80px";
    rarityToggle.style.minWidth = "80px";
    rarityToggle.style.maxWidth = "80px";
    rarityToggle.style.height = "32px";
    rarityToggle.style.minHeight = "32px";
    rarityToggle.style.maxHeight = "32px";
    // Add fade in/fade out transition like other toggles
    rarityToggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";

    rarityGroup.appendChild(rarityLabel);
    rarityGroup.appendChild(rarityToggle);

    // Right side: 1 Metadata/NFT (label + toggle vertically aligned)
    const metadataPerNftGroup = document.createElement("div");
    metadataPerNftGroup.style.display = "flex";
    metadataPerNftGroup.style.flexDirection = "column";
    metadataPerNftGroup.style.alignItems = "center";
    metadataPerNftGroup.style.gap = "4px";
    metadataPerNftGroup.style.flex = "0 0 auto";

    const metadataPerNftLabel = document.createElement("label");
    metadataPerNftLabel.innerHTML = "1 Metadata/NFT:";
    metadataPerNftLabel.style.fontWeight = "500";
    metadataPerNftLabel.style.color = "var(--text-color)";
    metadataPerNftLabel.style.fontSize = "11px";
    metadataPerNftLabel.style.textAlign = "center";
    metadataPerNftLabel.style.marginBottom = "0px";
    metadataPerNftLabel.style.cursor = "help";
    metadataPerNftLabel.style.position = "relative";
    
    // Add tooltip to label
    const metadataLabelTooltip = document.createElement("span");
    metadataLabelTooltip.className = "tooltiptext";
    metadataLabelTooltip.innerHTML = "ON: Export 1 metadata file per NFT (all inside a zip file)<br>OFF: Export only 1 metadata file with all metadata for all NFTs";
    metadataLabelTooltip.style.visibility = "hidden";
    metadataLabelTooltip.style.width = "auto";
    metadataLabelTooltip.style.minWidth = "auto";
    metadataLabelTooltip.style.maxWidth = "none";
    metadataLabelTooltip.style.backgroundColor = "#000000";
    metadataLabelTooltip.style.color = "#f39c12";
    metadataLabelTooltip.style.textAlign = "left";
    metadataLabelTooltip.style.borderRadius = "6px";
    metadataLabelTooltip.style.padding = "8px 10px";
    metadataLabelTooltip.style.position = "fixed";
    metadataLabelTooltip.style.zIndex = "2147483647";
    metadataLabelTooltip.style.bottom = "auto";
    metadataLabelTooltip.style.top = "auto";
    metadataLabelTooltip.style.left = "auto";
    metadataLabelTooltip.style.right = "auto";
    metadataLabelTooltip.style.opacity = "0";
    metadataLabelTooltip.style.transition = "opacity 1s";
    metadataLabelTooltip.style.fontSize = "11px";
    metadataLabelTooltip.style.lineHeight = "1.4";
    metadataLabelTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    metadataLabelTooltip.style.pointerEvents = "none";
    metadataLabelTooltip.style.whiteSpace = "normal";
    metadataLabelTooltip.style.wordWrap = "break-word";
    metadataLabelTooltip.style.overflowWrap = "break-word";
    metadataLabelTooltip.style.boxSizing = "border-box";
    metadataLabelTooltip.style.transform = "none";
    metadataPerNftLabel.appendChild(metadataLabelTooltip);
    
    // Show tooltip on hover
    let metadataLabelTooltipTimeout = null;
    metadataPerNftLabel.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (metadataLabelTooltipTimeout) {
        clearTimeout(metadataLabelTooltipTimeout);
        metadataLabelTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      metadataLabelTooltipTimeout = setTimeout(() => {
      const rect = metadataPerNftLabel.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      metadataLabelTooltip.style.visibility = "visible";
      metadataLabelTooltip.style.opacity = "0";
      metadataLabelTooltip.style.top = "-9999px";
      metadataLabelTooltip.style.left = "-9999px";
        metadataLabelTooltip.style.transform = "none";
      void metadataLabelTooltip.offsetHeight; // Force reflow
        const tooltipWidth = metadataLabelTooltip.offsetWidth; // Auto width based on content
      const tooltipHeight = metadataLabelTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        metadataLabelTooltip.style.setProperty("position", "fixed", "important");
        metadataLabelTooltip.style.setProperty("z-index", "2147483647", "important");
        metadataLabelTooltip.style.setProperty("bottom", "auto", "important");
        metadataLabelTooltip.style.setProperty("right", "auto", "important");
        metadataLabelTooltip.style.setProperty("margin", "0", "important");
        metadataLabelTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const labelRect = metadataPerNftLabel.getBoundingClientRect();
        const centeredLeft = labelRect.left + (labelRect.width / 2) - (tooltipWidth / 2);
        const topPosition = labelRect.top - tooltipHeight - 5;
        metadataLabelTooltip.style.setProperty("top", `${topPosition}px`, "important");
        metadataLabelTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      metadataLabelTooltip.style.opacity = "1";
        });
        metadataLabelTooltipTimeout = null;
      }, 1000);
    });
    metadataPerNftLabel.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (metadataLabelTooltipTimeout) {
        clearTimeout(metadataLabelTooltipTimeout);
        metadataLabelTooltipTimeout = null;
      }
      metadataLabelTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        metadataLabelTooltip.style.visibility = "hidden";
      }, 1000);
    });

    // Create ON/OFF toggle for 1 Metadata/NFT
    const metadataPerNftToggle = this.createToggle("metadata.per.nft", "OFF", false);
    metadataPerNftToggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    metadataPerNftToggle.style.position = "relative";
    
    // Remove all tooltip-related attributes and elements
    metadataPerNftToggle.removeAttribute("title");
    metadataPerNftToggle.classList.remove("tooltip");
    
    // Remove any existing tooltiptext child elements
    const existingMetadataTooltips = metadataPerNftToggle.querySelectorAll(".tooltiptext");
    existingMetadataTooltips.forEach(el => {
      if (!el.dataset.customTooltip) {
        el.remove();
      }
    });
    
    // Exclude from auto-tooltip system
    metadataPerNftToggle.dataset.noTooltip = "true";
    
    // Add custom tooltip to toggle
    const metadataToggleTooltip = document.createElement("span");
    metadataToggleTooltip.className = "tooltiptext";
    metadataToggleTooltip.dataset.customTooltip = "true";
    metadataToggleTooltip.innerHTML = "ON: Export 1 metadata file per NFT (all inside a zip file)<br>OFF: Export only 1 metadata file with all metadata for all NFTs";
    metadataToggleTooltip.style.visibility = "hidden";
    metadataToggleTooltip.style.width = "auto";
    metadataToggleTooltip.style.minWidth = "auto";
    metadataToggleTooltip.style.maxWidth = "none";
    metadataToggleTooltip.style.backgroundColor = "#000000";
    metadataToggleTooltip.style.color = "#f39c12";
    metadataToggleTooltip.style.textAlign = "left";
    metadataToggleTooltip.style.borderRadius = "6px";
    metadataToggleTooltip.style.padding = "8px 10px";
    metadataToggleTooltip.style.position = "fixed";
    metadataToggleTooltip.style.zIndex = "2147483647";
    metadataToggleTooltip.style.bottom = "auto";
    metadataToggleTooltip.style.top = "auto";
    metadataToggleTooltip.style.left = "auto";
    metadataToggleTooltip.style.right = "auto";
    metadataToggleTooltip.style.opacity = "0";
    metadataToggleTooltip.style.transition = "opacity 1s";
    metadataToggleTooltip.style.fontSize = "11px";
    metadataToggleTooltip.style.pointerEvents = "none";
    metadataToggleTooltip.style.lineHeight = "1.4";
    metadataToggleTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    metadataToggleTooltip.style.whiteSpace = "normal";
    metadataToggleTooltip.style.wordWrap = "break-word";
    metadataToggleTooltip.style.overflowWrap = "break-word";
    metadataToggleTooltip.style.boxSizing = "border-box";
    metadataToggleTooltip.style.transform = "none";
    metadataPerNftToggle.appendChild(metadataToggleTooltip);
    
    // Show tooltip on hover
    let metadataToggleTooltipTimeout = null;
    metadataPerNftToggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (metadataToggleTooltipTimeout) {
        clearTimeout(metadataToggleTooltipTimeout);
        metadataToggleTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      metadataToggleTooltipTimeout = setTimeout(() => {
      const rect = metadataPerNftToggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      metadataToggleTooltip.style.visibility = "visible";
      metadataToggleTooltip.style.opacity = "0";
      metadataToggleTooltip.style.top = "-9999px";
      metadataToggleTooltip.style.left = "-9999px";
        metadataToggleTooltip.style.transform = "none";
      void metadataToggleTooltip.offsetHeight; // Force reflow
        const tooltipWidth = metadataToggleTooltip.offsetWidth; // Auto width based on content
      const tooltipHeight = metadataToggleTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        metadataToggleTooltip.style.setProperty("position", "fixed", "important");
        metadataToggleTooltip.style.setProperty("z-index", "2147483647", "important");
        metadataToggleTooltip.style.setProperty("bottom", "auto", "important");
        metadataToggleTooltip.style.setProperty("right", "auto", "important");
        metadataToggleTooltip.style.setProperty("margin", "0", "important");
        metadataToggleTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = metadataPerNftToggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        metadataToggleTooltip.style.setProperty("top", `${topPosition}px`, "important");
        metadataToggleTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      metadataToggleTooltip.style.opacity = "1";
        });
        metadataToggleTooltipTimeout = null;
      }, 1000);
    });
    metadataPerNftToggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (metadataToggleTooltipTimeout) {
        clearTimeout(metadataToggleTooltipTimeout);
        metadataToggleTooltipTimeout = null;
      }
      metadataToggleTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        metadataToggleTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    // Use MutationObserver to watch for unwanted tooltips being added and remove them
    const metadataObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'title') {
          metadataPerNftToggle.removeAttribute("title");
        }
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1 && node.classList && node.classList.contains('tooltiptext')) {
              if (!node.dataset.customTooltip) {
                node.remove();
              }
            }
          });
        }
        if (mutation.type === 'attributes' && mutation.attributeName === 'class' && metadataPerNftToggle.classList.contains('tooltip')) {
          metadataPerNftToggle.classList.remove("tooltip");
        }
      });
    });
    
    metadataObserver.observe(metadataPerNftToggle, {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['title', 'class']
    });
    
    metadataPerNftToggle.style.width = "80px";
    metadataPerNftToggle.style.minWidth = "80px";
    metadataPerNftToggle.style.maxWidth = "80px";
    metadataPerNftToggle.style.height = "32px";
    metadataPerNftToggle.style.minHeight = "32px";
    metadataPerNftToggle.style.maxHeight = "32px";
    // Add fade in/fade out transition like other toggles
    metadataPerNftToggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";

    metadataPerNftGroup.appendChild(metadataPerNftLabel);
    metadataPerNftGroup.appendChild(metadataPerNftToggle);

    // Add both groups to top row
    topRowContainer.appendChild(rarityGroup);
    topRowContainer.appendChild(metadataPerNftGroup);

    // Bottom row: Export Button (full width matching upper buttons + gap)
    const exportBtnContainer = document.createElement("div");
    exportBtnContainer.style.display = "flex";
    exportBtnContainer.style.justifyContent = "center";
    exportBtnContainer.style.alignItems = "center";
    exportBtnContainer.style.width = "100%";
    // Width = 80px (rarity toggle) + 12px (gap) + 80px (metadata toggle) = 172px
    exportBtnContainer.style.width = "172px";
    exportBtnContainer.style.margin = "0 auto";

    const exportBtn = document.createElement("button");
    exportBtn.id = "export-metadata-nfts-btn";
    exportBtn.className = "btn";
    exportBtn.textContent = "Export NFTs / Metadata";
    exportBtn.style.margin = "0px";
    // Width matches the upper row: 80px + 12px gap + 80px = 172px
    exportBtn.style.width = "172px";
    exportBtn.style.height = "32px";
    exportBtn.style.minWidth = "172px";
    exportBtn.style.maxWidth = "172px";
    exportBtn.style.minHeight = "32px";
    exportBtn.style.maxHeight = "32px";
    exportBtn.style.padding = "0px 8px";
    exportBtn.style.fontSize = "12px";
    exportBtn.style.fontWeight = "500";
    exportBtn.style.border = "2px solid #8b5cf6";
    exportBtn.style.borderRadius = "6px";
    exportBtn.style.backgroundColor = "#8b5cf6";
    exportBtn.style.color = "rgb(255, 255, 255)";
    exportBtn.style.cursor = "help"; // Show help cursor for objects with tooltips
    exportBtn.style.boxSizing = "border-box";
    exportBtn.style.whiteSpace = "normal";
    exportBtn.style.lineHeight = "1.2";
    exportBtn.style.textAlign = "center";
    
    // Initially disabled until requirements are met (greyed out)
    // Don't use disabled attribute - it prevents click events. Use visual styling and check state in handler
    exportBtn.disabled = false; // Don't use disabled attribute - it prevents click events
    exportBtn.dataset.disabled = "true"; // Use data attribute to track state instead
    exportBtn.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    exportBtn.style.cursor = "not-allowed";
    exportBtn.style.backgroundColor = "#2a2a2a";
    exportBtn.style.borderColor = "#4a4a4a";
    exportBtn.style.color = "#666666";
    exportBtn.style.boxShadow = "none";
    exportBtn.style.pointerEvents = "auto"; // Always allow clicks to show tooltip when disabled
    
    // Add tooltip to Export button with proper styling
    exportBtn.classList.add("tooltip");
    const exportTooltip = document.createElement("span");
    exportTooltip.className = "tooltiptext";
    exportTooltip.innerHTML = "Click this button to export your collection<br>once all export parameters are configured.";
    exportTooltip.style.visibility = "hidden";
    exportTooltip.style.width = "280px";
    exportTooltip.style.minWidth = "280px";
    exportTooltip.style.maxWidth = "280px";
    exportTooltip.style.backgroundColor = "#000000";
    exportTooltip.style.color = "#f39c12";
    exportTooltip.style.textAlign = "center";
    exportTooltip.style.borderRadius = "6px";
    exportTooltip.style.padding = "8px 10px";
    exportTooltip.style.position = "fixed";
    exportTooltip.style.zIndex = "2147483647";
    exportTooltip.style.bottom = "auto";
    exportTooltip.style.top = "auto";
    exportTooltip.style.left = "auto";
    exportTooltip.style.right = "auto";
    exportTooltip.style.opacity = "0";
    exportTooltip.style.transition = "opacity 1s";
    exportTooltip.style.fontSize = "11px";
    exportTooltip.style.lineHeight = "1.4";
    exportTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    exportTooltip.style.pointerEvents = "none";
    exportTooltip.style.whiteSpace = "normal";
    exportTooltip.style.wordWrap = "break-word";
    exportTooltip.style.overflowWrap = "break-word";
    exportTooltip.style.boxSizing = "border-box";
    exportTooltip.style.transform = "none";
    exportBtn.appendChild(exportTooltip);
    
    // Show tooltip on hover with proper positioning
    let exportTooltipTimeout = null;
    exportBtn.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (exportTooltipTimeout) {
        clearTimeout(exportTooltipTimeout);
        exportTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      exportTooltipTimeout = setTimeout(() => {
      const rect = exportBtn.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      exportTooltip.style.visibility = "visible";
      exportTooltip.style.opacity = "0";
      exportTooltip.style.top = "-9999px";
      exportTooltip.style.left = "-9999px";
        exportTooltip.style.transform = "none";
      void exportTooltip.offsetHeight; // Force reflow
      const tooltipWidth = 280; // Fixed width
      const tooltipHeight = exportTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        exportTooltip.style.setProperty("position", "fixed", "important");
        exportTooltip.style.setProperty("z-index", "2147483647", "important");
        exportTooltip.style.setProperty("bottom", "auto", "important");
        exportTooltip.style.setProperty("right", "auto", "important");
        exportTooltip.style.setProperty("margin", "0", "important");
        exportTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const buttonRect = exportBtn.getBoundingClientRect();
        const centeredLeft = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
        const topPosition = buttonRect.top - tooltipHeight - 5;
        exportTooltip.style.setProperty("top", `${topPosition}px`, "important");
        exportTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      exportTooltip.style.opacity = "1";
        });
        exportTooltipTimeout = null;
      }, 1000);
    });
    exportBtn.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (exportTooltipTimeout) {
        clearTimeout(exportTooltipTimeout);
        exportTooltipTimeout = null;
      }
      exportTooltip.style.opacity = "0";
      // Wait for fade out transition to complete before hiding
      setTimeout(() => {
        exportTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    const self = this;
    const handleExportClick = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Check if button is disabled - show tooltip explaining what's needed
      // Check both disabled attribute and data-disabled attribute
      const isDisabled = exportBtn.disabled || exportBtn.dataset.disabled === "true";
      if (isDisabled) {
        // First check: Validate if collection has NFTs and proper trait layers
        const collectionValidation = self.validateCollectionForExport();
        if (!collectionValidation.isValid) {
          // Show error in red
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            // Remove ALL existing notifications from ALL containers before showing new one (overlap in same place)
            const containers = document.querySelectorAll('.fixed-notification-container, .notification-container, .notifications-wrapper');
            containers.forEach(container => {
              const existingNotifications = container.querySelectorAll('.notification');
              existingNotifications.forEach(notif => {
                notif.style.transition = 'none';
                notif.style.opacity = '0';
                notif.remove();
              });
              // Clear container completely
              container.innerHTML = '';
            });
            // Also remove any notifications directly in body
            const bodyNotifications = document.querySelectorAll('body > .notification, body > .notification-container');
            bodyNotifications.forEach(notif => notif.remove());
            
            // Use requestAnimationFrame to ensure removal is complete before showing new notification
            requestAnimationFrame(() => {
              window.NFTApp.getModule("notificationService").show(
                collectionValidation.message,
                "error",
                8000
              );
            });
          } else {
            alert(collectionValidation.message);
          }
          return;
        }
        
        // Second check: Show missing export requirements
        const missingRequirements = self.getMissingExportRequirements();
        if (missingRequirements.length > 0) {
          // Format message with HTML line breaks and spacing between items (reduced spacing)
          // Each requirement is on its own line with reduced spacing between them
          // Requirements list uses 12px font size and left alignment, while intro text keeps default size
          const formattedRequirements = missingRequirements.join('<br>');
          const message = "To enable export, please complete the following:<br><span style=\"font-size: 12px; text-align: left; display: block; margin-top: 0.5em;\">" + formattedRequirements + "</span>";
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
            // Remove ALL existing notifications from ALL containers before showing new one (overlap in same place)
            const containers = document.querySelectorAll('.fixed-notification-container, .notification-container, .notifications-wrapper');
            containers.forEach(container => {
              const existingNotifications = container.querySelectorAll('.notification');
              existingNotifications.forEach(notif => {
                notif.style.transition = 'none';
                notif.style.opacity = '0';
                notif.remove();
              });
              // Clear container completely
              container.innerHTML = '';
            });
            // Also remove any notifications directly in body
            const bodyNotifications = document.querySelectorAll('body > .notification, body > .notification-container');
            bodyNotifications.forEach(notif => notif.remove());
            
            // Use requestAnimationFrame to ensure removal is complete before showing new notification
            requestAnimationFrame(() => {
              // Show notification and then set width to 460px
              const notification = window.NFTApp.getModule("notificationService").show(
                message,
                "info",
                8000
              );
              // Set notification width to 460px after creation
              if (notification) {
                // Use requestAnimationFrame to ensure DOM is ready
                requestAnimationFrame(() => {
                  notification.style.width = '460px';
                  notification.style.minWidth = '460px';
                  notification.style.maxWidth = '460px';
                  // Also update container width if it exists
                  const container = document.querySelector('.fixed-notification-container');
                  if (container) {
                    container.style.maxWidth = '460px';
                  }
                  // Ensure message text is left-aligned
                  const messageElement = notification.querySelector('.notification-message');
                  if (messageElement) {
                    messageElement.style.textAlign = 'left';
                  }
                });
              }
            });
          } else {
            // Fallback for alert - use plain text with line breaks
            const plainMessage = "To enable export, please complete the following:\n\n" + missingRequirements.join("\n\n");
            alert(plainMessage);
          }
        }
        return;
      }
      
      // Check if export is already in progress - prevent duplicate clicks
      if (self.isExporting) {
        // console.warn("[Export NFTs] Export already in progress, ignoring duplicate click");
        return;
      }
      
      // Always try to call handleExport - it will handle its own validation
      // The button disabled check was preventing handleExport from running
      try {
        if (typeof self.handleExport !== 'function') {
          throw new Error("handleExport function is not available");
        }
        // console.log("[Export NFTs] Button clicked, calling handleExport...");
        await self.handleExport();
        // console.log("[Export NFTs] handleExport completed successfully");
      } catch (error) {
        // console.error("[Export NFTs] Error in handleExport:", error);
        // console.error("[Export NFTs] Error stack:", error.stack);
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(
            `Export failed: ${error.message || "Unknown error"}`,
            "error",
            5000
          );
        } else {
          alert(`Export failed: ${error.message || "Unknown error"}`);
        }
      }
    };
    
    exportBtn.addEventListener("click", handleExportClick);
    
    // Also store the handler for potential re-attachment
    exportBtn._exportHandler = handleExportClick;
    
    // console.log("[Export NFTs] Export button created and event listener attached, button ID:", exportBtn.id);

    exportBtnContainer.appendChild(exportBtn);

    // Add top row and bottom row to container
    container.appendChild(topRowContainer);
    container.appendChild(exportBtnContainer);

    return container;
  },

  // Create a toggle button
  createToggle: function(id, text, initialState) {
    const toggle = document.createElement("button");
    toggle.id = id;
    toggle.type = "button";
    toggle.className = "toggle-button";
    toggle.textContent = text;
    toggle.style.padding = "8px 14px";
    toggle.style.border = "2px solid #4a4a4a";
    toggle.style.borderRadius = "6px";
    toggle.style.backgroundColor = "#2a2a2a";
    toggle.style.color = "#ffffff";
    toggle.style.fontSize = "12px";
    toggle.style.fontWeight = "600";
    toggle.style.cursor = "pointer";
    toggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    toggle.style.transform = "none";
    toggle.style.animation = "none";
    toggle.style.willChange = "auto";
    toggle.style.position = "relative";
    toggle.style.top = "0";
    toggle.style.left = "0";
    toggle.style.margin = "0";

    if (initialState) {
      toggle.classList.add("active");
      this.updateToggleState(toggle, true);
    }

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleToggleClick(toggle);
    });

    return toggle;
  },

  // Create blockchain toggle with specific colors
  createBlockchainToggle: function(id, name, color) {
    const toggle = this.createToggle(id, name, false);
    // Use innerHTML instead of textContent to support line breaks in button text
    if (name.includes('<br>')) {
      toggle.innerHTML = name;
    }
    toggle.dataset.blockchainColor = color;
    
    // Extract plain text name for tooltip (remove HTML tags)
    const plainName = name.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]*>/g, '').trim();
    
    // Add tooltip to blockchain toggle
    toggle.classList.add("tooltip");
    const blockchainTooltip = document.createElement("span");
    blockchainTooltip.className = "tooltiptext";
    blockchainTooltip.innerHTML = `If selected, the metadata for <strong>${plainName}</strong><br>will be included in the exportation process.`;
    blockchainTooltip.style.visibility = "hidden";
    blockchainTooltip.style.width = "320px";
    blockchainTooltip.style.minWidth = "320px";
    blockchainTooltip.style.maxWidth = "320px";
    blockchainTooltip.style.backgroundColor = "#000000";
    blockchainTooltip.style.color = "#f39c12";
    blockchainTooltip.style.textAlign = "center";
    blockchainTooltip.style.borderRadius = "6px";
    blockchainTooltip.style.padding = "8px 10px";
    blockchainTooltip.style.position = "fixed";
    blockchainTooltip.style.zIndex = "2147483647";
    blockchainTooltip.style.bottom = "auto";
    blockchainTooltip.style.top = "auto";
    blockchainTooltip.style.left = "auto";
    blockchainTooltip.style.right = "auto";
    blockchainTooltip.style.opacity = "0";
    blockchainTooltip.style.transition = "opacity 1s";
    blockchainTooltip.style.fontSize = "11px";
    blockchainTooltip.style.lineHeight = "1.4";
    blockchainTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    blockchainTooltip.style.pointerEvents = "none";
    blockchainTooltip.style.whiteSpace = "normal";
    blockchainTooltip.style.wordWrap = "break-word";
    blockchainTooltip.style.overflowWrap = "break-word";
    blockchainTooltip.style.boxSizing = "border-box";
    blockchainTooltip.style.textTransform = "none"; // Ensure tooltip text is not uppercase
    blockchainTooltip.style.transform = "none";
    // Ensure tooltip doesn't interfere with button layout - use fixed positioning and remove from flow
    blockchainTooltip.style.position = "fixed";
    blockchainTooltip.style.display = "block";
    blockchainTooltip.style.margin = "0";
    blockchainTooltip.style.pointerEvents = "none";
    blockchainTooltip.style.width = "320px";
    blockchainTooltip.style.minWidth = "320px";
    blockchainTooltip.style.maxWidth = "320px";
    blockchainTooltip.style.height = "auto";
    blockchainTooltip.style.minHeight = "0";
    blockchainTooltip.style.maxHeight = "none";
    blockchainTooltip.style.flex = "none";
    blockchainTooltip.style.flexShrink = "0";
    blockchainTooltip.style.flexGrow = "0";
    blockchainTooltip.style.alignSelf = "auto";
    blockchainTooltip.style.justifySelf = "auto";
    // Append to body instead of button to avoid layout conflicts
    document.body.appendChild(blockchainTooltip);
    // Store reference on button for easy access
    toggle.dataset.tooltipId = blockchainTooltip.id || `blockchain-tooltip-${id}`;
    if (!blockchainTooltip.id) {
      blockchainTooltip.id = `blockchain-tooltip-${id}`;
    }
    
    // Show tooltip on hover
    let blockchainTooltipTimeout = null;
    toggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (blockchainTooltipTimeout) {
        clearTimeout(blockchainTooltipTimeout);
        blockchainTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      blockchainTooltipTimeout = setTimeout(() => {
      const rect = toggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure it, but keep it off-screen
      blockchainTooltip.style.visibility = "visible";
      blockchainTooltip.style.opacity = "0";
      blockchainTooltip.style.top = "-9999px";
      blockchainTooltip.style.left = "-9999px";
        blockchainTooltip.style.transform = "none";
      // Force reflow to get accurate measurements
      void blockchainTooltip.offsetWidth;
      // Now position it correctly - use dynamic width for accurate centering
      const tooltipWidth = blockchainTooltip.offsetWidth;
      const tooltipHeight = blockchainTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        blockchainTooltip.style.setProperty("position", "fixed", "important");
        blockchainTooltip.style.setProperty("z-index", "2147483647", "important");
        blockchainTooltip.style.setProperty("bottom", "auto", "important");
        blockchainTooltip.style.setProperty("right", "auto", "important");
        blockchainTooltip.style.setProperty("margin", "0", "important");
        blockchainTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = toggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        blockchainTooltip.style.setProperty("top", `${topPosition}px`, "important");
        blockchainTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      blockchainTooltip.style.opacity = "1";
        });
        blockchainTooltipTimeout = null;
      }, 1000);
    });
    toggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (blockchainTooltipTimeout) {
        clearTimeout(blockchainTooltipTimeout);
        blockchainTooltipTimeout = null;
      }
      blockchainTooltip.style.opacity = "0";
      setTimeout(() => {
        blockchainTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    // Set initial greyed out state for blockchain toggles (inactive by default)
    // Use setProperty with "important" to override CSS !important rules
    toggle.style.setProperty("background-color", "#2a2a2a", "important");
    toggle.style.setProperty("border-color", "#4a4a4a", "important");
    toggle.style.setProperty("border", "2px solid #4a4a4a", "important");
    toggle.style.setProperty("color", "#666666", "important");
    toggle.style.setProperty("opacity", "1", "important"); // Always fully opaque - use colors to indicate inactive state
    toggle.style.setProperty("font-size", "12px", "important");
    toggle.style.setProperty("font-weight", "600", "important");
    toggle.style.setProperty("box-shadow", "none", "important");
    toggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    
    return toggle;
  },

  // Handle toggle click
  handleToggleClick: function(toggle) {
    const isActive = toggle.classList.contains("active");
    
    if (isActive) {
      toggle.classList.remove("active");
      this.updateToggleState(toggle, false);
    } else {
      toggle.classList.add("active");
      this.updateToggleState(toggle, true);
    }

    // Update state
    this.updateStateFromToggle(toggle);
  },

  // Update toggle visual state
  updateToggleState: function(toggle, isActive) {
    if (isActive) {
      const blockchainColor = toggle.dataset.blockchainColor;
      
      if (blockchainColor) {
        // Blockchain toggle with specific color
        // Use setProperty with "important" to override CSS !important rules
        toggle.style.setProperty("background-color", blockchainColor, "important");
        toggle.style.setProperty("border-color", blockchainColor, "important");
        toggle.style.setProperty("border", `2px solid ${blockchainColor}`, "important");
        toggle.style.setProperty("border-radius", "6px", "important");
        
        // Set text color: black for most, white for Cosmos, XRPL, Avalanche, and Arbitrum
        const toggleId = toggle.id.toLowerCase();
        if (toggleId === "cosmos" || toggleId === "xrpl" || toggleId === "avalanche" || toggleId === "arbitrum") {
          toggle.style.setProperty("color", "#ffffff", "important");
        } else {
          toggle.style.setProperty("color", "#000000", "important");
        }
        
        toggle.style.setProperty("box-shadow", `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 8px ${blockchainColor}88,
          0 0 15px ${blockchainColor}55
        `, "important");
        toggle.style.setProperty("opacity", "1", "important");
        toggle.style.setProperty("font-size", "12px", "important");
        toggle.style.setProperty("font-weight", "600", "important");
      } else if (toggle.id === "metadata.rarity.rank") {
        // Rarity Rank toggle
        toggle.textContent = "ON";
        toggle.style.backgroundColor = "#00ff88";
        toggle.style.borderColor = "#00ff88";
        toggle.style.color = "#000000";
        toggle.style.fontWeight = "bold";
        // Add halo effect like other toggles
        toggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
      } else if (toggle.id === "metadata.per.nft") {
        // 1 Metadata/NFT toggle
        toggle.textContent = "ON";
        toggle.style.backgroundColor = "#00ff88";
        toggle.style.borderColor = "#00ff88";
        toggle.style.color = "#000000";
        toggle.style.fontWeight = "bold";
        toggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
      } else {
        // Default toggle (JPG, PNG, JSON, CSV)
        toggle.style.backgroundColor = "#00ff88";
        toggle.style.borderColor = "#00ff88";
        toggle.style.color = "#000000";
        toggle.style.fontWeight = "bold";
        toggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
      }
    } else {
      // Inactive state - greyed out but still clickable
      const blockchainColor = toggle.dataset.blockchainColor;
      
      if (blockchainColor) {
        // Blockchain toggle - greyed out when inactive
        // Use setProperty with "important" to override CSS !important rules
        toggle.style.setProperty("background-color", "#2a2a2a", "important");
        toggle.style.setProperty("border-color", "#4a4a4a", "important");
        toggle.style.setProperty("border", "2px solid #4a4a4a", "important");
        toggle.style.setProperty("border-radius", "6px", "important");
        toggle.style.setProperty("color", "#666666", "important");
        toggle.style.setProperty("opacity", "1", "important"); // Always fully opaque - use colors to indicate inactive state
        toggle.style.setProperty("font-weight", "600", "important");
        toggle.style.setProperty("font-size", "12px", "important");
        toggle.style.setProperty("box-shadow", "none", "important");
        // Keep cursor pointer to indicate it's clickable
        toggle.style.cursor = "pointer";
      } else if (toggle.id === "metadata.rarity.rank") {
        toggle.textContent = "OFF";
      toggle.style.backgroundColor = "#2a2a2a";
      toggle.style.borderColor = "#4a4a4a";
      toggle.style.color = "#ffffff";
      toggle.style.fontWeight = "600";
        toggle.style.opacity = "1";
      toggle.style.boxShadow = "none";
      } else if (toggle.id === "metadata.per.nft") {
        toggle.textContent = "OFF";
      toggle.style.backgroundColor = "#2a2a2a";
      toggle.style.borderColor = "#4a4a4a";
      toggle.style.color = "#ffffff";
      toggle.style.fontWeight = "600";
        toggle.style.opacity = "1";
      toggle.style.boxShadow = "none";
      } else {
        // Default toggle inactive state (JPG, PNG, JSON, CSV)
        toggle.style.backgroundColor = "#2a2a2a";
        toggle.style.borderColor = "#4a4a4a";
        toggle.style.color = "#ffffff";
        toggle.style.fontWeight = "600";
        toggle.style.opacity = "1";
        toggle.style.boxShadow = "none";
      }
    }
  },

  // Get total supply from project
  getTotalSupply: function() {
    // Check total supply input field first (most current value)
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
    const projectData = window.currentProject || {};
    if (projectData.totalSupply) {
      const parsed = parseInt(projectData.totalSupply, 10);
      if (parsed && parsed > 0) {
        return parsed;
      }
    }
    
    // Also check for 'size' property (legacy support)
    if (projectData.size) {
      const parsed = parseInt(projectData.size, 10);
      if (parsed && parsed > 0) {
        return parsed;
      }
    }
    
    // Default fallback
    // Return 0 if no project is loaded
    return 0;
  },

  // Distribute total supply evenly among active batches
  distributeTotalSupply: function() {
    const totalSupply = this.getTotalSupply();
    const activeBatches = this.numBatches;
    
    if (activeBatches < 1) return;
    
    // Calculate base amount per batch (integer division)
    const baseAmount = Math.floor(totalSupply / activeBatches);
    const remainder = totalSupply % activeBatches;
    
    // Distribute evenly: all batches get baseAmount, last batch gets baseAmount + remainder
    // Update ALL active batches (including those on page 2) in batchData
    for (let i = 1; i <= activeBatches; i++) {
      // Last batch gets the remainder
      const amount = i === activeBatches ? baseAmount + remainder : baseAmount;
      
      // Always update batchData for all batches (source of truth)
      if (!this.batchData[i]) this.batchData[i] = {};
      this.batchData[i].quantity = amount;
      
      // Also update DOM if batch is visible
      const input = document.getElementById(`batch-input-${i}`);
      if (input && !input.disabled) {
        input.value = amount.toString();
      }
    }
    
    // Update distribution text
    this.updateBatchDistribution();
  },

  // Redistribute remaining NFTs among other batches after manual change
  redistributeRemainingNFTs: function(changedBatchIndex) {
    const totalSupply = this.getTotalSupply();
    
    // Get the changed batch value
    const changedInput = document.getElementById(`batch-input-${changedBatchIndex}`);
    if (!changedInput || changedInput.disabled) return;
    
    const changedValue = parseInt(changedInput.value) || 0;
    const changedToggle = document.getElementById(`already-minted-toggle-${changedBatchIndex}`);
    const isChangedAlreadyMinted = changedToggle && changedToggle.classList.contains("active");
    
    // Calculate remaining NFTs after the changed batch and all batches to the left (excluding already minted)
    let remaining = totalSupply;
    
    // Subtract the changed batch value
    if (!isChangedAlreadyMinted) {
      remaining -= changedValue;
    }
    
    // Also subtract all batches to the left of the changed batch
    for (let i = 1; i < changedBatchIndex; i++) {
      const input = document.getElementById(`batch-input-${i}`);
      const toggle = document.getElementById(`already-minted-toggle-${i}`);
      const isAlreadyMinted = toggle && toggle.classList.contains("active");
      if (input && !input.disabled && !isAlreadyMinted) {
        const value = parseInt(input.value) || 0;
        remaining -= value;
      }
    }
    
    // Count active batches TO THE RIGHT of the changed batch (excluding already minted)
    let activeBatchCount = 0;
    const activeBatchIndices = [];
    for (let i = changedBatchIndex + 1; i <= this.numBatches; i++) {
      const input = document.getElementById(`batch-input-${i}`);
      const toggle = document.getElementById(`already-minted-toggle-${i}`);
      const isAlreadyMinted = toggle && toggle.classList.contains("active");
      if (input && !input.disabled && !isAlreadyMinted) {
        activeBatchCount++;
        activeBatchIndices.push(i);
      }
    }
    
    if (activeBatchCount === 0) {
      // No other batches to distribute to, just update distribution text
      this.updateBatchDistribution();
      return;
    }
    
    // Distribute remaining evenly among batches to the right
    // Each batch should differ by no more than 1 NFT
    // Progressive distribution: each batch gets baseAmount + idx, last batch gets remainder
    // Example: remaining = 5000, 3 batches -> baseAmount = 1666, remainder = 2
    // Strategy: Progressive with last batch getting remainder
    // Batch 3: 1666, Batch 4: 1667, Batch 5: 1666 + remainder = 1668
    // But this sums to 5001, so we need to adjust
    // Actually, let's use: Batch 3: baseAmount, Batch 4: baseAmount + 1, Batch 5: remaining - (baseAmount + baseAmount+1)
    const baseAmount = Math.floor(remaining / activeBatchCount);
    const remainder = remaining % activeBatchCount;
    
    // Calculate progressive distribution
    let totalDistributed = 0;
    const amounts = [];
    
    // First batches get progressive amounts: baseAmount, baseAmount+1, baseAmount+2, etc.
    activeBatchIndices.forEach((batchIndex, idx) => {
      if (idx < activeBatchIndices.length - 1) {
        // All except last: progressive
        const progressiveAmount = baseAmount + idx;
        amounts.push({ batchIndex, amount: progressiveAmount });
        totalDistributed += progressiveAmount;
      } else {
        // Last batch gets the remainder to make sum exact
        const lastAmount = remaining - totalDistributed;
        amounts.push({ batchIndex, amount: lastAmount });
      }
    });
    
    // Apply amounts to inputs and batchData
    amounts.forEach(({ batchIndex, amount }) => {
      const finalAmount = Math.max(0, amount);
      
      // Always update batchData (source of truth, works for all batches including those on other pages)
      if (!this.batchData[batchIndex]) this.batchData[batchIndex] = {};
      this.batchData[batchIndex].quantity = finalAmount;
      
      // Also update DOM if batch is visible
      const input = document.getElementById(`batch-input-${batchIndex}`);
      if (input) {
        input.value = finalAmount.toString();
      }
    });
    
    // Update distribution text
    this.updateBatchDistribution();
    
    // Validate against maximum limit after redistribution
    this.validateBatchQuantities();
  },

  // Check export button state based on requirements
  checkExportButtonState: function() {
    const exportBtn = document.getElementById("export-metadata-nfts-btn");
    if (!exportBtn) return;
    
    // Check if at least one image format is selected
    const hasImageFormat = this.imageFormat.jpg || this.imageFormat.png;
    
    // Check if at least one metadata format is selected
    const hasMetadataFormat = this.metadataFormat.json || this.metadataFormat.csv;
    
    // Check if at least one blockchain is selected
    // Also verify by checking DOM to ensure state is in sync
    let hasBlockchain = Object.values(this.blockchainToggles).some(value => value === true);
    
    // Double-check by looking at DOM toggles directly
    if (!hasBlockchain) {
      const blockchainIds = ['ethereum', 'solana', 'bitcoin', 'cosmos', 'tezos', 'xrpl', 'polygon', 'immutablex', 'base', 'avalanche', 'flow', 'arbitrum'];
      for (const id of blockchainIds) {
        const toggle = document.getElementById(id);
        if (toggle && toggle.classList.contains("active")) {
          hasBlockchain = true;
          // Also update state to keep it in sync
          this.blockchainToggles[id] = true;
          break;
        }
      }
    }
    
    // Check if at least one batch is selected for export
    let hasBatchToExport = false;
    try {
      for (let i = 1; i <= this.numBatches; i++) {
        const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
        const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
        const input = document.getElementById(`batch-input-${i}`);
        
        if (selectToExportToggle && selectToExportToggle.classList.contains("active") &&
            (!alreadyMintedToggle || !alreadyMintedToggle.classList.contains("active")) &&
            input && !input.disabled) {
          const quantity = parseInt(input.value) || 0;
          if (quantity > 0) {
            hasBatchToExport = true;
            break;
          }
        }
      }
    } catch(e) {
      // console.warn("Error checking batches:", e);
    }
    
    // Check if collection has NFTs (saved seeds)
    const collectionValidation = this.validateCollectionForExport();
    const hasNFTs = collectionValidation.isValid;
    
    // If export is in progress, always disable the button
    if (this.isExporting) {
      exportBtn.disabled = true;
      exportBtn.dataset.disabled = "true";
      exportBtn.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      exportBtn.style.cursor = "not-allowed";
      exportBtn.style.backgroundColor = "#2a2a2a";
      exportBtn.style.borderColor = "#4a4a4a";
      exportBtn.style.color = "#666666";
      exportBtn.style.boxShadow = "none";
      exportBtn.style.pointerEvents = "auto";
      return;
    }
    
    // Check if any batch exceeds the maximum limit
    const hasBatchesExceedingMax = this.hasBatchesExceedingMax();
    
    // Enable button only if all conditions are met (including NFTs existence and no batches exceeding max)
    if (hasImageFormat && hasMetadataFormat && hasBlockchain && hasBatchToExport && hasNFTs && !hasBatchesExceedingMax) {
      exportBtn.disabled = false;
      exportBtn.dataset.disabled = "false";
      exportBtn.style.opacity = "1";
      exportBtn.style.cursor = "pointer";
      exportBtn.style.backgroundColor = "#8b5cf6";
      exportBtn.style.borderColor = "#8b5cf6";
      exportBtn.style.color = "rgb(255, 255, 255)";
      exportBtn.style.pointerEvents = "auto";
      // Strong halo effect with small propagation
      exportBtn.style.boxShadow = `
        inset 0 3px 5px rgba(0, 0, 0, 0.5),
        0 0 8px rgba(139, 92, 246, 0.8),
        0 0 12px rgba(139, 92, 246, 0.6)
      `;
    } else {
      exportBtn.disabled = false; // Don't use disabled attribute - it prevents click events
      exportBtn.dataset.disabled = "true"; // Use data attribute instead
      exportBtn.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
      exportBtn.style.cursor = "not-allowed";
      exportBtn.style.backgroundColor = "#2a2a2a";
      exportBtn.style.borderColor = "#4a4a4a";
      exportBtn.style.color = "#666666";
      exportBtn.style.boxShadow = "none";
      exportBtn.style.pointerEvents = "auto"; // Always allow clicks to show tooltip when disabled
    }
  },

  // Get missing requirements for export
  getMissingExportRequirements: function() {
    const missing = [];
    
    // Check image format
    const hasImageFormat = this.imageFormat.jpg || this.imageFormat.png;
    if (!hasImageFormat) {
      missing.push("• Select at least one Image Format (JPG or PNG)");
    }
    
    // Check metadata format
    const hasMetadataFormat = this.metadataFormat.json || this.metadataFormat.csv;
    if (!hasMetadataFormat) {
      missing.push("• Select at least one Metadata Format (JSON or CSV)");
    }
    
    // Check batch selection
    let hasBatchToExport = false;
    try {
      for (let i = 1; i <= this.numBatches; i++) {
        const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
        const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
        const input = document.getElementById(`batch-input-${i}`);
        
        if (selectToExportToggle && selectToExportToggle.classList.contains("active") &&
            (!alreadyMintedToggle || !alreadyMintedToggle.classList.contains("active")) &&
            input && !input.disabled) {
          const quantity = parseInt(input.value) || 0;
          if (quantity > 0) {
            hasBatchToExport = true;
            break;
          }
        }
      }
    } catch(e) {
      // Ignore errors
    }
    if (!hasBatchToExport) {
      missing.push("• Select at least one Batch to export and set its quantity to greater than 0");
    }
    
    // Check if any batch exceeds the maximum limit
    if (this.hasBatchesExceedingMax()) {
      const maxNftsInput = document.getElementById("max-nfts-export-input");
      const maxNfts = maxNftsInput ? (parseInt(maxNftsInput.value) || 2000) : 2000;
      missing.push(`• Reduce batch quantities to ${maxNfts} NFTs or less per batch (to prevent memory issues)`);
    }
    
    // Check blockchain
    let hasBlockchain = Object.values(this.blockchainToggles).some(value => value === true);
    if (!hasBlockchain) {
      const blockchainIds = ['ethereum', 'solana', 'bitcoin', 'cosmos', 'tezos', 'xrpl', 'polygon', 'immutablex', 'base', 'avalanche', 'flow', 'arbitrum'];
      for (const id of blockchainIds) {
        const toggle = document.getElementById(id);
        if (toggle && toggle.classList.contains("active")) {
          hasBlockchain = true;
          break;
        }
      }
    }
    if (!hasBlockchain) {
      missing.push("• Select at least one Blockchain where you want to mint your collection");
    }
    
    return missing;
  },

  // Validate batch quantities against maximum limit
  validateBatchQuantities: function() {
    const maxNftsInput = document.getElementById("max-nfts-export-input");
    if (!maxNftsInput) return;
    
    const maxNfts = parseInt(maxNftsInput.value) || 2000;
    let hasExceedingBatch = false;
    
    // Check all batch inputs (including batches on other pages)
    for (let i = 1; i <= this.numBatches; i++) {
      // Try to get from DOM first (if batch is on current page)
      const input = document.getElementById(`batch-input-${i}`);
      const card = document.getElementById(`batch-card-${i}`);
      let quantity = 0;
      
      if (input) {
        // Batch is on current page - get from DOM
        quantity = parseInt(input.value) || 0;
      } else if (this.batchData[i]) {
        // Batch is on other page - get from stored data
        quantity = parseInt(this.batchData[i].quantity) || 0;
      }
      
      const exceedsMax = quantity > maxNfts;
      
      // Check if any batch exceeds (for max input/card styling)
      if (exceedsMax) {
        hasExceedingBatch = true;
      }
      
      // Only update card styling if card exists in DOM (current page)
      if (!card) continue;
      
      const batchName = card.querySelector('span');
      
      if (exceedsMax) {
        // Set red border
        card.style.border = "2px solid #e74c3c";
        // Set red number (batch name)
        if (batchName) {
          batchName.style.color = "#e74c3c";
        }
        // Set red input text
        input.style.color = "#e74c3c";
        // Store that this batch exceeds the limit
        card.setAttribute("data-exceeds-max", "true");
      } else {
        // Remove red styling if it was previously set
        if (card.getAttribute("data-exceeds-max") === "true") {
          card.removeAttribute("data-exceeds-max");
          
          // Restore normal colors based on state
          const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
          const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
          const isSelectedToExport = selectToExportToggle && selectToExportToggle.classList.contains("active");
          const isAlreadyMinted = alreadyMintedToggle && alreadyMintedToggle.classList.contains("active");
          const batchNum = parseInt(i);
          const numBatches = this.numBatches || 1;
          const isActiveBatch = batchNum <= numBatches;
          
          // Restore border
          if (isSelectedToExport && !isAlreadyMinted) {
            card.style.border = "2px solid #00ff48";
          } else if (isAlreadyMinted) {
            card.style.border = "2px solid #e74c3c";
          } else {
            card.style.border = isActiveBatch ? "2px solid #8b5cf6" : "2px solid #666666";
          }
          
          // Restore batch name color
          if (batchName) {
            if (isActiveBatch) {
              batchName.style.color = "var(--text-primary)";
            } else {
              batchName.style.color = "#666666";
            }
          }
          
          // Restore input color (will be updated by updateBatchDistribution)
          this.updateBatchDistribution();
        }
      }
    }
    
    // Update maxNftsInput border, halo effect, and text color based on whether any batch exceeds
    // Find the utilities card containing the max input (try multiple methods)
    let maxNftsCard = maxNftsInput.closest('.utilities-card');
    if (!maxNftsCard) {
      // Fallback: find by traversing up the DOM
      let parent = maxNftsInput.parentElement;
      while (parent && !parent.classList.contains('utilities-card')) {
        parent = parent.parentElement;
      }
      if (parent) maxNftsCard = parent;
    }
    
    // Get the "NFTs" label inside the input
    const nftsLabelInside = document.getElementById("max-nfts-export-input-label");
    
    if (hasExceedingBatch) {
      // Set red border with red halo effect when any batch exceeds max
      maxNftsInput.style.setProperty("border", "2px solid #e74c3c", "important");
      maxNftsInput.style.setProperty("color", "#e74c3c", "important"); // Red text color
      maxNftsInput.style.setProperty("box-shadow", `
        0 0 8px rgba(231, 76, 60, 0.8),
        0 0 12px rgba(231, 76, 60, 0.6),
        0 0 16px rgba(231, 76, 60, 0.4)
      `, "important");
      // Update "NFTs" label color to red
      if (nftsLabelInside) {
        nftsLabelInside.style.setProperty("color", "#e74c3c", "important");
      }
      if (maxNftsCard) {
        maxNftsCard.style.setProperty("border", "2px solid #e74c3c", "important");
        maxNftsCard.style.setProperty("box-shadow", `
          0 0 8px rgba(231, 76, 60, 0.8),
          0 0 12px rgba(231, 76, 60, 0.6),
          0 0 16px rgba(231, 76, 60, 0.4)
        `, "important");
      }
    } else {
      // Set green border with green halo effect when all batches respect max
      maxNftsInput.style.setProperty("border", "2px solid #27ae60", "important");
      maxNftsInput.style.setProperty("color", "#27ae60", "important"); // Green text color when all respect max
      maxNftsInput.style.setProperty("box-shadow", `
        0 0 8px rgba(39, 174, 96, 0.8),
        0 0 12px rgba(39, 174, 96, 0.6),
        0 0 16px rgba(39, 174, 96, 0.4)
      `, "important");
      // Update "NFTs" label color to green
      if (nftsLabelInside) {
        nftsLabelInside.style.setProperty("color", "#27ae60", "important");
      }
      if (maxNftsCard) {
        maxNftsCard.style.setProperty("border", "2px solid #27ae60", "important");
        maxNftsCard.style.setProperty("box-shadow", `
          0 0 8px rgba(39, 174, 96, 0.8),
          0 0 12px rgba(39, 174, 96, 0.6),
          0 0 16px rgba(39, 174, 96, 0.4)
        `, "important");
      }
    }
  },
  
  // Check if any batch exceeds the maximum
  hasBatchesExceedingMax: function() {
    const maxNftsInput = document.getElementById("max-nfts-export-input");
    if (!maxNftsInput) return false;
    
    const maxNfts = parseInt(maxNftsInput.value) || 2000;
    
    for (let i = 1; i <= this.numBatches; i++) {
      const input = document.getElementById(`batch-input-${i}`);
      if (!input) continue;
      
      const quantity = parseInt(input.value) || 0;
      if (quantity > maxNfts) {
        return true;
      }
    }
    
    return false;
  },

  // Validate collection has NFTs and proper trait layers
  validateCollectionForExport: function() {
    // Get project data
    let projectData = window.currentProject;
    if (!projectData && window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject) {
      projectData = window.MemoryManager.state.currentProject;
    }
    
    // Check if there are at least 2 trait layers with at least 1 trait each
    let hasValidTraitLayers = false;
    if (projectData && projectData.traits && Array.isArray(projectData.traits)) {
      const layersWithTraits = projectData.traits.filter(layer => 
        layer && layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0
      );
      hasValidTraitLayers = layersWithTraits.length >= 2;
    }
    
    // Check if there are saved seeds/NFTs in the collection
    let hasNFTs = false;
    let seedListKey = 'nftSeedList_default';
    
    if (projectData) {
      const getSeedListKey = (project) => {
        return 'nftSeedList_' + (project && project.name ? encodeURIComponent(project.name) : 'default');
      };
      seedListKey = getSeedListKey(projectData);
    }
    
    // Check modal instance first
    if (window.savedSeedsModalInstance && window.savedSeedsModalInstance.seedList) {
      hasNFTs = window.savedSeedsModalInstance.seedList.length > 0;
    } else {
      // Fallback to localStorage
      try {
        const savedSeeds = JSON.parse(localStorage.getItem(seedListKey) || '[]');
        hasNFTs = savedSeeds.length > 0;
      } catch (e) {
        hasNFTs = false;
      }
    }
    
    // Validation logic based on user requirements:
    // Show error if:
    // 1. No NFTs in collection (regardless of trait layers), OR
    // 2. Less than 2 trait layers with at least 1 trait each AND no NFTs
    
    // Case 1: No NFTs at all - always show error
    if (!hasNFTs) {
      return {
        isValid: false,
        message: "add some NFTs to your collection<br>so that you can be able to export them."
      };
    }
    
    // Case 2: Less than 2 trait layers with traits AND no NFTs (redundant check, but explicit)
    if (!hasValidTraitLayers && !hasNFTs) {
      return {
        isValid: false,
        message: "add some NFTs to your collection<br>so that you can be able to export them."
      };
    }
    
    return {
      isValid: true,
      message: ""
    };
  },

  // Handle Export NFTs / Metadata
  // Show export confirmation popup with disk space calculation
  showExportConfirmation: function(totalNFTs, imageFormat) {
    return new Promise((resolve) => {
      // Calculate disk space needed based on image format
      // PNG: ~1.2 MB per NFT (uncompressed/lossless)
      // JPG: ~0.8 MB per NFT (compressed/lossy)
      const spacePerNFTMB = imageFormat === 'png' ? 1.2 : 0.8;
      const totalSpaceMB = totalNFTs * spacePerNFTMB;
      const totalSpaceGB = totalSpaceMB / 1024;
      
      // Format the number to 2 decimal places
      const formattedSpaceGB = totalSpaceGB.toFixed(2);
      
      // Format total NFTs with commas
      const formattedTotalNFTs = totalNFTs.toLocaleString();
      
      // Format name for display
      const formatName = imageFormat.toUpperCase();
      
      // Create the message with format-specific information
      const title = "Export Confirmation";
      const message = `You are about to export <strong style="color: #3498db; font-size: 18px;">${formattedTotalNFTs} NFT${totalNFTs !== 1 ? 's' : ''}</strong> in <strong style="color: #3498db;">${formatName}</strong> format.<br><br><strong>Estimated disk space required:</strong> <strong style="color: #3498db; font-size: 16px;">${formattedSpaceGB} GB</strong><br><br><span style="color: #e67e22; font-size: 13px;">Note: Approximately ${spacePerNFTMB} MB per NFT (${formatName === 'PNG' ? 'uncompressed' : 'compressed'} format)</span>`;
      
      const description = `<div style="margin-bottom: 16px;">
        <strong style="color: #ecf0f1;">Disk space by format:</strong><br>
        <div style="margin-left: 16px; margin-top: 8px; margin-bottom: 8px; font-size: 12px;">
          <strong>PNG format:</strong> Higher quality, uncompressed images (~1.2 MB per NFT)<br>
          <strong>JPG format:</strong> Compressed images, smaller file size (~0.8 MB per NFT)
        </div>
      </div>
      <div style="margin-bottom: 16px; padding: 12px; background: rgba(52, 152, 219, 0.1); border-left: 3px solid #3498db; border-radius: 4px;">
        <strong style="color: #3498db;">Export Process:</strong><br><br>
        Once started, all selected batches will be exported<br>
        automatically without any further user intervention.
      </div>
      <div style="color: #bdc3c7; font-size: 13px;">
        Make sure you have enough free disk space before proceeding. If you<br>need to free up space or export fewer batches at a time, click <strong>"Cancel"</strong> now.
      </div>`;
      
      // Show confirmation modal
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("confirmationModal")) {
        const confirmationModal = window.NFTApp.getModule("confirmationModal");
        
        // Get cancel button reference before showing modal
        const cancelButton = document.getElementById("cancel-confirmation");
        const closeButton = document.getElementById("close-confirmation-modal");
        
        // Set up cancel handler - will be attached after modal is shown
        let cancelHandler = null;
        let closeHandler = null;
        
        // Show modal with options
        confirmationModal.show(
          title,
          message,
          description,
          () => {
            // User clicked "Proceed"
            if (cancelHandler && cancelButton) {
              cancelButton.removeEventListener("click", cancelHandler);
            }
            if (closeHandler && closeButton) {
              closeButton.removeEventListener("click", closeHandler);
            }
            resolve(true);
          },
          {
            singleButton: false,
            confirmText: "Proceed",
            cancelText: "Cancel"
          }
        );
        
        // Override cancel and close button behavior after modal is shown
        // Use setTimeout to ensure modal's handlers are set first
        setTimeout(() => {
          if (cancelButton) {
            cancelHandler = () => {
              resolve(false);
              confirmationModal.close();
              if (cancelHandler) {
                cancelButton.removeEventListener("click", cancelHandler);
              }
              if (closeHandler) {
                closeButton.removeEventListener("click", closeHandler);
              }
            };
            // Override the onclick handler set by the modal
            cancelButton.onclick = cancelHandler;
          }
          
          // Also handle close button (X)
          if (closeButton) {
            closeHandler = () => {
              resolve(false);
              confirmationModal.close();
              if (cancelHandler && cancelButton) {
                cancelButton.removeEventListener("click", cancelHandler);
              }
              if (closeHandler) {
                closeButton.removeEventListener("click", closeHandler);
              }
            };
            // Override the onclick handler set by the modal
            closeButton.onclick = closeHandler;
          }
          
          // Also handle clicking outside the modal (on overlay)
          const modalOverlay = document.getElementById("confirmation-modal");
          if (modalOverlay) {
            const overlayHandler = (e) => {
              if (e.target === modalOverlay) {
                resolve(false);
                confirmationModal.close();
                if (cancelHandler && cancelButton) {
                  cancelButton.removeEventListener("click", cancelHandler);
                }
                if (closeHandler && closeButton) {
                  closeButton.removeEventListener("click", closeHandler);
                }
                modalOverlay.removeEventListener("click", overlayHandler);
              }
            };
            // The modal already sets up an overlay handler, but we need to override it
            // Remove the existing one and add ours
            if (modalOverlay._overlayClickHandler) {
              modalOverlay.removeEventListener("click", modalOverlay._overlayClickHandler);
            }
            modalOverlay.addEventListener("click", overlayHandler);
            modalOverlay._overlayClickHandler = overlayHandler;
          }
        }, 0);
      } else {
        // Fallback to browser confirm if modal not available
        const proceed = confirm(
          `${title}\n\n${message.replace(/<[^>]*>/g, '')}\n\n${description.replace(/<[^>]*>/g, '')}\n\nClick OK to proceed or Cancel to abort.`
        );
        resolve(proceed);
      }
    });
  },

  handleExport: async function() {
    // console.log("[Export NFTs] handleExport called");
    // console.log("[Export NFTs] Current isExporting flag:", this.isExporting);
    
    // Prevent multiple simultaneous exports
    if (this.isExporting) {
      // console.warn("[Export NFTs] Export already in progress, ignoring duplicate call");
      // console.warn("[Export NFTs] Current isExporting flag:", this.isExporting);
      // Reset the flag if it seems stuck (shouldn't happen, but safety check)
      const exportBtn = document.getElementById("export-metadata-nfts-btn");
      if (exportBtn && exportBtn.disabled) {
        // console.warn("[Export NFTs] isExporting is true but button is disabled - possible stuck state, resetting...");
        this.isExporting = false;
        this.checkExportButtonState();
      }
      return;
    }
    
    // Check if a project is loaded before proceeding
    let projectData = window.currentProject;
    if (!projectData && window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject) {
      projectData = window.MemoryManager.state.currentProject;
    }
    
    // Validate that a project is actually loaded (has meaningful data)
    if (!projectData || Object.keys(projectData).length === 0 || (!projectData.name && !projectData.traits)) {
      // Show error notification
      if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
        window.NFTApp.getModule("notificationService").show(
          "No project loaded. Please create or load a project before exporting.",
          "error",
          5000
        );
      } else {
        alert("No project loaded. Please create or load a project before exporting.");
      }
      return;
    }
    
    // Wrap everything in try/finally to ensure flag is always reset
    // Declare cleanup function at outer scope so it's accessible in finally block
    let cleanupVisibilityListener = null;
    
    try {
      this.isExporting = true;
      // console.log("[Export NFTs] isExporting flag set to true");
      
      // Immediately disable the button to prevent duplicate clicks
      const exportBtn = document.getElementById("export-metadata-nfts-btn");
      if (exportBtn) {
        exportBtn.disabled = true;
        exportBtn.dataset.disabled = "true";
        exportBtn.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
        exportBtn.style.cursor = "not-allowed";
        exportBtn.style.backgroundColor = "#2a2a2a";
        exportBtn.style.borderColor = "#4a4a4a";
        exportBtn.style.color = "#666666";
        exportBtn.style.boxShadow = "none";
        // console.log("[Export NFTs] Export button disabled during export");
      }
      
      // console.log("[Export NFTs] Starting export validation checks...");
      
      // Check if JSZip is available
      if (typeof JSZip === 'undefined') {
        // console.error("[Export NFTs] JSZip library is not loaded!");
        throw new Error("JSZip library is not loaded. Please refresh the page and try again.");
      }
      
      // Get project data - try multiple sources to ensure we have it (already checked earlier, but get fresh reference)
      let projectData = window.currentProject;
      
      // If MemoryManager is available, try to get project from there
      if (!projectData && window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject) {
        projectData = window.MemoryManager.state.currentProject;
        // console.log("[Export NFTs] Got project data from MemoryManager");
      }
      
      // Project validation already done earlier, but double-check as safety
      if (!projectData || Object.keys(projectData).length === 0 || (!projectData.name && !projectData.traits)) {
        // console.error("[Export NFTs] No project data available");
        throw new Error("No project loaded. Please create or load a project before exporting.");
      }
      
      // console.log("[Export NFTs] Project data found, starting export process");

      // Check if any batch exceeds the maximum limit (safety check)
      if (this.hasBatchesExceedingMax()) {
        const maxNftsInput = document.getElementById("max-nfts-export-input");
        const maxNfts = maxNftsInput ? (parseInt(maxNftsInput.value) || 2000) : 2000;
        throw new Error(`Cannot export: One or more batches exceed the maximum limit of ${maxNfts} NFTs per batch. Please reduce batch quantities to prevent memory issues.`);
      }

      // Main export logic starts here
      // Set up tab visibility detection to warn user about performance impact
      let tabVisibilityWarningShown = false;
      let visibilityChangeHandler = null;
      
      // Helper function to yield control to browser (helps with background tab throttling)
      // Uses MessageChannel for background tabs which is less throttled than setTimeout
      const yieldToBrowser = () => {
        return new Promise(resolve => {
          if (!document.hidden) {
            // Tab is visible - use requestAnimationFrame for smooth execution
            requestAnimationFrame(() => setTimeout(resolve, 0));
          } else {
            // Tab is hidden/minimized - use MessageChannel which has higher priority
            // and is less throttled than setTimeout in background tabs
            // MessageChannel uses the event loop but isn't throttled as aggressively
            const channel = new MessageChannel();
            channel.port1.onmessage = () => {
              channel.port1.close();
              channel.port2.close();
              resolve();
            };
            channel.port2.postMessage(null);
          }
        });
      };
      
      // Set up visibility change listener
      visibilityChangeHandler = () => {
        if (document.hidden && !tabVisibilityWarningShown && this.isExporting) {
          tabVisibilityWarningShown = true;
          // Show info notification (less urgent now with MessageChannel optimization)
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              "ℹ️ Tab is in background. Export will continue but may be slightly slower. Keep tab active for best performance.",
              "info",
              6000
            );
          }
        } else if (!document.hidden && tabVisibilityWarningShown) {
          // Tab became visible again - show info that it will speed up
          if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
            window.NFTApp.getModule('notificationService').show(
              "✓ Tab is active. Export will run at full speed.",
              "info",
              3000
            );
          }
        }
      };
      
      document.addEventListener('visibilitychange', visibilityChangeHandler);
      
      // Cleanup function to remove listener
      cleanupVisibilityListener = () => {
        if (visibilityChangeHandler) {
          document.removeEventListener('visibilitychange', visibilityChangeHandler);
          visibilityChangeHandler = null;
        }
      };
      
      // Get selected image format (JPG or PNG)
      const imageFormat = this.imageFormat.jpg ? 'jpg' : (this.imageFormat.png ? 'png' : null);
      if (!imageFormat) {
        cleanupVisibilityListener();
        throw new Error("Please select an image format (JPG or PNG)");
      }

      // Get selected metadata format (JSON or CSV)
      const metadataFormat = this.metadataFormat.json ? 'json' : (this.metadataFormat.csv ? 'csv' : null);
      if (!metadataFormat) {
        throw new Error("Please select a metadata format (JSON or CSV)");
      }

      // Get selected blockchains - check both state and DOM to ensure sync
      const selectedBlockchains = [];
      const blockchainNames = {
        ethereum: 'Ethereum',
        solana: 'Solana',
        bitcoin: 'Bitcoin Ordinals (Inscriptions)',
        cosmos: 'Cosmos (Inscriptions)',
        tezos: 'Tezos',
        xrpl: 'XRPL',
        polygon: 'Polygon',
        immutablex: 'Immutable X',
        base: 'Base',
        avalanche: 'Avalanche',
        flow: 'Flow',
        arbitrum: 'Arbitrum'
      };

      // Check state first
      Object.keys(this.blockchainToggles).forEach(key => {
        if (this.blockchainToggles[key]) {
          selectedBlockchains.push(blockchainNames[key]);
        }
      });

      // If no blockchains found in state, check DOM toggles directly
      if (selectedBlockchains.length === 0) {
        const blockchainIds = ['ethereum', 'solana', 'bitcoin', 'cosmos', 'tezos', 'xrpl', 'polygon', 'immutablex', 'base', 'avalanche', 'flow', 'arbitrum'];
        blockchainIds.forEach(id => {
          const toggle = document.getElementById(id);
          if (toggle && toggle.classList.contains("active")) {
            selectedBlockchains.push(blockchainNames[id]);
          }
        });
      }

      if (selectedBlockchains.length === 0) {
        throw new Error("Please select at least one blockchain");
      }

      // Get batches selected for export (check all 20 batches, including those on page 2)
      const batchesToExport = [];
      const totalSupply = parseInt(projectData.totalSupply || projectData.size || 10000);

      for (let i = 1; i <= this.numBatches; i++) {
        // Try to get from DOM first (if batch is on current page)
        const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
        const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
        const input = document.getElementById(`batch-input-${i}`);
        
        let isSelectedToExport = false;
        let isAlreadyMinted = false;
        let quantity = 0;
        
        if (selectToExportToggle && alreadyMintedToggle && input && !input.disabled) {
          // Batch is on current page - get from DOM
          isSelectedToExport = selectToExportToggle.classList.contains("active");
          isAlreadyMinted = alreadyMintedToggle.classList.contains("active");
          quantity = parseInt(input.value) || 0;
        } else if (this.batchData[i]) {
          // Batch is on other page - get from stored data
          isSelectedToExport = this.batchData[i].selectToExport === true;
          isAlreadyMinted = this.batchData[i].alreadyMinted === true;
          quantity = parseInt(this.batchData[i].quantity) || 0;
        }

        if (isSelectedToExport && !isAlreadyMinted && quantity > 0) {
          batchesToExport.push({
            batchNumber: i,
            quantity: quantity
          });
        }
      }

      if (batchesToExport.length === 0) {
        throw new Error("Please select at least one batch to export");
      }

      // Calculate NFT indices for each batch (starting from 1)
      // Note: NFT indices are based on their position in the collection, not batch order
      let currentIndex = 1;
      batchesToExport.forEach(batch => {
        batch.startIndex = currentIndex;
        batch.endIndex = currentIndex + batch.quantity - 1;
        currentIndex = batch.endIndex + 1;
      });

      // Calculate total NFTs to export
      // Images are generated once (not per blockchain), so we only count images once
      // Metadata is generated per blockchain, so we count metadata per blockchain
      const totalNFTsInBatches = batchesToExport.reduce((sum, batch) => sum + batch.quantity, 0);
      const totalMetadataFiles = this.metadataPerNftEnabled 
        ? totalNFTsInBatches * selectedBlockchains.length  // 1 metadata file per NFT per blockchain
        : batchesToExport.length * selectedBlockchains.length;  // 1 metadata file per batch per blockchain
      const totalNFTsToExport = totalNFTsInBatches + totalMetadataFiles;  // Images + metadata files
      // console.log("[Export NFTs] Total NFTs to export:", totalNFTsToExport);

      // Show export confirmation popup with disk space calculation
      const proceedWithExport = await this.showExportConfirmation(totalNFTsInBatches, imageFormat);
      if (!proceedWithExport) {
        // User cancelled, reset export flag and button state
        this.isExporting = false;
        this.checkExportButtonState();
        return;
      }

      // Note: We will prompt for save location for each batch/file in saveBatchZip function
      // This allows the user to choose location and filename for each export
      
      // Get collection name for filename - read from collection-name input field first
      let collectionName = '';
      const collectionNameInput = document.getElementById('collection-name');
      if (collectionNameInput && collectionNameInput.value && collectionNameInput.value.trim()) {
        collectionName = collectionNameInput.value.trim();
      }
      
      // Fallback to projectData.name if input field is empty
      if (!collectionName) {
        collectionName = projectData.name;
      if (!collectionName || !collectionName.trim()) {
        if (window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject && window.MemoryManager.state.currentProject.name) {
          collectionName = window.MemoryManager.state.currentProject.name;
        }
        if ((!collectionName || !collectionName.trim()) && window.currentProject && window.currentProject.name) {
          collectionName = window.currentProject.name;
        }
      }
      }
      
      // Final fallback to default name
      if (!collectionName || !collectionName.trim()) {
        collectionName = 'NFT_Collection';
      } else {
        collectionName = collectionName.trim();
      }
      
      // Sanitize collection name for filename (remove invalid characters)
      collectionName = collectionName.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
      
      // Initialize export results early so it's available for error handling
      const exportResults = {
        successes: [],
        errors: []
      };
      
      // Prompt once at start for save directory (if File System Access API is available)
      let saveDirectoryHandle = null;
      if (window.showDirectoryPicker) {
        try {
          saveDirectoryHandle = await window.showDirectoryPicker({
            mode: 'readwrite'
          });
        } catch (err) {
          if (err.name !== 'AbortError') {
            throw new Error(`Failed to select save directory: ${err.message}`);
          }
          // User cancelled directory selection
          throw new Error("Export cancelled by user");
        }
      }
      
      // Show progress popup - pass actual NFT count for display, not file count
      // Also pass the current export option to set the correct title
      const progressPopup = this.showExportProgressPopup(totalNFTsInBatches, selectedBlockchains.length, batchesToExport.length, batchesToExport, this.exportOption);
      let isExportCancelled = false;
      
      // Set up cancel functionality
      const cancelBtn = progressPopup.querySelector('#cancel-export-btn');
      if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
          isExportCancelled = true;
          // console.log("[Export NFTs] Export cancelled by user");
          this.hideExportProgressPopup();
          // Don't throw here - it won't be caught. Instead, set flag and check early.
        });
      }
      
      // Check for cancellation immediately after setting up cancel button
      if (isExportCancelled) {
        throw new Error("Export cancelled by user");
      }
      
      // Track progress
      // processedNFTs tracks files (images + metadata) for progress bar calculation
      // processedNFTCount tracks actual NFTs for display
      let processedNFTs = 0;
      let processedNFTCount = 0; // Track actual number of NFTs processed (not files)
      const exportStartTime = Date.now();
      
      // Initialize ETA tracking variables for this export session
      this.exportLastPercentageMilestone = 0;
      this.exportRecentTimes = [];
      this.exportLastUpdateTime = Date.now();
      this.exportLastProcessedCount = 0;
      
      // Pre-populate all tasks as pending (greyed out)
      const taskMap = new Map(); // Map to track tasks by their key
      const finishedTasksEl = progressPopup.querySelector('#export-finished-tasks');
      if (finishedTasksEl) {
        batchesToExport.forEach(batch => {
          // Task for images export
          const imagesTaskKey = `batch-${batch.batchNumber}-images`;
          const imagesTaskText = `Batch ${batch.batchNumber}: Images exported (${batch.quantity} NFTs)`;
          const imagesTaskDiv = document.createElement('div');
          imagesTaskDiv.dataset.taskKey = imagesTaskKey;
          imagesTaskDiv.style.cssText = 'color: #7f8c8d; margin-bottom: 5px; padding: 5px; background: rgba(127, 140, 141, 0.1); border-radius: 4px; display: flex; align-items: center;';
          // Add spacer to align text with completed tasks (matches checkmark width + margin)
          const imagesSpacerSpan = document.createElement('span');
          imagesSpacerSpan.style.width = '20px'; // 12px width + 8px margin-right
          imagesSpacerSpan.style.flexShrink = '0';
          imagesTaskDiv.appendChild(imagesSpacerSpan);
          const imagesTaskTextSpan = document.createElement('span');
          imagesTaskTextSpan.textContent = `${imagesTaskText} - Waiting to be processed`;
          imagesTaskTextSpan.style.flex = '1';
          imagesTaskDiv.appendChild(imagesTaskTextSpan);
          finishedTasksEl.appendChild(imagesTaskDiv);
          taskMap.set(imagesTaskKey, imagesTaskDiv);
          
          // Tasks for metadata export (one per blockchain)
          selectedBlockchains.forEach(blockchain => {
            const metadataTaskKey = `batch-${batch.batchNumber}-metadata-${blockchain}`;
            const metadataTaskText = this.metadataPerNftEnabled 
              ? `Batch ${batch.batchNumber}: Metadata exported for ${blockchain} (${batch.quantity} files)`
              : `Batch ${batch.batchNumber}: Metadata exported for ${blockchain} (1 combined file)`;
            const metadataTaskDiv = document.createElement('div');
            metadataTaskDiv.dataset.taskKey = metadataTaskKey;
            metadataTaskDiv.style.cssText = 'color: #7f8c8d; margin-bottom: 5px; padding: 5px; background: rgba(127, 140, 141, 0.1); border-radius: 4px; display: flex; align-items: center;';
            // Add spacer to align text with completed tasks (matches checkmark width + margin)
            const metadataSpacerSpan = document.createElement('span');
            metadataSpacerSpan.style.width = '20px'; // 12px width + 8px margin-right
            metadataSpacerSpan.style.flexShrink = '0';
            metadataTaskDiv.appendChild(metadataSpacerSpan);
            const metadataTaskTextSpan = document.createElement('span');
            metadataTaskTextSpan.textContent = `${metadataTaskText} - Waiting to be processed`;
            metadataTaskTextSpan.style.flex = '1';
            metadataTaskDiv.appendChild(metadataTaskTextSpan);
            finishedTasksEl.appendChild(metadataTaskDiv);
            taskMap.set(metadataTaskKey, metadataTaskDiv);
          });
          
          // Final task for batch completion
          // Removed "Batch X exported successfully" task - only showing Images and Metadata tasks
        });
      }
      
      // Helper function to update task from pending to completed
      const updateTaskToCompleted = (taskKey, taskText) => {
        const taskDiv = taskMap.get(taskKey);
        if (taskDiv) {
          taskDiv.style.cssText = 'color: #27ae60; margin-bottom: 5px; padding: 5px; background: rgba(39, 174, 96, 0.1); border-radius: 4px; display: flex; align-items: center;';
          // Clear existing content
          taskDiv.innerHTML = '';
          // Add checkmark icon
          const checkmarkSpan = document.createElement('span');
          checkmarkSpan.textContent = '✓';
          checkmarkSpan.style.marginRight = '8px';
          checkmarkSpan.style.color = '#27ae60';
          checkmarkSpan.style.fontWeight = 'bold';
          checkmarkSpan.style.width = '12px';
          checkmarkSpan.style.flexShrink = '0';
          // Add task text
          const taskTextSpan = document.createElement('span');
          taskTextSpan.textContent = taskText;
          taskTextSpan.style.flex = '1';
          taskDiv.appendChild(checkmarkSpan);
          taskDiv.appendChild(taskTextSpan);
          // Auto-scroll to show updated task
          finishedTasksEl.scrollTop = finishedTasksEl.scrollHeight;
        }
      };
      
      // Helper function to add finished task to display (now updates existing tasks)
      const addFinishedTask = (taskText) => {
        // Try to find the task by matching the text pattern
        let taskKey = null;
        
        // Match images task
        const imagesMatch = taskText.match(/Batch (\d+): Images exported/);
        if (imagesMatch) {
          taskKey = `batch-${imagesMatch[1]}-images`;
        }
        
        // Match metadata task
        if (!taskKey) {
          const metadataMatch = taskText.match(/Batch (\d+): Metadata exported for (.+?) \(/);
          if (metadataMatch) {
            taskKey = `batch-${metadataMatch[1]}-metadata-${metadataMatch[2]}`;
          }
        }
        
        // Check if this is an error (contains "failed", "error", "Failed", etc.)
        const isError = taskText.toLowerCase().includes('failed') || 
                       taskText.toLowerCase().includes('error') ||
                       taskText.toLowerCase().includes('insufficient');
        
        // If we found a matching task, update it; otherwise add as new (for errors)
        if (taskKey && taskMap.has(taskKey)) {
          updateTaskToCompleted(taskKey, taskText);
        } else {
          // Add new task (for errors or unexpected tasks)
          const finishedTasksEl = progressPopup.querySelector('#export-finished-tasks');
          if (finishedTasksEl) {
            const taskDiv = document.createElement('div');
            const iconSpan = document.createElement('span');
            iconSpan.style.marginRight = '8px';
            iconSpan.style.fontWeight = 'bold';
            iconSpan.style.width = '12px';
            iconSpan.style.flexShrink = '0';
            
            if (isError) {
              // Error styling: red color with X symbol
              taskDiv.style.cssText = 'color: #e74c3c; margin-bottom: 5px; padding: 5px; background: rgba(231, 76, 60, 0.1); border-radius: 4px; display: flex; align-items: center;';
              iconSpan.textContent = '✗';
              iconSpan.style.color = '#e74c3c';
            } else {
              // Success styling: green color with checkmark
              taskDiv.style.cssText = 'color: #27ae60; margin-bottom: 5px; padding: 5px; background: rgba(39, 174, 96, 0.1); border-radius: 4px; display: flex; align-items: center;';
              iconSpan.textContent = '✓';
              iconSpan.style.color = '#27ae60';
            }
            
            const taskTextSpan = document.createElement('span');
            taskTextSpan.textContent = taskText;
            taskTextSpan.style.flex = '1';
            taskDiv.appendChild(iconSpan);
            taskDiv.appendChild(taskTextSpan);
            finishedTasksEl.appendChild(taskDiv);
            finishedTasksEl.scrollTop = finishedTasksEl.scrollHeight;
          }
        }
      };
      
      // Removed showFinalLog function - summary is no longer displayed
      
      // Helper function to save a batch ZIP file
      const saveBatchZip = async (zip, batchNumber, blockchainNames, totalBatchesCount, directoryHandle) => {
        // Generate ZIP file with compression
        const content = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: {
            level: 6
          }
        });

        // Create filename with collection name, batch number, and date
        // The ZIP will contain: projectName/images/ and projectName/blockchain/ folders
        // Get collection name - read from collection-name input field first
        let collectionName = '';
        const collectionNameInput = document.getElementById('collection-name');
        if (collectionNameInput && collectionNameInput.value && collectionNameInput.value.trim()) {
          collectionName = collectionNameInput.value.trim();
        }
        
        // Fallback to projectData.name if input field is empty
        if (!collectionName) {
          collectionName = projectData.name;
        if (!collectionName || !collectionName.trim()) {
          if (window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject && window.MemoryManager.state.currentProject.name) {
            collectionName = window.MemoryManager.state.currentProject.name;
          }
          if ((!collectionName || !collectionName.trim()) && window.currentProject && window.currentProject.name) {
            collectionName = window.currentProject.name;
            }
          }
        }
        
        // Final fallback to default name
        if (!collectionName || !collectionName.trim()) {
          collectionName = 'NFT_Collection';
        } else {
          collectionName = collectionName.trim();
        }
        
        // Sanitize collection name for filename (remove invalid characters)
        collectionName = collectionName.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
        
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;
        // If multiple batches, include batch number to avoid filename conflicts
        const batchStr = String(batchNumber).padStart(2, '0');
        const filename = totalBatchesCount > 1 
          ? `${collectionName}_Batch_${batchStr}_${dateStr}.zip`
          : `${collectionName}_${dateStr}.zip`;
        
        // Create project folder structure inside ZIP
        const projectFolder = zip.folder(collectionName);

        // Save file using File System Access API if available
        // Use directory handle if provided (prompted once at start), otherwise prompt for each file
        if (directoryHandle) {
          try {
            // Use the directory handle from the initial prompt
            const fileHandle = await directoryHandle.getFileHandle(filename, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            return true;
          } catch (err) {
            // Preserve original error details, especially for HD space errors
            if (err.name === 'QuotaExceededError' || err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('space')) {
              throw new Error(`Insufficient disk space: ${err.message || 'Not enough free space on disk'}`);
            }
            throw new Error(`Failed to save file: ${err.message}`);
          }
        } else if (window.showSaveFilePicker) {
          try {
            // Fallback: prompt for each file if directory handle not available
            const fileHandle = await window.showSaveFilePicker({
                  suggestedName: filename,
                  types: [{
                    description: 'ZIP Files',
                    accept: { 'application/zip': ['.zip'] }
                  }]
                });

            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            
            return true;
          } catch (err) {
            if (err.name === 'AbortError') {
              return false; // User cancelled
            }
            // Preserve original error details, especially for HD space errors
            if (err.name === 'QuotaExceededError' || err.message.toLowerCase().includes('quota') || err.message.toLowerCase().includes('space')) {
              throw new Error(`Insufficient disk space: ${err.message || 'Not enough free space on disk'}`);
            }
            throw err;
          }
        } else {
          // Fallback: use download link (automatic, no user interaction needed)
          const a = document.createElement('a');
          a.href = URL.createObjectURL(content);
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(a.href);
          
          return true;
        }
      };

      // Helper function to format attributes
      const formatAttributes = (nft) => {
        if (!nft.traits) return [];
        
        // Helper function to get trait rarity from projectData
        const getTraitRarity = (trait) => {
          if (!projectData || !projectData.traits) return null;
          
          let layerId = null;
          let traitId = null;
          
          // Get layer ID
          if (trait.layer) {
            if (typeof trait.layer === 'object' && trait.layer.id) {
              layerId = trait.layer.id;
            } else if (typeof trait.layer === 'string') {
              // Try to find layer by name
              const layer = projectData.traits.find(l => l.name === trait.layer || l.id === trait.layer);
              if (layer) layerId = layer.id;
            }
          }
          
          // Get trait ID
          if (trait.trait) {
            if (typeof trait.trait === 'object' && trait.trait.id) {
              traitId = trait.trait.id;
            } else if (typeof trait.trait === 'string') {
              // Try to find trait by name within the layer
              if (layerId) {
                const layer = projectData.traits.find(l => l.id === layerId);
                if (layer && layer.traits) {
                  const traitObj = layer.traits.find(t => t.name === trait.trait || t.id === trait.trait);
                  if (traitObj) traitId = traitObj.id;
                }
              }
            }
          }
          
          // Look up rarity from projectData
          if (layerId && traitId && projectData.traits) {
            const layer = projectData.traits.find(l => l.id === layerId);
            if (layer && layer.traits) {
              const traitObj = layer.traits.find(t => t.id === traitId);
              if (traitObj && typeof traitObj.rarity !== 'undefined' && traitObj.rarity !== null) {
                return parseFloat(traitObj.rarity) || null;
              }
            }
          }
          
          return null;
        };
        
        // Handle array of traits
        if (Array.isArray(nft.traits)) {
          return nft.traits.map(trait => {
            // Handle different trait structures
            let traitType = '';
            let traitValue = '';
            
            if (trait.layer) {
              if (typeof trait.layer === 'string') {
                traitType = trait.layer;
              } else if (trait.layer.name) {
                traitType = trait.layer.name;
              } else if (trait.layer.id) {
                traitType = trait.layer.id;
              }
            }
            
            if (trait.trait) {
              if (typeof trait.trait === 'string') {
                traitValue = trait.trait;
              } else if (trait.trait.name) {
                traitValue = trait.trait.name;
              } else if (trait.trait.id) {
                traitValue = trait.trait.id;
              }
            }
            
            // Get trait rarity
            const traitRarity = getTraitRarity(trait);
            
            const attribute = {
              trait_type: traitType || 'Unknown',
              value: traitValue || 'Unknown'
            };
            
            // Add rarity if available (formatted as percentage with % symbol)
            if (traitRarity !== null) {
              attribute.rarity = `${traitRarity}%`;
            }
            
            return attribute;
          }).filter(attr => attr.trait_type && attr.value); // Filter out empty attributes
        }
        
        // Handle object of traits (fallback)
        if (typeof nft.traits === 'object') {
          return Object.entries(nft.traits).map(([key, value]) => {
            const attribute = {
              trait_type: key,
              value: typeof value === 'string' ? value : (value?.name || value?.id || String(value))
            };
            
            // Try to get rarity if value is an object with layer/trait info
            if (typeof value === 'object' && value !== null) {
              const traitRarity = getTraitRarity({ layer: { id: key }, trait: value });
              if (traitRarity !== null) {
                attribute.rarity = `${traitRarity}%`;
              }
            }
            
            return attribute;
          });
        }
        
        return [];
      };

      // Helper function to get personal description for an NFT
      const getPersonalDescription = (seed) => {
        // Try to get from projectData.nftDescriptions
        if (projectData.nftDescriptions && projectData.nftDescriptions[seed]) {
          return projectData.nftDescriptions[seed];
        }
        
        // Try to get project name from multiple sources
        let projectName = projectData.name;
        if (!projectName && window.currentProject && window.currentProject.name) {
          projectName = window.currentProject.name;
        }
        if (!projectName && window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject && window.MemoryManager.state.currentProject.name) {
          projectName = window.MemoryManager.state.currentProject.name;
        }
        
        // Try to get from localStorage
        const key = `nftDescriptions_${projectName || 'default'}`;
        try {
          const stored = JSON.parse(localStorage.getItem(key) || '{}');
          if (stored[seed]) {
            return stored[seed];
          }
        } catch(e) {
          // Ignore errors
        }
        return null;
      };

      // Helper function to build metadata for each blockchain
      const buildMetadata = (blockchain, nft, imageName, index, seed) => {
        const nameBase = `${projectData.filenamePrefix || 'NFT'} #${String(index).padStart(String(totalSupply).length, '0')}`;
        const commonAttrs = formatAttributes(nft);
        const personalDesc = seed ? getPersonalDescription(seed) : null;
        const description = personalDesc || projectData.defaultNftDescription || '';

        // Add rarity rank if enabled
        const includeRarityRank = this.rarityRankEnabled && typeof nft.rarity_rank !== 'undefined';
        
        // Image URL should be empty string until image is uploaded/hosted
        const imageUrl = ''; // Empty until image is added/hosted

        switch (blockchain) {
          case 'Solana': {
            const metadata = {
              name: nameBase,
              symbol: (projectData.symbol || '').toString().slice(0, 10) || undefined,
              description: description,
              image: imageUrl,
              attributes: commonAttrs,
              properties: {
                category: 'image',
                files: [{ uri: imageUrl, type: `image/${imageFormat}` }]
              }
            };
            if (includeRarityRank) {
              metadata.rarity_rank = nft.rarity_rank;
            }
            return metadata;
          }
          case 'Tezos': {
            const metadata = {
              name: nameBase,
              symbol: (projectData.symbol || '').toString().slice(0, 10) || undefined,
              decimals: 0,
              description: description,
              artifactUri: imageUrl,
              displayUri: imageUrl,
              thumbnailUri: imageUrl,
              formats: [{ uri: imageUrl, mimeType: `image/${imageFormat}` }],
              attributes: commonAttrs.map(a => {
                const attr = { name: a.trait_type, value: a.value };
                // Include rarity if available
                if (typeof a.rarity !== 'undefined' && a.rarity !== null) {
                  attr.rarity = a.rarity;
                }
                return attr;
              })
            };
            if (includeRarityRank) {
              metadata.rarity_rank = nft.rarity_rank;
            }
            return metadata;
          }
          case 'Bitcoin Ordinals (Inscriptions)':
          case 'Cosmos (Inscriptions)': {
            const metadata = {
              name: nameBase,
              description: description,
              content: imageUrl,
              contentType: `image/${imageFormat}`,
              attributes: commonAttrs
            };
            if (includeRarityRank) {
              metadata.rarity_rank = nft.rarity_rank;
            }
            return metadata;
          }
          case 'XRPL': {
            const metadata = {
              name: nameBase,
              description: description,
              image: imageUrl,
              attributes: commonAttrs
            };
            if (includeRarityRank) {
              metadata.rarity_rank = nft.rarity_rank;
            }
            return metadata;
          }
          case 'Polygon':
          case 'Immutable X':
          case 'Base':
          case 'Avalanche':
          case 'Flow':
          case 'Arbitrum':
          case 'Ethereum':
          default: {
            const metadata = {
              name: nameBase,
              description: description,
              image: imageUrl,
              attributes: commonAttrs
            };
            if (includeRarityRank) {
              metadata.rarity_rank = nft.rarity_rank;
            }
            return metadata;
          }
        }
      };

      // Helper function to generate CSV data
      const generateCSVData = (blockchain, nft, imageName, index, seed) => {
        const nameBase = `${projectData.filenamePrefix || 'NFT'} #${String(index).padStart(String(totalSupply).length, '0')}`;
        const attributes = formatAttributes(nft);
        const personalDesc = seed ? getPersonalDescription(seed) : null;
        const description = personalDesc || projectData.defaultNftDescription || '';
        
        // Image URL should be empty string until image is uploaded/hosted
        const imageUrl = ''; // Empty until image is added/hosted
        
        let csvContent = 'Name,Description,Image';
        if (this.rarityRankEnabled && typeof nft.rarity_rank !== 'undefined') {
          csvContent += ',Rarity_Rank';
        }
        if (attributes.length > 0) {
          csvContent += ',' + attributes.map(attr => `Trait_${attr.trait_type.replace(/[^a-zA-Z0-9]/g, '_')}`).join(',');
        }
        csvContent += '\n';
        
        csvContent += `"${nameBase}","${description.replace(/"/g, '""')}","${imageUrl}"`;
        if (this.rarityRankEnabled && typeof nft.rarity_rank !== 'undefined') {
          csvContent += `,"${nft.rarity_rank}"`;
        }
        if (attributes.length > 0) {
          csvContent += ',' + attributes.map(attr => `"${attr.value.replace(/"/g, '""')}"`).join(',');
        }
        csvContent += '\n';
        
        return csvContent;
      };

      // console.log("[Export NFTs] Starting NFT generation for batches:", batchesToExport);
      // console.log("[Export NFTs] Selected blockchains:", selectedBlockchains);
      
      // Get seeds once (shared across all batches and blockchains)
      let projectName = projectData.name;
      if (!projectName && window.currentProject && window.currentProject.name) {
        projectName = window.currentProject.name;
      }
      if (!projectName && window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject && window.MemoryManager.state.currentProject.name) {
        projectName = window.MemoryManager.state.currentProject.name;
      }
      
      const seedListKey = 'nftSeedList_' + (projectName ? encodeURIComponent(projectName) : 'default');
      let seedList = JSON.parse(localStorage.getItem(seedListKey) || '[]');
      
      // Process each batch separately - create and save a ZIP file for each batch
      for (const batch of batchesToExport) {
        // Check for cancellation before starting each batch
        if (isExportCancelled) {
          throw new Error("Export cancelled by user");
        }
        
        // Create a new ZIP file for this batch
        const zip = new JSZip();
        
        // Create project folder structure
        let projectName = projectData.name;
        if (!projectName || !projectName.trim()) {
          if (window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject && window.MemoryManager.state.currentProject.name) {
            projectName = window.MemoryManager.state.currentProject.name;
          }
          if ((!projectName || !projectName.trim()) && window.currentProject && window.currentProject.name) {
            projectName = window.currentProject.name;
          }
        }
        if (!projectName || !projectName.trim()) {
          projectName = 'NFT_Collection';
        } else {
          projectName = projectName.trim();
        }
        
        const projectFolder = zip.folder(projectName);
        
        // Create images folder (shared across all blockchains - images are the same for all)
        const imagesFolder = projectFolder.folder('images');
        
        // Store NFTs for metadata export (shared data, but metadata format differs per blockchain)
        const allNFTs = [];
        
        // Process batch - generate images once (same for all blockchains)
        // console.log(`[Export NFTs] Processing batch ${batch.batchNumber}, quantity: ${batch.quantity}`);
          
        // Process in smaller chunks to avoid memory buildup
        // Reduced to 10 for large collections (10,000+ NFTs) to prevent memory exhaustion
        const CHUNK_SIZE = 10; // Process 10 NFTs at a time

        // Generate NFTs for this batch in chunks
        for (let chunkStart = 0; chunkStart < batch.quantity; chunkStart += CHUNK_SIZE) {
          // Check for cancellation
          if (isExportCancelled) {
            throw new Error("Export cancelled by user");
          }
          
          const chunkEnd = Math.min(chunkStart + CHUNK_SIZE, batch.quantity);
          const chunkNFTs = [];
          
          // Process chunk
          for (let i = chunkStart; i < chunkEnd; i++) {
            // Yield to browser periodically to help with background tab throttling
            if (i % 5 === 0) {
              await yieldToBrowser();
            }
            const nftIndex = batch.startIndex + i;
            const seedObj = seedList[nftIndex - 1];
            const seed = seedObj && seedObj.seed ? seedObj.seed : null;

            if (!seed) {
              // console.warn(`[Export NFTs] No seed found for NFT #${nftIndex}, skipping...`);
              continue;
            }

            // console.log(`[Export NFTs] Generating NFT #${nftIndex} with seed: ${seed.substring(0, 20)}...`);

            // Generate NFT
            let nft = null;
            if (window.NFTApp.getModule && window.NFTApp.getModule('generateNfts')) {
              try {
                nft = await window.NFTApp.getModule('generateNfts').generateSingleNFT(projectData, false, seed);
                if (nft) {
                  // console.log(`[Export NFTs] Successfully generated NFT #${nftIndex}`);
                  
                  // Try to get actual canvas dimensions from NFT before it's cleared
                  // This is more accurate than reading from the data URL image
                  if (processedNFTCount === 0) {
                    let detectedWidth = 0;
                    let detectedHeight = 0;
                    
                    // First, try to get from canvas (most accurate)
                    if (nft.canvas && nft.canvas.width > 0 && nft.canvas.height > 0) {
                      detectedWidth = nft.canvas.width;
                      detectedHeight = nft.canvas.height;
                    }
                    
                    // If canvas dimensions are 1000x1000 (default), try to get actual size from first trait image
                    // The actual trait images might be 1024x1024 even if canvas is 1000x1000
                    if (detectedWidth === 1000 && detectedHeight === 1000 && projectData && projectData.traits) {
                      // Try to find first trait with an image and check its dimensions
                      for (const layer of projectData.traits) {
                        if (layer.traits && layer.traits.length > 0) {
                          for (const trait of layer.traits) {
                            if (trait.imageData || trait.image) {
                              // Create a temporary image to check dimensions
                              const tempImg = new Image();
                              const imageSrc = trait.imageData || trait.image;
                              if (imageSrc) {
                                await new Promise((resolve, reject) => {
                                  tempImg.onload = () => {
                                    if (tempImg.naturalWidth > 0 && tempImg.naturalHeight > 0) {
                                      detectedWidth = tempImg.naturalWidth;
                                      detectedHeight = tempImg.naturalHeight;
                                    }
                                    resolve();
                                  };
                                  tempImg.onerror = () => resolve(); // Continue if image fails to load
                                  tempImg.src = imageSrc;
                                  // Timeout after 2 seconds
                                  setTimeout(() => resolve(), 2000);
                                });
                                // If we found valid dimensions, break
                                if (detectedWidth > 0 && detectedWidth !== 1000) {
                                  break;
                                }
                              }
                            }
                          }
                          if (detectedWidth > 0 && detectedWidth !== 1000) {
                            break;
                          }
                        }
                      }
                    }
                    
                    // Only update if we have valid dimensions
                    if (detectedWidth > 0 && detectedHeight > 0) {
                      this.originalImageWidth = detectedWidth;
                      this.originalImageHeight = detectedHeight;
                      
                      // Update UI immediately
                      const widthInput = document.getElementById('export-image-width-input');
                      const heightInput = document.getElementById('export-image-height-input');
                      if (widthInput && heightInput) {
                        widthInput.value = detectedWidth;
                        heightInput.value = detectedHeight;
                      }
                    }
                  }
                } else {
                  // console.warn(`[Export NFTs] generateSingleNFT returned null for NFT #${nftIndex}`);
                }
              } catch (e) {
                // console.error(`[Export NFTs] Error generating NFT #${nftIndex}:`, e);
                // console.error(`[Export NFTs] Error stack:`, e.stack);
                continue;
              }
            } else {
              // console.error(`[Export NFTs] generateNfts module not available`);
              throw new Error("generateNfts module is not available");
            }

            if (!nft || !nft.imageData) {
              // console.warn(`[Export NFTs] Failed to generate NFT #${nftIndex} (nft: ${!!nft}, imageData: ${!!(nft && nft.imageData)}), skipping...`);
              continue;
            }

            // Convert image to selected format
            // console.log(`[Export NFTs] Converting image #${nftIndex} to ${imageFormat} format`);
            const imageExtension = imageFormat;
            
            // CRITICAL: Preserve traits and rarity_rank before async operations
            // These will be used in the toBlob callback and must not be cleared before then
            const nftTraits = nft.traits ? JSON.parse(JSON.stringify(nft.traits)) : null;
            const nftRarityRank = nft.rarity_rank;
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            await new Promise((resolve, reject) => {
              const timeout = setTimeout(() => {
                // console.error(`[Export NFTs] Timeout loading image for NFT #${nftIndex}`);
                reject(new Error(`Timeout loading image for NFT #${nftIndex}`));
              }, 30000); // 30 second timeout
              
              img.onload = () => {
                clearTimeout(timeout);
                try {
                  // Get original dimensions from first image
                  // Always prioritize naturalWidth/naturalHeight as they represent the actual image dimensions
                  // For data URLs, naturalWidth/naturalHeight should be available after onload fires
                  if (processedNFTCount === 0) {
                    let naturalWidth = img.naturalWidth;
                    let naturalHeight = img.naturalHeight;
                    
                    // If natural dimensions are 0 or undefined, try to get from the image element
                    // This can happen if the image hasn't fully decoded yet
                    if (!naturalWidth || naturalWidth === 0) {
                      naturalWidth = img.width;
                    }
                    if (!naturalHeight || naturalHeight === 0) {
                      naturalHeight = img.height;
                    }
                    
                    // Only update if we don't already have correct dimensions from canvas
                    // or if the detected dimensions are valid and different from 1000x1000
                    // Always prefer naturalWidth/naturalHeight as they represent actual image size
                    if (naturalWidth > 0 && naturalHeight > 0) {
                      // Only update if current dimensions are 0, 1000x1000, or if new dimensions are more accurate
                      const shouldUpdate = (!this.originalImageWidth || this.originalImageWidth === 0 || 
                                           (this.originalImageWidth === 1000 && naturalWidth !== 1000)) &&
                                           naturalWidth !== 1000;
                      
                      if (shouldUpdate) {
                        this.originalImageWidth = naturalWidth;
                        this.originalImageHeight = naturalHeight;
                        
                        // Update UI immediately
                        const widthInput = document.getElementById('export-image-width-input');
                        const heightInput = document.getElementById('export-image-height-input');
                        if (widthInput && heightInput) {
                          widthInput.value = naturalWidth;
                          heightInput.value = naturalHeight;
                        }
                      }
                    }
                  }
                  
                  // Use custom dimensions if CUSTOM is selected, otherwise use original
                  let exportWidth, exportHeight;
                  if (this.useOriginalImageSize) {
                    // Always use natural dimensions if available, they represent the actual image size
                    // naturalWidth/naturalHeight should be set after onload for data URLs
                    exportWidth = (img.naturalWidth && img.naturalWidth > 0) ? img.naturalWidth : (img.width || this.originalImageWidth);
                    exportHeight = (img.naturalHeight && img.naturalHeight > 0) ? img.naturalHeight : (img.height || this.originalImageHeight);
                  } else {
                    exportWidth = this.customImageWidth || this.originalImageWidth;
                    exportHeight = this.customImageHeight || this.originalImageHeight;
                  }
                  
                  canvas.width = exportWidth;
                  canvas.height = exportHeight;
                  // console.log(`[Export NFTs] Image loaded for NFT #${nftIndex} (${canvas.width}x${canvas.height}), drawing to canvas...`);
                  ctx.drawImage(img, 0, 0, exportWidth, exportHeight);
                  // console.log(`[Export NFTs] Converting canvas to blob for NFT #${nftIndex}...`);
                  canvas.toBlob((blob) => {
                    if (blob) {
                      const imageName = `${projectData.filenamePrefix || 'NFT'}_${String(nftIndex).padStart(String(totalSupply).length, '0')}.${imageExtension}`;
                      // Export image to shared images folder (only once, not per blockchain)
                      imagesFolder.file(imageName, blob);
                      // Store only essential data, not the full NFT object
                      // Use preserved traits and rarity_rank instead of nft.traits/nft.rarity_rank
                      // Ensure we have valid traits data - use empty array if null/undefined
                      const traitsToStore = (nftTraits && Array.isArray(nftTraits)) ? nftTraits : [];
                      chunkNFTs.push({ 
                        traits: traitsToStore, 
                        rarity_rank: nftRarityRank,
                        imageName, 
                        index: nftIndex, 
                        seed 
                      });
                      // console.log(`[Export NFTs] Image #${nftIndex} converted and added to ZIP`);
                      
                      // Update progress (don't show blockchain name for images since they're shared)
                      processedNFTs++;
                      processedNFTCount++; // Increment actual NFT count
                      this.updateExportProgress(processedNFTs, totalNFTsToExport, processedNFTCount, totalNFTsInBatches, exportStartTime, null, batch.batchNumber, nftIndex, false);
                      
                      // CRITICAL: Clear memory immediately after processing
                      // Clear canvas context and reset dimensions
                      try {
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        // Force canvas to release its memory
                        canvas.width = 1;
                        canvas.height = 1;
                        canvas.width = 0;
                        canvas.height = 0;
                      } catch(e) {
                        // Ignore errors during cleanup
                      }
                      
                      // Clear image and remove all references
                      try {
                        img.src = '';
                        img.onload = null;
                        img.onerror = null;
                        // Remove image from DOM if it was added
                        if (img.parentNode) {
                          img.parentNode.removeChild(img);
                        }
                      } catch(e) {
                        // Ignore errors during cleanup
                      }
                      
                      // Clear blob URL if it exists
                      try {
                        if (blob && blob.url) {
                          URL.revokeObjectURL(blob.url);
                        }
                      } catch(e) {
                        // Ignore errors during cleanup
                      }
                      
                      // Clear NFT image data to free memory
                      try {
                        if (nft && nft.imageData) {
                          // If imageData is a blob URL, revoke it
                          if (typeof nft.imageData === 'string' && nft.imageData.startsWith('blob:')) {
                            URL.revokeObjectURL(nft.imageData);
                          }
                          nft.imageData = null;
                        }
                        // Clear other NFT properties
                        if (nft.traits) nft.traits = null;
                        if (nft.canvas) nft.canvas = null;
                        if (nft.layers) nft.layers = null;
                      } catch(e) {
                        // Ignore errors during cleanup
                      }
                      
                      // Force garbage collection hint after each NFT
                      if (window.gc && i % 5 === 0) {
                        try {
                          window.gc();
                        } catch(e) {
                          // gc() may not be available
                        }
                      }
                    } else {
                      // console.error(`[Export NFTs] Failed to convert canvas to blob for NFT #${nftIndex}`);
                    }
                    resolve();
                  }, `image/${imageFormat === 'jpg' ? 'jpeg' : imageFormat}`, 1.0);
                } catch (e) {
                  clearTimeout(timeout);
                  // console.error(`[Export NFTs] Error processing image for NFT #${nftIndex}:`, e);
                  reject(e);
                }
              };
              img.onerror = (e) => {
                clearTimeout(timeout);
                // console.error(`[Export NFTs] Failed to load image for NFT #${nftIndex}:`, e);
                reject(new Error(`Failed to load image for NFT #${nftIndex}`));
              };
              img.src = nft.imageData;
            });
            
            // Clear NFT object and all references after processing
            try {
              if (nft) {
                if (nft.imageData) {
                  if (typeof nft.imageData === 'string' && nft.imageData.startsWith('blob:')) {
                    URL.revokeObjectURL(nft.imageData);
                  }
                  nft.imageData = null;
                }
                if (nft.traits) nft.traits = null;
                if (nft.canvas) {
                  nft.canvas.width = 0;
                  nft.canvas.height = 0;
                  nft.canvas = null;
                }
                if (nft.layers) nft.layers = null;
              }
              nft = null;
            } catch(e) {
              // Ignore cleanup errors
              nft = null;
            }
          }
          
          // Store metadata for this chunk (will be combined into one file per batch later)
          // We'll accumulate all NFTs from all chunks and create one metadata file per batch at the end
          
          // Add chunk NFTs to main array for tracking, then clear chunk
          allNFTs.push(...chunkNFTs);
          
          // Aggressively clear chunk data
          chunkNFTs.forEach(item => {
            if (item && item.traits) item.traits = null;
            if (item && item.seed) item.seed = null;
          });
          chunkNFTs.length = 0;
          
          // Memory cleanup after each chunk - critical for large collections
          if (window.gc) {
            try {
              window.gc();
              // Small delay to allow GC to complete
              await new Promise(resolve => setTimeout(resolve, 10));
            } catch(e) {
              // gc() may not be available
            }
          }
          
          // Force a small delay to allow memory to be freed
          await new Promise(resolve => setTimeout(resolve, 5));
          
          // Yield to browser after each chunk to help with background tab throttling
          await yieldToBrowser();
        }
        
        // console.log(`[Export NFTs] Completed exporting images for batch ${batch.batchNumber}`);
        
        // Add finished task for images
        addFinishedTask(`Batch ${batch.batchNumber}: Images exported (${batch.quantity} NFTs)`);
        
        // Memory cleanup after image generation
        if (window.gc) {
          try {
            window.gc();
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch(e) {
            // gc() may not be available
          }
        }
        
        // Export one combined metadata file per batch for each blockchain
        // Images are already exported once to the shared images folder
        // console.log(`[Export NFTs] Exporting combined metadata for batch ${batch.batchNumber}`);
        for (const blockchain of selectedBlockchains) {
          const blockchainFolder = projectFolder.folder(blockchain);
          
          // Get collection name for README file (same logic as in saveBatchZip)
          let collectionNameForReadme = '';
          const collectionNameInput = document.getElementById('collection-name');
          if (collectionNameInput && collectionNameInput.value && collectionNameInput.value.trim()) {
            collectionNameForReadme = collectionNameInput.value.trim();
          }
          if (!collectionNameForReadme) {
            collectionNameForReadme = projectData.name;
            if (!collectionNameForReadme || !collectionNameForReadme.trim()) {
              if (window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject && window.MemoryManager.state.currentProject.name) {
                collectionNameForReadme = window.MemoryManager.state.currentProject.name;
              }
              if ((!collectionNameForReadme || !collectionNameForReadme.trim()) && window.currentProject && window.currentProject.name) {
                collectionNameForReadme = window.currentProject.name;
              }
            }
          }
          if (!collectionNameForReadme || !collectionNameForReadme.trim()) {
            collectionNameForReadme = 'NFT_Collection';
          } else {
            collectionNameForReadme = collectionNameForReadme.trim();
          }
          collectionNameForReadme = collectionNameForReadme.replace(/[<>:"/\\|?*]/g, '_').replace(/\s+/g, '_');
          
          // Add README.txt file explaining the relative position between metadata and NFTs
          const readmeContent = `METADATA AND NFT IMAGES RELATIONSHIP
========================================

This folder contains metadata files for the ${blockchain} blockchain.

IMPORTANT: NFT images are stored in a shared location, not in this blockchain folder.

Folder Structure:
-----------------
${collectionNameForReadme}/
  ├── images/              (Shared folder - contains all NFT images)
  │   ├── NFT_0001.png
  │   ├── NFT_0002.png
  │   └── ...
  │
  └── ${blockchain}/        (This folder - contains metadata for ${blockchain})
      ├── NFT_Batch_01.json (or .csv)
      └── README.txt        (This file)

How to Use When Minting:
------------------------
1. The metadata files in this folder (${blockchain}/) reference images in the shared images/ folder.

2. The image path in each metadata entry is relative to the project root folder (${collectionNameForReadme}/).

3. Example metadata image path: "images/NFT_0001.png"
   This means: ${collectionNameForReadme}/images/NFT_0001.png

4. When uploading to a minting platform:
   - Upload all images from the images/ folder to your image hosting (IPFS, Arweave, etc.)
   - Update the metadata files to point to the hosted image URLs
   - Or keep the relative paths if your minting platform supports them

5. Each metadata file contains all NFTs for one batch. The metadata entries are in order:
   - First entry = First NFT in the batch
   - Second entry = Second NFT in the batch
   - And so on...

6. The NFT index number in the metadata name corresponds to the NFT's position in the collection,
   not necessarily the batch number.

Note: Images are exported once and shared across all blockchain metadata folders to save space.
Each blockchain folder only contains the metadata formatted for that specific blockchain.`;
          
          blockchainFolder.file('README.txt', readmeContent);
          
          // Check if "1 Metadata/NFT" toggle is enabled
          if (this.metadataPerNftEnabled) {
            // Export 1 metadata file per NFT
            for (const nftData of allNFTs) {
              const nftForMetadata = {
                traits: nftData.traits,
                rarity_rank: nftData.rarity_rank
              };
              const imagePath = `images/${nftData.imageName}`;
              const metadata = buildMetadata(blockchain, nftForMetadata, imagePath, nftData.index, nftData.seed);
              
              if (metadataFormat === 'json') {
                const metadataName = `${projectData.filenamePrefix || 'NFT'}_${String(nftData.index).padStart(String(totalSupply).length, '0')}.json`;
                blockchainFolder.file(metadataName, JSON.stringify(metadata, null, 2));
              } else if (metadataFormat === 'csv') {
                // Use generateCSVData helper function for consistency
                const csvContent = generateCSVData(blockchain, nftForMetadata, '', nftData.index, nftData.seed);
                const csvName = `${projectData.filenamePrefix || 'NFT'}_${String(nftData.index).padStart(String(totalSupply).length, '0')}.csv`;
                blockchainFolder.file(csvName, csvContent);
              }
              
              // Update progress for each metadata file (don't increment NFT count, only file count)
              processedNFTs++;
              this.updateExportProgress(processedNFTs, totalNFTsToExport, processedNFTCount, totalNFTsInBatches, exportStartTime, blockchain, batch.batchNumber, nftData.index, true);
            }
            
            // Add finished task for metadata (after all NFTs for this blockchain)
            addFinishedTask(`Batch ${batch.batchNumber}: Metadata exported for ${blockchain} (${allNFTs.length} files)`);
          } else {
            // Export 1 combined metadata file per batch (original behavior)
            // Update progress to show blockchain name when processing metadata
            if (allNFTs.length > 0) {
              this.updateExportProgress(processedNFTs, totalNFTsToExport, processedNFTCount, totalNFTsInBatches, exportStartTime, blockchain, batch.batchNumber, allNFTs[0].index, true);
            }
        
          if (metadataFormat === 'json') {
            // Create one JSON array with all NFTs in this batch for this blockchain
            const combinedMetadata = [];
            for (const nftData of allNFTs) {
              const nftForMetadata = {
                traits: nftData.traits,
                rarity_rank: nftData.rarity_rank
              };
              // Image path should reference the shared images folder (relative to project root)
              const imagePath = `images/${nftData.imageName}`;
              const metadata = buildMetadata(blockchain, nftForMetadata, imagePath, nftData.index, nftData.seed);
              combinedMetadata.push(metadata);
            }
            const metadataName = `${projectData.filenamePrefix || 'NFT'}_Batch_${String(batch.batchNumber).padStart(2, '0')}.json`;
            blockchainFolder.file(metadataName, JSON.stringify(combinedMetadata, null, 2));
          } else if (metadataFormat === 'csv') {
            // Create one CSV file with all NFTs in this batch for this blockchain
            let csvContent = 'Name,Description,Image';
            if (this.rarityRankEnabled) {
              csvContent += ',Rarity_Rank';
            }
            // Get all unique trait types from all NFTs in batch
            const traitTypes = new Set();
            allNFTs.forEach(nftData => {
              const attributes = formatAttributes({
                traits: nftData.traits,
                rarity_rank: nftData.rarity_rank
              });
              attributes.forEach(attr => {
                if (attr.trait_type) traitTypes.add(attr.trait_type);
              });
            });
            if (traitTypes.size > 0) {
              csvContent += ',' + Array.from(traitTypes).map(type => `Trait_${type.replace(/[^a-zA-Z0-9]/g, '_')}`).join(',');
            }
            csvContent += '\n';
            
            // Add rows for each NFT
            for (const nftData of allNFTs) {
              const nftForCSV = {
                traits: nftData.traits,
                rarity_rank: nftData.rarity_rank
              };
              const attributes = formatAttributes(nftForCSV);
              const personalDesc = nftData.seed ? getPersonalDescription(nftData.seed) : null;
              const description = personalDesc || projectData.defaultNftDescription || '';
              const nameBase = `${projectData.filenamePrefix || 'NFT'} #${String(nftData.index).padStart(String(totalSupply).length, '0')}`;
              // Image URL should be empty string until image is uploaded/hosted
              const imageUrl = '';
              
              csvContent += `"${nameBase}","${description.replace(/"/g, '""')}","${imageUrl}"`;
              if (this.rarityRankEnabled && typeof nftData.rarity_rank !== 'undefined') {
                csvContent += `,"${nftData.rarity_rank}"`;
              }
              // Add trait values in the same order as headers
              const traitMap = new Map();
              if (attributes && Array.isArray(attributes)) {
                attributes.forEach(attr => {
                  traitMap.set(attr.trait_type, attr.value);
                });
              }
              Array.from(traitTypes).forEach(traitType => {
                const value = traitMap.get(traitType) || '';
                csvContent += `,"${value.replace(/"/g, '""')}"`;
              });
              csvContent += '\n';
            }
            
            const csvName = `${projectData.filenamePrefix || 'NFT'}_Batch_${String(batch.batchNumber).padStart(2, '0')}.csv`;
            blockchainFolder.file(csvName, csvContent);
          }
          
          // Update progress for combined metadata file (don't increment NFT count, only file count)
          processedNFTs++;
          this.updateExportProgress(processedNFTs, totalNFTsToExport, processedNFTCount, totalNFTsInBatches, exportStartTime, blockchain, batch.batchNumber, allNFTs.length > 0 ? allNFTs[0].index : 0, true);
          
          // Add finished task for metadata (after each blockchain)
          addFinishedTask(`Batch ${batch.batchNumber}: Metadata exported for ${blockchain} (1 combined file)`);
          }
        }
        
        // Clear allNFTs after metadata export
        allNFTs.forEach(item => {
          if (item && item.traits) item.traits = null;
          if (item && item.seed) item.seed = null;
        });
        allNFTs.length = 0;
        
        // Memory cleanup after all blockchains for this batch
      if (window.gc) {
        try {
          window.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch(e) {
          // gc() may not be available
        }
      }
      
      // Save this batch's ZIP file immediately
      if (progressPopup && !isExportCancelled) {
        const statusEl = progressPopup.querySelector('#export-status');
        if (statusEl) {
          statusEl.innerHTML = `Saving Batch ${batch.batchNumber}<span class="saving-dots"><span>.</span><span>.</span><span>.</span></span>`;
        }
      }
      
      try {
        await saveBatchZip(zip, batch.batchNumber, selectedBlockchains, batchesToExport.length, saveDirectoryHandle);
        
        // Clear ZIP from memory after saving
        zip.remove();
        
        // Removed "Batch X exported successfully" task - only showing Images and Metadata tasks
        exportResults.successes.push(`Batch ${batch.batchNumber} exported successfully`);
        
        if (progressPopup && !isExportCancelled) {
          const statusEl = progressPopup.querySelector('#export-status');
          if (statusEl) {
            statusEl.textContent = `Batch ${batch.batchNumber} saved successfully`;
          }
        }
        
        // Small delay before next batch - yield to browser to help with scheduling
        await yieldToBrowser();
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        // Check if error is related to HD space (QuotaExceededError, disk space, etc.)
        const isHDSpaceError = error.name === 'QuotaExceededError' || 
                               error.message.toLowerCase().includes('quota') || 
                               error.message.toLowerCase().includes('space') || 
                               error.message.toLowerCase().includes('disk') ||
                               error.message.toLowerCase().includes('storage') ||
                               error.message.toLowerCase().includes('insufficient');
        
        // Create appropriate error message
        let errorMsg;
        if (isHDSpaceError) {
          errorMsg = `Batch ${batch.batchNumber} failed: Insufficient disk space. Please free up space and try again.`;
        } else {
          errorMsg = `Failed to save Batch ${batch.batchNumber}: ${error.message}`;
        }
        
        exportResults.errors.push(errorMsg);
        addFinishedTask(errorMsg);
        
        // Update status to show the error
        if (progressPopup && !isExportCancelled) {
          const statusEl = progressPopup.querySelector('#export-status');
          if (statusEl) {
            statusEl.textContent = `Batch ${batch.batchNumber} failed: ${isHDSpaceError ? 'Insufficient disk space' : error.message}`;
            statusEl.style.color = isHDSpaceError ? '#f39c12' : '#e74c3c';
          }
        }
        
        // Show notification (non-blocking, so export continues)
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            isHDSpaceError ? `Warning: Batch ${batch.batchNumber} failed due to insufficient disk space. Export will continue with remaining batches.` : `Warning: ${errorMsg}`,
            'warning',
            5000
          );
        }
        
        // Continue processing next batch (don't throw, just log and continue)
        // Small delay before next batch to allow user to see the error
        await yieldToBrowser();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Memory cleanup after saving batch
      if (window.gc) {
        try {
          window.gc();
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch(e) {
          // gc() may not be available
        }
      }
    }
    
    // Clear seedList reference after all batches
    seedList = null;

      // All batches have been processed and saved
      // Update progress to show completion
      if (progressPopup && !isExportCancelled) {
        const percentageEl = progressPopup.querySelector('#export-percentage');
        const statusEl = progressPopup.querySelector('#export-status');
        const titleEl = progressPopup.querySelector('.scan-title');
        
        if (percentageEl) percentageEl.innerHTML = '100%';
        if (statusEl) {
          const successCount = exportResults.successes.length;
          const errorCount = exportResults.errors.length;
          if (errorCount === 0) {
            statusEl.textContent = `✓ Export completed successfully! ${successCount} batch${successCount !== 1 ? 'es' : ''} exported.`;
            statusEl.style.color = '#27ae60';
          } else {
            statusEl.textContent = `Export completed with ${errorCount} error${errorCount !== 1 ? 's' : ''}. ${successCount} batch${successCount !== 1 ? 'es' : ''} exported successfully.`;
            statusEl.style.color = '#f39c12';
          }
        }
        
        // Update popup title to show completion
        if (titleEl) {
          titleEl.textContent = 'Export Completed!';
          titleEl.style.color = '#40ff00';
        }
        
        // Display total export time when export is complete
        const etaEl = progressPopup.querySelector('#export-eta');
        if (etaEl) {
          const exportEndTime = Date.now();
          const totalTimeMs = exportEndTime - exportStartTime;
          
          // Format total time
          let timeText = '';
          if (totalTimeMs < 60000) {
            const seconds = Math.round(totalTimeMs / 1000);
            timeText = `Total time: ${seconds} second${seconds !== 1 ? 's' : ''}`;
          } else if (totalTimeMs < 3600000) {
            const minutes = Math.floor(totalTimeMs / 60000);
            const seconds = Math.round((totalTimeMs % 60000) / 1000);
            if (seconds > 0) {
              timeText = `Total time: ${minutes} minute${minutes !== 1 ? 's' : ''} ${seconds} second${seconds !== 1 ? 's' : ''}`;
            } else {
              timeText = `Total time: ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            }
          } else {
            const hours = Math.floor(totalTimeMs / 3600000);
            const minutes = Math.round((totalTimeMs % 3600000) / 60000);
            if (minutes > 0) {
              timeText = `Total time: ${hours} hour${hours !== 1 ? 's' : ''} ${minutes} minute${minutes !== 1 ? 's' : ''}`;
            } else {
              timeText = `Total time: ${hours} hour${hours !== 1 ? 's' : ''}`;
            }
          }
          etaEl.textContent = timeText;
        }
        
        // Summary removed - errors are displayed in Finished Tasks with red color and X symbol
      }

      // Don't hide progress popup - let user close it manually after reviewing the log
      // The popup will stay visible until user clicks "Close" button
      
      if (window.NFTApp.getModule('notificationService')) {
        const successCount = exportResults.successes.length;
        const errorCount = exportResults.errors.length;
        let message = `Export completed: ${successCount} success${successCount !== 1 ? 'es' : ''}`;
        if (errorCount > 0) {
          message += `, ${errorCount} error${errorCount !== 1 ? 's' : ''}`;
        }
        window.NFTApp.getModule('notificationService').show(
          message,
          errorCount > 0 ? 'warning' : 'success',
          5000
        );
      }
    } catch (error) {
      // console.error('[Export NFTs] Export error:', error);
      // console.error('[Export NFTs] Error stack:', error.stack);
      
      // Check if this is a cancellation (not a real error) - check BEFORE using exportResults
      const isCancellation = error.message && error.message.includes("Export cancelled by user");
      
      if (isCancellation) {
        // Hide progress popup if it was shown
        this.hideExportProgressPopup();
        
        // Hide loading overlay
        try {
          if (window.NFTApp.getModule('projectService')) {
            window.NFTApp.getModule('projectService').hideLoadingAnimation();
          }
        } catch(e) {
          // console.error("[Export NFTs] Error hiding loading animation:", e);
        }
        
        // Show cancellation message
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            'Export cancelled by user',
            'info',
            3000
          );
        }
      } else {
        // Only add to exportResults if it exists (it should be initialized early now)
        if (exportResults) {
          exportResults.errors.push(`Export failed: ${error.message}`);
          
          // Show final log even on error
          const progressPopup = document.getElementById('export-progress-popup');
          if (progressPopup) {
            // Summary removed - errors are displayed in Finished Tasks with red color and X symbol
          }
        }
        
        // Hide loading overlay in case of error
        try {
          if (window.NFTApp.getModule('projectService')) {
            window.NFTApp.getModule('projectService').hideLoadingAnimation();
          }
        } catch(e) {
          // console.error("[Export NFTs] Error hiding loading animation:", e);
        }
        
        // Show error notification for actual errors
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule('notificationService')) {
          window.NFTApp.getModule('notificationService').show(
            `Export failed: ${error.message || "Unknown error"}`,
            'error',
            5000
          );
        } else {
          // Fallback to alert if notification service not available
          alert(`Export failed: ${error.message || "Unknown error"}`);
        }
      }
    } finally {
      // Cleanup visibility change listener
      if (typeof cleanupVisibilityListener === 'function') {
        cleanupVisibilityListener();
      }
      
      // Always reset exporting flag
      // console.log("[Export NFTs] Resetting isExporting flag");
      this.isExporting = false;
      
      // Don't hide progress popup here - let user close it manually after reviewing the log
      // The popup will be hidden when user clicks "Close" button
      
      // Re-enable the button by checking its state
      this.checkExportButtonState();
      
      // Hide loading overlay - ensure it's always hidden
      try {
        if (window.NFTApp.getModule('projectService')) {
          window.NFTApp.getModule('projectService').hideLoadingAnimation();
        }
      } catch(e) {
        // console.error("Error hiding loading animation via module:", e);
      }
      
      // Fallback: hide directly regardless of module
      try {
        const loadingOverlay = document.getElementById("loading-overlay");
        if (loadingOverlay) {
          loadingOverlay.style.display = "none";
          loadingOverlay.style.visibility = "hidden";
          loadingOverlay.style.opacity = "0";
        }
        const nftLoadingOverlay = document.getElementById("nft-loading-overlay");
        if (nftLoadingOverlay) {
          nftLoadingOverlay.style.display = "none";
          nftLoadingOverlay.style.visibility = "hidden";
          nftLoadingOverlay.style.opacity = "0";
        }
      } catch(e) {
        // console.error("Error hiding loading overlay directly:", e);
      }
    }
  },

  // Show export progress popup
  showExportProgressPopup: function(totalNFTs, numBlockchains, numBatches, batchesToExport, exportOption) {
    // Remove existing popup if any
    this.hideExportProgressPopup();
    
    // Determine popup title based on export option
    let popupTitle = 'Exporting NFTs'; // Default
    if (exportOption === 'export-option-nfts-metadata') {
      popupTitle = 'Exporting NFTs / Metadata';
    } else if (exportOption === 'export-option-nfts-only') {
      popupTitle = 'Exporting NFTs';
    } else if (exportOption === 'export-option-metadata-only') {
      popupTitle = 'Exporting Metadata';
    }
    
    const popup = document.createElement('div');
    popup.id = 'export-progress-popup';
    popup.className = 'scan-progress-popup';
    popup.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: #2c3e50; padding: 30px 40px; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 10002; min-width: 500px; max-width: 700px; max-height: 80vh; overflow-y: auto; text-align: center; font-family: "Archivo", sans-serif;';
    
    // Create finished tasks list HTML
    let finishedTasksHTML = '';
    if (batchesToExport && batchesToExport.length > 0) {
      finishedTasksHTML = `
        <div style="margin-top: 20px; margin-bottom: 15px; text-align: left;">
          <div style="font-size: 14px; font-weight: 600; color: #ffffff; margin-bottom: 10px;">Finished Tasks:</div>
          <div id="export-finished-tasks" style="max-height: 200px; overflow-y: auto; font-size: 12px; background: rgba(0, 0, 0, 0.2); border: 1px solid #34495e; border-radius: 8px; padding: 12px;">
            <!-- Finished tasks will be added here -->
          </div>
        </div>
      `;
    }
    
    popup.innerHTML = `
      <div class="scan-title-container" style="text-align: center; margin-bottom: 20px;">
        <div class="scan-title" style="font-size: 18px; font-weight: 600; margin-bottom: 5px;">${popupTitle}</div>
        <div class="scan-subtitle" style="font-size: 14px; color: #95a5a6; text-align: center; display: inline-block; width: auto;">(${numBlockchains} blockchain${numBlockchains > 1 ? 's' : ''}, ${numBatches} batch${numBatches > 1 ? 'es' : ''})</div>
      </div>
      <div class="scan-percentage" id="export-percentage" style="font-size: 32px; font-weight: 700; color: #3498db; margin-bottom: 15px;">
        0%<span class="scan-dots">
          <span></span>
          <span></span>
          <span></span>
        </span>
      </div>
      <div class="scan-progress-info" style="font-size: 14px; color: #ffffff; margin-bottom: 10px;">
        Processing: <span id="export-processed">0</span> / <span id="export-total">${totalNFTs}</span>
      </div>
      <div id="export-status" style="font-size: 13px; color: #ffffff; margin-bottom: 15px; min-height: 20px;">
        Starting export...
      </div>
      <div class="scan-counts-container" style="margin-bottom: 20px;">
        <div style="color: #27ae60; font-size: 16px; font-weight: 500;">
          <span id="export-completed">0</span> NFTs exported
        </div>
      </div>
      <div id="export-eta" style="font-size: 13px; color: #ffffff; margin-bottom: 20px; min-height: 20px;">
        Calculating time remaining...
      </div>
      ${finishedTasksHTML}
      <div id="export-final-log" style="display: none; margin-top: 20px; text-align: left;">
        <!-- Final log will be added here -->
      </div>
      <button class="scan-cancel-btn" id="cancel-export-btn" style="margin-top: 20px;">Cancel</button>
      <button class="scan-cancel-btn" id="close-export-log-btn" style="display: none; margin-top: 10px; background: #27ae60;">Close</button>
    `;
    
    document.body.appendChild(popup);
    // console.log('[Export NFTs] Export progress popup created');
    
    // Make popup draggable
    let isDragging = false;
    let currentX, currentY, initialX, initialY, xOffset = 0, yOffset = 0;
    
    const dragArea = popup.querySelector('.scan-title-container');
    if (dragArea) {
      dragArea.style.cursor = 'move';
      
      dragArea.addEventListener('mousedown', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        if (e.target === dragArea || dragArea.contains(e.target)) {
          isDragging = true;
          popup.style.cursor = 'grabbing';
        }
      });
      
      document.addEventListener('mousemove', (e) => {
        if (isDragging) {
          e.preventDefault();
          currentX = e.clientX - initialX;
          currentY = e.clientY - initialY;
          xOffset = currentX;
          yOffset = currentY;
          
          popup.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
        }
      });
      
      document.addEventListener('mouseup', () => {
        if (isDragging) {
          isDragging = false;
          popup.style.cursor = 'default';
        }
      });
    }
    
    return popup;
  },

  // Update export progress popup
  updateExportProgress: function(processed, total, processedNFTCount, totalNFTCount, startTime, blockchain, batchNum, nftIndex, isMetadata) {
    const popup = document.getElementById('export-progress-popup');
    if (!popup) return;
    
    // Use actual NFT count for percentage calculation (more accurate than file count)
    // This gives a more accurate representation of progress
    let percentage = 0;
    if (totalNFTCount && totalNFTCount > 0) {
      percentage = Math.max(0, Math.min(100, (processedNFTCount / totalNFTCount) * 100));
    } else if (total && total > 0) {
      // Fallback to file count if NFT count not available
      percentage = Math.max(0, Math.min(100, (processed / total) * 100));
    }
    
    const percentageEl = popup.querySelector('#export-percentage');
    const processedEl = popup.querySelector('#export-processed');
    const totalEl = popup.querySelector('#export-total');
    const completedEl = popup.querySelector('#export-completed');
    const statusEl = popup.querySelector('#export-status');
    const etaEl = popup.querySelector('#export-eta');
    
    if (percentageEl) {
      if (percentage < 100) {
        // Show percentage with 2 decimal places, using truncation instead of rounding
        // This prevents showing 3.5% when it's actually 3.48% (348/10000)
        // Truncate to 2 decimal places: multiply by 100, floor it, divide by 100
        const displayPercentage = (Math.floor(percentage * 100) / 100).toFixed(2);
        
        // Only update the percentage text without refreshing the dots animation
        // Check if dots span already exists
        const dotsSpan = percentageEl.querySelector('.scan-dots');
        
        if (!dotsSpan) {
          // First time: create the structure with dots
          percentageEl.innerHTML = `${displayPercentage}%<span class="scan-dots"><span></span><span></span><span></span></span>`;
        } else {
          // Update only the percentage text, keep dots animation running
          // The structure is: text node (percentage) + dots span
          // Find and update the text node (should be the first child)
          let textNode = null;
          
          // Try to find the text node - it should be before the dots span
          for (let i = 0; i < percentageEl.childNodes.length; i++) {
            const node = percentageEl.childNodes[i];
            if (node.nodeType === Node.TEXT_NODE) {
              textNode = node;
              break;
            }
          }
          
          if (textNode) {
            // Update existing text node
            textNode.textContent = `${displayPercentage}%`;
          } else {
            // No text node found, create one before the dots span
            const newTextNode = document.createTextNode(`${displayPercentage}%`);
            percentageEl.insertBefore(newTextNode, dotsSpan);
          }
        }
      } else {
        percentageEl.innerHTML = '100%';
      }
    }
    
    // Display actual NFT count, not file count
    if (processedEl) processedEl.textContent = processedNFTCount || processed;
    if (totalEl && totalNFTCount) totalEl.textContent = totalNFTCount;
    if (completedEl) completedEl.textContent = processedNFTCount || processed;
    if (statusEl) {
      // Only show blockchain name when processing metadata (not when processing images)
      if (isMetadata && blockchain) {
      statusEl.textContent = `Processing: ${blockchain} - Batch ${batchNum} - NFT #${nftIndex}`;
      } else {
        statusEl.textContent = `Processing: Batch ${batchNum} - NFT #${nftIndex}`;
      }
    }
    
    // Calculate ETA based on actual NFT count (not file count)
    // Update ETA more frequently for better accuracy
    if (etaEl && processedNFTCount > 0 && totalNFTCount && processedNFTCount < totalNFTCount) {
      const now = Date.now();
      const timeSinceLastUpdate = now - (this.exportLastUpdateTime || startTime);
      const nftsSinceLastUpdate = processedNFTCount - (this.exportLastProcessedCount || 0);
      
      // Update ETA more frequently - every time we have new data (not just at milestones)
      // But only if we have meaningful progress (at least 1 NFT processed since last update, or 500ms has passed)
      const shouldUpdateETA = nftsSinceLastUpdate > 0 || timeSinceLastUpdate > 500;
      
      if (shouldUpdateETA) {
        // Store recent processing rate (NFTs per millisecond)
        if (nftsSinceLastUpdate > 0 && timeSinceLastUpdate > 0) {
          const recentRate = nftsSinceLastUpdate / timeSinceLastUpdate; // NFTs per ms
          this.exportRecentTimes.push(recentRate);
          
          // Keep only last 10 samples for moving average (more samples = more stable)
          if (this.exportRecentTimes.length > 10) {
            this.exportRecentTimes.shift();
          }
        }
        
        // Calculate average rate using moving average (weight recent samples more)
        let avgRate = 0;
        if (this.exportRecentTimes.length > 0) {
          // Use exponential moving average: more recent samples have exponentially higher weight
          // This gives better responsiveness while still being stable
          let weightedSum = 0;
          let totalWeight = 0;
          const decayFactor = 0.7; // Higher = more weight to recent samples
          
          this.exportRecentTimes.forEach((rate, index) => {
            const weight = Math.pow(decayFactor, this.exportRecentTimes.length - 1 - index);
            weightedSum += rate * weight;
            totalWeight += weight;
          });
          avgRate = weightedSum / totalWeight;
        } else {
          // Fallback: use overall average if no recent samples yet
          const elapsed = now - startTime;
          if (elapsed > 0) {
            avgRate = processedNFTCount / elapsed;
          }
        }
        
        // Only calculate ETA if we have a valid rate
        if (avgRate > 0) {
          const remaining = totalNFTCount - processedNFTCount;
          const etaMs = remaining / avgRate;
          
          // Update tracking variables
          this.exportLastUpdateTime = now;
          this.exportLastProcessedCount = processedNFTCount;
          
          // Format and display ETA
          if (etaMs < 60000) {
            const seconds = Math.max(1, Math.round(etaMs / 1000));
            etaEl.textContent = `ETA: ~${seconds} second${seconds !== 1 ? 's' : ''}`;
          } else if (etaMs < 3600000) {
            const minutes = Math.max(1, Math.round(etaMs / 60000));
            etaEl.textContent = `ETA: ~${minutes} minute${minutes !== 1 ? 's' : ''}`;
          } else {
            const hours = Math.floor(etaMs / 3600000);
            const minutes = Math.max(0, Math.round((etaMs % 3600000) / 60000));
            if (minutes > 0) {
              etaEl.textContent = `ETA: ~${hours}h ${minutes}m`;
            } else {
              etaEl.textContent = `ETA: ~${hours} hour${hours !== 1 ? 's' : ''}`;
            }
          }
        } else {
          // Not enough data yet
          etaEl.textContent = 'Calculating ETA...';
        }
      }
    } else if (etaEl && processedNFTCount >= totalNFTCount) {
      // Don't show "Completing..." - export is already complete
      etaEl.textContent = '';
    } else if (etaEl && processedNFTCount === 0) {
      etaEl.textContent = 'Starting...';
    }
  },

  // Hide export progress popup
  hideExportProgressPopup: function() {
    const popup = document.getElementById('export-progress-popup');
    if (popup) {
      popup.remove();
      // console.log('[Export NFTs] Export progress popup removed');
    }
  },

  // Update module state from toggle
  updateStateFromToggle: function(toggle) {
    const id = toggle.id;
    
    if (id === "jpg-toggle") {
      this.imageFormat.jpg = toggle.classList.contains("active");
      this.checkExportButtonState();
    } else if (id === "png-toggle") {
      this.imageFormat.png = toggle.classList.contains("active");
      this.checkExportButtonState();
    } else if (id === "json-toggle") {
      this.metadataFormat.json = toggle.classList.contains("active");
      this.checkExportButtonState();
    } else if (id === "csv-toggle") {
      this.metadataFormat.csv = toggle.classList.contains("active");
      this.checkExportButtonState();
    } else if (id === "metadata.rarity.rank") {
      this.rarityRankEnabled = toggle.classList.contains("active");
    } else if (id === "metadata.per.nft") {
      this.metadataPerNftEnabled = toggle.classList.contains("active");
    } else if (this.blockchainToggles.hasOwnProperty(id)) {
      this.blockchainToggles[id] = toggle.classList.contains("active");
      // Check export button state when blockchain toggles change
      this.checkExportButtonState();
      // Save state when toggle changes
      this.saveState();
    }
    
    // Save state for all toggle changes
    this.saveState();
  },

  // Handle Apply Batches button
  handleApplyBatches: function() {
    const input = document.getElementById("num-batches-input");
    if (!input) return;

    let numBatches = parseInt(input.value);
    
    if (isNaN(numBatches) || numBatches < 1) {
      // Show styled notification instead of alert
      if (window.NFTApp && window.NFTApp.modules && window.NFTApp.modules.confirmationModal) {
        window.NFTApp.modules.confirmationModal.show(
          "Invalid Batch Count",
          "Minimum 1 batch required.",
          "",
          () => {},
          { singleButton: true, confirmText: "OK" }
        );
      } else {
      alert("Minimum 1 batch required");
      }
      input.value = "1";
      numBatches = 1;
    } else if (numBatches > 20) {
      // Show styled notification instead of alert
      if (window.NFTApp && window.NFTApp.modules && window.NFTApp.modules.confirmationModal) {
        window.NFTApp.modules.confirmationModal.show(
          "Maximum Batches Exceeded",
          "Maximum 20 batches allowed.",
          "",
          () => {},
          { singleButton: true, confirmText: "OK" }
        );
      } else {
      alert("Maximum 20 batches allowed");
      }
      input.value = "20";
      numBatches = 20;
    }

    // Save current selection state before changing numBatches
    const previousNumBatches = this.numBatches;
    
    // Preserve selection state in batchData BEFORE rendering
    // This ensures cards are created with correct state, preventing blinking
    for (let i = 1; i <= previousNumBatches; i++) {
      const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
      if (selectToExportToggle && selectToExportToggle.classList.contains("active")) {
        // Update batchData to preserve selection state
        if (!this.batchData[i]) {
          this.batchData[i] = {};
        }
        this.batchData[i].selectToExport = true;
      } else {
        // Only clear if batch is being deactivated (i > numBatches)
        // Otherwise preserve the current state
        if (i <= numBatches) {
          if (!this.batchData[i]) {
            this.batchData[i] = {};
          }
          // Only update if we're sure it should be deselected
          if (this.batchData[i].selectToExport === undefined) {
            this.batchData[i].selectToExport = false;
          }
        }
      }
    }

    this.numBatches = numBatches;
    this.renderBatchCards();
    
    // Check export button state after rendering
      this.checkExportButtonState();
    
    // Automatically distribute total supply evenly among active batches
    this.distributeTotalSupply();
    
    // Validate against maximum limit after applying batches
    this.validateBatchQuantities();
    
    // Check export button state after applying batches
    this.checkExportButtonState();
    
    // Save state after applying batches
    this.saveState();
  },

  // Enforce correct sizes for batch and blockchain management sections
  enforceSectionSizes: function() {
    const batchSection = document.getElementById("batch-management-section");
    if (batchSection) {
      batchSection.style.setProperty("width", "921px", "important");
      batchSection.style.setProperty("height", "364px", "important");
      batchSection.style.setProperty("min-width", "921px", "important");
      batchSection.style.setProperty("max-width", "921px", "important");
      batchSection.style.setProperty("min-height", "364px", "important");
      batchSection.style.setProperty("max-height", "364px", "important");
      batchSection.style.setProperty("margin-right", "0", "important");
    }
    
    const blockchainSection = document.getElementById("blockchain-management-section");
    if (blockchainSection) {
      blockchainSection.style.setProperty("width", "921px", "important");
      blockchainSection.style.setProperty("height", "172px", "important");
      blockchainSection.style.setProperty("min-width", "921px", "important");
      blockchainSection.style.setProperty("max-width", "921px", "important");
      blockchainSection.style.setProperty("min-height", "172px", "important");
      blockchainSection.style.setProperty("max-height", "172px", "important");
    }
    
    const utilitiesSection = document.getElementById("utilities-section");
    if (utilitiesSection) {
      utilitiesSection.style.setProperty("width", "256px", "important");
      utilitiesSection.style.setProperty("height", "556px", "important");
      utilitiesSection.style.setProperty("min-width", "256px", "important");
      utilitiesSection.style.setProperty("max-width", "256px", "important");
      utilitiesSection.style.setProperty("min-height", "556px", "important");
      utilitiesSection.style.setProperty("max-height", "556px", "important");
      utilitiesSection.style.setProperty("margin-left", "0", "important");
    }
    
    const exportNftsMetadataOptions = document.getElementById("export-nfts-metadata-options");
    if (exportNftsMetadataOptions) {
      exportNftsMetadataOptions.style.setProperty("width", "174px", "important");
      exportNftsMetadataOptions.style.setProperty("height", "128px", "important");
      exportNftsMetadataOptions.style.setProperty("min-width", "174px", "important");
      exportNftsMetadataOptions.style.setProperty("max-width", "174px", "important");
      exportNftsMetadataOptions.style.setProperty("min-height", "128px", "important");
      exportNftsMetadataOptions.style.setProperty("max-height", "128px", "important");
    }
    
    // Enforce sizes for left column containers
    const imageFormatContainer = document.getElementById("image-format-export-form-container-left");
    if (imageFormatContainer) {
      imageFormatContainer.style.setProperty("width", "248px", "important");
      imageFormatContainer.style.setProperty("height", "108px", "important");
      imageFormatContainer.style.setProperty("min-width", "248px", "important");
      imageFormatContainer.style.setProperty("max-width", "248px", "important");
      imageFormatContainer.style.setProperty("min-height", "108px", "important");
      imageFormatContainer.style.setProperty("max-height", "108px", "important");
    }
    
    const metadataFormatContainer = document.getElementById("metadata-format-export-form-container-right");
    if (metadataFormatContainer) {
      metadataFormatContainer.style.setProperty("width", "248px", "important");
      metadataFormatContainer.style.setProperty("height", "108px", "important");
      metadataFormatContainer.style.setProperty("min-width", "248px", "important");
      metadataFormatContainer.style.setProperty("max-width", "248px", "important");
      metadataFormatContainer.style.setProperty("min-height", "108px", "important");
      metadataFormatContainer.style.setProperty("max-height", "108px", "important");
    }
    
    const numberOfBatchesSection = document.getElementById("number-of-batches-section");
    if (numberOfBatchesSection) {
      numberOfBatchesSection.style.setProperty("width", "248px", "important");
      numberOfBatchesSection.style.setProperty("height", "108px", "important");
      numberOfBatchesSection.style.setProperty("min-width", "248px", "important");
      numberOfBatchesSection.style.setProperty("max-width", "248px", "important");
      numberOfBatchesSection.style.setProperty("min-height", "108px", "important");
      numberOfBatchesSection.style.setProperty("max-height", "108px", "important");
      numberOfBatchesSection.style.setProperty("transition", "none", "important");
      numberOfBatchesSection.style.setProperty("transform", "none", "important");
      numberOfBatchesSection.style.setProperty("animation", "none", "important");
    }
    
    const exportNftsMetadata = document.getElementById("export-nfts-metadata");
    if (exportNftsMetadata) {
      exportNftsMetadata.style.setProperty("width", "248px", "important");
      exportNftsMetadata.style.setProperty("height", "172px", "important");
      exportNftsMetadata.style.setProperty("min-width", "248px", "important");
      exportNftsMetadata.style.setProperty("max-width", "248px", "important");
      exportNftsMetadata.style.setProperty("min-height", "172px", "important");
      exportNftsMetadata.style.setProperty("max-height", "172px", "important");
      exportNftsMetadata.style.setProperty("transition", "none", "important");
      exportNftsMetadata.style.setProperty("transform", "none", "important");
      exportNftsMetadata.style.setProperty("animation", "none", "important");
    }
    
    const leftColumn = document.getElementById("export-nfts-form-column-left");
    if (leftColumn) {
      leftColumn.style.setProperty("width", "248px", "important");
      leftColumn.style.setProperty("height", "593px", "important");
      leftColumn.style.setProperty("min-width", "248px", "important");
      leftColumn.style.setProperty("max-width", "248px", "important");
      leftColumn.style.setProperty("min-height", "593px", "important");
      leftColumn.style.setProperty("max-height", "593px", "important");
    }
    
    const rightColumn = document.getElementById("export-nfts-form-column-right");
    if (rightColumn) {
      rightColumn.style.setProperty("width", "1128px", "important");
      rightColumn.style.setProperty("height", "593px", "important");
      rightColumn.style.setProperty("min-width", "1128px", "important");
      rightColumn.style.setProperty("max-width", "1128px", "important");
      rightColumn.style.setProperty("min-height", "593px", "important");
      rightColumn.style.setProperty("max-height", "593px", "important");
      rightColumn.style.setProperty("margin-left", "0px", "important");
    }
    
    const formContainer = document.getElementById("export-nfts-form-container");
    if (formContainer) {
      formContainer.style.setProperty("height", "630px", "important");
      formContainer.style.setProperty("min-height", "630px", "important");
      formContainer.style.setProperty("max-height", "630px", "important");
    }
  },

  // Render batch cards with pagination support
  renderBatchCards: function() {
    const batchManagementContainer = document.getElementById("batch-management-section");
    
    if (!batchManagementContainer) return;

    // Clear existing batch cards and collection size rectangle (keep header wrapper)
    const existingCards = batchManagementContainer.querySelectorAll(".batch-card");
    existingCards.forEach(card => card.remove());
    const existingCollectionSize = document.getElementById("collection-size-display");
    const collectionSizePlaceholder = document.getElementById("collection-size-display-placeholder");
    
    // Create or update collection size rectangle inside header wrapper
    // Use getTotalSupply() to get the actual total supply, or 0 if no project
    const totalSupply = this.getTotalSupply() || 0;
    let collectionSizeRect = existingCollectionSize;
    
    if (!collectionSizeRect && collectionSizePlaceholder) {
      collectionSizeRect = document.createElement("div");
      collectionSizeRect.id = "collection-size-display";
      collectionSizeRect.style.gridColumn = "1"; // Align with batch card 01 (column 1)
      collectionSizeRect.style.justifySelf = "start"; // Align to start of column
      collectionSizePlaceholder.replaceWith(collectionSizeRect);
    } else if (collectionSizeRect && collectionSizePlaceholder) {
      // Move existing to placeholder location
      collectionSizeRect.style.gridColumn = "1"; // Align with batch card 01 (column 1)
      collectionSizeRect.style.justifySelf = "start"; // Align to start of column
      collectionSizePlaceholder.replaceWith(collectionSizeRect);
    } else if (!collectionSizeRect) {
      // Create new one and find header wrapper
      const headerWrapper = document.getElementById("batch-header-wrapper");
      if (headerWrapper) {
        collectionSizeRect = document.createElement("div");
        collectionSizeRect.id = "collection-size-display";
        collectionSizeRect.style.gridColumn = "1"; // Align with batch card 01 (column 1)
        collectionSizeRect.style.justifySelf = "start"; // Align to start of column
        // Insert before nfts-per-batch (Collection Size comes first)
        const nftsPerBatch = document.getElementById("nfts-per-batch");
        if (nftsPerBatch) {
          headerWrapper.insertBefore(collectionSizeRect, nftsPerBatch);
        } else {
          // If nfts-per-batch doesn't exist, append to start
          headerWrapper.insertBefore(collectionSizeRect, headerWrapper.firstChild);
        }
      }
    }
    
    if (collectionSizeRect) {
      collectionSizeRect.style.width = "161.39px";
      collectionSizeRect.style.height = "30px";
      collectionSizeRect.style.minWidth = "161.39px";
      collectionSizeRect.style.maxWidth = "161.39px";
      collectionSizeRect.style.minHeight = "30px";
      collectionSizeRect.style.maxHeight = "30px";
      collectionSizeRect.style.border = "2px solid #666666"; // Grey border, same thickness as batch cards
      collectionSizeRect.style.borderRadius = "8px"; // Same rounded borders as batch cards
      collectionSizeRect.style.background = "#111111";
      collectionSizeRect.style.display = "flex";
      collectionSizeRect.style.alignItems = "center";
      collectionSizeRect.style.justifyContent = "center";
      collectionSizeRect.style.fontSize = "12px";
      collectionSizeRect.style.fontWeight = "600";
      collectionSizeRect.style.color = "var(--text-primary)";
      collectionSizeRect.style.padding = "4px 8px";
      collectionSizeRect.style.boxSizing = "border-box";
      
      // Format number with commas, only show if totalSupply > 0
      if (totalSupply > 0) {
        const formattedTotalSupply = totalSupply.toLocaleString('en-US');
        collectionSizeRect.textContent = `Collection Size: ${formattedTotalSupply}`;
      } else {
        collectionSizeRect.textContent = `Collection Size: 0`;
      }
    }

    // Create "SELECT ALL BATCHES" toggle button (aligned with batch card #12, column 2)
    const headerWrapper = document.getElementById("batch-header-wrapper");
    if (headerWrapper) {
      let selectAllBatchesToggle = document.getElementById("select-all-batches-toggle");
      
      if (!selectAllBatchesToggle) {
        selectAllBatchesToggle = document.createElement("button");
        selectAllBatchesToggle.id = "select-all-batches-toggle";
        selectAllBatchesToggle.type = "button";
        selectAllBatchesToggle.textContent = "SELECT ALL BATCHES";
        selectAllBatchesToggle.style.width = "161.39px";
        selectAllBatchesToggle.style.height = "30px";
        selectAllBatchesToggle.style.minWidth = "161.39px";
        selectAllBatchesToggle.style.maxWidth = "161.39px";
        selectAllBatchesToggle.style.minHeight = "30px";
        selectAllBatchesToggle.style.maxHeight = "30px";
        selectAllBatchesToggle.style.border = "2px solid #666666";
        selectAllBatchesToggle.style.borderWidth = "2px";
        selectAllBatchesToggle.style.borderStyle = "solid";
        selectAllBatchesToggle.style.borderColor = "#666666";
        selectAllBatchesToggle.style.borderRadius = "8px";
        selectAllBatchesToggle.style.background = "#111111";
        selectAllBatchesToggle.style.display = "flex";
        selectAllBatchesToggle.style.alignItems = "center";
        selectAllBatchesToggle.style.justifyContent = "center";
        selectAllBatchesToggle.style.fontSize = "11px"; // 2px bigger than 9px
        selectAllBatchesToggle.style.fontWeight = "600";
        selectAllBatchesToggle.style.fontFamily = "Archivo, sans-serif";
        selectAllBatchesToggle.style.color = "#00ff88 !important"; // Green color - use !important to override CSS
        selectAllBatchesToggle.style.setProperty("color", "#00ff88", "important"); // Also set with setProperty for maximum override
        selectAllBatchesToggle.style.padding = "4px 8px";
        selectAllBatchesToggle.style.boxSizing = "border-box";
        selectAllBatchesToggle.style.cursor = "help"; // Show help cursor for objects with tooltips
        selectAllBatchesToggle.style.transition = "background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease";
        selectAllBatchesToggle.style.whiteSpace = "nowrap"; // Prevent text wrapping
        selectAllBatchesToggle.style.textAlign = "center"; // Center align text
        selectAllBatchesToggle.style.letterSpacing = "normal"; // Prevent letter spacing changes
        selectAllBatchesToggle.style.transform = "none"; // Prevent any transform effects
        
        // Position in column 2 (aligned with batch card #12)
        selectAllBatchesToggle.style.gridColumn = "2";
        selectAllBatchesToggle.style.justifySelf = "start";
        
        // Insert after collection size (column 1) but before nfts-per-batch (column 3)
        const nftsPerBatch = document.getElementById("nfts-per-batch");
        if (nftsPerBatch) {
          headerWrapper.insertBefore(selectAllBatchesToggle, nftsPerBatch);
        } else {
          // If nfts-per-batch doesn't exist, append after collection size
          const collectionSize = document.getElementById("collection-size-display");
          if (collectionSize && collectionSize.nextSibling) {
            headerWrapper.insertBefore(selectAllBatchesToggle, collectionSize.nextSibling);
          } else {
            headerWrapper.appendChild(selectAllBatchesToggle);
          }
        }
        
        // Add tooltip to SELECT ALL BATCHES button
        selectAllBatchesToggle.classList.add("tooltip");
        const selectAllBatchesTooltip = document.createElement("span");
        selectAllBatchesTooltip.className = "tooltiptext";
        selectAllBatchesTooltip.innerHTML = "When activated, this will select all batches for export (excluding batches marked as already minted). When deactivated, it will restore the previous selection state.";
        selectAllBatchesTooltip.style.visibility = "hidden";
        selectAllBatchesTooltip.style.width = "320px";
        selectAllBatchesTooltip.style.minWidth = "320px";
        selectAllBatchesTooltip.style.maxWidth = "320px";
        selectAllBatchesTooltip.style.backgroundColor = "#000000";
        selectAllBatchesTooltip.style.color = "#f39c12";
        selectAllBatchesTooltip.style.textAlign = "center";
        selectAllBatchesTooltip.style.borderRadius = "6px";
        selectAllBatchesTooltip.style.padding = "8px 10px";
        selectAllBatchesTooltip.style.position = "fixed";
        selectAllBatchesTooltip.style.zIndex = "2147483647";
        selectAllBatchesTooltip.style.bottom = "auto";
        selectAllBatchesTooltip.style.top = "auto";
        selectAllBatchesTooltip.style.left = "auto";
        selectAllBatchesTooltip.style.right = "auto";
        selectAllBatchesTooltip.style.opacity = "0";
        selectAllBatchesTooltip.style.transition = "opacity 1s";
        selectAllBatchesTooltip.style.fontSize = "11px";
        selectAllBatchesTooltip.style.lineHeight = "1.4";
        selectAllBatchesTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
        selectAllBatchesTooltip.style.pointerEvents = "none";
        selectAllBatchesTooltip.style.whiteSpace = "normal";
        selectAllBatchesTooltip.style.wordWrap = "break-word";
        selectAllBatchesTooltip.style.overflowWrap = "break-word";
        selectAllBatchesTooltip.style.boxSizing = "border-box";
        selectAllBatchesTooltip.style.transform = "none";
        // Position off-screen initially to prevent global handlers from positioning incorrectly
        selectAllBatchesTooltip.style.top = "-9999px";
        selectAllBatchesTooltip.style.left = "-9999px";
        selectAllBatchesToggle.appendChild(selectAllBatchesTooltip);
        
        // Show tooltip on hover
        let selectAllBatchesTooltipTimeout = null;
        selectAllBatchesToggle.addEventListener("mouseenter", (e) => {
          // Clear any existing timeout
          if (selectAllBatchesTooltipTimeout) {
            clearTimeout(selectAllBatchesTooltipTimeout);
            selectAllBatchesTooltipTimeout = null;
          }
          // Show tooltip after 1 second delay
          selectAllBatchesTooltipTimeout = setTimeout(() => {
          const rect = selectAllBatchesToggle.getBoundingClientRect();
          // Make tooltip temporarily visible to measure height, but keep it off-screen
          selectAllBatchesTooltip.style.visibility = "visible";
          selectAllBatchesTooltip.style.opacity = "0";
          selectAllBatchesTooltip.style.top = "-9999px";
          selectAllBatchesTooltip.style.left = "-9999px";
            selectAllBatchesTooltip.style.transform = "none";
          void selectAllBatchesTooltip.offsetHeight; // Force reflow
          const tooltipWidth = selectAllBatchesTooltip.offsetWidth; // Dynamic width for accurate centering
          const tooltipHeight = selectAllBatchesTooltip.offsetHeight;
            // CRITICAL: Set position fixed and use setProperty with important to override CSS
            selectAllBatchesTooltip.style.setProperty("position", "fixed", "important");
            selectAllBatchesTooltip.style.setProperty("z-index", "2147483647", "important");
            selectAllBatchesTooltip.style.setProperty("bottom", "auto", "important");
            selectAllBatchesTooltip.style.setProperty("right", "auto", "important");
            selectAllBatchesTooltip.style.setProperty("margin", "0", "important");
            selectAllBatchesTooltip.style.setProperty("transform", "none", "important");
            // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
            const buttonRect = selectAllBatchesToggle.getBoundingClientRect();
            const centeredLeft = buttonRect.left + (buttonRect.width / 2) - (tooltipWidth / 2);
            const topPosition = buttonRect.top - tooltipHeight - 5;
            selectAllBatchesTooltip.style.setProperty("top", `${topPosition}px`, "important");
            selectAllBatchesTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
            // Fade in with transition
            requestAnimationFrame(() => {
          selectAllBatchesTooltip.style.opacity = "1";
            });
            selectAllBatchesTooltipTimeout = null;
          }, 1000);
        });
        selectAllBatchesToggle.addEventListener("mouseleave", () => {
          // Clear the show timeout if mouse leaves before delay completes
          if (selectAllBatchesTooltipTimeout) {
            clearTimeout(selectAllBatchesTooltipTimeout);
            selectAllBatchesTooltipTimeout = null;
          }
          selectAllBatchesTooltip.style.opacity = "0";
          setTimeout(() => {
            selectAllBatchesTooltip.style.visibility = "hidden";
          }, 1000);
        });
        
        // Add click handler
        selectAllBatchesToggle.addEventListener("click", () => {
          this.handleSelectAllBatchesToggle();
        });
      }
      
      // Update toggle state based on current selection
      this.updateSelectAllBatchesToggleState();
      
      // Check if all batches are selected and update toggle accordingly
      this.checkIfAllBatchesSelected();
    }

    // Get pagination container
    const paginationContainer = document.getElementById("batch-pagination-container");
    const needsPagination = this.numBatches > 10;
    
    // Show/hide pagination controls
    if (paginationContainer) {
      if (needsPagination) {
        paginationContainer.style.display = "flex";
        this.updatePaginationControls();
      } else {
        paginationContainer.style.display = "none";
      }
    }

    // Determine which batches to show based on current page
    // Always create exactly 10 batch cards to fill the grid (supports up to 20 batches total)
    let startBatch = 1;
    
    if (needsPagination) {
      if (this.currentBatchPage === 1) {
        startBatch = 1; // Page 1: batches 1-10
      } else {
        startBatch = 11; // Page 2: batches 11-20
      }
    } else {
      startBatch = 1; // No pagination: show batches 1-10
    }

    // Always create exactly 10 batch cards for consistent layout (supports up to 20 batches total)
    // Cards beyond numBatches will be inactive/greyed out
    // Batch cards start in row 3 (after title/pagination row 1 and collection size row 2)
    for (let i = startBatch; i < startBatch + 10 && i <= 20; i++) {
      const isActive = i <= this.numBatches;
      const batchCard = this.createBatchCard(i, isActive);
      batchCard.setAttribute("data-batch-page", this.currentBatchPage === 1 ? "1" : "2");
      
      // Explicitly position batch cards in grid
      // Batch cards start in row 2 (after header wrapper row 1)
      const cardIndex = i - startBatch; // 0-9
      if (cardIndex < 5) {
        // First row of batch cards (row 2)
        batchCard.style.gridRow = "2";
        batchCard.style.gridColumn = `${cardIndex + 1}`; // Columns 1-5
      } else {
        // Second row of batch cards (row 3)
        batchCard.style.gridRow = "3";
        batchCard.style.gridColumn = `${(cardIndex % 5) + 1}`; // Columns 1-5
      }
      
      batchManagementContainer.appendChild(batchCard);
    }

    // Automatically distribute total supply evenly among active batches
    this.distributeTotalSupply();

    // Update batch distribution text
    this.updateBatchDistribution();
    
    // Validate batch quantities after rendering
    this.validateBatchQuantities();
  },
  
  // Update pagination controls state
  updatePaginationControls: function() {
    const prevButton = document.getElementById("batch-pagination-prev");
    const nextButton = document.getElementById("batch-pagination-next");
    const pageIndicator = document.getElementById("batch-pagination-indicator");
    
    if (!prevButton || !nextButton || !pageIndicator) return;
    
    const totalPages = this.numBatches > 10 ? 2 : 1; // Supports up to 20 batches (10 per page)
    const currentPage = this.currentBatchPage;
    
    // Update page indicator text
    const pageIndicatorText = document.getElementById("batch-pagination-indicator-text");
    if (pageIndicatorText) {
      pageIndicatorText.textContent = `PAGE ${currentPage} OF ${totalPages}`;
    } else {
      // Fallback if text span doesn't exist
      pageIndicator.textContent = `PAGE ${currentPage} OF ${totalPages}`;
    }
    
    // Update button states
    prevButton.disabled = currentPage === 1;
    prevButton.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    prevButton.style.cursor = currentPage === 1 ? "not-allowed" : "pointer";
    
    nextButton.disabled = currentPage === totalPages;
    nextButton.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    nextButton.style.cursor = currentPage === totalPages ? "not-allowed" : "pointer";
  },
  
  // Switch to previous page
  goToPreviousPage: function() {
    if (this.currentBatchPage > 1) {
      this.currentBatchPage--;
      this.renderBatchCards();
      this.saveState();
    }
  },
  
  // Switch to next page
  goToNextPage: function() {
    const totalPages = this.numBatches > 10 ? 2 : 1; // Supports up to 20 batches (10 per page)
    if (this.currentBatchPage < totalPages) {
      this.currentBatchPage++;
      this.renderBatchCards();
      this.saveState();
    }
  },


  // Create a batch card - Remade according to new design
  createBatchCard: function(batchNumber, isActive) {
    const card = document.createElement("div");
    card.className = "batch-card";
    card.id = `batch-card-${batchNumber}`;
    card.style.padding = "12px";
    // Purple border for active batches, grey border for inactive batches
    card.style.border = isActive ? "2px solid #8b5cf6" : "2px solid #666666";
    card.style.borderRadius = "8px";
    card.style.background = isActive ? "#1a1a1a" : "#111111";
    card.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
    card.style.pointerEvents = isActive ? "auto" : "none";
    card.style.display = "flex";
    card.style.flexDirection = "column";
    card.style.gap = "8px";
    card.style.minWidth = "120px";
    card.style.width = "100%";
    card.style.position = "relative";

    // Top section: Batch name on left, NFT count input on right
    const topSection = document.createElement("div");
    topSection.style.display = "flex";
    topSection.style.justifyContent = "space-between";
    topSection.style.alignItems = "center";
    topSection.style.gap = "8px";
    topSection.style.marginBottom = "4px";

    const batchName = document.createElement("span");
    batchName.textContent = `BATCH #${String(batchNumber).padStart(2, "0")}`;
    batchName.style.fontSize = "11px";
    batchName.style.fontWeight = "600";
    batchName.style.color = isActive ? "var(--text-primary)" : "#666666";
    batchName.style.flexShrink = "0";

    const input = document.createElement("input");
    input.type = "number";
    input.id = `batch-input-${batchNumber}`;
    input.className = "batch-input";
    input.min = "0";
    input.value = batchNumber === 1 && isActive ? "10000" : "0";
    input.style.width = "50px";
    input.style.padding = "4px 6px";
    input.style.border = "1px solid var(--border-color)";
    input.style.borderRadius = "4px";
    input.style.background = isActive ? "var(--bg-primary)" : "#2a2a2a";
    // Color will be set dynamically by updateBatchDistribution() to match distribution text
    // Initial color set here, will be updated when distribution is calculated
    input.style.color = isActive ? "#f39c12" : "#666666";
    input.style.fontSize = "11px";
    input.style.textAlign = "center";
    input.disabled = !isActive;

    // Debounce timer for redistribution
    let redistributionTimer = null;
    
    // Add event listener for input changes (only if not locked)
    input.addEventListener("input", () => {
      const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${batchNumber}`);
      const isLocked = alreadyMintedToggle && alreadyMintedToggle.classList.contains("active");
      if (!isLocked) {
        // Update batchData immediately when input changes
        const value = parseInt(input.value) || 0;
        if (!this.batchData[batchNumber]) {
          this.batchData[batchNumber] = {};
        }
        this.batchData[batchNumber].quantity = value;
        
        // Clear existing timer
        if (redistributionTimer) {
          clearTimeout(redistributionTimer);
        }
        
        // Validate against maximum limit
        this.validateBatchQuantities();
        
        // Update distribution text immediately for visual feedback
        this.updateBatchDistribution();
        
        // Check export button state when quantity changes
        this.checkExportButtonState();
        
        // Schedule redistribution after 1 second
        redistributionTimer = setTimeout(() => {
          this.redistributeRemainingNFTs(batchNumber);
          // Validate again after redistribution
          this.validateBatchQuantities();
          // Check export button state after redistribution
          this.checkExportButtonState();
          // Save state after redistribution
          this.saveState();
        }, 1000);
      } else {
        // Prevent input when locked
        const currentValue = this.batchData[batchNumber]?.quantity || 0;
        input.value = currentValue.toString();
      }
    });

    input.addEventListener("blur", () => {
      // Check export button state when input loses focus
      this.checkExportButtonState();
      
      const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${batchNumber}`);
      const isLocked = alreadyMintedToggle && alreadyMintedToggle.classList.contains("active");
      if (!isLocked) {
        const value = parseInt(input.value) || 0;
        if (value < 0) {
          input.value = "0";
        }
        
        // Update batchData on blur
        if (!this.batchData[batchNumber]) {
          this.batchData[batchNumber] = {};
        }
        this.batchData[batchNumber].quantity = parseInt(input.value) || 0;
        
        // Clear any pending timer and redistribute immediately on blur
        if (redistributionTimer) {
          clearTimeout(redistributionTimer);
          redistributionTimer = null;
        }
        
        // Validate against maximum limit
        this.validateBatchQuantities();
        
        // Redistribute immediately when user leaves the field
        this.redistributeRemainingNFTs(batchNumber);
        
        // Validate again after redistribution
        this.validateBatchQuantities();
      } else {
        // Restore original value when locked
        const currentValue = this.batchData[batchNumber]?.quantity || 0;
        input.value = currentValue.toString();
      }
    });

    topSection.appendChild(batchName);
    topSection.appendChild(input);

    // Middle section: "SELECT FOR EXPORT" toggle (centered)
    // Use saved state from batchData if available, otherwise default to Batch 01 if active
    const hasSavedState = this.batchData[batchNumber] && typeof this.batchData[batchNumber].selectToExport === 'boolean';
    const shouldSelectToExport = hasSavedState 
      ? this.batchData[batchNumber].selectToExport 
      : (batchNumber === 1 && isActive);
    const selectToExportToggle = this.createSelectToExportToggle(batchNumber, shouldSelectToExport, card);
    selectToExportToggle.disabled = !isActive;
    selectToExportToggle.style.width = "100%";
    selectToExportToggle.style.margin = "0 auto";

    // Bottom section: "ALREADY MINTED" toggle (centered)
    const alreadyMintedToggle = this.createAlreadyMintedToggle(batchNumber);
    alreadyMintedToggle.disabled = !isActive;
    alreadyMintedToggle.style.width = "100%";
    alreadyMintedToggle.style.margin = "0 auto";
    
    // Ensure both toggles have the same width and height
    // Both toggles should match the card width (100%) and have the same height (28px)
    // The width is already set to 100% for both, so they'll match the card width
    // The height is already set to 28px for both, so they're already matching

    card.appendChild(topSection);
    card.appendChild(selectToExportToggle);
    card.appendChild(alreadyMintedToggle);

    // Store in batchData
    if (!this.batchData[batchNumber]) {
      this.batchData[batchNumber] = {
        quantity: batchNumber === 1 && isActive ? 10000 : 0,
        alreadyMinted: false,
        selectToExport: shouldSelectToExport,
        isActive: isActive
      };
    } else {
      this.batchData[batchNumber].isActive = isActive;
      // Preserve existing selectToExport state if it exists, otherwise use shouldSelectToExport
      if (typeof this.batchData[batchNumber].selectToExport !== 'boolean') {
        this.batchData[batchNumber].selectToExport = shouldSelectToExport;
      }
    }

    return card;
  },

  // Create "SELECT FOR EXPORT" toggle
  createSelectToExportToggle: function(batchNumber, shouldBeActive = false, cardElement = null) {
    const toggle = document.createElement("button");
    toggle.id = `select-to-export-toggle-${batchNumber}`;
    toggle.type = "button";
    toggle.className = "toggle-button select-to-export-toggle";
    toggle.textContent = "SELECT FOR EXPORT";
    toggle.style.padding = "6px 8px";
    toggle.style.border = "2px solid #4a4a4a";
    toggle.style.borderRadius = "6px";
    toggle.style.backgroundColor = "#2a2a2a";
    toggle.style.color = "#ffffff";
    toggle.style.setProperty("font-size", "12px", "important"); // Doubled from 6px
    toggle.style.fontWeight = "600";
    toggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    toggle.style.width = "100%"; // Will be adjusted to match the wider toggle
    toggle.style.height = "20px";
    toggle.style.minHeight = "20px";
    toggle.style.maxHeight = "20px";
    toggle.style.display = "flex";
    toggle.style.alignItems = "center";
    toggle.style.justifyContent = "center";
    toggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    toggle.style.transform = "none";
    toggle.style.animation = "none";
    toggle.style.textAlign = "center";
    toggle.style.whiteSpace = "nowrap"; // Prevent text wrapping
    
    // Add tooltip to SELECT FOR EXPORT toggle
    toggle.classList.add("tooltip");
    const selectForExportTooltip = document.createElement("span");
    selectForExportTooltip.className = "tooltiptext";
    selectForExportTooltip.innerHTML = "When activated, this batch will be included in the export. The batch card will show a green border and halo effect to indicate it's selected for export.";
    selectForExportTooltip.style.visibility = "hidden";
    selectForExportTooltip.style.width = "320px";
    selectForExportTooltip.style.minWidth = "320px";
    selectForExportTooltip.style.maxWidth = "320px";
    selectForExportTooltip.style.backgroundColor = "#000000";
    selectForExportTooltip.style.color = "#f39c12";
    selectForExportTooltip.style.textAlign = "center";
    selectForExportTooltip.style.borderRadius = "6px";
    selectForExportTooltip.style.padding = "8px 10px";
    selectForExportTooltip.style.position = "fixed";
    selectForExportTooltip.style.zIndex = "2147483647";
    selectForExportTooltip.style.bottom = "auto";
    selectForExportTooltip.style.top = "auto";
    selectForExportTooltip.style.left = "auto";
    selectForExportTooltip.style.right = "auto";
    selectForExportTooltip.style.opacity = "0";
    selectForExportTooltip.style.transition = "opacity 1s";
    selectForExportTooltip.style.fontSize = "11px";
    selectForExportTooltip.style.lineHeight = "1.4";
    selectForExportTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    selectForExportTooltip.style.pointerEvents = "none";
    selectForExportTooltip.style.whiteSpace = "normal";
    selectForExportTooltip.style.wordWrap = "break-word";
    selectForExportTooltip.style.overflowWrap = "break-word";
    selectForExportTooltip.style.boxSizing = "border-box";
    selectForExportTooltip.style.textTransform = "none"; // Ensure tooltip text is not uppercase
    selectForExportTooltip.style.transform = "none";
    // Append to body instead of toggle to escape stacking context and ensure highest z-index
    document.body.appendChild(selectForExportTooltip);
    // Store reference on toggle for easy access
    toggle.dataset.tooltipId = selectForExportTooltip.id || `select-for-export-tooltip-${batchNumber}`;
    if (!selectForExportTooltip.id) {
      selectForExportTooltip.id = `select-for-export-tooltip-${batchNumber}`;
    }
    
    // Show tooltip on hover
    let selectForExportTooltipTimeout = null;
    toggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (selectForExportTooltipTimeout) {
        clearTimeout(selectForExportTooltipTimeout);
        selectForExportTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      selectForExportTooltipTimeout = setTimeout(() => {
      const rect = toggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      selectForExportTooltip.style.visibility = "visible";
      selectForExportTooltip.style.opacity = "0";
      selectForExportTooltip.style.top = "-9999px";
      selectForExportTooltip.style.left = "-9999px";
        selectForExportTooltip.style.transform = "none";
      void selectForExportTooltip.offsetHeight; // Force reflow
      const tooltipWidth = selectForExportTooltip.offsetWidth; // Dynamic width for accurate centering
      const tooltipHeight = selectForExportTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        selectForExportTooltip.style.setProperty("position", "fixed", "important");
        selectForExportTooltip.style.setProperty("z-index", "2147483647", "important");
        selectForExportTooltip.style.setProperty("bottom", "auto", "important");
        selectForExportTooltip.style.setProperty("right", "auto", "important");
        selectForExportTooltip.style.setProperty("margin", "0", "important");
        selectForExportTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = toggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        selectForExportTooltip.style.setProperty("top", `${topPosition}px`, "important");
        selectForExportTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      selectForExportTooltip.style.opacity = "1";
        });
        selectForExportTooltipTimeout = null;
      }, 1000);
    });
    toggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (selectForExportTooltipTimeout) {
        clearTimeout(selectForExportTooltipTimeout);
        selectForExportTooltipTimeout = null;
      }
      selectForExportTooltip.style.opacity = "0";
      setTimeout(() => {
        selectForExportTooltip.style.visibility = "hidden";
      }, 1000);
    });
    
    // If should be active, activate it immediately
    if (shouldBeActive) {
      toggle.classList.add("active");
      toggle.style.backgroundColor = "#00ff88";
      toggle.style.borderColor = "#00ff88";
      toggle.style.color = "#000000";
      toggle.style.fontWeight = "bold";
      toggle.style.boxShadow = `
        inset 0 3px 5px rgba(0, 0, 0, 0.5),
        0 0 10px rgba(0, 255, 136, 0.5),
        0 0 20px rgba(0, 255, 136, 0.3)
      `;
      
      // Also update the card border and attribute (use passed cardElement if available)
      // Green border replaces purple when selected for export
      // BUT: if batch exceeds max, keep red border regardless of selection state
      const card = cardElement || document.getElementById(`batch-card-${batchNumber}`);
      if (card) {
        // Check if batch exceeds maximum - validate first if needed
        let exceedsMax = card.getAttribute("data-exceeds-max") === "true";
        if (!exceedsMax) {
          // Re-validate to ensure data-exceeds-max is set correctly
          const input = document.getElementById(`batch-input-${batchNumber}`);
          const maxNftsInput = document.getElementById("max-nfts-export-input");
          if (input && maxNftsInput) {
            const quantity = parseInt(input.value) || 0;
            const maxNfts = parseInt(maxNftsInput.value) || 2000;
            exceedsMax = quantity > maxNfts;
          }
        }
        if (exceedsMax) {
          // Keep red border when exceeding max, but still show green halo when selected
          card.style.border = "2px solid #e74c3c";
          card.setAttribute("data-selected-to-export", "true");
          // Add green halo effect even with red border
          card.style.boxShadow = `
            0 0 8px rgba(0, 255, 72, 0.8),
            0 0 12px rgba(0, 255, 72, 0.6),
            0 0 16px rgba(0, 255, 72, 0.4)
          `;
        } else {
          card.style.border = "2px solid #00ff48";
          card.setAttribute("data-selected-to-export", "true");
          // Add green halo effect
          card.style.boxShadow = `
            0 0 8px rgba(0, 255, 72, 0.8),
            0 0 12px rgba(0, 255, 72, 0.6),
            0 0 16px rgba(0, 255, 72, 0.4)
          `;
        }
      }
    }

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Validate batch quantities first to ensure data-exceeds-max is up to date
      this.validateBatchQuantities();
      const isActive = toggle.classList.contains("active");
      const card = document.getElementById(`batch-card-${batchNumber}`);
      const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${batchNumber}`);
      const input = document.getElementById(`batch-input-${batchNumber}`);
      const isAlreadyMinted = alreadyMintedToggle && alreadyMintedToggle.classList.contains("active");
      
      if (isActive) {
        toggle.classList.remove("active");
        toggle.style.backgroundColor = "#2a2a2a";
        toggle.style.borderColor = "#4a4a4a";
        toggle.style.color = "#ffffff";
        toggle.style.boxShadow = "none";
        
        // If not locked, restore purple border (if active) or grey border (if inactive); if locked, keep red
        // BUT: if batch exceeds max, keep red border regardless of selection state
        if (!isAlreadyMinted && card) {
          // Check if batch exceeds maximum - if so, keep red border
          const exceedsMax = card.getAttribute("data-exceeds-max") === "true";
          if (exceedsMax) {
            // Keep red border when exceeding max, but remove green halo when deselected
            card.style.border = "2px solid #e74c3c";
            card.style.boxShadow = "none";
          } else {
            // Check if this batch is active (within applied number of batches)
            const batchNum = parseInt(batchNumber);
            const numBatches = this.numBatches || 1;
            const isActiveBatch = batchNum <= numBatches;
            card.style.border = isActiveBatch ? "2px solid #8b5cf6" : "2px solid #666666";
            card.style.background = isActiveBatch ? "#1a1a1a" : "#111111";
            // Remove green halo effect
            card.style.boxShadow = "none";
          }
          card.removeAttribute("data-selected-to-export");
          // Remove lock icon if exists
          const lockIcon = card.querySelector(".lock-icon");
          if (lockIcon) lockIcon.remove();
        }
      } else {
        toggle.classList.add("active");
        toggle.style.backgroundColor = "#00ff88";
        toggle.style.borderColor = "#00ff88";
        toggle.style.color = "#000000";
        toggle.style.fontWeight = "bold";
        toggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(0, 255, 136, 0.5),
          0 0 20px rgba(0, 255, 136, 0.3)
        `;
        
        // Change card border to green when selected to export (replaces purple)
        // BUT: if batch exceeds max, keep red border regardless of selection state
        // Apply green border and halo even if already minted (green halo should show when selected to export)
        if (card) {
          // Check if batch exceeds maximum - validate first if needed
          let exceedsMax = card.getAttribute("data-exceeds-max") === "true";
          if (!exceedsMax) {
            // Re-validate to ensure data-exceeds-max is set correctly
            const maxNftsInput = document.getElementById("max-nfts-export-input");
            if (input && maxNftsInput) {
              const quantity = parseInt(input.value) || 0;
              const maxNfts = parseInt(maxNftsInput.value) || 2000;
              exceedsMax = quantity > maxNfts;
            }
          }
          if (exceedsMax) {
            // Keep red border when exceeding max, but still show green halo when selected
            card.style.border = "2px solid #e74c3c";
            card.setAttribute("data-selected-to-export", "true");
            // Add green halo effect even with red border
            card.style.boxShadow = `
              0 0 8px rgba(0, 255, 72, 0.8),
              0 0 12px rgba(0, 255, 72, 0.6),
              0 0 16px rgba(0, 255, 72, 0.4)
            `;
          } else {
            card.style.border = "2px solid #00ff48";
            card.setAttribute("data-selected-to-export", "true");
            // Add green halo effect
            card.style.boxShadow = `
              0 0 8px rgba(0, 255, 72, 0.8),
              0 0 12px rgba(0, 255, 72, 0.6),
              0 0 16px rgba(0, 255, 72, 0.4)
            `;
          }
        }
        
        // Unlock if was locked
        if (isAlreadyMinted && card && input) {
          // Unlock: remove red background, remove lock icon, enable input
          card.style.background = "#1a1a1a";
          // Check if batch exceeds maximum - validate first if needed
          let exceedsMax = card.getAttribute("data-exceeds-max") === "true";
          if (!exceedsMax) {
            // Re-validate to ensure data-exceeds-max is set correctly
            const maxNftsInput = document.getElementById("max-nfts-export-input");
            if (input && maxNftsInput) {
              const quantity = parseInt(input.value) || 0;
              const maxNfts = parseInt(maxNftsInput.value) || 2000;
              exceedsMax = quantity > maxNfts;
            }
          }
          if (exceedsMax) {
            // Keep red border when exceeding max, but show green halo if selected to export
            card.style.border = "2px solid #e74c3c";
            // Check if selected to export - if so, show green halo
            const selectToExportToggle = document.getElementById(`select-to-export-toggle-${batchNumber}`);
            const isSelectedToExport = selectToExportToggle && selectToExportToggle.classList.contains("active");
            if (isSelectedToExport) {
              card.style.boxShadow = `
                0 0 8px rgba(0, 255, 72, 0.8),
                0 0 12px rgba(0, 255, 72, 0.6),
                0 0 16px rgba(0, 255, 72, 0.4)
              `;
            } else {
              card.style.boxShadow = "none";
            }
          } else {
            card.style.border = "2px solid #00ff48";
            card.setAttribute("data-selected-to-export", "true");
            // Add green halo effect
            card.style.boxShadow = `
              0 0 8px rgba(0, 255, 72, 0.8),
              0 0 12px rgba(0, 255, 72, 0.6),
              0 0 16px rgba(0, 255, 72, 0.4)
            `;
          }
          const lockIcon = card.querySelector(".lock-icon");
          if (lockIcon) lockIcon.remove();
          input.disabled = false;
          input.style.opacity = "1";
          alreadyMintedToggle.classList.remove("active");
          alreadyMintedToggle.style.backgroundColor = "#2a2a2a";
          alreadyMintedToggle.style.borderColor = "#4a4a4a";
          alreadyMintedToggle.style.color = "#ffffff";
          alreadyMintedToggle.style.boxShadow = "none";
          alreadyMintedToggle.style.animation = "none";
          
          if (this.batchData[batchNumber]) {
            this.batchData[batchNumber].alreadyMinted = false;
          }
        }
      }

      if (this.batchData[batchNumber]) {
        this.batchData[batchNumber].selectToExport = !isActive;
      }
      
      // If user manually deselects a batch, deactivate "SELECT ALL BATCHES" toggle
      if (this.selectAllBatchesActive && !isActive) {
        // User manually deselected a batch - deactivate "SELECT ALL BATCHES"
        this.selectAllBatchesActive = false;
        this.updateSelectAllBatchesToggleState();
      }
      
      // Check export button state when batch selection changes
      this.checkExportButtonState();
      
      // Save state when batch selection changes
      this.saveState();
    });

    return toggle;
  },

  // Create "Already Minted" toggle
  createAlreadyMintedToggle: function(batchNumber) {
    const toggle = document.createElement("button");
    toggle.id = `already-minted-toggle-${batchNumber}`;
    toggle.type = "button";
    toggle.className = "toggle-button already-minted-toggle";
    toggle.textContent = "ALREADY MINTED";
    toggle.style.padding = "6px 8px";
    toggle.style.border = "2px solid #4a4a4a";
    toggle.style.borderRadius = "6px";
    toggle.style.backgroundColor = "#2a2a2a";
    toggle.style.color = "#ffffff";
    toggle.style.setProperty("font-size", "12px", "important"); // Same size as SELECT FOR EXPORT
    toggle.style.fontWeight = "600";
    toggle.style.cursor = "help"; // Show help cursor for objects with tooltips
    toggle.style.width = "100%"; // Will be adjusted to match the wider toggle
    toggle.style.height = "20px";
    toggle.style.minHeight = "20px";
    toggle.style.maxHeight = "20px";
    toggle.style.display = "flex";
    toggle.style.alignItems = "center";
    toggle.style.justifyContent = "center";
    toggle.style.transition = "background-color 0.5s ease, border-color 0.5s ease, color 0.5s ease, box-shadow 0.5s ease";
    toggle.style.transform = "none";
    toggle.style.animation = "none";
    toggle.style.textAlign = "center";
    toggle.style.textTransform = "uppercase";
    toggle.style.whiteSpace = "nowrap"; // Prevent text wrapping

    // Add tooltip to ALREADY MINTED toggle
    toggle.classList.add("tooltip");
    const alreadyMintedTooltip = document.createElement("span");
    alreadyMintedTooltip.className = "tooltiptext";
    alreadyMintedTooltip.innerHTML = "When activated, this batch will be marked as already minted and will be excluded from export. The batch card will be locked with a red border and the batch input will be disabled.";
    alreadyMintedTooltip.style.visibility = "hidden";
    alreadyMintedTooltip.style.width = "320px";
    alreadyMintedTooltip.style.minWidth = "320px";
    alreadyMintedTooltip.style.maxWidth = "320px";
    alreadyMintedTooltip.style.backgroundColor = "#000000";
    alreadyMintedTooltip.style.color = "#f39c12";
    alreadyMintedTooltip.style.textAlign = "center";
    alreadyMintedTooltip.style.borderRadius = "6px";
    alreadyMintedTooltip.style.padding = "8px 10px";
    alreadyMintedTooltip.style.position = "fixed";
    alreadyMintedTooltip.style.zIndex = "2147483647";
    alreadyMintedTooltip.style.bottom = "auto";
    alreadyMintedTooltip.style.top = "auto";
    alreadyMintedTooltip.style.left = "auto";
    alreadyMintedTooltip.style.right = "auto";
    alreadyMintedTooltip.style.opacity = "0";
    alreadyMintedTooltip.style.transition = "opacity 1s";
    alreadyMintedTooltip.style.fontSize = "11px";
    alreadyMintedTooltip.style.lineHeight = "1.4";
    alreadyMintedTooltip.style.boxShadow = "0 2px 8px rgba(0, 0, 0, 0.5)";
    alreadyMintedTooltip.style.pointerEvents = "none";
    alreadyMintedTooltip.style.whiteSpace = "normal";
    alreadyMintedTooltip.style.wordWrap = "break-word";
    alreadyMintedTooltip.style.overflowWrap = "break-word";
    alreadyMintedTooltip.style.boxSizing = "border-box";
    alreadyMintedTooltip.style.textTransform = "none"; // Ensure tooltip text is not uppercase
    alreadyMintedTooltip.style.transform = "none";
    // Append to body instead of toggle to escape stacking context and ensure highest z-index
    document.body.appendChild(alreadyMintedTooltip);
    // Store reference on toggle for easy access
    toggle.dataset.tooltipId = alreadyMintedTooltip.id || `already-minted-tooltip-${batchNumber}`;
    if (!alreadyMintedTooltip.id) {
      alreadyMintedTooltip.id = `already-minted-tooltip-${batchNumber}`;
    }
    
    // Show tooltip on hover
    let alreadyMintedTooltipTimeout = null;
    toggle.addEventListener("mouseenter", (e) => {
      // Clear any existing timeout
      if (alreadyMintedTooltipTimeout) {
        clearTimeout(alreadyMintedTooltipTimeout);
        alreadyMintedTooltipTimeout = null;
      }
      // Show tooltip after 1 second delay
      alreadyMintedTooltipTimeout = setTimeout(() => {
      const rect = toggle.getBoundingClientRect();
      // Make tooltip temporarily visible to measure height, but keep it off-screen
      alreadyMintedTooltip.style.visibility = "visible";
      alreadyMintedTooltip.style.opacity = "0";
      alreadyMintedTooltip.style.top = "-9999px";
      alreadyMintedTooltip.style.left = "-9999px";
        alreadyMintedTooltip.style.transform = "none";
      void alreadyMintedTooltip.offsetHeight; // Force reflow
      const tooltipWidth = alreadyMintedTooltip.offsetWidth; // Dynamic width for accurate centering
      const tooltipHeight = alreadyMintedTooltip.offsetHeight;
        // CRITICAL: Set position fixed and use setProperty with important to override CSS
        alreadyMintedTooltip.style.setProperty("position", "fixed", "important");
        alreadyMintedTooltip.style.setProperty("z-index", "2147483647", "important");
        alreadyMintedTooltip.style.setProperty("bottom", "auto", "important");
        alreadyMintedTooltip.style.setProperty("right", "auto", "important");
        alreadyMintedTooltip.style.setProperty("margin", "0", "important");
        alreadyMintedTooltip.style.setProperty("transform", "none", "important");
        // CRITICAL: Use setProperty with important for top and left to ensure CSS can't override
        const toggleRect = toggle.getBoundingClientRect();
        const centeredLeft = toggleRect.left + (toggleRect.width / 2) - (tooltipWidth / 2);
        const topPosition = toggleRect.top - tooltipHeight - 5;
        alreadyMintedTooltip.style.setProperty("top", `${topPosition}px`, "important");
        alreadyMintedTooltip.style.setProperty("left", `${centeredLeft}px`, "important");
        // Fade in with transition
        requestAnimationFrame(() => {
      alreadyMintedTooltip.style.opacity = "1";
        });
        alreadyMintedTooltipTimeout = null;
      }, 1000);
    });
    toggle.addEventListener("mouseleave", () => {
      // Clear the show timeout if mouse leaves before delay completes
      if (alreadyMintedTooltipTimeout) {
        clearTimeout(alreadyMintedTooltipTimeout);
        alreadyMintedTooltipTimeout = null;
      }
      alreadyMintedTooltip.style.opacity = "0";
      setTimeout(() => {
        alreadyMintedTooltip.style.visibility = "hidden";
      }, 1000);
    });

    toggle.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isActive = toggle.classList.contains("active");
      const card = document.getElementById(`batch-card-${batchNumber}`);
      const input = document.getElementById(`batch-input-${batchNumber}`);
      const selectToExportToggle = document.getElementById(`select-to-export-toggle-${batchNumber}`);
      
      if (isActive) {
        toggle.classList.remove("active");
        toggle.style.backgroundColor = "#2a2a2a";
        toggle.style.borderColor = "#4a4a4a";
        toggle.style.color = "#ffffff";
        toggle.style.boxShadow = "none";
        toggle.style.animation = "none";
        
        // Unlock: restore normal state
        if (card && input) {
          card.style.background = "#1a1a1a";
          // Restore border based on select to export state and active state
          const batchNum = parseInt(batchNumber);
          const numBatches = this.numBatches || 1;
          const isActiveBatch = batchNum <= numBatches;
          const isSelectedToExport = selectToExportToggle && selectToExportToggle.classList.contains("active");
          
          if (isSelectedToExport) {
            card.style.border = "2px solid #00ff48";
            card.setAttribute("data-selected-to-export", "true");
            // Add green halo effect
            card.style.boxShadow = `
              0 0 8px rgba(0, 255, 72, 0.8),
              0 0 12px rgba(0, 255, 72, 0.6),
              0 0 16px rgba(0, 255, 72, 0.4)
            `;
          } else {
            card.style.border = isActiveBatch ? "2px solid #8b5cf6" : "2px solid #666666";
            card.style.boxShadow = "none";
            card.removeAttribute("data-selected-to-export");
          }
          const lockIcon = card.querySelector(".lock-icon");
          if (lockIcon) lockIcon.remove();
          input.disabled = false;
          input.style.opacity = "1";
        }
      } else {
        toggle.classList.add("active");
        toggle.style.backgroundColor = "#e74c3c";
        toggle.style.borderColor = "#e74c3c";
        toggle.style.color = "#ffffff";
        toggle.style.fontWeight = "bold";
        toggle.style.boxShadow = `
          inset 0 3px 5px rgba(0, 0, 0, 0.5),
          0 0 10px rgba(231, 76, 60, 0.8),
          0 0 20px rgba(231, 76, 60, 0.6),
          0 0 30px rgba(231, 76, 60, 0.4)
        `;
        toggle.style.animation = "pulse-red 2s infinite";
        
        // Lock: dark red background, lock icon, disable input
        if (card && input) {
          card.style.background = "#5a1a1a"; // Dark red
          // Always use dark red border and remove green halo when ALREADY MINTED is active
          card.style.border = "2px solid #8b0000"; // Dark red border
          card.removeAttribute("data-selected-to-export"); // Remove halo effect
          card.style.boxShadow = "none"; // Remove any existing halo
          
          // Remove existing lock icon if any
          const existingLockIcon = card.querySelector(".lock-icon");
          if (existingLockIcon) existingLockIcon.remove();
          
          // Create and add lock icon
          const lockIcon = document.createElement("div");
          lockIcon.className = "lock-icon";
          lockIcon.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: #ff4444;">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
            </svg>
          `;
          lockIcon.style.position = "absolute";
          lockIcon.style.top = "50%";
          lockIcon.style.left = "50%";
          lockIcon.style.transform = "translate(-50%, -50%)";
          lockIcon.style.zIndex = "10";
          lockIcon.style.pointerEvents = "none";
          lockIcon.style.opacity = "0.8";
          card.appendChild(lockIcon);
          
          // Disable input
          input.disabled = true;
          input.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
          
          // Deselect "Select to Export" if active (must unlock first)
          if (selectToExportToggle && selectToExportToggle.classList.contains("active")) {
            selectToExportToggle.classList.remove("active");
            selectToExportToggle.style.backgroundColor = "#2a2a2a";
            selectToExportToggle.style.borderColor = "#4a4a4a";
            selectToExportToggle.style.color = "#ffffff";
            selectToExportToggle.style.boxShadow = "none";
            if (this.batchData[batchNumber]) {
              this.batchData[batchNumber].selectToExport = false;
            }
          }
        }
      }

      if (this.batchData[batchNumber]) {
        this.batchData[batchNumber].alreadyMinted = !isActive;
      }
      
      // Check export button state when batch lock status changes
      this.checkExportButtonState();
      
      // Save state when batch lock status changes
      this.saveState();
    });

    return toggle;
  },

  // Initialize defaults
  initializeDefaults: function() {
    // Set num-batches-input to saved value or default to 20
    const numBatchesInput = document.getElementById("num-batches-input");
    if (numBatchesInput) {
      numBatchesInput.value = String(this.numBatches || 20);
      // Don't auto-click Apply button since batches are already created
      // The input value is just for display/reference
    }
    
    // Check for first trait image size and update dimensions
    this.detectFirstTraitImageSize();
  },
  
  // Detect first trait image size and set as original dimensions
  detectFirstTraitImageSize: function() {
    // Detect if dimensions are 0 or incorrectly set to 1000x1000 (default canvas size)
    // The actual trait images might be 1024x1024 even if canvas is 1000x1000
    const needsDetection = (this.originalImageWidth === 0 && this.originalImageHeight === 0) ||
                          (this.originalImageWidth === 1000 && this.originalImageHeight === 1000);
    
    if (!needsDetection) {
      return; // Already detected with correct dimensions
    }
    
    // Get project data
    let projectData = window.currentProject;
    if (!projectData && window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject) {
      projectData = window.MemoryManager.state.currentProject;
    }
    
    if (!projectData || !projectData.traits || !Array.isArray(projectData.traits)) {
      // No traits loaded, set to 0x0
      this.originalImageWidth = 0;
      this.originalImageHeight = 0;
      this.customImageWidth = 0;
      this.customImageHeight = 0;
      this.updateImageDimensionInputs();
      return;
    }
    
    // Find first trait with an image
    let firstTrait = null;
    for (const layer of projectData.traits) {
      if (layer.traits && Array.isArray(layer.traits) && layer.traits.length > 0) {
        for (const trait of layer.traits) {
          if (trait.imageData || trait.image) {
            firstTrait = trait;
            break;
          }
        }
        if (firstTrait) break;
      }
    }
    
    if (!firstTrait) {
      // No traits with images found, set to 0x0
      this.originalImageWidth = 0;
      this.originalImageHeight = 0;
      this.customImageWidth = 0;
      this.customImageHeight = 0;
      this.updateImageDimensionInputs();
      return;
    }
    
    // Load the first trait image to get its dimensions
    const img = new Image();
    img.onload = () => {
      const naturalWidth = img.naturalWidth || img.width || 0;
      const naturalHeight = img.naturalHeight || img.height || 0;
      
      if (naturalWidth > 0 && naturalHeight > 0) {
        this.originalImageWidth = naturalWidth;
        this.originalImageHeight = naturalHeight;
        this.customImageWidth = naturalWidth;
        this.customImageHeight = naturalHeight;
        this.updateImageDimensionInputs();
      }
    };
    img.onerror = () => {
      // If image fails to load, keep dimensions at 0
      this.originalImageWidth = 0;
      this.originalImageHeight = 0;
      this.customImageWidth = 0;
      this.customImageHeight = 0;
      this.updateImageDimensionInputs();
    };
    
    // Set image source
    if (firstTrait.imageData) {
      img.src = firstTrait.imageData;
    } else if (firstTrait.image) {
      img.src = typeof firstTrait.image === 'string' ? firstTrait.image : firstTrait.image.src;
    }
  },
  
  // Update image dimension inputs in the UI
  updateImageDimensionInputs: function() {
    const widthInput = document.getElementById('export-image-width-input');
    const heightInput = document.getElementById('export-image-height-input');
    
    if (widthInput && heightInput) {
      widthInput.value = this.originalImageWidth;
      heightInput.value = this.originalImageHeight;
    }
  },
  
  // Comprehensive reset function - clears all state as if app was refreshed
  resetAllState: function() {
    console.log("[Export NFTs] Resetting all state...");
    
    // Clear intervals and timers
    if (this.traitCheckInterval) {
      clearInterval(this.traitCheckInterval);
      this.traitCheckInterval = null;
    }
    if (this.saveStateTimer) {
      clearTimeout(this.saveStateTimer);
      this.saveStateTimer = null;
    }
    
    // Reset all state variables to defaults
    this.imageFormat = { jpg: true, png: false };
    this.metadataFormat = { json: true, csv: false };
    this.numBatches = 20;
    this.currentBatchPage = 1;
    this.batchData = {};
    this.blockchainToggles = {
      ethereum: false,
      solana: false,
      bitcoin: false,
      cosmos: false,
      tezos: false,
      xrpl: false,
      polygon: false,
      immutablex: false,
      base: false,
      avalanche: false,
      flow: false,
      arbitrum: false
    };
    this.rarityRankEnabled = false;
    this.metadataPerNftEnabled = false;
    this.isExporting = false;
    this.isInitializing = false;
    this.useOriginalImageSize = true;
    this.originalImageWidth = 0;
    this.originalImageHeight = 0;
    this.customImageWidth = 0;
    this.customImageHeight = 0;
    
    // Clear exportNftsState from current project (if it exists) to prevent restoration
    if (window.currentProject) {
      delete window.currentProject.exportNftsState;
    }
    if (window.MemoryManager && window.MemoryManager.state && window.MemoryManager.state.currentProject) {
      delete window.MemoryManager.state.currentProject.exportNftsState;
    }
    
    // Close any open popups
    this.hideExportProgressPopup();
    
    // Clear any cached data
    if (window._imageDataCache) {
      window._imageDataCache.clear();
    }
    
    // Reset UI if tab is already initialized
    const tabContent = document.getElementById("export-nfts");
    if (tabContent && tabContent.innerHTML.trim() !== '') {
      // Tab is initialized, reinitialize it to reset everything
      setTimeout(() => {
        this.initializeTab();
      }, 100);
    }
    
    console.log("[Export NFTs] All state reset complete");
  },

  // Save state to project data
  saveState: function() {
    // Don't save during initialization
    if (this.isInitializing) {
      return;
    }
    
    // Debounce save calls to avoid excessive saves
    if (this.saveStateTimer) {
      clearTimeout(this.saveStateTimer);
    }
    
    this.saveStateTimer = setTimeout(() => {
      try {
        if (!window.currentProject) {
          // console.warn("[Export NFTs] No project to save state to");
          return;
        }

      // Collect current state from UI
      const state = {
        imageFormat: { ...this.imageFormat },
        metadataFormat: { ...this.metadataFormat },
        numBatches: this.numBatches,
        currentBatchPage: this.currentBatchPage, // Save current page
        blockchainToggles: { ...this.blockchainToggles },
        rarityRankEnabled: this.rarityRankEnabled,
        batchData: {}
      };

      // Collect batch data from DOM (for all 20 batches)
      for (let i = 1; i <= 20; i++) {
        const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
        const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
        const input = document.getElementById(`batch-input-${i}`);
        
        if (selectToExportToggle && alreadyMintedToggle && input) {
          state.batchData[i] = {
            quantity: parseInt(input.value) || 0,
            selectToExport: selectToExportToggle.classList.contains("active"),
            alreadyMinted: alreadyMintedToggle.classList.contains("active"),
            isActive: i <= this.numBatches
          };
        } else if (this.batchData[i]) {
          // Fallback to stored batchData if DOM elements not found
          state.batchData[i] = { ...this.batchData[i] };
        }
      }

      // Save to project data
      window.currentProject.exportNftsState = state;
      
      // Also update MemoryManager if available
      if (window.MemoryManager) {
        window.MemoryManager.updateProject({ exportNftsState: state });
      }
      
        // console.log("[Export NFTs] State saved to project");
      } catch (error) {
        // console.error("[Export NFTs] Error saving state:", error);
      }
    }, 300); // Debounce: save after 300ms of inactivity
  },

  // Restore state from project data (retrocompatible)
  restoreState: function() {
    try {
      if (!window.currentProject) {
        // console.log("[Export NFTs] No project to restore state from, using defaults");
        return;
      }

      const savedState = window.currentProject.exportNftsState;
      
      if (!savedState) {
        // console.log("[Export NFTs] No saved state found, using defaults");
        return;
      }

      // Restore state (retrocompatible - only restore if values exist)
      if (savedState.imageFormat) {
        this.imageFormat = { ...this.imageFormat, ...savedState.imageFormat };
      }
      
      if (savedState.metadataFormat) {
        this.metadataFormat = { ...this.metadataFormat, ...savedState.metadataFormat };
      }
      
      if (typeof savedState.numBatches === 'number' && savedState.numBatches >= 1 && savedState.numBatches <= 20) {
        this.numBatches = savedState.numBatches;
      }
      
      // Restore current batch page (default to 1 if not saved)
      if (typeof savedState.currentBatchPage === 'number' && savedState.currentBatchPage >= 1 && savedState.currentBatchPage <= 2) {
        this.currentBatchPage = savedState.currentBatchPage;
      } else {
        this.currentBatchPage = 1; // Default to page 1
      }
      
      if (savedState.blockchainToggles) {
        this.blockchainToggles = { ...this.blockchainToggles, ...savedState.blockchainToggles };
      }
      
      if (typeof savedState.rarityRankEnabled === 'boolean') {
        this.rarityRankEnabled = savedState.rarityRankEnabled;
      }
      
      if (savedState.batchData) {
        this.batchData = { ...this.batchData, ...savedState.batchData };
      }
      
      // console.log("[Export NFTs] State restored from project");
    } catch (error) {
      // console.error("[Export NFTs] Error restoring state:", error);
    }
  },

  // Apply restored state to UI elements
  applyRestoredState: function() {
    try {
      // Apply image format toggles
      const jpgToggle = document.getElementById("jpg-toggle");
      const pngToggle = document.getElementById("png-toggle");
      if (jpgToggle) {
        if (this.imageFormat.jpg) {
          jpgToggle.classList.add("active");
          this.updateToggleState(jpgToggle, true);
        } else {
          jpgToggle.classList.remove("active");
          this.updateToggleState(jpgToggle, false);
        }
      }
      if (pngToggle) {
        if (this.imageFormat.png) {
          pngToggle.classList.add("active");
          this.updateToggleState(pngToggle, true);
        } else {
          pngToggle.classList.remove("active");
          this.updateToggleState(pngToggle, false);
        }
      }

      // Apply metadata format toggles
      const jsonToggle = document.getElementById("json-toggle");
      const csvToggle = document.getElementById("csv-toggle");
      if (jsonToggle) {
        if (this.metadataFormat.json) {
          jsonToggle.classList.add("active");
          this.updateToggleState(jsonToggle, true);
        } else {
          jsonToggle.classList.remove("active");
          this.updateToggleState(jsonToggle, false);
        }
      }
      if (csvToggle) {
        if (this.metadataFormat.csv) {
          csvToggle.classList.add("active");
          this.updateToggleState(csvToggle, true);
        } else {
          csvToggle.classList.remove("active");
          this.updateToggleState(csvToggle, false);
        }
      }

      // Apply blockchain toggles
      const blockchainIds = ['ethereum', 'solana', 'bitcoin', 'cosmos', 'tezos', 'xrpl', 'polygon', 'immutablex', 'base', 'avalanche', 'flow', 'arbitrum'];
      blockchainIds.forEach(id => {
        const toggle = document.getElementById(id);
        if (toggle && this.blockchainToggles[id] !== undefined) {
          if (this.blockchainToggles[id]) {
            toggle.classList.add("active");
            this.updateToggleState(toggle, true);
          } else {
            toggle.classList.remove("active");
            this.updateToggleState(toggle, false);
          }
        }
      });

      // Apply rarity rank toggle
      const rarityToggle = document.getElementById("metadata.rarity.rank");
      if (rarityToggle) {
        if (this.rarityRankEnabled) {
          rarityToggle.classList.add("active");
          this.updateToggleState(rarityToggle, true);
        } else {
          rarityToggle.classList.remove("active");
          this.updateToggleState(rarityToggle, false);
        }
      }

      // Apply batch data
      for (let i = 1; i <= 20; i++) {
        const batchData = this.batchData[i];
        if (batchData) {
          const input = document.getElementById(`batch-input-${i}`);
          const selectToExportToggle = document.getElementById(`select-to-export-toggle-${i}`);
          const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
          const card = document.getElementById(`batch-card-${i}`);
          
          // Apply quantity
          if (input && typeof batchData.quantity === 'number') {
            input.value = String(batchData.quantity);
          }
          
          // Apply select to export state
          if (selectToExportToggle && typeof batchData.selectToExport === 'boolean') {
            if (batchData.selectToExport) {
              selectToExportToggle.classList.add("active");
              selectToExportToggle.style.backgroundColor = "#00ff88";
              selectToExportToggle.style.borderColor = "#00ff88";
              selectToExportToggle.style.color = "#000000";
              selectToExportToggle.style.fontWeight = "bold";
              selectToExportToggle.style.boxShadow = `
                inset 0 3px 5px rgba(0, 0, 0, 0.5),
                0 0 10px rgba(0, 255, 136, 0.5),
                0 0 20px rgba(0, 255, 136, 0.3)
              `;
              if (card && !batchData.alreadyMinted) {
                card.style.border = "2px solid #00ff48";
                card.setAttribute("data-selected-to-export", "true");
              }
            } else {
              selectToExportToggle.classList.remove("active");
              selectToExportToggle.style.backgroundColor = "#2a2a2a";
              selectToExportToggle.style.borderColor = "#4a4a4a";
              selectToExportToggle.style.color = "#ffffff";
              selectToExportToggle.style.boxShadow = "none";
              if (card && !batchData.alreadyMinted) {
                card.style.border = "2px solid #8b5cf6";
                card.removeAttribute("data-selected-to-export");
              }
            }
          }
          
          // Apply already minted state
          if (alreadyMintedToggle && typeof batchData.alreadyMinted === 'boolean') {
            if (batchData.alreadyMinted) {
              alreadyMintedToggle.classList.add("active");
              alreadyMintedToggle.style.backgroundColor = "#e74c3c";
              alreadyMintedToggle.style.borderColor = "#e74c3c";
              alreadyMintedToggle.style.color = "#ffffff";
              alreadyMintedToggle.style.fontWeight = "bold";
              alreadyMintedToggle.style.boxShadow = `
                inset 0 3px 5px rgba(0, 0, 0, 0.5),
                0 0 10px rgba(231, 76, 60, 0.8),
                0 0 20px rgba(231, 76, 60, 0.6),
                0 0 30px rgba(231, 76, 60, 0.4)
              `;
              alreadyMintedToggle.style.animation = "pulse-red 2s infinite";
              if (card) {
                card.style.background = "#5a1a1a";
                // Always use dark red border and remove green halo when ALREADY MINTED is active
                card.style.border = "2px solid #8b0000"; // Dark red border
                card.removeAttribute("data-selected-to-export"); // Remove halo effect
                card.style.boxShadow = "none"; // Remove any existing halo
              }
              if (input) {
                input.disabled = true;
                input.style.opacity = "1"; // Always fully opaque - use colors to indicate inactive state
              }
            } else {
              alreadyMintedToggle.classList.remove("active");
              alreadyMintedToggle.style.backgroundColor = "#2a2a2a";
              alreadyMintedToggle.style.borderColor = "#4a4a4a";
              alreadyMintedToggle.style.color = "#ffffff";
              alreadyMintedToggle.style.boxShadow = "none";
              alreadyMintedToggle.style.animation = "none";
              if (card) {
                card.style.background = "#1a1a1a";
                const isSelectedToExport = selectToExportToggle && selectToExportToggle.classList.contains("active");
                card.style.border = isSelectedToExport ? "2px solid #00ff48" : "2px solid #8b5cf6";
              }
              if (input) {
                input.disabled = false;
                input.style.opacity = "1";
              }
            }
          }
        }
      }

      // Update batch distribution
      this.updateBatchDistribution();
      
      // console.log("[Export NFTs] Restored state applied to UI");
    } catch (error) {
      // console.error("[Export NFTs] Error applying restored state:", error);
    }
  },


  // Setup event listeners
  setupEventListeners: function() {
    // Input validation for num-batches-input
    const numBatchesInput = document.getElementById("num-batches-input");
    if (numBatchesInput) {
      numBatchesInput.addEventListener("input", () => {
        const value = parseInt(numBatchesInput.value);
        if (value > 20) {
          // Show styled notification instead of alert
          if (window.NFTApp && window.NFTApp.modules && window.NFTApp.modules.confirmationModal) {
            window.NFTApp.modules.confirmationModal.show(
              "Maximum Batches Exceeded",
              "Maximum 20 batches allowed.",
              "",
              () => {},
              { singleButton: true, confirmText: "OK" }
            );
          } else {
          alert("Maximum 20 batches allowed");
          }
          numBatchesInput.value = "20";
        } else if (value < 1) {
          numBatchesInput.value = "1";
        }
      });

      numBatchesInput.addEventListener("blur", () => {
        const value = parseInt(numBatchesInput.value);
        if (value > 20) {
          // Show styled notification instead of alert
          if (window.NFTApp && window.NFTApp.modules && window.NFTApp.modules.confirmationModal) {
            window.NFTApp.modules.confirmationModal.show(
              "Maximum Batches Exceeded",
              "Maximum 20 batches allowed.",
              "",
              () => {},
              { singleButton: true, confirmText: "OK" }
            );
          } else {
          alert("Maximum 20 batches allowed");
          }
          numBatchesInput.value = "20";
        } else if (value < 1 || isNaN(value)) {
          numBatchesInput.value = "1";
        }
      });
    }

    // Batch input listeners are already set up in createBatchCard() to avoid duplicates
    // Auto-select functionality is handled in createBatchCard
    
    // Pagination event listeners
    const prevButton = document.getElementById("batch-pagination-prev");
    const nextButton = document.getElementById("batch-pagination-next");
    
    if (prevButton) {
      prevButton.addEventListener("click", () => {
        this.goToPreviousPage();
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener("click", () => {
        this.goToNextPage();
      });
    }
    
    // Check export button state on initialization
    this.checkExportButtonState();
  },

  // Update batch distribution and status text
  updateBatchDistribution: function() {
    // Use getTotalSupply() to get the actual total supply, or 0 if no project
    const totalSupply = this.getTotalSupply() || 0;
    
    let totalDistributed = 0;
    
    // Calculate total from active batches (considering all batches up to 20, even if not on current page)
    for (let i = 1; i <= this.numBatches; i++) {
      let quantity = 0;
      let isAlreadyMinted = false;
      
      // Always check batchData first as source of truth, then fall back to DOM
      if (this.batchData[i] && typeof this.batchData[i].quantity !== 'undefined') {
        // Use stored data (most reliable, works for all batches including those on other pages)
        quantity = parseInt(this.batchData[i].quantity) || 0;
        isAlreadyMinted = this.batchData[i].alreadyMinted === true;
      } else {
        // Fallback to DOM if batchData not available (for batches on current page)
        const input = document.getElementById(`batch-input-${i}`);
        const toggle = document.getElementById(`already-minted-toggle-${i}`);
        
        if (input) {
          quantity = parseInt(input.value) || 0;
          if (toggle) {
            isAlreadyMinted = toggle.classList.contains("active");
          }
        }
      }
      
      // Only count if not already minted
      if (!isAlreadyMinted) {
        totalDistributed += quantity;
      }
    }

    const remaining = totalSupply - totalDistributed;

    // Determine color based on remaining
    let distributionColor = "#f39c12"; // Default orange
    if (remaining === 0) {
      distributionColor = "#27ae60"; // Green
    } else if (remaining < 0) {
      distributionColor = "#e74c3c"; // Red
    }
    
    // Update all batch input colors to match distribution text color (for all 20 batches)
    for (let i = 1; i <= 20; i++) {
      const input = document.getElementById(`batch-input-${i}`);
      if (input && !input.disabled) {
        input.style.color = distributionColor;
      }
    }

    // Update status text for each batch card
    for (let i = 1; i <= this.numBatches; i++) {
      const statusElement = document.getElementById(`batch-status-${i}`);
      if (statusElement) {
        if (remaining === 0) {
          statusElement.textContent = "(0 NFTs to be distributed)";
          statusElement.style.color = "#27ae60";
          statusElement.style.fontWeight = "700";
        } else if (remaining > 0) {
          statusElement.textContent = `(${remaining} NFTs to be distributed)`;
          statusElement.style.color = "#f39c12";
          statusElement.style.fontWeight = "600";
        } else {
          const excess = Math.abs(remaining);
          statusElement.textContent = `(Over by ${excess} NFTs)`;
          statusElement.style.color = "#e74c3c";
          statusElement.style.fontWeight = "700";
          statusElement.style.fontSize = "9px";
        }
      }
    }

    // Update the batch distribution text in the title
    const batchDistributionText = document.getElementById("batch-distribution-text");
    const batchDistributionTextContent = document.getElementById("batch-distribution-text-content");
    if (batchDistributionText && batchDistributionTextContent) {
      if (remaining === 0) {
        batchDistributionTextContent.textContent = "(0 NFTs to be distributed)";
        batchDistributionTextContent.style.color = "#27ae60";
        batchDistributionText.style.fontWeight = "700";
        batchDistributionTextContent.style.fontSize = "11px"; // Reset font size
      } else if (remaining > 0) {
        batchDistributionTextContent.textContent = `(${remaining} NFTs to be distributed)`;
        batchDistributionTextContent.style.color = "#f39c12";
        batchDistributionText.style.fontWeight = "600";
        batchDistributionTextContent.style.fontSize = "11px"; // Reset font size
      } else {
        const excess = Math.abs(remaining);
        batchDistributionTextContent.textContent = `(Over by ${excess} NFTs)`;
        batchDistributionTextContent.style.color = "#e74c3c";
        batchDistributionText.style.fontWeight = "700";
        batchDistributionTextContent.style.fontSize = "9px";
      }
    }
  },

  // Handle Merge Metadata Files
  handleMergeMetadataFiles: async function() {
    // Create a hidden file input element
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json,.csv";
    fileInput.multiple = true;
    fileInput.style.display = "none";
    
    fileInput.addEventListener("change", async (e) => {
      const files = Array.from(e.target.files);
      
      // Clean up file input
      setTimeout(() => {
        if (fileInput.parentNode) {
          document.body.removeChild(fileInput);
        }
      }, 100);
      
      if (files.length === 0) {
        return;
      }
      
      if (files.length === 1) {
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(
            "Please select multiple metadata files to merge.",
            "error",
            3000
          );
        } else {
          alert("Please select multiple metadata files to merge.");
        }
        return;
      }
      
      try {
        // Show processing notification
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(
            `Processing ${files.length} metadata files...`,
            "info",
            2000
          );
        }
        
        // Determine file format (check first file)
        const firstFile = files[0];
        const isJSON = firstFile.name.toLowerCase().endsWith('.json');
        const isCSV = firstFile.name.toLowerCase().endsWith('.csv');
        
        if (!isJSON && !isCSV) {
          throw new Error("Unsupported file format. Please select JSON or CSV files.");
        }
        
        let mergedData;
        let fileExtension;
        
        if (isJSON) {
          // Merge JSON files
          const allMetadata = [];
          
          for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.json')) {
              continue; // Skip non-JSON files
            }
            
            const text = await file.text();
            let parsed;
            
            try {
              parsed = JSON.parse(text);
            } catch (parseError) {
              console.warn(`Failed to parse ${file.name}:`, parseError);
              continue; // Skip invalid JSON files
            }
            
            // Handle both array and single object formats
            if (Array.isArray(parsed)) {
              allMetadata.push(...parsed);
            } else if (typeof parsed === 'object' && parsed !== null) {
              allMetadata.push(parsed);
            }
          }
          
          // Remove duplicates based on name or image (if available)
          const seen = new Set();
          const uniqueMetadata = [];
          for (const item of allMetadata) {
            const key = item.name || item.image || JSON.stringify(item);
            if (!seen.has(key)) {
              seen.add(key);
              uniqueMetadata.push(item);
            }
          }
          
          mergedData = JSON.stringify(uniqueMetadata, null, 2);
          fileExtension = 'json';
        } else {
          // Merge CSV files
          let headers = null;
          const allRows = [];
          
          for (const file of files) {
            if (!file.name.toLowerCase().endsWith('.csv')) {
              continue; // Skip non-CSV files
            }
            
            const text = await file.text();
            const lines = text.split('\n').filter(line => line.trim());
            
            if (lines.length === 0) {
              continue;
            }
            
            // Parse CSV (simple parser - handles quoted values)
            const parseCSVLine = (line) => {
              const result = [];
              let current = '';
              let inQuotes = false;
              
              for (let i = 0; i < line.length; i++) {
                const char = line[i];
                
                if (char === '"') {
                  if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++; // Skip next quote
                  } else {
                    inQuotes = !inQuotes;
                  }
                } else if (char === ',' && !inQuotes) {
                  result.push(current);
                  current = '';
                } else {
                  current += char;
                }
              }
              result.push(current);
              return result;
            };
            
            // First line is header
            if (!headers) {
              headers = parseCSVLine(lines[0]);
            }
            
            // Add data rows
            for (let i = 1; i < lines.length; i++) {
              const row = parseCSVLine(lines[i]);
              if (row.length === headers.length) {
                allRows.push(row);
              }
            }
          }
          
          // Remove duplicate rows (based on first column - usually Name)
          const seenRows = new Set();
          const uniqueRows = [];
          for (const row of allRows) {
            const key = row[0] || JSON.stringify(row);
            if (!seenRows.has(key)) {
              seenRows.add(key);
              uniqueRows.push(row);
            }
          }
          
          // Build CSV content
          let csvContent = headers.join(',') + '\n';
          for (const row of uniqueRows) {
            // Escape values that contain commas or quotes
            const escapedRow = row.map(cell => {
              if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
                return `"${cell.replace(/"/g, '""')}"`;
              }
              return cell;
            });
            csvContent += escapedRow.join(',') + '\n';
          }
          
          mergedData = csvContent;
          fileExtension = 'csv';
        }
        
        // Create download
        const blob = new Blob([mergedData], { type: fileExtension === 'json' ? 'application/json' : 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Generate filename with timestamp
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
        const timeStr = now.toTimeString().split(' ')[0].replace(/:/g, '');
        a.download = `merged_metadata_${dateStr}_${timeStr}.${fileExtension}`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        // Show success notification
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(
            `Successfully merged ${files.length} metadata files into one file.`,
            "success",
            3000
          );
        }
      } catch (error) {
        console.error("Error merging metadata files:", error);
        if (window.NFTApp && window.NFTApp.getModule && window.NFTApp.getModule("notificationService")) {
          window.NFTApp.getModule("notificationService").show(
            `Failed to merge metadata files: ${error.message || "Unknown error"}`,
            "error",
            5000
          );
        } else {
          alert(`Failed to merge metadata files: ${error.message || "Unknown error"}`);
        }
      }
    });
    
    // Handle cancellation (user closes file picker without selecting)
    fileInput.addEventListener("cancel", () => {
      setTimeout(() => {
        if (fileInput.parentNode) {
          document.body.removeChild(fileInput);
        }
      }, 100);
    });
    
    // Trigger file picker
    document.body.appendChild(fileInput);
    fileInput.click();
  },

  // Handle "SELECT ALL BATCHES" toggle click
  handleSelectAllBatchesToggle: function() {
    const selectAllBatchesToggle = document.getElementById("select-all-batches-toggle");
    if (!selectAllBatchesToggle) return;
    
    const isCurrentlyActive = this.selectAllBatchesActive;
    
    if (!isCurrentlyActive) {
      // Activating: Save current selection state, then select all batches
      this.previousBatchSelection = {};
      
      // Save current selection state for all batches (1-20)
      for (let i = 1; i <= 20; i++) {
        const toggle = document.getElementById(`select-to-export-toggle-${i}`);
        const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
        const input = document.getElementById(`batch-input-${i}`);
        
        if (toggle && alreadyMintedToggle && input && !input.disabled) {
          const isSelected = toggle.classList.contains("active");
          const isAlreadyMinted = alreadyMintedToggle.classList.contains("active");
          this.previousBatchSelection[i] = {
            selectToExport: isSelected,
            alreadyMinted: isAlreadyMinted
          };
        } else if (this.batchData[i]) {
          // Fallback to batchData if DOM elements not available
          this.previousBatchSelection[i] = {
            selectToExport: this.batchData[i].selectToExport === true,
            alreadyMinted: this.batchData[i].alreadyMinted === true
          };
        }
      }
      
      // Now select all batches (equivalent to pressing all "SELECT FOR EXPORT" toggles)
      // This includes batches on both page 1 and page 2, even if not currently visible
      for (let i = 1; i <= 20; i++) {
        const toggle = document.getElementById(`select-to-export-toggle-${i}`);
        const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
        const input = document.getElementById(`batch-input-${i}`);
        
        // Ensure batchData entry exists
        if (!this.batchData[i]) {
          this.batchData[i] = {};
        }
        
        // Check if batch is already minted (from DOM or batchData)
        let isAlreadyMinted = false;
        if (alreadyMintedToggle) {
          isAlreadyMinted = alreadyMintedToggle.classList.contains("active");
        } else if (this.batchData[i].alreadyMinted === true) {
          isAlreadyMinted = true;
        }
        
        // Only select batches that are not already minted
        if (!isAlreadyMinted) {
          // If DOM elements exist (batch is on current page), click the toggle
          if (toggle && alreadyMintedToggle && input && !input.disabled) {
            if (!toggle.classList.contains("active")) {
              toggle.click(); // Trigger the toggle click to ensure all side effects happen
            }
          } else {
            // Batch is on another page - update batchData directly
            // This ensures the batch will be selected when the user switches to that page
            this.batchData[i].selectToExport = true;
          }
        }
      }
      
      this.selectAllBatchesActive = true;
      
      // Save state to ensure selections persist across page switches
      this.saveState();
    } else {
      // Deactivating: Restore previous selection state
      // This includes batches on both page 1 and page 2, even if not currently visible
      for (let i = 1; i <= 20; i++) {
        if (this.previousBatchSelection[i]) {
          const toggle = document.getElementById(`select-to-export-toggle-${i}`);
          const previousState = this.previousBatchSelection[i];
          
          // Ensure batchData entry exists
          if (!this.batchData[i]) {
            this.batchData[i] = {};
          }
          
          if (toggle) {
            // Batch is on current page - update via DOM
            const isCurrentlyActive = toggle.classList.contains("active");
            const shouldBeActive = previousState.selectToExport === true;
            
            // Only toggle if state doesn't match
            if (isCurrentlyActive !== shouldBeActive) {
              toggle.click(); // Trigger the toggle click to ensure all side effects happen
            }
          } else {
            // Batch is on another page - update batchData directly
            // This ensures the batch will be restored when the user switches to that page
            this.batchData[i].selectToExport = previousState.selectToExport === true;
          }
        } else {
          // No previous state saved for this batch - deselect it
          if (!this.batchData[i]) {
            this.batchData[i] = {};
          }
          this.batchData[i].selectToExport = false;
        }
      }
      
      this.selectAllBatchesActive = false;
      this.previousBatchSelection = {}; // Clear previous selection after restoring
    }
    
    // Update toggle visual state
    this.updateSelectAllBatchesToggleState();
    
    // Check export button state
    this.checkExportButtonState();
    
    // Save state
    this.saveState();
  },

  // Update "SELECT ALL BATCHES" toggle visual state
  updateSelectAllBatchesToggleState: function() {
    const selectAllBatchesToggle = document.getElementById("select-all-batches-toggle");
    if (!selectAllBatchesToggle) return;
    
    if (this.selectAllBatchesActive) {
      // Active state: green background, darker green border
      selectAllBatchesToggle.style.background = "#00ff88";
      selectAllBatchesToggle.style.border = "2px solid #00ff88";
      selectAllBatchesToggle.style.borderWidth = "2px";
      selectAllBatchesToggle.style.borderStyle = "solid";
      selectAllBatchesToggle.style.borderColor = "#00ff88";
      selectAllBatchesToggle.style.setProperty("color", "#00ff88", "important"); // Always use green color for text - use !important
      selectAllBatchesToggle.style.fontWeight = "600"; // Keep same font weight to prevent text stretching
      selectAllBatchesToggle.style.transform = "none"; // Ensure no transform
      selectAllBatchesToggle.style.boxShadow = `
        inset 0 3px 5px rgba(0, 0, 0, 0.5),
        0 0 10px rgba(0, 255, 136, 0.5),
        0 0 20px rgba(0, 255, 136, 0.3)
      `;
    } else {
      // Inactive state: dark background, grey border, green text
      selectAllBatchesToggle.style.background = "#111111";
      selectAllBatchesToggle.style.border = "2px solid #666666";
      selectAllBatchesToggle.style.borderWidth = "2px";
      selectAllBatchesToggle.style.borderStyle = "solid";
      selectAllBatchesToggle.style.borderColor = "#666666";
      selectAllBatchesToggle.style.setProperty("color", "#00ff88", "important"); // Always use green color for text - use !important
      selectAllBatchesToggle.style.fontWeight = "600";
      selectAllBatchesToggle.style.transform = "none"; // Ensure no transform
      selectAllBatchesToggle.style.boxShadow = "none";
    }
  },

  // Check if all batches are selected (to auto-activate toggle if needed)
  checkIfAllBatchesSelected: function() {
    let allSelected = true;
    let hasSelectableBatches = false;
    
    // Check all batches (1-20)
    for (let i = 1; i <= 20; i++) {
      const toggle = document.getElementById(`select-to-export-toggle-${i}`);
      const alreadyMintedToggle = document.getElementById(`already-minted-toggle-${i}`);
      const input = document.getElementById(`batch-input-${i}`);
      
      if (toggle && alreadyMintedToggle && input && !input.disabled) {
        const isAlreadyMinted = alreadyMintedToggle.classList.contains("active");
        if (!isAlreadyMinted) {
          hasSelectableBatches = true;
          const isSelected = toggle.classList.contains("active");
          if (!isSelected) {
            allSelected = false;
            break;
          }
        }
      }
    }
    
    // Only auto-activate if all selectable batches are selected and we have at least one selectable batch
    if (allSelected && hasSelectableBatches && !this.selectAllBatchesActive) {
      // Don't auto-activate - let user control it manually
      // This prevents unwanted state changes when batches are restored
    }
  }
};

// Register the module
// console.log("[Export NFTs] Registering module...");
NFTApp.registerModule("exportNfts", exportNftsModuleDefinition);
// console.log("[Export NFTs] Module registered successfully");

// Auto-initialize the module when script loads
const tryInit = () => {
  // console.log("[Export NFTs] Attempting auto-initialization");
  const module = NFTApp.modules ? NFTApp.modules.exportNfts : null;
  if (module && typeof module.init === 'function') {
    // console.log("[Export NFTs] Found module, calling init()");
    module.init();
  } else {
    // console.warn("[Export NFTs] Module not found or init not available", {
    //   hasModules: !!NFTApp.modules,
    //   module: module,
    //   hasInit: module && typeof module.init === 'function'
    // });
  }
};

// Try immediate initialization
// console.log("[Export NFTs] Setting up auto-initialization, readyState:", document.readyState);
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // console.log("[Export NFTs] DOM already ready, scheduling init");
  setTimeout(tryInit, 100);
} else {
  // console.log("[Export NFTs] Waiting for DOMContentLoaded");
  document.addEventListener('DOMContentLoaded', () => {
    // console.log("[Export NFTs] DOMContentLoaded fired, scheduling init");
    setTimeout(tryInit, 100);
  });
}

// Also try after a longer delay in case initModules hasn't run yet
setTimeout(() => {
  // console.log("[Export NFTs] Delayed initialization attempt (1s)");
  tryInit();
}, 1000);

// Force initialization after 2 seconds
setTimeout(() => {
  // console.log("[Export NFTs] Force initialization attempt (2s)");
  const module = NFTApp.modules ? NFTApp.modules.exportNfts : null;
  if (module) {
    if (typeof module.fixTabLabel === 'function') {
      module.fixTabLabel();
    }
    if (typeof module.init === 'function') {
      module.init();
    }
  } else {
    // console.error("[Export NFTs] Module still not found after 2 seconds!");
  }
}, 2000);

