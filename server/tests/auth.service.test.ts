import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resetPrismaMock, type MockedPrisma } from './helpers/prisma-mock';

vi.mock('../src/prisma/client', () => ({
  default: {
    user: { findUnique: vi.fn(), create: vi.fn() },
    task: { findMany: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), delete: vi.fn() },
  },
}));

import prisma from '../src/prisma/client';
import { registerUser, loginUser, findUserById } from '../src/services/auth.service';

const prismaMock = prisma as unknown as MockedPrisma;

const baseUser = {
  id: 'user-1',
  name: 'Alice',
  email: 'alice@example.com',
  password: 'hashed-password',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
};

describe('auth service', () => {
  beforeEach(() => {
    resetPrismaMock(prismaMock);
  });

  it('registers a user and never returns the password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue(baseUser);

    const user = await registerUser('Alice', 'alice@example.com', 'super-secret-password');

    expect(prismaMock.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ email: 'alice@example.com' }),
      }),
    );
    expect(user).not.toHaveProperty('password');
  });

  it('rejects a duplicate email with 409', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);

    await expect(registerUser('Alice', 'alice@example.com', 'super-secret-password')).rejects.toMatchObject({
      statusCode: 409,
    });
    expect(prismaMock.user.create).not.toHaveBeenCalled();
  });

  it('logs in with valid credentials and strips the password', async () => {
    prismaMock.user.findUnique.mockResolvedValue(baseUser);
    vi.spyOn(await import('../src/utils/password'), 'comparePassword').mockResolvedValue(true);

    const user = await loginUser('alice@example.com', 'super-secret-password');
    expect(user).not.toHaveProperty('password');
  });

  it('rejects invalid credentials with 401', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(loginUser('alice@example.com', 'wrong')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('throws 404 when the user does not exist', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await expect(findUserById('nope')).rejects.toMatchObject({ statusCode: 404 });
  });
});
