# Search Ranking And Relevance

## Goal

When a user requests options, the assistant must return options that are:
- within constraints (hard filters)
- meaningfully differentiated (diversity)
- presented with tradeoffs (location vs price vs rating)

## Hard Filters (Never Violated Unless User Approves)

- Max price per night (if specified)
- Date availability (must match range)
- Minimum rating (if specified)

## Soft Preferences (Ranking Signals)

- Neighborhood alignment with trip intent (business, nightlife, walkability)
- Review count (if available) and rating stability
- Distance to key itinerary map points (if you have itin_map_locations)
- Cancellation flexibility (if available)
- Total trip cost vs budget utilization (budget, spending)

## Diversity Rule

Return 3–6 options:
- 1 "Best Overall" - highest combined score
- 1 "Best Value" - best price-to-quality ratio
- 1 "Best Location" - optimal for trip activities
- optionally 1 "Boutique/Design" - unique character
- optionally 1 "Spacious/Comfort" - extra space/amenities

## Output Requirements for Cards

Each hotel card must include:
- name
- rating + review count (if available)
- price per night + estimated total
- neighborhood/area
- top 2–3 reasons ("walkable", "excellent reviews", "great value")
- primary image
- action buttons metadata: `action_select`, `action_shuffle`, `action_save_to_shortlist`
