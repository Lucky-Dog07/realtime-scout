export type TaskStatus = 'pending' | 'accepted' | 'submitted' | 'confirmed' | 'completed' | 'expired' | 'cancelled';

export interface Task {
  id: number;
  publisher_id: number;
  acceptor_id: number | null;
  title: string;
  description: string;
  lng: number;
  lat: number;
  location_name: string;
  reward: number;
  photo_count: number;
  status: TaskStatus;
  deadline: string;
  accepted_at: string | null;
  submitted_at: string | null;
  confirmed_at: string | null;
  created_at: string;
  distance?: number;
}

export interface CreateTaskRequest {
  title: string;
  description: string;
  lng: number;
  lat: number;
  location_name: string;
  reward: number;
  photo_count?: number;
  deadline_minutes: number;
}
