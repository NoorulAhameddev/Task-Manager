import { describe, it, expect } from 'vitest';
import { createTaskSchema, updateTaskSchema, taskQuerySchema } from '../src/validators/task.validator';
import { registerSchema, loginSchema } from '../src/validators/auth.validator';

describe('task validators', () => {
  it('accepts a minimal valid create payload', () => {
    const result = createTaskSchema.safeParse({ title: 'Write tests' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBeUndefined();
      expect(result.data.dueDate).toBeUndefined();
    }
  });

  it('rejects an empty title', () => {
    const result = createTaskSchema.safeParse({ title: '' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid status', () => {
    const result = createTaskSchema.safeParse({ title: 'x', status: 'DONE' });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid due date', () => {
    const result = createTaskSchema.safeParse({ title: 'x', dueDate: 'not-a-date' });
    expect(result.success).toBe(false);
  });

  it('accepts a null due date to clear it', () => {
    const result = updateTaskSchema.safeParse({ dueDate: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.dueDate).toBeNull();
  });

  it('accepts a valid ISO due date', () => {
    const result = createTaskSchema.safeParse({ title: 'x', dueDate: '2026-12-31' });
    expect(result.success).toBe(true);
  });

  it('applies query defaults', () => {
    const result = taskQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sortBy).toBe('createdAt');
      expect(result.data.order).toBe('desc');
    }
  });
});

describe('auth validators', () => {
  it('rejects a short password on register', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid email', () => {
    const result = registerSchema.safeParse({
      name: 'Alice',
      email: 'not-an-email',
      password: 'longenoughpassword',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid login payload', () => {
    const result = loginSchema.safeParse({ email: 'alice@example.com', password: 'x' });
    expect(result.success).toBe(true);
  });
});
