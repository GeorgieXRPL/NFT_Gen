# Tab Scrolling Control System

This system allows you to control which tabs in your navigation bar can scroll vertically and which cannot.

## Quick Setup

### 1. Include the Files

Add these files to your project:

```html
<!-- CSS -->
<link rel="stylesheet" href="css/tab-scrolling-control.css">

<!-- JavaScript -->
<script src="js/tab-scrolling-controller.js"></script>
```

### 2. Default Configuration

The system comes with these default settings:

- ❌ **Collection Info** (`general-info`) - SCROLL DISABLED
- ✅ **Traits & Rules** (`traits-rules`) - SCROLL ENABLED  
- ❌ **Generate NFTs** (`generate-nfts`) - SCROLL DISABLED
- ❌ **Generate Metadata** (`generate-metadata`) - SCROLL DISABLED (user will decide later)
- ❌ **Export NFTs** (`export-nfts`) - SCROLL DISABLED (user will decide later)

## Usage Methods

### Method 1: JavaScript API (Recommended)

```javascript
// Enable scrolling for a specific tab
TabScrollingController.enableScrolling('traits-rules');

// Disable scrolling for a specific tab
TabScrollingController.disableScrolling('general-info');

// Toggle scrolling for a specific tab
TabScrollingController.toggleScrolling('generate-metadata');

// Set configuration for multiple tabs
TabScrollingController.setScrollingConfig({
    'general-info': false,     // Collection Info - SCROLL DISABLED
    'traits-rules': true,      // Traits & Rules - SCROLL ENABLED  
    'generate-nfts': false,    // Generate NFTs - SCROLL DISABLED
    'generate-metadata': false, // Generate Metadata - SCROLL DISABLED (user will decide later)
    'export-nfts': false       // Export NFTs - SCROLL DISABLED (user will decide later)
});

// Get current configuration
const config = TabScrollingController.getScrollingConfig();

// Reset to defaults
TabScrollingController.resetToDefaults();
```

### Method 2: CSS Classes

Add classes directly to your HTML:

```html
<!-- Tab that can scroll -->
<div id="traits-rules" class="tab-content scroll-enabled">

<!-- Tab that cannot scroll -->
<div id="general-info" class="tab-content scroll-disabled">
```

### Method 3: Individual Tab CSS

Override specific tabs in your CSS:

```css
/* Enable scrolling for specific tab */
#traits-rules.tab-content {
    overflow-y: auto !important;
    overflow-x: hidden !important;
}

/* Disable scrolling for specific tab */
#general-info.tab-content {
    overflow-y: hidden !important;
    overflow-x: hidden !important;
}
```

## Available Tabs

Your application has these tabs:

1. `general-info` - Collection Info
2. `traits-rules` - Traits & Rules
3. `generate-nfts` - Generate NFTs
4. `generate-metadata` - Generate Metadata
5. `export-nfts` - Export NFTs

## Customization Examples

### Example 1: Disable Scrolling for All Tabs

```javascript
TabScrollingController.setScrollingConfig({
    'general-info': false,
    'traits-rules': false,
    'generate-nfts': false,
    'generate-metadata': false,
    'export-nfts': false
});
```

### Example 2: Enable Scrolling for All Tabs

```javascript
TabScrollingController.setScrollingConfig({
    'general-info': true,
    'traits-rules': true,
    'generate-nfts': true,
    'generate-metadata': true,
    'export-nfts': true
});
```

### Example 3: Custom Configuration

```javascript
// Only allow scrolling on content-heavy tabs
TabScrollingController.setScrollingConfig({
    'general-info': false,     // Fixed layout - no scrolling needed
    'traits-rules': true,      // Has trait lists - needs scrolling
    'generate-nfts': false,   // Fixed layout - no scrolling needed
    'generate-metadata': true, // Has forms - might need scrolling
    'export-nfts': false      // Fixed layout - no scrolling needed
});
```

## Debug Mode

Enable visual indicators to see which tabs can scroll:

```javascript
// Enable debug mode (shows colored indicators)
TabScrollingController.enableDebugMode();

// Disable debug mode
TabScrollingController.disableDebugMode();
```

## Responsive Behavior

On mobile devices (screens < 768px), all tabs will scroll regardless of configuration for better usability.

## Integration with Your App

The system automatically:

1. ✅ Applies scrolling settings when tabs are switched
2. ✅ Integrates with your existing navigation system
3. ✅ Maintains settings across tab changes
4. ✅ Provides smooth scrolling with custom scrollbars

## Troubleshooting

### Problem: Scrolling not working
**Solution**: Check if the CSS file is loaded and the JavaScript is initialized.

### Problem: Settings not persisting
**Solution**: The system automatically applies settings when tabs change. No persistence needed.

### Problem: Mobile scrolling issues
**Solution**: On mobile, all tabs scroll by default for better usability.

## Advanced Usage

### Custom Scrollbar Styling

Modify the scrollbar appearance in `css/tab-scrolling-control.css`:

```css
.tab-content.scroll-enabled::-webkit-scrollbar {
    width: 12px; /* Make scrollbar wider */
    background: #your-color; /* Change background */
}

.tab-content.scroll-enabled::-webkit-scrollbar-thumb {
    background: #your-color; /* Change thumb color */
    border-radius: 6px; /* Change border radius */
}
```

### Dynamic Configuration

Change scrolling behavior based on content:

```javascript
// Check if tab has a lot of content
function updateScrollingBasedOnContent(tabId) {
    const tab = document.getElementById(tabId);
    const contentHeight = tab.scrollHeight;
    const containerHeight = tab.clientHeight;
    
    if (contentHeight > containerHeight) {
        TabScrollingController.enableScrolling(tabId);
    } else {
        TabScrollingController.disableScrolling(tabId);
    }
}
```

## Support

The system is designed to work with your existing navigation structure. If you encounter issues:

1. Check browser console for error messages
2. Verify tab IDs match your HTML
3. Ensure CSS and JavaScript files are loaded
4. Use debug mode to visualize current settings
