import { apiRequest } from "./queryClient";

interface AuthResponse {
  id: number;
  username: string;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/api/auth/login", { username, password });
  return res.json();
}

export async function register(username: string, password: string): Promise<AuthResponse> {
  const res = await apiRequest("POST", "/api/auth/register", { username, password });
  return res.json();
}
