import { useEffect } from 'react';

const SUFFIX = 'Mind Matter';

/** Sets the document title for a route and restores it on unmount. */
export function useDocumentTitle(title?: string) {
  useEffect(() => {
    if (!title) return;
    const previous = document.title;
    document.title = `${title} — ${SUFFIX}`;
    return () => {
      document.title = previous;
    };
  }, [title]);
}
