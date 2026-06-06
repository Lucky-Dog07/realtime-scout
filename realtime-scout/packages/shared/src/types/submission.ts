export interface Submission {
  id: number;
  task_id: number;
  acceptor_id: number;
  description: string | null;
  submit_lng: number | null;
  submit_lat: number | null;
  distance_to_task: number | null;
  status: 'pending' | 'approved' | 'rejected';
  photos: SubmissionPhoto[];
  created_at: string;
}

export interface SubmissionPhoto {
  id: number;
  submission_id: number;
  photo_url: string;
  created_at: string;
}
