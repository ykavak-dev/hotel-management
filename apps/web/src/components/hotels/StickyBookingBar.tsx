import { ArrowUp } from 'lucide-react';
import { Button } from '@/components/ui/button';

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