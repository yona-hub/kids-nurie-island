export interface GapReview {
 candidateKey: string;
 originalSha256: string;
 point: number[];
 kind: 'new-from-background'|'split-open-detail';
 parentRegionId: string|null;
 parentRegionName: string;
 parentExteriorConnected: boolean;
 classification: 'background'|'intentional-open-detail';
 part: string;
 reason: string;
}
export interface GapCandidate {
 id: string;
 candidateKey: string;
 originalSha256: string;
 maskSha256: string;
 kind: GapReview['kind'];
 parentRegionId: string|null;
 parentRegionName: string;
 parentExteriorConnected: boolean;
 labelPoint: number[];
 bounds: number[];
 area: number;
 usableDiameter: number;
 review: GapReview|null;
}
export interface GapQA {
 originalSha256: string;
 gapReviewSchemaVersion: number;
 gapCandidateDetails: GapCandidate[];
 largeGapCandidates: number;
 unreviewedLargeGapCandidates: number;
 pass: boolean;
}
export interface GapPlan {originalSha256: string; candidates: Record<string,Omit<GapReview,'originalSha256'|'point'>>}
export function gapCandidateKey(candidate: GapCandidate): string;
export function matchesGapReview(candidate: GapCandidate,review: GapReview): boolean;
export function bindGapReviews(qa: GapQA,plan: GapPlan): GapReview[];
export function validateGapEvidence(template:{regions:{id:string;name:string}[]},qa:GapQA,annotation:{originalSha256:string;gapReviews:GapReview[]}):void;
