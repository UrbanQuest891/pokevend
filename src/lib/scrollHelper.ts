/**
 * scrollHelper.ts
 * Cross-platform smooth scrolling utility optimized for desktop and mobile browsers
 * (iOS Safari, Android Chrome, Samsung Internet, Firefox, Desktop browsers).
 * Ensures smooth glide to content top during page transitions even across local network previews.
 */

export function smoothScrollToElement(element: HTMLElement | null, offset = 75): void {
  if (typeof window === 'undefined') return;

  const performScroll = () => {
    let targetY = 0;

    if (element) {
      const rect = element.getBoundingClientRect();
      const currentScrollY =
        window.pageYOffset ||
        window.scrollY ||
        document.documentElement.scrollTop ||
        document.body.scrollTop ||
        0;
      targetY = Math.max(0, currentScrollY + rect.top - offset);
    }

    // 1. Primary window.scrollTo with smooth behavior
    try {
      window.scrollTo({
        top: targetY,
        behavior: 'smooth',
      });
    } catch {
      window.scrollTo(0, targetY);
    }

    // 2. Mobile root scrollingElement fallback
    const scrollRoot = document.scrollingElement || document.documentElement || document.body;
    if (scrollRoot && typeof scrollRoot.scrollTo === 'function') {
      try {
        scrollRoot.scrollTo({
          top: targetY,
          behavior: 'smooth',
        });
      } catch {
        scrollRoot.scrollTop = targetY;
      }
    }

    // 3. scrollIntoView fallback with block start
    if (element && typeof element.scrollIntoView === 'function') {
      try {
        element.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });
      } catch {
        // ignore fallback errors
      }
    }
  };

  // Run immediately within user touch/click gesture context
  performScroll();

  // Re-run after next frame when React has updated DOM layout and slots
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => {
      setTimeout(performScroll, 40);
    });
  } else {
    setTimeout(performScroll, 50);
  }
}
