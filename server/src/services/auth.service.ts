import prisma from '../prisma/client';
import { hashPassword, comparePassword } from '../utils/password';
import { AppError } from '../utils/app-error';

function excludePassword<T extends { password: string }>(user: T): Omit<T, 'password'> {
  const { password: _, ...rest } = user;
  return rest;
}

export async function registerUser(name: string, email: string, password: string) {
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError('Email already in use', 409);
  }

  const hashed = await hashPassword(password);
  const user = await prisma.user.create({
    data: { name, email, password: hashed },
  });

  return excludePassword(user);
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
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
