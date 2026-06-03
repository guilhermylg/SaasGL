// ==============================
// StatPitch - Database Types
// Espelha as tabelas do Supabase
// ==============================

export type MatchStatus = "SCHEDULED" | "LIVE" | "FINISHED";

export type PaymentStatus = "PENDING" | "CONFIRMED";

export interface User {
  id: string;
  full_name: string;
  avatar_url: string | null;
  created_at: string;
}

export interface League {
  id: string;
  name: string;
  admin_id: string;
  pix_key: string;
  entry_fee: number;
  created_at: string;
}

export interface LeagueMember {
  id: string;
  league_id: string;
  user_id: string;
  payment_status: boolean;
  joined_at: string;
}

export interface Match {
  id: string;
  home_team: string;
  away_team: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: MatchStatus;
  group_label: string | null;
  stadium: string | null;
}

export interface Prediction {
  id: string;
  user_id: string;
  match_id: string;
  league_id: string;
  home_prediction: number;
  away_prediction: number;
  points_earned: number | null;
  created_at: string;
}

// ==============================
// Derived / View Types
// ==============================

export interface RankingEntry {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  total_points: number;
  exact_scores: number;
  correct_winners: number;
  total_predictions: number;
  rank: number;
}

export interface MatchWithPrediction extends Match {
  prediction?: Prediction;
}
