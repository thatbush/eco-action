export type UserRole = "admin" | "org_owner" | "org_member" | "user";

export interface UserProfile {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: UserRole;
  org_id: string | null;
  created_at: string;
  updated_at: string;
}