export interface AuthUser {
  email: string;
  id: string;
  role: string;
  username: string;
  full_name: string;
  division: string;
  division_id: number;
}

export interface Profile {
  id: string;
  full_name: string;
  username: string;
  email: string;
  division: string;
}
