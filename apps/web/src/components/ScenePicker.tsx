import type { SceneAsset } from "@island/shared";
import { Check } from "lucide-react";
import { Modal } from "./UI";
export function ScenePicker({
  kind,
  items,
  selectedId,
  busy,
  onSelect,
  onClose,
}: {
  kind: "background" | "frame";
  items: SceneAsset[];
  selectedId: string;
  busy: boolean;
  onSelect: (item: SceneAsset) => void;
  onClose: () => void;
}) {
  return (
    <Modal
      title={
        kind === "background" ? "はいけいを えらぼう" : "かざりわくを えらぼう"
      }
      onClose={onClose}
      wide
    >
      <div className="scene-grid">
        {items.map((item) => (
          <button
            className={`scene-choice ${item.id === selectedId ? "is-selected" : ""}`}
            type="button"
            aria-pressed={item.id === selectedId}
            key={item.id}
            onClick={() => onSelect(item)}
            disabled={busy}
          >
            <span className="scene-preview">
              <img
                src={item.thumbnailUrl || item.assetUrl}
                alt=""
                loading="lazy"
                width="160"
                height="200"
              />
              {item.id === selectedId && (
                <span className="choice-check">
                  <Check size={16} />
                </span>
              )}
            </span>
            <span>{item.name}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}
