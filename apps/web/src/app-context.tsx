import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { createServices } from "@island/persistence";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type Project,
} from "@island/shared";
import { errorMessage } from "./components/UI";
import { stopAudio, unlockAudio, updateAudio } from "./audio";

export const services = createServices({
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
  publishableKey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  demoMode: import.meta.env.VITE_DEMO_MODE === "true",
  development: import.meta.env.DEV,
});
export type Services = typeof services;
interface AppContextValue {
  settings: AppSettings;
  updateSettings: (patch: Partial<AppSettings>) => Promise<void>;
  reloadSettings: () => Promise<void>;
  toast: (message: string) => void;
}
const AppContext = createContext<AppContextValue | null>(null);
export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>({
    ...DEFAULT_SETTINGS,
  });
  const [message, setMessage] = useState("");
  const settingsWrite = useRef(0);
  const durableSettings = useRef(settings), durableEpoch = useRef(0);
  const pendingSettings = useRef(new Map<number, Partial<AppSettings>>());
  const accountGeneration = useRef(0), writeSequence = useRef(0);
  const providerActive = useRef(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const displaySettings = useCallback(() => {
    const next = { ...durableSettings.current };
    for (const patch of pendingSettings.current.values()) Object.assign(next, patch);
    setSettings(next);
  }, []);
  useEffect(() => {
    providerActive.current = true;
    const generation = settingsWrite;
    let alive = true,
      request = 0;
    let loadedUser: string | null | undefined;
    const load = () => {
      if (!alive) return;
      const userId = services.auth.session?.userId ?? null;
      // Token refreshes do not replace the same account's optimistic settings.
      if (loadedUser === userId) return;
      loadedUser = userId;
      ++accountGeneration.current;
      pendingSettings.current.clear();
      const current = ++request,
        write = ++settingsWrite.current;
      clearTimeout(timer.current);
      setMessage("");
      durableSettings.current = { ...DEFAULT_SETTINGS };
      ++durableEpoch.current;
      displaySettings();
      if (!userId) {
        return;
      }
      void services.settings
        .get()
        .then((next) => {
          if (
            alive &&
            current === request &&
            write === settingsWrite.current &&
            services.auth.session?.userId === userId
          ) {
            durableSettings.current = next;
            ++durableEpoch.current;
            displaySettings();
          }
        })
        .catch((error) => {
          if (
            alive &&
            current === request &&
            write === settingsWrite.current &&
            services.auth.session?.userId === userId
          )
            setMessage(errorMessage(error));
        });
    };
    void services.ready.then(load).catch((error) => {
      if (alive) setMessage(errorMessage(error));
    });
    const unsubscribe = services.auth.subscribe(load);
    const unsubscribeSettings = services.settings.subscribe((next, userId) => {
      if (!alive || userId !== loadedUser || services.auth.session?.userId !== userId) return;
      ++settingsWrite.current;
      durableSettings.current = next;
      ++durableEpoch.current;
      displaySettings();
    });
    return () => {
      alive = false;
      providerActive.current = false;
      ++generation.current;
      unsubscribe();
      unsubscribeSettings();
      clearTimeout(timer.current);
    };
  }, [displaySettings]);
  const toast = useCallback((text: string) => {
    if (!providerActive.current) return;
    clearTimeout(timer.current);
    setMessage(text);
    timer.current = setTimeout(() => setMessage(""), 6000);
  }, []);
  const reloadSettings = useCallback(async () => {
    const write = ++settingsWrite.current;
    const userId = services.auth.session?.userId;
    if (!providerActive.current || !userId) return;
    const next = await services.settings.get();
    if (
      providerActive.current &&
      write === settingsWrite.current &&
      services.auth.session?.userId === userId
    ) {
      durableSettings.current = next;
      ++durableEpoch.current;
      displaySettings();
    }
  }, [displaySettings]);
  useEffect(() => {
    updateAudio(settings);
  }, [settings]);
  useEffect(() => {
    const visibility = () => {
      if (document.visibilityState === "hidden") stopAudio();
    };
    document.addEventListener("visibilitychange", visibility);
    return () => {
      document.removeEventListener("visibilitychange", visibility);
      stopAudio();
    };
  }, []);
  const updateSettings = async (patch: Partial<AppSettings>) => {
    const userId = services.auth.session?.userId;
    if (!providerActive.current || !userId) return;
    const account = accountGeneration.current, write = ++writeSequence.current, epoch = durableEpoch.current;
    // Optimistic input does not invalidate the first stored-settings read. Its
    // base can still arrive (or rescue a failed write), with pending patches overlaid.
    pendingSettings.current.set(write, patch);
    displaySettings();
    try {
      const saved = await services.settings.set(patch);
      if (providerActive.current && account === accountGeneration.current && services.auth.session?.userId === userId) {
        pendingSettings.current.delete(write);
        // The commit subscription normally supplies the authoritative value first.
        // A later commit/read must never be replaced by this older completion.
        if (epoch === durableEpoch.current) { durableSettings.current = saved; ++durableEpoch.current; ++settingsWrite.current; }
        displaySettings();
      }
    } catch (error) {
      if (
        providerActive.current &&
        account === accountGeneration.current &&
        services.auth.session?.userId === userId
      ) {
        pendingSettings.current.delete(write);
        displaySettings();
        toast(errorMessage(error));
      }
    }
  };
  return (
    <AppContext.Provider
      value={{ settings, updateSettings, reloadSettings, toast }}
    >
      <div
        className={settings.reducedMotion ? "app reduced-motion" : "app"}
        onPointerDown={() => unlockAudio(settings)}
      >
        {children}
      </div>
      <div
        className={`toast ${message ? "toast-visible" : ""}`}
        role="status"
        aria-live="polite"
      >
        {message}
      </div>
    </AppContext.Provider>
  );
}
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppProvider is required");
  return ctx;
}
export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [unreadableCount, setUnreadableCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let alive = true,
      request = 0;
    const update = () => {
      const current = ++request;
      const userId = services.auth.session?.userId;
      void services.projects
        .list()
        .then((list) => {
          if (
            alive &&
            current === request &&
            services.auth.session?.userId === userId
          ) {
            setProjects(list);
            setUnreadableCount(services.recovery?.count ?? 0);
            setLoading(false);
            setError("");
          }
        })
        .catch((e) => {
          if (
            alive &&
            current === request &&
            services.auth.session?.userId === userId
          ) {
            setError(errorMessage(e));
            setLoading(false);
          }
        });
    };
    update();
    const unsubscribe = services.projects.subscribe(update);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);
  return { projects, loading, error, unreadableCount };
}
