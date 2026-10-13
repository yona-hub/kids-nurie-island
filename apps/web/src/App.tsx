import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";
import { CloudOff, RefreshCw, Waves } from "lucide-react";
import { AppProvider, services } from "./app-context";
import { Loading, errorMessage, navigate } from "./components/UI";
import { Brand } from "./components/Brand";
import { GoogleSignInButton } from "./components/GoogleSignInButton";
import { DeletionRecoveryNotice } from "./components/DeletionRecoveryNotice";
import { HomePage, ThemePage } from "./pages/Home";
import { getUpdateNotice } from './pwa-updates';
import { GuardedRouteProvider, useGuardedRoute } from './guarded-route';
import { invalidateNavigation, navigationAllowsUpdate, readNavigationSafety } from './navigation';

const Editor = lazy(() => import("./pages/Editor"));
const Gallery = lazy(() => import("./pages/Gallery"));
const Settings = lazy(() => import("./pages/Settings"));
function SyncBanner() {
  const [status, setStatus] = useState(services.sync.status);
  useEffect(
    () => services.sync.subscribe(() => setStatus({ ...services.sync.status })),
    [],
  );
  if (status.localSaveFailed)
    return (
      <aside className="sync-banner sync-error" role="alert">
        <CloudOff size={17} />
        <span>
          この端末に保存できていません。画面を閉じずに、保存をやりなおしてください。
        </span>
      </aside>
    );
  if (status.state === "idle" && !status.notice) return null;
  return (
    <aside
      className={`sync-banner sync-${status.state}`}
      role="status"
      aria-live="polite"
    >
      {status.state === "syncing" ? (
        <>
          <RefreshCw size={16} className="spin" />
          保存しています…
        </>
      ) : status.notice ? (
        <span>{status.notice}</span>
      ) : (
        <>
          <CloudOff size={17} />
          <span>
            この端末に保存済みです
            <span className="sync-detail">
              {status.state === "offline"
                ? "ネット接続後に自動で同期します"
                : "同期できていません"}
            </span>
          </span>
          {status.state === "error" && (
            <button
              type="button"
              onClick={() => {
                void services.sync.flush();
              }}
            >
              再試行
            </button>
          )}
        </>
      )}
    </aside>
  );
}
function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const local = services.auth.localOnlyMode;
  const signIn = async () => {
    setBusy(true);
    try {
      await services.auth.signIn(local ? "demo" : "google");
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };
  return (
    <main className="login-page">
      <div className="login-card">
        <Brand />
        <span className="eyebrow">COLOR YOUR LITTLE WORLD</span>
        <h1>
          きみだけの色で、
          <br />
          せかいをつくろう。
        </h1>
        <p>作品を保存するため、ログインしてください</p>
        {services.auth.configurationError ? (
          <div className="inline-error">{services.auth.configurationError}</div>
        ) : !local ? (
          <GoogleSignInButton busy={busy} onSignIn={() => { void signIn(); }} />
        ) : (
          <button
            className="button button-primary login-button"
            type="button"
            onClick={() => {
              void signIn();
            }}
            disabled={busy}
          >
            <Waves />
            この端末でためす
          </button>
        )}
        {error && (
          <p className="inline-error" role="alert">
            {error}
          </p>
        )}
        {local && (
          <p className="muted">おためし中の作品は、この端末に保存されます。</p>
        )}
        <p className="login-fineprint">
          広告や課金はありません。
          <br />
          じぶんのペースで、好きな色を。
        </p>
      </div>
    </main>
  );
}
function Shell() {
  const { route, blocked } = useGuardedRoute();
  const [ready, setReady] = useState(false),
    [failure, setFailure] = useState("");
  const accountGeneration = useRef(0);
  const [account, setAccount] = useState(() => ({ session: services.auth.session, generation: 0 }));
  const session = account.session;
  const [updateNotice, setUpdateNotice] = useState(getUpdateNotice);
  const updateRequest = useRef(0);
  const [updateBusy, setUpdateBusy] = useState(false);
  useEffect(() => {
    updateRequest.current++;
    setUpdateBusy(false);
  }, [route, blocked]);
  useEffect(() => {
    let active = true;
    let priorUserId = services.auth.session?.userId;
    const unsubscribe = services.auth.subscribe(() => {
      const next = services.auth.session;
      if (next?.userId !== priorUserId) {
        // Count notifications immediately, even when React batches A -> B -> A.
        accountGeneration.current++;
        updateRequest.current++;
        setUpdateBusy(false);
        invalidateNavigation();
      }
      setAccount({ session: next, generation: accountGeneration.current });
      if (priorUserId && !next) navigate("/home");
      priorUserId = next?.userId;
    });
    void services.ready
      .then(() => {
        if (active) {
          setAccount({ session: services.auth.session, generation: accountGeneration.current });
          setReady(true);
        }
      })
      .catch((error) => {
        if (active) setFailure(errorMessage(error));
      });
    const visibility = () => {
      if (document.visibilityState === "hidden") void services.sync.flush();
    };
    document.addEventListener("visibilitychange", visibility);
    const update = () => setUpdateNotice(getUpdateNotice());
    window.addEventListener("island-update-ready", update);
    update();
    return () => {
      active = false;
      unsubscribe();
      document.removeEventListener("visibilitychange", visibility);
      window.removeEventListener("island-update-ready", update);
    };
  }, []);
  if (failure)
    return (
      <main className="error-page">
        <Brand />
        <h1>読みこみをやりなおしましょう</h1>
        <p role="alert">{failure}</p>
        <button
          className="button button-primary"
          onClick={() => location.reload()}
        >
          もういちど開く
        </button>
        {import.meta.env.VITE_SUPABASE_URL && (
          <button
            className="button"
            onClick={() => {
              void services.auth
                .signIn("google")
                .catch((error) => setFailure(errorMessage(error)));
            }}
          >
            Googleでログインしなおす
          </button>
        )}
      </main>
    );
  if (!ready) return <Loading />;
  if (!session) return <Login />;
  const [page, id] = route.replace(/^\//, "").split("/");
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
        onClick={(event) => {
          event.preventDefault();
          document.getElementById("main-content")?.focus();
        }}
      >
        本文へ
      </a>
      <div className="sea-decoration sea-decoration-left" aria-hidden="true" />
      <div className="sea-decoration sea-decoration-right" aria-hidden="true" />
      <SyncBanner />
      <div
        key={`${session.userId}:${account.generation}`}
        id="main-content"
        tabIndex={-1}
        inert={blocked}
        className={`app-content ${page === "paint" ? "app-content-editor" : ""}`}
      >
        <Suspense fallback={<Loading />}>
          {page === "theme" && id ? (
            <ThemePage themeId={id} />
          ) : page === "paint" && id ? (
            <Editor projectId={id} />
          ) : page === "gallery" || page === "art" ? (
            <Gallery projectId={page === "art" ? id : undefined} />
          ) : page === "settings" ? (
            <Settings />
          ) : (
            <HomePage />
          )}
        </Suspense>
      </div>
      {updateNotice && page === "home" && (
        <div className="update-notice">
          <span role="status">{updateNotice}</span>
          <button
            type="button"
            disabled={updateBusy}
            onClick={async () => {
              if (!navigationAllowsUpdate() || services.sync.status.localSaveFailed) return;
              const request = ++updateRequest.current;
              const generation = readNavigationSafety().generation;
              setUpdateBusy(true);
              try {
                await services.sync.flush();
                if (request !== updateRequest.current || generation !== readNavigationSafety().generation ||
                  !navigationAllowsUpdate() || services.sync.status.localSaveFailed) return;
                window.dispatchEvent(new CustomEvent('island-apply-update', { detail: { generation } }));
              } catch (error) {
                if (request === updateRequest.current) setUpdateNotice(errorMessage(error));
              } finally {
                if (request === updateRequest.current) setUpdateBusy(false);
              }
            }}
          >
            更新する
          </button>
          <button type="button" onClick={() => { updateRequest.current++; setUpdateBusy(false); setUpdateNotice(null); }}>
            あとで
          </button>
        </div>
      )}
    </>
  );
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Application error", error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <main className="error-page">
        <Brand />
        <h1>画面を開きなおしましょう</h1>
        <p>この端末に保存した作品は、次に開いたときにも使えます。</p>
        <button
          className="button button-primary"
          onClick={() => {
            navigate("/home");
            location.reload();
          }}
        >
          ホームを開く
        </button>
      </main>
    ) : (
      this.props.children
    );
  }
}
export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <DeletionRecoveryNotice recovery={services.deletionRecovery} />
        <GuardedRouteProvider><Shell /></GuardedRouteProvider>
      </AppProvider>
    </ErrorBoundary>
  );
}
