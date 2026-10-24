import { useLayoutEffect } from 'react';

let locks = 0;
let restore: (() => void) | undefined;

// Shared across dialogs and popovers so closing a nested window never unlocks
// the page underneath its parent. Fixing the body also handles mobile browsers.
export function lockPageScroll() {
  if (locks++ === 0) {
    const body = document.body;
    const root = document.documentElement;
    const x = window.scrollX, y = window.scrollY;
    const previous = {
      position: body.style.position, top: body.style.top, left: body.style.left,
      width: body.style.width, overflow: body.style.overflow, paddingRight: body.style.paddingRight,
      rootOverflow: root.style.overflow, rootOverscroll: root.style.overscrollBehavior,
      scrollBehavior: root.style.scrollBehavior,
    };
    const scrollbar = Math.max(0, window.innerWidth - root.clientWidth);
    const padding = parseFloat(getComputedStyle(body).paddingRight) || 0;
    Object.assign(body.style, { position: 'fixed', top: `${-y}px`, left: `${-x}px`, width: '100%', overflow: 'hidden' });
    if (scrollbar) body.style.paddingRight = `${padding + scrollbar}px`;
    root.style.overflow = 'hidden'; root.style.overscrollBehavior = 'none';
    restore = () => {
      Object.assign(body.style, { position: previous.position, top: previous.top, left: previous.left, width: previous.width, overflow: previous.overflow, paddingRight: previous.paddingRight });
      root.style.overflow = previous.rootOverflow;
      root.style.overscrollBehavior = previous.rootOverscroll;
      root.style.scrollBehavior = 'auto';
      window.scrollTo(x, y);
      root.style.scrollBehavior = previous.scrollBehavior;
    };
  }
  let released = false;
  return () => {
    if (released) return;
    released = true;
    if (--locks === 0) { restore?.(); restore = undefined; }
  };
}

export function useModalScrollLock(open: boolean) {
  useLayoutEffect(() => open ? lockPageScroll() : undefined, [open]);
}
