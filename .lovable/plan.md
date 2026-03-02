

# Fix Dialog Footer Button Alignment

## Problem
The three footer buttons (Trash, X, Checkmark) are misaligned -- the trash button sits on a separate row below the X and Checkmark buttons instead of all three being side-by-side.

## Solution
Flatten the footer layout so all three buttons sit in a single horizontal row, right-aligned, with the trash button first.

## Technical Details

### File: `src/components/itinerary/AddItemDialog.tsx`

**Lines 415-449** (DialogFooter): Replace the current nested layout with a single flex row:

- Remove the outer `flex justify-between` wrapper and the inner `<div className="flex gap-2 ml-auto">`
- Use `DialogFooter` with `className="mt-4 flex flex-row items-center justify-end gap-2 flex-shrink-0 border-t border-black/10 pt-4"`
- Place all three buttons as direct children in order: Trash (conditionally rendered), X, Checkmark
- No logic or prop changes -- purely a layout fix

