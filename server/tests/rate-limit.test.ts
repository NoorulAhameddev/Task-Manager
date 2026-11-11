import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createAuthLimiter } from '../src/middleware/rateLimiter';

describe('auth rate limiter', () => {
  it('rejects requests beyond the configured limit with 429', async () => {
    const app = express();
    app.use(createAuthLimiter(3));
    app.get('/', (_req, res) => res.status(200).send('ok'));

    const ok = await request(app).get('/');
    expect(ok.status).toBe(200);

    await request(app).get('/');
    await request(app).get('/');

    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.message).toBe('Too many requests, please try again later');
  });
});
