import cookie from '@fastify/cookie';
import csrfProtection from '@fastify/csrf-protection';
import session from '@fastify/session';
import Fastify, { FastifyInstance } from 'fastify';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Mirrors the exact plugin registration and hook used in auth.ts, minus OIDC/DB wiring,
// so the test exercises the real @fastify/csrf-protection + @fastify/session behavior.
function buildServer() {
  const fastify = Fastify();
  fastify.register(cookie);
  fastify.register(session, { secret: 'a'.repeat(32), cookie: { secure: false } });
  fastify.register(csrfProtection, { sessionPlugin: '@fastify/session' });

  fastify.addHook('preValidation', (req, reply, done) => {
    if (req.method === 'POST' && req.url.startsWith('/trpc')) {
      fastify.csrfProtection(req, reply, done);
    } else {
      done();
    }
  });

  fastify.get('/auth/user', async (_req, reply) => {
    return { csrfToken: reply.generateCsrf() };
  });

  fastify.get('/trpc/some.query', async () => ({ ok: true }));
  fastify.post('/trpc/some.mutation', async () => ({ ok: true }));

  return fastify;
}

function getSessionCookie(response: { cookies: { name: string; value: string }[] }) {
  const sessionCookie = response.cookies.find((c) => c.name === 'sessionId');
  return `${sessionCookie?.name}=${sessionCookie?.value}`;
}

describe('csrf protection', () => {
  let fastify: FastifyInstance;

  beforeEach(async () => {
    fastify = buildServer();
    await fastify.ready();
  });

  afterEach(async () => {
    await fastify.close();
  });

  it('rejects a POST /trpc mutation with no session/token at all', async () => {
    const response = await fastify.inject({ method: 'POST', url: '/trpc/some.mutation' });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('FST_CSRF_MISSING_SECRET');
  });

  it('rejects a POST /trpc mutation carrying a valid session but a wrong token', async () => {
    const tokenResponse = await fastify.inject({ method: 'GET', url: '/auth/user' });
    const sessionCookie = getSessionCookie(tokenResponse);

    const response = await fastify.inject({
      method: 'POST',
      url: '/trpc/some.mutation',
      headers: { cookie: sessionCookie, 'csrf-token': 'not-the-real-token' },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('FST_CSRF_INVALID_TOKEN');
  });

  it('accepts a POST /trpc mutation carrying the token issued for that session', async () => {
    const tokenResponse = await fastify.inject({ method: 'GET', url: '/auth/user' });
    const sessionCookie = getSessionCookie(tokenResponse);
    const { csrfToken } = tokenResponse.json();

    const response = await fastify.inject({
      method: 'POST',
      url: '/trpc/some.mutation',
      headers: { cookie: sessionCookie, 'csrf-token': csrfToken },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it('does not gate GET /trpc queries at all', async () => {
    const response = await fastify.inject({ method: 'GET', url: '/trpc/some.query' });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ ok: true });
  });

  it('rejects a token issued for a different session', async () => {
    const firstToken = await fastify.inject({ method: 'GET', url: '/auth/user' });
    const { csrfToken } = firstToken.json();

    const secondSession = await fastify.inject({ method: 'GET', url: '/auth/user' });
    const secondSessionCookie = getSessionCookie(secondSession);

    const response = await fastify.inject({
      method: 'POST',
      url: '/trpc/some.mutation',
      headers: { cookie: secondSessionCookie, 'csrf-token': csrfToken },
    });

    expect(response.statusCode).toBe(403);
    expect(response.json().code).toBe('FST_CSRF_INVALID_TOKEN');
  });
});
