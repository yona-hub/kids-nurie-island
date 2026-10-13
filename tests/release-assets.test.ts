import { describe, expect, it } from 'vitest';
import fs from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { releaseApprovalError } from '../scripts/release-assets.mjs';
import type { Template } from '../packages/shared-types/src/index';

describe('human approval required for release artifacts', () => {
  it('rejects technical-only, changed or stale-QA assets and accepts matching human approval', async () => {
    const template: Template = JSON.parse(await fs.readFile('apps/web/public/content/templates/princess-bunny.json', 'utf8'));
    const contentHash = createHash('sha256').update(JSON.stringify({ ...template, approved: false })).digest('hex');
    const qa = { pass: true, contentHash };
    const review = { approval: { kind: 'human', contentHash } };
    expect(releaseApprovalError(template, { approval: { kind: 'author-technical', contentHash } }, qa)).toBeTruthy();
    expect(releaseApprovalError(template, review, qa)).toBeNull();
    expect(releaseApprovalError({ ...template, approved: false }, review, qa)).toBeTruthy();
    expect(releaseApprovalError({ ...template, title: 'changed' }, review, qa)).toBeTruthy();
    expect(releaseApprovalError(template, review, { ...qa, contentHash: 'outdated' })).toBeTruthy();
    expect(releaseApprovalError(template, review, { ...qa, pass: false })).toBeTruthy();
  });
});
