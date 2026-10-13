import { useEffect, useId, useRef, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { Brand, IslandMark } from "./Brand";

export { navigate } from '../navigation';
import { navigate } from '../navigation';
export function PageHeader({
  title,
  back = "/home",
  children,
}: {
  title: string;
  back?: string;
  children?: ReactNode;
}) {
  return (
    <header className="page-header">
      <button
        type="button"
        className="icon-button"
        aria-label="もどる"
        onClick={() => navigate(back)}
      >
        <ArrowLeft />
      </button>
      <h1>{title}</h1>
      <div className="header-actions">{children}</div>
    </header>
  );
}
export function Loading({ text = "よみこんでいます…" }: { text?: string }) {
  return (
    <div className="loading-state" role="status">
      <IslandMark className="loading-island" />
      <p>{text}</p>
    </div>
  );
}
export function Empty({
  title,
  children,
}: {
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <IslandMark />
      <h2>{title}</h2>
      {children}
    </div>
  );
}
export function Modal({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const el = ref.current;
    const selector =
      'button:not(:disabled),a[href],input:not(:disabled),select,textarea,[tabindex="0"]';
    (el?.querySelector<HTMLElement>(selector) ?? el)?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        closeRef.current();
      }
      if (event.key === "Tab" && el) {
        const items = Array.from(
          el.querySelectorAll<HTMLElement>(selector),
        ).filter((item) => item.getClientRects().length > 0);
        const first = items[0],
          last = items.at(-1);
        if (!first) {
          event.preventDefault();
          el.focus();
        } else if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", key);
      document.body.style.overflow = oldOverflow;
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onPointerDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={`modal ${wide ? "modal-wide" : ""}`}
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <div className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button
            className="icon-button"
            type="button"
            onClick={onClose}
            aria-label="とじる"
          >
            <X />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
export function Footer() {
  return (
    <footer className="app-footer">
      <Brand compact />
      <span>きみだけの色で、せかいをつくろう</span>
    </footer>
  );
}
export async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
export const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "うまくいきませんでした。もういちどおためしください。";
