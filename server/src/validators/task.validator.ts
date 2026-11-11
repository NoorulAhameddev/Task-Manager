import { z } from 'zod';

export const taskStatusEnum = z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED']);
export const taskPriorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

export const optionalDate = z
  .string()
  .refine((value) => !Number.isNaN(Date.parse(value)), 'Invalid due date format')
  .nullable()
  .optional();

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title must be 200 characters or less'),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: optionalDate,
});

export const updateTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less')
    .optional(),
  description: z.string().max(2000, 'Description must be 2000 characters or less').optional(),
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  dueDate: optionalDate,
});

export const taskQuerySchema = z.object({
  status: taskStatusEnum.optional(),
  priority: taskPriorityEnum.optional(),
  sortBy: z.enum(['dueDate', 'createdAt']).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
});
