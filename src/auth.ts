type AuthEnv = {
	DB: D1Database;
	ADMIN_USERNAME?: string;
	ADMIN_PASSWORD?: string;
	COOKIE_SECRET?: string;
};

export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
const LOGIN_MAX_FAILED_ATTEMPTS = 5;
const LOGIN_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const DEFAULT_USERNAME = 'admin';

function getCookie(request: Request, name: string) {
	const cookie = request.headers.get('cookie') || '';
	const parts = cookie.split(';').map((item) => item.trim());
	const prefix = name + '=';
	for (const part of parts) {
		if (part.startsWith(prefix)) return decodeURIComponent(part.slice(prefix.length));
	}
	return '';
}

function base64UrlEncode(input: string | Uint8Array) {
	const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
	let binary = '';
	const chunkSize = 0x8000;
	for (let i = 0; i < bytes.length; i += chunkSize) {
		binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
	}
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlDecode(input: string) {
	const padded = input.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (input.length % 4)) % 4);
	const binary = atob(padded);
	const bytes = new Uint8Array(binary.length);
	for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}

async function hmacSha256Base64Url(secret: string, data: string) {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
	return base64UrlEncode(new Uint8Array(signature));
}

function safeEqual(a: string, b: string) {
	if (a.length !== b.length) return false;
	let diff = 0;
	for (let i = 0; i < a.length; i += 1) {
		diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return diff === 0;
}

export function getConfiguredUsername(env: AuthEnv) {
	return (env.ADMIN_USERNAME || DEFAULT_USERNAME).trim() || DEFAULT_USERNAME;
}

export function isAuthConfigured(env: AuthEnv) {
	return Boolean(env.ADMIN_PASSWORD && env.COOKIE_SECRET);
}

export async function verifyCredentials(env: AuthEnv, username: string, password: string) {
	if (!isAuthConfigured(env)) return false;
	return safeEqual(username.trim(), getConfiguredUsername(env)) && safeEqual(password, env.ADMIN_PASSWORD || '');
}

export async function createSessionToken(env: AuthEnv, username = DEFAULT_USERNAME) {
	if (!env.COOKIE_SECRET) return '';
	const now = Math.floor(Date.now() / 1000);
	const payload = base64UrlEncode(
		JSON.stringify({
			v: 1,
			username: username.trim() || DEFAULT_USERNAME,
			iat: now,
			exp: now + SESSION_MAX_AGE_SECONDS,
		})
	);
	const signature = await hmacSha256Base64Url(env.COOKIE_SECRET, payload);
	return `${payload}.${signature}`;
}

export function buildSessionCookie(request: Request, token: string) {
	const secure = new URL(request.url).protocol === 'https:';
	return `session=${token}; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function buildClearedSessionCookie(request: Request) {
	const secure = new URL(request.url).protocol === 'https:';
	return `session=; HttpOnly;${secure ? ' Secure;' : ''} SameSite=Lax; Path=/; Max-Age=0`;
}

async function verifySessionToken(env: AuthEnv, token: string) {
	if (!env.COOKIE_SECRET) return null;
	const [payload, signature] = token.split('.');
	if (!payload || !signature || token.split('.').length !== 2) return null;
	const expected = await hmacSha256Base64Url(env.COOKIE_SECRET, payload);
	if (!safeEqual(signature, expected)) return null;

	try {
		const data = JSON.parse(base64UrlDecode(payload)) as { exp?: number; v?: number; username?: string };
		if (data.v !== 1 || typeof data.exp !== 'number' || data.exp <= Math.floor(Date.now() / 1000)) {
			return null;
		}
		return (data.username || DEFAULT_USERNAME).trim() || DEFAULT_USERNAME;
	} catch {
		return null;
	}
}

export async function getSession(request: Request, env: AuthEnv) {
	if (!isAuthConfigured(env)) {
		return { authenticated: true, username: getConfiguredUsername(env) };
	}

	const session = getCookie(request, 'session');
	if (!session) return { authenticated: false, username: getConfiguredUsername(env) };
	const username = await verifySessionToken(env, session);
	return username
		? { authenticated: true, username }
		: { authenticated: false, username: getConfiguredUsername(env) };
}

export async function isAuthed(request: Request, env: AuthEnv) {
	return (await getSession(request, env)).authenticated;
}

export async function getAuthedUsername(request: Request, env: AuthEnv) {
	return (await getSession(request, env)).username;
}

function getClientIp(request: Request) {
	return (
		request.headers.get('cf-connecting-ip') ||
		request.headers.get('x-real-ip') ||
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		'unknown'
	);
}

async function getLoginRateLimitKey(request: Request, env: AuthEnv) {
	const userAgent = (request.headers.get('user-agent') || 'unknown').slice(0, 160);
	return hmacSha256Base64Url(env.COOKIE_SECRET || 'missing-secret', `login:${getClientIp(request)}:${userAgent}`);
}

export async function getLoginRateLimit(request: Request, env: AuthEnv) {
	const key = await getLoginRateLimitKey(request, env);
	const now = Date.now();
	const row = await env.DB.prepare(
		`SELECT attempts, first_attempt_at, locked_until
		 FROM auth_rate_limits
		 WHERE key = ?
		 LIMIT 1`
	)
		.bind(key)
		.first<{ attempts: number; first_attempt_at: number; locked_until: number }>();

	if (row?.locked_until && row.locked_until > now) {
		return {
			key,
			limited: true,
			retryAfterSeconds: Math.ceil((row.locked_until - now) / 1000),
		};
	}

	return {
		key,
		limited: false,
		retryAfterSeconds: 0,
	};
}

export async function recordFailedLogin(env: AuthEnv, key: string) {
	const now = Date.now();
	const row = await env.DB.prepare(
		`SELECT attempts, first_attempt_at
		 FROM auth_rate_limits
		 WHERE key = ?
		 LIMIT 1`
	)
		.bind(key)
		.first<{ attempts: number; first_attempt_at: number }>();

	const isFreshWindow = !row || now - row.first_attempt_at > LOGIN_RATE_LIMIT_WINDOW_MS;
	const attempts = isFreshWindow ? 1 : row!.attempts + 1;
	const firstAttemptAt = isFreshWindow ? now : row!.first_attempt_at;
	const lockedUntil = attempts >= LOGIN_MAX_FAILED_ATTEMPTS ? now + LOGIN_LOCKOUT_MS : 0;

	await env.DB.prepare(
		`INSERT INTO auth_rate_limits (key, attempts, first_attempt_at, locked_until, updated_at)
		 VALUES (?, ?, ?, ?, ?)
		 ON CONFLICT(key) DO UPDATE SET
			attempts = excluded.attempts,
			first_attempt_at = excluded.first_attempt_at,
			locked_until = excluded.locked_until,
			updated_at = excluded.updated_at`
	)
		.bind(key, attempts, firstAttemptAt, lockedUntil, now)
		.run();

	return {
		attempts,
		locked: lockedUntil > now,
		retryAfterSeconds: lockedUntil > now ? Math.ceil((lockedUntil - now) / 1000) : 0,
	};
}

export async function clearFailedLogins(env: AuthEnv, key: string) {
	await env.DB.prepare('DELETE FROM auth_rate_limits WHERE key = ?').bind(key).run();
}

export async function cleanupOldLoginRateLimits(env: AuthEnv) {
	const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
	await env.DB.prepare('DELETE FROM auth_rate_limits WHERE updated_at < ?').bind(cutoff).run();
}

export function tooManyLoginAttempts(retryAfterSeconds: number) {
	const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));
	return new Response(
		JSON.stringify(
			{
				ok: false,
				error: `登录失败次数过多，请 ${minutes} 分钟后再试`,
				retryAfterSeconds,
			},
			null,
			2
		),
		{
			status: 429,
			headers: {
				'content-type': 'application/json; charset=utf-8',
				'cache-control': 'no-store',
				'retry-after': String(retryAfterSeconds),
			},
		}
	);
}
