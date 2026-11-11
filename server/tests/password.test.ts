import { describe, it, expect } from 'vitest';
import { hashPassword, comparePassword } from '../src/utils/password';

describe('password utils', () => {
  it('hashes a password and compares correctly', async () => {
    const hash = await hashPassword('correct-horse-battery-staple');
    expect(hash).not.toBe('correct-horse-battery-staple');
    expect(await comparePassword('correct-horse-battery-staple', hash)).toBe(true);
  });

  it('rejects a wrong password', async () => {
    const hash = await hashPassword('right-password');
    expect(await comparePassword('wrong-password', hash)).toBe(false);
  });

  it('produces unique hashes for the same input', async () => {
    const [a, b] = await Promise.all([hashPassword('same'), hashPassword('same')]);
    expect(a).not.toBe(b);
  });
});
