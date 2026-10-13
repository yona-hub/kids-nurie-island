import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import {
  ColoringEngine,
  constrainViewport,
  loadSceneImage,
  loadSceneAsset,
  loadPaintingMedia,
  pinchViewport,
  revealViewportRegion,
  screenToLogical,
  TapTracker,
  wheelDeltaPixels,
  zoomViewportAt,
  type Viewport,
  type MediumImages,
} from "@island/engine";
import type { PaintMode, Point, Project, SceneAsset, Template } from "@island/shared";
import { errorMessage } from "./UI";

export interface ArtworkHandle {
  engine: () => ColoringEngine | null;
  reset: () => void;
  zoom: (factor: number) => void;
}
interface Props {
  template: Template;
  project: Project;
  backgrounds: SceneAsset[];
  frames: SceneAsset[];
  interactive?: boolean;
  tapAssist?: boolean;
  paintMode?: PaintMode;
  onPaint?: (regionId: string, point: Point) => void;
  onReady?: () => void;
  onLoading?: () => void;
  onError: (message: string) => void;
}
export const ArtworkCanvas = forwardRef<ArtworkHandle, Props>(
  function ArtworkCanvas(
    {
      template,
      project,
      backgrounds,
      frames,
      interactive = false,
      tapAssist = true,
      paintMode = "group",
      onPaint,
      onReady,
      onLoading,
      onError,
    },
    ref,
  ) {
    const canvas = useRef<HTMLCanvasElement>(null),
      stage = useRef<HTMLDivElement>(null);
    const engine = useRef<ColoringEngine | null>(null);
    const mediumImages = useRef<{ template: Template; images: Promise<MediumImages> } | null>(null);
    const current = useRef({ project, onPaint, onReady, onLoading, onError, interactive });
    current.current = { project, onPaint, onReady, onLoading, onError, interactive };
    const viewport = useRef<Viewport>({ scale: 1, x: 0, y: 0 });
    const [view, setView] = useState(viewport.current),
      [ready, setReady] = useState(false),
      [keyboardIndex, setKeyboardIndex] = useState(0),
      [keyboardFocus, setKeyboardFocus] = useState(false),
      [keyboardPoint, setKeyboardPoint] = useState<Point | null>(null);
    const [loadError,setLoadError] = useState(''), [loadAttempt,setLoadAttempt] = useState(0);
    const keyboardSelection = useRef(0);
    useEffect(() => {
      if (keyboardFocus && interactive && keyboardPoint)
        stage.current?.querySelector('.region-focus-marker')?.scrollIntoView?.({block:'nearest',inline:'nearest',behavior:'instant'});
    }, [keyboardFocus,interactive,keyboardPoint,view]);
    const automaticIds = new Set(template.paintingProfile?.eyes.map(eye => eye.highlightId));
    const selectable = template.paintingProfile && paintMode === "group"
      ? template.paintingProfile.groups.map(group => ({ ...template.regions.find(region => region.id === group.regionIds[0])!, name: group.name, path: group.regionIds.map(id => template.regions.find(region => region.id === id)!.path).join(" ") }))
      : template.regions.filter(region => !automaticIds.has(region.id));
    const selected = selectable[Math.min(keyboardIndex, selectable.length - 1)];
    const pointers = useRef(new Map<number, Point>()),
      tap = useRef(new TapTracker(8));
    const getSize = useCallback(
      () => ({
        width: stage.current?.clientWidth || 1,
        height: stage.current?.clientHeight || 1,
      }),
      [],
    );
    const applyView = useCallback((next: Viewport) => {
      viewport.current = next;
      engine.current?.setViewport(next);
      setView(next);
    }, []);
    const zoom = useCallback(
      (factor: number) => {
        const size = getSize();
        applyView(
          zoomViewportAt(
            viewport.current,
            viewport.current.scale * factor,
            { x: size.width / 2, y: size.height / 2 },
            size,
          ),
        );
      },
      [applyView, getSize],
    );
    useImperativeHandle(
      ref,
      () => ({
        engine: () => engine.current,
        reset: () => applyView({ scale: 1, x: 0, y: 0 }),
        zoom,
      }),
      [applyView, zoom],
    );
    useEffect(() => {
      if (!canvas.current || !stage.current) return;
      const instance = new ColoringEngine(canvas.current);
      engine.current = instance;
      instance.loadTemplate(template, current.current.project.regions);
      mediumImages.current = null;
      keyboardSelection.current = 0;
      setKeyboardIndex(0);
      setKeyboardPoint(null);
      const resize = () => {
        if (stage.current) {
          const size = getSize();
          instance.resize(size.width, size.height);
          applyView(constrainViewport(viewport.current, size));
        }
      };
      const observer = new ResizeObserver(resize);
      observer.observe(stage.current);
      // Moving a window between screens changes DPR without changing CSS size.
      let density:MediaQueryList;
      let densityRatio=window.devicePixelRatio;
      const densityChanged=()=>{density?.removeEventListener('change',densityChanged);densityRatio=window.devicePixelRatio;density=matchMedia(`(resolution: ${densityRatio}dppx)`);density.addEventListener('change',densityChanged);resize();};
      // Some display/emulation changes update DPR without a resize or media
      // event. Four cheap comparisons per second keep a stable CSS viewport
      // sharp; expensive drawing occurs only when the ratio actually changes.
      const checkDensity=()=>{if(window.devicePixelRatio!==densityRatio)densityChanged();};
      const densityPoll=window.setInterval(checkDensity,250);
      window.addEventListener('resize',checkDensity);
      document.addEventListener('visibilitychange',checkDensity);
      densityChanged();
      resize();
      return () => {
        observer.disconnect();
        density.removeEventListener('change',densityChanged);
        window.clearInterval(densityPoll);
        window.removeEventListener('resize',checkDensity);
        document.removeEventListener('visibilitychange',checkDensity);
        instance.dispose();
        if (engine.current === instance) engine.current = null;
      };
    }, [template, applyView, getSize]);
    useEffect(() => {
      engine.current?.setScene({ regions: project.regions });
    }, [project.regions, template]);
    useEffect(() => {
      const abort = new AbortController();
      const bg = backgrounds.find((item) => item.id === project.backgroundId);
      const frame = frames.find((item) => item.id === project.frameId);
      const instance = engine.current;
      if (template.paintingProfile && mediumImages.current?.template !== template) mediumImages.current = { template, images: loadPaintingMedia(template.paintingProfile) };
      setReady(false);
      setLoadError('');
      current.current.onLoading?.();
      void Promise.all([
        bg && project.backgroundId !== "white"
          ? template.paintingProfile ? loadSceneAsset(bg, abort.signal) : loadSceneImage(bg.assetUrl, abort.signal)
          : null,
        frame && project.frameId !== "none"
          ? template.paintingProfile ? loadSceneAsset(frame, abort.signal) : loadSceneImage(frame.assetUrl, abort.signal)
          : null,
        template.paintingProfile ? mediumImages.current?.images : null,
      ])
        .then(([background, border, media]) => {
          if (!abort.signal.aborted && engine.current === instance) {
            if (media) instance?.setMediumImages(media);
            instance?.setScene({ background, frame: border });
            setReady(true);
            current.current.onReady?.();
          }
        })
        .catch((error) => {
          if (!abort.signal.aborted) {
            mediumImages.current = null;
            setLoadError(errorMessage(error));
            current.current.onError(errorMessage(error));
          }
        });
      return () => abort.abort();
    }, [project.backgroundId, project.frameId, backgrounds, frames, template,loadAttempt]);
    useEffect(() => {
      const el = stage.current;
      if (!el || !interactive) return;
      const wheel = (event: WheelEvent) => {
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        // Read the unit first: Firefox's compatibility conversion can depend
        // on whether deltaMode was inspected before the delta values.
        const mode = event.deltaMode;
        const deltaY = event.deltaY;
        const size = getSize();
        let lineHeight = 1;
        if (mode === WheelEvent.DOM_DELTA_LINE) {
          const style = getComputedStyle(el);
          const computedHeight = parseFloat(style.lineHeight);
          const fontSize = parseFloat(style.fontSize);
          // `normal` has no resolved numeric line height. Use the current
          // font size with a documented 1.2em fallback, not a fixed wheel unit.
          lineHeight = Number.isFinite(computedHeight) && computedHeight > 0
            ? computedHeight
            : (Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 16) * 1.2;
        }
        const pixels = wheelDeltaPixels(deltaY, mode, lineHeight, size.height);
        if (pixels === 0) return;
        event.preventDefault();
        tap.current.cancel();
        const rect = el.getBoundingClientRect();
        applyView(
          zoomViewportAt(
            viewport.current,
            viewport.current.scale * Math.exp(-pixels * 0.0015),
            { x: event.clientX - rect.left, y: event.clientY - rect.top },
            size,
          ),
        );
      };
      el.addEventListener("wheel", wheel, { passive: false });
      return () => el.removeEventListener("wheel", wheel);
    }, [interactive, getSize, applyView]);
    const localPoint = (event: PointerEvent) => {
      const rect = stage.current!.getBoundingClientRect();
      return { x: event.clientX - rect.left, y: event.clientY - rect.top };
    };
    const down = (event: PointerEvent) => {
      if (
        !interactive ||
        !ready ||
        (event.pointerType === "mouse" && event.button !== 0)
      )
        return;
      event.preventDefault();
      setKeyboardFocus(false);
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = localPoint(event);
      if (pointers.current.size === 0) tap.current.begin(point);
      pointers.current.set(event.pointerId, point);
      if (pointers.current.size > 1) tap.current.markMultiplePointers();
    };
    const move = (event: PointerEvent) => {
      const previous = pointers.current.get(event.pointerId);
      if (!previous) return;
      const point = localPoint(event),
        before = [...pointers.current.values()];
      pointers.current.set(event.pointerId, point);
      tap.current.move(point);
      if (pointers.current.size >= 2) {
        const after = [...pointers.current.values()];
        const oldDistance = Math.hypot(
          before[0].x - before[1].x,
          before[0].y - before[1].y,
        );
        const newDistance = Math.hypot(
          after[0].x - after[1].x,
          after[0].y - after[1].y,
        );
        const oldCenter = {
            x: (before[0].x + before[1].x) / 2,
            y: (before[0].y + before[1].y) / 2,
          },
          newCenter = {
            x: (after[0].x + after[1].x) / 2,
            y: (after[0].y + after[1].y) / 2,
          };
        if (oldDistance > 0) {
          applyView(
            pinchViewport(
              viewport.current,
              (viewport.current.scale * newDistance) / oldDistance,
              oldCenter,
              newCenter,
              getSize(),
            ),
          );
        }
      } else
        applyView(
          constrainViewport(
            {
              ...viewport.current,
              x: viewport.current.x + point.x - previous.x,
              y: viewport.current.y + point.y - previous.y,
            },
            getSize(),
          ),
        );
    };
    const up = (event: PointerEvent) => {
      if (!pointers.current.has(event.pointerId)) return;
      const point = localPoint(event),
        only = pointers.current.size === 1;
      pointers.current.delete(event.pointerId);
      if (only && tap.current.end(point)) {
        const logical = screenToLogical(point, viewport.current, getSize());
        const id = engine.current?.hitTest(logical, tapAssist);
        if (id && current.current.interactive)
          current.current.onPaint?.(id, logical);
      }
      if (event.currentTarget.hasPointerCapture(event.pointerId))
        event.currentTarget.releasePointerCapture(event.pointerId);
    };
    const cancel = (event: PointerEvent) => {
      pointers.current.delete(event.pointerId);
      tap.current.cancel();
    };
    const showRegion = (index: number) => {
      const safeIndex = Math.min(index, selectable.length - 1);
      const region = selectable[safeIndex];
      if (!region) return;
      const point = engine.current?.getRegionPoint(region.id) ?? null;
      keyboardSelection.current = safeIndex;
      setKeyboardIndex(safeIndex);
      setKeyboardFocus(true);
      setKeyboardPoint(point);
      if (point)
        applyView(revealViewportRegion(viewport.current, region.bounds, point, getSize()));
    };
    const key = (event: KeyboardEvent) => {
      // Preserve browser zoom, navigation and assistive-technology shortcuts.
      // Shift remains available because many keyboards use it to type '+'.
      if (!interactive || !ready || event.ctrlKey || event.metaKey || event.altKey) return;
      if (
        ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
        showRegion(
            (keyboardSelection.current +
              (["ArrowLeft", "ArrowUp"].includes(event.key) ? -1 : 1) +
              selectable.length) %
            selectable.length,
        );
      }
      if (["Enter", " "].includes(event.key)) {
        event.preventDefault();
        const region = selectable[Math.min(keyboardSelection.current, selectable.length - 1)];
        const point = engine.current?.getRegionPoint(region.id);
        if (!point) return;
        const size = getSize(), view = viewport.current;
        const x = point.x / 1600 * size.width * view.scale + view.x;
        const y = point.y / 2000 * size.height * view.scale + view.y;
        // After a pointer pan/zoom, reveal the target first. A second Enter
        // paints it only after the user can inspect the visible selection.
        if (!keyboardFocus || x < 0 || x > size.width || y < 0 || y > size.height) {
          showRegion(keyboardSelection.current);
          return;
        }
        current.current.onPaint?.(region.id, point);
      }
      if (event.key === "+" || event.key === "=") {
        event.preventDefault();
        zoom(1.25);
        showRegion(keyboardSelection.current);
      }
      if (event.key === "-") {
        event.preventDefault();
        zoom(0.8);
        showRegion(keyboardSelection.current);
      }
      if (event.key === "Escape") applyView({ scale: 1, x: 0, y: 0 });
    };
    const focusUnit = 1600 / getSize().width / view.scale;
    return (
      <div
        className={`artwork-viewport ${interactive ? "artwork-interactive" : ""}`}
        ref={stage}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={cancel}
        onLostPointerCapture={cancel}
        onKeyDown={key}
        onFocus={() => { if (interactive) showRegion(keyboardSelection.current); }}
        onBlur={() => setKeyboardFocus(false)}
        tabIndex={interactive ? 0 : undefined}
        role={interactive ? "group" : "img"}
        aria-label={
          interactive
            ? `${template.title}。矢印キーでぬる場所をえらび、Enterでぬります。プラスとマイナスで拡大縮小。`
            : template.title
        }
        aria-describedby={interactive ? "keyboard-region" : undefined}
        data-testid="artwork"
      >
        <div
          className="artwork-transform"
          data-view-scale={view.scale}
          data-view-x={view.x}
          data-view-y={view.y}
          style={
            {
              transform: template.paintingProfile ? "none" : `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            } as CSSProperties
          }
        >
          <canvas ref={canvas} aria-hidden="true" />
          {keyboardFocus && interactive && (
            <svg
              className="region-focus-overlay"
              data-region-id={selected.id}
              style={template.paintingProfile ? { transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`, transformOrigin: "0 0" } : undefined}
              viewBox="0 0 1600 2000"
              aria-hidden="true"
            >
              <path
                d={selected.path}
                fill="none"
                stroke="#128aa5"
                strokeWidth={2 * focusUnit}
                strokeDasharray={`${6 * focusUnit} ${4 * focusUnit}`}
              />
            </svg>
          )}
        </div>
        {loadError && <div className="artwork-load-error" role="alert" onPointerDown={event => event.stopPropagation()}>
          <p>{loadError}</p><button className="button" type="button" onClick={() => setLoadAttempt(value => value+1)}>読み込みをやりなおす</button>
        </div>}
        {keyboardFocus && interactive && keyboardPoint && (
          <span
            className="region-focus-marker"
            data-region-id={selected.id}
            aria-hidden="true"
            style={{
              left: keyboardPoint.x / 1600 * getSize().width * view.scale + view.x,
              top: keyboardPoint.y / 2000 * getSize().height * view.scale + view.y,
            }}
          />
        )}
        {interactive && (
          <span id="keyboard-region" className="sr-only" aria-live="polite">
            {keyboardFocus ? selected.name : ""}
          </span>
        )}
      </div>
    );
  },
);
