import { useEffect, useId, useRef, useState } from "react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Maximize2,
  Trash2,
} from "lucide-react";
import { loadBackgrounds, loadFrames, loadTemplate, loadImprovedTemplate } from "@island/content";
import { loadSceneImage, loadSceneAsset } from "@island/engine";
import type { Project, SceneAsset, Template } from "@island/shared";
import { services, useApp, useProjects } from "../app-context";
import { ArtworkCanvas, type ArtworkHandle } from "../components/ArtworkCanvas";
import {
  Empty,
  Footer,
  Loading,
  Modal,
  PageHeader,
  downloadBlob,
  errorMessage,
  navigate,
} from "../components/UI";
import { ScenePicker } from "../components/ScenePicker";
import { renderProject } from "../artwork-render";
import { artworkRevision, resolveArtworkSource } from "../artwork-source";
import { useAccountScope, type AccountScope } from "../use-account-scope";
import { UnreadableWorksHint } from '../components/UnreadableWorks';
import { IllustratedIcon } from '../components/IllustratedIcon';

function Thumbnail({ project }: { project: Project }) {
  const captureScope = useAccountScope(project.userId);
  const ref = useRef<HTMLDivElement>(null);
  const objectUrls = useRef(new Set<string>());
  const [url, setUrl] = useState(""),
    [visible, setVisible] = useState(false);
  useEffect(() => () => {
    // React has committed the replacement src before this cleanup runs.
    // A refresh of project data may still be resolving its next thumbnail.
    if (objectUrls.current.delete(url)) URL.revokeObjectURL(url);
  }, [url]);
  useEffect(() => {
    const allocated = objectUrls.current;
    return () => {
      // Also release a URL queued in state just before this card unmounts.
      for (const value of allocated) URL.revokeObjectURL(value);
      allocated.clear();
    };
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "240px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const scope = captureScope();
    let active = true;
    void (async () => {
      const source = await resolveArtworkSource(project);
      const renderKey = await artworkRevision(project, source);
      if (!active || !scope.isActive()) return;
      const saved = await services.thumbnails.get(project.id, renderKey);
      if (saved) return saved;
      const blob = await renderProject(project, "thumbnail", source);
      if (!active || !scope.isActive()) return;
      // This derived cache is optional; a storage failure must not hide a
      // successfully rendered current image or mutate the saved artwork.
      await services.thumbnails.set(project.id, blob, project, renderKey).catch(() => undefined);
      return blob;
    })()
      .then((blob) => {
        if (blob && active && scope.isActive()) {
          const objectUrl = URL.createObjectURL(blob);
          objectUrls.current.add(objectUrl);
          setUrl(objectUrl);
        }
      })
      .catch(() => {
        if (active && scope.isActive()) setUrl(`/content/templates/${project.templateId}.svg`);
      });
    return () => {
      active = false;
    };
  }, [visible, project, captureScope]);
  return (
    <div className="gallery-thumb" ref={ref}>
      {url ? (
        <img src={url} alt="" width="240" height="300" />
      ) : (
        <span className="thumbnail-loading" aria-hidden="true">
          <IllustratedIcon name="gallery" />
        </span>
      )}
    </div>
  );
}
export default function Gallery({ projectId }: { projectId?: string }) {
  const { projects, loading, error, unreadableCount } = useProjects();
  const { toast } = useApp();
  const ownerId = services.auth.session?.userId ?? "";
  const captureScope = useAccountScope(ownerId);
  const [removeDraft, setRemoveDraft] = useState<Project | null>(null);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const deletionLock = useRef(false);
  useEffect(() => {
    setRemoveDraft(null);
    setDeletingDraft(false);
    deletionLock.current = false;
  }, [ownerId]);
  const deleteDraft = async () => {
    const scope = captureScope();
    if (!removeDraft || removeDraft.userId !== ownerId || deletionLock.current || !scope.isActive()) return;
    deletionLock.current = true;
    setDeletingDraft(true);
    try {
      // Use the exact project that the confirmation showed. The persistence
      // revision check protects edits saved by another tab in the meantime.
      await services.projects.delete(removeDraft);
      if (scope.isActive()) {
        setRemoveDraft(null);
        toast("途中の作品を削除しました");
      }
    } catch (failure) {
      if (scope.isActive()) {
        toast(errorMessage(failure));
        if (failure && typeof failure === "object" && "code" in failure && failure.code === "CHANGED") setRemoveDraft(null);
      }
    } finally {
      if (scope.isActive()) {
        deletionLock.current = false;
        setDeletingDraft(false);
      }
    }
  };
  const [tab, setTab] = useState<"completed" | "draft">("completed"),
    [visibleCount, setVisibleCount] = useState(24);
  const tabsId = useId();
  const tabButtons = useRef<
    Record<"completed" | "draft", HTMLButtonElement | null>
  >({ completed: null, draft: null });
  if (projectId)
    return (
      <ProjectDetail
        key={projectId}
        projectId={projectId}
        projects={projects}
      />
    );
  const drafts = projects.filter((project) => project.status === "draft");
  const selectedTab = drafts.length ? tab : "completed";
  const selectTab = (next: "completed" | "draft") => {
    setTab(next);
    setVisibleCount(24);
  };
  const works = projects
    .filter((project) => project.status === selectedTab)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return (
    <main className="gallery-page">
      <PageHeader title="さくひん" />
      <UnreadableWorksHint count={unreadableCount} />
      <div className="section-intro">
        <span className="eyebrow">YOUR LITTLE GALLERY</span>
        <h2>きみの色が、たからもの。</h2>
        <p>すきな作品を、いつでもここで。</p>
      </div>
      {drafts.length > 0 && (
        <div
          className="gallery-tabs"
          role="tablist"
          aria-label="作品のしゅるい"
          aria-orientation="horizontal"
          onKeyDown={(event) => {
            if (event.ctrlKey || event.metaKey || event.altKey) return;
            let next: "completed" | "draft";
            if (event.key === "ArrowLeft" || event.key === "ArrowRight")
              next = selectedTab === "completed" ? "draft" : "completed";
            else if (event.key === "Home") next = "completed";
            else if (event.key === "End") next = "draft";
            else return;
            event.preventDefault();
            selectTab(next);
            tabButtons.current[next]?.focus();
          }}
        >
          <button
            type="button"
            role="tab"
            ref={(element) => {
              tabButtons.current.completed = element;
            }}
            id={`${tabsId}-completed-tab`}
            aria-controls={`${tabsId}-completed-panel`}
            aria-selected={selectedTab === "completed"}
            tabIndex={selectedTab === "completed" ? 0 : -1}
            onClick={() => selectTab("completed")}
          >
            完成<span>{projects.length - drafts.length}</span>
          </button>
          <button
            type="button"
            role="tab"
            ref={(element) => {
              tabButtons.current.draft = element;
            }}
            id={`${tabsId}-draft-tab`}
            aria-controls={`${tabsId}-draft-panel`}
            aria-selected={selectedTab === "draft"}
            tabIndex={selectedTab === "draft" ? 0 : -1}
            onClick={() => selectTab("draft")}
          >
            途中<span>{drafts.length}</span>
          </button>
        </div>
      )}
      {error && (
        <p className="inline-error" role="alert">
          {error}
        </p>
      )}
      {(["completed", "draft"] as const)
        .filter((status) => drafts.length > 0 || status === "completed")
        .map((status) => (
          <div
            key={status}
            id={`${tabsId}-${status}-panel`}
            role={drafts.length > 0 ? "tabpanel" : undefined}
            aria-labelledby={
              drafts.length > 0 ? `${tabsId}-${status}-tab` : undefined
            }
            tabIndex={drafts.length > 0 ? 0 : undefined}
            hidden={status !== selectedTab}
          >
            {status !== selectedTab ? null : loading ? (
              <Loading />
            ) : works.length === 0 ? (
              <Empty
                title={
                  selectedTab === "draft"
                    ? "つづきの作品は まだありません"
                    : "さいしょの作品を つくろう"
                }
              >
                <p>好きな色でぬったら、ここにかざれます。</p>
                <button
                  className="button button-primary"
                  onClick={() => navigate("/home")}
                >
                  しまへあそびにいく
                  <ArrowRight size={19} />
                </button>
              </Empty>
            ) : (
              <>
                <div className="gallery-grid">
                  {works.slice(0, visibleCount).map((project) => (
                    <div className="gallery-item" key={project.id}>
                    <button
                      className="gallery-card"
                      type="button"
                      onClick={() =>
                        navigate(
                          project.status === "draft"
                            ? `/paint/${project.id}`
                            : `/art/${project.id}`,
                        )
                      }
                    >
                      <Thumbnail project={project} />
                      <strong>{project.title}</strong>
                      <span>
                        {new Intl.DateTimeFormat("ja-JP", {
                          month: "numeric",
                          day: "numeric",
                        }).format(new Date(project.updatedAt))}
                        <ChevronRight size={15} />
                      </span>
                    </button>
                    {project.status === "draft" && (
                      <button
                        type="button"
                        className="gallery-delete"
                        aria-label={`「${project.title}」を削除`}
                        onClick={() => setRemoveDraft(project)}
                      >
                        <Trash2 size={16} aria-hidden="true" />
                        削除
                      </button>
                    )}
                    </div>
                  ))}
                </div>
                {works.length > visibleCount && (
                  <button
                    className="button load-more"
                    onClick={() => setVisibleCount((value) => value + 24)}
                  >
                    もっとみる
                  </button>
                )}
              </>
            )}
          </div>
        ))}
      {removeDraft && (
        <Modal title="途中の作品を削除しますか？" onClose={() => { if (!deletingDraft) setRemoveDraft(null); }}>
          <p>「{removeDraft.title}」を削除します。削除した作品は元にもどせません。</p>
          <div className="dialog-actions">
            <button type="button" className="button" disabled={deletingDraft} onClick={() => setRemoveDraft(null)}>やめる</button>
            <button type="button" className="button button-danger" disabled={deletingDraft} onClick={() => { void deleteDraft(); }}>
              {deletingDraft ? "削除しています…" : "削除する"}
            </button>
          </div>
        </Modal>
      )}
      <Footer />
    </main>
  );
}

function ProjectDetail({
  projectId,
  projects,
}: {
  projectId: string;
  projects: Project[];
}) {
  const { toast } = useApp();
  const ownerId = services.auth.session?.userId ?? "";
  const captureScope = useAccountScope(ownerId);
  const [project, setProject] = useState<Project | null>(null),
    [template, setTemplate] = useState<Template | null>(null);
  const [backgrounds, setBackgrounds] = useState<SceneAsset[]>([]),
    [frames, setFrames] = useState<SceneAsset[]>([]);
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [ready, setReady] = useState(false);
  const [picker, setPicker] = useState<"background" | "frame" | null>(null),
    [remove, setRemove] = useState<Project | null>(null),
    [large, setLarge] = useState(false);
  const artwork = useRef<ArtworkHandle>(null);
  useEffect(() => {
    let active = true;
    const scope = captureScope();
    void services.projects
      .get(projectId)
      .then(async (next) => {
        if (!active || !scope.isActive()) return;
        if (!next || next.userId !== ownerId)
          throw new Error("この作品は見つかりませんでした。");
        const [art, bgs, borders] = await Promise.all([
          loadTemplate(next.templateId),
          loadBackgrounds(),
          loadFrames(),
        ]);
        if (active && scope.isActive()) {
          setProject(next);
          setTemplate(art);
          setBackgrounds(bgs);
          setFrames(borders);
        }
      })
      .catch((e) => {
        if (active && scope.isActive()) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, [projectId, projects, ownerId, captureScope]);
  const completed = projects
    .filter((item) => item.status === "completed")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const index = completed.findIndex((item) => item.id === projectId);
  const action = async (fn: (scope: AccountScope) => Promise<void>) => {
    const scope = captureScope();
    if (busy || !scope.isActive() || project?.userId !== ownerId) return;
    setBusy(true);
    try {
      await fn(scope);
    } catch (e) {
      if (scope.isActive()) toast(errorMessage(e));
    } finally {
      if (scope.isActive()) setBusy(false);
    }
  };
  const scene = (item: SceneAsset) => {
    void action(async (scope) => {
      if (!project || !picker) return;
      if (item.id !== "white" && item.id !== "none")
        await (template?.paintingProfile ? loadSceneAsset(item, scope.signal) : loadSceneImage(item.assetUrl, scope.signal));
      if (!scope.isActive()) return;
      const current = await services.projects.get(project.id);
      if (!scope.isActive() || !current) return;
      const next = {
        ...current,
        ...(picker === "background"
          ? { backgroundId: item.id }
          : { frameId: item.id }),
        updatedAt: new Date().toISOString(),
      };
      const saved = await services.projects.save(next, { immediate: true });
      if (!scope.isActive()) return;
      setProject(saved);
      setPicker(null);
      const source = await resolveArtworkSource(saved);
      const renderKey = await artworkRevision(saved, source);
      const thumbnail = await renderProject(saved, "thumbnail", source);
      if (!scope.isActive()) return;
      await services.thumbnails.set(saved.id, thumbnail, saved, renderKey);
      if (!scope.isActive()) return;
      void services.sync.flush();
    });
  };
  if (error)
    return (
      <main>
        <PageHeader title="さくひん" back="/gallery" />
        <p role="alert" className="inline-error">
          {error}
        </p>
      </main>
    );
  if (!project || !template) return <Loading />;
  return (
    <main className="art-detail">
      <PageHeader title="さくひん" back="/gallery" />
      <div className="detail-heading">
        <h2>{project.title}</h2>
        <p>
          {new Intl.DateTimeFormat("ja-JP", { dateStyle: "long" }).format(
            new Date(project.createdAt),
          )}
        </p>
      </div>
      <div className="detail-layout">
        <div className="detail-art-area">
          <button
            className="icon-button artwork-nav artwork-prev"
            type="button"
            disabled={index <= 0}
            aria-label="まえの作品"
            onClick={() => navigate(`/art/${completed[index - 1].id}`)}
          >
            <ChevronLeft />
          </button>
          <div className="detail-paper">
            <ArtworkCanvas
              ref={artwork}
              template={template}
              project={project}
              backgrounds={backgrounds}
              frames={frames}
              onError={toast}
              onReady={() => setReady(true)}
              onLoading={() => setReady(false)}
            />
          </div>
          <button
            className="icon-button artwork-nav artwork-next"
            type="button"
            disabled={index < 0 || index >= completed.length - 1}
            aria-label="つぎの作品"
            onClick={() => navigate(`/art/${completed[index + 1].id}`)}
          >
            <ChevronRight />
          </button>
        </div>
        <div className="detail-actions">
          <button
            className="button button-primary"
            type="button"
            disabled={busy || !ready}
            onClick={() => {
              void action(async (scope) => {
                const blob = await artwork.current!.engine()!.exportPng();
                if (!scope.isActive()) return;
                await downloadBlob(blob, `${project.title}.png`);
                if (scope.isActive()) toast("画像を保存しました");
              });
            }}
          >
            <Download size={21} />
            PNG保存
          </button>
          <button
            className="button"
            type="button"
            onClick={() => setLarge(true)}
          >
            <Maximize2 size={20} />
            大きく見る
          </button>
          <div className="detail-action-row">
            <button
              className="button"
              type="button"
              onClick={() => setPicker("background")}
            >
              <IllustratedIcon name="background" />
              背景変更
            </button>
            <button
              className="button"
              type="button"
              onClick={() => setPicker("frame")}
            >
              <IllustratedIcon name="frame" />
              フレーム変更
            </button>
          </div>
          <button
            className="button duplicate-button"
            type="button"
            disabled={busy}
            onClick={() => {
              void action(async (scope) => {
                const copy = await services.projects.duplicate(project.id);
                if (!scope.isActive()) return;
                navigate(`/paint/${copy.id}`);
              });
            }}
          >
            <Copy size={20} />
            もういちどぬる
          </button>
          <p className="muted">この作品をのこして、新しい作品をつくります。</p>
          {((template.paintingProfile?.version??1)<3 || template.paintingProfile?.smoothArtwork?.ink==='pigment-v1' || (template.themeId==='princess'&&(template.paintingProfile?.version===3||['gen-princess-bunny-v6-master-v1','gen-princess-bunny-v6-master-v2'].includes(template.id)))) && <button className="button" type="button" disabled={busy} onClick={() => { void action(async scope => {
            const improved = await loadImprovedTemplate(project.templateId);
            if (!scope.isActive()) return;
            if (!improved?.paintingProfile) { toast('この絵の改善版は準備中です'); return; }
            const sceneMap = (items: SceneAsset[]) => Object.fromEntries(items.filter(item => item.legacyId).map(item => [item.legacyId!, item.id]));
            const renderer=improved.paintingProfile.version===4?'storybook-v4':improved.paintingProfile.version===3?'storybook-v3':'storybook-v2';
            const copy = await services.projects.duplicate(project.id, { sourceTemplateId: project.templateId, templateId: improved.id, regionMap: improved.paintingProfile.upgradeSources?.[project.templateId]??improved.paintingProfile.regionMap, backgroundMap: sceneMap(backgrounds), frameMap: sceneMap(frames),renderer });
            if (scope.isActive()) navigate(`/paint/${copy.id}`);
          }); }}><Copy size={20} />改善版をつくる</button>}
          <button
            className="text-button danger"
            type="button"
            onClick={() => setRemove(project)}
          >
            <Trash2 size={16} />
            この作品を削除
          </button>
        </div>
      </div>
      {picker && (
        <ScenePicker
          kind={picker}
          items={(picker === "background" ? backgrounds : frames).filter(item => template.paintingProfile ? item.catalogVisible !== false : !item.compositionUrl)}
          selectedId={
            picker === "background" ? project.backgroundId : project.frameId
          }
          busy={busy}
          onSelect={scene}
          onClose={() => setPicker(null)}
        />
      )}
      {remove && (
        <Modal title="この作品を削除しますか？" onClose={() => setRemove(null)}>
          <p>削除した作品は元にもどせません。</p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setRemove(null)}>
              やめる
            </button>
            <button
              className="button button-danger"
              disabled={busy}
              onClick={() => {
                void action(async (scope) => {
                  try {
                    await services.projects.delete(remove);
                    if (scope.isActive()) navigate("/gallery");
                  } catch (error) {
                    if (
                      scope.isActive() &&
                      error &&
                      typeof error === "object" &&
                      "code" in error &&
                      error.code === "CHANGED"
                    ) {
                      const current = await services.projects.get(remove.id);
                      if (scope.isActive()) {
                        setRemove(null);
                        if (current) setProject(current);
                      }
                    }
                    throw error;
                  }
                });
              }}
            >
              削除する
            </button>
          </div>
        </Modal>
      )}
      {large && (
        <Modal title={project.title} onClose={() => setLarge(false)} wide>
          <div className="enlarged-artwork">
            <ArtworkCanvas
              template={template}
              project={project}
              backgrounds={backgrounds}
              frames={frames}
              onError={toast}
            />
          </div>
        </Modal>
      )}
    </main>
  );
}
