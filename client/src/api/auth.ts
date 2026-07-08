import api from './client';
import type { AuthResponse, User } from '../types';

export async function register(name: string, email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/auth/register', {
    name,
    email,
    password,
  });
  return data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post<AuthResponse>('/api/auth/login', {
    email,
    password,
  });
  return data;
}

export async function logout() {
  const { data } = await api.post<{ message: string }>('/api/auth/logout');
  return data;
}

export async function refresh() {
  const { data } = await api.post<{ accessToken: string }>('/api/auth/refresh');
  return data;
}

export async function getMe() {
  const { data } = await api.get<{ user: User }>('/api/auth/me');
  return data;
}
