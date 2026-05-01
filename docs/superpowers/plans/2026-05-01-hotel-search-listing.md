# Hotel Search & Listing — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `/hotels` search results page and `/hotels/:id` hotel detail page with filters, map view, image gallery, room availability, and reviews.

**Architecture:**
- Frontend: React + Vite + Tailwind + TanStack Query + react-router-dom
- Two new pages under `MainLayout` at `/hotels` and `/hotels/:id`
- All filters sync bidirectionally with URL query params via `useSearchParams`
- Backend: add one new endpoint `GET /api/reviews/can-review`

**Tech Stack:** react-day-picker, date-fns, embla-carousel-react, shadcn/ui (slider, select, popover, dialog, accordion, separator)

---

## File Map

### Backend (small addition)
- `apps/api/src/routes/review.routes.ts` — add `GET /can-review` route
- `apps/api/src/controllers/review.controller.ts` — add `canReviewHandler`
- `apps/api/src/services/review.service.ts` — add `canUserReviewHotel()` function

### Frontend — New files
```
apps/web/src/
  pages/hotels/
    SearchPage.tsx           # Main /hotels page
    HotelDetailPage.tsx      # Main /hotels/:id page
  components/hotels/
    HotelCard.tsx            # Card with embla carousel
    HotelSkeleton.tsx        # Skeleton loader for search results
    SearchFilters.tsx        # Filter sidebar (desktop) / Sheet (mobile)
    GuestsDropdown.tsx       # Adults/children/rooms stepper popover
    DateRangePicker.tsx      # react-day-picker wrapper
    PriceRangeSlider.tsx     # Dual-thumb slider for price range
    SortSelect.tsx           # Sort-by dropdown
    MockMapView.tsx          # Mock static map panel
    ImageGallery.tsx         # Main image + thumbnail grid + lightbox dialog
    RoomTable.tsx            # Room availability table
    ReviewSummary.tsx        # Big rating + breakdown bars
    ReviewList.tsx           # Individual review items
    StickyBookingBar.tsx     # Mobile fixed bottom bar
    AmenityIcon.tsx          # Maps amenity string → Lucide icon
  hooks/
    useDebounce.ts           # Generic debounce hook
  types/
    hotel.ts                 # Hotel search result types (extends shared types)
```

### Frontend — Modified files
- `apps/web/src/App.tsx` — add `/hotels` and `/hotels/:id` routes
- `apps/web/src/services/api.ts` — add `searchHotels`, `checkAvailability`, `canWriteReview` API functions

---

## Phase 1: Dependencies & shadcn components

- [ ] **Task 1: Install frontend packages**

```bash
cd hotel-reservation-system/apps/web
npm install react-day-picker date-fns embla-carousel-react
```

---

- [ ] **Task 2: Add missing shadcn/ui components**

```bash
cd hotel-reservation-system/apps/web
npx shadcn@latest add slider select popover dialog accordion separator -y
```

Note: `dialog` maps to `@radix-ui/react-dialog`, `popover` to `@radix-ui/react-popover`, `slider` to `@radix-ui/react-slider`, `select` to `@radix-ui/react-select`, `accordion` to `@radix-ui/react-accordion`, `separator` to `@radix-ui/react-separator`. The `-y` flag auto-accepts defaults.

---

## Phase 2: Backend — can-review endpoint

- [ ] **Task 3: Add `canUserReviewHotel` to review service**

**File:** `apps/api/src/services/review.service.ts`

Add after the existing exports (at the end of the file):

```typescript
export async function canUserReviewHotel(
  userId: string,
  hotelId: string
): Promise<{ canReview: boolean; reason?: string }> {
  // Check if user has any COMPLETED booking at this hotel
  const completedBooking = await prisma.booking.findFirst({
    where: {
      userId,
      status: 'COMPLETED',
      room: { hotelId },
    },
  });

  if (!completedBooking) {
    return {
      canReview: false,
      reason: 'No completed stay at this hotel',
    };
  }

  // Check if already reviewed
  const existingReview = await prisma.review.findUnique({
    where: { bookingId: completedBooking.id },
  });

  if (existingReview) {
    return {
      canReview: false,
      reason: 'You have already reviewed this hotel',
    };
  }

  return { canReview: true };
}
```

---

- [ ] **Task 4: Add `canReviewHandler` to review controller**

**File:** `apps/api/src/controllers/review.controller.ts`

Add after the existing handlers:

```typescript
export async function canReviewHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { hotelId } = req.query;

    if (!hotelId || typeof hotelId !== 'string') {
      res.status(400).json({
        success: false,
        error: { message: 'hotelId query param is required', code: 'VALIDATION_ERROR' },
      });
      return;
    }

    // If not authenticated, they cannot review
    if (!req.user) {
      sendSuccess(res, { canReview: false, reason: 'Authentication required' });
      return;
    }

    const result = await canUserReviewHotel(req.user.id, hotelId);
    sendSuccess(res, result);
  } catch (err) {
    next(err);
  }
}
```

Also add to the import at the top:
```typescript
import { createReview, getHotelReviews, getUserReviews, approveReview, rejectReview, deleteReview, canUserReviewHotel } from '../services/review.service';
```

---

- [ ] **Task 5: Register can-review route**

**File:** `apps/api/src/routes/review.routes.ts`

Add before `export default router`:

```typescript
router.get('/can-review', requireAuth, canReviewHandler);
```

The route path becomes `/reviews/can-review` → `GET /api/reviews/can-review?hotelId=X`.

---

## Phase 3: Frontend types & hooks

- [ ] **Task 6: Create hotel types**

**File:** `apps/web/src/types/hotel.ts`

```typescript
import type { RoomType } from '@hotel/shared';

export interface HotelSearchResult {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  starRating: number | null;
  amenities: string[];
  images: string[];
  averageRating: number | null;
  totalReviews: number;
  cheapestRoomPrice: number;
  availableRoomTypes: string[];
}

export interface SearchResponse {
  hotels: HotelSearchResult[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface AvailableRoom {
  id: string;
  type: string;
  description: string | null;
  pricePerNight: number;
  capacity: number;
  bedType: string | null;
  roomSize: number | null;
  amenities: string[];
  images: string[];
  totalQuantity: number;
  availableQuantity: number;
}

export interface AvailabilityResponse {
  hotelId: string;
  hotelName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  availableRooms: AvailableRoom[];
}

export interface HotelReview {
  id: string;
  userId: string;
  hotelId: string;
  bookingId: string;
  rating: number;
  comment: string;
  isApproved: boolean;
  createdAt: string;
  user?: { firstName: string; lastName: string };
}

export interface ReviewListResponse {
  reviews: HotelReview[];
  total: number;
  page: number;
  totalPages: number;
}

export interface SearchFilters {
  location?: string;
  checkIn?: string;
  checkOut?: string;
  guests: number;
  adults: number;
  children: number;
  rooms: number;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
  starRating?: number;
  roomType?: RoomType;
  sortBy: 'price_asc' | 'price_desc' | 'rating_desc' | 'relevance';
  page: number;
}
```

---

- [ ] **Task 7: Create useDebounce hook**

**File:** `apps/web/src/hooks/useDebounce.ts`

```typescript
import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
```

---

## Phase 4: API functions

- [ ] **Task 8: Add hotel API functions**

**File:** `apps/web/src/services/api.ts`

Add these exports below the existing api configuration:

```typescript
import type {
  SearchResponse,
  AvailabilityResponse,
  ReviewListResponse,
} from '../types/hotel';
import type { RoomType } from '@hotel/shared';

export async function searchHotels(params: Record<string, unknown>): Promise<SearchResponse> {
  const { data } = await api.get<SearchResponse>('/search/hotels', { params });
  return data;
}

export async function checkAvailability(
  hotelId: string,
  checkIn: string,
  checkOut: string,
  guests: number
): Promise<AvailabilityResponse> {
  const { data } = await api.get<AvailabilityResponse>('/search/availability', {
    params: { hotelId, checkIn, checkOut, guests },
  });
  return data;
}

export async function getHotelReviews(
  hotelId: string,
  page = 1,
  limit = 10
): Promise<ReviewListResponse> {
  const { data } = await api.get<ReviewListResponse>(`/reviews/hotel/${hotelId}`, {
    params: { page, limit },
  });
  return data;
}

export async function canWriteReview(hotelId: string): Promise<{ canReview: boolean; reason?: string }> {
  const { data } = await api.get<{ canReview: boolean; reason?: string }>('/reviews/can-review', {
    params: { hotelId },
  });
  return data;
}
```

---

## Phase 5: Small UI components

- [ ] **Task 9: Create AmenityIcon component**

**File:** `apps/web/src/components/hotels/AmenityIcon.tsx`

```typescript
import {
  Wifi,
  Waves,
  ParkingCircle,
  Sparkles,
  Coffee,
  Dumbbell,
  Check,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

const AMENITY_MAP: Record<string, LucideIcon> = {
  wifi: Wifi,
  pool: Waves,
  parking: ParkingCircle,
  spa: Sparkles,
  breakfast: Coffee,
  gym: Dumbbell,
};

interface AmenityIconProps {
  amenity: string;
  className?: string;
}

export function AmenityIcon({ amenity, className }: AmenityIconProps) {
  const Icon = AMENITY_MAP[amenity.toLowerCase()] ?? Check;
  return <Icon className={className ?? 'h-4 w-4'} />;
}

export function getAmenityLabel(amenity: string): string {
  const labels: Record<string, string> = {
    wifi: 'WiFi',
    pool: 'Pool',
    parking: 'Parking',
    spa: 'Spa',
    breakfast: 'Breakfast',
    gym: 'Gym',
  };
  return labels[amenity.toLowerCase()] ?? amenity;
}
```

---

- [ ] **Task 10: Create DateRangePicker component**

**File:** `apps/web/src/components/hotels/DateRangePicker.tsx`

```typescript
import * as React from 'react';
import { format, isValid } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar'; // shadcn calendar component

// Note: shadcn calendar is react-day-picker wrapped with className support
// If shadcn calendar is not available, use react-day-picker directly:
// import { DayPicker } from 'react-day-picker';

interface DateRangePickerProps {
  dateRange: { from?: Date; to?: Date };
  onDateRangeChange: (range: { from?: Date; to?: Date }) => void;
  className?: string;
}

export function DateRangePicker({ dateRange, onDateRangeChange, className }: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatLabel = () => {
    if (!dateRange.from && !dateRange.to) return 'Select dates';
    if (dateRange.from && dateRange.to) {
      return `${format(dateRange.from, 'MMM d')} → ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    if (dateRange.from) return `${format(dateRange.from, 'MMM d, yyyy')} → Select end`;
    return 'Select dates';
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (range?.from && range?.to) {
      onDateRangeChange({ from: range.from, to: range.to });
      setOpen(false);
    } else if (range?.from) {
      onDateRangeChange({ from: range.from, to: undefined });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-full justify-start text-left font-normal ${!dateRange.from && 'text-muted-foreground'} ${className ?? ''}`}
        >
          {formatLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={{ from: dateRange.from, to: dateRange.to }}
          onSelect={handleSelect}
          numberOfMonths={2}
          disabled={(date) => date < new Date()}
        />
      </PopoverContent>
    </Popover>
  );
}
```

Note: If shadcn's `calendar` component is not installed yet, run:
```bash
cd hotel-reservation-system/apps/web && npx shadcn@latest add calendar -y
```

---

- [ ] **Task 11: Create GuestsDropdown component**

**File:** `apps/web/src/components/hotels/GuestsDropdown.tsx`

```typescript
import * as React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface GuestsDropdownProps {
  adults: number;
  children: number;
  rooms: number;
  onChange: (opts: { adults: number; children: number; rooms: number }) => void;
}

export function GuestsDropdown({ adults, children, rooms, onChange }: GuestsDropdownProps) {
  const [open, setOpen] = React.useState(false);

  const formatLabel = () =>
    `${adults} adult${adults !== 1 ? 's' : ''} · ${children} child${children !== 1 ? 'ren' : ''} · ${rooms} room${rooms !== 1 ? 's' : ''}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start font-normal">
          {formatLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64" align="start">
        <div className="flex flex-col gap-4">
          {/* Adults */}
          <div className="flex items-center justify-between">
            <Label htmlFor="adults">Adults</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onChange({ adults: Math.max(1, adults - 1), children, rooms })}
                disabled={adults <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-4 text-center">{adults}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onChange({ adults: adults + 1, children, rooms })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between">
            <Label htmlFor="children">Children</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onChange({ adults, children: Math.max(0, children - 1), rooms })}
                disabled={children <= 0}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-4 text-center">{children}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onChange({ adults, children: children + 1, rooms })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Rooms */}
          <div className="flex items-center justify-between">
            <Label htmlFor="rooms">Rooms</Label>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="outline"
                onClick={() => onChange({ adults, children, rooms: Math.max(1, rooms - 1) })}
                disabled={rooms <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-4 text-center">{rooms}</span>
              <Button
                size="icon"
                variant="outline"
                onClick={() => onChange({ adults, children, rooms: rooms + 1 })}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
```

---

- [ ] **Task 12: Create PriceRangeSlider component**

**File:** `apps/web/src/components/hotels/PriceRangeSlider.tsx`

```typescript
import * as React from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface PriceRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
}

export function PriceRangeSlider({
  min,
  max,
  step = 10,
  value,
  onChange,
}: PriceRangeSliderProps) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-between">
        <span className="text-sm">${value[0]}</span>
        <span className="text-sm">${value[1]}{value[1] >= max ? '+' : ''}</span>
      </div>
      <Slider
        min={min}
        max={max}
        step={step}
        value={value}
        onValueChange={onChange}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>${min}</span>
        <span>${max}+</span>
      </div>
    </div>
  );
}
```

---

- [ ] **Task 13: Create HotelSkeleton component**

**File:** `apps/web/src/components/hotels/HotelSkeleton.tsx`

```typescript
import { Skeleton } from '@/components/ui/skeleton';

export function HotelSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border">
      <Skeleton className="h-48 w-full" />
      <div className="flex flex-col gap-2 p-4">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
        <div className="flex gap-2">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
}
```

---

## Phase 6: HotelCard

- [ ] **Task 14: Create HotelCard component**

**File:** `apps/web/src/components/hotels/HotelCard.tsx`

```typescript
import { useCallback } from 'react';
import { Link } from 'react-router-dom';
import useEmblaCarousel from 'embla-carousel-react';
import { Star, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AmenityIcon, getAmenityLabel } from './AmenityIcon';
import type { HotelSearchResult } from '@/types/hotel';

interface HotelCardProps {
  hotel: HotelSearchResult;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: 'start' });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const displayedAmenities = hotel.amenities.slice(0, 4);

  return (
    <Card className="overflow-hidden">
      {/* Image carousel */}
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {hotel.images.slice(0, 3).map((img, i) => (
              <div key={i} className="flex-[0_0_100%]">
                <img
                  src={img}
                  alt={`${hotel.name} - Image ${i + 1}`}
                  className="h-48 w-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
        {/* Navigation arrows */}
        {hotel.images.length > 1 && (
          <>
            <button
              onClick={scrollPrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 hover:bg-white"
              aria-label="Previous image"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
            <button
              onClick={scrollNext}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1 hover:bg-white"
              aria-label="Next image"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </button>
          </>
        )}
        {/* Dots indicator */}
        <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1">
          {hotel.images.slice(0, 3).map((_, i) => (
            <div key={i} className="h-1.5 w-1.5 rounded-full bg-white/60" />
          ))}
        </div>
      </div>

      <CardContent className="flex flex-col gap-2 p-4">
        {/* Hotel name */}
        <Link
          to={`/hotels/${hotel.id}`}
          className="font-semibold text-lg leading-tight hover:underline"
        >
          {hotel.name}
        </Link>

        {/* Star rating + city */}
        <div className="flex items-center gap-2">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-3.5 w-3.5 ${i < (hotel.starRating ?? 0) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
              />
            ))}
          </div>
          <span className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            {hotel.city}, {hotel.country}
          </span>
        </div>

        {/* Price */}
        <p className="text-sm font-medium">
          from <span className="text-lg font-bold">${hotel.cheapestRoomPrice}</span>{' '}
          <span className="text-muted-foreground">/ night</span>
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1">
          {displayedAmenities.map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              <AmenityIcon amenity={amenity} className="mr-1 h-3 w-3" />
              {getAmenityLabel(amenity)}
            </Badge>
          ))}
        </div>

        {/* CTA */}
        <Button asChild className="mt-2 w-full">
          <Link to={`/hotels/${hotel.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

## Phase 7: SearchFilters, SortSelect, MockMapView

- [ ] **Task 15: Create SearchFilters component**

**File:** `apps/web/src/components/hotels/SearchFilters.tsx`

```typescript
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { PriceRangeSlider } from './PriceRangeSlider';
import type { SearchFilters as FilterState } from '@/types/hotel';

const AMENITY_OPTIONS = ['wifi', 'pool', 'parking', 'spa', 'breakfast', 'gym'];
const ROOM_TYPES = ['SINGLE', 'DOUBLE', 'SUITE', 'DELUXE', 'FAMILY'];

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (updates: Partial<FilterState>) => void;
  onClear: () => void;
}

export function SearchFilters({ filters, onFilterChange, onClear }: SearchFiltersProps) {
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.minPrice ?? 0,
    filters.maxPrice ?? 1000,
  ]);

  const handlePriceChange = (value: [number, number]) => {
    setPriceRange(value);
    onFilterChange({ minPrice: value[0], maxPrice: value[1] });
  };

  const handleAmenityToggle = (amenity: string, checked: boolean) => {
    const current = filters.amenities ?? [];
    const updated = checked
      ? [...current, amenity]
      : current.filter((a) => a !== amenity);
    onFilterChange({ amenities: updated });
  };

  const handleStarToggle = (star: number, checked: boolean) => {
    if (checked) {
      onFilterChange({ starRating: star });
    } else if (filters.starRating === star) {
      onFilterChange({ starRating: undefined });
    }
  };

  const hasActiveFilters =
    (filters.minPrice !== undefined || filters.maxPrice !== undefined) ||
    (filters.amenities && filters.amenities.length > 0) ||
    filters.starRating !== undefined ||
    filters.roomType !== undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* Price Range */}
      <div className="flex flex-col gap-3">
        <Label className="font-semibold">Price Range</Label>
        <PriceRangeSlider
          min={0}
          max={1000}
          step={10}
          value={priceRange}
          onChange={handlePriceChange}
        />
      </div>

      <Separator />

      {/* Star Rating */}
      <div className="flex flex-col gap-3">
        <Label className="font-semibold">Star Rating</Label>
        <div className="flex flex-col gap-2">
          {[5, 4, 3, 2, 1].map((star) => (
            <div key={star} className="flex items-center gap-2">
              <Checkbox
                id={`star-${star}`}
                checked={filters.starRating === star}
                onCheckedChange={(checked) => handleStarToggle(star, !!checked)}
              />
              <Label htmlFor={`star-${star}`} className="flex items-center gap-1 cursor-pointer">
                {Array.from({ length: star }).map((_, i) => (
                  <span key={i} className="text-yellow-400">★</span>
                ))}
                <span className="text-sm text-muted-foreground">& up</span>
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Amenities */}
      <div className="flex flex-col gap-3">
        <Label className="font-semibold">Amenities</Label>
        <div className="flex flex-col gap-2">
          {AMENITY_OPTIONS.map((amenity) => (
            <div key={amenity} className="flex items-center gap-2">
              <Checkbox
                id={`amenity-${amenity}`}
                checked={filters.amenities?.includes(amenity) ?? false}
                onCheckedChange={(checked) => handleAmenityToggle(amenity, !!checked)}
              />
              <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer capitalize">
                {amenity}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Room Type */}
      <div className="flex flex-col gap-3">
        <Label className="font-semibold">Room Type</Label>
        <Select
          value={filters.roomType ?? ''}
          onValueChange={(val) => onFilterChange({ roomType: val as FilterState['roomType'] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Any room type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Any room type</SelectItem>
            {ROOM_TYPES.map((type) => (
              <SelectItem key={type} value={type}>
                {type.charAt(0) + type.slice(1).toLowerCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Clear filters */}
      {hasActiveFilters && (
        <>
          <Separator />
          <Button variant="ghost" size="sm" onClick={onClear} className="gap-2">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        </>
      )}
    </div>
  );
}
```

---

- [ ] **Task 16: Create SortSelect component**

**File:** `apps/web/src/components/hotels/SortSelect.tsx`

```typescript
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortOption = 'relevance' | 'price_asc' | 'price_desc' | 'rating_desc';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
}

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: 'relevance', label: 'Most Popular' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'rating_desc', label: 'Guest Rating' },
];

export function SortSelect({ value, onChange }: SortSelectProps) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as SortOption)}>
      <SelectTrigger className="w-52">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export type { SortOption };
```

---

- [ ] **Task 17: Create MockMapView component**

**File:** `apps/web/src/components/hotels/MockMapView.tsx`

```typescript
import { MapPin } from 'lucide-react';

interface MockMapViewProps {
  hotelCount: number;
  location?: string;
}

export function MockMapView({ hotelCount, location }: MockMapViewProps) {
  return (
    <div className="flex h-64 w-full flex-col items-center justify-center rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 dark:from-slate-800 dark:to-slate-700">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <MapPin className="h-12 w-12 text-blue-500" />
          <div className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
            {hotelCount > 9 ? '9+' : hotelCount}
          </div>
        </div>
        <p className="text-center text-sm font-medium text-blue-700 dark:text-blue-300">
          {hotelCount} hotel{hotelCount !== 1 ? 's' : ''}
          {location ? ` in ${location}` : ' found'}
        </p>
        <p className="text-xs text-blue-500 dark:text-blue-400">
          Map view — powered by placeholder
        </p>
      </div>
    </div>
  );
}
```

---

## Phase 8: SearchPage

- [ ] **Task 18: Create SearchPage**

**File:** `apps/web/src/pages/hotels/SearchPage.tsx`

```typescript
import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Search, SlidersHorizontal, Map, List } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { searchHotels } from '@/services/api';
import { useDebounce } from '@/hooks/useDebounce';
import { DateRangePicker } from '@/components/hotels/DateRangePicker';
import { GuestsDropdown } from '@/components/hotels/GuestsDropdown';
import { SearchFilters } from '@/components/hotels/SearchFilters';
import { SortSelect, SortOption } from '@/components/hotels/SortSelect';
import { HotelCard } from '@/components/hotels/HotelCard';
import { HotelSkeleton } from '@/components/hotels/HotelSkeleton';
import { MockMapView } from '@/components/hotels/MockMapView';
import type { SearchFilters as FilterState, SearchResponse } from '@/types/hotel';

const DEFAULT_FILTERS: FilterState = {
  guests: 1,
  adults: 1,
  children: 0,
  rooms: 1,
  sortBy: 'relevance',
  page: 1,
};

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMap, setShowMap] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Parse filters from URL
  const filters = useMemo<FilterState>(() => ({
    location: searchParams.get('location') ?? undefined,
    checkIn: searchParams.get('checkIn') ?? undefined,
    checkOut: searchParams.get('checkOut') ?? undefined,
    guests: Number(searchParams.get('guests') ?? 1),
    adults: Number(searchParams.get('adults') ?? 1),
    children: Number(searchParams.get('children') ?? 0),
    rooms: Number(searchParams.get('rooms') ?? 1),
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : undefined,
    starRating: searchParams.get('starRating') ? Number(searchParams.get('starRating')) : undefined,
    roomType: (searchParams.get('roomType') as FilterState['roomType']) ?? undefined,
    sortBy: (searchParams.get('sortBy') as SortOption) ?? 'relevance',
    page: Number(searchParams.get('page') ?? 1),
  }), [searchParams]);

  // Local UI state for inputs
  const [locationInput, setLocationInput] = useState(filters.location ?? '');
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: filters.checkIn ? new Date(filters.checkIn) : undefined,
    to: filters.checkOut ? new Date(filters.checkOut) : undefined,
  });

  const debouncedLocation = useDebounce(locationInput, 300);

  // Build query params object for API
  const queryParams = useMemo(() => ({
    ...(filters.location && { location: filters.location }),
    ...(filters.checkIn && { checkIn: filters.checkIn }),
    ...(filters.checkOut && { checkOut: filters.checkOut }),
    guests: filters.guests,
    ...(filters.minPrice !== undefined && { minPrice: filters.minPrice }),
    ...(filters.maxPrice !== undefined && { maxPrice: filters.maxPrice }),
    ...(filters.amenities && filters.amenities.length > 0 && { amenities: filters.amenities.join(',') }),
    ...(filters.starRating !== undefined && { starRating: filters.starRating }),
    ...(filters.roomType && { roomType: filters.roomType }),
    sortBy: filters.sortBy,
    page: filters.page,
    limit: 10,
  }), [filters]);

  // Fetch hotels
  const { data, isLoading, isError } = useQuery<SearchResponse>({
    queryKey: ['hotels', queryParams],
    queryFn: () => searchHotels(queryParams),
  });

  // Update URL when filters change
  const updateFilters = (updates: Partial<FilterState>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          next.delete(key);
        } else if (Array.isArray(value)) {
          next.set(key, value.join(','));
        } else {
          next.set(key, String(value));
        }
      });
      next.delete('page'); // Reset to page 1 on filter change
      return next;
    }, { replace: true });
  };

  const clearFilters = () => {
    setSearchParams({});
    setDateRange({ from: undefined, to: undefined });
    setLocationInput('');
  };

  const handleSearchClick = () => {
    updateFilters({
      location: debouncedLocation || undefined,
      checkIn: dateRange.from?.toISOString().split('T')[0],
      checkOut: dateRange.to?.toISOString().split('T')[0],
      adults: filters.adults,
      children: filters.children,
      rooms: filters.rooms,
    });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page });
  };

  const FilterContent = (
    <SearchFilters
      filters={filters}
      onFilterChange={updateFilters}
      onClear={clearFilters}
    />
  );

  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero search bar */}
      <section className="border-b bg-card py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end">
            {/* Location */}
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Location</label>
              <Input
                placeholder="City, hotel name..."
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Date range */}
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Dates</label>
              <DateRangePicker
                dateRange={dateRange}
                onDateRangeChange={(range) => setDateRange(range)}
              />
            </div>

            {/* Guests */}
            <div className="flex-1">
              <label className="mb-1 block text-sm font-medium">Guests</label>
              <GuestsDropdown
                adults={filters.adults}
                children={filters.children}
                rooms={filters.rooms}
                onChange={({ adults, children, rooms }) => {
                  updateFilters({ adults, children, rooms, guests: adults + children });
                }}
              />
            </div>

            {/* Search */}
            <Button size="lg" onClick={handleSearchClick} className="shrink-0 gap-2">
              <Search className="h-4 w-4" />
              Search
            </Button>

            {/* Mobile filters toggle */}
            <Sheet open={showMobileFilters} onOpenChange={setShowMobileFilters}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="shrink-0 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <SheetHeader>
                  <SheetTitle>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">{FilterContent}</div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </section>

      {/* Main content */}
      <div className="container mx-auto flex gap-6 px-4 py-6">
        {/* Desktop sidebar */}
        <aside className="hidden w-64 shrink-0 lg:block">
          <div className="sticky top-24">
            <h2 className="mb-4 text-lg font-semibold">Filters</h2>
            {FilterContent}
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1">
          {/* Sort bar */}
          <div className="mb-4 flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-48 inline-block" />
              ) : (
                `${data?.total ?? 0} hotel${(data?.total ?? 0) !== 1 ? 's' : ''} found`
              )}
            </p>
            <div className="flex items-center gap-3">
              <SortSelect
                value={filters.sortBy}
                onChange={(val) => updateFilters({ sortBy: val })}
              />
              <Button
                variant={showMap ? 'secondary' : 'outline'}
                size="icon"
                onClick={() => setShowMap(!showMap)}
                title="Toggle map"
              >
                <Map className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Map view */}
          {showMap && (
            <div className="mb-6">
              <MockMapView
                hotelCount={data?.hotels.length ?? 0}
                location={filters.location}
              />
            </div>
          )}

          {/* Loading skeletons */}
          {isLoading && (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <HotelSkeleton key={i} />
              ))}
            </div>
          )}

          {/* Error state */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-destructive">Failed to load hotels. Please try again.</p>
              <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
                Retry
              </Button>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !isError && (data?.hotels.length ?? 0) === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="mb-4 h-16 w-16 text-muted-foreground" />
              <h3 className="text-xl font-semibold">No hotels found</h3>
              <p className="mt-2 text-muted-foreground">
                Try adjusting your filters or changing your search dates.
              </p>
              <Button variant="outline" onClick={clearFilters} className="mt-4">
                Clear all filters
              </Button>
            </div>
          )}

          {/* Results grid */}
          {!isLoading && !isError && (data?.hotels.length ?? 0) > 0 && (
            <>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {data!.hotels.map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>

              {/* Pagination */}
              {(data?.totalPages ?? 0) > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filters.page <= 1}
                    onClick={() => handlePageChange(filters.page - 1)}
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(5, data!.totalPages) }, (_, i) => {
                    const page = i + 1;
                    return (
                      <Button
                        key={page}
                        variant={filters.page === page ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!data?.hasNextPage}
                    onClick={() => handlePageChange(filters.page + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
```

---

## Phase 9: HotelDetail components

- [ ] **Task 19: Create ImageGallery component**

**File:** `apps/web/src/components/hotels/ImageGallery.tsx`

```typescript
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps {
  images: string[];
  hotelName: string;
}

export function ImageGallery({ images, hotelName }: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const openLightbox = (index: number) => {
    setActiveIndex(index);
    setLightboxOpen(true);
  };

  const goPrev = () => setActiveIndex((i) => (i > 0 ? i - 1 : images.length - 1));
  const goNext = () => setActiveIndex((i) => (i < images.length - 1 ? i + 1 : 0));

  if (images.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center bg-muted">
        <p className="text-muted-foreground">No images available</p>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        {/* Main image */}
        <div
          className="relative cursor-pointer overflow-hidden rounded-lg"
          onClick={() => openLightbox(0)}
        >
          <img
            src={images[0]}
            alt={`${hotelName} - Main`}
            className="h-80 w-full object-cover transition hover:scale-105"
          />
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {images.slice(1, 5).map((img, i) => (
              <div
                key={i}
                className="relative cursor-pointer overflow-hidden rounded-lg"
                onClick={() => openLightbox(i + 1)}
              >
                <img
                  src={img}
                  alt={`${hotelName} - ${i + 2}`}
                  className="h-20 w-32 object-cover transition hover:opacity-80"
                />
              </div>
            ))}
            {images.length > 5 && (
              <div className="flex h-20 w-32 cursor-pointer items-center justify-center rounded-lg bg-muted text-sm font-medium">
                +{images.length - 5} more
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox dialog */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="flex max-w-4xl flex-col items-center p-0">
          <div className="relative flex w-full items-center justify-center">
            <img
              src={images[activeIndex]}
              alt={`${hotelName} - ${activeIndex + 1}`}
              className="max-h-[80vh] w-full object-contain"
            />
            {/* Prev/Next */}
            {images.length > 1 && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  onClick={goPrev}
                >
                  <ChevronLeft className="h-6 w-6 text-white" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70"
                  onClick={goNext}
                >
                  <ChevronRight className="h-6 w-6 text-white" />
                </Button>
              </>
            )}
          </div>
          <p className="py-2 text-sm text-muted-foreground">
            {activeIndex + 1} / {images.length}
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

- [ ] **Task 20: Create RoomTable component**

**File:** `apps/web/src/components/hotels/RoomTable.tsx`

```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Bed, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DateRangePicker } from './DateRangePicker';
import { checkAvailability } from '@/services/api';
import type { AvailabilityResponse } from '@/types/hotel';

interface RoomTableProps {
  hotelId: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
}

export function RoomTable({ hotelId, initialCheckIn, initialCheckOut, initialGuests = 1 }: RoomTableProps) {
  const [dateRange, setDateRange] = useState<{ from?: Date; to?: Date }>({
    from: initialCheckIn ? new Date(initialCheckIn) : undefined,
    to: initialCheckOut ? new Date(initialCheckOut) : undefined,
  });

  const checkIn = dateRange.from?.toISOString().split('T')[0];
  const checkOut = dateRange.to?.toISOString().split('T')[0];

  const { data, isLoading } = useQuery<AvailabilityResponse>({
    queryKey: ['availability', hotelId, checkIn, checkOut, initialGuests],
    queryFn: () =>
      checkAvailability(
        hotelId,
        checkIn ?? '',
        checkOut ?? '',
        initialGuests
      ),
    enabled: !!checkIn && !!checkOut,
  });

  const rooms = data?.availableRooms ?? [];

  const handleCheckAvailability = () => {
    // Dates are already in state; the query will refetch automatically
    // when checkIn/checkOut change
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Date picker */}
      <div className="flex gap-4">
        <div className="flex-1">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
        <Button onClick={handleCheckAvailability} className="shrink-0">
          Check availability
        </Button>
      </div>

      {/* No dates selected */}
      {!checkIn && !checkOut && (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            Select check-in and check-out dates above to see room availability and prices.
          </p>
        </div>
      )}

      {/* Loading */}
      {isLoading && checkIn && checkOut && (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      )}

      {/* No rooms available */}
      {!isLoading && checkIn && checkOut && rooms.length === 0 && (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">
            No rooms available for the selected dates. Try different dates.
          </p>
        </div>
      )}

      {/* Room list */}
      {!isLoading && rooms.length > 0 && (
        <div className="flex flex-col gap-3">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex flex-col gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex flex-1 flex-col gap-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold">{room.type.charAt(0) + room.type.slice(1).toLowerCase()}</h4>
                  {room.availableQuantity > 0 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5" />
                    Up to {room.capacity} guest{room.capacity !== 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bed className="h-3.5 w-3.5" />
                    {room.bedType ?? 'Standard bed'}
                  </span>
                  {room.roomSize && <span>{room.roomSize}m²</span>}
                </div>
                {room.availableQuantity > 0 && (
                  <span className="text-xs text-green-600">
                    {room.availableQuantity} room{room.availableQuantity !== 1 ? 's' : ''} left
                  </span>
                )}
                {room.availableQuantity === 0 && (
                  <span className="text-xs text-red-500">Sold out</span>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-xl font-bold">${room.pricePerNight}</p>
                  <p className="text-sm text-muted-foreground">per night</p>
                </div>
                <Button
                  disabled={room.availableQuantity === 0}
                  onClick={() => {
                    // Navigate to booking page — placeholder for now
                    alert(`Room ${room.id} selected. Booking flow coming soon.`);
                  }}
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

- [ ] **Task 21: Create ReviewSummary component**

**File:** `apps/web/src/components/hotels/ReviewSummary.tsx`

```typescript
import { Star } from 'lucide-react';

interface RatingBreakdown {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

interface ReviewSummaryProps {
  averageRating: number | null;
  totalReviews: number;
  ratingBreakdown?: RatingBreakdown;
}

export function ReviewSummary({ averageRating, totalReviews, ratingBreakdown }: ReviewSummaryProps) {
  const rating = averageRating ?? 0;
  const displayRating = rating > 0 ? rating.toFixed(1) : 'New';

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
      {/* Big rating number */}
      <div className="flex flex-col items-center">
        <p className="text-5xl font-bold">{displayRating}</p>
        <div className="mt-1 flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-4 w-4 ${i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
            />
          ))}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {totalReviews > 0 ? `Based on ${totalReviews} review${totalReviews !== 1 ? 's' : ''}` : 'No reviews yet'}
        </p>
      </div>

      {/* Rating breakdown bars */}
      {ratingBreakdown && totalReviews > 0 && (
        <div className="flex flex-col gap-1.5">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = ratingBreakdown[star as keyof RatingBreakdown] ?? 0;
            const pct = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-2">
                <span className="w-3 text-sm">{star}</span>
                <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-yellow-400 transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-8 text-right text-xs text-muted-foreground">
                  {Math.round(pct)}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
```

---

- [ ] **Task 22: Create ReviewList component**

**File:** `apps/web/src/components/hotels/ReviewList.tsx`

```typescript
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { getHotelReviews } from '@/services/api';
import type { HotelReview } from '@/types/hotel';

interface ReviewListProps {
  hotelId: string;
}

export function ReviewList({ hotelId }: ReviewListProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['hotel-reviews', hotelId],
    queryFn: () => getHotelReviews(hotelId, 1, 10),
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  const reviews = data?.reviews ?? [];

  if (reviews.length === 0) {
    return <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {reviews.map((review) => (
        <ReviewItem key={review.id} review={review} />
      ))}
    </div>
  );
}

function ReviewItem({ review }: { review: HotelReview }) {
  const firstName = review.user?.firstName ?? 'Guest';
  const lastName = review.user?.lastName ?? '';

  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs">
              {firstName[0]}{lastName[0]}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {firstName} {lastName}
            </p>
            <p className="text-xs text-muted-foreground">
              {review.createdAt ? format(new Date(review.createdAt), 'MMM d, yyyy') : ''}
            </p>
          </div>
        </div>
        <div className="flex">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`h-3.5 w-3.5 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'fill-muted text-muted'}`}
            />
          ))}
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
    </div>
  );
}
```

---

- [ ] **Task 23: Create StickyBookingBar component**

**File:** `apps/web/src/components/hotels/StickyBookingBar.tsx`

```typescript
import { ArrowUp } from 'lucide-react';

interface StickyBookingBarProps {
  hotelName: string;
  cheapestPrice: number;
  onViewRooms: () => void;
}

export function StickyBookingBar({ hotelName, cheapestPrice, onViewRooms }: StickyBookingBarProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t bg-background p-4 shadow-lg md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex min-w-0 flex-col">
          <p className="truncate text-sm font-medium">{hotelName}</p>
          <p className="text-sm">
            <span className="font-bold">${cheapestPrice}</span>
            <span className="text-muted-foreground"> / night</span>
          </p>
        </div>
        <Button size="sm" onClick={onViewRooms} className="shrink-0 gap-1">
          View Rooms
          <ArrowUp className="h-3 w-3 rotate-45" />
        </Button>
      </div>
    </div>
  );
}
```

---

## Phase 10: HotelDetailPage

- [ ] **Task 24: Create HotelDetailPage**

**File:** `apps/web/src/pages/hotels/HotelDetailPage.tsx`

```typescript
import { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Share, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { api } from '@/services/api';
import { AmenityIcon, getAmenityLabel } from '@/components/hotels/AmenityIcon';
import { ImageGallery } from '@/components/hotels/ImageGallery';
import { RoomTable } from '@/components/hotels/RoomTable';
import { ReviewSummary } from '@/components/hotels/ReviewSummary';
import { ReviewList } from '@/components/hotels/ReviewList';
import { StickyBookingBar } from '@/components/hotels/StickyBookingBar';
import { HotelSkeleton } from '@/components/hotels/HotelSkeleton';

// Inline hotel type (matches Prisma shape)
interface HotelDetail {
  id: string;
  name: string;
  description: string | null;
  address: string;
  city: string;
  country: string;
  starRating: number | null;
  amenities: string[];
  images: string[];
  averageRating: number | null;
  createdAt: string;
}

interface ReviewRatingSummary {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export function HotelDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const [saved, setSaved] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  const checkIn = searchParams.get('checkIn') ?? undefined;
  const checkOut = searchParams.get('checkOut') ?? undefined;
  const guests = Number(searchParams.get('guests') ?? 1);

  // Fetch hotel details
  const { data: hotel, isLoading: hotelLoading } = useQuery<HotelDetail>({
    queryKey: ['hotel', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: HotelDetail }>(`/hotels/${id}`);
      return data.data;
    },
    enabled: !!id,
  });

  // Fetch reviews for rating summary
  const { data: reviewsData } = useQuery({
    queryKey: ['hotel-reviews', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: { reviews: Array<{ rating: number }>; total: number } }>(
        `/reviews/hotel/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });

  // Fetch can-review eligibility
  const { data: canReviewData } = useQuery({
    queryKey: ['can-review', id],
    queryFn: async () => {
      const { data } = await api.get<{ data: { canReview: boolean } }>('/reviews/can-review', {
        params: { hotelId: id },
      });
      return data.data;
    },
    enabled: !!id,
  });

  // Compute rating breakdown
  const ratingBreakdown: ReviewRatingSummary = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  const totalReviews = reviewsData?.total ?? 0;
  reviewsData?.reviews.forEach((r) => {
    const star = Math.min(5, Math.max(1, r.rating)) as 1 | 2 | 3 | 4 | 5;
    ratingBreakdown[star]++;
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  const handleSave = () => {
    setSaved(!saved);
    toast.success(saved ? 'Removed from saved' : 'Hotel saved!');
  };

  const handleViewRooms = () => {
    document.getElementById('rooms-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (hotelLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="mb-6 h-80 w-full" />
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-semibold">Hotel not found</h2>
        <p className="mt-2 text-muted-foreground">This hotel may have been removed.</p>
      </div>
    );
  }

  return (
    <div className="pb-24 md:pb-8">
      <div className="container mx-auto px-4 py-8">
        {/* Image gallery */}
        <ImageGallery images={hotel.images} hotelName={hotel.name} />

        {/* Header */}
        <div className="mt-6 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold">{hotel.name}</h1>
              <p className="mt-1 flex items-center gap-2 text-muted-foreground">
                {hotel.starRating && (
                  <span className="flex">
                    {Array.from({ length: hotel.starRating }).map((_, i) => (
                      <span key={i} className="text-yellow-400">★</span>
                    ))}
                  </span>
                )}
                {hotel.address}, {hotel.city}, {hotel.country}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={handleShare} title="Share">
                <Share className="h-4 w-4" />
              </Button>
              <Button
                variant={saved ? 'secondary' : 'outline'}
                size="icon"
                onClick={handleSave}
                title={saved ? 'Remove from saved' : 'Save'}
              >
                <Heart className={`h-4 w-4 ${saved ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Description */}
        {hotel.description && (
          <div className="mb-6">
            <h2 className="mb-2 text-xl font-semibold">About</h2>
            <p className={`text-muted-foreground leading-relaxed ${!descExpanded && 'line-clamp-3'}`}>
              {hotel.description}
            </p>
            {hotel.description.length > 200 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDescExpanded(!descExpanded)}
                className="mt-1 gap-1"
              >
                {descExpanded ? (
                  <>
                    Show less <ChevronUp className="h-3 w-3" />
                  </>
                ) : (
                  <>
                    Read more <ChevronDown className="h-3 w-3" />
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Amenities */}
        {hotel.amenities.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-xl font-semibold">Amenities</h2>
            <div className="flex flex-wrap gap-4">
              {hotel.amenities.map((amenity) => (
                <div key={amenity} className="flex items-center gap-2">
                  <AmenityIcon amenity={amenity} className="h-5 w-5 text-primary" />
                  <span className="text-sm">{getAmenityLabel(amenity)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Separator className="my-6" />

        {/* Rooms */}
        <div id="rooms-section" className="mb-6">
          <h2 className="mb-4 text-xl font-semibold">Select a Room</h2>
          <RoomTable
            hotelId={hotel.id}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
            initialGuests={guests}
          />
        </div>

        <Separator className="my-6" />

        {/* Reviews */}
        <div>
          <h2 className="mb-4 text-xl font-semibold">Guest Reviews</h2>
          <ReviewSummary
            averageRating={hotel.averageRating}
            totalReviews={totalReviews}
            ratingBreakdown={totalReviews > 0 ? ratingBreakdown : undefined}
          />
          <div className="mt-6">
            <ReviewList hotelId={hotel.id} />
          </div>
          {canReviewData?.canReview && (
            <div className="mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  toast.info('Review form coming soon!');
                }}
              >
                Write a Review
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile sticky bar */}
      <StickyBookingBar
        hotelName={hotel.name}
        cheapestPrice={0}
        onViewRooms={handleViewRooms}
      />
    </div>
  );
}
```

Note: The `cheapestPrice` passed to `StickyBookingBar` should ideally come from a query. For now pass `0` and the sticky bar shows "from $0". Fix by passing the first room price from a separate query or passing it via URL from SearchPage.

---

## Phase 11: App routing

- [ ] **Task 25: Update App.tsx routes**

**File:** `apps/web/src/App.tsx`

Add two new imports:
```typescript
import { SearchPage } from './pages/hotels/SearchPage';
import { HotelDetailPage } from './pages/hotels/HotelDetailPage';
```

Add these routes inside the `MainLayout` routes (inside the `Route element={<MainLayout>}>` block), alongside the existing `/` route:

```tsx
<Route path="/hotels" element={<SearchPage />} />
<Route path="/hotels/:id" element={<HotelDetailPage />} />
```

Both routes are public (no `ProtectedRoute` wrapper needed).

---

## Task Summary

| # | Task | Type |
|---|---|---|
| 1 | Install react-day-picker, date-fns, embla-carousel-react | package |
| 2 | Add shadcn slider, select, popover, dialog, accordion, separator, calendar | package |
| 3 | Add `canUserReviewHotel` to review service | backend |
| 4 | Add `canReviewHandler` to review controller | backend |
| 5 | Register `/can-review` route | backend |
| 6 | Create `types/hotel.ts` | types |
| 7 | Create `useDebounce` hook | hook |
| 8 | Add hotel API functions to `api.ts` | frontend |
| 9 | Create `AmenityIcon` component | component |
| 10 | Create `DateRangePicker` component | component |
| 11 | Create `GuestsDropdown` component | component |
| 12 | Create `PriceRangeSlider` component | component |
| 13 | Create `HotelSkeleton` component | component |
| 14 | Create `HotelCard` component | component |
| 15 | Create `SearchFilters` component | component |
| 16 | Create `SortSelect` component | component |
| 17 | Create `MockMapView` component | component |
| 18 | Create `SearchPage` | page |
| 19 | Create `ImageGallery` component | component |
| 20 | Create `RoomTable` component | component |
| 21 | Create `ReviewSummary` component | component |
| 22 | Create `ReviewList` component | component |
| 23 | Create `StickyBookingBar` component | component |
| 24 | Create `HotelDetailPage` | page |
| 25 | Update App.tsx with new routes | routing |

---

## Verification Checklist

After each task, verify:
- [ ] No TypeScript errors (`npm run build` or `tsc --noEmit`)
- [ ] Page renders without crash at `/hotels`
- [ ] Page renders without crash at `/hotels/some-id`
- [ ] URL params update on filter change
- [ ] No console errors (Error level)
