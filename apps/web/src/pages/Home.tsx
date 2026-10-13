import { useEffect, useState, type CSSProperties } from "react";
import {
  ArrowRight,
  ChevronRight,
  ArrowLeft,
  Shell,
  Waves,
} from "lucide-react";
import { loadCatalog, loadTemplate, THEMES } from "@island/content";
import type { TemplateSummary } from "@island/shared";
import { Brand, IslandMenuArt } from "../components/Brand";
import {
  Empty,
  Footer,
  Loading,
  PageHeader,
  errorMessage,
  navigate,
} from "../components/UI";
import { services, useApp, useProjects } from "../app-context";
import { useAccountScope } from "../use-account-scope";
import { UnreadableWorksHint } from '../components/UnreadableWorks';
import { IllustratedIcon } from '../components/IllustratedIcon';

export function HomePage() {
  const { projects, unreadableCount } = useProjects();
  const latest = projects
    .filter((p) => p.status === "draft")
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
  return (
    <main className="home-page storybook-home">
      <header className="home-header">
        <Brand />
        <button
          className="settings-link"
          type="button"
          onClick={() => navigate("/settings")}
        >
          <IllustratedIcon name="settings" />
          <span>設定</span>
        </button>
      </header>
      <UnreadableWorksHint count={unreadableCount} />
      <h1 className="sr-only">ぬりえのしま</h1>
      <div className="island-grid">
        {THEMES.map((theme, index) => (
          <button
            key={theme.id}
            type="button"
            className={`island-card island-${theme.id}`}
            style={
              {
                "--island-color": theme.color,
                "--island-bg": theme.softColor,
                "--island-delay": `${index * 28}ms`,
              } as CSSProperties
            }
            onClick={() => navigate(`/theme/${theme.id}`)}
            aria-label={`${theme.name}のしま`}
          >
            <IslandMenuArt themeId={theme.id} priority={index<4}/>
          </button>
        ))}
      </div>
      <nav className="home-shortcuts" aria-label="作品メニュー">
        <button
          type="button"
          className="shortcut shortcut-continue"
          onClick={() => navigate(latest ? `/paint/${latest.id}` : "/gallery")}
        >
          <span className="shortcut-symbol">
            <IllustratedIcon name="continue" />
          </span>
          <span>
            <strong>つづきから</strong>
            <small>まえのぬりえを ひらこう</small>
          </span>
          <ArrowRight size={21} />
        </button>
        <button
          type="button"
          className="shortcut shortcut-gallery"
          onClick={() => navigate("/gallery")}
        >
          <span className="shortcut-symbol">
            <IllustratedIcon name="gallery" />
          </span>
          <span>
            <strong>さくひん</strong>
            <small>きみの色が いっぱい</small>
          </span>
          <ArrowRight size={21} />
        </button>
      </nav>
      {services.auth.session?.localOnly && (
        <p className="local-mode-note">
          <Waves size={15} />
          この端末でおためし中 · 作品はこの端末に保存されます
        </p>
      )}
    </main>
  );
}

export function ThemePage({ themeId }: { themeId: string }) {
  const theme = THEMES.find((item) => item.id === themeId);
  const [catalog, setCatalog] = useState<TemplateSummary[] | null>(null),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const { toast } = useApp();
  const captureScope = useAccountScope(services.auth.session?.userId ?? "");
  useEffect(() => {
    let active = true;
    void loadCatalog()
      .then((items) => {
        if (active) setCatalog(items);
      })
      .catch((e) => {
        if (active) setError(errorMessage(e));
      });
    return () => {
      active = false;
    };
  }, []);
  const start = async (template: TemplateSummary) => {
    const scope = captureScope();
    if (busy || !scope.isActive()) return;
    setBusy(true);
    try {
      const drawing = await loadTemplate(template.id);
      if (!scope.isActive()) return;
      const project = await services.projects.create({
        templateId: template.id,
        title: template.title,
        ...(drawing.paintingProfile ? { metadata: { renderer: `storybook-v${drawing.paintingProfile.version}`, paintMode: 'group' } } : {}),
      });
      if (scope.isActive()) navigate(`/paint/${project.id}`);
    } catch (e) {
      if (scope.isActive()) toast(errorMessage(e));
    } finally {
      if (scope.isActive()) setBusy(false);
    }
  };
  if (!theme)
    return (
      <>
        <PageHeader title="しまをえらぶ" />
        <Empty title="ほかのしまへ あそびにいこう">
          <button
            className="button button-primary"
            onClick={() => navigate("/home")}
          >
            しまへもどる
          </button>
        </Empty>
      </>
    );
  const templates = catalog?.filter((item) => item.themeId === theme.id);
  return (
    <main className="theme-page">
      <header className="theme-navigation">
        <h1 className="sr-only">{theme.name}のぬりえ</h1>
        <div className="theme-navigation-start">
          <button className="icon-button" type="button" onClick={()=>navigate('/home')} aria-label="もどる"><ArrowLeft/></button>
          <div className="theme-island-mark" aria-hidden="true"><IslandMenuArt themeId={theme.id} priority/></div>
        </div>
        <button
          type="button"
          className="icon-button"
          aria-label="さくひん"
          onClick={() => navigate("/gallery")}
        >
          <IllustratedIcon name="gallery" />
        </button>
      </header>
      {error ? (
        <div className="inline-error" role="alert">
          {error}
          <button className="button" onClick={() => location.reload()}>
            もういちど
          </button>
        </div>
      ) : !templates ? (
        <Loading />
      ) : templates.length === 0 ? (
        <Empty title="このしまのぬりえは 準備中です">
          <p>ほかのしまにも、すてきな絵があるよ。</p>
          <button
            className="button button-primary"
            onClick={() => navigate("/home")}
          >
            ほかのしまへ
          </button>
        </Empty>
      ) : (
        <div className="template-grid">
          {templates.map((template) => (
            <button
              key={template.id}
              className="template-card"
              type="button"
              disabled={busy}
              onClick={() => {
                void start(template);
              }}
            >
              <div className="template-paper">
                <img
                  src={template.thumbnailUrl}
                  alt=""
                  width="320"
                  height="400"
                />
              </div>
              <span className="template-title">
                {template.title}
                <ChevronRight size={18} />
              </span>
            </button>
          ))}
        </div>
      )}
      <p className="gentle-note">
        <Shell size={18} />
        おなじ絵も、なんどでも。すきな色で あそぼう。
      </p>
      <Footer />
    </main>
  );
}

