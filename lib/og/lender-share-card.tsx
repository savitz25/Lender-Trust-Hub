import type { LenderShareCardModel } from '@/lib/seo/share-card-model';
import { NETWORK_OG_SIZE, renderNetworkShareImage } from './network-share-card';

export const LENDER_OG_SIZE = NETWORK_OG_SIZE;
export const LENDER_OG_CONTENT_TYPE = 'image/png';
const CONFIG = { hub: 'LENDER TRUST HUB', descriptor: 'Independent Lending Research', domain: 'lendertrusthub.com', accent: '#0D9488' };

export function renderLenderShareImage(model: LenderShareCardModel) {
  return renderNetworkShareImage(CONFIG, model);
}

export function renderLenderFallbackImage() {
  return renderNetworkShareImage(CONFIG);
}
