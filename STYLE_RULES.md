# Style Rules & Contracts

This document defines the **single source of truth** for styling rules in the NFT Collection Creator Pro application. All styling must follow these contracts to prevent conflicts and overrides.

---

## 🎨 **Styling System**

**Primary System:** Pure CSS with CSS Custom Properties (CSS Variables)

**No frameworks used:**
- ❌ No Tailwind CSS
- ❌ No styled-components
- ❌ No CSS Modules
- ❌ No Bootstrap
- ✅ Pure CSS with CSS Variables

---

## 📁 **CSS File Structure**

All CSS files must be organized in the following structure:

```
css/
├── base/
│   ├── theme.css          # CSS Variables (single source of truth)
│   ├── reset.css          # CSS Reset (if needed)
│   └── typography.css     # Font definitions
├── components/
│   ├── tooltip.css        # ALL tooltip styles (consolidated)
│   ├── buttons.css        # Button styles
│   ├── modals.css         # Modal styles
│   ├── forms.css          # Form input styles
│   └── navigation.css     # Navigation styles
├── layout/
│   ├── traits-panel.css   # Traits panel layout
│   ├── generate-nfts.css  # Generate NFTs tab layout
│   └── export-nfts.css    # Export NFTs tab layout
└── main.css               # Main entry point (imports all above)
```

---

## 🎯 **CSS Variables (Theme)**

**Location:** `css/base/theme.css`

All color, spacing, and design tokens must be defined in `theme.css` using CSS custom properties. No duplicate variable definitions allowed.

### Color Palette

```css
/* Background Colors */
--bg-primary: #121212;
--bg-secondary: #1e1e1e;
--bg-tertiary: #2a2a2a;

/* Text Colors */
--text-primary: #ffffff;
--text-secondary: #aaaaaa;
--text-tertiary: #666666;

/* Accent Colors */
--accent-primary: #6c5ce7;
--accent-secondary: #a29bfe;
--accent-tertiary: #4834d4;

/* Status Colors */
--error-color: #ff6b6b;
--success-color: #1dd1a1;
--warning-color: #feca57;
```

### Tooltip Theme

```css
/* Tooltip Colors - STANDARD ACROSS ENTIRE APP */
--tooltip-bg: #000000;           /* Black background */
--tooltip-text: #f39c12;        /* Orange text */
--tooltip-padding: 8px 12px;     /* Equal top/bottom padding */
--tooltip-font-size: 11px;
--tooltip-border-radius: 6px;
--tooltip-z-index: 2147483647;   /* Maximum z-index */
--tooltip-transition: opacity 1s ease;
```

### Typography

```css
/* Font Family */
--font-family: "Archivo", sans-serif;

/* Font Weights */
--font-weight-thin: 100;
--font-weight-regular: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### Spacing Scale

```css
/* Use these spacing values - no arbitrary values */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
```

### Border Radius

```css
/* Allowed border radius values */
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
```

---

## 🔧 **Tooltip System Rules**

### Single Source of Truth

**ALL tooltip styles must be in:** `css/components/tooltip.css`

**Files to be consolidated:**
- ❌ `tooltip-fix.css`
- ❌ `tooltips-consolidated.css`
- ❌ `randomize-tooltip-fix.css`
- ❌ `enhanced-randomize-tooltip.css`
- ❌ `nft-action-buttons-tooltips.css`
- ❌ `override-randomize-tooltip.css`
- ❌ `direct-randomize-tooltip.css`
- ❌ `force-randomize-tooltip.css`
- ❌ `specific-tooltips-fix.css`
- ❌ `injected-tooltips.css`
- ✅ **All consolidated into:** `css/components/tooltip.css`

### Tooltip Visual Standards

**ALL tooltips must use:**
- Background: `#000000` (black)
- Text color: `#f39c12` (orange)
- Font: `Archivo`, `11px`
- Padding: `8px 12px` (equal top/bottom)
- Border radius: `6px`
- Z-index: `2147483647` (maximum)
- Transition: `opacity 1s ease`
- Text alignment: `center`
- Line height: `1.2`

### Tooltip Positioning

- **Default:** Above element, centered
- **Positioning:** `position: fixed` (controlled by JavaScript)
- **Visibility:** Controlled by JavaScript (not CSS `:hover`)

### Tooltip Cursor

- **Default:** `cursor: help` for all tooltip elements
- **Exception:** Navigation tabs use `cursor: pointer`
- **Disabled elements:** `cursor: default` (no tooltip shown)

---

## 🚫 **Forbidden Practices**

### ❌ DO NOT:

1. **Create new CSS files** unless explicitly adding a new component category
2. **Use `!important`** unless absolutely necessary (only for critical overrides)
3. **Define CSS variables** in multiple files (only in `theme.css`)
4. **Create tooltip styles** outside of `tooltip.css`
5. **Use inline styles** in HTML (except for dynamic JavaScript-controlled styles)
6. **Create override files** (e.g., `*-override.css`, `*-fix.css`)
7. **Duplicate styles** across multiple files
8. **Use arbitrary values** - use CSS variables from theme.css

### ✅ DO:

1. **Use CSS variables** from `theme.css` for all colors, spacing, fonts
2. **Consolidate related styles** into appropriate component files
3. **Follow the file structure** defined above
4. **Document exceptions** in comments if `!important` is necessary
5. **Test visual output** after any style changes

---

## 📐 **Component Naming Rules**

### Class Naming Convention

- Use **kebab-case**: `.trait-layer-header`
- Use **descriptive names**: `.trait-layer-drag-handle` (not `.drag1`)
- Use **BEM-like structure** for components: `.component__element--modifier`

### Tooltip Classes

- **Base class:** `.tooltip`
- **Tooltip text:** `.tooltiptext`
- **Variants:** `.tooltip-bottom`, `.tooltip-left`, `.tooltip-right`

---

## 🎯 **Z-Index Layers**

Define z-index values in `theme.css`:

```css
--z-base: 1;
--z-dropdown: 1000;
--z-sticky: 1020;
--z-fixed: 1030;
--z-modal-backdrop: 1040;
--z-modal: 1050;
--z-popover: 1060;
--z-tooltip: 2147483647;  /* Maximum z-index for tooltips */
```

---

## 🔍 **Conflict Resolution**

### When Styles Conflict:

1. **Check `theme.css`** - ensure variable is defined
2. **Check component file** - ensure style is in correct component file
3. **Remove duplicate** - delete conflicting rule from other files
4. **Update `index.html`** - ensure correct load order

### Load Order in `index.html`:

1. `css/base/theme.css` (variables first)
2. `css/base/typography.css`
3. `css/components/*.css` (alphabetical)
4. `css/layout/*.css` (alphabetical)

---

## 📝 **Migration Checklist**

When refactoring styles:

- [ ] Check if CSS variable exists in `theme.css`
- [ ] Move style to appropriate component file
- [ ] Remove duplicate/conflicting rules
- [ ] Remove `!important` if not needed
- [ ] Test visual output
- [ ] Update this document if adding new rules

---

## 🎨 **Visual Consistency**

### Buttons

- **Primary buttons:** Purple (`--accent-primary`), 8px border radius, 35-38px height
- **Hover state:** Darker purple (`--button-hover`)
- **Danger buttons:** Red (`--button-danger`)

### Modals

- **Background:** `--bg-secondary`
- **Border:** `1px solid --border-color`
- **Border radius:** `12px`
- **Padding:** `30px`

### Forms

- **Input background:** `--input-bg`
- **Border:** `1px solid --border-color`
- **Border radius:** `6px`
- **Focus:** Accent color border

---

## 📚 **References**

- **CSS Variables:** [MDN CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- **BEM Methodology:** [BEM Naming](http://getbem.com/)

---

**Last Updated:** 2024
**Maintained By:** Development Team

