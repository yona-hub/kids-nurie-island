import type { Point, RegionPaint, RegionPaints, Template } from '../../shared-types/src/index';
import { ColoringEngine as LegacyEngine, type EngineOptions } from './engine';
import type { EngineCanvas } from './canvas';
import { StorybookEngine, type StorySceneUpdate } from './storybook-engine';
import { StorybookEngineV2 } from './storybook-v2-engine';
import type { MediumImages } from './storybook-texture';
import type { Viewport } from './geometry';
import { isComposedScene } from './storybook-scene';

/** Version dispatch keeps saved legacy projects on their original rendering rules. */
export class ColoringEngine {
  private active: LegacyEngine | StorybookEngine | StorybookEngineV2;
  private version=1;
  constructor(readonly canvas:EngineCanvas,private options:EngineOptions={}){this.active=new LegacyEngine(canvas,options);}
  loadTemplate(t:Template,p:RegionPaints={}){
    const version=t.paintingProfile?.version??1;
    if(version!==this.version){this.active.dispose();this.active=version>=3?new StorybookEngine(this.canvas,this.options):version===2?new StorybookEngineV2(this.canvas,this.options):new LegacyEngine(this.canvas,this.options);this.version=version;}
    this.active.loadTemplate(t,p);
  }
  setScene(u:StorySceneUpdate){
    if(this.active instanceof StorybookEngine||this.active instanceof StorybookEngineV2)this.active.setScene(u);
    else {
      if((u.background&&isComposedScene(u.background))||(u.frame&&isComposedScene(u.frame)))throw new Error('この作品には元の背景を使用してください。');
      this.active.setScene(u as Parameters<LegacyEngine['setScene']>[0]);
    }
  }
  setMediumImages(images:MediumImages){if(this.active instanceof StorybookEngine||this.active instanceof StorybookEngineV2)this.active.setMediumImages(images);}
  setViewport(view:Viewport){if(this.active instanceof StorybookEngine||this.active instanceof StorybookEngineV2)this.active.setViewport(view);}
  resize(w:number,h:number,dpr?:number){this.active.resize(w,h,dpr);}
  paint(id:string,p:RegionPaint|null,point?:Point,reduced=false){this.active.paint(id,p,point,reduced);}
  paintMany(ids:readonly string[],p:RegionPaint|null,point?:Point,reduced=false){if(this.active instanceof StorybookEngine||this.active instanceof StorybookEngineV2)this.active.paintMany(ids,p);else for(const id of ids)this.active.paint(id,p,point,reduced);}
  hitTest(point:Point,assist=true){return this.active.hitTest(point,assist);}
  getRegionPoint(id:string){return this.active.getRegionPoint(id);}
  getPaints(){return this.active.getPaints();}
  getMetrics(){return this.active.getMetrics();}
  renderSnapshot(width?:number){return this.active.renderSnapshot(width);}
  exportPng(){return this.active.exportPng();}
  exportThumbnail(width?:number){return this.active.exportThumbnail(width);}
  dispose(){this.active.dispose();}
}
