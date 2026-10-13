import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ChevronRight,
  Download,
  ExternalLink,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import type { AppSettings } from "@island/shared";
import { services, useApp, useProjects } from "../app-context";
import {
  Footer,
  Modal,
  PageHeader,
  downloadBlob,
  errorMessage,
  navigate,
} from "../components/UI";
import { unlockAudio, updateAudio } from "../audio";
import { useAccountScope, type AccountScope } from "../use-account-scope";
import { UnreadableWorksPanel } from '../components/UnreadableWorks';

type LegalPage = "privacy" | "terms" | "oss" | "contact";
function Toggle({
  label,
  detail,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  detail?: string;
  checked: boolean;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={`setting-row toggle-row ${disabled ? "setting-disabled" : ""}`}
    >
      <span>
        <strong>{label}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <input
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        disabled={disabled}
      />
      <span className="switch-track" aria-hidden="true">
        <span />
      </span>
    </label>
  );
}
function SettingSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="settings-section">
      <h2>{title}</h2>
      <div className="settings-card">{children}</div>
    </section>
  );
}
function Legal({ page, onClose }: { page: LegalPage; onClose: () => void }) {
  const [licenses, setLicenses] = useState<
      Array<{ name: string; version: string; license: string; url?: string }>
    >([]),
    [text, setText] = useState(""),
    [status, setStatus] = useState("");
  useEffect(() => {
    if (page !== "oss") return;
    const abort = new AbortController();
    void fetch("/legal/oss.json", { signal: abort.signal })
      .then((response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<typeof licenses>;
      })
      .then(setLicenses)
      .catch((error) => {
        if (!abort.signal.aborted) setStatus(errorMessage(error));
      });
    return () => abort.abort();
  }, [page]);
  const title = {
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    oss: "OSSライセンス",
    contact: "問い合わせ",
  }[page];
  const contactEmail = import.meta.env.VITE_CONTACT_EMAIL as string | undefined;
  return (
    <Modal title={title} onClose={onClose} wide>
      <div className="legal-content">
        {page === "privacy" ? (
          <>
            <p>
              キッズ塗り絵アイランドは、あなたの作品を保存し、あなたの端末で楽しむためのアプリです。作品やプロフィールをほかの利用者へ公開する機能はありません。
            </p>
            <h3>保存する情報</h3>
            <p>
              ログインにはGoogleとSupabase
              Authを使用します。アプリは認証サービスのユーザーID、作品の色や画材・背景・フレーム、保存日時、作品サムネイルを保存します。メールアドレスを独自のプロフィール表に複製しません。
            </p>
            <h3>この端末とクラウド</h3>
            <p>
              作品はこの端末のIndexedDBへ保存し、ネット接続時にSupabaseへ同期します。ブラウザのデータを消すと、この端末だけに保存された未同期作品は消えます。設定からバックアップを保存できます。おためしモードではクラウドに送信しません。
            </p>
            <h3>音声・解析・広告</h3>
            <p>
              広告、アクセス解析、行動追跡はありません。色名の読み上げは端末の音声機能を使います。アプリから外部の音声APIへ文章を送信しません。
            </p>
            <h3>データの管理</h3>
            <p>
              作品を個別に削除したり、設定の「データ削除」から全作品と関連データを削除できます。保存や削除でネット接続が必要な場合は画面に表示します。問い合わせは設定の「問い合わせ」から行えます。
            </p>
            <p className="muted">2026年10月6日版</p>
          </>
        ) : page === "terms" ? (
          <>
            <p>
              キッズ塗り絵アイランドは無料で利用できます。広告や課金、投稿や交流の機能はありません。
            </p>
            <h3>作品について</h3>
            <p>
              作成した作品はPNGやバックアップとして保存できます。アプリに用意された線画は本アプリでの塗り絵と完成作品の利用のために提供しています。元の線画を集めて再配布する行為や、他者の権利を侵害する利用はお控えください。
            </p>
            <h3>アカウントと保存</h3>
            <p>
              Googleのアカウントでログインします。1アカウントにつき、途中と完成をあわせて500作品まで保存できます。古い作品を自動で削除することはありません。
            </p>
            <p>
              通信障害や端末の容量不足により、保存や同期が一時的にできないことがあります。画面の保存状態を確認し、大切な作品はバックアップをお持ちください。
            </p>
            <h3>サービスの変更</h3>
            <p>
              不具合の修正や使いやすさの改善のため、アプリを更新することがあります。作品の管理と削除方法は設定から確認できます。
            </p>
            <p className="muted">2026年10月6日版</p>
          </>
        ) : page === "oss" ? (
          <>
            <p>
              このアプリは、次のオープンソースソフトウェアを利用しています。
            </p>
            <a
              className="button"
              href="/legal/third-party-notices.txt"
              download
            >
              <Download size={18} />
              ライセンス全文を保存
            </a>
            {status && <p role="alert">{status}</p>}
            <ul className="license-list">
              {licenses.map((item) => (
                <li key={`${item.name}@${item.version}`}>
                  <strong>{item.name}</strong>
                  <span>
                    {item.version} · {item.license}
                  </span>
                  {item.url && (
                    <a href={item.url} target="_blank" rel="noreferrer">
                      配布元
                      <ExternalLink size={13} />
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <p>気になったことや、うまく動かないところを教えてください。</p>
            <label className="contact-label">
              お問い合わせの内容
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={6}
                maxLength={4000}
              />
            </label>
            <p className="muted">
              パスワードやログイン用のコードは書かないでください。
            </p>
            <div className="dialog-actions">
              <button
                className="button"
                disabled={!text.trim()}
                onClick={() => {
                  void downloadBlob(
                    new Blob(
                      [
                        `キッズ塗り絵アイランド お問い合わせ\nバージョン: 1.0.0\n\n${text}`,
                      ],
                      { type: "text/plain;charset=utf-8" },
                    ),
                    "ぬりえアイランド-お問い合わせ.txt",
                  );
                  setStatus("お問い合わせの内容を保存しました。");
                }}
              >
                内容をファイルに保存
              </button>
              {contactEmail &&
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail) && (
                  <a
                    className="button button-primary"
                    href={`mailto:${contactEmail}?subject=${encodeURIComponent("キッズ塗り絵アイランドへの問い合わせ")}&body=${encodeURIComponent(text)}`}
                  >
                    メールをひらく
                  </a>
                )}
            </div>
            {status && <p role="status">{status}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}
export default function SettingsPage() {
  const { settings, updateSettings, toast } = useApp();
  const ownerId = services.auth.session?.userId ?? "";
  const captureScope = useAccountScope(ownerId);
  const { projects, unreadableCount = 0 } = useProjects();
  const [sync, setSync] = useState(services.sync.status),
    [usage, setUsage] = useState<number | null>(null),
    [busy, setBusy] = useState(false);
  const [legal, setLegal] = useState<LegalPage | null>(null),
    [deleteData, setDeleteData] = useState(false),
    [deleteConfirm, setDeleteConfirm] = useState(false),
    [logout, setLogout] = useState(false),
    [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [japaneseVoice, setJapaneseVoice] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const restoreButton = useRef<HTMLButtonElement>(null);
  const restoreScope = useRef<AccountScope | null>(null);
  useEffect(() => {
    const input = fileInput.current;
    const cancel = () => {
      const scope = restoreScope.current;
      restoreScope.current = null;
      if (scope?.isActive()) restoreButton.current?.focus();
    };
    input?.addEventListener("cancel", cancel);
    return () => input?.removeEventListener("cancel", cancel);
  }, []);
  useEffect(
    () => services.sync.subscribe(() => setSync({ ...services.sync.status })),
    [],
  );
  useEffect(() => {
    let active = true;
    if (navigator.storage?.estimate)
      void navigator.storage
        .estimate()
        .then((result) => {
          if (active) setUsage(result.usage ?? null);
        })
        .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [projects.length]);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const voices = () =>
      setJapaneseVoice(
        window.speechSynthesis
          .getVoices()
          .some((voice) => /^ja(?:-|$)/i.test(voice.lang)),
      );
    voices();
    window.speechSynthesis.addEventListener("voiceschanged", voices);
    return () =>
      window.speechSynthesis.removeEventListener("voiceschanged", voices);
  }, []);
  const change = (patch: Partial<AppSettings>) => {
    if (!captureScope().isActive()) return;
    const next = { ...settings, ...patch };
    unlockAudio(next);
    updateAudio(next);
    void updateSettings(patch);
  };
  const action = async (fn: (scope: AccountScope) => Promise<void>) => {
    const scope = captureScope();
    if (busy || !scope.isActive()) return;
    setBusy(true);
    try {
      await fn(scope);
    } catch (e) {
      if (scope.isActive()) toast(errorMessage(e));
    } finally {
      if (scope.isActive()) setBusy(false);
    }
  };
  return (
    <main className="settings-page">
      <PageHeader title="設定" />
      <SettingSection title="音・動き">
        <Toggle
          label="効果音"
          detail="色をぬったときなどの音"
          checked={settings.soundEffects}
          onChange={(soundEffects) => change({ soundEffects })}
        />
        <Toggle
          label="BGM"
          detail="ゆったりした音楽"
          checked={settings.bgm}
          onChange={(bgm) => change({ bgm })}
        />
        <label className="setting-row volume-row">
          <span>
            <strong>音量</strong>
            <small>{Math.round(settings.volume * 100)}%</small>
          </span>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={Math.round(settings.volume * 100)}
            onChange={(event) =>
              change({ volume: Number(event.target.value) / 100 })
            }
          />
        </label>
        <Toggle
          label="演出をひかえめにする"
          checked={settings.reducedMotion}
          onChange={(reducedMotion) => change({ reducedMotion })}
        />
      </SettingSection>
      <SettingSection title="操作">
        <Toggle
          label="色の名前を読み上げる"
          detail={
            japaneseVoice
              ? "色をえらんだときに読み上げます"
              : "この端末では日本語の音声を利用できません"
          }
          checked={settings.speakColors}
          disabled={!japaneseVoice}
          onChange={(speakColors) => change({ speakColors })}
        />
        <Toggle
          label="タップ操作の補助"
          detail="線の近くをタップしても、ぬりやすくします"
          checked={settings.tapAssist}
          onChange={(tapAssist) => change({ tapAssist })}
        />
      </SettingSection>
      <SettingSection title="作品・データ">
        <div className="setting-row">
          <strong>作品数</strong>
          <span>{projects.length + unreadableCount} / 500作品</span>
        </div>
        <div className="setting-row">
          <span>
            <strong>使用容量</strong>
            <small>この端末のアプリデータ</small>
          </span>
          <span>
            {usage === null
              ? "計測できません"
              : usage < 1048576
                ? `${Math.max(1, Math.round(usage / 1024))} KB`
                : `${(usage / 1048576).toFixed(1)} MB`}
          </span>
        </div>
        <div className="setting-row">
          <span>
            <strong>同期状態</strong>
            <small>
              {services.auth.session?.localOnly
                ? "この端末に保存しています"
                : sync.unsyncedCount > 0
                  ? `未同期の作品が${sync.unsyncedCount}件あります`
                  : "すべての作品を保存しています"}
            </small>
            {sync.error && <small className="danger">{sync.error}</small>}
          </span>
          <ShieldCheck size={22} />
        </div>
        <button
          className="setting-row setting-button"
          type="button"
          disabled={busy || services.auth.session?.localOnly}
          onClick={() => {
            void action(async (scope) => {
              await services.sync.flush();
              if (scope.isActive() && services.sync.status.state === "idle")
                toast("保存を確認しました");
            });
          }}
        >
          <span>
            <RefreshCw size={19} />
            今すぐ同期
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          className="setting-row setting-button"
          type="button"
          disabled={busy}
          onClick={() => {
            void action(async (scope) => {
              const blob = await services.backup.export();
              if (!scope.isActive()) return;
              await downloadBlob(
                blob,
                `ぬりえアイランド-${new Date().toISOString().slice(0, 10)}.json`,
              );
              if (scope.isActive()) toast(services.recovery.count ? '読み取れる作品を保存しました。元データは「読み取れない作品」から別に保存できます。' : "バックアップを保存しました");
            });
          }}
        >
          <span>
            <Download size={19} />
            バックアップ
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          className="setting-row setting-button"
          type="button"
          disabled={busy}
          ref={restoreButton}
          onClick={() => {
            const scope = captureScope();
            if (!scope.isActive()) return;
            restoreScope.current = scope;
            fileInput.current?.click();
          }}
        >
          <span>
            <Upload size={19} />
            復元
          </span>
          <ChevronRight size={18} />
        </button>
        <input
          ref={fileInput}
          hidden
          tabIndex={-1}
          aria-label="バックアップファイル"
          type="file"
          accept="application/json,.json"
          onChange={(event) => {
            const scope = restoreScope.current ?? captureScope();
            restoreScope.current = null;
            const file = event.target.files?.[0] ?? null;
            event.target.value = "";
            if (!scope.isActive()) return;
            restoreButton.current?.focus();
            setRestoreFile(file);
          }}
        />
      </SettingSection>
      <UnreadableWorksPanel />
      <SettingSection title="アカウント">
        <div className="setting-row">
          <span>
            <strong>現在の連携アカウント</strong>
            <small>
              {services.auth.session?.localOnly
                ? "この端末でおためし中"
                : services.auth.session?.provider === "google"
                  ? "Google"
                  : services.auth.session?.provider}
              {services.auth.session?.displayName &&
                ` · ${services.auth.session.displayName}`}
            </small>
          </span>
        </div>
        <button
          className="setting-row setting-button"
          type="button"
          onClick={() => setLogout(true)}
        >
          <span>
            <LogOut size={19} />
            ログアウト
          </span>
          <ChevronRight size={18} />
        </button>
        <button
          className="setting-row setting-button danger"
          type="button"
          onClick={() => {
            setDeleteConfirm(false);
            setDeleteData(true);
          }}
        >
          <span>
            <Trash2 size={19} />
            データ削除
          </span>
          <ChevronRight size={18} />
        </button>
      </SettingSection>
      <SettingSection title="このアプリについて">
        {(
          [
            ["privacy", "プライバシーポリシー"],
            ["terms", "利用規約"],
            ["oss", "OSSライセンス"],
            ["contact", "問い合わせ"],
          ] as const
        ).map(([id, label]) => (
          <button
            className="setting-row setting-button"
            key={id}
            type="button"
            onClick={() => setLegal(id)}
          >
            <span>{label}</span>
            <ChevronRight size={18} />
          </button>
        ))}
        <div className="setting-row">
          <span className="muted">キッズ塗り絵アイランド</span>
          <span className="muted">1.0.0</span>
        </div>
      </SettingSection>
      <Footer />
      {legal && <Legal page={legal} onClose={() => setLegal(null)} />}
      {restoreFile && (
        <Modal
          title="バックアップを復元しますか？"
          onClose={() => setRestoreFile(null)}
        >
          <p>保存中の作品を残して、バックアップの作品を追加します。</p>
          <p className="muted">{restoreFile.name}</p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setRestoreFile(null)}>
              やめる
            </button>
            <button
              className="button button-primary"
              disabled={busy}
              onClick={() => {
                void action(async (scope) => {
                  const count = await services.backup.import(restoreFile);
                  if (!scope.isActive()) return;
                  setRestoreFile(null);
                  toast(`${count}作品を復元しました`);
                });
              }}
            >
              復元する
            </button>
          </div>
        </Modal>
      )}
      {logout && (
        <Modal title="ログアウトしますか？" onClose={() => setLogout(false)}>
          <p>
            {sync.unsyncedCount > 0
              ? "まだ同期していない作品は、この端末に残ります。同じアカウントでログインすると続きから使えます。"
              : "作品は保存されています。同じアカウントでログインすると、また使えます。"}
          </p>
          <div className="dialog-actions">
            <button className="button" onClick={() => setLogout(false)}>
              やめる
            </button>
            <button
              className="button button-primary"
              disabled={busy}
              onClick={() => {
                void action(async (scope) => {
                  await services.auth.signOut();
                  if (scope.isActive()) navigate("/home");
                });
              }}
            >
              ログアウト
            </button>
          </div>
        </Modal>
      )}
      {deleteData && (
        <Modal
          title="すべてのデータを削除しますか？"
          onClose={() => setDeleteData(false)}
        >
          <p>
            途中の作品と完成作品、サムネイル、設定をすべて削除します。削除したデータは元にもどせません。
          </p>
          <label className="confirm-check">
            <input
              type="checkbox"
              checked={deleteConfirm}
              onChange={(event) => setDeleteConfirm(event.target.checked)}
            />
            すべてのデータを削除することを確認しました
          </label>
          <div className="dialog-actions">
            <button className="button" onClick={() => setDeleteData(false)}>
              やめる
            </button>
            <button
              className="button button-danger"
              disabled={!deleteConfirm || busy}
              onClick={() => {
                void action(async (scope) => {
                  await services.deleteAccountData(ownerId);
                  if (!scope.isActive()) return;
                  toast("データを削除しました");
                  navigate("/home");
                });
              }}
            >
              すべて削除する
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
