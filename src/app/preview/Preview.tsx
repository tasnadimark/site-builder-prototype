'use client';

import { useMemo, useState } from 'react';
import { createImageStore } from '@/editor/images';
import { Site } from '@/site/render/Site';
import { parseDoc } from '@/site/schema';

/**
 * A site as a visitor would see it: the renderer alone, full width, links working.
 * "firstOnly" keeps just the first section of each page, which is enough to look at
 * first screens without generating every picture further down.
 */
export default function Preview({ doc, page, firstOnly = false }: { doc: unknown; page: string; firstOnly?: boolean }) {
  const site = useMemo(() => {
    const parsed = parseDoc(doc);
    return firstOnly ? { ...parsed, pages: parsed.pages.map((p) => ({ ...p, sections: p.sections.slice(0, 1) })) } : parsed;
  }, [doc, firstOnly]);
  const images = useMemo(() => createImageStore(), []);
  const [pageId, setPageId] = useState(page);

  return (
    <>
      <style>{'html, body { margin: 0; }'}</style>
      <Site
        doc={site}
        pageId={pageId}
        images={images}
        onNavigate={(id) => {
          setPageId(id);
          window.scrollTo({ top: 0 });
        }}
      />
    </>
  );
}
