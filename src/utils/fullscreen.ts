export function requestFullscreenMode() {
  try {
    const docEl = document.documentElement as any;
    if (docEl.requestFullscreen) {
      docEl.requestFullscreen().catch((err: any) => {
        // May be rejected if in restrictive iframe or blocked by browser policy
        console.log('Fullscreen request not allowed or blocked:', err);
      });
    } else if (docEl.webkitRequestFullscreen) {
      docEl.webkitRequestFullscreen();
    } else if (docEl.msRequestFullscreen) {
      docEl.msRequestFullscreen();
    }
  } catch (e) {
    console.log('Fullscreen request exception:', e);
  }
}

export function exitFullscreenMode() {
  try {
    const doc = document as any;
    if (document.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement) {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      } else if (doc.msExitFullscreen) {
        doc.msExitFullscreen();
      }
    }
  } catch (e) {
    console.log('Exit fullscreen exception:', e);
  }
}

export function toggleFullscreenMode() {
  const doc = document as any;
  if (document.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement) {
    exitFullscreenMode();
  } else {
    requestFullscreenMode();
  }
}

export function isCurrentlyFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as any;
  return Boolean(document.fullscreenElement || doc.webkitFullscreenElement || doc.msFullscreenElement);
}
