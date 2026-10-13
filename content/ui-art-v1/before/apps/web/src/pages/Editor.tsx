import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  ArrowLeft,
  Brush,
  Pencil,
  PencilLine,
  Eraser,
  Check,
  Image as ImageIcon,
  Frame,
  ZoomIn,
  ZoomOut,
  Maximize,
  ChevronRight,
} from "lucide-react";
import {
  COLOR_FAMILIES,
  loadBackgrounds,
  loadFrames,
  loadTemplate,
} from "@island/content";
import { loadSceneImage, loadSceneAsset, paintTargets, applyPaints } from "@island/engine";
import type {
  ColorFamilyId,
  PaintType,
  PaintMode,
  Point,
  Project,
  RegionPaint,
  SceneAsset,
  Template,
} from "@island/shared";
import { services, useApp } from "../app-context";
import { ArtworkCanvas, type ArtworkHandle } from "../components/ArtworkCanvas";
import { ScenePicker } from "../components/ScenePicker";
import { Loading, PageHeader, errorMessage, navigate } from "../components/UI";
import { completionSound, paintSound, speakColor, unlockAudio } from "../audio";
import { useAccountScope } from "../use-account-scope";
import { artworkRevision } from "../artwork-source";
import { useNavigationBlocker } from '../guarded-route';

interface EditorData {
  project: Project;
  template: Template;
  backgrounds: SceneAsset[];
  frames: SceneAsset[];
}
export default function Editor({ projectId }: { projectId: string }) {
  const ownerId = services.auth.session?.userId ?? "";
  const captureScope = useAccountScope(ownerId);
  const [data, setData] = useState<EditorData | null>(null),
    [error, setError] = useState("");
  useEffect(() => {
    let alive = true;
    const scope = captureScope();
    setData(null);
    setError("");
    void services.projects
      .get(projectId)
      .then(async (project) => {
        if (!alive || !scope.isActive()) return;
        if (!project || project.userId !== ownerId)
          throw new Error(
            "この作品が見つかりませんでした。さくひんから選びなおしてください。",
          );
        const [template, backgrounds, frames] = await Promise.all([
          loadTemplate(project.templateId),
          loadBackgrounds(),
          loadFrames(),
        ]);
        if (alive && scope.isActive())
          setData({ project, template, backgrounds, frames });
      })
      .catch((e) => {
        if (alive && scope.isActive()) setError(errorMessage(e));
      });
    return () => {
      alive = false;
    };
  }, [projectId, ownerId, captureScope]);
  if (error)
    return (
      <main>
        <PageHeader title="ぬりえ" />
        <div className="empty-state">
          <p role="alert">{error}</p>
          <button
            className="button button-primary"
            onClick={() => navigate("/gallery")}
          >
            さくひんへ
          </button>
        </div>
      </main>
    );
  return data ? (
    <EditorReady key={projectId} data={data} />
  ) : (
    <Loading text="ぬりえを ひらいています…" />
  );
}

function EditorReady({ data }: { data: EditorData }) {
  const { settings, toast } = useApp();
  const captureScope = useAccountScope(data.project.userId);
  const sceneRequest = useRef<AbortController | null>(null);
  const [project, setProject] = useState(data.project),
    [familyId, setFamilyId] = useState<ColorFamilyId>(
      data.template.defaultColorFamily,
    );
  const family = COLOR_FAMILIES.find((item) => item.id === familyId)!;
  const paintMode: PaintMode = project.metadata.paintMode === "region" || !data.template.paintingProfile ? "region" : "group";
  const [color, setColor] = useState(family.colors[5]),
    [paintType, setPaintType] = useState<PaintType>("smooth"),
    [erase, setErase] = useState(false);
  const [picker, setPicker] = useState<"background" | "frame" | null>(null),
    [sceneBusy, setSceneBusy] = useState(false);
  const [stage, setStage] = useState<"edit" | "celebrate" | "finish">("edit"),
    [saveError, setSaveError] = useState(""),
    [canvasReady, setCanvasReady] = useState(false);
  const artwork = useRef<ArtworkHandle>(null),
    latest = useRef(project),
    pending = useRef(new Set<Promise<Project>>()),
    failedSaves = useRef(new Map<string, unknown>()),
    editSequence = useRef(0);
  const thumbnailTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    completionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
      undefined,
    ),
    mounted = useRef(true),
    unsaved = useRef(false);
  const reduced =
    settings.reducedMotion ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const saveThumbnail = async () => {
    const scope = captureScope();
    if (!scope.isActive() || !canvasReady || unsaved.current || pending.current.size > 0) return;
    const engine = artwork.current?.engine();
    if (!engine) return;
    try {
      const source = latest.current;
      const blob = await engine.exportThumbnail();
      const renderKey = await artworkRevision(source, data);
      if (!scope.isActive()) return;
      await services.thumbnails.set(source.id, blob, source, renderKey);
    } catch (error) {
      if (scope.isActive()) setSaveError(errorMessage(error));
    }
  };
  const scheduleThumbnail = () => {
    clearTimeout(thumbnailTimer.current);
    thumbnailTimer.current = setTimeout(() => {
      void saveThumbnail();
    }, 1100);
  };
  useEffect(() => {
    mounted.current = true;
    const visibility = () => {
      if (document.visibilityState === "hidden") void services.sync.flush();
    };
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (pending.current.size > 0 || unsaved.current) {
        event.preventDefault();
        event.returnValue = "";
      }
    };
    document.addEventListener("visibilitychange", visibility);
    window.addEventListener("beforeunload", beforeUnload);
    return () => {
      mounted.current = false;
      sceneRequest.current?.abort();
      clearTimeout(thumbnailTimer.current);
      clearTimeout(completionTimer.current);
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("beforeunload", beforeUnload);
    };
  }, []);
  const change = async (
    patch: Partial<Project>,
    immediate = false,
  ): Promise<Project> => {
    const scope = captureScope();
    if (!scope.isActive()) throw new Error("この作品を開きなおしてください。");
    const sequence = ++editSequence.current;
    unsaved.current = true;
    const before = latest.current;
    const next = { ...before, ...patch, updatedAt: new Date().toISOString() };
    latest.current = next;
    setProject(next);
    const task = services.projects.save(next, { immediate });
    pending.current.add(task);
    navigation.refresh();
    try {
      const saved = await task;
      if (!scope.isActive()) return saved;
      if (latest.current === next) latest.current = saved;
      else
        latest.current = {
          ...latest.current,
          ...saved,
          regions: latest.current.regions,
          backgroundId: latest.current.backgroundId,
          frameId: latest.current.frameId,
          status: latest.current.status,
          metadata: latest.current.metadata,
          updatedAt: latest.current.updatedAt,
        };
      if (sequence === editSequence.current) unsaved.current = false;
      if (mounted.current) {
        setProject(latest.current);
        if (sequence === editSequence.current) setSaveError("");
      }
      return saved;
    } catch (error) {
      if (scope.isActive()) failedSaves.current.set(next.id, error);
      if (scope.isActive() && sequence === editSequence.current) {
        unsaved.current = true;
        setSaveError(errorMessage(error));
      }
      throw error;
    } finally {
      pending.current.delete(task);
      if (scope.isActive()) navigation.refresh();
    }
  };
  const paint = (regionId: string, point: Point) => {
    if (stage !== "edit" || !captureScope().isActive()) return;
    const value: RegionPaint | null = erase ? null : { color, paintType };
    const ids = paintTargets(data.template, regionId, paintMode);
    artwork.current?.engine()?.paintMany(ids, value, point, reduced);
    const regions = applyPaints(latest.current.regions, ids, value);
    void change({ regions }).catch(() => undefined);
    scheduleThumbnail();
    paintSound(settings);
  };
  const saveForNavigation = async () => {
    const scope = captureScope();
    const requireActive = () => {
      if (!scope.isActive()) throw new DOMException('この画面での保存を中止しました。', 'AbortError');
    };
    while (scope.isActive() && pending.current.size > 0)
      await Promise.allSettled([...pending.current]);
    requireActive();
    if (unsaved.current) await change({});
    requireActive();
    await saveThumbnail();
    requireActive();
    void services.sync.flush();
  };
  const navigation = useNavigationBlocker({
    hasChanges: () => captureScope().isActive() && (unsaved.current || pending.current.size > 0),
    isSaving: () => captureScope().isActive() && pending.current.size > 0,
    save: saveForNavigation,
    discard: () => {
      if (!captureScope().isActive() || pending.current.size > 0) return;
      for (const failure of failedSaves.current.values()) services.projects.discardFailedSave(failure);
      failedSaves.current.clear();
      unsaved.current = false;
      clearTimeout(thumbnailTimer.current);
    },
  });
  const goBack = async () => {
    const scope = captureScope();
    if (!scope.isActive()) return;
    if (navigation.enabled && (unsaved.current || pending.current.size > 0)) {
      navigate('/home');
      return;
    }
    try {
      await saveForNavigation();
      if (!scope.isActive()) return;
      navigate("/home");
    } catch (error) {
      if (scope.isActive()) toast(errorMessage(error));
    }
  };
  const finish = async () => {
    const scope = captureScope();
    if (stage !== "edit" || !scope.isActive()) return;
    const saved = change({ status: "completed" }, true);
    setStage("celebrate");
    artwork.current?.reset();
    completionSound(settings);
    const animation = new Promise<void>((resolve) => {
      completionTimer.current = setTimeout(resolve, reduced ? 300 : 1800);
    });
    try {
      await saved;
      if (!scope.isActive()) return;
      await saveThumbnail();
      if (!scope.isActive()) return;
      void services.sync.flush();
      await animation;
      if (scope.isActive()) setStage("finish");
    } catch (error) {
      if (scope.isActive()) {
        setStage("edit");
        toast(errorMessage(error));
      }
    }
  };
  const chooseScene = async (item: SceneAsset) => {
    if (!picker || sceneBusy) return;
    const scope = captureScope();
    if (!scope.isActive()) return;
    const controller = new AbortController();
    sceneRequest.current?.abort();
    sceneRequest.current = controller;
    setSceneBusy(true);
    try {
      if (item.id !== "none" && item.id !== "white")
        await (data.template.paintingProfile ? loadSceneAsset(item, controller.signal) : loadSceneImage(item.assetUrl, controller.signal));
      if (!scope.isActive() || controller.signal.aborted) return;
      await change(
        picker === "background"
          ? { backgroundId: item.id }
          : { frameId: item.id },
        true,
      );
      if (!scope.isActive() || controller.signal.aborted) return;
      setPicker(null);
      scheduleThumbnail();
    } catch (error) {
      if (scope.isActive() && !controller.signal.aborted)
        toast(errorMessage(error));
    } finally {
      if (sceneRequest.current === controller) {
        sceneRequest.current = null;
        if (scope.isActive()) setSceneBusy(false);
      }
    }
  };
  const usedColors = [
    ...new Set(Object.values(project.regions).map((paint) => paint.color)),
  ];
  const particleColors = usedColors.length
    ? usedColors
    : ["#f6d791", "#a8d6df"];
  return (
    <main
      className={`editor-page stage-${stage} ${reduced ? "editor-reduced" : ""}`}
      onFocusCapture={({ target, currentTarget }) => {
        if (!(target instanceof HTMLButtonElement)) return;
        // Native keyboard focus scrolling can leave a partly visible button
        // and its outline clipped in short viewports. Do not move touch focus
        // or a portaled dialog; wait for the browser's own focus step first.
        requestAnimationFrame(() => {
          if (!target.isConnected || document.activeElement !== target ||
            !currentTarget.contains(target) || !target.matches(":focus-visible")) return;
          const rect = target.getBoundingClientRect();
          if (rect.top < 8 || rect.bottom > window.innerHeight - 8 ||
            rect.left < 8 || rect.right > window.innerWidth - 8) {
            target.scrollIntoView({ block: "nearest", inline: "nearest", behavior: "instant" });
          }
        });
      }}
    >
      <div className="editor-toolbar" aria-label="ぬりえのどうぐ">
        <button
          className="tool-button tool-back"
          type="button"
          onClick={() => {
            void goBack();
          }}
          disabled={stage === "celebrate"}
          aria-label="もどる"
        >
          <ArrowLeft />
          <span>もどる</span>
        </button>
        <div className="paint-tools" role="group" aria-label="画材">
          {(
            [
              { id: "smooth", name: "なめらか", Icon: Brush },
              { id: "crayon", name: "クレヨン", Icon: PencilLine },
              { id: "pencil", name: "いろえんぴつ", Icon: Pencil },
            ] as const
          ).map(({ id, name, Icon }) => (
            <button
              key={id}
              type="button"
              className={`tool-button material-${id} ${paintType === id ? "is-selected" : ""}`}
              aria-pressed={paintType === id}
              onClick={() => setPaintType(id)}
            >
              <Icon />
              <span>{name}</span>
            </button>
          ))}
        </div>
        <button
          className={`tool-button erase-button ${erase ? "is-selected" : ""}`}
          type="button"
          aria-pressed={erase}
          onClick={() => setErase((value) => !value)}
        >
          <Eraser />
          <span>けす</span>
        </button>
        <button
          type="button"
          className="complete-button"
          disabled={!canvasReady || stage !== "edit"}
          onClick={() => {
            void finish();
          }}
        >
          <Check />
          <span>完成</span>
        </button>
      </div>
      <div className="editor-title">
        <span>{data.template.title}</span>
        {data.template.paintingProfile && <div className="paint-mode" role="group" aria-label="ぬる範囲">
          {([['group', 'まとめて'], ['region', 'こまかく']] as const).map(([mode, label]) => <button key={mode} type="button" aria-pressed={paintMode === mode} onClick={() => { void change({ metadata: { ...latest.current.metadata, paintMode: mode, renderer: `storybook-v${data.template.paintingProfile?.version??1}` } }).catch(() => undefined); }}>{label}</button>)}
        </div>}
      </div>
      {saveError && (
        <div className="inline-error save-error" role="alert">
          {saveError}
          <button
            type="button"
            onClick={() => {
              void change({}).catch(() => undefined);
            }}
          >
            保存をやりなおす
          </button>
        </div>
      )}
      <div className="editor-stage">
        <div className="artwork-shadow">
          <ArtworkCanvas
            ref={artwork}
            template={data.template}
            project={project}
            backgrounds={data.backgrounds}
            frames={data.frames}
            interactive={stage === "edit"}
            tapAssist={settings.tapAssist}
            paintMode={paintMode}
            onPaint={paint}
            onReady={() => setCanvasReady(true)}
            onLoading={() => setCanvasReady(false)}
            onError={toast}
          />
        </div>
        {stage === "celebrate" && (
          <div className="completion-particles" aria-hidden="true">
            {Array.from({ length: reduced ? 0 : 8 }, (_, i) => (
              <i
                className="color-particle"
                key={i}
                style={
                  {
                    "--particle-color":
                      particleColors[i % particleColors.length],
                    "--particle-angle": `${i * 45}deg`,
                    "--particle-delay": `${(i % 3) * 70}ms`,
                  } as CSSProperties
                }
              />
            ))}
            {Array.from({ length: reduced ? 1 : 5 }, (_, i) => (
              <span
                className="celebration-star"
                key={i}
                style={
                  {
                    "--star-x": `${12 + ((i * 19) % 82)}%`,
                    "--star-y": `${10 + ((i * 29) % 78)}%`,
                    "--particle-delay": `${i * 85}ms`,
                  } as CSSProperties
                }
              >
                ✦
              </span>
            ))}
          </div>
        )}
        {stage === "edit" && (
          <div className="zoom-tools" aria-label="絵の大きさ">
            <button
              type="button"
              className="icon-button"
              aria-label="ちいさく"
              onClick={() => artwork.current?.zoom(0.8)}
            >
              <ZoomOut size={19} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="もとの大きさ"
              onClick={() => artwork.current?.reset()}
            >
              <Maximize size={18} />
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="おおきく"
              onClick={() => artwork.current?.zoom(1.25)}
            >
              <ZoomIn size={19} />
            </button>
          </div>
        )}
      </div>
      {stage !== "finish" ? (
        <section className="palette-panel" aria-label="色のパレット">
          <div className="palette-topline">
            <h2>
              <span className="small-island">◡</span>いろのしま
            </h2>
            <div className="scene-buttons">
              <button
                className="small-button"
                type="button"
                onClick={() => setPicker("background")}
              >
                <ImageIcon size={17} />
                <span>はいけい</span>
              </button>
              <button
                className="small-button"
                type="button"
                onClick={() => setPicker("frame")}
              >
                <Frame size={17} />
                <span>かざりわく</span>
              </button>
            </div>
          </div>
          <div className="color-families" role="group" aria-label="色のしま">
            {COLOR_FAMILIES.map((item) => (
              <button
                type="button"
                key={item.id}
                className={`color-island color-island-${item.id} ${familyId === item.id ? "is-selected" : ""}`}
                style={
                  {
                    "--swatch": item.colors[5],
                    "--swatch-light": item.colors[1],
                  } as CSSProperties
                }
                onClick={() => setFamilyId(item.id)}
                aria-pressed={familyId === item.id}
                aria-label={`${item.name}のしま`}
              >
                <span className="color-island-symbol" aria-hidden="true">
                  <span />
                </span>
                <span>{item.name}</span>
                {familyId === item.id && (
                  <Check className="family-check" size={13} />
                )}
              </button>
            ))}
          </div>
          <div
            className="shades"
            role="group"
            aria-label={`${family.name}の12色`}
          >
            {family.colors.map((hex, index) => (
              <button
                key={hex}
                type="button"
                className={`shade ${hex === color && !erase ? "is-selected" : ""}`}
                style={{ "--swatch": hex } as CSSProperties}
                aria-label={family.labels[index]}
                aria-pressed={hex === color && !erase}
                onClick={() => {
                  setColor(hex);
                  setErase(false);
                  speakColor(family.labels[index], settings.speakColors);
                  unlockAudio(settings);
                }}
              >
                <span>{hex === color && !erase && <Check size={17} />}</span>
              </button>
            ))}
          </div>
        </section>
      ) : (
        <section className="finish-panel" aria-label="さくひんのしあげ">
          <div className="finish-options">
            <button
              className="button"
              type="button"
              onClick={() => setPicker("background")}
            >
              <ImageIcon />
              はいけい
            </button>
            <button
              className="button"
              type="button"
              onClick={() => setPicker("frame")}
            >
              <Frame />
              かざりわく
            </button>
          </div>
          <button
            className="button button-primary"
            type="button"
            onClick={async () => {
              const scope = captureScope();
              if (!scope.isActive()) return;
              await saveThumbnail();
              if (!scope.isActive()) return;
              void services.sync.flush();
              navigate(`/art/${latest.current.id}`);
            }}
          >
            さくひんへ
            <ChevronRight size={20} />
          </button>
          <button
            className="text-button"
            type="button"
            onClick={() => setStage("edit")}
          >
            もうすこしぬる
          </button>
        </section>
      )}
      {picker && (
        <ScenePicker
          kind={picker}
          items={(picker === "background" ? data.backgrounds : data.frames).filter(item => data.template.paintingProfile ? item.catalogVisible !== false : !item.compositionUrl)}
          selectedId={
            picker === "background" ? project.backgroundId : project.frameId
          }
          busy={sceneBusy}
          onSelect={(item) => {
            void chooseScene(item);
          }}
          onClose={() => {
            sceneRequest.current?.abort();
            setPicker(null);
            setSceneBusy(false);
          }}
        />
      )}
    </main>
  );
}
