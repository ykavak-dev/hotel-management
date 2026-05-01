# Hotel Search & Listing — Design Spec

**Date:** 2026-05-01
**Status:** Approved

---

## 1. Overview

Public-facing hotel search and hotel detail pages for the hotel reservation system. Users can search hotels by location/dates, filter by price/star rating/amenities/room type, sort results, and view detailed hotel pages with room availability and reviews.

---

## 2. Tech Additions

| Package | Purpose |
|---|---|
| `react-day-picker` + `date-fns` | Date range picker in Popover |
| `embla-carousel-react` | Image carousels on hotel cards and gallery |
| No new map package | Mock static map (styled div) |

**Existing components reused:** shadcn Dialog, Sheet, Checkbox, Slider, Select, Skeleton, Button, Card, Badge, Input, Label, Tabs.

---

## 3. Routes

| Path | Component | Auth |
|---|---|---|
| `/hotels` | `SearchPage` | Public |
| `/hotels/:id` | `HotelDetailPage` | Public |

Both pages use `MainLayout`.

---

## 4. `/hotels` — Search Results Page

### 4.1 URL Params

All filters sync bidirectionally with URL query params:

```
/hotels?location=Paris&checkIn=2026-05-10&checkOut=2026-05-15&guests=2&adults=2&children=0&rooms=1&minPrice=50&maxPrice=300&amenities=wifi,pool&starRating=3&sortBy=price_asc&page=1
```

| Param | Type | Description |
|---|---|---|
| `location` | string | Search query (hotel name, city, country) |
| `checkIn` | ISO date | Check-in date |
| `checkOut` | ISO date | Check-out date |
| `guests` | number | Total guests (adults + children) |
| `adults` | number | Adult count (min 1) |
| `children` | number | Child count (min 0) |
| `rooms` | number | Room count (min 1) |
| `minPrice` | number | Minimum price per night |
| `maxPrice` | number | Maximum price per night |
| `amenities` | comma-string | e.g. `wifi,pool,parking` |
| `starRating` | number | Minimum star rating (1–5) |
| `sortBy` | enum | `price_asc`, `price_desc`, `rating_desc`, `relevance` |
| `page` | number | Page number (1-indexed) |

### 4.2 Hero Search Bar

Sits at the top of the page (hero section). Three controls in a row:

- **Location input** — `Input` component, debounced 300ms. Updates `location` param.
- **DateRange picker** — `react-day-picker` inside a shadcn `Popover`. Displays "Check-in → Check-out" as button label. Selected range updates `checkIn`/`checkOut` params.
- **Guests dropdown** — Compact button showing summary, e.g. `"2 adults · 0 children · 1 room"`. Opens `Popover` with:
  - Adults: decrement/increment stepper (min 1)
  - Children: decrement/increment stepper (min 0)
  - Rooms: decrement/increment stepper (min 1)
  - Updates `adults`/`children`/`rooms` params; `guests` = adults + children
- **Search button** — `Button`, triggers navigation to `/hotels?` with current params

### 4.3 Filter Sidebar

Left column (desktop). Collapsible into `Sheet` on mobile.

- **Price range** — Dual-thumb `Slider` (min/max). Range 0–1000. Updates `minPrice`/`maxPrice`.
- **Star rating** — `Checkbox` group. 5, 4, 3, 2, 1 star toggles. Updates `starRating` (minimum selected star).
- **Amenities** — `Checkbox` group. Options: WiFi, Pool, Parking, Spa, Breakfast, Gym. Updates `amenities` as comma-string.
- **Room type** — `Select` dropdown. Options: All, Single, Double, Suite, Deluxe, Family. Updates `roomType`.
- **"Clear filters"** — Resets all filter params to defaults; updates URL.

### 4.4 Sort Bar

Above results grid. `Select` dropdown:

- "Most Popular" (default / `relevance`)
- "Price: Low to High" (`price_asc`)
- "Price: High to Low" (`price_desc`)
- "Guest Rating" (`rating_desc`)

### 4.5 Results Grid

- `HotelCard` in a responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
- Each `HotelCard` shows:
  - **Image carousel** — embla carousel, 3 images visible, scroll-snapped, dot indicators
  - **Hotel name** (link to `/hotels/:id`)
  - **Star rating** — filled/empty star icons
  - **City, country**
  - **Price** — "from $X per night" (cheapest room price)
  - **Amenity chips** — first 4 amenity badges
  - **"View Details" button** — links to `/hotels/:id`
- **Loading state** — 6 `Skeleton` cards while fetching
- **Empty state** — Centered icon, "No hotels found" heading, "Try adjusting your filters" subtext, "Clear filters" button

### 4.6 Map View Toggle

Button in sort bar toggles map panel. Panel shows mock static map:

- Styled div with a map pin icon (Lucide `MapPin`)
- Hotel count label: "X hotels in [location]"
- Light gray/blue gradient background suggesting a map
- No real interactivity, no external map package

### 4.7 Pagination

Page numbers with previous/next buttons. Shows at bottom of results.

---

## 5. `/hotels/:id` — Hotel Detail Page

### 5.1 URL Params

```
/hotels/:id?checkIn=2026-05-10&checkOut=2026-05-15&guests=2
```

Dates are optional; used to fetch availability.

### 5.2 Image Gallery

- **Main image** — Large display (16:9 aspect ratio)
- **Thumbnail grid** — 4–6 thumbnails below the main image in a horizontal row
- **Lightbox** — Clicking any image opens shadcn `Dialog` with the full image, prev/next arrows (keyboard: ←/→, ESC to close)

### 5.3 Hotel Header

- **Name** — `<h1>` large text
- **Star rating badge** — filled stars + numeric rating
- **Address** — full street, city, country
- **Share button** — copies URL to clipboard, shows toast confirmation
- **Save button** — toggles saved state (local state only, no API), shows toast

### 5.4 Description

- Shows first 3 lines (line-clamp-3) with CSS
- "Read more" toggle expands to full text
- Uses `Button` variant="ghost" as the toggle

### 5.5 Amenities Grid

Wrapping grid of amenity items. Each item: icon (Lucide) + label. Maps common amenity strings to icons:

| Amenity | Icon |
|---|---|
| WiFi | `Wifi` |
| Pool | `Waves` |
| Parking | `ParkingCircle` |
| Spa | `Sparkles` |
| Breakfast | `Coffee` |
| Gym | `Dumbbell` |
| (fallback) | `Check` |

### 5.6 Room Selection Table

Section with date picker at top:

- Date range picker (same `react-day-picker` component)
- "Check availability" button — updates URL params, refetches availability

**Room table** (columns):

| Column | Description |
|---|---|
| Room Type | Room type name + icon |
| Capacity | "Up to X guests" |
| Bed | Bed type string |
| Price/night | Formatted price |
| Select | `Button` "Select" — links to booking flow |

- If dates are set: shows only available rooms with availability count
- If no dates: shows all rooms with full pricing
- Mobile: table scrolls horizontally

### 5.7 Reviews Section

- **Summary card**:
  - Large average rating number (e.g. "4.2")
  - Star icons (filled/empty)
  - Total review count (e.g. "Based on 127 reviews")
- **Rating breakdown**: 5 bars (5★ to 1★). Each bar fills proportionally to percentage of total reviews.
- **Review list**: Most recent reviews, each showing:
  - Reviewer first name + avatar (initial)
  - Date
  - Star rating
  - Comment text
  - "Show more" if comments are long
- **"Write a Review" button**: Only visible if user is authenticated AND has a `COMPLETED` booking at this hotel. Calls `GET /api/reviews/can-review?hotelId=X` to determine eligibility.

### 5.8 Mobile Sticky Booking Bar

Fixed bottom bar (mobile only via `className="hidden md:block"` on desktop):

```
[Hotel Name truncated | from $X/night | View Rooms ↗]
```

- `position: fixed`, `bottom: 0`, full-width
- "View Rooms" button scrolls page to room table section

---

## 6. API Integration

### 6.1 Search Hotels

```
GET /api/search/hotels
```

Query params map directly to `SearchParams` interface in `search.service.ts`.

TanStack Query key: `['hotels', searchParams]`

### 6.2 Check Availability

```
GET /api/search/availability?hotelId=&checkIn=&checkOut=&guests=
```

TanStack Query key: `['availability', { hotelId, checkIn, checkOut, guests }]`

### 6.3 Can Write Review

```
GET /api/reviews/can-review?hotelId=
```

Returns `{ canReview: boolean }`.

---

## 7. Key Implementation Details

### 7.1 URL Sync

- On mount: read `useSearchParams()` to initialize filter state
- On change: wrap setters in `navigate()` calls to update URL
- Debounce location input 300ms before updating URL

### 7.2 Debounce

Implement `useDebounce` hook:

```typescript
function useDebounce<T>(value: T, delay: number): T
```

Applied to location input.

### 7.3 Optimistic UI

Filter changes update URL immediately. TanStack Query background refetch provides optimistic feedback via loading skeletons.

### 7.4 Loading Skeletons

During any query loading state, show `Skeleton` components matching the shape of the real content (cards, table rows, gallery placeholders).

---

## 8. Component Inventory

| Component | File | Notes |
|---|---|---|
| `SearchPage` | `pages/hotels/SearchPage.tsx` | Main search page |
| `HotelDetailPage` | `pages/hotels/HotelDetailPage.tsx` | Hotel detail page |
| `HotelCard` | `components/hotels/HotelCard.tsx` | Card with carousel |
| `SearchFilters` | `components/hotels/SearchFilters.tsx` | Filter sidebar |
| `GuestsDropdown` | `components/hotels/GuestsDropdown.tsx` | Guests stepper popover |
| `DateRangePicker` | `components/hotels/DateRangePicker.tsx` | react-day-picker wrapper |
| `PriceRangeSlider` | `components/hotels/PriceRangeSlider.tsx` | Dual-thumb slider |
| `SortSelect` | `components/hotels/SortSelect.tsx` | Sort dropdown |
| `MockMapView` | `components/hotels/MockMapView.tsx` | Mock static map |
| `ImageGallery` | `components/hotels/ImageGallery.tsx` | Gallery + lightbox |
| `RoomTable` | `components/hotels/RoomTable.tsx` | Room availability table |
| `ReviewSummary` | `components/hotels/ReviewSummary.tsx` | Rating summary + breakdown |
| `ReviewList` | `components/hotels/ReviewList.tsx` | Review list |
| `StickyBookingBar` | `components/hotels/StickyBookingBar.tsx` | Mobile sticky bar |
| `HotelSkeleton` | `components/hotels/HotelSkeleton.tsx` | Search result skeleton |
| `AmenityIcon` | `components/hotels/AmenityIcon.tsx` | Amenity string → Lucide icon |

---

## 9. Validation

- `checkIn` must be before `checkOut`
- `checkIn` must not be in the past
- At least 1 adult is required
- All date params are ISO format strings

---

## 10. Out of Scope

- Real map integration (Leaflet, Google Maps)
- Hotel comparison view
- Wishlist persistence (API)
- Booking flow (separate feature)
