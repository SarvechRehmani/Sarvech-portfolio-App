/** Route-owned resources. Nothing is patched on window or DOM prototypes. */
export function createRuntimeScope() {
  let destroyed = false;
  const cleanups = [];
  const timers = new Set();
  const intervals = new Set();
  const frames = new Set();
  return {
    listen(target, event, listener, options) {
      target.addEventListener(event, listener, options);
      cleanups.push(() => target.removeEventListener(event, listener, options));
    },
    observe(observer) {
      cleanups.push(() => observer.disconnect());
      return observer;
    },
    setTimeout(callback, delay, ...args) {
      const id = window.setTimeout(() => {
        timers.delete(id);
        if (!destroyed) callback(...args);
      }, delay);
      timers.add(id);
      return id;
    },
    setInterval(callback, delay, ...args) {
      const id = window.setInterval(() => {
        if (!destroyed) callback(...args);
      }, delay);
      intervals.add(id);
      return id;
    },
    requestAnimationFrame(callback) {
      if (destroyed) return 0;
      const id = window.requestAnimationFrame((time) => {
        frames.delete(id);
        if (!destroyed) callback(time);
      });
      frames.add(id);
      return id;
    },
    destroy() {
      destroyed = true;
      cleanups.forEach((cleanup) => cleanup());
      timers.forEach((id) => window.clearTimeout(id));
      intervals.forEach((id) => window.clearInterval(id));
      frames.forEach((id) => window.cancelAnimationFrame(id));
    },
  };
}
