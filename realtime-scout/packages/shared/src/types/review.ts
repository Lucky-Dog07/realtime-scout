export type ReviewerRole = 'publisher' | 'acceptor';

export interface Review {
  id: number;
  task_id: number;
  reviewer_id: number;
  reviewee_id: number;
  reviewer_role: ReviewerRole;
  score_1: number;
  score_2: number;
  score_3: number;
  overall: number;
  comment: string | null;
  created_at: string;
  task_title?: string;
  reviewer_nickname?: string | null;
  reviewer_username?: string;
  reviewer_avatar_url?: string | null;
  reviewee_nickname?: string | null;
  reviewee_username?: string;
  reviewee_avatar_url?: string | null;
}

export interface CreateReviewRequest {
  score_1: number;
  score_2: number;
  score_3: number;
  comment?: string;
}

export interface ReviewAggregate {
  rating: number;
  count: number;
  avg_score_1: number;
  avg_score_2: number;
  avg_score_3: number;
}
