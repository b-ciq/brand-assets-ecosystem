# Remove 2-Color CIQ Logos Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove all instances and references to 2-color CIQ logos (green C + grey IQ) from the codebase, keeping only 1-color variants.

**Architecture:** Delete 2-color SVG files, remove backend data entries, update frontend metadata arrays, simplify frontend logic that handles color variants.

**Tech Stack:** Python (CLI backend), TypeScript/React (Next.js frontend), SVG assets

---

## Task 1: Remove 2-Color Logo Files

**Files:**
- Delete: `interfaces/web-gui/public/assets/global/CIQ_logos/CIQ_logo_2clr_darkmode.svg`
- Delete: `interfaces/web-gui/public/assets/global/CIQ_logos/CIQ_logo_2clr_lightmode.svg`

**Step 1: Verify files exist**

Run: `ls -la interfaces/web-gui/public/assets/global/CIQ_logos/`
Expected: Shows 4 files including both 2clr variants

**Step 2: Delete 2-color logo files**

```bash
rm interfaces/web-gui/public/assets/global/CIQ_logos/CIQ_logo_2clr_darkmode.svg
rm interfaces/web-gui/public/assets/global/CIQ_logos/CIQ_logo_2clr_lightmode.svg
```

**Step 3: Verify deletion**

Run: `ls -la interfaces/web-gui/public/assets/global/CIQ_logos/`
Expected: Shows only 2 files (1clr_darkmode.svg and 1clr_lightmode.svg)

**Step 4: Commit deletion**

```bash
git add -A interfaces/web-gui/public/assets/global/CIQ_logos/
git commit -m "chore: remove 2-color CIQ logo files

Remove CIQ_logo_2clr_darkmode.svg and CIQ_logo_2clr_lightmode.svg.
Keeping only 1-color variants as per design system guidelines.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Remove Backend References (CLI Wrapper)

**Files:**
- Modify: `interfaces/mcp-server/cli_wrapper.py:170-191`

**Step 1: Verify current ciq_logos dictionary**

Run: `grep -A 30 "ciq_logos = {" interfaces/mcp-server/cli_wrapper.py`
Expected: Shows 4 entries (1color_light, 1color_dark, 2color_light, 2color_dark)

**Step 2: Remove 2-color entries from ciq_logos dictionary**

Remove these two dictionary entries from `cli_wrapper.py` (lines 170-191):

```python
# REMOVE THESE ENTRIES:
            "2color_light": {
                "url": "/assets/global/CIQ_logos/CIQ_logo_2clr_lightmode.svg",
                "filename": "CIQ_logo_2clr_lightmode.svg",
                "background": "light",
                "color": "multicolor",
                "layout": "horizontal",
                "colorVariant": "2-color",
                "type": "logo",
                "size": "large",
                "tags": ["company", "hero", "premium"]
            },
            "2color_dark": {
                "url": "/assets/global/CIQ_logos/CIQ_logo_2clr_darkmode.svg",
                "filename": "CIQ_logo_2clr_darkmode.svg",
                "background": "dark",
                "color": "multicolor",
                "layout": "horizontal",
                "colorVariant": "2-color",
                "type": "logo",
                "size": "large",
                "tags": ["company", "hero", "dark-mode"]
            }
```

The resulting `ciq_logos` dictionary should contain only:
```python
        ciq_logos = {
            "1color_light": {
                "url": "/assets/global/CIQ_logos/CIQ_logo_1clr_lightmode.svg",
                "filename": "CIQ_logo_1clr_lightmode.svg",
                "background": "light",
                "color": "black",
                "layout": "horizontal",
                "colorVariant": "1-color",
                "type": "logo",
                "size": "large",
                "tags": ["company", "primary", "general-use"]
            },
            "1color_dark": {
                "url": "/assets/global/CIQ_logos/CIQ_logo_1clr_darkmode.svg",
                "filename": "CIQ_logo_1clr_darkmode.svg",
                "background": "dark",
                "color": "white",
                "layout": "horizontal",
                "colorVariant": "1-color",
                "type": "logo",
                "size": "large",
                "tags": ["company", "dark-mode"]
            }
        }
```

**Step 3: Test CLI backend returns only 1-color variants**

Run: `python3 interfaces/mcp-server/cli_wrapper.py "ciq" --show-all-variants`
Expected: Returns `"total_found": 2` (only 1color_light and 1color_dark)

**Step 4: Commit backend changes**

```bash
git add interfaces/mcp-server/cli_wrapper.py
git commit -m "refactor: remove 2-color CIQ variants from CLI backend

Remove 2color_light and 2color_dark entries from ciq_logos dictionary.
Backend now returns only 1-color CIQ variants.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Remove Frontend Metadata (Product Defaults)

**Files:**
- Modify: `interfaces/web-gui/src/lib/productDefaults.ts:60-68`

**Step 1: Verify current CIQ_VARIANT_METADATA**

Run: `grep -A 10 "CIQ_VARIANT_METADATA" interfaces/web-gui/src/lib/productDefaults.ts | head -12`
Expected: Shows 4 entries including 2-color variants

**Step 2: Remove 2-color entries from CIQ_VARIANT_METADATA**

Update the `CIQ_VARIANT_METADATA` array to remove 2-color entries:

```typescript
export const CIQ_VARIANT_METADATA: CIQVariantMetadata[] = [
  // Light mode variant (dark logo for light backgrounds)
  { colorVariant: '1-color', backgroundMode: 'light', displayName: 'CIQ Standard', usageContext: 'general business use, presentations', isPrimary: true, priority: 1 },

  // Dark mode variant (light logo for dark backgrounds)
  { colorVariant: '1-color', backgroundMode: 'dark', displayName: 'CIQ Standard (Dark)', usageContext: 'dark backgrounds, headers', isPrimary: false, priority: 2 }
];
```

Remove these two lines:
- Line 63: `{ colorVariant: '2-color', backgroundMode: 'light', displayName: 'CIQ Hero', usageContext: 'major presentations, marketing materials', isPrimary: false, priority: 2 },`
- Line 67: `{ colorVariant: '2-color', backgroundMode: 'dark', displayName: 'CIQ Hero (Dark)', usageContext: 'dark hero sections, premium contexts', isPrimary: false, priority: 4 }`

**Step 3: Update priority value for dark mode variant**

Change priority from `3` to `2` on the remaining dark mode entry (line 66 becomes the new line 64).

**Step 4: Verify TypeScript compiles**

Run: `cd interfaces/web-gui && npm run build`
Expected: Clean build with no TypeScript errors

**Step 5: Commit metadata changes**

```bash
git add interfaces/web-gui/src/lib/productDefaults.ts
git commit -m "refactor: remove 2-color CIQ variants from frontend metadata

Update CIQ_VARIANT_METADATA to only include 1-color variants.
Adjusted priority values for remaining entries.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Simplify DownloadModalNew Logic

**Files:**
- Modify: `interfaces/web-gui/src/components/DownloadModalNew.tsx:155-169`

**Step 1: Locate the variant filename generation logic**

Run: `grep -n "1clr.*2clr" interfaces/web-gui/src/components/DownloadModalNew.tsx`
Expected: Shows line 162 with ternary operator

**Step 2: Simplify filename generation**

The current logic at line 162:
```typescript
const filename = `CIQ_logo_${variant.colorVariant === '1-color' ? '1clr' : '2clr'}_${variant.backgroundMode}mode.svg`;
```

Since we only have `'1-color'` variants now, this can be simplified to:
```typescript
const filename = `CIQ_logo_1clr_${variant.backgroundMode}mode.svg`;
```

**Step 3: Verify the change in context**

Read lines 155-169 to ensure the change fits properly:

```typescript
      // CIQ company logo variants: show 1-color variants for current mode
      const ciqVariants = getCIQVariantMetadata();
      const currentModeVariants = ciqVariants.filter(variant =>
        variant.backgroundMode === colorMode
      );

      return currentModeVariants.map(variant => {
        const filename = `CIQ_logo_1clr_${variant.backgroundMode}mode.svg`;

        return {
          id: variant.colorVariant, // Will always be '1-color' now
          displayName: variant.displayName.replace(` (${variant.backgroundMode === 'dark' ? 'Dark' : ''})`, ''), // Clean name
          aspectRatio: 'aspect-square', // Square thumbnails
          logoPath: `/assets/global/CIQ_logos/${filename}`
        };
      });
```

**Step 4: Test download modal in browser**

Run: `cd interfaces/web-gui && npm run dev`
Navigate to: `http://localhost:3000`
Action: Search for "ciq", click asset, verify modal shows only 1-color variants
Expected: Modal displays only "CIQ Standard" with light/dark mode toggle

**Step 5: Commit modal simplification**

```bash
git add interfaces/web-gui/src/components/DownloadModalNew.tsx
git commit -m "refactor: simplify CIQ logo filename generation in download modal

Remove ternary operator for colorVariant since only 1-color exists.
Hardcode '1clr' in filename generation for clarity.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Simplify AssetGrid Logic

**Files:**
- Modify: `interfaces/web-gui/src/components/AssetGrid.tsx:64-74`

**Step 1: Locate the colorVariant fallback logic**

Run: `grep -n "2color" interfaces/web-gui/src/components/AssetGrid.tsx`
Expected: Shows line 67 with fallback check for '2color'

**Step 2: Simplify colorVariant extraction**

Current logic at line 67:
```typescript
const colorVariant = asset.metadata?.colorVariant || (asset.id.includes('2color') ? '2-color' : '1-color');
```

Since we removed all 2-color variants, this can be simplified to:
```typescript
const colorVariant = asset.metadata?.colorVariant || '1-color';
```

**Step 3: Update display name logic**

Current logic at lines 71-74:
```typescript
const displayName = `CIQ ${colorVariant === '1-color' ? 'Standard' : 'Hero'} ${backgroundMode === 'light' ? 'Light' : 'Dark'} Mode`;
const usageContext = colorVariant === '1-color'
  ? (backgroundMode === 'light' ? 'general business use, presentations' : 'dark backgrounds, headers')
  : (backgroundMode === 'light' ? 'major presentations, marketing materials' : 'dark hero sections, premium contexts');
```

Since we only have `'1-color'` now, simplify to:
```typescript
const displayName = `CIQ Standard ${backgroundMode === 'light' ? 'Light' : 'Dark'} Mode`;
const usageContext = backgroundMode === 'light'
  ? 'general business use, presentations'
  : 'dark backgrounds, headers';
```

**Step 4: Verify the complete updated section**

The updated code block (lines 64-74) should look like:
```typescript
      if (isCIQCompanyLogo(productName)) {
        // CIQ: CLI backend now provides only 1-color variants
        // Use them directly instead of expanding from single asset
        const colorVariant = asset.metadata?.colorVariant || '1-color';
        const backgroundMode = asset.metadata?.background || (asset.id.includes('dark') ? 'dark' : 'light');

        // Generate proper display name for 1-color variants only
        const displayName = `CIQ Standard ${backgroundMode === 'light' ? 'Light' : 'Dark'} Mode`;
        const usageContext = backgroundMode === 'light'
          ? 'general business use, presentations'
          : 'dark backgrounds, headers';
```

**Step 5: Test asset grid in browser**

Run: `cd interfaces/web-gui && npm run dev`
Navigate to: `http://localhost:3000`
Action: Search for "ciq", toggle "ALL VARIANTS" on
Expected: Shows only 2 variants (1-color light, 1-color dark) with correct display names

**Step 6: Commit grid simplification**

```bash
git add interfaces/web-gui/src/components/AssetGrid.tsx
git commit -m "refactor: simplify CIQ variant logic in asset grid

Remove 2-color variant checks and ternary operators.
Hardcode 'Standard' naming since only 1-color variants exist.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Update CIQVariantMetadata Interface (Optional Cleanup)

**Files:**
- Modify: `interfaces/web-gui/src/lib/productDefaults.ts:24-31`

**Step 1: Review CIQVariantMetadata interface**

Current interface allows both `'1-color'` and `'2-color'`:
```typescript
export interface CIQVariantMetadata {
  colorVariant: '1-color' | '2-color';
  backgroundMode: 'light' | 'dark';
  displayName: string;
  usageContext: string;
  isPrimary: boolean;
  priority: number;
}
```

**Step 2: Simplify colorVariant type (optional)**

Since we only support `'1-color'` now, we could simplify to:
```typescript
export interface CIQVariantMetadata {
  colorVariant: '1-color'; // Only 1-color variants supported
  backgroundMode: 'light' | 'dark';
  displayName: string;
  usageContext: string;
  isPrimary: boolean;
  priority: number;
}
```

**Note:** This is optional cleanup. The union type `'1-color' | '2-color'` still works correctly since we only use `'1-color'` values. This change just makes the type more explicit about what's actually supported.

**Step 3: Verify TypeScript compiles (if changed)**

Run: `cd interfaces/web-gui && npm run build`
Expected: Clean build with no TypeScript errors

**Step 4: Commit interface update (if changed)**

```bash
git add interfaces/web-gui/src/lib/productDefaults.ts
git commit -m "refactor: simplify CIQVariantMetadata interface type

Update colorVariant to only accept '1-color' since 2-color variants removed.
Makes interface reflect actual usage.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Comprehensive Testing

**Files:**
- Test: All modified components and backend

**Step 1: Test CLI backend search**

```bash
# Test without variants flag (should return 1 primary)
python3 interfaces/mcp-server/cli_wrapper.py "ciq"

# Test with all variants flag (should return 2 total)
python3 interfaces/mcp-server/cli_wrapper.py "ciq" --show-all-variants
```

Expected results:
- Without flag: `"total_found": 1` (only primary 1color_light)
- With flag: `"total_found": 2` (1color_light and 1color_dark)

**Step 2: Test web GUI search**

```bash
cd interfaces/web-gui && npm run dev
```

Navigate to: `http://localhost:3000`

Test cases:
1. Search for "ciq" with PRIMARY mode → Should show 1 asset
2. Toggle "ALL VARIANTS" on → Should show 2 assets (light and dark)
3. Click each asset → Download modal should show only "CIQ Standard" options
4. Verify no 2-color references in UI anywhere

**Step 3: Test asset downloads**

Action: Download both CIQ variants (light and dark) in different formats
Expected: Downloads work correctly, files are properly named with 1clr

**Step 4: Verify no broken image references**

Run: `npm run build && npm start`
Action: Navigate entire site looking for broken images
Expected: No 404 errors for CIQ logo files in console

**Step 5: Final verification commit**

```bash
git status
```

Expected: Working tree clean, all changes committed

---

## Task 8: Final Documentation Update (Optional)

**Files:**
- Modify: `CLAUDE.md` (if needed)

**Step 1: Check if CLAUDE.md mentions 2-color logos**

Run: `grep -i "2.color\|2clr\|hero.*logo" CLAUDE.md`
Expected: May show references to CIQ logo variants

**Step 2: Update documentation if needed**

If CLAUDE.md references 2-color CIQ logos, update to reflect that only 1-color variants exist.

Example update:
```markdown
## CIQ Company Logo

The CIQ company logo is available in **1-color format only**:
- **1-color light mode**: Black logo for light backgrounds (primary)
- **1-color dark mode**: White logo for dark backgrounds

The 1-color format is used for consistency with design system guidelines.
```

**Step 3: Commit documentation updates**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md to reflect 1-color only CIQ logos

Remove references to 2-color/hero variants.
Clarify that only 1-color variants are available.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Completion Checklist

- [ ] Task 1: Deleted 2-color SVG files
- [ ] Task 2: Removed backend references from cli_wrapper.py
- [ ] Task 3: Removed frontend metadata from productDefaults.ts
- [ ] Task 4: Simplified DownloadModalNew.tsx logic
- [ ] Task 5: Simplified AssetGrid.tsx logic
- [ ] Task 6: Updated CIQVariantMetadata interface (optional)
- [ ] Task 7: Comprehensive testing completed
- [ ] Task 8: Documentation updated (if needed)

## Success Criteria

1. ✅ No 2clr files exist in `public/assets/global/CIQ_logos/`
2. ✅ CLI backend returns max 2 CIQ variants (with --show-all-variants)
3. ✅ Web GUI shows only "CIQ Standard" in download modal
4. ✅ No TypeScript compilation errors
5. ✅ No broken image references in browser console
6. ✅ All code changes committed with proper messages

## Rollback Plan

If issues arise, revert commits in reverse order:

```bash
# View recent commits
git log --oneline -10

# Revert specific commit
git revert <commit-hash>

# Or reset to before changes (destructive)
git reset --hard <commit-before-changes>
```
