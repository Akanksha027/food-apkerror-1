/**
 * Review & Rating Service.
 * Gateway: /api/v1/review-service
 */

export type PaginationMeta = {
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
  hasNext?: boolean;
};

export type RestaurantReview = {
  id: string;
  restaurantId?: string;
  orderId?: string;
  userId?: string;
  userName?: string;
  rating: number;
  comment?: string;
  title?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type RatingDistribution = {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
};

export type ReviewStats = {
  average: number;
  total: number;
  distribution: RatingDistribution;
};

export type ReviewListResult = {
  reviews: RestaurantReview[];
  meta?: PaginationMeta;
};

export type SubmitReviewPayload = {
  rating: number;
  comment?: string;
  title?: string;
  orderId?: string;
};
