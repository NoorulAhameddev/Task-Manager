import { useState, useEffect, useCallback } from 'react';
import * as tasksApi from '../api/tasks';
import { Navbar } from '../components/Navbar';
import type { Task, TaskStatus, TaskPriority, CreateTaskData, UpdateTaskData } from '../types';
import type { AxiosError } from 'axios';
import type { ApiError } from '../types';

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const filters: Record<string, string> = {};
      if (statusFilter) filters.status = statusFilter;
      if (priorityFilter) filters.priority = priorityFilter;
      if (sortBy) filters.sortBy = sortBy;
      if (order) filters.order = order;
      const data = await tasksApi.getTasks(filters as Record<string, string>);
      setTasks(data);
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.error?.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, priorityFilter, sortBy, order]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreate = async (data: CreateTaskData) => {
    try {
      await tasksApi.createTask(data);
      setShowCreateForm(false);
      fetchTasks();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      throw axiosErr;
    }
  };

  const handleUpdate = async (id: string, data: UpdateTaskData) => {
    try {
      await tasksApi.updateTask(id, data);
      setEditingTask(null);
      fetchTasks();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      throw axiosErr;
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await tasksApi.deleteTask(id);
      setDeleteConfirm(null);
      fetchTasks();
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      setError(axiosErr.response?.data?.error?.message || 'Failed to delete task');
    }
  };

  const statusLabel: Record<TaskStatus, string> = {
    TODO: 'To Do',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed',
  };

  const priorityLabel: Record<TaskPriority, string> = {
    LOW: 'Low',
    MEDIUM: 'Medium',
    HIGH: 'High',
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Tasks</h1>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + New Task
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded text-sm">{error}</div>
        )}

        <div className="flex gap-4 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Filter by priority"
          >
            <option value="">All Priorities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Sort tasks by field"
          >
            <option value="createdAt">Created At</option>
            <option value="dueDate">Due Date</option>
          </select>

          <select
            value={order}
            onChange={(e) => setOrder(e.target.value)}
            className="border rounded px-3 py-2"
            aria-label="Sort direction"
          >
            <option value="desc">Newest first</option>
            <option value="asc">Oldest first</option>
          </select>
        </div>

        {showCreateForm && (
          <TaskForm
            onSubmit={handleCreate}
            onCancel={() => setShowCreateForm(false)}
          />
        )}

        {editingTask && (
          <TaskForm
            initial={editingTask}
            onSubmit={(data) => handleUpdate(editingTask.id, data)}
            onCancel={() => setEditingTask(null)}
          />
        )}

        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading tasks...</p>
        ) : tasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No tasks yet. Create one!</p>
        ) : (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white p-4 rounded shadow flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold">{task.title}</h3>
                  <div className="flex gap-2 mt-1 text-sm text-gray-600">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      task.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                      task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {statusLabel[task.status]}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      task.priority === 'HIGH' ? 'bg-red-100 text-red-700' :
                      task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {priorityLabel[task.priority]}
                    </span>
                    {task.dueDate && (
                      <span className="text-gray-500">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingTask(task)}
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  {deleteConfirm === task.id ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="text-sm text-gray-500 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(task.id)}
                      className="text-sm text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TaskForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: Task;
  onSubmit: (data: CreateTaskData) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState<string>(initial?.status || 'TODO');
  const [priority, setPriority] = useState<string>(initial?.priority || 'MEDIUM');
  const [dueDate, setDueDate] = useState(initial?.dueDate?.split('T')[0] || '');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await onSubmit({
        title,
        description: description || undefined,
        status: status as TaskStatus,
        priority: priority as TaskPriority,
        dueDate: dueDate || null,
      });
    } catch (err) {
      const axiosErr = err as AxiosError<ApiError>;
      const msg = axiosErr.response?.data?.error?.message || 'Failed to save task';
      const validationErrors = (axiosErr.response?.data?.error as Record<string, unknown>)?.errors as Array<{ field: string; message: string }>;
      if (validationErrors) {
        setError(validationErrors.map((e) => `${e.field}: ${e.message}`).join('; '));
      } else {
        setError(msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 rounded shadow mb-6 border">
      <h2 className="font-bold mb-4">{initial ? 'Edit Task' : 'Create Task'}</h2>

      {error && (
        <div className="mb-3 p-2 bg-red-100 text-red-700 rounded text-sm">{error}</div>
      )}

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Title *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full border rounded px-3 py-2"
        />
      </div>

      <div className="mb-3">
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full border rounded px-3 py-2"
          rows={3}
        />
      </div>

      <div className="flex gap-4 mb-3">
        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium mb-1">Due Date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="w-full border rounded px-3 py-2"
          />
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {submitting ? 'Saving...' : initial ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
}
