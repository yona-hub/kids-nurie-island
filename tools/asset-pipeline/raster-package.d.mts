import type { Template } from '../../packages/shared-types/src/index';
import type { GapQA } from './gap-reviews.mjs';
export interface RasterQA extends GapQA {
 pass: boolean;
 templateId: string;
 originalSha256: string;
 templateSha256: string;
 errors: string[];
 widthExceptions: {id: string; evidenceSnapshot: string; evidenceSha256: string}[];
}
export interface RasterPackage {template: Template; qa: RasterQA; original: Buffer; originalName: string; normalized: Buffer}
export function readRasterPackage(directory: string): Promise<RasterPackage>;
export function rasterBuildEvidence(root: string, master: {id: string; sourceKind?: string}, template: Template): Promise<(RasterPackage & {errors: string[]}) | null>;
