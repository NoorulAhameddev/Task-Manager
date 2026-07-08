import api from './client';
import type { Task, CreateTaskData, UpdateTaskData, TaskFilters } from '../types';

export async function getTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.priority) params.set('priority', filters.priority);
  if (filters.sortBy) params.set('sortBy', filters.sortBy);
  if (filters.order) params.set('order', filters.order);

  const query = params.toString();
  const url = query ? `/api/tasks?${query}` : '/api/tasks';
  const { data } = await api.get<Task[]>(url);
  return data;
}

export async function getTask(id: string) {
  const { data } = await api.get<Task>(`/api/tasks/${id}`);
  return data;
}

export async function createTask(taskData: CreateTaskData) {
  const { data } = await api.post<Task>('/api/tasks', taskData);
  return data;
}

export async function updateTask(id: string, taskData: UpdateTaskData) {
  const { data } = await api.put<Task>(`/api/tasks/${id}`, taskData);
  return data;
}

export async function deleteTask(id: string) {
  await api.delete(`/api/tasks/${id}`);
}
