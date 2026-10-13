import type {
  ColorFamilyId,
  SceneAsset,
  Template,
  TemplateSummary,
  Theme,
} from "@island/shared";
import { CONTENT_DATA_CACHE, MANIFEST_CACHE_HEADER, cachedRevisionUrl, cachedTemplateResponse, isContentManifest, isTemplateAssetUrl } from './asset-cache';

export const THEMES: readonly Theme[] = [
  {
    id: "princess",
    name: "おひめさま",
    color: "#b93275",
    softColor: "#fce8f1",
    targetCount: 45,
  },
  {
    id: "magic",
    name: "まほう",
    color: "#7551b1",
    softColor: "#eee6fa",
    targetCount: 35,
  },
  {
    id: "animals",
    name: "どうぶつ",
    color: "#337953",
    softColor: "#e9f5dd",
    targetCount: 50,
  },
  {
    id: "ocean",
    name: "うみ",
    color: "#176f93",
    softColor: "#def5fc",
    targetCount: 30,
  },
  {
    id: "dinosaurs",
    name: "きょうりゅう",
    color: "#ad581c",
    softColor: "#fff0d9",
    targetCount: 35,
  },
  {
    id: "vehicles",
    name: "のりもの",
    color: "#247592",
    softColor: "#e2f3fa",
    targetCount: 45,
  },
  {
    id: "construction",
    name: "はたらくくるま",
    color: "#a65c17",
    softColor: "#fff1c7",
    targetCount: 35,
  },
  {
    id: "robots",
    name: "ロボット",
    color: "#456e97",
    softColor: "#e9eff9",
    targetCount: 45,
  },
  {
    id: "space",
    name: "うちゅう",
    color: "#5b5094",
    softColor: "#e9e5fa",
    targetCount: 30,
  },
  {
    id: "food",
    name: "たべもの",
    color: "#b4524c",
    softColor: "#ffebe1",
    targetCount: 30,
  },
  {
    id: "flowers",
    name: "おはな",
    color: "#497e4b",
    softColor: "#eaf5e4",
    targetCount: 20,
  },
  {
    id: "toys",
    name: "おもちゃ",
    color: "#8c649d",
    softColor: "#f3e8f5",
    targetCount: 20,
  },
];
export interface ColorFamily {
  id: ColorFamilyId;
  name: string;
  colors: readonly string[];
  labels: readonly string[];
}
const levelNames = [
  "とても うすい",
  "うすい",
  "やさしい",
  "あかるい",
  "はっきりした",
  "あざやかな",
  "ふつうの",
  "すこし こい",
  "こい",
  "とても こい",
  "くらい",
  "とても くらい",
];
const family = (
  id: ColorFamilyId,
  name: string,
  colors: string,
  labels?: string[],
): ColorFamily => ({
  id,
  name,
  colors: colors.split(" "),
  labels: labels ?? levelNames.map((level) => `${level} ${name}`),
});
export const COLOR_FAMILIES: readonly ColorFamily[] = [
  family(
    "red",
    "あか",
    "#FFE8E6 #FFD1CD #FFAAA3 #FF847A #FF6157 #F44336 #FF3B30 #E22C24 #C51F1A #A81615 #861314 #651011",
  ),
  family(
    "pink",
    "ピンク",
    "#FFF0F6 #FFD9E8 #FFB7D2 #FF8FBA #FF6AA3 #F64C91 #FF4FA3 #E83E8C #D12F7B #B82469 #981D58 #751746",
  ),
  family(
    "orange",
    "オレンジ",
    "#FFF0DE #FFD8B2 #FFC17A #FFA94D #FF922E #FF7A00 #FF8A1F #F06D00 #D95B00 #BC4A00 #963A00 #6F2B00",
  ),
  family(
    "yellow",
    "きいろ",
    "#FFFBE6 #FFF4BF #FFE98A #FFDE57 #FFD42A #FFC400 #FFD84A #F4C430 #E6B21A #C99600 #A87C00 #7A5A00",
  ),
  family(
    "green",
    "みどり",
    "#EFFFF2 #D0F5D7 #A7EFB5 #7DE89A #50D977 #25C95B #2FBF61 #1FA34F #178541 #126A35 #0E512A #0A3B20",
  ),
  family(
    "blue",
    "あお",
    "#EAF6FF #CEE9FF #A6D7FF #7AC3FF #4EAEFF #2598FF #2F80ED #236AD1 #1B55B3 #174493 #133672 #102A56",
  ),
  family(
    "purple",
    "むらさき",
    "#F5ECFF #E7D2FF #D2ADFF #B783FF #9D5CF0 #8445D8 #8E44EC #7634D1 #6126B5 #4D1C95 #3A1674 #291053",
  ),
  family(
    "brown",
    "ちゃいろ",
    "#FFF2E6 #F2D7BD #E3BA91 #D09B6D #BA7A4B #A66134 #8C5A35 #754726 #5F371C #4A2B17 #392015 #291711",
  ),
  family(
    "gray",
    "はいいろ",
    "#F4F5F7 #E5E7EB #D1D5DB #B9BEC6 #9CA3AF #858C98 #6B7280 #59616D #4B5563 #3F4752 #323842 #252A31",
  ),
  family(
    "white",
    "しろ",
    "#FFFFFF #FFFDF8 #FFF9EE #FFF6F2 #FFF4F7 #F8F6FF #F3F9FF #F2FCFF #F3FFF7 #F7F7F7 #EFEFEF #E6E6E6",
    [
      "まっしろ",
      "あたたかい しろ",
      "クリームの しろ",
      "ももいろの しろ",
      "ピンクの しろ",
      "むらさきの しろ",
      "あおの しろ",
      "みずいろの しろ",
      "みどりの しろ",
      "やわらかい しろ",
      "すこし かげの しろ",
      "かげの しろ",
    ],
  ),
  family(
    "black",
    "くろ",
    "#4A474D #403D43 #36343A #2E2C31 #27252A #211F24 #1C1A1F #17161A #121114 #0D0C0E #070708 #000000",
  ),
];

async function contentJson<T>(url: string, onCachedFallback?: () => void): Promise<T> {
  let cache: Cache | undefined;
  try {
    if ("caches" in globalThis)
      cache = await caches.open(CONTENT_DATA_CACHE);
  } catch {
    /* Private browsing may disable Cache Storage; IndexedDB remains authoritative for work. */
  }
  try {
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok)
      throw new Error(
        "ぬりえを読みこめませんでした。もういちどおためしください。",
      );
    const result: unknown = await response.clone().json();
    if (response.headers.get(MANIFEST_CACHE_HEADER) === 'fallback') onCachedFallback?.();
    if (cache) {
      await cache.delete(url).catch(() => undefined);
      await cache.put(url, response).catch(() => undefined);
      const entries = await cache.keys();
      // Keep the three small indexes available when older drawing entries expire.
      const drawings = entries.filter(entry => !isContentManifest(new URL(entry.url).pathname));
      for (const old of drawings.slice(0, Math.max(0, entries.length - 40)))
        await cache.delete(old);
    }
    return result as T;
  } catch (error) {
    const saved = await cache?.match(url).catch(() => undefined);
    if (saved) { onCachedFallback?.(); return saved.json() as Promise<T>; }
    throw error;
  }
}
let catalogPromise: Promise<TemplateSummary[]> | undefined;
export function loadCatalog(): Promise<TemplateSummary[]> {
  // Coalesce concurrent reads, then revalidate the next user-initiated opening.
  // Retaining a resolved promise forever would hide newly published revisions.
  return (catalogPromise ??= contentJson<TemplateSummary[]>("/content/catalog.json")
    .finally(() => { catalogPromise = undefined; }));
}
function assertTemplate(template: Template, id: string): Template {
  if (!template || template.id !== id || !template.approved || template.schemaVersion !== 1 || template.width !== 1600 || template.height !== 2000 || !Array.isArray(template.regions) || template.regions.length === 0)
    throw new Error("このぬりえは、まだ使えません。");
  return template;
}
export async function loadTemplate(id: string): Promise<Template> {
  if (!/^[a-z0-9-]{1,80}$/.test(id))
    throw new Error("このぬりえは開けません。");
  let catalog: TemplateSummary[];
  try { catalog = await loadCatalog(); } catch { catalog = []; }
  const entry = catalog.find(template => template.id === id);
  const url = entry?.assetUrl ?? `/content/templates/${id}.json`;
  if (!isTemplateAssetUrl(url, id)) throw new Error("このぬりえは開けません。");
  try { return assertTemplate(await contentJson<Template>(url), id); }
  catch (error) {
    // A newer catalog can be cached before its drawing is first opened. Keep an
    // already-opened, compatible revision usable offline instead of losing work.
    const previousUrl = await cachedRevisionUrl('templates', id);
    const previous = previousUrl ? await cachedTemplateResponse(previousUrl) : undefined;
    if (previous) return assertTemplate(await previous.json() as Template, id);
    throw error;
  }
}
async function loadScenes(kind: 'backgrounds' | 'frames'): Promise<SceneAsset[]> {
  let fallback = typeof navigator !== 'undefined' && navigator.onLine === false;
  const scenes = await contentJson<SceneAsset[]>(`/content/${kind}.json`, () => { fallback = true; });
  if (!fallback) return scenes;
  return Promise.all(scenes.map(async scene => {
    const available = await cachedRevisionUrl(kind, scene.id, scene.assetUrl);
    return available ? { ...scene, assetUrl: available, thumbnailUrl: available } : scene;
  }));
}
export const loadBackgrounds = () => loadScenes('backgrounds');
export const loadFrames = () => loadScenes('frames');

export async function loadImprovedTemplate(id: string): Promise<Template | null> {
  const index = await contentJson<Record<string, string>>("/content/upgrade-index.json");
  const target = Object.hasOwn(index, id) ? index[id] : undefined;
  const template = target ? await loadTemplate(target) : null;
  if (template && template.paintingProfile?.upgradeFrom !== id && !Object.hasOwn(template.paintingProfile?.upgradeSources??{},id)) throw new Error("改善版の対応を確認できませんでした。");
  return template;
}
