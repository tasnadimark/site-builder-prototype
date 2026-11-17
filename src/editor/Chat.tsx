'use client';

import { Check, LoaderCircle, PanelLeftClose, Send, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

export type Msg = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
  /** One line per operation the AI sent, and whether it was accepted. */
  notes: { ok: boolean; text: string }[];
  pending?: boolean;
  meta?: string;
};

const SUGGESTIONS = [
  'Turn the selected section into a bento grid',
  'Make the whole site feel more playful',
  'Add a section about gift subscriptions',
  'Rewrite the hero for office managers',
];

type Props = {
  messages: Msg[];
  busy: boolean;
  hasKey: boolean | null;
  selected: string | null;
  onSend(text: string): void;
  onStop(): void;
  onCollapse(): void;
};

export function Chat({ messages, busy, hasKey, selected, onSend, onStop, onCollapse }: Props) {
  const [draft, setDraft] = useState('');
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t);
    setDraft('');
  };

  return (
    <aside className="panel chat">
      <header className="panel-head">
        <h2>AI editor</h2>
        <span className="pill" data-state={hasKey ? 'on' : 'off'}>
          {hasKey === null ? 'checking' : hasKey ? 'connected' : 'demo mode'}
        </span>
        <button type="button" className="icon" onClick={onCollapse} aria-label="Hide the AI editor" title="Hide this panel">
          <PanelLeftClose size={15} />
        </button>
      </header>

      <div className="scroll messages">
        {messages.map((m) => (
          <div key={m.id} className="msg" data-role={m.role}>
            {m.pending && !m.text && (
              <p className="working">
                <LoaderCircle size={14} className="spin" /> Working
              </p>
            )}
            {m.text && <p>{m.text}</p>}
            {m.notes.length > 0 && (
              <ul className="notes">
                {m.notes.map((n, i) => (
                  <li key={i} data-ok={n.ok}>
                    {n.ok ? <Check size={12} /> : <X size={12} />}
                    <span>{n.text}</span>
                  </li>
                ))}
              </ul>
            )}
            {m.meta && <small>{m.meta}</small>}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      <div className="composer">
        {!busy && (
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} type="button" onClick={() => send(s)}>
                {s}
              </button>
            ))}
          </div>
        )}
        {selected && <p className="scope">Editing section: {selected}</p>}
        <div className="input">
          <textarea
            value={draft}
            rows={2}
            placeholder="Describe a change"
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                send(draft);
              }
            }}
          />
          {busy ? (
            <button type="button" className="send" onClick={onStop} aria-label="Stop">
              <Square size={14} />
            </button>
          ) : (
            <button type="button" className="send" onClick={() => send(draft)} disabled={!draft.trim()} aria-label="Send">
              <Send size={15} />
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
