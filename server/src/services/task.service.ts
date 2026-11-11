import { Prisma, TaskPriority, TaskStatus } from '@prisma/client';
import prisma from '../prisma/client';
import { AppError } from '../utils/app-error';

type CreateData = {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
};

type UpdateData = Partial<CreateData>;

type TaskFilters = {
  status?: TaskStatus;
  priority?: TaskPriority;
  sortBy?: 'dueDate' | 'createdAt';
  order?: 'asc' | 'desc';
};

export type { TaskFilters };

function toPrismaWhere(filters: TaskFilters): Prisma.TaskWhereInput {
  return {
    ...(filters.status ? { status: filters.status } : {}),
    ...(filters.priority ? { priority: filters.priority } : {}),
  };
}

export async function createTask(userId: string, data: CreateData) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status ?? 'TODO',
      priority: data.priority ?? 'MEDIUM',
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      userId,
    },
  });
  return task;
}

export async function getTasks(userId: string, filters: TaskFilters) {
  const sortBy = filters.sortBy === 'dueDate' ? 'dueDate' : 'createdAt';
  const order = filters.order === 'asc' ? 'asc' : 'desc';

  const tasks = await prisma.task.findMany({
    where: { userId, ...toPrismaWhere(filters) },
    orderBy: { [sortBy]: order },
  });
  return tasks;
}

export async function getTaskById(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  if (!task) {
    throw new AppError('Task not found', 404);
  }
  return task;
}

export async function updateTask(userId: string, taskId: string, data: UpdateData) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  const task = await prisma.task.update({
    where: { id: taskId },
    data: {
      ...(data.title !== undefined ? { title: data.title } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.dueDate !== undefined
        ? { dueDate: data.dueDate === null ? null : new Date(data.dueDate) }
        : {}),
    },
  });
  return task;
}

export async function deleteTask(userId: string, taskId: string) {
  const existing = await prisma.task.findFirst({
    where: { id: taskId, userId },
  });
  if (!existing) {
    throw new AppError('Task not found', 404);
  }

  await prisma.task.delete({ where: { id: taskId } });
}
