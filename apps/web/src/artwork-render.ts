import { ColoringEngine, loadSceneImage, loadSceneAsset, loadPaintingMedia } from "@island/engine";
import type { Project } from "@island/shared";
import { resolveArtworkSource, type ArtworkSource } from "./artwork-source";

export async function renderProject(
  project: Project,
  format: "thumbnail" | "png",
  source?: ArtworkSource,
): Promise<Blob> {
  const { template, backgrounds, frames } = source ?? await resolveArtworkSource(project);
  const background = backgrounds.find(
      (item) => item.id === project.backgroundId,
    ),
    frame = frames.find((item) => item.id === project.frameId);
  const [backImage, frameImage, media] = await Promise.all([
    background && background.id !== "white"
      ? template.paintingProfile ? loadSceneAsset(background) : loadSceneImage(background.assetUrl)
      : null,
    frame && frame.id !== "none" ? template.paintingProfile ? loadSceneAsset(frame) : loadSceneImage(frame.assetUrl) : null,
    template.paintingProfile ? loadPaintingMedia(template.paintingProfile) : null,
  ]);
  const canvas = document.createElement("canvas"),
    engine = new ColoringEngine(canvas, { maxCacheBytes: 4 * 1024 * 1024 });
  try {
    engine.loadTemplate(template, project.regions);
    if (media) engine.setMediumImages(media);
    engine.setScene({ background: backImage, frame: frameImage });
    return await (format === "png"
      ? engine.exportPng()
      : engine.exportThumbnail());
  } finally {
    engine.dispose();
    canvas.width = 1;
    canvas.height = 1;
  }
}
