# Itinerary Schema Contract

## Overview

This document defines the canonical data contract for a single itinerary record in Supabase and how the assistant should read/write each field.

## Schema Fields

### Identity & Ownership

| Field | Type | Description |
|-------|------|-------------|
| `id` | int8 | Internal row ID |
| `created_at` | timestamptz | Creation timestamp |
| `userid` | uuid | Owner user ID (used for RLS authorization) |
| `itin_id` | uuid | Public itinerary identifier (use this in URLs and client references) |

### Core Trip Metadata

| Field | Type | Description |
|-------|------|-------------|
| `itin_name` | text | Human-friendly trip name |
| `itin_desc` | text | Short description / notes |
| `itin_date_start` | date | Trip start date (inclusive) |
| `itin_date_end` | date | Trip end date (inclusive) |

### Collaboration

| Field | Type | Description |
|-------|------|-------------|
| `attendees` | json | Participants and roles |

### Locations & Map

| Field | Type | Description |
|-------|------|-------------|
| `itin_locations` | json | Semantic locations/areas relevant to the trip |
| `itin_map_locations` | json | Coordinates for map display |

Example:
```json
[{"city":"London","country":"UK","neighborhoods":["Soho","South Bank"]}]
```

### Inventory / Bookings

| Field | Type | Description |
|-------|------|-------------|
| `reservations` | json | Canonical place for confirmed items (hotel stays, tours, restaurants, etc.) |
| `flights` | json | Flight objects |
| `hotels` | json | Hotel shortlist and/or selected hotel |
| `activities` | json | Activities shortlist and/or booked activities |

**Important**: `reservations` = confirmed bookings and finalized holds (canonical source of truth)

### Budget & Tracking

| Field | Type | Description |
|-------|------|-------------|
| `budget` | numeric | Total trip budget |
| `spending` | numeric | Current committed/estimated spend |
| `budget_rate` | numeric | How well user is tracking vs budget |
| `b_efficiency_rate` | numeric | Booking efficiency (quality/value metric) |

### External API Attachments

| Field | Type | Description |
|-------|------|-------------|
| `expedia_data` | jsonb | Raw or normalized Expedia response payloads |
| `images` | jsonb | Itinerary images or media references |

## Read/Write Guidelines

1. Always use `itin_id` for client-facing references
2. Use `id` (int8) for database operations
3. `reservations` is the source of truth for confirmed bookings
4. `hotels`, `flights`, `activities` can hold shortlists before final selection
5. Update `spending` when reservations are added/removed
