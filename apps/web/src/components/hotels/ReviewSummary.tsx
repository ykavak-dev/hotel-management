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