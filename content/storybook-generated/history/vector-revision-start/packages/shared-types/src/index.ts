export type ThemeId = 'princess' | 'magic' | 'animals' | 'ocean' | 'dinosaurs' | 'vehicles' | 'construction' | 'robots' | 'space' | 'food' | 'flowers' | 'toys';
export type ColorFamilyId = 'red' | 'pink' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'brown' | 'gray' | 'white' | 'black';
export type PaintType = 'smooth' | 'crayon' | 'pencil';
export type MaterialType = 'standard' | 'skin' | 'hair' | 'fur' | 'fabric' | 'metal' | 'plastic' | 'glass' | 'rubber' | 'wood' | 'stone';
export interface Point { x: number; y: number }
export interface Bounds extends Point { width: number; height: number }
export interface Region {
  id: string;
  name: string;
  path: string;
  bounds: Bounds;
  material: MaterialType;
  confidence: number;
  shade: boolean;
  highlight: boolean;
  texture: number;
  direction: number;
  seed: number;
}
export interface LineDetail { path: string; fill?: string; strokeWidth?: number; eyeRegionId?: string }
export type PaintMode = 'group' | 'region';
export interface PaintGroup { id: string; name: string; regionIds: string[]; bounds: Bounds; direction: number; shading?: { kind: 'hair' | 'fabric'; curves: number[][] } }
export interface EyeGeometry { cx: number; cy: number; width: number; height: number; rotation: number }
export interface EyeFinish { regionId: string; highlightId: string; owner: string; geometry?: EyeGeometry; lashSide?: 'left' | 'right' }
export interface PaintingProfile {
    version: 2;
    eyeStyle?: 'soft-v1' | 'storybook-v2';
  groups: PaintGroup[];
  eyes: EyeFinish[];
  upgradeFrom: string;
  regionMap: Record<string, string>;
    mediumAssets: { paper: string; wax: string; pencil: string; iris?: string };
}
export interface Template {
  schemaVersion: 1;
  id: string;
  themeId: ThemeId;
  title: string;
  width: 1600;
  height: 2000;
  defaultColorFamily: ColorFamilyId;
  approved: boolean;
  regions: Region[];
  details: LineDetail[];
  lineWidth: number;
  paintingProfile?: PaintingProfile;
}
export interface TemplateSummary {
  id: string;
  themeId: ThemeId;
  title: string;
  defaultColorFamily: ColorFamilyId;
  regionCount: number;
  assetUrl: string;
  thumbnailUrl: string;
  coloredThumbnailUrl: string;
}
export interface Theme { id: ThemeId; name: string; color: string; softColor: string; targetCount: number }
export interface SceneAsset { id: string; name: string; assetUrl: string; thumbnailUrl: string; themeId?: ThemeId; compositionUrl?: string; catalogVisible?: boolean; legacyId?: string }
export interface SceneLayer { assetUrl: string; x: number; y: number; width: number; height: number; rotation?: number; opacity?: number }
export interface SceneComposition { schemaVersion: 1; width: 1600; height: 2000; baseColor?: string; borderColor?: string; layers: SceneLayer[] }
export interface RegionPaint { color: string; paintType: PaintType }
export type RegionPaints = Record<string, RegionPaint>;
export interface Project {
  schemaVersion: 1;
  id: string;
  userId: string;
  templateId: string;
  title: string;
  status: 'draft' | 'completed';
  regions: RegionPaints;
  backgroundId: string;
  frameId: string;
  createdAt: string;
  updatedAt: string;
  version: number;
  metadata: Record<string, string | number | boolean>;
}
export interface AppSettings {
  soundEffects: boolean;
  bgm: boolean;
  volume: number;
  reducedMotion: boolean;
  speakColors: boolean;
  tapAssist: boolean;
}
export const DEFAULT_SETTINGS: Readonly<AppSettings> = {
  soundEffects: true,
  bgm: false,
  volume: 0.35,
  reducedMotion: false,
  speakColors: false,
  tapAssist: true,
};
export const MAX_PROJECTS = 500;
export const CANVAS_WIDTH = 1600;
export const CANVAS_HEIGHT = 2000;
export const EXPORT_WIDTH = 2048;
export const EXPORT_HEIGHT = 2560;
export const MATERIAL_NAMES: Record<MaterialType, string> = {
  standard: '標準', skin: '肌', hair: '髪', fur: '毛', fabric: '布', metal: '金属', plastic: 'プラスチック', glass: 'ガラス', rubber: 'ゴム', wood: '木', stone: '石',
};
