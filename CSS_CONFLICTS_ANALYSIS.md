# CSS Conflicts Analysis

This document tracks all identified CSS conflicts and their resolutions.

## 🔴 Critical Conflicts Found

### 1. Duplicate CSS Variable Definitions

**Location:** `css/main.css` vs `css/styles.css`

**Conflict:**
- `main.css` line 3: `--bg-primary: #121212;`
- `styles.css` line 2: `--bg-primary: #000000;` (comment: "Changed from #0f0f13 to full black")

**Resolution:** ✅ Consolidated into `css/base/theme.css` using `#000000` (styles.css value)

**Conflict:**
- `main.css` line 4: `--bg-secondary: #1e1e1e;`
- `styles.css` line 3: `--bg-secondary: #111111;`

**Resolution:** ✅ Consolidated into `css/base/theme.css` using `#111111` (styles.css value)

---

### 2. Tooltip Style Conflicts

**Files with tooltip styles (to be consolidated):**
1. `css/tooltip-fix.css`
2. `css/tooltips-consolidated.css` (975 lines!)
3. `css/randomize-tooltip-fix.css`
4. `css/enhanced-randomize-tooltip.css`
5. `css/nft-action-buttons-tooltips.css`
6. `css/override-randomize-tooltip.css`
7. `css/direct-randomize-tooltip.css`
8. `css/force-randomize-tooltip.css`
9. `css/specific-tooltips-fix.css`
10. `css/injected-tooltips.css`

**Status:** 🔄 In Progress - Consolidating into `css/components/tooltip.css`

---

### 3. Font Override Conflicts

**Files:**
- `css/font-archivo-override.css` - Forces Archivo font with `!important`
- `css/main.css` line 63-65 - Also applies Archivo font with `!important`
- `css/styles.css` line 51 - Also applies Archivo font

**Resolution:** ✅ Consolidated into `css/base/theme.css` (single `!important` rule)

---

### 4. Button Style Conflicts

**Files:**
- `css/button-enhancements.css`
- `css/final-overrides.css` (multiple button overrides)
- `css/main.css` (button styles)
- `css/styles.css` (button styles)

**Status:** 🔄 To be consolidated into `css/components/buttons.css`

---

### 5. Trait Layer Style Conflicts

**Files:**
- `css/trait-layers-consolidated.css`
- `css/trait-layers.css`
- `css/trait-layers-enhancements.css`
- `css/trait-layers-drag-drop.css`
- `css/trait-layers-drag-drop-enhanced.css`
- `css/trait-layers-header-fix.css`
- `css/trait-layers-error-icon-fix.css`
- `css/trait-buttons-fix.css`
- `css/trait-layer-slider-fix.css`
- `css/trait-layer-slider-max-width.css`
- `css/trait-layer-expanded-alignment.css`
- `css/expanded-trait-layer-cards.css`

**Status:** 🔄 To be consolidated into `css/layout/traits-panel.css`

---

### 6. Modal Style Conflicts

**Files:**
- `css/saved-seeds-modal.css`
- `css/saved-seeds-modal-fix.css`
- `css/dark-traits-modal.css`
- `css/select-trait-modal.css`
- `css/select-trait-modal-fixes.css`
- `css/combination-rule-modal.css`
- `css/batch-generation-modal.css`
- `css/nfts-collection-modal-fix.css`
- `css/nft-edit-modal-alignment-fix.css`

**Status:** 🔄 To be consolidated into `css/components/modals.css`

---

### 7. Navigation Style Conflicts

**Files:**
- `css/navigation-black-background-fix.css`
- `css/main.css` (navigation styles)
- `css/styles.css` (navigation styles)

**Status:** 🔄 To be consolidated into `css/components/navigation.css`

---

### 8. Override Files (Anti-pattern)

**Files with "override" or "fix" in name:**
- `css/final-overrides.css` (9271 lines!)
- `css/styles-fix.css`
- `css/tooltip-fix.css`
- `css/trait-layers-header-fix.css`
- `css/trait-layers-error-icon-fix.css`
- `css/trait-buttons-fix.css`
- `css/trait-layer-slider-fix.css`
- `css/navigation-black-background-fix.css`
- `css/randomize-tooltip-fix.css`
- `css/traits-panel-fix.css`
- `css/edit-button-fix.css`
- `css/nft-edit-modal-alignment-fix.css`
- `css/nfts-collection-modal-fix.css`
- `css/saved-seeds-modal-fix.css`
- `css/select-trait-modal-fixes.css`
- `css/feedback-dialog-fix.css`
- `css/feedback-left-position.css`
- `css/exact-feedback-position.css`
- `css/generate-nfts-content-area-fix.css`
- `css/traits-rules-scrollbar-fix.css`
- `css/landing-title-override-fix.css`
- `css/collection-info-override.css`

**Status:** 🔄 All to be merged into appropriate component/layout files

---

## 📊 Statistics

- **Total CSS files:** 63
- **Files with `!important`:** 80 files
- **Override/Fix files:** 22 files
- **Tooltip-related files:** 10 files
- **Modal-related files:** 9 files
- **Trait layer files:** 12 files

---

## ✅ Resolution Plan

1. ✅ Create unified `css/base/theme.css` (DONE)
2. 🔄 Consolidate tooltip styles into `css/components/tooltip.css` (IN PROGRESS)
3. ⏳ Consolidate button styles into `css/components/buttons.css`
4. ⏳ Consolidate modal styles into `css/components/modals.css`
5. ⏳ Consolidate trait layer styles into `css/layout/traits-panel.css`
6. ⏳ Update `index.html` to load new structure
7. ⏳ Remove old CSS files after verification
8. ⏳ Test visual output

---

**Last Updated:** 2024

