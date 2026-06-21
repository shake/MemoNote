import { beforeEach, describe, expect, it } from 'vitest';
import worker from '../src';

type MockAttachment = {
	body: ArrayBuffer;
	httpMetadata: {
		contentType?: string;
		contentDisposition?: string;
	};
};

class MockR2Object {
	constructor(private readonly entry: MockAttachment, public readonly httpEtag: string) {}

	writeHttpMetadata(headers: Headers) {
		if (this.entry.httpMetadata.contentType) {
			headers.set('content-type', this.entry.httpMetadata.contentType);
		}
		if (this.entry.httpMetadata.contentDisposition) {
			headers.set('content-disposition', this.entry.httpMetadata.contentDisposition);
		}
	}

	get body() {
		return this.entry.body;
	}
}

class MockR2Bucket {
	private readonly objects = new Map<string, MockAttachment>();

	async put(
		key: string,
		body: ArrayBuffer,
		options?: { httpMetadata?: { contentType?: string; contentDisposition?: string } }
	) {
		this.objects.set(key, {
			body,
			httpMetadata: options?.httpMetadata || {},
		});
	}

	async get(key: string) {
		const entry = this.objects.get(key);
		if (!entry) return null;
		return new MockR2Object(entry, `mock-${key}`);
	}

	async delete(key: string) {
		this.objects.delete(key);
	}
}

type NoteRow = {
	id: string;
	title: string;
	content: string;
	tags: string;
	created_at: number;
	updated_at: number;
};

type AttachmentRow = {
	id: string;
	note_id: string;
	storage_key: string;
	filename: string;
	content_type: string;
	size: number;
	created_at: number;
};

class MockStatement {
	private params: unknown[] = [];

	constructor(private readonly db: MockD1Database, private readonly sql: string) {}

	bind(...params: unknown[]) {
		this.params = params;
		return this;
	}

	async first<T>() {
		const rows = await this.execute();
		return (rows[0] || null) as T | null;
	}

	async all<T>() {
		return { results: (await this.execute()) as T[] };
	}

	async run() {
		await this.execute();
		return { success: true, meta: { changes: 1 } };
	}

	private async execute() {
		const sql = this.sql.toLowerCase().replace(/\s+/g, ' ').trim();

		if (sql.startsWith('create table') || sql.startsWith('create index') || sql.startsWith('create virtual table') || sql.startsWith('create trigger')) {
			return [];
		}

		if (sql.includes('count(*) as count from notes')) {
			return [{ count: this.db.notes.size }];
		}

		if (sql.includes('count(*) as count from attachments')) {
			return [{ count: this.db.attachments.size }];
		}

		if (sql.includes('from auth_rate_limits where key = ? limit 1') && sql.includes('locked_until')) {
			const key = String(this.params[0]);
			const row = this.db.authRateLimits.get(key);
			return row ? [row] : [];
		}

		if (sql.includes('from auth_rate_limits where key = ? limit 1')) {
			const key = String(this.params[0]);
			const row = this.db.authRateLimits.get(key);
			return row ? [{ attempts: row.attempts, first_attempt_at: row.first_attempt_at }] : [];
		}

		if (sql.startsWith('insert into auth_rate_limits')) {
			const [key, attempts, firstAttemptAt, lockedUntil, updatedAt] = this.params as [string, number, number, number, number];
			this.db.authRateLimits.set(key, {
				key,
				attempts,
				first_attempt_at: firstAttemptAt,
				locked_until: lockedUntil,
				updated_at: updatedAt,
			});
			return [];
		}

		if (sql.startsWith('delete from auth_rate_limits where key = ?')) {
			this.db.authRateLimits.delete(String(this.params[0]));
			return [];
		}

		if (sql.startsWith('delete from auth_rate_limits where updated_at < ?')) {
			const cutoff = Number(this.params[0]);
			for (const [key, row] of this.db.authRateLimits.entries()) {
				if (row.updated_at < cutoff) this.db.authRateLimits.delete(key);
			}
			return [];
		}

		if (sql.startsWith('insert into notes')) {
			const [id, title, content, tags, createdAt, updatedAt] = this.params as [string, string, string, string, number, number];
			this.db.notes.set(id, { id, title, content, tags, created_at: createdAt, updated_at: updatedAt });
			return [];
		}

		if (sql.startsWith('update notes')) {
			const [title, content, tags, updatedAt, id] = this.params as [string, string, string, number, string];
			const existing = this.db.notes.get(id);
			if (existing) {
				this.db.notes.set(id, { ...existing, title, content, tags, updated_at: updatedAt });
			}
			return [];
		}

		if (sql.startsWith('delete from notes where id = ?')) {
			this.db.notes.delete(String(this.params[0]));
			return [];
		}

		if (sql.includes('from notes where id = ? limit 1')) {
			const id = String(this.params[0]);
			const row = this.db.notes.get(id);
			return row ? [row] : [];
		}

		if (sql.includes('from notes order by updated_at desc')) {
			return Array.from(this.db.notes.values()).sort((a, b) => b.updated_at - a.updated_at);
		}

		if (sql.startsWith('insert into attachments')) {
			const [id, noteId, storageKey, filename, contentType, size, createdAt] = this.params as [
				string,
				string,
				string,
				string,
				string,
				number,
				number,
			];
			this.db.attachments.set(id, {
				id,
				note_id: noteId,
				storage_key: storageKey,
				filename,
				content_type: contentType,
				size,
				created_at: createdAt,
			});
			return [];
		}

		if (sql.startsWith('delete from attachments where id = ?')) {
			this.db.attachments.delete(String(this.params[0]));
			return [];
		}

		if (sql.startsWith('delete from attachments where note_id = ?')) {
			const noteId = String(this.params[0]);
			for (const [id, row] of this.db.attachments.entries()) {
				if (row.note_id === noteId) this.db.attachments.delete(id);
			}
			return [];
		}

		if (sql.includes('from attachments where id = ? limit 1')) {
			const row = this.db.attachments.get(String(this.params[0]));
			return row ? [row] : [];
		}

		if (sql.includes('from attachments where note_id = ? order by created_at desc')) {
			const noteId = String(this.params[0]);
			return Array.from(this.db.attachments.values())
				.filter((row) => row.note_id === noteId)
				.sort((a, b) => b.created_at - a.created_at);
		}

		if (sql.includes('from attachments order by created_at desc')) {
			return Array.from(this.db.attachments.values()).sort((a, b) => b.created_at - a.created_at);
		}

		throw new Error(`Unsupported SQL in mock D1: ${this.sql}`);
	}
}

class MockD1Database {
	notes = new Map<string, NoteRow>();
	attachments = new Map<string, AttachmentRow>();
	authRateLimits = new Map<string, { key: string; attempts: number; first_attempt_at: number; locked_until: number; updated_at: number }>();

	prepare(sql: string) {
		return new MockStatement(this, sql);
	}
}

const baseEnv = {
	DB: new MockD1Database(),
	ATTACHMENTS: new MockR2Bucket(),
	ADMIN_USERNAME: 'admin',
	ADMIN_PASSWORD: 'strong-password',
	COOKIE_SECRET: `test-cookie-secret-${crypto.randomUUID()}`,
};

async function fetchJson(input: Request | string, init?: RequestInit) {
	const response = await worker.fetch(new Request(input, init), baseEnv as never);
	return { response, json: await response.json().catch(() => null) };
}

async function fetchResponse(input: Request | string, init?: RequestInit) {
	return worker.fetch(new Request(input, init), baseEnv as never);
}

async function login() {
	const { response } = await fetchJson('http://example.com/api/login', {
		method: 'POST',
		headers: { 'content-type': 'application/json' },
		body: JSON.stringify({ username: 'admin', password: 'strong-password' }),
	});
	expect(response.status).toBe(200);
	return response.headers.get('set-cookie') || '';
}

beforeEach(() => {
	baseEnv.DB = new MockD1Database();
	baseEnv.ATTACHMENTS = new MockR2Bucket();
});

describe('memonote worker', () => {
	it('serves the app shell at /', async () => {
		const response = await fetchResponse('http://example.com/');
		expect(response.status).toBe(200);
		expect(response.headers.get('content-type')).toContain('text/html');
		expect(await response.text()).toContain('MemoNote');
	});

	it('issues and verifies a signed session cookie', async () => {
		const cookie = await login();
		expect(cookie).toContain('session=');
		expect(cookie).toContain('HttpOnly');

		const { response, json } = await fetchJson('http://example.com/api/session', {
			headers: { cookie },
		});
		expect(response.status).toBe(200);
		expect(json).toMatchObject({
			ok: true,
			authenticated: true,
			username: 'admin',
		});
	});

	it('uses secure session cookies only on https requests', async () => {
		const httpResponse = await fetchJson('http://example.com/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username: 'admin', password: 'strong-password' }),
		});
		expect(httpResponse.response.headers.get('set-cookie')).toContain('HttpOnly');
		expect(httpResponse.response.headers.get('set-cookie')).not.toContain(' Secure;');

		const httpsResponse = await fetchJson('https://example.com/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username: 'admin', password: 'strong-password' }),
		});
		expect(httpsResponse.response.headers.get('set-cookie')).toContain('Secure;');

		const httpsLogout = await fetchJson('https://example.com/api/logout', {
			method: 'POST',
			headers: { cookie: await login() },
		});
		expect(httpsLogout.response.headers.get('set-cookie')).toContain('Secure;');
	});

	it('blocks notes APIs before login and after logout', async () => {
		const unauthenticated = await fetchJson('http://example.com/api/notes');
		expect(unauthenticated.response.status).toBe(401);

		const created = await fetchJson('http://example.com/api/notes', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ title: 'nope', content: 'nope' }),
		});
		expect(created.response.status).toBe(401);

		const cookie = await login();
		const logout = await fetchJson('http://example.com/api/logout', {
			method: 'POST',
			headers: { cookie },
		});
		expect(logout.response.status).toBe(200);
		expect(logout.response.headers.get('set-cookie')).toContain('Max-Age=0');

		const afterLogout = await fetchJson('http://example.com/api/notes', {
			headers: { cookie: 'session=' },
		});
		expect(afterLogout.response.status).toBe(401);
	});

	it('reports the attachment storage mode in health checks', async () => {
		const { response, json } = await fetchJson('http://example.com/api/health', {
			headers: { cookie: await login() },
		});
		expect(response.status).toBe(200);
		expect(json).toMatchObject({
			ok: true,
			attachmentStorage: 'r2',
		});
	});

	it('rejects an incorrect password', async () => {
		const { response } = await fetchJson('http://example.com/api/login', {
			method: 'POST',
			headers: { 'content-type': 'application/json' },
			body: JSON.stringify({ username: 'admin', password: 'wrong-password' }),
		});
		expect(response.status).toBe(401);
	});

	it('creates notes with tags and attachments, and deletes attachments with the note', async () => {
		const cookie = await login();
		const created = await fetchJson('http://example.com/api/notes', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				cookie,
			},
			body: JSON.stringify({
				title: '附件笔记',
				content: '正文内容',
				tags: ['工作', '截图'],
			}),
		});
		expect(created.response.status).toBe(201);
		const createdData = created.json as { note: { id: string } };

		const file = new File([new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10])], 'preview.png', {
			type: 'image/png',
		});
		const form = new FormData();
		form.set('file', file);

		const upload = await fetchJson(`http://example.com/api/notes/${createdData.note.id}/attachments`, {
			method: 'POST',
			headers: { cookie },
			body: form,
		});
		expect(upload.response.status).toBe(201);
		const uploadData = upload.json as { attachment: { id: string } };

		const note = await fetchJson(`http://example.com/api/notes/${createdData.note.id}`, {
			headers: { cookie },
		});
		expect(note.response.status).toBe(200);
		expect(note.json).toMatchObject({
			note: {
				tags: ['工作', '截图'],
				attachments: [{ filename: 'preview.png' }],
			},
		});

		const attachment = await fetchJson(`http://example.com/api/attachments/${uploadData.attachment.id}`, {
			headers: { cookie },
		});
		expect(attachment.response.status).toBe(200);
		expect(attachment.response.headers.get('content-type')).toContain('image/png');

		const deleted = await fetchJson(`http://example.com/api/notes/${createdData.note.id}`, {
			method: 'DELETE',
			headers: { cookie },
		});
		expect(deleted.response.status).toBe(200);

		const missingAttachment = await fetchJson(`http://example.com/api/attachments/${uploadData.attachment.id}`, {
			headers: { cookie },
		});
		expect(missingAttachment.response.status).toBe(404);
	});
});
