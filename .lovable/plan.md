

# Responsive Itinerary Stacked Cards at 450px and Below

## Problem
The stacked cards are fixed at 255x375px. At 450px viewport width, two columns of 255px cards cannot fit side-by-side, so the layout falls back to a single stretched column.

## Solution
Reduce the card dimensions at small screens so two columns fit within 450px, while keeping all text sizes, buttons, navigation arrows, and add buttons unchanged.

## Changes

### 1. `src/components/itinerary/ItineraryStackedCards.tsx` (line 44)
Update the grid to show 2 columns on small screens:
- Change `grid-cols-1 sm:grid-cols-2` to `grid-cols-2 lg:grid-cols-4`
- This makes the default (mobile) layout 2 columns instead of 1

### 2. `src/components/itinerary/ItineraryStackedSection.tsx` (line 63)
Make the card container responsive:
- Change `w-[255px] h-[375px]` to `w-[165px] h-[243px] sm:w-[255px] sm:h-[375px]`
- At screens under 640px (which includes 450px), cards shrink to 165x243px -- the same compact size already used for itinerary cards on the My Itineraries page
- Two 165px cards + gap + padding fits comfortably within 450px

### No other changes
Text sizes, scroll arrows, pagination indicators, add buttons, and edit/share/split-cost action buttons all remain exactly as they are. Only the card container dimensions get a responsive breakpoint.

