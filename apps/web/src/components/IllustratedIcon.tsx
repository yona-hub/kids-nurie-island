import { UI_ART, type UiArtId } from '../ui-art';

/** Labels and interaction stay on the actual control, independent of the bitmap. */
export function IllustratedIcon({ name, className = '' }: { name: UiArtId; className?: string }) {
  const asset = UI_ART[name];
  return <img className={`illustrated-icon ${className}`} src={asset.src} width={asset.width} height={asset.height} alt="" aria-hidden="true" draggable={false} decoding="async" />;
}
