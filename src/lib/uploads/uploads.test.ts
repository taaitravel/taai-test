import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  AVATAR_MAX_BYTES,
  AVATAR_MAX_COUNT,
  CHAT_MAX_BYTES,
  CHAT_MAX_COUNT,
  DOCUMENT_MAX_BYTES,
  DOCUMENT_MAX_COUNT,
  documentUploadBlock,
} from '../../../supabase/functions/_shared/upload-limits';
import { isHeicFile } from './heic';
import { UPLOAD_LIMITS, acceptFor, validateUpload } from './limits';
import {
  describeHeicFailure,
  describeStorageFailure,
  describeUploadViolation,
} from './notices';
import {
  CHAT_ATTACHMENT_URL_TTL_SECONDS,
  chatAttachmentPath,
  extensionForMime,
  pathFromStoredUrl,
} from './paths';
import { prepareAndValidate } from './prepare';

const read = (path: string) => readFileSync(path, 'utf8');
const migration = read('supabase/migrations/20261026235158_upload_quotas_and_storage_access.sql');

const file = (name: string, type: string, size = 100) => new File([new Uint8Array(size)], name, { type });

describe('upload limits', () => {
  it('keeps avatar, chat, and document ceilings in one place', () => {
    expect(UPLOAD_LIMITS.avatar.maxBytes).toBe(AVATAR_MAX_BYTES);
    expect(UPLOAD_LIMITS.avatar.maxCount).toBe(AVATAR_MAX_COUNT);
    expect(UPLOAD_LIMITS.chat.maxBytes).toBe(CHAT_MAX_BYTES);
    expect(UPLOAD_LIMITS.chat.maxCount).toBe(CHAT_MAX_COUNT);
    expect(UPLOAD_LIMITS.document.maxBytes).toBe(DOCUMENT_MAX_BYTES);
    expect(UPLOAD_LIMITS.document.maxCount).toBe(DOCUMENT_MAX_COUNT);
    expect(AVATAR_MAX_BYTES).toBe(2 * 1024 * 1024);
    expect(CHAT_MAX_BYTES).toBe(5 * 1024 * 1024);
    expect(CHAT_MAX_COUNT).toBe(20);
    expect(DOCUMENT_MAX_BYTES).toBe(10 * 1024 * 1024);
    expect(DOCUMENT_MAX_COUNT).toBe(10);
    expect(documentUploadBlock(DOCUMENT_MAX_BYTES + 1, 0)).toBe('DOCUMENT_TOO_LARGE');
    expect(documentUploadBlock(100, DOCUMENT_MAX_COUNT)).toBe('DOCUMENT_LIMIT');
    expect(documentUploadBlock(100, DOCUMENT_MAX_COUNT - 1)).toBeNull();
  });

  it('rejects the wrong type, an oversized file, and a full folder', () => {
    expect(validateUpload('chat', { size: 10, type: 'application/pdf' })).toBeNull();
    expect(validateUpload('chat', { size: 10, type: 'image/heic' })).toBeNull();
    expect(validateUpload('avatar', { size: 10, type: 'application/pdf' })).toBe('type');
    expect(validateUpload('document', { size: 10, type: 'image/gif' })).toBe('type');
    expect(validateUpload('chat', { size: CHAT_MAX_BYTES + 1, type: 'image/jpeg' })).toBe('size');
    expect(validateUpload('avatar', { size: AVATAR_MAX_BYTES + 1, type: 'image/png' })).toBe('size');
    expect(validateUpload('document', { size: DOCUMENT_MAX_BYTES + 1, type: 'application/pdf' })).toBe('size');
    expect(validateUpload('chat', { size: 10, type: 'image/jpeg' }, CHAT_MAX_COUNT)).toBe('count');
    expect(validateUpload('document', { size: 10, type: 'image/jpeg' }, DOCUMENT_MAX_COUNT)).toBe('count');
    expect(validateUpload('avatar', { size: 10, type: 'image/jpeg' }, 0)).toBeNull();
  });

  it('makes the chat picker accept the same types validation allows, including PDF and HEIC', () => {
    const accept = acceptFor('chat');
    for (const mime of UPLOAD_LIMITS.chat.mimeTypes) {
      expect(accept.split(',')).toContain(mime);
    }
    expect(accept).toContain('application/pdf');
    expect(accept).toContain('.pdf');
    expect(accept).toContain('image/heic');
    expect(accept).toContain('.heic');
    expect(accept).not.toBe('image/*');
    expect(acceptFor('avatar')).toContain('image/heic');
    expect(acceptFor('avatar').split(',')).toEqual(expect.arrayContaining([...UPLOAD_LIMITS.avatar.mimeTypes]));
    expect(acceptFor('document').split(',')).toEqual(expect.arrayContaining([...UPLOAD_LIMITS.document.mimeTypes]));
  });
});

describe('HEIC photos', () => {
  it('recognizes iPhone HEIC and HEIF files, including an empty MIME type', () => {
    expect(isHeicFile({ name: 'IMG_2201.HEIC', type: '' })).toBe(true);
    expect(isHeicFile({ name: 'photo.heif', type: 'application/octet-stream' })).toBe(true);
    expect(isHeicFile({ name: 'photo.jpg', type: 'image/heic' })).toBe(true);
    expect(isHeicFile({ name: 'photo.jpg', type: 'image/jpeg' })).toBe(false);
  });

  it('converts a HEIC photo to JPEG before the chat and avatar checks', async () => {
    const decode = async () => new Blob([new Uint8Array([1, 2, 3])], { type: 'image/jpeg' });
    const chat = await prepareAndValidate('chat', file('IMG_1.HEIC', 'image/heic', 50), 0, decode);
    const avatar = await prepareAndValidate('avatar', file('IMG_1.HEIC', '', 50), 0, decode);
    expect(chat.ok).toBe(true);
    expect(avatar.ok).toBe(true);
    if (chat.ok && avatar.ok) {
      expect(chat.file.type).toBe('image/jpeg');
      expect(chat.file.name.endsWith('.jpg')).toBe(true);
      expect(avatar.file.type).toBe('image/jpeg');
    }
  });

  it('keeps an unconverted HEIC for chat and explains the failure for a profile photo', async () => {
    const decode = async () => {
      throw new Error('decoder unavailable');
    };
    const chat = await prepareAndValidate('chat', file('IMG_1.HEIC', '', 50), 0, decode);
    const avatar = await prepareAndValidate('avatar', file('IMG_1.HEIC', 'image/heic', 50), 0, decode);
    expect(chat.ok).toBe(true);
    if (chat.ok) expect(chat.file.type).toBe('image/heic');
    expect(avatar).toEqual({ ok: false, ...describeHeicFailure() });
  });
});

describe('upload errors', () => {
  it('explains the problem and what to do next', () => {
    for (const kind of ['avatar', 'chat', 'document'] as const) {
      for (const violation of ['type', 'size', 'count'] as const) {
        const notice = describeUploadViolation(kind, violation);
        expect(notice.title.length).toBeGreaterThan(3);
        expect(notice.title.toLowerCase()).not.toBe('error');
        expect(notice.message.endsWith('.')).toBe(true);
        expect(notice.message).toMatch(/choose|remove|try again/i);
        expect(notice.message).not.toMatch(/P0001|row-level security|undefined/);
      }
    }
  });

  it('turns a storage failure into a notice instead of swallowing it', () => {
    expect(describeStorageFailure('chat', { message: 'CHAT_ATTACHMENT_LIMIT' }).title).toBe('This Chat Is Full');
    expect(describeStorageFailure('document', { message: 'DOCUMENT_LIMIT' }).message).toMatch(/10 documents/);
    expect(describeStorageFailure('avatar', new Error('Payload too large')).title).toBe('File Is Too Large');
    const blank = describeStorageFailure('chat', null);
    expect(blank.title.length).toBeGreaterThan(0);
    expect(blank.message).toMatch(/try again/i);
  });
});

describe('chat attachment paths', () => {
  it('signs for a short time and reads the path out of a stored URL without keeping the token', () => {
    expect(CHAT_ATTACHMENT_URL_TTL_SECONDS).toBe(10 * 60);
    expect(CHAT_ATTACHMENT_URL_TTL_SECONDS).toBeLessThan(60 * 60);
    const legacy = 'https://example.supabase.co/storage/v1/object/sign/chat-attachments/42/1710000000.jpg?token=year-long-secret';
    expect(pathFromStoredUrl(legacy)).toBe('42/1710000000.jpg');
    expect(chatAttachmentPath({ url: legacy })).toBe('42/1710000000.jpg');
    expect(chatAttachmentPath({ path: '42/photo.jpg', url: legacy })).toBe('42/photo.jpg');
    expect(pathFromStoredUrl('https://example.com/other/file.jpg')).toBeNull();
    expect(chatAttachmentPath({ path: '../secrets.pdf' })).toBeNull();
    expect(extensionForMime('application/pdf')).toBe('pdf');
    expect(extensionForMime('image/heic')).toBe('heic');
    expect(extensionForMime('text/html')).toBeNull();
  });
});

describe('upload contract', () => {
  it('enforces folder quotas with a lock and does not grant anonymous writes', () => {
    expect(migration).toContain('pg_advisory_xact_lock');
    expect(migration).toContain("when 'chat-attachments' then 20");
    expect(migration).toContain("when 'avatars' then 1");
    expect(migration).toContain("when 'receipts' then 10");
    expect(migration).toContain('CHAT_ATTACHMENT_LIMIT');
    expect(migration).toContain('DOCUMENT_LIMIT');
    expect(migration).toContain('file_size_limit = 2097152');
    expect(migration).toContain('file_size_limit = 5242880');
    expect(migration).toContain('file_size_limit = 10485760');
    expect(migration).toContain("'image/heic'");
    expect(migration).toContain('is_itinerary_attendee');
    expect(migration).toContain('reserve_storage_upload');
    expect(migration).toContain('private.claim_storage_folder_slot');
    expect(migration).toContain('v_folder');
    expect(migration).toContain('r.folder = v_folder');
    expect(migration).toContain('#variable_conflict error');
    expect(migration).not.toMatch(/\bfolder\s*=\s*folder\b/);
    expect(migration.toLowerCase()).not.toContain('to public');
    expect(migration.toLowerCase()).not.toContain('to anon');
    expect(migration.toLowerCase()).not.toMatch(/create\s+trigger[\s\S]*storage\.objects/);
    expect(migration.toLowerCase()).not.toMatch(/drop\s+trigger[\s\S]*storage\.objects/);
    expect(migration.toLowerCase()).not.toMatch(/create\s+(unique\s+)?index[^;]*on\s+storage\.objects/);
    expect(migration.toLowerCase()).not.toMatch(/alter\s+table\s+storage\.objects/);
    const policies = migration.match(/create policy[\s\S]*?;/g) ?? [];
    expect(policies.length).toBeGreaterThan(0);
    for (const policy of policies) {
      expect(policy.toLowerCase()).toMatch(/to authenticated|to service_role/);
    }
  });

  it('stops the client from minting year-long URLs or counting with list()', () => {
    const hook = read('src/hooks/useItineraryChat.ts');
    const message = read('src/components/itinerary/chat/ChatMessage.tsx');
    const attachment = read('src/components/itinerary/chat/ChatAttachment.tsx');
    const picker = read('src/components/itinerary/chat/ChatAttachmentPicker.tsx');
    const avatar = read('src/components/profile/AvatarUpload.tsx');
    const receipt = read('supabase/functions/generate-booking-receipt/index.ts');

    const uploadBlock = hook.slice(hook.indexOf('const uploadAttachment'));
    expect(hook).not.toContain('60 * 60 * 24 * 365');
    expect(uploadBlock).not.toContain('.list(');
    expect(uploadBlock).not.toContain('createSignedUrl');
    expect(hook).toContain('prepareAndValidate');
    expect(hook).toContain('reserve_storage_upload');
    expect(avatar).toContain('reserve_storage_upload');
    expect(receipt).toContain('reserve_storage_upload');
    expect(receipt).not.toContain('.list(');
    expect(hook).toContain('contentType: prepared.file.type');
    const modal = read('src/components/itinerary/chat/ItineraryChatModal.tsx');
    expect(modal).toContain('path: uploaded.path');
    expect(modal).toContain('UploadErrorAlert');
    expect(modal).not.toContain('Failed to upload');
    expect(message).not.toContain('attachment_data.url');
    expect(message).toContain('<ChatAttachment');
    expect(attachment).toContain('getChatAttachmentUrl');
    expect(attachment).not.toContain('attachment_data.url');
    expect(picker).toContain("acceptFor('chat')");
    expect(picker).not.toContain('image/*');
    expect(picker).toContain('prepareAndValidate');
    expect(avatar).toContain("prepareAndValidate('avatar'");
    expect(avatar).toContain('UploadErrorAlert');
    expect(receipt).toContain('documentUploadBlock');
    expect(receipt).toContain('DOCUMENT_LIMIT');
  });
});
