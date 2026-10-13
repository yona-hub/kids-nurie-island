import type {PaintingProfile} from '../../shared-types/src/index';
import type {MediumImages} from './storybook-texture';
import {loadSceneImage} from './canvas';

/** Named assets keep optional iris/form images consistent on every surface. */
export async function loadPaintingMedia(profile:PaintingProfile,signal?:AbortSignal):Promise<MediumImages>{
  const entries=await Promise.all(Object.entries(profile.mediumAssets).map(async([name,url])=>[name,await loadSceneImage(url,signal)] as const));
  return Object.fromEntries(entries) as unknown as MediumImages;
}
