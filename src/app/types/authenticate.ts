export interface AuthResponse {
  token: string;
  success: boolean;
}

export interface User {
  id: number;
  username: string;
  password: string;
  role: string;
}

export interface Client {
  id?: string;
  name: string;
  phone_number: string;
}
