import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ArtworkCanvas, type ArtworkHandle } from '../../apps/web/src/components/ArtworkCanvas';
import type { Point, Project, Template } from '../../packages/shared-types/src/index';

export { ColoringEngine } from '../../packages/coloring-engine/src/index';

/** Browser-only fixture: mounts the production component with its real renderer. */
export function mountArtwork(element: HTMLElement, template: Template) {
  const ref = createRef<ArtworkHandle>();
  const root = createRoot(element);
  const paints: { regionId: string; point: Point }[] = [];
  const project: Project = {
    schemaVersion: 1, id: 'browser-gesture', userId: 'browser-fixture', templateId: template.id, title: template.title,
    status: 'draft', regions: {}, backgroundId: 'white', frameId: 'none', version: 0, metadata: {},
    createdAt: '2026-10-07T00:00:00Z', updatedAt: '2026-10-07T00:00:00Z',
  };
  return new Promise<{ zoom: (factor: number) => void; reset: () => void; engine: ArtworkHandle['engine']; paints: typeof paints; dispose: () => void }>((resolve, reject) => {
    root.render(<ArtworkCanvas ref={ref} template={template} project={project} backgrounds={[]} frames={[]} interactive
      onPaint={(regionId, point) => {
        paints.push({ regionId, point });
        ref.current?.engine()?.paint(regionId, { color: '#FF6AA3', paintType: 'smooth' }, point, true);
      }}
      onError={(message) => reject(new Error(message))}
      onReady={() => resolve({ zoom: (factor) => ref.current!.zoom(factor), reset: () => ref.current!.reset(), engine: () => ref.current!.engine(), paints, dispose: () => root.unmount() })} />);
  });
}
