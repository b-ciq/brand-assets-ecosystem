# Manual Test: CIQ Logo Mode Filtering

## Test Objective
Verify that the CIQ logo modal correctly filters variants by light/dark mode, showing only 2 variants in each mode.

## Prerequisites
- Application running at http://localhost:3002
- Dev server started with `npm run dev`

## Test Steps

### 1. Navigate to Application
- Open http://localhost:3002 in your browser

### 2. Find CIQ Logo Asset
- If no assets are visible, try searching for "ciq" in the search bar
- Look for a CIQ logo asset card
- The asset should be labeled with "CIQ" or show the CIQ company logo

### 3. Open Modal
- Click on the CIQ logo asset card
- This should open the download modal (DownloadModalNew)

### 4. Test Light Mode Tab
- Ensure the "Light mode" tab is selected (should be default)
- Look at the "Select variant" section
- **Expected**: Should show exactly 2 CIQ logo variants:
  - CIQ Standard (1-color lightmode)  
  - CIQ Hero (2-color lightmode)

### 5. Test Dark Mode Tab  
- Click on the "Dark mode" tab
- Look at the "Select variant" section again
- **Expected**: Should show exactly 2 different CIQ logo variants:
  - CIQ Standard Dark (1-color darkmode)
  - CIQ Hero Dark (2-color darkmode)

### 6. Verify Mode Filtering
- Switch between "Light mode" and "Dark mode" tabs
- **Expected**: The variants should change each time you switch modes
- **Expected**: Light mode should show lightmode files, Dark mode should show darkmode files
- **Expected**: Should NOT show the same 4 variants in both modes

## Key Code Locations

The filtering logic is implemented in:
- `/src/components/DownloadModalNew.tsx` lines 46-62
- The `getDynamicVariants()` function filters by `colorMode` 
- Line 49-51: `ciqVariants.filter(variant => variant.backgroundMode === colorMode)`

## Success Criteria

✅ Light mode shows 2 variants (lightmode files)
✅ Dark mode shows 2 variants (darkmode files)  
✅ Variants are different between the two modes
✅ No duplicate or same assets shown in both modes

## If Test Fails

Check browser console for errors and report:
1. What assets are visible on the main page
2. Whether the modal opens correctly
3. What variants are shown in each mode
4. Any console errors or network failures