import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { resetPrismaMock, type MockedPrisma } from './helpers/prisma-mock';

vi.mock('../src/prisma/client', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    task: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import prisma from '../src/prisma/client';
import app from '../src/app';
import { generateAccessToken, generateRefreshToken } from '../src/utils/jwt';
import { hashPassword } from '../src/utils/password';

const prismaMock = prisma as unknown as MockedPrisma;

const baseUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  password: 'unused-hash',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

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

describe('auth endpoints', () => {
  beforeEach(() => {
    resetPrismaMock(prismaMock);
  });

  it('registers a user, sets a refresh cookie and never leaks the password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);

    const res = await request(app).post('/api/auth/register').send({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });

    expect(res.status).toBe(201);
    expect(res.body.user).not.toHaveProperty('password');
    expect(res.body.accessToken).toBeTruthy();
    expect(res.headers['set-cookie']?.[0]).toContain('refreshToken');
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'alice@example.com' }),
      }),
    );
  });

  it('normalizes emails to lowercase before storing', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);

    const rawEmail = 'User.Example@Example.COM';

    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: rawEmail, password: 'password123' });

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: rawEmail.toLowerCase() },
    });
    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: rawEmail.toLowerCase() }),
      }),
    );
  });

  it('returns 409 for a duplicate email', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(409);
    expect(res.body.error.message).toBe('Email already in use');
  });

  it('rejects registration with a weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Alice', email: 'alice@example.com', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.errors).toBeTruthy();
  });

  it('logs in with valid credentials', async () => {
    const storedPassword = await hashPassword('password123');
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, password: storedPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'password123' });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.user).not.toHaveProperty('password');
  });

  it('rejects a wrong password with 401', async () => {
    const storedPassword = await hashPassword('password123');
    prismaMock.user.findUnique.mockResolvedValue({ ...baseUser, password: storedPassword });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });

  it('refuses to refresh without a token cookie', async () => {
    const res = await request(app).post('/api/auth/refresh');
    expect(res.status).toBe(401);
  });

  it('refreshes an access token for an existing user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    const refreshToken = generateRefreshToken({ id: 'user-1' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeTruthy();
  });

  it('rejects a refresh token for a deleted user', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    const refreshToken = generateRefreshToken({ id: 'ghost-user' });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', `refreshToken=${refreshToken}`);

    expect(res.status).toBe(401);
  });

  it('returns the current user from /me', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    const accessToken = generateAccessToken({ id: 'user-1' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe('user-1');
  });
});

describe('task endpoints', () => {
  const auth = `Bearer ${generateAccessToken({ id: 'user-1' })}`;

  beforeEach(() => {
    resetPrismaMock(prismaMock);
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('rejects an invalid token', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });

  it('lists tasks for the authenticated user', async () => {
    prismaMock.task.findMany.mockResolvedValue([baseTask]);

    const res = await request(app).get('/api/tasks').set('Authorization', auth);

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(prismaMock.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ userId: 'user-1' }) }),
    );
  });

  it('rejects invalid query filters', async () => {
    const res = await request(app).get('/api/tasks?status=WRONG').set('Authorization', auth);
    expect(res.status).toBe(400);
  });

  it('creates a task', async () => {
    prismaMock.task.create.mockResolvedValue(baseTask);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', auth)
      .send({ title: 'Ship it' });

    expect(res.status).toBe(201);
    expect(res.body.title).toBe('Ship it');
  });

  it('rejects a task with an empty title', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', auth)
      .send({ title: '' });

    expect(res.status).toBe(400);
  });

  it('updates a task', async () => {
    prismaMock.task.findFirst.mockResolvedValue(baseTask);
    prismaMock.task.update.mockResolvedValue({ ...baseTask, status: 'COMPLETED' });

    const res = await request(app)
      .put('/api/tasks/task-1')
      .set('Authorization', auth)
      .send({ status: 'COMPLETED' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('COMPLETED');
  });

  it('returns 404 when updating a task the user does not own', async () => {
    prismaMock.task.findFirst.mockResolvedValue(null);

    const res = await request(app)
      .put('/api/tasks/other-task')
      .set('Authorization', auth)
      .send({ title: 'nope' });

    expect(res.status).toBe(404);
  });

  it('deletes a task', async () => {
    prismaMock.task.findFirst.mockResolvedValue(baseTask);
    prismaMock.task.delete.mockResolvedValue(baseTask);

    const res = await request(app).delete('/api/tasks/task-1').set('Authorization', auth);

    expect(res.status).toBe(204);
  });
});

describe('app-level behaviour', () => {
  it('returns a JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
    expect(res.body.error.message).toBe('Route not found');
  });
});
