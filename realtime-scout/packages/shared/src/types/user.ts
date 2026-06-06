export interface User {
  id: number;
  username: string;
  nickname: string | null;
  avatar_url: string | null;
  phone: string | null;
  balance: number;
  frozen_balance: number;
  rating: number;
  total_published: number;
  total_completed: number;
  created_at: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}
