import {constructionIsland} from '../construction-island';
import {useId} from 'react';
import {THEMES} from '@island/content';
import {IllustratedIcon} from './IllustratedIcon';
export function IslandMark({ className = "" }: { className?: string }) {
  return <IllustratedIcon name="brand-island" className={className} />;
}
export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`brand ${compact ? "brand-compact" : ""}`}
      role="img" aria-label="キッズ塗り絵アイランド"
    >
      <IslandMark className="brand-mark" />
      <span className="brand-words" aria-hidden="true">
        <span className="brand-small">
          キッズ<span>塗り絵</span>
        </span>
        <span className="brand-large">
          アイランド<span className="brand-dot">●</span>
        </span>
      </span>
    </span>
  );
}

export function IslandArt({ theme, priority = false }: { theme: string; priority?: boolean }) {
  return (
    <img
      className="island-art"
      src={theme==='construction'?constructionIsland.src:`/images/islands/${theme}-v1.webp`}
      srcSet={theme==='construction'?constructionIsland.srcSet:`/images/islands/${theme}-v1-tiny.webp 192w, /images/islands/${theme}-v1-small.webp 384w, /images/islands/${theme}-v1.webp 768w`}
      sizes="(max-width: 767px) calc(50vw - 31px), (max-width: 1199px) calc(50vw - 52px), 290px"
      width="768"
      height="512"
      alt=""
      aria-hidden="true"
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={priority ? "high" : "low"}
      draggable={false}
    />
  );
}

/** Shared illustrated lettering; navigation semantics belong to the container. */
export function IslandMenuArt({themeId,priority=false}:{themeId:string;priority?:boolean}){
  const labelId=useId(),index=THEMES.findIndex(t=>t.id===themeId),theme=THEMES[index];
  if(!theme)return null;
  return <div className="island-sky">
    <IslandArt theme={theme.id} priority={priority}/>
    <svg className="island-lettering" viewBox="0 0 320 250" aria-hidden="true">
      <defs><path id={labelId} d={index%2?'M35 210 Q160 187 285 207':'M35 207 Q160 188 285 211'}/></defs>
      <text textAnchor="middle" fill={theme.color} stroke="#fffdf5" strokeWidth="7" paintOrder="stroke fill" fontSize={theme.name.length>6?25:30} fontWeight="800" letterSpacing="1.5"><textPath href={`#${labelId}`} startOffset="50%">{theme.name}</textPath></text>
      <text x={index%2?49:274} y="200" fill={theme.color} fontSize="18" stroke="#fffdf5" strokeWidth="3" paintOrder="stroke fill">✧</text>
    </svg>
  </div>;
}
