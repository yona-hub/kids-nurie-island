import { DEFAULT_SETTINGS, MAX_PROJECTS, type AppSettings, type Project } from '../../shared-types/src/index';
import { PersistenceError, type BackupDocument } from './types';

export const MAX_BACKUP_BYTES = 128 * 1024 * 1024;
const MAX_PROJECT_BYTES = 262144;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const identifier = /^[a-z0-9][a-z0-9_-]{0,79}$/i;
function invalid(): never { throw new PersistenceError('VALIDATION', '作品のデータを読み取れませんでした。対応したバックアップを選んでください。'); }
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) invalid();
  return value as Record<string, unknown>;
}
function string(value: unknown, max = 120): string {
  if (typeof value !== 'string' || value.length > max) invalid();
  return value;
}
function id(value: unknown): string { const result = string(value, 80); if (!identifier.test(result)) invalid(); return result; }
function date(value: unknown): string {
  const result = string(value, 40);
  if (!/^\d{4}-\d\d-\d\dT/.test(result) || !Number.isFinite(Date.parse(result))) invalid();
  return new Date(result).toISOString();
}
export function validateProject(value: unknown): Project {
  const v = object(value);
  if (v.schemaVersion !== 1 || !uuid.test(string(v.id, 36)) || !uuid.test(string(v.userId, 36))) invalid();
  if (v.status !== 'draft' && v.status !== 'completed') invalid();
  if (!Number.isSafeInteger(v.version) || Number(v.version) < 0) invalid();
  const entries = Object.entries(object(v.regions));
  if (entries.length > 2048) invalid();
  const regions: Project['regions'] = {};
  for (const [key, value] of entries) {
    if (!identifier.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) invalid();
    const paint = object(value);
    if (!/^#[0-9A-Fa-f]{6}$/.test(string(paint.color, 7)) || !['smooth', 'crayon', 'pencil'].includes(String(paint.paintType))) invalid();
    regions[key] = { color: paint.color as string, paintType: paint.paintType as 'smooth' | 'crayon' | 'pencil' };
  }
  const metadata: Project['metadata'] = {};
  const metadataEntries = Object.entries(object(v.metadata));
  if (metadataEntries.length > 64) invalid();
  for (const [key, value] of metadataEntries) {
    if (!identifier.test(key) || ['__proto__', 'constructor', 'prototype'].includes(key)) invalid();
    if (!(typeof value === 'boolean' || (typeof value === 'number' && Number.isFinite(value)) || (typeof value === 'string' && value.length <= 256))) invalid();
    metadata[key] = value;
  }
  const result: Project = {
    schemaVersion: 1, id: v.id as string, userId: v.userId as string,
    templateId: id(v.templateId), title: string(v.title), status: v.status,
    regions, backgroundId: id(v.backgroundId), frameId: id(v.frameId),
    createdAt: date(v.createdAt), updatedAt: date(v.updatedAt), version: v.version as number, metadata,
  };
  if (new TextEncoder().encode(JSON.stringify(result)).byteLength > MAX_PROJECT_BYTES) invalid();
  return result;
}
export function validateSettings(value: unknown): AppSettings {
  const v = object(value);
  const result = { ...DEFAULT_SETTINGS };
  for (const key of ['soundEffects', 'bgm', 'reducedMotion', 'speakColors', 'tapAssist'] as const) {
    if (typeof v[key] !== 'boolean') invalid();
    result[key] = v[key];
  }
  if (typeof v.volume !== 'number' || !Number.isFinite(v.volume) || v.volume < 0 || v.volume > 1) invalid();
  result.volume = v.volume;
  return result;
}
export function validateBackup(value: unknown): BackupDocument {
  const v = object(value);
  if (v.format !== 'kids-nurie-island' || v.schemaVersion !== 1 || !Array.isArray(v.projects) || v.projects.length > MAX_PROJECTS) invalid();
  return { format: 'kids-nurie-island', schemaVersion: 1, exportedAt: date(v.exportedAt), projects: v.projects.map(validateProject), settings: validateSettings(v.settings) };
}
