import { useState } from 'react';
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

  return (
    <div className="flex flex-col gap-6">
      {/* Date picker */}
      <div className="flex gap-4">
        <div className="flex-1">
          <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
        </div>
        <Button onClick={() => {}} className="shrink-0">
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
                  <h4 className="font-semibold">
                    {room.type.charAt(0) + room.type.slice(1).toLowerCase()}
                  </h4>
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