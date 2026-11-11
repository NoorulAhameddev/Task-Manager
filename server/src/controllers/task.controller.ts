import { Request, Response, NextFunction } from 'express';
import * as taskService from '../services/task.service';
import type { TaskFilters } from '../services/task.service';

function getUserId(req: Request): string {
  const payload = req.user;
  return typeof payload === 'string' ? payload : payload?.id ?? '';
}

function getParamId(req: Request): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const task = await taskService.createTask(userId, req.body);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const filters = (req.validatedQuery ?? {}) as TaskFilters;
    const tasks = await taskService.getTasks(userId, filters);
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
}

export async function getOne(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const task = await taskService.getTaskById(userId, getParamId(req));
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    const task = await taskService.updateTask(userId, getParamId(req), req.body);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = getUserId(req);
    await taskService.deleteTask(userId, getParamId(req));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
