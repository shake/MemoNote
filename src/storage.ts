type StorageEnv = Env & {
	ATTACHMENTS?: R2Bucket;
};

export type AttachmentRecord = {
	id: string;
	note_id: string;
	storage_key: string;
	filename: string;
	content_type: string;
	size: number;
	created_at: number;
};

export type NoteRecord = {
	id: string;
	title: string;
	content: string;
	tags: string[];
	created_at: number;
	updated_at: number;
	attachments: AttachmentRecord[];
};

type NoteRow = {
	id: string;
	title: string;
	content: string;
	tags: string | null;
	created_at: number;
	updated_at: number;
};

type AttachmentRow = AttachmentRecord;

type StoredAttachment = {
	body: ArrayBuffer;
	contentType: string;
	contentDisposition: string;
};

const memoryAttachments = (globalThis as typeof globalThis & {
	__memonoteAttachments?: Map<string, StoredAttachment>;
}).__memonoteAttachments || new Map<string, StoredAttachment>();

(globalThis as typeof globalThis & {
	__memonoteAttachments?: Map<string, StoredAttachment>;
}).__memonoteAttachments = memoryAttachments;

function parseTags(value: string | null): string[] {
	if (!value) return [];
	try {
		const parsed = JSON.parse(value);
		if (!Array.isArray(parsed)) return [];
		return parsed
			.map((item) => String(item || '').trim())
			.filter(Boolean)
			.filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
	} catch {
		return [];
	}
}

export function normalizeTags(input: string[] | string | null | undefined) {
	const raw = Array.isArray(input)
		? input
		: String(input || '')
			.split(',')
			.map((item) => item.trim());

	return raw
		.filter(Boolean)
		.filter((item, index, list) => list.findIndex((other) => other.toLowerCase() === item.toLowerCase()) === index);
}

function encodeTags(tags: string[]) {
	return JSON.stringify(normalizeTags(tags));
}

function safeFileName(filename: string) {
	return filename.replace(/[\\/:*?"<>|]/g, '-').trim().replace(/\s+/g, ' ').slice(0, 180) || 'file';
}

export function buildAttachmentKey(noteId: string, attachmentId: string, filename: string) {
	return `notes/${noteId}/${attachmentId}-${safeFileName(filename)}`;
}

export async function readStoredAttachment(env: StorageEnv, storageKey: string) {
	if (env.ATTACHMENTS) {
		return env.ATTACHMENTS.get(storageKey);
	}
	return memoryAttachments.get(storageKey) || null;
}

export async function putStoredAttachment(
	env: StorageEnv,
	storageKey: string,
	body: ArrayBuffer,
	contentType: string,
	contentDisposition: string
) {
	if (env.ATTACHMENTS) {
		await env.ATTACHMENTS.put(storageKey, body, {
			httpMetadata: {
				contentType,
				contentDisposition,
			},
		});
		return;
	}
	memoryAttachments.set(storageKey, { body, contentType, contentDisposition });
}

export async function deleteStoredAttachment(env: StorageEnv, storageKey: string) {
	if (env.ATTACHMENTS) {
		await env.ATTACHMENTS.delete(storageKey);
		return;
	}
	memoryAttachments.delete(storageKey);
}

export function getAttachmentStorageMode(env: StorageEnv) {
	return env.ATTACHMENTS ? 'r2' : 'memory';
}

export async function ensureSchema(env: StorageEnv) {
	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS notes (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			content TEXT NOT NULL,
			tags TEXT NOT NULL DEFAULT '[]',
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`
	).run();

	await env.DB.prepare(
		`CREATE INDEX IF NOT EXISTS idx_notes_updated_at
		 ON notes(updated_at DESC)`
	).run();

	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS attachments (
			id TEXT PRIMARY KEY,
			note_id TEXT NOT NULL,
			storage_key TEXT NOT NULL,
			filename TEXT NOT NULL,
			content_type TEXT NOT NULL,
			size INTEGER NOT NULL,
			created_at INTEGER NOT NULL
		)`
	).run();

	await env.DB.prepare(
		`CREATE INDEX IF NOT EXISTS idx_attachments_note_id
		 ON attachments(note_id, created_at DESC)`
	).run();

	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS auth_rate_limits (
			key TEXT PRIMARY KEY,
			attempts INTEGER NOT NULL,
			first_attempt_at INTEGER NOT NULL,
			locked_until INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)`
	).run();

	await env.DB.prepare(
		`CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_updated_at
		 ON auth_rate_limits(updated_at)`
	).run();

	await env.DB.prepare(
		`CREATE TABLE IF NOT EXISTS app_meta (
			key TEXT PRIMARY KEY,
			value TEXT NOT NULL
		)`
	).run();
}

function mapNotes(rows: NoteRow[], attachments: AttachmentRow[]) {
	const attachmentsByNote = new Map<string, AttachmentRecord[]>();
	for (const attachment of attachments) {
		const list = attachmentsByNote.get(attachment.note_id) || [];
		list.push(attachment);
		attachmentsByNote.set(attachment.note_id, list);
	}

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		content: row.content,
		tags: parseTags(row.tags),
		created_at: row.created_at,
		updated_at: row.updated_at,
		attachments: attachmentsByNote.get(row.id) || [],
	}));
}

export async function listNotes(env: StorageEnv) {
	const notes = await env.DB.prepare(
		`SELECT id, title, content, tags, created_at, updated_at
		 FROM notes
		 ORDER BY updated_at DESC`
	).all<NoteRow>();

	const attachments = await env.DB.prepare(
		`SELECT id, note_id, storage_key, filename, content_type, size, created_at
		 FROM attachments
		 ORDER BY created_at DESC`
	).all<AttachmentRow>();

	return mapNotes(notes.results ?? [], attachments.results ?? []);
}

export async function getNote(env: StorageEnv, id: string) {
	const note = await env.DB.prepare(
		`SELECT id, title, content, tags, created_at, updated_at
		 FROM notes
		 WHERE id = ?
		 LIMIT 1`
	).bind(id).first<NoteRow>();

	if (!note) return null;

	const attachments = await env.DB.prepare(
		`SELECT id, note_id, storage_key, filename, content_type, size, created_at
		 FROM attachments
		 WHERE note_id = ?
		 ORDER BY created_at DESC`
	).bind(id).all<AttachmentRow>();

	return mapNotes([note], attachments.results ?? [])[0] || null;
}

export async function createNote(
	env: StorageEnv,
	note: { id: string; title: string; content: string; tags: string[]; created_at: number; updated_at: number }
) {
	await env.DB.prepare(
		`INSERT INTO notes (id, title, content, tags, created_at, updated_at)
		 VALUES (?, ?, ?, ?, ?, ?)`
	)
		.bind(note.id, note.title, note.content, encodeTags(note.tags), note.created_at, note.updated_at)
		.run();

	return getNote(env, note.id);
}

export async function updateNote(
	env: StorageEnv,
	noteId: string,
	patch: { title: string; content: string; tags: string[]; updated_at: number }
) {
	await env.DB.prepare(
		`UPDATE notes
		 SET title = ?, content = ?, tags = ?, updated_at = ?
		 WHERE id = ?`
	)
		.bind(patch.title, patch.content, encodeTags(patch.tags), patch.updated_at, noteId)
		.run();

	return getNote(env, noteId);
}

export async function deleteNote(env: StorageEnv, noteId: string) {
	await deleteAttachmentsForNote(env, noteId);
	await env.DB.prepare('DELETE FROM notes WHERE id = ?').bind(noteId).run();
}

export async function listAttachmentsForNote(env: StorageEnv, noteId: string) {
	const result = await env.DB.prepare(
		`SELECT id, note_id, storage_key, filename, content_type, size, created_at
		 FROM attachments
		 WHERE note_id = ?
		 ORDER BY created_at DESC`
	).bind(noteId).all<AttachmentRow>();

	return result.results ?? [];
}

export async function getAttachment(env: StorageEnv, attachmentId: string) {
	return env.DB.prepare(
		`SELECT id, note_id, storage_key, filename, content_type, size, created_at
		 FROM attachments
		 WHERE id = ?
		 LIMIT 1`
	).bind(attachmentId).first<AttachmentRow>();
}

export async function createAttachment(
	env: StorageEnv,
	input: {
		id: string;
		note_id: string;
		storage_key: string;
		filename: string;
		content_type: string;
		size: number;
		created_at: number;
	},
	body: ArrayBuffer
) {
	const contentDisposition = input.content_type.startsWith('image/')
		? 'inline'
		: `attachment; filename="${input.filename.replace(/"/g, '%22')}"`;
	await putStoredAttachment(env, input.storage_key, body, input.content_type, contentDisposition);

	await env.DB.prepare(
		`INSERT INTO attachments (id, note_id, storage_key, filename, content_type, size, created_at)
		 VALUES (?, ?, ?, ?, ?, ?, ?)`
	)
		.bind(
			input.id,
			input.note_id,
			input.storage_key,
			input.filename,
			input.content_type,
			input.size,
			input.created_at
		)
		.run();

	return getAttachment(env, input.id);
}

export async function deleteAttachment(env: StorageEnv, attachmentId: string) {
	const attachment = await getAttachment(env, attachmentId);
	if (!attachment) return null;

	await deleteStoredAttachment(env, attachment.storage_key);
	await env.DB.prepare('DELETE FROM attachments WHERE id = ?').bind(attachmentId).run();
	return attachment;
}

export async function deleteAttachmentsForNote(env: StorageEnv, noteId: string) {
	const attachments = await listAttachmentsForNote(env, noteId);
	for (const attachment of attachments) {
		await deleteStoredAttachment(env, attachment.storage_key);
	}
	await env.DB.prepare('DELETE FROM attachments WHERE note_id = ?').bind(noteId).run();
	return attachments;
}
