import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../src/utils/jwt';

describe('jwt utils', () => {
  it('signs and verifies an access token', () => {
    const token = generateAccessToken({ id: 'user-1' });
    const decoded = verifyAccessToken(token);
    expect(typeof decoded).not.toBe('string');
    expect((decoded as { id: string }).id).toBe('user-1');
  });

  it('signs and verifies a refresh token', () => {
    const token = generateRefreshToken({ id: 'user-1' });
    const decoded = verifyRefreshToken(token);
    expect(typeof decoded).not.toBe('string');
    expect((decoded as { id: string }).id).toBe('user-1');
  });

  it('rejects a tampered token', () => {
    const token = generateAccessToken({ id: 'user-1' });
    const tampered = `${token.slice(0, -4)}xxxx`;
    expect(() => verifyAccessToken(tampered)).toThrow();
  });

  it('rejects a token signed with the wrong secret', () => {
    const token = generateAccessToken({ id: 'user-1' });
    const other = jwt.sign({ id: 'user-2' }, 'some-other-secret', {
      expiresIn: '15m',
    });
    expect(() => verifyAccessToken(other)).toThrow();
    expect(() => verifyAccessToken(token)).not.toThrow();
  });
});
