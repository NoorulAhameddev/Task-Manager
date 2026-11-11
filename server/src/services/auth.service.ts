import prisma from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { AppError } from '../utils/app-error';

function excludePassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  const { password: _password, ...rest } = user;
  return rest;
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export async function registerUser(name: string, email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email: normalizedEmail, password: hashed },
  });

  return excludePassword(user);
}

export async function loginUser(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    throw new AppError('Invalid email or password', 401);
  }

  const valid = await comparePassword(password, user.password);
  if (!valid) {
    throw new AppError('Invalid email or password', 401);
  }

  return excludePassword(user);
}

export async function findUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return excludePassword(user);
}
