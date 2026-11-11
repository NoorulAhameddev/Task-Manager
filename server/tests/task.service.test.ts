import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetPrismaMock, type MockedPrisma } from './helpers/prisma-mock';

vi.mock('../src/prisma/client', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    task: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import prisma from '../src/prisma/client';
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
} from '../src/services/task.service';

const prismaMock = prisma as unknown as MockedPrisma;

const baseTask = {
  id: 'task-1',
  title: 'Ship it',
  description: null,
  status: 'TODO',
  priority: 'MEDIUM',
  dueDate: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  userId: 'user-1',
};

describe('task service', () => {
  beforeEach(() => {
    resetPrismaMock(prismaMock);
  });

  it('creates a task scoped to the user', async () => {
    prismaMock.task.create.mockResolvedValue(baseTask);

    const task = await createTask('user-1', { title: 'Ship it' });

    expect(prismaMock.task.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: 'user-1', title: 'Ship it', status: 'TODO' }),
      }),
    );
    expect(task).toEqual(baseTask);
  });

  it('filters and sorts tasks by the given options', async () => {
    prismaMock.task.findMany.mockResolvedValue([baseTask]);

    await getTasks('user-1', { status: 'TODO', sortBy: 'dueDate', order: 'asc' });

    expect(prismaMock.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-1', status: 'TODO' }),
        orderBy: { dueDate: 'asc' },
      }),
    );
  });

  it('defaults to createdAt desc ordering', async () => {
    prismaMock.task.findMany.mockResolvedValue([]);

    await getTasks('user-1', {});

    expect(prismaMock.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { createdAt: 'desc' } }),
    );
  });

  it('throws 404 when fetching a task that does not belong to the user', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(getTaskById('user-1', 'other-task')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates a task and clears dueDate when null is provided', async () => {
    prismaMock.task.findFirst.mockResolvedValue(baseTask);
    prismaMock.task.update.mockResolvedValue(baseTask);

    await updateTask('user-1', 'task-1', { dueDate: null });

    expect(prismaMock.task.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ dueDate: null }) }),
    );
  });

  it('refuses to update a task owned by another user', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(updateTask('user-2', 'task-1', { title: 'hijack' })).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(prismaMock.task.update).not.toHaveBeenCalled();
  });

  it('deletes a task owned by the user', async () => {
    prismaMock.task.findFirst.mockResolvedValue(baseTask);
    prismaMock.task.delete.mockResolvedValue(baseTask);

    await deleteTask('user-1', 'task-1');

    expect(prismaMock.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
  });

  it('throws 404 when deleting a task the user does not own', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    await expect(deleteTask('user-2', 'task-1')).rejects.toMatchObject({ statusCode: 404 });
    expect(prismaMock.task.delete).not.toHaveBeenCalled();
  });
});
