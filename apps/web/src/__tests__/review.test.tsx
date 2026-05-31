import { describe, it, expect } from 'vitest';

// ==================== REVIEW TESTS ====================

describe('Review API', () => {
  describe('POST /api/reviews', () => {
    it('authenticated user can submit review', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 5,
          comment: 'Excellent hotel with great service!',
        }),
      });

      expect(response.status).toBe(201);
      const review = await response.json();
      expect(review).toHaveProperty('id');
      expect(review.hotelId).toBe('hotel-1');
      expect(review.rating).toBe(5);
      expect(review.comment).toBe('Excellent hotel with great service!');
      expect(review.userId).toBe('user-1');
      expect(review.isApproved).toBe(false); // Reviews need approval
    });

    it('unauthenticated user cannot submit review', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 5,
          comment: 'Great!',
        }),
      });

      expect(response.status).toBe(401);
    });

    it('rejects review with rating below 1', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 0,
          comment: 'Terrible!',
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Rating must be between 1 and 5');
    });

    it('rejects review with rating above 5', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 6,
          comment: 'Amazing!',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('rejects review with empty comment', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 4,
          comment: '   ', // whitespace only
        }),
      });

      expect(response.status).toBe(400);
      const error = await response.json();
      expect(error.error).toContain('Review comment cannot be empty');
    });

    it('rejects review without comment', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 4,
        }),
      });

      expect(response.status).toBe(400);
    });

    it('rejects review without rating', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          comment: 'No rating provided',
        }),
      });

      expect(response.status).toBe(400);
    });

    it('review is connected to correct hotel and user', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-2',
          rating: 4,
          comment: 'Good beach hotel',
        }),
      });

      expect(response.status).toBe(201);
      const review = await response.json();
      expect(review.hotelId).toBe('hotel-2');
      expect(review.userId).toBe('user-1');
      expect(review.userName).toBe('Test User');
    });

    it('accepts review with rating of exactly 1 (minimum)', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 1,
          comment: 'Poor experience',
        }),
      });

      expect(response.status).toBe(201);
      const review = await response.json();
      expect(review.rating).toBe(1);
    });

    it('accepts review with rating of exactly 5 (maximum)', async () => {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
        body: JSON.stringify({
          hotelId: 'hotel-1',
          rating: 5,
          comment: 'Perfect!',
        }),
      });

      expect(response.status).toBe(201);
      const review = await response.json();
      expect(review.rating).toBe(5);
    });
  });

  describe('GET /api/reviews/my-reviews', () => {
    it('user can view their own reviews', async () => {
      const response = await fetch('/api/reviews/my-reviews', {
        headers: {
          'Authorization': 'Bearer mock-jwt-token-user-1',
        },
      });

      expect(response.status).toBe(200);
      const reviews = await response.json();
      expect(Array.isArray(reviews)).toBe(true);

      // All reviews should belong to user-1
      reviews.forEach((review: any) => {
        expect(review.userId).toBe('user-1');
      });
    });

    it('unauthenticated user cannot view reviews', async () => {
      const response = await fetch('/api/reviews/my-reviews');
      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/hotels/:id/reviews', () => {
    it('returns approved reviews for hotel', async () => {
      const response = await fetch('/api/hotels/hotel-1/reviews');
      expect(response.status).toBe(200);

      const reviews = await response.json();
      expect(Array.isArray(reviews)).toBe(true);

      // Only approved reviews should be returned
      reviews.forEach((review: any) => {
        expect(review.isApproved).toBe(true);
      });
    });

    it('public endpoint does not require authentication', async () => {
      const response = await fetch('/api/hotels/hotel-1/reviews');
      expect(response.status).toBe(200);
    });
  });
});
