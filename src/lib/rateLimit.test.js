import { checkRateLimit, _resetRateLimitBuckets } from './rateLimit';

describe('checkRateLimit', () => {
  beforeEach(() => {
    _resetRateLimitBuckets();
  });

  test('সীমার মধ্যে থাকলে অনুমতি দেয়', () => {
    const result = checkRateLimit('user-a', { maxRequests: 3, windowMs: 60_000 });
    expect(result.allowed).toBe(true);
  });

  test('সীমা অতিক্রম করলে block করে', () => {
    checkRateLimit('user-b', { maxRequests: 2, windowMs: 60_000 });
    checkRateLimit('user-b', { maxRequests: 2, windowMs: 60_000 });
    const third = checkRateLimit('user-b', { maxRequests: 2, windowMs: 60_000 });

    expect(third.allowed).toBe(false);
    expect(third.retryAfterMs).toBeGreaterThan(0);
  });

  test('আলাদা key আলাদাভাবে গোনা হয় (একজনের limit অন্যজনকে প্রভাবিত করে না)', () => {
    checkRateLimit('user-c1', { maxRequests: 1, windowMs: 60_000 });
    const blockedC1 = checkRateLimit('user-c1', { maxRequests: 1, windowMs: 60_000 });
    const allowedC2 = checkRateLimit('user-c2', { maxRequests: 1, windowMs: 60_000 });

    expect(blockedC1.allowed).toBe(false);
    expect(allowedC2.allowed).toBe(true);
  });

  test('window পার হয়ে গেলে আবার অনুমতি দেয়', async () => {
    checkRateLimit('user-d', { maxRequests: 1, windowMs: 50 });
    const blocked = checkRateLimit('user-d', { maxRequests: 1, windowMs: 50 });
    expect(blocked.allowed).toBe(false);

    await new Promise((resolve) => setTimeout(resolve, 60));

    const allowedAgain = checkRateLimit('user-d', { maxRequests: 1, windowMs: 50 });
    expect(allowedAgain.allowed).toBe(true);
  });
});
