import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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