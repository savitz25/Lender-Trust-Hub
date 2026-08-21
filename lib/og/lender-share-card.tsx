import type { ReactNode } from 'react';
import { ImageResponse } from 'next/og';
import type { LenderShareCardModel } from '@/lib/seo/share-card-model';

export const LENDER_OG_SIZE = { width: 1200, height: 630 };

function Frame({ children, accent }: { children: ReactNode; accent: boolean }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '52px 64px',
        background: 'linear-gradient(145deg, #042f2e 0%, #0A2540 55%, #134e4a 100%)',
        color: '#ffffff',
        fontFamily: 'system-ui, Segoe UI, sans-serif',
        position: 'relative',
      }}
    >
      {accent ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: 10,
            background: '#0D9488',
          }}
        />
      ) : null}
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ color: '#5eead4', fontSize: 28, fontWeight: 800 }}>LENDER</span>
          <span style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3 }}>TRUST HUB</span>
        </div>
        <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1, color: '#99f6e4' }}>
          ASK TRUST HUB NETWORK
        </span>
      </div>
      {children}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 20, fontWeight: 700 }}>
        <span style={{ color: '#cbd5e1' }}>Independent consumer research</span>
        <span style={{ color: '#5eead4' }}>lendertrusthub.com</span>
      </div>
    </div>
  );
}

export function renderLenderShareImage(model: LenderShareCardModel) {
  return new ImageResponse(
    (
      <Frame accent={model.kind === 'entity'}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 1020 }}>
          {model.eyebrow ? (
            <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: 2, color: '#5eead4' }}>
              {model.eyebrow}
            </div>
          ) : null}
          <div style={{ fontSize: 54, fontWeight: 800, lineHeight: 1.08 }}>{model.title}</div>
          {model.subtitle ? <div style={{ fontSize: 28, fontWeight: 600 }}>{model.subtitle}</div> : null}
          {model.fact ? <div style={{ fontSize: 22, color: '#cbd5e1' }}>{model.fact}</div> : null}
        </div>
      </Frame>
    ),
    { ...LENDER_OG_SIZE },
  );
}

export function renderLenderFallbackImage() {
  return renderLenderShareImage({
    kind: 'fallback',
    eyebrow: '',
    title: 'Research lenders with better information',
    fact: 'Licensing · products · consumer research',
  });
}
