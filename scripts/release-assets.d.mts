import type { Template } from '../packages/shared-types/src/index';

export interface ApprovalReview { approval?: { kind: string; contentHash: string } }
export function releaseApprovalError(template: Template, review: ApprovalReview, qa: { pass: boolean; contentHash: string }): string | null;
export function verifyReleaseAssets(root?: string): Promise<void>;
