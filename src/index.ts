import { memoNoteHtml } from './homeHtml';
import {
	SESSION_MAX_AGE_SECONDS,
	clearFailedLogins,
	cleanupOldLoginRateLimits,
	createSessionToken,
	buildSessionCookie,
	buildClearedSessionCookie,
	getConfiguredUsername,
	getLoginRateLimit,
	getSession,
	isAuthConfigured,
	isAuthed,
	recordFailedLogin,
	tooManyLoginAttempts,
	verifyCredentials,
} from './auth';
import {
	buildAttachmentKey,
	createAttachment,
	createNote,
	deleteAttachment,
	deleteNote,
	ensureSchema,
	getAttachment,
	getAttachmentStorageMode,
	getNote,
	listNotes,
	normalizeTags,
	readStoredAttachment,
	setNotePinState,
	updateNote,
} from './storage';

type AppEnv = Env & {
	ADMIN_USERNAME?: string;
	ADMIN_PASSWORD?: string;
	COOKIE_SECRET?: string;
	ATTACHMENTS?: R2Bucket;
};

function json(data: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
	return new Response(JSON.stringify(data, null, 2), {
		status,
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'no-store',
			...extraHeaders,
		},
	});
}

function html(content: string) {
	return new Response(content, {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'no-store',
		},
	});
}

function unauthorized() {
	return json({ ok: false, error: 'unauthorized' }, 401);
}

function notFound() {
	return json({ ok: false, error: 'not_found' }, 404);
}

function safeFilename(filename: string) {
	return filename.replace(/[\\/:*?"<>|]/g, '-').trim().replace(/\s+/g, ' ').slice(0, 180) || 'file';
}

function manifestJson() {
	return JSON.stringify({
		name: 'MemoNote',
		short_name: 'MemoNote',
		description: '一个部署在 Cloudflare Workers 上的轻量私人笔记。',
		start_url: '/',
		scope: '/',
		display: 'standalone',
		background_color: '#f7f5ef',
		theme_color: '#f4d36e',
		icons: [
			{
				src: '/app-icon.svg',
				sizes: 'any',
				type: 'image/svg+xml',
				purpose: 'any maskable',
			},
		],
	});
}

const serviceWorkerJs = `const CACHE_NAME = 'memonote-shell-v1';
const APP_SHELL = ['/', '/manifest.webmanifest', '/app-icon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(() => caches.match('/')));
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      });
    })
  );
});`;

const appIconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect x="8" y="6" width="48" height="52" rx="12" fill="#f4d36e"/>
  <rect x="14" y="14" width="36" height="36" rx="8" fill="#ffffff"/>
  <path d="M20 24h24M20 32h24M20 40h18" stroke="#2f2a1f" stroke-width="4.5" stroke-linecap="round"/>
</svg>`;

async function readJsonBody<T>(request: Request): Promise<T | null> {
	return request.json().catch(() => null) as Promise<T | null>;
}

async function renderAttachmentResponse(env: AppEnv, attachmentId: string) {
	const attachment = await getAttachment(env, attachmentId);
	if (!attachment) return notFound();

	const object = await readStoredAttachment(env, attachment.storage_key);
	if (!object) return notFound();

	const headers = new Headers();
	if ('writeHttpMetadata' in object) {
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
	}
	else {
		headers.set('content-type', attachment.content_type);
	}
	headers.set(
		'content-disposition',
		attachment.content_type.startsWith('image/')
			? 'inline'
			: `attachment; filename="${safeFilename(attachment.filename).replace(/"/g, '%22')}"`
	);

	return new Response(object.body as BodyInit, {
		headers,
	});
}

export default {
	async fetch(request: Request, env: AppEnv): Promise<Response> {
		const url = new URL(request.url);

		if (url.pathname === '/manifest.webmanifest') {
			return new Response(manifestJson(), {
				headers: {
					'content-type': 'application/manifest+json; charset=utf-8',
					'cache-control': 'public, max-age=3600',
				},
			});
		}

		if (url.pathname === '/sw.js') {
			return new Response(serviceWorkerJs, {
				headers: {
					'content-type': 'application/javascript; charset=utf-8',
					'cache-control': 'no-store',
				},
			});
		}

		if (url.pathname === '/app-icon.svg') {
			return new Response(appIconSvg, {
				headers: {
					'content-type': 'image/svg+xml; charset=utf-8',
					'cache-control': 'public, max-age=86400',
				},
			});
		}

		if (url.pathname === '/') {
			return html(memoNoteHtml);
		}

		await ensureSchema(env);

		if (url.pathname === '/api/health' && request.method === 'GET') {
			const session = await getSession(request, env);
			if (isAuthConfigured(env) && !session.authenticated) return unauthorized();
			const noteCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM notes').first<{ count: number }>();
			const attachmentCount = await env.DB.prepare('SELECT COUNT(*) AS count FROM attachments').first<{ count: number }>();
			return json({
				ok: true,
				noteCount: noteCount?.count ?? 0,
				attachmentCount: attachmentCount?.count ?? 0,
				authEnabled: isAuthConfigured(env),
				username: getConfiguredUsername(env),
				attachmentStorage: getAttachmentStorageMode(env),
				now: Date.now(),
			});
		}

		if (url.pathname === '/api/session' && request.method === 'GET') {
			const session = await getSession(request, env);
			return json({ ok: true, authenticated: session.authenticated, username: session.username });
		}

		if (url.pathname === '/api/login' && request.method === 'POST') {
			if (!isAuthConfigured(env)) {
				return json({ ok: false, error: 'server auth not configured' }, 500);
			}

			const rateLimit = await getLoginRateLimit(request, env);
			if (rateLimit.limited) {
				return tooManyLoginAttempts(rateLimit.retryAfterSeconds);
			}

			const body = await readJsonBody<{ username?: string; password?: string }>(request);
			const username = body?.username || getConfiguredUsername(env);
			const password = body?.password || '';

			if (!(await verifyCredentials(env, username, password))) {
				const failure = await recordFailedLogin(env, rateLimit.key);
				if (failure.locked) {
					return tooManyLoginAttempts(failure.retryAfterSeconds);
				}
				return unauthorized();
			}

			await clearFailedLogins(env, rateLimit.key);
			await cleanupOldLoginRateLimits(env);

			return json(
				{ ok: true, username: getConfiguredUsername(env) },
				200,
				{
					'set-cookie': buildSessionCookie(request, await createSessionToken(env, getConfiguredUsername(env))),
				}
			);
		}

		if (url.pathname === '/api/logout' && request.method === 'POST') {
			return json(
				{ ok: true },
				200,
				{
					'set-cookie': buildClearedSessionCookie(request),
				}
			);
		}

		if (url.pathname.startsWith('/api/') && !(await isAuthed(request, env))) {
			return unauthorized();
		}

		if (url.pathname === '/api/notes' && request.method === 'GET') {
			return json({ ok: true, notes: await listNotes(env) });
		}

		if (url.pathname === '/api/notes' && request.method === 'POST') {
			const body = await readJsonBody<{
				title?: string;
				content?: string;
				tags?: string[] | string;
			}>(request);

			const rawTitle = (body?.title || '').trim();
			const content = (body?.content || '').trim();
			const title = rawTitle || '无标题';
			const tags = normalizeTags(body?.tags);

			if (!rawTitle && !content) {
				return json({ ok: false, error: 'title/content required' }, 400);
			}

			const now = Date.now();
			const note = await createNote(env, {
				id: crypto.randomUUID(),
				title,
				content,
				tags,
				created_at: now,
				updated_at: now,
			});

			return json({ ok: true, note }, 201);
		}

		if (url.pathname.startsWith('/api/notes/') && !url.pathname.endsWith('/attachments')) {
			const id = decodeURIComponent(url.pathname.slice('/api/notes/'.length));
			if (!id) return json({ ok: false, error: 'missing id' }, 400);

			if (request.method === 'GET') {
				const note = await getNote(env, id);
				if (!note) return notFound();
				return json({ ok: true, note });
			}

			if (request.method === 'PUT') {
				const body = await readJsonBody<{
					title?: string;
					content?: string;
					tags?: string[] | string;
				}>(request);

				const existing = await getNote(env, id);
				if (!existing) return notFound();

				const title = (body?.title || '').trim() || existing.title || '无标题';
				const content = (body?.content || '').trim();
				const tags = normalizeTags(body?.tags);
				const updated = await updateNote(env, id, {
					title,
					content,
					tags,
					updated_at: Date.now(),
				});

				return json({ ok: true, note: updated });
			}

			if (request.method === 'DELETE') {
				await deleteNote(env, id);
				return json({ ok: true });
			}
		}

		if (url.pathname.startsWith('/api/notes/') && url.pathname.endsWith('/pin') && request.method === 'POST') {
			const noteId = decodeURIComponent(
				url.pathname.slice('/api/notes/'.length, url.pathname.length - '/pin'.length)
			);
			if (!noteId) return json({ ok: false, error: 'missing note id' }, 400);

			const note = await getNote(env, noteId);
			if (!note) return notFound();

			const pinnedAt = note.pinned_at ? 0 : Date.now();
			const updated = await setNotePinState(env, noteId, pinnedAt);
			return json({ ok: true, note: updated });
		}

		if (url.pathname.startsWith('/api/attachments/')) {
			const attachmentId = decodeURIComponent(url.pathname.slice('/api/attachments/'.length));
			if (!attachmentId) return json({ ok: false, error: 'missing id' }, 400);

			if (request.method === 'GET') {
				return renderAttachmentResponse(env, attachmentId);
			}

			if (request.method === 'DELETE') {
				const deleted = await deleteAttachment(env, attachmentId);
				if (!deleted) return notFound();
				return json({ ok: true });
			}
		}

		if (url.pathname.startsWith('/api/notes/') && url.pathname.endsWith('/attachments') && request.method === 'POST') {
			const noteId = decodeURIComponent(
				url.pathname.slice('/api/notes/'.length, url.pathname.length - '/attachments'.length)
			);
			if (!noteId) return json({ ok: false, error: 'missing note id' }, 400);

			const note = await getNote(env, noteId);
			if (!note) return notFound();

			const formData = await request.formData();
			const file = formData.get('file');
			if (!(file instanceof File)) {
				return json({ ok: false, error: 'file required' }, 400);
			}

			const attachmentId = crypto.randomUUID();
			const storageKey = buildAttachmentKey(noteId, attachmentId, file.name);
			const created = await createAttachment(
				env,
				{
					id: attachmentId,
					note_id: noteId,
					storage_key: storageKey,
					filename: file.name,
					content_type: file.type || 'application/octet-stream',
					size: file.size,
					created_at: Date.now(),
				},
				await file.arrayBuffer()
			);

			return json({ ok: true, attachment: created }, 201);
		}

		return json({ ok: false, error: 'not_found' }, 404);
	},
} satisfies ExportedHandler<Env>;
