import type { Template } from '../../packages/shared-types/src/index';
export function revisionUrl(kind: 'templates' | 'backgrounds' | 'frames', id: string, extension: 'json' | 'svg' | 'png', contents: string | Uint8Array): string;
export function publishRevision(publicRoot: string, kind: 'templates' | 'backgrounds' | 'frames', id: string, extension: 'json' | 'svg' | 'png', contents: string | Uint8Array): Promise<string>;
export function assertCompatibleTemplate(previous: Template | null | undefined, next: Template): void;
