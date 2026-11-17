'use client';

// Hero styles. Each one arranges the same things a hero already has (heading, eyebrow,
// body, buttons, picture, blocks), so switching style never loses or needs new content.

import { ArrowRight } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import type { Effective } from '../plan';
import type { Action, Section } from '../schema';
import type { Path } from './context';
import { Btn, Pic, Txt, useLink } from './parts';

type Props = {
  s: Section;
  e: Effective;
  /** The eyebrow's running number. */
  n: string;
  /** The section's blocks, already laid out. */
  blocks: ReactNode;
  /** The ordinary intro, for styles that keep it as it is. */
  intro: ReactNode;
};

function Buttons({ s }: { s: Section }) {
  if (!s.intro.actions.length) return null;
  return (
    <div className="actions">
      {s.intro.actions.map((a, k) => (
        <Btn key={k} action={a} path={['section', s.id, 'intro', 'actions', k, 'label']} />
      ))}
    </div>
  );
}

/** One cell of the link bar that closes a wordmark hero. */
function BarLink({ action, path }: { action: Action; path: Path }) {
  const link = useLink(action.href);
  return (
    <a className="hero-bar-cell" {...link}>
      <Txt value={action.label} path={path} />
      <ArrowRight size={20} strokeWidth={1.6} aria-hidden />
    </a>
  );
}

export function HeroView({ s, e, n, blocks, intro }: Props) {
  const i = s.intro;
  const base: Path = ['section', s.id, 'intro'];
  const heading = i.heading ?? '';
  const hasBlocks = s.blocks.length > 0;
  const eyebrow = i.eyebrow && <Txt as="p" className="eyebrow" value={i.eyebrow} path={[...base, 'eyebrow']} data-n={n} />;
  const picture = s.media && <Pic image={s.media} className="is-media" />;

  // A very large heading runs the full width and overlaps the top of a tall picture.
  if (e.hero === 'overlap') {
    return (
      <div className="hero-overlap" data-flip={s.layout.flip || undefined}>
        <Txt as="h1" className="h1 hero-giant" rich fit="giant" value={heading} path={[...base, 'heading']} />
        <div className="hero-overlap-media sec-media">{picture}</div>
        <div className="hero-copy">
          {eyebrow}
          {i.body && <Txt as="p" className="lead" value={i.body} path={[...base, 'body']} />}
          <Buttons s={s} />
          {hasBlocks && blocks}
        </div>
      </div>
    );
  }

  // The heading as one giant word, the picture in the middle of it, notes either side,
  // and the buttons as a bar of links along the bottom.
  if (e.hero === 'wordmark') {
    return (
      <div className="hero-wordmark">
        <Txt as="h1" className="h1 hero-giant" rich fit="line" value={heading} path={[...base, 'heading']} />
        <div className="hero-wordmark-row">
          <div className="hero-side">{i.eyebrow && <Txt as="p" value={i.eyebrow} path={[...base, 'eyebrow']} />}</div>
          <div className="hero-wordmark-media sec-media">{picture}</div>
          <div className="hero-side">{i.body && <Txt as="p" value={i.body} path={[...base, 'body']} />}</div>
        </div>
        {hasBlocks && <div className="hero-wordmark-blocks">{blocks}</div>}
        {i.actions.length > 0 && (
          <div className="hero-bar" style={{ '--cells': i.actions.length } as CSSProperties}>
            {i.actions.map((a, k) => (
              <BarLink key={k} action={a} path={[...base, 'actions', k, 'label']} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // A full photo with a short statement top-left. The heading itself is the moving line (HeroTicker).
  if (e.hero === 'ticker') {
    return (
      <div className="hero-copy hero-ticker-copy">
        {eyebrow}
        {i.body && <Txt as="p" className="hero-statement" value={i.body} path={[...base, 'body']} />}
        <Buttons s={s} />
        {hasBlocks && blocks}
      </div>
    );
  }

  // Copy on one side, a picture that runs to the edge of the screen on the other.
  return (
    <div className="hero-edge" data-flip={s.layout.flip || undefined}>
      <div className="hero-edge-copy">
        {intro}
        {hasBlocks && blocks}
      </div>
      <div className="hero-edge-media">{s.media && <Pic image={s.media} />}</div>
    </div>
  );
}

/** The heading as one giant line drifting along the bottom of the section. */
export function HeroTicker({ s }: { s: Section }) {
  const text = s.intro.heading ?? '';
  const plain = text.replace(/\*/g, '');
  const dur = `${Math.max(16, Math.round(plain.length * 1.3))}s`;
  const copy = (
    <>
      <span className="sep" aria-hidden>
        ✦
      </span>
      <span aria-hidden>{plain}</span>
      <span className="sep" aria-hidden>
        ✦
      </span>
    </>
  );
  return (
    <div className="hero-ticker">
      <div className="marquee-track" style={{ '--dur': dur } as CSSProperties}>
        <div className="hero-ticker-group">
          {/* The first copy is the real heading, so it can be read out and edited. */}
          <Txt as="h1" rich fit={false} value={text} path={['section', s.id, 'intro', 'heading']} />
          {copy}
        </div>
        <div className="hero-ticker-group" aria-hidden inert>
          <span>{plain}</span>
          {copy}
        </div>
      </div>
    </div>
  );
}
