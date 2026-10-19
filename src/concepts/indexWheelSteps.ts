import { freezePageScroll, pageScrollTarget, setPageScroll } from '../scroll/pageScroll';

export type IndexWheelStep = 0 | 1 | 2;
export type IndexWheelBounds = { start: number; travel: number };
type Options = { getBounds: () => IndexWheelBounds | null; enabled: () => boolean };
type Direction = -1 | 1;
type Tween = {
  from: number;
  to: number;
  target: IndexWheelStep;
  direction: Direction;
  bounds: IndexWheelBounds;
  startedAt: number;
  duration: number;
  initialVelocity: number;
  cruiseVelocity: number;
  rampDuration: number;
};

const STEP_DURATION = 750;
const QUIET_GAP = 220;
const EDGE_EPSILON = 1;
const REVERSE_CONFIRM_WINDOW = 2600;

/** Integrate a short smooth velocity change, then continue at a constant pace.
 * The native timeline eases each complete visual step. On interruption we keep
 * the current velocity, so a reverse gesture brakes before changing direction.
 */
function sampleTween(tween: Tween, now: number) {
  const elapsed = Math.max(0, now - tween.startedAt);
  if (elapsed >= tween.duration) return { position: tween.to, velocity: 0 };
  const { initialVelocity: v0, cruiseVelocity: v1, rampDuration: ramp } = tween;
  if (ramp && elapsed < ramp) {
    const u = elapsed / ramp;
    return {
      position: tween.from + v0 * elapsed + (v1 - v0) * ramp * (u ** 3 - .5 * u ** 4),
      velocity: v0 + (v1 - v0) * (3 * u ** 2 - 2 * u ** 3),
    };
  }
  return { position: tween.from + (v0 + v1) * ramp / 2 + v1 * (elapsed - ramp), velocity: v1 };
}

function usableBounds(bounds: IndexWheelBounds | null): bounds is IndexWheelBounds {
  return !!bounds && Number.isFinite(bounds.start) && Number.isFinite(bounds.travel) && bounds.travel > 0;
}

function stepPosition(bounds: IndexWheelBounds, step: IndexWheelStep) {
  return bounds.start + bounds.travel * step / 2;
}

function adjacentStep(bounds: IndexWheelBounds, position: number, direction: Direction): IndexWheelStep | null {
  const steps: IndexWheelStep[] = direction > 0 ? [0, 1, 2] : [2, 1, 0];
  return steps.find(step => direction > 0
    ? stepPosition(bounds, step) > position + EDGE_EPSILON
    : stepPosition(bounds, step) < position - EDGE_EPSILON) ?? null;
}

function isEditable(event: WheelEvent) {
  return event.composedPath().some(target => target instanceof HTMLElement && (
    target.isContentEditable || target.matches('input, textarea, select, [role="textbox"], [role="spinbutton"]')
  ));
}

function hasOpenDialog() {
  return Array.from(document.querySelectorAll<HTMLElement>('dialog[open], [role="dialog"]')).some(dialog => {
    if (dialog.closest('[hidden], [aria-hidden="true"]') || !dialog.getClientRects().length) return false;
    const style = getComputedStyle(dialog);
    return style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
  });
}

function documentScrollIsLocked() {
  const body = getComputedStyle(document.body);
  const root = document.documentElement.style;
  return body.overflowY === 'hidden' || body.overflowY === 'clip'
    || root.overflow === 'hidden' || root.overflowY === 'hidden';
}

/** A nested native scroll region owns its gesture, including its boundary behaviour. */
function hasNestedScroller(event: WheelEvent) {
  for (const target of event.composedPath()) {
    if (target === document.body || target === document.documentElement) break;
    if (!(target instanceof HTMLElement) || target.scrollHeight <= target.clientHeight + 1) continue;
    if (/^(auto|scroll|overlay)$/.test(getComputedStyle(target).overflowY)) return true;
  }
  return false;
}

function wheelPixels(event: WheelEvent) {
  return event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? window.innerHeight : 1);
}

/** Two finite wheel steps. The frame loop only maps elapsed time to scroll writes. */
export function createIndexWheelSteps({ getBounds, enabled }: Options) {
  let destroyed = false;
  let frame = 0;
  let tween: Tween | null = null;
  let queued: IndexWheelStep | null = null;
  let lastWheelAt = -Infinity;
  let residual: { direction: Direction } | null = null;
  let residualTimer: ReturnType<typeof setTimeout> | undefined;
  let reverseArmedUntil = 0;

  const clearResidual = () => {
    if (residualTimer !== undefined) clearTimeout(residualTimer);
    residualTimer = undefined;
    residual = null;
  };
  const scheduleResidualEnd = () => {
    if (residualTimer !== undefined) clearTimeout(residualTimer);
    if (!residual) return;
    const now = performance.now();
    const remaining = lastWheelAt + QUIET_GAP - now;
    if (remaining <= 0) { clearResidual(); return; }
    residualTimer = setTimeout(clearResidual, remaining);
  };
  const stopTween = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    tween = null;
    queued = null;
  };
  const cancel = () => {
    stopTween();
    clearResidual();
    lastWheelAt = -Infinity;
    reverseArmedUntil = 0;
  };

  const begin = (from: number, target: IndexWheelStep, bounds: IndexWheelBounds, velocity?: number) => {
    freezePageScroll();
    clearResidual();
    if (target < 2) reverseArmedUntil = 0;
    const to = stepPosition(bounds, target);
    if (Math.abs(to - from) <= EDGE_EPSILON) {
      setPageScroll(to);
      return;
    }
    const speed = Math.max(bounds.travel / 2 / STEP_DURATION, Math.abs(to - from) / 1500);
    const cruiseVelocity = Math.sign(to - from) * speed;
    const initialVelocity = velocity ?? cruiseVelocity;
    const rampDuration = velocity === undefined ? 0 : Math.min(160, Math.abs(to - from) / speed);
    const rampDistance = (initialVelocity + cruiseVelocity) * rampDuration / 2;
    tween = {
      from, to, target, bounds: { ...bounds },
      direction: to > from ? 1 : -1,
      startedAt: performance.now(),
      duration: rampDuration + Math.max(0, (to - from - rampDistance) / cruiseVelocity),
      initialVelocity, cruiseVelocity, rampDuration,
    };
    frame = requestAnimationFrame(tick);
  };

  function tick(now: number) {
    frame = 0;
    const current = tween;
    if (destroyed || !current) return;
    const sample = sampleTween(current, now);
    setPageScroll(sample.position);
    if (now - current.startedAt < current.duration) {
      frame = requestAnimationFrame(tick);
      return;
    }
    const next = queued;
    tween = null;
    queued = null;
    if (next !== null) {
      // The preceding destination is exact: no layout or scroll read is needed.
      begin(current.to, next, current.bounds);
    } else {
      residual = { direction: current.direction };
      scheduleResidualEnd();
    }
  }

  const wheel = (event: WheelEvent) => {
    if (destroyed) return;
    if (!enabled() || event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey
      || !event.deltaY || Math.abs(event.deltaX) > Math.abs(event.deltaY)
      || isEditable(event) || hasOpenDialog() || documentScrollIsLocked() || hasNestedScroller(event)) {
      cancel();
      return;
    }
    const bounds = getBounds();
    if (!usableBounds(bounds)) { cancel(); return; }
    const now = performance.now();
    const quiet = now - lastWheelAt >= QUIET_GAP;
    const direction: Direction = event.deltaY > 0 ? 1 : -1;
    const position = window.scrollY;
    const works = document.getElementById('work');
    if (works && position >= works.getBoundingClientRect().top + position - 1) return;
    lastWheelAt = now;
    if (direction > 0) reverseArmedUntil = 0;

    if (tween) {
      if (direction === tween.direction) {
        event.preventDefault();
        if (quiet && queued === null) {
          const next = tween.target + direction;
          if (next >= 0 && next <= 2) queued = next as IndexWheelStep;
        }
      } else {
        const target = adjacentStep(bounds, position, direction);
        const velocity = sampleTween(tween, now).velocity;
        stopTween();
        if (target !== null) {
          event.preventDefault();
          begin(position, target, bounds, velocity);
        }
        // Outside the transition, an outward wheel belongs to native scrolling.
        // Do not swallow it and leave the page frozen between two positions.
      }
      return;
    }

    const end = bounds.start + bounds.travel;
    const inside = position >= bounds.start - EDGE_EPSILON && position <= end + EDGE_EPSILON;
    const crossingEnd = position > end + EDGE_EPSILON && direction < 0 && pageScrollTarget() + wheelPixels(event) <= end;
    if (!inside && !crossingEnd) { clearResidual(); return; }

    if (residual) {
      if (direction === residual.direction && !quiet) {
        event.preventDefault();
        scheduleResidualEnd();
        return;
      }
      clearResidual();
    }
    if (position <= bounds.start + EDGE_EPSILON && direction < 0
      || position >= end - EDGE_EPSILON && direction > 0) return;

    // At the reading boundary, one upward gesture only arms a return.
    // Inertia keeps extending this gesture; a separate second gesture confirms it.
    if (direction < 0 && (crossingEnd || position >= end - EDGE_EPSILON)) {
      event.preventDefault();
      freezePageScroll();
      const confirmed = quiet && reverseArmedUntil > now;
      if (!confirmed) {
        reverseArmedUntil = now + REVERSE_CONFIRM_WINDOW;
        if (crossingEnd) begin(position, 2, bounds);
        return;
      }
      reverseArmedUntil = 0;
    }

    const target = crossingEnd ? 1 : adjacentStep(bounds, position, direction);
    if (target === null) return;
    event.preventDefault();
    begin(position, target, bounds);
  };

  const keydown = (event: KeyboardEvent) => {
    if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' ', 'Spacebar'].includes(event.key)) cancel();
  };
  const click = (event: MouseEvent) => {
    if (event.composedPath().some(target => target instanceof Element && target.matches('a[href]'))) cancel();
  };
  const visibility = () => { if (document.hidden) cancel(); };

  window.addEventListener('wheel', wheel, { passive: false, capture: true });
  window.addEventListener('keydown', keydown, true);
  window.addEventListener('touchstart', cancel, { passive: true, capture: true });
  window.addEventListener('pointerdown', cancel, { passive: true, capture: true });
  window.addEventListener('resize', cancel, { passive: true });
  document.addEventListener('click', click, true);
  document.addEventListener('visibilitychange', visibility);

  const navigate = (step: IndexWheelStep) => {
    if (destroyed || !enabled() || hasOpenDialog() || documentScrollIsLocked()) return;
    const bounds = getBounds();
    if (!usableBounds(bounds)) return;
    const position = window.scrollY;
    cancel();
    begin(position, step, bounds);
  };
  const destroy = () => {
    if (destroyed) return;
    destroyed = true;
    cancel();
    window.removeEventListener('wheel', wheel, true);
    window.removeEventListener('keydown', keydown, true);
    window.removeEventListener('touchstart', cancel, true);
    window.removeEventListener('pointerdown', cancel, true);
    window.removeEventListener('resize', cancel);
    document.removeEventListener('click', click, true);
    document.removeEventListener('visibilitychange', visibility);
  };

  return { navigate, cancel, destroy };
}

export default createIndexWheelSteps;
