import { loadBackgrounds, loadFrames, loadTemplate } from "@island/content";
import type { Project, SceneAsset, Template } from "@island/shared";

export interface ArtworkSource {
  template: Template;
  backgrounds: SceneAsset[];
  frames: SceneAsset[];
}

export async function resolveArtworkSource(project: Project): Promise<ArtworkSource> {
  const [template, backgrounds, frames] = await Promise.all([
    loadTemplate(project.templateId), loadBackgrounds(), loadFrames(),
  ]);
  return { template, backgrounds, frames };
}

/** Describe the actual resolved assets, including an older offline fallback. */
export async function artworkRevision(project: Project, source: ArtworkSource): Promise<string> {
  const background = source.backgrounds.find(item => item.id === project.backgroundId);
  const frame = source.frames.find(item => item.id === project.frameId);
  const version = source.template.paintingProfile?.version ?? 1;
  // I32 changes crayon rendering without changing saved paint data or assets.
  const flatCrayon = version >= 3 && Object.values(project.regions).some(paint => paint.paintType === "crayon");
  // I34 changes current smooth contours and the unpainted eye on a painted face.
  const smoothSurface = !!source.template.paintingProfile?.smoothArtwork?.surfaceLight && Object.values(project.regions).some(paint => paint.paintType === "smooth");
  const bytes = new TextEncoder().encode(JSON.stringify([
    `island-thumbnail-renderer-v${version}${flatCrayon ? "-flat-crayon-v1" : ""}${smoothSurface ? "-smooth-surface-v2" : ""}`,
    source.template,
    background && background.id !== "white" ? background.assetUrl : null,
    frame && frame.id !== "none" ? frame.assetUrl : null,
    ...(source.template.paintingProfile ? [background?.compositionUrl ?? null, frame?.compositionUrl ?? null] : []),
  ]));
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(hash)].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
